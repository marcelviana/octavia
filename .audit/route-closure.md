# Fecho transitivo por rota (App Router)

Fonte: .audit/graph.json (dependency-cruiser com tsConfig, aliases @/ resolvidos)

Rotas encontradas: 36

## app/add-content/page.tsx

Arquivos no fecho: 58

- app/add-content/page.tsx
- components/add-content.tsx
- components/add-content/CompletionStep.tsx
- components/add-content/ContentTypeSelector.tsx
- components/add-content/DetailsStep.tsx
- components/add-content/ImportModeSelector.tsx
- components/add-content/ModeSelector.tsx
- components/add-content/RefactoredAddContent.tsx
- components/add-content/StepIndicatorComponent.tsx
- components/batch-preview.tsx
- components/bottom-nav.tsx
- components/content-creator.tsx
- components/header.tsx
- components/metadata-form.tsx
- components/metadata-form/AdvancedMetadataFields.tsx
- components/metadata-form/BasicMetadataFields.tsx
- components/metadata-form/RefactoredMetadataForm.tsx
- components/navigation-container.tsx
- components/responsive-layout.tsx
- components/sidebar.tsx
- components/ui/accordion.tsx
- components/ui/alert.tsx
- components/ui/avatar.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/checkbox.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/select.tsx
- components/ui/textarea.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- hooks/useAddContentLogic.ts
- hooks/useMetadataForm.ts
- lib/auth-manager.ts
- lib/batch-import.ts
- lib/content-service.ts
- lib/content-type-styles.ts
- lib/content-types.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-queue.ts
- lib/offline-setlist-cache.ts
- lib/pdf-utils.ts
- lib/supabase-service.ts
- lib/supabase.ts
- lib/utils.ts
- types/content.ts
- types/supabase.ts

## app/api/auth/session/route.ts

Arquivos no fecho: 6

- app/api/auth/session/route.ts
- lib/api-validation-middleware.ts
- lib/input-sanitizer.ts
- lib/logger.ts
- lib/rate-limiter.ts
- lib/secure-auth-utils.ts

## app/api/auth/user/route.ts

Arquivos no fecho: 4

- app/api/auth/user/route.ts
- lib/firebase-admin.ts
- lib/logger.ts
- lib/rate-limit.ts

## app/api/auth/validate-token/route.ts

Arquivos no fecho: 3

- app/api/auth/validate-token/route.ts
- lib/firebase-admin.ts
- lib/logger.ts

## app/api/auth/verify/route.ts

Arquivos no fecho: 6

- app/api/auth/verify/route.ts
- lib/firebase-admin.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/validation-schemas.ts
- lib/validation-utils.ts

## app/api/content/[id]/route.ts

Arquivos no fecho: 9

- app/api/content/[id]/route.ts
- lib/api-validation-middleware.ts
- lib/firebase-server-utils.ts
- lib/input-sanitizer.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/secure-auth-utils.ts
- lib/supabase-service.ts
- types/supabase.ts

## app/api/content/route.ts

Arquivos no fecho: 9

- app/api/content/route.ts
- lib/content-types.ts
- lib/firebase-server-utils.ts
- lib/logger.ts
- lib/rate-limiter.ts
- lib/supabase-service.ts
- lib/validation-schemas.ts
- lib/validation-utils.ts
- types/supabase.ts

## app/api/debug/config/route.ts

Arquivos no fecho: 4

- app/api/debug/config/route.ts
- lib/logger.ts
- lib/supabase-service.ts
- types/supabase.ts

## app/api/firebase-config/route.ts

Arquivos no fecho: 2

- app/api/firebase-config/route.ts
- lib/rate-limit.ts

## app/api/health/route.ts

Arquivos no fecho: 2

- app/api/health/route.ts
- lib/rate-limit.ts

## app/api/profile/route.ts

Arquivos no fecho: 8

- app/api/profile/route.ts
- lib/api-validation-middleware.ts
- lib/input-sanitizer.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/secure-auth-utils.ts
- lib/supabase-service.ts
- types/supabase.ts

## app/api/proxy/route.ts

Arquivos no fecho: 6

- app/api/proxy/route.ts
- lib/firebase-server-utils.ts
- lib/logger.ts
- lib/supabase-service.ts
- lib/supabase.ts
- types/supabase.ts

## app/api/setlists/[id]/route.ts

Arquivos no fecho: 10

- app/api/setlists/[id]/route.ts
- lib/api-validation-middleware.ts
- lib/firebase-server-utils.ts
- lib/input-sanitizer.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/secure-auth-utils.ts
- lib/supabase-service.ts
- types/setlist.ts
- types/supabase.ts

## app/api/setlists/[id]/songs/route.ts

Arquivos no fecho: 9

- app/api/setlists/[id]/songs/route.ts
- lib/api-validation-middleware.ts
- lib/firebase-server-utils.ts
- lib/input-sanitizer.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/secure-auth-utils.ts
- lib/supabase-service.ts
- types/supabase.ts

## app/api/setlists/route.ts

Arquivos no fecho: 9

- app/api/setlists/route.ts
- lib/api-validation-middleware.ts
- lib/firebase-server-utils.ts
- lib/input-sanitizer.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/secure-auth-utils.ts
- lib/supabase-service.ts
- types/supabase.ts

## app/api/setlists/songs/[songId]/route.ts

Arquivos no fecho: 6

- app/api/setlists/songs/[songId]/route.ts
- lib/firebase-server-utils.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/supabase-service.ts
- types/supabase.ts

## app/api/storage/delete/route.ts

Arquivos no fecho: 8

- app/api/storage/delete/route.ts
- lib/firebase-server-utils.ts
- lib/logger.ts
- lib/rate-limit.ts
- lib/supabase-service.ts
- lib/validation-schemas.ts
- lib/validation-utils.ts
- types/supabase.ts

## app/api/storage/upload/route.ts

Arquivos no fecho: 8

- app/api/storage/upload/route.ts
- lib/api-validation-middleware.ts
- lib/input-sanitizer.ts
- lib/logger.ts
- lib/rate-limiter.ts
- lib/secure-auth-utils.ts
- lib/supabase-service.ts
- types/supabase.ts

## app/api/test-setlists/route.ts

Arquivos no fecho: 2

- app/api/test-setlists/route.ts
- lib/rate-limit.ts

## app/content/[id]/edit/page.tsx

Arquivos no fecho: 52

- app/content/[id]/edit/page.tsx
- components/annotation-tools.tsx
- components/bottom-nav.tsx
- components/chord-editor.tsx
- components/content-edit-page-client.tsx
- components/content-editor.tsx
- components/editors/content-type-editor.tsx
- components/header.tsx
- components/lyrics-editor.tsx
- components/music-text.tsx
- components/navigation-container.tsx
- components/pdf-viewer.tsx
- components/responsive-layout.tsx
- components/sidebar.tsx
- components/tab-editor.tsx
- components/ui/accordion.tsx
- components/ui/avatar.tsx
- components/ui/badge.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/checkbox.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/select.tsx
- components/ui/separator.tsx
- components/ui/textarea.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/unified-metadata-editor.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/auth-manager.ts
- lib/content-service.ts
- lib/content-type-styles.ts
- lib/content-types.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-queue.ts
- lib/offline-setlist-cache.ts
- lib/supabase-service.ts
- lib/supabase.ts
- lib/utils.ts
- types/annotations.ts
- types/content.ts
- types/supabase.ts

## app/content/[id]/page.tsx

Arquivos no fecho: 69

- app/content/[id]/page.tsx
- components/annotation-tools.tsx
- components/bottom-nav.tsx
- components/chord-editor.tsx
- components/content-editor.tsx
- components/content-page-client.tsx
- components/content-viewer.tsx
- components/content-viewer/ChordDisplay.tsx
- components/content-viewer/ContentDisplay.tsx
- components/content-viewer/ContentHeader.tsx
- components/content-viewer/ContentSidebar.tsx
- components/content-viewer/ContentToolbar.tsx
- components/content-viewer/DeleteDialog.tsx
- components/content-viewer/LyricsDisplay.tsx
- components/content-viewer/SheetMusicDisplay.tsx
- components/content-viewer/TabDisplay.tsx
- components/editors/content-type-editor.tsx
- components/header.tsx
- components/lyrics-editor.tsx
- components/music-text.tsx
- components/navigation-container.tsx
- components/pdf-viewer.tsx
- components/responsive-layout.tsx
- components/sidebar.tsx
- components/tab-editor.tsx
- components/ui/accordion.tsx
- components/ui/avatar.tsx
- components/ui/badge.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/checkbox.tsx
- components/ui/dialog.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/select.tsx
- components/ui/separator.tsx
- components/ui/slider.tsx
- components/ui/textarea.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/unified-metadata-editor.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- hooks/useContentActions.ts
- hooks/useContentFile.ts
- lib/auth-manager.ts
- lib/content-service-server.ts
- lib/content-service.ts
- lib/content-type-styles.ts
- lib/content-types.ts
- lib/debug.ts
- lib/error-boundary.tsx
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-queue.ts
- lib/offline-setlist-cache.ts
- lib/setlist-service.ts
- lib/supabase-service.ts
- lib/supabase.ts
- lib/utils.ts
- types/annotations.ts
- types/content.ts
- types/supabase.ts

## app/dashboard/page.tsx

Arquivos no fecho: 37

- app/dashboard/page.tsx
- components/bottom-nav.tsx
- components/dashboard-page-client.tsx
- components/dashboard.tsx
- components/header.tsx
- components/navigation-container.tsx
- components/responsive-layout.tsx
- components/sidebar.tsx
- components/ui/avatar.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/tabs.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/auth-manager.ts
- lib/content-service-server.ts
- lib/content-service.ts
- lib/content-types.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-queue.ts
- lib/offline-setlist-cache.ts
- lib/setlist-service.ts
- lib/supabase-service.ts
- lib/supabase.ts
- lib/utils.ts
- types/supabase.ts

## app/forgot-password/page.tsx

Arquivos no fecho: 9

- app/forgot-password/page.tsx
- components/ui/alert.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- lib/firebase.ts
- lib/logger.ts
- lib/utils.ts

## app/library/page.tsx

Arquivos no fecho: 56

- app/library/page.tsx
- components/bottom-nav.tsx
- components/delete-content-dialog.tsx
- components/header.tsx
- components/library-page-client.tsx
- components/library.tsx
- components/library/LibraryEmptyState.tsx
- components/library/LibraryErrorBoundary.tsx
- components/library/LibraryHeader.tsx
- components/library/LibraryLoadingState.tsx
- components/library/LibraryPagination.tsx
- components/library/OptimizedLibraryList.tsx
- components/library/RefactoredLibrary.tsx
- components/navigation-container.tsx
- components/responsive-layout.tsx
- components/sidebar.tsx
- components/ui/avatar.tsx
- components/ui/badge.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/dialog.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/pagination.tsx
- components/ui/scroll-area.tsx
- components/ui/select.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-content-actions.ts
- hooks/use-debounce.ts
- hooks/use-library-data.ts
- hooks/use-navigation-actions.ts
- hooks/use-toast.ts
- lib/auth-manager.ts
- lib/content-service-server.ts
- lib/content-service.ts
- lib/content-types.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/library-utils.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-queue.ts
- lib/offline-setlist-cache.ts
- lib/setlist-service.ts
- lib/supabase-service.ts
- lib/supabase.ts
- lib/utils.ts
- types/content.ts
- types/library.ts
- types/supabase.ts

## app/login/page.tsx

Arquivos no fecho: 18

- app/login/page.tsx
- components/auth/login-panel.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/toast.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-setlist-cache.ts
- lib/utils.ts

## app/offline/page.tsx

Arquivos no fecho: 11

- app/offline/page.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/toast.tsx
- hooks/use-toast.ts
- lib/debug.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-setlist-cache.ts
- lib/utils.ts

## app/page.tsx

Arquivos no fecho: 3

- app/page.tsx
- components/ui/button.tsx
- lib/utils.ts

## app/performance/page.tsx

Arquivos no fecho: 39

- app/performance/page.tsx
- components/optimized-performance-mode.tsx
- components/performance-mode/header-controls.tsx
- components/performance-mode/loading-state.tsx
- components/performance-mode/memory-stats.tsx
- components/performance-mode/navigation-controls.tsx
- components/performance-mode/optimized-content-display.tsx
- components/performance-mode/performance-warning.tsx
- components/performance-page-client.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- hooks/use-content-loading.ts
- hooks/use-content-renderer.ts
- hooks/use-keyboard-shortcuts.ts
- hooks/use-performance-controls.ts
- hooks/use-performance-effects.ts
- hooks/use-performance-monitoring-ui.ts
- hooks/use-performance-navigation.ts
- hooks/use-songs-transformation.ts
- hooks/use-wake-lock.ts
- lib/advanced-content-cache.ts
- lib/auth-manager.ts
- lib/content-service-server.ts
- lib/content-service.ts
- lib/content-types.ts
- lib/debug.ts
- lib/firebase-server-utils.ts
- lib/firebase.ts
- lib/logger.ts
- lib/memory-management.ts
- lib/offline-queue.ts
- lib/performance-monitor.ts
- lib/setlist-service.ts
- lib/supabase-service.ts
- lib/supabase.ts
- lib/utils.ts
- types/content.ts
- types/performance.ts
- types/supabase.ts

## app/privacy-policy/page.tsx

Arquivos no fecho: 1

- app/privacy-policy/page.tsx

## app/profile/page.tsx

Arquivos no fecho: 28

- app/profile/page.tsx
- components/ProfileForm.tsx
- components/bottom-nav.tsx
- components/header.tsx
- components/navigation-container.tsx
- components/responsive-layout.tsx
- components/sidebar.tsx
- components/ui/avatar.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/skeleton.tsx
- components/ui/textarea.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-setlist-cache.ts
- lib/utils.ts

## app/setlists/page.tsx

Arquivos no fecho: 49

- app/setlists/page.tsx
- components/bottom-nav.tsx
- components/header.tsx
- components/navigation-container.tsx
- components/responsive-layout.tsx
- components/setlist-manager.tsx
- components/setlist/index.ts
- components/setlist/setlist-card.tsx
- components/setlist/setlist-details.tsx
- components/setlist/setlist-dialog.tsx
- components/setlist/setlist-list.tsx
- components/setlist/song-selection-dialog.tsx
- components/sidebar.tsx
- components/ui/avatar.tsx
- components/ui/badge.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/checkbox.tsx
- components/ui/dialog.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/scroll-area.tsx
- components/ui/textarea.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-setlist-data.ts
- hooks/use-toast.ts
- lib/auth-manager.ts
- lib/content-service.ts
- lib/content-types.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-queue.ts
- lib/offline-setlist-cache.ts
- lib/setlist-service.ts
- lib/supabase-service.ts
- lib/supabase.ts
- lib/utils.ts
- types/content.ts
- types/performance.ts
- types/supabase.ts

## app/settings/page.tsx

Arquivos no fecho: 34

- app/settings/page.tsx
- components/bottom-nav.tsx
- components/header.tsx
- components/navigation-container.tsx
- components/responsive-layout.tsx
- components/settings.tsx
- components/settings/AudioSettings.tsx
- components/settings/CloudSettings.tsx
- components/settings/DisplaySettings.tsx
- components/settings/RefactoredSettings.tsx
- components/sidebar.tsx
- components/ui/avatar.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/dropdown-menu.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/select.tsx
- components/ui/slider.tsx
- components/ui/switch.tsx
- components/ui/tabs.tsx
- components/ui/toast.tsx
- components/ui/tooltip.tsx
- components/user-header.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-setlist-cache.ts
- lib/utils.ts

## app/setup/page.tsx

Arquivos no fecho: 8

- app/setup/page.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- lib/logger.ts
- lib/setup-storage.ts
- lib/supabase-service.ts
- lib/utils.ts
- types/supabase.ts

## app/signup/confirm-email/page.tsx

Arquivos no fecho: 14

- app/signup/confirm-email/page.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/toast.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-setlist-cache.ts
- lib/utils.ts

## app/signup/page.tsx

Arquivos no fecho: 19

- app/signup/page.tsx
- components/auth/signup-panel.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/input.tsx
- components/ui/label.tsx
- components/ui/select.tsx
- components/ui/toast.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-server-utils.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-setlist-cache.ts
- lib/utils.ts

## app/verify-email/page.tsx

Arquivos no fecho: 14

- app/verify-email/page.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/toast.tsx
- contexts/firebase-auth-context.tsx
- hooks/use-toast.ts
- lib/debug.ts
- lib/firebase-errors.ts
- lib/firebase-session-cookies.ts
- lib/firebase.ts
- lib/logger.ts
- lib/offline-cache.ts
- lib/offline-setlist-cache.ts
- lib/utils.ts

