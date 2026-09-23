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
# ---------------------------------------------------------------------------
# W4-b1 — A DECLARAÇÃO ÓRFÃ PASSA A REPROVAR (div. 339, que é a 141 medida)
#
# O remédio proporcional acima durou uma PR. A N2-PR7 mergeou e deixou SETE
# exceções e um par do G1b declarados na `main`; o aviso saiu alto em toda
# corrida do CI desde então, e nada o leu — o job ficou verde. Aviso que não
# bloqueia, num gate que roda sozinho, é o mesmo silêncio que a div. 141
# nomeou, com mais tinta. Agora a exceção (G1a) e o par (G1b) declarados e não
# usados REPROVAM, como a errata e a remoção do G3.
#
# **A CONSEQUÊNCIA, declarada** (é a razão que a W3 deu para não reprovar, e a
# div. 188 é onde ela já tinha mordido): uma PR que declara no commit 1 a
# exceção que só o commit 2 usa fica VERMELHA no commit 1, rodando o gate à
# mão. O CI mede o HEAD da PR — o commit 1 sozinho nunca é o que ele vê — e ali
# nada muda. O gate-first continua valendo: quem roda o commit 1 lê a
# reprovação como "declarado, ainda não usado", que é exatamente o que é.
#
# **E A OUTRA CONSEQUÊNCIA**: a exceção de uma PR fica na `main` depois do
# merge, e a PR SEGUINTE — qualquer uma, de docs inclusive, porque o
# `gates-nativos` não tem filtro de caminho — reprova até podá-la. A poda deixa
# de ser disciplina e vira condição de merge. É o que a div. 141 pedia.
#
# --- As EXCEÇÕES desta PR (o escopo declarado do W4-b1) ---------------------
# Poda da div. 339: as SETE da N2-PR7 saíram — mergearam em `bc55419`. A única
# abaixo é desta PR:
#
#   packages/core/src/search.ts   div. 220 (e 194): o docstring de
#       `buildIndex` dizia "reconstruído por item a cada invalidação", e o
#       corpo, três linhas abaixo, reconstrói o CONJUNTO. Só o comentário muda.
EXCECOES='packages/core/src/search.ts'

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

# --- W3, div. 141 → W4-b1, div. 339: exceção declarada que NÃO foi usada ----
# Reprova (ver o cabeçalho do W4-b1): exceção velha é gate mais permissivo em
# silêncio, e um aviso que o job verde engole é silêncio.
NAOUSADAS=''
for E in $EXCECOES; do
  if [ "$HEAD" = "WORKTREE" ]; then D=$(git diff --stat "$BASE" -- "$E")
  else D=$(git diff --stat "$BASE".."$HEAD" -- "$E"); fi
  [ -z "$D" ] && NAOUSADAS="$NAOUSADAS$E
"
done
if [ -n "$NAOUSADAS" ]; then
  echo "  G1a: EXCEÇÃO DECLARADA E NÃO USADA ✗ — poda (divs. 141, 339):"
  printf '%s' "$NAOUSADAS" | sed 's/^/        /'
  A=1
fi

# --- G1b: invariância de DECISÃO nos módulos tocados -------------------------
# O core é puro e testado. A garantia de que `selectPrefetch`, `prefetchOrder`,
# `lruEvict`, `promoteList` e `offlineStatus` não mudaram de DECISÃO é a suíte
# deles passando SEM QUE UM TESTE EXISTENTE SEJA EDITADO: o diff dos `*.test.ts`
# do core só pode ter ADIÇÃO. É o análogo do G2 para teste, e fecha o buraco
# que a div. 108 abriu — o G1 nunca soube dizer se o comportamento mudou, só se
# o arquivo mudou.
#
# ---------------------------------------------------------------------------
# N2-PR7 — O G1b GANHA PARES DECLARADOS (div. 321, origem A)
#
# Até aqui o G1b não tinha saída nenhuma: "só adição", e uma DECISÃO do core
# que mudasse de propósito não tinha como passar. A N2-E19 é a primeira
# mudança de asserção no core desde que o G1b existe — a espécie `rede` deixa
# de dizer "sem conexão — nada foi salvo" (div. 308) — e a linha velha do
# teste tem de sair, porque afirma o contrário da decisão nova. Não há forma
# só-adição honesta: manter a velha seria manter um teste que reprova.
#
# O remédio é o do G3 (W4-a, div. 189), e é o MESMO mecanismo nos dois irmãos:
# a alteração é um PAR — a linha que SAI e a que ENTRA no lugar dela — e mais a
# RAZÃO, escrita aqui, onde quem mexer no gate vai ler (regra 5 do catálogo).
# Cada registro são TRÊS linhas da lista abaixo:
#
#   1. `velha`  — a linha removida, sem a indentação, IGUAL (não subcadeia);
#   2. `nova`   — a linha que a substitui, IGUAL, e tem de estar entre as
#                 ADICIONADAS. Sem isto o par vira permissão de apagar, que é
#                 exatamente o defeito que a div. 189 achou no G3;
#   3. `razão:` — obrigatória. Um par sem razão é uma decisão sem autor.
#
# O que continua reprovando: linha removida sem par; par cuja `nova` não
# entrou IGUAL (uma troca diferente da declarada é outra decisão); lista que
# não fecha em triplas; tripla sem `razão:`.
#
# **E os pares são por PR, contra a BASE** — como as exceções do G1a (div.
# 141) e as erratas do G3 (div. 195). Depois do merge o par fica órfão: a
# `velha` não existe mais em BASE nenhuma. Até o W4-b1 o gate só IMPRIMIA o
# par órfão; agora ele REPROVA (div. 339 — o par da N2-PR7 ficou na `main`),
# com as duas consequências escritas no cabeçalho do W4-b1, lá em cima.
#
# --- OS PARES DESTA PR (W4-b1) ----------------------------------------------
# Nenhum. O par da N2-PR7 (N2-E19, `escrita.test.ts`) saiu na poda: mergeou em
# `bc55419`. Lista vazia = nenhuma asserção do core pode mudar nesta PR.
PARES_G1B=''
TESTES=$(git ls-tree -r --name-only "$BASE" -- packages/core/src | grep '\.test\.ts$')
if [ "$HEAD" = "WORKTREE" ]; then
  DIFF_T=$(git diff "$BASE" -- $TESTES)
else
  DIFF_T=$(git diff "$BASE".."$HEAD" -- $TESTES)
fi
# Sem a indentação: a comparação é da LINHA, não de onde ela está.
printf '%s\n' "$DIFF_T" | grep '^-[^-]' | sed 's/^-//; s/^[[:space:]]*//' > "$tmp/g1b.sairam" || true
printf '%s\n' "$DIFF_T" | grep '^+[^+]' | sed 's/^+//; s/^[[:space:]]*//' > "$tmp/g1b.entraram" || true
REMOVIDAS=$(grep -c . "$tmp/g1b.sairam" || true)
# NUNCA `grep -F ""` com a lista: padrão vazio casa com TUDO (a lição do G3).
printf '%s\n' "$PARES_G1B" | grep . > "$tmp/g1b.pares" || true
N_PARES=$(grep -c . "$tmp/g1b.pares" || true)
awk 'NR % 3 == 1' "$tmp/g1b.pares" > "$tmp/g1b.velha"
awk 'NR % 3 == 2' "$tmp/g1b.pares" > "$tmp/g1b.nova"
awk 'NR % 3 == 0' "$tmp/g1b.pares" > "$tmp/g1b.razao"

echo "G1b — linhas REMOVIDAS ou ALTERADAS nos testes do core: $REMOVIDAS"
echo "      PARES DECLARADOS (velha -> nova · razão; o escopo de decisão desta PR):"
if [ "$N_PARES" -gt 0 ]; then
  paste -d '\n' "$tmp/g1b.velha" "$tmp/g1b.nova" "$tmp/g1b.razao" \
    | awk 'NR % 3 == 1 { print "        " $0 } NR % 3 == 2 { print "          -> " $0 } NR % 3 == 0 { print "          · " $0 }'
else
  echo "        (nenhum — nenhuma asserção do core pode mudar nesta PR)"
fi
B=0
if [ $((N_PARES % 3)) -ne 0 ]; then
  echo "  G1b: lista de PARES com $N_PARES linhas — todo par é velha / nova / razão ✗"
  B=1
fi
while IFS= read -r R; do
  case "$R" in
    'razão: '?*) ;;
    *) echo "  G1b: PAR SEM RAZÃO ✗ — a terceira linha tem de começar por 'razão: ':"; echo "      $R"; B=1 ;;
  esac
done < "$tmp/g1b.razao"

if [ "$REMOVIDAS" -eq 0 ]; then
  [ $B -eq 0 ] && echo "  G1b: só adição ✓"
else
  echo "  linhas que SAÍRAM (cada uma precisa de um PAR, e a nova do par tem de entrar IGUAL):"
  sed 's/^/      /' "$tmp/g1b.sairam"
  while IFS= read -r L; do
    [ -n "$L" ] || continue
    I=$(grep -nxF -- "$L" "$tmp/g1b.velha" | head -1 | cut -d: -f1)
    if [ -z "$I" ]; then
      echo "  G1b: teste existente foi editado SEM PAR ✗"
      echo "      $L"
      B=1
      continue
    fi
    NOVA=$(sed -n "${I}p" "$tmp/g1b.nova")
    if ! grep -qxF -- "$NOVA" "$tmp/g1b.entraram"; then
      echo "  G1b: PAR SEM SUBSTITUTA ✗ — a linha saiu e a nova declarada não entrou IGUAL:"
      echo "      saiu:          $L"
      echo "      devia entrar:  $NOVA"
      B=1
    fi
  done < "$tmp/g1b.sairam"
  [ $B -eq 0 ] && echo "  G1b: cada linha que saiu tem par, e a nova do par entrou ✓"
fi

# O gêmeo da exceção órfã (G1a) e da errata órfã (G3): reprova (div. 339).
NAOUSADOS=''
I=0
while IFS= read -r V; do
  I=$((I + 1))
  [ -n "$V" ] || continue
  grep -qxF -- "$V" "$tmp/g1b.sairam" && continue
  NAOUSADOS="$NAOUSADOS$V
  -> $(sed -n "${I}p" "$tmp/g1b.nova")
"
done < "$tmp/g1b.velha"
if [ -n "$NAOUSADOS" ]; then
  echo "  G1b: PAR DECLARADO E NÃO USADO ✗ — poda (divs. 321, 339):"
  printf '%s' "$NAOUSADOS" | sed 's/^/        /'
  B=1
fi

rm -rf "$tmp"
[ $A -eq 0 ] && [ $B -eq 0 ]
