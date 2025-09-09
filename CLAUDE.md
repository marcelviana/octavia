# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development
pnpm dev                    # Start dev server with Next.js
pnpm build                  # Build for production + service worker
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Testing
pnpm test                   # Run unit tests only
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with coverage report
pnpm test:integration       # Run integration tests
pnpm test:e2e               # Run Playwright E2E tests
pnpm test:e2e:ui            # Run E2E tests with UI mode
pnpm test:all               # Run both unit and integration tests

# E2E Test Utils
pnpm test:e2e:headed        # Run E2E tests with browser UI
pnpm test:e2e:debug         # Debug E2E tests
pnpm test:e2e:codegen       # Generate new E2E test code
```

## Project Architecture

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Authentication**: Firebase Auth with server-side verification
- **Database**: Supabase with service role for server operations
- **Storage**: Firebase Storage for file uploads
- **UI**: Tailwind CSS + Radix UI components (shadcn/ui)
- **State Management**: React hooks + Context API
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Offline Support**: Service Worker + IndexedDB caching

### Directory Structure

**`/app`** - Next.js App Router pages and API routes
- Pages follow Next.js 13+ conventions
- API routes in `/api` with proper authentication patterns
- Route handlers follow security-first patterns

**`/components`** - React components organized by feature
- Business logic components in root
- UI primitives in `/ui` subdirectory
- Authentication components in `/auth`
- Library management in `/library`

**`/lib`** - Core utilities and services
- `firebase-server-utils.ts` - Server-side auth verification
- `content-service.ts` - Content management operations
- `supabase-service.ts` - Database service layer
- `offline-cache.ts` - IndexedDB caching for offline support
- Validation with Zod schemas

**`/contexts`** - React context providers for global state
**`/hooks`** - Custom React hooks for business logic
**`/types`** - TypeScript definitions

## SECURITY REQUIREMENTS (MANDATORY)

### Authentication Architecture

**CRITICAL**: Every API route MUST follow this security pattern:

```typescript
import { requireAuthServer } from '@/lib/firebase-server-utils';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  // 1. Authentication check (MANDATORY)
  const user = await requireAuthServer(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 2. Input validation with Zod (REQUIRED)
  const schema = z.object({ 
    // Define strict validation schema
  });
  
  try {
    const validatedData = schema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  
  // 3. Database operations with service role (REQUIRED)
  const supabase = getSupabaseServiceClient();
  // ... rest of authenticated logic
}
```

### Security Layers

1. **Firebase Authentication**: Client-side session management
2. **Server-side Verification**: `requireAuthServer()` validates tokens via Firebase Admin
3. **Service Role Database**: All server operations use Supabase service role client
4. **Input Validation**: All user inputs validated with Zod schemas
5. **Error Sanitization**: Generic error messages to clients, detailed logging server-side
6. **File Security**: Upload validation via `file-security.ts`

### Security Rules (NON-NEGOTIABLE)

- **NO direct Supabase client usage on server** - only service role
- **NO raw user input** - all inputs must be validated with Zod
- **NO detailed error exposure** - use generic messages to clients
- **NO sensitive data in logs** - sanitize before logging
- **ALL API routes must authenticate** - no exceptions

### Content Management System

The app manages musical content (sheet music, lyrics, tabs, chord charts):

1. **Upload Flow**: Files uploaded to Firebase Storage → metadata stored in Supabase
2. **Content Types**: Lyrics, chords, tabs, piano, drums (defined in `/types/content.ts`)
3. **Performance Mode**: Full-screen interface for live performances
4. **Setlist Management**: Organize songs for performances
5. **Offline Support**: Content cached locally via service worker + IndexedDB

### Key Service Patterns

**Database Operations** (server-side only):
```typescript
import { getSupabaseServiceClient } from '@/lib/supabase-service';

const supabase = getSupabaseServiceClient(); // Service role client
```

**Content Management**:
- Use `content-service.ts` for CRUD operations
- All operations require authentication
- Files validated for security via `file-security.ts`

**Error Handling**:
- Generic error messages to clients
- Detailed logging server-side via `logger.ts`
- Security events logged via `security-logger.ts`

## CODE QUALITY STANDARDS

### Component Architecture Rules

**MANDATORY Size Limits**:
- Components MUST be **<150 lines** including imports and exports
- If over 150 lines, extract business logic into custom hooks
- Split large components into smaller, focused components
- Use composition patterns over inheritance

**Required Patterns**:
```typescript
// ✅ GOOD: Business logic extracted to custom hook
const useContentManagement = () => {
  const { user } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  
  const createContent = async (data: ContentInput) => {
    setLoading(true);
    try {
      // API call with proper error handling
    } finally {
      setLoading(false);
    }
  };
  
  return { createContent, loading };
};

const ContentComponent = () => {
  const { createContent, loading } = useContentManagement();
  // Focused rendering logic only
};
```

**TypeScript Requirements**:
- All props MUST have TypeScript interfaces
- No `any` types allowed - use proper typing
- Export interfaces for reusability
- Use strict mode TypeScript settings

**Error Handling Standards**:
- All components MUST have error boundaries
- Use proper loading states
- Implement graceful degradation
- Toast notifications for user feedback

### File Organization

```
components/
  ├── feature-component.tsx     # <150 lines, focused responsibility
  ├── ui/                       # Reusable UI primitives only
  └── feature-group/           # Related components grouped
      ├── FeatureMain.tsx
      ├── FeatureHeader.tsx
      └── index.ts             # Barrel exports
```

### Testing Strategy & Coverage Targets

**MANDATORY Coverage: 85%** (currently at ~35% - needs improvement)

**Test Types & Requirements**:
- **Unit Tests**: `**/*.test.{ts,tsx}` - All utilities, hooks, and isolated components
- **Integration Tests**: `**/*.integration.test.{ts,tsx}` - Cross-component workflows  
- **E2E Tests**: `/tests/e2e/*.spec.ts` - Complete user journeys
- **API Tests**: All routes must have integration tests

**Coverage Breakdown Targets**:
- Utilities (`/lib`): **95% coverage** - critical infrastructure
- Components: **80% coverage** - UI logic and error states
- API Routes: **90% coverage** - authentication and business logic
- Hooks: **85% coverage** - business logic extraction

**Testing Requirements**:
```typescript
// All hooks must be tested
describe('useContentManagement', () => {
  it('should handle authentication', async () => {
    // Mock Firebase auth
    // Test authenticated and unauthenticated states
  });
  
  it('should handle loading states', async () => {
    // Test loading true/false transitions
  });
  
  it('should handle errors gracefully', async () => {
    // Test error conditions and user feedback
  });
});
```

**Mock Patterns**:
- Mock all external services (Firebase, Supabase)
- Use MSW for API route testing
- Mock file uploads and storage operations
- Test offline scenarios

## PERFORMANCE OPTIMIZATION PRIORITIES

### Critical Performance Requirements

**Music Performance Context**: This app is used during live music performances where lag or failures are unacceptable.

**Priority 1: Performance Mode Optimization**
- **<100ms response time** for song navigation during performances
- **Instant rendering** of cached content (IndexedDB priority)
- **Zero network dependency** during performances
- **Smooth transitions** between songs in setlists

**Priority 2: Content Loading & Caching**
```typescript
// REQUIRED: All content operations must implement caching
const useOptimizedContent = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 1. Load from cache immediately (IndexedDB)
    // 2. Fetch updates in background if online
    // 3. Update cache with fresh data
  }, []);
};
```

**Priority 3: Component Performance**
- Use `React.memo` for expensive rendering components
- Implement virtualization for long lists (library, setlists)
- Lazy load routes with `next/dynamic`
- Optimize images with Next.js Image component
- Bundle splitting for performance mode vs. management features

**Required Optimization Patterns**:
```typescript
// ✅ Memoized component for performance
const MemoizedSongItem = React.memo(({ song, onSelect }) => {
  return <SongDisplay song={song} onSelect={onSelect} />;
});

// ✅ Virtualized list for large libraries  
const LibraryList = () => {
  return (
    <VirtualizedList
      items={songs}
      renderItem={MemoizedSongItem}
      height={600}
    />
  );
};
```

### Offline Architecture

**Service Worker Strategy**:
- Cache all performance mode assets
- Background sync for content updates
- Fallback to cached versions during network issues
- Update notifications when fresh content available

**IndexedDB Caching**:
- **50MB LRU cache** for content files
- **Priority caching**: Recently accessed and favorited content
- **Automatic cleanup**: Remove old unused content
- **Batch operations**: Minimize IndexedDB transactions

**Network Optimization**:
- Preload next song in setlist during performance
- Compress images and PDFs for faster loading
- Use service worker for request interception and caching
- Implement progressive loading for large files

### PWA & Mobile Performance

- **App-like experience**: Fast startup, smooth animations
- **Touch optimization**: Performance mode touch controls
- **Battery efficiency**: Minimize background processing
- **Storage management**: Automatic cache cleanup
- **Offline-first**: Core functionality works without network

## ARCHITECTURAL PATTERNS (from .cursorrules)

### Content Management Pattern (REQUIRED)

```typescript
// ALL content operations must follow this pattern
const useContentManagement = () => {
  const { user } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createContent = async (data: ContentInput) => {
    if (!user) throw new Error('Authentication required');
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Validate input with Zod
      const validatedData = contentSchema.parse(data);
      
      // 2. Call authenticated API
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      });
      
      if (!response.ok) throw new Error('Failed to create content');
      
      // 3. Handle success
      toast.success('Content created successfully');
      return await response.json();
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { createContent, loading, error };
};
```

### Database Service Pattern (MANDATORY)

```typescript
// ALL server-side database operations MUST use this pattern
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export async function getUserContent(userId: string): Promise<Content[]> {
  // REQUIRED: Use service client only
  const supabase = getSupabaseServiceClient();
  
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      // Log detailed error server-side
      logger.error('Database query failed', { error, userId });
      // Throw generic error
      throw new Error('Failed to fetch content');
    }
    
    return data || [];
  } catch (error) {
    // Always log and re-throw with generic message
    logger.error('getUserContent failed', { error, userId });
    throw new Error('Database operation failed');
  }
}
```

### Development Workflows (MANDATORY)

**When Creating New Components**:
1. Generate TypeScript interface first
2. Create component with proper error handling (<150 lines)
3. Extract business logic to custom hook
4. Write comprehensive tests (85% coverage)
5. Add accessibility attributes
6. Implement loading and error states

**When Creating API Routes**:
1. Implement `requireAuthServer()` authentication check
2. Add Zod input validation schema
3. Use `getSupabaseServiceClient()` for database ops
4. Implement proper error handling with generic messages
5. Write integration tests
6. Add rate limiting if needed

**When Refactoring**:
1. Maintain backward compatibility
2. Update all related tests
3. Check TypeScript errors
4. Verify security implications
5. Update documentation
6. Test offline functionality

### Code Review Checklist (NON-NEGOTIABLE)

Before accepting any code changes:
- [ ] **Authentication**: Properly implemented with `requireAuthServer()`
- [ ] **Input Validation**: Uses Zod schemas for all user inputs
- [ ] **Error Handling**: Secure and generic error messages
- [ ] **TypeScript**: Comprehensive types, no `any` usage
- [ ] **Testing**: Covers main functionality with proper mocks
- [ ] **Performance**: Optimizations applied (memoization, lazy loading)
- [ ] **Accessibility**: Screen reader support and keyboard navigation
- [ ] **Security**: No sensitive data exposure, proper sanitization
- [ ] **Component Size**: <150 lines with extracted business logic
- [ ] **Offline Support**: Considers caching and offline scenarios

### Development Guidelines

1. **Security First**: Always authenticate API routes with `requireAuthServer()`
2. **Input Validation**: All user inputs validated with Zod schemas
3. **Error Handling**: Generic messages to clients, detailed server-side logging  
4. **Testing**: 85% coverage target with comprehensive test scenarios
5. **Performance**: Optimize for live music performance context
6. **Offline Support**: Consider caching implications for all data flows
7. **TypeScript**: Strict typing, no `any` exceptions
8. **Component Architecture**: Extract hooks, keep components focused

### Important Files to Understand

- `middleware.ts` - Request preprocessing and auth checks
- `lib/firebase-server-utils.ts` - Server-side authentication
- `lib/content-service.ts` - Core content management
- `lib/offline-cache.ts` - Offline functionality
- `components/performance-mode.tsx` - Live performance interface
- `app/api/` - RESTful API routes with authentication

### Common Development Tasks

When adding new features:
1. Start with TypeScript types in `/types`
2. Add API route with authentication in `/app/api`
3. Create service layer in `/lib` if needed
4. Build UI components with proper error boundaries
5. Add comprehensive tests
6. Consider offline implications