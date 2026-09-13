// WCAG 2.1 — luminância relativa em sRGB, cores opacas (o método do V1-A4 / anexo G do pre-check)
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const L = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) }
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const bg = { escuro: '#100F16', claro: '#F6F1EA' }
const tokens = {
  text: ['#F9F5F1', '#100F16'], muted: ['#A9A5B5', '#5E5A6A'], accent: ['#777CE8', '#777CE8'],
  error: ['#E5686F', '#E5686F'], offline: ['#C9923B', '#C9923B'], line: ['#2A2836', '#D6CFC3'],
  accentInk: ['#777CE8', '#4A4FC0'], errorInk: ['#E5686F', '#A32A31'], offlineInk: ['#C9923B', '#7A5410'], lineInfo: ['#6E6A80', '#8E8779'],
}
const ok = (r, min) => (r >= min ? 'ok' : 'REPROVA')
for (const [k, [d, l]] of Object.entries(tokens)) {
  const rd = cr(d, bg.escuro), rl = cr(l, bg.claro)
  const f = (x) => x.toFixed(2).replace('.', ',')
  const f4 = (x) => x.toFixed(4).replace('.', ',')
  console.log(`${k.padEnd(11)} escuro ${d} ${f(rd).padStart(5)} (${f4(rd)}) | claro ${l} ${f(rl).padStart(5)} (${f4(rl)}) | ícone ${ok(rd,3)}/${ok(rl,3)}  texto ${ok(rd,4.5)}/${ok(rl,4.5)}`)
}
