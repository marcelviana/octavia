#!/bin/sh
# CN — os controles do W4-b2. Instrumento DE MÃO, pela razão do `cn-w4b1.sh`:
# fabrica refs numa worktree descartável, e um job que fabrica commit para
# provar um ponto não é gate. O que entra no repositório é a SAÍDA dele, em
# `docs/native/W4B2-anexos/`.
#
# Uso (da RAIZ do repositório): sh apps/native/scripts/__cn__/cn-w4b2.sh
#
# H1 — o APK condicionado ao PUSH, não à PR (B8.1). O detector é
# `apps/native/scripts/mudou-nativo.sh <ação> <antes> <head>`, que imprime
# `nativo=true|false`. A metade que só o CI mede — dois pushes nesta própria
# PR, um nativo e um só de docs — está no README dos anexos, com os
# `gh pr checks`.
#
#   CN-H1a  synchronize, o push só toca docs            → nativo=false
#   CP-H1b  synchronize, o push toca apps/native/src    → nativo=true
#   CP-H1c  synchronize, o push toca o native.yml       → nativo=true
#   CP-H1d  synchronize, o push toca o pnpm-workspace   → nativo=true
#   CP-H1e  push forçado: `antes` não é ancestral       → nativo=true
#   CP-H1f  opened (sem `antes`)                        → nativo=true
#   CN-H1g  o `native.yml` usa o detector: job `mudou-nativo` e o
#           `android-debug-apk` com `needs` + `if`.
#
# H3 — as declarações dos gates saem da `main` e vêm do corpo da PR, num bloco
# ```gates … ``` lido por `apps/native/scripts/gates-decl.sh`; os scripts as
# leem de `GATES_DECL`.
#
#   CP-H3a  exceção do G1a no corpo, e não no script, arquivo mudado → passa
#   CN-H3b  exceção nem no corpo nem no script, arquivo mudado       → reprova
#   CN-H3c  lista local NÃO vazia com GATES_DECL (o CI)              → reprova
#   CN-H3d  exceção no corpo e NÃO usada                             → reprova
#   CP-H3e  exceção + par do G1b + errata do G3, todos no corpo      → passa (g1 e g2g3)
#   CN-H3f  o mesmo corpo sem a errata                               → g2g3 reprova
#   CP-H3g  remoção do G3 no corpo                                   → passa
#   CN-H3h  extrator: chave desconhecida                             → reprova
#   CN-H3i  extrator: dois blocos                                    → reprova
#   CN-H3j  extrator: bloco não fechado                              → reprova
#   CN-H3k  extrator: par do G1b fora de ordem                       → reprova
#   CP-H3l  extrator: CRLF, prosa em volta, comentário e linha branca → extrai só as chaves
#   CP-H3m  extrator: corpo sem bloco                                → saída vazia, exit 0
#   CN-H3n  o `gates.yml` existe, dispara em `edited`, chama o extrator e
#           exporta GATES_DECL; o `ci.yml` não tem mais o `gates-nativos`.
#   CP-H3o  as listas locais da árvore de trabalho estão VAZIAS (a poda).

RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
TMP=$(mktemp -d)
WT="$TMP/wt"
ALVO="apps/native/src/store.ts"          # em escopo do G1a e do G3
ORFAO_G1A="apps/native/src/api.ts"      # existe, e nenhum ref o toca
TESTE="packages/core/src/search.test.ts" # em escopo do G1b
DOC="docs/native/LOGS-OCTAVIA.md"
DECL="$RAIZ/apps/native/scripts/gates-decl.sh"
MUDOU="$RAIZ/apps/native/scripts/mudou-nativo.sh"

limpar() {
  git -C "$RAIZ" worktree remove --force "$WT" >/dev/null 2>&1
  rm -rf "$TMP"
}
trap limpar EXIT INT TERM

# --- Injeção de lista local (a do `cn-w4b1.sh`, igual) -----------------------
injeta() { # $1 = script  $2 = VAR  $3 = arquivo com as linhas ; stdout = script
  awk -v V="$2" -v F="$3" '
    function emite(   n, l) {
      n = 0
      while ((getline l < F) > 0) a[++n] = l
      close(F)
      if (n == 0) { print V "=\047\047"; return }
      print V "=$(cat <<\047__CN_W4B2__\047"
      for (i = 1; i <= n; i++) print a[i]
      print "__CN_W4B2__"
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
# Cópias dos dois scripts com as listas LOCAIS vazias — o estado da `main` que
# H3 quer. Um controle que precise de lista local não vazia injeta a sua.
: > "$TMP/vazia"
prepara() { # $1 = g1|g2g3 ; pares VAR arquivo opcionais
  G=$1; shift
  cp "$RAIZ/apps/native/scripts/$G.sh" "$TMP/$G-cn.sh"
  while [ $# -gt 0 ]; do
    injeta "$TMP/$G-cn.sh" "$1" "$2" > "$TMP/$G-cn.tmp" && mv "$TMP/$G-cn.tmp" "$TMP/$G-cn.sh"
    shift 2
  done
  cp "$RAIZ/apps/native/scripts/sem-comentario.awk" "$TMP/"
}
prepara_vazias() {
  prepara g1 EXCECOES "$TMP/vazia" PARES_G1B "$TMP/vazia"
  prepara g2g3 ERRATAS "$TMP/vazia" REMOCOES "$TMP/vazia"
}

titulo() {
  echo
  echo "=============================================================================="
  echo "$1"
  echo "=============================================================================="
}
# O corpo da PR → as declarações, pelo extrator. Sem extrator (o script de
# antes), a declaração fica vazia e o gate nem a lê: é o "hoje".
extrai() { # $1 = arquivo do corpo ; escreve $TMP/decl, exit em $X
  if [ -f "$DECL" ]; then
    sh "$DECL" < "$1" > "$TMP/decl" 2> "$TMP/decl.err"; X=$?
  else
    echo "  [gates-decl.sh ausente — o mecanismo não existe]"; : > "$TMP/decl"; : > "$TMP/decl.err"; X=127
  fi
}
roda() { # $1 = g1|g2g3  $2 = base  $3 = depois ; usa $TMP/decl
  GATES_DECL="$TMP/decl" sh "$TMP/$1-cn.sh" "$2" "$3" > "$TMP/saida" 2>&1
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
corpo() { printf '%s\n' "$1" > "$TMP/corpo"; } # $1 = o corpo da PR

echo "cn-w4b2 — scripts lidos de: $RAIZ (árvore de trabalho), HEAD $(git rev-parse --short HEAD)"

# --- Os refs fabricados -----------------------------------------------------
git worktree add -q --detach "$WT" HEAD || exit 1
cd "$WT" || exit 1
COMENT='// log(`cn-w4b2 comentario`)'
VELHA='log(`cn-w4b2 linha=velha n=${n}`)'
printf '\n// CN do W4-b2 — linhas fabricadas, jogadas fora com a worktree.\n%s\nexport function __cnW4b2(n) { %s }\n' "$COMENT" "$VELHA" >> "$ALVO"
printf '\n// cn-w4b2 linha=velha\n' >> "$TESTE"
git add "$ALVO" "$TESTE" && git commit -qm 'CN W4-b2: BASE'
REF_BASE=$(git rev-parse HEAD)

de_base() { # $1 = mensagem ; o resto é o comando que muda a árvore
  M=$1; shift
  git checkout -q "$REF_BASE" && "$@" && git add -A && git commit -qm "CN W4-b2: $M" && git rev-parse HEAD
}
so_docs()   { printf '\ncn-w4b2: push só de docs\n' >> "$DOC"; }
nativo()    { printf '\n// cn-w4b2: push nativo\n' >> "$ALVO"; }
yml()       { printf '\n# cn-w4b2\n' >> .github/workflows/native.yml; }
workspace() { printf '\n# cn-w4b2\n' >> pnpm-workspace.yaml; }
troca()     { for f in "$ALVO" "$TESTE"; do sed 's|cn-w4b2 linha=velha|cn-w4b2 linha=nova|' "$f" > "$f.n" && mv "$f.n" "$f"; done; }
sem_coment() { grep -vF -- "$COMENT" "$ALVO" > "$ALVO.n"; mv "$ALVO.n" "$ALVO"; }
REF_DOCS=$(de_base 'só docs' so_docs)
REF_NATIVO=$(de_base 'nativo' nativo)
REF_YML=$(de_base 'native.yml' yml)
REF_WS=$(de_base 'pnpm-workspace' workspace)
REF_TROCA=$(de_base 'velha -> nova (log e teste)' troca)
REF_SEMCOM=$(de_base 'o comentario com log( SAI' sem_coment)
# O push forçado: um `antes` que NÃO é ancestral do head. REF_DOCS e
# REF_NATIVO são irmãos — nenhum é ancestral do outro.
git checkout -q "$REF_BASE"

# =============================================================================
# H1
# =============================================================================
h1() { # $1 = rótulo  $2 = ação  $3 = antes  $4 = head  $5 = esperado
  titulo "$1"
  if [ ! -f "$MUDOU" ]; then
    echo "  [mudou-nativo.sh ausente — o detector não existe]"
    echo "  *** o esperado era nativo=$5 ***"
    return
  fi
  sh "$MUDOU" "$2" "$3" "$4" > "$TMP/h1" 2> "$TMP/h1.err"; E=$?
  sed 's/^/  (stderr) /' "$TMP/h1.err"; sed 's/^/  /' "$TMP/h1"; echo "  exit=$E"
  if [ "$E" -ne 0 ]; then echo "  *** o detector saiu com $E ***"
  elif grep -qx "nativo=$5" "$TMP/h1"; then echo "  nativo=$5, como esperado ✓"
  else echo "  *** o esperado era nativo=$5 ***"; fi
}
h1 'CN-H1a  synchronize, só docs' synchronize "$REF_BASE" "$REF_DOCS" false
h1 'CP-H1b  synchronize, apps/native/src' synchronize "$REF_BASE" "$REF_NATIVO" true
h1 'CP-H1c  synchronize, o native.yml' synchronize "$REF_BASE" "$REF_YML" true
h1 'CP-H1d  synchronize, o pnpm-workspace.yaml' synchronize "$REF_BASE" "$REF_WS" true
h1 'CP-H1e  push forçado — antes (só docs) não é ancestral do head' synchronize "$REF_DOCS" "$REF_NATIVO" true
h1 'CP-H1f  opened — sem antes' opened '' "$REF_DOCS" true

titulo 'CN-H1g  o native.yml usa o detector'
Y="$RAIZ/.github/workflows/native.yml"
F=0
for p in '  mudou-nativo:' 'sh apps/native/scripts/mudou-nativo.sh' '    needs: mudou-nativo' "    if: needs.mudou-nativo.outputs.nativo == 'true'"; do
  if grep -qF -- "$p" "$Y"; then echo "  presente: $p"; else echo "  AUSENTE:  $p"; F=1; fi
done
if [ $F -eq 0 ]; then echo "  ✓"; else echo "  *** o native.yml não condiciona o APK ao push ***"; fi

# =============================================================================
# H3
# =============================================================================
prepara_vazias

titulo 'CP-H3a  exceção do G1a no CORPO, e não no script; o arquivo mudou → passa'
corpo "Texto da PR.

\`\`\`gates
g1a: $ALVO
\`\`\`"
extrai "$TMP/corpo"; roda g1 "$REF_BASE" "$REF_NATIVO"; espera_passa

titulo 'CN-H3b  exceção nem no corpo nem no script; o arquivo mudou → reprova'
corpo 'Texto da PR, sem bloco.'
extrai "$TMP/corpo"; roda g1 "$REF_BASE" "$REF_NATIVO"; espera_reprova 'DIFF NÃO VAZIO'

titulo 'CN-H3c  lista LOCAL não vazia, com GATES_DECL (o CI) → reprova'
printf '%s\n' "$ALVO" > "$TMP/exc.local"
prepara g1 EXCECOES "$TMP/exc.local" PARES_G1B "$TMP/vazia"
corpo "\`\`\`gates
g1a: $ALVO
\`\`\`"
extrai "$TMP/corpo"; roda g1 "$REF_BASE" "$REF_NATIVO"; espera_reprova 'LISTA LOCAL NÃO VAZIA'
printf '%s\n' "log(\`cn-w4b2 linha=velha n=\${n}\`)" "log(\`cn-w4b2 linha=nova n=\${n}\`)" > "$TMP/err.local"
prepara g2g3 ERRATAS "$TMP/err.local" REMOCOES "$TMP/vazia"
echo "  — e o irmão (g2g3), com a errata local:"
roda g2g3 "$REF_BASE" "$REF_TROCA"; espera_reprova 'LISTA LOCAL NÃO VAZIA'
prepara_vazias

titulo 'CN-H3d  exceção no corpo e NÃO usada (ao lado de uma usada) → reprova'
corpo "\`\`\`gates
g1a: $ALVO
g1a: $ORFAO_G1A
\`\`\`"
extrai "$TMP/corpo"; roda g1 "$REF_BASE" "$REF_NATIVO"; espera_reprova 'NÃO USADA'

CORPO_E="Troca da linha velha pela nova.

\`\`\`gates
# o escopo desta PR
g1a: $ALVO
g1b-velha: // cn-w4b2 linha=velha
g1b-nova: // cn-w4b2 linha=nova
g1b-razao: CN do W4-b2 — par do G1b pelo corpo
g3-velha: log(\`cn-w4b2 linha=velha n=\${n}\`)
g3-nova: log(\`cn-w4b2 linha=nova n=\${n}\`)
\`\`\`"
titulo 'CP-H3e  exceção + par do G1b + errata do G3, tudo no corpo → passa (g1 e g2g3)'
corpo "$CORPO_E"
extrai "$TMP/corpo"; echo "  declarações extraídas:"; sed 's/^/    /' "$TMP/decl"
roda g1 "$REF_BASE" "$REF_TROCA"; espera_passa
roda g2g3 "$REF_BASE" "$REF_TROCA"; espera_passa

titulo 'CN-H3f  o mesmo corpo SEM a errata → o g2g3 reprova'
corpo "$(printf '%s\n' "$CORPO_E" | grep -v '^g3-')"
extrai "$TMP/corpo"; roda g2g3 "$REF_BASE" "$REF_TROCA"; espera_reprova 'SEM ERRATA'

titulo 'CP-H3g  remoção do G3 no corpo → passa'
corpo "\`\`\`gates
g1a: $ALVO
g3-removida: $COMENT → REMOVIDA: CN do W4-b2 — o comentário que citava a linha saiu
\`\`\`"
extrai "$TMP/corpo"; roda g2g3 "$REF_BASE" "$REF_SEMCOM"; espera_passa

ext() { # $1 = rótulo  $2 = corpo  $3 = reprova|passa  $4 = texto esperado no stderr
  titulo "$1"
  corpo "$2"; extrai "$TMP/corpo"
  sed 's/^/  (stdout) /' "$TMP/decl"; sed 's/^/  (stderr) /' "$TMP/decl.err"; echo "  exit=$X"
  if [ "$X" -eq 127 ]; then echo "  *** o extrator não existe ***"; return; fi
  if [ "$3" = reprova ]; then
    if [ "$X" -ne 0 ]; then echo "  reprovou ✓"; else echo "  *** CN REPROVADO: o extrator aceitou ***"; fi
    if grep -qF -- "$4" "$TMP/decl.err"; then echo "  e disse \"$4\" ✓"; else echo "  *** o stderr não traz \"$4\" ***"; fi
  else
    if [ "$X" -eq 0 ]; then echo "  passou ✓"; else echo "  *** CP REPROVADO ***"; fi
  fi
}
ext 'CN-H3h  extrator: chave desconhecida' "\`\`\`gates
g1: $ALVO
\`\`\`" reprova 'chave desconhecida'
ext 'CN-H3i  extrator: dois blocos' "\`\`\`gates
g1a: $ALVO
\`\`\`
e mais adiante
\`\`\`gates
g1a: $ORFAO_G1A
\`\`\`" reprova 'mais de um bloco'
ext 'CN-H3j  extrator: bloco não fechado' "\`\`\`gates
g1a: $ALVO" reprova 'não fechado'
ext 'CN-H3k  extrator: par do G1b fora de ordem' "\`\`\`gates
g1b-nova: b
g1b-velha: a
g1b-razao: r
\`\`\`" reprova 'fora de ordem'
ext 'CP-H3l  extrator: CRLF, prosa em volta, comentário e linha em branco' "$(printf 'Resumo da PR.\r\n\r\n```gates\r\n# comentário\r\n\r\ng1a: %s\r\n```\r\n\r\nFim.\r' "$ALVO")" passa
if [ "$X" -ne 127 ]; then
  if [ "$(cat "$TMP/decl")" = "g1a: $ALVO" ]; then echo "  a saída é exatamente \"g1a: $ALVO\", sem \\r ✓"
  else echo "  *** a saída não é exatamente \"g1a: $ALVO\" ***"; fi
fi
ext 'CP-H3m  extrator: corpo sem bloco' 'Só prosa, nenhum bloco.' passa
if [ "$X" -ne 127 ] && [ ! -s "$TMP/decl" ]; then echo "  saída vazia ✓"; fi

titulo 'CN-H3n  o gates.yml lê o corpo; o ci.yml não tem mais o gates-nativos'
G="$RAIZ/.github/workflows/gates.yml"
F=0
if [ -f "$G" ]; then
  for p in '  gates-nativos:' 'edited' 'sh apps/native/scripts/gates-decl.sh' 'GATES_DECL=' 'sh apps/native/scripts/g1.sh' 'sh apps/native/scripts/g2g3.sh' 'shasum -a 256 -c SHA256SUMS'; do
    if grep -qF -- "$p" "$G"; then echo "  gates.yml, presente: $p"; else echo "  gates.yml, AUSENTE:  $p"; F=1; fi
  done
else
  echo "  gates.yml AUSENTE"; F=1
fi
if grep -q '^  gates-nativos:' "$RAIZ/.github/workflows/ci.yml"; then echo "  ci.yml ainda define o gates-nativos"; F=1
else echo "  ci.yml sem o gates-nativos"; fi
if [ $F -eq 0 ]; then echo "  ✓"; else echo "  *** o CI não lê as declarações da PR ***"; fi

titulo 'CP-H3o  as listas locais da árvore de trabalho estão vazias (a poda)'
F=0
for v in "g1.sh EXCECOES" "g1.sh PARES_G1B" "g2g3.sh ERRATAS" "g2g3.sh REMOCOES"; do
  set -- $v
  L=$(grep -n "^$2=" "$RAIZ/apps/native/scripts/$1" | head -1)
  echo "  $1: $L"
  case "$L" in *"$2=''") ;; *) F=1 ;; esac
done
if [ $F -eq 0 ]; then echo "  ✓"; else echo "  *** há lista local não vazia ***"; fi

echo
echo "fim — linhas '***' acima são controles reprovados."
