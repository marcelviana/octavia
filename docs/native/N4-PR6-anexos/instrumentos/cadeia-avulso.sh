#!/bin/sh
# N4-PR6 — o palco avulso de um aparelho: cadeia-avulso.sh <serial> <ap> <ROT_PAI> <ROT_RET> <rotulo>
I=$W/inst; A=$INSTR/avulso.py; Sr=$1; AP=$2; RP=$3; RR=$4; RO=$5; O=$W/run/roteiros
P=N4P6$(echo $RO | cut -c1 | tr a-z A-Z)
D=$W/run/dumps-avulso/$RO; mkdir -p $D
for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done  # div.: o adb perde o reverse do Tab
SCR=$W/run PREFIXO=$P ROT=$RP python3 $A $I $Sr $D $AP-pai letra partitura naoBaixado tituloLongo semArtista zero > $O/av-$RO-$AP-pai.txt 2>&1
for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done  # div.: o adb perde o reverse do Tab
SCR=$W/run PREFIXO=$P ROT=$RR python3 $A $I $Sr $D $AP-ret letra partitura naoBaixado tituloLongo semArtista zero > $O/av-$RO-$AP-ret.txt 2>&1
for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done  # div.: o adb perde o reverse do Tab
SCR=$W/run-formato PREFIXO=$P ROT=$RP python3 $A $I $Sr $D $AP-pai formato > $O/av-$RO-$AP-pai-formato.txt 2>&1
for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done  # div.: o adb perde o reverse do Tab
SCR=$W/run-formato PREFIXO=$P ROT=$RR python3 $A $I $Sr $D $AP-ret formato > $O/av-$RO-$AP-ret-formato.txt 2>&1
# de volta à fixture da base: o mock normal e um sync (a setlist 3 e a música 13 saem do cache)
for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done  # div.: o adb perde o reverse do Tab
SCR=$W/run python3 -c "import sys; sys.path.insert(0,'$I'); import roteiro as R; R.mock('normal'); R.ir_s1('$Sr')"
echo "$(date +%T) cadeia-avulso $RO $AP feita"
