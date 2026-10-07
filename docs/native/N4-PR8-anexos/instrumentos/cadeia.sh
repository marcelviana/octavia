#!/bin/sh
# N4-PR8 — a cadeia de um aparelho (cópia da N4-PR7, `instrumentos/cadeia.sh`, com o arnês da errata de caminho):
# cadeia.sh <serial> <ap> <ROT_PAI> <ROT_RET> <rotulo> [s0]     (W, SCR, ARVORE no ambiente)
I=$W/inst-pr7; Sr=$1; AP=$2; RP=$3; RR=$4; RO=$5; D=$W/run/dumps/$RO; O=$W/run/roteiros; mkdir -p $D $O
P=N4P8$(echo $RO | cut -c1 | tr a-z A-Z)
tun() { for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done; }
tun; ROT=$RP python3 $I/roteiro.py $Sr $D $P $AP-pai palco S1f S2e reordenar picker folha dialogo S4 > $O/$RO-$AP-pai.txt 2>&1
tun; PREFIXO=$P ROT=$RP python3 $I/passada4-final.py $I $Sr $D $AP-pai > $O/$RO-$AP-pai-s1.txt 2>&1
tun; PREFIXO=$P ROT=$RR python3 $I/rolada.py $I $Sr $D $AP-ret palco S2e picker S4 > $O/$RO-$AP-ret.txt 2>&1
[ "$6" = s0 ] && { tun; PREFIXO=$P ROT=$RP python3 $I/n3pr6.py $I $Sr $D $AP-pai S0frio > $O/$RO-$AP-pai-s0.txt 2>&1; }
echo "$(date +%T) cadeia $RO $AP feita"
