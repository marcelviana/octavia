# Codebase Concerns

**Analysis Date:** 2026-02-23

## Tech Debt

### Incomplete Feature: Favorite Status Toggle
- **Issue:** `useContentActions()` hook has `toggleFavorite()` function that sets state but doesn't persist to database
- **Files:** `hooks/useContentActions.ts` (line 33)
- **Impact:** User favorites are lost on page refresh; inconsistent UX between UI state and backend data
- **Fix approach:** Implement API call to `PATCH /api/content/[id]` with `is_favorite` field, handle loading states and error feedback

### Proxy Rate Limiting in Memory
- **Issue:** Rate limit state stored in-memory Map without distributed session awareness
- **Files:** `app/api/proxy/route.ts` (lines 8, 11-18)
- **Impact:** In multi-instance deployments, each server maintains separate rate limit state; distributed DoS attacks bypass protection
- **Fix approach:** Migrate to Redis-backed rate limiting or implement per-IP rate limiting at reverse proxy level; consider using `@replit/rbx` or similar

### Unvalidated Proxy Host Configuration
- **Issue:** `ALLOWED_PROXY_HOSTS` parsed via string split with minimal validation
- **Files:** `app/api/proxy/route.ts` (lines 27-30)
- **Impact:** Whitespace handling in env vars could allow unintended hosts; misconfiguration could expose internal services
- **Fix approach:** Add strict hostname validation with regex, test edge cases with trailing slashes/ports

---

## Known Bugs

### Console Logging in Production Code
- **Symptoms:** 258+ `console.log()` and `console.error()` calls throughout codebase; sensitive debugging info may leak to clients in error messages
- **Files:**
  - `middleware.ts` (logs token validation and user info)
  - `domains/shared/components/GlobalErrorHandler.tsx`
  - `app/api/proxy/route.ts` (line 77)
  - `domains/content-management/hooks/use-content-viewer.ts`
  - Multiple API routes
- **Trigger:** Any error condition or middleware processing
- **Workaround:** Monitor browser dev tools; server logs only visible to operators
- **Recommended fix:** Replace all `console.*` with structured logger that respects `NODE_ENV` and sanitizes sensitive data

### setTimeout/setInterval Leaks in Performance Mode
- **Symptoms:** Memory leaks during long performance sessions; intervals not always cleaned up on component unmount
- **Files:**
  - `app/api/proxy/route.ts` (line 11-18: setInterval without refHandle cleanup)
  - `hooks/use-performance-controls.ts`
  - `hooks/use-service-worker.tsx`
  - `components/optimized-performance-mode.tsx`
- **Trigger:** Extended performance mode usage (>30 mins)
- **Workaround:** Refresh page periodically
- **Fix approach:** Audit all setInterval/setTimeout calls in useEffect; ensure cleanup functions call clearInterval/clearTimeout

---

## Security Considerations

### Type `any` Overuse (649 total occurrences)
- **Risk:** TypeScript safety disabled in 179 files; potential runtime type errors and security bypasses
- **Files:** Multiple instances in:
  - `hooks/useContentActions.ts` (line 6: `content: any`)
  - `lib/content-service.ts` (11+ occurrences)
  - `contexts/firebase-auth-context.tsx` (10 occurrences)
  - `app/api/setlists/route.ts` (10 occurrences)
- **Current mitigation:** Zod validation on API inputs (not all paths)
- **Recommendations:**
  1. Create strict TypeScript interfaces for all data shapes
  2. Enforce `noImplicitAny: true` in tsconfig.json
  3. Add ESLint rule to ban `any` type

### @ts-ignore Used for Untyped APIs
- **Risk:** Wake Lock API and other browser APIs use @ts-ignore; bypasses type safety
- **Files:**
  - `hooks/use-wake-lock.ts` (2 instances)
  - `components/performance-mode/optimized-content-display.tsx` (1 instance)
- **Current mitigation:** Comments explain why
- **Recommendations:**
  1. Create proper type definitions for experimental APIs
  2. Consider `declare global` for browser API extensions
  3. Use DefinitelyTyped packages when available

### Firebase Admin SDK Version Skew
- **Risk:** Package.json has `"firebase-admin": "^13.4.0"` allowing major version updates; breaking API changes possible
- **Current mitigation:** Version pinning in pnpm-lock.yaml
- **Recommendations:** Pin to exact version `"firebase-admin": "13.4.0"` for production stability

---

## Performance Bottlenecks

### Oversized Components (Architecture Violation)
- **Problem:** Components significantly exceed 150-line limit (violates CLAUDE.md requirement)
- **Files:**
  - `components/file-upload.tsx` - 442 lines
  - `components/unified-metadata-editor.tsx` - 402 lines
  - `components/dashboard.tsx` - 399 lines
  - `components/optimized-performance-mode.tsx` - 378 lines
  - `components/setlist-manager.tsx` - 337 lines
  - `components/chord-editor.tsx` - 335 lines
  - `components/auth/login-panel.tsx` - 329 lines
  - `components/performance-mode/optimized-content-display.tsx` - 324 lines
- **Cause:** Mixing business logic with rendering; insufficient extraction to custom hooks
- **Improvement path:**
  1. Extract business logic to dedicated hooks (useFileUploadLogic, useMetadataEditorLogic, etc.)
  2. Split large components into smaller focused components
  3. Target <150 lines per component file

### Large Library Service Files
- **Problem:** Core services exceed maintainability thresholds
- **Files:**
  - `lib/content-service.ts` - 694 lines (multiple concerns: fetching, validation, caching)
  - `lib/performance-monitor.ts` - 623 lines
  - `lib/memory-management.ts` - 559 lines
  - `lib/security-audit-logger.ts` - 554 lines
  - `lib/input-sanitizer.ts` - 547 lines
  - `lib/rate-limiter.ts` - 491 lines
- **Cause:** Multiple responsibilities per service; no clear separation of concerns
- **Improvement path:**
  1. Break into focused services (ContentRepository, ContentValidator, ContentCache)
  2. Use composition over monolithic services
  3. Consider domain-driven design structure

### Missing Performance Mode Optimization
- **Problem:** Performance mode components not using React.memo despite being in hot path (song navigation)
- **Files:**
  - `components/performance-mode/optimized-content-display.tsx` - No memoization detected
  - `components/optimized-performance-mode.tsx` - No virtualization for long lists
- **Cause:** Components render full content on navigation without optimization
- **Improvement path:**
  1. Add React.memo wrapping for content display components
  2. Implement virtualization for song lists in setlists
  3. Add performance benchmarks to test suite

---

## Fragile Areas

### Test Coverage Gaps (145 skipped tests = ~23% of suite)
- **Files:**
  - `tests/security/token-blacklist-concurrency.test.ts` - 10 tests skipped (race conditions)
  - `tests/security/security-headers-validation.test.ts` - 20 tests skipped (middleware mocking)
  - `tests/components/content-viewer.refactoring.test.tsx` - 25 tests skipped (sub-component mocks)
  - `tests/components/add-content.refactoring.test.tsx` - 10 tests skipped (state management)
  - `tests/platform/platform-utils.test.ts` - 9 tests skipped (browser APIs)
  - `tests/performance/component-refactoring.bench.test.tsx` - 19 tests skipped (benchmark mode)
  - `tests/hooks/useContentFile.test.ts` - entire file skipped (mock initialization)
- **Why fragile:** Untested code paths include:
  - Race conditions in token blacklist management
  - CORS and security header validation
  - Content viewer state transitions
  - Browser API fallbacks
- **Safe modification:** Add tests incrementally; reference TEST_STATUS_REPORT.md for skip reasons
- **Test coverage:** Currently 487 passing; ~35% coverage (target 85%); needs 150+ additional tests

### Offline Cache Race Conditions
- **Files:** `lib/offline-cache.ts`
- **Why fragile:**
  - Ongoing operations Map tracks promises but no timeout mechanism (lines 23-24)
  - Multiple concurrent operations could write stale data
  - LRU eviction algorithm modifies index without synchronous updates
- **Safe modification:**
  1. Add operation timeout (30s) with cleanup
  2. Implement atomic index updates
  3. Add comprehensive integration tests for cache scenarios
- **Test coverage:** No dedicated offline cache race condition tests

### Content Service Timing Issues
- **Files:** `lib/content-service.ts` (lines 27-44)
- **Why fragile:**
  - 2-second timeout on `onAuthStateChanged()` callback may be insufficient on slow networks
  - Mixing async patterns (promises vs callbacks) creates timing bugs
  - No retry logic for failed auth checks
- **Safe modification:**
  1. Implement exponential backoff for auth state checks
  2. Use async/await pattern consistently
  3. Add timeout configuration per environment
- **Test coverage:** Timing-sensitive code lacks test coverage

---

## Scaling Limits

### In-Memory Rate Limiting (Proxy)
- **Current capacity:** Single server instance; ~10,000 unique IPs per minute under steady state
- **Limit:** Breaks with horizontal scaling or cache invalidation; no distributed session awareness
- **Scaling path:**
  1. Migrate to Redis (supports ~100K ops/sec per server)
  2. Implement token bucket algorithm with distributed state
  3. Add metrics/monitoring for rate limit efficiency

### IndexedDB Cache Size (50MB)
- **Current capacity:** 50MB per user session
- **Limit:** Performance degrades above 30MB; LRU cleanup may cause stuttering during performance mode
- **Scaling path:**
  1. Implement two-tier cache: hot cache (10MB in memory), cold cache (50MB IndexedDB)
  2. Add cache compression for PDFs/images
  3. Implement background cleanup during idle periods

### Memory Monitoring Interval (30 seconds)
- **Current capacity:** Checks heap every 30 seconds
- **Limit:** Misses gradual memory leaks that compound between checks
- **Scaling path:**
  1. Reduce monitoring interval to 10 seconds during performance mode
  2. Add early warning threshold (70MB instead of 80MB)
  3. Implement predictive cleanup based on growth trend

---

## Dependencies at Risk

### `@vitest/coverage-v8` Version Pinned to 3.2.2
- **Risk:** Old version (current is 4+); potential incompatibilities with latest Vitest
- **Files:** `package.json` (line 100)
- **Impact:** Coverage reports may have accuracy issues; tools assume older Vitest behavior
- **Migration plan:**
  1. Update to `@vitest/coverage-istanbul` (already installed) OR latest v8
  2. Run full test suite post-upgrade
  3. Update CI coverage thresholds if needed

### `latest` Dependency Pins (Supabase, @vitest packages)
- **Risk:** "latest" versions may introduce breaking changes without pinning major versions
- **Files:** `package.json` (lines 54-58, 66, 85)
- **Impact:** Builds may fail unexpectedly; inconsistent versions across developers
- **Migration plan:**
  1. Run `pnpm update` to see actual versions
  2. Pin to specific versions in package.json (e.g., `@supabase/supabase-js: ^8.0.0`)
  3. Document update schedule (e.g., quarterly)

### Firebase SDK Major Version (11.x)
- **Risk:** Firebase 12.x likely coming with breaking API changes; compat layer may be removed
- **Files:** `package.json` (line 64)
- **Current usage:** Both compat and modular imports mixed throughout codebase
- **Migration plan:**
  1. Audit codebase for compat imports
  2. Create migration guide for v12
  3. Plan gradual migration (not immediate)

---

## Missing Critical Features

### No Request Deduplication
- **Problem:** Multiple components can fetch same content simultaneously; no request coalescing
- **Impact:** Wasted bandwidth, doubled database load, slower UX during concurrent navigation
- **Blocks:** Efficient multi-user performance mode with shared setlists
- **Fix approach:** Implement request cache/deduplication in content-service using Map<URL, Promise>

### No Offline Conflict Resolution
- **Problem:** Users can edit content offline and online simultaneously; no merge strategy
- **Impact:** Last-write-wins; user edits lost without notification
- **Blocks:** True offline-first functionality
- **Fix approach:**
  1. Add timestamp/version tracking to content
  2. Implement three-way merge for text-based content
  3. Show conflict UI for manual resolution

### No Rate Limit Headers in Responses
- **Problem:** Clients don't know remaining requests before hitting limit
- **Impact:** Poor UX; clients guess at safe request rates
- **Blocks:** Optimal batching strategies
- **Fix approach:** Add `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers to all API responses

---

## Test Coverage Gaps

### Authentication Flow Integration Tests
- **What's not tested:**
  - Token refresh during long sessions
  - Logout during background sync
  - Multi-tab session synchronization
  - Firebase session expiry recovery
- **Files:**
  - `middleware.ts` - No tests for auth preprocessing
  - `contexts/firebase-auth-context.tsx` - 10+ `any` types make testing difficult
- **Risk:** Auth state could silently break in production
- **Priority:** HIGH - blocks secure deployment

### Offline Scenarios
- **What's not tested:**
  - Network failure during content upload
  - Concurrent offline edits (two songs edited simultaneously)
  - Service worker update during offline usage
  - IndexedDB quota exhaustion handling
- **Files:**
  - `lib/offline-cache.ts` - No comprehensive offline test suite
  - `lib/offline-queue.ts` - Edge cases around queue persistence
  - Service worker integration tests missing
- **Risk:** Offline users experience data loss or silent failures
- **Priority:** HIGH - core feature

### Error Boundary Scenarios
- **What's not tested:**
  - Error boundaries catching React errors correctly
  - Nested error boundary fallback cascade
  - Global error handler for unhandled rejections
  - Component recovery after error
- **Files:**
  - `domains/shared/components/ErrorBoundary.tsx`
  - `domains/shared/components/GlobalErrorHandler.tsx`
  - No dedicated error boundary test suite
- **Risk:** Users stuck on error screens; can't recover
- **Priority:** MEDIUM - affects UX

### Performance Mode Edge Cases
- **What's not tested:**
  - Rendering 500+ item setlists with performance constraints
  - Rapid song switching (>1 per second)
  - Memory recovery after performance mode exit
  - Pinch zoom on tablet performance
- **Files:**
  - `components/optimized-performance-mode.tsx` - No stress tests
  - `components/performance-mode/optimized-content-display.tsx` - No load tests
- **Risk:** Performance mode becomes unusable at scale
- **Priority:** MEDIUM - violates use case requirement (<100ms response)

---

## Code Quality Issues

### Inconsistent Error Handling
- **Problem:** Mix of error handling patterns: generic messages, detailed logging, silent failures
- **Files:**
  - API routes use `createServerErrorResponse()` for generic errors
  - Hooks use `console.error()` for local debugging
  - Services throw detailed errors to API layer
  - No consistent error classification (user error vs system error vs network error)
- **Impact:** Inconsistent user feedback; difficult to debug failures
- **Fix approach:**
  1. Create AppError class with type (ValidationError, AuthError, NetworkError, etc.)
  2. Standardize error serialization to API
  3. Update all error handling to use class

### Unused/Dead Code
- **Files with duplicate implementations:**
  - `lib/content-service.ts` and `lib/content-service-refactored.ts` - similar functionality, unclear which is used
  - `lib/setlist-service-refactored.ts` - parallel to main service
  - `components/performance-mode/optimized-performance-controls.tsx` vs `hooks/use-performance-controls.ts` - overlapping logic
- **Impact:** Maintenance confusion; bug fixes applied to wrong file
- **Fix approach:** Audit which versions are actually imported; delete dead code; consolidate implementations

### Missing Input Sanitization in Some Paths
- **Files:** `lib/input-sanitizer.ts` - 547 lines of sanitization logic exists but not consistently applied
- **Impact:** While Zod validates structure, XSS risks remain if sanitizer not called everywhere
- **Fix approach:** Audit all user input usage; ensure sanitizer called before rendering

---

## Summary of Priorities

**CRITICAL (Blocking production):**
1. Fix authentication flow gaps (TEST_STATUS_REPORT identifies security tests skipped)
2. Add offline conflict resolution for data consistency
3. Replace in-memory rate limiting with distributed approach

**HIGH (Before major traffic):**
1. Reduce component size violations (8 components >300 lines)
2. Implement comprehensive offline scenario tests
3. Fix console logging leak of sensitive data

**MEDIUM (Next sprint):**
1. Complete skipped test suite (145 tests)
2. Achieve 85% coverage target (currently ~35%)
3. Extract duplicate service implementations

**LOW (Ongoing improvement):**
1. Eliminate `any` type usage (649 occurrences)
2. Consolidate performance monitoring utilities
3. Document timeout/interval cleanup patterns

---

*Concerns audit: 2026-02-23*
