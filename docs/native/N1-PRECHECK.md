# N1-PRECHECK.md — Bloco N1 (tela 1 no tablet): pre-check

> **Datas**: medições em 2026-09-09 (sessão nova e dedicada; checkout principal em `b7/encerramento` == `origin/main` `138bf1a`, árvore limpa, nenhum worktree extra); aval do Marcel e decisões **N1-D1…D12** em 2026-09-10; este documento é a **N1-PR1** (docs-only). Insumos congelados: [`PRD-TELA-1.md`](PRD-TELA-1.md) (38 requisitos T1-R1…R37 + R9b, 22 aceites A1–A22) e [`DESIGN-TELA-1/`](DESIGN-TELA-1/README.md) (18 telas; sha256 do HTML `9761e4e5…` e do PDF `b24ef2d8…` conferidos). Herança: [`N0-ENCERRAMENTO.md`](N0-ENCERRAMENTO.md) §6/§10/§11, [`docs/ux/B7-ENCERRAMENTO.md`](../ux/B7-ENCERRAMENTO.md) §9, [`docs/ux/B7-anexos/D5-content_data-chaves.md`](../ux/B7-anexos/D5-content_data-chaves.md), contratos em `docs/api/*`.
> **Regras de forma**: `[medido]` = comando exato + saída literal (aqui ou nos anexos de [`N1-PRECHECK-anexos/`](N1-PRECHECK-anexos/), cada um aberto pelo comando, com `wc -l` + sha256 no §9); `[hipótese]` rotulada; premissa falsa é declarada com origem, nunca acomodada. Zero commit/branch antes do aval; zero escrita em prod/Supabase; zero console; prod só leitura com a conta de audit (teto 6 requests — consumidos **3**).

---

## 0. Decisões do Marcel (2026-09-10) e leituras da conta principal

| # | Decisão | Base |
|---|---|---|
| **N1-D1** | Navegação: `@react-navigation/native` 7.3.18 + `@react-navigation/native-stack` 7.18.10 (peers nativos: `react-native-screens` 4.26.2, `react-native-safe-area-context` 5.7.0) | A5, div. 14 |
| **N1-D2** | Cache: JSON em `Paths.document` (por `uid`) + índice em memória; sem `expo-sqlite` | A5 (66 itens / 52.941 B) |
| **N1-D3** | Maestro **não** instala no N1 | B3, div. 5 |
| **N1-D4** | AVD `octavia_tab32` criado na PR3 (comando B5) com `hw.lcd.density=360` `[hipótese]`; se o emulador rejeitar, fica 320 e declara | B5, div. 3 |
| **N1-D5** | Catálogo de logs A6 + `t=<ms>` em `sync ok` (E3) → [`LOGS-OCTAVIA.md`](LOGS-OCTAVIA.md) | A6 |
| **N1-D6** | Fontes: 6 ttf via config plugin `expo-font` — Raleway 500+600, Manrope 400+600, IBM Plex Mono 400+600 (793.720 B) | A5, div. 12 |
| **N1-D7** | Apagar a UI de prova na PR3 (`App.tsx`, `PdfProbe.tsx`, `api.ts`, `files.ts`, `log.ts`); **`firebase.ts` fica** — exceção declarada à N0-D11 | A2 |
| **N1-D8** | Orçamento de prod = B6 | B6 |
| **N1-D9** | Ordem: PR1 → PR2 → PR3 → PR4 (spike C3) → PR5 → PR6 → PR7 → aceite T | C1 |
| **N1-D10** | A10 (prefetch de 7 dias) por fixture; prova real só no aceite T com a setlist datada da principal (H17) | B6 |
| **N1-D11** | Rede = `expo-network` 57.0.1 | A5 |
| **N1-D12** | `orientation: "default"`, sem lock; rotação preserva posição (T1-R27) | A5, design proposta 08 |
| div. 6 | Fixture de 120 colunas na PR4; item real na conta de audit = escrita do Marcel, decidida na PR4 | A3 |

**Leituras do Marcel (SQL de leitura no console, 2026-09-10; verbatim)** — fecham a div. 8 e parte do H16:

```
-- inválidos reais por perfil (T1-R7): sem corpo e sem arquivo, ou objeto sem a chave do tipo
| user_id                              | content_type | total | sem_corpo_sem_arquivo | objeto_sem_chave |
| ------------------------------------ | ------------ | ----- | --------------------- | ---------------- |
| 6b2da77b-c2ae-487b-a302-9a70d0a2a512 | Chords       | 4     | 2                     | 2                |
| 6b2da77b-c2ae-487b-a302-9a70d0a2a512 | Lyrics       | 52    | 0                     | 0                |
| 6b2da77b-c2ae-487b-a302-9a70d0a2a512 | Sheet        | 4     | 2                     | 2                |
| 6b2da77b-c2ae-487b-a302-9a70d0a2a512 | Tab          | 5     | 5                     | 0                |
| Pw3bxXZw0iT3WwyL7kxGtGJIJH83         | Chords       | 18    | 0                     | 0                |
| Pw3bxXZw0iT3WwyL7kxGtGJIJH83         | Lyrics       | 38    | 0                     | 0                |
| Pw3bxXZw0iT3WwyL7kxGtGJIJH83         | Sheet        | 2     | 0                     | 0                |
| Pw3bxXZw0iT3WwyL7kxGtGJIJH83         | Tab          | 8     | 0                     | 0                |
| xVDJRBh1WpPOatbfWahOLttYn1E3         | Chords       | 3     | 0                     | 0                |
| xVDJRBh1WpPOatbfWahOLttYn1E3         | Lyrics       | 57    | 0                     | 0                |
| xVDJRBh1WpPOatbfWahOLttYn1E3         | Sheet        | 1     | 0                     | 1                |
| xVDJRBh1WpPOatbfWahOLttYn1E3         | Tab          | 2     | 0                     | 0                |

-- H16 da principal: tamanhos reais são só pelo dashboard/Storage; aqui só a contagem de arquivos por perfil
| user_id                              | com_arquivo |
| ------------------------------------ | ----------- |
| Pw3bxXZw0iT3WwyL7kxGtGJIJH83         | 5           |
| 6b2da77b-c2ae-487b-a302-9a70d0a2a512 | 2           |
| xVDJRBh1WpPOatbfWahOLttYn1E3         | 1           |
```

Leitura: a tabela `content` tem **3 `user_id`** (65 + 66 + 63 = 194 ✓ N4 do PRD). `Pw3b…` é a conta de audit (uid medido em A3). **`xVDJ…` = conta principal** `[hipótese forte: 63 content = H14 do PRD; uid no formato Firebase]` — **0 inválidos** do T1-R7 (o único "objeto_sem_chave" é 1 Sheet com `content_data` objeto e `file_url` presente: a query usa `'__none__'` para Sheet, logo conta todo Sheet-objeto; pela D5b Sheet não tem chave obrigatória → válido) e **1 arquivo**. `6b2da77b…` (uuid, não uid do Firebase — `[hipótese]` perfil legado) concentra os inválidos: 2 + 2 + 5 = **9** sem corpo/arquivo (+ 2 Chords objeto sem `chords`, que podem coincidir) — é dali que veio o "~11" do B7 §9. Consequências: (i) a errata do PRD §4 corrige a atribuição; (ii) o aceite A6 com a principal renderiza 63/63 sem placeholder — o placeholder é provado por fixture (N1-D10); (iii) prefetch/LRU na principal têm **1** arquivo (tamanho pendente do dashboard — H16 principal continua "não medido").

---

## 1. Divergências (16) — origem P prompt do revisor · D docs · A ambiente · T aparato · X terceiros

| # | Onde | Divergência | Origem |
|---|---|---|---|
| 1 | A3 | `SETLISTS.md` **não documentava o `GET /api/setlists`** (só addSong/order/delete + invariante 1..N); forma medida no código (`app/api/setlists/route.ts:12-80`) e em prod → seção nova nesta PR | P |
| 2 | A3 | PRD §2 (l.53), T1-R12 (l.142), H13 (l.262) e §11 (l.308) afirmavam `Cache-Control: public, max-age=0, must-revalidate`; prod devolve **`private, no-store`** nas 3 requests (B7-PR3) → errata nesta PR | D |
| 3 | A2/A4 | Design "Galaxy Tab S6, paisagem, **1280×800 dp**"; o Tab S6 mede `wm size` 1600×2560 / `wm density` 360 (`density=2.25`) → **1138×711 dp**; 1280×800 dp é o `pixel_tablet` do AVD (2560×1600 @ 320) → **errata do design (E1)** | D |
| 4 | A4 | README do design "todos com IDs T1-R": 23 dos 38 IDs nas 18 telas; 15 sem tela (R1–R5, R7–R10, R9b, R12, R14, R16, R19, R37), não-visuais → **esclarecimento (E2)**, não defeito | D |
| 5 | B3 | Doc do Maestro: "supports API Levels **29, 30, 31, 33, and 34**. API 35 and 36 … Q2 2026" — **API 32 ausente** (Tab S6 e AVD alvo). O N0 citou a linha sem notar → N1-D3 | T |
| 6 | A4 | Aceite de T1-R31 pede "cifra com linha de **120 colunas**": na biblioteca de audit a linha mais longa tem **58 colunas** (512 linhas de corpo, 0 ≥ 80) → fixture na PR4 | D |
| 7 | A3 | PRD §5 "21.423 B embutidos" × **34.634 B**; §4 "Chords máx. 465 B" × **291 B**; C-D3 "19.481 B de corpos" × **18.043 B** → nota N7 do PRD (método) | D |
| 8 | §0 | Prompt atribuía "~11 inválidos do T1-R7" à conta **principal**; o anexo D5 mede `public.content` inteira. **Fechada pela leitura do Marcel**: principal = 0; os inválidos são do perfil `6b2da77b…` | P |
| 9 | A2 | Sem `pdftotext`/`pdftoppm`/`mutool`/`pypdf`; o HTML do design é "Bundled Page" que exige JS; `file://` bloqueado no browser do app → cópia em scratch servida por `python3 -m http.server 8765` (127.0.0.1) e lida renderizada; PDF não lido (sha confere) | A |
| 10 | A1 | `adb shell run-as … sh -c '…'`: aspas consumidas pelo zsh local; a 1ª leitura do Tab S6 deu "sem databases" (falso); refeita com `adb shell "run-as … sh -c '…'"` | T |
| 11 | A3 | `tsx` rejeita top-level `await` em `.ts` (saída cjs) → `.mts`; a tentativa falha **não** fez request | T |
| 12 | A5 | Tokens do design "Raleway 600"; o HTML carrega **Raleway 500 e 600** (`document.fonts`); Manrope 500/700 declarados e não carregados → N1-D6, E1 | D |
| 13 | A5 | `expo-keep-awake`, `expo-font`, `expo-constants`, `expo-asset` **já são dependências do pacote `expo` e já autolinkam** no dev client atual (17 módulos) → sem rebuild; o resto exige | P |
| 14 | A5 | `expo-router@57` tem **10 peers** (reanimated, gesture-handler, screens, safe-area-context, expo-linking, expo-constants, react-native-web, `@expo/metro-runtime`, `react-server-dom-webpack`, `@testing-library/react-native`); `native-stack` tem 2 → N1-D1 | X |
| 15 | A1 | Tab S6 **conectado por USB** no início (`RX2N8000F3D`); usado só em leitura; estado bate com N0 §11 (sem sessão, cache vazio, avião 0) e **auto-rotate ligado** | A |
| 16 | §0 | B7-ENCERRAMENTO §9 e o PLANO diziam "a conta principal tem ~11 registros no estado inválido"; medido por `user_id`: **principal 0**, perfil `6b2da77b…` 9 (+2) — o próprio anexo D5 se rotulava "conta principal + demais perfis" | D |

Contagem: P 3 · D 7 · A 2 · T 3 · X 1 = **16**. As 3 P são do prompt do revisor.

---

## 2. Fase A — Inventário `[medido]`

### A1 — Estado, baseline e ambiente

```
$ git status --short --branch            → ## b7/encerramento...origin/b7/encerramento   (limpo)
$ git worktree list                      → /Users/marcelviana/projects/octavia  1d31abc [b7/encerramento]
$ git fetch --all --prune                → (sem saída)
$ git log --oneline -3 origin/main       → 138bf1a Merge pull request #280 … · 1d31abc docs(B7): encerramento … · a9e543f Merge pull request #279 …
$ git diff origin/main --stat | tail -1  → (vazio)
$ gh pr list --state open                → (nenhuma); #271 MERGED 76c87c8 (2026-09-09T11:54Z); #280 MERGED (20:47Z)
$ git branch -r | grep -E "n1/|b7/"      → origin/b7/{encerramento,pr2-remocoes,pr3-cache-control,pr4-order-id,pr5-zod-content-data,pr6-flake,pr7-aparato}; nenhuma n1/*
$ pnpm test                              → Test Files 79 passed | 4 skipped (83) · Tests 685 passed | 85 skipped (770) · 35,40 s   (anexo A1-pnpm-test.txt)
   por projeto (saída sem ANSI): web 76 ✓ + 4 ↓ arquivos, 759 testes = 674 passed + 85 skipped · core 3 ✓ arquivos, 11 testes (isolation 2, normalize 4, auth-fetch 5), 0 skipped
$ pnpm lint                              → ✔ No ESLint warnings or errors (3,2 s)
$ pnpm exec tsc --noEmit -p tsconfig.json                 → exit=0 (7,1 s)
$ pnpm exec tsc -p packages/core/tsconfig.json --noEmit   → exit=0 (0,7 s)
$ pnpm --filter native run type-check    → exit=0 (2,1 s)
$ source scripts/native-env.sh; adb devices -l
   RX2N8000F3D  device usb:0-1.1 product:gts6lxx model:SM_T865 device:gts6l   (Tab S6 por USB — div. 15)
$ emulator -list-avds                    → Medium_Tablet · Pixel_3a_API_32_arm64-v8a · octavia_tab
$ sdkmanager --list_installed            → 24 pacotes (anexo A1-sdkmanager-antes.txt); depois da sessão: diff VAZIO (anexo A1-sdkmanager-depois.txt)
   destaque: platforms 31/32/34/35/36 · system-images android-31 (google_apis v11) · android-32 (google_apis v8, 4,2 GB) · android-36 (playstore) · ndk 26.3 + 27.1 · build-tools 30.0.3…36.0.0 · emulator 35.5.10 · platform-tools 35.0.2
$ node -v / pnpm -v / java -version      → v22.23.1 · 10.28.0 · openjdk 17.0.15
$ which maestro                          → not found
```

Estado dos devices (só leitura, `adb shell "run-as rocks.octavia.app sh -c '…'"`; anexo `A1-emulator-boot.log.txt`):

| Device | API | `wm size` / density | app | `databases/RKStorage` | chaves `firebase:authUser` | `cache/files` | avião | rotação |
|---|---|---|---|---|---|---|---|---|
| `octavia_tab` (boot headless 9 s; encerrado ao fim: `qemu: 0`) | 31 | 2560×1600 / 320 | `rocks.octavia.app` | 20.480 B (07/09 14:21) | **2** → **com sessão** | inexistente → **vazio** | 0 | — |
| Tab S6 `RX2N8000F3D` | **32** (Android 12) | 1600×2560 / **360** | 0.0.1, instalado 07/09 18:08, atualizado 18:58 | 20.480 B | **0** → **sem sessão** | inexistente | 0 | `user_rotation=0`, `accelerometer_rotation=1` |

Ambos batem com N0-ENCERRAMENTO §11. Bateria do Tab S6: 100 %, USB.

### A2 — O que existe em `apps/native` e `packages/core` (N0-D11: fica/sai; N1-D7)

| Arquivo | l. | Para quê | Destino |
|---|---|---|---|
| `apps/native/app.json` | 14 | name/slug/version 0.0.1, `android.package rocks.octavia.app`, plugins `@config-plugins/react-native-{blob-util,pdf}`; **sem `orientation`** (o manifest gerado só tem `configChanges` com `orientation`) | fica (ganha `orientation: "default"` — N1-D12, plugin `expo-font` — N1-D6, ícone/splash) |
| `package.json` | 33 | deps exatas: expo ~57.0.20 (57.0.20 instalado), expo-dev-client ~57.0.18, expo-file-system ~57.0.6, expo-status-bar ~57.0.1, firebase 12.18.0, react 19.2.3, react-native 0.86.3, async-storage 2.2.0, react-native-pdf 7.0.5, react-native-blob-util 0.24.10, config-plugins 14.0.2, `@octavia/core workspace:*`; dev: @types/react ~19.2.2, react-dom 19.2.3, typescript ~6.0.3; scripts start/android/ios/web/type-check | fica |
| `App.tsx` | 98 | prova N0: login email/senha, `onAuthStateChanged`, `getSetlists`, botões PDF/limpar/sair; logs `login-screen`, `auth uid= src=`, `setlists= src=api`, `sync-error` | **sai** (PR3) |
| `index.ts` | 8 | `registerRootComponent(App)` | fica |
| `tsconfig.json` | 6 | `extends expo/tsconfig.base`, strict | fica |
| `.env.example` / `.env` (gitignored) | 7/7 | 6 chaves `EXPO_PUBLIC_FIREBASE_*` + `EXPO_PUBLIC_API_BASE_URL` (só nomes) | fica (ganha `EXPO_PUBLIC_DEV_FORGE_401` — E4) |
| `src/PdfProbe.tsx` | 78 | `react-native-pdf` do disco + placeholder "Arquivo não baixado"; logs `pdf-render pages=`, `pdf-page n=`, `pdf-placeholder`, `download-error` | **sai** (padrão migra para S3e) |
| `src/api.ts` | 30 | `createAuthFetch` do core + fetch do RN; `onAuthFailure` → `signOut`; log `api status= path= n=` | **sai** |
| `src/files.ts` | 44 | `Paths.cache/files/<último segmento da URL>`, `File.downloadFileAsync`; logs `file src=disk\|download name= bytes=`, `files-cleared` | **sai** (renasce com `Paths.document` + LRU) |
| `src/firebase.ts` | 42 | `initializeAuth` + `getReactNativePersistence(AsyncStorage)` idempotente; cast tipado por causa do `exports` do `@firebase/auth` (div. 23 do N0) | **fica** (N1-D7, exceção à N0-D11) |
| `src/log.ts` | 4 | `console.log('OCTAVIA: ' + msg)` | **sai** (renasce com o catálogo de `LOGS-OCTAVIA.md`) |
| `packages/core/src/normalize.ts` | 14 | `normalizeForSearch` — **cobre T1-R21** inteiro; 4 testes | fica |
| `packages/core/src/auth-fetch.ts` | 66 | `createAuthFetch` — **cobre T1-R1** (header literal), **T1-R3** (401 → refresh 1× → 2ª request 1× → `onAuthFailure`, nunca 3ª), **T1-R12** (`cache:'no-store'`); 5 testes. **Não cobre** T1-R2 (buffer < 5 min — quem decide hoje é o SDK) nem T1-R4 (429/`Retry-After`) | fica |
| `packages/core/src/isolation.test.ts` | 22 | gate do projeto `core` do Vitest | fica |
| `packages/core/{package,tsconfig}.json`, `src/index.ts` | 8/15/2 | `@octavia/core` ESM, `main: src/index.ts`, `lib ES2022` sem DOM, `noUncheckedIndexedAccess` | fica |
| `scripts/native-env.sh` | 10 | ANDROID_HOME, PATH, JAVA_HOME (corretto 17), `ADB_LOCAL_TRANSPORT_MAX_PORT=5555` | fica |
| Local (gitignored) | — | `apps/native/android/` 925 MB (prebuild de 07/09 14:15; `app-debug.apk` 68.865.216 B); `.expo/` | — |

`native.yml` (59 l.): gatilhos `pull_request`/`push main` com `paths` (`apps/native/**`, `packages/core/**`, o yml, lock, workspace); passos Install → Type-check apps/native → Prebuild → Gradle assembleDebug → artefato 7 dias. Runs (`gh run list --workflow=native.yml`): #277 PR **12m29s** (1ª tentativa; zip do NDK), push main **7m23s** (Install 15 s · Type-check 1 s · Prebuild 2 s · **Gradle 5m49s** · upload 6 s); N0-PR5 8m07s / 7m09s; N0-PR4 7m02s / 4m48s; N0-PR3 5m24s / 6m50s.

### A3 — Contratos que a tela 1 consome, na forma real

Script `A3-probe-n1.mts.txt` (anexo); saída em `A3-probe-prod.txt`. Conta de audit; **3 requests**:

```
signInWithPassword status= 200   uid= Pw3bxXZw0iT3WwyL7kxGtGJIJH83
[setlists]     GET /api/setlists → 200  2305 ms  bytes=49983  cache-control: private, no-store · content-type: application/json · x-vercel-cache: BYPASS   (sem content-length, sem x-ratelimit-*)
[content-100]  GET /api/content?pageSize=100&page=1&sortBy=recent → 200  1701 ms  bytes=52941  (mesmos headers)
[content-1000] GET /api/content?pageSize=1000&page=1 → 200  333 ms  bytes=52941  → pageSize=100 no envelope; corpo BYTE A BYTE igual ao de pageSize=100 (`cmp`)
```

**`GET /api/setlists`** (agora documentado em [`SETLISTS.md`](../api/SETLISTS.md) — div. 1): raiz **array[3]**. Setlist: `id, user_id, name, description:null, performance_date:null, venue:null, notes:null, is_public:boolean, created_at, updated_at, setlist_songs[]`. Item: `id, setlist_id, content_id, position:number, notes:string|null, content{id,title,artist,content_type,key,bpm,file_url,content_data}`. 60 / 8 / 1 songs, `position` contígua 1..N nas três, `performance_date: null` nas três, `updated_at` `2026-08-29T19:43:10.287+00:00`, ordem `created_at desc`. 69 songs, **60 `content_id` distintos** (9 bis), `notes` não-nulo em **15**, 69/69 `content_id` existem em `/api/content`, embutido == canônico (title/content_data/file_url) em 69/69; JSON dos objetos `content` embutidos = **34.634 B** (div. 7).

**`GET /api/content`**: `{ data: content.Row[], total: 66, page: 1, pageSize: 100, hasMore: false, totalPages: 1 }`. Row (22 colunas): `id, user_id, title, artist, album, genre, content_type, key, bpm, time_signature, difficulty, capo, tuning, tags, notes, content_data, file_url, thumbnail_url, is_favorite, is_public, created_at, updated_at`; `updated_at` em 66/66; 66 ids únicos; 0 `content_type` fora do enum. `pageSize` **clampado a [1,100]** no handler (`app/api/content/route.ts:119`) e schema `z.string().regex(/^\d+$/)…default('20')` (`lib/api-schemas.ts:205`) — provado em prod. Ordem `sortBy=recent` → `created_at desc` + `id asc` (`:113-115`, B7-PR4).

**`content_data` por tipo** (audit, 66): Lyrics 38 → `lyrics` 38/38; Chords 18 → `chords` 15, `null` 3 (= os 3 com `file_url`), `annotations` (array de 1) em 1; Tab 8 → `tablature` 8/8; Sheet 2 → `null` 2/2, `file_url` 2/2. Tipo do topo: Lyrics/Tab só `object`; Chords `null|object`; Sheet só `null`. Inválidos T1-R7(b) na audit **0**; Chords objeto sem `chords` 0. Corpo máximo (bytes UTF-8): Lyrics 307 · Chords 291 · Tab 353; soma 18.043 B; **512 linhas, máx 58 colunas** (div. 6). `file_url`: 5 (4 objetos distintos — `…fase-d-offline.pdf` em 2 content), `https://<host>.supabase.co/storage/v1/object/public/content-files/<timestamp>-<nome>.pdf` (N0-H16: 265.002 B; `HEAD` → `cache-control: no-cache`, `GET` → `public, max-age=3600`). Tabela inteira por perfil: §0.

**Erros** (`CONTRATO-DE-ERRO.md`): `401 {"error":"Authentication required","code":"AUTH_REQUIRED"}` + `WWW-Authenticate: Bearer`; `404 {"error":"Setlist not found","code":"NOT_FOUND"}`; `429 {"error":"Rate limit exceeded","code":"RATE_LIMITED","retryAfter":868}` + `Retry-After` (segundos inteiros; `lib/user-rate-limit.ts:126,134`) e `X-RateLimit-{Limit,Remaining,Reset,Scope}`; 405 vazio, 404 de rota inexistente = HTML, 413 text/plain → "não-2xx cujo corpo não parseia = erro genérico, sem retry". Cadeia A: 401 byte-idêntico para "sem token", "inválido" e "IP em deny-fast" (`AUTH.md` §2).

**Errata do PRD §4 — aplicada nesta PR** (linha do PRD × o que afirmava × medido):

| Linha | Afirmava | D5 / medido | Errata aplicada |
|---|---|---|---|
| 86 | `z.record(jsonValueSchema).nullish()` | B7-PR5 `checkContentData` | escrita tipada-passthrough (D5, D5b, D5c); §4 = contrato de leitura |
| 88 | "Inventário real" | só a conta de audit; tabela inteira 194 linhas / 3 `user_id` | título "da conta de audit" + ponteiro para D5 e §0 |
| 93 | Chords máx. 465 B | 291 B | os dois números + nota N7 |
| 95 | Sheet `null` sempre | D5: `file` em 3, `annotations` em 1 (de 7) | "null (audit); objeto com `file`/`annotations` — ignorados" |
| 96 | `annotations` em 1 | D5: Chords 4, Lyrics 14, Sheet 1 | contagem da tabela inteira |
| 98 | `sections`/`file` não existem | D5: `sections` em 4 Chords, `file` em 3 Sheet | "na tabela inteira existem; regra (a) ignora" |
| 105 | Chords `chords` ou `file_url` | objeto sem `chords`: 2 (inteira), 0 (principal) | regra (c) citada na linha |
| 109 | inválidos sem contagem | principal 0; `6b2da77b…` 9 (+2) | contagem por perfil (SQL do Marcel) |
| 110 | aceite só com a audit | principal 63/63 válidos | aceite com a principal + fixture (N1-D10) |
| 53 / 142 / 262 / 308 | `public, max-age=0, must-revalidate` | `private, no-store` | errata + H13 fechada + item §11 fechado |
| 29 / 123 / N7 | 19.481 B, 21.423 B | 18.043 B, 34.634 B | nota N7 (método) |

### A4 — Mapa PRD → tela → aceite → medição → lib

"Design" = tela onde o ID aparece; "—" = sem tela (E2), com a tela onde o comportamento se manifesta entre parênteses. Linhas de log = [`LOGS-OCTAVIA.md`](LOGS-OCTAVIA.md).

| T1-R | Design | Aceite | Como se mede | Depende de |
|---|---|---|---|---|
| R1 transporte bearer | — (todas) | A1 | core: `createAuthFetch` (existe); device: `api status=… n=1` + contador de requests | core |
| R2 renovação < 5 min | — | (A1) | core: `shouldRefresh(exp, now)` novo; device: `auth refresh=forced` com relógio avançado | firebase |
| R3 401 sem loop | — | A2 | core: 4 testes existentes; device: caminho de dev E4 → `api status=401 n=2` + `auth-failure` | core |
| R4 429 `Retry-After` | — (S1e) | A3 | core: `retryAfterFrom(headers, body)` + `rateLimitGate`; device: servidor local com `Retry-After: 30` | core |
| R5 email verificado | — | — | registro, sem aceite | — |
| R6 login | **S0** | A1 | `auth uid= src=login`; senha manual | firebase |
| R7 contrato por tipo | — (**S3f**, S3a–d) | A6 | core: `isValidContent`, `bodyOf`; device: fixture → S3f + `placeholder kind=invalid` | core |
| R8 fonte única | — (S3) | A7 | core: `resolveSong(song, contentById)` | core |
| R9 substituição sem merge | — (S1) | A7, A21 | core: `planSync` → `apply\|keep-previous`; device: mock 500 pág. 2 → `sync fail stage=content page=2`, cache inalterado (sha) | core + store |
| R9b dedupe / `sortBy=recent` | — | A22 | core: `mergePages`; device: URL com `sortBy=recent` no log `api path=` | core |
| R10 `updated_at` | — | (A7) | core: `diffByUpdatedAt` → `cache write … invalidated=0` | core |
| R11 `content_id` ausente | **S2** | A8 | core: `labelFor(song, contentById, syncDone)`; screencap S2 | core |
| R12 sem cache HTTP | — | (A4) | core: teste existente; device: 2 aberturas → 2 `api status=200` (N0-H11 fecha na PR3) | core |
| R13 abertura cache-first | **S1a/b/c/f** | A4, A5 | `sync start` → `sync ok … t=<ms>`; screencap S1a antes do 1º 200 | store + rede |
| R14 arquivos/LRU | — (S3d/e) | A9 | core: `lruEvict`; device: `run-as` sha256 + `file src=disk` | expo-file-system |
| R15 prefetch 7 dias | **S1b/c** | A10 | core: `selectPrefetch`; device: fixture (N1-D10); real no aceite T (H17) | core |
| R16 sob demanda | — (S3e) | (A17) | core: `prefetchOrder`; `prefetch plan reason=demand` | core |
| R17 indicador ✓◔✗ | **S1b/c/e** | A10 | core: `offlineStatus`; screencap | core |
| R18 rede comunicada | **S1c/d/e, S3b/e** | A19 | avião + cache → chip; sem cache → S1d; `net offline` | expo-network (N1-D11) |
| R19 sessão offline | — (S1c) | A5 | reopen em avião → `auth src=restored` (N0-H15) | firebase |
| R20 índice local | **S4a/b** | A11 | core: `buildIndex` (title, artist, album, corpo) | core |
| R21 normalização | **S4a/b** | A11 | core: existente | core |
| R22 escopo / 1 tap / volta | **S3b/e, S4a** | A11 | core: `groupResults`; `search close restore n=/N` | navegação |
| R23 offline | **S4a/b** | A11 | avião + busca | — |
| R24 bis | **S2** | A12 | core: identidade por `setlist_songs.id`; "2 de N" e "7 de N" | core |
| R25 render por tipo | **S3a–f** | A6 | screencap dos 8 Tab (alinhamento = fonte mono) | fontes |
| R26 PDF/placeholder | **S3a–d** | A13 | avião + 12 páginas (N0); S3e | react-native-pdf |
| R27 bordas / landscape / rotação | **S3a–e** | A14 | `input tap` nas bordas; `user_rotation` 0↔1 (`accelerometer_rotation 0`); `nav n=/N`, `rotation=` | safe-area; N1-D12 |
| R28 n de N / índice ≤ 3 taps | **S3e/f, S2** | A14 | 1→47 em 3 taps; `index jump n=47` | navegação |
| R29 fim de setlist | **S5** | A14 | core: `endOfSetlist`; screencap S5, `pidof` vivo | core |
| R30 auto-scroll < 100 ms | **S3a–d, S3b'** | A15 | `autoscroll on t=<ms>`; S3d `autoscroll disabled kind=pdf` | risco C3 |
| R31 zoom sem re-quebra | **S3a–d, S3b'** | A15 | fixture de 120 colunas (div. 6) → screencap em 2 zooms; `zoom dp=` | risco C3 |
| R32 claro/escuro | **S3b, S3b'** | A15 | `theme=light\|dark` | — |
| R33 keep-awake | **S3b** | A16 | `dumpsys power \| grep -i wake` + 15 min (cronômetro do Marcel); `keepawake on` | expo-keep-awake (já linkado) |
| R34 troca < 100 ms / < 1 s | **S3b** | A17 | `nav n=/N t=<ms>` (p95 sobre 60) | — |
| R35 `notes` | **S2, S3a–f** | A18 | screencap (15 songs com notes na audit) | — |
| R36 pt-BR | **S0** | A20 | `grep` de literais + screencaps; 429 → texto de `RATE_LIMITED` | — |
| R37 toda falha aparece | — (**S1e**) | A19 | core: `errorFrom` (envelope × não-JSON × rede — normaliza `UnknownHostException` e `downloadFileAsync … rejected`); mock 500 | core |

Tela sem requisito: nenhuma (18 telas, todas com ≥ 1 ID). Requisito sem tela: os 15 da div. 4 — todos com aceite e medição.

### A5 — Bibliotecas que o PRD deixou fora (decididas em §0)

Versões `[medido]` por `npm view` e `expo/bundledNativeModules.json` do SDK 57; tamanhos = `dist.unpackedSize` `[hipótese para o APK]`; "nativo" = exige `prebuild` + Gradle (doc Expo: "Installing or updating a library containing native code" exige regenerar).

| Necessidade | Opção | Versão SDK 57 (latest) | Nativo? | Tamanho | Nota / decisão |
|---|---|---|---|---|---|
| Navegação | `@react-navigation/native` + `native-stack` | 7.3.18 + 7.18.10; peers `react-native-screens` 4.26.2, `react-native-safe-area-context` 5.7.0 | JS + 2 peers nativos | 293 + 262 KB + 3,6 MB + 245 KB | doc: "npx expo install react-native-screens react-native-safe-area-context" (reactnavigation.org/docs/getting-started) — **N1-D1** |
| | `expo-router` | ~57.0.19 (57.0.20) | JS + 10 peers (4 nativos: screens, safe-area, reanimated 4.5.1, gesture-handler 2.32.0) | 6,2 + 4,8 + 3,2 MB | doc Expo: "we recommend using Expo Router for all the features described above"; `expo-template-default` 57.0.23 já o traz — descartado (div. 14) |
| | máquina de estados própria | — | não | 0 | sem back nativo/gestos — descartado |
| Persistência | `expo-sqlite` | ~57.0.2 | **sim** | 78 MB npm (unpkg: `android/libsql` 32 MB, ios 15 MB, maven 17 MB, vendor 18 MB) | volume real: 66 itens / 52.941 B; 3 setlists — descartado |
| | JSON em `expo-file-system` + AsyncStorage | instalados | não | 0 | `Paths.document/<uid>/{setlists,content,files}.json` + índice em memória — **N1-D2** |
| Arquivos garantidos | `Paths.document` × `Paths.cache` | ~57.0.6 | não | 0 | N0-H16 §4 (N0 usou `Paths.cache`) |
| Fontes | `@expo-google-fonts/{raleway,manrope,ibm-plex-mono}` | 0.4.2 / 0.4.2 / 0.4.1 | não (só .ttf) | tgz 3,45 / 0,97 / 2,13 MB; **ttf usados** Raleway 500 163.852 + 600 163.856 · Manrope 400 96.832 + 600 96.936 · IBM Plex Mono 400 133.796 + 600 138.448 = **793.720 B** | `expo-font` ~57.0.3 **já autolinkado**; doc: plugin em build ("Fonts are available immediately when the app starts") × `useFonts` — **N1-D6 plugin** |
| Keep-awake (R33) | `expo-keep-awake` | 57.0.1 | **já autolinkado** (dep de `expo`) | 61 KB | `useKeepAwake()` |
| Rede (R18) | `expo-network` | 57.0.1 | sim | 109 KB | `useNetworkState()`; permissões automáticas — **N1-D11** |
| | `@react-native-community/netinfo` | 12.0.1 | sim | 516 KB | descartado |
| Orientação (R27) | `expo-screen-orientation` | 57.0.2 | sim | 216 KB | **não entra** (N1-D12: `orientation: "default"` no `app.json`, sem lock) |
| Safe area | `react-native-safe-area-context` | 5.7.0 | sim | 245 KB | ausente hoje (template blank do N0); vem com N1-D1 |
| PDF | `react-native-pdf` 7.0.5 + blob-util (N0-D2) | instalado | — | — | decidido no N0 |
| Testes RN | `jest-expo` 57.0.5 (+ `@testing-library/react-native` 14.0.1) | — | não | 141 KB | ver B2 — não entra |

Já autolinkados no dev client atual (`pnpm exec expo-modules-autolinking resolve -p android --json` → 17 módulos): `expo`, expo-asset, expo-constants, expo-dev-client/-launcher/-menu/-menu-interface, expo-file-system, **expo-font**, **expo-keep-awake**, expo-status-bar, `@expo/log-box`, `@expo/dom-webview`, expo-json-utils, expo-manifests, expo-modules-core, expo-updates-interface. Autolinking do RN (`autolinking.json`): async-storage, blob-util, pdf. **Rebuild do dev client na PR3**: screens, safe-area-context, expo-network (+ plugin `expo-font`).

### A6 — Catálogo de linhas `OCTAVIA:`

Fechado como contrato em [`LOGS-OCTAVIA.md`](LOGS-OCTAVIA.md) (N1-D5 + E3). Resumo: `auth uid= src=` · `login-screen` · `auth refresh=` · `auth-failure` · `api status= path= n= ms=` · `ratelimit retry-after= family=` · `sync start` · `sync ok setlists= content= pages= t=` · `sync fail stage= page= code= status=` · `sync skip reason=offline` · `cache hit|miss|write kind= n= invalidated=` · `prefetch plan n= reason=` · `file src= name= bytes=` · `lru evict n= bytes=` · `nav n=/N setlist= t=` · `end-of-setlist n=` · `index open|jump n=` · `search q=<len> n= in-setlist=` · `search close restore n=/N` · `zoom dp=` · `theme=` · `autoscroll on|off t=` · `autoscroll disabled kind=pdf` · `placeholder kind= name=` · `net online|offline` · `rotation= n=/N` · `keepawake on|off` · `pdf-render|pdf-page|pdf-error`. Nunca: token, email, senha, corpo, termo de busca literal, URL completa.

---

## 3. Fase B — Aparato do N1 `[medido]`

**B1 — Camada 1 (core, funções puras; aceite que cada uma prova)**: `isValidContent(type, data, file_url)` + `bodyOf(type, data)` → A6 (T1-R7 a–d); `resolveSong(song, contentById)` → A7 (R8); `planSync({prevContent, pages})` → A7/A21 (R9: `keep-previous` se qualquer página falhar) e `mergePages(pages)` → A22 (R9b dedupe/total); `diffByUpdatedAt` → invalidações = 0 (R10); `labelFor(song, contentById, syncDone)` → A8 (R11); `selectPrefetch(setlists, contents, files, today)` → A10 (R15, date-only, hoje..hoje+7, prioridade pela data); `prefetchOrder(pos, songs)` → R16; `offlineStatus(setlist, contents, files)` → A10 (R17 ✓/◔ "n de m"/✗); `lruEvict(files, capBytes, protectedUrls)` → A9/A10 (R14); `nextPosition`/`prevPosition`/`endOfSetlist(pos, N)` → A12/A14 (R24/R27/R29; identidade por `setlist_songs.id`); `buildIndex`/`searchIndex`/`groupResults` → A11 (R20/R22); `shouldRefresh(exp, now, 300)` → R2; `retryAfterFrom(headers, body)` + `rateLimitGate(family, until)` → A3 (R4); `errorFrom(status, bodyText, networkErr)` → A19 (R37; `code` → chave pt-BR; normaliza as duas strings de rede do N0). Regras vigentes: zero react/react-native/firebase, `lib ES2022`, `noUncheckedIndexedAccess`, projeto `core` do Vitest, `it.fails` → `it` por PR.

**B2 — Camada 2 (CI)**: `native.yml` como está. Não há `jest` no repo (`ls node_modules/.bin | grep jest` → vazio; 1 menção em `package.json`); o Vitest exclui `apps/**`. Tudo do B1 é testável no core; o que ficaria fora (hooks/componentes) é UI fina → **sem `jest-expo` no N1**; o `ci.yml` coleta os testes novos do core automaticamente (`packages/core/**/*.test.ts`).

**B3 — Camada 3 (Maestro) — N1-D3: não instala**. `which maestro` → not found; release `cli-2.10.0` (2026-08-31, `gh api repos/mobile-dev-inc/maestro/releases/latest`). Doc (docs.maestro.dev): instalação "curl -fsSL https://get.maestro.mobile.dev | bash" ou `brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro`, "Java version 17 or higher"; quickstart: "supports API Levels 29, 30, 31, 33, and 34. API 35 and 36 … Q2 2026" (**32 ausente**, div. 5); android.md: "automatically detects and connects to running emulators or physical devices"; react-native.md: "Full compatibility with Expo Go, development builds, and EAS Workflows", "best practice is to use the `testID` property". Cobertura estimada `[hipótese]` de um flow YAML sobre os 22 aceites: cobre ≈ 8 (A6 parcial, A8, A11, A12, A14 sem rotação, A15 sem tempo, A18, A20); não cobre ≈ 14 (avião/adb/`run-as`/mocks/tempo). Senha só manual (div. 24 do N0).

**B4 — Camada 4 (device): protocolo por aceite** (`E` = emulador `octavia_tab32`; `T` = Tab S6; `adb`: `cmd connectivity airplane-mode`, `am force-stop`, `pm clear`, `logcat -d -s ReactNativeJS | grep OCTAVIA:`, `screencap`, `run-as`, `settings put system user_rotation`):

| Aceite | Exige | Instrumento | Device |
|---|---|---|---|
| A1 | login manual | `api status= n=1` + contador de requests no log | E; final T + principal |
| A2 | 401 forjado — **caminho de dev** (E4): `__DEV__` + `EXPO_PUBLIC_DEV_FORGE_401=1`, nunca em release | `api status=401 n=2` + `auth-failure`, sem 3ª | E |
| A3 | 429 mock | `python3 -m http.server` em scratch com `Retry-After: 30` + `adb reverse` | E |
| A4 | online | `sync ok pages=1 t=`; 2 `api status=200` | E, T |
| A5 | **avião** + `force-stop` + reopen | `auth src=restored`, sem `login-screen`; setlist de 60 | E, **T** |
| A6–A8 | fixtures no cache (build de dev) | screencap S3f/S2 + `placeholder kind=` | E |
| A9 | `run-as` sha256 | igual N0 | E, **T** |
| A10 | fixture (N1-D10) | `prefetch plan reason=7d`; indicador | E; real no aceite T (H17) |
| A11 | busca; avião | `search q= n=`, `search close restore` | E |
| A12–A14 | `input tap` nas bordas; rotação (`user_rotation` 0↔1 com `accelerometer_rotation 0`); salto 1→47 | screencap + `nav`, `rotation=` | E, **T** (rotação real) |
| A15 | `autoscroll on t=`, `zoom dp=`, `theme=` | logcat | E, T |
| A16 | **15 min** sem toque | `dumpsys power \| grep -i wake` + cronômetro do Marcel | **T** |
| A17 | 60 × `nav t=` p95 | logcat | **T** |
| A18–A20 | screencaps; grep de literais | — | E |
| A21–A22 | mock 500 pág. 2 / páginas com id repetido | core + fixture local | E |

Mínimo no Tab S6: A5, A9, A13, A14 (rotação), A16, A17 e o aceite final completo com a conta principal (login do Marcel).

**B5 — AVD API 32 (N1-D4; executa na PR3)**:

```bash
source scripts/native-env.sh && avdmanager create avd -n octavia_tab32 -k "system-images;android-32;google_apis;arm64-v8a" -d pixel_tablet
# depois: hw.lcd.density=360 em ~/.android/avd/octavia_tab32.avd/config.ini (hipótese: aceito; se não, 320 e declara)
```

Imagem v8 já instalada (4,2 GB em `system-images/android-32`); `pixel_tablet` = 2560×1600 @ 320 (= `octavia_tab`, `config.ini`); com 360 → 1138×711 dp como o Tab S6 (div. 3). ~2,5 GB em disco; **sem download**.

**B6 — Orçamento de prod do N1 inteiro (N1-D8)**: logins (senha manual do Marcel) ≤ **8**; `setlist-read` + `content-read` = **2 por abertura online** (T1-R13) → teto **60 aberturas** (120 requests) no bloco, registrados por PR; bucket ≤ **10** downloads (4 objetos distintos da audit); `HEAD` 0; 401 **≤ 4** (A2, forjado, 2 por rodada); 429 **0 real** (só mock); escrita **0** (A10 por fixture — N1-D10; o item de 120 colunas é decisão da PR4). Conta principal: **só no aceite T**, login do Marcel: 1 login + 2 requests por abertura (≤ 5 aberturas) + download do **1** `file_url` real (tamanho pendente — H16 principal).

---

## 4. Fase C — Recorte, riscos (N1-D9)

**C1 — PRs**:

| PR | Escopo | Requisitos | Aceites | Controle negativo |
|---|---|---|---|---|
| **N1-PR1** (esta) | este doc + anexos; errata PRD §4/§2; errata do design (E1/E2); `LOGS-OCTAVIA.md`; `GET /api/setlists` no `SETLISTS.md`; PLANO item 9 | — | — | — |
| N1-PR2 core | funções de B1, TDD (`it.fails` → `it`), sem RN | R2, R4, R7–R11, R9b, R14–R17, R20, R22, R24, R29, R37 | A6–A8, A10 (lógica), A21, A22 | testes vermelhos no 1º commit |
| N1-PR3 esqueleto | apaga a UI do N0 (N1-D7); tokens/fontes (plugin)/`orientation: default`/safe-area; native-stack; S0 + S1 (6 estados); store JSON + sync (2 requests); `expo-network`; AVD 32 (B5); catálogo de logs | R1, R3, R6, R12, R13, R18, R19, R36 | A1, A4, A5 (lista), A19 | `pm clear` + avião → S1d; N0-H11 (2 requests reais) |
| N1-PR4 S2 + S3 texto | **spike C3 no 1º commit**; índice; palco Lyrics/Chords/Tab; bordas; n de N; zoom; claro/escuro; keep-awake; rotação preserva posição; notes; fixture de 120 colunas | R24–R25, R27–R28, R30–R35 | A12, A14, A15, A16 (E), A17 (texto), A18 | `Text` sem `ScrollView` horizontal re-quebra (screencap antes) |
| N1-PR5 S3 PDF + arquivos | `Paths.document`, LRU 200 MB, prefetch 7 d + sob demanda, S3e/S3f, indicador ✓◔✗ | R14–R17, R26, R7(b) | A9, A10, A13, A17 (PDF) | cache apagado + avião → S3e sem crash |
| N1-PR6 S4 + S5 | busca (índice, agrupamento, restauração), fim de setlist | R20–R23, R29 | A11 | "xablau" → S4b |
| N1-PR7 aceite E | A1–A22 no `octavia_tab32` com os protocolos B4; A2/A3 com mocks | — | A1–A22 | `pm clear` |
| Aceite T + ENC | Tab S6, conta principal (login do Marcel): A5/A9/A13/A14/A16/A17 + 63 itens reais; encerramento | — | — | — |

**C2 — Decisões**: fechadas em §0 (N1-D1…D12).

**C3 — Riscos nomeados e a prova mais barata** (spike = 1º commit da PR4, descartável, no dev client atual — Metro serve qualquer bundle; sem módulo nativo novo): (1) **auto-scroll suave** (R30, < 100 ms, 60 fps): `ScrollView.scrollTo` por `requestAnimationFrame` compete com a thread JS; alternativa `Animated` (reanimated é peer nativo, fora por N1-D1). Prova: Lyrics de 300 linhas, `scrollTo` por rAF em 1 dp/frame, `autoscroll on t=` e janky frames por `adb shell dumpsys gfxinfo rocks.octavia.app` no AVD e no Tab S6; controle: 0 rAF. (2) **linhas longas sem re-quebra** (R25/R31): `Text` do RN quebra por padrão; solução = `ScrollView` vertical → `ScrollView horizontal` → um `Text` mono com `lineHeight` fixo (largura = linha mais longa); risco = zoom por `fontSize` reflui a largura e o scroll horizontal "pula". Prova: fixture de 120 colunas em 18/22/40 dp, screencap de cada; controle negativo: sem o horizontal → quebra.

---

## 5. Emendas do revisor ao pre-check (2026-09-10)

- **E1** (div. 3 e 12) → errata do design, seção "Errata" do [`README.md`](DESIGN-TELA-1/README.md): canvas 1280×800 dp = AVD `pixel_tablet` @ 320; Tab S6 = 1138×711 dp (density 360); tokens e proporções valem, layouts fluidos, aceite no device; Raleway 500 e 600.
- **E2** (div. 4) → esclarecimento no README: "todas as telas com IDs"; os 15 IDs sem tela são não-visuais (mapa A4).
- **E3** → `sync ok … t=<ms>` no catálogo (`LOGS-OCTAVIA.md`).
- **E4** → o 401 forjado (A2) é caminho de dev: `__DEV__` + `EXPO_PUBLIC_DEV_FORGE_401=1`, nunca em release (`LOGS-OCTAVIA.md`, B4).
- **E5** — lição do revisor: "3 das 15 foram premissas do prompt; a pior foi atribuir à conta principal uma tabela que eu mesmo rotulei como 'todos os perfis'". Com a leitura por `user_id` a premissa virou a div. 16: a principal tem **0** inválidos.

## 6. Lições do pre-check

- **(a) Rotular a população de cada número** — "~11 inválidos" era verdadeiro para a tabela e falso para a conta que o PRD chama de principal; a query por `user_id` custou uma leitura e mudou o aceite A6.
- **(b) O aparato de leitura também se mede antes** (div. 9, 10, 11): PDF sem ferramenta, HTML que exige JS, aspas engolidas pelo shell local, `tsx` sem top-level await — nenhum custou prod, todos custariam se tivessem passado como "medido".
- **(c) O que a doc de terceiros não lista é tão importante quanto o que lista** (div. 5: API 32 ausente na doc do Maestro).
- **(d) Densidade é dado do device, não do design** (div. 3): 1280×800 dp era o AVD; o tablet real tem 11 % menos largura em dp.
- **(e) Autolinking é inventário, não suposição** (div. 13): quatro módulos "novos" já estavam no dev client.

## 7. Hipóteses remanescentes

| # | Hipótese | Fecha em |
|---|---|---|
| N1-h1 | `xVDJ…` é a conta principal (63 content = H14) | confirmação do Marcel (uid no console do Firebase) |
| N1-h2 | `hw.lcd.density=360` aceito pelo emulador no `pixel_tablet` | PR3 (N1-D4) |
| N1-h3 | N0-H11: `cache: 'no-store'` no `fetch` do RN é no-op; T1-R12 provado por 2 requests reais | PR3 |
| N1-h4 | auto-scroll por rAF sem jank a 60 fps no Tab S6 | PR4 (spike) |
| N1-h5 | `ScrollView` horizontal + `Text` mono mantém a linha de 120 colunas em 40 dp | PR4 (spike) |
| N1-h6 | tamanhos dos APK/módulos (A5) | PR3 (APK antes/depois no `native.yml`) |
| H16 principal | tamanho do único `file_url` da principal | dashboard (Marcel) |

## 8. Estado ao fim do pre-check

- Repo: `origin/main` `138bf1a`; esta PR = branch `n1/pr1-precheck-errata`, docs-only (o `native.yml` não dispara).
- Devices: `octavia_tab` (API 31) com sessão da audit e cache vazio, encerrado; Tab S6 sem sessão, cache vazio, avião 0, `adb reverse` não criado; SDK antes = depois.
- Scratch: `~/tmp/octavia-n1-scratch/fonts/` (3 tgz do `npm pack`, 6,5 MB — pode apagar); scratchpad da sessão com os JSON de prod (não versionados).
- Servidor `python3 -m http.server 8765` encerrado (0 processos).

## 9. Contabilidade e anexos

**Prod (conta de audit, 2026-09-09)**: `signInWithPassword` **1** · `setlist-read` **1** · `content-read` **2** · `/api/auth/session` 0 · 401/429 0 · escrita 0 · bucket 0 · `HEAD` 0 → **3 de 6**. Prova de zero escrita: `total: 66`, 3 setlists, 69 songs (idênticos à referência). Leituras do Marcel no console: 2 (§0).

| Anexo | Conteúdo | `wc -l` | sha256 |
|---|---|---|---|
| `A1-sdkmanager-antes.txt` | inventário do SDK antes | 29 | `f050d0d47d3d04189f22abc694700bd578e6c3be95aae30d14f7a90984c56766` |
| `A1-sdkmanager-depois.txt` | idem depois (diff vazio) | 29 | `526cd0396df5786de92d0dc90414bab726a51825c0fb437aad368df18210a115` |
| `A1-pnpm-test.txt` | baseline 685/85 por projeto | 1191 | `bb5a30d538d519999e2fb6e6218fa0142735a21e7a873444fc83971f10d511f7` |
| `A1-emulator-boot.log.txt` | boot headless do `octavia_tab` | 205 | `6d263be1da22852dd5632e0bbe0216844f2b56c62d11aa92dc13a2b07ee87716` |
| `A3-probe-prod.txt` | saída das 3 requests (estrutura, sem corpo) | 29 | `1d72bee28756c594599445093cdf883adc34245b1fa229f2e6721725e069ce23` |
| `A3-probe-n1.mts.txt` | o script das 3 requests | 76 | `ebef2e5d8b5cb596d3f6d3717a320273829a643864e73ac72aaf2aed1953ca23` |

`grep -rn eyJ docs/native/N1-PRECHECK-anexos` → exit 1; `grep -rln uxtester …` → exit 1. Os corpos JSON de prod (`setlists.json` 49.983 B, `content-100.json` 52.941 B) **não** são anexos (contêm corpo de música).
