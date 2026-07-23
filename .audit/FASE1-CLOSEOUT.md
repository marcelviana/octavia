# FASE1-CLOSEOUT — Fechamento da Fase 1 (P1-E)

Data: 2026-07-23. HEAD do fechamento: `ed8e4dc` (+ este commit).
Runtime: Node v22.23.1 (`.nvmrc`), pnpm 10.28.0.
Todos os 5 lotes (A–E) commitados com `pnpm test` e `pnpm build` em exit 0.

## O que a Fase 1 entregou

Um arquivo por conceito; arnês apontando só para código vivo. Todos os
gêmeos mortos (`performance-mode`, `add-content` e satélites), órfãos de
produção e zumbis mantidos vivos só por teste foram removidos, com as specs
recuperáveis migradas para os gêmeos vivos (P1-B) antes da deleção.

## Contagem de arquivos e KB — antes (P0) / depois

| Medida | P0 (`08960e1`) | pós-P1-D (`1e37adc`) | pós-P1-E | Δ Fase 1 |
|---|--:|--:|--:|--:|
| Arquivos no tree completo | **483** | 456 | **430** | −53 |
| Arquivos excl. `.audit/`+`.planning/` | 448 | 382 | **356** | **−92** |
| KB excl. `.audit/`+`.planning/` | 5 078 | 4 621 | **4 397** | **−681 KB** |

(O tree completo ganhou artefatos de auditoria durante a fase; a linha
excl. `.audit/`/`.planning/` é a medida do código real.)

P1-E em si: **27 arquivos deletados (224,3 KB)** + 1 renomeado
(`useAddContentState.test.ts` → `useAddContentLogic.test.ts`), em 5 commits:

- `14641af` lote A — gêmeos de performance-mode (4 prod + 2 testes)
- `d545b99` lote B — gêmeos de add-content (4 prod) + rename + 25 its INAPLICÁVEL
- `2b2c756` lote C — órfãos de produção (5) + 4 testes fantasma (115 its)
- `26c0d95` lote D — helpers/scripts de teste mortos (6) + vi.mock inerte
- `ed8e4dc` lote E — runner de integração vazio [D5]

## Balanço do arnês (its)

Suite unitária: **504 passed / 165 skipped (669)** no baseline P1-A →
**381 passed / 115 skipped (496)** no fechamento. Nenhum it verde de código
vivo foi perdido: todo delta é cobertura fantasma ou skip de superfície morta.

| Categoria | Its | Detalhe |
|---|--:|---|
| **Fantasma removidos (passavam contra alvo morto)** | **130** | use-content-caching 15; platform-utils 46; platform-validation 30; react-native-compatibility 32 (7 destes já skipped); security-logger 7 |
| **Fantasma removidos (skip permanente)** | **18** | component-refactoring.bench (100% skip desde o baseline, último importador dos gêmeos mortos) |
| **INAPLICÁVEL(P1-B) removidos** | **25** | 21 vereditos INAPLICÁVEL + 4 its de divisão do P1-B (superfície exclusiva dos mortos); o marcador dizia "remover junto com o gêmeo morto" — removidos neste P1-E |
| **Migrados no P1-B (rodam contra os vivos)** | **45** | [PASSA] revalidados sob Node 22 (P1-V) |
| **Skipados como bug real — `it.skip BUG(P1-B)`** | **10** | spec pronta do fix de /add-content (upload, erro, Back, headings); ficam no arnês |

Conferência aritmética contra o runner: lote A −15 passed/−18 skipped;
lote B −25 skipped; lote C −108 passed/−7 skipped. 669 − 33 − 25 − 115 = 496 ✓.

## Pós-condição: grafo e knip (meta atingida)

- `graph-post-p1e.json`: **255 módulos** (P0: 335 → pós-P1-D: 273 → 255).
- **Zero `Refactored*`/`optimized-*`/`*-refactored` sem par vivo** — os 6
  remanescentes (RefactoredAddContent, RefactoredLibrary,
  RefactoredMetadataForm, RefactoredSettings, optimized-performance-mode,
  optimized-content-display) estão todos no fecho de rota (verificado contra
  o grafo pós-P1-E). São os gêmeos VIVOS; os shims de 1–2 linhas que os
  montam colapsam na Fase 3.
- `knip-post-p1e.md`: **1 unused file** — `components/library/index.ts`,
  exatamente o falso positivo documentado (vivo via dynamic import de
  diretório, `P1D-DIVERGENCES.md` §1). Zero fora das exceções.
- Órfãos do universo do grafo (metodologia P0-B): 120 (P0) → 59 (P1-D) →
  **41**, decompostos SEM resto:
  - 28 arquivos/helpers de teste dentro do universo (folhas por definição
    do método: 11 testes de app/api, 1 de components, 6 de hooks,
    8 em lib/__tests__, 2 em lib/test-utils — todos executados pelo runner
    ou importados por testes vivos);
  - 12 shadcn vendor em `components/ui/` (pendência deliberada, abaixo);
  - 1 falso positivo confirmado (`components/library/index.ts`).
  **Zero órfãos de produção reais.** Todo arquivo de produção restante está
  no fecho de rota/entrypoint ou justificado acima.

## Candidatos poupados pela verificação por arquivo

Nenhum. Os greps do protocolo (passo 1, por lote) não encontraram nenhum
importador vivo fora dos próprios lotes. Destaques exigidos pelo plano:

- **storage-service.ts — verificação 2×**: grep cru
  (`grep -rn "storage-service" …` → único hit:
  `components/file-upload.tsx:34`) e fecho no grafo pós-P1-D (único
  alcançador: `components/file-upload.tsx`, ele próprio órfão do mesmo
  lote). Nenhuma rota de upload o alcança — as rotas `app/api/storage/*`
  usam outro caminho. Deletado.
- **file-upload.tsx**: deletado mesmo com o bug de upload aberto em
  /add-content — o fix futuro será no componente vivo
  (`RefactoredAddContent`), com spec pronta nos `it.skip BUG(P1-B)`; não
  ressuscitar este órfão.
- **components/library/index.ts**: NÃO tocado (falso positivo confirmado,
  proibido pelo escopo).

## Pendências deliberadas (herdadas pela Fase certa)

1. **Shims de 1–2 linhas a colapsar — Fase 3**: `components/library.tsx`,
   `components/settings.tsx`, `components/add-content.tsx`,
   `components/metadata-form.tsx` (e avaliar o barrel
   `components/library/index.ts` junto, trocando o dynamic import por
   import direto).
2. **12 shadcn vendor** em `components/ui/` (alert-dialog, aspect-ratio,
   breadcrumb, calendar, collapsible, popover, progress, resizable, sheet,
   table, toaster, toggle): pendência deliberada — deletar primitivo vendor
   é decisão separada de deletar código do app (KNIP-NOTES §1). O knip
   também acusa as dependências radix correspondentes como unused
   (`knip-post-p1e.md`); tratar em conjunto.
3. **Buraco de teste em `app/api/setlists/[id]/songs`** — Fase 4: o arquivo
   de teste da rota existe mas está 100% skipped (9 its).
4. **Bug do upload em /add-content** — fase de fix: sem UI de upload
   (placeholder literal), erro nunca renderizado, sem botão Back, headings
   perdidos. Spec executável pronta nos 10 `it.skip BUG(P1-B)`
   (LOST-BEHAVIOR.md); para reativar, remover o `.skip`.
5. **Flake/falha funcional no e2e**: `basic.spec.ts:96` navegação /signup
   nunca atinge networkidle (chromium) — registrada em E2E-BASELINE.md.
6. **Decisão D4** (matrix de browsers do Playwright): 99/100 falhas do e2e
   baseline são [AMBIENTE] (firefox/webkit não instalados). Pendente decisão
   humana: instalar browsers ou reduzir a matrix.
7. **Docs desatualizadas pós-D5** (fora do escopo fechado do P1-E):
   `README.md:212`, `TESTING_STRATEGY.md:200,203` e snapshots
   `.planning/codebase/{STACK,STRUCTURE,TESTING}.md` ainda citam
   `test:integration`/`vitest.integration.config.mts`. Também restou a linha
   inerte `'src/test-setup-integration.ts'` no coverage-exclude de
   `vitest.config.mts` (config proibido no escopo).
8. **Unused dependencies do knip** (17 deps + 6 devDeps em
   `knip-post-p1e.md`): não avaliadas nesta fase — parte é consequência do
   vendor shadcn (item 2), parte pede auditoria própria (ex.: zustand,
   immer, msw, react-hook-form).

## Critério de aceite — verificação

- ✅ `pnpm test` + `pnpm build` exit 0 nos 5 commits (contagens em cada
  mensagem de commit).
- ✅ Nenhum teste aponta para arquivo inexistente (suite 46 files passed /
  5 skipped, zero erros de resolução; greps por lote limpos).
- ✅ Todo arquivo de produção restante está no fecho de rota/entrypoint OU
  justificado acima (decomposição exata dos 41 órfãos de grafo).
- ✅ Este documento.
