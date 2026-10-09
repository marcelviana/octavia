#!/bin/sh
# QL-PR3 — os controles negativos do G-N3 com a REFERÊNCIA LÓGICA À PARTE (`--logico`; decisão do Marcel na QL-PR3, a
# opção 2; regra 4). Instrumento de anexo (fora de CI, N4-D117).
#
#   cn-g-n3-logico.sh <paisagem-quebrada.xml> <faixa.xml>        (da raiz)
#
# <paisagem-quebrada.xml>: o dump da S3a-letra-1a em C COM a quebra (o que a B3 passa a ter depois da errata em par);
# <faixa.xml>: o mesmo estado em B (retrato). A referência lógica é a de `docs/native/QL-PR3-anexos/b3-pre-ql/`. Cada caso
# monta, num diretório temporário, a paisagem e a faixa (com o defeito plantado, ou não) e roda o `g-n3.mjs` da árvore.
set -u
PAI=$1; FX=$2
LOG=docs/native/QL-PR3-anexos/b3-pre-ql
PRE=$LOG/$(basename "$PAI" | sed 's/^[^-]*-/REF-/')
[ -f "$PRE" ] || { echo "sem a referência pré-QL $PRE" >&2; exit 2; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
F=0
# planta(<arquivo>, <python que muda o texto do corpo: recebe t, devolve t>) — o `text` do nó corpo (entidades XML)
planta() {
  python3 - "$1" "$2" <<'EOF'
import sys, re, html
p, expr = sys.argv[1], sys.argv[2]
s = open(p).read()
m = re.search(r'(<node [^>]*resource-id="corpo"[^>]*?\btext=")([^"]*)(")', s) or re.search(r'(text=")([^"]*)("[^>]*resource-id="corpo")', s)
t = html.unescape(m.group(2).replace("&#10;", "\n"))
t = eval(expr, {"t": t, "re": re})
novo = html.escape(t, quote=True).replace("\n", "&#10;").replace("&#x27;", "'")
open(p, "w").write(s[:m.start(2)] + novo + s[m.end(2):])
EOF
}
# alarga(<arquivo>) — o TextView do corpo até a borda direita da rolagem horizontal (o texto passa da coluna)
alarga() {
  python3 - "$1" <<'EOF'
import sys, re
p = sys.argv[1]; s = open(p).read()
i = s.index('resource-id="corpo"'); h = s.rfind("HorizontalScrollView", 0, i)
x1 = re.compile(r'bounds="\[\d+,\d+\]\[(\d+),').search(s, h).group(1)
m = re.compile(r'bounds="\[\d+,\d+\]\[(\d+),').search(s, i)
open(p, "w").write(s[:m.start(1)] + x1 + s[m.end(1):])
EOF
}
caso() { # caso <rótulo> <espera: passa|reprova> <razão> <paisagem> <faixa> [--sem-logico]
  rm -rf "$T/p" "$T/f"; mkdir -p "$T/p" "$T/f"
  cp "$4" "$T/p/REF-$(basename "$PAI" | sed 's/^[^-]*-//')"; cp "$5" "$T/f/$(basename "$FX")"
  if [ "${6:-}" = --sem-logico ]; then S=$(node apps/native/scripts/g-n3.mjs --pai "$T/p" --faixa "$T/f" 2>&1); else S=$(node apps/native/scripts/g-n3.mjs --pai "$T/p" --faixa "$T/f" --logico "$LOG" 2>&1); fi
  X=$?
  V=$(printf '%s\n' "$S" | grep '^G-N3:'); M=$(printf '%s\n' "$S" | grep -E '^  .*corpo' | head -1)
  if [ "$2" = passa ]; then [ $X -eq 0 ] && R=ok || R=FALHOU; else { [ $X -ne 0 ] && printf '%s' "$S" | grep -q "$3"; } && R=ok || R=FALHOU; fi
  [ "$R" = ok ] || F=1
  echo "$1 — espera $2: exit $X · $R"
  echo "    $V"
  [ -n "$M" ] && echo "    $(printf '%s' "$M" | cut -c1-240)"
}
echo "== CN do G-N3 com a referência lógica à parte — $(basename "$PAI") × $(basename "$FX") · referência $(basename "$PRE") ($(shasum -a 256 "$PRE" | cut -c1-12))"
caso "CP   a quebra válida (C e B quebrados como o app os desenha)" passa "" "$PAI" "$FX"
cp "$PAI" "$T/pai1.xml"; cp "$FX" "$T/fx1.xml"
planta "$T/pai1.xml" 't.replace("noite ", "", 1)'; planta "$T/fx1.xml" 't.replace("noite ", "", 1)'
caso "CN-1 a mesma palavra perdida em C e em B" reprova "não é uma quebra do corpo pré-QL" "$T/pai1.xml" "$T/fx1.xml"
cp "$FX" "$T/fx2.xml"; planta "$T/fx2.xml" 't.replace("metrônomo", "metrônomO", 1)'
caso "CN-2 uma letra trocada só na faixa" reprova "a faixa não é uma quebra" "$PAI" "$T/fx2.xml"
caso "CN-3a a linha que deveria quebrar e não quebrou (a paisagem pré-QL, a de 110 inteira)" reprova "na paisagem uma linha passa da coluna" "$PRE" "$FX"
cp "$FX" "$T/fx3.xml"; alarga "$T/fx3.xml"
caso "CN-3b a linha que deveria quebrar e não quebrou na faixa (o corpo até a borda da rolagem)" reprova "na faixa uma linha passa da coluna" "$PAI" "$T/fx3.xml"
caso "CN-5 a quebra válida SEM o --logico (o G-N3 de antes da referência à parte)" reprova "(e)=" "$PAI" "$FX" --sem-logico
[ $F -eq 0 ] && echo "== todos os controles como esperado ✓" || echo "== CONTROLE FORA DO ESPERADO ✗"
exit $F
