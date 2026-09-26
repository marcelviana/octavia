// I1-PR3, commit 3 — aceite B (div. 560): o worker de auto-destruição, medido num perfil
// real do Chrome. Anexo (rastro executável), não código do app. Local, sem login, sem .env*.
//
// uso (da raiz de uma árvore com node_modules):
//   node docs/ux/I1-PR3-anexos/aceite/sw-autodestruicao.mjs semear    <userDataDir>
//   node docs/ux/I1-PR3-anexos/aceite/sw-autodestruicao.mjs verificar <userDataDir>
// Alvo fixo: http://localhost:3000 (quem sobe o servidor é o operador: `main` para `semear`,
// a branch para `verificar`). Chrome do sistema (`channel: 'chrome'`, div. 512).
//
// SEMEADURA DECLARADA (estado de teste, não do app): além do que o app cria sozinho ao abrir
// `/`, o `semear` cria — só se ausentes — os bancos IndexedDB `octavia-performance-cache`
// (o palco o criava; `/` não o cria) e `firebaseLocalStorageDb` (a sessão do Firebase; sem
// login ele não existe), cada um com um objectStore vazio. O primeiro prova que o worker o
// apaga; o segundo prova que o worker NÃO o toca. O que foi semeado sai impresso.
import { chromium } from '@playwright/test'

const BASE = 'http://localhost:3000'
const [, , fase, perfil] = process.argv
if (!['semear', 'verificar'].includes(fase) || !perfil) {
  console.error('uso: node sw-autodestruicao.mjs <semear|verificar> <userDataDir>')
  process.exit(2)
}

const t0 = Date.now()
const log = (...a) => console.log(`[${String(Date.now() - t0).padStart(6)} ms]`, ...a)

async function estado(page) {
  // a página pode navegar no meio (o worker recarrega os clientes): tenta de novo
  for (let i = 0; i < 20; i++) {
    try {
      return await page.evaluate(async () => {
        const regs = await navigator.serviceWorker.getRegistrations()
        return {
          url: location.href,
          controller: navigator.serviceWorker.controller?.scriptURL ?? null,
          registrations: regs.map((r) => ({
            scope: r.scope,
            active: r.active?.scriptURL ?? null,
            activeState: r.active?.state ?? null,
            waiting: r.waiting?.scriptURL ?? null,
            installing: r.installing?.scriptURL ?? null,
          })),
          caches: await caches.keys(),
          indexedDB: (await indexedDB.databases()).map((d) => d.name).sort(),
          domTemLinkDoManifest: !!document.querySelector('link[rel="manifest"]'),
          cacheDeBarra: await (async () => {
            const r = await caches.match('/')
            if (!r) return null
            const t = await r.text()
            return { bytes: t.length, temLinkDoManifest: t.includes('rel="manifest"') }
          })(),
        }
      })
    } catch (e) {
      await page.waitForTimeout(500)
    }
  }
  throw new Error('estado: a página não parou de navegar em 10 s')
}

// O marcador do HTML se lê no CORPO DA RESPOSTA (o que chegou), não no DOM: depois da
// hidratação o <head> pode ser re-renderizado pelo cliente (1ª rodada do controle: documento
// vindo do SW, DOM já sem o link) — o DOM não diz de onde o HTML veio.
function registrarDocumentos(page, rotulo, docs) {
  page.on('response', async (r) => {
    if (r.request().resourceType() !== 'document') return
    const corpo = await r.text().catch(() => '')
    const linha = {
      rotulo,
      url: r.url().replace(BASE, ''),
      status: r.status(),
      fromServiceWorker: r.fromServiceWorker(),
      corpoTemLinkDoManifest: corpo.includes('rel="manifest"'),
      bytes: corpo.length,
    }
    docs.push(linha)
    log('documento', JSON.stringify(linha))
  })
}

const ctx = await chromium.launchPersistentContext(perfil, {
  channel: 'chrome',
  headless: !process.env.HEADED,
  serviceWorkers: 'allow',
  viewport: { width: 1138, height: 800 },
})
const page = ctx.pages()[0] ?? (await ctx.newPage())
const docs = []

try {
  if (fase === 'semear') {
    registrarDocumentos(page, 'semear', docs)
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    const ready = await page.evaluate(async () => {
      const r = await Promise.race([
        navigator.serviceWorker.ready.then(() => 'ready'),
        new Promise((res) => setTimeout(() => res('timeout 30s'), 30_000)),
      ])
      return r
    })
    log('navigator.serviceWorker.ready →', ready)
    // segunda carga: agora controlada pelo worker (o PAGE_CACHE guarda `/`)
    await page.reload({ waitUntil: 'load' })
    await page.waitForTimeout(3000)
    const antes = await estado(page)
    log('ANTES da semeadura:', JSON.stringify(antes, null, 2))
    const semeados = await page.evaluate(async () => {
      const existentes = new Set((await indexedDB.databases()).map((d) => d.name))
      const feitos = []
      for (const nome of ['octavia-performance-cache', 'firebaseLocalStorageDb']) {
        if (existentes.has(nome)) continue
        await new Promise((res, rej) => {
          const req = indexedDB.open(nome, 1)
          req.onupgradeneeded = () => req.result.createObjectStore('aceite-b')
          req.onsuccess = () => { req.result.close(); res() }
          req.onerror = () => rej(req.error)
        })
        feitos.push(nome)
      }
      return feitos
    })
    log('SEMEADOS (declarado no cabeçalho):', JSON.stringify(semeados))
    const depois = await estado(page)
    log('ESTADO FINAL (main):', JSON.stringify(depois, null, 2))
  } else {
    registrarDocumentos(page, 'carga-1', docs)
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    const inicio = await estado(page)
    log('CARGA 1 — ao abrir o perfil na branch:', JSON.stringify(inicio, null, 2))

    // força a checagem de update (o navegador também a faz sozinho na navegação)
    const upd = await page
      .evaluate(async () => {
        const r = await navigator.serviceWorker.getRegistration()
        if (!r) return 'sem registro'
        try {
          await r.update()
          return 'update() resolvido'
        } catch (e) {
          return `update() rejeitado: ${e && e.message}`
        }
      })
      .catch((e) => `evaluate interrompido (navegação): ${e.message.split('\n')[0]}`)
    log('registration.update() →', upd)

    // espera a troca: registro e caches vazios, ou 30 s
    let fim = null
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500)
      fim = await estado(page)
      if (fim.registrations.length === 0 && fim.caches.length === 0) break
    }
    log(`ESTADO depois da espera (${fim.registrations.length === 0 && fim.caches.length === 0 ? 'trocou' : 'NÃO trocou em 30 s'}):`, JSON.stringify(fim, null, 2))

    docs.length = 0
    page.removeAllListeners('response')
    registrarDocumentos(page, 'carga-2', docs)
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    const segunda = await estado(page)
    log('CARGA 2 — segunda carga de `/`:', JSON.stringify(segunda, null, 2))
    const doc = docs.find((d) => d.url === '/' || d.url === '')
    log(
      'VEREDITO DA CARGA 2:',
      JSON.stringify({
        documentoVeioDoServiceWorker: doc ? doc.fromServiceWorker : 'sem resposta de documento registrada',
        corpoTemLinkDoManifest: doc ? doc.corpoTemLinkDoManifest : null,
        leitura: !doc
          ? 'inconclusivo'
          : doc.fromServiceWorker
            ? 'HTML servido pelo worker antigo (cache)'
            : doc.corpoTemLinkDoManifest
              ? 'HTML da rede, mas com o link do manifest (NÃO é a branch)'
              : 'HTML da rede, da branch (sem <link rel="manifest">)',
      })
    )
  }
} finally {
  await ctx.close()
}
