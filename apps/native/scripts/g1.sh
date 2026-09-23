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
# ---------------------------------------------------------------------------
# W4-a — O GATE RECUSA CHAMADA SEM PAR (div. 187)
#
# Medido na N2-PR1 e recolado no CN desta PR: `sh g1.sh` SEM ARGUMENTO dava
# `fatal: Not a valid object name` duas vezes, o despejo de `usage:` do git, e
# então **"G1a: DIFF VAZIO ✓"**, **"G1b: só adição ✓"** e exit 0 — sobre ZERO
# arquivos. Um gate diferencial sem par de refs não tem o que comparar, e o que
# ele imprimia não era um resultado fraco: era um resultado FALSO, verde, no
# formato exato do verdadeiro.
#
# É o mesmo buraco da div. 127 pelo avesso — lá o controle negativo não
# reprovava; aqui o gate APROVA sem medir. A recusa é a correção inteira: sem
# os dois argumentos, ou com um ref que não resolve, o gate para com exit 2 e
# imprime o uso. `WORKTREE` é a única palavra que não precisa resolver.
# ---------------------------------------------------------------------------
# Uso (da RAIZ do repositório):  sh apps/native/scripts/g1.sh <base> <head|WORKTREE>
BASE=$1; HEAD=$2
uso() {
  echo "g1.sh: $1" >&2
  echo "uso: sh apps/native/scripts/g1.sh <base> <head|WORKTREE>" >&2
  echo "     da RAIZ do repositório. <base> é um ref git; <head> é um ref git" >&2
  echo "     ou a palavra WORKTREE (a árvore de trabalho como está agora)." >&2
  exit 2
}
[ -n "$BASE" ] || uso "falta <base> — um gate diferencial sem par nao mede nada"
[ -n "$HEAD" ] || uso "falta <head> — use um ref git ou a palavra WORKTREE"
git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null || uso "<base> nao resolve: $BASE"
[ "$HEAD" = "WORKTREE" ] || git rev-parse --verify --quiet "$HEAD^{commit}" >/dev/null \
  || uso "<head> nao resolve: $HEAD (e nao e a palavra WORKTREE)"

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
# --- As EXCEÇÕES desta PR (o escopo declarado da N2-PR6) ---------------------
# Poda da div. 141: as SETE da N2-PR5 saíram — elas mergearam em `f991eb0` e
# uma exceção mergeada só torna o gate mais permissivo para a PR seguinte. As
# SEIS abaixo são desta PR, e são o escopo inteiro do picker.
#
#   packages/core/src/frases.ts      a errata da N2-PR6 (N2-E16): duas chaves
#       novas, verbatim das molduras `N2-P-*` ("não entrou na setlist",
#       "adicionada"), e os construtores com nome ou número dentro — o
#       placeholder com a reticência da R1·5, o vazio, as réguas, a marca
#       "já na setlist · n×" e o rodapé.
#   apps/native/src/escrita.ts       o `aoResponder` do `escrever()` (EXTRA
#       X1, declarado antes deste commit): a tela é avisada do 201 ANTES da
#       releitura, que é quando a linha vira "adicionada" e o `k` sobe.
#       Nenhuma regra nova — o módulo continua decidindo.
#   apps/native/src/icones/dados.ts  o QUINTO e último dos desenhos do anexo
#       D do DESIGN-N2: o `adicionar`, a outra metade do par.
#   apps/native/src/screens/IndexScreen.tsx   `Adicionar música` na faixa (o
#       quarto controle, à esquerda de `Reordenar`), e a troca S2 ↔ picker.
#   apps/native/src/screens/Picker.tsx   NOVO. O picker: a barra do S4, o
#       campo, os resultados com os cinco estados, o rodapé de 64/112.
#       Arquivo próprio porque os `testID` dele são NOVOS.
#   apps/native/src/screens/SearchScreen.tsx  o `export` do `Regua` (EXTRA
#       X2): o picker usa a régua do S4, não uma cópia dela.
EXCECOES='packages/core/src/frases.ts
apps/native/src/escrita.ts
apps/native/src/icones/dados.ts
apps/native/src/screens/IndexScreen.tsx
apps/native/src/screens/Picker.tsx
apps/native/src/screens/SearchScreen.tsx'

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
if [ -n "$EXCECOES" ]; then echo "$EXCECOES" | sed 's/^/        /'
else echo "        (nenhuma — nenhum arquivo de comportamento está fora da invariância)"; fi
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
