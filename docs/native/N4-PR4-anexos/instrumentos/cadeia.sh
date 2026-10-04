#!/bin/sh
# N4-PR4 — a cadeia de um aparelho: cadeia.sh <serial> <ap> <ROT_PAI> <ROT_RET> <rotulo antes|depois> [s0]
I=$SCR/../inst; Sr=$1; AP=$2; RP=$3; RR=$4; RO=$5; D=$SCR/dumps/$RO; O=$SCR/roteiros; mkdir -p $D $O
P=N4P4$(echo $RO | cut -c1 | tr a-z A-Z)
ROT=$RP python3 $I/roteiro.py $Sr $D $P $AP-pai palco S1f S2e reordenar picker folha dialogo S4 > $O/$RO-$AP-pai.txt 2>&1
PREFIXO=$P ROT=$RP python3 $I/passada4-final.py $I $Sr $D $AP-pai > $O/$RO-$AP-pai-s1.txt 2>&1
ROT=$RR python3 $I/roteiro.py $Sr $D $P $AP-ret palco S2e picker S4 > $O/$RO-$AP-ret.txt 2>&1
[ "$6" = s0 ] && PREFIXO=$P ROT=$RP python3 $I/n3pr6.py $I $Sr $D $AP-pai S0frio > $O/$RO-$AP-pai-s0.txt 2>&1
echo "$(date +%T) cadeia $RO $AP feita"
