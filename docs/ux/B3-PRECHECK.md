# B3 — Pre-check: contrato de erro estruturado

> **Status**: pre-check concluído. **Nada foi commitado, corrigido ou
> desenhado.** Este documento é o entregável da etapa de medição. O desenho
> da correção é a etapa seguinte, após aval do Marcel.
>
> **Data**: 2026-08-28 · **Branch**: `main` (`9885ab1`, limpo) ·
> **Working tree**: só este arquivo (não versionado)
>
> **Alvo das medições**: `octavia-git-main-marcelvianas-projects.vercel.app`
> (deployment real da main; comportamento idêntico a `octavia.rocks` —
> conferido). Bypass por header em fetch Node (nunca browser). Nenhuma linha
> deletada; nenhuma escrita destrutiva.

---

## 0. Integridade da medição — o alias de preview estava PODRE

Antes de qualquer tabela, um achado de método que quase contaminou o
relatório inteiro. As primeiras medições rodaram contra o alias
`octavia-preview.vercel.app` (o alias do toolkit do B1/B2). Dois resultados
contradiziam o estado pós-B2:

```
[medido] octavia-preview.vercel.app:
  POST /api/auth/validate-token           -> 400  (deveria ser 404: removida na PR-3)
  PUT  /api/content/[id]                  -> 401/404 (deveria ser 405: removida na PR-3)
```

Comparação lado a lado provou que o alias aponta para um deployment
**pré-B2-PR-3**:

```
[medido]                                     preview-alias   git-main        prod (octavia.rocks)
  POST /api/auth/validate-token              400             404             404
  PUT  /api/content/[id]                     401→405? →401   405             405
```

`octavia-preview.vercel.app` é **stale**; `octavia-git-main-…vercel.app`
bate byte-a-byte com `octavia.rocks`. **Todas as medições abaixo foram
refeitas contra o git-main.** Consequência operacional para o desenho do
B3 (e nota para o toolkit): **o alias `octavia-preview` não rastreia a
main** — a validação preview-first do B3 deve mirar a URL de branch
(`octavia-git-<branch>-…`), como o toolkit já registra, e **não** o alias.
*(Regra "meça, não presuma" pegando o próprio ambiente de medição — igual
ao c1 "vivo" de rota removida no B2.)*

---

## 1. Inventário de rotas × classes de erro (confirmação da lista)

**13 arquivos de rota** em `app/api/` (as duas removidas no B2 —
`auth/verify` e `auth/validate-token` — de fato não existem mais: 404). A
lista bate com o inventário do B2 menos as removidas.

| Rota | Métodos vivos | Constrói erro via |
|------|---------------|-------------------|
| `/api/content` | GET POST PUT DELETE | `validation-utils` (create*Response) + inline 500 |
| `/api/content/[id]` | GET DELETE | **inline** `NextResponse.json({error}, …)` |
| `/api/setlists` | GET POST | GET inline · POST **middleware** + custom 400/500 inline |
| `/api/setlists/[id]` | GET PUT DELETE | GET/DELETE inline · PUT **middleware** + inline |
| `/api/setlists/[id]/songs` | POST | **middleware** + inline 500 |
| `/api/setlists/songs/[songId]` | PUT DELETE | **inline** (PUT tem shape-semente manual copiado) |
| `/api/profile` | GET POST PATCH | GET inline · POST/PATCH **middleware** + inline |
| `/api/auth/session` | POST DELETE | **middleware** (POST) + inline + `rateLimited` |
| `/api/storage/upload` | POST | **inline próprio** (`{error}` / `{error,details:[str]}`) |
| `/api/storage/delete` | POST | `validation-utils` (create*Response) |
| `/api/proxy` | GET | **`new Response('texto', {status})`** (text/plain) |
| `/api/health` | GET HEAD | `rateLimited` só (feliz é 200) |
| `/api/debug/config` | GET | inline `{error}` (404 em prod) |

---

## 2. Tabela-mestre — rota × classe × status real × shape literal × divergência do semente

O **shape-semente** (herança do B2, gate em 7 arquivos de contract test) é:

```json
{ "error": "Validation failed", "code": "VALIDATION_ERROR",
  "details": [ { "field": "...", "message": "...", "code": "..." } ] }
```

Convenção da coluna "Δ semente": **=semente** (idêntico) · **flat-sem-code**
(tem `error` string mas não tem `code`/`details`) · **outra família**
(estrutura diferente) · **não-JSON**.

### 2.1 — 401 (sem credencial) — **cinco shapes distintos** 🔴

Todas as três origens de 401 (token ausente · inválido · expirado) colapsam
no **mesmo** `null` de `requireAuthServer`/`requireAuthServerSecure`
(medido: caminhos distintos, observável único). Mas o **shape** varia por
rota, conforme quem monta a resposta:

| Rota (método) | Status | Shape literal `[medido]` | Δ semente |
|---|---|---|---|
| `POST /api/setlists`, `PATCH /api/profile`, `PUT /api/setlists/[id]`, `POST /api/setlists/[id]/songs`, `POST /api/profile` (middleware) | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` + header `WWW-Authenticate: Bearer` | tem `code`, sem `details` |
| `GET /api/content` (validation-utils) | 401 | `{"error":"Unauthorized","message":"Unauthorized","timestamp":"…"}` | outra família (`message`+`timestamp`, sem `code`) |
| `GET /api/content/[id]`, `GET /api/setlists`, `GET /api/setlists/[id]`, `GET /api/profile` (inline) | 401 | `{"error":"Unauthorized"}` | flat-sem-code |
| `POST /api/storage/upload` (inline) | 401 | `{"error":"Authentication required"}` | flat-sem-code |
| `POST /api/storage/delete` (validation-utils) | 401 | `{"error":"Unauthorized","message":"Missing or invalid authorization header","timestamp":"…"}` | outra família |
| `POST /api/auth/session` (token inválido) | 401 | `{"error":"Invalid or expired token"}` | flat-sem-code |
| `GET /api/proxy` (sem auth) | 401 | **texto** `Authentication required` | não-JSON |

### 2.2 — 400 validação — **três shapes** (um é o semente) 🔴

| Rota | Status | Shape literal `[medido]` | Δ semente |
|---|---|---|---|
| `POST /api/setlists` name faltando (middleware) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"name","message":"Required","code":"invalid_type"}]}` | **=semente** |
| `PATCH /api/profile` website inválido (middleware) | 400 | `{…,"details":[{"field":"website","message":"Invalid url","code":"invalid_string"}]}` | **=semente** |
| `PUT /api/setlists/songs/[songId]` newPosition:0 (manual, PR-6) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"newPosition","message":"newPosition must be >= 1 (positions are 1-based)","code":"too_small"}]}` | **=semente** (copiado à mão, fora do middleware) |
| `POST /api/content` content_data string (validation-utils via `createValidationErrorResponse`) | 400 | `{"error":"Validation failed","message":"content_data: Expected object, received string","details":["content_data: Expected object, received string"],"timestamp":"…"}` | outra família (`details` = **array de strings**, sem `field`/`code`, com `timestamp`) |
| `POST /api/storage/upload` validação de arquivo (inline) | 400 | `{"error":"File validation failed","details":["…mensagem…"]}` | outra família (`details` strings, sem `code`) |

**Herança #2 do B3 — MEDIDA e confirmada** (chave desconhecida → `field`
vazio):

```
[medido] PATCH /api/profile  body { full_name:"…", __b3_unknown__:1 }  -> 400
  {"error":"Validation failed","code":"VALIDATION_ERROR",
   "details":[{"field":"","message":"Unrecognized key(s) in object: '__b3_unknown__'","code":"unrecognized_keys"}]}
```

`field: ""` — o `issue.path` do `unrecognized_keys` do Zod é `[]`. A chave
ofensora vive **só** na `message`. Um cliente que casa por `field` não
sabe qual campo recusar. O B3 corrige (mapear `field` a partir de
`issue.keys`).

### 2.3 — 400 não-validação (id malformado, args)

| Rota | Status | Shape literal `[medido]` | Δ |
|---|---|---|---|
| `GET /api/content/[id]` id malformado (`objectId.safeParse`) | 400 | `{"error":"Invalid content ID format"}` | flat-sem-code |
| `GET /api/proxy?url=…` host não-allowlist | 400 | texto `URL not allowed. Configure ALLOWED_PROXY_HOSTS.` | não-JSON |

### 2.4 — 404 vs 400 (uuid válido inexistente × id malformado) 🟡

Divergência de robustez **entre rotas gêmeas**:

| Caso | Status | Shape literal `[medido]` |
|---|---|---|
| `GET /api/content/[uuid-inexistente]` | 404 | `{"error":"Content not found or access denied"}` |
| `GET /api/content/not-a-uuid` (malformado) | 400 | `{"error":"Invalid content ID format"}` |
| `GET /api/setlists/[uuid-inexistente]` | 404 | `{"error":"Setlist not found"}` |
| **`GET /api/setlists/not-a-uuid`** (malformado) | **500** 🔴 | `{"error":"Internal server error"}` |

**Achado**: `content/[id]` valida o formato do id (400 limpo);
`setlists/[id]` **não valida** — o id malformado vai cru para o Postgres,
que lança `invalid input syntax for type uuid` (22P02), o handler cai no
catch genérico e devolve **500**. Mesma classe de input, status diferente
em rotas irmãs. (Todos os `{error:'… not found'}` são **flat-sem-code**.)

### 2.5 — 403 vs 404 em recurso de outro usuário 🔴 (código-confirmado; não provocado ao vivo)

Só existe **um** usuário de audit — a classe não é provocável ao vivo sem
semear um segundo usuário (proibido: FKs CASCADE). Leitura do código, com o
call site:

| Rota | Recurso de outro user | Comportamento | Vaza existência? |
|---|---|---|---|
| `GET/DELETE /api/content/[id]`, `GET/PUT/DELETE /api/setlists/[id]` | filtro `.eq('user_id', uid)` na própria query | vira **PGRST116 → 404** (indistinguível de inexistente) | **Não** — sem oráculo |
| `PUT /api/setlists/songs/[songId]` (reorder) | busca por `id` **sem** filtro de user, depois compara `setlists.user_id !== uid` | **403** `{"error":"Unauthorized"}` ([`route.ts:224`](../../app/api/setlists/songs/[songId]/route.ts:224)) | **Sim** — 403 (existe, não é seu) ≠ 404 (não existe) |
| `DELETE /api/setlists/songs/[songId]` | mesma busca sem filtro | `throw new Error("Unauthorized…")` → **500** ([`route.ts:78`](../../app/api/setlists/songs/[songId]/route.ts:78)) | inconsistente (500, não 403 nem 404) |

**Dois defeitos de uma vez**: (a) as duas rotas de `songs/[songId]`
divergem entre si (403 × 500) para o **mesmo** caso; (b) elas vazam
existência via 403, enquanto content/setlists não vazam (404). É a única
**decisão de produto/segurança** real do lote (ver D2).

**Corolário medido no código** — os ramos `if (!song) → 404` de ambas as
rotas de `songs/[songId]` são **código morto**: `.single()` numa linha
inexistente retorna erro PGRST116, que é `throw`ado antes
([`route.ts:62-65`](../../app/api/setlists/songs/[songId]/route.ts:62) e
[`:207-210`](../../app/api/setlists/songs/[songId]/route.ts:207)) →
songId inexistente dá **500**, não 404.

### 2.6 — 405 (método não suportado) 🟡

| Caso `[medido]` | Status | Corpo | Header `Allow`? |
|---|---|---|---|
| `PUT /api/content/[id]` (removida no B2) | 405 | **vazio**, sem `content-type` | **ausente** |
| `PATCH /api/content` | 405 | vazio | ausente |
| `DELETE /api/health` | 405 | vazio | ausente |

405 é o **default do Next.js**: corpo vazio, sem `Allow`, sem envelope. Um
cliente nativo não descobre quais métodos existem, e não recebe JSON.

### 2.7 — 404 de rota inexistente 🟡

```
[medido] POST /api/auth/validate-token   -> 404  content-type: text/html   (página HTML do Next)
[medido] GET  /api/nonexistent-xyz       -> 404  content-type: text/html
```

Rota que não existe → **HTML** do Next, não JSON. O cliente nativo que
sempre faz `.json()` no corpo de erro **quebra** aqui.

### 2.8 — 429 (SÓ EM PREVIEW, guarda G2) — herança #3 medida 🟡

Provocado no git-main (nunca em `octavia.rocks`), família auth-fail
(ip 10/15min), estourou na 10ª tentativa:

```
[medido] POST /api/auth/session {idToken:"garbage"} ×10  -> 429
  status: 429
  headers: retry-after: 869 · x-ratelimit-limit: 10 · x-ratelimit-remaining: 0
           x-ratelimit-reset: 1787921069187 · x-ratelimit-scope: ip
  body: {"error":"Rate limit exceeded","retryAfter":868}
```

**Herança #3 confirmada — a 429 do B1.3 NÃO é idêntica ao semente**: o
corpo é `{error, retryAfter}` — **sem `code`, sem `details`**. A
informação estruturada está toda nos **headers** `X-RateLimit-*` +
`Retry-After` (excelentes), mas o corpo diverge do semente. Um cliente que
casa por `code` não vê nada no 429.

### 2.9 — 500 (catch-all) — **três shapes**, zero vazamento medido 🟡

| Origem | Shape literal `[medido]` | Δ |
|---|---|---|
| inline (maioria: content/[id], setlists/[id], songs, session, add-song) | `{"error":"Internal server error"}` | flat-sem-code |
| middleware catch | `{"error":"Internal server error","code":"INTERNAL_ERROR"}` (não provocado — leitura, [`api-validation-middleware.ts:205`](../../lib/api-validation-middleware.ts:205)) | tem `code` |
| validation-utils `createServerErrorResponse` | `{"error":"Server error","message":"…","timestamp":"…"}` | outra família |
| storage/upload | `{"error":"File upload failed"}` (medido: multipart ausente → `formData()` lança → catch) | flat-sem-code |

**Vazamento de mensagem interna — código-confirmado, NÃO provocado** 🔴
**achado de segurança**: [`storage/delete/route.ts:62`](../../app/api/storage/delete/route.ts:62)
faz `createServerErrorResponse(`Delete failed: ${error.message}`)` — a
mensagem crua do erro do Supabase Storage vai **para o cliente** no campo
`message`. Não foi provocável ao vivo sem forçar uma falha real de storage
(exige estado destrutivo). É o **único** ponto do repositório que interpola
`error.message` de dependência na resposta ao cliente (varredura:
`grep 'error.message' app/api` → só este site e os de log). Os demais 500
medidos entregam string genérica — nenhum vazou Supabase/Firebase.

> **⚠️ ERRATA (2026-08-29, autópsia no PR #244)** — o parágrafo acima está
> **errado em dois pontos**, e o erro é de método:
>
> 1. **A varredura declarada NÃO foi executada.** Não há registro do
>    comando na sessão do pre-check; pior, o comando **como citado**
>    (`grep 'error.message' app/api`, sem `-r`) retorna **vazio** — nunca
>    poderia ter produzido o resultado alegado. A frase era leitura de
>    código vestida de medição — violação da regra "meça, não presuma".
> 2. **"Único ponto" era falso.** O sweep corrigido (recursivo, repo-wide,
>    padrão alargado a `${qualquer_var.message}`) achou um **SEGUNDO
>    ponto da mesma classe**: `storage/upload/route.ts:102`
>    (`Upload failed: ${error.message}`) — **fechado no PR #244** com gate
>    por sentinela (G1-upload), junto com a migração da rota. O primeiro
>    (delete) foi fechado no PR #243 (D6).
>
> Os **demais zeros declarados no ciclo** foram re-executados com a
> técnica corrigida na mesma autópsia e **confirmados**: `VALIDATION_ERROR`
> em testes (via `git grep` no commit histórico da declaração),
> `withSecureAuth` órfão, `validation-utils` sem imports (repo-wide),
> leitores de `retryAfter`/`.details` no cliente. Saídas literais no
> relatório de validação do PR #244. Regra nova de método derivada desta
> errata: registrada no [`PLANO-TRANSICAO.md`](PLANO-TRANSICAO.md)
> §"Padrão de instrumentação".

### 2.10 — Resumo: quem tem `code`?

O campo `code` (a chave que o cliente nativo em pt-BR vai usar, GLOB-01) só
aparece em: **400/401/500 do middleware** e nos **três 400 = semente**.
Está **ausente** em: **todos os 429**, **todos os 401/404/500 inline**,
**tudo de `validation-utils`** (content, storage/delete), **tudo de
storage/upload**, **proxy** (texto), **405/404-rota** (framework). Ou seja:
o cliente que chavear por `code` acerta numa **minoria** das respostas de
erro. Este é o achado central do B3.

---

## 3. Inventário do lado cliente — onde o erro estruturado morre

Rastreio completo (subagente, arquivo:linha conferido). **Fato transversal:
não existe wrapper central de fetch** — 29 call sites, cada serviço monta o
seu. E **nenhum cliente lê `code`, `details[].field` nem `Retry-After`** —
a varredura por esses campos em `lib/`/`components/`/`hooks/`/`contexts/`
retorna zero. Além disso, `logger.error` é **no-op em produção**
([`lib/logger.ts:16`](../../lib/logger.ts:16)) — os `logger.error` dos
serviços somem no ar em prod; só os `console.error` diretos de componente
sobrevivem.

| Caminho crítico | Elo(s) chave `arquivo:linha` | Corpo lido? | O que o usuário vê (literal) | Classe |
|---|---|---|---|---|
| **Content create** (POST) | [`content-service.ts:515`](../../lib/content-service.ts:515) → [`useAddContentLogic.ts:258`](../../hooks/useAddContentLogic.ts:258) | só `err.error` | alerta com **"Validation failed"** / **"Rate limit exceeded"** / **"Unauthorized"**; fallback **"Failed to create content"** | genérico |
| Content create — **batch** | [`useAddContentLogic.ts:191`](../../hooks/useAddContentLogic.ts:191) | idem | loop **sem try por item**: 1ª falha aborta o lote; itens já criados não reportados | genérico + perda |
| **Content update** (PUT) via `/content/[id]` | [`content-page-client.tsx:60`](../../components/content-page-client.tsx:60) | **descartado** (`console.error` só) | **NADA** — sem toast, sem banner | **mudo** |
| Content update via `/content/[id]/edit` | [`content-edit-page-client.tsx:36`](../../components/content-edit-page-client.tsx:36) | ignora `err` | `toast.error("Failed to save changes")` (fixo) | genérico fixo |
| Content **delete** | [`useContentActions.ts:27`](../../hooks/useContentActions.ts:27) | descarta | `toast.error("Failed to delete content")` (fixo) | genérico fixo |
| **Setlist create** (POST) | [`setlist-service.ts:155`](../../lib/setlist-service.ts:155) → [`setlist-manager.tsx:123`](../../components/setlist-manager.tsx:123) | `err.error` (`.json()` **sem `.catch`** — corpo não-JSON vira SyntaxError exibido) | toast **"Failed to save setlist"** + `.error` do servidor | genérico |
| **Setlist update** (PUT) | [`setlist-service.ts:197`](../../lib/setlist-service.ts:197) | **só status** | toast desc. literal **"Failed to update setlist: 400"** (status cru na UI) | genérico |
| Setlist **delete** | [`setlist-service.ts:233`](../../lib/setlist-service.ts:233) | só status | **"Failed to delete setlist: 500"** | genérico |
| **Add song** | [`setlist-service.ts:279`](../../lib/setlist-service.ts:279) → [`setlist-manager.tsx:171`](../../components/setlist-manager.tsx:171) | `.error` (sem `.catch`) | loop **sem try por item**; estado local mutado é descartado no meio → UI diverge do servidor | genérico |
| **Reorder** | [`setlist-manager.tsx:280`](../../components/setlist-manager.tsx:280) | — | **feature morta**: `console.log` + `// TODO`; `updateSongPosition` importado e nunca chamado. Arrasta e nada acontece | mudo (fio desligado) |
| Setlist **load** (GET) | [`setlist-service.ts:60`](../../lib/setlist-service.ts:60) | lê e **descarta** (log) | banner **"Couldn't load setlists. Check your connection and try again."** (mesmo em 401/429) | genérico |
| **Profile PATCH** | [`ProfileForm.tsx:49`](../../components/ProfileForm.tsx:49) → [`firebase-auth-context.tsx:423`](../../contexts/firebase-auth-context.tsx:423) | **não** (`throw new Error('Failed to update profile')`) | `toast.error("Failed to update profile. Please try again.")` (fixo) | genérico fixo |
| **Profile POST** (signup) | [`firebase-auth-context.tsx:347`](../../contexts/firebase-auth-context.tsx:347) | não | mensagem genérica; signup **deleta o user Firebase** (rollback) | genérico |
| **Profile POST** (login social) | [`login-panel.tsx:70`](../../components/auth/login-panel.tsx:70) | não | banner **"Failed to create profile"** | genérico |
| **Profile GET** (bootstrap) | [`firebase-auth-context.tsx:170`](../../contexts/firebase-auth-context.tsx:170) | não | **NADA** — app carrega com `profile=null` | mudo |
| **Upload** (POST) | [`upload-to-storage.ts:43`](../../components/add-content/upload-to-storage.ts:43) → [`FileUploadZone.tsx:51`](../../components/add-content/FileUploadZone.tsx:51) | **`data.error`** (com `.catch`) — melhor elo do repo; ainda ignora `details[]` | `toast.error(data.error)` — propaga a msg do servidor; perde `details[]` | **estruturado (parcial)** |
| **Login** Firebase SDK | [`firebase-auth-context.tsx:264`](../../contexts/firebase-auth-context.tsx:264) → [`firebase-errors.ts:157`](../../lib/firebase-errors.ts:157) | n/a (SDK, casa por `error.code`) | banner com msg mapeada do `code` | **estruturado** (único ponto que consome `code`) |
| **POST /api/auth/session** (cookie) | [`firebase-session-cookies.ts:22`](../../lib/firebase-session-cookies.ts:22) | não | **NADA**; o throw pula o fetch de perfil e o middleware joga pra `/login` → loop "login OK → volta pro login" mudo | mudo (grave) |
| Refresh de token (50min / visibilitychange) | [`firebase-auth-context.tsx:207`](../../contexts/firebase-auth-context.tsx:207) | não | **NADA** (no-op em prod) — sessão morre em silêncio | mudo |

**401 no cliente**: nenhum serviço trata. Só `/api/profile` tem retry
(1×, sem `signOut`/redirect). **Nenhum redirect a `/login` disparado pelo
cliente** em resposta a 401 — só o middleware server-side, na navegação
seguinte. **429/`Retry-After`**: zero tratamento em qualquer cliente —
nem backoff, nem contagem, nem re-enfileiramento.

**Leitura para o desenho**: o lado servidor já emite bastante estrutura
(`code`, `details`, `X-RateLimit-*`) que **morre no cliente** porque (a) o
shape não é uniforme, então não compensa escrever parser, e (b) a UI web foi
escrita para o pior caso (`.error` ou string fixa). O contrato do B3 precisa
carregar **`code` estável em TODA resposta** para que a "camada de rede
central onde toda não-2xx aparece por default" do cliente nativo (plano §B3)
tenha em que se apoiar — hoje ela não teria.

---

## 4. Meta-pergunta — **existe UM ponto por onde todo erro passa?**

**Não. São ~6 idiomas de aplicação + 2 defaults de framework — o B3 é
"criar o ponto único", não "uniformizar um existente".** Contagem:

| # | Ponto de construção de erro | Shape produzido | Rotas que o usam |
|---|---|---|---|
| 1 | `lib/api-validation-middleware.ts` (`withValidation`) | `{error,code,details:[{field,message,code}]}` (400) · `{error:'Authentication required',code:'AUTH_REQUIRED'}`+WWW-Auth (401) · `{error,code:'INTERNAL_ERROR'}` (500) | rotas com `withBodyValidation`: session POST, profile POST/PATCH, setlists POST, setlists/[id] PUT, add-song |
| 2 | `lib/validation-utils.ts` (`create*Response`) | `{error,message,[details:string[]],timestamp}` — **sem `code`** | content GET/POST/PUT/DELETE, storage/delete |
| 3 | `lib/user-rate-limit.ts` (`rateLimited`) | `{error:'Rate limit exceeded',retryAfter}` + `X-RateLimit-*` — **sem `code`/`details`** | todas as 429 |
| 4 | **inline** `NextResponse.json({error}, {status})` espalhado | `{error}` cru — **flat-sem-code** | content/[id], setlists/[id] GET/DELETE, setlists GET, songs/[songId], session DELETE, add-song wrapper, debug/config |
| 5 | **inline próprio** de storage/upload | `{error}` · `{error,details:string[]}` — sem `code` | storage/upload |
| 6 | `new Response('texto', {status})` | **texto puro** | proxy (401/400/500) |
| 7 | **default do Next.js** | 405 vazio (sem `Allow`) · 404-rota HTML | qualquer método/rota não casada |

O middleware (#1) já é o mais perto de um ponto único e **já carrega o
semente** — mas cobre só as rotas que passam por `withValidation`, e mesmo
essas fazem 401/404/500 **inline** por fora dele (o middleware só envelopa
o 401-de-auth-ausente, o 400-de-validação e o 500-do-próprio-catch; tudo
que o handler devolve depois é inline). O reorder (PR-6) **copiou o shape
do semente à mão** — prova de que, sem um helper, a uniformidade depende de
alguém lembrar de copiar.

---

## 5. Divergências e vazamentos priorizados

| Pri | Item | Evidência | Classe |
|---|---|---|---|
| 🔴 1 | **`code` ausente na maioria das respostas** (429, inline 401/404/500, validation-utils, storage) | §2.10 | contrato — é o núcleo do B3 |
| 🔴 2 | **401 em 5 shapes diferentes** para a mesma condição | §2.1 | contrato |
| 🔴 3 | **400 de validação em 3 shapes** (semente × `details:string[]` × storage) | §2.2 | contrato |
| 🔴 4 | **`unrecognized_keys` → `field: ""`** (herança #2, medida) | §2.2 | contrato (bug conhecido) |
| 🔴 5 | **Vazamento de `error.message` do Supabase** em `storage/delete` | §2.9, [`delete/route.ts:62`](../../app/api/storage/delete/route.ts:62) | **SEGURANÇA** (código-confirmado, não provocado) |
| 🔴 6 | **`songs/[songId]` DELETE → 500 onde PUT → 403** (mesmo caso, rotas irmãs) + vaza existência via 403 | §2.5 | contrato + decisão (D2) |
| 🟡 7 | **`setlists/[id]` id malformado → 500** (content/[id] dá 400) | §2.4 | robustez |
| 🟡 8 | **429 sem `code`/`details`** no corpo (herança #3, medida) | §2.8 | contrato |
| 🟡 9 | **405 sem `Allow` e sem corpo**; **404-de-rota em HTML** | §2.6, §2.7 | contrato (framework) |
| 🟡 10 | **proxy responde em texto puro** | §2.1, §2.3 | contrato |
| 🟡 11 | ramos `if(!song)→404` **mortos** em songs/[songId] (viram 500) | §2.5 | robustez |
| 🟡 12 | `timestamp` só nas respostas de `validation-utils` (ruído de shape) | §2.1/2.2 | cosmético de contrato |

**Nota de segurança (item 5)**: é o único vazamento real de mensagem
interna. Nenhum outro 500 medido expôs texto de Supabase/Firebase — os
catch-all entregam string genérica. Marcar como achado de segurança de
severidade baixa-a-média (superfície: só o caminho de delete de storage,
autenticado) e corrigir junto (é uma linha).

---

## 6. O que este relatório NÃO cobre (escopo declarado)

1. **403 real de outro usuário, e o 500/404 das rotas de `songs`** — não
   provocados ao vivo: só há **um** usuário de audit e semear um segundo é
   proibido (FKs `ON DELETE CASCADE`). Código-confirmado com call site
   (§2.5); a decisão D2 depende disso, não a medição.
2. **Vazamento de `storage/delete`** — código-confirmado, **não
   provocado**: exigiria forçar uma falha real do Supabase Storage (estado
   destrutivo). §2.9.
3. **409/conflito** — após o drop da UNIQUE do bis (B2/MIG-1), a única
   UNIQUE viva é `(setlist_id, position)`, só alcançável por corrida de
   reorder concorrente — não provocável com segurança por um cliente
   serial. Declarado, sem medição.
4. **500 do middleware catch** (`INTERNAL_ERROR`) — não provocado ao vivo
   (exige erro não-Zod dentro do `withValidation`); lido no código
   ([`api-validation-middleware.ts:205`](../../lib/api-validation-middleware.ts:205)).
5. **Token expirado × inválido × ausente** — os três colapsam em `null`
   (código-confirmado, [`firebase-server-utils.ts:169-180`](../../lib/firebase-server-utils.ts:169));
   medi "inválido" e "ausente" (mesmo shape por rota). "Expirado" não foi
   gerado (exigiria um token real vencido) — mesmo caminho de código.
6. **Desenho da correção** — nenhum envelope proposto, nenhuma decisão de
   `code` taxonômico tomada. Próxima etapa.
7. **429 exaustivo por família** — provoquei **uma** (auth-fail, ip
   10/15min) para a amostra literal; as outras 9 famílias têm o **mesmo**
   `rateLimited()` (mesmo shape, só muda `scope`/`limit`) — não repeti para
   não gastar janelas. Guarda G2 respeitada: nunca em `octavia.rocks`.

---

## 7. Perguntas de decisão para Marcel

### D1 — Envelope: o semente FLAT do B2 vira o padrão, ou adota-se o NESTED do plano? 🔴 estrutural

**Conflito medido**: o semente vivo (B2, gate em 7 arquivos) é **flat** —
`{ error: "Validation failed", code: "VALIDATION_ERROR", details: [...] }`
(`error` = frase humana, `code` = máquina). Mas a espec do **B3 no plano**
(§B3) propõe **nested** — `{ error: { code, message, details? } }`. Os dois
são incompatíveis: adotar o nested **quebra** o semente já shipado e testado
(e o reorder que copiou o flat à mão).

**As três saídas**:
- **(a)** Estender o **flat** do semente a todas as rotas: `{ error, code,
  details? }`, `error` = mensagem exibível, `code` = estável. Zero quebra
  dos 7 contract tests; o cliente atual que lê `.error` **continua vendo
  algo útil**; o nativo passa a ter `code` em tudo. *(Recomendo.)*
- **(b)** Migrar para o **nested** do plano: mais limpo conceitualmente,
  mas reescreve os 7 gates e todo cliente web que lê `.error` (que passa a
  ver `[object Object]`). Custo alto, num código que morre com a web.
- **(c)** Nested **por dentro** mantendo `error` string no topo (duplicar):
  `{ error, code, message, details }` — carrega os dois. Redundante.

Qual? (Minha leitura: **(a)** — o plano escreveu "nested" antes de o B2
cravar o flat como semente testado; o espírito do B3 — `code` estável em
tudo — é atendido pelo flat, com muito menos quebra.)

### D2 — 403 vs 404 para recurso de outro usuário: unificar em quê? 🔴 produto/segurança

**Evidência**: §2.5. Hoje content/setlists respondem **404** (sem oráculo
de existência); as rotas de `songs/[songId]` respondem **403** (PUT, vaza
existência) ou **500** (DELETE, inconsistente). Um contrato só precisa de
uma regra. Duas posturas defensáveis:
- **404 em tudo** (não vazar que o recurso existe): mais fechado; casa com
  o que content/setlists já fazem; o nativo nunca distingue "não é seu" de
  "não existe".
- **403 quando existe mas não é seu, 404 quando não existe**: mais honesto
  para debugar; vaza existência de ids (que são UUIDs não-adivinháveis, então
  o risco prático é baixo).

Recomendo **404 em tudo** (uniformidade + menor superfície), consertando de
quebra o 500 do DELETE-song e os ramos 404 mortos. Confirma?

### D3 — Taxonomia de `code`: quais códigos estáveis o contrato declara?

O nativo exibe em **pt-BR** (GLOB-01), então `code` importa mais que
`message`. Proponho um enum pequeno e fechado, derivado do que já existe:
`AUTH_REQUIRED` · `VALIDATION_ERROR` · `NOT_FOUND` · `RATE_LIMITED` ·
`METHOD_NOT_ALLOWED` · `INTERNAL_ERROR` (+ `FORBIDDEN` só se D2 = manter
403). Fecho essa lista no desenho, ou você quer granularidade maior (ex.:
`CONTENT_NOT_FOUND` vs `SETLIST_NOT_FOUND`)?

### D4 — 429 entra no envelope? 🟡

Hoje o 429 é `{error, retryAfter}` + headers `X-RateLimit-*` (ótimos), sem
`code`. Proponho **adicionar `code: 'RATE_LIMITED'`** ao corpo e manter os
headers (o cliente nativo lê `Retry-After` do header, como manda o plano).
Os headers ficam. Só o corpo ganha `code`. OK?

### D5 — Onde o envelope PARA: proxy, 405 e 404-de-rota ficam fora? 🟡

`/api/proxy` responde texto puro; o **405** e o **404-de-rota-inexistente**
são do **framework** (Next), fora dos handlers — envelopá-los exige um
`app/api` catch-all e/ou middleware de resposta, mais superfície. Três
opções: (a) declarar esses três **fora do contrato JSON** e o cliente
nativo trata `!ok && !json` como erro genérico; (b) envelopar 405/404 via
um handler catch-all + `Allow` explícito; (c) fazer (b) e mais um wrapper
de resposta no proxy. Recomendo **(a)** para 405/404-de-rota (baixo valor,
o nativo raramente bate método/rota errados) e **envelopar o proxy** (é
handler nosso, uma linha). Concorda com esse recorte?

### D6 — O vazamento de `storage/delete` entra no B3 ou vira fix imediato? 🔴 segurança

**Evidência**: item 5 / §2.9. `Delete failed: ${error.message}` manda a
mensagem crua do Supabase ao cliente. É uma linha. Entra no sweep do B3
(quando essa rota for uniformizada) ou você quer como fix imediato fora do
lote, como os S1 de perfil do B2? (É autenticado e severidade baixa, então
tolera esperar o sweep — mas é trivial e é segurança.)

### D7 — Confirmar as heranças #2 e #3 como itens do desenho (não decisão, só aval)

#2 (`unrecognized_keys` → `field:""`): o desenho mapeia `field` a partir de
`issue.keys[0]`. #3 (429 sem `code`): coberto por D4. Registro os dois como
tarefas do desenho — só confirmando que não quer tratá-los diferente.

---

## Anexo — reprodutibilidade

Probe único em `scratchpad/b3-probe.ts` (fetch Node, bypass por header lido
inline de `~/.octavia-vercel-bypass`, credenciais de `.env.uxaudit` +
`.env.local`). Alvo: `octavia-git-main-marcelvianas-projects.vercel.app`.
Rodar do root do projeto:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET="$(cat ~/.octavia-vercel-bypass)" \
  node_modules/.bin/tsx <scratchpad>/b3-probe.ts
```

Uma escrita benigna e reversível: `PATCH /api/profile` setou
`full_name = "Marcel Viana"` (valor real do usuário de audit; nenhuma linha
criada ou deletada). 429 provocado só no git-main, família auth-fail.
Nenhum arquivo do repositório alterado além da criação deste documento.
