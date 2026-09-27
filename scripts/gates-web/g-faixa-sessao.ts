/**
 * G-faixa — preparação e fechamento da rodada (globalSetup do
 * `playwright.g-faixa.config.ts`; I1-PR5).
 *
 * PREPARAÇÃO
 *  1. A rodada: um carimbo e uma pasta TEMPORÁRIA fora da árvore. Nada se grava
 *     na árvore durante a medição — o `next dev` a vigia, e arquivo novo nela
 *     vira hot update e navegação no log (div. 531 da I1-PR1). Os JSON só são
 *     copiados para `G_FAIXA_SAIDA` no fechamento.
 *  2. A sessão, se alguma superfície a pede e `G_FAIXA_PERFIL` existe: abre o
 *     perfil persistente, vai a `/dashboard`; se cair em `/login`, reabre o
 *     navegador COM JANELA em `/login` e espera (até 10 min) a pessoa entrar.
 *     Quem digita é o Marcel; o script nunca lê nem digita credencial. Durante
 *     o login, escrita a `/api/*` fora de `/api/auth/session` é abortada.
 *
 * FECHAMENTO (a função devolvida): junta as peças `<superficie>.<largura>.json`
 * em `G_FAIXA_SAIDA/<superficie>.json` e imprime o resumo da classificação.
 */
import { chromium, type FullConfig } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resumo } from './g-faixa-classificar.mjs'
import { SUPERFICIES, selecionadas } from './g-faixa-superficies'

export default async function preparar(_config: FullConfig): Promise<() => Promise<void>> {
  const base = process.env.G_FAIXA_BASE_URL as string
  process.env.G_FAIXA_RODADA ??= new Date().toISOString()
  process.env.G_FAIXA_TMP ??= fs.mkdtempSync(path.join(os.tmpdir(), 'g-faixa-'))
  const saida = path.resolve(process.env.G_FAIXA_SAIDA ?? 'tests/gates-web/medicoes')
  const perfil = process.env.G_FAIXA_PERFIL
  const querSessao = selecionadas().some((s) => s.sessao)
  console.log(`G-faixa · rodada ${process.env.G_FAIXA_RODADA} · base ${new URL(base).origin} · saída ${path.relative(process.cwd(), saida) || '.'}`)
  // o servidor responde? (sem isto, a 1ª rodada do CN morreu num stack do page.goto: ERR_CONNECTION_REFUSED)
  if (selecionadas().length) {
    const ok = await fetch(new URL('/api/health', base), { signal: AbortSignal.timeout(180_000) }).then((r) => r.ok, () => false)
    if (!ok) throw new Error(`G-faixa: nada responde em ${new URL('/api/health', base).href} — suba o servidor (pnpm dev) e rode de novo. Nenhum navegador foi aberto.`)
  }

  if (querSessao && !perfil) {
    console.log('G-faixa · sem G_FAIXA_PERFIL: as superfícies com sessão ficam de fora nesta rodada (skip, com a razão no relatório)')
  } else if (querSessao && perfil) {
    const logado = await sessaoAtiva(base, perfil, true)
    if (logado) console.log('G-faixa · perfil com sessão ativa')
    else if (process.env.G_FAIXA_SEM_JANELA === '1') throw new Error('G-faixa: o perfil não tem sessão e G_FAIXA_SEM_JANELA=1 — nada medido')
    else {
      console.log('G-faixa · o perfil não tem sessão. Abrindo o navegador em /login: ENTRE COM A CONTA na janela.')
      console.log('         (o script espera até 10 min; não lê nem digita credencial; feche nada — ele fecha sozinho)')
      if (!(await sessaoAtiva(base, perfil, false))) throw new Error('G-faixa: o login não se completou em 10 min — nada medido')
      console.log('G-faixa · sessão aberta no perfil')
    }
  }

  return async () => {
    const tmp = process.env.G_FAIXA_TMP as string
    const pecas = fs.existsSync(tmp) ? fs.readdirSync(tmp).filter((f) => f.endsWith('.json')) : []
    const porSup = new Map<string, Record<string, unknown>[]>()
    for (const f of pecas) {
      const id = f.split('.')[0] as string
      const lista = porSup.get(id) ?? []
      lista.push(JSON.parse(fs.readFileSync(path.join(tmp, f), 'utf8')))
      porSup.set(id, lista)
    }
    if (porSup.size) fs.mkdirSync(saida, { recursive: true })
    for (const [id, lista] of porSup) {
      const junto = juntar(lista)
      fs.writeFileSync(path.join(saida, `${id}.json`), JSON.stringify(junto, null, 1) + '\n')
      // estado não medido não some do resumo (1ª rodada do CN: o `content` sumiu calado, div. 629)
      for (const [eid, e] of Object.entries(junto.estados as Record<string, { pulado?: string; naoAlcancado?: Record<string, string>; inalcancavel?: string }>)) {
        if (e.pulado) console.log(`G-faixa · ${id} · ${eid}: NÃO MEDIDO — ${e.pulado}`)
        for (const [L, r] of Object.entries(e.naoAlcancado ?? {})) console.log(`G-faixa · ${id} · ${eid} · ${L}: NÃO ALCANÇADO — ${r}`)
        if (e.inalcancavel) console.log(`G-faixa · ${id} · ${eid}: INALCANÇÁVEL (declarado) — ${e.inalcancavel}`)
      }
      const r = resumo(junto as never) as Record<string, { e: number; b: number; dl: number; errata: number; nomeAcessivel: number; rolagem: number; reprova: boolean }>
      for (const [L, t] of Object.entries(r))
        console.log(`G-faixa · ${id} · ${L}: (e)=${t.e} · (b)=${t.b} · (d′)=${t.dl} · errata candidata=${t.errata} · saídas: nome-acessível=${t.nomeAcessivel} rolagem=${t.rolagem}${t.reprova ? '' : ' (faixa A: contado à parte)'}`)
    }
    const ids = SUPERFICIES.map((s) => s.id).filter((id) => porSup.has(id))
    console.log(`G-faixa · gravado: ${ids.map((id) => `${id}.json`).join(', ') || 'nada'} → ${saida}`)
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

/** As peças (uma por largura) de uma superfície viram um JSON só. */
function juntar(pecas: Record<string, unknown>[]): Record<string, unknown> {
  const [primeira] = pecas
  const out: Record<string, unknown> = { ...(primeira as object), estados: {}, requests: {}, controlePositivo: {} }
  const estados = out.estados as Record<string, { larguras: Record<string, unknown>; folha?: unknown; pulado?: string; naoAlcancado?: Record<string, string>; inalcancavel?: string }>
  for (const p of pecas) {
    const L = String(p.largura)
    for (const [id, e] of Object.entries(p.estados as Record<string, { medicao?: unknown; folha?: unknown; pulado?: string; naoAlcancado?: string; inalcancavel?: string }>)) {
      const alvo = (estados[id] ??= { larguras: {} })
      if (e.medicao) alvo.larguras[L] = e.medicao
      if (e.folha) alvo.folha = e.folha
      if (e.pulado) alvo.pulado = e.pulado
      // I1-PR6: o estado que a preparação não alcançou NESTA largura, e o declarado inalcançável
      if (e.naoAlcancado) (alvo.naoAlcancado ??= {})[L] = e.naoAlcancado
      if (e.inalcancavel) alvo.inalcancavel = e.inalcancavel
    }
    ;(out.requests as Record<string, unknown>)[L] = p.requests
    ;(out.controlePositivo as Record<string, unknown>)[L] = p.controlePositivo
  }
  delete out.largura
  return out
}

/** Abre o perfil e diz se `/dashboard` fica (sessão) ou cai em `/login`. Com janela, espera o login. */
async function sessaoAtiva(base: string, perfil: string, semJanela: boolean): Promise<boolean> {
  const ctx = await chromium.launchPersistentContext(perfil, { headless: semJanela, viewport: { width: 1138, height: 711 } })
  try {
    await ctx.route('**/*', (route) => {
      const r = route.request()
      const u = new URL(r.url())
      const escrita = !['GET', 'HEAD', 'OPTIONS'].includes(r.method())
      if (u.origin === new URL(base).origin && u.pathname.startsWith('/api/') && escrita && u.pathname !== '/api/auth/session') return route.abort()
      return route.continue()
    })
    const page = ctx.pages()[0] ?? (await ctx.newPage())
    if (semJanela) {
      await page.goto(new URL('/dashboard', base).href, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await page.waitForLoadState('load', { timeout: 60_000 }).catch(() => {})
      await page.waitForTimeout(2_000)
      return !new URL(page.url()).pathname.startsWith('/login')
    }
    await page.goto(new URL('/login', base).href, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const fim = Date.now() + 10 * 60_000
    while (Date.now() < fim) {
      const p = new URL(page.url()).pathname
      if (p.startsWith('/dashboard')) { await page.waitForTimeout(3_000); return true }
      await page.waitForTimeout(1_000)
    }
    return false
  } finally {
    await ctx.close()
  }
}
