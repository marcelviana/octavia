# B7-ENCERRAMENTO.md — Bloco B7: higiene web (herança C + N0)

> **Datas**: pre-check 2026-09-08 (sessão nova e dedicada); PRs #272–#279 mergeadas em 2026-09-09; este encerramento 2026-09-09. Pre-check: [`B7-PRECHECK.md`](B7-PRECHECK.md) (+ anexos). Decisões do Marcel B7-D1…D10 (§0 do pre-check) + D5b/D5c ([`B7-D5-ADENDO.md`](B7-D5-ADENDO.md)) + item 3 da PR5 opção (a). **Zero migração, zero escrita em prod, zero console além de leituras do Marcel (D5) e do dump do storage (D8).**
> Números deste doc vêm dos corpos das PRs (`gh pr view <n> --json title,body,mergeCommit,mergedAt`) e dos docs commitados — não de memória.

---

## 1. Pergunta e resposta

**Pergunta do bloco**: "a higiene herdada do C e do N0 fecha sem migração e sem escrita em prod?"

**Resposta: sim.** 14 itens herdados; 12 fechados em 7 PRs de código + este encerramento, 1 adiado por decisão (H-N2 → B8), 1 aberto como passo do Marcel (H-N6). Nenhuma migração; escrita em prod 0; prod só leitura (6 requests no bloco inteiro).

| Item | O que era | PR | Estado |
|---|---|---|---|
| H-C1 `Cache-Control` em `/api/*` | `public, max-age=0, must-revalidate` (default da Vercel) | **PR3** #276 | ✅ `private, no-store` via `headers()`, `/api/proxy` fora; H13 fechada |
| H-C2 Zod de `content_data` por tipo | `z.record` qualquer | **PR5** #279 | ✅ tipado-passthrough (D5, D5b, D5c) + PUT com SELECT condicional |
| H-C3 desempate por `id` no `order` | só `created_at desc` | **PR4** #275 | ✅ `.order('id')` nos 4 `sortBy` |
| H-C4 `GET /api/debug/config` | rota sem auth, 404 por `NODE_ENV` | **PR2** #274 | ✅ removida; 404 HTML = rota inexistente |
| H-C5 `STORAGE.md` × código | "Bearer" onde é bearer OU cookie + email verificado | **PR1** #273 | ✅ corrigido (upload/list cadeia B; delete bearer-only) |
| H-C6 dead code | `Setlist.event_date`, `commonSchemas.contentType` | **PR2** #274 | ✅ interface `Setlist` inteira + enum removidos |
| H-C7 contrato de auth | inexistente | **PR1** #273 | ✅ `docs/api/AUTH.md` (contrato de servidor, D7) |
| H-C8 policies do storage não versionadas | `db:dump` é `-s public` | **encerramento** (D8) | ✅ `supabase/storage.dump.sql` (13 policies) + `db:dump:storage` |
| H-N1 flake `performance-mode-responsiveness:310` | razão ×1,5 entre médias de ~2 ms | **PR6** #278 | ✅ tolerância absoluta 10 ms (D6) |
| H-N2 151 erros de `tsc -p tsconfig.test.json` | informativo no CI | — | ⏸ **adiado ao B8** (D2) |
| H-N3 peer `react-dom 18.3.1` × React 19 | aviso do `pnpm install` | **PR7** #277 | ✅ `react-dom 19.2.3` em devDependencies do nativo (D9) |
| H-N4 `test.projects` | core rodava com o setup do web | **PR7** #277 | ✅ projetos `web`/`core`, gate `isolation.test.ts` |
| H-N5 comentários stale "5/15min" | 6 ocorrências | **PR1** #273 | ✅ texto vigente; 5 resíduos históricos ficam por decisão |
| H-N6 Install Command do Vercel | condicionado a N0-H7 | — | ⏳ **aberto** (passo do Marcel; N0-H7 não medido) |
| (novo) D10 Node 20 → 22 no `ci.yml` | drift local/`native.yml` | **PR7** #277 | ✅ sem efeito funcional; durações medidas |

## 2. Arco — PR × escopo × merge × prova × controle negativo

Ordem executada = ordem C3 do pre-check (PR0 → PR1 → PR2 → PR4 → PR3 → PR7 → PR6 → PR5): docs e remoções primeiro (zero risco, limpam o inventário que as outras citam); PR4 antes da PR3 para a rodada de preview da PR3 servir às duas; PR7 (`projects`, Node 22) antes de qualquer teste novo do core; PR6 isolada; PR5 por último por depender da leitura da conta principal.

| PR | Escopo | Merge | Data (UTC) | Prova | Controle negativo (regra nº 7) |
|---|---|---|---|---|---|
| **PR0** #272 | pre-check (482 linhas + 11 anexos), D1–D10 | `c53e9c8` | 09-09 11:53 | baseline 658/86 · 151 erros TS · 3 probes de prod (headers) | 8 divergências declaradas (3 do prompt) |
| **PR1** #273 | `AUTH.md`, `STORAGE.md`, 6 comentários, regra de worktree no `CLAUDE.md` | `677cf11` | 09-09 12:27 | grep "5/15min" → 5 resíduos históricos declarados; tabela rota × cadeia por grep | aval com 4 correções aplicadas |
| **PR2** #274 | remove `debug/config`, `commonSchemas.contentType`, `Setlist` | `a154609` | 09-09 13:03 | 660/85; build 14 rotas; probe preview: 404 HTML = prod `/api/nope` | `it.fails` → `it` (2 testes de inventário) |
| **PR4** #275 | `.order('id', asc)` após a coluna do sort | `b622ad5` | 09-09 13:31 | 662/85; `mockOrder` 1ª/2ª chamada | `it.fails` → `it` (2); baseline reproduziu o flake |
| **PR3** #276 | `headers()` `private, no-store` em `/api/*` exceto proxy | `fddc980` | 09-09 13:48 | 664/85; `next start` local; probe preview 7 rotas (Marcel) | `it.fails` → `it` (2); H13 fechada por contraste prod × preview |
| **PR7** #277 | `react-dom` no nativo, `projects` web/core, Node 22 | `3f82390` | 09-09 18:46 | 666/85 = web 655 + core 11; `test:ci`; native.yml (rerun) | `isolation.test.ts` falha sob jsdom+setup, passa sob `core` |
| **PR6** #278 | tolerância absoluta 10 ms | `0bc567b` | 09-09 20:10 | 666/85 intocado; 20 rodadas antes/depois 0/0 | as 4 amostras gravadas: antiga falha ×4, nova passa ×4 |
| **PR5** #279 | `checkContentData`, `superRefine`, PUT com SELECT condicional, `CONTENT-DATA.md`, anexo, adendo | `a9e543f` | 09-09 20:33 | 685/85; probe preview só rejeições (2×400, `total: 66`) | 10 `it.fails` → `it`; o `it` antigo "aninhado passa" vira 400 |
| **ENC** | este doc + `storage.dump.sql` + `db:dump:storage` + PLANO/`STORAGE.md` | — | 09-09 | 685/85 intocado; lint | 13 policies lidas uma a uma (§4) |

## 3. Decisões — estado final

| # | Decisão | Estado |
|---|---|---|
| D1 | nome "B7 — higiene web (herança C + N0)" | aplicado |
| D2 | H-N2 adiado ao B8 | mantido; herança §9 |
| D3 | `private, no-store` via `headers()`, `/api/proxy` fora | **PR3**; gate `tests/config/next-headers.test.ts` |
| D4 | interface `Setlist` inteira sai | **PR2** |
| D5 | Zod tipado-passthrough (b) | **PR5**; `docs/api/CONTENT-DATA.md` |
| D5b | Sheet sem chave obrigatória; `file_url` não cruzada | **PR5** |
| D5c | `null` aceito para todo tipo; chave exigida só quando objeto | **PR5** |
| PR5 item 3 (a) | SELECT condicional de `content_type` no PUT só quando `content_data` sem `content_type`; demais caminhos uma ida ao banco (teste) | **PR5** |
| D6 | flake: tolerância absoluta 10 ms | **PR6** |
| D7 | `AUTH.md` reescrito como contrato de servidor | **PR1** |
| D8 | policies do storage versionadas por dump (passo do Marcel) | **encerramento** — `grep -c "CREATE POLICY"` = 13 (E2 cumprida) |
| D9 | `react-dom 19.2.3` em devDependencies do nativo | **PR7** |
| D10 | Node 20 → 22 no `ci.yml`, durações antes/depois | **PR7** |

## 4. Hipóteses e medições — estado final

| Hipótese / medição | Estado | Onde |
|---|---|---|
| **H13** (do C): origem do `public, max-age=0, must-revalidate` | **fechada**: default da Vercel na ausência de `Cache-Control` — prod `public, max-age=0` × preview `private, no-store` na mesma rodada | PR3 §4 |
| **B7-h1**: `source: '/api/:path((?!proxy).*)'` exclui o proxy | **fechada**: build aceitou; local e preview provaram (`/api/proxy` → `public, max-age=3600` do upstream) | PR3 §2/§4 |
| **B7-h4**: `test.projects` mantém coverage no root e o reporter `verbose` prefixa por projeto | **fechada**: `All files` 37,49 → 37,63; linhas `✓  web  …` / `✓  core  …` | PR7 |
| **D10**: Node 22 sem efeito funcional | **medido**: lint/tsc/testes/build iguais; `ci.yml` 3m09s (Node 22) contra 2m43s / 3m23s (Node 20) | PR7 |
| **B7-h3**: conta principal tem `content_data` poluído pelo editor | **medida**: 9 registros com `content_data` dentro de `content_data` (Chords 3, Lyrics 6); 2 Chords sem `chords`; ~11 inválidos do T1-R7 | anexo D5 / adendo |
| **D8**: policies do storage | **fechada**: 13 policies, todas em `storage.objects`, bucket `content-files`; **0 em `storage.buckets`** (os 3 `ON "storage"."buckets"` do dump são 1 índice + 2 triggers); RLS habilitado em `objects` e `buckets` — tabela abaixo | este doc |
| **H-N6**: Install Command filtrado no Vercel | **aberta** — condicionada a N0-H7 (não medido); passo do Marcel | §10 |
| Flake H-N1 localmente | reproduzido 1× (baseline da PR4, diferença 0,955 ms); 0/20 rodadas antes e depois na PR6 | PR4, PR6 |

### 4.1 As 13 policies (`supabase/storage.dump.sql:1216-1264`, 1403 linhas, sha256 `59fe0b65f4e167c0deb918a078cf4943415eb56ce94c8fd5dcfafa2c127f911f`)

O que os docs afirmavam antes: `STORAGE.md` — bucket `content-files` **público por contrato** (leitura sem credencial; B5-D3) e escrita só pela API com service role; `B5-DESENHO.md` — só o SQL de console do `file_size_limit`; `C-PRECHECK.md` div. 1 — policies **não versionadas**, `public: true` medido em runtime. Nenhum doc listava policies.

| # | Nome | Op | Role (`TO`) | Condição | Esperada pelos docs? |
|---|---|---|---|---|---|
| 1 | Allow authenticated uploads | INSERT | (public) c/ `auth.role() = 'authenticated'` | bucket `content-files` | não listada; coerente (só `authenticated`) |
| 2 | Allow authenticated uploads to content-files | INSERT | authenticated | bucket | idem — **duplica 1 e 4** |
| 3 | …content-files 1bf93c3_0 | SELECT | authenticated | bucket | idem — **duplica 12** |
| 4 | …content-files 1bf93c3_1 | INSERT | authenticated | bucket | **duplica 2** |
| 5 | …content-files 1bf93c3_2 | UPDATE | authenticated | bucket | **duplica 11** |
| 6 | …content-files 1bf93c3_3 | DELETE | authenticated | bucket | **duplica 7** |
| 7 | Allow deleting content-files | DELETE | authenticated | bucket | — |
| 8 | Allow public access | SELECT | (public) | bucket | **sim** — é o "bucket público por contrato" (C-D2/B5-D3); **duplica 9** |
| 9 | Allow public read access to content-files | SELECT | (public) | bucket | idem |
| 10 | Allow service role access to content-files | **ALL** (sem `FOR`) | (public) c/ `auth.role() = 'service_role'` | bucket | sim — é o caminho da API (service role) |
| 11 | Allow updating content-files | UPDATE | authenticated | bucket | — |
| 12 | Allow viewing content-files | SELECT | authenticated | bucket | — |
| 13 | **Enable insert for authenticated users only** | **INSERT** | authenticated | **`WITH CHECK (true)` — qualquer bucket** | **não** |

**Achados (declarados, não corrigidos — herança do Bloco D)**:

- **A-1 (destaque)**: a policy 13 permite **INSERT em qualquer bucket** para o role `authenticated` (`WITH CHECK (true)`), fora do `content-files`. Não é `anon`/`public`; mas é a única policy que não restringe bucket. `[hipótese]`: o role `authenticated` do Supabase não tem cliente no Octavia — a auth é Firebase e o servidor usa service role (`AUTH.md` §1) —, então a policy é letra morta enquanto ninguém emitir um JWT do Supabase; ainda assim é superfície a fechar.
- **A-2**: **redundância** — das 13, só 4 são distintas em efeito (public SELECT; authenticated INSERT/SELECT/UPDATE/DELETE em `content-files`; service_role ALL). As policies 1–7, 11, 12 (nove) formam três gerações sobrepostas do mesmo intento; 8 e 9 são idênticas. Higiene: consolidar para ~4 — migração de storage (Bloco D), não deste bloco.
- **Não há** INSERT/UPDATE/DELETE para `anon`/`public`, nem SELECT fora do `content-files`. O contrato do `STORAGE.md` (público para leitura; escrita pela API) está coberto pelas policies 8/9 e 10.

## 5. Divergências consolidadas (35) — origem: P prompt do revisor · D docs · A ambiente · T aparato · X template

| # | Onde | Divergência | Origem |
|---|---|---|---|
| 1 | pre-check | "§12 do C-PRECHECK" não existe | P |
| 2 | pre-check | tabela da Herança com 9 linhas; H-C9 não existe | P |
| 3 | pre-check | H-C2 não é mini-item: o editor do web polui `content_data` | D |
| 4 | pre-check | `route.ts:105-113` → 104–112 | P |
| 5 | pre-check | flake: 3 dos 4 vermelhos; 1 só no `Test coverage` | A |
| 6 | pre-check | comentários stale: 6 ocorrências, não 1 | D |
| 7 | pre-check | `ci.yml` em Node 20 (local/`native.yml` 22) | T |
| 8 | pre-check | peer do expo é opcional; o aviso vem do `react-dom@18` da raiz | T |
| 9 | PR1 §0 | árvore já limpa e em `main` por outra sessão; branches já apagadas | A |
| 10 | PR1 | TTL do cache da cadeia B é 5 min (não 1 h); blacklist 30 min | D |
| 11 | PR1 | grep "5/15min" com 5 resíduos históricos; `rl-auth.spec.ts:111` é código | D |
| 12 | PR1 | `/api/profile` POST com `allowUnverifiedEmail` | D |
| 13 | PR1 | seção do `CLAUDE.md` com 13 linhas físicas (12 de texto) | P |
| 14 | PR2 | `/_not-found` já sai com `private, no-cache, no-store…` | A |
| 15 | PR2 | preview protegido por SSO; bypass secret só inline | A |
| 16 | PR4 | flake reproduzido localmente na baseline | A |
| 17 | PR4 | trecho do `order` em 112–114 após a PR2 | P |
| 18 | PR3 | nenhum doc de `docs/api` falava de `Cache-Control` → `AUTH.md` §1 | D |
| 19 | PR3 | `tests/config/` não existia | T |
| 20 | PR3 | B7-h1 fechada (regex aceita no `source`) | T |
| 21 | PR3 | `/api/nope` fora da regra nova (é o `/_not-found`) | A |
| 22 | PR7 | testes do core já tinham `@vitest-environment node` | D |
| 23 | PR7 | Vitest lê o pragma por regex até em comentário | T |
| 24 | PR7 | `coverage.thresholds.global` inválido — thresholds nunca aplicados | T |
| 25 | PR7 | `tsc` do core sem DOM não conhece `window` | T |
| 26 | PR7 | `native.yml` falhou por zip corrompido do NDK; rerun verde | A |
| 27 | PR7 | 3 avisos de peer pré-existentes (não `react-dom`) | T |
| 28 | PR6 | flake não reproduzido em 20 rodadas locais | A |
| 29 | PR5 | o PUT não carrega a linha (ownership no WHERE) | P |
| 30 | PR5 | editor do web manda `content_data` sem `content_type` no PUT | D |
| 31 | PR5 | `it` antigo (Lyrics sem `lyrics`) vira 400 | D |
| 32 | PR5 | testes no nível do schema (módulo novo não existe no commit 1) | T |
| 33 | PR5 | `docs/ux/B7-anexos/` criado | T |
| 34 | ENC | grep de segredo do dump só acha parâmetros de funções (`next_key_token`…) | P |
| 35 | ENC | 3 matches `ON "storage"."buckets"` são índice + triggers; 0 policies em `buckets` | T |

**Contagem por origem**: P 7 · D 9 · A 8 · T 11 · X 0 = **35** ✓.

## 6. Aparato — o que mudou

- **Vitest `test.projects`** `web` (jsdom + setup + alias) / `core` (node, sem setup, sem alias); gate `packages/core/src/isolation.test.ts`; reporter `verbose` prefixa por projeto.
- **Node 22 no `ci.yml`** (D10); `native.yml` já era 22.
- **`Cache-Control` por config** (`headers()` no `next.config.mjs`) com gate de inventário `tests/config/next-headers.test.ts`; `lib/security-headers.ts:256` continua morto para `/api` (matcher do middleware).
- **Regra de worktree** no `CLAUDE.md` ("uma árvore de trabalho por sessão") — origem: incidente `247ea5c` → `fd63bce` (commit N1 caiu em `b7/precheck`).
- **`@vitest-environment` é detectado por regex no conteúdo, inclusive em comentário** — um controle negativo que "passa cedo demais" foi o sinal.
- **`coverage.thresholds.global` é chave inválida**: os 50% nunca foram aplicados (37,49% reais com EXIT=0) → B8.
- **Preview compartilha o banco de prod** → regra: probe de preview só com rejeições (400 antes do banco) e prova de zero escrita pelo `total` da conta de audit (66).
- **`pnpm db:dump:storage`** (novo script); `supabase db dump` exige Docker e `supabase link` (passo do Marcel).
- **Padrão de PR**: dois commits (`it.fails` → `it`), N declarado, contagem colada por etapa.

## 7. Números

- **Suíte**: 658 → **685** passed (+27: PR2 +2 inventário, PR4 +2 order, PR3 +2 headers, PR7 +2 isolamento, PR5 +19 contrato); skipped 86 → 85 (PR2 tirou o `it.skip` do OWASP); arquivos 76 → **79** (`api-schemas-inventory`, `next-headers`, `isolation`); 4 skipped intocados.
- **`ci.yml`** (Node 20 → 22): 2m43s / 3m23s (#276, #275) → 3m09s (PR7) — Install 6s → 13s (cache frio), Test 30–41s → 38s, Coverage 33–44s → 42s, Build 50–70s → 56s.
- **`native.yml`** na PR7: 1ª tentativa falhou (NDK zip), rerun 6m55s (Gradle 4m52s) contra 7m09s / 8m07s dos runs de 07/09.
- **Lock**: PR7 +38/−32 (`expo`/`@expo/cli`/`@expo/router-server` do nativo → `react-dom@19.2.3`).
- **Coverage** (`All files`): 37,49 / 29,32 / 34,12 / 37,71 → 37,63 / 29,58 / 34,12 / 37,83 (PR7).
- **Contabilidade de prod do bloco**: **6 requests, 0 escrita** — pre-check 3 (`setlist-read` 1 · `content-read` 1 · sem família 1: `/api/debug/config`); PR2 2 (`GET /api/nope`, sem família: §0 pela sessão + §3 pelo Marcel); PR3 1 (`GET /api/health`, sem família); PR1/PR4/PR6/PR7/PR5/ENC 0. Por família: `setlist-read` 1 · `content-read` 1 · sem família 4 · `session` 0 · `authfail` 0.
- **`signInWithPassword`** (Google Identity, fora da API): 3 (pre-check, PR3, PR5).
- **Probes de preview** (Marcel, bypass inline): PR2 2 (`/api/debug/config`, `/api/health`), PR3 7 (1 de proteção + 6, 3 com bearer), PR5 3 (2 POST rejeitados + 1 GET) = **12**; 0 escrita (provada pelo `total: 66`).
- **Leituras do Marcel no console**: D5 (3 queries, 2026-09-08), D8 (dump, 2026-09-09).

## 8. Lições

- **(a) Premissa de prompt é hipótese a medir** — 7 das 35 divergências são do prompt do revisor (3 das 8 do pre-check + 4 nas PRs/encerramento: linhas de doc anterior, "o PUT carrega a linha?", limite de linhas, grep de segredo). Citar linha só com trecho colado vale para todos.
- **(b) "Mini-item" só depois de inventariar os escritores** — o Zod de `content_data` parecia 10 linhas; o inventário mostrou o editor do web espalhando o registro inteiro e o PUT sem `content_type`; virou a maior PR do bloco (+19 testes, SELECT condicional, 3 docs).
- **(c) Controle negativo que passa cedo demais é sinal** — o probe de isolamento "passou antes" por causa de um pragma citado num comentário; se o `it.fails` não tivesse sido lido linha a linha, o gate teria nascido falso.
- **(d) Preview não é sandbox** — compartilha o Supabase de prod; todo probe de preview é read-only ou rejeição garantida pelo Zod, com prova de zero escrita.
- **(e) Validar o par sem quebrar o cliente existente**: quando o payload não traz o discriminador, uma leitura condicional (só nesse caminho) resolve sem exigir mudança no cliente e sem custo nos demais caminhos — afirmado em teste.
- **(f) `db dump` exige Docker e `link`** — o dump é passo do Marcel; o repo versiona o resultado e o script, nunca a credencial.
- **(g) Sessões paralelas no mesmo checkout** — regra de worktree escrita no `CLAUDE.md` depois de um commit alheio cair na branch errada.
- **(h) Thresholds que nunca falham não são thresholds** — medir o "antes" (37%) foi o que revelou a chave inválida.

## 9. Herança

**B8 (pipeline)**: 151 erros de `tsc -p tsconfig.test.json` (por classe: TS2741 31, TS2345 30, TS2532 18, TS2322 17, TS2554 12…; por arquivo: `content-viewer.refactoring.test.tsx` 44, `fase-d/i-add.spec.ts` 23, `auth-penetration-testing.test.ts` 20 — pre-check H-N2; 37 em `tests/ux-audit/**`); `coverage.thresholds.global` fictício (formato válido: `thresholds: { lines, branches, functions, statements }`); promover o step informativo a bloqueante quando zerar.

**Bloco D (web)**: editor polui `content_data` (`components/editors/content-type-editor.tsx:18-26` + `chord-editor.tsx:67` / `tab-editor.tsx:66` / `lyrics-editor.tsx:17` → `content-editor.tsx:91-98`) e manda PUT sem `content_type`; 9 registros com `content_data` recursivo (limpeza com lista nominal + gate humano, padrão B5-D2); 2 Chords sem `chords` que agora recebem 400 no PUT; cookie `firebase-session` 7 d × token 1 h (D8 do web — `AUTH.md` §6.8); login Google quebrado (H18); B11 busca no servidor; **policies do storage**: A-1 (INSERT `authenticated` em qualquer bucket, `WITH CHECK (true)`) e A-2 (9 policies redundantes + 2 duplicadas) — consolidar para ~4 por migração de storage; `Sheet` × `file_url` sem cruzamento (2 registros sem nada).

**N1 (tela 1)**: **errata do PRD §4** — a conta principal tem ~11 registros no estado "inválido" do T1-R7 (≥4 Chords, 2 Sheet, 5 Tab), `sections`/`file` **existem** na principal (o "não existe em item nenhum" do C era da conta de audit), Sheet sempre com `file_url` quando tem `file` (3/3); `docs/api/CONTENT-DATA.md` = contrato de escrita, `AUTH.md` = contrato de servidor; `private, no-store` vivo em prod após a PR3 (N0-H11 fecha só por medição no nativo); design congelado em `docs/native/DESIGN-TELA-1/` (N1-PR0); abrir em sessão nova, worktree próprio se outra sessão estiver aberta.

**B-final**: revogação do bypass secret da Vercel continua como último ato do Bloco B (o B8 ainda o usa).

## 10. Passos do Marcel em aberto

- **H-N6** — Install Command filtrado no Vercel (`pnpm install --frozen-lockfile --filter octavia`): só se N0-H7 mostrar piora (não medido).

## 11. Estado final

- `main` após #279: `a9e543f`; este encerramento em PR (docs + `supabase/storage.dump.sql` + `package.json` + `STORAGE.md` + PLANO). Suíte **685 / 85 (770) · 79 / 4 (83)** intocada por esta PR.
- Contagens em prod (conta de audit): content **66** (P3 da PR5), setlists 3 / songs 69 (pre-check) — idênticas às da abertura; **zero escrita** no bloco.
- Contratos novos/alterados: `AUTH.md` (novo), `CONTENT-DATA.md` (novo), `STORAGE.md` (auth + policies versionadas). `B7-PRECHECK.md` e `PRD-TELA-1.md` (fora a nota N6 da PR4) não editados — a errata do §4 é do pre-check do N1.
- Próximo: **N1**.
