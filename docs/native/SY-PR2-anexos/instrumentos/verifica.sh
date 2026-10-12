#!/bin/sh
# SY-PR2 — a verificação (cópia da `SY-PR1-anexos/instrumentos/verifica.sh`, só os nomes) de um commit (instrumento de anexo, fora de CI, N4-D117). Da RAIZ da árvore:
#   sh docs/native/SY-PR2-anexos/instrumentos/verifica.sh <base> <corpo-da-pr.md> [--sem-suite]
# Roda: o extrator do bloco ```gates sobre o corpo; G1 e G2/G3 contra <base> com a árvore de trabalho; o `tsc` de dentro
# de cada pacote (div. 1187); o lint; e a suíte (as linhas de resumo). Imprime cada comando antes da saída.
BASE=$1; CORPO=$2; DECL=${TMPDIR:-/tmp}/sy-pr2-decl.$$
[ -n "$BASE" ] && [ -r "$CORPO" ] || { echo "uso: verifica.sh <base> <corpo.md> [--sem-suite]" >&2; exit 2; }
echo "# árvore $(git rev-parse HEAD) · base $(git rev-parse "$BASE") · $(date '+%Y-%m-%d %H:%M:%S %z')"
echo "\$ git status --short"; git status --short
echo "\$ sh apps/native/scripts/gates-decl.sh < <corpo>"; sh apps/native/scripts/gates-decl.sh < "$CORPO" > "$DECL"; echo "exit=$?"; sed 's/^/  /' "$DECL"
echo "\$ GATES_DECL=<decl> sh apps/native/scripts/g1.sh $BASE WORKTREE"; GATES_DECL=$DECL sh apps/native/scripts/g1.sh "$BASE" WORKTREE; echo "exit=$?"
echo "\$ GATES_DECL=<decl> sh apps/native/scripts/g2g3.sh $BASE WORKTREE"; GATES_DECL=$DECL sh apps/native/scripts/g2g3.sh "$BASE" WORKTREE; echo "exit=$?"
for d in . packages/core packages/identidade apps/native; do
  echo "\$ (cd $d && npx tsc --noEmit)"; (cd "$d" && npx tsc --noEmit); echo "exit=$?"
done
echo "\$ pnpm lint"; pnpm lint > "$DECL.lint" 2>&1; e=$?; tail -2 "$DECL.lint"; echo "exit=$e"
if [ "$3" != "--sem-suite" ]; then
  echo "\$ pnpm test  (as linhas de resumo)"; pnpm test > "$DECL.suite" 2>&1; e=$?
  sed 's/\x1b\[[0-9;]*m//g' "$DECL.suite" | grep -E '^ *(Test Files|Tests|Duration) '; echo "exit=$e"
  echo "# os juízes dos cinco gates do SY (a linha do veredito de cada um; SY-PR2: acrescentado à cópia)"
  sed 's/\x1b\[[0-9;]*m//g' "$DECL.suite" | grep -E '^gate (i|ii|iii|iv|v):'
fi
rm -f "$DECL" "$DECL.suite" "$DECL.lint"
