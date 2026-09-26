#!/bin/sh
# CN — o (b) CORTE do G-N3 (N3-PR6c, div. 461). Instrumento DE MÃO, pela razão
# do `cn-w4b1.sh`: fabrica cópias num diretório descartável; o que entra no
# repositório é a SAÍDA dele, em `docs/native/N3-PR6c-anexos/`.
#
# Uso (da RAIZ do repositório): sh apps/native/scripts/__cn__/cn-n3pr6c.sh
#
#   CN-B1  a `S5-n-grande` em retrato da N3-PR6b contra a paisagem dela      → exit 1, (b) > 0
#          (as marcas das pontas da fileira, cortadas na borda da janela)
#   CP-B2  a paisagem do mesmo estado como "faixa" (outro prefixo)           → exit 0, (b)=0
#   CP-B3  o consolidado da N3-PR6 (102 pares), o comando verbatim           → exit 0, (b)=0
#          (a prova de que o (b) não estava passando em silêncio em outra tela)
#   CN-B4  o picker de ANTES do conserto da N3-E18 (`dumps-defeito/`)       → exit 1, (b) > 0
#          (o defeito da div. 445 também era corte; o (e) já o pegava)
#   CT-B5  CONTROLE DO INSTRUMENTO: dump a dump, o (b) do G-N3 é IGUAL ao (b)
#          novo do `B3-inventario.jsonl` do pre-check sem o "ausente" (o mesmo
#          critério, copiado; uma diferença é o gate medindo outra coisa)
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
G=apps/native/scripts/g-n3.mjs
B6=docs/native/N3-PR6b-anexos
P6=docs/native/N3-PR6-anexos
PRE=docs/native/N3-PRECHECK-anexos
FALHOU=0
confere() {  # confere <nome> <exit-esperado> <exit-obtido>
  if [ "$2" = "$3" ]; then echo "  $1: exit $3 ✓"; else echo "  $1: exit $3, esperado $2 ✗"; FALHOU=1; fi
}
contem() {  # contem <nome> <arquivo> <texto>
  if grep -qF -- "$3" "$2"; then echo "  $1: \"$3\" ✓"; else echo "  $1: sem \"$3\" ✗"; FALHOU=1; fi
}
mostra() { sed -n '/^(b)/,/^$/p' "$1" | sed 's/^/      /'; grep '^G-N3:' "$1" | sed 's/^/      /'; }

echo "== CN-B1 — S5-n-grande em retrato (N3-PR6b)"
mkdir "$TMP/s5"; cp "$B6"/dumps-ret/N3P6B-S5-S5-n-grande-*-ret.xml "$TMP/s5/"
node $G --pai "$B6/dumps-pai" --faixa "$TMP/s5" > "$TMP/o" 2>&1; confere CN-B1 1 $?
contem CN-B1 "$TMP/o" "(b)=4 em 2 dump(s)"; mostra "$TMP/o"

echo "== CP-B2 — a paisagem do mesmo estado como faixa"
mkdir "$TMP/cp"; for f in "$B6"/dumps-pai/N3P6B-S5-S5-n-grande-*-pai.xml; do cp "$f" "$TMP/cp/CP-$(basename "$f" | cut -d- -f2-)"; done
node $G --pai "$B6/dumps-pai" --faixa "$TMP/cp" > "$TMP/o" 2>&1; confere CP-B2 0 $?
contem CP-B2 "$TMP/o" "(e)=0 · (b)=0"; mostra "$TMP/o"

echo "== CP-B3 — o consolidado da N3-PR6 (102 pares)"
node $G --pai $PRE/B5-baseline --pai $PRE/B3-referencia-paisagem --pai $P6/dumps-pai --pai $P6/dumps-pai-extra \
  --pai docs/native/N3-PR5-anexos/dumps-pai --pai docs/native/N3-PR4-anexos/dumps-pai --pai docs/native/N3-PR3-anexos/dumps-pai \
  --faixa $P6/dumps-ret --rolada $P6/dumps-ret-rolada > "$TMP/o" 2>&1; confere CP-B3 0 $?
contem CP-B3 "$TMP/o" "102 par(es)"; contem CP-B3 "$TMP/o" "(e)=0 · (b)=0 · nome-acessível=28 · rolagem=18"; mostra "$TMP/o"

echo "== CN-B4 — o picker de antes do conserto da N3-E18"
mkdir "$TMP/def"; for f in "$P6"/dumps-defeito/*.xml; do cp "$f" "$TMP/def/$(basename "$f" | sed 's/antes-do-conserto-//')"; done
node $G --pai "$P6/dumps-pai-extra" --faixa "$TMP/def" > "$TMP/o" 2>&1; confere CN-B4 1 $?
contem CN-B4 "$TMP/o" "(b)=6 em 2 dump(s)"; mostra "$TMP/o"

echo "== CT-B5 — o (b) do G-N3 contra o do pre-check, dump a dump"
GP="node $G --pai $PRE/B5-baseline --pai $PRE/B3-referencia-paisagem"
$GP --faixa "$PRE/B2" > "$TMP/b2" 2>&1
$GP --faixa "$PRE/B4" > "$TMP/b4" 2>&1
node -e '
  const fs = require("fs")
  const [jsonl, ...saidas] = process.argv.slice(1)
  const g = new Map()
  for (const s of saidas) {
    let bloco = false
    for (const l of fs.readFileSync(s, "utf8").split("\n")) {
      if (l.startsWith("(b)")) { bloco = true; continue }
      if (bloco && l === "") bloco = false
      const m = /^  (\S+): (\d+)$/.exec(l)
      if (bloco && m) g.set(m[1], Number(m[2]))
    }
  }
  let n = 0, dif = 0, total = 0
  for (const l of fs.readFileSync(jsonl, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(l)
    if (!r.novo) continue
    const nome = r.arquivo.split("/").pop().replace(/\.xml$/, "")
    const pre = r.novo.b.filter((x) => x.onde !== "ausente").length
    const aqui = g.get(nome) ?? 0
    n++; total += aqui
    if (aqui !== pre) { dif++; console.log(`      ≠ ${nome}: G-N3 (b)=${aqui} · pre-check (b) sem ausente=${pre}`) }
  }
  console.log(`      ${n} dumps com referência no B3-inventario.jsonl; (b) somado ${total}; ${dif} com contagem diferente`)
  process.exit(dif === 0 && n > 0 && total > 0 ? 0 : 1)' "$PRE/B3-inventario.jsonl" "$TMP/b2" "$TMP/b4"
confere CT-B5 0 $?

echo
if [ $FALHOU -eq 0 ]; then echo "cn-n3pr6c: todos os controles como esperado ✓"; else echo "cn-n3pr6c: CONTROLE FORA DO ESPERADO ✗"; fi
exit $FALHOU
