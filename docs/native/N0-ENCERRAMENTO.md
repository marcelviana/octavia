# N0-ENCERRAMENTO.md — Bloco N0 (stack do nativo)

> **Data**: 2026-09-08 (bloco executado em 2026-09-06/07, uma sessão). **Veredito: N0 ✅ — o stack nativo existe e H15 é verdadeira.** Sete PRs (#263–#269), todas mergeadas pelo Marcel; zero mudança de backend; zero escrita em prod; zero login com o avião ligado.
> **Fonte dos números**: corpos das PRs e docs commitados ([`N0-PRECHECK.md`](N0-PRECHECK.md), [`N0-H15.md`](N0-H15.md), [`N0-H16.md`](N0-H16.md), [`N0-ACEITE-TAB-S6.md`](N0-ACEITE-TAB-S6.md), anexos em [`N0-anexos/`](N0-anexos/) — 47 arquivos, 2,1 MB). Todo número é `[medido]` salvo marcação.
> **Campos do Marcel não preenchidos no prompt do encerramento** (placeholders literais): H16 da conta principal e N0-H7 → registrados como **"não medido"**; corrigíveis por errata.

## 1. Pergunta do bloco e resposta

"O stack nativo existe (monorepo, runtime, bibliotecas, build verificável) e a hipótese que bloqueava o N0 — H15, a sessão do Firebase persiste e opera sem rede — é verdadeira?" **Sim.** `apps/native` (Expo SDK 57 / RN 0.86.3, dev build) roda no workspace pnpm 10.28.0 isolado com `@octavia/core`; loga por email/senha e lê `GET /api/setlists` com bearer; **H15-a verdadeira** no emulador (API 31) e no Tab S6 (API 32); PDF do cache em modo avião com 12 páginas navegáveis; APK de debug por PR no CI.

## 2. Arco — PR × escopo × sha × data × prova principal × controle negativo (regra nº 7)

| PR | Escopo | Merge (sha · UTC) | Prova principal | Controle negativo |
|---|---|---|---|---|
| **#263** N0-PR0 | pre-check (Fases A/B/C), decisões N0-D1…D9, 16 divergências | `580874f` · 2026-09-07T11:00:54Z | probe Expo 57 standalone → APK no `Medium_Tablet`; `cmd connectivity airplane-mode` corta a rede virtual | — (docs) |
| **#264** N0-PR1 | workspace (`.`, `apps/*`, `packages/*`), `packages/core` + `normalizeForSearch`, gate `tsc` do core no `ci.yml`, guarda `window` em `src/test-setup.ts` (N0-D10) | `6bfb84d` · 11:22:02Z | Vitest da raiz coleta o core: 649 → 653 passed | commit 1 com asserção invertida → CI vermelho **pelo core** (`expected 'aguas' to be 'Aguas'`); erro de tipo no core → `tsc -p packages/core` falha, raiz cega |
| **#265** N0-PR2 | `apps/native` blank no workspace, `scripts/native-env.sh`, AVD `octavia_tab` (API 31), `native.yml` (APK por PR, `paths`) | `aca0002` · 13:11:32Z | **N0-H1**: Metro serve `apps/native/index.ts (708 modules)` de dentro do workspace; blank no `octavia_tab` | commit 1 com plugin falso → `native.yml` vermelho no `Prebuild` (`PluginError`) |
| **#266** N0-PR3 | `firebase` JS SDK + AsyncStorage, `createAuthFetch` (T1-R1/R3/R12) no core (5 testes), login + `GET /api/setlists`, oráculo de token, `Type-check apps/native` no `native.yml` | `8bb2948` · 13:51:55Z | `auth uid=Pw3b… src=login` = `sub` do oráculo; `api status=200 n=1`; `setlists=3`; **N0-H2/N0-H8** em runtime | erro de tipo no app → `native.yml` vermelho no `Type-check apps/native`; anti-loop do 401 removido → teste (c) falha |
| **#267** N0-PR4 | H15 no `octavia_tab`: 4 aberturas (fresco/expirado/online/`pm clear`), N0-H10, protocolo C2 reescrito, `N0-H15.md` | `9310ba7` · 17:06:15Z | **H15-a verdadeira**: `src=restored` sem `login-screen` em avião, token fresco e expirado | `pm clear` em avião → só `login-screen`, 0 `auth uid=` |
| **#268** N0-PR5 | `react-native-pdf` + `blob-util` + config plugins 14.0.2, `expo-file-system`, `files.ts`/`PdfProbe.tsx`, `N0-H16.md` | `40da95c` · 20:49:20Z | H16 audit 265.002 B; A9 (sha256 do disco = P4); T1-R14; **A13** (12 páginas em avião); plugin × SDK 57 | cache apagado + avião → placeholder "Arquivo não baixado" + "Baixar" sem crash |
| **#269** aceite | Tab S6 (SM-T865, API 32) por USB, `N0-ACEITE-TAB-S6.md` | `8df0062` · 2026-09-08T00:12:19Z | **N0-H9 verdadeira**: A–F reproduzidos no device (login, download, sha, avião + `restored`, `n=12/12`) | `pm clear` em avião → só `login-screen` |

## 3. Decisões N0-D1…D11 — estado final (todas fechadas)

| # | Decisão | Estado |
|---|---|---|
| N0-D0 | N0 = stack; `apps/native` + `packages/core` adicionados; Next na raiz; emulador AVD tablet; Tab S6 uma vez no aceite | executada |
| N0-D1 | `firebase` JS SDK + `@react-native-async-storage/async-storage` 2.2.0 | executada (PR3); H15 verdadeira com ela |
| N0-D2 | `react-native-pdf` 7.0.5 + `react-native-blob-util` 0.24.10 + `@config-plugins/*` 14.0.2 | executada (PR5); compatível com SDK 57 (prebuild + Gradle + render + CI) |
| N0-D3 | fixar Expo ~57.0.20 / RN 0.86.3 / React 19.2.3 / TS ~6.0.3 (app), JDK 17, Node 22 | executada |
| N0-D4 | linker isolado; `.npmrc` intocado | executada (React 18 × 19 convivem) |
| N0-D5 | AVD `octavia_tab` API 31 `pixel_tablet` (download 1,42 GB / 4,2 GB em disco, mantido — div. 19) | executada; **N1: migrar para API 32** (Tab S6 é 12L) |
| N0-D6 | pre-check por PR | executada (#263) |
| N0-D7 | manter NDK 27.1 / build-tools 36 / platform 36 instalados pelo Gradle + inventário antes/depois em toda build | executada; inventários idênticos em PR2–PR5 e aceite |
| N0-D8 | `scripts/native-env.sh` versionado | executada (PR2) |
| N0-D9 | package `rocks.octavia.app` | executada (PR2) |
| N0-D10 | guarda `typeof window` em `src/test-setup.ts:296` (E3 × `setupFiles` global); `test.projects` = backlog | executada (PR1) |
| **N0-D11** | o código de `apps/native` do N0 (`App.tsx`, `PdfProbe.tsx`, `files.ts`, `api.ts`, `firebase.ts`, `log.ts`) é **tela de prova, descartável** — o N1 substitui a UI inteira a partir do PRD + design; herança = `packages/core` (`normalize`, `auth-fetch`), `scripts/native-env.sh`, `native.yml`, o AVD e os protocolos | registrada (2026-09-07) |

## 4. Hipóteses — estado final

| # | Hipótese | Estado | Prova |
|---|---|---|---|
| **H15-a** | usuário do Firebase restaurado sem rede (T1-R19/A5) | **verdadeira** | `N0-H15.md` §1/§3; aceite passo C; anexos `PR4-logcat-{1,3}`, `ACEITE-logcat-C` |
| **H15-b / N0-H3** | token disponível sem rede | **condicional**: fresco → do cache; expirado → `auth/network-request-failed` sem deslogar | `N0-H15.md` §1; `PR4-logcat-1-expirado` |
| **H16** (audit) | tamanho real dos PDFs | **fechada**: 265.002 B em 4 objetos; maior 242.176 B; teto LRU 200 MB = folga | `N0-H16.md` §1; `PR5-head.txt` |
| H16 (principal) | idem, conta principal | **não medido** (placeholder do Marcel não preenchido no encerramento) | — |
| **N0-H1** | Expo 57 + Metro no workspace pnpm isolado | **verdadeira** | PR2; `PR2-run-android.log.txt` (`Android Bundled … apps/native/index.ts`) |
| **N0-H2** | Metro resolve a condition `react-native` de `@firebase/auth` sem config | **verdadeira** | PR3 runtime (login funciona); div. 23 para o `tsc` |
| **N0-H6** | custo do `native.yml` | **medido**: frio 8 min 11 s (Gradle 6 min 59 s), cache 5 min 39 s (Gradle 4 min 15 s), com plugins 8 min 03 s (Gradle 6 min 29 s) | PR2/PR5 |
| N0-H7 | duração do deploy do Vercel em `ae298fe` × último | **não medido** (placeholder não preenchido) | — |
| **N0-H8** | Metro resolve `@octavia/core` via `workspace:*` | **verdadeira** | PR3 |
| **N0-H9** | protocolo vale no Android do fabricante por USB | **verdadeira** | `N0-ACEITE-TAB-S6.md` |
| **N0-H10** | Metro alcançável com o avião ligado via `adb reverse` (rede virtual e USB) | **verdadeira** | `N0-H15.md` §2; aceite §1 |
| N0-H11 | `cache: 'no-store'` no fetch do RN é no-op; T1-R12 coberto pelo `must-revalidate` do servidor | **aberta → N1** | — |
| filtro `paths` do `native.yml` | PR só de docs não dispara `android-debug-apk` | **verdadeira** | #269: só o workflow `CI` rodou |
| plugin 14.0.2 × SDK 57 | `@config-plugins/react-native-pdf` (tabela para em Expo 56) funciona no 57 | **verdadeira** | PR5 local + CI |
| `cmd connectivity airplane-mode` | existe e corta a rede na API 31 (AVD) e na One UI 4.1.1 / API 32 (Tab S6) | **verdadeira** | PR2 §2.6; aceite §1 |
| Maestro (camada 3) | instalação, suporte a API 35/36 | **hipótese inteira** — não instalado (regra 8) | decisão para o pre-check do N1 |

## 5. Divergências 1–28 consolidadas

Origem: **P** = premissa do prompt do revisor · **M** = premissa do Marcel via prompt · **D** = premissa de doc anterior (pre-check/PRD/C) · **A** = ambiente da máquina · **T** = toolchain/aparato · **X** = template/tool de terceiros.

| # | PR | Uma linha | Origem |
|---|---|---|---|
| 1 | #263 | `pnpm type-check` não existe | P |
| 2 | #263 | baseline "649 testes / 86 arquivos" tinha a forma errada (86 = skipped) | P |
| 3 | #263 | `playwright.config.*` não existe (é `playwright.ux-audit.config.ts`) | P |
| 4 | #263 | "módulo de normalização do B6" é sanitização de nome de arquivo, não busca | P |
| 5 | #263 | `ANDROID_HOME`/PATH não definidos | A |
| 6 | #263 | pnpm global 11.16.0 × repo 10.28.0 | A |
| 7 | #263 | sem imagem API 31 / sem AVD de tablet na API alvo | A |
| 8 | #263 | `emulator-5562 offline` fantasma (NTKDaemon na 5563) | A |
| 9 | #263 | Gradle instalou NDK 27.1 + build-tools 36 + platform 36 (2,7 GB) sem perguntar | T |
| 10 | #263 | template fixa RN 0.86.3 (não 0.87.1) | X |
| 11 | #263 | CI em Node 20 × Expo exige ≥ 22.13 | A |
| 12 | #263 | `pnpm-workspace.yaml` já existia | P |
| 13 | #263 | H16 audit = 4 objetos distintos (5 `file_url`) | D |
| 14 | #263 | sem `timeout` no macOS | A |
| 15 | #263 | `ci.yml` vermelho na main em `ae298fe` (flake) | A |
| 16 | #263 | `gh run list --json durationMs` não existe | P |
| 17 | #264 | core sem gate de tipos (C1/E3 × `exclude packages/**`) → tsconfig próprio + passo no `ci.yml` | D |
| 18 | #264 | E3 `@vitest-environment node` × `setupFiles` global (`window`) → N0-D10 | P |
| 19 | #265 | imagem API 31: download 1,42 GB, 4,2 GB em disco | T |
| 20 | #265 | "o `.gitignore` da raiz já cobre" era falso para `node_modules` (`/node_modules` ancorado) | P |
| 21 | #266 | doc C2: `logcat -s OCTAVIA:*` → `-s ReactNativeJS \| grep OCTAVIA:` | D |
| 22 | #266 | com `expo-dev-client`, `am start -n` abre o launcher; só o deep link carrega o bundle | T |
| 23 | #266 | `tsc` não vê `getReactNativePersistence` (`types` antes de `react-native` no `exports`) | T |
| 24 | #266 | `adb shell input text` engole caractere especial da senha | T |
| 25 | #267 | protocolo C2 reescrito (deep link `localhost`, `adb reverse`, probe `nc`, dois estados do token) | D |
| 26 | #269 | Tab S6 é **API 32** (Android 12L), não 31 | M |
| 27 | #269 | "#268 mergeada" — estava `OPEN` na 1ª medição | M |
| 28 | #269 | `adb install -r -d --user 0` do Expo trava com o device bloqueado | T |

Contagem: **P (prompt do revisor) = 8** (1, 2, 3, 4, 12, 16, 18, 20) · M = 2 · D = 4 · A = 7 · T = 6 · X = 1 (soma 28). Nenhuma foi acomodada; todas estão nos corpos das PRs.

## 6. Aparato de validação — estado final (quatro camadas)

1. **`packages/core` no Vitest da raiz + `tsc` próprio** — provado: `normalize.test.ts` (4) + `auth-fetch.test.ts` (5) = **9 testes**, `// @vitest-environment node`, coletados pelo default do Vitest (sem `include`); `tsc -p packages/core/tsconfig.json` (standalone, `lib ES2022`, sem DOM — tipos estruturais no `auth-fetch`) como passo bloqueante do `ci.yml`. Regras: zero `react`/`react-native`/`firebase`; `zod ^3`; TS 5.
2. **`native.yml`** — `pull_request`/`push` com `paths` (`apps/native/**`, `packages/core/**`, o próprio yml, lock, workspace); `setup-node 22` + `setup-java 17` + `setup-android` + cache do Gradle; passos `Install` → **`Type-check apps/native`** → `Prebuild (android)` → `Gradle assembleDebug` → artefato `app-debug.apk` (7 dias). Durações em §7. Sem EAS, sem segredo.
3. **Maestro** — **não instalado; hipótese inteira** (doc: API 29–34, "35/36 arriving Q2 2026"; JDK 17+). Decisão para o pre-check do N1 — com a restrição de que a senha só entra manualmente (div. 24).
4. **Protocolo adb** — emulador `octavia_tab` (API 31) e Tab S6 (API 32), mesmos comandos: `source scripts/native-env.sh` (+ `ANDROID_SERIAL`); `adb reverse tcp:8081 tcp:8081`; probe do Metro `sh -c "(printf 'GET /status HTTP/1.0\r\n\r\n'; sleep 2) | nc 127.0.0.1 8081"`; `cmd connectivity airplane-mode enable|disable` + `settings get global airplane_mode_on` + `ping -c 1 -W 3 8.8.8.8`; abertura **só** por `am start -a android.intent.action.VIEW -d 'exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'`; `am force-stop` / `pidof` / `dumpsys activity activities | grep -i octavia`; `adb logcat -d -s ReactNativeJS | grep 'OCTAVIA:'`; `run-as rocks.octavia.app find/cat` para sha256; `pm clear` como controle negativo; `screencap`. Device real: instalar com `adb install -r -d` direto e Metro com `expo start --dev-client` (div. 28).

## 7. Números

| Medida | Antes | Depois |
|---|---|---|
| Suíte da raiz | 649 passed / 86 skipped (735) · 74 files / 4 skipped (78) | **658 / 86 (744) · 76 / 4 (80)** (+4 normalize, +5 auth-fetch) |
| `ci.yml` | main `580874f`: 3 min 05 s (install 4 s) | PR1 3 min 19 s (install 10 s) · PR2 3 min 05 s · PR3 3 min 14 s (install 13 s) · PR4 3 min 01 s · PR5 3 min 13 s · aceite 2 min 59 s — sem piora estrutural |
| `native.yml` | — | PR2 frio **8 min 11 s** (Gradle 6 min 59 s) · rerun com cache **5 min 39 s** (Gradle 4 min 15 s, cache ~1,5 GB) · PR3 5 min 24 s · PR4 6 min 58 s · PR5 (com pdf/blob/file-system) **8 min 03 s** (Gradle 6 min 29 s) |
| APK debug | probe standalone 46.493.676 B | blank no workspace 62.569.791 B (local) / 67.189.647 B (CI) · PR3 67.304.632 B · PR5 **78.445.125 B** |
| `pnpm-lock.yaml` | 11.177 linhas | 15.167 (PR2) → 15.790 (PR3) → **15.871** (PR5) |
| Gradle local | — | blank 5 min 01 s (com 2,7 GB de SDK) → 3 min 16 s → 25 s (PR3) → 6 s (PR4) → 1 min 04 s (PR5, módulos novos) → 15 s (aceite) |
| Disco | — | imagem API 31: 4,2 GB (zip 1,42 GB) · SDK auto-instalado 2,7 GB (div. 9, mantido) · scratch `~/tmp/octavia-n0-scratch` 1,5 GB **apagado** (PR3) |
| Anexos | — | `docs/native/N0-anexos/` 47 arquivos, 2,1 MB; docs: pre-check 532 l., H15 53, H16 55, aceite 74 |

**Contabilidade de prod do bloco inteiro** (conta de audit; PR3 + PR4 + PR5 + aceite):

| Item | PR3 | PR4 | PR5 | Aceite | **Total** |
|---|---|---|---|---|---|
| logins ok (`signInWithPassword` no app) | 1 | 0 | 1 | 1 | **3** |
| oráculo (`signInWithPassword` em Node) | 1 | 0 | 0 | 0 | **1** |
| logins falhos (`invalid-email`, `invalid-credential`) | 2 | 0 | 0 | 0 | **2** |
| `setlist-read` | 2 | 3 | 1 | 1 | **7** |
| downloads do bucket | 0 | 0 | 2 | 1 | **3** |
| `HEAD` no bucket | 0 | 0 | 4 | 0 | **4** |
| 401 / 429 / `/api/auth/session` / escrita | 0 | 0 | 0 | 0 | **0** |

## 8. Lições do bloco

**(a) Premissas de prompt sobre a forma de um número e sobre a existência de código são hipóteses** (div. 2 e 4; depois 12, 16, 18, 20): o pre-check verifica a forma antes de usar o número — oito divergências vieram do prompt do revisor, nenhuma custou mais que uma medição.
**(b) Aparato ≠ hipótese**: o bundle não carregar em avião seria "H15 falsa" se não se tivesse medido antes que `am start -n` abre o launcher do dev client e que o Metro só chega por `adb reverse` (N0-H10). Regra: medir o aparato sem o app, e só então o app.
**(c) Commit local também é commit** (N0-D10): extras entram para veto antes do `git commit`, não antes do push.
**(d) Gradle instala SDK sozinho** (div. 9): toda build carrega `ANDROID_HOME` fixo e `sdkmanager --list_installed` antes/depois — cinco inventários idênticos depois do incidente.
**(e) `[medido]` também vale para o relógio**: "o token do PR3 tem horas" era falso (login 10:27:56); a ordem do protocolo foi trocada e a expiração real esperada, em vez de fingir o estado.
**(f) Device real: instalar com a tela desbloqueada** (div. 28) e por `adb install` direto; `--device` do Expo quer o nome, não o serial (PR2 e aceite).
**(g) Senha nunca passa por `input text`** (div. 24): três logins digitados pelo Marcel; qualquer automação de UI (Maestro) herda a restrição.
**(h) O `.gitignore` ancorado engana** (div. 20): o primeiro commit local do PR2 carregou `node_modules` de um pacote — emendado antes da PR; `apps/*/node_modules/` e `packages/*/node_modules/` ficam.

## 9. Herança para o Bloco B (mini-itens + achados do N0)

- Flake `tests/performance/performance-mode-responsiveness.test.tsx:310` — deixou a main vermelha em `ae298fe` e o `Test coverage` do PR3 (commit 1); dívida do web.
- 151 erros de `tsc -p tsconfig.test.json` (informativo, B8).
- Peer `react-dom 18.3.1 ✕ unmet peer react@^18.3.1: found 19.2.3` em `apps/native` (o `expo` pede `react-dom`; resolvido contra o do web) — decidir se o nativo declara o seu.
- `test.projects` no Vitest (isolamento real do core, sem a guarda de `window`) — reavaliar quando o core crescer.
- Comentário stale em `scripts/ux-audit/auth.ts:109` ("5 req / 15 min").
- Install Command filtrado no Vercel (`pnpm install --frozen-lockfile --filter octavia`) — **só se N0-H7 mostrar piora** (não medido).
- Os mini-itens da "Herança do Bloco C" (PLANO B7): `Cache-Control` das rotas, Zod de `content_data` por tipo, desempate por `id` no `GET /api/content`, `GET /api/debug/config`, STORAGE.md, dead code, contrato de auth do cliente (B7 a partir do PRD §3).

## 10. Herança para o N1 (entrada do pre-check da tela 1)

- **N0-D11**: a UI de prova é descartada; ficam `packages/core` (`normalizeForSearch`, `createAuthFetch`), `scripts/native-env.sh`, `native.yml`, `octavia_tab`, os protocolos.
- **Design da tela 1 congelado como insumo** do pre-check do N1 (corre em paralelo aos mini-itens do B).
- Arquivos garantidos offline (T1-R14/R15) em `Paths.document` (não purgável) × `Paths.cache` para o resto — N0-H16 §4.
- Travar landscape no tablet (T1-R27; E8 tirou do `app.json` do N0); `SafeAreaView`/insets (barra de navegação e barra de status — PR5 e aceite).
- Normalizar os dois erros de rede na camada única (T1-R37): `fetch failed: java.net.UnknownHostException …` e `Call to function 'FileSystem.downloadFileAsync' has been rejected. → Caused by: …`.
- N0-H11 (`cache: 'no-store'`) e T1-R12: medir no N1.
- AVD: migrar `octavia_tab` para `system-images;android-32;google_apis;arm64-v8a` (já instalada) — o Tab S6 é API 32.
- Senha só manual → impacto na camada 3 (Maestro): fluxo de login fora da automação ou sessão pré-semeada.
- Protocolo de device: dev client + deep link `localhost` + `adb reverse` + probe `nc`; instalação em device real por `adb install` direto.
- H16 da conta principal continua **não medido** — insumo do teto LRU no N1.

## 11. Estado dos devices

- **Emulador `octavia_tab`** (API 31): app instalado, **com sessão** da conta de audit (login do PR5), cache de arquivos vazio; avião desligado.
- **Tab S6** (API 32): app `rocks.octavia.app` instalado, **sem sessão** (`pm clear` do aceite), cache vazio; avião desligado, `adb reverse` removido; nenhuma configuração alterada.
- Repo: `docs/native/N0-PRECHECK.md` **não editado** (histórico); as correções do protocolo estão em div. 21 e 25 (`N0-H15.md`, `N0-ACEITE-TAB-S6.md`).
