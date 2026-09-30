// I1-PR-12 — os hashes do `add-content.json` (a medição com sessão só grava hash) contra os textos da FIXTURE e das
// frases que provam cada estado: confirma que o que foi medido é o fabricado — nenhum content real lido, e o estado
// certo na tela. Anexo, não gate.
import fs from 'node:fs'
import { createHash } from 'node:crypto'
const h = (t) => createHash('sha256').update(t).digest('hex').slice(0, 12)
const d = JSON.parse(fs.readFileSync(process.argv[2] ?? 'tests/gates-web/medicoes/add-content.json', 'utf8'))
const PROVAS = [
  ['UP-carregando', 'carregando…'],
  ['UP-como', 'como você quer adicionar?'], ['UP-como', 'Próximo'],
  ['UP-arquivo', 'formatos: .pdf, .docx, .txt · até 4 MiB'],
  ['UP-enviando', 'enviando o arquivo…'], ['UP-enviando', 'partitura-12-paginas.pdf · 1,8 MiB'],
  ['UP-extensao', 'tipo de arquivo não aceito: foto.heic — use .pdf, .docx ou .txt'],
  ['UP-limite', 'o arquivo passa de 4 MiB — escolha um menor'],
  ['UP-envio-rede', 'o arquivo não foi enviado — sem conexão'],
  ['UP-envio-servidor', 'o arquivo não foi enviado — falha no servidor'],
  ['UP-detalhes', 'Partitura de 12 páginas'], ['UP-detalhes', 'Compositor anônimo'], ['UP-detalhes', 'partitura-12-paginas.pdf · 1,8 MiB'],
  ['UP-detalhes-inativo', 'título e artista são obrigatórios'],
  ['UP-salvando', 'Salvando…'],
  ['UP-salvar-erro', 'não foi possível salvar — falha no servidor'], ['UP-salvar-erro', 'o que você escreveu continua aqui'],
  ['UP-criar', 'título da música'],
  ['UP-criar-validacao', 'o título é obrigatório'],
  ['UP-lote', '4 músicas encontradas em repertorio.docx'], ['UP-lote', 'Anunciação'], ['UP-lote', 'Alceu Valença'], ['UP-lote', 'Unknown Artist'],
  ['UP-lote-lendo', 'carregando…'],
  ['UP-lote-importando', 'Importando…'],
  ['UP-lote-erro', 'não foi possível importar as músicas — falha no servidor'], ['UP-lote-erro', 'Importar todas'],
  ['UP-lote-vazio', 'nenhuma música encontrada no arquivo'],
  ['UP-lote-sucesso', '4 músicas importadas'],
  ['UP-pronto', '“Partitura de 12 páginas”, de Compositor anônimo, está na biblioteca'], ['UP-pronto', 'Ir para a biblioteca'],
  ['base-lote', '4 músicas encontradas em repertorio.txt'],
]
let falta = 0
for (const [estado, texto] of PROVAS) {
  const hs = h(texto)
  const por = ['1138', '711', '411'].map((L) => {
    const nos = d.estados[estado]?.larguras?.[L]?.nos
    const ok = !!nos?.some((n) => n.h_texto === hs || n.h_nome === hs)
    if (!ok) falta++
    return `${L}:${nos ? (ok ? 'sim' : 'NÃO') : '—'}`
  })
  console.log(`${estado.padEnd(22)} ${JSON.stringify(texto)} ${por.join(' ')}`)
}
console.log(falta ? `FALTAM ${falta}` : `todos os ${PROVAS.length} textos presentes nas três larguras`)
