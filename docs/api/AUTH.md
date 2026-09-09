# Contrato de auth da API Octavia (lado do servidor)

> **Origem**: bloco B7 (2026-09; pre-check em
> [`docs/ux/B7-PRECHECK.md`](../ux/B7-PRECHECK.md) §3 H-C7, decisão
> **B7-D7**), a partir do inventário do Bloco C
> ([`docs/ux/C-PRECHECK.md`](../ux/C-PRECHECK.md) §1). Este documento
> contrata POR ESCRITO **o que o servidor aceita como credencial** em cada
> rota de `app/api/*` e o que faz com ela. O lado do cliente (o que o
> nativo envia) vive no [`PRD-TELA-1.md`](../native/PRD-TELA-1.md) §3 —
> não é duplicado aqui (§5). Erros: toda não-2xx fala o envelope de
> [`CONTRATO-DE-ERRO.md`](CONTRATO-DE-ERRO.md) (`AUTH_REQUIRED` 401,
> `RATE_LIMITED` 429). Referência de conveniência entre docs — docs
> independentes, sem link normativo.
>
> Tudo o que está em `arquivo:linha` foi medido no HEAD `76c87c8`
> (2026-09-08). Este doc **descreve**; não corrige — divergências
> conhecidas ficam registradas no §6 e a correção é código (B1.5, fila da
> tela 2).

## 1. Credencial: o que É e como chega

- A credencial é sempre um **Firebase ID token** (JWT de 1h emitido pelo
  SDK). Não existe outro tipo: o "cookie de sessão" (`firebase-session`,
  gravado por `POST /api/auth/session`) **é o próprio ID token**
  (`app/api/auth/session/route.ts:64-65`:
  `` `${SESSION_COOKIE_NAME}=${idToken}` ``), com `HttpOnly; Max-Age=604800;
  Path=/; SameSite=Lax` e `Secure` em prod (`:64-71`). O único verificador
  do repo é `verifyFirebaseToken` do firebase-admin, chamado pelas duas
  cadeias (`lib/firebase-server-utils.ts:88-89`,
  `lib/secure-auth-utils.ts:180-181`).
- Dois transportes: header `Authorization: Bearer <token>` **ou** cookie
  `firebase-session=<token>`. **O header tem precedência**: nas duas
  cadeias o cookie só é lido quando não há header
  (`firebase-server-utils.ts:154-158`, `secure-auth-utils.ts:266-277`).
- **Cache HTTP**: toda resposta de `/api/*` **exceto `/api/proxy`** sai com
  `Cache-Control: private, no-store` (`headers()` do `next.config.mjs`,
  B7-PR3; gate `tests/config/next-headers.test.ts`); `/api/proxy` repassa o
  `Cache-Control` do upstream (`app/api/proxy/route.ts:71-74`).
- Toda verificação roda **só no runtime Node** das rotas
  (`process.env.NEXT_RUNTIME !== 'edge'`, `firebase-server-utils.ts:83`,
  `secure-auth-utils.ts:171`). O `middleware.ts` é **otimista**: checa só
  presença + forma do cookie (`JWT_SHAPE`, `middleware.ts:19,46-47`) para
  redirecionar páginas, **exclui `/api` por matcher** (`middleware.ts:58-67`)
  e não autentica nenhuma rota de API.

## 2. As duas cadeias de verificação `[medido]`

| | **Cadeia A** — `requireAuthServer` | **Cadeia B** — `requireAuthServerSecure` |
|---|---|---|
| Arquivo | `lib/firebase-server-utils.ts:137-179` | `lib/secure-auth-utils.ts:244-320` |
| Deny-fast por IP (antes de ler a credencial) | `authFailureLimited(clientIp)` → `null` (`:148-151`) | idem (`:255-258`) |
| Parse do header `Authorization` | `authHeader.startsWith('Bearer ')` — **case-sensitive**, exatamente um espaço; token = `substring(7)` (`:154-155`). Header presente mas fora desse formato → cai no cookie | regex `/^Bearer\s+(.+)$/i` — **case-insensitive**, um ou mais espaços (`:268-270`). Header presente mas fora desse formato → **`null` imediato**, sem olhar o cookie (`:271-274`) |
| Parse do cookie | `split(';')` + `startsWith('firebase-session=')` + `substring` (`:158-165`) — valor literal | regex `/firebase-session=([^;]+)/` + **`decodeURIComponent`** (`:277-281`) |
| Verificador | `validateFirebaseTokenServer` (`:63-131`) | `validateFirebaseTokenSecure` (`:143-238`) |
| Cache do resultado (chave = string do token) | **1 h** contada da verificação (`:98-101`: `exp: now + 60 * 60 * 1000`); em erro de infra do SDK, **serve o cache vencido** (`:107-114`) | **5 min** (`SECURITY_CONFIG.TOKEN_CACHE_DURATION_MS`, `:11`; `:225-231`); teto de 1000 entradas (`:15`); erro de infra → `isValid:false` (`:198-201`), sem fallback |
| Blacklist de token | não existe | `tokenBlacklist` consultada antes de tudo (`:156-160`); `blacklistToken` por 30 min (`BLACKLIST_DURATION_MS`, `:17`; `:96-110`) — chamada quando o erro contém `revoked`/`expired` (`:296-298`); **dormante na prática** (a mensagem de erro é sempre `Token verification failed`, `:196-197` — nota do desenho da B1.1) |
| Credencial inválida | `recordAuthFailure(clientIp)` + `null` (`:171-174`) | idem (`:290-293`) |
| **Email verificado** | **não exige** — devolve o user com `emailVerified` informativo | **exige** `user.emailVerified === true`, salvo `allowUnverifiedEmail: true` (`:305-310`) |
| Resposta do handler quando `null` | `authRequired()` → 401 `AUTH_REQUIRED` + `WWW-Authenticate: Bearer` (`lib/api-errors.ts:113-117`) — **também quando o deny-fast por IP negou** | idem; nas rotas via `withValidation`, IP estourado recebe **429** estruturada (`lib/api-validation-middleware.ts:101-109`) |

Consequência para o cliente: o corpo do 401 é **byte-idêntico** para "sem
credencial", "credencial inválida" e "IP em deny-fast" nas rotas da
cadeia A (sem oráculo — regra do contrato de erro).

## 3. Rota × cadeia × cookie × email verificado

Inventário gerado por (HEAD `76c87c8`):

```
$ find app/api -name route.ts | sort                                  → 15 rotas
$ grep -rn "requireAuthServer\b\|requireAuthServerSecure(\|withBodyValidation(\|withPublicBodyValidation(\|validateFirebaseTokenServer(" app/api --include=route.ts | grep -v import
```

| Rota | Método | Cadeia | Aceita cookie | Exige email verificado | Família de rate limit (por uid, salvo nota) | Onde |
|---|---|---|---|---|---|---|
| `/api/content` | GET | A | sim | não | `content-read` 300/min | `content/route.ts:19,25` |
| `/api/content` | POST | A | sim | não | `content-mutate` 120/15min | `:149,155` |
| `/api/content` | PUT | A | sim | não | `content-mutate` | `:225,231` |
| `/api/content` | DELETE | A | sim | não | `content-mutate` | `:305,311` |
| `/api/content/[id]` | GET | A | sim | não | `content-read` | `content/[id]/route.ts:16,21` |
| `/api/content/[id]` | DELETE | A | sim | não | `content-mutate` | `:78,83` |
| `/api/setlists` | GET | A | sim | não | `setlist-read` 300/min | `setlists/route.ts:14,19` |
| `/api/setlists` | POST | **B** (`withBodyValidation`) | sim | **sim** | `setlist-mutate` 120/15min | `:91-92` |
| `/api/setlists/[id]` | GET | A | sim | não | `setlist-read` | `setlists/[id]/route.ts:18,23` |
| `/api/setlists/[id]` | PUT | **B** | sim | **sim** | `setlist-mutate` | `:147-148` |
| `/api/setlists/[id]` | DELETE | A | sim | não | `setlist-mutate` | `:320,325` |
| `/api/setlists/[id]/songs` | POST | **B** | sim | **sim** | `setlist-mutate` | `setlists/[id]/songs/route.ts:13-14` |
| `/api/setlists/[id]/songs/order` | PUT | **B** | sim | **sim** | `setlist-mutate` | `…/order/route.ts:17-18` |
| `/api/setlists/songs/[songId]` | DELETE | A | sim | não | `setlist-mutate` | `setlists/songs/[songId]/route.ts:27,32` |
| `/api/proxy` | GET | A (só com Supabase configurado; sem ele, sem auth e limite por IP) | sim | não | `proxy` 120/min | `proxy/route.ts:49-59` |
| `/api/profile` | GET | **B** | sim | **sim** | `profile` 60/15min | `profile/route.ts:19,24` |
| `/api/profile` | POST | **B** | sim | **não** (`allowUnverifiedEmail: true` — signup) | `profile` | `:55-58` |
| `/api/profile` | PATCH | **B** | sim | **sim** | `profile` | `:126-128` |
| `/api/storage/upload` | POST | **B** | sim | **sim** | `storage` 60/h | `storage/upload/route.ts:15,19` |
| `/api/storage/list` | GET | **B** | sim | **sim** | `storage` | `storage/list/route.ts:22,27` |
| `/api/storage/delete` | POST | **nenhuma das duas**: parse inline `startsWith('Bearer ')` + `validateFirebaseTokenServer` (validador da A) | **não** (bearer-only) | **não** | `storage` | `storage/delete/route.ts:14-25` |
| `/api/auth/session` | POST | pública (`withPublicBodyValidation`); valida o `idToken` **do corpo** com `validateFirebaseTokenSecure` e grava o cookie | — | não | `session` 120/15min por uid (token válido) · `session-authfail` 10/15min **por IP** (token inválido) | `auth/session/route.ts:20-56` |
| `/api/auth/session` | DELETE | pública; apaga o cookie | — | — | `session-delete` 30/15min **por IP** | `:85-96` |
| `/api/health` | GET, HEAD | pública | — | — | `health` 120/min **por IP** | `health/route.ts:7-12,20-25` |
| `/api/debug/config` | GET | **nenhuma** (404 se `NODE_ENV === 'production'`) | — | — | nenhuma | `debug/config/route.ts:7-8` — **remoção na B7-PR2** |

Totais: 26 handlers — cadeia A 11 · cadeia B 9 · bearer-only inline 1 ·
públicas 4 · sem auth 1 = 26. **Zero rotas cookie-only.**

## 4. Rate limits por família (`lib/user-rate-limit.ts:41-62`, verbatim)

```ts
export const RATE_LIMITS = {
  /** POST /api/auth/session com token válido (por uid) */
  SESSION: { windowMs: 15 * 60_000, max: 120 },
  /** POST /api/auth/session com token INVÁLIDO (por IP — brute force) */
  SESSION_AUTH_FAIL: { windowMs: 15 * 60_000, max: 10 },
  /** DELETE /api/auth/session (logout; por IP — logout com token morto deve funcionar) */
  SESSION_DELETE: { windowMs: 15 * 60_000, max: 30 },
  /** Auth falhada em qualquer rota autenticada (por IP, nos funis de auth) */
  AUTH_FAIL: { windowMs: 5 * 60_000, max: 30 },
  /** Leituras (content/setlists GET) — performance mode nunca pode engasgar */
  READ: { windowMs: 60_000, max: 300 },
  /** Mutações (content/setlists POST/PUT/DELETE/PATCH) — montagem de setlist de 56 canções cabe 2× */
  MUTATE: { windowMs: 15 * 60_000, max: 120 },
  /** Perfil (GET/POST/PATCH) — 1× por load + retry */
  PROFILE: { windowMs: 15 * 60_000, max: 60 },
  /** storage upload/delete — subir um repertório inteiro numa sessão */
  STORAGE: { windowMs: 60 * 60_000, max: 60 },
  /** /api/proxy — biblioteca cheia busca dezenas de assets por load */
  PROXY: { windowMs: 60_000, max: 120 },
  /** /api/health (pública; por IP) */
  HEALTH: { windowMs: 60_000, max: 120 },
} as const
```

Famílias efetivas (string usada na chave): `content-read`, `content-mutate`,
`setlist-read`, `setlist-mutate` (as quatro sobre `READ`/`MUTATE`),
`profile`, `storage`, `proxy`, `health`, `session`, `session-authfail`,
`session-delete`, `authfail`. Chave por uid = `user:<uid>:<familia>`; por IP
= `ip:<ip>:<familia>`, com o IP de `x-forwarded-for[0]` ou `x-real-ip`
(`lib/user-rate-limit.ts:149-153`).

**`authfail` (deny-fast)**: toda credencial **inválida** (não a ausência
de credencial) conta na janela `AUTH_FAIL` do IP
(`recordAuthFailure`, `:162-164`); IP com a janela estourada é negado
**sem verificar** (`authFailureLimited`, `:166-168`) — 401 nos handlers da
cadeia A, 429 nas rotas via `withValidation` e no `POST /api/auth/session`.
O limite é por instância (memória do processo) — teto efetivo = limite ×
instâncias (hipótese H9 do PRD, aceita).

## 5. Lado do cliente

O contrato do cliente nativo é o [`PRD-TELA-1.md`](../native/PRD-TELA-1.md)
§3, T1-R1…R6: bearer exclusivo com prefixo literal `Bearer ` (a cadeia A é
case-sensitive — o cliente **não** conta com a tolerância da B), zero
cookie, zero `/api/auth/session`, renovação pelo SDK com buffer < 5 min,
401 nunca retentado com o mesmo token (cada 401 inválido conta no
`authfail` do IP), 429 honrando `Retry-After`. O web usa o mesmo transporte
para toda chamada de API a partir do browser (`lib/content-service.ts` 5,
`lib/setlist-service.ts` 7, `contexts/firebase-auth-context.tsx` 5 fetches
com `Authorization: Bearer`); o cookie serve às páginas (server
components via `getServerSideUser`) e aos fetches de `/api/proxy` sem
header (`lib/offline-cache.ts:173`, `lib/advanced-content-cache.ts:310`).

## 6. Divergências conhecidas — registradas, não corrigidas

Correção é código (fusão das cadeias, item **B1.5** do plano, fila da
tela 2); nada abaixo muda com este documento.

1. **`POST /api/storage/delete` é bearer-only e não exige email
   verificado**, ao contrário das outras duas rotas de storage (cadeia B).
   Rota interna/tooling (B5-D6); o consumidor já manda bearer
   (`scripts/storage/reconcile.ts:59-60` `authHeaders` →
   `Authorization: Bearer ${token}`; `:249-251` o POST a
   `/api/storage/delete` usa `authHeaders(token)`) `[medido]`.
2. **Cadeia A é case-sensitive (`startsWith('Bearer ')`), cadeia B é
   case-insensitive (`/^Bearer\s+/i`)** — `bearer x` passa na B e cai no
   cookie na A; header malformado é `null` imediato na B e ignorado na A.
3. **Cadeia B decodifica o cookie (`decodeURIComponent`); a A lê o valor
   literal.** Indiferente para o ID token real (base64url não tem `%`),
   mas é comportamento distinto.
4. **TTLs de cache diferentes (A 1 h com fallback em erro de infra; B 5
   min sem fallback)** — a vida efetiva de um token revogado difere por
   rota; o cache nunca lê o `exp` do JWT (item B1.5: "cache respeitar
   `exp`").
5. **Blacklist da B é dormante** (condição por string de erro que nunca
   ocorre) — acordá-la é decisão do B1.5.
6. **`/api/proxy` sem Supabase configurado não autentica** (limite por IP)
   — só em dev; em prod `isSupabaseConfigured` é verdadeiro.
7. **`/api/debug/config` sem auth** (404 em prod por `NODE_ENV`) — sai na
   B7-PR2.
8. **O cookie `firebase-session` tem `Max-Age=604800` (7 d) e carrega um
   ID token de 1 h** (`app/api/auth/session/route.ts:64-71`); após 1 h o
   middleware otimista (`middleware.ts:19,46-47`) deixa a página passar e a
   API responde 401 — terreno do D8 (Bloco D).
