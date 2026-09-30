# I1-PR-13 — anexos: superfície 8, setlists (`/setlists`) — a última tela do bloco

> **Bloco** I1 — identidade. **PR** de superfície 8, no molde das I1-PR-6…12 (`docs/ux/I1-PR12-anexos/README.md`: I1-D37 — o
> executor roda o "antes" e o aceite com o perfil; medição por estado; nó velho por componente × coincidência de texto).
> Branch `i1/pr13-setlists`, árvore `../octavia-i1-pr13`, criada de `origin/main` =
> `aa772dfd480e79f6e3e69d1178ec9353ff19d968` (`Merge pull request #347`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR12-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 17.9s using pnpm v10.28.0`. **Data**: 2026-09-30.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 846** (a PR-12 fechou em 845, §24 dela — o prompt presumia 844: div. 846).
> **Estado**: **commit 1 (gate-first)** — aguarda o aval (§10). Nenhuma linha de `app/`, `components/` (fora
> `components/setlists/__tests__/`), `lib/`, `hooks/` mudou.

| arquivo | o que é |
|---|---|
| `cn/setlists-defeitos-main.txt` | os **três defeitos** do N2 §10.3.5/.6 como teste de tela, sobre o código da `main` — **3 reprovam** (o CN desta PR) |
| `cn/setlists-escritas-antes.txt` | o que `/setlists` ESCREVE na `main` — método · caminho · corpo de seis roteiros (`tests/gates/i1-setlists-escritas.test.tsx`, gravado em `tests/gates/fixtures/setlists-escritas-antes.json`) |
| `cn/g-tok-main.txt` | G-tok (ii) com os 13 arquivos das setlists, sobre o código da `main` — **REPROVA 563** |
| `cn/g-faixa-esperado.txt` | a folha `8-setlists` medida → `tests/gates-web/esperado/8-setlists.json` (+ o controle: `7-upload` re-medido, byte a byte igual) |
| `cn/pnpm-test.txt` · `cn/gates-commit1.txt` | `pnpm test` (os 3 do CN reprovam; o resto verde) · G-tok (i), G-back, G-palco, `tsc`, lint, os dois vereditos do G-faixa |
| `cn/web-velho-que-sobra.txt` | o inventário do item 2.9 (§9): o que sobra de web velho depois das setlists |
| `cn/antes-setlists.txt` | o "antes" (§7): `tests/gates-web/medicoes/casca-efeito/antes/setlists.json`, cinco estados × três larguras, tudo fabricado |

---

## 1. Inventário `[medido]`

`wc -l`; importadores por `git grep -l` (fora `docs/`, `.planning/`, `.audit/`, `apps/native`, testes). **Destino** é a
proposta do commit 2, condicionada às decisões do §10.

### 1.1 A rota, o gerente, as peças e o que só as setlists usam

| arquivo | linhas | importa (o que pesa) | quem importa | destino |
|---|---|---|---|---|
| `app/setlists/page.tsx` | 14 | `requirePageUser` (o servidor expulsa sem sessão), `SetlistsPageClient` | a rota | **fica, intocado** (o enforcement do B1.2a) |
| `components/setlists-page-client.tsx` | 54 | `Casca` (PR-9), `useAuth`, `SetlistManager` por `dynamic` (*"Loading setlists..."*, `:10-17`); `isLoading` → *"Loading your setlists..."* **fora da casca** (`:30-39`); **`return null`** sem usuário (`:42-44`); `handleSelectSetlist` → `router.push('/setlist/{id}')`, rota inexistente, **sem chamador** (`:25-27`, div. 498); o invólucro velho `flex-1 bg-[#fffcf7]` (`:49`) | `app/setlists/page.tsx` | fica, reescrito: os carregamentos viram **um** *carregando as setlists…* na casca; a div. 498 e o invólucro saem |
| `components/setlist-manager.tsx` | 322 | **`toast` de `@/hooks/use-toast`** (9 chamadas, nenhuma aparece — H-I1-5), `ui/dialog`, `ui/button`, as cinco peças, `useSetlistData`, o serviço; os três defeitos (§2) | `setlists-page-client.tsx` | reescrito em partes < 150 (a lógica num hook); os toasts saem; cada falha vira estado |
| `components/setlist/index.ts` | 7 | reexporta as cinco peças e os tipos de `types/performance` | `setlist-manager.tsx` | sai com a pasta (as peças novas nascem em `components/setlists/`) |
| `components/setlist/setlist-list.tsx` | 131 | `ui/button`, lucide (`Plus`); os três blocos de carregar (`:42-53`), o erro com `window.location.reload()` (`:55-71`), o vazio (`:73-94`), o cabeçalho (`:99-113`); `onShareSetlist`/`onToggleFavorite` **nunca passados** | `index.ts` | reescrito |
| `components/setlist/setlist-card.tsx` | 181 | `ui/card·button·badge`, lucide (8); a duração estimada (`:39-50`); *Edit*/*Delete* só no hover (`:95`); *Recent* (`:155-162`), o brilho de "show futuro" (`:85-87`), a estrela de `is_favorite` (coluna que não existe — nunca `true`), *Share* (nunca passado) | `index.ts` | reescrito: o cartão da folha; o que não é desenhado e não se alcança morre (§10, item 19) |
| `components/setlist/setlist-details.tsx` | 282 | `ui/card·button·badge`, lucide (9); **o arrasto** (`:78-109`, `:215-219`, a alça `:222-224`) que chama um `onReorderSongs` **que só faz `console.log`** (`setlist-manager.tsx:263-266`, *TODO*); o remover passa **`song.content.id`** (`:266`, o defeito (a)) | `index.ts` | reescrito: `web.linhaMusica`, sem alça (decisão 27) |
| `components/setlist/setlist-dialog.tsx` | 214 | `ui/button·input·label·textarea·dialog`, lucide (`Loader2`); fecha **sempre** depois do `onSubmit` (`:87-95` — o gerente engole o erro, `setlist-manager.tsx:115-122`) | `index.ts` | reescrito: o diálogo da folha, que fica aberto na falha |
| `components/setlist/song-selection-dialog.tsx` | 252 | `ui/button·input·checkbox·scroll-area·badge·dialog`, lucide (4); *"Loading songs..."* inalcançável (`loading` nunca passado, `:162-166`); fecha **sempre** (`:100-113`) | `index.ts` | reescrito: o picker da folha |
| `hooks/use-setlist-data.ts` | 157 | `getUserSetlists`, `getUserContentPage` (`pageSize: 1000`); três textos de erro em inglês (`:52`, `:60`, `:84`, `:95`); a falha da biblioteca **engolida** (`:90-92`) | `setlist-manager.tsx`, 1 suíte | fica; o erro passa a espécie (o `status` aditivo, molde PR-9) |
| `lib/setlist-service.ts` | 330 | **cliente** (`fetch` com o token do Firebase) — **fora do núcleo do G-back** (`g-back-nucleo.txt` não o lista `[medido]`; `g-back-derivar.mjs:11-17`); os `Error` sem `status` | `setlist-manager.tsx`, `use-setlist-data.ts`, `lib/content-service-server.ts:12` (importa `getSetlistById` e **não o usa** — div. 864) | fica; **nenhum corpo muda** (gate byte a byte, §1.3); os `Error` passam a levar `status` (aditivo) |
| `types/performance.ts` | 27 | `SetlistSong`, `SetlistWithSongs` (com `is_favorite?`), `SetlistFormData` | **só** `components/setlist/index.ts` | os tipos mudam de casa com as peças; o arquivo morre se o `git grep` der 0 (declarado) |
| `hooks/use-toast.ts` | 194 | `@/components/ui/toast` | **só** `setlist-manager.tsx` e `components/ui/toaster.tsx` (que **ninguém** importa) | **morre** (I1-D26), com `components/ui/toaster.tsx`, `components/ui/toast.tsx` e `hooks/__tests__/use-toast.test.ts` |

**Compartilhados que ficam como estão**: `lib/content-service.ts` (`getUserContentPage`), `components/identidade/*` (a
casca, a `LinhaDeAviso`, a `linha-da-tela`, os controles, o ícone — reusados), `components/library/frases-lista.ts`
(`TIPOS`, *artista desconhecido*, a data curta), `components/editors/campos.tsx` (o campo). `types/setlist.ts` é do
**núcleo** (as rotas) e não é tocado.

**`use-toast` e quem mais o importa** (o pedido do §2.1 do prompt): além das setlists, **só** o `components/ui/toaster.tsx`,
órfão. Morre inteiro. O **outro** Toaster — o do sonner, montado em `app/layout.tsx:127` — ficou **sem nenhum emissor**
desde a PR-12 (`git grep` de `from "sonner"`: só `components/ui/sonner.tsx`): não é das setlists; vai à lista do §9 e à
decisão 18.

### 1.2 Os testes das setlists velhas `[medido]`

| suíte | casos | o que prende | destino no commit 2 |
|---|---|---|---|
| `hooks/__tests__/use-setlist-data.test.tsx` | 8 | o estado do hook; três casos prendem o **texto** do erro em inglês | fica; os três adaptam (o erro vira espécie) |
| `lib/__tests__/setlist-service.test.ts` | 4 | `getUserSetlists` (vazio sem usuário, a leitura, o `throw` no erro) | fica (o `status` é aditivo) |
| `hooks/__tests__/use-toast.test.ts` | — | o `reducer` do `use-toast` | **morre** com ele |
| (tela) | **0** | não há teste de tela do `setlist-manager` nem das cinco peças | nascem: os três do §2 e os estados da folha |

Fora do `pnpm test`: `tests/ux-audit/fase-d/e-setlists.spec.ts` e `set23-descricao.spec.ts` (Playwright sob demanda contra
preview/prod) acham os rótulos em inglês — **não tocados** (o molde da div. 837 da PR-12; herança).

### 1.3 O que `/setlists` escreve — o gate byte a byte `[medido]`

`tests/gates/i1-setlists-escritas.test.tsx` (o molde do `i1-upload-post`): monta a tela com o servidor falso
(`components/setlists/__tests__/servidor-falso.ts`), guarda **método · caminho · corpo** de cada escrita em seis roteiros e
compara com `tests/gates/fixtures/setlists-escritas-antes.json`, gravado **agora** sobre o código da `main`
(`CN_GRAVAR=1`; conferido duas vezes sem ele: `6 passed | 1 skipped`). `cn/setlists-escritas-antes.txt`:

```
criar (os cinco campos):  POST /api/setlists {"name":"Ensaio de sexta","description":"uma linha sobre esta setlist","performance_date":"2026-10-03","venue":"Blue Note","notes":"outras anotações"}
criar (só o nome):        POST /api/setlists {"name":"Ensaio de sexta","description":null,"performance_date":null,"venue":null,"notes":null}
editar:                   PUT /api/setlists/set-show {"name":"Show de sábado","description":null,"performance_date":null,"venue":"Blue Note","notes":null}
adicionar duas músicas:   POST /api/setlists/set-show/songs {"content_id":"c-asa","position":6,"notes":""}
                          POST /api/setlists/set-show/songs {"content_id":"c-batch2","position":7,"notes":""}
remover (a 2ª linha):     DELETE /api/setlists/songs/linha-2
apagar:                   DELETE /api/setlists/set-solo
```

No commit 2 só os seletores do roteiro mudam. O roteiro passa **longe** dos três defeitos (remove uma linha que veio do
servidor, sem bis; apaga uma setlist que existe): o que os defeitos mudam é o **alvo** de dois `DELETE` (o id da linha),
nunca um corpo — é a mudança de comportamento **por decisão** (I1-D9), provada pelos testes do §2.

O que o gate mostra e a PR **não** conserta: o `position` do corpo é calculado na tela (`max + 1`) e **a rota o ignora**
(`app/api/setlists/[id]/songs/route.ts`: *"aceita e SEMPRE recalculada"*); `notes: ""` vai em toda adição.

## 2. Os três defeitos — com linha e com teste que reprova na `main` `[lido + medido]`

As linhas do pre-check (`I1-PRECHECK.md` §12: `:207,214`, `:179`, `:140` → `:150-157`) são de `c57d81f`; o arquivo
encolheu 336 → 322 na I1-PR-3. **As de hoje** (div. 850):

| defeito | arquivo:linha (hoje) | o que faz |
|---|---|---|
| **(a) remove por `content.id`** | `components/setlist/setlist-details.tsx:266` (`onRemoveSong(song.content.id)`) → `components/setlist-manager.tsx:198` (`find(s => s.content.id === songId)`) e `:205` (`filter(s => s.content.id !== songId)`) | com a mesma música duas vezes (bis), o `find` escolhe a **1ª** ocorrência para o `DELETE` e o `filter` tira **todas** da tela: tela e banco divergem |
| **(b) id local falso** | `components/setlist-manager.tsx:171` (`id: \`${selectedSetlist.id}-${songId}\``) e a posição local `:158-160`, `:172`; a rota **devolve a linha** (`app/api/setlists/[id]/songs/route.ts`, o `201` com `data[0]`) e `lib/setlist-service.ts:283-284` a retorna — a tela a descarta em `:168` | remover a música recém-adicionada manda `DELETE /api/setlists/songs/{setlist}-{content}` — um id que não existe |
| **(c) apagar já apagada** | `components/setlist-manager.tsx:133` → `lib/setlist-service.ts:232-234` (`throw`) → o `catch` `:142-149` (toast não montado); o `setDeleteDialogSetlist(null)` de `:140` fica **depois** do `throw` | o diálogo *Delete Setlist* fica aberto, sem texto (H-I1-5, probe 4) |

`components/setlists/__tests__/setlists-defeitos.test.tsx` — um teste de tela por defeito, jsdom, o servidor falso; os
seletores aceitam o rótulo de antes e o de agora (a reprovação é do **comportamento**). Sobre o código da `main`
(`cn/setlists-defeitos-main.txt`):

```
(a) remover o bis: o DELETE leva o id da LINHA clicada e só ela sai da tela
AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
-   "DELETE /api/setlists/songs/linha-3",
+   "DELETE /api/setlists/songs/linha-1",

(b) a música adicionada fica com o id que a rota devolveu: removê-la chama esse id
AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
-   "DELETE /api/setlists/songs/linha-do-servidor-1",
+   "DELETE /api/setlists/songs/set-solo-c-asa",

(c) apagar a setlist já apagada (404): o diálogo fecha, a lista é relida e a tela diz por quê
AssertionError: expected <div role="dialog" …(7)>…(3)</div> to be null

 Test Files  1 failed (1)
      Tests  3 failed (3)
```

**Os três são código de tela** (a condição da I1-D9): nenhum pede mudança em `app/api/**`. O conserto do commit 2:
(a) a linha entrega o **id dela** e o filtro é por ele; (b) a tela guarda o `id` e o `position` que o `POST` devolveu;
(c) o 404 do `DELETE` fecha o diálogo, relê a lista (`reload`) e mostra *esta setlist já foi apagada* (`SET-ja-apagada`).

## 3. A matriz × a folha `[lido]`

A folha tem **21 `data-estado`**: 20 estados + `Tokens` (sem moldura). Todos os 20 têm C e B. O cabeçalho dela: *"fora
(inalcançáveis): 2ª guarda de auth, 'Authentication required', Share, 'Loading songs...' · reordenar (fora deste bloco)"*.

### 3.1 Os 20 estados

| estado da folha | nasce em (hoje) | o que a tela mostra hoje | o que muda |
|---|---|---|---|
| `SET` | `setlist-manager.tsx:238-277` + `setlist-list.tsx:96-131` + `setlist-card.tsx` + `setlist-details.tsx:111-282` | *Your Setlists* · *n setlist(s)* · *Create Setlist* · cartões (com *Edit*/*Delete* só no hover) \| o painel com o nome, a descrição, data · local · *n songs* · duração, *Edit*, *Songs* + *Add Songs*, as linhas com **alça**, número, título, artista, nota, o tipo em inglês e o remover só no hover | a folha: 2 : 3 em C, empilha em B; o cartão e a linha da folha; **sem alça**; remover sempre visível |
| `SET-nenhuma` | `setlist-manager.tsx:268-274` | *"Select a setlist to view its details"* numa caixa da altura da tela | *escolha uma setlist para ver os detalhes* (sem caixa) |
| `SET-carregando` | `setlists-page-client.tsx:10-17` (o `dynamic`), `:30-39` (`isLoading`, **fora da casca**), `:42-44` (**`return null`**); `setlist-manager.tsx:223-232` (*"Loading..."*), `:234-236` (**`return null`**) | três textos e dois brancos | **um**: o título, *Nova setlist* e *carregando as setlists…*, na casca |
| `SET-carregando-dados` | `setlist-list.tsx:42-53` | três blocos de 192 px pulsando, **sem** título nem botão | três blocos de `web.linhaLista` (80), contorno `line`, sem pulsar, **com** o título e *Nova setlist* |
| `SET-vazio` | `setlist-list.tsx:73-94` | *No setlists yet* · o apoio · *Create Your First Setlist*, sem título | o título, *Nova setlist*, *nenhuma setlist ainda* · o apoio · *Criar a primeira setlist* (contorno `accentInk`) |
| `SET-erro` | `use-setlist-data.ts:51-54`, `:80-85`, `:93-95` → `setlist-list.tsx:55-71` | *Error loading setlists* + *"Couldn't load setlists. Check your connection and try again."* (para rede, 401, 429 e 5xx) + *Try Again* = **`window.location.reload()`** | a `LinhaDeAviso` abaixo do título, o motivo pela espécie, *Tentar de novo* (rede, 5xx) |
| `SET-criar` | `setlist-dialog.tsx:104-213` | *Create New Setlist* + uma frase de apoio · cinco campos (a descrição e as notas em `textarea` de 3 e 2 linhas) · *Cancel* · *Create Setlist* | o diálogo da folha (`folha.largura`, topo `folha.topo`): os cinco campos em `touch.min`, duas colunas em C (data \| local), *Cancelar* · *Criar* |
| `SET-criar-validacao` | `setlist-dialog.tsx:82-84`, `:102`, `:204` | o botão cinza, sem dizer por quê | + *a setlist precisa de um nome* (**N7**) ao lado do *Criar* inativo |
| `SET-criar-salvando` | `setlist-dialog.tsx:207` | um spinner no botão | *Criando…* (inativo) |
| `SET-criar-erro` | `setlist-manager.tsx:115-122` (o `catch` engole) → `setlist-dialog.tsx:88-90` (**fecha**) | **o diálogo fecha como se tivesse dado certo**; nada aparece | o diálogo fica, o digitado fica; a `LinhaDeAviso` com o motivo, a N2 (*o que você escreveu continua aqui*) e *Tentar de novo* |
| `SET-apagar` | `setlist-manager.tsx:303-320` | *Delete Setlist* · *Are you sure…* · *Cancel* · *Delete* | *Apagar setlist* · *apagar “{nome}”? não dá para desfazer* · *Cancelar* · *Apagar* (contorno `errorInk`) |
| `SET-apagar-erro` | `setlist-manager.tsx:142-149` | **o diálogo fica aberto e mudo** | a `LinhaDeAviso` dentro do diálogo, **sem** *Tentar de novo* (decisão 25) |
| `SET-ja-apagada` | — (o mesmo `catch`) | **o diálogo fica aberto e mudo**; a setlist segue na lista (o defeito (c)) | o diálogo fecha, a lista é relida, *esta setlist já foi apagada* abaixo do título, sem ação |
| `SET-sem-musicas` | `setlist-details.tsx:169-185` | *No songs yet* · o apoio · um **segundo** *Add Songs* | *nenhuma música ainda* · *adicione músicas da biblioteca*; o *Adicionar músicas* é o do cabeçalho |
| `SET-adicionar` | `song-selection-dialog.tsx:118-251` | *Add Songs to Setlist* + apoio · a busca · *Select all (n songs)* · as linhas (caixa, título, artista, **o tipo**) numa área de rolagem · *Cancel* · *Add n Song(s)* | *Adicionar a {nome}* · a busca · *Selecionar todas ({n})* · as linhas (caixa, título, artista) · *Cancelar* · *Adicionar {n}* |
| `SET-adicionar-vazio` | `song-selection-dialog.tsx:167-179` | *No songs available* / *Add some songs to your library first.* — **também quando todas já estão na setlist** e **quando a leitura da biblioteca falhou** (`use-setlist-data.ts:90-92`) | *nenhuma música disponível* · o apoio; a variante **N10** quando todas já estão; a falha da leitura é a decisão 5 |
| `SET-adicionar-busca` | idem | *No matching songs* / *Try adjusting your search terms.* | *nada encontrado* · *mude a busca* |
| `SET-adicionar-enviando` | `song-selection-dialog.tsx:243-247` | um spinner no botão | *Adicionando…* (inativo) |
| `SET-adicionar-erro` | `setlist-manager.tsx:184-191` (engole) → `song-selection-dialog.tsx:105-107` (**fecha** e zera a seleção) | **o diálogo fecha como se tivesse dado certo**; o que entrou antes da falha fica no banco e a tela não mostra | o diálogo fica com a `LinhaDeAviso` (`set.erro.adicionar` simples, decisão 26) e *Tentar de novo* |
| `SET-remover-erro` | `setlist-manager.tsx:212-219` | nada | a `LinhaDeAviso` abaixo do cabeçalho da setlist, *Tentar de novo* (rede, 5xx) |

### 3.2 Onde cada falha é engolida (o toast não montado — div. 491, H-I1-5)

| arquivo:linha | o que faz |
|---|---|
| `setlist-manager.tsx:115-122` | criar e salvar: `console.error` + `toast` (o `<Toaster>` do shadcn nunca é montado) — **e não relança**, então o `SetlistDialog` fecha (`setlist-dialog.tsx:88-90`) |
| `setlist-manager.tsx:142-149` | apagar: idem; o diálogo só fecha no sucesso (`:140`) — fica aberto, mudo |
| `setlist-manager.tsx:184-191` | adicionar: idem; **e não relança** — o picker fecha e zera a seleção (`song-selection-dialog.tsx:105-107`). O laço é em série (`:162-176`): a falha no meio deixa as primeiras gravadas |
| `setlist-manager.tsx:212-219` | remover: idem |
| `setlist-manager.tsx:93`, `:112`, `:141`, `:181-183`, `:211` | os cinco **sucessos** também são toasts que ninguém vê — a lista já mostra (decisão 7: sem frase) |
| `lib/setlist-service.ts:59-65`, `:154-157`, `:196-198`, `:232-234`, `:278-281`, `:320-323` | o `status` se perde em todas (`Error` com a mensagem do servidor em inglês, ou `Failed to … : {status}` no texto) |
| `hooks/use-setlist-data.ts:80-85` | a falha da carga vira **uma frase** (*"Couldn't load setlists. Check your connection…"*) para toda espécie |
| `hooks/use-setlist-data.ts:90-92` | a falha da **biblioteca** é só `console.error` — o picker mostra *"No songs available"* (erro vira vazio; div. 852) |

### 3.3 O reordenar `[lido + medido]`

A UI de arrasto de hoje **não grava nada**: `setlist-details.tsx:99-109` (`handleDrop`) chama `onReorderSongs`, que o gerente
implementa como `console.log('Reorder song', …)` sob um *TODO* (`setlist-manager.tsx:263-266`); a lista volta à ordem de
antes ao soltar. A rota `PUT /api/setlists/[id]/songs/order` existe e **não tem chamador no web**
(`git grep "songs/order" -- components hooks lib app ':!app/api'` → só o comentário de `lib/api-schemas.ts:359`; o nativo a
usa). **Morre com a decisão 27**: o estado `draggedSongId`, os quatro manipuladores (`handleDragStart/End/Over/Drop`), o
`draggable` e os quatro `onDrag*` da linha, a alça (`GripVertical`), a prop `onReorderSongs` e o `console.log`. A rota fica
sem chamador — **herança D** (o reordenar com persistência).

### 3.4 Código sem estado · estado sem código

- **Estado da folha sem código**: `SET-criar-erro`, `SET-apagar-erro`, `SET-ja-apagada`, `SET-adicionar-erro`,
  `SET-remover-erro` (as cinco falhas mudas), o motivo do *Criar* inativo (N7), *Criando…*/*Adicionando…*, a variante N10,
  o motivo por espécie em `SET-erro`.
- **Código sem estado na folha**: (a) **editar** — a nota de `SET-criar` diz *"o mesmo diálogo com 'Editar setlist' e
  'Salvar'"*, sem seção (decisão 20); (b) **a data e o local** no cartão e no cabeçalho (`setlist-card.tsx:166-177`,
  `setlist-details.tsx:128-140`) — as três setlists da folha não têm nem um nem outro (decisão 7); (c) **a nota da música**
  na linha (`setlist-details.tsx:243-250`; decisão 8); (d) *'Untitled'* no título vazio (`setlist-details.tsx:236`,
  `song-selection-dialog.tsx:206`; decisão 9); (e) o tipo na linha do picker e a busca por tipo em inglês
  (`song-selection-dialog.tsx:74`; decisão 11); (f) a falha da leitura da biblioteca (div. 852; decisão 5); (g) o 404 de
  editar, adicionar e remover (div. 860; decisão 3); (h) a falha **a meio** da adição e o que o *Tentar de novo* repete
  (div. 863; decisão 2); (i) `navigator.onLine === false` (`use-setlist-data.ts:51-54`) — vira `SET-erro` com *sem conexão*;
  (j) a recarga ao voltar à aba depois de 30 s (`:121-146`), que põe `loading` e troca a lista pelos blocos — fica como está
  (div. 871); (k) *Recent*, o brilho de show futuro, a estrela, *Share* (decisão 19).
- **Controle da folha sem código**: *Nova setlist* desenhado em `SET-carregando`, `-carregando-dados` e `-erro` — hoje o
  botão só existe com a lista carregada ou vazia (div. 866; decisão 15).

### 3.5 O que a folha escreve e não bate com ela mesma (div. 854)

Cópias entre seções, como a linha do arquivo do `UP-criar` (PR-12, I1-E27): `SET-ja-apagada` diz *3 setlists* com **dois**
cartões; `SET-sem-musicas` tem o cartão de *Show padrão* com *8 músicas · 32 min* e o cabeçalho com *0 músicas*; `SET` e os
estados sobre ele dizem *8 músicas · 32 min* com **cinco** linhas; `SET-adicionar` diz *Selecionar todas (5)* com **quatro**
linhas. A fixture do aceite não consegue satisfazer os dois lados de cada par — decisão 12.

## 4. As frases — a §5.9 (+ N7, N10, §5.1) × o inventário `[lido]`

| chave (§5.9 / §5.10) | texto | de hoje | onde hoje |
|---|---|---|---|
| `set.titulo` | Setlists | "Your Setlists" | `setlist-list.tsx:101` |
| `set.contagem` | {n} setlists | "{n} setlist(s)" | `:103` |
| `set.nova` | Nova setlist | "Create Setlist" | `:111` |
| `set.musicas` | {n} músicas / 1 música | "{n} song(s)" | `setlist-card.tsx:146`, `setlist-details.tsx:143` |
| `set.editar` / `set.apagar` | Editar a setlist {nome} / Apagar a setlist {nome} (nomes acessíveis) | "Edit setlist" / "Delete setlist" | `setlist-card.tsx:117`, `:129` |
| `set.adicionar` | Adicionar músicas (B: Adicionar; nome acessível: Adicionar músicas a {nome}) | "Add Songs" | `setlist-details.tsx:182`, `:197` |
| `set.remover` | Remover {título} da setlist (nome acessível) | "Remove song" | `:267` |
| `set.carregando` | carregando as setlists… | "Loading your setlists..." · "Loading setlists..." · "Loading..." · `null` ×2 | `setlists-page-client.tsx:35`, `:14`; `setlist-manager.tsx:228`, `:235` |
| `set.vazio` / `.apoio` / `.acao` | nenhuma setlist ainda / crie a primeira para organizar as músicas do show / Criar a primeira setlist | "No setlists yet" / "Create your first setlist to organize songs for your performances." / "Create Your First Setlist" | `setlist-list.tsx:80-90` |
| `set.erro` | não foi possível carregar as setlists — {motivo} | "Error loading setlists" + "Couldn't load setlists. Check your connection and try again." | `setlist-list.tsx:59`; `use-setlist-data.ts:52`, `:84` |
| `set.nenhuma` | escolha uma setlist para ver os detalhes | "Select a setlist to view its details" | `setlist-manager.tsx:271` |
| `set.form.*` | Nova setlist · Editar setlist · Nome · Descrição · Data do show · Local · Notas · Criar · Salvar · Criando… | "Create New Setlist" · "Edit Setlist" · "Setlist Name *" · "Description" · "Performance Date" · "Venue" · "Notes" · "Create Setlist" · "Update Setlist" · (spinner) | `setlist-dialog.tsx:110-208` |
| `set.form.sem-nome` (**N7**) | a setlist precisa de um nome | — (o botão só fica cinza) | `:102`, `:204` |
| `set.erro.criar` / `.salvar` | não foi possível criar a setlist / salvar a setlist — {motivo} | "Failed to save setlist" (toast invisível) | `setlist-manager.tsx:118` |
| `digitado-fica` (**N2**) | o que você escreveu continua aqui | — | — (a folha a escreve em `SET-criar-erro`) |
| `set.apagar.titulo` / `.pergunta` | Apagar setlist / apagar “{nome}”? não dá para desfazer | "Delete Setlist" / "Are you sure you want to delete "{nome}"? This action cannot be undone." | `setlist-manager.tsx:306-308` |
| `set.erro.apagar` | não foi possível apagar a setlist — {motivo} | "Failed to delete setlist" (toast invisível) | `:145` |
| `set.ja-apagada` | esta setlist já foi apagada | "Failed to delete setlist: 404" (toast invisível) | `lib/setlist-service.ts:233` |
| `set.sem-musicas` / `.apoio` | nenhuma música ainda / adicione músicas da biblioteca | "No songs yet" / "Add songs from your library to build this setlist." | `setlist-details.tsx:173-175` |
| `set.picker.titulo` | Adicionar a {nome} | "Add Songs to Setlist" | `song-selection-dialog.tsx:122` |
| `set.picker.busca` | buscar por título, artista ou tipo | "Search by title, artist, or content type..." | `:133` |
| `set.picker.todas` | Selecionar todas ({n}) | "Select all ({n} songs)" | `:155` |
| `set.picker.ok` | Adicionar {n} · Adicionando… | "Add {n} Song(s)" (+ spinner) | `:247` |
| `set.picker.vazio` / `.apoio` | nenhuma música disponível / adicione músicas à biblioteca primeiro | "No songs available" / "Add some songs to your library first." | `:171`, `:176` |
| `set.picker.todas-ja` (**N10**) | todas as músicas da biblioteca já estão nesta setlist | (a mesma "No songs available") | `:171` |
| `set.picker.busca-vazia` | nada encontrado / mude a busca | "No matching songs" / "Try adjusting your search terms." | `:171`, `:175` |
| `set.erro.adicionar` | não foi possível adicionar as músicas — {motivo} | "Failed to add songs" (toast invisível) | `setlist-manager.tsx:187` |
| `set.erro.remover` | não foi possível remover “{título}” — {motivo} | "Failed to remove song" (toast invisível) | `:215` |
| `acao.cancelar` · `acao.tentar` · `motivo.*` (§5.1) | Cancelar · Tentar de novo · os de sempre | "Cancel" ×3 · "Try Again" | `setlist-manager.tsx:313`; `setlist-dialog.tsx:200`; `song-selection-dialog.tsx:239`; `setlist-list.tsx:67` |
| (os tipos, PR-9 `TIPOS`) | Letra · Cifra · Tab · Partitura | "Lyrics" · "Chords" · "Tab" · "Sheet" | `setlist-details.tsx:45-53` |

**Frases que a folha escreve e a §5.9 não lista** (div. 855; decisão 13):

| texto na folha | onde | hoje | proposta |
|---|---|---|---|
| *4 h 6 min* · *32 min* · *4 min* (a duração estimada, no cartão) e *{n} músicas · {duração}* (o cabeçalho) | `SET` e os estados sobre ele | "{h}h {m}m" / "{m}m" (`setlist-card.tsx:46-50`) | **nova** a forma (*{h} h {m} min* · *{m} min*); a conta é a de hoje |
| *0 músicas* (sem duração) | `SET-sem-musicas` | "0 songs" + "0m" | a forma: sem música não há duração |
| *ex.: acústico no café* · *uma linha sobre esta setlist* · *dd / mm / aaaa* · *ex.: Blue Note* · *outras anotações* (placeholders) | `SET-criar*` | "e.g., Coffee Shop Acoustic Set" · "Brief description of this setlist..." · — · "e.g., The Blue Note" · "Any additional notes about this setlist..." | **novas** (a da data é o formato nativo do campo — não é frase nossa) |
| *Adicionar* (o botão do picker sem nada marcado) | `SET-adicionar-vazio`, `-busca` | "Add 0 Songs" | a forma de `set.picker.ok` com zero |
| *Adicionar 3 músicas a Show padrão* (nome acessível, na nota) | `SET-adicionar` | — | **nova** (nome acessível) |
| *artista desconhecido* | `SET-adicionar` | (nada: a linha sem artista só tem o título) | reuso da PR-9 (`lib.artista.desconhecido`) |
| *Editar* (o botão do cabeçalho da setlist) · *Apagar* (o do diálogo) | `SET`, `SET-apagar` | "Edit" · "Delete" | reuso da PR-9 (`lib.menu.editar`, `lib.apagar.confirmar`) |

**Sem desenho na folha, precisam de frase**: *Salvando…* no editar (a §5.9 só lista *Criando…*; reuso de `up.meta`); o
título vazio (*'Untitled'* hoje — proposta: ***sem título***, nova); a data e o local no cartão e no cabeçalho (proposta: a
data curta da PR-9, *3 out 2026*; decisão 7).

**Frases de hoje sem destino** (morrem): *"Update your setlist information."* · *"Create a new setlist to organize your
songs for performances."* · *"Select songs from your library to add to this setlist."* (os apoios dos diálogos); *"Songs"*
(o subtítulo da lista de músicas); *"Recent"*; *"Error loading setlists"* (o título do erro — a nota de `SET-erro`); os
cinco toasts de sucesso e os quatro de falha; *"An error occurred"*; *"Loading songs..."* e *"Authentication required"*
(inalcançáveis — o cabeçalho da folha); *"Failed to load data"* (→ `motivo.generico`); o `*` do *"Setlist Name \*"*.

**Dado em inglês que não é frase** (div. 853): a rota `GET /api/setlists` **sintetiza** *"Unknown Artist"*, *"Unknown
Title"* e *"Unknown Type"* no content de cada linha quando o campo é vazio (`app/api/setlists/route.ts:67-69`; o mesmo na
resposta do `PUT`, `app/api/setlists/[id]/route.ts:275-277` — núcleo). A
música sem artista aparece como *Unknown Artist* na linha da setlist e como *artista desconhecido* no picker (que lê
`/api/content`, onde o artista é `null`). Decisão 6.

**Inglês em `.ts` que o G-tok não lê** (a div. 828 da PR-12): as mensagens de `Error` de `lib/setlist-service.ts` e
as três do `use-setlist-data.ts` — no commit 2 nenhuma chega à tela (a tela escolhe a frase pela espécie).

## 5. G-tok cresce `[medido]`

`scripts/gates-web/g-tok-arquivos.txt` ganha os **13** arquivos do §1.1 (107 → 120). O `components/setlists-page-client.tsx`
**nunca esteve na lista** — na PR-9 só o invólucro dele mudou (div. 868). Na `main` (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 120 · literais de identidade acusados: 493 · toasts: 12 · imports de ui: 21 · textos examinados: 60 · isentos de inglês (scripts/gates-web/g-tok-sem-ingles.txt): 1 · vocabulário: 133 · isenções: 9

G-tok: REPROVA — 563 ocorrência(s)
# exit: 1
```

Por classe: 158 [cor] · 128 [valor arbitrário] · 89 [espaçamento] · 75 [tamanho] · 30 [inglês, texto JSX] · 24 [tamanho de
fonte] · 21 [import de ui] · 12 [toast] · 10 [borda] · 9 [raio] · 7 [inglês, atributo].
Por arquivo: `setlist-details.tsx` 137 · `song-selection-dialog.tsx` 115 · `setlist-card.tsx` 100 · `setlist-list.tsx` 71 ·
`setlist-dialog.tsx` 68 · `setlist-manager.tsx` 42 · `setlists-page-client.tsx` 25 · `hooks/use-toast.ts` 4 ·
`hooks/use-setlist-data.ts` 1; **0** em `app/setlists/page.tsx`, `components/setlist/index.ts`, `lib/setlist-service.ts`,
`types/performance.ts`. Os 107 de antes seguem **0** (`G-tok: PASSA` antes de a lista crescer); o (i) (a folha) segue
**PASSA** (`achados do conferir: 26 · cobertos: 26 · descobertos: 0 · erratas: 9 · órfãs: 0`). O job `g-tok` do CI fica
vermelho neste commit — é o gate-first.

## 6. Esperado da folha `[medido]`

`tests/gates-web/esperado/8-setlists.ancoras.json` (novo): as duas da casca (as das folhas 4–7); as **caixas dos cinco
campos** do diálogo pelo rótulo do irmão anterior (*Nome* · *Descrição* · *Data do show* · *Local* · *Notas* →
`campo-nome` · `-descricao` · `-data` · `-local` · `-notas`); e a **busca do picker** pelo seletor (a filha direta do
diálogo com 48 de altura → `picker-busca` — o texto dela é o placeholder ou *xablau*). `cn/g-faixa-esperado.txt`:

```
$ pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 8-setlists
8-setlists: 130 caixa(s) de campo ancorada(s) · 21 seções · 20 com C e B · nós C 888 · nós B 888 → tests/gates-web/esperado/8-setlists.json
  ✗ Tokens: sem a moldura C B
# exit: 0
```

130 = 80 da casca (2 × 20 estados × C e B) + 40 dos cinco campos (`SET-criar`, `-validacao`, `-salvando`, `-erro`) + 10 da
busca do picker (os cinco `SET-adicionar*`). Controle: `7-upload` re-medido com o mesmo script sai **byte a byte igual**.
Nós por estado (C = B): `SET` 50 · `-nenhuma` 21 · `-carregando` 11 · `-carregando-dados` 10 · `-vazio` 13 · `-erro` 12 ·
`-criar` 63 · `-criar-validacao` 64 · `-criar-salvando` 63 · `-criar-erro` 66 · `-apagar` 54 · `-apagar-erro` 55 ·
`-ja-apagada` 19 · `-sem-musicas` 27 · `-adicionar` 64 · `-adicionar-vazio` 57 · `-adicionar-busca` 57 ·
`-adicionar-enviando` 64 · `-adicionar-erro` 66 · `-remover-erro` 52. (A 1ª medição ancorou 142: o seletor da busca pegava
também a `LinhaDeAviso` e a linha *Selecionar todas*, de `min-height:48px` — consertado antes do commit, div. 865.)

## 7. O "antes" `[medido]`

`cn-main/setlists.json` (o estado `base`, três larguras, as setlists **reais** da conta) e o `casca-efeito/setlists.json`
da PR-9 (rodada 2: o corpo velho sob a casca nova, com a **largura liberada** dos 4 nós em 1138) já existem. O "antes"
desta PR é **fabricado**: `scripts/gates-web/g-faixa-setlists.ts` (novo) responde no navegador a `GET /api/setlists` (as
três setlists da folha: *Estresse* com 60 músicas e 4 h 6 min, *Show padrão* com as cinco linhas da folha + três, *Solo*
com uma) e a `GET /api/content` (as do show + as quatro do picker da folha), e **toda** escrita a `/api/setlists*`.
Cinco estados do web velho, com os seletores de hoje: `base-lista`, `base-detalhe`, `base-formulario`, `base-dialogo`
(o *Delete Setlist*), `base-picker`. O `base` da I1-PR5 (leitura real) **sai** do instrumento (div. 870).

**A rodada** `[executor, I1-D37, 2026-09-30, 13:45Z]` — `tests/gates-web/medicoes/casca-efeito/antes/setlists.json`, com o
perfil (`G_FAIXA_SEM_JANELA=1`), contra o `pnpm dev` da 3000 (o de `../octavia-i1-pr12`, `bd77cd7` — **a mesma árvore**
da `main` `aa772df`; div. 849). `cn/antes-setlists.txt`:

```
rodada 2026-09-30T13:45:13.395Z · commit aa772dfd480e79f6e3e69d1178ec9353ff19d968+sujo · base http://localhost:3000 · chromium 140.0.7339.16
base-lista        1138: nós 30 · (e) 0 · (b) 0   711: nós 30 · (e) 0 · (b) 0   411: nós 30 · (e) 0 · (b) 0 · (d′) 2
base-detalhe      1138: nós 68 · (e) 0 · (b) 0   711: nós 68 · (e) 0 · (b) 0   411: nós 68 · (e) 0 · (b) 6 · (d′) 3
base-formulario   1138: nós 46 · (e) 0 · (b) 0   711: nós 46 · (e) 0 · (b) 0   411: nós 46 · (e) 0 · (b) 0 · (d′) 4
base-dialogo      1138: nós 35 · (e) 0 · (b) 0   711: nós 35 · (e) 0 · (b) 0   411: nós 35 · (e) 0 · (b) 0 · (d′) 2
base-picker       1138: nós 90 · (e) 0 · (b) 0   711: nós 90 · (e) 0 · (b) 0   411: nós 90 · (e) 0 · (b) 6 · (d′) 3
1138 requests a /api: GET /api/setlists → fabricado 200 ×5 · GET /api/content → fabricado 200 ×5 · GET /api/profile → 200 ×5 · POST /api/auth/session → 200 ×5 (+1 FALHA) · prodAbortados 0
 711 requests a /api: GET /api/setlists → fabricado 200 ×5 · GET /api/content → fabricado 200 ×5 · GET /api/profile → 200 ×5 (+1 FALHA) · POST /api/auth/session → 200 ×6 · prodAbortados 0
 411 requests a /api: GET /api/setlists → fabricado 200 ×5 · GET /api/content → fabricado 200 ×5 · GET /api/profile → 200 ×6 · POST /api/auth/session → 200 ×6 · prodAbortados 0
```

`scrollWidth` = viewport nos 15. **O web velho das setlists já tem (b) em 411**: 6 em `base-detalhe` e 6 em `base-picker`
(a de trás) — *conteúdo cortado no próprio nó*, os títulos e o artista das linhas com `truncate`
(`setlist-details.tsx:235`, `:239`); em C e B, (e) 0 e (b) 0. Os não-`GET` a `/api/*`: só o `POST /api/auth/session` (o
cookie); **nenhuma escrita às setlists saiu nem foi tentada** (nenhum botão de escrita é clicado). As duas `FALHA` são
requests cortados pela recarga do controle positivo (o `location.reload()` do medidor), como nas rodadas anteriores. Lidos
de verdade: `/api/profile` e o `securetoken`. O `commit` sai `aa772df…+sujo` porque os arquivos do commit 1 (testes,
instrumento, docs) estavam na árvore sem commit — **nenhum arquivo de `app/`, `components/` (fora `__tests__`), `lib/`,
`hooks/` difere** de `aa772df` (o caso das divs. 731, 804 e 842; div. 872). Uma fumaça antes, só em 1138, para a pasta de
rascunho (13:33Z, 6 cargas), saiu igual.

## 8. Como o aceite alcança cada estado sem escrever

`/setlists` é **cliente** (o SSR só confere a sessão, `app/setlists/page.tsx:12`). **fab.** = `page.route()` respondendo
no navegador com `x-g-faixa: fabricado`; **segurado** = o `route()` não responde durante a medição (`fabricado sem
resposta` no log); **abortado** = `route.abort()` (a rede que cai). A barreira do medidor aborta e **reprova** qualquer
`POST`/`PUT`/`DELETE` a `/api/*` que não tenha sido fabricado (fora `/api/auth/session`). As duas leituras
(`GET /api/setlists`, `GET /api/content`) são **sempre** fabricadas: nenhuma setlist nem content da conta é lido.

| estado | como alcançar | escreve? |
|---|---|---|
| `SET-carregando` | o pedaço do `dynamic` (`components_setlist-manager` no nome do chunk — `[hipótese]`, como o do upload, que casou) **segurado** | 0 |
| `SET-carregando-dados` | `GET /api/setlists` **segurado** | 0 |
| `SET-vazio` | `GET /api/setlists` fab. `[]` | 0 |
| `SET-erro` | `GET /api/setlists` **abortado** (*sem conexão*, o motivo da folha); 401, 429 e 5xx no Vitest | 0 |
| `SET-nenhuma` | as três setlists; nenhuma aberta | 0 |
| `SET` | + o clique no cartão de *Show padrão* | 0 |
| `SET-sem-musicas` | *Show padrão* fab. sem músicas, aberta | 0 |
| `SET-criar` | *Nova setlist* + *Ensaio de sexta* digitado (local) | 0 |
| `SET-criar-validacao` | *Nova setlist*, o nome vazio | 0 |
| `SET-criar-salvando` | `SET-criar` + *Criar*, `POST /api/setlists` **segurado** | 0 |
| `SET-criar-erro` | idem, o `POST` **abortado** (*sem conexão*, o motivo da folha); 400, 401, 429, 5xx no Vitest | 0 |
| `SET-apagar` | *Show padrão* aberta + o *Apagar* do cartão dela | 0 |
| `SET-apagar-erro` | + *Apagar*, `DELETE /api/setlists/{id}` fab. **500** (*falha no servidor*, o da folha) | 0 |
| `SET-ja-apagada` | + *Apagar*, o `DELETE` fab. **404** e a 2ª `GET /api/setlists` fab. sem *Show padrão* | 0 |
| `SET-adicionar` | *Show padrão* aberta + *Adicionar músicas* + três marcadas | 0 |
| `SET-adicionar-vazio` | `GET /api/content` fab. vazia (a biblioteca vazia); **N10**: a biblioteca só com as do show (decisão 20) | 0 |
| `SET-adicionar-busca` | + *xablau* na busca | 0 |
| `SET-adicionar-enviando` | três marcadas + *Adicionar 3*, `POST …/songs` **segurado** | 0 |
| `SET-adicionar-erro` | idem, o `POST` fab. **500**; **a meio** (201, depois 500) no Vitest | 0 |
| `SET-remover-erro` | *Show padrão* aberta + *Remover Construção…*, `DELETE /api/setlists/songs/{id}` **abortado** | 0 |
| `SESSAO-nao-renovada` | o `POST /api/auth/session` fab. 500 + um `visibilitychange` (o molde da PR-9) — a linha da tela abaixo do título; sem seção na folha 8 (só (e)/(b)) | 0 |
| `base-*` (5) | os do §7, com os seletores novos (o "depois" da `casca-efeito`) | 0 |

**Tudo é fabricável**: nenhuma escrita sai; lidos de verdade só a sessão (`/api/profile`, o `securetoken`).

**Cota**: 26 estados × 3 larguras + o controle ≈ **81 cargas com sessão**, acima das 60 em 15 min do `/api/profile`
(`lib/user-rate-limit.ts:54`): **duas rodadas** — C e B (≈ 54), 15 min, A (≈ 27) — e por estado só para repetir o que sair
NÃO ALCANÇADO (o molde da PR-12).

**Inalcançáveis com sessão** (e a prova prevista): `SET-carregando` pelo `isLoading` do Firebase e pelo "sem usuário" (a
mesma tela do pedaço segurado) — pré-verificação sem sessão + Vitest; as variantes de motivo (401, 429, 400, 5xx) de cada
falha — Vitest, uma por status; o editar e o salvar com erro — decisão 20.

## 9. O que sobra de web velho depois das setlists — o inventário do encerramento `[medido]`

`cn/web-velho-que-sobra.txt`, sobre `aa772df`. Dos 199 arquivos `.ts`/`.tsx` de `app/` (sem as rotas de API),
`components/`, `hooks/`, `lib/`, `contexts/` e `types/` (sem testes), **120** estão em `g-tok-arquivos.txt`; dos **79** de
fora, 35 são `components/ui/*` e 44 são o resto — o G-tok (ii) rodado sobre esses 44 acusa **70**:

| o que sobra | onde | medido |
|---|---|---|
| **o limite de erro global** | `lib/error-boundary.tsx` (de `app/layout.tsx:11`, `:124`) | 34: `ui/button`, lucide (`AlertTriangle`), cores e espaçamentos literais e **4 frases em inglês** (*Something went wrong* · *Error Details (Development Only)* · *Try again* · *Reload page*). A folha não o desenha (resposta 30: *"404 e exceções ficam na tela padrão, sem desenho"*) |
| **o Toaster do sonner, sem emissor** | `app/layout.tsx:10`, `:127` → `components/ui/sonner.tsx` | `git grep` de `toast(`/`toast.x(` fora das setlists → **0**; o `<Toaster>` segue montado. E o `themeColor: "#f59e0b"` do layout (`:27`) |
| **`components/ui/*`** | 35 arquivos | hoje têm importador de fora: 11 (os 10 das setlists + `sonner`); **depois das setlists: 2** — `button` (só o `error-boundary`) e `sonner` (só o layout). Os outros **33** ficam órfãos (24 já não têm importador nenhum hoje) |
| **`lucide-react`** | fora de `components/ui` | depois das setlists: `lib/error-boundary.tsx` e `types/content.ts` |
| **`types/content.ts`** | `getContentTypeIcon`, `getContentTypeColors` | 33 (classes de cor montadas em texto, lucide); sem importador (div. 839 da PR-12); o `safelist` de cores do `tailwind.config.ts` que os servia |
| **um literal** | `components/auth/aviso-de-sessao.tsx:38` | `p-2` (a linha de sessão do topo — depois desta PR só as rotas públicas a usam; decisão 17) |
| **sem importador** | `contexts/sidebar-context.tsx`, `hooks/use-navigation-actions.ts` (+ os testes deles) | a casca velha da PR-9 |
| **inglês em `.ts`** (o G-tok não lê — div. 828) | `lib/setlist-service.ts`, `lib/content-service.ts`, `hooks/useAddContentLogic.ts`, `hooks/useMetadataForm.ts`, `components/add-content/upload-to-storage.ts` | mensagens de `Error` que não chegam à tela; o valor gravado *"Unknown Artist"* (herança D) |
| **inglês que vem do servidor** | `app/api/setlists/route.ts:67-69` | *Unknown Artist* · *Unknown Title* · *Unknown Type* (div. 853; núcleo) |
| **specs do `ux-audit`** | `tests/ux-audit/fase-d/*` | rótulos em inglês (fora do CI) |
| **dependências** | `package.json` | `sonner`, `lucide-react`, os `@radix-ui/*` dos 35 primitivos — a conferir com o `knip` no encerramento |

## 10. Decisões a pedir (não decididas) — para o aval

0. **Extras do commit 1** (o rito: declarados aqui): (i) `scripts/gates-web/g-faixa-setlists.ts` + a troca do estado `base`
   (leitura real) pelos cinco `base-*` fabricados; (ii) `components/setlists/__tests__/servidor-falso.ts`, o servidor
   falso partilhado pelos dois testes; (iii) a seção "I1-PR13 antes" no `COMO-RODAR.md`. Aprova?
1. **O servidor do aceite (commit 2)** (div. 849): esta árvore **não tem `.env.local`** e a porta 3000 é o `pnpm dev` que
   você deixou de pé em `../octavia-i1-pr12` (código = `main`: serviu o "antes"). O Firebase guarda a sessão do perfil por
   **origem** — outra porta não serve. Para o commit 2: **(a)** você para o da PR-12, copia o `.env.local` para cá e sobe
   `pnpm dev` aqui; ou **(b)** me autoriza a copiar o arquivo (`cp`, sem abrir) e a parar/subir o servidor. Qual?
2. **A falha a meio da adição** (decisão 26 do DESIGN-I1; div. 863): o laço é em série; a falha no meio deixa as primeiras
   gravadas. **(a) recomendado** — as que entraram **entram na lista** (com o id que a rota devolveu) e saem da seleção do
   picker; o diálogo fica com `set.erro.adicionar` e o *Tentar de novo* manda **só as que faltam**. (b) *Tentar de novo*
   repete todas (a duplicação da PR-12, decisão 12 — herança D).
3. **O 404 em editar, adicionar e remover** (div. 860): a nota de `SET-ja-apagada` diz *"vale também para editar,
   adicionar e remover numa setlist que sumiu"* — mas `POST …/songs` também dá 404 para o **content** que sumiu
   (*"Content not found"*) e o `DELETE …/songs/{id}` para a **linha** que sumiu (*"Song not found"*). **(a) recomendado** —
   todo 404 fecha o diálogo e **relê a lista**; se a setlist não está mais nela → *esta setlist já foi apagada*; se está
   (sumiu a linha ou o content) → a lista relida já mostra, sem frase (decisão 7). (b) a frase pelo texto do `error` do
   servidor (prende a tela a uma mensagem em inglês).
4. **N10 × o teto de 100** (div. 851): o hook pede `pageSize: 1000` e a rota corta em 100
   (`app/api/content/route.ts:119`) — o picker só vê os 100 mais recentes. **(a) recomendado** — N10 só quando a resposta
   diz que a biblioteca coube (`total ≤ data.length`) e todas estão na setlist; senão *nenhuma música disponível* sem o
   apoio que manda adicionar. O teto em si é **herança D**. (b) N10 sempre que a lista filtrada ficar vazia.
5. **A falha da leitura da biblioteca** (div. 852): hoje o picker diz *"No songs available"*. **(a) recomendado** — a
   `LinhaDeAviso` no picker com `lib.erro` (*não foi possível carregar a biblioteca — {motivo}*, frase da PR-9) e *Tentar
   de novo* (a recarga do hook); sem seção → pré-verificação + Vitest. (b) mudo, como hoje (herança nomeada).
6. ***Unknown Artist* que vem da rota** (div. 853): **(a) recomendado** — a tela mostra *artista desconhecido* quando o
   artista da linha é o sentinela da rota (só exibição; nenhum contrato muda), e *sem título* / o tipo desconhecido do
   mesmo jeito. (b) como vem (o inglês fica na tela; herança D).
7. **A data e o local** no cartão e no cabeçalho (código sem estado): **(a) recomendado** — uma linha de metadado
   (`size.label`, `muted`) com os ícones `data` e `local` de 20 em `lineInfo` e a data curta da PR-9; nada do que a tela
   mostra hoje some. (b) só no formulário.
8. **A nota da música** na linha: **(a) recomendado** — fica, em 13 `muted`, abaixo do artista, quando houver. (b) sai.
9. **O título vazio**: *sem título* (frase nova) no lugar de *'Untitled'*. Aprova?
10. ***Descrição* e *Notas*** (div. 857): a folha desenha uma caixa de `touch.min`; hoje são `textarea` de 3 e 2 linhas.
    **(a) recomendado** — seguem `textarea` (a quebra de linha que já existe num valor não se perde ao salvar), com a
    altura da folha. (b) campo de uma linha (achata a quebra ao salvar — muda o que se grava).
11. **O tipo no picker** (div. 859): a folha não o desenha na linha e a busca diz *"…ou tipo"*; hoje a busca casa o valor
    do enum (*chords*). **(a) recomendado** — a linha pela folha; a busca casa o rótulo pt-BR (*cifra*) **e** o valor de
    hoje. (b) só o de hoje.
12. **As cópias da folha** (div. 854): a fixture do aceite fica com *Show padrão* de **8** músicas (as cinco da folha +
    três: os textos pareiam, as três linhas a mais saem "sem par" no fim) e o picker com **4** disponíveis (*Selecionar
    todas (4)* "sem par"); em `SET-ja-apagada` *2 setlists* e em `SET-sem-musicas` o cartão *0 músicas* saem "sem par".
    Listados, sem errata — aceita?
13. **As frases novas** (§4): a forma da duração · os quatro placeholders · *Adicionar* sem número · o nome acessível
    *Adicionar {n} músicas a {nome}* · *Salvando…* no editar · *sem título* · os reusos da PR-9. Aprova?
14. **A `LinhaDeAviso` dentro do diálogo** (div. 856): o `README-design.md` §2.4 diz *"acima dos botões"*; a folha a
    desenha **logo abaixo do título** em `SET-criar-erro` e `SET-adicionar-erro` (acima dos campos e da lista) e abaixo da
    pergunta em `SET-apagar-erro`. **(a) recomendado** — a folha.
15. ***Nova setlist* em `SET-carregando`, `-carregando-dados` e `-erro`** (div. 866): **(a) recomendado** — o botão
    funciona onde o gerente está montado (dados, erro, vazio); em `SET-carregando` (sem usuário ainda) é desenhado e
    inerte. (b) inerte em todos os três.
16. ***Tentar de novo* de `SET-erro`** (div. 862): hoje recarrega a **página** (`window.location.reload()`). **(a)
    recomendado** — repete a **carga** (o `reload` do hook), como a biblioteca. (b) a página.
17. **O CN da PR-1, (v)** (div. 861): usa `/setlists` como "tela fora do `/login` onde a linha de sessão fica no topo"
    (div. 716). Com `/setlists` desenhando a linha na tela (como as outras), a (v) precisa de outra rota: **(a)
    recomendado** — `/privacy-policy` (a linha do topo passa a existir só nas públicas); par declarado, 15/15.
18. **O Toaster do sonner** (`app/layout.tsx`, sem emissor): **(a) recomendado** — fica para o encerramento (não é da
    superfície; está no §9). (b) sai nesta PR, declarado.
19. **Remoções declaradas**: o arrasto e a alça (decisão 27); *Recent*, o brilho de show futuro, a estrela (`is_favorite`
    não existe) e *Share* (nunca passado); o subtítulo *Songs*; os apoios dos três diálogos; o segundo *Add Songs* do
    vazio; os nove toasts. Aprova?
20. **Os estados sem seção**: o **editar** (`SET-editar`, `-salvando`, `-erro`) medido **contra a seção `SET-criar*`**
    (o título e o botão saem "sem par"; a geometria é a mesma) ou só na pré-verificação + Vitest? E a **N10** contra
    `SET-adicionar-vazio`? **(a) recomendado** — os dois contra a seção, como o `UP-lote-lendo` da PR-12.
21. **Token**: nenhum falta `[hipótese até o commit 2]` — `web.razaoListaDetalhe` (`--faixa-razao-lista`/`-detalhe`),
    `web.linhaMusica`, `web.linhaLista`, `folha.largura`/`topo`, `alfaDialogo` e os ícones (`nova-setlist`, `renomear`,
    `apagar-setlist`, `adicionar`, `remover`, `n-de-musicas`, `data`, `local`, `garantida`, `busca`) estão no pacote. Se
    faltar, paro e pergunto (div. 713).

## 11. Divergências — 846 a 872

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **846** | P | *"divergências a partir de 844"* | a PR-12 fechou em **845** (§24 do README dela: 844 e 845, do commit 5) | a numeração começa em 846 |
| **847** | P | `docs/ux/N2-ENCERRAMENTO.md` §10.3 | o arquivo é `docs/native/N2-ENCERRAMENTO.md` (`:583-592`: 5 = *"dois defeitos do web (remove por `content.id`; id local falso)"*, div. 156; 6 = *"o web mostra erro ao apagar setlist já apagada"*, div. 172) | lido lá |
| **848** | P | `DESIGN-I1/README.md` §1.4 (decisões 7, 25, 26, 27, 31) | estão no **§1.1** (respostas 1–32); o §1.4 é das divergências da conferência | lidas lá |
| **849** | P | *"o `.env.local` na árvore, o `pnpm dev` o carrega"* | `../octavia-i1-pr13` só tem `.env.example`; a 3000 é o `pnpm dev` de `../octavia-i1-pr12` (`bd77cd7`, **a mesma árvore** de `aa772df` — `git rev-parse …^{tree}` igual) | o "antes" mede contra ele; o commit 2 é a decisão 1 |
| **850** | P | as linhas do pre-check: `setlist-manager.tsx:207,214`, `:179`, `:140`, `:150-157` | hoje `:198`, `:205`, `:171`, `:133` (o `DELETE`) e `:140` (o fechar), `:142-149` — o arquivo encolheu na I1-PR-3 | §2 |
| **851** | A | — | o picker pede `pageSize: 1000` e a rota corta em 100 (`app/api/content/route.ts:119`) | decisão 4; herança D |
| **852** | A | — | a falha da leitura da biblioteca é engolida (`use-setlist-data.ts:90-92`): o picker diz "sem músicas" | decisão 5 |
| **853** | A | *"sem inglês"* | a rota sintetiza *Unknown Artist/Title/Type* (`app/api/setlists/route.ts:67-69`) | decisão 6 |
| **854** | D | — | quatro cópias entre seções (§3.5) | decisão 12 |
| **855** | D | frases da §5.9 | a folha escreve fora dela: a duração, os placeholders, *Adicionar* sem número | decisão 13 |
| **856** | D | §2.4: a linha *"dentro do diálogo acima dos botões"* | a folha a põe abaixo do título (criar, adicionar) | decisão 14 |
| **857** | D | cinco campos de `touch.min` | *Descrição* e *Notas* são `textarea` hoje | decisão 10 |
| **858** | D | — | código sem estado: data e local, a nota da música, o título vazio | decisões 7, 8, 9 |
| **859** | D | a linha do picker: título e artista | hoje também o tipo; a busca por tipo casa o enum em inglês | decisão 11 |
| **860** | A | nota de `SET-ja-apagada`: vale para editar, adicionar e remover | três 404 diferentes (setlist, content, linha) | decisão 3 |
| **861** | A | *"CN da PR-1 15/15"* | a (v) usa `/setlists` como a rota da linha no topo | decisão 17 |
| **862** | A | `SET-erro` com *Tentar de novo* | hoje é `window.location.reload()` | decisão 16 |
| **863** | A | decisão 26: *"falha a meio mostra `set.erro.adicionar` simples"* | o laço muta o arranjo do estado no lugar (`setlist-manager.tsx:156`, `:170`) e a tela não mostra o que entrou | decisão 2 |
| **864** | A | — | `lib/content-service-server.ts:12` (núcleo) importa `getSetlistById` do serviço **cliente** e não o usa | herança (encerramento / D); não tocado |
| **865** | T | — | o seletor da âncora da busca do picker (`height:48px`) pegava também `min-height:48px` (142 âncoras) | consertado antes do commit (130) |
| **866** | D | *Nova setlist* em todo estado | hoje só com a lista carregada ou vazia | decisão 15 |
| **867** | A | I1-D26: *"o `use-toast` órfão sai"* | há **dois** sistemas: o do shadcn (só as setlists) e o do sonner, montado e sem emissor desde a PR-12 | decisão 18 |
| **868** | P | PR-12 §21: *"o invólucro: resta só o das setlists"* | o `setlists-page-client.tsx` nunca esteve em `g-tok-arquivos.txt` | entra agora (§5) |
| **869** | A | — | `is_favorite`, `onShare`, `onToggleFavorite` das setlists: a coluna não existe e as props nunca são passadas | morrem (decisão 19) |
| **870** | T | o estado `base` da I1-PR5 | lia as setlists reais da conta | sai do instrumento; o "antes" é fabricado (§7) |
| **871** | A | — | a recarga ao voltar à aba (30 s) põe `loading` e a lista vira os três blocos; a setlist aberta fica com o objeto velho | registrado; não tocado |
| **872** | T | *"o antes sobre o commit 1"* | a rodada saiu `aa772df…+sujo`: os arquivos do commit 1 estavam sem commit (o JSON faz parte dele); o código do app é o de `aa772df` e o servidor era o da árvore da PR-12, igual | registrado (§7) |

Próxima divergência: **873**.

## 12. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · senhas · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0 · 0** |
| executor | navegador sem sessão | a folha por `file://` (`g-faixa-esperado.ts`, 3 vezes: a 1ª com a âncora errada, a 2ª, e o controle da folha 7) |
| executor | `pnpm dev` | **nenhum subido**: a 3000 é o do Marcel em `../octavia-i1-pr12` (código = `main`) |
| executor (I1-D37) | rodadas com sessão (perfil `~/.octavia-g-faixa-perfil`, `localhost:3000`) | 2: a fumaça em 1138 para a pasta de rascunho (13:33Z, 6 cargas) e o "antes" (13:45Z, 18 cargas) — leituras das setlists e do content **fabricadas**; `prodAbortados` 0; nenhuma escrita |
| executor | Vitest das setlists (os três defeitos, o gate das escritas) | jsdom, `fetch` falso (nada sai) |
| — | `packages/identidade` · `tailwind.config.ts` · as rotas · `lib/api-schemas.ts` | **não mudaram** |
| — | código do app (`app/`, `components/`, `lib/`, `hooks/`) | **0 linha** — o commit 1 é gate, esperado, testes, instrumento e docs |
