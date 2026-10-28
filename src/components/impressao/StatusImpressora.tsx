"use client";

import { Printer } from "lucide-react";
import { useImpressoraStatus } from "@/hooks/useImpressoraStatus";
import { faixaImpressora, type TomImpressora } from "@/lib/impressora";

// Cores por tom compatíveis com os temas claro e escuro do site (a paleta em
// `faixa.classe` é a do kiosk, afinada só para fundo escuro).
const CLASSES_POR_TOM: Record<TomImpressora, string> = {
  ok: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  imprimindo:
    "border-titans-orange/40 bg-titans-orange/10 text-titans-orange",
  atencao:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  erro: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
};

// Faixa compacta com o estado atual da impressora (mesma fonte do kiosk),
// para o membro ver antes de pagar. Informativa: não bloqueia o checkout.
// Não renderiza nada durante o primeiro carregamento, evitando flash de
// "offline" antes do primeiro fetch. O nível de toner não é exibido ao público
// (o aviso de toner baixo vai só para a equipe, via Telegram).
export function StatusImpressora({ className = "" }: { className?: string }) {
  const { estado, offline, isLoading } = useImpressoraStatus();
  if (isLoading) return null;

  const faixa = faixaImpressora(estado, offline);
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${CLASSES_POR_TOM[faixa.tom]} ${className}`}
    >
      <Printer
        className={`h-4 w-4 shrink-0 ${faixa.ativa ? "animate-pulse" : ""}`}
      />
      {faixa.texto}
    </div>
  );
}
