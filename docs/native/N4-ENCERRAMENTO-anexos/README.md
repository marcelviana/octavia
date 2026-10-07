# N4-ENCERRAMENTO-anexos — o release do bloco no Tab (A-N4-28) e o rastro do encerramento

**PR** `n4/encerramento`, árvore `../octavia-n4-encerramento` sobre `origin/main` = `cf58f7f` (o merge da
[#365](https://github.com/marcelviana/octavia/pull/365), a N4-PR9). `pnpm install --frozen-lockfile --offline`.
Fonte do bloco: [`../N4-ENCERRAMENTO.md`](../N4-ENCERRAMENTO.md). **Nenhuma linha de código de produto muda.**

- **Quando**: 2026-10-07, 16:55–17:51 (o build 16:56–17:04; o AVD 17:05–17:15; o Tab 17:15–17:50).
- `[medido]` = comando + saída literal nesta sessão, no arquivo citado. **Nenhum texto, título ou nome de arquivo de
  música**: do dado real saem só contagens, `id[:8]`, comprimento e `sha256[:12]`; o uid abreviado (`<…>`).
- **Autorizado `[Marcel, 2026-10-07]`, só para esta sessão**: o `adb` no Tab S6 e no AVD; o `apps/native/.env` que o build
  exige, copiado como nas outras vezes, sem ler nem imprimir valor; as leituras de um sync real no Tab.

| arquivo | o quê |
|---|---|
| `estado/tab-inicio.txt` · `estado/tab-fim.txt` | o Tab lido antes e depois (settings, `reverse`, o pacote e o sha256 do instalado) |
| `estado/avd-inicio.txt` · `estado/avd-install.txt` · `estado/avd-fim.txt` | o AVD lido, o `install -r` do release, o fim |
| `estado/build.txt` · `estado/build-serie.tsv` · `estado/apk.txt` | o build (`builds.sh … R1`) e a conferência do APK |
| `estado/tab-install.txt` · `estado/tab-aviao.txt` | o `install -r` no Tab, a 1ª abertura (o sync) e o avião (regra 11) |
| `quedas/frias-avd.txt` · `quedas/frias-tab.txt` | as 100 + 100 aberturas frias, abertura a abertura, e o `quedas.py` |
| `prova-dado-real.txt` | a prova do bloco no dado real (três passadas; a 1ª com o defeito do instrumento, div. 1137) |
| `favoritar-marcel.txt` | as linhas de log das escritas que o Marcel fez pela estrela (só o `id[:8]`) |
| `instrumentos/frias-release.sh` · `instrumentos/prova-dado-real.py` | os dois instrumentos desta sessão |

---

## 1. O estado inicial `[medido: estado/tab-inicio.txt, estado/avd-inicio.txt]`

**O Tab** (`RX2N8000F3D`), travado, `stay_on` lido e posto a 7 antes de pedir o destravar:

```
global stay_on_while_plugged_in = 0      → 7
system accelerometer_rotation = 1 · system user_rotation = 0
global airplane_mode_on = 0 · global wifi_on = 1 · global mobile_data = 1
reverse: (vazio)
lastUpdateTime=2026-10-07 14:15:07 · pkgFlags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]
sha256 do instalado: 6eae4a8b48e827fc4b6bbf86e398547b55dd84af7c0de08e391e25bcb95307b9   (= release-31d6b3a.apk)
run-as: package not debuggable: rocks.octavia.app
```

**Os md5 que o release permite ler: nenhum do cache** (sem `run-as`; `N4-RELEASE-anexos/README.md` §3). O que se lê é o
sha256 do `base.apk` instalado — o do release anterior, como a N4-PR9 o deixou (`N4-PR9-anexos/README.md` §4.6).

**Os dois APKs guardados fora do repositório**, contra o `APARATO.md`:

```
9447edc76f329ba3f66f3badd16268e52c779f1ae3363f6c6b94d1f2d4ab0548  ~/octavia-aparato/tab-s6-devclient/devclient-2026-09-23-191134.apk
6eae4a8b48e827fc4b6bbf86e398547b55dd84af7c0de08e391e25bcb95307b9  ~/octavia-aparato/tab-s6-release/release-31d6b3a.apk
```

**O AVD** `octavia_tab32`, subido com `-no-snapshot-save`: `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`,
`reverse` vazio, o dev client de `2026-09-24 14:00:01` (`DEBUGGABLE`), `ping` → *Network is unreachable*, `ram.bin` de
2026-09-24 14:00 — o repouso do `APARATO.md`.

## 2. O APK `[medido: estado/build.txt, estado/build-serie.tsv, estado/apk.txt]`

A receita do `N4-RELEASE-anexos/README.md` §2, sem diferença: o `.env` por `cp -p` do checkout principal (sha256
`f2bfa179cd8e…` nos dois, `git check-ignore` → `.gitignore:23`), o `$TMPDIR/metro-cache` apagado, nenhum
`apps/native/android`, `sh docs/native/W4B3-anexos/builds.sh <scratchpad>/serie.tsv R1`.

```
R1  release  16:56:23  prebuild 3  gradle 485  total 488  exit 0  105194421 B  · BUILD SUCCESSFUL in 8m 2s · 862 actionable tasks: 862 executed
```

| | |
|---|---|
| saiu de | `main` = `cf58f7fdac560404ae2a07c84b9d6e38e1c83159` (o merge da #365) |
| sha256 | **`070187bf6a5931072afac3f76112905eab732df22d22ad7044048ec70a658e91`** |
| tamanho | **105.194.421 B** (universal, quatro ABIs) |
| bundle | `assets/index.android.bundle` 2.363.416 B, bytecode do Hermes (`c6 1f bc 03`) |
| aponta para | `octavia.rocks` **1** · `localhost:8788` **0** · `localhost:8081` **0** |
| assinatura | `CN=Android Debug`, certificado `fac61745…033b9c` — o mesmo do dev client e do release anterior (div. 372); **sem** `application-debuggable` |
| guardado em | `~/octavia-aparato/tab-s6-release/release-cf58f7f.apk` (fora do repositório), sha256 conferido na cópia |

O `.env` foi apagado logo depois do build (`ls` → *No such file or directory*). **O segundo release frio** (o
`metro-cache` apagado antes): **488 s** (prebuild 3 + gradle 485), contra os 369 s do primeiro (div. 998) — n=2, de
árvores diferentes; vai à herança da medição fria (`../N4-ENCERRAMENTO.md` §10).

## 3. O teste de queda no AVD (N4-D105 d) `[medido: estado/avd-install.txt, quedas/frias-avd.txt]`

`install -r` do release sobre o dev client: `Success`, `lastUpdateTime=2026-10-07 17:04:52`, `pkgFlags` **sem**
`DEBUGGABLE`, a sessão da conta de audit mantida (`auth … src=restored`). O AVD já repousa em avião: `airplane=1 wifi=0
data=0`, `ping` → *Network is unreachable* — nada a ligar nem a restaurar.

O instrumento, `instrumentos/frias-release.sh`: por abertura, `force-stop` + `am start -W` da `MainActivity` e o S1 de pé
(o `resource-id` `criar-setlist` ou `buscar` num dump); `logcat -G 16M` e `logcat -c` **uma vez** antes; a contagem é a do
`N4-PR9-anexos/instrumentos/quedas.py` (a Java, **a nativa** e os tombstones do dropbox; CN `--cn` verde nesta sessão).
Uma abertura de teste antes (S1, 0 quedas, 0 `api`).

```
== avd-release: aberturas=100 S1=100 sem-S1=0 · tombstones do app novos no dropbox=0
== linhas OCTAVIA da rodada: 900 · api=0 · sync skip=100 · auth restored=100
quedas do app: java=0 · nativas=0 · (a contagem antiga, a subcadeia FATAL: 0)
tombstones do app no dropbox: 0
```

`TotalTime` do `am start -W`: mín 544 · mediana 629 · máx 1029 ms (n=100). **Zero queda nativa: segue-se para o Tab.**

O plano de arquivos roda mesmo sem rede: na conta de audit do AVD, `prefetch plan n=2 reason=library` e 2 linhas
`download-error … rejected` por abertura — **o comportamento registrado** da div. 1066 / N4-D92 (*"O log não muda"*,
`N4-PR7-anexos/README.md:104-107`); nenhuma requisição sai (avião, `api=0`).

## 4. O release no Tab `[medido: estado/tab-install.txt]`

Com o Marcel tendo destravado (`isKeyguardShowing=false`), Metro `0`, `reverse` vazio:

```
$ adb install -r release-cf58f7f.apk
Success
    lastUpdateTime=2026-10-07 17:15:00
    pkgFlags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]
sha256 instalado 070187bf6a5931072afac3f76112905eab732df22d22ad7044048ec70a658e91
$ adb shell am start -W -n rocks.octavia.app/.MainActivity
TotalTime: 259
17:15:06.760 OCTAVIA: faixa=C w=1137.8 h=711.1
17:15:06.761 OCTAVIA: net online
17:15:07.647 OCTAVIA: auth uid=<…> src=restored
17:15:07.707 OCTAVIA: cache hit kind=setlists n=2
17:15:07.707 OCTAVIA: cache hit kind=content n=63
17:15:07.739 OCTAVIA: sync start
17:15:11.028 OCTAVIA: api status=200 path=/api/setlists n=1 ms=3288
17:15:11.528 OCTAVIA: api status=200 path=/api/content n=1 ms=439
17:15:11.574 OCTAVIA: cache write kind=setlists n=2 invalidated=0
17:15:11.583 OCTAVIA: cache write kind=content n=63 invalidated=0
17:15:11.584 OCTAVIA: sync ok setlists=2 content=63 pages=1 t=3845
17:15:11.587 OCTAVIA: prefetch plan n=0 reason=library
```

e a tela (só `resource-id`): `buscar`, `criar-setlist`, `setlist-772076b4`, `setlist-e39d57cf`, `baixar-772076b4` — **S1 sem
pedir login**. **Esta abertura, com rede, é o sync do passo 6** (div. 1136): 2 `GET` 200, `invalidated=0`, e o plano de
arquivos com **n=0** — o único arquivo da conta já estava no disco.

## 5. O teste de queda no Tab (regra 11) `[medido: estado/tab-aviao.txt, quedas/frias-tab.txt]`

```
antes:  airplane=0 wifi=1 data=1
$ cmd connectivity airplane-mode enable
ligado: airplane=1 wifi=3 data=1          (o wifi=3 é a div. 997)
$ ping -c 2 -W 2 8.8.8.8
connect: Network is unreachable
```

```
== tab-release: aberturas=100 S1=100 sem-S1=0 · tombstones do app novos no dropbox=0
== linhas OCTAVIA da rodada: 700 · api=0 · sync skip=100 · auth restored=100
quedas do app: java=0 · nativas=0 · (a contagem antiga, a subcadeia FATAL: 0)
tombstones do app no dropbox: 0
```

`TotalTime`: mín 218 · mediana 227 · máx 243 ms (n=100). O anel do `logcat` do Tab aceita no máximo 5 MiB (*"MAX log buffer
size is 5 MiB"*); as 700 linhas `OCTAVIA:` da rodada couberam (a contagem por abertura é cumulativa desde o `-c`).

**Restaurado**, com o app aberto em S1: `cmd connectivity airplane-mode disable` → `airplane=0 wifi=1 data=1`; o `ping` deu
2/2 na segunda tentativa (17:31:09, o wifi reassocia em segundos); `net online` às 17:31:00 e **nenhum sync** (0 `api` desde
o `logcat -c`) — como no release anterior (`N4-RELEASE-anexos/README.md` §4).

**A condição da N4-D105 d — 100 aberturas frias do release no Tab e 100 no AVD, com zero queda nativa — está cumprida.**

## 6. A prova do bloco no dado real `[medido: prova-dado-real.txt]`

Sem Metro (`lsof` 8081 → 0), sem `reverse`, com rede, **sem outro sync** (o da §4). `instrumentos/prova-dado-real.py`:

| passo | o que se mediu (2ª passada, 17:35:57) |
|---|---|
| S1 | `baixar-772076b4 buscar criar-setlist setlist-772076b4 setlist-e39d57cf` |
| `Buscar música` abre a L | `lib-tela`, `lib-campo`, os cinco filtros, `lib-lista`, `lib-regua`, `lib-voltar`; **teclado de pé: não** (N4-R2); 5 linhas `lib-linha-*` na janela |
| a régua | **63 · 63** (os dois textos da régua, só os dígitos; 3ª leitura, pelos `bounds` — os textos são irmãos do nó no dump, div. 1137); o cache tem `content n=63` |
| uma música em V | a 1ª linha da L, `4379bdb9`: `view-cabecalho`, `view-titulo`, `view-meta`, `view-datas`, `view-detalhes`, `view-grade-linha`, `view-leitor`, `view-favoritar`, `view-tocar`, `view-voltar`; **corpo len=1060 sha12=`26449a499ed8`** |
| o ▶ abre o palco avulso | `busca`, `sair`, `tema`, `zoom-*`, `borda-*`, `auto-scroll`, **sem `indice`**; **o mesmo corpo** (1060 · `26449a499ed8`); `keepawake on` · `prefetch plan n=0 reason=demand` |
| o voltar | `BACK` → V ✓ · `BACK` → L ✓ · `BACK` → S1 ✓ (`keepawake off`) |
| o palco com setlist | `setlist-772076b4` → S2 (4 `song-*`) → `song-1`: `indice` presente, **corpo len=1831 sha12=`8eaa08ad353f`** — o da Letra do ordinal 1 na PR-2 e no release anterior (`N4-RELEASE-anexos/README.md` §4); `index open` · `index jump n=1` · `keepawake on` · `prefetch plan n=0 reason=demand` |
| de volta | S1 ✓ (por `criar-setlist`) |

`api` em toda a prova: **0**. **Eu não toquei a estrela.**

## 7. Os julgamentos do Marcel `[Marcel, 2026-10-07]`

1. **A-N4-26** (*o tempo até os arquivos estarem todos no aparelho num sync real*) — opção **(c)**: **"sem objeto neste
   dado"** — a conta tem **1 arquivo, já presente** no aparelho (`prefetch plan n=0 reason=library`, §4); vai como
   **herança para quando a biblioteca tiver mais arquivos**. As duas medições que existem ficam ao lado: **o teto no AVD**
   (14 Partituras de 24 MiB, 360,8 MiB: `lru over bytes=252521727 cap=209715200 protected=19` e 5 *arquivo não baixado*,
   `N4-PR9-anexos/README.md` §4.4) e **os 4 arquivos da conta de audit em prod, 265 002 B em 2,3 s** do plano ao último
   (`N4-PR9-anexos/README.md` §6).
2. **A biblioteca com as músicas dele se lê?** **Sim** — *"está tudo funcionando bem"*.
3. **O favoritar de verdade** — feito **pelo Marcel**, pela estrela, no Tab, com o release e a conta dele: *"funcionou"*.
   As linhas `[medido: favoritar-marcel.txt]`:

```
17:48:54.058 OCTAVIA: api status=200 path=/api/content n=1 ms=2427
17:48:54.065 OCTAVIA: write op=favorite content=93dd3c12 status=200 code=- ms=2434
17:48:54.082 OCTAVIA: cache write kind=content n=63 invalidated=1
17:49:14.127 OCTAVIA: api status=200 path=/api/content n=1 ms=625
17:49:14.133 OCTAVIA: write op=favorite content=f3524b8c status=200 code=- ms=631
17:49:14.150 OCTAVIA: cache write kind=content n=63 invalidated=1
17:49:57.945 OCTAVIA: api status=200 path=/api/content n=1 ms=478
17:49:57.950 OCTAVIA: write op=unfavorite content=93dd3c12 status=200 code=- ms=483
17:49:57.965 OCTAVIA: cache write kind=content n=63 invalidated=1
```

**Três escritas**, não uma (div. 1138): favoritar `93dd3c12`, favoritar `f3524b8c`, desfavoritar `93dd3c12` — todas
**200**, cada uma com o cache atualizado pela linha da resposta (`invalidated=1`) e **nenhum sync** entre o toque e o fim
(N4-R7). O resultado no fim: `f3524b8c` favorita; `93dd3c12` como estava. O `updated_at` das duas mudou (herança D,
N4-D39). Quedas na sessão inteira do Tab, depois das escritas: `java=0 · nativas=0`, `tombstones 0`.

## 8. O estado final `[medido: estado/tab-fim.txt, estado/avd-fim.txt]`

| | |
|---|---|
| o Tab | **o release `cf58f7f`** (`070187bf…`), `lastUpdateTime=2026-10-07 17:15:00`, sem `DEBUGGABLE`; `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio — **igual ao lido**; os três XML de dump apagados do `/sdcard` (`ls` → *No such file*) |
| o AVD | lido no fim `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, `reverse` vazio, `ping` *unreachable*; `emu kill` **sem salvar** (subido com `-no-snapshot-save`): o `ram.bin` do `default_boot` segue de 2026-09-24 14:00, e o release instalado nesta sessão some no próximo boot — o dev client de 2026-09-24 volta (`APARATO.md`, o snapshot) |
| `.env` | apagado logo depois do build; nenhum valor lido |
| temporários | `apps/native/android` do prebuild apagado; o diretório do build e as cópias do APK puxado no scratchpad da sessão; o `$TMPDIR/metro-cache`, apagado antes do build, foi recriado por ele — o cache comum do Metro, não um temporário desta sessão (como no release anterior) |
| fica, fora do repositório | `~/octavia-aparato/tab-s6-release/release-cf58f7f.apk` — **o release de repouso** (errata do `APARATO.md`); o `release-31d6b3a.apk` e o dev client continuam onde estavam |

## 9. Contabilidade da Parte A

| | |
|---|---|
| requests a `/api/*` em prod pelo executor | **2 `GET`** (o sync da 1ª abertura: `/api/setlists`, `/api/content` p. 1) |
| downloads de storage | **0** (`prefetch plan n=0` com rede; em avião nada sai) |
| escritas em prod pelo executor | **0** |
| escritas em prod **do Marcel** | **3 `PUT /api/content`** pela estrela, na conta dele (§7.3) — **dele, não do executor** |
| logins | **0** (`src=restored` nos dois aparelhos) |
| aparelhos | Tab: `stay_on` 0 → 7 → 0, avião ligado e desligado (regra 11), release trocado (`31d6b3a` → `cf58f7f`); AVD: em avião do começo ao fim, desligado sem salvar |
| builds | 1 release (488 s, frio) |
| código | nenhuma linha |

## 10. Divergências da Parte A — 1136 a 1138

A última usada era a **1135** (`N4-PR9-anexos/README.md` §11) `[medido: git grep -nE '^\| \*\*(9[5-9][0-9]|1[01][0-9]{2})\*\*' --
docs` → 180 números de 956 a 1135, cada um uma vez]. Origem: **P** premissa do prompt · **D** doc anterior · **A**
ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1136** | P | O prompt ordena *instalar e abrir* (4), *o teste de queda em avião* (5) e só depois *um sync com rede* (6). O release **sincroniza ao abrir com rede** (a div. 1000, de novo): a abertura do passo 4 já fez o sync — 2 `GET` — e o passo 6 se fez sem outro | declarado no ato (§4); a prova do passo 6 rodou **sem** novo sync (0 `api`), a contabilidade conta 2 `GET`, não 4 |
| **1137** | T | `prova-dado-real.py`, 1ª passada: o S1 se reconhecia por `buscar` — e o **S2 também tem `buscar`** (abre a S4). O "de volta a S1: True" foi falso positivo, e a leitura seguinte tocou o `buscar` do S2 (a S4 abriu, nenhuma escrita). E os textos da régua são **irmãos** do nó `lib-regua` no dump, não filhos | consertado no instrumento (o S1 por `criar-setlist`; a régua pelos `bounds`); a prova refeita inteira (2ª passada) e a régua lida (3ª); as três passadas no `prova-dado-real.txt` |
| **1138** | P | *"favoritei uma música"* — o log tem **três** escritas do Marcel (favoritar `93dd3c12`, favoritar `f3524b8c`, desfavoritar `93dd3c12`) | registradas as três (§7.3); na contabilidade, **3 escritas do Marcel** |

**Contagem**: 3 — P 2 · T 1.
