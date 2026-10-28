import { supabaseAdmin } from "@/lib/server/supabase-admin";
import { excedeuLimite, ipDoRequest } from "@/lib/server/rate-limit";

// Registro de falhas do checkout de impressão (tabela falhas_checkout, 0013).
// Server-side (service_role): a tabela não tem policy anon. Telemetria
// best-effort — o cliente nunca espera nem trata a resposta.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODIGO_RE = /^[A-Z]+(-[A-Z0-9]+)?$/;

// Folgado de propósito: na rede da UnB muitos alunos saem pelo mesmo IP.
const RATE_LIMIT_TENTATIVAS = 30;
const RATE_LIMIT_JANELA_MS = 10 * 60 * 1000;

function texto(valor: unknown, max: number): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor.slice(0, max) : null;
}

function naoNegativo(valor: unknown): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 ? valor : null;
}

export async function POST(req: Request) {
  if (excedeuLimite(`telemetria-checkout:${ipDoRequest(req)}`, RATE_LIMIT_TENTATIVAS, RATE_LIMIT_JANELA_MS)) {
    return new Response(null, { status: 204 });
  }

  const body = (await req.json().catch(() => undefined)) as
    | Record<string, unknown>
    | undefined;

  const codigo = body?.codigo;
  if (typeof codigo !== "string" || codigo.length > 32 || !CODIGO_RE.test(codigo)) {
    return Response.json({ error: "codigo inválido" }, { status: 400 });
  }

  const tentativa = naoNegativo(body?.tentativa);
  const { error } = await supabaseAdmin.from("falhas_checkout").insert({
    codigo,
    mensagem: texto(body?.mensagem, 300),
    tentativa: tentativa && tentativa >= 1 ? tentativa : null,
    // Do header, não do corpo: é o que o navegador de fato enviou.
    user_agent: texto(req.headers.get("user-agent"), 512),
    modelo: texto(body?.modelo, 100),
    versao_plataforma: texto(body?.versao_plataforma, 50),
    tamanho_bytes: naoNegativo(body?.tamanho_bytes),
    num_paginas: naoNegativo(body?.num_paginas),
  });
  if (error) console.error("Erro registrando falha de checkout:", error);

  return new Response(null, { status: 204 });
}
