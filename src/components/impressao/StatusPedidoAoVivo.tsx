"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, CircleAlert, MapPin, Printer } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AcompanhamentoPedido } from "@/hooks/useAcompanhamentoPedido";
import { formatarHorario } from "@/lib/horario";
import { LOCAL_RETIRADA_CURTO } from "@/lib/retirada";
import type { StatusPedido } from "@/lib/types";
import { cn } from "@/lib/utils";

type Etapa = "fila" | "imprimindo" | "pronto" | "erro";

function etapaDoStatus(status: StatusPedido): Etapa | null {
  switch (status) {
    case "PAGO":
      return "fila";
    case "IMPRIMINDO":
      return "imprimindo";
    case "IMPRESSO":
      return "pronto";
    case "ERRO":
      return "erro";
    default:
      return null;
  }
}

type EstadoPasso = "feito" | "atual" | "alerta" | "futuro";

const NO_POR_ESTADO: Record<EstadoPasso, string> = {
  feito: "border-green-500/45 bg-green-500/10 text-green-700 dark:text-green-300",
  atual: "border-titans-orange/55 bg-titans-orange/10 text-titans-orange",
  alerta: "border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  futuro: "border-border bg-card text-muted-foreground",
};

const TITULO_POR_ESTADO: Record<EstadoPasso, string> = {
  feito: "text-foreground",
  atual: "text-titans-orange",
  alerta: "text-amber-700 dark:text-amber-300",
  futuro: "text-muted-foreground",
};

type Passo = { estado: EstadoPasso; icone: ReactNode; titulo: string; detalhe: string };

const Ponto = ({ pulsa = false }: { pulsa?: boolean }) => (
  <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full bg-current", pulsa && "animate-pulse")} />
);

// Status ao vivo do pedido, abaixo do ticket: uma linha discreta com o estado
// e só a setinha; ao tocar, abre as etapas (Pago → Imprimindo → Pronto) com os
// horários. Enquanto a primeira consulta não volta, não mostra nada.
export function StatusPedidoAoVivo({ pedido }: { pedido: AcompanhamentoPedido | null }) {
  const [aberto, setAberto] = useState(false);
  const etapa = pedido ? etapaDoStatus(pedido.status) : null;
  if (!pedido || !etapa) return null;

  const pago = formatarHorario(pedido.paidAt);
  const impresso = etapa === "pronto" ? formatarHorario(pedido.printedAt) : "";
  const paginas = `${pedido.totalPaginas} ${pedido.totalPaginas === 1 ? "página" : "páginas"}`;

  const linha: Record<Etapa, { cor: string; icone: ReactNode; texto: string }> = {
    fila: { cor: "text-muted-foreground", icone: <Ponto />, texto: "Na fila de impressão" },
    imprimindo: { cor: "text-titans-orange", icone: <Ponto pulsa />, texto: "Imprimindo agora" },
    pronto: {
      cor: "text-green-700 dark:text-green-300",
      icone: <Check className="h-3.5 w-3.5 shrink-0" />,
      texto: impresso ? `Pronto · impresso às ${impresso}` : "Pronto para retirar",
    },
    erro: {
      cor: "text-amber-700 dark:text-amber-300",
      icone: <CircleAlert className="h-3.5 w-3.5 shrink-0" />,
      texto: "Problema na impressão · fale com a equipe pelo totem",
    },
  };

  const passos: Passo[] = [
    {
      estado: "feito",
      icone: <Check className="h-3.5 w-3.5" />,
      titulo: "Pago",
      detalhe: pago ? `às ${pago}` : "",
    },
    {
      estado: { fila: "futuro", imprimindo: "atual", pronto: "feito", erro: "alerta" }[etapa] as EstadoPasso,
      icone:
        etapa === "pronto" ? (
          <Check className="h-3.5 w-3.5" />
        ) : etapa === "erro" ? (
          <CircleAlert className="h-3.5 w-3.5" />
        ) : (
          <Printer className="h-3.5 w-3.5" />
        ),
      titulo: etapa === "pronto" ? "Impresso" : "Imprimindo",
      detalhe: impresso ? `${paginas} · às ${impresso}` : paginas,
    },
    {
      estado: etapa === "pronto" ? "feito" : "futuro",
      icone: etapa === "pronto" ? <Check className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />,
      titulo: "Pronto para retirar",
      detalhe: LOCAL_RETIRADA_CURTO,
    },
  ];

  const { cor, icone, texto } = linha[etapa];

  return (
    <Collapsible open={aberto} onOpenChange={setAberto} className="rounded-lg bg-muted/35 text-left">
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] leading-5",
          "transition-transform duration-300 [-webkit-tap-highlight-color:transparent] active:scale-[.98] active:duration-75",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <span className={cn("flex items-center gap-1.5 font-semibold", cor)} aria-live="polite">
          {icone}
          {texto}
        </span>
        <span className="sr-only">{aberto ? "Esconder etapas" : "Ver etapas"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            aberto && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ol className="px-3.5 pb-3.5 pt-0.5">
          {passos.map((p, i) => (
            <li key={p.titulo} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-2.5 pb-3 last:pb-0">
              {i < passos.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-1 left-[11px] top-7 w-0.5 rounded",
                    p.estado === "feito" ? "bg-green-500/50" : "bg-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full border",
                  NO_POR_ESTADO[p.estado]
                )}
              >
                {p.icone}
              </span>
              <div>
                <p className={cn("pt-0.5 text-[13px] font-semibold leading-5", TITULO_POR_ESTADO[p.estado])}>
                  {p.titulo}
                </p>
                {p.detalhe && <p className="text-xs text-muted-foreground">{p.detalhe}</p>}
              </div>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
