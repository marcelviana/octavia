# QL — PRE-CHECK (Fase A)

**Bloco QL — a quebra de linha.** PR só de docs: nenhuma linha de código muda. O executor lê, mede o que é seguro medir e
propõe; quem decide é o Marcel, no aval. Onde o prompt e o repositório divergem, vale o repositório e a divergência se
registra (§6).

- **Árvore** `../octavia-ql-precheck`, branch `ql/precheck`, sobre `origin/main` = **`81249cd2381c13ef44d2c12b287fa8589e2d148b`**
  `[medido: git rev-parse origin/main]` — o merge da #369, o encerramento da D-0, como o prompt pede.
- **Convenção**: `[medido]` = comando + saída literal desta sessão (no anexo); `[lido]` = do arquivo citado, com caminho e
  linha; `[hipótese]` = o resto.
- **Anexos**: [`QL-PRECHECK-anexos/`](QL-PRECHECK-anexos/README.md).
- **Divergências deste commit**: **1175–1187** (§6). A faixa foi conferida na coluna `[medido]`:
  `git grep -nE '^\| \*\*(11[0-9]{2}|12[0-9]{2})\*\*' -- docs`, filtrando ≥ 1170 → só **1170–1174** (`D0-ENCERRAMENTO.md`);
  nenhum número ≥ 1175 em prosa (`git grep -nE "div(s)?\. ?(117[5-9]|11[89][0-9]|12[0-9]{2})" -- docs` → vazio). A
  primeira livre era a **1175**, como diz o `D0-ENCERRAMENTO.md` §10.

**A ordem dos blocos já está registrada** e não se registra de novo: **QL → resto do D → N5 → identidade → iOS**, com o W5
à parte — a N4-D109 com a errata do fim do §15 do `N4-ENCERRAMENTO.md` (a D-0 encerrada) e a D0-D25
(`D0-ENCERRAMENTO.md` §13) `[lido]`.

---

## 0. Decisões do recorte `[Marcel, 2026-10-08]`

| # | decisão |
|---|---|
| **QL-D1** | O bloco se chama **QL** (a quebra de linha). Decisões QL-D*n*, documentos em `docs/native/QL-*`, branches `ql/…`, árvores `../octavia-ql-…`. |
| **QL-D2** | **O recorte.** **Entra**: a quebra na Letra, no palco e em V, nas faixas C e B do tablet; a Tab **nunca** quebra; a regra da Cifra (QL-D3); as notas no palco (QL-D4); a medição do §10.2.3 do N4 (QL-D10). O algoritmo se prova também na largura de A, porque é pré-requisito do N5. **A quebra é só de exibição: o texto não muda.** **Fica fora**: o site (precedente da N4-D4); as telas da faixa A (N5); a implementação da sincronização automática (QL-D5); todo o resto do Bloco D. |
| **QL-D3** | **A Cifra quebra o par acorde/letra junto, mantendo o alinhamento do acorde à sílaba.** O pre-check mede antes, nos dados reais e em 26 colunas, quantas linhas de Cifra estouram. A regra de alinhamento da linha continuada é decisão de desenho. |
| **QL-D4** | **As notas da música entram no palco, como última fatia, com desenho.** Condição: o pre-check confirma onde elas vivem no dado, o que V já mostra delas (N4-D57) e se o palco já as recebe. Elas são texto e herdam a mesma quebra. |
| **QL-D5** | **A sincronização automática do tablet é lacuna**: o app deveria sincronizar sempre que tiver rede. Hoje, quando a rede volta com o app aberto, ele não sincroniza sozinho. **Esta decisão responde à div. 1143** (N4 §13; N4-D115) e **não estava em nenhum encerramento**: é este pre-check que a registra. **O pre-check faz a Fase A da sincronização (§4, A6)** e responde às três perguntas do Marcel antes de propor qualquer coisa. Proposta a priori, que o pre-check confirma ou derruba com a leitura: **bloco próprio, logo depois do QL e antes do resto do D**. Motivos: não compartilha código com a quebra (o sync está no core e no ciclo de vida do app; a quebra, no leitor); reabre a regra 38 (o item (d), pela N4-D115); muda a contabilidade de prod de toda sessão com release; e toca a mesma `naoRegredir` (N4-D91) que o item 3 do resto do D (D0 §8.2) vai mudar. A decisão final (fatia ou bloco, e onde) vem no aval. |
| **QL-D6** | **Brief curto e desenho curto pelo Claude Design**, depois do aval deste pre-check: a linha continuada (recuo ou marca), a Cifra quebrada e as notas no palco. Desenha C, B e A; implementa C e B, no molde do N3 e do N4. |
| **QL-D7** | **Os gates, primeiro, entrando reprovados:** (i) a quebra como **função pura no `packages/core`** (colunas × tipo; a Tab intacta; o par da Cifra; casos em 55 colunas, na largura de B e em 26); (ii) **a invariância do texto**: o texto do corpo, concatenado, igual ao de hoje; (iii) o **G-inv**: as linhas que cabem ficam idênticas, e a base só muda nos nós de linha longa, por errata em par com o `g-inv-par` (regra 33); (iv) o **G-par** verde, porque a quebra não toca o contrato de leitura. O pre-check responde se a quebra cabe no core ou depende da medição de fonte do React Native (A2). |
| **QL-D8** | **O fatiamento proposto** (de 3 a 5 PRs, estimativa do N4 §15.1): pre-check (com a Fase A do sync e a medição do §10.2.3) → brief e desenho → **PR-1 gates** → **PR-2 a quebra no core** → **PR-3 o leitor** (palco e V; errata em par da base; aceite no AVD e no Tab; o Marcel julga a leitura no Tab) → **PR-4 as notas no palco** → encerramento. Cada PR nomeia a seguinte. O pre-check pode propor outro corte, com o motivo. |
| **QL-D9** | **O bloco termina com release no Tab**, no encerramento, no molde do A-N4-28: o release da `main` sem Metro; 100 + 100 aberturas frias (AVD e Tab) com a contagem de quedas nativas (regra 36); e o julgamento do Marcel com as músicas dele (a letra quebrada se lê no palco?). |
| **QL-D10** | **As corridas do APK fora do filtro** (124 e 146 do `CI-FAIXA.md`): o pre-check mede. O conserto entra neste bloco, na PR-1 de gates, **só se** a mesma lógica puder **deixar de construir o APK quando deveria**, porque aí os gates do QL ficariam cegos. Se for só disparo a mais, o conserto vai ao W5. |
| **QL-D11** | **O dado real se mede no molde do M1 da D-0**: o executor escreve as consultas, só de leitura, e o **Marcel as roda no SQL Editor do Supabase**. Nenhuma requisição do executor a prod, nenhum login, nenhum `.env*` aberto. O Tab repousa com o release e não entra neste pre-check. |

---

## 1. O resumo, para quem lê só isto

1. **Hoje a linha longa não é cortada: ela rola.** O corpo inteiro é um `Text` dentro de um `ScrollView` **horizontal**
   (`apps/native/src/screens/Leitor.tsx:45-52`), no palco e em V. O que a N4-D65 chama de "corta" é a linha que passa da
   coluna e só se lê rolando o corpo inteiro para o lado (div. 1175).
2. **A fonte é IBM Plex Mono, e o caractere tem largura fixa** — no zoom 22, **13,33 dp** medidos (100 caracteres =
   1333,3 dp, `N4-PR8-anexos/regua-avd.txt`). Cabem **80 colunas no palco em C**, **48 em B** (palco e V), **55 em V em
   C** e **26 em A**. Os 55 da N4-E12 são **de V**, não do palco (div. 1176). O músico muda o tamanho (zoom 18–40) só no
   palco, e as colunas mudam com ele (§A1.3).
3. **A quebra cabe no core** como função pura por número de colunas, **porque a fonte é monoespaçada**; o app só mede
   **duas larguras** (a da coluna, que ele já mede, e a de um caractere no zoom corrente) e divide (§A2).
4. **A Cifra não marca o que é linha de acordes.** O `sections[].chords` é um campo de **progressão** de uma linha
   (`components/editors/partes-da-cifra.tsx:50`, `placeholder="Am F C G"`), não alinhado à letra; o par acorde-sobre-letra
   só existe **dentro do texto** (`chords` antigo ou `sections[].lyrics`). O par da QL-D3 exige um **reconhecedor de linha
   de acordes** no core, por heurística, que hoje não existe em lugar nenhum do repositório (§A3).
5. **O PRD da tela 1 proíbe o que o bloco vai fazer.** O T1-R31 diz *"zoom sem re-quebra de linha"*, e o aceite dele é
   *"em cifra com linha de 120 colunas, zoom 150% mantém cada linha em uma linha"* (`PRD-TELA-1.md:236-237`). O QL precisa
   de errata do T1-R31 (e do T1-R25 para a Letra) — div. 1186, pergunta Q4.
6. **As notas** vivem na coluna `content.notes`; V já as mostra (e elas já quebram, em fonte de UI); **o palco já as
   recebe** (o `contentById` traz a linha inteira) e não as desenha. A condição da QL-D4 está cumprida (§A5).
7. **O sync automático já era requisito**: o **T1-R13 passo 4** do PRD da tela 1 manda repetir o sync *"ao voltar do
   background com > 30 s ausente ou ao recuperar rede"* (`PRD-TELA-1.md:158`), e o `net.ts:4-5` o adia a uma *"PR
   posterior"* que nunca veio (div. 1180). E **o texto já muda debaixo do palco hoje**, quando o sync da abertura termina
   com a música aberta (div. 1182). **Recomendação: bloco próprio, logo depois do QL** — confirmada (§A6.5, Q1).
8. **As corridas 124 e 146** dispararam porque o detector **não achou o APK anterior da PR** (`último APK desta PR:
   'inexistente'`), embora ele existisse e fosse verde. A lógica só erra para o lado de **construir a mais**: um push que
   toca o nativo constrói sempre. **Conserto ao W5** (§A7, Q6).

---

## 2. Fase A — a leitura

### A1 — como o leitor corta hoje

**A1.1 — o mecanismo** `[lido]`. O `Leitor.tsx` é do palco e de V desde a N4-PR8 (`Leitor.tsx:1-16`):

- `CorpoDoLeitor` (`Leitor.tsx:45-52`): `<ScrollView horizontal showsHorizontalScrollIndicator={false}><Text style={estilo}>{corpo}</Text></ScrollView>`.
  A cadeia inteira num `Text` só; **nenhum `numberOfLines`**, nenhuma largura fixa. O comentário (`:40-44`): *"é ele que
  impede a re-quebra da linha longa em qualquer zoom (T1-R25/R31 …). Sem quebra de linha no N4, no palco e em V (N4-D66,
  P-O5): a linha mais longa que a coluna rola para o lado."*
- O palco põe o corpo dentro de uma rolagem **vertical** (`StageScreen.tsx:631-640`, `leitor.conteudoPad` = respiro de
  `space.xxl` = 32, e 48 embaixo — `Leitor.tsx:228-231`; `packages/identidade/src/tokens.ts:62`). Em V, igual em C
  (`VisualizacaoScreen.tsx:437-441`) e numa rolagem única com os detalhes em B (`:471-478`).
- **No dump** `[medido: a8/corpos-dos-dumps.txt]`, a cadeia do palco é `ScrollView` vertical → `HorizontalScrollView`
  (`scrollable=true` quando a linha passa) → `ViewGroup` → `TextView corpo`. Os `bounds` do `corpo` saem **recortados**
  pela janela: `[72,270][2488,1249]` no S3a em C, com a Letra da fixture de 110 colunas.
- **"Cortada" é o vocabulário da N4-D65** (*"o leitor … corta linhas que o palco mostra inteiras"*,
  `DESIGN-N4/README.md:107-108`): a linha **sai da coluna** e se lê rolando **o corpo inteiro** para o lado. Não é corte
  (div. 1175).

**A1.2 — a fonte e o tamanho** `[lido]`:

- `estiloDoLeitor` (`Leitor.tsx:31-38`): `font.mono` (IBM Plex Mono 400, `tokens.ts:90`), `fontSize: zoom`, entrelinha
  `1,55` (texto) ou `1,45` (Tab) — `tokens.ts:119`.
- **Monoespaçada.** O caractere em 22 mede **13,33 dp** `[lido: N4-PR8-anexos/regua-avd.txt — "0123…9" ×10 = 1333,3 dp;
  ×1 = 133,3]`, não os 13,2 que a métrica da fonte dá (600/1000 em × 22). A conta que fecha: 13,2 dp × 2,25 = 29,7 px,
  **arredondado a 30 px** = 13,333 dp `[hipótese: o avanço é arredondado ao pixel inteiro; só o 22 foi medido]`.
- **O músico muda o tamanho só no palco**: `zoomSteps = [18, 22, 26, 32, 40]`, padrão 22 (`tokens.ts:115-116`), pelos
  controles `zoom-menos`/`zoom-mais` (`StageScreen.tsx:480-488`, `:690-714`). **V não tem zoom**: usa o `zoomDefault`
  (`VisualizacaoScreen.tsx:418`).

**A1.3 — quantas colunas cabem.** Largura útil do corpo ÷ largura do caractere, para baixo.

| superfície | largura do corpo | 18 | **22** | 26 | 32 | 40 | fonte |
|---|---|---|---|---|---|---|---|
| **palco em C** | 1137,8 − 64 = **1073,8 dp** (= 2416 px no dump) | 100 | **80** | 69 | 56 | 44 | `[medido: bounds do corpo, a8/]` · colunas fora do 22 `[hipótese]` |
| **palco em B** | 711,1 − 64 = **647,1 dp** (= 1456 px no dump de retrato) | 60 | **48** | 41 | 33 | **26** | idem |
| **V em C** | 797,8 − 64 = **733,8 dp** | — | **55** | — | — | — | `[lido: N4-E12, DESIGN-N4/README.md:493-498]` |
| **V em B** | **647,1 dp** | — | **48** | — | — | — | `[lido: N4-E12, "48,5 colunas"]` |
| **A** (celular, 2,625) | 411,4 − 64 = **347,4 dp** | 32 | **26** | 22 | 18 | 14 | `[hipótese: 22 × 0,6 × 2,625 = 34,65 → 35 px = 13,333 dp]`; os ≈ 26 do `DESIGN-N3/README.md:97` |

Fora do 22, as colunas dependem do arredondamento por zoom (18 → 24 px; 26 → 35; 32 → 43; 40 → 54) e **não foram
medidas** — a régua de desenvolvimento só tem o token `leitor` no 22 (`ReguaDeDev.tsx:90`). O que a tabela já mostra: **o
palco em B no zoom 40 tem as mesmas 26 colunas de A no 22**, então o caso de 26 do gate (i) da QL-D7 cobre também o tablet
em pé com o maior zoom.

**A1.4 — o que depende do número de linhas** `[lido]`:

| o quê | como é hoje | o que a quebra muda |
|---|---|---|
| **rolagem automática** | `y += 1` px por quadro (`StageScreen.tsx:451-459`) — por pixel, não por linha | mais linhas = mais altura = **mais tempo** até o fim, à mesma velocidade; nada quebra |
| **posição ao girar (C ↔ B)** | o efeito de troca de música **não** depende da orientação (deps `[posicao, n, setlist, chavePlaceholder, pararScroll]`, `StageScreen.tsx:355-368`); o `y` em pixel fica. Sem quebra, a linha N está na mesma altura nas duas orientações | **com quebra, não**: em C a Letra tem 80 colunas, em B 48, e o mesmo `y` aponta para outro trecho. **O giro passa a precisar de âncora** (a primeira linha lógica visível) — pergunta Q7 |
| **o zoom** | troca a fonte, mantém o `y` | o zoom passa a **re-quebrar** (as colunas mudam), o que o T1-R31 proíbe (div. 1186) — e a mesma âncora do giro |
| **paginação de texto** | **não existe**; página só no PDF (`Leitor.tsx:76-127`) | nada |
| **as bordas de 15 %** | medem o `meio`, não o texto (`StageScreen.tsx:500-520`) | nada |
| **os arneses e os dumps** | ver A8: o G-inv lê `bounds` do `corpo`; o G-N3 compara o `text` do nó entre paisagem e faixa; o G-par de V lê o `textContent` do nó `corpo`; o M2 da D-0 lê comprimento e `sha12` do nó | todos veem a quebra, de jeitos diferentes (A8) |

### A2 — onde a quebra vive

**A fonte é monoespaçada, e por isso a quebra cabe no core.** Com a largura do caractere constante num zoom, *"quantos
caracteres cabem"* é um número inteiro, e quebrar é contar caracteres — sem medir texto. Três formas possíveis:

| forma | o que é | gate (i) da QL-D7 | iOS (herda o core) | o par da Cifra e a linha continuada |
|---|---|---|---|---|
| **(a) quebra nativa** — tirar o `ScrollView` horizontal da Letra e deixar o `Text` quebrar | nenhuma linha de core | **não existe**: o ponto de quebra é do motor de texto do Android, não testável em Vitest | **outra quebra**: o motor do iOS escolhe outros pontos | **impossível**: o motor não sabe de par nem desenha marca de continuação |
| **(b) função pura no core por colunas** + o app mede as larguras — **recomendada** | `quebrar(texto, tipo, colunas)` devolve as linhas visuais, cada uma com o índice da lógica e se é continuação; o app passa `colunas = ⌊largura da coluna ÷ largura do caractere⌋` | **existe e é pura**: casos em 80, 55, 48 e 26 colunas, a Tab intacta, o par, a invariância (ii) | **a mesma quebra**: o core é o mesmo; o iOS só mede as duas larguras | possível: o core decide o corte do par e a marca |
| **(c) medir texto no RN** (`onTextLayout`, linha a linha) | o app mede cada linha desenhada | não é pura | outro motor, outra medida | difícil e caro |

**Recomendação (b), com duas medidas no app** `[hipótese de implementação]`:

- **a largura da coluna** o app já mede (o `onLayout` do `meio` no palco, `StageScreen.tsx:514-519`; em V, o do
  contêiner do leitor), menos o respiro de 2 × 32;
- **a largura do caractere no zoom corrente**: um `Text` invisível com N caracteres mono, medido por `onLayout` uma vez
  por zoom — **a régua de desenvolvimento já mede exatamente isso**, e o controle régua × dump fechou 13 de 13 no N3
  (`APARATO.md` "A régua"). Não se deriva da métrica da fonte: o 13,33 medido não é o 13,2 da conta (A1.2).

**Os riscos da forma (b)**, a medir na Fase B (consulta 1) antes do desenho:

- **caractere que não ocupa uma coluna**: o `\t` (largura variável), o `\r` de texto colado com CRLF, o acento
  **combinante** (NFD: `ç` como `c` + U+0327 conta 2 e ocupa 1). A consulta 1 conta músicas com cada um;
- **o comprimento em JavaScript é UTF-16** e o do Postgres é em caracteres; para o português são iguais, para emoji não.

**O que (b) muda nos gates**: o gate (i) existe; o (ii), a invariância, é uma propriedade da função (juntar as linhas
visuais tirando as continuações devolve o texto) e se testa no core. **Mas a quebra deixa de ser invisível aos
instrumentos que leem o nó desenhado** — A8 e div. 1185.

### A3 — a forma da Cifra

**O contrato do core** `[lido: packages/core/src/content-contract.ts]`:

- `bodyOf` (`:129-139`): Letra = `lyrics`; Tab = `tablature`; Cifra = **as seções** se `sections` é lista não vazia
  (regra (e), N4-D40, `:16-29`), senão o `chords` do topo; Partitura = `null` (arquivo).
- As seções (`textoDasSecoes`, `:72-82`): cada seção é `name` · `chords` · `lyrics`, só os textos não vazios, por `"\n"`;
  as seções com texto, por `"\n\n"`, na ordem da lista.

**O site faz o mesmo** `[lido: components/content/corpo-de-texto.ts:47-56]` (`textoDaCifra`), e ainda acrescenta a
`progression` ao fim e lê `chords` em lista — o que o core deixa fora do par (`content-contract.ts:26-28`; o "fora do par"
do G-par, Bloco D).

**Como se distingue a linha de acordes da de letra: não se distingue.** `[lido]`

- O editor do site grava cada seção com **três campos** (`components/editors/partes-da-cifra.tsx:12`, `Secao`): o nome
  (`input`), os **acordes** — um `input` de **uma linha**, `data-testid="campo-secao-progressao"`, `placeholder="Am F C G"`
  (`:50`) — e a **letra** (`textarea`, `:55`). Os *Acordes rápidos* acrescentam acorde ao fim desse campo, com espaço
  (`components/chord-editor.tsx:59-67`). **É uma progressão, não uma linha alinhada sobre a letra.**
- O par **acorde sobre letra, alinhado à sílaba**, só existe **dentro de um texto**: no `chords` antigo (que o editor,
  ao abrir, põe inteiro no `lyrics` de uma seção `"Content"`, `chord-editor.tsx:24-29`) ou digitado no `lyrics` da seção.
- **Nenhum reconhecedor de acorde existe no repositório**: `git grep -nIE "\[A-G\]" -- '*.ts' '*.tsx' '*.mjs' ':!docs'` →
  vazio `[medido]`.

**O que a QL-D3 exige e hoje não existe**:

1. **um reconhecedor de linha de acordes no core**, por heurística (toda palavra da linha é um acorde ou um separador).
   Ele erra nos dois sentidos: a linha `"A"` ou `"E"` sozinha é acorde ou palavra? A Fase B (consulta 2) aplica uma
   heurística declarada aos dados reais e conta linhas de acordes, pares e pares que passam de 26, 48, 55 e 80;
2. **a regra do corte do par**: as duas linhas cortadas **na mesma coluna**, para o acorde continuar sobre a sílaba —
   e o que fazer quando um acorde atravessa a coluna do corte (recuar o corte até o começo do acorde?). **É desenho**
   (QL-D3), com a medição ao lado;
3. **a decisão de onde o par vale**: só na Cifra, ou também na Letra que tem cifra digitada? A consulta 2 mede as duas
   (pergunta Q2).

### A4 — o site, só leitura

`[lido]` O site **também não quebra**: o painel do corpo é `font-fam-mono … whitespace-pre` dentro de
`overflow-x-auto` (`components/content/painel.tsx:27-28`); a linha longa rola dentro do painel (`painel.tsx:8`,
*"resposta 19"*). A Letra usa `whitespace-pre` (`components/content-viewer/LyricsDisplay.tsx:24`). **As notas quebram**:
`whitespace-pre-wrap break-words` (`components/content-viewer/ContentSidebar.tsx:30`). Para o desenho, o site é o "antes"
igual ao do tablet; para o **G-par**, a quebra não muda o lado do site (QL-D2: o site fica fora).

### A5 — as notas da música

`[lido]`

- **No dado**: a coluna **`content.notes`** (`text`, sem limite — `supabase/schema.dump.sql:90`). Não é `content_data`.
  Não confundir com `setlist_songs.notes` (a nota **da posição**, `schema.dump.sql:34`), que o palco já mostra na barra,
  em uma linha (`StageScreen.tsx:559-566`, `numberOfLines={1}`).
- **Como o site grava**: o editor tem o campo **"Notas"** na aba de metadados (`components/unified-metadata-editor.tsx:91`,
  rótulo `edit.meta.notas` = *"Notas"*, `components/editors/frases-editor.ts:67`), que vai no `PUT` como `notes`
  (`components/content-editor.tsx:80`); o upload tem o mesmo campo (`components/metadata-form/BasicMetadataFields.tsx:39`).
  **"Notas de palco" é o rótulo da visualização do site** (`components/content/frases-visualizacao.ts:16`), não do editor
  (div. 1179).
- **O que V mostra** (N4-D57): `notasDaVisualizacao` = o `notes` sem as pontas, ou nada (`packages/core/src/visualizacao.ts:63-66`);
  V desenha a régua *notas da música* e o texto em **Manrope 16**, entrelinha 1,55 (`VisualizacaoScreen.tsx:152-156`,
  `:541`). **Em V as notas já quebram** — é `Text` de UI, sem rolagem horizontal.
- **O palco já as recebe**: o sync grava a linha inteira (`select('*')`, sem mapear — `packages/core/src/types.ts:46-48`),
  o tipo tem `notes` (`types.ts:56`), e o palco recebe o `contentById` com a linha (`navigation.tsx:234`, `:255`). **Nada no
  palco as desenha.**
- **O que falta para a QL-D4**: só o desenho (onde, em que fonte, recolhíveis ou não) e a tela. Se as notas vão em mono,
  herdam a quebra do corpo; se vão em fonte de UI, como em V, quebram pelo `Text` (decisão de desenho). A consulta 3 da
  Fase B mede quantas músicas têm notas e de que tamanho.

### A6 — a sincronização (a Fase A da QL-D5)

A leitura do caminho do sync foi feita por um agente de leitura com roteiro fixo e conferida pelo executor nos pontos
citados aqui (`grep`/`sed` desta sessão).

**A6.1 — os gatilhos de hoje** `[lido]`:

- **Um lugar emite `sync start`**: `sincronizar()`, `apps/native/src/sync.ts:65`; sem rede ele loga `sync skip
  reason=offline` e volta (`sync.ts:59-61`).
- **Quem chama**: só o `rodarSync` (`apps/native/App.tsx:197-243`), em **dois** momentos — **a sessão entra** (login ou
  sessão restaurada; o efeito de `App.tsx:245-273`, depois de renderizar o cache, T1-R13 passos 1–2) e o **"Tentar de
  novo"** (`App.tsx:275-278`), que só aparece em falha ou sem rede (S1 e L).
- **Não existe**: `AppState` (zero ocorrências em `apps/native` e `packages/core/src`), `RefreshControl`, timer de sync
  (o único `setInterval` é o do `ModoDeReordenar.tsx:353`) `[medido: git grep]`. **A volta da rede só loga** `net online` e
  muda o indicador (`apps/native/src/net.ts:29-38`) — e o cabeçalho do `net.ts:4-5` diz por quê: *"Sem retry automático
  nesta PR — a revalidação ao voltar do background é o passo 4 do T1-R13 (PR posterior)."*
- **O T1-R13 passo 4 já especificava o sync automático**: *"Ao voltar do background com > 30 s ausente ou ao recuperar
  rede: repetir 2 (o web usa 30 s …)"* (`docs/native/PRD-TELA-1.md:158`). A "PR posterior" nunca veio, e nenhum documento
  registra o passo 4 como aberto (div. 1180). A div. 1143 o perguntou como questão de produto sem resposta (div. 1181). **A
  QL-D5 tem, portanto, um requisito escrito** — o do T1-R13, com o prazo de 30 s.

**Os candidatos, com custo** `[lido + hipótese de frequência]`:

| gatilho | custo por evento em prod | frequência provável no uso real | efeito na contabilidade das sessões com release (regra 38 (c)) |
|---|---|---|---|
| a sessão entra (hoje) | `GET /api/setlists` + `GET /api/content` = **2** até 100 músicas (`sync.ts:6-7`: *"1 + ⌈N/100⌉"*; 63 hoje); downloads só de arquivo novo (o plano exclui o que está no disco — `packages/core/src/offline.ts:219-221`; `prefetch plan n=0` em regime) | uma por abertura fria | o que a regra 38 já conta |
| **a rede volta** (T1-R13 passo 4) | **2** `GET` (sem request condicional: nenhum `ETag`/`If-None-Match` — o corpo inteiro trafega mesmo sem mudança); arquivos idem | **a cada volta**: Wi-Fi de palco instável pode dar várias por noite `[hipótese]` | **todo** desligar do avião numa prova com o app aberto passa a custar 2 `GET` — o item (d) se inverte |
| **voltar do segundo plano > 30 s** (T1-R13 passo 4) | **2** `GET` | a cada troca de app longa (metrônomo, mensagem) `[hipótese]` | toda volta ao app numa prova com rede custa 2 `GET` |
| periódico | 2 `GET` por período | constante | contínuo — **não recomendado**: o T1-R13 não o pede e ele não acrescenta nada aos dois de cima com o app aberto |

A família `content-read`/`setlist-read` tem **300/min** por usuário (`PLANO-TRANSICAO.md:331`): o custo não ameaça o
limite. O que ele muda é **a prova**: toda sessão com release passa a contar os syncs dos eventos, não só o da abertura.

**A6.2 — a música aberta no palco quando chega uma versão nova** `[lido]`:

**Hoje, o texto muda debaixo do palco.** O palco **não guarda** o que abriu: recebe o `contentById` da raiz a cada render
(`navigation.tsx:225-279`; os parâmetros da rota só têm ids e posição, `navigation.tsx:39-59`) e calcula o corpo de novo
(`StageScreen.tsx:304-308`: `resolveSong(song, contentById)` → `bodyOf(...)`). Quando o `rodarSync` termina, ele troca o
estado da raiz (`App.tsx:211-217`) e:

1. **o corpo novo aparece na hora**, no meio da música;
2. **se qualquer setlist mudou** (o `reconcileByUpdatedAt` devolve outra lista, `packages/core/src/sync.ts:131-134`), o
   objeto `setlist` muda e o efeito de troca de música roda (`StageScreen.tsx:355-368`): **para a rolagem automática e
   volta ao topo** (`scrollTo({ y: 0 })`);
3. se o número de músicas da setlist mudou, a mesma posição pode apontar **outra música** (`StageScreen.tsx:303`);
4. **V** também troca (`navigation.tsx:327`: `dados.contentById.get(...)`).

Hoje isso só acontece se o músico abrir o palco **antes** de o sync da abertura terminar (os 2 `GET`, ~1–2 s): raro, mas
o requisito do Marcel (**o texto não muda no meio de uma música**) já não vale nessa janela (div. 1182). **Com o sync
automático, a janela vira qualquer volta da rede.**

**O mecanismo proposto**: **a música aberta é uma foto.** O palco e V guardam a linha do content (e a setlist, no palco)
que estavam valendo quando a música abriu; a versão nova vale **na próxima abertura daquela música** (trocar de posição,
sair e voltar). O sync continua gravando o cache e a raiz normalmente; só a tela aberta não troca.
**O custo** `[hipótese]`: um `useRef` por tela, chaveado pelo id da música (e da setlist), mais o CN no `native-tela` (o
sync troca o `contentById` com a tela montada → o nó `corpo` não muda; trocar de posição → muda). O que precisa de
desenho: **avisar** que há versão nova? (uma marca discreta na barra, ou nada — o músico vê na próxima abertura.)

**A6.3 — a `naoRegredir` com syncs mais frequentes** `[lido]`:

- **O mecanismo** (`packages/core/src/favoritar.ts:178-210`): para cada música que um favoritar **confirmou** nesta sessão,
  a linha devolvida pelo `PUT` fica no lugar da que o sync trouxe **só se for estritamente mais nova** (`updated_at`);
  empate, data inválida ou música ausente: vence o sync. Chamada **só** no sync (`sync.ts:107`), depois do `reconcile`. As
  confirmadas vêm de um mapa de módulo, nunca podado (`apps/native/src/favoritar.ts:71-81`, `:170`).
- **Continua valendo** para a corrida que ela foi feita para pegar: o sync leu o servidor **antes** do `PUT` e grava
  **depois** da resposta — coberta por `apps/native/test/favoritar-sync.test.ts:141`.
- **Janela nova, que o sync frequente torna mais provável** `[lido; não medido]`: o `confirmadas.set` de um favorito pode
  cair **entre** a leitura das confirmadas pelo sync (`sync.ts:107`) e a troca do estado da raiz (`App.tsx:211-228`, com o
  salto do `await sincronizar`). Aí o favoritar grava o conteúdo de antes do sync + a linha nova, e o sync em seguida
  sobrescreve a memória **sem a estrela**; disco e memória divergem até o próximo sync.
- **E não há trava de sync**: nenhum "em voo" no `rodarSync` nem no `sincronizar` (`App.tsx:197-243`; `sync.ts:55-125`).
  Hoje o "Tentar de novo" some durante o sync e isso basta; **com gatilho automático, dois syncs concorrentes são
  possíveis**, e o último a terminar vence com o `anterior` que capturou no início — inclusive sobre uma releitura de
  escrita do N2, que não tem `naoRegredir` para setlists (`escrita.ts:296-338`). Div. 1183. **O bloco do sync precisa de
  voo único** (um sync por vez; o gatilho que chega durante um sync marca "de novo ao terminar").
- **A amarração com o item 3 do resto do D** (`D0-ENCERRAMENTO.md` §8.2): se o `PUT` do favorito parar de mexer no
  `updated_at`, a linha confirmada empata com a do sync e **a `naoRegredir` vira nada** (`tLocal <= tSync`). Pior: o
  `reconcileByUpdatedAt` devolve a lista **anterior** quando nenhum `updated_at` mudou (`packages/core/src/sync.ts:131-134`),
  então **um favoritar feito no site também não chegaria ao tablet** até outra mudança na biblioteca — o limite que o
  próprio T1-R10 declara (`sync.ts:124-125` do core). Com sync frequente, esse estado errado fica **mais visível**, não
  menos. **Os três mudam juntos** — o favoritar, a `naoRegredir` e o critério do `reconcile` —, e o bloco do sync é o lugar
  de deixar escrito o que o D tem de mudar junto.

**A6.4 — a regra 38** (`LOGS-OCTAVIA.md:709-720`) `[lido]`:

| item | com o sync automático |
|---|---|
| **(a)** prova sem requisição em avião | **vale** |
| **(b)** o avião antes da primeira abertura, ou a primeira abertura declarada como o sync autorizado | **vale**, e ganha um caso: **desligar o avião com o app aberto também é um sync** |
| **(c)** a contabilidade conta o sync da abertura | **se reescreve**: conta **todo** sync — abertura, volta da rede e volta do segundo plano > 30 s —, 2 `GET` cada até 100 músicas |
| **(d)** *"a volta da rede com o app aberto não disparou sync"* — fato de dois builds | **deixa de valer** e se **remede** no release do bloco do sync, como a N4-D115 manda (*"se remede sempre que o código de sync mudar"*): o fato novo é que dispara, com a contagem |

**A6.5 — a proposta: bloco próprio, logo depois do QL e antes do resto do D — confirmada.** A leitura sustenta os quatro
motivos da QL-D5 e acrescenta três:

1. **não compartilha código com a quebra**: o sync está no `App.tsx`, no `net.ts` e no `sync.ts`; a quebra, no
   `Leitor.tsx` e no core. **A exceção é a foto da música aberta** (A6.2), que mora no palco e em V — mas é um `useRef`, não
   o desenho do corpo, e só é necessária quando o sync automático existe;
2. **é um requisito escrito e não cumprido** (T1-R13 passo 4, div. 1180), com o prazo de 30 s já decidido no PRD;
3. **precisa de voo único** (div. 1183) e da **foto** (div. 1182) — os dois são de sync, não de leitor;
4. **antes do resto do D**, e não depois, porque o item 3 do D (o `updated_at` do favoritar) muda a mesma `naoRegredir`
   (A6.3): o bloco do sync escreve **o CN da janela** e o que o D tem de mudar junto; o D, depois, muda os três sabendo
   disso. Com o D antes, o sync esperaria 8 a 12 PRs (N4 §15.1) com a lacuna e a janela abertas.

**O tamanho** `[estimado]`: pre-check curto (esta Fase A cobre o grosso) → **PR-1** gates (CN do voo único; CN da foto no
`native-tela`; CN da janela da `naoRegredir`; os gatilhos com `AppState` e rede simulados) → **PR-2** o sync automático
(passo 4 do T1-R13, 30 s, voo único, a foto no palco e em V) → **encerramento com release** (a regra 38 (c)/(d) remedida;
100 + 100 frias, regra 36). Sem desenho, salvo se o aviso de "versão nova" (A6.2) entrar.

### A7 — as corridas fora do filtro (QL-D10)

**As duas corridas** `[medido: gh run view <id> --json headSha,event,jobs; gh run view <id> --log]`:

| # | run | PR | head | o detector `mudou-nativo` disse | o APK |
|---|---|---|---|---|---|
| 124 | `36469768806` | #344 (`i1/pr9-content-lista`) | `2587cf1` | `último APK desta PR: 'inexistente', não success (div. 360): roda` | `success`, 13m27s |
| 146 | `37618112090` | #364 (`n4/pr8-visualizacao`) | `5ad9703` | idem | `success`, 11m55s |

**Os dois pushes eram só fora do filtro** `[medido: git diff --name-only <antes> <head>]`: `b496342..2587cf1` toca só
`docs/ux/I1-PR9-anexos/**` e `tests/gates-web/medicoes/**`; `2daf89b..5ad9703`, só `docs/native/N4-PR8-anexos/instrumentos/**`
— os dois ancestrais (push normal, não forçado).

**Por que dispararam** `[lido: apps/native/scripts/mudou-nativo.sh:40-52; native.yml:39-78]`: o `paths` do
`pull_request` é avaliado contra o diff **acumulado** da PR (as duas já tinham tocado o nativo), então o workflow corre; por
dentro, o detector só pula o APK se (1) a ação é `synchronize`, (2) o `antes` é ancestral e (3) **o último APK da PR foi
`success`**, que ele pergunta ao `gh run list --branch <b> --event pull_request --limit 20` excluindo a corrida corrente.
**Nas duas, a consulta voltou vazia** — `'inexistente'` —, e o padrão seguro rodou o APK. **E havia APK anterior verde**:
hoje a mesma consulta lista, para `i1/pr9-content-lista`, a `36462867415` (18:06, `success`) e a `36458680620` (17:31,
`success`) antes da 124 (19:05); para `n4/pr8-visualizacao`, a `37616668248` (11:49, `success`) antes da 146 (12:01)
`[medido: a7/detector.txt]`. **A causa da lista vazia não se mede pelos logs** (o detector imprime só o veredito)
`[hipótese: a listagem da API filtrada por branch e evento devolveu vazio naquele momento]` — div. 1184.

**A série inteira do detector** `[medido: a7/detector.txt — as 61 corridas pull_request do native.yml desde o merge da W4-b2]`:
**37** `success` (pulou ou rodou pelo diff), **18** `opened` (roda), **3** `in_progress` (a 103, a 127 e a 142 — o APK
anterior ainda corria, div. 381), **3** `inexistente`: a **121** (i1/pr6-auth: era de fato o primeiro APK da branch, certo)
e **as duas desta medição**. Duas anomalias em 61.

**As duas perguntas da N4-D114**:

1. **Por que dispararam?** Porque o detector não achou o APK anterior da PR (a consulta voltou vazia) e, na dúvida, roda.
2. **A mesma lógica pode deixar de disparar quando deveria?** **Não para um push que toca o nativo**: o diff do próprio
   push (`git diff --name-only antes head`, `:48-50`) decide, e qualquer caminho nativo faz `nativo=true`; a consulta ao
   APK anterior só é olhada **para pular**, e qualquer resposta que não seja `success` roda. **O único jeito de errar para o
   lado cego** `[hipótese, nunca observado]`: a mesma listagem defasada devolver um APK **mais velho** e verde no lugar do
   mais novo ainda vermelho ou em curso — aí um push **só de docs** sairia `skipped`, e o vermelho do push anterior sumiria
   da lista de checks do head (a div. 360). **O código nativo nunca deixa de ser construído**: o push que o tocou sempre
   tem a sua corrida.

**Conclusão (QL-D10)**: é **disparo a mais** (2 em 61, 25m22s de job). Os gates do QL não ficam cegos — os gates
nativos (G1, G2/G3) rodam no `gates.yml`/`ci.yml`, não dependem do detector, e o APK de todo push nativo roda. **O conserto
vai ao W5** (Q6), com a hipótese do lado cego registrada para ele medir (por exemplo, o detector imprimir a lista que a API
devolveu).

**O H1 e a avaliação do `paths`** `[medido: grep]`: o H1 do W4-b2 é a regra 18 (`LOGS-OCTAVIA.md:599-603`) e o
cabeçalho do `native.yml:10-32`; o preço do `paths` contra o diff acumulado está no `CI-FAIXA.md:116-123` (*"O preço do
B8.1"*). Nenhum dos dois explicava as duas corridas.

### A8 — o inventário do que a quebra toca

**A8.1 — as bases do G-inv** `[medido: a8/corpos-dos-dumps.txt]`. Só a **B3** (o palco) tem nó `corpo`; a **B5** (listas)
não tem nenhum. Na B3 (18 dumps, só paisagem = C, zoom 22, **80 colunas**):

| estado da B3 | tipo | maior linha | linhas > 80 | muda com a quebra em C? |
|---|---|---|---|---|
| `S3a-letra-1a`, `titulo-longo`, `ultima` (× AVD e Tab = **6 dumps**) | Letra | **110** | **1** | **sim** — uma linha lógica vira duas |
| `S3b-cifra-claro`, `S3b-cifra-escuro` (4) | Cifra | 68 | 0 | **não** (cabe em 80) |
| `S3c-tab-autoscroll` (2) | Tab | 78 | 0 | **não** (a Tab nunca quebra) |
| os outros 6 (`S3d-pdf`, `S3e`, …) | — | — | — | não têm corpo de texto |

**Quais nós mudam nos 6** depende da forma (A2): com o `corpo` recortado pela janela em altura (o texto tem 49 linhas,
1671 dp, a janela mostra ~437), a altura não muda no dump; a **largura** muda se o `HorizontalScrollView` sai da Letra (um
nó a menos) ou se o conteúdo passa a ter 80 colunas (2400 px no lugar de 2416 recortados). **Errata em par de 6 dumps
da B3, e a B5 intacta** — é o que o gate (iii) da QL-D7 declara no `g-inv-par`. Nos dumps de retrato (B, 48 colunas) a
Letra tem **42** linhas > 48 e a Cifra **1** (não são base do G-inv; são do G-N3).

**A8.2 — o G-par** `[medido]`. As 10 entradas de `packages/core/fixtures/g-par-site.json` têm a maior linha de **41**
colunas: **nenhuma passa de 48 nem de 55**, e a quebra em C e B não muda o par. Em 26 (A), 3 passam (`letra` 2 linhas,
`tab-texto` 3 — que não quebra —, `cifra-secoes-acordes-vazios` 3). **Mas o G-par tem duas metades** (div. 1185):

- a do core (`tests/gates/n4-g-par.test.tsx:90`) compara o `bodyOf` com o site — **a quebra não a toca**, como a QL-D7 (iv)
  diz, desde que a função da quebra **não** entre no `bodyOf` (a busca também o lê, `packages/core/src/search.ts:42`);
- a de V (`apps/native/test/g-par-visualizacao.test.tsx:73-74`) compara o **`textContent` do nó `corpo` desenhado** com o
  site, byte a byte. Uma quebra que mude o texto do nó (`\n` inserido, marca de continuação, um nó por linha) **reprova
  ali**. E no `native-tela` (jsdom) o `onLayout` não mede nada (`APARATO.md:463-466`): se as colunas vêm de medida, o duplo
  **nunca quebra**, e o G-par de V passa **sem ver a quebra** — instrumento com escopo menor do que parece. O PR-1 precisa
  dar colunas ao duplo e dizer o que o G-par de V compara (o texto lógico).

**A8.3 — o G-N3** `[lido: apps/native/scripts/g-n3.mjs:285-296]`. O (e) procura cada texto de folha da paisagem **igual**
no dump da faixa; o (d′) compara largura do mesmo texto. Se a quebra muda o `text` do nó, ela muda **diferente** em C (80
colunas) e em B (48): o `corpo` da Letra deixa de ser "o mesmo texto" nos **6 pares** de Letra do `dumps-g-inv` da
N4-PR9 (e nos 4 da Cifra, que quebra em B e não em C), e o (e) os conta. O (b) e a rolagem não mudam. **Ou a quebra
fica fora do texto do nó, ou o G-N3 ganha o critério do texto lógico** — errata do instrumento no PR-1 (regra 32).

**A8.4 — os instrumentos de comprimento e `sha12`** (o M2 da D-0, `D0-ENCERRAMENTO-anexos/m2/README.md:43-48`: `<texto len
59 sha12 9b51694daeac> corpo`). Seguem valendo **só se** o texto do nó não mudar; com a quebra no texto, passam a
comparar o texto lógico (juntado sem as continuações). A invariância (ii) da QL-D7 é exatamente essa prova, no core.

**A8.5 — writers e leitores do corpo no app** `[medido: git grep -n "bodyOf\|isValidContent\|CONTENT_DATA_KEY\|content_data" -- apps/native/src apps/native/App.tsx packages/core/src]`:

| | quem | o que faz com o corpo | a quebra |
|---|---|---|---|
| **writers** | o sync (`store.ts`, `gravarContent`); o favoritar (a linha devolvida pelo `PUT`, N4-D35) | gravam a linha inteira no cache | **nada** — o app nunca escreve `content_data` (o `PUT` do favorito leva só `{id, is_favorite}`, `packages/core/src/favoritar.ts:55`) |
| **leitores** | o palco (`StageScreen.tsx:307-308`); V (`VisualizacaoScreen.tsx:263`, `:417`) | desenham | **onde a quebra entra** |
| | a busca (`packages/core/src/search.ts:42`) | indexa o `bodyOf` | **não pode** receber o texto quebrado |
| | `offline.ts:34`, `:170`; `song.ts:27`; `prefetch.ts:51`; `LinhaDaBiblioteca.tsx:75` | só a validade (texto ou arquivo) | nada |

### A9 — a fixture de linhas longas no AVD

**Não rodou** (opcional; declarado). Razões: o "antes" do desenho **já existe commitado**, com o dado da fixture do
projeto — a Letra de 110 colunas no palco em C (`N3-PRECHECK-anexos/B3-referencia-paisagem/REF-S3-S3a-letra-1a-{avd,tab}-pai.png`)
e em B (`N4-PR9-anexos/dumps-g-inv/N4P9F-S3-S3a-letra-1a-*-ret.*`), a Cifra de 68 e a Tab de 78 nos mesmos diretórios; e a
única medida nova que o AVD daria agora — **a largura do caractere nos zooms 18, 26, 32 e 40** (A1.3) — pede um token de
régua por zoom, que é código (PR-1). Nenhum aparelho foi tocado nesta sessão.

---

## 3. Fase B — proposta, não roda neste commit

**As três consultas** (QL-D11), só de leitura, **prontas para colar** no SQL Editor do Supabase:
[`fase-b/q1-linhas-por-tipo.sql`](QL-PRECHECK-anexos/fase-b/q1-linhas-por-tipo.sql),
[`fase-b/q2-cifra-pares.sql`](QL-PRECHECK-anexos/fase-b/q2-cifra-pares.sql),
[`fase-b/q3-notas.sql`](QL-PRECHECK-anexos/fase-b/q3-notas.sql).

- **A conta principal está escrita nas consultas** — `xVDJRBh1WpPOatbfWahOLttYn1E3`, a N1-h1 verdadeira
  (`N1-ENCERRAMENTO.md:137`; `N2-BRIEF-anexos/README.md:18`). **Não há nada a substituir à mão**, e cada consulta devolve
  a coluna `conta` = os 4 primeiros caracteres do `user_id` lido, que tem de sair **`xVDJ`** (a lição da div. 1158).
- **Nenhuma consulta lê ou imprime texto de música**: só contagens e comprimentos (`char_length`).
- **O corpo é o do core**: Letra `lyrics`, Tab `tablature`, Cifra pelas seções (a regra (e)) senão o `chords`.

| consulta | mede |
|---|---|
| **1** — linhas por tipo | por tipo: músicas, com corpo de texto, linhas; **músicas e linhas acima de 26, 48, 55 e 80** colunas; a maior linha e o p95; e quantas têm `\t`, `\r` e acento combinante (os riscos da A2) |
| **2** — a Cifra e o par | em Cifra e em Letra: **linhas de acordes** (heurística declarada no cabeçalho), **pares** (acordes + letra logo abaixo), **pares acima de 26, 48, 55 e 80**, o maior par, e as linhas de acordes e as outras acima de 26 |
| **3** — as notas | por tipo e no total: músicas com notas, o maior comprimento, a mediana, a maior linha, quantas têm linha acima de 26 e de 48, quantas têm mais de uma linha |

**A prova local** `[medido: fase-b/prova-local/]`: as três rodaram num Postgres 17.11 **descartável, local** (no
scratchpad, `127.0.0.1:55432`; parado e apagado no fim), sobre uma tabela `content` carregada com o `g-par.json` do core e
linhas escritas pelo projeto (`gerar.mjs`), **mais uma linha de outra conta, que não pode contar**. O esperado foi
calculado pelo **`bodyOf` do core** e a mesma heurística em JavaScript (`esperado.json`). **Todas as colunas batem**
(`saida-psql.txt` × `esperado.json`): na Cifra 6 · 6 · 33 linhas · 3/6 acima de 26 · 2/2 acima de 48 e 55 · 0 acima de
80 · maior 70 · 1 com `\t` · 1 com `\r` · 9 linhas de acordes · 7 pares · 3 acima de 26 · maior par 70; na Letra 6 · 5 · 19 ·
4/8 · 1/3 · 1/2 · 1/1 · maior 81 · 1 com acento combinante · 1 par; na Tab 3 · 3 · 8 · 2/4 · 1/1 · 1/1 · 1/1 · maior 93; as
notas 2 · maior 100 · maior linha 73 · 1 com mais de uma linha. A linha da outra conta ficou fora.

**Depois do aval**: o Marcel cola as três, e a saída entra **verbatim** num commit próprio
(`QL-PRECHECK-anexos/fase-b/saida-marcel.txt`), com a leitura no documento.

---

## 4. A contabilidade desta sessão

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** |
| aparelhos | **nenhum** — AVD não usado (A9 não rodou); Tab S6 não tocado |
| GitHub | só leitura: `gh run view`/`gh run list` de 61 corridas do `native.yml` (A7) |
| banco | um Postgres 17.11 **local e descartável** para a prova das consultas (§3), parado e apagado |
| agentes | **1** de leitura (o caminho do sync, A6), só leitura; as citações usadas aqui foram conferidas pelo executor |
| a árvore | `pnpm install --frozen-lockfile` (dependências da suíte); `git status` só com os arquivos desta PR |
| suíte · `tsc` · lint | `Test Files 140 passed \| 3 skipped (143)` · `Tests 1706 passed \| 59 skipped (1765)`; `tsc` raiz 0 · core 0 · identidade 0 · nativo 0 (na forma dos encerramentos; a forma `-p apps/native` da raiz dá 35 erros — div. 1187); `✔ No ESLint warnings or errors` `[medido: suite-tsc-lint.txt]` |
| fora de `docs/` | `git diff --stat origin/main -- . ':!docs'` → **vazio** `[medido: no commit]` |

---

## 5. Perguntas para o aval

**Q1 — o sync automático (QL-D5): fatia ou bloco, e onde?** (a) **bloco próprio, logo depois do QL e antes do resto do
D**, com o escopo do A6.5: o T1-R13 passo 4 (rede volta; segundo plano > 30 s), **voo único**, **a foto da música aberta**
(o texto não muda no meio), o CN da janela da `naoRegredir`, e o release com a regra 38 (c)/(d) remedida; (b) fatia do
QL; (c) depois do resto do D. **Recomendo (a).** E um nome para ele (sugestão: **SY**).

**Q2 — a forma da QL-D3.** A leitura sustenta: (1) um **reconhecedor de linha de acordes** no core, por heurística
declarada, com a Fase B medindo quantas linhas e pares ele acha; (2) o par cortado **na mesma coluna**, com o corte
recuado ao começo do acorde que atravessaria a coluna — o alinhamento da continuação é desenho; (3) **onde vale**: só na
Cifra, ou também na Letra com cifra digitada. **Recomendo**: (1) e (2) como estão; (3) **decidir depois da Fase B** — se
a consulta 2 achar pares na Letra, o par vale para os dois tipos (o músico não escolhe o tipo pensando no palco).

**Q3 — onde vive a quebra (A2).** (a) **função pura no core por colunas**, o app medindo a largura da coluna e a de um
caractere no zoom corrente; (b) a quebra nativa do `Text`; (c) medir cada linha no RN. **Recomendo (a)** — é a única que
tem gate puro, faz o par da Cifra e dá ao iOS a mesma quebra.

**Q4 — a errata do PRD da tela 1** (div. 1186). O T1-R31 manda *"zoom sem re-quebra"* e o aceite dele é a Cifra de 120
colunas **numa linha**; o T1-R25 manda Letra e Cifra como `pre`. O QL contradiz os dois para a Letra e a Cifra (a Tab
fica). (a) **errata dos dois no PR-1**, com a razão (o PERF-10 era a re-quebra do navegador destruindo o alinhamento da
cifra — o que o par da QL-D3 resolve) e o aceite novo; (b) outra forma. **Recomendo (a).**

**Q5 — os instrumentos que leem o nó desenhado (A8, div. 1185).** O G-par de V, o (e) do G-N3 e o comprimento/`sha12` do
`corpo` veem a quebra se ela mudar o texto do nó. (a) **o PR-1 faz a errata dos três instrumentos** para comparar o
**texto lógico** (as linhas visuais juntadas sem as continuações), dá colunas ao duplo do `native-tela` (senão o G-par de V
passa cego), e prova cada um com CN; (b) desenhar a quebra sem mudar o texto do nó. **Recomendo (a)** — (b) prende o
desenho da continuação ao que o `uiautomator` expõe.

**Q6 — as corridas 124 e 146 (A7).** (a) **W5**: é disparo a mais (2 em 61), com a hipótese do lado cego registrada
para medir; (b) conserto na PR-1 do QL. **Recomendo (a)** — a QL-D10 manda ao W5 quando é só disparo a mais.

**Q7 — a posição ao girar e ao mudar o zoom.** Com a quebra, o `y` em pixel deixa de apontar o mesmo trecho (A1.4). (a)
**âncora na primeira linha lógica visível**, recalculada a cada mudança de colunas, no PR-3, com o caso no aceite
(girar no meio de uma Letra longa); (b) voltar ao topo. **Recomendo (a)** — voltar ao topo no meio da música é o que o
requisito do Marcel proíbe no sync (A6.2).

**Q8 — o fatiamento (QL-D8).** **Confirmado, com quatro ajustes**: (1) a **PR-1 gates** também traz a errata do T1-R31/R25
(Q4), a errata dos três instrumentos (Q5) e o CN da medida do caractere; (2) a **PR-3 o leitor** traz a errata em par dos
**6 dumps de Letra da B3** (a B5 fica byte a byte) e a âncora (Q7); (3) a **PR-4 as notas** pode encolher para ir junto
da PR-3 se o desenho as puser no corpo, em mono (decisão do desenho, não deste pre-check); (4) a Fase B roda **antes do
brief**, porque os números dela (pares, `\t`, acento combinante) são entrada do desenho. Ordem: **Fase B → brief e
desenho → PR-1 → PR-2 → PR-3 → PR-4 → encerramento com release**.

**Q9 — a Fase B.** As três consultas do §3, coladas pelo Marcel, com a saída verbatim num commit próprio. **Recomendo
rodar como estão.**

**Q10 — a A9** (a fixture no AVD) **não rodou**; o "antes" do desenho são os PNGs e dumps já commitados (§A9). (a)
**aceitar**; (b) rodar antes do brief. **Recomendo (a)**; a largura do caractere nos outros zooms se mede no PR-1, com o
token de régua.

---

## 6. Divergências deste commit — 1175 a 1187

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros (`N4-PRECHECK.md:603-604`; `D0-PRECHECK.md` §4).

| div. | origem | o quê | destino |
|---|---|---|---|
| **1175** | P | *"no palco e em V, a linha que não cabe é cortada"*: **ela rola** — o corpo inteiro num `ScrollView` horizontal (`Leitor.tsx:45-52`). "Corta" é o vocabulário da N4-D65 para a linha que sai da coluna | A1.1 |
| **1176** | D | O `N4-ENCERRAMENTO.md` §10.2 item 1 (e o prompt) atribui *"≈ 55 colunas em C, N4-E12"* ao palco e a V; a **N4-E12 mede V** (733,8 dp). **O palco em C tem 80** (1073,8 dp, os `bounds` do `corpo` na B3) | A1.3; os casos do gate (i) da QL-D7 ganham o 80 |
| **1177** | P | O prompt chama o AVD de `octavia_tab`; o `APARATO.md:61` o chama de **`octavia_tab32`** | registrado (o AVD não foi usado) |
| **1178** | P | *"as regras 1–39"*: o catálogo tem a **0–5** e a **9–39**; **não existem 6, 7 e 8** (`LOGS-OCTAVIA.md:507-511`, div. 335) | registrado |
| **1179** | P | *"como o editor do site as grava (Notas de palco)"*: no editor o campo se chama **"Notas"** (`unified-metadata-editor.tsx:91`; `frases-editor.ts:67`); *"Notas de palco"* é o rótulo da **visualização** do site (`frases-visualizacao.ts:16`) | A5 |
| **1180** | A | **O T1-R13 passo 4 nunca foi implementado** — *"ao voltar do background com > 30 s ausente ou ao recuperar rede: repetir 2"* (`PRD-TELA-1.md:158`); o `net.ts:4-5` o adia a uma *"PR posterior"*; nenhum encerramento o registra como aberto | A6.1; Q1 |
| **1181** | D | A div. 1143 (N4 §13) e a N4-D115 perguntaram *"desejado ou lacuna?"* como questão sem resposta; **o PRD já respondia** (o passo 4 do T1-R13) | A6.1; nota de ponteiro no `N4-ENCERRAMENTO.md` §13 |
| **1182** | A | **O texto já muda debaixo do palco**: o palco e V recalculam o corpo do `contentById` da raiz a cada render (`StageScreen.tsx:304-308`; `navigation.tsx:234`, `:327`); se o sync termina com a música aberta, o texto troca, e com qualquer setlist mudada a rolagem automática para e o corpo volta ao topo (`StageScreen.tsx:355-368`). Hoje só na janela do sync da abertura | A6.2; a foto, no bloco do sync (Q1) |
| **1183** | A | **O sync não tem voo único** (`App.tsx:197-243`; `sync.ts:55-125`): dois syncs concorrentes terminam no último, com o `anterior` velho; e há a janela da `naoRegredir` entre `sync.ts:107` e `App.tsx:211-228`. Hoje o "Tentar de novo" escondido basta; com gatilho automático, não | A6.3; o bloco do sync (Q1) |
| **1184** | T | **As corridas 124 e 146**: o detector disse `último APK desta PR: 'inexistente'` com APK anterior verde na mesma branch (a consulta à API voltou vazia); a causa não se mede pelos logs. 2 em 61 corridas `pull_request` desde a W4-b2 | A7; W5 (Q6) |
| **1185** | P | QL-D7 (iv): *"o G-par verde, porque a quebra não toca o contrato de leitura"* — vale para a metade do core; **a metade de V lê o `textContent` do nó `corpo` desenhado** (`g-par-visualizacao.test.tsx:73-74`) e reprova se o texto do nó mudar; e no jsdom, sem `onLayout`, o duplo nunca quebraria — o G-par de V passaria **cego** | A8.2; Q5 |
| **1186** | D | **O recorte contradiz o PRD da tela 1 sem citá-lo**: o T1-R31 (*"zoom … sem re-quebra de linha"*, aceite: *"cifra com linha de 120 colunas … mantém cada linha em uma linha"*) e o T1-R25 (*"Lyrics, Chords-texto e Tab … como texto monoespaçado/`pre`"*) — `PRD-TELA-1.md:215-216`, `:236-237` | Q4: errata do PRD no PR-1 |
| **1187** | T | `npx tsc --noEmit -p apps/native` **da raiz** dá exit 2 (35 × TS2488 em `apps/native/test/*.tsx`); **de dentro do pacote** — a forma dos encerramentos (`N4-ENCERRAMENTO-anexos/gates.txt:392`) — dá 0. A causa da diferença não foi medida | registrado; a forma de dentro vale |

**Contagem** `[medido: a coluna]`: **13 — P 5 · D 3 · A 3 · T 2** (P: 1175, 1177, 1178, 1179, 1185 · D: 1176, 1181, 1186 ·
A: 1180, 1182, 1183 · T: 1184, 1187). **A próxima livre é a 1188.**

---

## 7. Erratas de ponteiro — neste commit

No molde das existentes, sem reescrever texto:

- **`docs/native/N4-ENCERRAMENTO.md` §13**, depois da tabela: a div. 1143 respondida pela QL-D5 (lacuna), com o T1-R13
  passo 4 e a div. 1181.
- **`docs/ux/PLANO-TRANSICAO.md`**, na "Sequência": a nota da abertura do QL.

## 8. Os blocos de declaração da PR, verbatim

```gates
# QL pre-check: nenhuma declaração — só docs.
```

```gates-web
# só docs — QL pre-check: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
