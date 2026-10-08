/**
 * D-0 (div. 1157) — a ponte dos gates do editor até a ROTA REAL: o `PUT /api/content` que o editor manda não volta
 * mais de um `fetch` que devolve 200 a qualquer corpo; ele passa pelo handler `PUT` de `app/api/content/route.ts`, com o
 * esquema real (`contentSchemas.update`) e o contrato de escrita real (`checkContentData`, com o tipo da linha). Só a
 * autenticação e o banco são simulados — o molde do M0 do pre-check (`docs/ux/D0-PRECHECK-anexos/instrumentos/
 * m0-editor.medir.tsx`).
 *
 * Quem usa declara, no próprio arquivo de teste (o `vi.mock` é por arquivo):
 *   vi.mock('@/lib/firebase-server-utils', () => ({ requireAuthServer: async () => ({ uid: 'cn-user', email: '…' }) }))
 *   vi.mock('@/lib/supabase-service', async () => ({ getSupabaseServiceClient: (await import('./rota-real')).clienteSimulado }))
 *
 * O banco simulado: o `select('content_type')…single()` do `PUT` devolve a linha servida; o `update(x)…single()` guarda
 * `x` e devolve a linha com `x` por cima (o `content_data` do corpo SUBSTITUI o do banco — `route.ts`, o `update`).
 * `gravada()` é a linha como ficaria no banco depois do `PUT`.
 */
import { vi } from 'vitest'
import { NextRequest } from 'next/server'

type Linha = Record<string, unknown>
export interface Resposta { status: number; corpo: string }

const banco: { linha: Linha; update: Linha | null } = { linha: {}, update: null }
export const chamadas: { corpos: string[]; respostas: Resposta[] } = { corpos: [], respostas: [] }

export function clienteSimulado() {
  const cadeia = () => {
    const c: Record<string, unknown> = {}
    for (const m of ['select', 'eq']) c[m] = () => c
    c.update = (x: Linha) => { banco.update = x; return c }
    c.single = async () => ({ data: { ...banco.linha, ...(banco.update ?? {}) }, error: null })
    return c
  }
  return { from: () => cadeia() }
}

/** O `fetch` do navegador: o `GET /api/content/<id>` devolve a linha; o `PUT /api/content` vai à rota real. */
export function servir(linha: Linha) {
  banco.linha = linha
  banco.update = null
  chamadas.corpos = []
  chamadas.respostas = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'PUT') {
      const corpo = String(init?.body)
      chamadas.corpos.push(corpo)
      const req = new NextRequest('http://localhost/api/content', {
        method: 'PUT', body: corpo, headers: { 'content-type': 'application/json', authorization: 'Bearer cn-token' },
      })
      // a rota se importa aqui, não no topo: o `vi.mock` do `supabase-service` importa ESTE módulo, e a rota importa o
      // `supabase-service` — no topo, os dois se esperariam (o gate parava sem sair nada)
      const { PUT } = await import('@/app/api/content/route')
      const res = await PUT(req)
      const texto = await res.text()
      chamadas.respostas.push({ status: res.status, corpo: texto })
      return new Response(texto, { status: res.status, headers: { 'content-type': 'application/json' } })
    }
    if (String(url).startsWith(`/api/content/${linha.id}`)) return new Response(JSON.stringify(linha), { status: 200 })
    return new Response('{}', { status: 404 })
  }))
}

/** A linha como ficaria no banco depois do `PUT` (o `update` por cima da linha servida). */
export const gravada = (): Linha => ({ ...banco.linha, ...(banco.update ?? {}) })

/** O que a rota disse, numa linha: `200`, ou `400 VALIDATION_ERROR · difficulty: Invalid enum value…`. */
export function motivo(r: Resposta): string {
  if (r.status < 400) return String(r.status)
  try {
    const j = JSON.parse(r.corpo) as { error?: string; code?: string; details?: { field?: string; message?: string }[] }
    const det = (j.details ?? []).map((d) => `${d.field}: ${d.message}`).join(' | ')
    return `${r.status} ${j.code ?? j.error ?? ''}${det ? ` · ${det}` : ''}`
  } catch { return `${r.status} (corpo não-JSON)` }
}
