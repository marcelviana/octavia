#!/bin/sh
# N4-PR7 — a L no Tab (paisagem user_rotation=1, retrato 0), mock na $PORTA
I=$W/inst-pr7; Sr=RX2N8000F3D; D=$W/run-lib/dumps; O=$W/run-lib/roteiros
tun() { for p_ in 8081 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done; ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:8788 tcp:$PORTA >/dev/null; }
python3 -c "import sys; sys.path.insert(0,'$I'); import roteiro as R; R.mock('normal')"
E="base rolagem filtros busca teclado tocar favoritando falhou falhaCache arquivos semRede semCache"
tun; PREFIXO=N4P7L ROT=1 python3 $I/biblioteca.py $I $Sr $D tab-pai $E > $O/tab-pai.txt 2>&1
tun; PREFIXO=N4P7L ROT=0 python3 $I/biblioteca.py $I $Sr $D tab-ret $E > $O/tab-ret.txt 2>&1
echo "$(date +%T) cadeia-lib tab feita"
