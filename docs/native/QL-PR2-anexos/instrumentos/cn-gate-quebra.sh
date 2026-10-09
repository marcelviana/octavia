#!/bin/sh
# CN do gate da quebra (QL-PR2) — instrumento DE MÃO, no molde do da PR-1 (`QL-PR1-anexos/instrumentos/cn-gate-quebra.sh`):
# troca `packages/core/src/quebra.ts` (e, no CN-L, a lista) por um instante, roda o gate (`tests/gates/ql-quebra.test.ts`)
# e os extras do core (`packages/core/src/quebra.test.ts`), e devolve tudo com `git checkout`. O que entra no
# repositório é a SAÍDA.
#
#   CN-0  a PR-2 como está                           → 46 passam, lista vazia ✓; extras 46 passam
#   CN-L  uma linha na lista (i:letra-80)            → LISTA NÃO VAZIA (e ÓRFÃ, porque passa): o gate reprova
#   CN-K  o contrato da PR-1 (lança)                  → as 46 como reprovação NÃO DECLARADA
#   CN-1  o laboratório da PR-1, sem defeito          → reprovam só os (iii) cujo corte depende da medida
#   CN-2  LAB_DEFEITO=letra / CN-3 palavra / CN-4 ordem → o (ii) reprova
#   CN-M  o reconhecedor com o critério "maioria"     → a quase acorde forma par: i:quase-acorde-14 reprova (div. 1206)
#
# O LAB_DEFEITO vai por export/unset, não por `VAR=x função` (div. 1203).
# Uso (da RAIZ do repositório): sh docs/native/QL-PR2-anexos/instrumentos/cn-gate-quebra.sh
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
ALVO=packages/core/src/quebra.ts
LISTA=packages/core/fixtures/ql-quebra-reprovados.txt
LAB=docs/native/QL-PR1-anexos/instrumentos/quebra-lab.ts
CONTRATO=827141a   # o merge da #373 (a PR-1): o contrato que lança
[ -z "$(git status --porcelain -- "$ALVO" "$LISTA")" ] || { echo "cn-gate-quebra: mudança local em $ALVO ou $LISTA — nada feito" >&2; exit 2; }
trap 'git checkout -- "$ALVO" "$LISTA"' EXIT
gate() {
  pnpm exec vitest run tests/gates/ql-quebra.test.ts --project web 2>&1 | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^gate da quebra|REPROVA|^        \(|lista esperada|NÃO DECLARADA:|ÓRFÃ:|LISTA NÃO VAZIA|Tests ' | sed 's/^/    /'
}
extras() {
  pnpm exec vitest run packages/core/src/quebra.test.ts --project core 2>&1 | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E 'Tests ' | sed 's/^/    extras do core: /'
}
echo "== CN-0 a PR-2 como está"; gate; extras
echo 'i:letra-80' >> "$LISTA"
echo "== CN-L uma linha na lista (i:letra-80)"; gate
git checkout -- "$LISTA"
git show "$CONTRATO:$ALVO" > "$ALVO"
echo "== CN-K o contrato da PR-1 (lança)"; gate
cp "$LAB" "$ALVO"
echo "== CN-1 o laboratório da PR-1, sem defeito"; gate
for D in letra palavra ordem; do
  export LAB_DEFEITO=$D
  echo "== LAB_DEFEITO=$D"; gate
  unset LAB_DEFEITO
done
git checkout -- "$ALVO"
perl -0pi -e 's/else if \(!SEPARADOR\.test\(token\)\) return false\n  \}\n  return acordes > 0/else if (!SEPARADOR.test(token)) outros++\n  }\n  return acordes > 0 \&\& 2 * outros <= acordes + outros \/\/ CN-M: a maioria/; s/let acordes = 0\n/let acordes = 0\n  let outros = 0\n/' "$ALVO"
echo "== CN-M o reconhecedor com o critério \"maioria\" (diff abaixo)"; git diff -U0 -- "$ALVO" | grep '^[-+] ' | sed 's/^/    /'
gate; extras
git checkout -- "$ALVO" "$LISTA"
trap - EXIT
echo "== devolvido: git status -- $ALVO $LISTA"; git status --short -- "$ALVO" "$LISTA" | sed 's/^/    /'; echo "    (vazio = a PR-2 de volta)"
