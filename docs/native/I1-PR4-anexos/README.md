# I1-PR-4 — `packages/identidade`: tokens e ícones compartilhados; o nativo passa a importar

> **Bloco** I1 (identidade) · **PR** [#339](https://github.com/marcelviana/octavia/pull/339) ·
> **Árvore** `../octavia-i1-pr4`, branch `i1/pr4-identidade`, criada de `origin/main` =
> `d18b7c4972dd95cb8e8d01a66e21e8420928273e` (merge da #338; pré-condição
> `git cat-file -e origin/main:docs/ux/DESIGN-I1/SHA256SUMS` → presente).
> **Commits**: `4568877` (1 — o CN antes do pacote) · `08cdf6b` (2 — o pacote e a migração) ·
> `59b78de` (2b — `tsc` do pacote no `ci.yml`) · o 3 (este, só docs, depois do APK verde).
> O pacote é do nativo tanto quanto do web; mora aqui, com um link em `docs/ux/I1-PRECHECK.md` §17.
>
> **Convenções**: `[medido]` = comando + saída literal nesta sessão; `[lido]` = arquivo e linha;
> premissa do prompt é hipótese. Divergências 597–611 (teto da PR: 629), origem **P** premissa ·
> **D** doc anterior · **A** ambiente/dado/defeito · **T** toolchain/aparato · **X** terceiros.

---

## 1. Decisões do aval `[Marcel, 2026-09-27]`

Do aval do commit 1:

1. **Esquema das custom properties como proposto** (§5): `--cor-*`, `--cor-claro-*`,
   `--fonte-<tok>-familia/-peso`, `--tamanho-*`, `--entrelinha-*`, `--tracking-*`, `--zoom-padrao`,
   `--espaco-*`, `--raio-*`, `--toque-*`, `--barra-*`, `--faixa-*` (só `web.*` e `folha.*`); faixas
   como `@media` de intervalo gerados dos `limiares`; B com `conteiner: none`, `colunaLateral` /
   `razaoListaDetalhe` sem propriedade quando `'empilha'`; C com `-lista: 2` / `-detalhe: 3`.
2. **Visto: opção (b).** Não entra no pacote; o `garantida` do catálogo (`r 9 · M8 12.2l2.8 2.8L16.2 9.4`)
   é o ícone de "salvo/confirmado" no web como no nativo. Vira a **errata I1-E6** do
   `docs/ux/DESIGN-I1/README.md` §2.2 (escrita neste commit) e fecha a div. 601. Divs. 599/600:
   **herança para errata do `DESIGN-N2/README.md`** (legenda × molduras; o `dados.ts` é a verdade),
   destino: encerramento do I1.
3. **G-inv: opção (a).** A prova de "nada mudou em dp" é o `igualdade.test.ts` + os 211 testes
   `native`/`native-tela`. O `g-inv.sh` roda sobre os dumps commitados e é **instrumento intacto,
   não prova**. **Decisão de bloco**: PR que só move tokens se prova por igualdade; PR que muda pixel
   volta ao aparelho.
4. **`TRACO` vai para `packages/identidade/src/icones.ts`**; o `Icone.tsx` importa. 5ª exceção do G1a.
5. **`native.yml` e `mudou-nativo.sh` ganham `packages/identidade/**`** — extra declarado (div. 603).
6. **Lockfile**: extra declarado (div. 604).
7. **Gerador** via `pnpm exec tsx packages/identidade/scripts/gerar-css.mjs`; teste em
   `packages/identidade/test/css.test.ts`.
8. **Sem linha `g1a` para o CSS**; linhas `g1a` para `theme.ts`, `faixa.ts`, `icones/dados.ts`,
   `fontes.ts`, `icones/Icone.tsx`; o corpo lista as mudanças de `faixa.test.ts` e `gates.test.ts`.

Do aval do commit 2:

9. **Commit 2b**: o passo do `ci.yml` que roda o `tsc` do `packages/core` passa a rodar também o do
   `packages/identidade` — extra declarado (a herança que o commit 2 declarou).

---

## 2. O que migrou e como

| de (nativo, `d18b7c4`) | para (pacote) | o que ficou no nativo |
|---|---|---|
| `theme.ts`: `dark`, `light`, `colors`, `ThemeColors`, `ThemeName`, `space`, `radius`, `touch`, `bar`, `size`, `zoomSteps`, `zoomDefault`, `lineHeight`, `tracking` | `src/tokens.ts`, valores idênticos | `theme.ts` reexporta |
| `theme.ts`: `font` (nomes de `.ttf`) | `src/tokens.ts`: `font` como **família + peso** (I1-D31), tipos `Fonte` / `NomeFonte` | `fontes.ts` (novo): mapa família+peso → `.ttf`; `theme.ts` reexporta o `font` de lá |
| `theme.ts`: `TokensDaFaixa`, `faixaC`, `faixaB`, `faixas` (comentários por campo, literalmente) | `src/tokens.ts`, **mais o bloco `web`** do `DESIGN-I1/README.md` §3 | `theme.ts` reexporta `faixas` e `TokensDaFaixa` |
| `faixa.ts`: `faixaDe`, `Faixa`, os limiares 700/960 | `src/tokens.ts`: `faixaDe`, `Faixa`, **`limiares = { ab: 700, bc: 960 }`** (I1-D30) | `faixa.ts` reexporta (o `useFaixa.ts` não muda) |
| `icones/dados.ts`: `desenhos` (43), `Primitiva`, `Desenho`, `TintaIcone`, `NomeIcone` | `src/icones.ts`: **o mapa byte a byte** (o `gate:icones` o lê como texto) + `nomesIcones` | `dados.ts` reexporta |
| `icones/Icone.tsx`: `TamanhoIcone`, `TRACO` | `src/icones.ts` | `Icone.tsx` importa e reexporta o tipo; o renderizador (RN) fica |
| `useFaixa.ts` (`useWindowDimensions`) | — | fica (depende de RN) |

Prova do "byte a byte" no mapa `[medido]`:
`diff <(sed -n '/^export const desenhos/,/^export type NomeIcone/p' apps/native/src/icones/dados.ts) <(… packages/identidade/src/icones.ts)` → `MAPA-IDENTICO`.

**O web** recebe `app/styles/identidade.css` (gerado, commitado, **ainda sem consumidor**).

**Os testes do nativo que mudaram** (sem par no G1b, que só lê `packages/core/src`; errata da I1-D30, div. 503):
- `apps/native/test/faixa.test.ts` — o `it` "um ponto só" passa de `['src/faixa.ts']` a `[]` no app **e**
  `['src/tokens.ts']` no pacote, no mesmo `it` (a contagem fica em 211).
- `apps/native/test/gates.test.ts` — os três `rodar('scripts/icones.mjs', …)` do mapa real leem
  `MAPA_ICONES = '../../packages/identidade/src/icones.ts'`.

**Os três `undefined`** do inventário — `faixas.A.folha.alturaMin`, `faixas.B.folha.alturaMin`,
`faixas.C.reordenar.artistaMin` — migraram como **chave presente com valor `undefined`**, iguais (a
igualdade cobra com `toStrictEqual`). Nenhum valor foi inventado. **Herança** (destino: quem der
forma final ao `TokensDaFaixa` do web — o G-faixa da PR-5 ou a primeira PR de tela que ler `folha`):
`undefined` num token é "a medida não existe nesta faixa", e o CSS gerado o traduz por omissão.

---

## 3. Inventário do commit 1 `[medido]`

Anexo próprio: [`inventario.txt`](inventario.txt) (337 linhas de saída, com cabeçalho). O script,
rodado de uma pasta de rascunho com os caminhos absolutos da árvore (aqui relativos à raiz):

```ts
import * as t from './apps/native/src/theme.ts'
import * as f from './apps/native/src/faixa.ts'
import * as d from './apps/native/src/icones/dados.ts'
const walk = (o: any, p: string): string[] => typeof o === 'object' && o !== null && !Array.isArray(o)
  ? Object.keys(o).flatMap((k) => walk(o[k], p ? `${p}.${k}` : k)) : [`${p} = ${o === undefined ? 'undefined' : JSON.stringify(o)}`]
for (const k of Object.keys(t)) if (k !== 'faixas') console.log(walk((t as any)[k], k).join('\n'))
console.log(walk({ A: t.faixas.A === t.faixas.B ? '(=== B, mesma referência)' : 'DIFERENTE' }, 'faixas').join('\n'))
console.log(walk({ B: t.faixas.B, C: t.faixas.C }, 'faixas').join('\n'))
console.log('faixaDe:', [699, 699.9, 700, 960, 960.1, 961].map((x) => `${x}→${f.faixaDe(x)}`).join(' '))
const nomes = Object.keys(d.desenhos)
console.log('icones:', nomes.length)
for (const n of nomes) { const e = (d.desenhos as any)[n]; console.log(`  ${n}: ${Object.keys(e).map((s) => `${s}(${e[s].length})`).join(' ')}`) }
```

| item | depende de RN? |
|---|---|
| `dark` / `light` / `colors` · `space` · `radius` · `touch` · `bar` · `size` · `zoomSteps` · `zoomDefault` · `lineHeight` · `tracking` · `TokensDaFaixa` · `faixaDe` | não |
| `font` | não importa RN, mas o valor era nome de `.ttf` do `expo-font` (divs. 484/485) → família + peso |
| `desenhos` (43; `normal` em todos, `inerte` em 9, `ativo` só no `auto-scroll`, `em20` só na `tab`) | não |
| `TRACO` | o valor é puro; o arquivo (`Icone.tsx`) é RN |
| `useFaixa` | **sim** — fica |

A **linha de base congelada** do CN (`packages/identidade/test/linha-de-base.json`) foi gerada no
commit 1 pelo mesmo caminho: `tsx` importando `theme.ts` e `icones/dados.ts` de `d18b7c4` e
serializando com `undefined` → `{"$indefinido": true}`.

---

## 4. O mapa de fontes (`apps/native/src/fontes.ts`)

| token | família | peso | `.ttf` (`app.json`) |
|---|---|---|---|
| `display` | Raleway | 600 | `Raleway_600SemiBold` |
| `displayMedium` | Raleway | 500 | `Raleway_500Medium` |
| `ui` | Manrope | 400 | `Manrope_400Regular` |
| `uiBold` | Manrope | 600 | `Manrope_600SemiBold` |
| `mono` | IBM Plex Mono | 400 | `IBMPlexMono_400Regular` |
| `monoBold` | IBM Plex Mono | 600 | `IBMPlexMono_600SemiBold` |

`packages/identidade/test/fontes.test.ts` prova: todo token do pacote tem entrada; os nomes do mapa
são exatamente os seis `.ttf` do `apps/native/app.json`; família+peso sem arquivo falha com o nome
do que falta.

---

## 5. O esquema das custom properties (decisão 1, com a regra da div. 605)

`app/styles/identidade.css`, gerado por `packages/identidade/scripts/gerar-css.mjs`. 1 dp = 1 px.

| prefixo | origem | exemplo |
|---|---|---|
| `--cor-*` | `dark` | `--cor-bg: #100F16;` `--cor-line-info: #6E6A80;` |
| `--cor-claro-*` | `light` (o papel do PDF) | `--cor-claro-bg: #F6F1EA;` |
| `--fonte-<tok>-familia` / `-peso` | `font` | `--fonte-display-familia: 'Raleway';` `--fonte-display-peso: 600;` |
| `--tamanho-*` · `--entrelinha-*` · `--tracking-*` (em) · `--zoom-padrao` | `size`, `lineHeight`, `tracking`, `zoomDefault` | `--tamanho-title: 22px;` `--tracking-display-wide: 0.22em;` |
| `--espaco-*` · `--raio-*` · `--toque-*` · `--barra-*` | `space`, `radius`, `touch`, `bar` | `--espaco-xxl: 32px;` `--toque-min: 48px;` |
| `--faixa-*` | só `web.*` e `folha.*` | `--faixa-conteiner`, `--faixa-margem`, `--faixa-coluna-lateral`, `--faixa-razao-lista` / `-detalhe`, `--faixa-zona-arquivo`, `--faixa-linha-lista`, `--faixa-linha-musica`, `--faixa-empilha` (0/1), `--faixa-folha-largura` / `-topo` / `-altura-min` |

**A regra da div. 605**: a faixa **C também vai num `@media`**, e **só os tokens globais ficam no
`:root`** puro — senão os valores de C (`--faixa-coluna-lateral: 320px`, a razão 2 : 3) vazariam para B
pela cascata, justamente onde B os omite por serem `'empilha'`. O `css.test.ts` cobra que nada de
`--faixa-*` existe fora dos `@media` e que o bloco B não tem `--faixa-coluna-lateral` nem
`--faixa-razao-*`.

```css
:root { /* globais */ }
@media (width > 960px) { :root { /* C */ } }
@media (700px <= width <= 960px) { :root { /* B */ } }
@media (width < 700px) { :root { /* A (= B) */ } }
```

Os literais das media queries saem de `limiares`; o intervalo replica o `faixaDe` inclusive na fração.
"Gerado == fonte": o `css.test.ts` regenera e compara byte a byte com o commitado.

---

## 6. Ícones — divs. 588, 589, 599, 600, 601

| div. | resultado `[medido]` | destino |
|---|---|---|
| **588** | o **visto** (`M4.5 12.5l5 5 10-11`) **não existe** no `dados.ts` por desenho. No `DESIGN-N2/telas.html` aparece 8× (molduras "2 formulario" e o quadro *"Exceção declarada · o visto não é amputável (R2·2)"* dentro do anexo D, sem registro próprio — o regex do `gate:icones` o soma à união de `adicionar / remover`) | decisão 2 (b): não entra; **I1-E6** |
| **589** | o `garantida` do `dados.ts` tem **uma forma** (só `normal`: `r 9 · M8 12.2l2.8 2.8L16.2 9.4`) | o pacote mantém a do catálogo |
| **599** (D) | a legenda do N2 diz *"garantida existente reaproveitado em três papéis novos: … e o visto do botão de salvar"*; a moldura desenha o visto. O nativo seguiu a legenda (`FolhaDeCriar.tsx:558`, `ModoDeReordenar.tsx:595`) | herança: errata do `DESIGN-N2/README.md`, no encerramento do I1 |
| **600** (D) | a forma de r 8,5 (`M8.4 12.3l2.5 2.5 4.7-5`) já estava 7× nas molduras do N2 ("1 criar em S1", "5 picker"); a I1-E3 a herdou | herança: mesma errata do `DESIGN-N2`, no encerramento do I1 |
| **601** (A) | a folha 8 desenha o visto em **16 px, traço 3** (18×, `SET-adicionar*`), fora da família 20/24/28 | **fechada pela I1-E6** |

Onde o visto aparece nas folhas do I1 `[medido]` (script sobre os `telas.html`, `data-estado` da seção,
`width` e `stroke-width` do `<svg>`): **50 ocorrências, só nas folhas 6, 7 e 8** — 6: 12 (8 × 24/1,75 +
4 × 24/1,25; `EDIT-letra`, `-cifra`, `-tab`, `-sem-mudancas`, `-salvando`, `-salvar-erro`); 7: 12 (idem;
`UP-detalhes`, `-detalhes-inativo`, `-salvando`, `-salvar-erro`, `-criar`, `-criar-validacao`); 8: 26
(4 × 24/1,75 + 4 × 24/1,25 + 18 × 16/3; `SET-criar`, `-criar-validacao`, `-criar-salvando`, `-criar-erro`,
`SET-adicionar`, `-adicionar-enviando`, `-adicionar-erro`). **Nenhuma** nas folhas 0, 1, 4, 5 (div. 611).

---

## 7. Gates `[medido]`

**Linha de base na `main`** (commit 1):

```
$ pnpm --filter native test                                   → nenhuma saída, exit 0   (div. 597)
$ pnpm exec vitest run --project native --project native-tela → Test Files 21 passed (21) · Tests 211 passed (211)
$ (apps/native) pnpm run gate:icones  → mapa: 43 nomes · 97 elementos distintos · 43 com 'normal' · acusações: 0 · avisos: 0
$ (apps/native) pnpm run gate:a20     → arquivos varridos: 33 · literais 169 · acusações: 0
```

**O CN de igualdade no commit 1** (o pacote ainda não existe):

```
$ pnpm exec vitest run --project identidade                                        [exit 1]
 FAIL   identidade  packages/identidade/test/igualdade.test.ts [ packages/identidade/test/igualdade.test.ts ]
Error: Cannot find module '../src/index' imported from '…/packages/identidade/test/igualdade.test.ts'
 Test Files  1 failed (1)
```

**Depois do commit 2**:

```
vitest --project identidade      css 2 · fontes 3 · igualdade 32 → Tests 37 passed (37)
vitest --project native --project native-tela   Test Files 21 passed (21) · Tests 211 passed (211)
vitest --project web --project core             Tests 809 passed | 77 skipped (886)   [809 + 211 = 1020]
gate:icones (lê ../../packages/identidade/src/icones.ts)
  §6.4: 34 linhas → 33 nomes distintos, + 4 fora do catálogo + 6 da tela 2 = 43 esperados
  anexo D: 34 registros (V1) + 5 (DESIGN-N2, E17) = 39 registros · 68 elementos distintos no do V1
  mapa: 43 nomes · 97 elementos distintos · 43 com 'normal'
  acusações: 0 · avisos: 0                                                         [exit 0]
gate:icones:cn   acusações: 23 · avisos: 0                                         [exit 1, como na main]
gate:a20   arquivos varridos: 34 (33 + fontes.ts) · literais em posição de texto examinados: 169 · acusações: 0
tsc -p packages/identidade 0 · packages/core 0 · apps/native 0 · raiz (app) 0 erros
pnpm lint   ✔ No ESLint warnings or errors
pnpm build  ✓ Compiled successfully · ✓ Generating static pages (22/22)
```

O `tsc -p tsconfig.test.json` (informativo no CI, `continue-on-error`) tem 103 erros, **nenhum** em
arquivo desta PR (`grep -E "identidade|apps/native|app/styles"` → 0).

**Controle de mutação** (`space.xl` 24 → 25 em `packages/identidade/src/tokens.ts`, depois restaurado):

```
     × o commitado é o gerado, byte a byte 6ms
     × space 5ms
     × faixas A, B e C, fora o bloco web 2ms
     × o bloco web por faixa — DESIGN-I1/README.md §3 (nome · C · B; A segue B) 1ms
     × theme.space 1ms
     × theme.faixas — sem o bloco web, A continua sendo B 1ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 6 ⎯⎯⎯⎯⎯⎯⎯
(restaurado)      Tests  37 passed (37)
```

**G-inv — instrumento intacto, não prova** (decisão 3). Ele compara dumps do uiautomator, não código;
sobre os dumps commitados da N3-PR6c imprime o mesmo resultado com ou sem esta PR:

```
$ sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B5-baseline docs/native/N3-PR6c-anexos/dumps-final
G-inv: 34 de 34 idênticos
G-inv: IDÊNTICO EM DP ✓                                              [exit 0]
$ sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem docs/native/N3-PR6c-anexos/dumps-final
G-inv: 18 de 18 idênticos
G-inv: IDÊNTICO EM DP ✓                                              [exit 0]
```

**G1 e G2/G3**, com o bloco ```` ```gates ```` do corpo passado pelo `gates-decl.sh`:

```
$ GATES_DECL=<decl> sh apps/native/scripts/g1.sh origin/main HEAD                 [exit 0]
      EXCEÇÕES DECLARADAS (o escopo desta PR):
        apps/native/src/theme.ts
        apps/native/src/faixa.ts
        apps/native/src/icones/dados.ts
        apps/native/src/fontes.ts
        apps/native/src/icones/Icone.tsx
  G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)
  G1b: só adição ✓
$ GATES_DECL=<decl> sh apps/native/scripts/g2g3.sh origin/main HEAD               [exit 0]
G2 — testIDs  antes=80  depois=80        G2: antes ⊆ depois ✓
G3 — linhas log( antes=68  depois=68     G3: nenhuma linha sumiu ✓
```

**O CN do G1a** — o mesmo head **sem** declaração (lista vazia):

```
$ GATES_DECL=<vazio> sh apps/native/scripts/g1.sh origin/main HEAD                [exit 1]
  G1a: DIFF NÃO VAZIO ✗
       apps/native/src/faixa.ts         |  32 +---
       apps/native/src/fontes.ts        |  29 ++++
       apps/native/src/icones/Icone.tsx |   8 +-
       apps/native/src/icones/dados.ts  | 257 ++------------------------------
       apps/native/src/theme.ts         | 315 ++++-----------------------------------
       5 files changed, 79 insertions(+), 562 deletions(-)
  G1a: ARQUIVO NOVO no escopo, sem exceção declarada ✗
      apps/native/src/fontes.ts
```

**O detector do APK** (`sh apps/native/scripts/__cn__/cn-w4b2.sh`, 57 casos ✓; a única linha `***` é o
rodapé do script). Os três novos:

```
CP-H1n  synchronize, só o packages/identidade   → nativo=true
CN-H1o  synchronize, só o packages/core         → nativo=false
CN-H1p  '- packages/identidade/**' no paths: 2 vez(es) (esperado 2: pull_request e push)  ✓
```

**CI** (`gh run list --branch i1/pr4-identidade`):

| commit | `gates` | `CI` | `native` |
|---|---|---|---|
| `08cdf6b` | [36334711964](https://github.com/marcelviana/octavia/actions/runs/36334711964) success | [36334711993](https://github.com/marcelviana/octavia/actions/runs/36334711993) success | [36334712031](https://github.com/marcelviana/octavia/actions/runs/36334712031) **success** — `android-debug-apk` 16:50:35Z → 17:02:56Z (12m21s) |
| `59b78de` (2b) | [36335505542](https://github.com/marcelviana/octavia/actions/runs/36335505542) success | [36335505403](https://github.com/marcelviana/octavia/actions/runs/36335505403) | [36335505455](https://github.com/marcelviana/octavia/actions/runs/36335505455) — `mudou-nativo` success, **`android-debug-apk` skipped** (div. 610) |

No `gates` do CI, o extrator leu as cinco linhas `g1a:` do corpo e deu `G1a: DIFF VAZIO ✓`,
`G1b: só adição ✓`, `G2: antes ⊆ depois ✓`, `G3: nenhuma linha sumiu ✓`.

---

## 8. Divergências — 597 a 611

| # | origem | o que se presumiu | o que se mediu | destino |
|---|---|---|---|---|
| **597** | P | `pnpm --filter native test` dá a contagem do nativo | o `apps/native/package.json` não tem script `test`; o comando não imprime nada e sai 0 | a contagem é `vitest run --project native --project native-tela` (211) |
| **598** | P | G-inv com dumps commitados prova "nada mudou em dp" | o `g-inv.sh` compara dumps do aparelho; sobre os da N3-PR6c o resultado não depende desta PR | decisão 3: igualdade + 211; G-inv = "instrumento intacto, não prova" |
| **599** | D | o visto é "do DESIGN-N2 (catálogo)" | não é registro do anexo D; a legenda do N2 manda usar o `garantida` no Salvar, e o nativo o fez | herança: errata do `DESIGN-N2/README.md`, encerramento do I1 |
| **600** | D | a I1-E3 é defeito da folha I1 | a forma de r 8,5 já estava 7× nas molduras do N2 | herança: mesma errata do `DESIGN-N2`, encerramento do I1 |
| **601** | A | — | visto em 16 px, traço 3 (18×, folha 8), fora da família | fechada pela **I1-E6** |
| **602** | P | o G1a pede declaração do CSS derivado, "com o mecanismo do G1a para derivados" | o CSS está fora do escopo do G1a e o `g1.sh` não tem mecanismo de derivado | decisão 8; "gerado == fonte" é o `css.test.ts` |
| **603** | D | div. 494 | o `native.yml` não disparava pelo pacote | decisão 5, commit 2 |
| **604** | P | `--frozen-lockfile` | a dependência `workspace:*` muda o `pnpm-lock.yaml` (+5 linhas) | extra declarado (decisão 6) |
| **605** | P | o esquema da decisão 1 com C no `:root` puro | os valores `'empilha'` omitidos em B herdariam os de C pela cascata | C também em `@media`; só globais no `:root`; o `css.test.ts` cobra (§5) |
| **606** | T | — | `g1.sh … WORKTREE` não vê arquivo novo **não rastreado**: `git diff --stat BASE -- fontes.ts` sai vazio e a exceção aparece como "EXCEÇÃO DECLARADA E NÃO USADA ✗"; contra `HEAD` passa | **W5** |
| **607** | P | "prove que o `native.yml` dispara também pelo pacote" | a corrida `36334712031` não o prova: o diff da PR também toca `apps/native/**`. A prova é o CN (CP-H1n, CN-H1p) | prova no CI **na primeira PR que tocar só o pacote** |
| **608** | A | — | defeito do CN do commit 1: um `reviver` do `JSON.parse` que devolve `undefined` **apaga** a chave; o `toStrictEqual` reprovou o lado certo (o que tinha `alturaMin`) | corrigido no commit 2 (percurso que atribui `undefined`); os três `undefined` são herança (§2) |
| **609** | P | "os projetos do web na mesma contagem (1020)" | os 1020 do commit 1 eram web + core + native + native-tela; web + core = 809 | registro: 809 + 211 = 1020, igual |
| **610** | P | 2b: "`native` **não deve** disparar por esta mudança; se disparar, o `paths` está largo demais" | o workflow `native` disparou (`36335505455`): o `paths` do `pull_request` é avaliado contra o diff **acumulado** da PR, que toca `apps/native/**`. O detector viu só `.github/workflows/ci.yml` desde `08cdf6b` e o `android-debug-apk` saiu **skipped**. É o desenho do W4-b2 (`native.yml:10-17`), não `paths` largo | registro; nenhum APK rodou pelo 2b |
| **611** | P | I1-E6: *"onde a folha desenha o visto (`0-linha-de-aviso` sucesso, …)"* | a folha 0 **não tem** visto (0 ocorrências); o ícone do `AVISO-sucesso` é o `garantida` de r 8,5, já coberto pela I1-E3. E o "tamanho da família" para os 18 de 16 px é uma escolha | a I1-E6 lista as folhas 6, 7 e 8 e aplica **20** (o menor da família) onde a folha tem 16 — **a confirmar pelo Marcel** |

---

## 9. Contabilidade

| item | nesta PR |
|---|---|
| requests a prod / `/api/*` | **0** |
| `.env*` abertos | **0** |
| `adb` / aparelho / emulador / Metro | **0** |
| pushes | 3 (`08cdf6b`, `59b78de`, este); nenhum forçado |
| APKs construídos | 1 (`36334712031`, success); o 2b pulou (div. 610) |
| arquivos com sha registrado reescritos | 1: `docs/ux/DESIGN-I1/README.md` (errata I1-E6, só docs) → `SHA256SUMS` regenerado, só a linha dele muda: `db73aad896b5462eb5f5ff677a70dfeab7d8bc3fc3a55c95eeb11733a9f8504f` → `d2e9fe1bc41b5a08ac893dc3d991c744c5bcc0cf3e0123ccb1ae8273540e26ca`; `shasum -a 256 -c SHA256SUMS` → 14 × OK |

O bloco ```` ```gates ```` e o ```` ```gates-web ```` do corpo da PR, copiados:

```
# I1-PR-4: o nativo passa a importar @octavia/identidade (I1-D4). Os cinco
# arquivos de comportamento que mudam; app/styles/identidade.css e
# packages/identidade/** estão fora do escopo do G1a (div. 602).
g1a: apps/native/src/theme.ts
g1a: apps/native/src/faixa.ts
g1a: apps/native/src/icones/dados.ts
g1a: apps/native/src/fontes.ts
g1a: apps/native/src/icones/Icone.tsx
```

```
# I1-PR-4: nenhum arquivo do núcleo do G-back tocado
```
