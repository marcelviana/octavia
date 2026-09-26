// G-palco, parte 2 (I1-PR3): resolve os imports dos arquivos rastreados
// (stdin, um por linha) e acusa os que apontam para um caminho MORRE da
// lista do corte (env MORRE, um por linha). Alias `@/` = raiz; relativos
// resolvidos pelo diretório do arquivo. Chamado por g-palco.sh.
import fs from "node:fs"
import path from "node:path"
const semExt = (p) => p.replace(/\.(tsx?|jsx?|mjs|cjs)$/, "")
const alvos = new Map()
for (const p of process.env.MORRE.split("\n").filter(Boolean)) {
  alvos.set(semExt(p), p)
  if (/\/index\.(tsx?|jsx?)$/.test(p)) alvos.set(p.replace(/\/index\.(tsx?|jsx?)$/, ""), p)
}
const mortos = new Set(process.env.MORRE.split("\n").filter(Boolean))
const RE = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bvi\.(?:mock|doMock|unmock|importActual)\s*\(\s*)["']([^"']+)["']/g
const saida = []
for (const f of fs.readFileSync(0, "utf8").split("\n").filter(Boolean)) {
  if (mortos.has(f) || !fs.existsSync(f)) continue
  const linhas = fs.readFileSync(f, "utf8").split("\n")
  linhas.forEach((l, i) => {
    for (const m of l.matchAll(RE)) {
      const s = m[1]
      let r = null
      if (s.startsWith("@/")) r = s.slice(2)
      else if (s.startsWith(".")) r = path.posix.normalize(path.posix.join(path.posix.dirname(f), s))
      if (r === null) continue
      const alvo = alvos.get(semExt(r))
      if (alvo) saida.push(`  ✗ ${f}:${i + 1} importa ${alvo}  (${s})`)
    }
  })
}
process.stdout.write(saida.join("\n") + (saida.length ? "\n" : ""))
