# I1-PR-5 — anexos (os gates do web: G-back, G-palco, G-tok, G-faixa e `gates-web.yml`)

> **Bloco**: I1 — identidade. **PR**: [#340](https://github.com/marcelviana/octavia/pull/340), a PR de gate da I1-D13/D15.
> **Sha de partida**: `origin/main` = `73612be4d5d26536e28983eaf803e35394318182` (`Merge pull request #339`);
> `git cat-file -e origin/main:packages/identidade/src/tokens.ts` → existe. **Árvore**: `../octavia-i1-pr5`,
> branch `i1/pr5-gates-web`; `pnpm install --frozen-lockfile --offline` → `Done in 13s using pnpm v10.28.0`.
> **Data**: 2026-09-27. **Convenções** (as do `I1-PRECHECK.md`): `[medido]` = comando + saída literal, no arquivo
> de `cn/` citado; `[lido]` = arquivo e linha; `[hipótese]` = o resto. Divergências **612–635**, numeração conferida
> pela coluna: `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | sort -t'*' -k3 -n | tail -3` → 609, 610, 611.
> **Esta PR só cria instrumento**: nenhuma linha em `app/`, `components/`, `lib/`, `apps/native`, `packages/`.

| arquivo | o que é |
|---|---|
| `cn/g-back-pr3-sem-bloco.txt` · `cn/g-back-pr3-com-bloco.txt` | CN do G-back sobre a PR-3 (`089f72c` → `c68170b`): sem o bloco **REPROVA 5**; com o bloco original da #337 **PASSA** |
| `cn/g-back-ii-iii.txt` | CN das regras (ii) e (iii), com mutação temporária desfeita: **REPROVA 4** |
| `cn/gates-web-decl.txt` | o extrator: o que ele recusa, e o corpo com os dois blocos lido pelos dois extratores |
| `cn/g-palco.txt` | CN do G-palco: `app/performance/page.tsx` recriado → **REPROVA 1**; apagado → **PASSA 0** |
| `cn/g-tok.txt` | G-tok (i) e (ii) na árvore, os três CNs, o `conferir.mjs` pelo `tsx` × o `saida.txt` congelado (diff vazio) e pelo Node puro (quebra, div. 613) |
| `cn/g-faixa-sem-base-url.txt` | sem `G_FAIXA_BASE_URL`: a config lança antes de qualquer navegador |
| `cn/g-faixa-coleta.txt` | CN da coleta no navegador (página sintética) e da comparação com a folha (4 px) |
| `cn/g-faixa-publicas-main.txt` | a medição das três públicas da `main`, pelo executor, sem sessão |
| `cn/g-faixa-cn-main.txt` | **a linha de base do web velho**: o veredito sobre `tests/gates-web/medicoes/cn-main/` — **REPROVA 46**, recalculado no commit 3 com as decisões 619 e 621 |
| `cn/storage-state.txt` · `storage-state.mjs` | a hipótese do `storageState({ indexedDB: true })` (§5) |
| `cn/tsconfig-docs.txt` | o extra do `tsconfig.json`: `tsc` e `pnpm build` antes e depois |
| `cn/ci-commit1.txt` | o CI do commit 1: o `gates-nativos` verde com os dois blocos (CN da I1-D20), o que disparou, e o `g-palco` que quebrou no Linux (div. 631) |
| `cn/ci-commit2.txt` | o CI do commit 2: os quatro jobs do `gates-web` verdes, o `g-palco` **no Linux** (prova da div. 631) |
| `cn/g-tok-falso-positivo.txt` | o CN de falso positivo do G-tok (ii) (decisão 622) |

---

## 1. Os quatro gates

| gate | arquivos | o que lê | o que REPROVA | onde roda |
|---|---|---|---|---|
| **G-back** | `scripts/gates-web/g-back.sh`, `g-back-derivar.mjs`, `g-back-nucleo.txt`, `gates-web-decl.sh` | o núcleo = o **congelado** (`g-back-nucleo.txt`, 39 arquivos) ∪ o grafo do `dependency-cruiser` na BASE ∪ no HEAD ∪ o próprio congelado; as linhas `gback: <caminho> — <razão>` do bloco ```gates-web``` do corpo da PR | (i) arquivo do núcleo mudou (conteúdo, criação, remoção) sem `gback:`; (ii) a derivação do HEAD traz arquivo fora do congelado sem `gback:`; (iii) `gback:` de arquivo que não mudou (órfã, a regra da W4-b1). Sem par de refs: recusa (exit 2, a regra da W4-a) | job `g-back` |
| **G-palco** | `scripts/gates-web/g-palco.sh`, `g-palco-imports.mjs` (da I1-PR3) | `docs/ux/I1-PR3-anexos/lista-do-corte.txt` | caminho MORRE que existe ou é importado; SIMBOLO; TEXTO | job `g-palco` |
| **G-tok** | `scripts/gates-web/g-tok.mjs`, `g-tok-arquivos.txt`, `docs/ux/DESIGN-I1/erratas.json` | (i) os achados do `conferir.mjs` (pelo `tsx`) × o `erratas.json`; (ii) os arquivos de `g-tok-arquivos.txt` (vazio nesta PR) | (i) achado descoberto, errata órfã, `n` diferente do declarado; (ii) literal de cor, de tamanho de fonte ou de espaçamento fora das custom properties de `app/styles/identidade.css`, e texto em inglês **em posição de texto** — texto JSX, `placeholder`, `aria-label`, `title`, `alt` (I1-D17, decisão 622). No job também: `shasum -c` do `DESIGN-I1` e o `css.test.ts` (gerado == fonte) | job `g-tok` |
| **G-faixa** | `playwright.g-faixa.config.ts`; `scripts/gates-web/g-faixa-{medir,coleta,sessao,superficies}.ts`, `g-faixa-classificar.mjs`, `g-faixa-veredito.mjs`, `COMO-RODAR.md` | no CI, **só** `tests/gates-web/medicoes/*.json` (sem subpastas) | (e) e (b) em 1138 e 711; JSON sem controle positivo, com escrita no log, sem a largura de referência, ou com Chromium fora do fixado. (d′), errata candidata (4 px contra a folha), saídas nome-acessível e rolagem, e tudo de 411: **contados, não reprovam** | job `g-faixa` (veredito); a medição é local |

**O núcleo do G-back** `[medido]` (`node scripts/gates-web/g-back-derivar.mjs . --por-que`): (a) 13 rotas +
`middleware.ts` + 19 de `lib/`/`types/` alcançados = 33 · (b) `git ls-files supabase` = 3 · (c)
`lib/require-page-user.ts`, `lib/content-service-server.ts` = 2 · (d) `next.config.mjs` = 1 → **39**. Contra os 35 de
(a) do pre-check: saíram `app/api/proxy/route.ts` (I1-PR3) e `lib/supabase.ts` (só o proxy o alcançava).

**A classificação do G-faixa** (`g-faixa-classificar.mjs`, função pura; o veredito a refaz sobre o JSON): a faixa C
(1138) é a referência. **(e)** = nó de 1138 que em W não existe (**sem nó**) ou perdeu parte do texto (**texto some do
nó**: o par pela ordem de papel+tag, div. 630) ou tem largura/altura zero. **(b)** = nó que passa da borda do viewport,
cortado por contêiner que não rola, conteúdo cortado no próprio nó (elidir), página com rolagem horizontal, ou nó fora
**na horizontal** de um contêiner que rola — salvo o contêiner marcado `data-rolagem="painel"` (o corpo de conteúdo da
resposta 19 da folha), que conta como **(d′)** (decisão 621). **Faixa A (411)**: contada à parte; o veredito lista, por
superfície, toda (e) de 411 com o nome acessível — a herança nomeada da I1-D11, *inalcançáveis em A* (decisão 619).
**(d′)** = mais de 40 % mais alto, ou mais estreito e mais alto. **Saídas** (N3-D29): nome-acessível (o texto de 1138
é o `aria-label` de um nó em W) e rolagem (fora da área de um contêiner que rola). **Errata candidata** = |Δ| > 4 px
contra a moldura C/B da seção, quando a superfície estiver `implementada`.

**Chromium**: o do Playwright, `pnpm exec playwright install chromium` → `Chromium 140.0.7339.16 (playwright build
v1187)`, do `playwright-core@1.55.0` do lockfile. O medidor confere `browser.version()` e para se divergir (div. 512).

**Requests**: o listener corrigido da I1-PR1 (div. 522) — por contexto, linha no `request`, status no `response`,
fim à parte — e o controle positivo antes de medir: `GET /api/health?cn=controle-1` e `?cn=controle-2` no mesmo tique
de uma recarga. Presente nas 21 medições (`GET 200` em todas; o fim `ERR_ABORTED` é o da div. 522: corpo não lido).

## 2. Os CNs `[medido]`

Verbatim em `cn/`. Resumo:

| CN | resultado |
|---|---|
| G-back sobre `c68170b`, sem bloco | `REPROVA — 5` (`app/api/proxy/route.ts` removido; `content-service-server.ts`, `protected-routes.ts`, `security-headers.ts`, `next.config.mjs` modificados) |
| G-back sobre `c68170b`, com o bloco da #337 | `PASSA` (o `gback:` do `security-headers-csp.test.ts`: mudou, fora do núcleo — registro) |
| G-back (ii) e (iii), mutação desfeita | `REPROVA — 4` (rota modificada, arquivo novo sem declaração, arquivo novo fora do congelado, `lib/logger.ts` declarado e não mudou) |
| G-palco com `app/performance/page.tsx` | `REPROVA — 1`; apagado, `PASSA — 0`, `app/` limpo |
| G-tok (i) na árvore | `achados do conferir: 19 · cobertos: 19 · descobertos: 0 · erratas: 8 · órfãs: 0` → `PASSA` |
| G-tok (i) sem a I1-E5 | 8 achados descobertos → `REPROVA — 8` |
| G-tok (i) com errata órfã e `n` errado | `REPROVA — 2` |
| G-tok (ii) com a fixture na lista | `#ff0000`, `font-size: 14px`, `"Loading..."` → `REPROVA — 3`; fora da lista → `PASSA` |
| G-faixa sem `G_FAIXA_BASE_URL` | `Error: G-faixa: G_FAIXA_BASE_URL é obrigatória … nenhum navegador foi aberto.`, exit 1; `DEBUG=pw:browser*` mudo; `pgrep` 0 |
| G-faixa, coleta sintética em 711 | (e) = `sem nó: Painel`, `sem nó: Biblioteca`; (b) = página com rolagem horizontal, borda do contêiner, borda do viewport, conteúdo cortado no próprio nó; rolagem 3 |
| G-faixa, folha contra si mesma | 0 errata; com 5 px de desvio, 1 (`delta [5,0,0,0]`) |
| classificador (Vitest) | `tests/gates-web/g-faixa-classificar.test.ts` 11/11 (com os dois casos da decisão 621) |
| G-tok (ii), falso positivo (decisão 622) | `const newContent`, `fileUrl` → **PASSA**; `<p>New content</p>` → **REPROVA 1** |
| **G-faixa na `main`** | **`REPROVA — 46`** (§3) |
| I1-D20 no CI | `gates-nativos` **success** com os dois blocos no corpo ([36339237181](https://github.com/marcelviana/octavia/actions/runs/36339237181/job/108675926973)); `declarações (0 linhas)`, G1a/G1b/G2/G3 ✓; o `native` **não disparou** |

## 3. A linha de base do web velho `[medido]`

`tests/gates-web/medicoes/cn-main/` — `(e) | (b) | (d′) | saídas nome-acessível/rolagem`, estado `base`:

| superfície | 1138 | 711 | 411 (à parte) | inalcançáveis em A (411) — decisão 619 |
|---|---|---|---|---|
| `/login` | 0 · 0 · 0 · 0/0 | 0 · 0 · 0 · 0/0 | 0 · 0 · 0 · 0/0 | — |
| `/` (landing) | 0 · 0 · 0 · 0/0 | 0 · 0 · 0 · 0/0 | 0 · 0 · 7 · 0/0 | — |
| `/privacy-policy` | 0 · 0 · 0 · 0/0 | 0 · 0 · 4 · 0/0 | 0 · 0 · 20 · 0/0 | — |
| `/dashboard` | 0 · 0 · 0 · 0/1 | **3** (3 sem nó) · 0 · 2 · 1/6 | 3 · 0 · 2 · 1/11 | **3**: botão sem nome acessível · `h3` (10 car.) · botão (8 car.) |
| `/library` | 0 · 0 · 0 · 0/51 | **25** (4 sem nó · 21 texto some) · 0 · 2 · 0/30 | 26 · 0 · 3 · 0/36 | **26**: `h3` (10 car.) · "Dashboard" · botão (8 car.) · "Filters" (7 → 0) · "Sort" (4 → 0) · "Add Content" · os 20 cards (texto some: 81 → 66, 48 → 36, …; título de música, só hash) |
| `/setlists` | 0 · 0 · 0 · 0/0 | **4** (4 sem nó) · 0 · 2 · 0/0 | 4 · 0 · 2 · 0/0 | **4**: botão sem nome acessível · `h3` (10 car.) · "Dashboard" · botão (8 car.) |
| `/content/[id]` | 0 · **10** · 0 · 0/0 | **4** (4 sem nó) · 0 · 2 · 0/6 | 4 · 0 · 3 · 0/7 | **4**: `h3` (10 car.) · "Dashboard" · botão (8 car.) · botão sem nome acessível |

Os nomes da última coluna saem do dicionário das frases de UI do projeto (`I1-PRECHECK-anexos/frases-web.txt`,
coluna 3, mesmo hash do medidor — div. 633); o que não casa com frase do projeto fica como papel e comprimento (a
lista inteira, com os hashes, no `cn/g-faixa-cn-main.txt`).

Veredito: **`G-faixa: REPROVA — 46 ocorrência(s)`** (content 14, dashboard 3, library 25, setlists 4) — **o mesmo 46
depois do commit 3** (recalculado sobre os mesmos JSON com a decisão 621: dos nós fora de contêiner que rola, os 8 que
saem na horizontal — `content` em 1138 — já passavam da borda do viewport e já eram (b); todos os outros saem só na
vertical e seguem saída de rolagem; div. 635). O
instrumento mede. O que é cada grupo, lido pela estrutura do nó (o texto só vai como hash nas superfícies com
sessão) e pelo código `[lido]`:

- **"sem nó" em 711 nas quatro com sessão**: a casca. Em retrato ≤ 1024 px a lateral some e entra a barra de baixo,
  com outros rótulos (`components/responsive-layout.tsx:31-43`, `navigation-container.tsx:37-49`) — o mesmo
  `h3` de 10 caracteres e os mesmos botões de 8–9 aparecem nas quatro.
- **"texto some do nó" na library**: os 20 cards perdem **12 caracteres** cada em 711 (n = 48 → 36, 81 → 68, …) —
  o bloco `hidden md:flex` de `components/library/OptimizedLibraryList.tsx:148`; mais o seletor de ordenação.
- **(b) do `/content/[id]` em 1138**: a coluna do texto vai de x = 345 a 1329 e a coluna de detalhes começa em
  x = 1403,5 — passam da borda de 1138; a página não rola na horizontal (`scrollWidth` 1138), então é **corte** (a
  raiz `h-screen overflow-hidden`, `responsive-layout.tsx:78`).
- As **públicas empilham** e não reprovam em 711 (div. 617).

Contabilidade das medições com sessão (o log de requests de cada JSON): escrita a `/api/*` fora de
`/api/auth/session` **0**; requests a `octavia.rocks` **0**; `/api/*` lido: `GET /api/health` (controle),
`GET /api/profile`, `GET /api/content`, `GET /api/setlists`; `POST /api/auth/session` 2–4 por medição (cookie);
fora do localhost: `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`. Nenhum `"rotulo"` (texto em
claro) nos quatro JSON com sessão; nenhum id de content (a rota vai como `/content/[id]`).

## 4. A lista de palavras do G-tok (ii) — aprovada (decisão 622)

`VOCAB` (109): as 46 do `gate:a20` do nativo (`apps/native/scripts/a20.mjs`) mais as da UI de hoje do web —
*sign up, password, forgot, upload, library, dashboard, profile, welcome, create, new, name, artist, content, file,
files, please, your, the, and, with, view, share, account, email address, something went wrong, unexpected,
required, invalid, success, successfully, saved, deleted, created, updated, drag, drop, browse, select, choose,
import, title, description, notes, privacy, policy, terms, get started, learn more, back to, go to, are you sure,
untitled, favorite, favorites, recent, all, filter, sort, lyrics, chords, sheet, verify, resend, check*, e *songs*.
**Tiradas de propósito** por serem também pt-BR: *menu, tempo, for, status, total*. **Isenções** (anglicismos do
produto, as 9 do `a20`): *setlist, setlists, auto-scroll, zoom, email, tab, offline, pdf, online*. **Aprovada pelo Marcel (decisão 622), só em posição de texto**,
como o `a20`: texto JSX (e o literal `{'…'}` que é texto JSX), `placeholder`, `aria-label`, `title`, `alt`. Identificador,
nome de variável e chave de objeto não são texto; `toast(…)` e chave de objeto saíram das posições do commit 1 (div. 634).
Informativo: sobre `login-panel.tsx`, `setlist-manager.tsx` e `app/page.tsx`, o G-tok (ii) acusa 215 [cor] · 116
[espaçamento] · 37 [inglês] · 28 [tamanho de fonte] = 396 (`cn/g-tok.txt`; eram 49 [inglês] e 408 com as posições do
commit 1).

**CN de falso positivo** `[medido]` (`cn/g-tok-falso-positivo.txt`), a fixture `tests/gates-web/fixtures/g-tok-falso-positivo.tsx` na lista:

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos      # newContent e fileUrl são identificadores: NÃO acusa
  arquivos: 1 · literais de identidade acusados: 0 · textos examinados: 1 · vocabulário: 109 · isenções: 9
G-tok: PASSA
$ echo "export const CnTexto = () => <p>New content</p>" >> tests/gates-web/fixtures/g-tok-falso-positivo.tsx
$ node scripts/gates-web/g-tok.mjs --so-arquivos      # "New content" em texto JSX: ACUSA
  ✗ tests/gates-web/fixtures/g-tok-falso-positivo.tsx:9 [inglês, texto JSX] "New content" ← termo "content"
G-tok: REPROVA — 1 ocorrência(s)
```

A fixture e a lista foram restauradas (`cmp` → iguais).

## 5. A hipótese do `storageState({ indexedDB: true })` `[medido em parte]`

Medido sem login (`cn/storage-state.txt`): o `storageState()` sem a opção não leva IndexedDB (0 origens); com
`{ indexedDB: true }` leva o banco com a forma do Firebase Auth (`firebaseLocalStorageDb` / `firebaseLocalStorage` /
keyPath `fbase_key`, 1 registro) e o cookie httpOnly `firebase-session`; um contexto **novo** com esse estado devolve
o registro igual (`true`) e o cookie. O **mecanismo** serve.

**Não medido** (precisa de sessão real): se o SDK do Firebase aceita o usuário restaurado e renova o token; e o
servidor — o `firebase-session` guarda o próprio ID token (`lib/firebase-server-utils.ts:162-164`, 1 h) e o
`requirePageUser` decide na renderização do servidor, então um estado com mais de 1 h pode cair em `/login` antes
de o cliente renovar `[hipótese]`. Até isso ser medido, o **perfil persistente fica** (a I1-D16 dizia
`storageState` da conta de audit; o que se mediu é que funciona para o mecanismo, não para a sessão).

## 6. O extra: `tsconfig.json` exclui `docs/**` (herança da I1-PR3, div. 516) `[medido]`

`tsc -p tsconfig.json --noEmit --listFilesOnly` (mesmo `.next` nos dois lados): **239 → 233** arquivos, os 6 que saem
são os `.ts` de `docs/` (`I1-PR1-anexos/cn/{comum,ramo-b,ramo-c}.ts`, `I1-PRECHECK-anexos/faseB/probe{1,2,4}.ts`);
erros **0 → 0**. `pnpm build`: `✓ Compiled successfully` nos dois, 27 rotas, diff da tabela vazio. Declarado no
```gates-web``` (`gback: tsconfig.json`), fora do núcleo: registro.

## 7. Divergências — 612 a 635

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **612** | P | I1-D21/§9 (c): o núcleo derivado "a partir de" `lib/require-page-user.ts` e `lib/content-service-server.ts` | o alcance de (c) atravessa para o cliente: `content-service-server.ts` importa `lib/setlist-service.ts` e `lib/content-service.ts` (e deles `firebase.ts`, `auth-manager.ts`, `debug.ts`), que a I1-D21 deixa fora | (c) = os dois arquivos, sem o alcance; o que eles alcançam no servidor já está em (a) |
| **613** | T | *"reusa `conferir.mjs` como está"*; o cabeçalho dele: *"Node ≥ 22.18, que lê .ts por type stripping"* | desde a I1-PR-4 o `theme.ts` que ele importa reexporta de `@octavia/identidade` e importa `./fontes` sem extensão: `node conferir.mjs` → `ERR_MODULE_NOT_FOUND …/apps/native/src/fontes` | o G-tok o roda pelo `tsx`, sem mudar o arquivo; saída = `saida.txt` (diff vazio). O cabeçalho não se reescreve (sha no `SHA256SUMS`) |
| **614** | P | *"a proposta de `erratas.json` (§7 ou onde estiver)"* | não há proposta em doc nenhum: `git grep -n erratas.json` → 0; `git log --all -S erratas.json` → 0 | formato criado aqui (regex do achado + `n` exato), a partir da anotação do `saida.txt` — **decisão 614** `[Marcel, 2026-09-27]`: formato aprovado como está |
| **615** | P | CN do G-palco: *"um arquivo com um nome da lista num diretório temporário"* | o G-palco confere o **caminho**, não o nome: o mesmo nome noutra pasta passa | o CN recriou o caminho exato (`app/performance/`, pasta que não existia) |
| **616** | P | *"`userDataDir` fora da árvore, caminho no `.gitignore`"* | o `.gitignore` está fora da lista de arquivos desta PR | a config recusa `G_FAIXA_PERFIL` dentro da árvore. **Decisão 616** `[Marcel, 2026-09-27]`: o `.gitignore` ganha a linha do perfil — extra declarado no commit 3 (div. 632) |
| **617** | A | *"a medição da `main` em 711 nas superfícies vivas tem de reprovar"* | `/login`, `/` e `/privacy-policy` empilham: (e)=0, (b)=0 em 711. A reprovação vem das quatro com sessão | registrado na linha de base (§3); o CN sintético da coleta prova que a coleta vê corte |
| **618** | P | CN *"em 711"* | o (e) de 711 só existe contra a 1138 da mesma rodada | o CN mede as três larguras |
| **619** | D | I1-D11: *"a faixa A só não quebra"* | o `DESIGN-I1/README.md` §4: *"o que o G-faixa medir em 411 é saída contada à parte"* | **decisão 619** `[Marcel, 2026-09-27]`: 411 contado à parte, sem reprovar; o veredito lista as (e) de 411 com o nome acessível (§3, coluna própria; div. 633) |
| **620** | P | div. 504: *"a PR-5 decide se o `gates-web` passa a ler pares"* | — | `grotas:`/`gpalco:` aceitos como **registro** (sem gate); `gback:` de arquivo que mudou fora do núcleo informa; o congelado entra no próprio núcleo (mudar o escopo se declara) |
| **621** | P | I1-D13: *"(b) cortado pela borda do viewport ou do contêiner"* | — | o (b) conta também *conteúdo cortado no próprio nó* (elidir, I1-D7 item 3) e *página com rolagem horizontal*; gaveta fora da tela por `translate` conta como borda do viewport. **Decisão 621** `[Marcel, 2026-09-27]`: confirmado; e fora na horizontal de contêiner que rola é (b), salvo `data-rolagem="painel"`, que é (d′); teste com os dois casos |
| **622** | P | G-tok (ii): *"`#rrggbb`, `rgb(`, `hsl(`, `font-size:` com número, `text-[` com número"* | nos arquivos do web o literal mora em classe Tailwind (`bg-amber-500`, `text-sm`, `p-4`) e em prop camelCase | acrescentados; **decisão 622** `[Marcel, 2026-09-27]`: lista de 109 aprovada, só em posição de texto; CN de falso positivo (§4; div. 634) |
| **623** | T | — | o `fim` do controle positivo sai `falhou net::ERR_ABORTED` com status `200`: o corpo não é lido e a página recarrega — o mecanismo da div. 522 | registrado; o status vem do `response` |
| **624** | P | superfícies do CN: `/login`, `/dashboard`, `/library`, `/setlists`, `/content/[id]` | `/` e `/privacy-policy` são superfícies do I1 (I1-D19) e não pedem sessão | entram no instrumento e na linha de base |
| **625** | T | — | o 1º "antes" do `tsc` saiu com o `.next/types` do `next dev` (arquivos a mais no diff) | refeito com o mesmo `.next` do build nos dois lados (§6) |
| **626** | P | commit 1: *"o `gates-nativos` verde com os dois blocos"* | só existe com a PR aberta | colado no commit 2 (`cn/ci-commit1.txt`) |
| **627** | D | `DESIGN-I1/README.md` §8: *"`SHA256SUMS` tem o sha256 de todo arquivo desta pasta"* | o `erratas.json` é arquivo novo da pasta, fora do `SHA256SUMS` | fica fora, como o `medidas.json` do DESIGN-N3; o job `g-tok` roda o `shasum -c`. **Decisão 614**: o `DESIGN-I1/README.md` §8 ganha *"exceto `erratas.json`, que lê a folha e não é a folha"* e o `SHA256SUMS` é regenerado — só a linha do README muda; `shasum -c` 14/14 OK (docs do congelamento, declarado no corpo) |
| **628** | T | `COMO-RODAR.md`: um comando | 1ª rodada do Marcel: `page.goto: net::ERR_CONNECTION_REFUSED` (nenhum servidor na porta 3000 — `lsof` vazio); 2ª: rodada no checkout principal (`…/octavia/playwright.g-faixa.config.ts does not exist`). Nada medido, nenhuma credencial digitada | a preparação testa `GET /api/health` antes do navegador e diz *"nada responde … suba o servidor"*; o `COMO-RODAR` pede dois terminais e o `cd` |
| **629** | A | o `content` resolvido pelo 1º `<a href="/content/…">` da biblioteca | os cards abrem por `onClick`/`router.push` (`components/library-page-client.tsx:51`), sem `<a href>`, e têm Apagar/Editar dentro; a 1ª rodada gravou o `content` como *"a rota não resolveu"* e o resumo não o mostrou | o id vem da resposta do `GET /api/content` da `/library` (só o id, em memória); estado não medido aparece no resumo; 2ª rodada do Marcel só do `content` |
| **630** | T | a chave do nó = papel + hash do texto | um controle que só perde parte do texto (o `hidden md:flex` dos cards) mudava de chave e virava *"sem nó"*: os 20 cards da library, que existem em 711 | par estrutural (papel+tag, mesma ordem) → *"texto some do nó"*; a contagem da linha de base não muda (33 antes do `content`); caso no teste do classificador |
| **631** | T | *"G-palco — já existe, só entra no workflow"* | no Linux do CI: `mktemp: too few X's in template ‘g-palco’`, exit 1 — o script da I1-PR3 só tinha rodado no macOS (o `mktemp -t` do BSD aceita) | `mktemp "${TMPDIR:-/tmp}/g-palco.XXXXXX"` (uma linha). **Provado**: `g-palco` success no Linux nas duas corridas do commit 2 ([36349670859](https://github.com/marcelviana/octavia/actions/runs/36349670859/job/108705761862), `cn/ci-commit2.txt`) |

**Commit 3 — divergências 632 a 635** (numeração conferida pela coluna: `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | sort -t'*' -k3 -n | tail -1` → 631)

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **632** | P | decisão 616: *"a linha do perfil padrão do G-faixa (o caminho que `G_FAIXA_PERFIL` assume quando não é dado)"* | não há padrão: sem a variável, as superfícies com sessão são **puladas** (é assim que o executor mede as públicas sem login). O caminho documentado é `$HOME/.octavia-g-faixa-perfil`, fora da árvore — e a config recusa um dentro dela | a linha entra com o **nome** documentado, `.octavia-g-faixa-perfil/` (sem âncora: vale em qualquer pasta da árvore; `git check-ignore -v` → `.gitignore:86`). Nenhum padrão novo foi criado: com um, uma rodada sem a variável tentaria a sessão |
| **633** | A | decisão 619: *"a lista das (e) em 411 com o nome acessível de cada controle"* | nas superfícies com sessão o JSON só guarda **hash** do texto (regra do texto de música): o nome acessível em claro não está lá | o veredito resolve o nome pelo dicionário das frases de UI do projeto (`frases-web.txt`, 750 ocorrências, mesmo sha256 do medidor): saem "Dashboard", "Filters", "Sort", "Add Content"; o `h3` de 10 e o botão de 8 caracteres da casca não são frase extraída pelo pre-check e ficam como papel e comprimento; os cards (título de música) ficam só em hash, como devem. Um botão **sem nome acessível** (0 caracteres, sem `aria-label`) da casca aparece em `/dashboard`, `/setlists` e `/content/[id]` — achado da casca velha |
| **634** | P | decisão 622: *"só em posição de texto (JSX, `placeholder`, `aria-label`, `title`, `alt`), como o `a20`"* | o `a20` lê também `Alert.alert(…)` e chaves de objeto (`titulo\|apoio\|texto\|rotulo\|motivo`); as posições do commit 1 liam `toast(…)`, chaves, `label` e `aria-description` | aplicada a lista da decisão, literalmente; `toast`/chaves fora. No web velho o informativo cai de 49 para 37 [inglês] (408 → 396). Se o Marcel quiser `toast(…)` de volta, é uma linha |
| **635** | P | commit 3: *"registre se a contagem de 46 mudou e por quê"* | **não mudou**: nos sete JSON, os nós fora de contêiner que rola são 8 na horizontal (`content`, 1138) — todos já eram (b) "borda do viewport", que o classificador testa antes — e o resto só na vertical (dashboard 1/6/11, library 51/30/36, content 6/7 em 1138/711/411), que segue saída de rolagem | registrado; os JSON da linha de base **não** têm o campo `painel` (medidos antes da decisão): ausente = sem a marca |

## 8. Contabilidade

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview | **0** |
| executor | logins | **0** |
| executor | `.env*` abertos | **0** (a existência do `.env.local` do Marcel na árvore conferida com `ls`, sem abrir) |
| executor | escritas | **0** |
| executor | `next dev` local **sem** `.env` | 1× (as públicas, o `storageState`), parado ao fim; `pnpm build` 2× |
| executor | download | Chromium do Playwright, 81,9 MiB (`playwright install chromium`) |
| Marcel | rodadas contra `localhost:3000` | 4: duas sem medir (div. 628), a das quatro com sessão (19:55Z), a do `content` (20:47Z). **Nenhuma no commit 3**: o veredito foi recalculado sobre os JSON commitados |
| Marcel | logins | **1** (pela janela do perfil persistente; o script não leu nem digitou credencial) |
| Marcel | escritas | **0** (nenhum `POST/PUT/PATCH/DELETE` a `/api/*` fora de `/api/auth/session` nos logs) |
| Marcel | requests a `octavia.rocks` | **0** (abortados no navegador e contados: 0) |
| executor (commit 3) | requests, logins, `.env*`, escritas | **0** — nenhum servidor, nenhum navegador contra o app; só o CI lido (`gh run list`/`view`) |
| — | arquivos fora de `scripts/gates-web/**`, `tests/gates-web/**`, `playwright.g-faixa.config.ts`, `gates-web.yml`, `erratas.json`, `tsconfig.json`, `docs/` | **1** (commit 3): `.gitignore`, extra da decisão 616, fora do núcleo do G-back — listado fora do bloco |
