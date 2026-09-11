# N1-ENCERRAMENTO.md — Bloco N1 (tela 1 no tablet)

> **Data**: 2026-09-11 (bloco executado em 2026-09-09/11). **Veredito: N1 ✅ — a tela 1 existe, roda no Galaxy Tab S6 e passa no aceite.** Dez PRs (#281–#290), todas mergeadas pelo Marcel; zero mudança de backend; **zero escrita em prod pela API**; nenhuma senha digitada pela automação.
> **Fonte dos números**: corpos das PRs #281–#290 e docs commitados ([`N1-PRECHECK.md`](N1-PRECHECK.md), [`PRD-TELA-1.md`](PRD-TELA-1.md), [`LOGS-OCTAVIA.md`](LOGS-OCTAVIA.md), [`DESIGN-TELA-1/README.md`](DESIGN-TELA-1/README.md), anexos em [`N1-anexos/`](N1-anexos/) — 116 arquivos, 15 MB). Herança lida: [`N0-ENCERRAMENTO.md`](N0-ENCERRAMENTO.md) §6/§10/§11 e [`B7-ENCERRAMENTO.md`](../ux/B7-ENCERRAMENTO.md) §9. Todo número é `[medido]` salvo marcação.
> **Este documento é a fonte do bloco.** O rastro de sessão está em [`N1-anexos/n1-execution-state.md`](N1-anexos/n1-execution-state.md) como anexo bruto — §11 explica a regra nova e o que o anexo **não** é.

---

## 1. Pergunta do bloco e resposta

**"A tela 1 existe, roda no Tab S6 e passa nos 22 aceites do PRD §10?"**

**Sim, com uma lacuna nomeada.** O app `rocks.octavia.app` (Expo SDK 57 / RN 0.86.3, dev build) tem as seis telas do design — login, setlists, índice, palco (texto e PDF), busca, fim de setlist —, sincroniza cache-first em duas requests, serve PDF e texto do disco em modo avião, e navega entre músicas em **p95 = 68 ms no device real**.

| Veredito | Quantos | Quais |
|---|---|---|
| **Passa** | **21** | A1, A2, A4–A15, A17–A22 (A10 e A12 por fixture, com o motivo medido) |
| **Passa, provado no device** | **1** | **A16** — 15 min de palco sem toque, tela acesa (o emulador não faz este aceite por protocolo) |
| **Não reproduzido** | **1** | **A10 na conta principal com dado real** — irreproduzível sem escrita (§5, H17) |
| **Falha** | **0** | — |

**O que isso significa na prática**: o app pode ir ao palco **em modo leitura**. Um show com setlist já montada no web funciona de ponta a ponta sem rede: abre sem login, lista as setlists do cache, entra na música, vira página, busca outra música na biblioteca inteira e volta para a posição em que estava, com a tela acesa o show inteiro. O que ele ainda não faz é **escrever**: criar, editar ou reordenar é a tela 2 (§11).

---

## 2. Arco — PR × escopo × merge × prova principal × controle negativo

| PR | Escopo | Merge (sha · UTC) | Prova principal | Controle negativo |
|---|---|---|---|---|
| **#281** N1-PR1 | pre-check (Fases A/B/C), N1-D1…D12, 16 divergências; erratas do PRD §4/§2 e do design (E1/E2); `LOGS-OCTAVIA.md`; `GET /api/setlists` no `SETLISTS.md` | `d629762` · 2026-09-10T13:31:42Z | leitura por `user_id`: a conta principal tem **0** inválidos do T1-R7 | — (docs) |
| **#282** N1-PR2a | core: `content-contract`, `token`, `rate-limit`, `errors`; **N1-D13** (DTOs próprios) | `1816472` · 13:55:10Z | 685 → **723 / 85 (808)** (+38) | commit 1: stubs que lançam + 38 `it.fails` verdes |
| **#283** N1-PR2b | core: `sync`, `song`, `position`, `offline`, `search`; erratas N1-D14/D15 | `db89e82` · 14:17:32Z | 723 → **761 / 85 (846)** (+38); camada 1 do aparato fechada | idem, 2 commits |
| **#284** N1-PR3a | fundação: tokens do design, 6 ttf por config plugin, native-stack, S0; apaga a UI de prova (N1-D7); **N1-D16** (PR3 vira 3a+3b) | `6f30f02` · 16:00:33Z | **N1-h2 verdadeira**: AVD aceita `hw.lcd.density=360` → 1138×711 dp, igual ao Tab S6 | `pm clear` → **só** `login-screen`; senha errada → `auth/invalid-credential` em pt-BR |
| **#285** N1-PR3b | `store.ts` (cache por uid), `api.ts`, `sync.ts`, `net.ts`, S1 nos seis estados | `5d5cf1d` · 18:21:53Z | **A4**: `sync ok setlists=3 content=66 pages=1 t=4293` em **2 requests**; **N0-H11 fechada** (2ª abertura faz 2 requests reais) | 500 forçado → cache **byte a byte** intacto (A21); avião → `sync skip reason=offline` |
| **#286** N1-PR4 | spike do C3 (commit 1, descartável) + S2 índice, S3 texto, S5 | `23c00d2` · 19:45:02Z | **N1-h4/N1-h5 fechadas**: `autoscroll on t=38`, 0,00% janky moderna; linha de 120 col. inteira em 18 e 40 dp | 30 s parado → **0 frames** (o número acusa o scroll); sem `ScrollView` horizontal → a linha **re-quebra** |
| **#287** N1-PR5 | `files.ts` (garantido × sob demanda), `prefetch.ts` (7 d, cap 200 MB, LRU), S3d PDF, S3e placeholder, ✓◔✗ real | `dc261df` · 21:36:14Z | **A9** `file src=download bytes=242176` + sha256 do disco = servidor; **A13** 12 páginas em avião | cache apagado + avião → S3e sem crash; LRU com cap de 100 KB: **com** proteção o garantido sobrevive, **sem** ela `lru evict n=1` |
| **#288** N1-PR6 | S4a/S4b busca, `album` no índice (força título > artista > álbum > corpo), modo **avulso**, `fitPolicy` | `568db1e` · 23:19:56Z | **A11** `search q=7 n=2 in-setlist=1`; **T1-R22** avulso volta a "4 DE 8" | `xablau` → S4b; cache apagado → mesmo termo dá `n=0`, app vivo |
| **#289** N1-PR7 | aceite A1–A22 no emulador + aceite no Tab S6; `stage restore` (**N1-D17**), 401 forjado (E4), `fixtures/aceite.py` | `c2fa635` · 2026-09-11T12:38:13Z | **21/22 no emulador**; no Tab S6 **A17 p95 = 68 ms**, **A16 15 min**, dívida do LRU fechada, **H17 falsa** | `pm clear`; 500 na página 2; id repetido entre páginas |
| **#290** N1-PR8 | correções do aceite **D-a…D-g** | `6a9315d` · 2026-09-11T14:25:43Z | **D-a** no Tab S6: `prefetch promote n=1`, `src=disk`, **`grep -c src=download` → 0** | setlist **sem data** → `prefetch promote` **0** e arquivo intacto em `Paths.cache` |

Dois commits em #282, #283 e #286 (o primeiro é sempre o controle negativo); commit único nas demais.

---

## 3. Decisões — estado final

### N1-D1…D17 (do pre-check e da execução)

| # | Decisão | Estado |
|---|---|---|
| N1-D1 | navegação `@react-navigation/native` 7.3.18 + `native-stack` 7.18.10 | executada (#284). A **pilha** virou o mecanismo de restauração do modo avulso (§6) |
| N1-D2 | cache JSON em `Paths.document` por `uid`, sem `expo-sqlite` | executada (#285); `setlists.json` 15.247 B após descartar o `content{…}` embutido |
| N1-D3 | Maestro **não** instala no N1 | cumprida — nenhuma automação de UI; todo aceite por adb + logcat + screencap |
| N1-D4 | AVD `octavia_tab32` com `hw.lcd.density=360` `[hipótese]` | executada; **N1-h2 verdadeira** (#284) |
| N1-D5 | catálogo de logs + `t=<ms>` em `sync ok` | executada (#281); **três erratas** depois (E5, E6, E7 — §6) |
| N1-D6 | 6 ttf por config plugin `expo-font` (793.720 B) | executada (#284); fontes provadas por contraste com família inexistente |
| N1-D7 | apagar a UI de prova do N0; `firebase.ts` fica | executada (#284) |
| N1-D8 | orçamento de prod = o do B6 | cumprida em todas as PRs (§9) |
| N1-D9 | ordem PR1→PR2→PR3→PR4(spike)→PR5→PR6→PR7→aceite T | cumprida, com **duas** subdivisões declaradas (N1-D16 e a PR2 em 2a/2b) |
| N1-D10 | A10 por fixture; prova real no aceite T com a setlist datada da principal | **metade cumprida**: a fixture provou (#287); a prova real é **impossível** (H17 falsa — §5) |
| N1-D11 | rede = `expo-network` 57.0.1 | executada (#285) |
| N1-D12 | `orientation: "default"`, rotação preserva posição | executada (#284/#286); a posição vive nos **params da rota**, não em estado |
| **N1-D13** | o core **não** importa `types/database.types.ts`; declara DTOs próprios | executada (#282); mantém o `tsc -p packages/core` com `lib ES2022` e `types: []` |
| **N1-D14** | `shouldRefresh` é inclusivo → errata "≤ 5 min" no T1-R2 | executada (#283) |
| **N1-D15** | nota no `CONTRATO-DE-ERRO.md`: 401/403 sem envelope não ocorrem hoje | executada (#283) |
| **N1-D16** | a PR3 vira 3a (fundação + S0) e 3b (store, sync, S1) | executada (#284/#285) |
| **N1-D17** | `stage restore n=<i>/<N>` no catálogo e no app | executada (#289); **o device corrigiu o texto da errata** — pelo índice a linha não sai (§6, E6) |

### D-a…D-g (correções que o aceite exigiu, todas na #290)

| # | O que corrigiu | Prova | Controle negativo |
|---|---|---|---|
| **D-a** | garantido que nasceu em armazenamento **purgável** nunca era promovido: `selectPrefetch` só devolve o que **falta baixar**. `promoteList` no core + `prefetch promote` no app | Tab S6, conta principal: 4 `ls`, `prefetch promote n=1`, `src=disk`, **`src=download` → 0**, sha256 `1e1d77c4…` idêntico, idempotente na reabertura | setlist **sem data**: `prefetch promote` → **0**, arquivo intacto em `Paths.cache` — a promoção não é indiscriminada |
| **D-b** | a tela mostrava a falha genérica; agora a mensagem deriva do código (T1-R36), com as **sete** chaves que o `errorFrom` realmente emite | 429 → "servidor ocupado · tente em instantes" | 500 → "falha no servidor" (texto **diferente**) |
| **D-c** | `rotation=landscape\|portrait n=<i>/<N>` estava no catálogo desde o N1-D5 e **nunca fora implementada** | `rotation=portrait n=1/60` e `rotation=landscape n=1/60` | montagem do palco → **0** linhas (só a mudança emite) |
| **D-d** | `sync fail … page=<p>` tinha `page=1` **hardcoded** | 500 na página 2 → `page=2` | 500 na página 1 → `page=1` |
| **D-f** | `fitPolicy={2}` deixava a A4 em ~244 dp — ilegível no palco | partitura em **fit width**, largura inteira (`PR8-df-fitwidth.png`) | — (a comparação é com a `{2}` medida no aceite) |
| **D-g** | `native.yml` perde `packages/core/**` e `pnpm-lock.yaml` do filtro `paths` | o gate **disparou** na própria #290, que toca `apps/native/**` (11m35s) | **o "depois" está em aberto** — §5, N1-h3 |

**D-e não existe**: a lista do Marcel foi rotulada `D-a…D-g` com seis itens; a letra `e` não foi usada. Registrado para que a contagem "seis correções × sete letras" não pareça um item perdido.

---

## 4. Os 22 aceites — vereditos finais (pós-#290)

### Emulador `octavia_tab32` (API 32, 1138×711 dp) — anexo [`PR7-emulador-A1-A22.txt`](N1-anexos/PR7-emulador-A1-A22.txt)

| # | Aceite | Veredito na #289 | Estado final |
|---|---|---|---|
| A1 | bearer em 100%; zero session/proxy/profile | passa | **passa** — a camada de rede conhece duas rotas; `auth=sim` em 3/3 no mock |
| A2 | token forjado → no máximo 2 requests e tela de login | passa | **passa** — `n=2`, nunca uma 3ª. Divergência de **ordem** no catálogo (§6) |
| A3 | 429 com `Retry-After: 30` → nenhuma request por 30 s, pt-BR | passa **c/ ressalva** (mensagem genérica) | **passa** — a ressalva virou **D-b** e está corrigida |
| A4 | 1+⌈N/100⌉ requests; lista do cache em < 1 s | passa | **passa** — lista na tela em **+123 ms**; 2 requests |
| A5 | avião + kill + reopen sem login, setlist de 60 completa | passa | **passa** (emulador **e** Tab S6) |
| A6 | todo tipo renderiza; inválido mostra placeholder | passa | **passa** |
| A7 | título do cache vence o embutido | passa | **passa** |
| A8 | `content_id` ausente: posição certa, com rótulo | passa | **passa** |
| A9 | baixado uma vez, servido do disco; sha256 == servidor | passa | **passa** |
| A10 | datada amanhã → baixa em background; indicador correto | passa **(fixture)** | **passa por fixture**; com dado real → **não reproduzido** (§5) |
| A11 | busca local, offline, e voltar mantém "n de N" | passa | **passa** |
| A12 | bis: mesmo content em duas posições = duas telas | passa **(fixture)** | **passa por fixture** — nenhuma setlist da audit tem bis, e o **editor do web não deixa criar um** (§11) |
| A13 | PDF de 12 páginas do cache em avião | passa | **passa** (emulador **e** Tab S6) |
| A14 | bordas, "n de N", salto 1→47, fim de setlist, rotação | passa **c/ ressalva** (`rotation=` inexistente) | **passa** — a ressalva virou **D-c** e está corrigida |
| A15 | auto-scroll < 100 ms; zoom sem re-quebra; tema em 1 tap | passa **c/ artefato do AVD** | **passa** — o artefato é do emulador; no device 27–31 ms (§8) |
| A16 | 15 min sem toque no palco → tela acesa | **não reproduzido** (é do device por protocolo) | **passa no Tab S6** — 15 min, `mWakefulness=Awake` nos 15 pontos, lock por **16m23s** com `screen_off_timeout` de **30 s** |
| A17 | troca p95 < 100 ms (texto) / < 1 s (PDF cacheado) | passa (p95 97 ms no AVD) | **passa** — **p95 = 68 ms** no device, máx 72, zero acima de 100 |
| A18 | `notes` visível; `annotations` não renderizadas | passa | **passa** |
| A19 | falha com cache: indicador + lista; sem cache: erro | passa | **passa** |
| A20 | nenhum literal de UI em inglês | passa | **passa** |
| A21 | 500 na página 2 → cache byte a byte inalterado | passa **c/ ressalva** (`page=1` hardcoded) | **passa** — ressalva → **D-d**, corrigida. **Ver a ressalva do instrumento abaixo** |
| A22 | id repetido entre páginas → item uma vez; `sortBy=recent` | passa | **passa** |

### Ressalva do A21 — o instrumento media outra coisa

O mock da #289 devolvia `"code": "INTERNAL"`, **que não existe no [`CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md)**. O veredito "passa" **continua válido** — o A21 mede que o cache fica byte a byte intacto quando o sync falha, e ficou (sha256 idêntico nos dois arquivos) — mas o caminho exercitado foi o do erro **genérico**, não o de **servidor**. Corrigido para `INTERNAL_ERROR` na #290, que é por isso que o controle negativo do D-b consegue mostrar "falha no servidor". **Lição em §10 (d).**

### Tab S6 (SM-T865, API 32, 1138×711 dp) — anexo [`PR7-tab-s6.txt`](N1-anexos/PR7-tab-s6.txt)

| O que só o device fecha | Resultado |
|---|---|
| **A17 / N1-h4** | **p95 = 68 ms** em 59 navegações (máx 72; zero > 100). **54–63 ms também após 20 s de tela parada** — a cadência de show. PDF cacheado **63 ms** (× 642 ms no emulador) |
| **A15** | auto-scroll `t=27…31 ms` em toda cadência |
| **A16** | 15 min corridos; barra do palco **pixel a pixel idêntica** no início e no fim |
| **A5 / A13** | avião real (`ping` → `Network is unreachable`), setlist de 60 completa, 12 páginas do PDF |
| **Dívida do LRU** (aberta na #287) | **fechada**: `lru evict n=1 bytes=20821` — a vítima não protegida saiu, o garantido de 242.176 B ficou, mesmo disco e mesma rodada |
| **H14 / N1-h1** | confirmadas: 2 setlists / 63 content; `xVDJ…` é a conta principal |
| **H17** | **falsa** (§5) |
| **Busca por álbum** | fechada nas **duas** contas com dado real — `compendio` na audit, `unheard`/`wasting` na principal, esta provando a ordem **álbum > corpo** do T1-R20 |
| **D-a** (#290) | promoção provada com os quatro `ls`, o controle negativo e a idempotência |

---

## 5. Hipóteses — estado final

| # | Hipótese | Estado | Prova |
|---|---|---|---|
| **N1-h1** | `xVDJ…` é a conta principal | **verdadeira** | #289 — login no Tab S6: `auth uid=xVDJ… src=login` → 2 setlists / 63 content |
| **N1-h2** | o emulador aceita `hw.lcd.density=360` | **verdadeira** | #284 — 2560×1600 @ 360 = **1138×711 dp**, igual ao Tab S6 |
| **N1-h3** | custo do `native.yml` | **medida; o efeito do D-g fica em aberto** | abaixo |
| **N1-h4** | auto-scroll por rAF sem jank a 60 fps no Tab S6 | **verdadeira** | #286 (spike, 0,00% janky moderna) + #289 (device: 27–31 ms, p95 de navegação 68 ms) |
| **N1-h5** | `ScrollView` horizontal + `Text` mono mantém a linha de 120 colunas em 40 dp | **verdadeira** | #286 spike; #289 com o item **real** (a régua do Marcel) |
| **N1-h6** | tamanhos dos APK/módulos | **não medida como hipótese** — o inventário do SDK foi conferido antes/depois em toda build (idêntico em 7 PRs), mas o tamanho do APK não foi tabulado no N1 |
| **N0-H11** | `cache: 'no-store'` do RN é no-op; T1-R12 por 2 requests reais | **fechada, verdadeira** | #285 — a 2ª abertura online faz **mais 2 requests reais** |
| **H14** | conta principal = 63 content / 2 setlists | **confirmada, exata** | #289 no device |
| **H16 (audit)** | tamanho dos arquivos | fechada no N0 (265.002 B em 4 objetos) | — |
| **H16 (principal)** | idem, conta principal | **fechada — 138.916 B**, pendente desde o N0 | #290, D-a: o **único** arquivo da conta |
| **H17** | ver abaixo | **a conclusão é falsa** | #289 |

### N1-h3 — o que o `native.yml` custa, e o que o D-g ainda não provou

Duração do job `android-debug-apk` no check final de cada PR `[medido: gh pr checks]`:

| PR | #281 | #282 | #283 | #284 | #285 | #286 | #287 | #288 | #289 | #290 |
|---|---|---|---|---|---|---|---|---|---|---|
| | **ausente** | 7m08s | 5m57s | 14m11s | 11m57s | 11m22s | 11m45s | 10m15s | 11m39s | 11m35s |

- **#281 é docs-only e o gate não disparou** — com o filtro **antigo**, que ainda continha `packages/core/**`.
- **#282 e #283 são de core** (a #282 não toca um único arquivo fora de `packages/core/`) e o gate **disparou**: 7m08s e 5m57s. Sob o filtro do D-g, nenhuma das duas dispararia.
- As **sete** PRs que tocam `apps/native/**` (#284–#290) vão de 10m15s a 14m11s, **mediana 11m39s**. O salto da #284 é a entrada do native-stack e dos peers nativos: antes deles o mesmo job custava ~6–7 min.
- **Duas populações, não uma**: os runs de `push` na main (após cada merge) medem o *run*, não o *job*, e vão de 6m44s a 13m27s. O rastro de sessão misturou as duas séries numa lista só; **esta tabela é a correção**, e é uma das razões de o estado de bloco virar artefato de repositório (§11).

**O efeito do D-g não foi provado e não podia ser.** Este encerramento é docs-only, e uma PR docs-only **já não** disparava o gate antes do recorte (#281 é a prova). A prova discriminante é uma PR que toque **só `packages/core/**` ou só o lock**: o "antes" está medido (#282, 7m08s); o "depois" cabe à primeira PR core-only depois da #290 — do N2 ou do Bloco D. **Registrado como herança verificável, não como hipótese fechada** (§11).

### H17 — a medição é verdadeira, a conclusão é falsa

O que o PRD e o [`C-ENCERRAMENTO.md`](../ux/C-ENCERRAMENTO.md) registram: *"das 2 setlists da conta principal, 1 tem `performance_date` → o prefetch de 7 dias (T1-R15) tem dado real"* `[medido pelo Marcel, 2026-09-05 — dashboard]`.

O que o device mediu (#289, cache da principal lido por `run-as`):

```
'Good Times'  date=None        songs=4  arquivos=0
'Season 3'    date=2025-07-16  songs=7  arquivos=0    → −422 dias, FORA da janela
```

**A primeira metade é verdadeira** — 1 das 2 setlists tem data. **A conclusão anexa é falsa**: a data está **422 dias no passado** e **nenhuma das duas setlists tem um único `file_url`**. O único arquivo da conta (`Easy_-_Guitar.pdf`, content `b23a3803`) **não está em setlist alguma**, então nenhum caminho do app o alcança pela navegação normal. `prefetch plan n=0 reason=7d` é a consequência **correta**, não um defeito.

**Consequência**: **A10 com dado real na conta principal fica NÃO REPRODUZIDO**, com o motivo medido. O A10 passa por fixture (#287) e a lógica passa por unidade no core. **Caminho para fechá-la**: datar uma setlist da principal dentro da janela de 7 dias e pôr um arquivo nela — **escrita do Marcel, quando houver show de verdade**. Decisão registrada (2026-09-11): *"não vou datar setlist para satisfazer aceite"*.

---

## 6. Erratas do bloco

### T1-R22 — modo avulso (errata do PRD, aplicada nesta PR)

O T1-R22 manda buscar na **biblioteca inteira** e diz que "abrir um resultado de dentro do palco **não perde** a posição na setlist" — mas **não diz o que a tela faz** enquanto a música avulsa está aberta. A #288 resolveu com o **modo avulso** e declarou o extra **depois** do commit (§7, divergência 34): a barra do palco mostra `AVULSA` em vez de "n de N", as bordas laterais **não navegam** (não há próxima nem anterior), e "Sair" vira "Voltar". A restauração é a **pilha do native-stack** — sem estado global, sem params extras. Provado por screencap antes/depois (4 DE 8 → avulsa → 4 DE 8) e, desde a #289, pela linha `stage restore n=4/8`.

### `fitPolicy` — errata do design e limitação conhecida do T1-R27

O S3d nasceu `fitPolicy={2}` (página inteira) na #288 porque ali **um** gesto virava **uma** página. O aceite no Tab S6 mediu o outro lado da conta: a A4 inteira ocupa **~548 px de 2560, ~244 dp de largura** — pequena demais para ler no palco. Decisão do Marcel (2026-09-10): **legibilidade ganha de contagem de gestos** → `fitPolicy={0}` (fit width) na #290.

**Limitação conhecida, registrada, não defeito**: com fit width o deslize **rola dentro da página** antes de virar, então virar uma página custa vários gestos — o T1-R27 ("avançar: 1 tap ou 1 gesto") **não se cumpre para a PÁGINA do PDF**. Continua valendo para a **MÚSICA**: as bordas de 15% avançam e voltam em 1 tap, em PDF como em texto. O texto está no código, em `StageScreen.tsx`, junto do `fitPolicy`.

### Catálogo de logs — E5, E6, E7 (em [`LOGS-OCTAVIA.md`](LOGS-OCTAVIA.md))

| Errata | PR | O quê |
|---|---|---|
| **E5** | #287 | `download-error` e `files-cleared` acrescentados. E a recusa declarada: o prompt pedia `pdf-placeholder name=<seg>` (nome do N0); o catálogo do N1 já tinha `placeholder kind=file-missing name=<seg>` — **o catálogo prevaleceu** |
| **E6 / N1-D17** | #289 | `stage restore n=<i>/<N>` entra no catálogo. **O device corrigiu o texto**: eu escrevera que um salto pelo índice também emite a linha; ele **não** emite, porque o índice **desempilha** o palco. Pela busca, emite |
| **E7** | #290 | duas linhas em desacordo entre catálogo e app, acertadas no lado do app: `rotation=` (prometida desde o N1-D5, nunca implementada) e `page=<p>` (hardcoded em 1). Mais a linha **nova** `prefetch promote n=<n>` |

**Divergência de ordem no E4** (não de conteúdo): o catálogo previa `api status=401 … n=2` **seguida** de `auth-failure`; na prática o `auth-failure` sai **antes**, porque a linha `api` só é escrita quando o `authFetch` retorna.

### Erratas anteriores do bloco, já commitadas (#281 e #283)

E1 (canvas 1280×800 dp é o AVD; o Tab S6 é 1138×711 dp) e E2 (os 15 IDs sem tela são não-visuais) no [`README do design`](DESIGN-TELA-1/README.md); no PRD, `Cache-Control: private, no-store`, a atribuição dos inválidos do §4, o método dos bytes (N7) e o "≤ 5 min" do T1-R2 (N1-D14).

---

## 7. Divergências consolidadas — 1 a 42

Origem: **P** = premissa do prompt do revisor · **D** = premissa de doc anterior (PRD, design, pre-check, catálogo, encerramento de bloco) · **A** = ambiente (máquina ou dado real de prod) · **T** = toolchain/aparato · **X** = terceiros.

As 16 do pre-check estão em [`N1-PRECHECK.md`](N1-PRECHECK.md) §1 e não se repetem aqui (P 3 · D 7 · A 2 · T 3 · X 1). As da execução:

| # | PR | Uma linha | Origem |
|---|---|---|---|
| 17 | #283 | T1-R20 manda indexar `album`, e o `ContentDTO` da N1-D13 não o carregava — índice sem álbum até a #288 | D |
| 18 | #283 | `never` do `offlineStatus` é "nunca sincronizada", não "zero arquivos" (o A10 exige `partial` para contents em cache e 0 arquivos) | D |
| 19 | #283 | stub que lança na **coleta** de um teste derruba a suíte, e o `it.fails` não cobre — fixtures dentro de cada `it` | T |
| 20 | #284 | o emulador precisa de **`-port 5554` explícito**; sem isso binda portas efêmeras em IPv6 e o `adb` não o vê | T |
| 21 | #284 | `expo-font` **não resolve** de `apps/native` sob pnpm isolado, embora já autolinkado: o config plugin exige `require.resolve` → dependência direta | T |
| 22 | #284 | o logo estava embutido no HTML do design; o PNG extraído tem fundo `#100E16` contra o token `#100F16` e o retângulo fica levemente visível | D |
| 23 | #284 | com o config plugin, as fontes já estão prontas na abertura — o app **não** chama `useFonts` | T |
| 24 | #285 | proxy inválido **não** serve para forçar falha de sync: bloqueia também o Metro e o dev client não carrega o bundle → servidor local + `EXPO_PUBLIC_API_BASE_URL` inline | T |
| 25 | #285 | "Buscar música" e "Baixar esta setlist" nascem **desabilitados** (são das PRs 6 e 5) porque o design pede os dois no layout | D |
| 26 | #286 | **nenhuma setlist da conta de audit tem bis**: os "60 content distintos em 69 songs" do pre-check são compartilhamento **entre** setlists (60/60, 8/8, 1/1) → A12 por fixture | D |
| 27 | #286 | `dumpsys window \| grep KEEP_SCREEN_ON` **não** serve de instrumento em build de dev: a flag é do dev client e vale 1 enquanto o app vive | T |
| 28 | #286 | `expo-keep-awake` não resolve sob pnpm isolado — mesmo caso da 21 | T |
| 29 | #287 | o prompt pedia `pdf-placeholder name=<seg>`; o catálogo do N1 já tinha `placeholder kind=file-missing name=<seg>` — **não acomodado**, errata E5 | P |
| 30 | #287 | `File.move` do expo-file-system 57 é **assíncrono**; três gravações concorrentes se atropelam e a promise rejeitada aparece na tela | X |
| 31 | #287 | `File.downloadFileAsync` **rejeita** se o destino existe — exige `{ idempotent: true }` | X |
| 32 | #287 | a API não expõe **mtime** — o LRU precisa de índice próprio (`files-index.json`) | X |
| 33 | #288 | **0 dos 66 itens da conta de audit têm `album`** (a coluna existe): a busca por álbum era inalcançável no device sem escrita — fechada no aceite com a principal | A |
| 34 | #288 | **extra declarado depois do commit**: o modo avulso não estava na lista fechada e foi anunciado no corpo da PR, não antes. Aceito como **errata do T1-R22**, não requisito novo | **T** |
| 35 | #288 | o filesystem do macOS é **case-insensitive**: `PR6-acento-aguas.png` e `PR6-acento-AGUAS.png` são o mesmo arquivo e o segundo screencap sobrescreveu o primeiro (perda declarada; o logcat cobre os dois) | A |
| 36 | #289 | o APK do N0 (2026-09-07) **não serve** para o bundle do N1: faltam native-stack, safe-area-context e as fontes do N1-D6 | T |
| 37 | #289 | **latência de frame não se mede no emulador**: o AVD faz throttling com a tela ociosa e injeta ~600 ms em toda medida "até o 1º frame" (`t=613` × 14–18 ms em rajada). No Tab S6 não existe | T |
| 38 | #289 | o catálogo E4 previa `api status=401` **antes** de `auth-failure`; a ordem real é a inversa (a linha `api` só sai quando o `authFetch` retorna) | D |
| 39 | #289 | **H17**: a conclusão "o prefetch de 7 dias tem dado real" é falsa (§5) | D |
| 40 | #290 | o prompt pedia `erro.muitas_tentativas` e `erro.servidor`; o `errorFrom` do core **não emite** essas chaves — mapeadas as **sete** reais | P |
| 41 | #290 | o mock da #289 devolvia `"code": "INTERNAL"`, fora do `CONTRATO-DE-ERRO.md` — o A21 passou pelo caminho **genérico** (§4) | T |
| 42 | encerramento | o prompt abria com "**#290 mergeada**"; na primeira medição ela estava `OPEN` (`mergedAt: null`), a main em `c2fa635` e a suíte em **764**, não 768. Parado e reportado; o Marcel mergeou antes da execução | P |

**Contagem das 26 da execução**, item a item:

| Origem | Itens | Total |
|---|---|---|
| **P** | 29, 40, 42 | **3** |
| **D** | 17, 18, 22, 25, 26, 38, 39 | **7** |
| **A** | 33, 35 | **2** |
| **T** | 19, 20, 21, 23, 24, 27, 28, 34, 36, 37, 41 | **11** |
| **X** | 30, 31, 32 | **3** |
| | | **26** ✓ |

**Bloco inteiro (16 + 26 = 42)**: P 6 · D 14 · A 4 · T 14 · X 4 = **42** ✓

**Leitura**: **T (aparato) dobrou em relação ao pre-check** — 3 no pre-check, 11 na execução. É a assinatura de um bloco que saiu do papel e foi para o device: quase toda divergência nova é do instrumento, não do produto. **Nenhuma foi acomodada**; todas estão nos corpos das PRs ou neste documento.

---

## 8. Aparato — o que mudou no N1

1. **AVD `octavia_tab32`** (API 32, `pixel_tablet`) com **`hw.lcd.density=360`**: 2560×1600 @ 360 = **1138×711 dp**, idêntico ao Tab S6. Sem isso o emulador desenha 1280×800 dp (o canvas do design — errata E1) e nenhuma medição de layout vale. **`-port 5554` é obrigatório** no `emulator` (div. 20).
2. **`input tap` usa coordenadas do device** (2560×1600), não as da imagem exibida no relatório. O **FAB do dev client** do Expo fica sobre o canto superior direito e intercepta toques ali. `keyevent 111` (ESC) fecha o teclado; **`keyevent 4` na tela raiz sai do app**.
3. **Fixtures como instrumento legítimo**, cada uma com o **motivo medido** de por que o dado real não serve — a regra que separa fixture de encenação:
   - **bis** (A12): nenhuma setlist da audit tem bis, e o editor do web não deixa criar (§11);
   - **setlist datada** (A10): nenhuma setlist da audit tem `performance_date`; na principal a única datada está −422 dias;
   - **item inválido / content ausente / tipo desconhecido** (A6, A8): a audit tem **0** inválidos;
   - **régua de 120 colunas** (A15): a linha mais longa da audit tem 58 colunas — até o Marcel escrever a régua real, em 2026-09-10;
   - **429, 500 na página 1 e na 2, id repetido** (A3, A21, A22): provocar 429 real exigiria 300 requests/min, e um 500 real não se encomenda.
   Instalação no device: `adb push` para `/data/local/tmp` + `run-as … cp` (o `run-as … sh -c "cat > path"` dá "Permission denied"). Para a fixture **sobreviver ao sync**, subir o Metro com `EXPO_PUBLIC_API_BASE_URL` inválido **inline** — a rede fica viva para o bucket e o `sync fail` preserva o cache (A21).
4. **Comparação de pixel como oráculo de screencap**: `magick <img> -crop 2340x140+0+60 +repage` nas duas telas e `magick compare -metric AE` → **0** pixels diferentes na barra do palco. Foi assim que a restauração do modo avulso se provou **antes** de a linha `stage restore` existir (a tela inteira difere em 81 px: o relógio).
5. **Recorte do `native.yml`** (D-g): `packages/core/**` e `pnpm-lock.yaml` saem do filtro `paths` nos dois gatilhos. Mudança só de core segue coberta pelo `build`. Efeito **por medir** (§5).
6. **Controle negativo que quebra a coleta não é controle negativo** (div. 19): um stub que lança chamado no **topo** do módulo de teste derruba a suíte inteira antes que qualquer `it.fails` rode — e uma suíte que não roda não prova nada. Fixture **dentro** de cada `it`.
7. **Latência de frame não se mede no emulador** (div. 37). O corolário: toda métrica de tempo do N1 que importa foi refeita no Tab S6.
8. **Protocolo de device** (herdado do N0-H15, com acréscimos): `source scripts/native-env.sh`; `adb reverse tcp:8081 tcp:8081`; deep link `exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`; probe do Metro por `nc` dentro de `sh -c`; `pm clear` para trocar de conta; `-s <serial>` em **todo** comando (o Tab S6 nunca recebeu um comando fora do seu aceite).

---

## 9. Números

| Medida | Antes do N1 | Depois |
|---|---|---|
| Suíte da raiz | 685 / 85 (770) · **79** / 4 (83) | **768 / 85 (853) · 88 / 4 (92)** |
| — decomposição | — | +38 (#282) +38 (#283) +3 (#288, álbum) +4 (#290, `promoteList`) = **+83** |
| `packages/core` | 2 módulos (`normalize`, `auth-fetch`) | **13** módulos |
| `apps/native/src` | 5 arquivos (UI de prova, apagada) | **18** arquivos, 3.459 linhas |
| Diff do bloco (`138bf1a..HEAD`) | — | **181 arquivos, +11.466 / −214** (50 arquivos e +5.735 em `apps/native` + `packages/core`) |
| `native.yml` (job) | N0: 5m24s–8m11s | N1 core 5m57s–7m08s; **com native-stack, mediana 11m39s** |
| Anexos | — | [`N1-anexos/`](N1-anexos/) **116 arquivos, 15 MB** (+ o bruto de sessão) |

### Contabilidade de prod — bloco inteiro

Conta de **audit** salvo indicação. Emulador `octavia_tab32` e Tab S6 `RX2N8000F3D`.

| Item | pre-check | #284 3a | #285 3b | #286 PR4 | #287 PR5 | #288 PR6 | #289 PR7 | #290 PR8 | **Total** |
|---|---|---|---|---|---|---|---|---|---|
| logins aceitos | 1 | 2 | 1 | 0 | 0 | 0 | 2 (audit + **principal**, Tab S6) | 1 | **7** |
| logins recusados | 0 | 2 | 0 | 0 | 0 | 0 | 3 (Tab S6) | 0 | **5** |
| `setlist-read` | 1 | 0 | 3 | 4 | 2 | 2 | 10 (8 + 2) | 5 (4 + 1) | **27** |
| `content-read` | 2 | 0 | 3 | 4 | 2 | 2 | 11 (9 + 2) | 5 (4 + 1) | **29** |
| downloads do bucket | 0 | 0 | 0 | 0 | 12 | 2 | 6 (4 + 2) | 1 | **21** |
| 401 | 0 | 0 | 0 | 0 | 0 | 0 | **2** (A2 forjado) | 0 | **2** |
| 429 reais | 0 | 0 | 0 | 0 | 0 | 0 | 0 (mock local) | 0 | **0** |
| `/api/auth/session`, `/api/proxy`, `/api/profile` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| **escrita pela API** | **0** | **0** | **0** | **0** | **0** | **0** | **0** | **0** | **0** |
| acesso ao console | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |

**Reconciliação declarada**: o corpo da #289 diz "5 tentativas (4 recusadas, 2 aceitas)" no Tab S6 — soma 6 para um total de 5. O anexo `PR7-tab-s6.txt` é o instrumento: **3** `login-error code=auth/invalid-credential` + **2** `auth uid=… src=login` (audit e principal) = **5 tentativas, 3 recusadas, 2 aceitas**. Esta tabela usa o instrumento; o corpo da PR fica como está (histórico).

**Senhas**: as sete aceitas e as cinco recusadas foram **todas digitadas pelo Marcel**. Nenhuma passou por `input text` nem por qualquer outro caminho da automação (regra herdada do N0, div. 24 de lá).

### Escrita manual do Marcel no web (fora da automação)

Em **2026-09-10**, para destravar o A15, o Marcel criou pelo editor do web, na conta de audit, um item **Chords** — `[UX-AUDIT] Linha de 120 colunas`, artista *Teste de Régua*, álbum *Compêndio Sertanejo* — com duas linhas longas e espaços preservados. **Medição do aceite**: as linhas têm **111 e 113 colunas**, não 120 exatas; os espaços **foram** preservados e o alinhamento acorde↔sílaba resiste ao zoom de 18 a 40 dp. A régua serve, e o número declarado no prompt não era o medido — registrado, não acomodado.

**Novo estado de referência da conta de audit**: **3 setlists / 67 content / 69 songs / 7 profiles** (era 3 / 66 / 69). O álbum desse item é o que fechou a dívida da busca por álbum na audit (`compendio`).

---

## 10. Lições do bloco

**(a) Premissa de prompt é hipótese, inclusive sobre o próprio estado do repositório.** Seis divergências de origem P no bloco. A mais barata de todas foi a **42**: o encerramento abria com "#290 mergeada", e três medições independentes — `git rev-parse origin/main`, `gh pr view`, a contagem da suíte (764 × 768) — mostraram que não. Custou uma medição e um `gh pr merge`; acomodada, teria produzido um encerramento que afirma como consumado o que não estava na main, com a tabela do §2 sem uma linha.

**(b) A entrega verbatim vai na primeira mensagem; o resumo é o que se lê depois dela.** As PRs 5, 6 e 7 chegaram ao revisor primeiro como resumo, e só quando ele pediu é que vieram as medições completas. **Um resumo faz o revisor decidir sobre o que não viu.** Origem da divergência: **T** (rito da execução, não do produto). É o mesmo vício que fez o modo avulso (div. 34) ser declarado **depois** do commit: **extra se declara antes de commitar, mesmo quando é a única saída coerente**.

**(c) Há uma classe de defeito que só o device mostra.** Cinco no N1, nenhum visível em teste unitário, nenhum visível no emulador sem o protocolo:
- `useEffect` com **objetos recriados a cada render** nas dependências cancela o `requestAnimationFrame` no render que ele mesmo dispara — o auto-scroll simplesmente não ligava;
- o **native-stack não desmonta** a tela ao navegar, então `useKeepAwake` (que solta no unmount) nunca soltava — efeito "enquanto visível" vai em `useFocusEffect`;
- **`File.move` é assíncrono** no expo-file-system 57 e três gravações concorrentes do índice se atropelaram, com a promise rejeitada aparecendo **na tela** do app;
- um **Sheet válido** (com `file_url`, sem corpo) renderizava **tela vazia**, porque `isValidContent` o aprova e o corpo é nulo — o T1-R26 proíbe tela vazia em silêncio;
- o **primeiro login se anunciava `src=restored`**, porque a marca "entrou nesta execução" vivia no ouvinte do Firebase, que dispara **durante** a chamada de login.

**(d) Um instrumento pode medir a coisa errada e mesmo assim dar verde.** O mock do A21 devolvia um `code` fora do contrato: o veredito "passa" era correto (o cache ficou intacto) e a **conclusão que se tiraria dele** — "o caminho de erro de servidor está exercitado" — era falsa. Corolário: o instrumento se confere contra o **contrato**, não contra o resultado que ele produz.

**(e) Requisito e comentário do requisito não são a mesma coisa.** O **T1-R14 stricto** ("arquivo garantido fica em armazenamento não purgável") passou em todas as provas da #287, enquanto a **nota** dele — a razão de existir, `Paths.document` × `Paths.cache` da N0-H16 §4 — não se cumpria para um arquivo que chegou por download sob demanda. O aceite no device foi o que separou os dois, e virou o D-a. **H17 é o mesmo padrão do lado da hipótese**: o fato medido é verdadeiro, a frase que o acompanha é falsa.

**(f) Concorrência copiada do web cria uma classe de defeito nova no nativo.** `store.ts` herdou do web o padrão "grava no `.tmp` e move", que lá é síncrono. No RN o `move` devolve promise: a gravação "atômica" virou uma corrida de três. O padrão latente estava nos **dois** arquivos e foi corrigido nos dois, antes de o segundo dar sintoma.

**(g) Nome de anexo nunca difere só por caixa** (div. 35) — no macOS é o mesmo arquivo, e o segundo screencap sobrescreve o primeiro em silêncio. Regra do Marcel para a perda: **refazer só se for prova sem outro instrumento**; se o logcat já provou, registrar a perda e seguir.

**(h) Estado de bloco é artefato de repositório, não de memória de sessão** (§11).

---

## 11. Herança

### Bloco D (web — morre com a web, mas até lá é o que o Marcel usa)

- **O editor não lista músicas já presentes na setlist**, o que **impede criar um bis pela UI** — embora o backend aceite (a constraint foi dropada no B5). Consequência medida no N1: o A12 só se prova por fixture, e nenhuma das 3 setlists da audit tem bis. **Defeito do web encontrado pelo aceite do nativo.**
- Poluição de `content_data` pelo editor (`content_data.content_data`, 9 registros) e a limpeza.
- Cookie de 7 dias × token de 1 h; **login Google não funciona** (H18, cliente OAuth sinalizado para exclusão por inatividade).
- **B11** (busca no servidor com `unaccent`/`pg_trgm`) — o nativo busca local e não depende disso.
- Achados A-1/A-2 das policies do storage.

### B8 (housekeeping de pipeline)

- **151 erros** de `tsc -p tsconfig.test.json`.
- `coverage.thresholds` fictício.

### N2 (tela 2) — o que a tela 1 deixou explicitamente de fora

- **Criação e edição**: a tela 1 é **leitura**. Escrever (content, setlist, reordenar) é a tela 2 — e é o que fecha o A10 real.
- **Cascata content × storage (B5-D6)** e reconciliação de órfãos.
- **B1.5**, **B9** (idempotência do `POST /api/content`), **B10** (restrição de referrer da API key — reavaliar **agora que o app existe**: o nativo usa a mesma chave).
- **Maestro** (N1-D3): não instalado; a doc não lista API 32. Continua hipótese inteira, com a restrição de que **a senha nunca entra por automação**.
- **A10 real e H17**: datar uma setlist da principal na janela e pôr um arquivo nela.
- **`fitPolicy`**: se virar página a gesto único voltar a importar, a saída não é `{2}` — é paginação por **tap na borda** também em PDF, ou fit width com botão de página.
- **Prova do D-g**: a primeira PR **core-only** depois da #290 tem de conferir que o `android-debug-apk` **não** dispara (§5). Se disparar, o recorte falhou e é divergência.

### B-final

- **Revogação do bypass secret** da Vercel.

### Regra nova de processo — estado de bloco

O `n1-execution-state.md` foi citado durante o N1 como se consolidasse o estado do bloco, e **não estava no repositório**: vivia em `~/.claude/projects/…/memory/`, junto de outros oito (b3, b5, b6, b7, c, n0, n1-pr0, n1-precheck). Decisão do Marcel (2026-09-11):

1. **A fonte de cada bloco é o seu `*-ENCERRAMENTO.md`** — e é isso que este bloco de fato consumiu: o N1-PRECHECK cita `N0-ENCERRAMENTO.md` §6/§10/§11 e `B7-ENCERRAMENTO.md` §9, nunca um arquivo de memória. Os encerramentos existem para B3, B5, B6, B7, C e N0 `[medido: ls docs/ux docs/native]`.
2. **O bruto do N1 entra como anexo** — [`N1-anexos/n1-execution-state.md`](N1-anexos/n1-execution-state.md), copiado como está, com cabeçalho dizendo que é **rastro de sessão, não fonte**. Onde o anexo e este documento divergirem, **este documento vence** (a série do N1-h3 no anexo, por exemplo, mistura runs de `pull_request` e de `push` — §5 é a correção).
3. **Os oito anteriores ficam onde estão**, não versionados, e este encerramento declara isso. Não se reconstrói o que já tem encerramento no repo.
4. **Daqui em diante**: estado de bloco é **artefato de repositório**. O encerramento é a fonte única; o bruto entra como anexo do próprio bloco, no mesmo commit. Registrado também no [`CLAUDE.md`](../../CLAUDE.md).

---

## 12. Estado final

**Emulador `octavia_tab32`** (API 32): app instalado, **com sessão da conta de audit** (o login da #290, depois que o A2 da #289 deslogou por construção), cache e arquivos no disco, avião **desligado e provado**, SDK antes = depois, Metro morto.

**Tab S6 `RX2N8000F3D`** (SM-T865, API 32): app instalado, **sessão da conta principal viva**, cache real restaurado por sync, o arquivo promovido pelo D-a **permanece em `Paths.document`** (`1751910900697-Easy_-_Guitar.pdf`, 138.916 B, sha256 `1e1d77c4…`). Configuração devolvida: `screen_off_timeout` **30000**, `accelerometer_rotation` **1**, avião **0**, `adb reverse --remove-all`. A conta de audit foi apagada do tablet pelo `pm clear` do aceite.

**Repositório**: `main` em `6a9315d`; `docs/native/N1-PRECHECK.md` não editado (histórico — as correções vivem nas erratas). Nenhum worktree extra.

**O que o Marcel pode fazer hoje, com o tablet na mão**: abrir o app já logado, ver as duas setlists da conta principal, entrar em qualquer música, virar página com o polegar na borda, ampliar a cifra até 40 dp sem a linha re-quebrar, ligar o auto-scroll, buscar qualquer música da biblioteca inteira e voltar exatamente para onde estava — **com o avião ligado, e com a tela acesa o show inteiro**.
