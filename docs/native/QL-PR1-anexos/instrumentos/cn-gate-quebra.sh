#!/bin/sh
# CN do gate da quebra (QL-PR1) — instrumento DE MÃO, como o `cn-w4b1.sh`: troca o contrato
# `packages/core/src/quebra.ts` pela leitura de laboratório (`quebra-lab.ts`, ao lado), roda o gate
# (`tests/gates/ql-quebra.test.ts`) e devolve o contrato com `git checkout`. O que entra no repositório é a SAÍDA.
#
#   CN-0  o contrato (a PR-1)                       → as 46 checagens reprovam, como a lista declara
#   CN-1  o laboratório, sem defeito                → (i) e (ii) passam; reprovam só os (iii) cujo corte depende da medida
#   CN-2  LAB_DEFEITO=letra   (uma letra trocada)   → o (ii) reprova em todos os casos
#   CN-3  LAB_DEFEITO=palavra (uma palavra a menos) → o (ii) reprova onde há continuação com mais de uma palavra
#   CN-4  LAB_DEFEITO=ordem   (linhas fora de ordem)→ o (ii) reprova em todos os casos
#
# Uso (da RAIZ do repositório): sh docs/native/QL-PR1-anexos/instrumentos/cn-gate-quebra.sh
RAIZ=$(git rev-parse --show-toplevel) || exit 1
cd "$RAIZ" || exit 1
ALVO=packages/core/src/quebra.ts
LAB=docs/native/QL-PR1-anexos/instrumentos/quebra-lab.ts
[ -z "$(git status --porcelain -- "$ALVO")" ] || { echo "cn-gate-quebra: $ALVO tem mudança local — nada feito" >&2; exit 2; }
trap 'git checkout -- "$ALVO"' EXIT
gate() {  # o resumo do gate: as linhas que reprovam, a lista e o veredito
  pnpm exec vitest run tests/gates/ql-quebra.test.ts --project web 2>&1 | sed 's/\x1b\[[0-9;]*m//g' \
    | grep -E '^gate da quebra|REPROVA|^        \(|lista esperada|NÃO DECLARADA:|ÓRFÃ:|Tests ' | sed 's/^/    /'
}
echo "== CN-0 o contrato (a PR-1)"; gate
cp "$LAB" "$ALVO"
echo "== CN-1 o laboratório, sem defeito"; gate
for D in letra palavra ordem; do
  echo "== LAB_DEFEITO=$D"; LAB_DEFEITO=$D gate
done
git checkout -- "$ALVO"
trap - EXIT
echo "== devolvido: git status -- $ALVO"; git status --short -- "$ALVO" | sed 's/^/    /'; echo "    (vazio = o contrato de volta)"
