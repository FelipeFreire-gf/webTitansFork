import { StorageApiError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const BUCKET = "pdfs-impressao";

// 3 tentativas no total; espera antes da 2ª e da 3ª.
const ESPERAS_MS = [1_000, 3_000];

export const MSG_CONEXAO =
  "Falha no envio, tente novamente. Confira sua internet e mantenha esta tela aberta até o QR Code aparecer.";
const MSG_RECUSADO = "O arquivo foi recusado. Confira se é um PDF de até 30 MB.";

// Falha do checkout já traduzida para o cliente. `codigo` identifica a etapa
// que falhou (ex.: ENVIO-REDE, PIX-500) e aparece no toast — é o que chega no
// print quando alguém reclama, já que o console fica no celular da pessoa.
export class ErroCheckout extends Error {
  readonly codigo: string;
  readonly causa: unknown;

  constructor(mensagem: string, codigo: string, causa?: unknown) {
    super(mensagem);
    this.name = "ErroCheckout";
    this.codigo = codigo;
    this.causa = causa;
  }
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sem resposta HTTP (StorageUnknownError: rede caiu, aba congelada), servidor
// indisponível (5xx) ou timeout/limite de taxa (408/429): outra tentativa pode
// dar certo. Os demais 4xx são recusas (tipo, tamanho, RLS) — repetir não muda
// o resultado.
function valeRepetir(error: Error): boolean {
  if (!(error instanceof StorageApiError)) return true;
  return error.status >= 500 || error.status === 408 || error.status === 429;
}

// O objeto já existe: numa nova tentativa, significa que a anterior chegou ao
// Storage e só a resposta se perdeu. O caminho é único por pedido (UUID), então
// ninguém mais escreveria nele. Versões do Storage respondem 409 ou 400 com
// statusCode "409".
function jaExiste(error: Error): boolean {
  return (
    error instanceof StorageApiError &&
    (error.status === 409 || error.statusCode === "409")
  );
}

function codigoDaFalha(error: Error): string {
  return error instanceof StorageApiError ? `ENVIO-${error.status}` : "ENVIO-REDE";
}

type UADataNavigator = Navigator & {
  userAgentData?: {
    getHighEntropyValues(
      hints: string[]
    ): Promise<{ model?: string; platformVersion?: string }>;
  };
};

// O Chrome do Android reduz o user-agent a "Android 10; K", sem o modelo; as
// Client Hints de alta entropia ainda o expõem. Safari/Firefox não têm a API.
async function dadosDoAparelho(): Promise<{
  modelo: string | null;
  versao_plataforma: string | null;
}> {
  try {
    const valores = await (navigator as UADataNavigator).userAgentData?.getHighEntropyValues([
      "model",
      "platformVersion",
    ]);
    return {
      modelo: valores?.model || null,
      versao_plataforma: valores?.platformVersion || null,
    };
  } catch {
    return { modelo: null, versao_plataforma: null };
  }
}

// "StorageUnknownError: Failed to fetch" diz pouco; o erro de rede original
// (originalError) é o que distingue "Failed to fetch" de "Load failed" etc.
function mensagemDaCausa(causa: unknown): string | null {
  if (causa == null) return null;
  const partes: string[] = [];
  if (causa instanceof Error) partes.push(`${causa.name}: ${causa.message}`);
  else partes.push(String(causa));
  const original = (causa as { originalError?: unknown }).originalError;
  if (original instanceof Error) partes.push(`${original.name}: ${original.message}`);
  return partes.join(" | ").slice(0, 300);
}

// Registra uma falha do checkout em falhas_checkout, para achar padrões por
// aparelho (ex.: Xiaomi). Best-effort: não espera, não lança, não atrasa o toast.
// `tentativa` marca as falhas de upload que ainda serão repetidas.
export function registrarFalha(falha: {
  codigo: string;
  causa?: unknown;
  tamanhoBytes?: number;
  numPaginas?: number;
  tentativa?: number;
}): void {
  void (async () => {
    try {
      await fetch("/api/telemetria/falha-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sobrevive a uma troca de página logo depois da falha.
        keepalive: true,
        body: JSON.stringify({
          codigo: falha.codigo,
          mensagem: mensagemDaCausa(falha.causa),
          tentativa: falha.tentativa,
          tamanho_bytes: falha.tamanhoBytes,
          num_paginas: falha.numPaginas,
          ...(await dadosDoAparelho()),
        }),
      });
    } catch {
      // Telemetria nunca atrapalha o checkout.
    }
  })();
}

// Sobe o PDF do pedido, repetindo só as falhas transitórias. O mesmo pdfPath é
// reusado entre as tentativas e upsert=false impede sobrescrita (anon só tem
// INSERT no bucket), então repetir nunca duplica nem troca o arquivo.
export async function enviarPDF(pdfPath: string, file: File): Promise<void> {
  for (let tentativa = 0; ; tentativa++) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(pdfPath, file, { contentType: "application/pdf", upsert: false });
    if (!error) return;
    if (tentativa > 0 && jaExiste(error)) return;

    const codigo = codigoDaFalha(error);
    if (!valeRepetir(error)) throw new ErroCheckout(MSG_RECUSADO, codigo, error);
    if (tentativa >= ESPERAS_MS.length) throw new ErroCheckout(MSG_CONEXAO, codigo, error);

    console.warn(
      `Upload do PDF falhou (${codigo}); nova tentativa em ${ESPERAS_MS[tentativa]} ms`,
      error
    );
    registrarFalha({ codigo, causa: error, tamanhoBytes: file.size, tentativa: tentativa + 1 });
    await esperar(ESPERAS_MS[tentativa]);
  }
}
