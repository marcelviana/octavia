# Octavia - Music Performance App

## What This Is

Octavia is a web-based music performance app for musicians to manage and display lyrics, chords, tabs, and sheet music during live performances. It provides an offline-first architecture with IndexedDB caching, ensuring content is instantly available even without network connectivity. The app features a full-screen performance mode optimized for live use, with setlist management for organizing songs.

## Core Value

Performance mode must work reliably during live performances. Musicians depend on instant, accurate display of their music content when performing—any lag, missing content, or broken features during a performance is unacceptable.

## Requirements

### Validated

<!-- Existing capabilities inferred from codebase -->

- ✓ User authentication with Firebase (email/password, session management) — existing
- ✓ Content management for multiple types (Lyrics, Chords, Tabs, Piano, Drums) — existing
- ✓ File upload to Firebase Storage with security validation — existing
- ✓ Setlist creation and management for organizing songs — existing
- ✓ Library with search and filtering capabilities — existing
- ✓ Performance mode with full-screen display — existing
- ✓ Offline support via IndexedDB caching (50MB LRU cache) — existing
- ✓ Content preloading for instant access during performances — existing
- ✓ Server-side authentication with Firebase Admin SDK — existing
- ✓ Supabase database with service role for secure operations — existing

<!-- Milestone v1.0 achievements (2026-02-25) -->

- ✓ Chords content displays complete chord chart in performance mode — v1.0
- ✓ Auto-scroll play button triggers scrolling when clicked — v1.0
- ✓ Performance mode optimized for 30+ minute sessions (no memory leaks) — v1.0
- ✓ Component architecture compliant (<150 lines per CLAUDE.md) — v1.0
- ✓ Performance navigation under 100ms (avg 10.91ms) — v1.0

### Active

<!-- No active requirements - ready for next milestone -->

### Out of Scope

- New features or enhancements — Focusing exclusively on bug fixes for performance mode
- Other content types display issues — Only Chords is affected; Lyrics, Tabs, Piano, Drums display correctly
- Library or content viewer issues — These work correctly; bugs are isolated to performance mode
- Authentication or database changes — Core infrastructure is working as expected

## Context

**Technical Environment:**
- Next.js 15 App Router with React 18
- Firebase Authentication (client) + Firebase Admin SDK (server-side token verification)
- Supabase PostgreSQL database with service role client
- TypeScript 5.x with strict mode enabled
- Tailwind CSS + Radix UI components (shadcn/ui)
- IndexedDB via localforage for offline caching
- Service Worker for offline functionality

**Performance Mode Context:**
- Mission-critical feature used during live music performances
- Must respond in <100ms for song navigation
- Content cached in IndexedDB for instant access
- Full-screen interface with touch controls
- Auto-scroll feature for hands-free performance

**Performance Mode Status (v1.0):**
- ✅ Memory leaks resolved (consolidated cleanup with ref nulling)
- ✅ Component size compliant (149 lines, within 150 limit)
- ✅ React.memo optimizations applied and preserved

**Testing:**
- Current coverage: ~35% (target: 85%)
- Vitest for unit/integration tests
- Playwright for E2E tests
- 145 skipped tests need attention

**User Experience:**
- Musicians use performance mode during live shows
- Bugs in performance mode directly impact live performances
- Offline reliability is critical (venues often have poor connectivity)

## Constraints

- **Performance**: <100ms response time for song navigation during performances (non-negotiable)
- **Architecture**: Components must be <150 lines including imports (per CLAUDE.md)
- **Security**: All API routes must use `requireAuthServer()` for authentication
- **Testing**: Minimum 85% test coverage target for all new code
- **Error Handling**: Generic error messages to clients, detailed logging server-side only
- **TypeScript**: No `any` types allowed; full type safety required
- **Offline Support**: All performance mode features must work without network

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus on performance mode bugs only (2026-02-23) | Performance mode is mission-critical; stability takes priority over new features | ✅ v1.0 Complete - Both bugs fixed |
| Fix Chords display first, then auto-scroll (2026-02-23) | Display bugs are more critical than UX enhancements | ✅ v1.0 Complete - Sequential fixes successful |
| Use TDD approach with failing tests first (2026-02-24) | Progressive isolation debugging best practice for React bugs | ✅ v1.0 - Tests guided all fixes |
| Stable React keys for component identity (2026-02-24) | Prevent duplicate mounting during re-renders | ✅ v1.0 - Chords display fixed |
| useCallback with functional state updates (2026-02-24) | Eliminate stale closures in React.memo components | ✅ v1.0 - Auto-scroll button fixed |
| Hook composition for business logic extraction (2026-02-25) | Achieve <150 line component compliance | ✅ v1.0 - 5 hooks created, 149 lines achieved |
| Consolidate cleanup with ref nulling (2026-02-25) | Prevent memory leaks during extended sessions | ✅ v1.0 - 0 pending timers after unmount |

## Milestones Completed

### v1.0 - Performance Mode Bug Fixes (2026-02-25)
**Duration:** 3 days | **Phases:** 4 | **Plans:** 8 | **Commits:** 40

Fixed critical performance mode bugs and optimized for extended live music sessions:
- Fixed Chords content display (stable React keys)
- Fixed auto-scroll play button (useCallback pattern)
- Eliminated memory leaks (consolidated cleanup)
- Achieved component architecture compliance (149 lines)
- Performance: avg 10.91ms navigation (target <100ms)

**See:** `.planning/milestones/v1.0-ROADMAP.md` for complete details

---
*Last updated: 2026-02-25 after v1.0 milestone completion*
