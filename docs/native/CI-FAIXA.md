# CI-FAIXA — a série do `android-debug-apk`

**A fonte única de todo número de CI do APK neste projeto** (W4-b2, 2026-09-23).
As faixas anteriores — a da V1-PR6 (`n=12`, `V1-ENCERRAMENTO.md` §8), as do W1, W2
e W3 (`n=13…18`) e a série descritiva do N2 (`n=21`, `N2-ENCERRAMENTO.md` §7) —
**deixam de ser referência**: são recortes desta série, e ficam onde estão, como
registro do que se sabia em cada momento.

**A regra** (`LOGS-OCTAVIA.md`, "Errata W4-b2"): todo número de CI se cita **com `n`
e o nível ao lado** (job, passo ou run; ver a tabela dos níveis no
`LOGS-OCTAVIA.md`), e a fonte é este arquivo. Um número sem `n` é uma medição, não
uma referência (div. 80).

## A referência

**Nível job** (`startedAt → completedAt` do `android-debug-apk`), **todas as
corridas que produziram APK**, `pull_request` e `push`, desde a primeira
(`[medido: gh run list --workflow=native.yml · gh run view <id> --json jobs]`):

```
n=91   mín 4m42s   máx 14m32s   mediana 11m47s   Q1 9m24s   Q3 12m43s   IQR 3m20s
```

Quartis pelo método inclusivo (interpolação linear, `statistics.quantiles(…,
method='inclusive')`, o "tipo 7"). **95 corridas** no total; **4 falhas** ficam na
tabela, riscadas, e **fora da população**: nenhuma produziu APK (duas eram
controle negativo plantado, duas o `setup-android@v3`), e o tempo delas, de 26 s a
1m14s, é o de um passo que quebrou, não o de um build.

As corridas de causa medida **estão dentro** e marcadas na coluna "causa". **Leia a
faixa com elas**: o mínimo, 4m42s, é do regime de antes da #284, quando o APK ainda
não tinha o native-stack nem os peers nativos. Com uma faixa assim, sair **por
baixo** quase não acontece mais; o alarme útil é o de cima e o da falha rápida.

### Recortes — descritivos, **não** referência

| recorte | n | mín | máx | mediana | Q1 | Q3 | IQR |
|---|---|---|---|---|---|---|---|
| só `pull_request` | 59 | 5m21s | 14m11s | 11m52s | 9m38s | 12m44s | 3m07s |
| desde a #284 (o regime do native-stack) | 75 | 8m09s | 14m32s | 12m10s | 11m03s | 12m50s | 1m47s |
| desde o `setup-android@v4` (#302) | 46 | 8m09s | 14m32s | 12m30s | 10m22s | 12m52s | 2m30s |

Escolher um recorte como referência é escolher um corte, e o corte é decisão do
Marcel. **O teto de 14m11s, "intacto" desde a V1**, caiu na corrida 93 (push da
#321 na `main`, 14m32s). A causa não foi medida.

## O preço do B8.1, na série inteira

O `paths` do `pull_request` é avaliado contra o diff acumulado da PR. Até a W4-b2
isso custou **14 corridas com APK de pushes que não tocaram nenhum caminho do
filtro, 156m51s** (a coluna "gatilho" diz **só fora do filtro**; mais uma falha de
26 s). Somam-se **3 pushes forçados cuja árvore só mudou em docs** (#315: 35m10s),
que o N2 contou entre os seus 7. O H1 da W4-b2 filtra os 14, e os forçados
**não**: com um `before` que não é ancestral, na dúvida o APK roda (div. 353).

## A série

`gatilho`, para `pull_request`: **abertura** (o primeiro evento da branch);
**nativo** (o push tocou `apps/native/**`, o `native.yml` ou o
`pnpm-workspace.yaml`, medido por `git diff --name-only <antes> <depois>`); **só
fora do filtro** (não tocou nenhum dos três); **push forçado** (o `antes` não é
ancestral do `depois`). `setup` é a versão do `android-actions/setup-android`.

| # | run | evento | PR | head | gatilho | setup | início (UTC) | job | causa / nota |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `34117343294` | PR | #265 | `dcbebad` | abertura | v3 | 2026-09-07 11:34 | ~~0m40s~~ | **falha plantada** — CN do N0-PR2: plugin inexistente no prebuild `[medido: gh run view --log-failed]` |
| 2 | `34117642858` | PR | #265 | `322a48c` | nativo | v3 | 2026-09-07 11:47 | **5m33s** | regime pré-#284 |
| 3 | `34126002356` | push | #265 | `aca0002` | merge na `main` | v3 | 2026-09-07 13:11 | **9m26s** | regime pré-#284 |
| 4 | `34127828871` | PR | #266 | `6ccf644` | abertura | v3 | 2026-09-07 13:31 | ~~1m14s~~ | **falha plantada** — CN do N0-PR3: erro de tipo em `src/api.ts` `[medido: idem]` |
| 5 | `34128158232` | PR | #266 | `6a5a8bf` | nativo | v3 | 2026-09-07 13:34 | **5m21s** | regime pré-#284 |
| 6 | `34129780874` | push | #266 | `8bb2948` | merge na `main` | v3 | 2026-09-07 13:52 | **6m46s** | regime pré-#284 |
| 7 | `34133725283` | PR | #267 | `63d0c4b` | abertura | v3 | 2026-09-07 14:34 | **6m58s** | regime pré-#284 |
| 8 | `34146190080` | push | #267 | `9310ba7` | merge na `main` | v3 | 2026-09-07 17:06 | **4m42s** | regime pré-#284 |
| 9 | `34147586179` | PR | #268 | `1fccc4c` | abertura | v3 | 2026-09-07 17:26 | **8m03s** | regime pré-#284 |
| 10 | `34160851483` | push | #268 | `40da95c` | merge na `main` | v3 | 2026-09-07 20:49 | **7m03s** | regime pré-#284 |
| 11 | `34389506702` | PR | #277 | `0da66c8` | abertura | v3 | 2026-09-09 18:36 | **6m55s** | regime pré-#284 |
| 12 | `34391117063` | push | #277 | `3f82390` | merge na `main` | v3 | 2026-09-09 18:47 | **7m19s** | regime pré-#284 |
| 13 | `34484129145` | PR | #282 | `8bf69a4` | abertura | v3 | 2026-09-10 13:40 | **7m39s** | regime pré-#284 |
| 14 | `34484255719` | PR | #282 | `fe5f58b` | **só fora do filtro** | v3 | 2026-09-10 13:41 | **7m08s** | regime pré-#284 |
| 15 | `34485672668` | push | #282 | `1816472` | merge na `main` | v3 | 2026-09-10 13:55 | **6m40s** | regime pré-#284 |
| 16 | `34486542479` | PR | #283 | `966215e` | abertura | v3 | 2026-09-10 14:03 | **6m56s** | regime pré-#284 |
| 17 | `34486686394` | PR | #283 | `17d7841` | **só fora do filtro** | v3 | 2026-09-10 14:04 | **5m57s** | regime pré-#284 |
| 18 | `34488090147` | push | #283 | `db89e82` | merge na `main` | v3 | 2026-09-10 14:17 | **7m24s** | regime pré-#284 |
| 19 | `34495434672` | PR | #284 | `9806e44` | abertura | v3 | 2026-09-10 15:24 | **14m11s** | **entra o native-stack e os peers nativos** — fim do regime de ~6–7 min `[lido: N1-ENCERRAMENTO.md:159]` |
| 20 | `34499344864` | push | #284 | `6f30f02` | merge na `main` | v3 | 2026-09-10 16:00 | **12m30s** |  |
| 21 | `34511721960` | PR | #285 | `08b84d6` | abertura | v3 | 2026-09-10 18:01 | **11m57s** |  |
| 22 | `34513868030` | push | #285 | `5d5cf1d` | merge na `main` | v3 | 2026-09-10 18:22 | **12m45s** |  |
| 23 | `34517017178` | PR | #286 | `fc079bd` | abertura | v3 | 2026-09-10 18:52 | **11m22s** |  |
| 24 | `34522240072` | push | #286 | `23c00d2` | merge na `main` | v3 | 2026-09-10 19:45 | **13m23s** |  |
| 25 | `34526729763` | PR | #287 | `b1090a5` | abertura | v3 | 2026-09-10 20:29 | **11m45s** |  |
| 26 | `34533092029` | push | #287 | `dc261df` | merge na `main` | v3 | 2026-09-10 21:36 | **8m56s** |  |
| 27 | `34535253485` | PR | #288 | `898d07f` | abertura | v3 | 2026-09-10 22:01 | **10m15s** |  |
| 28 | `34541666142` | push | #288 | `568db1e` | merge na `main` | v3 | 2026-09-10 23:20 | **11m14s** |  |
| 29 | `34597905011` | PR | #289 | `f43f81a` | abertura | v3 | 2026-09-11 12:14 | **11m39s** |  |
| 30 | `34599949499` | push | #289 | `c2fa635` | merge na `main` | v3 | 2026-09-11 12:38 | **12m20s** |  |
| 31 | `34602544498` | PR | #290 | `d83d94f` | abertura | v3 | 2026-09-11 13:07 | **11m35s** |  |
| 32 | `34610061441` | push | #290 | `6a9315d` | merge na `main` | v3 | 2026-09-11 14:25 | **8m54s** |  |
| 33 | `34720311405` | PR | #294 | `4d70445` | abertura | v3 | 2026-09-12 21:33 | **11m07s** |  |
| 34 | `34726569641` | push | #294 | `26452f9` | merge na `main` | v3 | 2026-09-12 23:53 | **12m00s** |  |
| 35 | `34771766466` | PR | #296 | `da5bbf1` | abertura | v3 | 2026-09-13 17:30 | **13m18s** |  |
| 36 | `34772936264` | push | #296 | `2db81ce` | merge na `main` | v3 | 2026-09-13 17:53 | **12m01s** |  |
| 37 | `34777518972` | PR | #297 | `cb31a40` | abertura | v3 | 2026-09-13 19:23 | **9m16s** |  |
| 38 | `34778219856` | PR | #297 | `b95a6bc` | **só fora do filtro** | v3 | 2026-09-13 19:36 | **12m21s** |  |
| 39 | `34778251051` | push | #297 | `9a7fa6e` | merge na `main` | v3 | 2026-09-13 19:37 | **11m20s** |  |
| 40 | `34780911672` | PR | #298 | `4cb3b22` | abertura | v3 | 2026-09-13 20:29 | **11m55s** |  |
| 41 | `34781671264` | PR | #298 | `74b339b` | **só fora do filtro** | v3 | 2026-09-13 20:43 | **11m53s** |  |
| 42 | `34782356827` | PR | #298 | `b1f7b4c` | **só fora do filtro** | v3 | 2026-09-13 20:57 | **11m52s** |  |
| 43 | `34784211143` | PR | #298 | `1e5ad7c` | **só fora do filtro** | v3 | 2026-09-13 21:34 | **10m41s** |  |
| 44 | `34788589042` | push | #298 | `1ba1557` | merge na `main` | v3 | 2026-09-13 23:03 | **12m32s** |  |
| 45 | `34791936599` | PR | #299 | `b348da9` | abertura | v3 | 2026-09-14 00:12 | **12m32s** |  |
| 46 | `34792694124` | PR | #299 | `615d6a8` | **só fora do filtro** | v3 | 2026-09-14 00:26 | **11m40s** |  |
| 47 | `34841137826` | push | #299 | `72bdb38` | merge na `main` | v3 | 2026-09-14 12:01 | **13m22s** |  |
| 48 | `34909653662` | PR | #301 | `83a11b4` | abertura | v3 | 2026-09-14 23:38 | ~~0m31s~~ | **falha de ambiente** — `setup-android@v3`: `Failed to find package 'tools'` `[medido: idem; native.yml, LOGS-OCTAVIA]` |
| 49 | `34910579325` | PR | #302 | `717104e` | abertura | v4 | 2026-09-14 23:49 | **12m43s** | primeira com `setup-android@v4` (#302) |
| 50 | `34910768494` | PR | #301 | `c7b10d5` | **só fora do filtro** | v4 | 2026-09-14 23:52 | ~~0m26s~~ | **falha de ambiente** — idem |
| 51 | `34966363353` | push | #302 | `7a13452` | merge na `main` | v4 | 2026-09-15 12:00 | **10m27s** |  |
| 52 | `34966774801` | PR | #301 | `5b80df0` | push forçado | v4 | 2026-09-15 12:04 | **9m19s** |  |
| 53 | `34975012521` | push | #301 | `f58259e` | merge na `main` | v4 | 2026-09-15 13:26 | **12m26s** |  |
| 54 | `35015930984` | PR | #303 | `f498f6c` | abertura | v4 | 2026-09-15 19:49 | **12m37s** |  |
| 55 | `35026669769` | push | #303 | `cbff070` | merge na `main` | v4 | 2026-09-15 21:37 | **10m59s** |  |
| 56 | `35044913963` | PR | #304 | `192b954` | abertura | v4 | 2026-09-16 01:39 | **12m46s** | #304, branch artificial do W3 (fechada sem merge); o W3 diz "cancelado", o `gh` diz `success` (div. 354) |
| 57 | `35045454235` | PR | #305 | `440aa1a` | abertura | v4 | 2026-09-16 01:47 | **9m44s** |  |
| 58 | `35046199666` | PR | #305 | `f70d988` | **só fora do filtro** | v4 | 2026-09-16 01:59 | **12m53s** |  |
| 59 | `35094310127` | PR | #305 | `712f054` | nativo | v4 | 2026-09-16 12:10 | **12m52s** | o W3 a registrou "só de docs"; o push tocou `apps/native/scripts/` e `apps/native/test/` (div. 354) |
| 60 | `35096488810` | PR | #305 | `3575e4b` | **só fora do filtro** | v4 | 2026-09-16 12:33 | **11m47s** |  |
| 61 | `35098537171` | push | #305 | `9e14042` | merge na `main` | v4 | 2026-09-16 12:54 | **9m55s** |  |
| 62 | `35155759267` | PR | #309 | `9e88c3c` | abertura | v4 | 2026-09-16 22:04 | **12m33s** |  |
| 63 | `35156800868` | PR | #309 | `e5c1ec1` | nativo | v4 | 2026-09-16 22:16 | **12m50s** |  |
| 64 | `35538341300` | PR | #309 | `e949cc9` | **só fora do filtro** | v4 | 2026-09-20 21:19 | **12m50s** |  |
| 65 | `35586376779` | PR | #309 | `cbe1a4b` | **só fora do filtro** | v4 | 2026-09-21 10:00 | **9m31s** |  |
| 66 | `35610812531` | PR | #309 | `bd250f3` | **só fora do filtro** | v4 | 2026-09-21 14:14 | **12m50s** |  |
| 67 | `35642620083` | push | #309 | `adf32e6` | merge na `main` | v4 | 2026-09-21 19:05 | **8m31s** |  |
| 68 | `35655296020` | PR | #312 | `4b6a510` | abertura | v4 | 2026-09-21 21:07 | **12m10s** |  |
| 69 | `35658439776` | push | #312 | `5f1c226` | merge na `main` | v4 | 2026-09-21 21:39 | **13m42s** |  |
| 70 | `35663577954` | PR | #314 | `70e77be` | abertura | v4 | 2026-09-21 22:36 | **9m21s** |  |
| 71 | `35665914430` | PR | #314 | `da67e45` | nativo | v4 | 2026-09-21 23:05 | **12m39s** |  |
| 72 | `35668235295` | push | #314 | `fedfd24` | merge na `main` | v4 | 2026-09-21 23:35 | **12m43s** |  |
| 73 | `35723549642` | PR | #315 | `25c00ee` | abertura | v4 | 2026-09-22 11:48 | **13m28s** | primeiro build com módulo nativo novo desde o N1 (div. 234) — nota, causa não medida |
| 74 | `35738242548` | PR | #315 | `bb9a427` | **só fora do filtro** | v4 | 2026-09-22 14:08 | **13m11s** |  |
| 75 | `35739888971` | PR | #315 | `a3061e6` | push forçado | v4 | 2026-09-22 14:22 | **12m59s** |  |
| 76 | `35739924367` | PR | #315 | `a1f3f54` | push forçado | v4 | 2026-09-22 14:23 | **8m09s** | **cache do runner** — a mesma árvore da `35738242548` (13m11s) mais um parágrafo de anexo `[div. 253]` |
| 77 | `35740988227` | PR | #315 | `c8db83a` | push forçado | v4 | 2026-09-22 14:32 | **14m02s** |  |
| 78 | `35746115122` | PR | #315 | `a904057` | nativo | v4 | 2026-09-22 15:16 | **11m58s** |  |
| 79 | `35757759179` | push | #315 | `0fa1b75` | merge na `main` | v4 | 2026-09-22 16:59 | **12m29s** |  |
| 80 | `35766146681` | PR | #316 | `7aea968` | abertura | v4 | 2026-09-22 18:17 | **12m31s** |  |
| 81 | `35772931849` | PR | #316 | `93c8a13` | nativo | v4 | 2026-09-22 19:18 | **13m26s** |  |
| 82 | `35775486850` | push | #316 | `8bd4281` | merge na `main` | v4 | 2026-09-22 19:42 | **13m09s** |  |
| 83 | `35780792936` | PR | #317 | `53cafdd` | abertura | v4 | 2026-09-22 20:31 | **10m19s** |  |
| 84 | `35785657879` | PR | #317 | `85f2988` | nativo | v4 | 2026-09-22 21:16 | **12m52s** |  |
| 85 | `35797083138` | push | #317 | `f991eb0` | merge na `main` | v4 | 2026-09-22 23:22 | **13m05s** |  |
| 86 | `35801102126` | PR | #318 | `4dcdb94` | abertura | v4 | 2026-09-23 00:13 | **8m37s** |  |
| 87 | `35846524323` | push | #318 | `426f4cc` | merge na `main` | v4 | 2026-09-23 10:03 | **11m41s** |  |
| 88 | `35865083143` | PR | #319 | `f4f88db` | abertura | v4 | 2026-09-23 13:09 | **10m20s** |  |
| 89 | `35867694118` | PR | #319 | `de9e655` | nativo | v4 | 2026-09-23 13:31 | **12m15s** |  |
| 90 | `35871287733` | push | #319 | `bc55419` | merge na `main` | v4 | 2026-09-23 14:02 | **10m06s** |  |
| 91 | `35878220044` | PR | #321 | `de79967` | abertura | v4 | 2026-09-23 14:59 | **13m38s** |  |
| 92 | `35878553708` | PR | #321 | `b00f7b5` | **só fora do filtro** | v4 | 2026-09-23 15:02 | **12m17s** |  |
| 93 | `35883169067` | push | #321 | `e9b4196` | merge na `main` | v4 | 2026-09-23 15:40 | **14m32s** | **acima do teto de todas as faixas anteriores** (14m11s); causa não medida |
| 94 | `35884529077` | PR | #322 | `931f3e0` | abertura | v4 | 2026-09-23 15:50 | **10m10s** |  |
| 95 | `35885921847` | PR | #322 | `34bc96a` | nativo | v4 | 2026-09-23 16:02 | **11m29s** |  |

## Como acrescentar uma linha

Uma linha por corrida, **nível job**, dos carimbos, nunca do relógio de quem
acompanha:

```
gh run list --workflow=native.yml --limit 20 \
  --json databaseId,event,headBranch,headSha,conclusion,createdAt
gh run view <id> --json jobs \
  --jq '.jobs[] | select(.name=="android-debug-apk") | "\(.conclusion) \(.startedAt) \(.completedAt)"'
```

O cabeçalho (`n`, mín, máx, mediana, quartis) se **recalcula** a cada linha nova:
uma estatística que não acompanha a tabela é a div. 110 outra vez. Corrida
`skipped` (o H1: push sem nativo) **não entra**, porque não houve build; ela vive no
`gh pr checks` da PR. A corrida que o próprio push de docs de um encerramento
dispara entra na PR **seguinte** (o precedente do W3, §7). A primeira a entrar
depois desta é o push da #322 na `main`.
