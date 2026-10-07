# N4 — ENCERRAMENTO

**A fonte do bloco — e um índice, não uma segunda cópia.** Tudo o que este arquivo afirma aponta para o documento, a PR
ou o anexo onde está; onde a prosa daqui e a fonte divergirem, vale a fonte. Nenhum texto de decisão ou de errata é
reescrito aqui.

- **Bloco**: N4 — **content nos apps**, recortado pela N4-D5 em **a biblioteca no tablet**: a lista de todas as músicas
  com filtros e busca (L), a visualização de uma música (V), o palco avulso sem setlist hospedeira, o favoritar e todo
  arquivo da biblioteca no aparelho. Sem edição, criação, upload nem apagar.
- **Janela**: 2026-10-01 (pre-check, #353, merge `ea34421` às 17:37:57Z) → 2026-10-07 (N4-PR9, #365, merge `cf58f7f` às
  19:54:29Z) e o release desta PR.
- **Esta PR** ([#366](https://github.com/marcelviana/octavia/pull/366)): só docs, árvore `../octavia-n4-encerramento`, branch
  `n4/encerramento`, sobre `origin/main` = `cf58f7f`. Commit 1 `473eea5` — **o release no Tab** (A-N4-28;
  [`N4-ENCERRAMENTO-anexos/README.md`](N4-ENCERRAMENTO-anexos/README.md)); commit 2 — este documento, o `CI-FAIXA.md` e
  as erratas de ponteiro.
- **Convenção**: `[medido]` = comando + saída literal nesta sessão (no anexo); `[lido]` = tirado do documento citado, sem
  medir de novo. As contagens de divergências, decisões e erratas são `[medido]` por `grep` (§4–§6).
- **Como este documento foi lido**: os 13 `README.md`/documentos de PR do bloco foram lidos por quatro agentes de leitura,
  em paralelo, com extração por roteiro fixo (PRs e defeitos; decisões e erratas; divergências; heranças, catálogo e
  prod); o executor leu o `N4-REQUISITOS.md`, o README da PR-9, o do release, o `APARATO.md`, os encerramentos do N3 e do
  I1 e o `CI-FAIXA.md`, e conferiu com `grep` cada contagem e cada citação de seção usada aqui.
- **Divergências desta PR**: **1136–1142** (§13).

> **"O TABLET TEM A BIBLIOTECA INTEIRA, E ELA SE LÊ."** — *"está tudo funcionando bem"*, o Marcel, no Tab, com o
> release e as 63 músicas dele (A-N4-28, 2026-10-07).

---

## 1. O que o N4 entregou

**Para o músico**: `Buscar música` abre **a biblioteca inteira** — em ordem alfabética, com cinco filtros (os quatro tipos
e as favoritas) e busca, sem teclado na abertura; tocar numa música a **visualiza** (cabeçalho, corpo pelo leitor do
palco, campos, arquivos); o ▶ a **toca no palco avulso**, que não pendura mais a música numa setlist alheia; a **estrela**
favorita e desfavorita, sem otimismo, com a falha dita pela espécie; e **todo arquivo da biblioteca fica no aparelho**
depois de um sync com rede, dentro do teto de 200 MB. A Cifra editada no site chega ao palco com o texto novo. O tablet
deitado é o de antes (G-inv 34/34 e 18/18 em toda PR de tela), e o em pé ganhou as telas novas em B.

**As 14 PRs** `[medido: gh pr view <n> --json commits,mergeCommit,mergedAt; git diff --shortstat M^1 M -- . ':!docs']`, em
ordem de número (que é a de merge). **Linhas** = sem `docs/`. **it** = linhas `it(`/`test(` acrescentadas em `*.test.ts(x)`.

| PR | nome | merge | commits | o que fez | linhas | it | anexo | divs. |
|---|---|---|---|---|---|---|---|---|
| **#353** | pre-check | `ea34421` | 3 (`2fce586` · `ab76b48` · `afb8130`) | Fase A, Fase B em prod pela regra 12; o recorte (N4-D5); **N4-D1…D46** | 0 | 0 | [`N4-PRECHECK.md`](N4-PRECHECK.md) | 956–982 |
| **#354** | PR-1 — gates | `3e3390d` | 4 (`0975e96` · `d44271a` · `955f8f8` · `1a2c1ee`) | **G-par** (entrando reprovado) e o gate do corpo do favoritar byte a byte; **N4-D47** | +420 | 4 | [`N4-PR1-anexos/`](N4-PR1-anexos/README.md) | 983–987 |
| **#355** | PR-2 — o leitor | `31d6b3a` | 5 (`150328b` · `cdee665` · `dae7009` · `050980e` · `9001913`) | o contrato de leitura do core lê `sections[]` da Cifra (**defeito de prod 1**, abaixo); **N4-D48…D53** | +247 −13 | 16 | [`N4-PR2-anexos/`](N4-PR2-anexos/README.md) | 988–995 |
| **#356** | release no Tab | `fab51e3` | 1 (`c9a4edd`) | o release da `main` `31d6b3a` no Tab, sem Metro; **N4-D54, D55** | 0 | 0 | [`N4-RELEASE-anexos/`](N4-RELEASE-anexos/README.md) | 996–998 |
| **#357** | brief | `42d1c39` | 3 (`fea2073` · `fbbb2a3` · `d5ec73d`) | capturas, medidas e o texto do brief; **N4-D56, D57** | 0 | 0 | [`N4-BRIEF.md`](N4-BRIEF.md), [`N4-BRIEF-anexos/`](N4-BRIEF-anexos/README.md) | 999–1003 |
| **#358** | desenho congelado | `0a37342` | 3 (`a36cd89` · `22c4482` · `3b5ea5b`) | `DESIGN-N4` (147 molduras normativas, `SHA256SUMS`), `N4-REQUISITOS.md` no lugar de PRD; **N4-D58…D84**; **N4-E1…E8** | 0 | 0 | [`DESIGN-N4/README.md`](DESIGN-N4/README.md), [`N4-REQUISITOS.md`](N4-REQUISITOS.md) | 1004–1028 |
| **#359** | PR-3 — core das frases | `bf678e3` | 5 (`f7803d0` · `4ccfe9b` · `5d96a70` · `d0012e7` · `a5eed4c`) | o vocabulário de content e as frases do N4 no core, o contrato da `LinhaDeAviso`; **N4-D85** | +941 −29 | 16 | [`N4-PR3-anexos/`](N4-PR3-anexos/README.md) | 1029–1040 |
| **#360** | PR-4 — identidade | `364e5c7` | 6 (`9fc5cfe` · `08d8780` · `a267e6e` · `66e4b9e` · `54ce0d1` · `b83f51a`) | a estrela, o tocar, os quatro ícones de tipo, as três medidas inexistentes; a base do G-inv **em par**; **N4-D86, D87** | +934 −62 | 11 | [`N4-PR4-anexos/`](N4-PR4-anexos/README.md) | 1041–1056 |
| **#361** | PR-5 — core da biblioteca | `d78ea89` | 8 (`d9a8a98` … `b6ebde7`) | lista, filtros, busca; o favoritar (escrita, estado, cache); **todo arquivo garantido** (N4-R26); o conserto da 1065; **N4-D88…D92** | +2259 −52 | 74 | [`N4-PR5-anexos/`](N4-PR5-anexos/README.md) | 1057–1068 |
| **#362** | PR-6 — palco avulso | `5c707a3` | 6 (`a3c2d0f` … `26ed2b8`) | o palco avulso **sem hospedeira** (**defeito de prod 2**, abaixo) e a sua busca; o estado de formato; **N4-D93…D95**; **N4-E9** | +759 −66 | 26 | [`N4-PR6-anexos/`](N4-PR6-anexos/README.md) | 1069–1080 |
| **#363** | PR-7 — a biblioteca (L) | `836d5e6` | 15 (`ab5ed96` … `92ed8ab`) | a tela L; `Buscar música` abre a L (N4-R1); a lista acima do teclado; o arnês que só apaga o que criou; **N4-D96…D98**; **N4-E10, E11** | +1940 −69 | 46 | [`N4-PR7-anexos/`](N4-PR7-anexos/README.md) | 1081–1097 |
| **#364** | PR-8 — a visualização (V) | `5c41c2d` | 16 (`5769ec3` … `7d0b4f4`) | a tela V; a linha da L abre V (N4-R6); o ▶ inerte; a receita do cache sem dado real; **N4-D99…D102**; **N4-E12** | +2216 −252 | 51 | [`N4-PR8-anexos/`](N4-PR8-anexos/README.md) | 1098–1120 |
| **#365** | PR-9 — o aceite | `cf58f7f` | 8 (`b311f50` … `59ab852`) | estados transversais, a troca por espécie nas quatro telas antigas, o conserto da 1063, **a contagem de quedas nativas**, os 28 aceites, **a prova do favoritar em prod**; **N4-D103…D106** | +299 −60 | 8 | [`N4-PR9-anexos/`](N4-PR9-anexos/README.md) | 1121–1135 |
| **#366** | encerramento | — (sem merge) | `473eea5` · o commit 2 | **o release no Tab** (A-N4-28) e este documento | 0 | 0 | [`N4-ENCERRAMENTO-anexos/`](N4-ENCERRAMENTO-anexos/README.md) | 1136–1142 |

**Código**: 8 PRs (#354, #355, #359–#365); só docs: 6 (#353, #356, #357, #358 e esta). Linhas de código do bloco (sem
`docs/`): **+10 015 −603**; testes acrescentados: **252** `it`/`test`.

**Os dois defeitos de produção que o bloco consertou no caminho** — os dois achados por leitura no pre-check e medidos no
aparelho antes do conserto:

1. **A Cifra editada no site chegava ao palco com o texto velho** (div. **975**, `N4-PRECHECK.md:1082`): o editor do site
   grava `sections[]` e não regrava o `chords` do topo, que era o que o palco lia. **Consertado na PR-2** (#355, `cdee665`,
   N4-D40): o contrato de leitura do core lê as seções com a precedência, a ordem e a junção do web. A prova no Tab: a
   Cifra de seções do ordinal 3 com **2029** caracteres no palco, igual ao web, contra **2027** do leitor velho; o ordinal
   8 com **32** contra **10**; e a edição ao vivo do Marcel no site chegou ao palco — *"É o texto que eu editei"*
   (`N4-PR2-anexos/README.md` §7). O release sem Metro repetiu os mesmos números (`N4-RELEASE-anexos/README.md` §4).
2. **O palco avulso pendurava a música numa setlist alheia** (divs. **964**, `N4-PRECHECK.md:616`, e **1001**,
   `N4-BRIEF-anexos/README.md:137`): aberto de S1, usava a primeira setlist como hospedeira — o nome dela na barra, o índice
   dela, o prefetch dela (todo abrir, até de uma Letra, dava `prefetch plan n=1` e o `download-error` de um arquivo da
   setlist alheia) — e com zero setlists caía num *placeholder* sem saída. **Consertado na PR-6** (#362, `155ce71`,
   N4-R16): a rota avulsa sem setlist, o voltar à origem, o prefetch só da música; zero setlists abre
   (`N4-PR6-anexos/README.md` §2.1, §5.2). Nesta PR, no Tab, com o release: o ▶ de V abre o palco avulso **sem `indice`**,
   com `prefetch plan n=0 reason=demand` (`N4-ENCERRAMENTO-anexos/README.md` §6).

E um terceiro, menor, da PR-9: **o 404 do download chegava como "não consegui baixar" sem o motivo** (div. 1063 → 1122;
`527cf93`): o status vem na segunda linha da mensagem do Android.

---

## 2. Os gates na ponta da `main`

Tudo `[medido]` nesta sessão, na árvore desta PR (`cf58f7f` + só docs), saída literal em
[`N4-ENCERRAMENTO-anexos/gates.txt`](N4-ENCERRAMENTO-anexos/gates.txt). Os gates de dump leem os dumps finais commitados
da N4-PR9 (`N4-PR9-anexos/dumps-g-inv/`, o código final): nenhum aparelho para eles.

| gate | comando | resultado |
|---|---|---|
| **G-inv** (B5) | `sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B5-baseline docs/native/N4-PR9-anexos/dumps-g-inv` | `G-inv: 34 de 34 idênticos` · `IDÊNTICO EM DP ✓` |
| **G-inv** (B3, o palco) | `… B3-referencia-paisagem …` | `G-inv: 18 de 18 idênticos` · `IDÊNTICO EM DP ✓` |
| **`g-inv-par`** | `node apps/native/scripts/g-inv-par.mjs … B5-baseline … dumps-g-inv` | `g-inv-par: 8 medidos · todo par provado ✓` (a N4-D69) |
| **G-N3** | `node apps/native/scripts/g-n3.mjs --pai … --faixa … --rolada …` (os três sobre `dumps-g-inv`) | `G-N3: (e)=0 · (b)=0 · nome-acessível=8 · rolagem=6 ✓` |
| **G1** | `sh apps/native/scripts/g1.sh cf58f7f WORKTREE` | `G1a: DIFF VAZIO ✓` em 63 arquivos derivados · `G1b: só adição ✓` |
| **G2 / G3** | `sh apps/native/scripts/g2g3.sh cf58f7f WORKTREE` | `testIDs antes=121 depois=121` ✓ · `log( antes=70 depois=70` · `nenhuma linha sumiu ✓` |
| **G2 / G3, o bloco** | `g2g3.sh 046797e WORKTREE` (o ponto de partida: o merge do encerramento do I1) | **G2 80 → 121** ✓ (só adição) · **G3 68 → 70**: quatro linhas novas (as três do favoritar e a `prefetch plan … reason=library`) e duas trocadas **em par** (`ratelimit … family=setlist-mutate` → `family=${familia}`; `reason=7d` → `reason=library`) — declaradas no corpo da #361 (N4-PR5) e no catálogo ("Errata N4-PR5"); a rodada à mão, sem as declarações, as acusa (exit 1), como deve |
| **`gate:a20`** | `node scripts/a20.mjs .` (em `apps/native`) | 229 literais examinados · **0 acusações** |
| **`gate:icones`** | `node scripts/icones.mjs ../../packages/identidade/src/icones.ts` | **0 acusações · 0 avisos** |
| **`SHA256SUMS`** | `shasum -a 256 -c` | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · **`-N4` 2** · `docs/ux/DESIGN-I1` 14 · `N3-PRECHECK-anexos` 355 — todos `OK` |
| **G-back** | `sh scripts/gates-web/g-back.sh 046797e WORKTREE` | `✓ nenhuma` · `G-back: PASSA` — o N4 não tocou backend |
| **G-palco** | `sh scripts/gates-web/g-palco.sh` | `G-palco: PASSA — 0 ocorrências` |
| **G-tok** · cobertura | `node scripts/gates-web/g-tok.mjs` · `g-tok-cobertura.mjs` | `G-tok: PASSA` (133 arquivos, 0 · 0 · 0) · cobertura `FORA: 0` · `PASSA` |
| **CSS gerado** | `vitest run --project identidade packages/identidade/test/css.test.ts` | 4 ✓ |
| **G-faixa** | `node scripts/gates-web/g-faixa-veredito.mjs tests/gates-web/medicoes` | `G-faixa: PASSA` (14 medições; o N4 não mudou o site) |
| **`tsc`** | raiz · `packages/core` · `packages/identidade` · `apps/native` | 0 · 0 · 0 · 0 |
| **lint** | `pnpm lint` | `✔ No ESLint warnings or errors` |
| **a suíte** | `pnpm test` | `Test Files 139 passed \| 3 skipped (142)` · `Tests 1669 passed \| 59 skipped (1728)` |

**Contra o começo do bloco** `[lido: I1-ENCERRAMENTO.md §1; N4-PR9-anexos/README.md §12.1]`: a suíte foi de **1239**
casos (1181 ✓, `c1640e5`) a **1728** (1669 ✓); os testIDs do app de 80 a 121; as linhas de log de 68 a 70; o anexo D do
`gate:icones` de 39 a **41** registros (+2 do `DESIGN-N4`, N4-D76); os congelados de 3 pastas nativas a 4.

---

## 3. Os 26 requisitos e os 28 aceites

**Requisitos** (`N4-REQUISITOS.md` §1; a PR que fechou cada um, `[lido: N4-PR9-anexos/README.md §8]`):

| | requisito | fechado na |
|---|---|---|
| N4-R1 | `Buscar música` abre L; S1 não muda | PR-7 |
| N4-R2 | L abre sem teclado | PR-7 (errata do mecanismo) |
| N4-R3 | a composição de L | PR-7 |
| N4-R4 | ordem alfabética pt-BR | PR-5 (core) · PR-7 (tela) |
| N4-R5 | os cinco filtros | PR-3 · PR-5 · PR-7 |
| N4-R6 | a linha | PR-7 · PR-8 · PR-9 |
| N4-R7 | favoritar sem otimismo | PR-5 · PR-7/8 · PR-9 (em prod) |
| N4-R8 | a falha por espécie | PR-5 · PR-7/8 · PR-9 (cinco no aparelho; a *rede* em teste) |
| N4-R9 | sem rede | PR-7 · PR-8 |
| N4-R10 | os estados de sync de L | PR-7 |
| N4-R11 | a busca de L | PR-5 · PR-7 |
| N4-R12 | o cabeçalho de V | PR-8 |
| N4-R13 | o corpo de V | PR-8 |
| N4-R14 | os campos de V | PR-8 |
| N4-R15 | corpo e arquivos em V | PR-8 · PR-9 (div. 1063) |
| N4-R16 | o palco avulso | PR-6 |
| N4-R17 | a S4 do avulso | PR-6 |
| N4-R18 | os ícones novos | PR-4 (julgados na PR-7) |
| N4-R19 | os ícones de tipo | PR-4 |
| N4-R20 | os tokens | PR-4 · PR-7 · PR-8 |
| N4-R21 | as frases | PR-3; as 39 do tablet fora do core (div. 1029): **23 movidas** — PR-6 linhas 1–3, PR-7 4–17, PR-8 18–23 (`N4-PR6-anexos` §2.4; `N4-PR7-anexos:108`; `N4-PR8-anexos:125`); **as 16 só de S1 ficam fora do N4-R21** (div. 1040) — **a tabela fecha zerada nas três PRs** |
| N4-R22 | testIDs | PR-7 · PR-8 |
| N4-R23 | invariante C | todas; PR-9 34/34 · 18/18; e a ponta, §2 |
| N4-R24 | B por superfície; A não quebra | PR-6/7/8 · PR-9 (a lista de A, `N4-PR9-anexos` §10) |
| N4-R25 | as estimadas | PR-7 · PR-8 |
| N4-R26 | todo arquivo no aparelho | PR-5 (core) · PR-9 (aparelho) |

**Aceites** (`N4-REQUISITOS.md` §2; a evidência de A-N4-1…27 é a tabela do `N4-PR9-anexos/README.md` §7, que não se
copia aqui). **Os 28**:

| # | veredito | onde está a evidência |
|---|---|---|
| A-N4-1 … A-N4-7, A-N4-9 … A-N4-25 | **✓** (25) | `N4-PR9-anexos/README.md` §7, linha a linha |
| A-N4-8 | **✓ com a errata** (a espécie *rede* não se alcança pelo toque; provada em teste) | idem; errata no `N4-REQUISITOS.md` §3 |
| A-N4-24 | **✓ com a herança da N4-D105** (a queda nativa do dev client; o release desta PR passou 100 + 100) | idem; §10 daqui |
| **A-N4-26** | **✓** — o executor: `N4-PR9-anexos` §4.3–§4.4; **o Marcel: "sem objeto neste dado"** (a conta dele tem 1 arquivo, já no aparelho: `prefetch plan n=0`), com as duas medições ao lado — o teto no AVD (14 PDFs, 5 *não baixado*) e os 4 arquivos da conta de audit em 2,3 s; **herança** para quando a biblioteca tiver mais arquivos (§10) `[Marcel, 2026-10-07]` | `N4-ENCERRAMENTO-anexos/README.md` §7.1 |
| A-N4-27 | **✓** — o favoritar em prod, 2 escritas, 6 `GET` | `N4-PR9-anexos/README.md` §6 |
| **A-N4-28** | **✓** — o release `cf58f7f` (`070187bf…`) no Tab por `install -r`, sem Metro e sem `reverse`; S1 sem login; L, V, o avulso e o palco com setlist; **100 + 100 aberturas frias, 0 queda nativa** (N4-D105 d); o Tab fica com o release. E o julgamento: *"está tudo funcionando bem"* | `N4-ENCERRAMENTO-anexos/README.md` §2–§7 |

(A-N4-8 e A-N4-24 estão nas duas linhas: o "✓" da primeira e a ressalva da sua.) **26 de 26 requisitos fechados; 28 de 28
aceites com veredito.**

---

## 4. Decisões N4-D1…D106

`[medido]`: `grep -noE 'N4-D[0-9]+'` nos 16 documentos do bloco → **106 números, de N4-D1 a N4-D106, sem lacuna**, nenhum
definido duas vezes com sentidos diferentes; nada acima de D106 em `docs/`. *(Depois do aval: mais **oito**, N4-D107…D114, que vivem no §15 — 114 no bloco.)* O texto de cada uma vive **só** na coluna
"onde"; o rótulo é para achar a linha.

| # | rótulo | onde o texto vive |
|---|---|---|
| D1 | ordem: N4 → N5 → iOS; W5 em paralelo | `N4-PRECHECK.md` §0 |
| D2 | o N4 recebe o `I1-ENCERRAMENTO` §10.2 itens 1–4 | idem |
| D3 | o nativo consome `packages/identidade`; nenhum token fora | idem |
| D4 | web só online; backend ao Bloco D | idem (exceção: D69) |
| D5 | o recorte: a biblioteca no tablet | idem |
| D6 | os quatro tipos com PDF, pela medição no palco | idem |
| D7 | errata do `N2-ENCERRAMENTO` §10.2: itens 1–5 ao Bloco D | idem |
| D8 | a visualização é tela própria; visualizar ou tocar | idem |
| D9 | offline total se couber, senão "não baixada" | idem (errata: D27 → D42 → D82) |
| D10 | o teto de 100 do `GET /api/content` fica, com aviso | idem (errata: D28) |
| D11 | a entrada da biblioteca é do desenho | idem (errata: D59; D73) |
| D12 | faixas: desenha A, B, C; implementa C e B | idem |
| D13 | a quebra de linha na letra: bloco próprio entre N4 e N5 | idem |
| D14 | frases de content num módulo do core, byte a byte | idem |
| D15 | o motivo: vence a forma do nativo | idem (errata: D29) |
| D16 | `LinhaDeAviso`: só o contrato no core | idem |
| D17 | os três `undefined` se decidem no congelamento | idem (D64) |
| D18 | brief e desenho próprios; requisitos no lugar de PRD | idem |
| D19 | gates G-inv, G-N3, G-par, G-back; em prod só o favoritar | idem |
| D20 | o fatiamento original | idem (errata: D32 → D45 → D72) |
| D21 | favoritar e desfavoritar no tablet | idem |
| D22…D39 | o aval da Fase B (favoritar por `PUT`; só online; o leitor do palco em V; o avulso sem hospedeira — D30; compasso/capo/afinação não — D31; o `updated_at` ao Bloco D — D39 …); D27, D28, D29, D32 são erratas de D9, D10, D15, D20 | `N4-PRECHECK.md` §9 |
| D40…D46 | o leitor lê `sections[]` (D40); gates e leitor já (D41); todos os arquivos garantidos (D42); o estado de formato (D43); a Tab e o `chords` ao Bloco D (D44); errata do fatiamento (D45); autorizações (D46) | `N4-PRECHECK.md` §16 |
| D47 | tipo fora do enum sai do par | `N4-PR1-anexos/README.md` §1.5 |
| D48…D53 | a fixture do G-par com duas seções; a Cifra escaneada fora do par; a lista de reprovados vazia; seções sem texto; a 988 ao W5; o executor mede no Tab | `N4-PR2-anexos/README.md` §10 |
| D54, D55 | o executor mede no bloco inteiro; **o Tab repousa com o release** | `N4-RELEASE-anexos/README.md` §7 |
| D56, D57 | a prova do release em avião e com rede (2 `GET`); as notas só em V, o palco ao encerramento | `N4-BRIEF-anexos/README.md` §4 |
| D58…D71 | as catorze do desenho (ícone como ação; `Buscar música` abre a L — D59; L sem teclado; …; os ícones novos — D68; os de tipo — D69; o código de cores fora — D70; os itens ao bloco de identidade — D71) | `DESIGN-N4/README.md` §3 |
| D72…D84 | o aval do congelamento (o fatiamento final — D72; …; a garantia vira requisito — D82; o formato também no palco com setlist — D83; a PR-9 com a prova em prod e o release — D84) | `DESIGN-N4/README.md` §13 |
| D85 | o nome acessível do chip *Favoritas* | `N4-PR3-anexos/README.md` §2.4 |
| D86, D87 | o traço dos ícones de tipo; a estrela cheia inerte no catálogo | `N4-PR4-anexos/README.md` §0 |
| D88…D92 | o plano: 7 dias primeiro, para no teto; o log do favoritar; a busca de L sem o corte de 50; a 1065 consertada; a 1066 à PR-7 | `N4-PR5-anexos/README.md` §0 |
| D93…D95 | o vermelho do Codecov; o login de audit no celular persiste; a página do PDF do avulso em B na linha 1 | `N4-PR6-anexos/README.md` §0 |
| D96…D98 | o arco da estrela; o `maxWidth` 560; **a receita do cache aprovada** | `N4-PR7-anexos/README.md` §0 |
| D99…D102 | `view.grade`; o rótulo em 13; o pressionado a 6 %; **a receita do cache sem dado real** | `N4-PR8-anexos/README.md` §0 |
| D103…D106 | o release ao encerramento; o par à mão da "setlist sumiu"; **a queda nativa**; o teto pela fixture | `N4-PR9-anexos/README.md` §0 (a D106 foi dada antes da D105; a numeração explicada lá) |
| D107…D114 | o aval do encerramento: os destinos; o A-N4-26 no N5; **a ordem depois do N4**; as escritas do Marcel; o I1 no `CI-FAIXA`; a errata da 1140; o catálogo; a 1142 ao pre-check da quebra | §15 daqui |

**As mudadas por errata** (a decisão posterior que muda a anterior; o texto das duas fica onde está):

| decisão | mudada por | o quê |
|---|---|---|
| N4-D9 | **D27**, depois **D42** (estendida pela **D82**) | de "offline se couber" a "todo arquivo garantido", requisito próprio (N4-R26) |
| N4-D10 | **D28** | a linha de aviso do teto sai do nativo (o sync pagina tudo, div. 958) |
| N4-D11 | **D59**; a errata do G-inv que pedia caiu na **D73** | `Buscar música` absorve a entrada |
| N4-D15 | **D29** | o core guarda o motivo isolado; o web não muda |
| N4-D17 | **D64** | as três medidas inexistentes por desenho |
| N4-D20 | **D32** → **D45** → **D72** | o fatiamento, três vezes |
| N4-D25 | **D40** | o leitor do G-par é o do core, lendo `sections[]` |
| N4-D33 | **D59** | a entrada não convive: absorve |
| N4-D34 | **D43** | o estado de formato pela extensão |
| N4-D43 | **D83** (estendida) | o formato também no palco com setlist |
| N4-D53 | **D54** (estendida) | o executor mede no bloco inteiro |
| N4-D68 | **D76** | a estrela é um registro com dois estados |
| N4-D84 | **D103** | o release sai da PR-9 e vem ao encerramento |
| N4-D98 | **D102** (completada) | a receita do cache em duas partes |

E uma exceção declarada, não errata: a **D4** (web sem mudança) com a **D69** (os ícones de tipo mudam também no site).

---

## 5. Erratas da folha — N4-E1…E12

Todas no `DESIGN-N4/README.md` §6 `[medido: grep -n 'N4-E[0-9]+' — E1…E12; a E13 aparece só como "a próxima livre"]`.
Efeito como no N3: **comportamento** (o app faz outra coisa que a moldura), **medida** (a régua ou o dump corrigiu um
valor), **leitura** (qual das duas fontes vale).

| # | PR | o quê | div. | efeito |
|---|---|---|---|---|
| E1 | desenho | S1 vazia é a do app de hoje, não a do V1 | 1007 | leitura |
| E2 | desenho | o palco com setlist em A mantém o artista (vale `N3-A-S3`) | 1008 | leitura |
| E3 | desenho | a tinta do palco no claro é `#100F16` | 1009 | leitura |
| E4 | desenho | o controle do palco mede 66 no dump, não 64 | 1010 | medida |
| E5 | desenho | *"1 resultado"* já existe na S4 | 1011 | leitura |
| E6 | desenho | os ícones existentes valem pelo catálogo | 1012 | leitura |
| E7 | desenho (aval, N4-D77) | `L-linhas` normativas; S3/S2-ícones são amostras | 1017 | leitura |
| **E8** | desenho (aval, N4-D78) | o *Baixar* de V é o ícone `baixar-setlist`, não a palavra | 1024, 1025 | **comportamento** |
| **E9** | PR-6 (N4-D95) | a página do PDF no avulso em B fica na linha 1 | 1073 | **comportamento** |
| E10 | PR-7 | os chips de filtro medem menos; cabem numa linha em B | 1083 | medida |
| E11 | PR-7 | o teclado cobre 279,1 em C e 320,4 em A, não 300 | 1084 | medida |
| E12 | PR-8 | o leitor de V em C mostra 55 colunas, não ≈ 56 | 1101 | medida |

**Mudaram comportamento duas**, E8 e E9 — a E9 só em B, com o G-inv 34/34 e 18/18 provado depois. As outras dez **só
mediram ou leram**. A nota do `N4-REQUISITOS.md` (*"as erratas de medida começam na N4-E9"*) ficou velha na PR-6 — a E9
saiu de composição —, e o próprio parágrafo da E9 no `DESIGN-N4` registra a mudança para a E10.

---

## 6. Divergências 956–1142

### 6.1 A contagem

`[medido]`, a coluna de origem lida na célula de cada linha de tabela, a primeira ocorrência de cada número:

```
$ git grep -nE '^\| \*\*(9[5-9][0-9]|1[01][0-9]{2})\*\*' -- docs | wc -l
188     ← 180 do N4 (956–1135) + 6 do I1 (950–955) + 2 larguras de tabela do I1 ("| **1138** (C) |")
$ … | awk '$1>=956 && $1<=1135' | sort -nu
180 números, cada um uma vez · nenhum só em prosa · nenhum sem letra
P 47 · D 55 · A 30 · T 47 · X 1
```

| PR | faixa | P | D | A | T | X | total |
|---|---|---|---|---|---|---|---|
| pre-check | 956–982 | 14 | 2 | 10 | 1 | | 27 |
| PR-1 | 983–987 | 2 | 1 | | 2 | | 5 |
| PR-2 | 988–995 | 4 | | 1 | 3 | | 8 |
| release | 996–998 | 1 | 1 | 1 | | | 3 |
| brief | 999–1003 | 2 | 1 | 1 | 1 | | 5 |
| desenho | 1004–1028 | 7 | 15 | 1 | 2 | | 25 |
| PR-3 | 1029–1040 | 5 | 4 | | 3 | | 12 |
| PR-4 | 1041–1056 | 2 | 5 | 2 | **7** | | 16 |
| PR-5 | 1057–1068 | 3 | 4 | 2 | 3 | | 12 |
| PR-6 | 1069–1080 | 2 | 4 | 1 | 4 | 1 | 12 |
| PR-7 | 1081–1097 | 2 | 6 | 4 | 5 | | 17 |
| PR-8 | 1098–1120 | 1 | **10** | 3 | **9** | | 23 |
| PR-9 | 1121–1135 | 2 | 2 | 4 | 7 | | 15 |
| encerramento (esta PR) | 1136–1142 | 3 | 2 | | 2 | | 7 |
| **N4** | | **50** | **57** | **30** | **49** | **1** | **187** |

Os negritos são a div. 1140: as linhas de contagem do README da PR-4 (*"T 8"*, que soma 17) e da PR-8 (*"D 9 · T 10"*)
não batem com a coluna das próprias tabelas; vale a coluna.

**O D cresceu** (14 de 85 no N3; 92 de 458 no I1; **57 de 187** aqui): 15 delas são do desenho, a folha conferida contra o
app e o catálogo antes do congelamento (seis viraram E1…E6), e 10 da PR-8, a folha de V contra a tela. **O T** segue o do
N3 — o aceite é aparelho, em três aparelhos, e cada queda de arnês virou divergência. **O A** carrega os defeitos: os dois
de prod (975, 964/1001), a queda nativa (1126), o furo da receita do cache (1113), o sync que desfazia o favorito (1065).
**X** uma só: o Codecov (1072).

### 6.2 As que ensinaram (viraram decisão, errata, regra ou caso)

| div. | virou | onde |
|---|---|---|
| 958, 959, 960 | N4-D27, D28 (o teto de 100 e o "offline" eram outros) | `N4-PRECHECK.md` §9 |
| 961 | N4-D29 | idem |
| 964, 1001 | N4-R16 — **defeito de prod 2**, consertado na PR-6 | `N4-PR6-anexos/` |
| 965, 983 | o G-par e a N4-D47 | `N4-PR1-anexos/` |
| 975 | N4-D40 — **defeito de prod 1**, consertado na PR-2 | `N4-PR2-anexos/` |
| 976 | N4-D44: a Tab editada que nenhum leitor vê, **primeira da fila do Bloco D** | `N4-PRECHECK.md` §16 |
| 990, 991 | N4-D48, D49 | `N4-PR2-anexos/` §10 |
| 1007…1012, 1017, 1024/1025 | N4-E1…E8 | `DESIGN-N4/README.md` §6 |
| 1021 → 1049 | a errata **em par** da base do G-inv (o G-inv **vê** a troca de desenho de ícone: conta `PathView`) — proposta de regra 33 (§8) | `N4-PR4-anexos/` §4.5 |
| 1058, 1061, 1062 | N4-D88, D89, D90 | `N4-PR5-anexos/` §0 |
| 1065 | N4-D91 (o sync que atravessava o favoritar) | idem |
| 1068 | *push primeiro, corpo depois* — proposta de regra 37 | `N4-PR5-anexos:393` |
| 1072 | N4-D93 | `N4-PR6-anexos/` §0 |
| 1073, 1083, 1084, 1101 | N4-E9…E12 | `DESIGN-N4/` §6 |
| 1097 | N4-D98 e o `apagar_por_nome` — proposta de regra 34 | `N4-PR7-anexos/`; `APARATO.md` |
| 1113, 1119, 1120 | N4-D102, a receita do cache sem dado real — proposta de regra 35 | `N4-PR8-anexos/` §5.7; `APARATO.md` |
| 1122 (a 1063) | o conserto `527cf93`; errata no `LOGS-OCTAVIA.md` | `N4-PR9-anexos/` |
| 1126 | **N4-D105** — a contagem de quedas nativas; a condição do A-N4-28 — proposta de regra 36 | `N4-PR9-anexos/` §5; `APARATO.md` "logcat" |
| 1127 | N4-D106 | `N4-PR9-anexos/` §0 |
| 1139 | as corridas do I1 e do N4 no `CI-FAIXA.md` (§9) | esta PR |

### 6.3 Onde o revisor errou — origem P (50)

`[medido: a coluna P das tabelas]`: 956 957 958 959 960 961 967 968 969 972 973 974 979 982 983 985 988 989 992 993 996
1000 1003 1004 1005 1006 1017 1023 1026 1027 1029 1030 1031 1039 1040 1042 1056 1059 1060 1064 1069 1079 1089 1092 1117
1127 1133 1136 1138 1141. O que se repete (leitura desta PR, não medição):

| o padrão | divs. | o que ensinou |
|---|---|---|
| **o prompt presumiu o estado do código sem lê-lo** | 956 (o `normalize` não é o leitor), 957 (o picker do nativo não pede 1000), 958 (o teto de 100 não limita o nativo), 959 (não há teto de download desde o W1), 960 (o texto já está todo no aparelho), 961 (o nativo não tem a forma composta), 967, 968 (o avulso e a busca já existiam), 969, 1030, 1031 (`'  ·  '`, dois espaços), 1042 (o picker não tem ícone de tipo), 1127 (o teto é constante do app) | **as cinco primeiras mudaram decisão** (N4-D27…D29): o pre-check que lê o código antes de responder vale mais que a pergunta bem feita. O padrão é o do N3 (22 de 33 lá) |
| **o prompt citou o que o documento não tem** | 972 (não há regra 7), 973 (não há §10.1.2), 1004 (a errata era da D32, não da D45), **1141** (o "nome padrão da seção" não é herança do N4 — é do I1 §10.1 item 3) | a lição da div. 397 do N3: citação de seção se confere com `grep` antes |
| **o prompt contou errado** | 992 (15 → 16 itens), 1026 (dois aceites, um numerado), 1027, 1089 (8 → 12 commits), 1133 (4 → 6 `GET`), 1138 (uma escrita → três) | a contagem se faz na fonte; o orçamento de prod se revê **antes** de qualquer requisição (1133 o fez) |
| **"nenhum outro arquivo muda" que não podia valer** | 1003, 1006, 1023, 1064 | o prompt que fecha a lista de arquivos tem de prever o `SHA256SUMS`, o README e o congelado que a mudança deixa velho |
| **o aparelho, presumido** | 974, 979, 982, 985, 988, 989 (o APK do CI é dev client), 993, 1000 e **1136** (o release sincroniza ao abrir), 1059, 1060, 1069, 1079, 1092 (a espécie *rede* não se alcança pelo toque), 1117 | o release **sempre** sincroniza ao abrir com rede: prova sem requisição se faz em avião (N4-D56) — e a ordem dos passos de um prompt de release tem de saber disso |
| de formulação | 996, 1005, 1017, 1029, 1039, 1040, 1056 | — |

### 6.4 As de instrumento — o que o bloco aprendeu medindo

O N4 mediu com **gates que ele mesmo escreveu** (G-par, o gate do corpo, `g-inv-par`, a contagem de quedas) e com arneses
em três aparelhos. As que ensinaram sobre o instrumento:

- **Gate que vê menos do que diz** — **1126** (a subcadeia `FATAL` não pega o SIGSEGV: 17 "FATAL 0" em cinco PRs que não
  viam queda nativa, e nenhum anexo guardava logcat bruto para recontar), **977/1035** (o G-tok e o `gate:a20` não liam
  `packages/core`), **990** (a fixture do G-par com uma seção só não exercia a junção). → caso 38 e 39 (§8).
- **Gate que vê mais do que se pensava** — **1021 → 1049**: o desenho dizia que o G-inv não via a troca de ícone; vê
  (conta os `PathView` dentro do `SvgView`), e 8 dumps da base reprovaram. A resposta não foi relaxar o gate: foi a
  **errata em par da base**, com gate próprio (`g-inv-par`). → caso 40 e regra 33.
- **Gate que conta o que não é** — **1034** (o G-tok lê genérico de TS como texto de JSX), **1109** (o G3 conta `log(`
  em comentário). → caso 41; os dois ao W5.
- **CN que não reprova** — **1081, 1110** (o duplo do `FlatList` ignorava o cabeçalho; a planta não exercia o otimismo):
  um CN verde antes do conserto não prova nada. → caso 42.
- **O arnês que apaga demais** — **1097**: o `rm` da primeira forma do arnês da L levou o PDF do Marcel (voltou md5 a
  md5). → regra 34. **E o que lê demais** — **1113**: com o `content.json` real no aparelho, uma abertura fora de ordem
  buscou em prod o que a lista real dizia existir. → regra 35.
- **O `adb` e o shell** — **1119** (o `adb shell` come o stdin num `while read`), **1120** (o `exec-in` volta antes do
  `cat` remoto acabar), **1077** (o `reverse` some no meio da rodada), **1124** (o mock pelo `reverse` responde em avião).
  Todas no `APARATO.md`.
- **Reconhecer a tela pelo id errado** — **1137** (esta PR): o S2 também tem `buscar`. → caso 43.

---

## 7. A contabilidade de prod do bloco

`[lido]` das tabelas de contabilidade de cada anexo (linha citada), e `[medido]` nesta PR:

| sessão | `/api/*` (`GET` · `PUT`) | escritas | storage | logins | fonte |
|---|---|---|---|---|---|
| pre-check, commit 1 | 0 | 0 | 0 | 0 | `N4-PRECHECK.md:796` |
| pre-check, Fase B | 4 · 2 | **2** (audit, descartável) | 0 (`HEAD` k = 0) | 1 (Firebase, audit) | `N4-PRECHECK.md:1129–1133` |
| pre-check, commit 3 | 0 | 0 | 0 | 0 | `N4-PRECHECK.md:1207` |
| PR-1 | 0 | 0 | 0 | 0 | `N4-PR1-anexos/README.md:282` |
| PR-2 | 4 · 0 | 0 do executor; **1 do Marcel** (a edição no site, durante o aceite) | — | 0 | `N4-PR2-anexos/README.md:296–299` |
| release | 2 · 0 | 0 | — | 0 | `N4-RELEASE-anexos/README.md:324–327` |
| brief | 2 · 0 (N4-D56) | 0 | — | 0 | `N4-BRIEF-anexos/README.md:101–104` |
| desenho · PR-3 · PR-5 | 0 | 0 | 0 | 0 | `DESIGN-N4/README.md:550`; `N4-PR3-anexos:421`; `N4-PR5-anexos:404` |
| PR-4 | 2 · 0 (N4-D56) | 0 | — | 0 | `N4-PR4-anexos/README.md:436` |
| PR-6 | 2 · 0 (N4-D56) | 0 | — | 1 (**do Marcel**, no celular, N4-D94) | `N4-PR6-anexos/README.md:325–326` |
| PR-7 | 2 · 0 (N4-D56) | 0 | — | 0 | `N4-PR7-anexos/README.md:431` |
| PR-8 | 2 · 0 (N4-D56) | 0 | **1** (o PDF do Marcel, div. 1113) | 0 | `N4-PR8-anexos/README.md:448` |
| PR-9, a prova (A-N4-27) | 6 · 2 | **2** (audit, descartável `4dadcb78`) | 4 (265 002 B) | 0 | `N4-PR9-anexos/README.md` §6 |
| PR-9, N4-D56 no Tab | 2 · 0 | 0 | — | — | `N4-PR9-anexos/README.md:522` |
| **encerramento** (esta PR) | 2 · 0 | 0 do executor; **3 do Marcel** (pela estrela) | 0 | 0 | `N4-ENCERRAMENTO-anexos/README.md` §9 |
| **N4** | **30 `GET` · 4 `PUT`** | **4 do executor** (todas na conta de audit, no descartável); **4 do Marcel** (1 no site, 3 pela estrela) | **5** | **1 do executor** (audit, pre-check); **1 do Marcel** | |

E à parte, por não ser prod pelo app: na PR-4, o **site local** (`next dev` com o `.env.local` do Marcel) leu a conta dele
— `GET /api/profile` 65, `POST /api/auth/session` 65, 0 escritas, 0 respostas 429 (`N4-PR4-anexos/README.md:437`). **Nenhuma
escrita do executor fora da conta de audit; todo descartável ficou para o Marcel apagar** (`4dadcb78`, `N4-PR9-anexos` §6).

---

## 8. O catálogo — proposta para o `LOGS-OCTAVIA.md`

`[medido: grep]` a última regra é a **32** (*"O defeito do instrumento se conserta no instrumento"*, I1) e o último caso
do padrão *"instrumento com escopo menor do que parece"* é o **37** (div. 908, I1). **O N4 não acrescentou regra nem caso
numerado**: entraram três erratas de catálogo (as linhas do favoritar e o `reason=library`, "Errata N4-PR5"; o 404 no
ramo do status, "Errata N4-PR9") e as erratas do `APARATO.md`. **Proposta do encerramento** — numeradas na sequência,
**entram no `LOGS-OCTAVIA.md` só com o aval** (pergunta 7). *(Aval, N4-D113: as regras **33–37** e os casos **38–43**
entraram no `LOGS-OCTAVIA.md` no commit 3 desta PR — "As regras que o N4 firmou — 33 a 37" e a tabela do padrão; a **38**
fica de fora até o Marcel aprovar o texto integral, §15.)*

**Regras**

| # | regra (proposta) | origem |
|---|---|---|
| 33 | **Mudança decidida que muda a base do G-inv entra como errata em par da base, com gate próprio** — a base não se regrava nem o gate se relaxa: o par (velho → novo) se declara, o `g-inv-par` prova que só o declarado mudou, e o resto da base fica byte a byte | div. 1049 (N4-PR4: `66e4b9e` o gate, `54ce0d1` os 8 dumps); N4-D69 |
| 34 | **O arnês só apaga, por nome, o que criou** — lista fechada vinda do próprio teste, nenhum curinga, nenhuma pasta inteira do app; o passo confere que nada fora da lista sumiu (sentinelas) | div. 1097; N4-D98; `apagar_por_nome` (`N4-PR7-anexos/instrumentos/biblioteca.py`) |
| 35 | **Aceite com mock num aparelho com dado real começa sem dado real no aparelho** — guardar por cópia todo o cache, tirar do aparelho por nome, provar que o app aponta para o mock antes de qualquer abertura, e só regravar no fim, md5 a md5 | div. 1113; N4-D102; `receita-cache.sh` (`N4-PR8-anexos/instrumentos/`); `APARATO.md` |
| 36 | **Todo aceite no aparelho conta as quedas nativas** — a Java, a nativa (`Fatal signal`) e os tombstones, pelo `quedas.py`, com o `logcat -c` uma vez; "FATAL 0" por subcadeia não é contagem | div. 1126; N4-D105; `N4-PR9-anexos/instrumentos/quedas.py`; aplicada aqui (100 + 100) |
| 37 | **Quando a exceção do bloco ```` ```gates ```` é do commit novo, o push vem antes de editar o corpo da PR** — o gate roda no evento `edited` contra o head que estiver lá | div. 1068 (N4-PR5) |
| *38* | *(extra, declarado)* **O release sincroniza ao abrir com rede** — prova de release sem requisição se faz em avião, e a ordem dos passos de qualquer prompt de release conta com o sync da primeira abertura | divs. 1000, 1136; N4-D56 |

**Casos do padrão**

| # | div. | o instrumento | o que se leu × o que era |
|---|---|---|---|
| 38 | 1126 | a contagem `FATAL` dos arneses (N4-PR2…PR8 e o release) | "nenhuma queda" — a queda nativa escreve `Fatal signal`, sem a palavra; 17 "FATAL 0" que não viam a nativa |
| 39 | 977, 1035 | o G-tok e o `gate:a20` | "a frase está sob gate" — a frase que vai para o core sai do escopo dos dois |
| 40 | 1021 → 1049 | o G-inv | "não vê a troca de desenho de ícone" — vê (conta `PathView`): o instrumento media **mais** do que o desenho supunha (o 15 e o 19 pelo outro lado) |
| 41 | 1034, 1109 | o G-tok e o G3 | o genérico de TS lido como texto; o `log(` em comentário contado — superconjunto, como o 19 |
| 42 | 1081, 1110 | CNs da L e de V | "o CN reprova" — o duplo ou a planta não exerciam o caminho; verdes antes do conserto |
| 43 | 1137 | o reconhecimento de S1 por `buscar` (esta PR) | "estou em S1" — o S2 também tem `buscar` |

---

## 9. As corridas do bloco → [`CI-FAIXA.md`](CI-FAIXA.md)

**Regra 22**: as corridas do bloco estão no `CI-FAIXA.md`, linhas **126–150** (25 do N4), e mais as **119–125** — as sete
do I1, que o encerramento dele **não** pôs (div. 1139) `[medido: gh run list --workflow=native.yml --created
">=2026-09-26T12:14:00Z" · gh run view <id> --json jobs]`: 53 corridas do workflow, **32 com APK** (`success` no job), 21
`skipped` (pushes de docs e de instrumento depois do APK verde — a regra 18 pagando). **A referência, recalculada lá**:

```
n=128  mín 8m09s  máx 14m32s  mediana 12m30s  Q1 11m12,2s  Q3 13m15,5s  IQR 2m03,2s     (era n=96 · 12m20,5s · IQR 1m43s)
```

Só as do N4, como recorte: `n=25 · mín 8m22s · máx 14m11s · mediana 12m58s · IQR 2m47s`. **Nenhum segmento novo**: nem o I1
nem o N4 mudaram item da lista fechada (`git diff 53bf0d5 cf58f7f -- apps/native/package.json apps/native/app.json
.github/workflows/native.yml` só traz o `@octavia/identidade` de workspace e o `paths` do I1-PR4, gatilho). A mediana do N4
fica 2,8 s acima do Q3 da referência de antes; sem a condição (1), não há candidato — registrado aqui, ao lado das duas
medições, como o N3 fez com as dele. **Três corridas com APK vieram de push só fora do filtro** (124, 127, 146): a 127 é
a div. 381 (o APK anterior ainda corria); a 124 e a 146 não foram medidas aqui (div. 1142).

**A troca de base, explícita** (aval, N4-D111) `[medido: git grep -n "CI-FAIXA\|mediana\|timeout-minutes" -- .github
scripts apps/native/scripts]`: **nenhum gate, workflow ou script usa a referência como limiar** — nenhum lê o `CI-FAIXA.md`,
e nenhum job tem `timeout-minutes`; a única "mediana" em workflow é um comentário histórico do `native.yml` (*"mediana
~11m45s"*, o N1). Quem usa a referência é **a regra de segmentos** (`CI-FAIXA.md`, "Os segmentos"; `LOGS-OCTAVIA.md`,
"Errata W4-b2"), à mão: a condição (2) compara a mediana de dez corridas seguintes a uma mudança da lista fechada com
**o IQR do segmento vigente**. Com o recálculo, esse IQR passa de **11m12,2s–12m55,2s** (n=96) a **11m12,2s–13m15,5s**
(n=128): a mediana de dez que até ontem ficaria "fora, para cima" entre 12m55,2s e 13m15,5s agora fica dentro. É a base
que vale daqui em diante; a troca está escrita também no `CI-FAIXA.md`.

---

## 10. Heranças, com destino

**A parte que os próximos blocos vão ler.** Numeração estável — cite por **§10.<bloco>.<n>**, e confira com `grep` antes
(a lição da div. 397). Toda linha tem origem. As dez que o commit 2 marcava como proposta do revisor foram
**confirmadas no aval** (N4-D107, §15) e perderam a marca; as outras já tinham destino nos anexos (`N4-PR9-anexos/README.md` §9.1, `N4-REQUISITOS.md`
§4).

### 10.1 N5 (celular)

| # | item | origem |
|---|---|---|
| 1 | **a faixa A inteira** — as molduras `N4-A-*` e a lista de inalcançáveis (`N4-PR9-anexos/README.md` §10) | N4-D12; N4-R24 |
| 2 | o avulso em A: o `sair` fora da tela, a `busca` cortada, a barra de 144 | div. 1078; `N4-PR6-anexos` §5.3 |
| 3 | o arnês do avulso que não anda em A | div. 1080 |
| 4 | a linha da L com o título em 2 linhas em A (e4); o teclado em A | `N4-PR7-anexos` |
| 5 | o cabeçalho de V em A com título longo (304,8 × ≈ 196) | div. 1108 |

### 10.2 O bloco próprio da quebra de linha (entre o N4 e o N5)

| # | item | origem |
|---|---|---|
| 1 | **a quebra de linha na letra, nunca na tab — no palco e em V** (≈ 55 colunas em C, N4-E12; ≈ 26 em A) | N4-D13; N4-D65; N4-D66 (P-O5); N3-D15 |
| 2 | **as notas da música no palco** — o pre-check do bloco da quebra decide se entram nele (os dois mexem no corpo do palco) | N4-D57 (*"o encerramento do N4 nomeia o bloco"*) |
| 3 | **as corridas do APK de push só fora do filtro** (124 e 146 do `CI-FAIXA.md`; a 127 é a div. 381): o pre-check **mede por que** um push que não tocou o filtro disparou o build, e **se a mesma lógica pode deixar de disparar quando deveria** (o H1 do W4-b2; a avaliação do `paths` contra o diff acumulado) | div. 1142; N4-D114 |

### 10.3 Bloco de identidade (a definir)

| # | item | origem |
|---|---|---|
| 1 | **botões de palavra por ícone** no site e nas telas que já existem no tablet — entre eles o ***Baixar* do palco** (com setlist e avulso) | N4-D71; N4-D78 |
| 2 | outro ícone para a ação de **tocar** (o estudo) | N4-D71 |
| 3 | o **código de cores por tipo** (P-T6…P-T9) | N4-D70; N4-D71 |
| 4 | os números soltos como literal: **13** e **20** (N4-D79, N4-D100), **42** e **560** (o arco da estrela, o `maxWidth`; N4-D96, D97), **6 %** (o pressionado, N4-D101), **8 %** e **12 %** (div. 1091) | div. 1016; N4-D79, D96, D97, D100, D101; div. 1091 |
| 5 | a grade de *Detalhes* (`view.grade`) no pacote | N4-D99 |
| 6 | um **nome genérico para o ícone de baixar** (`baixar-setlist` serve ao arquivo de V) | div. 1025 |
| 7 | os ícones preenchidos com traço no site | div. 1046 |
| 8 | a barra do palco sem ícone de tipo | divs. 1047, 1074 |
| 9 | **o cinza de "a setlist sumiu"** (`falha` em `muted`) — escolha ou acaso | N4-D104 |
| 10 | **as demais frases do site**, fora do vocabulário de content | N4-D14 |
| 11 | **o vocabulário do tablet inteiro no core** (as 16 só de S1) | div. 1040 (*"bloco a definir"*) |

### 10.4 Bloco D (backend e dado)

| # | item | origem |
|---|---|---|
| 1 | **a Tab editada no site que nenhum leitor vê** — **primeira da fila do D** | div. 976; N4-D44 (`N4-PRECHECK.md:1161`) |
| 2 | o editor da Cifra e o `chords` do topo que ele não regrava | div. 975; N4-D44 |
| 3 | o `PUT` do favorito mexe no `updated_at` (reordena *Recentes* no site) | N4-D39; L1 |
| 4 | o site mostra `content_type` fora do enum como Letra | div. 1038 |
| 5 | compasso, capo e afinação, que o site não salva | N4-D31 |
| 6 | os seis (e o 7º) "fora do par" do G-par | N4-D47; N4-D49; div. 991 |
| 7 | o teto de 100 do `GET /api/content`; o pedido de 1000 do picker do web | N4-D10; div. 957 |

(*"O nome padrão da seção"* que o prompt deste encerramento listava aqui **não é herança do N4**: é o
`I1-ENCERRAMENTO.md` §10.1 item 3, div. 784, que a N4-D40 cita *"sem item novo"* — div. 1141.)

### 10.5 W5 (instrumento)

| # | item | origem |
|---|---|---|
| 1 | `vitest` dentro de `packages/core`; `packages/core/**` fora do `paths` do `native.yml` | div. 970 (N4-D37); div. 988 (N4-D52) |
| 2 | o G-tok lê genérico de TS como JSX | div. 1034 |
| 3 | o G3 conta `log(` em comentário | div. 1109 |
| 4 | o `fechar-busca` "inalcançável" do arnês de A do N3 (o caminho velho) | div. 1131 |
| 5 | o `R.mock` do `roteiro.py` preso à 8788 (a cópia com a `PORTA` vira o instrumento) | div. 1134 |
| 6 | a PR de instrumento do **envio ao Codecov tolerante a falha** | div. 1072; N4-D93 |
| 7 | **a medição fria do release** (`W4-ENCERRAMENTO.md` §7.5): agora **n=2** — 369 s (div. 998) e **488 s** (esta PR), de árvores diferentes | div. 998; `N4-ENCERRAMENTO-anexos` §2 |
| 8 | o `rm *.json` do `n3pr6b.py:84` (rastro; a receita do `APARATO.md` é a fonte) | `N4-PR7-anexos:287` |
| 9 | a linha `download-error` em **duas linhas** quando a causa não é reconhecida (só o ramo do status virou uma) | `N4-PR9-anexos` §9.2 |
| 10 | **a queda nativa na abertura do dev client** (`Fatal signal 11`, Fabric, ≈ 1 % no dia da PR-9), **com a regra nova de contar quedas nativas em todo aceite** (regra 36). O release desta PR **não** mostrou queda (100 + 100) | div. 1126; N4-D105 e |
| ~~11~~ | ~~as três corridas com APK em push fora do filtro~~ — **movida** (aval, N4-D114): vai ao **pre-check do bloco da quebra de linha**, §10.2.3 | div. 1142 |

### 10.6 Polimento do nativo

| # | item | origem |
|---|---|---|
| 1 | o rodapé do picker sob o teclado em B (não se repete na L) | div. 450; div. 1082 |
| 2 | o **corte de 50** que continua na S4 (a busca do palco) e no picker (`search.ts:58`) | N4-D90 |
| 3 | **a foto do sync que deixa um arquivo apagado como "baixado"** até reabrir | div. 1121 (a 1086) |

### 10.7 Os outros destinos

| # | item | origem | destino |
|---|---|---|---|
| 1 | as duas formas do motivo dentro do web | N4-D29 | **bloco seguinte ao I1** (`I1-ENCERRAMENTO.md` §10.5.11) |
| 2 | o tema claro nas telas de lista (L, V, S1…) | brief §4, regra 12 | **herança do V1, fora do N4** |
| 3 | **o julgamento do A-N4-26 com uma biblioteca de muitos arquivos** (*"sem objeto neste dado"*: 1 arquivo, já no aparelho) | `[Marcel, 2026-10-07]` | **o pre-check do N5** (N4-D108): *"o tempo até tudo baixar"*, com a biblioteca da fixture do teto |

**Fechadas no encerramento** (tarefas do `N4-PR9-anexos` §9.1): a tabela das 39 frases (N4-R21, §3), as corridas no
`CI-FAIXA.md` (§9), o release com 100 + 100 (A-N4-28) e o julgamento do A-N4-26 (§3). **O que o N4 fechou de heranças
anteriores**: o `I1-ENCERRAMENTO.md` §10.2 itens 1 (o vocabulário de content), 3 (o contrato da `LinhaDeAviso`) e 4 (os
três `undefined`, N4-D64); o `N2-ENCERRAMENTO.md` §10.2 item 6 (C-D7, medido); o `N3-ENCERRAMENTO.md` §10.6 (o content
nasceu adaptativo) — as quatro com nota na fonte (§11).

**Em números**: **42 linhas** — N5 **5** · quebra de linha **3** · identidade **11** · Bloco D **7** · W5 **10** ·
polimento **3** · outros **3**. **As 10 propostas confirmadas** no aval (N4-D107); a 1142 saiu do W5 para o pre-check da
quebra de linha (N4-D114), e o A-N4-26 ganhou bloco (N4-D108).

---

## 11. Erratas de ponteiro — neste commit

Só a nota, no molde das existentes, sem reescrever texto:

| arquivo | onde | a nota |
|---|---|---|
| `docs/ux/I1-ENCERRAMENTO.md` | §10.2, depois da tabela | o que o N4 fez com os itens 1–4 (1 e 3 fechados, 2 já movido, 4 pela N4-D64) |
| `docs/native/N3-ENCERRAMENTO.md` | §10.6, depois da nota do pre-check do N4 | o N4 está encerrado; o content nasceu adaptativo |
| `docs/native/N2-ENCERRAMENTO.md` | §10.2, depois da errata do N4 | o item 6 (C-D7) foi medido; o N4 está encerrado |
| `docs/ux/PLANO-TRANSICAO.md` | "Sequência", depois da nota do I1 | o N4 encerrado; a ordem decidida depois dele, e o que está em aberto |
| `docs/native/N4-PR4-anexos/README.md` · `N4-PR8-anexos/README.md` | depois da linha de **Contagem** | a errata da div. 1140 (a contagem da coluna), sem mudar a tabela — aval, N4-D112 (commit 3) |
| `docs/native/LOGS-OCTAVIA.md` | a tabela do padrão; "As regras que o N4 firmou" | os casos 38–43 e as regras 33–37 — aval, N4-D113 (commit 3) |
| `docs/native/CI-FAIXA.md` | "Quem acrescenta" | a troca de base da regra de segmentos e o destino novo da 1142 (commit 3) |
| `CLAUDE.md` | — | **nenhuma**: não cita o N4 nem o estado dos blocos `[medido: grep -n N4 CLAUDE.md README.md ARCHITECTURE.md → nada]` |

---

## 12. Perguntas para o aval do encerramento

*(Respondidas no aval `[Marcel, 2026-10-07]`: §15, N4-D107…D114. O texto abaixo fica como foi perguntado.)*

1. **Os destinos propostos (§10, as dez [proposta]).** Confirmar, um a um ou em bloco:
   (a) as notas no palco → o pre-check do bloco da quebra de linha decide · (b) o corte de 50 e (c) a foto do sync →
   polimento do nativo · (d) as demais frases do site e (e) o vocabulário do tablet no core → bloco de identidade · (f) o
   Codecov, (g) a medição fria do release, (h) o `rm *.json`, (i) o `download-error` em duas linhas e (j) a queda nativa,
   com a regra 36 → W5.
   **Recomendação: confirmar em bloco.** A única com alternativa real é a (j): ela poderia ir ao N5, que vai abrir o dev
   client em celular de novo; recomendo **W5**, porque o que falta é instrumento (reproduzir com taxa medida), não tela.
2. **O A-N4-26 com muitos arquivos** (§10.7.3) — a regra 23 pede bloco. Opções: (a) **N5** — o primeiro aceite em
   aparelho depois do N4, e a conta de audit já tem 4 arquivos; (b) polimento do nativo; (c) sem bloco, fechada como
   está. **Recomendação: (a)**, como linha do pre-check do N5 (*"o tempo até tudo baixar, com a biblioteca da fixture do
   teto"*).
3. **A ordem dos próximos blocos.** **Decidido nos documentos**: depois do N4 vem **o bloco da quebra de linha**, antes do
   N5 (N4-D13; N3-D15: *"pré-requisito do N5"*); depois o **N5** e o **iOS** (N4-D1; I1-D15); o **W5** corre à parte
   (N4-D1). **Em aberto**: o lugar do **Bloco D** (nenhum documento o põe na fila; a primeira da fila dele está decidida —
   a Tab editada, N4-D44) e o do **bloco de identidade** (*"a definir"*, N4-D71). Opções:
   (a) quebra de linha → N5 → Bloco D → identidade → iOS, W5 à parte;
   (b) quebra de linha → Bloco D → N5 → identidade → iOS;
   (c) Bloco D primeiro (a Tab que nenhum leitor vê é um defeito de prod visível hoje), depois quebra de linha → N5 → …
   **Recomendação: (b)** — a quebra de linha é pré-requisito do N5 e já decidida; o **Bloco D antes do N5** porque a Tab
   editada é dado do Marcel que nenhum aparelho mostra (o único defeito de prod conhecido em aberto), e o celular herdaria
   o mesmo buraco; a **identidade depois do N5**, porque metade dela (os botões por ícone, o código de cores) muda telas
   que o N5 vai redesenhar em A.
4. **As três escritas do Marcel** (div. 1138): `f3524b8c` ficou favorita e `93dd3c12` voltou a como estava — o
   `updated_at` das duas mudou (herança D, §10.4.3). Só registro, ou o Marcel quer desfazer o favorito? **Recomendação:**
   só registro — é o uso real, não um teste.
5. **O `CI-FAIXA.md` com as corridas do I1** (div. 1139): esta PR pôs as 119–125 do I1 e recalculou a referência com elas
   — **extra, declarado**. Aceitar, ou separar as do I1 numa nota sem recalcular? **Recomendação: aceitar** — a regra 22
   diz que um bloco não encerra com a série desatualizada, e o I1 encerrou assim.
6. **As duas linhas de contagem erradas** (div. 1140: PR-4 e PR-8): corrigir nos READMEs com uma nota de errata, ou só o
   registro aqui? **Recomendação:** só o registro — vale a coluna, e a §6.1 a dá.
7. **O catálogo** (§8): as regras 33–37 e os casos 38–43 entram no `LOGS-OCTAVIA.md` como numerados? E a 38, extra?
   **Recomendação:** as cinco regras e os seis casos, sim, num commit desta PR depois do aval; a 38 (o release sincroniza
   ao abrir) **também**, porque já custou duas divergências (1000, 1136).
8. **O APK do CI na 124 e na 146** (div. 1142): investigar no W5 junto com o H1, ou fechar como ruído? **Recomendação:**
   W5 (§10.5.11), sem urgência — custo de duas corridas.

**O bloco só se declara encerrado depois do aval.**

---

## 13. Divergências desta PR — 1136 a 1142

As 1136–1138 são da Parte A (`N4-ENCERRAMENTO-anexos/README.md` §10, com o texto inteiro); aqui o resumo, e as da Parte B.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1136** | P | a ordem dos passos (instalar → avião → sync) presumia uma abertura sem sync; o release sincroniza ao abrir com rede | declarado; 2 `GET`, não 4; proposta de regra 38 |
| **1137** | T | o S1 reconhecido por `buscar`; o S2 também tem; a régua nos nós irmãos | consertado no instrumento; prova refeita; caso 43 |
| **1138** | P | *"favoritei uma música"* — três escritas no log | registradas; pergunta 4 |
| **1139** | D | o `CI-FAIXA.md` parou na 118ª: o encerramento do I1 (#350) não acrescentou as 7 corridas do I1, contra a regra 22 | **extra, declarado**: as 119–125 entram aqui com as 126–150 do N4, e a referência recalculada (§9); pergunta 5 |
| **1140** | D | as linhas de contagem do `N4-PR4-anexos/README.md:427` (*"T 8"*, soma 17; a coluna dá 7) e do `N4-PR8-anexos/README.md:439` (*"D 9 · T 10"*; a coluna dá D 10 · T 9). E quatro linhas de divergência (1003, 1067, 1068, 1097) ficam **fora da tabela** delas por uma linha em branco (não renderizam como tabela; o `grep` as acha) | vale a coluna (§6.1); pergunta 6 |
| **1141** | P | o prompt lista *"o nome padrão da seção"* entre as heranças do N4 para o Bloco D; nos anexos do N4 ele só aparece citado como herança **do I1** (`I1-ENCERRAMENTO.md` §10.1 item 3, div. 784; a N4-D40: *"sem item novo"*) | fora das heranças do N4; nota no §10.4 |
| **1142** | T | três corridas com APK de push **só fora do filtro** (124, 127, 146); a 127 é a div. 381, as outras duas sem causa medida | registrado no `CI-FAIXA.md`; §10.5.11; pergunta 8 |

**Contagem**: 7 — P 3 · D 2 · T 2. A próxima livre é a **1143**.

---

## 14. Contabilidade desta PR

| | |
|---|---|
| requests a `/api/*` em prod | **2 `GET`** (o executor; o sync da 1ª abertura do release) · escritas do executor **0** · **3 escritas do Marcel** pela estrela |
| aparelhos | Tab S6 (destravado pelo Marcel; release trocado; avião ligado e desligado; estado final igual ao lido); AVD (em avião, desligado sem salvar) |
| builds | 1 release (488 s) |
| agentes | **4** de leitura, só leitura, em paralelo (PRs e defeitos; decisões e erratas; divergências; heranças, catálogo e prod) — as contagens que entram aqui foram refeitas pelo executor com `grep` |
| commits | `473eea5` (o release no Tab: o anexo e a errata do `APARATO.md`) · `7bc8441` (este arquivo; `CI-FAIXA.md`; as notas no `I1-ENCERRAMENTO.md`, `N3-ENCERRAMENTO.md`, `N2-ENCERRAMENTO.md`, `PLANO-TRANSICAO.md`; o `gates.txt` do anexo) · o commit 3, o aval (§15; `LOGS-OCTAVIA.md`; as erratas da 1140; `CI-FAIXA.md`; `PLANO-TRANSICAO.md`) |
| código | nenhuma linha |

Os blocos de declaração desta PR, verbatim (a cópia que a regra do W4-b2 pede):

```gates
# N4 encerramento: nenhuma declaração — só docs.
```

```gates-web
# só docs — N4 encerramento: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

---

## 15. O aval do encerramento — N4-D107…D114 `[Marcel, 2026-10-07]`

**Com este commit (o 3) e os checks dele verdes, o N4 está encerrado.** O merge da #366 é do Marcel. Fica pendente só a
regra 38 do catálogo (§15.2), que não é do bloco: entra quando o texto for aprovado.

As oito perguntas do §12, na ordem; o texto da decisão é este (o rótulo do §4 aponta para cá).

| # | decisão | o que mudou nesta PR (commit 3) |
|---|---|---|
| **N4-D107** | **os dez destinos propostos, confirmados em bloco**; a queda nativa ao **W5** (§10.5.10), com a regra 36 | a marca *[proposta]* sai do §10 |
| **N4-D108** | **o A-N4-26 com muitos arquivos vai ao pre-check do N5** | §10.7.3 |
| **N4-D109** | **a ordem depois do N4: quebra de linha → Bloco D → N5 → identidade → iOS; o W5 à parte** — com a estimativa do Bloco D pedida antes de fixar (abaixo) | `PLANO-TRANSICAO.md`, a nota do N4 |
| **N4-D110** | **as três escritas do Marcel ficam só registradas** (div. 1138) | — |
| **N4-D111** | **as corridas do I1 entram no `CI-FAIXA.md`** (div. 1139), com a verificação de que nenhum gate usa a referência como limiar e a troca de base escrita | §9; `CI-FAIXA.md` |
| **N4-D112** | **a div. 1140 ganha uma linha de errata nos READMEs da PR-4 e da PR-8**, sem mudar as tabelas | os dois READMEs |
| **N4-D113** | **as regras 33–37 e os casos 38–43 entram no `LOGS-OCTAVIA.md`; a 38 só depois de o Marcel ver o texto integral** (abaixo) | `LOGS-OCTAVIA.md` |
| **N4-D114** | **os APKs da 124 e da 146 não vão ao W5: vão ao pre-check do bloco da quebra de linha**, com a tarefa de medir por que um push fora do filtro disparou o build e se a mesma lógica pode deixar de disparar quando deveria | §10.2.3; §10.5.11 riscada; `CI-FAIXA.md` |

### 15.1 O tamanho do Bloco D, e se caberia antes da quebra de linha `[estimado — leitura dos três inventários, nada medido]`

**O inventário** — o que os encerramentos destinam ao D, com as sobreposições contadas uma vez:

| fonte | itens | abertos | sobreposição |
|---|---|---|---|
| `I1-ENCERRAMENTO.md` §10.1 | 19 | **18** (o 15, o Google, fechado na I1-PR-2); vários são grupos — o 2 (campos que não se salvam) tem quatro, o 4 (o lote) tem cinco | — |
| `N2-ENCERRAMENTO.md` §10.3 | 9 | **7** (o 5 e o 6 fechados na I1-PR-13) | o 4 e o 8 (o teto do reorder) tocam o I1 §10.1.7 |
| `N2-ENCERRAMENTO.md` §10.2 (errata do N4) | 5 | **5** (B9, `DELETE` 200 para inexistente, a cascata content × storage, B1.5, B10) | — |
| `N4-ENCERRAMENTO.md` §10.4 | 7 | **7** | o 1, o 2, o 3 e o 7 **são** o I1 §10.1.17, .18, .19 e .7 — **3 novos** (o enum, compasso/capo/afinação, os fora do par) |
| **total** | | **≈ 33 itens distintos** | |

**A natureza**: rotas da API e validação (o `refine`, os ids do path, o 401, o teto), o **editor do site** (a Tab que grava
`measures` e deixa `tablature`; a Cifra que não regrava `chords`; o `content_data` poluído; o nome padrão da seção), o
**upload em lote** e os sentinelas *Unknown*, a cascata do storage — e, nas duas primeiras da fila, **dado real já gravado
errado** em prod (as Tabs e as Cifras editadas desde o I1), que pede **migração** (`supabase/migrations/`, aplicada pelo
Marcel, `CLAUDE.md`) e prova contra o dado real. Toca o G-back em quase toda PR (o núcleo do backend), o G-par (o leitor de
cada tipo) e o site.

**A estimativa**: com o molde do I1 (15 PRs de código para 8 superfícies) e do N4 (8 PRs de código), o D dá **8 a 12 PRs**,
mais pre-check e encerramento — **o maior bloco da fila**. A quebra de linha é um algoritmo no leitor compartilhado (o palco
e V usam o mesmo `Leitor.tsx` desde a N4-PR8) e o aceite nas três faixas: **3 a 5 PRs**.

**Caberia antes da quebra de linha?** **Não como bloco** — colocá-lo antes empurraria o N5 pelo D inteiro, quando a
quebra de linha é pequena, já decidida como pré-requisito do N5 (N3-D15; N4-D13) e independente do backend. **A ordem
aprovada (quebra → D → N5) fica**, e a estimativa não a muda. Uma observação para o pre-check do D, não uma proposta de
reordenar: **as três primeiras da fila** (a Tab, a Cifra, o `updated_at` — I1 §10.1.17–19) são o recorte natural de uma
primeira PR do D, e são as que têm dado real errado hoje.

### 15.2 A regra 38 — o texto integral, para o aval (não está no `LOGS-OCTAVIA.md`)

> **38. O release sincroniza ao abrir com rede.** *(Divs. 1000, N4 brief; 1136, encerramento do N4; N4-D56.)* O release
> não tem Metro nem mock: aberto com rede, ele faz o sync de leitura contra prod na primeira abertura — `GET /api/setlists`
> e `GET /api/content` —, antes de qualquer toque. Por isso: **(a)** prova de release que não pode fazer requisição se faz
> **em avião** (regra 11: ler, declarar, provar pelo `ping`, restaurar); **(b)** prompt de aceite de release que tenha um
> passo *"com rede"* e um *"sem requisição"* põe o avião **antes** da primeira abertura com o app novo, ou declara que a
> primeira abertura **é** o sync autorizado; **(c)** a contabilidade de prod de toda sessão com release conta esse sync,
> mesmo quando ninguém tocou em nada; **(d)** a volta da rede com o app aberto **não** dispara sync (`net online` sem `api`,
> medido no release anterior e neste), então a prova com rede depois do avião não gasta um sync a mais.

**Entra só com o OK do Marcel a este texto** (N4-D113): numa errata do `LOGS-OCTAVIA.md`, no próximo commit que tocar o
catálogo, com a data do OK.

### 15.3 As duas confirmações

**O commit `473eea5` só toca docs** `[medido: git show --name-only 473eea5]` — 18 arquivos, **todos sob `docs/`** (`git show
--name-only --format= 473eea5 | grep -v '^docs/' | wc -l` → **0**): `docs/native/APARATO.md` e, em
`docs/native/N4-ENCERRAMENTO-anexos/`, o `README.md`, `estado/` (`apk.txt`, `avd-fim.txt`, `avd-inicio.txt`,
`avd-install.txt`, `build-serie.tsv`, `build.txt`, `tab-aviao.txt`, `tab-fim.txt`, `tab-inicio.txt`, `tab-install.txt`),
`favoritar-marcel.txt`, `instrumentos/` (`frias-release.sh`, `prova-dado-real.py`), `prova-dado-real.txt` e `quedas/`
(`frias-avd.txt`, `frias-tab.txt`). Os dois instrumentos são scripts **de anexo** (rodam contra o aparelho, fora de toda
suíte e de todo workflow), como os de cada PR do bloco.

**"A série vai a 119–150 e a referência fica em n=128"**: a **série** é a tabela do `CI-FAIXA.md` — **uma linha por
corrida do job `android-debug-apk` que produziu APK**, em ordem, numerada desde a 1ª (#265), com o tempo do job pelos
carimbos (`startedAt → completedAt`). Ela tinha **118** linhas (a última, o merge da #333, fim do N3). As 32 corridas com
APK desde então entram **no fim, na ordem em que rodaram**: as **7 do I1** viram as linhas **119–125** (I1-PR4, PR6 e PR9 —
as únicas PRs do I1 cujo push construiu o APK) e as **25 do N4**, as **126–150**. A **referência** é a
estatística da **população do regime 2** — as corridas desde a 19ª (#284), menos as 4 falhas riscadas: era **96** (as
19ª–118ª, 100 corridas − 4 falhas); com as 32 novas, todas `success`, fica **128** (132 − 4). A mediana dessa população
passa de 12m20,5s a **12m30s**, e o IQR de 1m43s a **2m03,2s**.

