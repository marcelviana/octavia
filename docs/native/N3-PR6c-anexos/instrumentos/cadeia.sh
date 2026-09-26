#!/bin/sh
# N3-PR6c — a cadeia de UM aparelho: cadeia.sh <serial> <ap> <ROT_PAI> <ROT_RET> <etapas...>   (SCR e PORTA do ambiente)
# etapas: n (S5 com N = 60, 19, 18, 8 nas duas orientações) · fin_tab / fin_avd (a passada final de paisagem do G-inv)
I=$(dirname "$0"); S=$1; AP=$2; RP=$3; RR=$4; shift 4; O=$SCR/../roteiros; D=$SCR/../dumps
for e in "$@"; do
  case $e in
    n)
      ROT=$RP python3 $I/n3pr6c.py $I $S $D/n $AP-pai 60 19 18 8 > $O/n-$AP-pai.txt 2>&1
      ROT=$RR python3 $I/n3pr6c.py $I $S $D/n $AP-ret 60 19 18 8 > $O/n-$AP-ret.txt 2>&1 ;;
    fin_tab) ROT=$RP python3 $I/roteiro.py $S $D/final N3P6CF $AP-pai palco S1 S1_aviso S1e S1f S2e reordenar picker folha dialogo S4 > $O/final-$AP-pai.txt 2>&1 ;;
    fin_avd)
      ROT=$RP python3 $I/roteiro.py $S $D/final N3P6CF $AP-pai palco S1f S2e reordenar picker folha dialogo S4 > $O/final-$AP-pai.txt 2>&1
      ROT=$RP python3 $I/passada4-final.py $I $S $D/final $AP-pai > $O/final-$AP-pai-s1.txt 2>&1
      PREFIXO=N3P6CF ROT=$RP python3 $I/n3pr6.py $I $S $D/final $AP-pai S0frio > $O/final-$AP-pai-s0.txt 2>&1 ;;
  esac
  echo "$(date +%T) etapa $e feita" >> $O/cadeia-$AP.txt
done
