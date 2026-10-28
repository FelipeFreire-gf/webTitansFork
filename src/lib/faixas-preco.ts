// Preço por faixa de volume (tabela faixas_preco, migration 0014). O total de
// páginas impressas do pedido — páginas × cópias, a impressão é só frente —
// escolhe UMA faixa, e o preço dela vale para todas as páginas. Módulo puro
// (sem Supabase): o checkout, o totem, o create-pix e o bot calculam igual.

export type FaixaPreco = {
  a_partir_de: number;
  valor_centavos_por_pagina: number;
};

export type Preco = {
  totalPaginas: number;
  faixa: FaixaPreco;
  valorCentavos: number;
};

export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ordenarFaixas(faixas: FaixaPreco[]): FaixaPreco[] {
  return [...faixas].sort((a, b) => a.a_partir_de - b.a_partir_de);
}

// Sem a faixa base (1 página) algum pedido ficaria sem preço — configuração
// quebrada, falha alto em vez de cobrar errado.
export function temFaixaBase(faixas: FaixaPreco[] | null | undefined): boolean {
  return !!faixas?.some((f) => f.a_partir_de === 1);
}

export function calcularPreco(
  numPaginas: number,
  quantidadeCopias: number,
  faixas: FaixaPreco[]
): Preco {
  if (!temFaixaBase(faixas)) {
    throw new Error("faixas_preco incompleta — falta a faixa a partir de 1 página");
  }
  const totalPaginas = numPaginas * quantidadeCopias;
  const faixa = ordenarFaixas(faixas)
    .reverse()
    .find((f) => f.a_partir_de <= totalPaginas) as FaixaPreco;
  return {
    totalPaginas,
    faixa,
    valorCentavos: totalPaginas * faixa.valor_centavos_por_pagina,
  };
}

// Faixas como intervalos fechados para exibição: "1 a 19", "20 a 99", "100+"
// (ate = null na última).
export function intervalosDasFaixas(
  faixas: FaixaPreco[]
): Array<{ de: number; ate: number | null; valorCentavos: number }> {
  const ordenadas = ordenarFaixas(faixas);
  return ordenadas.map((f, i) => ({
    de: f.a_partir_de,
    ate: i + 1 < ordenadas.length ? ordenadas[i + 1].a_partir_de - 1 : null,
    valorCentavos: f.valor_centavos_por_pagina,
  }));
}

// Posição do total impresso na régua de faixas do checkout: cada faixa ocupa
// uma fatia igual e, dentro dela, a posição é proporcional até o início da
// próxima. A última não tem fim; vai de a_partir_de ao dobro dele.
export function posicaoNaRegua(
  totalPaginas: number,
  faixas: FaixaPreco[]
): { indice: number; fracao: number } {
  const ordenadas = ordenarFaixas(faixas);
  if (ordenadas.length === 0) return { indice: 0, fracao: 0 };
  let indice = 0;
  ordenadas.forEach((f, i) => {
    if (f.a_partir_de <= totalPaginas) indice = i;
  });
  const inicio = ordenadas[indice].a_partir_de;
  const fim = ordenadas[indice + 1]?.a_partir_de ?? inicio * 2;
  const fracao = Math.min(1, Math.max(0, (totalPaginas - inicio) / (fim - inicio)));
  return { indice, fracao };
}
