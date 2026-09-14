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
# G3 — W1: de "idênticas" para "antes ⊆ depois, com ERRATA DECLARADA".
#
# Por que ele muda de forma: até aqui nenhuma PR precisava acrescentar linha de
# log, e "idênticas" era a afirmação certa. Esta PR existe **justamente** para
# acrescentar linhas que faltavam (div. 114: o `download-error` existia em UM
# lugar no app inteiro) e para mudar uma que dizia menos do que precisa dizer.
# Então o gate passa a exigir duas coisas, e a segunda é a que importa:
#
#   1. toda linha que SUMIU tem de estar na lista de erratas abaixo, com o
#      motivo — uma linha que some sem estar aqui é contrato quebrado em
#      silêncio, e é exatamente o que um "⊆" cru deixaria passar;
#   2. as linhas NOVAS saem impressas, para entrar no commit e no catálogo.
#
# ERRATAS DECLARADAS (`W1-PRECHECK.md` §9.3; `LOGS-OCTAVIA.md`, errata W1):
#   • `file src=download … bytes=<n>` → ganha `total=<n|->` e `ms=<n>`. Sem a
#     taxa no log, "não abortou" não se separa em "a rede estava sã" e "o teto
#     não funciona", e o aceite W1-A2 vira impressão.
ERRATAS='file src=download name=${name} bytes=${bytes}`'
echo "G3 — linhas log( antes=$(wc -l < $tmp/a.log | tr -d ' ')  depois=$(wc -l < $tmp/b.log | tr -d ' ')"
SUMIRAM=$(comm -23 $tmp/a.log $tmp/b.log)
NOVAS=$(comm -13 $tmp/a.log $tmp/b.log)
G3=0
if [ -n "$SUMIRAM" ]; then
  echo "  linhas que SUMIRAM (cada uma tem de ser errata declarada):"
  echo "$SUMIRAM" | sed 's/^/      /'
  echo "$SUMIRAM" | while IFS= read -r L; do
    echo "$L" | grep -qF "$ERRATAS" || { echo "  G3: linha sumiu SEM ERRATA ✗"; exit 1; }
  done || G3=1
  [ $G3 -eq 0 ] && echo "  G3: as que sumiram estão na lista de erratas ✓"
else
  echo "  G3: nenhuma linha sumiu ✓"
fi
if [ -n "$NOVAS" ]; then echo "  linhas NOVAS (declarar no commit e no catálogo):"; echo "$NOVAS" | sed 's/^/      /'; fi
rm -rf $tmp
[ $G2 -eq 0 ] && [ $G3 -eq 0 ]
