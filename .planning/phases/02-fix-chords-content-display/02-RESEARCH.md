# Phase 2: Fix Chords Content Display - Research

**Researched:** 2026-02-24
**Domain:** React component integration, data flow debugging, performance mode rendering
**Confidence:** HIGH

## Summary

Phase 1 diagnostics successfully isolated the root cause of the Chords display bug: **duplicate rendering caused by integration layer data flow issues**, NOT missing content. Unit tests prove that both `useContentRenderer` hook and `ContentDisplay` component work correctly in isolation - the hook returns proper `renderType: 'chords'` with sections array, and the component renders sections when given proper data. However, the integration test reveals sections are rendering TWICE, suggesting data is being passed or transformed incorrectly in the parent component (`performance-mode.tsx`).

The bug manifests as duplicate chord section elements in the DOM. The investigation revealed:
1. Hook correctly identifies Chords content and returns sections array
2. Component correctly renders sections array when provided
3. Integration produces duplicate renders - likely from data flow between `use-content-caching.ts` → `performance-mode.tsx` → `useContentRenderer` → `ContentDisplay`

**Primary recommendation:** Fix data flow in `performance-mode.tsx` lines 36-93 where `songs` array is constructed from `selectedContent` or `selectedSetlist`, ensuring `content_data.sections` is properly extracted without duplication.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Next.js 15 requires React 18+ for concurrent features |
| Next.js | 15.2.8 | Full-stack framework | App Router, server components, optimized for production |
| TypeScript | 5.x | Type safety | Strict typing prevents data structure mismatches |
| Vitest | latest | Unit testing | Fast, ESM-native, Jest-compatible API |
| @testing-library/react | 16.3.0 | Component testing | Industry standard for React testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| IndexedDB | Native | Offline caching | Content storage for performance mode |
| React.memo | React 18 | Performance optimization | Prevent unnecessary re-renders in performance mode |
| useMemo | React 18 | Memoization | Expensive computations like data transformations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Vitest is faster and ESM-native, better for modern Next.js |
| React.memo | useCallback/useMemo | memo prevents component re-render, callbacks only memoize functions |

**Installation:**
```bash
# All dependencies already installed in project
pnpm install  # No new packages required for Phase 2
```

## Architecture Patterns

### Recommended Project Structure
Current structure is appropriate for this fix:
```
components/
├── performance-mode.tsx              # Parent orchestrator - FIX NEEDED HERE
├── performance-mode/
│   ├── content-display.tsx          # Renderer component - WORKING
│   └── header-controls.tsx          # Controls - not affected
hooks/
├── use-content-renderer.ts          # Content type logic - WORKING
├── use-content-caching.ts           # Data extraction - INVESTIGATE
└── use-performance-navigation.ts    # Navigation - not affected
__tests__/
├── performance-mode/
│   ├── bug-reproduction-helpers.ts  # Mock data factory
│   └── chords-display-bug.test.tsx  # Integration test (2/3 failing)
├── hooks/__tests__/
│   └── use-content-renderer.test.ts # Hook unit test (5/5 passing)
└── components/__tests__/
    └── content-display.test.tsx     # Component unit test (7/7 passing)
```

### Pattern 1: React Data Flow Debugging (Progressive Isolation)
**What:** Test from integration → hook → component to isolate where data breaks
**When to use:** When unit tests pass but integration tests fail
**Example:**
```typescript
// Phase 1 revealed this pattern works:
// 1. Integration test: FAILS - duplicate rendering
// 2. Hook unit test: PASSES - returns correct sections array
// 3. Component unit test: PASSES - renders sections correctly
// Conclusion: Bug is in integration layer, not hook or component
```

### Pattern 2: Data Transformation Validation
**What:** Verify data structure at each transformation point in the flow
**When to use:** When Supabase schema → component props involves multiple transformations
**Example:**
```typescript
// Data flow chain to validate:
// 1. Supabase Content.content_data.sections (database)
//    ↓
// 2. selectedContent prop (PerformanceMode input)
//    ↓
// 3. songs array construction (lines 36-88 in performance-mode.tsx)
//    ↓
// 4. use-content-caching chordsData extraction (lines 53-59)
//    ↓
// 5. useContentRenderer chordsData prop
//    ↓
// 6. ContentDisplay renderInfo.chordsData
//
// Each step must preserve sections array structure WITHOUT duplication
```

### Pattern 3: React.memo Pitfall Avoidance
**What:** ContentDisplay uses React.memo - ensure props are stable references
**When to use:** Any component wrapped in React.memo
**Example:**
```typescript
// Source: components/performance-mode/content-display.tsx line 14
export const ContentDisplay = memo(function ContentDisplay({
  renderInfo,
  currentSongData,
  currentSong,
  zoom
}: ContentDisplayProps) {
  // Component implementation
})

// CRITICAL: renderInfo must be memoized in parent or memo defeats purpose
// useContentRenderer already uses useMemo (line 37 in use-content-renderer.ts)
// This is correct - memo will only re-render when props actually change
```

### Anti-Patterns to Avoid
- **Mutating shared state:** Don't modify `content_data` object directly - always create new objects
- **Inline object creation in JSX:** Creates new reference every render, breaks React.memo
- **Conditional hook calls:** All hooks must be called in same order every render
- **Type coercion without validation:** Use TypeScript guards, not `as any` casts

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data structure validation | Custom if/else checks | TypeScript type guards + Zod schemas | Type safety prevents runtime errors, Zod validates external data |
| Test data factories | Inline object literals | Helper functions (bug-reproduction-helpers.ts) | Reusability, matches production schema exactly |
| Component re-render optimization | Manual shouldComponentUpdate | React.memo + useMemo | React's built-in optimizations are faster and bug-free |
| State synchronization | Custom event emitters | React Context or prop drilling | React's reconciliation handles updates automatically |

**Key insight:** React's built-in memoization and rendering optimizations are highly tuned. Custom solutions often introduce bugs (like duplicate renders) that React's built-in features prevent.

## Common Pitfalls

### Pitfall 1: Duplicate Data in Array Transformations
**What goes wrong:** When constructing the `songs` array in `performance-mode.tsx` (lines 36-88), sections array might be duplicated if both `selectedContent.content_data.sections` and the map function extract sections
**Why it happens:** Complex data extraction logic with nested ternaries and type guards can process the same data twice
**How to avoid:** Add console.log or debugger at each transformation step to verify data structure. Use TypeScript discriminated unions to ensure only one code path executes.
**Warning signs:**
- Test fails with "Found multiple elements with the text"
- DOM shows duplicate `<div>` elements with same content
- Same data appears twice in React DevTools component props

### Pitfall 2: React.memo False Optimization
**What goes wrong:** If parent component creates new object references for props on every render, React.memo doesn't prevent re-renders
**Why it happens:** Inline object creation `{sections: [...]}` creates new reference even if data identical
**How to avoid:** Use `useMemo` for object/array props passed to memoized components. Verify in React DevTools Profiler that memo is working.
**Warning signs:**
- Component re-renders even when props appear unchanged
- Profiler shows "render (memo didn't prevent)"
- Performance issues in performance mode (ironic!)

### Pitfall 3: Type Assertion Hiding Bugs
**What goes wrong:** Using `as any` or `as Type` bypasses TypeScript validation, allowing wrong data structures to pass through
**Why it happens:** Complex nested types (Content.content_data) are hard to type correctly, tempting to use assertions
**How to avoid:** Use type guards (`if ('sections' in data && Array.isArray(data.sections))`), never `as any`
**Warning signs:**
- Tests pass locally but fail in CI
- Runtime errors "Cannot read property 'map' of undefined"
- Data structure differs from TypeScript definition

### Pitfall 4: Supabase JSON Column Type Ambiguity
**What goes wrong:** `content_data` is stored as JSONB in Supabase - TypeScript sees it as `any` or `Json` type, losing sections array type info
**Why it happens:** Database stores JSON as unstructured data, TypeScript can't infer structure
**How to avoid:** Create explicit TypeScript interfaces for `content_data` variants (LyricsData, ChordsData, SheetData). Use type guards to narrow types.
**Warning signs:**
- Need to use `as any` to access `content_data.sections`
- TypeScript doesn't autocomplete section properties
- Runtime errors accessing nested properties

### Pitfall 5: useMemo Dependency Array Mistakes
**What goes wrong:** If `chordsData` is memoized but dependencies are wrong, stale data persists across song changes
**Why it happens:** Dependency array missing `currentSong` or `songs` reference
**How to avoid:** React ESLint plugin warns about missing dependencies - NEVER ignore these warnings in performance-critical code
**Warning signs:**
- Switching songs doesn't update displayed chords
- Must navigate away and back to see updates
- useEffect runs too often or not at all

## Code Examples

Verified patterns from codebase analysis:

### Data Extraction Pattern (CURRENT - May Contain Bug)
```typescript
// Source: components/performance-mode.tsx lines 36-88
const songs: SongData[] = useMemo(() => {
  if (selectedSetlist?.setlist_songs) {
    return selectedSetlist.setlist_songs.map(s => ({
      id: s.content.id,
      title: s.content.title,
      artist: s.content.artist,
      // ... other fields
      content_data: s.content.content_data ? {
        lyrics: typeof s.content.content_data === 'object' && 'lyrics' in s.content.content_data
          ? s.content.content_data.lyrics as string
          : undefined,
        chords: typeof s.content.content_data === 'object' && 'chords' in s.content.content_data
          ? s.content.content_data.chords
          : undefined,
        sections: typeof s.content.content_data === 'object' && 'sections' in s.content.content_data
          ? s.content.content_data.sections
          : undefined
      } : null
    }))
  }
  // ... similar for selectedContent
}, [selectedSetlist, selectedContent])

// ISSUE: This extracts sections correctly, but downstream may duplicate
```

### Chords Data Extraction (CURRENT - Verify No Duplication)
```typescript
// Source: hooks/use-content-caching.ts lines 52-59
const chordsData = useMemo(() =>
  songs.map((song: any) => ({
    chords: song?.content_data?.chords || null,
    sections: song?.content_data?.sections || null
  })),
  [songs]
)

// NOTE: This extracts sections from songs array
// If songs array already has sections, this is correct
// But if sections appear twice in songs, duplication propagates
```

### Hook Logic (VERIFIED CORRECT)
```typescript
// Source: hooks/use-content-renderer.ts lines 99-125
if (normalizedContentType === ContentType.CHORDS || normalizedContentType === ContentType.TAB) {
  const chordInfo = chordsData[currentSong]

  // Check for sections format (from ChordEditor)
  if (chordInfo?.sections && Array.isArray(chordInfo.sections) && chordInfo.sections.length > 0) {
    return {
      renderType: 'chords',
      chordsData: chordInfo.sections,  // Passes sections array
      hasContent: true,
      // ...
    }
  }

  // Check for simple chords string format
  if (chordInfo?.chords && typeof chordInfo.chords === 'string' && chordInfo.chords.trim()) {
    return {
      renderType: 'chords',
      chordsData: chordInfo.chords,  // Passes string
      hasContent: true,
      // ...
    }
  }
}

// Unit tests confirm: Hook returns correct data structure
```

### Component Rendering (VERIFIED CORRECT)
```typescript
// Source: components/performance-mode/content-display.tsx lines 65-96
{renderInfo.renderType === 'chords' && (
  <div className="space-y-6">
    {/* Section-based format from ChordEditor */}
    {Array.isArray(renderInfo.chordsData) ? (
      renderInfo.chordsData.map((section: any, index: number) => (
        <div key={section.id || index} className="space-y-3">
          {section.name && section.name !== 'Content' && (
            <h3 className="text-xl font-bold text-purple-600">
              {section.name}
            </h3>
          )}
          {section.chords && (
            <div className="text-purple-700 font-semibold text-lg">
              {section.chords}
            </div>
          )}
          {section.lyrics && (
            <MusicText text={section.lyrics} className="text-lg leading-relaxed font-mono" />
          )}
        </div>
      ))
    ) : (
      /* Simple string format */
      <MusicText text={renderInfo.chordsData as string} className="text-lg leading-relaxed font-mono" />
    )}
  </div>
)}

// Unit tests confirm: Component renders sections correctly without duplication
```

### Debugging Pattern for Data Flow Issues
```typescript
// Add at each transformation point to trace data:

// 1. In performance-mode.tsx after songs construction
console.log('Songs array:', songs.map(s => ({
  id: s.id,
  sections_count: s.content_data?.sections?.length,
  has_sections: !!s.content_data?.sections
})))

// 2. In use-content-caching.ts after chordsData extraction
console.log('Chords data:', chordsData.map((cd, i) => ({
  index: i,
  sections_count: cd.sections?.length,
  has_chords: !!cd.chords
})))

// 3. In use-content-renderer.ts before return
console.log('Render info:', {
  renderType: result.renderType,
  sections_count: Array.isArray(result.chordsData) ? result.chordsData.length : 'not array'
})

// Look for: sections_count appearing larger than expected at any step
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class components with componentDidUpdate | Functional components with useEffect | React 16.8 (2019) | Hooks enable better code organization and testing |
| Prop drilling for all state | Context API + hooks | React 16.3+ | Reduces boilerplate but can hide data flow |
| Manual shouldComponentUpdate | React.memo + useMemo | React 16.6+ | Better performance with less code |
| Jest for testing | Vitest for modern apps | 2021+ | Faster tests, better ESM support |

**Deprecated/outdated:**
- `componentWillReceiveProps`: Replaced by `useEffect` with dependencies
- `findDOMNode`: Use refs instead for DOM access
- String refs: Use `useRef` hook or callback refs

## Open Questions

1. **Why is duplication happening in integration but not unit tests?**
   - What we know: Unit tests pass with single sections array, integration shows duplicate DOM elements
   - What's unclear: Exact transformation point where duplication occurs
   - Recommendation: Add logging at each step of data flow chain (songs → chordsData → renderInfo → component)

2. **Is React.memo causing unexpected re-renders?**
   - What we know: ContentDisplay uses React.memo, parent passes renderInfo from useMemo hook
   - What's unclear: Whether memo is preventing re-renders or if props are unstable references
   - Recommendation: Use React DevTools Profiler to verify memo effectiveness

3. **Could IndexedDB cache be duplicating data?**
   - What we know: use-content-caching extracts sections from songs array
   - What's unclear: Whether cached data has sections duplicated before extraction
   - Recommendation: Verify cache structure with IndexedDB inspector in DevTools

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 (latest) |
| Config file | vitest.config.mts |
| Quick run command | `pnpm test __tests__/performance-mode/chords-display-bug.test.tsx --run` |
| Full suite command | `pnpm test:all` |
| Estimated runtime | ~3 seconds for bug reproduction test, ~40 seconds for full suite |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | Chords sections render without duplication | integration | `pnpm test __tests__/performance-mode/chords-display-bug.test.tsx --run` | ✅ yes |
| BUG-01 | Hook returns single sections array | unit | `pnpm test hooks/__tests__/use-content-renderer.test.ts --run` | ✅ yes |
| BUG-01 | Component renders sections once | unit | `pnpm test components/__tests__/content-display.test.tsx --run` | ✅ yes |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task → run: `pnpm test __tests__/performance-mode/chords-display-bug.test.tsx --run`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** All 3 integration tests pass (currently 2/3 fail) before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~3 seconds

### Wave 0 Gaps (must be created before implementation)
None — existing test infrastructure covers all phase requirements. Tests are already written and failing, ready for TDD workflow.

## Sources

### Primary (HIGH confidence)
- Codebase analysis - hooks/use-content-renderer.ts (lines 99-125)
- Codebase analysis - components/performance-mode/content-display.tsx (lines 65-96)
- Codebase analysis - components/performance-mode.tsx (lines 36-93)
- Codebase analysis - hooks/use-content-caching.ts (lines 52-59)
- Test execution - Phase 1 diagnostic tests (5/5 hook unit tests pass, 7/7 component unit tests pass, 2/3 integration tests fail)

### Secondary (MEDIUM confidence)
- CLAUDE.md - Project architecture patterns (lines 145-202, component size limits, testing requirements)
- Phase 1 SUMMARY files - Root cause analysis from diagnostic tests
- Vitest documentation - Test execution and React Testing Library patterns

### Tertiary (LOW confidence)
- None - all findings verified through codebase analysis and test execution

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json, versions confirmed
- Architecture: HIGH - Codebase analysis shows exact data flow, test results confirm isolation
- Pitfalls: HIGH - Based on actual test failures and React.memo patterns in codebase

**Research date:** 2026-02-24
**Valid until:** 2026-03-26 (30 days - React/Next.js patterns are stable)

---

## Research Notes

**Key Discovery:** The bug is NOT "missing chord chart" but "DUPLICATE chord chart rendering". Integration test error shows two identical `<div class="text-purple-700 font-semibold text-lg">C F G Am</div>` elements in the DOM.

**Data Flow Investigation Priority:**
1. ✅ Hook unit test: Returns single sections array correctly
2. ✅ Component unit test: Renders sections once correctly
3. ❌ Integration test: Shows duplicate rendering - BUG IS HERE
4. 🔍 Next: Investigate `performance-mode.tsx` data transformation (lines 36-93)
5. 🔍 Next: Verify `use-content-caching.ts` doesn't duplicate (lines 52-59)

**TDD Success:** Progressive isolation pattern successfully narrowed bug location from "somewhere in performance mode" to "integration layer between performance-mode.tsx and hooks".
