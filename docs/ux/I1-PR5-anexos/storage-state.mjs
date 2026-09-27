// I1-PR5 — a hipótese do G-faixa: "storageState({ indexedDB: true }) carrega a sessão do
// Firebase, e o perfil persistente é dispensável". Rastro (não é gate). O que dá para medir SEM
// login, contra o `next dev` local sem .env (Firebase desligado): o MECANISMO — se o
// storageState captura e devolve (1) um IndexedDB com a forma do do Firebase Auth
// (`firebaseLocalStorageDb` / `firebaseLocalStorage`, keyPath `fbase_key`) e (2) o cookie
// httpOnly `firebase-session` do servidor. O registro é FALSO (nenhum token real).
// Uso (da raiz): node docs/ux/I1-PR5-anexos/storage-state.mjs http://localhost:3000
import { chromium } from '@playwright/test'
const BASE = process.argv[2] ?? 'http://localhost:3000'
const b = await chromium.launch()
console.log(`Chromium ${b.version()} · base ${BASE}`)
const REG = { fbase_key: 'firebase:authUser:CHAVE-FALSA:[DEFAULT]', value: { uid: 'uid-falso', stsTokenManager: { refreshToken: 'refresh-FALSO', accessToken: 'id-FALSO', expirationTime: 1 } } }

const a = await b.newContext()
const pa = await a.newPage()
await pa.goto(new URL('/login', BASE).href, { waitUntil: 'load' })
console.log('(0) IndexedDB que o app cria em /login sem Firebase configurado:', JSON.stringify(await pa.evaluate(() => indexedDB.databases())))
await pa.evaluate((reg) => new Promise((ok, erro) => {
  const r = indexedDB.open('firebaseLocalStorageDb', 1)
  r.onupgradeneeded = () => r.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' })
  r.onsuccess = () => { const tx = r.result.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put(reg); tx.oncomplete = () => ok(1); tx.onerror = erro }
  r.onerror = erro
}), REG)
await a.addCookies([{ name: 'firebase-session', value: 'cookie-FALSO', url: BASE, httpOnly: true, sameSite: 'Lax' }])
const semIdb = await a.storageState()
const comIdb = await a.storageState({ indexedDB: true })
const origem = comIdb.origins.find((o) => o.origin === new URL(BASE).origin)
console.log('(1) storageState() sem a opção — origens com indexedDB:', semIdb.origins.filter((o) => o.indexedDB?.length).length)
console.log('(1) storageState({ indexedDB: true }) — bancos da origem:', JSON.stringify(origem?.indexedDB?.map((d) => ({ nome: d.name, versao: d.version, stores: d.stores.map((s) => ({ nome: s.name, keyPath: s.keyPath, registros: s.records.length })) }))))
console.log('(1) cookie firebase-session no estado:', JSON.stringify(comIdb.cookies.filter((c) => c.name === 'firebase-session').map((c) => ({ nome: c.name, httpOnly: c.httpOnly, valor: c.value }))))
await a.close()

const c = await b.newContext({ storageState: comIdb })
const pc = await c.newPage()
await pc.goto(new URL('/login', BASE).href, { waitUntil: 'load' })
const lido = await pc.evaluate(() => new Promise((ok) => {
  const r = indexedDB.open('firebaseLocalStorageDb')
  r.onsuccess = () => { const q = r.result.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').getAll(); q.onsuccess = () => ok(q.result) }
  r.onerror = () => ok(null)
}))
console.log('(2) contexto NOVO com esse storageState — o registro volta igual:', JSON.stringify(lido) === JSON.stringify([REG]), JSON.stringify(lido))
console.log('(2) o cookie volta:', JSON.stringify((await c.cookies()).filter((x) => x.name === 'firebase-session').map((x) => x.value)))
await c.close()
await b.close()
