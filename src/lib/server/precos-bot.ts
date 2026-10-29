import { supabaseAdmin } from "./supabase-admin";
import {
  formatBRL,
  intervalosDasFaixas,
  ordenarFaixas,
  type FaixaPreco,
} from "@/lib/faixas-preco";

// Comandos de preço do bot do Telegram (/precos, /faixa, /remover_faixa). Leem
// e gravam faixas_preco — a mesma tabela que o checkout e o totem exibem e o
// create-pix cobra —, então a mudança vale a partir do próximo PIX gerado.
// Só P&B: a impressora é monocromática. A autorização (allowlist de admins)
// fica no webhook, antes de chegar aqui.

const MODO = "PB";
// Trava contra erro de digitação ("/faixa 20 40" querendo R$ 0,40).
const VALOR_MAXIMO_CENTAVOS = 1_000;
const A_PARTIR_DE_MAXIMO = 100_000;

export const USO_PRECOS =
  "Uso:\n/precos\n/faixa <a partir de N páginas> <valor por página>  (ex.: /faixa 20 0,40)\n/remover_faixa <N>";

const ERRO_INTERNO = "❌ Erro interno. Tente novamente em instantes.";

// "0,40", "0.4", "R$1,00" → centavos inteiros, sem passar por float.
export function parseValorReais(texto: string): number | null {
  const limpo = texto.replace(/^R\$/i, "").trim();
  const m = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(limpo);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "0").padEnd(2, "0"));
}

function parseAPartirDe(texto: string | undefined): number | null {
  if (!texto || !/^\d+$/.test(texto)) return null;
  const n = Number(texto);
  return n >= 1 && n <= A_PARTIR_DE_MAXIMO ? n : null;
}

async function lerFaixas(): Promise<FaixaPreco[] | null> {
  const { data, error } = await supabaseAdmin
    .from("faixas_preco")
    .select("a_partir_de, valor_centavos_por_pagina")
    .eq("modo_cor", MODO);
  if (error) {
    console.error("Erro lendo faixas_preco:", error);
    return null;
  }
  return ordenarFaixas((data ?? []) as FaixaPreco[]);
}

export function formatarTabela(faixas: FaixaPreco[]): string {
  const linhas = intervalosDasFaixas(faixas).map(({ de, ate, valorCentavos }) => {
    const intervalo = ate === null ? `${de}+ págs` : `${de} a ${ate} págs`;
    return `• ${intervalo}: ${formatBRL(valorCentavos)}`;
  });
  return (
    `💰 Preços P&B por página\n${linhas.join("\n")}\n` +
    `(conta páginas × cópias; o preço da faixa vale para o pedido todo)`
  );
}

// Faixa maior mais cara que a anterior é quase sempre engano — avisa, mas não
// bloqueia (pode ser intencional).
function avisoDeOrdem(faixas: FaixaPreco[]): string | null {
  const ordenadas = ordenarFaixas(faixas);
  for (let i = 1; i < ordenadas.length; i++) {
    if (ordenadas[i].valor_centavos_por_pagina > ordenadas[i - 1].valor_centavos_por_pagina) {
      return `⚠️ A faixa a partir de ${ordenadas[i].a_partir_de} págs custa mais que a anterior.`;
    }
  }
  return null;
}

async function tabelaAtualizada(prefixo: string): Promise<string> {
  const faixas = await lerFaixas();
  if (!faixas) return `${prefixo}\n(não foi possível reler a tabela)`;
  const aviso = avisoDeOrdem(faixas);
  return [prefixo, formatarTabela(faixas), aviso].filter(Boolean).join("\n\n");
}

export async function responderPrecos(): Promise<string> {
  const faixas = await lerFaixas();
  if (!faixas) return ERRO_INTERNO;
  if (faixas.length === 0) return "❌ Nenhuma faixa de preço cadastrada.";
  return formatarTabela(faixas);
}

// /faixa <N> <valor>: cria ou altera a faixa que vale a partir de N páginas.
// "/faixa 1 <valor>" muda o preço base.
export async function definirFaixa(argumentos: string[], adminId: number): Promise<string> {
  const aPartirDe = parseAPartirDe(argumentos[0]);
  // "/faixa 20 R$ 0,40" chega como ["20", "R$", "0,40"].
  const valor = parseValorReais(argumentos.slice(1).join(""));
  if (aPartirDe === null || valor === null) return USO_PRECOS;
  if (valor < 1 || valor > VALOR_MAXIMO_CENTAVOS) {
    return `❌ O valor por página precisa estar entre R$ 0,01 e ${formatBRL(VALOR_MAXIMO_CENTAVOS)}.`;
  }

  const { error } = await supabaseAdmin.from("faixas_preco").upsert({
    modo_cor: MODO,
    a_partir_de: aPartirDe,
    valor_centavos_por_pagina: valor,
    atualizado_em: new Date().toISOString(),
    atualizado_por: adminId,
  });
  if (error) {
    console.error("Erro gravando faixa de preço:", error);
    return ERRO_INTERNO;
  }

  return tabelaAtualizada(
    `✅ A partir de ${aPartirDe} págs: ${formatBRL(valor)}/página. Vale a partir do próximo pedido.`
  );
}

export async function removerFaixa(argumentos: string[]): Promise<string> {
  const aPartirDe = parseAPartirDe(argumentos[0]);
  if (aPartirDe === null) return USO_PRECOS;
  if (aPartirDe === 1) {
    return "❌ A faixa de 1 página é o preço base e não pode ser removida. Use /faixa 1 <valor> para alterá-la.";
  }

  const { error, count } = await supabaseAdmin
    .from("faixas_preco")
    .delete({ count: "exact" })
    .eq("modo_cor", MODO)
    .eq("a_partir_de", aPartirDe);
  if (error) {
    console.error("Erro removendo faixa de preço:", error);
    return ERRO_INTERNO;
  }
  if (!count) return `❌ Não existe faixa a partir de ${aPartirDe} págs.`;

  return tabelaAtualizada(`✅ Faixa a partir de ${aPartirDe} págs removida.`);
}
