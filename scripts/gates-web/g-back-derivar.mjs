// G-back, a derivação do núcleo (I1-PR5; I1-D13, I1-D21; I1-PRECHECK §9).
//
// O núcleo do backend do web é DERIVADO do grafo, não escrito à mão:
//   (a) o alcance, no grafo de importação do dependency-cruiser (o mesmo da A2
//       do pre-check e do corte da PR-3: `.dependency-cruiser.cjs`, aliases `@/`
//       pelo tsconfig, `import()` dinâmico incluído), a partir de TODA
//       `app/api/**/route.ts` e do `middleware.ts` — com os arquivos que as
//       páginas também alcançam (os "compartilhados", I1-D21);
//   (b) `git ls-files supabase`;
//   (c) o lado servidor das páginas: `lib/require-page-user.ts` e
//       `lib/content-service-server.ts` — os DOIS arquivos, sem o alcance deles:
//       o `content-service-server.ts` importa `lib/setlist-service.ts` e
//       `lib/content-service.ts`, que são cliente e a I1-D21 deixa fora (o que
//       eles alcançam no servidor já está em (a)) — div. 612;
//   (d) `next.config.mjs`.
// Teste não entra (o alcance não atravessa `*.test.*`, `tests/`, `__tests__/`).
// O cliente (`lib/setlist-service.ts`, `lib/content-service.ts`) fica fora por
// construção: nenhuma raiz o alcança.
//
// Uso (da raiz do repositório):
//   node scripts/gates-web/g-back-derivar.mjs [árvore]        → a lista, uma por linha
//   node scripts/gates-web/g-back-derivar.mjs [árvore] --por-que → com a raiz de cada uma
// `árvore` (padrão `.`) é onde o grafo é tirado — o g-back.sh passa também uma
// árvore da BASE. O `depcruise` é o desta árvore de trabalho; a outra não
// precisa de node_modules (só arquivo local entra no núcleo).
// O congelado é `g-back-nucleo.txt`, gerado por este script e commitado.
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const args = process.argv.slice(2)
const porQue = args.includes("--por-que")
const ARVORE = path.resolve(args.find((a) => !a.startsWith("--")) ?? ".")
const RAIZ_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const DEPCRUISE = path.join(RAIZ_REPO, "node_modules", ".bin", "depcruise")

const PASTAS = ["app", "components", "hooks", "lib", "contexts", "types", "middleware.ts", "next.config.mjs"]
  .filter((p) => fs.existsSync(path.join(ARVORE, p)))
const json = execFileSync(DEPCRUISE, [
  "--config", path.join(ARVORE, ".dependency-cruiser.cjs"), "--output-type", "json", ...PASTAS,
], { cwd: ARVORE, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
const grafo = JSON.parse(json)

const local = (s) => !s.includes("node_modules") && /^(app|components|hooks|lib|contexts|types|middleware\.ts|next\.config\.mjs)/.test(s)
const ehTeste = (s) => /(^tests\/|^__tests__\/|\/__tests__\/|\.test\.|\.spec\.|\.bench\.)/.test(s)
const adj = new Map()
for (const m of grafo.modules) if (local(m.source)) adj.set(m.source, m.dependencies.map((d) => d.resolved).filter(local))

const origem = new Map() // arquivo → primeira raiz que o alcançou (para --por-que)
const alcance = (raizes, rotulo) => {
  const pilha = [...raizes]
  while (pilha.length) {
    const x = pilha.pop()
    if (origem.has(x) || ehTeste(x)) continue
    origem.set(x, rotulo(x))
    for (const y of adj.get(x) ?? []) pilha.push(y)
  }
}
const todos = [...adj.keys()]
const rotas = todos.filter((s) => /^app\/api\/.*\/route\.tsx?$/.test(s)).sort()
if (rotas.length === 0) { console.error("g-back-derivar: nenhuma app/api/**/route.ts no grafo"); process.exit(2) }
alcance([...rotas, "middleware.ts"].filter((s) => adj.has(s)), (x) => (x === "middleware.ts" || rotas.includes(x) ? "(a) raiz" : "(a) alcance das rotas"))
const servidorPaginas = ["lib/require-page-user.ts", "lib/content-service-server.ts"].filter((s) => adj.has(s))
for (const s of servidorPaginas) if (!origem.has(s)) origem.set(s, "(c)")
if (fs.existsSync(path.join(ARVORE, "next.config.mjs"))) alcance(["next.config.mjs"], () => "(d)")

const supabase = execFileSync("git", ["ls-files", "supabase"], { cwd: ARVORE, encoding: "utf8" }).split("\n").filter(Boolean)
for (const s of supabase) if (!origem.has(s)) origem.set(s, "(b)")

const lista = [...origem.keys()].sort()
process.stdout.write(lista.map((s) => (porQue ? `${s}\t${origem.get(s)}` : s)).join("\n") + "\n")
