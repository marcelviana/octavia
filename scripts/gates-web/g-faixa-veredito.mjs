// G-faixa — o VEREDITO (I1-PR5; I1-D13, I1-D16). É o que roda no CI.
//
// Lê SÓ os JSON commitados (`tests/gates-web/medicoes/*.json`, sem descer em
// subpastas: `cn-main/` é a linha de base do web velho, que reprova por
// construção). Não abre navegador, não faz request. Recalcula a classificação
// a partir dos nós crus (`g-faixa-classificar.mjs`) — não confia em resumo
// gravado — e:
//   REPROVA em (e) ou (b) nas três larguras, C (1138), B (711) e A (411) — errata da
//   I1-D11 [Marcel, 2026-09-28]: "A só não quebra" = (e) = 0 e (b) = 0 em 411, rolagem
//   horizontal da página incluída (a do (e) em 411 é a div. 677); a lista "inalcançáveis
//   em A" (decisão 619) continua saindo, com 0 como critério;
//   CONTA, sem reprovar: (d′), errata candidata (4 px contra a folha), as
//   saídas nome-acessível e rolagem (N3-D29), e o (d′) de 411;
//   REPROVA também o JSON que não se sustenta: sem controle positivo do
//   listener (div. 522), com escrita/produção no log de requests, sem a
//   largura de referência (1138) para o (e), ou Chromium fora do fixado.
//   I1-PR6: a resposta FABRICADA no navegador (`status: "fabricado …"`) não é
//   escrita — não saiu; o estado DECLARADO inalcançável e o NÃO ALCANÇADO pela
//   preparação são LISTADOS e contados à parte (não reprovam: o aceite os
//   nomeia); a errata candidata e os nós SEM PAR com a folha (decisão 7) são
//   LISTADOS por estado × largura.
//   I1-PR7 (div. 681): cada errata candidata sai com a sua cobertura — "coberta por
//   I1-E<n>" quando o estado está numa das `erratasFaixa` de
//   docs/ux/DESIGN-I1/erratas.json, "sem cobertura" quando não; a contagem das sem
//   cobertura sai à parte (não reprova: o aceite as nomeia, o Marcel decide).
//   I1-PR11 (div. 767): a QUEBRA POR DADO (o nó de dado que quebrou linha no lugar do nó
//   da folha, e a cascata de Δy abaixo dele — `quebrasPorDado`/`ehCascata` do classificador)
//   sai À PARTE das candidatas: listada por estado × largura, contada, nunca reprova e não
//   pede errata (a decisão (a) da div. 767, I1-PR10).
//
// Uso (da raiz):  node scripts/gates-web/g-faixa-veredito.mjs [pasta]
// Sai 0 se passa, 1 se reprova, 2 se o JSON não se lê.
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { classificarEstado, REFERENCIA } from "./g-faixa-classificar.mjs"

const PASTA = process.argv[2] ?? "tests/gates-web/medicoes"
const ERRATAS = process.env.G_FAIXA_ERRATAS ?? "docs/ux/DESIGN-I1/erratas.json"
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

// Decisão 619 [Marcel, 2026-09-27]: 411 é contado à parte, e o veredito lista, por superfície,
// TODA (e) de 411 com o nome acessível de cada controle — a herança nomeada da I1-D11
// ("inalcançáveis em A"). Nas superfícies com sessão o JSON só guarda o hash do texto (regra do
// texto de música); o nome sai do DICIONÁRIO das frases de UI do próprio projeto
// (docs/ux/I1-PRECHECK-anexos/frases-web.txt, coluna 3), com o mesmo hash do medidor. O que não
// casa com frase do projeto (um título de música, por exemplo) fica só como hash e comprimento.
const DICIONARIO = "docs/ux/I1-PRECHECK-anexos/frases-web.txt"
const hash = (t) => createHash("sha256").update(t).digest("hex").slice(0, 12)
const frases = new Map()
if (fs.existsSync(DICIONARIO))
  for (const l of fs.readFileSync(DICIONARIO, "utf8").split("\n")) {
    const c = l.split("\t")
    if (c.length === 3 && !l.startsWith("#")) { const t = c[2].replace(/\s+/g, " ").trim(); if (t) frases.set(hash(t), t) }
  }
const nomeDe = (n) => {
  if (!n) return "<nó não encontrado>"
  if (n.rotulo !== undefined) return JSON.stringify(n.rotulo.slice(0, 80))
  const f = (n.h_nome && frases.get(n.h_nome)) ?? (n.h_texto && frases.get(n.h_texto))
  if (f) return JSON.stringify(f)
  if (!n.h_nome && !n.h_texto) return `<sem nome acessível: ${n.tag} ${n.role}>`
  return `<fora das frases do projeto: ${n.tag} ${n.role}, ${n.n} car., ${n.h_texto ?? n.h_nome}>`
}

// I1-PR7 (div. 681): as erratas da folha que o G-faixa acha — por estado da folha.
const erratasFaixa = fs.existsSync(ERRATAS) ? (JSON.parse(fs.readFileSync(ERRATAS, "utf8")).erratasFaixa ?? []) : []
const coberturaDe = (id, secao) => erratasFaixa.find((e) => (e.estados ?? []).some((x) => x === id || x === secao))?.id

let falhas = 0
const falha = (m) => { console.log(`  ✗ ${m}`); falhas++ }
const naoMedidos = []
let erratas = 0, semCobertura = 0, semParFolha = 0, semParApp = 0, quebraDado = 0
const LIMITE = 12 // ocorrências listadas por (tipo, largura); o resto só conta
for (const f of arquivos) {
  let s
  try { s = JSON.parse(fs.readFileSync(path.join(PASTA, f), "utf8")) } catch (e) { console.error(`g-faixa-veredito: ${f} não é JSON: ${e.message}`); process.exit(2) }
  console.log(`\n## ${s.superficie} (${s.rota}) — rodada ${s.rodada} · base ${s.base} · commit ${s.commit}`)
  if (s.chromium !== CHROMIUM_FIXADO) falha(`Chromium ${s.chromium} ≠ fixado ${CHROMIUM_FIXADO}`)
  for (const [L, c] of Object.entries(s.controlePositivo ?? {}))
    if (/AUSENTE/.test(`${c.controle1} ${c.controle2}`)) falha(`${L}: controle positivo do listener falhou (${c.controle1} · ${c.controle2})`)
  for (const [L, r] of Object.entries(s.requests ?? {})) {
    const esc = (r.linhas ?? []).filter((l) => l.caminho.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(l.metodo) && !l.caminho.startsWith("/api/auth/session") && !String(l.status).startsWith("fabricado"))
    if (esc.length) falha(`${L}: escrita a /api/* no log: ${esc.map((l) => `${l.metodo} ${l.caminho}`).join(", ")}`)
    if (r.prodAbortados) console.log(`  · ${L}: ${r.prodAbortados} request(s) a octavia.rocks abortado(s) no navegador`)
  }
  for (const [id, estado] of Object.entries(s.estados)) {
    if (estado.pulado) { falha(`${id}: estado não medido — ${estado.pulado}`); continue }
    if (estado.inalcancavel) { naoMedidos.push(`${s.superficie} · ${id}: INALCANÇÁVEL (declarado) — ${estado.inalcancavel}`); console.log(`  ${id}: inalcançável (declarado) — ${estado.inalcancavel}`); continue }
    for (const [L, r] of Object.entries(estado.naoAlcancado ?? {})) { naoMedidos.push(`${s.superficie} · ${id} · ${L}: NÃO ALCANÇADO — ${r}`); console.log(`  ${id} · ${L}: não alcançado — ${r}`) }
    if (Object.keys(estado.larguras ?? {}).length === 0) continue
    if (!estado.larguras[REFERENCIA]) falha(`${id}: sem a medição de ${REFERENCIA} (a referência do (e))`)
    const c = classificarEstado(estado)
    if (c["411"]) {
      const inalc = c["411"].e
      console.log(`  inalcançáveis em A (411) — ${id}: ${inalc.length} (herança da I1-D11, decisão 619; reprova desde a div. 677)`)
      for (const o of inalc) {
        const n = estado.larguras[REFERENCIA]?.nos.find((x) => x.k === o.k)
        console.log(`    · ${o.tipo}${o.n ? ` (${o.n[0]} → ${o.n[1]} car.)` : ""}: ${nomeDe(n)}`)
      }
    }
    for (const L of Object.keys(c).sort((a, b) => b - a)) {
      const r = c[L]
      const cab = `${id} · ${L}${L === "411" ? " (faixa A)" : ""}`
      console.log(`  ${cab}: (e)=${r.e.length} · (b)=${r.b.length} · (d′)=${r.dl.length} · errata candidata=${r.errata.length} · quebra por dado=${r.quebraPorDado.cascata.length} · sem par folha/app=${r.semPar.folha.length}/${r.semPar.app.length} · saídas: nome-acessível=${r.saidas.nomeAcessivel} rolagem=${r.saidas.rolagem}`)
      // decisão 7: a errata candidata e os nós sem par com a folha, listados (nunca reprovam — decisão do Marcel)
      const cobertura = coberturaDe(id, estado.folha?.secao)
      if (r.reprova) {
        erratas += r.errata.length; semParFolha += r.semPar.folha.length; semParApp += r.semPar.app.length
        quebraDado += r.quebraPorDado.cascata.length
        if (!cobertura) semCobertura += r.errata.length
      }
      const nomeNo = (k) => { const n = estado.larguras[L]?.nos.find((x) => x.k === k); return n ? nomeDe(n) : k }
      for (const o of r.errata) console.log(`    · errata candidata: ${nomeNo(o.k)} Δ[x,y,w,h]=${JSON.stringify(o.delta)} — ${cobertura ? `coberta por ${cobertura}` : "sem cobertura"}`)
      for (const q of r.quebraPorDado.nos) console.log(`    · quebra por dado: ${nomeNo(q.k)} em ${q.linhas} linhas no lugar de 1 (+${q.extra} px) — a cascata abaixo dele sai daqui, à parte`)
      for (const o of r.quebraPorDado.cascata) console.log(`    · quebra por dado (cascata): ${nomeNo(o.k)} Δ[x,y,w,h]=${JSON.stringify(o.delta)}`)
      for (const o of r.semPar.folha) console.log(`    · sem par na folha: ${o.rotulo !== undefined ? JSON.stringify(String(o.rotulo).slice(0, 60)) : o.k}`)
      for (const o of r.semPar.app) console.log(`    · sem par no app: ${nomeNo(o.k)}`)
      const rotulo = (k) => {
        const n = estado.larguras[L]?.nos.find((x) => x.k === k) ?? estado.larguras[REFERENCIA]?.nos.find((x) => x.k === k)
        return n?.rotulo !== undefined ? ` "${n.rotulo.slice(0, 60)}"` : n ? ` <${n.tag} ${n.role}, ${n.n} car.>` : ""
      }
      for (const [tipo, lista, reprova] of [["(e)", r.e, r.reprova], ["(b)", r.b, r.reprovaB]]) {
        lista.slice(0, LIMITE).forEach((o) => {
          const m = `${cab} ${tipo} ${o.tipo}: ${o.k}${rotulo(o.k)}`
          if (reprova) falha(m); else console.log(`    · ${m}`)
        })
        if (lista.length > LIMITE) { if (reprova) { falhas += lista.length - LIMITE; console.log(`  ✗ … e mais ${lista.length - LIMITE} ${tipo} em ${cab}`) } else console.log(`    · … e mais ${lista.length - LIMITE}`) }
      }
    }
  }
}
if (naoMedidos.length || erratas || quebraDado || semParFolha || semParApp) {
  console.log(`\n## contados à parte (não reprovam): errata candidata ${erratas} · quebra por dado ${quebraDado} · sem par folha ${semParFolha} · sem par app ${semParApp} (C e B) · não medidos ${naoMedidos.length}`)
  console.log(`## erratas candidatas sem cobertura (erratasFaixa, div. 681): ${semCobertura}`)
  for (const m of naoMedidos) console.log(`  · ${m}`)
}
console.log(falhas ? `\nG-faixa: REPROVA — ${falhas} ocorrência(s)` : "\nG-faixa: PASSA")
process.exit(falhas ? 1 : 0)
