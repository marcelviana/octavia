import subprocess, sys, re
T='/Users/marcelviana/projects/octavia-n4-pr7'
def run(cmd):
    r=subprocess.run(cmd,shell=True,cwd=T,capture_output=True,text=True)
    return re.sub(r'\x1b\[[0-9;]*m','',r.stdout+r.stderr)
CNS=[
 ("1 · a régua rolando com a lista (dentro da FlatList, como cabeçalho)", 'apps/native/src/screens/LibraryScreen.tsx',
  "        testID=\"lib-lista\"\n", "        testID=\"lib-lista\"\n        ListHeaderComponent={<Regua esquerda=\"x\" direita=\"y\" />}\n",
  "apps/native/test/biblioteca-tela.test.tsx"),
 ("2 · a contagem do chip mudando com a busca (contada sobre o que sobrou)", 'apps/native/src/screens/LibraryScreen.tsx',
  "        contagens={semLista ? null : resposta.contagens}", "        contagens={semLista ? null : contarBibliotecaCN(resposta.itens)}",
  "apps/native/test/biblioteca-tela.test.tsx"),
 ("3 · a estrela mudando antes da resposta (otimismo: em voo, o desenho do valor pedido)", 'apps/native/src/screens/LinhaDaBiblioteca.tsx',
  "  const favorita = content.is_favorite === true\n", "  const favorita = content.is_favorite === true ? emVoo !== 'tirando' : emVoo === 'favoritando'\n",
  "apps/native/test/biblioteca-tela.test.tsx"),
 ("4 · o motivo elidido na linha de aviso (numberOfLines={1})", 'apps/native/src/screens/LinhaDeAviso.tsx',
  '<Text style={[styles.motivo, { color: cor }]} testID="aviso-motivo">', '<Text style={[styles.motivo, { color: cor }]} testID="aviso-motivo" numberOfLines={1}>',
  "apps/native/test/biblioteca-tela.test.tsx"),
 ("5 · o teclado abrindo sozinho (autoFocus no campo de L)", 'apps/native/src/screens/LibraryScreen.tsx',
  '            autoCorrect={false}\n            autoCapitalize="none"\n            testID="lib-campo"', '            autoFocus\n            autoCorrect={false}\n            autoCapitalize="none"\n            testID="lib-campo"',
  "apps/native/test/biblioteca-tela.test.tsx"),
 ("6 · N4-D92 desfeito (a falha registrada sem consultar a rede)", 'apps/native/src/files.ts',
  "        if (await sondaDeRede().catch(() => true)) falhas.set(url, fraseDaFalha(erro))\n        else falhas.delete(url)", "        falhas.set(url, fraseDaFalha(erro))",
  "apps/native/test/arquivo-sem-rede.test.ts"),
 ("7 · uma cópia de volta numa tela (o 'Tentar novamente' literal no S1d)", 'apps/native/src/screens/SetlistsScreen.tsx',
  "<Text style={styles.botaoPrimarioTexto}>{FRASES_DO_TABLET['tentar-novamente']}</Text>", "<Text style={styles.botaoPrimarioTexto}>Tentar novamente</Text>",
  "apps/native/test/frases-n4.test.ts"),
 ("8 · uma frase do core trocada ('carregando…' → 'carregando...')", 'packages/core/src/frases-content.ts',
  "  carregando: 'carregando…',", "  carregando: 'carregando...',",
  "apps/native/test/frases-n4.test.ts"),
]
for nome, arq, a, b, teste in CNS:
    p=f'{T}/{arq}'; s=open(p).read(); assert s.count(a)==1,(nome,a[:40])
    s2=s.replace(a,b)
    if 'contarBibliotecaCN' in b:
        s2=s2.replace("  type ContentDTO,\n","  contarBiblioteca as contarBibliotecaCN,\n  type ContentDTO,\n",1)
    open(p,'w').write(s2)
    out=run(f'pnpm exec vitest run {teste}')
    tot=[l.strip() for l in out.splitlines() if re.match(r'\s+Tests ',l)]
    fails=[l.strip() for l in out.splitlines() if l.strip().startswith('×')][:4]
    print(f'## CN {nome}\n   plantado em {arq}; {teste}: {tot}')
    for f in fails: print('     '+f[:150])
    subprocess.run(['git','checkout','--',arq],cwd=T)
print('$ git status --short (depois de desfazer):', repr(run('git status --short')))
# CN do a20: inglês plantado no frases-content
p=f'{T}/packages/core/src/frases-content.ts'; s=open(p).read()
open(p,'w').write(s.replace("  carregando: 'carregando…',","  carregando: 'loading…',"))
print('## CN 9 · inglês no módulo de frases do core (\'loading…\'): o gate:a20 (div. 1035)')
print('   '+run('cd apps/native && node scripts/a20.mjs .').strip().splitlines()[-1])
print('   '+'\n   '.join([l for l in run('cd apps/native && node scripts/a20.mjs .').splitlines() if 'loading' in l][:2]))
subprocess.run(['git','checkout','--','packages/core/src/frases-content.ts'],cwd=T)
print('$ git status --short (fim):', repr(run('git status --short')))
