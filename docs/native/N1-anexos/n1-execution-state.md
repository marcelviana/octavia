<!-- RASTRO DE SESSÃO, NÃO FONTE. Cópia bruta de ~/.claude/projects/.../memory/n1-execution-state.md
     no fim do N1 (2026-09-11), preservada como anexo pela decisão de processo do §11 do encerramento.
     A FONTE do bloco é docs/native/N1-ENCERRAMENTO.md; onde os dois divergirem, o encerramento vence. -->

---
name: n1-execution-state
description: "Bloco N1 — PR1…PR7 mergeadas (main c2fa635); N1-PR8 = PR #290 (n1/pr8-correcoes, d83d94f) aguardando merge; depois dela, ENCERRAMENTO do N1"
metadata: 
  node_type: memory
  type: project
  originSessionId: f41f79d2-a1ff-4506-a9bc-6ff004006745
  modified: 2026-09-10T13:50:01.028Z
---

Estado das PRs do N1 (ordem N1-D9: PR1 → PR2 → PR3 → PR4 spike → PR5 → PR6 → PR7 → aceite T):

- **N1-PR1** (docs) — PR #281 **mergeada** 2026-09-10, merge `d629762`: `N1-PRECHECK.md` +
  6 anexos, errata do PRD §4 e do design, `LOGS-OCTAVIA.md`, `GET /api/setlists` no
  `SETLISTS.md`, PLANO item 9.
- **N1-PR2 dividida** em 2a (contrato/token/rate-limit/erros) e **2b** (sync, cache,
  navegação, busca — `planSync`, `mergePages`, `resolveSong`, `diffByUpdatedAt`,
  `labelFor`, `selectPrefetch`, `prefetchOrder`, `offlineStatus`, `lruEvict`,
  `nextPosition`/`endOfSetlist`, `buildIndex`/`searchIndex`/`groupResults`).
- **N1-PR2a** — PR #282 **mergeada** (merge `1816472`): 2 commits `8bf69a4` + `fe5f58b`;
  723/85 (808) · 83/4 (87).
- **N1-PR2b** — PR #283 **mergeada** (merge `db89e82`): 761/85 (846) · 88/4 (92); fecha a
  camada 1 do §B1.
- **N1-D16**: a PR3 virou **3a** (fundação + S0) e **3b** (store JSON, sync, S1 nos seis
  estados, `expo-network`, N0-H11).
- **N1-PR3a** — PR #284 **mergeada** (merge `6f30f02`, 2026-09-10T16:00Z).
- **N1-PR3b** — PR #285 **mergeada** (merge `5d5cf1d`): store/sync/S1; **N0-H11 fechada**.
- **N1-PR4** — PR #286 (`n1/pr4-palco-texto`), 2 commits: `80f039a` (spike do C3) e
  `fc079bd` (S2 índice + S3 texto + S5). Riscos C3 fechados: auto-scroll por rAF
  (`t=38` no spike, `t=61` no palco; 0% janky moderna) e linha de 120 colunas em
  `ScrollView` horizontal (sem ele re-quebra). A17 **p95 = 97 ms** em 59 navegações.
  Suíte intocada. **Mergeada** (merge `23c00d2`).
- **N1-PR5** — PR #287 (`n1/pr5-pdf-arquivos`), commit único `b1090a5`: `files.ts` +
  `prefetch.ts` novos, S3d/S3e no palco, ✓◔✗ com arquivos reais, "baixar esta setlist"
  funcional. A9 (sha256 `ad2eae09…` do disco do app), A13 (12 páginas em avião), A10 por
  fixture, T1-R17 e LRU com cap injetado — todos com controle negativo. Suíte intocada.
  Checks verdes (`android-debug-apk` 11m45s, `build` 2m54s, Vercel pass). **Mergeada**
  (merge `dc261df`).
- **N1-PR6** — PR #288 (`n1/pr6-busca`), commit único `898d07f`: `SearchScreen.tsx` (S4a/S4b),
  `album` no `ContentDTO` e no índice (divergência 1 da PR2b **fechada**; força de campo
  título > artista > álbum > corpo), `fitPolicy={2}` no PDF, modo **avulso** no palco,
  os três botões de busca ligados. Suíte **761 → 764** (3 testes de álbum, 3 controles
  negativos). A11 online/offline, T1-R21/R22/R23 e o fitPolicy provados no emulador.
  Checks verdes (`android-debug-apk` 10m15s, `build` 2m31s, Vercel pass). **Mergeada**
  (merge `568db1e`).
- **N1-PR7** — PR #289 (`n1/pr7-aceite`), commit `f43f81a`: aceite A1–A22 no emulador
  (21/22 passam; A16 é do Tab S6) + aceite no Tab S6. Código mínimo: `stage restore`
  (N1-D17), 401 forjado do A2 (E4), `src/fixtures/aceite.py`. **Mergeada** (merge `c2fa635`).
- **N1-PR8** — PR #290 (`n1/pr8-correcoes`), commit `d83d94f`: as seis correções do aceite
  (D-a…D-g). Suíte **764 → 768** (`promoteList` no core). Checks verdes
  (`android-debug-apk` 11m35s, `build` 3m1s, Vercel pass). **Aguarda merge.**

**AS SEIS CORREÇÕES DA PR8 — todas provadas com controle negativo:**
- **D-a** (a mais séria): arquivo sob demanda que entra na janela de 7 dias agora é MOVIDO
  para `Paths.document`. Provado no Tab S6 com a principal: 4 `ls` + o do controle
  negativo, `prefetch promote n=1`, `src=disk`, `grep -c src=download` → 0, sha256
  `1e1d77c4…` igual, e idempotente. **Fecha a H16 da principal: o único arquivo tem
  138.916 B** (pendente desde o N0).
- **D-b** 429 → "servidor ocupado · tente em instantes"; 500 → "falha no servidor".
  As SETE chaves reais do `errorFrom` (o prompt pedia duas que o core não emite).
- **D-c** `rotation=` implementada; **D-d** `page=<p>` real; **D-f** `fitPolicy={0}`;
  **D-g** `native.yml` sem `packages/core/**` e `pnpm-lock.yaml`.
- **RESSALVA do A21 (PR7)**: o mock devolvia `"code": "INTERNAL"`, fora do
  `CONTRATO-DE-ERRO.md` — o veredito "passa" vale (cache byte a byte intacto), mas o
  instrumento media o caminho do erro GENÉRICO, não o de servidor. Corrigido na PR8.

**RESULTADOS DO ACEITE (N1-PR7) — o que fica para o encerramento:**
- **N1-h4 / A17 no Tab S6: p95 = 68 ms**, máx 72, zero > 100. E 54–63 ms também com
  20 s de tela parada. O **~630 ms** que o emulador media em toda latência "até o 1º
  frame" com a tela ociosa **é throttling do AVD** — não existe no device. PDF cacheado
  63 ms no device × 642 no emulador. **Nunca medir latência de frame no emulador.**
- **Dívida do LRU fechada** no Tab S6: `lru evict n=1 bytes=20821`, garantido preservado.
- **H14 confirmada** (2 setlists / 63 content) · **N1-h1 fechada, verdadeira**
  (`xVDJRBh1WpPOatbfWahOLttYn1E3` = conta principal).
- **H17 é PREMISSA FALSA**: a única setlist datada da principal é 2025-07-16 (−422 dias)
  e NENHUMA das duas tem `file_url`; o único arquivo da conta não está em setlist alguma.
  **A10 real é irreproduzível na principal sem escrita.**
- **A16 passa**: 15 min, lock do uid do app por 16m23s, `screen_off_timeout` de 30 s.

**QUATRO ITENS PARA O ENCERRAMENTO DO N1 (decisão do Marcel):**
1. **Garantido em armazenamento purgável**: arquivo baixado sob demanda que depois entra
   na janela de 7 dias nunca é promovido a `Paths.document` (o `selectPrefetch` pula os
   já presentes). O LRU respeita a proteção; o Android não sabe dela (N0-H16 §4).
2. **A3**: a tela mostra a falha genérica; o `messageKey: erro.muitas_tentativas` do core
   é descartado pelo `App.tsx` (T1-R36).
3. **A14**: `rotation=landscape|portrait` está no catálogo e **nunca foi implementada**.
4. **A21**: `sync fail … page=1` hardcoded no `sync.ts`; a falha foi na página 2.
Mais: **`fitPolicy={2}`** — legibilidade a decidir com o instrumento na mão; e a
**errata do T1-R22** (modo avulso) + a lição da declaração tardia (divergência origem T).
- **N1-h3** (custo do `native.yml`): 7m28s antes do native-stack → 14m15s (PR3a) → 12m34s →
  12m0s (PR3b) → 12m52s → 11m25s (PR4) → 11m45s (PR5) → 10m15s (PR6) → 11m39s (PR7) →
  **11m35s** (PR8). Oito medições entre 10m15s e 14m15s; mediana ~11m40s. **O recorte do
  filtro de `paths` foi feito na PR8 (D-g)** — `packages/core/**` e `pnpm-lock.yaml` saíram;
  o efeito só aparece em PRs que NÃO tocam `apps/native/**`.

**Decisões do Marcel de 2026-09-10 sobre a PR5, a executar na PR6/PR7:**
- (1) a dívida de prova do LRU (vítima não-protegida coexistindo com garantidos) fecha no
  **aceite do Tab S6**, +1 download já previsto no orçamento da PR7;
- (2) zoom ± no PDF **fica desabilitado com motivo** — aprovado, não mexer na PR6;
- (3) **`fitPolicy={2}`** (página inteira, 1 gesto = 1 página) na **PR6**, uma linha, com
  nota no código citando T1-R27 e a reavaliação no aceite do Tab S6; se ficar ilegível no
  device real, errata declarada e volta a `0`.

**Aval do revisor à PR6 (2026-09-10)**: modo avulso **aceito** — vira **errata do T1-R22**
no encerramento (o PRD manda buscar na biblioteca inteira e não diz o que fazer ao abrir um
resultado fora da setlist), não requisito novo. A **declaração tardia** do extra entra como
divergência do N1 (origem T), com a lição: **extra se declara ANTES de commitar, mesmo
quando é a única saída coerente**. Screencap perdido: refazer só se for prova sem outro
instrumento; se o logcat já provou, registrar a perda e seguir.

Achados da PR7 (aparato, valem para o encerramento e o Bloco D):
- **Latência de frame NÃO se mede no emulador**: o AVD faz throttling com a tela ociosa
  e injeta ~600 ms em `autoscroll on t=` e `nav t=`. No Tab S6 não existe.
- O **keep-awake só vale dentro do palco** (`useFocusEffect`): fora dele o
  `screen_off_timeout` do device derruba a tela no meio do protocolo. No Tab S6 era 30 s.
  Com aval do Marcel, subir para 10 min durante a sessão e devolver no encerramento.
- O Tab S6 tem **bloqueio de tela com segredo**: depois de `Dozing` só o Marcel desbloqueia.
- `adb -s <serial> install -r -d <apk>` funciona (o `--device` do Expo não — N0). O APK
  do N0 (07/09) **não serve** para o bundle do N1: faltam native-stack, safe-area e fontes.
- `pm clear` é o caminho para trocar de conta no device (apaga sessão, cache e arquivos).
- Ordem do 401 forjado (A2): `auth-failure` sai ANTES de `api status=401 … n=2`, porque a
  linha `api` só é escrita quando o `authFetch` retorna. O catálogo E4 previa o inverso.
- **O A2 desloga a conta** — deixar por último no roteiro do emulador.

Achados da PR6 (valem para as próximas PRs):
- O logcat **não** carrega a posição no caminho do avulso (`goBack` só emite `keepawake`):
  o instrumento da restauração é o screencap. Comparação objetiva que funciona sem device:
  `magick <a> -crop 2340x140+0+60 +repage` nas duas telas e `magick compare -metric AE` →
  **0** pixels diferentes na barra do palco (a tela inteira difere em 81 px = o relógio).
  Se o Marcel quiser a linha no log, é `nav`/`stage restore` novo no catálogo — PR7.
- **Nome de anexo NUNCA difere só por caixa**: o filesystem do macOS é case-insensitive,
  então `PR6-acento-aguas.png` e `PR6-acento-AGUAS.png` são o MESMO arquivo e o segundo
  screencap sobrescreveu o primeiro (só percebido no `git status` antes do commit).
- O **FAB do dev client do Expo** fica sobre o canto superior direito e intercepta toques
  ali — botões nessa área (o "apagar" da busca, o "Buscar música" da S1) precisam de
  coordenada mais à esquerda ou de outra via (teclado).
- Para limpar um `TextInput` pelo adb: focar o campo, `keyevent 123` (END) e `keyevent 67`
  (DEL) n vezes — o `input text` sem foco não faz nada e não gera log.
- `input keyevent 111` (ESC) fecha o teclado sem sair da tela (o `4`/BACK sai do app).
- **0 dos 66 content da conta de audit têm `album` preenchido** (a coluna existe): a busca
  por álbum é inalcançável no device sem escrita — fica para o aceite com a principal.
- Termo bom para provar o agrupamento da busca na audit: **`caipira`** → 2 hits, 1 na
  setlist "UX-AUDIT Show padrão" (posição 5) e 1 na biblioteca.

Achados de device da PR5 (valem para as próximas PRs):
- **`File.move` do expo-file-system 57 é ASSÍNCRONO** (`Promise<void>`); existe `moveSync`.
  Usar `move` numa "gravação atômica" síncrona deixa a promise sem dono: com gravações
  concorrentes elas se atropelam e sai `Uncaught (in promise): "Call to function
  'FileSystemFile.move' has been rejected"` na tela. Corrigido em `files.ts` e `store.ts`.
- `File.downloadFileAsync` **rejeita** se o destino já existe; passar `{ idempotent: true }`.
- A API não expõe mtime — LRU precisa de índice próprio (`files-index.json`); guardar
  também `bytes` para o S3e conseguir dizer o tamanho de um arquivo que já não está no disco.
- `Paths.cache` e `Paths.document` têm grupos distintos (`u0_a149_cache` × `u0_a149`).
- Prefetch e LRU **não** podem depender de sync bem-sucedido: uma abertura com `sync fail`
  mantém o cache anterior (A21) e é sobre ele que ambos têm de correr.
- Fixture no device por `adb push` para `/data/local/tmp` + `run-as ... cp` (o
  `run-as ... sh -c "cat > path"` dá "Permission denied"); para ela sobreviver ao sync,
  subir o Metro com `EXPO_PUBLIC_API_BASE_URL` inválido **inline** — a rede fica viva para o
  bucket e o `sync fail` preserva o cache.
- `input keyevent 4` na tela raiz do app **sai do app** (cai no app anterior); para fechar o
  dev menu do Expo, usar o X ou o botão Continue por coordenada.
- Só 3 das 66 músicas da audit ficam fora de setlist com `file_url`; com a fixture datada os
  **4 objetos do bucket** ficam alcançáveis pela UI.

Achados de device da PR4 (valem para as próximas PRs):
- `useEffect` com objetos recriados a cada render nas dependências (ex.: o retorno de
  `isValidContent`) roda a cada render e cancela `requestAnimationFrame` — usar só chaves
  estáveis.
- O native-stack **não desmonta** a tela ao navegar para outra da pilha: efeitos que devem
  valer "enquanto a tela está visível" (keep-awake) vão em `useFocusEffect`, não no unmount.
- `dumpsys window | grep KEEP_SCREEN_ON` **não** serve de instrumento em build de dev: a
  flag é do dev client do Expo e vale 1 enquanto o app vive.
- **Nenhuma setlist da conta de audit tem bis** (60/60, 8/8, 1/1 distintos) — os "60 content
  distintos em 69 songs" do pre-check são compartilhamento ENTRE setlists. A12 exige fixture.
- Fixture no device: avião ON + `run-as ... cat > files/octavia-<uid>/*.json`, e o sync real
  restaura quando a rede volta.

Medições da PR3a no device (AVD `octavia_tab32`, API 32, 2560×1600 @ 360 = 1138×711 dp):
**N1-h2 verdadeira** (o emulador aceita `hw.lcd.density=360`); fontes provadas por contraste
com uma família inexistente; rotação sem crash; `force-stop` + deep link → `src=restored`;
`pm clear` → só `login-screen`. Defeito corrigido: a marca "entrou nesta execução" tem de ser
posta ANTES do `signInWithEmailAndPassword` (o ouvinte dispara durante a chamada), senão o
primeiro login se anuncia como `src=restored`.

Aparato (acrescentar ao protocolo de device): **o emulador precisa de `-port 5554` explícito**
— sem isso ele binda portas efêmeras em IPv6 e o `adb` (limitado a 5555 pelo `native-env.sh`)
não o vê. **`expo-font` não resolve de `apps/native` sob pnpm isolado** mesmo autolinkado: o
config plugin exige `require.resolve`, então é dependência direta. Coordenadas de `input tap`
são as do device (2560×1600), não as da imagem exibida no relatório.

**N1-D14** (2026-09-10): `shouldRefresh` inclusivo vira errata do PRD T1-R2 ("≤ 5 min").
**N1-D15**: nota no `CONTRATO-DE-ERRO.md` — 401/403 sem envelope não ocorrem hoje.

**N1-D13** (2026-09-10): `packages/core` NÃO importa `types/database.types.ts` do web —
declara DTOs próprios em `packages/core/src/types.ts` (`ContentType`, `ContentDTO`,
`SetlistSongDTO`, `SetlistDTO`), subconjunto das formas medidas em A3.

Decisões de contrato tomadas dentro da PR2a (declarar em qualquer errata futura):
`shouldRefresh` usa limite **inclusivo** (faltando exatamente 300 s renova; o PRD diz
"< 5 min"); Chords com `content_data` objeto sem `chords` é `no-key` mesmo com `file_url`;
Lyrics/Tab com `content_data null` é `no-body` mesmo com `file_url` (estado inexistente nos
dados); `retryAfterFrom` cai do header para o envelope em cascata; `errorFrom` trata
qualquer `networkError` não-vazio como `network`. Na PR2b: `offlineStatus` usa `never` =
"nunca sincronizada" (nenhum content no cache) — zero arquivos COM contents é `partial`
(aceite A10); `prefetchOrder` é atual/+1/+2/+3/−1 e o resto por position; `planSync`
devolve as MESMAS referências do cache anterior; o índice de busca **não cobre `album`**
(o `ContentDTO` não o carrega — fechar na PR3 com uma linha em `types.ts`).
Achado de aparato: stub que lança na COLETA de um teste derruba a suíte e o `it.fails`
não cobre — construir fixtures dentro de cada `it`.

**Why:** o N1 é executado PR a PR com controle negativo (`it.fails` → `it`) e merge sempre
do Marcel; a contagem de testes é declarada antes de rodar.

**How to apply:** ao abrir a próxima PR, `git checkout main && git pull --ff-only` e criar
a branch nova; reler [[n1-precheck-state]] (decisões N1-D1…D12) e o `N1-PRECHECK.md` §B1.
