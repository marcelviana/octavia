# F1 — Design: restauração do upload de arquivo em /add-content

Data: 2026-07-24. Contexto: `.audit/LOST-BEHAVIOR.md` (achado crítico P1-B).

## Reconhecimento — o que existe vivo hoje

- **Backend**: `app/api/storage/upload/route.ts` está vivo, autenticado
  (`requireAuthServerSecure`), com validação Zod (`storageSchemas.upload`),
  checagem extensão×MIME (pdf/txt/docx/png/jpg/jpeg), rate limit, e upload
  para o bucket Supabase via service role. **Órfã**: zero callers no client
  (grep por `api/storage` fora de `app/api/storage/` → vazio).
- **Auth no client**: `lib/auth-manager.ts` (`getValidToken`) está vivo — é
  o mesmo caminho que o `storage-service.ts` deletado usava para obter o
  Bearer token.
- **Hook**: `useAddContentLogic.handleFilesUploaded(files)` está vivo e
  testado (20 its verdes) — recebe `UploadedFile[]`, auto-detecta imagem →
  Sheet, e avança para o passo 2 (DetailsStep) ou dispara batch parsing.
  Ou seja: o contrato pós-upload já existe; falta só a UI que o alimenta.
- **Save**: `handleSaveContent` no ramo `uploadedFile` grava
  `file_url: uploadedFile.name` com o comentário "This would be the
  uploaded file URL" — stub que confirma que a URL real deveria vir do
  upload feito antes.

## Decisão: qual caminho de upload

**Nenhum caminho de upload vivo existe no client** — tudo estava nos
arquivos deletados (`file-upload.tsx` → `storage-service.uploadFileToStorage`
→ `POST /api/storage/upload`). Decisão:

1. **Novo componente** `components/add-content/FileUploadZone.tsx`
   (<150 linhas), substituindo o placeholder no ramo `mode === "import"` de
   `RefactoredAddContent`. Não ressuscita o `file-upload.tsx` deletado —
   é uma reimplementação enxuta usando sua lógica como referência
   (histórico git, commit `2b2c756^`).
2. **Backend**: a rota viva `POST /api/storage/upload`, com Bearer token de
   `getValidToken()` (lib/auth-manager.ts) — exatamente o handshake que a
   rota já valida em seus próprios testes.
3. **Momento do upload**: no ato da seleção (como o componente de
   referência fazia): o arquivo sobe, e o `UploadedFile` entregue a
   `handleFilesUploaded` carrega a `url` pública retornada pela rota.
4. **Aceites por contentType** (espelham a whitelist da rota):
   - Sheet Music: `.pdf, .png, .jpg, .jpeg`
   - Lyrics/Chords/Tab: `.pdf, .docx, .txt`
5. **Mudança mínima no hook**: `handleSaveContent` passa a gravar
   `file_url: uploadedFile.url ?? uploadedFile.name` e a interface
   `UploadedFile` ganha `url?: string`. Sem isso a URL real do storage é
   descartada e o content aponta para um nome de arquivo solto. Os 20 its
   do hook cobrem apenas estado (setters/workflow), não o save — não são
   afetados.

## Fora de escopo (registrado, não feito)

- Validação de segurança dedicada de upload no client (item em aberto do
  CLAUDE.md/.audit — a rota já valida no servidor).
- Batch parsing UX e headings do wizard (4 its de copy seguem skipados —
  Fase 5).
