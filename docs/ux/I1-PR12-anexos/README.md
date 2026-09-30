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
> **Estado**: commit 1 (gate-first, `e5fdf5f`) com o aval (§10.1); commit 1b (instrumento, `7b33d06`, §13); o "antes" (§14);
> commit 2 (a implementação, `9bac7bb`, §15–§22) e **commit 3 (aceite e docs, §23)**. **Veredito do aceite: PASSA — (e) = 0
> e (b) = 0 nas três larguras, nos 21 estados da folha 7 e nos 5 do "antes"; 122 erratas candidatas, todas cobertas
> (I1-E22 32 · I1-E24 70 · I1-E27 18 · I1-E2 2); nó velho por componente 0.** **Aval do veredito dado** `[Marcel, 2026-09-30]`
> (§23.8); commit 4, as decisões do aval (só docs).
> PR [#347](https://github.com/marcelviana/octavia/pull/347).

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
o texto novo. **Não foram tocados** no commit 2 (div. 837): são auditorias da Fase D, sob demanda contra preview/prod;
os seletores se trocam quando o gate voltar a ser usado — herança nomeada (§21).

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

---

## 14. O "antes" `[medido]` — e a I1-D37

`tests/gates-web/medicoes/casca-efeito/antes/add-content.json`: a rodada do **Marcel** (`2026-09-30T11:23:51Z`, sobre
`7b33d06`), cinco estados × três larguras — `base-criar` 31 nós · `base-arquivo` 34 · `base-detalhes` 32 · `base-lote` 30 ·
`base-pronto` 15; `scrollWidth` = viewport nos 15; os não-`GET` a `/api/*`: `POST /api/auth/session` (o cookie) e os
`POST /api/storage/upload` e `POST /api/content` **`fabricado 201`**; `prodAbortados` 0.

**Decisão I1-D37** `[Marcel, 2026-09-30]`: a partir desta PR, **o executor roda o aceite e o "antes"** com o perfil
persistente `~/.octavia-g-faixa-perfil` (já logado pelo Marcel) contra `localhost:3000`, com o `pnpm dev` da árvore e o
`.env.local` do Marcel, que ele carrega e não abre. Condições, todas no instrumento: nenhum `POST`/`PUT`/`DELETE` real
(a barreira aborta e reprova), nenhum request a prod, nenhuma conta, nenhum `.env*` aberto, leitura só do que o medidor
já lia, a cota respeitada. A I1-D35 fica com errata (`docs/ux/I1-PRECHECK.md` §0.1): *"o executor não digita senha"*
continua; *"o Marcel roda"* cai.

O "antes" já estava na árvore quando a I1-D37 chegou; rodei-o de novo como pedido, **em pasta à parte**, e comparei
(`cn/antes-duas-rodadas.txt`) — fica o do Marcel (div. 840):

```
rodada do Marcel: 2026-09-30T11:23:51.563Z 7b33d06 · rodada do executor (I1-D37): 2026-09-30T11:29:13.386Z 7b33d06
(estado × largura) 15 · nós byte a byte iguais em 15
1138 executor — não-GET: [('POST', '/api/content', 'fabricado 201'), ('POST', '/api/storage/upload', 'fabricado 201')] · prodAbortados 0
```

(O `pnpm dev` que serviu as duas rodadas é o que o Marcel deixou de pé nesta árvore, na 3000 — o executor não subiu
outro: a porta estava tomada pelo mesmo código e pelo mesmo `.env.local`.)

## 15. Commit 2 — o que mudou `[medido]`

### 15.1 Por grupo (linhas antes → depois)

| grupo | arquivos | o quê |
|---|---|---|
| **a rota** | `components/add-content-page-client.tsx` 71 → 64 | os três carregamentos (o `isLoading` fora da casca, o pedaço do `dynamic`, o `return null`) viram **um** *carregando…* na casca (resposta 14); o invólucro `flex-1 bg-[#fffcf7]` saiu. `app/add-content/page.tsx` **intocado** |
| **os passos** | `RefactoredAddContent.tsx` 177 → 101 · `StepIndicatorComponent.tsx` 60 → 24 · `ContentTypeSelector.tsx` 77 → 37 · `ModeSelector.tsx` 100 → 34 · `ImportModeSelector.tsx` 83 → 35 | o título com os chips (*1 como · 2 detalhes · 3 pronto*); o passo 1 só com os seletores, na ordem de hoje (I1-E22), e o *Próximo* (I1-E21); a partitura esconde o *como* e o lote (decisão 4); o *Back* do passo 1 saiu (decisão 10); o alerta do passo 1 (a cópia velha) morreu |
| **a zona** | `FileUploadZone.tsx` 117 → 107 · `upload-to-storage.ts` 52 → 57 | `web.zonaArquivo`, *até 4 MiB*, *enviando o arquivo…* + *{nome} · {tamanho}*; a extensão sob a zona; o limite e o envio na linha da tela, pela espécie; *Tentar de novo* repete o mesmo envio. O `FormData` **intocado**; o `Error` leva `status` e `details` (aditivo) |
| **o criar** | `content-creator.tsx` 187 → 49 | *Título* + *Voltar* · *Próximo* (decisão 5); a validação sob o campo; o ramo morto, o texto e as dez dicas saíram |
| **os detalhes** | `DetailsStep.tsx` 102 → 77 · `metadata-form/RefactoredMetadataForm.tsx` 134 → 71 · `BasicMetadataFields.tsx` 109 → 45 · `AdvancedMetadataFields.tsx` 141 → 61 | a linha do arquivo, a grade de duas colunas (uma em B e A), *Opções avançadas ▾*, *Cancelar* · *Salvar*/*Salvando…*; o motivo ao lado do *Salvar* inativo; a falha do salvar na linha da tela com a N2 e *Tentar de novo*; o Tom mostra o valor (decisão 14); `UP-lote-lendo` (I1-E2) |
| **o lote** | `batch-preview.tsx` 148 → 99 | a grade da folha mantendo incluir, título, artista e corpo (I1-E24); *Importando…*; a falha na linha da tela; o sucesso volta ao passo 1 com *{n} músicas importadas* (os três toasts saíram) |
| **o pronto** | `CompletionStep.tsx` 54 → 30 | `garantida` 28 · *pronto* · *“{título}”, de {artista}, está na biblioteca* · *Ir para a biblioteca* (decisão 9: *Add Another* saiu) |
| **os hooks** | `hooks/useAddContentLogic.ts` 290 → 265 · `hooks/useMetadataForm.ts` 112 → 110 | `falhaDoLote` (*vazio* \| *ler*) no lugar do `error` cru; **a cópia do erro de salvar morreu**; `isParsing` e `lerDeNovo` devolvidos; os três arranjos de rótulos em inglês saíram. No formulário: `falha` (o erro como veio) no lugar de `error`/`success`. **O que cada um envia é o de antes** — o ramo morto de lote do `handleSaveContent` e o `isProcessing` ficaram (não são tela) |
| **nasceram** | `components/upload/frases-upload.ts` (131) · `falhas-do-upload.ts` (61) · `pecas.tsx` (86) | as frases (§5.8 + N8, N2, as novas) e o `LIMITE_MIB`; as espécies do envio e da escrita; a escolha, o botão do passo, o campo, a validação, a espera |
| **morreram** | `lib/content-type-styles.ts` (49) · `tests/components/add-content.refactoring.test.tsx` (25 casos) | o primeiro sem importador (`git grep` → 0); o segundo mockava os seis passos e o hook (a estrutura velha) — as intenções dele estão no `upload-estados.test.tsx`, com os componentes reais |
| **o serviço** | `lib/content-service.ts` (+3/−2) | `createContent`: o `Error` leva o `status` (aditivo; sem token = 401), como o `updateContent` da PR-11 |
| **extras** | §15.4 | `components/auth/aviso-de-sessao.tsx` |
| **instrumento** | `scripts/gates-web/g-faixa-upload.ts` · `g-faixa-superficies.ts` · `g-tok-arquivos.txt` (−1, +3) · `COMO-RODAR.md` ("I1-PR12") | os 21 estados da folha + os cinco `base-*`, tudo fabricado; `add-content` implementada |
| **docs do congelamento** | `DESIGN-I1/README.md` (§2.2: I1-E21, E22, E24, E25, E26 e a E27 proposta; §5.1: as frases da PR-12) · `erratas.json` (`erratasFaixa`: E2, E22, E24, E27; `erratasFrase`: E21, E25, E26) · `SHA256SUMS` (a linha do `README.md`: `c09d409a…` → `d978bfa3…`; `shasum -a 256 -c` → **14/14 OK**) · `I1-PRECHECK.md` §0.1 (a errata da I1-D35) | — |

### 15.2 A sonda da `main` — e como ficou

| sonda (§2.3, `cn/sonda-upload-main.txt`) | na `main` | agora |
|---|---|---|
| (1) o erro do salvar no passo anterior, depois de *Cancel* | `role=alert: Failed to create content` | nenhum alerta: o erro é do formulário e some com ele (`useAddContentLogic.ts`, o `catch` só propaga) |
| (2) o lote importado | toast *"2 songs imported successfully"* e o passo 1, mudo | o passo 1 com *2 músicas importadas* na linha da tela (sucesso), sem toast — **o passo 1, não o 3** (div. 831) |
| (3) a extensão | toast, em inglês | *tipo de arquivo não aceito: foto.heic — use .pdf, .docx ou .txt*, sob a zona; nenhum request |
| (4) o limite, 400 | toast *"Validation failed"* + *"(max 50MB)"* na tela | *o arquivo passa de 4 MiB — escolha um menor*, sem ação; *formatos: … · até 4 MiB* |
| (5) o limite, 413 | toast *"Upload failed with status 413"* | a mesma frase do limite |
| (6) a rede | toast *"Failed to fetch"* | *o arquivo não foi enviado — sem conexão* + *Tentar de novo* |

### 15.3 O limite: onde o servidor cobra e o texto que o cita

O servidor cobra em `lib/api-schemas.ts:259` (`storageSchemas.upload.size`, 4 × 1024 × 1024, inclusivo), aplicado por
`app/api/storage/upload/route.ts:42-52`; **nenhum dos dois mudou**. O texto cita `LIMITE_MIB`
(`components/upload/frases-upload.ts`) em `up.formatos` e `up.limite`. O `components/upload/__tests__/limite.test.ts`
acha o teto do servidor **pelo schema** (o maior `size` que o `safeParse` aceita, por busca binária — sem depender do
zod por dentro) e cobra `teto === LIMITE_MIB × 1024 × 1024` e as duas frases com esse número: se o teto mudar, reprova
até o texto mudar. O cliente segue **sem** cobrar tamanho (decisão 11): o arquivo grande sobe e é a resposta que diz.

### 15.4 Extras — declarados; **aprovados no aval do veredito** `[Marcel, 2026-09-30]` (§23.8)

O prompt do aval pediu para seguir até o veredito sem parar; os extras vão declarados aqui, no corpo da PR e no relato:

- **`components/auth/aviso-de-sessao.tsx`** — `/add-content` entra em `ROTAS_QUE_DESENHAM_A_LINHA`: a falha da sessão é
  desenhada DENTRO da tela (a `LinhaDaTela`, abaixo do título), como no painel, na biblioteca, na visualização e no
  editor; sem isso, com a sessão caída haveria duas linhas (a do topo e a da tela).
- **I1-E27** (proposta aqui; **aprovada** no aval do veredito — div. 834) — a linha do arquivo copiada em `UP-criar`/`-validacao` (decisão 16: "sem par") empurra
  o que vem abaixo 44 px na folha: 18 erratas candidatas (C e B) que precisam de cobertura. Proposta: *"a seção vale sem
  a linha"* (o molde das I1-E7…E10). Está em `erratasFaixa` marcada PROPOSTA; se não for aprovada, sai e o veredito
  acusa as 18 sem cobertura.
- **O caso "criar do zero" do gate byte a byte foi regravado sobre a `main`** (div. 832) — a decisão 5 tirou o campo de
  corpo, então o roteiro não pode mais digitar o texto; regravado numa worktree temporária de `434ba79` com o MESMO
  roteiro sem esse passo (`content_data: {"lyrics":""}` no lugar de `{"lyrics":"La la la, la la lá"}`); os outros três
  casos saíram byte a byte iguais aos do commit 1.
- **Frases fora do §3**: o singular (*1 música encontrada em …*, *1 música importada*); o tamanho em KiB e em B abaixo de
  0,1 MiB; *passo {n} de 3* (é da folha, no `aria-label`); o *▴* quando as Opções avançadas estão abertas.
- **O medidor**: `clicarAte` confere o efeito antes de clicar de novo (o alvo pode já ser outro botão de mesmo nome — o
  *Próximo* do criar); o lote da folha nomeado `repertorio.docx` com o tipo `text/plain` (o texto pareia com a folha).

## 16. Os testes `[medido]`

| teste | o quê | aqui | na `main` |
|---|---|---|---|
| `tests/gates/i1-upload-post.test.tsx` | o `FormData` do envio e o corpo de cada `POST /api/content`, quatro fluxos, **byte a byte** contra a fixture da `main` (só os seletores, o clique no *Próximo* do passo 1 e, no criar, o texto que não se digita — div. 832) | **4/4** (1 pulado, o `CN_GRAVAR`) | 4/4 (é o antes) |
| `components/upload/__tests__/upload-estados.test.tsx` | os cinco pedidos (abaixo) + a espera, o envio por espécie, o salvar por espécie, o lote | **30/30** | **30 falham** (`cn/upload-estados-main.txt`) |
| `components/upload/__tests__/limite.test.ts` | o texto × o teto do servidor (§15.3) | **3/3** | a suíte falha no import (`frases-upload` não existe) |
| `hooks/__tests__/useMetadataForm.test.ts` | adaptado: `falha` no lugar de `error`/`success` (3 casos, a mesma intenção ADD-14/ADD-01) | 3/3 | — |
| `tests/hooks/useAddContentLogic.test.ts` | adaptado: 1 asserção (`falhaDoLote` no lugar de `error`) | 20/20 | — |
| `hooks/__tests__/useAddContentLogic.test.ts` | ADD-13/ADD-14 — **intocado** | 5/5 | — |
| `tests/components/add-content.refactoring.test.tsx` | **morto** (25 casos, 4 já pulados): mocks da estrutura velha | — | 21/21 |
| CN da PR-1 · editor · `PUT` | — | **15/15 · 14/14 · 5/5** | — |

**Os cinco que têm de reprovar na `main`** (os seletores aceitam o rótulo de antes e o de agora — a reprovação é do
comportamento; `cn/upload-estados-main.txt`):

```
1 · a cópia velha … > salvar falha → Cancelar: nenhum alerta na tela
AssertionError: expected [ 'Failed to create content' ] to deeply equal []
2 · o lote importado diz que importou, na tela … > a linha de sucesso no passo 1, nenhum toast
AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
3 · o limite pela resposta do servidor … > 400 com details de field "size" → a frase do limite, sem ação, sem toast
TestingLibraryElementError: Unable to find an element with the text: o arquivo passa de 4 MiB — escolha um menor.
3 · … > 413 da plataforma (sem JSON) → a mesma frase
TestingLibraryElementError: Unable to find an element with the text: o arquivo passa de 4 MiB — escolha um menor.
4 · o Tom das Opções avançadas mostra o valor escolhido … > escolhido Sol, a caixa diz G — e o corpo leva "key":"G"
   (na main o Tom é um Select do Radix, sem `campo-tom`: reprova no seletor — a causa, a `key` do React, é `[lido]`, div. 821)
5 · o passo 1 é só o como … > Importar de arquivo não mostra a zona; o Próximo mostra; Voltar devolve o passo 1 com a escolha
AssertionError: expected <input type="file" …(3)></input> to be null
```

`pnpm test` → `Test Files 116 passed | 3 skipped (119)` · `Tests 1137 passed | 57 skipped (1194)` · `# exit: 0`
(`cn/pnpm-test.txt`; a PR-11 terminou em 114 / 1121: +3 suítes (o gate do `POST`, os estados, o limite), −1 morta; +37 casos
(4 + 30 + 3), −21 mortos).

## 17. O `POST` byte a byte — e o que não vai no corpo (herança D)

`tests/gates/fixtures/upload-post-antes.json` (a `main`) × o upload novo: **iguais nos quatro fluxos** — o `FormData`
(`file` com o mesmo nome · tipo · tamanho · sha256; `filename` sanitizado) e cada corpo de `POST /api/content`. O que o
gate prende e a PR **não conserta** (I1-D9):

| herança D | linha | o que o gate mostra |
|---|---|---|
| *Ano*, *Capo*, *Afinação* editáveis e fora do corpo | `hooks/useAddContentLogic.ts` (o `createContent` dos dois ramos não os lê); os campos em `BasicMetadataFields.tsx` (`year`) e `AdvancedMetadataFields.tsx` (`capo`, `tuning`) | o roteiro digita 1998 · 2 · Drop D — o corpo não os tem |
| *Compasso* e *Favorita* se perdem pelo nome | `hooks/useMetadataForm.ts` manda `time_signature`/`is_favorite`; `hooks/useAddContentLogic.ts` lê `timeSignature`/`isFavorite` | `"time_signature":null,"is_favorite":false` com 3/4 digitado e *Favorita* marcada |
| **o content criado do zero sai vazio** (decisão 5) | `components/content-creator.tsx` (`handleCreate`: `content: { [chave]: "" }`) → `add-content-page-client.tsx` (`handleContentCreated`: vai a `/content/{id}`, a visualização — não ao editor) | `"content_data":{"lyrics":""}` — na `main` o mesmo corpo com o texto em branco (div. 836) |
| a importação de um arquivo de texto grava só o `file_url` | `hooks/useAddContentLogic.ts` (o ramo `uploadedFile`) | o corpo da cifra `.txt` sem `content_data` (div. 823) |
| *"Unknown Artist"* como artista padrão | `hooks/useAddContentLogic.ts` (`handleBatchParsing`, e o `\|\| "Unknown Artist"` dos dois ramos) | `"artist":"Unknown Artist"` na 3ª música do lote (div. 824) |
| **a duplicação do lote numa falha a meio** (decisão 12) | `components/batch-preview.tsx` (`handleImport`: em série; *Tentar de novo* recomeça da primeira) | `upload-estados.test.tsx`, "a falha…": os títulos pedidos são `Anunciação, Asa branca, Anunciação, Asa branca` — a primeira entra duas vezes |
| o lote sobe o arquivo ao Storage e nunca o referencia | `FileUploadZone.tsx` (`enviar`) → `useAddContentLogic.ts` (`handleFilesUploaded` → `handleBatchParsing`) | o `POST /api/storage/upload` do fluxo do lote, e nenhum `file_url` nos três corpos (div. 822) |
| depois de um lote, as músicas lidas ficam no hook | `hooks/useAddContentLogic.ts` (`parsedSongs` só zera ao trocar o tipo) → `DetailsStep.tsx` (`songs.length > 0`) | `[lido]`: importar um arquivo em seguida abre a prévia do lote anterior — igual na `main` (div. 833) |
| o rascunho do criar fica no hook | `hooks/useAddContentLogic.ts` (`handleSaveContent` testa `draftContent` antes de `uploadedFile`) | `[lido]`: criar, voltar, importar um arquivo e salvar grava o rascunho, não o arquivo — igual na `main` (div. 835) |

## 18. A pré-verificação sem sessão (`pre-verificacao/`) `[medido]`

`next dev -p 3110` **sem `.env`** numa cópia da árvore (rsync sem `.env*`, `node_modules` por link), com
`pagina-fumaca.tsx` em `app/fumaca-i1pr12/[estado]/page.tsx` — a casca e o `AddContent` reais; em `UP-carregando`, o
próprio `AddContentPageClient` (sem Firebase não há usuário: a rota cai no *carregando…* de verdade, o "sem usuário" que
antes era `return null`). **Só na cópia**, dois remendos para o fluxo andar sem sessão: `getValidToken` devolve um token
de fumaça e os dois hooks não param em `!user`. O `rodar.ts` usa os **mesmos roteiros do aceite** (`ESTADOS_UPLOAD` e
`ESTADOS_UPLOAD_BASE`, com os `POST` fabricados no `route()`), a mesma `coletar` e o mesmo `classificarEstado`, contra
`esperado/7-upload.json`; mais um estado sem seção, as **Opções avançadas abertas**. Saída `pre-verificacao/saida.txt`;
nós `pre-verificacao/medicoes.json` (só fixture).

```
errata candidata por estado (C + B): {"UP-carregando":0,"UP-como":16,"UP-arquivo":0,"UP-enviando":0,"UP-extensao":0,"UP-limite":0,"UP-envio-rede":0,"UP-envio-servidor":0,"UP-detalhes":0,"UP-detalhes-inativo":0,"UP-salvando":0,"UP-salvar-erro":0,"UP-criar":8,"UP-criar-validacao":10,"UP-lote":24,"UP-lote-lendo":2,"UP-lote-importando":24,"UP-lote-erro":22,"UP-lote-vazio":0,"UP-lote-sucesso":16,"UP-pronto":0,"base-criar":0,"base-arquivo":0,"base-detalhes":0,"base-lote":0,"base-pronto":0,"avancadas-abertas":0}
respostas fabricadas (não-GET): {"POST /api/storage/upload 400":3,"POST /api/storage/upload 500":3,"POST /api/storage/upload 201":45,"POST /api/content 500":6,"POST /api/content 201":18}
TOTAL: 81 (estado × largura) · (e) 0 · (b) 0 · scrollWidth = viewport em 81/81 · errata candidata (C e B) 122 · escritas a /api NÃO fabricadas (abortadas) 0
```

**As 122 candidatas, por errata**: I1-E22 **32** (`UP-como` 16, `UP-lote-sucesso` 16 — os blocos *tipo* e *como* trocados:
Δy −138 e +114 em C) · I1-E24 **70** (`UP-lote` 24, `-importando` 24, `-erro` 22 — o título no campo, Δ[−13, +26], e a
cascata das linhas mais altas, +164 por linha) · I1-E27 **18** (`UP-criar` 8, `-validacao` 10 — Δy −44, a linha do
arquivo copiada) · I1-E2 **2** (`UP-lote-lendo` contra `UP-lote`: o *Voltar*). **0** nos outros 13 estados.

**Duas rodadas; o que a 1ª achou e foi consertado antes do commit** (div. 838): (1) o título do `UP-carregando` como
bloco de largura inteira (a folha o tem numa linha flexível — Δw 880): entrou na mesma linha dos outros estados; (2) a
linha do arquivo com o texto num `span` (o nó começava 32 px à direita): o texto passou a ser do próprio parágrafo; (3)
**(b) em 411** no lote — *"Unknown Artist"* cortado no campo de artista, que dividia a linha com o título: em A os dois
campos empilham. **Sem par**, por estado: *Buscar…*/*MV* (a casca, sem usuário) e, do app, a `<nav>` e o campo da busca
(div. 719); o *Próximo* do passo 1 (I1-E21); *o que você preencheu…* × *…escreveu…* (I1-E26); *Salvar* × *Importar todas*
(I1-E25); a linha do arquivo do criar (decisão 16); no lote, os corpos e os *Incluir “…”* (I1-E24); em `UP-lote-lendo`, a
lista inteira da folha × *carregando…* (I1-E2).

**Capturas** (`capturas/`, 24): `UP-como`, `-arquivo`, `-limite`, `-detalhes`, `-salvar-erro`, `-lote`, `-lote-sucesso`,
`-pronto` × C-1138 · B-711 · A-411 — da fumaça (fixture, sem conta; o "N" no canto é o indicador do `next dev`, e o
*"1 Issue"* dele em `UP-salvar-erro` é o `logger.error` do 500 fabricado).

## 19. Os gates — verdes `[medido]`

| gate / suíte | resultado | arquivo |
|---|---|---|
| G-tok | **PASSA**: (i) 26/26, 0 órfãs; (ii) `arquivos: 107 · literais de identidade acusados: 0 · toasts: 0 · imports de ui: 0` — **526 → 0** | `cn/g-tok-depois.txt` |
| G-back | **PASSA** — `diff vazio no núcleo`; as rotas (`/api/storage/upload`, `/api/content`) e o `lib/api-schemas.ts` não mudaram; `lib/content-service.ts` é cliente, fora do núcleo | `cn/g-back-depois.txt` |
| G-palco | **PASSA — 0** | `cn/g-palco.txt` |
| `pnpm test` | `116 passed \| 3 skipped (119)` · `1137 passed \| 57 skipped (1194)` | `cn/pnpm-test.txt` |
| os testes da PR · CN da PR-1 | 84/84 (+2 pulados, os `CN_GRAVAR`) · **15/15** | `cn/testes-da-pr.txt`, `cn/cn-pr1.txt` |
| `tsc --noEmit` · `pnpm lint` | 0 · ✔ | `cn/tsc.txt`, `cn/lint.txt` |
| `pnpm build` | `✓ Compiled successfully`; `ƒ /add-content 4.92 kB`; `# exit: 0` (cópia sem `.env`) | `cn/build.txt` |
| inércia das públicas | 12 (estado × largura) nos dois lados, **12 idênticos**; `INÉRCIA: PASSA` | `cn/inercia-publicas.txt` |
| `pdf-viewer` · `music-text` | `git diff --stat origin/main --` os dois → **vazio** | `cn/pdf-viewer-music-text.txt` |

## 20. Divergências — 831 a 840

| # | origem | o que se presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **831** | P | o prompt do commit 2: *"o lote chegando ao passo 3 (sonda 2)"* | a folha (T-I1-R239/240, `UP-lote-sucesso`) põe o lote importado no **passo 1**, com a linha de sucesso; o cabeçalho dela lista *"passo 3 do lote"* como fora (inalcançável); a decisão 7 do DESIGN-I1 é *{n} músicas importadas* na linha | implementado pela folha (o passo 1 com a linha); o teste "2 ·" prova e reprova na `main`. **Para o aval**: se o lote tem de ir ao passo 3, é errata nova |
| **832** | P | *"`i1-upload-post` 4/4 — só seletores mudam"* | a decisão 5 tirou o campo de corpo: o roteiro do criar não pode digitar o texto | o caso regravado sobre a `main` sem esse passo (§15.4); os outros três intactos |
| **833** | A | — | depois de um lote, `parsedSongs` fica no hook: o arquivo seguinte abre a prévia do lote anterior `[lido]` — igual na `main` | herança D (§17); não tocado |
| **834** | D | decisão 16: os nós copiados "sem par" | a linha copiada empurra o resto 44 px: 18 candidatas | I1-E27 proposta (§15.4) |
| **835** | A | — | o rascunho do criar fica no hook e vence o arquivo no salvar `[lido]` — igual na `main` | herança D (§17); não tocado |
| **836** | A | decisão 5: *"se o conteúdo criado sai vazio sem ir ao editor, herança D com linha"* | sai vazio (`{"lyrics":""}`) e a tela vai à visualização (`/content/{id}`), não ao editor | herança D, com linha (§17) |
| **837** | T | §1.2: *"o commit 2 troca os seletores"* dos specs `tests/ux-audit/fase-d/` | são auditorias sob demanda contra preview/prod, fora do CI | não tocados; herança (§21) |
| **838** | T | — | a 1ª rodada da pré-verificação achou três defeitos de tela (§18), um deles (b) em 411 | consertados antes do commit |
| **839** | A | — | `types/content.ts`: `getContentTypeIcon` e `getContentTypeColors` ficaram sem importador (o `ContentTypeSelector` usa o catálogo) | ficam (arquivo de tipos, fora da lista); limpeza no encerramento |
| **840** | P | I1-D37: *"o antes desta PR: rode você agora"* | o "antes" do Marcel já estava na árvore (11:23Z) | rodei em pasta à parte: 15/15 iguais nó a nó; fica o do Marcel (§14) |

Próxima divergência: **841**.

## 21. Heranças (commit 2)

| herança | destino |
|---|---|
| as nove linhas do §17 (o que não vai no corpo, o vazio do criar, a duplicação do lote, o órfão do Storage, os dois estados que ficam no hook) | **Bloco D** |
| **div. 828** — o G-tok (ii) não lê strings de `.ts`. Os hooks e módulos do upload com inglês, depois do commit 2: `hooks/useAddContentLogic.ts` (*"Unknown Artist"* — valor gravado, herança D); `components/add-content/upload-to-storage.ts` (*"Authentication required to upload files"*, *"Upload failed with status …"*, *"Failed to get public URL for uploaded file"*), `hooks/useMetadataForm.ts` (*"User not authenticated"*) e `lib/content-service.ts` (*"Failed to create content"*, *"Authentication failed"*) — mensagens de `Error` que **já não chegam à tela** (a tela escolhe a frase pela espécie). Voltadas ao usuário: **nenhuma** além do valor gravado | o encerramento do I1 (decisão 17) |
| os specs `tests/ux-audit/fase-d/i-add.spec.ts` e `add13-14-metadados.spec.ts` com os rótulos em inglês (div. 837) | quando o gate voltar a ser usado |
| `types/content.ts`: `getContentTypeIcon`/`getContentTypeColors` sem importador (div. 839); o `safelist` de cores do `tailwind.config.ts` que os servia | o encerramento do I1 |
| a forma do motivo com travessão (PR-9) × vírgula (PR-11, PR-12) | harmonização no encerramento (herdada da PR-11) |
| o invólucro `flex-1 bg-[#fffcf7]` do corpo velho: resta só o das setlists | PR-13 |

## 22. Contabilidade (commit 2)

| quem | item | valor |
|---|---|---|
| executor | requests a prod ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor (I1-D37) | rodada com sessão | 1: o "antes" em pasta à parte (16 cargas, `11:29Z`), sobre o `pnpm dev` de pé na árvore — `POST` só `fabricado 201`; `prodAbortados` 0 |
| executor | `next dev` **sem** `.env`, porta 3110, numa cópia da árvore (sem `.env*`) | 1 subida: as duas rodadas da pré-verificação (com os dois remendos, só na cópia) e a inércia (sem eles); parada; a cópia removida |
| executor | `pnpm build` | na mesma cópia, sem `.env` |
| executor | a `main` para o gate regravado e para os testes novos | worktree temporária de `434ba79` (`--detach`), removida |
| — | `packages/identidade` · `tailwind.config.ts` | **não mudaram** |

---

## 23. Commit 3 — o aceite e o fecho

### 23.1 As decisões, numa tabela

| aval | quando | o quê |
|---|---|---|
| commit 1 | 2026-09-29 | as **18** do §10.1 (o extra do gate; o 1b; o *Próximo* no passo 1 + **I1-E21**; a ordem de hoje + **I1-E22**; a partitura como hoje; o criar = Título + Próximo; o lote com os controles + **I1-E24**; *Importar todas* + **I1-E25**; a N2 + **I1-E26**; o pronto pela folha; o *Back* sai; o limite pela resposta; o *Tentar de novo* do lote como hoje; `UP-lote-lendo` contra `UP-lote`; o Tom mostra o valor; as frases novas; as cópias "sem par"; a div. 828 ao encerramento; a cota) |
| "rodei-antes" | 2026-09-30 | o "antes" do Marcel na árvore; seguir para o commit 2 |
| **I1-D37** | 2026-09-30 | o executor roda o aceite e o "antes" com o perfil persistente (§14); o aval fica no veredito |
| **veredito** | 2026-09-30 | aceito; a div. 831 → a folha; **I1-E27** aprovada; os extras do commit 2 e as correções do instrumento (divs. 841, 843) aprovados (§23.8) |

### 23.2 O aceite `[executor, I1-D37, 2026-09-30]`

`tests/gates-web/medicoes/add-content.json` — três rodadas com a sessão do perfil (`G_FAIXA_SEM_JANELA=1`), sobre o
`pnpm dev` de pé nesta árvore (o do Marcel, na 3000; o `tailwind.config.ts` não mudou, não precisou reiniciar):

| rodada | quando (UTC) | o quê | commit |
|---|---|---|---|
| 1 | 12:09–12:13 | **C e B**, os 26 estados — `base-criar` NÃO ALCANÇADO nas duas (div. 841) | `9bac7bb` |
| 2 | 12:29–12:31 | **A**, os 26 estados (15 min depois, a cota) | `9bac7bb+sujo` (div. 842) |
| 3 | 12:32 | por estado (`G_FAIXA_ESTADOS=base-criar,UP-pronto,base-pronto`), C e B — em `rodadasPorEstado` | `9bac7bb+sujo` |

(Entre a 1 e a 2 houve uma rodada por estado às 12:29 com os mesmos três estados; a rodada 2, por largura, **apagou o
registro dela** — div. 843 — e ela foi repetida como rodada 3, depois do conserto do mesclador.)

Veredito verbatim em `cn/g-faixa-aceite.txt`:

```
$ node scripts/gates-web/g-faixa-veredito.mjs tests/gates-web/medicoes
## contados à parte (não reprovam): errata candidata 241 · quebra por dado 42 · sem par folha 568 · sem par app 568 (C e B) · não medidos 26
## erratas candidatas sem cobertura (erratasFaixa, div. 681): 0
G-faixa: PASSA
# exit: 0
```

(241 = as 119 de antes desta PR + as **122** do upload; "não medidos" 28 → 26 contando os inalcançáveis declarados das
outras superfícies — nenhum é do `add-content`.)

Por estado (`cn/aceite-por-estado.txt`; célula = (e) · (b) · errata candidata; em A, (e) · (b) · (d′), que é triagem):

| estado | 1138 (C) | 711 (B) | 411 (A) | sem par folha/app (C e B, cada) | cobertura |
|---|---|---|---|---|---|
| `UP-carregando` | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · (d′) 1 | 1/2 | — |
| `UP-como` | 0 · 0 · 8 | 0 · 0 · 8 | 0 · 0 · (d′) 1 | 1/3 | I1-E22 (+ o *Próximo* "sem par", I1-E21) |
| `UP-arquivo` · `-enviando` · `-extensao` · `-limite` · `-envio-rede` · `-envio-servidor` | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · (d′) 1–3 | 1/2 | — |
| `UP-detalhes` · `-detalhes-inativo` · `-salvando` | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · (d′) 1 | 1/2 | — |
| `UP-salvar-erro` | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · (d′) 1 | 2/3 | — (a N2 "sem par", I1-E26) |
| `UP-criar` | 0 · 0 · 4 | 0 · 0 · 4 | 0 · 0 · (d′) 1 | 2/2 | **I1-E27** |
| `UP-criar-validacao` | 0 · 0 · 5 | 0 · 0 · 5 | 0 · 0 · (d′) 1 | 2/2 | **I1-E27** |
| `UP-lote` · `-lote-importando` | 0 · 0 · 12 | 0 · 0 · 12 | 0 · 0 · (d′) 1 | 1/10 | I1-E24 |
| `UP-lote-erro` | 0 · 0 · 11 | 0 · 0 · 11 | 0 · 0 · (d′) 2 | 2/11 | I1-E24 (+ *Importar todas* "sem par", I1-E25) |
| `UP-lote-lendo` (contra `UP-lote`) | 0 · 0 · 1 | 0 · 0 · 1 | 0 · 0 · (d′) 1 | 15/3 | I1-E2 |
| `UP-lote-vazio` | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · (d′) 2 | 1/2 | — |
| `UP-lote-sucesso` | 0 · 0 · 8 | 0 · 0 · 8 | 0 · 0 · (d′) 1 | 1/3 | I1-E22 |
| `UP-pronto` | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · (d′) 2 | 1/2 | — |
| `base-criar` · `-arquivo` · `-detalhes` · `-lote` · `-pronto` (sem folha: a casca-efeito) | 0 · 0 | 0 · 0 | 0 · 0 · (d′) 1–2 | — | — |

**(e) = 0 e (b) = 0 nas três larguras, em todo estado medido; `scrollWidth` = viewport nos 78.** As candidatas do aceite
são **as mesmas 122 da pré-verificação** (61 em C, 61 em B): o `n` de cada errata em `erratasFaixa` confirma. **Quebra
por dado: 0.** O (d′) de 411 (39 no total) é o que empilha em A — a casca e, no corpo, a grade de duas colunas que vira
uma.

**Sem par** (contados à parte; nunca reprovam), por espécie:
- **da folha**: *Buscar…* (a casca, div. 719) em todos; *o que você preencheu continua aqui* (I1-E26); *Salvar* do
  `UP-lote-erro` (I1-E25); a linha do arquivo copiada em `UP-criar`/`-validacao` (decisão 16); em `UP-lote-lendo`, a
  lista inteira da `UP-lote` (o cabeçalho, os quatro números, títulos e artistas, *Importar todas*) — I1-E2;
- **do app**: a `<nav>` e o campo da busca (div. 719); o *Próximo* do passo 1 (I1-E21); *o que você escreveu continua
  aqui* (N2); *Importar todas* no `UP-lote-erro`; no lote, os quatro corpos e os quatro *Incluir “…”* (I1-E24);
  *carregando…* no `UP-lote-lendo`.

**A fixture, confirmada pelo hash** (`cn/fixture-hash.txt`): os 32 textos que provam cada estado estão nas três
larguras — *enviando o arquivo…* com *partitura-12-paginas.pdf · 1,8 MiB*, *tipo de arquivo não aceito: foto.heic — use
.pdf, .docx ou .txt*, *o arquivo passa de 4 MiB — escolha um menor*, as duas falhas do envio, *Salvando…*, a falha do
salvar com a N2, *4 músicas encontradas em repertorio.docx* com *Anunciação* · *Alceu Valença* · *Unknown Artist*,
*Importando…*, *4 músicas importadas*, *“Partitura de 12 páginas”, de Compositor anônimo, está na biblioteca*.
**Nenhum content real foi lido** (a rota não lê content).

**Os requests** (três larguras; `cn/aceite-por-estado.txt`): `prodAbortados` **0**; os não-`GET` a `/api/*` são o
`POST /api/auth/session` (o cookie) e **só fabricados**: `POST /api/storage/upload` `fabricado 201` · `400` (o limite) ·
`500` · `sem resposta` (segurado no `UP-enviando`, abortado no `UP-envio-rede`); `POST /api/content` `fabricado 201` ·
`500` · `sem resposta` (segurado no `UP-salvando` e no `UP-lote-importando`). **Nenhum `POST` saiu**; o arquivo de
5 MiB foi gerado e parou no `route()`. Nenhum request a `/content/g-faixa-novo`. `GET /api/profile`: 34 + 34 + 27, em
janelas de no máximo 52 em 15 min (a rodada 1; o teto é 60). Contas 0, escritas 0.

`UP-carregando` **alcançado com sessão** pelo pedaço do `dynamic` segurado (`components_add-content` no nome do chunk —
a hipótese casou). **Inalcançáveis com sessão**, com a prova: o *carregando…* pelo `isLoading` do Firebase e pelo "sem
usuário" — a mesma tela; pré-verificação sem sessão (§18: `UP-carregando` é a rota sem usuário, 3/3 larguras, (e) 0
(b) 0) e Vitest (`upload-estados.test.tsx`, "a espera": os dois ramos). As variantes de motivo (401, 429, o 400 que não
é o tamanho, o 413, o "sem URL", a rede no salvar) e `up.lote.ler`: Vitest, uma por status. As Opções avançadas abertas:
pré-verificação (3/3, (e) 0 (b) 0, `scrollWidth` = viewport).

### 23.3 `casca-efeito` do upload — antes × depois `[medido]`

`cn/casca-efeito-upload.mjs` (anexo, não gate), o "antes" (`casca-efeito/antes/add-content.json`, o upload velho,
`7b33d06`) × o "depois" (os mesmos cinco estados no `add-content.json`) — `cn/casca-efeito-upload.txt`:

```
base-criar · 1138: casca 9/9 iguais · nó velho por componente 0 · valor gravado 0 · coincidência de texto 1: texto/section 0 car. · nós 31 → 27
base-arquivo · 1138: casca 9/9 iguais · nó velho por componente 0 · valor gravado 0 · coincidência de texto 1: texto/section 0 car. · nós 34 → 23
base-detalhes · 1138: casca 9/9 iguais · nó velho por componente 0 · valor gravado 0 · coincidência de texto 1: texto/section 0 car. · nós 32 → 34
base-lote · 1138: casca 9/9 iguais · nó velho por componente 0 · valor gravado 2 · coincidência de texto 9: textbox/input 10 car.; textbox/textarea 27 car.; … 
base-pronto · 1138: casca 9/9 iguais · nó velho por componente 0 · valor gravado 0 · coincidência de texto 1: texto/section 0 car. · nós 15 → 21
NÓ VELHO POR COMPONENTE: 0 — nas 15 (estado × largura) · valor gravado "Unknown Artist" no campo do lote: 6
```

**A casca não se moveu**: 9/9 em C e B, 8/8 em A, nos cinco estados. **Nó velho por componente = 0**: nenhuma das 69
frases de UI do upload velho (`FRASES_VELHAS`, as do código da `main`) aparece no depois. **Coincidência de texto = 1 a
10**: o `section` sem texto; em A, o *Adicionar* da casca, que ali empilha abaixo de y = 120; e, só no `base-lote`, os
**dados** do lote (os quatro títulos e os quatro corpos da fixture, e os artistas) — o mesmo texto em campos dos dois
lados. **Valor gravado 6**: *"Unknown Artist"* nos dois campos de artista sem artista do lote (2 × 3 larguras) — é
texto de UI do web velho **e** o valor que o hook grava (herança D, div. 824): contado à parte, não como nó velho.
*Tab* fica fora da lista de frases velhas (é o nome do tipo nas duas línguas).

### 23.4 `cn-main`

`cn/cn-main-veredito.txt`: **`G-faixa: REPROVA — 83 ocorrência(s)`**, a mesma — é o web velho (registro).

### 23.5 Estado × alcance × medido

| estado | como (fabricado) | rodada | medido |
|---|---|---|---|
| `UP-carregando` | o pedaço do `dynamic` segurado | 1, 2 | 3/3 |
| `UP-como` | *Importar de arquivo* marcado, com Letra | 1, 2 | 3/3 |
| `UP-arquivo` | + *Próximo* | 1, 2 | 3/3 |
| `UP-enviando` | + o PDF de 1,8 MiB, o `POST` de upload segurado | 1, 2 | 3/3 |
| `UP-extensao` | + `foto.heic` (validação do cliente, nenhum request) | 1, 2 | 3/3 |
| `UP-limite` | + o arquivo de 5 MiB gerado, o `POST` fab. 400 (`field: "size"`) | 1, 2 | 3/3 |
| `UP-envio-rede` · `-envio-servidor` | o `POST` abortado · fab. 500 | 1, 2 | 3/3 |
| `UP-detalhes` · `-detalhes-inativo` | o `POST` fab. 201 → o formulário; o título e o artista digitados · só o título | 1, 2 | 3/3 |
| `UP-salvando` · `UP-salvar-erro` | + *Salvar*, o `POST /api/content` segurado · fab. 500 | 1, 2 | 3/3 |
| `UP-criar` · `-criar-validacao` | *Próximo* (o criar) · + *Próximo* com o título vazio | 1, 2 | 3/3 |
| `UP-lote` | *Várias músicas* + o lote da folha (`repertorio.docx`, `text/plain`) | 1, 2 | 3/3 |
| `UP-lote-lendo` | um lote em PDF com o worker do pdf.js segurado | 1, 2 | 3/3 |
| `UP-lote-importando` · `-erro` · `-sucesso` | + *Importar todas*, os `POST /api/content` segurados · fab. 500 · fab. 201 × 4 | 1, 2 | 3/3 |
| `UP-lote-vazio` | um lote só com linhas em branco | 1, 2 | 3/3 |
| `UP-pronto` | + *Salvar*, o `POST /api/content` fab. 201 **sem `id`** (div. 841) | 3 (C, B), 2 (A) | 3/3 |
| `base-criar` · `base-pronto` | os do 1b, no upload novo | 3 (C, B), 2 (A) | 3/3 |
| `base-arquivo` · `-detalhes` · `-lote` | idem | 1, 2 | 3/3 |

### 23.6 As heranças

As do §21 (o Bloco D, com as nove linhas do §17 — os cinco campos que não vão no corpo, o vazio do criar, a duplicação
do lote, o órfão do Storage, os dois estados que ficam no hook; a div. 828 para o encerramento; os specs do `ux-audit`;
os dois auxiliares sem importador em `types/content.ts`; a vírgula × travessão; o invólucro das setlists), mais:

| herança | destino |
|---|---|
| segurar uma navegação do `router.push` e soltá-la no estado seguinte derruba o `goto` (div. 841) | **molde**: o estado que "pisca antes de navegar" se alcança pela resposta fabricada que não navega (aqui, o content sem `id`) |
| a rodada por largura apagava o `rodadasPorEstado` (div. 843) — consertado no `g-faixa-sessao.ts` | **molde**: por estado e por largura mesclam nos dois sentidos |
| a cota com 26 estados: duas rodadas por largura (C+B; A 15 min depois), por estado só para repetir | **molde** (`COMO-RODAR.md`, "I1-PR12") |
| I1-D37: o executor roda o aceite | as próximas PRs |

### 23.7 Divergências — 806 a 843, com destino

| # | destino |
|---|---|
| 806 | registrado: 20 seções + `Tokens`; `UP-lote-lendo` contra `UP-lote` (decisão 13) |
| 807 | registrado: o teto vive em `lib/api-schemas.ts:259`; o teste lê o schema (§15.3) |
| 808 | → decisão 2 + **I1-E21** (o *Próximo*; mudança de fluxo declarada, com teste) |
| 809 | → decisão 3 + **I1-E22** |
| 810 | → decisão 4 (a partitura como hoje; `UP-como` com Letra) |
| 811 | → decisão 5 (Título + Próximo, sem corpo); a consequência é a 836 |
| 812 | → decisão 16 ("sem par"); a consequência geométrica é a 834 |
| 813 | → decisão 6 + **I1-E24** |
| 814 | → decisão 7 + **I1-E25** |
| 815 | → decisão 8 + **I1-E26** |
| 816 · 817 | → decisões 9 e 10 (remoções declaradas) |
| 818 | consertado: a cópia velha morreu; teste que reprova na `main` |
| 819 | consertado: o lote diz *{n} músicas importadas* no passo 1; ver a 831 |
| 820 · 822 · 823 · 824 | herança D (§17); o gate byte a byte os prende |
| 821 | → decisão 14: o Tom mostra o valor (defeito de tela declarado) |
| 825 · 826 | → decisão 11 (pela resposta do servidor; `status` e `details` aditivos) |
| 827 | → decisão 12; herança D (a duplicação, com linha no §17) |
| 828 | → decisão 17: herança de instrumento; a lista no §21 |
| 829 | → decisão 13 + I1-E2 em `erratasFaixa` |
| 830 | → decisão 15 (as frases no §5.1 do DESIGN-I1) |
| **831** | **decidida** no aval do veredito: vale a folha — o lote no passo 1 com *{n} músicas importadas*; *"passo 3"* era premissa do prompt (origem P) |
| 832 | declarado (§15.4): o caso do criar regravado sobre a `main` |
| 833 · 835 · 836 | herança D (§17) |
| **834** | **decidida** no aval do veredito: **I1-E27** aprovada |
| 837 · 839 | herança (§21) |
| 838 | aplicado na pré-verificação (§18) |
| 840 | registrado: o "antes" rodado duas vezes, igual; fica o do Marcel |
| **841** | **T** — a 1ª rodada perdeu `base-criar` (C e B): vinha depois do `UP-pronto`, que segurava o `router.push('/content/g-faixa-novo')`; solto o `fetch`, o Next cai na navegação dura e o `goto` seguinte aborta (`net::ERR_ABORTED`). Conserto no instrumento: o content fabricado vem **sem `id`** — a tela fica no pronto (`add-content-page-client.tsx`: sem id não navega) e nada fica pendurado. Os três estados medidos de novo (rodada 3). Nenhum request a `/content/g-faixa-novo` chegou ao servidor (0 no log) |
| **842** | **T** — as rodadas 2 e 3 saíram `9bac7bb…+sujo`: o `g-faixa-upload.ts` (o conserto da 841) e o `add-content.json` da rodada 1 estavam na árvore sem commit; **nenhum arquivo de `app/`, `components/`, `lib/`, `hooks/` difere** de `9bac7bb` — o caso das divs. 731 e 804. Registrado |
| **843** | **T** — `g-faixa-sessao.ts`, `mesclar` (por largura): o `...novo` descartava o `rodadasPorEstado` do JSON — a rodada de A apagou o registro da rodada por estado de C e B (as medições ficaram; a origem sumiu). Consertado (o registro das outras larguras fica) e a rodada por estado repetida (rodada 3). Latente desde a I1-PR-11, onde a rodada por estado foi a última |

Próxima divergência: **844**.

### 23.8 O aval do veredito — decisões `[Marcel, 2026-09-30]`

(As cinco perguntas do commit 3 e a resposta de cada uma; transcrição do prompt do commit 4.)

| # | o que se pediu | decisão |
|---|---|---|
| 1 | **o veredito**: G-faixa PASSA — (e) 0 e (b) 0 nas três larguras; 122 candidatas, 0 sem cobertura; nó velho por componente 0 | **aceito** |
| 2 | **div. 831** — o lote importado no passo 1 (a folha, T-I1-R239/240) ou no passo 3 (o prompt do commit 2)? | **a folha**: o lote no passo 1 com *{n} músicas importadas*; *"passo 3"* era premissa do prompt (origem **P**) |
| 3 | **I1-E27** (div. 834) — `UP-criar` e `UP-criar-validacao` valem sem a linha do arquivo copiada? | **aprovada** — em `DESIGN-I1/README.md` §2.2 e em `erratasFaixa` (n 18), sem a marca de proposta |
| 4 | **os extras do commit 2** (§15.4) | **aprovados**: a linha de sessão na tela (`components/auth/aviso-de-sessao.tsx`); o caso "criar do zero" do gate regravado sobre a `main` sem o texto da sonda (div. 832); o singular e o tamanho em KiB/B |
| 5 | **o instrumento do commit 3** | **aprovado**: o pronto com o content fabricado sem `id` (div. 841); o mesclador preserva o `rodadasPorEstado` (div. 843) |

**Commit 4 — só docs** (nenhuma linha de `app/`, `components/`, `lib/`, `hooks/`, `scripts/`, `tests/`): este quadro; a
I1-E27 sem a marca de proposta no `DESIGN-I1/README.md` §2.2 e no `erratas.json`; o `SHA256SUMS` (a linha do
`README.md`: `d978bfa3…` → `3af603d2…`); a **I1-D37** como decisão própria no `docs/ux/I1-PRECHECK.md` §0.1, ao lado da errata da I1-D35 (que já
estava, desde o commit 2). Conferido `[medido]`: `shasum -a 256 -c docs/ux/DESIGN-I1/SHA256SUMS` → **14/14 OK**; o
`erratas.json` é JSON válido e o G-tok (i) segue `26 cobertos · 0 descobertos · 0 órfãs`; o veredito segue `G-faixa:
PASSA`, `erratas candidatas sem cobertura: 0`. **Nenhuma divergência nova** — a próxima segue **844**.

### 23.9 Contabilidade final da I1-PR-12

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · senhas digitadas · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0 · 0** |
| executor (I1-D37) | rodadas com sessão (perfil `~/.octavia-g-faixa-perfil`, `localhost:3000`) | 5: o "antes" em pasta à parte (16 cargas, 11:29Z); o aceite — C+B (12:09Z), por estado (12:29Z, registro perdido, div. 843), A (12:29Z), por estado de novo (12:32Z) |
| executor | `pnpm dev` com `.env.local` | **nenhum subido**: a 3000 já estava de pé nesta árvore (o do Marcel), com o mesmo código e o mesmo `.env.local`; não foi reiniciado nem parado |
| executor | `next dev` **sem** `.env`, porta 3110, **numa cópia da árvore** | 1b: 1 subida (a fumaça dos `base-*`); commit 2: 1 (as duas rodadas da pré-verificação, a inércia); paradas; cópias removidas |
| executor | `pnpm build` | numa cópia da árvore, sem `.env` |
| executor | a `main` | worktree temporária de `434ba79` (`--detach`): o caso regravado do gate e os testes novos; removida |
| executor | páginas de fumaça e remendos de sessão | só nas cópias; nunca na árvore da PR nem no commit (a fonte é `pre-verificacao/pagina-fumaca.tsx`) |
| Marcel | rodadas com sessão | 1: o "antes" (11:23Z, sobre `7b33d06`) — contas 0, escritas 0 |
| todos | `POST` que saiu | **0** (`fabricado 201/400/500` e `fabricado sem resposta`) |
| — | leitura de content real | **nenhuma** (a rota não lê content; lidos só `/api/profile` e o `securetoken`) |
| — | `packages/identidade` · `tailwind.config.ts` · as rotas · `lib/api-schemas.ts` | **não mudaram** |
