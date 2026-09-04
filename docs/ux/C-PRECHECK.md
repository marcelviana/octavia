# C-PRECHECK.md — Bloco C (PRD do nativo) · Fase A: inventário estático

> **Data**: 2026-09-04 · Sessão de pre-check do Bloco C, Fase A (medição estática; zero rede, zero escrita em banco, zero commit, zero branch, zero PR). *(Errata na revisão: a primeira gravação trazia "2026-09-01", que é a data do HEAD `9dea9a6`, não da sessão.)* Fase B (probes de leitura em prod) executada na mesma data após aval — §Fase B ao fim.
> **Alvo**: working tree da `main` em `9dea9a6` (limpo — `git status --short | wc -l` → `0` antes desta sessão; após, só `?? docs/ux/C-PRECHECK-anexos/` e este arquivo). `[medido]`
> **Regra de varredura em vigor** (errata do B3, PR #244): toda afirmação `[medido]` carrega comando + saída literal; sem saída, é `[hipótese]`. Saídas longas vivem em `docs/ux/C-PRECHECK-anexos/A1…A8` (wc -l + sha256 no §Anexos) e são referenciadas por caminho.
> **Leitura obrigatória cumprida**: `docs/ux/PLANO-TRANSICAO.md` (1369 linhas), `docs/ux/B6-ENCERRAMENTO.md` (101), `docs/ux/B5-PRECHECK.md` (752), `docs/api/CONTRATO-DE-ERRO.md` (93), `docs/api/SETLISTS.md` (93), `docs/api/STORAGE.md` (101), `supabase/schema.dump.sql` (637) — `wc -l` `[medido]`.

---

## 0. Escopo confirmado por escrito (antes de medir)

**Em minhas palavras**: a Fase A mede, só no repositório, a superfície de backend que a **tela 1 do nativo** (modo performance + setlists, somente leitura) consome: (M1) quem verifica identidade em cada rota de API e se um `Authorization: Bearer <idToken>` sem cookie passa; (M2) os shapes de leitura e o caminho de dados/offline do palco web; (M3) a política efetiva do storage no dump e no código; (M4) as famílias de rate limit; (M5) o preparo dos comandos que a Fase B usará para dimensionar a biblioteca. Proponho a Fase B (probes de leitura em prod, conta de audit) **sem executar**. Preparo C-D1…C-D6 com recomendação fundamentada.

**Fora desta fase**: qualquer rede (prod, preview, Supabase, Firebase, `pnpm test` com rede); qualquer escrita em banco/bucket; commit/branch/PR; desenho do PRD ou de código nativo; execução dos probes; alteração de qualquer arquivo do repo fora de `docs/ux/C-PRECHECK.md` e `docs/ux/C-PRECHECK-anexos/`.

**Discordância de escopo**: nenhuma. Uma **ressalva de premissa** (divergência nº 1 abaixo): o M3 pede as policies de `storage.objects`/`storage.buckets` "no `schema.dump.sql`" — elas **não estão no dump** (o dump é `-s public`); o M3 é respondido por código + referência ao B5, e a prova de runtime fica para a Fase B.

---

## ⚠️ Divergências entre o que o prompt afirma/assume e o que foi encontrado (regra 7)

1. **`schema.dump.sql` NÃO contém `storage.objects` nem `storage.buckets`** — o dump é gerado com `supabase db dump -s public` (`package.json:20`), e o único schema nele é `public`. `[medido]`
   ```
   $ grep -n -i 'storage' supabase/schema.dump.sql; echo "exit=$?"
   exit=1
   $ grep -n -i 'bucket' supabase/schema.dump.sql; echo "exit=$?"
   exit=1
   $ grep -n 'CREATE SCHEMA\|CREATE TABLE' supabase/schema.dump.sql
   15:CREATE SCHEMA IF NOT EXISTS "public";
   29:CREATE TABLE IF NOT EXISTS "public"."setlist_songs" (
   75:CREATE TABLE IF NOT EXISTS "public"."content" (
   349:CREATE TABLE IF NOT EXISTS "public"."annotations" (
   362:CREATE TABLE IF NOT EXISTS "public"."profiles" (
   380:CREATE TABLE IF NOT EXISTS "public"."setlists" (
   $ grep -n 'db:dump\|db:types' package.json
   19:    "db:types": "supabase gen types typescript --project-id mlxjmpbdchmwplcfislt > types/database.types.ts",
   20:    "db:dump": "supabase db dump -s public -f supabase/schema.dump.sql"
   ```
   Consequência: o M3 "no dump" é **inexecutável como pedido**; a flag `public` e as policies do bucket só existem como medição de runtime (B5-PRECHECK §2.1, 2026-08-29: `public: true`) — referência, não medição desta sessão. A Fase B (P4) e/ou um `pg_dump -s storage` (passo do Marcel, fora do `db:dump`) fecham o furo.
2. **O `middleware.ts` existe, mas EXCLUI `/api` por matcher e não verifica nada criptograficamente** — é otimista (forma do cookie, B1.2b) e só redireciona páginas. Nenhuma rota de API passa por ele. `[medido]` (§1.2). O prompt o lista como candidato a "ponto que verifica identidade"; para a API, não é.
3. **Bearer não é "plano A a provar" — é o transporte primário que o PRÓPRIO WEB já usa** para toda chamada de API a partir do browser: `lib/setlist-service.ts` (7 fetches com `Authorization: Bearer ${idToken}`), `lib/content-service.ts` (5), `contexts/firebase-auth-context.tsx` (6) `[medido, §1.2 grep]`. O cookie é usado apenas por (a) server components/páginas (`getServerSideUser`) e (b) fetches de `/api/proxy` sem header (`lib/offline-cache.ts:175`, `lib/advanced-content-cache.ts:310`). A resposta do M1 não é uma previsão: é o caminho que já roda em prod para a web.
4. **Existe uma 15ª rota que nenhum contrato cita: `GET /api/debug/config`** — sem auth, devolve `404` só por `NODE_ENV === 'production'` (`app/api/debug/config/route.ts:7-8`); fora de prod expõe presença/tamanho de env de service role. `[medido, §1.3]` Não bloqueia a tela 1; registro para o inventário (candidato à classe da B1.0).
5. **`docs/api/STORAGE.md` diz "upload: Auth obrigatória (Bearer verificado server-side)"** — a rota aceita bearer OU cookie (`requireAuthServerSecure`, `app/api/storage/upload/route.ts:15`) e exige **email verificado**; o texto do contrato é mais estreito que o código num eixo e omite o outro. `[medido, §1.3]`
6. **`types/setlist.ts:40` declara `event_date` — coluna que não existe no dump** (`setlists` tem `performance_date`, dump:385). O tipo `Setlist` desse arquivo não tem consumidor (`grep event_date` → só a própria linha; o único import do arquivo é de `SetlistSong`/`ContentData`/`FormattedSetlistSong` em `app/api/setlists/[id]/route.ts:9`). Drift morto, não bug vivo. `[medido]`
   ```
   $ grep -rn "event_date" --include='*.ts' --include='*.tsx' app components hooks lib types | grep -v __tests__ | grep -v '\.test\.'
   types/setlist.ts:40:  event_date: string | null
   $ grep -rn "from ['\"]@/types/setlist['\"]" --include='*.ts' --include='*.tsx' app components hooks lib | grep -v __tests__ | grep -v '\.test\.'
   app/api/setlists/[id]/route.ts:9:import type { SetlistSong, ContentData, FormattedSetlistSong } from '@/types/setlist'
   ```
7. **`lib/api-schemas.ts:34` ainda carrega o enum falso `['Lyrics','Chords','Tabs','Piano','Drums']`** (`commonSchemas.contentType`) que o B2 declarou morto — sem consumidor (`grep -rn "commonSchemas.contentType"` → `exit=1`). Órfão, não contrato. `[medido]`
8. **Comentário stale em `scripts/ux-audit/auth.ts:109`** ("POST /api/auth/session tem rate limit AUTH (5 req / 15 min por IP)") — o limite vigente é `session` 120/15min por uid (`lib/user-rate-limit.ts:42`). O código do script (espera de 60s em 429) segue funcional; só o comentário mente. `[medido]`

---

## M1 — Inventário de verificadores de auth

### 1.1 Rotas × métodos `[medido]` — 15 arquivos, 26 handlers

Saída literal (íntegra em `C-PRECHECK-anexos/A1-rotas-metodos.txt`):

```
$ find app/api -name 'route.ts' | sort
app/api/auth/session/route.ts
app/api/content/[id]/route.ts
app/api/content/route.ts
app/api/debug/config/route.ts
app/api/health/route.ts
app/api/profile/route.ts
app/api/proxy/route.ts
app/api/setlists/[id]/route.ts
app/api/setlists/[id]/songs/order/route.ts
app/api/setlists/[id]/songs/route.ts
app/api/setlists/route.ts
app/api/setlists/songs/[songId]/route.ts
app/api/storage/delete/route.ts
app/api/storage/list/route.ts
app/api/storage/upload/route.ts

$ for f in $(find app/api -name route.ts | sort); do echo "== $f"; grep -nE '^export (async )?function (GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)|^export const (GET|POST|PUT|PATCH|DELETE|HEAD)' "$f"; done
== app/api/auth/session/route.ts
82:export const POST = postSessionHandler
115:export const DELETE = deleteSessionHandler
== app/api/content/[id]/route.ts
158:export const GET = wrappedGetHandler
159:export const DELETE = wrappedDeleteHandler
== app/api/content/route.ts
144:export const GET = getContentHandler
220:export const POST = createContentHandler
300:export const PUT = updateContentHandler
342:export const DELETE = deleteContentHandler 
== app/api/debug/config/route.ts
5:export async function GET(request: NextRequest) {
== app/api/health/route.ts
32:export const GET = healthCheckHandler
33:export const HEAD = headHealthCheckHandler
== app/api/profile/route.ts
50:export const GET = getProfileHandler
123:export const POST = createProfileHandler
179:export const PATCH = updateProfileHandler 
== app/api/proxy/route.ts
8:export async function GET(req: NextRequest) {
== app/api/setlists/[id]/route.ts
144:export const GET = wrappedGetSetlistHandler
312:export const PUT = wrappedUpdateSetlistHandler
383:export const DELETE = wrappedDeleteSetlistHandler
== app/api/setlists/[id]/songs/order/route.ts
77:export const PUT = wrappedReorderHandler
== app/api/setlists/[id]/songs/route.ts
103:export const POST = wrappedAddSongHandler
== app/api/setlists/route.ts
88:export const GET = getSetlistsHandler
224:export const POST = createSetlistHandlerWrapped
== app/api/setlists/songs/[songId]/route.ts
108:export const DELETE = wrappedRemoveSongHandler
== app/api/storage/delete/route.ts
81:export const POST = deleteFileHandler
== app/api/storage/list/route.ts
72:export const GET = listHandler
== app/api/storage/upload/route.ts
145:export const POST = uploadFileHandler
```

Nenhuma rota exporta `OPTIONS` (a saída acima cobre o padrão; zero hits) — não há handler de preflight CORS, e o bloco CORS foi removido na B1.2b (`lib/security-headers.ts:269-270`). Irrelevante para um cliente nativo (não há preflight fora do browser); relevante se a Fase B usar `fetch` de Node (não há — Node não faz preflight). `[medido]`

### 1.2 Pontos que verificam identidade `[medido]`

**Middleware** — existe um único arquivo, na raiz:
```
$ ls -la middleware.ts src/middleware.ts app/middleware.ts
ls: app/middleware.ts: No such file or directory
ls: src/middleware.ts: No such file or directory
-rw-r--r--@ 1 marcelviana  staff  2465 Aug 20 15:19 middleware.ts
```
Ele **exclui `/api`** e checa só a forma do cookie (verbatim, `middleware.ts:19,44-49,54-66`):
```
19	const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
44	  const sessionCookie = request.cookies.get('firebase-session')?.value
45	  const hasWellFormedSession = !!sessionCookie && JWT_SHAPE.test(sessionCookie)
46	
47	  if (isProtectedRoute && !hasWellFormedSession) {
48	    return NextResponse.redirect(new URL("/login", request.url))
49	  }
54	export const config = {
55	  matcher: [
64	    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
65	  ],
66	}
```

**Chamadas ao Firebase Admin** — um único ponto de verificação criptográfica no repositório; `verifySessionCookie`/`createSessionCookie` **não existem**:
```
$ grep -rnE 'verifyIdToken|verifySessionCookie|createSessionCookie' --include='*.ts' --include='*.tsx' lib app middleware.ts hooks contexts components | grep -v __tests__ | grep -v '\.test\.'
lib/firebase-admin.ts:101:    const decodedToken = await auth.verifyIdToken(idToken);
```
Verbatim `lib/firebase-admin.ts:94-107`:
```
94	export async function verifyFirebaseToken(idToken: string) {
95	  if (!isNodeJsRuntime()) {
96	    throw new Error('Token verification can only be done in Node.js runtime');
97	  }
98	
99	  try {
100	    const auth = getFirebaseAdminAuth();
101	    const decodedToken = await auth.verifyIdToken(idToken);
102	    return decodedToken;
103	  } catch (error: any) {
104	    console.error('Firebase token verification failed:', error.message);
105	    throw new Error(`Firebase ID token verification failed: ${error.message}`);
106	  }
107	}
```
Consequência direta: **o "cookie de sessão" `firebase-session` É o idToken de 1h** (não um session cookie do Firebase com vida própria) — verificado pelo mesmo `verifyIdToken`. É o AUTH-02 visto do lado do servidor.

**Leitores de `Authorization`** (server-side; os hits de `lib/content-service.ts`, `lib/setlist-service.ts` são o *cliente web* enviando Bearer):
```
$ grep -rnE "headers\.get\(['\"]authorization['\"]\)|headers\.get\(['\"]Authorization['\"]\)|Bearer" --include='*.ts' --include='*.tsx' lib app middleware.ts | grep -v __tests__ | grep -v '\.test\.'
lib/secure-auth-utils.ts:261:    const authHeader = request.headers.get('authorization')
lib/secure-auth-utils.ts:268:      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
lib/content-service.ts:265:        Authorization: `Bearer ${token}`,
lib/content-service.ts:477:        Authorization: `Bearer ${token}`,
lib/content-service.ts:510:        Authorization: `Bearer ${token}`,
lib/content-service.ts:545:        Authorization: `Bearer ${token}`,
lib/content-service.ts:587:          Authorization: `Bearer ${token}`,
lib/firebase-server-utils.ts:153:  const authHeader = request.headers.get('authorization')
lib/firebase-server-utils.ts:154:  if (authHeader && authHeader.startsWith('Bearer ')) {
lib/api-errors.ts:109:    headers: { 'WWW-Authenticate': 'Bearer' },
lib/setlist-service.ts:55:        'Authorization': `Bearer ${idToken}`,
lib/setlist-service.ts:96:      headers: { Authorization: `Bearer ${idToken}` }
lib/setlist-service.ts:143:        'Authorization': `Bearer ${idToken}`,
lib/setlist-service.ts:191:        'Authorization': `Bearer ${idToken}`,
lib/setlist-service.ts:229:      headers: { 'Authorization': `Bearer ${idToken}` }
lib/setlist-service.ts:269:        'Authorization': `Bearer ${idToken}`,
lib/setlist-service.ts:316:        'Authorization': `Bearer ${idToken}`,
app/api/storage/delete/route.ts:14:    const authHeader = request.headers.get('authorization')
app/api/storage/delete/route.ts:15:    if (!authHeader?.startsWith('Bearer ')) {
```
E no contexto de auth do client (`grep -nE "getIdToken|setSessionCookie|/api/auth/session|Bearer" contexts/firebase-auth-context.tsx`): linhas 73, 143, 159, 330, 418 enviam `Authorization: Bearer` a `/api/profile`; 137/206/222 chamam `setSessionCookie` (POST `/api/auth/session`). `[medido]`

**Leitores do cookie `firebase-session`** (server-side):
```
$ grep -rnE "cookies\(\)|cookies\.get\(|firebase-session|__session|sessionCookie|SESSION_COOKIE" --include='*.ts' --include='*.tsx' lib app middleware.ts | grep -v __tests__ | grep -v '\.test\.'
lib/secure-auth-utils.ts:278:      const sessionMatch = cookieHeader.match(/firebase-session=([^;]+)/)
lib/firebase-session-cookies.ts:5:const SESSION_COOKIE_NAME = 'firebase-session'
lib/firebase-session-cookies.ts:6:const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
lib/firebase-session-cookies.ts:53:  const sessionCookie = cookies.find(cookie => 
lib/firebase-session-cookies.ts:54:    cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
lib/firebase-session-cookies.ts:57:  if (!sessionCookie) return null
lib/firebase-session-cookies.ts:59:  return sessionCookie.split('=')[1] ?? null
lib/firebase-server-utils.ts:162:        .find(c => c.trim().startsWith('firebase-session='))
lib/firebase-server-utils.ts:164:        idToken = cookie.trim().substring('firebase-session='.length)
lib/firebase-server-utils.ts:192:    const sessionCookie = cookieStore.get('firebase-session')
lib/firebase-server-utils.ts:194:    if (!sessionCookie?.value) {
lib/firebase-server-utils.ts:201:    const validation = await validateFirebaseTokenServer(sessionCookie.value, requestUrl)
lib/firebase-server-utils.ts:225:    const sessionCookie = cookieStore.get('firebase-session')
lib/firebase-server-utils.ts:227:    if (!sessionCookie?.value) {
lib/firebase-server-utils.ts:232:    const validation = await validateFirebaseTokenServer(sessionCookie.value)
app/settings/page.tsx:9:  await requirePageUser(await cookies())
app/signup/page.tsx:9:  const user = await getServerSideUser(await cookies())
app/add-content/page.tsx:10:  await requirePageUser(await cookies())
app/content/[id]/page.tsx:12:  const cookieStore = await cookies();
app/dashboard/page.tsx:12:  const cookieStore = await cookies()
app/profile/page.tsx:10:  await requirePageUser(await cookies())
app/library/page.tsx:12:  const cookieStore = await cookies();
app/api/auth/session/route.ts:16:const SESSION_COOKIE_NAME = 'firebase-session'
app/api/auth/session/route.ts:17:const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
app/api/auth/session/route.ts:65:        `${SESSION_COOKIE_NAME}=${idToken}`,
app/api/auth/session/route.ts:67:        `Max-Age=${SESSION_COOKIE_MAX_AGE}`,
app/api/auth/session/route.ts:100:    response.cookies.set(SESSION_COOKIE_NAME, '', {
app/setlists/page.tsx:12:  await requirePageUser(await cookies())
app/performance/page.tsx:11:  const cookieStore = await cookies();
app/login/page.tsx:7:  const user = await getServerSideUser(await cookies())
middleware.ts:44:  const sessionCookie = request.cookies.get('firebase-session')?.value
middleware.ts:45:  const hasWellFormedSession = !!sessionCookie && JWT_SHAPE.test(sessionCookie)
```

**Helpers de auth consumidos pelas rotas** (`grep … --include=route.ts app/api`, íntegra no anexo A2):
```
app/api/auth/session/route.ts:2:import { validateFirebaseTokenSecure } from '@/lib/secure-auth-utils'
app/api/auth/session/route.ts:5:import { withPublicBodyValidation } from '@/lib/api-validation-middleware'
app/api/auth/session/route.ts:20:const postSessionHandler = withPublicBodyValidation(authSchemas.sessionCreate)(
app/api/auth/session/route.ts:26:      const validation = await validateFirebaseTokenSecure(idToken, request.url)
app/api/content/[id]/route.ts:2:import { requireAuthServer } from '@/lib/firebase-server-utils'
app/api/content/[id]/route.ts:16:    const user = await requireAuthServer(request)
app/api/content/[id]/route.ts:78:    const user = await requireAuthServer(request)
app/api/content/route.ts:2:import { requireAuthServer } from '@/lib/firebase-server-utils'
app/api/content/route.ts:19:    const user = await requireAuthServer(request)
app/api/content/route.ts:149:    const user = await requireAuthServer(request)
app/api/content/route.ts:225:    const user = await requireAuthServer(request)
app/api/content/route.ts:305:    const user = await requireAuthServer(request)
app/api/profile/route.ts:3:import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
app/api/profile/route.ts:6:import { withBodyValidation } from '@/lib/api-validation-middleware'
app/api/profile/route.ts:19:    const user = await requireAuthServerSecure(request)
app/api/profile/route.ts:55:const createProfileHandlerRaw = withBodyValidation(authSchemas.profileCreate, {
app/api/profile/route.ts:126:const updateProfileHandlerRaw = withBodyValidation(authSchemas.profileUpdate, {
app/api/proxy/route.ts:4:import { requireAuthServer } from '@/lib/firebase-server-utils'
app/api/proxy/route.ts:50:    const user = await requireAuthServer(req)
app/api/setlists/[id]/route.ts:2:import { requireAuthServer } from '@/lib/firebase-server-utils'
app/api/setlists/[id]/route.ts:6:import { withBodyValidation } from '@/lib/api-validation-middleware'
app/api/setlists/[id]/route.ts:18:    const user = await requireAuthServer(request)
app/api/setlists/[id]/route.ts:147:const updateSetlistHandler = withBodyValidation(setlistSchemas.update, {
app/api/setlists/[id]/route.ts:320:    const user = await requireAuthServer(request)
app/api/setlists/[id]/songs/order/route.ts:5:import { withBodyValidation } from '@/lib/api-validation-middleware'
app/api/setlists/[id]/songs/order/route.ts:17:const reorderSetlistHandler = withBodyValidation(setlistSchemas.reorder, {
app/api/setlists/[id]/songs/route.ts:2:import { requireAuthServer } from '@/lib/firebase-server-utils'
app/api/setlists/[id]/songs/route.ts:6:import { withBodyValidation } from '@/lib/api-validation-middleware'
app/api/setlists/[id]/songs/route.ts:13:const addSongToSetlistHandler = withBodyValidation(setlistSchemas.addSong, {
app/api/setlists/route.ts:2:import { requireAuthServer } from "@/lib/firebase-server-utils"
app/api/setlists/route.ts:6:import { withBodyValidation } from '@/lib/api-validation-middleware'
app/api/setlists/route.ts:14:    const user = await requireAuthServer(request)
app/api/setlists/route.ts:91:const createSetlistHandler = withBodyValidation(setlistSchemas.create, {
app/api/setlists/songs/[songId]/route.ts:2:import { requireAuthServer } from '@/lib/firebase-server-utils'
app/api/setlists/songs/[songId]/route.ts:27:    const user = await requireAuthServer(request)
app/api/storage/delete/route.ts:3:import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'
app/api/storage/delete/route.ts:20:    const validation = await validateFirebaseTokenServer(firebaseToken, request.url)
app/api/storage/list/route.ts:4:import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
app/api/storage/list/route.ts:22:    const user = await requireAuthServerSecure(request)
app/api/storage/upload/route.ts:3:import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
app/api/storage/upload/route.ts:15:    const user = await requireAuthServerSecure(request)
```
Nota: `app/api/setlists/[id]/songs/route.ts:2` importa `requireAuthServer` mas o handler usa o wrapper `withBodyValidation` (linha 13) — o import é órfão nessa rota; a verificação efetiva é a do wrapper (cadeia B). `[medido]` O wrapper (`lib/api-validation-middleware.ts:101`) chama `requireAuthServerSecure(request, { allowUnverifiedEmail })`.

**Os dois extratores de credencial, verbatim** (íntegras dos arquivos nos anexos A3/A4):

Cadeia A — `lib/firebase-server-utils.ts:137-181`:
```
137	export async function requireAuthServer(request: Request): Promise<{
138	  uid: string
139	  email?: string
140	  emailVerified?: boolean
141	} | null> {
142	  // B1.3: fallback por IP para auth FALHADA — "sem credencial não
143	  // significa sem limite". IP estourado nega SEM verificar (deny-fast:
144	  // corta o trabalho e o oráculo). Só credencial INVÁLIDA conta;
145	  // ausência de token não executa verificação e não conta.
146	  const clientIp = getClientIp(request)
147	  if (authFailureLimited(clientIp)) {
148	    return null
149	  }
150	
151	  let idToken: string | null = null
152	
153	  const authHeader = request.headers.get('authorization')
154	  if (authHeader && authHeader.startsWith('Bearer ')) {
155	    idToken = authHeader.substring(7)
156	  } else {
157	    // Fall back to session cookie if no Authorization header
158	    const cookieHeader = request.headers.get('cookie')
159	    if (cookieHeader) {
160	      const cookie = cookieHeader
161	        .split(';')
162	        .find(c => c.trim().startsWith('firebase-session='))
163	      if (cookie) {
164	        idToken = cookie.trim().substring('firebase-session='.length)
165	      }
166	    }
167	  }
168	
169	  if (!idToken) {
170	    return null
171	  }
172	
173	  const validation = await validateFirebaseTokenServer(idToken, request.url)
174	
175	  if (!validation.isValid || !validation.user) {
176	    recordAuthFailure(clientIp)
177	    return null
178	  }
179	
180	  return validation.user
181	}
```

Cadeia B — `lib/secure-auth-utils.ts:244-319`:
```
244	export async function requireAuthServerSecure(
245	  request: Request,
246	  options: { allowUnverifiedEmail?: boolean } = {}
247	): Promise<{
248	  uid: string
249	  email?: string
250	  emailVerified?: boolean
251	} | null> {
252	  try {
253	    // B1.3: fallback por IP para auth falhada — mesmo padrão do funil A
254	    // (lib/firebase-server-utils.ts): IP estourado nega sem verificar.
255	    const clientIp = getClientIp(request)
256	    if (authFailureLimited(clientIp)) {
257	      return null
258	    }
259	
260	    // Extract token with security validation
261	    const authHeader = request.headers.get('authorization')
262	    const cookieHeader = request.headers.get('cookie')
263	
264	    let token: string | null = null
265	
266	    // Extract from Authorization header
267	    if (authHeader) {
268	      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
269	      if (bearerMatch && bearerMatch[1]) {
270	        token = bearerMatch[1]
271	      } else {
272	        logger.warn('Invalid Authorization header format')
273	        return null
274	      }
275	    }
276	    // Extract from session cookie
277	    else if (cookieHeader) {
278	      const sessionMatch = cookieHeader.match(/firebase-session=([^;]+)/)
279	      if (sessionMatch && sessionMatch[1]) {
280	        token = decodeURIComponent(sessionMatch[1])
281	      }
282	    }
283	
284	    if (!token) {
285	      logger.log('No authentication token found')
286	      return null
287	    }
288	
289	    // Validate token with security enhancements
290	    const validation = await validateFirebaseTokenSecure(token, request.url)
291	
292	    if (!validation.isValid || !validation.user) {
293	      logger.warn('Token validation failed during auth requirement')
294	      recordAuthFailure(clientIp)
295	
296	      // SECURITY: Automatically blacklist suspicious tokens
297	      if (validation.error?.includes('revoked') || validation.error?.includes('expired')) {
298	        blacklistToken(token)
299	      }
300	
301	      return null
302	    }
303	
304	    // SECURITY: Additional email verification check.
305	    // allowUnverifiedEmail existe para fluxos onde o usuário acabou de ser
306	    // criado e ainda não pôde verificar o email (ex.: criação de perfil no signup)
307	    if (!validation.user.emailVerified && !options.allowUnverifiedEmail) {
308	      logger.warn(`Unverified user attempted access: ${validation.user.uid}`)
309	      return null
310	    }
311	
312	    logger.log(`Authentication successful for user: ${validation.user.uid}`)
313	    return validation.user
314	
315	  } catch (error) {
316	    logger.error('Authentication requirement failed:', error)
317	    return null
318	  }
319	}
```

Extrator inline nº 3 — `app/api/storage/delete/route.ts:13-24` (bearer-only, sem fallback de cookie, validador da cadeia A):
```
13	    // Verify Firebase authentication
14	    const authHeader = request.headers.get('authorization')
15	    if (!authHeader?.startsWith('Bearer ')) {
16	      return authRequired()
17	    }
18	
19	    const firebaseToken = authHeader.substring(7)
20	    const validation = await validateFirebaseTokenServer(firebaseToken, request.url)
21	    
22	    if (!validation.isValid || !validation.user) {
23	      return authRequired()
24	    }
```

`lib/secure-auth-utils.ts:378` exporta um alias `requireAuthServer = requireAuthServerSecure` — **nenhuma rota importa esse alias** (todas as importações de `requireAuthServer` nas rotas vêm de `@/lib/firebase-server-utils`, listagem acima). `[medido]`

### 1.3 Tabela rota × método × mecanismo × verificador `[medido por leitura das linhas citadas]`

Classificação: `ambos` = aceita `Authorization: Bearer` (prioritário) OU cookie `firebase-session` (fallback); `bearer-only`; `nenhum`. A coluna "email verificado" é a exigência adicional da cadeia B. Todas as operações de banco de todas as rotas usam `getSupabaseServiceClient()` (service role) — isso é a camada de dados, não o mecanismo de auth; nenhuma rota é classificável como `service-role` no eixo "quem prova identidade".

| Rota | Método | Mecanismo | Cadeia / verificador (arquivo:linha) | Email verificado exigido | Família de limite |
|---|---|---|---|---|---|
| `/api/auth/session` | POST | **nenhum** (pública; verifica o `idToken` do BODY) | `validateFirebaseTokenSecure` — `app/api/auth/session/route.ts:26` → `lib/secure-auth-utils.ts:143` | não | `session` (uid, pós-verificação) / `session-authfail` (ip) |
| `/api/auth/session` | DELETE | nenhum | — (`route.ts:85-113`) | — | `session-delete` (ip) |
| `/api/content` | GET | **ambos** | A — `app/api/content/route.ts:19` → `lib/firebase-server-utils.ts:137` | **não** | `content-read` |
| `/api/content` | POST | ambos | A — `route.ts:149` | não | `content-mutate` |
| `/api/content` | PUT | ambos | A — `route.ts:225` | não | `content-mutate` |
| `/api/content` | DELETE | ambos | A — `route.ts:305` | não | `content-mutate` |
| `/api/content/[id]` | GET | **ambos** | A — `app/api/content/[id]/route.ts:16` | **não** | `content-read` |
| `/api/content/[id]` | DELETE | ambos | A — `[id]/route.ts:78` | não | `content-mutate` |
| `/api/debug/config` | GET | **nenhum** (404 se `NODE_ENV==='production'`) | — `app/api/debug/config/route.ts:7-8` | — | nenhuma |
| `/api/health` | GET, HEAD | nenhum (pública) | — `app/api/health/route.ts:7-15,20-28` | — | `health` (ip) |
| `/api/profile` | GET | ambos | B — `app/api/profile/route.ts:19` → `lib/secure-auth-utils.ts:244` | **sim** | `profile` |
| `/api/profile` | POST | ambos | B via wrapper — `route.ts:55-57` (`allowUnverifiedEmail: true`) → `lib/api-validation-middleware.ts:101` | não (exceção explícita) | `profile` |
| `/api/profile` | PATCH | ambos | B via wrapper — `route.ts:126-127` | **sim** | `profile` |
| `/api/proxy` | GET | **ambos** (se `isSupabaseConfigured`; senão nenhum, por IP) | A — `app/api/proxy/route.ts:49-57` | **não** | `proxy` |
| `/api/setlists` | GET | **ambos** | A — `app/api/setlists/route.ts:14` | **não** | `setlist-read` |
| `/api/setlists` | POST | ambos | B via wrapper — `route.ts:91-92` | **sim** | `setlist-mutate` |
| `/api/setlists/[id]` | GET | **ambos** | A — `app/api/setlists/[id]/route.ts:18` | **não** | `setlist-read` |
| `/api/setlists/[id]` | PUT | ambos | B via wrapper — `[id]/route.ts:147-148` | **sim** | `setlist-mutate` |
| `/api/setlists/[id]` | DELETE | ambos | A — `[id]/route.ts:320` | não | `setlist-mutate` |
| `/api/setlists/[id]/songs` | POST | ambos | B via wrapper — `[id]/songs/route.ts:13-14` | **sim** | `setlist-mutate` |
| `/api/setlists/[id]/songs/order` | PUT | ambos | B via wrapper — `order/route.ts:17-18` | **sim** | `setlist-mutate` |
| `/api/setlists/songs/[songId]` | DELETE | ambos | A — `songs/[songId]/route.ts:27` | não | `setlist-mutate` |
| `/api/storage/delete` | POST | **bearer-only** | inline nº 3 — `app/api/storage/delete/route.ts:14-20` (validador A) | não | `storage` |
| `/api/storage/list` | GET | ambos | B — `app/api/storage/list/route.ts:22` | **sim** | `storage` |
| `/api/storage/upload` | POST | ambos | B — `app/api/storage/upload/route.ts:15` | **sim** | `storage` |

Contagem: **5 handlers `nenhum`** (session POST/DELETE, debug GET, health GET/HEAD) **+ 1 `bearer-only`** (storage/delete POST) **+ 20 `ambos`** (11 pela cadeia A / 9 pela cadeia B) **= 26**. **Zero `cookie-only`** na API. `[medido: derivado da tabela; a listagem de handlers é a do §1.1]`

**As quatro leituras da tela 1** (`GET /api/setlists`, `GET /api/setlists/[id]`, `GET /api/content`, `GET /api/content/[id]`) **e o `GET /api/proxy` estão TODAS na cadeia A**: bearer aceito, sem exigência de email verificado.

### 1.4 As cadeias de verificação — quantas, onde divergem, qual o bearer percorre

**Dois validadores** (cada um com cache próprio), **três extratores de credencial**, e o middleware fora do jogo:

| | Cadeia A (`lib/firebase-server-utils.ts`) | Cadeia B (`lib/secure-auth-utils.ts`) |
|---|---|---|
| Extrator | `requireAuthServer` :137 | `requireAuthServerSecure` :244 (direto em 4 rotas; via `withValidation` em 7 handlers) |
| Bearer | `startsWith('Bearer ')` — **case-sensitive**, sem `\s+` (:154) | regex `/^Bearer\s+(.+)$/i` — **case-insensitive** (:268) |
| Header presente mas malformado | cai no fallback de cookie (:156) | **nega** (`return null`, :271-274) — sem fallback |
| Cookie | substring crua (:164) | `decodeURIComponent` (:280) |
| Validador | `validateFirebaseTokenServer` :64 | `validateFirebaseTokenSecure` :143 |
| Verificação criptográfica | `verifyFirebaseToken` → `verifyIdToken` (`lib/firebase-admin.ts:101`) — **a mesma** | idem |
| Cache | Map por token, TTL **1h** (:98-101); fallback para cache vencido em erro de infra (:112-114) | Map por token, TTL **5min** (:11,226-230); MAX 1000 (LRU por exp); blacklist 30min (:17,21); `userSessionMap` |
| Email verificado | **não checa** | **exige** salvo `allowUnverifiedEmail` (:307) |
| Auth falhada | deny-fast por IP `authfail` 30/5min (:147,176) | idem (:256,294) |
| Blacklist automática | não | por string de erro `revoked|expired` (:297-299) — **dormante**: o validador devolve `'Token verification failed'` (:207), que não casa (nota do desenho da B1.1 no próprio código :199-201) |

Onde divergem, resumido: **email verificado** (B exige), **tolerância do header** (A cai no cookie, B nega), **TTL de cache** (1h × 5min). São as duas cadeias que o B1.5 (fila desde o B1) funde.

**Vida efetiva do idToken no servidor (cadeia A) — fato para o PRD** `[medido por leitura]`: o cache é **por string de token**, com `exp: now + 60*60*1000` gravado no momento da verificação (`lib/firebase-server-utils.ts:98-101`) e **sem olhar o `exp` do próprio JWT**; enquanto a entrada vive, o token é aceito sem reverificar (`:74-77`). Um idToken verificado pela primeira vez aos 59 min de vida entra no cache e **segue aceito até ~1h59** — e, em erro de infra do Admin (não de token inválido), a cadeia devolve o resultado do cache **já vencido** (`:112-114`), estendendo ainda mais. A cadeia B tem o mesmo desenho com TTL de 5 min (`lib/secure-auth-utils.ts:226-230`), sem fallback a cache vencido. Registrado como **"vida efetiva no servidor até ~2h"** (por instância de lambda) e como insumo adicional do B1.5 (§C-D1).

**O que um bearer percorre hoje** em `GET /api/setlists`: `requireAuthServer` (A) → IP não estourado em `authfail` → `authorization` começa com `Bearer ` → `idToken = substring(7)` → `validateFirebaseTokenServer` → cache (miss) → `verifyFirebaseToken` (Node, Firebase Admin) → `{uid, email, emailVerified}` → cache 1h → handler → `enforceUserLimit(uid, 'setlist-read')` → query. **Nenhum passo lê cookie quando o header existe.**

### 1.5 `POST /api/auth/session` `[medido]`

Verbatim `app/api/auth/session/route.ts:16-17,20-27,58-74`:
```
16	const SESSION_COOKIE_NAME = 'firebase-session'
17	const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
20	const postSessionHandler = withPublicBodyValidation(authSchemas.sessionCreate)(
21	  async (request: Request, validatedData: any) => {
22	    try {
23	      const { idToken } = validatedData
24	
25	      // Verify the token using secure authentication utilities
26	      const validation = await validateFirebaseTokenSecure(idToken, request.url)
27	      if (!validation.isValid || !validation.user) {
58	      // Create response with session cookie
59	      const response = new Response(JSON.stringify({ success: true }), {
60	        headers: { 'Content-Type': 'application/json' }
61	      })
62	
63	      // Set secure session cookie
64	      const cookieOptions = [
65	        `${SESSION_COOKIE_NAME}=${idToken}`,
66	        'HttpOnly',
67	        `Max-Age=${SESSION_COOKIE_MAX_AGE}`,
68	        'Path=/',
69	        'SameSite=Lax',
70	        ...(process.env.NODE_ENV === 'production' ? ['Secure'] : [])
71	      ].join('; ')
72	
73	      response.headers.set('Set-Cookie', cookieOptions)
74	      return response
```
Schema do body (`lib/api-schemas.ts:273-276`): `{ idToken: string min(1) max(4000) }.strict()`.

- **Recebe**: `{ idToken }` (JSON, strict).
- **Verifica**: o idToken pelo validador B (`validateFirebaseTokenSecure`) — **sem** checar email verificado (a checagem vive em `requireAuthServerSecure`, não no validador).
- **Grava**: `Set-Cookie: firebase-session=<o MESMO idToken>; HttpOnly; Max-Age=604800; Path=/; SameSite=Lax; Secure` (prod). Corpo `{"success":true}`.
- **Limites**: token válido → `session` 120/15min por uid; inválido → `session-authfail` 10/15min por IP.
- **Um cliente nativo poderia usá-lo?** Sim, mecanicamente: `scripts/ux-audit/auth.ts:113-138` já faz exatamente isso em Node (POST, lê `getSetCookie()`, extrai `firebase-session=…`) e depois manda `Cookie:` manualmente (:174). **Mas não há ganho**: o cookie carrega o idToken de 1h verbatim; o `Max-Age` de 7 dias não estende nada (o servidor chama `verifyIdToken` no valor do cookie — §1.2). Plano B **viável e inútil**: custa 1 request extra na família `session` por renovação de token (a cada ~1h) para obter algo que o bearer já entrega, e submete o nativo ao AUTH-02 (nota operacional do plano: "re-semeiam sessão a cada ~55 min").

### 1.6 Resposta ao M1 — "GET /api/setlists com bearer válido e sem cookie: passa ou 401?"

**Passa (200), em nível de código.** Caminho: `app/api/setlists/route.ts:14` → `lib/firebase-server-utils.ts:153-155` (header lido antes de qualquer cookie) → `:173` validação → `:180` retorna user → handler segue (`route.ts:19-81`). Condições: (a) idToken emitido pelo projeto Firebase que o Admin verifica (`FIREBASE_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY` — nomes presentes em `.env.local`, valores não lidos); (b) IP fora da janela `authfail` (30 falhas/5min); (c) header exatamente `Authorization: Bearer <token>` (prefixo case-sensitive na cadeia A). Nenhuma condição sobre email verificado, nenhuma sobre cookie. O mesmo vale para as outras três leituras e para o proxy (todas cadeia A). A prova de runtime é o **P2** da Fase B; o teste unitário existente que já exercita o bearer nessa cadeia é `lib/__tests__/firebase-server-utils.test.ts` (lista de arquivos com `Bearer` em §Anexos — não lido nesta sessão, referência de existência apenas `[medido: grep -rln Bearer]`).

---

## M2 — Shapes que a tela 1 consome

### 2.1 `GET /api/setlists` `[medido]`

Query única com embedding (`app/api/setlists/route.ts:33-39`) e mapeamento (`:48-79`), verbatim:
```
33	    const { data: setlists, error: setlistsError } = await supabase
34	      .from('setlists')
35	      .select(`*, setlist_songs ( id, setlist_id, content_id, position, notes,
36	        content ( id, title, artist, content_type, key, bpm, file_url, content_data ) )`)
37	      .eq('user_id', user.uid)
38	      .order('created_at', { ascending: false })
39	      .order('position', { referencedTable: 'setlist_songs', ascending: true })
```
```
59	        return {
60	          id: song.id,
61	          setlist_id: song.setlist_id,
62	          content_id: song.content_id,
63	          position: song.position,
64	          notes: song.notes,
65	          content: {
66	            id: content?.id || song.content_id,
67	            title: content?.title || "Unknown Title",
68	            artist: content?.artist || "Unknown Artist",
69	            content_type: content?.content_type || "Unknown Type",
70	            key: content?.key || null,
71	            bpm: content?.bpm || null,
72	            file_url: content?.file_url || null,
73	            content_data: content?.content_data || null,
74	          },
75	        }
```
- **Tipo**: array de linhas de `setlists` (`*` = `id, user_id, name, description, performance_date, venue, notes, is_public, created_at, updated_at` — dump:380-391) + `setlist_songs: FormattedSetlistSong[]` (`types/setlist.ts:26-33`, com `content: ContentData` :11-24 — `content_data: Json | null`). Gate de shape: `app/api/setlists/__tests__/get-shape.test.ts`.
- **Paginação/limite**: **nenhum** — devolve todas as setlists do usuário com todas as músicas e o `content_data` integral de cada uma (SET-22 do plano, B7). Referência de tamanho: 49.983 bytes para 3 setlists/69 songs (B6-ENCERRAMENTO §3, sha256 `08ebfe43…`) `[referência]`.
- **Storage**: `content.file_url` vem **verbatim da coluna** (`:72`); nenhuma URL é montada na leitura.
- **Ordem**: setlists por `created_at desc`; songs por `position asc` (invariante 1..N contratado em SETLISTS.md).
- Delta declarado no próprio código (`:28-32`): o embedding não filtra `content.user_id` (estado inalcançável pelos escritores).

### 2.2 `GET /api/setlists/[id]` `[medido]`

`app/api/setlists/[id]/route.ts:36-123` — **três queries** (setlist `*` filtrada por `user_id` :39-44; `setlist_songs` :63-67; `content .in(ids).eq(user_id)` :82-86) e o **mesmo mapeamento** de `:101-121`. Resposta: `{ ...setlist, setlist_songs: FormattedSetlistSong[] }`. Id malformado → `400 field:"id"` (:31-34); inexistente/alheia → `404 Setlist not found` (:47-57). **O fim do N+1 (B6-D6) tocou só a listagem**: aqui o custo é 1+2 constante (não cresce com N), então não era N+1 — registrado por precisão. Nota: aqui o content **é** filtrado por `user_id` (:86), diferente da listagem — sem efeito observável nos dados (mesma justificativa do delta do §2.1).

### 2.3 `GET /api/content` `[medido]`

`app/api/content/route.ts:28-137`. Schema de query (`lib/api-schemas.ts:187-196`, verbatim):
```
187	  query: z.object({
188	    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
189	    pageSize: z.string().regex(/^\d+$/, 'Page size must be a number').transform(Number).default('20'),
190	    search: z.string().max(100).optional(),
191	    sortBy: z.enum(['recent', 'title', 'artist', 'updated']).default('recent'),
192	    contentType: z.string().max(100).optional(),
193	    difficulty: z.string().max(100).optional(),
194	    key: z.string().max(100).optional(),
195	    favorite: z.enum(['true', 'false']).optional(),
196	  }),
```
- **Select**: `'*'` com `count: 'exact'` (`route.ts:64-67`) — devolve **todas as colunas** de `content` (dump:75-97; `types/database.types.ts:60-83`), **inclusive `content_data` integral** de cada item.
- **Paginação**: `page ≥ 1`, `pageSize` clampado a **[1, 100]** no handler (`:116-119`): `Math.min(Math.max(1, pageSize), 100)`; resposta `{ data, total, page, pageSize, hasMore, totalPages }` (`:128-135`). Para a biblioteca de referência (66 content) uma página de 100 basta.
- **Busca**: `ILIKE` em `title/artist/album` com `%_` escapados (`:70-76`) — sem `unaccent` (LIB-04/B11).
- **Storage**: `file_url`/`thumbnail_url` verbatim das colunas.
- **Cache-Control**: `no-store` para `/api/*` via `applySecurityHeaders` (`lib/security-headers.ts:253-258`) — mas esse helper roda no **middleware**, que exclui `/api` (§1.2); se o header chega às respostas de API é `[hipótese]` a checar na Fase B (basta ler os headers de P3). Nenhuma rota emite `ETag`/`Last-Modified`/`If-None-Match` `[medido: grep -rn -i "etag\|if-none-match\|last-modified\|cache-control" app/api lib → único hit lib/security-headers.ts:256]`.

### 2.4 `GET /api/content/[id]` `[medido]`

`app/api/content/[id]/route.ts:24-50`: id → `commonSchemas.objectId` (uuid) senão `400 field:"id"`; `select('*').eq('id').eq('user_id').single()`; `PGRST116` → `404 Content not found`. Resposta: a linha inteira de `content`.

### 2.5 Como o modo performance do web obtém os dados `[medido]`

**Não chama a API.** `app/performance/page.tsx` (server component, íntegra no anexo A8):
- `:21 requirePageUser(cookieStore)` — cookie, validador A via `getServerSideUser` (`lib/require-page-user.ts:30`), exige email verificado (`:36-38`).
- `:32 getContentByIdServer` / `:36 getSetlistByIdServer` (`lib/content-service-server.ts:52-72, 91-170`) — **Supabase direto com service role**, em duas queries (setlist + `setlist_songs` com embedding de `content:content_id (…file_url, content_data)`, `:122-144`), mesmo mapeamento com fallbacks (`:151-167`).
- Props → `PerformancePageClient` → `OptimizedPerformanceMode` (`components/performance-page-client.tsx:38-43`) → `useSongsTransformation` (`hooks/use-songs-transformation.ts:26-49`: extrai `lyrics/file/chords/sections` de `content_data`) → `useContentLoading` (`hooks/use-content-loading.ts:47-85`): texto vem das props; arquivo (`file_url`) vem de `useAdvancedContentCache().getCachedContent(url, id)`.
- Arquivos: `lib/advanced-content-cache.ts` — store `localforage` `octavia-performance-cache` (`:46-54`), 100MB, expiração 24h, preload 3 à frente/1 atrás (`:13-20`); rede via **`/api/proxy?url=`** (`:308-321`) **sem header `Authorization`** → autenticado pelo **cookie** (cadeia A, fallback). Segundo cache de arquivos: `lib/offline-cache.ts` (`octavia-offline-file-<uid>-<id>`, 50MB LRU, `:6-10,153-225`) que busca a **URL pública direto** quando o `file_url` é `/storage/v1/object/public/` (`:13-21,171-173`) e senão via proxy.
- Grep dos mecanismos offline (íntegra no anexo A5; o pedido do prompt incluía os quatro padrões):
  ```
  --- pattern: serviceWorker
  components/service-worker-wrapper.tsx:14:      'serviceWorker' in navigator &&
  components/service-worker-wrapper.tsx:48:            const registrations = await navigator.serviceWorker.getRegistrations();
  components/service-worker-wrapper.tsx:65:      navigator.serviceWorker.addEventListener('error', (event) => {
  hooks/use-service-worker.tsx:14:    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
  hooks/use-service-worker.tsx:107:        const registration = await navigator.serviceWorker.register("/sw.js", {
  hooks/use-service-worker.tsx:171:              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
  hooks/use-service-worker.tsx:219:        navigator.serviceWorker.addEventListener("message", handleMessage)
  hooks/use-service-worker.tsx:222:        navigator.serviceWorker.addEventListener("error", handleServiceWorkerError)
  hooks/use-service-worker.tsx:256:          navigator.serviceWorker.removeEventListener("message", handleMessage)
  hooks/use-service-worker.tsx:257:          navigator.serviceWorker.removeEventListener("error", handleServiceWorkerError)
  lib/offline-queue.ts:40:if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  lib/offline-queue.ts:42:    navigator.serviceWorker.ready.then(() => processQueue())
  exit=0
  --- pattern: localStorage
  components/pwa-install-prompt.tsx:35:    const permanentlyDismissed = localStorage.getItem('octavia_install_dismissed')
  components/pwa-install-prompt.tsx:41:    const postponedTimestamp = localStorage.getItem('octavia_install_postponed')
  components/pwa-install-prompt.tsx:71:        const currentlyDismissed = localStorage.getItem('octavia_install_dismissed')
  components/pwa-install-prompt.tsx:72:        const currentlyPostponed = localStorage.getItem('octavia_install_postponed')
  components/pwa-install-prompt.tsx:127:    localStorage.setItem('octavia_install_dismissed', 'true')
  components/pwa-install-prompt.tsx:139:    localStorage.setItem('octavia_install_postponed', Date.now().toString())
  exit=0
  --- pattern: indexedDB
  exit=1
  --- pattern: caches\.
  components/service-worker-wrapper.tsx:20:          const cacheNames = await caches.keys();
  components/service-worker-wrapper.tsx:28:            await Promise.all(problematicCaches.map(name => caches.delete(name)));
  public/sw.js:43:    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  public/sw.js:53:      const cacheNames = await caches.keys();
  public/sw.js:56:      await Promise.all(oldCaches.map(name => caches.delete(name)));
  public/sw.js:72:      caches.match(request).then(res => res || fetch(request))
  public/sw.js:81:        const cache = await caches.open(STATIC_CACHE);
  public/sw.js:102:          const cache = await caches.open(PAGE_CACHE);
  public/sw.js:106:          const cache = await caches.open(PAGE_CACHE);
  public/sw.js:109:          const offline = await caches.match(OFFLINE_URL);
  exit=0
  ```
  `indexedDB` literal dá **zero** porque o acesso é via `localforage@1.10.0` (`package.json:61`): `lib/advanced-content-cache.ts`, `lib/offline-cache.ts`, `lib/offline-queue.ts`, `lib/offline-setlist-cache.ts` `[medido: grep -rln localforage]`. `localStorage` só no prompt de instalação do PWA — **nenhum dado de conteúdo em localStorage**.
- **Service worker** `public/sw.js` (cópia byte-idêntica de `worker/index.js` por `scripts/build-sw.js`; `diff` vazio `[medido]`): precache de 8 assets; cache-first `/_next/static|image`; **network-first para navegações com fallback ao `PAGE_CACHE` e `/offline`** (`:96-121`). **Não intercepta `/api/*`** nem URLs do Supabase (nenhuma regra casa) — o offline de dados é 100% `localforage`.
- **Listagem offline (SET-14, fila A #5)**: `hooks/use-setlist-data.ts:53-71` hidrata de `getCachedSetlists()` (`octavia-offline-setlists-<uid>`) + `getCachedContent()`; rede revalida por `GET /api/setlists` (bearer) e `GET /api/content?pageSize=1000` (clampado a 100 no servidor — `:98` pede 1000, `route.ts:117` entrega ≤100 `[medido]`: a UI web de setlists **só vê as 100 primeiras** por `recent`; com 66 content hoje não morde) e `replaceSetlists` substitui o cache sem merge (`lib/offline-setlist-cache.ts:49-56`).
- **Como o palco chega offline a uma setlist "nunca visitada" (item 9)**: pela **página `/performance?setlistId=`**, que é server-rendered — offline, a navegação cai no `PAGE_CACHE` por URL exata (`sw.js:105-108`) e, se não houver, em `/offline` (`app/offline/page.tsx` lê os caches `localforage` :5,17,19). Ou seja: o dado textual da setlist está no `octavia-offline-setlists-<uid>` (o `GET /api/setlists` embute `content_data`), mas **o componente de palco só recebe dados por props do servidor** — não há leitura do `localforage` dentro do `OptimizedPerformanceMode` `[medido: grep de consumidores dos caches — `hooks/use-content-loading.ts:49` só consome o cache de ARQUIVO; nenhum consumidor do cache de setlists fora de `use-setlist-data`/`app/offline`]`. Como exatamente o item 9 renderizou offline em 2026-08 é **`[hipótese]`** (candidatos: `PAGE_CACHE` de uma visita anterior à mesma URL, ou o `/offline` listando o cache) — fora do escopo desta fase; o que importa ao PRD é o fato medido: **o web não tem um modelo de leitura offline do palco por dados; tem cache de HTML por URL + cache de arquivos**.

### 2.6 Contrato de `content_data` `[medido]`

Schema que valida `content_data` no `POST /api/content` (`contentSchemas.create`, `lib/api-schemas.ts:163-170`) e no `PUT /api/content` (`contentSchemas.update`, `:174-182`) — ambos espalham o MESMO `contentEditableFields` (`:139-156`); handlers em `app/api/content/route.ts:168` (POST) e `:242` (PUT). Verbatim `lib/api-schemas.ts:114-128` e `:145`:
```
114	// content_data é jsonb: valores devem ser JSON puro; o TOPO é objeto-ou-null.
115	// D5 (decisão de Marcel, 2026-08-24): o batch import da web envia STRING aqui
116	// e leva 400 ("Expected object") — NÃO consertar; o batch morre com a web e o
117	// contrato correto (objeto) é o que o cliente nativo herda. Não "corrija"
118	// isso alargando o topo para Json.
119	export const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
120	  z.union([
121	    z.string(),
122	    z.number(),
123	    z.boolean(),
124	    z.null(),
125	    z.array(jsonValueSchema),
126	    z.record(jsonValueSchema),
127	  ])
128	)
```
```
145	  content_data: z.record(jsonValueSchema).nullish(),
```
E o uso nos dois schemas (`:163-182`):
```
163	export const contentSchemas = {
164	  create: withIgnoredKeys(
165	    z.object({
166	      ...contentEditableFields,
167	      is_favorite: z.boolean().default(false),
168	    }).strict(),
169	    CONTENT_IGNORED_KEYS
170	  ),
171	
172	  // update canônico: PUT /api/content com id NO CORPO (o PUT /api/content/[id]
173	  // foi removido na PR-3 — decisão D6)
174	  update: withIgnoredKeys(
175	    z.object({
176	      id: commonSchemas.objectId,
177	      ...contentEditableFields,
178	      title: commonSchemas.createSafeText(1, 255).optional(),
179	      content_type: contentTypeSchema.optional(),
180	      is_favorite: z.boolean().nullish(),
181	    }).strict(),
182	    CONTENT_IGNORED_KEYS
```

**Achado**: a estrutura interna de `content_data` **NÃO é validada** — o contrato é apenas "objeto JSON (qualquer chave, qualquer valor JSON) ou null" (`z.record(jsonValueSchema).nullish()`). Nenhuma chave (`lyrics`, `chords`, `sections`, `tablature`, `file`, `annotations`) é declarada, tipada ou obrigatória por `content_type`. **A tela 1 renderiza um shape sem contrato**: o único "contrato" existente é o consumidor de referência do palco web, verbatim `hooks/use-songs-transformation.ts:26-49`:
```
26	      return selectedSetlist.setlist_songs.map(s => ({
27	        id: s.content.id,
28	        title: s.content.title,
29	        artist: s.content.artist,
30	        key: s.content.key,
31	        bpm: s.content.bpm,
32	        time_signature: s.content.time_signature,
33	        content_type: s.content.content_type,
34	        file_url: s.content.file_url,
35	        content_data: s.content.content_data ? {
36	          lyrics: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'lyrics' in s.content.content_data
37	            ? s.content.content_data.lyrics as string
38	            : undefined,
39	          file: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'file' in s.content.content_data
40	            ? s.content.content_data.file as string
41	            : undefined,
42	          chords: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'chords' in s.content.content_data
43	            ? s.content.content_data.chords
44	            : undefined,
45	          sections: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'sections' in s.content.content_data
46	            ? s.content.content_data.sections
47	            : undefined
48	        } : null
49	      }))
```
O consumidor lê **quatro chaves** (`lyrics: string`, `file: string`, `chords: any`, `sections: any` — tipos em `types/performance.ts:46-51`) e **ignora `tablature`** (o fio desligado do TAB no palco, C4 do plano). Consequência para o PRD: o shape interno de `content_data` por `content_type` **precisa nascer como contrato escrito** (Bloco C, herança nomeada do B2 "forma interna de `content_data`"); o inventário de chaves REAIS no banco é o P5 ampliado da Fase B.


---

## M3 — Storage: política efetiva

### 3.1 No dump `[medido]` — inexecutável (divergência nº 1)

`grep -n -i 'storage'` e `'bucket'` em `supabase/schema.dump.sql` → `exit=1` ambos. O dump tem 13 `CREATE POLICY`, todas do schema `public` (`grep -c 'CREATE POLICY'` → `13`; as 13 estão verbatim no dump:441-497 e são das tabelas `content`, `profiles`, `setlist_songs`, `setlists`). **Nenhuma policy de `storage.objects`/`storage.buckets` está versionada no repositório**; a única menção a `storage.buckets` em todo o repo é o SQL de console do B5 para o `file_size_limit`:
```
$ grep -rn 'storage\.objects\|storage\.buckets' --include='*.sql' --include='*.md' --include='*.ts' . | grep -v node_modules
./docs/ux/B5-DESENHO.md:105:select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'content-files';
./docs/ux/B5-DESENHO.md:107:update storage.buckets set file_size_limit = 4194304 where id = 'content-files';
./docs/ux/B5-DESENHO.md:110:select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'content-files';
```
Flag `public` do bucket: `true` **por medição do B5** (B5-PRECHECK §2.1, 2026-08-29: `{"name":"content-files","public":true,…}`) e **por contrato** (STORAGE.md §"Modelo de entrega", item 1; B5-D3). Nesta sessão: `[referência]`, não `[medido]`.

### 3.2 No código `[medido]`

```
$ grep -rnE 'getPublicUrl|createSignedUrl|createSignedUrls|/storage/v1/object' --include='*.ts' --include='*.tsx' lib app components hooks scripts | grep -v __tests__ | grep -v '\.test\.'
lib/offline-cache.ts:17:    return url.includes('/storage/v1/object/public/');
app/api/storage/upload/route.ts:119:      .getPublicUrl(uniqueFilename)
scripts/storage/reconcile.ts:125:      `${SUPA}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(obj.path)}`,
scripts/storage/reconcile.ts:215:      `${SUPA}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path)}`,
exit=0
```
- **Zero `createSignedUrl`** no repositório. A URL é gerada **uma vez, no upload** (`app/api/storage/upload/route.ts:117-119`, `getPublicUrl`) e devolvida no 201 (`:128 url: urlData.publicUrl`); o cliente a manda no `POST /api/content` como `file_url` (`lib/api-schemas.ts:146: file_url: z.string().url().nullish()`); a partir daí é **coluna**, lida verbatim (§2).
- Padrão da URL: `https://<projeto>.supabase.co/storage/v1/object/public/content-files/<timestamp>-<nome>` (B5-PRECHECK §2.3, 8 linhas medidas `[referência]`).
- Consumo: o web lê a URL pública **direto** no cache offline (`lib/offline-cache.ts:171-173`) e via **proxy autenticado** no palco (`lib/advanced-content-cache.ts:310`); o proxy (`app/api/proxy/route.ts:65`) faz `fetch(target.href)` **sem credencial** — ou seja, **o próprio proxy depende de o bucket ser público**.

### 3.3 Resposta ao M3 — "um cliente sem auth consegue baixar um objeto conhecendo o path?"

**Sim, em nível de código e de contrato**: nenhuma URL assinada é gerada; o proxy do servidor baixa sem credencial; o contrato (STORAGE.md §1, B5-D3) declara o bucket público; a medição do B5 (P1 do B5: `GET público do objeto armazenado → 200`) o confirma em 2026-08-29. Se continua verdadeiro **hoje** é `[hipótese]` até o **P4** da Fase B. Consequência para a tela 1: o nativo pode baixar `file_url` **sem passar pela API** (zero custo na família `proxy`), exatamente como `lib/offline-cache.ts` já faz.

---

## M4 — Rate limits por família

### 4.1 Sistema único `[medido]` — `lib/user-rate-limit.ts` (íntegra no anexo A6)

Configurações (`:40-61`, verbatim):
```
40	export const RATE_LIMITS = {
41	  /** POST /api/auth/session com token válido (por uid) */
42	  SESSION: { windowMs: 15 * 60_000, max: 120 },
43	  /** POST /api/auth/session com token INVÁLIDO (por IP — brute force) */
44	  SESSION_AUTH_FAIL: { windowMs: 15 * 60_000, max: 10 },
45	  /** DELETE /api/auth/session (logout; por IP — logout com token morto deve funcionar) */
46	  SESSION_DELETE: { windowMs: 15 * 60_000, max: 30 },
47	  /** Auth falhada em qualquer rota autenticada (por IP, nos funis de auth) */
48	  AUTH_FAIL: { windowMs: 5 * 60_000, max: 30 },
49	  /** Leituras (content/setlists GET) — performance mode nunca pode engasgar */
50	  READ: { windowMs: 60_000, max: 300 },
51	  /** Mutações (content/setlists POST/PUT/DELETE/PATCH) — montagem de setlist de 56 canções cabe 2× */
52	  MUTATE: { windowMs: 15 * 60_000, max: 120 },
53	  /** Perfil (GET/POST/PATCH) — 1× por load + retry */
54	  PROFILE: { windowMs: 15 * 60_000, max: 60 },
55	  /** storage upload/delete — subir um repertório inteiro numa sessão */
56	  STORAGE: { windowMs: 60 * 60_000, max: 60 },
57	  /** /api/proxy — biblioteca cheia busca dezenas de assets por load */
58	  PROXY: { windowMs: 60_000, max: 120 },
59	  /** /api/health (pública; por IP) */
60	  HEALTH: { windowMs: 60_000, max: 120 },
61	} as const
```
Chave (`:100`): `` `${scope}:${id}:${familia}` `` — **a família é a string passada pela rota, não a config**; janela fixa (`:104-108`); store `Map` em memória **por instância de lambda** (`:12-16`); IP por `x-forwarded-for` (`:149-153`).

### 4.2 Famílias efetivas (string × config × chave) `[medido: grep do anexo A6]`

| Família (string) | Config | Chave | Rotas |
|---|---|---|---|
| `setlist-read` | READ 300/min | user | `GET /api/setlists`, `GET /api/setlists/[id]` |
| `content-read` | READ 300/min | user | `GET /api/content`, `GET /api/content/[id]` |
| `proxy` | PROXY 120/min | user (ip só sem Supabase) | `GET /api/proxy` |
| `setlist-mutate` | MUTATE 120/15min | user | POST/PUT/DELETE de setlists e songs (6 handlers) |
| `content-mutate` | MUTATE 120/15min | user | POST/PUT/DELETE content (4 handlers) |
| `profile` | PROFILE 60/15min | user | GET/POST/PATCH profile |
| `storage` | STORAGE 60/h | user | upload/delete/list |
| `session` | SESSION 120/15min | user | POST session (token válido) |
| `session-authfail` | 10/15min | ip | POST session (token inválido) |
| `session-delete` | 30/15min | ip | DELETE session |
| `authfail` | AUTH_FAIL 30/5min | ip | funis A e B (`recordAuthFailure`, deny-fast) |
| `health` | 120/min | ip | GET/HEAD health |

Observação de contrato: `setlist-read` e `content-read` são **chaves distintas** — o orçamento de leitura por uid é 300/min **por família**, 600/min somadas.

### 4.3 O que cobre a tela 1 e o que acontece num sync de biblioteca inteira ao abrir

Cobertura: `setlist-read` (setlists), `content-read` (content), `proxy` (arquivos via API) — ou **zero** para arquivos se o nativo baixar a URL pública direto (§3.3). `session` não é consumida (bearer direto, §1.6).

Estimativa por abertura, base = referência do B6 (3 setlists / 69 songs / 66 content / 7 objetos no bucket; B5 mediu 8 `file_url` não-nulas → 7 objetos distintos) `[análise sobre números de referência]`:

| Passo | Requests | Família | % da janela |
|---|---|---|---|
| Listar setlists (com músicas e `content_data`) | 1 | `setlist-read` | 0,3% |
| Listar content (`pageSize=100`, 66 itens) | ⌈66/100⌉ = 1 | `content-read` | 0,3% |
| Arquivos referenciados (7), **via proxy** | 7 | `proxy` | 5,8% |
| Arquivos referenciados (7), **URL pública direta** | 0 | — | 0 |
| **Total via API** | **9** (ou 2 sem proxy) | | |

Mesmo uma biblioteca 10× maior (660 content, 70 arquivos) cabe: 7 + 1 + 70 = 78 requests, 58% da janela de `proxy` num minuto — o único ponto que escala com arquivos é o proxy, e ele é evitável (§3). O risco real de 429 para o nativo é outro: **`authfail` por IP (30/5min)** sob CGNAT — um token expirado que o app reapresente em loop conta como falha (`firebase-server-utils.ts:176`) e o deny-fast nega **sem verificar** para todo o IP compartilhado. Requisito do PRD: **nunca reapresentar um token que já deu 401; renovar pelo SDK antes** (o SDK do Firebase já faz isso).

---

## M5 — Tamanho da biblioteca: comandos preparados (não executados)

**Declaração**: `GET /api/content` **devolve os corpos** (`select('*')` inclui `content_data` — §2.3), então o comando é `curl` + `jq`; `pageSize=100 ≥ 66` cobre a biblioteca de referência em **1 request** (`content-read`). `jq` disponível: `jq-1.7.1-apple`, `utf8bytelength` funciona (`echo '"abc"' | jq utf8bytelength` → `3`) `[medido]`.

Obtenção do token (Fase B; conta `USER_AUDIT` de `.env.uxaudit` — arquivo existe, 74 bytes, variáveis `USER_AUDIT`/`PASSWORD_AUDIT`, valores não lidos `[medido: cut -d= -f1]`): script tsx no scratchpad importando `getFirebaseCredentials()` de `scripts/ux-audit/auth.ts` (que também faz o POST de session — 1 request na família `session`, inevitável pelo desenho do módulo `:109-121`) e imprimindo o `idToken` numa variável de shell, nunca em arquivo:
```bash
set -a && source .env.local && source .env.uxaudit && set +a && \
  TOKEN=$(npx tsx -e 'import("./scripts/ux-audit/auth.ts").then(async m => { const c = await m.getFirebaseCredentials(); process.stdout.write(c.idToken) })')
```
(a) contagem por tipo, texto × arquivo, (b) soma de bytes de `content_data`, (c) maior corpo:
```bash
curl -s -H "Authorization: Bearer $TOKEN" "https://octavia.rocks/api/content?pageSize=100&page=1" -o "$SCRATCH/c-m5-content.json"
wc -c "$SCRATCH/c-m5-content.json"; sha256sum "$SCRATCH/c-m5-content.json"
jq '{total, page, pageSize, hasMore, totalPages, n: (.data|length)}' "$SCRATCH/c-m5-content.json"
# (a) por content_type, separando "com arquivo" (file_url != null: PDF/imagem) de "só texto"
jq '.data | group_by(.content_type) | map({content_type: .[0].content_type, n: length, com_file_url: (map(select(.file_url != null))|length), so_texto: (map(select(.file_url == null))|length), bytes_content_data: (map(.content_data|tojson|utf8bytelength)|add)})' "$SCRATCH/c-m5-content.json"
# (b) soma de bytes dos corpos (content_data serializado) e do payload inteiro
jq '[.data[] | (.content_data|tojson|utf8bytelength)] | add' "$SCRATCH/c-m5-content.json"
# (c) os 5 maiores corpos
jq '[.data[] | {id, title, content_type, file_url: (.file_url != null), bytes: (.content_data|tojson|utf8bytelength)}] | sort_by(-.bytes) | .[0:5]' "$SCRATCH/c-m5-content.json"
```
Se `hasMore == true` (biblioteca cresceu além de 100), repetir com `page=2` e concatenar (`jq -s '{data: (map(.data)|add)}'`). Controle: `total` deve bater com a contagem de referência (66) — divergência é achado, não erro.

---

## Plano da Fase B — campanha de probes de LEITURA em prod (proposta; NÃO executar)

Regras: conta `marcelviana+uxtester@gmail.com` (`.env.uxaudit`), token via `scripts/ux-audit/auth.ts`; alvo `https://octavia.rocks` (prod = `octavia-git-main-…`, leitura apenas); **zero escrita**; **um único usuário**; cada probe declara o que provaria se falhasse (regra nº 7 aplicada ao pre-check). Um script tsx no scratchpad (`c-probes.ts`) com `fetch` nativo do Node 22, sem `apiFetch` (que injeta bearer **e** cookie — inadequado para P2/P3), imprimindo status, headers relevantes e sha256 dos corpos; nada de token em log.

| Probe | Objetivo | Comando (essência) | Esperado | Se falhar, prova que… | Família consumida |
|---|---|---|---|---|---|
| **P1** | Controle: sem credencial | `GET /api/setlists` sem `Authorization` e sem `Cookie` | `401 {"error":"Authentication required","code":"AUTH_REQUIRED"}` + `WWW-Authenticate: Bearer` | 200: a rota está aberta (regressão grave); 429: IP já estourado em `authfail` — abortar campanha | nenhuma (ausência de token não conta — `firebase-server-utils.ts:169-171`) |
| **P2** ★ | **Decisivo**: bearer sem cookie | `GET /api/setlists` com `Authorization: Bearer $TOKEN`, sem `Cookie` | **200**, corpo JSON array (M1 §1.6) | 401: a cadeia A não aceita bearer em prod (contradiz o código lido — investigar deploy/Admin); 403/500: Admin mal configurado | `setlist-read` 1 |
| **P2b** | Controle negativo do P2: bearer inválido | idem com `Authorization: Bearer nao-e-um-token` | `401 AUTH_REQUIRED` | 200: a verificação não roda (catástrofe); confirma que o P2 passou por verificação real | `authfail` (ip) 1/30 |
| **P3** | Baseline cookie | `POST /api/auth/session {idToken}` (já feito pelo `signIn` do módulo) → `GET /api/setlists` com `Cookie: firebase-session=…`, sem `Authorization` | 200; `sha256(corpo) == 08ebfe43…` e `49.983` bytes (B6) **se os dados não mudaram** | sha diferente: dados mudaram desde o B6 (checar contagens 3/69/66) OU shape mudou (regressão) | `session` 1, `setlist-read` 1 |
| **P3×P2** | Byte-identidade bearer × cookie no mesmo instante | `Promise.all([P2, P3])` → comparar sha256 | sha iguais | diferentes: as cadeias entregam corpos distintos (ordem/shape) — bloqueia C-D1 até explicar | `setlist-read` 2 |
| **P3b** | Cadeia B com bearer (email verificado) | `GET /api/profile` só bearer | 200 (o `auth-check.ts` já obtém 200 com bearer+cookie; isola o bearer) | 401: conta de audit sem email verificado OU cadeia B rejeita o header — decide se as rotas da cadeia B entram no contrato sem B1.5 | `profile` 1/60 |
| **P4** | Bucket público hoje | `GET https://<supabase>/storage/v1/object/public/content-files/1786218427769-ux-audit-partitura-1p.pdf` **sem header nenhum** (path conhecido do B5, 20.821 bytes) | 200, `content-type: application/pdf`, 20.821 bytes | 400/403: bucket virou privado desde 2026-08-29 (mudança de contrato não registrada) — C-D2 muda de natureza | nenhuma família da API (Supabase direto) |
| **P4b** | O proxy entrega o mesmo objeto | `GET /api/proxy?url=<mesma URL>` só bearer | 200, mesmos bytes (sha256 igual ao P4) | 401: proxy não aceita bearer (contradiz cadeia A); bytes ≠: proxy altera corpo | `proxy` 1/120 |
| **P5** | Tamanho da biblioteca (M5) | os comandos do M5 (1 request) | `total == 66`, números de (a)(b)(c) | `total ≠ 66`: base mudou desde o B6 — atualizar referência antes de C-D3 | `content-read` 1 |
| **P6** (opcional) | Detalhe de setlist com bearer | `GET /api/setlists/<id da 1ª do P2>` só bearer | 200; `setlist_songs` idêntico ao item correspondente do P2 (ordem 1..N) | divergência: as duas leituras não concordam (delta de filtro `user_id`, §2.2) | `setlist-read` 1 |

**Orçamento somado** (uma execução): `setlist-read` 5/300 · `content-read` 1/300 · `proxy` 1/120 · `profile` 1/60 · `session` 1/120 · `authfail` (ip) 1/30 · Supabase direto 1. Reexecução completa cabe **50×** na menor janela sem tocar em nenhum teto. Pré-condição: **P1 primeiro** — se vier 429, o IP já está em deny-fast (`authfail`) e a campanha espera 5 min. Saídas literais (status + headers `www-authenticate`, `x-ratelimit-*`, `content-type`, `cache-control` + sha256 + tamanho) vão coladas no relatório da Fase B; corpos grandes vão para `docs/ux/C-PRECHECK-anexos/B-*.json` com `wc -c` + `sha256sum`.

---

## Perguntas de decisão C-D1…C-D6 (preparadas, não decididas)

### C-D1 — Transporte de auth do nativo e destino do B1.5

**Material**: M1 — 20/26 handlers `ambos`, 1 `bearer-only`, **zero `cookie-only`**; as 5 leituras da tela 1 na cadeia A (sem email verificado, sem cookie); o cookie É o idToken (§1.2); o web já é bearer-first (divergência 3); `POST /api/auth/session` não acrescenta nada ao nativo (§1.5); **vida efetiva do idToken no servidor até ~2h** (cache por string de token, TTL 1h contado da verificação + fallback a cache vencido em erro de infra — §1.4, `lib/firebase-server-utils.ts:98-114`): o servidor pode aceitar um token que o SDK do cliente já considera expirado; o nativo **não** deve contar com isso (renova pelo SDK), e o B1.5 decide se o cache passa a respeitar o `exp` do JWT.
**Pré-requisito de console (fora do escopo, `[hipótese]`)**: a Firebase **web API key** pode ter restrição por HTTP referrer no Google Cloud — um app Expo não envia `Referer` e seria barrado no `signInWithPassword`/refresh. O plano registra a key como **irrestrita** desde o incidente de 2026-08-11 (seção B10 / housekeeping nº 3) e o `scripts/ux-audit/auth.ts` (Node, sem Referer) autentica hoje — o que sugere irrestrita, mas o estado atual só se prova no console. **Passo do Marcel antes do C-D1 fechar; não é probe.**
**Recomendação**: **Bearer direto (Firebase SDK com refresh automático), exclusivo.** O nativo **não chama** `/api/auth/session`. Contrato a escrever (B7, tarefa de doc): `Authorization: Bearer <Firebase ID token>`, prefixo `Bearer ` literal (a cadeia A é case-sensitive — o SDK do Firebase produz isso; registrar como regra), e a lista das rotas que exigem **email verificado** (cadeia B: profile GET/PATCH, storage/*, todas as mutações via wrapper). **B1.5: desejável, não bloqueador** para a tela 1 (todas as suas rotas são cadeia A); **vira bloqueador da tela 2** (escrita) só se o Marcel quiser uma política única de email verificado — hoje `DELETE /api/setlists/[id]` (A, não exige) e `PUT /api/setlists/[id]` (B, exige) divergem numa mesma rota. Sugestão de recorte para o B1.5 quando vier: fundir os extratores (regex case-insensitive da B, sem fallback quando o header existe e está malformado) e decidir o TTL, mantendo um único `verifyIdToken`.

### C-D2 — Acesso ao storage para a tela 1 (B5-D3)

**Material**: M3 — zero URL assinada; proxy do servidor baixa sem credencial; `file_url` é coluna estável; o cache offline do web já baixa a URL pública direto; 7 objetos referenciados (B5).
**Recomendação**: **manter público (B5-D3) para a tela 1** e o nativo baixar `file_url` **direto**, sem proxy — zero custo de API, offline trivial (URL estável = chave de cache), e a família `proxy` sai do caminho do palco. Signed URL exigiria endpoint novo (assinar N URLs por abertura), expiração conflitando com cache offline e um segundo escritor de contrato — custo sem ganho para app de usuário único cujo risco é "quem tem a URL lê o arquivo" (aceito por escrito no STORAGE.md §1.3). **Reabrir apenas** se multiusuário entrar no PRD (o namespace flat do bucket, STORAGE.md §1.4, é a pendência real desse cenário). P4 confirma o estado antes do PRD fechar.

### C-D3 — Busca (B11/LIB-04): servidor × client-side sobre cache local

**Material**: M2 — `GET /api/content` já devolve os corpos, `pageSize ≤ 100`; `GET /api/setlists` embute `content_data` (49.983 bytes para 69 songs ≈ 700 B/song, B6 `[referência]`); a busca do servidor é `ILIKE` sem `unaccent`; requisito C4 "busca de dentro do palco" (item 26) tem de funcionar **offline**.
**Recomendação (condicionada ao P5)**: **client-side sobre o cache local**, com normalização de acentos no cliente (NFD + remoção de U+0300–U+036F — a mesma classe da D5′). Se P5 confirmar a ordem de grandeza (`[hipótese]`: 66 itens, corpos somando dezenas a poucas centenas de KB), a biblioteca inteira cabe em memória e a busca é instantânea e offline — o que o servidor jamais entregará no palco. **B11 deixa de bloquear a tela 1**; continua útil para o web e para uma biblioteca que um dia não caiba (P5 fixa o teto que dispararia a reversão: sugestão, corpos > ~5 MB).

### C-D4 — Modelo offline da tela 1: o quê, quando invalida, e o B9

**Material**: M2 — a resposta de `GET /api/setlists` é **autossuficiente** (setlists + músicas ordenadas + `content_data` + `file_url`); toda escrita em `setlist_songs` **bumpa `setlists.updated_at` na mesma transação** (RPCs do dump: `add_setlist_song`, `remove_setlist_song`, `reorder_setlist_songs`, `delete_content_resequence` — todas com `update setlists s set updated_at = now()`); edição do **texto** de um content **não** bumpa a setlist; nenhuma rota emite ETag (§2.3).
**Recomendação (revisada no aval da Fase A — concordo, e o motivo está no próprio material)**: `GET /api/setlists` embute `content_data`, mas a edição do texto de um content **não** bumpa `setlists.updated_at` — guardar o corpo também a partir da resposta de setlists criaria **duas cópias do mesmo corpo com dois relógios diferentes** (duas fontes de verdade; a de setlists ficaria stale sem sinal). Logo: o nativo usa a resposta de setlists **apenas para ordem, ids (`setlist_songs[].id`, `content_id`, `position`, `notes`) e metadados da setlist**, versionados por `setlists.updated_at`; **o corpo (`content_data`, `file_url`) é lido SEMPRE do cache de content, por `content_id`, versionado por `content.updated_at`** (`GET /api/content?pageSize=100&sortBy=updated`); arquivos por `file_url` (chave = a própria URL, imutável). Custo: o `content_data` embutido na listagem de setlists é **descartado** pelo nativo (payload redundante — o shape enxuto do B7/SET-22 vira otimização futura, não bloqueio). **Invalidação**: ao abrir e ao ganhar rede, refetch dos dois e substituição **sem merge** (a lição do SET-14: deleções em outro dispositivo não ressuscitam); `updated_at` por item decide o que re-renderizar/re-baixar. Sem ETag, o custo é o payload inteiro por abertura — aceitável pelo M4 (2 requests). **Implicação para o B9**: a tela 1 é somente leitura, **não tem fila de escrita** — o B9 (idempotência) **não bloqueia a tela 1**; ele é pré-requisito da **tela 2** (qualquer escrita enfileirável), e a chave de idempotência deve nascer junto do primeiro POST do nativo, não depois. Requisito derivado para o PRD: um indicador "garantido offline" (J6) = "todas as `file_url` das setlists com `performance_date` nos próximos 7 dias estão no cache" (a heurística já existe em `lib/advanced-content-cache.ts:183-204`).

### C-D5 — Cascata content×storage (B5-D6): relevante para a tela 1?

**Material**: M3/B5 — o delete de content não remove o objeto (órfão tipo A); órfãos tipo B (linha sem objeto) medidos **zero** no B5; o nativo só lê.
**Recomendação**: **não relevante para a tela 1**. O único efeito observável por um leitor seria um `file_url` apontando para objeto ausente (tipo B) — inexistente hoje e coberto por tratamento de 404 no download (requisito de robustez, não de contrato). Manter B5-D6 adiada; reabrir na tela 2 (quando o nativo passar a apagar content) junto com a reconciliação.

### C-D6 — Sync ao abrir × sob demanda, dado M4

**Material**: M4 — 2 requests de metadados por abertura (<1% das janelas), arquivos fora da API se público direto (C-D2); janelas por uid, não por IP (B1.3), exceto `authfail`.
**Recomendação**: **sync completo de metadados ao abrir** (setlists + content, 2 requests) **+ prefetch em background dos arquivos das setlists dos próximos 7 dias** + **sob demanda para o resto** (download ao entrar na setlist/música, com o indicador do C-D4). Custo de API por abertura ≈ 2; nenhuma família passa de 1%. Regra de defesa derivada do M4: renovação de token **antes** de qualquer request quando faltarem < 5 min para expirar (o `lib/auth-manager.ts:10` do web já usa esse buffer) e **zero retry com o mesmo token após 401** — protege o IP compartilhado (CGNAT) da janela `authfail`.

---

## Lista explícita do que ficou como `[hipótese]`

1. **Bucket `content-files` público HOJE** — última medição 2026-08-29 (B5); esta sessão não tocou rede. Prova: P4.
2. **Cadeia bearer entrega 200 em PROD** — provado só em código (§1.6); o deploy/Admin em prod não foi exercitado. Prova: P2/P2b.
3. **Byte-identidade bearer × cookie** — derivada da leitura (mesmo handler após o extrator); não medida. Prova: P3×P2.
4. **Estado `emailVerified` da conta de audit** — desconhecido; afeta só rotas da cadeia B (P3b), nenhuma da tela 1.
5. **Contagens de referência 3/69/66/7** — do encerramento do B6 (2026-09-01); podem ter mudado. Prova: P5 (`total`) + P2 (contagem de setlists/songs no corpo).
6. **Ordem de grandeza da biblioteca** (dezenas a centenas de KB de corpos) — extrapolação de 700 B/song do B6. Prova: P5.
7. **`Cache-Control: no-store` chega às respostas de `/api/*`** — o helper está no middleware, que exclui `/api`. Prova: headers de P3.
8. **Mecanismo pelo qual o item 9 da Fase D (setlist nunca visitada offline) funcionou** — `PAGE_CACHE` por URL ou `/offline`; fora do escopo, registrado para não virar premissa do PRD.
9. **Instâncias de lambda** — o teto efetivo de cada família é limite × instâncias (nota do próprio módulo); não medido, só afrouxa.
10. **`authfail` sob CGNAT é risco real** — análise, não medição; o PRD o trata como regra de cliente (C-D6), não como mudança de backend.
11. **Firebase web API key sem restrição de HTTP referrer** — estado de console (Google Cloud), não do repo; o plano a registra como irrestrita desde 2026-08-11 e o tooling Node autentica sem Referer. Checagem de console, passo do Marcel, antes do C-D1 fechar (não é probe).

---

## Anexos (`docs/ux/C-PRECHECK-anexos/`) `[medido]`

```
$ cd docs/ux/C-PRECHECK-anexos && wc -l A*.txt && sha256sum A*.txt
      59 A1-rotas-metodos.txt
     107 A2-grep-verificadores-auth.txt
     243 A3-cadeia-A-firebase-server-utils.txt
     378 A4-cadeia-B-secure-auth-utils.txt
      79 A5-grep-offline.txt
     217 A6-rate-limit.txt
     453 A7-handlers-GET-tela1.txt
     868 A8-palco-web-caminho-de-dados.txt
    2404 total
43e0d95cb2f04cdd96c51161f41022b65e32e2ec8f608dc0a1bdc607fc534104  A1-rotas-metodos.txt
fb1d0464dc1fd8aad8e554a3da51f541eb171b43ba33bae2776c9ea1c436cccc  A2-grep-verificadores-auth.txt
79925d144ec1703f4d0337ba8d5ac7c6a3b999ea2cbf05caec88506014e030fe  A3-cadeia-A-firebase-server-utils.txt
5b9d4b326c4a142c772770a37e20566c4e70db7ad8459082dbddc7d0af6c84e9  A4-cadeia-B-secure-auth-utils.txt
56d683098e2b31a72f621d3142acbbdec7a56382e31f7d1bea9dc101e8345cd3  A5-grep-offline.txt
3c5e12ac03b4defc0e087d3ceae89d9717b488619a2e96cb4d73794a618a9be6  A6-rate-limit.txt
6874ddae5c73bb73ee0285af06157f717fedeba302e917f3e65179f4e47df77e  A7-handlers-GET-tela1.txt
e7d7f7eb12f99123ec9390348302c5f454f8e491edc43dc4e4cefedfb8526c98  A8-palco-web-caminho-de-dados.txt
```
Cada anexo abre com o comando que o gerou (`$ …`) e contém a saída literal. Arquivos de teste com `Bearer` (referência de existência, `grep -rln Bearer --include='*.test.ts' app lib tests`): `app/api/auth/__tests__/session.test.ts`, `app/api/content/[id]/__tests__/route-rpc.test.ts`, `app/api/content/[id]/__tests__/route.test.ts`, `app/api/content/__tests__/route.test.ts`, `app/api/profile/__tests__/route.test.ts`, `app/api/proxy/__tests__/route.test.ts`, `app/api/setlists/__tests__/create-compensating.test.ts`, `app/api/setlists/__tests__/route.test.ts`, `app/api/setlists/songs/[songId]/__tests__/route.test.ts`, `app/api/storage/__tests__/delete.test.ts`, `app/api/storage/__tests__/list.test.ts`, `app/api/storage/__tests__/upload.test.ts`, `lib/__tests__/auth-mock-example.test.ts`, `lib/__tests__/contract-errors.test.ts`, `lib/__tests__/firebase-server-utils.test.ts`, `lib/__tests__/secure-auth-utils.test.ts`, `lib/__tests__/setlist-service.test.ts`, `tests/security/api-validation.security.test.ts`, `tests/security/auth-penetration-testing.test.ts`, `tests/security/owasp-top10-penetration.test.ts`.

**Estado ao fim da Fase A**: nenhum commit, branch, PR ou acesso de rede; `git status --short` → `?? docs/ux/C-PRECHECK-anexos/` + `?? docs/ux/C-PRECHECK.md`. Aval da Fase B concedido em 2026-09-04 com três correções (aplicadas acima: §1.3 contagem, §2.6 novo, §1.4/C-D1 vida do token, C-D4 revisada, hipótese 11) — a Fase B segue abaixo.


---

# Fase B — probes de LEITURA em prod (executada em 2026-09-04, após aval)

> **Alvo**: `https://octavia.rocks` (prod). **Conta**: `marcelviana+uxtester@gmail.com` (`USER_AUDIT` de `.env.uxaudit`; uid `Pw3bxXZw0iT3WwyL7kxGtGJIJH83`). **Zero escrita** (todos os probes são `GET`, exceto o `POST /api/auth/session` inevitável do `signIn` do módulo de auth — que grava cookie na resposta, não no banco). **Um único usuário.** Nenhum token/cookie em log, anexo ou arquivo (`grep -c 'eyJ'` em log, results e anexos → `0` em todos `[medido]`). Sem commit.

## B.0 Instrumento `[medido]`

- Script: `/tmp/c-probes-2026-09-04/c-probes.ts` (fora do repo; cópia verbatim em `C-PRECHECK-anexos/B0-c-probes.ts.txt`, 170 linhas, sha256 `f044dc8d80ae151ed8819bdf4a4579c3dccccd27503f48158950111de593bde0`). `SCRATCH=/tmp/c-probes-2026-09-04`, definido explicitamente; `results.json` e `run.log` vivem lá (log copiado verbatim em `B0-run.log.txt`, 34 linhas, sha256 `3d5c0a8faa5a9164b69c5b6c4cadf95793eee4fb82c500a8439accd043a26e4a`).
- **Env**: nenhum `source .env.local` no shell. O script importa `getFirebaseCredentials`/`getSessionCookie`/`BASE_URL` de `scripts/ux-audit/auth.ts`, cujo topo carrega env pelo mecanismo já em uso no tooling — verbatim `scripts/ux-audit/auth.ts:12-18`:
  ```
  12	import { config } from 'dotenv'
  13	
  14	config({ path: '.env.uxaudit', quiet: true })
  15	// .env.local fornece NEXT_PUBLIC_FIREBASE_API_KEY (a mesma API key pública do client)
  16	config({ path: '.env.local', quiet: true })
  17	
  18	export const BASE_URL = process.env.UX_AUDIT_BASE_URL || 'https://octavia.rocks'
  ```
  (`dotenv` trata o `FIREBASE_PRIVATE_KEY` multilinha entre aspas; caminhos relativos ao cwd = raiz do repo.) `NEXT_PUBLIC_SUPABASE_URL` lido de `process.env` para montar a URL do P4.
- Execução: `export SCRATCH=/tmp/c-probes-2026-09-04 && npx tsx "$SCRATCH/c-probes.ts" 2>&1 | tee "$SCRATCH/run.log"` — Node `v22.23.1`, `fetch` nativo, sem `apiFetch` (que injetaria bearer E cookie). Ordem fixa P1 → signIn → P2 → P2b → P3 → P3×P2 → P3b → P4 → P4b → P5 → P6 → P7; P1 em 429 abortaria (`process.exit(2)`) — não ocorreu.
- **Todo probe registrou**: `status`, `content-type`, `content-length`, `cache-control`, `www-authenticate`, `x-ratelimit-limit/remaining/scope`, tamanho real do corpo (`bytes`), `sha256` do corpo e `ms`.

## B.1 Saída literal da campanha (`run.log`, 34 linhas, verbatim) `[medido]`

```
BASE_URL=https://octavia.rocks
{"probe":"P1","url":"https://octavia.rocks/api/setlists","status":401,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":"Bearer","x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":58,"sha256":"3c1c84e32bf667c45ff94c75d5b223d2a8b81a96d4c75f4c8afcdb7094014111","ms":2014}
P1 body: {"error":"Authentication required","code":"AUTH_REQUIRED"}
VEREDITO P1: OK — status=401 www-authenticate=Bearer
signIn OK: uid=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 email=marcelviana+uxtester@gmail.com (token/cookie nunca impressos)
{"probe":"P2","url":"https://octavia.rocks/api/setlists","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":49983,"sha256":"08ebfe437cd81e52edd494bb037cc242f4c590ba9612da2bb87c1a1504e8cb01","ms":1520}
VEREDITO P2: OK — status=200 bytes=49983
P2 corpo: setlists=3 songs=69; ids=4340bf95-9e08-41a4-8da1-f725fc1c2350,00c2c1f4-4d20-4bfd-a152-7ae8e1a27c4f,8c4413d9-4c10-4691-b352-25a397cae2e3
P2 invariante 1..N: violações=0
{"probe":"P2b","url":"https://octavia.rocks/api/setlists","status":401,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":"Bearer","x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":58,"sha256":"3c1c84e32bf667c45ff94c75d5b223d2a8b81a96d4c75f4c8afcdb7094014111","ms":150}
P2b body: {"error":"Authentication required","code":"AUTH_REQUIRED"}
VEREDITO P2b: OK — status=401
{"probe":"P3","url":"https://octavia.rocks/api/setlists","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":49983,"sha256":"08ebfe437cd81e52edd494bb037cc242f4c590ba9612da2bb87c1a1504e8cb01","ms":303}
VEREDITO P3: OK — status=200 bytes=49983 sha=08ebfe43 (B6: 08ebfe43…, 49983 B)
{"probe":"P3xP2-cookie","url":"https://octavia.rocks/api/setlists","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":49983,"sha256":"08ebfe437cd81e52edd494bb037cc242f4c590ba9612da2bb87c1a1504e8cb01","ms":242}
{"probe":"P3xP2-bearer","url":"https://octavia.rocks/api/setlists","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":49983,"sha256":"08ebfe437cd81e52edd494bb037cc242f4c590ba9612da2bb87c1a1504e8cb01","ms":342}
VEREDITO P3xP2: OK — sha bearer=08ebfe437cd8 sha cookie=08ebfe437cd8
{"probe":"P3b","url":"https://octavia.rocks/api/profile","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":307,"sha256":"25e196f9627d19f05b304580d73f28e0988bd8b08992c59b4577233a730a7df7","ms":221}
P3b perfil: id=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 email=marcelviana+uxtester@gmail.com
VEREDITO P3b: OK — status=200
{"probe":"P4","url":"https://mlxjmpbdchmwplcfislt.supabase.co/storage/v1/object/public/content-files/1786218427769-ux-audit-partitura-1p.pdf","status":200,"content-type":"application/pdf","content-length":"20821","cache-control":"public, max-age=3600","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":20821,"sha256":"3d42199bc98fb2f93695323e7e3082378907236eeae11d982b63f85d990cdb48","ms":1493}
VEREDITO P4: OK — status=200 bytes=20821 ct=application/pdf (B5: 20821 B)
{"probe":"P4b","url":"https://octavia.rocks/api/proxy?url=<omitida>","status":200,"content-type":"application/pdf","content-length":"20821","cache-control":"public, max-age=3600","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":20821,"sha256":"3d42199bc98fb2f93695323e7e3082378907236eeae11d982b63f85d990cdb48","ms":664}
VEREDITO P4b: OK — status=200 sha igual ao P4=true
{"probe":"P5","url":"https://octavia.rocks/api/content?pageSize=100&page=1","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":52941,"sha256":"8e27a377255c074a23e01d279d585eda84ca52921e1d001fb8a91327a4e7ef08","ms":229}
VEREDITO P5: OK — status=200 bytes=52941
P5 meta: {"total":66,"page":1,"pageSize":100,"hasMore":false,"totalPages":1,"n":66}
{"probe":"P6","url":"https://octavia.rocks/api/setlists/4340bf95-9e08-41a4-8da1-f725fc1c2350","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":43288,"sha256":"27a07deab996dc8642af90c28495650e7c37614324f2816250b3073ceb070b8e","ms":336}
P6: setlist=4340bf95-9e08-41a4-8da1-f725fc1c2350 songs=60 setlist_songs idêntico ao item do P2=true
VEREDITO P6: OK — status=200 identico=true
{"probe":"P7","url":"https://octavia.rocks/api/content/2e98efc7-92ec-4a2b-b11f-8e2a92a9d46f","status":200,"content-type":"application/json","content-length":null,"cache-control":"public, max-age=0, must-revalidate","www-authenticate":null,"x-ratelimit-limit":null,"x-ratelimit-remaining":null,"x-ratelimit-scope":null,"bytes":629,"sha256":"4d723c7aa90ae1580328f9aaeb485b55ada73ad71587bc585687a0d74519ab12","ms":181}
P7: content_id=2e98efc7-92ec-4a2b-b11f-8e2a92a9d46f title="[UX-AUDIT] Partitura de 12 páginas" no P5=true content_data byte-idêntico ao P5=true bytes(content_data)=4
VEREDITO P7: OK — status=200 found=true identico=true
RESULTS gravados em /tmp/c-probes-2026-09-04/results.json (12 registros)
```

## B.2 Tabela probe × esperado × obtido × veredito `[medido]`

| Probe | Esperado | Obtido | Veredito |
|---|---|---|---|
| **P1** sem credencial | 401 `AUTH_REQUIRED` + `WWW-Authenticate: Bearer` | `401` · `{"error":"Authentication required","code":"AUTH_REQUIRED"}` · `www-authenticate: Bearer` · 58 B · sha `3c1c84e3…` · 2014 ms | **OK** |
| **P2 ★** bearer sem cookie | 200, array | `200` · 49.983 B · sha `08ebfe437cd81e52edd494bb037cc242f4c590ba9612da2bb87c1a1504e8cb01` · 3 setlists / 69 songs · invariante 1..N: **0 violações** · 1520 ms | **OK — o probe decisivo passou** |
| **P2b** bearer inválido | 401 | `401` · corpo **byte-idêntico ao P1** (mesmo sha `3c1c84e3…`) · 150 ms | **OK** (verificação real; sem oráculo entre "ausente" e "inválido") |
| **P3** cookie sem bearer | 200; sha `08ebfe43…`, 49.983 B | `200` · 49.983 B · sha `08ebfe437cd8…` **= B6** · 303 ms | **OK** (dados idênticos aos do encerramento do B6) |
| **P3×P2** `Promise.all` | shas iguais | bearer `08ebfe437cd8…` = cookie `08ebfe437cd8…`, ambos 200 | **OK — byte-identidade bearer × cookie** |
| **P3b** `/api/profile` só bearer (cadeia B) | 200 | `200` · 307 B · perfil `id=Pw3b…` `email=marcelviana+uxtester@gmail.com` · 221 ms | **OK** ⇒ conta de audit com **email verificado** (a cadeia B nega sem isso, `secure-auth-utils.ts:307`) |
| **P4** objeto público sem header | 200, `application/pdf`, 20.821 B | `200` · `content-type: application/pdf` · `content-length: 20821` · sha `3d42199b…` · `cache-control: public, max-age=3600` · 1493 ms | **OK — bucket público hoje** |
| **P4b** `/api/proxy` só bearer | 200, mesmos bytes | `200` · 20.821 B · sha `3d42199b…` **= P4** · 664 ms | **OK** |
| **P5** `/api/content?pageSize=100&page=1` | 200, `total == 66` | `200` · 52.941 B · `{"total":66,"page":1,"pageSize":100,"hasMore":false,"totalPages":1,"n":66}` · 229 ms | **OK** |
| **P6** `/api/setlists/4340bf95-…` só bearer | 200; `setlist_songs` ≡ item do P2 | `200` · 43.288 B · 60 songs · `setlist_songs` **idêntico** (JSON) ao item do P2 · 336 ms | **OK** |
| **P7** `/api/content/2e98efc7-…` só bearer | 200; `content_data` ≡ item do P5 | `200` · 629 B · `[UX-AUDIT] Partitura de 12 páginas` (Sheet, `content_data: null`) · presente no P5 · `content_data` idêntico (`null` = `null`) · 181 ms | **OK, evidência fraca** (comparou `null`) — fechada pelo cruzamento offline do B.4 |

Custo real da campanha (uma execução): `session` 1 (signIn) · `setlist-read` 5 (P2, P3, P3×P2 ×2, P6) · `content-read` 2 (P5, P7) · `proxy` 1 · `profile` 1 · `authfail` (ip) 1 (P2b) · Supabase direto 1 (P4) — **igual ao orçamento aprovado**. Tempo somado dos 12 requests: 7.695 ms (os dois primeiros hits, P1 e P2, a ~1,5–2 s — cold start `[hipótese]`; os demais 150–660 ms).

Corpos > 200 linhas (todos JSON de uma linha) em anexos, `wc -c` + `sha256sum` `[medido]`:
```
$ wc -c docs/ux/C-PRECHECK-anexos/B-*.json && sha256sum docs/ux/C-PRECHECK-anexos/B-*.json
   49983 docs/ux/C-PRECHECK-anexos/B-P2-setlists.json
   52941 docs/ux/C-PRECHECK-anexos/B-P5-content.json
   43288 docs/ux/C-PRECHECK-anexos/B-P6-setlist.json
     629 docs/ux/C-PRECHECK-anexos/B-P7-content-item.json
  146841 total
08ebfe437cd81e52edd494bb037cc242f4c590ba9612da2bb87c1a1504e8cb01  docs/ux/C-PRECHECK-anexos/B-P2-setlists.json
8e27a377255c074a23e01d279d585eda84ca52921e1d001fb8a91327a4e7ef08  docs/ux/C-PRECHECK-anexos/B-P5-content.json
27a07deab996dc8642af90c28495650e7c37614324f2816250b3073ceb070b8e  docs/ux/C-PRECHECK-anexos/B-P6-setlist.json
4d723c7aa90ae1580328f9aaeb485b55ada73ad71587bc585687a0d74519ab12  docs/ux/C-PRECHECK-anexos/B-P7-content-item.json
```
(os shas dos anexos são os mesmos registrados pelo script no momento da resposta — o arquivo é o corpo cru.) P7 (629 B), verbatim:
```
{"id":"2e98efc7-92ec-4a2b-b11f-8e2a92a9d46f","user_id":"Pw3bxXZw0iT3WwyL7kxGtGJIJH83","title":"[UX-AUDIT] Partitura de 12 páginas","artist":"Compositor Anônimo","album":null,"genre":null,"content_type":"Sheet","key":null,"bpm":null,"time_signature":"4/4","difficulty":null,"capo":null,"tuning":null,"tags":null,"notes":null,"content_data":null,"file_url":"https://mlxjmpbdchmwplcfislt.supabase.co/storage/v1/object/public/content-files/1786218429715-ux-audit-partitura-12p.pdf","thumbnail_url":null,"is_favorite":false,"is_public":false,"created_at":"2026-08-08T19:47:10.457+00:00","updated_at":"2026-08-08T19:47:10.457+00:00"}
```
Cabeçalhos das setlists (P2) e da setlist do P6, por `jq` sobre os anexos:
```
$ jq -c '.[] | {id, name, updated_at, n: (.setlist_songs|length), positions_ok: (.setlist_songs | to_entries | all(.value.position == .key + 1))}' docs/ux/C-PRECHECK-anexos/B-P2-setlists.json
{"id":"4340bf95-9e08-41a4-8da1-f725fc1c2350","name":"UX-AUDIT Estresse","updated_at":"2026-08-29T19:43:10.287+00:00","n":60,"positions_ok":true}
{"id":"00c2c1f4-4d20-4bfd-a152-7ae8e1a27c4f","name":"UX-AUDIT Show padrão","updated_at":"2026-08-08T20:01:24.728+00:00","n":8,"positions_ok":true}
{"id":"8c4413d9-4c10-4691-b352-25a397cae2e3","name":"UX-AUDIT Solo","updated_at":"2026-08-08T20:01:23.522+00:00","n":1,"positions_ok":true}
$ jq -c 'del(.setlist_songs) + {n_songs: (.setlist_songs|length), positions_ok: (.setlist_songs | to_entries | all(.value.position == .key + 1))}' docs/ux/C-PRECHECK-anexos/B-P6-setlist.json
{"id":"4340bf95-9e08-41a4-8da1-f725fc1c2350","user_id":"Pw3bxXZw0iT3WwyL7kxGtGJIJH83","name":"UX-AUDIT Estresse","description":null,"performance_date":null,"venue":null,"notes":null,"is_public":false,"created_at":"2026-08-08T20:01:30.217+00:00","updated_at":"2026-08-29T19:43:10.287+00:00","n_songs":60,"positions_ok":true}
```

## B.3 P5 ampliado — tamanho e forma real da biblioteca (M5) `[medido, jq sobre `B-P5-content.json`]`

```
$ jq -c '.data | group_by(.content_type) | map({content_type: .[0].content_type, n: length, com_file_url: (map(select(.file_url != null))|length), so_texto: (map(select(.file_url == null))|length), bytes_content_data: (map(.content_data|tojson|utf8bytelength)|add)})' B-P5-content.json
[{"content_type":"Chords","n":18,"com_file_url":3,"so_texto":15,"bytes_content_data":4887},{"content_type":"Lyrics","n":38,"com_file_url":0,"so_texto":38,"bytes_content_data":11594},{"content_type":"Sheet","n":2,"com_file_url":2,"so_texto":0,"bytes_content_data":8},{"content_type":"Tab","n":8,"com_file_url":0,"so_texto":8,"bytes_content_data":2992}]

$ jq '[.data[] | (.content_data|tojson|utf8bytelength)] | add' B-P5-content.json
19481

$ jq -c '[.data[] | {id, title, content_type, file_url: (.file_url != null), bytes: (.content_data|tojson|utf8bytelength)}] | sort_by(-.bytes) | .[0:5]' B-P5-content.json
[{"id":"fd053ce9-8e4b-4d0b-a445-d3752ec53df2","title":"[UX-AUDIT] Garota de Ipanema","content_type":"Chords","file_url":false,"bytes":465},{"id":"c40a3784-3bf5-4c13-8b70-69cf62baf5da","title":"[UX-AUDIT] Trenzinho do Caipira","content_type":"Tab","file_url":false,"bytes":374},{"id":"253e73c8-31fe-4ee2-8998-fa91bee1d337","title":"[UX-AUDIT] Lamentos do Morro","content_type":"Tab","file_url":false,"bytes":374},{"id":"4cc7cd86-e92d-4063-b19e-ff3514873cd9","title":"[UX-AUDIT] Sons de Carrilhões","content_type":"Tab","file_url":false,"bytes":374},{"id":"2abf142b-ae19-4427-81c8-310465c34903","title":"[UX-AUDIT] Manhã de Carnaval","content_type":"Tab","file_url":false,"bytes":374}]

$ jq -c '[.data[] | .content_data | if type=="object" then keys else [type] end] | flatten | group_by(.) | map({chave: .[0], n: length}) | sort_by(-.n)' B-P5-content.json
[{"chave":"lyrics","n":38},{"chave":"chords","n":15},{"chave":"tablature","n":8},{"chave":"null","n":5},{"chave":"annotations","n":1}]

$ jq '[.data[] | select(.content_data == null)] | length' B-P5-content.json
5

$ jq -c '{com_file_url: ([.data[] | select(.file_url != null)]|length), com_file_url_e_content_data_null: ([.data[] | select(.file_url != null and .content_data == null)]|length), sem_file_url_e_content_data_null: ([.data[] | select(.file_url == null and .content_data == null)]|length)}' B-P5-content.json
{"com_file_url":5,"com_file_url_e_content_data_null":5,"sem_file_url_e_content_data_null":0}

$ jq -c '[.data[] | .content_data | select(type=="object") | to_entries[] | {k: .key, t: (.value|type)}] | group_by(.k, .t) | map({chave: .[0].k, tipo: .[0].t, n: length}) | sort_by(.chave)' B-P5-content.json
[{"chave":"annotations","tipo":"array","n":1},{"chave":"chords","tipo":"string","n":15},{"chave":"lyrics","tipo":"string","n":38},{"chave":"tablature","tipo":"string","n":8}]

$ jq -c '{max_lyrics_bytes: ([.data[] | .content_data.lyrics? // "" | utf8bytelength] | max), itens_com_lyrics: ([.data[] | select(.content_data.lyrics? != null)] | length)}' B-P5-content.json
{"max_lyrics_bytes":307,"itens_com_lyrics":38}
```

Leitura dos números `[medido]`:
- **66 content** = 38 Lyrics + 18 Chords + 8 Tab + 2 Sheet. **5 com `file_url`** (3 Chords + 2 Sheet) — todos com `content_data: null`; **61 só texto**, nenhum deles com `content_data` nulo. (A conta de audit tem 5 `file_url` distintas entre os 7 objetos do bucket; os outros 2 objetos são de outras contas — B5 §2.4 `[referência]`.)
- **Soma dos corpos: 19.481 bytes**; **maior corpo individual: 465 bytes** (uma cifra); payload inteiro da listagem: 52.941 bytes.
- **Chaves reais de `content_data`**: `lyrics` (string, 38), `chords` (**string**, 15), `tablature` (string, 8), `annotations` (**array**, 1), e `null` (5). **`sections` e `file` — as chaves que o consumidor do palco lê (`hooks/use-songs-transformation.ts:39-47`) — não existem em nenhum item**; `tablature` (8 itens) e `annotations` (1) existem e **o palco não as lê**. O consumidor de referência casa com **2 das 4 chaves reais** (`lyrics`, `chords`), e `chords` é cifra-string, não estrutura. Confirma o achado do §2.6 com dados: **o shape interno de `content_data` precisa de contrato escrito no PRD** (por `content_type`: `Lyrics→lyrics`, `Chords→chords`, `Tab→tablature`, `Sheet→file_url` + `content_data null`; `annotations` como array — dado greenfield do B2/B5, 1 ocorrência).

## B.4 Cruzamento offline P2 × P5 (fecha a byte-identidade listagem × content sem rede) `[medido]`

```
$ jq -n -c --slurpfile s B-P2-setlists.json --slurpfile c B-P5-content.json '($c[0].data | map({key: .id, value: .}) | from_entries) as $byId | [ $s[0][] | .setlist_songs[] | . as $song | ($byId[$song.content_id]) as $item | { content_id: $song.content_id, no_P5: ($item != null), content_data_igual: (($item != null) and (($song.content.content_data|tojson) == ($item.content_data|tojson))), file_url_igual: (($item != null) and ($song.content.file_url == $item.file_url)), title_igual: (($item != null) and ($song.content.title == $item.title)) } ] | { songs: length, no_P5: (map(select(.no_P5))|length), content_data_igual: (map(select(.content_data_igual))|length), file_url_igual: (map(select(.file_url_igual))|length), title_igual: (map(select(.title_igual))|length), content_ids_distintos: (map(.content_id)|unique|length) }'
{"songs":69,"no_P5":69,"content_data_igual":69,"file_url_igual":69,"title_igual":69,"content_ids_distintos":60}

$ jq '[.[] | .setlist_songs[] | .content.content_data | tojson | utf8bytelength] | add' B-P2-setlists.json
21423

$ jq -c '.[0].setlist_songs[0].content | keys' B-P2-setlists.json
["artist","bpm","content_data","content_type","file_url","id","key","title"]
```
**69/69** músicas das 3 setlists apontam para content presente no P5, com `content_data`, `file_url` e `title` **byte-idênticos** entre a listagem de setlists e a de content (60 `content_id` distintos — há bis/repetições, permitidos desde a MIG-1). O corpo embutido nas setlists soma **21.423 bytes** (43% dos 49.983 B da resposta) — é o que o C-D4 revisado descarta.

## B.5 Achados novos da Fase B (não previstos na Fase A)

1. **`Cache-Control` das respostas de `/api/*` é `public, max-age=0, must-revalidate`** — em TODOS os 10 hits à API (P1–P3b, P5–P7), 200 e 401 `[medido, B.1]`. O `no-store` de `lib/security-headers.ts:256` **não chega** à API (hipótese 7 resolvida: o helper roda no middleware, que exclui `/api`). O valor observado é o default da plataforma para respostas dinâmicas `[hipótese quanto à origem exata: Next/Vercel]`. `public` numa resposta **autenticada e por usuário** é, em RFC 7234 §3.2, autorização explícita para cache compartilhado (com `max-age=0`+`must-revalidate` e sem `ETag`, a reutilização exige refetch — risco prático baixo). Não bloqueia a tela 1; **registro para o backlog do Bloco B** (um `Cache-Control: no-store` ou `private` emitido pelas rotas, ponto único em `lib/api-errors.ts`/`NextResponse.json`), e o **nativo não deve depender de cache HTTP** (o C-D4 já assume isso).
2. **O proxy repassa o `Cache-Control: public, max-age=3600` do Supabase** (P4b = P4), vindo do `cacheControl: '3600'` do upload (`app/api/storage/upload/route.ts:105`) — consistente com objeto imutável por URL.
3. **`content-length` ausente** nas respostas JSON da API (transfer chunked/comprimido); presente só no objeto do storage e no proxy. O nativo mede progresso de download só nos arquivos — para JSON, o tamanho é o do corpo (49.983 / 52.941 / 43.288 B).
4. **Nenhum header `X-RateLimit-*` em respostas 200/401** — os headers só existem no 429 (`lib/user-rate-limit.ts:125-137`). O nativo não tem como observar o saldo da janela antes de estourar; com os orçamentos do M4 isso é irrelevante para a tela 1.
5. **Uma setlist de 60 músicas custa 43.288 bytes** no detalhe (P6) e a listagem inteira 49.983 B — o shape enxuto do B7 (SET-22) continua sendo **otimização**, não bloqueio (C-D4).
6. **Os 401 de "sem credencial" e "credencial inválida" são byte-idênticos** (P1 = P2b, sha `3c1c84e3…`) — o contrato de erro (`AUTH_REQUIRED` sem oráculo de motivo) confirmado ao vivo.
7. **Limitação declarada do P7**: a 1ª música da 1ª setlist é um Sheet com `content_data: null`; a identidade provada pelo P7 é `null = null`. O cruzamento B.4 (69/69 byte-idênticos, offline) cobre o que o P7 sozinho não cobre. Não foi gasto request adicional (orçamento aprovado de `content-read` = 2).

## B.6 Revisão de C-D1…C-D6 à luz do medido

| Decisão | O que a medição confirmou | O que mudou |
|---|---|---|
| **C-D1** transporte | **Bearer sem cookie → 200 em prod** (P2), byte-idêntico ao cookie (P3×P2), 401 real para token inválido (P2b), cadeia B também aceita bearer e a conta tem email verificado (P3b). `WWW-Authenticate: Bearer` presente nos 401. | Nada muda na recomendação (bearer direto, exclusivo; B1.5 desejável). **Promovido a `[medido]`**. Pendências que ficam: contrato escrito (B7) e a checagem de console da API key (hipótese 11). |
| **C-D2** storage | **Bucket público hoje** (P4: 200 anônimo, 20.821 B) e o proxy entrega bytes idênticos (P4b). | Nada muda: público mantido, download direto pela `file_url`. Achado 2 (max-age=3600 no objeto) reforça: URL imutável = chave de cache. |
| **C-D3** busca | **Biblioteca: 66 itens, 19.481 B de corpos, maior corpo 465 B, payload 52.941 B** (P5). Uma ordem de grandeza abaixo do que a hipótese 6 supunha. | **Condição satisfeita**: busca client-side sobre o cache local, com normalização de acentos no cliente. B11 não bloqueia a tela 1. Teto de reversão sugerido mantido (corpos > ~5 MB — hoje 0,4% disso). |
| **C-D4** offline | 69/69 `content_data`/`file_url` idênticos entre setlists e content (B.4); `updated_at` por setlist presente e distinto (P2); sem ETag e com `Cache-Control: public, max-age=0` (achado 1). | Recomendação revisada do aval **confirmada**: setlists só para ordem/ids/metadados; corpo sempre do cache de content por `content_id`, versionado por `content.updated_at`. **Novo insumo**: o contrato interno de `content_data` (B.3 — `lyrics`/`chords`/`tablature` strings, `annotations` array, `sections`/`file` inexistentes) é o que o renderer nativo deve consumir; o nativo **não** deve confiar em cache HTTP. B9 segue não-bloqueador da tela 1. |
| **C-D5** cascata | Os 5 `file_url` da conta apontam para objetos existentes (P4 provou 1 diretamente; os demais `[referência B5: órfãos tipo B = 0]`). | Nada muda: não relevante para a tela 1. |
| **C-D6** sync | Abertura completa = 2 requests JSON (≈103 KB) + arquivos direto do bucket; latência quente 150–340 ms por request, fria ~1,5–2 s. | Nada muda: sync completo de metadados ao abrir + prefetch 7 dias + sob demanda. A latência fria justifica **cache-first na abertura** (renderiza do cache, revalida atrás — o mesmo desenho do SET-14 do web). |

## B.7 Hipóteses — o que foi promovido a `[medido]`, o que permanece

| # | Hipótese da Fase A | Estado após a Fase B |
|---|---|---|
| 1 | Bucket público hoje | **`[medido]`** — P4: 200 anônimo, `application/pdf`, 20.821 B |
| 2 | Cadeia bearer entrega 200 em prod | **`[medido]`** — P2 200; P2b 401 (controle) |
| 3 | Byte-identidade bearer × cookie | **`[medido]`** — P3×P2 shas iguais (`08ebfe437cd8…`) |
| 4 | `emailVerified` da conta de audit | **`[medido]`** — P3b 200 pela cadeia B ⇒ verificado |
| 5 | Contagens 3/69/66/7 | **`[medido]` 3/69/66** (P2, P5); **bucket = 7 permanece `[referência B5/B6]`** (P4 provou 1 objeto; não houve listagem — `GET /api/storage/list` custaria `storage` 1/60 e não estava no plano aprovado) |
| 6 | Ordem de grandeza da biblioteca | **`[medido]`** — 19.481 B de corpos; 465 B máximo; 52.941 B de payload |
| 7 | `Cache-Control: no-store` chega a `/api/*` | **`[medido]`: NÃO chega** — `public, max-age=0, must-revalidate` em 10/10 respostas (achado 1); a **origem** do default permanece `[hipótese]` |
| 8 | Mecanismo do item 9 (offline, setlist nunca visitada) | permanece `[hipótese]` (fora do escopo) |
| 9 | Instâncias de lambda (teto = limite × instâncias) | permanece `[hipótese]` (só afrouxa) |
| 10 | `authfail` sob CGNAT | permanece `[análise]` — regra de cliente no PRD |
| 11 | API key sem restrição de referrer | permanece `[hipótese]` — **checagem de console, passo do Marcel**; o `signIn` do tooling (Node, sem `Referer`) funcionou nesta campanha, o que é consistente com "irrestrita", não prova |
| 12 (nova) | Cold start explica os 1,5–2 s de P1/P2 | `[hipótese]` — dois primeiros hits da campanha; não medido em separado |
| 13 (nova) | Origem do `Cache-Control: public, max-age=0, must-revalidate` (Next × Vercel) | `[hipótese]` — o valor é medido, a causa não |

## B.8 Anexos da Fase B e estado final `[medido]`

```
$ (cd docs/ux/C-PRECHECK-anexos && wc -l B0-*.txt && sha256sum B0-*.txt)
     170 B0-c-probes.ts.txt
      34 B0-run.log.txt
     204 total
f044dc8d80ae151ed8819bdf4a4579c3dccccd27503f48158950111de593bde0  B0-c-probes.ts.txt
3d5c0a8faa5a9164b69c5b6c4cadf95793eee4fb82c500a8439accd043a26e4a  B0-run.log.txt
```
Anexos `B-P2/P5/P6/P7` (bytes + sha) no B.2; anexos `A1…A8` inalterados (shas do §Anexos da Fase A). Estado do repositório ao fim: **nenhum commit, branch ou PR**; `git status --short` → `?? docs/ux/C-PRECHECK-anexos/` + `?? docs/ux/C-PRECHECK.md`. Escrita em prod: **zero** (o único POST foi o `/api/auth/session` do `signIn`, que só emite `Set-Cookie`). Saldo: setlists 3 → 3 · songs 69 → 69 · content 66 → 66 (leitura antes = leitura depois por construção: nenhum probe escreve).
