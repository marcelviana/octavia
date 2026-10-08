# D-0 — pre-check: a Tab editada que nenhum leitor vê

> **Data**: 2026-10-07. **Base**: `origin/main` = `69fd3c2` (o merge da #366, o encerramento do N4). **Árvore**:
> `../octavia-d0-precheck`, branch local `d0/precheck-fase-a`, empurrada para o remoto **`d0/precheck`** (o nome local
> `d0/precheck` está preso a outra árvore — div. 1145). `pnpm install --frozen-lockfile --offline`.
> **Lugar**: `docs/ux/`, a convenção dos blocos do **web** (B2…B7, C, I1; a tabela do Bloco D vive no
> `docs/ux/I1-ENCERRAMENTO.md` §10.1 e no `docs/ux/PLANO-TRANSICAO.md`, "Bloco D"). Não há documento anterior do Bloco D,
> então o nome segue o dos pre-checks: `D0-PRECHECK.md`, com os anexos em [`D0-PRECHECK-anexos/`](D0-PRECHECK-anexos/README.md).
> **Escopo**: só documentação e leitura. Nenhuma linha de código de produto, nenhuma requisição a prod, nenhum aparelho,
> nenhum `.env*`. Uma execução local de função pura (os dois leitores sobre formas fabricadas, 0 requisições) está
> declarada como extra no §4 e tem o bruto no anexo.
> `[medido]` = comando + saída literal nesta sessão, no anexo citado; `[lido]` = do arquivo:linha ou documento citado.
> Nenhum texto, título ou artista de música real: os exemplos de tab são fabricados (`e|--1--|`) ou do próprio projeto
> (o compasso de exemplo do editor).

> **O bloco, reescrito no aval (D0-D20, `[Marcel, 2026-10-08]`)** — **hoje o editor do site só salva cerca de 1 em cada
> 5 músicas**: **158 de 196 contents (81 %)**, em todas as contas, têm a dificuldade vazia, e todo salvar deles volta 400
> (div. 1152; o M1, §9.2). **A D-0 faz o editor do site voltar a salvar**: a Tab editável como texto (o caminho 1a), a
> `tablature` sempre presente no corpo de uma Tab (div. 1149) e a dificuldade vazia indo como `null` (div. 1152). **Fora**:
> o título em *Informações* (div. 1147, segundo da fila do D), a Tab criada do zero, o `updated_at` do favoritar, a Cifra.
> O §0–§6 é o commit 1 (a Fase A, antes destes números); o §7–§12 é o commit 2.

---

## 0. As decisões — D0-D1…D5 `[Marcel, 2026-10-07]`

| # | decisão |
|---|---|
| **D0-D1** | A D-0 existe, vem **antes** do bloco da quebra de linha, e cuida **só da Tab**. |
| **D0-D2** | O `updated_at` mexido pelo favoritar **não entra** na D-0. Fica no resto do Bloco D, com a dependência escrita ao lado: desde a N4-PR5 (**N4-D91**, `docs/native/N4-PR5-anexos/README.md:39`), o tablet protege a estrela de regredir durante um sync comparando o `updated_at` da linha que o `PUT` devolveu com o da linha que o sync leu (`packages/core/src/favoritar.ts:181-210`, `naoRegredir`). Se o favoritar parar de mexer no `updated_at`, essa proteção deixa de funcionar; **os dois têm de mudar juntos**. |
| **D0-D3** | A Cifra (o editor que grava as seções e mantém o `chords` antigo) fica fora: desde a N4-PR2 nenhum leitor mostra o texto antigo. |
| **D0-D4** | A ordem dos blocos: **D-0 → quebra de linha → resto do D → N5 → identidade → iOS**, com o W5 à parte. |
| **D0-D5** | **Como** consertar a Tab não está decidido: é a pergunta deste pre-check. Os caminhos se medem antes de escolher. |

**Erratas de ponteiro, neste commit** (o `N4-ENCERRAMENTO.md` §15.1 e a nota do N4 no `PLANO-TRANSICAO.md` descreviam a
D-0 com o `updated_at` dentro — div. 1146): no **`docs/native/N4-ENCERRAMENTO.md`**, uma nota depois da tabela do §10.4
(o item 1 vira a D-0; o item 3 amarrado à N4-D91) e uma errata no fim do §15; no **`docs/ux/PLANO-TRANSICAO.md`**, uma
nota depois da nota do N4. As três sem reescrever texto, no molde das notas existentes.

---

## 1. Fase A — leitura estática

### A1 — o que o editor faz com uma Tab

**Ao abrir** `[lido]`:

1. A página do editor lê a linha (`GET /api/content/<id>`) e o `ContentEditor` monta o estado: a linha inteira, os campos
   normalizados (`null → ""`) e `content_data: content.content_data || {}` (`components/content-editor.tsx:33-48`).
2. O corpo por tipo recebe **`{ ...editedContent, ...editedContent.content_data }`**
   (`components/editors/content-type-editor.tsx:45`): as chaves do `content_data` **sobrescrevem** as do topo.
3. O `TabEditor` monta o seu estado com `title`, `artist`, `tuning` (padrão `"Standard (EADGBE)"`), `capo`, `bpm` e
   **`measures: content.measures || compassoFixture()`** (`components/tab-editor.tsx:25-32`; o mesmo no `useEffect`,
   `:35-44`). A ordem é: o `measures` do `content_data`; senão, o compasso de exemplo (`:20-22`).
4. **O editor nunca lê a `tablature`.** Nenhum dos arquivos do editor cita a chave `[medido:
   leitura-estatica.txt, o último bloco]`; a *Prévia* mostra só *afinação · capo · BPM* (`components/editors/partes-da-tab.tsx:58-66`).
   O músico que abre uma Tab importada vê o exemplo, não a tab dele.

**Ao salvar** `[lido]` — há dois caminhos de mudança, e só um deles chega ao `content_data`:

- **Mudança dentro do editor de tab** — os campos de *Informações* (título, artista, afinação, capo, BPM;
  `components/editors/informacoes.tsx:14-36`, ligados em `tab-editor.tsx:86`) e os compassos (adicionar, remover,
  duplicar, editar uma corda; `tab-editor.tsx:53-82`): `updateTabData` devolve `{ ...content, ...tabData }` (`:48-51`), e
  o `handleContentChange` espalha **tudo isso dentro do `content_data`** (`content-type-editor.tsx:31-39`). O topo do
  `editedContent` não muda.
- **Mudança em *Detalhes*** (`components/unified-metadata-editor.tsx:26`): vai ao topo do estado, e o `content_data` fica
  como estava.

O corpo do `PUT` (`content-editor.tsx:51-73`) leva os campos do topo e `content_data: { ...content_data, annotations,
…(:68-70) }`, com o `updated_at` no fim (`:85`). A linha `:70` (`editedContent.measures`) **nunca dispara**: o `measures`
mora dentro do `content_data`, não no topo.

**O que grava**: o `content_data` inteiro de novo, com `measures` (lista de `{ id, strings[6] }`), a cópia da linha
(a poluição, `I1-ENCERRAMENTO.md` §10.1 item 1) e `title`/`artist`/`tuning`/`capo`/`bpm` do editor de tab **dentro** do
`content_data`. **O que deixa como estava**: a `tablature` (viaja intacta no espalhamento) e — quando o título muda nas
*Informações* do editor de tab — **a coluna `title`** (div. 1147; o corpo leva `editedContent.title`, que não mudou).

**A rota** `[lido]`: sem `content_type` no corpo, o `PUT` lê o tipo da linha e aplica o contrato de escrita
(`app/api/content/route.ts:260-278`) — a Tab exige `tablature` string (`lib/content-data-contract.ts:40-48`), e passa
porque a `tablature` velha vem no espalhamento. O `content_data` do corpo **substitui** o do banco (`route.ts:290`); o
`updated_at` vai em todo `PUT` (`:282-284`).

**A estrutura gravada** (exemplo fabricado; a cópia da linha abreviada):

```json
{
  "tablature": "e|--1--|",
  "measures": [{ "id": 1, "strings": ["E|--0--3--0--2--0--5|", "B|--1--1--1--1--1--|", "G|--0--0--0--0--0--|",
                                      "D|--2--2--2--2--2--|", "A|--3-------------|", "E|----------------|"] }],
  "tuning": "Standard (EADGBE)", "title": "…", "artist": "…", "capo": "", "bpm": "",
  "content_data": { "tablature": "e|--1--|" }, "id": "…", "updated_at": "…", "…": "…",
  "annotations": []
}
```

**O gate do `PUT` do editor guarda hoje o defeito** `[medido: leitura-estatica.txt, A1]`: o caso *"tab (tablatura em
texto, sem compassos)"* (`tests/gates/i1-editor-put.test.tsx:86-94`) edita **uma corda** e grava, byte a byte
(`tests/gates/fixtures/editor-put-antes.json`), um corpo com a `tablature` **igual à de entrada**, `measures` = 1
compasso de 6 cordas (o exemplo com a corda editada), `content_data.tuning = "Standard (EADGBE)"` e **nenhum `tuning` no
topo**. É a I1-D9 (*"o que o editor grava não muda"*): o gate foi feito para não deixar o redesenho mexer no dado, e por
isso trava o defeito junto.

### A2 — o compasso de exemplo

**A condição** `[lido]`: a Tab **sem `measures` no `content_data`** abre o exemplo (`tab-editor.tsx:31`, `:42`). Toda Tab
criada pelo site está nesse caso (A3), e toda Tab que nunca passou pelo editor de tab.

**Quando o exemplo é gravado**: só quando **uma mudança passa pelo editor de tab**. Abrir e sair não grava; abrir e clicar
em *Salvar* sem mudar nada não existe — o *Salvar* só fica ativo quando o corpo do `PUT` difere do de abertura
(`content-editor.tsx:80-81`; `components/editors/cabecalho-do-editor.tsx:26`), e o exemplo vive no estado local do
`TabEditor`, fora do `editedContent`.

**Salvar depois de mudar só o título** — depende de onde:

| onde o título muda | grava o exemplo? | o título chega à coluna? |
|---|---|---|
| *Detalhes* (`unified-metadata-editor.tsx:56`) | **não** — o `content_data` vai como era, mais `annotations: []` | **sim** |
| *Informações* do editor de tab (`informacoes.tsx:24`; `tab-editor.tsx:86`) | **sim** — `measures` = o exemplo inteiro, a cópia da linha e a afinação padrão | **não** — só `content_data.title` (div. 1147) |

Depois do primeiro salvar com `measures`, o editor **nunca mais** abre o exemplo: abre o que foi gravado.

**Como distinguir no dado** (as três classes que a Fase B conta):

1. **sem `measures`** — a Tab nunca passou pelo editor de tab (pode ter passado por *Detalhes*: aí aparece
   `annotations`);
2. **`measures` igual ao exemplo** (um compasso, `id: 1`, as seis cordas de `tab-editor.tsx:21`, comparação de JSON) — o
   editor gravou o exemplo sem que ninguém tocasse nas cordas (uma mudança em *Informações*);
3. **`measures` diferente do exemplo** — alguém mexeu nos compassos.

Dois limites: a classe 3 inclui *"editou e voltou ao exemplo"* (indistinguível e inofensivo); e **toda** edição da classe 3
foi feita **sobre o exemplo, não sobre a tab do músico** — o editor nunca mostrou a `tablature`. Nada na linha diz se o
músico quis substituir a tab dele pelo que digitou. A cópia da linha dentro do `content_data` traz o `updated_at` **de
antes** da edição (o espalhamento copia a linha como foi aberta), o que data a versão anterior.

Este A2 é `[lido]`; a medição local que o prova está orçada no §6 (M0).

### A3 — de onde vêm as Tabs

`[medido: leitura-estatica.txt, A3]`

| origem | o que grava em `content_data` | o que os leitores mostram | o que o editor faz com ela |
|---|---|---|---|
| **criar do zero** (`components/content-creator.tsx:32`, `CONTENT_TYPE_KEYS` de `types/content.ts:11`) | `{ tablature: "" }` | o core: texto de comprimento 0; o site: o vazio do painel (div. 1148) | abre o exemplo; tudo que o músico escrever vai a `measures` e **nunca** chega a leitor nenhum — a `tablature` fica `""` |
| **upload de arquivo** (`hooks/useAddContentLogic.ts:198-226`) | nada → `null` (`app/api/content/route.ts:188`) | os dois: sem corpo | salvar dá **400** `content_data.tablature` — o corpo leva `{ annotations: [] }` sem a chave do tipo (div. 1149, `[lido]`); no dado de 2026-09-08, 0 de 15 Tabs tinham arquivo (`packages/core/src/content-contract.ts:91-93`) |
| **lote** (`components/batch-preview.tsx:56`) | `{ tablature: <o corpo aparado> }` | o texto | abre o exemplo; a edição vai a `measures` |
| o ramo de lote do hook (`useAddContentLogic.ts:170`, `content_data` string) | — | — | **inalcançável pela tela**: com músicas lidas, o passo mostra a `BatchPreview` (`components/add-content/DetailsStep.tsx:43-45`) |
| **o nativo** | não escreve `content_data` (as escritas são as das setlists, `packages/core/src/escrita.ts`, e o favorito, `{ id, is_favorite }`, `favoritar.ts`) | — | — |

**O dado real, já lido**: em **2026-10-01** (N4-PR0, cache do Tab S6 depois de um sync de leitura), as **2 Tabs** da conta
principal tinham `content_data` = **`[tablature=string]`, e nada mais** `[medido: leitura-estatica.txt, Fase B]` — nenhum
`measures`, nenhuma poluição: até aquela data, nenhuma das duas tinha passado pelo editor (nem por *Detalhes*).

### A4 — quem lê uma Tab

`[medido: leitura-estatica.txt, A4]` — **nenhum leitor lê `measures`**; fora do editor, a chave só aparece na linha morta
`content-editor.tsx:70` e no exemplo do G-faixa.

| leitor | o que lê | onde |
|---|---|---|
| **o contrato do core** | `tablature` string → texto (string vazia inclusive); ausente → `no-key`; não-string → `not-string`; `null` → `no-body` | `packages/core/src/content-contract.ts:37-42`, `:120-122`, `:129-139` |
| **o palco** (tablet) | `isValidContent` + `bodyOf` | `apps/native/src/screens/StageScreen.tsx:307-308` |
| **a visualização** (tablet, V) | idem | `apps/native/src/screens/VisualizacaoScreen.tsx:263`, `:417` |
| **a busca do tablet** | o corpo pelo `bodyOf` | `packages/core/src/search.ts:42` |
| **o leitor do site** | `tablature` em lista (linhas juntas por `"\n"`) ou texto não vazio; senão, o vazio do painel | `components/content/corpo-de-texto.ts:59-63`; `components/content-viewer/TabDisplay.tsx:19`, `:24-33` (capo e afinação vêm das **colunas**, `:28-29`) |
| **a busca do site** | só `title`, `artist`, `album` — não lê corpo | `app/api/content/route.ts:75` |

**O G-par hoje, para a Tab**: o par tem **9** itens e **um** de Tab, `tab-texto` (`{ tablature }`, string); o fora do par
tem **7**, dois de Tab — `tab-em-lista` e `tipo-legado` (`"Guitar Tab"`), ambos destino Bloco D; a lista de reprovados
está **vazia** e é condição fixa (N4-D50) `[medido]`. **O que o par não tem**: a Tab com `tablature: ""` — onde os dois
leitores **discordam** (o core diz texto de comprimento 0; o site, o vazio do painel; `[medido: leitores-tab.txt]`, div.
1148) — e a Tab com `measures` (os dois a ignoram, e o par passaria igual).

### A5 — o caminho 1: o editor grava onde os leitores leem

O editor de tab **abre a partir da `tablature`** e **grava a `tablature`**. A condição de abrir pela `tablature` não é
detalhe: um editor que só passasse a **gravar** a `tablature` a partir dos compassos — as duas formas que o §15.1 do
`N4-ENCERRAMENTO.md` listava (*"o editor serializa os compassos para a `tablature`, ou o salvar grava os dois"*) —, ainda
abrindo o exemplo, **apagaria a tab do músico** no primeiro salvar, trocando-a pelo exemplo editado (div. 1150).

**Existe forma de texto definida?** Não `[medido]`: o contrato diz só *"string"* (`docs/api/CONTENT-DATA.md`, a tabela;
`lib/content-data-contract.ts:46`), e nenhum código serializa `measures` em texto. Duas formas para o editor:

- **1a — o texto inteiro num painel.** Um campo de texto mono (`lineHeight.tab`, rolando na horizontal, o contorno do
  painel), aberto com a `tablature` (lista → linhas juntas por `"\n"`, como o `textoDaTab`; ausente → `""`), gravando a
  `tablature`. **Sem conversão, sem perda.** É o que a folha desenhou: *"o compasso 1 com a tablatura do content,
  desenhado como painel de leitura"* (div. 776, `docs/ux/I1-PR11-anexos/README.md:448`); a decisão 7 da I1-PR-11 manteve
  os seis campos e o exemplo como *"dado, herança D"* (`:363-366`).
- **1b — os compassos sem exemplo.** A `tablature` abre como **um** compasso cujas "cordas" são as linhas
  (`tablature.split("\n")` — o `CompassoDaTab` já desenha qualquer número de linhas, `partes-da-tab.tsx:43-52`), e o
  salvar grava `measures.map(m => m.strings.join("\n")).join("\n\n")` na `tablature`. Com um compasso, a volta é exata
  (`split`/`join` são inversos). **Perdas**: não se insere nem se apaga uma linha no meio (cada linha é um `<input>`; só
  *Adicionar compasso* acrescenta seis linhas-modelo no fim, `tab-editor.tsx:54`); o `<input>` tira `\r` e `\n` do valor
  (a sanitização do HTML), então uma linha CRLF editada perde o `\r`; e a divisão em compassos não sobrevive a reabrir.

**Arquivos** (as duas formas): `components/tab-editor.tsx` (o estado, o exemplo `:20-22` sai, `:31`/`:42`, as ações
`:53-82`); `components/editors/partes-da-tab.tsx` (o painel); `components/editors/frases-editor.ts` (as frases de
compasso que saem ou mudam — 1a); `components/content-editor.tsx:70` (a linha morta). **Nenhum arquivo do núcleo do
G-back** (`scripts/gates-web/g-back-nucleo.txt` tem a rota, o `api-schemas`, o `content-data-contract` e o
`types/content`; nenhum dos quatro muda) `[medido]`.

**As Tabs já editadas**: a `tablature` delas **nunca foi tocada** — os leitores seguem mostrando a tab de antes, como hoje.
O `measures` vira chave morta: o editor deixa de escrevê-la e de lê-la. O que estiver na classe 3 do A2 (edição sobre o
exemplo) continua invisível — se o dado tiver alguma, ou se recupera (A7, caminho 3) ou se decide caso a caso (§5, Q3).
**Não exige migração.**

**O gate do `PUT` e o esquema**: a rota e o contrato de escrita não mudam (a `tablature` já é a chave obrigatória); o
esquema do banco não muda (`jsonb`). O gate byte a byte muda **no caso da Tab** — par declarado (regra 14). De passagem,
a div. 1149 some: com o editor gravando a `tablature`, a Tab sem `content_data` passa a salvar.

### A6 — o caminho 2: os leitores leem o que o editor grava

**O que muda**: o contrato do core ganha uma regra para a Tab (`measures` em lista não vazia → texto, com precedência
sobre a `tablature`) e o leitor do site ganha a mesma (`corpo-de-texto.ts:59-63`), para o G-par valer; a errata do
T1-R7 (`docs/native/PRD-TELA-1.md` §4) e do `docs/api/CONTENT-DATA.md` (regra 9: *"comportamento de contrato vive no
arquivo do contrato"*); itens novos na fixture do G-par; e, para o palco ver, **um release novo no Tab** — o Tab repousa
com o release (N4-D55, `docs/native/APARATO.md:69-77`), e mudança só de `packages/core/**` não dispara o APK do CI
(`.github/workflows/native.yml:2-8`) `[lido]`. A busca do tablet passa a indexar o texto dos compassos.

**Como `measures` vira o texto do palco**: não há forma definida (A5); seria uma regra nova, nos dois leitores — por
exemplo, as cordas de cada compasso por `"\n"` e os compassos por `"\n\n"`.

**A precedência, com o risco do A2 à vista** — o caminho 2 herda o exemplo:

- `measures` vence sempre → **toda Tab em que alguém mudou só um campo de *Informações*** passa a mostrar **o exemplo no
  lugar da tab**, no palco, em V e no site; e toda Tab da classe 3 passa a mostrar *o exemplo com a edição* no lugar da
  tab real. É perda de leitura no palco.
- `measures` vence só quando difere do exemplo → o core e o site precisam carregar o exemplo do editor como constante, e a
  classe 3 ainda troca a tab real pelo exemplo editado.
- `measures` só quando a `tablature` está vazia → **o único seguro**, e cobre só as Tabs criadas do zero e editadas.

E o defeito de raiz fica: o editor continua abrindo o exemplo e nunca mostra a tab importada; toda edição futura de uma
Tab importada continua sendo feita sobre o exemplo. **O precedente da Cifra não se transpõe**: a Cifra abre o editor **a
partir do texto real** (uma seção `"Content"` com o `chords` inteiro, `components/chord-editor.tsx:24-29`; N4-D51,
`N4-PR2-anexos/README.md` §8) — por isso ler as seções bastou; a Tab abre do exemplo. **As Tabs já editadas**: com a
precedência cheia, mudam de corpo no palco; com a precedência "só vazia", só as do zero aparecem.

### A7 — outros caminhos

- **Caminho 3 — o 1 com recuperação no abrir.** O caminho 1, mais: quando a `tablature` está vazia ou ausente **e**
  `measures` é lista não vazia **diferente do exemplo**, o editor abre com os compassos em texto (a regra da 1b). Recupera,
  no próximo salvar, a edição das Tabs criadas do zero, sem tocar nos leitores. **Só vale se o dado tiver essas linhas**
  (Fase B, M1).
- **Caminho 4 — migração.** Um `supabase/migrations/…` que copia os compassos em texto para a `tablature` nas linhas com
  `tablature` vazia e `measures` ≠ exemplo; aplicação pelo Marcel (`CLAUDE.md`). Faz sentido no resto do D, junto da
  limpeza da poluição (`I1-ENCERRAMENTO.md` §10.1 item 1) — não para 0 linhas.
- **O 1 e o 2 juntos**: o 2 não acrescenta nada que o 3 não faça, e traz o risco do A6.

| caminho | conserta | deixa | arrisca | tamanho `[estimado]` |
|---|---|---|---|---|
| **1a** | o editor abre a tab do músico; a edição chega aos quatro leitores | `measures` morto nas Tabs já editadas | mudar a tela da folha 6 (o G-faixa remede `EDIT-tab`) | 1 PR; 3–4 arquivos do site + 1 gate novo + 1 par |
| **1b** | idem | idem; não insere/apaga linha no meio | a edição limitada; CRLF | 1 PR; 2–3 arquivos + gates |
| **2** | só a Tab do zero editada (com a precedência segura) | o editor abrindo o exemplo | a tab trocada pelo exemplo no palco (precedência cheia) | core + site + 2 erratas de contrato + G-par + **release** + aceite no Tab |
| **3** | o do 1 + a edição das Tabs do zero | — | quase nenhum: só lê `measures`, nunca grava | o 1 + uma regra no abrir |
| **4** | o dado já gravado | — | escrita em massa em prod | migração + prova contra o dado real |

### A8 — os gates

| gate | caminho 1 (1a/1b) | caminho 2 |
|---|---|---|
| **o do `PUT` do editor** (`i1-editor-put.test.tsx`) | o caso da Tab muda: **par declarado** `velho → novo · razão` (regra 14); só esse caso se regrava, os outros quatro byte a byte | não muda |
| **o G-par** (`n4-g-par.test.tsx`) | não muda (os leitores não mudam) | itens novos (Tab com `measures`; com `measures` = exemplo; vazia com `measures`), entrando reprovados no commit 1 e passando no conserto; a lista de reprovados segue vazia (N4-D50) |
| **gate novo, o da D-0** | **"o que o editor grava, os leitores mostram"**: monta o editor com uma Tab fabricada, edita, pega o corpo do `PUT`, aplica sobre a linha como a rota (o `content_data` substitui) e passa pelos **dois** leitores — tem de dar o texto editado; e o guarda do A2: mudar só o título (em *Detalhes* e em *Informações*) não troca o corpo. **Reprova na `main`** (regra 30) | o mesmo gate serve |
| **o G-back** | o núcleo não é tocado → declaração *"nenhum arquivo do núcleo"* no ```` ```gates-web ```` | idem (core e `corpo-de-texto` fora do núcleo) |
| **o G-tok** | os arquivos do editor estão na lista (`g-tok-arquivos.txt:86-98`): frase nova vai às `frases-editor.ts`; frase que sai, sai da lista de isentas no mesmo commit (a órfã reprova, regra 14, ampliação do I1) | o `corpo-de-texto.ts` e o `TabDisplay` — sem frase nova |
| **o G-faixa** | o estado `EDIT-tab` (`tests/gates-web/medicoes/content-edit.json`) se **remede** nas três larguras (medição commitada, veredito no CI); o exemplo `g-faixa-editor-exemplos.ts` deixa de levar `measures` | `VIEW-tab` só se o corpo mudar de forma |
| **os do tablet** (G1/G2/G3, G-inv, APK) | **nenhum**: nem `apps/native/**` nem `packages/core/**` mudam | o core muda (testes do contrato no `pnpm test`); o APK não dispara pelo core; **o release se refaz** à mão |

### A9 — o que os documentos dizem da D-0, e o que este pre-check corrige

- `docs/native/N4-ENCERRAMENTO.md` §15.1 (*"PR D-0 — estancar a gravação"*): a Tab **e** o `updated_at`, a Cifra fora, a
  migração no D, *"uma PR de código"*; a N4-D116 a deixou *"para o Marcel decidir"* (§15.4). → **errata de ponteiro**
  (div. 1146): só a Tab; o `updated_at` no D, amarrado à N4-D91.
- O mesmo §15.1 propunha *"o editor serializa os compassos para a `tablature`, ou o salvar grava os dois"*. → **as duas
  formas, sem abrir pela `tablature`, apagam a tab real no primeiro salvar** (div. 1150; A5).
- `docs/ux/PLANO-TRANSICAO.md`, nota do N4: o *"em aberto"* da D-0, com o `updated_at` dentro. → **nota nova** depois
  dela.
- `docs/native/N4-ENCERRAMENTO.md` §10.4 item 1 e `docs/ux/I1-ENCERRAMENTO.md` §10.1 item 17: *"primeira da fila do D"*.
  → a nota depois do §10.4 diz que o item virou a D-0; o `I1-ENCERRAMENTO.md` não muda nesta PR (o prompt limita os
  arquivos), e a nota do N4 vale para ele.
- `docs/ux/I1-ENCERRAMENTO.md` §10.1 item 3 (*"a tab sem `measures` abre o compasso-fixture e o grava"*): procede, com a
  condição do A2 (só por uma mudança dentro do editor de tab).

---

## 2. As hipóteses do prompt

| # | hipótese | veredito | evidência |
|---|---|---|---|
| H1 | *"Toda edição de Tab feita no site se perde para o músico — o editor grava num campo que nenhum leitor lê"* | **procede para a tablatura**; os campos de *Detalhes* se salvam; o título digitado em *Informações* também se perde (div. 1147) | A1, A4 `[medido]` |
| H2 | O I1 registra que a Tab sem o campo do editor abre o compasso de exemplo e que o editor o grava | **procede, com condição**: grava só quando a mudança passa pelo editor de tab | A2 `[lido]` |
| H3 | (D0-D3) Desde a N4-PR2 nenhum leitor mostra o `chords` antigo da Cifra | **procede** | `content-contract.ts:115-117`; `corpo-de-texto.ts:47-55` `[lido]` |
| H4 | (D0-D2) O tablet protege a estrela pelo `updated_at` (N4-D91) | **procede** | `favoritar.ts:181-210`; `N4-PR5-anexos/README.md:39` `[lido]` |
| H5 | Há pelo menos dois caminhos; o 2 é o que a N4-PR2 fez com a Cifra | **procede**, mas o precedente não se transpõe: a Cifra abre do texto real, a Tab do exemplo | A6 `[lido]` |
| H6 | O Marcel tem 2 Tabs | **procede** (em 2026-10-01) | `N4-PRECHECK-anexos/b1-b4-biblioteca-principal.txt:87` `[medido]` |
| H7 | O Tab S6 repousa com o release, que não deixa ler o cache | **procede**: o release não tem `run-as` | `APARATO.md:69-77`; `N4-PR2-anexos/README.md` §9 `[lido]` |
| H8 | O `N4-ENCERRAMENTO.md` ou o plano descrevem a D-0 com o `updated_at` dentro | **procede, nos dois** → erratas de ponteiro | §15.1; a nota do N4 (div. 1146) |
| H9 | A árvore e a branch `d0/precheck` se criam do zero | **não procede**: a branch já existia, presa a outra árvore com um rascunho não commitado | div. 1145 |
| H10 | A última divergência usada é anterior à 1145 | **procede**: a 1144 (`N4-ENCERRAMENTO.md` §13, *"a próxima livre é a 1145"*) | `grep` `[medido]` |

---

## 3. A comparação dos caminhos

| | **1a** texto no painel | **1b** compassos sem exemplo | **2** leitores leem `measures` | **3** = 1 + recuperação |
|---|---|---|---|---|
| **o que conserta** | o editor mostra a tab; a edição chega ao site, ao palco, a V e à busca | idem, com edição limitada | só a Tab do zero editada (precedência segura) | o do 1, mais a edição das Tabs do zero |
| **as Tabs já editadas** | `tablature` intacta, como hoje; `measures` morto | idem | mudam de corpo (precedência cheia) ou só as do zero aparecem | idem ao 1, mais as do zero recuperadas no próximo salvar |
| **o risco do exemplo** | **some** — o exemplo deixa de existir | some | **central**: o exemplo no lugar da tab | some (só lê `measures` ≠ exemplo) |
| **arquivos** | `tab-editor`, `partes-da-tab`, `frases-editor`, `content-editor:70` | `tab-editor`, `content-editor:70` | `content-contract.ts`, `corpo-de-texto.ts`, PRD T1-R7, `CONTENT-DATA.md`, fixture do G-par | os do 1a ou 1b |
| **gates** | o do `PUT` (par), o novo da D-0, G-tok, G-faixa `EDIT-tab` | o do `PUT` (par), o novo, G-faixa | G-par (itens novos), o novo, testes do core | os do 1 |
| **o site muda?** | sim (o editor) | sim (o editor) | sim (o leitor) | sim (o editor) |
| **o tablet muda?** | **não** | **não** | **sim** — contrato do core e release | **não** |
| **exige migração?** | não | não | não (e não conserta o dado) | não |

**Recomendação: 1a**, com a recuperação do 3 **só se** a Fase B achar Tab da classe 3 com a `tablature` vazia.

---

## 4. As divergências desta PR — 1145 a 1151

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros (`N4-PRECHECK.md:603-604`).

| div. | origem | o quê | destino |
|---|---|---|---|
| **1145** | A | **A branch `d0/precheck` já existia**, local (sem commit próprio, = `origin/main`, sem remoto, sem PR), presa à árvore `../octavia-d0`, que tinha **trabalho de outra sessão não commitado** — um `docs/ux/D0-PRECHECK.md` (240 linhas, gravado às 19:52) e uma mudança no `PLANO-TRANSICAO.md`, com a D-0 **antes** destas decisões (o `updated_at` dentro). | **não tocado** (regra das sessões paralelas, `CLAUDE.md`); esta árvore é `../octavia-d0-precheck`, branch local `d0/precheck-fase-a`, empurrada para o remoto `d0/precheck`. Pergunta Q9 |
| **1146** | D | O `N4-ENCERRAMENTO.md` §15.1 e a nota do N4 no `PLANO-TRANSICAO.md` descrevem a D-0 com o `updated_at` dentro | erratas de ponteiro neste commit (§0) |
| **1147** | A | **O título digitado em *Informações* do editor de tab não chega à coluna `title`**: vai só para `content_data.title` (`tab-editor.tsx:48-51`; `content-type-editor.tsx:31-39`; o corpo leva `editedContent.title`, `content-editor.tsx:53`). O editor da Cifra tem o mesmo desenho (`chord-editor.tsx:38-41`). Não estava registrado (`grep` nos documentos do I1 e do N4) | `[lido]`; M0 o mede; pergunta Q7 |
| **1148** | A | **A Tab criada do zero** (`tablature: ""`): o core diz texto de comprimento 0, o site mostra o vazio do painel — os dois leitores discordam, e o G-par não tem o item `[medido: leitores-tab.txt]`. O que o palco desenha com corpo de comprimento 0 não foi lido | pergunta Q8 |
| **1149** | A | **A Tab de upload** (`content_data: null`) não se salva no editor: o corpo leva `{ annotations: [] }` sem `tablature`, e o contrato devolve 400 `content_data.tablature` `[lido]`. 0 de 15 Tabs no dado de 2026-09-08 | some com o caminho 1 (A5) |
| **1150** | D | O §15.1 do `N4-ENCERRAMENTO.md` propunha *"o editor serializa os compassos para a `tablature`, ou o salvar grava os dois"*: as duas formas, com o editor ainda abrindo o exemplo, **apagam a tab real no primeiro salvar** | condição do caminho 1 (A5); errata de ponteiro (§0) |
| **1151** | D | As fixtures do gate do `PUT` do editor (`tests/gates/i1-editor-put.test.tsx:88`) e do exemplo do G-faixa (`scripts/gates-web/g-faixa-editor-exemplos.ts:23`) levam o **título e o compositor de uma obra real** como metadado da Tab. A regra do `CLAUDE.md` alcança o corpo, não o título; a regra deste pre-check (*"nenhum título ou artista real"*) alcança o caso que a D-0 vai regravar | pergunta Q8 |

**Contagem**: 7 — P 0 · D 3 · A 4. A próxima livre é a **1152**.

**Extras, declarados antes do commit**: (1) a execução local dos dois leitores sobre seis formas fabricadas (função pura,
0 requisições), com o instrumento em `D0-PRECHECK-anexos/instrumentos/leitores-tab.ts` — fora de CI, lint e typecheck
(N4-D117) — e a saída em `leitores-tab.txt`; (2) a nota depois da tabela do §10.4 do `N4-ENCERRAMENTO.md`, além da errata
no fim do §15 (o prompt pede a errata de ponteiro; a D0-D2 pede a dependência *"escrita ao lado"* do item do D).

---

## 5. Perguntas para o aval

**Q1 — qual caminho?**
→ **Respondida: D0-D6** (§7).
(a) **1a — o texto inteiro num painel** (abre e grava a `tablature`; o exemplo sai). (b) 1b — os compassos sem exemplo
(abre a `tablature` como linhas; grava o texto juntado). (c) 2 — os leitores leem `measures`. (d) 3 — o 1 com a
recuperação das Tabs do zero no abrir.
**Recomendo (a)**: não converte nada, não perde nada, é o que a folha desenhou (div. 776), não toca no tablet nem no
contrato. A (d) entra **só se** o M1 achar Tab com `tablature` vazia e `measures` ≠ exemplo. A forma visual do painel
(o campo de texto no lugar dos seis campos) é mudança da tela da folha 6: o G-faixa remede `EDIT-tab`.

**Q2 — o compasso de exemplo?**
→ **Respondida: D0-D7** (§7).
(a) **sai**: a Tab sem `tablature` abre o campo vazio, com o vazio honesto da folha. (b) vira só um texto de dica, nunca
gravado (exige frase isenta no G-tok). (c) fica.
**Recomendo (a)**: nenhum dado de exemplo volta a ser gravado.

**Q3 — as Tabs já editadas?**
→ **Respondida: D0-D8** (§7).
(a) **ficam como estão**: a `tablature` nunca foi tocada; o `measures` vira chave morta, e a limpeza vai com a poluição
do `content_data` no resto do D (`I1-ENCERRAMENTO.md` §10.1 item 1). O conserto **não apaga** o `measures` ao salvar. (b)
recuperação no editor (o caminho 3). (c) migração na D-0.
**Recomendo (a)** se o M1 der **0** linhas na classe 3; se der alguma, a decisão é por linha, do Marcel (a dele) — a
recuperação (b) só para as do zero.

**Q4 — o fatiamento?**
→ **Respondida: D0-D9** (§7).
(a) **uma PR**, gate primeiro: commit 1, o gate da D-0 entrando reprovado (o editor abre com a `tablature`; o que ele
grava, os dois leitores mostram; mudar só o título não troca o corpo); commit 2, o conserto, com o par declarado do caso
da Tab no gate do `PUT`; commit 3, o G-faixa `EDIT-tab` remedido; commit de docs. (b) duas PRs, no molde da N4-PR1/PR2
(gates; conserto).
**Recomendo (a)**: o conserto toca 3–4 arquivos do site, e o molde do N4 em duas PRs se pagou porque o leitor era
compartilhado com o tablet — aqui não é.

**Q5 — quem mede o aceite?**
→ **Respondida: D0-D10** (§7).
Site: **o executor** (regra 28; I1-D37 — o perfil persistente do Marcel em `localhost:3000`, sem `POST` real), e a prova
em prod (M2) com a Tab descartável da conta de audit, que o Marcel cria. Tablet: o caminho 1 não muda o tablet; a prova é
o sync trazer a `tablature` nova e o palco mostrá-la. (a) **no AVD tab, com a conta de audit** (o Tab S6 está na conta
principal, e a regra 12 não deixa escrita de aceite em música que o músico usa); (b) sem prova no tablet — o G-par e o
core intocado bastam.
**Recomendo (a)**, com o avião levantado e restaurado pela regra 11, contando o sync de abertura.

**Q6 — o release do tablet precisa ser refeito no fim?**
→ **Respondida: D0-D10** (§7).
Com o caminho 1 (ou 3): **não** — o app e o core não mudam; o release de repouso (`cf58f7f`) já lê a `tablature`. Com o
caminho 2: **sim**, pela receita do release, e o caminho e o sha256 trocados no `APARATO.md`.

**Q7 — o título em *Informações* (div. 1147)?**
→ **Respondida: D0-D11** (§7).
(a) a D-0 conserta só no editor de tab (que ela reescreve de qualquer jeito). (b) **resto do D**, para os dois editores,
junto dos *"campos que não se salvam"* (`I1-ENCERRAMENTO.md` §10.1 item 2).
**Recomendo (b)**: é outro defeito, nos dois editores; a D0-D1 diz *"só da Tab"*. O M0 o mede para o registro.

**Q8 — as duas pontas soltas do par e das fixtures?**
→ **Respondida: D0-D12 e D0-D14** (§7).
(i) A Tab vazia (div. 1148): (a) **resto do D**, como pergunta do contrato de leitura (mexe no core e no release); (b)
na D-0. **Recomendo (a)**. (ii) O título real nas fixtures (div. 1151): (a) **o caso da Tab que a D-0 regrava passa a
título e artista fabricados**, no mesmo par declarado; as outras fixtures ficam; (b) nada muda. **Recomendo (a)**.

**Q9 — a árvore `../octavia-d0` e a branch local `d0/precheck` (div. 1145)?**
→ **Respondida: D0-D15** (§7).
O rascunho de lá parte da D-0 antiga. (a) **o Marcel descarta** a árvore e a branch local (`git worktree remove
../octavia-d0` com o descarte do rascunho; `git branch -D d0/precheck`) — passo dele, porque é trabalho de outra sessão;
(b) ficam. **Recomendo (a)**, antes da PR de implementação: se a outra sessão empurrar a branch local dela, ela colide
com o remoto `d0/precheck` desta PR.

---

## 6. O orçamento da Fase B — para o aval, nada rodado

| # | mede | contra | requisições | conta | lê/escreve | desfaz |
|---|---|---|---|---|---|---|
| **M0** | o A2 e a div. 1147, por medição: o editor montado (como o gate do `PUT`) com uma Tab fabricada, em quatro roteiros — título em *Detalhes*; título em *Informações*; uma corda; abrir sem mudar (o *Salvar* inativo). Grava, de cada corpo: as chaves, `measures` igual ao exemplo (sim/não), o `title` do topo × `content_data.title` | a `main` `69fd3c2`, local | **0** | nenhuma | nada | nada; instrumento no anexo, fora de CI |
| **M1** | **o dado real**: quantas Tabs têm `measures`, em que classe do A2, e se a `tablature` mudou | prod | **1 leitura** (opção a) | todas, agregado; a principal por linha | lê | nada |
| **M2** | **a prova do conserto em prod**, depois do merge: a Tab descartável editada no site; o site mostra a edição; o tablet (AVD, conta de audit) sincroniza e o palco mostra — só comprimento e `sha256[:12]` dos dois lados | prod | ≈ 1 `POST` (o Marcel cria), 1–2 `PUT`, os `GET` das páginas, **2 `GET`** do sync de abertura, 1 `DELETE` | **audit** | escreve (na descartável) | o Marcel apaga a Tab no fim (regra 12) |

**M1 — as opções** (só chaves, comprimentos e `sha256[:12]`; nenhum texto):

- **(a) uma consulta no console do Supabase, rodada pelo Marcel** (o molde do anexo D5 do B7) — **recomendada**: uma
  leitura, zero escrita, sem aparelho, e responde por **todas** as contas (a de audit inclusive), com a data:

  ```sql
  -- D-0, M1: só leitura; nenhum texto sai
  select left(id::text, 8) as id8,
         user_id = '<uid da conta principal>' as principal,
         case when jsonb_typeof(content_data) = 'object'
              then (select string_agg(k, ',' order by k) from jsonb_object_keys(content_data) k) end as chaves,
         jsonb_typeof(content_data -> 'tablature') as tipo_tab,
         length(content_data ->> 'tablature') as len_tab,
         left(encode(sha256(convert_to(coalesce(content_data ->> 'tablature', ''), 'UTF8')), 'hex'), 12) as sha12_tab,
         case when jsonb_typeof(content_data -> 'measures') = 'array'
              then jsonb_array_length(content_data -> 'measures') end as n_compassos,
         content_data -> 'measures' = '[{"id":1,"strings":["E|--0--3--0--2--0--|","B|--1--1--1--1--1--|","G|--0--0--0--0--0--|","D|--2--2--2--2--2--|","A|--3-------------|","E|----------------|"]}]'::jsonb
           as measures_eh_exemplo,
         updated_at
  from content
  where content_type = 'Tab'
  order by updated_at desc;
  ```

  As cordas da consulta são o exemplo do próprio editor (`tab-editor.tsx:21`), obra do projeto. A saída entra no anexo
  como veio, com o `uid` trocado por `<uid>`.
- **(b) o roteiro à mão no site** (2 linhas): *abrir `/content/<id>/edit` de cada uma das 2 Tabs e anotar se o bloco
  Tablatura mostra **um** compasso que começa com `E|--0--3--0--2--0--|`; sair sem clicar em Salvar.* Zero escrita; 2
  leituras por Tab. Distingue "classe 1 ou 2" de "classe 3", mas não dá comprimento, `sha12` nem data, e só cobre a conta
  principal.
- **(c) o dev client no Tab com a receita do cache** (N4-D102): `install -r` do dev client, o Metro com o `.env`, um sync
  (**2 `GET`**), a leitura do cache e a volta md5 a md5, e o `install -r` do release. **A mais cara**, e lê só a cópia do
  último sync da conta principal.

**O que o M1 já sabe**: em 2026-10-01 as duas Tabs da conta principal eram `[tablature=string]` (A3). O M1 só precisa dizer
se alguma Tab mudou desde então — e, pela (a), se há Tab da classe 3 em **outra** conta.

**A ordem proposta**: M1 **antes** da implementação (decide a Q3 e se o caminho 3 entra); M0 no commit 1 da PR (vira o
gate); M2 depois do merge.

---

## 7. O aval — D0-D6…D15 `[Marcel, 2026-10-08]`

| # | decisão (pergunta) | o que muda |
|---|---|---|
| **D0-D6** | (Q1) O caminho é o **1a**: o editor de Tab passa a mostrar e a editar o texto da tablatura, e o que se salva chega a todos os leitores. **O editor de compassos deixa de existir.** O caminho 3 (a recuperação) só entra se o M1 achar Tab criada do zero com edição presa em `measures`. | §8 (o painel); §10 |
| **D0-D7** | (Q2) O compasso de exemplo sai. | — |
| **D0-D8** | (Q3) As Tabs já editadas ficam como estão; o `measures` gravado **não se apaga** na D-0 e vai com a limpeza do `content_data` no resto do D. | §8.2 |
| **D0-D9** | (Q4) **Uma PR**, com o gate entrando reprovado no commit 1. | — |
| **D0-D10** | (Q5, Q6) O aceite do site é medido pelo executor; o tablet se confere no **AVD com a conta de audit**; o release do tablet **não se refaz** no caminho 1a. | — |
| **D0-D11** | (Q7) O título digitado em *Informações* que não chega à coluna (div. 1147) vai ao resto do D, como **segundo da fila**. | §8.1 (o 1a não remove *Informações*) |
| **D0-D12** | (Q8) A Tab criada do zero com `tablature: ""` (div. 1148) vai ao D. A Tab regravada no gate passa a ter título fabricado. | — |
| **D0-D13** | A div. 1149 se mede no M0; **se confirmar, o conserto entra na D-0**. | §9.1: **confirmou** |
| **D0-D14** | A div. 1151 se conserta na D-0: título e compositor fabricados nas fixtures do gate do `PUT` e do G-faixa, em par onde o gate exigir; listar todo lugar em que o `grep` acha nome real em fixture. | §9.3 |
| **D0-D15** | (Q9) A árvore `../octavia-d0` é descartada, com `git worktree remove`; se o Git recusar por mudança não commitada, parar e perguntar antes de forçar. | §9.4: **o Git recusou** — parado e perguntado; **removida pela D0-D16** (§12.1) |

---

## 8. O painel do 1a e as três classes de dado

### 8.1 O painel — reaproveita o editor de Letra?

**A composição, sim; a tipografia, não** `[lido]`.

- **O que serve do editor de Letra** (`components/lyrics-editor.tsx:26-37`): o `Bloco` com título
  (`components/editors/campos.tsx:15`), o `Campo` com rótulo e o `<textarea>` com `ENTRADA_ALTA` (`campos.tsx:41` —
  contorno, `radius.control`, `resize-y`) e `min-h-campo-letra` (`5 × touch.min`, `tailwind.config.ts:29`). O estado de
  um campo só e o `onChange` de uma chave (`:18-23`) são o molde do 1a — trocando `lyrics` por `tablature`.
- **O que não serve**: a letra é `text.body` no `ENTRADA_ALTA` com `font-fam-mono`, **e quebra linha** (o `textarea`
  quebra por padrão). A tab precisa do que o compasso de hoje já tem (`components/editors/partes-da-tab.tsx:30`, `:42`):
  mono no **`zoom.padrao` (22)**, **`lineHeight.tab` (1,45)** (`app/styles/identidade.css:56`, `:60`) e **rolagem
  horizontal sem quebra** (`data-rolagem="painel"`; num `textarea`, `wrap="off"` e `white-space: pre`) — *"a quebra de
  linha na letra, nunca na tab"* (N4-D13; `N4-ENCERRAMENTO.md` §10.2 item 1).
- **O que a folha desenha para a Tab hoje** (`docs/ux/DESIGN-I1/6-content-editor/telas.html`, estado `EDIT-tab`; sha256
  em `DESIGN-I1/SHA256SUMS:7`): *Informações* (título, artista, afinação, capo, BPM) · **Tablatura** — um compasso por
  painel (contorno `line`, mono 22, `lineHeight.tab`, rola na horizontal), com *Adicionar compasso* no bloco e
  *Duplicar*/*Remover* no compasso (`README-design.md:247`, `:488`) · *Prévia* (afinação · capo · BPM). A folha desenha
  **o compasso 1 com a tablatura do content**, como painel de leitura (div. 776).
- **A errata que o 1a exige**: a folha não se reescreve (tem sha registrado; `CLAUDE.md`). Entra uma errata no
  `docs/ux/DESIGN-I1/erratas.json`, como as do I1: **de faixa** (`erratasFaixa`) para os nós que deixam de existir — os
  compassos, as cordas como campos, *Adicionar compasso*, *Duplicar* e *Remover* —, com o bloco *Tablatura* valendo
  como **um** painel de texto editável; e **de frase** (`erratasFrase`) para `edit.tab.adicionar-compasso`,
  `edit.tab.compasso`, `edit.tab.corda`, `edit.tab.duplicar-compasso` e `edit.tab.remover-compasso`, que saem das
  `frases-editor.ts` (texto sem leitor é poda, regra 31). O `EDIT-tab` se **remede** no G-faixa nas três larguras.
- **Precisa de desenho?** Pela leitura, **não**: o painel é a composição do `Bloco`/`Campo` que a folha já usa na Letra,
  com os tokens que a folha já usa no compasso da Tab, e o resultado é o *"painel de leitura com a tablatura do content"*
  que a própria folha desenhou. **Fica como pergunta (Q10, §10)**: o Marcel aceita o painel pela errata, ou quer a folha
  do `EDIT-tab` redesenhada antes da PR?
- **D0-D11 — o 1a remove *Informações*?** **Não.** O 1a troca só o bloco *Tablatura*; *Informações* (`tab-editor.tsx:86`)
  fica, e com ela o defeito da div. 1147 **na Tab também** — o M0 o mede na Tab (§9.1, R2). Ele segue para o resto do D
  como segundo da fila, para os dois editores. (Tirar *Informações* da Tab tiraria o único lugar onde se edita afinação e
  capo — que, de todo modo, não chegam às colunas, `N4-ENCERRAMENTO.md` §10.4 item 5: é decisão do D, não da D-0.)

### 8.2 O que o 1a faz com as três classes (e com a Tab de upload)

| classe (A2) | ao abrir, o músico vê | ao salvar, grava |
|---|---|---|
| **1 — sem `measures`** (lote; do zero; nunca editada) | o texto da `tablature` no painel (vazio se `""`) | a `tablature` editada; nenhum `measures` |
| **2 — `measures` igual ao exemplo** | o texto da `tablature` — **a tab real** (hoje ele vê o exemplo) | a `tablature` editada; o `measures` fica como estava (D0-D8) |
| **3 — `measures` diferente do exemplo** | o texto da `tablature` — a tab real; **a edição presa no `measures` continua invisível** | a `tablature` editada; o `measures` fica (D0-D8). Se a `tablature` era `""` (do zero), o painel abre vazio: é o caso do caminho 3, que o M1 decide |
| **Tab de upload** (`content_data: null`) | o painel vazio | a `tablature` — **só se o conserto da D0-D13 garantir a chave em todo salvar da Tab** (§9.1): uma mudança só em *Detalhes* não passa pelo editor de tab, e hoje o corpo vai `{ annotations: [] }` |

Nenhuma classe perde texto que algum leitor mostre hoje: a `tablature` só muda quando o músico a edita no painel.

---

## 9. A Fase B

### 9.1 M0 — o editor medido, local `[medido: D0-PRECHECK-anexos/m0-editor.txt]`

Instrumento: `D0-PRECHECK-anexos/instrumentos/m0-editor.medir.tsx`, com config própria (`m0.vitest.config.mts`) e **sem
sufixo `.test`** — o projeto `web` coleta `**/*.test.tsx` em qualquer pasta, `docs/` inclusive (div. 1154). Monta a rota
do editor como o gate do `PUT`, com dado fabricado; o corpo do `PUT` vai à **rota real** (`app/api/content/route.ts`,
`PUT`), com a autenticação e o banco simulados. **Zero requisições.** Seis roteiros, cada um com `difficulty: null` e com
`'Beginner'`: **12 corridas, 10 salvamentos** (os dois *"abrir sem mudar"* têm o *Salvar* inativo).

| roteiro | `difficulty: null` | `difficulty: 'Beginner'` |
|---|---|---|
| R1 título em *Detalhes* (Tab de lote) | **400** `difficulty` | **200** · `content_data` = `annotations,tablature` (2 chaves); sem `measures`; a coluna recebe o título |
| R2 título em *Informações* | **400** `difficulty` | **200** · 25 chaves; **`measures` IGUAL ao exemplo**; a coluna `title` **fica a velha**, `content_data.title` = o novo (**div. 1147 confirmada**) |
| R3 uma corda | **400** `difficulty` | **200** · 25 chaves; `measures` diferente do exemplo; **`tablature` igual à da linha** (A1 confirmado) |
| R4 abrir sem mudar | *Salvar* inativo | *Salvar* inativo |
| R5 Tab de upload, título em *Detalhes* | **400** `difficulty` | **400** `content_data.tablature` *"obrigatória para Tab"* · corpo `{ annotations: [] }` |
| R6 Tab de upload, uma corda | **400** `difficulty` | **400** `content_data.tablature` *"obrigatória para Tab"* · 24 chaves, sem `tablature` |

**Em números**: 10 salvamentos — **3 × 200**, **7 × 400** (5 por `difficulty`, 2 por `content_data.tablature`). Nos 7, a
tela mostra a linha *"não foi possível salvar — o servidor recusou os dados"* com *"o que você escreveu continua aqui"*.

**O veredito da div. 1149: confirmada** — com a dificuldade preenchida, salvar uma Tab de upload dá **400
`VALIDATION_ERROR`**, `details: [{ field: "content_data.tablature", message: "obrigatória para Tab", code: "custom" }]`,
pelo caminho de *Detalhes* e pelo do editor de tab. **Pela D0-D13, o conserto entra na D-0.**

**E um achado maior — div. 1152**: **com `difficulty: null`, os 5 salvamentos deram 400**, de qualquer roteiro — o editor
normaliza `null` em `""` (`components/content-editor.tsx:42`) e o manda no corpo (`:59`); o esquema da rota é
`z.enum([...]).nullish()` (`lib/api-schemas.ts:150`), que aceita `null` e recusa `""`. **Não depende do tipo**: todo
content sem dificuldade cai nisso, no editor do site. Não estava registrado (`git grep` em `docs` e `.audit`: nada). O
gate do `PUT` do editor não o via porque o `fetch` dele é falso e devolve 200 a qualquer corpo
(`tests/gates/i1-editor-put.test.tsx:117-122`), e o aceite do I1 roda sem `POST` real (I1-D37). **Quantos contents estão
nesse caso é o que a consulta (2) do M1 conta** (`dificuldade_nula`, e `salvas_pelo_editor` — a chave `annotations` só o
editor grava).

### 9.2 M1 — o dado real: a consulta, provada localmente, e a saída do Marcel

A consulta (`D0-PRECHECK-anexos/instrumentos/m1-consulta.sql`), **só de leitura**, para colar no SQL Editor do
Supabase — trocar `<UID_PRINCIPAL>` pelo uid da conta principal (a saída só mostra `true`/`false`):

```sql
-- D-0 pre-check, M1 — SÓ LEITURA. Nenhum texto sai: nem título, nem artista, nem corpo.

-- (1) por Tab
select left(c.id::text, 8)                                        as id8,
       c.user_id = '<UID_PRINCIPAL>'                              as principal,
       case when jsonb_typeof(c.content_data) = 'object'
            then (select string_agg(k, ',' order by k) from jsonb_object_keys(c.content_data) as k)
            else coalesce(jsonb_typeof(c.content_data), 'null') end as chaves,
       jsonb_typeof(c.content_data -> 'tablature')                as tipo_tablature,
       case when jsonb_typeof(c.content_data -> 'tablature') = 'string'
            then length(c.content_data ->> 'tablature') end       as len_tablature,
       c.content_data ? 'measures'                                as tem_measures,
       c.content_data -> 'measures' = '[{"id":1,"strings":["E|--0--3--0--2--0--|","B|--1--1--1--1--1--|","G|--0--0--0--0--0--|","D|--2--2--2--2--2--|","A|--3-------------|","E|----------------|"]}]'::jsonb
                                                                  as measures_eh_exemplo,
       c.file_url is not null                                     as tem_arquivo,
       c.difficulty is null                                       as dificuldade_nula,
       c.updated_at
from content c
where c.content_type = 'Tab'
order by c.updated_at desc;

-- (2) por tipo, contagens (a div. 1152; `annotations` só o editor grava)
select c.content_type,
       count(*)                                                   as total,
       count(*) filter (where c.difficulty is null)               as dificuldade_nula,
       count(*) filter (where c.content_data ? 'annotations')     as salvas_pelo_editor,
       max(c.updated_at) filter (where c.content_data ? 'annotations') as ultima_salva_pelo_editor
from content c
group by c.content_type
order by c.content_type;
```

**Provada antes de entregar** `[medido: D0-PRECHECK-anexos/m1-prova-local.txt]`: num Postgres 17.11 local descartável
(`initdb` no scratchpad, socket local, sem rede; apagado no fim), com a fixture fabricada `m1-fixture-local.sql` (a tabela
do `supabase/schema.dump.sql`; seis Tabs — lote, as classes 2 e 3, do zero, upload, `tablature` em lista — mais uma Letra
e uma Cifra, todos os textos `MARCADOR-*`). As duas consultas fecham (`exit 0`) e classificam as seis formas certo;
**`grep -c MARCADOR` na saída dá 0**, e o controle positivo (`select title`) dá 1.

**A saída do Marcel** (2026-10-08; inteira em `D0-PRECHECK-anexos/m1-saida-marcel.txt`), em contagens:

- **Consulta 1 — 15 Tabs, em todas as contas: nenhuma tem `measures`** (`tem_measures` = `false` ou nulo nas 15). Dez são
  `[tablature]` string — oito de comprimento 353 (2026-08-08, um só minuto) e duas de comprimento 7 (2025-07-07) —, e
  **cinco têm `content_data` nulo, sem arquivo**, todas com o mesmo `updated_at` (2025-06-02 14:46:09.465166, até o
  microssegundo). Dificuldade nula: 5 das 15.
- **Consulta 2 — por tipo**: Letra 148 (dificuldade nula 129; salvas pelo editor 15, a última em 2026-09-21); Cifra 26
  (20; 4, a última em 2026-10-01); Partitura 7 (4; 1, em 2025-07-07); Tab 15 (5; **0**). **Dificuldade nula: 158 de 196
  (81 %).**
- **Consulta 3 — o cruzamento** (§9.6).

**A identificação das contas: não conferida nesta medição.** A coluna `principal` saiu `true` justamente nas cinco Tabs
de `content_data` nulo, com a mesma data até o microssegundo — o desenho de uma carga inicial de uma terceira conta. A
conta principal, pelo que o N4 mediu (as B1 e B2 do pre-check do N4, `N4-PRECHECK-anexos/b1-b4-biblioteca-principal.txt`,
e o aceite da N4-PR2), tem **2 Tabs com tablatura e nenhum item inválido** — batem com as duas linhas de `len_tablature =
7`, que saíram `false`. O mais provável é o uid colado no lugar de `<UID_PRINCIPAL>` não ser o da principal. **Nenhuma
conclusão deste documento depende das contas** (o caminho 3 sai porque nenhuma Tab, em conta nenhuma, tem `measures`; a
1152 e o cruzamento são contagens globais) — por isso não se pediu a consulta por `user_id`. **As 5 Tabs com
`content_data` nulo e sem arquivo, numa conta a identificar**, vão ao Bloco D como achado (div. 1155).

### 9.3 D0-D14 — os nomes reais em fixture `[medido: D0-PRECHECK-anexos/fixtures-nomes-reais.txt]`

O `grep` dos 20 autores reais achados entre os 39 valores distintos de `artist:` fora de `docs/` dá **419 linhas em 29
arquivos**, e mais **158 linhas nas 5 folhas** do `DESIGN-I1` (4, 5, 6, 7 e 8). O anexo traz arquivo:linha, sem o texto.

| grupo | arquivos | linhas | o que a D-0 faz (D0-D14) |
|---|---|---|---|
| **o gate do `PUT` do editor** | `tests/gates/i1-editor-put.test.tsx`; `tests/gates/fixtures/editor-put-antes.json` | 1 + 1 | **troca**, no par declarado do caso da Tab (o mesmo que o 1a já regrava) |
| **o G-faixa do editor** | `scripts/gates-web/g-faixa-editor-exemplos.ts`; `tests/gates-web/medicoes/content-edit.json`; `tests/gates-web/esperado/6-content-editor.json` | 1 + 10 + 4 | **troca** no exemplo e na medição (remedida com o 1a). O esperado sai da folha 6, que tem o nome e não se reescreve: os nós que pareiam por `testid` (`campo-info-titulo`, `campo-artista`) seguem pareando; os que pareiam pelo texto, no `EDIT-tab`, vão na mesma errata de faixa do §8.1 — **o par que o gate exige é a errata, não a folha** |
| os outros G-faixa (lista, visualização, upload, setlists) | `g-faixa-conteudo.ts`, `-lista.ts`, `-setlists.ts`, `-upload.ts`; `medicoes/*.json`; `esperado/4,5,7,8-*.json` | 11 + 184 + 156 | **fora da D-0**: cada um pareia com a sua folha (sha registrado) — trocar exige errata em cada superfície. Pergunta Q11 |
| os outros gates do I1 | `i1-upload-post.test.tsx`, `fixtures/upload-post-antes.json`, `i1-tab-acordes.test.tsx` | 5 | fora da D-0 (Q11) |
| testes de unidade e mocks | `servidor-falso.ts`, `use-setlist-data.test.tsx`, `useMetadataForm.test.ts`, `contract-content.test.ts`, `supabase-mock-factory.ts`, `search.test.ts`, `song.test.ts` | 16 | fora da D-0 (Q11) |
| a semente da audit (prod) | `scripts/ux-audit/seed.ts`; `tests/ux-audit/harvest-populated.spec.ts` | 30 | fora da D-0: a semente **gravou** esses títulos na conta de audit em prod (Q11) |

### 9.4 D0-D15 — a árvore `../octavia-d0` `[medido]`

```
$ git status                       (em ../octavia-d0)
On branch d0/precheck
Your branch is up to date with 'origin/main'.
Changes not staged for commit:
	modified:   docs/ux/PLANO-TRANSICAO.md
Untracked files:
	docs/ux/D0-PRECHECK.md
$ git diff --stat
 docs/ux/PLANO-TRANSICAO.md | 5 +++++
 1 file changed, 5 insertions(+)
$ git worktree remove ../octavia-d0
fatal: '../octavia-d0' contains modified or untracked files, use --force to delete it      [exit 128]
```

**O Git recusou. Parado, pela D0-D15** — *e feito depois, pela D0-D16 (§12.1)*: a remoção forçada (`git worktree remove --force ../octavia-d0`, e depois `git
branch -D d0/precheck`, a branch local sem commit próprio) apaga o rascunho de 240 linhas e a nota de 5 linhas de outra
sessão. **Pergunta ao Marcel.**

### 9.5 Os outros campos — o mesmo defeito da dificuldade? `[medido: D0-PRECHECK-anexos/campos-nulos.txt]`

Cada campo do corpo do `PUT` do editor, com o valor que o editor manda quando a coluna da linha é `null`
(`components/content-editor.tsx:33-48`, `:51-73`), passado sozinho pelo esquema real (`contentSchemas.update`,
`lib/api-schemas.ts`); instrumento `instrumentos/campos-nulos.ts`, função pura, 0 requisições.

| campo | manda (coluna `null`) | o esquema | veredito |
|---|---|---|---|
| `difficulty` | `""` | `z.enum([...]).nullish()` (`:150`) | **RECUSADO — o defeito (div. 1152); entra na D-0 (D0-D19)**. `null` é aceito: o conserto no editor basta |
| `artist`, `album`, `genre`, `notes` | `""` | `createSafeText(0, n)` — `z.string().trim().min(0)` (`:66-74`) | aceito — **conferido** |
| `key` | `""` | `z.string().max(10)` | aceito — **conferido** |
| `bpm` | `null` (`:58`, `bpm ? parseInt : null`) | `z.number()…nullish()` | aceito — **conferido** |
| `tags` | `[]` | `z.array(…).max(20).nullish()` | aceito — **conferido** |
| `is_favorite`, `is_public` | `false` | `z.boolean().nullish()` | aceito — **conferido** |
| `title` | `""` | `createSafeText(1, 255)` | recusaria — **inalcançável a partir de `null`**: a coluna é `NOT NULL` (`supabase/schema.dump.sql`); `""` só se o músico apagar o título, e aí o 400 é validação legítima |
| `content_data` | `{ annotations: [] }` | `z.record(…)` — aceito | o esquema aceita; **o contrato, com o tipo da linha, recusa** quando falta a chave do tipo: é a div. 1149, e o mesmo desenho alcança a Cifra (div. 1156) |

**Só a dificuldade.** `time_signature`, `capo` e `tuning` não vão no corpo (o *"campos que não se salvam"*,
`I1-ENCERRAMENTO.md` §10.1 item 2).

### 9.6 Desde quando — a data da div. 1152, e o cruzamento `[medido: git log -S; m1-saida-marcel.txt]`

| a linha | nasceu | commit |
|---|---|---|
| o editor transforma `null` em `""` (`difficulty: content.difficulty \|\| ""`) e o manda no corpo (`difficulty: editedContent.difficulty`) | **2025-05-31 / 2025-06-02** — a importação do projeto | `cce69b5`, `050963d` |
| o salvar do editor passa pela rota `PUT /api/content` (não mais direto no Supabase) | **2025-07-01 / 2025-07-06** | `776af7e` (*"implement PUT and DELETE endpoints"*), `e6d6b9e` (*"remove browser supabase usage"*) |
| **a rota recusa `""`**: o `PUT` passa a validar com o `updateContentSchema` (`difficulty: z.enum([...]).optional().nullable()`, `lib/validation-schemas.ts`), por `schema.parse(body)`, sem limpar nada antes (`lib/validation-utils.ts`, `validateRequestBody`) | **2025-07-08** | `f0947c3` (*"enhance API request validation"*) |
| o enum muda de módulo (`lib/api-schemas.ts`), com a mesma regra | 2026-08-25 | `fc99e60` (B2 PR-4b) |

**A div. 1152 nasceu em 2025-07-08** (`f0947c3`), **15 meses antes do I1**. A reescrita do editor (I1-PR-11, `c44c975`)
não a criou: herdou o corpo de antes, **por decisão** (I1-D9, *"o que o editor grava não muda"*) — e o travou.

**A lição de instrumento, com todas as letras**: **o gate do `PUT` do editor do I1 (`f5260ec`, 2026-09-29) gravou byte a
byte, em 4 dos 5 casos (as duas Cifras, a Letra, a Partitura), um corpo com `difficulty: ""` que o servidor recusava
desde 2025-07-08** (`tests/gates/fixtures/editor-put-antes.json`). O `fetch` falso do gate devolve 200 a qualquer corpo
(`tests/gates/i1-editor-put.test.tsx:117-122`); o aceite do I1 roda sem `POST` real (I1-D37). **O gate provou que o editor
manda o mesmo corpo que mandava antes — e esse corpo nunca chegava ao banco.** "Não mudou" não é "funciona" quando o lado
que diz se funciona está simulado. Pela D0-D19, o primeiro commit da implementação conserta o instrumento (o gate valida o
corpo pelo esquema real da rota, como o M0 fez) — div. 1157.

**O cruzamento** (a consulta 3, `instrumentos/m1-consulta-3.sql`, provada no Postgres local — `m1-prova-local-3.txt`):
**21 contents têm `annotations`** (a chave que só o editor do site grava): Cifra 4, Letra 16, Partitura 1, Tab 0. **20 dos
21 têm a dificuldade preenchida** — o que a 1152 prevê. **Um** tem a dificuldade nula: uma **Cifra, `updated_at`
2026-08-09 14:48:06 UTC**. **Não é um salvar do editor**: é a **sonda da Fase D do ux-audit** (o dia da execução ao vivo
contra prod, `1c87aa9`), item 32 — às 14:46 UTC o instrumento, sem achar o canvas de anotação no editor da Cifra, gravou
a anotação **direto na API**, com o corpo `{ id, content_data }`, **sem dificuldade**, e mediu `probe_put_annotation_status:
200` (`tests/ux-audit/fase-d/g-viewer.spec.ts:140-163`; `docs/ux/fase-d/data/item-32.json`). Sem `difficulty` no corpo, a
rota não o valida — por isso passou. **Nenhuma linha mostra o editor salvando com a dificuldade nula: a data da 1152 fica
de pé.** (O rastro da sonda — uma anotação com texto do instrumento numa Cifra da conta de audit — vai com a limpeza do
`content_data` no D, div. 1159.)

De passagem: entre a consulta 2 e a 3 as Letras com `annotations` passaram de 15 a 16, com 0 de dificuldade nula — um
salvar do editor entre as duas corridas, com a dificuldade preenchida.

---

## 10. A recomendação, fechada com o M0 e o M1

- **O 1a basta. O caminho 3 não entra**: nenhuma Tab, em conta nenhuma, tem `measures` (M1, consulta 1) — não há edição
  presa a recuperar, e o `measures` nunca foi gravado em prod.
- **A div. 1149 entra** (D0-D13, confirmada no M0): a Tab vai sempre com a chave `tablature` no corpo, do lado do editor
  (`content-editor.tsx`, fora do núcleo do G-back). No dado: **5 Tabs** com `content_data` nulo e sem arquivo (consulta 3)
  são as que hoje não salvam por ela.
- **A div. 1152 entra, para todo tipo** (D0-D19): o editor manda `null` quando a dificuldade está vazia; **alcança 158 de
  196 contents (81 %)**; o esquema da rota não muda. É o único campo com o defeito (§9.5).
- **O gate do `PUT` do editor valida o corpo pelo esquema real da rota** (D0-D19) — o conserto do instrumento é o
  **commit 1** da implementação, e ele **reprova na `main`** (os 4 casos com `difficulty: ""`). Os casos que mudam de
  corpo de propósito (a dificuldade nula como `null`; a Tab como texto; o título fabricado da D0-D14) entram como **par
  declarado** (regra 14).
- **O painel** (D0-D17): a composição do editor de Letra, com a tipografia da tab; erratas de faixa e de frase no
  `erratas.json`; o `EDIT-tab` remedido no G-faixa.
- **Fica fora** (D0-D20): a 1147 (segundo da fila do D), a Tab criada do zero (1148), o `updated_at` do favoritar, a
  Cifra — **e o desenho da 1149 na Cifra** (5 Cifras com `content_data` nulo, div. 1156), que a D0-D3 deixa fora; vai ao
  D, salvo decisão em contrário do Marcel.
- **A ordem da implementação** (uma PR, D0-D9): commit 1 — os gates entrando reprovados (o do `PUT` validando pelo esquema
  real; o da D-0, *"o que o editor grava, os leitores mostram"*); commit 2 — o conserto (o painel, a `tablature` sempre,
  a dificuldade `null`, os nomes fabricados do editor), com os pares; commit 3 — o G-faixa do `EDIT-tab` remedido e as
  erratas da folha; docs. A prova em prod (M2) depois do merge, no AVD com a conta de audit (D0-D10).

---

## 11. As divergências deste commit — 1152 a 1159

| div. | origem | o quê | destino |
|---|---|---|---|
| **1152** | A | **Todo salvar no editor de um content com `difficulty: null` dá 400** (`difficulty`, *"Invalid enum value … received ''"*): o editor normaliza `null → ""` (`content-editor.tsx:42`, `:59`) e o esquema aceita `null`, não `""` (`lib/api-schemas.ts:150`). Qualquer tipo. O gate do `PUT` não o via (o `fetch` falso devolve 200) `[medido: m0-editor.txt, 5 de 5]` | Q12; a consulta (2) do M1 mede o alcance |
| **1153** | D | **A div. 1151 era maior**: nome real de autor em **29 arquivos, 419 linhas** fora de `docs/`, e em **5 folhas** do `DESIGN-I1` (158 linhas; sha registrado). A fixture do G-faixa do editor pareia com a folha 6 — trocar o nome exige errata, não reescrita | §9.3; Q11 |
| **1154** | T | **O `include` do projeto `web` do vitest (`**/*.{test,spec}.?(c\|m)[jt]s?(x)`, `vitest.config.mts:7`, `:43`) coleta teste em qualquer pasta, `docs/` inclusive**: a N4-D117 (*"instrumento sob `docs/` fica fora de CI"*) só vale para instrumento sem sufixo `.test`/`.spec`. Hoje nenhum arquivo de `docs/` casa (`git ls-files docs \| grep -E '\.(test\|spec)\.'` → exit 1) | o M0 usa `.medir.tsx` e config própria; registrada para o `LOGS-OCTAVIA.md` no encerramento do bloco |
| **1155** | A | **5 Tabs com `content_data` nulo e sem arquivo**, numa conta a identificar, todas com o mesmo `updated_at` (2025-06-02 14:46:09.465166) — o desenho de uma carga inicial; nenhum leitor as mostra (`no-body`), e o editor não as salva (a 1149) `[medido: m1-saida-marcel.txt]` | **Bloco D**, como achado (D0-D18…D20); a 1149 consertada na D-0 as deixa salváveis |
| **1156** | A | **O desenho da 1149 alcança a Cifra**: o `content_data: null` passa pelo esquema e cai no contrato com o tipo da linha — uma Cifra (ou Letra) sem `content_data` não salva no editor. No dado: **5 Cifras** com `content_data` nulo (2 sem arquivo, 3 escaneadas), 0 Letras `[medido: campos-nulos.txt; m1-saida-marcel.txt]` | **fora da D-0** pela D0-D3 (a Cifra fica fora); resto do D, salvo decisão do Marcel |
| **1157** | T | **O gate do `PUT` do editor do I1 travou, byte a byte, 4 corpos que o servidor recusava** (`difficulty: ""`, recusado desde 2025-07-08): o `fetch` falso devolve 200 a qualquer corpo. Escondeu a 1152 e a 1149 | **defeito de instrumento** (D0-D19): o conserto é o **commit 1** da implementação — o gate valida pelo esquema real da rota; candidata a regra no `LOGS-OCTAVIA.md` no encerramento |
| **1158** | T | **A coluna `principal` da consulta 1 dependia de o Marcel colar o uid certo** no lugar de `<UID_PRINCIPAL>`; saiu `true` em 5 linhas que o N4 não reconhece na principal | identificação **não conferida**; nenhuma conclusão depende dela (§9.2). Instrumento que pede substituição à mão devolve o que foi colado — da próxima vez, devolver o `user_id` truncado e conferir contra o N4 |
| **1159** | A | **A sonda da Fase D (2026-08-09, item 32) gravou em prod** uma anotação com texto do instrumento numa Cifra da conta de audit, direto na API — é a única linha com `annotations` e dificuldade nula, e não é um salvar do editor | rastro de audit em prod: vai com a limpeza do `content_data` no D (D0-D8) |

**Contagem** (1152–1159): 8 — P 0 · D 1 · A 4 · T 3. **Na PR, 1145–1159: 15** — P 0 · D 4 · A 8 · T 3. A próxima livre é a **1160**.

**Extras deste commit, declarados**: o M0 roda a rota real com banco simulado (o prompt pedia o corpo, o status e a
mensagem — a rota é a única fonte deles); o segundo eixo (`difficulty` nula × preenchida), que isolou a 1149 da 1152; a
consulta (2) do M1, por tipo, além da (1) pedida; o Postgres local descartável, criado e apagado no scratchpad.

---

## 12. A segunda rodada do aval — D0-D16…D20 `[Marcel, 2026-10-08]`

| # | decisão | o que mudou neste commit |
|---|---|---|
| **D0-D16** | (Q13) **A remoção de `../octavia-d0`: forçada** — `git worktree remove --force ../octavia-d0` e `git branch -D d0/precheck` (a branch local sem commit próprio) | feita (§12.1) |
| **D0-D17** | (Q10) **Sem desenho novo**: o painel do 1a reaproveita a composição do editor de Letra, com a tipografia da tab (mono, a entrelinha de tab, rolagem horizontal sem quebra); a folha `EDIT-tab` ganha as erratas de faixa e de frase no `erratas.json` | §8.1; §10 |
| **D0-D18** | (Q11) **Os nomes reais**: na D-0 trocam-se só os das fixtures do editor; o resto (as 419 linhas em 29 arquivos e as 5 folhas com sha) vai ao **Bloco D como item nomeado**, com a lista no anexo (`fixtures-nomes-reais.txt`) | §9.3 |
| **D0-D19** | (Q12) **A div. 1152 entra na D-0, para todo tipo**: o conserto é **no editor** (o campo vazio vai `null`, não `""`; o esquema da rota não se afrouxa — se o conserto no editor não bastar, parar e perguntar); e **o gate do `PUT` do editor passa a validar o corpo pelo esquema real da rota**, como o M0 — defeito de instrumento, conserto no **primeiro commit** da implementação | §9.5 (só a dificuldade; `null` aceito — o conserto no editor basta); §9.6 (div. 1157); §10 |
| **D0-D20** | **A D-0 faz o editor do site voltar a salvar**: a Tab editável como texto (1a), a `tablature` sempre presente no corpo de uma Tab (1149), a dificuldade vazia como `null` (1152). Fora: o título em *Informações* (1147, segundo da fila do D), a Tab criada do zero, o `updated_at` do favoritar, a Cifra | o resumo no topo do documento; §10 |

### 12.1 A remoção de `../octavia-d0` `[medido]`

```
$ git worktree remove --force ../octavia-d0
[exit 0]
$ git branch -D d0/precheck
Deleted branch d0/precheck (was 69fd3c2).
$ git worktree list
/Users/marcelviana/projects/octavia                  69fd3c2 [main]
/Users/marcelviana/projects/octavia-d0-precheck      6cde4d3 [d0/precheck-fase-a]
/Users/marcelviana/projects/octavia-n4-encerramento  638dc30 [n4/encerramento]
$ git branch    (as linhas do D-0)
+ d0/precheck-fase-a
```

A branch local `d0/precheck` sumiu; o remoto `d0/precheck` é o desta PR (empurrado de `d0/precheck-fase-a`).

### 12.2 Para o Bloco D — os itens que este pre-check nomeia

| # | item | origem |
|---|---|---|
| 1 | o título digitado em *Informações* que não chega à coluna, nos editores da Tab e da Cifra — **segundo da fila do D** | div. 1147; D0-D11 |
| 2 | a Tab criada do zero (`tablature: ""`): o core diz texto de comprimento 0, o site o vazio | div. 1148; D0-D12 |
| 3 | o `measures` e a poluição do `content_data` — a limpeza (nenhum `measures` em prod hoje, M1) | D0-D8; `I1-ENCERRAMENTO.md` §10.1 item 1 |
| 4 | as 5 Tabs com `content_data` nulo e sem arquivo, numa conta a identificar | div. 1155 |
| 5 | o desenho da 1149 na Cifra (5 Cifras com `content_data` nulo) | div. 1156 |
| 6 | os nomes reais em fixture fora do editor: 29 arquivos, 419 linhas, e as 5 folhas com sha (a troca exige errata da folha, superfície por superfície) | div. 1153; D0-D18 |
| 7 | o rastro da sonda da Fase D em prod (a anotação na Cifra da audit) | div. 1159 |
| 8 | o `updated_at` do favoritar, **amarrado à N4-D91** | D0-D2 |

