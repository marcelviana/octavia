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
# ---------------------------------------------------------------------------
# W2 — O MECANISMO, E NÃO SÓ O ESCOPO (div. 134)
#
# Até aqui o `NUCLEO` do G1a era uma LISTA LITERAL de sete caminhos escrita
# neste arquivo, enquanto a metade do core do MESMO gate já era derivada por
# `git ls-tree`. Metade do gate acompanhava arquivo novo e metade não: um
# módulo novo em `apps/native/src` nascia fora da invariância e nada avisava —
# e a div. 123 (o `App.tsx` invisível para todo gate) é o que essa metade
# produziu uma vez. Consertar só o escopo deixaria o próximo arquivo cair no
# mesmo buraco, então as duas coisas entram no mesmo commit.
#
# Agora o escopo é DERIVADO, e o que se escreve à mão é só a exceção:
#
#   universo = (todo `.ts`/`.tsx` de `apps/native` e de `packages/core/src`,
#               na BASE **e** no HEAD — a união, senão um arquivo que só
#               existe no HEAD é invisível, que é o defeito que se conserta)
#   menos    = `apps/native/test/` e `apps/native/scripts/` — os testes e os
#              próprios instrumentos, que não são COMPORTAMENTO do app; é a
#              mesma exclusão declarada que o `vitest.config.mts` já escreve
#   menos    = `*.test.ts`, que ficam sob o G1b
#   menos    = as EXCEÇÕES desta PR, abaixo
#
# E um arquivo do universo que **não existe na BASE** reprova do mesmo jeito
# que um diff: superfície de comportamento nova também é escopo, e escopo se
# declara.
# ---------------------------------------------------------------------------
#
# Uso (da RAIZ do repositório):  sh apps/native/scripts/g1.sh <base> <head|WORKTREE>
BASE=$1; HEAD=$2

# ---------------------------------------------------------------------------
# W3 — A LISTA É PODADA A CADA PR, E O GATE PASSA A DIZER QUANDO NÃO FOI
#
# Div. 141, achada ao pôr este gate para IMPEDIR no CI (div. 129). A lista de
# exceções é ESTADO DE UMA PR guardado num arquivo que SOBREVIVE à PR. Enquanto
# o gate era comando de mão, quem o rodava lia a lista e sabia de quem era.
# Rodando sozinho no CI, uma exceção esquecida não faz barulho nenhum: ela só
# torna o gate MAIS PERMISSIVO, em silêncio, para a PR seguinte — que é o
# avesso do que uma exceção declarada deve fazer.
#
# Nunca é REPROVAÇÃO falsa (lista velha só deixa passar), e por isso o remédio
# é proporcional: o gate IMPRIME as exceções que declarou e NÃO USOU, alto, em
# toda corrida — e NÃO reprova por isso. Reprovar quebraria a regra do projeto
# de que **o gate vem antes do que ele mede**: o commit 1 de uma PR declara a
# exceção que só o commit 3 vai usar, e um gate que reprovasse ali obrigaria a
# inverter a ordem. Se o Marcel quiser que passe a reprovar, é uma linha —
# trocar o aviso por `A=1`. (Pergunta 3 do relatório da W3.)
#
# --- As EXCEÇÕES desta PR (o escopo declarado da N2-PR1) ---------------------
# Poda da div. 141: `files.ts` e `prefetch.ts`, exceções da W3, SAEM — a W3
# mergeou e a N2-PR1 não toca em nenhum dos dois; deixá-los era o gate mais
# permissivo em silêncio que o aviso abaixo existe para gritar.
#
# Entram os quatro arquivos que o commit 2 (T1-R10 ligado, N2-D8) vai tocar,
# e só eles. Declarados aqui, no commit 1, porque o gate vem antes do que mede:
# até o commit 2 o aviso de "declarada e não usada" sai para os quatro, de
# propósito.
#   packages/core/src/sync.ts   o `diffByUpdatedAt` passa a valer para setlist
#                               também (tipo genérico sobre `id`+`updated_at`)
#                               e ganha o par que o sync usa: contador e
#                               preservação do conjunto quando nada mudou
#   apps/native/src/sync.ts     o caminho do sync (T1-R13 passo 2) chama o core
#                               e devolve o contador
#   apps/native/src/store.ts    a linha `cache write … invalidated=<n>` deixa de
#                               ser literal — só o valor; nada da separação por
#                               `save` da N2-D13, que é da PR-2
#   apps/native/App.tsx         o `rodarSync` (`App.tsx:133`) reaproveita o
#                               `contentById` quando o conjunto não mudou: é o
#                               índice que os derivados memoizados leem, e sem
#                               isto "invalidated=0" seria de novo uma frase
#                               que o app desmente
EXCECOES='packages/core/src/sync.ts
apps/native/src/sync.ts
apps/native/src/store.ts
apps/native/App.tsx'

listar() {
  if [ "$1" = "WORKTREE" ]; then
    git ls-files --cached --others --exclude-standard -- apps/native packages/core/src
  else
    git ls-tree -r --name-only "$1" -- apps/native packages/core/src
  fi
}
filtrar() {
  grep -E '\.tsx?$' \
    | grep -vE '^apps/native/(test|scripts)/' \
    | grep -vE '(^|/)node_modules/' \
    | grep -v '\.test\.ts$' \
    | grep -vxF "$EXCECOES"
}
tmp=$(mktemp -d)
listar "$BASE" | filtrar | sort -u > "$tmp/base"
listar "$HEAD" | filtrar | sort -u > "$tmp/head"
sort -u "$tmp/base" "$tmp/head" > "$tmp/uni"
NUCLEO=$(cat "$tmp/uni")
NOVOS=$(comm -13 "$tmp/base" "$tmp/head")

echo "base=$BASE head=$HEAD"
echo "G1a — diff vazio em $(echo "$NUCLEO" | grep -c .) arquivos DERIVADOS de apps/native + packages/core/src"
echo "      escopo derivado (W2, div. 134): união BASE∪HEAD, menos apps/native/{test,scripts}/,"
echo "      menos os *.test.ts (que ficam sob o G1b), menos as exceções abaixo"
echo "      EXCEÇÕES DECLARADAS (o escopo desta PR):"
echo "$EXCECOES" | sed 's/^/        /'
if [ "$HEAD" = "WORKTREE" ]; then
  DA=$(git diff --stat "$BASE" -- $NUCLEO)
else
  DA=$(git diff --stat "$BASE".."$HEAD" -- $NUCLEO)
fi
A=0
if [ -n "$DA" ]; then echo "  G1a: DIFF NÃO VAZIO ✗"; echo "$DA" | sed 's/^/      /'; A=1; fi
if [ -n "$NOVOS" ]; then
  echo "  G1a: ARQUIVO NOVO no escopo, sem exceção declarada ✗"
  echo "$NOVOS" | sed 's/^/      /'
  A=1
fi
[ $A -eq 0 ] && echo "  G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)"

# --- W3, div. 141: exceção declarada que NÃO foi usada ----------------------
# Ela não reprova (ver o cabeçalho), mas não passa calada: exceção velha é
# gate mais permissivo em silêncio, e silêncio é o que o CI não perdoa.
NAOUSADAS=''
for E in $EXCECOES; do
  if [ "$HEAD" = "WORKTREE" ]; then D=$(git diff --stat "$BASE" -- "$E")
  else D=$(git diff --stat "$BASE".."$HEAD" -- "$E"); fi
  [ -z "$D" ] && NAOUSADAS="$NAOUSADAS$E
"
done
if [ -n "$NAOUSADAS" ]; then
  echo "  G1a: EXCEÇÃO DECLARADA E NÃO USADA — poda isto ANTES do merge (div. 141):"
  printf '%s' "$NAOUSADAS" | sed 's/^/        /'
fi

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

rm -rf "$tmp"
[ $A -eq 0 ] && [ $B -eq 0 ]
