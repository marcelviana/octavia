#!/bin/sh
# ciclos.sh <rotulo> <n> — abre o app do zero (ir_s1), toca `buscar`, espera a L; conta os `Fatal signal` do logcat.
ADB=~/Library/Android/sdk/platform-tools/adb; S=emulator-5556; I=$W/inst-pr9
export SCR=$W/vis ARVORE=/Users/marcelviana/projects/octavia-n4-pr9
n0=$($ADB -s $S logcat -d | grep -c 'Fatal signal')
ok=0; falhou=0
for i in $(seq 1 $2); do
  for p in 8081 8788 8790; do $ADB -s $S reverse tcp:$p tcp:$p >/dev/null; done
  if python3 -c "import sys; sys.path.insert(0,'$I'); import n3, roteiro as R; R.ir_s1('$S'); n3.tap('$S', rid='buscar', espera=2); R.esperar('$S', rid='lib-campo')" >/dev/null 2>&1; then ok=$((ok+1)); else falhou=$((falhou+1)); fi
done
echo "$1: ciclos=$2 ok=$ok falhou=$falhou Fatal signal=$(( $($ADB -s $S logcat -d | grep -c 'Fatal signal') - n0 ))"
