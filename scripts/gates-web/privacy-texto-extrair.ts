/**
 * I1-PR8 — o texto da `/privacy-policy`, congelado (I1-D17 exceção, I1-D19: o texto não se traduz nem se
 * reescreve). Abre a página num Chromium e grava o texto visível normalizado: o `innerText` do `<body>`,
 * uma linha por bloco (o que o navegador quebra), espaços colapsados, linhas vazias fora, na ordem do DOM;
 * depois, os `href` dos `mailto:`, um por linha, prefixados por `mailto ` (o CN de igualdade confere os
 * dois). Só leitura de uma página estática; nenhum request além dela.
 *
 * Uso (da raiz, com o `next dev` no ar):
 *   pnpm exec tsx scripts/gates-web/privacy-texto-extrair.ts http://localhost:3108 > <saida>.txt
 */
import { chromium } from '@playwright/test'

export const normalizar = (texto: string): string[] =>
  texto.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)

async function main() {
  const base = process.argv[2] ?? 'http://localhost:3000'
  const navegador = await chromium.launch()
  try {
    const page = await navegador.newPage({ viewport: { width: 1138, height: 800 } })
    await page.goto(new URL('/privacy-policy', base).href, { waitUntil: 'networkidle' })
    // o selo do `next dev` (nextjs-portal) é shadow DOM: fora do innerText do body
    const texto = await page.evaluate(() => document.body.innerText)
    const mailtos = await page.$$eval('a[href^="mailto:"]', (as) => as.map((a) => a.getAttribute('href') ?? ''))
    process.stdout.write([...normalizar(texto), ...mailtos.map((h) => `mailto ${h}`)].join('\n') + '\n')
  } finally {
    await navegador.close()
  }
}

if (process.argv[1]?.endsWith('privacy-texto-extrair.ts')) void main()
