#!/bin/sh
# N4-PR7 — a cadeia do Tab (o molde da N4-PR6): cadeia-tab.sh <dir-instrumentos> <rotulo>  (paisagem user_rotation=1, retrato 0)
I=$1; Sr=RX2N8000F3D; RO=$2; D=$W/run/dumps/$RO; O=$W/run/roteiros; mkdir -p $D $O
P=N4P7$(echo $RO | cut -c1 | tr a-z A-Z)
tun() { for p_ in 8081 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done; ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:8788 tcp:$PORTA >/dev/null; }
tun; ROT=1 python3 $I/roteiro.py $Sr $D $P tab-pai palco S1 S1_aviso S1e S1f S2e reordenar picker folha dialogo S4 > $O/$RO-tab-pai.txt 2>&1
tun; PREFIXO=$P ROT=0 python3 $I/rolada.py $I $Sr $D tab-ret palco S2e picker S4 > $O/$RO-tab-ret.txt 2>&1
echo "$(date +%T) cadeia $RO tab feita"
