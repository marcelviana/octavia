# E2E BASELINE — primeira execução real (P1-A)

Data da medição: 2026-07-23 (run iniciado 13:48:58 UTC)
Ambiente: macOS (Darwin 25.5.0), Node v22.23.1 (.nvmrc), pnpm 10.28.0,
Playwright 4 workers, dev server local (`pnpm dev` via webServer do config).
Log completo: `.audit/logs/e2e-first-real-run.log`. JSON: `test-results/results.json`.

## Sumário

| Métrica | Valor |
|---|---|
| Total de execuções | 165 (33 testes × 5 projetos) |
| Passed | **65** |
| Failed | **100** |
| Duração | 2.2m (130 s) |
| Exit code | 1 |

Das 100 falhas, **99 são [AMBIENTE]** (browsers firefox/webkit não instalados
no host — ver "Projetos não executados" abaixo) e **1 é falha funcional real**
no chromium.

## Resultado por projeto

| Projeto | Passed | Failed | Natureza das falhas |
|---|---|---|---|
| chromium | 32/33 | 1 | 1 falha funcional real (abaixo) |
| Mobile Chrome | 33/33 | 0 | — |
| firefox | 0/33 | 33 | [AMBIENTE] browser ausente |
| webkit | 0/33 | 33 | [AMBIENTE] browser ausente |
| Mobile Safari | 0/33 | 33 | [AMBIENTE] usa webkit, mesmo browser ausente |

## Resultado por spec (projetos que executaram de fato: chromium + Mobile Chrome)

| Spec | chromium | Mobile Chrome |
|---|---|---|
| basic.spec.ts (7 testes) | 6 pass / **1 fail** | 7 pass |
| dashboard.spec.ts (10 testes) | 10 pass | 10 pass |
| library.spec.ts (10 testes) | 10 pass | 10 pass |
| navigation.spec.ts (6 testes) | 6 pass | 6 pass |

### Única falha funcional real

- **Teste**: `[chromium] › tests/e2e/basic.spec.ts:96 › Basic App
  Functionality › should handle page navigation` (36.9 s)
- **Erro cru**: `Test timeout of 30000ms exceeded.` Console do teste
  imediatamente antes: `⚠️ Could not navigate to /signup:
  page.waitForLoadState: Test timeout of 30000ms exceeded.`
- **Leitura honesta**: o teste navega para `/signup` e espera
  `networkidle`, que nunca chega em 30 s no Desktop Chrome. O mesmo teste
  **passa no Mobile Chrome**, então não é quebra universal da rota — pode
  ser requisição pendente que nunca aquieta (polling/stream) no viewport
  desktop, ou flutuação do dev server. NÃO investigado nem consertado
  nesta unidade ([P1-A proíbe consertar e2e]); fica como a falha nº 1 de
  e2e a diagnosticar.

## Projetos não executados: firefox, webkit, Mobile Safari — 99 execuções

- **Erro cru (firefox, 33×)**: `Error: browserType.launch: Executable
  doesn't exist at /Users/marcelviana/Library/Caches/ms-playwright/
  firefox-1490/firefox/Nightly.app/Contents/MacOS/firefox`
- **Erro cru (webkit + Mobile Safari, 66×)**: `Error: browserType.launch:
  Executable doesn't exist at /Users/marcelviana/Library/Caches/
  ms-playwright/webkit-2203/pw_run.sh`
- **Classificação**: [AMBIENTE]. Esses 99 "failed" do sumário do Playwright
  são **não-executados**: nenhum teste desses projetos chegou a abrir página.
  Nada se pode afirmar sobre o app em firefox/webkit/iOS Safari por esta rodada.
- **Decisão pendente (humana)**: instalar firefox+webkit no host (e no CI) OU
  reduzir o matrix do playwright.config.ts para os projetos que o time de fato
  sustenta. Por instrução explícita, **nenhum browser foi instalado nesta
  unidade** e o config não foi tocado.

## Observações do ambiente registradas no log

- Warning do Next.js: `nodejs runtime support for middleware requires
  experimental.nodeMiddleware be enabled in your next.config` (já visto no
  build do P0-A).
- Conflito de dylib no processo do dev server: `Class
  GNotificationCenterDelegate is implemented in both @img/sharp-libvips
  ... e canvas/.../libgio-2.0.0.dylib` — registrado, sem ação.
- Global-setup: `✅ User already authenticated` — o estado de auth salvo em
  `tests/e2e/.auth/user.json` foi reutilizado; o fluxo de signup/login do
  global-setup não foi exercitado nesta rodada.
- Logs repetidos do servidor durante os testes: `Server-side user: No
  session cookie found` — os testes rodam majoritariamente sem sessão
  server-side válida; os specs foram escritos para tolerar ambos os estados.
