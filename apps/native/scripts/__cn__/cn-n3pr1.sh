#!/bin/sh
# CN — os controles da N3-PR1. Instrumento DE MÃO, pela razão do `cn-w4b1.sh`:
# fabrica cópias adulteradas num diretório descartável, e um job que adultera
# arquivo para provar um ponto não é gate. O que entra no repositório é a SAÍDA
# dele, em `docs/native/N3-PR1-anexos/`.
#
# Uso (da RAIZ do repositório): sh apps/native/scripts/__cn__/cn-n3pr1.sh
#
# Div. 398 — o DESIGN-N3 no laço do `shasum -c` do `gates-nativos`:
#   CN-S1  um byte do `telas.html` alterado numa CÓPIA da pasta → shasum reprova
#   CP-S2  a cópia intacta                                     → passa
#   CN-S3  o `gates.yml` lista `docs/native/DESIGN-N3` no laço  (o passo que o CI roda)
#
# G-inv (T3-R2) — `apps/native/scripts/g-inv.sh`:
#   CN-I0  sem argumento                                        → exit 2 (uso)
#   CP-I1  a B5 contra uma cópia dela (outro prefixo)           → exit 0, 34 de 34
#   CN-I2  a cópia com UM nó deslocado 2 px (0,9 dp) em x       → exit 1, imprime o nó
#   CN-I3  a cópia sem um dos 34 dumps                          → exit 1, "SEM DUMP NOVO"
#   CN-I4  um dump de RETRATO com o nome de paisagem            → exit 1 (a raiz confere o nome)
#
# G-N3 (T3-R4) — `apps/native/scripts/g-n3.mjs`:
#   CN-N1  os dumps de retrato do pre-check (B2, tablet) contra a paisagem → exit 1
#   CN-N2  o celular do pre-check (B4, retrato e deitado)                  → exit 1
#   CT-N3  CONTROLE DO INSTRUMENTO: dump a dump, a contagem de (e) e de (d′)
#          do G-N3 é IGUAL à do `B3-inventario.jsonl` do pre-check (o mesmo
#          critério, copiado; uma diferença aqui é o gate medindo outra coisa)
#   CP-N4  paisagem contra paisagem (a B5 com outro prefixo como "faixa")  → exit 0, (e) = (d′) = 0
#   CN-N5  sem --faixa                                                      → exit 2 (uso)
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
A=docs/native/N3-PRECHECK-anexos
FALHOU=0
confere() {  # confere <nome> <exit-esperado> <exit-obtido>
  if [ "$2" = "$3" ]; then echo "  $1: exit $3 ✓"; else echo "  $1: exit $3, esperado $2 ✗"; FALHOU=1; fi
}

echo "== div. 398 — shasum do DESIGN-N3"
cp -R docs/native/DESIGN-N3 "$TMP/d3"
(cd "$TMP/d3" && shasum -a 256 -c SHA256SUMS) > "$TMP/s" 2>&1; confere CP-S2 0 $?
sed 's/^/      /' "$TMP/s"
printf 'X' | dd of="$TMP/d3/telas.html" bs=1 seek=1000 conv=notrunc 2>/dev/null
(cd "$TMP/d3" && shasum -a 256 -c SHA256SUMS) > "$TMP/s" 2>&1; confere CN-S1 1 $?
sed 's/^/      /' "$TMP/s"
grep -q 'for d in .*docs/native/DESIGN-N3' .github/workflows/gates.yml; confere CN-S3 0 $?
grep -n 'for d in' .github/workflows/gates.yml | sed 's/^/      /'

echo "== G-inv"
sh apps/native/scripts/g-inv.sh > "$TMP/o" 2>&1; confere CN-I0 2 $?
sed 's/^/      /' "$TMP/o"
mkdir "$TMP/novos"
for f in "$A"/B5-baseline/*.xml; do cp "$f" "$TMP/novos/CP-$(basename "$f" | cut -d- -f2-)"; done
sh apps/native/scripts/g-inv.sh "$A/B5-baseline" "$TMP/novos" > "$TMP/o" 2>&1; confere CP-I1 0 $?
tail -2 "$TMP/o" | sed 's/^/      /'
# CN-I2: o PRIMEIRO `bounds` do `picker-abrir` deslocado 2 px em x (as duas bordas)
ALVO="$TMP/novos/CP-S2-com-edicao-avd-pai.xml"
cp "$ALVO" "$TMP/guarda.xml"
node -e '
  const fs = require("fs"); const f = process.argv[1]
  const s = fs.readFileSync(f, "utf8")
  const t = s.replace(/(resource-id="[^"]*picker-abrir"[^>]*bounds="\[)(\d+),(\d+)\]\[(\d+),/, (m, a, x0, y0, x1) => `${a}${+x0 + 2},${y0}][${+x1 + 2},`)
  if (t === s) { console.error("CN-I2: o alvo não foi achado"); process.exit(1) }
  fs.writeFileSync(f, t)' "$ALVO"
sh apps/native/scripts/g-inv.sh "$A/B5-baseline" "$TMP/novos" > "$TMP/o" 2>&1; confere CN-I2 1 $?
grep -A3 'DIFERENTE' "$TMP/o" | sed 's/^/      /'; tail -2 "$TMP/o" | sed 's/^/      /'
cp "$TMP/guarda.xml" "$ALVO"
mv "$TMP/novos/CP-S1-setlists-tab-pai.xml" "$TMP/fora.xml"
sh apps/native/scripts/g-inv.sh "$A/B5-baseline" "$TMP/novos" > "$TMP/o" 2>&1; confere CN-I3 1 $?
grep 'SEM DUMP NOVO' "$TMP/o" | sed 's/^/      /'
mv "$TMP/fora.xml" "$TMP/novos/CP-S1-setlists-tab-pai.xml"
cp "$A/B2/B2-S1-setlists-tab.xml" "$TMP/novos/CP-S1-setlists-tab-pai.xml"
sh apps/native/scripts/g-inv.sh "$A/B5-baseline" "$TMP/novos" > "$TMP/o" 2>&1; confere CN-I4 1 $?
grep 'não está em paisagem' "$TMP/o" | sed 's/^/      /'
mv "$TMP/fora.xml" "$TMP/novos/CP-S1-setlists-tab-pai.xml" 2>/dev/null
cp "$A/B5-baseline/B5-S1-setlists-tab-pai.xml" "$TMP/novos/CP-S1-setlists-tab-pai.xml"

echo "== G-N3"
G="node apps/native/scripts/g-n3.mjs --pai $A/B5-baseline --pai $A/B3-referencia-paisagem"
$G --faixa "$A/B2" > "$TMP/b2" 2>&1; confere CN-N1 1 $?
grep -E '^\(e\)|^\(d′\)|^4 dp|^G-N3:' "$TMP/b2" | sed 's/^/      /'
$G --faixa "$A/B4" > "$TMP/b4" 2>&1; confere CN-N2 1 $?
grep -E '^\(e\)|^\(d′\)|^4 dp|^G-N3:' "$TMP/b4" | sed 's/^/      /'
node -e '
  const fs = require("fs")
  const [jsonl, ...saidas] = process.argv.slice(1)
  const conta = (txt) => {
    const e = new Map(), d = new Map(); let bloco = null
    for (const l of txt.split("\n")) {
      if (l.startsWith("(e)")) bloco = "e"; else if (l.startsWith("(d′)")) bloco = "d"; else if (l.startsWith("4 dp")) bloco = null
      const m = /^  ([^:]+): (\d+)? ?/.exec(l)
      if (!m || bloco === null) continue
      if (bloco === "e") e.set(m[1], Number(m[2])); else d.set(m[1], (d.get(m[1]) ?? 0) + 1)
    }
    return { e, d }
  }
  const g = { e: new Map(), d: new Map() }
  for (const s of saidas) { const c = conta(fs.readFileSync(s, "utf8")); for (const k of ["e", "d"]) for (const [n, v] of c[k]) g[k].set(n, v) }
  let n = 0, dif = 0
  for (const l of fs.readFileSync(jsonl, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(l)
    if (!r.novo) continue
    const nome = r.arquivo.split("/").pop().replace(/\.xml$/, "")
    const e = g.e.get(nome) ?? 0, d = g.d.get(nome) ?? 0
    n++
    if (e !== r.novo.e.length || d !== r.novo.dl.length) { dif++; console.log(`      ≠ ${nome}: G-N3 e=${e} d′=${d} · pre-check e=${r.novo.e.length} d′=${r.novo.dl.length}`) }
  }
  console.log(`      ${n} dumps com referência no B3-inventario.jsonl; ${dif} com contagem diferente`)
  process.exit(dif === 0 && n > 0 ? 0 : 1)' "$A/B3-inventario.jsonl" "$TMP/b2" "$TMP/b4"
confere CT-N3 0 $?
mkdir "$TMP/cp"
for f in "$A"/B5-baseline/*.xml "$A"/B3-referencia-paisagem/*.xml; do cp "$f" "$TMP/cp/CP-$(basename "$f" | cut -d- -f2-)"; done
$G --faixa "$TMP/cp" > "$TMP/o" 2>&1; confere CP-N4 0 $?
grep -E '^G-N3 —|^\(e\)|^\(d′\)|^4 dp|^G-N3:' "$TMP/o" | sed 's/^/      /'
node apps/native/scripts/g-n3.mjs --pai "$A/B5-baseline" > "$TMP/o" 2>&1; confere CN-N5 2 $?
head -1 "$TMP/o" | sed 's/^/      /'

echo
if [ $FALHOU -eq 0 ]; then echo "cn-n3pr1: todos os controles como esperado ✓"; else echo "cn-n3pr1: CONTROLE FORA DO ESPERADO ✗"; fi
exit $FALHOU
