#!/bin/sh
# Os instrumentos do corpo (o (e) do G-N3 pelo texto lógico e o `corpo-logico.mjs`) sobre a quebra REAL (QL-PR2) —
# instrumento DE MÃO. O da PR-1 (`QL-PR1-anexos/instrumentos/cn-instrumentos.sh`) fabricou o corpo quebrado com a
# leitura de laboratório; aqui o `dump-quebrado.ts` da PR-1 é copiado para um diretório descartável com o import
# trocado para `packages/core/src/quebra.ts` — a função desta PR. Mesmo par de dumps:
#   paisagem `REF-S3-S3a-letra-1a-avd-pai` (a Letra da fixture de 110 colunas) × faixa `N4P9F-S3-S3a-letra-1a-avd-ret`.
#
#   CP-R48 · CP-R26  o corpo quebrado pela função real em 48 e 26, num nó            → G-N3 exit 0, quebra=1 · corpo-logico ✓
#   CP-R48m          o mesmo em 48, um TextView por linha                            → G-N3 exit 0, quebra=1 · corpo-logico ✓
#
# Uso (da RAIZ): sh docs/native/QL-PR2-anexos/instrumentos/cn-instrumentos-real.sh
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
TMP=$(mktemp -d "$RAIZ/.cn-real.XXXXXX")   # dentro da árvore para o import relativo resolver; apagado no fim
trap 'rm -rf "$TMP"' EXIT
PAI=docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem
FX=docs/native/N4-PR9-anexos/dumps-g-inv/N4P9F-S3-S3a-letra-1a-avd-ret.xml
NOME=$(basename "$FX")
G=apps/native/scripts/g-n3.mjs
C=apps/native/scripts/corpo-logico.mjs
sed "s#from './quebra-lab'#from '../packages/core/src/quebra'#" docs/native/QL-PR1-anexos/instrumentos/dump-quebrado.ts > "$TMP/dump-quebrado.ts"
grep -n "from '../packages/core/src/quebra'" "$TMP/dump-quebrado.ts" | sed 's/^/    import trocado: /'
FALHOU=0
confere() { if [ "$2" = "$3" ]; then echo "  $1: exit $3 ✓"; else echo "  $1: exit $3, esperado $2 ✗"; FALHOU=1; fi; }
mostra() { grep -E '^\(e\)|^QUEBRA|^  N4P9F|^G-N3:|^corpo|^referência|continua' "$1" | sed 's/^/      /'; }
caso() {  # caso <nome> <colunas> [--multi]
  mkdir -p "$TMP/$1"
  pnpm exec tsx "$TMP/dump-quebrado.ts" $PAI/REF-S3-S3a-letra-1a-avd-pai.xml "$FX" "$TMP/$1/$NOME" "$2" $3 --referencia "$TMP/ref.txt" | sed 's/^/      /'
  node $G --pai $PAI --faixa "$TMP/$1" > "$TMP/o" 2>&1; confere "$1 G-N3" 0 $?; mostra "$TMP/o"
  node $C "$TMP/$1/$NOME" --referencia "$TMP/ref.txt" > "$TMP/o" 2>&1; confere "$1 corpo-logico" 0 $?; mostra "$TMP/o"
}
echo "== CP-R48 a quebra real em 48, num nó";        caso CP-R48 48
echo "== CP-R26 a quebra real em 26, num nó";        caso CP-R26 26
echo "== CP-R48m a quebra real em 48, um nó por linha"; caso CP-R48m 48 --multi
echo ""
[ $FALHOU -eq 0 ] && echo "cn-instrumentos-real: todos como esperado ✓" || { echo "cn-instrumentos-real: ✗"; exit 1; }
