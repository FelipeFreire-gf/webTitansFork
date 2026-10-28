"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchFaixas, formatBRL } from "@/lib/pricing";
import { intervalosDasFaixas } from "@/lib/faixas-preco";
import { KioskOverlay } from "./KioskOverlay";

type Props = {
  onClose: () => void;
};

// "1 a 19 páginas", "100 páginas ou mais".
function rotuloIntervalo(de: number, ate: number | null): string {
  if (ate === null) return `${de} páginas ou mais`;
  if (de === ate) return `${de} ${de === 1 ? "página" : "páginas"}`;
  return `${de} a ${ate} páginas`;
}

// Overlay de preços: lê faixas_preco (a mesma tabela que o create-pix usa para
// cobrar) a cada abertura. A impressora é laser P&B, então só há Preto e branco.
export function OverlayPrecos({ onClose }: Props) {
  const { data: faixas, isLoading, isError } = useQuery({
    queryKey: ["kiosk", "faixas-preco", "PB"],
    queryFn: () => fetchFaixas("PB"),
  });

  const intervalos = faixas ? intervalosDasFaixas(faixas) : [];

  return (
    <KioskOverlay titulo="Preços" onClose={onClose}>
      <p className="mb-6 text-xl text-zinc-400">
        Preto e branco · valor por página impressa.
      </p>

      {isLoading && <p className="text-xl text-zinc-400">Carregando…</p>}
      {isError && (
        <p className="text-xl text-red-300">
          Não foi possível carregar os preços agora.
        </p>
      )}

      {intervalos.length === 1 && (
        <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-5xl font-black text-white">
            {formatBRL(intervalos[0].valorCentavos)}
          </p>
          <p className="mt-1 text-base text-zinc-500">por página</p>
        </div>
      )}

      {intervalos.length > 1 && (
        <>
          <ul className="mx-auto max-w-lg divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
            {intervalos.map((faixa) => (
              <li
                key={faixa.de}
                className="flex items-baseline justify-between gap-4 px-6 py-4"
              >
                <span className="text-2xl text-zinc-200">
                  {rotuloIntervalo(faixa.de, faixa.ate)}
                </span>
                <span className="text-3xl font-black text-white">
                  {formatBRL(faixa.valorCentavos)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-400">
            Conta o total do pedido (páginas × cópias), e o preço da faixa vale
            para todas as páginas.
          </p>
        </>
      )}
    </KioskOverlay>
  );
}
