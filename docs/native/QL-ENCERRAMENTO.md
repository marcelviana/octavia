# QL — ENCERRAMENTO

**A fonte do bloco — e um índice, não uma segunda cópia.** Tudo o que este arquivo afirma aponta para o documento, a PR
ou o anexo onde está; onde a prosa daqui e a fonte divergirem, vale a fonte. Nenhum texto de decisão ou de errata é
reescrito aqui.

- **Bloco**: QL — **a quebra de linha** (QL-D1): a Letra e a Cifra quebram para caber na coluna, no palco e em V, nas faixas
  C e B do tablet, sem mudar o texto; a Tab nunca quebra; e as notas da música entram no palco (QL-D2, QL-D4).
- **Janela**: 2026-10-08 (o pre-check, #370, merge `94f6718` às 18:46:10Z) → 2026-10-10 (a QL-PR4, #376, merge `ea5e891` às
  11:47:58Z) e o release desta PR.
- **Esta PR**: só docs, árvore `../octavia-ql-encerramento`, branch `ql/encerramento`, sobre `origin/main` = `ea5e891`. Commit
  1 `99718cb` — **o release no Tab, os julgamentos e a primeira nota** (A-QL-13…16, A-QL-20, A-QL-21;
  [`QL-ENCERRAMENTO-anexos/README.md`](QL-ENCERRAMENTO-anexos/README.md)); commit 2 — este documento, o
  [`ideia-metronomo.md`](QL-ENCERRAMENTO-anexos/ideia-metronomo.md), o `CI-FAIXA.md`, as erratas de ponteiro e os gates.
- **Convenção**: `[medido]` = comando + saída literal nesta sessão (no anexo); `[lido]` = do documento citado, sem medir de
  novo. As contagens de decisões e de divergências são `[medido]` por `grep` (§3, §4).
- **Como este documento foi lido**: o executor leu inteiros o `CLAUDE.md`, o `LOGS-OCTAVIA.md`, o `APARATO.md`, o
  `N4-ENCERRAMENTO.md`, o `D0-ENCERRAMENTO.md` e os onze documentos do QL (pre-check, brief, `DESIGN-QL`, requisitos, os
  READMEs das quatro PRs); **nenhum agente**.
- **Divergências desta PR**: **1248–1254** (§12).

> **"Sim."** — o Marcel, no Tab, com o release e as músicas dele: a Letra de 77 colunas em V deitado, a de 64 no palco em
> pé, a de 75 no palco deitado no zoom 40 — e, no palco deitado no zoom padrão, **nenhuma música diferente de antes**
> (A-QL-13…16, 2026-10-10).

---

## 1. O que o QL entregou

**Para o músico**:

- **Onde a letra quebra.** A linha que não cabe na coluna desce para a linha de baixo, com **2 colunas de recuo**, sem
  sinal (QL-D29) — em vez de sair pela direita e só se ler rolando o corpo inteiro para o lado (div. 1175). Quebra **em V
  no tablet deitado** (55 colunas), **no tablet em pé** (48, no palco e em V), **no palco com o texto aumentado** (zoom 26 →
  68 colunas, 32 → 55, 40 → 44 em C; 41, 33 e 26 em B — QL-E2) e, quando o celular vier, em quase tudo (26). No dado real:
  **11** Letras quebram em V em C (27 linhas), **22** no tablet em pé (89 linhas) (`QL-PRECHECK.md` §10.1).
- **Onde não muda nada.** **O palco deitado, no zoom padrão (80 colunas), é o de antes** para toda música de até 80 colunas —
  e a maior do Marcel tem 77. Provado byte a byte com a fixture (o nó `corpo` igual ao da `main`, `QL-PR3-anexos/README.md`
  §4.3), pelo G-inv (B5 34/34, B3 18/18, §5) e pelo Marcel com as músicas dele (*"Não"*, A-QL-16).
- **O par da Cifra.** A linha de acordes e a de letra embaixo dela quebram **na mesma coluna**, e o acorde continua sobre a
  sílaba; o corte recua até não partir nem acorde nem palavra; o acorde **nunca** parte (QL-D28, QL-D45 — na Cifra, QL-D48).
  A progressão de uma seção faz par com a letra (QL-D22); a linha *quase acorde* quebra como letra (QL-D23). Só na Cifra:
  a Letra quebra sempre como letra (QL-D22). No dado real, 46 pares em 2 Cifras, 1 passa de 48 (`QL-PRECHECK.md` §10.2).
- **A Tab que rola.** A Tab **nunca quebra** — rola para o lado como antes, com as 6 linhas e as colunas intactas (QL-R8),
  em toda faixa e zoom (`QL-PR3-anexos/README.md` §4.4: 0 continuações em B no zoom 40). A única outra linha que rola é a
  de acordes com um acorde maior que a coluna, e só ela (a exceção da QL-D45; no dado real o maior acorde tem 8 colunas).
- **A âncora.** Ao girar o tablet ou mudar o zoom, **o começo da linha que estava no topo volta ao topo**, a 32 da barra,
  sem sinal (QL-D18, QL-D37) — no palco e, ao girar, em V (QL-D49); com as notas ou os *Detalhes* acima, a conta soma a
  altura deles, e com a marca dentro deles a rolagem volta ao topo (QL-D52). Medida contra a conta prevista, **±0,5 px em
  todo passo**, nos dois aparelhos (`QL-PR3-anexos/README.md` §16.1; `QL-PR4-anexos/README.md` §4, §14.4); o Marcel: *"Sim"*
  (*"você se acha?"*, A-QL-12).
- **As notas da música no palco.** No topo do corpo, rolando com a letra, em Manrope 16 × zoom ÷ 22, sob a régua *notas da
  música* com a **divisa** (ícone novo, catálogo 41 → 42); **abertas por padrão, recolhem com um toque, e o recolhido fica
  lembrado no aparelho** — a primeira preferência gravada fora do Firebase (QL-D30…D33, QL-D39, QL-D53). **Também no PDF** e
  nos estados sem texto (QL-D58), acima da área, sem mudar a paginação. Sem nota, nada. **A primeira nota de verdade**, escrita
  pelo Marcel no site: *"Sim"* (se lê) e *"Sim"* (o recolher volta recolhido depois de fechar e abrir o app) — A-QL-20,
  `QL-ENCERRAMENTO-anexos/README.md` §7.
- **A régua fora das bordas.** As bordas invisíveis de 15 % do palco (que avançam e voltam a música) ficavam **por cima** da
  régua das notas: o toque na divisa avançava a música (div. 1233). Agora **nenhuma borda invisível fica sobre um controle**: a
  borda entrega à régua o toque que cai nela; sobre o texto, as bordas seguem valendo (QL-D56, QL-R24) — 12 de 12 toques na
  régua nos dois aparelhos sem trocar de música, e o Marcel com a mão: *"Sim"* (`QL-PR4-anexos/README.md` §14.4, §14.6).

**O que mudou no texto: nada.** A quebra é só de exibição: o `bodyOf` e a busca leem o texto de antes (QL-R1, QL-D13), e
três instrumentos passaram a comparar o **texto lógico** (QL-D16).

### 1.1 As PRs

`[medido: gh pr view <n> --json commits,mergeCommit,mergedAt; git diff --shortstat M^1 M -- . ':!docs']`. **Linhas** = sem
`docs/`. **it** = linhas `it(`/`test(` acrescentadas em `*.test.ts(x)`.

| PR | nome | merge | commits | o que fez | linhas | it | anexo | divs. |
|---|---|---|---|---|---|---|---|---|
| **#370** | pre-check | `94f6718` | 4 (`59753b5` · `7073cc5` · `5644152` · `10d9814`) | Fase A (o leitor, a forma da Cifra, as notas, o sync, as corridas 124/146), Fase B no dado real pelo Marcel; **QL-D1…D27** | 0 | 0 | [`QL-PRECHECK.md`](QL-PRECHECK.md) | 1175–1193 |
| **#371** | brief | `c655e03` | 1 (`e4f1f54`) | o brief para o Claude Design, as amostras | 0 | 0 | [`QL-BRIEF.md`](QL-BRIEF.md) | 1194 |
| **#372** | desenho congelado | `d0d0639` | 2 (`812b5ac` · `a5f6cca`) | `DESIGN-QL` (56 molduras normativas, sha), `QL-REQUISITOS.md`; **QL-D28…D39**; **QL-E1** | 0 | 0 | [`DESIGN-QL/README.md`](DESIGN-QL/README.md), [`QL-REQUISITOS.md`](QL-REQUISITOS.md) | 1195–1198 |
| **#373** | PR-1 — gates | `827141a` | 8 (`64cca3f` … `8c51e68`) | o gate da quebra entrando reprovado (46); os três instrumentos pelo texto lógico; o duplo com colunas; o `DESIGN-QL` no `shasum -c`; a errata do T1-R25/R31; a medida do caractere (QL-E2); **QL-D40…D42** | +1281 −28 | 5 | [`QL-PR1-anexos/`](QL-PR1-anexos/README.md) | 1199–1205 |
| **#374** | PR-2 — a quebra no core | `ffd8f31` | 6 (`23f22ab` … `e2b54dc`) | `quebrar` (R1–R4, a medida do QL-D24), `ehLinhaDeAcordes`; a lista do gate vazia; **QL-D43…D47** | +624 −63 | 28 | [`QL-PR2-anexos/`](QL-PR2-anexos/README.md) | 1206–1210 |
| **#375** | PR-3 — o leitor | `4078c64` | 11 (`f13688e` … `3a8268d`) | o leitor desenha as linhas visuais no palco e em V; a âncora; a errata em par dos 6 dumps de Letra da B3; o `--logico` do G-N3; **QL-D48…D51** | +1059 −32 | 22 | [`QL-PR3-anexos/`](QL-PR3-anexos/README.md) | 1211–1228 |
| **#376** | PR-4 — as notas | `ea5e891` | 8 (`af2a800` … `c1e2120`) | as notas no palco, a divisa, o estado lembrado, a âncora com as notas e em V; **a parada** (QL-D54) e **a volta**: a régua fora das bordas, as notas fora do texto; **QL-D52…D60** | +1767 −119 | 51 | [`QL-PR4-anexos/`](QL-PR4-anexos/README.md) | 1229–1247 |
| **esta** | encerramento | — | `99718cb` · o commit 2 | o release no Tab (A-QL-21), os julgamentos com as músicas do Marcel, a primeira nota; **QL-D61** | 0 | 0 | [`QL-ENCERRAMENTO-anexos/`](QL-ENCERRAMENTO-anexos/README.md) | 1248–1254 |

**Código**: 4 PRs (#373–#376); só docs: 4 (#370–#372 e esta). Linhas de código do bloco (sem `docs/`): **+4731 −242**;
linhas `it(`/`test(` acrescentadas: **106** (os testes gerados em laço contam pelo laço: a suíte foi de **1706** casos no
pre-check a **1851** passando, §5).

### 1.2 Os 25 requisitos e os 23 aceites

Os requisitos `QL-R1…R25` (`QL-REQUISITOS.md` §1) e os aceites `A-QL-1…A-QL-23` (§2 de lá); a evidência de cada um está no
anexo da PR que o fechou, e não se copia aqui `[lido]`:

| aceites | veredito | onde |
|---|---|---|
| A-QL-1 … A-QL-3 (a função, a invariância, a medida) | **✓** | PR-1 (reprovando, 46) → PR-2 (lista vazia) · `QL-PR2-anexos/README.md` §4; na ponta, §5 |
| A-QL-4 (a errata do PRD) · A-QL-5 (os três instrumentos) · A-QL-7 (o `DESIGN-QL` no CI) | **✓** | PR-1 · `QL-PR1-anexos/README.md` §3, §5; o G-par de V com `O_LEITOR_QUEBRA` na PR-3 |
| A-QL-6 (o caractere por zoom) | **✓** no AVD (PR-1, QL-E2) e no Tab (PR-3, igual nos cinco zooms) | `QL-PR3-anexos/README.md` §4.2 |
| A-QL-8 … A-QL-11 (G-inv, G-N3/G-par, o corpo pelas molduras, a Tab) | **✓** | PR-3 §4–§6; PR-4 §7.3, §14.5; na ponta, §5 |
| A-QL-12 (a âncora) | **✓** — ±0,5 px nos dois aparelhos, com o código final (QL-D50) e com as notas (PR-4); o Marcel: *"Sim"* | PR-3 §16.1; PR-4 §4, §14.4 |
| A-QL-13 · A-QL-14 · A-QL-15 | **✓** — com a fixture na PR-3 (*"Sim"* × 3) e **com as músicas do Marcel no release** (*"Sim"* × 3: `8ca6316a`, `69735e94`, `f0523c5e`) | PR-3 §4.6; `QL-ENCERRAMENTO-anexos/README.md` §6–§7 |
| A-QL-16 (o palco deitado no 22 não muda) | **✓** — byte a byte com a fixture (PR-3 §4.3) e o Marcel: *"Não"* (nenhuma diferente) | idem |
| A-QL-17 · A-QL-18 (as notas; o estado lembrado) | **✓** — e no release, com a conta do Marcel: recolhida depois da abertura fria (o dump) | PR-4 §2, §5; anexo §7 |
| A-QL-19 (a divisa no catálogo; o traço) | **✓** — 42 registros, 0 acusações; o Marcel: *"Sim"* | PR-4 §3, §14.6 |
| **A-QL-20** (a primeira nota de verdade) | **✓** — *"Sim"* · *"Sim"* | anexo §7 |
| **A-QL-21** (o release; 100 + 100) | **✓** — `65209b80…`; **0 queda nativa** nos dois aparelhos; o custo no Hermes **não medido no release** (QL-D61) | anexo §2–§5 |
| A-QL-22 (o toque na régua) · A-QL-23 (as notas fora do texto) | **✓** — 12/12 e 6/6 no aparelho; o Marcel: *"Sim"* · *"Sim"* | PR-4 §14.2–§14.6 |

**25 de 25 requisitos com aceite; 23 de 23 aceites com veredito**, um com a ressalva da QL-D61 (o custo no release).

---

## 2. Os gates na ponta da `main`

Tudo `[medido]` nesta sessão, nesta árvore (`ea5e891` + só docs); saída literal em
[`QL-ENCERRAMENTO-anexos/gates.txt`](QL-ENCERRAMENTO-anexos/gates.txt) (o roteiro: `gates-rodar.sh`). Os gates de dump leem os
dumps finais commitados da volta da QL-PR4 (`QL-PR4-anexos/volta/dumps/base/`, o código final, AVD e Tab): nenhum aparelho
para eles.

| gate | resultado |
|---|---|
| **G-inv** (B5) · (B3, o palco) | `G-inv: 34 de 34 idênticos` · `18 de 18 idênticos` — `IDÊNTICO EM DP ✓` |
| **G-N3** com `--logico docs/native/QL-PR3-anexos/b3-pre-ql` | `G-N3: (e)=0 · (b)=0 · nome-acessível=8 · rolagem=6 · quebra=16 ✓` (84 pares) |
| **o gate da quebra** · **G-par de V** · G-par do core | `passam 46 · reprovam 0` · `zero reprovações, lista vazia (QL-PR2) ✓` · V: *"zero diferenças ✓"* em C e em 26 colunas (*"linhas do par acima da coluna: 6 · continuações vistas em V: 6"*) · core: lista vazia — `3 passed`, `6 passed` |
| **`gate:icones`** · **`gate:a20`** | `acusações: 0 · avisos: 0` · 229 literais, `acusações: 0` |
| **G1** · **G2/G3** (`ea5e891` → a árvore) | `G1a: DIFF VAZIO ✓` em 66 arquivos · `G1b: só adição ✓` · `testIDs antes=124 depois=124` ✓ · `log( antes=70 depois=70`, `nenhuma linha sumiu ✓` |
| **G1** · **G2/G3, o bloco** (`81249cd`, o merge do encerramento da D-0 → a árvore) | sem as declarações das PRs, o G1a **acusa** o código do bloco (`DIFF NÃO VAZIO ✗`, `ARQUIVO NOVO … sem exceção declarada ✗` — como deve: as exceções moram nos corpos das #373–#376) · `G1b: só adição ✓` · **G2 121 → 124** (os 3 das notas, QL-PR4) · **G3 70 = 70** — o QL não acrescentou nem trocou nenhuma linha de log |
| **`SHA256SUMS`** | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · `-N4` 2 · **`-QL` 1** · `docs/ux/DESIGN-I1` 14 · `N3-PRECHECK-anexos` 355 · `QL-PR3-anexos/b3-pre-ql` 6 — todos `OK`, 0 falhas (o `exit=1` dessas linhas no bruto é o do `grep -vc` que conta 0 falhas) |
| **G-back** (`81249cd` → a árvore) · **G-palco** · **G-tok** + cobertura · **G-faixa** | `G-back: PASSA` (✓ nenhuma) · `G-palco: PASSA — 0 ocorrências` · `PASSA` · `PASSA` · `G-faixa: PASSA` — o QL não tocou o site nem o backend |
| **`tsc`** | raiz 0 · `packages/core` 0 · `packages/identidade` 0 · `apps/native` 0 (de dentro de cada pacote, div. 1187) |
| **lint** | `✔ No ESLint warnings or errors` |
| **a suíte** | `Test Files 149 passed \| 3 skipped (152)` · `Tests 1851 passed \| 59 skipped (1910)` |

**Contra o começo do bloco** `[lido: QL-PRECHECK.md §4; QL-PR4-anexos/README.md §14.5]`: a suíte foi de **1765** casos
(1706 ✓) a **1910** (1851 ✓); os testIDs de 121 a 124; as linhas de log 70 = 70; o catálogo de ícones de 41 a **42**; os
congelados nativos de 4 pastas a 5.

---

## 3. Decisões QL-D1…QL-D61

`[medido]`: `git grep -hoE '^\| \*\*QL-D[0-9]+\*\*' -- docs` → **59 números** em linha de tabela, de QL-D1 a QL-D60, menos a
**QL-D48**, que vive em prosa (`QL-PR3-anexos/README.md` §1); a **QL-D52** e a **QL-D53** aparecem em duas tabelas, com o
mesmo texto (`DESIGN-QL/README.md` §3 e `QL-PR4-anexos/README.md` §1, que diz que *"as três estão no `DESIGN-QL` §3 e aqui"*).
**60, de QL-D1 a QL-D60, sem lacuna**; nada acima da 60 em `docs/` antes desta PR. **Mais uma nesta PR: a QL-D61** (§3.1) —
**61** no bloco. O texto de cada uma vive **só** na coluna "onde"; o rótulo é para achar a linha.

| # | rótulo | onde o texto vive |
|---|---|---|
| D1…D11 | o recorte: o nome QL; o que entra (a Letra no palco e em V, C e B; a Tab nunca; a Cifra — D3; as notas — D4) e o que fica fora; o sync é lacuna (D5); brief e desenho curtos; os gates (D7); o fatiamento (D8); o release no encerramento (D9); as corridas 124/146 (D10); o dado real pelo Marcel (D11) | `QL-PRECHECK.md` §0 |
| D12…D21 | o aval da Fase A: **o SY, bloco próprio** (D12); a quebra no core, fora do `bodyOf` (D13); a forma da Cifra (D14); a errata do PRD (D15); os três instrumentos pelo texto lógico (D16); 124/146 ao W5 (D17); a âncora (D18); o fatiamento confirmado (D19); a Fase B (D20); a A9 sem rodar (D21) | `QL-PRECHECK.md` §9 |
| D22…D27 | o aval da Fase B: o par só na Cifra (D22); a reserva por linha (D23); `\t`, `\r` e acento só medem (D24); o brief (D25); as notas ficam, com fixture (D26); onde o Marcel julga (D27) | `QL-PRECHECK.md` §11 |
| D28…D38 | as do desenho: as regras do corte R1–R4 (D28); o recuo de 2 (D29); as notas no topo do corpo (D30); a divisa (D31); o tamanho das notas (D32); o recolhido lembrado (D33); as colunas estimadas (D34); o respiro e a nota da posição em A ao N5 (D35, D36); as respostas que viram regra (D37); o congelamento (D38) | `DESIGN-QL/README.md` §3 |
| D39 | o aval do congelamento: o recolhido gravado no aparelho; zoom e tema como hoje | idem |
| D40…D42 | o Tab mede na PR-3; o contrato com `inicio`/`fim`; o gate no projeto `web` | `QL-PR1-anexos/README.md` §10 |
| D43…D47 | o `RangeError` e a proteção na tela; os pedaços vazios; **o acorde nunca parte, também sozinho** (D45); o `\r` da linha de acordes; o `\t` na continuação | `QL-PR2-anexos/README.md` §11 |
| D48 | a D45 só na Cifra | `QL-PR3-anexos/README.md` §1 |
| D49…D51 | V ancora ao girar; a âncora de novo no AVD; **o custo no Hermes no release** (D51) | `QL-PR3-anexos/README.md` §16 |
| D52…D54 | a âncora com algo acima; a régua de V, 48; **parar e redesenhar** (D54) | `QL-PR4-anexos/README.md` §1; `DESIGN-QL/README.md` §3 (D52, D53) |
| D55…D60 | a saída em duas partes; **nenhuma borda invisível sobre um controle** (D56); a fila com a navegação do palco (D57); as notas fora do texto (D58); o `reordenar.test.tsx` ao W5 (D59); **a lição** (D60) | `QL-PR4-anexos/README.md` §14.1 |
| **D61** | **o custo no Hermes não se mede no release**: o número do dev client fica como teto; o W5 herda o caminho | §3.1 daqui |

**As mudadas por decisão posterior** (o texto das duas fica onde está):

| decisão | mudada por | o quê |
|---|---|---|
| QL-D3 (a Cifra quebra o par junto) | **QL-D14** (a forma: reconhecedor, corte, reserva) e **QL-D22** (o par só na Cifra; a progressão vira par) | a regra virou especificação |
| QL-D14, a candidata de reserva (*"a Cifra incerta não quebra"*) | **QL-D23** | a reserva é por linha — a candidata caiu pelo dado (fração 0,080) |
| QL-D33 (*"lembrado como o zoom e o tema"*) | **QL-D39** | gravado no aparelho de verdade; zoom e tema seguem como hoje (div. 1198) |
| QL-D5 (o sync: fatia ou bloco) | **QL-D12** | o SY, bloco próprio |
| QL-D8 (o fatiamento) | **QL-D19** | confirmado, com quatro ajustes |
| QL-D7 (iv) (*"o G-par verde porque não toca o contrato"*) | **QL-D16** | a metade de V lê o nó desenhado (div. 1185) |
| QL-D10 (124/146) | **QL-D17** | disparo a mais → W5 |
| QL-D18 (a âncora, no palco) | **QL-D49**, **QL-D52** | V também, ao girar; com algo acima do corpo |
| QL-D30 (a régua, 48) | **QL-D53** (QL-E3); **QL-D56** (QL-E4) | a régua de V, 48 em todo zoom; fora das bordas |
| QL-D34 (as colunas estimadas) | **QL-D40** e a **QL-E2** | medidas: vale a conta da folha em C e B |
| QL-D37 (*"só a Tab rola"*) | **QL-D45** | a exceção da linha com o acorde maior que a coluna |
| QL-D45 | **QL-D48** | só na Cifra |
| QL-D4, QL-D26 (as notas no corpo de texto) | **QL-D58** | também no PDF e nos estados sem texto |
| QL-D54 (parar e redesenhar antes) | **QL-D55** | a PR volta antes do bloco da navegação, com a QL-D56 |
| QL-D51 (o custo no release) | **QL-D61** (esta PR) | sem caminho sem mudar código; o teto do dev client |

### 3.1 A decisão desta PR — QL-D61 `[Marcel, 2026-10-10]`

| # | decisão |
|---|---|
| **QL-D61** | (A3, div. 1248) **O custo de `quebrar` no Hermes não se mede no release.** O release não tem o inspetor do Hermes nem o caminho do módulo no bundle (`QL-ENCERRAMENTO-anexos/a3/a3-sem-caminho.txt`), e o instrumento da QL-PR3 só roda no dev client. **O número do dev client fica como teto** (`QL-PR3-anexos/README.md` §9: mediana 1,6–2,7 ms, máximo 12,6 ms). **Vai ao W5, como herança, "um caminho para medir desempenho no release sem mudar o código do app"** (§8.5), com a QL-D51 apontando para ela. |

### 3.2 As erratas da folha — QL-E1…QL-E4

Todas no `DESIGN-QL/README.md` §6 `[medido: git grep -n 'QL-E[0-9]' — E1…E4; a E5 só como "a próxima"]`:

| # | PR | o quê | div. | efeito |
|---|---|---|---|---|
| E1 | desenho | o par de 50 em A recua para a coluna 18, não 22 | O5 (QL-D28) | **comportamento** |
| E2 | PR-1 | o caractere e as colunas fora do 22, medidos — vale a conta da folha | 1202 | medida |
| E3 | PR-4 | a régua das notas: a de V, 48 em todo zoom | 1231 (QL-D53) | medida |
| **E4** | PR-4 | **as bordas de toque não cobrem a régua das notas** | 1233 (QL-D56) | **comportamento** |

---

## 4. Divergências 1175–1254

### 4.1 A contagem

`[medido]`, a coluna de origem lida na célula de cada linha de tabela:

```
$ git grep -nE '^\| \*\*(1[12][0-9]{2})\*\* \| [A-Z] \|' -- docs | … | awk '$1>=1175 && $1<=1247'
73 números, 1175 a 1247, cada um uma vez · nenhum ≥ 1248 em prosa antes desta PR
P 17 · D 18 · A 10 · T 28
```

| PR | faixa | P | D | A | T | total | declarado no documento |
|---|---|---|---|---|---|---|---|
| pre-check | 1175–1193 | 8 | 4 | 4 | 3 | 19 | `QL-PRECHECK.md` §6: *"P 8 · D 4 · A 4 · T 3"* ✓ |
| brief | 1194 | | 1 | | | 1 | `QL-BRIEF.md` §10: *"D 1"* ✓ |
| desenho | 1195–1198 | 3 | 1 | | | 4 | `DESIGN-QL/README.md` §11: *"P 3 · D 1"* ✓ |
| PR-1 | 1199–1205 | 1 | 3 | | 3 | 7 | `QL-PR1-anexos/README.md` §6: *"P 1 · D 3 · T 3"* ✓ |
| PR-2 | 1206–1210 | 1 | 2 | | 2 | 5 | §9 *"P 1 · D 2 · T 1"* + §11.5 *"T 1"* ✓ |
| PR-3 | 1211–1228 | 3 | 2 | 4 | 9 | 18 | §13 *"P 3 · D 2 · A 4 · T 7"* + §16.2 *"T 2"* ✓ |
| PR-4 | 1229–1247 | 1 | 5 | 2 | 11 | 19 | §12 *"D 4 · A 1 · T 7"* + §14.9 *"P 1 · D 1 · A 1 · T 4"* ✓ |
| encerramento (esta PR) | 1248–1254 | 4 | 1 | 2 | | 7 | §12 |
| **QL** | | **21** | **19** | **12** | **28** | **80** | |

**As contagens declaradas batem com a coluna em todos os documentos** — a primeira vez desde o N4, onde duas não batiam
(div. 1140). **O T é o maior** (28 de 73 até a PR-4): o QL mediu em dois aparelhos com arneses e instrumentos novos (o
`uiautomator events`, o inspetor do Metro, a régua por zoom), e cada atrito de aparato virou divergência e linha do
`APARATO.md`. **O P caiu** (17 de 73, 23 %; no N4, 50 de 189, 26 %).

### 4.2 As lições

- **A da QL-D60 — todo controle novo no corpo do palco se confere contra as bordas de toque** (divs. **1233**, **1241**,
  **1242**). A régua das notas passou pelo brief, pela folha e pelo prompt da PR-4 desenhada **sob** as bordas invisíveis de
  15 %, que nenhum dos três desenha por serem invisíveis; o arnês tocava a régua **no centro do nó**, onde não há borda; e o
  `native-tela` não tem geometria. Só a mão do Marcel achou: *"Quando clico na seta, está mudando … para a próxima música"*
  (`QL-PR4-anexos/README.md` §6). É o **caso 1** do padrão (A14, N1: *"tap no centro × a extensão do alvo"*) outra vez, sete
  blocos depois. A resposta tem duas metades: a regra de produto (QL-D56, QL-R24 — nenhuma borda invisível sobre um controle,
  para todo controle futuro) e a de método, que é a proposta de regra 40 (§6).
- **A referência lógica do G-N3 — a opção 2** (div. **1213**). Com a paisagem dos 6 dumps de Letra quebrada pela errata em par,
  a primeira proposta tirava a referência **da própria saída** (a paisagem quebrada, juntada pelas continuações). O Marcel a
  recusou: um defeito que perdesse a mesma palavra em C e em B passaria, porque paisagem e faixa virariam quebras válidas do
  mesmo candidato errado. **A opção 2**: a referência são os dumps **pré-QL**, guardados à parte com sha (`b3-pre-ql/`), e os
  dois lados têm de ser quebras dela — com quatro CN obrigatórios (`QL-PR3-anexos/README.md` §6.2). **Instrumento que tira a
  referência do que ele mede não pega o erro que afeta os dois lados igual.** (O prompt deste encerramento a chama de
  *"tirada da própria saída"* — é a recusada; div. 1254.)
- **As premissas do revisor — origem P** (21 no bloco): o leitor *"corta"* (rola, 1175); *"≈ 55 no palco"* (é V; o palco
  tem 80, 1176 — essa é D, do `N4-ENCERRAMENTO.md`); *"em avião"* com o mock (o app não lê o mock sem rede, 1212); *"V ancora"*
  (só o palco ancorava, 1225); *"a heurística com o critério maioria"* (a maioria é da quase acorde, 1206); o G-par *"verde
  porque não toca o contrato"* (a metade de V lê o nó, 1185); e o controle no corpo sem as bordas (1241). O padrão é o do N4:
  **o prompt presume o estado do código ou do aparelho**; o pre-check e as medidas o corrigem antes de virar defeito — e,
  quando não corrigem (1241), o aparelho corrige.
- **A O6 da folha não procedia** (div. **1197**): a objeção dizia que a Letra das capturas tinha 87 colunas, não 110; medido,
  110 (as molduras da âncora é que a cortavam em 87). A errata do brief que o prompt pedia não se aplicou — **o brief estava
  certo**, e conferir antes de corrigir evitou uma errata falsa.
- **Os instrumentos que os próprios CN corrigiram** — o G-par de V aceitava uma Tab quebrada (1204); o `VAR=x função` do `sh`
  do macOS vazava entre CN (1203); o nome *"CN-0 o contrato"* media a função (1210, *nome é afirmação*); o `corpo` da exceção
  saía folha no dump (1216); o `uiautomator events` segurava a conexão do dump (1214); a âncora derivava uma linha a cada giro
  (1215) e era cortada pelo conteúdo velho no Tab (1217) — **os dois acharam defeito de produto, não de instrumento**. A regra
  4 (*"um CN que passa é tão suspeito quanto um gate que nunca acusa"*) pagou de novo.
- **As quedas nativas do dev client** (divs. **1222**, **1243**): três, todas a assinatura da N4-D105 (`MountingCoordinator::
  pullTransaction`), todas em aberturas frias **antes da primeira tela**, nenhuma com o palco ou V montados — e **zero** nas
  100 + 100 do release (§2 do anexo). A herança da N4-D105 segue no W5 (§8.6).

---

## 5. A contabilidade de prod do bloco

`[lido]` das tabelas de contabilidade de cada documento (linha citada), e `[medido]` nesta PR:

| fase | quem | o quê | escritas |
|---|---|---|---|
| pre-check (#370), commits 1–4 | o executor | 0 requisições, 0 logins, 0 `.env*`; um Postgres local para provar as consultas (`QL-PRECHECK.md:505`) | 0 |
| pre-check, Fase B | **o Marcel**, no SQL Editor | 3 consultas só de leitura (`QL-PRECHECK-anexos/fase-b/saida-marcel.txt`) | 0 |
| brief (#371) · desenho (#372) | o executor | nenhum aparelho, nenhuma requisição (`QL-BRIEF-anexos/README.md:5`); a folha aberta sem rede, 1 requisição `file:` (`DESIGN-QL/README.md` §5.4) | 0 |
| PR-1 · PR-2 · PR-3 · PR-4 | o executor, com o mock | 0 · 0 · 0 · 0 requisições a prod (`QL-PR1-anexos:333`; `QL-PR2-anexos:288`; `QL-PR3-anexos:451`; `QL-PR4-anexos:273`, `:442`); **0 `octavia.rocks`** em todo bundle servido e todo logcat | 0 |
| **encerramento**, Parte A | o release, sozinho | **3 syncs = 6 `GET`** (a 1ª abertura; a reabertura da nota; a do recolher) · **1 download** (451.924 B, a garantia de arquivos) | **0 do executor** |
| encerramento, A4 e A-QL-20 | **o Marcel** | 1 consulta só de leitura (a A4); **a nota**, escrita no site | a nota (dele) |
| **QL** | | **executor: 6 `GET`, 1 download, 0 escritas, 0 logins** · **Marcel: 4 consultas de leitura e 1 nota** | |

E à parte, fora do roteiro: o sync da nota achou **duas músicas novas** na biblioteca do Marcel (63 → 65, div. 1249) — dele.
**Nenhuma escrita do executor em prod no bloco inteiro**, e nenhum objeto de teste ficou na conta de ninguém.

---

## 6. A regra nova — proposta para o `LOGS-OCTAVIA.md`

`[medido: grep]` a última regra é a **39** (D-0, *"Um gate de corpo prova que o corpo é aceito pelo esquema real"*); o último
caso do padrão é o **43** (div. 1137, N4). O QL não acrescentou regra nem caso numerado; entraram as linhas do `APARATO.md`
(o duplo com colunas, a régua por zoom, o `VAR=x função`, o leitor que quebra, as notas no palco). **Proposta** — numerada na
sequência, **entra no `LOGS-OCTAVIA.md` só com o aval** (pergunta 2):

> **40. Um controle novo no palco se confere contra tudo o que fica por cima dele — e o toque se prova nas pontas do alvo,
> não no centro.** *(Divs. 1233, 1241, 1242, QL-PR4; QL-D56, QL-D60.)* As bordas de 15 % do palco são invisíveis por
> desenho: nenhuma folha as desenha, e o brief, a folha e o prompt da QL-PR4 puseram a régua das notas sob elas sem que
> nenhum dos três a conferisse. O arnês tocava o alvo pelo `resource-id`, **no centro do nó** — onde não havia borda —, e o
> `native-tela` não tem geometria; só a mão achou. Por isso, para todo controle que entra no corpo do palco (ou em qualquer
> área com alvo invisível por cima): **(a)** o brief e o desenho dizem o que fica por cima do controle, inclusive o que não
> se desenha; **(b)** o prompt da PR o pergunta; **(c)** o aceite toca **nas duas pontas e no meio** do alvo — e no ícone e no
> rótulo, se houver — e mede que o toque fez o que o controle faz, não outra coisa; **(d)** a regra de produto é a QL-D56:
> nenhuma borda invisível fica sobre um controle. É o caso 1 do padrão (A14, N1) outra vez — *"o instrumento mede o toque no
> centro; eu li como a extensão do alvo"* — e, como extra declarado, **a pergunta 2 propõe também o caso 44** na tabela do
> padrão (div. 1233), no molde dos 38–43.

---

## 7. As corridas do bloco → [`CI-FAIXA.md`](CI-FAIXA.md)

**Regra 22**: as corridas do bloco entram no `CI-FAIXA.md` como as linhas **151–157** — **sete com APK**, todas `success` no
job `[medido: gh run list --workflow=native.yml --created ">=2026-10-07T19:55:00Z" · gh run view <id> --json jobs]`: as
aberturas das #373, #375 e #376, a volta da #376 (`ce1adb1`) e os três merges na `main`. A D-0 não disparou nenhuma; a
QL-PR2 (só `packages/core/**`) também não. **Cinco `skipped`** (os pushes de docs depois do APK verde — a regra 18) não
entram. **Nenhuma com APK veio de push só fora do filtro.** A 155 é a **tentativa 2** da abertura da #376: a 1 falhou no
`packageDebug` sem APK (div. 1237, (b) runner) e fica fora da população. **A referência, recalculada lá**:

```
n=135  mín 8m09s  máx 14m32s  mediana 12m30s  Q1 11m03s  Q3 13m17,5s  IQR 2m14,5s     (era n=128 · 12m30s · IQR 2m03,2s)
```

Só as do QL, como recorte: `n=7 · mín 8m53s · máx 13m51s · mediana 13m01s · IQR 3m11s`. **Nenhum segmento novo**: nenhum item
da lista fechada mudou (`git diff cf58f7f ea5e891 -- apps/native/package.json apps/native/app.json
.github/workflows/native.yml pnpm-lock.yaml` → vazio). O prompt deste encerramento não pedia esta tarefa; a regra 22 e o
`QL-REQUISITOS.md` §3 a pedem — **feita, declarada** (div. 1252).

---

## 8. Heranças, com destino — **proposta do executor, para o aval** (pergunta 1)

Numeração estável — cite por **§8.<n>.<m>**. Toda linha tem origem e bloco (regra 23).

### 8.1 SY (a sincronização automática — logo depois do QL)

| # | item | origem |
|---|---|---|
| 1 | **o T1-R13 passo 4**: sincronizar quando a rede volta e na volta do segundo plano depois de 30 s | QL-D5, QL-D12; div. 1180 |
| 2 | **a foto da música aberta**: o texto não muda no meio de uma música | div. 1182 |
| 3 | **o voo único** (um sync por vez) | div. 1183 |
| 4 | **a janela da `naoRegredir`** e o que o D tem de mudar junto (§8.4.1) | div. 1183; `QL-PRECHECK.md` A6.3 |
| 5 | **a regra 38 (c)/(d) remedida no release do SY** — no `ea5e891` a volta da rede com o app aberto **ainda não** sincroniza (`QL-ENCERRAMENTO-anexos/README.md` §4; o terceiro build medido) | N4-D115; QL-D12 |

### 8.2 A navegação do palco (bloco próprio, antes do N5)

| # | item | origem |
|---|---|---|
| 1 | **a navegação repensada por inteiro**: bordas visíveis ou não, gesto de deslizar, pedal Bluetooth, controles explícitos — o pedido do Marcel: *"um botão (ícone) para passar para a próxima música"* | QL-D55, QL-D57; div. 1233 |
| 2 | **a área do PDF em C com as notas abertas: 231 dp no Tab** — o deslize que vira a página fica curto | `QL-PR4-anexos/README.md` §14.4 |
| 3 | **a lição da QL-D60** (e a regra 40, se aprovada): todo controle que o bloco puser no palco se confere contra o que fica por cima, no brief, no desenho, no prompt e no aceite | QL-D60; §6 |
| 4 | as bordas seguem por cima do **texto** do corpo (QL-D56) — o que o bloco decidir sobre elas decide também o arrasto horizontal da linha da exceção da QL-D45 (div. 1218) | QL-D56; div. 1218 |

### 8.3 O metrônomo visual no palco (bloco novo, ideia do Marcel de 2026-10-09)

O registro é [`QL-ENCERRAMENTO-anexos/ideia-metronomo.md`](QL-ENCERRAMENTO-anexos/ideia-metronomo.md): a ideia, os seis
pontos em aberto e o que o pre-check do bloco mede. A posição na fila é a pergunta 3.

### 8.4 O resto do D

| # | item | origem |
|---|---|---|
| 1 | **o `updated_at` mexido pelo favoritar**, que muda junto com a `naoRegredir` e o critério do `reconcile` — **a partir do que o SY deixar escrito** | `D0-ENCERRAMENTO.md` §8.2 item 3 e a errata de lá; QL-D12; `QL-PRECHECK.md` A6.3 |
| 2 | **o compasso por música — pergunta para o pre-check do D: o campo entra no recorte?** Dele dependem o acento no tempo 1 e a contagem de entrada do metrônomo em 3/4 e 6/8 (ponto 1 do `ideia-metronomo.md`); hoje o site não salva compasso (N4-D31; `N4-ENCERRAMENTO.md` §10.4.5) | ideia do metrônomo; N4-D31 |
| 3 | o par na Letra com cifra digitada **não é herança** — é o custo declarado da QL-D22 (0 casos no dado), e se reabre como pergunta quando houver um | QL-D22; `QL-REQUISITOS.md` §4 |

### 8.5 N5 (o celular)

| # | item | origem |
|---|---|---|
| 1 | **o respiro de 32 em A** (contra os 16 do `N3-A-S3`) — confirmar | QL-D35; O2 |
| 2 | **a nota da posição em A; a barra de baixo de A saindo da tela** | QL-D36; O3, O4, P-QL6 |
| 3 | **a largura do caractere medida em A** (o celular, outra densidade): as colunas de A seguem estimadas (26 no 22) | QL-E2; `QL-PR1-anexos/README.md` §4 |

### 8.6 W5 (instrumento)

| # | item | origem |
|---|---|---|
| 1 | **as corridas 124 e 146** (disparo a mais) e a hipótese do lado cego do detector (imprimir a lista que a API devolveu) | QL-D17; div. 1184 |
| 2 | **`packages/core/**` fora do `paths` do `native.yml`**; os testes do core para dentro do core (o gate da quebra no projeto `web`) | QL-D42; div. 1201; `N4-ENCERRAMENTO.md` §10.5.1 |
| 3 | **o script de controle negativo da PR-1** cujo nome mede outra coisa depois da PR-2 (*"CN-0 o contrato"*) | div. 1210 |
| 4 | **o `reordenar.test.tsx` instável** sob carga | QL-D59; div. 1235 |
| 5 | **o `tsc` da raiz** com `-p apps/native` (35 × TS2488) contra o de dentro do pacote (0) | div. 1187 |
| 6 | **"um caminho para medir desempenho no release sem mudar o código do app"** (o custo de `quebrar` ficou com o teto do dev client) | **QL-D61**; QL-D51; div. 1248 |
| 7 | **a medição fria do release**: agora **n=3** — 369 s, 488 s e **464 s** (esta PR), de árvores diferentes | `N4-ENCERRAMENTO.md` §10.5.7; `QL-ENCERRAMENTO-anexos/README.md` §2 |
| 8 | **a estabilidade — as quedas nativas da assinatura da N4-D105 no dev client**: 3 no bloco (1 na PR-3, 2 na PR-4), todas em abertura fria antes da primeira tela; 0 no release (100 + 100) | divs. 1222, 1243; `N4-ENCERRAMENTO.md` §10.5.10 |
| 9 | o `build` sob cobertura instável (o teste do editor, a div. 845) — o rerun da PR-2 | div. 1211 |

### 8.7 Bloco de identidade

| # | item | origem |
|---|---|---|
| 1 | **o ícone do app no lançador**: o Marcel não o achou para reabrir o app (a atividade de lançador existe). Observação de uso, não defeito — **proposta: só registro**, ou o bloco de identidade, se o Marcel quiser olhar o ícone | div. 1250 |

**Fechadas no QL, de heranças anteriores**: o `N4-ENCERRAMENTO.md` §10.2 inteiro — o item 1 (a quebra na letra, nunca na
tab, no palco e em V), o 2 (as notas da música no palco) e o 3 (as corridas 124/146: medidas no pre-check, disparo a mais,
ao W5 pela QL-D17) — com nota na fonte (§10). E a **div. 1143** (N4) respondida pela QL-D5 (lacuna), com destino no SY.

**Em números**: **27 linhas** — SY 5 · navegação 4 · metrônomo 1 · D 3 (2 itens e 1 não-herança) · N5 3 · W5 9 · identidade 1
· e 1 de registro (8.4.3).

---

## 9. Perguntas para o aval

1. **Os destinos do §8.** Confirmar em bloco, ou um a um. As duas com alternativa real:
   (a) **as quedas nativas do dev client** (§8.6.8) — W5, junto do `N4-ENCERRAMENTO.md` §10.5.10, ou o N5, que vai abrir o dev
   client no celular; **recomendo W5**: o que falta é reproduzir com taxa medida, e o release (o que o músico usa) deu zero;
   (b) **o ícone do app** (§8.7.1) — só registro, ou o bloco de identidade; **recomendo só registro**: o ícone existe, e o Tab
   repousa com o release instalado por `adb`, não pela loja.
2. **A regra 40** (§6): entra no `LOGS-OCTAVIA.md` como está? E o **caso 44** na tabela do padrão (div. 1233, *"o arnês toca
   no centro do nó × a extensão do alvo"*), extra declarado? **Recomendo: as duas**, num commit desta PR depois do aval — a
   regra porque a lição já tem decisão (QL-D60) e falta só o texto normativo; o caso porque o padrão o reconhece pelo número
   e o 1 sozinho não diz que voltou.
3. **A fila.** Hoje: **QL → SY → resto do D → navegação do palco → N5 → identidade → iOS**, o W5 à parte (QL-D57). O Marcel
   decidiu em 2026-10-09 que o **metrônomo visual** vem **depois do resto do D**, antes de a navegação do palco entrar na
   fila. A posição entre os dois:
   (a) resto do D → **metrônomo → navegação do palco** → N5;
   (b) resto do D → **navegação do palco → metrônomo** → N5;
   (c) **os dois num bloco só**, antes do N5.
   **Recomendo (b).** As entradas do revisor: o metrônomo traz **dois controles novos ao palco** — o toque para realinhar e o
   oitavo controle da barra —, e a lição da QL-D60 vale para os dois. Com a navegação antes, esses controles se desenham sobre
   o modelo de toque que a navegação decidir (bordas visíveis ou não, gesto, pedal), em vez de se conferirem contra as bordas
   de hoje e serem refeitos depois; e a barra do palco, que a navegação redesenha, recebe o oitavo controle uma vez só. Com
   (a), o metrônomo desenharia contra bordas que vão mudar; (c) junta dois redesenhos do palco num bloco grande, contra o molde
   de blocos curtos do `ideia-metronomo.md`. **Nas três opções o metrônomo fica antes do N5**, para o palco do celular já ser
   desenhado com ele — **confirme, Marcel, que é isso que você quer.**
4. **O `CI-FAIXA.md`** (div. 1252): o prompt não pedia, a regra 22 pede — as 151–157 e o recálculo entraram no commit 2.
   Aceitar? **Recomendo aceitar.**
5. **O texto do metrônomo contra os documentos do QL** (div. 1253): o anexo diz *"a rolagem que acompanha o BPM cadastrado"*;
   o `QL-PRECHECK.md` A1.4 lê a rolagem automática como **1 px por quadro**, sem BPM. O texto ficou como veio. Só registro
   (o pre-check do metrônomo mede — é o primeiro item da lista dele), ou uma nota no anexo? **Recomendo só registro**: o
   anexo já manda o pre-check medir *"como a rolagem lê o BPM hoje"*.

**O bloco só se declara encerrado depois do aval.**

---

## 10. Erratas de ponteiro — neste commit

Só a nota, no molde das existentes, sem reescrever texto:

| arquivo | onde | a nota |
|---|---|---|
| `docs/native/N4-ENCERRAMENTO.md` | §10.2, depois da tabela | os três itens fechados pelo QL (a quebra; as notas; as corridas 124/146 → W5) |
| `docs/ux/D0-ENCERRAMENTO.md` | §13, depois do texto final | o QL encerrado; a fila (QL-D12, QL-D57); o metrônomo visual, posição a decidir no aval |
| `docs/ux/PLANO-TRANSICAO.md` | "Sequência", depois da última nota do QL | o QL encerrado; o próximo bloco (o SY); o metrônomo como bloco da fila, **a posição a decidir no aval** |
| `docs/native/QL-REQUISITOS.md` · `docs/native/QL-PR3-anexos/README.md` | o encerramento (§3) · a QL-D51 (§16) | **a QL-D51 aponta para a QL-D61** (o pedido do Marcel na decisão) |
| `docs/native/CI-FAIXA.md` | a referência; a série; "Quem acrescenta" | as 151–157 e o recálculo (§7) |
| `docs/native/APARATO.md` | os aparelhos (commit 1) | o release de repouso do Tab passa a ser o `ea5e891` |
| `CLAUDE.md` | — | **nenhuma**: não cita o QL nem a fila `[medido: grep -n "QL\|SY" CLAUDE.md → nada do bloco]` |

---

## 11. Contabilidade desta PR

| | |
|---|---|
| requisições a `/api/*` em prod | **6 `GET`** (os 3 syncs que o release faz ao abrir com rede) · **1 download** (a garantia de arquivos) · escritas do executor **0** · **a nota do Marcel**, no site |
| logins · `.env*` abertos | **0 · 0** — o `apps/native/.env` copiado por `cp -p` para o build, sha256 `f2bfa179cd8e` igual, sem abrir, apagado |
| aparelhos | **Tab**: começo `cf58f7f`, travado, `stay_on=0`; fim **`ea5e891`**, `stay_on=0`, settings e túneis iguais ao lido, destravado pelo Marcel · **AVD**: em avião do começo ao fim, release instalado e desligado **sem salvar** (`ram.bin` de 2026-09-24 intacto) |
| builds | 1 release (464 s, frio) |
| banco local | 1 Postgres 17.11 descartável (a prova da consulta da A4), apagado |
| agentes | **0** |
| commits | `99718cb` (a Parte A e a errata do `APARATO.md`) · o commit 2 (este arquivo; o `ideia-metronomo.md`; o `CI-FAIXA.md`; as erratas de ponteiro; os gates) |
| código | nenhuma linha |

Os blocos de declaração desta PR, verbatim (a cópia que a regra do W4-b2 pede):

```gates
# QL encerramento: nenhuma declaração — só docs.
```

```gates-web
# só docs — QL encerramento: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

---

## 12. Divergências desta PR — 1248 a 1254

As 1248–1251 são da Parte A (`QL-ENCERRAMENTO-anexos/README.md` §10, com o texto inteiro); aqui o resumo, e as da Parte B.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1248** | D | A QL-D51 manda medir o custo de `quebrar` no release; o único instrumento só roda no dev client | **QL-D61**; W5 (§8.6.6) |
| **1249** | A | O sync da nota trouxe 3 músicas mudadas (63 → 65) e 1 download de 451.924 B: duas músicas novas na biblioteca do Marcel | registrado; na contabilidade (§5) |
| **1250** | A | O Marcel não achou o ícone do app para reabrir; reaberto pelo `adb` | §8.7.1; pergunta 1 (b) |
| **1251** | P | O prompt manda dizer o id8; o Marcel pede o título (na conversa, nunca no anexo) | memória do executor |
| **1252** | P | O prompt não traz a tarefa da **regra 22** (as corridas do bloco no `CI-FAIXA.md`), que o `QL-REQUISITOS.md` §3 lista no encerramento | feita, declarada (§7); pergunta 4 |
| **1253** | P | O `ideia-metronomo.md`, copiado sem mudar, diz *"além da rolagem que acompanha o BPM cadastrado"*; o `QL-PRECHECK.md` A1.4 (`[lido]`) registra a rolagem automática como **`y += 1` px por quadro** — sem BPM | o texto mantido (o prompt o manda); o pre-check do metrônomo mede (o primeiro item da lista dele); pergunta 5 |
| **1254** | P | O prompt chama de *"a referência lógica do G-N3 tirada da própria saída (a opção 2)"*; a opção 2 é o contrário — a referência **pré-QL, à parte**; a tirada da própria paisagem foi a **recusada** (div. 1213) | a lição escrita pela fonte (§4.2) |

**Contagem**: 7 — P 4 · D 1 · A 2. **A próxima livre é a 1255.**
