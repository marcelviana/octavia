# I1-PR-11 — anexos: superfície 6, content editor (`/content/[id]/edit`)

> **Bloco** I1 — identidade. **PR** de superfície 6, no molde das I1-PR-6…10 (`docs/ux/I1-PR10-anexos/README.md` §23:
> a casca, a pré-verificação sem sessão com `scrollWidth`, a `casca-efeito`, a classificação "quebra por dado").
> Branch `i1/pr11-content-edit`, árvore `../octavia-i1-pr11`, criada de `origin/main` =
> `8fe45e8837ab9b23b9e96c9388c1016cadf262da` (`Merge pull request #345`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR10-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 17.3s using pnpm v10.28.0`. **Data**: 2026-09-29.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 769** (a PR-10 fechou em 768, §23.7 dela).
> **Estado**: commit 1 (gate-first, `f5260ec`) com o aval (§10.1) e **commit 2** (a implementação, §13–§19) — aguarda o
> aceite do Marcel ("rodei"). PR [#346](https://github.com/marcelviana/octavia/pull/346).

| arquivo | o que é |
|---|---|
| `cn/g-tok-main.txt` | G-tok (ii) com os 9 arquivos do editor, sobre o código da `main` — **REPROVA 440** |
| `cn/g-faixa-esperado.txt` | a folha `6-content-editor` medida → `tests/gates-web/esperado/6-content-editor.json` (+ o controle: `4-content-lista` e `5-content-visualizacao` re-medidos, byte a byte iguais) |
| `cn/quebra-por-dado-cn.mjs` · `cn/quebra-por-dado-cn.txt` | o CN da classificação "quebra por dado" (div. 767): classificador da `main` × o novo sobre os 28 JSON commitados; as 42 da PR-10; a fixture sem quebra |
| `cn/put-antes.txt` | o corpo do `PUT` do editor da `main`, um content de cada tipo (`tests/gates/i1-editor-put.test.tsx`, gravado em `tests/gates/fixtures/editor-put-antes.json`) — a poluição do `content_data` medida |

---

## 1. Inventário `[medido]`

`wc -l` e os imports (`grep -n import`); importadores por `git grep -l` (fora `docs/`, `.planning/`, `.audit/`,
`apps/native`). **Destino** é a proposta do commit 2 (§10).

### 1.1 A rota e a tela

| arquivo | linhas | importa (o que pesa) | quem importa | destino |
|---|---|---|---|---|
| `app/content/[id]/edit/page.tsx` | 115 | `useFirebaseAuth`, **`getContentById`** (cliente → `GET /api/content/<id>`, `lib/content-service.ts:477`), `ContentEditPageClient` por `dynamic` (*"Loading editor..."*, `:7-10`) | a rota | fica, reescrita: os estados de carga/erro **dentro da casca** (hoje fora dela, `:60-112`) |
| `components/content-edit-page-client.tsx` | 47 | `Casca`, `updateContent`, `clearContentCache`, **`toast` do sonner** (`:7`, `:27`, `:31`), `ContentEditor` por `dynamic` (*"Loading editor..."*, `:9-11`) | `edit/page.tsx` | fica, reescrito: o salvar com *Salvando…*, o erro com motivo, `LIB-salvo`; o toast sai (I1-D26) |
| `components/content-editor.tsx` | 203 | `ui/card`, `ui/button`, `ui/label`, `ui/badge`, `ui/separator`, `toast` (sem uso), 17 ícones lucide, `ContentTypeEditor`, `UnifiedMetadataEditor`, `getContentTypeStyle` | `content-edit-page-client.tsx` | fica, reescrito (cabeçalho · chip · *Salvar* · corpo \| *Detalhes*); o morto sai: `zoom`, `selectedTool`, `canvasRef`, `tools`, `colors` (`:59-63`, `:116-126`) — nada os lê |
| `components/editors/content-type-editor.tsx` | 112 | `ChordEditor`, `LyricsEditor`, `TabEditor`, `AnnotationTools`, `PdfViewer` (`h-[calc(100vh-250px)]`, `:56-60`), `next/image` sem `onError` (`:69-78`) | `content-editor.tsx` | fica (o despacho por tipo), reescrito; a partitura: decisão 6 |
| `components/chord-editor.tsx` | 335 | `ui/card·button·input·label·textarea·select`, lucide, `MusicText` (a prévia, `:325`) | `content-type-editor.tsx` | fica, reescrito (Informações · Acordes rápidos · Seções · Prévia); < 150 → partes |
| `components/tab-editor.tsx` | 294 | `ui/card·button·input·label·select`, lucide | `content-type-editor.tsx` | fica, reescrito (Informações · Tablatura · compassos · Prévia); as *"Tablature Tips"* saem (nota da folha) |
| `components/lyrics-editor.tsx` | 53 | `ui/card·textarea` | `content-type-editor.tsx` | fica, reescrito; as *"Formatting tips"* viram o placeholder (nota da folha) |
| `components/unified-metadata-editor.tsx` | 402 | `ui/card·button·input·label·textarea·badge·select·checkbox·accordion`, 14 ícones lucide | `content-editor.tsx` | fica, reescrito (*Detalhes*: Básico · Música · Organização); < 150 → partes |
| `components/annotation-tools.tsx` | 272 | `ui/card·button·input`, `next/image`, `types/annotations` | `content-type-editor.tsx:82-94` (partitura **sem** `.pdf`/imagem) | **inerte** (div. 775): a ferramenta é fixa em `"select"` (`content-type-editor.tsx:89`), que não desenha (`annotation-tools.tsx:107-141`); o fundo lê `content.thumbnail` (`:152`), que **não é coluna** (`thumbnail_url` é) → sempre *"No sheet music image available"*. Destino: decisão 6 |
| `types/annotations.ts` | 52 | — | só `annotation-tools.tsx` | segue o `annotation-tools` |
| `lib/content-type-styles.ts` | 49 | `types/content` | `content-editor.tsx` **e `components/content-creator.tsx`** | **fica** (o editor deixa de importar; o upload segue) |

**Compartilhados** (o que mudar neles muda a visualização): `components/pdf-viewer.tsx` (121, restilizado na PR-10) e
`components/music-text.tsx` (38, importado pela prévia do `chord-editor` e pelo `LyricsDisplay` da visualização).
**Nenhum dos dois muda nesta PR** `[proposta]`: o editor passa ao `pdf-viewer` só o `className` dele (a altura fixa,
decisão 12 da PR-10) e a prévia da folha é um bloco mono (não o `MusicText`). Logo, **sem `casca-efeito` da
visualização** — declarado; se o commit 2 precisar tocá-los, o antes é o `content.json` da PR-10.

**Hooks e o que só o editor usa**: nenhum hook próprio (a tela usa `useFirebaseAuth` e o serviço). Só o editor usa:
`content-editor.tsx`, `editors/content-type-editor.tsx`, os três editores por tipo, `unified-metadata-editor.tsx`,
`annotation-tools.tsx` + `types/annotations.ts`.

**Testes do editor velho**: **nenhum** de componente (`git grep` por `ChordEditor|LyricsEditor|TabEditor|
UnifiedMetadataEditor|AnnotationTools|EditContentPage|ContentEditPageClient` em `*.test.*` → 0). O único que fala do
editor é `lib/__tests__/contract-content.test.ts:198` (*"payload real do content-editor … passa"*) — contrato do
schema, não muda.

### 1.2 A poluição do `content_data` — **herança D, não tocada** (I1-D9) `[lido + medido]`

**Onde nasce** `[lido]`:
1. `content-type-editor.tsx:33-37` (e `:43-47`, `:84-87`, `:97-101`) passa a cada editor `content={{ ...content,
   ...content.content_data }}` — a **linha inteira** achatada com o `content_data`;
2. o editor devolve **tudo** de volta: `chord-editor.tsx:65-68` (`onChange({ ...content, ...newData })`),
   `tab-editor.tsx:64-67`, `lyrics-editor.tsx:15-18`;
3. `content-type-editor.tsx:18-26` (`handleContentChange`) espalha isso **dentro** do `content_data`;
4. `content-editor.tsx:91-98` manda `content_data: { ...editedContent.content_data, annotations, … }` — `annotations` é
   o estado local `:61`, **sempre `[]`** (nada chama `setAnnotations`); os três espalhamentos condicionais (`:95-97`)
   nunca valem (`editedContent.sections/lyrics/measures` não existem no topo).

**O que isso grava** `[medido]` (`cn/put-antes.txt`; o corpo do `PUT` da `main`, uma edição por tipo): o
`content_data` sai com **24–25 chaves** — a de verdade (`chords`/`lyrics`/`tablature`, `sections`/`measures`) **mais**
`user_id`, `id`, `title`, `artist`, `album`, `bpm`, `capo`, `difficulty`, `genre`, `is_favorite`, `is_public`, `key`,
`notes`, `tags`, `thumbnail_url`, `time_signature`, `tuning`, `created_at`, `updated_at`, `file_url`, `content_type`,
**o próprio `content_data` aninhado**, e `annotations: []`. A partitura (`content_data: null`) sai `{ "annotations": [] }`.
Três efeitos colaterais do mesmo desenho, todos **dados** (Bloco D, fora):
- o **Título/Artista/Tom/Capo/BPM** do bloco *Informações* da cifra e da tab gravam **só** no `content_data` — as colunas
  vêm de *Detalhes* (`unified-metadata-editor.tsx:181-270`);
- **`time_signature` é editável** (`unified-metadata-editor.tsx:274-289`) **e nunca vai no corpo** (`content-editor.tsx:79-100`
  não o lista) — a alteração se perde calada (div. 771);
- a tab sem `measures` abre com um **compasso-fixture** (`tab-editor.tsx:23-35`) e não com a `tablature` do content;
  qualquer edição grava a fixture em `content_data.measures` (div. 776).

**O que a PR faz com isso**: nada. O corpo do `PUT` fica **byte a byte** o da `main` — o `tests/gates/i1-editor-put.test.tsx`
(commit 1, passa na `main`: 5/5) é o gate; no commit 2 só os seletores dele mudam (os rótulos mudam), a fixture não.

## 2. A matriz × a folha `[lido]`

A folha tem **16 `data-estado`**: 15 estados + `Tokens` (sem moldura, como a 712/755). A matriz do pre-check
(`I1-PRECHECK-anexos/matriz-estados.txt:232-249`) é de `c57d81f`; as linhas abaixo são as de hoje (o arquivo não mudou
desde então, fora o invólucro da casca da PR-9).

### 2.1 Os 15 estados

| estado da folha | nasce em (hoje) | frase de hoje | o que muda |
|---|---|---|---|
| `EDIT-cifra` (com alteração) | `content-editor.tsx:128-201` + `chord-editor.tsx:114-333` | "Song Information", "Quick Chords", "Song Sections", "Preview", "Unsaved changes", "Save Changes", "Last saved: {hora}" | a folha; o chip **só com alteração** (resposta 21); *"Last saved"* sai (nota: texto falso, `:151`) |
| `EDIT-sem-mudancas` | **não existe na tela**: o chip e o *Salvar* ativo aparecem **ao abrir** (`:74-76` compara o estado normalizado — `null → ""`, `tags → []`, `content_data → {}`, `:42-57` — com a linha crua). `[medido]`: o "antes" (`casca-efeito/antes/content-edit.json`) tem *"Unsaved changes"* nos 5 estados × 3 larguras, sem edição nenhuma | "Unsaved changes" (sempre) | *Salvar* inativo + *nada mudou desde que você abriu* (N6) ao lado; conserto do `null × ""` (div. 772) |
| `EDIT-salvando` | **não existe** (resposta 22): o `onSave` não tem estado de envio (`content-edit-page-client.tsx:21-33`) | — | *Salvando…* no *Salvar*, inativo durante o `PUT` |
| `EDIT-tab` | `tab-editor.tsx:118-292` | "Tab Information", "Tuning", "Tablature", "Add Measure", "Measure {n}", "Tablature Tips" (+13), "Preview" | a folha; as *Tips* saem |
| `EDIT-letra` | `lyrics-editor.tsx:20-51` | "Lyrics Editor", o placeholder de 4 linhas, "Formatting tips:" (+4) | a folha (o placeholder da §5.7) |
| `EDIT-carregando-auth` | `edit/page.tsx:60-69` (`isLoading`) — **fora da casca** | "Loading..." | `estado.carregando` na casca |
| `EDIT-carregando` | `edit/page.tsx:77-86` — fora da casca | "Loading content for editing..." | `edit.carregando` na casca |
| `EDIT-carregando-editor` | **dois** `dynamic` aninhados: `edit/page.tsx:7-10` e `content-edit-page-client.tsx:9-11` | "Loading editor..." (×2) | `edit.carregando.editor` na casca (div. 787) |
| `EDIT-sem-usuario` | `edit/page.tsx:72-74` — **`return null`** (tela em branco, sem casca) | — | `estado.carregando` na casca (resposta 14) |
| `EDIT-erro-rede` · `-erro-auth` · `-erro-limite` · `-erro-servidor` | `edit/page.tsx:39-41` → `:89-111`: **uma frase para todas** (div. 773) | "Content Not Found" + "Failed to load content for editing." + "Go Back" · "Browse Library" | `edit.erro.carregar` com o motivo por espécie na `LinhaDeAviso`; *Tentar de novo* em rede e 5xx; *Voltar* · *Ir para a biblioteca* |
| `EDIT-404` | `:89-94` com `content` nulo; o 404 da API vira `Error("Content not found")` (`content-service.ts:480-483`) e cai no **mesmo** ramo do erro (a mensagem de erro vence: *"Failed to load…"*) | "Content Not Found" / "The content you're trying to edit doesn't exist." (só com corpo nulo) | `edit.nao-existe` + *Voltar* · *Ir para a biblioteca*, sem `LinhaDeAviso` (nota da folha) |
| `EDIT-salvar-erro` | `content-edit-page-client.tsx:29-32` — **toast** e o status perdido (`updateContent`, `content-service.ts:548-553`) | sonner "Failed to save changes" | `edit.erro.salvar` com o motivo + *o que você escreveu continua aqui* (N2) na `LinhaDeAviso`, acima do corpo |

### 2.2 Onde o erro é engolido (ou sai cru)

| arquivo:linha | o que faz |
|---|---|
| `app/content/[id]/edit/page.tsx:39-41` | qualquer falha da carga → `console.error` + a frase única *"Failed to load content for editing."*; rede, 401, 429, 5xx e 404 indistintos (a matriz, item 3) |
| `lib/content-service.ts:459-486` (`getContentById`) | o status se perde: 404 → `Error("Content not found")`; o resto → `Error(errorData.error \|\| "API request failed: N")`; sem usuário → `Error("User not authenticated")`; sem token → `Error(tokenError \|\| "Authentication failed")` — nenhum leva `status` |
| `lib/content-service.ts:528-557` (`updateContent`) | idem no salvar (404 pela mensagem, o resto sem status) |
| `components/content-edit-page-client.tsx:29-32` | o erro de salvar → `console.error` + toast (`Failed to save changes`) — o sonner é montado, então aparece; mas **some** sozinho e não diz por quê |
| `components/content-edit-page-client.tsx:21-28` | o sucesso → toast + `router.push("/library")`; a biblioteca não sabe que salvou (div. 703 da PR-9 → `LIB-salvo`, §4) |
| `components/content-editor.tsx:74-76` | o `null × ""` (div. 772) |

**`return null`**: `edit/page.tsx:72-74` (a resposta 14: vira *carregando…*).

### 2.3 Código sem estado · estado sem código

- **Estado da folha sem código**: `EDIT-sem-mudancas` (o chip nunca some, div. 772), `EDIT-salvando` (resposta 22).
- **Código sem estado na folha**: (a) a **partitura** — o `PdfViewer` de altura fixa, a imagem (sem `onError`) e o
  `AnnotationTools` inerte (div. 775); (b) *remover seção* (`chord-editor.tsx:268-272`), *duplicar* e *remover compasso*
  (`tab-editor.tsx:200-212`), o botão *+* e o *×* das tags e as tags como selos (`unified-metadata-editor.tsx:331-357`)
  — a folha desenha só o caso de uma seção, um compasso e nenhuma tag (div. 781); (c) o **acordeão** de *Detalhes* com o
  resumo *"n of 4 completed"* (div. 780); (d) o erro 400 da carga (id malformado, div. 789); (e) *"Editor for {tipo} is
  not yet implemented."* (`content-type-editor.tsx:105-110`, inalcançável: `normalizeContentType` cai em Lyrics).
- **Controle da folha sem código**: nenhum.

## 3. As frases — a §5.7 (+ N2, N6, N12) × o inventário `[lido]`

| chave (§5.7 / §5.10) | texto | de hoje | onde hoje |
|---|---|---|---|
| `edit.nao-salvo` | alterações não salvas | "Unsaved changes" | `content-editor.tsx:161` |
| `edit.salvar` / `edit.salvando` | Salvar / Salvando… | "Save Changes" / — | `:170` / — |
| `edit.nada-mudou` (**N6**) | nada mudou desde que você abriu | — | — |
| `edit.voltar` (**N12**) | Voltar sem salvar (nome acessível) | — (só ícone) | `:134-136` |
| `edit.carregando` | carregando o conteúdo… | "Loading content for editing..." | `edit/page.tsx:82` |
| `edit.carregando.editor` | carregando o editor… | "Loading editor..." | `edit/page.tsx:9`, `content-edit-page-client.tsx:10` |
| `estado.carregando` (§5.1) | carregando… | "Loading..." · `null` | `edit/page.tsx:65`, `:72-74` |
| `edit.erro.carregar` | não foi possível carregar o conteúdo — {motivo} | "Content Not Found" + "Failed to load content for editing." | `edit/page.tsx:41`, `:93-94` |
| `edit.nao-existe` | este conteúdo não existe | "Content Not Found" / "The content you're trying to edit doesn't exist." | `:93-94` |
| `edit.ir-biblioteca` · `acao.voltar` | Ir para a biblioteca · Voltar | "Browse Library" · "Go Back" | `:99`, `:105` |
| `edit.erro.salvar` · `digitado-fica` (**N2**) | não foi possível salvar — {motivo} · o que você escreveu continua aqui | "Failed to save changes" (toast) | `content-edit-page-client.tsx:31` |
| `edit.cifra.*` | Informações · Título · Artista · Tom · Capo · BPM · Acordes rápidos · Seções · Adicionar seção · Nome da seção · Progressão · Letra da seção · Prévia | "Song Information" · "Title" · "Artist" · "Key" · "Capo" · "BPM" · "Quick Chords" · "Song Sections" · "Add Section" · (placeholder) · "Chord Progression" · "Lyrics" · "Preview" | `chord-editor.tsx:119-305` |
| `edit.tab.*` | Afinação (Padrão (EADGBE) · Drop D (DADGBE) · Sol aberto (DGDGBD) · DADGAD) · Tablatura · Adicionar compasso · compasso {n} | "Tuning" (+ 4 opções) · "Tablature" · "Add Measure" · "Measure {n}" | `tab-editor.tsx:146-198` |
| `edit.letra.placeholder` | escreva a letra — use [Verso 1], [Refrão]… para marcar as seções | o placeholder de 4 linhas + "Formatting tips:" (+4) | `lyrics-editor.tsx:32-46` |
| `edit.meta.*` | Detalhes · Básico · Música · Organização · Título * · Artista · Álbum · Gênero · Tom · BPM · Compasso · Dificuldade · Tags · Notas · Favorita · Pública (dá para compartilhar) | "Details" · "Basic Info" · "Musical Info" · "Organization" · "Title *" · … · "Add to favorites" · "Make this content public (shareable)" | `unified-metadata-editor.tsx:155-393` |
| `motivo.*` · `acao.tentar` (§5.1) | os de sempre | — | — |

**O valor da afinação muda só no rótulo**: a opção mostra *Padrão (EADGBE)*, o valor gravado segue `"Standard (EADGBE)"`
(é dado, no `content_data` — o corpo do `PUT` não muda). O mesmo para gênero e dificuldade (rótulo pt-BR, valor de
hoje).

**Frases que a folha escreve e a §5.7 não lista** (lista declarada, I1-D10 — div. 782):

| texto na folha | onde | hoje | proposta |
|---|---|---|---|
| *casa* (placeholder do Capo) | `EDIT-cifra`, `-tab` | "Fret" | **nova** |
| *álbum ou coleção* · *escolha o gênero* · *escolha* (dificuldade) · *adicionar tag* · *notas sobre este conteúdo* (placeholders) | *Detalhes* | "Album or collection" · "Select genre" · "Select difficulty" · "Add a tag" · "Add any notes about this content..." | **novas** |
| *tom: {x} · BPM: {x}* · *afinação: {x} · BPM: {x}* (a linha de cima da prévia) | *Prévia* | "Key: {x}" · "Capo: {x}" · "BPM: {x}" · "Tuning: {x}" | composição de rótulos da §5.7 em minúscula (como o `view.tab.meta` da PR-10) — **nova** a forma; e o *capo: {x}* (hoje existe) reusa `view.tab.meta` |
| *este conteúdo não existe mais* (motivo do 404 ao salvar, nota de `EDIT-salvar-erro`) | nota | — | **nova** |
| *o servidor não aceitou a sessão, entre de novo* · *muitas tentativas, tente de novo em instantes* (com **vírgula**) | `EDIT-erro-auth`, `-erro-limite` | — | a §5.1 e a lista da PR-9 usam **travessão** (*"— entre de novo"*); decisão 11 (div. 782) |
| *Dó* (valor do Tom) | `EDIT-cifra`, *Detalhes* | "C" (o valor gravado) | decisão 9 (div. 779) |

**Sem desenho na folha, precisam de frase** (controles e opções de hoje — div. 781/783): *Remover seção* · *Duplicar
compasso* · *Remover compasso* (nomes acessíveis; ícones `remover`/`adicionar` do catálogo) · *Adicionar tag* (o
botão +) · *Tirar a tag “{x}”* (o ×); os **16 gêneros** (*Rock, Pop, Jazz, Clássica, Blues, Country, Folk, Metal, Punk,
Alternativa, Indie, Eletrônica, Hip Hop, R&B, Reggae, Outro*) e a dificuldade **Especialista** (`"Expert"`, que o
`DIFICULDADES` da PR-9 não tem); os placeholders *Título*/*Artista* de *Detalhes* ("Song title", "Artist or composer" —
proposta: sem placeholder, a folha não tem), *"Section name (e.g., Verse 1, Chorus)"* (proposta: *ex.: Verso 1,
Refrão*), *"Enter lyrics for this section..."* (proposta: sem), *"Select key"* (proposta: *escolha*).

**Frases de hoje sem destino** (morrem): *"Last saved: {hora}"* (nota da folha); *"Organize and categorize your
content"*; *"{n} of 4 completed"* (div. 780); as duas dicas dos acordes rápidos (*"Click to add chords to the focused
section"* / *"Focus on a chord input to use quick chords"*); *"Formatting tips:"* + 4; *"Tablature Tips"* + *Notation* +
*Techniques* + 8 (a nota: 13 frases cortadas); *"Untitled"* / *"Unknown Artist"* e *"Chords: "* da prévia (a prévia da
folha não mostra título nem artista); *"Editor for {tipo} is not yet implemented."* (inalcançável); o
*"Changes saved successfully"* e o *"Failed to save changes"* do toast (I1-D26 — o sucesso vira `LIB-salvo`, o erro a
linha); do `annotation-tools`: *"No sheet music image available"*, *"Annotations ({n})"*, *"Remove"*, *"Enter text..."*
(decisão 6).

**Dado em inglês que não é frase** (div. 784): o nome padrão da seção nova (*"Verse 1"*, `chord-editor.tsx:58`; *"Content"*
quando a cifra é texto, `:42`) e as seis cordas do compasso-fixture (`tab-editor.tsx:26-33`) **são valor gravado** no
`content_data` — traduzir muda o corpo do `PUT` (I1-D9). Ficam; herança D.

## 4. `LIB-salvo` — o sinal que a biblioteca lê (**sem rota nova, sem escrita nova**) — decisão 1

Hoje: `updateContent` → `clearContentCache()` (duas vezes: `content-service.ts:555` e `content-edit-page-client.tsx:25`)
→ toast → `router.push("/library")` (navegação **suave**: o módulo JS e o estado de React do layout sobrevivem; a
`/library` é SSR e busca a página 1 de novo — a lista já vem atualizada). O que existe no cliente e serve de sinal:

| opção | como | medir `LIB-salvo` no aceite | contra |
|---|---|---|---|
| **(a) recomendado — sinal em módulo** | `lib/sinal-salvo.ts` (novo, ~10 linhas): `marcarSalvo()` antes do `push`; a biblioteca `consumirSalvo()` ao montar (lê **e apaga** — uma vez). É o mesmo padrão do `contentCache` (`content-service.ts:142-145`): estado em memória do módulo, vivo durante a navegação suave | pelo **fluxo inteiro**, fabricado: o estado da `content-edit` edita, salva com o `PUT` **fabricado 200**, a tela vai à `/library` (a `GET /api/content` fabricada, como na PR-9) e mede lá contra a seção `LIB-salvo` da **folha 4** — pede ao medidor a folha por estado (+ ~5 linhas) | recarregar a `/library` perde o sinal (desejado: a frase é do instante) |
| (b) parâmetro na URL | `router.push("/library?salvo=1")`; a biblioteca lê `useSearchParams` e faz `router.replace("/library")` | direto na superfície `library` (`/library?salvo=1`), sem passar pelo editor | a URL é forjável (qualquer um digita `?salvo=1` e vê "alterações salvas"); um parâmetro novo na rota |
| (c) `sessionStorage` | `setItem` no editor, `getItem`+`removeItem` na biblioteca | por `addInitScript` | é escrita (no navegador); sobrevive a recarregar |
| (d) contexto de React | um provedor no `app/layout.tsx` | como (a) | toca o layout raiz, provedor para um booleano |

`router.refresh()` não serve de sinal (não carrega informação). Em qualquer opção a biblioteca desenha a `LinhaDeAviso`
tipo **sucesso** (*alterações salvas*, `garantida` 20 `accentInk`) **abaixo do título**, como a seção `LIB-salvo` da
folha 4; com uma falha de carga na tela, vence a falha (a regra da PR-9). Toca `components/library-page-client.tsx` ou
`RefactoredLibrary.tsx` (na lista do G-tok desde a PR-9) e a entrada `LIB-salvo` de `g-faixa-lista.ts:69` (deixa de ser
inalcançável).

## 5. A classificação "quebra por dado" (herança de instrumento, div. 767) `[medido]`

`scripts/gates-web/g-faixa-classificar.mjs` ganha `quebrasPorDado` e `ehCascata`; `classificarEstado` devolve
`quebraPorDado: { nos, cascata }` à parte das candidatas; o veredito (`g-faixa-veredito.mjs`) lista e conta (*"quebra
por dado N"*, nunca reprova, não pede errata); o resumo do medidor (`g-faixa-sessao.ts`) mostra a coluna.

**A regra**: *quebra por dado* = um nó **sem par por texto dos dois lados** (o texto real não é o da folha — é dado)
no **mesmo lugar** do nó da folha (|Δx|, |Δy|, |Δw| ≤ 4) e mais alto por ter quebrado linha: altura = k × entrelinha,
**k inteiro ≥ 2** (± 4). A entrelinha é a altura do mesmo nó (mesma chave) em **1138**, onde o dado cabe numa linha (sem
ele lá, a altura do nó da folha). A **cascata**: a candidata que só **desceu** (|Δx|, |Δw|, |Δh| ≤ 4; Δy > 4), com o
topo na folha na altura da quebra ou abaixo, e que desceu **no máximo** o que as quebras acima cresceram (Δy ≤ Σ extra +
4 — o que é centrado no cabeçalho desce a metade: os 13,1 do voltar e do *Editar* da PR-10).

**Por que não "altura = k × a altura da folha"**: na PR-10 o título da folha tem 33,8 (entrelinha 1,3 × 26) e o do app
30 por linha (`leading-natural`, div. 766): 60 / 33,8 = 1,78, não inteiro. Medida pela entrelinha do próprio nó em 1138
(30), 60 / 30 = **2**.

**CN** (`cn/quebra-por-dado-cn.txt`, classificador da `main` × o novo):

```
  tests/gates-web/medicoes/content.json · VIEW-partitura · 711: errata candidata 19 → 0 · quebra por dado 19 (nó: heading:f71b2c7b5945#1 em 2 linhas, +26.2)
  tests/gates-web/medicoes/content.json · VIEW-carregando-pdf · 711: errata candidata 11 → 0 · quebra por dado 11 (nó: heading:f71b2c7b5945#1 em 2 linhas, +26.2)
  tests/gates-web/medicoes/content.json · VIEW-erro-pdf · 711: errata candidata 12 → 0 · quebra por dado 12 (nó: heading:f71b2c7b5945#1 em 2 linhas, +26.2)
(1) 28 JSON · 291 (estado × largura) · divergem além da gaveta: 0 · candidatas que viraram quebra por dado: 42
(3) fixture sem quebra (VIEW-partitura · 711, o título em 1 linha): velho errata candidata 19 · novo errata candidata 19 · quebra por dado 0 (nós 0)
CN: PASSA
# exit: 0
```

As **42** da PR-10 saem como quebra por dado (as mesmas, contadas à mão no §23.3 de lá); nos outros 288 (estado ×
largura) de todos os JSON commitados (`medicoes/`, `casca-efeito/`, `cn-main/`) **nada muda** além da gaveta. A fixture
(`tests/gates-web/fixtures/g-faixa-dy-sem-quebra.json`: o mesmo estado com o título em **uma** linha, a cascata de Δy
intacta) → **continua 19 candidatas**. O veredito do CI sobre `tests/gates-web/medicoes`: `errata candidata 119 · quebra
por dado 42` (eram 161), **PASSA** como antes. Vitest: `g-faixa-classificar.test.ts` +4 casos (a cascata sai e o nó
acima fica; sem quebra acima segue candidata; Δy além da quebra segue candidata; altura que não é múltipla não é
quebra) → **18/18**.

## 6. G-tok cresce `[medido]`

`scripts/gates-web/g-tok-arquivos.txt` ganha os **9** arquivos do §1.1 que sobrevivem ou cujo destino é decisão (o
`annotation-tools` entra; se morrer, sai junto no commit 2). O `pdf-viewer` e o `music-text` já estavam (PR-10). Na
`main` (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 76 · literais de identidade acusados: 339 · toasts: 2 · imports de ui: 30 · textos examinados: 105 · isentos de inglês (scripts/gates-web/g-tok-sem-ingles.txt): 1 · vocabulário: 133 · isenções: 9

G-tok: REPROVA — 440 ocorrência(s)
# exit: 1
```

Por classe: 114 [espaçamento] · 92 [cor] · 56 [tamanho] · 53 [inglês, texto JSX] · 30 [import de ui] · 27 [tamanho de
fonte] · 23 [valor arbitrário] · 16 [inglês, atributo] · 15 [raio] · 12 [borda] · 2 [toast].
Por arquivo: `unified-metadata-editor.tsx` 115 · `content-editor.tsx` 75 · `chord-editor.tsx` 64 · `tab-editor.tsx` 61 ·
`app/content/[id]/edit/page.tsx` 58 · `annotation-tools.tsx` 43 · `lyrics-editor.tsx` 13 · `editors/content-type-editor.tsx`
6 · `content-edit-page-client.tsx` 5. Os 67 de antes seguem **0**; o (i) (a folha) segue **PASSA** (26/26, 0 órfãs). O job
`g-tok` do CI fica vermelho neste commit — é o gate-first.

Achado do instrumento (div. 785): `content-type-editor.tsx:93` — o trecho `)\n case ContentType.LYRICS:\n return (` entre
dois JSX sai como *"inglês, texto JSX"* (falso positivo, o mesmo tipo da 750); e o vocabulário não pega *"Preview"*,
*"Measure"*, *"Untitled"*, *"Notation"*, *"Techniques"*, *"Annotations"*, os gêneros… — a contagem de inglês é **por
baixo**; o commit 2 os troca de qualquer jeito.

## 7. Esperado da folha `[medido]`

`tests/gates-web/esperado/6-content-editor.ancoras.json` (novo): as duas da casca (as das folhas 4 e 5) **e as caixas
dos campos**, no molde da `1-auth` (`seletor` + `porRotulo`): a folha desenha o campo como uma caixa com o valor de
exemplo dentro; o app, como um `input` cujo valor é o dado — a caixa ganha o `data-testid` do controle pelo rótulo do
irmão anterior (17 rótulos → `campo-*`; rótulo repetido — *Artista*, *Tom*, *BPM* em *Informações* e em *Detalhes* —
pareia pela ordem, `#1`/`#2`). `cn/g-faixa-esperado.txt`:

```
$ pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 6-content-editor
6-content-editor: 256 caixa(s) de campo ancorada(s) · 16 seções · 15 com C e B · nós C 604 · nós B 604 → tests/gates-web/esperado/6-content-editor.json
  ✗ Tokens: sem a moldura C B
```

256 = 60 da casca (2 × 15 estados × C e B) + 196 caixas de campo. Controle: `4-content-lista` e `5-content-visualizacao`
re-medidos com o mesmo script saem **byte a byte iguais** (`cmp: iguais`). Nós por estado (C = B): `EDIT-cifra` 94 ·
`-sem-mudancas` 94 · `-salvando` 94 · `-tab` 75 · `-letra` 57 · `-carregando-auth` 9 · `-carregando` 9 ·
`-carregando-editor` 9 · `-sem-usuario` 9 · `-erro-rede` 12 · `-erro-auth` 11 · `-erro-limite` 11 · `-erro-servidor` 12 ·
`-404` 11 · `-salvar-erro` 97. O texto da folha vai em claro (obra do projeto: *"Linha de 120 colunas"*, *"La la la, la
la lá"*, a tab `e|---0`); **no aceite, a medição do app só grava hash**.

## 8. O "antes" `[medido]`

`tests/gates-web/medicoes/casca-efeito/antes/content-edit.json` (Marcel, sobre o 1b da PR-10, `e7ab05f`): **5 estados**
(`base-cifra` · `base-letra` · `base-tab` · `base-partitura` · `erro-pdf`) × 1138 · 711 · 411 — 66 · 38 · 74 · 41 · 45 nós.
**Cobre**: o corpo velho por tipo (a cifra, a letra, a tab, a partitura com o PDF e o erro do PDF) com a casca nova —
e prova o defeito da resposta 21: *"Unsaved changes"* está nos **15** (estado × largura) sem edição nenhuma; e o (b) do
editor velho em 411 na partitura (`scrollWidth` **466** num viewport de 411, `base-partitura` e `erro-pdf`).
**Não cobre — "sem antes", declarados**: `EDIT-sem-mudancas` (não existia: o chip nunca some), `EDIT-salvando` (não
existia), `EDIT-carregando-auth`, `-carregando`, `-carregando-editor`, `-sem-usuario` (fora da casca, sem medição),
os quatro `EDIT-erro-*`, `EDIT-404` e `EDIT-salvar-erro` (toast). O `antes` × `depois` do commit 3 prova, nos 5 que têm
antes, que **nenhum nó do editor velho sobrou** e que a casca não se moveu.

## 9. Como o aceite alcança cada estado sem escrever

`/content/[id]/edit` é **cliente**: lê por `GET /api/content/<id>` (`lib/content-service.ts:477`) e salva por **`PUT
/api/content`** com o `id` no corpo (`:535-541` — não `PUT /api/content/<id>`, div. 769). O medidor já fabrica o `GET` (o
1b da PR-10, `g-faixa-conteudo.ts`); o commit 2 acrescenta os estados. **fab.** = `page.route()` respondendo no navegador
com `x-g-faixa: fabricado`; a barreira do medidor aborta e **reprova** qualquer `POST/PUT/DELETE` a `/api/*` que não
tenha sido fabricado (fora `/api/auth/session`). O content fabricado é o **exemplo da folha** (cifra em `sections`, com
*Verso curto — controle* · *C7M G7* · *La la la, la la lá*; tab com `measures` = as seis linhas da folha; letra), para
os valores dos campos parearem.

| estado | como alcançar | escreve? |
|---|---|---|
| `EDIT-sem-mudancas` | `GET` fab. (cifra) — abre | 0 |
| `EDIT-cifra` · `-tab` · `-letra` | `GET` fab. por tipo + uma edição **local** (as *Notas* ganham um caractere: 1 nó "sem par", declarado) | 0 (nada sai: não se clica *Salvar*) |
| `EDIT-salvando` | `EDIT-cifra` + *Salvar* com o `PUT /api/content` **fab. e segurado** (sem resposta durante a medição) | 0 (o `PUT` para no `route()`) |
| `EDIT-salvar-erro` | `EDIT-cifra` + *Salvar* com o `PUT` **abortado no navegador** (`route.abort('failed')` → `TypeError` → *sem conexão*, a seção); 500/429/401/400/404 fabricados → os outros motivos, provados no Vitest | 0 |
| `LIB-salvo` (folha 4) | pela opção (a) do §4: `EDIT-cifra` + *Salvar* com o `PUT` **fab. 200** → a `/library` com a `GET /api/content` fab. (as linhas da folha 4) | 0 |
| `EDIT-carregando` | `GET` fab. **segurado** | 0 |
| `EDIT-erro-rede` · `-auth` · `-limite` · `-servidor` · `EDIT-404` | `GET` **abortado** · fab. **401** · **429** · **500** · **404** | 0 |
| `EDIT-carregando-editor` | o *chunk* do editor **segurado** no `route()` (`/_next/static/chunks/*content-edit*`, `[hipótese]` sobre o nome no `next dev`); se não casar, **INALCANÇÁVEL (declarado)** e provado no Vitest (o `loading` do `dynamic`) e na pré-verificação | 0 |
| `EDIT-carregando-auth` | com sessão, o `isLoading` do Firebase passa antes de qualquer `route()` alcançar — `[hipótese]`: **INALCANÇÁVEL com sessão (declarado)**; medido na pré-verificação sem sessão (fumaça com `isLoading`) e no Vitest | — |
| `EDIT-sem-usuario` | sem usuário não há sessão no perfil — **INALCANÇÁVEL com sessão (declarado)**; na pré-verificação **sem `.env`** o Firebase não inicia e a rota cai nele de verdade | — |
| `base-partitura` · `erro-pdf` (sem seção na folha, div. 775) | os estados do 1b, para a `casca-efeito` (antes × depois) e o (b) de 411 | 0 |

**Todo o editor é fabricável** (o prompt, §17 do pre-check): nenhuma leitura de content real, nenhuma escrita; lidos
de verdade só a sessão (`/api/profile`, `securetoken`). **Cota**: ~50 cargas (16 estados × 3 larguras + o controle) —
acima das 60/15 min do `/api/profile` se somada a outra rodada; o `COMO-RODAR` do commit 2 diz para rodar sozinha.

## 10. Decisões a pedir (não decididas) — para o aval

1. **`LIB-salvo`** (§4, div. 791): **(a) recomendado** — o sinal em módulo (`lib/sinal-salvo.ts`, lido e apagado uma vez
   pela biblioteca), medido pelo fluxo fabricado com a folha por estado no medidor. (b) `?salvo=1` na URL. (c)
   `sessionStorage`. (d) contexto no layout.
2. **O que conta como "alteração"** (resposta 21, div. 772 e 771): **(a) recomendado** — *alterações não salvas* e o
   *Salvar* ativo quando o **corpo do `PUT`** (sem o `updated_at`) difere do corpo que sairia ao abrir — é o que salvar
   muda de fato. Efeito: mudar só o *Compasso* (que nunca é salvo, div. 771) deixa de ativar o *Salvar* — hoje ativa e
   o salvar não o grava. (b) comparar o estado do formulário normalizado dos dois lados (o *Compasso* segue ativando o
   *Salvar* sem ser salvo).
3. **O erro de carga e de salvar por espécie** (div. 773, 789): **(a) recomendado — o molde da PR-9 (decisão 6)**: o
   `Error` de `getContentById` e de `updateContent` passa a levar o `status` (aditivo, `lib/content-service.ts`, fora
   do núcleo do G-back); a tela escolhe: `TypeError` → rede · 401/403 e sem sessão/token → auth · 429 → limite · 404 e
   corpo nulo → não existe (na carga) / *este conteúdo não existe mais* (no salvar) · 400 → *o servidor recusou os
   dados* (no salvar) e **não existe** (na carga: id malformado) · 5xx e o resto → servidor. *Tentar de novo* só em
   rede e 5xx (a §3); no salvar, *Tentar de novo* repete o **mesmo** `PUT`. (b) pela mensagem (frágil).
4. **Os estados de carga na casca** (div. 774): **(a) recomendado** — todos os estados da rota dentro da `Casca` (a
   folha); os dois `dynamic` aninhados viram **um** (o do corpo do editor), com `carregando o editor…` (div. 787). (b)
   mantém os dois (a mesma frase nos dois).
5. **O *Salvar* durante o envio** (resposta 22): inativo com *Salvando…* — um clique duplo deixa de mandar dois `PUT`
   (mudança declarada, é a folha). Aprova?
6. **A partitura no editor** (div. 775 — sem seção na folha): **(a) recomendado** — o mesmo painel da visualização
   (`SheetMusicDisplay`: PDF sem altura fixa, imagem com `onError`, `notation`, vazio, formato) no corpo, *Detalhes* ao
   lado; o `annotation-tools.tsx` + `types/annotations.ts` **morrem** (inertes: ferramenta fixa em `"select"`, fundo
   que nunca aparece); o `annotations: []` do corpo do `PUT` **fica** (é do `content-editor`, não do `annotation-tools`).
   Errata **I1-E19** de leitura: *"a partitura no editor é o painel da `VIEW-partitura`"*. (b) mantém o
   `annotation-tools` restilizado (a lista *Anotações (0)* e o fundo vazio).
7. **A tab** (div. 776): **(a) recomendado** — o compasso num painel como a folha (contorno `line`, mono 22, entrelinha
   tab, rola na horizontal), **com as seis cordas editáveis** (seis campos sem contorno, um por corda — o que se grava
   não muda); *Duplicar compasso* e *Remover compasso* ficam (nomes acessíveis novos, div. 781); a tab sem `measures`
   segue abrindo com o compasso-fixture (dado, herança D). (b) a folha ao pé da letra: o compasso só de leitura
   (perde a edição — mudança de comportamento).
8. **Os acordes rápidos** (div. 777): **(a) recomendado** — o conjunto de hoje (C G Am F D Em A E Dm B7, é o que o
   botão insere) no desenho da folha; os que a folha escreve diferente saem "sem par"/candidatas, declarados. (b) o da
   folha (C Dm Em F G Am C7M Dm7 G7 A7 — muda o que se insere). E: as duas dicas de hoje morrem (a folha não tem);
   o botão segue inativo sem uma *Progressão* com o foco.
9. **O Tom** (div. 779): **(a) recomendado** — o valor como é gravado (*C*, *Am*…; a cifra brasileira usa a letra) — o
   *Dó* da folha é exemplo e sai "sem par". (b) nomes em pt-BR (*Dó*, *Lá menor*… — 38 frases novas).
10. ***Detalhes*** (div. 780, 781): **(a) recomendado** — os três grupos sempre abertos, sem acordeão nem o resumo *"n of 4
    completed"* (a folha); as tags como texto separado por *·* com *Tirar a tag “{x}”* (nome acessível) e o *Adicionar
    tag* (+); *Favorita* e *Pública* como caixa de marcar de 20 em alvo `touch.min`. (b) mantém o acordeão (errata na
    folha).
11. **Pontuação do motivo composto** (div. 782): **(a) recomendado — a folha**: dentro de *"não foi possível … —
    {motivo}"*, o motivo que já tem travessão troca-o por **vírgula** (*o servidor não aceitou a sessão, entre de
    novo*); a lista da PR-9 (`lib.erro`) segue com o travessão — **herança** para a PR de erratas do bloco uniformizar.
    (b) o travessão da §5.1 (a frase da folha sai "sem par").
12. **As frases novas** (§3, divs. 782/783): *casa* · *álbum ou coleção* · *escolha o gênero* · *escolha* · *adicionar
    tag* · *notas sobre este conteúdo* · a forma *tom: {x} · BPM: {x}* / *afinação: {x} · BPM: {x}* · *este conteúdo
    não existe mais* · *Remover seção* · *Duplicar compasso* · *Remover compasso* · *Adicionar tag* · *Tirar a tag
    “{x}”* · *ex.: Verso 1, Refrão* · os 16 gêneros em pt-BR · *Especialista*. Aprova?
13. **As folhas que mostram o dado errado** (div. 778): `EDIT-tab` e `EDIT-letra` trazem em *Detalhes* o título e o
    artista da **cifra** (*Linha de 120 colunas* · *Teste de régua*) — cópia da folha; o app mostra o do content
    aberto. Os 4 nós saem "sem par" (sem errata) — aceita?

**Token**: nenhum falta `[hipótese até o commit 2]` — `touch.min`/`touch.list`, `space.xxl` (o chip), `radius.chip`,
`faixa-metadado` (13, o chip), `web.colunaLateral`, `recuo-cabecalho`, `tam-zoom-padrao` (22), `entrelinha-tab`
(1,45), `fonte-mono-*`; ícones `voltar`, `garantida` (I1-E6), `adicionar`, `remover` no catálogo. Se faltar, paro e
pergunto (div. 713).

### 10.1 O aval do commit 1 — decisões `[Marcel, 2026-09-29]`

(Transcrição do prompt dos commits 1 (fecho), 2 e 3; as perguntas ficam acima.)

- **Extras do commit 1 aprovados**: `tests/gates/i1-editor-put.test.tsx` + a fixture gravada sobre a `main`; a coluna
  "quebra por dado" no resumo do `g-faixa-sessao.ts`.

1. `LIB-salvo` = **(a)** sinal em módulo (`lib/sinal-salvo.ts`), lido e apagado uma vez.
2. Alteração = corpo do `PUT` ≠ corpo de abertura. Div. 771 (*Compasso* nunca é salvo) → **herança D**, com linha.
3. Status **aditivo** no `Error` (molde da PR-9); 400 da carga → *este conteúdo não existe*; *Tentar de novo* só em rede
   e 5xx, repetindo o mesmo `PUT`.
4. Casca em **todos** os estados (carga, erro, não existe); um `dynamic` só.
5. *Salvar* **inativo durante o envio** — declarado como mudança de comportamento (clique duplo deixa de mandar dois
   `PUT`), com teste que reprova na `main`.
6. Partitura = o painel da visualização; `annotation-tools` e `types/annotations` morrem; **I1-E19**: *"a folha não tem
   estado para partitura; vale o painel da folha 5"*.
7. Tab: compasso em painel, seis cordas editáveis; *Duplicar* e *Remover compasso* ficam.
8. Acordes rápidos: o conjunto de hoje.
9. Tom: a letra (*C*). Se a folha escreve *Dó*, **I1-E20**.
10. *Detalhes* sem acordeão.
11. Motivo composto com vírgula (folha); a forma com travessão da PR-9 → herança de harmonização (uma frase só no
    encerramento).
12. Frases novas do §3 aprovadas; entram na lista do bloco.
13. Detalhes da tab e da letra "sem par" (a folha copiou os da cifra), listados.

### 10.2 Os extras do commit 2 — aprovados `[Marcel, 2026-09-29]`

Declarados antes do commit (o rito) e aprovados; vão também no corpo da PR:

- `components/auth/aviso-de-sessao.tsx` — `/content/<id>/edit` passa a desenhar a linha de sessão DENTRO da tela (a
  `LinhaDaTela` no topo do corpo e nos estados de carga), como a visualização (decisão 14 da PR-10).
- `components/identidade/linha-da-tela.tsx` — a segunda linha opcional (`detalhe`, `muted`): *o que você escreveu
  continua aqui* (N2).
- `tailwind.config.ts` — `campo-duas-linhas` (2 × `touch.min`) e `campo-letra` (5 × `touch.min`), derivados (§2.4).
- A biblioteca lê o sinal do `LIB-salvo` (`components/library/RefactoredLibrary.tsx`, `frases-lista.ts` + `edit.salvo`).
- No medidor: `fabricado sem resposta` no log de requests (o `PUT` segurado ou abortado de propósito não é escrita); a
  folha por estado (o `LIB-salvo` da folha 4 medido no fluxo do editor); `scripts/gates-web/g-faixa-editor-exemplos.ts`
  (os exemplos da folha, dado puro, usados pelo medidor e pela pré-verificação).
- Acordes rápidos na ORDEM da folha para os seis que ela tem (C Dm Em F G Am), depois os quatro de hoje (D A E B7) — o
  conjunto é o de hoje (decisão 8); o botão insere o mesmo acorde (div. 792).
- *Duplicar compasso* com o ícone `adicionar` (o catálogo não tem "copiar"): decisão, não desenho novo (div. 793).

## 11. Divergências — 769 a 791

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **769** | P | *"`PUT /api/content/<id>`"* | o salvar é **`PUT /api/content`** com o `id` no corpo (`lib/content-service.ts:535-541` → `app/api/content/route.ts:224-328`); `/api/content/[id]` só tem `GET` | o aceite fabrica `PUT /api/content`; o teste byte a byte lê o corpo desse |
| **770** | A | I1-D9: *"a poluição de `content_data` é Bloco D"* | medida: o `content_data` sai com a linha inteira (24–25 chaves, o `content_data` aninhado, `annotations: []`) — §1.2, `cn/put-antes.txt` | **não tocada**; o corpo byte a byte é gate (`tests/gates/i1-editor-put.test.tsx`) |
| **771** | A | — | `time_signature` é editável (*Compasso*) e **nunca vai no corpo** (`content-editor.tsx:79-100`) | herança D; decisão 2 |
| **772** | A | resposta 21: o chip *"já ao abrir"* (`null × ""`) | `[medido]` no "antes": *Unsaved changes* nos 15 (estado × largura) sem edição (`content-editor.tsx:42-57` × `:74-76`) | consertar (requisito); decisão 2 |
| **773** | A | *"hoje um texto só"* | o status se perde em `getContentById` e `updateContent` (`content-service.ts:480-486`, `:548-553`); o 404 também cai no ramo do erro (a mensagem vence o *"doesn't exist"*) | decisão 3 |
| **774** | A | — | os estados de carga e de erro renderizam **fora da casca** (`edit/page.tsx:60-112`, `min-h-screen bg-[#fff9f0]`); só o editor está nela | decisão 4 |
| **775** | D | *"partitura (o `pdf-viewer` já restilizado)"* | a folha **não tem** estado de partitura; o editor tem três ramos (PDF de altura fixa, imagem sem `onError`, `annotation-tools` inerte) | decisão 6; I1-E19 proposta |
| **776** | D | `EDIT-tab`: o compasso 1 com a tablatura do content, desenhado como painel de leitura | o código ignora `content_data.tablature` e abre o compasso-fixture (`tab-editor.tsx:23-35`); edita por seis campos + duplicar/remover | decisão 7; a fixture é herança D |
| **777** | D | acordes rápidos C Dm Em F G Am C7M Dm7 G7 A7 | o código: C G Am F D Em A E Dm B7 (`chord-editor.tsx:112`) | decisão 8 |
| **778** | D | — | `EDIT-tab` e `EDIT-letra` mostram em *Detalhes* o título/artista da cifra (cópia da folha) | decisão 13 |
| **779** | D | *Tom: Dó* | o valor gravado é a letra (*C*, `chord-editor.tsx:148-187`, `unified-metadata-editor.tsx:64-103`); a §5.7 não nomeia as notas | decisão 9 |
| **780** | D | *Detalhes* com os três grupos abertos | acordeão com só *Basic Info* aberto e o resumo *"n of 4 completed"* (`unified-metadata-editor.tsx:41`, `:105-126`, `:160-399`) | decisão 10 |
| **781** | D | uma seção, um compasso, nenhuma tag | remover seção, duplicar/remover compasso, o + e o × das tags, a alça decorativa (`chord-editor.tsx:260`, sem arrasto) — sem controle na folha | decisões 7, 10, 12; a alça sai (resposta 27) |
| **782** | D | frases da §5.7 | a folha escreve placeholders, a forma da prévia, *este conteúdo não existe mais* e os motivos com vírgula fora da §5.7/§5.1 | decisões 11, 12 |
| **783** | A | — | opções de hoje sem frase: 16 gêneros, *Expert*; placeholders de *Detalhes*/seção | decisão 12 |
| **784** | A | *"sem inglês"* | *"Verse 1"*/*"Content"* (nome padrão da seção) e as cordas do compasso-fixture são **valor gravado** | ficam (I1-D9); herança D; declarados no G-tok se ele os acusar |
| **785** | T | o G-tok (ii) acusa todo inglês em texto | falso positivo em `content-type-editor.tsx:93`; o vocabulário não pega *Preview*, *Measure*, *Untitled*… | registrado; contagem por baixo; o commit 2 troca tudo |
| **786** | A | — | o acorde rápido só funciona com a *Progressão* focada (`chord-editor.tsx:101-110`, `:234`); o `onBlur` (`:282`) zera o foco — `[hipótese]` o clique com o mouse perde o foco antes do `click` e o botão já está inativo | conferir no commit 2 (Vitest); **não se conserta** (comportamento) — herança nomeada se confirmar |
| **787** | D | `EDIT-carregando-editor`: um estado | dois `dynamic` aninhados, a mesma frase (`edit/page.tsx:7-10`, `content-edit-page-client.tsx:9-11`) | decisão 4 |
| **788** | D | `EDIT-salvar-erro` com *Tentar de novo* | a §3: sem ação para 401/403, 429, validação e 404 | decisão 3 (só rede e 5xx) |
| **789** | A | quatro espécies na carga + 404 | a rota devolve **400** para id malformado (`app/api/content/[id]/route.ts:27-31`) | decisão 3 (→ não existe) |
| **790** | T | — | o campo da folha é caixa + texto do valor; o do app, um `input` (o valor no nó do controle) | âncoras `porRotulo` (§7); o texto do valor da folha sai "sem par" |
| **791** | D | `LIB-salvo`: *"redireciona à /library, onde a LinhaDeAviso diz…"* | não há sinal que a biblioteca leia (div. 703 da PR-9) | decisão 1 |

Próxima divergência: **792**.

## 12. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | navegador | só a folha por `file://` (`g-faixa-esperado.ts`) |
| executor | `next dev` | nenhum neste commit |
| executor | Vitest do `PUT` | jsdom, `fetch` falso (nada sai); `Date` fixado |
| — | `packages/identidade` | **não mudou** |
| — | código do app (`app/`, `components/`, `lib/`, `hooks/`) | **0 linha** — o commit 1 é gate, instrumento, esperado, o teste do `PUT` e docs |

---

## 13. Commit 2 — o que mudou `[medido]`

### 13.1 Por grupo (linhas antes → depois)

| grupo | arquivos | o quê |
|---|---|---|
| **a rota** | `app/content/[id]/edit/page.tsx` 115 → 73 | todos os estados na casca (decisão 4); UM `dynamic` (eram dois aninhados, div. 787); a falha da carga por espécie (decisão 3); o `return null` virou *carregando…* |
| **o salvar** | `components/content-edit-page-client.tsx` 47 → 57 | *Salvando…* e o *Salvar* inativo no envio (decisão 5); a falha com o motivo + N2, *Tentar de novo* repete o MESMO corpo (rede e 5xx); o sucesso marca `LIB-salvo` (decisão 1); os dois toasts saíram |
| **o editor** | `content-editor.tsx` 203 → 108 · `editors/content-type-editor.tsx` 112 → 46 · `chord-editor.tsx` 335 → 86 · `tab-editor.tsx` 294 → 103 · `lyrics-editor.tsx` 53 → 39 · `unified-metadata-editor.tsx` 402 → 101 | a folha: cabeçalho (voltar *Voltar sem salvar* · título · tipo · chip SÓ com alteração · *Salvar*/*Salvando…* · *nada mudou desde que você abriu*), corpo por tipo \| *Detalhes* em `web.colunaLateral` (C) ou abaixo (B, A). O ESTADO e o corpo do `PUT` linha a linha os de antes |
| **nasceram** | `components/editors/frases-editor.ts` (133) · `falhas-do-editor.ts` (58) · `campos.tsx` (96) · `informacoes.tsx` (40) · `partes-da-cifra.tsx` (89) · `partes-da-tab.tsx` (67) · `cabecalho-do-editor.tsx` (52) · `tela-de-estado.tsx` (47) · `lib/sinal-salvo.ts` (17) | as frases e as espécies; as peças (bloco, campo, seleção nativa com *▾*, caixa de marcar); os blocos da cifra e da tab; o cabeçalho; os estados sem editor |
| **morreram** | `components/annotation-tools.tsx` (272) · `types/annotations.ts` (52) | inertes (decisão 6, I1-E19); `git grep` → 0 importadores. O `annotations: []` do corpo do `PUT` FICA (é do `content-editor`) |
| **o serviço** | `lib/content-service.ts` (+10/−7) | `getContentById` e `updateContent`: o `Error` leva o `status` (aditivo; as mensagens são as de antes); sem usuário e sem token = 401 |
| **extras aprovados** | §10.2 | `aviso-de-sessao.tsx`, `linha-da-tela.tsx`, `tailwind.config.ts`, `RefactoredLibrary.tsx`/`frases-lista.ts` |
| **instrumento** | `g-faixa-conteudo.ts` (os estados do editor + `LIB-salvo`, tudo fabricado) · `g-faixa-editor-exemplos.ts` (novo) · `g-faixa-superficies.ts` (`content-edit` implementada; `folha` por estado) · `g-faixa-medir.ts` (a folha por estado; `fabricado sem resposta`) · `g-faixa-auth.ts` (`semResposta`) · `g-faixa-lista.ts` (exporta `conteudo`/`DADOS`) · `g-tok-arquivos.txt` (−1 `annotation-tools`, +9 nascidos) · `COMO-RODAR.md` ("I1-PR11") | §15 |
| **docs do congelamento** | `DESIGN-I1/README.md` (§2.2: I1-E19, I1-E20; §5.1: as frases da PR-11) · `erratas.json` (`erratasFrase`: E19, E20) · `SHA256SUMS` (a linha do `README.md`: `bcde6e59…` → `c09d409a…`; `shasum -a 256 -c` → **14/14 OK**) | — |
| **testes** | `tests/gates/i1-editor-put.test.tsx` (só os seletores) · `components/editors/__tests__/editor-estados.test.tsx` (novo, 11) · `lib-salvo.test.tsx` (novo, 3) | §14 |

### 13.2 Onde o erro era engolido — e como ficou

| era (§2.2) | agora |
|---|---|
| `edit/page.tsx:39-41` — uma frase para rede, 401, 429, 5xx e 404 | `especieDaCarga` pelo `status`: *sem conexão* e *falha no servidor* com *Tentar de novo* (uma carga por clique); *o servidor não aceitou a sessão, entre de novo* e *muitas tentativas, tente de novo em instantes* sem ação; 404, 400 e o corpo nulo → *este conteúdo não existe* (sem linha) |
| `content-service.ts` — o status se perdia | o `Error` leva `status` (aditivo) |
| `content-edit-page-client.tsx:29-32` — toast *"Failed to save changes"* | a linha acima do corpo: *não foi possível salvar — {motivo}* + *o que você escreveu continua aqui*; rede e 5xx com *Tentar de novo* (o mesmo corpo); 400 → *o servidor recusou os dados*; 404 → *este conteúdo não existe mais*; 401/429 sem ação |
| `:21-28` — toast de sucesso; a biblioteca não sabia | `marcarSalvo()` e a `/library` de antes; a biblioteca diz *alterações salvas* (sucesso), uma vez |
| `content-editor.tsx:74-76` — o chip ao abrir (`null × ""`) | alteração = corpo do `PUT` (sem `updated_at`) ≠ corpo de abertura (decisão 2) |
| `edit/page.tsx:72-74` — `return null` | *carregando…* na casca |

### 13.3 As heranças D (não tocadas)

- A poluição do `content_data` (§1.2): o corpo do `PUT` é gate byte a byte — **5/5** contra a fixture da `main`.
- **Div. 771**: o *Compasso* segue editável e fora do corpo (`content-editor.tsx`, `corpoDoPut`, sem `time_signature`;
  `unified-metadata-editor.tsx`, o `selecao("time_signature", …)`). Com a decisão 2, mudá-lo não ativa o *Salvar*.
- **Div. 776**: a tab sem `measures` abre o compasso-fixture (`tab-editor.tsx`, `compassoFixture`).
- **Div. 784**: *"Verse 1"*/*"Content"* como nome padrão de seção (`chord-editor.tsx`) — valor gravado.

## 14. Os testes `[medido]`

| teste | o quê | aqui | na `main` |
|---|---|---|---|
| `tests/gates/i1-editor-put.test.tsx` | o corpo do `PUT`, byte a byte, um content de cada tipo (só os seletores mudaram) | **5/5** | 5/5 (é o antes) |
| `components/editors/__tests__/editor-estados.test.tsx` | chip só com alteração · *Salvando…* + clique duplo = UM `PUT` · a carga por espécie (rede, 401, 429, 500; 404 e 400) · o salvar por espécie (rede, 400, 404, 500; *Tentar de novo* repete o mesmo corpo) | **11/11** | **11 falham** (`cn/editor-estados-main.txt`): o *Save Changes* já ativo ao abrir (`toBeDisabled`); o clique duplo manda dois (`expected 2 to be 1`); *"Content Not Found"* no lugar das frases |
| `components/editors/__tests__/lib-salvo.test.tsx` | o editor marca o sinal (uma vez); a biblioteca diz *alterações salvas*; a falha vence | **3/3** | a suíte falha no import (`@/lib/sinal-salvo` não existe) |
| CN da PR-1 · visualizador · tab | — | **15/15 · 6/6 · 1/1** | — |

`pnpm test` → `Test Files 114 passed | 3 skipped (117)` · `Tests 1121 passed | 60 skipped (1181)` · `# exit: 0`
(`cn/pnpm-test.txt`; a PR-10 terminou em 111 / 1098). **Testes do editor velho**: não havia nenhum (§1.1); nenhum morreu.

**O clique duplo** (div. 794): com dois `click` no mesmo instante a `main` mandava UM `PUT` (o segundo evento não
chegava ao `fetch` no jsdom); com **100 ms** entre eles (o clique duplo de uma pessoa) mandava **dois** — o teste usa o
intervalo.

## 15. O instrumento

- `content-edit` implementada: `EDIT-cifra`, `-tab`, `-letra` (a alteração local: marcar *Favorita* — nenhum texto muda),
  `-sem-mudancas`, `-salvando` (o `PUT /api/content` segurado), `-salvar-erro` (abortado → *sem conexão*), `-carregando`
  (o `GET` segurado), `-carregando-editor` (o *chunk* segurado, `[hipótese]` sobre o nome), `-erro-rede/-auth/-limite/
  -servidor`, `-404`; `LIB-salvo` (`PUT` fabricado 200 → a `/library` com as linhas da folha 4, medido contra a folha 4).
  Inalcançáveis com sessão: `-carregando-auth`, `-sem-usuario`. Mais os cinco do 1b (`base-*`, `erro-pdf`).
- **`fabricado sem resposta`**: o `PUT` segurado (solto no fim) ou abortado de propósito falha no navegador; antes o log
  o marcava `FALHA`/`pendente` e o veredito o contaria como escrita. O `semResposta` (`g-faixa-auth.ts`) marca a request.
- **A hidratação** (div. 795): no `next dev` o HTML do SSR chega antes dos *handlers* — o 1º clique em *Favorita* se
  perdia (sonda: `aria-checked false`, sem chip). O `alterar` repete o clique até o chip aparecer.

## 16. A pré-verificação sem sessão (`pre-verificacao/`) `[medido]`

`next dev -p 3110` **sem `.env`** numa cópia da árvore (rsync sem `.env*`, `node_modules` por link), com
`pagina-fumaca.tsx` em `app/fumaca-i1pr11/[estado]/page.tsx` (os componentes reais com os exemplos da folha; apagada no
fim); `rodar.ts` com a mesma `coletar` e o mesmo `classificarEstado`, contra `esperado/6-content-editor.json`; toda
escrita a `/api/*` abortada (0). `EDIT-sem-usuario` também pela fumaça: a rota real sem cookie vai ao `/login` pelo
middleware (`307`, medido). Saída `pre-verificacao/saida.txt`; nós `pre-verificacao/medicoes.json` (só fixture).

```
TOTAL: 45 (estado × largura) · (e) 0 · (b) 0 · scrollWidth = viewport em 45/45 · errata candidata (C e B) 0 · escritas a /api abortadas 0
```

**Cinco rodadas; o que acharam e foi consertado antes do commit**: (1) o clique antes da hidratação (div. 795); (2)
*Detalhes* 50 px estreito — a folha é `content-box` (320 de conteúdo + respiro), `c:box-content` (div. 796); os campos
altos em 75,6 px — o `min-h-toque-min` do campo vinha depois no CSS e vencia o `min-h-campo-*` (`ENTRADA_ALTA`, div. 797);
os `data-testid` que não são âncora tiravam o par de nós de texto igual (*Salvar*, o chip, *Favorita*) e marcavam
invólucros como nós (saíram; `data-tela` para o medidor, div. 798); as cordas da tab cortadas em 411 (`self-start`: a
largura é a da corda e o painel rola, div. 799); a ordem dos acordes (§10.2); (3) a prévia sem a linha em branco da
folha; (4) a prévia da tab em minúscula inteira (*eadgbe*, visto na captura em A; só a inicial — div. 800). **Sem par**,
por estado: os dados de exemplo que a folha escreve dentro das caixas (o valor pareia pela âncora do campo), *Dó*
(I1-E20), os quatro acordes que diferem, a prévia da cifra (*Dó* × *C*), *Buscar…*/*MV* (a casca, sem usuário) e, do app,
a `<nav>`, o campo da busca e o *Adicionar tag* (o *+* que a folha não desenha).

**Capturas** (`capturas/`, 15): `EDIT-cifra`, `-tab`, `-letra`, `-salvar-erro`, `-erro-rede` × C-1138 · B-711 · A-411 — da
fumaça (fixture, sem conta; o "N" no canto é o indicador do `next dev`).

## 17. Os gates — verdes `[medido]`

| gate / suíte | resultado | arquivo |
|---|---|---|
| G-tok | **PASSA**: (i) 26/26, 0 órfãs; (ii) `arquivos: 84 · literais de identidade acusados: 0 · toasts: 0 · imports de ui: 0` — **440 → 0** | `cn/g-tok-depois.txt` |
| G-back | **PASSA** — o `PUT /api/content` e o núcleo não mudaram (`lib/content-service.ts` é cliente, fora do núcleo) | `cn/g-back-depois.txt` |
| G-palco | **PASSA — 0** | `cn/g-palco.txt` |
| `pnpm test` | `114 passed \| 3 skipped (117)` · `1121 passed \| 60 skipped (1181)` | `cn/pnpm-test.txt` |
| os testes da PR · CN da PR-1 | 44/44 (+1 pulado, o `CN_GRAVAR`) · **15/15** | `cn/testes-da-pr.txt`, `cn/cn-pr1.txt` |
| `tsc --noEmit` · `pnpm lint` | 0 · ✔ | `cn/tsc.txt`, `cn/lint.txt` |
| `pnpm build` | `✓ Compiled successfully`; `ƒ /content/[id]/edit 6.92 kB`; `# exit: 0` (cópia sem `.env`) | `cn/build.txt` |
| inércia das públicas | 12 (estado × largura) nos dois lados, **12 idênticos**; `INÉRCIA: PASSA` | `cn/inercia-publicas.txt` |
| `pdf-viewer` · `music-text` | `git diff --stat origin/main --` os dois → **vazio**: sem `casca-efeito` da visualização | `cn/pdf-viewer-music-text.txt` |

## 18. Divergências — 792 a 800

| # | origem | o que se presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **792** | D | decisão 8: *o conjunto de hoje* | a ordem de hoje punha G, Am, Em, Dm em outras casas (4 candidatas) | a ordem da folha para os seis comuns — extra aprovado (§10.2) |
| **793** | D | *Duplicar compasso* fica | o catálogo não tem "copiar" | ícone `adicionar` — extra aprovado |
| **794** | T | *"clique duplo deixa de mandar dois `PUT`"* | na `main`, dois cliques no mesmo instante mandavam UM; com 100 ms, dois | o teste usa 100 ms (§14) |
| **795** | T | — | no `next dev` o clique chega antes da hidratação | `alterar` repete até o chip (medidor e roteiro) |
| **796** | A | *Detalhes* em `web.colunaLateral` | a folha a mede em `content-box` (320 + respiro) | `c:box-content` |
| **797** | A | — | `min-h-toque-min` × `min-h-campo-*`: a ordem do CSS decide | `ENTRADA_ALTA` sem o `min-h` do campo de uma linha |
| **798** | T | — | `data-testid` fora das âncoras tira o par pelo texto e marca invólucros como nós | só as âncoras `campo-*` ficam; `data-tela` para o medidor |
| **799** | A | — | a corda da tab esticada pelo `flex-col` cortava o texto no próprio campo em 411 | `self-start`: rola no painel |
| **800** | A | — | a prévia da tab minusculava as notas da afinação | só a inicial |

Próxima divergência: **801**.

## 19. Contabilidade (commit 2)

| quem | item | valor |
|---|---|---|
| executor | requests a prod ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | `next dev` **sem** `.env`, porta 3110, numa cópia da árvore (sem `.env*`) | 1 subida: 5 rodadas da pré-verificação e a inércia; parada; a fumaça apagada |
| executor | `pnpm build` | na mesma cópia, sem `.env` |
| executor | a `main` para os testes novos | worktree temporária de `8fe45e8` (`--detach`), só os arquivos de teste copiados |
| — | `packages/identidade` | **não mudou** |
