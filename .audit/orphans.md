# Órfãos — fora do fecho de qualquer entrypoint

Entrypoints considerados (40): todas as páginas/rotas/layouts/loading/error do App Router, middleware.ts, worker/index.js; setups de vitest/playwright entram via grafo de testes para marcação "só testes".

Universo: app/ components/ lib/ hooks/ domains/ — 317 arquivos no grafo.
Órfãos: 120 (89 código, 31 arquivos de teste colocados)

## Código órfão

| Arquivo | KB | Importado por testes? | Importadores prod (também órfãos) | Referências dinâmicas/textuais (grep) |
|---|---|---|---|---|
| components/add-content-refactored.tsx | 8.5 | tests/components/add-content.refactoring.test.tsx<br>tests/performance/component-refactoring.bench.test.tsx | — | — |
| components/add-content/StepIndicator.tsx | 1.8 | tests/components/add-content.refactoring.test.tsx<br>tests/performance/component-refactoring.bench.test.tsx | components/add-content-refactored.tsx | components/add-content-refactored.tsx<br>domains/content-management/index.ts |
| components/auth/login-form.tsx | 5.0 | — | — | — |
| components/auth/signup-form.tsx | 10.0 | — | — | — |
| components/batch-import.tsx | 7.2 | — | — | hooks/useAddContentLogic.ts<br>hooks/useAddContentState.ts<br>domains/content-management/hooks/use-content-creation.ts |
| components/common/action-card.tsx | 5.2 | — | components/common/index.ts | components/common/index.ts |
| components/common/data-list.tsx | 3.8 | — | components/common/index.ts | components/common/index.ts |
| components/common/form-dialog.tsx | 3.3 | — | components/common/index.ts | components/common/index.ts |
| components/common/index.ts | 0.9 | — | components/setlist/setlist-list-refactored.tsx | — |
| components/common/status-badge.tsx | 3.5 | — | components/common/index.ts | components/common/index.ts |
| components/file-upload.tsx | 14.6 | — | components/add-content-refactored.tsx | components/add-content-refactored.tsx |
| components/file-upload/FileUploadProgress.tsx | 3.2 | — | — | — |
| components/file-upload/FileUploadZone.tsx | 2.6 | — | — | — |
| components/library-list.tsx | 11.5 | — | — | lib/performance-optimization.ts |
| components/library/index.ts | 0.6 | — | — | — |
| components/metadata-editor.tsx | 9.6 | — | — | — |
| components/performance-mode.tsx | 6.7 | __tests__/performance-mode/chords-display-bug.test.tsx | lib/performance-optimization.ts | lib/performance-optimization.ts |
| components/performance-mode/content-display.tsx | 4.2 | components/__tests__/content-display.test.tsx | components/performance-mode.tsx | components/performance-mode.tsx<br>components/__tests__/content-display.test.tsx |
| components/performance-mode/optimized-performance-controls.tsx | 8.1 | — | — | — |
| components/setlist/setlist-list-refactored.tsx | 4.5 | — | — | — |
| components/simple-editor.tsx | 1.8 | — | components/text-import-preview.tsx | components/text-import-preview.tsx |
| components/text-import-preview.tsx | 1.6 | — | — | — |
| components/theme-provider.tsx | 0.3 | — | — | — |
| components/ui/alert-dialog.tsx | 4.3 | — | components/file-upload.tsx | components/file-upload.tsx |
| components/ui/aspect-ratio.tsx | 0.2 | — | — | — |
| components/ui/breadcrumb.tsx | 2.6 | — | — | — |
| components/ui/calendar.tsx | 2.5 | — | — | — |
| components/ui/collapsible.tsx | 0.3 | — | — | — |
| components/ui/popover.tsx | 1.2 | — | — | — |
| components/ui/progress.tsx | 0.8 | — | components/file-upload.tsx<br>components/file-upload/FileUploadProgress.tsx | components/file-upload/FileUploadProgress.tsx<br>components/file-upload.tsx |
| components/ui/resizable.tsx | 1.7 | — | — | — |
| components/ui/sheet.tsx | 4.2 | — | — | components/add-content/RefactoredAddContent.tsx<br>components/add-content/ContentTypeSelector.tsx<br>components/content-creator.tsx<br>hooks/useAddContentLogic.ts<br>domains/content-management/components/ContentTypeSelector.tsx |
| components/ui/table.tsx | 2.7 | — | — | lib/input-sanitizer.ts |
| components/ui/toaster.tsx | 0.8 | — | — | — |
| components/ui/toggle.tsx | 1.5 | — | — | — |
| components/user-profile.tsx | 6.5 | — | — | — |
| domains/content-management/components/ContentDisplay.tsx | 13.5 | — | domains/content-management/index.ts | components/content-viewer.tsx<br>domains/content-management/index.ts |
| domains/content-management/components/ContentTypeSelector.tsx | 2.1 | — | domains/content-management/index.ts | components/add-content-refactored.tsx<br>components/add-content/RefactoredAddContent.tsx<br>domains/content-management/index.ts |
| domains/content-management/components/ContentViewerHeader.tsx | 3.5 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/components/ContentViewerSidebar.tsx | 5.4 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/components/ContentViewerToolbar.tsx | 3.3 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/components/CreationModeSelector.tsx | 1.5 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/components/DeleteConfirmDialog.tsx | 1.1 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/components/ImportOptions.tsx | 3.5 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/components/StepIndicator.tsx | 2.0 | — | domains/content-management/index.ts | components/add-content-refactored.tsx<br>domains/content-management/index.ts |
| domains/content-management/components/SuccessScreen.tsx | 2.7 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/hooks/use-content-creation.ts | 8.3 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/hooks/use-content-viewer.ts | 5.6 | — | domains/content-management/index.ts | domains/content-management/index.ts |
| domains/content-management/index.ts | 1.1 | — | — | — |
| domains/content-management/services/content-repository.ts | 6.1 | — | domains/content-management/index.ts<br>domains/content-management/services/content-service.ts | domains/content-management/index.ts<br>domains/content-management/services/content-service.ts |
| domains/content-management/services/content-service.ts | 6.9 | — | domains/content-management/index.ts | app/content/[id]/edit/page.tsx<br>components/batch-preview.tsx<br>components/content-page-client.tsx<br>components/setlist-manager-original.tsx.backup<br>components/batch-import.tsx<br>components/content-edit-page-client.tsx<br>lib/content-service-server.ts<br>lib/__tests__/content-service.test.ts<br>lib/setlist-service.ts<br>hooks/use-content-actions.ts<br>hooks/useAddContentLogic.ts<br>hooks/use-setlist-data.ts<br>hooks/use-library-data.ts<br>hooks/__tests__/use-library-data.test.tsx<br>hooks/__tests__/use-setlist-data.test.tsx<br>hooks/useContentActions.ts<br>hooks/useMetadataForm.ts<br>domains/content-management/hooks/use-content-viewer.ts<br>domains/content-management/hooks/use-content-creation.ts<br>domains/content-management/index.ts |
| domains/content-management/utils/content-display-helpers.ts | 0.9 | — | domains/content-management/components/ContentDisplay.tsx<br>domains/content-management/components/ContentViewerHeader.tsx<br>domains/content-management/index.ts | domains/content-management/components/ContentViewerHeader.tsx<br>domains/content-management/components/ContentDisplay.tsx<br>domains/content-management/index.ts |
| domains/shared/components/DomainErrorBoundary.tsx | 2.0 | — | domains/shared/components/index.ts | domains/shared/components/index.ts |
| domains/shared/components/ErrorBoundary.tsx | 5.8 | — | domains/shared/components/DomainErrorBoundary.tsx<br>domains/shared/components/index.ts | domains/shared/components/index.ts<br>domains/shared/components/DomainErrorBoundary.tsx |
| domains/shared/components/GlobalErrorHandler.tsx | 3.2 | — | domains/shared/components/index.ts | domains/shared/components/index.ts |
| domains/shared/components/index.ts | 0.2 | — | — | — |
| domains/shared/hooks/index.ts | 0.1 | — | — | — |
| domains/shared/hooks/use-error-handler.ts | 2.5 | — | domains/shared/hooks/index.ts | domains/shared/hooks/index.ts |
| domains/shared/services/base-repository.ts | 2.9 | — | domains/content-management/services/content-repository.ts<br>domains/shared/services/supabase-repository.ts<br>domains/shared/services/index.ts | domains/shared/services/supabase-repository.ts<br>domains/shared/services/index.ts<br>domains/content-management/services/content-repository.ts |
| domains/shared/services/index.ts | 0.3 | — | — | — |
| domains/shared/services/supabase-repository.ts | 4.8 | — | domains/content-management/services/content-repository.ts<br>domains/shared/services/index.ts | domains/shared/services/index.ts<br>domains/content-management/services/content-repository.ts |
| domains/shared/state-management/app-store.ts | 14.7 | tests/utils/test-utils.tsx | domains/content-management/hooks/use-content-creation.ts<br>domains/content-management/hooks/use-content-viewer.ts<br>domains/shared/components/GlobalErrorHandler.tsx<br>domains/shared/hooks/use-error-handler.ts | domains/shared/components/GlobalErrorHandler.tsx<br>domains/shared/hooks/use-error-handler.ts<br>domains/content-management/hooks/use-content-viewer.ts<br>domains/content-management/hooks/use-content-creation.ts |
| hooks/use-async.ts | 3.0 | — | — | — |
| hooks/use-content-caching.ts | 5.3 | hooks/__tests__/use-content-caching.test.ts | components/performance-mode.tsx | components/performance-mode.tsx<br>hooks/__tests__/use-content-caching.test.ts |
| hooks/use-content-preloader.ts | 6.2 | — | components/performance-mode.tsx | components/performance-mode.tsx |
| hooks/use-mobile.tsx | 0.6 | — | — | — |
| hooks/useAddContentState.ts | 2.9 | tests/components/add-content.refactoring.test.tsx<br>tests/hooks/useAddContentState.test.ts<br>tests/performance/component-refactoring.bench.test.tsx | components/add-content-refactored.tsx | components/add-content-refactored.tsx |
| hooks/useFileHandling.ts | 1.7 | tests/components/add-content.refactoring.test.tsx<br>tests/performance/component-refactoring.bench.test.tsx | components/add-content-refactored.tsx | components/add-content-refactored.tsx |
| hooks/useFileUpload.ts | 5.7 | — | — | — |
| lib/base-service.ts | 6.1 | — | lib/content-service-refactored.ts<br>lib/setlist-service-refactored.ts | lib/setlist-service-refactored.ts<br>lib/content-service-refactored.ts |
| lib/content-service-refactored.ts | 11.2 | — | lib/setlist-service-refactored.ts | lib/setlist-service-refactored.ts |
| lib/database-optimization.ts | 13.2 | — | — | — |
| lib/error-handler.ts | 4.6 | — | — | — |
| lib/file-security.ts | 10.6 | — | — | — |
| lib/firebase-admin-client.ts | 4.2 | — | — | — |
| lib/pdf-debug.ts | 5.5 | — | — | — |
| lib/performance-optimization.ts | 8.7 | — | — | — |
| lib/platform-utils.ts | 12.4 | tests/platform/platform-utils.test.ts<br>tests/platform/platform-validation.test.ts<br>tests/platform/react-native-compatibility.test.ts | lib/react-native-compatibility.ts | lib/react-native-compatibility.ts |
| lib/react-native-compatibility.ts | 13.5 | tests/platform/react-native-compatibility.test.ts | — | — |
| lib/security-audit-logger.ts | 15.8 | — | lib/sql-injection-prevention.ts | lib/sql-injection-prevention.ts |
| lib/security-logger.ts | 4.0 | lib/__tests__/security-logger.test.ts | — | lib/__tests__/security-logger.test.ts |
| lib/setlist-service-refactored.ts | 12.7 | — | — | — |
| lib/setlist-validation.ts | 6.3 | — | — | — |
| lib/sql-injection-prevention.ts | 13.4 | — | — | — |
| lib/storage-service.ts | 4.8 | — | components/file-upload.tsx<br>hooks/useFileUpload.ts | components/file-upload.tsx<br>hooks/useFileUpload.ts |
| lib/test-utils/api-test-helpers.ts | 1.5 | app/api/setlists/[id]/__tests__/route.test.ts<br>app/api/setlists/__tests__/route.test.ts | — | app/api/auth/__tests__/verify.test.ts<br>app/api/auth/__tests__/session.test.ts<br>app/api/content/__tests__/route.test.ts<br>app/api/content/[id]/__tests__/route.test.ts<br>app/api/storage/__tests__/delete.test.ts<br>app/api/setlists/__tests__/route.test.ts<br>app/api/setlists/[id]/__tests__/route.test.ts<br>lib/__tests__/auth-mock-example.test.ts<br>lib/__tests__/README-auth-mocking.md |
| lib/test-utils/render-with-auth.tsx | 0.9 | — | — | — |
| lib/test-utils/supabase-mock-factory.ts | 7.9 | — | lib/test-utils/api-test-helpers.ts | lib/test-utils/api-test-helpers.ts |
| lib/validation.ts | 1.4 | — | — | lib/error-handler.ts |

## Arquivos de teste colocados (fora do fecho, esperado)

- app/api/auth/__tests__/session.test.ts (10.3 KB)
- app/api/auth/__tests__/verify.test.ts (7.3 KB)
- app/api/auth/user/__tests__/route.test.ts (18.2 KB)
- app/api/content/[id]/__tests__/route.test.ts (10.8 KB)
- app/api/content/__tests__/route.test.ts (10.7 KB)
- app/api/profile/__tests__/route.test.ts (15.0 KB)
- app/api/setlists/[id]/__tests__/route.test.ts (12.0 KB)
- app/api/setlists/[id]/songs/__tests__/route.test.ts (14.7 KB)
- app/api/setlists/__tests__/route.test.ts (8.8 KB)
- app/api/storage/__tests__/delete.test.ts (6.4 KB)
- app/api/storage/__tests__/upload.test.ts (2.0 KB)
- components/__tests__/content-display.test.tsx (8.1 KB)
- hooks/__tests__/use-content-caching.test.ts (11.1 KB)
- hooks/__tests__/use-content-renderer.test.ts (6.9 KB)
- hooks/__tests__/use-debounce.test.tsx (0.7 KB)
- hooks/__tests__/use-library-data.test.tsx (6.6 KB)
- hooks/__tests__/use-performance-navigation.test.ts (14.4 KB)
- hooks/__tests__/use-setlist-data.test.tsx (10.5 KB)
- hooks/__tests__/use-toast.test.ts (1.4 KB)
- lib/__tests__/api-test-helpers.ts (18.3 KB)
- lib/__tests__/auth-mock-example.test.ts (7.7 KB)
- lib/__tests__/behavioral-test-helpers.ts (11.7 KB)
- lib/__tests__/content-service.test.ts (7.6 KB)
- lib/__tests__/custom-matchers.ts (13.2 KB)
- lib/__tests__/firebase-admin.test.ts (8.3 KB)
- lib/__tests__/firebase-server-utils.test.ts (15.3 KB)
- lib/__tests__/security-logger.test.ts (3.3 KB)
- lib/__tests__/setlist-service.test.ts (5.1 KB)
- lib/__tests__/test-auth.tsx (6.0 KB)
- lib/__tests__/test-database.ts (9.0 KB)
- lib/__tests__/utils.test.ts (0.7 KB)
