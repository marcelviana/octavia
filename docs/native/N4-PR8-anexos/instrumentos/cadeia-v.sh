#!/bin/sh
# N4-PR8 — V num aparelho, nas duas orientações: cadeia-v.sh <serial> <ap> <ROT_PAI> <ROT_RET>   (W, ARVORE no ambiente)
# a fixture da visualização (SCR=$W/visualizacao), o servidor de arquivos lento (`arquivos-lentos.py`) já na 8790
I=$W/inst-pr8; Sr=$1; AP=$2; D=$W/run-v/dumps; O=$W/run-v/roteiros; mkdir -p $D $O; export SCR=$W/visualizacao
tun() { for p_ in 8081 8788 8790; do ~/Library/Android/sdk/platform-tools/adb -s $Sr reverse tcp:$p_ tcp:$p_ >/dev/null; done; }
python3 -c "import sys; sys.path.insert(0,'$I'); import roteiro as R; R.mock('normal')"
E="letra cifra cifraSecoes tab partitura camposVazios semArtista tituloLongo tipoDesconhecido corpoVazio formato baixando naoBaixado falhou favoritando falhouFav semRede sairNoMeio tocar voltar"
tun; PREFIXO=N4P8V ROT=$3 python3 $I/visualizacao.py $I $Sr $D $AP-pai $E gpar > $O/$AP-pai.txt 2>&1
tun; PREFIXO=N4P8V ROT=$4 python3 $I/visualizacao.py $I $Sr $D $AP-ret $E > $O/$AP-ret.txt 2>&1
echo "$(date +%T) cadeia-v $AP feita"
