#!/bin/sh
# G1 — invariância de comportamento. Versionado no W1 a partir do
# `V1-PR7-anexos/instrumentos/g1.sh`, **partido em dois**.
#
# Por que ele muda de forma nesta PR, e por que isso não é acomodação: o G1 do
# V1 afirmava "o comportamento não mudou" listando NOVE módulos, e o `files.ts`
# e o `prefetch.ts` são dois deles. Esta PR muda exatamente esses dois, de
# propósito. Rodar o G1 como estava seria garantir a reprovação; afrouxá-lo em
# silêncio seria repetir a div. 108 pelo outro lado — um gate que se ajusta ao
# que a PR fez não afirma nada.
#
#     A LISTA DE EXCEÇÕES É O ESCOPO DECLARADO.
#     "Um gate que se afrouxa sem dizer onde deixa de ser gate."
#                                             — Marcel, 2026-09-14
#
# Se um oitavo arquivo precisar mudar, o gate grita, e quem o mudou tem de
# acrescentá-lo à lista NESTE ARQUIVO, com o motivo escrito, no mesmo commit.
#
# Uso (da RAIZ do repositório):  sh apps/native/scripts/g1.sh <base> <head|WORKTREE>
BASE=$1; HEAD=$2

# --- G1a: os SETE que esta PR não toca, mais o core exceto `offline.ts` ------
# (o G1 do V1 tinha nove: saem `files.ts` e `prefetch.ts`, que são o objeto da
#  PR; de `packages/core/src` sai `offline.ts`, que recebe o `fileVerdict`.)
NUCLEO="apps/native/src/api.ts apps/native/src/store.ts apps/native/src/sync.ts \
apps/native/src/net.ts apps/native/src/session.ts apps/native/src/firebase.ts \
apps/native/src/log.ts"
# Os `*.test.ts` do core NÃO entram no G1a: quem os julga é o G1b, e mais
# forte (só adição). Um teste novo é o que se espera de uma PR de conserto;
# um teste EDITADO é o que esconde mudança de decisão.
CORE=$(git ls-tree -r --name-only "$BASE" -- packages/core/src \
  | grep -v '^packages/core/src/offline\.ts$' | grep -v '\.test\.ts$')

echo "base=$BASE head=$HEAD"
echo "G1a — diff vazio em 7 módulos do nativo + $(echo "$CORE" | grep -c .) arquivos de packages/core/src"
echo "      EXCEÇÕES DECLARADAS (o escopo desta PR): files.ts · prefetch.ts · core/offline.ts"
echo "      e os *.test.ts do core, que ficam sob o G1b"
if [ "$HEAD" = "WORKTREE" ]; then
  DA=$(git diff --stat "$BASE" -- $CORE $NUCLEO)
else
  DA=$(git diff --stat "$BASE".."$HEAD" -- $CORE $NUCLEO)
fi
if [ -z "$DA" ]; then echo "  G1a: DIFF VAZIO ✓"; A=0
else echo "  G1a: DIFF NÃO VAZIO ✗"; echo "$DA" | sed 's/^/      /'; A=1; fi

# --- G1b: invariância de DECISÃO nos módulos tocados -------------------------
# O core é puro e testado. A garantia de que `selectPrefetch`, `prefetchOrder`,
# `lruEvict`, `promoteList` e `offlineStatus` não mudaram de DECISÃO é a suíte
# deles passando SEM QUE UM TESTE EXISTENTE SEJA EDITADO: o diff dos `*.test.ts`
# do core só pode ter ADIÇÃO. É o análogo do G2 para teste, e fecha o buraco
# que a div. 108 abriu — o G1 nunca soube dizer se o comportamento mudou, só se
# o arquivo mudou.
TESTES=$(git ls-tree -r --name-only "$BASE" -- packages/core/src | grep '\.test\.ts$')
if [ "$HEAD" = "WORKTREE" ]; then
  REMOVIDAS=$(git diff "$BASE" -- $TESTES | grep -c '^-[^-]' || true)
else
  REMOVIDAS=$(git diff "$BASE".."$HEAD" -- $TESTES | grep -c '^-[^-]' || true)
fi
echo "G1b — linhas REMOVIDAS ou ALTERADAS nos testes do core: $REMOVIDAS"
if [ "$REMOVIDAS" -eq 0 ]; then echo "  G1b: só adição ✓"; B=0
else echo "  G1b: teste existente foi editado ✗"; B=1; fi

[ $A -eq 0 ] && [ $B -eq 0 ]
