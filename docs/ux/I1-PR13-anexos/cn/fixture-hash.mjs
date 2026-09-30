// I1-PR-13 — os hashes do `setlists.json` (a medição com sessão só grava hash) contra os textos da FIXTURE e das frases que
// provam cada estado: confirma que o que foi medido é o fabricado — nenhuma setlist nem content real lido, e o estado
// certo na tela. Anexo, não gate.
import fs from 'node:fs'
import { createHash } from 'node:crypto'
const h = (t) => createHash('sha256').update(t).digest('hex').slice(0, 12)
const d = JSON.parse(fs.readFileSync(process.argv[2] ?? 'tests/gates-web/medicoes/setlists.json', 'utf8'))
const PROVAS = [
  ['SET-carregando', 'carregando as setlists…'],
  ['SET-carregando-dados', 'Nova setlist'],
  ['SET-vazio', 'nenhuma setlist ainda'], ['SET-vazio', 'Criar a primeira setlist'],
  ['SET-erro', 'não foi possível carregar as setlists — sem conexão'],
  ['SET-nenhuma', '3 setlists'], ['SET-nenhuma', 'escolha uma setlist para ver os detalhes'], ['SET-nenhuma', 'Apagar a setlist Estresse'],
  ['SET', '8 músicas · 32 min'], ['SET', 'Garota de Ipanema'], ['SET', 'Tom Jobim'], ['SET', 'Remover Construção da setlist'], ['SET', 'Partitura'],
  ['SET-sem-musicas', '0 músicas'], ['SET-sem-musicas', 'nenhuma música ainda'], ['SET-sem-musicas', 'adicione músicas da biblioteca'],
  ['SET-criar', 'Nova setlist'], ['SET-criar', 'Data do show'], ['SET-criar', 'Criar'],
  ['SET-criar-validacao', 'a setlist precisa de um nome'],
  ['SET-criar-salvando', 'Criando…'],
  ['SET-criar-erro', 'não foi possível criar a setlist — sem conexão'], ['SET-criar-erro', 'o que você escreveu continua aqui'],
  ['SET-apagar', 'Apagar setlist'], ['SET-apagar', 'apagar “Show padrão”? não dá para desfazer'],
  ['SET-apagar-erro', 'não foi possível apagar a setlist — falha no servidor'],
  ['SET-ja-apagada', 'esta setlist já foi apagada'], ['SET-ja-apagada', '2 setlists'],
  ['SET-adicionar', 'Adicionar a Show padrão'], ['SET-adicionar', 'Selecionar todas (4)'], ['SET-adicionar', 'Asa branca'], ['SET-adicionar', 'artista desconhecido'], ['SET-adicionar', 'Adicionar 3'],
  ['SET-adicionar-vazio', 'nenhuma música disponível'], ['SET-adicionar-vazio', 'adicione músicas à biblioteca primeiro'],
  ['SET-adicionar-busca', 'nada encontrado'], ['SET-adicionar-busca', 'mude a busca'],
  ['SET-adicionar-enviando', 'Adicionando…'],
  ['SET-adicionar-erro', 'não foi possível adicionar as músicas — falha no servidor'],
  ['SET-remover-erro', 'não foi possível remover “Construção” — sem conexão'],
  ['SET-editar', 'Editar setlist'], ['SET-editar', 'Salvar'],
  ['SET-editar-salvando', 'Salvando…'],
  ['SET-editar-erro', 'não foi possível salvar a setlist — sem conexão'],
  ['SET-adicionar-todas-ja', 'todas as músicas da biblioteca já estão nesta setlist'],
  ['SESSAO-nao-renovada', 'a sessão não foi renovada: falha no servidor'],
  ['base-lista', '3 setlists'], ['base-detalhe', '8 músicas · 32 min'], ['base-formulario', 'Nova setlist'], ['base-dialogo', 'Apagar setlist'], ['base-picker', 'Selecionar todas (4)'],
]
let falta = 0
for (const [estado, texto] of PROVAS) {
  const hs = h(texto)
  const por = ['1138', '711', '411'].map((L) => {
    const nos = d.estados[estado]?.larguras?.[L]?.nos
    const ok = !!nos?.some((n) => n.h_texto === hs || n.h_nome === hs)
    if (nos && !ok) falta++
    return `${L}:${nos ? (ok ? 'sim' : 'NÃO') : '—'}`
  })
  console.log(`${estado.padEnd(24)} ${por.join(' ')}  ${JSON.stringify(texto)}`)
}
console.log(falta ? `\nFIXTURE: ${falta} texto(s) não achado(s)` : `\nFIXTURE: os ${PROVAS.length} textos achados em toda largura medida`)
process.exit(falta ? 1 : 0)
