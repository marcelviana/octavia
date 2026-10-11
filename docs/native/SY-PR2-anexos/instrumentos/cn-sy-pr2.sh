#!/bin/sh
# SY-PR2 — OS CONTROLES NEGATIVOS NOVOS (regras 4 e 7). Instrumento de anexo (fora de CI, N4-D117). Da RAIZ da árvore,
# com a árvore de trabalho limpa nos arquivos plantados:
#   sh docs/native/SY-PR2-anexos/instrumentos/cn-sy-pr2.sh > docs/native/SY-PR2-anexos/cn-sy-pr2.txt
#
# Cada corrida planta UM defeito (`plantar.py`, a âncora conferida), roda os testes que têm de acusá-lo e imprime o que
# eles acusaram — as checagens que reprovam nos gates do SY (o juiz) e os testes vermelhos fora deles — e devolve os
# arquivos com `git checkout`. O `git status` do fim prova que nada ficou trocado. As variáveis por `export`/`unset`
# (div. 1203). O roteiro da PR-1 sobre o código novo é o `SY-PR1-anexos/instrumentos/cn-sy.sh`, rodado à parte.
I=docs/native/SY-PR2-anexos/instrumentos
ARQS="apps/native/src/sincronizador.ts apps/native/src/sync.ts packages/core/src/voo.ts"

rodar() {
  rotulo=$1; defeito=$2; shift 2
  echo "=================================================================================================="
  echo "CN $rotulo"
  echo "  defeito: $defeito · testes: $*"
  python3 "$I/plantar.py" "$defeito" || { echo "  ✗ NÃO PLANTOU — o CN não mede nada"; git checkout -- $ARQS; return; }
  pnpm exec vitest run "$@" 2>&1 | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^gate [iv]+ \(|^  REPROVA|^        |^  ✗|^gate [iv]+:|^ *(Test Files|Tests) |^ *FAIL |^ *× ' | sed 's/^/  /'
  git checkout -- $ARQS
}

echo "# cn-sy-pr2.sh — $(date '+%Y-%m-%d %H:%M:%S %z') · árvore $(git rev-parse HEAD)"
echo "# Leitura: com o defeito plantado, o teste da regra tem de ACUSAR — no gate do SY, uma REPROVA que não é das"
echo "# declaradas (a parte (ii) e a (iv) da lista estão vazias desde esta PR); nos outros, um teste vermelho (×)."
echo "# O n-2 (o defeito na MÁQUINA) só os testes de unidade dela acusam: o executor roda um \"de novo\" só quando há um"
echo "# pedido guardado, e absorve o defeito — o n-2b planta o mesmo defeito no EXECUTOR, que é o que o gate (ii) mede."

rodar 'n-1 a máquina deixa rodar o pedido durante o voo'           dois-em-curso             packages/core/src/voo.test.ts apps/native/test/sy-voo.test.ts
rodar 'n-2 o voo roda o "de novo" duas vezes'                       de-novo-duas-vezes        packages/core/src/voo.test.ts apps/native/test/sy-voo.test.ts
rodar 'n-2b o EXECUTOR roda o "de novo" duas vezes (a máquina certa)' executor-de-novo-duas-vezes apps/native/test/sy-voo.test.ts
rodar 'n-3 o executor aplica DEPOIS do await (o do commit 2)'       aplica-depois-do-await    apps/native/test/sy-nao-regredir.test.ts apps/native/test/sy-voo.test.ts
rodar 'n-4 o sync não descarta depois do logout'                    nao-descarta              apps/native/test/sy-voo.test.ts
rodar 'n-5 o "de novo" da sessão velha roda depois do logout'       de-novo-apos-logout       apps/native/test/sy-voo.test.ts
rodar 'n-6 o sync que perdeu a geração grava as setlists'           perdeu-e-grava            apps/native/test/sy-voo.test.ts apps/native/test/escrita.test.ts
rodar 'n-7 o sync que perdeu lê as setlists do dadosRef defasado'   perdeu-le-o-ref           apps/native/test/sy-voo.test.ts
rodar 'n-8 as leituras do sync sem prazo'                           sem-prazo                 apps/native/test/sy-voo.test.ts
rodar 'n-9 o ultimoSyncNaRede nunca diz falha de rede'              falha-de-rede-sempre-falsa apps/native/test/sy-ultimo-sync.test.ts

echo "=================================================================================================="
echo "\$ git status --short -- apps/native/src packages/core/src   (vazio = os arquivos voltaram)"
git status --short -- apps/native/src packages/core/src
echo "exit=$?"
