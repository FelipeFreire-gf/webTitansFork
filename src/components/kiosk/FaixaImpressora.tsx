"use client";

import { Printer } from "lucide-react";
import { faixaImpressora } from "@/lib/impressora";
import type { EstadoImpressora } from "@/hooks/useImpressoraStatus";

type Props = {
  estado: EstadoImpressora | null;
  offline: boolean;
};

// Faixa sempre visível com o estado da impressora, em texto amigável ao cliente.
// O nível de toner não aparece aqui: o aviso de toner baixo vai só para a
// equipe (Telegram); o público vê apenas o estado SEM_TONER quando esgota.
export function FaixaImpressora({ estado, offline }: Props) {
  const faixa = faixaImpressora(estado, offline);
  return (
    <div
      className={`flex items-center justify-center gap-3 rounded-2xl border px-5 py-3 text-xl font-semibold ${faixa.classe}`}
    >
      <Printer className={`h-6 w-6 ${faixa.ativa ? "animate-pulse" : ""}`} />
      {faixa.texto}
    </div>
  );
}
