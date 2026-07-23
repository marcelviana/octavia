# P1-B — Comportamento perdido na migração dos gêmeos

Especificações dos gêmeos mortos executadas contra os gêmeos vivos (em rota).
Método: retarget em-lugar (imports + mínimo de setup); **nenhuma asserção foi
afrouxada**. Its que falharam contra o vivo ficaram `it.skip` com comentário
`BUG(P1-B)`; its de estrutura morta sem equivalente ficaram `it.skip`
`INAPLICÁVEL(P1-B)`. Zero mudança em código de produção.

## Sumário executivo

| Veredito | Contagem (sobre os 76 its originais) |
|---|---|
| [PASSA] | **45** |
| [FALHA-COMPORTAMENTO] | **10** (todos em add-content) |
| [INAPLICÁVEL] | **21** (inclui os 13 `it.skip` TODO pré-existentes, que nunca foram validados nem contra o morto) |

**Destaque obrigatório — chords-display-bug (fase .planning/02): os 3 its
[PASSAM] contra `OptimizedPerformanceMode`.** O fix do bug do chord chart
existe no gêmeo em rota. O bug NÃO está vivo em produção.

**Achado crítico novo (lado add-content):** o gêmeo vivo
`RefactoredAddContent` **não tem UI de upload de arquivo** — em `mode:
"import"` renderiza o placeholder literal `"File upload functionality"`
(components/add-content/RefactoredAddContent.tsx:144-148). Como Sheet Music
força `mode: "import"`, **importar arquivos e adicionar partituras está
quebrado na rota /add-content em produção**. Também perdidos: botão Back,
exibição de erro (`error` do hook nunca renderiza) e os headings do wizard.

---

## 1. `__tests__/performance-mode/chords-display-bug.test.tsx`

Retarget: `components/performance-mode.tsx` → `components/optimized-performance-mode.tsx` (só o import; zero mudança de setup — o componente vivo monta com os mesmos props `PerformanceModeProps`).

| it | Veredito | Evidência |
|---|---|---|
| should display full chord chart in performance mode | **[PASSA]** | seções Verse 1/Chorus/Verse 2 e progressões "C F G Am" (×2) renderizam |
| should display section lyrics along with chords | **[PASSA]** | letras das seções renderizam |
| should handle multiple chord chart sections | **[PASSA]** | Intro/Verse 1/Bridge + progressões distintas renderizam |

## 2. `components/__tests__/content-display.test.tsx`

Retarget: `performance-mode/content-display.tsx` → `performance-mode/optimized-content-display.tsx`. Setup: prop `currentSong={0}` (morto) → `darkSheet={false}` (vivo). Asserções intactas.

| it | Veredito | Evidência |
|---|---|---|
| should render sections array for chords renderType | **[PASSA]** | |
| should handle empty sections array | **[PASSA]** | container `.space-y-6` existe no vivo |
| should render string chords format | **[PASSA]** | vivo renderiza `String(chordsData)` (sem MusicText, mesmo texto) |
| should not render section name when it equals "Content" | **[PASSA]** | mesma regra `name !== 'Content'` no vivo |
| should handle sections with only chords (no lyrics) | **[PASSA]** | |
| should apply zoom transformation correctly | **[PASSA]** | nota: vivo aplica zoom via `fontSize`, morto via `transform: scale`; a asserção só verifica o container, então não distingue |
| should render no-lyrics message when no content | **[PASSA]** | mesma mensagem "No lyrics available for this song" |

## 3. `tests/hooks/useAddContentState.test.ts`

Retarget: `hooks/useAddContentState` → `hooks/useAddContentLogic` (o hook que `RefactoredAddContent` realmente usa). Setup: arquivos entram via `handleFilesUploaded([file])` (o vivo não expõe `setUploadedFile`). Dois its mistos foram divididos: as asserções sobre campos expostos ficaram no it original ([PASSA]) e as asserções sobre superfície exclusiva do morto foram movidas para its `it.skip` INAPLICÁVEL — nenhuma asserção deletada.

| it (original) | Veredito | Evidência / justificativa |
|---|---|---|
| should initialize with correct default values | **[PASSA]** (parcial) | defaults de mode/uploadedFile/currentStep/isProcessing/createdContent/parsedSongs/importMode/contentType/error idênticos; asserções de `batchArtist`/`batchImported`/`isAutoDetectingContentType` movidas p/ it INAPLICÁVEL (estado/ref internos do vivo, não retornados) |
| should provide all necessary setter functions | **[PASSA]** (parcial) | setMode/setCurrentStep/setImportMode/setContentType existem; `setUploadedFile`/`setError` movidos p/ it INAPLICÁVEL (não expostos; equivalentes vivos: `handleFilesUploaded` e erro gerido internamente) |
| should update mode correctly | **[PASSA]** | |
| should update content type correctly | **[PASSA]** | |
| should update current step correctly | **[PASSA]** | |
| should update import mode correctly | **[PASSA]** | |
| should update uploaded file correctly | **[PASSA]** | act retargetado p/ `handleFilesUploaded([mockFile])` |
| should update error state correctly | **[INAPLICÁVEL]** | `setError` não é exposto; erro só muda via handlers internos |
| TODO auto-detect content type _(já skip no morto)_ | **[INAPLICÁVEL]** | nunca validada; ref interno |
| should reset auto-detection flag appropriately | **[INAPLICÁVEL]** | `isAutoDetectingContentType` é ref interno do vivo (setado por handleFilesUploaded ao detectar imagem) |
| should handle complete workflow state changes | **[PASSA]** | último act retargetado p/ `handleFilesUploaded` |
| TODO sheet music workflow _(já skip no morto)_ | **[INAPLICÁVEL]** | nunca validada; o mesmo efeito de reset por contentType existe em morto e vivo |
| should handle create mode workflow | **[PASSA]** | |
| TODO error persistence _(já skip no morto)_ | **[INAPLICÁVEL]** | nunca validada; setError não exposto |
| should allow error clearing | **[INAPLICÁVEL]** | setError não exposto |
| should initialize with processing as false | **[PASSA]** | |
| should handle processing state updates | **[PASSA]** | |
| should handle batch artist state | **[INAPLICÁVEL]** | batchArtist/batchImported internos no vivo |
| should handle parsed songs state | **[PASSA]** | |
| should handle created content state | **[PASSA]** | |
| TODO state persistence _(já skip no morto)_ | **[INAPLICÁVEL]** | nunca validada; mesmo efeito de reset em ambos |
| should handle rapid state changes without issues | **[PASSA]** | |
| should not cause memory leaks with large file objects | **[PASSA]** | act retargetado p/ `handleFilesUploaded` |
| should handle null file uploads correctly | **[INAPLICÁVEL]** | vivo não expõe `setUploadedFile(null)`; limpeza só via efeito de reset ao trocar contentType |
| should handle invalid content type gracefully | **[PASSA]** | |
| should handle negative step numbers | **[PASSA]** | |
| should handle large step numbers | **[PASSA]** | |
| should handle empty error messages | **[INAPLICÁVEL]** | setError não exposto |
| should handle frequent state updates efficiently | **[PASSA]** | inclui o efeito de reset por contentType (idêntico ao morto) |
| should not trigger unnecessary re-renders | **[PASSA]** | |

Subtotal: **20 [PASSA] / 0 [FALHA] / 10 [INAPLICÁVEL]** — o hook vivo preserva todo o comportamento observável especificado para o morto; as divergências são só de superfície de API.

## 4. `tests/components/add-content.refactoring.test.tsx`

Retarget: `components/add-content-refactored.tsx` → `components/add-content.tsx` (shim) → `add-content/RefactoredAddContent`. Setup: mock de estado re-wirado de `useAddContentState`+`useFileHandling` para `useAddContentLogic`; mock do StepIndicator repontado para `StepIndicatorComponent`; `DetailsStep`/`CompletionStep` stubbados; onde o wizard morto de 5 passos usava passos 2/3 para telas que no vivo estão todas no passo 1, o `currentStep` do mock foi ajustado para 1 (setup de montagem, não asserção).

| it (original) | Veredito | Evidência (erro cru p/ falhas) |
|---|---|---|
| should render with initial state | **[FALHA-COMPORTAMENTO]** | `TestingLibraryElementError: Unable to find an element with the text: Add New Content.` — heading da página perdido |
| should initialize useFileHandling with correct parameters | **[INAPLICÁVEL]** | vivo não usa useFileHandling (wiring interno de useAddContentLogic) |
| should handle back navigation | **[FALHA-COMPORTAMENTO]** | `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name /back/i` — `onBack` é recebido e ignorado; sem botão Back no passo 1 |
| should display content type selector on step 1 | **[FALHA-COMPORTAMENTO]** | `Unable to find an element with the text: What type of content do you want to add?` (o testid do selector renderiza; o heading não existe) |
| should handle content type selection | **[PASSA]** (parcial) | `setContentType('Lyrics')` wired; asserção de avanço de passo → INAPLICÁVEL (wizard morto) |
| should skip to step 3 for Sheet Music type | **[INAPLICÁVEL]** | avanço de passo é wiring do wizard de 5 passos; equivalente visível (Sheet oculta ModeSelector) coberto e [PASSA] |
| TODO steps generation _(já skip no morto)_ | **[INAPLICÁVEL]** | StepIndicator vivo tem 3 passos fixos, não recebe steps/totalSteps |
| should display mode selector on step 2 for non-sheet content | **[FALHA-COMPORTAMENTO]** | (setup: passo 1 no vivo) `Unable to find an element with the text: How would you like to add your content?` — o ModeSelector vivo tem copy diferente ("How would you like to add content?") e o heading do wizard morto não existe |
| should not display mode selector for Sheet Music | **[PASSA]** | `contentType === 'Sheet'` oculta o ModeSelector no vivo |
| should handle create mode selection | **[PASSA]** (parcial) | `setMode('create')` wired; avanço p/ passo 5 → INAPLICÁVEL |
| should handle import mode selection | **[PASSA]** (parcial) | `setMode('import')` wired; avanço p/ passo 3 → INAPLICÁVEL |
| should display import mode selector when on step 3 with import mode | **[FALHA-COMPORTAMENTO]** | (setup: passo 1 no vivo) `Unable to find an element with the text: Import Options.` (testid renderiza; heading não existe) |
| should handle single import mode selection | **[PASSA]** (parcial) | `setImportMode('single')` wired; avanço → INAPLICÁVEL |
| should handle batch import mode selection | **[PASSA]** (parcial) | `setImportMode('batch')` wired; avanço → INAPLICÁVEL |
| should display file upload for import mode on step 4 | **[FALHA-COMPORTAMENTO]** | `Unable to find an element with the text: Import Music File.` — **não há UI de upload no vivo**; renderiza o placeholder `"File upload functionality"` |
| should display file upload for Sheet Music on step 3 | **[FALHA-COMPORTAMENTO]** | idem — Sheet Music força mode import ⇒ **adicionar partitura está quebrado** |
| TODO file handling _(já skip no morto)_ | **[INAPLICÁVEL]** | useFileHandling não existe no vivo |
| TODO content creator display _(já skip no morto)_ | **[PASSA]** | des-skipado: no vivo o ContentCreator renderiza no ramo do passo 1 em mode create |
| TODO metadata form _(já skip no morto)_ | **[INAPLICÁVEL]** | no vivo o form de metadados é interno ao DetailsStep (passo 2) |
| TODO batch preview _(já skip no morto)_ | **[INAPLICÁVEL]** | idem (interno ao DetailsStep) |
| TODO creation callback _(já skip no morto)_ | **[INAPLICÁVEL]** | fluxo vivo difere: criar → `setDraftContent`+`setCurrentStep(2)`; `onContentCreated` do pai só dispara no DetailsStep; spec nunca validada |
| should display error messages when present | **[FALHA-COMPORTAMENTO]** | `Unable to find an element with the text: File upload failed.` — o vivo destrutura `error` do hook e **nunca o renderiza** (sem texto, sem `role="alert"`); falhas ficam invisíveis ao usuário |
| should clear errors when moving between steps | **[PASSA]** | ⚠️ passa por vacuidade: erro nunca renderiza, então "ausência de erro" é trivialmente verdadeira |
| should handle missing required data gracefully | **[PASSA]** | não crasha sem file/createdContent |
| TODO lyrics workflow _(já skip no morto)_ | **[INAPLICÁVEL]** | sequência do wizard de 5 passos; nunca validada |
| should handle Chords content workflow | **[PASSA]** | ContentCreator renderiza em mode create |
| should handle Sheet Music workflow | **[FALHA-COMPORTAMENTO]** | `Unable to find an element with the text: Import Music File.` — mesma perda da UI de upload (ModeSelector oculto ✓, upload ✗) |
| TODO re-render _(já skip no morto)_ | **[INAPLICÁVEL]** | nunca validada |
| should handle rapid state changes efficiently | **[PASSA]** | |
| should clean up resources on unmount | **[PASSA]** | |
| TODO ARIA _(já skip no morto)_ | **[INAPLICÁVEL]** | nunca validada; role main/h1/back eram chrome do morto — mas registra gap real de a11y do vivo (sem landmark, sem h1) |
| should support keyboard navigation | **[PASSA]** | |
| should have proper focus management | **[FALHA-COMPORTAMENTO]** | `Unable to find an accessible element with the role "button" and name /back/i` — mesma perda do botão Back |
| should pass correct props to ContentTypeSelector | **[PASSA]** | `selectedType`/`onTypeChange` idênticos |
| should pass correct props to ModeSelector | **[PASSA]** | (setup: passo 1) `selectedMode`/`contentType`/`onModeChange` idênticos |
| should pass correct props to StepIndicator | **[INAPLICÁVEL]** | StepIndicatorComponent vivo recebe só `{ currentStep }`; totalSteps/steps eram API do morto |

Subtotal: **15 [PASSA] / 10 [FALHA-COMPORTAMENTO] / 11 [INAPLICÁVEL]**.

---

## Consolidação dos comportamentos perdidos (todos em /add-content)

1. **UI de upload de arquivo inexistente** (3 its): `mode: "import"` renderiza
   `<p>File upload functionality</p>` — placeholder nunca implementado.
   Impacto: importar arquivo e adicionar Sheet Music não funcionam na rota
   /add-content. É a perda mais grave; candidata a fase de fix dedicada.
2. **Exibição de erro inexistente** (1 it + 1 passe vácuo): `error` do
   useAddContentLogic nunca é renderizado; sem `role="alert"`.
3. **Botão Back inexistente** (2 its): prop `onBack` ignorada no passo 1;
   `router.back()` da página nunca é acionável.
4. **Headings do wizard perdidos** (4 its): "Add New Content", "What type of
   content do you want to add?", "How would you like to add your content?"
   (vivo tem copy divergente dentro do ModeSelector), "Import Options".
   Menor gravidade (copy/UI), mas são spec divergente documentada.

Fix é fase posterior — os its estão preservados como `it.skip` com
comentário `BUG(P1-B)` apontando para este arquivo; para reativar, basta
remover o `.skip` quando o comportamento for restaurado.

## Notas de método

- Retarget em-lugar (mesmos caminhos de arquivo); nenhum arquivo novo de
  teste criado. `tests/hooks/useAddContentState.test.ts` mantém o nome mas
  agora testa `useAddContentLogic` — renomear junto com a remoção do cadáver.
- Após P1-B, nenhum teste importa mais os gêmeos mortos
  (`performance-mode.tsx`, `performance-mode/content-display.tsx`,
  `add-content-refactored.tsx`, `useAddContentState`, `useFileHandling`) —
  exceto `tests/performance/component-refactoring.bench.test.tsx` (fora do
  escopo P1-B; tratar na fase de deleção).
- Its `INAPLICÁVEL` carregam `// INAPLICÁVEL(P1-B): remover junto com o
  gêmeo morto`.
