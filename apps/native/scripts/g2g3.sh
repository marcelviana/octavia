#!/bin/sh
# G2 — testIDs: antes ⊆ depois.   G3 — linhas `log(` idênticas por arquivo.
# Uso (da RAIZ do repositório): sh apps/native/scripts/g2g3.sh <ref-antes> <ref-depois-ou-WORKTREE>
#
# Versionado na V1-PR3 (commit 5) a partir do `V1-PR1-anexos/V1-PR1-B-gates.txt`,
# com a correção da divergência 30: o ramo de ref-git varria TODOS os arquivos
# sob apps/native/src (inclusive src/fixtures/aceite.py) e o ramo WORKTREE só
# *.ts/*.tsx — assimetria que dá falso positivo no G3 com o .ts idêntico dos
# dois lados quando um não-ts contém a subcadeia `log(`. Agora os dois ramos
# têm o mesmo recorte: `grep -E '\.tsx?$'` na lista do ref-git.
#
# ---------------------------------------------------------------------------
# W2 — O ESCOPO (div. 123 e 128)
#
# Os dois ramos do `coleta()` varriam `apps/native/src`, e o `App.tsx` mora um
# nível acima. O gate que existe para garantir que nenhuma linha do contrato
# suma em silêncio NÃO LIA o arquivo onde vivem TRÊS delas — `login-screen`
# (que prova o A5), `auth uid=… src=…` (A1 e A5) e `download-error` (A13 e
# W1-A4). Medido: o G3 comparava 54 linhas `log(` e a população certa é 57.
#
# O escopo passa a ser `apps/native` INTEIRO, menos duas exclusões declaradas:
#   • `apps/native/test/`     — os testes; já é exclusão declarada, escrita no
#     `vitest.config.mts` ("um teste dentro de src/ falsearia o G2 e o G3");
#   • `apps/native/scripts/`  — os próprios instrumentos, inclusive o `__cn__`.
# `node_modules` sai por construção.
#
# O controle negativo que prova a diferença: apagar `log('login-screen')` do
# `App.tsx` e rodar os dois escopos. Com o de antes, "nenhuma linha sumiu ✓";
# com este, a linha aparece em SUMIRAM e o gate reprova.
# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------
# W3 — O COLETOR DEIXA DE LER COMENTÁRIO (div. 136, e a div. 140 que ela esconde)
#
# O `coleta()` grepava o texto CRU do arquivo. Uma MENÇÃO a uma prop de teste ou
# a uma chamada de log dentro de comentário entrava na população como se fosse
# código — a W2 achou isso ao documentar o `files.ts`, chamou de falso positivo
# e contornou escrevendo a documentação de outro jeito.
#
# **A W3 mediu que o falso positivo não é inerte** (div. 140): uma vez na
# população do ANTES, editar o comentário faz a menção SUMIR, e aí o G2 reprova
# por "testID SUMIU" e o G3 por "linha sumiu SEM ERRATA". É REPROVAÇÃO FALSA — e
# a partir desta PR este gate IMPEDE (div. 129), então o custo do defeito deixa
# de ser um anexo confuso e passa a ser um CI vermelho sem causa.
#
# Entra o `sem-comentario.awk`, com a MESMA regra que o `a20.mjs` já aplica.
# Medido antes de entrar: a população não muda — 43 testIDs e 57 linhas de log,
# os mesmos conjuntos. É conserto de defeito, não mudança de escopo, e por isso
# NÃO precisa de errata no G3.
# ---------------------------------------------------------------------------
A=$1; B=$2
AQUI=$(dirname "$0")
SEM_COMENTARIO="$AQUI/sem-comentario.awk"
tmp=$(mktemp -d)
# As duas EXCLUSÕES DECLARADAS do escopo (W2): os testes e os instrumentos.
# `node_modules` sai por construção, não por decisão.
fora_do_escopo() {
  grep -vE '^\./' | grep -vE '^apps/native/(test|scripts)/' | grep -vE '(^|/)node_modules/'
}
# O texto do arquivo SEM COMENTÁRIO — a única fonte que o coletor lê (W3).
sem_comentario() {
  if [ "$1" = "WORKTREE" ]; then awk -f "$SEM_COMENTARIO" "$2"
  else git show "$1:$2" 2>/dev/null | awk -f "$SEM_COMENTARIO"; fi
}
coleta() {
  if [ "$1" = "WORKTREE" ]; then
    ARQS=$(find apps/native packages/core/src \( -name '*.ts' -o -name '*.tsx' \) | fora_do_escopo | sort)
  else
    ARQS=$(git ls-tree -r --name-only "$1" -- apps/native packages/core/src | grep -E '\.tsx?$' | fora_do_escopo | sort)
  fi
  for f in $ARQS; do
    sem_comentario "$1" "$f" | grep -o 'testID="[^"]*"' | sed "s|^|$f\t|"
    sem_comentario "$1" "$f" | grep -oE 'testID=\{`[^`]*`\}' | sed "s|^|$f\t|"
  done | sort -u > "$2"
  for f in $ARQS; do
    sem_comentario "$1" "$f" | grep 'log(' | sed 's/^ *//' | sed "s|^|$f\t|"
  done | sort > "$3"
}
coleta "$A" $tmp/a.ids $tmp/a.log
coleta "$B" $tmp/b.ids $tmp/b.log
echo "G2 — testIDs  antes=$(wc -l < $tmp/a.ids | tr -d ' ')  depois=$(wc -l < $tmp/b.ids | tr -d ' ')"
SUMIU=$(comm -23 $tmp/a.ids $tmp/b.ids)
if [ -z "$SUMIU" ]; then echo "  G2: antes ⊆ depois ✓"; G2=0
else echo "  G2: testID SUMIU ✗"; echo "$SUMIU" | sed 's/^/      /'; G2=1; fi
NOVO=$(comm -13 $tmp/a.ids $tmp/b.ids)
[ -n "$NOVO" ] && { echo "  testID NOVOS:"; echo "$NOVO" | sed 's/^/      /'; }
# G3 — W1: de "idênticas" para "antes ⊆ depois, com ERRATA DECLARADA".
#
# Por que ele muda de forma: até aqui nenhuma PR precisava acrescentar linha de
# log, e "idênticas" era a afirmação certa. Esta PR existe **justamente** para
# acrescentar linhas que faltavam (div. 114: o `download-error` existia em UM
# lugar no app inteiro) e para mudar uma que dizia menos do que precisa dizer.
# Então o gate passa a exigir duas coisas, e a segunda é a que importa:
#
#   1. toda linha que SUMIU tem de estar na lista de erratas abaixo, com o
#      motivo — uma linha que some sem estar aqui é contrato quebrado em
#      silêncio, e é exatamente o que um "⊆" cru deixaria passar;
#   2. as linhas NOVAS saem impressas, para entrar no commit e no catálogo.
#
# ERRATAS DECLARADAS (`W1-PRECHECK.md` §9.3; `LOGS-OCTAVIA.md`, errata W1):
#   • `file src=download … bytes=<n>` → ganha `total=<n|->` e `ms=<n>`. Sem a
#     taxa no log, "não abortou" não se separa em "a rede estava sã" e "o teto
#     não funciona", e o aceite W1-A2 vira impressão.
ERRATAS='file src=download name=${name} bytes=${bytes}`'
echo "G3 — linhas log( antes=$(wc -l < $tmp/a.log | tr -d ' ')  depois=$(wc -l < $tmp/b.log | tr -d ' ')"
SUMIRAM=$(comm -23 $tmp/a.log $tmp/b.log)
NOVAS=$(comm -13 $tmp/a.log $tmp/b.log)
G3=0
if [ -n "$SUMIRAM" ]; then
  echo "  linhas que SUMIRAM (cada uma tem de ser errata declarada):"
  echo "$SUMIRAM" | sed 's/^/      /'
  echo "$SUMIRAM" | while IFS= read -r L; do
    echo "$L" | grep -qF "$ERRATAS" || { echo "  G3: linha sumiu SEM ERRATA ✗"; exit 1; }
  done || G3=1
  [ $G3 -eq 0 ] && echo "  G3: as que sumiram estão na lista de erratas ✓"
else
  echo "  G3: nenhuma linha sumiu ✓"
fi
if [ -n "$NOVAS" ]; then echo "  linhas NOVAS (declarar no commit e no catálogo):"; echo "$NOVAS" | sed 's/^/      /'; fi
rm -rf $tmp
[ $G2 -eq 0 ] && [ $G3 -eq 0 ]
