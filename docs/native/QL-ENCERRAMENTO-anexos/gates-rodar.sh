#!/bin/sh
cd /Users/marcelviana/projects/octavia-ql-encerramento
O=$1; DB=docs/native/QL-PR4-anexos/volta/dumps/base
x() { echo; echo "\$ $*"; sh -c "$*" 2>&1; echo "exit=$?"; }
{
echo "== $(date '+%F %T') gates na ponta da main — árvore ../octavia-ql-encerramento, HEAD $(git rev-parse --short HEAD) (ea5e891 + só docs)"
x "sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B5-baseline $DB | tail -4"
x "sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem $DB | tail -4"
x "node apps/native/scripts/g-n3.mjs --pai docs/native/N3-PRECHECK-anexos/B5-baseline --pai docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem --logico docs/native/QL-PR3-anexos/b3-pre-ql --faixa $DB --rolada $DB | grep -E '^G-N3|^\\(e\\)|QUEBRA|^\\(b\\)' "
x "pnpm exec vitest run tests/gates/ql-quebra.test.ts apps/native/test/g-par-visualizacao.test.tsx tests/gates/n4-g-par.test.tsx 2>&1 | grep -E 'gate da quebra|lista esperada|zero diferenças|linhas do par|o leitor quebra|Test Files|Tests '"
x "cd apps/native && node scripts/icones.mjs ../../packages/identidade/src/icones.ts | tail -3"
x "cd apps/native && node scripts/a20.mjs . | tail -2"
x "sh apps/native/scripts/g1.sh ea5e891 WORKTREE | grep -E 'G1a|G1b' "
x "sh apps/native/scripts/g2g3.sh ea5e891 WORKTREE | grep -E 'G2|G3|antes|sumiu' "
x "sh apps/native/scripts/g1.sh 81249cd WORKTREE | grep -E 'G1a|G1b|exceç|EXCEÇ' | tail -6"
x "sh apps/native/scripts/g2g3.sh 81249cd WORKTREE | grep -E 'antes=|sumiu|SUMIU|errata|nova' | tail -8"
for d in docs/native/DESIGN-V1 docs/native/DESIGN-N2 docs/native/DESIGN-N3 docs/native/DESIGN-N4 docs/native/DESIGN-QL docs/ux/DESIGN-I1; do x "cd $d && shasum -a 256 -c SHA256SUMS | grep -c ': OK' ; cd - >/dev/null; cd $d && shasum -a 256 -c SHA256SUMS | grep -vc ': OK'"; done
x "cd docs/native/N3-PRECHECK-anexos && shasum -a 256 -c SHA256SUMS.txt | grep -c ': OK'; shasum -a 256 -c SHA256SUMS.txt | grep -vc ': OK'"
x "cd docs/native/QL-PR3-anexos/b3-pre-ql && shasum -a 256 -c SHA256SUMS.txt | grep -c ': OK'"
x "sh scripts/gates-web/g-back.sh 81249cd WORKTREE | tail -3"
x "sh scripts/gates-web/g-palco.sh | tail -1"
x "node scripts/gates-web/g-tok.mjs | tail -2; node scripts/gates-web/g-tok-cobertura.mjs | tail -2"
x "node scripts/gates-web/g-faixa-veredito.mjs tests/gates-web/medicoes | tail -2"
x "pnpm exec tsc --noEmit | tail -3"
x "cd packages/core && npx tsc --noEmit | tail -3"
x "cd packages/identidade && npx tsc --noEmit | tail -3"
x "cd apps/native && npx tsc --noEmit | tail -3"
x "pnpm lint 2>&1 | tail -2"
x "pnpm test 2>&1 | grep -E 'Test Files|Tests |FAIL' | tail -6"
echo "== $(date '+%F %T') fim"
} > $O 2>&1
