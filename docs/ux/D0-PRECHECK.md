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
(a) **1a — o texto inteiro num painel** (abre e grava a `tablature`; o exemplo sai). (b) 1b — os compassos sem exemplo
(abre a `tablature` como linhas; grava o texto juntado). (c) 2 — os leitores leem `measures`. (d) 3 — o 1 com a
recuperação das Tabs do zero no abrir.
**Recomendo (a)**: não converte nada, não perde nada, é o que a folha desenhou (div. 776), não toca no tablet nem no
contrato. A (d) entra **só se** o M1 achar Tab com `tablature` vazia e `measures` ≠ exemplo. A forma visual do painel
(o campo de texto no lugar dos seis campos) é mudança da tela da folha 6: o G-faixa remede `EDIT-tab`.

**Q2 — o compasso de exemplo?**
(a) **sai**: a Tab sem `tablature` abre o campo vazio, com o vazio honesto da folha. (b) vira só um texto de dica, nunca
gravado (exige frase isenta no G-tok). (c) fica.
**Recomendo (a)**: nenhum dado de exemplo volta a ser gravado.

**Q3 — as Tabs já editadas?**
(a) **ficam como estão**: a `tablature` nunca foi tocada; o `measures` vira chave morta, e a limpeza vai com a poluição
do `content_data` no resto do D (`I1-ENCERRAMENTO.md` §10.1 item 1). O conserto **não apaga** o `measures` ao salvar. (b)
recuperação no editor (o caminho 3). (c) migração na D-0.
**Recomendo (a)** se o M1 der **0** linhas na classe 3; se der alguma, a decisão é por linha, do Marcel (a dele) — a
recuperação (b) só para as do zero.

**Q4 — o fatiamento?**
(a) **uma PR**, gate primeiro: commit 1, o gate da D-0 entrando reprovado (o editor abre com a `tablature`; o que ele
grava, os dois leitores mostram; mudar só o título não troca o corpo); commit 2, o conserto, com o par declarado do caso
da Tab no gate do `PUT`; commit 3, o G-faixa `EDIT-tab` remedido; commit de docs. (b) duas PRs, no molde da N4-PR1/PR2
(gates; conserto).
**Recomendo (a)**: o conserto toca 3–4 arquivos do site, e o molde do N4 em duas PRs se pagou porque o leitor era
compartilhado com o tablet — aqui não é.

**Q5 — quem mede o aceite?**
Site: **o executor** (regra 28; I1-D37 — o perfil persistente do Marcel em `localhost:3000`, sem `POST` real), e a prova
em prod (M2) com a Tab descartável da conta de audit, que o Marcel cria. Tablet: o caminho 1 não muda o tablet; a prova é
o sync trazer a `tablature` nova e o palco mostrá-la. (a) **no AVD tab, com a conta de audit** (o Tab S6 está na conta
principal, e a regra 12 não deixa escrita de aceite em música que o músico usa); (b) sem prova no tablet — o G-par e o
core intocado bastam.
**Recomendo (a)**, com o avião levantado e restaurado pela regra 11, contando o sync de abertura.

**Q6 — o release do tablet precisa ser refeito no fim?**
Com o caminho 1 (ou 3): **não** — o app e o core não mudam; o release de repouso (`cf58f7f`) já lê a `tablature`. Com o
caminho 2: **sim**, pela receita do release, e o caminho e o sha256 trocados no `APARATO.md`.

**Q7 — o título em *Informações* (div. 1147)?**
(a) a D-0 conserta só no editor de tab (que ela reescreve de qualquer jeito). (b) **resto do D**, para os dois editores,
junto dos *"campos que não se salvam"* (`I1-ENCERRAMENTO.md` §10.1 item 2).
**Recomendo (b)**: é outro defeito, nos dois editores; a D0-D1 diz *"só da Tab"*. O M0 o mede para o registro.

**Q8 — as duas pontas soltas do par e das fixtures?**
(i) A Tab vazia (div. 1148): (a) **resto do D**, como pergunta do contrato de leitura (mexe no core e no release); (b)
na D-0. **Recomendo (a)**. (ii) O título real nas fixtures (div. 1151): (a) **o caso da Tab que a D-0 regrava passa a
título e artista fabricados**, no mesmo par declarado; as outras fixtures ficam; (b) nada muda. **Recomendo (a)**.

**Q9 — a árvore `../octavia-d0` e a branch local `d0/precheck` (div. 1145)?**
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
