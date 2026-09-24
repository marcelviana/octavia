#!/bin/sh
# G-inv — a INVARIANTE C do N3 (T3-R2; N3-D3; A-N3-2). Nasceu na N3-PR1.
#
# Na faixa C (> 960 dp), os dumps em PAISAGEM são IDÊNTICOS EM DP à linha de
# base, nó a nó, para toda tela e estado da base, no Tab e no AVD. É gate do
# bloco: toda PR de implementação do N3 o roda, e uma diferença de `bounds` em C
# reprova — inclusive as que vierem da T3-R7 (a linha de aviso que cresce) e dos
# tokens por faixa (N3-D25).
#
# O QUE COMPARA. A árvore do dump em dp, na forma do `W4B3-anexos/dp.mjs` (a
# invariante "idêntico em dp" do W4-b3), sem `enabled`/`clickable`: por nó do
# pacote do app, na ordem do dump, `classe resource-id [x0,y0][x1,y1]` com os
# `bounds` ÷ fator (2,25 no tablet; 2,625 se o nome disser `phone`) arredondados
# a 0,1 dp. Nenhum texto entra na comparação — só a posição que ele ocupa. Uma
# diferença de CONTAGEM de nós (um nó que some ou nasce) também reprova.
#
# O QUE NÃO COMPARA. `enabled`/`clickable` (estado, não geometria); os nós de
# outro pacote (teclado, barra do sistema); e a SUBÁRVORE do `ComposeView` — o
# botão "Tools" do dev client, mesmo pacote, que só existe no dev client e muda
# de tamanho sozinho (expande com o rótulo "Tools" por alguns segundos depois de
# carregar o bundle; medido na N3-PR1: 84 × 126 na base, 84 × 84 no novo, no
# mesmo estado). O `inventario.mjs` do pre-check e o `g-n3.mjs` já o tiram da
# conta pela mesma razão (`APARATO.md`, "O dev client…"). O `dp.mjs` do W4-b3
# o incluía; lá os dois lados eram capturados na mesma sessão.
#
# O QUE O DUMP NÃO SEPARA, E O ARNÊS TEM DE REPRODUZIR. Geometria que depende
# de ESTADO DE DADOS entra na comparação e reprova, porque não há como o gate
# distinguir "o layout mudou" de "o dado mudou": o arco do ◔ desenha a fração
# de arquivos no disco ("1 de 2" × "0 de 2"), e a largura de "há 1 min" ×
# "agora" é texto vivo. O remédio é o arnês capturar no MESMO estado da base
# (os arquivos que ela tinha, o tempo desde o sync) — ver `N3-PR1-anexos/`.
#
# PAREAMENTO. Pelo nome, que é afirmação (caso 23): `<PREFIXO>-<resto>.xml`, e a
# chave é `<resto>` — `B5-S1-setlists-avd-pai.xml` na base casa com
# `<QUALQUER>-S1-setlists-avd-pai.xml` nos novos. **Toda chave da base tem de
# ter o seu dump novo**: a invariante é "para toda tela e estado da linha de
# base", e um gate que passasse com um dump só não afirmaria nada. Dump novo sem
# chave na base é listado e fica fora (pode ser de outra faixa).
# A raiz de cada dump tem de estar em paisagem (mais larga que alta), nos dois
# lados: o nome diz `-pai`, a raiz confere.
#
# Uso (da RAIZ do repositório):
#   sh apps/native/scripts/g-inv.sh <dir-da-base> <dir-dos-novos>
# Ex.: sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B5-baseline <dumps>
# Exit 0 = idêntico; 1 = reprova (imprime o nó); 2 = chamada que não mede nada.
BASE=$1; NOVOS=$2
uso() {
  echo "g-inv.sh: $1" >&2
  echo "uso: sh apps/native/scripts/g-inv.sh <dir-da-base> <dir-dos-novos>" >&2
  echo "     da RAIZ do repositório. Um gate de invariância sem par não mede nada." >&2
  exit 2
}
[ -n "$BASE" ] || uso "falta <dir-da-base>"
[ -n "$NOVOS" ] || uso "falta <dir-dos-novos>"
[ -d "$BASE" ] || uso "<dir-da-base> não é diretório: $BASE"
[ -d "$NOVOS" ] || uso "<dir-dos-novos> não é diretório: $NOVOS"
ls "$BASE"/*.xml > /dev/null 2>&1 || uso "nenhum .xml em $BASE"

# A árvore em dp de um dump, uma linha por nó do app; a 1ª linha é a raiz
# (larg alt) para a guarda de orientação.
dp() {
  case "$(basename "$1")" in *phone*) FT=2.625 ;; *) FT=2.25 ;; esac
  grep -oE '<node [^>]*>|</node>' "$1" | awk -v F="$FT" '
    function at(k,   r) { if (match($0, " " k "=\"[^\"]*\"")) { r = substr($0, RSTART + length(k) + 3, RLENGTH - length(k) - 4); return r } return "" }
    function d(v) { v = v / F; return sprintf("%.1f", (v >= 0 ? int(v * 10 + 0.5) : -int(-v * 10 + 0.5)) / 10) }
    $0 == "</node>" { prof--; if (fora && prof < fora) fora = 0; next }
    {
      aberto = ($0 !~ /\/>$/)
      if (aberto) prof++
      if (fora) next
      if (at("class") ~ /ComposeView$/) { if (aberto) fora = prof; next }
      if (at("package") != "rocks.octavia.app") next
      split(at("bounds"), b, /[^0-9-]+/)
      id = at("resource-id"); sub(/^.*:id\//, "", id); if (id == "") id = "-"
      if (!raiz) { raiz = 1; print "RAIZ " d(b[4] - b[2]) " " d(b[5] - b[3]) }
      print at("class") " " id " [" d(b[2]) "," d(b[3]) "][" d(b[4]) "," d(b[5]) "]"
    }'
}
paisagem() {  # a 1ª linha do dp: RAIZ <larg> <alt>
  awk 'NR == 1 { exit !($2 + 0 > $3 + 0) }' "$1"
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
F=0; N=0; OK=0
echo "G-inv — invariante C (T3-R2): bounds em dp, nó a nó"
echo "  base:  $BASE"
echo "  novos: $NOVOS"
for b in "$BASE"/*.xml; do
  nb=$(basename "$b" .xml); chave=${nb#*-}
  novo=$(ls "$NOVOS"/*-"$chave".xml 2>/dev/null | head -1)
  N=$((N + 1))
  if [ -z "$novo" ]; then
    echo "  ✗ $chave: SEM DUMP NOVO — a invariante é para toda tela e estado da base"
    F=1; continue
  fi
  dp "$b" > "$tmp/a"; dp "$novo" > "$tmp/b"
  if ! paisagem "$tmp/a"; then echo "  ✗ $chave: a BASE não está em paisagem ($(head -1 "$tmp/a"))"; F=1; continue; fi
  if ! paisagem "$tmp/b"; then echo "  ✗ $chave: o dump novo não está em paisagem ($(head -1 "$tmp/b")) — $(basename "$novo")"; F=1; continue; fi
  if cmp -s "$tmp/a" "$tmp/b"; then
    echo "  ✓ $chave: idêntico ($(($(wc -l < "$tmp/a") - 1)) nós)"; OK=$((OK + 1))
  else
    echo "  ✗ $chave: DIFERENTE — base $(($(wc -l < "$tmp/a") - 1)) nós, novo $(($(wc -l < "$tmp/b") - 1)) ($(basename "$novo"))"
    diff "$tmp/a" "$tmp/b" | grep '^[<>]' | sed 's/^</      base:/; s/^>/      novo:/' | head -40
    F=1
  fi
done
for n in "$NOVOS"/*.xml; do
  [ -e "$n" ] || continue
  nn=$(basename "$n" .xml); chave=${nn#*-}
  ls "$BASE"/*-"$chave".xml > /dev/null 2>&1 || echo "  · $nn: sem chave na base (fora da conta)"
done
echo "G-inv: $OK de $N idênticos"
if [ $F -eq 0 ]; then echo "G-inv: IDÊNTICO EM DP ✓"; else echo "G-inv: REPROVA ✗"; fi
exit $F
