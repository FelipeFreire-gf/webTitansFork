"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useImpressoraStatus } from "@/hooks/useImpressoraStatus";
import { faixaImpressora, type TomImpressora } from "@/lib/impressora";
import { LOCAL_RETIRADA_CURTO, ROTA_RETIRADA } from "@/lib/retirada";
import { cn } from "@/lib/utils";

// Cores por tom compatíveis com os temas claro e escuro do site (a paleta em
// `faixa.classe` é a do kiosk, afinada só para fundo escuro).
const CLASSES_POR_TOM: Record<TomImpressora, string> = {
  ok: "bg-green-500/10 text-green-700 dark:text-green-300",
  imprimindo: "bg-titans-orange/10 text-titans-orange",
  atencao: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  erro: "bg-red-500/10 text-red-700 dark:text-red-300",
};

// Topo do checkout: estado da impressora (mesma fonte do kiosk) e o local de
// retirada no mesmo cartão — duas linhas no celular, lado a lado em tela larga.
// Informativo: não bloqueia o checkout. No primeiro carregamento a linha do
// status vira um esqueleto da mesma altura, sem flash de "offline" e sem o
// cartão pular quando o status chega. O nível de toner não é exibido ao público
// (o aviso de toner baixo vai só para a equipe, via Telegram).
export function StatusRetirada({ className = "" }: { className?: string }) {
  const { estado, offline, isLoading } = useImpressoraStatus();
  const faixa = isLoading ? null : faixaImpressora(estado, offline);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card transition-transform duration-300 sm:flex-row sm:divide-x",
        // Toque no local: o cartão inteiro encolhe rápido e volta suave.
        "has-[a:active]:scale-[.98] has-[a:active]:duration-75",
        className
      )}
    >
      {faixa ? (
        <div
          className={cn(
            "flex flex-1 items-center gap-2 px-4 py-2.5 text-sm font-medium",
            CLASSES_POR_TOM[faixa.tom]
          )}
        >
          <Printer className={cn("h-4 w-4 shrink-0", faixa.ativa && "animate-pulse")} />
          {faixa.texto}
        </div>
      ) : (
        <div className="flex flex-1 items-center px-4 py-2.5">
          <Skeleton className="h-5 w-40" />
        </div>
      )}
      <Link
        href={ROTA_RETIRADA}
        className={cn(
          "flex items-center gap-2 border-t px-4 py-2.5 text-sm font-medium transition-colors sm:border-t-0",
          "[-webkit-tap-highlight-color:transparent] active:bg-muted/70 [@media(hover:hover)]:hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        )}
      >
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        {LOCAL_RETIRADA_CURTO}
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground sm:ml-2" />
      </Link>
    </div>
  );
}
