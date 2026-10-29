import { supabase } from "./supabase";
import { temFaixaBase, ordenarFaixas, type FaixaPreco } from "./faixas-preco";
import type { ModoCor } from "./types";

export { formatBRL } from "./faixas-preco";

// Faixas de preço da modalidade, em ordem crescente. Mesma tabela que o
// create-pix usa para cobrar e o bot do Telegram edita.
export async function fetchFaixas(modo: ModoCor): Promise<FaixaPreco[]> {
  const { data, error } = await supabase
    .from("faixas_preco")
    .select("a_partir_de, valor_centavos_por_pagina")
    .eq("modo_cor", modo);

  if (error) throw error;

  const faixas = (data ?? []) as FaixaPreco[];
  if (!temFaixaBase(faixas)) {
    throw new Error(`faixas_preco incompleta — falta a faixa base de ${modo}`);
  }
  return ordenarFaixas(faixas);
}
