```gates
# N4-PR5 — core da biblioteca, sem tela (N4-R4, R5, R7, R11, R26; N4-D88, N4-D89, N4-D90).
# Core: a lista/filtros/busca (biblioteca.ts, novo), o favoritar (favoritar.ts, novo), a garantia e o estado do arquivo (offline.ts), is_favorite no tipo (types.ts), a P-F8 (frases-content.ts), as exportações (index.ts).
# Tablet: o favoritar (favoritar.ts, novo), saveContent (store.ts), a família no mutate (api.ts, escrita.ts), o plano da biblioteca e o teto (prefetch.ts), o estado de download (files.ts), o novo nome do plano (apos-escrita.ts, App.tsx) e a ligação do cache do favoritar (App.tsx); o sync não regride a linha do favoritar (sync.ts, N4-D91). Nenhum arquivo de tela.
g1a: apps/native/App.tsx
g1a: apps/native/src/api.ts
g1a: apps/native/src/apos-escrita.ts
g1a: apps/native/src/escrita.ts
g1a: apps/native/src/favoritar.ts
g1a: apps/native/src/files.ts
g1a: apps/native/src/prefetch.ts
g1a: apps/native/src/store.ts
g1a: apps/native/src/sync.ts
g1a: packages/core/src/biblioteca.ts
g1a: packages/core/src/favoritar.ts
g1a: packages/core/src/frases-content.ts
g1a: packages/core/src/index.ts
g1a: packages/core/src/offline.ts
g1a: packages/core/src/types.ts
g3-velha: log(`prefetch plan n=${plano.length} reason=7d`)
g3-nova: log(`prefetch plan n=${plano.length} reason=library`)
g3-velha: if (prazo !== null) log(`ratelimit retry-after=${prazo} family=setlist-mutate`)
g3-nova: if (prazo !== null) log(`ratelimit retry-after=${prazo} family=${familia}`)
```
