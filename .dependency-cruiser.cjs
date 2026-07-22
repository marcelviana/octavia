/** Config para auditoria P0-B — grafo com aliases @/ resolvidos via tsconfig */
module.exports = {
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
    tsPreCompilationDeps: true,
    exclude: {
      path: "node_modules",
    },
  },
};
