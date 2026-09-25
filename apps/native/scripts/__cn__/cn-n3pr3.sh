#!/bin/sh
# CN — as duas saídas do (e) do G-N3 (N3-PR3; decisão do Marcel, 2026-09-25).
# Instrumento DE MÃO, pela razão do `cn-w4b1.sh`: fabrica cópias adulteradas
# num diretório descartável; o que entra no repositório é a SAÍDA dele, em
# `docs/native/N3-PR3-anexos/`.
#
# Uso (da RAIZ do repositório): sh apps/native/scripts/__cn__/cn-n3pr3.sh
#
# Par de referência: `N3P3-S2-com-edicao-tab-ret` (S2e em B) contra a
# `B5-S2-com-edicao-tab-pai`, com o dump rolado `…-com-edicao-rolada-tab-ret`.
# Nele o (e) cru é 4: "Adicionar música" e "Apagar setlist" (rótulos curtos,
# N3-D17) e "8" e "Oitava do ensaio" (a linha 8 abaixo da dobra).
#
# nome-acessível:
#   CP-A1  os dois rótulos da N3-D17, dump real                  → exit 0, nome-acessível=2
#   CN-A2  o content-desc de `picker-abrir` trocado ("Adicionar") → exit 1 ("Adicionar música" é (e))
#   CN-A3  o rótulo curto de `picker-abrir` apagado (texto cortado para fora do
#          dump; o content-desc continua o longo)                   → exit 1
# rolagem:
#   CP-R1  o dump rolado real                                    → exit 0, rolagem=2
#   CN-R2  sem --rolada                                          → exit 1 ("8" e "Oitava do ensaio" são (e))
#   CN-R3  o rolado SEM a linha 8 (os dois textos apagados)      → exit 1
#   (o gate pareia o rolado pelo NOME, que é afirmação — caso 23: que o rolado
#   é do MESMO estado se prova no roteiro e no próprio dump, não aqui; ver o
#   `removendo-rolada` refeito da N3-PR3, `N3-PR3-anexos/README.md`)
# o conjunto:
#   CP-G1  os 16 pares de retrato da N3-PR3 com --rolada          → exit 0, "(e)=0 · nome-acessível=28 · rolagem=18"
#   CN-G2  os mesmos sem --rolada                                 → exit 1
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
A=docs/native/N3-PR3-anexos
B5=docs/native/N3-PRECHECK-anexos/B5-baseline
G=apps/native/scripts/g-n3.mjs
FALHOU=0
confere() {  # confere <nome> <exit-esperado> <exit-obtido>
  if [ "$2" = "$3" ]; then echo "  $1: exit $3 ✓"; else echo "  $1: exit $3, esperado $2 ✗"; FALHOU=1; fi
}
contem() {  # contem <nome> <arquivo> <texto>
  if grep -qF -- "$3" "$2"; then echo "  $1: \"$3\" ✓"; else echo "  $1: sem \"$3\" ✗"; FALHOU=1; fi
}
mostra() { grep -E '^\(e\)|^NOME|^ROLAGEM|^G-N3:|^  N3P3.*(—|→)' "$1" | sed 's/^/      /'; }

P=N3P3-S2-com-edicao-tab-ret
mkdir -p "$TMP/f" "$TMP/r"
cp "$A/dumps-ret/$P.xml" "$TMP/f/"
cp "$A/dumps-ret/N3P3-S2-com-edicao-rolada-tab-ret.xml" "$TMP/r/"

echo "== nome-acessível"
node $G --pai $B5 --faixa "$TMP/f" --rolada "$TMP/r" > "$TMP/o" 2>&1; confere CP-A1 0 $?
contem CP-A1 "$TMP/o" "nome-acessível=2"; mostra "$TMP/o"

mkdir -p "$TMP/a2"; sed 's/content-desc="Adicionar música"/content-desc="Adicionar"/' "$TMP/f/$P.xml" > "$TMP/a2/$P.xml"
node $G --pai $B5 --faixa "$TMP/a2" --rolada "$TMP/r" > "$TMP/o" 2>&1; confere CN-A2 1 $?
contem CN-A2 "$TMP/o" '"Adicionar música"'; mostra "$TMP/o"

mkdir -p "$TMP/a3"; sed 's/text="Adicionar" /text="" /' "$TMP/f/$P.xml" > "$TMP/a3/$P.xml"
node $G --pai $B5 --faixa "$TMP/a3" --rolada "$TMP/r" > "$TMP/o" 2>&1; confere CN-A3 1 $?
contem CN-A3 "$TMP/o" '"Adicionar música"'; mostra "$TMP/o"

echo "== rolagem"
node $G --pai $B5 --faixa "$TMP/f" --rolada "$TMP/r" > "$TMP/o" 2>&1; confere CP-R1 0 $?
contem CP-R1 "$TMP/o" "rolagem=2"

node $G --pai $B5 --faixa "$TMP/f" > "$TMP/o" 2>&1; confere CN-R2 1 $?
contem CN-R2 "$TMP/o" '"Oitava do ensaio"'; mostra "$TMP/o"

mkdir -p "$TMP/r3"; sed -e 's/text="Oitava do ensaio"/text=""/' -e 's/text="8" /text="" /' \
  "$TMP/r/N3P3-S2-com-edicao-rolada-tab-ret.xml" > "$TMP/r3/N3P3-S2-com-edicao-rolada-tab-ret.xml"
node $G --pai $B5 --faixa "$TMP/f" --rolada "$TMP/r3" > "$TMP/o" 2>&1; confere CN-R3 1 $?
contem CN-R3 "$TMP/o" '"Oitava do ensaio"'; mostra "$TMP/o"

echo "== o conjunto da N3-PR3"
node $G --pai $B5 --pai "$A/dumps-pai" --faixa "$A/dumps-ret" --rolada "$A/dumps-ret" > "$TMP/o" 2>&1; confere CP-G1 0 $?
contem CP-G1 "$TMP/o" "(e)=0 · nome-acessível=28 · rolagem=18"; grep '^G-N3' "$TMP/o" | sed 's/^/      /'
node $G --pai $B5 --pai "$A/dumps-pai" --faixa "$A/dumps-ret" > "$TMP/o" 2>&1; confere CN-G2 1 $?
grep '^G-N3:' "$TMP/o" | sed 's/^/      /'

echo ""
if [ $FALHOU -eq 0 ]; then echo "cn-n3pr3: todos os controles como esperado ✓"; else echo "cn-n3pr3: CONTROLE FORA DO ESPERADO ✗"; exit 1; fi
