# QL-ENCERRAMENTO-anexos — o release do bloco no Tab (A-QL-21) e o rastro do encerramento

**PR** `ql/encerramento`, árvore `../octavia-ql-encerramento` sobre `origin/main` = **`ea5e891`**
(`ea5e891eb634d882a570f5a26e37b781a45b7b09`, o merge da [#376](https://github.com/marcelviana/octavia/pull/376), a QL-PR4)
`[medido: git fetch origin; git log origin/main]`. `pnpm install --frozen-lockfile --offline`. A árvore `../octavia-ql-pr4` foi
removida antes, com `git status --short` vazio e **sem `--force`**. Fonte do bloco: [`../QL-ENCERRAMENTO.md`](../QL-ENCERRAMENTO.md).
Molde: [`../N4-ENCERRAMENTO-anexos/`](../N4-ENCERRAMENTO-anexos/README.md). **Nenhuma linha de código de produto muda.**

- **Quando**: 2026-10-10, 09:45–12:12 (o build 09:45–09:53; o AVD 09:54–10:01; o Tab 10:24–12:10).
- `[medido]` = comando + saída literal nesta sessão, no arquivo citado; `[lido]` = do arquivo citado; `[hipótese]` = o resto.
  **Nenhum texto, título, artista ou nome de arquivo de música** (regra 10): do dado real saem só o `id8`, contagens e
  comprimentos; o uid do log abreviado (`<…>`); o nome do PDF baixado trocado pelo marcador (§6).
- **Autorizado pelo prompt do encerramento**: o `adb` no Tab e no AVD; o `apps/native/.env` que o build exige, copiado sem
  ler, conferido por sha256 e apagado; as leituras dos syncs que o release faz sozinho no Tab.

| arquivo | o quê |
|---|---|
| `estado/build.txt` · `estado/build-serie.tsv` · `estado/apk.txt` | o build (`builds.sh … R1`) e a conferência do APK |
| `estado/tab-inicio.txt` · `estado/tab-install.txt` · `estado/tab-aviao.txt` · `estado/tab-fim.txt` | o Tab lido, o `install -r` e a 1ª abertura (o sync 1), o avião (regra 11) e a volta, o fim |
| `estado/tab-nota-sync.txt` · `estado/tab-nota-reabrir.txt` · `estado/tab-nota-dump.txt` | A-QL-20: o sync 2 (a nota), o sync 3 (a reabertura), o dump do palco recolhido (só `resource-id`) |
| `estado/avd-inicio.txt` · `estado/avd-install.txt` · `estado/avd-fim.txt` | o AVD lido, o release instalado, o fim |
| `quedas/` | o CN do `quedas.py`, a abertura de teste e as 100 + 100 aberturas frias |
| `a3/a3-sem-caminho.txt` | A3: por que o custo no Hermes não se mede no release sem mudar código |
| `a4/q-escolha.sql` · `a4/prova-local/` · `a4/saida-marcel.txt` · `a4/escolha.md` | A4: a consulta, a prova no Postgres local, a saída do Marcel verbatim e o critério da escolha |

Os instrumentos são os de blocos anteriores, **rodados onde estão** (N4-D117: *"os atuais não se movem"*):
`N4-ENCERRAMENTO-anexos/instrumentos/frias-release.sh`, `N4-PR9-anexos/instrumentos/quedas.py` e
`W4B3-anexos/builds.sh`. Nenhum instrumento novo.

---

## 1. O estado inicial `[medido: estado/tab-inicio.txt, estado/avd-inicio.txt]`

**O Tab** (`RX2N8000F3D`), travado: `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **o release
`cf58f7f`** (sha256 do instalado `070187bf…` = `release-cf58f7f.apk`), `lastUpdateTime=2026-10-10 07:40:21` — o fim da volta da
QL-PR4 (`QL-PR4-anexos/volta/estado/tab-depois.txt`). `stay_on` a **7** antes de pedir o destravar.

**O AVD** `octavia_tab32`, subido do `default_boot` com `-no-snapshot-save`: `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0
data=0`, `reverse` vazio, o dev client de 2026-09-24 14:00:01 (`DEBUGGABLE`), `ping` → *Network is unreachable*, `ram.bin` de
2026-09-24 14:00 — o repouso do `APARATO.md`.

## 2. A1 — o release da `main` `[medido: estado/build.txt, estado/build-serie.tsv, estado/apk.txt]`

A receita do `APARATO.md` ("Build de release") e do `N4-ENCERRAMENTO-anexos/README.md` §2, sem diferença: o `.env` por `cp -p`
do checkout principal (sha256 `f2bfa179cd8e` nos dois, `git check-ignore` → `.gitignore:23`), o `$TMPDIR/metro-cache` apagado,
nenhum `apps/native/android`, `sh docs/native/W4B3-anexos/builds.sh <scratchpad>/serie.tsv R1`; o `.env` apagado logo depois
(`ls` → *No such file or directory*).

```
R1  release  09:45:52  prebuild 4  gradle 460  total 464  exit 0  105220413 B  · BUILD SUCCESSFUL in 7m 36s
```

| | |
|---|---|
| saiu de | `main` = `ea5e891eb634d882a570f5a26e37b781a45b7b09` (o merge da #376) |
| sha256 | **`65209b80f94af377905586dd762257823cc30752ef0d50c5cd4c4a30582c680a`** |
| tamanho | **105.220.413 B** (universal, quatro ABIs) |
| bundle | `assets/index.android.bundle` 2.389.408 B, bytecode do Hermes (`c6 1f bc 03`) |
| aponta para | `octavia.rocks` **1** · `localhost:8788` **0** · `localhost:8081` **0** |
| assinatura | `CN=Android Debug`, `fac61745…033b9c` — o mesmo certificado do dev client e dos releases anteriores (div. 372); **sem** `application-debuggable` |
| guardado em | `~/octavia-aparato/tab-s6-release/release-ea5e891.apk` (fora do repositório), sha256 conferido na cópia |

**O terceiro release frio**: **464 s** (prebuild 4 + gradle 460), contra 369 s (div. 998) e 488 s (`N4-ENCERRAMENTO-anexos` §2) —
**n=3**, de árvores diferentes; vai à herança da medição fria do W5 (`N4-ENCERRAMENTO.md` §10.5.7).

**O Tab repousa com este release** (errata de caminho no `APARATO.md`, neste commit).

## 3. A2 — as 100 + 100 aberturas frias (A-QL-21, QL-D9, regra 36) `[medido: quedas/]`

O instrumento é o do N4 (`frias-release.sh`: `force-stop` + `am start -W` da `MainActivity`, o S1 de pé por `resource-id`,
`logcat -G 16M` e `-c` **uma vez** antes; a contagem pelo `quedas.py`). O CN do `quedas.py` verde nesta sessão
(`quedas/quedas-cn.txt`: a amostra dá nativas=1 e, sem a linha `Fatal signal`, 0). Os dois aparelhos **em avião** — o AVD
já repousa assim; o Tab pela regra 11 (§4).

```
== avd-release: aberturas=100 S1=100 sem-S1=0 · tombstones do app novos no dropbox=0
== linhas OCTAVIA da rodada: 900 · api=0 · sync skip=100 · auth restored=100
quedas do app: java=0 · nativas=0 · (a contagem antiga, a subcadeia FATAL: 0)

== tab-release: aberturas=100 S1=100 sem-S1=0 · tombstones do app novos no dropbox=0
== linhas OCTAVIA da rodada: 700 · api=0 · sync skip=100 · auth restored=100
quedas do app: java=0 · nativas=0 · (a contagem antiga, a subcadeia FATAL: 0)
```

`TotalTime` do `am start -W`: AVD mín 184 · mediana 213 · máx 369 ms; Tab mín 213 · mediana 228 · máx 248 ms (n=100 cada). O
`dropbox` do Tab sem `data_app_crash`, `data_app_native_crash` nem `SYSTEM_TOMBSTONE` no dia inteiro (`estado/tab-fim.txt`), e
o `quedas.py` sobre a sessão inteira do Tab, no fim, com os julgamentos: Java 0 · nativa 0. **A condição do A-QL-21 — zero queda
nativa nos dois aparelhos — está cumprida.** (Uma abertura de teste no AVD antes da rodada: S1, 0 queda, 0 `api`.)

## 4. O release no Tab, e o avião `[medido: estado/tab-install.txt, estado/tab-aviao.txt]`

Com o Marcel tendo destravado (`isKeyguardShowing=false`), Metro `0`, `reverse` vazio: `install -r` → `Success`,
`lastUpdateTime=2026-10-10 10:24:45`, sem `DEBUGGABLE`, **sha256 do instalado `65209b80…`**. **A 1ª abertura, com rede, é o sync
autorizado** (regra 38 (b), declarado antes): `auth … src=restored` (sem login), `sync start`, `api status=200
path=/api/setlists` e `path=/api/content`, `cache write … invalidated=0` nos dois, `sync ok setlists=2 content=63 pages=1
t=3634`, `prefetch plan n=0 reason=library` — **nenhum download**; S1 (`buscar`, `criar-setlist`).

O avião (regra 11): `airplane=0 wifi=1 data=1` → `cmd connectivity airplane-mode enable` → `airplane=1 wifi=3 data=1` (o
`wifi=3` é a div. 997), `ping` → *connect: Network is unreachable*. As 100 frias (§3). **Restaurado** com o app aberto em S1:
`airplane=0 wifi=1 data=1`, `ping` 2/2; `net online` às 10:40:55 e **0 `api`** desde a volta — **a regra 38 (d) remedida neste
build: a volta da rede com o app aberto não sincroniza**, como no `31d6b3a` e no `cf58f7f` (o código de sync não mudou no QL).

## 5. A3 — o custo de `quebrar` no Hermes, no release (QL-D51) `[medido: a3/a3-sem-caminho.txt]`

**Sem caminho sem mudar código**, e por isso a sessão parou ali e perguntou (o prompt o manda). O instrumento da QL-PR3
(`QL-PR3-anexos/instrumentos/custo-hermes.mjs`) pede o inspetor do Hermes (CDP, `Runtime.evaluate`) e o módulo `quebra.ts`
achável pelo caminho no bundle que o Metro serve. No release: as cadeias `Debugger.enable` e `Runtime.evaluate` aparecem **0**
vezes no `libhermesvm.so` e no `libreactnative.so` (no dev client, 1 e 1), e o bundle é bytecode sem o caminho do módulo
(`packages/core/src/quebra` → 0). As três opções propostas: (a) um release medidor do mesmo commit só no AVD; (b) o mesmo
também no Tab; (c) não medir. **Decisão do Marcel `[2026-10-10]` — a (c), QL-D61**, verbatim: *"A3: opção (c). O número do dev
client (QL-PR3 §9: mediana 1,6–2,7 ms, máximo 12,6 ms) fica como teto, registrado como QL-D61 no encerramento. Vai ao W5, como
herança, 'um caminho para medir desempenho no release sem mudar o código do app', com a QL-D51 apontando para ela."*

## 6. A4 — a escolha das músicas, sem ler o texto `[medido: a4/]`

**A consulta** (`a4/q-escolha.sql`), só de leitura, no molde da Fase B do pre-check: para a conta principal, as Letras com a
maior linha acima de 55 colunas — `conta`, `id8`, `maior_linha`, `linhas_acima_48`. Nenhum texto, título ou artista.
**Provada antes** num Postgres 17.11 local e descartável (subido no scratchpad, parado e apagado), com uma fixture do projeto
(`a4/prova-local/fixture.sql`: quatro Letras da conta, uma de 55 que fica fora, uma Cifra longa que fica fora, uma Letra nula e
uma de outra conta com 90 colunas que não pode contar; uma delas com 60 `é` para provar `char_length`): a saída
(`a4/prova-local/saida-psql.txt`) é a esperada, linha a linha.

**O Marcel a rodou** no SQL Editor; a saída verbatim em `a4/saida-marcel.txt`: **11 Letras, `conta` = `xVDJ` nas 11** — as
mesmas 11 que passam de 55 no pre-check (`QL-PRECHECK.md` §10.1), a maior com **77**.

**A escolha** (`a4/escolha.md`), uma música por julgamento:

| julgamento | critério | id8 |
|---|---|---|
| A-QL-15 — V em C (55 col.) | a maior linha mais longa | **`f0523c5e`** (77; 15 linhas > 48) |
| A-QL-13 — palco em pé, zoom 22 (48 col.) | das que sobram, a com mais linhas > 48 | **`8ca6316a`** (64; 10 > 48) |
| A-QL-14 — palco deitado, zoom 40 (44 col.) | das que sobram, a maior linha mais longa | **`69735e94`** (75) |

## 7. A5 — os julgamentos do Marcel, no Tab, com o release e as músicas dele `[Marcel, 2026-10-10]`

Cada pergunta pedia *sim ou não, com a razão*; a razão não veio escrita em nenhuma, e fica assim.

| aceite | a pergunta | a resposta, verbatim |
|---|---|---|
| **A-QL-15** | a `f0523c5e` em V, deitado (55 colunas), se lê com a quebra? | **"Sim."** |
| **A-QL-13** | a `8ca6316a` no palco em pé, zoom padrão (48), a letra quebrada se lê? | **"Sim"** |
| **A-QL-14** | a `69735e94` no palco deitado, zoom 40 (44), a letra quebrada se lê? | **"Sim."** |
| **A-QL-16** | no palco deitado, zoom 22, alguma música dele parece diferente de antes? (esperado: não — a maior linha é 77 < 80) | **"Não."** |

Durante os quatro, **0 `api`** no log (o app já aberto; só navegação e `zoom dp=…`).

**A-QL-20 — a primeira nota de verdade** `[medido: estado/tab-nota-*.txt]`:

1. **O Marcel escreveu uma nota** no campo *Notas* de uma música dele, **no site** — a escrita é dele (o título ele disse na
   conversa; não entra aqui).
2. **O sync** — o executor reabriu o app pelo `adb` (`force-stop` + `am start -W`): `sync start`, 2 `api status=200`,
   **`cache write kind=content n=65 invalidated=3`**, `sync ok … content=65`, `prefetch plan n=1 reason=library` e **um
   download** de 451.924 B (`file src=download …`, o nome trocado pelo marcador — traz título e artista reais). **O sync trouxe a
   música** — e mais duas, novas, da biblioteca dele (div. 1249).
3. No palco, a nota: **"Sim"** (se lê). Ele a recolheu e fechou o app.
4. **A reabertura** — ele não achou o ícone do app para abrir de novo (div. 1250); o executor abriu pelo `adb` (o processo
   morto: abertura fria) — o sync 3: 2 `api status=200`, `invalidated=0`, `prefetch plan n=0`. A mesma música no palco: **o
   dump** (`estado/tab-nota-dump.txt`, só `resource-id`): `notas-regua` **presente**, `notas-texto` **ausente** — recolhida
   depois da abertura fria. A resposta: **"Sim"** (aparece recolhida) e **"Sim"** (o recolher funciona).

## 8. O estado final `[medido: estado/tab-fim.txt, estado/avd-fim.txt]`

| | |
|---|---|
| o Tab | **o release `ea5e891`** (`65209b80…`), `lastUpdateTime=2026-10-10 10:24:45`, sem `DEBUGGABLE`; `stay_on` **0** (o lido), `accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio — **igual ao lido**; os XML de dump apagados do `/sdcard`; a conta e o cache dele intactos (o release não tem `run-as`: nada do cache foi lido nem escrito pelo executor; o que mudou foi pelos syncs do próprio app) |
| o AVD | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, `reverse` vazio, `ping` *unreachable* — igual ao lido; `emu kill` **sem salvar**: o `ram.bin` do `default_boot` segue de 2026-09-24 14:00, e o release instalado nesta sessão some no próximo boot (o dev client de 2026-09-24 volta) |
| `.env` | apagado logo depois do build; nenhum valor lido |
| fica, fora do repositório | `~/octavia-aparato/tab-s6-release/release-ea5e891.apk` — **o release de repouso**; o `release-cf58f7f.apk`, o `release-31d6b3a.apk` e o dev client continuam onde estavam |

## 9. Contabilidade da Parte A

| | |
|---|---|
| syncs do release (regra 38 (c)) | **3** — a 1ª abertura (10:24), a reabertura da nota (11:55), a reabertura do recolher (12:07) |
| `GET /api/*` em prod | **6** (`/api/setlists` e `/api/content` p. 1, em cada sync) |
| downloads de storage | **1** (451.924 B, a garantia de arquivos no sync 2, de uma música nova da biblioteca) |
| escritas em prod pelo executor | **0** (`OCTAVIA: write` → 0 no log do Tab) |
| escritas **do Marcel** | a nota, no site (A-QL-20) — **dele**; e as duas músicas novas que o sync 2 achou (div. 1249), fora do roteiro desta sessão |
| logins · `.env*` abertos | **0 · 0** (`src=restored` nos dois aparelhos; o `.env` copiado sem ler) |
| aparelhos | Tab: `stay_on` 0 → 7 → 0, avião ligado e desligado (regra 11), release trocado (`cf58f7f` → `ea5e891`); AVD: em avião do começo ao fim, desligado sem salvar |
| builds | 1 release (464 s, frio) |
| banco local | 1 Postgres 17.11 descartável (a prova da consulta), parado e apagado |
| código | nenhuma linha |

## 10. Divergências da Parte A — 1248 a 1251

A última usada era a **1247** (`QL-PR4-anexos/README.md` §14.9) `[medido: git grep -nE '^\| \*\*(1[12][0-9]{2})\*\* \| [A-Z] \|' --
docs → 73 números de 1175 a 1247, cada um uma vez; nenhum ≥ 1248]`. Origem: **P** premissa do prompt · **D** documento anterior ·
**A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1248** | D | A QL-D51 (`QL-PR3-anexos/README.md` §16; `QL-REQUISITOS.md` §3, o encerramento) manda medir o custo de `quebrar` **no release**, com a mesma fixture; o único instrumento (`custo-hermes.mjs`) depende do inspetor do Metro, que o release não tem (§5) | **QL-D61**: o número do dev client como teto; o W5 herda o caminho de medir no release sem mudar o código |
| **1249** | A | O sync da nota (A-QL-20) trouxe **3** músicas mudadas (`invalidated=3`, 63 → **65**) e **1 download** (451.924 B): entre o sync das 10:24 e o das 11:55 entraram duas músicas novas na biblioteca do Marcel, e uma delas tem PDF | registrado (§7, §9); a contabilidade conta o download; a mudança é do Marcel |
| **1250** | A | O Marcel fechou o app e **não achou o ícone** para abrir de novo; o app tem a atividade de lançador (`cmd package resolve-activity … LAUNCHER` → `rocks.octavia.app/.MainActivity`) — o executor reabriu pelo `adb` | registrado; observação de uso, não defeito do bloco — candidata a herança (o ícone do app, bloco de identidade), §8 do `QL-ENCERRAMENTO.md` |
| **1251** | P | O prompt manda dizer ao Marcel **o id8** de cada música; ele pediu, para as próximas vezes, **o título** (com o id8, ele consulta o banco pelo título) | memória do executor: o título vai **na conversa**, nunca no anexo (regra 10) |

**Contagem**: 4 — D 1 · A 2 · P 1. A próxima livre é a **1252**.
