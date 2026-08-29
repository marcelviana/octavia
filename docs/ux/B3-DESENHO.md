# B3 — Desenho: contrato de erro estruturado

> **Status**: **APROVADO por Marcel em 2026-08-28**, com os três pontos do
> §8 decididos (**A** proxy normaliza upstream · **B** guard de 1MB no
> content, PR-2 com replay · **C** registro de restauração fechado com o
> GET atual) e **cinco emendas incorporadas** a este texto: (1) conjuntos
> de contract tests nomeados arquivo a arquivo, com análise de interseção
> (§4.1); (2) tipagem fechada do `extra` (§2.1); (3) cláusula de
> tolerância a campos no contrato; (4) `field:"id"` para id de path
> malformado, `field:""` reservado ao corpo-como-um-todo (contrato +
> §3.PR-3a); (5) mudança da mensagem do 404 de content é DECLARADA, com o
> literal no replay (§3.PR-2). Implementa as decisões fechadas do aval do
> pre-check ([`B3-PRECHECK.md`](B3-PRECHECK.md)): D1 flat · D2
> 404-em-tudo · D3 taxonomia fechada · D4 429 com code · D5 recorte
> não-JSON + proxy envelopado · D6 no primeiro PR · D7 um detail por
> chave · D0 alias aposentado · D8 fora do B3 (registro no plano).
>
> **Data**: 2026-08-28 · **Base**: `main` (`9885ab1`)

---

## 0. Pré-condições (respondidas antes do desenho)

### 0.1 Rate limiter — onde vive o estado, e o 429 do pre-check

**Store é memória por instância de lambda**: [`lib/user-rate-limit.ts:74`](../../lib/user-rate-limit.ts:74)
(`const store = new Map<string, Entry>()`, módulo-escopo), com a nota de
arquitetura explícita no cabeçalho do próprio arquivo
([`user-rate-limit.ts:12-16`](../../lib/user-rate-limit.ts:12)): "Map em
memória POR INSTÂNCIA de lambda — janelas independentes por instância".
Não há Upstash/Redis/KV em lugar nenhum (zero imports de store externo no
repositório).

**Houve lockout real de prod? Tecnicamente sim, efetivamente inócuo — e a
guarda existe para isso nunca mais depender de sorte.** O 429 do pre-check
foi provocado no deployment que **é** o de produção (git-main = o
deployment servido por `octavia.rocks`). O que ficou travado: a chave
`ip:<IP do Marcel>:session-authfail` (janela 10/15min), **numa única
instância warm**, por ~14,5min (`retryAfter 868s` medido). Alcance real:
essa família só gate-keia `POST /api/auth/session` com **token inválido**
([`session/route.ts:29-36`](../../app/api/auth/session/route.ts:29)) —
login com token válido usa outra família e nunca a consulta. Ou seja:
durante ~15min, tentativas de sessão *com token inválido*, *do IP do
Marcel*, *que caíssem na mesma instância*, receberiam 429. Nenhum uso
legítimo passa por esse caminho. Efêmero (por instância + janela) e sem
sintoma. **Mas o pre-check não sabia disso ao provocar** — a provocação num
deployment que serve prod foi um erro de guarda, não uma decisão. Guarda
reescrita em §5.3.

### 0.2 Prova de restauração do PATCH /api/profile

**Leitura pré-escrita NÃO foi capturada** — declaro o furo: o probe do
pre-check escreveu sem ler antes. O que há:

```
[medido 2026-08-28] GET /api/profile (git-main, user de audit) -> 200
  full_name="Marcel Viana"  first_name="UX"  last_name="Tester"
  bio=null  website=null
```

`full_name: "Marcel Viana"` é o **mesmo literal** que o ciclo B2 usou e
validou neste mesmo perfil de audit (payload real medido no
[`B2-PRECHECK.md`](B2-PRECHECK.md) §2.7 e validação em preview da PR-1) —
o estado é consistente com o valor de longa data; `first/last/bio/website`
intactos. **Nada a restaurar; registro fechado.** Lição incorporada ao
toolkit (§5.3): probe que escreve captura leitura-prévia **antes** do
primeiro write, sempre.

### 0.3 Classe 413 — MEDIDA (com achado novo)

```
[medido] POST /api/setlists  body JSON 2MB (rota com middleware)  -> 400 application/json
  {"error":"Validation failed","code":"VALIDATION_ERROR",
   "details":[{"code":"invalid_type","message":"Invalid request body format",
               "path":[],"expected":"object","received":"unknown"}]}

[medido] POST /api/setlists  body JSON 6MB                        -> 413 text/plain
  Request Entity Too Large  FUNCTION_PAYLOAD_TOO_LARGE  gru1::…

[medido] POST /api/content   body JSON 2MB (title inválido p/ não inserir) -> 400 application/json
  {"error":"Validation failed","message":"title: String must contain at most 255 character(s)",
   "details":["title: …"],"timestamp":"…"}     ← corpo de 2MB PARSEADO sem guard

[medido] POST /api/storage/upload  multipart 6MB                  -> 413 text/plain
  Request Entity Too Large  FUNCTION_PAYLOAD_TOO_LARGE  gru1::…
```

Três consequências:

1. **413 é da plataforma Vercel** (limite 4,5MB), texto puro, fora dos
   handlers → entra na **cláusula não-JSON** do contrato (D5), nomeado com
   o literal acima.
2. **🆕 Achado — quarta variante DENTRO da família semente**: o guard de
   1MB do middleware responde `VALIDATION_ERROR`, mas com `details` =
   issues **crus** (`path`/`expected`/`received`, sem `field`). Causa: o
   catch de `ValidationError` serializa `error.issues` sem passar pelo
   mapper ([`api-validation-middleware.ts:190-201`](../../lib/api-validation-middleware.ts:190)
   — compare com o caminho normal em [`:173-177`](../../lib/api-validation-middleware.ts:173)).
   Morre no PR-1 (mapper único, §2).
3. **Assimetria de guard**: rotas do middleware barram JSON >1MB (400);
   `/api/content` parseia 2MB sem guard (só a plataforma barra em 4,5MB).
   Proposta: paridade — content adota o guard de 1MB na sua PR de migração
   (ver §8-B, pede aval por apertar rota viva).

### 0.4 D7 cobre multi-chave

Sim — desenho e gate: `zodDetails()` emite **um detail por chave** de
`issue.keys` (§2.2), e o contract test previsto envia payload com **duas**
chaves desconhecidas e assert `details.length === 2` com os dois nomes
(§4, gate G-D7). Controle negativo: o comportamento atual medido
(`field:""`, um issue só) é a falha esperada.

---

## 1. Espec do envelope — o doc de contrato

**Nome/local**: **[`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md)**
(diretório novo `docs/api/` — contratos que o nativo herda são de API, não
de UX; o próximo, ex.: shapes de leitura do B7, já tem casa). Entra no
**PR-0** com nota de vigência ("integral ao fim do B3; por rota conforme a
PR que a migra"). **O texto integral vive no próprio arquivo** (criado no
PR-0), já com as emendas do aval incorporadas:

- **Emenda 3** — cláusula de tolerância a campos, ao lado do append-only
  de `code`: "o cliente ignora campos que não conhece no envelope" —
  campos novos entram sem quebrar cliente nativo shipado.
- **Emenda 4** — `field: ""` é **RESERVADO** para "o corpo como um todo"
  (JSON malformado, corpo >1MB); **id de path malformado usa
  `field: "id"`** (exemplo normativo no contrato; código no PR-3a).

Demais conteúdos (inalterados do aprovado): envelope flat com `error`/
`code`/`details`; taxonomia fechada de 5 codes com mapeamento 1:1
code↔status nas duas direções; `details` só em `VALIDATION_ERROR`, um
item por chave desconhecida (D7); headers autoritativos do 429; cláusula
não-JSON (405 vazio · 404-de-rota HTML · 413 de plataforma, literais
medidos); exemplos normativos medidos.

**Emenda que este contrato exige no plano** (§B3 nested→flat): texto em
§5.1.

## 2. Ponto único — `lib/api-errors.ts`

### 2.1 Onde vive e o que é

Módulo novo **`lib/api-errors.ts`**, **sem imports de `next/server`**
(`Response` puro — mesma restrição e pelo mesmo motivo do
`user-rate-limit`: é importado por módulos no grafo dos funis de auth).
Rascunho de assinatura (não é código de produção; é o desenho):

```ts
export const STATUS_BY_CODE = {
  AUTH_REQUIRED: 401,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const
export type ApiErrorCode = keyof typeof STATUS_BY_CODE

export interface ApiErrorDetail { field: string; message: string; code: string }

/** Construtor único. Status DERIVADO do code — par inconsistente é impossível. */
export function apiError(
  code: ApiErrorCode,
  error: string,                            // mensagem humana
  // Emenda 2 do aval: `extra` FECHADO — o único campo extra do envelope
  // é o retryAfter do 429. Envelope não cresce sem tocar este tipo;
  // campo não previsto não compila.
  opts?: { details?: ApiErrorDetail[]; headers?: Record<string, string>; extra?: { retryAfter?: number } }
): Response

// Atalhos com as mensagens canônicas (as strings ficam AQUI, uma vez):
export function authRequired(error = 'Authentication required'): Response   // + WWW-Authenticate: Bearer
export function notFound(error = 'Resource not found'): Response
export function internalError(error = 'Internal server error'): Response
export function validationError(zodError: z.ZodError): Response             // apiError('VALIDATION_ERROR', 'Validation failed', { details: zodDetails(...) })

/** Mapper único de issues Zod → details. Inclui D7. */
export function zodDetails(issues: z.ZodIssue[]): ApiErrorDetail[]
```

`opts.extra` existe para **um** uso: o `retryAfter` do 429 (D4) — e o
tipo diz exatamente isso (emenda 2: nada de `Record<string, unknown>`).
A taxonomia é um `const` fechado — `code` fora da lista não compila.

### 2.2 `zodDetails` — as duas correções de mapper

1. **D7** — `issue.code === 'unrecognized_keys'` → expande para **um
   detail por chave** de `issue.keys`, com `field` = a chave, `message` =
   `Unrecognized key: '<chave>'`, `code` = `unrecognized_keys`. Nunca só
   `keys[0]`; nunca `field:""` (princípio SAN-01: nenhuma chave ofensora
   silenciada).
2. **Achado §0.3** — o caminho de `ValidationError` sintética
   (`parseRequestBody`: JSON malformado, corpo >1MB) passa pelo **mesmo**
   mapper: `field:""` ("o corpo como um todo", cláusula do contrato),
   `message` humana, `code:'invalid_type'`. Morrem os `path/expected/
   received` crus medidos.

### 2.3 Quem morre, quem migra — os 6 idiomas do pre-check §4

| Idioma hoje | Destino |
|---|---|
| **#1 middleware** ([`api-validation-middleware.ts`](../../lib/api-validation-middleware.ts)) | **migra por dentro**: os 3 builders inline (401/400/500) viram chamadas a `authRequired()`/`validationError()`/`internalError()`. Output byte-idêntico nos casos já-semente (os contract tests do B2 provam); único delta observável é o §0.3-2 (details crus → mapeados). O middleware CONTINUA sendo o envelope das rotas `withValidation` — ele só passa a **delegar a construção** ao ponto único |
| **#2 `validation-utils.ts`** (`create*Response`) | **o arquivo morre inteiro**. Contagem de callers (medida): `createValidation/Server/Unauthorized/NotFoundResponse` só em content + storage/delete (migram); `validateRequestBody` 5 callers (mesmas rotas — viram `schema.safeParse` + `validationError()`); `validateQueryParams`, `validateFileUpload`, `createRateLimitResponse`, `RateLimiter`, `sanitizeFilename` = **0 callers, órfãos** (o `sanitizeFilename` vivo é outro, local de [`upload-to-storage.ts:13`](../../components/add-content/upload-to-storage.ts:13)) |
| **#3 `user-rate-limit.rateLimited`** | **fica onde está**, passa a construir o corpo via `apiError('RATE_LIMITED', …, { extra: { retryAfter }, headers: X-RateLimit-* })` (D4). Direção de import: `user-rate-limit → api-errors`, sem ciclo (api-errors não importa nada do app) |
| **#4 inline espalhado** (`NextResponse.json({error},{status})`) | substituído rota a rota pelos atalhos (PRs 2, 3a, 3b) |
| **#5 storage/upload inline** | migra; os `details: string[]` viram details estruturados (issues do `storageSchemas.upload` têm path real: `filename`/`contentType`/`size`) |
| **#6 proxy texto** | envelopado (D5), PR-4. Normalização do upstream: §8-A |
| **bônus: `withSecureAuth`** ([`secure-auth-utils.ts:323`](../../lib/secure-auth-utils.ts:323)) | **7º construtor descoberto no desenho — e órfão** (0 callers, medido). Morre na varredura do PR-4 |

O reorder ([`songs/[songId]/route.ts:182-196`](../../app/api/setlists/songs/[songId]/route.ts:182)),
que copiou o shape semente à mão na PR-6 do B2, passa a importar
`validationError()` — a prova-viva de que sem helper a uniformidade
dependia de memória vira o primeiro cliente do helper.

### 2.4 Mensagens canônicas

As strings humanas ficam **nos atalhos** (uma vez cada). Unificação que
vem de carona: todos os 401 passam a dizer `Authentication required`
(hoje: 5 variantes — `Unauthorized`, `Authentication required`,
`Invalid or expired token`, …). Exceção deliberada mantida: o 401 de
`POST /api/auth/session` com token inválido continua `Invalid or expired
token` (mensagem mais útil, mesmo `code`) — `apiError('AUTH_REQUIRED',
'Invalid or expired token')`. Os 404 mantêm as mensagens específicas por
recurso (`Setlist not found`, `Content not found`); `code` é o contrato,
a mensagem é UI.

---

## 3. Fatiamento em PRs (com análise de dependência)

Ordem: **PR-0 → PR-1 → PR-2 → PR-3a → PR-3b → PR-4**. PR-1 é
pré-requisito de todos os seguintes (o helper). PR-2 e PR-3a/3b são
independentes entre si (ordem escolhida por risco: contrato de content é
o caminho mais vivo da web). O fatiamento 3a/3b já nasce fatiado —
lição do PR-4→4a/4b/4c do B2, decidido ANTES, não durante.

Protocolo por PR (o do B2, com a G2 nova): diff + testes + texto → aval →
validação em **URL de branch** (`octavia-git-<branch>-…`, D0; bypass por
header em fetch Node, `--retries=0`, relatório quantitativo) → aval →
merge → confirmação em prod. Regra nº 7 em cada uma (§4).

### PR-0 — infra/tooling/docs (sem código de produção)

| Item | Detalhe |
|---|---|
| `docs/api/CONTRATO-DE-ERRO.md` | o contrato de §1, com nota de vigência |
| Emenda §B3 do PLANO-TRANSICAO | nested→flat (texto em §5.1) |
| Registro D8 no plano | loop mudo do session → item de abertura do Bloco D, prioridade máxima (texto em §5.2) |
| Aposentadoria do alias (D0) + G2 reescrita | guarda nova no `g2-limiter-unico.spec.ts` + notas nos docs (texto em §5.3). **Commit próprio de tooling** |
| Versionar `B3-PRECHECK.md` e `B3-DESENHO.md` | registro do ciclo, padrão B2 |

Aceite: `pnpm test` verde (a mudança de guarda do G2 tem controle
negativo próprio, §4-G0), zero mudança de comportamento de app.

### PR-1 — núcleo: `lib/api-errors.ts` + middleware + D6

| Commit | Escopo |
|---|---|
| 1 | `lib/api-errors.ts` + `contract-errors.test.ts` (o gate do módulo: taxonomia, 1:1 status↔code, D7 multi-chave, mapper de ValidationError sintética) |
| 2 | `api-validation-middleware.ts` delega aos helpers (byte-idêntico nos casos semente — os contract tests do B2 rodam intocados e provam); conserta o §0.3-2 (details crus). Reorder importa `validationError()` |
| 3 (**próprio**, D6) | [`storage/delete/route.ts:62`](../../app/api/storage/delete/route.ts:62): `Delete failed: ${error.message}` → `internalError('File deletion failed')`. Controle negativo por mock (§4-G1) |

**Cronograma do D6**: PR-1 é a primeira da fila e a menor — pelo ritmo do
B2 (9 PRs em 4 dias), o merge projetado é **dias, não semana**. A cláusula
"se >1 semana, vira fix imediato" não deve disparar; se a validação da
PR-1 travar por qualquer motivo, sinalizo e destaco o commit 3.

Muda rota viva? Só o shape do details no caso-borda de corpo >1MB/JSON
inválido (declarado; nenhum caminho da web o produz — medido no §0.3).

### PR-2 — content + storage (o contrato mais vivo da web)

Rotas: `/api/content` (GET/POST/PUT/DELETE), `/api/content/[id]`
(GET/DELETE), `/api/storage/upload`, `/api/storage/delete`.

| Mudança | De → para |
|---|---|
| 401 | `{error,message,timestamp}` (utils) e `{error}` (inline) → `authRequired()` |
| 400 validação | `details: string[]` + `message` + `timestamp` → semente via `validationError()` |
| 404 | `{error:'…'}` → `notFound('Content not found')`. **Emenda 5 — MUDANÇA DECLARADA de mensagem**: `"Content not found or access denied"` → `"Content not found"` (o sufixo mentia — com D2 não há oráculo a disfarçar). O literal novo entra na lista de conferência do replay |
| 500 | 3 variantes → `internalError()` |
| **Paridade do guard 1MB** | content adota o guard (§8-B — pede aval) |
| Morte | **`lib/validation-utils.ts` inteiro** (últimos callers migram aqui) |

**Aperta rota viva** → replay verbatim em preview dos payloads reais do
§3 do pre-check: create draft/upload ([`useAddContentLogic.ts`](../../hooks/useAddContentLogic.ts)),
update do editor, delete, upload de PDF real — caminho feliz 2xx
inalterado + cada classe de erro com o shape novo. Lista de conferência
inclui o literal novo do 404 (`"Content not found"`, emenda 5) e o guard
de 1MB (decisão B: 2MB → 400 `VALIDATION_ERROR` `field:""`; payloads
reais em KBs → 2xx).

### PR-3a — comportamento: D2 + paridade 400 (setlists/songs)

A PR de **mudança de semântica** — isolada para revisão focada.

| Mudança | Onde | De → para (medido no pre-check) |
|---|---|---|
| **D2**: recurso de outro usuário | `PUT /api/setlists/songs/[songId]` | 403 `{"error":"Unauthorized"}` → **404** `NOT_FOUND` |
| **D2**: idem | `DELETE /api/setlists/songs/[songId]` | `throw` → 500 → **404** `NOT_FOUND` |
| songId inexistente (PGRST116 tratado) | ambas | 500 → **404** (os ramos `if(!song)→404` mortos viram o caminho real: PGRST116 → `notFound()`) |
| id malformado | `GET/PUT/DELETE /api/setlists/[id]` | 500 (uuid cru no Postgres) → **400** `VALIDATION_ERROR` via `commonSchemas.objectId`, com **`details:[{field:"id",…}]`** (emenda 4 — `field:""` fica reservado ao corpo-como-um-todo). `content/[id]` alinha o mesmo shape ao migrar (PR-2) |
| Envelope | as mesmas rotas, no mesmo toque | inline → helpers (evita segundo churn nos arquivos) |

Rotas vivas (delete-song é fluxo real; reorder é morto na web) → replay
verbatim: add/remove song do fluxo do `setlist-manager`, e os casos de
erro por probe.

> **[REGISTRO da execução, aval do PR-3a, 2026-08-29]** (a) **Mudança
> extra executada**, mesma classe PGRST116: `PUT /api/setlists/[id]` em
> setlist inexistente era `throw` → 500 (o teste legado codificava o
> defeito com nome de 404) → agora **404 real** `NOT_FOUND`. (b)
> **Comportamento observável do contrato**: `DELETE` de recurso
> inexistente (setlist E content, rotas sem `.single()` no delete) é
> **200 idempotente** `{success:true}` — o cliente nativo O VERÁ; se um
> dia virar 404, é **mudança de contrato**, não bugfix.

### PR-3b — envelope mecânico: setlists restantes + profile + session

Rotas: `GET /api/setlists`, `POST /api/setlists` (os 400/500 custom do
handler), `POST /api/setlists/[id]/songs` (wrapper + 500), `GET
/api/profile` + inline dos POST/PATCH, `POST/DELETE /api/auth/session`
(inline 401/500), `/api/debug/config`. Zero mudança de status — só shape
(`+code`). Replay verbatim: create setlist com songs (fluxo PR-5 do B2),
profile PATCH, login→session.

> **[EMENDA do aval do PR-1, 2026-08-28] Flip do D7 no middleware — é
> AQUI, como mudança declarada.** No PR-1, a exigência de byte-identidade
> (§4.1) impediu o middleware de adotar o mapper default do contrato: o
> caminho de validação chama `validationError(err,
> { expandUnrecognizedKeys: false })` (mapping antigo do
> `unrecognized_keys`: um item, `field:""`). Neste PR-3b: (a) o flip para
> o default do contrato (um detail POR CHAVE, D7) acontece nas rotas do
> middleware, com replay verbatim e controle negativo (o literal
> `field:""` do pre-check §2.2 é a falha esperada); (b) **o parâmetro
> `expandUnrecognizedKeys` é REMOVIDO de `lib/api-errors.ts`** — o helper
> não mantém modo não-contrato após o PR-3b (o teste do flag em
> `contract-errors.test.ts` morre junto; os asserts de camada 2 do
> unrecognized mudam para o shape D7 como mudança declarada DESTE PR).

### PR-4 — 429 (D4) + proxy (D5) + varredura final

| Item | Detalhe |
|---|---|
| **D4** | `rateLimited()` constrói via `apiError`: corpo ganha `code:'RATE_LIMITED'`, mantém `retryAfter` e TODOS os headers. Atualiza os 7 `it()` de `lib/__tests__/user-rate-limit.test.ts` (conjunto B, §4.1) + o assert de assinatura do G2 (que ganha `code` no corpo) |
| **D5 proxy** | os 4 sites de texto viram envelope: 401 `authRequired()`, 400 `validationError`-like (`VALIDATION_ERROR` com mensagem da causa), 500 `internalError()`. Upstream `!ok`: §8-A |
| Mortes | `withSecureAuth` (órfão, §2.3) |
| Varredura | grep-gate final: zero `NextResponse.json({ error` fora de `api-errors` nos handlers; tabela rota×classe×shape re-medida no corpo da PR (o espelho da tabela-mestre do pre-check, agora uniforme) |

---

## 4. Plano de gates (regra nº 7 — controle negativo por mudança)

Todos em `pnpm test` (gate de merge), exceto G0 (spec Playwright
sob demanda). Controles negativos: onde o comportamento atual já foi
**medido no pre-check**, a saída literal registrada É o controle — a
execução formal contra a árvore sem o fix confirma.

| Gate | Prova que pega | Controle negativo (falha esperada contra o código atual) |
|---|---|---|
| **G0** — guarda G2 nova (PR-0) | provocação de limiter recusada fora de URL de branch | rodar o spec com `UX_AUDIT_BASE_URL=https://octavia-git-main-…` → **recusa antes de qualquer request** (hoje: passa, foi exatamente o furo do pre-check §0.1) |
| **G1** — D6 (PR-1) | mensagem interna de storage não vaza | mock de `supabase.storage.remove` → `{ error: { message: 'SENTINELA-interna-do-supabase' } }`; assert: corpo NÃO contém a sentinela e `error === 'File deletion failed'`. Contra o atual: **falha com a sentinela no corpo** (`Delete failed: SENTINELA…`) |
| **G-D7** (PR-1) | multi-chave | payload com `{__b3_x__:1, __b3_y__:2}` → `details.length === 2`, fields nomeados. Contra o atual: 1 item, `field:""` (literal do pre-check §2.2) |
| **G-sintética** (PR-1) | corpo >1MB / JSON inválido mapeado | assert `details[0]` tem `field:""` e NÃO tem `expected`/`received`. Contra o atual: falha (literal do §0.3) |
| **G-módulo** (PR-1) | taxonomia 1:1 | para cada `code`: status do mapa; `code` fora da união não compila (type-level) |
| **G-content/storage** (PR-2) | envelope nas 4 classes das 8 rotas | asserts de shape por rota (mock de auth + supabase, padrão dos route tests existentes). Contra o atual: falham com `{error,message,timestamp}` / `details:string[]` (literais do pre-check §2.1/2.2) |
| **G-D2** (PR-3a) | 404 sem oráculo | mock: song cujo `setlists.user_id ≠ uid` → PUT **404** e DELETE **404**; songId inexistente (PGRST116) → 404. Contra o atual: PUT→403, DELETE→500, inexistente→500 (literais §2.5) |
| **G-malformado** (PR-3a) | paridade 400 | `GET/PUT/DELETE /api/setlists/not-a-uuid` → 400 `VALIDATION_ERROR`. Contra o atual: 500 (literal §2.4) |
| **G-D4** (PR-4) | 429 com code | corpo tem `code:'RATE_LIMITED'` + `retryAfter` + os 5 headers. Contra o atual: sem `code` (literal §2.8) |
| **G-proxy** (PR-4) | JSON no proxy | 401/400 são `application/json` no envelope. Contra o atual: `text/plain` (literal §2.1/2.3) |
| **G-varredura** (PR-4) | ponto único não erode | teste que importa cada handler? Não — frágil. O gate é **estrutural por construção** (`STATUS_BY_CODE` fechado) + grep-gate no CI da PR-4 (declarado no corpo) + os contract tests por rota que já cobrem cada classe |

**Estimativa de contract tests novos**: ~50 asserts distribuídos em ~6
arquivos (`contract-errors` ~14 · content/storage ~15 · D2+malformado ~8
· D6 2 · D4 ~5 · proxy ~5). Baseline atual 511 passed → projeção ~560.

### 4.1 Conjuntos de contract tests, nominalmente (emenda 1 do aval)

Contagem medida (2026-08-28, branch do PR-0). **Três conjuntos, interseção
VAZIA** — nenhum arquivo pertence a dois conjuntos:

**Conjunto A — contract tests do B2** (schema-level, `lib/__tests__/`,
7 arquivos): `contract-content` (12 its) · `contract-d1-gate` (1) ·
`contract-drift` (2) · `contract-profile` (10) · `contract-sanitize`
(13) · `contract-setlist` (19) · `contract-storage` (7). **Não mudam em
NENHUM PR do B3** — e a razão precisa é mais forte que "D1-flat garante":
eles testam **semântica de parse dos schemas Zod**, uma camada ABAIXO do
envelope HTTP. Medição que o prova: `grep VALIDATION_ERROR` em todos os
`*.test.ts`/`*.spec.ts` do repositório → **zero ocorrências**. Corolário
(achado da emenda): **o shape semente não tem gate unitário hoje** — foi
validado por probes de preview no B2; o `contract-errors.test.ts` do PR-1
será seu **primeiro** gate de shape. Sem interseção, sem contradição com
o argumento do D1.

> **Consequência vinculante para o PR-1 (exigência do aval do PR-0,
> 2026-08-28)**: a prova de byte-identidade da delegação do middleware
> **não pode se apoiar nos testes do B2** — eles não olham o envelope
> (achado acima). Sequência obrigatória do PR-1: os asserts de shape
> semente do `contract-errors.test.ts` são escritos e ficam **VERDES
> contra o middleware ATUAL, antes da delegação** (commit 1); só então a
> delegação acontece (commit 2), e os mesmos asserts verdes depois dela
> são a prova. A ordem dos commits 1→2 do PR-1 fica condicionada a isso.

**Conjunto B — limiter** (1 arquivo): `lib/__tests__/user-rate-limit.test.ts`
— **7 `it()` num único arquivo** (a frase "os 7 contract tests do
user-rate-limit" do §3.PR-4 lê-se assim). Muda **só no PR-4** (D4: o
assert do corpo do 429 ganha `code:'RATE_LIMITED'`; hoje assert
`body.error` e `body.retryAfter`).

**Conjunto C — testes de rota** (`app/api/**/__tests__/`, 9 arquivos,
assertam status + corpo por rota). Estes mudam conforme a rota migra —
tabela por PR:

| PR | Arquivos de teste EXISTENTES que mudam |
|---|---|
| PR-0 | nenhum (G2 spec é Playwright sob demanda, fora do `pnpm test`) |
| PR-1 | `app/api/storage/__tests__/delete.test.ts` (o assert da linha 202, `data.message` contendo `'Delete failed'`, é exatamente o vazamento D6 — inverte para: mensagem genérica, sentinela ausente). Middleware byte-idêntico → `session.test.ts`/`profile/route.test.ts` intocados |
| PR-2 | `content/__tests__/route.test.ts` (8 asserts de erro) · `content/[id]/__tests__/route.test.ts` (1) · `storage/__tests__/upload.test.ts` (1) · `storage/__tests__/delete.test.ts` (6) |
| PR-3a | `setlists/[id]/__tests__/route.test.ts` (11) · rotas de `songs/[songId]` não têm teste (o arquivo de 9 `it.skip` morreu no B2/PR-5) → testes NOVOS |
| PR-3b | `setlists/__tests__/route.test.ts` (5) · `profile/__tests__/route.test.ts` (21) · `auth/__tests__/session.test.ts` (4) |
| PR-4 | `lib/__tests__/user-rate-limit.test.ts` (conjunto B) · proxy não tem teste → NOVO. `setlists/__tests__/create-compensating.test.ts` (3 asserts de erro) só se o shape do 500 compensatório mudar — conferido na PR |

---

## 5. Emendas e tooling (textos prontos)

### 5.1 Emenda §B3 do PLANO-TRANSICAO.md

No bloco "Espec proposta" do §B3, substituir o primeiro bullet por:

> - Toda resposta não-2xx carrega corpo estruturado **flat**: `{ error,
>   code, details? }` — **[EMENDADO 2026-08-28, aval do pre-check do B3]**:
>   a espec original dizia `{ error: { code, message, details? } }`
>   (nested), escrita antes de o B2 cravar o shape flat como semente
>   testada em 7 arquivos de contract tests; o flat estende a semente sem
>   quebrar gate nem cliente. Contrato completo:
>   `docs/api/CONTRATO-DE-ERRO.md`.

### 5.2 Registro D8 no plano (Bloco D)

Inserir no topo do Bloco D, antes da tabela:

> **Item de abertura do Bloco D — prioridade máxima (registrado no B3,
> 2026-08-28)**: o **loop mudo do `POST /api/auth/session`** — falha no
> set do cookie é engolida ([`firebase-session-cookies.ts:22`](../../lib/firebase-session-cookies.ts:22)
> → catch de [`firebase-auth-context.tsx:189`](../../contexts/firebase-auth-context.tsx:189),
> no-op em prod), o fetch de perfil é pulado e o middleware devolve o
> usuário a `/login` na navegação seguinte — "login OK → volta pro login"
> sem nenhuma mensagem. Evidência completa: `docs/ux/B3-PRECHECK.md` §3.
> Fora do escopo do B3 por decisão (D8); quando o Bloco D abrir, começa
> aqui.

### 5.3 D0 + G2 reescrita (tooling, commit próprio no PR-0)

**Guarda nova do G2** (substitui `BASE_URL.includes('octavia.rocks')` em
[`g2-limiter-unico.spec.ts:35`](../../tests/ux-audit/fase-d/g2-limiter-unico.spec.ts:35)):

```ts
// G2: estouro deliberado SÓ em deployment de branch — nunca no deployment
// que serve produção, sob QUALQUER url (octavia.rocks, git-main e o alias
// aposentado octavia-preview servem/serviram o MESMO deployment/estado).
const BRANCH_PREVIEW = /^https:\/\/octavia-git-(?!main-)[a-z0-9-]+-marcelvianas-projects\.vercel\.app$/
if (!BASE_URL || !BRANCH_PREVIEW.test(BASE_URL)) {
  throw new Error('G2 recusa rodar: alvo não é preview de BRANCH (git-<branch>≠main). …')
}
```

**Notas nos docs** (PLANO §"Padrão de instrumentação" + toolkit): (a)
`octavia-preview.vercel.app` **aposentado** — apontava para deployment
podre (pré-B2-PR-3, medido no pre-check §0); toda validação usa
`octavia-git-<branch>-…`; (b) regra de estado: **probe que escreve captura
leitura-prévia antes do primeiro write** (furo do §0.2); (c) G2 reescrita
como acima. *(Atualizo também a memória de sessão do toolkit com os
mesmos três pontos.)*

---

## 6. Impacto no cliente web (nada regride)

Invariante preservado: **`.error` continua string em toda resposta** — e é
o único campo que qualquer cliente web lê (§3 do pre-check: zero leitores
de `code`/`details`/`message`/`timestamp`/`retryAfter`). Nenhum cliente
faz lógica sobre o texto de `error` (varrido: as ocorrências de
"Unauthorized"/"Authentication required" no client são strings geradas
pelo próprio cliente, não comparações). Caso a caso:

| Mudança | Call site que observa (§3 do pre-check) | Efeito |
|---|---|---|
| 400 de content: `details:string[]`→semente, `message`/`timestamp` morrem | [`content-service.ts:515`](../../lib/content-service.ts:515) e demais — leem só `.error` | `.error` continua literalmente `"Validation failed"`. Zero leitores dos campos que morrem (medido) |
| 401 unificado (`Unauthorized`→`Authentication required`) | alert de create ([`useAddContentLogic.ts:258`](../../hooks/useAddContentLogic.ts:258)) | texto do alerta muda cosmeticamente; sem lógica sobre a string |
| 403→404 (PUT songs) | [`setlist-manager.tsx:280`](../../components/setlist-manager.tsx:280) — reorder é **feature morta** (TODO; `updateSongPosition` nunca chamado) | zero observadores |
| 500→404 (DELETE songs: cross-user/inexistente) | [`setlist-service.ts:321`](../../lib/setlist-service.ts:321) lê `.error` | toast melhora: `Internal server error` → `Song not found`. Caso cross-user é inalcançável na web (single-user) |
| 500→400 (setlists/[id] malformado) | [`setlist-service.ts:197`](../../lib/setlist-service.ts:197) — só interpola o status | web nunca envia id malformado (ids vêm do servidor); se ocorresse, "…: 400" em vez de "…: 500" |
| proxy texto→JSON | [`offline-cache.ts:176`](../../lib/offline-cache.ts:176) (`throw new Error(text)`) e [`advanced-content-cache.ts:311`](../../lib/advanced-content-cache.ts:311) (só status) | mensagem de log passa a ser JSON-string; nenhum parse do corpo, nenhum fluxo muda |
| 429 ganha `code` | — | zero leitores de corpo de 429 (medido) |
| guard 1MB no content (§8-B, se aprovado) | create/update de content | payloads reais da web são KBs (texto); replay verbatim da PR-2 prova; 1MB é ~4× o maior content_data plausível de cifra |
| D6 (mensagem do delete de storage) | UI web não exibe esse corpo | só o tooling de cleanup o via |

---

## 7. Escopo declarado

**Cobre**: os 13 arquivos de rota; os 7 construtores de erro (6 do
pre-check + `withSecureAuth` órfão); o contrato novo em `docs/api/`;
emendas do plano; tooling D0/G2; ~50 contract tests.

**Não cobre** (e para onde vai): D8 (loop mudo do session) → abertura do
Bloco D (§5.2) · consumo do contrato no cliente web (Bloco D — a web
continua lendo só `.error`) · camada de rede central do nativo (nasce no
RN, consumindo este contrato) · idempotência (B9) · 405 com `Allow` e
404-de-rota em JSON (fora do contrato por D5, cláusula escrita) · corpo
dos 2xx (fora do B3; shapes de leitura são B7).

---

## 8. Pontos abertos pelo desenho — ✅ todos decididos no aval (2026-08-28)

- **A — Proxy: normalização do upstream `!ok`.** ✅ **APROVADO**: upstream
  404 → nosso `404 NOT_FOUND`; qualquer outra falha upstream → `500
  INTERNAL_ERROR`. (Contexto: o status do upstream vazava cru — um 403 do
  Supabase Storage viraria "nosso" 403, furando a taxonomia. Consumidores
  só checam `res.ok`, medido no §6 — sem regressão.) Executa no PR-4.
- **B — Paridade do guard de 1MB no `/api/content`.** ✅ **APROVADO**:
  content adota o guard na PR-2; o contrato fica uniforme (">1MB → 400;
  >4,5MB → 413 plataforma"). Aperto de rota viva → coberto pelo replay
  verbatim da PR-2 (payloads reais são KBs).
- **C — Registro de restauração do profile.** ✅ **FECHADO** com o GET
  atual (§0.2): `full_name="Marcel Viana"`, consistente com o B2; nenhum
  PATCH corretivo necessário.

---

*Aprovado. Execução: PR-0 → PR-1 → PR-2 → PR-3a → PR-3b → PR-4, uma por
vez, ciclo completo, validação em URL de branch (D0).*
