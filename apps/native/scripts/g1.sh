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
# --- As EXCEÇÕES desta PR (o escopo declarado da N2-PR2) ---------------------
# Poda da div. 141: a lista do W4-a estava VAZIA (aquela era PR de instrumento)
# e não há nada herdado a podar. As SETE abaixo são desta PR, e são o escopo
# inteiro do core da escrita — **nenhuma tela**.
#
#   packages/core/src/escrita.ts    NOVO. Os seis pedidos (método, caminho,
#       corpo) e a classificação fechada em sete espécies. Puro: nenhuma
#       request mora aqui, e é por isso que ele cabe no core.
#   packages/core/src/validacao.ts  NOVO. As TRÊS validações do cliente
#       (N2-D21) e a data-calendário local do T2-R2. Nada do filtro de texto
#       do servidor (div. 181), que não se replica.
#   packages/core/src/frases.ts     NOVO. O conjunto FECHADO de frases —
#       T2-R15 ∪ as fixas do desenho congelado. É o padrão do `fraseDaFalha()`
#       da W2, e o teste afirma que toda saída pertence ao conjunto.
#   packages/core/src/index.ts      os três `export *` acima. Sem eles os
#       módulos existem e ninguém os alcança.
#   apps/native/src/escrita.ts      NOVO. A orquestração: barrar, enviar,
#       classificar, reler, gravar, logar. É a única superfície de
#       comportamento novo do APP nesta PR, e não tem uma linha de tela.
#   apps/native/src/api.ts          o transporte de escrita. Ele mora AQUI, e
#       não no módulo novo, porque o cabeçalho deste arquivo declara ser "a
#       camada de rede única do app" — partir o transporte em dois faria dessa
#       frase uma mentira. É também onde vive a N2-D9: um SEGUNDO `authFetch`,
#       cujo `onAuthFailure` **não** chama `signOutSession()`.
#   apps/native/src/store.ts        o `saveSetlists()` da N2-D13 — gravar só o
#       `setlists.json`, porque o `save()` de hoje grava os dois arquivos
#       juntos e a releitura da escrita não lê content. A linha
#       `cache write kind=setlists …` é a MESMA, byte a byte: ela mudou de
#       função e não de texto, e por isso o G3 não precisa de errata.
EXCECOES='packages/core/src/frases.ts
apps/native/App.tsx
apps/native/src/api.ts
apps/native/src/apos-escrita.ts
apps/native/src/icones/dados.ts
apps/native/src/screens/SetlistsScreen.tsx
apps/native/src/screens/FolhaDeCriar.tsx
apps/native/src/screens/LinhaDeAviso.tsx'

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
