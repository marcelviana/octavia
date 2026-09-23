#!/bin/sh
# CN — os controles do W4-b1. Instrumento DE MÃO, pela mesma razão do
# `cn-w4a.sh` (e do `ci.yml`): fabrica um par de refs numa worktree
# descartável, e um job que fabrica commit para provar um ponto não é gate. O
# que entra no repositório é a SAÍDA dele, em `docs/native/W4B1-anexos/`.
#
# Uso (da RAIZ do repositório): sh apps/native/scripts/__cn__/cn-w4b1.sh
#
# A regra que ele serve (div. 127): CONTROLE NEGATIVO QUE NÃO REPROVA É
# INSTRUMENTO QUEBRADO — e todo aperto tem CONTROLE POSITIVO ao lado (CP-189,
# W4-a): um gate apertado até barrar o caso honesto trocou um defeito por outro.
#
#   CN-339a  G1a: exceção declarada e NÃO usada, ao lado de uma usada.
#   CN-339b  G1b: par declarado e NÃO usado, ao lado de um usado.
#   CN-339c  G3:  errata declarada e NÃO usada, ao lado de uma usada.
#            Hoje (div. 141/195/321): aviso e exit 0. Esperado: exit != 0.
#   CP-339   as mesmas listas SÓ com o que é usado: exit 0 nos dois scripts.
#
#   CN-D34a  G3: uma linha `log(` de COMENTÁRIO some sem declaração: reprova
#            (já reprova — é a 83 funcionando).
#   CN-D34b  a mesma remoção declarada como `linha → REMOVIDA: <razão>`:
#            hoje o script não conhece a forma; esperado exit 0.
#   CN-D34c  a remoção declarada e a linha AINDA EXISTE: esperado reprova
#            (declaração não usada).
#   CN-D34d  a remoção declarada SEM razão: esperado reprova (uma remoção sem
#            razão é uma decisão sem autor — a regra do G1b, W4-a).
#   CP-D34   remoção usada AO LADO de uma errata usada: exit 0.
#
#   CN-223a  um byte alterado numa cópia do `telas.html` do V1: o passo de
#            `shasum -c` reprova.
#   CN-223b  o passo existe no job `gates-nativos` do `ci.yml`, com o MESMO
#            texto que este CN roda. Hoje: não existe.
#   CP-223   a cópia intacta da árvore de trabalho: o passo passa — só DEPOIS
#            que o README sair do `SHA256SUMS` do V1 (div. 223, decisão A).

RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
TMP=$(mktemp -d)
WT="$TMP/wt"
ALVO="apps/native/src/store.ts"          # em escopo do G1a e do G3
ORFAO_G1A="apps/native/src/api.ts"      # existe, e o par de refs não o toca
TESTE="packages/core/src/search.test.ts" # em escopo do G1b

limpar() {
  git worktree remove --force "$WT" >/dev/null 2>&1
  rm -rf "$TMP"
}
trap limpar EXIT INT TERM

# --- Injeção de lista ------------------------------------------------------
# As listas são ESTADO DE UMA PR (div. 141): um CN que dependesse da lista do
# arquivo quebraria na primeira poda. Ele troca a definição da variável pela
# sua, e a MESMA injeção roda contra o script de antes e o de depois. Aceita as
# três formas que os scripts usam (`V=''`, `V='…'` em várias linhas,
# `V=$(cat <<'X' … X` + `)`), e escreve sempre heredoc com aspas — o conteúdo
# vai literal, crase e `$` incluídos. Variável que o script não define: avisa,
# e a cópia sai sem ela — é o que "hoje o script não conhece a forma" quer dizer.
injeta() { # $1 = script  $2 = VAR  $3 = arquivo com as linhas ; stdout = script
  awk -v V="$2" -v F="$3" '
    function emite(   n, l) {
      n = 0
      while ((getline l < F) > 0) a[++n] = l
      close(F)
      if (n == 0) { print V "=\047\047"; return }
      print V "=$(cat <<\047__CN_W4B1__\047"
      for (i = 1; i <= n; i++) print a[i]
      print "__CN_W4B1__"
      print ")"
    }
    !modo && index($0, V "=") == 1 {
      achou = 1; emite()
      resto = substr($0, length(V) + 2)
      if (resto ~ /^\$\(cat <</) { modo = "here"; next }
      if (resto ~ /^\047.*\047$/ && resto != "\047") next
      modo = "sq"; next
    }
    modo == "here" { if ($0 == ")") modo = ""; next }
    modo == "sq"   { if ($0 ~ /\047$/) modo = ""; next }
    { print }
    END { if (!achou) print "  [injeta] " V ": o script NÃO define esta variável" > "/dev/stderr" }
  ' "$1"
}
# $1 = g1|g2g3 ; os pares VAR arquivo seguem. Escreve $TMP/<g>-cn.sh.
prepara() {
  G=$1; shift
  cp "$RAIZ/apps/native/scripts/$G.sh" "$TMP/$G-cn.sh"
  while [ $# -gt 0 ]; do
    injeta "$TMP/$G-cn.sh" "$1" "$2" > "$TMP/$G-cn.tmp" && mv "$TMP/$G-cn.tmp" "$TMP/$G-cn.sh"
    shift 2
  done
  cp "$RAIZ/apps/native/scripts/sem-comentario.awk" "$TMP/"
}
lista() { printf '%s\n' "$2" | grep . > "$TMP/$1" || : ; } # $1 = nome  $2 = linhas

titulo() {
  echo
  echo "=============================================================================="
  echo "$1"
  echo "=============================================================================="
}
# Roda a cópia injetada; saída indentada e o exit em $E.
roda() { # $1 = g1|g2g3  $2 = base  $3 = depois
  sh "$TMP/$1-cn.sh" "$2" "$3" > "$TMP/saida" 2>&1
  E=$?
  sed 's/^/  /' "$TMP/saida"
  echo "  exit=$E"
}
espera_reprova() { # $1 = o que a saída tem de trazer (vazio = só o exit)
  if [ "$E" -eq 0 ]; then echo "  *** CN REPROVADO: o gate passou (exit 0) ***"
  else echo "  reprovou ✓"; fi
  if [ -n "$1" ]; then
    if grep -qF -- "$1" "$TMP/saida"; then echo "  e disse \"$1\" ✓"
    else echo "  *** a saída não traz \"$1\" ***"; fi
  fi
}
espera_passa() {
  if [ "$E" -eq 0 ]; then echo "  passou ✓"
  else echo "  *** CP REPROVADO: o gate barrou o caso honesto ***"; fi
}

echo "cn-w4b1 — scripts lidos de: $RAIZ (árvore de trabalho), HEAD $(git rev-parse --short HEAD)"

# --- O par fabricado --------------------------------------------------------
git worktree add -q --detach "$WT" HEAD || exit 1
cd "$WT" || exit 1
COMENT='// log(`cn-w4b1 comentario`)'
VELHA='log(`cn-w4b1 linha=velha n=${n}`)'
NOVA='log(`cn-w4b1 linha=nova n=${n}`)'
printf '\n// CN do W4-b1 — linhas fabricadas, jogadas fora com a worktree.\n%s\nexport function __cnW4b1(n) { %s }\n' "$COMENT" "$VELHA" >> "$ALVO"
printf '\n// cn-w4b1 linha=velha\n' >> "$TESTE"
git add "$ALVO" "$TESTE" && git commit -qm 'CN W4-b1: BASE'
REF_BASE=$(git rev-parse HEAD)

troca() { sed -e 's|cn-w4b1 linha=velha|cn-w4b1 linha=nova|'; }
sem_coment() { grep -vF -- "$COMENT"; }
fabrica() { # $1 = filtro do ALVO  $2 = filtro do TESTE  $3 = mensagem
  git show "$REF_BASE:$ALVO" | $1 > "$ALVO"
  git show "$REF_BASE:$TESTE" | $2 > "$TESTE"
  git add "$ALVO" "$TESTE" && git commit -qm "CN W4-b1: $3" && git rev-parse HEAD
}
REF_TROCA=$(git checkout -q "$REF_BASE" && fabrica troca troca 'velha -> nova (log e teste)')
REF_SEMCOM=$(git checkout -q "$REF_BASE" && fabrica sem_coment cat 'o comentario com log( SAI')
ambos() { troca | sem_coment; }
REF_AMBOS=$(git checkout -q "$REF_BASE" && fabrica ambos troca 'velha -> nova E o comentario sai')

EXC_USADA="$ALVO"
EXC_ORFA="$ORFAO_G1A"
PAR_USADO='// cn-w4b1 linha=velha
// cn-w4b1 linha=nova
razão: CN do W4-b1 — par usado'
PAR_ORFAO='// cn-w4b1 linha=que-nunca-existiu
// cn-w4b1 substituta-de-ninguem
razão: CN do W4-b1 — par órfão'
ERR_USADA="$VELHA
$NOVA"
ERR_ORFA='log(`cn-w4b1 linha=que-nunca-existiu`)
log(`cn-w4b1 substituta-de-ninguem`)'
REM_USADA="$COMENT → REMOVIDA: CN do W4-b1 — comentário que citava a linha de log"
REM_SEM_RAZAO="$COMENT → REMOVIDA: "

# ---------------------------------------------------------------------------
titulo "CN-339a — G1a: exceção ÓRFÃ ao lado de uma usada"
lista exc "$EXC_USADA
$EXC_ORFA"; lista par "$PAR_USADO"
echo "exceções: $EXC_USADA (usada) · $EXC_ORFA (órfã) — pares do G1b: só o usado"
prepara g1 EXCECOES "$TMP/exc" PARES_G1B "$TMP/par"
roda g1 "$REF_BASE" "$REF_TROCA"; espera_reprova 'EXCEÇÃO DECLARADA E NÃO USADA'

titulo "CN-339b — G1b: par ÓRFÃO ao lado de um usado"
lista exc "$EXC_USADA"; lista par "$PAR_USADO
$PAR_ORFAO"
prepara g1 EXCECOES "$TMP/exc" PARES_G1B "$TMP/par"
roda g1 "$REF_BASE" "$REF_TROCA"; espera_reprova 'PAR DECLARADO E NÃO USADO'

titulo "CP-339 (g1) — só o que é usado: a exceção e o par"
lista exc "$EXC_USADA"; lista par "$PAR_USADO"
prepara g1 EXCECOES "$TMP/exc" PARES_G1B "$TMP/par"
roda g1 "$REF_BASE" "$REF_TROCA"; espera_passa

titulo "CN-339c — G3: errata ÓRFÃ ao lado de uma usada"
lista err "$ERR_USADA
$ERR_ORFA"; lista rem ""
prepara g2g3 ERRATAS "$TMP/err" REMOCOES "$TMP/rem"
roda g2g3 "$REF_BASE" "$REF_TROCA"; espera_reprova 'ERRATA DECLARADA E NÃO USADA'

titulo "CP-339 (g2g3) — só a errata usada"
lista err "$ERR_USADA"; lista rem ""
prepara g2g3 ERRATAS "$TMP/err" REMOCOES "$TMP/rem"
roda g2g3 "$REF_BASE" "$REF_TROCA"; espera_passa

titulo "CN-D34a — o comentário com log( SAI, sem declaração nenhuma"
lista err ""; lista rem ""
prepara g2g3 ERRATAS "$TMP/err" REMOCOES "$TMP/rem"
roda g2g3 "$REF_BASE" "$REF_SEMCOM"; espera_reprova 'linha sumiu SEM ERRATA'

titulo "CN-D34b — a mesma remoção, declarada com razão (a forma da N2-D34)"
echo "remoção declarada: $REM_USADA"
lista err ""; lista rem "$REM_USADA"
prepara g2g3 ERRATAS "$TMP/err" REMOCOES "$TMP/rem"
roda g2g3 "$REF_BASE" "$REF_SEMCOM"; espera_passa

titulo "CN-D34c — a remoção declarada, e a linha AINDA EXISTE"
lista err "$ERR_USADA"; lista rem "$REM_USADA"
prepara g2g3 ERRATAS "$TMP/err" REMOCOES "$TMP/rem"
roda g2g3 "$REF_BASE" "$REF_TROCA"; espera_reprova 'REMOÇÃO DECLARADA E NÃO USADA'

titulo "CN-D34d — a remoção declarada SEM razão"
echo "remoção declarada: $REM_SEM_RAZAO"
lista err ""; lista rem "$REM_SEM_RAZAO"
prepara g2g3 ERRATAS "$TMP/err" REMOCOES "$TMP/rem"
roda g2g3 "$REF_BASE" "$REF_SEMCOM"; espera_reprova 'REMOÇÃO SEM RAZÃO'

titulo "CP-D34 — remoção usada AO LADO de uma errata usada"
lista err "$ERR_USADA"; lista rem "$REM_USADA"
prepara g2g3 ERRATAS "$TMP/err" REMOCOES "$TMP/rem"
roda g2g3 "$REF_BASE" "$REF_AMBOS"; espera_passa

# --- O passo de integridade dos congelados ---------------------------------
# O TEXTO do passo, igual ao do `ci.yml` (o CN-223b confere que é igual). Roda
# sobre uma CÓPIA das duas pastas tiradas da árvore de trabalho da RAIZ — o
# que está no disco agora, não o HEAD.
PASSO='F=0
for d in docs/native/DESIGN-V1 docs/native/DESIGN-N2; do
  echo "== $d"
  (cd "$d" && shasum -a 256 -c SHA256SUMS) || F=1
done
exit $F'
espelho() { # $1 = destino
  mkdir -p "$1/docs/native"
  cp -R "$RAIZ/docs/native/DESIGN-V1" "$RAIZ/docs/native/DESIGN-N2" "$1/docs/native/"
}
roda_passo() { # $1 = diretório
  (cd "$1" && sh -c "$PASSO") > "$TMP/saida" 2>&1
  E=$?
  sed 's/^/  /' "$TMP/saida"
  echo "  exit=$E"
}

titulo "CN-223a — um byte alterado numa cópia do telas.html do V1"
espelho "$TMP/esp-cn"
printf 'X' | dd of="$TMP/esp-cn/docs/native/DESIGN-V1/telas.html" bs=1 seek=100 conv=notrunc 2>/dev/null
roda_passo "$TMP/esp-cn"
espera_reprova 'telas.html: FAILED'

titulo "CP-223 — a cópia intacta da árvore de trabalho"
espelho "$TMP/esp-cp"
roda_passo "$TMP/esp-cp"
espera_passa

titulo "CN-223b — o passo está no job gates-nativos do ci.yml, com o mesmo texto"
# W4-b2: o job `gates-nativos` saiu do `ci.yml` para o `gates.yml`. O CN
# procura onde ele estiver — o que ele afirma é o passo no JOB, não o arquivo.
CI="$RAIZ/.github/workflows/ci.yml"
[ -f "$RAIZ/.github/workflows/gates.yml" ] && CI="$RAIZ/.github/workflows/gates.yml"
FALTA=0
printf '%s\n' "$PASSO" | sed 's/^ *//' > "$TMP/passo"
sed -n '/^  gates-nativos:/,/^  [a-z]/p' "$CI" | sed 's/^ *//' > "$TMP/job"
while IFS= read -r L; do
  if grep -qxF -- "$L" "$TMP/job"; then echo "  presente: $L"
  else echo "  AUSENTE:  $L"; FALTA=1; fi
done < "$TMP/passo"
# Linha a linha não basta: as seis têm de estar JUNTAS, na ordem.
if [ "$FALTA" -eq 0 ] && ! tr '\n' '\001' < "$TMP/job" | grep -qF -- "$(tr '\n' '\001' < "$TMP/passo")"; then
  echo "  as linhas estão no job, mas não formam o bloco contíguo do passo"; FALTA=1
fi
if [ "$FALTA" -eq 0 ]; then echo "  o passo está no gates-nativos ✓"
else echo "  *** CN REPROVADO: o CI não roda o shasum -c dos congelados ***"; fi
echo
