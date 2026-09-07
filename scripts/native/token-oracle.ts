/**
 * Oráculo de token do N0-PR3: faz 1 signInWithPassword (Google Identity, fora do rate limit da
 * nossa API) com a conta de audit e imprime APENAS sub, aud, iss e (exp - iat) do idToken —
 * nunca o token, o email ou a senha. Zero chamada a octavia.rocks (C-D1: nada de /api/auth/session).
 * Uso: pnpm exec tsx scripts/native/token-oracle.ts
 */
import { config } from 'dotenv'

config({ path: '.env.uxaudit', quiet: true })
config({ path: '.env.local', quiet: true })

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`[token-oracle] variável ausente: ${name}`)
    process.exit(1)
  }
  return v
}

async function main(): Promise<void> {
  const apiKey = requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY')
  const email = requireEnv('USER_AUDIT')
  const password = requireEnv('PASSWORD_AUDIT')
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  if (!res.ok) {
    console.error(`[token-oracle] signInWithPassword HTTP ${res.status}`)
    process.exit(1)
  }
  const { idToken } = (await res.json()) as { idToken?: string }
  if (!idToken) {
    console.error('[token-oracle] sem idToken na resposta')
    process.exit(1)
  }
  const payloadB64 = idToken.split('.')[1] ?? ''
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<string, unknown>
  console.log(JSON.stringify({ sub: payload.sub, aud: payload.aud, iss: payload.iss, 'exp-iat': Number(payload.exp) - Number(payload.iat) }))
}

main().catch((e: unknown) => {
  console.error('[token-oracle] falha:', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
