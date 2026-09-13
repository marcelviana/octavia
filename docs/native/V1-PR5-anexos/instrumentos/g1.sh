#!/bin/sh
# G1 — invariância de comportamento (V1-PRECHECK §7.2).
# Uso: g1.sh <base> <head|WORKTREE>
BASE=$1; HEAD=$2
NUCLEO="apps/native/src/api.ts apps/native/src/store.ts apps/native/src/sync.ts \
apps/native/src/net.ts apps/native/src/files.ts apps/native/src/prefetch.ts \
apps/native/src/session.ts apps/native/src/firebase.ts apps/native/src/log.ts"
EXISTENTES=$(git ls-tree -r --name-only "$BASE" -- packages/core/src)
echo "base=$BASE head=$HEAD"
echo "arquivos de packages/core/src existentes na base: $(echo "$EXISTENTES" | grep -c .)"
if [ "$HEAD" = "WORKTREE" ]; then
  D=$(git diff --stat "$BASE" -- $EXISTENTES $NUCLEO)
else
  D=$(git diff --stat "$BASE".."$HEAD" -- $EXISTENTES $NUCLEO)
fi
if [ -z "$D" ]; then echo "G1: DIFF VAZIO ✓"; exit 0
else echo "G1: DIFF NÃO VAZIO ✗"; echo "$D" | sed 's/^/    /'; exit 1; fi
