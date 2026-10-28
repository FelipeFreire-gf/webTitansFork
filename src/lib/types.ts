export type ModoCor = "PB" | "COLORIDO";

export type StatusPedido =
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "IMPRIMINDO"
  | "IMPRESSO"
  | "ERRO"
  | "CANCELADO";

// Status que só existem depois de o PIX ser aprovado. Comparar só com "PAGO"
// perde o pagamento quando o worker já avançou o pedido antes de o cliente
// consultar — comum no celular, com a aba suspensa durante o app do banco.
const STATUS_POS_PAGAMENTO: ReadonlySet<StatusPedido> = new Set<StatusPedido>([
  "PAGO",
  "IMPRIMINDO",
  "IMPRESSO",
  "ERRO",
]);

export function pagamentoConfirmado(status: StatusPedido | null | undefined): boolean {
  return status != null && STATUS_POS_PAGAMENTO.has(status);
}

export type Pedido = {
  id: string;
  created_at: string;
  pdf_path: string;
  num_paginas: number;
  quantidade_copias: number;
  modo_cor: ModoCor;
  valor_centavos: number;
  status: StatusPedido;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  paid_at: string | null;
  printed_at: string | null;
};

export type Precos = Record<ModoCor, number>;
