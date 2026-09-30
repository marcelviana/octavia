// G-tok — a COBERTURA da lista (I1-PR14): nenhum arquivo de tela fora de `g-tok-arquivos.txt`.
//
// Até a I1-PR13 a lista (ii) do G-tok crescia por PR de superfície: o que nenhuma PR redesenhou ficava fora e o
// gate não o via (o `lib/error-boundary.tsx`, o limite global, com a cara velha inteira — I1-PR13 §27). Este
// script fecha a lista: ARQUIVO DE TELA fora dela reprova.
//
// ARQUIVO DE TELA (a definição — decisão do aval da I1-PR14; mudar é errata declarada):
//   todo `.ts`/`.tsx` sob `app/` (menos `app/api/`, que é rota — o G-back), `components/`, `contexts/` e `hooks/`,
//   e todo `.tsx` sob `lib/` (em `lib/` o `.ts` é serviço; o `.tsx` renderiza);
//   menos os testes (`__tests__/`, `*.test.*`, `*.spec.*`).
// A lista de exclusão (EXCLUIDOS) é FECHADA e começa vazia: um arquivo de tela que não entra na lista (ii) entra
// aqui, com a razão — e aparece no relatório.
//
// Uso (da raiz):  node scripts/gates-web/g-tok-cobertura.mjs [raiz]
//   `raiz` (padrão `.`) é onde se procuram os arquivos; a lista vem de G_TOK_ARQUIVOS (padrão
//   `scripts/gates-web/g-tok-arquivos.txt`) e os caminhos dela são relativos à raiz. O CN roda sobre a árvore
//   sintética de `tests/gates-web/fixtures/g-tok-cobertura/` (docs/ux/I1-PR14-anexos/cn/).
// Sai 0 se nenhum arquivo de tela está fora, 1 se algum está, 2 se falta insumo.
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const RAIZ = process.argv[2] ?? "."
const LISTA = process.env.G_TOK_ARQUIVOS ?? "scripts/gates-web/g-tok-arquivos.txt"
/** caminho (relativo à raiz) → razão. Vazia na I1-PR14. */
const EXCLUIDOS = {}

const DIRS = ["app", "components", "contexts", "hooks", "lib"]
const TESTE = /(^|\/)__tests__\/|\.(test|spec)\.[cm]?[jt]sx?$/
const ehTela = (rel) => {
  if (!/\.tsx?$/.test(rel) || /\.d\.ts$/.test(rel) || TESTE.test(rel)) return false
  if (rel.startsWith("app/api/")) return false
  if (rel.startsWith("lib/")) return rel.endsWith(".tsx")
  return true
}

if (!fs.existsSync(LISTA)) { console.error(`g-tok-cobertura: lista ausente: ${LISTA}`); process.exit(2) }
const lista = new Set(fs.readFileSync(LISTA, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")))

// Os arquivos vêm do git — os versionados e os novos ainda não commitados, MENOS os ignorados: a rota de fixture do
// G-faixa (`app/g-faixa-erro-global/`, no `.gitignore`) existe no disco só durante a medição e não é tela do app.
let todos
try {
  todos = execFileSync("git", ["-C", RAIZ, "ls-files", "--cached", "--others", "--exclude-standard", "--", ...DIRS], { encoding: "utf8" })
    .split("\n").filter(Boolean)
} catch (e) { console.error(`g-tok-cobertura: git ls-files falhou em ${RAIZ}: ${e.message}`); process.exit(2) }
const tela = [...new Set(todos)].filter((f) => fs.existsSync(path.join(RAIZ, f)) && ehTela(f)).sort()

console.log(`## cobertura da lista (ii) — ${LISTA} (raiz ${RAIZ})`)
const fora = tela.filter((f) => !lista.has(f) && !(f in EXCLUIDOS))
for (const f of fora) console.log(`  ✗ ${f}: arquivo de tela fora da lista (ii) — entra na lista ou em EXCLUIDOS, com a razão`)
for (const [f, razao] of Object.entries(EXCLUIDOS)) console.log(`  · excluído: ${f} — ${razao}`)
const naoTela = [...lista].filter((f) => fs.existsSync(path.join(RAIZ, f)) && !tela.includes(f))
console.log(`  arquivos de tela: ${tela.length} · na lista: ${tela.length - fora.length - Object.keys(EXCLUIDOS).length} · excluídos: ${Object.keys(EXCLUIDOS).length} · FORA: ${fora.length} · da lista que não são de tela (informa): ${naoTela.length}`)
console.log(fora.length ? `\nG-tok (cobertura): REPROVA — ${fora.length} arquivo(s) de tela fora da lista` : "\nG-tok (cobertura): PASSA")
process.exit(fora.length ? 1 : 0)
