import {
  formatBRL,
  intervalosDasFaixas,
  posicaoNaRegua,
  type FaixaPreco,
} from "@/lib/faixas-preco";
import { cn } from "@/lib/utils";

type Props = {
  faixas: FaixaPreco[];
  // Páginas impressas (páginas × cópias); null enquanto o campo de cópias está
  // vazio — a régua aparece sem marcador.
  totalPaginas: number | null;
  className?: string;
};

// Vão entre os segmentos (gap-1); entra na conta da posição do marcador.
const VAO_PX = 4;

// Régua das faixas de preço do checkout: um segmento por faixa, preenchido até
// o total impresso, com um balão "N páginas" sobre o marcador e o preço de
// cada faixa embaixo. Substitui as dicas "Desconto por volume…" e "Com N
// páginas…": a próxima faixa fica à vista na própria régua.
export function ReguaFaixas({ faixas, totalPaginas, className = "" }: Props) {
  const intervalos = intervalosDasFaixas(faixas);
  const n = intervalos.length;
  const posicao = totalPaginas != null ? posicaoNaRegua(totalPaginas, faixas) : null;

  const larguraSegmento = `((100% - ${(n - 1) * VAO_PX}px) / ${n})`;
  const left = posicao
    ? `calc(${posicao.indice} * (${larguraSegmento} + ${VAO_PX}px) + ${posicao.fracao} * ${larguraSegmento})`
    : undefined;

  // Perto das pontas o balão alinha pelo marcador em vez de centralizar, para
  // não sair do card.
  const posicaoGeral = posicao ? (posicao.indice + posicao.fracao) / n : 0;
  const alinhamento = posicaoGeral < 0.12 ? "esquerda" : posicaoGeral > 0.88 ? "direita" : "centro";

  function preenchimento(i: number): string {
    if (!posicao || i > posicao.indice) return "0%";
    if (i < posicao.indice) return "100%";
    return `${(posicao.fracao * 100).toFixed(2)}%`;
  }

  const rotulo = totalPaginas === 1 ? "1 página" : `${totalPaginas} páginas`;

  return (
    <div className={className}>
      {posicao && (
        <p className="sr-only">
          {rotulo} impressas, {formatBRL(intervalos[posicao.indice].valorCentavos)} por página.
        </p>
      )}
      <div aria-hidden="true">
        <div className="relative mt-9 flex h-1 gap-1">
          {intervalos.map((f, i) => (
            <div key={f.de} className="flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width,background-color] duration-500 ease-out",
                  i === posicao?.indice ? "bg-foreground" : "bg-muted-foreground/55"
                )}
                style={{ width: preenchimento(i) }}
              />
            </div>
          ))}
          {posicao && (
            <span
              className="absolute top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-foreground ring-[3px] ring-card transition-[left] duration-500 ease-out"
              style={{ left }}
            >
              <span
                className={cn(
                  "absolute bottom-[calc(100%+8px)] whitespace-nowrap rounded-full bg-foreground px-2 text-xs font-bold leading-[18px] text-background tabular-nums",
                  alinhamento === "esquerda" && "left-0",
                  alinhamento === "direita" && "right-0",
                  alinhamento === "centro" && "left-1/2 -translate-x-1/2"
                )}
              >
                {rotulo}
                <span
                  className={cn(
                    "absolute top-full border-4 border-transparent border-t-foreground",
                    alinhamento === "esquerda" && "left-0.5",
                    alinhamento === "direita" && "right-0.5",
                    alinhamento === "centro" && "left-1/2 -ml-1"
                  )}
                />
              </span>
            </span>
          )}
        </div>
        <div
          className="mt-2.5 grid gap-1 text-xs text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {intervalos.map((f, i) => (
            <div
              key={f.de}
              className={cn("flex flex-col transition-colors", i === posicao?.indice && "text-foreground")}
            >
              <span className="text-sm font-semibold">{formatBRL(f.valorCentavos)}</span>
              <span>{f.ate == null ? `${f.de}+` : `${f.de}–${f.ate}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
