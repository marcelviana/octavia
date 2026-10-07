#!/bin/sh
# N4-PR9, N4-D105 c — N aberturas FRIAS no AVD (force-stop + o link do dev client + o S1 de pé), contando as quedas
# nativas do app: frias.sh <rotulo> <n> <saida>   (W no ambiente; o Metro do lado medido já de pé, o bundle conferido)
ADB=~/Library/Android/sdk/platform-tools/adb; S=emulator-5554; I=$W/inst-pr9
Q=/Users/marcelviana/projects/octavia-n4-pr9/docs/native/N4-PR9-anexos/instrumentos/quedas.py
export SCR=$W/base ARVORE=/Users/marcelviana/projects/octavia-n4-pr9
$ADB -s $S logcat -G 16M >/dev/null; $ADB -s $S logcat -c
t0=$($ADB -s $S shell dumpsys dropbox --print SYSTEM_TOMBSTONE | grep -c '>>> rocks.octavia.app <<<')
ok=0; nao=0
for i in $(seq 1 $2); do
  for p in 8081 8788 8790; do $ADB -s $S reverse tcp:$p tcp:$p >/dev/null; done
  if python3 -c "import sys; sys.path.insert(0,'$I'); import roteiro as R; R.ir_s1('$S')" >/dev/null 2>&1; then ok=$((ok+1)); r=ok; else nao=$((nao+1)); r=SEM-S1; fi
  q=$($ADB -s $S logcat -d | grep -c 'Fatal signal.*(cks.octavia.app)')
  echo "$1 abertura $i $(date +%T) $r · nativas acumuladas=$q"
done
t1=$($ADB -s $S shell dumpsys dropbox --print SYSTEM_TOMBSTONE | grep -c '>>> rocks.octavia.app <<<')
echo "== $1: aberturas=$2 S1=$ok sem-S1=$nao · tombstones do app novos no dropbox=$((t1-t0))"
python3 $Q $S
