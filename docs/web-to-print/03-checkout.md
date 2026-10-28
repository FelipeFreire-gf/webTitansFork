# 03 — Checkout (frontend)

[← Índice](README.md) · Spec canônica: [`web-to-print-checkout`](../../openspec/specs/web-to-print-checkout/spec.md)

## Responsabilidade

A página pública `/impressao` conduz o cliente por quatro etapas — upload, configuração,
pagamento e sucesso — fazendo upload do PDF direto ao Storage, criando o pedido e
acompanhando o status. **Não** processa pagamento nem imprime, e só usa a anon key.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `app/impressao/page.tsx` + `src/views/Impressao.tsx` | Rota do App Router (wrapper `"use client"`) + a view que orquestra a máquina de passos (`UPLOAD → CONFIG → PAGAMENTO → SUCESSO`/`TIMEOUT`) e faz o upload + criação do pedido + chamada do PIX. |
| `src/components/impressao/UploadPDF.tsx` | Seleção/drag-drop de **um ou mais** PDFs, lista ordenável, validação, contagem de páginas e mesclagem. |
| `src/components/impressao/ConfiguracaoImpressao.tsx` | Escolha de modo de cor, cópias e exibição do preço por faixa de volume. |
| `src/components/impressao/TelaPagamento.tsx` | Mostra QR Code, Copia e Cola, timer, e aguarda confirmação. |
| `src/components/impressao/TelaSucesso.tsx` | Tela final com o protocolo (8 primeiros caracteres do UUID). |
| `src/lib/pdf-utils.ts` | `validarArquivoPDF` (tipo + 30 MB), `contarPaginas` (pdfjs-dist), `validarSelecao` (lista) e `mesclarPDFs` (pdf-lib). |
| `src/lib/faixas-preco.ts` | Regra de preço pura (cliente e servidor): `calcularPreco`, `proximaFaixa`, `intervalosDasFaixas`, `temFaixaBase`, `ordenarFaixas`, `formatBRL`. |
| `src/lib/pricing.ts` | `fetchFaixas(modo)` (lê `faixas_preco`) e re-exporta `formatBRL`. |
| `src/lib/supabase.ts` | Cliente Supabase do navegador (anon key, sem sessão persistida). |
| `src/hooks/usePedidoStatus.ts` | Realtime + polling do status do pedido. |
| `src/lib/types.ts` | `ModoCor`, `StatusPedido`, `Pedido`. |

## Fluxo, passo a passo

### 1. Upload (`UploadPDF`)

- Aceita **um ou mais** PDFs por clique ou arraste, em quantas seleções o cliente quiser —
  cada leva **acumula** na lista em vez de substituí-la. `validarSelecao` separa aceitos de
  recusados sem derrubar a seleção inteira, recusando o que não for `application/pdf`, o que
  exceder **30 MB** (`MAX_PDF_BYTES`), o duplicado (mesmo nome e tamanho) e o que passar de
  **10 arquivos** (`MAX_ARQUIVOS_POR_PEDIDO`). Cada recusa vira um toast que **nomeia o
  arquivo**.
- `contarPaginas` carrega cada PDF com `pdfjs-dist` **no navegador** e lê `pdf.numPages`
  (um por vez, para não estourar a memória do celular). Um arquivo ilegível sai da lista
  com "Não foi possível ler este PDF", preservando os demais.
- A lista mostra nome, tamanho e páginas por arquivo, com botões **↑ / ↓** (a ordem da
  lista é a ordem das páginas impressas) e **remover**, além do total de páginas do pedido.
- Ao concluir, entrega `{ file, numPaginas }` para a página e avança para `CONFIG` — onde
  `file` é o PDF **final** do pedido (ver o passo 2).

### 2. Mesclagem no navegador (`mesclarPDFs`)

- Com **um** arquivo, nada acontece: o `File` original vai para o Storage byte a byte, sem
  reescrita — o fluxo é idêntico ao que sempre foi.
- Com **dois ou mais**, o botão "Continuar" mescla os arquivos na ordem da lista usando
  `pdf-lib` (`PDFDocument.create` + `copyPages`), **no próprio navegador**: os arquivos
  individuais nunca vão para servidor nenhum, e só o PDF mesclado sobe ao Storage, como um
  único objeto. Um PDF que o `pdf-lib` não consiga copiar (protegido, corrompido) aborta a
  operação **nomeando o culpado**, sem descartar a lista.
- O resultado passa por duas conferências antes de avançar: **tamanho** ≤ 30 MB (o teto do
  bucket vale para o arquivo final; mesclar não o contorna) e **contagem de páginas** igual
  à soma das contagens individuais.
- O objeto é nomeado `pedido-<N>-arquivos.pdf` quando há vários arquivos, e mantém o nome
  original quando há um só.
- Voltar de `CONFIG` para o upload descarta o PDF mesclado (a lista permanece): se o
  cliente mexer nos arquivos, a mesclagem é refeita.

> O worker do pdfjs é servido como **asset estático** em `public/pdf.worker.min.mjs` (copiado
> da dependência por um script de `postinstall`/`prebuild`, mantendo a versão sincronizada), e
> `pdfjsLib.GlobalWorkerOptions.workerSrc` aponta para `/pdf.worker.min.mjs`. (No Vite isso era
> um import `?url`, que não existe no Next.)

### 3. Configuração (`ConfiguracaoImpressao`)

- A cada abertura da tela, `fetchFaixas(modo)` lê as faixas de `faixas_preco` do Supabase
  (ordenadas por `a_partir_de`), então um preço alterado pelo bot aparece sem recarregar o app.
- "Total de páginas" é o total do PDF **já mesclado** — a soma de todos os arquivos do
  pedido —, e a legenda indica quantos arquivos foram juntados.
- O total é `calcularPreco(numPaginas, copias, faixas)`: o total impresso
  (`páginas × cópias`, a impressão é só frente) escolhe **uma** faixa, e o preço por página
  dela vale para **todas** as páginas. Resultado em centavos, recalculado ao trocar modo ou
  cópias. Exibição via `formatBRL` (`Intl` pt-BR).
- A tela mostra o preço por página aplicado; quando uma faixa acima da base vale, a dica
  "Desconto por volume: a partir de N páginas impressas"; e, havendo uma próxima faixa,
  "Com N páginas impressas ou mais (páginas × cópias), sai R$ X/página".
- O campo de cópias aceita digitação livre (pode ficar vazio enquanto se digita e volta a 1
  ao sair do campo), tem botões − e + e máximo de 999.
- "Pagar com PIX" devolve `{ modoCor, valorCentavos }` para a página.

### 4. Criação do pedido + PIX (`Impressao.tsx → confirmarConfiguracao`)

1. Gera um caminho `pdfPath = <uuid>/<nome-sanitizado>.pdf` (o nome vem do arquivo final:
   o original com um arquivo só, `pedido-<N>-arquivos.pdf` com vários) e faz
   `supabase.storage.from('pdfs-impressao').upload(...)` (sem `upsert`).
2. `INSERT` em `fila_impressao` com `pdf_path`, `num_paginas`, `modo_cor` — **sem**
   `valor_centavos` (a RLS exige que ele seja `NULL`; o preço é definido pelo servidor). O
   `status` cai em `AGUARDANDO_PAGAMENTO` por padrão. Recebe o `id` de volta.
3. `POST /api/payments/create-pix` com `{ pedidoId }`. A resposta (`qr_code_base64`,
   `qr_code_copia_cola`, `expiration_date_to`, `mp_payment_id`, e o `valor_centavos`/
   `num_paginas` **autoritativos do servidor**) leva ao passo `PAGAMENTO`.

Se qualquer passo falhar, um toast mostra o erro e o cliente permanece na configuração
(nenhum pedido "meio-criado" avança). Se o `valor_centavos` devolvido pelo servidor diferir
da estimativa da tela (ex.: o preço mudou pelo bot depois que a tela abriu), `Impressao.tsx`
mostra o toast "O valor foi atualizado. Confira antes de pagar.".

### 5. Pagamento (`TelaPagamento`)

- Renderiza o QR Code (`data:image/png;base64,...`), o botão "Copiar Copia e Cola", um
  timer regressivo até a expiração e o **protocolo do pedido** — o cliente já sai para o
  app do banco com ele.
- Usa `usePedidoStatus(pedidoId, expirationDateTo)`: quando o pagamento é confirmado
  (`pago`), chama `onPago()` → tela de sucesso. Se estourar a janela ou o PIX for
  `CANCELADO`, chama `onTimeout()`.
- "Começar outro pedido" descarta o PIX guardado e volta ao upload — como o PIX sobrevive
  a reloads (abaixo), recarregar a página não serve mais para recomeçar.

### 6. Sucesso (`TelaSucesso`)

- Mostra "Pagamento confirmado!" e o **protocolo** = 8 primeiros caracteres do UUID, em
  maiúsculas, para o cliente apresentar na retirada.
- "Fazer outro pedido" e "Voltar ao início" descartam o pedido guardado.

### Retomada após reload (`src/lib/pedido-em-andamento.ts`)

No celular, a aba costuma ser descartada enquanto o cliente está no app do banco (o
navegador interno do Instagram é o pior caso); ao voltar, a página recarregava no upload e
o cliente nunca via o protocolo. Agora, ao gerar o PIX, o pedido vai para o
`localStorage` e a página reabre conforme o que encontrar:

| Guardado | Reabre em |
|---|---|
| PIX ainda válido | `PAGAMENTO` (que leva ao sucesso se já foi pago) |
| PIX expirado, sem sucesso | `VERIFICANDO`: uma consulta de status → `SUCESSO` se pago, senão descarta e vai ao `UPLOAD` |
| Sucesso há até 15 min | `SUCESSO` |
| Sucesso há mais de 15 min | descarta → `UPLOAD` |

Sem `localStorage` disponível (aba anônima, webview restrito) o fluxo segue como antes,
sem retomada.

## Acompanhamento de status (`usePedidoStatus`)

Combina dois mecanismos para robustez (detalhado em [02](02-fluxo-pedido.md)):

- **Realtime**: assina o canal `postgres_changes` filtrado por `id=eq.<pedidoId>` na
  tabela `fila_impressao`. Entrega a mudança em ~instantâneo quando o socket está de pé.
- **Polling (fallback)**: via TanStack Query, refaz a query a cada **5s** enquanto o
  pagamento não foi confirmado, e também ao voltar para a aba (`refetchOnWindowFocus`).
- **Janela de acompanhamento**: dura até a **expiração real do QR** (`expiration_date_to`;
  o PIX vale **30 min**), sem corte fixo. `error = "TIMEOUT"` só sai depois de uma
  consulta feita **após** a expiração — ao voltar do banco com o QR vencido, o cache
  ainda diz `AGUARDANDO_PAGAMENTO`, e o pedido pode ter sido pago no meio-tempo.

**Pago é qualquer status pós-pagamento** (`pagamentoConfirmado` em `src/lib/types.ts`:
`PAGO`, `IMPRIMINDO`, `IMPRESSO`, `ERRO`), vindo de qualquer uma das fontes. Comparar só
com `PAGO` perdia o sucesso no celular: com a aba suspensa durante o app do banco e a fila
vazia, o worker já levou o pedido a `IMPRIMINDO`/`IMPRESSO` quando o cliente volta — a
tela ficava em "Aguardando…" e acabava em "Pagamento não confirmado" com a impressão
pronta. `CANCELADO` (PIX recusado/expirado no MP) encerra como timeout.

## Decisões e pontos de atenção

- **A opção COLORIDO ainda aparece na UI**, mas a 135w é monocromática. A remoção do
  COLORIDO do checkout é uma mudança companheira separada; até lá, pedidos COLORIDO são
  impressos em tons de cinza (com aviso no log do worker).
- **O preço é autoridade do servidor.** A tela de configuração mostra apenas uma
  *estimativa*; o cliente não envia `valor_centavos` no INSERT. O `create-pix` reconta as
  páginas do PDF e recalcula o valor pelas faixas de `faixas_preco` (ver [04](04-pagamento-pix.md) e a capability
  `print-payment-integrity`).
- **Por que a mesclagem acontece no cliente.** Um pedido com vários arquivos continua sendo
  **uma linha** em `fila_impressao`, com **um** `pdf_path` e `num_paginas` igual à soma —
  para todo o resto do sistema ele é indistinguível de um PDF de N páginas enviado como
  antes. Assim `create-pix`, worker, retenção, reimpressão, totem e RLS não precisaram
  mudar: nenhuma migration, nenhum deploy na sede. A autoridade de preço não é
  enfraquecida, porque o servidor conta as páginas **do arquivo que realmente subiu**.
- **Por que o pedido de arquivo único não passa pelo `pdf-lib`.** É o caso da maioria dos
  pedidos; enviá-lo sem reescrita garante que a feature nova não pode regredir o fluxo
  dominante nem alterar o conjunto de PDFs que o serviço aceita.
- **A contagem é reconferida antes do upload.** `num_paginas` divergente do PDF real é o
  que faz o worker marcar `ERRO` — depois de o cliente ter pago. Conferir o mesclado no
  navegador transforma essa falha numa mensagem de tela, antes da cobrança.
- A leitura do próprio pedido depende de conhecer o `id` (UUID opaco); ver as ressalvas de
  RLS em [05](05-supabase.md) e [08](08-seguranca.md).

---

Anterior: [02 — Fluxo do pedido](02-fluxo-pedido.md) · Próximo: [04 — Pagamento PIX](04-pagamento-pix.md)
