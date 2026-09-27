/**
 * G-faixa — o ESPERADO: a própria folha medida (I1-PR6, molde das PRs de superfície).
 *
 * Abre `docs/ux/DESIGN-I1/<pasta>/telas.html` (HTML estático, `file://`, sem
 * servidor) e, para cada `<section data-estado>`, mede as molduras C (1138) e B
 * (711) com a MESMA `coletar` da medição do app (`g-faixa-coleta.ts`), em
 * coordenadas da moldura. Grava `tests/gates-web/esperado/<pasta>.json` — é
 * contra isso que a diferença de 4 px (errata candidata) se mede.
 *
 * Uso (da raiz; não precisa de `G_FAIXA_BASE_URL`, não abre rede):
 *   pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 1-auth 0-linha-de-aviso
 *
 * O texto vai em claro (`rotulo`): a folha é obra do projeto, não do usuário
 * (CLAUDE.md, "o que a regra NÃO alcança").
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { coletar, paraJson } from './g-faixa-coleta'

// a versão fixada vem do texto da config (importá-la lança sem `G_FAIXA_BASE_URL`, de propósito)
const CHROMIUM_FIXADO_ESPERADO = fs.readFileSync('playwright.g-faixa.config.ts', 'utf8').match(/CHROMIUM_FIXADO = '([^']+)'/)?.[1]
const pastas = process.argv.slice(2)
if (pastas.length === 0) {
  console.error('uso: tsx scripts/gates-web/g-faixa-esperado.ts <pasta da folha> [...]')
  process.exit(2)
}

async function main() {
  const navegador = await chromium.launch()
  if (navegador.version() !== CHROMIUM_FIXADO_ESPERADO) {
    console.error(`g-faixa-esperado: Chromium ${navegador.version()} ≠ ${CHROMIUM_FIXADO_ESPERADO} (div. 512)`)
    await navegador.close()
    process.exit(2)
  }
  try {
    for (const pasta of pastas) {
      const arq = path.resolve('docs/ux/DESIGN-I1', pasta, 'telas.html')
      const sha = createHash('sha256').update(fs.readFileSync(arq)).digest('hex')
      const page = await navegador.newPage({ viewport: { width: 1500, height: 900 } })
      await page.goto(`file://${arq}`, { waitUntil: 'load' })
      // o `tsx` (esbuild, keepNames) envolve as funções internas de `coletar` em `__name(…)`, que a
      // página não tem; o transform do Playwright Test não faz isso. Um `__name` identidade basta.
      await page.evaluate('window.__name = (f) => f')
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      // âncoras (decisão 7): a caixa do campo recebe o `data-testid` do app, pelo rótulo do irmão anterior
      const arqAncoras = path.join('tests/gates-web/esperado', `${pasta}.ancoras.json`)
      const ancoras = fs.existsSync(arqAncoras) ? JSON.parse(fs.readFileSync(arqAncoras, 'utf8')) as { seletor: string; porRotulo: Record<string, string> } : null
      const ancorados = ancoras ? await page.evaluate(({ seletor, porRotulo }) => {
        let n = 0
        for (const cx of document.querySelectorAll(seletor)) {
          const rotulo = (cx.previousElementSibling as HTMLElement | null)?.innerText.split('\n')[0]?.trim() ?? ''
          const t = porRotulo[rotulo]
          if (t) { cx.setAttribute('data-testid', t); n++ }
        }
        return n
      }, ancoras) : 0
      const secoes = await page.evaluate(() => [...document.querySelectorAll('section[data-estado]')].map((s) => s.getAttribute('data-estado') as string))
      const estados: Record<string, { C: ReturnType<typeof paraJson>; B: ReturnType<typeof paraJson> } | { falta: string }> = {}
      for (const secao of secoes) {
        const out: Record<string, ReturnType<typeof paraJson>> = {}
        let falta = ''
        for (const [faixa, px] of [['C', 1138], ['B', 711]] as const) {
          const ok = await page.evaluate(({ secao, px }) => {
            document.querySelectorAll('[data-gfaixa-raiz]').forEach((e) => e.removeAttribute('data-gfaixa-raiz'))
            const m = [...document.querySelectorAll(`section[data-estado="${secao}"] div`)].find((d) => (d as HTMLElement).style.width === `${px}px`)
            m?.setAttribute('data-gfaixa-raiz', '1')
            return !!m
          }, { secao, px })
          if (!ok) { falta += `${faixa} `; continue }
          out[faixa] = paraJson((await page.evaluate(coletar, '[data-gfaixa-raiz]')).nos, true)
        }
        estados[secao] = falta ? { falta: `sem a moldura ${falta.trim()}` } : (out as { C: ReturnType<typeof paraJson>; B: ReturnType<typeof paraJson> })
      }
      await page.close()
      const peca = { folha: pasta, arquivo: path.relative(process.cwd(), arq), sha256: sha, chromium: navegador.version(), ancorados, estados }
      fs.mkdirSync('tests/gates-web/esperado', { recursive: true })
      const saida = path.join('tests/gates-web/esperado', `${pasta}.json`)
      fs.writeFileSync(saida, JSON.stringify(peca, null, 1) + '\n')
      const n = Object.values(estados).filter((e) => !('falta' in e))
      console.log(`${pasta}: ${ancorados} caixa(s) de campo ancorada(s) ·`, `${secoes.length} seções · ${n.length} com C e B · nós C ${n.reduce((a, e) => a + (e as { C: unknown[] }).C.length, 0)} · nós B ${n.reduce((a, e) => a + (e as { B: unknown[] }).B.length, 0)} → ${saida}`)
      for (const [s, e] of Object.entries(estados)) if ('falta' in e) console.log(`  ✗ ${s}: ${e.falta}`)
    }
  } finally {
    await navegador.close()
  }
}

void main()
