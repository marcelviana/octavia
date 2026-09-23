#!/bin/sh
# div. 333 no aparelho: <serial> <prefixo> <tab|avd>
S=$(dirname $0); D=$1; P=$2; W=$3; LOG=$S/log/$W-333.txt
marca() { N0=$(wc -l < $LOG); }
novas() { sleep ${1:-3}; tail -n +$((N0+1)) $LOG | grep "OCTAVIA:" | sed 's/.*OCTAVIA: /    log: /' | grep -v "auth refresh"; }
toca() { R=$($S/toque.sh $D $1) || { echo "  ABORTA: sem $1"; exit 1; }; echo "  $R"; }
IDS='^(criar-setlist|setlist-|aviso)'
echo "== apagar com 200 e releitura 500 (mock delete-releitura-500)"
toca setlist-aaaaaaaa; sleep 1.5; toca setlist-apagar; sleep 1.2
marca; toca apagar-confirmar; novas 3
echo "  [dump $P-19-s1-apagada-nao-relida]"; $S/dump.sh $D $P-19-s1-apagada-nao-relida --todos | grep -E "$IDS" | sed 's/^/    /'
python3 $S/textos.py $S/dumps/$P-19-s1-apagada-nao-relida.xml aviso-motivo | sed 's/^/    /'
python3 $S/textos.py $S/dumps/$P-19-s1-apagada-nao-relida.xml aviso-acao | sed 's/^/    /'
echo "== o servidor sem ela e a leitura de pé (mock escrita, a setlist fora do arquivo)"
$S/mock-data.sh escrita "s[:]=[x for x in s if not x['id'].startswith('aaaaaaaa')]" | sed 's/^/    /'
marca; toca aviso-acao; novas 3
echo "  [dump $P-20-s1-apagada-relida]"; $S/dump.sh $D $P-20-s1-apagada-relida --todos | grep -E "$IDS" | sed 's/^/    /'
python3 $S/textos.py $S/dumps/$P-20-s1-apagada-relida.xml aviso-motivo | sed 's/^/    /'
python3 $S/textos.py $S/dumps/$P-20-s1-apagada-relida.xml setlist-aaaaaaaa | sed 's/^/    /'
