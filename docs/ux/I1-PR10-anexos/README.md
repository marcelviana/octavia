# I1-PR-10 — anexos: superfície 5, content visualização (`/content/[id]`)

> **Bloco** I1 — identidade. **PR** de superfície 5, no molde das I1-PR-6…9 (`docs/ux/I1-PR9-anexos/README.md` §18.8:
> a casca, a raiz que não estiliza, a pré-verificação sem sessão com `scrollWidth`, a `casca-efeito`).
> Branch `i1/pr10-content-view`, árvore `../octavia-i1-pr10`, criada de `origin/main` =
> `8b662fc72ecfba871117d0ab0aab4d5a2c7860d4` (`Merge pull request #344`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR9-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 12.8s using pnpm v10.28.0`. **Data**: 2026-09-28.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 732** (a PR-9 fechou em 731, §18.7 dela).
> **Estado**: commit 1 (gate-first) — **aguardando o aval** (§9).

| arquivo | o que é |
|---|---|
| `cn/g-tok-main.txt` | G-tok (ii) com os 11 arquivos que sobrevivem, sobre o código da `main` — **REPROVA 373** |
| `cn/g-faixa-esperado.txt` | a folha `5-content-visualizacao` medida → `tests/gates-web/esperado/5-content-visualizacao.json` (+ o controle: o `4-content-lista` re-medido sai byte a byte igual) |
| `cn/linha-de-base-b.mjs` · `cn/linha-de-base-b.txt` | os (b) de 1138 da linha de base, nó a nó (`cn-main` e `casca-efeito`) |
| `cn/pdfjs-erros.mjs` · `cn/pdfjs-erros.txt` | o erro do `pdfjs-dist` 4.8.69 para corpo inválido (Node) e o que o código compara |
| `cn/pdfjs-erros-navegador.mjs` · `cn/pdfjs-erros-navegador.txt` | o erro do pdf.js no Chromium fixado, por espécie (500 · 404 · corpo inválido · rede), respostas fabricadas. A última linha (*"sem CORS"*) não prova nada sobre CORS: o `fulfill` do Playwright entrega o corpo mesmo sem o cabeçalho, e o corpo (`%PDF-1.4`) é inválido — é mais um caso de `InvalidPDFException` |

---

## 1. Inventário `[medido]`

`wc -l` e os imports (`grep -n import`); importadores por `git grep -l` (fora `docs/`, `.planning/`, `.audit/`,
`apps/native`). **Destino** é a proposta do commit 2 (§9).

### 1.1 A rota e a tela

| arquivo | linhas | importa (o que pesa) | quem importa | destino |
|---|---|---|---|---|
| `app/content/[id]/page.tsx` | 28 | `requirePageUser`, **`getContentByIdServer`** (SSR — Supabase direto no servidor, `:25`), `ContentPageClient` | a rota | **fica sem mudança** (div. 732: é SSR) |
| `components/content-page-client.tsx` | 73 | `ContentViewer`, `Casca`, `ErrorBoundary` (`lib/error-boundary`) **em volta da casca inteira** (`:51`), `ContentEditor` por `dynamic` (*"Loading editor..."*, `:10-12`), `updateContent` | a rota; `tests/gates/i1-visualizador.test.tsx` | fica, reescrito: `ConteudoDaCasca` no lugar do invólucro `flex-1 bg-[#fffcf7]`; **o editar inline morre** (div. 736) |
| `components/content-viewer.tsx` | 99 | `useContentActions` (**`hooks/useContentActions.ts`**, não o da lista), `ContentHeader`, `ContentToolbar`, `ContentDisplay`, `ContentSidebar`, `DeleteDialog`; `zoom`/`isPlaying`/`currentPage` em estado | `content-page-client.tsx`; `tests/components/content-viewer.refactoring.test.tsx` | fica (a composição), reescrito |
| `components/content-viewer/ContentHeader.tsx` | 92 | `ui/button`, `lucide-react` (`ArrowLeft`, `Star`), `getContentTypeIcon` (lucide) | `content-viewer.tsx`; o teste de refatoração | fica, reescrito (voltar · título · tipo · **Editar**; sem favoritar) |
| `components/content-viewer/ContentDisplay.tsx` | 66 | `ui/card`; `transform: scale(zoom/100)` com `zoom` sempre 100 (`:38`); `min-h-[calc(100vh-250px)]` (`:36`) | `content-viewer.tsx` | fica (o painel por tipo), reescrito; o `scale` inerte sai (div. 745) |
| `components/content-viewer/ContentSidebar.tsx` | 143 | `ui/card`, `ui/badge`, `lucide-react` | `content-viewer.tsx` | fica, reescrito (*Detalhes* · *Notas de palco*) |
| `components/content-viewer/ChordDisplay.tsx` | 131 | — (quatro formas de `content_data`, div. 742) | `ContentDisplay.tsx`; `monospace-rendering.test.tsx` | fica, reescrito |
| `components/content-viewer/LyricsDisplay.tsx` | 61 | `MusicText` | `ContentDisplay.tsx`; `monospace-rendering.test.tsx` | fica, reescrito |
| `components/content-viewer/TabDisplay.tsx` | 91 | — (`getOrdinalSuffix` por prop: *"3rd fret"*) | `ContentDisplay.tsx`; `monospace-rendering.test.tsx` | fica, reescrito |
| `components/content-viewer/SheetMusicDisplay.tsx` | 65 | `PdfViewer`, `next/image`, `MusicText`, `isPdfFile`/`isImageFile` (I1-D36) | `ContentDisplay.tsx` | fica, reescrito (o tipo continua vindo da extensão) |
| `components/content-viewer/ContentToolbar.tsx` | 120 | `ui/button`, `ui/slider`, `lucide-react` | só `content-viewer.tsx`, com `showToolbar={false}` — o único chamador (`content-page-client.tsx:66`) o desliga | **morre** (inalcançável) |
| `components/content-viewer/DeleteDialog.tsx` | 45 | `ui/dialog`, `ui/button` | só `content-viewer.tsx`; aberto por `handleDelete`, que **nenhum botão chama** (matriz do pre-check, *INALCANÇÁVEL?*) | **morre** (decisão 28 da folha) |
| `hooks/useContentActions.ts` | 43 | `deleteContent`, `clearContentCache`, `toast` do **sonner** (`:24`, `:27`) | só `content-viewer.tsx` (a lista usa `hooks/use-content-actions.ts`, outro arquivo) | **morre**: o apagar é inalcançável e o favoritar é local e falso (`:31-34`, *"TODO: Implement API call"*) — decisão 20 da folha |
| `components/pdf-viewer.tsx` | 287 | `react-pdf`, `ui/button`, `lucide-react` (10 ícones) | `SheetMusicDisplay.tsx` **e o editor** (`components/editors/content-type-editor.tsx:7`, `:56-60`) | **fica, restilizado sem mudar o que faz** (§1.3); quebrado em partes < 150 (CLAUDE.md) |
| `lib/error-boundary.tsx` | 111 | `ui/button`, `lucide-react`, `logger` | `content-page-client.tsx:8` **e `app/layout.tsx:11`** (o limite global) | **não muda** (div. 744) |
| `components/music-text.tsx` | 38 | — (negrito/itálico em `<pre whitespace-pre-wrap>`) | `LyricsDisplay`, `SheetMusicDisplay` **e `components/chord-editor.tsx`** (editor) | **não muda**; o chamador passa as classes |

**`useContentFile`-sucessor**: não há. O hook morreu na PR-3 (div. 555) e o `SheetMusicDisplay` lê `content.file_url`
direto (`:15-17`, I1-D36). **O que só a visualização usa**: `content-viewer.tsx`, os nove de `content-viewer/`,
`hooks/useContentActions.ts`. O `pdf-viewer` e o `music-text` são compartilhados com o editor.

### 1.2 Os testes da visualização velha

| arquivo | linhas | o que prova | destino |
|---|---|---|---|
| `tests/gates/i1-visualizador.test.tsx` | 132 | o CN da I1-D36 (6/6): os quatro tipos + a imagem abrem pela extensão; controle *"Failed to load file"* | **fica** — é o CN da I1-D36; adapta os dois textos que mudam (`/Failed to load file/` → `view.erro.formato`; `getByAltText('Sheet music')` → o `alt` novo), par declarado |
| `tests/components/monospace-rendering.test.tsx` | — | CONT-01/02: `whitespace-pre` + `overflow-x-auto` na cifra, letra e tab (5 casos) | **fica e se adapta** às classes novas (o mesmo: sem quebra, rola na horizontal dentro do painel) |
| `tests/components/content-viewer.refactoring.test.tsx` | 550 | 25 casos que **mocam** `useContentActions`, `ContentHeader`, `ContentToolbar`, `ContentDisplay`, `ContentSidebar`, `DeleteDialog` e `@/lib/firebase-storage` e testam a casca de 2025 (setlist, *Performance Mode*, *memory leaks*) | **morre** (os módulos que moca morrem ou mudam de contrato; o que prova de vivo — os quatro tipos abrem — o `i1-visualizador` prova) `[proposta]` |

### 1.3 O `pdf-viewer` e o editor — o efeito (I1-D27)

O editor velho (`/content/[id]/edit`, folha 6, PR-11) monta o **mesmo** `PdfViewer` para uma partitura `.pdf`
(`components/editors/content-type-editor.tsx:54-60`, com `className="w-full h-[calc(100vh-250px)]"` e `fullscreen`).
Tudo o que mudar nele aparece lá, **dentro do corpo velho de fundo claro** (`#fffcf7`, o invólucro da PR-9):

| o que muda no `pdf-viewer` | efeito no editor |
|---|---|
| a barra: ícones sem texto → *Anterior* · *página n de N* · *Próxima* · zoom −/+ · *Largura* · *Página* · *Tela cheia* (texto, `touch.min`) | a barra fica mais alta (48 em vez de ~36) e, em B, empilha em duas linhas |
| as cores: dos tokens escuros (`cor-text` claro) | **ilegível sobre o `#fffcf7`** se a barra não trouxer o próprio fundo → a proposta (decisão 3) é o `pdf-viewer` trazer o fundo `cor-bg` na barra e na área da página: no editor, até a PR-11, ele vira um bloco escuro dentro da página clara |
| carregando / erro: a `LinhaDeAviso` no lugar do *spinner* e do bloco *"Failed to load PDF"* + *Retry/Download* | as mesmas frases e o mesmo *Tentar de novo* no editor; *Download* sai (resposta 18) |
| o que faz — páginas, zoom, largura/página, tela cheia | **nada muda** (I1-D9, I1-D27) |

A medição **antes/depois** no editor fica em `tests/gates-web/medicoes/casca-efeito/content-edit.json` — como alcançar
sem ler conteúdo real está no §7; o "antes" pede o instrumento (decisão 4).

## 2. Os estados: a matriz × a folha `[lido]`

A folha tem **16 `data-estado`**: 15 estados + a seção `Tokens` (sem moldura — como a 712 da PR-9). A matriz do
pre-check (`I1-PRECHECK-anexos/matriz-estados.txt:207-231`) é de `c57d81f`, antes da PR-3 (que matou o
`useContentFile`); as linhas abaixo são as de hoje.

### 2.1 Os 15 estados

| estado da folha | a folha cita | nasce em (hoje) | frase de hoje | o que muda |
|---|---|---|---|---|
| `VIEW-cifra` | `ChordDisplay.tsx` | `ChordDisplay.tsx:13-86` (quatro formas: `sections` `:13-42`, `chords` lista com diagrama `:43-80`, `chords` texto `:81-86`) + `progression` `:109-129` | "Chord Chart", "Chords: ", "Song Structure" | a folha: um painel *Cifra* com o corpo mono 22 que rola dentro dele (div. 742) |
| `VIEW-letra` | `LyricsDisplay.tsx`, `ContentSidebar.tsx:123` | `LyricsDisplay.tsx:13-19` (`MusicText`) + o bloco *"Chords"* `:32-59`; notas vazias `ContentSidebar.tsx:129-138` | "Lyrics"; "No performance notes available" + "Click Edit to add notes…" | a folha; a nota vazia vira uma frase (`view.notas.vazio`) |
| `VIEW-tab` | `TabDisplay.tsx` | `TabDisplay.tsx:13-32`; capo/afinação `:57-68`; *"Chord Progression"* `:71-89` | "Tablature", "Capo:", "{n}{st\|nd\|rd\|th} fret", "None", "Tuning:", "Standard (EADGBE)" | a folha (`view.tab.meta`) |
| `VIEW-partitura` | `pdf-viewer.tsx` | `SheetMusicDisplay.tsx:25-31` → `pdf-viewer.tsx:223-283` | "Sheet Music"; "Page {n} / {N}"; *title* "Fit width"/"Fit page"; os outros só ícone | a folha (barra de texto; §1.3) |
| `VIEW-partitura-cheia` | `pdf-viewer.tsx` | `pdf-viewer.tsx:111-120` (`requestFullscreen` no contêiner **inteiro**, barra incluída) | — (ícone) | a folha — mas ela tira a paginação da tela cheia (div. 739) |
| `VIEW-carregando-arquivo` | `SheetMusicDisplay.tsx:26/:29` | **não existe**: era o *"Loading..."* do `useContentFile` (`matriz-estados.txt:212`), morto na PR-3 (div. 555). Hoje o PDF vai direto ao `carregando o PDF` e a imagem ao `next/image` (sem estado) | — | **I1-E15** proposta (div. 734) |
| `VIEW-carregando-pdf` | `pdf-viewer.tsx:170-171` | `pdf-viewer.tsx:167-173` (o `loading` do `Document`, `:276`) | "Loading PDF..." + "URL: {50 caracteres}..." | `view.pdf.carregando`; a URL sai (nota da folha) |
| `VIEW-vazio-partitura` | `SheetMusicDisplay.tsx:93-99` | `SheetMusicDisplay.tsx:54-62` (sem `file_url` nem `notation`) | "No sheet music available" / "Upload a PDF or image file to display sheet music" | `view.vazio.partitura` / `.apoio` |
| `VIEW-vazio-letra` | `LyricsDisplay.tsx:13-26` | `LyricsDisplay.tsx:20-29` | "No lyrics available" / "Add lyrics to help with performance" | `view.vazio.letra` / `.apoio` |
| `VIEW-vazio-tab` | `TabDisplay.tsx:26` | `TabDisplay.tsx:33-54` — **tablatura-fixture** mostrada como conteúdo | (a fixture) | `view.vazio.tab` (N4) — o vazio honesto |
| `VIEW-vazio-cifra` | `ChordDisplay.tsx:81` | `ChordDisplay.tsx:87-105` — **quatro acordes-fixture** (Am F C G) com diagramas falsos | (a fixture) | `view.vazio.cifra` (N5) |
| `VIEW-erro-cache` | `useContentFile.ts:49` | **não existe**: o arquivo morreu na PR-3 (div. 555); não há cópia guardada no navegador desde a I1-PR-3 | — | **I1-E15** proposta (div. 733) |
| `VIEW-erro-formato` | `SheetMusicDisplay.tsx:76/:79` | `SheetMusicDisplay.tsx:41-45` (`file_url` sem `.pdf`/imagem) | "Failed to load file. Please check the file format or try again later." | `view.erro.formato` na `LinhaDeAviso`; o *Tentar de novo* da folha: div. 740 |
| `VIEW-erro-pdf` | `pdf-viewer.tsx:73-89` | `pdf-viewer.tsx:73-90` → `:176-221` | "Failed to load PDF" + a **mensagem crua** do pdf.js (div. 735) + "URL: …" + *Retry* · *Download* (· *Refresh Page* e 💡 só com `blob:`, mortos) | `view.erro.pdf` com o motivo por espécie + *Tentar de novo* (resposta 18) |
| `VIEW-erro-render` | `lib/error-boundary.tsx:59/:61` | `lib/error-boundary.tsx:47-95`, montado **em volta da casca** (`content-page-client.tsx:51`) | "Something went wrong" + `error.message` cru; *Try again* · *Reload page* | `view.erro.render` na `LinhaDeAviso`, **dentro do corpo** (a folha mantém casca, cabeçalho e detalhes) — div. 744 |

### 2.2 Onde o erro é engolido (ou sai cru) — o que o commit 2 destampa

| arquivo:linha | o que faz |
|---|---|
| `components/pdf-viewer.tsx:79-87` | escolhe a frase pela **mensagem** (`includes("UnexpectedResponseException")`, `"Invalid name"`, `"blob:"`) — **nunca casa** (div. 735): o pdf.js põe a espécie no `name`, não na `message`, e `"Invalid name"` não existe no worker 4.8.69 (`cn/pdfjs-erros.txt`: 0 ocorrências nos três *bundles*). O ramo `blob:` morreu com o cache. **Toda falha de PDF mostra a mensagem crua do pdf.js em inglês** (`:181`), com a URL (`:182`) |
| `components/pdf-viewer.tsx:113-118` | `requestFullscreen().catch(() => {})` / `exitFullscreen().catch(() => {})` — a recusa é muda, e o `setIsFullscreen(true)` vem **antes** de saber se entrou: recusada, o controle diz "sair" sem estar em tela cheia (o `fullscreenchange` de `:146-148` não dispara) |
| `components/pdf-viewer.tsx:32-36` | `setupPdfWorker`: falha → `console.warn` e o *worker* de `/pdf.worker.min.mjs` — **fica** (não é estado de tela) |
| `components/content-viewer/SheetMusicDisplay.tsx:33-39` | a imagem (`next/image`) **não tem `onError`**: falha de carga mostra o ícone quebrado + o `alt` *"Sheet music"* — sem estado na folha (div. 741) |
| `lib/error-boundary.tsx:61` | a exceção de render mostra o `error.message` cru; a folha: só *"algo deu errado"* |
| `components/content-viewer/TabDisplay.tsx:71-77` | `content_data.chords.map(...)` sem `Array.isArray` — com `chords` em texto, **lança** e cai no limite de render (a página inteira, casca junto, vira o *fallback* inglês) — div. 743 |
| `components/content-page-client.tsx:35-44` · `hooks/useContentActions.ts:25-28` | o salvar inline e o apagar logam e engolem — **código morto** (div. 736, 737) |
| `app/content/[id]/page.tsx:25` → `lib/content-service.ts:455-458` | 404 / de outro usuário: `.single()` lança → a tela padrão do Next — **fica** (resposta 30 da folha) |

### 2.3 Código sem estado · estado sem código

- **Estado da folha sem código**: `VIEW-erro-cache` (div. 733) e `VIEW-carregando-arquivo` (div. 734) → **I1-E15**
  proposta; o motivo *"a cópia guardada está corrompida…"* de `view.erro.pdf` (div. 735).
- **Código sem estado na folha**: (a) a **imagem** de partitura (`.jpg`, `next/image`, `SheetMusicDisplay.tsx:32-40`) e
  a falha dela (div. 741); (b) a **notação em texto** (`content_data.notation`, `SheetMusicDisplay.tsx:47-53`); (c) as
  formas de cifra além do texto — `sections` com nome/acordes/letra, a lista com diagrama, a `progression` — e os
  blocos *"Chords"* da letra e *"Chord Progression"* da tab (div. 742); (d) a falha de rede do PDF, sem motivo na §5.6
  (div. 735); (e) a recusa da tela cheia (§2.2); (f) a `SESSAO-nao-renovada` nesta tela (div. 751).
- **Controle da folha sem código**: *Editar* (o `onEdit` chega ao `ContentViewer` e não desce a nenhum filho,
  `content-viewer.tsx:13,20`; div. 736); *Diminuir/Aumentar o zoom* com nome acessível (hoje só ícone).
- **Controle de hoje que a folha tira**: favoritar (decisão 20; já era falso), apagar (decisão 28; já inalcançável),
  *Download* e *Refresh Page* (resposta 18).

## 3. As frases — a §5.6 × o inventário `[lido]`

**Cada chave da §5.6 e o que ela substitui:**

| chave (§5.6) | texto | de hoje | onde hoje |
|---|---|---|---|
| `view.voltar` | Voltar para a biblioteca (nome acessível, N12) | — (botão só ícone) | `ContentHeader.tsx:50-56` |
| `view.editar` | Editar | — (não há botão; div. 736) | — |
| `view.painel` | cifra · letra · tab · partitura | "Chord Chart" · "Lyrics" · "Tablature" · "Sheet Music" | `ChordDisplay:10` · `LyricsDisplay:11` · `TabDisplay:11` · `SheetMusicDisplay:21` |
| `view.detalhes` | Detalhes (+ os rótulos de campo) | "Song Details" + "Album" · "Difficulty" · "Genre" · "Key" · "Time Signature" · "Tempo" · "Tags" · "Created" · "Modified" | `ContentSidebar.tsx:18-110` |
| `view.notas` / `.vazio` | Notas de palco / nenhuma nota de palco — use Editar para escrever | "Performance Notes" / "No performance notes available" + "Click Edit to add notes and performance tips" | `ContentSidebar.tsx:121`, `:133`, `:136` |
| `view.tab.meta` | capo: {x} · afinação: {x} | "Capo:" · "Tuning:" | `TabDisplay.tsx:59`, `:65` |
| `view.pdf.pagina` | página {n} de {N} | "Page {n} / {N}" | `pdf-viewer.tsx:231` |
| `view.pdf.largura` / `.pagina` | Largura / Página (nomes: Ajustar à largura / Ajustar à página) | *title* "Fit width" / "Fit page" | `pdf-viewer.tsx:254`, `:257` |
| `view.pdf.tela-cheia` / `.sair` | Tela cheia / Sair da tela cheia | — (ícone `Maximize`/`Minimize`) | `pdf-viewer.tsx:261-267` |
| `view.pdf.carregando` | carregando o PDF… | "Loading PDF..." (+ "URL: …", sai) | `pdf-viewer.tsx:170-171` |
| `view.vazio.partitura` / `.apoio` | nenhuma partitura / envie um PDF ou uma imagem para ver a partitura | "No sheet music available" / "Upload a PDF or image file to display sheet music" | `SheetMusicDisplay.tsx:57`, `:60` |
| `view.vazio.letra` / `.apoio` | nenhuma letra / escreva a letra para ter no palco | "No lyrics available" / "Add lyrics to help with performance" | `LyricsDisplay.tsx:23`, `:26` |
| `view.vazio.tab` (N4) · `view.vazio.cifra` (N5) | nenhuma tablatura · nenhuma cifra | (as fixtures) | `TabDisplay.tsx:33-54` · `ChordDisplay.tsx:87-105` |
| **`view.erro.cache`** | não foi possível abrir o arquivo guardado neste navegador | — | **sem destino**: o código morreu na PR-3 → I1-E15 |
| `view.erro.formato` | não foi possível abrir o arquivo — confira o formato | "Failed to load file. Please check the file format or try again later." | `SheetMusicDisplay.tsx:43` |
| `view.erro.pdf` + motivos | não foi possível abrir o PDF — {motivo} | "Failed to load PDF" + a mensagem crua | `pdf-viewer.tsx:180-182` |
| `view.erro.render` | algo deu errado | "Something went wrong" + `error.message` | `lib/error-boundary.tsx:59-62` |
| `acao.tentar` (§5.1) | Tentar de novo | "Retry" · "Try again" | `pdf-viewer.tsx:197` · `lib/error-boundary.tsx:83` |

**Frases que a folha escreve e a §5.6 não lista** (lista declarada, I1-D10 — div. 748):

| texto na folha | onde | hoje | proposta |
|---|---|---|---|
| *Anterior* · *Próxima* | `VIEW-partitura` (barra) | — (ícones) | reuso de `lib.paginas.*` (§5.5) — sem frase nova |
| *Diminuir o zoom* · *Aumentar o zoom* (nomes acessíveis) | `VIEW-partitura` | — (ícones sem nome) | **novas** |
| *{título} · página {n} de {N}* | `VIEW-partitura-cheia` | — | composição de dado + `view.pdf.pagina` — sem frase nova |
| *capo: nenhum* · *afinação: padrão (EADGBE)* (os valores de reserva) | `VIEW-tab` | "None" · "Standard (EADGBE)" (`TabDisplay.tsx:62`, `:66`) | **novas** (*nenhum*, *padrão (EADGBE)*) |
| *compasso* · *criado* · *alterado* · *dificuldade* (rótulos de campo) | `VIEW-*` (Detalhes) | "Time Signature" · "Created" · "Modified" · "Difficulty" | **novas** — a §5.6 diz "+ os rótulos de campo de hoje" sem listá-los |
| *{artista} · {tipo}* e *artista desconhecido* | cabeçalho | "{artista} • {content_type cru}" (`ContentHeader.tsx:69`) | reuso de `lib.artista.desconhecido` e dos rótulos de `TIPOS` em minúscula (`view.painel`) |
| *avançado* (valor de dificuldade) | `VIEW-tab` | "advanced"… (o dado cru) | reuso de `DIFICULDADES` (§5.5), em minúscula |
| *10 set 2026* (criado/alterado) | Detalhes | `toLocaleDateString()` (a língua do navegador) | reuso de `dataCurta` (div. 708) |

**Rótulos de campo de hoje sem desenho na folha** (a folha mostra só os quatro acima com dados de exemplo; os de hoje
existem e aparecem quando o dado existe — **novas**, para o aval): *álbum* ("Album"), *gênero* ("Genre"), *tom*
("Key"), *andamento* + *{x} BPM* ("Tempo", "{x} BPM"), *etiquetas* ("Tags", hoje *badges*); e o capo com número:
*"{n}{st|nd|rd|th} fret"* (`TabDisplay.tsx:61`, o ordinal inglês) → proposta *"{n}ª casa"*.

**Frases de hoje sem destino** (morrem com o redesenho): *"Loading editor..."* (o inline morto); *"Chords: "*, *"Song
Structure"*, o *"Chords"* da letra e o *"Chord Progression"* da tab (os rótulos dos blocos; o dado fica — div. 742);
*"URL: …"* e *"💡 Try refreshing the page…"*; *Download*, *Refresh Page* (resposta 18) e *Reload page* (nota de
`VIEW-erro-render`); o `alt` *"Sheet music"* (vira *partitura*, `view.painel`); os textos do `DeleteDialog` e os dois
toasts do `useContentActions` (mortos). *"Error Details (Development Only)"* fica fora (nota da folha; o
`lib/error-boundary.tsx` não muda).

## 4. G-tok cresce `[medido]`

`scripts/gates-web/g-tok-arquivos.txt` ganha os **11** arquivos do §1.1 que sobrevivem — o `pdf-viewer` entre eles (ele
muda, e muda no editor). Os três que morrem (`ContentToolbar`, `DeleteDialog`, `useContentActions`) ficam fora; o que o
commit 2 criar entra no commit 2. Na `main` (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 60 · literais de identidade acusados: 342 · toasts: 0 · imports de ui: 5 · textos examinados: 53 · isentos de inglês (scripts/gates-web/g-tok-sem-ingles.txt): 1 · vocabulário: 109 · isenções: 9

G-tok: REPROVA — 373 ocorrência(s)
# exit: 1
```

Por classe: 103 [cor] · 90 [espaçamento] · 57 [tamanho de fonte] · 40 [tamanho] · 24 [raio] · 24 [inglês, texto JSX] ·
20 [borda] · 5 [valor arbitrário] · 5 [import de ui] · 3 [entrelinha] · 2 [inglês, atributo].
Por arquivo: `ContentSidebar.tsx` 90 · `pdf-viewer.tsx` 62 · `ChordDisplay.tsx` 61 · `LyricsDisplay.tsx` 46 ·
`ContentHeader.tsx` 37 · `SheetMusicDisplay.tsx` 31 · `TabDisplay.tsx` 29 · `ContentDisplay.tsx` 7 ·
`content-viewer.tsx` 7 · `content-page-client.tsx` 3; `app/content/[id]/page.tsx` 0. Os 49 de antes seguem 0; o (i) (a
folha) segue `PASSA` (19/19). O job `g-tok` do CI fica vermelho neste commit — é o gate-first.

Dois achados do instrumento (div. 750): duas expressões JSX (`ChordDisplay.tsx:43` e `SheetMusicDisplay.tsx:47`, o
`) : …content_data… ? (`) saem como *"inglês, texto JSX"* — falso positivo; e o vocabulário não pega *"Chord Chart"*,
*"Tablature"*, *"Capo:"*, *"Tuning:"*, *"Page"*, *"None"*, *"Album"*, *"Key"*, *"Tempo"*… — o commit 2 os troca de
qualquer jeito; a contagem de inglês acima é **por baixo**.

## 5. Esperado da folha `[medido]`

Com as âncoras da casca (`tests/gates-web/esperado/5-content-visualizacao.ancoras.json` — as mesmas duas da folha 4:
a caixa da busca e a conta), `cn/g-faixa-esperado.txt`:

```
$ pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 5-content-visualizacao
5-content-visualizacao: 56 caixa(s) de campo ancorada(s) · 16 seções · 15 com C e B · nós C 344 · nós B 344 → tests/gates-web/esperado/5-content-visualizacao.json
  ✗ Tokens: sem a moldura C B
```

56 = 2 âncoras × 14 estados com casca × C e B (a tela cheia não tem casca). Controle: o `4-content-lista` re-medido
com o mesmo script sai **byte a byte igual** ao commitado (`cmp: iguais`). Nós por estado (C = B): `VIEW-cifra` 22 ·
`VIEW-letra` 22 · `VIEW-tab` 26 · `VIEW-partitura` 31 · `VIEW-partitura-cheia` 3 · `VIEW-carregando-arquivo` 22 ·
`VIEW-carregando-pdf` 22 · `VIEW-vazio-partitura` 23 · `VIEW-vazio-letra` 23 · `VIEW-vazio-tab` 22 ·
`VIEW-vazio-cifra` 22 · `VIEW-erro-cache` 23 · `VIEW-erro-formato` 23 · `VIEW-erro-pdf` 23 · `VIEW-erro-render` 23
(+2 cada com as âncoras). O texto da folha vai em claro no esperado (é obra do projeto: *"Linha de 120 colunas"*,
*"Régua de 120 colunas — B7/N1…"*, a tab `e|---0`); **no aceite, a medição do app só grava hash**.

## 6. A linha de base: os (b) de 1138 `[medido]`

`tests/gates-web/medicoes/cn-main/content.json` e `casca-efeito/content.json` existem — **não re-medidos**. O
content medido é o primeiro da conta (`primeiroContent`, `g-faixa-superficies.ts:46-60`): uma **cifra** em texto (o
`h3` *"Chord Chart"*, `e8d370949eb4`). Os (b) de 1138, nó a nó, pela `cortes()` do classificador
(`cn/linha-de-base-b.txt`; o texto de cada hash calculado das frases do código de hoje):

**`casca-efeito` (a casca nova, o corpo velho) — os 9 que o commit 2 zera:**

| # | tipo | nó | texto (hash) | x · y · w · h |
|---|---|---|---|---|
| 1 | página com rolagem horizontal | (página) | — | `scrollWidth` **1271** num viewport de 1138 |
| 2 | borda do viewport | `heading/h3` | *"Song Details"* (`0b0029061b39`) | 1115,5 · 171 · 138,1 · 28 |
| 3 | borda do viewport | `label/label` | *"Album"* (`f05e840e0069`) | 1115,5 · 215 · 138,1 · 16 |
| 4 | borda do viewport | `texto/p` (19 car.) | o valor do álbum (dado) | 1115,5 · 231 · 138,1 · 20 |
| 5 | borda do viewport | `texto/span` (17 car.) | *"Created {data}"* | 1115,5 · 276 · 68,1 · 32 |
| 6 | borda do viewport | `texto/span` (18 car.) | *"Modified {data}"* | 1183,6 · 276 · 70 · 32 |
| 7 | borda do viewport | `heading/h3` | *"Performance Notes"* (`cbfaca9522d6`) | 1115,5 · 358 · 138,1 · 56 |
| 8 | borda do viewport | `texto/p` | *"No performance notes available"* (`d2ba55e554a6`) | 1116,5 · 495 · 136,1 · 40 |
| 9 | borda do viewport | `texto/p` | *"Click Edit to add notes and performance tips"* (`2e758a0f56bc`) | 1116,5 · 539 · 136,1 · 32 |

**A causa** `[lido]`: `content-viewer.tsx:78` é `flex flex-col md:flex-row` com o `ContentDisplay` em `flex-1`
(`ContentDisplay.tsx:32`) **sem `min-w-0`**, e o corpo da cifra é `whitespace-pre` (`ChordDisplay.tsx:84`): a linha
longa (984,5 px) vira a largura mínima do item flexível e empurra a coluna `md:w-80` (`ContentSidebar.tsx:12`) para
fora — em 1138 ela começa em x = 1115,5 e só 22 px dela ficam na tela; a página rola (1271). Em 711 e 411 a coluna já
desce (`flex-col`) e não há (b). **O conserto da folha**: corpo `flex: 1 1 0; min-width: 0`, painel `overflow-x: auto`
com `data-rolagem="painel"` (resposta 19; a decisão 621 conta a rolagem horizontal dele como (d′)), coluna em
`web.colunaLateral` (320) — a linha longa rola **dentro** do painel.

**`cn-main` (a casca velha) — eram 10**: os mesmos 8 da coluna (em x = 1403,5, dentro do `main` que rola) + o `h3`
*"Chord Chart"* e o `div` de 255 caracteres do corpo (x 345 · w 984,5), cortados pela borda do viewport; sem rolagem
da página (a raiz `h-screen overflow-hidden` da casca velha cortava em vez de rolar). A PR-9 trocou 10 por 9: os dois
do corpo voltaram para dentro e a página passou a rolar.

## 7. Como o aceite alcança cada estado sem escrever

**A premissa do prompt não vale para a visualização** (div. 732): `/content/[id]` é **SSR** —
`app/content/[id]/page.tsx:25` → `getContentByIdServer` (`lib/content-service-server.ts`) → Supabase **no servidor**.
Nenhum request do navegador traz o content; um `route()` sobre `GET /api/content/[id]` não é chamado por esta tela. É o
caso da div. 699 da PR-9 (o painel). **O que o navegador busca é o arquivo**: o `PdfViewer` (pdf.js) faz o `GET` do
`file_url` (o Storage, outra origem) — esse o `route()` responde com fixture e o arquivo real não é lido. **O editor**
(`/content/[id]/edit`) é o contrário: página cliente que lê por `GET /api/content/<id>` (`lib/content-service.ts:477`)
— ali o `route()` fabrica tudo.

Fixture: **não há PDF de fixture no repositório** (`git ls-files '*.pdf'` → só os `telas.pdf` do DESIGN nativo; div.
753). Proposta: o medidor gera em memória um PDF de 12 páginas com o `pdf-lib` (já dependência, `package.json:101`)
— nenhum arquivo novo; o texto das páginas é do projeto.

Tabela para a **decisão 1 (a), recomendada** — **fab.** = `page.route()` respondendo no navegador com
`x-g-faixa: fabricado`; **SSR real** = a carga da rota lê a linha do content da conta (a "carga inicial" que o prompt
admite), escolhida pela `GET /api/content` que a `/library` já faz (só `id`, `content_type` e a extensão do `file_url`,
em memória, como o `primeiroContent`):

| estado | como alcançar | lê content real? | escreve? |
|---|---|---|---|
| `VIEW-cifra` | `/content/<a 1ª cifra da conta>` | a linha (SSR) — os nós de dado saem **"sem par"** (título, artista, corpo, valores de Detalhes, notas), contados à parte, como o `DASH` da PR-9 | 0 |
| `VIEW-letra` | `/content/<a 1ª letra>` — *"notas vazias"* só se ela não tiver notas | idem | 0 |
| `VIEW-tab` | `/content/<a 1ª tab>` | idem | 0 |
| `VIEW-partitura` | `/content/<a 1ª partitura .pdf>` + `GET <file_url>` **fab.** com o PDF de 12 páginas gerado | a linha; **o PDF real não** (o `route()` responde antes de sair) | 0 |
| `VIEW-partitura-cheia` | `VIEW-partitura` + clicar *Tela cheia* (`requestFullscreen` no Chromium sem janela `[hipótese de instrumento]`) | idem | 0 |
| `VIEW-carregando-pdf` | `VIEW-partitura` com o `GET <file_url>` **segurado** (sem resposta durante a medição) | idem | 0 |
| `VIEW-erro-pdf` | `GET <file_url>` **fab.** 500 → `UnexpectedResponseException` → *"o arquivo está corrompido ou inacessível"* (a frase da seção). As outras espécies (404, corpo inválido, rede) não têm seção: provadas no Vitest | idem | 0 |
| `VIEW-vazio-partitura` · `-vazio-letra` · `-vazio-tab` · `-vazio-cifra` | **∅ no navegador** sem um content vazio desse tipo na conta (a linha vem do servidor) — **INALCANÇÁVEL (declarado)**; se a conta tiver um, mede | — | — |
| `VIEW-erro-formato` | **∅**: por construção não há `file_url` sem extensão aceita (o upload recusa, B5; as 8 de prod terminam em `.pdf`/`.jpg`, `B5-PRECHECK.md:157-177`) — INALCANÇÁVEL (declarado) | — | — |
| `VIEW-erro-render` | **∅** sem uma exceção de render (a única real conhecida é a tab com `chords` em texto, div. 743) — INALCANÇÁVEL (declarado) | — | — |
| `VIEW-erro-cache` · `VIEW-carregando-arquivo` | **sem código** (divs. 733, 734) — não medidos; I1-E15 | — | — |

Os seis INALCANÇÁVEIS se provam em dois lugares: **(1)** um CN de render no Vitest dos estados (vazio ≠ erro; as
quatro espécies do PDF → os três motivos + o genérico; a exceção de render dentro do corpo com a casca e o cabeçalho
de pé), como o `painel-estados.test.tsx` da PR-9; **(2)** a pré-verificação sem sessão do executor (páginas de fumaça
locais montando o `ContentPageClient` com os textos da folha) mede **os 13 estados** nas três larguras com Δ contra a
folha e `scrollWidth` — e desta vez o resultado entra em `cn/` como anexo (na PR-9 ficou só a contagem).

**`casca-efeito/content-edit`** (o `pdf-viewer` no editor): `/content/g-faixa-partitura/edit` com `GET
/api/content/g-faixa-partitura` **fab.** (uma partitura com `file_url` `.pdf` fictício) + o `GET` do arquivo **fab.**
(o PDF gerado) — **nenhuma leitura de content real**, nenhuma escrita (o editor não é clicado). Estados `base` e
`erro-pdf` (o 500). Antes/depois: decisão 4.

**Nenhuma escrita**: a barreira do medidor (`g-faixa-medir.ts`) aborta `POST/PUT/DELETE` a `/api/*` fora de
`/api/auth/session`; a visualização nova não escreve (o favoritar falso e o apagar saem).

## 8. Divergências — 732 a 755

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **732** | P | §2 item 7: *"`GET /api/content/[id]` fabricado por tipo"* alcança os estados | `/content/[id]` é **SSR** (`app/content/[id]/page.tsx:25` → Supabase no servidor); o navegador só busca o **arquivo** (o PDF). Quem lê pelo navegador é o **editor** | §7; decisão 1 |
| **733** | A | `view.erro.pdf.motivos` com o de cache (I1-E15 = "dois motivos") | a folha tem um **estado inteiro** `VIEW-erro-cache` (T-I1-R167/168), de `useContentFile.ts:49` — morto na PR-3 (div. 555) | I1-E15 proposta; decisão 2 |
| **734** | A | — | `VIEW-carregando-arquivo` (T-I1-R155/156) cita `SheetMusicDisplay.tsx:26/:29`, o *"Loading..."* do `useContentFile` — morto na PR-3; hoje não há fase "carregando o arquivo" | I1-E15 proposta; decisão 2 |
| **735** | A | a folha: três motivos por espécie (`pdf-viewer.tsx:73-89`) | o código escolhe pela **mensagem** e nunca casa: o pdf.js 4.8.69 põe a espécie no `name` (`UnexpectedResponseException` 500 · `MissingPDFException` 404 · `InvalidPDFException` corpo inválido · `UnknownErrorException` *"Failed to fetch"* na rede — `cn/pdfjs-erros-navegador.txt`) e `"Invalid name"` não existe (0 nos *bundles*). Hoje toda falha mostra a mensagem crua. E a rede não tem motivo na folha | motivo pelo `name`; decisão 2 |
| **736** | A | *"Editar (leva a `/edit`)"* | hoje **não há Editar** na tela: o `onEdit` para no `ContentViewer` (`content-viewer.tsx:13,20`); o `isEditing` + `ContentEditor` inline + `updateContent` de `content-page-client.tsx:10-12,26,31-48,55-60` é morto (matriz: *INALCANÇÁVEL?*). A nota de `VIEW-letra`: *"agora o Editar existe no cabeçalho"* | *Editar* = link para `/content/[id]/edit` (rota que existe; a lista já leva lá pelo *Mais → Editar*); o inline morre; decisão 5 |
| **737** | A | decisões 20/28: favoritar e apagar **saem** | o favoritar era **local e falso** (`useContentActions.ts:31-34`, *TODO*, nada persiste) e o apagar **inalcançável**; o `ContentToolbar` também (`showToolbar={false}`) | morrem: `useContentActions.ts`, `DeleteDialog.tsx`, `ContentToolbar.tsx` (+ o teste de refatoração que os moca, §1.2) |
| **738** | D | `view.voltar` = *"Voltar para a biblioteca"* | o voltar é `router.back()` (`content-page-client.tsx:27-29`): volta ao **histórico** (painel, setlists…), e numa carga direta sai do app | decisão 6 |
| **739** | D | `VIEW-partitura-cheia`: barra com *título · página n de N* e *Sair da tela cheia* | hoje a tela cheia é o contêiner inteiro, **com a barra toda** (páginas, zoom, ajustes). A da folha **tira a paginação** — contra *"o `pdf-viewer` mantém páginas… tela cheia"* (I1-D27, I1-D9). E o `pdf-viewer` não conhece o título (só `url`) | decisão 7; prop `titulo` aditiva |
| **740** | D | `VIEW-erro-formato` com *Tentar de novo* | a §3 do README-design: *"sem ação quando repetir não resolve"*; o tipo vem da extensão do `file_url` (I1-D36): repetir nunca muda; hoje não há repetir | decisão 8 |
| **741** | A | — | a **imagem** de partitura (`.jpg`) não tem estado na folha, e a falha dela não tem `onError` (ícone quebrado + `alt` inglês) | decisão 9 |
| **742** | A | a folha: um corpo mono por tipo | a cifra tem quatro formas de `content_data` + `progression`; a letra e a tab têm blocos de acordes; a partitura tem `notation` em texto (`SheetMusicDisplay.tsx:47-53`) | decisão 10 |
| **743** | A | — | `TabDisplay.tsx:71-77`: `chords.map` sem `Array.isArray` — tab com `chords` em texto **lança**; hoje a página inteira (casca junto) vira o *fallback* inglês | decisão 11 |
| **744** | D | `VIEW-erro-render`: casca, cabeçalho e detalhes de pé; a linha no corpo | o limite de hoje envolve **a casca inteira** (`content-page-client.tsx:51`); o `lib/error-boundary.tsx` é também o limite **global** (`app/layout.tsx:124`) | um limite **do corpo** em `components/content/` com a `LinhaDeAviso`; o `lib/error-boundary.tsx` não muda (o *fallback* global inglês fica para quem o alcança — herança nomeada) `[proposta]` |
| **745** | A | — | `ContentDisplay.tsx:37-40`: `transform: scale(zoom/100)` com `zoom` sempre 100 (o controle está no `ContentToolbar` desligado); `min-h-[calc(100vh-250px)]` (`:36`) e a altura do PDF `h-[calc(100vh-250px)]` (`SheetMusicDisplay.tsx:29`) são literais | o `scale` inerte sai; decisão 12 (a altura) |
| **746** | D | página do PDF a **60 % do painel** (C: 409 px); 40 % / 85 % na tela cheia; *Largura* marcado ao abrir | o código: `Page width={800}` × escala (`pdf-viewer.tsx:280`), *Ajustar* = contêiner / 800 (`:122-132`), começa em 100 % sem ajuste marcado | fica o código (é o que o visualizador faz); o nó da página (canvas, sem texto) não pareia; o marcado = o último ajuste escolhido (nenhum ao abrir) `[proposta]` |
| **747** | D | Detalhes da folha: *compasso · criado · alterado* (e *dificuldade* na tab) | o código mostra álbum, dificuldade, gênero, tom, compasso, andamento, etiquetas, criado, alterado — cada um quando existe | um par por campo, na ordem de hoje; rótulos novos (§3); decisão 13 |
| **748** | D | frases da §5.6 | a folha escreve *capo: nenhum*, *afinação: padrão (EADGBE)*, *Diminuir/Aumentar o zoom*, os rótulos de campo — fora da §5.6; o capo com número é o ordinal inglês *"3rd fret"* | lista declarada (§3); decisão 13 |
| **749** | A | — | `ContentHeader.tsx:69`: o subtítulo mostra o `content_type` **cru** ("Chords") e o artista vazio vira *"• Chords"* | *{artista} · {tipo}* com `artista desconhecido` e o rótulo pt-BR (como a lista) — registrado |
| **750** | T | o G-tok (ii) acusa todo inglês em posição de texto | duas expressões JSX (`ChordDisplay.tsx:43`, `SheetMusicDisplay.tsx:47`) saem como *"inglês, texto JSX"* (falso positivo); e o vocabulário não pega *"Chord Chart"*, *"Tablature"*, *"Capo:"*, *"Page"*, *"None"*, *"Album"*… | registrado; a contagem de inglês do §4 é por baixo; o commit 2 troca tudo |
| **751** | A | — | `SESSAO-nao-renovada` vale *"para toda tela fora do `/login`, logo abaixo do título"* (DESIGN-I1 §1.3); a decisão 9 da PR-9 deixou no topo *"até a PR de cada uma"* — esta é a da visualização (`components/auth/aviso-de-sessao.tsx`, `ROTAS_QUE_DESENHAM_A_LINHA`) | decisão 14 |
| **752** | A | — | `pdf-viewer.tsx:113-118`: a recusa da tela cheia é muda e o estado diz "em tela cheia" antes de entrar | decisão 7 (junto) |
| **753** | P | *"`file_url` … apontando para um arquivo local do repositório de fixture — confira o que o `i1-visualizador.test.tsx` já usa"* | o CN usa URLs **fictícias** com o `PdfViewer` num *stub* (`:30-32`, `:41`) — nenhum arquivo; não há PDF de fixture no repositório | o medidor gera o PDF de 12 páginas com o `pdf-lib` em memória `[proposta]` |
| **754** | A | *"`i1-visualizador.test.tsx` 6/6 — continua sendo o CN da I1-D36"* | ele procura *"Failed to load file"* (`:130`) e o `alt` *"Sheet music"* (`:84`, `:120`) — os dois textos mudam | adapta só esses dois seletores; par declarado |
| **755** | D | `README-design.md` §2.4: *"5-content-visualizacao · 15 estado(s)"* | 16 `data-estado` (a seção `Tokens`, sem moldura) | 15 medidos (como a 712) |

Próxima divergência: **756**.

## 9. Para o aval

1. **O alcance no aceite** (div. 732): **(a) recomendado** — o §7: a rota real (SSR) com o 1º content de cada tipo da
   conta (escolhido pela `GET /api/content` da `/library`, só `id`/tipo/extensão em memória) e o **arquivo** fabricado
   (PDF de 12 páginas gerado; 500; segurado); os nós de dado "sem par", contados à parte (a decisão 12 da PR-9);
   `VIEW-vazio-*` (4), `-erro-formato` e `-erro-render` **INALCANÇÁVEIS (declarados)**, provados por um CN de render no
   Vitest e pela pré-verificação sem sessão dos 13 estados, esta **anexada** em `cn/`. A partitura da conta é lida só
   como linha (título, `file_url`); o PDF real não. (b) nenhuma leitura de content real: o aceite com sessão mede só a
   `casca-efeito/content-edit` (fabricada), e os 13 estados ficam na pré-verificação sem sessão + Vitest — o (b) 9 → 0
   não é provado com sessão.
2. **I1-E15** (divs. 733, 734, 735) — **(a) recomendado**: *"`VIEW-erro-cache` e `VIEW-carregando-arquivo` **não
   existem** (a cópia no navegador e o hook que a lia morreram na I1-PR-3, I1-D18); `view.erro.cache` sai. `view.erro.pdf`
   escolhe o motivo pelo `name` do erro do pdf.js: `MissingPDFException` e `UnexpectedResponseException` → *o arquivo
   está corrompido ou inacessível*; `InvalidPDFException` → *formato de PDF inválido*; `UnknownErrorException` de
   rede → `motivo.rede` (*sem conexão*, da §5.1); o resto → `motivo.generico`; o de cache sai"*. Errata de **estado** na
   §2.2 (os T-I1-R155/156 e 167/168 caem: 286 → 282 requisitos) e de **frase**; no `erratas.json` em `erratasFrase` (o
   G-faixa não a acha: são estados não medidos). (b) só os dois motivos (tira o de cache) e os dois estados ficam como
   "não medidos" sem errata.
3. **O efeito no editor** (§1.3): **(a) recomendado** — o `pdf-viewer` restilizado traz o **próprio fundo** (`cor-bg`
   na barra e na área da página): no editor velho vira um bloco escuro dentro da página clara até a PR-11; medido em
   `casca-efeito/content-edit` (critério: Δ de posição/tamanho só do `pdf-viewer`; o resto do editor, 0). (b) uma
   variante `aparencia="velha"` para o editor até a PR-11 (duas aparências no mesmo componente).
4. **O antes do editor**: **(a) recomendado** — um **commit 1b** só de instrumento (a superfície `content-edit` no
   `g-faixa-superficies.ts`, fabricada, §7; nenhuma linha de `app/`/`components/`/`lib/`): você mede o antes nele (é o
   código da `main`) → `casca-efeito/antes/content-edit.json`; o depois no aceite. (b) "sem antes": só o depois.
5. **Editar** (div. 736): **(a) recomendado** — link para `/content/[id]/edit` (a rota que existe); o editar inline
   morto (`isEditing`, `ContentEditor` por `dynamic`, `updateContent`, *"Loading editor..."*) sai. (b) o botão chama o
   inline de hoje (o editor velho aparece dentro da visualização).
6. **Voltar** (div. 738): **(a) recomendado** — fica `router.back()` (I1-D9), com o nome da folha; registrado que numa
   carga direta ele sai do app, como hoje. (b) link para `/library` (o nome passa a ser verdade; muda o fluxo).
7. **A tela cheia** (divs. 739, 752): **(a) recomendado** — errata **I1-E16** *"na tela cheia a barra é a da folha
   (título · página n de N · Sair) **mais Anterior e Próxima**"* (a paginação fica; zoom e ajustes saem da tela cheia,
   como a folha); o estado de tela cheia só pelo `fullscreenchange` (a recusa deixa de mentir). (b) a folha como está
   (sem paginar na tela cheia). (c) a barra inteira de hoje na tela cheia (errata maior).
8. **`VIEW-erro-formato`** (div. 740): **(a) recomendado** — sem *Tentar de novo* (a regra da §3; repetir não muda a
   extensão) → errata **I1-E17** de faixa (a linha sem o botão); o estado é inalcançável no aceite, então a errata não
   tem candidata para cobrir — entra só como texto. (b) com *Tentar de novo* = `router.refresh()` (nova leitura SSR:
   comportamento novo).
9. **A imagem de partitura** (div. 741): **(a) recomendado** — a imagem entra no painel *Partitura* no lugar da página
   (o "papel": `claro-bg` + contorno `claro-line`), `alt` *partitura*; a falha de carga (`onError`) vira *"não foi
   possível abrir o arquivo — algo deu errado — tente de novo"* (a forma da §3 com `motivo.generico`; o `<img>` não
   dá a espécie) com *Tentar de novo* (recarrega a imagem) — frase composta, nova. (b) a falha segue muda (herança
   nomeada).
10. **As formas de `content_data`** (div. 742): **(a) recomendado** — tudo o que é dado continua na tela, no corpo mono
    do painel do tipo: `sections` → *nome*, *acordes*, *letra* em linhas, uma linha em branco entre seções; a lista
    com diagrama → nome e as linhas do diagrama; `progression` → *{seção}: {acordes}* ao fim; a `notation` da
    partitura → corpo mono no painel *Partitura*; os acordes da letra e da tab → um segundo painel *Cifra* abaixo. Os
    rótulos *"Chords:"*, *"Song Structure"* saem. (b) só a forma da folha (as outras somem — perde dado).
11. **A tab com acordes em texto** (div. 743): **(a) recomendado** — o mesmo `Array.isArray` dos outros dois
    componentes (o texto vai ao painel *Cifra*): deixa de derrubar a página. É mudança de comportamento (conserto),
    declarada. (b) fica como está: cai no `VIEW-erro-render` (agora dentro do corpo).
12. **A altura do visualizador de PDF** (div. 745): **(a) recomendado** — sem altura fixa (a folha): o painel mede a
    página; a rolagem vertical passa ao documento; a horizontal (zoom) fica no painel (`data-rolagem="painel"`). O
    editor mantém o `className` dele (`content-type-editor.tsx:57`, fora da lista do G-tok). (b) um token de altura
    (pergunta de pacote — o rito da div. 713).
13. **As frases novas** (divs. 747, 748): *Diminuir o zoom* · *Aumentar o zoom*; *nenhum* (capo) · *padrão (EADGBE)*
    (afinação); *{n}ª casa* (capo com número); os rótulos *compasso* · *criado* · *alterado* · *dificuldade* ·
    *álbum* · *gênero* · *tom* · *andamento* (+ *{x} BPM*) · *etiquetas* (as etiquetas como texto separado por
    *·*). Aprova?
14. **`SESSAO-nao-renovada`** (div. 751): **(a) recomendado** — a visualização desenha a linha **abaixo do cabeçalho**
    (a `LinhaDaTela`; o topo deixa de desenhar em `/content/<id>`, não em `/content/<id>/edit`); com outra falha na
    tela, vence a sessão (a regra da PR-9). (b) fica no topo até o fim do bloco.

**Token**: nenhum falta `[hipótese até o commit 2]` — `claro-*` (o papel), `zoom-padrao` (22), `entrelinha-tab` (1,45),
`fonte-mono-*`, `faixa-coluna-lateral` (320 em C; em B não existe: empilha), `tracking-label`, `tamanho-title-small`
estão em `app/styles/identidade.css`; o commit 2 pode precisar expor nomes no `tailwind.config.ts` (extra declarado,
sem tocar o pacote). Os percentuais da folha (60/40/85 %) não entram se a decisão da div. 746 ficar.

## 10. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | navegador | a folha por `file://` (`g-faixa-esperado.ts`); o Chromium fixado contra uma página local mínima na porta 3111 (pdf.js copiado de `node_modules`, página e cópia no *scratchpad*, fora da árvore), com **todas** as respostas do "arquivo" fabricadas por `route()` (`http://arquivo.invalid`) |
| executor | `next dev` | nenhum neste commit |
| — | `packages/identidade` | **não mudou** |
| — | código do app (`app/`, `components/`, `lib/`, `hooks/`) | **0 linha** — o commit 1 é gate, esperado e docs |
