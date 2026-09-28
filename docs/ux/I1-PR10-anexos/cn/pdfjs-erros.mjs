import * as pdfjs from '../../../../node_modules/pdfjs-dist/legacy/build/pdf.mjs'
const casos = {
  'corpo HTML (não-PDF)': new TextEncoder().encode('<html><body>not a pdf</body></html>'),
  'corpo vazio': new Uint8Array(0),
  'PDF truncado': new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Type /Catalog'),
}
for (const [n, data] of Object.entries(casos)) {
  try { await pdfjs.getDocument({ data, verbosity: 0 }).promise; console.log(n, '→ abriu') }
  catch (e) { console.log(`${n} → name=${e?.name} · message=${JSON.stringify(e?.message)}`) }
}
