# B2 — Pre-check: audit Zod × payload × banco

> **Status**: pre-check concluído. **Nada foi commitado, corrigido ou desenhado.**
> Este documento é o entregável da etapa de medição. O desenho da correção é a
> etapa seguinte, após aval do Marcel.
>
> **Data**: 2026-08-24 · **Branch**: `main` (limpo, `d995c9e`) · **Working tree**: só este arquivo (não versionado)

---

## 0. Passo zero — artefatos frescos do banco real

### 0.1 Ambiente

| Item | Estado |
|------|--------|
| CLI Supabase | ✅ `/opt/homebrew/bin/supabase` v2.67.1 (há v2.115.0 disponível — **não atualizei**, é mutação de config) |
| Autenticação (Management API) | ✅ token válido — `supabase projects list` respondeu; `supabase-octavia-db` = `mlxjmpbdchmwplcfislt` |
| Projeto linkado | ❌ **não linkado** — não existe `supabase/config.toml` nem `supabase/.temp/` |
| Senha do Postgres | ❌ **ausente** do ambiente local (`.env.local` não tem `POSTGRES_URL`/`DATABASE_URL`) |

### 0.2 Types frescos — ✅ gerado, **zero drift**

```
supabase gen types typescript --project-id mlxjmpbdchmwplcfislt
```

Saída **byte-a-byte idêntica** a [`types/database.types.ts`](../../types/database.types.ts)
(`diff` retornou vazio, 410 linhas). O arquivo de types do repositório **já estava
fresco**. Nada a commitar neste ponto.

### 0.3 Dump do schema — 🔴 bloqueado no pre-check · ✅ **RESOLVIDO (D0)**

> **Adendo de 2026-08-24, pós-aprovação**: Marcel executou `supabase link` +
> `supabase db dump -s public -f supabase/schema.dump.sql` no terminal dele.
> O dump está no working tree e a contradição da seção 0.5 está desfeita:
> **existem as duas constraints**, cada fonte descrevia uma delas.
>
> | Constraint | Definição | Destino |
> |---|---|---|
> | `setlist_songs_setlist_id_content_id_key` | `UNIQUE (setlist_id, content_id)` | **é a do bis — morre** (decisão B5) |
> | `setlist_songs_setlist_id_position_key` | `UNIQUE (setlist_id, position)` | **fica** — integridade de ordenação; o `tempOffset` do reorder segue necessário |
>
> O inventário completo do dump (triggers, functions, RLS, índices) está na
> seção 0 do [`B2-DESENHO.md`](B2-DESENHO.md), que também registra os achados
> novos que o dump trouxe.

**Registro original do bloqueio, preservado:**

`supabase db dump` só aceita `--linked` (exige `supabase link`, que **cria
`supabase/config.toml` + `supabase/.temp/` e pede a senha do Postgres**) ou
`--db-url` (exige a connection string com senha). Ambos os caminhos são:

1. **mutação de configuração local** → sinalização prévia obrigatória;
2. **credencial do Marcel** (senha do banco, console do Supabase) → não é minha para usar.

**Parei aqui e não executei nem `link` nem `dump`.** Ver **D0** na seção 5.

### 0.4 Substituto parcial (leitura pura, sem mutação)

Para não deixar o passo zero vazio, extraí o que é obtível read-only: o
**spec OpenAPI do PostgREST** (`GET /rest/v1/` com a service role já presente em
`.env.local`, nenhum dado saiu da máquina). Isso recupera **tipos Postgres reais,
nullability, defaults, PK e FK** — mas **não** recupera constraints UNIQUE/CHECK,
índices, triggers, functions nem policies de RLS.

**Inventário medido do banco vivo** (o que o `schema.sql` versionado nunca disse):

| Tabela | Coluna | Tipo real | Null | Default |
|--------|--------|-----------|------|---------|
| `content` | `title` | `varchar(255)` | NOT NULL | — |
| `content` | `artist` / `album` | `varchar(255)` | null | — |
| `content` | `genre` | `varchar(100)` | null | — |
| `content` | `content_type` | `varchar(50)` | NOT NULL | — |
| `content` | `key` | `varchar(10)` | null | — |
| `content` | `time_signature` | `varchar(10)` | null | **`'4/4'`** |
| `content` | `difficulty` | `varchar(20)` | null | — |
| `content` | `tuning` | `varchar(50)` | null | — |
| `content` | `capo` | `integer` | null | — |
| `content` | `thumbnail_url` | `text` | null | — |
| `content` | `is_favorite` / `is_public` | `boolean` | **null** | `false` |
| `setlists` | `name` | `varchar(255)` | NOT NULL | — |
| `setlists` | `venue` | `varchar(255)` | null | — |
| `setlists` | **`performance_date`** | **`date`** | null | — |
| `setlists` | `notes` | `text` | null | — |
| `setlist_songs` | `position` | `integer` | NOT NULL | — |
| `setlist_songs` | `created_at` | `timestamptz` | null | `now()` |
| `profiles` | `email` | `varchar(255)` | NOT NULL | — |
| `profiles` | `full_name`/`first_name`/`last_name` | `varchar(255)` | null | — |
| `profiles` | `primary_instrument` | `varchar(100)` | null | — |
| `annotations` | `annotation_data` | `jsonb` | NOT NULL | — |

### 0.5 Relatório de drift — `supabase/schema.sql` × banco vivo

O `schema.sql` mantido à mão está **errado em cinco eixos**, não três:

| # | Drift | `schema.sql` diz | Banco vivo | Novo? |
|---|-------|------------------|------------|-------|
| D-1 | Tabela `annotations` | **não existe** | existe (5 colunas, 2 FKs) | conhecido |
| D-2 | `setlists.venue` / `performance_date` / `notes` | **não existem** | existem | conhecido |
| D-3 | `setlist_songs.updated_at` | `TIMESTAMPTZ DEFAULT NOW()` + trigger `update_setlist_songs_updated_at` | **coluna não existe** — logo **o trigger declarado nas linhas 105–106 não pode existir** | conhecido, mas o corolário do trigger é **novo** |
| D-4 | **Tipos de todas as colunas de texto** | `TEXT` (ilimitado) | `varchar` com limite (255/100/50/20/10) | 🆕 **NOVO** |
| D-5 | **`content.time_signature` DEFAULT `'4/4'`** | sem default | default `'4/4'` no banco | 🆕 **NOVO** |
| D-6 | `setlists.performance_date` semântica | (coluna inexistente) | **`date`** — a decisão "date-only" do B5 **já é o estado do banco**, não precisa de migration de tipo | 🆕 **NOVO (favorável)** |
| D-7 | `content.is_favorite`/`is_public`, todos os `created_at`/`updated_at` | `NOT NULL` implícito via DEFAULT | **nullable** | 🆕 (menor) |

**Não obtido sem o dump** (fica para D0): nome exato da constraint do bis,
demais constraints UNIQUE/CHECK, índices reais, triggers vivos, functions,
policies de RLS. **Observação relevante para o desenho**: o `schema.sql`
declara `UNIQUE(setlist_id, position)` — em `position`, **não** em `content_id`.
Já o [`PLANO-TRANSICAO.md`](PLANO-TRANSICAO.md) (B5) registra a constraint do bis
como `(setlist_id, content_id)`, provada pelo 500 na duplicata (SET-06). O código
do reorder ([`app/api/setlists/songs/[songId]/route.ts:221-223`](../../app/api/setlists/songs/[songId]/route.ts:221)) faz o
truque do `tempOffset = 10000` justamente para não violar uma UNIQUE **de posição**.
Ou existem **duas** constraints, ou uma das duas descrições está errada. **Só o
dump resolve** — e a decisão "remover a constraint do bis" precisa saber qual das
duas remover.

### 0.6 Type-check contra os types frescos — ✅ **limpo**

```
npx tsc --noEmit -p tsconfig.json  →  exit 0, zero linhas de saída
```

Nenhum erro. **Mas isso não é boa notícia**, e o motivo é um achado: as rotas de
`content` e de `setlist_songs` **não usam** `types/database.types.ts`. Elas
importam `@/types/supabase` — um **segundo arquivo de types, mantido à mão**
([`types/supabase.ts`](../../types/supabase.ts), 213 linhas). Além disso, as
escritas passam por `as any` / `(supabase.from('x') as any)` em
[7 pontos](#a4-cast-any-nas-escritas), o que desliga a checagem justamente onde
ela pegaria drift. O type-check limpo mede a ausência de checagem, não a
ausência de drift.

`types/supabase.ts` está **certo nas colunas** (bate com o banco vivo, inclusive
`annotations` e a ausência de `setlist_songs.updated_at`) e **errado na
nullability**: declara `created_at`/`updated_at`/`is_favorite`/`is_public` como
não-nulos; o banco os tem nullable.

---

## 1. Inventário de rotas

**14 rotas** em `app/api/`. Todas cobertas. Nenhuma ficou fora.

| Rota | Métodos | Valida com | Chamada pela UI? |
|------|---------|-----------|------------------|
| `/api/content` | GET, POST, PUT, DELETE | `lib/validation-schemas.ts` | ✅ sim |
| `/api/content/[id]` | GET, PUT, DELETE | `lib/api-validation-middleware.ts` | GET/DELETE sim · **PUT órfão** |
| `/api/setlists` | GET, POST | `api-validation-middleware` | ✅ sim |
| `/api/setlists/[id]` | GET, PUT, DELETE | `api-validation-middleware` | ✅ sim |
| `/api/setlists/[id]/songs` | POST | `api-validation-middleware` | ✅ sim |
| `/api/setlists/songs/[songId]` | PUT, DELETE | **nenhum Zod** (PUT lê `body` cru) | ✅ sim |
| `/api/profile` | GET, POST, PATCH | `api-validation-middleware` | ✅ sim |
| `/api/auth/session` | POST, DELETE | `api-validation-middleware` | ✅ sim |
| `/api/auth/validate-token` | POST | **nenhum Zod, nenhum rate limit** | ❌ **zero referências no repo inteiro** |
| `/api/storage/upload` | POST | `storageSchemas.upload` (`safeParse` manual) | ✅ sim |
| `/api/storage/delete` | POST | `fileDeleteSchema` | ❌ **só no próprio teste** |
| `/api/proxy` | GET | validação inline (não-Zod) | ✅ sim |
| `/api/health` | GET, HEAD | sem body | ✅ sim |
| `/api/debug/config` | GET | sem body (404 em prod) | ❌ nenhuma |

### Achado estrutural: **dois sistemas de validação paralelos**

| | `lib/validation-schemas.ts` | `lib/api-validation-middleware.ts` |
|---|---|---|
| Usado por | `/api/content` (GET/POST/PUT), `/api/storage/delete` | todas as outras |
| `content_type` aceito | `Lyrics, Chords, Tab, Sheet, song, chord, lyric, audio, video, pdf` | **`Lyrics, Chords, Tabs, Piano, Drums`** |
| `title` máx | 200 | **1000** |
| `bpm` faixa | 1–999 | **30–300** |
| `difficulty` | + `Expert` | sem `Expert` |
| declara `genre`, `file_url`, `time_signature`, `is_public` | ✅ | ❌ |
| aceita `null` em campos opcionais | ✅ (`.optional().nullable()`) | ❌ (`.optional()` — só `undefined`) |

Nenhum dos dois bate com o enum real da UI
([`types/content.ts:9-14`](../../types/content.ts:9): `Lyrics | Chords | Tab | Sheet`).
`Tabs`, `Piano` e `Drums` **não existem no produto** — vieram do CLAUDE.md, não do código.

**8 schemas de `lib/validation-schemas.ts` são órfãos**: `createProfileSchema`,
`updateProfileSchema`, `sessionSchema`, `fileUploadSchema` (só num mock de teste),
`createSetlistSchema`, `updateSetlistSchema`, `addSongToSetlistSchema`,
`proxyRequestSchema`. O `createSetlistSchema` órfão declara **`event_date`** —
coluna que **não existe** no banco (a real é `performance_date`).
`storageSchemas.delete` (em `api-validation-middleware`) também é órfão e espera
`fileUrl`, enquanto a rota real usa `fileDeleteSchema`, que espera `filename`.

---

## 2. Tabela-mestre — rota × schema × payload × banco × classe de falha

Método: cada linha marcada **[medido]** foi executada — os schemas Zod **reais do
repositório** foram importados via `tsx` e rodados contra o payload **real** montado
pelo call site citado. Saída completa em `scratchpad/probe{1..4}.ts`.

### 2.1 `POST /api/setlists` — **SET-01, confirmado e ampliado** 🔴

Call site: [`setlist-manager.tsx:104`](../../components/setlist-manager.tsx:104) → [`setlist-service.ts:145`](../../lib/setlist-service.ts:145)

```
payload:  { name, description, performance_date, venue, notes }
[medido]  RESULTADO: 201
          STRIPADOS EM SILÊNCIO: performance_date, venue, notes
          CHEGA NO HANDLER: { name, description, songs: [] }
```

O agravante que o assessment não registrava: o **handler foi escrito para
persistir os três campos** —
[`app/api/setlists/route.ts:127-129`](../../app/api/setlists/route.ts:127) lê
`validatedData.performance_date`, `.venue`, `.notes`. Como o schema garante que
essas chaves **nunca** existem, as três linhas gravam `null` **incondicionalmente**.
São leituras mortas: alguém ligou a ponta do handler e nunca a ponta do schema.

**Segundo achado, novo — `songs[]`**: o schema aceita `songs: [{content_id, position, notes}]`
(até 100), com `.default([])`. O handler **nunca insere em `setlist_songs`** e
devolve `setlist_songs: []` fixo ([`route.ts:150`](../../app/api/setlists/route.ts:150)).
Um cliente que criar a setlist já com as músicas recebe **201 com corpo mentiroso**
e perde tudo. Sucesso mentiroso, o pior grau da falha silenciosa.

### 2.2 `PUT /api/setlists/[id]` — **SET-01, lado do update** 🔴

Call site: [`setlist-manager.tsx:81`](../../components/setlist-manager.tsx:81) → [`setlist-service.ts:193`](../../lib/setlist-service.ts:193) (`body = updates` cru)

```
payload:  { name, description, performance_date, venue, notes }
[medido]  RESULTADO: 200
          STRIPADOS EM SILÊNCIO: performance_date, venue, notes
          CHEGA NO HANDLER: { name, description }
```

Aqui o handler **nem tenta**: [`app/api/setlists/[id]/route.ts:174-179`](../../app/api/setlists/[id]/route.ts:174)
só copia `name` e `description`. E `songs[]`, aceito pelo schema de update, também
não toca em `setlist_songs`.

**Consequência de produto medida**: editar uma setlist para trocar o local **retorna
"Setlist updated successfully"** ([`setlist-manager.tsx:100`](../../components/setlist-manager.tsx:100))
e não muda nada no banco. A UI ainda faz `{...s, ...updatedSetlist}` com a resposta
do servidor, então o valor digitado some da tela no reload — sem nenhum erro.

### 2.3 `POST /api/content` — batch import 🔴 e `file_url` 🟡

Call sites: [`useAddContentLogic.ts:192`](../../hooks/useAddContentLogic.ts:192) (batch), [`:206`](../../hooks/useAddContentLogic.ts:206) (draft), [`:231`](../../hooks/useAddContentLogic.ts:231) (upload)

```
[medido] BATCH — content_data = song.body, que é STRING (lib/batch-import.ts:3)
         RESULTADO: 400 — { campo: "content_data", msg: "Expected object, received string" }

[medido] DRAFT — content_data = { [contentKey]: text } (content-creator.tsx:93-96)
         RESULTADO: 201 · STRIPADO: user_id (benigno — o servidor usa o do token)

[medido] UPLOAD com upload OK
         RESULTADO: 201 · STRIPADO: user_id

[medido] UPLOAD com fallback `uploadedFile.url ?? uploadedFile.name`
         RESULTADO: 400 — { campo: "file_url", msg: "Invalid url" }
```

**Batch import está morto no contrato**: `createContentSchema.content_data` é
`z.record(z.unknown())` (objeto), e o parser entrega `body: string`. Toda música
importada em lote leva 400. O loop de
[`useAddContentLogic.ts:191`](../../hooks/useAddContentLogic.ts:191) não tem
`try/catch` por item — a primeira falha aborta o lote inteiro.

**Sobre o `file_url` catalogado**: o 400 é real e está **medido**, mas o caminho é
**inalcançável pela web hoje** — [`FileUploadZone.tsx:39`](../../components/add-content/FileUploadZone.tsx:39)
só chama `onFilesUploaded` depois de `await uploadToStorage(file)`, que **lança**
se não houver URL ([`upload-to-storage.ts:48-50`](../../components/add-content/upload-to-storage.ts:48)).
O `?? uploadedFile.name` é código morto na web. **Vira alcançável no cliente nativo**,
que monta o payload por conta própria. Reclassificação: de bug ativo para
**armadilha de contrato herdada**.

### 2.4 `PUT /api/content/[id]` — rota órfã e **incompatível com a UI** 🔴

A UI **nunca** usa esta rota: `updateContent()` bate em `PUT /api/content`
([`content-service.ts:541`](../../lib/content-service.ts:541)). O cliente nativo,
seguindo REST, usaria `/api/content/[id]` — e bateria de frente:

```
[medido] content_type: "Tab"    → 400 { campo:"content_type", msg:"Invalid content type" }
[medido] content_type: "Sheet"  → 400 { campo:"content_type", msg:"Invalid content type" }
[medido] payload real do content-editor.tsx:78
         → 400 em três campos de uma vez:
           album      "Expected string, received null"
           difficulty "Expected 'Beginner'|'Intermediate'|'Advanced', received null"
           notes      "Expected string, received null"
```

Esta é **exatamente a classe SET-23** (`.optional()` aceita só `undefined`),
viva em três campos de uma rota que ninguém exercita. E `contentSchemas.update`
não declara `genre`, `file_url`, `time_signature`, `is_public`, `capo`, `tuning` —
**seis campos stripados** se alguém os enviar.

**Bônus de tipo**: `contentSchemas.update.title` aceita **1000 chars**; o banco é
`varchar(255)`. Um título de 300 chars passa no Zod e o Postgres rejeita com 22001
→ o handler cai no `catch` genérico → **500 "Internal server error"**. Schema aceita
o que o banco não guarda.

### 2.5 `PUT /api/content` — o caminho que a UI realmente usa 🟢/🟡

```
[medido] payload real do content-editor.tsx:78
         RESULTADO: 200 · STRIPADO: updated_at (benigno — o handler seta o seu)

[medido] bpm de campo vazio: Number.parseInt("") = NaN (content-editor.tsx:85)
         RESULTADO: 400 — { campo:"bpm", msg:"Expected number, received nan" }
```

O caminho feliz está correto. O NaN é um 400 real, mas depende de `editedContent.bpm`
chegar como string vazia — o ternário `? :` da linha 85 protege contra `""`, não
contra `"abc"`. Risco baixo, mas o 400 aparece como erro genérico no console
([`content-page-client.tsx:60`](../../components/content-page-client.tsx:60) só faz
`console.error`) — **falha silenciosa para o usuário**.

Nota: `updateContentSchema` **não declara `content_type`** — esta rota **não consegue
trocar o tipo de um conteúdo**, em nenhuma circunstância. Nenhuma UI tenta; o nativo
provavelmente vai querer.

### 2.6 `POST /api/profile` — SET-23 vivo no login social 🔴

Dois call sites, comportamentos opostos:

```
[medido] signup email/senha (signup-panel.tsx:40 → firebase-auth-context.tsx:333)
         payload: { first_name, last_name, full_name, primary_instrument, id, email }
         RESULTADO: 201 · STRIPADOS: id, email (benigno e correto — vêm do token)

[medido] login social SEM displayName (login-panel.tsx:53 e :90)
         payload: { id, email, full_name: null, first_name: null, last_name: null, avatar_url: null }
         RESULTADO: 400 — QUATRO campos:
           full_name  "Expected string, received null"
           first_name "Expected string, received null"
           last_name  "Expected string, received null"
           avatar_url "Expected string, received null"
```

O `|| null` de [`login-panel.tsx:60-63`](../../components/auth/login-panel.tsx:60)
produz `null` sempre que o provedor não devolve `displayName`/`photoURL`. O schema
usa `.optional()` — **rejeita `null`**. Resultado: `throw new Error('Failed to create profile')`
e o usuário fica **autenticado no Firebase sem perfil no Supabase** — o mesmo
usuário órfão que o commit `aa501cc` existia para eliminar. A correção do
`displayName`/`preferences` resolveu o *nome* dos campos e deixou a *nulidade* de pé.

### 2.7 `PATCH /api/profile` — **bug ativo em produção** 🔴

Call site: [`ProfileForm.tsx:46`](../../components/ProfileForm.tsx:46) — o form tem
exatamente três campos: `full_name`, `bio`, `website`, inicializados com `""`.

```
[medido] { full_name: "Marcel Viana", bio: "", website: "" }
         RESULTADO: 400 — { campo:"website", msg:"Invalid url" }

[medido] { full_name: "Marcel Viana", bio: "baixista", website: "https://octavia.rocks" }
         RESULTADO: 200
```

**Qualquer usuário que salvar o perfil sem preencher o site leva 400** e vê
`toast.error("Failed to update profile. Please try again.")` — sem dizer qual campo.
`z.string().url().optional()` não aceita `""`. E o form **só edita 3 das 7 colunas
editáveis** (`first_name`, `last_name`, `primary_instrument`, `avatar_url` ficam
inalcançáveis pela UI, embora o schema os aceite).

### 2.8 `POST /api/setlists/[id]/songs` — position ignorada 🟡

```
[medido] { content_id, position: 3, notes: "" } → aceito, nada stripado
```

O Zod passa limpo. O **handler** é que descarta:
[`route.ts:62`](../../app/api/setlists/[id]/songs/route.ts:62)
`Math.max(position, currentMaxPosition + 1)` — a `position` enviada só vale se for
maior que o máximo atual. É o item 21 da Fase D (enviou `1`, voltou `11`), agora
localizado na linha exata. Falha silenciosa de nível handler, não de schema: o
201 devolve a posição real, mas ninguém confere.

### 2.9 `PUT /api/setlists/songs/[songId]` — **sem Zod nenhum** 🔴

[`route.ts:166-174`](../../app/api/setlists/songs/[songId]/route.ts:166) lê
`body.setlistId` e `body.newPosition` **crus**, com guarda `if (!setlistId || !newPosition)`.

- **`newPosition: 0` é rejeitado como ausente** (`!0 === true`) → 400 "setlistId and newPosition required". Se o contrato nativo usar índice base-0, o primeiro slot é inatingível.
- Nenhuma validação de tipo: `newPosition: "3"` (string) passa a guarda e vai para aritmética (`targetIndex = newPosition - 1`) e comparação (`currentPosition === newPosition`, que com string **nunca** é true).
- O schema `setlistSchemas.updatePosition` **existe** (`{ song_id, new_position }`) e **nunca é usado** — e os nomes nem batem com o que a rota lê (`setlistId`/`newPosition`).
- 2N UPDATEs sem transação, com `tempOffset = 10000` (SET-07, já catalogado).

### 2.10 `POST /api/storage/upload` 🟡

```
[medido] { filename:"cifra.pdf", contentType:"application/pdf", size:1024 } → OK
[medido] { filename:"foto.jpg",  contentType:"image/jpg",       size:1024 } → 400 "Unsupported file type"
[medido] { filename:"vazio.pdf", contentType:"application/pdf", size:0    } → 400 "min 1"
```

Contradição interna: o regex de `storageSchemas.upload` aceita `image/jpeg` mas
**não** `image/jpg`; a checagem de extensão logo abaixo
([`route.ts:83-85`](../../app/api/storage/upload/route.ts:83)) aceita `image/jpg`
explicitamente. Navegadores que reportam `image/jpg` são barrados pelo Zod antes
de chegar na checagem que os aceitaria. O regex também aceita `text/html` e
`application/msword`, que a checagem de extensão rejeita — três listas de tipos
permitidos que não coincidem (esta, `allowedMimeTypes` de `validation-schemas.ts`,
e a de `FileUploadZone`).

### 2.11 Rotas sem achado de contrato

`/api/auth/session` (payload `{idToken}` bate com o schema), `/api/health`,
`/api/proxy` (query, validação inline coerente), `/api/debug/config` (404 em prod),
`GET /api/content`, `GET /api/content/[id]`, `GET /api/setlists`, `GET /api/setlists/[id]`,
`DELETE`s. **Ressalva no `GET /api/content`**: o filtro `contentType` tem uma
**quarta** lista de tipos válidos, `['Lyrics','Chords','Tab','Sheet']`
([`route.ts:94`](../../app/api/content/route.ts:94)) — esta bate com a UI, mas um
conteúdo gravado como `song`/`pdf`/`audio` (aceitos pelo `createContentSchema`)
seria **invisível** a qualquer filtro.

---

## 3. Divergências priorizadas

### (a) Strip silencioso — o padrão nº 1

| # | Rota | Campos stripados | Desfecho | Sev |
|---|------|-----------------|----------|-----|
| **a1** | `POST /api/setlists` | `performance_date`, `venue`, `notes` | 201, dado perdido, handler tem leitura morta | 🔴 S1 |
| **a2** | `PUT /api/setlists/[id]` | `performance_date`, `venue`, `notes` | 200 + toast "updated successfully" mentindo | 🔴 S1 |
| **a3** | `POST/PUT /api/setlists*` | `songs[]` (até 100 músicas) | 201 com `setlist_songs: []` — **sucesso mentiroso** | 🔴 S1 |
| **a4** | `PUT /api/content/[id]` | `genre`, `file_url`, `time_signature`, `is_public`, `capo`, `tuning` | 200 mentindo | 🟡 S2 (rota órfã hoje) |
| **a5** | `POST/PATCH /api/profile` | `id`, `email` | **correto e intencional** (vêm do token) | 🟢 |
| **a6** | `POST /api/content` | `user_id` | **correto e intencional** | 🟢 |
| **a7** | `PUT /api/content` | `updated_at` | **correto** (handler seta o seu) | 🟢 |

### (b) Rejeição indevida — a direção inversa

| # | Rota | Campo | Gatilho | Desfecho | Sev |
|---|------|-------|---------|----------|-----|
| **b1** | `PATCH /api/profile` | `website: ""` | salvar perfil sem site | 400 → toast genérico. **Bug ativo em prod** | 🔴 S1 |
| **b2** | `POST /api/profile` | `full_name`/`first_name`/`last_name`/`avatar_url` = `null` | login social sem `displayName` | 400 → **usuário Firebase órfão** | 🔴 S1 |
| **b3** | `POST /api/content` | `content_data` string | todo batch import | 400, lote inteiro aborta | 🔴 S1 |
| **b4** | `PUT /api/content/[id]` | `album`/`difficulty`/`notes` = `null` | qualquer save do editor | 400 (SET-23 vivo) | 🟡 S2 (órfã) |
| **b5** | `PUT /api/content/[id]` | `content_type` = `Tab`/`Sheet` | qualquer save | 400 — enum não existe no produto | 🟡 S2 (órfã) |
| **b6** | `POST /api/content` | `file_url` = nome do arquivo | upload falho (inalcançável na web) | 400 | 🟡 armadilha p/ nativo |
| **b7** | `PUT .../songs/[songId]` | `newPosition: 0` | índice base-0 | 400 "required" | 🟡 armadilha p/ nativo |
| **b8** | `POST /api/storage/upload` | `contentType: image/jpg` | navegador que reporta `image/jpg` | 400 | 🟡 S3 |
| **b9** | `PUT /api/content` | `bpm` NaN | BPM não-numérico | 400 silencioso (só `console.error`) | 🟡 S3 |

### (c) Drift de tipo / nullability

| # | Onde | Divergência | Sev |
|---|------|-------------|-----|
| **c1** | `contentSchemas.update.title` × banco | Zod aceita 1000, banco é `varchar(255)` → 22001 → **500 genérico** | 🟡 |
| **c2** | `content_type` | **quatro** listas incompatíveis: `validation-schemas`(10) × `api-validation-middleware`(5) × filtro do GET(4) × `types/content.ts`(4, a verdadeira) | 🔴 |
| **c3** | `bpm` | 1–999 (POST) × 30–300 (PUT `[id]`) — mesmo campo, mesma tabela | 🟡 |
| **c4** | `difficulty` | `Expert` existe num schema e não no outro; o banco é `varchar(20)` livre | 🟡 |
| **c5** | `types/supabase.ts` × banco | `created_at`/`updated_at`/`is_favorite`/`is_public` declarados não-nulos; são nullable | 🟡 |
| **c6** | `performance_date` | banco é `date`; a UI faz `new Date(str)` ([`setlist-card.tsx:66`](../../components/setlist/setlist-card.tsx:66), [`:172`](../../components/setlist/setlist-card.tsx:172), [`setlist-details.tsx:135`](../../components/setlist/setlist-details.tsx:135)) → parse UTC → **off-by-one** (SET-17). Causa raiz localizada | 🟡 |
| **c7** | `supabase/schema.sql` | drifts D-1..D-7 da seção 0.5 | 🔴 |

### (d) Órfãos e fantasmas

| # | Item | Estado |
|---|------|--------|
| **d1** | Tabela **`annotations`** | **zero leitores, zero escritores** — não existe rota `/api/annotations`, não existe um único `.from('annotations')` no repositório. As anotações são gravadas em `content.content_data.annotations` ([`content-editor.tsx:93`](../../components/content-editor.tsx:93)). A tabela nunca recebeu uma linha por esta aplicação. **Corrige o registro do B5**: não é "write-only", é **nunca-escrita** |
| **d2** | `content.capo`, `content.tuning`, `content.thumbnail_url` | colunas órfãs — nenhum schema Zod as declara, nenhuma UI as envia |
| **d3** | `setlists.is_public`, `content.is_public` | `is_public` de content é gravável (`createContentSchema`), o de setlist não é declarado em nenhum schema ativo. Nenhuma UI expõe qualquer um dos dois |
| **d4** | Rota `POST /api/auth/validate-token` | **zero referências** no repositório inteiro, inclusive testes. Sem Zod, **sem rate limit**, e faz `verifyIdToken` remoto — superfície pública não medida |
| **d5** | Rota `POST /api/storage/delete` | referenciada **só pelo próprio teste**. É o par do B5 (órfãos de storage) |
| **d6** | Rota `PUT /api/content/[id]` | órfã para a web; a mais provável de o nativo escolher (achados a4/b4/b5/c1) |
| **d7** | 8 schemas órfãos em `lib/validation-schemas.ts` | incl. `createSetlistSchema` com **`event_date`** (coluna inexistente) |
| **d8** | `setlistSchemas.updatePosition` | órfão, e com nomes de campo que **não batem** com o que a rota lê |
| **d9** | `storageSchemas.delete` | órfão, espera `fileUrl`; a rota real usa `filename` |
| **d10** | `supabase/rls-policies.sql` + policies do `schema.sql` | não verificáveis sem o dump. Como **toda** operação de servidor usa service role (que ignora RLS), são provavelmente decorativas — **mas isso não foi medido** |

### Achados incidentais (fora do escopo declarado, registrados para não se perderem)

- **[`setlist-manager.tsx:99`](../../components/setlist-manager.tsx:99)**: no *update*, grava no cache offline `saveSetlists(setlists)` — o array **anterior** ao update, não o atualizado. O branch de create ([`:113`](../../components/setlist-manager.tsx:113)) faz certo. O cache offline fica com a versão velha.
- <a id="a4-cast-any-nas-escritas"></a>**`as any` nas escritas**: `setlists/route.ts:137`, `setlists/[id]/route.ts:183`, `setlists/[id]/songs/route.ts:74`, `setlists/songs/[songId]/route.ts:113,240,279`, `content/route.ts:191,240`, `content/[id]/route.ts:117`, `profile/route.ts:87` e um `@ts-expect-error` em `profile/route.ts:140`. É por isso que o type-check limpo não prova nada sobre drift.
- **`GET /api/setlists`** faz N+1 queries (1 + 2 por setlist). Performance, não contrato.

---

## 4. O que este relatório NÃO cobre (escopo declarado)

1. **Constraints, índices, triggers, functions e policies de RLS do banco vivo** — bloqueados pela ausência do dump (D0). Inclui o **nome exato da constraint do bis**, que a decisão do B5 precisa para a migration de drop.
2. **Verificação por requisição real contra preview/prod.** Todas as medições desta sessão foram feitas **localmente**, rodando os schemas Zod reais contra os payloads reais. Isso prova o comportamento da camada de validação, **não** o da rota inteira em produção (handler + banco + rate limit). Os casos 🔴 merecem confirmação end-to-end na etapa de desenho.
3. **`content_data` por dentro.** É `jsonb` livre; nenhum schema valida a forma interna (`sections`, `lyrics`, `measures`, `annotations`). Um audit da forma do `content_data` é tarefa própria — provavelmente do design nativo, já que ele decide como as anotações serão modeladas.
4. **Rotas do App Router que não são `/api`** (server components, server actions) — não há server actions no projeto, mas não varri exaustivamente.
5. **O payload do futuro cliente nativo.** O B2 do plano pede "payload real da UI atual **e** do futuro cliente nativo". O segundo não existe ainda; onde ele mudaria o veredito, marquei como "armadilha para o nativo" em vez de bug ativo.
6. **Desenho de correção.** Nenhuma correção proposta, nenhuma migration escrita, nenhuma política de strip decidida. É a próxima etapa.
7. **Testes de contrato.** O entregável final do B2 no plano inclui "testes de contrato". Não escrevi nenhum — eles nascem do desenho, com controle negativo (regra nº 7).

---

## 5. Perguntas de decisão

### D0 — Como destravar o dump do schema? 🔴 **bloqueante para o desenho**

**Evidência**: seção 0.3. `supabase db dump` exige `supabase link` (que cria
`supabase/config.toml` + `supabase/.temp/` e pede a senha do Postgres) ou
`--db-url` com a senha. Sem isso não há como nomear a constraint do bis — e a
seção 0.5 mostra que **há contradição** entre o `schema.sql` (`UNIQUE(setlist_id, position)`)
e o registro do B5 (`UNIQUE(setlist_id, content_id)`). A decisão "remover a
constraint do bis" não pode ser implementada sem saber qual das duas é real.

**Opções**: (a) você roda `supabase link --project-ref mlxjmpbdchmwplcfislt` +
`supabase db dump -s public -f supabase/schema.dump.sql` no seu terminal e me
passa o arquivo; (b) você me autoriza a rodar o `link` e me passa a senha inline
no momento do comando; (c) adiamos o dump e o desenho trabalha só com o que foi
medido — **não recomendo**, o bis fica sem resposta.

### D1 — Política de strip silencioso: qual é o default do contrato?

**Evidência**: a1, a2, a3 — três S1 da mesma causa. A6/a7 mostram que o strip
**também é usado corretamente** hoje (`user_id`, `id`, `email`, `updated_at`
vindos do cliente devem mesmo morrer, por segurança).

**A escolha**: `.strict()` (400 em chave desconhecida) quebra os casos benignos e
obriga a UI a parar de enviar `user_id`/`id`/`email`. `.passthrough()` é
inaceitável (grava lixo). A terceira via é **strip explícito por lista** —
declarar os campos ignorados no schema (`z.undefined()` ou `.transform(() => undefined)`)
para que "ignorar" seja uma decisão escrita, e `.strict()` para todo o resto.
Qual dos três?

### D2 — `songs[]` no create/update de setlist: implementar ou remover?

**Evidência**: a3. Hoje é aceito, validado, e jogado fora com 201 mentiroso.
Criar uma setlist com músicas em **uma** requisição é exatamente o que um cliente
móvel quer (menos round-trips, e casa com o J3 "criar setlist em 3 taps").
**Implementar** (insert em transação) ou **remover do schema** (e o nativo faz
N+1 chamadas)?

### D3 — Consolidar os dois sistemas de validação: qual sobrevive?

**Evidência**: seção 1 e c2/c3/c4. `lib/validation-schemas.ts` (usado por
`/api/content`) tem `.nullable()` em toda parte — **imune à classe SET-23** — e
declara `genre`/`file_url`/`time_signature`/`is_public`. `lib/api-validation-middleware.ts`
tem o middleware de auth/rate-limit e o `sanitizeInput`, mas seus schemas são os
que carregam b2/b4/b5.

Minha leitura: manter o **middleware** de `api-validation-middleware.ts` e migrar
os **schemas** para o estilo de `validation-schemas.ts` (`.nullish()` em tudo que
é opcional), num módulo único. Confirma?

### D4 — `content_type`: qual é o enum canônico, e o que fazer com os valores extras?

**Evidência**: c2, quatro listas. `types/content.ts` (`Lyrics | Chords | Tab | Sheet`)
é o que a UI usa. Mas o `createContentSchema` aceitou `song`, `chord`, `lyric`,
`audio`, `video`, `pdf` durante toda a vida do app — **pode haver linhas gravadas
com esses valores**, e elas seriam invisíveis ao filtro. Antes de fechar o enum:
quer que eu **conte** o que existe hoje em `content_type` no banco (um `SELECT
content_type, count(*) GROUP BY 1`, leitura pura via PostgREST)? Isso responde se
o fechamento precisa de migration de dados.

### D5 — `content_data` como string: consertar o parser ou alargar o schema?

**Evidência**: b3. O batch import entrega `body: string`; o schema quer objeto.
O parser está em [`lib/batch-import.ts`](../../lib/batch-import.ts) e o resto do
app guarda `content_data` como objeto (`{lyrics}`, `{sections}`, `{measures}`).
**Consertar o call site** (`content_data: { [contentKey]: song.body }`, alinhando
com o branch draft) parece o certo — mas o batch import está no Bloco C/D do
plano (morre com a web). Vale consertar agora ou só declarar o contrato correto
para o nativo?

### D6 — `PUT /api/content/[id]` órfã: consertar, aposentar, ou deixar como está?

**Evidência**: d6, a4, b4, b5, c1. É a rota mais provável de o nativo escolher e a
mais quebrada do repositório. **Consertar** (e aí a web migra para ela, aposentando
o `PUT /api/content` sem `id` na URL, que não é REST) ou **deletar** (e o nativo
usa `PUT /api/content` com `id` no corpo)?

### D7 — Tabela `annotations`: a premissa do B5 muda?

**Evidência**: d1. A decisão do B5 foi "manter, não dropar; nada de escrita nova"
sobre a premissa de que a tabela é write-only. A medição diz que ela **nunca
recebeu uma linha** — as anotações sempre viveram em `content.content_data`.
Isso não muda o "não dropar agora", mas muda o desenho nativo: não há dado a
migrar, e a escolha `annotations` vs. JSONB é greenfield. Registro a correção,
ou quer reabrir a decisão?

### D8 — Os dois bugs S1 de perfil entram na fila agora ou esperam o desenho?

**Evidência**: b1 (salvar perfil sem site → 400, **bug ativo em prod**) e b2
(login social sem `displayName` → usuário órfão). São one-liners (`.nullish()`
e aceitar `""`), da mesma classe que o SET-23 já corrigido. A fila A está
fechada. Entram como fix imediato fora da fila, ou como parte do pacote de
correção do B2?

---

## Anexo — reprodutibilidade

Medições em `scratchpad/probe1.ts` … `probe4.ts` (importam os schemas **reais**
do repositório, sem réplica) e `scratchpad/openapi.json` (introspecção do
PostgREST). Rodar com:

```bash
node_modules/.bin/tsx <caminho>/probe1.ts
```

Nenhuma escrita foi feita no banco. Nenhum arquivo do repositório foi alterado
além da criação deste documento (não versionado).
