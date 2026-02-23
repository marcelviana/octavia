# External Integrations

**Analysis Date:** 2026-02-23

## APIs & External Services

**Content Proxy:**
- Proxy endpoint at `/api/proxy` - Routes requests to external content sources
  - Allowed hosts configured via `ALLOWED_PROXY_HOSTS` env var (comma-separated)
  - Default hosts: demo.supabase.co, imslp.org, uploads.musescore.com
  - Used for: Downloading sheet music, lyrics, and chord charts from external sources
  - Implementation: `app/api/proxy/route.ts`

## Data Storage

**Primary Database:**
- Supabase (PostgreSQL)
  - Client: `@supabase/supabase-js` (latest)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service role: `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - Tables: `content`, `profiles`, and schema in `types/supabase.ts`
  - Operations: Secured via API routes with Firebase authentication

**File Storage:**
- Supabase Storage
  - Bucket name: Configured via `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (default: `content-files`)
  - Public URLs: Support direct access to cached content
  - Proxy: Files can be accessed via `/api/proxy` endpoint when not directly public
  - Max file size: 50MB enforced at upload
  - Upload endpoint: `/api/storage/upload`
  - Delete endpoint: `/api/storage/delete`

**Offline Caching:**
- IndexedDB via localforage
  - Storage: `lib/offline-cache.ts`
  - Capacity: 50MB LRU cache per user
  - Implementation: `localforage` 1.10.0 with `lru-cache` 11.1.0
  - Caching scope: User-specific and anonymous content
  - Auto-cleanup: LRU eviction when quota exceeded

## Authentication & Identity

**Primary Auth Provider:**
- Firebase Authentication
  - Client SDK: `firebase` 11.9.1
  - Implementation: `lib/firebase.ts` and `lib/firebase-server-utils.ts`
  - Auth methods: Email/password via Firebase console
  - Token type: JWT (ID token)
  - Token verification endpoint: `/api/auth/verify`
  - Session management: Firebase session cookies + Bearer tokens

**Server-Side Token Verification:**
- Firebase Admin SDK 13.4.0
  - Only loaded in Node.js runtime (webpack externalized for client)
  - Verification: Direct token verification via `verifyFirebaseToken()`
  - Caching: Token cache with 1-hour TTL to reduce verification calls
  - Blacklist support: Token blacklisting for immediate revocation
  - Implementation: `lib/firebase-admin.ts`

**API Authentication Patterns:**
- Bearer token in Authorization header: `Authorization: Bearer <token>`
- Session cookie fallback: `firebase-session` cookie for cookie-based auth
- Validation: Via `requireAuthServer()` utility in all protected routes
- Rate limiting: Applied to auth endpoints (20 req/min for token verify)

## Monitoring & Observability

**Error Tracking:**
- None configured - errors logged locally via custom logger

**Logs:**
- Console-based logging via `lib/logger.ts`
- Security events via `lib/security-logger.ts`
- No external logging service (Sentry, LogRocket, etc.)

**Performance:**
- Metrics: Offline cache hit rate tracked in `lib/offline-cache.ts`
- No external APM service configured

## CI/CD & Deployment

**Hosting:**
- Not specified - Next.js compatible (Vercel, AWS, etc.)

**CI Pipeline:**
- GitHub Actions (assumed based on repository structure)
- No explicit CI config file found - typical Next.js defaults

**Pre-commit Hooks:**
- No pre-commit hooks configured

## Environment Configuration

**Required env vars for local development:**

```
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Server (Admin SDK)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=content-files
SUPABASE_SERVICE_ROLE_KEY=

# Application
NEXTAUTH_URL=http://localhost:3000

# Proxy configuration
ALLOWED_PROXY_HOSTS=demo.supabase.co,imslp.org,uploads.musescore.com

# Testing
FIREBASE_TEST_USER_TOKEN=
FIREBASE_TEST_USER_EMAIL=
```

**Secrets location:**
- `.env.local` - Local secrets (not committed)
- `.env.test` - Test-specific environment vars
- `.env.example` - Template for required variables
- GitHub Secrets - For CI/CD deployments (not shown)

## Webhooks & Callbacks

**Incoming:**
- None configured - Content updates triggered by user actions via API calls

**Outgoing:**
- None configured - No external webhook destinations

## Content Types Supported

The application manages multiple musical content formats:
- Lyrics - Text-based lyrics content
- Chords - Chord charts for instruments
- Tabs - Guitar/instrument tablature
- Piano - Piano sheet notation
- Drums - Drum patterns and notation

Content storage: Metadata in Supabase, files in Supabase Storage

## File Upload Security

**Validation Pipeline:**
1. Authentication check via `requireAuthServerSecure()`
2. MIME type validation - File extension vs Content-Type matching
3. Filename sanitization - Remove special characters
4. File size check - Max 50MB
5. Content type restrictions - PDF, TXT, DOCX, PNG, JPG only
6. Schema validation via Zod (`storageSchemas.upload`)

**Implementation:** `app/api/storage/upload/route.ts`

## Rate Limiting

**Endpoints:**
- `/api/auth/verify` - 20 requests/minute
- General endpoints - Configured via `RATE_LIMIT_CONFIGS` in `lib/rate-limiter.ts`

**Implementation:** `lib/rate-limiter.ts` and middleware application

## Performance Optimization

**Bundle Splitting:**
- Performance mode bundle - Live performance interface
- Management features bundle - Library and setlist management
- Offline cache bundle - Shared IndexedDB functionality
- Configuration: `next.config.mjs` webpack cache groups

**Content Delivery:**
- Next.js Image optimization enabled with WebP/AVIF formats
- 30-day cache TTL for optimized images
- Allowed image hosts: Supabase + `ALLOWED_PROXY_HOSTS`

---

*Integration audit: 2026-02-23*
