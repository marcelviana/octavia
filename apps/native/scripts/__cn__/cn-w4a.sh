#!/bin/sh
# CN — os controles negativos do W4-a. Instrumento DE MÃO, de propósito.
#
# Uso (da RAIZ do repositório): sh apps/native/scripts/__cn__/cn-w4a.sh
#
# Por que não entra no CI: a razão já está declarada no `ci.yml` para os CN do
# G1/G2/G3 — eles exigem um PAR DE REFS FABRICADO, e este fabrica o par numa
# worktree descartável, com commits que existem para ser jogados fora. Um job
# que fabrica commit para provar um ponto é instrumento de mão. O que entra no
# repositório é a SAÍDA dele, colada em `docs/native/W4A-anexos/`.
#
# A regra que ele serve (div. 127): CONTROLE NEGATIVO QUE NÃO REPROVA É
# INSTRUMENTO QUEBRADO. Os três abaixo REPROVAM o gate de hoje — rodá-los antes
# do commit 2 é o que prova que o commit 2 conserta alguma coisa.
#
#   CN-187  `g1.sh` e `g2g3.sh` SEM ARGUMENTO. Hoje: `fatal: Not a valid object
#           name`, "DIFF VAZIO ✓", "nenhuma linha sumiu ✓" e exit 0 — afirmações
#           verdes sobre ZERO arquivos. Esperado: exit != 0 com uso impresso.
#   CN-189  ERRATA SEM SUBSTITUTA. Com um par de errata declarado, a linha velha
#           é APAGADA e nenhuma nova entra. Hoje: a errata autoriza o sumiço e o
#           gate dá exit 0. Esperado: exit != 0.
#   CN-195  ERRATA DECLARADA E NÃO USADA. Uma errata que não casa com nenhuma
#           linha que sumiu, ao lado de uma que casa. Hoje: silêncio sobre a
#           órfã. Esperado: o aviso, e SEM reprovar — o mesmo remédio
#           proporcional da div. 141 no `g1.sh`, pela mesma razão (o gate vem
#           antes do que ele mede).
#
#   CP-189  o CONTROLE POSITIVO do par: a MESMA errata, com a substituta de
#           fato presente. Tem de PASSAR nos dois scripts — senão o commit 2
#           não apertou o gate, só o quebrou.

RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
TMP=$(mktemp -d)
WT="$TMP/wt"
ALVO="apps/native/src/store.ts"   # em escopo do G3 (não é test/ nem scripts/)

limpar() {
  git worktree remove --force "$WT" >/dev/null 2>&1
  rm -rf "$TMP"
}
trap limpar EXIT INT TERM

# --- Uma CÓPIA do g2g3.sh com a lista de ERRATAS trocada pela do CN ----------
# A lista de erratas é ESTADO DE UMA PR (div. 141/195): um CN que dependesse da
# lista que está no arquivo quebraria na primeira poda. Então ele injeta a sua.
# A injeção é a MESMA nos dois formatos — a lista é um bloco de linhas, e o que
# o commit 2 muda é só COMO ELA É LIDA (linhas soltas -> pares velha/nova). Por
# isso o mesmo CN roda contra o script de antes e o de depois sem saber de qual
# se trata, que é o que faz dele um controle e não uma encenação.
copia_com_errata() { # $1 = destino  $2 = ARQUIVO com as linhas de errata
  awk -v ERRF="$2" '
    /^ERRATAS=/ {
      n = 0
      while ((getline l < ERRF) > 0) a[++n] = l
      close(ERRF)
      if (n == 0) print "ERRATAS=\047\047"
      else for (i = 1; i <= n; i++)
        printf "%s%s%s\n", (i == 1 ? "ERRATAS=\047" : ""), a[i], (i == n ? "\047" : "")
      p = ($0 ~ /\047$/ && $0 != "ERRATAS=\047") ? 0 : 1
      next
    }
    p && /\047$/ { p = 0; next }
    p { next }
    { print }
  ' "$RAIZ/apps/native/scripts/g2g3.sh" > "$1"
  cp "$RAIZ/apps/native/scripts/sem-comentario.awk" "$(dirname "$1")/"
}

titulo() {
  echo
  echo "=============================================================================="
  echo "$1"
  echo "=============================================================================="
}
# Filtra o despejo de `usage:` do git, que tem 90 linhas e não é a medição.
util() { grep -vE '^(usage: git diff|Diff [a-z]+ (output format|rename|algorithm) options|Diff output format options|Other diff options)$|^ {4}-|^ {10,}|^$'; }

# ---------------------------------------------------------------------------
titulo "CN-187 — os dois gates diferenciais SEM ARGUMENTO"
for G in g1 g2g3; do
  echo "--- sh apps/native/scripts/$G.sh   (sem argumento) ---"
  sh "apps/native/scripts/$G.sh" 2>&1 | util | sed 's/^/  /'
  sh "apps/native/scripts/$G.sh" >/dev/null 2>&1
  E=$?
  if [ "$E" -eq 0 ]; then
    echo "  exit=$E   *** CN REPROVADO: o gate passou sem medir nada ***"
  else
    echo "  exit=$E   recusou a chamada sem par ✓"
  fi
done

# --- O par fabricado: uma linha de log que NASCE e depois SOME ou TROCA ------
git worktree add -q --detach "$WT" HEAD || exit 1
cd "$WT" || exit 1
VELHA='log(`cn-w4a linha=velha n=${n}`)'
NOVA='log(`cn-w4a linha=nova n=${n} extra=${e}`)'
printf '\n// CN do W4-a — linha fabricada, jogada fora com a worktree.\nexport function __cnW4a(n, e) { %s }\n' "$VELHA" >> "$ALVO"
git add "$ALVO" && git commit -qm 'CN W4-a: BASE com a linha velha'
REF_BASE=$(git rev-parse HEAD)

git show "$REF_BASE:$ALVO" | grep -v 'cn-w4a linha=velha' > "$ALVO"
git add "$ALVO" && git commit -qm 'CN W4-a: a linha velha SAI e nenhuma entra'
REF_AMPUTADO=$(git rev-parse HEAD)

git show "$REF_BASE:$ALVO" | sed "s|cn-w4a linha=velha n=\${n}|cn-w4a linha=nova n=\${n} extra=\${e}|" > "$ALVO"
git add "$ALVO" && git commit -qm 'CN W4-a: a linha velha sai e a NOVA entra'
REF_TROCADO=$(git rev-parse HEAD)

ERR_PAR="$VELHA
$NOVA"
ERR_ORFA='log(`cn-w4a linha=que-nunca-existiu`)
log(`cn-w4a substituta-de-ninguem`)'

roda() { # $1 = erratas  $2 = ref-depois ; deixa o exit em $E
  printf '%s\n' "$1" > "$TMP/err.txt"
  copia_com_errata "$TMP/g2g3-cn.sh" "$TMP/err.txt"
  sh "$TMP/g2g3-cn.sh" "$REF_BASE" "$2" 2>&1 | sed 's/^/  /'
  sh "$TMP/g2g3-cn.sh" "$REF_BASE" "$2" > "$TMP/saida" 2>&1
  E=$?
  echo "  exit=$E"
}

titulo "CN-189 — errata declarada, linha APAGADA, substituta AUSENTE"
echo "erratas declaradas (o par velha -> nova):"; printf '%s\n' "$ERR_PAR" | sed 's/^/    /'
echo "--- g2g3  BASE=<tem a velha>  DEPOIS=<não tem nenhuma das duas> ---"
roda "$ERR_PAR" "$REF_AMPUTADO"
if [ "$E" -eq 0 ]; then
  echo "  *** CN REPROVADO: a errata autorizou o sumiço sem exigir a substituta ***"
else
  echo "  recusou ✓"
fi

titulo "CP-189 — a MESMA errata, com a substituta PRESENTE (controle POSITIVO)"
echo "--- g2g3  BASE=<tem a velha>  DEPOIS=<tem a nova> ---"
roda "$ERR_PAR" "$REF_TROCADO"
if [ "$E" -eq 0 ]; then
  echo "  passou ✓ (o gate não reprova a troca legítima)"
else
  echo "  *** CP REPROVADO: o gate apertou demais e barra a errata honesta ***"
fi

titulo "CN-195 — errata ÓRFÃ ao lado de uma usada"
echo "erratas declaradas (o par de cima é usado; o de baixo não casa com nada):"
printf '%s\n%s\n' "$ERR_PAR" "$ERR_ORFA" | sed 's/^/    /'
echo "--- g2g3  BASE=<tem a velha>  DEPOIS=<tem a nova> ---"
roda "$ERR_PAR
$ERR_ORFA" "$REF_TROCADO"
if grep -q 'ERRATA DECLARADA E NÃO USADA' "$TMP/saida"; then
  echo "  avisou ✓"
else
  echo "  *** CN REPROVADO: a errata órfã passou em silêncio ***"
fi
if [ "$E" -eq 0 ]; then
  echo "  e NÃO reprovou por isso ✓ (div. 141: o gate vem antes do que ele mede)"
else
  echo "  *** e reprovou — o aviso da órfã não pode bloquear (div. 141) ***"
fi
echo
