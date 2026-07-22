# Mapa do arnês de testes (P0-C)

Fonte: varredura estática (`.audit/scripts/harness-scan.js` → harness-scan.json)
cruzada com o runtime do P0-A (`.audit/logs/test.log`). Validação: 143 its
skip/todo estáticos = 143 testes skipped reportados pelo vitest no baseline.

Runners (regras reais dos configs):
- **unit** = `vitest.config.mts`: include default, exclui e2e e `*integration*` → 53 arquivos
- **integration** = `vitest.integration.config.mts`: só `tests/integration/**` e `*integration*` → 6 arquivos
- **e2e** = `playwright.config.ts` (`testDir: tests/e2e`) → 4 arquivos — **suíte inteira não roda** (browsers não instalados, [AMBIENTE] no P0-A)

## 4a. Por arquivo de teste (63 = 100% dos arquivos *.test/*.spec do repo)

| Arquivo | Runner | its | skip | todo | describe.skip | its ATIVOS | Observações |
|---|---|--:|--:|--:|--:|--:|---|
| __tests__/performance-mode/auto-scroll-button-bug.test.tsx | unit | 3 | 0 | 0 | 0 | 3 |  |
| __tests__/performance-mode/chords-display-bug.test.tsx | unit | 3 | 0 | 0 | 0 | 3 | alvo é o gêmeo ÓRFÃO components/performance-mode.tsx |
| app/api/auth/__tests__/session.test.ts | unit | 10 | 0 | 0 | 0 | 10 |  |
| app/api/auth/__tests__/verify.test.ts | unit | 10 | 0 | 0 | 0 | 10 |  |
| app/api/auth/user/__tests__/route.test.ts | unit | 21 | 0 | 0 | 0 | 21 |  |
| app/api/content/[id]/__tests__/route.test.ts | unit | 14 | 10 | 0 | 0 | 4 |  |
| app/api/content/__tests__/route.test.ts | unit | 11 | 0 | 0 | 0 | 11 |  |
| app/api/profile/__tests__/route.test.ts | unit | 15 | 8 | 0 | 0 | 7 |  |
| app/api/setlists/[id]/__tests__/route.test.ts | unit | 19 | 1 | 0 | 0 | 18 |  |
| app/api/setlists/[id]/songs/__tests__/route.test.ts | unit | 9 | 9 | 0 | 0 | 0 |  |
| app/api/setlists/__tests__/route.test.ts | unit | 12 | 4 | 0 | 0 | 8 |  |
| app/api/storage/__tests__/delete.test.ts | unit | 8 | 0 | 0 | 0 | 8 |  |
| app/api/storage/__tests__/upload.test.ts | unit | 2 | 1 | 0 | 0 | 1 |  |
| components/__tests__/content-display.test.tsx | unit | 7 | 0 | 0 | 0 | 7 | alvo é o gêmeo ÓRFÃO performance-mode/content-display.tsx |
| contexts/__tests__/sidebar-context.test.tsx | unit | 2 | 0 | 0 | 0 | 2 |  |
| hooks/__tests__/use-content-caching.test.ts | unit | 15 | 0 | 0 | 0 | 15 | alvo é hook ÓRFÃO (só usado pelo performance-mode.tsx órfão) |
| hooks/__tests__/use-content-renderer.test.ts | unit | 5 | 0 | 0 | 0 | 5 |  |
| hooks/__tests__/use-debounce.test.tsx | unit | 1 | 0 | 0 | 0 | 1 |  |
| hooks/__tests__/use-library-data.test.tsx | unit | 8 | 0 | 0 | 0 | 8 |  |
| hooks/__tests__/use-performance-navigation.test.ts | unit | 21 | 0 | 0 | 0 | 21 |  |
| hooks/__tests__/use-setlist-data.test.tsx | unit | 8 | 0 | 0 | 0 | 8 |  |
| hooks/__tests__/use-toast.test.ts | unit | 4 | 0 | 0 | 0 | 4 |  |
| lib/__tests__/auth-mock-example.test.ts | unit | 10 | 0 | 0 | 0 | 10 |  |
| lib/__tests__/content-service.test.ts | unit | 6 | 0 | 0 | 0 | 6 |  |
| lib/__tests__/firebase-admin.test.ts | unit | 12 | 0 | 0 | 0 | 12 |  |
| lib/__tests__/firebase-server-utils.test.ts | unit | 27 | 0 | 0 | 0 | 27 |  |
| lib/__tests__/security-logger.test.ts | unit | 7 | 0 | 0 | 0 | 7 | alvo é lib ÓRFÃ security-logger.ts |
| lib/__tests__/setlist-service.test.ts | unit | 4 | 0 | 0 | 0 | 4 |  |
| lib/__tests__/utils.test.ts | unit | 2 | 0 | 0 | 0 | 2 |  |
| tests/components/add-content.refactoring.test.tsx | unit | 36 | 9 | 0 | 0 | 27 | alvo principal é código ÓRFÃO (add-content-refactored, useAddContentState, useFileHandling) |
| tests/components/component-functionality.integration.test.tsx | integration | 17 | 0 | 0 | 0 | 17 | SÓ MOCK: zero imports de código do app |
| tests/components/content-viewer.refactoring.test.tsx | unit | 33 | 24 | 0 | 0 | 9 |  |
| tests/e2e/basic.spec.ts | e2e | 7 | 0 | 0 | 0 | 7 | NÃO RODA: browsers Playwright não instalados [AMBIENTE] |
| tests/e2e/dashboard.spec.ts | e2e | 10 | 0 | 0 | 0 | 10 | NÃO RODA: browsers Playwright não instalados [AMBIENTE] |
| tests/e2e/library.spec.ts | e2e | 10 | 0 | 0 | 0 | 10 | NÃO RODA: browsers Playwright não instalados [AMBIENTE] |
| tests/e2e/navigation.spec.ts | e2e | 6 | 0 | 0 | 0 | 6 | NÃO RODA: browsers Playwright não instalados [AMBIENTE] |
| tests/hooks/use-content-loading.test.ts | unit | 3 | 0 | 0 | 0 | 3 | CRASHA: OOM determinístico (P0-A); nunca reporta resultado — mata exit code e coverage |
| tests/hooks/use-performance-controls.memory.test.ts | unit | 4 | 0 | 0 | 0 | 4 |  |
| tests/hooks/use-performance-monitoring-ui.test.ts | unit | 8 | 0 | 0 | 0 | 8 |  |
| tests/hooks/useAddContentState.test.ts | unit | 30 | 4 | 0 | 0 | 26 | alvo é hook ÓRFÃO (só usado por add-content-refactored) |
| tests/hooks/useContentFile.test.ts | unit | 1 | 1 | 0 | 1 | **0** | STUB 6 linhas — suíte real deletada ("TEMPORARILY DISABLED") |
| tests/integration/api-real-world-validation.test.tsx | integration | 16 | 0 | 0 | 0 | 16 | SÓ MOCK; 1 falha [TESTE] no baseline |
| tests/integration/auth-security-flows.test.tsx | integration | 15 | 0 | 0 | 0 | 15 | SÓ MOCK; 4 falhas [TESTE] no baseline |
| tests/integration/data-flow-state-management.test.tsx | integration | 11 | 0 | 0 | 0 | 11 | SÓ MOCK; 5 falhas [TESTE] no baseline |
| tests/integration/end-to-end-workflows.test.tsx | integration | 8 | 0 | 0 | 0 | 8 | SÓ MOCK; 1 falha + 1 unhandled [TESTE] |
| tests/integration/performance-mode-stress.test.tsx | integration | 14 | 0 | 0 | 0 | 14 | SÓ MOCK; 3 falhas [TESTE] no baseline |
| tests/performance/component-refactoring.bench.test.tsx | unit | 18 | 18 | 0 | 1 | 0 | 0 ativos; alvo é código órfão (add-content-refactored) |
| tests/performance/memory-leak-detection.test.tsx | unit | 8 | 1 | 0 | 0 | 7 | SÓ MOCK: zero imports de código do app |
| tests/performance/performance-mode-responsiveness.test.tsx | unit | 7 | 0 | 0 | 0 | 7 | SÓ MOCK: zero imports de código do app |
| tests/platform/platform-utils.test.ts | unit | 46 | 7 | 0 | 0 | 39 | alvo é lib ÓRFÃ platform-utils.ts |
| tests/platform/platform-validation.test.ts | unit | 30 | 0 | 0 | 0 | 30 | alvo é lib ÓRFÃ platform-utils.ts |
| tests/platform/react-native-compatibility.test.ts | unit | 32 | 0 | 0 | 0 | 32 | alvo é lib ÓRFÃ react-native-compatibility.ts |
| tests/security/api-validation.security.test.ts | unit | 12 | 0 | 0 | 0 | 12 |  |
| tests/security/auth-penetration-testing.test.ts | unit | 17 | 3 | 0 | 0 | 14 | import fantasma node-mocks-http (elidido; roda) |
| tests/security/auth-security.test.ts | unit | 1 | 1 | 0 | 1 | **0** | STUB 6 linhas — suíte real deletada |
| tests/security/cors-security.test.ts | unit | 1 | 1 | 0 | 1 | **0** | STUB 6 linhas — suíte real deletada |
| tests/security/ddos-rate-limiting.test.ts | unit | 13 | 0 | 0 | 0 | 13 | SÓ MOCK: zero imports de código do app |
| tests/security/owasp-top10-penetration.test.ts | unit | 26 | 10 | 0 | 0 | 16 | import fantasma node-mocks-http (elidido; roda) |
| tests/security/security-headers-validation.test.ts | unit | 31 | 20 | 0 | 0 | 11 |  |
| tests/security/security-headers.test.ts | unit | 1 | 1 | 0 | 1 | **0** | STUB 6 linhas — suíte real deletada |
| tests/security/token-blacklist-concurrency.test.ts | unit | 11 | 10 | 0 | 0 | 1 | SÓ MOCK: zero imports de código do app |
| tests/typescript-ide-improvements.test.ts | unit | 10 | 0 | 0 | 0 | 10 | import type @/types/database não resolve (apagado em runtime) |
| tests/typescript-strict-mode.test.ts | unit | 11 | 0 | 0 | 0 | 11 | import type @/types/database não resolve (apagado em runtime) |

Totais estáticos: 780 its declarados, 637 ativos, 143 skip/todo (63 arquivos).

## 4b. Por área de produto — onde existe proteção ATIVA

"Ativa de verdade" = its ativos que exercitam código do app que está montado em
rota. Testes cujo alvo é código órfão protegem um cadáver: contam como ativos
no runner, mas não protegem o produto.

| Área | Teste ativo? | Arquivos que cobrem (its ativos) | Buracos |
|---|---|---|---|
| **auth/security** | **SIM — o arnês mais forte do repo** | app/api/auth/__tests__/session (10), verify (10), user/route (21); lib/__tests__/firebase-admin (12), firebase-server-utils (27), auth-mock-example (10); tests/security/api-validation (12), owasp-top10 (16), auth-penetration (14), security-headers-validation (11, exercita `middleware.ts` real) | 3 STUBs deletados (auth-security, cors-security, security-headers); token-blacklist-concurrency 1/11 ativo e só-mock; ddos-rate-limiting só-mock; integration auth-security-flows só-mock com 4 falhas; security-logger.test protege lib órfã |
| **content** | **SIM em API; fraco em UI** | app/api/content/route (11), [id]/route (4 de 14); storage upload (1)+delete (8); lib/__tests__/content-service (6); hooks/__tests__/use-content-renderer (5); content-viewer.refactoring (9 de 33) | [id]/route com 10 skips; useContentFile é STUB; use-content-loading CRASHA (OOM) e derruba a suíte; add-content.refactoring (27 ativos) + useAddContentState (26) apontam para código ÓRFÃO — o add-content REAL em rota fica sem teste de componente |
| **setlist** | **SIM em API/serviço; zero em UI** | app/api/setlists/route (8), [id]/route (18); lib/__tests__/setlist-service (4); hooks/__tests__/use-setlist-data (8) | [id]/songs/route **0 ativos (9/9 skip)** — reordenar/adicionar música sem proteção; nenhum teste de componente de setlist |
| **performance-mode** | **PARCIAL — metade do arnês protege o gêmeo morto** | hooks/__tests__/use-performance-navigation (21), use-content-caching (15, hook órfão), tests/hooks/use-performance-controls.memory (4), use-performance-monitoring-ui (8); __tests__/performance-mode/auto-scroll-button-bug (3, header-controls VIVO) | chords-display-bug (3) e content-display.test (7) testam os gêmeos ÓRFÃOS; o par em rota (optimized-performance-mode + optimized-content-display) NÃO tem teste de componente direto; responsiveness/memory-leak/stress são só-mock; bench 0 ativos |
| **library** | **QUASE ZERO** | hooks/__tests__/use-library-data (8) | Nenhum teste de componente (library.tsx, RefactoredLibrary, OptimizedLibraryList); e2e/library.spec (10) não roda [AMBIENTE] |
| **settings** | **ZERO em UI** | app/api/profile/route (7 de 15) é o mais próximo (perfil) | settings.tsx / RefactoredSettings: nenhum teste em nenhum runner |
| infra/outros | SIM | lib/utils (2), use-debounce (1), use-toast (4), sidebar-context (2), platform/* (39+30+32 — mas alvos são libs ÓRFÃS platform-utils/react-native-compatibility), typescript-* (21, tipos com import quebrado) | 6 arquivos "integration" são só-mock: mesmo passando, não validam o app (14 falhas [TESTE] no baseline) |

## 4c. Pares gêmeos (P0-B) × proteção de teste

| Par | Arquivo | Em rota? | Teste que o protege | Ativo? |
|---|---|---|---|---|
| performance-mode | components/performance-mode.tsx | NÃO (órfão) | __tests__/performance-mode/chords-display-bug.test.tsx (3 its) | ATIVO — protege o gêmeo morto |
| performance-mode | components/optimized-performance-mode.tsx | SIM (app/performance) | nenhum teste direto de componente; indireto: auto-scroll-button-bug (header-controls), hooks use-performance-navigation/controls/monitoring | parcial/indireto |
| content-display | components/performance-mode/content-display.tsx | NÃO (órfão) | components/__tests__/content-display.test.tsx (7 its) | ATIVO — protege o gêmeo morto |
| content-display | components/performance-mode/optimized-content-display.tsx | SIM (app/performance) | **nenhum** | — |
| perf-controls | components/performance-mode/optimized-performance-controls.tsx | NÃO (órfão, condenado 2×) | nenhum (use-performance-controls.memory testa o hook, não este componente) | — |
| add-content | components/add-content.tsx | SIM (app/add-content) | nenhum teste direto | — |
| add-content | components/add-content/RefactoredAddContent.tsx | SIM | indireto: add-content.refactoring.test importa subcomponentes vivos (ContentTypeSelector, ModeSelector, ImportModeSelector) | parcial |
| add-content | components/add-content-refactored.tsx | NÃO (órfão) | tests/components/add-content.refactoring.test.tsx (27 ativos, 9 skip) + bench (0 ativos) | ATIVO — protege o gêmeo morto |
| library | components/library.tsx + library/RefactoredLibrary.tsx | SIM (ambos) | nenhum teste de componente; hook use-library-data (8) ativo | parcial/indireto |
| library-list | components/library-list.tsx | NÃO (órfão, condenado 2×) | nenhum | — |
| library-list | components/library/OptimizedLibraryList.tsx | SIM | nenhum | — |
| settings | components/settings.tsx + settings/RefactoredSettings.tsx | SIM (ambos) | **nenhum** | — |
| setlist-list | components/setlist/setlist-list.tsx | SIM (app/setlists) | nenhum teste de componente | — |
| setlist-list | components/setlist/setlist-list-refactored.tsx | NÃO (órfão, condenado 2×) | nenhum | — |
| metadata-form | components/metadata-form.tsx + metadata-form/RefactoredMetadataForm.tsx | SIM (ambos) | nenhum teste direto | — |
| content-service | lib/content-service.ts | SIM (7 rotas) | lib/__tests__/content-service.test.ts (6 its) | ATIVO |
| content-service | lib/content-service-server.ts | SIM (4 rotas) | content-service.test + setlist-service.test | ATIVO |
| content-service | lib/content-service-refactored.ts | NÃO (órfão, condenado 2×) | nenhum | — |
| content-service | domains/content-management/services/content-service.ts | NÃO (órfão, condenado 2×) | nenhum | — |
| setlist-service | lib/setlist-service.ts | SIM (5 rotas) | lib/__tests__/setlist-service.test.ts (4) + use-setlist-data.test (8) | ATIVO |
| setlist-service | lib/setlist-service-refactored.ts | NÃO (órfão, condenado 2×) | nenhum | — |

**Padrão que salta aos olhos**: nos 4 pares onde existe teste de componente
ativo, o teste protege o gêmeo MORTO (performance-mode, content-display,
add-content-refactored) — o gêmeo em rota fica sem proteção direta. A Fase 1
não pode simplesmente deletar esses testes junto com o cadáver: são a única
especificação de comportamento que existe para o gêmeo vivo. Migrar o alvo do
teste antes de deletar.
