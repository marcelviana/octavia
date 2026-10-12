#!/bin/sh
# SY-PR3 — OS CONTROLES NEGATIVOS DA FOTO (regras 4 e 7). Instrumento de anexo (fora de CI, N4-D117). Da RAIZ da árvore,
# com a árvore de trabalho limpa nos arquivos plantados:
#   sh docs/native/SY-PR3-anexos/instrumentos/cn-sy-pr3.sh [rótulos…] > docs/native/SY-PR3-anexos/cn-sy-pr3.txt
#
# Cada corrida troca um arquivo por uma PLANTA (`plantas/`) ou planta UM defeito por troca de texto com a âncora
# conferida (`plantar.py`), roda o gate (iii) e imprime o que ele acusou; os arquivos voltam com `git checkout`, e o
# `git status` do fim prova que nada ficou trocado. As variáveis por `export`/`unset` (div. 1203). Sem argumento, roda
# todos; com rótulos (c-1 …), só esses.
P=docs/native/SY-PR3-anexos/instrumentos/plantas
I=docs/native/SY-PR3-anexos/instrumentos
SRC=apps/native/src
# só os arquivos RASTREADOS: um `git checkout --` com um caminho que não existe recusa TODOS (medido na 1ª corrida: a
# planta ficou no lugar)
ARQS=$(git ls-files -- "$SRC/foto-do-palco.ts" "$SRC/navigation.tsx" "$SRC/screens/StageScreen.tsx" "$SRC/screens/VisualizacaoScreen.tsx" "$SRC/foto-do-conteudo.ts")
QUAIS="$*"

rodar() {
  rotulo=$1; planta=$2; defeito=$3; testes=$4; shift 4
  case " $QUAIS " in *" $rotulo "*) ;; *) [ -n "$QUAIS" ] && return ;; esac
  echo "=================================================================================================="
  echo "CN $rotulo — $*"
  echo "  planta: ${planta:--} · defeito: ${defeito:--}"
  if [ -n "$planta" ]; then cp "$P/$planta" "$SRC/foto-do-palco.ts"; export SY_DEFEITO="$defeito"
  elif [ -n "$defeito" ]; then python3 "$I/plantar.py" "$defeito" || { echo "  ✗ NÃO PLANTOU — o CN não mede nada"; git checkout -- $ARQS; return; }; fi
  pnpm exec vitest run apps/native/test/sy-foto.test.tsx $testes 2>&1 | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^gate iii \(|^  REPROVA|^        |^  ✗|^gate iii:|^ *(Test Files|Tests) |^ *× ' | sed 's/^/  /'
  unset SY_DEFEITO
  git checkout -- $ARQS
}

echo "# cn-sy-pr3.sh — $(date '+%Y-%m-%d %H:%M:%S %z') · árvore $(git rev-parse HEAD)"
echo "# Leitura: com o defeito plantado, o gate (iii) tem de ACUSAR a checagem daquela regra — uma REPROVA que não é das"
echo "# declaradas; com a planta certa, as declaradas que ela cumpre aparecem como ÓRFÃS."

rodar c-1 foto-do-palco-lab.ts serve-outra '' 'a foto de uma setlist serve a outra (div. 1283, o sessao-outra-setlist)'
rodar c-2 foto-do-palco-lab.ts ''          '' 'o laboratório da foto da sessão, sem defeito (o controle do c-1)'
rodar c-3 '' v-congela-a-estrela        '' 'a foto de V congela também a estrela'
rodar c-4 '' sessao-nunca-solta         '' 'a foto da sessão não solta ao voltar a S1/S2'
rodar c-5 '' palco-nao-renova-na-troca  '' 'a foto do conteúdo não se renova ao trocar de posição'
rodar c-6 '' sessao-por-instancia       '' 'a foto por instância, não por sessão (o índice vê a setlist viva)'
rodar c-7 '' palco-esquece-a-apagada    '' 'a música aberta, apagada pelo sync, perde a foto'
rodar c-8 '' palco-sem-foto             '' 'o palco lê o conteúdo vivo'
rodar c-9 '' v-sem-chave-do-id apps/native/test/visualizacao-tela.test.tsx 'a foto de V sem a chave do id (a 1ª forma do commit 4)'

echo "=================================================================================================="
echo "\$ git status --short -- apps/native/src   (vazio = os arquivos voltaram)"
git status --short -- apps/native/src
echo "exit=$?"
