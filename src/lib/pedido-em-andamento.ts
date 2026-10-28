// Pedido com PIX gerado, guardado no aparelho para sobreviver a um reload. O
// celular (e mais ainda o navegador interno do Instagram) descarta a aba
// enquanto o cliente está no app do banco; sem isto a página volta ao upload e
// o cliente nunca vê o protocolo, mesmo com o pedido pago e impresso.
// localStorage pode lançar (aba anônima, webview restrito): toda falha cai no
// fluxo normal, sem retomada.

const CHAVE = "titans:impressao:pedido-em-andamento";

// Depois do sucesso, um reload ainda mostra o protocolo por este tempo; passado
// isso, quem abre /impressao quer um pedido novo.
const SUCESSO_VISIVEL_MS = 15 * 60 * 1000;

// Resposta do /api/payments/create-pix.
export type DadosPagamento = {
  qr_code_base64: string;
  qr_code_copia_cola: string;
  expiration_date_to: string | null;
  mp_payment_id: string;
  // Valor e contagem autoritativos calculados pelo servidor (create-pix).
  valor_centavos: number;
  num_paginas: number;
};

export type PedidoEmAndamento = {
  pedidoId: string;
  pagamento: DadosPagamento;
  // Epoch ms em que o pagamento foi confirmado nesta tela; null enquanto aguarda.
  concluidoEm: number | null;
};

export function salvarPedidoEmAndamento(pedido: PedidoEmAndamento): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(pedido));
  } catch {
    // Sem armazenamento: o checkout segue, só não retoma após reload.
  }
}

export function lerPedidoEmAndamento(): PedidoEmAndamento | null {
  let pedido: PedidoEmAndamento;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    pedido = JSON.parse(bruto) as PedidoEmAndamento;
  } catch {
    return null;
  }

  const valido =
    typeof pedido?.pedidoId === "string" &&
    typeof pedido.pagamento?.qr_code_base64 === "string" &&
    typeof pedido.pagamento.valor_centavos === "number";
  const sucessoVencido =
    pedido?.concluidoEm != null && Date.now() - pedido.concluidoEm > SUCESSO_VISIVEL_MS;
  if (!valido || sucessoVencido) {
    limparPedidoEmAndamento();
    return null;
  }
  return pedido;
}

export function marcarPedidoConcluido(): void {
  const pedido = lerPedidoEmAndamento();
  if (pedido) salvarPedidoEmAndamento({ ...pedido, concluidoEm: Date.now() });
}

export function limparPedidoEmAndamento(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // Nada a limpar se o armazenamento está indisponível.
  }
}

// O QR ainda pode ser pago? Sem data de expiração conhecida, trata como válido
// — a própria TelaPagamento encerra pelo status.
export function pixAindaValido(pagamento: DadosPagamento): boolean {
  if (!pagamento.expiration_date_to) return true;
  const expMs = new Date(pagamento.expiration_date_to).getTime();
  return !Number.isFinite(expMs) || expMs > Date.now();
}
