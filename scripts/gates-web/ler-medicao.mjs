// G-faixa — a leitura de uma medição em texto (`.json`) ou comprimida (`.json.gz`) (I1-PR15; decisão 2 do
// encerramento do I1: fica em texto só o que o veredito lê; o rastro — `cn-main/`, `casca-efeito/`, `rodada1/`,
// `antes-*/` — vai em `.gz`, um por arquivo, mesmo nome + `.gz`).
//
// `lerJson(caminho)` aceita o nome com ou sem `.gz`: lê o que existir. Os dois ao mesmo tempo é erro — a mesma
// medição em dois formatos seria contada duas vezes ou divergiria sem ninguém ver.
// `listarJson(pasta)` devolve os nomes lógicos (`x.json`) de `x.json` e `x.json.gz`, sem descer em subpastas.
import fs from "node:fs"
import zlib from "node:zlib"

const semGz = (p) => p.replace(/\.gz$/, "")

export function lerJson(caminho) {
  const texto = semGz(caminho), gz = `${texto}.gz`
  const temTexto = fs.existsSync(texto), temGz = fs.existsSync(gz)
  if (temTexto && temGz) throw new Error(`${texto}: existe em texto e em .gz — um só`)
  if (temGz) return JSON.parse(zlib.gunzipSync(fs.readFileSync(gz)).toString("utf8"))
  return JSON.parse(fs.readFileSync(texto, "utf8"))
}

export function listarJson(pasta) {
  if (!fs.existsSync(pasta)) return []
  const nomes = fs.readdirSync(pasta).filter((f) => f.endsWith(".json") || f.endsWith(".json.gz")).map(semGz)
  const repetidos = nomes.filter((n, i) => nomes.indexOf(n) !== i)
  if (repetidos.length) throw new Error(`${pasta}: em texto e em .gz ao mesmo tempo — ${[...new Set(repetidos)].join(", ")}`)
  return nomes.sort()
}
