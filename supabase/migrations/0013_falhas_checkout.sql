-- Web-to-Print: registro de falhas do checkout (fix/upload-resiliente-checkout).
-- Rode este arquivo no SQL Editor do Supabase (produção) ou via `supabase db push`.
--
-- Relatos de "não consigo enviar o PDF" chegam sem detalhe — o console fica no
-- celular do cliente. Cada falha do checkout (leitura do arquivo, upload,
-- registro do pedido, geração do PIX) vira uma linha com o código da etapa e o
-- aparelho, para confirmar ou descartar padrões (ex.: celulares Xiaomi) com
-- dados em vez de casos isolados.
--
-- Escrita só pela API route /api/telemetria/falha-checkout (service_role), que
-- valida, trunca e limita a taxa; RLS sem policy nega todo acesso anon, no
-- mesmo padrão de `chamados_ajuda` (0008).

create table public.falhas_checkout (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  -- Etapa que falhou, no formato do ErroCheckout: ENVIO-REDE, ENVIO-500,
  -- PEDIDO, PIX-502, LEITURA, INESPERADO...
  codigo text not null check (codigo ~ '^[A-Z]+(-[A-Z0-9]+)?$' and length(codigo) <= 32),
  mensagem text check (mensagem is null or length(mensagem) <= 300),
  -- Preenchida nas falhas de upload que ainda serão repetidas (1 ou 2); null
  -- na falha final, que chegou ao cliente.
  tentativa smallint check (tentativa is null or tentativa >= 1),
  user_agent text check (user_agent is null or length(user_agent) <= 512),
  -- O Chrome do Android omite o modelo no user-agent ("K"); vêm das Client
  -- Hints (navigator.userAgentData) quando o navegador as expõe.
  modelo text check (modelo is null or length(modelo) <= 100),
  versao_plataforma text check (versao_plataforma is null or length(versao_plataforma) <= 50),
  tamanho_bytes bigint check (tamanho_bytes is null or tamanho_bytes >= 0),
  num_paginas int check (num_paginas is null or num_paginas >= 0)
);

create index falhas_checkout_criado_em_idx
  on public.falhas_checkout (criado_em desc);

-- RLS habilitado sem nenhuma policy: todo acesso anon é negado por padrão.
alter table public.falhas_checkout enable row level security;

-- Consulta de análise (exemplo):
--   select codigo, coalesce(modelo, '?') as modelo, count(*)
--   from falhas_checkout
--   where tentativa is null and criado_em > now() - interval '30 days'
--   group by 1, 2 order by 3 desc;
