#!/bin/sh
A=~/Library/Android/sdk/platform-tools/adb; S=RX2N8000F3D; W=/private/tmp/claude-501/-Users-marcelviana-projects-octavia/cc1a39a7-36bc-47b2-8a8a-994c156c4b06/scratchpad/w; X=/Users/marcelviana/projects/octavia-ql-pr4/docs/native/QL-PR4-anexos/instrumentos
export ARVORE=/Users/marcelviana/projects/octavia-ql-pr4
$A -s $S logcat -G 5M; $A -s $S logcat -c; date '+%T logcat do Tab limpo' > $W/r2/estado/tab-logcat-inicio.txt
export W SCR=$W/scr-base
sh $W/inst/cadeia-tab2.sh base
pkill -f 'aceite.py servidor 8789'; sleep 1
nohup python3 $ARVORE/apps/native/src/fixtures/aceite.py servidor 8789 normal $W/scr-ql2/mock/setlists.json $W/scr-ql2/mock/content.json > $W/r2/mock-8789-ql.log 2>&1 &
sleep 2
$A -s $S reverse tcp:8081 tcp:8081 >/dev/null; $A -s $S reverse tcp:8790 tcp:8790 >/dev/null; $A -s $S reverse tcp:8788 tcp:8789 >/dev/null
SCR=$W/scr-ql2 PORTA=8789 PREFIXO=QL4R python3 $X/ql4.py $W/inst $S $W/r2/run/dumps/ql tab bordas foratexto paginacao ancora ancorav gpar > $W/r2/run/roteiros/ql-tab.txt 2>&1
echo "$(date +%T) RODADA TAB FEITA"
