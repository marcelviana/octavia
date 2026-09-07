# N0-PRECHECK.md — Bloco N0 (stack do nativo): pre-check

> **Data**: medições em 2026-09-06 (Fases A e B), aval e decisões em 2026-09-07. HEAD medido: `ae298fe` (merge #262, errata do C). Sessão dedicada ao bloco; revisor colou os prompts, Marcel decidiu, este documento é o N0-PR0 (docs-only, PR — decisão N0-D6).
> **Regras de forma**: `[medido]` = comando exato + saída literal (as longas em [`N0-PRECHECK-anexos/`](N0-PRECHECK-anexos/), com `wc -l` + `sha256`); `[hipótese]` rotulada para tudo o mais, inclusive versões "conhecidas" e números derivados. Premissa falsa é declarada, nunca acomodada (§0). Zero commit até o aval, zero escrita em prod, zero ação em console (Firebase, Google Cloud, Vercel, EAS), zero instalação global sem "ok" — com **uma exceção acidental registrada** (divergência 9).
> **O que o N0 é** (N0-D0, Marcel, 2026-09-06): scaffold do monorepo (`apps/native` + `packages/core` adicionados; o Next fica na raiz), escolha de runtime e bibliotecas, primeira build com login email/senha + `GET /api/setlists` com bearer, prova de H15/H16 (PRD §9) e due diligence de PDF. Termina com resposta binária para H15 e o aparato de validação provado. A tela 1 é o bloco N1. Device de desenvolvimento = emulador Android (AVD tablet); o Galaxy Tab S6 entra uma vez, no aceite final. Só H15 bloqueia o N0.
> **Fontes lidas antes de medir**: [`PRD-TELA-1.md`](PRD-TELA-1.md) (íntegra), [`docs/ux/C-ENCERRAMENTO.md`](../ux/C-ENCERRAMENTO.md), [`docs/ux/PLANO-TRANSICAO.md`](../ux/PLANO-TRANSICAO.md) ("Herança do Bloco C para o Bloco B", C4, "Stack nativa", "Sequência"), [`docs/ux/C-PRECHECK.md`](../ux/C-PRECHECK.md) §1.

---

## 0. Divergências entre o que o prompt afirmava/assumia e o que foi medido

As divergências **2 e 4 eram premissas falsas do próprio prompt do revisor** (forma de um número e existência de um módulo) — registradas como tal, e a lição fica em §D.

1. **`pnpm type-check` não existe** — `grep -n "type-check" package.json` → `exit=1`. Substituído por `pnpm exec tsc --noEmit` (app) e `pnpm exec tsc -p tsconfig.test.json --noEmit` (testes; é o comando do CI, `continue-on-error: true`).
2. **Baseline "649 testes / 86 arquivos" tinha a forma errada** (premissa do prompt). Medido: **78 arquivos / 735 testes = 649 passed + 86 skipped**. O "86" é a contagem de testes *skipped*, não de arquivos. Baseline adotado pelo revisor: **649 passed / 86 skipped (735) · 74 files passed / 4 skipped (78)**. A 1ª execução teve 1 falha de timing (A7) — flake pré-existente, dívida do web (E9).
3. **`playwright.config.*` não existe**; o config é `playwright.ux-audit.config.ts` (`ls` → `no matches found: playwright.config.*`).
4. **"Módulo de normalização de texto do B6" não existe como módulo de busca** (premissa do prompt). `grep -rln 'normalize("NFD")\|NFD' lib/ app/ hooks/` → só `app/api/storage/upload/route.ts` (e o teste de paridade): é a sanitização de **nome de arquivo** do upload (B6-D5′, linhas 59-62), replicada em `components/add-content/upload-to-storage.ts:19`. O web não normaliza busca (C-D3 fala em "mesma classe da D5′"). A normalização de busca de P-N0-1 nasce em `packages/core` sem antecedente; só a receita de 2 linhas (NFD → remover U+0300–U+036F) é reaproveitável.
5. **`ANDROID_HOME`/`ANDROID_SDK_ROOT` não definidos; `adb`/`emulator` fora do PATH** (`echo` → vazios; `which adb emulator` → `not found`). A doc do Expo exige ambos (B3). Todos os comandos usaram o caminho padrão `~/Library/Android/sdk` inline. Persistir é mutação de config local → N0-D8.
6. **pnpm global é 11.16.0**; no repo `pnpm -v` dá `10.28.0` pelo pin `packageManager` (Corepack). O `probe` do scratch instalou com **11.16.0** — por isso o B4 é "provado standalone" (E1, hipótese N0-H1).
7. **Nenhuma imagem de sistema API 31 instalada e nenhum AVD de tablet na API alvo** (P-N0-5). AVD de tablet existente: `Medium_Tablet` = API 36 / Android 16, imagem `google_apis_playstore`. Usado para B2 e B4 (sem download). `octavia_tab` API 31 é decisão N0-D5 (download só no N0-PR2).
8. **Dispositivo fantasma `emulator-5562 offline`** no `adb devices` antes de qualquer emulador subir. `lsof -nP -iTCP:5562 -iTCP:5563 -sTCP:LISTEN` → `NTKDaemon 39943 … TCP 127.0.0.1:5563 (LISTEN)` (daemon da Native Instruments na porta da varredura do adb). Derrubou o `expo run:android` (`adb -s emulator-5562 emu avd name exited with non-zero code: 1` em `getDevicesAsync`). Contorno provado: `adb kill-server; ADB_LOCAL_TRANSPORT_MAX_PORT=5555 adb start-server` → só `emulator-5554 device`. Entra no `scripts/native-env.sh` (N0-D8) e no protocolo de H15.
9. **Incidente da regra 8**: `expo run:android` (Gradle/AGP) **baixou e instalou sem perguntar** três pacotes do SDK: `ndk;27.1.12297006` (**2,4 GB**), `build-tools;36.0.0` (188 MB), `platforms;android-36` (134 MB) — anexo `N0-B4-run-android.log.txt` linhas 89-110; inventário antes/depois nos anexos `N0-B1-sdkmanager-*.txt`. Nada removido. Decisão N0-D7: manter + regra nova (§D).
10. **Template `blank-typescript` fixa RN 0.86.3**, não `npm view react-native version` = 0.87.1 (SDK 57 ↔ RN 0.86 pela tabela do Expo). Também `react 19.2.3`, `typescript ~6.0.3`.
11. **CI roda Node 20** (`node-version: 20` em `ci.yml`); `.nvmrc` = 22; Expo SDK 57 exige Node ≥ 22.13 (B3). O job nativo do CI não herda o setup atual (C4-2).
12. **`pnpm-workspace.yaml` já existe** na raiz (`packages: [ . ]` + listas de built deps) — a raiz **já é** workspace root. C1 passa de "criar" para "editar".
13. **H16 na conta de audit**: as 5 `file_url` apontam para **4 objetos distintos** (`…1786295884124-ux-audit-fase-d-offline.pdf` repetido em dois content). Instrumento = 4 HEADs.
14. `timeout` (coreutils) não existe no macOS; usei loops de polling. Sem efeito no resultado.
15. **O último run do `ci.yml` na main (`ae298fe`) está vermelho** — `gh run list` → `conclusion: failure`, passo `Test` (`--log-failed`: `FAIL tests/performance/performance-mode-responsiveness.test.tsx … AssertionError: expected 3.7640121999999794 to be less than 2.8484466`, `Test Files 1 failed | 73 passed | 4 skipped (78)`). É o mesmo flake da divergência 2, já ocorrido no CI (E7/E9). O run da PR #262 em `73a8490` passou (3 min 13 s).
16. **`gh run list --json durationMs` não existe** (`Unknown JSON field: "durationMs"`; campos disponíveis incluem `startedAt`, `updatedAt`). Duração medida por `startedAt`→`updatedAt` e pelos `steps` de `gh run view --json jobs` (E7).

Sem divergência `[medido]`: `origin/main` = HEAD = `ae298fef514bbd3717b4f5b52d794f29eed2e2b3`, working tree limpa, `gh pr list --state open` vazio; macOS 26.6.2; Xcode 26.6 instalado; `.env.uxaudit` com `USER_AUDIT`/`PASSWORD_AUDIT`; P-N0-2 confirmada por doc e tarball (B3); P-N0-5 confirmada pelo Marcel (Android 12, API 31, One UI 4.1.1).

---

## 1. Decisões N0-D1…N0-D9 — fechadas (Marcel, 2026-09-07)

| Decisão | Fechada como | Fundamento medido |
|---|---|---|
| **N0-D1** lib de Firebase | **(a)** `firebase` JS SDK + `@react-native-async-storage/async-storage` | B3: `@firebase/auth@1.13.5` tem export condition `react-native` puro-JS, persistência opt-in via `getReactNativePersistence`; zero código nativo, zero console (H11 fechada); C2 |
| **N0-D2** lib de PDF | **(a)** `react-native-pdf` 7.0.5 + `react-native-blob-util` 0.24.10 + `@config-plugins/react-native-pdf` e `…/react-native-blob-util` 14.0.2 | B3 (tarball, README, config-plugins); compatibilidade do plugin com SDK 57 `[hipótese]` — fecha no N0-PR5 |
| **N0-D3** versões | **fixar o medido**: Expo `~57.0.20`, RN `0.86.3`, React `19.2.3`, TS `~6.0.3` no nativo; Node 22 (`.nvmrc`); **JDK 17** (Corretto 17.0.15); Gradle 9.3.1 (wrapper do template); `compileSdk 36 / targetSdk 36 / minSdk 24` | B1, B3, B4 (`aapt dump badging`) |
| **N0-D4** hoisting | **(a)** linker isolado (default), `.npmrc` intocado | B4: install limpo sem warning de peer; workspace terá React 18 × 19.2.3, TS ^5 × 6.0.3, firebase ^11 × 12.18 (E3) |
| **N0-D5** AVD | **(a)** `octavia_tab` em `system-images;android-31;google_apis;arm64-v8a`, perfil `pixel_tablet` — **download só no N0-PR2** | B2; Tab S6 = Android 12 / API 31 / One UI 4.1.1 (Marcel) |
| **N0-D6** este pre-check | **(a)** PR `n0/precheck` (texto novo) | — |
| **N0-D7** incidente div. 9 | **(a)** manter `ndk;27.1`, `build-tools;36`, `platforms;android-36` + regra de inventário (§D) | B4 |
| **N0-D8** ambiente | **(b)** `scripts/native-env.sh` versionado (`ANDROID_HOME`, PATH `emulator`/`platform-tools`, `JAVA_HOME` 17, `ADB_LOCAL_TRANSPORT_MAX_PORT=5555`), carregado por comando (`source`) — nada no shell do Marcel | div. 5, 8; B1 |
| **N0-D9** package name Android | **`rocks.octavia.app`** (`android.package`; fixa `applicationId`, B10 futuro e registro Firebase futuro) | — |

## 2. Hipóteses abertas do N0

| # | Hipótese | Fecha em |
|---|---|---|
| **N0-H1** | Expo 57 + Metro resolvem um app em `apps/native` **dentro** de workspace pnpm 10.28.0 com linker isolado (o `probe` rodou standalone, pnpm 11.16.0, sem monorepo — E1) | N0-PR2 |
| **N0-H2** | O Metro do Expo 57 resolve a export condition `react-native` de `@firebase/auth` 1.13.5 **sem** `unstable_enablePackageExports` explícito nem `.cjs` em `sourceExts`. Doc consultada (E2): `docs.expo.dev/versions/latest/config/metro/` — "For native platforms, the condition `react-native` is added" e resolução por `package.json:exports` "from SDK 53 on all platforms"; `reactnative.dev/blog/2025/04/08/react-native-0.79` — exports "enabled by default for all the projects on React Native 0.79"; `metrobundler.dev/docs/package-exports/` — "enabled by default in Metro since 0.82". Tudo aponta para "sim", mas ninguém mediu com `@firebase/auth` | N0-PR3 |
| N0-H3 | `getIdToken()` do JS SDK devolve o token cacheado sem rede enquanto `exp` não passou; expirado + offline → rejeita, mantendo `currentUser` (é o H15-b; não exigido pela tela 1) | N0-PR4 |
| N0-H4 | Maestro: nada instalado; doc diz API 29–34 e "35/36 arriving Q2 2026" (texto stale em 2026-09) | fora do N0 (camada 3) |
| N0-H5 | Tamanho da imagem `android-31;google_apis;arm64-v8a` ~1,2–1,5 GB | N0-PR2 (`sdkmanager --list` antes do download) |
| N0-H6 | Custo do job de CI do APK: 8–12 min sem cache, 4–6 min com cache do Gradle | N0-PR2 |
| N0-H7 | Duração do último deploy do Vercel em `ae298fe` — passo do Marcel no painel (E7) | N0-PR1 |
| H15 / H16 | Do PRD §9 — permanecem; protocolo em C2/C3 | N0-PR4 / N0-PR5 |

---

## A. Fase A — Estado do repo `[medido]`

### A1. Git
```
$ git fetch --all --prune            (35 branches remotas podadas; nada novo em origin/main)
$ git status --short --branch
## main...origin/main
$ git log --oneline -5 origin/main
ae298fe Merge pull request #262 from marcelviana/c-pr1-errata
73a8490 docs(C): PRD — pré-requisito de console fechado (H11); restrição da chave = B10, após os apps existirem
8abacb7 docs(C): errata final — H11/H14/H17/H18 fechadas pelo Marcel (63 content / 2 setlists → 1 página; só email/senha; login Google do web → Bloco D); lição (g)
2233f46 Merge pull request #261 from marcelviana/c-pr1-encerramento
de8130e docs(C): encerramento — errata de contagem (seis trechos, cinco pontos da revisão 1 → N1–N6)
$ gh pr list --state open            (vazio)
$ git rev-parse HEAD origin/main
ae298fef514bbd3717b4f5b52d794f29eed2e2b3
ae298fef514bbd3717b4f5b52d794f29eed2e2b3
```

### A2. Raiz
`package.json` (colado integralmente na sessão): `"name": "octavia"`, `"packageManager": "pnpm@10.28.0"`, **sem `engines`**. Scripts pedidos e todos os `test*` (E5):
```
$ grep -n '"test' package.json
12:    "test": "pnpm exec vitest run",
13:    "test:watch": "vitest",
14:    "test:coverage": "vitest run --coverage",
15:    "test:ci": "vitest run --coverage --reporter=verbose",
17:    "test:ui": "vitest --ui",
18:    "test:unit": "pnpm run test",
```
```
"build":    "pnpm exec next build && node scripts/build-sw.js"
"lint":     "pnpm exec next lint"
"db:types": "supabase gen types typescript --project-id mlxjmpbdchmwplcfislt > types/database.types.ts"
"db:dump":  "supabase db dump -s public -f supabase/schema.dump.sql"
(type-check: inexistente — divergência 1)
```
Deps relevantes para o core: `zod ^3.24.1`, `firebase ^11.9.1`, `react ^18`, `next 15.2.8`, `vitest 4.0.16`, `typescript ^5`.
```
$ ls pnpm-workspace.yaml .npmrc .nvmrc     → os três existem e são versionados (git ls-files)
$ cat pnpm-workspace.yaml
packages:
  - .
ignoredBuiltDependencies:
  - '@firebase/util'
  - protobufjs
onlyBuiltDependencies:
  - canvas
  - esbuild
  - msw
  - sharp
  - unrs-resolver
$ xxd .npmrc
00000000: 0a                                       .          ← 1 byte, vazio
$ cat .nvmrc → 22       $ pnpm -v → 10.28.0       $ node -v → v22.23.1
```
`ls -la` da raiz (72 entradas) colado na sessão; além dos acima: `.vercel/` (ignorado por `.gitignore:27`; `project.json` com chaves `orgId, projectId, projectName`), `.env.local`/`.env.test`/`.env.uxaudit` (ignorados; só `.env.example` versionado), `vitest.config.mts`, `playwright.ux-audit.config.ts`, `tsconfig.json`, `tsconfig.test.json`, `next.config.mjs`, `knip.json`, `.dependency-cruiser.cjs`, `codecov.yml`, `.eslintrc.json` (`{"extends":"next"}`), `components.json`, `src/test-setup.ts`, `tests/`, `__tests__/`.

### A3. O que assume que a raiz é o app Next
`vercel.json`: não existe. `.github/workflows/` = só `ci.yml` (colado integralmente na sessão): `checkout@v4` → `pnpm/action-setup@v4` (sem versão → lê `packageManager`) → `setup-node@v4` **node 20**, `cache: pnpm` → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm exec tsc -p tsconfig.test.json --noEmit` (`continue-on-error: true`) → `pnpm test:unit` → `pnpm test:ci` → codecov → `upload-artifact coverage` → `pnpm build`. `grep -rn "working-directory\|rootDirectory\|cwd" .github/ vercel.json` → `exit=2` (zero ocorrências).

`vitest.config.mts` verbatim (E4):
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    css: true,
    // Standard settings for fast execution
    testTimeout: 10000,
    hookTimeout: 5000,
    // Exclude integration tests and E2E tests from unit test runs
    exclude: [
      'node_modules/**',
      'tests/ux-audit/**/*',
      '**/*.e2e.{ts,tsx}',
      '**/e2e/**/*',
      '**/*integration*.test.{ts,tsx}',
      '**/integration/**/*.test.{ts,tsx}'
    ],
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },
    coverage: {
      enabled: false, // Disabled by default - use test:coverage script to enable
      provider: 'istanbul', // Using istanbul instead of v8 for better Next.js compatibility
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/test-setup-integration.ts',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test-utils/**',
        '**/test-helpers/**',
        '**/mocks/**',
        '**/stubs/**',
        '**/fixtures/**',
        'scripts/**',
        'public/**',
        '.next/**',
        'dist/**',
        // Exclude E2E tests from coverage
        '**/*.e2e.{ts,tsx}',
        '**/e2e/**/*',
        // Exclude Next.js specific files that cause V8 coverage issues
        'app/**/layout.{ts,tsx}',
        'app/**/not-found.{ts,tsx}',
        'app/**/error.{ts,tsx}',
        'app/**/loading.{ts,tsx}',
        'app/**/template.{ts,tsx}',
        'app/**/default.{ts,tsx}',
        'middleware.{ts,tsx}',
        'instrumentation.{ts,tsx}',
        // Exclude server-only and edge runtime files
        '**/route.{ts,tsx}',
        '**/*.server.{ts,tsx}',
        '**/*.edge.{ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
})
```
Leitura do que está colado: **não há `test.include`** — vale o default do Vitest (`**/*.{test,spec}.?(c|m)[jt]s?(x)`), com `exclude` explícito de `node_modules/**`, `tests/ux-audit/**/*`, e2e e `*integration*`. `environment: 'jsdom'` global e `setupFiles: ./src/test-setup.ts` para **todo** arquivo coletado; alias `@` → raiz. Consequências para o workspace: (i) `packages/core/**/*.test.ts` **é coletado sem mudar o `include`** (default) — mas herda jsdom + setup do web, daí a regra de `// @vitest-environment node` (E3); (ii) `apps/native/**/*.test.*` também seria coletado (com jsdom e `@` apontando para a raiz) → o PR1 acrescenta `'apps/**'` ao `exclude`. **Nota**: o default do Vitest, e não um `include` explícito, é o que coleta `packages/core` — o N0-PR1 acrescenta um `include` explícito se a coleta implícita falhar.

`tsconfig.json` (colado na sessão): `"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "types/**/*.d.ts"]`, `"exclude": ["node_modules","tests","__tests__","**/__tests__/**","**/*.test.ts","**/*.test.tsx","**/__mocks__/**"]`, `"paths": {"@/*": ["./*"]}`, `lib: ["dom","dom.iterable","esnext"]`, `jsx: preserve`, `strict`, `noUncheckedIndexedAccess`. `tsconfig.test.json` estende e reinclui tudo (`exclude: ["node_modules"]`). `next.config.mjs` (colado): `serverExternalPackages: ['firebase-admin']`, aliases webpack (`@/lib/firebase-admin: false`, test-utils, vitest), `splitChunks` com `test:` regex por path (`components[\\/]performance-mode`, `hooks[\\/]use-(performance|content|wake)`, `lib[\\/]offline-cache`…), regra do `pdf.worker`. `playwright.ux-audit.config.ts` (colado): `testDir: './tests/ux-audit'`, `storageState 'tests/ux-audit/.auth/user.json'`, `baseURL octavia.rocks`, projetos `setup/smoke/fase-d/set14-gate/perf02-gate/harvest-*`.

| Arquivo | Trecho decisivo | Classe |
|---|---|---|
| `ci.yml` | tudo relativo à raiz, sem `working-directory` | não quebra se a raiz virar workspace root sem mover o Next (o `pnpm install` passa a instalar o workspace inteiro: +458 pacotes/~600 MB, custo de tempo — E7 mede); **quebra só se o Next for movido** |
| `next.config.mjs` | aliases e `splitChunks` por regex de path | **indiferente** para (a); quebra só se movido (`outputFileTracingRoot` `[hipótese]`) |
| `tsconfig.json` | `include: **/*.ts(x)`, `paths @/* → ./*`, lib `dom` | **quebra se a raiz virar workspace root sem mover o Next**: varre `apps/native/**` e `packages/core/**` no `tsc --noEmit` e no type-check do `next build` → exige `exclude: ["apps/**","packages/**"]` |
| `tsconfig.test.json` | herda o `include`, `exclude: [node_modules]` | idem — mesma emenda |
| `vitest.config.mts` | sem `include`; `exclude` fixo; jsdom global; alias `@` → raiz | **quebra na coleta** se a raiz virar workspace root: coletaria `apps/native/**/*.test.*` → `exclude: ['apps/**']`; `packages/core` é coletado pelo default (desejado, C4-1) |
| `playwright.ux-audit.config.ts` | `testDir ./tests/ux-audit` | indiferente para (a); quebra só se movido |
| `knip.json`, `.dependency-cruiser.cjs`, `codecov.yml` | globs `app/**`, `lib/**`, …; `tsConfig: tsconfig.json` | indiferentes para (a) (não veem `apps/`/`packages/`); quebram só se movido |
| `.gitignore` | `/node_modules`, `/.next/`, `.env*` | (a) exige `apps/native/android`, `apps/native/ios`, `.expo/` |
| `.eslintrc.json` / `next lint` | só dirs do Next | indiferente |
| **Painel do Vercel** (Root Directory, Install/Build Command) | fora do repo | `[hipótese]` passo do Marcel — C1 |

### A4. Firebase no cliente web
```
$ grep -rln "initializeApp\|getAuth\|signInWithEmailAndPassword" lib/ contexts/ app/ hooks/ | sort
app/api/content/[id]/__tests__/route.test.ts · app/api/content/__tests__/route.test.ts · app/api/profile/__tests__/route.test.ts
app/api/storage/__tests__/{delete,upload-paridade,upload}.test.ts · contexts/__tests__/firebase-auth-context.test.tsx
contexts/firebase-auth-context.tsx · lib/__tests__/{api-test-helpers,firebase-admin.test}.ts · lib/api-validation-middleware.ts
lib/content-service.ts · lib/firebase-admin.ts · lib/firebase.ts · lib/secure-auth-utils.ts · lib/setlist-service.ts · lib/user-rate-limit.ts
```
Inicialização do cliente = `lib/firebase.ts` (colado integralmente na sessão): `firebaseConfig` a partir de `process.env.NEXT_PUBLIC_FIREBASE_{API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID}` (`:7-12`); `isFirebaseConfigured` exige as seis; `initializeApp` + `getAuth(app)` + `getFirestore(app)`; emuladores só com `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`. Consumidor: `contexts/firebase-auth-context.tsx` (484 linhas) — `signInWithEmailAndPassword` (`:264`), `onAuthStateChanged` (`:123`), `getIdToken(user, true)` (`:99, :156, :204, :220`), `setSessionCookie` (`:20`, cookie — o nativo não usa, C-D1), `signInWithPopup` Google (`:288`, quebrado no web, H18).
```
$ grep -rhoE "NEXT_PUBLIC_FIREBASE_[A-Z_]+" lib/ contexts/ app/ hooks/ components/ | sort | uniq -c
   1 NEXT_PUBLIC_FIREBASE_API_KEY · 1 …APP_ID · 2 …AUTH_DOMAIN · 1 …MESSAGING_SENDER_ID · 1 …PROJECT_ID · 1 …STORAGE_BUCKET
$ grep -o "^[A-Z_]*=" .env.example → declara as seis NEXT_PUBLIC_FIREBASE_* (+ SUPABASE_*, FIREBASE_{PROJECT_ID,CLIENT_EMAIL,PRIVATE_KEY}, ALLOWED_PROXY_HOSTS, FIREBASE_TEST_USER_*)
```
**O nativo precisa dos mesmos valores** de `apiKey`, `authDomain`, `projectId`, `appId` (`storageBucket`/`messagingSenderId` opcionais para Auth `[hipótese]`); são públicos por construção e já vivem em `.env.local` (nomes confirmados, valores não lidos). Ficam em `apps/native/.env` (gitignored por `.env*`) lidos por `app.config.ts` `[proposta, N0-PR3]`.

### A5. Conta de audit e oráculo Node
```
$ ls -la .env.uxaudit → -rw-r--r-- 74 B (2026-08-08)      $ grep -o "^[A-Z_]*=" .env.uxaudit → USER_AUDIT= / PASSWORD_AUDIT=
$ wc -l scripts/ux-audit/auth.ts → 193
```
`scripts/ux-audit/auth.ts` colado integralmente na sessão. `signIn()` faz `POST identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=NEXT_PUBLIC_FIREBASE_API_KEY` e guarda `{ idToken, refreshToken, localId }` (`getFirebaseCredentials()`), **mas em seguida sempre faz `POST /api/auth/session`** (1 na família `session`, com loop de 60 s em 429). Como oráculo do N0 (comparar `sub`/`aud` do token do app com o do Node, sem colar tokens) serve **só com corte**: `getFirebaseCredentials()` custa 1 `session` — proibido ("nada de `/api/auth/session` nunca", C-D1). Proposta (N0-PR3): script novo `scripts/native/token-oracle.ts` (~30 linhas) reaproveitando só o `signInWithPassword` e decodificando o payload do JWT (base64, sem verificar) para imprimir `sub`, `aud`, `iat`, `exp` — 0 chamadas à API. O comentário stale `:109` já é item do B.

### A6. Candidatos a `packages/core`

| Arquivo | Imports (grep literal) | Classe |
|---|---|---|
| `types/content.ts` (142 l.) | `import { Mic, Grid, AlignLeft, FileMusic, type LucideIcon } from "lucide-react"` | **portável com corte**: `ContentType`, `CONTENT_TYPE_DISPLAY_NAMES`, `CONTENT_TYPE_KEYS`, `CONTENT_TYPE_IDS`, `normalizeContentType` são TS puro; `CONTENT_TYPE_ICONS` (`:40`) e `CONTENT_TYPE_COLORS` (classes Tailwind, `:48`) são UI web e ficam |
| `types/setlist.ts` (45 l.) | `import type { Json } from "@/types/database.types"` | **portável como está** (type-only; `event_date:40` é dead code já classificado no B); o alias `@/` vira import relativo |
| `lib/api-schemas.ts` (365 l.) | `zod`; `type { Json }`; `ContentType` de `@/types/content` | **portável com corte**: TS + zod puros; arrasta `types/content.ts` (→ o corte acima); contém schemas de escrita que a tela 1 não usa; `commonSchemas.contentType:34` é o enum falso (dead code do B) |
| `hooks/use-songs-transformation.ts` (82 l.) | `react` (`useMemo`); `type { SongData, SetlistWithSongs, Content } from '@/types/performance'` | **portável com corte** na forma (transformação pura; `useMemo` fica no consumidor) — **mas não portar**: lê `file`/`sections` (inexistentes no banco) e ignora `tablature` (PRD §4); reescrever pelo contrato C-D7 |
| normalização (div. 4) | `app/api/storage/upload/route.ts:59-62` — `.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')` | **não portável** (rota); a receita de 2 linhas é reescrita no core |
| `types/database.types.ts` (473 l., gerado por `db:types`) | `grep -n "^import"` → `exit=1` | **portável como está** — `head -30` colado: `export type Json = string \| number \| boolean \| null \| { [key: string]: Json \| undefined } \| Json[]`; `export type Database = { __InternalSupabase: { PostgrestVersion: "14.5" } public: { Tables: { annotations: { Row: … } … } } }` — TS puro |
| `types/performance.ts` | `import type { Database } from "@/types/database.types"` | portável como está (type-only) |

### A7. Baseline da suíte em `ae298fe`
```
$ pnpm lint
✔ No ESLint warnings or errors
$ pnpm exec tsc --noEmit                    → (sem saída) exit 0
$ pnpm exec tsc -p tsconfig.test.json --noEmit → 226 linhas, 151 "error TS"   [anexo N0-A7-tsc-tests.txt]
  top: 44 tests/components/content-viewer.refactoring.test.tsx · 23 tests/ux-audit/fase-d/i-add.spec.ts · 20 tests/security/auth-penetration-testing.test.ts · 13 tests/security/api-validation.security.test.ts
$ pnpm test  (1ª execução)
 Test Files  1 failed | 73 passed | 4 skipped (78)
      Tests  1 failed | 648 passed | 86 skipped (735)
 FAIL tests/performance/performance-mode-responsiveness.test.tsx > … > should handle rapid navigation without performance degradation
 AssertionError: expected 2.6491041000000224 to be less than 2.5147248000002493   (:310  expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5))
$ pnpm test  (2ª execução)
 Test Files  74 passed | 4 skipped (78)
      Tests  649 passed | 86 skipped (735)
   Duration  15.98s
```
**Baseline adotado: 649 passed / 86 skipped (735) · 74 files passed / 4 skipped (78).** Os **151 erros TS dos testes** e o **flake de `performance-mode-responsiveness.test.tsx:310`** (que já deixou a main vermelha em `ae298fe`, divergência 15) são **dívida do web, herança para o Bloco B** (B8 do plano), fora do N0 (E9). Playwright e `build` não rodados nesta fase.

---

## B. Fase B — Toolchain e emulador `[medido]`

### B1. Máquina
```
$ sw_vers → ProductName: macOS · ProductVersion: 26.6.2 · BuildVersion: 25G83
$ node -v → v22.23.1
$ nvm ls → v10.24.1, v22.22.3, -> v22.23.1, v23.5.0, v24.16.0, system; default -> 22 (-> v22.23.1)
$ pnpm -v → 10.28.0 (dentro do repo) · 11.16.0 (global: ~/.nvm/versions/node/v22.23.1/bin/pnpm)
$ java -version → java version "21.0.1" 2023-10-17 LTS (Oracle)          $ echo $JAVA_HOME → (vazio)
$ /usr/libexec/java_home -V
    21.0.1 (arm64) "Oracle Corporation" /Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home
    20.0.2 (arm64) "Amazon.com Inc." ~/Library/Java/JavaVirtualMachines/corretto-20.0.2.1/Contents/Home
    17.0.15 (arm64) "Amazon.com Inc." /Library/Java/JavaVirtualMachines/amazon-corretto-17.jdk/Contents/Home
    17.0.9 (arm64) "Amazon.com Inc." ~/Library/Java/JavaVirtualMachines/corretto-17.0.9/Contents/Home
$ echo $ANDROID_HOME $ANDROID_SDK_ROOT → (vazios)        $ uname -m → arm64
$ ls ~/Library/Android/sdk → build-tools cmake cmdline-tools emulator fonts licenses ndk patcher platform-tools platforms skins sources system-images tools
$ sdkmanager --list_installed (ANTES) → anexo N0-B1-sdkmanager-antes.txt: build-tools 30.0.3/32.0.0/32.1.0-rc1/33.0.1/34.0.0/35.0.0; cmdline-tools;latest 19.0;
  emulator 35.5.10; ndk;26.3.11579264; platform-tools 35.0.2; platforms android-31/32/34/35;
  system-images;android-32;google_apis;arm64-v8a · system-images;android-36;google_apis_playstore;arm64-v8a
$ adb version → Android Debug Bridge version 1.0.41 · Version 35.0.2-12147458
$ emulator -version | head -3 → Android emulator version 35.5.10.0 (build_id 13402964)
$ xcodebuild -version → Xcode 26.6 · Build version 17F113      $ xcrun simctl list runtimes → iOS 26.5 (26.5 - 23F77)
```
Faltava para a dev build Android: `ANDROID_HOME` (div. 5) e — descoberto no B4 — `platforms;android-36`, `build-tools;36.0.0`, `ndk;27.1.12297006` (o Gradle instalou sozinho, div. 9). JDK 17 é o requisito da doc do Expo (B3), presente (Corretto 17.0.15) mas não default → `JAVA_HOME` por comando (N0-D8). iOS: capacidade futura registrada (Xcode 26.6 + runtime iOS 26.5), fora do N0 (P-N0-4).

### B2. Emulador
```
$ emulator -list-avds → Medium_Tablet · Pixel_3a_API_32_arm64-v8a
Medium_Tablet.avd/config.ini: hw.device.name = medium_tablet · hw.lcd 2560x1600 @ 320 · image.sysdir.1 = system-images/android-36/google_apis_playstore/arm64-v8a/ · PlayStore.enabled = true
$ avdmanager list device | grep -i -B1 -A3 tablet → id 13 "medium_tablet" (Generic) · id 51 "pixel_tablet" (Google) · id 77 "7in WSVGA (Tablet)" · id 81 "10.1in WXGA (Tablet)"; também id 14 "Nexus 10", id 22 "Nexus 9"
```
Comando de criação (N0-D5, executar **no N0-PR2**, após colar `sdkmanager --list` com o tamanho e receber o "ok"):
```bash
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-31;google_apis;arm64-v8a"
~/Library/Android/sdk/cmdline-tools/latest/bin/avdmanager create avd -n octavia_tab -k "system-images;android-31;google_apis;arm64-v8a" -d "pixel_tablet"
```
Prova do instrumento de H15 no AVD existente (`emulator -avd Medium_Tablet -no-snapshot-load`; log no anexo `N0-B2-emulator.log.txt`):
```
$ adb wait-for-device; …; adb shell getprop sys.boot_completed → 1
$ adb -s emulator-5554 shell getprop ro.product.model → sdk_gphone64_arm64
$ … ro.build.version.release → 16      … ro.build.version.sdk → 36      … ro.product.cpu.abi → arm64-v8a
$ adb shell wm size → Physical size: 2560x1600        $ adb shell wm density → Physical density: 320
$ adb -s emulator-5554 shell settings get global airplane_mode_on → 0
$ adb -s emulator-5554 shell cmd connectivity airplane-mode enable → exit=0
$ adb -s emulator-5554 shell settings get global airplane_mode_on → 1
$ adb -s emulator-5554 shell ping -c 1 -W 3 8.8.8.8 → connect: Network is unreachable   exit=2
$ adb -s emulator-5554 shell cmd connectivity airplane-mode disable → exit=0
$ adb -s emulator-5554 shell settings get global airplane_mode_on → 0
$ adb -s emulator-5554 shell ping -c 1 -W 3 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=255 time=15.7 ms
1 packets transmitted, 1 received, 0% packet loss
--- complemento ---
$ … svc wifi disable; svc data disable → ping → connect: Network is unreachable   exit=2
$ … svc wifi enable; svc data enable  → ping → 64 bytes from 8.8.8.8 … time=15.3 ms
$ … settings get global airplane_mode_on → 0        $ … dumpsys connectivity → Active default network: 105 · WiFi active networks: {105}
```
**`cmd connectivity airplane-mode enable` existe na API 36 e corta a rede virtual** (ping falha); `svc wifi/data disable` é a alternativa provada. Rede deixada ligada e provada (último ping antes do `emu kill`: 22,8 ms). Pré-requisito de todos os comandos: `-s emulator-5554` ou servidor adb com `ADB_LOCAL_TRANSPORT_MAX_PORT=5555` (div. 8). Na API 31 do `octavia_tab` os mesmos comandos são `[hipótese]` até o N0-PR2 (o `cmd connectivity` existe desde a API 30 `[hipótese]`).

### B3. Versões do ecossistema (`npm view`, nada instalado)
```
expo 57.0.20 · dist-tags: latest 57.0.20, next 57.0.20, sdk-56 56.0.21, sdk-55 55.0.31, sdk-54 54.0.37, sdk-53 53.0.27, sdk-52 52.0.49, canary 58.0.0-canary-20260902-26df09e
  (57.0.20 publicado 2026-09-04T07:46Z)
react-native 0.87.1 · firebase 12.18.0 (dependencies["@firebase/auth"] = 1.13.5) · @react-native-firebase/app 26.4.0 · @react-native-firebase/auth 26.4.0 (2026-09-05)
react-native-pdf 7.0.5 (peer: react *, react-native *, react-native-blob-util >=0.13.7) · react-native-blob-util 0.24.10
@config-plugins/react-native-pdf 14.0.2 (peer expo >=56; 2026-08-15) · @config-plugins/react-native-blob-util 14.0.2
@react-native-async-storage/async-storage 3.1.1 · expo-sqlite 57.0.2 · expo-file-system 57.0.6 · expo-dev-client 57.0.18 (peer expo *) · expo-keep-awake 57.0.1 · expo-build-properties 57.0.17
```
Docs consultadas (URL + citação ≤ 15 palavras; o resto parafraseado e marcado):
- **Requisitos SDK 57** — `docs.expo.dev/versions/latest/`: tabela "57.0.0 | 0.86" e "Minimum Node.js version | 22.13.x". `docs.expo.dev/get-started/set-up-your-environment/` (Android · emulador · dev build · local): JDK via `zulu@17` (paráfrase: instalar JDK 17); "Android 16 (`Baklava`) SDK is required to compile a React Native app"; exportar `ANDROID_HOME=$HOME/Library/Android/sdk` e PATH com `emulator`/`platform-tools`; comando `npx expo run:android`. `docs.expo.dev/get-started/create-a-project/`: `npx create-expo-app@latest`; "Node.js (LTS)".
- **(i) pnpm** — `docs.expo.dev/guides/monorepos/`: "first-class support for monorepos … Bun, npm, pnpm, and Yarn"; "Starting with SDK 54, Expo supports isolated dependencies"; em caso de problema, `nodeLinker: hoisted` no `pnpm-workspace.yaml` (paráfrase); "Expo configures Metro automatically for monorepos" (SDK 52+).
- **(ii) persistência do `firebase` JS em RN** — `docs.expo.dev/guides/using-firebase/` remete a `expo.fyi/firebase-js-auth-setup` (→ `github.com/expo/fyi/blob/main/firebase-js-auth-setup.md`): `import { initializeAuth, getReactNativePersistence } from 'firebase/auth'` + `persistence: getReactNativePersistence(AsyncStorage)`. **Medido no tarball** `@firebase/auth@1.13.5` (`npm pack` em `~/tmp/octavia-n0-scratch/inspect/`):
  ```
  $ jq '.exports["."]' package.json → "react-native": { "types": "./dist/rn/index.rn.d.ts", "default": "./dist/rn/index.js" }  (além de node/browser/cordova/webworker/default)
  $ jq '.peerDependencies, .peerDependenciesMeta' → "@react-native-async-storage/async-storage": "^2.2.0 || ^3.0.0"  (optional: true)
  $ grep -n "getReactNativePersistence\|AsyncStorage\|persistence" dist/rn/index.js | head
  34: * import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
  53:function getReactNativePersistence(storage) {
  125:AsyncStorage. Auth state will default to memory persistence and will not
  ```
  Ou seja: **sem código nativo; persistência é opt-in explícito; sem AsyncStorage o estado fica em memória** (aviso do próprio SDK). O pacote `firebase@12.18.0` só reexporta (`exports["./auth"]` → `./auth/dist/esm/index.esm.js`, sem entrada `react-native` própria — a condição é resolvida em `@firebase/auth`, daí N0-H2).
- **RN Firebase** — `rnfirebase.io/`: "cannot be used in the pre-compiled Expo Go app"; config plugins recomendados; exige `google-services.json`/`GoogleService-Info.plist`; `npx expo prebuild --clean`; iOS `useFrameworks: dynamic`. Tarballs: `@react-native-firebase/app` e `/auth` trazem `app.plugin.js` + `android/` + `ios/` (código nativo); peer `expo >=47.0.0`. `rnfirebase.io/auth/usage`: "ensuring that a users previous authentication state between app sessions is persisted".
- **(iii) `react-native-pdf`** — README: "This package is not available in the Expo Go app."; requer Custom Dev Client + config plugin (exemplo `expo/examples/with-pdf`, "not available in Expo Go"). Tarball 7.0.5: sem `app.plugin.js`; `codegenConfig` (Fabric, `org.wonday.pdf`); `android/build.gradle:107 minSdkVersion 21`, `:144 AndroidPdfViewer:4.0.1`, `:146 pdfiumandroid:1.0.32`. `github.com/expo/config-plugins/…/react-native-pdf`: install `npx expo install react-native-pdf react-native-blob-util @config-plugins/react-native-pdf @config-plugins/react-native-blob-util`; `plugins: ["@config-plugins/react-native-blob-util","@config-plugins/react-native-pdf"]`; tabela até **Expo 56 → 14.0.0**; SDK 57 não listado → `[hipótese]` (peer `expo >=56` aceita).
- **(iv) Maestro** — `docs.maestro.dev/maestro-cli/how-to-install-maestro-cli.md`: `curl -fsSL "https://get.maestro.mobile.dev" | bash` ou Homebrew; "Java version 17 or higher". `docs.maestro.dev/get-started/quickstart.md`: "Maestro currently supports API Levels 29, 30, 31, 33, and 34. API 35 and 36 support is arriving in Q2 2026." (stale em 2026-09 — N0-H4). `…/supported-platform/android.md`: "connects to your target via ADB"; "automatically detects and connects to running emulators".
- **Dev builds** — `docs.expo.dev/develop/development-builds/introduction/`: "A development build is the app compiled with the expo-dev-client library included." `expo-sqlite` "Included in Expo Go" (`docs.expo.dev/versions/latest/sdk/sqlite/`).
- **Package exports (E2)** — `docs.expo.dev/versions/latest/config/metro/`: "For native platforms, the condition `react-native` is added"; resolução por `package.json:exports` "from SDK 53 on all platforms"; desligar com `config.resolver.unstable_enablePackageExports = false`. `reactnative.dev/blog/2025/04/08/react-native-0.79`: "enabled by default for all the projects on React Native 0.79". `metrobundler.dev/docs/package-exports/`: "enabled by default in Metro since 0.82".

### B4. Prova de toolchain — **provado standalone** (E1; hipótese N0-H1)
O `probe` rodou **fora de workspace, com pnpm 11.16.0, sem monorepo**. Comandos exatos e saídas (scratch `~/tmp/octavia-n0-scratch/`, que fica até o N0-PR2 provar a cadeia no repo):
```
$ pnpm create expo-app@latest probe --template blank-typescript --no-install
Creating probe using the blank-typescript template. … ✔ Downloaded and extracted project files. ✅ Your project is ready!     (6,9 s)
probe/package.json: "expo": "~57.0.20", "expo-status-bar": "~57.0.1", "react": "19.2.3", "react-native": "0.86.3"; devDeps "@types/react": "~19.2.2", "typescript": "~6.0.3"
$ cd probe && pnpm install
Packages: +458 · [WARN] 1 deprecated subdependencies found: uuid@7.0.3 · Done in 13.7s using pnpm v11.16.0
(sem .npmrc, sem pnpm-workspace.yaml: linker isolado — node_modules/expo → .pnpm/expo@57.0.20_…; ls node_modules → 6 entradas; zero warning de peer)
$ npx expo-doctor
Running 21 checks on your project... 21/21 checks passed. No issues detected!
$ npx expo prebuild --platform android --no-install
› Android package name: com.anonymous.probe · ✔ Created native directory · » android: userInterfaceStyle: Install expo-system-ui … · ✔ Finished prebuild   (3,3 s)
android/gradle/wrapper: distributionUrl=…gradle-9.3.1-bin.zip · android/app/build.gradle:92 applicationId 'com.anonymous.probe'
$ ANDROID_HOME=$HOME/Library/Android/sdk JAVA_HOME=/Library/Java/JavaVirtualMachines/amazon-corretto-17.jdk/Contents/Home ADB_LOCAL_TRANSPORT_MAX_PORT=5555 \
  npx expo run:android --device Medium_Tablet          # java -version → openjdk version "17.0.15" 2025-04-15 LTS
START 2026-09-06T22:14:42-0300
  1-2:  › Using --device Medium_Tablet / › Building app... / Downloading https://services.gradle.org/distributions/gradle-9.3.1-bin.zip
  92:   Installing NDK (Side by side) 27.1.12297006 in /Users/marcelviana/Library/Android/sdk/ndk/27.1.12297006        ← divergência 9
  99:   Installing Android SDK Build-Tools 36 in /Users/marcelviana/Library/Android/sdk/build-tools/36.0.0
  106:  Installing Android SDK Platform 36 in /Users/marcelviana/Library/Android/sdk/platforms/android-36
  354:  BUILD SUCCESSFUL in 5m 1s
  355:  160 actionable tasks: 154 executed, 6 from cache
  tail: Starting Metro Bundler · Waiting on http://localhost:8081 · › Installing …/android/app/build/outputs/apk/debug/app-debug.apk ·
        › Opening com.anonymous.probe/.MainActivity on Medium_Tablet · › Logs for your project will appear below. · Android Bundled 5608ms index.ts (708 modules)
  log completo: anexo N0-B4-run-android.log.txt (363 linhas do original, sha256 e435e1757cbd269516ec9f56794051ed5fa9ccc670b5e75baf33215154d3686b)
APP_VISIBLE 2026-09-06T22:21:56-0300      (≤ 7 min 14 s do comando à activity em foco; poll de 5 s)
$ adb -s emulator-5554 shell dumpsys activity activities | grep -i probe | head -3
  * Task{daf438b #13 type=standard A=10214:com.anonymous.probe U=0 visible=true visibleRequested=true mode=fullscreen translucent=false sz=1}
    topResumedActivity=ActivityRecord{252765530 u0 com.anonymous.probe/.MainActivity t13}
    * Hist  #0: ActivityRecord{252765530 u0 com.anonymous.probe/.MainActivity t13}
$ adb -s emulator-5554 shell pidof com.anonymous.probe → 5727
$ adb -s emulator-5554 exec-out screencap -p > B4-blank.png ; ls -la → -rw-r--r-- 34786 B   (anexo N0-B4-blank.png, sha256 8df88baf…be20 — tela "Open up App.tsx to start working on your app!")
$ aapt dump badging app-debug.apk | grep -i "sdkVersion\|package:"
package: name='com.anonymous.probe' versionCode='1' versionName='1.0.0' platformBuildVersionName='16' platformBuildVersionCode='36' compileSdkVersion='36' compileSdkVersionCodename='16'
sdkVersion:'24'  targetSdkVersion:'36'                        (APK: 46.493.676 B)
```
Duas tentativas anteriores falharam e estão registradas: (1) `Error: could not connect to TCP port 5562 … adb -s emulator-5562 emu avd name exited with non-zero code: 1` em `getDevicesAsync` — divergência 8, **única correção de toolchain aplicada** (`ADB_LOCAL_TRANSPORT_MAX_PORT=5555` no servidor adb); (2) `CommandError: Could not find device with name: emulator-5554` — erro de uso (`--device` recebe o nome do AVD, não o serial).

Com o app blank no ar, os comandos do protocolo de H15 foram exercitados (sem Firebase — B4 mede só a cadeia):
```
$ adb -s emulator-5554 shell am force-stop com.anonymous.probe ; pidof com.anonymous.probe → (vazio)
$ … cmd connectivity airplane-mode enable ; settings get global airplane_mode_on → 1
$ … am start -n com.anonymous.probe/.MainActivity → Starting: Intent { cmp=com.anonymous.probe/.MainActivity }
$ … pidof com.anonymous.probe → 5849        $ … dumpsys activity activities | grep topResumed → topResumedActivity=ActivityRecord{236239543 u0 com.anonymous.probe/.MainActivity t14}
$ adb logcat -d -s ReactNativeJS | tail -3 → 09-06 22:21:59.071  5727  5788 I ReactNativeJS: Running "main" with {"rootTag":1,"initialProps":{},"fabric":true}
$ … cmd connectivity airplane-mode disable ; settings get global airplane_mode_on → 0
$ … pm clear com.anonymous.probe → Success
$ … ping -c 1 -W 3 8.8.8.8 → 64 bytes from 8.8.8.8 … time=22.8 ms      (rede LIGADA ao final)
$ pkill -f "expo run:android" → 0 processos; porta 8081 livre        $ adb -s emulator-5554 emu kill → OK: killing emulator, bye bye   (0 qemu-system depois)
```
Tamanhos: `probe/` 1,4 GB (`node_modules` 607 MB, `android/` 783 MB); `inspect/` 123 MB. Nada do `probe/` entra no repo.

### B5. Orçamento de prod para o N0 (declarado, não executado)
Por abertura do app de dev = 1 `signInWithPassword` (Google Identity, fora do nosso limite) + 1 `GET /api/setlists` (`setlist-read`, 300/min) + **0 escrita, 0 `session`, 0 `proxy`, 0 `content-read`** (o N0 não sincroniza content). Teto: **≤ 60 aberturas/dia e ≤ 20/hora** (0,3 % da janela por abertura). H16: 4 `HEAD` no bucket público (sem família de API). Gatilhos de parada: **qualquer 401 → nunca repetir com o mesmo token; 2º 401 → parar o dia** (T1-R3); **`authfail` ≥ 1 no IP** (qualquer 401 recebido conta 1) → parar e reportar; qualquer 429 → parar. Conta: só `marcelviana+uxtester@gmail.com` (`.env.uxaudit`); nunca preview, nunca bypass secret, nunca a conta principal. Nada de `/api/auth/session` nunca (C-D1).

---

## C. Proposta — preparada; decisões fechadas em §1

### C1. Estrutura do monorepo
**(a) Next na raiz + `apps/native` + `packages/core`** (decisão N0-D0) — **6 arquivos editados** (contagem a partir de A3):

| Arquivo | Mudança |
|---|---|
| `pnpm-workspace.yaml` | `packages: ['.', 'apps/*', 'packages/*']` (mantendo `ignoredBuiltDependencies`/`onlyBuiltDependencies`) |
| `tsconfig.json` | `exclude` + `"apps/**"`, `"packages/**"` |
| `tsconfig.test.json` | idem (herda o `include`) |
| `vitest.config.mts` | `exclude` + `'apps/**'`; `packages/core/**/*.test.ts` entra pelo default (A3/E4) — `include` explícito só se a coleta implícita falhar |
| `.gitignore` | `apps/native/android`, `apps/native/ios`, `.expo/`, `apps/native/.env*` (já coberto por `.env*`) |
| `.github/workflows/ci.yml` | inalterado; job nativo em **arquivo novo** `native.yml` (C4-2) — conta como o 6º arquivo tocado no PR2 |

Novos: `apps/native/*` (scaffold, N0-PR2), `packages/core/{package.json,tsconfig.json,src/**}` (N0-PR1), `scripts/native-env.sh` (N0-D8). `.npmrc`: **sem mudança** (N0-D4). Scripts de raiz mínimos: nenhum novo obrigatório — `pnpm test` da raiz já cobre `packages/core`; `pnpm --filter native <cmd>` para o nativo. **Console do Vercel** `[hipótese]`: Root Directory continua `.`; o `pnpm install` do build passa a instalar o workspace inteiro (+458 pacotes/~600 MB, medido no probe) — se o tempo subir de forma visível (E7 mede), Install Command `pnpm install --frozen-lockfile --filter octavia` (passo do Marcel). Lockfile único na raiz; `--frozen-lockfile` do CI passa a cobrir os três pacotes.

**Regras de `packages/core`** (E3, vinculantes a partir do N0-PR1): **zero** dependência de `react`, `react-native` e `firebase`; `zod` na mesma major do web (`^3`); compilado e testado pelo **TypeScript 5** da raiz e pelo Vitest da raiz; todo teste abre com `// @vitest-environment node` (o config da raiz é jsdom + `src/test-setup.ts`). Motivo medido: o workspace terá **duas versões de React (18 × 19.2.3), de TypeScript (^5 × 6.0.3) e de Firebase (^11 × 12.18)**; o core é a única parte que os dois lados importam e não pode escolher lado. Conteúdo do core (P-N0-1): repositório local (interfaces), invalidação por `updated_at`, substituição atômica por conjunto (T1-R9/R9b), normalização de busca (T1-R21), contrato de `content_data` por tipo (T1-R7) — TS puro + zod.

**(b) mover o Next para `apps/web`** — para registro futuro: todos os ~25 arquivos de config da raiz + `git mv` de `app components contexts hooks lib types public worker scripts styles tests __tests__ src middleware.ts`, scripts com caminhos relativos (`.env.uxaudit`, `types/database.types.ts`, `supabase/`), `ci.yml` (`working-directory`), Vercel Root Directory (console), CLAUDE.md e centenas de referências `arquivo:linha` nos docs. Custo alto sem ganho para o N0 — não agora.

### C2. Firebase no RN — decisão N0-D1 (a)

| | `firebase` JS SDK + AsyncStorage **(escolhido)** | `@react-native-firebase/auth` |
|---|---|---|
| Código nativo | **não** (`@firebase/auth` export condition `react-native` puro-JS; AsyncStorage é módulo nativo incluso na dev build) | **sim** (`app.plugin.js` + `android/` + `ios/`; prebuild) |
| Console | **nenhum** — usa `apiKey/authDomain/projectId/appId` do web (H11 fechada) | registrar app Android no projeto Firebase (`rocks.octavia.app`) + `google-services.json` no repo |
| Persistência | opt-in: `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` — **antes** de qualquer `getAuth` (senão memória, aviso da linha 125) | SDK nativo, automática (doc) |
| Último idToken offline | N0-H3 | `[hipótese]` idem |
| Sessão sem rede | **é a medição H15** | idem |

**H15 é duas medições**: **H15-a** "usuário restaurado sem rede" (o que T1-R19/A5 exigem) e **H15-b** "token disponível sem rede" (N0-H3; não exigido pela tela 1 — sync só com rede).

**Protocolo de prova de H15** (emulador `octavia_tab`; no Tab S6 os mesmos comandos com o serial USB):
```bash
source scripts/native-env.sh      # ANDROID_HOME, PATH, JAVA_HOME 17, ADB_LOCAL_TRANSPORT_MAX_PORT=5555; ANDROID_SERIAL=<serial>
```
1. `adb kill-server && adb start-server` → `adb devices` lista só o alvo (sem `emulator-5562 offline`).
2. Online: abrir o app, login email/senha (conta de audit); esperar `adb logcat -d -s OCTAVIA:*` mostrar `OCTAVIA: auth uid=<uid> src=login` e `OCTAVIA: setlists=3` (tag emitida pelo app; **uid e contagem, nunca token nem email**). Custo: 1 login + 1 `setlist-read`.
3. `adb shell am force-stop rocks.octavia.app` → `adb shell pidof rocks.octavia.app` vazio.
4. `adb shell cmd connectivity airplane-mode enable` → `settings get global airplane_mode_on` = 1 → `ping -c 1 -W 3 8.8.8.8` = `Network is unreachable` (se não cortar: `svc wifi disable && svc data disable`, provado em B2).
5. `adb logcat -c` → `adb shell am start -n rocks.octavia.app/.MainActivity` → `adb logcat -d -s OCTAVIA:*` → **esperado (H15 verdadeira)**: `OCTAVIA: auth uid=<mesmo uid> src=restored offline=true` + `OCTAVIA: setlists=3 src=cache`; **sem** `OCTAVIA: login-screen`. `screencap`.
6. Controle negativo (regra nº 7): avião ainda ligado, `adb shell pm clear rocks.octavia.app` → `Success` → `am start` → esperado `OCTAVIA: login-screen` (sem usuário). `screencap`.
7. `cmd connectivity airplane-mode disable` → ping passa. Rede ligada ao final, provada.

**"H15 falsa" para o PRD**: A5 e T1-R19 falham como escritos — o app pediria login em modo avião e o cache namespaced por `uid` (PRD §5) ficaria inacessível sem um usuário do SDK. Sem redesenho aqui: o N0 termina com a resposta binária e a decisão volta ao Marcel.

### C3. PDF — decisão N0-D2 (a)
`react-native-pdf 7.0.5` + `react-native-blob-util 0.24.10` + `@config-plugins/react-native-pdf 14.0.2` + `@config-plugins/react-native-blob-util 14.0.2` (`plugins` no `app.json`) → **exige prebuild/dev build** (B4 provou a cadeia; Expo Go descartado — P-N0-2). Due diligence do P4 (N0-PR5): baixar `https://mlxjmpbdchmwplcfislt.supabase.co/storage/v1/object/public/content-files/1786218427769-ux-audit-partitura-1p.pdf` (20.821 B, sha256 `3d42199b…` do C-PRECHECK B.2) e o de 12 páginas `…/1786218429715-ux-audit-partitura-12p.pdf` para `FileSystem.cacheDirectory`, renderizar `<Pdf source={{ uri: 'file://…' }} />`; critério: 12 páginas navegáveis do disco em modo avião (T1-R26). **H16**: `curl -sI <file_url> | grep -i content-length` nas **4 URLs distintas** da conta de audit (anexo B-P5 do C: `…1786295884124-ux-audit-fase-d-offline.pdf` ×2, `…1786295844475-ux-audit-fase-d-cifra.pdf`, `…partitura-12p.pdf`, `…partitura-1p.pdf`) — 0 custo de API; conta principal = passo do Marcel no dashboard ou o app logado na principal listando `file_url` após o N0-PR3 — `[hipótese]` até lá. Se o plugin 14.0.2 falhar no prebuild com SDK 57, alternativa: `packagingOptions` (`libc++_shared.so`, `libjsc.so` — README do react-native-pdf) via `expo-build-properties`.

### C4. Aparato de validação — quatro camadas
1. **`packages/core` no Vitest da raiz** — **provado**: alvos são TS puro/zod (A6); o Vitest da raiz coleta `**/*.test.ts` pelo default (A3/E4); falta `exclude: ['apps/**']` e `// @vitest-environment node` (E3). Não bloqueia.
2. **Build verificável por PR** — **provado standalone** (E1): create → install → doctor → prebuild → `run:android` → APK 46 MB, Gradle 5 min 01 s (com download de 2,7 GB de SDK + Gradle 9.3.1). Job proposto, arquivo novo `.github/workflows/native.yml` (E6): `on.pull_request.paths: [apps/native/**, packages/core/**, .github/workflows/native.yml, pnpm-lock.yaml]` (+ `push: main` com os mesmos `paths`) · `ubuntu-latest` · `setup-node@v4` **22** · `setup-java@v4` temurin **17** · `android-actions/setup-android@v3` · `actions/cache` para `~/.gradle/caches`, `~/.gradle/wrapper` e `$ANDROID_HOME` (chave por `pnpm-lock.yaml` + `apps/native/android/**`) · `pnpm install --frozen-lockfile` · `cd apps/native && npx expo prebuild --platform android --no-install && cd android && ./gradlew assembleDebug` · `upload-artifact app-debug.apk`. **PRs só de web não o executam** (filtro de `paths`). Repo **público** (`gh repo view --json isPrivate,visibility` → `{"isPrivate":false,"nameWithOwner":"marcelviana/octavia","visibility":"PUBLIC"}`) → minutos do GitHub Actions **sem cobrança** para repositório público `[hipótese: política vigente do GitHub em 2026-09]`; custo por PR nativo N0-H6 (8–12 min sem cache; 4–6 com). Sem EAS. Não bloqueia (roda a partir do N0-PR2).
   **Referência de duração antes do workspace (E7)** `[medido]`: `ci.yml` em `ae298fe` (push main, run 34029400352): `startedAt 2026-09-06T11:08:56Z` → `updatedAt 11:10:16Z` = **1 min 20 s, `conclusion: failure`** (passo `Test` falhou pelo flake — div. 15 — e `Test coverage`/`Build` foram `skipped`; steps: install 4 s, lint 6 s, tsc 11 s, test 41 s). Run completo e verde mais próximo: PR #262 em `73a8490` (run 34029361066): `11:08:07Z` → `11:11:20Z` = **3 min 13 s, `success`**. Deploy do Vercel em `ae298fe`: **N0-H7** (painel, Marcel). O **N0-PR1 mede os mesmos dois depois** e declara a diferença (padrão P1-contraste).
3. **Maestro em emulador** — inteira `[hipótese]` (N0-H4; nada instalado — instalar exige "ok": `brew`/curl global). **Não bloqueia o N0.**
4. **Aceite em emulador + Tab S6** — **provado o instrumento**: adb + saída literal + `screencap` (B2/B4), `am force-stop/start`, `pm clear`, `logcat -d -s TAG`, `pidof`, `dumpsys activity activities | grep topResumed`. Não bloqueia; o Tab S6 entra uma vez, no aceite final. **Só H15 bloqueia o N0.**

### C5. Recorte de execução (sem código ainda)
- **N0-PR0** — este pre-check (`docs/native/N0-PRECHECK.md` + anexos). Prova: `git diff --stat` só em `docs/`; sha dos anexos. Controle: CI = `ci.yml` normal.
- **N0-PR1** — workspace + `packages/core` vazio: os arquivos de C1 (`pnpm-workspace.yaml`, `tsconfig*.json`, `vitest.config.mts`, `.gitignore`), `packages/core/{package.json (sem react/react-native/firebase; zod ^3), tsconfig.json (estende o da raiz, TS 5), src/normalize.ts + src/normalize.test.ts}` sentinela (`// @vitest-environment node`; `aguas` ≡ `Águas`, colapso de espaços, minúsculas). Prova: `pnpm test` = **650 passed** (649 + 1) / 86 skipped, `tsc --noEmit` limpo, `pnpm lint` limpo, `pnpm build` intocado; **E7**: duração do `ci.yml` e do deploy do Vercel depois × antes, diferença declarada. Controle negativo: sentinela invertida falha no gate da raiz.
- **N0-PR2** — `apps/native` blank + CI de APK: `create-expo-app` no workspace (SDK ~57.0.20, RN 0.86.3), `app.json` **mínimo** (E8): `name`, `slug`, `android.package: "rocks.octavia.app"`, `expo-dev-client` — **sem `orientation`** (requisito do N1); `scripts/native-env.sh` (N0-D8); download da imagem `android-31` + `avdmanager create avd octavia_tab` (N0-D5, com `sdkmanager --list_installed` antes/depois colados — regra do D7); `native.yml` (C4-2). Prova: **N0-H1 fechada** (Metro resolve o app dentro do workspace isolado), artefato `app-debug.apk` no PR, blank no `octavia_tab` (mesmas 3 linhas do `dumpsys`, `aapt dump badging` com `package: name='rocks.octavia.app'`), `cmd connectivity airplane-mode` provado na API 31. Controle: CI falha se `prebuild` quebrar; PR só de docs não dispara `native.yml`.
- **N0-PR3** — login email/senha + `GET /api/setlists` bearer + tag `OCTAVIA`: `firebase` + `@react-native-async-storage/async-storage`, `initializeAuth` com persistência, `fetch` com `Authorization: Bearer` (prefixo literal, T1-R1), 1 retry no máximo em 401 (T1-R3), sem cache HTTP (T1-R12). Prova: **N0-H2 fechada**; logcat com `uid` e `setlists=3`; oráculo Node (A5) mostra o mesmo `sub`/`aud`; captura de tráfego (Metro/`adb logcat` da camada de rede do app) com 100 % `Authorization: Bearer`, zero `/api/auth/session`, zero `Cookie`. Controle: token forjado → 2 requests no máximo e tela de login (A2). Orçamento B5.
- **N0-PR4** — H15 (docs + evidência): protocolo C2 no `octavia_tab`, screencaps, logcat; controle negativo `pm clear`. **Resposta binária H15-a; H15-b (N0-H3) registrada.**
- **N0-PR5** — PDF + H16: config plugins, render do P4 e do 12 páginas do disco em avião; 4 HEADs; controle: sem cache + avião → placeholder.
- **Aceite final do N0** — Tab S6 (Android 12, API 31, One UI 4.1.1): N0-PR4 repetido com o serial USB (`adb devices` com o tablet); screencap; `logcat` idêntico em forma.

### C6. Perguntas de decisão → fechadas em §1 (N0-D1…D9)
Registro das opções avaliadas, para memória: D1 (a) JS SDK × (b) RN Firebase · D2 (a) react-native-pdf × (b) `expo-pdf`/WebView `[não medido]` · D3 fixar o medido × "latest" · D4 (a) isolado × (b) hoisted (rejeitado: dois React na raiz) · D5 (a) API 31 download × (b) API 32 já instalada × (c) `Medium_Tablet` API 36 · D6 (a) PR × (b) main direto · D7 (a) manter × (b) desinstalar · D8 (a) shell do Marcel × (b) script versionado · D9 `rocks.octavia.app`.

---

## D. Aprendizados (lições do pre-check)

**(a) Regra nova do D7** — "`expo run:android`/Gradle **instala pacotes do SDK sem perguntar** (aqui: NDK 27.1 de 2,4 GB, build-tools 36, platform 36 — licenças já aceitas na pasta `licenses/`). Toda build roda com `ANDROID_HOME` fixo (`scripts/native-env.sh`) e `sdkmanager --list_installed` **colado antes e depois**; a diferença é declarada no PR." A regra 8 ("não instalar nada globalmente sem ok") não cobria o instalador implícito; agora cobre.

**(b) Lição do revisor** — "premissa de prompt sobre código que 'existe' (divergência 4: o 'módulo de normalização do B6') e sobre a forma de um número (divergência 2: '649 testes / 86 arquivos') são **hipóteses** — o pre-check verifica a forma, não a assume." Mesma classe da lição (a) do C-ENCERRAMENTO (o dump sem storage): toda premissa de onde um fato vive, ou de que forma ele tem, é medida antes de medir o fato.

**(c) "Provado" tem escopo** — o B4 provou a cadeia Expo → prebuild → build → emulador **standalone** (pnpm 11.16.0, sem workspace). Chamar isso de "provado localmente" escondia a hipótese que importa (N0-H1: dentro do workspace pnpm 10.28.0 isolado). Regra: todo `[medido]` de toolchain declara **em que ambiente** foi medido (gerenciador e versão, dentro/fora do workspace, JDK, SDK), senão vira `[hipótese]` no ambiente-alvo.

**(d) O ambiente da máquina é parte do medido** — o dispositivo fantasma `emulator-5562` (NTKDaemon na porta 5563) não aparece em nenhuma doc e derrubou a build na primeira tentativa. O `adb devices` **antes** de subir o emulador é o primeiro comando de qualquer sessão nativa, e o `scripts/native-env.sh` carrega o contorno.

**(e) Flake conhecido derruba a main** — o `performance-mode-responsiveness.test.tsx:310` já estava vermelho no CI de `ae298fe` antes desta sessão (div. 15). Registrado como dívida do web para o Bloco B; o N0 não o toca, mas todo PR do N0 lê o `gh pr checks` sabendo que um `Test` vermelho pode ser ele — e **não** o aceita como "normal": reroda e cola.

---

## Anexos (`docs/native/N0-PRECHECK-anexos/`) `[medido]`

| Arquivo | Conteúdo | Linhas | sha256 |
|---|---|---|---|
| `N0-A7-tsc-tests.txt` | `pnpm exec tsc -p tsconfig.test.json --noEmit` em `ae298fe` (151 `error TS`) | 227 (1 de cabeçalho + 226) | `4cc430878ec6f45f11bb623c0da946965b34517cda59e491d3428ca39e5225b5` |
| `N0-B1-sdkmanager-antes.txt` | `sdkmanager --list_installed` antes do B4 (transcrito da saída colada na sessão) + diferença | 28 | `c05fa6e11e546795491e29e069cff75b8488ce9fab08611e47836ee5dd0f5024` |
| `N0-B1-sdkmanager-depois.txt` | `sdkmanager --list_installed` depois do B4 (2026-09-07) | 27 | `adb43a96c89bcedc9fad0b0599fdf23da54996122bf846e95d4251d2a42f4f28` |
| `N0-B2-emulator.log.txt` | log do `emulator -avd Medium_Tablet -no-snapshot-load` (original 148 linhas, sha `e4333edf…e5e44`) | 149 | `6af833ecee47b505157e685ca352838d13d6aacbab3858efb97bfe222b1bf9c1` |
| `N0-B4-run-android.log.txt` | log do `npx expo run:android --device Medium_Tablet` (original 363 linhas, sha `e435e175…3686b`) | 364 | `9b74ee18d96e5cf5d44bc895f5bd09234315fc024d25288bb2d99b8d2535bd20` |
| `N0-B4-blank.png` | `adb exec-out screencap -p` do blank no `Medium_Tablet` (2560×1600, 34.786 B) | — | `8df88bafedb74636a9547c04933c7423f14a93d59b66f4596b891189d672be20` |

Cada anexo de texto abre com o comando que o gerou. Nada do `probe/` ou do `inspect/` entra no repo (scratch `~/tmp/octavia-n0-scratch/` fica até o N0-PR2).

**O que precisa do Marcel** (transposto do relatório): "ok" para o download da imagem `android-31` no N0-PR2 (com o tamanho colado); duração do deploy do Vercel em `ae298fe` (N0-H7); Install Command do Vercel só se o E7 do PR1 mostrar aumento visível; dashboard para H16 da conta principal (ou após o N0-PR3). **Não reproduzido**: nada da cadeia Expo→prebuild→build→emulador; `[hipótese]` ficaram Maestro (N0-H4), o config-plugin de PDF com SDK 57, `getIdToken` offline (N0-H3) e a cadeia dentro do workspace (N0-H1) e a export condition no Metro (N0-H2). **Tempo da Fase B4**: ~13 min de relógio (22:09 → 22:22 em 2026-09-06), dos quais `run:android` bem-sucedido = 7 min 14 s (Gradle 5 min 01 s incluindo Gradle 9.3.1 + 2,7 GB de SDK); duas tentativas falhas de ~1 min cada.
