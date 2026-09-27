/**
 * G-faixa — a COLETA (I1-PR5): o que roda dentro da página (`coletar`) e o que
 * vira JSON (`paraJson`). Separada do `g-faixa-medir.ts` para que o CN da
 * coleta (`tests/gates-web/g-faixa-coleta.cn.ts`) rode a MESMA função sobre
 * uma página sintética.
 *
 * `coletar` vai para o navegador por `page.evaluate` (o Playwright serializa o
 * código da função): nada de import nem de variável de fora dentro dela.
 */
import type { Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import path from 'node:path'

export interface NoCru {
  role: string; tag: string; testid: string | null; texto: string; nome: string | null
  x: number; y: number; w: number; h: number; sr: boolean
  clip: { x: number; y: number; w: number; h: number; rolagem: boolean } | null
  corta: { x: boolean; y: boolean }
}

export const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 12)

/** Os nós, em coordenadas do documento (ou da moldura, na folha). Roda na página. */
export function coletar(raizSel: string | null): { nos: NoCru[]; viewport: { w: number; h: number }; doc: { scrollWidth: number; clientWidth: number } } {
  const raiz = (raizSel ? document.querySelector(raizSel) : document.body) as HTMLElement
  const rr = raiz.getBoundingClientRect()
  const ox = raizSel ? rr.left + raiz.clientLeft : -window.scrollX
  const oy = raizSel ? rr.top + raiz.clientTop : -window.scrollY
  const CONTROLE = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=radio],[role=switch],[role=combobox],[role=textbox],[role=searchbox],[role=slider]'
  const MARCADO = 'h1,h2,h3,h4,h5,h6,label,[data-testid],[aria-label]'
  const IGNORA = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'svg', 'path', 'circle', 'rect', 'g', 'line', 'polyline', 'polygon'])
  const papel = (el: Element): string => {
    const r = el.getAttribute('role'); if (r) return r
    const t = el.tagName.toLowerCase()
    if (t === 'a') return 'link'
    if (t === 'button' || t === 'summary') return 'button'
    if (t === 'select') return 'combobox'
    if (t === 'textarea') return 'textbox'
    if (t === 'input') { const ty = (el as HTMLInputElement).type; return ty === 'checkbox' || ty === 'radio' ? ty : ['submit', 'button', 'reset'].includes(ty) ? 'button' : 'textbox' }
    if (/^h[1-6]$/.test(t)) return 'heading'
    if (t === 'label') return 'label'
    return 'texto'
  }
  const limpa = (s: string) => s.replace(/\s+/g, ' ').trim()
  const textoProprio = (el: Element) => limpa([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent ?? '').join(' '))
  const nos: NoCru[] = []
  for (const el of raiz.querySelectorAll('*')) {
    if (IGNORA.has(el.tagName)) continue
    const ehControle = el.matches(CONTROLE)
    const proprio = textoProprio(el)
    if (!ehControle && !el.matches(MARCADO) && !proprio) continue
    if (!ehControle && el.closest(CONTROLE)) continue // o texto de dentro de um controle é o nome do controle
    const cs = getComputedStyle(el)
    if (el.getClientRects().length === 0 || cs.visibility !== 'visible' || cs.opacity === '0') continue
    const r = el.getBoundingClientRect()
    const he = el as HTMLElement
    const inp = el as HTMLInputElement
    const texto = limpa(ehControle ? (he.innerText || inp.value || inp.placeholder || el.getAttribute('title') || '') : (el.matches(MARCADO) ? he.innerText : proprio) || '')
    const sr = (r.width <= 1 && r.height <= 1) || /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip) || cs.clipPath === 'inset(50%)'
    let clip: NoCru['clip'] = null
    for (let a = el.parentElement; a && a !== raiz.parentElement; a = a.parentElement) {
      const as = getComputedStyle(a)
      const ox2 = as.overflowX, oy2 = as.overflowY
      if (ox2 === 'visible' && oy2 === 'visible') continue
      if (a === document.body || a === document.documentElement) break
      const ar = a.getBoundingClientRect()
      clip = { x: ar.left + a.clientLeft - ox, y: ar.top + a.clientTop - oy, w: a.clientWidth, h: a.clientHeight, rolagem: /auto|scroll/.test(ox2 + oy2) }
      break
    }
    const escondeX = /hidden|clip/.test(cs.overflowX), escondeY = /hidden|clip/.test(cs.overflowY)
    nos.push({
      role: papel(el), tag: el.tagName.toLowerCase(), testid: el.getAttribute('data-testid'), texto, nome: el.getAttribute('aria-label'),
      x: Math.round((r.left - ox) * 10) / 10, y: Math.round((r.top - oy) * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
      sr, clip,
      corta: { x: !!texto && escondeX && he.scrollWidth > he.clientWidth + 1, y: !!texto && escondeY && he.scrollHeight > he.clientHeight + 1 },
    })
  }
  return { nos, viewport: { w: window.innerWidth, h: window.innerHeight }, doc: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth } }
}

/** Nó cru → nó do JSON: chave estável entre larguras; texto em claro só em superfície pública. */
export function paraJson(nos: NoCru[], publica: boolean) {
  const vistos = new Map<string, number>()
  return nos.map((n) => {
    const base = n.testid ? `t:${n.testid}` : `${n.role}:${n.texto ? hash(n.texto) : n.nome ? hash(n.nome) : '∅'}`
    const i = (vistos.get(base) ?? 0) + 1
    vistos.set(base, i)
    return {
      k: `${base}#${i}`, role: n.role, tag: n.tag, testid: n.testid,
      h_texto: n.texto ? hash(n.texto) : null, h_nome: n.nome ? hash(n.nome) : null, n: n.texto.length,
      ...(publica ? { rotulo: n.texto || n.nome || '' } : {}),
      x: n.x, y: n.y, w: n.w, h: n.h, sr: n.sr, clip: n.clip, corta: n.corta,
    }
  })
}

/** A folha: a moldura C (1138) ou B (711) da seção, em coordenadas da moldura. */
export async function medirFolha(page: Page, pasta: string, secao: string, publica: boolean) {
  const arq = path.resolve('docs/ux/DESIGN-I1', pasta, 'telas.html')
  await page.setViewportSize({ width: 1500, height: 900 })
  await page.goto(`file://${arq}`, { waitUntil: 'load' })
  const out: Record<string, ReturnType<typeof paraJson>> = {}
  for (const [faixa, px] of [['C', 1138], ['B', 711]] as const) {
    const ok = await page.evaluate(({ secao, px }) => {
      document.querySelectorAll('[data-gfaixa-raiz]').forEach((e) => e.removeAttribute('data-gfaixa-raiz'))
      const m = [...document.querySelectorAll(`section[data-estado="${secao}"] div`)].find((d) => (d as HTMLElement).style.width === `${px}px`)
      m?.setAttribute('data-gfaixa-raiz', '1')
      return !!m
    }, { secao, px })
    if (!ok) throw new Error(`G-faixa: folha ${pasta} sem a moldura ${faixa} da seção ${secao}`)
    out[faixa] = paraJson((await page.evaluate(coletar, '[data-gfaixa-raiz]')).nos, publica)
  }
  return out
}
