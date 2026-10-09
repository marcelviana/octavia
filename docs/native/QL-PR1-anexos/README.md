# QL-PR1-anexos — gates (instrumento primeiro)

**PR** (o número no corpo da PR e no §8), branch `ql/pr1-gates`, árvore `../octavia-ql-pr1` sobre `origin/main` =
**`d0d0639`** (`d0d0639f14f63e0eaa95e430bdefca34c8c63e0a`, o merge da #372, o congelamento do desenho do QL)
`[medido: git rev-parse origin/main]`. `pnpm install --frozen-lockfile --offline`. A árvore `../octavia-ql-desenho` foi
removida antes, com `git status --short` vazio e **sem `--force`**. Fonte do bloco: [`QL-PRECHECK.md`](../QL-PRECHECK.md),
[`QL-REQUISITOS.md`](../QL-REQUISITOS.md) (esta PR é a **PR-1** da QL-D19, aceites A-QL-1…A-QL-7) e
[`DESIGN-QL/`](../DESIGN-QL/README.md).

- **Commits**, na ordem do rito (gates primeiro, depois as erratas e a medida, depois os docs):
  `64cca3f` `test(ql): gate da quebra … entrando reprovado` · `fc98164` `test(ql): os três instrumentos do corpo comparam o
  texto lógico` · `60240dd` `test(ql): o G-par de V — a Tab não quebra (QL-R8)` · `f383e37` `ci(ql): o DESIGN-QL no shasum -c`
  · `6409433` `docs(ql): errata do T1-R25 e do T1-R31` · `f35691c` `feat(ql): a régua do leitor em cada zoom e a medida do
  caractere (QL-E2)` · `f91fbc1` `test(ql): o título do teste do duplo` · o de docs (este README e os anexos). O `60240dd`
  e o `f91fbc1` são consertos de instrumento achados pelos próprios CNs e pela leitura da saída, cada um em commit novo
  (§6, div. 1204; o título que dizia `NaN`, caso 23 — nome é afirmação).
- **Nenhuma linha de tela mudou**: `Leitor.tsx`, `StageScreen.tsx` e `VisualizacaoScreen.tsx` com diff vazio (o G1a, §5:
  as três exceções declaradas são `quebra.ts`, `index.ts` e a régua de desenvolvimento).
- **Texto**: só os textos do projeto (`QL-BRIEF.md` §5, a Letra de 110 colunas da fixture do N3) e os dígitos da régua;
  nenhum texto de música de terceiro, nenhum dado da conta (regra 10).
- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado; `[hipótese]` = o resto.

| arquivo | o quê |
|---|---|
| [`gate-1-medicao-com-a-lista-vazia.txt`](gate-1-medicao-com-a-lista-vazia.txt) | a 1ª corrida do gate da quebra, com a lista vazia: as 46 checagens como reprovação não declarada |
| [`cn-gate-quebra.txt`](cn-gate-quebra.txt) | os CN do gate da quebra (o contrato; o laboratório; três defeitos que mudam o texto) — `instrumentos/cn-gate-quebra.sh` |
| [`cn-instrumentos.txt`](cn-instrumentos.txt) | os CN do G-N3 e do `corpo-logico.mjs` sobre dumps fabricados — `instrumentos/cn-instrumentos.sh` |
| [`cn-g-par-v.txt`](cn-g-par-v.txt) | os seis CN do G-par de V — `instrumentos/cn-g-par-v.sh` |
| [`shasum-congelados.txt`](shasum-congelados.txt) | o passo do `gates.yml` com o DESIGN-QL, e o CN de um byte trocado |
| [`medida-por-zoom.txt`](medida-por-zoom.txt) | A-QL-6: o caractere em cada zoom e as colunas, com a leitura dos números |
| [`avd/`](avd/) | o bruto do AVD: estado antes e depois, a receita do cache, o bundle servido, as linhas `regua`, os 12 dumps da régua (`SHA256SUMS.txt`), o logcat `OCTAVIA:`, as quedas |
| [`ci-log.txt`](ci-log.txt) | o log do CI filtrado: o gate da quebra no `build` (as 46), os outros três testes, o `gates-nativos` (§8.1) |
| [`gates.txt`](gates.txt) | os gates locais sobre a PR: G1/G2/G3 com o bloco, o `shasum -c`, o G-N3 da PR e o da `main`, os quatro do site, a suíte, `tsc` e lint |
| [`instrumentos/`](instrumentos/) | `quebra-lab.ts` (a leitura de laboratório dos CN), `dump-quebrado.ts`, os três `cn-*.sh`, `regua-zoom.py` |

---

## 1. O contrato da função — `packages/core/src/quebra.ts` (A-QL-1)

Só o tipo e a assinatura, sem a lógica (`quebrar` **lança**: *"só o contrato na PR-1 do QL — a lógica é da PR-2"*); nenhuma
tela a chama.

```ts
export const RECUO_DA_CONTINUACAO = 2
export interface LinhaVisual { texto: string; logica: number; continuacao: boolean; inicio: number; fim: number }
export function quebrar(texto: string, tipo: string, colunas: number): LinhaVisual[]
```

**O ajuste à proposta da Fase A, declarado** (`quebrar(texto, tipo, colunas)` → linhas com o índice da linha lógica e se
é continuação): **`inicio` e `fim`**, as posições de `slice` do pedaço na linha lógica. Sem elas a invariância não se
escreve: a R1 tira o espaço do corte, a R3 tira os espaços do fim do pedaço e do começo do resto (e o pedaço de acordes só
de espaço), e o par intercala duas linhas lógicas — a concatenação das linhas visuais sem o recuo **não** devolve o texto
(div. 1199). O contrato escrito no cabeçalho de `quebra.ts`: cada linha visual é `recuo + L[logica].slice(inicio, fim)`;
`continuacao ⇔ inicio > 0`; toda linha lógica aparece, em ordem; os pedaços não se sobrepõem e **fora deles só há espaço**
(U+0020). `inicio`/`fim` são unidades UTF-16, não colunas — com `\t`, `\r` e acento combinante as duas divergem, e é a
posição que devolve o texto. `tipo` é a cadeia do `content_type`, como no `bodyOf`: `'Chords'` forma o par, `'Tab'` não
quebra, o resto quebra como Letra. **A função não entra no `bodyOf`** (QL-D13): o gate estrutural do §2 o cobra.

## 2. O gate da quebra — `tests/gates/ql-quebra.test.ts` (A-QL-1, A-QL-2, A-QL-3)

No projeto `web` do Vitest, como o G-par da N4-PR1: o `tsconfig` do core tem `"types": []` e não lê a fixture com `fs`
(div. 1201). A fixture e a lista ficam em `packages/core/fixtures/` — a PR-2 toca só `packages/core/**`.

**Os casos** — `packages/core/fixtures/ql-quebra.json`, 23 casos, 46 checagens:

| gate | casos | o que prova | de onde vem o esperado |
|---|---|---|---|
| **(i)** as regras do corte | `letra-{80,55,48,26,14}` · `cifra-{80,55,48,26,14}` · `tab-{80,55,48,26,14}` · `quase-acorde-14` · `cifra-como-letra-26` | R1 (a Letra, o corte no último espaço, a palavra só parte maior que a coluna), R2 (o par na mesma coluna; o par de 50 recuando para a 18 em 26, QL-E1; o sem saída em 14, *hi\|stória*, o `F#m7(11)` inteiro), R3 (o recuo de 2, o acorde sobre a sílaba, o pedaço de acordes vazio fora), R4 (a progressão em par; a quase acorde fora do par; o par só na Cifra; a Tab intacta) | **as molduras da folha congelada** (os nós `[data-vl]`): `QL-{C,B,A}-S3-letra-escuro`, `QL-C-V-letra-escuro` (55), `QL-A-S3-notas-longa-escuro` (a Letra em 14), `QL-{C,B,A}-S3-cifra-escuro`, `QL-C-V-cifra-escuro`, `EST-QL-A-S3-cifra-zoom40-sem-saida-escuro` (14); a Tab pela conferência §13 (*"78 colunas, 6 linhas"*); `tab-14`, `quase-acorde-14` e `cifra-como-letra-26` **derivados** de R1/R4 (a folha não tem o caso) |
| **(iii)** a medida (QL-D24) | `tabulacao-16`, `tabulacao-14`, `cr-50`, `cr-48`, `combinante-50`, `combinante-48` | o `\t` até a próxima múltipla de 8; o `\r` do fim conta 0; o acento combinante conta 0 — **cada um escolhido para cortar diferente se a medida errar** (`ab\tcd ef gh` tem 16 colunas e 11 unidades; a linha de 50 colunas com `\r` tem 51 unidades; a de 50 com dois acentos NFD, 52) | derivados de QL-D24; os de 48 com o corte do `QL-B-S3-letra-escuro` |
| **(ii)** a invariância | **todos os 23** | o contrato do §1, item a item, e **a junção** — cada pedaço no seu `inicio`, o que falta preenchido com espaço — igual ao texto **byte a byte** | — |

**A leitura das regras foi conferida contra a folha antes de escrever o gate** (o prompt manda parar se divergirem): a
folha é HTML pré-renderizado (os geradores ficaram fora, QL-D38), extraído no Chromium do `@playwright/test` sem rede (0
requisições abortadas); uma leitura de R1–R4 reproduziu **44 de 44** molduras de Letra e Cifra (80, 55, 48, 44, 26, 14)
`[medido: instrumento de sessão, fora do repositório; a mesma leitura é a `instrumentos/quebra-lab.ts`]`. **Folha e regra
não divergem em caso nenhum.** O que a folha não decide e o gate fixa, declarado: com uma sequência de espaços no corte,
os espaços do fim do pedaço e do começo do resto saem todos (a R3 escreve isso para o par; a Letra segue igual).

**Entra reprovado, no molde da N4-PR1 (§1.3 de lá)**: a lista `packages/core/fixtures/ql-quebra-reprovados.txt` declara
as 46 checagens (`i:…`, `ii:…`, `iii:…`); reprovação fora da lista (`NÃO DECLARADA`) e declaração que passa (`ÓRFÃ`)
reprovam o teste (regra 14). A 1ª corrida, com a lista vazia, deu as 46 como não declaradas
(`gate-1-medicao-com-a-lista-vazia.txt`); com a lista: `gate da quebra: reprova exatamente a lista esperada (46) ✓`.
**A PR-2 esvazia a lista**; vazia, o gate exige zero reprovações sem mudar o gate.

**E o estrutural da QL-D13**, que já passa: `content-contract.ts` e `search.ts` não importam `./quebra`.

### 2.1 Os controles negativos `[medido: cn-gate-quebra.txt]` (regra 4)

`cn-gate-quebra.sh` põe a leitura de laboratório (`quebra-lab.ts`) no lugar do contrato, roda o gate e devolve o contrato
com `git checkout` (`git status` limpo no fim). A leitura de laboratório aplica R1–R4 e **não mede** o `\t`, o `\r` nem o
acento (conta unidades) — de propósito:

| CN | o que muda | o gate | por quê |
|---|---|---|---|
| 0 | o contrato (a PR-1) | 46 reprovam, a lista ✓ | o estado declarado |
| 1 | o laboratório, sem defeito | **43 passam**: os 17 do (i) e os 23 do (ii); **reprovam só `tabulacao-14`, `cr-50`, `combinante-50`** | o gate distingue: uma quebra certa nas regras e errada na medida cai **exatamente** nos casos do (iii) cujo corte depende da medida (o `cr-48` e o `combinante-48` cortam igual com as duas medidas e passam) |
| 2 | `LAB_DEFEITO=letra` (uma letra trocada) | o (ii) reprova nos 23: *"o texto não é o recuo mais a fatia"* | caractere trocado |
| 3 | `LAB_DEFEITO=palavra` (uma palavra a menos) | o (ii) reprova nos 8 casos com continuação de mais de uma palavra: *"entre os pedaços há o que não é espaço"* | caractere tirado |
| 4 | `LAB_DEFEITO=ordem` (duas linhas lógicas trocadas) | o (ii) reprova nos 16 casos com 3+ linhas: *"as linhas lógicas não aparecem em ordem"* | ordem |

(No CN-2 a lista "fecha" — as 46 reprovam, como na PR-1 —; o que o CN mostra é o **motivo** de cada (ii), no anexo.)

## 3. Os três instrumentos do corpo — o texto lógico (A-QL-5, QL-D16)

**O comparador**: `apps/native/scripts/texto-logico.mjs`, `ehQuebraDe(desenho, logico)` — o desenho vale como o texto
quando é uma **quebra** dele: as linhas desenhadas saem das lógicas em ordem, cada lógica partida em fatias com só espaço
entre elas, cada continuação com o recuo de 2, e no par os pedaços das duas linhas intercalados, **com o mesmo começo** (o
acorde sobre a sílaba) e o de cima omitido quando é só espaço. Não mede onde o corte cai (isso é o gate do §2). Teste com CP
e CN: `apps/native/test/texto-logico.test.ts` — **CP**: as 23 saídas esperadas do gate são quebras dos seus textos, com as
continuações que as molduras mostram (Letra em 26: 8; Cifra em 26: 7; em 14: 15), e o desenho de hoje é o próprio texto;
**CN**: letra trocada, palavra a menos, caractere a mais, linhas fora de ordem, linha visual a menos, **o acorde uma
coluna fora da sílaba** e o par invertido — 7 recusados.

**Por que o texto lógico precisa da referência** (div. 1199): sem o `inicio`, o espaço do corte, os espaços da R3 e o
pedaço de acordes vazio somem, e uma continuação (`"  lá"`) não se distingue de uma linha que começa com dois espaços (uma
linha de acordes). Os três instrumentos **têm** a referência: o retrato do site (G-par), a paisagem da base congelada
(G-N3), o texto do cache (o `sha12`).

**A leitura do desenho**, a mesma nos três: um `Text` é um bloco de texto corrido, partido no `\n` (o RN junta os `Text`
aninhados na mesma linha); uma `View` empilha os filhos. Hoje o `corpo` é um `Text` só; a PR-3 pode desenhar uma linha por
nó e a leitura é a mesma (o CP-2 do §3.2 o prova no dump).

### 3.1 O G-par de V — `apps/native/test/g-par-visualizacao.test.tsx`

- compara o site × V pelo texto lógico (`ehQuebraDe`), a Partitura pela URL, o sem-corpo igual;
- **roda duas vezes**: em C, como sempre, e com o **duplo em 26 colunas** (`__colunas(26)`), onde a fixture tem 6 linhas
  acima da coluna — e imprime *"linhas do par acima da coluna: 6 · continuações vistas em V: 0"*;
- **`O_LEITOR_QUEBRA`**, a declaração do estado do leitor: `false` até a PR-3 (e V não pode mostrar continuação: uma quebra
  sem a declaração reprova); `true` desde a PR-3 (e todo item com linha acima de 26, fora a Tab, tem de mostrar continuação
  em 26: um leitor que ignore as colunas do duplo reprova). **É o que impede o G-par de passar sem ver a quebra (div. 1185)**;
- **a Tab não quebra** (QL-R8): Tab com continuação é `TAB QUEBRADA`, mesmo com o texto preservado — o achado do CN-V2
  (div. 1204), consertado no `60240dd`.

**O duplo recebe colunas** — `fake-react-native.tsx`, `__colunas(n, zoom?)`: liga o `onLayout` (a `View` com `n` colunas
mais o respiro de 2 × 32; o `Text` com as colunas do texto × o caractere do duplo). **Desligado é o padrão**, e é o
comportamento de antes: o palco, o fim e o reordenar têm `onLayout`, e os projetos `native` e `native-tela` passam inteiros
com o duplo novo (36 arquivos, 447 testes). Prova: `apps/native/test/duplo-colunas.test.tsx` — desligado, nenhum `onLayout`; ligado, um leitor de
mentira que faz a conta da QL-D13 chega a 80, 55, 48, 26 (zoom 22 e 40) e 14 colunas.

**Os CN** `[medido: cn-g-par-v.txt]` — `cn-g-par-v.sh` troca o `CorpoDoLeitor` por um que quebra com o laboratório em 26 e a
declaração do teste, e devolve os dois com `git checkout`:

| CN | o leitor · a declaração | o G-par | exit |
|---|---|---|---|
| V0 | a `main` · `false` | *zero diferenças ✓*, 0 continuações nas duas passadas | 0 |
| V1 | quebra (válida) · `false` | *"V quebrou o corpo sem a declaração"* (6 continuações) | 1 |
| V2 | quebra (válida) · `true` | *zero diferenças ✓*: `QUEBRA` em `letra`, `letra-poluida-editor`, `cifra-secoes-acordes-vazios` | 0 |
| V3 | quebra com uma letra trocada · `true` | *"V diferente do site"* | 1 |
| V5 | quebra também a Tab · `true` | `TAB QUEBRADA tab-texto` | 1 |
| V4 | não quebra · `true` | *"o leitor não viu as colunas do duplo"* | 1 |

A primeira corrida do CN reprovou o V5 pela razão errada — o `LAB_DEFEITO=letra` do V3 vazou para o V5, porque no `sh` do
macOS `VAR=x função` deixa a variável valendo depois da função (div. 1203). Consertado no instrumento (`export`/`unset`) e
refeito; a saída no anexo é a da segunda corrida.

### 3.2 O (e) do G-N3 e o `corpo-logico.mjs` (o `sha12`)

- **G-N3** (`apps/native/scripts/g-n3.mjs`): o `corpo` da paisagem não conta como (e) quando as linhas desenhadas sob o
  `corpo` da faixa são uma quebra dele; contagem própria, `quebra=n`, que não reprova e não soma ao (e). **A paisagem é a
  referência lógica**: a base congelada (`B3-referencia-paisagem/`, pré-QL) tem o corpo sem quebra; um par em que a
  paisagem também está quebrada só passa se as duas forem iguais (declarado no cabeçalho do script, regra 5).
- **`corpo-logico.mjs`** — o comprimento com `sha12` do `corpo`, que até aqui era passo de sessão (o M2 da D-0, os
  `prova*.py` do N4), vira instrumento versionado: as linhas desenhadas, `len`/`sha12` do desenho e, com
  `--referencia <arquivo>` (o texto do cache, **fora do repositório**), `len`/`sha12` do texto lógico e o veredito. Só
  números. Sem a referência, ele diz que não afirma texto lógico nenhum.

**Os CN** `[medido: cn-instrumentos.txt]` — `cn-instrumentos.sh`, sobre a paisagem `REF-S3-S3a-letra-1a-avd-pai` (49 linhas,
a Letra da fixture de 110 colunas) e a faixa `N4P9F-S3-S3a-letra-1a-avd-ret`, com o corpo trocado pela quebra de
laboratório em 48 (`dump-quebrado.ts`):

| CN | a faixa | G-N3 | `corpo-logico` |
|---|---|---|---|
| CP-0 | como está (sem quebra) | exit 0 · `(e)=0 · quebra=0` | ✓ · 0 continuações |
| CP-1 | quebrada em 48, num nó | exit 0 · `quebra=1` (92 desenhadas de 49 lógicas, 43 continuações) | ✓ · `len=2533 sha12=5bcc25b61916 = referência` |
| CP-2 | quebrada em 48, **um TextView por linha** | exit 0 · `quebra=1` | ✓ (92 nós) |
| CN-3 | com uma letra trocada | exit 1 · `(e)=1 — corpo` | ✗ exit 1 |
| CN-4 | com uma palavra a menos | exit 1 · `(e)=1` | ✗ exit 1 |
| CN-5 | com duas linhas fora de ordem | exit 1 · `(e)=1` | ✗ exit 1 |
| CN-6 | o CP-1 com o **`g-n3.mjs` da `main`** | exit 1 · `(e)=1` — o G-N3 de antes via a quebra **válida** como texto que some | — |

**Os CN que já existiam do G-N3** (`cn-n3pr1.sh`, `cn-n3pr3.sh`, `cn-n3pr6c.sh`) passam com o G-N3 novo —
`todos os controles como esperado ✓` nos três (`gates.txt`); o único `✗` da saída do `cn-n3pr1.sh` é o `G-inv: REPROVA ✗`
que ele espera, igual com o `g-n3.mjs` da `main`. E sobre os 32 pares de retrato da N4-PR9 contra a base, com os rolados, o
G-N3 da PR e o da `main` diferem **só** no bloco `QUEBRA` (0) e no sufixo `· quebra=0` do veredito
(`gates.txt`): `(e)=0 · (b)=0 · nome-acessível=8 · rolagem=6`, o número da N4-PR8.

**Sobre a `main`, os três seguem verdes** — o texto ainda não quebra.

## 4. A medida do caractere por zoom (A-QL-6, QL-D34) `[medido: medida-por-zoom.txt, avd/]`

**O token**: `leitor-18` … `leitor-40` no `ReguaDeDev.tsx` — o estilo do `leitor` (o `estiloDoLeitor`) em cada passo do
`zoomSteps`. **Instrumento de desenvolvimento**, só no dev client (o `require` atrás de `__DEV__`); nenhum token do pacote de
identidade, nenhuma frase, nenhuma tela.

| zoom | 100 caracteres | caractere | px (× 2,25) | **C** (1073,8) | **B** (647,1) | V em C (733,8) | a folha (linear) | o pre-check (pixel) |
|---|---|---|---|---|---|---|---|---|
| 18 | 1093,3 dp | **10,93** | 24,6 | **98** | **59** | — | 98 · 59 ✓ | 100 · 60 ✗ |
| 22 | 1333,3 | **13,33** | 30,0 | **80** | **48** | **55** | 80 · 48 ✓ | 80 · 48 ✓ |
| 26 | 1573,3 | **15,73** | 35,4 | **68** | **41** | — | 68 · 41 ✓ | 69 · 41 ✗ |
| 32 | 1920,0 | **19,20** | 43,2 | **55** | **33** | — | 55 · 33 ✓ | 56 · 33 ✗ |
| 40 | 2400,0 | **24,00** | 54,0 | **44** | **26** | — | 44 · 26 ✓ | 44 · 26 ✓ |

**Vale a conta da folha** (a escala linear) nas dez células de C e B; a do pre-check erra em quatro (div. 1202). O 22 é o
da N4-PR8 (1333,3) e o token `leitor` dá o mesmo que o `leitor-22` (controle). **Régua × dump**: igual nos 7 textos que
cabem na tela (os seis de 10 caracteres e o de 100 no 18); os de 100 a partir do 22 passam de 1137,8 dp e o dump os
recorta na janela — limite do instrumento, não da medida. **A leitura dos números** `[hipótese, que os cinco fecham]`: o
avanço é 600/1000 do tamanho, e o que se arredonda ao pixel é o **tamanho da fonte** (zoom × 2,25), não o avanço. **A**
(o celular, outra densidade) **não foi medida** (é do N5): fica estimada, com a mesma leitura no anexo. **O Tab não foi
medido nesta PR** (o prompt o deixa de fora; A-QL-6 pede os dois — div. 1200): a mesma densidade dá a mesma medida
`[hipótese]`, a medir na PR-3. A tabela substitui as estimadas do `DESIGN-QL/README.md` §4 pela **QL-E2** (medida), errata
de ponteiro. O recuo de 2 colunas no 40 mede 48,0 dp (a folha: 48,5; Δ −0,5).

### 4.1 O aparelho — o AVD `octavia_tab32` `[medido: avd/]`

- **Subido do snapshot `default_boot` com `-no-snapshot-save`**: nada do que a sessão fez ficou no snapshot (o `ram.bin`
  com a data de antes, 2026-09-24 14:00:20; o `snapshot.pb` muda de data a cada subida, como o `APARATO.md` registra).
- **O estado lido antes e depois** (`avd/estado-antes.txt`, `avd/estado-depois.txt`): `airplane_mode_on=1`, `wifi_on=0`,
  `mobile_data=0`, `stay_on_while_plugged_in=1`, `accelerometer_rotation=1`, `user_rotation=0`, túneis vazios, o dev client
  de 2026-09-24 14:00:01 com `DEBUGGABLE`, **`ping` → `connect: Network is unreachable`** (a prova do avião, regra 1) — iguais
  nos dois. Nenhum setting mudou.
- **A receita do cache sem dado real** (N4-D102; a conta de audit tem cache no AVD): guardados por cópia 5 caminhos (os três
  `.json` e os dois PDFs da semente do ux-audit), md5 a md5; tirados por nome, a pasta da sessão vazia; **depois o mock, os
  túneis e o bundle conferido, só então a abertura**; no fim, regravados md5 a md5 (`avd/receita-cache.txt`). A fixture não
  criou arquivo no aparelho.
- **O bundle servido** (regra 13, `avd/bundle-servido.txt`): `leitor-${z}` 1 · `zoomSteps.map` 1 · `localhost:8788` 1 ·
  **`octavia.rocks` 0**. O Metro sem `CI=1`, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; o
  `apps/native/.env` por `cp -p` do checkout principal **sem abrir** (sha256 `f2bfa179cd8e`, igual ao original), **apagado**
  no fim. O mock (8788, a fixture do N3 com *hoje* = 2026-09-23) e o servidor de arquivos (8790) de pé, e derrubados no fim.
- **Uma abertura do app**: `faixa=C w=1137.8 h=711.1` · `net offline` · `auth … src=restored` · `sync skip reason=offline`
  · `prefetch plan n=0 reason=library` (`avd/logcat-octavia.txt`) — **nenhuma requisição**, nem ao mock. Depois as 12
  medidas da régua (`regua-zoom.py`, que **não** limpa o logcat entre as medidas, como o `regua.py` do N3 faria).
- **As quedas** (regra 36, `quedas.py`, com o `logcat -c` uma vez antes da rodada e `-G 16M`): **Java 0 · nativa 0 ·
  tombstones 0** (`avd/quedas.txt`).
- **Os dumps da régua** (`avd/regua-dumps/`, 12, `SHA256SUMS.txt`): a tela de trás é a S1 vazia (o cache tinha saído) —
  só as frases do app e os dígitos da régua.

## 5. Os gates sobre esta PR `[medido: gates.txt]`

| gate | onde roda no CI | sobre a PR |
|---|---|---|
| **o gate da quebra** (`tests/gates/ql-quebra.test.ts`) | `ci.yml`, job `build`: `pull_request: null` (sem `paths`), `pnpm test:unit` → o Vitest inteiro, projeto `web` (que coleta `tests/gates/**`); o `Test coverage` roda de novo | `reprova exatamente a lista esperada (46) ✓` |
| `texto-logico.test.ts` (projeto `native`) · `duplo-colunas.test.tsx` e o G-par de V (`native-tela`) | o mesmo `build` (o Vitest inteiro); o `native.yml` roda o `type-check` deles quando o nativo muda | verdes (2 · 7 · 2 testes) |
| o G-par do core (`tests/gates/n4-g-par.test.tsx`) | o mesmo `build` | verde, sem mudança |
| G-N3 · `corpo-logico.mjs` · os CN | **à mão** — o CI não tem aparelho nem dump (errata N3-PR1 do `LOGS-OCTAVIA.md`) | §3.2 |
| `shasum -c` com o DESIGN-QL | `gates.yml`, job `gates-nativos` (sem `paths`) | `telas.html: OK` nos cinco; o CN de um byte: `FAILED`, exit 1 (`shasum-congelados.txt`) |
| G1a/G1b · G2/G3 | `gates.yml`, `gates-nativos`, com o bloco do corpo | G1a `DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)`, as 3 exceções usadas · G1b `só adição ✓` · G2 `antes=121 depois=121 ✓` · G3 `antes=70 depois=70`, `nenhuma linha sumiu ✓` |
| G-inv | à mão, sobre dumps de tela | **não se aplica**: nenhuma tela mudou e nenhum dump de tela novo nesta PR (os dumps da régua não são estados do G-inv); a errata em par da B3 é da PR-3 (QL-R11) |
| G-back · G-palco · G-tok (+ cobertura) · G-faixa | `gates-web.yml` | `PASSA` nos quatro, o bloco ```` ```gates-web ```` vazio (nenhum arquivo do núcleo do G-back) |

**A prova de que uma PR que toque só `packages/core/**` dispara o gate da quebra** — a PR-2 —, por leitura do YAML, no molde da
N4-PR1 §3: o `ci.yml` não tem filtro de caminho; o `build` roda o Vitest inteiro; o gate está no projeto `web`, que não
depende de quais arquivos mudaram, e importa `../../packages/core/src/quebra`. O `native.yml` (cujo `paths` não tem
`packages/core/**`, herança W5) não é preciso para ele. **Medido no CI desta PR**: §8.1.

Suíte inteira: `Test Files 143 passed | 3 skipped (146)` · `Tests 1718 passed | 59 skipped (1777)` (o pre-check: 140 · 1706);
`tsc` raiz 0 · core 0 · identidade 0 · nativo 0 (de dentro do pacote, div. 1187); `✔ No ESLint warnings or errors`.

## 6. Divergências — 1199 a 1205

A última usada era a **1198** (`DESIGN-QL/README.md` §11) `[medido: git grep -nE '^\| \*\*(1[12][0-9]{2})\*\*' -- docs →
máximo 1198; nenhum número ≥ 1199 em prosa]`.

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1199** | D | *"juntar as linhas visuais, tirando o recuo das continuações, devolve o texto lógico byte a byte"* (o prompt, item 3; `QL-REQUISITOS.md` A-QL-2 e QL-R19; `QL-PRECHECK.md` A2 e A8.4): **não vale pela concatenação** — a R1 tira o espaço do corte, a R3 tira os espaços do fim do pedaço e do começo do resto e o pedaço de acordes vazio, e o par intercala duas linhas lógicas. E o texto lógico **não se reconstrói só do desenho**: uma continuação não se distingue de uma linha que começa com dois espaços | o tipo ganha `inicio`/`fim` e a invariância vira a junção com cada pedaço no seu `inicio` (§1, §2); os três instrumentos comparam contra a referência que têm (`ehQuebraDe`, §3) — **aprovado: QL-D41** |
| **1200** | P | *"O Tab S6 não entra nesta PR"*, e o A-QL-6 pede a medida *"no AVD e no Tab"* | **QL-D40**: o Tab na PR-3, que mede os cinco zooms e compara com o AVD antes de tela depender do número (a mesma densidade dá a mesma medida `[hipótese]`) |
| **1201** | D | A-QL-1…A-QL-3: evidência *"Vitest no core"*; o `tsconfig` do core tem `"types": []` e o teste não lê a fixture com `fs` | o gate é Vitest sobre a função do core, no projeto `web` (`tests/gates/`), como o G-par da N4-PR1; a fixture e a lista em `packages/core/fixtures/` — **QL-D42**, com a condição cumprida no log do CI (§8.1); o core para dentro do core, herança do W5 |
| **1202** | D | O pre-check supôs o **avanço** arredondado ao pixel (`QL-PRECHECK.md` A1.2/A1.3: *"18 → 24 px; 26 → 35; 32 → 43; 40 → 54"*): o medido é 24,6 · 35,4 · 43,2 px — o que se arredonda é o tamanho da fonte; as colunas do pre-check erram em C 18/26/32 e B 18 | **QL-E2** (errata de ponteiro do `DESIGN-QL` §4): vale a conta da folha em C e B; A segue estimada (N5) |
| **1203** | T | No `sh` do macOS (bash em modo POSIX) `VAR=x função` deixa a variável valendo depois da função: na 1ª corrida do `cn-g-par-v.sh` o `LAB_DEFEITO=letra` do CN-V3 vazou para o CN-V5, que reprovou pela razão errada | o instrumento (`export`/`unset`), refeito; o `APARATO.md`, "Ferramentas" |
| **1204** | T | O CN-V2 mostrou o G-par de V aceitando uma **Tab quebrada**, porque o texto lógico se preservava: a QL-R8 ficava fora do instrumento | o G-par de V acusa `TAB QUEBRADA` (`60240dd`); o CN-V5 o prova |
| **1205** | T | A regra 9 aplicada ao aparato (*"mudou o aparato → muda esta página no mesmo commit"*): o duplo com colunas entrou no `fc98164`, e a linha dele no `APARATO.md`, no `f35691c` | registrado; as linhas do `APARATO.md` estão na PR (o duplo, os tokens da régua, o `VAR=x função`) |

**Contagem** `[medido: a coluna]`: **7 — P 1 · D 3 · T 3** (P: 1200 · D: 1199, 1201, 1202 · T: 1203, 1204, 1205). **A
próxima livre é a 1206.**

## 7. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# QL-PR1: o contrato da quebra no core (arquivo novo + o export) e a régua do leitor por zoom (instrumento de dev).
g1a: packages/core/src/quebra.ts
g1a: packages/core/src/index.ts
g1a: apps/native/src/screens/ReguaDeDev.tsx
```

```gates-web
# QL-PR1: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado; o core (packages/core/src/quebra.ts) não é importado pelo web.
```

## 8. Os checks da PR

Sobre o head **`f91fbc1`** (o último commit de código), **todos verdes**, antes deste commit de docs `[medido: gh pr checks 373;
gh run view <id> --json jobs]` (duração no nível do **job**, como o `gh` a dá; `n=1` — não é referência):

| check | workflow · run | estado | duração |
|---|---|---|---|
| `build` (lint, type-check, `pnpm test:unit` com os gates, cobertura, `pnpm build`) | `ci.yml` · `37853131932` | pass | 4m30s |
| `gates-nativos` (G1a/G1b, G2/G3, `shasum -c` com o DESIGN-QL) | `gates.yml` · `37853131817` | pass | 13s |
| `g-back` · `g-palco` · `g-tok` · `g-faixa` | `gates-web.yml` · `37853131875` | pass | 29s · 16s · 30s · 15s |
| `mudou-nativo` | `native.yml` · `37853131997` | pass | 10s |
| `android-debug-apk` | `native.yml` · `37853131997` | pass | **13m22s** (22:23:29 → 22:36:51 UTC) — dentro da faixa do regime 2 (`CI-FAIXA.md`: n=128, mín 8m09s, máx 14m32s, mediana 12m30s), 6,5 s acima do Q3 (13m15,5s) e abaixo do máximo — não é estranho |
| `Vercel` · `Vercel Preview Comments` | — | pass | — |

O APK rodou porque a PR toca `apps/native/**` (a régua, os testes, os scripts) e o `gates.yml`. A linha da série no
`CI-FAIXA.md` entra no encerramento do bloco (regra 22).

### 8.1 A prova pelo log — o gate no `build` (QL-D42) `[medido: ci-log.txt]`

`gh run view <id> --log`, filtrado e sem as cores. No passo *"Test — a suíte, e com ela os gates embrulhados"* do `build`:

```
gate da quebra — casos 23 · checagens 46 ((i) 17 · (ii) 23 · (iii) 6) · passam 0 · reprovam 46
lista esperada (46) · reprovados (46)
gate da quebra: reprova exatamente a lista esperada (46) ✓
 ✓  web  tests/gates/ql-quebra.test.ts (2 tests) 7ms
```

— **as 46 reprovadas como a lista declara, nenhuma não declarada, nenhuma órfã, e o job verde por isso**; o mesmo bloco
sai de novo no passo *"Test coverage"*. No mesmo passo: `✓ native apps/native/test/texto-logico.test.ts (2 tests)`,
`✓ native-tela apps/native/test/g-par-visualizacao.test.tsx (2 tests)` (com as duas passadas, *"[C (a coluna de V, 55)]"* e
*"[26 colunas (o duplo com colunas, QL-PR1)]"*, *zero diferenças ✓*) e `✓ native-tela apps/native/test/duplo-colunas.test.tsx
(7 tests)`; a suíte `Test Files 143 passed | 3 skipped (146)` · `Tests 1718 passed | 59 skipped (1777)`, igual à local. No
`gates-nativos`: as **3 declarações** lidas do corpo, `G1a: DIFF VAZIO ✓`, `G1b: só adição ✓`, `G2 antes=121 depois=121 ✓`,
`G3 antes=70 depois=70 … nenhuma linha sumiu ✓`, e `== docs/native/DESIGN-QL` · `telas.html: OK`. **Nenhum gate faltou no
log.**

## 9. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` foi copiado por `cp -p` e conferido por sha256, sem abrir, e apagado no fim |
| requisições do app ao mock | **0** (o app abriu em avião: `sync skip reason=offline`); do host ao mock e ao servidor de arquivos, 1 cada (o teste de que estavam de pé) |
| AVD `octavia_tab32` | começo e fim **iguais** (§4.1): conta de audit, avião provado pelo `ping`, sem túneis, app parado, dev client de 2026-09-24, snapshot intacto (`-no-snapshot-save`); 1 abertura; 12 medidas; **0 quedas** |
| Tab S6 | **não tocado** — estava ligado por USB durante a sessão (aparece no `adb devices`); todo comando `adb` levou `-s emulator-5554` |
| a folha congelada | lida no Chromium do `@playwright/test`, sem rede (0 abortadas); `telas.html` sem mudança (`shasum -c` OK) |
| agentes | **0** |
| código de produto | `packages/core/src/quebra.ts` (o contrato, novo) e o export no `index.ts`; a régua de desenvolvimento (`ReguaDeDev.tsx`, só no dev client). **Nenhuma tela** |
| os CN | trocaram `quebra.ts`, `Leitor.tsx` e o G-par de V por um instante e os devolveram com `git checkout` (`git status` no fim de cada anexo); os dumps fabricados ficaram em diretório descartável |
| temporários | no scratchpad da sessão, fora do repositório: a cópia do cache da audit (guardada e regravada md5 a md5), a fixture, o bundle baixado, as molduras extraídas, as saídas da suíte |
| YAML | `gates.yml` (o laço dos congelados) |
| APK | o `native.yml` roda: a PR toca `apps/native/**` e o `gates.yml` |

## 10. O aval — QL-D40…QL-D42 `[Marcel, 2026-10-08]`

| # | decisão | o que mudou nesta PR |
|---|---|---|
| **QL-D40** | **A medida da largura do caractere no Tab S6 vai para a PR-3**, quando o Tab entra para o aceite do leitor (div. 1200). A PR-3 mede os cinco zooms no Tab, compara com a tabela do AVD desta PR (§4) e acusa a diferença antes de qualquer tela depender do número. O A-QL-6 fica **fechado no AVD e aberto no Tab** até lá. | `QL-REQUISITOS.md`: o A-QL-6 e o escopo da PR-3 |
| **QL-D41** | **O contrato com `inicio`/`fim` está aprovado** (div. 1199): cada linha visual diz onde começa e termina na linha lógica, para a invariância se provar com o corte que tira espaços e com o par que intercala duas linhas. | — (o §1) |
| **QL-D42** | **O gate fica no projeto `web`** (div. 1201), rodando no job `build` do `ci.yml`, sem filtro de caminho. A condição: o log do CI desta PR mostra o gate rodando e reprovando exatamente as 46 da lista — **cumprida** (§8.1). Levar os testes do core para dentro do core continua herança do **W5**. | — (o §5; o log no `ci-log.txt`) |

---

**A próxima PR desta lista** (QL-D19): **PR-2 — a quebra no core**: `quebrar` com R1–R4, o recuo, a reserva por linha e a
medida do QL-D24, fora do `bodyOf`. **Critério de saída**: `packages/core/fixtures/ql-quebra-reprovados.txt` **vazio** (só
comentários) e o gate exigindo zero reprovações — `gate da quebra: reprova exatamente a lista esperada (0) ✓`, com
`passam 46`. Para a **PR-3**: `O_LEITOR_QUEBRA = true` no G-par de V; o leitor tirando as colunas do `onLayout` (o duplo já
as dá); a medida no Tab (div. 1200); a errata em par dos 6 dumps de Letra da B3.
