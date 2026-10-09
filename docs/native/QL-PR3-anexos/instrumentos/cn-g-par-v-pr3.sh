#!/bin/sh
# QL-PR3 — os controles negativos do G-par de V com o LEITOR QUE QUEBRA (`O_LEITOR_QUEBRA = true`; regra 4).
# Instrumento de anexo (fora de CI, N4-D117). O CN da PR-1 (`QL-PR1-anexos/instrumentos/cn-g-par-v.sh`) plantava no
# `CorpoDoLeitor` da forma de antes da PR-3; com o leitor novo o plantio não acha o alvo e os casos medem o código da
# PR (div. desta PR). Aqui o plantio é no `linhasDoLeitor` do `Leitor.tsx`, e o arquivo volta por `git checkout` (o
# `git status` no fim).
#
#   cn-g-par-v-pr3.sh        (da raiz, com `apps/native/src/screens/Leitor.tsx` sem mudança na árvore)
set -u
L=apps/native/src/screens/Leitor.tsx
git diff --quiet -- "$L" || { echo "PARA: $L tem mudança na árvore" >&2; exit 2; }
F=0
ALVO='  return quebrar(corpo, tipo ?? '"''"', colunas)'
planta() { # planta <rótulo> <nova linha de retorno do linhasDoLeitor>
  python3 - "$L" "$ALVO" "$1" <<'EOF'
import sys
p, alvo, novo = sys.argv[1:4]
s = open(p).read()
assert s.count(alvo) == 1, "o alvo do plantio não está no Leitor.tsx"
open(p, "w").write(s.replace(alvo, novo))
EOF
}
caso() { # caso <rótulo> <espera exit> <razão esperada na saída>
  S=$(npx vitest run apps/native/test/g-par-visualizacao.test.tsx 2>&1 | sed 's/\x1b\[[0-9;]*m//g'); X=0
  printf '%s' "$S" | grep -q "Tests .*failed" && X=1
  if [ "$2" = 0 ]; then [ $X -eq 0 ] && R=ok || R=FALHOU; else { [ $X -eq 1 ] && printf '%s' "$S" | grep -q "$3"; } && R=ok || R=FALHOU; fi
  [ "$R" = ok ] || F=1
  echo "$1 — espera exit $2: exit $X · $R"
  printf '%s\n' "$S" | grep -E "o leitor quebra:|G-par da visualização:|QUEBRA|TAB QUEBRADA|DIFERENTE|AssertionError" | sed 's/^/    /' | head -8
  git checkout -q -- "$L"
}
echo "== CN-P0 o leitor da PR (nada plantado)"; caso CN-P0 0 ""
echo "== CN-P1 o leitor ignora as colunas (não quebra)"; planta '  return null'; caso CN-P1 1 "o leitor não viu as colunas"
echo "== CN-P2 a quebra troca uma letra"; planta '  return quebrar(corpo, tipo ?? '"''"', colunas).map((l, i) => (i === 0 && l.texto.length > 0 ? { ...l, texto: (l.texto[0] === "X" ? "Y" : "X") + l.texto.slice(1) } : l))'; caso CN-P2 1 "V diferente do site"
echo "== CN-P3 o leitor quebra também a Tab"; planta '  return quebrar(corpo, tipo === "Tab" ? "Lyrics" : (tipo ?? '"''"'), colunas)'
python3 - "$L" <<'EOF'
import sys
p = sys.argv[1]; s = open(p).read()
s = s.replace("  if (corpo === null || tipo === 'Tab') return null", "  if (corpo === null) return null", 1)
open(p, "w").write(s)
EOF
caso CN-P3 1 "TAB QUEBRADA"
git status --short -- "$L"
[ $F -eq 0 ] && echo "== todos os controles como esperado ✓" || echo "== CONTROLE FORA DO ESPERADO ✗"
exit $F
