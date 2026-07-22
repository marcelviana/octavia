# Pares gêmeos — quem importa quem, e quem está montado em rota

Evidência crua do grafo (dependency-cruiser, aliases resolvidos). "Importadores" inclui grafo de produção e de testes (testes marcados). "Rotas" = páginas/route handlers em cujo fecho transitivo o arquivo aparece.

## performance-mode

### components/performance-mode.tsx

- Importadores (2): 
  - __tests__/performance-mode/chords-display-bug.test.tsx _(teste)_
  - lib/performance-optimization.ts
- Em fecho de rota: **NENHUMA rota**

### components/optimized-performance-mode.tsx

- Importadores (1): 
  - components/performance-page-client.tsx
- Em fecho de rota: `app/performance/page.tsx`

**Veredito:** montado(s) em rota: components/optimized-performance-mode.tsx

---

## content-display (performance-mode/)

### components/performance-mode/content-display.tsx

- Importadores (2): 
  - components/__tests__/content-display.test.tsx _(teste)_
  - components/performance-mode.tsx
- Em fecho de rota: **NENHUMA rota**

### components/performance-mode/optimized-content-display.tsx

- Importadores (2): 
  - components/optimized-performance-mode.tsx
  - lib/performance-optimization.ts
- Em fecho de rota: `app/performance/page.tsx`

**Veredito:** montado(s) em rota: components/performance-mode/optimized-content-display.tsx

---

## performance-controls (variante optimized)

### components/performance-mode/optimized-performance-controls.tsx

- Importadores (0): **nenhum**
- Em fecho de rota: **NENHUMA rota**

**Veredito:** nenhum dos arquivos está em rota

---

## add-content

### components/add-content.tsx

- Importadores (1): 
  - app/add-content/page.tsx
- Em fecho de rota: `app/add-content/page.tsx`

### components/add-content-refactored.tsx

- Importadores (2): 
  - tests/components/add-content.refactoring.test.tsx _(teste)_
  - tests/performance/component-refactoring.bench.test.tsx _(teste)_
- Em fecho de rota: **NENHUMA rota**

### components/add-content/RefactoredAddContent.tsx

- Importadores (1): 
  - components/add-content.tsx
- Em fecho de rota: `app/add-content/page.tsx`

**Veredito:** montado(s) em rota: components/add-content.tsx, components/add-content/RefactoredAddContent.tsx

---

## library

### components/library.tsx

- Importadores (1): 
  - components/library-page-client.tsx
- Em fecho de rota: `app/library/page.tsx`

### components/library/RefactoredLibrary.tsx

- Importadores (2): 
  - components/library.tsx
  - components/library/index.ts
- Em fecho de rota: `app/library/page.tsx`

**Veredito:** TODOS em rota

---

## library-list (variante optimized)

### components/library-list.tsx

- Importadores (0): **nenhum**
- Em fecho de rota: **NENHUMA rota**

### components/library/OptimizedLibraryList.tsx

- Importadores (2): 
  - components/library/RefactoredLibrary.tsx
  - components/library/index.ts
- Em fecho de rota: `app/library/page.tsx`

**Veredito:** montado(s) em rota: components/library/OptimizedLibraryList.tsx

---

## settings

### components/settings.tsx

- Importadores (1): 
  - app/settings/page.tsx
- Em fecho de rota: `app/settings/page.tsx`

### components/settings/RefactoredSettings.tsx

- Importadores (1): 
  - components/settings.tsx
- Em fecho de rota: `app/settings/page.tsx`

**Veredito:** TODOS em rota

---

## setlist-list

### components/setlist/setlist-list.tsx

- Importadores (1): 
  - components/setlist/index.ts
- Em fecho de rota: `app/setlists/page.tsx`

### components/setlist/setlist-list-refactored.tsx

- Importadores (0): **nenhum**
- Em fecho de rota: **NENHUMA rota**

**Veredito:** montado(s) em rota: components/setlist/setlist-list.tsx

---

## metadata-form

### components/metadata-form.tsx

- Importadores (2): 
  - components/add-content-refactored.tsx
  - components/add-content/DetailsStep.tsx
- Em fecho de rota: `app/add-content/page.tsx`

### components/metadata-form/RefactoredMetadataForm.tsx

- Importadores (1): 
  - components/metadata-form.tsx
- Em fecho de rota: `app/add-content/page.tsx`

**Veredito:** TODOS em rota

---

## content-service

### lib/content-service.ts

- Importadores (18): 
  - app/content/[id]/edit/page.tsx
  - components/batch-import.tsx
  - components/batch-preview.tsx
  - components/content-edit-page-client.tsx
  - components/content-page-client.tsx
  - domains/content-management/hooks/use-content-creation.ts
  - domains/content-management/hooks/use-content-viewer.ts
  - hooks/__tests__/use-library-data.test.tsx _(teste)_
  - hooks/__tests__/use-setlist-data.test.tsx _(teste)_
  - hooks/use-content-actions.ts
  - hooks/use-library-data.ts
  - hooks/use-setlist-data.ts
  - hooks/useAddContentLogic.ts
  - hooks/useContentActions.ts
  - hooks/useMetadataForm.ts
  - lib/__tests__/content-service.test.ts _(teste)_
  - lib/content-service-server.ts
  - lib/setlist-service.ts
- Em fecho de rota: `app/add-content/page.tsx`, `app/content/[id]/edit/page.tsx`, `app/content/[id]/page.tsx`, `app/dashboard/page.tsx`, `app/library/page.tsx`, `app/performance/page.tsx`, `app/setlists/page.tsx`

### lib/content-service-refactored.ts

- Importadores (1): 
  - lib/setlist-service-refactored.ts
- Em fecho de rota: **NENHUMA rota**

### lib/content-service-server.ts

- Importadores (6): 
  - app/content/[id]/page.tsx
  - app/dashboard/page.tsx
  - app/library/page.tsx
  - app/performance/page.tsx
  - lib/__tests__/content-service.test.ts _(teste)_
  - lib/__tests__/setlist-service.test.ts _(teste)_
- Em fecho de rota: `app/content/[id]/page.tsx`, `app/dashboard/page.tsx`, `app/library/page.tsx`, `app/performance/page.tsx`

### domains/content-management/services/content-service.ts

- Importadores (1): 
  - domains/content-management/index.ts
- Em fecho de rota: **NENHUMA rota**

**Veredito:** montado(s) em rota: lib/content-service.ts, lib/content-service-server.ts

---

## setlist-service

### lib/setlist-service.ts

- Importadores (5): 
  - components/setlist-manager.tsx
  - hooks/__tests__/use-setlist-data.test.tsx _(teste)_
  - hooks/use-setlist-data.ts
  - lib/__tests__/setlist-service.test.ts _(teste)_
  - lib/content-service-server.ts
- Em fecho de rota: `app/content/[id]/page.tsx`, `app/dashboard/page.tsx`, `app/library/page.tsx`, `app/performance/page.tsx`, `app/setlists/page.tsx`

### lib/setlist-service-refactored.ts

- Importadores (0): **nenhum**
- Em fecho de rota: **NENHUMA rota**

**Veredito:** montado(s) em rota: lib/setlist-service.ts

---

