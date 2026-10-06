#!/bin/sh
# N4-PR6 — a cadeia do Tab: cadeia-tab.sh <rotulo>   (paisagem user_rotation=1, retrato 0 — APARATO.md)
# o molde da cadeia-tab da N4-PR4, sem o estado-1p.py (a garantia da N4-PR5 o dispensa), e o retrato pelo rolada.py
I=$W/inst; Sr=RX2N8000F3D; RO=$1; D=$SCR/dumps/$RO; O=$SCR/roteiros; mkdir -p $D $O
P=N4P6$(echo $RO | cut -c1 | tr a-z A-Z)
for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done  # div.: o adb perde o reverse do Tab
ROT=1 python3 $I/roteiro.py $Sr $D $P tab-pai palco S1 S1_aviso S1e S1f S2e reordenar picker folha dialogo S4 > $O/$RO-tab-pai.txt 2>&1
for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done  # div.: o adb perde o reverse do Tab
PREFIXO=$P ROT=0 python3 $ROLADA $I $Sr $D tab-ret palco S2e picker S4 > $O/$RO-tab-ret.txt 2>&1
echo "$(date +%T) cadeia $RO tab feita"
