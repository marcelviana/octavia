// G-tok (I1-PR5; I1-D13, I1-D17) — a identidade do web vem de packages/identidade.
//
// (i) A FOLHA. Roda o `docs/ux/DESIGN-I1/conferencia/conferir.mjs` COMO ESTÁ
//     (pelo `tsx`: desde a I1-PR-4 o `theme.ts` que ele importa reexporta de
//     `@octavia/identidade` e importa `./fontes` sem extensão, que o Node puro
//     não resolve — div. 613) e casa cada achado contra
//     `docs/ux/DESIGN-I1/erratas.json`. Reprova: achado sem errata
//     (descoberto); errata que não casa com nenhum achado (órfã); errata que
//     casa com um número de achados diferente do `n` declarado.
// (ii) OS ARQUIVOS REDESENHADOS. Para cada arquivo de
//     `scripts/gates-web/g-tok-arquivos.txt` (vazio na I1-PR5; cada PR de
//     superfície acrescenta os seus): nenhum literal de COR, de TAMANHO DE
//     FONTE nem de ESPAÇAMENTO numérico fora das custom properties de
//     `app/styles/identidade.css` (usar `var(--…)`), e nenhum LITERAL EM
//     INGLÊS em posição de texto (I1-D17) — o molde do `gate:a20` do nativo
//     (`apps/native/scripts/a20.mjs`), com as posições do JSX do web; e
//     nenhum TOAST (`toast(…)`, `toast.x(…)`, `useToast`; I1-D26, I1-PR6); e,
//     desde a I1-PR6 (decisão 3), nenhum literal de LARGURA/ALTURA, RAIO, BORDA,
//     ENTRELINHA, TRACKING nem VALOR ARBITRÁRIO `[…]` sem `var(`, e nenhum import
//     de `@/components/ui/*`. Classe com NOME de token (tailwind.config.ts) passa.
// O "CSS gerado == fonte" é o `packages/identidade/test/css.test.ts`, que o
// job do G-tok roda à parte (gates-web.yml).
//
// Uso (da raiz):  node scripts/gates-web/g-tok.mjs [--so-folha | --so-arquivos]
// Sai 0 se passa, 1 se reprova, 2 se falta insumo.
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const modo = process.argv[2] ?? ""
const LISTA = process.env.G_TOK_ARQUIVOS ?? "scripts/gates-web/g-tok-arquivos.txt"
const ERRATAS = "docs/ux/DESIGN-I1/erratas.json"
const CONFERIR = "docs/ux/DESIGN-I1/conferencia/conferir.mjs"
const TSX = path.resolve("node_modules/.bin/tsx")
let falhas = 0
const falha = (m) => { console.log(`  ✗ ${m}`); falhas++ }

// ---------------------------------------------------------------- (i) a folha
function folha() {
  console.log("## (i) a folha — conferir.mjs × erratas.json")
  for (const f of [ERRATAS, CONFERIR, TSX]) if (!fs.existsSync(f)) { console.error(`g-tok: insumo ausente: ${f}`); process.exit(2) }
  let saida
  try {
    saida = execFileSync(TSX, [CONFERIR], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
  } catch (e) {
    if (e.status !== 1) { console.error(`g-tok: conferir.mjs saiu ${e.status}\n${e.stderr ?? ""}`); process.exit(2) }
    saida = e.stdout
  }
  const i = saida.indexOf("\n## Achados: ")
  if (i < 0) { console.error("g-tok: saída do conferir.mjs sem '## Achados:'"); process.exit(2) }
  const total = Number(saida.slice(i).match(/## Achados: (\d+)/)[1])
  const achados = saida.slice(i).split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2))
  if (achados.length !== total) { console.error(`g-tok: conferir diz ${total} achados e lista ${achados.length}`); process.exit(2) }

  const { erratas, tipos } = JSON.parse(fs.readFileSync(ERRATAS, "utf8"))
  const cobertos = new Set()
  let orfas = 0
  for (const e of erratas) {
    if (!e.id || !(e.tipo in tipos) || !Array.isArray(e.casa) || e.casa.length === 0) { falha(`${e.id ?? "?"}: entrada malformada (id, tipo ∈ ${Object.keys(tipos)}, casa[])`); continue }
    for (const c of e.casa) {
      const re = new RegExp(c.achado)
      const hits = achados.map((a, k) => (re.test(a) ? k : -1)).filter((k) => k >= 0)
      hits.forEach((k) => cobertos.add(k))
      if (hits.length === 0) orfas++
      if (hits.length === 0) falha(`${e.id} (${e.tipo}): ERRATA ÓRFÃ — /${c.achado}/ não casa com nenhum achado`)
      else if (hits.length !== c.n) falha(`${e.id} (${e.tipo}): casa ${hits.length} achado(s), declarado n=${c.n} — /${c.achado}/`)
      else console.log(`  ✓ ${e.id} (${e.tipo}) cobre ${hits.length}`)
    }
  }
  const descobertos = achados.filter((_, k) => !cobertos.has(k))
  for (const a of descobertos) falha(`ACHADO DESCOBERTO: ${a}`)
  console.log(`  achados do conferir: ${total} · cobertos: ${cobertos.size} · descobertos: ${descobertos.length} · erratas: ${erratas.length} · órfãs: ${orfas}`)
}

// ------------------------------------------------------ (ii) arquivos redesenhados
// Literais de identidade fora das custom properties. `0` não é medida; `var(--…)` é o caminho.
const PALETA = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black"
const TOKEN_LITERAL = [
  { classe: "cor", re: /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g },
  { classe: "cor", re: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(/g },
  { classe: "cor", re: new RegExp(`(?<![\\w-])(?:bg|text|border(?:-[trblxy])?|ring|fill|stroke|from|via|to|outline|decoration|divide|placeholder|shadow|accent|caret)-(?:${PALETA})(?:-\\d{2,3})?(?:\\/\\d+)?(?![\\w-])`, "g") },
  { classe: "tamanho de fonte", re: /font-size\s*:\s*(?!var\()[\d.]+[a-z%]*/g },
  { classe: "tamanho de fonte", re: /fontSize\s*:\s*['"`]?\s*[\d.]+[a-z%]*/g },
  { classe: "tamanho de fonte", re: /(?<![\w-])text-\[\s*[\d.][^\]]*\]/g },
  { classe: "tamanho de fonte", re: /(?<![\w-])text-(?:xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g },
  { classe: "espaçamento", re: /(?<![\w-])(?:padding|margin|gap|row-gap|column-gap|inset)(?:-(?:top|right|bottom|left|inline|block)(?:-start|-end)?)?\s*:\s*(?!var\()[^;"'`}]*?(?<![\w.])(?:[1-9]\d*|0?\.\d+)(?:px|rem|em)\b/g },
  { classe: "espaçamento", re: /(?<![\w-])(?:padding|margin|gap|rowGap|columnGap|inset)(?:Top|Right|Bottom|Left|Inline|Block|X|Y)?\s*:\s*['"`]?\s*(?:[1-9][\d.]*|0?\.\d+)[a-z%]*/g },
  { classe: "espaçamento", re: /(?<![\w-])-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left)-(?:[1-9]\d*(?:\.5)?|0\.5|px|\[\s*(?!var\()[\d.][^\]]*\])/g },
  // I1-PR6 (decisão 3 do aval): largura, altura, raio, borda, entrelinha, tracking e o valor arbitrário.
  // A classe com NOME de token (`w-web-coluna-auth`, `rounded-raio-control`, `border-hairline`,
  // `leading-entrelinha-text`, `tracking-display-wide`) passa; a escala do Tailwind reprova.
  // `0`, `none`, `auto`, `full`, `screen`, `fit`/`min`/`max` e frações (`w-1/2`) não são medida (§2.3 da folha).
  { classe: "tamanho", re: /(?<![\w-])-?(?:w|h|size|min-w|min-h|max-w|max-h)-(?:[1-9]\d*(?:\.5)?|0\.5|px|xs|sm|md|lg|xl|[2-7]xl|prose|screen-(?:sm|md|lg|xl|2xl))(?![\w/.-])/g },
  { classe: "tamanho", re: /(?<![\w-])(?:width|height|minWidth|minHeight|maxWidth|maxHeight|flexBasis)\s*:\s*['"`]?\s*-?(?:[1-9][\d.]*|0?\.\d+)/g },
  { classe: "tamanho", re: /(?<![\w-])(?:width|height|min-width|min-height|max-width|max-height|flex-basis)\s*:\s*(?!var\()[^;"'`}]*?(?<![\w.])(?:[1-9]\d*|0?\.\d+)(?:px|rem|em)\b/g },
  { classe: "raio", re: /(?<![\w-])rounded(?:-(?:[trblse]|tl|tr|bl|br|ss|se|es|ee))?(?:-(?:sm|md|lg|xl|2xl|3xl|full))?(?![\w-])/g },
  { classe: "raio", re: /(?<![\w-])(?:borderRadius\s*:\s*['"`]?\s*(?:[1-9][\d.]*|0?\.\d+)|border-radius\s*:\s*(?!var\()[^;"'`}]*?\d+(?:px|rem|em|%))/g },
  { classe: "borda", re: /(?<![\w-])border(?:-[trblxy])?(?:-(?:2|4|8|px))?(?![\w-])/g },
  { classe: "borda", re: /(?<![\w-])(?:borderWidth\s*:\s*['"`]?\s*[1-9]|border-width\s*:\s*(?!var\()[^;"'`}]*?\d+px)/g },
  { classe: "entrelinha", re: /(?<![\w-])leading-(?:none|tight|snug|normal|relaxed|loose|\d+)(?![\w-])/g },
  { classe: "entrelinha", re: /(?<![\w-])(?:lineHeight\s*:\s*['"`]?\s*[\d.]+|line-height\s*:\s*(?!var\()[\d.]+)/g },
  { classe: "tracking", re: /(?<![\w-])tracking-(?:tighter|tight|normal|wide|wider|widest)(?![\w-])/g },
  { classe: "tracking", re: /(?<![\w-])(?:letterSpacing\s*:\s*['"`]?\s*-?[\d.]+|letter-spacing\s*:\s*(?!var\()-?[\d.]+)/g },
  { classe: "valor arbitrário", re: /(?<![\w-])-?[a-z][\w-]*-\[(?!\s*var\()[^\]]*\d[^\]]*\]/g },
]
// I1-PR6 (decisão 3): os primitivos do shadcn trazem literais para dentro da tela sem aparecer no
// arquivo listado (div. 651) — num arquivo da lista, importar `@/components/ui/…` reprova.
const IMPORT_UI = /\bfrom\s*['"]@\/components\/ui\/[^'"]*['"]|\bimport\s*\(\s*['"]@\/components\/ui\//g
// I1-D17: o irmão do G-tok — o `gate:a20` do nativo, com as posições do JSX do web.
// VOCAB: o do a20 + as palavras da UI de hoje do web (docs/ux/I1-PRECHECK-anexos/frases-web.txt).
// Tiradas de propósito por serem também pt-BR: "menu", "tempo", "for", "status", "total".
const VOCAB = ["loading", "error", "retry", "search", "no results", "cancel", "save", "delete", "back", "next", "done",
  "close", "settings", "download", "failed", "submit", "continue", "confirm", "yes", "try again", "sign in",
  "log in", "log out", "sign out", "play", "pause", "home", "empty", "not found", "unknown", "refresh", "send", "edit",
  "add", "remove", "open", "page", "of", "song", "songs", "theme", "light", "zoom in", "zoom out", "previous",
  // web
  "sign up", "password", "forgot", "upload", "library", "dashboard", "profile", "welcome", "create", "new", "name",
  "artist", "content", "file", "files", "please", "your", "the", "and", "with", "view", "share", "account",
  "email address", "something went wrong", "unexpected", "required", "invalid", "success", "successfully", "saved",
  "deleted", "created", "updated", "drag", "drop", "browse", "select", "choose", "import", "title", "description",
  "notes", "privacy", "policy", "terms", "get started", "learn more", "back to", "go to", "are you sure", "untitled",
  "favorite", "favorites", "recent", "all", "filter", "sort", "lyrics", "chords", "sheet", "verify", "resend", "check"]
// As isenções do a20 (anglicismos do produto, lista fechada).
const ANGLICISMOS_DO_PRODUTO = ["setlist", "setlists", "auto-scroll", "zoom", "email", "tab", "offline", "pdf", "online"]
// Decisão 622 [Marcel, 2026-09-27]: SÓ em posição de texto, como o `gate:a20` — texto JSX (e o
// literal `{'…'}` que é texto JSX), `placeholder`, `aria-label`, `title`, `alt`. Identificador,
// nome de variável e chave de objeto não são texto (CN de falso positivo em docs/ux/I1-PR5-anexos/cn/).
const POSICOES = [
  { nome: "texto JSX", re: />([^<>{}]*[A-Za-z][^<>{}]*)</g },
  { nome: "literal JSX {'…'}", re: /\{\s*(?:"([^"]*)"|'([^']*)'|`([^`$]*)`)\s*\}/g },
  { nome: "atributo", re: /\b(?:aria-label|placeholder|title|alt)\s*=\s*(?:"([^"]*)"|\{\s*'([^']*)'\s*\}|\{\s*"([^"]*)"\s*\}|\{\s*`([^`$]*)`\s*\})/g },
]
// I1-D26 (div. 634) [I1-PR6]: nenhum toast entra — a falha é a `LinhaDeAviso` da folha. Num arquivo
// da lista, a CHAMADA (`toast(…)`, `toast.error(…)`, …) ou o hook (`useToast`) reprova.
const TOAST = /\btoast\s*(?:\.\s*\w+\s*)?\(|\buseToast\b/g
const semComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
  .replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length))
const linha = (src, i) => src.slice(0, i).split("\n").length
const vocabOrdenado = [...VOCAB].sort((a, b) => b.length - a.length)

function arquivos() {
  console.log(`## (ii) arquivos redesenhados — ${LISTA}`)
  if (!fs.existsSync(LISTA)) { console.error(`g-tok: lista ausente: ${LISTA}`); process.exit(2) }
  const lista = fs.readFileSync(LISTA, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
  if (lista.length === 0) { console.log("  (lista vazia — nenhum arquivo redesenhado ainda)"); return }
  let literais = 0, textos = 0, toasts = 0, importsUi = 0
  for (const f of lista) {
    if (!fs.existsSync(f)) { falha(`${f}: está na lista e não existe`); continue }
    const src = semComentarios(fs.readFileSync(f, "utf8"))
    const vistos = new Set() // o mesmo trecho casado por duas regras da mesma classe conta uma vez
    const inicios = new Set() // e o valor arbitrário já acusado por outra classe (`text-[14px]`, `p-[3px]`) não conta de novo
    for (const { classe, re } of TOKEN_LITERAL) for (const m of src.matchAll(re)) {
      if (vistos.has(`${classe}@${m.index}`)) continue
      if (classe === "valor arbitrário" && inicios.has(m.index + (m[0].startsWith("-") ? 1 : 0))) continue
      vistos.add(`${classe}@${m.index}`)
      inicios.add(m.index + (m[0].startsWith("-") ? 1 : 0))
      literais++; falha(`${f}:${linha(src, m.index)} [${classe}] ${JSON.stringify(m[0])} — use a custom property de app/styles/identidade.css`)
    }
    for (const m of src.matchAll(IMPORT_UI)) {
      importsUi++; falha(`${f}:${linha(src, m.index)} [import de ui] ${JSON.stringify(m[0])} — arquivo redesenhado não importa @/components/ui/* (decisão 3)`)
    }
    for (const m of src.matchAll(TOAST)) {
      toasts++; falha(`${f}:${linha(src, m.index)} [toast] ${JSON.stringify(m[0])} — nenhum toast entra (I1-D26): a falha é a LinhaDeAviso`)
    }
    for (const { nome, re } of POSICOES) for (const m of src.matchAll(re)) {
      const s = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? "").trim()
      if (!s || !/[A-Za-z]/.test(s)) continue
      // entre `>` e `<` pode haver CÓDIGO (fim de um elemento, instruções, começo do próximo): texto de UI não tem `=` nem `;`
      if (nome === "texto JSX" && /[=;]/.test(s)) continue
      textos++
      const baixo = s.toLowerCase()
      const hit = vocabOrdenado.find((v) => new RegExp(`(^|[^a-zà-ÿ])${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-zà-ÿ]|$)`, "i").test(baixo))
      if (hit && !ANGLICISMOS_DO_PRODUTO.includes(hit)) falha(`${f}:${linha(src, m.index)} [inglês, ${nome}] ${JSON.stringify(s)} ← termo "${hit}"`)
    }
  }
  console.log(`  arquivos: ${lista.length} · literais de identidade acusados: ${literais} · toasts: ${toasts} · imports de ui: ${importsUi} · textos examinados: ${textos} · vocabulário: ${VOCAB.length} · isenções: ${ANGLICISMOS_DO_PRODUTO.length}`)
}

if (modo !== "--so-arquivos") folha()
if (modo !== "--so-folha") arquivos()
console.log(falhas ? `\nG-tok: REPROVA — ${falhas} ocorrência(s)` : "\nG-tok: PASSA")
process.exit(falhas ? 1 : 0)
