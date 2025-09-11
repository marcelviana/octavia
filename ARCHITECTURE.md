# Domain-Driven Architecture Implementation

## Overview

This document describes the comprehensive architectural improvements implemented for the Octavia music management application. The refactoring focused on implementing domain-driven design principles, centralized state management, and enforcing component size limits to create a more maintainable and scalable codebase.

## Key Improvements

### 1. Domain-Driven Directory Structure

The codebase has been reorganized into domain-specific directories:

```
domains/
├── shared/                    # Cross-domain utilities and services
│   ├── state-management/     # Centralized Zustand store
│   ├── services/            # Repository pattern base classes
│   ├── components/          # Error boundaries and shared UI
│   └── hooks/              # Shared business logic hooks
│
└── content-management/       # Content domain
    ├── components/          # Domain-specific UI components
    ├── hooks/              # Content management business logic
    ├── services/           # Content repository and service layer
    └── utils/              # Domain-specific utilities
```

### 2. Component Size Enforcement

Successfully refactored oversized components to meet the 150-line limit:

- **ContentViewer**: 864 lines → 92 lines (-89% reduction)
- **AddContent**: 709 lines → 148 lines (-79% reduction)

#### Refactoring Strategy:
- Extracted business logic into custom hooks
- Split monolithic components into focused sub-components
- Implemented composition patterns over inheritance
- Created reusable utility functions

### 3. Centralized State Management

Implemented Zustand-based centralized state management with:

```typescript
// domains/shared/state-management/app-store.ts
export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer(
      persist((set, get) => ({
        // Domain-specific state slices
        auth: { user: null, isAuthenticated: false },
        content: { content: [], selectedContent: null },
        setlists: { setlists: [], selectedSetlist: null },
        performance: { isActive: false, controls: {} },
        ui: { notifications: [], loading: {}, errors: {} }
      }))
    )
  )
)
```

#### Features:
- **Middleware Integration**: Immer for immutability, persist for hydration, subscribeWithSelector for optimized updates
- **Optimized Selectors**: Domain-specific selector hooks to prevent unnecessary re-renders
- **Automatic State Persistence**: Essential state persisted across sessions
- **Loading and Error Management**: Centralized handling of async operations

### 4. Service Layer Abstraction

Implemented repository pattern with clean separation of concerns:

```typescript
// Base repository pattern
export abstract class BaseRepository<T extends BaseEntity> {
  protected handleError(error: any, operation: string): RepositoryError
  abstract findById(id: string): Promise<RepositoryResponse<T | null>>
  abstract findMany(options?: QueryOptions): Promise<RepositoryResponse<T[]>>
  // ... other CRUD operations
}

// Content-specific implementation
export class ContentRepository extends SupabaseRepository<ContentRow> {
  async findByContentType(userId: string, contentType: string): Promise<RepositoryResponse<ContentRow[]>>
  async findFavorites(userId: string): Promise<RepositoryResponse<ContentRow[]>>
  async searchContent(userId: string, searchTerm: string): Promise<RepositoryResponse<ContentRow[]>>
  // ... domain-specific methods
}
```

#### Benefits:
- **Consistent Error Handling**: Standardized error responses across all data operations
- **Built-in Caching**: Automatic caching with configurable timeout strategies
- **Type Safety**: Full TypeScript support with generic constraints
- **Testability**: Easy to mock for unit testing
- **Extensibility**: Easy to add new data sources or modify existing ones

### 5. Unified Error Boundary System

Implemented comprehensive error handling at multiple levels:

```typescript
// Global error boundary for application-level errors
<ErrorBoundary 
  context="Global Application" 
  showDetails={isDevelopment}
  onError={handleGlobalError}
>

// Domain-specific error boundaries
<DomainErrorBoundary 
  domain="Content Management" 
  feature="Content Viewer"
>

// Hook-based error handling for operations
const { handleError, handleAsyncError } = useErrorHandler()
```

#### Features:
- **Graceful Degradation**: Users see helpful error messages instead of crashes
- **Error Logging**: Comprehensive error tracking with context and IDs
- **Development Support**: Detailed error information in development mode
- **Recovery Actions**: Users can retry operations or navigate to safe areas
- **Centralized State Integration**: Errors flow through centralized state management

### 6. Hook-Based Business Logic Extraction

Moved complex business logic from components to custom hooks:

```typescript
// Content viewer business logic
export function useContentViewer({ content, onBack }: UseContentViewerProps) {
  // State management integration
  const { selectedContent } = useContent()
  const { setSelectedContent, updateContent } = useContentActions()
  const { addNotification, setOperationLoading } = useUIActions()
  
  // Complex operations like delete, favorite toggle, etc.
  const confirmDelete = useCallback(async () => {
    try {
      setOperationLoading('delete-content', true)
      await deleteContent(content.id)
      await clearContentCache()
      
      // Update centralized state
      if (selectedContent?.id === content.id) {
        setSelectedContent(null)
      }
      
      addNotification({ type: 'success', message: 'Content deleted successfully' })
      onBack()
    } catch (error) {
      // Error handling...
    } finally {
      setOperationLoading('delete-content', false)
    }
  }, [/* dependencies */])
  
  return {
    // Clean API for components
    zoom, isPlaying, currentPage, totalPages,
    handleZoomIn, handleZoomOut, confirmDelete, toggleFavorite
  }
}
```

## Architecture Benefits

### 1. Maintainability
- **Single Responsibility**: Each component/hook has a focused purpose
- **Clear Boundaries**: Domain separation makes it easy to locate and modify code
- **Consistent Patterns**: Repository pattern and error handling provide predictable interfaces

### 2. Testability
- **Isolated Logic**: Business logic in hooks can be tested independently
- **Mockable Services**: Repository pattern makes it easy to mock data operations
- **Predictable State**: Centralized state management simplifies testing scenarios

### 3. Performance
- **Optimized Selectors**: Prevent unnecessary re-renders with focused state subscriptions
- **Built-in Caching**: Repository layer provides automatic caching for frequently accessed data
- **Lazy Loading**: Component splitting enables better code splitting and loading performance

### 4. Developer Experience
- **TypeScript Integration**: Full type safety across all layers
- **Error Visibility**: Comprehensive error reporting and handling
- **Hot Reloading**: Better development experience with isolated components
- **Documentation**: Clear separation makes the codebase self-documenting

### 5. Scalability
- **Domain Boundaries**: Easy to add new domains without affecting existing code
- **Extension Points**: Repository pattern and service layer provide clear extension points
- **State Management**: Centralized state can easily accommodate new features and data flows

## Migration Guide

To use the new architecture in existing components:

1. **Wrap with Error Boundaries**:
   ```typescript
   <DomainErrorBoundary domain="Your Domain" feature="Feature Name">
     <YourComponent />
   </DomainErrorBoundary>
   ```

2. **Use Centralized State**:
   ```typescript
   import { useContent, useContentActions } from '@/domains/shared/state-management/app-store'
   
   const { content, selectedContent } = useContent()
   const { setContent, updateContent } = useContentActions()
   ```

3. **Implement Service Layer**:
   ```typescript
   import { contentService } from '@/domains/content-management'
   
   const content = await contentService.getContent(id)
   const userContent = await contentService.getUserContent(userId)
   ```

4. **Extract Business Logic**:
   ```typescript
   // Create custom hooks for complex operations
   export function useYourFeature() {
     const { handleError } = useErrorHandler()
     // ... business logic
     return { /* clean API */ }
   }
   ```

## Next Steps

1. **Performance Monitoring**: Implement performance tracking for the new architecture
2. **Testing Suite**: Expand test coverage for new hooks and services
3. **Documentation**: Continue expanding domain-specific documentation
4. **Metrics**: Add monitoring for error rates, performance, and user experience

This architecture provides a solid foundation for the continued growth and maintenance of the Octavia application, with clear patterns that can be applied to future features and domains.