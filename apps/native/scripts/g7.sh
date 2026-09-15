#!/bin/sh
# G7 — INTEGRIDADE (W1, `W1-PRECHECK.md` §5). O gate que dá nome à PR.
#
# O que ele afirma: **existir é estar completo**. Um arquivo de 0 byte, um
# truncado e um `.part` sobrando de um download morto não podem ser contados
# por `hasFile`, `listFiles`, `presentUrls` nem `offlineStatus`.
#
# Uso (da RAIZ do repositório):
#   sh apps/native/scripts/g7.sh WORKTREE    → tem de PASSAR depois do conserto
#   sh apps/native/scripts/g7.sh <ref>       → CONTROLE NEGATIVO: põe o
#       `files.ts` e o `prefetch.ts` daquele ref no lugar, roda, e restaura.
#       Com `f79a4b7` (a base desta PR) ele tem de REPROVAR.
#
# Por que o controle negativo troca o ARQUIVO e não faz checkout da árvore:
# os testes são de agora (o commit 1 os escreveu); o que se quer medir é o
# comportamento de ONTEM contra as asserções de hoje. Trocar a árvore inteira
# levaria os testes junto e não mediria nada.
set -e
REF=${1:-WORKTREE}
ALVOS="apps/native/src/files.ts apps/native/src/prefetch.ts"

if [ "$REF" = "WORKTREE" ]; then
  echo "G7 — integridade sobre a ÁRVORE DE TRABALHO"
  pnpm exec vitest run --project native
  echo "G7: PASSOU ✓"
  exit 0
fi

echo "G7 — CONTROLE NEGATIVO com $ALVOS de $REF"
GUARDA=$(mktemp -d)
for f in $ALVOS; do cp "$f" "$GUARDA/$(basename "$f")"; done
restaurar() {
  for f in $ALVOS; do cp "$GUARDA/$(basename "$f")" "$f"; done
  rm -rf "$GUARDA"
}
trap restaurar EXIT INT TERM
for f in $ALVOS; do git show "$REF:$f" > "$f"; done

if pnpm exec vitest run --project native > "$GUARDA/saida.txt" 2>&1; then
  sed 's/^/    /' "$GUARDA/saida.txt"
  echo "G7: o código de $REF PASSOU no gate — o gate não mede nada ✗"
  exit 1
else
  grep -E '×|✓|Tests |Test Files |FAIL|Error:' "$GUARDA/saida.txt" | sed 's/^/    /'
  echo "G7: o código de $REF REPROVA, como tem de reprovar ✓"
  exit 0
fi
