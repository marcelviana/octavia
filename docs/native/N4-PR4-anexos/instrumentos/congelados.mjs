import {readFileSync} from 'node:fs'
const files = ['docs/native/DESIGN-V1/telas.html','docs/native/DESIGN-V1/icones.html','docs/native/DESIGN-N2/telas.html','docs/native/DESIGN-N3/telas.html',
 ...['0-linha-de-aviso','1-auth','2-landing','3-privacy-policy','4-content-lista','5-content-visualizacao','6-content-editor','7-upload','8-setlists'].map(d=>`docs/ux/DESIGN-I1/${d}/telas.html`)]
const marcas = {
  letra: 'M4 5.25h13M4 9.75h16M4 14.25h10M4 18.75h14',
  cifra: 'M4 9.5h16',
  tab: 'M3 3h18M3 6.6h1.225',
  'tab@20': 'M3 4.2h18M3 9.4h2.1',
  'tab@20-I1': 'M3 6h18M3 10h18M3 14h18M3 18h18',
  partitura: 'M3 5h18M3 8.5h18M3 12h18M3 15.5h18M3 19h18',
}
for (const f of files) {
  const b = readFileSync(f,'utf8')
  const m = /<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/.exec(b)
  const t = m ? JSON.parse(m[1]) : b
  const res = {}
  for (const [n, d] of Object.entries(marcas)) {
    let i = -1; const frames = new Map()
    while ((i = t.indexOf(`d="${d}`, i + 1)) !== -1) {
      // nearest enclosing label: data-screen-label or an id like N?-... before
      const before = t.slice(Math.max(0, i - 200000), i)
      const lab = [...before.matchAll(/data-screen-label="([^"]+)"/g)].pop()?.[1] ?? '?'
      const ids = [...before.matchAll(/>((?:N[0-9]-)?[A-C]?-?S[0-9][a-z]?[A-Za-z0-9-]*|N[0-9]-[A-Z]-[A-Za-z0-9-]+|[0-9]-[a-z][A-Za-z0-9-]*)[ <·]/g)].pop()?.[1] ?? ''
      const k = `${lab}${ids ? ' / ' + ids : ''}`
      frames.set(k, (frames.get(k) ?? 0) + 1)
    }
    if (frames.size) res[n] = [...frames].map(([k, c]) => `${k}×${c}`)
  }
  console.log('###', f, Object.keys(res).length ? '' : '— nenhum')
  for (const [n, l] of Object.entries(res)) console.log('  ', n, '→', l.length, 'locais:', l.join(' | '))
}
