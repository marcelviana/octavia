#!/bin/sh
# SY-PR1 — OS CONTROLES NEGATIVOS DOS CINCO GATES (regras 4 e 7). Instrumento de anexo (fora de CI, N4-D117).
# Da RAIZ da árvore, com a árvore de trabalho limpa nos três contratos:
#   sh docs/native/SY-PR1-anexos/instrumentos/cn-sy.sh > docs/native/SY-PR1-anexos/cn-sy.txt
#
# Cada corrida troca um contrato por uma PLANTA (os laboratórios de `plantas/`, que leem a regra quebrada de
# `SY_DEFEITO`) ou liga o embrulho de tela do gate (iii) (`SY_PLANTA_TELA=congela`), roda UM gate e imprime o que ele
# acusou: as checagens que reprovam, as órfãs (a declaração que passou com a planta) e o veredito. Os contratos voltam
# com `git checkout` ao fim de cada corrida, e o `git status` do fim prova que nada ficou trocado.
#
# As variáveis vão por `export`/`unset`, nunca `VAR=x função` (no `sh` do macOS ela vaza para as chamadas seguintes,
# div. 1203 do QL).
P=docs/native/SY-PR1-anexos/instrumentos/plantas
SRC=apps/native/src
T=apps/native/test

rodar() {
  rotulo=$1; teste=$2; gat=$3; sinc=$4; foto=$5; defeito=$6; tela=$7
  echo "=================================================================================================="
  echo "CN $rotulo"
  echo "  gate: $teste · gatilhos: ${gat:-o contrato} · executor: ${sinc:-o literal} · foto: ${foto:-o contrato} · SY_DEFEITO=${defeito:--} · SY_PLANTA_TELA=${tela:--}"
  [ -n "$gat" ] && cp "$P/$gat" "$SRC/gatilhos.ts"
  [ -n "$sinc" ] && cp "$P/$sinc" "$SRC/sincronizador.ts"
  [ -n "$foto" ] && cp "$P/$foto" "$SRC/foto-do-palco.ts"
  export SY_DEFEITO="$defeito"
  export SY_PLANTA_TELA="$tela"
  pnpm exec vitest run "$T/$teste" 2>&1 | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^gate [iv]+ \(|^  REPROVA|^  ✗|^gate [iv]+:|^ *(Test Files|Tests) ' | sed 's/ · .*//; s/^/  /'
  unset SY_DEFEITO SY_PLANTA_TELA
  git checkout -- "$SRC/gatilhos.ts" "$SRC/sincronizador.ts" "$SRC/foto-do-palco.ts"
}

echo "# cn-sy.sh — $(date '+%Y-%m-%d %H:%M:%S %z') · árvore $(git rev-parse HEAD)"
echo "# Leitura: com a PLANTA certa (o laboratório sem defeito), o gate deixa de reprovar o que a planta implementa — as"
echo "# linhas declaradas que ela cumpre aparecem como ÓRFÃS, e é isso que se espera; com um DEFEITO, o gate tem de"
echo "# acusar a checagem daquela regra (uma REPROVA que não é das declaradas)."

# (i) os gatilhos
rodar 'i-0  o laboratório dos gatilhos, sem defeito'            sy-gatilhos.test.tsx gatilhos-lab.ts '' '' '' ''
rodar 'i-1  ignora o intervalo'                                  sy-gatilhos.test.tsx gatilhos-lab.ts '' '' intervalo ''
rodar 'i-2  conta a primeira leitura e a repetição'              sy-gatilhos.test.tsx gatilhos-lab.ts '' '' primeira ''
rodar 'i-3  tenta de novo sozinho depois da falha de rede'       sy-gatilhos.test.tsx gatilhos-lab.ts '' '' retenta ''
rodar 'i-4  a marca não se apaga por um sync'                     sy-gatilhos.test.tsx gatilhos-lab.ts '' '' marca ''
rodar 'i-5  dispara com o app em segundo plano'                  sy-gatilhos.test.tsx gatilhos-lab.ts '' '' fundo ''
rodar 'i-6  ignora a sessão'                                     sy-gatilhos.test.tsx gatilhos-lab.ts '' '' sessao ''
rodar 'i-7  não confere a rede na volta'                         sy-gatilhos.test.tsx gatilhos-lab.ts '' '' sem-rede ''
rodar 'i-8  a volta curta sem a marca dispara'                   sy-gatilhos.test.tsx gatilhos-lab.ts '' '' curta ''
rodar 'i-9  os dois laboratórios (gatilhos e voo), sem defeito'  sy-gatilhos.test.tsx gatilhos-lab.ts sincronizador-lab.ts '' '' ''
rodar 'i-10 o voo aplica o intervalo a todo pedido'              sy-gatilhos.test.tsx gatilhos-lab.ts sincronizador-lab.ts '' intervalo-em-tudo ''
# (ii) o voo único
rodar 'ii-0 o laboratório do voo, sem defeito'                   sy-voo.test.ts '' sincronizador-lab.ts '' '' ''
rodar 'ii-1 o "de novo" roda depois do logout'                   sy-voo.test.ts '' sincronizador-lab.ts '' de-novo-apos-logout ''
rodar 'ii-2 o sync ok não chega à raiz'                          sy-voo.test.ts '' sincronizador-lab.ts '' nao-aplica ''
# (iii) a foto
rodar 'iii-0 a tela que congela TUDO (o embrulho)'               sy-foto.test.tsx '' '' '' '' congela
rodar 'iii-1 o laboratório da foto da sessão, sem defeito'       sy-foto.test.tsx '' '' foto-do-palco-lab.ts '' ''
rodar 'iii-2 a foto da sessão nunca se solta'                    sy-foto.test.tsx '' '' foto-do-palco-lab.ts nunca-solta ''
# (iv) a janela — o próprio gate é o CN (reprova na main); o controle `controle-antes` passa. Com o laboratório do voo
# (que não aplica no bloco síncrono), a janela continua aberta:
rodar 'iv-0 o laboratório do voo (a janela não é dele)'          sy-nao-regredir.test.ts '' sincronizador-lab.ts '' '' ''
# (v) a contagem
rodar 'v-0  o laboratório dos gatilhos, sem defeito'             sy-requisicoes.test.tsx gatilhos-lab.ts '' '' '' ''
rodar 'v-1  pede dois syncs por evento'                          sy-requisicoes.test.tsx gatilhos-lab.ts '' '' duplo ''

echo "=================================================================================================="
echo "\$ git status --short -- apps/native/src   (vazio = os contratos voltaram)"
git status --short -- apps/native/src
echo "exit=$?"
