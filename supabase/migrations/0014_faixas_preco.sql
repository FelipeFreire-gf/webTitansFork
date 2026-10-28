-- Web-to-Print: preço por faixa de volume (melhorias-impressao).
-- Rode este arquivo no SQL Editor do Supabase (produção) ou via `supabase db push`.
--
-- O total de páginas impressas do pedido (páginas × cópias — a impressão é só
-- frente) escolhe UMA faixa, e o preço dela vale para todas as páginas, como
-- nas copiadoras. Ex.: faixas 1, 20 e 100 → 19 págs a R$ 0,50 = R$ 9,50;
-- 20 págs a R$ 0,40 = R$ 8,00.
--
-- Esta tabela é a única fonte de preço: o checkout e o totem leem (anon), o
-- create-pix cobra (service_role) e o bot do Telegram escreve (service_role,
-- comandos /precos, /faixa e /remover_faixa — ver src/lib/server/precos-bot.ts).
--
-- Substitui `config_precos`, que fica sem uso mas NÃO é apagada aqui: até o
-- deploy do código novo, o create-pix em produção ainda lê dela. Remover numa
-- migration posterior.

create table public.faixas_preco (
  modo_cor text not null check (modo_cor in ('PB', 'COLORIDO')),
  -- Faixa vale a partir deste total de páginas impressas. Toda modalidade
  -- precisa da faixa base (1); o bot recusa removê-la.
  a_partir_de int not null check (a_partir_de >= 1),
  valor_centavos_por_pagina int not null check (valor_centavos_por_pagina > 0),
  atualizado_em timestamptz not null default now(),
  -- from.id do admin no Telegram que fez a última alteração; null no seed.
  atualizado_por bigint,
  primary key (modo_cor, a_partir_de)
);

-- Os preços atuais viram a faixa base: nada muda até alguém criar faixas.
insert into public.faixas_preco (modo_cor, a_partir_de, valor_centavos_por_pagina)
select modo_cor, 1, valor_centavos_por_pagina
from public.config_precos;

alter table public.faixas_preco enable row level security;

-- Leitura pública (é a tabela de preços); sem policy de escrita = só service_role.
create policy faixas_preco_select
  on public.faixas_preco
  for select
  to anon, authenticated
  using (true);
