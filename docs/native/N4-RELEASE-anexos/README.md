# N4-RELEASE-anexos — o release da `main` no Tab S6 (o leitor novo no aparelho, sem Metro)

**PR** `n4/release-tab`, árvore `../octavia-n4-release` sobre `origin/main` = `31d6b3a` (o merge da
[#355](https://github.com/marcelviana/octavia/pull/355), a PR-2 — o leitor). `pnpm install --frozen-lockfile --offline`.
Fonte do bloco: [`N4-PRECHECK.md`](../N4-PRECHECK.md). **Nenhuma linha de código muda**: esta PR é só este README e uma
errata no [`APARATO.md`](../APARATO.md).

- **Por quê**: o app do Tab era o **dev client**, que só carrega o JavaScript pelo Metro (`N4-PR2-anexos/README.md` §9,
  div. 989). Fora de uma sessão com Metro, o conserto da PR-2 não estava no aparelho.
- **O que se fez**: o build de release da `main` pela receita do W4-b3, instalado por `adb install -r` sobre o dev client,
  com dados e sessão mantidos; a prova do leitor novo no palco, **com o Metro parado e o `adb reverse` vazio do começo ao
  fim**.
- **Quando**: build em 2026-10-01 20:46–20:52; instalação 20:53; a prova no aparelho em 2026-10-02 08:35–08:37 (o Marcel
  destravou o Tab de manhã).
- `[medido]` = comando + saída literal nesta sessão, aqui. **Nenhum texto, título, artista ou nome de arquivo de música**:
  do dado real só saem ordinal (a ordem do `content.json`), tipo, `id[:8]`, comprimento, `sha256[:12]` e igual/diferente.
  O uid aparece abreviado (`xVDJ…`); o nome do PDF, como `<arquivo>`; o id da setlist, como `<id>`.

---

## 0. A PR-2 na `main` `[medido]`

```
$ git fetch && git grep -n "textoDasSecoes" origin/main -- packages/core/src
origin/main:packages/core/src/content-contract.ts:72:function textoDasSecoes(data: Record<string, unknown>): string | null | undefined {
origin/main:packages/core/src/content-contract.ts:116:    const secoes = textoDasSecoes(data) // (e): as seções vencem o `chords` do topo
origin/main:packages/core/src/content-contract.ts:134:    const secoes = textoDasSecoes(data)
$ git log --oneline -1 origin/main
31d6b3a Merge pull request #355 from marcelviana/n4/pr2-leitor
```

## 1. Antes de instalar `[medido]`

**Estado do Tab** (`RX2N8000F3D`, `SM_T865`), pela receita do `APARATO.md` — `stay_on` posto em 7 logo depois de lido,
antes de pedir o destravar:

```
stay_on=0
stay_on agora=7
system accelerometer_rotation = 1
system user_rotation = 0
global airplane_mode_on = 0
global wifi_on = 1
global mobile_data = 1
reverse:

[fim reverse]
    versionCode=1 minSdk=24 targetSdk=36
    versionName=0.0.1
    firstInstallTime=2026-09-07 18:08:54
    lastUpdateTime=2026-09-23 19:11:34
    pkgFlags=[ DEBUGGABLE HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]
  mWakefulness=Dozing
```

**O cache** (com o app parado: `pidof` exit 1, `am force-stop`), por `run-as` — ainda o dev client:

```
b62f192a347e0adac05e405f92f9711d  content.json
3b949a0ca222bef2b3873be931a5eda1  files-index.json
7a5f4e1026862a05fca5f6435f6658ae  setlists.json
05253d4239dadb2696115b934a546bb1  files/<arquivo>
demanda (cache/octavia-<uid>/files/): total 6 — só . e ..
```

Os quatro md5 são **os mesmos do fim do aceite da PR-2** (`N4-PR2-anexos/aceite-tab.txt`, "md5 do cache DEPOIS"): nada
mudou no cache entre as duas sessões. Uma cópia do `content.json` foi para o scratchpad da sessão, **só** para o
instrumento achar o título de busca de cada ordinal (sem imprimir nenhum); apagada no fim (§5). Os ordinais conferem com
os da PR-2: `1 Lyrics 69735e94` · `3 Chords 9e97565f seções` · `8 Chords a9ed7dc4 seções` · `9 Sheet b23a3803`.

**O dev client, guardado fora do repositório** (é ele que volta ao Tab quando um aceite precisar do mock — N4-D55):

```
$ adb shell pm path rocks.octavia.app
package:/data/app/~~iVOvF3Z3-2JOkFxU8ELpBA==/rocks.octavia.app-s5oJZGCXQbQUPufB3Vgp5A==/base.apk
$ adb pull <base.apk> ~/octavia-aparato/tab-s6-devclient/devclient-2026-09-23-191134.apk
1 file pulled, 0 skipped. 36.4 MB/s (82030412 bytes in 2.151s)
$ shasum -a 256 ~/octavia-aparato/tab-s6-devclient/devclient-2026-09-23-191134.apk
9447edc76f329ba3f66f3badd16268e52c779f1ae3363f6c6b94d1f2d4ab0548
```

Um `base.apk` só (sem splits), 82.030.412 B — o tamanho do dev client single-ABI que o `APARATO.md` registra (div. 253).

**Metro e túneis**: `lsof -iTCP:8081 -sTCP:LISTEN | wc -l` → `0`; `lsof -iTCP:8788 …` → `0`; `adb reverse --list` vazio.
Assim do começo ao fim (§3, §5).

## 2. Construir e conferir `[medido]`

**O segredo** (autorizado `[Marcel, 2026-10-01]` só para esta sessão), pela origem da B1 do pre-check, sem abrir:

```
$ cp -p ../octavia/apps/native/.env apps/native/.env ; shasum -a 256 (os dois)
f2bfa179cd8e…  ../octavia/apps/native/.env
f2bfa179cd8e…  apps/native/.env
$ git check-ignore -v apps/native/.env
.gitignore:23:.env*	apps/native/.env
```

**A receita dos documentos** (`APARATO.md` "Build de release"; `RELEASE-FAIXA.md` "Como se mede"; o §9 do
`N4-PR2-anexos/README.md`) — igual à do prompt; nenhuma diferença:

```
$ rm -rf "$TMPDIR/metro-cache" ; ls -d "$TMPDIR/metro-cache"
ls: /var/folders/…/T//metro-cache: No such file or directory
$ ls apps/native/android
ls: apps/native/android: No such file or directory
$ git rev-parse HEAD
31d6b3ad0f1dedab6eb1592eb72ae80b88ad3ff6
$ sh docs/native/W4B3-anexos/builds.sh <scratchpad>/serie.tsv R1
inicio 20:46:20
fim 20:52:34
rotulo	variante	inicio	prebuild_s	gradle_s	total_s	exit	apk_bytes	lib_armeabi-v7a	lib_arm64-v8a	lib_x86	lib_x86_64	picker_no_apk
R1	release	20:46:24	3	366	369	0	105139397	16783152	24296128	25297248	25078448	so=0,dex=5
… BUILD SUCCESSFUL in 6m 3s · 862 actionable tasks: 862 executed
```

**O APK**:

| | |
|---|---|
| saiu de | `main` = `31d6b3ad0f1dedab6eb1592eb72ae80b88ad3ff6` |
| sha256 | `6eae4a8b48e827fc4b6bbf86e398547b55dd84af7c0de08e391e25bcb95307b9` |
| tamanho | **105.139.397 B** (universal, quatro ABIs) |
| guardado em | `~/octavia-aparato/tab-s6-release/release-31d6b3a.apk` (fora do repositório; div. 996) |

**O que tem dentro**:

```
$ unzip -l <apk> | grep index.android.bundle
  2308392  01-01-1981 01:01   assets/index.android.bundle
$ unzip -p <apk> assets/index.android.bundle | head -c 4 | xxd
00000000: c61f bc03                                ....
$ grep -ac octavia.rocks   → 1
$ grep -ac localhost:8788  → 0
$ grep -ac localhost:8081  → 0
$ grep -ac textoDasSecoes  → 0
```

- **O bundle está embutido** (2.308.392 B), e é **bytecode do Hermes** (os quatro primeiros bytes `c6 1f bc 03` são o
  número mágico do formato).
- **Aponta para `octavia.rocks`** (1) e **não** para o mock (0), nem para o Metro (0).
- **O nome `textoDasSecoes` dá zero**: o Hermes não guarda nomes de função locais. Pelo que o prompt mandou, **nada se
  conclui dele**. Procurei um literal do código novo que sobrevivesse: o diff do `content-contract.ts` da PR-2 só traz
  literais que já existiam (`'\n'`, `'\n\n'`, `'Chords'`, `'no-body'`, `'text'`…) e a chave `sections`, que aparece 1 vez
  na tabela de strings — mas `sections` também é a prop do `SectionList` do React Native, que está no bundle. **Também não
  prova nada.** A prova do leitor é a do §4.

**Assinatura**, os dois APKs (`apksigner verify --print-certs`, `aapt dump badging`):

```
== R1.apk
Signer #1 certificate DN: CN=Android Debug, OU=Android, O=Unknown, L=Unknown, ST=Unknown, C=US
Signer #1 certificate SHA-256 digest: fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c
package: name='rocks.octavia.app' versionCode='1' versionName='0.0.1' …
== devclient-2026-09-23-191134.apk
Signer #1 certificate DN: CN=Android Debug, OU=Android, O=Unknown, L=Unknown, ST=Unknown, C=US
Signer #1 certificate SHA-256 digest: fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c
package: name='rocks.octavia.app' versionCode='1' versionName='0.0.1' …
application-debuggable
```

O mesmo pacote, o mesmo certificado (o da div. 372); só o dev client é `application-debuggable`.

## 3. Instalar `[medido]`

Com o Tab ainda travado (`isKeyguardShowing=true`; o `install` não precisa da tela):

```
$ adb install -r <R1.apk>
Performing Streamed Install
Success
    versionCode=1 minSdk=24 targetSdk=36
    versionName=0.0.1
    firstInstallTime=2026-09-07 18:08:54
    lastUpdateTime=2026-10-01 20:53:35
    pkgFlags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]
$ adb shell run-as rocks.octavia.app ls
run-as: package not debuggable: rocks.octavia.app
```

**A sessão mantida**. O Marcel destravou (`isKeyguardShowing=false`); Metro `0`, `reverse` vazio; `logcat -c` uma vez, e:

```
$ adb shell am start -W -n rocks.octavia.app/.MainActivity
TotalTime: 338
WaitTime: 346
10-02 08:35:22.697 OCTAVIA: faixa=B w=711.1 h=1137.8
10-02 08:35:22.699 OCTAVIA: net online
10-02 08:35:23.752 OCTAVIA: auth uid=xVDJ… src=restored
10-02 08:35:23.814 OCTAVIA: cache hit kind=setlists n=2
10-02 08:35:23.814 OCTAVIA: cache hit kind=content n=63
10-02 08:35:23.849 OCTAVIA: sync start
10-02 08:35:23.850 OCTAVIA: auth refresh=cached
10-02 08:35:27.337 OCTAVIA: api status=200 path=/api/setlists n=1 ms=3488
10-02 08:35:27.384 OCTAVIA: auth refresh=cached
10-02 08:35:27.857 OCTAVIA: api status=200 path=/api/content n=1 ms=474
10-02 08:35:27.911 OCTAVIA: cache write kind=setlists n=2 invalidated=0
10-02 08:35:27.920 OCTAVIA: cache write kind=content n=63 invalidated=0
10-02 08:35:27.920 OCTAVIA: sync ok setlists=2 content=63 pages=1 t=4071
10-02 08:35:27.923 OCTAVIA: prefetch plan n=0 reason=7d
```

e a tela, pelos `resource-id` do dump (sem texto): `buscar`, `criar-setlist`, `setlist-772076b4`, `setlist-e39d57cf`,
`baixar-772076b4` — **a lista de setlists (S1), sem pedir login**: `auth … src=restored`.

**O que o release deixa medir do cache, e o que não deixa**:

| deixa | não deixa |
|---|---|
| que o cache estava lá: `cache hit kind=setlists n=2` e `kind=content n=63` **antes** do sync | o md5 dos arquivos (`content.json`, `setlists.json`, `files-index.json`, o PDF): sem `run-as` |
| que o sync não trocou nenhum item: `invalidated=0` | a pasta de demanda (`cache/octavia-<uid>/files/`) |
| que o PDF está no disco: `file src=disk … bytes=138916` (§4), o mesmo tamanho da PR-2 | ler o `content.json` para achar os títulos — por isso a cópia veio **antes** do `install` (§1) |
| que o corpo do palco vem do cache sem rede: as Cifras reabertas em avião (§4) | guardar e regravar o cache pela receita do `APARATO.md` (ela é `run-as`) |

As linhas `OCTAVIA:` **saem** no `logcat` do release, como no W4-b3 (`W4B3-anexos/RELEASE-aparelho.txt`), e o
`uiautomator dump` funciona igual.

## 4. A prova no aparelho, sem Metro `[medido]`

**O sync de leitura**: o do §3 — **2 requests**, `GET /api/setlists` e `GET /api/content` (página 1), ambos 200. Nenhum
outro na sessão:

```
$ adb logcat -d -s ReactNativeJS:V | grep -c 'OCTAVIA: api '
2
```

**O palco**. Instrumento no scratchpad (fora do commit): S1 → `buscar` → `campo-busca` limpo com `MOVE_END` + `DEL`, o maior
trecho contínuo do título em ASCII por `input text` (a receita consertada na div. 995) → toque em `resultado-<id8>` →
`uiautomator dump` → o nó `corpo` medido em memória (comprimento e `sha256[:12]`) → `BACK` duas vezes.

```
3 · Chords · 9e97565f · nó=corpo · len=2029 · sha12=1b7a6ac7c5ef
8 · Chords · a9ed7dc4 · nó=corpo · len=32 · sha12=5699489a26b4
1 · Lyrics · 69735e94 · nó=corpo · len=1831 · sha12=8eaa08ad353f
9 · Sheet · b23a3803 · nó=s3d · len=- · sha12=-
```

**Contra a tabela do aceite da PR-2** (`N4-PR2-anexos/README.md` §7, "depois do sync 2"):

| ordinal | tipo | len · sha12 — release, sem Metro | len · sha12 — PR-2 (dev client, depois do sync 2) | | leitor velho (v, PR-2) |
|---|---|---|---|---|---|
| 3 | Cifra, seções | 2029 · `1b7a6ac7c5ef` | 2029 · `1b7a6ac7c5ef` | **igual** | 2027 |
| 8 | Cifra, seções | 32 · `5699489a26b4` | 32 · `5699489a26b4` | **igual** | 10 |
| 1 | Letra | 1831 · `8eaa08ad353f` | 1831 · `8eaa08ad353f` | **igual** | 1831 |
| 9 | Partitura | nó `s3d` | nó `s3d` | **igual** | — |

- **Ninguém editou nada desde aquele aceite**: o sync deu `invalidated=0`, e os md5 do cache antes do `install` eram os do
  fim da PR-2 (§1). Não houve "diferente" a perguntar ao Marcel.
- **É o leitor novo**: o ordinal 3 tem **2029** e o 8 tem **32** — os comprimentos do leitor novo; o velho daria **2027** e
  **10** (a coluna (v) da PR-2). A Letra, que o conserto não toca, segue em 1831.
- **A Partitura abre**, igual à PR-2:

```
10-02 08:36:46.024 OCTAVIA: keepawake on
10-02 08:36:46.040 OCTAVIA: file src=disk name=<arquivo> bytes=138916
10-02 08:36:46.041 OCTAVIA: prefetch plan n=0 reason=demand
10-02 08:36:46.335 OCTAVIA: pdf-render pages=5 src=disk
10-02 08:36:46.355 OCTAVIA: pdf-page n=1/5
10-02 08:36:48.837 OCTAVIA: keepawake off
```

- `FATAL` no `logcat` da rodada inteira: **0**.

**Em avião** (regra 11: lido, declarado, ligado, provado pelo `ping`, restaurado):

```
antes: airplane=0 wifi=1 data=1
$ cmd connectivity airplane-mode enable
ligado: airplane=1 wifi=3 data=1
$ ping -c 2 -W 2 8.8.8.8
connect: Network is unreachable
3 · Chords · 9e97565f · nó=corpo · len=2029 · sha12=1b7a6ac7c5ef
8 · Chords · a9ed7dc4 · nó=corpo · len=32 · sha12=5699489a26b4
$ cmd connectivity airplane-mode disable
depois: airplane=0 wifi=1 data=1
$ ping -c 2 -W 3 8.8.8.8
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 17.449/20.557/23.666/3.111 ms
OCTAVIA: net offline
OCTAVIA: keepawake on · keepawake off · keepawake on · keepawake off
OCTAVIA: net online
```

As duas Cifras reabriram **sem rede com o mesmo sha12**. O `net online` da volta não disparou sync (a contagem de `api`
seguiu em 2). O `wifi=3` com o avião ligado é a div. 997.

## 5. Desmontagem `[medido]`

```
$ adb logcat -d | grep -c FATAL
0
$ rm -f apps/native/.env ; ls apps/native/.env
ls: apps/native/.env: No such file or directory
$ adb reverse --list
(vazio)
$ lsof -iTCP:8081 -sTCP:LISTEN | wc -l
       0
$ adb shell settings put global stay_on_while_plugged_in 0 ; (as leituras)
global stay_on_while_plugged_in = 0
system accelerometer_rotation = 1
system user_rotation = 0
global airplane_mode_on = 0
global wifi_on = 1
global mobile_data = 1
$ adb shell dumpsys package rocks.octavia.app | grep -E "lastUpdateTime|firstInstallTime|pkgFlags"
    firstInstallTime=2026-09-07 18:08:54
    lastUpdateTime=2026-10-01 20:53:35
    pkgFlags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]
```

- **O Tab fica com o release** (N4-D55). `stay_on`, rotação, avião, wifi e dados como lidos no §1.
- **Temporários apagados**: no scratchpad, a cópia do `content.json`, o `dump.xml`, o diretório do build (logs do Gradle,
  o APK de lá, o bundle extraído) — `ls` → *No such file or directory* nos três; na árvore, o `apps/native/android` do
  prebuild (`ls` → *No such file or directory*); `git status` vazio antes do commit de docs.
- **Ficam, fora do repositório, de propósito**: `~/octavia-aparato/tab-s6-devclient/devclient-2026-09-23-191134.apk` e
  `~/octavia-aparato/tab-s6-release/release-31d6b3a.apk` (a ida e a volta da N4-D55; div. 996). O `$TMPDIR/metro-cache`
  apagado no §2 foi recriado pelo build — é o cache comum do Metro, não um temporário desta sessão.

## 6. Contabilidade

| | |
|---|---|
| requests a `/api/*` em prod | **2 `GET`** (um sync de leitura: `/api/setlists`, `/api/content` p. 1) |
| requests a terceiros | **0** |
| escritas em prod | **0** |
| logins | **0** (`auth … src=restored`) |
| `.env*` | `apps/native/.env`, cópia por `cp -p` do checkout principal (sha256 `f2bfa179cd8e…` nos dois), não aberto, **apagado** |
| aparelho | Tab S6, destravado pelo Marcel; `stay_on` 0 → 7 → 0; avião ligado e desligado (regra 11); `adb reverse` vazio do começo ao fim; Metro nunca subiu; app trocado de dev client para **release** (fica) |
| builds | **1** release (`builds.sh … R1`, 369 s, `metro-cache` frio — div. 998) |
| agentes | **0** |
| código | **nenhuma linha** |
| docs | este README; uma errata no `APARATO.md` |

## 7. Decisões `[Marcel, 2026-10-01]`

| # | decisão |
|---|---|
| **N4-D54** | A N4-D53 passa a valer para o **bloco N4 inteiro**: o aceite no aparelho é medido pelo executor onde for comparável por instrumento; ao Marcel cabe o que só o olho e a mão julgam (legibilidade, toque, gesto), além de destravar o aparelho. |
| **N4-D55** | O Tab S6 passa a ficar com o **release** instalado; aceite que precisar do mock troca para o dev client guardado e **devolve o release no fim**, com o mesmo `install -r`. *(Os dois APKs e os sha256: §1, §2; a receita: a errata do `APARATO.md`.)* |

## 8. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
  # N4 release no Tab: nenhuma declaração — só docs.
```

```gates-web
  # só docs — N4 release no Tab: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

## 9. Divergências — 996 a 998

A última usada era a **995** (`N4-PR2-anexos/README.md` §12) `[medido: git grep -nE '^\| \*\*(99[0-9]|1[0-9]{3})\*\*' -- docs]`
— os `1138` que o padrão também acha são larguras de tabela do I1, não divergências. Origem: **P** premissa do prompt ·
**D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **996** | P | O prompt manda guardar só o **dev client**; a N4-D55 manda **devolver o release** no fim de todo aceite com mock, e para isso o APK de release tem de estar guardado também (refazê-lo custa ~6 min e pode sair de outra `main`). Guardei os dois, dito na conversa no ato e declarado aqui depois — **extra** | `~/octavia-aparato/tab-s6-release/release-31d6b3a.apk`, sha256 `6eae4a8b…`; na errata do `APARATO.md` |
| **997** | A | Com o avião ligado, `wifi_on` lê **3**, não 0 (o Android guarda "desligado pelo avião, religar na volta"). O aceite da PR-2 não registrou a leitura durante o avião. A prova continua sendo o `ping` (regra 1), e na volta lê 1 | registrado |
| **998** | D | A herança **§7.5** do `W4-ENCERRAMENTO.md` (*"uma medição fria do release … a próxima PR que medir release"*): este build partiu com o `metro-cache` **apagado** — o primeiro release frio — e deu **369 s** (prebuild 3 + gradle 366), contra a mediana quente de 358 s (n=3). É **n=1**, de outra árvore e com 9.504 B a mais de APK; não entrou no `RELEASE-FAIXA.md`, que esta PR não tinha mandato para mexer | registrado aqui; a §7.5 segue aberta com este dado — decisão do Marcel |

**Contagem**: 3 — P 1 · A 1 · D 1.

---

**O que vem depois no bloco** (N4-D45): **o brief do desenho**, e depois dele a **PR-3 — core das frases**.
