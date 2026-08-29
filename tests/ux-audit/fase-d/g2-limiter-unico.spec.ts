import { test, expect } from '@playwright/test'
import { getBearer, settle } from './recorder'

/**
 * G2 (B1.3) — o limiter ÚNICO funciona e é ELE quem responde.
 *
 * Duas verificações:
 *  A. USO REAL → zero 429: orçamento de leitura realista (navegação +
 *     rajada de GETs de content/setlists dentro das janelas de 300/min)
 *     não produz nenhum 429 — o caso que o limiter antigo matava
 *     (buckets por IP compartilhados entre rotas).
 *  B. ESTOURO DELIBERADO → 429 com a ASSINATURA do sistema único
 *     (X-RateLimit-Scope + Retry-After): estoura a janela por IP mais
 *     estreita (session DELETE, 30/15min — inócua: só limpa cookie) e a
 *     janela por USER do profile (60/15min, GETs puros). Nenhum write.
 *
 * CONTROLE NEGATIVO (regra nº 7): contra um deployment pré-B1.3, a parte
 * B falha — o 429 vem sem X-RateLimit-Scope (assinatura do limiter
 * antigo) ou vem cedo demais (25/60s do bucket compartilhado). Executado
 * na validação da PR contra o preview antigo; saída registrada.
 *
 * Nota de higiene: o orçamento de MUTAÇÃO (120/15min — montagem de
 * setlist de 56 canções cabe 2×) é provado por aritmética de janela +
 * contrato unit (lib/__tests__/user-rate-limit.test.ts), não por
 * semeadura de dados no preview.
 *
 * GUARDA ANTI-PROD (exigência da B1.3; reescrita no B3/D0): estouro
 * deliberado SÓ roda em deployment de BRANCH ≠ main — ver beforeAll.
 */

const BASE_URL = process.env.UX_AUDIT_BASE_URL || ''

test.describe('G2 — limiter único', () => {
  test.beforeAll(() => {
    // D0/B3 (2026-08-28): a guarda antiga (`includes('octavia.rocks')`)
    // deixava passar octavia-git-main-… e o alias octavia-preview — que
    // servem/serviram o MESMO deployment de produção. Foi exatamente o
    // furo do pre-check do B3 (§0.1: família ip travada ~15min numa
    // instância de prod por um probe que se acreditava "em preview").
    // Agora a guarda é allowlist: só preview de BRANCH ≠ main.
    const BRANCH_PREVIEW =
      /^https:\/\/octavia-git-(?!main-)[a-z0-9-]+-marcelvianas-projects\.vercel\.app$/
    if (!BASE_URL || !BRANCH_PREVIEW.test(BASE_URL)) {
      throw new Error(
        'G2 recusa rodar: o alvo não é um preview de BRANCH ' +
          '(https://octavia-git-<branch≠main>-marcelvianas-projects.vercel.app). ' +
          'Este spec faz ESTOURO DELIBERADO de janelas de rate limit — ' +
          'octavia.rocks, octavia-git-main-… e o alias aposentado ' +
          'octavia-preview.vercel.app servem o deployment de produção e ' +
          'nunca são alvo.'
      )
    }
  })

  test('G2a: orçamento de uso real → zero 429', async ({ page }) => {
    test.setTimeout(5 * 60 * 1000)

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await settle(page, 1500)
    const token = await getBearer(page)
    expect(token, 'accessToken disponível').toBeTruthy()

    const statuses: number[] = []
    // rajada de leitura realista: 80 GETs de content + 40 de setlists em
    // sequência — bem dentro de 300/min por uid, e MUITO acima do que o
    // limiter antigo tolerava (100/60s num bucket compartilhado por IP)
    for (let i = 0; i < 80; i++) {
      const res = await page.request.get('/api/content', {
        headers: { Authorization: `Bearer ${token}` },
      })
      statuses.push(res.status())
    }
    for (let i = 0; i < 40; i++) {
      const res = await page.request.get('/api/setlists', {
        headers: { Authorization: `Bearer ${token}` },
      })
      statuses.push(res.status())
    }

    const s429 = statuses.filter((s) => s === 429).length
    console.log(
      `[G2a] 120 GETs de leitura → ${statuses.filter((s) => s === 200).length}× 200, ${s429}× 429`
    )
    expect(s429, 'zero 429 em orçamento de uso real (120 GETs)').toBe(0)
  })

  test('G2b: estouro deliberado → 429 com a assinatura do sistema único', async ({ page }) => {
    test.setTimeout(5 * 60 * 1000)

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await settle(page, 1500)
    const token = await getBearer(page)
    expect(token, 'accessToken disponível').toBeTruthy()

    // --- escopo USER: profile GET (60/15min) — 65 GETs puros ---
    let user429: import('@playwright/test').APIResponse | null = null
    for (let i = 0; i < 65; i++) {
      const res = await page.request.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status() === 429) {
        user429 = res
        break
      }
    }
    expect(user429, '429 alcançado dentro de 65 GETs ao /api/profile').toBeTruthy()
    expect(user429!.headers()['x-ratelimit-scope'], 'assinatura: escopo user').toBe('user')
    expect(Number(user429!.headers()['retry-after']), 'Retry-After honesto').toBeGreaterThan(0)
    const body = await user429!.json()
    expect(body.retryAfter, '429 estruturada (semente do B3)').toBeGreaterThan(0)
    // B3 PR-4/D4: a assinatura inclui o code do contrato
    expect(body.code, '429 no envelope do contrato (D4)').toBe('RATE_LIMITED')
    console.log(
      `[G2b] profile: 429 com X-RateLimit-Scope=user, Retry-After=${user429!.headers()['retry-after']}s`
    )

    // --- escopo IP: session DELETE (30/15min) — inócua, só limpa cookie ---
    let ip429: import('@playwright/test').APIResponse | null = null
    for (let i = 0; i < 35; i++) {
      const res = await page.request.delete('/api/auth/session')
      if (res.status() === 429) {
        ip429 = res
        break
      }
    }
    expect(ip429, '429 alcançado dentro de 35 DELETEs ao /api/auth/session').toBeTruthy()
    expect(ip429!.headers()['x-ratelimit-scope'], 'assinatura: escopo ip').toBe('ip')
    console.log(
      `[G2b] session DELETE: 429 com X-RateLimit-Scope=ip, Retry-After=${ip429!.headers()['retry-after']}s`
    )
  })
})
