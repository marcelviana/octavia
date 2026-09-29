// I1-PR10, commit 1 — o erro que o pdf.js 4.8.69 (o do react-pdf 9.2.1) dá NO NAVEGADOR, por espécie de falha do
// arquivo. Página local mínima (só o pdf.min.mjs + worker copiados de node_modules), servida por http na porta 3111;
// a URL do "arquivo" é de outra origem (http://arquivo.invalid) e TODA resposta é fabricada por page.route() —
// nada sai da máquina. Uso: node docs/ux/I1-PR10-anexos/cn/pdfjs-erros-navegador.mjs <pasta-da-pagina>
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
const pasta = process.argv[2]
const srv = http.createServer((q, r) => {
  const f = path.join(pasta, q.url === '/' ? 'index.html' : q.url)
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end() }
  r.writeHead(200, { 'content-type': f.endsWith('.mjs') ? 'text/javascript' : 'text/html' }); r.end(fs.readFileSync(f))
}).listen(3111)
const b = await chromium.launch()
console.log('chromium', b.version())
const p = await b.newPage()
await p.goto('http://localhost:3111/')
await p.waitForFunction(() => window.pronto)
const cors = { 'access-control-allow-origin': '*' }
const casos = [
  ['HTTP 500', (r) => r.fulfill({ status: 500, headers: cors, body: 'erro' })],
  ['HTTP 404', (r) => r.fulfill({ status: 404, headers: cors, body: 'nada' })],
  ['corpo não-PDF (200, HTML)', (r) => r.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/pdf' }, body: '<html>não é pdf</html>' })],
  ['rede: abort("failed")', (r) => r.abort('failed')],
  ['rede: abort("internetdisconnected")', (r) => r.abort('internetdisconnected')],
  ['sem CORS (200 sem access-control-allow-origin)', (r) => r.fulfill({ status: 200, body: '%PDF-1.4' })],
]
for (const [nome, fazer] of casos) {
  await p.unrouteAll()
  await p.route('http://arquivo.invalid/**', fazer)
  console.log(`${nome} → ${await p.evaluate(() => window.abrir('http://arquivo.invalid/partitura.pdf'))}`)
}
await b.close(); srv.close()
