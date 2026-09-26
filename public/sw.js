// Worker de AUTO-DESTRUIÇÃO (I1-PR3, div. 560, aval 2 [Marcel, 2026-09-26]).
// O web deixou de ser PWA. Navegador que ainda tem o worker antigo (cache-first
// de `/`) baixa este na checagem de update: ele apaga todos os caches da origem
// e os IndexedDB do cache offline, desregistra-se e recarrega as abas. Sem
// `fetch` handler: nada é interceptado. Escrito à mão, não gerado.
// SAI no bloco seguinte ao I1 (herança nomeada no I1-PR3-anexos/README.md),
// junto com o `worker-src` da CSP.
// Bancos: 'localforage' = instância padrão do localforage (lib/offline-cache,
// lib/offline-setlist-cache, lib/offline-queue); 'octavia-performance-cache'
// (lib/advanced-content-cache). O 'firebaseLocalStorageDb' (sessão) NÃO se toca.
const BANCOS = ['localforage', 'octavia-performance-cache']

const apagarBanco = (nome) =>
  new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(nome)
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys()
      await Promise.all(nomes.map((n) => caches.delete(n)))
      await Promise.all(BANCOS.map(apagarBanco))
      await self.registration.unregister()
      const abas = await self.clients.matchAll({ type: 'window' })
      await Promise.all(abas.map((c) => c.navigate(c.url).catch(() => {})))
    })()
  )
})
