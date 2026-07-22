#!/usr/bin/env node
/**
 * P0-B — lê .audit/graph.json (+ graph-tests.json) e produz:
 *   .audit/route-closure.md  — fecho transitivo de cada page.tsx / route.ts
 *   .audit/orphans.md        — arquivos fora do fecho de qualquer entrypoint
 *   .audit/twins.md          — wiring real dos pares gêmeos conhecidos
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const graph = JSON.parse(fs.readFileSync(path.join(ROOT, ".audit/graph.json")));
const testGraph = JSON.parse(fs.readFileSync(path.join(ROOT, ".audit/graph-tests.json")));

const isProject = (s) => s && !s.startsWith("node_modules");

// ---------- adjacência (grafo principal) ----------
const adj = new Map(); // source -> deps internas resolvidas
const allFiles = new Set();
for (const m of graph.modules) {
  if (!isProject(m.source)) continue;
  allFiles.add(m.source);
  adj.set(
    m.source,
    m.dependencies
      .filter((d) => isProject(d.resolved) && !d.couldNotResolve)
      .map((d) => d.resolved)
  );
}

// importadores reversos: grafo principal + grafo de testes externos
const importers = new Map(); // file -> Set(importadores)
function addEdge(from, to) {
  if (!importers.has(to)) importers.set(to, new Set());
  importers.get(to).add(from);
}
for (const [src, deps] of adj) for (const d of deps) addEdge(src, d);
for (const m of testGraph.modules) {
  if (!isProject(m.source)) continue;
  for (const d of m.dependencies) {
    if (isProject(d.resolved) && !d.couldNotResolve) addEdge(m.source, d.resolved);
  }
}

const isTestFile = (f) =>
  /(\.test\.|\.spec\.|(^|\/)__tests__\/|^tests\/|^src\/test-setup)/.test(f);

// ---------- fecho transitivo ----------
function closure(entry) {
  const seen = new Set();
  const stack = [entry];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const d of adj.get(f) || []) if (!seen.has(d)) stack.push(d);
  }
  return seen;
}

// ---------- entrypoints ----------
const routeEntries = [...allFiles]
  .filter((f) => /^app\/(.*\/)?(page|route)\.(tsx|ts|jsx|js)$/.test(f))
  .sort();

// entrypoints para análise de órfãos: todas as convenções do App Router,
// middleware, service worker, e setups de teste referenciados pelos configs
const appSpecial = [...allFiles].filter((f) =>
  /^app\/(.*\/)?(page|layout|route|loading|error|not-found|template|global-error|default)\.(tsx|ts|jsx|js)$/.test(f)
);
const extraEntries = ["middleware.ts", "worker/index.js"].filter((f) => allFiles.has(f));
// referenciados pelos configs de vitest/playwright (fora do grafo principal,
// entram via grafo de testes): src/test-setup.ts, tests/e2e/global-setup.ts
const allEntrypoints = [...new Set([...appSpecial, ...extraEntries])].sort();

// ---------- route-closure.md ----------
{
  let out = "# Fecho transitivo por rota (App Router)\n\n";
  out += `Fonte: .audit/graph.json (dependency-cruiser com tsConfig, aliases @/ resolvidos)\n\n`;
  out += `Rotas encontradas: ${routeEntries.length}\n\n`;
  for (const r of routeEntries) {
    const c = [...closure(r)].sort();
    out += `## ${r}\n\n`;
    out += `Arquivos no fecho: ${c.length}\n\n`;
    for (const f of c) out += `- ${f}\n`;
    out += "\n";
  }
  fs.writeFileSync(path.join(ROOT, ".audit/route-closure.md"), out);
}

// ---------- órfãos ----------
const reachable = new Set();
for (const e of allEntrypoints) for (const f of closure(e)) reachable.add(f);

// universo: app/ components/ lib/ hooks/ domains/ (arquivos presentes no grafo)
const universe = [...allFiles].filter((f) =>
  /^(app|components|lib|hooks|domains)\//.test(f)
);

// grep por referências dinâmicas ao basename (import() com string montada,
// next/dynamic, barrels) — evita falsos-órfãos
function dynamicRefs(file) {
  const base = path.basename(file).replace(/\.(tsx|ts|jsx|js)$/, "");
  if (base === "index") return [];
  let hits = [];
  try {
    const cmd = `grep -rlE "['\\\"/]${base}['\\\"]" app components lib hooks domains contexts worker scripts middleware.ts 2>/dev/null || true`;
    hits = execSync(cmd, { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
      .filter((h) => h !== file);
  } catch {}
  return hits;
}

const orphans = [];
for (const f of universe.sort()) {
  if (reachable.has(f)) continue;
  const imps = [...(importers.get(f) || [])];
  const testImps = imps.filter(isTestFile);
  const prodImps = imps.filter((i) => !isTestFile(i));
  orphans.push({
    file: f,
    isTest: isTestFile(f),
    testImporters: testImps,
    prodImporters: prodImps, // importado por prod, mas o importador também é órfão
    dynRefs: dynamicRefs(f),
    sizeKB: (() => {
      try {
        return (fs.statSync(path.join(ROOT, f)).size / 1024).toFixed(1);
      } catch {
        return "?";
      }
    })(),
  });
}

{
  let out = "# Órfãos — fora do fecho de qualquer entrypoint\n\n";
  out += `Entrypoints considerados (${allEntrypoints.length}): todas as páginas/rotas/layouts/loading/error do App Router, middleware.ts, worker/index.js; setups de vitest/playwright entram via grafo de testes para marcação "só testes".\n\n`;
  out += `Universo: app/ components/ lib/ hooks/ domains/ — ${universe.length} arquivos no grafo.\n`;
  const nonTest = orphans.filter((o) => !o.isTest);
  const testOnly = orphans.filter((o) => o.isTest);
  out += `Órfãos: ${orphans.length} (${nonTest.length} código, ${testOnly.length} arquivos de teste colocados)\n\n`;
  out += "## Código órfão\n\n";
  out += "| Arquivo | KB | Importado por testes? | Importadores prod (também órfãos) | Referências dinâmicas/textuais (grep) |\n";
  out += "|---|---|---|---|---|\n";
  for (const o of nonTest) {
    out += `| ${o.file} | ${o.sizeKB} | ${
      o.testImporters.length ? o.testImporters.join("<br>") : "—"
    } | ${o.prodImporters.length ? o.prodImporters.join("<br>") : "—"} | ${
      o.dynRefs.length ? o.dynRefs.join("<br>") : "—"
    } |\n`;
  }
  out += "\n## Arquivos de teste colocados (fora do fecho, esperado)\n\n";
  for (const o of testOnly) out += `- ${o.file} (${o.sizeKB} KB)\n`;
  fs.writeFileSync(path.join(ROOT, ".audit/orphans.md"), out);
}

// ---------- twins.md ----------
const TWIN_GROUPS = [
  {
    name: "performance-mode",
    files: ["components/performance-mode.tsx", "components/optimized-performance-mode.tsx"],
  },
  {
    name: "content-display (performance-mode/)",
    files: [
      "components/performance-mode/content-display.tsx",
      "components/performance-mode/optimized-content-display.tsx",
    ],
  },
  {
    name: "performance-controls (variante optimized)",
    files: ["components/performance-mode/optimized-performance-controls.tsx"],
  },
  {
    name: "add-content",
    files: [
      "components/add-content.tsx",
      "components/add-content-refactored.tsx",
      "components/add-content/RefactoredAddContent.tsx",
    ],
  },
  {
    name: "library",
    files: ["components/library.tsx", "components/library/RefactoredLibrary.tsx"],
  },
  {
    name: "library-list (variante optimized)",
    files: ["components/library-list.tsx", "components/library/OptimizedLibraryList.tsx"],
  },
  {
    name: "settings",
    files: ["components/settings.tsx", "components/settings/RefactoredSettings.tsx"],
  },
  {
    name: "setlist-list",
    files: [
      "components/setlist/setlist-list.tsx",
      "components/setlist/setlist-list-refactored.tsx",
    ],
  },
  {
    name: "metadata-form",
    files: ["components/metadata-form.tsx", "components/metadata-form/RefactoredMetadataForm.tsx"],
  },
  {
    name: "content-service",
    files: [
      "lib/content-service.ts",
      "lib/content-service-refactored.ts",
      "lib/content-service-server.ts",
      "domains/content-management/services/content-service.ts",
    ],
  },
  {
    name: "setlist-service",
    files: ["lib/setlist-service.ts", "lib/setlist-service-refactored.ts"],
  },
];

// pré-computa fechos das rotas para responder "está no fecho de alguma rota?"
const routeClosures = new Map();
for (const r of routeEntries) routeClosures.set(r, closure(r));

function routesContaining(file) {
  const rs = [];
  for (const [r, c] of routeClosures) if (c.has(file)) rs.push(r);
  return rs;
}

{
  let out = "# Pares gêmeos — quem importa quem, e quem está montado em rota\n\n";
  out += "Evidência crua do grafo (dependency-cruiser, aliases resolvidos). ";
  out += "\"Importadores\" inclui grafo de produção e de testes (testes marcados). ";
  out += "\"Rotas\" = páginas/route handlers em cujo fecho transitivo o arquivo aparece.\n\n";
  for (const g of TWIN_GROUPS) {
    out += `## ${g.name}\n\n`;
    for (const f of g.files) {
      const exists = allFiles.has(f);
      out += `### ${f}\n\n`;
      if (!exists) {
        out += "- **NÃO ESTÁ NO GRAFO** (arquivo inexistente ou fora dos dirs cruzados)\n\n";
        continue;
      }
      const imps = [...(importers.get(f) || [])].sort();
      const routes = routesContaining(f);
      out += `- Importadores (${imps.length}): ${
        imps.length
          ? "\n" + imps.map((i) => `  - ${i}${isTestFile(i) ? " _(teste)_" : ""}`).join("\n")
          : "**nenhum**"
      }\n`;
      out += `- Em fecho de rota: ${
        routes.length ? routes.map((r) => `\`${r}\``).join(", ") : "**NENHUMA rota**"
      }\n\n`;
    }
    // veredito do grupo
    const wired = g.files.filter((f) => allFiles.has(f) && routesContaining(f).length > 0);
    out += `**Veredito:** ${
      wired.length === 0
        ? "nenhum dos arquivos está em rota"
        : wired.length === g.files.length
        ? "TODOS em rota"
        : `montado(s) em rota: ${wired.join(", ")}`
    }\n\n---\n\n`;
  }
  fs.writeFileSync(path.join(ROOT, ".audit/twins.md"), out);
}

// ---------- resumo no stdout ----------
let internalEdges = 0;
for (const deps of adj.values()) internalEdges += deps.length;
console.log("internal edges:", internalEdges);
console.log("route entrypoints:", routeEntries.length);
console.log("all entrypoints (orphan analysis):", allEntrypoints.length);
console.log("orphans:", orphans.length, "(code:", orphans.filter((o) => !o.isTest).length + ")");
