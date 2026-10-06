#!/bin/sh
# N4-PR7 — a L num aparelho, nas duas orientações: cadeia-lib.sh <serial> <ap> <ROT_PAI> <ROT_RET> [PORTA]
I=$W/inst-pr7; Sr=$1; AP=$2; D=$W/run-lib/dumps; O=$W/run-lib/roteiros; mkdir -p $D $O
tun() { for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done; }
python3 -c "import sys; sys.path.insert(0,'$I'); import roteiro as R; R.mock('normal')"  # a fixture da L ($SCR/mock), não a da base
E="base rolagem filtros busca teclado tocar favoritando falhou falhaCache semRede semCache"
tun; PREFIXO=N4P7L ROT=$3 python3 $I/biblioteca.py $I $Sr $D $AP-pai $E > $O/$AP-pai.txt 2>&1
tun; PREFIXO=N4P7L ROT=$4 python3 $I/biblioteca.py $I $Sr $D $AP-ret $E > $O/$AP-ret.txt 2>&1
echo "$(date +%T) cadeia-lib $AP feita"
