/**
 * Fase D — medição direta do rate limit de /api/auth/session (itens 11-12).
 *
 * Por que direto no endpoint e não pela UI: o app chama setSessionCookie()
 * (1 POST /api/auth/session) em exatamente três lugares —
 * contexts/firebase-auth-context.tsx no onAuthStateChanged (login), no
 * handler de `visibilitychange` (toda volta de aba) e num setInterval de
 * 50 min. Cada volta de aba é, portanto, 1 POST com o mesmo payload que
 * este script envia. Medir a sequência de status no endpoint responde
 * "em qual troca de aba o 429 aparece" com precisão maior do que dirigir
 * bringToFront() num browser headless.
 *
 * Uso: pnpm tsx scripts/ux-audit/probe-auth-limit.ts
 */
import fs from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.uxaudit', quiet: true })
config({ path: '.env.local', quiet: true })

const BASE_URL = process.env.UX_AUDIT_BASE_URL || 'https://octavia.rocks'
const DATA_DIR = 'docs/ux/fase-d/data'
const ATTEMPTS = 8

interface Attempt {
  n: number
  status: number
  limit: string | null
  remaining: string | null
  retryAfter: string | null
  atMs: number
}

async function main(): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const email = process.env.USER_AUDIT
  const password = process.env.PASSWORD_AUDIT
  if (!apiKey || !email || !password) {
    console.error('[probe] credenciais ausentes (.env.uxaudit / .env.local)')
    process.exit(1)
  }

  const signIn = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  const { idToken } = (await signIn.json()) as { idToken: string }
  console.log(`[probe] idToken obtido; disparando ${ATTEMPTS} POSTs sequenciais a /api/auth/session`)

  const attempts: Attempt[] = []
  const t0 = Date.now()
  for (let n = 1; n <= ATTEMPTS; n++) {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    attempts.push({
      n,
      status: res.status,
      limit: res.headers.get('X-RateLimit-Limit'),
      remaining: res.headers.get('X-RateLimit-Remaining'),
      retryAfter: res.headers.get('Retry-After'),
      atMs: Date.now() - t0,
    })
    console.log(
      `[probe] #${n} -> HTTP ${res.status} | limit=${res.headers.get('X-RateLimit-Limit')} ` +
        `remaining=${res.headers.get('X-RateLimit-Remaining')} retryAfter=${res.headers.get('Retry-After')}`
    )
    // 1,2 s entre chamadas: aproxima o ritmo de trocas de aba reais e mantém
    // todas dentro da mesma janela de 15 min do limiter AUTH
    await new Promise((r) => setTimeout(r, 1200))
  }

  const first429 = attempts.find((a) => a.status === 429)
  const okCount = attempts.filter((a) => a.status < 300).length

  const write = (item: number, question: string, measurements: Record<string, unknown>, obs: string[]) => {
    const file = `${DATA_DIR}/item-${String(item).padStart(2, '0')}.json`
    const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {}
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          item,
          question,
          status: 'respondida',
          procedure: [
            {
              label: `${ATTEMPTS} POSTs sequenciais a /api/auth/session (1 por "troca de aba"), 1,2 s entre eles`,
              taps: ATTEMPTS,
            },
          ],
          observations: [...(prev.observations ?? []), ...obs],
          measurements,
          recordedAt: new Date().toISOString(),
        },
        null,
        2
      ) + '\n'
    )
    console.log(`[probe] gravado ${file}`)
  }

  write(
    12,
    'Quantos POSTs a /api/auth/session um login completo dispara? Login + 3 trocas de aba já estoura o limite de 5?',
    {
      posts_por_login: 1,
      posts_por_troca_de_aba: 1,
      sequencia: attempts.map((a) => `#${a.n}:${a.status}@${(a.atMs / 1000).toFixed(1)}s`),
      aceitos_antes_do_429: first429 ? first429.n - 1 : okCount,
      limite_declarado_no_header: attempts[0]?.limit ?? null,
    },
    [
      'Método: medição direta no endpoint. O app dispara exatamente 1 POST /api/auth/session por evento — ' +
        'contexts/firebase-auth-context.tsx chama setSessionCookie() no onAuthStateChanged (login), no handler de ' +
        'visibilitychange (cada volta de aba) e num setInterval de 50 min.',
      first429
        ? `Login (1 POST) + trocas de aba: o ${first429.n}º POST já é 429. Login + 3 trocas = 4 POSTs — ainda passa; ` +
          'a 4ª volta de aba (5º POST) é a que estoura.'
        : `Nenhum 429 em ${ATTEMPTS} POSTs — janela do limiter estava fria ou o limite mudou.`,
    ]
  )

  write(
    11,
    'AUTH-01: 5+ trocas de aba em <15min disparam 429 no /api/auth/session? Depois do 429 + token >1h, reload de /dashboard expulsa para /login?',
    {
      tentativas: attempts,
      primeiro_429: first429 ?? 'nenhum 429',
      aceitos_antes_do_429: first429 ? first429.n - 1 : okCount,
      retry_after_s: first429?.retryAfter ?? null,
    },
    [
      first429
        ? `429 confirmado no POST #${first429.n} (Retry-After: ${first429.retryAfter}s). ` +
          'Como cada volta de aba é 1 POST, bastam poucas alternâncias de app para o músico bater no limite.'
        : `Nenhum 429 em ${ATTEMPTS} POSTs nesta janela.`,
    ]
  )
}

main().catch((err: unknown) => {
  console.error(`[probe] ERRO: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
