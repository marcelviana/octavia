# Technology Stack

**Analysis Date:** 2026-02-23

## Languages

**Primary:**
- TypeScript 5.x - All source code, strict mode enabled with full type safety
- JavaScript (Node.js) - Build scripts and backend runtime
- JSX/TSX - React component syntax throughout

**Secondary:**
- CSS - Tailwind CSS classes for styling
- Markdown - Documentation and content

## Runtime

**Environment:**
- Node.js (latest LTS) - Server runtime, specified in `package.json` with pnpm 10.28.0
- Browser/Client - React 18 with Next.js 15

**Package Manager:**
- pnpm 10.28.0 (strict lockfile)
- Lockfile: `pnpm-lock.yaml` (version 9.0) - present and up-to-date

## Frameworks

**Core:**
- Next.js 15.2.8 - Full-stack React framework with App Router
  - Used for: Pages, API routes, middleware, static generation, image optimization
  - Configuration: `next.config.mjs` with custom webpack config for bundle splitting
  - Service Worker build via custom script `scripts/build-sw.js`

**UI/Rendering:**
- React 18.3.1 - Component library and state management
- Radix UI (extensive suite) - Accessible component primitives
  - Includes: accordion, alert-dialog, checkbox, dialog, dropdown, popover, select, tabs, toast, and 10+ more
- Tailwind CSS 3.4.17 - Utility-first CSS framework
  - Configuration: `tailwind.config.ts` with dark mode support
- shadcn/ui - Pre-built Radix UI components styled with Tailwind

**Form Handling:**
- React Hook Form 7.54.1 - Efficient form state management
- @hookform/resolvers 3.9.1 - Schema validation integration

**State Management:**
- Zustand 5.0.8 - Lightweight state management
- React Context API - Built-in provider pattern usage
- Immer 10.1.3 - Immutable state updates

**Testing:**
- Vitest (latest) - Unit and integration test runner
  - Config: `vitest.config.mts` and `vitest.integration.config.mts`
  - Environment: jsdom
  - Coverage: istanbul provider (not v8)
  - Commands: `test`, `test:watch`, `test:coverage`, `test:integration`
- Playwright 1.54.1 - End-to-end testing
  - Config: `playwright.config.ts`
  - Supports: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
  - Features: Screenshots, videos, traces on failure
- Testing Library (React, DOM, hooks) 16.3.0+
- MSW 2.0.0 - Mock Service Worker for API mocking

**Build/Dev:**
- PostCSS 8.5 - CSS processing pipeline
  - Configuration: `postcss.config.mjs` with Autoprefixer
- Webpack (Next.js internal) - Custom config for:
  - Bundle splitting (performance, management, offline bundles)
  - Firebase-admin externalization
  - PDF.js worker handling
  - Test utilities exclusion from client bundle

**Date/Time:**
- date-fns 4.1.0 - Date manipulation and formatting

**UI Components/Icons:**
- Lucide React 0.454.0 - SVG icon library

**Content Processing:**
- react-pdf 9.2.1 - PDF viewing and rendering
- pdfjs-dist 4.8.69 - PDF.js library for PDF processing
- mammoth 1.9.1 - DOCX to HTML conversion
- isomorphic-dompurify 2.26.0 - HTML sanitization for both client/server

**Performance/Caching:**
- localforage 1.10.0 - IndexedDB wrapper for offline caching
- lru-cache 11.1.0 - LRU cache implementation
- react-resizable-panels 2.1.7 - Resizable UI panels
- next-themes 0.4.4 - Theme management

**CLI/Command Palette:**
- cmdk 1.0.4 - Command menu component

**Utility Libraries:**
- class-variance-authority 0.7.1 - Component variant builder
- clsx 2.1.1 - Conditional className combiner
- tailwind-merge 2.5.5 - Intelligent Tailwind class merging
- tailwindcss-animate 1.0.7 - Animation utilities
- zod 3.24.1 - TypeScript-first schema validation
- debug (latest) - Debugging utility

**Notifications:**
- sonner 1.7.1 - Toast notification library

## External Authentication & Services

**Authentication:**
- Firebase Auth 11.9.1 - Client-side authentication via JWT tokens
  - Provides: Sign up, sign in, session management
  - Token-based architecture with Bearer token validation
- Firebase Admin SDK 13.4.0 - Server-side token verification (Node.js only)
  - Runtime guard: Only loads in Node.js environment
  - Token validation via `/api/auth/verify` endpoint

**Database:**
- Supabase JS SDK (latest) - PostgreSQL database client
  - @supabase/supabase-js (latest) - Client library
  - @supabase/ssr (latest) - Server-side rendering support
  - Service role client for secure server operations
  - Configured via: `lib/supabase.ts` and `lib/supabase-service.ts`

**File Storage:**
- Supabase Storage - Cloud file hosting
  - Firebase Storage 11.9.1 - Alternative/fallback file hosting
  - Bucket: Configured via `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` env var
  - Max file size: 50MB
  - Supported types: PDF, TXT, DOCX, PNG, JPG (with MIME validation)

## Configuration

**Environment:**
- Environment variables configured via `.env.local`
- Variables with `NEXT_PUBLIC_` prefix: Browser-accessible
- Server-only variables: Firebase Admin keys, Supabase service role key
- Test environment: `.env.test` for test-specific configuration

**Required Configuration:**
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config (6 variables)
- `NEXT_PUBLIC_SUPABASE_*` - Supabase client config (2 variables)
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side database access
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` - Firebase Admin SDK
- `NEXTAUTH_URL` - Application URL for auth callbacks
- `ALLOWED_PROXY_HOSTS` - Comma-separated list of allowed proxy hosts

**Build:**
- TypeScript strict mode enabled (`tsconfig.json`)
- Next.js ESLint integration enabled
- TypeScript build errors fail the build
- Custom Webpack config for optimization

## Logging & Monitoring

**Logger:**
- Custom logger in `lib/logger.ts` with console-based output
- Security logger in `lib/security-logger.ts` for auth events

## Platform Requirements

**Development:**
- Node.js (latest LTS)
- pnpm 10.28.0
- TypeScript 5.x
- Modern browser with ES2020+ support

**Production:**
- Deployment target: Next.js compatible hosting (Vercel, AWS Amplify, etc.)
- Edge Runtime support in some API routes
- Node.js runtime required for Firebase token verification
- Browser: Modern browsers with IndexedDB support for offline functionality

---

*Stack analysis: 2026-02-23*
