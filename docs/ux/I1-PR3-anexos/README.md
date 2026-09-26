# I1-PR3 — anexos (o corte: palco, PWA/offline e as quatro páginas)

> **Bloco**: I1 — identidade. **PR**: PR-3, o corte (palco, PWA/offline, quatro páginas).
> **Sha de partida**: `origin/main` = `089f72cdf463b176f34b6dc428ef7373476ff32c`
> (`089f72c Merge pull request #335 from marcelviana/i1/precheck`);
> `git cat-file -e origin/main:docs/ux/I1-PRECHECK.md` → existe.
> **Árvore**: `../octavia-i1-pr3`, branch `i1/pr3-corte`; `pnpm install --frozen-lockfile --offline` →
> `Done in 11.7s using pnpm v10.28.0`. **Data**: 2026-09-26.
> **Fonte do estado**: `docs/ux/I1-PRECHECK.md` (lido inteiro). Convenções dele: `[medido]` = comando +
> saída literal nesta sessão; `[lido]` = arquivo e linha; `[hipótese]` = o resto. Divergências
> **de 550 em diante** (a PR-1 corre em paralelo com 522–549).

| arquivo | o que é |
|---|---|
| [`lista-do-corte.txt`](lista-do-corte.txt) | **a lista fechada**: o que sai (`MORRE`), os símbolos mortos em arquivo que fica (`SIMBOLO`), as referências que não podem sobrar (`TEXTO`), e o que muda nos vivos (`EDITA`, com linhas) |
| [`grafo.txt`](grafo.txt) | reprodução dos scripts do pre-check nesta árvore (4 × `IGUAL`) e a saída do fecho do corte |
| [`script-corte.txt`](script-corte.txt) | texto do script do fecho (rastro; roda do scratchpad, como os do pre-check) |
| [`g-palco-main.txt`](g-palco-main.txt) | `scripts/gates-web/g-palco.sh` nesta árvore, antes do corte — **REPROVA, 141** |
| [`cn-visualizador-hoje.txt`](cn-visualizador-hoje.txt) | o CN do visualizador hoje: 12/12 nos dois modos |
| [`cn-visualizador-mutacao.txt`](cn-visualizador-mutacao.txt) | o controle negativo do CN: com a extensão quebrada, o `Sheet PDF sem-cache` reprova |
| [`g-palco-depois.txt`](g-palco-depois.txt) | o G-palco depois do corte (commit 2) — **PASSA, 0** |
| [`cn-visualizador-depois.txt`](cn-visualizador-depois.txt) | o CN depois do corte, sem o módulo `offline-cache` — **6/6** |
| [`pnpm-2b.txt`](pnpm-2b.txt) | commit 2b: `pnpm remove localforage` e o `pnpm install --frozen-lockfile --offline` que volta a passar |
| [`knip-antes.txt`](knip-antes.txt) · [`knip-depois.txt`](knip-depois.txt) | `pnpm exec knip` na `main` (`089f72c`) e na branch depois do 2b |
| [`aceite-a.txt`](aceite-a.txt) · [`aceite/out-publico/`](aceite/out-publico/) | aceite A: os redirects 308, as rotas mortas 404, as capturas sem sessão |
| [`aceite/aceite-a.mjs`](aceite/aceite-a.mjs) · [`aceite/COMO-RODAR.md`](aceite/COMO-RODAR.md) | aceite A com sessão — **do Marcel** (sem mock de auth no servidor, div. 575) |
| [`sw-autodestruicao.txt`](sw-autodestruicao.txt) · [`aceite/sw-autodestruicao.mjs`](aceite/sw-autodestruicao.mjs) | aceite B: o worker de auto-destruição e o controle com o `sw.js` ausente |

Arquivos novos fora do anexo: `scripts/gates-web/g-palco.sh` + `scripts/gates-web/g-palco-imports.mjs`
(o gate; **não ligado a workflow nenhum**) e `tests/gates/i1-visualizador.test.tsx` (o CN, no projeto
`web` do Vitest — roda no `pnpm test` do CI a partir deste commit).

---

## 1. A lista do corte

**Método** `[medido]` — `grafo.txt`. O mesmo `dependency-cruiser` do pre-check, com `worker/`. Primeiro os
dois scripts do pre-check re-rodados sem mudança: palco-exclusivos 23, pwa-exclusivos 9, exclusivos da
I1-D19 14, importadores vivos 10 — os quatro `diff` contra os anexos do pre-check **vazios**. Depois
um fecho único (`script-corte.txt`): raízes mortas = `app/performance/*` ∪ as nove do PWA/offline ∪
as três páginas; morre = o que só raiz morta alcança. Saída:

```
{ vivas: 28, mortas: 14, morre: 46, porGrupo: 'palco=23 pwa=9 paginas=14', editar: 10, testes: 14, foraDasVivasNaoMortos: 17 }
```

46 = 23 + 9 + 14: juntar os três cortes não cria exclusivo novo, e os 17 fora do alcance são os órfãos
de hoje (nenhum novo). Por grep, o que o grafo não vê: símbolos, rotas por string, arquivos fora do
grafo, testes por `vi.mock`/texto, specs do `ux-audit`.

| grupo | MORRE | SIMBOLO | TEXTO | EDITA |
|---|---|---|---|---|
| palco | 23 | 5 | 2 | 16 |
| pwa | 14 (9 do grafo + `public/sw.js`, `public/manifest.json`, `scripts/build-sw.js`, `hooks/useContentFile.ts` [555], `types/pwa.d.ts` [559]) | — | 3 | 15 |
| páginas | 12 (14 − `skeleton.tsx`, `switch.tsx`, que ficam) | 1 | 1 | 2 |
| testes | 19 | — | — | 18 |
| **total** | **68** | **6** | **6** | **51** |

## 2. G-palco na `main` — REPROVA

`sh scripts/gates-web/g-palco.sh` (saída inteira em `g-palco-main.txt`):

```
G-palco — lista: docs/ux/I1-PR3-anexos/lista-do-corte.txt
MORRE: 68 caminhos · SIMBOLO: 6 · TEXTO: 6
…
G-palco: REPROVA — 141 ocorrência(s)
# exit 1
```

141 = 68 arquivos que existem + 27 imports de arquivo morto por arquivo vivo (26 de hoje + o `vi.mock`
do `offline-cache` no CN novo, que sai no commit 2) + 6 símbolos + 40 linhas de texto. O resolvedor de imports tem controle positivo (arquivo sintético no scratchpad com import
relativo `../../lib/offline-cache`, relativo `./../../hooks/useContentFile` e `import('@/app/offline/page')`
→ os três acusados).

## 3. A medição da I1-D36 — de onde vem o `mimeType` sem o `offline-cache`

**O que o cache dá hoje** `[lido]`: `hooks/useContentFile.ts:29` chama `getCachedFileInfo`
(`lib/offline-cache.ts:286-329`), que devolve `{ url: blob:…, mimeType: stored.mime }` (`:318-323`) — o
`mime` gravado quando o arquivo foi baixado pelo `/api/proxy`. `SheetMusicDisplay.tsx:38-43` e `:69-74`:

```ts
const url = offlineUrl || content.file_url
const mimeType = offlineUrl ? (offlineMimeType || undefined) : undefined
const isPdf = isPdfFile(url, mimeType)
const isImage = isImageFile(url, mimeType)
```

**Sem cache, o `mimeType` já é `undefined` hoje** — é o caminho de todo primeiro acesso a um content. O
tipo sai de `lib/utils.ts:15-55`: com `mimeType`, ele decide; `data:` decide pelo prefixo; `blob:` →
`false`; o resto, pela **extensão da URL** (`urlHasExtension`, `:8-12`, que tira `?query` e `#hash`).
O `mimeType` só é indispensável para URL `blob:` — que só o cache produz.

As três fontes candidatas:

| fonte | medição | serve? |
|---|---|---|
| **registro do content** | `types/database.types.ts`, `content.Row`: `content_type` (`Lyrics`/`Chords`/`Tab`/`Sheet`) e `file_url`; **nenhuma coluna de MIME/tipo de arquivo** `[lido]` | não como coluna — mas o `file_url` do registro carrega a extensão (linha abaixo) |
| **header do storage** | o objeto tem `Content-Type` (`app/api/storage/upload/route.ts:104`, `contentType: file.type`) | sim, mas custa um `HEAD` por visualização — rede para decidir o tipo; descartada |
| **o nome** (extensão do `file_url`) | por construção: o nome do objeto é `${timestamp}-${sanitizedFilename}` (`route.ts:93-94`), a sanitização preserva `.` e a extensão (`:59-62`), `mimeMatchesExtension` recusa extensão × MIME divergentes (`:71-75`; tabela única `lib/api-schemas.ts:225-242` — `pdf`, `png`, `jpg`, `jpeg`, `txt`, `docx`), e os magic bytes provam que os bytes são o MIME (`:84-91`); a URL pública sai desse nome (`:117-119`). No banco: **as 8 `file_url` não nulas de prod** (todas as 194 linhas de `content`, `docs/ux/B5-PRECHECK.md:157-177`, 2026-08-29) terminam em `.pdf` (7) e `.jpg` (1) `[medido no B5; não re-medido aqui — nenhum request a prod]` | **sim** |

**Precedente no próprio app** `[lido]`: o **editor** já decide só pela extensão do `content.file_url`,
sem cache nenhum (`components/editors/content-type-editor.tsx:51-80`: `.pdf` → `PdfViewer`;
`.png`/`.jpg`/`.jpeg` → `Image`).

**Proposta**: a fonte é a **extensão de `content.file_url`** — `isPdfFile(url)` / `isImageFile(url)`
sem `mimeType`, o caminho que hoje já roda sem cache. Nenhuma lógica nova de tipo. No commit 2 o
`useContentFile` morre (sua única função é ler o cache — div. 555), `ContentDisplay` e
`SheetMusicDisplay` perdem as quatro props do cache e leem `content.file_url`. **Resíduo**: URL sem
extensão → *"Failed to load file…"* — que é o que o primeiro acesso já mostra hoje (controle do CN);
em prod não há nenhuma pela medição do B5.

## 4. O CN do visualizador

`tests/gates/i1-visualizador.test.tsx` monta o `content-page-client` para Lyrics, Chords, Tab, Sheet
PDF e Sheet imagem, com o `fetch` substituído por um que registra e recusa, o `PdfViewer` num stub que
expõe o `url`, e o `offline-cache` em dois modos: **com-cache** (devolve `blob:` + `mimeType`) e
**sem-cache** (devolve `null` — o cache desligado). Mais um **controle**: Sheet PDF com `file_url` sem
extensão. Asserção por caso: o texto do tipo aparece; para Sheet, o `url` que chega ao viewer é o
`blob:` com cache e o `file_url` sem; nenhuma chamada a `/api/proxy`.

Hoje (`cn-visualizador-hoje.txt`), **12/12**:

```
 ✓ … com-cache > Lyrics abre · Chords abre · Tab abre · Sheet PDF abre · Sheet imagem abre
 ✓ … com-cache > controle: Sheet PDF sem extensão na URL        (→ PdfViewer, pelo mimeType do cache)
 ✓ … sem-cache > Lyrics abre · Chords abre · Tab abre · Sheet PDF abre · Sheet imagem abre
 ✓ … sem-cache > controle: Sheet PDF sem extensão na URL        (→ "Failed to load file")
      Tests  12 passed (12)
```

Com o cache desligado, **os cinco tipos abrem**; o que o cache acrescenta é só o controle (URL sem
extensão). **Controle negativo** (`cn-visualizador-mutacao.txt`): com `isPdfFile` sem o ramo da
extensão, `sem-cache > Sheet PDF abre` reprova (`Unable to find an element by: [data-testid="pdf-viewer"]`,
`Tests 1 failed | 11 passed`); desfeito por `git checkout lib/utils.ts`. No commit 2 o `vi.mock` do
`@/lib/offline-cache` e o modo `com-cache` saem (o módulo deixa de existir); o CN roda `sem-cache`
contra o código cortado.

## 5. Divergências — 550 a 563

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **550** | D | pre-check §2.2: os tipos só do palco em `types/performance.ts:30-74` são cinco | são **sete**: também `NavigationState` e `PerformanceMetrics` (`:90-104`), sem consumidor fora do palco (`git grep` dos importadores de `types/performance`: só exclusivos do palco, testes que morrem e `components/setlist/index.ts:8`, que reexporta `SetlistWithSongs`/`SetlistFormData`) | commit 2 tira os sete (`:29-104`) |
| **551** | D | pre-check §2.2: *"`grep -rn getSetlistByIdServer` → só essas duas linhas"* | há um terceiro chamador, de teste: `lib/__tests__/setlist-service.test.ts:129-187` (`describe('Server-side operations')`, caso único) | commit 2 tira o `describe` |
| **552** | P | prompt §1: o `next.config.mjs` muda pelos redirects | ele também carrega a exclusão do proxy (`:16`, `'/api/:path((?!proxy).*)'`, e o comentário `:10-12`), afirmada por `tests/config/next-headers.test.ts:32-37`. Sem a rota, a exclusão não exclui nada | **proposta**: `source: '/api/:path*'` (mesmo efeito), teste troca o caso do proxy pelos redirects. Pergunta 1 |
| **553** | A | — | dos 11 `public/icons/*`, só o `icon-192x192.webp` tem leitor de código vivo (`app/layout.tsx:20-22`); os outros 10 só o `manifest.json` e o `sw.js` citam | **ficam** (a identidade decide os ícones) |
| **554** | A | — | a CSP tem `manifest-src 'self'` e o comentário *"For PDF.js and service workers"* no `worker-src` (`lib/security-headers.ts:89-93`) — inertes sem PWA | **não se tocam** (backend, I1-D9); o `blob:` do `worker-src` é do PDF.js |
| **555** | P | prompt §1 / pre-check §17.4: `hooks/useContentFile.ts` é importador vivo a **editar** | a única função do hook é ler o cache (`useContentFile.ts:29`); sem o cache ele devolveria sempre `null`. Com ele saem `tests/hooks/useContentFile.test.ts` (placeholder `describe.skip`) e o mock de `tests/components/content-viewer.refactoring.test.tsx:11,17` | **proposta**: morre; `content-viewer.tsx`, `ContentDisplay.tsx`, `SheetMusicDisplay.tsx` perdem as props do cache |
| **556** | P | I1-D25: *"`content-display.test.tsx` adapta (tira o caso do `optimized-content-display`)"* | **os 7 casos** do arquivo são do `OptimizedContentDisplay` (cabeçalho `:9-14`: *"retargeted … to the live twin mounted at app/performance/page.tsx"*); tirar o caso esvazia o arquivo | **proposta**: morre; Chords no visualizador vivo fica coberto pelo CN novo e pelo `monospace-rendering.test.tsx` |
| **557** | A | — | `__tests__/performance-mode/bug-reproduction-helpers.ts` (auxiliar, não teste) só é importado por `chords-display-bug.test.tsx`, que morre | morre com ele |
| **558** | P | I1-D25: *"nos outros nove specs do `ux-audit` o trecho de `/performance` sai"* | três specs dependem do **offline**, não do palco (I1-D18): `set14-gate.spec.ts` é o gate do cache offline de setlists (projeto `set14-gate`, `serviceWorkers: 'allow'`); `fase-d/c-offline.spec.ts` inteiro é J6 (itens 08, 09, 10: SW, cache de setlist, SET-14); `a-j1` item-01b mede o SW offline. E `harvest.spec.ts:73-76` visita `/settings`, `/profile`, `/setup` (I1-D19) além de `/performance` | **proposta**: `set14-gate` (projeto e spec) e `c-offline` morrem; item-01b sai; as quatro células do `harvest` saem |
| **559** | A | — | `types/pwa.d.ts` (órfão no grafo: tipo global `BeforeInstallPromptEvent`) — o único uso é `components/pwa-install-prompt.tsx:21-64`, que o redeclara | morre (I1-D18: *"o PWA morre por inteiro"*) |
| **560** | A | I1-D18: SW, manifest, `public/sw.js` morrem | **o SW já instalado nos navegadores de quem usou o app não morre com o arquivo** `[hipótese — pelo algoritmo de update do SW, não medido nesta sessão]`: a checagem de update recebe 404 e a registração antiga fica ativa. O worker antigo serve **`/` cache-first para sempre** (`worker/index.js:10-19` põe `'/'` em `ASSETS`; `:70-74` responde do cache) — a landing redesenhada do I1 não chegaria a quem já visitou; o mesmo para `/pdf.worker.min.mjs` (worker do PDF.js velho contra o `react-pdf` novo); e o `PAGE_CACHE` (`:97-104`) guarda o HTML de toda navegação, com dados do usuário, no aparelho. O IndexedDB (`localforage`: content, setlists, fila) também fica | **decisão do Marcel** (pergunta 2). Proposta: `public/sw.js` **não morre — vira um worker que se desfaz** (install → `skipWaiting`; activate → apaga todos os caches e os bancos do `localforage`, `unregister()`, recarrega os clientes); `worker/index.js`, `build-sw.js`, o registro e o manifest morrem como previsto |
| **561** | A | — | escritas na fila offline (`lib/offline-queue.ts`) de quem estava offline no deploy nunca serão reenviadas: quem as processa é `hooks/use-service-worker.tsx:36,226`, que morre | registrado; o worker da 560 as apagaria junto |
| **562** | D | pre-check §17.4 / prompt §1: *"os 4 testes que importam offline/PWA pelo grafo e os 6 que os citam por string"* | pelo `pwa-offline-exclusivos.txt`, 9 citam por string, dos quais 4 também pelo grafo → **5** só por string. Esta sessão acha mais dois por outro caminho: `content-viewer.refactoring.test.tsx` (via `useContentFile`, 555) e `setlist-service.test.ts` (551) | todos na seção 4 da lista, um a um |
| **563** | D | I1-D28: as menções saem com as páginas e com o PWA | fora das superfícies há documentos e um script do palco/PWA: `README.md:24-147,257-263`, `CLAUDE.md` (*"Offline Architecture"*, `components/performance-mode.tsx`), `PERFORMANCE_MODE_TESTING.md`, `scripts/test-performance-mode.sh` (roda quatro testes que já não existem) | **fora da lista**; pergunta 4 |

## 6. Perguntas para o aval

1. **`next.config.mjs:16` (div. 552)**: trocar `'/api/:path((?!proxy).*)'` por `'/api/:path*'` (e o teste),
   declarado no `gates-web` — ou deixar a exclusão morta intocada?
2. **SW já instalado (div. 560)**: `public/sw.js` vira um worker que se desfaz (e apaga caches e
   IndexedDB), ou morre como previsto e o SW antigo fica nos navegadores? Se virar, até quando fica?
3. **As propostas das divs. 555, 556 e 558** (`useContentFile` morre; `content-display.test` morre em vez
   de adaptar; `set14-gate`, `c-offline` e o item-01b morrem com o offline).
4. **Documentos da raiz e o script (div. 563)**: entram no corte, vão para o encerramento do I1, ou ficam?
5. **I1-D36**: a fonte proposta (extensão do `file_url`, §3) serve, ou o corte do `offline-cache` espera?

## 7. Contabilidade deste commit

| item | valor |
|---|---|
| requests a prod (`https://octavia.rocks`) ou preview | **0** |
| requests a `/api/*` | **0** |
| logins | **0** |
| `.env*` abertos | **0** |
| `adb` | **0** |
| arquivos apagados | **0** |
| arquivos tocados | novos: `docs/ux/I1-PR3-anexos/*` (7), `scripts/gates-web/g-palco.sh`, `scripts/gates-web/g-palco-imports.mjs`, `tests/gates/i1-visualizador.test.tsx`. Nada em `apps/native`, `packages/`, `app/`, `lib/`, `supabase/` (o `lib/utils.ts` foi mutado e desfeito para o CN; `git status` limpo nele) |
| comandos locais | `pnpm install --offline`; `depcruise` (2×); os scripts do grafo (do scratchpad); `g-palco.sh`; `vitest` do CN; `pnpm lint` (limpo); `tsc -p tsconfig.json` (0 erros); `tsc -p tsconfig.test.json` (151 erros, todos pré-existentes, nenhum no arquivo novo — é o passo informativo do CI) |

---

## 8. Aval do commit 1 — `[Marcel, 2026-09-26]`

1. `next.config.mjs:16`: `'/api/:path((?!proxy).*)'` → `'/api/:path*'`; o `tests/config/next-headers.test.ts` acompanha; declarado no ```gates-web``` (`gback`).
2. **`public/sw.js` vira worker de auto-destruição** (div. 560): `skipWaiting()` na instalação; na ativação apaga todos os caches, os IndexedDB do app, `unregister()` e recarrega os clientes; sem `fetch` handler; estático, à mão, ≤ 40 linhas. **Fica até o encerramento do I1.** A **div. 561 é aceita** pelo Marcel: as escritas presas na fila offline dos aparelhos se perdem.
3. Divs. 555, 556 e 558 aprovadas como propostas.
4. `PERFORMANCE_MODE_TESTING.md` e `scripts/test-performance-mode.sh` entram no corte (grupo palco); `README.md` e `CLAUDE.md` editados no commit 3, só nas linhas de palco e PWA.
5. **I1-D36 resolvida**: a fonte do tipo do arquivo é a extensão de `content.file_url` (`lib/utils.ts:15-55`), sem lógica nova; URL sem extensão mostra *"Failed to load file"*. A medição das 8 `file_url` é do B5 (`docs/ux/B5-PRECHECK.md:157-177`), não repetida.

## 9. Aval do commit 2 — `[Marcel, 2026-09-26]`

1. Div. 564: `lib/__tests__/security-headers-csp.test.ts` entra no ```gates-web``` como linha própria.
2. Div. 568: as deps dos três `useCallback` entram na tabela das edições (§11), marcadas *memoização; a PR de setlists herda*.
3. Os três redirects passam a `permanent: true` (308).
4. Commit 2b (poda declarada): `localforage` sai do `package.json`; as entries `__tests__/**` e as do `worker` saem do `knip.json`; o `Content` exportado de `types/performance.ts` sai. `@radix-ui/react-switch` fica. Nada mais que o `knip` acuse sai.

## 10. A lista do corte final `[medido]`

`awk -F'\t' '$1=="MORRE"' lista-do-corte.txt` por grupo: **palco 25** (os 23 do grafo + `PERFORMANCE_MODE_TESTING.md` + `scripts/test-performance-mode.sh`) · **pwa 13** (os 9 do grafo + `public/manifest.json`, `scripts/build-sw.js`, `hooks/useContentFile.ts`, `types/pwa.d.ts`; o `public/sw.js` saiu da lista `MORRE` e virou `FICA` + `SIMBOLO`, aval 2) · **páginas 12** · **testes 19** = **69 arquivos apagados** (`git diff --name-only --diff-filter=D 089f72c HEAD | wc -l` → 69). O 2b não apagou arquivo: tirou a dependência `localforage` (+ `lie` no lockfile), a entry `__tests__/**` do `knip.json` e o `export` do `Content`. Mais 7 `SIMBOLO` e 6 `TEXTO`.

**G-palco** — antes (`g-palco-main.txt`, commit 1): `G-palco: REPROVA — 141 ocorrência(s)` (68 existem · 27 imports · 6 símbolos · 40 textos). Depois (`g-palco-depois.txt`, commit 2; e de novo no 2b):

```
MORRE: 69 caminhos · SIMBOLO: 7 · TEXTO: 6
## 1. MORRE — o arquivo existe            ✓ nenhum
## 2. MORRE — o arquivo é importado       ✓ nenhum
## 3. SIMBOLO — símbolo morto …           ✓ nenhum
## 4. TEXTO — referência a rota/arquivo … ✓ nenhum
G-palco: PASSA — 0 ocorrências
# exit 0
```

**CN do visualizador** — antes: **12/12** = 6 casos × 2 modos do cache (`cn-visualizador-hoje.txt`); depois: **6/6**, só o modo sem cache, porque o módulo não existe mais (div. 565; `cn-visualizador-depois.txt`). O controle negativo por mutação (`cn-visualizador-mutacao.txt`) é do commit 1.

**Verdes** (commit 2 e de novo no 2b): `pnpm test` → `Test Files 103 passed | 3 skipped (106)` · `Tests 1005 passed | 77 skipped (1082)` (na `main` `089f72c`: `115 passed | 4 skipped (119)` · `1090 passed | 85 skipped (1175)`); `tsc -p tsconfig.json` → 0 erros; `tsc -p tsconfig.test.json` → **103** (era 151 na `main`; os 48 a menos são de arquivos apagados); `pnpm lint` → `✔ No ESLint warnings or errors`; `pnpm build` → `✓ Compiled successfully`, a tabela sem `/performance`, `/profile`, `/settings`, `/setup`, `/offline`, `/api/proxy`; G-rotas → 11 testes.

**knip** (`knip-antes.txt` × `knip-depois.txt`, comparado sem números de linha): **novos** na branch — `@radix-ui/react-switch` sem uso (fica, aval 4: `switch.tsx` fica); nenhum outro. **Resolvidos**: os exports do palco e do cache, a dependência `localforage` (saiu no 2b), a hint da entry `__tests__/**` (saiu no 2b). O `skeleton.tsx` e o `switch.tsx` não aparecem como arquivo órfão porque o `knip.json` ignora `components/ui/**`. `Setlist` e `SetlistSong` de `types/performance.ts` seguem na lista de exports sem uso **como já estavam na `main`**.

## 11. As edições nos vivos (46 arquivos modificados, fora `docs/`, `README.md`, `CLAUDE.md` e `pnpm-lock.yaml`) `[medido]`

Linhas **da `main`** (`git diff -U0 089f72c HEAD`, faixa `-a,b` de cada hunk). O que cada uma faz está na `lista-do-corte.txt` (`EDITA`).

| arquivo | linhas (na `main`) |
|---|---|
| `app/layout.tsx` | 8,10,18,128-129 |
| `components/content-edit-page-client.tsx` | 2,9,25-31 |
| `components/content-page-client.tsx` | 2,6,30-36,45-49,82 |
| `components/content-viewer.tsx` | 3,14,22,34-40,70,95-98 |
| `components/content-viewer/ContentDisplay.tsx` | 13-16,32-35,52-58 |
| `components/content-viewer/ContentHeader.tsx` | 3,16,45,91-100 |
| `components/content-viewer/SheetMusicDisplay.tsx` | 9-12,15-21,26-35,37-84 |
| `components/dashboard-page-client.tsx` | 33-36,42 |
| `components/dashboard.tsx` | 37,46 |
| `components/setlist-manager.tsx` | 6,33-37,98,118,130,142,188,201,219,230,262,273-275 (130, 201, 230: `setlists` sai das deps de três `useCallback` — **memoização; a PR de setlists herda**, div. 568, aval 2) |
| `components/setlist/setlist-card.tsx` | 6,36,60,181-195 |
| `components/setlist/setlist-details.tsx` | 6,35,76,166-174,273-283 |
| `components/setlist/setlist-list.tsx` | 26,40,127 |
| `components/setlists-page-client.tsx` | 41-45,65 |
| `components/user-header.tsx` | 15,67-73 |
| `contexts/__tests__/firebase-auth-context.test.tsx` | 31-38 |
| `contexts/firebase-auth-context.tsx` | 18-19,374,380-390 |
| `hooks/__tests__/use-library-data.test.tsx` | 10-16,29-30,37,40-41,52-54 |
| `hooks/__tests__/use-setlist-data.test.tsx` | 15-28,38-42,162-163,167-171,180-185,292-318,323-326,334,337-338,347-385,389-390,405-406,420-430 |
| `hooks/use-content-actions.ts` | 7,55-61 |
| `hooks/use-library-data.ts` | 5,136-139,149-162 |
| `hooks/use-setlist-data.ts` | 7-8,45-47,53-75,77-81,93,109-115,118-122,128-134,136,141-143 |
| `knip.json` | 5-6,9-10,20 |
| `lib/__tests__/security-headers-csp.test.ts` | 5,9,12-13,16,18,32 |
| `lib/__tests__/setlist-service.test.ts` | 128-189 |
| `lib/content-service-server.ts` | 90-170 |
| `lib/content-service.ts` | 5,521-528,563-570,605-611 |
| `lib/protected-routes.ts` | 6-9,17-18,40-41,44 |
| `lib/security-headers.ts` | 79-85,254-255 |
| `next.config.mjs` | 10-12,16,20 |
| `package.json` | 8-9,62 |
| `playwright.ux-audit.config.ts` | 85-114 |
| `public/sw.js` | 1-2,4-47,49-50,53-58,60-122 |
| `tests/components/content-viewer.refactoring.test.tsx` | 11,17,45,96-104,116,122,345-395,487-499,555-570 |
| `tests/config/next-headers.test.ts` | 6-8,11,14,17,19-20,23,32,34-36 |
| `tests/gates/g-rotas-protegidas.test.ts` | 9,52-55,61-63 |
| `tests/ux-audit/fase-d/a-j1.spec.ts` | 1-3,6,12-278 |
| `tests/ux-audit/fase-d/b-pdf.spec.ts` | 1,3,5,8-13,19,32-200 |
| `tests/ux-audit/fase-d/cont01-02-monoespacado.spec.ts` | 2,22-31,135-173 |
| `tests/ux-audit/fase-d/f-library.spec.ts` | 3,7,11-15,16,136-196 |
| `tests/ux-audit/fase-d/g-viewer.spec.ts` | 3,7,140,165,173-178,236-283 |
| `tests/ux-audit/fase-d/h-perf.spec.ts` | 3,7-8,11-16,17,25-184 |
| `tests/ux-audit/fase-d/recorder.ts` | 253-297 |
| `tests/ux-audit/harvest-populated.spec.ts` | 25-27,97-99,126-129,389-465,520-521,531-536,559 |
| `tests/ux-audit/harvest.spec.ts` | 73-76 |
| `types/performance.ts` | 4,7,28-104 |

`contexts/firebase-auth-context.tsx` (também da PR-1): **só** `:18-19` (imports do cache), `:374` (`const uid`, que só a limpeza lia) e `:380-390` (o bloco `Promise.all` de `clearOffline*` no logout). Nada de auth.

## 12. Aceite A — o visualizador e as telas (`aceite-a.txt`)

Servidor: `next dev -p 3000` na branch, **sem `.env*`**. `pnpm build && pnpm start` compila, mas em http local toda página vem vazia (`middleware.ts:23-25` manda para https) — div. 570.

```
# $ curl -sI 'http://localhost:3000/performance?contentId=cn-content-123'
HTTP/1.1 308 Permanent Redirect
location: /content/cn-content-123?contentId=cn-content-123
# $ curl -sI 'http://localhost:3000/performance?setlistId=cn-setlist-456&startingSongIndex=2'
HTTP/1.1 308 Permanent Redirect
location: /setlists?setlistId=cn-setlist-456&startingSongIndex=2
# $ curl -sI 'http://localhost:3000/performance'
HTTP/1.1 308 Permanent Redirect
location: /dashboard
/profile /settings /setup /offline /api/proxy /api/proxy?url=… → HTTP/1.1 404 Not Found (os seis)
```

O Next **repassa a query** ao destino (`?contentId=…`, `?setlistId=…&startingSongIndex=…`) — div. 571.

Capturas sem sessão (`aceite/out-publico/`, Chrome do sistema, 1138 px): `landing.png` (`/`, página inteira, 1138 × 2670) e `privacy-policy.png` (1138 × 1336); `/dashboard`, `/library`, `/setlists`, `/content/[id]` e `/content/[id]/edit` sem sessão → `/login`. Contabilidade da rodada: 0 escrita, 0 `octavia.rocks`, 0 outro host, 0 erro de página.

**Com sessão — pendente do Marcel** (div. 575): o servidor em execução não tem mock de auth; toda página protegida passa por `requirePageUser` → `getServerSideUser` (Firebase Admin). Os mocks de auth dos testes do web (`src/test-setup.ts:83-107`) só existem no Vitest. O que prova hoje que os quatro tipos abrem sem o cache é o CN (6/6). Roteiro: `aceite/COMO-RODAR.md`; o script grava em `aceite/out-sessao/`.

## 13. Aceite B — a auto-destruição do worker (`sw-autodestruicao.txt`, verbatim)

Local, sem login, Chrome do sistema com perfil persistente fora da árvore; `main` = `../octavia-i1-pr3-main` (`089f72c`) e branch em `next dev -p 3000` (div. 570). Semeadura declarada no script: `octavia-performance-cache` e `firebaseLocalStorageDb` (o `localforage` é o app que cria ao abrir `/`).

| | rodada 1 — `main` (perfil B) | rodada 2 — branch com o worker novo (perfil B) | controle — branch com `sw.js` **404** (perfil C) |
|---|---|---|---|
| `registration.update()` | — | `update() resolvido` | `update() rejeitado: … A bad HTTP response code (404) was received when fetching the script.` |
| registros | 1 (`/sw.js`, `activated`) | **`[]`** | 1 (`/sw.js`, `activated`) — em 30 s não troca |
| `controller` | `/sw.js` | **`null`** | `/sw.js` |
| `caches.keys()` | `octavia-v1`, `octavia-static-v1` | **`[]`** | `octavia-v1`, `octavia-static-v1` |
| `indexedDB.databases()` | `firebaseLocalStorageDb`, `localforage`, `octavia-performance-cache` | **`firebaseLocalStorageDb`** | os três |
| `/` guardado no cache | 118430 B, com `<link rel="manifest">` | **`null`** | 118430 B, com o link |
| documento de `/`, 2ª carga | `fromServiceWorker: true` | **`fromServiceWorker: false`**, corpo 117770 B sem o link (HTML da branch) | `fromServiceWorker: true`, corpo 117770 B sem o link |

Na rodada 2 o worker novo recarregou a aba sozinho (um documento `fromServiceWorker: false` aos 3984 ms, depois do `update()` aos 2832 ms).

**O controle, como medido** (a hipótese da div. 560): com o `sw.js` em 404 o `update()` é rejeitado e o worker antigo **fica registrado e controlando**, com os dois caches e os três bancos. O documento `/` **passa por ele** (`fromServiceWorker: true`), mas o corpo que chega é o da branch (117770 B, sem o link; o `/` guardado no cache tem 118430 B, com o link) `[medido]`. Por que o `caches.match('/')` do worker antigo não serviu o que estava guardado (e.g. o `Vary: Accept-Encoding, User-Agent` da resposta) é `[hipótese]`. A primeira passada usava como marcador o `<link rel="manifest">` do DOM, que não diz de onde o HTML veio; o script passou a ler o corpo da resposta e as três rodadas foram refeitas com perfis novos (rastro no fim do arquivo).

**Herança nomeada** (aval 2): remover `public/sw.js` (auto-destruição) e o `worker-src`/`manifest-src` da CSP (`lib/security-headers.ts`); **destino: o bloco seguinte ao I1**. Div. 561, **aceita pelo Marcel**: as escritas presas na fila offline (`localforage`) de quem estava offline no deploy se perdem; o worker novo apaga o banco.

## 14. Docs da raiz (aval 4) — as linhas mudadas

`README.md` (linhas da `main`): `24-30` (a seção *Performance Mode* das features vira uma nota: o palco saiu, tocar é do app nativo) · `38` (*Performance Integration*) · `90` (*Performance Mode* do responsive) · `114-116` (`ALLOWED_PROXY_HOSTS`: não é mais do proxy offline — é a lista de hosts de imagem do `next.config.mjs`) · `125-126` (*Customize Settings … keyboard shortcuts* e *Try Performance Mode*) · `141` (*Start Performance*) · `143-148` (o guia *Performance Mode*) · `177` (*Stage-optimized performance mode*) · `257-264` (*Offline Support* e *Service Worker Updates* viram *Online only*).

`CLAUDE.md` (linhas da `main`): `10` (`pnpm build` sem "+ service worker") · `114` (*Offline Support*: só online desde a I1-PR-3) · `133` (`offline-cache.ts` sai da lista de `/lib`) · `196` (*Performance Mode*: removido do web) · `198` (*Offline Support*: nenhum no web) · `373-399` (*Offline Architecture* e *PWA & Mobile Performance* viram um parágrafo: só online, o worker de auto-destruição e a herança) · `537-538` (`lib/offline-cache.ts` e a linha de aparato do palco web, `components/performance-mode.tsx`, saem de *Important Files*). **Não tocadas** (div. 572): as regras genéricas que ainda falam de cache/offline (*Priority 1/2* de performance, `:325-345`; o item *Offline Support* do checklist, `:519`; *Test offline functionality*, `:505`; *Consider offline implications*, `:528`, `:549`).

## 15. Divergências 564–575 (as 550–563 estão na §5)

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **564** | A | a lista do commit 1 cobria os testes da CSP | `lib/__tests__/security-headers-csp.test.ts` (gate do PERF-02) afirmava `frame-src ['blob:']`; passa a `["'none'"]` | linha própria no ```gates-web``` (aval 1 do commit 2); a PR-2 reabre |
| **565** | P | *"CN 12/12 sem cache"* | os 12 eram 6 casos × 2 modos; sem o módulo só há um modo: **6/6** | registrado |
| **566** | D | `dashboard.tsx:37,46` — *"prop e o botão que a chama"* | a prop era recebida e nunca chamada; não havia botão | só a prop saiu |
| **567** | D | `knip.json:6` | também `worker/index.js` (entry) e `worker/**/*.js` (project) | saíram no commit 2 |
| **568** | A | — | três `useCallback` do `setlist-manager.tsx` (`:130`, `:201`, `:230` da `main`) tinham `setlists` nas deps só pelo `saveSetlists`; o lint acusou | saíram; **memoização, a PR de setlists herda** (aval 2) |
| **569** | T | aval 4: *"lockfile atualizado com `pnpm install`"* | foi `pnpm remove localforage` (mesmo efeito); o lockfile re-resolveu de carona `babel-plugin-react-compiler@1.0.0 → '@babel/types': 7.29.8` (dependência do nativo), **devolvido à mão a 7.28.5**; o diff do lockfile fica só `localforage` + `lie`; `pnpm install --frozen-lockfile --offline` → `Already up to date`, exit 0 (`pnpm-2b.txt`) | registrado |
| **570** | T | aceites: *"`pnpm build && pnpm start -p 3000`"* | em produção o middleware manda todo `http://` para `https://` (`middleware.ts:23-25`); em `localhost` toda página responde `200` com corpo **vazio** (`/`, `/login`, `/privacy-policy` → `200 0B`; `/api/health` → `200 15B`). A 1ª rodada B contra `next start` deu `ready → timeout 30s` e 0 registros | os dois aceites rodam em `next dev` (o registro do SW não depende do modo: `hooks/use-service-worker.tsx:19-22`); o `pnpm build` segue verde |
| **571** | A | redirects para `/content/[id]`, `/setlists`, `/dashboard` | o Next repassa a query ao destino (`/content/X?contentId=X`, `/setlists?setlistId=…&startingSongIndex=…`); as páginas ignoram esses parâmetros | registrado; inofensivo |
| **572** | P | aval 4: *"só nas linhas de palco e PWA"* | além das tocadas, o `CLAUDE.md` tem regras genéricas de cache/offline (`:325-345`, `:505`, `:519`, `:528`, `:549`) | **não tocadas**; decisão do Marcel |
| **573** | A | div. 560: *"serve `/` cache-first para sempre"* `[hipótese]` | controle medido: o worker antigo fica, com caches e bancos, e o documento `/` passa por ele — mas o corpo é o da rede (§13) | registrado como medido; o porquê é `[hipótese]` |
| **574** | A | prompt: sobre o `0029d80`, `git diff --shortstat origin/main` | a #336 (PR-1) foi mergeada na `main` (`b68305b`) durante esta PR; contra `origin/main` o diff inclui a PR-1 ao contrário. `git merge-tree --write-tree HEAD origin/main` → **1 conflito**, em `contexts/firebase-auth-context.tsx` | contagens contra a base `089f72c`; a atualização com a `main` (sem push forçado) é o próximo passo, depois do aval |
| **575** | P | aceite A: *"se a tela exigir sessão, use o mock de auth que os testes do web já usam"* | não há mock de auth no servidor em execução; os do Vitest (`src/test-setup.ts:83-107`) não se aplicam a um `next dev` | as capturas com sessão vão para o Marcel (`aceite/COMO-RODAR.md`) |

## 16. O bloco ```gates-web``` (copiado do corpo da PR)

```gates-web
gback: app/api/proxy/route.ts — removido, I1-D18
gback: next.config.mjs — redirects I1-D22; padrão /api sem (?!proxy), aval 1
gback: next.config.mjs — redirects permanent: true
gback: lib/content-service-server.ts — getSetlistByIdServer removido, I1-D23
gback: lib/protected-routes.ts — /performance, /settings, /profile removidos, I1-D23/div. 505
gback: lib/security-headers.ts — ramo /performance e 'blob:' removidos, I1-D23/D24
gback: lib/__tests__/security-headers-csp.test.ts — frame-src 'blob:' → 'none', I1-D24 (a PR-2 reabre)
grotas: tests/gates/g-rotas-protegidas.test.ts — PAGE_INVOCATIONS 8 → 5, 17 → 11 testes, I1-D25
gpalco: docs/ux/I1-PR3-anexos/lista-do-corte.txt — lista fechada do corte
```

O bloco ```gates``` do corpo está vazio.

## 17. Contabilidade da PR (commits 1, 2, 2b, 3)

| item | valor |
|---|---|
| requests a prod (`https://octavia.rocks`) | **0** |
| requests a `/api/*` fora de `localhost` | **0** |
| logins | **0** |
| `.env*` abertos | **0** (as árvores só têm `.env.example`, não aberto) |
| escritas | **0** |
| `adb` | **0** |
| arquivos apagados | **69** (`git diff --name-only --diff-filter=D 089f72c HEAD`) |
| arquivos modificados fora de `docs/` | 46 + `README.md`, `CLAUDE.md`, `pnpm-lock.yaml` |
| arquivos novos | `scripts/gates-web/g-palco.sh`, `g-palco-imports.mjs`, `tests/gates/i1-visualizador.test.tsx` e o anexo |
| testes | Vitest: 1175 → 1082 casos (1090 → 1005 passed, 85 → 77 skipped); a seção *testes* da lista apaga **19** arquivos = 14 de teste do Vitest + 1 bench (`live-music-performance.bench.tsx`) + 1 auxiliar (`bug-reproduction-helpers.ts`) + 3 specs do ux-audit; arquivos do Vitest 119 → 106 (−14 + o CN novo); **8 do Vitest adaptados** (`g-rotas-protegidas`, `next-headers`, `security-headers-csp`, `setlist-service`, `firebase-auth-context`, `use-library-data`, `use-setlist-data`, `content-viewer.refactoring`) + o CN novo reduzido a um modo; ux-audit: **8 specs adaptados** (`harvest`, `harvest-populated`, `a-j1`, `b-pdf`, `cont01-02`, `f-library`, `g-viewer`, `h-perf`) + `recorder.ts` + o config |
| `git diff --shortstat 089f72c` (base) | preenchido no corpo da PR depois do commit 3 |
| servidores locais | `next dev`/`next start` em `localhost:3000`, parados ao fim; árvore de apoio `../octavia-i1-pr3-main` (`089f72c`) |
