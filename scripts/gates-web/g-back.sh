#!/bin/sh
# G-back (I1-PR5; I1-D13, I1-D20, I1-D21) — o backend do web não muda sem
# declaração. É o gate da I1-D9: fora da auth, o bloco não muda rota,
# contrato, validação nem fluxo.
#
# O NÚCLEO (o que o gate protege) =
#     o congelado `scripts/gates-web/g-back-nucleo.txt` (commitado)
#   ∪ a derivação do grafo no HEAD  (`g-back-derivar.mjs`)
#   ∪ a derivação do grafo na BASE
#   ∪ o próprio `g-back-nucleo.txt` (mudar o escopo se declara)
# A derivação dos dois lados é o mesmo mecanismo do `g1.sh` (a união BASE∪HEAD:
# um arquivo que só existe de um lado não fica invisível).
#
# REPROVA (exit 1) quando:
#   (i)   um arquivo do núcleo difere entre BASE e HEAD (conteúdo, criação ou
#         remoção) e não há linha `gback: <caminho> — <razão>` para ele;
#   (ii)  a derivação no HEAD traz ao núcleo um arquivo que NÃO está no
#         congelado e não está declarado (arquivo novo no alcance das rotas);
#   (iii) uma linha `gback:` aponta para arquivo que NÃO mudou entre BASE e
#         HEAD — declaração órfã (a regra da W4-b1: exceção que não é usada é
#         escopo mentido).
# Informa, sem reprovar: declaração de arquivo que mudou mas está fora do
# núcleo (registro, como o `tsconfig.json` da I1-PR5), e arquivo do congelado
# que a derivação do HEAD já não alcança (congelado a regenerar).
#
# As declarações vêm de GATES_WEB_DECL (arquivo gerado pelo
# `gates-web-decl.sh` a partir do corpo da PR). Sem a variável = nenhuma
# declaração.
#
# Uso (da RAIZ do repositório):  sh scripts/gates-web/g-back.sh <base> <head|WORKTREE>
# Como o g1.sh (W4-a, div. 187): sem os dois argumentos, ou com ref que não
# resolve, o gate RECUSA (exit 2) — gate diferencial sem par não mede nada.
set -u
BASE=${1:-}; HEAD=${2:-}
uso() {
  echo "g-back.sh: $1" >&2
  echo "uso: sh scripts/gates-web/g-back.sh <base> <head|WORKTREE>   (da raiz do repositório)" >&2
  exit 2
}
[ -n "$BASE" ] || uso "falta <base> — um gate diferencial sem par não mede nada"
[ -n "$HEAD" ] || uso "falta <head> — use um ref git ou a palavra WORKTREE"
git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null || uso "<base> não resolve: $BASE"
[ "$HEAD" = "WORKTREE" ] || git rev-parse --verify --quiet "$HEAD^{commit}" >/dev/null \
  || uso "<head> não resolve: $HEAD (e não é a palavra WORKTREE)"

AQUI=$(dirname "$0")
CONGELADO="$AQUI/g-back-nucleo.txt"
[ -f "$CONGELADO" ] || uso "congelado ausente: $CONGELADO"
TMP=$(mktemp -d "${TMPDIR:-/tmp}/g-back.XXXXXX")
limpa() {
  for w in "$TMP/arv-base" "$TMP/arv-head"; do
    [ -d "$w" ] && git worktree remove --force "$w" >/dev/null 2>&1
  done
  rm -rf "$TMP"
}
trap limpa EXIT

# a árvore de um ref, para o grafo (sem node_modules: só arquivo local entra)
arvore() { git worktree add --detach --quiet "$TMP/$1" "$2" >/dev/null 2>&1 || { echo "g-back: worktree de $2 falhou" >&2; exit 2; }; }
derivar() { node "$AQUI/g-back-derivar.mjs" "$1" > "$2" || { echo "g-back: derivação falhou em $1" >&2; exit 2; }; }

arvore arv-base "$BASE"; derivar "$TMP/arv-base" "$TMP/d-base"
if [ "$HEAD" = "WORKTREE" ]; then derivar . "$TMP/d-head"
else arvore arv-head "$HEAD"; derivar "$TMP/arv-head" "$TMP/d-head"; fi
grep -v '^#' "$CONGELADO" | grep . | sort -u > "$TMP/congelado"
{ cat "$TMP/congelado" "$TMP/d-base" "$TMP/d-head"; echo "scripts/gates-web/g-back-nucleo.txt"; } | sort -u > "$TMP/nucleo"

# declarações: "gback: <caminho> — <razão>" → caminho
DECL=${GATES_WEB_DECL:-}
: > "$TMP/decl"
if [ -n "$DECL" ]; then
  [ -f "$DECL" ] || uso "GATES_WEB_DECL aponta para arquivo inexistente: $DECL"
  grep '^gback: ' "$DECL" | sed 's/^gback: //; s/ — .*$//' | sort -u > "$TMP/decl"
fi

# o blob de um caminho num lado (vazio = não existe)
blob() { # $1 = ref|WORKTREE  $2 = caminho
  if [ "$1" = "WORKTREE" ]; then [ -f "$2" ] && git hash-object -- "$2"
  else git rev-parse --verify --quiet "$1:$2" 2>/dev/null; fi
}
mudou() { [ "$(blob "$BASE" "$1")" != "$(blob "$HEAD" "$1")" ]; }

echo "G-back — base $(git rev-parse --short "$BASE") · head $([ "$HEAD" = WORKTREE ] && echo WORKTREE || git rev-parse --short "$HEAD")"
echo "núcleo: congelado $(wc -l < "$TMP/congelado" | tr -d ' ') · derivação BASE $(wc -l < "$TMP/d-base" | tr -d ' ') · HEAD $(wc -l < "$TMP/d-head" | tr -d ' ') · união $(wc -l < "$TMP/nucleo" | tr -d ' ')"
echo "declarações gback: $(wc -l < "$TMP/decl" | tr -d ' ') caminho(s)"
echo
falhas=0

echo "## (i) arquivo do núcleo que mudou"
: > "$TMP/mudaram"
while IFS= read -r f; do
  if mudou "$f"; then
    echo "$f" >> "$TMP/mudaram"
    b=$(blob "$BASE" "$f"); h=$(blob "$HEAD" "$f")
    como=modificado; [ -z "$b" ] && como=novo; [ -z "$h" ] && como=removido
    if grep -qxF "$f" "$TMP/decl"; then echo "  ✓ $f ($como) — declarado"
    else echo "  ✗ $f ($como) — SEM DECLARAÇÃO"; falhas=$((falhas + 1)); fi
  fi
done < "$TMP/nucleo"
[ -s "$TMP/mudaram" ] || echo "  ✓ nenhum — diff vazio no núcleo"

echo "## (ii) arquivo novo no alcance (derivação do HEAD fora do congelado)"
comm -13 "$TMP/congelado" "$TMP/d-head" > "$TMP/novos"
if [ -s "$TMP/novos" ]; then
  while IFS= read -r f; do
    if grep -qxF "$f" "$TMP/decl"; then echo "  ✓ $f — declarado"
    else echo "  ✗ $f — FORA DO CONGELADO E SEM DECLARAÇÃO"; falhas=$((falhas + 1)); fi
  done < "$TMP/novos"
else echo "  ✓ nenhum"; fi

echo "## (iii) declaração órfã (gback: de arquivo que não mudou)"
n=0
while IFS= read -r f; do
  if mudou "$f"; then
    grep -qxF "$f" "$TMP/nucleo" || echo "  · $f — mudou, fora do núcleo: registro (não reprova)"
  else echo "  ✗ $f — DECLARADO E NÃO MUDOU"; n=$((n + 1)); fi
done < "$TMP/decl"
[ "$n" -eq 0 ] && echo "  ✓ nenhuma"
falhas=$((falhas + n))

comm -23 "$TMP/congelado" "$TMP/d-head" > "$TMP/sairam"
if [ -s "$TMP/sairam" ]; then
  echo "## informativo — no congelado e fora da derivação do HEAD (regenerar o congelado)"
  sed 's/^/  · /' "$TMP/sairam"
fi

echo
if [ "$falhas" -gt 0 ]; then echo "G-back: REPROVA — $falhas ocorrência(s)"; exit 1; fi
echo "G-back: PASSA"
