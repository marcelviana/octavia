# N4-PR4 — identidade: a estrela, o tocar, os quatro ícones de tipo, as medidas inexistentes

> **Bloco N4 · PR-4** (`n4/pr4-identidade`, PR [#360](https://github.com/marcelviana/octavia/pull/360), **sem merge**).
> Data: 2026-10-04. Base: `origin/main` = `bf678e3` (merge da #359). Commits: `9fc5cfe` `test(n4): PR-4 — o gate dos
> ícones em par, reprovando` · `08d8780` `feat(identidade): a estrela, o tocar e os quatro ícones de tipo (N4-D68, D69,
> D76)` · `a267e6e` `feat(identidade): as três medidas inexistentes por desenho (N4-D64)` · `66e4b9e` `test(n4): PR-4 — a
> errata em par da base do G-inv, o gate primeiro` · `54ce0d1` `test(n4): PR-4 — a base do G-inv em par: os 8 dumps com ícone
> de tipo (N4-D69)` · o de docs (este README).
> `[medido]` = comando + saída literal nesta sessão; os brutos estão nos arquivos ao lado (índice no fim).
> Requisitos: N4-R18, N4-R19, N4-R20 (a parte da N4-D64), N4-R23. Aceites: A-N4-18 (a parte do executor; o traço vai à
> PR-7, §7), A-N4-19, A-N4-20, A-N4-23.

**Nenhuma composição muda**: os mesmos nomes, a mesma caixa, os mesmos `bounds` (G-inv, G-faixa e a prova por imagem
abaixo).

---

## 0. Decisões do Marcel nesta sessão `[Marcel, 2026-10-04]`

O §1 parou no item 2 (*"se a conversão exigir escolha de desenho que a folha não fez, pare e pergunte"*) — divs. 1043 e
1044. As duas respostas, verbatim da escolha:

**N4-D86 — o traço dos quatro de tipo: "Fiel em 20, catálogo em 24/28".** A geometria entra × 1,2 (da grade de 20 da
folha para o viewBox 24); em **20** o desenho é o `em20`, igual ao markup da folha com `traco: 1.8`; em **24 e 28** é o
`normal`, com o traço da família (`TRACO`: 1,75 · 2). É o que o texto da folha diz (*"grade de 20 px com traço de 1,5 px;
em 24 e 28 escalam com o traço do catálogo"*); o markup dela desenha 1,8 em todo tamanho — o par `TRACO_N4D86` do gate.

**N4-D87 — a estrela cheia inerte é o `ativoInerte`.** O `Desenho` ganha o campo (o inerte do estado `ativo`) e o
`Icone.tsx` do nativo o estado `'ativo-inerte'`: os quatro estados da folha (vazada, cheia, vazada inerte, cheia
inerte) ficam no catálogo e são cobrados pelo gate. Extra declarado: o tipo `Desenho`, o coletor do gate, o
`elementos()` do `Icone.tsx`. O web não lê estado.

**E duas respostas depois do primeiro relatório** (2026-10-04), verbatim:

- **O G-inv** (div. 1049): *"Nenhuma das três: errata em par na base, sem enfraquecer o instrumento. O G-inv continua
  contando as primitivas dentro do SvgView — é o que deixa ele ver um ícone trocado por engano numa tela congelada, e
  nenhum outro gate confere isso. A troca dos quatro ícones de tipo é decidida (N4-D69), então muda a base, não o gate"*
  — com o gate primeiro (os 8 dumps byte a byte iguais fora dos `SvgView` de tipo), a base em par só nesses nós e com a
  razão, o `SHA256SUMS` em par, os dois controles negativos e a errata da div. 1021 e do N4-R23. Feito nos commits
  `66e4b9e` e `54ce0d1` (§4.5).
- **A fidelidade à folha** (div. 1051): *"Aceito como registrado"*.

---

## 1. O que se mediu antes de escrever

### 1.1 Quem mostra ícone de tipo `[medido: git grep]`

**Tablet** (`apps/native/src`), todos em **20 dp**:

| arquivo:linha | tela | o quê |
| --- | --- | --- |
| `screens/IndexScreen.tsx:169-173` (mapa) · `:326` (o `<Icone>`) | S2, o índice da setlist | o tipo ao lado da palavra; **28** só no item inválido (`tipo-desconhecido`/`sem-conteudo`, que não mudam) |
| `screens/SearchScreen.tsx:79-83` (mapa) · `:139` | S4, a busca | o tipo de cada resultado |

**Não mostram**: a **barra do palco** — o tipo é só palavra (`StageScreen.tsx:107`, `:520`), embora a `S3` do V1 e a
`N4-*-S3-setlist-icones` desenhem um ícone (div. 1047); o **picker** — nenhum ícone de tipo (`Picker.tsx`, só
`fechar`, `busca`, `apagar`, `buscar-musica`, `garantida`, `baixando`, `falha`, `adicionar`) (div. 1042).

**Site** (`components/`), todos em **20 px**, pelo mapa `TIPOS` de `components/library/frases-lista.ts:80-84`
(`tipoDe`, `:88`):

| arquivo:linha | superfície |
| --- | --- |
| `components/library/LinhaDaBiblioteca.tsx:34` | a linha da biblioteca (`/library`) |
| `components/library/LibraryFiltros.tsx:38` | o menu *Filtros* da biblioteca |
| `components/painel/lista-do-painel.tsx:41` | as listas do painel (`/dashboard`) |
| `components/content-viewer/ContentHeader.tsx:35` | o cabeçalho da visualização (`/content/[id]`) |
| `components/add-content/ContentTypeSelector.tsx:29` | o passo 1 do upload (`/add-content`) |
| `components/metadata-form/RefactoredMetadataForm.tsx:48` | a linha do arquivo importado no upload (o ícone vem de `RefactoredAddContent.tsx:59`) |

### 1.2 O desenho na folha × o formato do catálogo `[medido: script sobre o DESIGN-N4/telas.html]`

A seção *"5 · Ícones — decididos"* tem duas tabelas: P-I9…P-I12 (os quatro de tipo: 20·24·28 · normal·inerte em 20 ·
claro) e P-I1a, P-I1b, P-I2 (as ações: normal · pressionado · inerte · em andamento · 20·24·28).

- **Os quatro de tipo** — em **todas** as 745 ocorrências da folha (molduras e tabelas), o desenho vem em `<g
  transform="scale(1.2)" stroke-width="1.5">`: geometria numa grade de 20, traço fixo de **1,8 unidades do viewBox 24**
  em qualquer tamanho (1,5 px em 20; 1,8 em 24; 2,1 em 28). O inerte da folha desenha igual ao normal (o `<g>` fixa o
  traço por cima do 1,25 do `<svg>`).
- **A estrela e o tocar** — grade de 24, sem `<g>`, o traço do catálogo por tamanho (1,5 · 1,75 · 2; 1,25 no inerte).
  A cheia é um `path` preenchido por baixo e o mesmo `path` com contorno por cima. O pressionado tem o desenho do
  normal; o "em andamento" é o inerte mais um arco de 42 × 42 (`viewBox="0 0 42 42"`), que é da tela.
- **O catálogo** (`packages/identidade/src/icones.ts`) guarda **uma grade** (viewBox 24), o **traço por tamanho**
  (`TRACO`, aplicado por quem renderiza: `apps/native/src/icones/Icone.tsx`, `components/identidade/icone.tsx`), o
  traço próprio por primitiva (`traco`), e **exceções por estado e por tamanho** (`ativo`, `inerte`, `em20`).

**A conversão** (um script, nada digitado; o mesmo cálculo está no gate, regra 7): os quatro de tipo têm a geometria ×
1,2 (os números do `d`, menos a rotação e as bandeiras do arco), o `normal` sem traço próprio e o `em20` com `traco:
1.8` em cada traço (N4-D86); a estrela e o tocar são o `d` da folha verbatim, `inerte` com `traco: 1.25`. **A escolha
que a folha não fez** — o traço em 24 e 28 (texto × markup) e a forma da estrela cheia inerte — foi perguntada e
decidida (§0).

### 1.3 A exceção `em20` da tab

Hoje (`main`): `tab.em20` = a tab de **quatro cordas** com dois trastes, verbatim do `<svg width="20">` do
`DESIGN-V1/telas.html` (§6.3 do V1: quatro cordas em 20, seis nos outros tamanhos), cobrada pela regra 4 do
`gate:icones`. **Com a T1** (linhas com um 2), o desenho é o mesmo em todo tamanho: a exceção de cordas **sai em par**
(`EM20_N4`: a tab de quatro cordas → o `em20` da T1, que difere do `normal` só pelo traço). O `em20` passa a existir nos
**quatro** de tipo, pela N4-D86. A regra 4 cobra as duas metades — o velho fora do `em20`, o novo dentro (regra 7) — e
conta as linhas: **3 em todo tamanho** (era 4 × 6).

### 1.4 As três medidas da N4-D64 `[medido: git grep]`

| onde no tipo (`packages/identidade/src/tokens.ts`, na `main`) | valor | quem lê | o CSS do site |
| --- | --- | --- | --- |
| `reordenar.artistaMin: number \| undefined` (`:225`), C = `undefined` (`:350`) | inexistente em C | `apps/native/src/screens/ModoDeReordenar.tsx:229` (`!== undefined`) | não emite: o gerador só leva `web.*` e `folha.*` |
| `folha.alturaMin: number \| undefined` (`:236`), B (e A, o mesmo objeto) = `undefined` (`:372`) | inexistente em B e A | `apps/native/src/screens/FolhaDeCriar.tsx:311` (`minHeight: f.alturaMin`) | `gerar-css.mjs` pula `undefined`: `--faixa-folha-altura-min: 420px` só na faixa C (`app/styles/identidade.css:105`) |

Nenhum leitor no site (`git grep faixa-folha -- app components` → nada).

### 1.5 As folhas congeladas com ícone de tipo em moldura `[medido: congelados-tipo.txt]`

Script: todo `<svg>` dos congelados contra o `d` dos quatro desenhos velhos (e a tab de 20 de cada folha).

| folha | molduras | errata de ponteiro |
| --- | --- | --- |
| `DESIGN-V1/telas.html` | `S2` (os quatro, a tab de quatro cordas em 20), `S3`, `S3-letra`, `S3d`, `S3-claro`, `S3-nobody`, `S3-avulsa`, `S4a-vazio` | **E19** |
| `DESIGN-V1/icones.html` | *Catálogo escuro*, *Catálogo claro*, *Tamanhos* | **E19** |
| `DESIGN-N2/telas.html` | nenhuma | — |
| `DESIGN-N3/telas.html` | `N3-B-S2p`, `N3-A-S2p`, `N3-B-S3`, `N3-A-S3` (só `letra`) | **N3-E21** |
| `docs/ux/DESIGN-I1` | `4-content-lista` (8 estados), `5-content-visualizacao` (14), `7-upload` (8) — com uma tab de quatro cordas **própria** (`M3 6h18M3 10h18M3 14h18M3 18h18`), que não é o `em20` do catálogo | **I1-E32** (e no `erratas.json`, §3) |

### 1.6 Gate que exija uso de todo ícone do catálogo

**Nenhum** `[medido: git grep nomesIcones/desenhos em scripts/, apps/native/scripts/, apps/native/test/, tests/,
.github/]`: só o `gate:icones` (contra as folhas) e o `igualdade.test.ts` (contra a linha de base) leem o catálogo, e
nenhum cobra quem usa. A estrela e o tocar entram sem tela até a PR-7.

---

## 2. O gate em par (commit 1) e os controles negativos

**Commit 1** — o `gate:icones` (`apps/native/scripts/icones.mjs`) ganha a folha do N4 como fonte (regra 7: 7 linhas
P-I, **49 células**, cada uma pelo desenho efetivo — geometria, preenchimento, traço — na ordem), em par (regra 14):

| par | velho → novo | razão |
| --- | --- | --- |
| `TROCAS_N4` (4) | o registro do anexo D do V1 (`letra`, `cifra`, `tab`, `partitura`; 12 elementos que só eles têm) → P-I9…P-I12 | N4-D69 |
| `EM20_N4` (4) | a tab de quatro cordas do `DESIGN-V1/telas.html` (§6.3) → o `em20` dos quatro, traço 1,8 | N4-D69 + N4-D86 |
| `TRACO_N4D86` | o 1,8 do markup em 24 e 28 → o `TRACO` da família | N4-D86 |
| `paresIconesN4` (`linha-de-base.json`, 6) | o desenho da linha de base (ou `null`, nome novo) → o convertido da folha | N4-D68/69/76/87 |

A conta: **34 (V1) + 5 (N2) + 2 (N4) = 41 registros · 45 nomes**. O CN do CI (`IconesFalso`) acompanha em par e o
defeito (6) vira *devolver a tab de quatro cordas ao `em20`*: **24 acusações** (eram 23).

**Reprovando sobre a `main`** `[medido: c1-gate-icones-reprova.txt]`: `acusações: 71 · avisos: 0`, `exit=1`; o
`igualdade.test.ts`: 1 falhando (45 nomes esperados, 43 no pacote). **Depois do commit 2**: `acusações: 0 · avisos: 0`;
igualdade 39/39 (40/40 depois do commit 3).

**Controles negativos** (regra 4), cada um desfeito, `git status` limpo depois `[medido: cn-regra4.txt]`:

| CN | o que se plantou | o gate |
| --- | --- | --- |
| 1 | um ponto do desenho: `letra` normal `L7.5 5.4` → `L7.5 5.5` | **reprova, 2** — `P-I9 24` e `P-I9 28` ≠ folha (o `em20` tem a própria cópia, intacta) |
| 2 | a `partitura` de volta ao desenho velho (o do anexo D, sem `em20`) | **reprova, 11** — o `em20` ausente (par), sete células ≠ folha, três elementos velhos no mapa (`troca-N4`) |
| 3 | a `estrela` tirada do catálogo | **reprova, 15** — falta no mapa, e as catorze células de P-I1a/P-I1b sem o estado |

E dois CN de instrumento, do commit 3: o gerador de CSS sem o filtro de `INEXISTENTE` → o `css.test` reprova com
`--faixa-folha-altura-min: inexistentepx` em B e A `[medido: cn-css-sem-filtro.txt]`; o `igualdade.test.ts` com os
pares de token reprovou antes da implementação, 3 testes `[medido: c3-igualdade-reprova.txt]`.

---

## 3. O que a PR entrega

- **Commit 2** — o catálogo: os quatro de tipo trocados (geometria da folha × 1,2; `em20` com `traco: 1.8`), a
  `estrela` (`normal` vazada, `ativo` cheia, `inerte`, `ativoInerte`) e o `tocar` (`normal`, `inerte`). O `Desenho`
  ganha `ativoInerte`; o `Icone.tsx` do nativo, o estado `'ativo-inerte'`; teste novo `apps/native/test/
  icone-estados.test.tsx` (8). As erratas de ponteiro **E19** (`DESIGN-V1/README.md`), **N3-E21**
  (`DESIGN-N3/README.md`) e **I1-E32** (`docs/ux/DESIGN-I1/README.md`; a linha do `README.md` no `SHA256SUMS` do I1
  refeita, como nas erratas anteriores do I1). **A I1-E32 entra também no `erratas.json`**: com o desenho novo, o
  `conferir.mjs` (c) acha as três formas velhas das folhas 4, 5 e 7 (cifra 42×, letra 50×, partitura 48×) e o G-tok (i)
  exige errata (div. 1045). Nenhuma folha editada; os quatro `SHA256SUMS` nativos e o do I1 conferem.
- **Commit 3** — a N4-D64: `INEXISTENTE = 'inexistente'` (tipo `Inexistente`) no pacote, no molde do `'empilha'` do bloco
  `web`; `artistaMin` e `alturaMin` passam a `number | Inexistente`; os dois leitores comparam com `INEXISTENTE`; o
  gerador não emite propriedade. **O CSS do site, byte a byte igual** `[medido: css-antes.sha]`: `app/styles/
  identidade.css` sha256 `1857944a436b5e3c6ab269011355d94cb317b9de8e3a0557f43fa21c7eb984c9` antes e depois de
  regenerar, `git diff --exit-code` vazio. O `igualdade.test.ts` em par (`paresTokensN4`: `$indefinido` →
  `'inexistente'`, com a razão; o velho conferido) e um teste novo: nenhuma faixa com `undefined`.

---

## 4. A prova por imagem (N4-D75)

### 4.1 Fidelidade à folha `[medido: fidelidade-folha.txt]`

Cada registro do catálogo, renderizado com as regras de quem renderiza (o `Icone.tsx` do nativo: preenchido sem traço;
o do web: `components/identidade/icone.tsx`), ao lado da célula da folha, no mesmo Chromium, em canvas, nas escalas 1 e
2,25 (o Tab S6). **Tolerância declarada antes de medir: 0 px diferentes.**

| | escala 1 | escala 2,25 |
| --- | --- | --- |
| controle folha × folha | 0 | 0 |
| estrela (normal, ativo, inerte, ativoInerte; 20·24·28) e tocar (normal, inerte; 20·24·28) — 16 casos | **0 em todos** | **0 em todos** |
| tipos em **28** (folha com o traço da família, N4-D86) | **0** nos quatro | **0** nos quatro |
| tipos em **24** (idem) | 0 · **cifra 42** (Δ ≤ 40) · 0 · 0 | **0** nos quatro |
| tipos em **20** (nativo) | letra **19** (Δ ≤ 20) · cifra **13** (Δ ≤ 6) · tab **15** (Δ ≤ 2) · partitura 0 | letra 0 · cifra **6** (Δ ≤ 3) · tab **13** (Δ ≤ 3) · partitura 0 |
| partitura em 20 (**web**) | **42** (Δ ≤ 119) | **145** (Δ ≤ 159) |
| tipos em 24/28 × o markup da folha (1,8) | 50–166 | 119–494 — **a diferença que a N4-D86 decidiu** (o traço), registrada |

**A tolerância de 0 não se cumpriu** (div. 1051; **aceito como registrado** pelo Marcel, §0) nos tipos em 20 (e na cifra em 24) a 1×, e por resíduo a 2,25×. **A geometria é
igual número a número** (o gate, regra 7). O que sobra foi investigado com três controles, na ordem:

1. **raster do `transform`**: a folha com `scale(1.2)` × as mesmas coordenadas originais num `viewBox` de 20, sem
   transform → **0 px** nos quatro, nas duas escalas. Não é o `transform`.
2. **ponto flutuante do traço** (`1.5 × 1.2 = 1.7999999999999998`): o catálogo com esse traço → **a mesma diferença**.
   Não é isso.
3. **o pipeline**: uma forma que não é de ninguém (círculo + reta; só retas), o mesmo desenho pelos dois caminhos —
   grade 24 a 0,833 (o do catálogo a 20 px) × grade 20 a 1 (o da folha) → **11 px e 4 px** a 1×, **5 e 0** a 2,25×
   (Δ ≤ 3). **O próprio Chromium dá ≠ 0 entre dois desenhos matematicamente iguais** quando a escala do traçado muda; as
   pontas redondas e os arcos (letra, cifra) são o que mais sente.

**A partitura no web é outra coisa** (div. 1046): o `components/identidade/icone.tsx` desenha os preenchidos **com
traço** (só `fill="currentColor"`, herdando o `stroke` do `<svg>`), e o nativo com `stroke="none"`; a cabeça da nota
sai maior no site. É de antes desta PR (vale para todo preenchido do catálogo no site: os trastes da tab velha, os
pontos do `indice`, do `falha`, do `sem-conexao`…) e consertar mudaria pixel fora das caixas dos ícones de tipo — fora
desta PR.

### 4.2 No site `[medido: site-antes-x-antes.txt, site-antes-x-depois.txt, site-depois-x-depois2.txt, site-antes-x-depois2.txt]`

Perfil persistente (`~/.octavia-g-faixa-perfil`, I1-D37), `localhost:3000`, `pnpm dev` em cada árvore (`antes` =
`origin/main` `bf678e3`; `depois` = esta branch) com o `.env.local` do checkout principal copiado por `cp -p`, sem abrir,
e apagado no fim. Capturas *full page* (Chromium do Playwright 1.55.0), pixelmatch limiar 0; a caixa de cada ícone de
tipo vem do DOM (o `<svg>` cujo `path` é um dos desenhos de tipo, velho ou novo), ±1 px. Barreira: toda escrita a
`/api/*` (fora o cookie de sessão) abortada e contada; request a `octavia.rocks` abortada.

| tela | larguras | dados | ícones de tipo |
| --- | --- | --- | --- |
| `/library` | 1138 · 711 | **fabricados** (`GET /api/content` no navegador, as seis linhas do G-faixa: Cifra, Letra, Tab, Partitura) | 6 |
| `/library` com *Filtros* aberto | 1138 · 711 | fabricados | 10 |
| `/add-content` (passo 1) | 1138 · 711 | nenhum | 4 |
| `/dashboard` | 1138 · 711 | **SSR, a conta real** (div. 699: o painel não se fabrica) — leitura; imagem fora do repositório | 8 |
| `/content/<id>` (o 1º do painel) | 1138 · 711 | **SSR, a conta real** (div. 732) — leitura; imagem fora do repositório | 1 |

| comparação | resultado |
| --- | --- |
| antes × antes (o ruído) | **0 px em 10 de 10** |
| antes × depois | diferença em todas (778–1962 px), **dentro das caixas em 9 de 10**; `library-filtros` em 711: **55 px fora**, todos em cantos arredondados de borda (Δ 1 num canal) |
| depois × depois2 (o mesmo código) | **os mesmos 55 px** na mesma captura, 0 nas outras 9 — ruído do instrumento naquela captura |
| antes × depois2 | **0 px fora das caixas em 10 de 10** |

Escritas abortadas: **0** nas quatro rodadas; requests a prod: **0**. **Não capturado**: a linha do arquivo importado
no upload (`RefactoredMetadataForm.tsx:48`) — exige o fluxo de importação; é o mesmo `<Icone>` e o mesmo `tipoDe` das
outras cinco (div. 1048). O painel e a visualização não se fabricam (div. 1056). Os gates do site: G-back, G-palco, G-tok (com a I1-E32), cobertura e o veredito do G-faixa
**PASSA** (§6); o G-faixa **não foi medido de novo** (a medição commitada é a mesma; a caixa não muda, e a imagem prova
que nada fora das caixas mudou).

### 4.3 No tablet — o aparato

Os dois aparelhos com o **mock** (`apps/native/src/fixtures/aceite.py servidor`, 8788) e a fixture do pre-check do N3
(`N3-PRECHECK-anexos/instrumentos/fixture.py`, *hoje* = 2026-09-23, a da base), o servidor de arquivos (8790) e o
**Metro** sem `CI=1`, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline: o "antes" com o Metro da árvore
`origin/main` (`bf678e3`), o "depois" com o desta branch. **O bundle servido conferido antes de cada rodada** (regra 13,
`bundle-*.txt`): `localhost:8788` 1 · `octavia.rocks` **0** · o `d` da letra velha 1 → 0 · o da nova 0 → 2 · `ativoInerte`
0 → 3. O arnês é o do pre-check do N3 (`roteiro.py`, `passada4-final.py`, `n3pr6.py` — cópias declaradas em
`copias.diff`: a árvore e a porta por variável de ambiente, o prefixo) mais os desta PR em `instrumentos/`. A passada de
paisagem é a final da N3-PR6c (`fin_avd`, `fin_tab`); a de retrato (B) leva palco, S2 com edição, picker e S4.

**O estado de dado da base** (div. 1050): a setlist 2 da fixture tem data `hoje + 3` = **2026-09-26**, e a base foi tirada
com o relógio a 2026-09-24 — dentro da janela de 7 dias do prefetch, que baixou a `partitura-1p.pdf` e deixou o cartão
*garantida offline*. Hoje (2026-10-04) a janela não a cobre: o primeiro "antes" saiu com o cartão *parcial · 0 de 1* e 1
nó a mais nos três S1 — **com o código da `main`**. O remédio, sem mexer no relógio de aparelho nenhum: abrir a "Partitura
de uma página" no palco uma vez (`instrumentos/estado-1p.py`), que a baixa sob demanda; o S1 conta só presença
(`packages/core/src/offline.ts`, `offlineStatus`). Com ele, **o "antes" reproduz a base: AVD 16 de 18 (os dois S0
rodam só no "depois") e 9 de 9; Tab 16 de 16 e 9 de 9** (`roteiros/`).

**A comparação de imagem** (`instrumentos/tab-diff.mjs`): pixelmatch limiar 0 por captura, pareada pelo nome; cada pixel
diferente tem de cair numa caixa de ícone de tipo — o `SvgView` logo à esquerda de um texto *Letra/Cifra/Tab/Partitura*,
dos dois dumps, ± 2 px. Ficam **contados à parte, nunca escondidos** (div. 1053): as barras do sistema (24 dp em cima;
embaixo 60 dp no AVD e 48 dp no Tab — a barra de tarefas da Samsung, cujos ícones mudam de lugar entre rodadas); o
cursor que pisca dentro de um `EditText` (medido: o "antes × antes2" com o mesmo código dá os mesmos 205 e 290 px nos
campos da S4 e do picker, `avd-antes-x-antes2.txt`). Folha e diálogo são janelas modais, e o dump não traz a tela de
trás: as caixas vêm dela, capturada no mesmo estado.

### 4.4 No tablet — o resultado `[medido: avd-antes-x-depois.txt, tab-antes-x-depois.txt]`

| aparelho | capturas (C + B) | pixels fora das caixas dos ícones de tipo |
| --- | --- | --- |
| AVD `octavia_tab32` | 41 | **0 em 39**; nas outras duas (`folha-criar`, `folha-falhou`) 2469 px — o contador do cartão do S1 **atrás do véu** da folha (*0 de 2* × *1 de 2*: um dígito desloca *arquivos baixados*), dado da tela de trás, não ícone (as capturas da folha no "antes" foram refeitas com o 1p no aparelho; a 12p dependia de o palco ter rodado antes) |
| Tab S6 | 43 | **0 em 43** |

As telas com ícone de tipo — S2 (C e B, com e sem edição, com e sem aviso) e S4 com resultados — mudam **só** dentro das
caixas. A **barra do palco** e o **picker**, que o prompt listava, não têm ícone de tipo (divs. 1042, 1047): mudam 0 px
dentro da janela do app. A imagem que o Marcel julgou está em `julgamento-quatro-tipos-zoom.png` (recorte × 4 dos quatro
ícones na captura `N4P4J-S2-julgamento-quatro-tipos-tab-pai`, fixture do projeto).

### 4.5 G-inv, G-N3 — e a base em par `[medido: g-inv-avd-svgsub.txt, c4-par-e-g-inv.txt, cn-g-inv-base.txt, g-n3.txt, g-n3-antes.txt]`

**O que o AVD mostrou primeiro** (div. 1049): o G-inv do "depois" **reprovava em 4 dumps** do AVD — e depois nos mesmos 4
do Tab — por **contagem de nós**: S2 com edição (174 → 188), S2 com edição e aviso (157 → 166), S2 sem edição (105 → 119),
S4 com resultados (73 → 84). O `react-native-svg` dá **um nó `PathView` por primitiva**: a letra velha tinha 1 primitiva
e a nova 4; a cifra, 4 → 1; a tab, 4 → 4 (1 `path` e 3 `rect` → 4 `path`); a partitura, 3 → 3. **Sem os filhos dos
`SvgView`, 27 de 27 chaves do AVD idênticas.** A premissa da div. 1021 e do N4-R23 (*"o ícone de tipo trocar de desenho
não muda `bounds`"* / *"não é diferença de G-inv"*) era falsa: **o G-inv vê o desenho**.

**A errata em par na base** (decisão do Marcel, §0):

1. **Gate primeiro** (`66e4b9e`): `apps/native/scripts/g-inv-par.mjs` — para os **8 dumps** declarados (lista fechada,
   razão N4-D69), com os filhos dos `SvgView` de tipo removidos dos dois lados, base e novo **byte a byte iguais**, com o
   mesmo número desses `SvgView`: **8 de 8**. O G-inv contra a base velha: B5 **26 de 34** (reprova exatamente nas 8
   chaves), B3 **18 de 18**. Os 52 dumps de paisagem do "depois" em `dumps-depois/` (com `SHA256SUMS.txt`).
2. **A base em par** (`54ce0d1`): os 8 XML de `N3-PRECHECK-anexos/B5-baseline/` passam a ser os dumps novos — que só
   diferem da base dentro daqueles `SvgView`, então copiar o novo **é** atualizar só esses nós; a prova é o `g-inv-par`
   da base velha contra a nova, **8 de 8**. O `SHA256SUMS.txt` da pasta muda nas 8 linhas (355 OK); **os PNG da base
   ficam** (o G-inv lê só o XML). **G-inv: B5 34 de 34 · B3 18 de 18.**
3. **Controles negativos** (`cn-g-inv-base.txt`), cada um em cópia temporária dos dumps: **um ícone que não é de tipo
   com o desenho trocado** (o `remover` da linha 1 perde uma primitiva) → G-inv reprova (188 × 187 nós) **e** o
   `g-inv-par` reprova; **um ícone de tipo que muda de caixa** (desce 4 dp) → os dois reprovam. Os CN do N3 que leem a B5
   (`cn-n3pr1`, `cn-n3pr3`, `cn-n3pr6c`) passam com a base velha e com a nova.

**O G-N3** (`g-n3.txt`): **(e) = 6** em 4 dumps de retrato — *"8"* e *"Oitava do ensaio"* na S2 com edição, a linha 8
abaixo da dobra (`APARATO.md`, "S2 (N3-PR3)"). **O mesmo (e) com o código da `main`** (`g-n3-antes.txt`, idêntico linha a
linha): o arnês desta PR não tirou os dumps rolados (`ROLAR=1` do `n3pr3.py`) — div. 1054. (b) = 0; nome acessível 8.

---

## 5. O aparelho e o aceite do Marcel

**O julgamento do traço** (A-N4-19; N4-D75), no **Tab S6**, com o dev client, o mock e o código desta PR, na S2 da setlist
"Ensaio de retrato" da fixture em paisagem — os quatro tipos em 20 dp na mesma tela. A pergunta, por ícone, *a*
minúsculo primeiro; **a resposta do Marcel, como ele a deu**:

| ícone | resposta |
| --- | --- |
| Letra (Aa) — o *a* minúsculo | **bom** |
| Cifra (a palheta) | **bom** |
| Tab (linhas com um 2) | **bom** |
| Partitura (a nota) | **bom** |

**Nenhum ajuste**: a N4-E9 (o anel de 2,75 → 3) não nasce. **A estrela e o tocar** não estão em tela nenhuma até a PR-7:
o julgamento do traço deles (A-N4-18, coluna *Marcel*) passa para a PR-7 — errata no `N4-REQUISITOS.md` (§7).

**O Tab, do começo ao fim** (`estado/`), autorizado `[Marcel, 2026-10-04]` só para esta sessão:

| | |
| --- | --- |
| lido | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **release** de 2026-10-02 09:14:31 (sem `DEBUGGABLE`), bloqueado — o Marcel destravou depois do `stay_on` a 7 |
| ida | `install -r` do dev client guardado (`9447edc7…`): `DEBUGGABLE` |
| o cache do Marcel | guardado arquivo a arquivo com o app parado (`setlists.json` `4d62b9e5…`, `content.json` `b62f192a…`, `files-index.json` `b21cc49b…`, o PDF dele `05253d42…`), demanda vazia; **regravado no fim, md5 a md5 idêntico** (`tab-md5-antes.txt` × `-depois.txt`); a `partitura-12p.pdf` e a `partitura-1p.pdf` que a fixture baixou na demanda, apagadas (vazia de novo); os quatro `._*` ficam onde estão (decisão da N3-PR6c) |
| durante | mock, Metro, `reverse` 8081/8788/8790; avião ligado e desligado pelo roteiro (S1 com aviso, S3e — regra 11, a prova é o `ping`); rotação pelo roteiro |
| volta | `install -r` do release guardado (`6eae4a8b…`, `release-31d6b3a.apk`): sem `DEBUGGABLE`, `lastUpdateTime=2026-10-04 12:48:08` (o 1º `install` completou às 12:47:41 enquanto o `adb` perdia o aparelho — div. 1055 — e foi repetido) |
| as provas da N4-D56 | **em avião, pelo cache** (`n4d56-aviao.txt`): `ping` → `Network is unreachable`; `cache hit kind=setlists n=2` · `kind=content n=63`; `sync skip reason=offline`; **0** requests; o S1 com as duas setlists (`setlist-772076b4`, `setlist-e39d57cf`) e o `aviso-motivo`; `FATAL` 0 · **com rede** (`n4d56-rede.txt`): `ping` 2/2; **2 `GET`** (`/api/setlists` 200, `/api/content` 200), `invalidated=0` nos dois, `sync ok setlists=2 content=63 pages=1`; `FATAL` 0 |
| fim | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio — **igual ao lido** (`tab-fim.txt`); o Tab com o release (N4-D55) |

**O AVD** (`octavia_tab32`): lido `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, dev client de 2026-09-24
14:00:01; subido com `-no-snapshot-save` duas vezes (a segunda depois do S0 frio, que derruba a sessão); avião desligado
e rádio ligado (`ping` 2/2); desligado sem salvar — `ram.bin` de 2026-09-24 14:00, intacto.

---

## 6. Gates `[medido: gates-final.txt, suite-final.txt, sobre 54ce0d1]`

| gate | resultado |
| --- | --- |
| `gate:icones` | **0 acusações · 0 avisos** (41 registros, 49 células do DESIGN-N4, 4 trocas em par); CN `IconesFalso` **24**, exit 1 |
| `igualdade.test.ts` | 40 de 40 (os pares `paresIconesN4` e `paresTokensN4`) |
| G-inv | B5 **34 de 34** · B3 **18 de 18**, contra a base em par (§4.5); `g-inv-par` **8 de 8** |
| G-N3 | (e) = 6 — o mesmo da `main` (§4.5, div. 1054) · (b) = 0 |
| G1a / G1b | com o bloco ```` ```gates ```` do corpo: `G1a: DIFF VAZIO ✓` · `G1b: só adição ✓` (sem o bloco, o G1a acusa os 4 arquivos declarados) |
| G2 / G3 | `testIDs antes=80 depois=80` ✓ · `log( antes=68 depois=68` ✓ |
| `gate:a20` | 0 acusações; CN 4, exit 1 |
| G-par · favoritar · frases | `n4-g-par`, `n4-favoritar-put`, `frases-n4` (web e nativo): verdes — 185 passam no projeto web |
| G-back · G-palco · G-tok · cobertura · G-faixa (veredito) | PASSA · PASSA (0) · PASSA (29 achados, 29 cobertos, com a I1-E32) · PASSA · PASSA |
| `SHA256SUMS` | `DESIGN-V1` 3 OK · `-N2` 2 · `-N3` 2 · `-N4` 2 · `docs/ux/DESIGN-I1` 14 · `N3-PRECHECK-anexos` 355 · `dumps-depois` 52 |
| suíte inteira | `Test Files 125 passed \| 3 skipped (128)` · `Tests 1427 passed \| 59 skipped (1486)`; `tsc` raiz e nativo e lint: limpos |
| CI (`54ce0d1`) | **todos verdes**: `android-debug-apk` 13m36s (job) · `build` 4m02s · `gates-nativos` · `g-back` · `g-faixa` · `g-palco` · `g-tok` · `mudou-nativo` · Vercel; os `gates`/`gates-web` também verdes na edição do corpo. No `9fc5cfe…a267e6e` o APK foi 13m35s |

O bloco ```` ```gates ```` e o ```` ```gates-web ```` do corpo da PR, como ficaram:

```gates
# N4-PR4 — identidade: a estrela, o tocar e os quatro ícones de tipo (N4-D68, D69, D76); a forma da N4-D64.
# Icone.tsx: o estado 'ativo-inerte' (N4-D87). theme.ts: reexporta INEXISTENTE. FolhaDeCriar/ModoDeReordenar: leem INEXISTENTE no lugar de undefined (N4-D64), comportamento igual.
g1a: apps/native/src/icones/Icone.tsx
g1a: apps/native/src/screens/FolhaDeCriar.tsx
g1a: apps/native/src/screens/ModoDeReordenar.tsx
g1a: apps/native/src/theme.ts
```

```gates-web
# N4-PR4 — nenhum arquivo do núcleo do G-back tocado.
# O site muda só pelo catálogo (packages/identidade): os quatro ícones de tipo com desenho novo na mesma caixa; o CSS gerado (app/styles/identidade.css) byte a byte igual.
gtok: a lista (i) ganha a I1-E32 no docs/ux/DESIGN-I1/erratas.json — com o desenho novo, o conferir.mjs (c) acha as formas velhas de cifra (42×), letra (50×) e partitura (48×) nas folhas 4, 5, 7 (29 achados, 29 cobertos)
```

---

## 7. Erratas

- **Nos congelados, de ponteiro** (N4-D74), no commit que troca o desenho: **E19** (`DESIGN-V1/README.md`), **N3-E21**
  (`DESIGN-N3/README.md`), **I1-E32** (`docs/ux/DESIGN-I1/README.md` e `erratas.json`). Nenhuma folha editada.
- **No `N4-REQUISITOS.md`** (este commit, sem renumerar nada): a errata do **N4-R18** (a N4-D87; o julgamento do traço da
  estrela e do tocar, A-N4-18, passa para a PR-7), do **N4-R19** (a N4-D86), do **N4-R20** (a forma da N4-D64:
  `INEXISTENTE`) e do **N4-R23** (o G-inv vê o desenho; a troca decidida se paga com a base em par).
- **No `DESIGN-N4/README.md`**: a errata da **div. 1021** (§13.2).
- **Da folha do N4: nenhuma** (o *a* se sustentou; a N4-E9 continua livre).
- **No `APARATO.md`**: o estado de dado da base com o relógio de hoje (div. 1050) e o que a comparação de imagem do
  tablet conta à parte (div. 1053).

---

## 8. Divergências — 1041 a 1056

A última usada era a **1040** (`N4-PR3-anexos/README.md`) `[medido: git grep -h -o -E '^\| \*\*1[0-9]{3}\*\*' -- docs | sort
-u | tail -3` → `1039 · 1040 · 1138`, o último uma linha de medida]. Origem: **P** premissa do prompt · **D** doc anterior ·
**A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1041** | D | as folhas do I1 (4, 5, 7) mostram os quatro ícones de tipo velhos — e uma tab de quatro cordas **própria** (`M3 6h18M3 10h18M3 14h18M3 18h18`), que não é o `em20` do catálogo | **I1-E32** (README e `erratas.json`) |
| **1042** | P | *"no tablet… a barra do palco… e o picker"* como telas com ícone de tipo: o **picker não tem** ícone de tipo (`Picker.tsx`) | as duas entram na prova como controle (0 px dentro da janela do app, §4.4) |
| **1043** | D | a folha do N4 desenha os quatro de tipo com traço fixo de 1,8 (`<g scale(1.2) stroke-width="1.5">`, 745 ocorrências) e escreve *"em 24 e 28 escalam com o traço do catálogo"*; e diz *"4,25 no inerte, com traço 1,25"*, que o markup não desenha (o `<g>` fixa o traço) | **N4-D86** (§0) |
| **1044** | D | a estrela inerte tem duas formas na folha (vazada e cheia); o `Desenho` tinha um `inerte` só | **N4-D87** (§0) |
| **1045** | T | o G-tok (i) achou, com o desenho novo, as três formas velhas nas folhas do I1 (o `conferir.mjs` (c)); a primeira forma do commit 2 não as cobria. Achado no gate local **antes do primeiro push**: o commit 2 foi refeito localmente (amend + `cherry-pick` do 3; nada tinha subido, nenhum push forçado) | I1-E32 no `erratas.json`, no commit 2 |
| **1046** | A | o `components/identidade/icone.tsx` desenha os **preenchidos com traço** (só `fill`, herdando o `stroke` do `<svg>`); o nativo, com `stroke="none"`. A cabeça da nota sai maior no site (42 px a 1×, 145 a 2,25× contra a folha). É de antes desta PR e vale para todo preenchido do catálogo no site; consertar muda pixel fora das caixas dos ícones de tipo | **bloco de identidade** (herança do N4, com os botões de palavra) |
| **1047** | D | a barra do palco **não mostra** o tipo como ícone (só a palavra, `StageScreen.tsx:520`), e a `S3` do V1 (§6.4: *"barra do S3"*) e a `N4-*-S3-setlist-icones` o desenham | registro; composição do palco não muda no N4 (N4-E7) — **bloco de identidade** |
| **1048** | T | a linha do arquivo importado no upload (`RefactoredMetadataForm.tsx:48`) não foi capturada no site: exige o fluxo de importação | registro: o mesmo `<Icone>` e o mesmo `tipoDe` das outras seis superfícies |
| **1049** | D | a premissa da div. 1021 e do N4-R23 (*"não muda `bounds`… não é diferença de G-inv"*): o G-inv conta os `PathView` de dentro do `SvgView` — 8 dumps da base reprovam | **base em par** (`66e4b9e`, `54ce0d1`; decisão do Marcel); errata do N4-R23 e da div. 1021 |
| **1050** | A | a fixture tem a setlist 2 em 2026-09-26; com o relógio de hoje (2026-10-04) a janela de 7 dias não baixa a `partitura-1p.pdf`, e os três S1 da base (tirados a 2026-09-24) saem com 1 nó a mais — com o código da `main` | `estado-1p.py` (a música aberta no palco, download sob demanda); `APARATO.md` |
| **1051** | T | a fidelidade à folha **não deu a tolerância declarada (0 px)** nos tipos em 20 a 1× (até 19 px, Δ ≤ 20) e na cifra em 24 a 1× (42 px); a 2,25×, resíduo ≤ 13 px, Δ ≤ 3. O Chromium dá ≠ 0 entre desenhos matematicamente iguais quando a escala do traçado muda (o controle do pipeline, §4.1) | **aceito como registrado** pelo Marcel (§0) |
| **1052** | T | no site, `library-filtros` em 711: 55 px em cantos arredondados na captura "depois" — repetidos no "depois × depois2" com o mesmo código | ruído do instrumento; antes × depois2 = 0 fora das caixas (§4.2) |
| **1053** | T | a comparação de imagem do tablet vê o relógio da barra de status, a barra de tarefas da Samsung, o cursor que pisca nos campos, e não acha as caixas atrás de uma janela modal | contados à parte no `tab-diff.mjs`; `APARATO.md` |
| **1054** | T | o G-N3 dá (e) = 6 na S2 em retrato (a linha 8 abaixo da dobra): o arnês desta PR não tirou os dumps rolados — o mesmo (e) com o código da `main` | registro; nenhuma tela desta PR o afeta |
| **1055** | T | o `adb` perdeu o Tab duas vezes por instantes (no `install` do release e num `am start`); os dois comandos repetidos, com o estado conferido | registro (o cabo; `APARATO.md`, "Cabo do Tab") |
| **1056** | P | *"No site… tudo fabricado"*: o painel (div. 699) e a visualização (div. 732) são SSR com a conta da sessão e não se fabricam | capturados com a conta real, **só leitura**, imagens fora do repositório (§4.2) |

**Contagem**: 16 — T 8 · D 5 · P 2 · A 2 · X 0. *(A 1045 é T porque é o gate local achando o que o commit não cobria; a
1046 é A, defeito do produto no site.)* **Próxima divergência livre: 1057.**
*(Errata do encerramento do N4, div. 1140 `[Marcel, 2026-10-07]`: a **Contagem** acima soma 17; a coluna de origem da tabela dá **T 7** — 1045, 1048, 1051–1055 —, e vale a coluna. A tabela não muda. `N4-ENCERRAMENTO.md` §6.1.)*

---

## 9. Contabilidade

| | |
| --- | --- |
| requests a prod pelo app | **2 `GET`** — o sync de leitura da prova da N4-D56 no Tab (`/api/setlists`, `/api/content` p. 1) |
| site (servidor local com o `.env.local` do Marcel) | leituras da conta pela sessão do perfil: `GET /api/profile` 65 (45 no "antes", 20 no "depois", em rodadas espaçadas; **0 respostas 429**), `POST /api/auth/session` 65 (o cookie de sessão), as páginas SSR do painel e da visualização; **escritas abortadas pela barreira: 0**; requests a `octavia.rocks`: 0 |
| escritas | **zero** — em prod, no mock e no site |
| aparelho | Tab S6 (destravado pelo Marcel; release → dev client → release; estado final igual ao lido) e AVD `octavia_tab32` (sem salvar snapshot) |
| `.env*` | `apps/native/.env` copiado por `cp -p` do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro, em cada árvore quando o Metro dela subia, **apagado** depois; `.env.local` copiado por `cp -p` para as duas árvores do site (sha256 `e2282fd32cac…`), **apagado** depois das capturas. Nenhum aberto, nenhum valor lido nem impresso |
| temporários | as árvores `../octavia-n4-pr4-antes` (a `main`, para o "antes"), os PNG das capturas do site e do tablet, os bundles baixados, os logs do Metro e do `next dev`, as cópias do cache do Marcel: no scratchpad da sessão ou fora do commit, apagados no fim |

---

**A próxima PR** (N4-D72): **PR-5 — core da biblioteca**.
