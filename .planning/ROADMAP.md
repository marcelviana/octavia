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

**Plans:** 2/3 plans executed

Plans:
- [x] 01-01-PLAN.md — Create failing test for Chords display bug with test helpers ✓ Completed
- [x] 01-02-PLAN.md — Create failing test for auto-scroll button bug ✓ Completed
- [ ] 01-03-PLAN.md — Create unit tests isolating root cause (hook vs component)

**Deliverables**:
- Failing test for Chords display bug (reproduces missing chord chart)
- Failing test for auto-scroll button bug (reproduces no-click-response)
- Root cause identification using progressive isolation debugging
- Component state/props snapshots documenting the bugs

**Success Criteria**:
- [ ] Tests fail reliably, reproducing the exact bug symptoms
- [ ] Root causes identified and documented
- [ ] Data flow traced from cache → hooks → components
- [ ] No other content types affected by test setup

**Requirements Addressed**:
- Sets foundation for TDD approach to both bugs

---

### Phase 2: Fix Chords Content Display

**Goal**: Fix Chords content type to display complete chord chart in performance mode

**Deliverables**:
- Fix conditional rendering logic in `use-content-renderer.ts` (likely lines 99-125)
- Handle data structure mismatches between database format and component expectations
- Verify IndexedDB cache → performance mode data flow
- Regression tests for all content types (Lyrics, Chords, Tabs, Piano, Drums)

**Success Criteria**:
- [ ] Chords content displays full chord chart in performance mode
- [ ] Title and band/artist still display correctly
- [ ] Other content types (Lyrics, Tabs, Piano, Drums) unaffected
- [ ] Test from Phase 1 now passes
- [ ] No conditional rendering "0" bug introduced
- [ ] Performance remains <100ms

**Requirements Addressed**:
- Fix Chords content display in performance mode (currently only shows title/band, chord chart is missing)

**Known Risks**:
- Breaking other content types (Pitfall #2 from research)
- Introducing "0" rendering bug (Pitfall #1)
- Data structure mismatch between cache and component

---

### Phase 3: Fix Auto-scroll Play Button

**Goal**: Make auto-scroll play button respond to clicks and trigger scrolling

**Deliverables**:
- Fix event handler binding in performance mode controls
- Address React.memo stale closure issues if present
- Add useCallback wrapping for event handlers
- Integration test for auto-scroll functionality

**Success Criteria**:
- [ ] Play button responds to clicks
- [ ] Auto-scroll activates when play button clicked
- [ ] Auto-scroll can be paused/stopped
- [ ] Test from Phase 1 now passes
- [ ] No inline event handlers introduced
- [ ] Performance remains <100ms

**Requirements Addressed**:
- Fix auto-scroll play button functionality (button does not respond to clicks)

**Known Risks**:
- React.memo stale closures blocking updates (Pitfall #3)
- Inline handlers causing performance regression (Pitfall #4)
- Z-index or CSS blocking click events

---

### Phase 4: Memory Leak & Performance Optimization

**Goal**: Address known memory leaks and optimize performance mode for extended sessions

**Deliverables**:
- Fix setTimeout/setInterval cleanup in `use-performance-controls.ts`
- Add React.memo optimization for hot path components
- Verify component size <150 lines (refactor `optimized-performance-mode.tsx` if needed)
- Memory profiling during extended sessions (30+ minutes)

**Success Criteria**:
- [ ] No memory leaks during 30+ minute sessions
- [ ] All setInterval/setTimeout have cleanup in useEffect
- [ ] Components under 150 lines
- [ ] React.memo applied to performance-critical components
- [ ] Performance remains <100ms even after extended use

**Requirements Addressed**:
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
- ✅ No memory leaks during extended sessions
- ✅ All components <150 lines
- ✅ Test coverage ≥85% for all changes
- ✅ Performance <100ms maintained

---

*Roadmap created: 2026-02-24*
*Roadmap updated: 2026-02-24 (Phase 1 planned)*
*Estimated phases: 4*
*Estimated duration: Based on complexity, not time*
