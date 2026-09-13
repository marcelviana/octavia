import { readFileSync } from 'node:fs'
const SP = '/private/tmp/claude-501/-Users-marcelviana-projects-octavia/8697c385-6a74-4a2f-80c6-61d2e548b1b6/scratchpad'
const src = readFileSync('/Users/marcelviana/projects/octavia-v1pr3/apps/native/src/icones/dados.ts', 'utf8')
const nomes = [...src.matchAll(/^  '([^']+)': \{/gm)].map((m) => m[1])
const anexo = readFileSync('/Users/marcelviana/projects/octavia-v1pr3/docs/native/V1-PR3-PRECHECK-anexos/V1-PR3-D-icones-34.txt', 'utf8')
const regs = [...anexo.matchAll(/^### ([^ ]+)  ·  .+?  ·  \d+ dp\n(<svg.*?<\/svg>)/gm)]
const S64 = ['auto-scroll','zoom −','zoom +','claro','escuro','índice','busca','sair','voltar (avulsa)','letra','cifra','tab','partitura','garantida','parcial','nunca sincronizada','baixando','sem conexão','última sincronização','falha','tentar novamente','voltar','fechar','apagar','buscar música','baixar setlist','baixando… (ação)','voltar ao início','data','local','n.º de músicas','sem conteúdo','tipo desconhecido','arquivo não baixado']
console.log(`nomes no mapa: ${nomes.length}  ·  linhas da §6.4: ${S64.length} (34, com voltar duas vezes)  ·  + log-in`)
const dsAnexo = new Set(regs.flatMap(([, , svg]) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])))
const dsMapa = new Set([...src.matchAll(/d: '([^']+)'/g)].map((m) => m[1]))
const normalMapa = new Set([...src.matchAll(/^    normal: (\[.*\]),$/gm)].flatMap((m) => [...m[1].matchAll(/d: '([^']+)'/g)].map((x) => x[1])))
const faltam = [...dsAnexo].filter((d) => !dsMapa.has(d))
const sobram = [...normalMapa].filter((d) => !dsAnexo.has(d))
console.log(`paths d distintos no anexo D: ${dsAnexo.size}  ·  no mapa (normal): ${normalMapa.size}`)
console.log(`d do anexo ausentes do mapa: ${faltam.length} ${JSON.stringify(faltam)}`)
console.log(`d 'normal' do mapa que não estão no anexo D: ${sobram.length} ${JSON.stringify(sobram)}  (esperado: só o log-in, que vem do telas.html)`)
const semCurrent = ['parcial', 'baixando']
console.log(`hex cravado no mapa: ${(src.match(/#[0-9A-Fa-f]{6}/g) ?? []).length} (esperado 0)  ·  tinta por token: ${(src.match(/tinta: '/g) ?? []).length} ocorrências, nos ícones ${semCurrent.join(', ')}`)
console.log(`linhas: dados.ts ${src.split('\n').length - 1}`)
