// G-faixa — o VEREDITO (I1-PR5; I1-D13, I1-D16). É o que roda no CI.
//
// Lê SÓ os JSON commitados (`tests/gates-web/medicoes/*.json`, sem descer em
// subpastas: `cn-main/` é a linha de base do web velho, que reprova por
// construção). Não abre navegador, não faz request. Recalcula a classificação
// a partir dos nós crus (`g-faixa-classificar.mjs`) — não confia em resumo
// gravado — e:
//   REPROVA em (e) ou (b) nas larguras de C (1138) e B (711);
//   CONTA, sem reprovar: (d′), errata candidata (4 px contra a folha), as
//   saídas nome-acessível e rolagem (N3-D29), e tudo o que a faixa A (411) der;
//   REPROVA também o JSON que não se sustenta: sem controle positivo do
//   listener (div. 522), com escrita/produção no log de requests, sem a
//   largura de referência (1138) para o (e), ou Chromium fora do fixado.
//
// Uso (da raiz):  node scripts/gates-web/g-faixa-veredito.mjs [pasta]
// Sai 0 se passa, 1 se reprova, 2 se o JSON não se lê.
import fs from "node:fs"
import path from "node:path"
import { classificarEstado, REFERENCIA } from "./g-faixa-classificar.mjs"

const PASTA = process.argv[2] ?? "tests/gates-web/medicoes"
const CHROMIUM_FIXADO = "140.0.7339.16" // o mesmo do playwright.g-faixa.config.ts (lido abaixo)
{
  const cfg = fs.readFileSync("playwright.g-faixa.config.ts", "utf8").match(/CHROMIUM_FIXADO = '([^']+)'/)?.[1]
  if (cfg !== CHROMIUM_FIXADO) { console.error(`g-faixa-veredito: CHROMIUM_FIXADO da config (${cfg}) ≠ do veredito (${CHROMIUM_FIXADO})`); process.exit(2) }
}
const arquivos = fs.existsSync(PASTA) ? fs.readdirSync(PASTA).filter((f) => f.endsWith(".json")).sort() : []
console.log(`G-faixa (veredito) — ${PASTA}: ${arquivos.length} medição(ões)`)
if (arquivos.length === 0) {
  console.log("  nenhuma superfície medida ainda — cada PR de superfície commita a sua (I1-D16)")
  console.log("\nG-faixa: PASSA — nada a julgar")
  process.exit(0)
}

let falhas = 0
const falha = (m) => { console.log(`  ✗ ${m}`); falhas++ }
const LIMITE = 12 // ocorrências listadas por (tipo, largura); o resto só conta
for (const f of arquivos) {
  let s
  try { s = JSON.parse(fs.readFileSync(path.join(PASTA, f), "utf8")) } catch (e) { console.error(`g-faixa-veredito: ${f} não é JSON: ${e.message}`); process.exit(2) }
  console.log(`\n## ${s.superficie} (${s.rota}) — rodada ${s.rodada} · base ${s.base} · commit ${s.commit}`)
  if (s.chromium !== CHROMIUM_FIXADO) falha(`Chromium ${s.chromium} ≠ fixado ${CHROMIUM_FIXADO}`)
  for (const [L, c] of Object.entries(s.controlePositivo ?? {}))
    if (/AUSENTE/.test(`${c.controle1} ${c.controle2}`)) falha(`${L}: controle positivo do listener falhou (${c.controle1} · ${c.controle2})`)
  for (const [L, r] of Object.entries(s.requests ?? {})) {
    const esc = (r.linhas ?? []).filter((l) => l.caminho.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(l.metodo) && !l.caminho.startsWith("/api/auth/session"))
    if (esc.length) falha(`${L}: escrita a /api/* no log: ${esc.map((l) => `${l.metodo} ${l.caminho}`).join(", ")}`)
    if (r.prodAbortados) console.log(`  · ${L}: ${r.prodAbortados} request(s) a octavia.rocks abortado(s) no navegador`)
  }
  for (const [id, estado] of Object.entries(s.estados)) {
    if (estado.pulado) { falha(`${id}: estado não medido — ${estado.pulado}`); continue }
    if (!estado.larguras[REFERENCIA]) falha(`${id}: sem a medição de ${REFERENCIA} (a referência do (e))`)
    const c = classificarEstado(estado)
    for (const L of Object.keys(c).sort((a, b) => b - a)) {
      const r = c[L]
      const cab = `${id} · ${L}${r.reprova ? "" : " (faixa A — contado à parte)"}`
      console.log(`  ${cab}: (e)=${r.e.length} · (b)=${r.b.length} · (d′)=${r.dl.length} · errata candidata=${r.errata.length} · saídas: nome-acessível=${r.saidas.nomeAcessivel} rolagem=${r.saidas.rolagem}`)
      const rotulo = (k) => {
        const n = estado.larguras[L]?.nos.find((x) => x.k === k) ?? estado.larguras[REFERENCIA]?.nos.find((x) => x.k === k)
        return n?.rotulo !== undefined ? ` "${n.rotulo.slice(0, 60)}"` : n ? ` <${n.tag} ${n.role}, ${n.n} car.>` : ""
      }
      for (const [tipo, lista] of [["(e)", r.e], ["(b)", r.b]]) {
        lista.slice(0, LIMITE).forEach((o) => {
          const m = `${cab} ${tipo} ${o.tipo}: ${o.k}${rotulo(o.k)}`
          if (r.reprova) falha(m); else console.log(`    · ${m}`)
        })
        if (lista.length > LIMITE) { if (r.reprova) { falhas += lista.length - LIMITE; console.log(`  ✗ … e mais ${lista.length - LIMITE} ${tipo} em ${cab}`) } else console.log(`    · … e mais ${lista.length - LIMITE}`) }
      }
    }
  }
}
console.log(falhas ? `\nG-faixa: REPROVA — ${falhas} ocorrência(s)` : "\nG-faixa: PASSA")
process.exit(falhas ? 1 : 0)
