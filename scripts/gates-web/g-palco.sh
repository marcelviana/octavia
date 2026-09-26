#!/bin/sh
# G-palco (I1-PR3, commit 1) — o corte do palco, do PWA/offline e das quatro
# páginas não volta. Embrião do G-palco da I1-D13; a PR-5 o liga ao CI
# (gates-web.yml). Aqui ele NÃO está em workflow nenhum.
#
# Fonte única: docs/ux/I1-PR3-anexos/lista-do-corte.txt (a lista fechada do
# commit 1). O script não tem lista própria — quem muda o escopo muda a lista.
#
# Reprova (exit 1) se, na árvore de trabalho:
#   MORRE   o caminho existir, ou for importado por qualquer arquivo rastreado
#           (import/export from, import(), require(), vi.mock/doMock), com o
#           alias `@/` e caminhos relativos resolvidos;
#   SIMBOLO a regex (perl, multilinha) casar no arquivo indicado;
#   TEXTO   a regex (ERE, git grep) casar em arquivo rastreado do pathspec.
# Fora do alcance: docs/ (registro histórico), apps/, packages/, e os próprios
# arquivos da lista MORRE (esses já reprovam por existir).
#
# Uso: sh scripts/gates-web/g-palco.sh [lista]   (da raiz do repositório)
set -eu

LISTA=${1:-docs/ux/I1-PR3-anexos/lista-do-corte.txt}
[ -f "$LISTA" ] || { echo "G-palco: lista não encontrada: $LISTA" >&2; exit 2; }

TMP=$(mktemp -t g-palco)
trap 'rm -f "$TMP" "$TMP.simb" "$TMP.txt"' EXIT
TAB=$(printf '\t')
falhas=0
morre=$(grep "^MORRE$TAB" "$LISTA" | cut -f3)

echo "G-palco — lista: $LISTA"
echo "MORRE: $(printf '%s\n' "$morre" | grep -c .) caminhos · SIMBOLO: $(grep -c "^SIMBOLO$TAB" "$LISTA") · TEXTO: $(grep -c "^TEXTO$TAB" "$LISTA")"
echo

# 1. existência
echo "## 1. MORRE — o arquivo existe"
n=0
for p in $morre; do
  if [ -e "$p" ]; then echo "  ✗ existe: $p"; n=$((n + 1)); fi
done
[ "$n" -eq 0 ] && echo "  ✓ nenhum"
falhas=$((falhas + n))

# 2. importação (node resolve alias e relativos)
echo "## 2. MORRE — o arquivo é importado"
imp=$(git ls-files -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs' \
      ':!docs/**' ':!apps/**' ':!packages/**' ':!node_modules/**' \
  | MORRE="$morre" node "$(dirname "$0")/g-palco-imports.mjs")
if [ -n "$imp" ]; then
  printf '%s\n' "$imp"
  falhas=$((falhas + $(printf '%s\n' "$imp" | grep -c .)))
else
  echo "  ✓ nenhum"
fi

# 3. SIMBOLO
echo "## 3. SIMBOLO — símbolo morto dentro de arquivo que fica"
n=0
grep "^SIMBOLO$TAB" "$LISTA" | while IFS="$TAB" read -r _ grupo arq re; do
  [ -f "$arq" ] || continue
  if RE="$re" perl -0777 -ne 'exit(/$ENV{RE}/m ? 0 : 1)' "$arq"; then
    ln=$(RE="$re" perl -0777 -ne 'if (/$ENV{RE}/m) { print 1 + (substr($_, 0, $-[0]) =~ tr/\n//) }' "$arq")
    echo "  ✗ [$grupo] $arq:$ln casa /$re/"
  fi
done > "$TMP.simb" || true
if [ -s "$TMP.simb" ]; then
  cat "$TMP.simb"; n=$(grep -c . "$TMP.simb")
else
  echo "  ✓ nenhum"
fi
rm -f "$TMP.simb"
falhas=$((falhas + n))

# 4. TEXTO (os próprios arquivos MORRE ficam fora: já reprovam por existir)
echo "## 4. TEXTO — referência a rota/arquivo morto"
n=0
excl=$(for p in $morre; do printf " :(exclude)%s" "$p"; done)
grep "^TEXTO$TAB" "$LISTA" | while IFS="$TAB" read -r _ grupo spec re; do
  # shellcheck disable=SC2086
  git grep -nE -e "$re" -- $spec ':!docs/**' $excl 2>/dev/null \
    | while IFS= read -r l; do printf '  ✗ [%s] /%s/  %s\n' "$grupo" "$re" "$l"; done || true
done > "$TMP.txt" || true
if [ -s "$TMP.txt" ]; then
  cat "$TMP.txt"; n=$(grep -c . "$TMP.txt")
else
  echo "  ✓ nenhum"
fi
rm -f "$TMP.txt"
falhas=$((falhas + n))

echo
if [ "$falhas" -gt 0 ]; then
  echo "G-palco: REPROVA — $falhas ocorrência(s)"
  exit 1
fi
echo "G-palco: PASSA — 0 ocorrências"
