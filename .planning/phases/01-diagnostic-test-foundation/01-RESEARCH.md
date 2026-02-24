# Phase 1: Diagnostic & Test Foundation - Research

**Researched:** 2026-02-24
**Domain:** Test-Driven Debugging (TDD) for React Performance Mode Bugs
**Confidence:** HIGH

## Summary

Phase 1 focuses on creating failing tests that reliably reproduce two critical performance mode bugs: (1) Chords content displaying only title/band without chord chart, and (2) auto-scroll play button not responding to clicks. This research investigates best practices for diagnostic testing in React applications, specifically for reproducing rendering bugs and event handler issues in a Vitest + React Testing Library environment.

The codebase already has robust test infrastructure (Vitest + React Testing Library + Playwright) with global mocks for Firebase/Supabase, comprehensive test-setup.ts, and existing performance mode tests. The primary challenge is creating tests that precisely isolate these bugs without false positives from unrelated system issues.

**Primary recommendation:** Use progressive isolation debugging - start with integration tests that reproduce the full user journey, then create unit tests that isolate the exact failing components/hooks. Leverage existing test infrastructure and mock patterns from src/test-setup.ts.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | latest | Unit/integration test runner | Fast, native ESM support, industry standard for modern React |
| @testing-library/react | 16.3.0 | React component testing | De facto standard for React testing, follows best practices |
| @testing-library/user-event | 14.6.1 | User interaction simulation | Realistic user event simulation vs fireEvent |
| @testing-library/jest-dom | 6.6.3 | DOM matchers | Semantic assertions for better test readability |
| happy-dom | latest | DOM environment | Faster than jsdom, used in vitest.config.mts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MSW (Mock Service Worker) | 2.0.0 | API mocking | Already installed - use for API route testing |
| @vitest/ui | latest | Visual test runner | Debugging failing tests interactively |
| @vitest/coverage-istanbul | 4.0.16 | Coverage reporting | Verify diagnostic tests cover bug surface area |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| happy-dom | jsdom | jsdom more complete but slower - happy-dom sufficient for this phase |
| @testing-library/user-event | fireEvent | fireEvent faster but less realistic - userEvent better for click bugs |
| Vitest | Jest | Jest slower - Vitest already configured and working |

**Installation:**
```bash
# All dependencies already installed per package.json
pnpm test        # Run unit tests
pnpm test:watch  # Watch mode for TDD
pnpm test:ui     # Visual debugging
```

## Architecture Patterns

### Recommended Test Structure
```
__tests__/
├── performance-mode/
│   ├── chords-display-bug.test.tsx        # Failing test for Bug #1
│   ├── auto-scroll-button-bug.test.tsx    # Failing test for Bug #2
│   └── bug-reproduction-helpers.ts        # Shared test utilities
hooks/__tests__/
├── use-content-renderer.test.ts           # Unit test for renderer hook
└── use-performance-controls.test.ts       # Unit test for controls hook
```

### Pattern 1: Progressive Isolation Debugging
**What:** Start with integration test reproducing full bug, then isolate to unit tests
**When to use:** When root cause unclear - iterate from broad to narrow
**Example:**
```typescript
// Step 1: Integration test - reproduce user-visible bug
describe('Bug Reproduction: Chords Display', () => {
  it('should display full chord chart in performance mode', () => {
    // Setup: Render full PerformanceMode with Chords content
    const chordsContent = createMockChordsContent()
    const { getByText, queryByText } = render(
      <PerformanceMode selectedContent={chordsContent} />
    )

    // Assert: Title displays (currently working)
    expect(getByText('Test Song')).toBeInTheDocument()

    // Assert: Chord chart displays (currently FAILING)
    expect(getByText(/Verse 1:/)).toBeInTheDocument()
    expect(getByText(/C.*F.*G/)).toBeInTheDocument()
  })
})

// Step 2: Hook unit test - isolate rendering logic
describe('useContentRenderer', () => {
  it('should return chords renderType for Chords content', () => {
    const { result } = renderHook(() => useContentRenderer({
      currentSongData: { content_type: 'Chords', ... },
      chordsData: [{ sections: [...] }],
      ...
    }))

    expect(result.current.renderType).toBe('chords')
    expect(result.current.chordsData).toBeDefined()
  })
})

// Step 3: Component unit test - verify rendering behavior
describe('ContentDisplay', () => {
  it('should render sections array for chords renderType', () => {
    const renderInfo = {
      renderType: 'chords',
      chordsData: [{ name: 'Verse 1', chords: 'C F G' }]
    }

    render(<ContentDisplay renderInfo={renderInfo} ... />)
    expect(screen.getByText('Verse 1')).toBeInTheDocument()
  })
})
```

### Pattern 2: State Snapshot Debugging
**What:** Capture component state/props at moment of bug to document expected vs actual
**When to use:** For rendering bugs where data transforms incorrectly
**Example:**
```typescript
// Source: Testing Library docs + React DevTools pattern
it('should snapshot state when chord chart missing', () => {
  const { container, debug } = render(
    <PerformanceMode selectedContent={chordsContent} />
  )

  // Capture actual DOM state
  debug() // Prints current DOM to console

  // Snapshot what we see vs what we expect
  const actualContent = container.textContent
  expect(actualContent).toContain('Test Song') // Title present
  expect(actualContent).not.toContain('Verse 1') // FAILING: Chart missing

  // Document expected data flow
  console.log('Expected: chordsData → sections array → ContentDisplay')
  console.log('Actual:', { /* log actual props/state */ })
})
```

### Pattern 3: Event Handler Isolation Testing
**What:** Test click handlers in isolation from full component tree
**When to use:** For event bugs where handler may not be bound correctly
**Example:**
```typescript
// Source: React Testing Library best practices
describe('Auto-scroll Play Button Bug', () => {
  it('should call setIsPlaying when button clicked', async () => {
    const setIsPlaying = vi.fn()

    render(
      <HeaderControls
        isPlaying={false}
        setIsPlaying={setIsPlaying}
        {...otherProps}
      />
    )

    const playButton = screen.getByRole('button', { name: /play/i })
    await userEvent.click(playButton)

    // FAILING: setIsPlaying not called
    expect(setIsPlaying).toHaveBeenCalledWith(true)
  })
})
```

### Anti-Patterns to Avoid
- **Testing implementation details:** Don't test internal state - test user-visible behavior
- **Over-mocking:** Don't mock components under test - only external dependencies
- **Brittle selectors:** Use semantic queries (getByRole, getByLabelText) not getByTestId
- **Not using act():** Wrap state updates in act() to avoid warnings (already handled in test-setup.ts helpers)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mock data factories | Custom content builders | Existing mock patterns in test-setup.ts | Already has mockUser, mockProfile, createMockQueryBuilder |
| Firebase/Supabase mocks | New mock implementations | Global mocks in test-setup.ts | Comprehensive mocks already configured (lines 22-206) |
| Act() wrappers | Custom async helpers | renderWithAct, actUserEvent from test-setup.ts | Already handles act() warnings (lines 249-260) |
| DOM environment setup | Custom window mocks | IntersectionObserver, ResizeObserver, matchMedia mocks | Already mocked globally (lines 295-354) |

**Key insight:** src/test-setup.ts provides 362 lines of battle-tested test infrastructure. Don't recreate - extend it.

## Common Pitfalls

### Pitfall 1: False Positive Tests (Test Passes But Bug Exists)
**What goes wrong:** Test doesn't actually reproduce the bug condition
**Why it happens:** Mock data doesn't match real data structure from database
**How to avoid:**
1. Copy EXACT data structure from browser DevTools/Network tab
2. Verify test fails BEFORE writing fix
3. Check database schema matches mock data shape
**Warning signs:** Test passes immediately without code changes

### Pitfall 2: Flaky Tests from Async State Updates
**What goes wrong:** Test intermittently fails due to timing issues
**Why it happens:** React state updates not wrapped in act(), or missing waitFor()
**How to avoid:**
```typescript
// BAD: No act() wrapper
fireEvent.click(button)
expect(element).toBeInTheDocument() // May fail randomly

// GOOD: Use act() or waitFor()
await userEvent.click(button)
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```
**Warning signs:** "not wrapped in act()" warnings, test fails 1 in 10 runs

### Pitfall 3: Testing Wrong Layer (Unit vs Integration)
**What goes wrong:** Unit test for bug that requires full component tree
**Why it happens:** Assuming bug is in one component when it's in data flow between components
**How to avoid:**
1. Start with integration test (full PerformanceMode)
2. Only unit test if integration test points to specific component
3. Use progressive isolation (Pattern 1)
**Warning signs:** Unit test passes but integration test fails

### Pitfall 4: Mock Overwrites Breaking Global Mocks
**What goes wrong:** Test-specific mock conflicts with global test-setup.ts mocks
**Why it happens:** vi.mock() in test file overwrites hoisted mocks
**How to avoid:**
```typescript
// BAD: Overwrites global mock
vi.mock('@/contexts/firebase-auth-context', () => ({ ... }))

// GOOD: Use exported mockAuthContextValue and modify
import { mockAuthContextValue } from '@/src/test-setup'
beforeEach(() => {
  mockAuthContextValue.user = customUser
})
```
**Warning signs:** "Cannot read property of undefined" in unrelated tests

### Pitfall 5: Not Verifying Test Fails Before Fix
**What goes wrong:** Test is written after fix, so never confirmed it catches bug
**Why it happens:** Skipping TDD discipline - writing test after implementation
**How to avoid:**
1. Write test first
2. Run test, verify it FAILS with expected error
3. Document failure message in test comment
4. Then implement fix
**Warning signs:** Test passes on first run, no git history of failing test

## Code Examples

Verified patterns from codebase and official sources:

### Example 1: Performance Mode Integration Test
```typescript
// Source: tests/performance/performance-mode-responsiveness.test.tsx (lines 195-249)
// Adapted for bug reproduction
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PerformanceMode } from '@/components/performance-mode'

describe('Chords Display Bug Reproduction', () => {
  it('should display complete chord chart for Chords content', async () => {
    const chordsContent = {
      id: 'test-chords-1',
      title: 'Test Song',
      artist: 'Test Artist',
      content_type: 'Chords',
      content_data: {
        sections: [
          { id: '1', name: 'Verse 1', chords: 'C F G Am', lyrics: 'First verse lyrics' },
          { id: '2', name: 'Chorus', chords: 'F C G', lyrics: 'Chorus lyrics' }
        ]
      }
    }

    render(
      <PerformanceMode
        selectedContent={chordsContent}
        onExitPerformance={vi.fn()}
      />
    )

    // Verify title renders (currently working)
    expect(screen.getByText('Test Song')).toBeInTheDocument()

    // Verify chord chart sections render (currently FAILING)
    await waitFor(() => {
      expect(screen.getByText('Verse 1')).toBeInTheDocument()
      expect(screen.getByText(/C F G Am/)).toBeInTheDocument()
      expect(screen.getByText('Chorus')).toBeInTheDocument()
    })
  })
})
```

### Example 2: Hook Unit Test with State Inspection
```typescript
// Source: hooks/__tests__/use-content-caching.test.ts pattern
// Adapted for useContentRenderer testing
import { renderHook } from '@testing-library/react'
import { useContentRenderer } from '@/hooks/use-content-renderer'

describe('useContentRenderer - Chords Rendering', () => {
  it('should return chords renderType for Chords content with sections', () => {
    const chordsData = [{
      sections: [
        { id: '1', name: 'Verse', chords: 'C F G', lyrics: 'Test' }
      ]
    }]

    const { result } = renderHook(() => useContentRenderer({
      currentSong: 0,
      currentSongData: { content_type: 'Chords', title: 'Test' },
      sheetUrls: [null],
      sheetMimeTypes: [null],
      lyricsData: [],
      chordsData
    }))

    // Document expected vs actual
    console.log('Hook result:', result.current)

    expect(result.current.renderType).toBe('chords')
    expect(result.current.hasContent).toBe(true)
    expect(result.current.chordsData).toEqual(chordsData[0].sections)
  })
})
```

### Example 3: Event Handler Testing with userEvent
```typescript
// Source: @testing-library/user-event docs + codebase patterns
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderControls } from '@/components/performance-mode/header-controls'

describe('Auto-scroll Button Bug Reproduction', () => {
  it('should trigger setIsPlaying when play button clicked', async () => {
    const user = userEvent.setup()
    const setIsPlaying = vi.fn()

    render(
      <HeaderControls
        currentSongData={{ title: 'Test', bpm: 80 }}
        isPlaying={false}
        setIsPlaying={setIsPlaying}
        bpm={80}
        onExitPerformance={vi.fn()}
        darkSheet={false}
        setDarkSheet={vi.fn()}
        zoom={100}
        setZoom={vi.fn()}
        bpmFeedback={null}
        startPress={vi.fn()}
        endPress={vi.fn()}
      />
    )

    const playButton = screen.getByRole('button', { name: /play|start/i })

    // Verify button is enabled and visible
    expect(playButton).toBeEnabled()
    expect(playButton).toBeVisible()

    // Click button (currently FAILING - no handler called)
    await user.click(playButton)

    // Verify handler was called
    expect(setIsPlaying).toHaveBeenCalledTimes(1)
    expect(setIsPlaying).toHaveBeenCalledWith(true)
  })
})
```

### Example 4: Data Flow Tracing Test
```typescript
// Source: Progressive isolation debugging pattern
describe('Chords Data Flow Trace', () => {
  it('should trace data from props → hook → component → DOM', () => {
    const testData = {
      sections: [{ id: '1', name: 'Test Section', chords: 'C F G' }]
    }

    // Step 1: Verify hook receives correct data
    const { result: hookResult } = renderHook(() => useContentRenderer({
      currentSongData: { content_type: 'Chords' },
      chordsData: [testData],
      // ... other props
    }))

    console.log('Hook output:', hookResult.current)
    expect(hookResult.current.renderType).toBe('chords')

    // Step 2: Verify component receives hook output
    const { debug } = render(
      <ContentDisplay
        renderInfo={hookResult.current}
        currentSongData={{ content_type: 'Chords' }}
        currentSong={0}
        zoom={100}
      />
    )

    // Step 3: Inspect actual DOM output
    debug() // Prints DOM to console

    // Step 4: Assert expected DOM presence
    expect(screen.getByText('Test Section')).toBeInTheDocument()
    expect(screen.getByText(/C F G/)).toBeInTheDocument()
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + jsdom | Vitest + happy-dom | Vitest 1.0 (2023) | Faster test execution, native ESM |
| fireEvent | userEvent | RTL v13+ (2021) | More realistic user interactions |
| Testing implementation | Testing behavior | RTL philosophy (ongoing) | Tests survive refactoring |
| Manual act() wrapping | Automatic in userEvent | RTL v14+ (2022) | Fewer act() warnings |

**Deprecated/outdated:**
- `@testing-library/react-hooks` (standalone): Merged into `@testing-library/react` v13+ - use `renderHook` from main package
- `cleanup()` manual calls: Auto-cleanup enabled by default in vitest.config.mts (line 358 of test-setup.ts)

## Open Questions

1. **Exact data structure from Supabase for Chords content**
   - What we know: content_data field stores sections array (from performance-mode.tsx lines 46-59)
   - What's unclear: JSON vs JSONB in database, exact field names in production data
   - Recommendation: Inspect live data via Supabase dashboard or browser DevTools Network tab before writing tests

2. **React.memo impact on event handler binding**
   - What we know: ContentDisplay is memoized (content-display.tsx line 14), HeaderControls might be
   - What's unclear: Whether memo is causing stale closures for setIsPlaying
   - Recommendation: Test with and without memo in diagnostic phase

3. **Auto-scroll button selector for testing**
   - What we know: Button exists in HeaderControls component
   - What's unclear: Exact aria-label or role for semantic query
   - Recommendation: Use `screen.logTestingPlaygroundURL()` to find best selector

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 |
| Config file | vitest.config.mts |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test:all` (unit + integration + e2e) |
| Estimated runtime | ~10-30 seconds (unit tests only) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIAG-01 | Chords content displays title only (bug reproduction) | integration | `pnpm test __tests__/performance-mode/chords-display-bug.test.tsx` | ❌ Wave 0 gap |
| DIAG-02 | Auto-scroll button click has no effect (bug reproduction) | integration | `pnpm test __tests__/performance-mode/auto-scroll-button-bug.test.tsx` | ❌ Wave 0 gap |
| DIAG-03 | useContentRenderer returns wrong renderType for Chords | unit | `pnpm test hooks/__tests__/use-content-renderer.test.ts` | ❌ Wave 0 gap |
| DIAG-04 | HeaderControls setIsPlaying handler not bound | unit | `pnpm test components/__tests__/header-controls.test.tsx` | ❌ Wave 0 gap |
| DIAG-05 | Data flow trace from cache → hooks → components → DOM | integration | `pnpm test __tests__/performance-mode/data-flow-trace.test.tsx` | ❌ Wave 0 gap |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task → run: `pnpm test`
- **Full suite trigger:** Before merging final task of Phase 1
- **Phase-complete gate:** All diagnostic tests failing with documented root causes before proceeding to Phase 2
- **Estimated feedback latency per task:** ~15 seconds (unit tests fast, integration tests ~30s)

### Wave 0 Gaps (must be created before implementation)
- [ ] `__tests__/performance-mode/chords-display-bug.test.tsx` — covers DIAG-01 (Bug #1 reproduction)
- [ ] `__tests__/performance-mode/auto-scroll-button-bug.test.tsx` — covers DIAG-02 (Bug #2 reproduction)
- [ ] `__tests__/performance-mode/bug-reproduction-helpers.ts` — shared mock data factories
- [ ] `hooks/__tests__/use-content-renderer.test.ts` — covers DIAG-03 (hook unit test)
- [ ] `components/__tests__/header-controls.test.tsx` — covers DIAG-04 (component unit test)
- [ ] `__tests__/performance-mode/data-flow-trace.test.tsx` — covers DIAG-05 (data flow debugging)

## Sources

### Primary (HIGH confidence)
- Project codebase: vitest.config.mts, src/test-setup.ts - Existing test infrastructure
- Project codebase: tests/performance/performance-mode-responsiveness.test.tsx - Performance test patterns
- Project codebase: hooks/use-content-renderer.ts (lines 99-125) - Likely bug location per ROADMAP.md
- Project codebase: components/performance-mode/content-display.tsx - Rendering logic for Chords
- React Testing Library docs: https://testing-library.com/docs/react-testing-library/intro - Testing best practices

### Secondary (MEDIUM confidence)
- Vitest docs: https://vitest.dev/guide/ - Test framework configuration (verified against project config)
- @testing-library/user-event docs: https://testing-library.com/docs/user-event/intro - Event simulation (verified package version 14.6.1)

### Tertiary (LOW confidence)
- None - all research verified against project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already installed and configured in package.json and vitest.config.mts
- Architecture: HIGH - Patterns verified in existing test files (tests/performance/, hooks/__tests__/)
- Pitfalls: HIGH - Based on React Testing Library best practices + common TDD mistakes observed in codebase

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (30 days - stable testing patterns, unlikely to change)
