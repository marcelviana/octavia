# I1-PR-14 — poda: o web velho que sobra, e o `error-boundary` como tela

Bloco **I1 — identidade**; a última PR de código antes do encerramento. Branch `i1/pr14-poda`, árvore
`../octavia-i1-pr14`, sobre `origin/main` **`6f8299f`** (a #348 mergeada: `git cat-file -e
origin/main:docs/ux/I1-PR13-anexos/README.md` → 0). A lista desta PR é o §27 do `docs/ux/I1-PR13-anexos/README.md`.

Convenções: `[medido]` = saída colada em `cn/`; divergências a partir de **893**. Zero prod, zero login, zero senha,
zero `.env*` aberto (a árvore não tem `.env`; o `next dev` da medição subiu sem ele).

---

## 1. Inventário `[medido]`

### 1.1 A poda — "sem importador" por `git grep` (`cn/inventario-importadores.txt`)

| item | importadores (fora dele mesmo, fora `docs/`) | veredito |
|---|---|---|
| **31 `components/ui/*`** (todos menos o `button`) | **0** cada um (32 comandos colados) | morrem |
| `components/ui/button.tsx` | `ui/alert-dialog.tsx:7`, `ui/calendar.tsx:8`, `ui/pagination.tsx:5` (os três morrem) e **`lib/error-boundary.tsx:5`** | morre com o item 2 (o `error-boundary` era o último) — decisão 8 |
| `types/content.ts`: `getContentTypeIcon`, `getContentTypeColors` (div. 839) | 0 · 0 | saem |
| `types/content.ts`: `CONTENT_TYPE_ICONS`, `CONTENT_TYPE_COLORS` | 0 fora do arquivo — só as duas funções os usam | saem com elas (e com eles o `import` de `lucide-react`, linhas 1–7) |
| `types/content.ts`: `CONTENT_TYPE_DISPLAY_NAMES`, `CONTENT_TYPE_IDS`, `ContentTypeId` | 0 · 0 · 0 (o `knip` também os lista) | **a pedir** (decisão 9) |
| `types/content.ts`: `ContentType`, `CONTENT_TYPE_KEYS`, `normalizeContentType` | 22 · 2 · 4 arquivos | **ficam** — o arquivo não esvazia (é o enum canônico, `CLAUDE.md`; div. 897) |
| `contexts/sidebar-context.tsx` | só o próprio teste (`contexts/__tests__/sidebar-context.test.tsx`) | morre com o teste |
| `hooks/use-navigation-actions.ts` | 0 (não tem teste — o §27 dizia "+ os testes deles") | morre |
| os 4 `vi.mock('sonner', …)` | `node_modules/sonner` não existe; `from 'sonner'` em `.ts`/`.tsx`: 0 | saem — e com o do upload saem **cinco asserções que não podem falhar** (div. 901) |
| `lucide-react` fora de `components/ui` | `lib/error-boundary.tsx`, `types/content.ts` | 0 depois dos itens acima |
| `themeColor: "#f59e0b"` | `app/layout.tsx:26` | → `--cor-bg` (item 1.1 do prompt) |
| `p-2` | `components/auth/aviso-de-sessao.tsx:38` | → token |

Achados do inventário (fora do §27, a pedir — decisão 10): **`styles/globals.css`** (duplicata do `app/globals.css`,
do commit inicial `cce69b5`, 0 importador); **`components.json`** (a config do CLI do shadcn, que aponta
`components/ui`; 0 referência); **`knip.json`** `"ignore": ["components/ui/**"]` (fica sem objeto).

### 1.2 Dependências (`cn/dependencias.txt`)

Quantos arquivos importam cada dependência do `package.json` raiz hoje → depois da poda (os `ui/*`, o `sidebar`, o
`use-navigation-actions` e o `error-boundary` de hoje):

| vão a **0** com a poda | hoje |
|---|---|
| os **22 `@radix-ui/*`** — `accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `checkbox`, `collapsible`, `dialog` (2), `dropdown-menu`, `label`, `popover`, `progress`, `scroll-area`, `select`, `separator`, `slider`, `slot` (2), `switch`, `tabs`, `toggle`, `tooltip` (1 cada, salvo indicado) + `context-menu` e **`toast`** (já 0, div. 884) | só `components/ui/*` |
| `class-variance-authority` | 6, todos `ui/*` |
| `react-day-picker` · `react-resizable-panels` | 1 cada (`ui/calendar`, `ui/resizable`) |
| **`lucide-react`** | 12 → 1 (`types/content.ts`) → **0** com a 1.1 |
| `tailwindcss-animate` | 1 — o `plugins` do `tailwind.config.ts`; as classes dele (`animate-in`, `fade-*`, `zoom-*`, `slide-in-*`) só em `ui/*` (§1.3) |

Ficam: `clsx` e `tailwind-merge` (o `cn` de `lib/utils.ts`, importado por `components/content-viewer/SheetMusicDisplay.tsx`
e `components/music-text.tsx`), e o resto. **Já sem importador antes desta PR** (o `knip` da §1.5 as lista, e nenhuma é
do escopo do §27): `cmdk`, `date-fns`, `zustand`, `immer`, `next-themes`, `lru-cache`, `isomorphic-dompurify`,
`react-hook-form`, `@hookform/resolvers`, `@types/debug`, `autoprefixer` — decisão 7.

### 1.3 O tema velho do `tailwind.config.ts` (`cn/tema-velho.txt`)

Cada nome × os arquivos que o usam (`bg-`, `text-`, `border-`, `ring-`… `-<nome>`), hoje e depois da poda:

| nome (linha) | hoje | depois | quem sobra |
|---|---|---|---|
| `border` · `background` · `foreground` (`:90`, `:93`, `:94`) | 5 · 15 · 8 | **1 · 1 · 1** | **`app/globals.css:105-110`** — `* { @apply border-border }` e `body { @apply bg-background text-foreground }` (e o `styles/globals.css` órfão) |
| `input`, `ring`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card` (+ `-foreground`) (`:91`–`:122`) | 1–13 cada | **0** (o `bg-primary` de `lib/__tests__/custom-matchers.ts:189` é `classList.contains('bg-primary')` num teste — não usa o tema) | — |
| `cream`, `beige`, `taupe` (`:124`–`:134`) | **0** | 0 | — |
| `rounded-lg/md/sm` sobre `--radius` (`:138`–`:140`) | 18 | 0 | — |
| `keyframes`/`animation` do acordeão (`:142`–`:155`) | 1 (`ui/accordion`) | 0 | — |
| classes do `tailwindcss-animate` | 7 (`ui/*`) | 0 | — |
| `container` (`:71`–`:77`) | 0 (os 8 casos do grep são a palavra *container* em dois testes) | 0 | — |
| `darkMode: ["class"]` (`:61`) · `dark:` | 1 (`ui/*`) | 0 | — |
| `safelist` (`:159`–`:177`) | as classes só em `types/content.ts` (`CONTENT_TYPE_COLORS`, 28) | **0** com a 1.1 | — |

**Sobra um uso fora da lista do G-tok** (o prompt esperava nenhum): o `app/globals.css` usa `border`, `background` e
`foreground` na camada `base` — a cor-padrão da borda de **todo** elemento e o fundo e a cor do `body`. Tirar muda
pixel em qualquer tela que dependa do padrão (div. 898, decisão 6). No `globals.css`, sem uso depois da poda: as
variáveis `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--input`,
`--ring`, `--chart-*`, `--sidebar-*`, `--radius`, o bloco `.dark`, e as utilidades `.safe-area-pb`, `.sidebar-hidden`,
`.nav-transition`, `.text-balance` (0 uso cada, grep).

### 1.4 O `lib/error-boundary.tsx` hoje `[lido]`

- **Montado** em um lugar: `app/layout.tsx:123-127`, **por fora** do `FirebaseAuthProvider` e do `SessionProvider` — o
  *fallback* não enxerga a sessão (div. 894).
- **Captura**: exceção de render de qualquer descendente (`getDerivedStateFromError`, `:26`); `componentDidCatch`
  (`:30`) registra `logger.error('Error boundary caught an error:', …)`, guarda o `errorInfo`, chama o `onError` do
  chamador e, em produção, `console.error('Production error:', …)`. Aceita `fallback` (vence a tela, `:50`). O layout
  não passa nem `fallback` nem `onError`.
- **Mostra** (`:55-95`): ícone `AlertTriangle` (lucide), *Something went wrong*, o **`error.message` cru** (`:61`) ou
  *An unexpected error occurred*, os detalhes só em `development` (`:65`, *Error Details (Development Only)* + pilha +
  *Component Stack:*), e **dois botões** (div. 893): *Try again* (`:80`, zera o estado — re-renderiza os mesmos filhos)
  e *Reload page* (`:86`, `window.location.reload()`).
- **A tela velha nem recebia as próprias cores**: o `content` do `tailwind.config.ts:62-68` não varre `lib/` — as
  classes `text-red-*`, `bg-red-*`… de `lib/error-boundary.tsx` só existem no CSS se outro arquivo as usar. A captura do
  "antes" (§5.2) sai preta e branca (div. 896).
- **`useErrorHandler`** (`:103`): export sem importador (o `knip` o lista) — decisão 5.

### 1.5 `knip` antes (`cn/knip-antes.md`, `pnpm exec knip --reporter markdown`, exit 1)

Arquivos não usados **26** · dependências não usadas **37** · devDependencies **7** · não listadas **2** · binários **2** ·
exports **132** · tipos exportados **34** · duplicados **11**. **O `knip` não vê os `ui/*`** (`knip.json` os ignora) nem o
`sidebar-context` (o teste dele é entrada) — para eles a prova é o `grep` (div. 908). Do escopo, o `knip` lista:
`hooks/use-navigation-actions.ts` (arquivo), **21** dos 22 `@radix-ui/*` e `react-day-picker`, `react-resizable-panels`
(dependências — o `@radix-ui/react-slot`, o `class-variance-authority` e o `lucide-react` ele vê usados, porque o
`ui/button` é alcançável pelo `lib/error-boundary.tsx`), `useErrorHandler`,
`SidebarProvider`, `getContentTypeIcon`, `getContentTypeColors`, `CONTENT_TYPE_ICONS`, `CONTENT_TYPE_COLORS`,
`CONTENT_TYPE_DISPLAY_NAMES`, `CONTENT_TYPE_IDS`, `ContentTypeId`.

---

## 2. G-tok com o `error-boundary` na lista — na `main`, **REPROVA 34** `[medido]` (`cn/g-tok-main.txt`)

`scripts/gates-web/g-tok-arquivos.txt` + `lib/error-boundary.tsx` (seção I1-PR14). Sobre o código da `main`:
`arquivos: 124 · literais de identidade acusados: 29 · imports de ui: 1 · … G-tok: REPROVA — 34 ocorrência(s)` —
12 de cor, 3 de tamanho de fonte, 8 de espaçamento, 3 de tamanho, 1 de raio, 1 de borda, 1 valor arbitrário
(`min-h-[400px]`), o `import` de `@/components/ui/button` e as **4 frases em inglês** (*Something went wrong*,
*Error Details (Development Only)*, *Try again*, *Reload page*). É o **34** do §27 da PR-13. A folha: 26 achados, 26
cobertos, 0 órfãs.

## 3. A cobertura da lista — o gate novo (`scripts/gates-web/g-tok-cobertura.mjs`) `[medido]`

**Arquivo de tela** (a definição — decisão 1): todo `.ts`/`.tsx` sob `app/` (menos `app/api/`, que é rota — o G-back),
`components/`, `contexts/` e `hooks/`, e todo **`.tsx`** sob `lib/`; menos os testes. Os arquivos vêm do
`git ls-files --cached --others --exclude-standard` (o novo não commitado entra; a rota de fixture ignorada do §5.2,
não — a 1ª versão andava pelo disco e a contou). Lista de exclusão `EXCLUIDOS`: fechada, vazia.

- **Na `main`** (`cn/g-tok-cobertura-main.txt`): `arquivos de tela: 161 · na lista: 121 · FORA: 40 · da lista que não
  são de tela: 3` (`lib/library-utils.ts`, `lib/setlist-service.ts`, `lib/sinal-salvo.ts` — `.ts` de `lib/`, informa).
  Sem o `error-boundary` na lista: 41. Os 40: os **32 `components/ui/*`**, `contexts/sidebar-context.tsx`,
  `hooks/use-navigation-actions.ts` (morrem) e **seis que ficam**: `app/layout.tsx`,
  `components/auth/aviso-de-sessao.tsx`, `components/music-text.tsx` (div. 904),
  `components/providers/session-provider.tsx`, `contexts/firebase-auth-context.tsx`, `hooks/use-debounce.ts`.
- **O G-tok nos seis** (um por vez, `[medido]`): `app/layout.tsx` 1 (o `themeColor`), `aviso-de-sessao.tsx` 1 (o `p-2`),
  os outros quatro **0**. Depois da poda e dos dois consertos, os seis entram e a cobertura dá **0** (decisão 2).
- **CN** (`cn/g-tok-cobertura-cn.txt`): a árvore sintética `tests/gates-web/fixtures/g-tok-cobertura/` (10 arquivos,
  esperado no `README.md` dela) → `arquivos de tela: 7 · na lista: 2 · FORA: 5 · da lista que não são de tela: 1`,
  exit 1 — exatamente o esperado.
- Vira linha do job `g-tok` do `gates-web.yml` no commit 2.

## 4. A div. 828 — o inglês em string de `.ts` `[medido]` (`cn/g-tok-828.txt`)

**A heurística proposta** (no `g-tok.mjs`, desligada até o aval: `G_TOK_828=1` liga) — a forma do `a20` do nativo:

- **(a) chave de texto** — o valor literal de `titulo|apoio|texto|rotulo|motivo` (as cinco da V1-PR6 do a20) e
  `message|title|description|label|placeholder` (as do web velho), em **todo** arquivo da lista;
- **(b) função de mensagem** — o 1º argumento literal de `alert(`, `confirm(`, `prompt(` (o navegador mostra);
- **(c) arquivo de frases** (`frases-*.ts` — o conjunto fechado, o `EXTRAS` do a20): todo valor de chave, **menos
  `valor:`** (o dado gravado, não o rótulo), e todo literal de template;
- **não é texto**: argumento de `new Error(`, `logger`/`console`, comparação (a tela escolhe a frase pela espécie —
  I1-PR12 §21) e a string com **forma de chave** (`up.meta.album`: o `rotulo:` que aponta para o `FRASES`).

**CN com fixture**: `tests/gates-web/fixtures/g-tok-828.ts` e `frases-g-tok-828.ts` — ligada, **6 acusações, as seis
desenhadas** (`message:`, `title:`, `alert(`, `window.confirm(`, *Next page*, `` `${n} songs` ``), nenhum dos sete
negativos (`new Error`, `logger`, `=== "Unknown Artist"`, `up.meta.album`, *Título*, *Setlist*, o `valor:`
*Standard*); desligada, PASSA. 10 strings examinadas.

**Ligada sobre a lista de hoje (124 arquivos, 447 strings examinadas): 10 acusações** (div. 906):

| onde | o quê | leitura |
|---|---|---|
| `hooks/use-content-actions.ts:69,71,79,82,107` | 5 `setError({ message: '…' })` em inglês | verdadeiras pela posição, mas **texto morto**: o `error` do hook nunca é lido (`RefactoredLibrary.tsx:48` usa só as ações) |
| `components/editors/frases-editor.ts:28,40` · `components/content/frases-visualizacao.ts:15` | *Capo*, *capo: {x}* (×2) | frases **aprovadas** (§5.7 da folha; a PR-10 já registrou que *capo* é também pt-BR) |
| `components/editors/frases-editor.ts:68` | *Tags* | frase aprovada (§5.7) |
| `components/editors/frases-editor.ts:112` | *Drop D (DADGBE)* (o rótulo) | nome de afinação, aprovado (§5.7) |

A heurística **acha o que devia** (o CN; os cinco `message:` que nenhum gate lia) e **não acha** o que a PR-12 listou
como não voltado ao usuário (os `Error` do `upload-to-storage`, do `setlist-service`, o `logger`). Os cinco da folha são
o custo: nome de produto/técnica aprovado que o vocabulário (que tem *capo*, *tags*, *drop*, *open* de propósito)
pega. Proposta e alternativas: decisão 3.

## 5. Como a tela de erro se prova — sem sessão, sem `.env`

### 5.1 Teste de tela em jsdom — `tests/gates/i1-erro-global.test.tsx` (`cn/erro-global-teste-main.txt`)

Monta o `ErrorBoundary` com um filho que lança. **Na `main`: 4 reprovam, 4 passam.** Reprovam os quatro da TELA: a
`LinhaDeAviso` com *algo deu errado — tente de novo* e sem as frases/o `error.message` de antes; a marca com nome
acessível *Octavia*; *Tentar de novo* chama `window.location.reload` uma vez; os detalhes em desenvolvimento com
*detalhes do erro (só em desenvolvimento)* e a pilha. Passam os quatro do COMPORTAMENTO, que têm de continuar passando:
sem erro renderiza os filhos; o `logger.error` e o `onError`; o `fallback` do chamador vence a tela; fora de
`development`, sem detalhes.

### 5.2 G-faixa nas três larguras — `G_FAIXA_SUPERFICIES=erro-global` (sem folha, mecânica)

- **A rota é uma FIXTURE que não é do app**: `tests/gates-web/fixtures/erro-global/page.tsx` (o servidor renderiza
  `null`; o cliente lança depois da hidratação e o limite global captura). O executor a copia para
  `app/g-faixa-erro-global/page.tsx` — caminho no **`.gitignore`** (extra) — só durante a medição e a apaga depois.
- A superfície (`scripts/gates-web/g-faixa-superficies.ts`): `erro-global`, sem sessão, pública, **sem `folha`** — o
  veredito mede (e), (b), (d′) e o `scrollWidth`; não há esperado. Dois estados: `ERRO-global` (os detalhes
  fechados) e `ERRO-global-detalhes` (abertos — em `next dev` a tela os traz). A espera casa a frase de depois **e a de
  antes**, para o mesmo estado medir a `main`.
- **O "antes" medido** (`cn/g-faixa-antes.txt`; JSON em `tests/gates-web/medicoes/antes-erro-global/` — subpasta, o
  veredito do CI não desce; capturas `capturas/antes-erro-global-{1138,411}.png`): `next dev` **sem `.env`** em
  `http://localhost:3114` (a 3000 é de outra árvore, não mexida — div. 909); código de `app/`, `components/`, `lib/`
  idêntico à `main` (o `+sujo` é o instrumento).

| estado | 1138 | 711 | 411 |
|---|---|---|---|
| `ERRO-global` | (e) 0 · (b) 0 · `scrollWidth` 1138 | 0 · 0 · 711 | 0 · 0 · 411 |
| `ERRO-global-detalhes` | 0 · 0 · 1138 | **(b) 5** · **792** | **(b) 5** · **642** |

A tela velha **reprova** com os detalhes abertos em B e A: a pilha num `<pre>` sem quebra empurra a página (rolagem
horizontal) e os quatro nós visíveis tocam a borda. O instrumento discrimina (div. 907). No commit 2 a tela nova tem de
dar 0/0 e `scrollWidth` = viewport nos dois estados e nas três larguras.

---

## 6. Decisões a pedir (não decididas)

1. **A definição de "arquivo de tela"** do gate de cobertura (§3): `app/` (menos `api/`), `components/`, `contexts/`,
   `hooks/` inteiros, e `.tsx` de `lib/`, sem testes. Alternativa: só o que renderiza (tem JSX) — mais estreita, mas
   os hooks de dados das telas (`use-library-data`, `use-setlist-data`…) já estão na lista e o `.ts` de `contexts/` e
   `hooks/` carrega frases (a 828).
2. **Os seis que ficam fora** entram na lista (G-tok 0 em quatro; `layout.tsx` e `aviso-de-sessao.tsx` depois dos dois
   consertos) — **recomendo**; ou algum vai para `EXCLUIDOS` com a razão.
3. **A 828**: (a) **ligar (a)+(b)+(c)** e traduzir os cinco `message:` de `use-content-actions.ts` (texto morto, mas
   pela posição é de tela; pt-BR, mesmas chaves, zero comportamento), com os cinco da folha numa **lista fechada de
   frases isentas** (`arquivo · frase`, a forma da `g-tok-sem-ingles.txt`, só que por frase) — **recomendo**; (b)
   ligar só (a)+(b) (a posição (c) fica de fora; os cinco da folha não acusam) — mais estreita, e o `frases-*.ts` volta a
   não ser lido fora das chaves de texto; (c) herança, não liga. Nos cinco `message:`, a alternativa a traduzir é tirar
   o estado `error` do hook, que ninguém lê — mudança de código de hook sem efeito na tela.
4. **Onde mora a tela nova** (div. 896): (a) a tela em `components/identidade/tela-de-erro.tsx` (entra na lista; o
   `content` do Tailwind a vê) e o `lib/error-boundary.tsx` só com a classe (continua na lista) — **recomendo**; (b) a
   tela no `lib/` e `./lib/**/*.{ts,tsx}` no `content` do `tailwind.config.ts`.
5. **`useErrorHandler`** (export sem importador): sai com a poda — recomendo; ou fica.
6. **O `tailwind.config.ts`**: sai tudo o que a §1.3 dá 0 — as nove cores do shadcn além das três, `cream`/`beige`/
   `taupe`, o `borderRadius` sobre `--radius`, `keyframes`/`animation`, `container`, `darkMode`, `safelist`, o plugin
   `tailwindcss-animate` (e a dependência) — e **ficam `border`, `background`, `foreground`**, listados como usados pelo
   `app/globals.css` (a camada `base`). No `globals.css` saem as variáveis e utilidades sem uso (§1.3); a camada `base`
   fica. Alternativa: trocar a camada `base` por tokens (`--cor-line`, `--cor-bg`, `--cor-text`) e tirar as três — muda
   pixel (a borda-padrão, o fundo do `body` que aparece abaixo de tela curta) e o CN de inércia acusaria; seria escopo
   novo.
7. **Dependências**: (a) sai o que **esta poda** leva a 0 — os 22 `@radix-ui/*`, `class-variance-authority`,
   `react-day-picker`, `react-resizable-panels`, `lucide-react`, `tailwindcss-animate` (27) — **recomendo**; (b) (a) mais
   as 11 que já estavam sem importador (§1.2). O lockfile, extra declarado nos dois casos.
8. **O `components/ui/button.tsx`** morre (0 importador depois do item 2) — confirmar.
9. **`types/content.ts`**: além das duas funções e dos dois mapas (que levam o `lucide-react`), sair
   `CONTENT_TYPE_DISPLAY_NAMES` (os nomes em inglês), `CONTENT_TYPE_IDS` e `ContentTypeId` (0 importador) — recomendo;
   ou só o que a div. 839 cita. O arquivo é do **núcleo do G-back** (`g-back-nucleo.txt:41`; o importa
   `app/api/content/route.ts`) → `gback: types/content.ts — …` no corpo, nos dois casos.
10. **Os órfãos achados**: `styles/globals.css`, `components.json`, a linha `ignore` do `knip.json` — saem? Recomendo sim.
11. **A ação única** (div. 893): hoje são dois botões. (a) *Tentar de novo* = **recarregar** (o prompt; o *Try again*
    que re-renderiza sai — no limite GLOBAL ele remonta a mesma árvore, que tende a lançar de novo) — recomendo; (b)
    = re-renderizar (como o `LimiteDoCorpo` da PR-10, que ficou com o *Try again*); (c) as duas (uma segunda ação fora da
    `LinhaDeAviso`, sem desenho).
12. **A casca** (div. 894): o limite está fora dos provedores de sessão — a casca com sessão não se monta ali sem ler a
    sessão por fora (e, se a exceção veio de um provedor, remontá-lo relançaria). Recomendo **sempre a marca, como no
    auth**, com ou sem sessão.
13. **A composição** (sem folha): a `CascaAuth` (a marca, a coluna `web.colunaAuth`, o rótulo em `font.display`) com
    um **rótulo novo** — proponho *Erro* (frase nova) — e, na coluna, a `LinhaDeAviso` tipo falha com `motivo.generico`
    e *Tentar de novo*, e abaixo os detalhes (só em `development`) com *detalhes do erro (só em desenvolvimento)* e
    *pilha de componentes:* (frases novas). Alternativa: sem rótulo (a `CascaAuth` o exige — mudaria o componente do
    auth).
14. **`app/layout.tsx`**, fora do `themeColor` (div. 905): `<html lang="en">` → `pt-BR`? E o `metadata` (a aba do
    navegador diz *Octavia - Digital Music Management*; a descrição, *Organize, visualize, and share your musical
    content*) → pt-BR? Texto voltado ao usuário em toda rota, que nenhum gate lia (a 828 (a) pega a descrição). Se sim,
    as frases novas vão para o aval; se não, herança.
15. **Os testes do upload** (div. 901): tirar o `vi.mock('sonner')` do `upload-estados.test.tsx` leva as cinco
    `expect(toast.*).not.toHaveBeenCalled()` — a prova de "nenhum toast" passa a ser só a estrutural (o G-tok `TOAST`
    nos arquivos do upload). Recomendo tirar.

### 6.1 O aval — decisões `[Marcel, 2026-09-30]`

1. **Arquivo de tela** = `app/` (sem `api/`), `components/`, `contexts/`, `hooks/` inteiros, mais o `.tsx` de `lib/`,
   sem testes.
2. **Os seis fora da lista entram nela.**
3. **Div. 828 ligada** nas três posições — `G_TOK_828` deixa de existir, é regra; lista fechada de isenção **por
   frase** (*Capo*, *Tags*, *Drop D*, razão "igual nas duas línguas / nome próprio"); os 5 `message:` mortos de
   `use-content-actions.ts` **saem** (texto sem leitor é poda, não tradução).
4. A tela vai para **`components/identidade/tela-de-erro.tsx`**; `lib/error-boundary.tsx` fica com a classe.
5. **`useErrorHandler` sai.**
6. **Tailwind**: sai tudo o que dá 0. **A camada `base` do `globals.css` migra para os tokens** (`border` →
   `--cor-line`, `background` → `--cor-bg`, `foreground` → `--cor-text`); variáveis e utilidades mortas saem. **Prova
   por imagem**: as três públicas (sem `.env`) e o `dashboard` (com sessão), antes × depois, nas três larguras, diff
   de pixel — esperado 0; onde não for, **parar antes do commit** e listar o que a base velha pintava.
7. **As 27 dependências saem** (lockfile, extra); as 11 já órfãs → herança do encerramento, listadas.
8. **`ui/button` morre**; `components/ui/` fica vazia e sai.
9. **`types/content.ts`**: os 7 símbolos saem; `gback:` declarado (núcleo).
10. **`styles/globals.css`, `components.json` e a linha `ignore` do `knip.json` saem.**
11. ***Tentar de novo* = recarregar**; o *Try again* que re-renderiza sai — mudança de comportamento declarada (um
    botão a menos).
12. **Sempre a marca, como no auth**, com ou sem sessão.
13. **Composição**: `CascaAuth` com rótulo *Erro*, a `LinhaDeAviso` (`motivo.generico`, *Tentar de novo*), os detalhes
    de dev em pt-BR (*detalhes do erro (só em desenvolvimento)*, *pilha de componentes:*) só em desenvolvimento.
14. **`layout.tsx`**: `lang="pt-BR"`; `metadata` em pt-BR (*Octavia* e a `landing.frase` como descrição). Declarado.
15. **O `vi.mock('sonner')` do upload e as cinco `expect(toast…)` saem.**

Divs. 893, 894 e 896: aceitas como o commit 1 as leu.

## 7. Divergências — 893 a 909

| div. | origem | premissa | medido | destino |
|---|---|---|---|---|
| **893** | P | *"a ação* Tentar de novo *fazendo o que o botão de hoje faz (recarregar)"* | são **dois** botões: *Try again* (`lib/error-boundary.tsx:80`, re-renderiza) e *Reload page* (`:86`, recarrega) | decisão 11 |
| **894** | P | *"a casca (se a sessão existir)"* | o limite está **por fora** do `FirebaseAuthProvider`/`SessionProvider` (`app/layout.tsx:123-127`) | decisão 12 |
| **895** | P | *"`motivo.generico`"* | hoje a tela mostra o `error.message` cru (`:61`); a nova não o mostra (fica na pilha dos detalhes de dev) | declarado; teste §5.1 |
| **896** | A | a tela nova em `lib/` pelos tokens | o `content` do Tailwind (`tailwind.config.ts:62-68`) **não varre `lib/`**: a tela velha saía sem as próprias cores | decisão 4 |
| **897** | P | *"`types/content.ts` … se o arquivo ficar vazio, sai"* | não esvazia: é o enum canônico (22 importadores); 5 símbolos a mais sem importador; e é **núcleo do G-back** | decisão 9; `gback:` |
| **898** | P | *"o que for usado por um arquivo fora da lista … não deve sobrar nenhum"* | sobra: `app/globals.css:105-110` usa `border`, `background`, `foreground` | decisão 6 |
| **899** | A | — | `styles/globals.css` (duplicata órfã), `components.json`, `knip.json` `ignore` | decisão 10 |
| **900** | A | *"`@radix-ui/*` … `lucide-react`"* | também vão a 0: `class-variance-authority`, `react-day-picker`, `react-resizable-panels`, `tailwindcss-animate`; 11 já estavam a 0 | decisão 7 |
| **901** | A | *"se os testes passam por acaso, registre por quê"* | passam porque o `vi.mock` com fábrica registra o id e ninguém importa `sonner` — o módulo nunca se resolve; e o do upload segura 5 asserções que não podem falhar | decisão 15 |
| **902** | P | as fontes: *"§15 divs. 828, 839"* do `I1-PRECHECK.md`; *"§12/§14 (a regra `nl`)"* do README da PR-13 | as duas divs. estão no `docs/ux/I1-PR12-anexos/README.md` (§11, §21); a regra `nl` no §25 do README da PR-13 | registrado |
| **903** | A | §27 da PR-13: *"199 … 76 … 32 e 44"* | **198 · 75 · 32 e 43** — em `8baa1f2` também (o conjunto de arquivos é o mesmo): a contagem de lá tinha um a mais | registrado |
| **904** | A | README da PR-11 (`:252`): *"o `pdf-viewer` e o `music-text` já estavam (PR-10)"* | o `components/music-text.tsx` **nunca entrou** na lista (G-tok nele: 0) | entra (decisão 2) |
| **905** | A | — | `app/layout.tsx`: `lang="en"` e o `metadata` em inglês (a aba do navegador) | decisão 14 |
| **906** | A | — | a 828 ligada acusa 10 na lista de hoje: 5 `message:` mortos + 5 frases aprovadas da folha | decisão 3 |
| **907** | A | — | o "antes" da tela de erro: 0/0 fechada; **(b) 5** em 711 e 411 com os detalhes abertos (`scrollWidth` 792, 642) | a tela nova mede contra isso |
| **908** | A | *"`knip` antes/depois (órfãos → 0)"* | o `knip` ignora `components/ui/**` e não vê o `sidebar-context` (o teste é entrada) | a prova deles é o `grep` (§1.1) |
| **909** | A | o servidor da medição | a 3000 tem o `next-server` de outra árvore → **3114**; o `.claude/launch.json` do checkout principal (ignorado pelo git) ganhou a entrada `i1-pr14-dev-sem-env` | registrado |

## 8. Extras do commit 1 (declarados)

- `scripts/gates-web/g-tok-cobertura.mjs` e a árvore `tests/gates-web/fixtures/g-tok-cobertura/` (o CN);
- a 828 no `scripts/gates-web/g-tok.mjs`, **desligada** (`G_TOK_828=1`), e as fixtures `tests/gates-web/fixtures/g-tok-828.ts`,
  `frases-g-tok-828.ts`;
- `tests/gates/i1-erro-global.test.tsx` (vermelho na `main`, por construção);
- a superfície `erro-global` no `scripts/gates-web/g-faixa-superficies.ts`, a fixture
  `tests/gates-web/fixtures/erro-global/page.tsx` e a linha `app/g-faixa-erro-global/` no **`.gitignore`**;
- `tests/gates-web/medicoes/antes-erro-global/erro-global.json` e `capturas/antes-erro-global-{1138,411}.png` (o
  "antes"; sem texto de música — a tela de erro não mostra conteúdo).

## 9. Contabilidade (commit 1)

| | |
|---|---|
| base | `origin/main` `6f8299f` |
| prod · login · senha · `.env*` | 0 · 0 · 0 · 0 (a árvore não tem `.env`; o `next dev` subiu sem ele) |
| escrita pelo navegador | 0 (a barreira do medidor; a superfície não chama `/api/*` além do `health` do controle positivo) |
| servidor | `next dev -p 3114` desta árvore, sem `.env` (a 3000 não foi tocada) |
| gates no commit 1 | G-tok **REPROVA 34** (o `error-boundary`); cobertura **REPROVA 40** (ainda não é linha do workflow); G-palco PASSA; G-back PASSA (nenhum arquivo do núcleo); `tsc` 0; lint limpo; o teste novo 4/8 (vermelho por construção) |

---

## 10. Commit 2 — a poda e a tela de erro `[medido]`

Resumo; o inventário completo (linhas por arquivo, o que sobra) entra no commit 3.

| | antes | depois | onde |
|---|---|---|---|
| G-tok (ii) | REPROVA 34 (124 arquivos) | **PASSA** — 132 arquivos, 0 literal, 0 inglês, 446 strings de `.ts` lidas (828), **5 de 5** frases isentas usadas | `cn/g-tok-commit2.txt` |
| cobertura | FORA 40 | **FORA 0** (129 de tela, 129 na lista) | idem |
| 828 | desligada | **regra** (`G_TOK_828` saiu); CN da isenção órfã reprova; CN das fixtures 6/6 | idem |
| G-back | — | acusa só `types/content.ts`; **PASSA** com o `gback:` (o `layout.tsx` não é núcleo) | `cn/g-back-g-palco-commit2.txt` |
| G-palco | 0 | **0** | idem |
| `pnpm test` | — | **118 suítes · 1179 casos** (3 e 58 pulados); a tela de erro **8/8**; o CN da PR-1 **15/15** | `cn/testes-tsc-lint-commit2.txt` |
| `tsc` · lint | 0 · limpo | **0 · limpo** | idem |
| `pnpm build` | 27 rotas | **27 rotas, `diff` vazio** (só os tamanhos dos pedaços mudam) | `cn/build-rotas.txt` |
| `knip` | 26 arquivos · 37 deps · 132 exports · 34 tipos | **25 · 14 · 124 · 33** — as 14 deps são as 11 herdadas da raiz + 3 do nativo; nenhum órfão novo | `cn/knip-depois.md` |
| prova por imagem | — | **12 capturas × 0 pixel × 0 nó com Δ** (3 públicas sem `.env` + `dashboard` com sessão, × 3 larguras); o ruído antes × antes, também 0 | `cn/prova-por-imagem.txt` |
| G-faixa `erro-global` | (b) 5 em 711 e 411 com os detalhes abertos (`scrollWidth` 792, 642) | **(e) 0 · (b) 0 · `scrollWidth` = viewport** nos dois estados × três larguras; o veredito das 14 medições PASSA | `cn/g-faixa-depois.txt`, `capturas/depois-*` |

**A camada `base` nova não pinta nada visível hoje**: o `body` passou de branco a `#100F16` (medido no CSS servido) e a
borda-padrão de `#e5e5e5` a `--cor-line` — e as 12 capturas não mudaram um pixel: toda tela cobre o `body` com o
próprio fundo e todo contorno desenhado declara a cor. O `content` do Tailwind ganhou `./lib/**/*.tsx` (sobra um `.tsx`
em `lib/`, o limite): o CSS gerado com e sem a linha é o mesmo (25 030 bytes, `diff` vazio).

**Extras declarados**: `pnpm-lock.yaml` (as 27); `themeColor` `#f59e0b` → `dark.bg` (`#100F16`, o `--cor-bg`) — o único
literal que troca de valor; `lang="pt-BR"` e o `metadata` (*Octavia* · `landing.frase`); **um botão a menos** na tela de
erro (o *Try again* que re-renderizava — decisão 11); o estado `error` inteiro do `use-content-actions` (div. 914);
`scripts/gates-web/g-tok-frases-isentas.txt`; a seção da I1-PR14 no `COMO-RODAR.md`; a linha do `gates-web.yml`.

### 10.1 Divergências — 910 a 916

| div. | origem | premissa | medido | destino |
|---|---|---|---|---|
| **910** | A | a sessão do perfil (I1-D37) numa porta livre | o IndexedDB do Firebase é **por origem** (porta): na 3114 o cliente não achou usuário e chamou `DELETE /api/auth/session`, apagando o cookie. O `next dev` da 3000 era o da árvore `../octavia-i1-pr13` (subido pelo executor da PR-13, já mergeada): **parado**; o desta árvore subiu na 3000 e a sessão se refez sozinha (`POST /api/auth/session 200`); depois, parado também (antes do `pnpm build`, que divide a `.next`) — **a 3000 está livre** | registrado como está (aval do commit 2); linha no `COMO-RODAR.md` |
| **911** | A | apagar a fixture basta | o `next dev` gera `.next/types/app/g-faixa-erro-global/` e o `tsc` o acusa depois que a rota sai | o passo no `COMO-RODAR.md` |
| **912** | A | `knip` → 0 órfão novo | o tipo `DetalhesDoErro` exportado sem uso | deixou de ser exportado |
| **913** | A | — | o `<summary>` com `flex` perde o triângulo de abrir no Chromium (só em desenvolvimento) | registrado; herança |
| **914** | A | *"os 5 `message:` mortos saem"* | o estado `error` do hook tinha mais dois (*User not authenticated*, sem termo do vocabulário) e nenhum leitor: saiu o estado inteiro; o que o hook chama, relê e quando para, igual | extra declarado |
| **915** | P | corpo da PR: *"`gtok: … +7`"* | são **+8**: `tela-de-erro.tsx`, `frases-erro.ts` e os seis | o corpo diz +8 |
| **916** | A | — | o `.env.local` copiado de `../octavia-i1-pr13` (`cp -p`, sem abrir) e **afastado** (renomeado, sem abrir) durante as medições sem `.env`; ignorado pelo git | registrado |

---

## 11. O aval do commit 2 `[Marcel, 2026-09-30]`

Aprovado. **Div. 914** (o estado `error` inteiro, sem leitor) aceita como **poda declarada**; **913** herança; **915**
origem P; **910** registrada como está, com uma linha no `COMO-RODAR.md` (*o perfil só tem sessão na origem
`localhost:3000`; outra porta apaga o cookie*).

## 12. O inventário da poda — o que saiu, com a prova `[medido]`

A prova de "sem importador" de cada item é o §1.1 (`cn/inventario-importadores.txt`, sobre a `main`); o que saiu,
linha por linha (`git diff --numstat 747269e 5977f98`):

| grupo | arquivos (linhas removidas) | total |
|---|---|---|
| **`components/ui/`** — a pasta inteira (decisão 8) | `accordion` 58 · `alert-dialog` 141 · `alert` 59 · `aspect-ratio` 7 · `avatar` 50 · `badge` 36 · `breadcrumb` 115 · `button` 56 · `calendar` 66 · `card` 79 · `checkbox` 30 · `collapsible` 11 · `dialog` 122 · `dropdown-menu` 200 · `input` 22 · `label` 26 · `pagination` 117 · `popover` 31 · `progress` 28 · `resizable` 45 · `scroll-area` 48 · `select` 160 · `separator` 31 · `sheet` 140 · `skeleton` 15 · `slider` 28 · `switch` 29 · `table` 117 · `tabs` 55 · `textarea` 22 · `toggle` 45 · `tooltip` 30 | **32 arquivos, −2 019** |
| a casca velha | `contexts/sidebar-context.tsx` 24 · `contexts/__tests__/sidebar-context.test.tsx` 29 · `hooks/use-navigation-actions.ts` 32 | −85 |
| `types/content.ts` (núcleo; `gback:`) | os 7 símbolos e o `import` de `lucide-react` | 142 → 42 (−101; o resto intacto) |
| `lib/error-boundary.tsx` | a tela velha, `ui/button`, `lucide-react`, `useErrorHandler` | 111 → 68 (−56 +12) |
| `hooks/use-content-actions.ts` | o estado `error` sem leitor e as 7 frases dele (div. 914) | −35 +14 |
| o tema velho | `tailwind.config.ts` (−96 +8) · `app/globals.css` (−97 +6) · `styles/globals.css` (−94, órfão) | −287 +14 |
| configs órfãs | `components.json` (−21) · `knip.json` (a linha `ignore`, −3) | −24 |
| testes | os 3 `vi.mock('sonner')` do editor e dos gates (−1 cada); no upload o `vi.mock`, o `vi.hoisted` e as 5 `expect(toast…)` (−7) | −10 |
| dependências | `package.json` −27 · `pnpm-lock.yaml` −1 038 +66 | — |
| **nasceram** | `components/identidade/tela-de-erro.tsx` 43 · `frases-erro.ts` 15 · `scripts/gates-web/g-tok-frases-isentas.txt` 9 | +67 |

Fora de `docs/` e das medições: **58 arquivos, +241 −3 696**.

### 12.1 As 27 dependências que saíram (decisão 7)

Os **22 `@radix-ui/*`** (`accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `checkbox`, `collapsible`,
`context-menu`, `dialog`, `dropdown-menu`, `label`, `popover`, `progress`, `scroll-area`, `select`, `separator`,
`slider`, `slot`, `switch`, `tabs`, `toast`, `toggle`, `tooltip`), `class-variance-authority`, `react-day-picker`,
`react-resizable-panels`, `lucide-react`, `tailwindcss-animate` — cada um só importado por `components/ui/*`, pelo
`lib/error-boundary.tsx` de antes, por `types/content.ts` (os mapas) ou pelo `plugins` do tema velho (§1.2).
`pnpm install --offline`: 27 linhas `-`, nenhuma `+`.

### 12.2 As 11 que ficam — herança do encerramento

Sem importador **desde antes desta PR** (o `knip` da `main` já as listava; fora do §27), com `git grep` fora do
`package.json`/lockfile: nenhuma referência de código nem de config.

| dependência | o que se achou | motivo de ficar |
|---|---|---|
| `isomorphic-dompurify` | 0 | fora do escopo desta PR (não era do §27) |
| `react-hook-form` · `@hookform/resolvers` | 0 (os formulários do web são estado local desde as PRs de tela) | idem |
| `zustand` · `immer` | 0 (o `immer` citado só no `ARCHITECTURE.md`) | idem |
| `date-fns` | 0 | idem |
| `cmdk` | 0 | idem |
| `next-themes` | 0 | idem |
| `lru-cache` | 0 (citado só no `AGENT.md`) | idem |
| `@types/debug` | 0 (nenhum `import 'debug'`) | idem |
| `autoprefixer` | 0 (o `postcss.config.mjs` só tem `tailwindcss`) | idem |

## 13. A tela de erro — antes e depois `[medido]`

| | antes (`main`) | depois (commit 2) |
|---|---|---|
| composição | ícone `AlertTriangle`, *Something went wrong*, o `error.message` cru, *Try again* + *Reload page*, os detalhes em inglês; sem as próprias cores (div. 896) | `CascaAuth` com *Erro*, a `LinhaDeAviso` de falha (*algo deu errado — tente de novo*, *Tentar de novo* = recarregar), os detalhes de dev em pt-BR |
| teste (`tests/gates/i1-erro-global.test.tsx`) | 4/8 (reprovam os quatro da tela) | **8/8** |
| G-faixa, detalhes fechados | (e) 0 · (b) 0 · `scrollWidth` = viewport nas três | **idem** |
| G-faixa, detalhes abertos | **(b) 5** em 711 e 411; `scrollWidth` 792 / 642 | **(e) 0 · (b) 0 · `scrollWidth` = viewport** nas três |
| capturas | `capturas/antes-erro-global-{1138,411}.png` | `capturas/depois-erro-global-{1138,411}.png`, `depois-erro-global-detalhes-411.png` (a viewport: a pilha quebra linha) |

A medição do depois é `tests/gates-web/medicoes/erro-global.json` — **entra no veredito do CI** (as 14 medições:
PASSA); a do antes fica em `medicoes/antes-erro-global/` (subpasta, fora do veredito). Sem folha: registrada como
"sem folha, mecânica" — só (e), (b), (d′) e `scrollWidth`.

## 14. A prova por imagem (decisão 6) `[medido]` (`cn/prova-por-imagem.txt`)

Full page, Chromium do Playwright, `pixelmatch` com `threshold 0`, o indicador do `next dev` removido; mais a geometria
de todo elemento visível do `<body>`. **Controle**: antes × antes (a `main`, duas vezes) = **0** nas 12. **Antes ×
depois = 0 pixel e 0 nó com Δ nas 12** (landing, login, privacy-policy sem `.env`; `dashboard` com sessão; × 1138 · 711
· 411). O CSS servido no depois tinha a base nova (`body` `rgb(16, 15, 22)`, borda-padrão `rgb(42, 40, 54)`) — o 0 mede
a mudança, não a ausência dela. As capturas do `dashboard` não são anexadas (mostram a biblioteca da conta).

> **Nota da I1-PR-15** (aval 6 do commit 1): o script desta prova não foi commitado aqui; o método foi refeito a partir
> deste parágrafo e está em [`../I1-PR15-anexos/cn/capturar.mjs`](../I1-PR15-anexos/cn/capturar.mjs) e
> [`../I1-PR15-anexos/cn/diff.mjs`](../I1-PR15-anexos/cn/diff.mjs).

## 15. O gate de cobertura, a 828 e o Tailwind

- **Cobertura** (`scripts/gates-web/g-tok-cobertura.mjs`, job `g-tok`): na `main` FORA 40; no commit 2 **FORA 0**
  (129 arquivos de tela, 129 na lista). CN: a árvore sintética, FORA 5 exato (`cn/g-tok-cobertura-cn.txt`).
- **828, regra**: as três posições (§4); a lista de isenção **por frase** `scripts/gates-web/g-tok-frases-isentas.txt` —
  *Capo*, *capo: {x}* (editor e visualização), *Tags*, *Drop D (DADGBE)*, com a razão (igual nas duas línguas / nome
  próprio; README-design §5.6/§5.7) — **5 de 5 usadas**; a isenção órfã reprova (CN em `cn/g-tok-commit2.txt`: uma
  entrada inventada → `ISENÇÃO ÓRFÃ`, exit 1); as fixtures do commit 1, 6/6.
- **O `content` do Tailwind** ganhou `./lib/**/*.tsx` (div. 896: sobra um `.tsx` em `lib/`, o limite, hoje sem classe).
  O CSS gerado pelo `tailwindcss` CLI com e sem a linha: **25 030 bytes, `diff` vazio**.

## 16. `knip` antes × depois (`cn/knip-antes.md`, `cn/knip-depois.md`)

| | antes | depois |
|---|---|---|
| arquivos não usados | 26 | **25** (−`hooks/use-navigation-actions.ts`) |
| dependências não usadas | 37 | **14** (−21 `@radix-ui/*`, −`react-day-picker`, −`react-resizable-panels`; ficam as 11 do §12.2 e 3 do nativo) |
| exports não usados | 132 | **124** (−`useErrorHandler`, −`SidebarProvider`, −os 6 de `types/content.ts`) |
| tipos exportados não usados | 34 | **33** (−`ContentTypeId`) |

**Nenhum nome novo** no depois (o `diff` dos nomes só tem remoções). O `knip` não via os `ui/*` nem o `sidebar-context`
(div. 908) — a prova deles é o `grep`, e agora a pasta não existe.

## 17. O que ainda sobra — a 1ª seção do `I1-ENCERRAMENTO.md` `[medido]`

**Nenhum arquivo de tela fora do G-tok**: a cobertura dá FORA 0, e todo arquivo da lista passa em literal, toast,
import de `ui/*` e inglês (JSX e strings de `.ts`, com 5 frases isentas uma a uma). O resto:

| o que sobra | onde | destino |
|---|---|---|
| **as 11 dependências órfãs** | `package.json` (§12.2) | encerramento do I1 — poda à parte, com o lockfile |
| **o triângulo do `<summary>`** (div. 913) | `components/identidade/tela-de-erro.tsx` — o `flex` do `summary` apaga o marcador no Chromium; só em desenvolvimento | herança (o próximo bloco do web) |
| **inglês fora de posição de texto** | as mensagens de `Error` e os `logger`/`console` de `lib/setlist-service.ts`, `lib/content-service.ts`, `components/add-content/upload-to-storage.ts`, `hooks/useMetadataForm.ts`, `contexts/firebase-auth-context.tsx` — não chegam à tela (a tela escolhe a frase pela espécie; a 828 não as lê, de propósito) | fica; não é texto de UI |
| **o valor gravado *Unknown Artist*** | `hooks/useAddContentLogic.ts:133,182,207` e o sentinela *Unknown Artist/Title/Type* das rotas (`app/api/setlists/…`), traduzido na exibição | **Bloco D** (herança da PR-12 e da PR-13) |
| **os specs do `ux-audit`** | `tests/ux-audit/fase-d/*` — rótulos em inglês | quando o gate voltar a ser usado (herança da PR-12) |
| **`body { font-family: Arial }`** | `app/globals.css:6` — fora da camada `base`; toda tela declara a própria família, e a prova por imagem não o viu | encerramento: decidir se sai (é o último valor literal do tema velho) |
| **`generator: "v0.dev"`** | `app/layout.tsx:19` — `<meta name="generator">`, não visível | encerramento |
| **o `bg-primary`/`bg-blue-500` de um teste** | `lib/__tests__/custom-matchers.ts:189-190` — `classList.contains(…)` de um matcher de teste (usado por `src/test-setup.ts`); não usa o tema | encerramento (limpeza de teste) |
| **documentação que descreve o web velho** | `CLAUDE.md:111` (*Radix UI components (shadcn/ui)*) e a árvore `components/ui`; `README.md:88,104,255-256` (shadcn, Lucide); `ARCHITECTURE.md:104-227` (`ErrorBoundary` com `DomainErrorBoundary`, `useErrorHandler`) | encerramento do I1 (as notas do `CLAUDE.md` como nas PRs anteriores) |
| **o `.env.local`** desta árvore | copiado de `../octavia-i1-pr13` sem abrir (div. 916); ignorado pelo git | sai com a árvore |

## 18. Divergências — 917 em diante

Nenhuma nova no commit 3.

## 19. Contabilidade final da I1-PR-14

| | |
|---|---|
| commits | `747269e` (gate-first + o aval no §6.1) · `5977f98` (a poda e a tela) · o commit 3 (só docs) |
| base | `origin/main` `6f8299f` |
| prod · login · senha · `.env*` aberto | 0 · 0 · 0 · 0 (o `.env.local` copiado com `cp -p` e renomeado, nunca aberto) |
| escrita pelo navegador | 0 (a barreira das capturas aborta toda escrita a `/api/*` salvo o cookie de sessão) |
| servidores | `next dev` desta árvore na 3114 (sem `.env`) e na 3000 (com sessão); o `next dev` da árvore da PR-13 na 3000 **parado** (div. 910); ao fim, os dois desta árvore parados — **a 3000 está livre** |
| cota de `/api/profile` | ~6 cargas do `dashboard` com sessão (antes, antes2, depois × 3) + 1 inspeção |
| divergências | 893–916 (17 no commit 1, 7 no commit 2); próxima **917** |
| gates no fim | G-tok PASSA (132; cobertura FORA 0; 828 regra); G-back PASSA com `gback: types/content.ts`; G-palco 0; G-faixa PASSA (14 medições); `pnpm test` 118 · 1179; `tsc` 0; lint limpo; `pnpm build` rotas idênticas |
