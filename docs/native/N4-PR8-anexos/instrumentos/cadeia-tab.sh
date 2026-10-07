#!/bin/sh
# N4-PR8 — a cadeia do Tab (o molde da N4-PR6/PR7): cadeia-tab.sh <rotulo>   (paisagem user_rotation=1, retrato 0)
# o mock do Tab na 8789 (no aparelho, 8788); os túneis reaplicados antes de cada passo (div. 1077). W, SCR, ARVORE no ambiente.
I=$W/inst-pr8; Sr=RX2N8000F3D; RO=$1; D=$W/run/dumps/$RO; O=$W/run/roteiros; mkdir -p $D $O; export PORTA=8789
P=N4P8$(echo $RO | cut -c1 | tr a-z A-Z)
tun() { A=~/Library/Android/sdk/platform-tools/adb; $A -s $Sr reverse tcp:8081 tcp:8081 >/dev/null; $A -s $Sr reverse tcp:8790 tcp:8790 >/dev/null; $A -s $Sr reverse tcp:8788 tcp:8789 >/dev/null; }
tun; ROT=1 python3 $I/roteiro.py $Sr $D $P tab-pai palco S1 S1_aviso S1e S1f S2e reordenar picker folha dialogo S4 > $O/$RO-tab-pai.txt 2>&1
tun; PREFIXO=$P ROT=0 python3 $I/rolada.py $I $Sr $D tab-ret palco S2e picker S4 > $O/$RO-tab-ret.txt 2>&1
echo "$(date +%T) cadeia-tab $RO feita"
