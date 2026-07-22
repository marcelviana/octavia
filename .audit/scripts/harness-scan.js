#!/usr/bin/env node
/**
 * P0-C: varre todos os arquivos de teste e conta its ativos vs skipped,
 * e determina qual runner (unit/integration/e2e/NENHUM) inclui cada arquivo.
 * Saída: JSON em stdout.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(test|spec)\.(ts|tsx)$/.test(e.name)) acc.push(path.relative(ROOT, p));
  }
  return acc;
}

const files = walk(ROOT, []).sort();

// Réplica das regras de include/exclude dos configs reais:
// vitest.config.mts (unit): include default (**/*.{test,spec}.*), exclui e2e e *integration*
// vitest.integration.config.mts: inclui apenas tests/integration/** e *integration*
// playwright.config.ts: testDir tests/e2e (default testMatch: *.(spec|test).*)
function runnerFor(f) {
  const isE2E = f.startsWith('tests/e2e/') || /\.e2e\./.test(f);
  const isIntegration = /integration/.test(path.basename(f)) || f.startsWith('tests/integration/');
  if (isE2E) return 'e2e (playwright)';
  if (isIntegration) return 'integration (vitest.integration)';
  return 'unit (vitest)';
}

function count(re, s) { return (s.match(re) || []).length; }

const out = files.map((f) => {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  // its/tests declarados
  const itTotal = count(/\b(?:it|test)(?:\.(?:skip|todo|only|fails|each|concurrent))?\s*\(/g, src)
    + count(/\b(?:it|test)\.each\s*(?:\(|`)/g, src) * 0; // .each já casa acima
  const itSkip = count(/\b(?:it|test)\.skip\s*\(/g, src) + count(/\bxit\s*\(/g, src) + count(/\bxtest\s*\(/g, src);
  const itTodo = count(/\b(?:it|test)\.todo\s*\(/g, src);
  const descTotal = count(/\bdescribe(?:\.(?:skip|only|each))?\s*\(/g, src);
  const descSkip = count(/\bdescribe\.skip\s*\(/g, src) + count(/\bxdescribe\s*\(/g, src);
  // imports quebrados conhecidos (tornam o arquivo inerte em runtime)
  const brokenImports = [];
  if (/from\s+['"]node-mocks-http['"]/.test(src)) brokenImports.push('node-mocks-http (não está no package.json)');
  if (/from\s+['"]@\/types\/database['"]/.test(src)) brokenImports.push('@/types/database (não resolve; arquivo real é types/database.types.ts)');
  return {
    file: f,
    runner: runnerFor(f),
    describes: descTotal,
    describeSkip: descSkip,
    its: itTotal,
    itSkip,
    itTodo,
    fileFullySkipped: descSkip > 0 && descTotal === descSkip,
    brokenImports,
  };
});

console.log(JSON.stringify(out, null, 2));
