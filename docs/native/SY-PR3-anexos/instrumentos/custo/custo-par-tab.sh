#!/bin/sh
# SY-PR3 — o par antes × depois no TAB S6 (a cópia do custo-par.sh: o serial, a porta 8789, o diretório), um logo depois do outro (o Metro trocado no meio, o bundle conferido antes de cada lado)
S=$1; PR=/Users/marcelviana/projects/octavia-sy-pr3; BASE=/Users/marcelviana/projects/octavia-sy-pr3-base
metro() { pkill -f "expo start --dev-client"; sleep 3; (cd $1/apps/native && EXPO_PUBLIC_API_BASE_URL=http://localhost:8788 nohup npx expo start --dev-client --clear --port 8081 > $S/tab/metro-$2.log 2>&1 &); sleep 5; until curl -s http://127.0.0.1:8081/status | grep -q running; do sleep 2; done; }
lado() { # $1 rótulo  $2 árvore
  metro $2 $1
  (cd $PR && sh docs/native/SY-PR3-anexos/instrumentos/bundle.sh "$1" $2; ~/Library/Android/sdk/platform-tools/adb -s RX2N8000F3D reverse --list) > $S/tab/bundle-$1.txt
  date '+# carga do host antes do lado %T' >> $S/tab/custo/carga-marcas.txt
  (cd $PR && python3 docs/native/SY-PR3-anexos/instrumentos/custo/custo-pr3.py RX2N8000F3D $S/tab/custo/$1 $S/fx-sy 10 a 3) > $S/tab/custo/$1-saida.txt 2>&1
  (cd $PR && export SEM_EVENTOS=1 && python3 docs/native/SY-PR3-anexos/instrumentos/custo/custo-pr3.py RX2N8000F3D $S/tab/custo/$1-sem-eventos $S/fx-sy 2 a 0) > $S/tab/custo/$1-sem-eventos-saida.txt 2>&1
  date "+# fim do lado $1 %T" >> $S/tab/custo/carga-marcas.txt
}
export PORTA=8789; lado antes $BASE
lado depois $PR
echo FIM
