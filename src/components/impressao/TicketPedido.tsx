import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { AcompanhamentoPedido } from "@/hooks/useAcompanhamentoPedido";
import { formatBRL } from "@/lib/faixas-preco";
import { formatarHorario } from "@/lib/horario";
import { LOCAL_RETIRADA, ROTA_RETIRADA, ROTULO_RETIRADA } from "@/lib/retirada";

type Props = {
  protocolo: string;
  // null enquanto a primeira consulta não volta: os dados aparecem como "—".
  pedido: AcompanhamentoPedido | null;
};

// Comprovante do pedido: protocolo e dados em cima, picote no meio e o canhoto
// colorido com o local de retirada embaixo — o único bloco com gradiente da
// tela de sucesso.
export function TicketPedido({ protocolo, pedido }: Props) {
  const dados = [
    { rotulo: "Páginas", valor: pedido ? String(pedido.totalPaginas) : "—" },
    {
      rotulo: "Valor",
      valor: pedido?.valorCentavos != null ? formatBRL(pedido.valorCentavos) : "—",
    },
    { rotulo: "Pago às", valor: formatarHorario(pedido?.paidAt ?? null) || "—" },
  ];

  return (
    <div
      className="relative rounded-lg border bg-card text-center transition-transform duration-300 has-[a:active]:scale-[.98] has-[a:active]:duration-75"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="px-5 pb-[22px] pt-5">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-muted-foreground">
          Protocolo
        </p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[.12em]">{protocolo}</p>
        <dl className="mt-4 grid grid-cols-3 divide-x border-t pt-3.5">
          {dados.map((d) => (
            <div key={d.rotulo}>
              <dt className="text-xs text-muted-foreground">{d.rotulo}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{d.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Picote: furos na cor do fundo da página e um recorte de cada lado,
          que mostra só a metade de dentro do círculo. */}
      <div aria-hidden="true" className="relative z-[1] h-0">
        <span className="absolute inset-x-4 -top-[1.5px] h-[3px] bg-[repeating-linear-gradient(90deg,hsl(var(--background))_0_5px,transparent_5px_11px)]" />
        <span className="absolute -left-[11px] -top-2.5 h-5 w-5 rounded-full border bg-background [clip-path:inset(0_0_0_50%)]" />
        <span className="absolute -right-[11px] -top-2.5 h-5 w-5 rounded-full border bg-background [clip-path:inset(0_50%_0_0)]" />
      </div>

      <Link
        href={ROTA_RETIRADA}
        className="flex items-center gap-3.5 rounded-b-[calc(var(--radius)_-_1px)] bg-gradient-to-r from-titans-red to-titans-orange px-4 py-[18px] text-left text-white [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          <MapPin className="h-6 w-6" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">{ROTULO_RETIRADA}</span>
          <span className="text-sm text-white/90">{LOCAL_RETIRADA}</span>
        </span>
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-85" />
      </Link>
    </div>
  );
}
