#!/bin/sh
# SY-PR4 — OS CONTROLES NEGATIVOS DOS GATILHOS (regras 4 e 7). Instrumento de anexo (fora de CI, N4-D117). Da RAIZ da
# árvore, com a árvore de trabalho limpa nos arquivos plantados:
#   sh docs/native/SY-PR4-anexos/instrumentos/cn-sy-pr4.sh [rótulos…] > docs/native/SY-PR4-anexos/cn-sy-pr4.txt
#
# Cada corrida planta UM defeito por troca de texto com a âncora conferida (`plantar.py`), roda os gates (i) — os dois
# arquivos — e (v), e imprime o que eles acusaram; os arquivos voltam com `git checkout`, e o `git status` do fim prova
# que nada ficou trocado. Com a lista VAZIA (o commit 5), todo defeito acusado sai como reprovação NÃO DECLARADA. Sem
# argumento, roda todos; com rótulos (g-1 …), só esses.
I=docs/native/SY-PR4-anexos/instrumentos
ARQS="apps/native/src/gatilhos.ts apps/native/src/foto-do-palco.ts apps/native/src/sincronizador.ts apps/native/src/screens/SetlistsScreen.tsx apps/native/src/screens/LibraryScreen.tsx apps/native/src/screens/ModoDeReordenar.tsx apps/native/test/sy-reprovados.txt"
T=apps/native/test
QUAIS="$*"

rodar() {
  rotulo=$1; defeito=$2; shift 2
  case " $QUAIS " in *" $rotulo "*) ;; *) [ -n "$QUAIS" ] && return ;; esac
  echo "=================================================================================================="
  echo "CN $rotulo — $*"
  echo "  defeito: $defeito"
  python3 "$I/plantar.py" "$defeito" || { echo "  ✗ NÃO PLANTOU — o CN não mede nada"; git checkout -- $ARQS; return; }
  TESTES=${TESTES:-"$T/sy-gatilhos.test.tsx $T/sy-gatilhos-telas.test.tsx $T/sy-requisicoes.test.tsx"}
  pnpm exec vitest run $TESTES 2>&1 \
    | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^gate (i|ii|iii|v) \(|^  REPROVA|^        |^  ✗|^gate (i|ii|iii|v):|^ *(Test Files|Tests) ' | sed 's/ · .*//; s/^/  /'
  unset TESTES
  git checkout -- $ARQS
}

echo "# cn-sy-pr4.sh — $(date '+%Y-%m-%d %H:%M:%S %z') · árvore $(git rev-parse HEAD)"
echo "# Leitura: com o defeito plantado, o gate tem de ACUSAR a checagem daquela regra (uma REPROVA NÃO DECLARADA)."

rodar g-1  ignora-o-palco               'o gatilho que ignora o palco'
rodar g-2  dispara-ao-sair-sem-marca    'o que dispara ao sair do palco sem marca'
rodar g-3  conta-null-true              'o que conta a primeira leitura (null → true)'
rodar g-4  ignora-o-intervalo           'o que ignora o intervalo'
rodar g-5  tenta-de-novo-sozinho        'o que tenta de novo sozinho depois de uma falha de rede'
rodar g-6  dispara-em-segundo-plano     'o que dispara em segundo plano'
rodar g-7  de-novo-com-palco-aberto     'o "de novo" que roda com o palco aberto'
rodar g-8  linha-falta-no-skip-short    'a linha sync trigger que falta num caso que não dispara (skip-short)'
rodar g-9  intervalo-de-qualquer-sessao 'o último sync de outra sessão segura o gatilho (SY-D44)'
rodar g-10 avulso-nao-conta             'o avulso sem hospedeira não abre o palco (SY-D56)'
rodar g-11 indice-solta-a-sessao        'o foco do índice do palco solta a sessão'
rodar g-12 segura-todo-pedido           'o executor segura a abertura e o Tentar de novo com o palco aberto'
rodar t-1  ok-nao-tira-a-falha          'o sync que dá certo não tira o banner (SY-D57 (1))'
rodar t-2  s1-remonta-a-lista           'a lista de S1 se remonta com o banner (SY-D57 (2))'
rodar t-3  l-apaga-a-busca              'a L apaga a busca digitada quando o sync muda (SY-D57 (2))'
rodar t-4  reordenar-segue-as-props     'o arrasto pula quando a setlist nova chega (SY-D52)'
rodar l-1  lista-declara-o-logout       'uma linha na lista vazia, com o defeito que a faz reprovar (o commit 5)'
# os dois CN das PRs anteriores cuja âncora esta PR mudou de propósito (no roteiro delas, "NÃO PLANTOU"):
export TESTES="$T/sy-voo.test.ts";  rodar r-1 de-novo-apos-logout 'o n-5 da PR-2: o "de novo" da sessão velha roda depois do logout'
export TESTES="$T/sy-foto.test.tsx"; rodar r-2 sessao-nunca-solta 'o c-4 da PR-3: a foto da sessão não solta ao voltar a S1/S2'

echo "=================================================================================================="
echo "\$ git status --short -- apps/native   (vazio = os arquivos voltaram)"
git status --short -- apps/native
echo "exit=$?"
