import subprocess, re
T='/Users/marcelviana/projects/octavia-n4-pr7'
def run(cmd):
    r=subprocess.run(cmd,shell=True,cwd=T,capture_output=True,text=True); return re.sub(r'\x1b\[[0-9;]*m','',r.stdout+r.stderr)
p=f'{T}/apps/native/src/screens/LibraryScreen.tsx'
def cn(nome, pares):
    s=open(p).read()
    for a,b in pares:
        assert s.count(a)==1,(nome,a[:50]); s=s.replace(a,b)
    open(p,'w').write(s)
    out=run('pnpm exec vitest run apps/native/test/biblioteca-tela.test.tsx')
    print(f'## CN {nome}\n   ', [l.strip() for l in out.splitlines() if re.match(r'\s+Tests ',l)])
    for l in [l.strip() for l in out.splitlines() if l.strip().startswith('×')][:3]: print('     '+l[:150])
    subprocess.run(['git','checkout','--','apps/native/src/screens/LibraryScreen.tsx'],cwd=T)
cn('1 (refeito, com o duplo consertado) · a régua rolando com a lista: MOVIDA para o cabeçalho da FlatList', [
  ("""      <Regua
        esquerda={semLista ? REGUA_SEM_NUMERO.rotulo : reguaBiblioteca(contents.length)}
        direita={semLista ? REGUA_SEM_NUMERO.contagem : nResultados(resposta.n)}
      />
""",""),
  ("""        testID="lib-lista"
""","""        testID="lib-lista"
        ListHeaderComponent={<Regua esquerda={reguaBiblioteca(contents.length)} direita={nResultados(resposta.n)} />}
""")])
cn('5 (refeito, com o duplo consertado) · o teclado abrindo sozinho (autoFocus no campo de L)', [
  ('            autoCorrect={false}\n            autoCapitalize="none"\n            testID="lib-campo"', '            autoFocus\n            autoCorrect={false}\n            autoCapitalize="none"\n            testID="lib-campo"')])
print('$ git status --short:', repr(run('git status --short')))
