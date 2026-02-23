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

### Active

<!-- Current scope: fixing performance mode bugs -->

- [ ] Fix Chords content display in performance mode (currently only shows title/band, chord chart is missing)
- [ ] Fix auto-scroll play button functionality (button does not respond to clicks)

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

**Known Performance Mode Issues:**
- Memory leaks during extended sessions (>30 mins) from setTimeout/setInterval cleanup
- Oversized components (378 lines) violate <150 line architecture requirement
- Missing React.memo optimization for hot path rendering

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
| Focus on performance mode bugs only | Performance mode is mission-critical; stability takes priority over new features | — Pending |
| Fix Chords display first, then auto-scroll | Display bugs are more critical than UX enhancements | — Pending |

---
*Last updated: 2026-02-23 after project initialization*
