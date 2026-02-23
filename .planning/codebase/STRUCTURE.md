# Codebase Structure

**Analysis Date:** 2026-02-23

## Directory Layout

```
octavia/
├── app/                        # Next.js App Router pages and API routes
│   ├── api/                    # RESTful API endpoints
│   │   ├── auth/               # Authentication routes (verify, session, validate-token)
│   │   ├── content/            # Content CRUD endpoints
│   │   ├── setlists/           # Setlist CRUD endpoints
│   │   ├── storage/            # File upload/delete endpoints
│   │   └── profile/            # User profile endpoint
│   ├── dashboard/              # Main dashboard page
│   ├── library/                # Content library with search/filter
│   ├── content/                # Individual content view and editing
│   ├── setlists/               # Setlist management
│   ├── add-content/            # Content creation page
│   ├── auth/                   # Authentication pages (login, signup)
│   └── layout.tsx              # Root layout with providers
│
├── components/                 # React components organized by feature
│   ├── ui/                     # Reusable UI primitives (Button, Dialog, etc.)
│   ├── auth/                   # Auth-related components (LoginForm, SignupForm)
│   ├── library/                # Library view components
│   ├── content-viewer/         # Content display components (PDF, Lyrics, Chords)
│   ├── performance-mode/       # Performance/live mode components
│   ├── add-content/            # Content creation components
│   ├── file-upload.tsx         # File upload handler
│   ├── dashboard.tsx           # Dashboard main component
│   └── [feature-name].tsx      # Feature-specific components
│
├── lib/                        # Core utilities and services (58 files)
│   ├── firebase-server-utils.ts         # Server-side auth token validation
│   ├── firebase-session-cookies.ts      # Session cookie management
│   ├── content-service.ts               # Content CRUD business logic
│   ├── content-service-server.ts        # Server-side content operations
│   ├── setlist-service.ts               # Setlist CRUD business logic
│   ├── supabase-service.ts              # Supabase service role client
│   ├── storage-service.ts               # Firebase Storage operations
│   ├── offline-cache.ts                 # IndexedDB caching (50MB LRU)
│   ├── offline-setlist-cache.ts         # Offline setlist caching
│   ├── offline-queue.ts                 # Offline mutation queue
│   ├── validation-schemas.ts            # Zod schemas for all inputs
│   ├── validation-utils.ts              # Validation error response helpers
│   ├── security-headers.ts              # CSP and security headers
│   ├── rate-limiter.ts                  # Rate limiting logic
│   ├── performance-monitor.ts           # Performance metrics collection
│   ├── firebase.ts                      # Firebase client config
│   ├── firebase-admin.ts                # Firebase Admin SDK init
│   ├── firebase-errors.ts               # Firebase error mapping
│   ├── error-handler.ts                 # Error handling utilities
│   ├── error-boundary.tsx               # React error boundary
│   ├── logger.ts                        # Simple console logger
│   ├── file-security.ts                 # File upload validation
│   └── [other utilities]                # Debug, CSP nonce, utils, etc.
│
├── hooks/                      # Custom React hooks (26 hooks)
│   ├── use-library-data.ts              # Library content fetching & caching
│   ├── use-setlist-data.ts              # Setlist fetching & caching
│   ├── use-content-actions.ts           # Content CRUD operations
│   ├── use-file-upload.ts               # File upload state management
│   ├── use-service-worker.tsx           # Service worker registration
│   ├── use-content-caching.ts           # Content caching logic
│   ├── use-performance-controls.ts      # Performance mode controls
│   └── [feature-specific hooks]         # Keyboard shortcuts, async, etc.
│
├── contexts/                   # React context providers
│   ├── firebase-auth-context.tsx        # Authentication state (user, profile, token)
│   └── sidebar-context.tsx              # Sidebar UI state
│
├── types/                      # TypeScript definitions
│   ├── content.ts                       # Content enums and interfaces
│   ├── setlist.ts                       # Setlist interfaces
│   ├── supabase.ts                      # Supabase auto-generated types
│   ├── performance.ts                   # Performance mode types
│   └── [other types]                    # Annotations, library, pwa, etc.
│
├── public/                     # Static assets
│   ├── icons/                  # PWA icons (192x192, 512x512)
│   ├── manifest.json           # PWA manifest
│   └── [other assets]          # Images, fonts, etc.
│
├── worker/                     # Service worker
│   └── sw.ts                   # Service worker for offline support
│
├── tests/                      # E2E tests
│   ├── e2e/                    # Playwright E2E test specs
│   └── fixtures/               # E2E test data
│
├── scripts/                    # Build and utility scripts
│   ├── build-sw.js             # Service worker bundling
│   └── [other scripts]
│
├── supabase/                   # Supabase migrations and config
│   ├── migrations/             # Database schema migrations
│   └── config.toml             # Supabase project config
│
├── middleware.ts               # Next.js middleware (route protection, headers)
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.mts           # Vitest unit test configuration
├── vitest.integration.config.mts # Vitest integration test configuration
├── playwright.config.ts        # Playwright E2E configuration
└── package.json                # Dependencies and scripts
```

## Directory Purposes

**app/api:**
- Purpose: RESTful API endpoints with authentication and validation
- Contains: NextRequest handlers following security pattern (auth → validation → service → response)
- Key files: `auth/verify`, `content/route`, `setlists/route`, `storage/upload`

**app/pages (dashboard, library, content, etc.):**
- Purpose: Server-side rendered pages with data pre-fetching
- Contains: App Router pages calling server-side service functions, passing initial state to client components
- Key files: `dashboard/page.tsx`, `library/page.tsx`, `content/[id]/page.tsx`

**components:**
- Purpose: Reusable React components organized by feature
- Contains: Feature-specific UI components, client components with extracted hooks for logic
- Key files: `library/`, `content-viewer/`, `file-upload.tsx`, `dashboard.tsx`
- Rule: Components must be <150 lines including imports

**lib:**
- Purpose: Core business logic and utilities
- Contains: Service layer (database access), security, validation, caching, offline support
- Critical files: `content-service.ts`, `firebase-server-utils.ts`, `offline-cache.ts`, `supabase-service.ts`

**hooks:**
- Purpose: Extract stateful business logic from components
- Contains: Custom hooks managing API calls, caching, validation, file upload
- Examples: `use-library-data.ts` handles content fetching with caching

**contexts:**
- Purpose: Global state providers for authentication and UI
- Contains: Authentication context with user, profile, token management
- Key file: `firebase-auth-context.tsx` - only provider managing shared state

**types:**
- Purpose: TypeScript definitions and Zod schemas
- Contains: Content type enums, setlist interfaces, Supabase generated types
- Key files: `content.ts` (ContentType enum), `setlist.ts` (Setlist interface)

**public:**
- Purpose: Static assets served by Next.js
- Contains: PWA manifest, icons, images
- Special: Checked into git, served at `/` path

**worker:**
- Purpose: Service worker for offline functionality
- Contains: Caching strategy, offline response handling
- Key file: `sw.ts` - registered by `use-service-worker.tsx`

**tests:**
- Purpose: E2E tests with Playwright
- Contains: Test specs under `e2e/`, shared fixtures
- Run: `pnpm test:e2e`

**supabase:**
- Purpose: Database schema and configuration
- Contains: Migrations defining tables (content, setlists, setlist_songs, profiles)
- Run migrations: `supabase migration up`

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout wrapping all pages with FirebaseAuthProvider, SessionProvider, error boundary
- `middleware.ts`: Request interceptor for authentication check, security headers, route protection
- `app/dashboard/page.tsx`: User's main dashboard after login

**Configuration:**
- `next.config.mjs`: Next.js build settings, service worker bundling
- `tailwind.config.ts`: Tailwind CSS theme customization
- `tsconfig.json`: TypeScript strict mode settings
- `vitest.config.mts`: Unit test configuration
- `playwright.config.ts`: E2E test configuration

**Core Logic:**
- `lib/firebase-server-utils.ts`: Token validation, `requireAuthServer()`, session management
- `lib/content-service.ts`: Content CRUD, `getUserContentPageServer()`, `getContentServer()`
- `lib/setlist-service.ts`: Setlist CRUD, `getSetlistWithSongs()`, `addSongToSetlist()`
- `lib/offline-cache.ts`: `cacheContent()`, `getCachedContent()`, `clearOfflineContent()`
- `lib/supabase-service.ts`: `getSupabaseServiceClient()` singleton

**Testing:**
- `app/api/*/__tests__/`: API route integration tests co-located with routes
- `lib/__tests__/`: Utility function tests
- `hooks/__tests__/`: Custom hook tests
- `tests/e2e/`: Playwright E2E specs

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `ContentViewer.tsx`, `FileUpload.tsx`)
- Services: kebab-case with suffix (e.g., `content-service.ts`, `offline-cache.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useLibraryData.ts`, `useFileUpload.ts`)
- API routes: `route.ts` inside directory matching path (e.g., `app/api/content/[id]/route.ts`)
- Tests: filename.test.ts or filename.integration.test.ts

**Directories:**
- Feature directories: kebab-case (e.g., `add-content/`, `content-viewer/`)
- API route directories: kebab-case matching endpoint path (e.g., `/api/content/[id]/`)
- Utility directories: kebab-case (e.g., `__tests__/`, `test-utils/`)

**Functions:**
- Server functions: suffix `Server` (e.g., `getUserContentServer()`, `getContentServer()`)
- Async operations: prefix or suffix with `async` if not obvious (e.g., `fetchUserProfile()`, `saveContent()`)
- Validation: prefix with `validate` or `is` (e.g., `validateFileType()`, `isValidContent()`)
- Hooks: `use` prefix (e.g., `useContentActions()`, `useLibraryData()`)

**Variables & Constants:**
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_CACHE_BYTES`, `TOKEN_CACHE_CLEANUP_MS`)
- React components: PascalCase (e.g., `const ContentViewer = () => {...}`)
- Type names: PascalCase (e.g., `type ContentItem = {...}`)
- Feature flags: camelCase with `is` prefix (e.g., `isOfflineMode`, `isPerformanceMode`)

## Where to Add New Code

**New Feature (e.g., Annotations):**
1. Create component directory: `components/annotations/`
2. Create feature components: `AnnotationTool.tsx`, `AnnotationsList.tsx`
3. Create hook for business logic: `hooks/use-annotations.ts`
4. Create API endpoints: `app/api/annotations/route.ts`, `app/api/annotations/[id]/route.ts`
5. Create service: `lib/annotations-service.ts` (if complex)
6. Create types: `types/annotations.ts`
7. Create tests: `components/annotations/__tests__/`, `app/api/annotations/__tests__/`, `hooks/__tests__/use-annotations.test.ts`
8. Add validation schemas: Add to `lib/validation-schemas.ts`

**New Component:**
1. Determine if feature-specific or generic UI
2. If UI primitive: `components/ui/[name].tsx` (use shadcn pattern)
3. If feature component: `components/[feature]/[name].tsx`
4. Keep under 150 lines - extract logic to hooks
5. Create tests: `components/[feature]/__tests__/[name].test.tsx`
6. Example: Content filtering logic → `useContentFilters()` hook, display UI → `ContentFilters.tsx`

**New API Route:**
1. Create directory matching endpoint path: `app/api/[resource]/route.ts`
2. Implement security pattern: `requireAuthServer()` → validate input → call service
3. Add validation schema: `lib/validation-schemas.ts`
4. Create integration tests: `app/api/[resource]/__tests__/route.test.ts`
5. Example route: `POST /api/content` in `app/api/content/route.ts`

**New Service/Utility:**
1. Create in `lib/` with descriptive name: `lib/[feature]-service.ts` or `lib/[utility]-utils.ts`
2. Export typed functions with clear contracts
3. Add error handling with logging
4. Add tests: `lib/__tests__/[name].test.ts`
5. If database access, use `getSupabaseServiceClient()` pattern

**Utilities & Helpers:**
- Shared across components: `lib/utils.ts` or `lib/[category]-utils.ts`
- Content-specific: `lib/content-service.ts` or specialized `lib/content-*.ts`
- Validation: Always in `lib/validation-schemas.ts` as Zod schemas

## Special Directories

**components/ui:**
- Purpose: Reusable UI primitives from shadcn/ui (Button, Dialog, Form, etc.)
- Generated: Created by `pnpm add` shadcn-ui CLI
- Committed: Yes, checked into git for bundling
- Pattern: Unstyled accessible components, styled with Tailwind

**lib/__tests__:**
- Purpose: Unit tests for utilities and service functions
- Generated: No, written manually
- Committed: Yes
- Pattern: Test isolated functions without external dependencies using mocks

**app/api/*/__tests__:**
- Purpose: Integration tests for API routes
- Generated: No, written manually
- Committed: Yes
- Pattern: Mock auth and database, test request/response cycles using MSW

**public:**
- Purpose: Static assets accessible at root URL
- Generated: SVG icons may be exported from design tools
- Committed: Yes
- Special: Used for PWA manifest and icons

**worker:**
- Purpose: Service worker implementation
- Generated: No, written manually
- Committed: Yes
- Special: Built separately via `scripts/build-sw.js`, bundled at build time

**.next:**
- Purpose: Next.js build output
- Generated: Yes, created by `pnpm build`
- Committed: No, in `.gitignore`
- Special: Contains compiled pages, API routes, static optimizations

**supabase/migrations:**
- Purpose: Database schema version control
- Generated: Created by `supabase migration new [name]`
- Committed: Yes
- Pattern: SQL files applying incremental schema changes

---

*Structure analysis: 2026-02-23*
