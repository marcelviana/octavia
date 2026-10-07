#!/bin/sh
# N4-PR8 — V no Tab, nas duas orientações (paisagem user_rotation=1, retrato 0); o mock do Tab na 8789 (no aparelho, 8788)
I=$W/inst-pr8; Sr=RX2N8000F3D; D=$W/run-v/dumps; O=$W/run-v/roteiros; mkdir -p $D $O; export SCR=$W/visualizacao-tab PORTA=8789
tun() { A=~/Library/Android/sdk/platform-tools/adb; $A -s $Sr reverse tcp:8081 tcp:8081 >/dev/null; $A -s $Sr reverse tcp:8790 tcp:8790 >/dev/null; $A -s $Sr reverse tcp:8788 tcp:8789 >/dev/null; }
python3 -c "import sys; sys.path.insert(0,'$I'); import roteiro as R; R.mock('normal')"
E="letra cifra cifraSecoes tab partitura camposVazios semArtista tituloLongo tipoDesconhecido corpoVazio formato baixando naoBaixado falhou favoritando falhouFav semRede sairNoMeio tocar voltar"
tun; PREFIXO=N4P8V ROT=1 python3 $I/visualizacao.py $I $Sr $D tab-pai $E gpar > $O/tab-pai.txt 2>&1
tun; PREFIXO=N4P8V ROT=0 python3 $I/visualizacao.py $I $Sr $D tab-ret $E > $O/tab-ret.txt 2>&1
echo "$(date +%T) cadeia-v tab feita"
