# QL-PR2-anexos — a quebra no core

**PR [#374](https://github.com/marcelviana/octavia/pull/374)**, branch `ql/pr2-quebra`, árvore `../octavia-ql-pr2` sobre
`origin/main` = **`827141a`** (`827141adb91f29cf22e2dae9c12d3a686f207e29`, o merge da #373, a PR-1 do QL)
`[medido: git rev-parse origin/main]`. `pnpm install --frozen-lockfile --offline`. A árvore `../octavia-ql-pr1` foi
removida antes, com `git status --short` vazio e **sem `--force`**. Fonte do bloco: [`QL-PRECHECK.md`](../QL-PRECHECK.md),
[`QL-REQUISITOS.md`](../QL-REQUISITOS.md) (esta PR é a **PR-2** da QL-D19, aceites A-QL-1…A-QL-3),
[`DESIGN-QL/`](../DESIGN-QL/README.md) e o que a PR-1 deixou ([`QL-PR1-anexos/`](../QL-PR1-anexos/README.md)).

- **Commits**, na ordem do rito: `23f22ab` `test(ql): QL-PR2 — os casos de borda da quebra, entrando reprovados` ·
  `5d517d1` `feat(ql): QL-PR2 — a quebra no core (R1–R4, a medida do QL-D24)` · o de docs (este README e os anexos).
- **Nenhuma tela, nenhum aparelho**: `Leitor.tsx`, `StageScreen.tsx`, `VisualizacaoScreen.tsx` com diff vazio (o G1a, §5:
  a única exceção declarada é `quebra.ts`). Nenhuma requisição a prod, nenhum login, nenhum `.env*` aberto.
- **Texto**: só os do projeto (`QL-BRIEF.md` §5, a Letra de 110 colunas da fixture do N3, frases inventadas); nenhum texto
  de música de terceiro (regra 10).
- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado; `[hipótese]` = o resto.

| arquivo | o quê |
|---|---|
| [`gate-antes-depois.txt`](gate-antes-depois.txt) | o gate da quebra e os extras do core no commit 1 (46 reprovam, a lista da PR-1) e no commit 2 (46 passam, lista vazia) |
| [`extras-commit1.txt`](extras-commit1.txt) | os 46 extras, um a um, reprovando contra o contrato que lança |
| [`cn-gate-quebra.txt`](cn-gate-quebra.txt) | os CN do gate sobre a PR-2 — `instrumentos/cn-gate-quebra.sh` |
| [`cn-instrumentos-real.txt`](cn-instrumentos-real.txt) | o G-N3 e o `corpo-logico.mjs` sobre a quebra **real** — `instrumentos/cn-instrumentos-real.sh` |
| [`cn-instrumentos-pr1.txt`](cn-instrumentos-pr1.txt) | o CN dos instrumentos da PR-1, rodado de novo (base `d0d0639`, div. 1208) |
| [`custo.txt`](custo.txt) | o custo de `quebrar` — `instrumentos/custo.ts` |
| [`gates.txt`](gates.txt) | os gates locais sobre a PR: G1/G2/G3 com o bloco, o `shasum -c`, os quatro do site |
| [`ci-log.txt`](ci-log.txt) | o log do CI filtrado (§6.1) |

---

## 1. A função — `packages/core/src/quebra.ts`

O contrato da PR-1 (QL-D41) **não mudou**: `quebrar(texto, tipo, colunas): LinhaVisual[]`, com `texto`, `logica`,
`continuacao`, `inicio`, `fim`; `RECUO_DA_CONTINUACAO = 2`. Entra um export novo, **`ehLinhaDeAcordes(linha)`** (§2).

**Como ela trabalha.** Cada linha lógica vira **células** — um ponto de código e os acentos combinantes (`\p{Mn}`, `\p{Me}`)
que vêm depois dele —, e cada célula tem uma largura na linha **desenhada**: o `\t` vai até a próxima coluna múltipla de 8,
o `\r` do fim da linha e o acento solto contam 0, o resto conta 1 (QL-D24). O corte só cai **entre** células: o acento não
se separa da letra e o par substituto (emoji) não se parte. `inicio`/`fim` saem das unidades UTF-16 das células.

- **R1 (Letra)**: o resto cabe → um pedaço (se só os espaços do fim passam da coluna, eles ficam fora). Senão, o último
  espaço (U+0020) cuja coluna é ≤ a coluna: o pedaço termina antes dos espaços que o precedem, o resto começa depois dos
  que o seguem. Sem espaço que caiba, a palavra é maior que a coluna e parte na última coluna. O `\t` **não** é ponto de
  corte: fora dos pedaços só pode haver espaço (o contrato, item 4).
- **R2 (o par)**: as duas linhas na mesma grade de colunas; o corte é a maior coluna ≤ a coluna com espaço (ou fim) **nas
  duas**; sem ela, a maior coluna que não cai dentro de um acorde (e é fronteira de célula na letra) — a palavra parte. O
  espaço do corte sai das duas; depois, os espaços do começo do resto saem na **mesma quantidade** (o menor dos dois),
  e o acorde continua sobre a sílaba (R3).
- **R3**: toda continuação começa na coluna 2 e mede a partir daí; o pedaço de acordes vazio não ocupa linha.
- **R4**: o par só na Cifra (`tipo === 'Chords'`), só quando a linha de acordes tem embaixo uma linha não vazia que não é
  de acordes; a Tab sai linha a linha, intacta; o resto quebra como letra.
- **Fora do domínio** (`colunas` não inteiro ou ≤ 2): `RangeError` (Q1).

A função continua **fora do `bodyOf` e da busca** (QL-D13): `content-contract.ts` e `search.ts` não a importam — o
estrutural do gate segue verde (`gate-antes-depois.txt`: `2 tests` passam no `web`).

## 2. O reconhecedor da linha de acordes — a heurística

**É a do pre-check, verbatim** `[lido: QL-PRECHECK-anexos/fase-b/q2-cifra-pares.sql:5-10]`: TOKEN = pedaço separado por
espaço ou tab; **acorde** = `^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(/[A-G](#|b)?)?$`;
**separador** = `^([|:.-]+|x?[0-9]+x?|\([0-9]+x\))$`; **linha de acordes** = linha não vazia em que **todo** token é
acorde ou separador, com ao menos um acorde. É a que a Fase B mediu no dado real (46 linhas de acordes, 46 pares, 4 quase
acorde na Cifra; `QL-PRECHECK.md` §10.2) e a que o laboratório da PR-1 usou para reproduzir as 44 molduras.

| entra (forma par, se tiver letra embaixo) | não entra (quebra como letra) |
|---|---|
| `Am  F  C  G` (a progressão, QL-D22) | `Intro: Am  E` (quase acorde) |
| `Am            F              C` | `Intro: Am  E  F#m7(11)  G` — **maioria** de acordes (4 de 5), e ainda assim fora (R4, QL-D23) |
| `C  \|  G  x2` · `Am  F  C  G  (2x)` (separadores) | `A noite chega` · `E o dia` (o "A" e o "E" soltos, div. 1189) |
| `D/F#  Gsus4  Bb` · `F#m7(11)` · `   Am   ` · `Am⇥F` | `Refrão` · `x2` · `\|  :` (só separador) · `''` · `'    '` |

Os 19 exemplos estão em `quebra.test.ts` (`ehLinhaDeAcordes — a heurística da Fase B`).

**O critério "maioria" não é o reconhecedor** (div. 1206). O prompt pedia *"a heurística … (a consulta 2, com o critério
'maioria')"*; no pre-check a "maioria" é a classificação **da quase acorde** (*"QUASE ACORDE, MAIORIA (extra declarado,
div. 1189)"*, `q2-cifra-pares.sql:15-16`), uma subclasse da linha que a heurística **recusa** — e a R4 e a QL-D23 dizem que
ela não forma par. A heurística do pre-check e a que o gate espera **não divergem** em caso nenhum (o gate passa com ela,
46 de 46), por isso não parei. A prova de que a leitura "maioria como reconhecedor" é a outra — e de que o gate a pega —
é o **CN-M** (§4): com ela, a `Intro: Am  E  F#m7(11)  G` forma par e o gate reprova `i:quase-acorde-14`.

## 3. Os casos extras — `packages/core/src/quebra.test.ts` (46 testes, projeto `core`)

Extras da mesma classe do gate (A-QL-1…A-QL-3). Todo caso passa pela **invariância** (a conferência do gate (ii), copiada:
o projeto `core` não importa de `tests/`). Entraram **reprovados**: 46 de 46 contra o `quebrar` que lança e um
`ehLinhaDeAcordes` que também lança (só a assinatura no commit 1, para o `tsc` fechar) — `extras-commit1.txt`.

### 3.1 Derivados — de R1–R4, do QL-D24 ou do contrato

| caso | colunas | linhas visuais | por quê |
|---|---|---|---|
| texto vazio, nos três tipos | 26 | `""` | contrato, item 3: a linha vazia tem uma linha visual |
| linha vazia no meio (`a␤␤b`) | 26 | `a` · `""` · `b` | idem |
| a última linha sem `\n` / com `\n` | 26 | `a`·`b` / `a`·`b`·`""` | as linhas lógicas são as do `split('\n')`: o `\n` do fim abre uma linha vazia |
| só espaços que cabem (5) | 14 | `"     "` | R1: nada a cortar |
| só espaços maiores que a coluna (30) | 14 | `""` | R1: o espaço do corte sai; R3: os do começo do resto também — não sobra pedaço |
| espaços no fim | 9 | `abc ` (cabe) · `abc def` (os 10 do fim saem) | o fim da linha lógica pode terminar em espaço; a coluna não se passa por espaço invisível |
| o recuo do autor que cabe | 14 | `    abc def` | nada manda tirar espaço do começo da primeira linha |
| a palavra exata da coluna / uma letra a mais | 14 | `abcdefghijklmn` / `…mn` · `  o` | R1 |
| 3 colunas, o mínimo | 3 | `abc`·`  d`; `ab`·`  c`·`  d`·`  e`·`  f` | R3: a continuação tem 1 coluna útil; R1: toda palavra de 2 parte |
| o acento combinante na palavra partida (`abcdéfgh`) | 5 | `abcdé` (fim 6) · `  fgh` | QL-D24: o acento conta 0 e pertence à letra |
| o emoji (`ab😀cd`) | 3 | `ab😀` · `  c` · `  d` | contrato: todo outro caractere conta 1 (ponto de código); o par substituto não se parte |
| o `\r` fora do fim (`abc\rdefghijk`) | 11 | `abc\rdefghij` · `  k` | QL-D24: só o `\r` do fim conta 0 |
| a linha de acordes sem letra embaixo | 14 | quebra como letra | R4: o par é com a linha de baixo |
| duas linhas de acordes seguidas | 14 | a 1ª como letra; a 2ª em par | R4 |
| a letra mais curta que os acordes | 14 | `Am      F`·`Eu vou`·`  C      G` | R2/R3: quando a letra acaba, não há pedaço dela; os acordes seguem |

E a **varredura**: os textos do gate (Letra; Cifra como Cifra e como Letra; a Tab) e os de borda, em **todo** número de
colunas de 3 a 90 — **528 quebras, a invariância em todas**; de 10 colunas em diante, **toda linha visual cabe na coluna**
(abaixo de 10 o `F#m7(11)` é maior que a coluna de continuação — Q3a); a Tab sai igual ao texto em 3…90.

### 3.2 Provisórios — R1–R4 não decidem: **perguntas para o Marcel**

O teste fixa o que a função faz hoje, para que a resposta, qualquer que seja, apareça como mudança de teste.

| Q | caso | o que a função faz (provisório) | a alternativa |
|---|---|---|---|
| **Q1** | `colunas` fora do domínio (2, 1, 0, −1, 2,5, `NaN`, `∞`) | **`RangeError`**, em todo tipo — o domínio que o contrato da PR-1 já escrevia (*"inteiro, maior que `RECUO_DA_CONTINUACAO`"*) | não quebrar (devolver as linhas lógicas, como a Tab). Importa para a **PR-3**: antes do primeiro `onLayout` a largura pode ser 0, e uma exceção no desenho derruba o palco — o leitor tem de guardar a chamada, ou a função tem de degradar |
| **Q2a** | a linha de acordes que **começa depois da coluna** (20 espaços + `C`, em 14) | o primeiro pedaço de acordes, vazio, **ocupa linha** (`""`) — senão a primeira linha visual dos acordes viria depois da da letra, e o contrato (item 3: a ordem das linhas lógicas) cairia | sem a linha vazia (a R3 diz *"um pedaço de acordes vazio não ocupa linha"*), e o item 3 do contrato muda |
| **Q2b** | no par, o pedaço de **letra só de espaço** numa continuação | **não ocupa linha** (por simetria com a R3) | ocupar, como linha só com o recuo |
| **Q2c** | o **recuo do autor maior que a coluna** (20 espaços + `palavra`, em 14) | `""` e `  palavra` — a R1 aplicada à letra: o corte cai no último espaço que cabe, e o pedaço antes dele é só espaço | o laboratório da PR-1 partia a palavra (`"              "`, `"  palavr"`…), que fere a R1 (*"só parte uma palavra se ela sozinha for maior que a coluna"*); ou tirar o recuo do autor |
| **Q3a** | no par, o **acorde maior que a coluna** (`F#m7(11)/G#`, 11, em 8) | o acorde **não parte** (*"o acorde nunca"*): o pedaço passa da coluna até o fim dele (`F#m7(11)/G#` · `Cada janela` · `  acesa`) | partir o acorde em último caso; ou deixar a linha rolar |
| **Q3b** | a linha de acordes **sozinha** (sem par) com acorde maior que a coluna | parte como palavra (R1: `F#m7(11)` · `  /G#`) — fora do par, a R2 não vale | o "acorde nunca parte" valer também fora do par |
| **Q3c** | o `\t` **mais largo que a coluna** (em 4) | fica sozinho numa linha (`abc` · `  \t` · `  de` · `  f`) — a função precisa andar ao menos uma célula | — (é borda de borda; registrado para não ser surpresa) |
| **Q4** | o `\r` do fim na **linha de acordes** (texto colado com CRLF) | o `\r` do fim **não é token**: `Am            F\r` é linha de acordes e forma par | seguir o SQL ao pé da letra (`btrim` só tira espaço, e o token `F\r` não é acorde): o texto CRLF perderia todo par (div. 1209) |
| **Q5** | a coluna do `\t` **numa continuação** | conta da coluna **desenhada** (o recuo de 2): `abcdefgh ij⇥k` em 9 → `abcdefgh` · `  ij⇥k` (9 colunas) | contar da linha lógica (seriam 10, e partiria). **Nenhum dos dois é o que o Android desenha** `[hipótese]`: o `TextView` não usa paradas de 8 colunas; a medida é um modelo, e o dado do Marcel tem 0 `\t` (§10.3 do pre-check) |

## 4. O gate antes e depois, e os controles negativos `[medido]`

**O gate** (`gate-antes-depois.txt`):

```
== 23f22ab (commit 1)
gate da quebra — casos 23 · checagens 46 ((i) 17 · (ii) 23 · (iii) 6) · passam 0 · reprovam 46
lista esperada (46) · reprovados (46)
gate da quebra: reprova exatamente a lista esperada (46) ✓
== 5d517d1 (commit 2)
gate da quebra — casos 23 · checagens 46 ((i) 17 · (ii) 23 · (iii) 6) · passam 46 · reprovam 0
lista esperada (0) · reprovados (0)
gate da quebra: zero reprovações, lista vazia (QL-PR2) ✓
```

**A lista vazia é condição fixa** (o molde do G-par, N4-D50): o gate ganhou a linha `✗ LISTA NÃO VAZIA` e o
`expect(esperados).toEqual([])`; o cabeçalho do teste e o da lista dizem por quê. **As expectativas — os 23 casos da
fixture — não mudaram** (`git diff 827141a -- packages/core/fixtures/ql-quebra.json` vazio).

**Os CN** (`cn-gate-quebra.sh` → `cn-gate-quebra.txt`; o arquivo e a lista devolvidos com `git checkout`, `git status`
vazio no fim; o `LAB_DEFEITO` por `export`/`unset`, div. 1203):

| CN | o que muda | o gate | os extras |
|---|---|---|---|
| 0 | nada (a PR-2) | 46 passam · lista vazia ✓ | 46 passam |
| L | `i:letra-80` na lista | `✗ declaração ÓRFÃ (passa)` · `✗ LISTA NÃO VAZIA (1)` — reprova | — |
| K | o contrato da PR-1 (lança) | 46 `reprovação NÃO DECLARADA` — reprova | — |
| 1 | o laboratório da PR-1, sem defeito | 43 passam; **reprovam só `iii:tabulacao-14`, `iii:cr-50`, `iii:combinante-50`** — o mesmo da PR-1: o laboratório não mede | — |
| 2 | `LAB_DEFEITO=letra` | (i) 17 · (ii) 23 · (iii) 6 reprovam | — |
| 3 | `LAB_DEFEITO=palavra` | (i) 8 · (ii) 8 · (iii) 3 — o (ii) nos 8 casos com continuação de mais de uma palavra, como na PR-1 | — |
| 4 | `LAB_DEFEITO=ordem` | (i) 16 · (ii) 16 · (iii) 3 — o (ii) nos 16 casos com 3+ linhas, como na PR-1 | — |
| M | o reconhecedor com o critério **"maioria"** (o `diff` no anexo) | **só `i:quase-acorde-14`** reprova: a quase acorde vira par | 2 reprovam: `não entra: "Intro: Am  E"` e `não entra: "Intro: Am  E  F#m7(11)  G"` |

**Os instrumentos do corpo sobre a quebra real** (`cn-instrumentos-real.sh` → `cn-instrumentos-real.txt`): o
`dump-quebrado.ts` da PR-1 com o import trocado para `packages/core/src/quebra.ts`, a Letra de 110 colunas da fixture
(49 linhas lógicas) sobre o dump `N4P9F-S3-S3a-letra-1a-avd-ret`:

| CP | G-N3 | `corpo-logico.mjs` |
|---|---|---|
| R48 — em 48, num nó | exit 0 · `quebra=1` · 92 desenhadas, 43 continuações | ✓ `len=2533 sha12=5bcc25b61916 = referência` |
| R26 — em 26, num nó | exit 0 · `quebra=1` · 137 desenhadas, 88 continuações | ✓ igual à referência |
| R48m — em 48, um nó por linha | exit 0 · `quebra=1` | ✓ (92 nós) |

As 92 linhas em 48 são as mesmas 92 do laboratório da PR-1 (CP-1 de lá). E o CN dos instrumentos da PR-1, de novo
(`cn-instrumentos-pr1.txt`, base `d0d0639`): **`todos os controles como esperado ✓`** — o CN-3…5 reprovam, o CN-6 (o G-N3
de antes do QL) reprova a quebra válida.

## 5. O custo `[medido: custo.txt]`

`instrumentos/custo.ts`, `pnpm exec tsx`, Node v22.23.1, Apple M1. Fixtures **inventadas** com a forma do dado real (§10.1
e §10.2 do pre-check): a Letra com 50 linhas (6 vazias), **maior 77, p95 46** (posto mais próximo); a Cifra com 40 linhas
= **20 pares**, maior 50. 100 rodadas por (texto, colunas):

```
texto  colunas  linhas visuais  mediana (ms)  máximo (ms)  — 100 rodadas
Letra       80              50         0.078        0.778
Letra       48              52         0.079        0.176
Letra       26              86         0.070        0.149
Letra       14             151         0.081        0.139
Cifra       80              40         0.093        0.683
Cifra       48              41         0.092        0.220
Cifra       26              71         0.107        0.218
Cifra       14             129         0.146        0.295
```

**Nenhum número passa de 16 ms**: o maior é 0,778 ms (a primeira rodada, com o JIT frio). **O que não se mediu**: o
Hermes no Tab S6 (outro motor, outra máquina) — `[hipótese]` uma ou duas ordens de grandeza abaixo de um quadro mesmo assim;
a medida no aparelho cabe na PR-3, onde a função passa a rodar no giro e no zoom. Sem `n` de aparelho, nada aqui é
referência (div. 80).

## 6. Os gates sobre esta PR `[medido: gates.txt]`

| gate | onde roda no CI | sobre a PR |
|---|---|---|
| **o gate da quebra** (`tests/gates/ql-quebra.test.ts`) | `ci.yml`, job `build` (sem `paths`): `pnpm test:unit` → o Vitest inteiro, projeto `web` | `zero reprovações, lista vazia (QL-PR2) ✓`, 46 passam |
| **os extras do core** (`packages/core/src/quebra.test.ts`) | o mesmo `build`, projeto **`core`** do Vitest (`include: packages/core/**/*.test.ts`) | 46 passam |
| o G-par do core (`n4-g-par.test.tsx`) · o G-par de V (`g-par-visualizacao.test.tsx`, `O_LEITOR_QUEBRA = false`) | o mesmo `build` (projetos `web` e `native-tela`) | verdes, sem mudança — nenhuma tela chama a função |
| G-N3 (o (e) pelo texto lógico) · `corpo-logico.mjs` | **à mão** (o CI não tem dump) | `g-n3.mjs` e `corpo-logico.mjs` sem diff nesta PR, nenhum dump novo; sobre a quebra real, §4 |
| G1a/G1b · G2/G3 | `gates.yml`, `gates-nativos`, com o bloco do corpo | G1a `DIFF VAZIO ✓` em 63 arquivos, a exceção `quebra.ts` usada · G1b `só adição ✓` (o `quebra.test.ts` é novo) · G2 `antes=121 depois=121 ✓` · G3 `antes=70 depois=70`, `nenhuma linha sumiu ✓` |
| `shasum -c` dos congelados | `gates.yml` | `OK` nos cinco (V1, N2, N3, N4, QL) |
| G-inv | à mão | **não se aplica**: nenhuma tela mudou, nenhum dump |
| G-back · G-palco · G-tok (+ cobertura) · G-faixa | `gates-web.yml` | `PASSA` nos quatro, o bloco ```` ```gates-web ```` vazio |
| `native.yml` (o APK) | **não roda**: a PR toca `packages/core/**`, `tests/gates/**` e `docs/**`, todos fora do `paths` (o recorte da N1-PR8; herança W5) | — |

Suíte inteira: `Test Files 144 passed | 3 skipped (147)` · `Tests 1764 passed | 59 skipped (1823)` (a PR-1: 143 · 1718;
+1 arquivo, +46 testes); `tsc` raiz 0 · core 0 · identidade 0 · nativo 0 (de dentro de cada pacote); `pnpm lint`
`✔ No ESLint warnings or errors`.

### 6.1 A prova pelo log do CI `[medido: ci-log.txt]`

`gh run view <id> --log`, filtrado e sem as cores. No passo *"Test — a suíte, e com ela os gates embrulhados"* do `build`
(run `37911553934`):

```
 ✓  core  packages/core/src/quebra.test.ts (46 tests) 189ms
gate da quebra — casos 23 · checagens 46 ((i) 17 · (ii) 23 · (iii) 6) · passam 46 · reprovam 0
lista esperada (0) · reprovados (0)
gate da quebra: zero reprovações, lista vazia (QL-PR2) ✓
 ✓  web  tests/gates/ql-quebra.test.ts (2 tests) 15ms
 Test Files  144 passed | 3 skipped (147)
      Tests  1764 passed | 59 skipped (1823)
```

— **o gate rodou e passou com a lista vazia, e os extras do core rodaram no projeto `core`, no mesmo job**; ali também o
G-par do core (`n4-g-par.test.tsx`, `lista esperada (0): (vazia)`) e o G-par de V (*"zero diferenças ✓"* nas duas
passadas, C e 26 colunas). A suíte é igual à local. No `gates-nativos` (run `37911553937`): a declaração `g1a:
packages/core/src/quebra.ts` lida do corpo, `G1a: DIFF VAZIO ✓`, `G1b: só adição ✓`, `G2 antes=121 depois=121 ✓`,
`G3 antes=70 depois=70 … nenhuma linha sumiu ✓`, e `== docs/native/DESIGN-QL` · `telas.html: OK`.

## 7. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# QL-PR2: a quebra no core — a lógica de quebra.ts (o teste novo, quebra.test.ts, fica sob o G1b: só adição).
g1a: packages/core/src/quebra.ts
```

```gates-web
# QL-PR2: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado; o core (packages/core/src/quebra.ts) não é importado pelo web.
```

## 8. Os checks da PR

Sobre o head **`5d517d1`** (o último commit de código), **todos verdes**, antes deste commit de docs `[medido: gh pr checks 374;
gh run view <id> --json jobs]` (nível **job**; `n=1` — não é referência):

| check | workflow · run | estado | duração (job) |
|---|---|---|---|
| `build` (lint, type-check, `pnpm test:unit` com os gates, cobertura, `pnpm build`) | `ci.yml` · `37911553934` | pass | 4m13s (09:29:04 → 09:33:17 UTC) |
| `gates-nativos` (G1a/G1b, G2/G3, `shasum -c`) | `gates.yml` · `37911553937` | pass | 11s |
| `g-back` · `g-palco` · `g-tok` · `g-faixa` | `gates-web.yml` · `37911553919` | pass | 32s · 17s · 34s · 17s |
| `Vercel` · `Vercel Preview Comments` | — | pass | — |

**O `native.yml` não rodou** (nem o `mudou-nativo`): a PR não toca nada do `paths` dele (§6) — sem APK, sem linha nova na
série do `CI-FAIXA.md`.

## 9. Divergências — 1206 a 1209

A última usada era a **1205** (`QL-PR1-anexos/README.md` §6) `[medido: git grep -nE '^\| \*\*(1[12][0-9]{2})\*\*' -- docs
→ máximo 1205; nenhum número ≥ 1206 em prosa como divergência]`.

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1206** | P | *"use a heurística que o pre-check declarou … (a consulta 2, com o critério 'maioria')"*: no pre-check a "maioria" classifica a **quase acorde** (`q2-cifra-pares.sql:15-16`), que a R4/QL-D23 deixam fora do par; como reconhecedor, ela faria a quase acorde formar par | o reconhecedor é a linha de acordes do pre-check (todo token acorde ou separador), a que o gate espera — sem divergência pre-check × gate, sem parada; o CN-M prova que a outra leitura reprova `i:quase-acorde-14` (§2, §4) |
| **1207** | D | o cabeçalho do `quebra.ts` da PR-1 dizia *"o gate estrutural está em `quebra.test.ts`"*; ele está em `tests/gates/ql-quebra.test.ts` (o `quebra.test.ts` só passou a existir nesta PR, com outra coisa dentro) | o cabeçalho corrigido no `5d517d1` (o ponteiro certo) |
| **1208** | T | o `cn-instrumentos.sh` da PR-1 usa `origin/main` como base padrão do CN-6 (*"o G-N3 de antes"*); depois do merge da #373 a `origin/main` já tem o G-N3 novo, e o CN-6 sai `✗` — e o `g-n3.mjs` copiado para fora da árvore nem acha o `texto-logico.mjs` | rodado com a base explícita `d0d0639` (a de antes do QL): `todos os controles como esperado ✓`. O script fica como está (é anexo da PR-1); a base se passa na chamada |
| **1209** | D | o `q2-cifra-pares.sql` faz `btrim` (só espaço) e corta em `[ \t]+`: numa linha colada com CRLF o último token leva o `\r` (`F\r`) e não é acorde — a linha não seria de acordes. O dado tem **0** `\r` (§10.3), então nenhum número da Fase B muda | a função tira o `\r` do fim antes de cortar os tokens (QL-D24: o `\r` do fim é medida zero, não conteúdo) — **provisório, Q4** |

**Contagem** `[medido: a coluna]`: **4 — P 1 · D 2 · T 1** (P: 1206 · D: 1207, 1209 · T: 1208). **A próxima livre é a
1210.**

## 10. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** |
| aparelhos | **nenhum** — nem o AVD, nem o Tab S6 |
| agentes | **0** |
| código de produto | `packages/core/src/quebra.ts` (a lógica; o export novo `ehLinhaDeAcordes`). **Nenhuma tela** |
| testes | `packages/core/src/quebra.test.ts` (novo, 46); `tests/gates/ql-quebra.test.ts` (a lista vazia fixa); `ql-quebra-reprovados.txt` (vazio) |
| os CN | trocaram `quebra.ts` e a lista por um instante e os devolveram com `git checkout` (`git status` no fim de cada anexo); os dumps fabricados num diretório descartável, apagado |
| temporários | no scratchpad da sessão: o rascunho da função, as saídas brutas; nada fora do repositório entrou |
| YAML | nenhum |
| APK | não roda (§6) |

---

**A próxima PR desta lista** (QL-D19): **PR-3 — o leitor no palco e em V**: o `Leitor.tsx` desenha `quebrar(...)`; as
duas medidas no app; `O_LEITOR_QUEBRA = true` no G-par de V; a medida do caractere no Tab (QL-D40); a errata em par dos 6
dumps de Letra da B3; a âncora; **e a guarda da Q1** (o leitor não chama a função com a largura ainda não medida), seja
qual for a resposta. O custo no Hermes se mede ali.
