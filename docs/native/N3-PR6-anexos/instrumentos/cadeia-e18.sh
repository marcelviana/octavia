#!/bin/sh
# N3-PR6 — depois do conserto (017570c): o picker nas duas orientações, e a passada final do G-inv.
# cadeia-e18.sh <serial> <ap> <ROT_PAI> <ROT_RET> <etapas...>   (SCR e PORTA do ambiente)
I=$(dirname "$0"); S=$1; AP=$2; RP=$3; RR=$4; shift 4; O=$SCR/../roteiros; D=$SCR/../dumps-e18
P="pSemRede pSalvo pFalhou pLimite pCem"
for e in "$@"; do
  case $e in
    pk)
      ROT=$RP python3 $I/roteiro.py $S $D N3P6 $AP-pai picker > $O/e18-$AP-pai-roteiro.txt 2>&1
      ROT=$RP python3 $I/n3pr5.py $I $S $D $AP-pai pickerRelendo > $O/e18-$AP-pai-n3pr5.txt 2>&1
      ROT=$RP python3 $I/n3pr6.py $I $S $D $AP-pai $P > $O/e18-$AP-pai-x.txt 2>&1
      ROT=$RR python3 $I/roteiro.py $S $D N3P6 $AP-ret picker > $O/e18-$AP-ret-roteiro.txt 2>&1
      ROT=$RR python3 $I/n3pr5.py $I $S $D $AP-ret pickerRelendo > $O/e18-$AP-ret-n3pr5.txt 2>&1
      ROT=$RR python3 $I/n3pr6.py $I $S $D $AP-ret $P > $O/e18-$AP-ret-x.txt 2>&1 ;;
    fin_tab) ROT=$RP python3 $I/roteiro.py $S $SCR/../dumps-final2 N3P6F $AP-pai palco S1 S1_aviso S1e S1f S2e reordenar picker folha dialogo S4 > $O/final2-$AP-pai.txt 2>&1 ;;
    fin_avd)
      ROT=$RP python3 $I/roteiro.py $S $SCR/../dumps-final2 N3P6F $AP-pai palco S1f S2e reordenar picker folha dialogo S4 > $O/final2-$AP-pai.txt 2>&1
      ROT=$RP python3 $I/passada4-final.py $I $S $SCR/../dumps-final2 $AP-pai > $O/final2-$AP-pai-s1.txt 2>&1
      PREFIXO=N3P6F ROT=$RP python3 $I/n3pr6.py $I $S $SCR/../dumps-final2 $AP-pai S0frio > $O/final2-$AP-pai-s0.txt 2>&1 ;;
  esac
  echo "$(date +%T) etapa $e feita" >> $O/cadeia-e18-$AP.txt
done
