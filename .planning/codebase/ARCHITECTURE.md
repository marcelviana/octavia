# Architecture

**Analysis Date:** 2026-02-23

## Pattern Overview

**Overall:** Hybrid Full-Stack with Server-Side Authentication, Service-Based Layers, and Offline-First Data Management

**Key Characteristics:**
- Next.js 15 App Router with Server Components for protected pages
- Firebase Authentication (client-side) + Server-side JWT verification via API route
- Supabase Database with service role client (server-only operations)
- Multi-layer data flow: Client → API Routes → Service Layer → Database
- Offline-first architecture using IndexedDB caching and service workers
- Performance-optimized with content preloading and memoization patterns

## Layers

**Authentication & Authorization Layer:**
- Purpose: Verify user identity and manage session tokens
- Location: `middleware.ts`, `lib/firebase-server-utils.ts`, `lib/firebase-session-cookies.ts`, `contexts/firebase-auth-context.tsx`
- Contains: Token validation, session cookie management, Firebase Auth client setup
- Depends on: Firebase Admin SDK (server), Firebase JS SDK (client), Supabase Admin client
- Used by: All protected API routes, protected pages via middleware

**API Layer (Route Handlers):**
- Purpose: RESTful endpoints for content, setlists, auth, and user data
- Location: `app/api/`
- Contains: NextRequest handlers with authentication checks, input validation, database operations
- Depends on: `firebase-server-utils`, `content-service`, `setlist-service`, `supabase-service`
- Used by: Client components via fetch calls

**Service Layer:**
- Purpose: Business logic abstraction for content and setlist management
- Location: `lib/content-service.ts`, `lib/setlist-service.ts`, `lib/storage-service.ts`
- Contains: Database queries with filtering/pagination, file management, validation
- Depends on: `supabase-service` (service role client), validation schemas
- Used by: API routes, custom hooks, server components

**Data Access Layer:**
- Purpose: Supabase database operations with proper authentication
- Location: `lib/supabase-service.ts`
- Contains: Singleton service role client initialization and connection testing
- Depends on: Supabase JS SDK
- Used by: Service layer for all database operations

**Client State Management Layer:**
- Purpose: React hooks and context for authentication and data caching
- Location: `contexts/firebase-auth-context.tsx`, `hooks/use-library-data.ts`, `hooks/use-setlist-data.ts`, `hooks/use-content-actions.ts`
- Contains: Authentication state, user profile management, cached content queries
- Depends on: Firebase Auth SDK, API routes for authenticated operations
- Used by: React components throughout the application

**Caching & Offline Layer:**
- Purpose: IndexedDB-based offline content storage and service worker integration
- Location: `lib/offline-cache.ts`, `lib/offline-setlist-cache.ts`, `lib/offline-queue.ts`, `worker/sw.ts`
- Contains: LRU cache management, IndexedDB operations, background sync queuing
- Depends on: localforage (IndexedDB wrapper), Service Worker API
- Used by: Components during offline scenarios, performance mode for instant content access

**UI Layer (Components):**
- Purpose: React components for rendering pages and features
- Location: `components/`, individual page components
- Contains: Client components with business logic extracted to hooks, UI primitives in `components/ui/`
- Depends on: Custom hooks, contexts, service layer via hooks
- Used by: App Router pages

**Performance & Validation Layer:**
- Purpose: Input validation, security headers, rate limiting, and performance monitoring
- Location: `lib/validation-schemas.ts`, `lib/security-headers.ts`, `lib/rate-limiter.ts`, `lib/performance-monitor.ts`
- Contains: Zod validation schemas, CSP header generation, rate limit enforcement, metrics tracking
- Depends on: Zod for validation, custom rate limit store
- Used by: API routes for input validation, middleware for headers, routes for rate limiting

## Data Flow

**Authentication & Session Flow:**

1. User logs in via Firebase Auth (client-side)
2. Firebase provides ID token to client
3. Client stores token in session cookie via `setSessionCookie()`
4. Middleware intercepts requests, validates token via `/api/auth/verify`
5. Validation result cached in `tokenCache` (1 hour TTL)
6. Protected routes only render if validation succeeds
7. User signs out → `clearSessionCookie()` → cache cleared

**Content CRUD Flow:**

1. Client component calls hook (e.g., `useContentActions()`)
2. Hook calls API route `/api/content` with Bearer token
3. API route calls `requireAuthServer()` to verify token
4. Validated user ID used with `getSupabaseServiceClient()`
5. Service layer (`content-service.ts`) executes database query
6. Results returned to component, stored in local state or hook cache
7. Offline scenario: IndexedDB cache from `offline-cache.ts` used instead

**Content Display with Caching:**

1. Page/component mounts, needs content data
2. Hook checks IndexedDB cache via `offline-cache.ts` → instant display if available
3. Hook fetches fresh data from API in background (if online)
4. New data cached in IndexedDB (LRU, max 50MB)
5. Component re-renders with fresh data when available
6. During performance mode: Pre-cached content accessed instantly from IndexedDB

**File Upload Flow:**

1. User selects file in `file-upload.tsx`
2. `useFileUpload()` hook validates file security via `file-security.ts`
3. File uploaded to Firebase Storage via `/api/storage/upload`
4. API route validates auth, file type, size, and virus scan
5. Metadata stored in Supabase `content` table
6. File URL and content data cached offline

**State Management:**

- **Authentication State:** Centralized in `FirebaseAuthProvider` context, includes user, profile, ID token
- **Content State:** Combination of API responses in component state + IndexedDB cache via `offline-cache.ts`
- **Setlist State:** Similar pattern with `offline-setlist-cache.ts` for performance mode
- **UI State:** Local component state with extracted logic to custom hooks

## Key Abstractions

**Authenticated Request Handler:**
- Purpose: Ensure all API routes verify user identity before executing logic
- Examples: `app/api/content/route.ts`, `app/api/setlists/route.ts`
- Pattern: Call `requireAuthServer()` → validate input with Zod → execute service operation → return response

**Service-Based Database Access:**
- Purpose: Isolate database logic from route handlers, promote reusability
- Examples: `lib/content-service.ts::getUserContentPageServer()`, `lib/setlist-service.ts::getSetlistWithSongs()`
- Pattern: Accept user ID + parameters → construct query → apply filters/pagination → return typed results

**Hook-Based Business Logic Extraction:**
- Purpose: Keep components under 150 lines by extracting state management and API calls
- Examples: `hooks/use-library-data.ts`, `hooks/use-content-actions.ts`
- Pattern: Custom hook manages loading/error/data states → component calls hook → renders results

**Offline-First Caching:**
- Purpose: Provide instant content access in performance mode or when offline
- Examples: `lib/offline-cache.ts` functions: `cacheContent()`, `getCachedContent()`, `clearOfflineContent()`
- Pattern: On successful API response, cache in IndexedDB → On next request, try cache first → Fall back to API

**Zod Schema Validation:**
- Purpose: Single source of truth for input validation across API routes and client
- Examples: `lib/validation-schemas.ts` - `contentQuerySchema`, `createContentSchema`
- Pattern: Define schema → parse in API route → return 400 if invalid → use in client-side forms

## Entry Points

**Server-Side Entry Points (App Router Pages):**
- `/app/dashboard/page.tsx`: Main user dashboard, server-side data fetch via `getUserContentServer()` and `getUserStatsServer()`
- `/app/library/page.tsx`: Content library with search/filtering, server-side pagination via `getUserContentPageServer()`
- `/app/content/[id]/page.tsx`: Individual content view, server-side fetch via `getContentServer()`
- `/app/setlists/page.tsx`: Setlist management (if exists), server-side list fetch

**API Entry Points:**
- `POST /api/auth/verify`: Firebase token verification (used by middleware)
- `GET /api/auth/user`: Get current authenticated user profile
- `GET /api/content`: List user's content with filters/pagination
- `POST /api/content`: Create new content item
- `GET/PUT/DELETE /api/content/[id]`: Content CRUD operations
- `GET /api/setlists`: List user's setlists
- `POST /api/setlists`: Create setlist
- `GET/PUT/DELETE /api/setlists/[id]`: Setlist CRUD operations
- `POST /api/storage/upload`: Upload files to Firebase Storage
- `POST /api/storage/delete`: Delete files from Firebase Storage

**Client-Side Entry Point:**
- `app/layout.tsx`: Root layout wrapping all pages with providers (FirebaseAuthProvider, SessionProvider, ErrorBoundary)

**Service Worker Entry Point:**
- `worker/sw.ts`: Service worker for offline support and caching strategy

## Error Handling

**Strategy:** Fail-secure with fallback to cached data when possible, generic error messages to clients, detailed logging server-side

**Patterns:**

- **Route Handler Errors:** Try-catch blocks return 400/401/500 with sanitized error messages
- **Service Layer Errors:** Log detailed error server-side, throw generic error to caller
- **Client Errors:** Hooks catch API errors, show toast notifications, fall back to cached data
- **Offline Errors:** When offline, use cached content; queue mutations for sync when online
- **Token Validation Errors:** Middleware redirects to `/login` if token invalid

**Example Error Flow:**
```typescript
// API route with error handling
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthServer(request) // Returns null if invalid
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = schema.parse(body) // Throws if invalid

    const result = await serviceFunction(user.uid, validated)
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Route error:', error) // Log full error server-side
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
```

## Cross-Cutting Concerns

**Logging:** Simple logger at `lib/logger.ts` that writes to console; server-side operations logged with `logger.error()`, `logger.warn()`

**Validation:** All user inputs validated with Zod schemas at `lib/validation-schemas.ts` before processing; form inputs also validated client-side

**Authentication:** All API routes use `requireAuthServer()` mandatory check; middleware redirects unauthenticated users to `/login`

**Rate Limiting:** Configured per-route via `withRateLimit()` wrapper; RATE_LIMIT_CONFIGS at `lib/rate-limiter.ts` define limits

**Security Headers:** Applied via middleware from `lib/security-headers.ts` including CSP, HSTS, X-Frame-Options with dynamic nonce injection

**CORS & CSRF:** Handled by Next.js defaults; service worker requests use `fetch` with credentials

---

*Architecture analysis: 2026-02-23*
