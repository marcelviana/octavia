# I1-PR-15 — poda final: dependências órfãs, literais do tema velho, rastro comprimido

PR [#352](https://github.com/marcelviana/octavia/pull/352), branch `i1/pr15-poda-final`, de `origin/main` `baeebf7`
(a #351, I1-PR-2, mergeada — pré-condição conferida com `git cat-file -e origin/main:docs/ux/I1-PR2-anexos/README.md`).
A última PR de código do I1 antes do fecho do `I1-ENCERRAMENTO.md` (#350): as decisões 2 (o rastro em `.gz`) e 3 (a
poda agora) do aval do encerramento. **Zero mudança de comportamento e zero mudança de tela**; `packages/identidade`
não muda.

| commit | o quê |
|---|---|
| `42891d9` | gate-first: o leitor dos dois formatos (`scripts/gates-web/ler-medicao.mjs`), o veredito e o `casca-efeito-corpo.mjs` por ele; as medições (sem apagar nada) |
| `fd6ca71` | a poda: as 11 dependências, o `Arial`, o `generator`, o matcher, o rastro em `.gz`, os 5 scripts de anexo |
| este | docs: este README, `cn/capturar.mjs` e `cn/diff.mjs`, a nota no §14 da I1-PR-14 |

## 1. Decisões — o aval do commit 1 `[Marcel, 2026-09-30]`

| # | pergunta | decisão |
|---|---|---|
| 1 | o `autoprefixer` (o `postcss.config.mjs` só lê `tailwindcss`) | sai com as outras 10 |
| 2 | o matcher `toBeVisuallySelected` (0 usos) | sai inteiro |
| 3 | "o que mais o §3 do encerramento listou como poda à parte" | nada mais entra: os specs do `ux-audit`, os ícones sem leitor, o triângulo do `<summary>` e a memoização seguem como herança do bloco seguinte ao I1 (`I1-ENCERRAMENTO.md` §10.5) |
| 4 | os 5 scripts de anexo que também leem o rastro (div. 945) | passam a ler por `lerJson` |
| 5 | o token `--fonte-ui-familia` é só `'Manrope'`, sem reserva | a reserva vai na regra: `body { font-family: var(--fonte-ui-familia), sans-serif; }`; token intocado |
| 6 | commitar os scripts da prova por imagem | sim, `cn/capturar.mjs` e `cn/diff.mjs`, com uma linha no README da I1-PR-14 apontando para eles |
| — | divs. 944–946 | origem P, aceitas |

## 2. As 11 dependências `[medido]` (`cn/dependencias-11.txt`, `cn/dependencias-lockfile.txt`)

`git grep` de importador (`from`/`import`/`require`) e de qualquer menção fora de `docs/`, `*.md`, `package.json`,
`pnpm-lock.yaml` e das medições, sobre `baeebf7`:

| dependência | importador | menção | versão no lockfile |
|---|---|---|---|
| `isomorphic-dompurify` | 0 | 0 | 2.26.0 |
| `react-hook-form` | 0 | 0 | 7.62.0 |
| `@hookform/resolvers` | 0 | 0 | 3.10.0 |
| `zustand` | 0 | 0 | 5.0.8 |
| `immer` | 0 | 0 | 10.1.3 |
| `date-fns` | 0 | 0 | 4.1.0 |
| `cmdk` | 0 | 0 | 1.0.4 |
| `next-themes` | 0 | 0 | 0.4.6 |
| `lru-cache` | 0 | 0 | 11.2.1 |
| `@types/debug` | 0 | 0 | 4.1.12 |
| `autoprefixer` | 0 | 0 | 10.4.21 |

O `postcss.config.mjs` tem `plugins: { tailwindcss: {} }` — nada lê o `autoprefixer`, e a divergência de origem D que
o prompt previa contra o §17 da I1-PR-14 não existe. Nenhum `package.json` de `apps/*` ou `packages/*` cita alguma
das 11. `pnpm install --offline`: **11 linhas `-`, nenhuma `+`**; `pnpm-lock.yaml` −674; `pnpm install
--frozen-lockfile --offline` passa sobre o lockfile novo.

## 3. O `Arial` e a prova por imagem `[medido]` (`cn/prova-por-imagem.txt`)

`app/globals.css:6` era `body { font-family: Arial, Helvetica, sans-serif; }`, fora da camada `base`; agora
`body { font-family: var(--fonte-ui-familia), sans-serif; }` (o token vem de `app/styles/identidade.css`).

O método é o da I1-PR-14 §14, refeito a partir do texto (o script dela não foi commitado): full page, Chromium do
Playwright, `pixelmatch` com `threshold 0`, o indicador do `next dev` removido; mais a geometria de todo elemento
visível do `<body>` (tag, hash do texto folha, x, y, w, h — o texto só como hash). Barreira: POST/PUT/PATCH/DELETE a
`/api/*` fora de `/api/auth/session` abortado e contado (0 nas três rodadas); `octavia.rocks` abortado.

- **públicas** (landing, login, privacy-policy): `next dev` **sem `.env`** na porta 3114 — o antes na árvore do
  commit 1 (ainda sem `.env.local`), o depois numa cópia da árvore do commit 2 (`rsync` sem `.git`, `.env*`, `.next`);
- **`dashboard`**: `next dev` na porta 3000 com o `.env.local` copiado com `cp -p` de `../octavia-i1-pr2`, **sem
  abrir**, e o perfil persistente `~/.octavia-g-faixa-perfil` (I1-D37).

Onde o `Arial` ainda era a família computada, no antes: nas públicas, **nenhum** nó visível; no `dashboard`, **2** nós
e **sem texto folha** (o `div` raiz e o `main`) — os filhos declaram a própria família. Por isso o 0 esperado.

| comparação | resultado |
|---|---|
| controle: antes × antes2 | **0 pixel e 0 nó com Δ nas 12** |
| antes × depois | **0 pixel e 0 nó com Δ nas 12** (3 públicas + `dashboard`, × 1138 · 711 · 411) |
| o CSS servido | `body` computado `Arial, Helvetica, sans-serif` (antes) → `Manrope, sans-serif` (depois), nas 12 — o 0 mede a mudança, não a ausência dela |

As capturas não são anexadas (as do `dashboard` mostram a biblioteca da conta — a regra do texto de música); ficaram
fora da árvore. Os scripts: [`cn/capturar.mjs`](cn/capturar.mjs) e [`cn/diff.mjs`](cn/diff.mjs).

## 4. O `generator` e o matcher

- `app/layout.tsx:19` — `generator: "v0.dev"` (o `<meta name="generator">`, não visível) sai. O HTML servido perde a
  meta; a tela não muda (§3).
- `lib/__tests__/custom-matchers.ts` — o `toBeVisuallySelected` (o `bg-primary`/`bg-blue-500` das linhas 189–190) tinha
  **0 usos** fora da própria definição (`cn/matcher-arial-generator.txt`): saem a função, a linha da interface
  `Assertion`, a linha do `expect.extend` e a do `customMatchers`. O mesmo arquivo tem outro literal do tema velho,
  fora do §17 — div. 948.

## 5. O rastro comprimido `[medido]` (`cn/rastro-gz-lista.txt`, `cn/cn-leitura-gz.txt`, `cn/leitura-gz-commit2.txt`)

**A regra** (decisão 2 do encerramento): em texto, só o que o veredito lê — os `<superficie>.json` do nível de cima de
`tests/gates-web/medicoes/` (14) e `tests/gates-web/esperado/` (lido pelo `g-faixa-medir.ts` e pelo
`g-faixa-esperado.ts`). O rastro das subpastas vira `.json.gz`, um por arquivo, mesmo nome + `.gz`, com `gzip -n -9`
(sem nome nem data no cabeçalho: o mesmo JSON dá o mesmo `.gz`).

| | antes | depois |
|---|---|---|
| `du -sh tests/gates-web/medicoes` | **13M** | **10M** |
| `du -sh tests/gates-web/esperado` | 3.0M | 3.0M (intocado) |
| arquivos do rastro | 22 `.json`, 3 203 276 bytes | 22 `.json.gz`, 153 610 bytes |
| linhas removidas do git | — | 160 217 (`git diff --stat` do commit 2 sobre `medicoes/`) |

Os 22: `antes-1-auth/` (3), `antes-erro-global/` (1), `casca-efeito/` (3 + `antes/` 3 + `depois/` 2), `cn-main/` (7),
`rodada1/` (2 + `casca-efeito/` 2). Nenhum `*-rodadaN` existia.

**O leitor** (`scripts/gates-web/ler-medicao.mjs`): `lerJson(caminho)` lê o `.json` ou o `.json.gz` que existir;
`listarJson(pasta)` lista os dois sem descer em subpastas. A mesma medição nos dois formatos é **erro** (o veredito
sai 2), para não ser contada duas vezes nem divergir sem ninguém ver. Leem por ele: o `g-faixa-veredito.mjs`, o
`casca-efeito-corpo.mjs` (PR-9) e os 5 scripts de anexo — `casca-efeito-editor.mjs` (PR-10, PR-11),
`casca-efeito-upload.mjs` (PR-12), `casca-efeito-setlists.mjs` e `casca-dashboard.mjs` (PR-13). O `README.md` de
`medicoes/` diz o formato.

**CN de leitura**:

| | resultado |
|---|---|
| commit 1 — uma cópia comprimida num diretório temporário | veredito `cn-main`: REPROVA 83 nos dois formatos, **divergem 0**; vivas: PASSA nos dois, **divergem 0**; `casca-efeito-corpo`: **divergem 0**; controle (texto e `.gz` juntos): exit 2 |
| commit 1 — o veredito de `baeebf7` × o novo, sobre texto | vivas **0**, `cn-main` **0** |
| commit 2 — na árvore, o `.gz` × a saída guardada sobre texto | os 6 scripts de anexo **divergem 0**; veredito `cn-main` REPROVA 83, **divergem 0**; vivas PASSA, **divergem 0** |

`git lfs`: não (decisão do prompt).

## 6. Os verdes do commit 2 `[medido]` (`cn/gates-commit2.txt`, `cn/testes-tsc-lint-commit2.txt`, `cn/build-rotas.txt`)

| gate | resultado |
|---|---|
| G-back | **PASSA**, sem nenhuma linha `gback:` — o `globals.css`, o `layout.tsx` e o `package.json` não estão no núcleo (congelado 39 · união 40; diff vazio no núcleo) |
| G-palco | **PASSA — 0** |
| G-tok | **PASSA** (132 arquivos, 0 literais, 0 toasts, 0 imports de ui; frases isentas 5 de 5) · cobertura **FORA 0** (129 de tela, 129 na lista) |
| `SHA256SUMS` do DESIGN-I1 | 0 falhas |
| `packages/identidade` `css.test` | 4 passed |
| G-faixa (o do CI) | **PASSA**, lendo a pasta com o rastro em `.gz` |
| CN `cn-main` da I1-PR-5 | **REPROVA 83**, lendo `.gz` |
| `pnpm test` | 118 arquivos passed · 3 skipped; **1181 passed · 58 skipped** (1239) |
| `tsc --noEmit` | 0 |
| `pnpm lint` | 0 avisos, 0 erros |
| `pnpm build` (cópias sem `.env`) | **mesmas rotas**; controle antes × antes2 idêntico; antes × depois: `/` 511 → 512 B e `/signup/confirm-email` 818 → 819 B — um id de módulo do webpack renumerado (`2051` → `98285`); com os números normalizados, os dois chunks são iguais (div. 949) |

## 7. `knip` antes × depois (`cn/knip-antes.md`, `cn/knip-depois.md`)

| | antes | depois |
|---|---|---|
| arquivos não usados | 25 | 25 |
| dependências não usadas | 14 | **3** (só `@expo-google-fonts/{manrope,raleway,ibm-plex-mono}` do nativo) |
| devDependencies não usadas | 7 | 7 |
| exports não usados | 118 | **117** (−`toBeVisuallySelected`) |
| tipos exportados não usados | 33 | 33 |

**Nenhum nome novo** no depois: o `diff` dos nomes só tem as 11 e o matcher, como remoções.

## 8. O que ainda sobra

Do §17 da I1-PR-14 e do §3 do encerramento, depois desta PR:

| o que sobra | destino |
|---|---|
| `public/sw.js` (o worker de auto-destruição) e o `worker-src`/`manifest-src` da CSP | bloco seguinte ao I1 (aval 4 do encerramento) |
| os specs do `ux-audit` (`tests/ux-audit/fase-d/*`, rótulos em inglês) | bloco seguinte ao I1 (§10.5.6) |
| o triângulo do `<summary>` da tela de erro (div. 913) | bloco seguinte ao I1 (§10.5.7) |
| `public/icons/*`: 10 de 11 sem leitor (div. 553) | bloco seguinte ao I1 (§10.5.8) |
| a memoização das setlists (div. 568) | Bloco D (aval 10 do encerramento) |
| o `text-amber-500` do `toBeInFavoriteState` (div. 948) | bloco seguinte ao I1, com o resto do `custom-matchers.ts` |
| as devDependencies que o `knip` acusa (7) e as 3 `@expo-google-fonts/*` do nativo | fora do escopo desta PR (o nativo; ferramentas de CLI) — sem destino novo |

As 11 dependências, o `Arial`, o `generator`, o matcher do §17 e o rastro em texto: **fechados aqui**.

## 9. Divergências — 944 a 950

| # | origem | o que se presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **944** | P | a lista do `.gz`: `rodada1/`, `casca-efeito/`, `cn-main/`, `*-rodadaN` | `antes-1-auth/` e `antes-erro-global/` também são rastro fora do veredito | viram `.gz` pela regra "fica em texto só o que o veredito lê" (aceita no aval) |
| **945** | P | leem o rastro: o veredito, o `casca-efeito-corpo.mjs` e o CN do `cn-main` | **5 scripts de anexo** a mais (PR-10…13) leem o rastro por caminho fixo | passam a ler por `lerJson` (aval 4) |
| **946** | P | *"o `.gz` no git basta para 16 MB"* | o rastro é **3,2 MB**; as vivas (≈9,8 MB) e o `esperado/` (3,0 MB) ficam em texto pela própria decisão 2 | `medicoes/` 13M → 10M; registrado |
| **947** | T | — | na 1ª captura do `dashboard` o perfil caiu em `/login` (o cookie da sessão tinha vencido) | uma ida a `/login` com o perfil: o cliente renovou o cookie (POST `/api/auth/session`, o único que a barreira deixa passar), sem credencial digitada; capturado em seguida |
| **948** | P | o §17 aponta só `custom-matchers.ts:189-190` | o mesmo arquivo tem `text-amber-500` no `toBeInFavoriteState` (`:29`), outro literal do tema velho | fora do escopo desta PR; §8 |
| **949** | T | *"tabela de rotas idêntica"* | as rotas são as mesmas; dois tamanhos +1 B pela renumeração de um módulo do webpack | chunks iguais com os ids normalizados; registrado (§6) |
| **950** | T | — | a 1ª tentativa de compressão do commit 2 não comprimiu nada (a lista numa variável do zsh não se separou) e a comparação que saiu foi texto × texto | descartada; refeita arquivo a arquivo; o que vale é `cn/leitura-gz-commit2.txt` |

Próxima divergência: **951**.

## 10. Contabilidade

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · senhas digitadas · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0 · 0** |
| executor (I1-D37) | `.env.local` | copiado de `../octavia-i1-pr2` com `cp -p`, **não aberto**; ignorado pelo git |
| executor (I1-D37) | rodadas com sessão (perfil persistente, `localhost:3000`) | o `dashboard` antes: 4 tentativas que pararam na 1ª carga (2 no `networkidle`, que o Firebase não deixa acontecer; 2 na sessão caída, div. 947), a sonda que renovou o cookie (1 carga), antes e antes2 (2 × 3 cargas); o depois (3 cargas) — 14 cargas no total, bem abaixo da cota do `/api/profile` |
| executor | `next dev` sem `.env` (3114) | 2 subidas (antes na árvore, depois numa cópia); paradas |
| executor | `pnpm build` | 3, em cópias da árvore sem `.env` (antes, antes2, depois) |
| executor | `.claude/launch.json` do checkout principal (ignorado pelo git) | +3 entradas (`i1-pr15-dev-sem-env`, `i1-pr15-dev-3000`, `i1-pr15-depois-sem-env`) |
| repositório | fora de `docs/` e das medições (`git diff --stat baeebf7 fd6ca71`) | 7 arquivos, **+36 −715**: `pnpm-lock.yaml` −674 · `ler-medicao.mjs` +27 · `custom-matchers.ts` −25 · `package.json` +1 −12 · `g-faixa-veredito.mjs` +6 −2 · `globals.css` +2 −1 · `layout.tsx` −1 |

## 11. Anexos (`cn/`)

| arquivo | o quê |
|---|---|
| `dependencias-11.txt` | o `grep` das 11, o `postcss.config.mjs`, os `package.json` dos pacotes |
| `dependencias-lockfile.txt` | o `pnpm install --offline` e o `diff --stat` do lockfile |
| `matcher-arial-generator.txt` | quem usa o matcher; as linhas do `Arial`, do `generator` e do token |
| `rastro-gz-lista.txt` | `du -sh` antes, os 22 com tamanho em texto e em `.gz`, o que fica em texto |
| `cn-leitura-gz.txt` | o CN do commit 1 (cópia comprimida; o veredito velho × o novo) |
| `leitura-gz-commit2.txt` | a leitura na árvore do commit 2 e o `du -sh` depois |
| `prova-por-imagem.txt` | antes × antes2 e antes × depois, 12 capturas |
| `capturar.mjs` · `diff.mjs` | os scripts da prova por imagem (aval 6) |
| `gates-commit2.txt` · `testes-tsc-lint-commit2.txt` · `build-rotas.txt` | os verdes do commit 2 |
| `knip-antes.md` · `knip-depois.md` | o `knip` nos dois lados |
