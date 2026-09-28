// Conferência da folha congelada do web (I1, DESIGN-I1) contra as regras — §2 (a)–(f) do
// prompt do congelamento. É o mesmo instrumento que a PR-5 reusa como G-tok: (a) e (b) são o
// núcleo (cor ∈ theme.ts; px declarado e resolvido contra os tokens).
//
// Uso (da raiz do repositório; Node ≥ 22.18, que lê .ts por type stripping):
//   node docs/ux/DESIGN-I1/conferencia/conferir.mjs [pasta-da-folha]
// Sai 0 se nada fora do esperado; 1 se há achado (listado); 2 se falta insumo.
// Só lê: não escreve arquivo nenhum.
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const RAIZ = path.resolve(process.argv[2] ?? "docs/ux/DESIGN-I1")
const THEME = path.resolve("apps/native/src/theme.ts")
const ICONES = path.resolve("apps/native/src/icones/dados.ts")
const MATRIZ = path.resolve("docs/ux/I1-PRECHECK-anexos/matriz-estados.txt")
const CRUZA = path.join(RAIZ, "conferencia/matriz-x-estados.tsv")
const README = path.join(RAIZ, "README-design.md")
for (const f of [THEME, ICONES, MATRIZ, CRUZA, README])
  if (!fs.existsSync(f)) { console.error(`conferir: insumo ausente: ${f}`); process.exit(2) }

const theme = await import(pathToFileURL(THEME).href)
const { desenhos } = await import(pathToFileURL(ICONES).href)
const readme = fs.readFileSync(README, "utf8")
const achados = []
const achado = (item, msg) => achados.push(`(${item}) ${msg}`)
const semB64 = (s) => s.replace(/base64,[A-Za-z0-9+/=]+/g, "base64,…")
const desmarca = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim()

// ---------- as nove folhas, pelo README-design §2.4 ----------
const FOLHAS = [...readme.matchAll(/^### (.+?) — `(\d-[a-z-]+)\/telas\.html` · (\d+) estado\(s\)$/gm)]
  .map((m) => ({ nome: m[1], pasta: m[2], declarados: Number(m[3]) }))
if (FOLHAS.length !== 9) { console.error(`conferir: §2.4 lista ${FOLHAS.length} folhas, não 9`); process.exit(2) }
const blocoDaFolha = (pasta) => {
  const i = readme.search(new RegExp(`^### .+ — \`${pasta}/telas\\.html\``, "m"))
  const fim = readme.slice(i + 1).search(/\n### |\n## /)
  return readme.slice(i, fim < 0 ? undefined : i + 1 + fim)
}
for (const f of FOLHAS) {
  f.html = semB64(fs.readFileSync(path.join(RAIZ, f.pasta, "telas.html"), "utf8"))
  const iv = f.html.indexOf('id="inventario"')
  f.corpo = iv < 0 ? f.html : f.html.slice(0, iv)
  f.inventario = iv < 0 ? "" : f.html.slice(iv)
  f.secoes = [...f.html.matchAll(/<section\b[^>]*\bdata-estado="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g)]
    .map((m) => ({ id: m[1], html: m[2] }))
  const bl = blocoDaFolha(f.pasta)
  f.estadosReadme = (bl.match(/^Estados: (.+)$/m)?.[1] ?? "").match(/`([^`]+)`/g)?.map((s) => s.slice(1, -1)) ?? []
  f.pxReadme = (bl.match(/^Medidas em px presentes no arquivo: (.+?) — /m)?.[1] ?? "").split(" · ").map(Number)
}

// ---------- (a) cores ----------
const hexTema = new Set()
for (const pal of Object.values(theme.colors)) for (const v of Object.values(pal)) hexTema.add(String(v).toUpperCase())
const rgbDe = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",")
const rgbTema = new Map([...hexTema].map((h) => [rgbDe(h), h]))
const ALFAS = new Map([["#777CE8", ".12"], ["#100F16", ".82"]]) // README-design: accent a 12 %, bg a 82 %
const tabA = []
for (const f of FOLHAS) {
  const hex = f.html.match(/#[0-9A-Fa-f]{6}\b/g) ?? []
  const fora = [...new Set(hex.map((h) => h.toUpperCase()).filter((h) => !hexTema.has(h)))]
  const outras = [...new Set(f.html.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? [])].filter((h) => h.length !== 7)
  const rgba = [...new Set(f.html.match(/rgba?\([^)]*\)/g) ?? [])]
  const rgbaFora = rgba.filter((r) => {
    const p = r.replace(/rgba?\(|\)/g, "").split(",").map((s) => s.trim())
    const base = rgbTema.get(p.slice(0, 3).join(","))
    return !base || ALFAS.get(base) !== p[3]
  })
  const funcs = [...new Set(f.html.match(/\b(?:hsla?|color-mix|oklch|lab)\(/g) ?? [])]
  tabA.push([f.pasta, hex.length, new Set(hex.map((h) => h.toUpperCase())).size, fora.length, rgba.join(" "), rgbaFora.length])
  for (const h of fora) achado("a", `${f.pasta}: ${h} fora dos ${hexTema.size} do theme.ts`)
  for (const h of outras) achado("a", `${f.pasta}: cor em forma não #rrggbb: ${h}`)
  for (const r of rgbaFora) achado("a", `${f.pasta}: ${r} não é token com alfa declarado`)
  for (const x of funcs) achado("a", `${f.pasta}: função de cor ${x}`)
}

// ---------- (b) px ----------
const web = {}
for (const m of readme.matchAll(/^\| `(web\.[a-zA-Z]+)` \| ([^|]+) \| ([^|]+) \|/gm)) web[m[1]] = { C: m[2].trim(), B: m[3].trim() }
const tok = (nome, faixa) => {
  const [a, b] = nome.split(".")
  if (a === "zoomDefault") return theme.zoomDefault
  if (a === "folha") return theme.faixas[faixa ?? "C"].folha[b]
  if (a.startsWith("web")) {
    const v = web[nome]?.[faixa ?? "C"]
    return /^\d+$/.test(v ?? "") ? Number(v) : v?.startsWith("`") ? tok(v.slice(1, -1)) : undefined
  }
  const grupo = theme[a]
  return grupo && typeof grupo === "object" ? grupo[b] : undefined
}
const avalia = (expr) => {
  const js = expr.replace(/[a-z]+\.[a-zA-Z]+|zoomDefault/g, (n) => { const v = tok(n); return v === undefined ? "NaN" : String(v) })
    .replace(/−/g, "-").replace(/×/g, "*")
  return /^[\d\s+\-*/().]+$/.test(js) ? Function(`return (${js})`)() : NaN
}
// Uma declaração = fragmentos separados por " · ". Cada fragmento: token (theme.ts ou web.*),
// derivado (conta de tokens), ícone do catálogo, largura de faixa (theme.ts E1), ou literal com origem.
const classifica = (px, frag) => {
  const fr = frag.trim()
  let m
  if ((m = fr.match(/^(folha\.[a-z]+) \((B|C)\)$/))) return tok(m[1], m[2]) === px ? "token" : null
  if ((m = fr.match(/^([a-z]+\.[a-zA-Z]+|zoomDefault)$/))) return tok(m[1]) === px ? (m[1].startsWith("web.") ? "web" : "token") : null
  if ((m = fr.match(/^(.*?) \(([^)]*)\)$/)) && /[+×\/−]/.test(m[1])) return avalia(m[1]) === px ? "derivado" : null
  if (/[+×\/−]/.test(fr)) return avalia(fr) === px ? "derivado" : null
  if ((m = fr.match(/^ícone (\d+) \(catálogo V1, anexo D\)$/))) return Number(m[1]) === px ? "ícone" : null
  if (/^largura da faixa [BC] \(theme\.ts, E1\)$/.test(fr)) return "faixa (E1)"
  if (/^literal .+/.test(fr)) return "literal"
  if (/^0 \(sem medida\)$/.test(fr) && px === 0) return "zero"
  return null
}
const tab23 = new Map()
const i23 = readme.indexOf("### §2.3")
for (const m of readme.slice(i23, readme.indexOf("### §2.4")).matchAll(/^\| (\d+) \| (.+) \|$/gm)) tab23.set(Number(m[1]), m[2].trim())
const tabB = []
for (const f of FOLHAS) {
  const noArquivo = [...new Set((f.html.match(/(?<![\w.#-])-?\d+(?:\.\d+)?px/g) ?? []).map((s) => Number(s.slice(0, -2))))].sort((a, b) => a - b)
  const cel = [...f.inventario.matchAll(/<div style="padding:8px 12px[^"]*">([\s\S]*?)<\/div>/g)].map((m) => desmarca(m[1]))
  const inv = new Map()
  for (let k = 0; k + 1 < cel.length && /^\d+$/.test(cel[k]); k += 2) inv.set(Number(cel[k]), cel[k + 1])
  const n0 = achados.length
  const semDecl = noArquivo.filter((p) => p !== 0 && !inv.has(p))
  const sobra = [...inv.keys()].filter((p) => !noArquivo.includes(p))
  for (const p of semDecl) achado("b", `${f.pasta}: ${p}px no arquivo sem entrada no inventário da folha`)
  for (const p of sobra) achado("b", `${f.pasta}: inventário da folha declara ${p} ("${inv.get(p)}"), que não aparece como px no arquivo`)
  for (const [p, d] of inv) {
    if (p === 0) continue
    if (tab23.has(p) && tab23.get(p) !== d) achado("b", `${f.pasta}: ${p} = "${d}" na folha × "${tab23.get(p)}" no README §2.3`)
    if (!tab23.has(p)) achado("b", `${f.pasta}: ${p} não está no README §2.3`)
    for (const fr of d.split(" · ")) if (!classifica(p, fr)) achado("b", `${f.pasta}: ${p} → "${fr}" não resolve em token, derivado ou literal com origem`)
  }
  const pr = f.pxReadme.filter((p) => !Number.isNaN(p))
  const a1 = noArquivo.filter((p) => !pr.includes(p)), a2 = pr.filter((p) => !noArquivo.includes(p))
  if (a1.length || a2.length) achado("b", `${f.pasta}: linha "Medidas em px" do §2.4 × arquivo — só no arquivo: [${a1}] · só no README: [${a2}]`)
  tabB.push([f.pasta, noArquivo.length, inv.size, semDecl.length, sobra.length, achados.length - n0])
}
// §2.3 contra si mesmo: toda entrada resolve.
for (const [p, d] of tab23) for (const fr of d.split(" · ")) if (!classifica(p, fr)) achado("b", `README §2.3: ${p} → "${fr}" não resolve em token, derivado ou literal com origem`)

// ---------- (c) ícones ----------
const NOME = { "letra": "letra", "cifra": "cifra", "tab": "tab", "partitura": "partitura", "busca": "busca", "voltar": "voltar",
  "fechar": "fechar", "falha": "falha", "tentar novamente": "tentar-novamente", "sem conexão": "sem-conexao",
  "última sincronização": "ultima-sincronizacao", "garantida": "garantida", "n.º de músicas": "n-de-musicas",
  "data": "data", "local": "local", "sem conteúdo": "sem-conteudo", "zoom −": "zoom-menos", "zoom +": "zoom-mais",
  "sair": "sair", "nova setlist": "nova-setlist", "renomear": "renomear", "apagar setlist": "apagar-setlist",
  "adicionar": "adicionar", "remover": "remover", "log-in": "log-in", "email": "email", "senha": "senha", "visto": "visto" }
const s6 = readme.slice(readme.indexOf("## §6"), readme.indexOf("## §7"))
const doCatalogo = s6.match(/Do catálogo \(anexo D\): (.+)\.$/m)[1].split(" · ")
const deFora = ["log-in", "email", "senha", "visto"] // "log-in, email e senha (E14.a), e o visto do Salvar (N2, R2·2)"
const tabC = []
for (const cru of [...doCatalogo, ...deFora]) {
  const limpo = cru.replace(/\*\*/g, "").replace(/ \(.*?\)/g, "").replace(/ — .*/, "").trim()
  if (/variante espelhada/.test(cru)) { tabC.push([cru, "variante de voltar", "declarado"]); continue }
  const chave = NOME[limpo]
  const ok = chave && chave in desenhos
  tabC.push([limpo, chave ?? "?", ok ? "∈ dados.ts" : "FORA"])
  if (!ok) achado("c", `§6 nomeia "${limpo}", que não está em apps/native/src/icones/dados.ts`)
}
tabC.push(["marca do Google", "—", "asset de terceiro (declarado)"])
// Por forma: todo <svg> das folhas contra os desenhos do mapa (normal · inerte · em20).
const assinatura = (inner) => inner.replace(/\s+(?:stroke|fill|stroke-width|stroke-linecap|stroke-linejoin|style|opacity|fill-opacity|stroke-dasharray)="[^"]*"/g, "")
  .replace(/\s+/g, " ").trim()
const prim = (p) => p.d !== undefined ? `<path d="${p.d}"></path>`
  : p.cx !== undefined ? `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"></circle>`
  : `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx}"></rect>`
const formas = new Map()
for (const [nome, d] of Object.entries(desenhos)) for (const v of ["normal", "inerte", "em20", "ativo"])
  if (d[v] && !formas.has(d[v].map(prim).join(""))) formas.set(d[v].map(prim).join(""), `${nome}${v === "normal" ? "" : `:${v}`}`)
const porForma = new Map()
for (const f of FOLHAS) for (const m of f.html.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)) {
  const espelho = /scale\(-1|scaleX\(-1/.test(m[1])
  const a = assinatura(m[2]).replace(/> </g, "><")
  const nome = formas.get(a)
  const k = `${nome ?? "?"}${espelho ? " (espelhado)" : ""}|${a}`
  const e = porForma.get(k) ?? { n: 0, folhas: new Set() }
  e.n++; e.folhas.add(f.pasta[0]); porForma.set(k, e)
}
const FORMA_DECLARADA = { // README-design §6 e §8
  "M3 6h18M3 10h18M3 14h18M3 18h18": "tab de 20 das folhas — resposta 29: a implementação usa o `d` do catálogo",
}
const tabCforma = []
for (const [k, e] of porForma) {
  const [nome, a] = k.split("|")
  let st = nome.startsWith("?") ? "FORA" : "∈ dados.ts"
  if (nome === "voltar (espelhado)") st = "variante declarada"
  const decl = Object.entries(FORMA_DECLARADA).find(([d]) => a.includes(d))
  if (st === "FORA" && decl) st = `declarado: ${decl[1]}`
  tabCforma.push([nome, e.n, [...e.folhas].join(","), st, a.slice(0, 90)])
  if (st === "FORA") achado("c", `forma sem desenho no dados.ts (${e.n}× nas folhas ${[...e.folhas]}): ${a.slice(0, 120)}`)
}
for (const f of FOLHAS) if (/<svg\b[^>]*>[\s\S]*?cx="9" cy="6\.5" r="1\.5"/.test(f.html)) achado("f", `${f.pasta}: tem a alça`)

// ---------- (d) faixas e estados ----------
const tabD = []
for (const f of FOLHAS) {
  const ids = f.secoes.map((s) => s.id)
  const extra = ids.filter((id) => !f.estadosReadme.includes(id))
  const falta = f.estadosReadme.filter((id) => !ids.includes(id))
  const semFaixa = f.secoes.filter((s) => f.estadosReadme.includes(s.id))
    .filter((s) => !/faixa C · 1138/.test(s.html) || !/faixa B · 711/.test(s.html) || !/width:1138px/.test(s.html) || !/width:711px/.test(s.html)).map((s) => s.id)
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  tabD.push([f.pasta, ids.length, f.declarados, f.estadosReadme.length, extra.join(",") || "—", falta.length, semFaixa.length])
  for (const id of extra) if (id !== "Tokens") achado("d", `${f.pasta}: seção data-estado="${id}" fora da lista do §2.4`)
  for (const id of falta) achado("d", `${f.pasta}: estado ${id} do §2.4 sem seção`)
  for (const id of semFaixa) achado("d", `${f.pasta}: ${id} sem as duas molduras (C 1138 e B 711)`)
  for (const id of dup) achado("d", `${f.pasta}: data-estado duplicado ${id}`)
  if (f.estadosReadme.length !== f.declarados) achado("d", `${f.pasta}: §2.4 diz ${f.declarados} estado(s) e lista ${f.estadosReadme.length}`)
}
// cruzamento com a matriz
const linhasMatriz = []
{
  let tela = null, tabela = null
  for (const l of fs.readFileSync(MATRIZ, "utf8").split("\n")) {
    let m
    if ((m = l.match(/^### (.+)$/))) { tela = m[1].trim(); continue }
    if ((m = l.match(/^\*\*([^*]{1,40})\*\*/))) { tela = m[1].trim(); continue }
    if (/^\| (estado|arquivo|superfície) \|/.test(l)) { tabela = l.split("|")[1].trim(); continue }
    if (!l.startsWith("| ") || l.startsWith("|---")) continue
    const c = l.slice(1, -1).split(" | ").map((s) => s.trim())
    if (tabela === "estado") linhasMatriz.push({ tela, estado: c[0], alc: c[c.length - 1] })
    if (tabela === "superfície") linhasMatriz.push({ tela, estado: c[0].replace(/ \(.*$/, ""), alc: c[1] })
  }
}
const cruza = fs.readFileSync(CRUZA, "utf8").split("\n").filter((l) => l && !l.startsWith("#")).slice(1)
  .map((l) => { const [tela, estado, classe, secoes, razao] = l.split("\t"); return { tela, estado, classe, secoes: secoes ? secoes.split(",") : [], razao } })
const todasSecoes = new Map(FOLHAS.flatMap((f) => f.secoes.filter((s) => s.id !== "Tokens").map((s) => [s.id, f.pasta])))
for (const lm of linhasMatriz) {
  const tela = lm.tela.startsWith("Todos os `toast`") ? "setlists-lista" : lm.tela
  if (!cruza.some((c) => c.tela === tela && c.estado === lm.estado)) achado("d", `linha da matriz sem cruzamento: ${tela} · ${lm.estado}`)
}
for (const c of cruza) for (const s of c.secoes) if (!todasSecoes.has(s)) achado("d", `cruzamento cita seção inexistente: ${s}`)
const citadas = new Set(cruza.flatMap((c) => c.secoes))
for (const [s, p] of todasSecoes) if (!citadas.has(s)) achado("d", `${p}: seção ${s} sem linha da matriz nem classe no cruzamento`)
for (const c of cruza.filter((c) => c.classe === "DIV")) achado("d", `estado alcançável sem seção: ${c.tela} · ${c.estado} — ${c.razao}`)
const porClasse = {}
for (const c of cruza) porClasse[c.classe] = (porClasse[c.classe] ?? 0) + 1
const porFolhaClasse = {}
for (const c of cruza) for (const s of c.secoes) {
  const p = todasSecoes.get(s); if (!p) continue
  porFolhaClasse[p] ??= {}; porFolhaClasse[p][c.classe] ??= new Set(); porFolhaClasse[p][c.classe].add(s)
}

// requisitos do README.md: um T-I1-R por estado × faixa, numeração contínua
let nReq = null
const README_BLOCO = path.join(RAIZ, "README.md")
if (fs.existsSync(README_BLOCO)) {
  const req = [...fs.readFileSync(README_BLOCO, "utf8").matchAll(/^\*\*T-I1-R(\d+) — .+? · ([BC]) · `([^`]+)`\*\*/gm)]
  nReq = req.length
  req.forEach((m, i) => { if (Number(m[1]) !== i + 1) achado("d", `README.md: T-I1-R${m[1]} fora da sequência (esperado ${i + 1})`) })
  const tem = new Set(req.map((m) => `${m[3]}|${m[2]}`))
  for (const [s] of todasSecoes) for (const fx of ["C", "B"]) if (!tem.has(`${s}|${fx}`)) achado("d", `README.md: sem T-I1-R para ${s} em ${fx}`)
  // I1-PR10 (div. 760): a regra simétrica — requisito de estado que a folha não tem seção (o que uma errata de estado
  // acrescenta: I1-E1, I1-E2). Antes só a CONTAGEM o mostrava, e a I1-E15 (que tira dois estados) a fecharia por acaso.
  for (const m of req) if (!todasSecoes.has(m[3])) achado("d", `README.md: T-I1-R para ${m[3]} em ${m[2]}, estado sem seção na folha`)
  if (nReq !== 2 * todasSecoes.size) achado("d", `README.md: ${nReq} T-I1-R × ${2 * todasSecoes.size} esperados`)
}

// ---------- (e) frases ----------
const s5 = readme.slice(readme.indexOf("## §5"), readme.indexOf("## §6"))
const s54 = s5.indexOf("### §5.4"), s55 = s5.indexOf("### §5.5")
const frasesPt = (s5.slice(0, s54) + s5.slice(s55)).split("\n").filter((l) => /^\s*- /.test(l) || /^\| N\d/.test(l))
  .map((l) => l.replace(/"[^"]*"/g, "").replace(/“[^”]*”/g, "").replace(/`[^`]*`/g, "").replace(/\S*[-\/]\S*[a-z]\S*/g, ""))
// marcas de inglês; "no" fica de fora (é pt-BR: "falha no servidor"). Rotas e chaves (com - ou /) saem antes.
const INGLES = /\b(the|and|you|your|please|error|failed|loading|sign|save|delete|cancel|try|found|click|password|upload|file|songs?|content|with|of|to|is|are|this|here|not)\b/i
const comIngles = frasesPt.filter((l) => INGLES.test(l))
for (const l of comIngles) achado("e", `§5, marca de inglês fora das aspas: ${l.trim().slice(0, 120)}`)
const n510 = [...s5.slice(s5.indexOf("### §5.10")).matchAll(/^\| (N\d+) \|/gm)].map((m) => m[1])
const ESPERADO = ["N1", "N2", "N4", "N5", "N6", "N7", "N8", "N10", "N12"]
if (n510.join() !== ESPERADO.join()) achado("e", `§5.10 = [${n510}] × esperado [${ESPERADO}]`)
const s8 = readme.slice(readme.indexOf("### Frases novas"))
const entram = [...s8.matchAll(/^- (N\d+) · entra ·/gm)].map((m) => m[1])
if (entram.join() !== ESPERADO.join()) achado("e", `§8 "entra" = [${entram}] × §5.10`)
const citadasN = new Set()
for (const f of FOLHAS) for (const m of f.html.matchAll(/[Ff]rase nova (N\d+)/g)) citadasN.add(m[1])
for (const m of s5.matchAll(/frase nova, (N\d+)/g)) citadasN.add(m[1])
for (const n of citadasN) if (!ESPERADO.includes(n)) achado("e", `frase nova ${n} citada fora da §5.10`)
const semNumero = s5.split("\n").filter((l) => /frase nova/i.test(l) && !/N\d+/.test(l) && !/### §5\.10/.test(l))
for (const l of semNumero) achado("e", `§5 fala em frase nova sem número: ${l.trim().slice(0, 100)}`)

// ---------- (f) ausências e presenças ----------
const semNotas = (h) => h.replace(/<div[^>]*>notas<\/div>\s*<div[^>]*>[\s\S]*?<\/div>/g, "")
const visivel = (h) => { const s = semNotas(h); return desmarca(s.replace(/aria-label="([^"]*)"/g, "> $1 <")).replace(/\s+/g, " ") }
const F = Object.fromEntries(FOLHAS.map((f) => [f.pasta[0], f]))
const secao = (f, id) => f.secoes.find((s) => s.id === id)
const tabF = []
const conta = (rotulo, f, re, filtro = () => true) => {
  const hits = f.secoes.filter((s) => s.id !== "Tokens" && filtro(s)).filter((s) => re.test(visivel(s.html))).map((s) => s.id)
  tabF.push([rotulo, hits.length, hits.join(", ")]); return hits
}
if (conta("5: Favoritar/Favorita fora das notas", F[5], /\bFavorit(ar|a)\b/).length) achado("f", "folha 5 tem Favoritar")
if (conta("5: Apagar fora das notas", F[5], /\bApagar\b/).length) achado("f", "folha 5 tem Apagar")
if (conta("5: Download/Refresh (toda a folha)", F[5], /Download|Refresh|Baixar|Recarregar a página/i).length) achado("f", "folha 5 tem Download/Refresh")
{
  const pdf = secao(F[5], "VIEW-erro-pdf")
  const botoes = [...semNotas(pdf.html).matchAll(/role="button"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g)].map((m) => desmarca(m[1]))
  const rot = [...new Set([...semNotas(pdf.html).matchAll(/role="button"([^>]*)>([\s\S]{0,600}?)<\/div>/g)]
    .map((m) => m[1].match(/aria-label="([^"]*)"/)?.[1] ?? desmarca(m[2]).replace(/\s+/g, " ")))]
  tabF.push(["5: controles em VIEW-erro-pdf", rot.length, rot.join(", ")])
  if (rot.some((r) => /Download|Refresh/i.test(r))) achado("f", "VIEW-erro-pdf tem Download/Refresh")
}
if (conta("8: alça/reordenar fora das notas", F[8], /\balça\b|[Rr]eordenar/).length) achado("f", "folha 8 tem alça/reordenar")
if (conta("4: lib.apagado/favoritado/desfavoritado", F[4], /\bapagad[oa]\b|\bfavoritad[oa]\b|desfavoritad|lib\.(apagado|favoritado|desfavoritado)/i).length) achado("f", "folha 4 tem frase removida pela resposta 7")
const carga = FOLHAS.flatMap((f) => f.secoes.filter((s) => /carregando/.test(s.id) || s.id === "AUTH-login-google").map((s) => [f, s]))
const semCarregando = carga.filter(([, s]) => !/[Cc]arregando[^.…<]{0,40}…/.test(visivel(s.html))).map(([, s]) => s.id)
tabF.push(["seções de carga", carga.length, ""])
tabF.push(["… sem \"carregando…\"", semCarregando.length, semCarregando.join(", ")])
const SEM_TEXTO_DECIDIDO = ["SET-carregando-dados"] // nota da seção: "três blocos sem texto, como hoje"
for (const id of semCarregando) if (!SEM_TEXTO_DECIDIDO.includes(id)) achado("f", `${id}: seção de carga sem "carregando…"`)
for (const [p, id] of [[6, "EDIT-salvando"], [7, "UP-salvando"]]) {
  const ok = /Salvando…/.test(visivel(secao(F[p], id)?.html ?? ""))
  tabF.push([`${p}: "Salvando…" em ${id}`, ok ? 1 : 0, ""])
  if (!ok) achado("f", `${id} sem "Salvando…"`)
}

// ---------- relatório ----------
const tabela = (cab, linhas) => [`| ${cab.join(" | ")} |`, `|${cab.map(() => "---").join("|")}|`, ...linhas.map((l) => `| ${l.join(" | ")} |`)].join("\n")
console.log(`# Conferência DESIGN-I1 — ${path.relative(process.cwd(), RAIZ)}\n`)
console.log(`## (a) cores — ${hexTema.size} valores no theme.ts (dark ∪ light)\n`)
console.log(tabela(["folha", "#rrggbb (ocorrências)", "distintos", "fora do theme.ts", "rgba()", "rgba fora"], tabA))
console.log(`\n## (b) px\n`)
console.log(tabela(["folha", "px distintos no arquivo", "entradas no inventário", "px sem entrada", "entrada sem px", "achados (b)"], tabB))
console.log(`\n## (c) ícones — por nome (§6)\n`)
console.log(tabela(["nome no §6", "chave", "situação"], tabC))
console.log(`\n## (c) ícones — por forma (todo <svg> das folhas)\n`)
console.log(tabela(["desenho", "ocorrências", "folhas", "situação", "forma (início)"], tabCforma.sort((a, b) => b[1] - a[1])))
console.log(`\n## (d) faixas e estados\n`)
console.log(tabela(["folha", "<section data-estado>", "§2.4 (título)", "§2.4 (lista)", "a mais", "§2.4 sem seção", "sem C+B"], tabD))
console.log(`\nMatriz: ${linhasMatriz.length} linhas de estado; cruzamento: ${cruza.length} linhas; por classe: ${Object.entries(porClasse).map(([k, v]) => `${k} ${v}`).join(" · ")}\n`)
console.log(tabela(["folha", "seções por classe"], FOLHAS.map((f) => [f.pasta, Object.entries(porFolhaClasse[f.pasta] ?? {}).map(([k, v]) => `${k} ${v.size}`).join(" · ")])))
if (nReq !== null) console.log(`\nRequisitos no README.md: ${nReq} T-I1-R para ${todasSecoes.size} estados × 2 faixas`)
console.log(`\n## (e) frases\n`)
console.log(`linhas de frase lidas no §5 (sem §5.4): ${frasesPt.length} · com marca de inglês fora das aspas: ${comIngles.length}`)
console.log(`§5.10: ${n510.join(" ")} · §8 "entra": ${entram.join(" ")} · "frase nova N…" citadas nas folhas e no §5: ${[...citadasN].sort().join(" ")}`)
console.log(`\n## (f) ausências e presenças (texto visível e aria-label, fora das notas)\n`)
console.log(tabela(["verificação", "n", "seções"], tabF))
console.log(`\n## Achados: ${achados.length}\n`)
for (const a of achados) console.log(`- ${a}`)
process.exit(achados.length ? 1 : 0)
