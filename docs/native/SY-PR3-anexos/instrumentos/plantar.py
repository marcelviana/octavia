#!/usr/bin/env python3
"""SY-PR3 — o PLANTADOR dos controles negativos da foto (regras 4 e 7). Instrumento de anexo (fora de CI, N4-D117).

Da RAIZ: `python3 docs/native/SY-PR3-anexos/instrumentos/plantar.py <defeito>`. Cada defeito é UMA troca de texto num
arquivo do app, com a âncora CONFERIDA (sem a âncora, sai com erro e nada se planta — um CN que não plantou não mede
nada, o caso 42). Quem devolve os arquivos é o `cn-sy-pr3.sh`, com `git checkout`. O `sessao-por-instancia` não é troca
de texto: é o `foto-do-palco.ts` INERTE da SY-PR1 (`17207c4`) — a leitura é a viva, e o palco só tem a foto do conteúdo
da própria instância: o índice, o fim e a busca veem a setlist viva.
"""
import subprocess, sys

def trocar(arq, velho, novo, n=1):
    s = open(arq).read()
    k = s.count(velho)
    if k != n:
        sys.exit(f"plantar: âncora em {arq} aparece {k} vez(es), esperado {n}: {velho[:80]!r}")
    open(arq, 'w').write(s.replace(velho, novo))
    print(f"  plantado em {arq} ({n}×): {velho.strip()[:70]!r} → {novo.strip()[:70]!r}")

ST = 'apps/native/src/screens/StageScreen.tsx'
V = 'apps/native/src/screens/VisualizacaoScreen.tsx'
d = sys.argv[1]
if d == 'v-congela-a-estrela':        # a foto de V congela também o `is_favorite`
    trocar(V, "{ ...ultimo.current, is_favorite: atual.is_favorite }", "ultimo.current")
elif d == 'v-sem-chave-do-id':        # a foto de V não se chaveia pelo id (a 1ª forma do commit 4)
    trocar(V, "(ultimo.current === null || ultimo.current.id !== atual.id)", "ultimo.current === null")
elif d == 'palco-nao-renova-na-troca':  # a foto do conteúdo do palco não se renova ao trocar de posição
    trocar(ST, "const chaveDaAbertura = avulsa ? `avulsa|${avulsaContentId}` : `${posicao}|${song?.content_id ?? ''}`",
           "const chaveDaAbertura = 'uma-so'")
elif d == 'palco-esquece-a-apagada':  # a música aberta, apagada pelo sync, perde a foto
    trocar(ST, "if (fotoDoConteudo.current.chave !== chaveDaAbertura) fotoDoConteudo.current = { chave: chaveDaAbertura, content: vivo }",
           "if (fotoDoConteudo.current.chave !== chaveDaAbertura || vivo === null) fotoDoConteudo.current = { chave: chaveDaAbertura, content: vivo }")
elif d == 'palco-sem-foto':           # o palco lê o conteúdo vivo (sem foto do conteúdo)
    trocar(ST, "  const content = fotoDoConteudo.current.content\n", "  const content = vivo\n")
elif d == 'sessao-por-instancia':
    s = subprocess.run(['git', 'show', '17207c4:apps/native/src/foto-do-palco.ts'], capture_output=True, text=True, check=True).stdout
    open('apps/native/src/foto-do-palco.ts', 'w').write(s)
    print("  apps/native/src/foto-do-palco.ts ← o da SY-PR1 (17207c4): inerte, a leitura é a viva")
elif d == 'sessao-nunca-solta':       # `sair` não solta
    trocar('apps/native/src/foto-do-palco.ts', "    sair: () => {\n      foto = null\n    },", "    sair: () => undefined,")
else:
    sys.exit(f"plantar: defeito desconhecido: {d}")
