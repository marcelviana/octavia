import fs from 'node:fs'
import path from 'node:path'
import type { Page, TestInfo } from '@playwright/test'

/**
 * Recorder de medições da Fase D.
 *
 * Cada item da lista fechada (docs/ux/ASSESSMENT.md § "Verificar na Fase D")
 * grava um JSON em docs/ux/fase-d/data/item-NN.json com:
 *  - procedimento executado (passos com contagem de taps e timestamps)
 *  - observações livres
 *  - referência do trace (copiado depois para docs/ux/fase-d/traces/)
 *
 * Convenção de medição (JOBS.md): tap = interação discreta; digitação = 1
 * tap por campo. Tempo = do PRIMEIRO tap até o critério de sucesso visível.
 * Os tempos aqui são medidos em Node (Date.now() em volta das ações); o
 * trace gravado pelo Playwright é a evidência para conferência.
 */

const DATA_DIR = 'docs/ux/fase-d/data'
const TRACES_DIR = 'docs/ux/fase-d/traces'

export interface Step {
  label: string
  /** Taps consumidos neste passo (0 para passos de observação). */
  taps: number
  /** ms desde o primeiro tap da medição (fim do passo). */
  atMs?: number
  /** duração do passo em ms, quando medida isoladamente */
  durMs?: number
}

export interface ItemRecord {
  item: number
  question: string
  status: 'respondida' | 'manual-pendente' | 'diferida' | 'inconclusiva'
  procedure: Step[]
  observations: string[]
  measurements: Record<string, unknown>
  trace?: string
  recordedAt: string
}

export class ItemRecorder {
  private rec: ItemRecord
  private t0: number | null = null
  private tapCount = 0

  constructor(item: number, question: string) {
    this.rec = {
      item,
      question,
      status: 'respondida',
      procedure: [],
      observations: [],
      measurements: {},
      recordedAt: new Date().toISOString(),
    }
  }

  /** Marca o instante do primeiro tap (início da janela de tempo). */
  startClock(): void {
    if (this.t0 === null) this.t0 = Date.now()
  }

  elapsed(): number {
    return this.t0 === null ? 0 : Date.now() - this.t0
  }

  /**
   * Executa uma ação que conta como 1 tap (ou `taps` explícitos) e registra
   * o passo com o timestamp relativo ao primeiro tap.
   */
  async tap(label: string, action: () => Promise<unknown>, taps = 1): Promise<void> {
    this.startClock()
    const before = Date.now()
    await action()
    this.tapCount += taps
    this.rec.procedure.push({
      label,
      taps,
      atMs: Date.now() - (this.t0 as number),
      durMs: Date.now() - before,
    })
  }

  /** Passo de observação/espera (0 taps). */
  async step(label: string, action?: () => Promise<unknown>): Promise<void> {
    const before = Date.now()
    if (action) await action()
    this.rec.procedure.push({
      label,
      taps: 0,
      ...(this.t0 !== null ? { atMs: Date.now() - this.t0 } : {}),
      durMs: Date.now() - before,
    })
  }

  note(observation: string): void {
    this.rec.observations.push(observation)
  }

  measure(key: string, value: unknown): void {
    this.rec.measurements[key] = value
  }

  set(status: ItemRecord['status']): void {
    this.rec.status = status
  }

  get taps(): number {
    return this.tapCount
  }

  /**
   * Persiste o JSON do item e anota a referência do trace (o zip é copiado
   * do outputDir pelo passo pós-execução — scripts/ux-audit/copy-traces.sh).
   */
  save(testInfo?: TestInfo): void {
    this.rec.measurements['taps_total'] = this.tapCount
    if (this.t0 !== null) this.rec.measurements['tempo_total_ms'] = this.elapsed()
    if (testInfo) {
      this.rec.trace = `docs/ux/fase-d/traces/${path.basename(testInfo.outputDir)}.zip`
    }
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const file = path.join(DATA_DIR, `item-${String(this.rec.item).padStart(2, '0')}.json`)
    // Um item pode ser coberto por mais de um teste — mescla observações
    let out = this.rec
    if (fs.existsSync(file)) {
      const prev = JSON.parse(fs.readFileSync(file, 'utf-8')) as ItemRecord
      if (prev.recordedAt !== this.rec.recordedAt) {
        out = {
          ...this.rec,
          procedure: [...prev.procedure, ...this.rec.procedure],
          observations: [...prev.observations, ...this.rec.observations],
          measurements: { ...prev.measurements, ...this.rec.measurements },
          trace: this.rec.trace ?? prev.trace,
        }
      }
    }
    fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n')
  }
}

/**
 * Vigia passivo do endpoint de sessão: TODO teste da Fase D registra os
 * POST/DELETE /api/auth/session que o app dispara sozinho (evidência
 * acumulada para os itens 11-12 / AUTH-01), em JSONL append-only.
 */
export function trackSessionPosts(page: Page, context: string): void {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const file = path.join(DATA_DIR, 'session-posts.jsonl')
  page.on('response', (res) => {
    if (!res.url().includes('/api/auth/session')) return
    const method = res.request().method()
    if (method !== 'POST' && method !== 'DELETE') return
    fs.appendFileSync(
      file,
      JSON.stringify({
        at: new Date().toISOString(),
        context,
        method,
        status: res.status(),
      }) + '\n'
    )
  })
}

/**
 * Bearer token fresco lido do IndexedDB da página (o SDK client mantém o
 * accessToken renovado ali). As rotas de API exigem Authorization: Bearer —
 * o cookie do storageState tem idToken vencido e sozinho leva a 401.
 */
export async function getBearer(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    return new Promise<string | null>((resolve) => {
      const open = indexedDB.open('firebaseLocalStorageDb')
      open.onsuccess = () => {
        const db = open.result
        try {
          const tx = db.transaction('firebaseLocalStorage', 'readonly')
          const getAll = tx.objectStore('firebaseLocalStorage').getAll()
          getAll.onsuccess = () => {
            const rec = (getAll.result as Array<{ fbase_key: string; value: any }>).find((r) =>
              r.fbase_key.startsWith('firebase:authUser:')
            )
            db.close()
            resolve(rec?.value?.stsTokenManager?.accessToken ?? null)
          }
          getAll.onerror = () => {
            db.close()
            resolve(null)
          }
        } catch {
          db.close()
          resolve(null)
        }
      }
      open.onerror = () => resolve(null)
    })
  })
}

/** Espera padrão pós-navegação (networkidle best-effort). */
export async function settle(page: Page, ms = 800): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(ms)
}

/**
 * goto com detecção de BOUNCE: sob pressão de rate limit, os server
 * components (via getServerSideUser → /api/auth/verify, limiter antigo por
 * IP) redirecionam QUALQUER rota autenticada para /login → /dashboard.
 * Se a URL final não contém o pathname pedido, espera a janela do limiter
 * (65s) e tenta de novo. Cada bounce vira nota no recorder (é evidência).
 */
export async function gotoRoute(
  page: Page,
  url: string,
  rec: ItemRecorder,
  attempts = 3
): Promise<boolean> {
  const wanted = url.split('?')[0]
  for (let i = 1; i <= attempts; i++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await page.waitForTimeout(2000)
    const pathNow = () => new URL(page.url()).pathname
    const matches = () => pathNow() === wanted || pathNow().startsWith(wanted)
    if (matches()) {
      // O bounce também acontece CLIENT-SIDE segundos após o load ("Failed
      // to fetch profile" → redirect p/ dashboard). Verifica estabilidade.
      await page.waitForTimeout(6000)
      if (matches()) return true
      rec.note(
        `BOUNCE TARDIO em ${wanted}: página carregou e o client redirecionou para ${page.url()} ` +
          'segundos depois (profile 429 → "Redirecting to dashboard")'
      )
    }
    rec.note(
      `BOUNCE em ${wanted} (tentativa ${i}/${attempts}): aterrissou em ${page.url()} ` +
        '— redirect do 429 em /api/auth/verify (limiter compartilhado por IP)'
    )
    // Fallback: o bounce termina no dashboard LOGADO — de lá a navegação
    // client-side pela sidebar não passa pelo redirect do server component
    const NAV_LABEL: Record<string, string> = {
      '/setlists': 'Setlists',
      '/library': 'Library',
      '/dashboard': 'Dashboard',
      '/add-content': 'Add Song',
    }
    const navLabel = NAV_LABEL[wanted]
    // O bounce pode parar em /login por alguns segundos até o client SDK
    // redirecionar para o dashboard — espera essa segunda perna
    if (navLabel && /\/login/.test(page.url())) {
      await page.waitForURL(/\/dashboard/, { timeout: 20_000 }).catch(() => {})
    }
    if (navLabel && /\/dashboard/.test(page.url())) {
      const clicked = await page
        .getByText(navLabel, { exact: true })
        .first()
        .click({ timeout: 5000 })
        .then(() => true)
        .catch(() => false)
      if (clicked) {
        await page.waitForTimeout(3000)
        if (matches()) {
          await page.waitForTimeout(5000)
          if (matches()) {
            rec.note(`Recuperado via navegação de UI (sidebar "${navLabel}") após o bounce`)
            return true
          }
        }
      }
    }
    if (i < attempts) {
      // Espera em about:blank: a página quicada (dashboard) continua gerando
      // tráfego e renovando a janela do limiter — precisa de silêncio real
      await page.goto('about:blank').catch(() => {})
      await page.waitForTimeout(75_000)
    }
  }
  return false
}

/** Shell do modo performance visível (critério de "tela cheia" do J1). */
export async function waitPerformanceShell(page: Page, timeout = 30_000): Promise<void> {
  await page.locator('[data-testid="exit-button"]').waitFor({ state: 'visible', timeout })
}

/**
 * Navega para /performance por deep link, com retry.
 *
 * ACHADO da própria Fase D (primeira execução): o server component de
 * /performance valida a sessão via fetch a /api/auth/verify, que usa o
 * defaultLimiter ANTIGO (por IP, compartilhado entre rotas). Sob tráfego,
 * o verify 429a → getServerSideUser retorna null → redirect("/login") →
 * cookie válido → usuário aterrissa no DASHBOARD. Cada bounce é registrado
 * como evidência; o retry espera a janela do limiter (60s+) esfriar.
 */
export async function gotoPerformance(
  page: Page,
  url: string,
  rec: ItemRecorder,
  attempts = 3
): Promise<boolean> {
  for (let i = 1; i <= attempts; i++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await page.waitForTimeout(1500)
    if (!/\/(dashboard|login)/.test(page.url())) {
      const ok = await waitPerformanceShell(page).then(
        () => true,
        () => false
      )
      if (ok) {
        if (i > 1) rec.note(`Deep link /performance só funcionou na tentativa ${i}`)
        return true
      }
    }
    rec.note(
      `Deep link /performance BOUNCE (tentativa ${i}/${attempts}): aterrissou em ${page.url()} ` +
        '— padrão do 429 em /api/auth/verify (limiter compartilhado por IP)'
    )
    if (i < attempts) {
      await page.goto('about:blank').catch(() => {})
      await page.waitForTimeout(75_000)
    }
  }
  return false
}

export { TRACES_DIR }
