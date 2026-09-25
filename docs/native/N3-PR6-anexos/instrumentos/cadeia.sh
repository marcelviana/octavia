#!/bin/sh
# N3-PR6 — a cadeia de rodadas de UM aparelho: cadeia.sh <serial> <ap> <ROT_PAI> <ROT_RET> <etapas...>
# etapas: xpai (transversais em paisagem) · ret (retrato completo) · s0pai (S0 frio em paisagem)
# SCR e PORTA vêm do ambiente (um mock por aparelho).
I=$(dirname "$0"); S=$1; AP=$2; RP=$3; RR=$4; shift 4
O=$SCR/../roteiros; mkdir -p $O
X="s1SemRede s1Salvo s2SemRede s2Salvo s2Falhou s2Limite s2Cem rSemRede rFalhou rLimite fFalhou fLimite pSemRede pSalvo pFalhou pLimite pCem"
for e in "$@"; do
  case $e in
    xpai) ROT=$RP python3 $I/n3pr6.py $I $S $SCR/../dumps-x $AP-pai $X > $O/x-$AP-pai.txt 2>&1 ;;
    xret) ROT=$RR ROLAR=1 python3 $I/n3pr6.py $I $S $SCR/../dumps-x $AP-ret $X > $O/x-$AP-ret.txt 2>&1 ;;
    ret)
      ROT=$RR python3 $I/roteiro.py $S $SCR/../dumps-ret N3P6 $AP-ret palco S1 S1e S1f S2e picker S4 > $O/ret-$AP-roteiro.txt 2>&1
      ROT=$RR ROLAR=1 python3 $I/n3pr3.py $I $S $SCR/../dumps-ret $AP-ret S2e removendo removendoRolado > $O/ret-$AP-n3pr3.txt 2>&1
      ROT=$RR python3 $I/n3pr4.py $I $S $SCR/../dumps-ret $AP-ret reordenar arrastando salvando falhou descartado folhaCriar folhaValidacao folhaSalvando folhaFalhou editarIgual editarData dialogo apagando > $O/ret-$AP-n3pr4.txt 2>&1
      ROT=$RR ROT_PAI=$RP ROT_RET=$RR python3 $I/n3pr5.py $I $S $SCR/../dumps-ret $AP-ret pickerRelendo placeholder > $O/ret-$AP-n3pr5.txt 2>&1 ;;
    a14) ROT=$RP ROT_PAI=$RP ROT_RET=$RR python3 $I/n3pr5.py $I $S $SCR/../dumps-ret $AP-pai a14 > $O/a14-$AP.txt 2>&1 ;;
    s0pai) ROT=$RP python3 $I/n3pr6.py $I $S $SCR/../dumps-pai $AP-pai S0frio > $O/s0-$AP-pai.txt 2>&1 ;;
    s0ret) ROT=$RR python3 $I/n3pr6.py $I $S $SCR/../dumps-ret $AP-ret S0logout > $O/s0-$AP-ret.txt 2>&1 ;;
  esac
  echo "$(date +%T) etapa $e feita" >> $O/cadeia-$AP.txt
done
