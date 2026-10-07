#!/bin/sh
# N4-PR8 — A RECEITA DO CACHE SEM DADO REAL NO APARELHO (N4-D102 [Marcel, 2026-10-07]; div. 1113; APARATO.md, "O cache
# do app no Tab"). A receita antiga (N4-D98) guardava por cópia e tirava do aparelho só o ARQUIVO real: o content.json e
# o files-index.json reais ficavam, e uma abertura do app fora de ordem (antes do mock) fez a garantia de arquivos
# (N4-R26) buscar em prod o PDF que a lista real dizia existir. Aqui o aparelho fica SEM DADO REAL enquanto o mock roda.
#
#   receita-cache.sh <serial> guardar  <dir-host>                    passos 1 e 2
#   receita-cache.sh <serial> regravar <dir-host> [nome-da-fixture…]  passo 4
#
# guardar  (1) com o app parado, copia por `exec-out run-as … cat` TODO o cache real da sessão — os três .json da pasta
#              `files/octavia-<uid>/`, cada arquivo de `files/octavia-<uid>/files/` e de `cache/octavia-<uid>/files/`
#              (a demanda) —, os `._*` fora (ficam onde estão, decisão do Marcel, N3-PR6c); escreve o MANIFESTO
#              (caminho relativo e md5 do aparelho) e confere o md5 de cada cópia — diferente, PARA;
#          (2) apaga do aparelho, POR NOME, cada caminho do manifesto (uma string só no `sh -c`, nada de curinga), e
#              confere pelo `ls` que nenhum deles ficou — ficou, PARA.
# O passo 3 (o mock e os túneis de pé, o bundle apontando para o mock, ANTES de qualquer abertura do app) é do arnês.
# regravar (4) apaga POR NOME, nas duas pastas de arquivos, os nomes da fixture que vierem como argumento (só esses: um
#              nome com `/` ou `*` é recusado); regrava cada caminho do manifesto por `exec-in run-as … cat >`; confere
#              o md5 do aparelho contra o do manifesto, um a um — diferente, PARA. Só depois disto se volta ao release.
set -e
ADB=~/Library/Android/sdk/platform-tools/adb
S=$1; ACAO=$2; H=$3; shift 3
PKG=rocks.octavia.app
RA() { $ADB -s "$S" shell "run-as $PKG sh -c '$1'"; }
[ -n "$S" ] && [ -n "$H" ] || { echo "uso: receita-cache.sh <serial> guardar|regravar <dir-host> [nomes…]" >&2; exit 2; }
$ADB -s "$S" shell am force-stop $PKG
U=$(RA 'ls files' | tr -d '\r' | grep '^octavia-' | head -1)
[ -n "$U" ] || { echo "PARA: sem pasta octavia-<uid> em files/" >&2; exit 1; }
echo "sessão: files/$U · cache/$U"

case "$ACAO" in
guardar)
  mkdir -p "$H"; : > "$H/MANIFESTO"; : > "$H/MANIFESTO.caminhos"
  for n in setlists.json content.json files-index.json; do
    RA "test -f files/$U/$n" >/dev/null 2>&1 && echo "files/$U/$n" >> "$H/MANIFESTO.caminhos" || true
  done
  for d in "files/$U/files" "cache/$U/files"; do
    RA "ls $d 2>/dev/null" | tr -d '\r' | grep -v '^\._' | grep -v '^$' | while read -r n; do echo "$d/$n" >> "$H/MANIFESTO.caminhos"; done
  done
  while read -r c; do
    m=$(RA "md5sum \"$c\"" | tr -d '\r' | awk '{print $1}')
    mkdir -p "$H/$(dirname "$c")"
    $ADB -s "$S" exec-out run-as $PKG cat "$c" > "$H/$c"
    h=$(md5 -q "$H/$c")
    [ "$m" = "$h" ] || { echo "PARA: md5 da cópia diferente em $c ($m × $h)" >&2; exit 1; }
    echo "$m  $c" >> "$H/MANIFESTO"
  done < "$H/MANIFESTO.caminhos"
  rm -f "$H/MANIFESTO.caminhos"
  echo "== (1) guardado, md5 a md5 igual à cópia: $(wc -l < "$H/MANIFESTO" | tr -d ' ') caminho(s)"; cat "$H/MANIFESTO"
  alvo=$(awk '{printf "%s ", $2}' "$H/MANIFESTO")
  [ -n "$alvo" ] && RA "rm -f $alvo"
  for c in $(awk '{print $2}' "$H/MANIFESTO"); do
    RA "test -e $c" >/dev/null 2>&1 && { echo "PARA: $c continua no aparelho" >&2; exit 1; } || true
  done
  echo "== (2) tirado por nome; o que sobrou na pasta da sessão (ls):"
  RA "ls -la files/$U files/$U/files cache/$U/files"
  ;;
regravar)
  for n in "$@"; do case "$n" in */*|*'*'*|''|.|..) echo "PARA: nome recusado: $n" >&2; exit 1;; esac; done
  if [ $# -gt 0 ]; then
    alvo=""; for n in "$@"; do alvo="$alvo files/$U/files/$n cache/$U/files/$n"; done
    RA "rm -f $alvo"; echo "== (4) apagados por nome, o que a fixture criou: $*"
  fi
  while read -r m c; do
    $ADB -s "$S" exec-in run-as $PKG sh -c "cat > \"$c\"" < "$H/$c"
    d=$(RA "md5sum \"$c\"" | tr -d '\r' | awk '{print $1}')
    [ "$d" = "$m" ] || { echo "PARA: md5 regravado diferente em $c ($m × $d)" >&2; exit 1; }
    echo "  ok $m  $c"
  done < "$H/MANIFESTO"
  echo "== (4) regravado, md5 a md5 igual ao manifesto: $(wc -l < "$H/MANIFESTO" | tr -d ' ') caminho(s)"
  RA "ls -la files/$U files/$U/files cache/$U/files"
  ;;
*) echo "ação desconhecida: $ACAO" >&2; exit 2 ;;
esac
