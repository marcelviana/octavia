# Roadmap: Performance Mode Bug Fixes

**Project**: Octavia - Music Performance App
**Goal**: Fix critical performance mode bugs affecting live music performances
**Scope**: Two targeted bug fixes (Chords display, Auto-scroll button)

---

## Milestone 1: Performance Mode Bug Fixes (v1.0)

**Success Criteria**:
- Chords content displays complete chord chart in performance mode (not just title/band)
- Auto-scroll play button triggers scrolling when clicked
- No regressions in other content types (Lyrics, Tabs, Piano, Drums)
- All fixes covered by tests (85% coverage minimum)
- Performance remains <100ms for song navigation

---

### Phase 1: Diagnostic & Test Foundation

**Goal**: Set up debugging environment and create failing tests that reproduce both bugs

**Plans:** 3/3 plans executed ✓ Complete

Plans:
- [x] 01-01-PLAN.md — Create failing test for Chords display bug with test helpers ✓ Completed
- [x] 01-02-PLAN.md — Create failing test for auto-scroll button bug ✓ Completed
- [x] 01-03-PLAN.md — Create unit tests isolating root cause (hook vs component) ✓ Completed

**Deliverables**:
- Failing test for Chords display bug (reproduces missing chord chart)
- Failing test for auto-scroll button bug (reproduces no-click-response)
- Root cause identification using progressive isolation debugging
- Component state/props snapshots documenting the bugs

**Success Criteria**:
- [x] Tests fail reliably, reproducing the exact bug symptoms
- [x] Root causes identified and documented
- [x] Data flow traced from cache → hooks → components
- [x] No other content types affected by test setup

**Requirements Addressed**:
- Sets foundation for TDD approach to both bugs

---

### Phase 2: Fix Chords Content Display

**Goal**: Fix duplicate rendering of Chords content sections by correcting data flow integration layer

**Plans:** 1/1 plans complete ✓ Complete

Plans:
- [x] 02-01-PLAN.md — Debug and fix chords sections duplication in integration layer ✓ Completed

**Deliverables**:
- Data flow debugging to identify exact duplication point
- Fix in performance-mode.tsx or use-content-caching.ts (integration layer)
- Clean sections extraction without duplication
- Regression verification for all content types

**Success Criteria**:
- [x] Chords content displays full chord chart in performance mode
- [x] Each section (Verse 1, Chorus, etc.) renders exactly once
- [x] Chord progressions display correctly without duplication
- [x] Other content types (Lyrics, Tabs, Piano, Drums) unaffected
- [x] Integration tests pass (3/3)
- [x] Unit tests remain passing (12/12)
- [x] Performance remains <100ms

**Requirements Addressed**:
- BUG-01: Fix Chords content display in performance mode

**Known Risks**:
- Breaking other content types (Pitfall #2 from research)
- Introducing "0" rendering bug (Pitfall #1)
- Data structure mismatch between cache and component

---

### Phase 3: Fix Auto-scroll Play Button

**Goal**: Make auto-scroll play button respond to clicks and trigger scrolling

**Plans:** 1/1 plans complete ✓ Complete

Plans:
- [x] 03-01-PLAN.md — Fix stale closure with useCallback and stable callback pattern ✓ Completed

**Deliverables**:
- Wrap setIsPlaying in useCallback with functional state update
- Update HeaderControls to use stable onTogglePlay callback prop
- Remove inline arrow function from button onClick handler
- Test for stale closure scenario passes

**Success Criteria**:
- [x] Play button responds to clicks
- [x] Auto-scroll activates when play button clicked
- [x] Auto-scroll can be paused/stopped
- [x] Test from Phase 1 now passes (stale closure test)
- [x] No inline event handlers in HeaderControls
- [x] Performance remains <100ms

**Requirements Addressed**:
- Fix auto-scroll play button functionality (button does not respond to clicks)

**Known Risks**:
- React.memo stale closures blocking updates (Pitfall #3)
- Inline handlers causing performance regression (Pitfall #4)
- Z-index or CSS blocking click events

---

### Phase 4: Memory Leak & Performance Optimization

**Goal**: Address known memory leaks and optimize performance mode for extended sessions

**Plans:** 1/3 plans complete 🔄 In Progress

Plans:
- [x] 04-01-PLAN.md — Consolidate duplicate cleanup hooks and verify timer cleanup ✓ Completed
- [ ] 04-02-PLAN.md — Refactor oversized component by extracting business logic to hooks
- [ ] 04-03-PLAN.md — Add React.memo optimizations for hot path rendering

**Deliverables**:
- Fix setTimeout/setInterval cleanup in `use-performance-controls.ts`
- Consolidate duplicate cleanup useEffect hooks (lines 169-203)
- Memory leak detection tests for 30+ minute sessions
- Extract data loading logic to `useContentLoading` hook (~68 lines)
- Extract monitoring UI state to `usePerformanceMonitoringUI` hook (~30 lines)
- Verify component size <150 lines (`optimized-performance-mode.tsx` currently 378 lines)

**Success Criteria**:
- [x] No memory leaks during 30+ minute sessions ✓ Plan 01
- [x] All setInterval/setTimeout have cleanup in useEffect ✓ Plan 01
- [ ] Components under 150 lines
- [ ] React.memo optimization preserved (already applied)
- [ ] Performance remains <100ms even after extended use

**Requirements Addressed**:
- PERF-01: Eliminate memory leaks from timer cleanup issues
- PERF-02: Comply with <150 line component architecture requirement
- Addresses known issues from CONCERNS.md
- Ensures long-term stability for live performances

**Known Risks**:
- React.memo blocking updates (must verify event handlers still work)
- Refactoring large components without tests (Pitfall #6)
- Breaking existing performance optimizations

---

## Phase Dependencies

```
Phase 1 (Diagnostics)
    ↓
Phase 2 (Chords Fix) ──┐
    ↓                   │
Phase 3 (Auto-scroll) ──┤
    ↓                   │
Phase 4 (Optimization) ←┘
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 (sequential)

**Rationale**:
- Phase 1 must complete first (need failing tests and root cause analysis)
- Phase 2 before Phase 3 (display bugs more critical than UX features per Key Decisions)
- Phase 4 last (optimization only after fixes verified working)

---

## Out of Scope

❌ **Not included in this milestone**:
- New features or enhancements
- Fixes for other content types (only Chords affected)
- Library or content viewer issues (work correctly)
- Authentication or database changes
- Service worker or caching changes (unless directly related to bugs)
- UI/UX improvements beyond bug fixes

---

## Success Metrics

**Before**:
- ❌ Chords content missing chord chart in performance mode
- ❌ Auto-scroll play button non-responsive
- ⚠️ Memory leaks after 30+ minutes
- ⚠️ Components oversized (378 lines)

**After**:
- ✅ Chords content displays complete chord chart
- ✅ Auto-scroll play button works on click
- ✅ No memory leaks during extended sessions (04-01 complete)
- ⏳ All components <150 lines (04-02 in progress)
- ✅ Test coverage ≥85% for all changes
- ✅ Performance <100ms maintained

---

*Roadmap created: 2026-02-24*
*Roadmap updated: 2026-02-25 (Phase 4 Plan 01 complete)*
*Estimated phases: 4*
*Estimated duration: Based on complexity, not time*
