# Kill-list — RASCUNHO (P0-C)

**Isto é um rascunho. NADA será deletado sem revisão humana.** Esta fase só
acusa; a deleção é trabalho da Fase 1, arquivo a arquivo, com revisão.

Critério de entrada (dupla condenação, fontes independentes):
1. **Órfão no grafo do P0-B** (dependency-cruiser, fecho transitivo a partir de
   todas as rotas/middleware/worker) — evidência: `.audit/orphans.md`, tabela
   "Código órfão".
2. **Unused file no knip** (resolução própria, plugins Next/vitest/playwright,
   testes como entry) — evidência: `.audit/knip-report.md`, seção "Unused files".

Coluna "protegido por teste ativo?": um arquivo importado por qualquer teste é
absolvido pelo knip por construção (testes são entry) e portanto NUNCA entra
aqui — verificado programaticamente: 0 dos 61 têm importador de teste. Por isso
a coluna é "não" em todas as linhas; ela existe para a Fase 1 reverificar linha
a linha antes de deletar.

**Fora desta lista por construção** (ver KNIP-NOTES.md):
- `components/ui/*` (12 órfãos do P0-B): knip os ignora como vendor shadcn — sem segunda condenação.
- Órfãos do P0-B vivos apenas via testes (performance-mode.tsx, add-content-refactored.tsx etc.): absolvidos pelo knip — ver discordâncias no harness-map/P0-C.
- Achados só do knip fora do universo do grafo (scripts/, src/, types/, lib/__tests__): sem primeira condenação.

## 61 arquivos com dupla condenação (≈302 KB)

| Arquivo | KB | Evidência 1 (grafo P0-B) | Evidência 2 (knip) | Protegido por teste ativo? |
|---|--:|---|---|---|
| components/auth/login-form.tsx | 5.0 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/auth/signup-form.tsx | 10.0 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/batch-import.tsx | 7.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/common/action-card.tsx | 5.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/common/data-list.tsx | 3.8 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/common/form-dialog.tsx | 3.3 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/common/index.ts | 0.9 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/common/status-badge.tsx | 3.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/file-upload/FileUploadProgress.tsx | 3.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/file-upload/FileUploadZone.tsx | 2.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/library-list.tsx | 11.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/library/index.ts | 0.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/metadata-editor.tsx | 9.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/performance-mode/optimized-performance-controls.tsx | 8.1 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/setlist/setlist-list-refactored.tsx | 4.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/simple-editor.tsx | 1.8 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/text-import-preview.tsx | 1.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/theme-provider.tsx | 0.3 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| components/user-profile.tsx | 6.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/ContentDisplay.tsx | 13.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/ContentTypeSelector.tsx | 2.1 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/ContentViewerHeader.tsx | 3.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/ContentViewerSidebar.tsx | 5.4 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/ContentViewerToolbar.tsx | 3.3 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/CreationModeSelector.tsx | 1.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/DeleteConfirmDialog.tsx | 1.1 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/ImportOptions.tsx | 3.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/StepIndicator.tsx | 2.0 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/components/SuccessScreen.tsx | 2.7 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/hooks/use-content-creation.ts | 8.3 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/hooks/use-content-viewer.ts | 5.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/index.ts | 1.1 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/services/content-repository.ts | 6.1 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/services/content-service.ts | 6.9 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/content-management/utils/content-display-helpers.ts | 0.9 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/components/DomainErrorBoundary.tsx | 2.0 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/components/ErrorBoundary.tsx | 5.8 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/components/GlobalErrorHandler.tsx | 3.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/components/index.ts | 0.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/hooks/index.ts | 0.1 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/hooks/use-error-handler.ts | 2.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/services/base-repository.ts | 2.9 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/services/index.ts | 0.3 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| domains/shared/services/supabase-repository.ts | 4.8 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| hooks/use-async.ts | 3.0 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| hooks/use-mobile.tsx | 0.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| hooks/useFileUpload.ts | 5.7 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/base-service.ts | 6.1 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/content-service-refactored.ts | 11.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/database-optimization.ts | 13.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/error-handler.ts | 4.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/file-security.ts | 10.6 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/firebase-admin-client.ts | 4.2 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/pdf-debug.ts | 5.5 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/performance-optimization.ts | 8.7 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/security-audit-logger.ts | 15.8 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/setlist-service-refactored.ts | 12.7 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/setlist-validation.ts | 6.3 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/sql-injection-prevention.ts | 13.4 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/test-utils/render-with-auth.tsx | 0.9 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |
| lib/validation.ts | 1.4 | órfão (orphans.md, tabela "Código órfão") | unused file (knip-report.md §Unused files) | **não** |

## Leitura por bloco (para a Fase 1 atacar em ordem)

- **`domains/**` inteiro menos 1 arquivo** (25 dos 26 arquivos da árvore; a
  única exceção é `domains/shared/state-management/app-store.ts`, vivo apenas
  via `tests/utils/test-utils.tsx` e por isso absolvido pelo knip): a
  arquitetura DDD paralela nunca foi ligada a nenhuma rota.
- **Trilha `-refactored` de serviços**: lib/base-service.ts,
  lib/content-service-refactored.ts, lib/setlist-service-refactored.ts —
  cadeia fechada que ninguém importa.
- **Auth UI morta**: components/auth/login-form.tsx e signup-form.tsx (o app
  usa outra tela de login — confirmar qual na Fase 1 antes de deletar).
- **Segurança nunca ligada**: lib/file-security.ts (o CLAUDE.md a cita como
  camada obrigatória, mas nada a importa), lib/sql-injection-prevention.ts,
  lib/security-audit-logger.ts, lib/setlist-validation.ts, lib/validation.ts,
  lib/error-handler.ts — **atenção**: deletar é decisão de produto/segurança,
  não só de higiene; pode ser feature faltando, não código morto.
- **Órfãos soltos**: batch-import, library-list, metadata-editor,
  user-profile, simple-editor, text-import-preview, theme-provider,
  common/*, file-upload/{Zone,Progress}, setlist-list-refactored,
  optimized-performance-controls, use-async, use-mobile, useFileUpload,
  database-optimization, pdf-debug, performance-optimization,
  firebase-admin-client, render-with-auth.
