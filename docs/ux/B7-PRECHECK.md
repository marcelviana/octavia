# B7-PRECHECK.md — Bloco B7: higiene web (herança C + N0)

> **Data**: 2026-09-08 · HEAD medido: `06bf93e` (merge de #270; main = origin/main, árvore limpa no início). Sessão nova e dedicada. **Zero commit de código, zero escrita em prod, zero migração, zero console.** Orçamento de prod: **3 requests de 12** (§7).
> Insumos obrigatórios lidos: tabela "Herança do Bloco C para o Bloco B" ([`PLANO-TRANSICAO.md:629-641`](PLANO-TRANSICAO.md)), §9 do [`N0-ENCERRAMENTO.md`](../native/N0-ENCERRAMENTO.md), [`C-ENCERRAMENTO.md`](C-ENCERRAMENTO.md), seção "⚠️ Divergências" do [`C-PRECHECK.md:20-55`](C-PRECHECK.md), [`PRD-TELA-1.md`](../native/PRD-TELA-1.md) §3/§4/§11, [`CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md), [`SETLISTS.md`](../api/SETLISTS.md), [`STORAGE.md`](../api/STORAGE.md).
> Anexos em [`B7-PRECHECK-anexos/`](B7-PRECHECK-anexos/) — cada um abre com o comando que o gerou.
> Convenção: `[medido]` = comando + saída literal nesta sessão; `[hipótese]` = tudo o mais.

---

## 0. Decisões do Marcel (2026-09-08) — B7-D1…D10, fechadas no aval

| # | Decisão | Fundamento (§ deste doc) |
|---|---|---|
| **B7-D1** | Nome do bloco: **"B7 — higiene web (herança C + N0)"** | §5 C4 |
| **B7-D2** | **H-N2 (151 erros de `tsc -p tsconfig.test.json`) adiado para o B8**; no B7, recorte zero | §3 H-N2 |
| **B7-D3** | `Cache-Control: private, no-store` em `/api/*` via **`headers()` em `next.config.mjs`**, com **`/api/proxy` fora** (mantém os headers do upstream) | §3 H-C1; emenda E1 |
| **B7-D4** | Remover a **interface `Setlist` inteira** de `types/setlist.ts` (não só a linha `event_date`) | §3 H-C6 |
| **B7-D5** | Zod de `content_data` **tipado-passthrough** (opção b): exige a chave do tipo com o tipo certo, `Sheet`→`null`+`file_url`, chaves extras passam. **A PR5 espera a leitura da conta principal pelo Marcel** — estado: **pendente** (nada colado até este commit) | §3 H-C2; div. 3; emenda E5 |
| **B7-D6** | Flake H-N1: opção (a) — trocar a razão `×1,5` por **tolerância absoluta de 10 ms** (`secondHalfAvg − firstHalfAvg < 10`), mantendo `max < 100` e `avg < 50` | §3 H-N1; emenda E6 |
| **B7-D7** | `docs/api/AUTH.md` **reescrito como contrato de servidor** (molde do `STORAGE.md`), citando o PRD §3 como lado do cliente | §3 H-C7 |
| **B7-D8** | Policies do storage **versionadas por dump** (`supabase db dump -s storage`) — passo do Marcel; prova = emenda E2 | §3 H-C8 |
| **B7-D9** | `react-dom: 19.2.3` em `devDependencies` de `apps/native` — motivo em E4 | §3 H-N3 |
| **B7-D10** (nova) | `ci.yml` de **Node 20 → 22** na PR7, com durações antes/depois | §4 B1; div. 7; emenda E3 |

---

## 1. Divergências entre o prompt e o encontrado (regra 3) — 8, aceitas no aval

1. **"§12 do C-PRECHECK" não existe.** O arquivo não tem seção 12 numerada; as divergências 5–8 vivem na seção "⚠️ Divergências entre o que o prompt afirma/assume e o que foi encontrado" (`docs/ux/C-PRECHECK.md:20-55`). `[medido: grep -n "^## " docs/ux/C-PRECHECK.md]` — *premissa do prompt do revisor*.
2. **A tabela da Herança do C tem 9 linhas, mas o mapeamento do prompt deixa UMA sobrando, não duas.** H-C1…H-C5 = linhas 1–5; H-C6 (div. 6–8) cobre as linhas 6, 7 **e 8** (a linha 8 é o comentário stale, listado também como H-N5 — item duplicado); H-C7 (`AUTH.md`) **não está na tabela** (vem do C-ENCERRAMENTO §7 e PRD §11). Sobra só a linha 9: **H-C8 = policies de `storage.objects`/`storage.buckets` não versionadas (div. 1)**. **H-C9 não existe.** — *premissa do prompt do revisor*.
3. **H-C2 não é "mini-item" para o web.** O editor do web grava em `content_data` o **registro inteiro espalhado** mais `sections`/`measures`/`annotations` (§3 H-C2, tabela de escritores). Um Zod estrito por tipo devolveria 400 em **todo PUT do editor do web**. Registrado como **item novo do Bloco D** (emenda E5).
4. **`app/api/content/route.ts:105-113` → o trecho real é 104–112** (`sortMap` em 104–109, `.order(...)` em 111–112). Cosmético — *premissa do prompt do revisor (linhas de um doc anterior)*.
5. **H-N1: nos 30 runs do CI, 4 vermelhos, 3 deles são este teste** (o 4º, `34115301326`, foi `remove acentos: Águas → aguas` do core no N0-PR1). Em `34127828823` o teste **passou no step `Test` e falhou no `Test coverage`** (código instrumentado). A asserção que quebra é sempre a 3ª (`secondHalfAvg < firstHalfAvg * 1.5`) com valores de **~3 ms vs ~2,5 ms**. Nunca falhou localmente nesta sessão.
6. **Há mais comentários stale "5/15min" além de `auth.ts:109`** — 6 ocorrências vivas: `scripts/ux-audit/auth.ts:109`, `playwright.ux-audit.config.ts:68`, `tests/ux-audit/auth.setup.ts:38`, `tests/ux-audit/session-intercept.ts:6`, `tests/ux-audit/perf02-gate.spec.ts:27`, `tests/ux-audit/set14-gate.spec.ts:18` (`scripts/ux-audit/probe-auth-limit.ts:4` é histórico declarado, fica). H-N5 vira "6 ocorrências", mesma PR.
7. **`ci.yml` roda Node 20** (`node-version: 20`); o contexto diz Node 22 local e o `native.yml` usa 22. Registro de aparato → **B7-D10** (emenda E3).
8. **O peer do H-N3 é OPCIONAL** (`expo@57.0.20` → `peerDependenciesMeta.react-dom.optional: true`). O aviso do N0 vem de `react-dom@18.3.1` (hoisted da raiz) declarando `peer react@^18.3.1` e encontrando o `react@19.2.3` do nativo.

**Lição do revisor (E7)**: 3 das 8 divergências foram premissas do prompt (seção inexistente, contagem da tabela, linhas de um doc anterior) — **citar linha só com trecho colado vale também para o revisor.**

---

## 2. Fase A1 — Estado e baseline `[medido]`

```
$ git fetch --all --prune          →  - [deleted] (none) -> origin/n0/encerramento
$ git status --short --branch      →  ## main...origin/main            (limpo)
$ git log --oneline -3 origin/main
06bf93e Merge pull request #270 from marcelviana/n0/encerramento
dcc6f55 docs(N0): errata — contagem de origem A = 7
e77494c docs(N0): encerramento — N0 ✅, H15 verdadeira, herança para B e N1
$ gh pr list                       →  (vazio)
$ pnpm lint                        →  ✔ No ESLint warnings or errors        EXIT=0
$ pnpm exec tsc --noEmit                                  →  EXIT=0
$ pnpm exec tsc -p packages/core/tsconfig.json --noEmit   →  EXIT=0
$ pnpm test
 Test Files  76 passed | 4 skipped (80)
      Tests  658 passed | 86 skipped (744)      Duration 18.58s   EXIT=0
$ pnpm exec tsc -p tsconfig.test.json --noEmit 2>&1 | grep -c "error TS"   →  151   (EXIT=2)
$ … | cut -d'(' -f1 | sort | uniq -c | sort -rn | head -15
  44 tests/components/content-viewer.refactoring.test.tsx
  23 tests/ux-audit/fase-d/i-add.spec.ts
  20 tests/security/auth-penetration-testing.test.ts
  13 tests/security/api-validation.security.test.ts
   7 tests/typescript-ide-improvements.test.ts
   5 tests/ux-audit/harvest-populated.spec.ts
   5 hooks/__tests__/use-toast.test.ts
   4 tests/ux-audit/fase-d/h-perf.spec.ts
   4 tests/security/security-headers-validation.test.ts
   4 tests/components/add-content.refactoring.test.tsx
   4 hooks/__tests__/use-content-renderer.test.ts
   3 tests/ux-audit/fase-d/e-setlists.spec.ts
   3 tests/typescript-strict-mode.test.ts
   3 tests/security/token-blacklist-concurrency.test.ts
   3 tests/hooks/use-performance-monitoring-ui.test.ts
```

Baseline **idêntico ao esperado** (658/86/744 · 76/4/80 · 151). Saídas integrais: anexos `lint.txt`, `tsc-web.txt`, `tsc-core.txt`, `tsc-tests-151.txt`, `test.txt`.

### Tabela da Herança do C (`PLANO-TRANSICAO.md:629-641`, verbatim)

```
| Item | Origem | Classe |
| `Cache-Control: private` ou `no-store` emitido pelas rotas de `/api/*` — hoje `public, max-age=0, must-revalidate` em 10/10 respostas medidas; o `no-store` de `lib/security-headers.ts:256` não chega porque o middleware exclui `/api` | C-PRECHECK B.5 achado 1 | higiene de contrato (ponto único: `lib/api-errors.ts` + `NextResponse.json` das rotas) |
| Zod de `content_data` por `content_type` na escrita (`Lyrics→{lyrics}`, `Chords→{chords}`, `Tab→{tablature}`, `Sheet→null`+`file_url`; `annotations` fora) — hoje `z.record(jsonValueSchema).nullish()` | C-D7; C-PRECHECK §2.6, B.3 | contrato (mini-item; não pré-requisito da tela 1) |
| **Desempate por `id` no `order` do `GET /api/content`** — o handler ordena só por `created_at desc` (`app/api/content/route.ts:105-113`); dois itens com o mesmo `created_at` têm ordem não garantida entre páginas | PRD nota N6 | contrato de paginação (mini-item; o nativo mitiga com dedupe por `id`, T1-R9b) |
| Remoção de `GET /api/debug/config` (sem auth; 404 só por `NODE_ENV`) | C-PRECHECK Fase A div. 4 | superfície (classe da B1.0) |
| `docs/api/STORAGE.md` diz "Bearer" no upload onde a rota aceita bearer OU cookie e exige email verificado | div. 5 | doc (junto do contrato de auth B7) |
| `types/setlist.ts:40 event_date` (coluna inexistente, sem consumidor) | div. 6 | dead code |
| `lib/api-schemas.ts:34 commonSchemas.contentType` (enum falso, sem consumidor) | div. 7 | dead code |
| `scripts/ux-audit/auth.ts:109` comentário stale ("5 req / 15 min") | div. 8 | doc |
| Policies de `storage.objects`/`storage.buckets` não versionadas (o `db:dump` é `-s public`) | div. 1 | versionamento (só se o storage mudar de contrato) |
```

### §9 do N0-ENCERRAMENTO (linhas 141-149, verbatim)

```
- Flake `tests/performance/performance-mode-responsiveness.test.tsx:310` — deixou a main vermelha em `ae298fe` e o `Test coverage` do PR3 (commit 1); dívida do web.
- 151 erros de `tsc -p tsconfig.test.json` (informativo, B8).
- Peer `react-dom 18.3.1 ✕ unmet peer react@^18.3.1: found 19.2.3` em `apps/native` (o `expo` pede `react-dom`; resolvido contra o do web) — decidir se o nativo declara o seu.
- `test.projects` no Vitest (isolamento real do core, sem a guarda de `window`) — reavaliar quando o core crescer.
- Comentário stale em `scripts/ux-audit/auth.ts:109` ("5 req / 15 min").
- Install Command filtrado no Vercel (`pnpm install --frozen-lockfile --filter octavia`) — **só se N0-H7 mostrar piora** (não medido).
- Os mini-itens da "Herança do Bloco C" (PLANO B7): `Cache-Control` das rotas, Zod de `content_data` por tipo, desempate por `id` no `GET /api/content`, `GET /api/debug/config`, STORAGE.md, dead code, contrato de auth do cliente (B7 a partir do PRD §3).
```

---

## 3. Fase A2 — Item a item `[medido]`

### H-C1 — `Cache-Control` em `/api/*`

```
$ grep -rn "Cache-Control\|no-store" app/ middleware.ts next.config.mjs lib/
lib/security-headers.ts:256:      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
$ grep -rn "headers" app/api --include=route.ts | grep -i cache ; echo exit=$?
exit=1                                                              (nenhuma rota emite Cache-Control)
$ grep -rn "applySecurityHeaders" --include='*.ts' --include='*.tsx' . (sem node_modules/.next/.audit/testes)
middleware.ts:5:import { applySecurityHeaders } from '@/lib/security-headers'
middleware.ts:40:  applySecurityHeaders(response, request, nonce)
lib/security-headers.ts:293:export const applySecurityHeaders = applyEnhancedSecurityHeaders
```

Trecho (`lib/security-headers.ts:252-259`):

```ts
    // Cache control for sensitive pages
    if (request.nextUrl.pathname.includes('/api/') ||
        request.nextUrl.pathname.includes('/dashboard') ||
        request.nextUrl.pathname.includes('/performance')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }
```

**Onde o `no-store` se perde**: esse bloco só roda dentro de `applySecurityHeaders`, cujo único chamador é `middleware.ts:40`, e o `matcher` do middleware exclui `api` (`middleware.ts:58-67`: `'/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`). Nenhum handler, nem `lib/api-errors.ts` (constrói `Response` puro com só `Content-Type` + headers opcionais), nem `next.config.mjs` (só `images.minimumCacheTTL`, linha 17) põe o header. **Origem do `public, max-age=0, must-revalidate` (H13)**: `[hipótese, alta]` é o default que a Vercel injeta em resposta de função sem `Cache-Control` — coerente com "nenhum ponto do código o emite"; **fecha no probe de preview da PR3** (E1).

**Probes em prod** (anexo `prod-probes-headers.txt`; script local não versionado derivado de `scripts/native/token-oracle.ts`; bearer direto; 0 chamadas a `/api/auth/session`; só headers, `set-cookie` suprimido):

```
=== P1 setlist-read: GET /api/setlists (bearer) → HTTP 200
cache-control: public, max-age=0, must-revalidate
content-encoding: br · content-type: application/json · server: Vercel · x-matched-path: /api/setlists
vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
x-vercel-cache: BYPASS                        (corpo: 49983 B — tamanho idêntico ao do C/B6)
=== P2 content-read: GET /api/content?pageSize=1 (bearer) → HTTP 200
cache-control: public, max-age=0, must-revalidate
x-vercel-cache: BYPASS                        (corpo: 610 B)
=== P3 debug/config: GET /api/debug/config (sem credencial) → HTTP 404
cache-control: public, max-age=0, must-revalidate
age: 0 · x-vercel-cache: MISS
corpo: {"error":"Not available in production","code":"NOT_FOUND"}
```

**Achado novo**: com `Authorization` a CDN faz **BYPASS**; sem credencial ela **consulta o cache (`MISS`, `age: 0`)** — o `public` é semanticamente errado numa resposta por usuário, ainda que `max-age=0` + `must-revalidate` impeçam servir stale hoje.

**Service worker** (impacto de `no-store`): `scripts/build-sw.js` (9 linhas) só copia `worker/index.js` → `public/sw.js`; o handler de `fetch` do SW trata **só** `ASSETS` (cache-first), `/_next/static|image` (cache-first) e `mode === 'navigate'` (network-first); `grep -c "/api" public/sw.js → 0`. **Nenhuma resposta de `/api/*` passa pelo SW.** Os caches offline do web são IndexedDB (`lib/offline-cache.ts`, `lib/advanced-content-cache.ts`), indiferentes a `Cache-Control` HTTP. `app/api/proxy/route.ts:71-74` copia os headers do upstream (`new Headers(res.headers)`, remove só `set-cookie`/`transfer-encoding`) — o `Cache-Control` do Supabase atravessa (**não medido**: custaria 1 request `proxy`) → **B7-D3: proxy fora**.

Testes existentes: `grep -rln "Cache-Control" tests app lib --include='*.test.*'` → **nenhum**.

### H-C2 — Zod de `content_data` por tipo (escrita)

Schema atual (`lib/api-schemas.ts:114-145`, verbatim):

```ts
// content_data é jsonb: valores devem ser JSON puro; o TOPO é objeto-ou-null.
export const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([ z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema) ]))
export const contentTypeSchema = z.nativeEnum(ContentType)
const contentEditableFields = {
  …
  content_type: contentTypeSchema,
  content_data: z.record(jsonValueSchema).nullish(),
  file_url: z.string().url().nullish(),
```

`contentSchemas.create` (`.strict()` + ignorados `user_id/created_at/updated_at`, linhas 164-170) e `contentSchemas.update` (`id` no corpo, `content_type` opcional, 174-182) reutilizam o mesmo campo — o Zod **não vê** o par `content_type × content_data`.

**Escritores** (inventário completo — `grep -rn content_data` em `app lib hooks components contexts scripts supabase packages types`, sem testes):

| Escritor | Onde | O que manda em `content_data` |
|---|---|---|
| `POST /api/content` | `app/api/content/route.ts:186` `content_data: validatedData.content_data ?? null` | passthrough do Zod |
| `PUT /api/content` | `route.ts:262` `if (v.content_data !== undefined) contentData.content_data = v.content_data` | passthrough |
| RPCs do B6 | `grep content_data supabase/migrations/` → nada | não tocam |
| `scripts/ux-audit/seed.ts:128-187` | via `apiFetch('/api/content', POST)` (`:217`) | `{lyrics}` / `{chords}` / `{tablature}` — conforme o contrato |
| UI `components/batch-preview.tsx:59` | `content_data: { [mapping.key]: song.body.trim() }` | 1 chave por tipo — conforme |
| UI `hooks/useAddContentLogic.ts:196` | `content_data: song.body` (**string**) | 400 hoje (D5 do B2; gate `contract-content.test.ts:19`) |
| UI `hooks/useAddContentLogic.ts:210` | `content_data: draftContent.content` | forma do ContentCreator `[hipótese]` |
| UI `components/content-editor.tsx:91-98` | `{...editedContent.content_data, annotations, sections?/lyrics?/measures?}` | `annotations` sempre; `sections`/`measures` fora do contrato |
| UI `components/editors/content-type-editor.tsx:19-26` ← `components/chord-editor.tsx:67`, `components/tab-editor.tsx:66`, `components/lyrics-editor.tsx:17` | `onChange({ ...content, ...newData })`, com `content = {...content, ...content.content_data}` (`content-type-editor.tsx:33-36,44-47,98-101`) → `handleContentChange` faz `content_data: {...content.content_data, ...newData}` | **espalha o registro inteiro** (`id`, `title`, `artist`, `key`, `capo`, `bpm`, `sections`/`measures`…) dentro de `content_data` |

Trechos-chave:

```ts
// components/editors/content-type-editor.tsx:18-26
  const handleContentChange = (newData: any) => {
    onChange({ ...content, content_data: { ...content.content_data, ...newData } })
  }
// components/chord-editor.tsx:65-68
  const updateChordData = (newData: any) => { setChordData(newData); onChange({ ...content, ...newData }) }
// components/lyrics-editor.tsx:15-18
  const updateLyrics = (newLyrics: string) => { setLyrics(newLyrics); onChange({ ...content, lyrics: newLyrics }) }
// components/content-editor.tsx:107-111
      <ContentTypeEditor … onChange={(newContent) => { setEditedContent(newContent) …
// components/content-editor.tsx:91-98
      content_data: {
        ...editedContent.content_data,
        annotations,
        ...(… === ContentType.CHORDS && editedContent.sections && { sections: editedContent.sections }),
        ...(… === ContentType.LYRICS && editedContent.lyrics && { lyrics: editedContent.lyrics }),
        ...(… === ContentType.TAB && editedContent.measures && { measures: editedContent.measures }),
      },
```

**Leitores** (servidor, todos passthrough): `app/api/setlists/route.ts:36,73,106,202`, `app/api/setlists/[id]/route.ts:84,118,247,281`, `lib/content-service-server.ts:139,165`. **Leitores (UI)**: `hooks/use-songs-transformation.ts:35-74` (`lyrics/file/chords/sections`), `hooks/use-content-loading.ts:75-84`, `components/content-viewer/{Lyrics,Chord,Tab,SheetMusic}Display.tsx` (leem `lyrics`, `chords` string **ou array**, `sections`, `progression`, `tablature` string **ou array**, `notation`, `pages`).

**Contrato do PRD §4** (C-D7, verbatim da tabela T1-R7): Lyrics→`content_data.lyrics: string`; Chords→`content_data.chords: string` **ou**, se `content_data` for `null`, `file_url`; Tab→`content_data.tablature: string`; Sheet→`file_url` (`content_data` é `null`); regras (a) chaves desconhecidas ignoradas **pelo cliente**, (b) `null` + `file_url null` = inválido; `annotations` não-contrato.

**Princípio do sanitizador**: passa ou 400 nomeando o campo (`field: "content_data.lyrics"`), **nunca altera** — a opção (b) da D5 (tipado-passthrough) o respeita: valida a chave do tipo e deixa as demais atravessar literalmente.

Testes existentes: `lib/__tests__/contract-content.test.ts` — `it('OBRIGATÓRIO (D5/aval PR-2): batch envia STRING → 400 "Expected object"')` (linha 19), `it('objeto, null e objeto aninhado passam')` (32-40: aceita `{annotations:[], sections:[…], meta:{n:1}}` — sob a D5(b) continua passando; o **controle negativo da PR5** é um `Lyrics` com `content_data: {chords: 'x'}` → hoje passa, deve dar 400), `it('chave desconhecida → 400 …')` (65: chaves do **topo**, não de `content_data`).

**E5 — item novo do Bloco D (web)**: "editor do web polui `content_data` com o registro inteiro" — caminhos medidos acima (`content-type-editor.tsx:18-26` + `chord-editor.tsx:67` / `tab-editor.tsx:66` / `lyrics-editor.tsx:17` → `content-editor.tsx:91-98` → `PUT /api/content`). **Não afeta o nativo — T1-R7 ignora chaves desconhecidas.** `[hipótese]` A conta principal pode ter `content_data` com `id`/`title` (B.3 mediu só a conta de audit, semeada pela API); fecha com a leitura do Marcel (D5 — **pendente**).

### H-C3 — Desempate por `id` no `order` do `GET /api/content`

`app/api/content/route.ts:104-112` (verbatim):

```ts
    const sortMap = {
      recent: ['created_at', false],
      title: ['title', true],
      artist: ['artist', true],
      updated: ['updated_at', false]
    } as const

    const [sortColumn, ascending] = sortMap[sortBy] || sortMap.recent
    query = query.order(sortColumn, { ascending })
```

Vale para os 4 `sortBy` (em `title`/`artist` o empate é ainda mais provável). Teste existente: `app/api/content/__tests__/route.test.ts` tem `mockOrder` só na montagem do mock (linhas 14-59); `grep -n order … | grep -v mockOrder` → `exit=1`: **nenhum `it` afirma os argumentos do `order`**. `its` do arquivo: 154 `returns user content when authenticated`, 214 `supports pagination with limit and offset`, 235 `filters by content type when specified` — nenhum sobre ordenação.

### H-C4 — `GET /api/debug/config`

Rota inteira (`app/api/debug/config/route.ts`, 21 linhas):

```ts
import { NextRequest, NextResponse } from 'next/server';
import { notFound } from '@/lib/api-errors';
import { isSupabaseServiceConfigured } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return notFound('Not available in production');
  }
  const config = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    isConfigured: isSupabaseServiceConfigured,
    nodeEnv: process.env.NODE_ENV,
  };
  return NextResponse.json(config);
}
```

`grep -rn "debug/config" .` (fora `node_modules/.next/.git`): **código** = só a própria rota; **teste** = `tests/security/owasp-top10-penetration.test.ts:339-347` (**`it.skip`**, faz `fetch('http://localhost:3000/api/debug/config')` real — inútil como gate); **docs** = 12 menções históricas (B2/B3/C/PRD/PLANO/N0 — não editar); **`.audit/`** = grafos e logs de build históricos. `isSupabaseServiceConfigured` tem outros consumidores (`lib/auth-manager.ts:4,19,22`, `lib/supabase-service.ts:9,20,42`) — a remoção da rota não órfã nada. **Prod: 404 envelope `NOT_FOUND`** (P3).

### H-C5 — `STORAGE.md` × código

| Rota | Doc diz | Código faz |
|---|---|---|
| `POST /api/storage/upload` | "Auth obrigatória (Bearer verificado server-side)" (`STORAGE.md:34`) | `requireAuthServerSecure` (`upload/route.ts:15`) = **bearer (regex `/^Bearer\s+(.+)$/i`) OU cookie `firebase-session`** (`lib/secure-auth-utils.ts:268-281`) **e `emailVerified` obrigatório** (`:307-310`) |
| `GET /api/storage/list` | "Auth obrigatória" | idem cadeia B (`list/route.ts:22`) |
| `POST /api/storage/delete` | "Auth obrigatória" | **bearer-only** (`startsWith('Bearer ')`, `delete/route.ts:14-16`), `validateFirebaseTokenServer` direto, **sem** exigência de email verificado — a única rota bearer-only do repo |

### H-C6 — Dead code

```
$ grep -rn "event_date" . --exclude-dir={node_modules,.next,.git,.audit}
types/setlist.ts:40:  event_date: string | null          ← único hit em código; os demais são docs (PRD/PLANO/C-*/B2-*/N0-*)
$ grep -rn "types/setlist['\"]" . --include='*.ts' --include='*.tsx' (mesmas exclusões)
app/api/setlists/[id]/route.ts:9:import type { SetlistSong, ContentData, FormattedSetlistSong } from '@/types/setlist'
```

→ a interface **`Setlist` inteira** (`types/setlist.ts:35-46`) não tem consumidor, não só a linha 40 (o dump tem `performance_date`, não `event_date`) → **B7-D4**.

```
$ grep -rn "commonSchemas\.contentType" . --include='*.ts' --include='*.tsx' (mesmas exclusões) ; echo exit=$?
exit=1                                                              (zero em código; só docs)
$ grep -rn "commonSchemas" … (código) → usos: .objectId (7×), .createSafeText, .filename, .safeHtml, .safeText — nunca .contentType
```

Trecho (`lib/api-schemas.ts:33-36`): `contentType: z.enum(['Lyrics', 'Chords', 'Tabs', 'Piano', 'Drums'], { errorMap: () => ({ message: 'Invalid content type' }) }),`.

### H-C7 — Contrato de auth (só medição; `docs/api/AUTH.md` não existe: `ls docs/api/` → `CONTRATO-DE-ERRO.md SETLISTS.md STORAGE.md`)

**O que o PRD §3 afirma** (T1-R1…R6, colado verbatim no relatório da sessão): header `Authorization: Bearer <idToken>`, prefixo literal case-sensitive (`startsWith('Bearer ')`), zero cookie, zero `/api/auth/session`; renovação pelo SDK com buffer < 5 min (`lib/auth-manager.ts:10` `REFRESH_BUFFER_MS = 5 * 60 * 1000` ✓), cache do servidor 1h por string de token (`lib/firebase-server-utils.ts:74-100` ✓); 401 sem retry, `authfail` 30/5min por IP (`lib/user-rate-limit.ts` `AUTH_FAIL: { windowMs: 5 * 60_000, max: 30 }` ✓); 429 com `Retry-After`; cadeia B exige email verificado; login email/senha.

**O que o código faz** — duas cadeias, medidas nesta sessão:

| | Cadeia A `requireAuthServer` (`lib/firebase-server-utils.ts:137-179`) | Cadeia B `requireAuthServerSecure` (`lib/secure-auth-utils.ts:244-320`) |
|---|---|---|
| Bearer | `authHeader.startsWith('Bearer ')` case-sensitive, `substring(7)` | regex `/^Bearer\s+(.+)$/i` (case-insensitive, espaços múltiplos); header presente mas malformado → `null` |
| Cookie | `firebase-session=` por `split(';')` | regex `firebase-session=([^;]+)` + `decodeURIComponent` |
| Email verificado | não | **sim** (salvo `allowUnverifiedEmail`) |
| Deny-fast por IP | `authFailureLimited(clientIp)` | idem |
| Blacklist | não | `blacklistToken` em `revoked`/`expired` |
| Rotas | `proxy` GET, `content` GET/POST/PUT/DELETE, `content/[id]` GET/DELETE, `setlists` GET, `setlists/[id]` GET/DELETE, `setlists/songs/[songId]` DELETE | `storage/upload`, `storage/list`, `profile` GET, e **toda mutação via `withBodyValidation`** (`lib/api-validation-middleware.ts:8,101`: `profile` POST/PATCH, `setlists` POST, `setlists/[id]` PUT, `setlists/[id]/songs` POST, `…/songs/order` PUT) |
| Fora das duas | `storage/delete` (bearer-only, validador A); `auth/session` POST (`withPublicBodyValidation`, valida `idToken` do corpo, grava cookie `HttpOnly; Max-Age=604800; Path=/; SameSite=Lax; Secure` em prod) e DELETE; `health`; `debug/config` | |

Middleware: otimista, só forma do cookie (`JWT_SHAPE`), exclui `/api` (`middleware.ts`). Web já usa bearer: `lib/content-service.ts` 5, `lib/setlist-service.ts` 7, `contexts/firebase-auth-context.tsx` 5 fetches com `Authorization: Bearer`; cookie-only: `/api/proxy` em `lib/offline-cache.ts:173` e `lib/advanced-content-cache.ts:310`. → texto do `AUTH.md` na PR1 (**B7-D7**).

### H-C8 — Policies do storage não versionadas

`package.json:20` `"db:dump": "supabase db dump -s public -f supabase/schema.dump.sql"`; `grep -rni "storage\.\|bucket" supabase/` → nada; `supabase/migrations/` tem só `20260901102108_b6_setlist_songs_rpc.sql`. Única menção a `storage.buckets` no repo: SQL de console em `docs/ux/B5-DESENHO.md:105-110`. Estado inalterado desde o C. **B7-D8** + **E2**: a prova do item é `grep -c "CREATE POLICY" supabase/storage.dump.sql` > 0 colado; sem isso, "não fechado". **H-C9: inexistente** (div. 2).

### H-N1 — Flake `tests/performance/performance-mode-responsiveness.test.tsx`

Teste (`:251-313`, `it('should handle rapid navigation without performance degradation')`): 20 cliques alternados `next/prev` num `MockPerformanceMode` (**não** é o componente real), mede `performance.now()` em volta de `fireEvent.click` + `setTimeout(1)` + `rerender`, e afirma:

```ts
      expect(maxTime).toBeLessThan(100)
      expect(avgTime).toBeLessThan(50)
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5) // No more than 50% degradation   ← linha 310
```

O 3º assert é uma **razão entre duas médias de 10 amostras de ~2–4 ms** em jsdom. `git log --follow --date=short`: `9690183` 2025-09-17 e `5f3295f` 2025-12-24 — nunca tocado nos blocos. Não citado em `vitest.config.mts`/`package.json`/`.github/` (`grep` → exit 1).

```
$ gh run list --workflow ci.yml --limit 30 …  → 26 success · 4 failure   (anexo gh-run-list.txt)
34127828823 n0/pr3-auth-setlists 2026-09-07  step "Test coverage"  × rapid navigation   expected 3.0160523999999898 to be less than 2.445557099999985
34115301326 n0/pr1-workspace-core 2026-09-07 step "Test"           × remove acentos: Águas → aguas   (NÃO é o flake)
34029400352 main (#262 = ae298fe) 2026-09-06                       × rapid navigation   expected 3.7640121999999794 to be less than 2.8484466
33920107751 c-pr0-prd-tela-1 2026-09-04                            × rapid navigation   expected 3.636967999999888 to be less than 2.6964154500000292
```

**3 de 4 vermelhos** citam o teste (anexo `ci-vermelhos-extrato.txt`).

**E6 — controle negativo da D6 sobre os três vermelhos** (`firstHalfAvg = limite / 1,5`; `diferença = secondHalfAvg − firstHalfAvg`):

| Run | firstHalfAvg | secondHalfAvg | razão (regra atual `< 1,5`) | diferença (regra D6 `< 10 ms`) |
|---|---|---|---|---|
| 34127828823 | 1,630 ms | 3,016 ms | **1,85× → FALHA** | **1,386 ms → PASSA** |
| 34029400352 (`ae298fe`) | 1,899 ms | 3,764 ms | **1,98× → FALHA** | **1,865 ms → PASSA** |
| 33920107751 | 1,798 ms | 3,637 ms | **2,02× → FALHA** | **1,839 ms → PASSA** |

Os três ficam < 2 ms de diferença absoluta — 5× abaixo da tolerância; a razão ×1,5 falhava em todos. Gate da PR6: o assert novo com `it.fails` **não** serve (a razão é ruído, não determinística); a prova é o assert novo + estes três casos gravados como fixture numérica.

### H-N2 — 151 erros de `tsc -p tsconfig.test.json` (adiado, B7-D2)

Por classe (`grep -o "error TS[0-9]*" | sort | uniq -c`): TS2741 31 · TS2345 30 · TS2532 18 · TS2322 17 · TS2554 12 · TS2339 7 · TS7005 6 · TS2561 6 · TS18047 6 · TS2540 4 · TS2367 3 · TS7034 2 · TS2769 2 · TS2698 2 · TS18048 2 · TS2551/TS2304/TS1378 1 cada. TS2741 (propriedade obrigatória ausente) → 29/31 em `content-viewer.refactoring.test.tsx` (mocks sem campos); TS2345 (tipo de argumento) → 22/30 em `tests/ux-audit/fase-d/i-add.spec.ts`. **37 dos 151 estão em `tests/ux-audit/**`** (Playwright, fora do Vitest). Top-2 arquivos = 67/151 (44%). `tsconfig.test.json` inclui `**/*.ts(x)` e exclui `node_modules`, `apps/**`, `packages/**`. Recorte mínimo se um dia entrar: os 4 arquivos de `tests/security/*` (40 erros). Anexo `tsc-tests-151.txt`.

### H-N3 — Peer `react-dom 18.3.1` × React 19.2.3 (anexo `pnpm-why-react-dom.txt`)

`pnpm why react-dom --filter native`: `react-dom 18.3.1 peer` chega por `expo@57.0.20` e `@expo/cli@57.0.22 → @expo/router-server@57.0.9`; raiz resolve `react 18.3.1 / react-dom 18.3.1` (`package.json:68,70` `^18`); `apps/native/package.json` tem `react 19.2.3` e **não declara `react-dom`**. `expo/package.json`: `peerDependencies.react-dom: "*"`, `peerDependenciesMeta.react-dom.optional: true`. **B7-D9 + E4 (motivo)**: declarar `react-dom: 19.2.3` em `devDependencies` do nativo custa **um pacote a mais no nativo, não usado pelo Android** (só o `expo start --web` o carregaria), e em troca elimina o aviso na origem e impede que o `react-dom@18` da raiz seja resolvido contra o `react@19` do nativo; a alternativa (`pnpm.peerDependencyRules` na raiz) é uma **regra obscura num arquivo que o nativo não lê** — escolha pelo explícito.

### H-N4 — `test.projects` no Vitest

`vitest.config.mts` verbatim no anexo `vitest.config.mts.txt` (86 linhas). Pontos: `environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']` global, `exclude` com `apps/**` mas **não** `packages/**` (o core roda na suíte web: `packages/core/src/auth-fetch.test.ts` 5 e `normalize.test.ts` 4, sob jsdom + setup do web), coverage istanbul com thresholds 50% globais. `vitest 4.0.16`. `test:ci = vitest run --coverage --reporter=verbose`. `src/test-setup.ts` tem guardas `typeof window !== 'undefined'` em 189/296/323.

O que mudaria `[hipótese]`: `test.projects: [{ extends: true, test: { name: 'web', include: [padrões do web] } }, { test: { name: 'core', environment: 'node', include: ['packages/core/**/*.test.ts'], setupFiles: [] } }]`; coverage continua no root (Vitest 3+/4 agrega por projeto); riscos = repetir `alias`/`exclude` por projeto e o reporter `verbose` prefixar por projeto. Gate: teste do core que toca `window` **falha** sob o project `node` (controle negativo real). Entra na PR7.

### H-N5 — Comentários stale "5/15min" (6 ocorrências, div. 6)

`scripts/ux-audit/auth.ts:109-110` verbatim:

```ts
  // POST /api/auth/session tem rate limit AUTH (5 req / 15 min por IP).
  // Janela fixa: retentar não a estende — espera 60s entre tentativas.
```

Vigente (`lib/user-rate-limit.ts:41-45`): `SESSION: { windowMs: 15 * 60_000, max: 120 }` por uid (token válido) · `SESSION_AUTH_FAIL: { windowMs: 15 * 60_000, max: 10 }` por IP (token inválido) · `SESSION_DELETE: { windowMs: 15 * 60_000, max: 30 }` por IP. Ocorrências: `scripts/ux-audit/auth.ts:109`, `playwright.ux-audit.config.ts:68`, `tests/ux-audit/auth.setup.ts:38`, `tests/ux-audit/session-intercept.ts:6`, `tests/ux-audit/perf02-gate.spec.ts:27`, `tests/ux-audit/set14-gate.spec.ts:18`.

### H-N6 — Install Command do Vercel

Registrado; nada medido; passo do Marcel condicionado a N0-H7.

---

## 4. Fase B — Aparato `[medido]`

### B1 — CI

`ci.yml` verbatim no anexo `ci.yml.txt`: 1 job `build` (Node **20**, pnpm frozen); steps: Install → Lint → `tsc -p tsconfig.test.json` **`continue-on-error: true`** → `tsc` core → `pnpm test:unit` → `pnpm test:ci` (coverage) → Codecov → artifact → `pnpm build`. Não há `tsc --noEmit` do web como step (o `next build` o cobre). `native.yml` (Node 22, filtro de paths) é o segundo workflow. Gate de preview = Vercel por branch (fora do CI). Durações dos 3 últimos verdes na main (anexo `gh-run-list.txt`):

| Run | Total | Install | Lint | tsc test | Test | Coverage | Build |
|---|---|---|---|---|---|---|---|
| 34223021876 (#270) | 2m41s | 6s | 5s | 9s | 30s | 33s | 50s |
| 34172561571 (#269) | 3m09s | 6s | 5s | 12s | 39s | 42s | 65s |
| 34160854049 (#268) | 3m27s | 14s | 6s | 12s | 41s | 44s | 71s |

**E3 / B7-D10**: drift Node 20 (`ci.yml`) × 22 (local via nvm, `native.yml`). Efeito esperado da mudança na PR7: **nenhum funcional** (Next 15.2.8 e Vitest 4 suportam ambos); a PR7 cola as durações da tabela acima × as do primeiro run em 22.

### B2 — Preview

`vercel.json` não existe (`ls` → No such file). Validação de preview hoje: `tests/ux-audit/*` + `playwright.ux-audit.config.ts` (`baseURL = UX_AUDIT_BASE_URL || https://octavia.rocks`; bypass **por cookie `_vercel_jwt`** no browser, nunca `extraHTTPHeaders` — comentário das linhas 41-47); em Node, `scripts/ux-audit/auth.ts:31-34` `bypassHeaders()` lê `VERCEL_AUTOMATION_BYPASS_SECRET` e injeta `x-vercel-protection-bypass` só em `fetch`. O instrumento do C foi o par `C-PRECHECK-anexos/B0-*` (probe `tsx` com bearer, sem session). O probe desta sessão (script local, anexo `prod-probes-headers.txt`) segue o mesmo padrão e é a base do gate de preview da PR3 (trocar `BASE_URL` + `bypassHeaders()`; a PR3 versiona a versão final em `scripts/`).

### B3 — Controles negativos existentes × faltantes (regra nº 7)

| Item | Existe | Faltará |
|---|---|---|
| H-C1 Cache-Control | nada | teste de handler afirmando `Cache-Control` em 200/401/404 de 2 rotas (`it.fails` → `it`) + probe de preview (E1) |
| H-C2 Zod por tipo | `contract-content.test.ts:32-40` (continua verde sob D5-b) | `Lyrics` com `content_data:{chords:'x'}` → 400 `field:"content_data.lyrics"`; `Chords` `null` sem `file_url` → 400; payload real do editor (poluído) → **passa** (D5-b) |
| H-C3 order | nada | `mockOrder` chamado com `('created_at',{ascending:false})` **e depois** `('id',{ascending:true})` |
| H-C4 debug/config | `it.skip` inútil | teste de inventário `existsSync('app/api/debug')` false (`it.fails` → `it`); o `it.skip` sai |
| H-C5/H-C7 docs | probes P2/P2b/P3b do C (runtime) | nenhum gate de código; a prova é a tabela rota×cadeia conferida por grep |
| H-C6 dead code | nada | `expect('contentType' in commonSchemas).toBe(false)`; `Setlist` é type-only → prova = `tsc` + grep zero |
| H-C8 storage dump | nada | E2: `grep -c "CREATE POLICY" supabase/storage.dump.sql` > 0 |
| H-N1 flake | o próprio teste | E6: os três casos gravados + assert de tolerância |
| H-N3/H-N4/D10 | nada | `pnpm install` sem aviso de peer; core: teste que toca `window` **falha** sob `node`; durações Node 20×22 |
| H-N5 | nada | `grep -rn "5/15min\|5 req" scripts/ tests/ playwright*.ts` → 0 (fora o histórico declarado de `probe-auth-limit.ts:4`) |

---

## 5. Fase C — Proposta (decidida no aval: §0)

### C1 — Item × custo × risco × depende de

| Item | Custo | Risco | Depende de | Migração |
|---|---|---|---|---|
| H-C1 Cache-Control | baixo (1 ponto: `next.config.mjs`) | baixo; nenhum efeito no SW | D3 + probe de preview (E1) | não |
| H-C2 Zod por tipo | médio | baixo sob D5-b (passthrough) | leitura da conta principal (Marcel, **pendente**) | não |
| H-C3 desempate `id` | baixo | baixo (ordem muda só em empates) | — | não (PK cobre) |
| H-C4 remover rota | baixo | nulo em prod (já 404) | — | não |
| H-C5 STORAGE.md | baixo | nulo | H-C7 | não |
| H-C6 dead code | baixo | nulo (type-only + enum órfão) | D4 | não |
| H-C7 AUTH.md | médio (texto) | nulo | D7 | não |
| H-C8 policies storage | baixo, **passo do Marcel** (`supabase link` + `db dump -s storage`) | nulo (leitura) | D8 / E2 | não (dump, não migração) |
| H-N1 flake | baixo | baixo | D6 | não |
| H-N2 151 erros | alto | médio | **adiado (D2 → B8)** | não |
| H-N3 peer | baixo | baixo | D9 | não |
| H-N4 projects | baixo/médio | médio (coverage/reporter) | — | não |
| H-N5 comentários | baixo | nulo | — | não |
| D10 Node 22 no CI | baixo | baixo | — | não |
| H-N6 Vercel | console Marcel | — | N0-H7 | não |

**Zero migração em todos os itens.**

### C2 — Recorte em PRs (uma classe por PR; `it.fails` → `it` em dois commits onde há gate de código)

- **PR1 docs** — `docs/api/AUTH.md` novo (H-C7, D7) + correção do `STORAGE.md` (H-C5: upload/list = cadeia B, bearer OU cookie, email verificado; delete = bearer-only, sem email verificado) + 6 comentários stale (H-N5). Prova: grep zero; tabela rota×cadeia conferida contra o grep do §3.
- **PR2 remoções** — `app/api/debug/config/` (H-C4) + `commonSchemas.contentType` + interface `Setlist` inteira (H-C6, D4) + substituir o `it.skip` do OWASP por teste de inventário. Prova: `tsc` + teste `it.fails` no commit 1.
- **PR3 Cache-Control** — `headers()` em `next.config.mjs` com `private, no-store` para `/api/*` **exceto `/api/proxy`** (D3) + teste de handler + probe de preview. **E1**: a PR3 mede (i) a sintaxe de exclusão `source: '/api/:path((?!proxy).*)'` `[hipótese]` e (ii) o probe de preview inclui `POST /api/auth/session` com corpo inválido → 400 com `private, no-store`, `GET /api/setlists` 200, `GET /api/content` 200 e um 404 sem credencial; **H13 fecha nesse probe** (antes × depois na mesma rodada, padrão P1-contraste: branch × prod via `Promise.all`).
- **PR4 desempate por `id`** — `.order(sortColumn, { ascending }).order('id', { ascending: true })` + assert nos argumentos do `mockOrder`.
- **PR5 Zod tipado-passthrough** (D5-b) — **só após a leitura da conta principal pelo Marcel** (pendente); controles negativos em B3.
- **PR6 flake** — D6: tolerância absoluta 10 ms; fixture com os três casos de E6.
- **PR7 aparato** — `react-dom 19.2.3` no nativo (D9) + `test.projects` (H-N4) com o gate "core sob `node` sem `window`" + **Node 22 no `ci.yml` (D10) com durações antes/depois**.
- **H-C8** — passo do Marcel (D8), prova E2; pode entrar em qualquer PR de docs quando o dump existir.
- **H-N2** — adiado (D2).

### C3 — Ordem e efeito no aparato

**PR1 → PR2 → PR4 → PR3 → PR7 → PR6 → PR5.** Docs e remoções primeiro (zero risco, limpam o inventário que as outras citam); PR4 antes de PR3 porque a rodada de preview da PR3 pode verificar a ordem na mesma passada; **PR7 (`projects` + Node 22) antes de qualquer teste novo do core** e depois dos testes novos do web (PR3/PR4 nascem no layout atual e não precisam ser movidos); PR6 isolada (muda só um assert); PR5 por último por depender de D5 e do dado da conta principal.

### C4 — Perguntas de decisão → todas fechadas em §0 (B7-D1…D10)

---

## 6. Hipóteses remanescentes

| # | Hipótese | Fecha em |
|---|---|---|
| H13 (do C) | `public, max-age=0, must-revalidate` é o default da Vercel para função sem `Cache-Control` | PR3, probe de preview antes × depois (E1) |
| B7-h1 | `source: '/api/:path((?!proxy).*)'` exclui o proxy no `headers()` do Next | PR3 (E1-i) |
| B7-h2 | `Cache-Control` do `/api/proxy` = o do upstream Supabase | não medido (1 request `proxy`); irrelevante sob D3 |
| B7-h3 | A conta principal tem `content_data` poluído pelo editor (`id`/`title`…) | leitura do Marcel (D5 — **pendente**) |
| B7-h4 | `test.projects` mantém o coverage agregado no root sem mudar `test:ci` | PR7 |
| B7-h5 | Node 22 no CI não muda resultado, só duração | PR7 (D10) |
| B7-h6 | `draftContent.content` (`useAddContentLogic.ts:210`) é objeto no formato do contrato | PR5 (grep do ContentCreator) |

---

## 7. Orçamento de prod e estado final

- **Requests a prod: 3 de 12** — `setlist-read` 1 · `content-read` 1 · sem família (`GET /api/debug/config`, 404) 1 · `session` **0** · `authfail` 0 · `storage` 0 · Google Identity (`signInWithPassword`, fora da API) 1. **Zero escrita.** Contagens (conta de audit): setlists → corpo de 49.983 B, idêntico em tamanho ao do C/B6.
- **Não reproduzido**: origem do `public, max-age=0` (H13); `Cache-Control` do `/api/proxy`; o flake não reproduziu localmente (658 passed).
- **Passos do Marcel**: leitura da conta principal (D5 → PR5); `supabase link` + `supabase db dump -s storage` (D8 → E2); N0-H7 (H-N6).
- **Repo**: nenhum arquivo de código tocado; este doc + anexos em `docs/ux/` na branch `b7/precheck` (B7-PR0). Merge = Marcel.
