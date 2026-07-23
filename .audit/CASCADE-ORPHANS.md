# CASCADE-ORPHANS — órfãos revelados pela cascata do P1-D

Data: 2026-07-23. Pós-condição do P1-D (após lotes 1–3, HEAD `eb63ea7`).
**NADA daqui foi deletado** — este arquivo é insumo do P1-E.

## Método

1. Grafo regenerado: `pnpm exec depcruise app components lib hooks contexts
   types worker middleware.ts --config .dependency-cruiser.cjs --output-type
   json > .audit/graph-post-p1d.json` (273 módulos; antes: 335).
2. Grafo de testes regenerado com os mesmos args do P0-B (`__tests__ tests
   src`), em scratchpad.
3. Órfãos computados com a MESMA metodologia do `.audit/scripts/analyze-graph.js`
   do P0-B (fecho transitivo a partir de todas as convenções do App Router +
   middleware + worker; universo `app|components|lib|hooks|domains`), aplicada
   ao par de grafos antigo e novo, e diffada.

## Resultado: ZERO órfãos novos

| | antes (P0-B) | depois (P1-D) |
|---|--:|--:|
| Órfãos no universo do grafo | 120 | 59 |
| **Novos (cascata)** | — | **0** |

Explicação: a detecção do P0-B é por fecho transitivo a partir das rotas —
um arquivo importado apenas por órfãos já estava fora do fecho e portanto
**já constava** na lista original de órfãos. A deleção dos 63 arquivos
(60 da kill-list + app-store + 2 utils de teste) não revelou nenhum arquivo
que antes parecia vivo. Coerente com a construção do método.

120 − 63 = 57 ≠ 59 porque 2 dos arquivos deletados não eram membros da
lista de órfãos do universo do grafo (tests/utils/* está fora do universo
`app|components|lib|hooks|domains`) e a lista antiga incluía itens cuja
condição não mudou; o diff arquivo a arquivo (acima) é a medida exata:
nenhum item da lista nova está ausente da antiga.

## Snapshot dos 59 órfãos remanescentes (insumo do P1-E)

Nenhum é novo; permanecem órfãos de grafo por outros motivos (zumbis com
teste, vendor shadcn ignorado pelo knip, helpers de teste, falso positivo
de dynamic import). Grupos:

### Zumbis com importador de teste (destino: P1-E)
- components/add-content-refactored.tsx (8.5 KB, 1 teste)
- components/add-content/StepIndicator.tsx (1.8 KB, 1 teste)
- hooks/use-content-caching.ts (5.3 KB, 1 teste)
- hooks/useAddContentState.ts (2.9 KB, 1 teste)
- hooks/useFileHandling.ts (1.7 KB, 1 teste)
- lib/platform-utils.ts (12.4 KB, 3 testes)
- lib/react-native-compatibility.ts (13.5 KB, 1 teste)
- lib/security-logger.ts (4.0 KB, 1 teste)

### Órfãos de produção sem teste (avaliar no P1-E)
- components/file-upload.tsx (14.6 KB)
- components/performance-mode.tsx (6.7 KB) — zumbi conhecido, destino P1-E
- components/performance-mode/content-display.tsx (4.2 KB)
- hooks/use-content-preloader.ts (6.2 KB)
- lib/storage-service.ts (4.8 KB)

### Falso positivo confirmado (NÃO deletar — ver P1D-DIVERGENCES.md)
- components/library/index.ts (0.6 KB) — vivo via
  `dynamic(() => import("@/components/library"))` em
  components/library-page-client.tsx:8, alcançável de app/library/page.tsx;
  o depcruise não resolve esse dynamic import de diretório.

### Vendor shadcn (components/ui/*, knip ignora por construção — sem dupla condenação)
- alert-dialog, aspect-ratio, breadcrumb, calendar, collapsible, popover,
  progress, resizable, sheet, table, toaster, toggle (12 arquivos)

### Arquivos de teste e helpers de teste dentro do universo do grafo
(órfãos "por definição do método" — testes são folhas; listados por completude)
- app/api/**/__tests__/*.test.ts (11 arquivos)
- components/__tests__/content-display.test.tsx
- hooks/__tests__/*.{test.ts,test.tsx} (7 arquivos)
- lib/__tests__/* (12 arquivos: 8 .test.ts + api-test-helpers,
  behavioral-test-helpers, custom-matchers, test-auth, test-database)
- lib/test-utils/api-test-helpers.ts, lib/test-utils/supabase-mock-factory.ts

Total: 8 + 5 + 1 + 12 + 33 = 59.
