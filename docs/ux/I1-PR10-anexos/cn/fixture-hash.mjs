// I1-PR-10 — a prova de que a partitura do aceite é a FIXTURE (o PDF gerado), não o PDF da conta: o `route()` do
// arquivo responde no nível da página, antes da vigia do contexto, então o log de requests do JSON não o mostra.
// Procura, pelo hash (sha256[0:12], o de g-faixa-coleta.ts), o texto da camada de texto da página 1 da fixture e as
// frases de cada estado do PDF. Uso (da raiz): node docs/ux/I1-PR10-anexos/cn/fixture-hash.mjs
import { createHash } from 'node:crypto'
import fs from 'node:fs'
const h = (t) => createHash('sha256').update(t).digest('hex').slice(0, 12)
const j = JSON.parse(fs.readFileSync('tests/gates-web/medicoes/content.json', 'utf8'))
const alvos = {
  fixture: 'Partitura de 12 paginas - pagina 1 (fixture do G-faixa)',
  'página 1 de 12': 'página 1 de 12',
  carregando: 'carregando o PDF…',
  erro: 'não foi possível abrir o PDF — o arquivo está corrompido ou inacessível',
}
for (const st of ['VIEW-partitura', 'VIEW-partitura-cheia', 'VIEW-carregando-pdf', 'VIEW-erro-pdf'])
  for (const L of ['1138', '711', '411']) {
    const nos = j.estados[st].larguras[L].nos
    console.log(`${st} · ${L}: ` + Object.entries(alvos).map(([n, t]) => `${n} ${nos.some((x) => x.h_texto === h(t)) ? 'sim' : 'não'}`).join(' · '))
  }
