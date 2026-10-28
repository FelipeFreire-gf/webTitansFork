# 05 — Armazenamento Supabase

[← Índice](README.md) · Spec canônica: [`print-queue-storage`](../../openspec/specs/print-queue-storage/spec.md)

## Responsabilidade

O Supabase é o backbone da feature e o ponto de encontro dos outros três subsistemas:
guarda o PDF (Storage), a fila e os preços (Postgres), aplica as regras de acesso (RLS) e
publica mudanças (Realtime). Migrations em `supabase/migrations/`.

## `fila_impressao`

A fila de pedidos. Definida em `0001_fila_impressao.sql`; o status `IMPRIMINDO` veio em
`0004_print_worker.sql`. O hardening tornou `valor_centavos` nullable (`0002`) e `pdf_path`
nullable (`0005`).

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()`; serve de protocolo e de token de leitura. |
| `created_at` | timestamptz | `now()`. |
| `pdf_path` | text? | Caminho no bucket (`<uuid>/<nome>.pdf`) — **sempre um único objeto por pedido**, mesmo quando o cliente escolhe vários PDFs (o navegador os mescla antes de subir; ver [03](03-checkout.md)). Anulado pela limpeza após 7 dias. |
| `num_paginas` | int | `> 0`; com vários arquivos, a **soma** das páginas. Declarado pelo cliente, **reconferido e sobrescrito** pelo `create-pix` (e pelo worker). |
| `modo_cor` | text | `'PB'` ou `'COLORIDO'`. |
| `valor_centavos` | int? | `NULL` no INSERT; preenchido pelo `create-pix` (`> 0`). |
| `status` | text | `AGUARDANDO_PAGAMENTO`/`PAGO`/`IMPRIMINDO`/`IMPRESSO`/`ERRO`/`CANCELADO`. Default `AGUARDANDO_PAGAMENTO`. |
| `mp_payment_id` | text? | Preenchido pelo `create-pix`. |
| `mp_preference_id` | text? | Reservado. |
| `paid_at` | timestamptz? | Setado pelo webhook ao aprovar. |
| `printed_at` | timestamptz? | Setado pelo worker ao imprimir. |

**Índice:** `fila_impressao_status_idx` em `(status)` — o worker varre `status='PAGO'`
eficientemente. A máquina de estados está em [02](02-fluxo-pedido.md).

## `faixas_preco`

Preço por página em **faixas de volume**, por modo de cor — editável **sem deploy** (pelo
bot do Telegram ou pelo Table Editor). Migration `0014_faixas_preco.sql`.

| Campo | Tipo |
| --- | --- |
| `modo_cor` | text (`'PB'`/`'COLORIDO'`) |
| `a_partir_de` | int `>= 1` — total de páginas impressas a partir do qual a faixa vale |
| `valor_centavos_por_pagina` | int `> 0` |
| `atualizado_em` | timestamptz (default `now()`) |
| `atualizado_por` | bigint? — `from.id` do admin no Telegram; `null` no seed |

PK `(modo_cor, a_partir_de)`. O seed copia `config_precos` como **faixa base**
(`a_partir_de = 1`), então os preços não mudam até alguém criar faixas. A faixa base
`a_partir_de = 1` deve sempre existir (o bot recusa removê-la; o `create-pix` responde 500
sem ela).

Regra: `páginas × cópias` escolhe **uma** faixa (a de maior `a_partir_de` ≤ total) e o
preço dela vale para **todas** as páginas. Com faixas 1 → R$ 0,50, 20 → R$ 0,40 e
100 → R$ 0,30: 19 págs = R$ 9,50; 20 págs = R$ 8,00; 150 págs = R$ 45,00.

> **`config_precos` (legado).** Continua no banco, mas o código **não a usa mais**; foi
> mantida só até o deploy. Será removida numa migration posterior.

## Bucket `pdfs-impressao` (privado)

- Criado com `public = false` — **não** é servível por URL pública.
- **Limites no bucket** (`0002`): `allowed_mime_types = ['application/pdf']` e
  `file_size_limit = 30 MB` — violações são rejeitadas pelo próprio Storage, mesmo via API
  direta com a anon key.
- Policy `pdfs_impressao_anon_insert`: `anon` só pode **INSERT** (upload). SELECT/UPDATE/
  DELETE não têm policy → negados.
- Quem lê os PDFs de volta é a `service_role` (o worker da sede). Ver [06](06-print-worker.md).

## RLS

RLS habilitado em `fila_impressao` e `faixas_preco`. A `service_role` (Vercel e sede)
**bypassa** RLS — por isso o webhook e o worker conseguem escrever.

**`fila_impressao`:**

- `fila_impressao_anon_insert` — `anon` só insere com `status='AGUARDANDO_PAGAMENTO' AND
  valor_centavos IS NULL AND mp_payment_id IS NULL AND paid_at IS NULL AND printed_at IS NULL`
  (o `valor_centavos IS NULL` veio no `0002`). O cliente não cria pedido já "pago" **nem**
  define o preço.
- `fila_impressao_anon_select` — `anon` pode `SELECT` (`using (true)`). Na prática a
  proteção é o `id` (UUID opaco) que o cliente precisa fornecer na query; sem ele, teria
  que adivinhar UUIDs.
- **UPDATE / DELETE** — sem policy para `anon` → negados. O cliente nunca muda status.

**`faixas_preco`:** `anon`/`authenticated` só podem `SELECT` (`faixas_preco_select`);
escrita só via `service_role` (bot do Telegram).

> **Ponto de atenção.** A policy de SELECT é permissiva (`using (true)`): quem
> souber/adivinhar um `id` lê a linha. A auditoria de RLS do hardening **aceitou** esse
> risco (um UUID v4 é inviável de enumerar); um token separado da PK fica como evolução
> futura. Ver [08](08-seguranca.md).

## Realtime

A migration adiciona `fila_impressao` à publicação `supabase_realtime`, permitindo ao
cliente assinar `postgres_changes` na sua linha (usado por `usePedidoStatus`, ver
[03](03-checkout.md)).

## Decisões e pontos de atenção

- **Numeração das migrations**: `0001` (base), `0002` (hardening — `valor_centavos`
  nullable + RLS + limites do bucket), `0003` (agendamento da limpeza), `0004` (status
  `IMPRIMINDO`), `0005` (`pdf_path` nullable).
- **Limpeza automática**: a Edge Function `cleanup-fila`, agendada por pg_cron de hora em
  hora, apaga órfãos não pagos (1h), remove o PDF de impressos (7 dias) e a linha (6 meses).
  Ver a capability [`print-data-retention`](../../openspec/specs/print-data-retention/spec.md)
  e o runbook em [07](07-operacao.md).

---

Anterior: [04 — Pagamento PIX](04-pagamento-pix.md) · Próximo: [06 — Print worker](06-print-worker.md)
