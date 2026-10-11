#!/bin/sh
# SY-PR1 — os gates que JÁ existiam, sobre a PR (a cópia do `QL-ENCERRAMENTO-anexos/gates-rodar.sh`, só os que esta PR não
# roda pela suíte nem pelo `verifica.sh`). Os de dump leem os dumps finais commitados da volta da QL-PR4 (a PR não muda tela
# nem dump: o resultado tem de ser o do encerramento do QL). Da RAIZ:  sh gates-existentes.sh > <saída>
DB=docs/native/QL-PR4-anexos/volta/dumps/base
x() { echo; echo "\$ $*"; sh -c "$*" 2>&1; echo "exit=$?"; }
echo "== $(date '+%F %T') os gates existentes — árvore $(git rev-parse --short HEAD), base origin/main $(git rev-parse --short origin/main)"
x "sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B5-baseline $DB | tail -2"
x "sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem $DB | tail -2"
x "node apps/native/scripts/g-n3.mjs --pai docs/native/N3-PRECHECK-anexos/B5-baseline --pai docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem --logico docs/native/QL-PR3-anexos/b3-pre-ql --faixa $DB --rolada $DB | grep -E '^G-N3'"
x "pnpm exec vitest run tests/gates/ql-quebra.test.ts apps/native/test/g-par-visualizacao.test.tsx tests/gates/n4-g-par.test.tsx apps/native/test/gates.test.ts 2>&1 | grep -E 'gate da quebra:|zero diferenças|Test Files|Tests '"
x "cd apps/native && node scripts/icones.mjs ../../packages/identidade/src/icones.ts | tail -2"
x "cd apps/native && node scripts/a20.mjs . | tail -2"
for d in docs/native/DESIGN-V1 docs/native/DESIGN-N2 docs/native/DESIGN-N3 docs/native/DESIGN-N4 docs/native/DESIGN-QL docs/ux/DESIGN-I1; do x "cd $d && shasum -a 256 -c SHA256SUMS | grep -c ': OK'"; done
x "cd docs/native/N3-PRECHECK-anexos && shasum -a 256 -c SHA256SUMS.txt | grep -vc ': OK'"
echo "== $(date '+%F %T') fim"
