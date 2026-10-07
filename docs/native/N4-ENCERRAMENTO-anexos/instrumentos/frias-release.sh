#!/bin/sh
# N4 encerramento, A-N4-28 com a condição da N4-D105 d — N aberturas FRIAS do RELEASE, contando as quedas do app
# (a Java, a NATIVA e os tombstones) pelo `N4-PR9-anexos/instrumentos/quedas.py`.
#
#   frias-release.sh <serial> <rotulo> <n>
#
# O release não tem o link do dev client nem o Metro: a abertura é `force-stop` + `am start -W` da MainActivity, e o
# "S1 de pé" é o `resource-id` `criar-setlist` (ou `buscar`) num `uiautomator dump` — só o atributo é lido; o dump não
# se guarda. O aparelho já está EM AVIÃO (regra 11: lido, declarado, provado pelo `ping` antes, por quem chama).
# Por abertura sai: a hora, S1 ou SEM-S1, o `TotalTime` do `am start -W`, as nativas acumuladas e as linhas `OCTAVIA: api`
# acumuladas (tem de ser 0: em avião, nenhuma requisição). `logcat -G 16M` e `logcat -c` UMA vez, antes (APARATO, logcat).
ADB=$HOME/Library/Android/sdk/platform-tools/adb
S=$1; R=$2; N=$3
Q=$(cd "$(dirname "$0")/../.." && pwd)/N4-PR9-anexos/instrumentos/quedas.py
$ADB -s $S logcat -G 16M >/dev/null; $ADB -s $S logcat -c
t0=$($ADB -s $S shell dumpsys dropbox --print SYSTEM_TOMBSTONE | grep -c '>>> rocks.octavia.app <<<')
ok=0; nao=0
for i in $(seq 1 $N); do
  $ADB -s $S shell am force-stop rocks.octavia.app </dev/null; sleep 1
  tt=$($ADB -s $S shell am start -W -n rocks.octavia.app/.MainActivity </dev/null | sed -n 's/^TotalTime: //p' | tr -d '\r')
  r=SEM-S1; k=0
  while [ $k -lt 20 ]; do
    if $ADB -s $S exec-out sh -c 'uiautomator dump /sdcard/fr.xml >/dev/null 2>&1; cat /sdcard/fr.xml' </dev/null \
       | grep -qE 'resource-id="(criar-setlist|buscar)"'; then r=S1; break; fi
    k=$((k+1)); sleep 1
  done
  [ $r = S1 ] && ok=$((ok+1)) || nao=$((nao+1))
  log=$($ADB -s $S logcat -d </dev/null)
  q=$(printf '%s\n' "$log" | grep -c 'Fatal signal.*(cks.octavia.app)')
  a=$(printf '%s\n' "$log" | grep -c 'OCTAVIA: api ')
  echo "$R abertura $i $(date +%T) $r TotalTime=$tt · nativas acumuladas=$q · api acumuladas=$a"
done
$ADB -s $S shell rm -f /sdcard/fr.xml </dev/null
t1=$($ADB -s $S shell dumpsys dropbox --print SYSTEM_TOMBSTONE | grep -c '>>> rocks.octavia.app <<<')
echo "== $R: aberturas=$N S1=$ok sem-S1=$nao · tombstones do app novos no dropbox=$((t1-t0))"
echo "== linhas OCTAVIA da rodada: $($ADB -s $S logcat -d | grep -c 'OCTAVIA:') · api=$($ADB -s $S logcat -d | grep -c 'OCTAVIA: api ') · sync skip=$($ADB -s $S logcat -d | grep -c 'OCTAVIA: sync skip reason=offline') · auth restored=$($ADB -s $S logcat -d | grep -c 'OCTAVIA: auth uid=.* src=restored')"
python3 "$Q" $S
