"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { StatusPedidoAoVivo } from "@/components/impressao/StatusPedidoAoVivo";
import { TicketPedido } from "@/components/impressao/TicketPedido";
import { useAcompanhamentoPedido } from "@/hooks/useAcompanhamentoPedido";
import { protocoloDoPedido } from "@/lib/protocolo";

type Props = {
  pedidoId: string;
  // A tela volta após um reload por alguns minutos (pedido-em-andamento.ts);
  // as duas saídas descartam o pedido guardado para não reabrir esta tela.
  onNovoPedido: () => void;
  onSair: () => void;
};

// Saídas discretas: o destaque da tela é o canhoto do ticket (onde retirar).
const CLASSE_LINK =
  "rounded-md px-1.5 py-2 underline decoration-muted-foreground/45 underline-offset-4 transition-colors " +
  "[-webkit-tap-highlight-color:transparent] active:text-foreground [@media(hover:hover)]:hover:text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TelaSucesso({ pedidoId, onNovoPedido, onSair }: Props) {
  const { pedido } = useAcompanhamentoPedido(pedidoId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-2.5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-green-500" />
        <h2 className="text-xl font-bold">Pagamento confirmado!</h2>
      </div>

      <TicketPedido protocolo={protocoloDoPedido(pedidoId)} pedido={pedido} />

      <StatusPedidoAoVivo pedido={pedido} />

      <p className="text-center text-sm text-muted-foreground">
        Seu pedido entrou na fila de impressão e já deve estar sendo impresso.
        Vá até a sede da TITANS retirá-lo. Entre em contato conosco pelo totem
        caso precise de algum tipo de suporte.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">
        <button type="button" onClick={onNovoPedido} className={CLASSE_LINK}>
          Fazer outro pedido
        </button>
        <span aria-hidden="true">·</span>
        <Link href="/" onClick={onSair} className={CLASSE_LINK}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
