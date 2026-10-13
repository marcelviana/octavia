#!/usr/bin/env python3
"""SY-PR4 — o PLANTADOR dos controles negativos dos gatilhos (regras 4 e 7). Instrumento de anexo (fora de CI, N4-D117).

Da RAIZ: `python3 docs/native/SY-PR4-anexos/instrumentos/plantar.py <defeito>`. Cada defeito é UMA troca de texto num
arquivo do app (ou na lista), com a âncora CONFERIDA — sem a âncora, sai com erro e nada se planta (um CN que não plantou
não mede nada, o caso 42). Quem devolve os arquivos é o `cn-sy-pr4.sh`, com `git checkout`. O molde é o da SY-PR3.
"""
import sys

def trocar(arq, velho, novo, n=1):
    s = open(arq).read()
    k = s.count(velho)
    if k != n:
        sys.exit(f"plantar: âncora em {arq} aparece {k} vez(es), esperado {n}: {velho[:80]!r}")
    open(arq, 'w').write(s.replace(velho, novo))
    print(f"  plantado em {arq} ({n}×): {velho.strip()[:70]!r} → {novo.strip()[:70]!r}")

G = 'apps/native/src/gatilhos.ts'
F = 'apps/native/src/foto-do-palco.ts'
S = 'apps/native/src/sincronizador.ts'
S1 = 'apps/native/src/screens/SetlistsScreen.tsx'
L = 'apps/native/src/screens/LibraryScreen.tsx'
R = 'apps/native/src/screens/ModoDeReordenar.tsx'
LISTA = 'apps/native/test/sy-reprovados.txt'

def plantar(d):
    if d == 'ignora-o-palco':                 # o gatilho dispara com o palco aberto
        trocar(G, "    if (l.palco.palcoAberto()) {\n      marcaDoPalco = { uid }", "    if (false) {\n      marcaDoPalco = { uid }")
    elif d == 'dispara-ao-sair-sem-marca':    # fechar o palco sem marca pede um sync
        trocar(G, "    if (!vivo || marca === null) return\n    if (l.sessao() !== marca.uid) return // outra sessão (ou nenhuma): a marca era da que saiu\n    comRede(marca.uid, 'stage-exit')",
               "    const uid = marca?.uid ?? l.sessao()\n    if (!vivo || uid === null) return\n    comRede(uid, 'stage-exit')")
    elif d == 'conta-null-true':              # a primeira leitura da rede (null → true) conta como volta
        trocar(G, "    if (vivo && online === null) online = v",
               "    if (vivo && online === null) {\n      online = v\n      const uid = l.sessao()\n      if (v && uid !== null) decidir(uid, 'net')\n    }")
    elif d == 'ignora-o-intervalo':           # o intervalo de 30 s não vale
        trocar(G, "if (u !== null && u.uid === uid && u.fimMs !== null && !u.falhaDeRede && Date.now() - u.fimMs < INTERVALO_MINIMO_MS) {", "if (false) {")
    elif d == 'tenta-de-novo-sozinho':        # depois de uma falha de rede, pede outro sync sem gatilho nenhum
        trocar(G, "  /** Um sync saiu à rede depois de `t`: a marca já foi atendida (SY-D17 (1)). */",
               "  let visto: number | null = null\n  const retentar = setInterval(() => {\n    const u = l.ultimoSyncNaRede()\n    if (vivo && u !== null && u.fimMs !== null && u.falhaDeRede && u.inicioMs !== visto) {\n      visto = u.inicioMs\n      l.pedirSync('net')\n    }\n    if (!vivo) clearInterval(retentar)\n  }, 20)\n  /** Um sync saiu à rede depois de `t`: a marca já foi atendida (SY-D17 (1)). */")
    elif d == 'dispara-em-segundo-plano':     # a rede que volta em segundo plano dispara
        trocar(G, "    if (AppState.currentState !== 'active') {\n      marcaDoFundo = { uid, t: Date.now() }", "    if (false) {\n      marcaDoFundo = { uid, t: Date.now() }")
    elif d == 'de-novo-com-palco-aberto':     # o "de novo" do voo roda com o palco aberto
        trocar(S, "const espera = roda && (marcado.raiz.segurarDeNovo?.() ?? false)", "const espera = false")
    elif d == 'linha-falta-no-skip-short':    # a volta curta sem a marca não deixa a linha
        trocar(G, "    else linha('foreground', 'skip-short')", "    else void 0")
    elif d == 'intervalo-de-qualquer-sessao': # o último sync de outra sessão segura o gatilho (SY-D44)
        trocar(G, "u !== null && u.uid === uid && u.fimMs !== null", "u !== null && u.fimMs !== null")
    elif d == 'avulso-nao-conta':             # o avulso sem hospedeira não abre o palco (SY-D56)
        trocar(F, "const aberto = (): boolean => emSessao || avulsos > 0", "const aberto = (): boolean => emSessao")
    elif d == 'indice-solta-a-sessao':        # o foco do índice do palco solta a sessão
        trocar(F, "      if (posicaoAtual === undefined) sair()", "      void posicaoAtual\n      sair()")
    elif d == 'segura-todo-pedido':           # o executor segura todo pedido com o palco aberto (a abertura e o Tentar de novo)
        trocar(S, "  const pedido = pedirVoo(voo)\n", "  if (raiz.segurarDeNovo?.() === true) return\n  const pedido = pedirVoo(voo)\n")
    elif d == 'ok-nao-tira-a-falha':          # o sync que dá certo não tira a falha da tela (o banner fica)
        trocar(S, "setSync({ fase: 'ok', syncedAtMs: a.syncedAtMs })", "setSync({ fase: 'falha', syncedAtMs: a.syncedAtMs, messageKey: 'erro.desconhecido' })", n=2)
    elif d == 's1-remonta-a-lista':           # a lista de S1 se remonta com o banner (a rolagem voltaria ao topo)
        trocar(S1, "        <FlatList\n          data={setlists}", "        <FlatList\n          key={comBanner ? 'com-banner' : 'sem-banner'}\n          data={setlists}")
    elif d == 'l-apaga-a-busca':              # a L apaga o termo quando o sync muda
        trocar(L, "  const [termo, setTermo] = useState('')\n", "  const [termo, setTermo] = useState('')\n  useEffect(() => setTermo(''), [sync])\n")
    elif d == 'reordenar-segue-as-props':     # o modo de reordenar refaz a ordem a cada setlist nova (o arrasto pula)
        trocar(R, "  const [ordem, setOrdem] = useState<SetlistSongDTO[]>(() => ordenadas(setlist))\n",
               "  const [ordem, setOrdem] = useState<SetlistSongDTO[]>(() => ordenadas(setlist))\n  useEffect(() => setOrdem(ordenadas(setlist)), [setlist])\n")
    elif d == 'de-novo-apos-logout':          # o n-5 da PR-2, na âncora nova: o "de novo" da sessão velha não se cancela
        trocar(S, "const roda = marcado !== null && marcado.raiz.sessaoAtual() === marcado.uid", "const roda = marcado !== null")
    elif d == 'sessao-nunca-solta':           # o c-4 da PR-3, na âncora nova: `sair` não solta a foto
        trocar(F, "    mudar(() => {\n      foto = null\n      emSessao = false\n    })", "    mudar(() => {\n      emSessao = false\n    })")
    elif d == 'lista-declara-o-logout':       # uma linha na lista vazia (com o defeito que a faz reprovar de fato)
        plantar('intervalo-de-qualquer-sessao')
        with open(LISTA, 'a') as f:
            f.write('i:logout-intervalo-de-outra-sessao\n')
        print(f"  acrescentado a {LISTA}: i:logout-intervalo-de-outra-sessao")
    else:
        sys.exit(f"plantar: defeito desconhecido: {d}")

plantar(sys.argv[1])
