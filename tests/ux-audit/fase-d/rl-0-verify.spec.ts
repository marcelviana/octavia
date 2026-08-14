import { test, expect, type Page } from '@playwright/test'
import { getBearer, settle } from './recorder'

/**
 * PR-0 (fila A #0, RATE-01) — regressão QUANTITATIVA do paliativo:
 * /api/auth/verify fora do limiter antigo.
 *
 * Baseline da Fase D: limiter strict por IP (20/60s) compartilhado entre
 * verify, auth/user e storage/delete; sob navegação normal o verify
 * respondia 429 → getServerSideUser devolvia null → server component
 * executava redirect('/login') → rebote ao /dashboard (FASE-D-01, "BOUNCE";
 * 63% de 429 em 371 POSTs de sessão na fase).
 *
 * Duas verificações, na mesma moeda da medição original (a antiga parte C
 * foi removida na B1.0 — ver nota abaixo):
 *
 *  A. Probe direto: 40 POSTs sequenciais a /api/auth/verify (2× o limite
 *     antigo de 20/60s) com token válido → **zero 429** (assert).
 *  B. Navegação: 12 navegações sequenciais por rotas autenticadas →
 *     **zero aterrissagens em /login** e **zero 429 em /api/*** (asserts).
 *     (Os POSTs internos do verify não são visíveis ao browser — o
 *     observável do mecanismo FASE-D-01 é exatamente o redirect.)
 *     EXCEÇÃO DOCUMENTADA: /api/auth/session fica FORA do assert (logado
 *     à parte). Cada page.goto dispara 1 POST de sessão (onAuthStateChanged
 *     do SDK) e o limite é 5/15min no limiter NOVO — módulo que esta PR
 *     não toca e cujo 429 pré-B1 é comportamento conhecido (63% medido na
 *     Fase D). Incluí-lo faria o spec falhar sempre, por causa externa.
 *     O log à parte NÃO é descarte — é DADO DE ENTRADA DO B1: 429s de
 *     session em navegação trivial vão registrados no relatório de
 *     validação como evidência que antecipa a prioridade do redesenho
 *     (mesmo tratamento do item 17 → B6). O assert de "zero /login"
 *     continua cobrindo o impacto visível de qualquer 429 do session.
 *     PROCEDIMENTO EM CASO DE FALHA NA PARTE B: um 429 de qualquer outra
 *     rota tem escopo maior que o fix (que só tira o verify do pool) —
 *     identificar a rota de origem no relatório (o assert lista método +
 *     path) ANTES de concluir regressão do fix; 429 de rota do limiter
 *     antigo (ex.: storage/delete) é achado novo, não necessariamente
 *     regressão da PR-0.
 *
 * PARTE C REMOVIDA NA B1.0: o controle negativo do limiter antigo usava
 * /api/auth/user (withRateLimit(handler, 2, true)), rota removida na PR
 * B1.0 (redução de superfície — era gestão de usuários Firebase sem claim
 * de admin). O limiter antigo segue vivo em outras rotas mas sem controle
 * negativo aqui; o substituto vem no B1.3 junto com o limiter único
 * (controle negativo do sistema novo, docs/ux/PLANO-TRANSICAO.md).
 * (Verificação adicional, à parte: scripts/ux-audit/probe-auth-limit.ts —
 * limite 5/15min do /api/auth/session, módulo novo, intacto.)
 *
 * NOTA: este spec só passa com o fix da PR-0 deployado no alvo
 * (UX_AUDIT_BASE_URL — preview do Vercel ou prod). Contra o código antigo
 * ele FALHA no probe A — é esse o ponto.
 *
 * RODAR COM --retries=0 (o config já define retries: 0; o flag explícito
 * blinda contra override). Este spec usa page.goto cru de propósito — NÃO
 * usa o gotoRoute do recorder, cujo retry defensivo de 75 s mascararia o
 * 429 intermitente que os asserts existem para pegar.
 *
 * Não consome orçamento do /api/auth/session: a sessão vem do storageState.
 */

const ROTAS_AUTENTICADAS = ['/dashboard', '/setlists', '/library'] as const
const NAVEGACOES = 12
const PROBES_VERIFY = 40

test('PR-0: verify sem limiter — zero 429 no probe direto e zero expulsões na navegação', async ({
  page,
}) => {
  test.setTimeout(10 * 60 * 1000)

  // ---- Preparação: token fresco do IndexedDB (o cookie do storageState
  // carrega idToken de 1h possivelmente vencido — AUTH-02) ----
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await settle(page, 1500)
  const token = await getBearer(page)
  expect(token, 'accessToken fresco disponível no IndexedDB').toBeTruthy()

  // ---- A. Probe direto: 40 POSTs, zero 429 ----
  const statuses: number[] = []
  for (let i = 0; i < PROBES_VERIFY; i++) {
    const res = await page.request.post('/api/auth/verify', {
      data: { token },
    })
    statuses.push(res.status())
  }
  const probe429 = statuses.filter((s) => s === 429).length
  const probe200 = statuses.filter((s) => s === 200).length
  console.log(
    `[PR-0] probe verify: ${PROBES_VERIFY} POSTs → ${probe200}× 200, ${probe429}× 429, ` +
      `outros: ${statuses.filter((s) => s !== 200 && s !== 429).join(',') || 'nenhum'}`
  )
  expect(probe429, `zero 429 em ${PROBES_VERIFY} POSTs ao /api/auth/verify`).toBe(0)
  expect(probe200, 'todas as verificações de token bem-sucedidas').toBe(PROBES_VERIFY)

  // ---- B. Navegação autenticada: zero /login, zero 429 visíveis ----
  // /api/auth/session fora do assert (exceção documentada no cabeçalho):
  // limiter novo, 429 pré-B1 esperado a cada page load. Logado à parte.
  const api429: string[] = []
  const session429: number[] = []
  page.on('response', (res) => {
    if (res.status() !== 429 || !res.url().includes('/api/')) return
    const path = new URL(res.url()).pathname
    if (path === '/api/auth/session') {
      session429.push(session429.length + 1)
      return
    }
    api429.push(`${res.request().method()} ${path}`)
  })

  const aterrissagens: string[] = []
  for (let i = 0; i < NAVEGACOES; i++) {
    const rota = ROTAS_AUTENTICADAS[i % ROTAS_AUTENTICADAS.length] ?? '/dashboard'
    await page.goto(rota, { waitUntil: 'domcontentloaded' })
    await settle(page, 800)
    aterrissagens.push(new URL(page.url()).pathname)
  }
  console.log(`[PR-0] navegação: ${aterrissagens.join(' → ')}`)
  console.log(`[PR-0] 429 em /api/* (exceto session): ${api429.length ? api429.join('; ') : 'nenhum'}`)
  console.log(`[PR-0] 429 em /api/auth/session (fora do assert, esperado pré-B1): ${session429.length}`)

  const expulsoes = aterrissagens.filter((p) => p.startsWith('/login'))
  expect(
    expulsoes.length,
    `zero aterrissagens em /login em ${NAVEGACOES} navegações (mecanismo FASE-D-01)`
  ).toBe(0)
  expect(
    api429.length,
    'zero 429 de /api/* (exceto session) — se falhar, identificar a rota listada antes de concluir regressão do fix'
  ).toBe(0)

  // (Parte C removida na B1.0 — ver cabeçalho; substituto no B1.3.)
})
