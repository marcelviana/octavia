#!/usr/bin/env python3
"""SY-PR2 — o PLANTADOR dos controles negativos novos (regras 4 e 7). Instrumento de anexo (fora de CI, N4-D117).

Da RAIZ da árvore: `python3 docs/native/SY-PR2-anexos/instrumentos/plantar.py <defeito>`. Cada defeito é UMA troca de
texto num arquivo do app (ou do core), com a âncora CONFERIDA: se a âncora não está lá, o script sai com erro e nada é
plantado — um controle que não plantou não mediu nada (o caso 42). Quem devolve os arquivos é o `cn-sy-pr2.sh`, com
`git checkout`. O `aplica-depois-do-await` não é troca de texto: é o executor do commit 2 (`83d8fe8`), o de ANTES da
aplicação síncrona — o executor que aplica depois do `await sincronizar`.
"""
import subprocess, sys

def trocar(arq, velho, novo, n=1):
    s = open(arq).read()
    k = s.count(velho)
    if k != n:
        sys.exit(f"plantar: âncora em {arq} aparece {k} vez(es), esperado {n}: {velho[:80]!r}")
    open(arq, 'w').write(s.replace(velho, novo))
    print(f"  plantado em {arq} ({n}×): {velho.strip()[:70]!r} → {novo.strip()[:70]!r}")

SRC = 'apps/native/src'
CORE = 'packages/core/src'
d = sys.argv[1]
if d == 'dois-em-curso':          # a máquina deixa o pedido durante o voo RODAR
    trocar(f'{CORE}/voo.ts', "      return { estado: 'em-voo-de-novo', acao: 'marcar' }", "      return { estado: 'em-voo-de-novo', acao: 'rodar' }")
elif d == 'de-novo-duas-vezes':   # o "de novo" não se apaga ao rodar: roda de novo depois dele
    trocar(f'{CORE}/voo.ts', ": { estado: 'em-voo', acao: 'rodar' }", ": { estado: 'em-voo-de-novo', acao: 'rodar' }")
elif d == 'executor-de-novo-duas-vezes':  # o EXECUTOR roda o "de novo" duas vezes (a máquina certa)
    trocar(f'{SRC}/sincronizador.ts', "      await rodarUm(vez.raiz, vez.uid, vez.anterior)\n",
           "      await rodarUm(vez.raiz, vez.uid, vez.anterior)\n      if (vez.anterior !== anterior) await rodarUm(vez.raiz, vez.uid, vez.raiz.dadosRef.current)\n")
elif d == 'nao-descarta':         # o executor não confere a sessão: aplica depois do logout
    trocar(f'{SRC}/sincronizador.ts', "if (sessaoAtual() !== uid) return", "if (false as boolean) return", n=2)
elif d == 'de-novo-apos-logout':  # o "de novo" da sessão velha não se cancela
    trocar(f'{SRC}/sincronizador.ts', "cancelarDeNovo: marcado === null || marcado.raiz.sessaoAtual() !== marcado.uid,", "cancelarDeNovo: marcado === null,")
elif d == 'perdeu-e-grava':       # o sync que perdeu a geração grava e aplica as setlists mesmo assim
    trocar(f'{SRC}/sync.ts', "const setlistsValem = aplicarLeituraDeSetlists(minha)", "const setlistsValem = aplicarLeituraDeSetlists(minha) || true")
elif d == 'perdeu-le-o-ref':      # o sync que perdeu aplica com as setlists do `dadosRef` defasado (o cuidado da A5)
    trocar(f'{SRC}/sincronizador.ts', "setDados((atual) => ({ ...atual, content: a.content,", "setDados(() => ({ ...dadosRef.current, content: a.content,")
elif d == 'sem-prazo':            # as leituras do sync sem o prazo de rede
    trocar(f'{SRC}/sync.ts', "getSetlists({ prazoMs: PRAZO_DE_REDE_MS })", "getSetlists()")
    trocar(f'{SRC}/sync.ts', "getContentPage(page, { prazoMs: PRAZO_DE_REDE_MS })", "getContentPage(page)")
elif d == 'falha-de-rede-sempre-falsa':  # o `ultimoSyncNaRede` nunca diz falha de rede
    trocar(f'{SRC}/sync.ts', "falhaDeRede: code === 'network',", "falhaDeRede: false,")
elif d == 'aplica-depois-do-await':
    s = subprocess.run(['git', 'show', '83d8fe8:apps/native/src/sincronizador.ts'], capture_output=True, text=True, check=True).stdout
    open(f'{SRC}/sincronizador.ts', 'w').write(s)
    print(f"  {SRC}/sincronizador.ts ← o do commit 2 (83d8fe8): aplica DEPOIS do await sincronizar")
else:
    sys.exit(f"plantar: defeito desconhecido: {d}")
