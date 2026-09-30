// I1-PR15 — a prova por imagem (o método da I1-PR14 §14): full page, Chromium do Playwright, o indicador do next dev
// removido; PNG + a geometria de todo elemento visível do <body> (tag, hash do texto folha, x, y, w, h).
// Uso: node capturar.mjs <base> <saida> <rota,...> [perfil]
//   sem perfil: contexto limpo (as públicas); com perfil: launchPersistentContext (o dashboard, I1-D37).
// Barreira: qualquer POST/PUT/PATCH/DELETE a /api/* é abortado e conta como falha; octavia.rocks é abortado.
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
const require = createRequire(path.join(process.env.ARVORE, "package.json"))
const { chromium } = require("@playwright/test")

const [base, saida, rotasArg, perfil] = process.argv.slice(2)
const rotas = rotasArg.split(",")
const LARGURAS = { 1138: 711, 711: 1138, 411: 823 }
fs.mkdirSync(saida, { recursive: true })
let escritas = 0
const barreira = async (ctx) => {
  await ctx.route("**/*", (r) => {
    const u = new URL(r.request().url()), m = r.request().method()
    if (u.hostname.endsWith("octavia.rocks")) return r.abort()
    if (u.pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(m) && !u.pathname.startsWith("/api/auth/session")) { escritas++; return r.abort() }
    return r.continue()
  })
}
const ctx = perfil
  ? await chromium.launchPersistentContext(perfil, { headless: true, viewport: { width: 1138, height: 711 } })
  : await (await chromium.launch({ headless: true })).newContext({ viewport: { width: 1138, height: 711 } })
await barreira(ctx)
const page = ctx.pages()[0] ?? (await ctx.newPage())
for (const rota of rotas) for (const [w, h] of Object.entries(LARGURAS)) {
  await page.setViewportSize({ width: +w, height: h })
  await page.goto(base + (rota === "landing" ? "/" : `/${rota}`), perfil ? { waitUntil: "load", timeout: 180_000 } : { waitUntil: "networkidle" })
  if (perfil && new URL(page.url()).pathname.startsWith("/login")) throw new Error(`${rota}: sessão caída (foi para /login)`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(perfil ? 4000 : 800) // com sessão o Firebase não deixa a rede ociosa
  await page.evaluate(() => { for (const e of document.querySelectorAll("nextjs-portal")) e.remove() })
  const nome = `${rota}-${w}`
  await page.screenshot({ path: path.join(saida, `${nome}.png`), fullPage: true, animations: "disabled", caret: "hide" })
  const geo = await page.evaluate(() => {
    const out = []
    for (const e of document.body.querySelectorAll("*")) {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e)
      if (!r.width || !r.height || cs.visibility === "hidden") continue
      const folha = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim()
      out.push([e.tagName.toLowerCase(), folha, Math.round(r.x * 10) / 10, Math.round((r.y + scrollY) * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10, cs.fontFamily])
    }
    return { nos: out, body: getComputedStyle(document.body).fontFamily, html: getComputedStyle(document.documentElement).fontFamily }
  })
  // texto só como hash (a regra do texto de música): o dashboard mostra a biblioteca da conta
  geo.nos = geo.nos.map(([t, f, ...r]) => [t, f ? createHash("sha256").update(f).digest("hex").slice(0, 12) : "", ...r])
  fs.writeFileSync(path.join(saida, `${nome}.json`), JSON.stringify(geo))
  console.log(`${nome}: ${geo.nos.length} nós · body font-family ${geo.body}`)
}
await ctx.close()
console.log(`escritas abortadas: ${escritas}`)
process.exit(escritas ? 1 : 0)
