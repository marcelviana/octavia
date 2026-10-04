#!/bin/sh
# N4-PR4 — a cadeia do Tab: cadeia-tab.sh <rotulo antes|depois>   (paisagem user_rotation=1, retrato 0 — APARATO.md)
I=$SCR/../inst; Sr=RX2N8000F3D; RO=$1; D=$SCR/dumps/$RO; O=$SCR/roteiros; mkdir -p $D $O
P=N4P4$(echo $RO | cut -c1 | tr a-z A-Z)
ROT=1 python3 $I/estado-1p.py $Sr > $O/$RO-tab-estado-1p.txt 2>&1
ROT=1 python3 $I/roteiro.py $Sr $D $P tab-pai palco S1 S1_aviso S1e S1f S2e reordenar picker folha dialogo S4 > $O/$RO-tab-pai.txt 2>&1
ROT=0 python3 $I/roteiro.py $Sr $D $P tab-ret palco S2e picker S4 > $O/$RO-tab-ret.txt 2>&1
echo "$(date +%T) cadeia $RO tab feita"
