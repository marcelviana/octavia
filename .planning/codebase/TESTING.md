# Testing Patterns

**Analysis Date:** 2026-02-23

## Test Framework

**Runner:**
- Vitest - configured in `vitest.config.mts`
- Environment: jsdom for component/hook testing
- Globals: true (describe, it, expect available without imports)

**Assertion Library:**
- Vitest built-in expect API
- Testing Library matchers via `@testing-library/jest-dom`
- Custom matchers defined in `lib/__tests__/custom-matchers.ts`

**Run Commands:**
```bash
pnpm test              # Run unit tests only
pnpm test:watch       # Watch mode for unit tests
pnpm test:coverage    # Unit tests with coverage report
pnpm test:ui          # Interactive UI mode
pnpm test:integration # Run integration tests only
pnpm test:integration:watch  # Integration tests watch mode
pnpm test:all         # Run unit + integration + E2E tests

# E2E Tests (Playwright)
pnpm test:e2e         # Run E2E tests
pnpm test:e2e:ui      # E2E with UI mode
pnpm test:e2e:headed  # E2E with browser visible
pnpm test:e2e:debug   # Debug E2E tests
```

## Test File Organization

**Location Patterns:**
- Unit tests: `__tests__/` directory next to source file or in `app/api/[feature]/__tests__/`
- Integration tests: `tests/integration/**/*.test.ts`
- E2E tests: `tests/e2e/**/*.spec.ts`
- API tests: `app/api/[feature]/__tests__/route.test.ts`

**File Naming:**
- Unit/Integration: `*.test.ts` or `*.test.tsx`
- E2E: `*.spec.ts`
- Setup: `test-setup.ts` (unit), `test-setup-integration.ts` (integration)
- Mocks: `mocks/`, `test-utils/`, `fixtures/`

**Example Structure:**
```
app/api/content/
├── route.ts
└── __tests__/
    └── route.test.ts          # API route test

contexts/
├── sidebar-context.tsx
└── __tests__/
    └── sidebar-context.test.tsx  # Context hook test

lib/
├── utils.ts
├── __tests__/
│   ├── api-test-helpers.ts     # Shared test utilities
│   ├── custom-matchers.ts      # Custom expect matchers
│   └── firebase-server-utils.test.ts
└── test-utils/
    └── supabase-mock-factory.ts  # Mock factories
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('/api/content', () => {
  // Setup/teardown
  beforeEach(() => {
    vi.clearAllMocks()  // Reset mocks before each test
  })

  afterEach(() => {
    vi.clearAllMocks()  // Cleanup after each test
  })

  // Test suites by feature
  describe('GET /api/content', () => {
    it('returns user content when authenticated', async () => {
      // Arrange: setup test data
      const mockData = { data: [TEST_CONTENT], error: null }
      mockRange.mockResolvedValue(mockData)

      // Act: call the function
      const { GET } = await import('../route')
      const request = createValidAuthenticatedRequest('http://localhost/api/content')
      const response = await GET(request)

      // Assert: verify behavior
      expectSuccess(response)
      const data = await getJsonResponse(response)
      expect(data.data).toEqual([TEST_CONTENT])
    })

    it('rejects unauthenticated requests', async () => {
      const { GET } = await import('../route')
      const request = createMockRequest('http://localhost/api/content')
      const response = await GET(request)
      expectUnauthorized(response)
    })
  })

  describe('POST /api/content', () => {
    // POST tests...
  })
})
```

**Setup Pattern:**
```typescript
// Before each test
beforeEach(() => {
  vi.clearAllMocks()      // Clear all mock call history
  // Reset mock return values if needed
})

// After each test
afterEach(() => {
  vi.clearAllMocks()      // Final cleanup
  // Restore any overridden state
})
```

## Mocking

**Framework:** Vitest `vi` module

**Patterns - API Authentication:**
```typescript
// Mock Firebase server auth (done in test-setup.ts)
const mockRequireAuthServerSecure = vi.fn().mockResolvedValue({
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true
})

vi.mock('@/lib/firebase-server-utils', () => ({
  requireAuthServer: mockRequireAuthServerSecure
}))

// In test: handle both auth success and failure
it('rejects unauthenticated requests', async () => {
  mockRequireAuthServerSecure.mockResolvedValue(null)
  const response = await GET(request)
  expectUnauthorized(response)
})
```

**Patterns - Supabase Queries:**
```typescript
// Mock chain pattern (from app/api/content/__tests__/route.test.ts)
const mockRange = vi.fn()
const mockFrom = vi.fn()

mockRange.mockResolvedValue({
  data: [TEST_CONTENT],
  error: null,
  count: 1
})

// Supabase query chain returns proper mocks
mockSelect.mockReturnValue({
  eq: mockEq,
  single: mockSingle,
  range: mockRange,
  or: mockOr
})

// Test can set response
mockRange.mockResolvedValue({ data: [TEST_CONTENT], error: null })
const response = await GET(request)
expect(mockRange).toHaveBeenCalledWith(0, 9)  // Verify pagination
```

**Patterns - HTTP Requests:**
```typescript
// Mock fetch (setup in test-setup.ts)
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
      blob: vi.fn().mockResolvedValue(new Blob()),
      text: vi.fn().mockResolvedValue(''),
    } as Response)
  )
})

// In test: configure specific response
vi.mocked(global.fetch).mockResolvedValueOnce({
  ok: false,
  status: 500,
  json: vi.fn().mockResolvedValue({ error: 'Server error' })
} as Response)
```

**Patterns - React Components:**
```typescript
// Mock context providers
vi.mock('@/contexts/firebase-auth-context', () => ({
  useFirebaseAuth: () => mockAuthContextValue,
  FirebaseAuthProvider: ({ children }: any) => children
}))

// Mock child components if needed
vi.mock('@/components/some-component', () => ({
  SomeComponent: ({ data }: any) => <div>{data}</div>
}))

// In test: use mocked hook
const { result } = renderHook(() => useFirebaseAuth())
expect(result.current.user).toBe(mockUser)
```

**What to Mock:**
- External service calls (Firebase, Supabase, HTTP requests)
- Third-party library functions that are hard to test
- Browser APIs (localStorage, sessionStorage, matchMedia, ResizeObserver, IntersectionObserver)
- Child components in unit tests (to isolate what's being tested)
- Logger functions to reduce test output noise

**What NOT to Mock:**
- The actual function/component being tested
- Other utility functions from same module (test the module as a unit)
- Next.js routing in integration tests (use real routes)
- Date/time unless specifically testing time-dependent behavior
- Promise/async behavior (let it run, use proper async handling)

## Fixtures and Factories

**Test Data Patterns:**
```typescript
// From lib/__tests__/api-test-helpers.ts
export const TEST_USER = {
  uid: 'auvL2KKsYBVdvvnc83faOJM8rLi1',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User'
}

export const TEST_CONTENT = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Song',
  artist: 'Test Artist',
  content_type: 'Lyrics',
  content_data: { lyrics: 'Test song lyrics' },
  user_id: TEST_USER.uid,
  created_at: '2024-01-01T00:00:00Z'
}

export const TEST_SETLIST = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  name: 'Test Setlist',
  user_id: TEST_USER.uid,
  is_public: false
}
```

**Request Factories:**
```typescript
// Create different request types
export function createMockRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: any }
): NextRequest { ... }

export function createValidAuthenticatedRequest(
  url: string,
  options?: Parameters<typeof createMockRequest>[1]
): NextRequest { ... }

// In tests:
const request = createValidAuthenticatedRequest('http://localhost/api/content')
const response = await POST(request)
```

**Mock Factory Pattern:**
```typescript
// From lib/__tests__/api-test-helpers.ts
export function mockSupabaseService() {
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  // ... setup chain

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate
  })

  vi.doMock('@/lib/supabase-service', () => ({
    getSupabaseServiceClient: () => ({ from: mockFrom })
  }))

  return { mockFrom, mockSelect, mockInsert, mockUpdate }
}

// In test file:
const { mockSelect, mockInsert } = mockSupabaseService()
mockSelect.mockResolvedValue({ data: [TEST_CONTENT] })
```

**Location:**
- Shared test data: `lib/__tests__/api-test-helpers.ts`
- API test helpers: `lib/__tests__/api-test-helpers.ts`
- Supabase mocks: `lib/test-utils/supabase-mock-factory.ts`
- Custom matchers: `lib/__tests__/custom-matchers.ts`

## Coverage

**Requirements:**
- Current: ~35% (from CLAUDE.md)
- Target: 85% overall
  - Utilities: 95% coverage (critical infrastructure)
  - Components: 80% coverage
  - API Routes: 90% coverage
  - Hooks: 85% coverage

**View Coverage:**
```bash
pnpm test:coverage          # Unit test coverage
pnpm test:integration:coverage  # Integration test coverage
```

**Coverage Configuration:**
- Provider: istanbul (for Next.js compatibility)
- Report formats: text, json, html, lcov
- Thresholds enforced: 50% global (but 85% target in CLAUDE.md)
- Excluded from coverage:
  - Test files and fixtures
  - Configuration files
  - Build outputs (.next, dist, coverage/)
  - Next.js special files (layout.tsx, error.tsx, loading.tsx)
  - Server-only and edge runtime files

## Test Types

**Unit Tests:**
- Scope: Single function or component in isolation
- Mocking: Mock all external dependencies
- Files: `**/*.test.{ts,tsx}`
- Timeout: 10 seconds
- Run via: `pnpm test`
- Example: Testing `isPdfFile()` utility function
  ```typescript
  describe('isPdfFile', () => {
    it('detects PDF by MIME type', () => {
      expect(isPdfFile('blob:http://...', 'application/pdf')).toBe(true)
    })
    it('detects PDF by extension', () => {
      expect(isPdfFile('/path/to/file.pdf')).toBe(true)
    })
  })
  ```

**Integration Tests:**
- Scope: Multiple components/services working together
- Mocking: Only mock external service boundaries
- Files: `tests/integration/**/*.test.ts` or `**/*integration*.test.{ts,tsx}`
- Timeout: 30 seconds (longer than unit tests)
- Setup: From `test-setup-integration.ts` - provides real services with boundary mocks only
- Run via: `pnpm test:integration`
- Example: Testing API route with real Supabase mocks but actual auth flow
  ```typescript
  describe('Content API with integration', () => {
    it('creates content through full flow', async () => {
      // Setup: Use createValidAuthenticatedRequest (real auth header simulation)
      const request = createValidAuthenticatedRequest('/api/content', {
        method: 'POST',
        body: validContentData
      })

      // Act: Call the actual route handler
      const response = await POST(request)

      // Assert: Verify full behavior
      expect(response.status).toBe(201)
    })
  })
  ```

**E2E Tests:**
- Framework: Playwright (`@playwright/test`)
- Scope: Complete user journeys end-to-end
- Approach: Real browser, real app, no mocking of UI
- Files: `tests/e2e/**/*.spec.ts`
- Config: `playwright.config.ts`
- Run via: `pnpm test:e2e` (or `--headed`, `--debug`, `--ui`)
- Global setup: `tests/e2e/global-setup.ts` (authenticates for tests)
- Retries: 2 on CI, 0 locally
- Artifacts: Screenshots/videos on failure, HTML reports
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Example flow:
  1. Global setup authenticates via Firebase
  2. Tests run with authenticated state (`storageState: 'tests/e2e/.auth/user.json'`)
  3. Each test is independent but shares auth

## Common Patterns

**Async Testing:**
```typescript
// Using async/await
it('fetches content', async () => {
  const response = await fetch('/api/content')
  const data = await response.json()
  expect(data.length).toBeGreaterThan(0)
})

// Using renderHook with async
it('loads user profile', async () => {
  const { result } = renderHook(() => useUserProfile())

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  expect(result.current.profile).toBeDefined()
})

// Using act for state updates
it('updates on click', async () => {
  const { result } = renderHook(() => useState(0))

  act(() => {
    result.current[1](1)  // setState
  })

  expect(result.current[0]).toBe(1)
})
```

**Error Testing:**
```typescript
// Test error responses
it('returns 400 on validation error', async () => {
  const request = createValidAuthenticatedRequest('/api/content', {
    method: 'POST',
    body: { title: '' }  // Invalid: empty title
  })

  const response = await POST(request)

  expect(response.status).toBe(400)
  const data = await response.json()
  expect(data.error).toBe('Validation failed')
})

// Test exception handling in hooks
it('handles fetch errors gracefully', async () => {
  vi.mocked(global.fetch).mockRejectedValueOnce(
    new Error('Network error')
  )

  const { result } = renderHook(() => useContentManagement())

  await waitFor(() => {
    expect(result.current.error).toContain('Network error')
  })
})

// Test error boundaries
it('displays error message on failure', () => {
  render(<Component onError={() => {}} />)

  expect(screen.getByText(/error/i)).toBeInTheDocument()
})
```

**Skipped Tests:**
```typescript
// Mark tests that need fixing with .skip
it.skip('TODO: Fix GET ownership - returns specific content', async () => {
  // Test will be skipped but visible in test output
  // Shows what needs fixing
})

// Or use todo pattern
it.todo('implement delete functionality')
```

## Test Environment Configuration

**Unit Test Setup** (`src/test-setup.ts`):
- Global mocks: Firebase Auth, Supabase, fetch
- Mock data: `mockUser`, `mockProfile`, `mockAuthContext`
- Browser APIs: IntersectionObserver, ResizeObserver, matchMedia, localStorage
- Environment variables: Firebase and Supabase test configs
- Promise.withResolvers polyfill for older Node.js

**Integration Test Setup** (`src/test-setup-integration.ts`):
- Fewer mocks - only external service boundaries
- Database setup/cleanup helpers
- Browser API mocks (matchMedia, localStorage, IntersectionObserver)
- Test isolation: cleanup after each test
- Performance monitoring API mocks

**E2E Global Setup** (`tests/e2e/global-setup.ts`):
- Browser launch
- Firebase authentication
- Save authenticated session state to `tests/e2e/.auth/user.json`
- All tests use this authenticated state

## Best Practices

1. **Test Isolation**: Each test should be independent, run `beforeEach` and `afterEach` to reset state
2. **Meaningful Names**: Test names should describe what is being tested and expected outcome
3. **AAA Pattern**: Arrange (setup), Act (execute), Assert (verify)
4. **No Test Interdependence**: Tests must run in any order and independently
5. **Mock External Only**: Mock external services, not the code being tested
6. **Use Factories**: Create test data with functions, not inline literals
7. **Test Behavior**: Test what the code does, not how it's implemented
8. **Error Cases**: Test both success and failure paths
9. **Real Data When Possible**: Use realistic test data that matches production shapes
10. **Clear Assertions**: Use helper functions like `expectUnauthorized(response)` for clarity

---

*Testing analysis: 2026-02-23*
