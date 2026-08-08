/**
 * Smoke test da autenticação do UX audit contra prod.
 *
 * Autentica via auth.ts e faz GET /api/profile. Sucesso = HTTP 200 com o
 * perfil da conta de audit. Loga apenas status HTTP e campos não sensíveis
 * (id, email, first_name) — nunca token nem senha.
 *
 * Uso: pnpm tsx scripts/ux-audit/auth-check.ts
 */
import { apiFetch, auditEmail, BASE_URL } from './auth'

async function main(): Promise<void> {
  console.log(`[auth-check] Base URL: ${BASE_URL}`)

  const res = await apiFetch('/api/profile')
  console.log(`[auth-check] GET /api/profile → HTTP ${res.status}`)

  if (!res.ok) {
    console.error('[auth-check] FALHA: resposta não-OK da API de perfil')
    process.exit(1)
  }

  const profile = (await res.json()) as
    | { id?: string; email?: string; first_name?: string | null }
    | null

  if (!profile) {
    console.error(
      '[auth-check] FALHA: autenticação OK, mas o perfil não existe (API retornou null). ' +
        'A conta de audit precisa ter o perfil criado antes do assessment.'
    )
    process.exit(1)
  }

  console.log(
    `[auth-check] perfil: id=${profile.id} email=${profile.email} first_name=${profile.first_name ?? '(vazio)'}`
  )

  if (profile.email !== auditEmail()) {
    console.error('[auth-check] FALHA: email do perfil não corresponde à conta de audit (USER_AUDIT)')
    process.exit(1)
  }

  console.log('[auth-check] SUCESSO: perfil da conta de audit retornado por prod')
}

main().catch((err: unknown) => {
  console.error(`[auth-check] ERRO: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
