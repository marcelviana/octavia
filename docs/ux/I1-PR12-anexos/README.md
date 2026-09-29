# I1-PR-12 — anexos: superfície 7, upload (`/add-content`)

> **Bloco** I1 — identidade. **PR** de superfície 7, no molde das I1-PR-6…11 (`docs/ux/I1-PR11-anexos/README.md`: a
> medição por estado — `G_FAIXA_ESTADOS`, div. 803; nó velho por componente × coincidência de texto; a
> `linha-da-tela.tsx` com a segunda linha; o `lib/sinal-salvo.ts`).
> Branch `i1/pr12-upload`, árvore `../octavia-i1-pr12`, criada de `origin/main` =
> `434ba79a33b1254ad8e1b526ff8c086d947f2aa5` (`Merge pull request #346`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR11-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 17.2s using pnpm v10.28.0`. **Data**: 2026-09-29.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 806** (a PR-11 fechou em 805, §21.7 dela).
> **Estado**: commit 1 (gate-first), com o aval (§10.1); commit 1b (instrumento, §13) — aguarda o "antes".

| arquivo | o que é |
|---|---|
| `cn/g-tok-main.txt` | G-tok (ii) com os 21 arquivos do upload, sobre o código da `main` — **REPROVA 526** |
| `cn/g-faixa-esperado.txt` | a folha `7-upload` medida → `tests/gates-web/esperado/7-upload.json` (+ o controle: `4-content-lista` e `6-content-editor` re-medidos, byte a byte iguais) |
| `cn/upload-post-antes.txt` | o que o upload ENVIA na `main` — o `FormData` do `POST /api/storage/upload` e o corpo de cada `POST /api/content`, quatro fluxos (`tests/gates/i1-upload-post.test.tsx`, gravado em `tests/gates/fixtures/upload-post-antes.json`) — **extra declarado** (§10, item 0) |
| `cn/sonda-upload-main.txt` · `cn/sonda-upload-main.test.tsx.txt` | sonda descartável (Vitest, jsdom, `fetch` falso) sobre o código da `main`: a cópia velha do erro no passo 1, o fim do lote, a extensão, o limite (400 e 413), a rede — os textos de hoje, medidos |

---

## 1. Inventário `[medido]`

`wc -l`; importadores por `git grep -l` (fora `docs/`, `.planning/`, `.audit/`, `apps/native`). **Destino** é a
proposta do commit 2, condicionada às decisões do §10.

### 1.1 A rota, os passos e o que só o upload usa

| arquivo | linhas | importa (o que pesa) | quem importa | destino |
|---|---|---|---|---|
| `app/add-content/page.tsx` | 12 | `requirePageUser` (o servidor expulsa sem sessão → `/login`), `AddContentPageClient` | a rota | **fica, intocado** (é o enforcement do B1.2a) |
| `components/add-content-page-client.tsx` | 71 | `Casca` (PR-9), `useAuth`, `AddContent` por `dynamic` (*"Loading add content..."*, `:10-12`); `isLoading` → *"Loading..."* fora da casca (`:41-50`); **`return null`** sem usuário (`:53-55`); o invólucro velho `flex-1 bg-[#fffcf7]` (`:61`, herança da PR-11 §21.6) | `app/add-content/page.tsx` | fica, reescrito: os três carregamentos viram **um** *carregando…* na casca (resposta 14); o invólucro sai |
| `components/add-content.tsx` | 1 | reexporta `RefactoredAddContent` | `add-content-page-client.tsx`, `tests/components/add-content.refactoring.test.tsx` | fica (o ponto do `dynamic`) |
| `components/add-content/RefactoredAddContent.tsx` | 177 | `ui/button`, lucide, os seis passos abaixo, `useAddContentLogic` | `add-content.tsx` | fica, reescrito (< 150 → partes): o despacho por passo; **o alerta do passo 1 deixa de mostrar o erro de salvar** (decisão 24; §2.3) |
| `components/add-content/StepIndicatorComponent.tsx` | 60 | lucide (`Check`, `Upload`, `FileText`) | `RefactoredAddContent` | fica, reescrito: os três chips (*1 como · 2 detalhes · 3 pronto*), `radius.chip`, 13 |
| `components/add-content/ContentTypeSelector.tsx` | 77 | `ui/card`, **`ui/tooltip`**, `getContentTypeIcon`/`getContentTypeColors` (`types/content.ts`; classes montadas em tempo de execução, `ring-${…}`) | `RefactoredAddContent` | fica, reescrito (quatro `radio` com o ícone do catálogo); o tooltip da partitura morre |
| `components/add-content/ModeSelector.tsx` | 100 | `ui/card`, lucide | `RefactoredAddContent` | fica, reescrito (dois cartões de escolha) |
| `components/add-content/ImportModeSelector.tsx` | 83 | `ui/card`, lucide | `RefactoredAddContent` | fica, reescrito (dois `radio` de 48) |
| `components/add-content/FileUploadZone.tsx` | 117 | **`toast` do sonner** (`:31`, `:52`), `ui/button`, `uploadToStorage`; *"(max 50MB)"* (`:112`) | `RefactoredAddContent` | fica, reescrito: a zona `web.zonaArquivo`, *enviando o arquivo…*, a extensão sob a zona, o limite e o envio na `LinhaDeAviso`; os toasts saem |
| `components/add-content/upload-to-storage.ts` | 52 | `getValidToken`; o `POST /api/storage/upload` com `FormData` (`file`, `filename` sanitizado) | `FileUploadZone.tsx` | **fica; o `FormData` intocado** (gate byte a byte, §1.3); o `Error` passa a levar `status` e `details` (aditivo, decisão 11) |
| `components/add-content/DetailsStep.tsx` | 102 | `ui/button`, `MetadataForm`, `BatchPreview`; o mapa `ContentType` → *"Chord Chart"*/*"Guitar Tab"*/… só para o `BatchPreview` voltar ao mesmo `ContentType` (`:66-74` × `batch-preview.tsx:36-41`) | `RefactoredAddContent` | fica, reescrito; *"Add Content Details"* morre |
| `components/add-content/CompletionStep.tsx` | 54 | `ui/button`, lucide (`Check`, `Sparkles`), 🎉 | `RefactoredAddContent` | fica, reescrito: `garantida` 28 + *pronto* + o apoio + *Ir para a biblioteca* (decisão 9) |
| `components/content-creator.tsx` | 187 | `ui/card·button·input·label·textarea·alert`, lucide, **`lib/content-type-styles`**; o ramo de escolha de tipo (`:102-135`) é **morto** (`hideTypeSelection` é sempre `true`, `RefactoredAddContent.tsx:162`) | `RefactoredAddContent` | fica, reescrito (decisão 5); o ramo morto sai |
| `components/batch-preview.tsx` | 148 | `ui/card·button·input·textarea·checkbox`, **`toast`** (`:52`, `:63`, `:67`), `createContent` (grava por conta própria, `:55-60`) | `DetailsStep.tsx` | fica, reescrito (decisão 6); os toasts saem; o corpo de cada `POST` intocado |
| `components/metadata-form.tsx` | 1 | reexporta `RefactoredMetadataForm` | `DetailsStep.tsx` | fica |
| `components/metadata-form/RefactoredMetadataForm.tsx` | 134 | `ui/card·button·alert·accordion`, lucide, `useMetadataForm`; `key={formData.key}` no `AdvancedMetadataFields` (`:100`, div. 821) | `metadata-form.tsx` | fica, reescrito (a folha: grade de duas colunas, *Opções avançadas ▾*, *Cancelar* · *Salvar*) |
| `components/metadata-form/BasicMetadataFields.tsx` | 109 | `ui/input·label·textarea` | `RefactoredMetadataForm` | fica, reescrito |
| `components/metadata-form/AdvancedMetadataFields.tsx` | 141 | `ui/input·label·select·checkbox`; os 12 tons, as 3 dificuldades | `RefactoredMetadataForm` | fica, reescrito (seleção nativa, como o editor da PR-11) |
| `hooks/useAddContentLogic.ts` | 290 | `createContent`, `lib/batch-import`; `isParsing` **não é devolvido** (`:34`, `:267-290`); o `setError` do salvar (`:259`) é a cópia velha | `RefactoredAddContent`, 2 suítes | fica; `isParsing` devolvido (I1-E2); a cópia velha sai; o morto sai (`importModes`, `contentTypes`, `availableImportModes`, `isProcessing` nunca `true`, `batchArtist`/`batchImported`, o ramo de lote de `handleSaveContent`, `:186-202`, que nada chama — o lote grava pelo `BatchPreview`) |
| `hooks/useMetadataForm.ts` | 112 | `useAuth`; o sucesso *"Content saved successfully!"* (`:97`) | `RefactoredMetadataForm`, 1 suíte | fica; o objeto que vai ao `onComplete` **intocado** (§1.3) |
| `lib/content-type-styles.ts` | 49 | `types/content` | **só** `content-creator.tsx` (desde a PR-11) | **morre** com o ramo morto do `content-creator` (proposta) |

**Compartilhados que ficam como estão**: `lib/content-service.ts` (`createContent`, `:501-528` — o `Error` sem `status`,
decisão 11), `lib/batch-import.ts` (274, os três leitores do lote), `lib/api-schemas.ts` (o teto), `types/content.ts`
(`getContentTypeIcon`/`getContentTypeColors` ficam sem importador se o `ContentTypeSelector` deixar de usá-los — saem
no commit 2 se o `git grep` der 0, declarado). `components/identidade/*` (a casca, a `LinhaDeAviso`, a
`linha-da-tela`, os controles) e `components/editors/campos.tsx` (o campo, a seleção nativa com *▾*, a caixa de marcar
da PR-11) são reusados.

### 1.2 Os testes do upload velho `[medido]`

`pnpm exec vitest run` das quatro suítes, na `main`: `Test Files 4 passed (4)` · `Tests 49 passed | 4 skipped (53)`.

| suíte | casos | o que prende | destino no commit 2 |
|---|---|---|---|
| `tests/components/add-content.refactoring.test.tsx` | 25 (4 pulados) | mocka os seis passos e o hook (*"dead twin"*); acha por texto em inglês | adaptado (os seletores) ou morto se prender a estrutura velha — listado caso a caso |
| `tests/hooks/useAddContentLogic.test.ts` | 20 | o estado do hook | fica (o hook fica); os que prendem o morto que sai, adaptados |
| `hooks/__tests__/useAddContentLogic.test.ts` | 5 | ADD-13/ADD-14 (o salvar usa os metadados digitados; a guarda de in-flight) | **fica** (é comportamento) |
| `hooks/__tests__/useMetadataForm.test.ts` | 3 | ADD-14/ADD-01 (sucesso só depois do salvar; o erro visível) | fica; a frase do erro muda de dono |

Fora do `pnpm test`: `tests/ux-audit/fase-d/i-add.spec.ts` e `add13-14-metadados.spec.ts` (Playwright sob demanda
contra preview/prod) acham *"Import from File"*, *"Browse files"*, *"Advanced Options"*, *"Save Content"* — quebram com
o texto novo; o commit 2 troca os seletores (sem rodar: são gates contra preview/prod, passo do Marcel).

### 1.3 O que o upload envia — o gate byte a byte (**extra declarado**, §10 item 0) `[medido]`

`tests/gates/i1-upload-post.test.tsx`, no molde do `i1-editor-put` (PR-11): monta a tela, guarda o `FormData` do
`POST /api/storage/upload` (o arquivo como nome · tipo · tamanho · sha256) e o corpo de cada `POST /api/content`, em
quatro roteiros — **criar do zero** (letra, com *Ano*, *Capo*, *Afinação*, *Compasso* e *favorita* preenchidos),
**importar um arquivo** (cifra, `.txt`), **partitura** (`.pdf`) e **lote** (`.txt`, três músicas). Gravado sobre o
código da `main` (`CN_GRAVAR=1`) em `tests/gates/fixtures/upload-post-antes.json`; conferido duas vezes, igual
(`cn/upload-post-antes.txt`: `Tests 4 passed | 1 skipped (5)`). No commit 2 só os seletores do roteiro mudam.

O que ele **mede** (herança D, não tocada — div. 820, 823, 824):

```
criar do zero: {"title":"Linha de 120 colunas","artist":"Teste de régua","content_type":"Lyrics","content_data":{"lyrics":"La la la, la la lá"},
  "album":"Álbum do CN","genre":"Samba","notes":"nota do CN","key":null,"bpm":96,"difficulty":null,"time_signature":null,"is_favorite":false,"tags":null,"user_id":"cn-user"}
```

— o roteiro digitou *Ano 1998*, *Capo 2*, *Afinação Drop D*, *Compasso 3/4* e marcou *favorita*: **nenhum dos cinco
vai**. *Ano*, *Capo*, *Afinação*: o hook não os lê (`useAddContentLogic.ts:205-221`, `:230-252`); *Compasso* e
*favorita*: o formulário manda `time_signature`/`is_favorite` (`useMetadataForm.ts:85-86`) e o hook lê
`timeSignature`/`isFavorite` (`useAddContentLogic.ts:217-218`, `:248-249`). A importação de um arquivo de texto grava
só o `file_url` (sem `content_data`); o lote grava *"Unknown Artist"* no artista vazio (`useAddContentLogic.ts:158`).

## 2. A matriz × a folha `[lido + medido]`

A folha tem **21 `data-estado`**: 20 estados + `Tokens` (sem moldura, como nas folhas 4–6). `UP-lote-lendo` **não
tem seção** — é estado **por errata** (I1-E2; T-I1-R231/232). Div. **806**. A matriz do pre-check
(`I1-PRECHECK-anexos/matriz-estados.txt:254-313`) é de `c57d81f`; as linhas abaixo são as de hoje (os arquivos só
mudaram pelo invólucro da casca da PR-9).

### 2.1 Os 21 estados (20 seções + `UP-lote-lendo`)

| estado da folha | passo na folha | nasce em (hoje) | o que a tela mostra hoje | o que muda |
|---|---|---|---|---|
| `UP-carregando` | — | `add-content-page-client.tsx:10-12` (o `dynamic`), `:41-50` (`isLoading`, **fora da casca**), `:53-55` (**`return null`**) | *"Loading add content..."* · *"Loading..."* · nada | *carregando…* na casca, os três (resposta 14) |
| `UP-como` | 1 | `RefactoredAddContent.tsx:101-150` (+ o criar/zona **abaixo**, `:151-173`) | *Content Type* (4 cartões) → *How would you like to add content?* (2) → *Import Type* (2), **na mesma tela** da zona ou do criar, com *Back* (`:106-113`) | a folha: **só os seletores** (div. 808, decisão 2); a ordem (div. 809, decisão 3) |
| `UP-arquivo` | 2 | `FileUploadZone.tsx:59-116` (no passo 1 de hoje) | *Import Music File* · *Drag and drop…* · *Browse files* · *Supported formats: … (max 50MB)* | a zona `web.zonaArquivo`; *até 4 MiB* (I1-D29); *Voltar* |
| `UP-enviando` | 2 | `FileUploadZone.tsx:80-89` | spinner + *"Uploading file..."* | *enviando o arquivo…* + *{nome} · {tamanho}* (sem spinner) |
| `UP-extensao` | 2 | `FileUploadZone.tsx:30-35` | **toast** *"Unsupported file type: foto.heic. Allowed: .pdf, .docx, .txt"* (`[medido]` SONDA(3); nenhum request) | sob a zona, em `errorInk` (`up.extensao`) |
| `UP-limite` | 2 | `lib/api-schemas.ts:259` → `route.ts:42-52` (400) → `upload-to-storage.ts:42-44` → `FileUploadZone.tsx:51-52` | **toast** *"Validation failed"* (400) · *"Upload failed with status 413"* (413 da plataforma) `[medido]` SONDA(4), (5) | `up.limite` (N8) na `LinhaDeAviso`, sem ação (§2.4, decisão 11) |
| `UP-envio-rede` | 2 | `FileUploadZone.tsx:51-52` | **toast** *"Failed to fetch"* `[medido]` SONDA(6) | `up.erro.envio` + *sem conexão* + *Tentar de novo* |
| `UP-envio-servidor` | 2 | `upload-to-storage.ts:27-49`, `route.ts:15-20`, `:108-123`, `:139-141` | **toast** com a mensagem crua: *"Authentication required"*, *"Rate limit exceeded"*, *"File upload failed"*, *"Failed to get public URL for uploaded file"* | `up.erro.envio` + o motivo por espécie; *Tentar de novo* só em 5xx |
| `UP-detalhes` | 2 | `DetailsStep.tsx:41-101` + `RefactoredMetadataForm.tsx:41-133` + `BasicMetadataFields.tsx` | *Back* + *Add Content Details* + *Back* + *Add Metadata* / *Fill in the details…* + cartão *Content Details* + campos em uma coluna (álbum \| gênero em duas) + acordeão *Advanced Options* + *Cancel* · *Save Content* | a folha: a linha do arquivo, a grade de duas colunas, *Opções avançadas ▾*, *Cancelar* · *Salvar* |
| `UP-detalhes-inativo` | 2 | `RefactoredMetadataForm.tsx:125` | o *Save Content* cinza, sem dizer por quê | + *título e artista são obrigatórios* ao lado (a frase de `useMetadataForm.ts:65`, hoje inalcançável como erro) |
| `UP-salvando` | 2 | `RefactoredMetadataForm.tsx:125-128` | *"Saving..."* | *Salvando…* (visto → `garantida`, I1-E6, inativo) |
| `UP-salvar-erro` | 2 | `useMetadataForm.ts:98-99` → `RefactoredMetadataForm.tsx:58-63` | alerta com a mensagem crua (*"Failed to create content"*, *"Rate limit exceeded"*, *"Validation failed"*, *"Failed to fetch"*…) | `up.erro.salvar` + o motivo + a segunda linha (decisão 8) + *Tentar de novo* (rede, 5xx) |
| `UP-criar` | 2 | `content-creator.tsx:100-186` (no passo 1 de hoje) | *{tipo} Editor* · *Title* · o texto (12 linhas) · as dicas · *Next* | a folha: *Título* · *Voltar* · *Próximo* (decisão 5) |
| `UP-criar-validacao` | 2 | `content-creator.tsx:86-89` → `:138-143` | alerta *"Title is required"* acima do cartão | *o título é obrigatório* sob o campo, contorno `errorInk` |
| `UP-lote` | 2 | `DetailsStep.tsx:63-82` + `batch-preview.tsx:73-146` | por música: caixa *incluir* · título (campo) · artista (campo) · corpo (4 linhas); *Back* · *Import All* | a grade da folha (decisão 6) |
| `UP-lote-lendo` (I1-E2) | 2 | `useAddContentLogic.ts:137-170` (`isParsing`, **não devolvido**) | nada: a tela fica na zona até a leitura acabar | *carregando…* no lugar da lista (decisão 13) |
| `UP-lote-importando` | 2 | `batch-preview.tsx:137-144` | spinner no *Import All* | *Importando…* (adicionar inativo) |
| `UP-lote-erro` | 2 | `batch-preview.tsx:65-68` | **toast** *"Failed to import songs"*, indistinto | `up.lote.erro` + o motivo + *Tentar de novo* (rede, 5xx) |
| `UP-lote-vazio` | 2 | `useAddContentLogic.ts:152-153`, `:165-166` → `RefactoredAddContent.tsx:118-126` | alerta *"No songs found in the file"* (ou a mensagem da exceção / *"Failed to parse file"*) no passo 1 | `up.lote.vazio` na `LinhaDeAviso` acima da zona; a variante `up.lote.ler` com *Tentar de novo* (nota da folha) |
| `UP-lote-sucesso` | 1 | `batch-preview.tsx:63` → `DetailsStep.tsx:75-80` → `RefactoredAddContent.tsx:57` (o passo 3 exige `createdContent`, que o lote não preenche) → cai no passo 1 | **toast** *"2 songs imported successfully"* e o passo 1 `[medido]` SONDA(2) | `up.lote.ok` (sucesso) na `LinhaDeAviso` sobre o passo 1 (decisão 7 do DESIGN-I1: a tela não mostra por si) |
| `UP-pronto` | 3 | `RefactoredAddContent.tsx:57-78` + `CompletionStep.tsx` — **pisca**: `handleContentCreated` já fez `router.push('/content/{id}')` (`add-content-page-client.tsx:31-38`) antes do `onNext` (`DetailsStep.tsx:91-95`) | *🎉 Done! Your music is now part of your library.* · *"{título}" by {artista}* · *Your new content…* · *Add Another* · *Go to Library* | `garantida` 28 · *pronto* · *“{título}”, de {artista}, está na biblioteca* · *Ir para a biblioteca* |

### 2.2 Onde o erro é engolido (ou sai cru)

| arquivo:linha | o que faz |
|---|---|
| `FileUploadZone.tsx:30-35` | extensão recusada → toast; some sozinho |
| `FileUploadZone.tsx:51-52` | toda falha do envio → toast com `err.message` crua (a do servidor em inglês, ou *"Failed to fetch"*) |
| `upload-to-storage.ts:42-44` | o `status` se perde; o 400 do teto vira *"Validation failed"* (os `details` com *"File exceeds the 4MB limit"* ficam no corpo); o 413 sem JSON vira *"Upload failed with status 413"* |
| `lib/content-service.ts:519-521` (`createContent`) | o `status` se perde: `Error(err.error \|\| "Failed to create content")`; sem token → `Error(tokenError \|\| "Authentication failed")` |
| `useMetadataForm.ts:98-99` | o erro do salvar → `err.message` crua no alerta |
| `useAddContentLogic.ts:258-260` | **a cópia velha**: o mesmo erro vai ao `error` do hook, que o passo 1 mostra (§2.3) |
| `batch-preview.tsx:51-54`, `:65-68` | tipo inválido → toast (improvável); qualquer falha do lote → `console.error` + toast *"Failed to import songs"* |
| `batch-preview.tsx:63` | o sucesso do lote → toast; a tela volta ao passo 1 sem dizer nada |
| `useAddContentLogic.ts:165-166` | a leitura do lote → a mensagem da exceção crua (de `mammoth`/pdf.js) ou *"Failed to parse file"* |

### 2.3 A cópia velha do erro no passo 1 (decisão 24) e o `return null` (resposta 14) `[medido]`

**A cópia velha**: `useAddContentLogic.ts:259` (`setError(… "Failed to save content")`) guarda o erro do salvar no
estado do hook; o passo 1 o desenha (`RefactoredAddContent.tsx:118-126`). O caminho: salvar falha (o formulário mostra
o erro) → *Cancel* → o passo 1 **mostra o mesmo erro, velho**. `cn/sonda-upload-main.txt`:

```
SONDA(1) no passo 2 (formulário): 1 ocorrência(s)
SONDA(1) no passo 1 depois de Cancel: 1 ocorrência(s) · role=alert: Failed to create content
```

O commit 2 a mata (o erro do salvar é do formulário; o `error` do hook fica só com o do lote) — teste que reprova na
`main` (a mesma sonda, com a asserção).

**O `return null`**: `add-content-page-client.tsx:53-55` (`if (!user) return null`) — sem usuário, tela em branco
(sem a casca). Com o enforcement do servidor (`app/add-content/page.tsx:10` → `/login`), só se alcança quando o
cliente perde o usuário depois do SSR. Vira *carregando…* (resposta 14; nota de `UP-carregando`).

### 2.4 O limite — os dois lados `[lido + medido]`

| lado | onde | o que cobra |
|---|---|---|
| **servidor** | `lib/api-schemas.ts:259` — `storageSchemas.upload.size: z.number().int().min(1).max(4 * 1024 * 1024, 'File exceeds the 4MB limit')`, aplicado em `app/api/storage/upload/route.ts:42-52` (`validationError` → 400 `{ error: "Validation failed", code: "VALIDATION_ERROR", details: [{ field: "size", … }] }`) | **4 MiB = 4 194 304 bytes, inclusivo** (`lib/__tests__/contract-storage.test.ts:50-69`); o comentário (`:254-258`) diz que é também o `file_size_limit` do bucket; acima de ~4,5 MB a **plataforma** devolve 413 sem JSON antes da rota (B5-PRECHECK §4.4) |
| **cliente** | `FileUploadZone.tsx`, `upload-to-storage.ts` | **nenhum teto** — `git grep -n "file.size\|\.size >\|MAX_FILE\|maxSize" -- app components hooks lib` só acha `FileUploadZone.tsx:44` (repassa o tamanho) e a rota. O cliente cobra só a **extensão** (`:15-16`, `:30`) |
| **o texto** | `FileUploadZone.tsx:112` | *"(max 50MB)"* — mentira (I1-D29, div. 499) |

O texto novo cita o limite **do servidor**. Proposta do teste do commit 2 (o prompt, §3): lê o máximo do
`storageSchemas.upload.shape.size` (o `max` do zod, sem tocar a rota) e confere que `up.formatos` e `up.limite` dizem
`{max / 1024 / 1024} MiB` — se o teto mudar, o teste reprova até o texto mudar.

### 2.5 Código sem estado · estado sem código

- **Estado da folha sem código**: `UP-lote-lendo` (I1-E2), `UP-lote-sucesso` (o lote cai no passo 1 com toast), o
  motivo ao lado do *Salvar* inativo (`UP-detalhes-inativo`), *Tentar de novo* no envio e no salvar, o passo 1 sozinho
  (div. 808).
- **Código sem estado na folha**: (a) as **Opções avançadas abertas** (*Key*, *BPM*, *Difficulty*, *Capo*, *Tuning*,
  *Time Signature*, *Mark as favorite*) — a folha só desenha fechado; (b) o **corpo** do criar do zero (div. 811); (c)
  por música do lote: *incluir*, o título editável e o corpo (div. 813); (d) *Add Another* / *Import More* no pronto
  (div. 816); (e) *Back* do passo 1 (div. 817); (f) o 400 do envio que não é o teto (tipo, MIME, *magic bytes* —
  `route.ts:29-91`; div. 825); (g) a falha parcial do lote (div. 827); (h) a partitura no passo 1 (sem *Criar do zero*
  nem *Várias músicas*, div. 810); (i) o tooltip da partitura (`ContentTypeSelector.tsx:18`).
- **Controle da folha sem código**: o avanço do passo 1 para o 2 — a folha não desenha (div. 808).

## 3. As frases — a §5.8 (+ N8, N2, §5.1) × o inventário `[lido]`

| chave (§5.8 / §5.10) | texto | de hoje | onde hoje |
|---|---|---|---|
| `up.passos` | como · detalhes · pronto | "Upload" · "Add Details" · "Complete" | `StepIndicatorComponent.tsx:11-18` |
| `up.como` | como você quer adicionar? | "How would you like to add content?" | `ModeSelector.tsx:17` |
| `up.criar` / `.apoio` | Criar do zero / escreva no editor | "Create New" / "Start from scratch and build your content manually with our editor." | `ModeSelector.tsx:45`, `:52` |
| `up.importar` | Importar de arquivo | "Import from File" | `ModeSelector.tsx:84` |
| `up.tipo` | tipo de conteúdo | "Content Type" | `ContentTypeSelector.tsx:25` |
| (os tipos, PR-9 `TIPOS`) | Letra · Cifra · Tab · Partitura | "Lyrics" · "Chords" · "Tab" · "Sheet" (o valor do enum na tela) | `ContentTypeSelector.tsx:61` |
| `up.importar.tipo` | importar · Um arquivo · Várias músicas num arquivo | "Import Type" · "Single Content" · "Batch Import" | `ImportModeSelector.tsx:20-36` |
| `up.zona` | arraste o arquivo para cá | "Import Music File" + "Drag and drop your file here, or" | `FileUploadZone.tsx:61`, `:89` |
| `up.escolher` | Escolher arquivo (nome acessível: Escolher o arquivo de música) | "Browse files" / `aria-label` "Upload music file" | `:98`, `:103` |
| `up.formatos` | formatos: .pdf, .docx, .txt · até 4 MiB | "Supported formats: … (max 50MB)" | `:112` |
| `up.enviando` | enviando o arquivo… | "Uploading file..." | `:89` |
| `up.extensao` | tipo de arquivo não aceito: {nome} — use {lista} | "Unsupported file type: {nome}. Allowed: {lista}" (toast) | `:31-33` |
| `up.limite` (**N8**) | o arquivo passa de 4 MiB — escolha um menor | "Validation failed" / "Upload failed with status 413" (toast) | `:52` ← `upload-to-storage.ts:44` |
| `up.erro.envio` | o arquivo não foi enviado — {motivo} | a mensagem crua (toast) | `:52` |
| `up.meta.*` | Título * · Artista * · Álbum · Gênero · Ano · Notas · Opções avançadas · Cancelar · Salvar · Salvando… | "Title *" · "Artist *" · "Album" · "Genre" · "Year" · "Notes" · "Advanced Options" · "Cancel" · "Save Content" · "Saving..." | `BasicMetadataFields.tsx:30-98`; `RefactoredMetadataForm.tsx:95`, `:121`, `:128` |
| `up.meta.obrigatorios` | título e artista são obrigatórios | "Title and Artist are required" (inalcançável como erro) | `useMetadataForm.ts:65` |
| `up.erro.salvar` | não foi possível salvar — {motivo} | a mensagem crua no alerta | `useMetadataForm.ts:99` |
| `digitado-fica` (**N2**) | o que você escreveu continua aqui | — | — (a folha escreve *preencheu*, div. 815) |
| `up.criar.titulo` / `up.proximo` | Título / Próximo | "Title" / "Next" | `content-creator.tsx:151`, `:180` |
| `up.titulo-obrigatorio` | o título é obrigatório | "Title is required" | `content-creator.tsx:87` |
| `up.lote.importar` / `.importando` | Importar todas / Importando… | "Import All" (+ spinner) | `batch-preview.tsx:143` |
| `up.lote.erro` | não foi possível importar as músicas — {motivo} | "Failed to import songs" (toast) | `batch-preview.tsx:67` |
| `up.lote.vazio` | nenhuma música encontrada no arquivo | "No songs found in the file" | `useAddContentLogic.ts:153` |
| `up.lote.ler` | não foi possível ler o arquivo | a exceção crua / "Failed to parse file" | `useAddContentLogic.ts:166` |
| `up.lote.ok` | {n} músicas importadas | "{n} songs imported successfully" (toast) | `batch-preview.tsx:63` |
| `up.pronto` / `.apoio` | pronto / “{título}”, de {artista}, está na biblioteca | "🎉 Done! Your music is now part of your library." / "\"{título}\" by {artista}" | `CompletionStep.tsx:32`; `RefactoredAddContent.tsx:60` |
| `up.ir-biblioteca` | Ir para a biblioteca | "Go to Library" | `CompletionStep.tsx:48` |
| `estado.carregando` (§5.1) | carregando… | "Loading..." · "Loading add content..." · `null` | `add-content-page-client.tsx:46`, `:11`, `:53-55` |
| `acao.voltar` · `acao.tentar` · `motivo.*` (§5.1) | Voltar · Tentar de novo · os de sempre (com **vírgula** dentro da composta, a decisão 11 da PR-11 — a nota de `UP-envio-servidor` já escreve assim) | "Back" (×4) · — | `RefactoredAddContent.tsx:112`, `DetailsStep.tsx:51`, `RefactoredMetadataForm.tsx:50`, `batch-preview.tsx:133` |

**Frases que a folha escreve e a §5.8 não lista** (lista declarada, I1-D10 — div. 830):

| texto na folha | onde | hoje | proposta |
|---|---|---|---|
| *PDF, DOCX, TXT ou imagem* (apoio de *Importar de arquivo*) | `UP-como`, `-lote-sucesso` | "Upload and parse existing files (PDF, DOCX, TXT) to extract content automatically." / "Upload PDF files or images to import sheet music." | **nova** (uma frase para os dois casos) |
| *{n} músicas encontradas em {arquivo}* | `UP-lote*` | — | **nova** |
| *{nome} · {tamanho}* com o tamanho *1,8 MiB* (uma casa, vírgula) | `UP-enviando`, `UP-detalhes*`, `-salvando`, `-salvar-erro` | — | **nova** a forma (o nome é dado) |
| *título da música* · *nome do artista* · *nome do álbum* · *gênero* · *ano* · *notas ou comentários* · *artista* (placeholders) | `UP-criar`, `UP-detalhes*`, `UP-lote` | "Song title" · "Enter artist name" · "Enter album name" · "Enter genre" · "Enter year" · "Add any notes or additional comments" · "Artist" | **novas** |
| *use .pdf, .docx ou .txt* (a {lista} com *ou* no último) · *formatos: .pdf, .docx, .txt* (com vírgula) | `UP-extensao`, zona | "Allowed: .pdf, .docx, .txt" | a forma da lista — **nova**; partitura: *.pdf, .png, .jpg ou .jpeg* (nota de `UP-arquivo`) |
| *o que você preencheu continua aqui* | `UP-salvar-erro` | — | decisão 8 (N2 diz *escreveu*) |
| *Salvar* no botão do lote | `UP-lote-erro` | "Import All" | decisão 7 (`up.lote.importar` diz *Importar todas*) |

**Sem desenho na folha, precisam de frase** (controles e opções de hoje): as **Opções avançadas** abertas — proposta:
os rótulos da §5.7 já aprovados na PR-11 (*Tom* · *BPM* · *Dificuldade* · *Capo* · *Afinação* · *Compasso* ·
*Favorita*; *escolha* nas seleções; *casa* no capo), as três dificuldades da PR-9 (*Iniciante* · *Intermediário* ·
*Avançado*, valores de hoje) e os 12 tons na notação de cifra (I1-E20); o **corpo** do criar do zero (decisão 5:
rótulo = o nome do tipo — *Letra* · *Cifra* · *Tab* —, placeholder `edit.letra.placeholder` na letra, nenhum nas
outras); no lote (decisão 6): *Incluir “{título}”* (nome acessível da caixa) e *corpo de “{título}”*; o 400 do envio que
não é o teto (div. 825): `up.erro.envio` + `motivo.recusado` (*o servidor recusou os dados*, sem ação).

**Frases de hoje sem destino** (morrem): *"Add Content Details"* (`DetailsStep.tsx:54`) e o apoio da partitura (`:58`);
*"Add Metadata"* / *"Fill in the details for your content"* / *"Content Details"* (`RefactoredMetadataForm.tsx:53-54`,
`:76`; nota de `UP-detalhes`); *"Content saved successfully!"* (`useMetadataForm.ts:97` — pisca junto com o pronto: a
mesma notícia, uma frase só, nota de `UP-pronto`); *"Your new content is now available in your library"* · *"All songs
are now available in your library"* · *"Add Another"* · *"Import More"* (decisão 9); os subtítulos dos modos de
importar (`ImportModeSelector.tsx:21`, `:26`); o tooltip da partitura; *"{tipo} Editor"*, os quatro placeholders e as
**dez dicas** do criar (`content-creator.tsx:41-67`, `:147`); o ramo morto do criar (*"Create New Content"*, *"Choose
the type…"*, as quatro descrições, `:76-81`, `:105-106`); *"Invalid content type"* (improvável); *"Upload failed with
status N"*, *"Failed to get public URL for uploaded file"* (→ `motivo.servidor`); *"User not authenticated"*
(`useMetadataForm.ts:60` → `motivo.auth`); os placeholders das avançadas (*"Select key"*, *"120"*, *"Select
difficulty"*, *"Fret number"*, *"Standard (EADGBE)"*, *"4/4"*).

**Dado em inglês que não é frase** (div. 824): *"Unknown Artist"* — o artista padrão da música do lote
(`useAddContentLogic.ts:158`) e do rascunho sem artista (`:207`, `:233`) — **é valor gravado** (`[medido]`: o
`POST` do lote leva `"artist":"Unknown Artist"`). Traduzir muda o corpo (I1-D9). Fica; herança D. No aceite, o campo
de artista do lote mostra o valor (não o placeholder *artista* da folha): sai "sem par" pelo texto, pareia pela âncora.

## 4. G-tok cresce `[medido]`

`scripts/gates-web/g-tok-arquivos.txt` ganha os **21** arquivos do §1.1 (a rota, os passos, a zona, o criar, o lote, os
metadados, os dois hooks e o `content-type-styles`). Na `main` (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 105 · literais de identidade acusados: 443 · toasts: 5 · imports de ui: 30 · textos examinados: 69 · isentos de inglês (scripts/gates-web/g-tok-sem-ingles.txt): 1 · vocabulário: 133 · isenções: 9

G-tok: REPROVA — 526 ocorrência(s)
# exit: 1
```

Por classe: 186 [cor] · 104 [espaçamento] · 71 [tamanho] · 43 [tamanho de fonte] · 36 [inglês, texto JSX] · 30 [import
de ui] · 18 [borda] · 14 [raio] · 12 [inglês, atributo] · 7 [valor arbitrário] · 5 [toast].
Por arquivo: `RefactoredMetadataForm.tsx` 64 · `content-creator.tsx` 52 · `ModeSelector.tsx` 52 · `CompletionStep.tsx`
47 · `AdvancedMetadataFields.tsx` 41 · `BasicMetadataFields.tsx` 39 · `FileUploadZone.tsx` 36 · `ImportModeSelector.tsx`
30 · `batch-preview.tsx` 27 · `StepIndicatorComponent.tsx` 27 · `RefactoredAddContent.tsx` 27 · `lib/content-type-styles.ts`
26 · `ContentTypeSelector.tsx` 22 · `DetailsStep.tsx` 19 · `add-content-page-client.tsx` 17; **0** em
`app/add-content/page.tsx`, `add-content.tsx`, `upload-to-storage.ts`, `metadata-form.tsx`, `useAddContentLogic.ts`,
`useMetadataForm.ts`. Os 84 de antes seguem **0**; o (i) (a folha) segue **PASSA** (`achados do conferir: 26 · cobertos:
26 · descobertos: 0 · erratas: 9 · órfãs: 0`). O job `g-tok` do CI fica vermelho neste commit — é o gate-first.

Achado do instrumento (div. 828): o (ii) examina o texto do **JSX**; as frases em inglês que vivem em strings de
`.ts` — *"Title and Artist are required"*, *"No songs found in the file"*, *"Failed to parse file"*, *"Failed to save
content"*, *"Authentication required to upload files"*, *"Upload failed with status …"* — não são examinadas (os dois
hooks e o `upload-to-storage` saem com 0). A contagem de inglês é **por baixo**; o commit 2 as troca de qualquer jeito
(o erro vira espécie, a frase vem de `frases-upload.ts`).

## 5. Esperado da folha `[medido]`

`tests/gates-web/esperado/7-upload.ancoras.json` (novo): as duas da casca (as das folhas 4–6); as **caixas dos campos**
pelo rótulo do irmão anterior (*Título \**, *Artista \**, *Álbum*, *Gênero*, *Ano*, *Notas*, e o *Título* do criar),
com o contorno `lineInfo` **ou** `errorInk` (`UP-criar-validacao`); o **artista de cada linha do lote** pelo seletor da
grade (sem rótulo — o irmão anterior é o título, dado; pareia pela ordem, `#1…#4`); e a **zona de arquivo** (a caixa
tracejada de 240 não tem texto próprio e não seria nó — com a âncora, a altura mínima `web.zonaArquivo` se mede).
`cn/g-faixa-esperado.txt`:

```
$ pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 7-upload
7-upload: 170 caixa(s) de campo ancorada(s) · 21 seções · 20 com C e B · nós C 507 · nós B 507 → tests/gates-web/esperado/7-upload.json
  ✗ Tokens: sem a moldura C B
# exit: 0
```

170 = 80 da casca (2 × 20 estados × C e B) + 48 dos seis campos (`UP-detalhes`, `-inativo`, `-salvando`,
`-salvar-erro`) + 4 do título do criar + 24 dos artistas do lote (`UP-lote`, `-importando`, `-erro`) + 14 da zona (sete
estados). Controle: `4-content-lista` e `6-content-editor` re-medidos com o mesmo script saem **byte a byte iguais**
(`cmp …: iguais`). Nós por estado (C = B): `UP-carregando` 10 · `-como` 27 · `-arquivo` 21 · `-enviando` 20 ·
`-extensao` 22 · `-limite` 22 · `-envio-rede` 23 · `-envio-servidor` 23 · `-detalhes` 32 · `-detalhes-inativo` 33 ·
`-salvando` 32 · `-salvar-erro` 35 · `-criar` 21 · `-criar-validacao` 22 · `-lote` 31 · `-lote-importando` 31 ·
`-lote-erro` 33 · `-lote-vazio` 22 · `-lote-sucesso` 28 · `-pronto` 19. O texto da folha vai em claro (obra do projeto:
*Partitura de 12 páginas*, *Compositor anônimo*, *repertorio.docx*, os títulos do lote); **no aceite, a medição do app
só grava hash**.

**`UP-lote-lendo`** não entra no esperado (não há seção; div. 806). Proposta (decisão 13): medido **contra a seção
`UP-lote`** — a I1-E2 diz *"C e B iguais aos de `UP-lote-*`"* com *carregando…* no lugar da lista —, a lista e o
*carregando…* saem "sem par" e o que se mover (os botões sobem) é errata candidata coberta pela I1-E2 em `erratasFaixa`,
com o `n` da pré-verificação sem sessão (o molde da I1-E16/E17 da PR-10).

## 6. Como o aceite alcança cada estado sem escrever

`/add-content` é **cliente** (o SSR só confere a sessão, `app/add-content/page.tsx:10`). As escritas são duas rotas:
**`POST /api/storage/upload`** (`upload-to-storage.ts:36-40`) e **`POST /api/content`** (`lib/content-service.ts:511-518`,
uma por música no lote). **fab.** = `page.route()` respondendo no navegador com `x-g-faixa: fabricado`; **segurado** =
o `route()` não responde durante a medição (solto no fim, `fabricado sem resposta` no log, PR-11 §15); a barreira do
medidor aborta e **reprova** qualquer `POST/PUT/DELETE` a `/api/*` que não tenha sido fabricado (fora
`/api/auth/session`). Os **arquivos** são gerados em memória e entregues por `setInputFiles({ name, mimeType, buffer })`
— nenhum lido do disco; o corpo do `POST` fica no `route()` e **não sai**. Pressupõe a decisão 2 (a) — o passo 1
sozinho e o *Próximo*; com (b), as linhas `UP-arquivo`…`UP-criar-validacao` perdem o *Próximo* e o resto é igual.

| estado | como alcançar | escreve? |
|---|---|---|
| `UP-carregando` | o *chunk* do `add-content` (o `dynamic`, `add-content-page-client.tsx:10`) **segurado** no `route()` (`/_next/static/chunks/*add-content*` — `[hipótese]` sobre o nome no `next dev`, como o `content-edit-page-client` da PR-11, que casou) | 0 |
| `UP-como` | abre; *Importar de arquivo* · *Um arquivo*, com **Letra** (decisão 4: a partitura esconde os dois cartões) | 0 |
| `UP-arquivo` | + *Próximo* | 0 |
| `UP-enviando` | + `partitura-12-paginas.pdf` (1,8 MiB, `%PDF` + enchimento, em memória) com o `POST /api/storage/upload` **segurado** | 0 |
| `UP-extensao` | + `foto.heic` (o exemplo da folha; o prompt sugeria `.exe` — o `.heic` faz o texto parear) — validação do cliente, **nenhum request** (`[medido]` SONDA(3): `fetch chamado: 0`) | 0 |
| `UP-limite` | + um arquivo de **5 MiB** gerado; o `POST` **fab. 400** com o corpo do contrato (`details: [{ field: "size", … }]`); o 413 sem JSON, no Vitest | 0 |
| `UP-envio-rede` · `UP-envio-servidor` | o `POST` **abortado** (`route.abort('failed')` → `TypeError`) · **fab. 500**; 401 e 429 no Vitest | 0 |
| `UP-detalhes` · `-detalhes-inativo` | o `POST` **fab. 201** `{ url }` → o passo de detalhes; *Título* e *Artista* digitados (local) · só o *Título* | 0 |
| `UP-salvando` · `UP-salvar-erro` | `UP-detalhes` + *Salvar* com o `POST /api/content` **segurado** · **fab. 500**; rede, 400, 401, 429 no Vitest | 0 |
| `UP-pronto` | `UP-detalhes` + *Salvar*, `POST /api/content` **fab. 201** `{ id: "g-faixa-novo", title, artist }` → o `router.push('/content/g-faixa-novo')` **segurado** (a navegação `GET /content/g-faixa-novo…` no `route()`): a tela fica no pronto, que hoje pisca | 0 |
| `UP-criar` · `UP-criar-validacao` | *Criar do zero* + *Próximo* · + *Próximo* de novo com o título vazio (validação do cliente) | 0 |
| `UP-lote` | *Várias músicas num arquivo* + `repertorio.txt` (as quatro músicas da folha, separadas por `---`) com o `POST` de upload **fab. 201**; os artistas das duas primeiras digitados | 0 |
| `UP-lote-lendo` | o mesmo com `repertorio.pdf` (gerado com o `pdf-lib`) e o **worker do pdf.js** (`/pdf.worker.min.mjs`, `lib/pdf-utils.ts:14`) **segurado**: a leitura não termina | 0 |
| `UP-lote-importando` · `-erro` · `-sucesso` | `UP-lote` + *Importar todas* com os `POST /api/content` **segurados** · **fab. 500** · **fab. 201** × 4 | 0 |
| `UP-lote-vazio` | *Várias músicas* + um `.txt` só com linhas em branco (`parseTextContent` → 0 músicas) | 0 |

**Todo o upload é fabricável**: nenhum `POST` sai; lidos de verdade só a sessão (`/api/profile`, `securetoken`). O
roteiro dos textos digitados usa os exemplos da folha (*Partitura de 12 páginas*, *Compositor anônimo*, *Alceu
Valença*, *Luiz Gonzaga*) para os valores parearem.

**Cota**: 20 estados × 3 larguras + o controle ≈ **61 cargas com sessão** — **acima** das 60 em 15 min do
`/api/profile` (`lib/user-rate-limit.ts:54`). Proposta: o aceite em **duas rodadas** com 15 min entre elas — C e B
(`--project C-1138 --project B-711`, ~41) e depois A (`--project A-411`, ~21), mescladas por largura (o molde da PR-6
commit 4); o `COMO-RODAR` do commit 2 diz isso.

## 7. Inalcançáveis com sessão (e a prova prevista)

| o quê | por quê | prova |
|---|---|---|
| `UP-carregando` pelo `isLoading` do Firebase | com sessão, o `isLoading` passa antes de qualquer `route()` alcançar (o `EDIT-carregando-auth` da PR-11) | pré-verificação sem sessão (fumaça com `isLoading`) + Vitest |
| `UP-carregando` pelo "sem usuário" (o `return null` de hoje) | sem usuário não há sessão no perfil; o servidor manda ao `/login` | pré-verificação **sem `.env`** + Vitest |
| as variantes de motivo (401, 429, 400, 413, "sem URL") de `UP-envio-servidor`, `UP-limite`, `UP-salvar-erro`, `UP-lote-erro` | a seção desenha uma espécie; as outras são nota | Vitest (a espécie → a frase, uma por status) |
| `up.lote.ler` (a variante de `UP-lote-vazio`) | alcançável (um `.pdf` inválido gerado), mas **sem seção** | Vitest + pré-verificação |
| as Opções avançadas abertas | alcançável, **sem seção** (a folha desenha fechado) | pré-verificação (`scrollWidth` e (e)/(b) nas três larguras) |

## 8. O "antes" — proposta

O upload **não está** em `cn-main` (`tests/gates-web/medicoes/cn-main/`: `content`, `dashboard`, `landing`, `library`,
`login`, `privacy-policy`, `setlists`) — a PR-5 não o mediu (§3 do README dela).

| opção | como | o que prova | custo |
|---|---|---|---|
| **(a) recomendado — commit 1b, só instrumento** | a superfície `add-content` no medidor, **fabricada**, estados `base-*` do web velho: `base-criar` (abre: o passo 1 com o criar), `base-arquivo` (*Import from File*: o passo 1 com a zona), `base-detalhes` (upload fab. 201 → o formulário), `base-lote` (lote `.txt` → o `BatchPreview`), `base-pronto` (salvar fab. 201 + a navegação segurada); o Marcel mede sobre o 1b (código do app = `main`), como na PR-10 | no commit 3, o antes × depois: **nó velho por componente = 0** e a casca sem Δ (o `casca-efeito` da PR-11); e o (b) do upload velho em 411, se houver | ~16 cargas (5 estados × 3 + o controle); o instrumento do 1b é o mesmo que o commit 2 precisa (só os estados mudam) |
| (b) "sem antes", declarado | nenhum; o commit 3 prova só pelo G-tok (os literais velhos 526 → 0) e pelo Vitest | que nenhuma frase velha sobrou só pelo código, não pela tela | 0 |

Recomendo **(a)**: o upload é a superfície com mais telas velhas (três passos, dois ramos do passo 1, o lote), e é o que
a PR-11 teve (os cinco `base-*` do 1b da PR-10). As frases velhas do antes × depois (`FRASES_VELHAS`) saem do §3.

## 9. Token

Nenhum falta `[hipótese até o commit 2]`: `web.zonaArquivo` (`--faixa-zona-arquivo`, 240, já em
`app/styles/identidade.css:87`), `radius.chip` (os passos), `faixa-metadado` (13), `marcado` (accent 12 %),
`touch.min`/`touch.list`, `campo-duas-linhas` (as *Notas*, 96 — derivado na PR-11), `campo-letra` (o corpo do criar,
se a decisão 5 for (a)); ícones `garantida` (I1-E6: o visto do *Salvar*/*Próximo* e o pronto de 28), `adicionar`
(*Importar todas*), `voltar`, `falha`, `sem conexão`, `tentar novamente` e os quatro tipos — todos no catálogo. O ícone
da linha do arquivo (`UP-detalhes`) é conferido no commit 2. Se faltar, paro e pergunto (div. 713).

## 10. Decisões a pedir (não decididas) — para o aval

0. **Extra do commit 1** (o rito: declarado aqui): `tests/gates/i1-upload-post.test.tsx` + `tests/gates/fixtures/
   upload-post-antes.json` gravados sobre a `main` — o gate byte a byte que o prompt pede no commit 2 (§3), gravado
   **agora** porque o "antes" tem de ser o código da `main`; e a sonda do §2.3 como anexo (`cn/`). Aprova?
1. **O "antes"** (§8): **(a) recomendado** — commit 1b só com o instrumento, medido por você; (b) "sem antes".
2. **Os passos** (div. 808): a folha põe a zona, o criar e o lote no **passo 2** (tela própria, com *Voltar*) e o
   passo 1 (*como*) **sozinho e sem controle de avanço**; hoje o passo 1 é uma tela só (os seletores **e**, abaixo, a
   zona ou o criar). **(a) recomendado** — a folha: o passo 1 com um ***Próximo*** (`up.proximo`, frase existente) na
   linha de botões à direita, como o do `UP-criar` — errata **I1-E21** (de estado: *"o passo 1 tem Próximo"*, os nós
   dele "sem par" e nada se move); **mudança de fluxo declarada** (um clique a mais), com o *Voltar* do passo 2
   devolvendo o passo 1 com as escolhas. (b) a tela de hoje (o passo 1 com a zona ou o criar abaixo) — errata de
   leitura sobre os 12 estados do passo 2 que mostram a zona ou o criar (tudo desce a altura dos seletores: erratas
   candidatas em todos, em C e em B) e o chip do passo segue *1*.
3. **A ordem dos seletores** (div. 809): a folha desenha *como → tipo → importar*; a nota dela diz *"os três seletores
   de hoje numa tela, na ordem de hoje"* (*tipo → como → importar*). Trocar o tipo **zera** o modo
   (`useAddContentLogic.ts:49-74`): na ordem do desenho, escolher *Importar de arquivo* e depois *Cifra* volta a *Criar
   do zero*. **(a) recomendado** — a ordem de hoje (a nota); errata **I1-E22** de leitura (os blocos trocam de lugar em
   `UP-como` e `UP-lote-sucesso`: candidatas cobertas). (b) a do desenho, com o zerar de hoje (a regressão acima). (c)
   a do desenho sem o zerar (muda comportamento).
4. **A partitura no passo 1** (div. 810): a folha marca *Partitura* com *Criar do zero* e *Várias músicas* visíveis;
   hoje a partitura esconde o *como* inteiro (`RefactoredAddContent.tsx:134`) e só aceita *Um arquivo*
   (`ImportModeSelector.tsx:30-32`). **(a) recomendado** — o comportamento de hoje (sem os dois); o aceite mede
   `UP-como` com **Letra** (o marcado muda de cartão, a geometria não). (b) a folha (a partitura ganharia um criar sem
   editor — muda comportamento).
5. **O criar do zero** (div. 811): a folha desenha só o *Título* (a nota: *"depois do título vem o editor do tipo
   (superfície 6)"*); hoje o mesmo cartão tem o texto (12 linhas) e dez dicas. **(a) recomendado** — o *Título* e,
   abaixo, o **corpo** num campo `campo-letra` (5 × `touch.min`, o da letra da folha 6) com o rótulo do tipo (*Letra*
   · *Cifra* · *Tab*) e o placeholder `edit.letra.placeholder` na letra; as dicas morrem (como as da PR-11). O corpo
   "sem par" e o *Voltar*/*Próximo* descendo → errata **I1-E23** de leitura em `UP-criar` e `-validacao`. (b) a folha
   ao pé da letra (sem o corpo: o conteúdo criado sai vazio — muda o que se grava).
6. **As linhas do lote** (div. 813): a folha desenha *número · título (texto) · artista (campo)*; hoje cada música tem
   *incluir*, o **título editável**, o artista e o **corpo editável** (4 linhas). **(a) recomendado** — a grade da
   folha **com** os controles de hoje: o título num campo (âncora `campo-lote-titulo`), a caixa *Incluir “{título}”*
   no início da linha e o corpo num campo de duas linhas abaixo dela — errata **I1-E24** de leitura (as linhas mais
   altas). (b) a folha (perde incluir/título/corpo — muda comportamento).
7. **O botão de `UP-lote-erro`** (div. 814): a folha escreve *Salvar*; `UP-lote` e `-importando` e a §5.8 dizem
   *Importar todas* / *Importando…*. **(a) recomendado** — *Importar todas* (errata de frase **I1-E25**; o nó da folha
   "sem par"). (b) *Salvar* nesse estado.
8. **A segunda linha do erro de salvar** (div. 815): a folha escreve *o que você **preencheu** continua aqui*; a N2
   (§5.10) é *o que você **escreveu** continua aqui* (a do editor, PR-11). **(a) recomendado** — a N2, uma frase só no
   bloco (errata de frase **I1-E26**). (b) *preencheu* como frase nova, só no upload.
9. **O pronto** (div. 816): a folha tem só *Ir para a biblioteca*; hoje há também *Add Another* / *Import More*. O
   pronto **pisca** antes do `router.push('/content/{id}')`. **(a) recomendado** — a folha (o secundário sai; o
   *Adicionar* da casca já reinicia o formulário, `add-content-page-client.tsx:22-25`) — remoção declarada. (b) mantém
   com frase nova (*Adicionar outra*).
10. ***Back* do passo 1** (div. 817): a folha não o desenha; hoje é `router.back()`. **(a) recomendado** — sai (a casca
    navega) — remoção declarada. (b) fica como *Voltar*.
11. **O limite e o erro do envio** (div. 825, 826): **(a) recomendado** — pela resposta do servidor, zero mudança de
    comportamento: o `Error` de `uploadToStorage` passa a levar `status` e `details` (aditivo, o molde da PR-9/PR-11);
    a tela escolhe: 413, ou 400 com um `details` de `field: "size"` → `up.limite` (sem ação) · o outro 400 (tipo, MIME,
    *magic bytes*) → `up.erro.envio` + `motivo.recusado` (sem ação) · `TypeError` → rede (*Tentar de novo*) · 401/403 e
    sem token → auth · 429 → limite · 5xx e "sem URL" → servidor (*Tentar de novo*). *Tentar de novo* repete o **mesmo**
    `POST` (o mesmo arquivo). O mesmo `status` aditivo em `createContent` (`lib/content-service.ts:519-521`) para o
    salvar e o lote. (b) um teto também no cliente (o arquivo de 5 MiB não sairia — muda comportamento: um `POST` a
    menos).
12. ***Tentar de novo* do lote** (div. 827): repete *Importar todas* com as marcadas — numa falha **no meio**, as
    primeiras já gravaram e são gravadas de novo (hoje: clicar *Import All* outra vez faz o mesmo). **(a)
    recomendado** — como hoje (herança nomeada, sem conserto). (b) só as que faltaram (muda comportamento).
13. **`UP-lote-lendo`** (I1-E2, div. 829): **(a) recomendado** — o passo 2 do lote com *carregando…* no lugar do
    cabeçalho e da lista (o *{n} músicas encontradas* não se sabe ainda) e o *Voltar*; medido contra a seção `UP-lote`
    com a I1-E2 em `erratasFaixa` (§5). (b) *carregando…* dentro da zona (a forma do `UP-enviando`, a proposta da div.
    587 que a errata não seguiu).
14. **O Tom das Opções avançadas** (div. 821): `key={formData.key}` (`RefactoredMetadataForm.tsx:100`) é a `key` do
    React, não uma prop — o `Select` recebe `key` indefinido e **remonta** a cada escolha: o tom escolhido vai no corpo,
    mas a caixa volta a *"Select key"* `[lido; hipótese de tela]`. **(a) recomendado** — a seleção nativa nova mostra o
    valor (o corpo não muda; é o conserto de um defeito de tela, declarado). (b) reproduzir o defeito.
15. **As frases novas** (§3): *PDF, DOCX, TXT ou imagem* · *{n} músicas encontradas em {arquivo}* · *{nome} ·
    {tamanho}* (MiB com uma casa e vírgula) · os sete placeholders · a forma da lista com *ou* · *Incluir “{título}”* ·
    *corpo de “{título}”* · e o reuso das da §5.7 nas Opções avançadas. Aprova?
16. **As cópias da folha** (div. 812): `UP-criar` e `-criar-validacao` trazem a linha do arquivo (*partitura-12-
    paginas.pdf · 1,8 MiB*) — não há arquivo no criar; os nós saem "sem par" (sem errata), listados — aceita?

**O que fica de herança D, não tocado** (o gate byte a byte o prende): *Ano*, *Capo*, *Afinação* não vão; *Compasso* e
*favorita* se perdem pelo nome (div. 820); a importação de texto grava só o `file_url` (div. 823); *"Unknown Artist"*
(div. 824); o lote sobe o arquivo ao Storage **antes** de ler e nunca o referencia — um objeto órfão por lote (div. 822).

### 10.1 O aval do commit 1 — decisões `[Marcel, 2026-09-29]`

(Transcrição do prompt dos commits 1 (fecho), 1b, 2 e 3; as perguntas ficam acima.)

0. **Extra aprovado**: `tests/gates/i1-upload-post.test.tsx` + a fixture gravada sobre a `main`.
1. O "antes" = **(a)**: commit 1b só com o instrumento; a medição é do Marcel.
2. Os passos = **(a)**: a folha, com *Próximo* no passo 1 — **I1-E21**; mudança de fluxo declarada (um clique a mais),
   com teste.
3. A ordem dos seletores = a de hoje, *tipo → como → importar* — **I1-E22**.
4. A partitura esconde *como* e *Várias músicas*, como hoje; `UP-como` medido com **Letra**.
5. **Criar do zero = Título + Próximo** (a folha e a §5.8), **sem campo de corpo**; o `POST` não muda. Se o conteúdo
   criado sai vazio sem ir ao editor, registra-se como **herança D** com linha. Sem I1-E23.
6. A grade da folha no lote, **mantendo** incluir, título e corpo editáveis — **I1-E24**.
7. *Importar todas* em `UP-lote-erro` — **I1-E25**.
8. A N2, *o que você escreveu continua aqui* — **I1-E26**.
9. O pronto pela folha; *Add Another* / *Import More* sai (remoção declarada).
10. O *Back* do passo 1 sai (remoção declarada).
11. O limite e o erro do envio pela resposta do servidor (`status` + `details` aditivos no `Error`); 413 e 400 com
    `field: "size"` → `up.limite`; o outro 400 → *o servidor recusou os dados*; rede → `motivo.rede`.
12. *Tentar de novo* do lote como hoje; **a regravação das músicas já gravadas numa falha a meio é duplicação de dado →
    herança D**, com linha.
13. `UP-lote-lendo` = *carregando…* no lugar da lista; a I1-E2 em `erratasFaixa`, medido contra `UP-lote`.
14. O Tom das Opções avançadas mostra o valor escolhido (o `key={formData.key}` era a `key` do React) — defeito de tela
    declarado; o corpo intocado (o gate 4/4 prova).
15. As frases novas do §3 aprovadas; entram na lista do bloco.
16. Os nós da folha copiados para o criar (a linha do arquivo) ficam "sem par", listados.
17. **Div. 828**: herança de instrumento (o G-tok não lê `.ts`); listar os hooks com inglês voltado ao usuário;
    destino: o encerramento do I1.
18. **Cota**: o aceite em duas rodadas (C+B; A 15 min depois) **ou** por estado; o `COMO-RODAR.md` diz qual e o porquê.

## 11. Divergências — 806 a 830

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **806** | P | *"as 21 `<section data-estado>` da folha (20 + `UP-lote-lendo`)"* | 21 seções = **20 estados + `Tokens`**; `UP-lote-lendo` não tem seção (I1-E2) | esperado com 20; `UP-lote-lendo` contra `UP-lote` (decisão 13) |
| **807** | P | *"o limite real é 4 MiB — `app/api/storage/upload/route.ts`"* | o número vive em `lib/api-schemas.ts:259` (`storageSchemas.upload`), que a rota aplica (`route.ts:42-52`); o cliente não cobra tamanho | §2.4; o teste lê o schema |
| **808** | D | *"os três passos de hoje (como · detalhes · pronto)"* | a zona e o criar estão no passo 1 de hoje; a folha os desenha no passo 2, sem controle de avanço no passo 1 | decisão 2 |
| **809** | D | nota de `UP-como`: *"na ordem de hoje"* | o desenho: *como → tipo → importar*; hoje *tipo → como → importar*, e trocar o tipo zera o modo | decisão 3 |
| **810** | D | `UP-como` com *Partitura* e os dois cartões | a partitura esconde o *como* e o lote (`RefactoredAddContent.tsx:134`, `ImportModeSelector.tsx:30-32`) | decisão 4 |
| **811** | D | `UP-criar`: só o título | o criar tem o corpo e dez dicas (`content-creator.tsx:150-173`) | decisão 5 |
| **812** | D | — | `UP-criar`/`-validacao` com a linha do arquivo (cópia de `UP-detalhes`) | decisão 16 |
| **813** | D | `UP-lote`: número · título · artista | hoje: incluir · título editável · artista · corpo editável (`batch-preview.tsx:75-130`) | decisão 6 |
| **814** | D | — | `UP-lote-erro` escreve *Salvar* | decisão 7 |
| **815** | D | N2 *escreveu* | a folha escreve *preencheu* | decisão 8 |
| **816** | D | `UP-pronto` com um botão | hoje dois (`CompletionStep.tsx:37-49`) | decisão 9 |
| **817** | D | `UP-como` sem *Voltar* | hoje *Back* (`RefactoredAddContent.tsx:106-113`) | decisão 10 |
| **818** | A | decisão 24: *"a cópia velha no passo 1"* | `[medido]` SONDA(1): o erro do salvar reaparece no passo 1 depois de *Cancel* (`useAddContentLogic.ts:259` → `RefactoredAddContent.tsx:118-126`) | consertar (requisito); teste que reprova na `main` |
| **819** | A | *"passo 3 do lote inalcançável"* | `[medido]` SONDA(2): toast *"2 songs imported successfully"* e o passo 1 (`RefactoredAddContent.tsx:57` exige `createdContent`; o `BatchPreview` grava por conta própria) | `UP-lote-sucesso` (a linha de sucesso sobre o passo 1) |
| **820** | A | — | *Ano*, *Capo*, *Afinação* não vão no corpo; *Compasso* e *favorita* se perdem pelo nome (`useMetadataForm.ts:85-86` × `useAddContentLogic.ts:217-218`, `:248-249`) — `[medido]` no gate | herança D, não tocada |
| **821** | A | — | `key={formData.key}` é a `key` do React (`RefactoredMetadataForm.tsx:100`): o Tom não se mostra depois de escolhido `[lido]` | decisão 14 |
| **822** | A | — | o lote sobe o arquivo ao Storage (`FileUploadZone.tsx:39`) e só depois lê; o `url` nunca é gravado (o `BatchPreview` grava `content_data`) — objeto órfão por lote | herança (Storage/Bloco D), registrada |
| **823** | A | — | importar um arquivo de texto grava só o `file_url` (sem `content_data`) — `[medido]` no gate | herança, registrada (não é tela) |
| **824** | A | *"sem inglês"* | *"Unknown Artist"* é valor gravado (`useAddContentLogic.ts:158`, `:207`, `:233`) — `[medido]` no gate | fica (I1-D9); herança D |
| **825** | A | `UP-envio-servidor`: 401 · 429 · 5xx | a rota devolve 400 também para tipo, MIME e *magic bytes* (`route.ts:29-91`) | decisão 11 (`motivo.recusado`) |
| **826** | A | `UP-limite`: *"api-schemas.ts:259 → upload-to-storage.ts:44"* | o 400 do teto só se distingue pelo `details` (`field: "size"`); o 413 vem sem JSON — `[medido]` SONDA(4), (5) | decisão 11 |
| **827** | A | — | o lote grava em série; a falha no meio deixa as primeiras gravadas e *Import All* de novo as duplica (`batch-preview.tsx:43-71`) | decisão 12 |
| **828** | T | o G-tok (ii) acusa todo inglês | não examina strings de `.ts` (os hooks e o `upload-to-storage` saem 0) | registrado; contagem por baixo |
| **829** | A | I1-E2: *"`useAddContentLogic.ts:138`, `isParsing`"* | `isParsing` existe e **não é devolvido** (`:267-290`): nenhuma tela o lê | decisão 13 |
| **830** | D | frases da §5.8 | a folha escreve fora dela: o apoio do importar, *{n} músicas encontradas em {arquivo}*, *{nome} · {tamanho}*, sete placeholders, a lista com *ou* | decisão 15 |

Próxima divergência: **831**.

## 12. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | navegador | só a folha por `file://` (`g-faixa-esperado.ts`) |
| executor | `next dev` | nenhum neste commit |
| executor | Vitest do upload (o gate e a sonda) | jsdom, `fetch` falso (nada sai); arquivos gerados em memória |
| — | `packages/identidade` | **não mudou** |
| — | código do app (`app/`, `components/`, `lib/`, `hooks/`) | **0 linha** — o commit 1 é gate, esperado, o teste do `POST` e docs |

---

## 13. Commit 1b — o instrumento (só medição) `[medido]`

Decisão 1 do aval: o "antes" é do Marcel, sobre o 1b (código do app = `main`).

| arquivo | o quê |
|---|---|
| `scripts/gates-web/g-faixa-upload.ts` (novo) | o upload fabricado: o `POST /api/storage/upload` e o `POST /api/content` no `route()` (201, erro, segurado, abortado); os arquivos gerados em memória (`partitura-12-paginas.pdf`, 1,8 MiB; `repertorio.txt`, as quatro músicas da folha); a navegação a `/content/g-faixa-novo` segurada; `clicarAte` (o clique repetido até o efeito — div. 795); os estados `base-criar`, `-arquivo`, `-detalhes`, `-lote`, `-pronto` com os seletores do web velho |
| `scripts/gates-web/g-faixa-superficies.ts` | a superfície `add-content` (`/add-content`, `implementada: false`, folha `7-upload`) |
| `scripts/gates-web/COMO-RODAR.md` | "I1-PR12 antes" |

Nenhuma linha de `app/`, `components/`, `lib/`, `hooks/`.

**A fumaça do 1b** (sem sessão): `next dev -p 3110` numa cópia da árvore **sem `.env*`**, com uma página
`app/fumaca-i1pr12/page.tsx` que monta o `AddContent` (o corpo da rota, sem a casca) e, **só na cópia**, o
`getValidToken` e o usuário do hook falsos (sem Firebase o upload pararia no token — o que o perfil com sessão não
faz). Os mesmos `ESTADOS_UPLOAD_ANTES`, com a barreira de escrita no contexto:

```
base-criar OK Back Upload Add Details Complete Content Type Lyrics Chords Tab Sheet How would you like to add content? Create New Start from scratch and build your content ma
base-arquivo OK Back Upload Add Details Complete Content Type Lyrics Chords Tab Sheet How would you like to add content? Create New Start from scratch and build your content ma
base-detalhes OK Back Add Content Details Back Add Metadata Fill in the details for your content Content Details Title * Artist * Album Genre Year Notes Advanced Options Cancel 
base-lote OK Back Add Content Details Back Import All
base-pronto OK 🎉 Done! Your music is now part of your library. "Partitura de 12 páginas" by Compositor anônimo Your new content is now available in your library Add Another G
escritas não fabricadas abortadas: 0
```

A cópia e o servidor foram removidos depois. O que a fumaça não prova: a rota com a casca e a sessão (é a rodada do
Marcel).
