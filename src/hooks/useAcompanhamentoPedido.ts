"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { StatusPedido } from "@/lib/types";

export type AcompanhamentoPedido = {
  status: StatusPedido;
  paidAt: string | null;
  // Só vale com status IMPRESSO: a reimpressão devolve o pedido a PAGO sem
  // limpar o printed_at da impressão anterior.
  printedAt: string | null;
  // Páginas impressas: páginas do PDF × cópias.
  totalPaginas: number;
  valorCentavos: number | null;
};

// Depois do pagamento, a tela de sucesso segue o pedido até sair da
// impressora. O Realtime traz a mudança na hora; o polling cobre o canal caído
// com a aba em segundo plano (e o React Query refaz a consulta ao voltar para
// a aba). IMPRESSO é final. Em ERRO a consulta segue mais devagar, porque a
// equipe pode reimprimir e o pedido volta a PAGO.
export function useAcompanhamentoPedido(pedidoId: string) {
  const query = useQuery({
    queryKey: ["pedido-acompanhamento", pedidoId],
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === "IMPRESSO") return false;
      return status === "ERRO" ? 15_000 : 5_000;
    },
    queryFn: async (): Promise<AcompanhamentoPedido | null> => {
      const { data, error } = await supabase
        .from("fila_impressao")
        .select("status, paid_at, printed_at, num_paginas, quantidade_copias, valor_centavos")
        .eq("id", pedidoId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        status: data.status as StatusPedido,
        paidAt: data.paid_at,
        printedAt: data.printed_at,
        totalPaginas: data.num_paginas * (data.quantidade_copias ?? 1),
        valorCentavos: data.valor_centavos,
      };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`acompanhamento-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "fila_impressao",
          filter: `id=eq.${pedidoId}`,
        },
        () => {
          void query.refetch();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  return { pedido: query.data ?? null, isLoading: query.isLoading };
}
