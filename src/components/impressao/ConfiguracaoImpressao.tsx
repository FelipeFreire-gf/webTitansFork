"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { fetchFaixas, formatBRL } from "@/lib/pricing";
import { calcularPreco, proximaFaixa, type FaixaPreco } from "@/lib/faixas-preco";
import type { ModoCor } from "@/lib/types";

// A HP 135w é monocromática, então o checkout oferece apenas P&B.
const MODO_COR: ModoCor = "PB";
const QUANTIDADE_MINIMA = 1;
// Três dígitos: trava contra um zero a mais digitado sem querer.
const QUANTIDADE_MAXIMA = 999;

// O campo guarda o texto digitado e a quantidade é derivada dele: vazio (ou 0)
// vale null enquanto a pessoa digita. Antes o vazio virava 1 a cada tecla, e
// quem apagava o "1" para digitar outro número não conseguia trocar.
function quantidadeDoTexto(texto: string): number | null {
  const parsed = Number.parseInt(texto, 10);
  return Number.isInteger(parsed) && parsed >= QUANTIDADE_MINIMA ? parsed : null;
}

type Props = {
  numPaginas: number;
  // Quantos arquivos o cliente juntou neste pedido. Serve só para o rótulo do
  // total — o cálculo do valor não muda: as páginas já vêm somadas.
  numArquivos: number;
  enviando: boolean;
  onConfirmar: (args: {
    modoCor: ModoCor;
    quantidadeCopias: number;
    valorCentavos: number;
  }) => void;
  onVoltar: () => void;
};

export function ConfiguracaoImpressao({
  numPaginas,
  numArquivos,
  enviando,
  onConfirmar,
  onVoltar,
}: Props) {
  const [faixas, setFaixas] = useState<FaixaPreco[] | null>(null);
  const [textoCopias, setTextoCopias] = useState(String(QUANTIDADE_MINIMA));
  const quantidadeCopias = quantidadeDoTexto(textoCopias);

  function somarCopias(delta: number) {
    const atual = quantidadeCopias ?? QUANTIDADE_MINIMA;
    const nova = Math.min(QUANTIDADE_MAXIMA, Math.max(QUANTIDADE_MINIMA, atual + delta));
    setTextoCopias(String(nova));
  }

  // Busca a cada abertura da tela: uma mudança feita pelo bot vale já no
  // próximo pedido. O valor aqui é estimativa — quem cobra é o create-pix.
  useEffect(() => {
    fetchFaixas(MODO_COR)
      .then(setFaixas)
      .catch(() => toast.error("Não foi possível carregar os preços."));
  }, []);

  const preco =
    faixas && quantidadeCopias !== null
      ? calcularPreco(numPaginas, quantidadeCopias, faixas)
      : null;
  const valor = preco?.valorCentavos ?? null;
  // Com o campo vazio, mostra o preço da faixa base.
  const precoPorPagina =
    preco?.faixa.valor_centavos_por_pagina ?? faixas?.[0]?.valor_centavos_por_pagina;
  const temDescontoPorVolume = (faixas?.length ?? 0) > 1;
  const proxima = preco && faixas ? proximaFaixa(preco.totalPaginas, faixas) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da impressão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Total de páginas
            {numArquivos > 1 && ` (${numArquivos} arquivos juntos)`}
          </p>
          <p className="text-2xl font-semibold">{numPaginas}</p>
        </div>

        <div className="space-y-1">
          <Label>Modo de cor</Label>
          <p className="font-normal">
            Preto e branco
            {precoPorPagina != null && (
              <span className="text-muted-foreground ml-2">
                ({formatBRL(precoPorPagina)}/página)
              </span>
            )}
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="quantidade-copias">Quantidade de cópias</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Diminuir cópias"
              disabled={enviando || (quantidadeCopias ?? QUANTIDADE_MINIMA) <= QUANTIDADE_MINIMA}
              onClick={() => somarCopias(-1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            {/* type="text" + inputMode: o type="number" do celular aceita
                vírgula/sinal e não deixa o campo vazio de forma previsível. */}
            <Input
              id="quantidade-copias"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              className="w-20 text-center"
              value={textoCopias}
              disabled={enviando}
              onChange={(e) =>
                setTextoCopias(
                  e.target.value.replace(/\D/g, "").slice(0, String(QUANTIDADE_MAXIMA).length)
                )
              }
              // Saiu do campo vazio ou zerado: volta ao mínimo.
              onBlur={() => setTextoCopias(String(quantidadeCopias ?? QUANTIDADE_MINIMA))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Aumentar cópias"
              disabled={enviando || (quantidadeCopias ?? 0) >= QUANTIDADE_MAXIMA}
              onClick={() => somarCopias(1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-3xl font-bold text-titans-orange">
              {valor === null ? "—" : formatBRL(valor)}
            </span>
          </div>
          {/* Faixas contam páginas × cópias; o preço da faixa vale para todas. */}
          {temDescontoPorVolume && preco && preco.faixa.a_partir_de > 1 && (
            <p className="text-sm text-muted-foreground text-right">
              Desconto por volume: a partir de {preco.faixa.a_partir_de} páginas
              impressas.
            </p>
          )}
          {temDescontoPorVolume && proxima && (
            <p className="text-sm text-muted-foreground text-right">
              Com {proxima.a_partir_de} páginas impressas ou mais (páginas × cópias),
              sai {formatBRL(proxima.valor_centavos_por_pagina)}/página.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onVoltar} disabled={enviando}>
              Voltar
            </Button>
            <Button
              onClick={() => {
                if (quantidadeCopias === null || valor === null) return;
                onConfirmar({ modoCor: MODO_COR, quantidadeCopias, valorCentavos: valor });
              }}
              disabled={!faixas || enviando || quantidadeCopias === null}
            >
              {enviando ? "Enviando…" : "Pagar com PIX"}
            </Button>
          </div>

          {/* Sair para o app do banco durante o envio congela a aba no
              Android e derruba o upload. */}
          {enviando && (
            <p className="text-sm text-muted-foreground text-center">
              Enviando o arquivo… mantenha esta tela aberta até o QR Code aparecer.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
