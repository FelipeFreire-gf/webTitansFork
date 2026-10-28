"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { pagamentoConfirmado, type StatusPedido } from "@/lib/types";

type Resultado = {
  // Pagamento aprovado — o pedido pode já estar IMPRIMINDO ou IMPRESSO.
  pago: boolean;
  isLoading: boolean;
  error: "TIMEOUT" | "CANCELADO" | "FETCH" | null;
};

// A janela de acompanhamento dura até a expiração real do QR
// (expiration_date_to): única fonte de verdade, sem corte fixo.
export function usePedidoStatus(
  pedidoId: string | null,
  expirationDateTo?: string | null
): Resultado {
  const [realtimeStatus, setRealtimeStatus] = useState<StatusPedido | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const expMs = expirationDateTo ? new Date(expirationDateTo).getTime() : NaN;

  useEffect(() => {
    setTimedOut(false);
    if (!pedidoId || !Number.isFinite(expMs)) return;
    const restante = expMs - Date.now();
    if (restante <= 0) {
      setTimedOut(true);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), restante);
    return () => clearTimeout(timer);
  }, [pedidoId, expMs]);

  useEffect(() => {
    if (!pedidoId) return;
    const channel = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "fila_impressao",
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => {
          const novo = (payload.new as { status?: StatusPedido }).status;
          if (novo) setRealtimeStatus(novo);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pedidoId]);

  // O Realtime cai com a aba em segundo plano; o polling (que o React Query
  // também dispara ao voltar para a aba) cobre o retorno do app do banco.
  const pagoRealtime = pagamentoConfirmado(realtimeStatus);
  const query = useQuery({
    queryKey: ["pedido-status", pedidoId],
    enabled: !!pedidoId && !pagoRealtime,
    refetchInterval: (q) => {
      const ultimo = q.state.data;
      if (pagamentoConfirmado(ultimo) || ultimo === "CANCELADO") return false;
      // Expirado: para depois da primeira consulta pós-expiração (abaixo).
      if (timedOut && q.state.dataUpdatedAt >= expMs) return false;
      return 5000;
    },
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fila_impressao")
        .select("status")
        .eq("id", pedidoId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.status ?? null) as StatusPedido | null;
    },
  });

  // Pago e cancelado são finais: basta uma das fontes ver. O Realtime pode ter
  // guardado um status antigo enquanto o polling já viu o pedido avançar, e
  // vice-versa.
  const pago = pagoRealtime || pagamentoConfirmado(query.data);
  const cancelado = realtimeStatus === "CANCELADO" || query.data === "CANCELADO";

  // Ao voltar com o QR já expirado, o timer dispara antes do refetch e o cache
  // ainda diz AGUARDANDO_PAGAMENTO. Só declara TIMEOUT com uma consulta feita
  // depois da expiração.
  const consultouAposExpirar = query.dataUpdatedAt >= expMs;

  let error: Resultado["error"] = null;
  if (!pago) {
    if (cancelado) error = "CANCELADO";
    else if (timedOut && consultouAposExpirar) error = "TIMEOUT";
    else if (query.isError) error = "FETCH";
  }

  return {
    pago,
    isLoading: query.isLoading && realtimeStatus === null,
    error,
  };
}
