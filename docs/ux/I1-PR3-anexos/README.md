# I1-PR3 — anexos (commit 1: gate e medição, nada apagado)

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
