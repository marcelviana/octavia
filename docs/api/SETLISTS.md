# Contrato de setlists da API Octavia

> **Origem**: bloco B6 (2026-09; pre-check e desenho em
> [`docs/ux/B6-DESENHO.md`](../ux/B6-DESENHO.md), decisões B6-D1 a D11).
> Este documento contrata POR ESCRITO o invariante de `position` e os
> shapes de escrita de `setlist_songs`. **Errata N2-PR0 (2026-09-16, div.
> 145, N2-D7)**: passa a contratar também as três escritas da própria
> setlist (criar, editar, apagar), a posse por rota e a regra 9 — copiadas
> dos handlers na `main` `c33c794`, não do que "deveria ser". Erros: toda não-2xx destas rotas
> fala o envelope de [`CONTRATO-DE-ERRO.md`](CONTRATO-DE-ERRO.md)
> (referência de conveniência — docs independentes, sem link normativo).

## Invariante contíguo 1..N (contrato da tabela)

Em toda setlist, as `position` de `setlist_songs` são **exatamente
1..N contíguas** (N = contagem de músicas), sem gap e sem duplicata.

**Mecanismo (B6-D10/D11)**: os quatro escritores de produção
pós-criação — addSong, remoção de música, reorder e delete de content —
escrevem via funções RPC transacionais
(`supabase/migrations/20260901102108_b6_setlist_songs_rpc.sql`) que
serializam no lock `FOR UPDATE` da linha-pai (`setlists`); o delete de
content trava antes a linha de `content` (conflita com o FOR KEY SHARE
da FK do addSong). Demais classes do inventário (B6-DESENHO.md §0.1):
o create com `songs[]` inline é seguro por construção (setlist recém-
criada, positions 1..N atribuídas pelo servidor); os deletes em massa
por cascade são vácuos (a setlist morre junto). Fechado na PR-3c: o
delete de content renumera na mesma transação (B6-D11).

Posições são **1-based**. Erros das RPCs saem por SQLSTATE custom
(OB6xx) e são traduzidos POR `error.code` no ponto único
`lib/rpc-errors.ts` — mensagem de dependência nunca navega ao envelope.

## Onde o contrato vive (regra 9 — N2-PR0, div. 176)

**Comportamento observável de contrato vive NESTE arquivo.** Decisão
registrada só num desenho (`docs/ux/*-DESENHO.md`) ou só numa mensagem de
commit **não é contrato**: o cliente nativo não a lê e a próxima correção
a desfaz sem saber. Origem: o `200 {success:true}` do DELETE de setlist
inexistente era decisão da B3 PR-3a e vivia só em `B3-DESENHO.md:312-317`
e no commit `effe847`; o hotfix #307 o tratou como defeito antes de
achá-lo (`docs/ux/HOTFIX-150.md` §1.1). Toda PR que muda status, corpo,
posse ou validação de uma rota abaixo muda este arquivo no mesmo commit.

## Posse e autenticação por rota (N2-PR0; medido em `docs/native/N2-PRECHECK.md` §1.1)

**RLS não protege estas rotas; posse é do handler.** As oito usam
`getSupabaseServiceClient()` (`lib/supabase-service.ts:7`, chave
`SUPABASE_SERVICE_ROLE_KEY`), e a policy `"Service role access to …"`
(`schema.dump.sql:485` para `setlist_songs`, `:489` para `setlists`)
libera tudo para esse cliente. Nas três rotas de RPC, a checagem de dono
roda **na rota, antes e fora da transação**; as funções não recebem uid.

| Rota | Cadeia ([`AUTH.md`](AUTH.md)) | Email verificado | Posse (onde o handler filtra por usuário) | Id do path validado |
|---|---|---|---|---|
| `GET /api/setlists` | A | não | `.eq('user_id', …)` (`route.ts:37`); content embutido **sem** filtro (delta declarado) | — |
| `GET /api/setlists/[id]` | A | não | setlist `[id]/route.ts:43`; songs só depois desse gate | sim (`objectId`) |
| `POST /api/setlists` | B | **sim** | `songs[].content_id` por `.in('id', …).eq('user_id', …)` + contagem (`route.ts:104-120`); a linha nasce com `user_id` do token (`:132`) | — |
| `PUT /api/setlists/[id]` | B | **sim** | o próprio UPDATE filtra `user_id` (`[id]/route.ts:199`); content da resposta também (`:249`) | sim (`:163-166`) |
| `DELETE /api/setlists/[id]` | A | não | o próprio DELETE filtra `user_id` (`[id]/route.ts:347`) | sim (`:332-335`) |
| `POST /api/setlists/[id]/songs` | B | **sim** | setlist `songs/route.ts:28`; content `:47` | **não** → 500 (div. 153) |
| `PUT /api/setlists/[id]/songs/order` | B | **sim** | setlist `order/route.ts:31`; a RPC só aceita songs da própria setlist | **não** → 500 (div. 153) |
| `DELETE /api/setlists/songs/[songId]` | A | não | join `setlists!inner(user_id)` + comparação (`[songId]/route.ts:47-50`, `:70-72`) | **não** → 500, medido em prod (div. 153) |

Cadeia B com email **não** verificado → `401 AUTH_REQUIRED`
(`lib/secure-auth-utils.ts:307-310`), pelo mesmo `authRequired()` do token
ausente (`lib/api-validation-middleware.ts:111`); a identidade byte a byte
desse 401 com o de token inválido é hipótese aberta (H-N2-11). As seis
escritas somam na **mesma** janela por uid, `setlist-mutate` = 120 por
15 min (`lib/user-rate-limit.ts:52`); nas rotas da cadeia B o limite conta
**antes** da validação do corpo (`api-validation-middleware.ts:114-125` <
`:151-164`), então um 400 também consome.

**Nenhuma escrita é idempotente e nenhuma tem pré-condição de versão**
(sem `If-Match`/ETag/`updated_at` esperado): um `POST` repetido cria
outra setlist; um addSong repetido cria um bis; dois `PUT` concorrentes
nos metadados — **vence quem grava por último**, sem aviso. Repetir `PUT`
de metadados ou o reorder reaplica o mesmo estado; repetir o
`DELETE` de song ou de setlist devolve `404`.

## Rotas

### `GET /api/setlists` — listagem (leitura; documentada na N1-PR1)

Forma medida em prod em 2026-09-09 (conta de audit, `N1-PRECHECK.md` A3;
código `app/api/setlists/route.ts:12-80`). Antes deste item o doc só
cobria escrita — o consumidor da leitura é a tela 1 do nativo (PRD §2).

- Auth: cadeia A (`requireAuthServer`; bearer ou cookie, sem exigir
  email verificado — [`AUTH.md`](AUTH.md) §3); família `setlist-read`
  (300/min por uid). `Cache-Control: private, no-store`.
- **Sem paginação**: devolve todas as setlists do usuário.
- 200: **array na raiz** (não envelope), uma setlist por item:
  ```
  { id, user_id, name, description, performance_date, venue, notes,
    is_public, created_at, updated_at,
    setlist_songs: [ { id, setlist_id, content_id, position, notes,
      content: { id, title, artist, content_type, key, bpm, file_url, content_data } } ] }
  ```
  `performance_date` é date-only (`YYYY-MM-DD`) ou `null`; `updated_at`
  ISO com offset (`2026-08-29T19:43:10.287+00:00`).
- **Uma query** com embedding do PostgREST (`route.ts:31-38`, B6 PR-4
  D6): `setlists` → `setlist_songs (…, content (…))`, filtrada por
  `setlists.user_id`; o content embutido segue a FK **sem** filtro de
  `user_id` (delta declarado no código — inalcançável pelos escritores,
  que validam posse).
- Ordem: setlists por `created_at desc`; `setlist_songs` por `position
  asc` (`referencedTable`), contígua 1..N (invariante acima).
- Fallbacks quando o content da FK não vem (`route.ts:60-70`):
  `title: "Unknown Title"`, `artist: "Unknown Artist"`, `content_type:
  "Unknown Type"`, `key/bpm/file_url/content_data: null`, `content.id =
  song.content_id`. O cliente nativo **não** usa o embutido (PRD T1-R8):
  lê o corpo do cache de content por `content_id`.
- Medido (audit): 3 setlists (60 / 8 / 1 songs), 49.983 B, 69 songs com
  60 `content_id` distintos (bis), `notes` não-nulo em 15; content
  embutido = 34.634 B de JSON.
- Erros: 401 `AUTH_REQUIRED`; 429 `RATE_LIMITED`; 500 `INTERNAL_ERROR`
  ([`CONTRATO-DE-ERRO.md`](CONTRATO-DE-ERRO.md)).

### `POST /api/setlists` — criar setlist (N2-PR0, div. 145)

Copiado do handler `app/api/setlists/route.ts:91-216` (export `:224`) e do
schema `setlistSchemas.create` (`lib/api-schemas.ts:318-350`).

- Auth: cadeia B (`withBodyValidation`), **exige email verificado**;
  família `setlist-mutate`.
- Body (`.strict()` — chave desconhecida → 400, um `details` por chave):
  - `name` — **obrigatório**; `trim()` e depois 1..255 (`api-schemas.ts:320`;
    coluna `varchar(255) NOT NULL`, `schema.dump.sql:383`). Só espaços →
    400 `too_small`. Ausente → `400 field:"name"` `invalid_type` (medido em
    prod, `N2-PRECHECK.md` §11, B-a).
  - `description`, `notes` — `safeHtml`: `trim()`, ≤ 50.000, `null` aceito.
  - `venue` — `trim()`, 0..255, `null` aceito.
  - `performance_date` — **date-only** `YYYY-MM-DD` por regex, ou `null`
    (`api-schemas.ts:324-326`). Timestamp → 400. A regex **não confere o
    calendário**: `2026-02-31` passa pelo Zod e chega ao `date` do
    Postgres (div. 154; o status resultante não foi medido — H-N2-6).
  - `songs` — opcional, default `[]`; ≤ 100 itens; cada item
    `{ content_id: uuid, notes?: safeText|null }` (`.strict()`, **sem
    `position`**: a ordem do array é a ordem, renumerada 1..N);
    `content_id` repetido no array → `400` (`Duplicate content_id in
    songs`) — bis se faz adicionando depois.
  - **Recusa de texto** (todos os campos de texto acima): o `refine` do
    SAN-01 rejeita, sem diferenciar maiúsculas, qualquer valor que contenha
    `<script`, `javascript:`, `data:` ou `vbscript:` (`api-schemas.ts:60-75`;
    `safeHtml` acrescenta `on<palavra>=`, `:78-81`) → `400` com `field` do
    campo. **`data:` casa a palavra portuguesa** — um nome como
    `Show — data: 12/10` ou um `venue` `Bar Data: centro` é recusado; e o
    `on<palavra>=` casa `notes: "dois tons = abaixo"` (medido contra o
    schema, `docs/native/PRD-TELA-2.md` nota N1; div. 181).
- Semântica: campo ausente e `null` gravam `null` (`route.ts:127-131`);
  `created_at` e `updated_at` são o relógio do Node no INSERT
  (`:133-134`), não do banco.
- **Posse de `songs[]`** antes de criar qualquer coisa: uma query por
  `content_id` do próprio usuário e comparação de contagem (`:102-120`).
  Algum inexistente-ou-alheio → `400 field:"songs"` (`One or more
  content_id do not exist or do not belong to the user`) — **não** 404.
- Com `songs[]`: um INSERT multi-row (`:168-171`); se falhar, um DELETE
  compensatório apaga a setlist recém-criada (`:174-178`) e a resposta é
  `500` com `error: "Failed to create setlist songs"` (`:182` — texto
  diferente do 500 genérico; `code` igual, div. 180). Pior caso
  declarado no código (`:156-159`): se o próprio DELETE compensatório
  falhar, sobra uma setlist **vazia** visível na listagem.
- **201**: a linha de `setlists` inteira (todas as colunas, `select()` de
  `:140`, inclusive `id`, `user_id`, `created_at`, `updated_at`) +
  `setlist_songs: [...]` — `[]` sem `songs`; com `songs`, as linhas
  gravadas com `position` real e `content{…}` embutido (fallback
  `title: "Unknown Title"`, `artist: null`, `content_type: "Unknown
  Type"`, `:185-205`).
- Erros: 400 `VALIDATION_ERROR`; 401 `AUTH_REQUIRED` (inclui email não
  verificado); 429 `RATE_LIMITED`; 500 `INTERNAL_ERROR` (`:182`, `:213`).
- **Não idempotente**: repetir cria outra setlist.
- Ordem na listagem: `created_at desc` — a setlist nova aparece **no topo**
  do `GET /api/setlists`.

### `PUT /api/setlists/[id]` — editar metadados (N2-PR0, div. 145)

Copiado de `app/api/setlists/[id]/route.ts:146-312` (handler `:147-294`,
wrapper `:297-310`) e de `setlistSchemas.update` (`api-schemas.ts:354-357`).

- Auth: cadeia B, **exige email verificado**; família `setlist-mutate`.
- Id do path: `objectId` → não-uuid = `400 field:"id"` (`:163-166`).
- Body `.strict()`, **só metadados**: `name` (opcional; se presente,
  `trim()` e 1..255 — **`null` → 400**, `name` não é anulável),
  `description`, `venue`, `performance_date`, `notes` com as mesmas regras
  do POST. `songs` (ou qualquer outra chave) → `400` por chave
  desconhecida — músicas têm rotas próprias.
- **Semântica por campo** (`:171-192`): **ausente = não mexe** (fica fora do
  UPDATE); **`null` = limpa**. `{}` é válido e só atualiza o `updated_at`.
- `updated_at` = relógio do Node, **sempre**, no mesmo UPDATE (`:174-176`).
- **Sem pré-condição**: UPDATE simples filtrado por `id` e `user_id`
  (`:195-201`), sem `If-Match` — último a gravar vence.
- Inexistente-ou-alheia → `404 Setlist not found` (`PGRST116`,
  `:207-209`), sem oráculo.
- **200**: a linha de `setlists` inteira depois do UPDATE +
  `setlist_songs` ordenadas por `position`, com `content{…}` embutido
  lido com filtro de dono (`:245-249`; fallback `"Unknown Title"`,
  **`"Unknown Artist"`**, `"Unknown Type"`, e `||` em `key`/`bpm`/…,
  `:273-282` — difere do POST, div. 179).
- **Atenção — 200 com `setlist_songs: []` que não é verdade**: se a
  leitura das músicas falhar **depois** do UPDATE bem-sucedido, a rota
  responde 200 com `setlist_songs: []` (`:228-233`); se a leitura do
  content falhar, só loga e segue com os fallbacks (`:251-253`). O corpo
  do 200 **não é** leitura confiável das músicas (div. 178). O cliente
  que precisa das músicas relê.
- Erros: 400; 401 (inclui email não verificado); 404; 429; 500 (`:291`).

### `DELETE /api/setlists/[id]` — apagar setlist (hotfix #307; N2-D12)

Copiado de `app/api/setlists/[id]/route.ts:314-381` (handler `:315-365`,
wrapper `:368-379`), na `main` depois do merge da #307 (`e20c0a4`).

- Auth: **cadeia A** (`requireAuthServer`, `:320`) — **não** exige email
  verificado (assimetria com criar/editar: div. 152); família
  `setlist-mutate` via `enforceUserLimit` (`:325`), contada **depois** da
  auth e **antes** da validação do id. Sem corpo.
- Id não-uuid → `400 VALIDATION_ERROR` com `field: "id"` (`:332-335`).
- **Gate de dono**: um único `DELETE` em `setlists` filtrado por `id` E
  `user_id`, com `RETURNING id` (`:343-348`). Zero linhas → `404 Setlist
  not found` (`NOT_FOUND`, `:356-358`) — setlist inexistente-ou-alheia são
  **a mesma resposta** (sem oráculo, byte-idênticas por construção: o
  mesmo ramo de código). Medido no preview da #307 com uuid novo: 404,
  corpo de 48 B = o literal de `CONTRATO-DE-ERRO.md`
  (`docs/ux/HOTFIX-150.md` §3.1).
- As linhas de `setlist_songs` saem pelo FK
  `setlist_songs_setlist_id_fkey ON DELETE CASCADE` (`schema.dump.sql:468`);
  a rota **não** apaga `setlist_songs` por conta própria (o delete
  explícito por `setlist_id`, sem filtro de dono, era a div. 150 e saiu).
  O DELETE da linha-pai pega o mesmo lock que as RPCs do B6.
- **200**: `{ "success": true }` (`:360`). Erro do banco → `500` (`:350-353`,
  `:361-363`).
- **Delete repetido da mesma setlist → `404`.** Mudança de contrato
  decidida (**N2-D12**, Marcel, 2026-09-16), que **supera** o
  `200 {success:true}` idempotente da B3 PR-3a (`effe847`,
  `B3-DESENHO.md:312-317`). Razões: paridade com as rotas de song
  (inexistente-ou-alheia → 404) e o cliente nativo lê 404 como
  "ressincronize". No banco, repetir continua sem efeito.
- **Assimetria declarada (div. 174)**: `DELETE /api/content/[id]` **segue**
  com o 200 idempotente para inexistente — a N2-D12 só vale para setlist.
  Destino: pre-check do N3, junto do B9.
- Único consumidor web: `lib/setlist-service.ts:227`; com o 404, apagar
  uma setlist que outro aparelho já apagou mostra toast de erro no web
  (div. 172, Bloco D).

### `POST /api/setlists/[id]/songs` — addSong

- Auth obrigatória; família `setlist-mutate` (120/15min por uid).
- Body: `{ content_id, position?, notes? }` (strict).
- **`position` é aceita por compatibilidade e SEMPRE recalculada para
  max+1** (B6-D3: append-only; gap impossível por construção — o
  pre-check mediu o gap p99 do contrato antigo). O max é lido DENTRO da
  transação da RPC, sob o lock.
- Gates na rota: setlist inexistente-ou-alheia → `404 Setlist not
  found`; content inexistente-ou-alheio → `404 Content not found`
  (sem oráculo, byte-idênticos por construção).
- 201: a linha inserida, colunas na ordem da tabela —
  `{ id, setlist_id, content_id, position, notes, created_at }` — com a
  `position` REAL. `updated_at` da setlist bumpa na mesma transação.
- Bis (mesmo content de novo) é permitido — cada add é uma linha nova
  no fim.

### `PUT /api/setlists/[id]/songs/order` — reorder em lote (B6-D1)

- Auth obrigatória; família `setlist-mutate`. Guard de corpo de 1MB
  (middleware — B6-D4).
- Body: `{ "order": [<setlist_song.id>…] }` (strict, 1..100 itens,
  uuids, sem duplicata).
- **`order` deve ser permutação EXATA** do conjunto de músicas da
  setlist: mesmos IDs, sem falta, sem sobra. A checagem roda DENTRO da
  transação (TOCTOU fechado); a renumeração 1..N pela ordem do array é
  atômica.
- Erros: duplicata → `400 field:"order"` (`Duplicate song id in
  order`); falta/sobra/ID alheio/corrida → `400 field:"order"`
  (`order must contain exactly the songs of the setlist`) —
  byte-idênticos entre si (sem oráculo); setlist inexistente-ou-alheia
  → `404 Setlist not found` byte-idêntico ao do addSong; corpo >1MB →
  `400 field:""`.
- 200: `{ "songs": [ { "id", "position" }… ] }` — a ordem canônica
  renumerada; a resposta É a leitura (o cliente nativo reconcilia o
  drag-and-drop sem GET).
- Consumidor: cliente nativo (a web não a chama — TODO histórico do
  setlist-manager permanece).

### `DELETE /api/setlists/songs/[songId]`

- Auth obrigatória; família `setlist-mutate`.
- Gate na rota: song inexistente OU de outro usuário → `404 Song not
  found` byte-idênticos (D2 do B3).
- A remoção + renumeração 1..N-1 + bump de `updated_at` são UMA
  transação (RPC `remove_setlist_song` — B6-D9); o double-delete
  concorrente vira `404` (nunca um 200 mentiroso).
- 200: `{ "success": true }`.

### Rota REMOVIDA: `PUT /api/setlists/songs/[songId]` (move-one)

Removida na B6 PR-3b (B6-D1): zero consumidores vivos (a UI web nunca a
chamou), custo de 2N UPDATEs não-atômicos por movimento (pre-check §2).
O contrato canônico de reorder é o lote acima.

## Nota de concorrência (medida no ciclo do B6)

Corridas addSong×reorder, addSong×remove e reorder×remove serializam no
lock da linha-pai; addSong×addSong serializa e produz N+1, N+2 (no
contrato antigo, colidia na UNIQUE → 500). Resíduos declarados no
desenho §2.2/§2.6.
