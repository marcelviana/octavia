#!/bin/sh
A=~/Library/Android/sdk/platform-tools/adb; S=emulator-5554; W=/private/tmp/claude-501/-Users-marcelviana-projects-octavia/cc1a39a7-36bc-47b2-8a8a-994c156c4b06/scratchpad/w; X=/Users/marcelviana/projects/octavia-ql-pr4/docs/native/QL-PR4-anexos/instrumentos
export ARVORE=/Users/marcelviana/projects/octavia-ql-pr4
sh $W/inst/receita-cache.sh $S guardar $W/r2/cache-avd-2 > $W/r2/estado/avd-receita-guardar-2.txt 2>&1 || { echo PARA-receita; exit 1; }
pkill -f 'aceite.py servidor 8788'; sleep 1
nohup python3 $ARVORE/apps/native/src/fixtures/aceite.py servidor 8788 normal $W/scr-ql2/mock/setlists.json $W/scr-ql2/mock/content.json > $W/r2/mock-8788-ql-2.log 2>&1 &
sleep 2
for p in 8081 8788 8790; do $A -s $S reverse tcp:$p tcp:$p >/dev/null; done
$A -s $S shell cmd connectivity airplane-mode disable; sleep 3; $A -s $S shell svc wifi enable; $A -s $S shell svc data enable; sleep 8
$A -s $S shell ping -c 2 -W 3 8.8.8.8 | tail -1 > $W/r2/estado/avd-ping-rodada-2.txt
$A -s $S logcat -G 16M; $A -s $S logcat -c; date '+%T logcat limpo (2ª subida)' > $W/r2/estado/avd-logcat-inicio-2.txt
SCR=$W/scr-ql2 PORTA=8788 PREFIXO=QL4R python3 $X/ql4.py $W/inst $S $W/r2/run/dumps/ql avd paginacao > $W/r2/run/roteiros/ql-avd-2.txt 2>&1
pkill -f 'aceite.py servidor 8788'; sleep 1
nohup python3 $ARVORE/apps/native/src/fixtures/aceite.py servidor 8788 normal $W/scr-base/mock/setlists.json $W/scr-base/mock/content.json > $W/r2/mock-8788-base-3.log 2>&1 &
sleep 2
for p in 8081 8788 8790; do $A -s $S reverse tcp:$p tcp:$p >/dev/null; done
SCR=$W/scr-base PORTA=8788 PREFIXO=QL4B ROT=0 python3 $W/inst/n3pr6.py $W/inst $S $W/r2/run/dumps/base avd-pai S0frio > $W/r2/run/roteiros/base-avd-pai-s0-2.txt 2>&1
echo "$(date +%T) RODADA AVD 2 FEITA"
