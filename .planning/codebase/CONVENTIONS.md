# Coding Conventions

**Analysis Date:** 2026-02-23

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `chord-editor.tsx`, `bottom-nav.tsx`)
- Utilities: lowercase with hyphens (e.g., `offline-cache.ts`, `file-security.ts`)
- Test files: `__tests__` directory with matching name (e.g., `route.test.ts` in `__tests__` folder)
- Hooks: `use` prefix in camelCase (e.g., `useFirebaseAuth`, `useContentManagement`)

**Functions:**
- camelCase for all functions (e.g., `getAuthenticatedUser`, `createContent`, `validateFileUpload`)
- Async functions clearly marked with `async` keyword
- API handler functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH` (uppercase exports)
- Helper/service functions: descriptive action verbs (e.g., `sanitizeFilename`, `parseContentType`)

**Variables:**
- camelCase for local variables and parameters (e.g., `mockData`, `userId`, `contentData`)
- Constants in UPPERCASE with underscores (e.g., `TOKEN_CACHE_DURATION_MS`, `MAX_CACHE_SIZE`)
- Boolean flags prefixed with `is` or `has` (e.g., `isAuthenticated`, `hasError`, `isLoading`)
- Prefixed state variables clearly: `set` for setState (e.g., `setLoading`, `setError`)

**Types:**
- Interfaces in PascalCase with descriptive names (e.g., `ContentQueryParams`, `ChordEditorProps`)
- Type aliases in PascalCase (e.g., `Content`, `User`, `Setlist`)
- Enums in PascalCase (e.g., `ContentType`, `DifficultyLevel`)
- Database row types use pattern: `type Content = Database["public"]["Tables"]["content"]["Row"]`
- Generic types use `T`, `U`, `V` following convention

## Code Style

**Formatting:**
- ESLint with Next.js configuration (`eslint-config-next`)
- No formatter config found, but Next.js ESLint enforces consistent formatting
- Line length appears to follow standard (approximately 80-100 characters)
- Use double quotes for strings (not single quotes)
- Trailing semicolons required

**Linting:**
- ESLint enabled: `.eslintrc.json` extends "next"
- Build fails on ESLint errors: `ignoreDuringBuilds: false` in `next.config.mjs`
- TypeScript strict mode enforced: `ignoreBuildErrors: false`
- No `any` types allowed - full TypeScript coverage required

**Import Organization:**
- Group 1: External packages (`react`, `@radix-ui/*`, etc.)
- Group 2: Absolute imports using `@/` alias
- Group 3: Relative imports (rarely used due to `@/` alias)
- Example from `chord-editor.tsx`:
  ```typescript
  import { useState } from "react"
  import { Card, CardContent } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { MusicText } from "@/components/music-text"
  interface ChordEditorProps { ... }
  export function ChordEditor({ ... }) { ... }
  ```

**Path Aliases:**
- `@/` points to project root for absolute imports
- Used throughout for library (`@/lib`), components (`@/components`), types (`@/types`)
- No relative path imports (`../../../`) in codebase

## Error Handling

**Patterns:**
- All API routes implement try-catch with error sanitization
- Generic error messages returned to clients: "Server error", "Validation failed", "Unauthorized"
- Detailed errors logged server-side via `logger.error()` with context
- Never expose implementation details in error responses
- Example from `app/api/content/route.test.ts`:
  ```typescript
  it('handles database errors gracefully', async () => {
    mockRange.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    })
    const response = await GET(request)
    expect(response.status).toBe(500)
    const data = await getJsonResponse(response)
    expect(data.error).toBe('Server error')  // Generic message
  })
  ```

**Validation:**
- All API inputs validated with Zod schemas before processing
- Validation schemas defined centrally in `lib/validation.ts`
- Common schemas reused: `commonSchemas.id`, `commonSchemas.email`, etc.
- Validation errors return 400 with "Validation failed" message and details
- Example structure:
  ```typescript
  const schema = z.object({
    title: z.string().min(1),
    content_type: z.enum(['Lyrics', 'Chords', 'Tabs', 'Piano', 'Drums']),
  })
  try {
    const validatedData = schema.parse(await request.json())
  } catch (error) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }
  ```

**Loading States:**
- Components maintain explicit `loading` and `error` state
- Pattern: `const [loading, setLoading] = useState(false)`
- Set before async operations, cleared in finally block
- Error state reset when starting new operation: `setError(null)`

## Logging

**Framework:** `lib/logger.ts` - custom logger implementation

**Patterns:**
- `logger.log()` - general information
- `logger.info()` - important events
- `logger.warn()` - warnings/deprecations
- `logger.error()` - errors with full context
- All security events logged via `lib/security-logger.ts`
- No console.log in production code (use logger instead)

**Conventions:**
- Always include context object: `logger.error('getUserContent failed', { error, userId })`
- Sanitize sensitive data before logging (never log full tokens, passwords, credit cards)
- Include operation context: what was being attempted and with what data

## Comments

**When to Comment:**
- Complex algorithm logic that isn't obvious from code alone
- Security-critical operations with reasoning
- Workarounds or non-standard patterns with explanation
- JSDoc for all exported functions and types
- Avoid obvious comments that just repeat the code

**JSDoc/TSDoc:**
- Required on all exported functions
- Document parameters, return types, and throws
- Example from codebase:
  ```typescript
  /**
   * Create mock data for API route tests
   * Note: vi.mock calls should be done in test files to avoid hoisting issues
   */
  export function createAPIMockData() { ... }
  ```

## Function Design

**Size:**
- Target: <50 lines for most functions
- API handlers and complex business logic: <100 lines
- Larger functions should extract helper functions
- Component constraint: components must be <150 lines (enforced per CLAUDE.md)

**Parameters:**
- Maximum 3 positional parameters; use object destructuring for more
- Object parameters always typed with interfaces
- Optional parameters at end or in options object
- Example: `function updateChordData(newData: ChordData): void` uses typed object

**Return Values:**
- Always type return values explicitly: `: Promise<Content>` not `: any`
- Use union types for error scenarios: `Promise<{ success: boolean; data?: Content; error?: string }>`
- Early returns for error/guard conditions
- Never use implicit `undefined` for errors

## Module Design

**Exports:**
- Named exports preferred over default exports for easier tree-shaking
- Public API clearly defined at top of file
- Internal helpers prefixed with underscore: `_sanitizeString()`
- Each file has single responsibility

**Barrel Files:**
- Used in `components/ui/` for component library exports
- Pattern: `components/ui/index.ts` exports all UI primitives
- Enables: `import { Button, Card } from '@/components/ui'`

**Structure Pattern:**
- Utility: pure functions, no side effects
- Service: handles database/API operations with auth checks
- Component: presentational logic with hooks for state
- Hook: extracted business logic (50+ lines from components)

## Authentication & Security

**API Route Pattern (Mandatory):**
All API routes follow security-first pattern from `app/api/content/route.test.ts`:

```typescript
// 1. Authentication check - REQUIRED
const user = await requireAuthServer(request)
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Input validation with Zod - REQUIRED
const schema = z.object({ /* fields */ })
const validatedData = schema.parse(await request.json())

// 3. Database operations with service role - REQUIRED
const supabase = getSupabaseServiceClient()
```

**Security Constants:**
- Token cache duration: 5 minutes (from `secure-auth-utils.ts`)
- Blacklist duration: 30 minutes
- Max cache size: 1000 tokens
- Never trust client-provided user IDs - use authenticated user from token

## Type Safety

**Requirements:**
- No `any` types - use proper typing with `unknown` or specific types
- All component props have TypeScript interfaces
- Database operations type from generated schema: `Database["public"]["Tables"]["content"]["Row"]`
- Async operations typed: `Promise<Content[]>` not `Promise<any>`
- Error objects typed: `error instanceof Error`, not checking string messages
- Optional fields use `?:` not `| undefined`

## State Management

**Pattern:**
- React hooks for component state (useState, useContext)
- Custom hooks for extracted business logic
- Context API for global state (`FirebaseAuthProvider`, `SidebarProvider`)
- URL query params for filter/pagination state
- Never prop-drill deeply - use context or custom hooks

---

*Convention analysis: 2026-02-23*
