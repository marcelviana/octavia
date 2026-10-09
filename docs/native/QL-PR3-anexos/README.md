# QL-PR3-anexos — o leitor no palco e em V

**PR [#375](https://github.com/marcelviana/octavia/pull/375)**, branch `ql/pr3-leitor`, árvore `../octavia-ql-pr3` sobre
`origin/main` = **`ffd8f31`** (`ffd8f31904f8d0961effe1c9478e92f3fb396574`, o merge da #374, a PR-2 do QL)
`[medido: git rev-parse origin/main]`. `pnpm install --frozen-lockfile --offline`. A árvore `../octavia-ql-pr2` foi removida
antes, com `git status --short` vazio e **sem `--force`**. Fonte do bloco: [`QL-REQUISITOS.md`](../QL-REQUISITOS.md) (esta é a
**PR-3** da QL-D19, aceites A-QL-8…A-QL-16), [`DESIGN-QL/`](../DESIGN-QL/README.md), [`QL-PR1-anexos/`](../QL-PR1-anexos/README.md) e
[`QL-PR2-anexos/`](../QL-PR2-anexos/README.md). Molde: [`N4-PR8-anexos/`](../N4-PR8-anexos/README.md).

- **Commits**, na ordem do rito (os testes que reprovam, a implementação, a errata em par, os docs depois do CI verde), e
  **quatro a mais, declarados**, dos achados do aparelho — cada um com o teste reprovando antes do conserto:
  `f13688e` `test(ql): … reprovando` (a proteção, o corpo quebrado, a exceção da QL-D45, a âncora) ·
  `12e721c` `feat(ql): o leitor desenha as linhas visuais, no palco e em V` ·
  `4a0bf8a` `test(ql): a âncora não deriva (o achado do aparelho), reprovando` · `c395f67` `fix(ql): o topo da âncora é a
  linha na marca de 32` · `4d8e322` `fix(ql): o corpo da exceção da QL-D45 com os grupos dentro dele no dump` ·
  `93c4ba4` `test(ql): a errata em par da B3: o par do corpo quebrado e a referência lógica à parte` · `a62407e` `test(ql): a
  base do G-inv em par: os 6 dumps de Letra da B3` · `d4f92cf` `test(ql): a âncora se reaplica até a rolagem chegar (o
  achado do Tab), reprovando` · `0e83c2e` `fix(ql): a âncora se reaplica até a rolagem chegar ao alvo` · o de docs.
- **Nenhuma linha de log nova** (G3 70 = 70), **nenhum `testID` novo** (G2 121 = 121), **nenhum token, frase ou ícone** novo;
  o site não muda. As notas da música e a divisa ficam para a PR-4.
- **Texto**: só o inventado pelo projeto — a fixture do QL (`instrumentos/fixture-ql.py`: a Letra e a Cifra do `custo.ts` da
  PR-2, uma Letra longa e a Cifra do acorde longo), a fixture do pre-check do N3 e a do G-par. Nenhum texto de música de
  terceiro, nenhum dado da conta do Marcel (regra 10): no Tab, o cache dele saiu do aparelho antes da primeira abertura e
  voltou md5 a md5 no fim (§7).
- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado; `[hipótese]` = o resto.

| arquivo / pasta | o quê |
|---|---|
| [`commit1-reprovando.txt`](commit1-reprovando.txt) · [`ancora-sem-deriva-reprovando.txt`](ancora-sem-deriva-reprovando.txt) · [`ancora-reaplica-reprovando.txt`](ancora-reaplica-reprovando.txt) | os testes reprovando, antes de cada código |
| [`medidas/`](medidas/) | a régua no Tab (`regua-tab/`), o custo no Hermes, a âncora medida nos dois aparelhos (`ancora-*.txt`, `eventos-ancora*/`), o A-QL-16 (`a-ql-16-*.txt`), o bundle servido antes de cada rodada |
| [`gates/`](gates/) | G-inv, `g-inv-par`, G-N3, os CN, os gates nativos e os do site, a suíte |
| [`b3-pre-ql/`](b3-pre-ql/) | a referência lógica à parte do G-N3: os 6 dumps de Letra da B3 como eram antes do QL, com `SHA256SUMS.txt` |
| [`dumps/`](dumps/) | `g-inv-pai/` (52) e `g-inv-ret/` (42), a base do G-inv nos dois aparelhos; `ql/` (100), os estados do QL, `QL3Q-` a PR e `QL3M-` a `main` — cada pasta com `SHA256SUMS.txt` |
| [`capturas/ql/`](capturas/ql/) | as 100 capturas dos estados do QL (antes `QL3M-`, depois `QL3Q-`; AVD e Tab; C e B), `SHA256SUMS.txt` |
| [`estado/`](estado/) · [`quedas/`](quedas/) · [`logcat/`](logcat/) · [`roteiros/`](roteiros/) | o estado dos aparelhos antes e depois, a receita do cache, as quedas, as linhas `OCTAVIA:`/`libc`/`DEBUG`/`AndroidRuntime` de cada rodada, a saída dos arneses |
| [`instrumentos/`](instrumentos/) | `fixture-ql.py`, `ql.py` (o arnês dos estados do QL), `ancora.ts`, `custo-hermes.mjs`, os três CN novos; `arnes/` (a cópia do roteiro do pre-check: o `roteiro.diff`, a cadeia, o `mostrar.py` dos julgamentos) |

---

## 1. A decisão que entra com esta PR — QL-D48

**QL-D48** `[Marcel, 2026-10-09]`: **a QL-D45 (o acorde nunca parte) vale só na Cifra.** Na Letra, uma linha com acordes
digitados quebra como letra (QL-D22), e um acorde maior que a coluna parte como qualquer palavra longa, pela R1. É o
comportamento que a PR-2 já implementou e fixou em teste (`quebra.test.ts`, *"QL-D45 — na Letra a linha de acordes quebra
como letra"*). Registrada no `QL-REQUISITOS.md`, QL-R4 e QL-R7.

## 2. O leitor — o que a PR faz

`apps/native/src/screens/Leitor.tsx` (o leitor compartilhado, N4-PR8) liga o `quebrar` do core ao corpo; o palco
(`StageScreen.tsx`) e V (`VisualizacaoScreen.tsx`) ligam as medidas. O core exporta `colunasDesenhadas` (a medida do QL-D24
de uma linha visual), para o leitor achar a linha que passa da coluna.

- **As duas medidas** (QL-R2): a largura do **contêiner do corpo** — o `ScrollView` vertical do palco, o de V em C, o
  `view-leitor` de V em B, todos com o respiro de 32 por dentro — menos 2 × 32; e a de **um caractere da mono no zoom**, por
  um `Text` de 100 caracteres **fora da tela** (`top: -10000`, `importantForAccessibility="no-hide-descendants"`), medido uma
  vez por zoom — o palco mede os cinco na montagem (o passo de zoom já o encontra), V só o padrão — e tirado da árvore assim
  que medido. Colunas = ⌊coluna ÷ caractere⌋ (`colunasDoLeitor`).
- **A proteção (QL-D43)**: `quebrar` só com as duas medidas e as colunas no domínio do contrato (inteiro > 2); senão, e na
  Tab (R4), o corpo de hoje. Teste: o palco e V com a largura não medida, medida em 0, só com o respiro, e com 2 e 0 colunas
  — não caem e mostram o corpo de hoje (`leitor-quebra.test.tsx`, 10 casos), e a conta pura em 13 asserções.
- **Os nós — a escolha declarada: UM NÓ SÓ.** O mesmo `Text` com `testID="corpo"` dentro da mesma rolagem horizontal de
  hoje, com as linhas visuais juntadas pelo `\n`. Sem linha que passe da coluna, a rolagem horizontal não tem para onde ir
  (a Letra e a Cifra deixam de rolar para o lado) e a árvore é a de hoje nó a nó; **sem continuação nenhuma, o texto do nó é o
  próprio corpo, byte a byte** — por isso o palco deitado no zoom 22 não muda para nenhuma música de até 80 colunas (A-QL-16,
  §4.3). Os três instrumentos leem todo `TextView` sob o id `corpo` como um bloco partido no `\n` (QL-D16): o G-par de V, o
  (e) do G-N3 e o `corpo-logico.mjs` — provados no §5.
- **A exceção da QL-D45** — a única vez em que o corpo vira mais de um nó: a linha da Cifra com um acorde maior que a coluna
  passa dela e rola para o lado **só ela**; no par, o pedaço de acordes e o de letra logo abaixo rolam **juntos** (o acorde
  continua sobre a sílaba). O id `corpo` vai para um contêiner com os grupos (o texto que cabe em `Text`, o que passa em
  `ScrollView horizontal > Text`), com `collapsable={false}` — sem ele o `uiautomator dump` mostra o `corpo` como folha e os
  grupos como irmãos dele (o achado do §4.4).
- **O desenho**: o recuo de 2 sem glifo é texto da linha visual (`quebrar`, QL-D29); a entrelinha é a de hoje (1,55 na Letra
  e na Cifra; o `estiloDoLeitor` não mudou); nos dois temas do palco só as tintas trocam (o estilo é o mesmo objeto, a cor
  do tema). As capturas: §4.
- **A âncora** (QL-D18, QL-D37), no palco: quando o desenho do mesmo corpo muda — o giro (C ↔ B) e o zoom mudam as colunas e
  a entrelinha —, a linha lógica **na marca de 32** (a linha visual ⌊y ÷ entrelinha⌋) volta à marca: o começo dela a 32 da
  barra (na Cifra, o par a partir da linha de acordes). O pedido `{ y, lógica }` fica de pé até a rolagem vista chegar ao
  alvo: reaplicado a cada 100 ms (até 15 vezes) e quando o conteúdo novo assenta; uma segunda mudança com ele de pé ancora na
  mesma lógica; o dedo na rolagem o encerra. A rolagem automática segue do ponto ancorado (`y`). A troca de música volta ao
  topo, como sempre. **V não ancora** (div. 1225).
- **O palco com setlist e o avulso** usam o mesmo `CorpoDoLeitor` (o avulso é o mesmo `StageScreen`); V usa o mesmo leitor, sem
  zoom.

## 3. Os testes — `apps/native/test/leitor-quebra.test.tsx` (30), `packages/core/src/quebra.test.ts` (+2), o G-par de V

| grupo | o que prova | contra a `main` |
|---|---|---|
| a proteção (QL-D43) | `colunasDoLeitor` (13 asserções), `linhasDoLeitor`; o palco e V com 5 estados de medida cada | a conta: reprova (não existe); as telas: passam (a `main` nunca quebra) |
| o corpo quebrado (QL-R10) | B 48 colunas (toda linha cabe, `ehQuebraDe`, um nó só); C 80 com a Letra de 77 igual, no mesmo nó; a Tab intacta em 26; a Cifra em 26; o zoom refaz as colunas (48 → 26); V em C 55 e B 48 | reprovam os que esperam quebra |
| a exceção da QL-D45 | a linha de acordes sozinha rola só ela; no par, os dois pedaços juntos; na Letra nada rola | reprovam |
| a âncora | `logicaNoTopo` na marca de 32, `yDaLogica`, `inicioDoBloco`, o giro nas contas, a idempotência (80/48/41/26 col × 4 zooms, a rolagem arredondada ao px); o palco num passo de zoom; a reaplicação até a rolagem chegar; duas mudanças seguidas na mesma lógica; a troca de música sem âncora | reprovam (`commit1-reprovando.txt`; a deriva e a reaplicação nos dois `ancora-*-reprovando.txt`) |
| G-par de V | `O_LEITOR_QUEBRA = true`: em 26 colunas o leitor tem de mostrar continuação onde a linha passa da coluna | reprova: *"o leitor não viu as colunas do duplo"* |
| `colunasDesenhadas` (core) | a medida do QL-D24 por linha visual; toda linha de `quebrar` cabe por ela, salvo a do acorde maior que a coluna | reprova (não existe) |

**O duplo** (`fake-react-native.tsx`, regra 32): `__larguraCrua(w)` (o contêiner medido em 0), o registro do `scrollTo`
(`__rolagens`), `__rolar(y)` (o dedo: `onScrollBeginDrag` e `onScroll`) e `__rolagemChega(y)` (a rolagem cumprida, sem dedo).
O `native-tela` prova árvore e ligação; **não prova** o giro (o `onLayout` do duplo sai uma vez) nem geometria — isso é o §4.

## 4. No aparelho, com o mock

### 4.1 O aparato e a decisão sobre o avião (div. 1212)

O prompt pedia os dois aparelhos *"com o mock, em avião"*; em avião o app se vê sem rede e não lê o mock
(`sync skip reason=offline`). **Decisão do Marcel** `[2026-10-09]`, verbatim: *"Como o APARATO (opção 1). O "em avião" do
prompt foi premissa errada do revisor — registre como divergência P. Condição: zero requisição a octavia.rocks em toda a
sessão, conferida no bundle antes de qualquer abertura e contada no log de cada rodada com rádio ligado; avião no repouso e
nos estados sem rede, provado pelo ping."* Cumprida: o bundle servido conferido antes de cada rodada
(`medidas/bundle-servido*.txt`: `localhost:8788` 1 · `octavia.rocks` 0, nas cinco conferências) e o logcat de cada rodada
(`logcat/`): **0 `octavia.rocks`**; as linhas `api` todas `path=/api/…` ao mock (AVD 33 + 90, Tab 100).

- **AVD `octavia_tab32`**: subido do `default_boot` com `-no-snapshot-save`, duas vezes (o S0 do fim da cadeia derruba a
  sessão); o rádio ligado só nas rodadas (div. 418), o avião no repouso (`ping` → *Network is unreachable*).
- **Tab S6**: o caminho do APARATO (N4-D55, N4-D102), **de acordo do Marcel** `[2026-10-09]`, verbatim: *"De acordo, com o
  caminho do APARATO (N4-D55, N4-D102). No fim, prove no anexo: o md5 de cada arquivo do cache regravado igual ao guardado, o
  release cf58f7f instalado (versão lida do aparelho), o stay_on de volta ao valor lido no início, e zero requisição a
  octavia.rocks durante toda a rodada no Tab."* As quatro provas: §7.
- **Metro** sem `CI=1`, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; o `apps/native/.env` por `cp -p`
  do checkout principal **sem abrir** (sha256 `f2bfa179cd8e`, igual ao original — `estado/env-sha.txt`), apagado no fim nas
  duas árvores. **Um mock por aparelho** (AVD 8788, Tab 8789), o servidor de arquivos na 8790. O "antes" numa árvore
  temporária da `main` (`../octavia-ql-pr3-main`, `ffd8f31`), removida no fim sem `--force`.
- **O arnês**: a cópia do `roteiro.py` do pre-check do N3 com a errata de caminho da N4-PR4/PR6/PR7 (`ARVORE`, `PORTA`, o
  `ir_s1` que refaz o deep link, a S4 pelo avulso — div. 1219), o `passada4-final.py`, a `rolada.py` e o `n3pr6.py`
  (`instrumentos/arnes/`); os estados do QL pelo `instrumentos/ql.py` com a fixture `fixture-ql.py`.

### 4.2 A medida do caractere no Tab (QL-D40, A-QL-6) `[medido: medidas/regua-tab/]`

A régua do leitor em cada zoom (`QL-PR1-anexos/instrumentos/regua-zoom.py`), no Tab, **antes de qualquer outra medida**:

| zoom | 100 caracteres — Tab | 100 caracteres — AVD (QL-PR1) | caractere | régua × dump (10 caracteres) | **C** | **B** |
|---|---|---|---|---|---|---|
| 18 | 1093,3 dp | 1093,3 | 10,93 | 109,3 = 109,3 | 98 | 59 |
| 22 | 1333,3 | 1333,3 | 13,33 | 133,3 = 133,3 | 80 | 48 |
| 26 | 1573,3 | 1573,3 | 15,73 | 157,3 = 157,3 | 68 | 41 |
| 32 | 1920,0 | 1920,0 | 19,20 | 192,0 = 192,0 | 55 | 33 |
| 40 | 2400,0 | 2400,0 | 24,00 | 240,0 = 240,0 | 44 | 26 |

**Iguais nos cinco zooms** (o token `leitor`, de controle, 1333,3 nos dois): **o A-QL-6 fecha no Tab**, e nenhuma tela depende
de número escrito — o app mede o caractere em tempo de execução (§2). O de 100 a partir do 22 passa da janela e o dump o
recorta em 1137,8 (o limite do instrumento, como na PR-1).

### 4.3 O palco deitado no zoom 22 não muda (A-QL-16) `[medido: medidas/a-ql-16-*.txt]`

A Letra da fixture (*Lanterna da fixture*, 50 linhas, **a maior com 77 colunas**, p95 46 — a forma do dado real) e a Cifra
(20 pares, a maior com 50), no palco em C no zoom 22, **capturadas com a `main` e com a PR** e comparadas pelo `g-inv.sh`:

| | AVD | Tab |
|---|---|---|
| G-inv `main` × PR (`S3-letra-z22`, `S3-cifra-z22`) | **2 de 2 idênticos** (65 nós) | **2 de 2 idênticos** (66 nós) |
| o nó `corpo` da Letra (texto e caixa) | **byte a byte igual** ao da `main` | **byte a byte igual** |

### 4.4 Os estados do QL, antes e depois `[medido: roteiros/, dumps/ql/, capturas/ql/]`

Cada captura passou pelo `corpo-logico.mjs` contra o texto da fixture (fora do repositório; só números na saída). **Todas
✓** — o desenho é o próprio texto ou uma quebra dele, com o `sha12` da referência:

| estado | `main` (AVD e Tab) | PR — AVD | PR — Tab |
|---|---|---|---|
| Letra, C, zoom 22 | 0 continuações | 0 | 0 |
| Letra, C, zoom 40 (44 col) | 0 | **6** | **6** |
| Letra, B, zoom 22 (48 col) | 0 | **2** | **2** |
| Letra, B, zoom 40 (26 col) | 0 | **36** | **36** |
| Cifra, C 22 · B 22 · B 40 | 0 · 0 · 0 | 0 · **1** · **31** | 0 · **1** · **31** |
| Letra em B, tema claro | 0 | 2 | 2 |
| Cifra do acorde longo, B, zoom 40 | 0 | **7**, 2 rolagens horizontais roláveis | **7**, 2 |
| Tab, B, zoom 40 | 0 | **0** (o texto inteiro, rolando) | 0 |
| V da Letra, C (55) · B (48) | 0 · 0 | **2** · **2** | **2** · **2** |

**A exceção da QL-D45, no aparelho**: na Cifra do acorde longo em B no zoom 40 (26 colunas), o `Ebmaj7(9)(11)(13)add9sus4/Bb`
(28 colunas) sozinho na linha e o par que o contém viram **duas** rolagens horizontais, e o resto do corpo fica em texto que
não rola. O arrasto **no meio da tela** sobre a linha do acorde a desloca sozinha (o `E` sai pela esquerda; as outras linhas
ficam) — `capturas/ql/QL3Q-S3-acorde-z40-rolado-*.png`. O primeiro arrasto começou dentro da borda de 15 % do palco, que pega
o toque, e não rolou nada (div. 1218).

**O achado do dump (`4d8e322`)**: na primeira corrida, o `corpo` da exceção saiu como `ViewGroup` **folha** e os grupos como
irmãos dele; o `corpo-logico.mjs` não achou `TextView` sob o id (exit 2). Com `collapsable={false}` no contêiner, os grupos
ficam dentro dele no dump — `corpo-logico` ✓, 7 continuações (div. 1216).

### 4.5 A âncora (A-QL-12, QL-R13) `[medido: medidas/ancora-*.txt, medidas/eventos-ancora/]`

**O instrumento**: o `uiautomator events` durante cada mudança (os eventos de acessibilidade da rolagem trazem o `ScrollY`
em px), um arquivo por passo, e o `instrumentos/ancora.ts`, que confere a rolagem **medida** contra a **prevista** pela conta
da âncora sobre a Letra longa (107 linhas lógicas), a partir da rolagem medida no passo anterior. O roteiro: a Letra longa em
B, rolada até o meio com arrastos; o giro para C; um passo de zoom (22 → 26); o giro de volta a B; e a rolagem automática.
Os eventos só rodam durante cada mudança: com eles de pé o `uiautomator dump` lê o arquivo velho (div. 1214).

| passo | AVD (`4d8e322`) | Tab, 1ª corrida (`4d8e322`) | Tab (`0e83c2e`, o código final) |
|---|---|---|---|
| antes (B, 48 col, zoom 22) | ScrollY 6820 px · a lógica 61 na marca | 8415 px · a lógica 76 | 8395 px · a lógica 76 |
| giro → C (80 col) | 4604 px = previsto 4603,5 · **o começo da 61** ✓ | 5754 = 5754,4 · 76 ✓ | 5754 = 5754,4 · **76** ✓ |
| zoom → 26 (68 col) | 6257 = 6256,6 · **61** ✓ | **7341 ≠ 7798,1** ✗ | 7798 = 7798,1 · **76** ✓ |
| giro → B (41 col) | 8705 = 8704,8 · **61** ✓ | 9389 ≠ 10155,6 ✗ | 10972 = 10971,7 · **76** ✓ |
| a rolagem automática | parte de 8707 (o ancorado: 8705) e só desce ✓ | parte de 10171, não do ancorado ✗ | parte de 10987 (o ancorado: 10972) e só desce ✓ |

**Os dois defeitos que o instrumento achou, e o rito de cada um:**

1. **A deriva** (div. 1215, `4a0bf8a` → `c395f67`): na primeira medida do AVD a rolagem caía exatamente onde a conta mandava,
   mas a cada passo **uma linha lógica antes** (61 → 60 → 59 → 58): o topo era a primeira linha com algum pixel à vista, e
   depois de ancorar a linha de cima aparece no respiro de 32 (como a folha desenha, `DESIGN-QL-anexos/capturas/
   QL-C-S3-ancora-giro-depois-escuro.png`). O topo passou a ser a linha na marca de 32, a mesma referência do `yDaLogica`;
   o teste da idempotência reprovou antes e passa depois.
2. **O corte pelo conteúdo velho** (div. 1217, `d4f92cf` → `0e83c2e`): no Tab o passo de zoom deixou a rolagem em 7341 px, o
   **máximo do conteúdo velho** (o evento: `ScrollY 7341 · MaxScrollY 7341`, e o do conteúdo novo, `MaxScrollY 10295`, com a
   rolagem parada): o `scrollTo` caiu antes do conteúdo novo assentar e o reaplicar pelo `onContentSizeChange`, com prazo de
   1 s, não pegou no aparelho mais lento. O pedido passou a se reaplicar até a rolagem vista chegar ao alvo; o teste reprovou
   antes e passa depois; **no Tab, com o código final, os três passos e a rolagem automática batem**.

**O AVD não foi refeito com `0e83c2e`** (o Tab é o aparelho mais lento e o que reprovou; o conserto só acrescenta reaplicações
do mesmo pedido): declarado na div. 1226.

### 4.6 Os julgamentos do Marcel, no Tab, com o mock — verbatim

Os textos são os da fixture do QL (inventados, na forma do dado real). Cada pergunta pedia *sim ou não, e a razão*; a razão
não veio escrita em nenhuma, e fica assim.

| aceite | o estado | a resposta |
|---|---|---|
| **A-QL-13** | em pé, zoom padrão (22, 48 colunas), a Letra da fixture no palco | **"Sim"** |
| **A-QL-14** | deitado, zoom 40 (44 colunas), a mesma Letra | **"Sim"** |
| **A-QL-12** | a Letra longa em pé, rotação automática ligada: rolar até o meio, girar (deitado e de volta), um passo de zoom — *"você se acha?"* | **"Sim"** |
| **A-QL-15** | V da Letra, deitado (55 colunas; as linhas de 77 e 72 quebram) | **"Sim"** |

O julgamento com **as músicas do Marcel** (as 11 Letras que quebram em V em C) fica para o encerramento, com o release
(QL-D9, QL-D27).

## 5. Os três instrumentos leem o corpo pelo texto lógico (QL-D16, A-QL-5, A-QL-9)

| instrumento | no aparelho | o controle |
|---|---|---|
| **G-par de V** | `ql.py gpar`: o nó `corpo` de V contra o retrato do site, pelo `corpo-logico.mjs`: **10 de 10 iguais** em C e em B, nos dois aparelhos (`roteiros/pr-*.txt`). As linhas do G-par cabem em 48 — no aparelho V não chega a quebrá-las (0 continuações); a quebra se vê no duplo em 26 colunas (6 linhas acima da coluna, 6 continuações) | `instrumentos/cn-g-par-v-pr3.sh` → `gates/cn-g-par-v-pr3.txt`: o leitor da PR passa; **o leitor que ignora as colunas, a letra trocada e a Tab quebrada reprovam**, cada um pela razão certa. O CN da PR-1 (`cn-g-par-v.sh`) plantava no `CorpoDoLeitor` de antes e não acha mais o alvo (div. 1224, `gates/cn-g-par-v.txt`) |
| **(e) do G-N3** | 42 pares de retrato (AVD + Tab, com os rolados) contra a B5 e a B3: **(e)=0 · (b)=0 · nome-acessível 8 · rolagem 6 · quebra 10** — contra a base da `main` e contra a base depois da errata, com o `--logico` (`gates/g-n3-ambos-*.txt`) | `instrumentos/cn-g-n3-logico.sh` (§6.2) |
| **`corpo-logico.mjs`** | toda captura do QL (§4.4), nos dois aparelhos | os CN da PR-1, rodados na árvore da `main` (div. 1224): `gates/cn-instrumentos-pr1-arvore-main.txt`, `cn-instrumentos-real-pr2-arvore-main.txt` — *"todos os controles como esperado ✓"* |

## 6. A errata em par da B3 (QL-R11, regra 33)

### 6.1 O G-inv antes da errata, e o `g-inv-par` `[medido: gates/g-inv-ambos-*.txt, gates/g-inv-par-b3.txt]`

Os dumps desta PR (a cadeia da base nos dois aparelhos: o palco, S1 a S4, a folha, o diálogo, o S0 no AVD) contra a base:

| | AVD + Tab |
|---|---|
| G-inv `B5-baseline/` | **34 de 34** |
| G-inv `B3-referencia-paisagem/`, antes da errata | **12 de 18** — diferem **exatamente** os 6 de Letra (`S3a-letra-1a`, `titulo-longo`, `ultima` × AVD e Tab): o nó `corpo` e o conteúdo da rolagem horizontal que o abraça encolhem de `[72,270][2488,…]` para `[72,270][2322,…]` px (a linha de 110 colunas vira 75 + continuação; 72 + 75 × 30 = 2322) |
| `g-inv-par` (o par do corpo quebrado) | **6 de 6** — fora do corpo (e de 2 ancestrais que o abraçam) byte a byte iguais; o corpo é uma quebra do texto (49 lógicas, 1 continuação); a caixa só encolhe à direita |

**O segundo tipo de par** (`g-inv-par.mjs`, `PARES_CORPO`): com o `text` e o `bounds` do `corpo` podados — e o `bounds` dos
ancestrais que o abraçam (a mesma caixa dele), o mesmo número dos dois lados, cada um ou com a caixa da base ou abraçando o
corpo novo —, os XML são byte a byte iguais; o texto novo é uma quebra do velho (`ehQuebraDe`); a caixa: o mesmo canto, a
mesma altura, a direita igual ou menor. **CN** (`instrumentos/cn-g-inv-par-corpo.sh`, regra 4): o CP passa; **outro nó que
muda (1 px), uma letra trocada, duas linhas fora de ordem, o canto que anda, a janela da rolagem que muda e o corpo largo de
novo** reprovam, cada um pela razão certa.

**A base** (`a62407e`): os 6 XML passam a ser os dumps novos; o `SHA256SUMS.txt` do pre-check muda nas 6 linhas (355 OK); os
PNG ficam. **Base velha × nova pelo `g-inv-par`: 6 de 6. G-inv com a base nova: B3 18 de 18, B5 34 de 34.**

### 6.2 A referência lógica do G-N3 — a decisão do Marcel (div. 1213)

Com a paisagem dos 6 de Letra quebrada, o G-N3 da `main` perde a referência lógica desses pares e reprova (`(e)=3` no AVD,
`gates/g-n3-avd-b3-errata-g-n3-da-main.txt`). A primeira proposta — tirar a referência da própria paisagem, juntando as
continuações — foi **recusada** pelo Marcel `[2026-10-09]`, verbatim: *"Não pela forma proposta: com a referência tirada da
própria paisagem quebrada, um defeito que perca a mesma palavra em C e em B passa (a paisagem e a faixa viram quebras válidas
do mesmo candidato errado). Siga a opção 2: a referência lógica do G-N3 (e do texto-logico.mjs) são os dumps pré-QL desses 6
pares, guardados à parte com sha e com o caminho no README; paisagem e faixa, juntadas pelas continuações, têm de bater byte a
byte com essa referência. Controles negativos obrigatórios, no commit da errata em par: (1) palavra perdida igual em C e em B
→ reprova; (2) letra trocada só na faixa → reprova; (3) linha que deveria quebrar e não quebrou → reprova; (4) a quebra válida
→ passa. A extensão do g-inv-par com os 6 CN fica aceita. Registre como extra da mesma classe e a escolha como divergência."*
(A saída da forma recusada fica como registro: `gates/g-n3-avd-b3-errata-forma-recusada.txt`.)

**Feito** (`93c4ba4`): **a referência à parte é [`b3-pre-ql/`](b3-pre-ql/)** — os 6 dumps de Letra da B3 como estavam na
`main` `ffd8f31`, com `SHA256SUMS.txt` (os mesmos sha256 que o `SHA256SUMS.txt` do pre-check registrava antes da errata:
`f8e18747…` · `f1ff4f99…` · `7d807b07…` · `7ef79457…` · `d0efa7d9…` · `f8190fa1…`). O G-N3 ganha `--logico <dir>`: para o
par cuja chave está ali, a paisagem **e** a faixa têm de ser quebras do corpo pré-QL (`ehQuebraDe` — juntadas pelas
continuações, o texto bate byte a byte), e nenhuma das duas pode ter uma linha que passa da coluna (o `TextView` do corpo
cortado na borda direita da rolagem horizontal; o `scrollable` dela não serve: o Android o marca `true` mesmo com o texto
cabendo — medido). **O uso daqui em diante**: `node apps/native/scripts/g-n3.mjs --pai …/B5-baseline --pai
…/B3-referencia-paisagem --logico docs/native/QL-PR3-anexos/b3-pre-ql --faixa <dir> [--rolada <dir>]` (o `APARATO.md`).

**Os controles** (`instrumentos/cn-g-n3-logico.sh` → `gates/cn-g-n3-logico.txt`, sobre a S3a-letra-1a do AVD):

| CN | o defeito | resultado |
|---|---|---|
| CP | a quebra válida (C e B como o app os desenha) | **passa** — `(e)=0 · quebra=1` |
| 1 | a mesma palavra perdida em C e em B | **reprova** — *a paisagem não é uma quebra do corpo pré-QL* |
| 2 | uma letra trocada só na faixa | **reprova** — *a faixa não é uma quebra do corpo pré-QL* |
| 3a | a linha que deveria quebrar e não quebrou, na paisagem (a de 110 inteira) | **reprova** — *na paisagem uma linha passa da coluna* |
| 3b | a mesma, na faixa (o corpo até a borda da rolagem) | **reprova** — *na faixa uma linha passa da coluna* |
| 5 | a quebra válida **sem** o `--logico` | **reprova** — a paisagem quebrada só passa igual à faixa (a regra da PR-1) |

**Os CN que já existiam**: `cn-n3pr3.sh` verde como estava; `cn-n3pr1.sh` e `cn-n3pr6c.sh` medem o G-N3 contra dados do pre-check
(o `B3-inventario.jsonl`, o consolidado da N3-PR6), de antes do QL — com a B3 nova eles reprovavam 12 contagens; passaram a
usar a B3 **como o pre-check a congelou** (a B3 com os 6 de `b3-pre-ql/` por cima), e os três seguem *"todos os controles
como esperado ✓"* (`gates/cn-n3pr*-base-nova.txt`; div. 1224).

## 7. O Tab, do começo ao fim — as quatro provas que o Marcel pediu `[medido: estado/]`

| | |
|---|---|
| lido (`estado/tab-antes.txt`) | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **release** de 2026-10-07 17:15:00 (sem `DEBUGGABLE`), travado |
| ida | `stay_on` a 7; `install -r` do dev client (`9447edc7…`): `DEBUGGABLE` |
| a receita do cache (N4-D102) | guardados **4 caminhos** (`setlists.json` `787e7612…`, `content.json` `b27fe166…`, `files-index.json` `b21cc49b…`, o PDF do Marcel `05253d42…`), md5 a md5; tirados por nome — a pasta da sessão só com os quatro `._*`; o app **não** aberto antes do mock de pé e do bundle conferido |
| durante | a régua, o custo no Hermes, a base do G-inv, os estados do QL, os julgamentos, o "antes"; **0 queda** (§8); **0 `octavia.rocks`** no logcat, 100 linhas `api` ao mock |
| **prova 1 — o cache** | `regravar`: os arquivos da fixture apagados por nome (`partitura-12p.pdf`, `partitura-1p.pdf`); **4 de 4 md5 iguais ao guardado** (`estado/tab-md5-depois.txt`) |
| **prova 2 — o release** | `install -r release-cf58f7f.apk`; o APK instalado, puxado do aparelho (`pm path` + `pull`): **sha256 `070187bf6a59…`, 105.194.421 B — igual ao `release-cf58f7f.apk`**; sem `DEBUGGABLE`; `lastUpdateTime=2026-10-09 12:45:36` (o `versionName` é `0.0.1` em todo build e não identifica a `main`) |
| **prova 3 — o `stay_on`** | de volta a **0**, o valor lido; e `accel=1`, `user_rot=0`, `airplane=0 wifi=1 data=1`, `reverse` vazio — **iguais ao lido** (`diff` vazio, `estado/tab-depois.txt`) |
| **prova 4 — `octavia.rocks`** | **0** no bundle servido (as três conferências do Tab) e **0** no logcat; as linhas `api` todas `path=/api/…` ao mock. O logcat do Tab guarda das 11:10 em diante (o anel de 5 MiB girou, div. 1223); o bundle é o mesmo da rodada inteira (o `localhost:8788` inline, 0 `octavia.rocks`) — o app não tinha como pedir a prod |

**AVD**: lido `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, `reverse` vazio, dev client de 2026-09-24 14:00:01, `ping`
→ *unreachable*; a receita (5 caminhos da sessão de audit) guardada e regravada md5 a md5; o fim **igual ao lido**; o
`ram.bin` intacto (2026-09-24 14:00).

## 8. As quedas (regra 36) `[medido: quedas/, logcat/]`

| rodada | aberturas do app | Java | **nativa** | tombstones |
|---|---|---|---|---|
| AVD, 1ª subida (a cadeia da base) | 19 | 0 | **0** | 0 |
| AVD, 2ª subida (S4, os estados do QL, a âncora, o "antes") | 46 | 0 | **1** | 1 |
| Tab (a sessão inteira) | ≥ 65 (o logcat das 11:10 em diante) | 0 | **0** | 0 — e o `dropbox` do Tab, que cobre a sessão inteira, só com `system_server_wtf` |

**A nativa do AVD** — a assinatura da **N4-D105** (`N4-PR9-anexos/README.md` §5): `Fatal signal 11 (SIGSEGV), code 2
(SEGV_ACCERR)` às **09:06:57,216**, thread `mqt_v_js`, topo da pilha `#01 facebook::react::MountingCoordinator::
pullTransaction(bool) const+524` · `#02 FabricUIManagerBinding::schedulerDidFinishTransaction` · … · `#05
ShadowTree::mount`; tombstone no `dropbox` às 09:06:58. **O momento**: o processo 22396 abriu às 09:06:49,7 — a abertura fria
depois do `force-stop` do `ir_s1` (o arnês reabria o app para a Letra em retrato) — e caiu **sem emitir nenhuma linha
`OCTAVIA:`**: antes da primeira tela, **antes de o leitor montar**. O arnês abriu de novo e seguiu. **Decisão do Marcel**
`[2026-10-09]`, verbatim: *"Só registrar (opção 2), com a assinatura, o momento (S1, antes do leitor montar), o tombstone e a
contagem de aberturas desta sessão no anexo, ligado à N4-D105. Condição: se em qualquer rodada desta PR sair uma queda nativa
com o palco ou V montados (o leitor na tela, ou o corpo quebrado na pilha), pare e reporte antes de seguir — aí a indicação
100 + 100 com a PR e com a main é obrigatória. A condição de zero queda segue a do release no encerramento (A-QL-21)."*
**Depois dela, nenhuma queda** em nenhuma rodada (65 aberturas no AVD, ≥ 65 no Tab, 1 nativa no total). Div. 1222.

## 9. O custo de `quebrar` no Hermes do Tab `[medido: medidas/custo-hermes-tab.txt]`

`instrumentos/custo-hermes.mjs`: o `quebrar` roda **dentro do app**, no runtime do Hermes do Tab, pelo inspetor do Metro (CDP,
`Runtime.evaluate` sobre o módulo `quebra.ts` do registro do Metro) — nenhuma linha de código do app mudou. As fixtures do
`custo.ts` da PR-2, o mesmo gerador (o `sha12` impresso: `6aa6914ce90f` · `2355a509052d`, iguais aos da PR-2). Hermes
`250829098.0.17`, bytecode 98. 100 rodadas por (texto, colunas):

```
texto  colunas  linhas visuais  mediana (ms)  máximo (ms)  1ª rodada (ms)
Letra       80              50         1.616       12.580          12.580
Letra       48              52         1.620        1.945           1.651
Letra       26              86         1.890        2.272           1.898
Letra       14             151         2.463        2.777           2.715
Cifra       80              40         1.598        3.937           3.937
Cifra       48              41         1.618        2.291           1.970
Cifra       26              71         2.059        2.707           2.603
Cifra       14             129         2.683        3.215           2.767
```

**Nenhum número passa de 16 ms** — o maior é a primeira rodada (12,6 ms, a compilação preguiçosa). A mediana é ~20× a do Node
do Mac (0,08 ms): é o **dev client** (o bundle de desenvolvimento compilado no aparelho), não o release (o bytecode
pré-compilado) — `[hipótese]` o release fica abaixo disto. `n=100` por linha, uma corrida: não é referência (div. 80). O
inspetor só aceitou a conexão por `127.0.0.1` com o cabeçalho `Origin` (div. 1221).

## 10. Os gates sobre esta PR `[medido: gates/]`

| gate | resultado |
|---|---|
| testes desta PR | `leitor-quebra.test.tsx` 30 · `quebra.test.ts` 49 · G-par de V 2 (`O_LEITOR_QUEBRA = true`) — verdes; os 37 arquivos de tela do nativo, 477 testes |
| suíte | local, antes dos 2 testes da reaplicação: `Test Files 145 passed \| 3 skipped (148)` · `Tests 1795 passed \| 59 skipped (1854)`; no CI, sobre o head: `1797 passed \| 59 skipped (1856)` (§12; a PR-2: 144 · 1765) |
| `tsc` · lint | raiz 0 · core 0 · nativo 0 · identidade 0 · *No ESLint warnings or errors* |
| G1a / G1b | com o bloco: `G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)` — as 4 exceções usadas · `G1b: só adição ✓` (a importação nova do teste do core entra numa linha à parte) |
| G2 / G3 | `testIDs antes=121 depois=121 ✓` · `log( antes=70 depois=70`, nenhuma linha sumiu ✓ |
| `gate:a20` · `gate:icones` | 0 acusações (**193** literais examinados; a `main`: 189) · 0 acusações, 0 avisos |
| congelados | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · `-N4` 2 · `-QL` 1 OK; o `SHA256SUMS.txt` do pre-check 355 OK; `b3-pre-ql` 6 OK |
| G-inv · `g-inv-par` · G-N3 | §6 |
| G-back · G-palco · G-tok (+ cobertura) · G-faixa | **PASSA** nos quatro; G-tok com as mesmas 490 strings de `.ts` da `main`; o `DESIGN-I1` 14 OK |
| CI | §12 |

## 11. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# QL-PR3 — o leitor quebra, no palco e em V (QL-R10…QL-R13; QL-D43, QL-D45, QL-D48). Nenhuma linha de log nova, nenhum testID novo.
# Tablet: o leitor compartilhado desenha as linhas visuais do quebrar (Leitor.tsx: as duas medidas, a proteção, os nós, a exceção da QL-D45, as contas da âncora); o palco liga as medidas e a âncora (StageScreen.tsx); V liga as medidas (VisualizacaoScreen.tsx).
# Core: a largura desenhada de uma linha visual, exportada (quebra.ts: colunasDesenhadas).
g1a: apps/native/src/screens/Leitor.tsx
g1a: apps/native/src/screens/StageScreen.tsx
g1a: apps/native/src/screens/VisualizacaoScreen.tsx
g1a: packages/core/src/quebra.ts
```

```gates-web
# QL-PR3: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado; o site não muda (o core quebra.ts ganha colunasDesenhadas, que o web não importa).
```

## 12. Os checks da PR

Sobre o head **`0e83c2e`** (o último commit de código), **todos verdes**, antes deste commit de docs `[medido: gh pr checks 375;
gh run view <id> --json jobs]` (nível **job**; `n=1` — não é referência):

| check | workflow · run | estado | duração (job) |
|---|---|---|---|
| `build` (lint, type-check, `pnpm test:unit` com os gates, cobertura, `pnpm build`) | `ci.yml` · `37954249789` | pass | 3m31s (15:46:44 → 15:50:15 UTC) |
| `gates-nativos` (G1a/G1b, G2/G3, `shasum -c` dos congelados) | `gates.yml` · `37954249793` | pass | 10s |
| `g-back` · `g-palco` · `g-tok` · `g-faixa` | `gates-web.yml` · `37954249787` | pass | 30s · 15s · 34s · 28s |
| `mudou-nativo` | `native.yml` · `37954250042` | pass | 10s |
| `android-debug-apk` | `native.yml` · `37954250042` | pass | **9m44s** (15:46:56 → 15:56:40 UTC) — dentro da faixa do regime 2 (`CI-FAIXA.md`: n=128, mín 8m09s, máx 14m32s, mediana 12m30s), abaixo do Q1 (11m12,2s): não é estranho |
| `Vercel` · `Vercel Preview Comments` | — | pass | — |

**A prova pelo log** (`gates/ci-log.txt`, filtrado e sem cores): no passo *"Test — a suíte"* do `build`, `leitor-quebra.test.tsx
(30 tests)` verde; o G-par de V nas duas passadas — em C *"linhas do par acima da coluna: 0"* e em 26 colunas *"o leitor
quebra: sim (PR-3) · linhas do par acima da coluna: 6 · continuações vistas em V: 6"*, *zero diferenças ✓* nas duas; o gate da
quebra *zero reprovações, lista vazia*; a suíte `Test Files 145 passed | 3 skipped (148)` · `Tests 1797 passed | 59 skipped
(1856)` (a local do §10 é de antes dos 2 testes da reaplicação: 1795). No `gates-nativos`: as **4 declarações** lidas do corpo,
`G1a: DIFF VAZIO ✓`, `G1b: só adição ✓`, `G2 121 = 121 ✓`, `G3 70 = 70 … nenhuma linha sumiu ✓`, e os cinco `telas.html: OK`.
O APK rodou porque a PR toca `apps/native/**`; a linha da série no `CI-FAIXA.md` entra no encerramento do bloco (regra 22).

## 13. Divergências — 1211 a 1226

A última usada era a **1210** (`QL-PR2-anexos/README.md` §11.5) `[medido: git grep -nE '^\| \*\*(1[12][0-9]{2})\*\*' -- docs →
máximo 1210; nenhum número ≥ 1211 em prosa como divergência]`.

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1211** | T | O `build` da PR-2 sobre o docs do aval (`e2b54dc`, run `37915222102`) falhou na 1ª tentativa no passo *Test coverage* e passou na 2ª (`gh api …/attempts/1/jobs`: `build failure Test coverage`; `attempts/2`: `build success`) — a instabilidade herdada do teste do editor sob cobertura (div. 845), classificada (b) runner com **um** rerun; ficou fora do README da PR-2 para não mexer no head antes do merge | registrado aqui, com a fonte; o encerramento do QL a lê daqui |
| **1212** | P | *"AVD e Tab S6, com o dev client e o mock, em avião (provado pelo ping)"*: em avião o app faz `sync skip reason=offline` e não lê o mock; a base do G-inv precisa do sync | decisão do Marcel: o APARATO (o rádio só nas rodadas que sincronizam), com zero `octavia.rocks` conferido no bundle e contado no log (§4.1) |
| **1213** | D | O cabeçalho do `g-n3.mjs` da PR-1: *"a paisagem é a referência lógica: a base congelada (pré-QL)"* — a errata em par desta PR torna a paisagem dos 6 de Letra quebrada, e o G-N3 da `main` reprova esses pares (`(e)=3`) | decisão do Marcel, a opção 2: a referência pré-QL à parte (`b3-pre-ql/`) e o `--logico`, com os CN obrigatórios (§6.2); a forma proposta antes (a referência tirada da paisagem) recusada |
| **1214** | T | O `uiautomator events` segura a conexão de automação do aparelho: com ele de pé, o `uiautomator dump` seguinte lê o arquivo velho — a 1ª corrida da âncora no AVD gravou *"ORIENTAÇÃO ERRADA"* (a raiz em retrato depois do giro) | o instrumento roda os eventos só durante cada mudança e para antes de cada captura (`ql.py`); `APARATO.md` |
| **1215** | A | **A âncora derivava** uma linha lógica a cada giro ou zoom (61 → 60 → 59 → 58, AVD): o topo era a primeira linha com pixel à vista, e a de cima aparece no respiro de 32 | consertado nesta PR (`4a0bf8a` → `c395f67`), provado pela idempotência e no aparelho (§4.5) |
| **1216** | A | O `corpo` da exceção da QL-D45 saía **folha** no `uiautomator dump`, com os grupos como irmãos: os instrumentos não liam o texto (exit 2) | `collapsable={false}` no contêiner (`4d8e322`); `corpo-logico` ✓ no aparelho |
| **1217** | A | **No Tab a âncora ficava cortada** pelo tamanho do conteúdo velho (7341 px, o máximo dele): o reaplicar com prazo de 1 s não pegou no aparelho mais lento | consertado nesta PR (`d4f92cf` → `0e83c2e`): o pedido se reaplica até a rolagem chegar; no Tab, os três passos batem (§4.5) |
| **1218** | T | O 1º arrasto sobre a linha do acorde começou dentro da borda de 15 % do palco (`borda-avancar`), que pega o toque: a linha não rolou | o arrasto no meio da tela (`ql.py`); `APARATO.md` |
| **1219** | T | A cópia do `roteiro.py` do pre-check sem a errata de caminho da N4-PR7 (a S4 pelo avulso): a S4 da cadeia do AVD falhou (*"sem 'campo-busca'"*) | a errata aplicada na cópia (`instrumentos/arnes/roteiro.diff`); a S4 refeita isolada |
| **1220** | T | No Tab, a passada de S1 rodou pelo caminho do AVD (o `passada4-final.py`: o aviso com o app aberto já sem rede, o S1e com 1 min de cache); a base do Tab foi tirada pelo dele (o avião com o app aberto, o S1e logo depois do sync) — 2 dumps da B5 diferiram por dado | refeitos pelo caminho do Tab (`roteiro.py S1 S1_aviso S1e`, o da cadeia da N4-PR8): B5 34 de 34 |
| **1221** | T | O inspetor do Metro (CDP) recusou o `WebSocket` sem `Origin` (401) e, por `localhost`, fechou a sessão no mesmo milissegundo (1006) | por `127.0.0.1` com o `Origin` (o pacote `ws` do `node_modules`, nenhuma dependência nova) — `custo-hermes.mjs` |
| **1222** | A | 1 queda nativa no AVD (a assinatura da N4-D105) numa abertura fria, antes de o leitor montar | registrada (§8), ligada à N4-D105, com a condição do Marcel; nenhuma outra na sessão |
| **1223** | T | O anel do logcat do Tab (5 MiB, o máximo dele) girou numa rodada longa: o logcat guardado começa às 11:10, a rodada às 10:1x | a contagem de quedas completada pelo `dropbox` do Tab (a sessão inteira: só `system_server_wtf`); o `octavia.rocks` pelo bundle (o mesmo da rodada inteira); `APARATO.md` |
| **1224** | D | Os instrumentos de anexo das PRs anteriores leem a B3 pelo caminho ou plantam no leitor de antes: o `cn-instrumentos.sh` (PR-1) e o `cn-instrumentos-real.sh` (PR-2) medem a paisagem quebrada (`gates/cn-instrumentos-pr1-base-nova.txt`, exit 1); o `cn-g-par-v.sh` (PR-1) não acha mais o `CorpoDoLeitor` de antes, e o caso *"CN-V0 a main"* mede a PR (nome é afirmação); o `cn-n3pr1.sh` e o `cn-n3pr6c.sh` (versionados) medem contra dados do pre-check | os de anexo ficam como estão e rodam na árvore da `main` (verdes); o do G-par de V tem o CN desta PR (`cn-g-par-v-pr3.sh`); os dois versionados passam a usar a B3 do pre-check (§6.2) |
| **1225** | P | *"A âncora … Ao girar (C ↔ B) e ao mudar o zoom"* (o §2 do prompt, que é do palco e de V): **V não ancora** — V não tem zoom, e em B o corpo divide a rolagem com os *Detalhes* (a conta do palco não vale ali); a QL-R13 e as molduras da âncora são do palco (`QL-*-S3-ancora-*`) | **pergunta ao Marcel** (§14) |
| **1226** | P | *"Prove … no aparelho"* nos dois aparelhos: a âncora no AVD foi medida com `4d8e322`, antes do conserto do corte (`0e83c2e`, achado no Tab); a base do G-inv e os estados do QL, com `12e721c`/`4d8e322` — os consertos depois deles não mudam árvore nem caixa fora da exceção e da âncora (`git diff 12e721c 0e83c2e -- apps/native/src`: o `collapsable` do contêiner da exceção, o `logicaNoTopo`, o pedido da âncora) | declarado; o Tab mediu a âncora com o código final |

**Contagem** `[medido: a coluna]`: **16 — P 3 · D 2 · A 4 · T 7** (P: 1212, 1225, 1226 · D: 1213, 1224 · A: 1215, 1216, 1217,
1222 · T: 1211, 1214, 1218, 1219, 1220, 1221, 1223). **A próxima livre é a 1227.**

## 14. Perguntas ao Marcel

1. **V ancora?** (div. 1225) Hoje só o palco ancora. Em V o giro também troca as colunas (55 ↔ 48); em C o leitor é uma rolagem
   própria (a conta do palco valeria), em B ele divide a rolagem com os *Detalhes* (outra conta). Proposta: V ancorar só o
   corpo em C ↔ B pela mesma regra, numa PR seguinte, ou deixar como está.
2. **O A-QL-12 e os três outros julgamentos vieram sem a razão escrita.** Se quiser registrar a razão de algum, ela entra como
   errata deste README.

## 15. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` copiado por `cp -p` e conferido por sha256 nas duas árvores, sem abrir, e apagado nas duas |
| `octavia.rocks` | **0** em cada bundle servido (cinco conferências) e **0** em cada logcat (AVD 3 rodadas, Tab 2); as linhas `api` todas ao mock |
| requisições a terceiros | as renovações de token das sessões (`auth refresh=cached`: nenhuma ida à rede); o inspetor do Metro é local |
| AVD `octavia_tab32` | começo e fim **iguais** (§7): conta de audit, avião provado pelo `ping`, sem túneis, app parado, dev client de 2026-09-24, `ram.bin` intacto; subido duas vezes com `-no-snapshot-save`; a receita do cache da sessão de audit (5 caminhos) md5 a md5 |
| Tab S6 | **começo: release cf58f7f · fim: release cf58f7f** (sha256 do APK instalado igual); `stay_on` 0 → 7 → **0**; settings e túneis iguais ao lido; o cache do Marcel fora do aparelho durante o mock e de volta md5 a md5; as cópias do Mac **apagadas**; destravado pelo Marcel para a rodada e os julgamentos |
| quedas | **1 nativa** (AVD, abertura fria, antes do leitor; N4-D105; §8) · Java 0 · Tab 0 |
| agentes | **0** |
| temporários | no scratchpad da sessão: as fixtures geradas, os bundles baixados, os logcats brutos, os eventos brutos; a árvore `../octavia-ql-pr3-main` removida |
| perguntas ao Marcel nesta sessão | o avião × mock, a ida do Tab, o destravar, o extra do G-N3, a queda nativa, os quatro julgamentos |

---

**A próxima PR desta lista** (QL-D19): **PR-4 — as notas da música no palco**, com a divisa no catálogo (41 → 42) e o estado
recolhido lembrado (QL-D30…QL-D33, QL-D39). Para ela: o G-N3 se chama com `--logico docs/native/QL-PR3-anexos/b3-pre-ql`
(o `APARATO.md`); o palco ganha um bloco acima do corpo — a âncora conta o respiro e as linhas do `Text` do corpo, e as notas
mudam a altura de cima: a conta da âncora tem de somar a altura delas (o `yDaLogica` de hoje supõe o corpo começando no
respiro).
