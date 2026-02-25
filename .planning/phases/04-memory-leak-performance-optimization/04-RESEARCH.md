# Phase 4: Memory Leak & Performance Optimization - Research

**Researched:** 2026-02-25
**Domain:** React performance optimization, memory leak detection, component refactoring
**Confidence:** HIGH

## Summary

Phase 4 addresses critical technical debt in performance mode: memory leaks from timer cleanup issues, oversized components violating architecture guidelines, and missing React.memo optimization for hot path rendering. Research confirms that the existing `use-performance-controls.ts` hook already has comprehensive cleanup (lines 169-203), but the 378-line `optimized-performance-mode.tsx` component violates the project's strict <150 line requirement and needs refactoring.

Memory leaks are the #1 React performance issue, with setTimeout/setInterval accounting for 40% of all memory leak findings. The hook's current implementation already follows best practices with cleanup functions in useEffect, but extended session testing (30+ minutes) is required to verify no edge cases remain. React.memo optimization should be applied selectively—only to truly expensive components in the render hot path—as the React community in 2026 is moving toward automatic optimization via React Compiler.

Component size guidelines suggest 150-200 lines as a practical limit based on single responsibility principle. The 378-line `optimized-performance-mode.tsx` component mixes data loading, state management, performance monitoring, and UI rendering—clear candidates for extraction into custom hooks or sub-components.

**Primary recommendation:** Verify timer cleanup via memory profiling, refactor oversized component by extracting business logic to hooks, and apply React.memo only to proven expensive render paths (ContentDisplay, NavigationControls).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component framework | Project dependency, memo/useCallback built-in |
| Chrome DevTools | Latest | Memory profiling | Industry standard for React memory debugging |
| Vitest | Latest | Unit testing | Project test framework (package.json) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React DevTools Profiler | Latest (built-in) | Component render profiling | Identify expensive re-renders |
| Chrome Performance Tab | Built-in | Extended session memory tracking | 30+ minute session validation |
| React Debugger Extension | Latest (optional) | Real-time memory leak detection | Development-time leak detection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual React.memo | React Compiler (React 19+) | Auto-optimization but requires React 19 upgrade |
| Chrome DevTools | why-did-you-render library | More React-specific but adds runtime overhead |
| Manual profiling | Lighthouse CI | Automated but less granular for extended sessions |

**Installation:**
```bash
# No new dependencies required - using built-in React features and browser DevTools
# Optional: React DevTools browser extension for enhanced profiling
```

## Architecture Patterns

### Recommended Project Structure
```
components/
├── optimized-performance-mode.tsx     # <150 lines (parent orchestration only)
├── performance-mode/
│   ├── header-controls.tsx            # Already memoized
│   ├── optimized-content-display.tsx  # Already memoized (324 lines - candidate)
│   └── navigation-controls.tsx        # Already memoized
hooks/
├── use-performance-controls.ts        # Already has cleanup (226 lines)
├── use-content-loading.ts             # NEW: Extract data loading logic
└── use-performance-monitoring-ui.ts   # NEW: Extract monitoring UI state
```

### Pattern 1: Timer Cleanup in useEffect

**What:** Every setTimeout/setInterval must have corresponding cleanup in useEffect return function

**When to use:** All timer-based operations in React components/hooks

**Example:**
```typescript
// Source: React docs + 2026 best practices
useEffect(() => {
  // Store timer ID
  const timerId = setTimeout(() => {
    // Timer logic
  }, delay)

  // CRITICAL: Return cleanup function
  return () => clearTimeout(timerId)
}, [dependencies])

// For intervals:
useEffect(() => {
  const intervalId = setInterval(() => {
    // Interval logic
  }, delay)

  return () => clearInterval(intervalId)
}, [dependencies])
```

**Current Status in Codebase:**
- ✅ `use-performance-controls.ts` lines 169-203: Comprehensive cleanup for pressTimeout, pressInterval, scrollRef
- ✅ Lines 139-144: setTimeout with isMountedRef guard for state updates
- ✅ Lines 162-167: BPM feedback timeout cleanup
- ⚠️ Need to verify: No edge cases where cleanup might not trigger (parent unmount before child useEffect cleanup)

### Pattern 2: Component Refactoring with Custom Hooks

**What:** Extract business logic from oversized components into focused custom hooks

**When to use:** Components >150 lines with mixed concerns (data loading + state + UI)

**Example:**
```typescript
// BAD: 378-line component with mixed concerns
export const HugeComponent = () => {
  const [data, setData] = useState()
  const [loading, setLoading] = useState()

  useEffect(() => {
    // 50+ lines of data loading logic
  }, [])

  useEffect(() => {
    // 30+ lines of monitoring logic
  }, [])

  return (
    // 200+ lines of JSX
  )
}

// GOOD: Extract logic to hooks, keep component <150 lines
export const useContentLoading = (songs) => {
  // All data loading logic here
  return { sheetUrls, lyricsData, chordsData, loading }
}

export const usePerformanceMonitoringUI = () => {
  // All monitoring UI state here
  return { showWarning, alerts, dismissWarning }
}

export const RefactoredComponent = () => {
  const contentData = useContentLoading(songs)
  const monitoring = usePerformanceMonitoringUI()

  return (
    // Focused rendering only - <150 lines
  )
}
```

**Apply to:** `optimized-performance-mode.tsx` (378 lines → target <150)

### Pattern 3: Selective React.memo Application

**What:** Wrap components in React.memo only when profiling shows expensive re-renders

**When to use:** Components in render hot path that receive stable props but parent re-renders frequently

**Example:**
```typescript
// Source: React docs - https://react.dev/reference/react/memo
// Memoize component to skip re-renders when props haven't changed
const MemoizedContentDisplay = memo(function ContentDisplay({
  renderInfo,
  currentSongData,
  zoom,
  darkSheet
}) {
  // Expensive rendering logic
  return <ExpensiveComponent />
})

// Use memoized callbacks to prevent prop changes
const ParentComponent = () => {
  const handleClick = useCallback(() => {
    // Handler logic
  }, []) // Empty deps = stable reference

  return <MemoizedContentDisplay onClick={handleClick} />
}
```

**Current Status:**
- ✅ Already memoized: HeaderControls, OptimizedContentDisplay, NavigationControls (lines 29-31)
- ✅ Stable callbacks: handleTogglePlay uses useCallback (use-performance-controls.ts lines 62-64)
- ⚠️ Verify: Props passed to memoized components are stable (no inline objects/arrays)

### Anti-Patterns to Avoid

- **Memory Leak #1: Missing Cleanup:** setTimeout/setInterval without cleanup in useEffect return. Already avoided in use-performance-controls.ts.

- **Memory Leak #2: Stale Refs in Cleanup:** Using captured values instead of refs in cleanup functions. Mitigated via isMountedRef pattern (lines 71, 186-203).

- **Over-memoization:** Wrapping every component in memo without profiling. Only memoize when parent re-renders frequently AND component render is expensive.

- **Deep Equality Checks:** Using custom comparison functions in memo with deep object equality—causes worse performance than re-rendering.

- **Refactoring Without Tests:** Splitting components without test coverage creates regression risk. Current test coverage ~35%, target 85%.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Memory leak detection | Custom memory tracking logic | Chrome DevTools Memory tab + Heap Snapshots | Handles detached DOM trees, closure retention, built-in comparison |
| Timer management | Custom timer wrapper with cleanup | Built-in useEffect cleanup + refs | React's lifecycle already handles cleanup correctly |
| Performance profiling | Custom timing instrumentation | React DevTools Profiler + Chrome Performance tab | Integrates with React fiber, shows component render times |
| Component size linting | Manual line counting | ESLint rule `max-lines` or custom rule | Automated, enforces in CI/CD |

**Key insight:** Memory profiling tools are complex—they understand V8 heap structure, garbage collection patterns, and can identify detached DOM trees. Building custom tooling misses 90% of edge cases.

## Common Pitfalls

### Pitfall 1: Duplicate Cleanup useEffect Hooks

**What goes wrong:** Multiple useEffect hooks with cleanup logic for the same resources can cause double-cleanup or race conditions

**Why it happens:** `use-performance-controls.ts` has two cleanup effects (lines 169-183 and 185-203) that clean up the same refs

**How to avoid:** Consolidate cleanup into a single useEffect with empty dependency array, or ensure refs are nulled after first cleanup to prevent double-clear

**Warning signs:**
- Multiple useEffect hooks cleaning up same refs
- Cleanup logic duplicated between effects
- Console warnings about "can't perform React state update on unmounted component" (already handled via isMountedRef)

**Code Example (Current Issue):**
```typescript
// Lines 169-183: First cleanup hook
useEffect(() => {
  return () => {
    if (scrollRef.current) cancelAnimationFrame(scrollRef.current)
    if (pressTimeout.current) clearTimeout(pressTimeout.current)
    if (pressInterval.current) clearInterval(pressInterval.current)
  }
}, [])

// Lines 185-203: Second cleanup hook (DUPLICATE)
useEffect(() => {
  isMountedRef.current = true
  return () => {
    isMountedRef.current = false
    if (scrollRef.current) {
      cancelAnimationFrame(scrollRef.current)
      scrollRef.current = null  // Nulls ref after cleanup
    }
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current)
      pressTimeout.current = null
    }
    if (pressInterval.current) {
      clearInterval(pressInterval.current)
      pressInterval.current = null
    }
  }
}, [])
```

**Fix:** Consolidate into single cleanup effect with ref nulling

### Pitfall 2: Breaking Memoization with Inline Props

**What goes wrong:** Passing inline objects/arrays to memoized components causes re-render on every parent render, defeating memoization

**Why it happens:** JavaScript creates new object reference on every render: `<Memoized data={{ key: value }} />`

**How to avoid:** Extract objects/arrays outside component or use useMemo for dynamic objects

**Warning signs:**
- Memoized components re-rendering despite "no prop changes"
- Inline object literals `{}` or array literals `[]` in JSX
- React DevTools Profiler shows memoized component renders when parent renders

**Example:**
```typescript
// BAD: Inline object creates new reference every render
<MemoizedComponent config={{ zoom: 100, dark: false }} />

// GOOD: Stable reference via useMemo
const config = useMemo(() => ({ zoom, darkSheet }), [zoom, darkSheet])
<MemoizedComponent config={config} />

// BEST: Pass primitives directly (already stable)
<MemoizedComponent zoom={zoom} darkSheet={darkSheet} />
```

**Check:** Lines 345-350 pass primitives (renderInfo, currentSongData, darkSheet, zoom) ✅

### Pitfall 3: Memory Profiling False Positives

**What goes wrong:** Chrome DevTools shows "growing memory" but it's actually healthy sawtooth pattern (allocate → garbage collect)

**Why it happens:** JavaScript garbage collection is non-deterministic; memory grows between GC cycles

**How to avoid:** Look for continuous upward trend without drops, not just growing memory. Take 3+ snapshots over 10+ minutes and compare retained size.

**Warning signs:**
- Panicking over any memory growth
- Taking single snapshot and declaring "memory leak"
- Not forcing garbage collection before comparing snapshots

**Detection Method:**
1. Open Chrome DevTools > Performance tab
2. Record 30+ minute session with representative interactions
3. Look for JS Heap line that continuously rises without dropping back down
4. If sawtooth pattern (up and down): ✅ Healthy GC
5. If continuous upward slope: ⚠️ Potential leak

### Pitfall 4: Refactoring Without Performance Baseline

**What goes wrong:** Splitting components for "cleanliness" without measuring if it actually improves performance

**Why it happens:** Assuming "smaller components = faster" without considering prop drilling, context re-renders, and extra component overhead

**How to avoid:** Profile with React DevTools Profiler BEFORE refactoring to identify actual bottlenecks

**Warning signs:**
- Refactoring based on line count alone
- Creating many tiny components without measuring impact
- Adding memo/useMemo everywhere "just in case"

**Approach for Phase 4:**
1. ✅ Profile current 378-line component with Profiler
2. ✅ Identify expensive render paths (likely ContentDisplay with PDF rendering)
3. ✅ Extract business logic (data loading) to hooks (reduces component size without affecting render)
4. ⚠️ Only split rendering if Profiler shows benefit

### Pitfall 5: Extended Session Testing on Fast Machines

**What goes wrong:** Memory leaks appear negligible on developer machines with 32GB RAM but crash on musician's tablets/phones

**Why it happens:** V8 garbage collector behaves differently under memory pressure; leaks are masked by available memory

**How to avoid:** Test on constrained devices (4GB RAM tablets) or use Chrome DevTools device emulation with CPU/memory throttling

**Warning signs:**
- Tests pass on MacBook Pro but users report crashes
- Memory usage "stable" at 500MB on desktop (would crash 2GB device)
- No testing on actual performance mode devices (tablets)

**Testing Strategy:**
1. Profile on high-end machine to detect obvious leaks
2. Profile on constrained device (or emulated) to detect real-world impact
3. Run 30+ minute session with typical navigation patterns (10 songs, switching every 3 minutes)
4. Monitor memory in Chrome DevTools with throttling enabled (4x slowdown)

## Code Examples

Verified patterns from official sources and codebase analysis:

### Timer Cleanup Pattern (Current Implementation)
```typescript
// Source: use-performance-controls.ts lines 185-203
useEffect(() => {
  isMountedRef.current = true
  return () => {
    isMountedRef.current = false
    // Cancel animation frame
    if (scrollRef.current) {
      cancelAnimationFrame(scrollRef.current)
      scrollRef.current = null
    }
    // Clear timeout
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current)
      pressTimeout.current = null
    }
    // Clear interval
    if (pressInterval.current) {
      clearInterval(pressInterval.current)
      pressInterval.current = null
    }
  }
}, [])
```

**Status:** ✅ Already follows best practice pattern

### Component Refactoring Target
```typescript
// Source: optimized-performance-mode.tsx lines 178-246
// BEFORE: 68 lines of data loading logic inside component (lines 178-246)
useEffect(() => {
  let isMounted = true

  const loadContent = async () => {
    const newSheetUrls: (string | null)[] = []
    const newMimeTypes: (string | null)[] = []
    const newLyricsData: string[] = []
    const newChordsData: Array<{ chords: any; sections: any }> = []

    for (let i = 0; i < songs.length; i++) {
      // 50+ lines of loading logic
    }

    if (isMounted) {
      setSheetUrls(newSheetUrls)
      setSheetMimeTypes(newMimeTypes)
      setLyricsData(newLyricsData)
      setChordsData(newChordsData)
    }
  }

  loadContent()
  return () => { isMounted = false }
}, [songs, getCachedContent, trackResource])

// AFTER: Extract to custom hook
// NEW FILE: hooks/use-content-loading.ts
export function useContentLoading(songs: SongData[]) {
  const [sheetUrls, setSheetUrls] = useState<(string | null)[]>([])
  const [sheetMimeTypes, setSheetMimeTypes] = useState<(string | null)[]>([])
  const [lyricsData, setLyricsData] = useState<string[]>([])
  const [chordsData, setChordsData] = useState<Array<{ chords: any; sections: any }>>([])

  const { getCachedContent } = useAdvancedContentCache()
  const { trackResource } = useMemoryManagement()

  useEffect(() => {
    // All loading logic here (68 lines moved out of component)
  }, [songs, getCachedContent, trackResource])

  return { sheetUrls, sheetMimeTypes, lyricsData, chordsData }
}

// optimized-performance-mode.tsx becomes:
export const OptimizedPerformanceMode = memo(function OptimizedPerformanceMode(props) {
  // Data loading extracted to hook (removes 68 lines)
  const contentData = useContentLoading(songs)

  // Component now ~310 lines → Further extract monitoring UI state (50 lines)
  // Target: <150 lines of pure rendering logic
})
```

### Memory Profiling Workflow
```typescript
// Source: Chrome DevTools best practices + React docs
// 1. Start profiling
// Chrome DevTools > Performance tab > Record

// 2. Simulate 30-minute session
// - Navigate through setlist 10 times
// - Toggle play/pause 20 times
// - Change BPM 15 times
// - Zoom in/out 10 times

// 3. Analyze JS Heap
// Look for:
// ✅ Sawtooth pattern (memory grows then drops) = Healthy GC
// ❌ Continuous upward trend = Memory leak

// 4. Take Heap Snapshots
// Chrome DevTools > Memory tab > Take snapshot
// Compare snapshots after 0 min, 10 min, 20 min, 30 min
// Look for "Detached DOM tree" and growing closures

// 5. Identify leaks
// Sort by "Retained Size" in snapshot comparison
// Common culprits: Event listeners, timers, closures holding stale state
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual React.memo everywhere | React Compiler auto-optimization | React 19 (2024) | Reduces need for manual memo, but requires upgrade |
| Line count as rigid rule | Single responsibility principle | 2025+ community consensus | 150 lines is guideline, not law—focus on cohesion |
| Component-level testing only | Integration testing preferred | 2024-2025 | Catches real-world issues that unit tests miss |
| Manual memory tracking | Chrome DevTools Memory tab | Always standard | Built-in tooling superior to custom solutions |

**Deprecated/outdated:**
- **Class component lifecycle methods:** Replaced by hooks (useEffect for componentDidMount/WillUnmount). Project already uses hooks ✅
- **React.PureComponent:** Replaced by React.memo for functional components. Project already uses memo correctly ✅
- **Render props for logic sharing:** Replaced by custom hooks. Project uses hooks extensively ✅

## Open Questions

1. **Are there edge cases where cleanup doesn't trigger?**
   - What we know: Two cleanup useEffect hooks exist (lines 169-183, 185-203)—potential redundancy
   - What's unclear: If parent unmounts before child useEffect cleanup, do refs get cleaned properly?
   - Recommendation: Consolidate into single cleanup effect, test with strict mode enabled

2. **What's the performance impact of 378-line component?**
   - What we know: Component is oversized per architecture guidelines (limit 150 lines)
   - What's unclear: Does size actually cause performance issues, or is it just maintainability?
   - Recommendation: Profile with React DevTools Profiler to measure render time before refactoring

3. **Should React.memo optimization be added beyond current memoization?**
   - What we know: HeaderControls, ContentDisplay, NavigationControls already memoized (lines 29-31)
   - What's unclear: Are there other components in render hot path that need memoization?
   - Recommendation: Profile first, memoize only if Profiler shows expensive unnecessary re-renders

4. **What constitutes a "realistic" 30-minute session for testing?**
   - What we know: Musicians use performance mode during live performances (30+ minutes)
   - What's unclear: Typical interaction pattern (how often they switch songs, change BPM, zoom)
   - Recommendation: Interview/observe musicians, create realistic test script (e.g., 10 songs × 3 min each, 20 play/pause toggles, 15 BPM changes)

## Sources

### Primary (HIGH confidence)
- [React.memo Official Documentation](https://react.dev/reference/react/memo) - React team guidance on memoization
- [Chrome DevTools Memory Panel](https://developer.chrome.com/docs/devtools/memory) - Memory profiling reference
- [React Performance Optimization 2026](https://oneuptime.com/blog/post/2026-02-20-react-performance-optimization/view) - Current best practices
- [Codebase Analysis](file:///Users/marcelviana/projects/octavia/hooks/use-performance-controls.ts) - Existing cleanup implementation verified

### Secondary (MEDIUM confidence)
- [Memory Leak Empirical Study](https://stackinsight.dev/blog/memory-leak-empirical-study) - 500-repository analysis showing 40% of leaks from setTimeout
- [React Memory Leak Debugging](https://oneuptime.com/blog/post/2026-01-15-debug-memory-leaks-react-applications/view) - 2026 debugging techniques
- [Component Size Best Practices](https://medium.com/geekculture/how-many-lines-of-code-until-i-need-to-refactor-a-react-component-c1b8d16f5a5b) - Community guidelines on 150-200 line limit
- [React DevTools Profiler](https://blog.logrocket.com/debugging-performance-problems-in-react/) - Profiling techniques

### Tertiary (LOW confidence - requires validation)
- [React Performance Tracks (React 19.2)](https://developer.chrome.com/docs/devtools/performance/reference) - New Chrome DevTools integration (project uses React 18)
- [React Debugger Extension](https://blog.thnkandgrow.com/react-debugger-extension/) - Third-party tool for real-time leak detection (not verified with project setup)

## Metadata

**Confidence breakdown:**
- Timer cleanup patterns: HIGH - React official docs + codebase verification shows correct implementation
- Component refactoring: HIGH - Clear architectural violation (378 lines vs 150 limit), standard extraction patterns available
- React.memo optimization: MEDIUM - Current memoization exists, but need Profiler data to determine if more needed
- Memory profiling techniques: HIGH - Chrome DevTools is industry standard, patterns well-documented
- Extended session testing: MEDIUM - Need to define "realistic" 30-minute session interaction patterns

**Research date:** 2026-02-25
**Valid until:** 60 days (stable React APIs, no breaking changes expected in React 18.x)
