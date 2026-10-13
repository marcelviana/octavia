#!/bin/sh
# SY-PR3 — o par antes × depois no AVD, um logo depois do outro (o Metro trocado no meio, o bundle conferido antes de cada lado)
S=$1; PR=/Users/marcelviana/projects/octavia-sy-pr3; BASE=/Users/marcelviana/projects/octavia-sy-pr3-base
metro() { pkill -f "expo start --dev-client"; sleep 3; (cd $1/apps/native && EXPO_PUBLIC_API_BASE_URL=http://localhost:8788 nohup npx expo start --dev-client --clear --port 8081 > $S/avd/metro-$2.log 2>&1 &); sleep 5; until curl -s http://127.0.0.1:8081/status | grep -q running; do sleep 2; done; }
lado() { # $1 rótulo  $2 árvore
  metro $2 $1
  (cd $PR && sh docs/native/SY-PR3-anexos/instrumentos/bundle.sh "$1" $2) > $S/avd/bundle-$1.txt
  date '+# carga do host antes do lado %T' >> $S/avd/custo/carga-marcas.txt
  (cd $PR && python3 docs/native/SY-PR3-anexos/instrumentos/custo/custo-pr3.py emulator-5554 $S/avd/custo/$1 $S/fx-sy 10 a 3) > $S/avd/custo/$1-saida.txt 2>&1
  (cd $PR && export SEM_EVENTOS=1 && python3 docs/native/SY-PR3-anexos/instrumentos/custo/custo-pr3.py emulator-5554 $S/avd/custo/$1-sem-eventos $S/fx-sy 2 a 0) > $S/avd/custo/$1-sem-eventos-saida.txt 2>&1
  date "+# fim do lado $1 %T" >> $S/avd/custo/carga-marcas.txt
}
lado antes $BASE
lado depois $PR
echo FIM
