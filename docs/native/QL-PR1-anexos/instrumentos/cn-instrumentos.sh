#!/bin/sh
# CN dos três instrumentos que leem o nó `corpo` (QL-PR1; QL-D16; A-QL-5) — instrumento DE MÃO, como o
# `cn-n3pr3.sh`: fabrica dumps num diretório descartável e roda o gate; o que entra no repositório é a SAÍDA.
#
# O par: a paisagem da base congelada `REF-S3-S3a-letra-1a-avd-pai` (o corpo com o texto lógico, a Letra da fixture de
# 110 colunas, 49 linhas) e a faixa `N4P9F-S3-S3a-letra-1a-avd-ret` (o palco em pé, N4-PR9). A faixa tem o corpo
# trocado pela quebra de laboratório em 48 colunas (`dump-quebrado.ts`, `quebra-lab.ts`).
#
#   G-N3 (o (e) pelo texto lógico) e corpo-logico.mjs (len + sha12 pelo texto lógico):
#   CP-0  a faixa como está (a `main`: sem quebra)            → G-N3 exit 0, (e)=0 · quebra=0 · corpo-logico ✓ 0 continuações
#   CP-1  o corpo quebrado em 48, num nó                       → G-N3 exit 0, (e)=0 · quebra=1 · corpo-logico ✓ = referência
#   CP-2  o corpo quebrado em 48, um TextView por linha        → G-N3 exit 0, quebra=1 · corpo-logico ✓
#   CN-3  a quebra com uma letra trocada (LAB_DEFEITO=letra)   → G-N3 exit 1, (e)=1 (o corpo) · corpo-logico ✗ exit 1
#   CN-4  a quebra com uma palavra a menos (=palavra)          → G-N3 exit 1, (e)=1 · corpo-logico ✗ exit 1
#   CN-5  a quebra com duas linhas fora de ordem (=ordem)      → G-N3 exit 1, (e)=1 · corpo-logico ✗ exit 1
#   CN-6  o G-N3 de ANTES (o `g-n3.mjs` da base) sobre o CP-1  → exit 1, (e)=1: o instrumento velho via a quebra válida
#         como texto que some — é o que a QL-D16 conserta
#
# Uso (da RAIZ do repositório): sh docs/native/QL-PR1-anexos/instrumentos/cn-instrumentos.sh [<base>]   (base: origin/main)
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
BASE=${1:-origin/main}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
I=docs/native/QL-PR1-anexos/instrumentos
PAI=docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem
FX=docs/native/N4-PR9-anexos/dumps-g-inv/N4P9F-S3-S3a-letra-1a-avd-ret.xml
NOME=$(basename "$FX")
G=apps/native/scripts/g-n3.mjs
C=apps/native/scripts/corpo-logico.mjs
FALHOU=0
confere() { if [ "$2" = "$3" ]; then echo "  $1: exit $3 ✓"; else echo "  $1: exit $3, esperado $2 ✗"; FALHOU=1; fi; }
contem() { if grep -qF -- "$3" "$2"; then echo "  $1: \"$3\" ✓"; else echo "  $1: sem \"$3\" ✗"; FALHOU=1; fi; }
mostra() { grep -E '^\(e\)|^QUEBRA|^  N4P9F|^G-N3:|^corpo|^referência' "$1" | sed 's/^/      /'; }
caso() {  # caso <nome> <dir> <exit G-N3> <texto no G-N3> <exit corpo-logico>
  node $G --pai $PAI --faixa "$2" > "$TMP/o" 2>&1; confere "$1 G-N3" "$3" $?; contem "$1 G-N3" "$TMP/o" "$4"; mostra "$TMP/o"
  node $C "$2/$NOME" --referencia "$TMP/ref.txt" > "$TMP/o" 2>&1; confere "$1 corpo-logico" "$5" $?; mostra "$TMP/o"
}
fabrica() {  # fabrica <dir> [LAB_DEFEITO] [--multi]
  mkdir -p "$1"
  LAB_DEFEITO=$2 pnpm exec tsx $I/dump-quebrado.ts $PAI/REF-S3-S3a-letra-1a-avd-pai.xml "$FX" "$1/$NOME" 48 $3 --referencia "$TMP/ref.txt" | sed 's/^/      /'
}

mkdir -p "$TMP/cp0"; cp "$FX" "$TMP/cp0/"
fabrica "$TMP/cp1" ""
echo "== CP-0 a faixa como está (sem quebra)";       caso CP-0 "$TMP/cp0" 0 '(e)=0 · (b)=0 · nome-acessível=0 · rolagem=0 · quebra=0' 0
echo "== CP-1 o corpo quebrado em 48, num nó";        caso CP-1 "$TMP/cp1" 0 'quebra=1' 0
echo "== CP-2 o corpo quebrado em 48, um nó por linha"; fabrica "$TMP/cp2" "" --multi; caso CP-2 "$TMP/cp2" 0 'quebra=1' 0
echo "== CN-3 uma letra trocada";     fabrica "$TMP/cn3" letra;   caso CN-3 "$TMP/cn3" 1 '(e) TEXTO QUE SOME — REPROVA: 1' 1
echo "== CN-4 uma palavra a menos";   fabrica "$TMP/cn4" palavra; caso CN-4 "$TMP/cn4" 1 '(e) TEXTO QUE SOME — REPROVA: 1' 1
echo "== CN-5 linhas fora de ordem";  fabrica "$TMP/cn5" ordem;   caso CN-5 "$TMP/cn5" 1 '(e) TEXTO QUE SOME — REPROVA: 1' 1
echo "== CN-6 o G-N3 de antes ($BASE) sobre o CP-1"
git show "$BASE:$G" > "$TMP/g-n3-antes.mjs"
node "$TMP/g-n3-antes.mjs" --pai $PAI --faixa "$TMP/cp1" > "$TMP/o" 2>&1; confere CN-6 1 $?; contem CN-6 "$TMP/o" '(e) TEXTO QUE SOME — REPROVA: 1'; mostra "$TMP/o"
echo ""
[ $FALHOU -eq 0 ] && echo "cn-instrumentos: todos os controles como esperado ✓" || { echo "cn-instrumentos: ✗"; exit 1; }
