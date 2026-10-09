#!/bin/sh
# QL-PR3 — os controles negativos do par do CORPO QUEBRADO no `g-inv-par.mjs` (regra 4: um CN que passa é tão
# suspeito quanto um gate que nunca acusa; regra 33). Instrumento de anexo (fora de CI, N4-D117).
#
#   cn-g-inv-par-corpo.sh <dir-dos-dumps-novos> [<dir-da-base>]   (da raiz; os dumps NÃO são tocados: o CN trabalha em cópias)
#
# A base padrão é a B3 da árvore; depois da errata em par ela já é a nova, e o par se mede contra a VELHA: passe-a (por
# exemplo, extraída da `main` de antes da errata, `git show ffd8f31:…`).
#
# Para cada defeito, uma cópia temporária dos dumps novos com o defeito plantado num dos seis de Letra, e o
# `g-inv-par.mjs` da árvore contra a B3: o CP (sem defeito) tem de passar; cada CN tem de reprovar, pela razão certa.
set -u
B3=${2:-docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem}
NOVOS=$1
ALVO=$(ls "$NOVOS"/*-S3-S3a-letra-1a-*-pai.xml | head -1)
[ -n "$ALVO" ] || { echo "sem o dump novo da S3a-letra-1a em $NOVOS" >&2; exit 2; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
F=0
caso() { # caso <rótulo> <espera: passa|reprova> <razão esperada> <script python que muda $T/c/<alvo>>
  rm -rf "$T/c"; mkdir -p "$T/c"; cp "$NOVOS"/*.xml "$T/c/"
  A="$T/c/$(basename "$ALVO")"
  python3 -c "$4" "$A"
  S=$(node apps/native/scripts/g-inv-par.mjs "$B3" "$T/c" 2>&1); X=$?
  L=$(printf '%s\n' "$S" | grep "$(basename "$ALVO" .xml | sed 's/^[^-]*-//')" | head -1)
  # julga pela LINHA do alvo (os outros pares do diretório podem faltar — o Tab numa corrida só do AVD)
  if [ "$2" = passa ]; then printf '%s' "$L" | grep -q '✓' && R=ok || R=FALHOU; else { [ $X -ne 0 ] && printf '%s' "$L" | grep -q '✗' && printf '%s' "$L" | grep -q "$3"; } && R=ok || R=FALHOU; fi
  [ "$R" = ok ] || F=1
  echo "$1 — espera $2: exit $X · $R"
  echo "    $(printf '%s' "$L" | cut -c1-260)"
}
echo "== CN do par do corpo quebrado (g-inv-par.mjs) — alvo: $(basename "$ALVO")"
caso "CP   nenhum defeito" passa "" 'import sys'
caso "CN-1 outro nó muda de caixa (o zoom-mais desce 1 px)" reprova "DIFERENTES fora do corpo" '
import sys,re; p=sys.argv[1]; s=open(p).read()
m=re.search(r"(resource-id=\"zoom-mais\"[^>]*bounds=\"\[\d+,)(\d+)", s); s=s[:m.start(2)]+str(int(m.group(2))+1)+s[m.end(2):]; open(p,"w").write(s)'
caso "CN-2 uma letra trocada no corpo" reprova "NÃO é uma quebra" '
import sys,re; p=sys.argv[1]; s=open(p).read()
i=s.index("resource-id=\"corpo\""); j=s.rfind("text=\"",0,i)+6; k=j+40; s=s[:k]+("X" if s[k]!="X" else "Y")+s[k+1:]; open(p,"w").write(s)'
caso "CN-3 duas linhas do corpo fora de ordem" reprova "NÃO é uma quebra" '
import sys; p=sys.argv[1]; s=open(p).read()
i=s.index("resource-id=\"corpo\""); j=s.rfind("text=\"",0,i)+6; k=s.index("\"",j); ls=s[j:k].split("&#10;"); ls[2],ls[3]=ls[3],ls[2]; s=s[:j]+"&#10;".join(ls)+s[k:]; open(p,"w").write(s)'
caso "CN-4 o canto esquerdo do corpo anda 1 px" reprova "caixa" '
import sys,re; p=sys.argv[1]; s=open(p).read()
i=s.index("resource-id=\"corpo\""); m=re.compile(r"bounds=\"\[(\d+),").search(s,i); s=s[:m.start(1)]+str(int(m.group(1))+1)+s[m.end(1):]; open(p,"w").write(s)'
caso "CN-5 a janela da rolagem horizontal muda de caixa" reprova "mudou de caixa sem abraçar" '
import sys,re; p=sys.argv[1]; s=open(p).read()
i=s.index("resource-id=\"corpo\""); h=s.rfind("HorizontalScrollView",0,i); m=re.compile(r"bounds=\"\[\d+,\d+\]\[(\d+),").search(s,h); s=s[:m.start(1)]+str(int(m.group(1))-30)+s[m.end(1):]; open(p,"w").write(s)'
caso "CN-6 o corpo largo de novo (a direita passa da base)" reprova "caixa" '
import sys,re; p=sys.argv[1]; s=open(p).read()
i=s.index("resource-id=\"corpo\""); m=re.compile(r"bounds=\"\[\d+,\d+\]\[(\d+),").search(s,i); s=s[:m.start(1)]+"2500"+s[m.end(1):]; open(p,"w").write(s)'
[ $F -eq 0 ] && echo "== todos os controles como esperado ✓" || echo "== CONTROLE FORA DO ESPERADO ✗"
exit $F
