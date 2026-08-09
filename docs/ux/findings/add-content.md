# Findings — Add Content (importar material)

**Escopo e insumos.** Análise estática da área `/add-content` (Fase C), coração do **J4 — Importar material novo** (peso 10%, contexto declarado: frequentemente no celular, na hora que o arquivo chegou pelo WhatsApp). Insumos: capturas do estado `initial` em 4 viewports (desktop, mobile 390px, tablet portrait, tablet landscape) em `docs/ux/capture/add-content/`, com respectivos `.a11y.json`/`.axe.json`, e leitura do código (`app/add-content/page.tsx`, `components/add-content/*`, `components/metadata-form/*`, `components/batch-preview.tsx`, `hooks/useAddContentLogic.ts`, `hooks/useMetadataForm.ts`, `app/api/storage/upload/route.ts`, `app/api/content/route.ts`, `public/manifest.json`). **Não existe passada populated para esta área** — a B2 não a cobriu; todos os estados que exigem interação (arquivo selecionado, upload em progresso, erro real, conclusão) estão marcados como "Verificar na Fase D". Nas capturas, o layout é consistente entre os 4 viewports, sem quebra estrutural — mobile (viewport prioritário do J4) renderiza a mesma hierarquia em coluna única.

**Histórico fechado:** o Bug F1 (FileUploadZone renderizando placeholder em vez do uploader) foi corrigido antes desta fase. O código atual (`components/add-content/FileUploadZone.tsx`) contém o uploader real (drag-and-drop + browse + input file). O que o JOBS.md pede agora é avaliar a experiência completa pós-fix — é o que os achados abaixo fazem.

Violações axe deduplicadas na área: **3** (button-name crítica no botão de colapso da sidebar — shell global, ausente no mobile; color-contrast 3.29:1 no rótulo verde do tipo selecionado; page-has-heading-one). Ver [ADD-10].

## Achados

### [ADD-01] Falha ao salvar mostra "Content saved successfully!" e engole o erro
- Evidência: `hooks/useMetadataForm.ts:90-91` (`setSuccess("Content saved successfully!")` é chamado **antes** de `onComplete(metadata)`, que não é aguardado); `components/add-content/DetailsStep.tsx:94-96` (falha de `handleSaveContent` cai em `catch` que só faz `console.error`); `components/add-content/RefactoredAddContent.tsx:118-126` (o banner de erro do hook só é renderizado no return do passo 1 — o passo 2 retorna antes, na linha 81-98, sem exibir `error`).
- Problema: se o `POST /api/content` falhar no passo de metadados (rede caiu, validação, sessão expirada), o usuário vê o alert verde de sucesso e permanece na tela sem nenhuma indicação de falha. O item não existe na biblioteca, mas a UI afirmou o contrário. É o pior tipo de erro para o J4: o usuário acredita que importou e só descobre a ausência depois (possivelmente no palco). O estado `error` setado em `useAddContentLogic.ts:231` nunca chega à tela do passo 2.
- Job afetado: J4 (critério "erro com mensagem específica e acionável"); indiretamente J1/J6 (confiança de que o material está lá).
- Severidade: S1
- Esforço: M
- Classe: estrutural

### [ADD-02] Conclusão do batch import despeja o usuário de volta na tela inicial de upload
- Evidência: `components/batch-preview.tsx:43-71` (BatchPreview cria os conteúdos por conta própria via `createContent` e chama `onComplete`); `components/add-content/DetailsStep.tsx:75-80` (`onComplete` → `onNext()` → `setCurrentStep(3)`); `components/add-content/RefactoredAddContent.tsx:57` (`if (currentStep === 3 && createdContent)` — mas `createdContent` do hook permanece `null` nesse caminho, pois quem criou foi o BatchPreview) → o render cai no return do passo 1 (linha 101).
- Problema: ao concluir um batch import, `currentStep` vira 3 mas o `createdContent` do hook nunca é preenchido, então a condição da tela de conclusão falha e o componente renderiza de novo a tela inicial de upload. O usuário recebe só um toast passageiro e é jogado no começo do wizard, sem a confirmação "N songs imported successfully" que o CompletionStep foi feito para mostrar. Agrava-se por existirem **dois** caminhos de save duplicados e divergentes: o branch batch morto em `hooks/useAddContentLogic.ts:178-194` grava `content_data: song.body` (string), enquanto o BatchPreview grava `{ [key]: body }` (objeto) — formas diferentes para o mesmo dado.
- Job afetado: J4.
- Severidade: S1 (confirmar comportamento ao vivo na Fase D — a evidência é lógica de código, não captura)
- Esforço: M
- Classe: estrutural

### [ADD-03] PWA não é share target: o cenário WhatsApp do J4 é impossível
- Evidência: `public/manifest.json` — não há chave `share_target` (nem `file_handlers`); grep por `share_target` em `public/` e `app/` retorna vazio.
- Problema: o contexto declarado do J4 é "recebi o PDF pelo WhatsApp, no celular, na hora". Sem `share_target` no manifest, o Octavia não aparece no share sheet do Android/iOS; o fluxo real obriga salvar o arquivo no aparelho, abrir o app, navegar até Add, tocar Browse e reencontrar o arquivo no picker — vários passos extras justamente no viewport prioritário. O JOBS.md já antecipava: "se não, gap".
- Job afetado: J4 (passo 2 do job, marcado ⚠️ no JOBS.md).
- Severidade: S2
- Esforço: M (manifest + rota receptora do POST multipart + SW)
- Classe: conceitual

### [ADD-04] Nenhum default inteligente: título e artista começam vazios e ambos são obrigatórios
- Evidência: `components/add-content/DetailsStep.tsx:85` (MetadataForm recebe `createdContent={draftContent}`, que é `null` no caminho de upload de arquivo); `hooks/useMetadataForm.ts:34-35` (title/artist inicializam `""`); `components/metadata-form/RefactoredMetadataForm.tsx:125` (Save desabilitado até title **e** artist preenchidos); `hooks/useAddContentLogic.ts:219` (o fallback `metadata.title || uploadedFile.name` é inalcançável, pois o form bloqueia title vazio — e, se alcançado, usaria o nome cru com extensão, ex. "cifra-garota.pdf").
- Problema: o critério do J4 pede título inferido do nome do arquivo. O arquivo enviado nunca é passado ao formulário de metadados, então o usuário digita título do zero mesmo quando o filename já o contém ("Garota de Ipanema - Tom Jobim.pdf"). Artist obrigatório sem default ("Unknown Artist" existe no código mas nunca é oferecido) adiciona um campo mandatório ao caminho crítico. Existe até `sanitizeFilename` (`components/add-content/upload-to-storage.ts:13`) que separa nome de extensão — a inferência seria trivial.
- Job afetado: J4 (critérios "≤8 taps/60s" e "defaults inteligentes").
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [ADD-05] Tom (key) está enterrado no acordeão "Advanced Options"; álbum/gênero/ano/notes são promovidos
- Evidência: `components/metadata-form/RefactoredMetadataForm.tsx:80-112` — BasicMetadataFields = title, artist, album, genre, year, notes; key/bpm/difficulty/capo/tuning ficam dentro do Accordion colapsado "Advanced Options".
- Problema: o passo 3 do J4 é "preencher título, artista, **tom**" — e o J3 depende do tom aparecer na listagem da setlist. Para um app de músico, key é metadado primário, mas custa +2 taps (abrir acordeão, focar campo), enquanto campos raramente usados no job (album, year, notes) ocupam o formulário básico. A priorização dos campos contradiz os jobs.
- Job afetado: J4, J3.
- Severidade: S2
- Esforço: P
- Classe: conceitual

### [ADD-06] Upload sem progresso real, sem cancelamento e sem pré-validação de tamanho
- Evidência: `components/add-content/FileUploadZone.tsx:80-89` (só spinner indeterminado + "Uploading file..."); `components/add-content/upload-to-storage.ts:36-40` (usa `fetch`, que não expõe progresso de upload); ausência de checagem de `file.size` no cliente — o limite de 50MB só é imposto no servidor após o corpo inteiro subir (`lib/api-validation-middleware.ts:253`, `app/api/storage/upload/route.ts:44-58`), embora a UI anuncie "max 50MB" (`FileUploadZone.tsx:112`).
- Problema: no 4G do celular (contexto do J4), um PDF grande sobe sem porcentagem, sem estimativa e sem botão de cancelar; um arquivo de 60MB consome o upload inteiro antes de ser rejeitado. O critério do J4 pede "indicação de progresso; a UI não congela" — o spinner atende ao mínimo, mas não comunica andamento nem permite desistir. Detalhe adicional: o arquivo sobe ao storage no passo 1, antes de qualquer save — abandonar o wizard deixa arquivo órfão no bucket.
- Job afetado: J4.
- Severidade: S2
- Esforço: M (XHR/streams para progresso; a checagem de tamanho no cliente é P)
- Classe: estrutural

### [ADD-07] Mensagens de erro do servidor chegam genéricas ou em jargão técnico
- Evidência: `components/add-content/upload-to-storage.ts:42-44` (o cliente lança apenas `data?.error`, descartando o array `details` que contém a causa específica); `app/api/storage/upload/route.ts:52-54` (`error: 'File validation failed'` + details que ninguém exibe) e `route.ts:91` (`'File extension does not match MIME type'`).
- Problema: o critério do J4 exige "mensagem específica e acionável (o quê e por quê)". A validação client-side de extensão até acerta (`FileUploadZone.tsx:31-33` lista o arquivo e as extensões aceitas), mas qualquer rejeição server-side vira "File validation failed" sem dizer se foi tamanho, tipo ou nome — e o caso MIME × extensão responde com jargão que não orienta ação nenhuma.
- Job afetado: J4.
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [ADD-08] Importar 5 PDFs = rodar o wizard inteiro 5 vezes; não existe multi-arquivo
- Evidência: `components/add-content/FileUploadZone.tsx:27` (`const file = files[0]` — descarta os demais; o `<input>` na linha 100-110 não tem `multiple`); `hooks/useAddContentLogic.ts:94-97` (para Sheet Music — o formato típico de PDF — o modo batch é filtrado, sobrando só "single"). O "Batch Import" existente (`ImportModeSelector.tsx`) é outra coisa: várias músicas **dentro de um** arquivo de texto/DOCX/PDF.
- Problema: o ponto de observação do J4 pergunta explicitamente se importação em lote de 5 PDFs existe. Não existe em nenhum caminho: soltar 5 arquivos no drop zone importa silenciosamente só o primeiro (sem sequer avisar que ignorou os outros 4), e cada PDF adicional custa o ciclo completo tipo → modo → browse → metadados → save.
- Job afetado: J4.
- Severidade: S2
- Esforço: G
- Classe: conceitual

### [ADD-09] Estado inicial contradiz o J4: página abre em "Create New/Lyrics Editor" e o passo 1 se chama "Upload"
- Evidência: capturas `initial-*.png` (4 viewports mostram Lyrics + Create New selecionados e um "Lyrics Editor" ocupando a página); `hooks/useAddContentLogic.ts:30,38,66-72` (defaults `mode="create"`, `contentType=LYRICS`); `components/add-content/StepIndicatorComponent.tsx:11` (passo 1 rotulado "Upload" com ícone de upload, mesmo quando a tela renderiza um editor de texto — `RefactoredAddContent.tsx:151-167`).
- Problema: o uso dominante do J4 é importar arquivo, mas o import é a opção secundária e precisa ser re-selecionada a cada visita (tipo correto + "Import from File"), custando 2 taps extras do orçamento de 8. Ao mesmo tempo, o step indicator promete "Upload" no passo 1 enquanto a tela mostra um editor de criação manual — o modelo de passos não corresponde ao que está na tela, em todos os viewports.
- Job afetado: J4.
- Severidade: S2
- Esforço: M (lembrar última escolha ou reordenar defaults é P; corrigir a semântica dos passos é M)
- Classe: conceitual

### [ADD-10] Acessibilidade: 3 violações axe deduplicadas (1 crítica, 1 séria, 1 moderada)
- Evidência: `initial-{desktop,tablet-portrait,tablet-landscape}.axe.json` — `button-name` (crítica) no botão icon-only de colapso da sidebar (`.md:inline-flex`, shell global — ausente no mobile, que não tem sidebar); `color-contrast` (séria) no rótulo do tipo selecionado (`text-green-600` #16a34a sobre branco, 12px, ratio 3.29:1 vs 4.5:1 exigido — presente nos 4 viewports); `page-has-heading-one` (moderada) — a página não tem `<h1>` no passo 1.
- Problema: o botão sem nome acessível e o contraste insuficiente do rótulo de 12px são padrões que se repetem (o rótulo colorido vem de `getContentTypeColors`, usado também na biblioteca). O `button-name` é do shell global e provavelmente aparecerá deduplicado na síntese entre áreas.
- Job afetado: nenhum diretamente (usuário único, sem leitor de tela declarado) — vale registrar porque o contraste 3.29:1 em fonte de 12px afeta legibilidade real em ambiente de pouca luz, cenário recorrente dos jobs.
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [ADD-11] Três cores diferentes de "selecionado" na mesma tela e nomenclatura instável da ação
- Evidência: capturas `initial-desktop.png`/`initial-mobile.png`; `ModeSelector.tsx:24` (Create New selecionado = ring azul), `ImportModeSelector.tsx:43` (modo de import = ring laranja), `ContentTypeSelector.tsx:39` (tipo = cor do tipo, ex. verde para Lyrics). Nomenclatura: sidebar diz "Add Song" (desktop/tablet), bottom nav mobile diz "Add", a página é "Add Content".
- Problema: o mesmo estado semântico (opção selecionada) usa azul, laranja ou verde conforme o grupo, na mesma tela — o usuário não consegue formar uma regra visual de seleção. A ação de entrada tem três nomes diferentes conforme a superfície. É ruído, não bloqueio.
- Job afetado: nenhum diretamente — registrado como inconsistência de sistema visual que aumenta a carga cognitiva do J4 no primeiro segundo da tela.
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [ADD-12] Trocar o tipo de conteúdo descarta silenciosamente o arquivo já enviado
- Evidência: `hooks/useAddContentLogic.ts:48-73` — o `useEffect` de `contentType` zera `uploadedFile`, `parsedSongs` e volta ao passo 1 sem confirmação; o arquivo já subiu ao storage (upload acontece na seleção, `FileUploadZone.tsx:37-50`).
- Problema: usuário envia o PDF, volta do passo 2 para corrigir o tipo (cifra → partitura) e o upload é perdido — precisa buscar e subir o arquivo de novo (mais um órfão no bucket). Não há aviso nem reaproveitamento da URL já obtida. Metadados digitados sobrevivem (`metadata` não é resetado), mas o arquivo não.
- Job afetado: J4 (critério "sem perder o que já foi feito" no tratamento de erro/correção).
- Severidade: S3
- Esforço: P
- Classe: estrutural

## Verificar na Fase D

1. **Orçamento de taps do J4 (mobile)**: do dashboard até "Save Content" com PDF de cifra, contar taps e tempo reais. Estimativa estática: Add (1) + tipo Chords (2) + Import from File (3) + Browse (4) + picker (externo) + Title (5) + Artist (6) + acordeão Advanced (7) + Key (8) + Save (9) = **~9 taps, acima da meta de 8**. Confirmar.
2. **[ADD-01]** Forçar falha do `POST /api/content` no passo 2 (ex.: modo avião após o upload) — o alert verde "Content saved successfully!" aparece mesmo com a falha? O que resta na tela? Os metadados digitados persistem?
3. **[ADD-02]** Completar um batch import real (TXT com 3 músicas) e registrar qual tela aparece após "Import All": CompletionStep ou a tela inicial de upload?
4. **Erro de arquivo real**: (a) arquivo >50MB e (b) `.zip` renomeado para `.pdf` (dispara o check de MIME server-side). Registrar a mensagem exata exibida em cada caso e se algo digitado se perde.
5. **Busca imediata**: item recém-importado aparece na busca/biblioteca sem reload manual? (critério J4 "imediatamente localizável").
6. **Progresso percebido**: upload de PDF de ~20-40MB em rede lenta (throttling) — a UI congela? O spinner comunica o suficiente? Dá para cancelar/navegar durante?
7. **Auto-detect de imagem**: subir um `.png` com tipo "Lyrics" selecionado (o código troca sozinho para Sheet, `useAddContentLogic.ts:116-120`) — a troca automática é comunicada ou o usuário se perde?
8. **Multi-seleção silenciosa**: soltar 5 PDFs de uma vez no drop zone — confirmar que 4 são ignorados sem qualquer aviso ([ADD-08]).
