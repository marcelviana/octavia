#!/bin/sh
# G2 — testIDs: antes ⊆ depois.   G3 — linhas `log(` idênticas por arquivo.
# Uso (da RAIZ do repositório): sh apps/native/scripts/g2g3.sh <ref-antes> <ref-depois-ou-WORKTREE>
#
# Versionado na V1-PR3 (commit 5) a partir do `V1-PR1-anexos/V1-PR1-B-gates.txt`,
# com a correção da divergência 30: o ramo de ref-git varria TODOS os arquivos
# sob apps/native/src (inclusive src/fixtures/aceite.py) e o ramo WORKTREE só
# *.ts/*.tsx — assimetria que dá falso positivo no G3 com o .ts idêntico dos
# dois lados quando um não-ts contém a subcadeia `log(`. Agora os dois ramos
# têm o mesmo recorte: `grep -E '\.tsx?$'` na lista do ref-git.
A=$1; B=$2
tmp=$(mktemp -d)
coleta() {
  if [ "$1" = "WORKTREE" ]; then
    for f in $(find apps/native/src -name '*.ts' -o -name '*.tsx' | sort); do
      grep -o 'testID="[^"]*"' "$f" 2>/dev/null | sed "s|^|$f\t|"
      grep -oE 'testID=\{`[^`]*`\}' "$f" 2>/dev/null | sed "s|^|$f\t|"
    done | sort -u > "$2"
    for f in $(find apps/native/src packages/core/src -name '*.ts' -o -name '*.tsx' | sort); do
      grep -n 'log(' "$f" 2>/dev/null | sed 's/^[0-9]*://' | sed 's/^ *//' | sed "s|^|$f\t|"
    done | sort > "$3"
  else
    for f in $(git ls-tree -r --name-only "$1" -- apps/native/src | grep -E '\.tsx?$' | sort); do
      git show "$1:$f" 2>/dev/null | grep -o 'testID="[^"]*"' | sed "s|^|$f\t|"
      git show "$1:$f" 2>/dev/null | grep -oE 'testID=\{`[^`]*`\}' | sed "s|^|$f\t|"
    done | sort -u > "$2"
    for f in $(git ls-tree -r --name-only "$1" -- apps/native/src packages/core/src | grep -E '\.tsx?$' | sort); do
      git show "$1:$f" 2>/dev/null | grep 'log(' | sed 's/^ *//' | sed "s|^|$f\t|"
    done | sort > "$3"
  fi
}
coleta "$A" $tmp/a.ids $tmp/a.log
coleta "$B" $tmp/b.ids $tmp/b.log
echo "G2 — testIDs  antes=$(wc -l < $tmp/a.ids | tr -d ' ')  depois=$(wc -l < $tmp/b.ids | tr -d ' ')"
SUMIU=$(comm -23 $tmp/a.ids $tmp/b.ids)
if [ -z "$SUMIU" ]; then echo "  G2: antes ⊆ depois ✓"; G2=0
else echo "  G2: testID SUMIU ✗"; echo "$SUMIU" | sed 's/^/      /'; G2=1; fi
NOVO=$(comm -13 $tmp/a.ids $tmp/b.ids)
[ -n "$NOVO" ] && { echo "  testID NOVOS:"; echo "$NOVO" | sed 's/^/      /'; }
echo "G3 — linhas log( antes=$(wc -l < $tmp/a.log | tr -d ' ')  depois=$(wc -l < $tmp/b.log | tr -d ' ')"
DIF=$(diff $tmp/a.log $tmp/b.log)
if [ -z "$DIF" ]; then echo "  G3: idênticas ✓"; G3=0
else echo "  G3: DIVERGEM ✗"; echo "$DIF" | head -12 | sed 's/^/      /'; G3=1; fi
rm -rf $tmp
[ $G2 -eq 0 ] && [ $G3 -eq 0 ]
