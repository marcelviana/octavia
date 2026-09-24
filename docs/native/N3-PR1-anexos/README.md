# N3-PR1-anexos — o gate do bloco N3

**Rastro.** A fonte é a [`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (as erratas
N3-E3…E12 e as divergências 401–410) e o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md)
(A-N3-1, A-N3-2, A-N3-4). Árvore `../octavia-n3-pr1`, branch `n3/pr1-gate`, sobre
`origin/main` = `d25e00d` (merge da #325).

**Nenhum texto de música de terceiro**: todo dump é do **mock** (`aceite.py servidor`,
8788) com a fixture do pre-check (`N3-PRECHECK-anexos/instrumentos/fixture.py`,
"hoje" = 2026-09-23, a mesma data da linha de base). Conferido: os 132 `text` distintos
dos 54 dumps desta pasta estão **todos** no conjunto dos dumps da B5 e da referência do
palco. `grep -rn eyJ`, e-mail e o uid do Tab sobre esta pasta: vazios.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `CN-commit1.txt` · `CN-commit3.txt` | `apps/native/scripts/__cn__/cn-n3pr1.sh`: shasum do DESIGN-N3, G-inv, G-N3 — no commit 1 e de novo com o G-inv do commit 3 |
| `faixa-test-commit1.txt` · `faixa-test-commit2.txt` | o `test/faixa.test.ts` reprovando por ausência (commit 1) e passando, 4/4 (commit 2) |
| `G1-commit2.txt` · `G2G3-commit2.txt` | G1 e G2/G3 contra `origin/main` com o bloco `gates` abaixo |
| `G-inv-B5.txt` · `G-inv-palco.txt` | **o G-inv do commit 2**: os 52 dumps de paisagem desta PR contra `B5-baseline/` (34) e `B3-referencia-paisagem/` (18) |
| `G-N3-main-retrato-tablet.txt` · `G-N3-main-celular.txt` | **o G-N3 reprovando a `main` em retrato** (dumps `B2/` e `B4/` do pre-check) |
| `regua-avd.txt` · `regua-tab.txt` · `regua-avd-calibracao.txt` | as linhas `OCTAVIA: regua …` verbatim: as doze, os 13 controles régua × dump, um token inexistente |
| `faixa-avd.txt` · `faixa-tab.txt` · `faixa-phone.txt` | as linhas `OCTAVIA: faixa=` verbatim (A-N3-1) |
| `dumps-pai/` | 52 `uiautomator dump` em paisagem desta PR: AVD 27 (18 + 9 do palco), Tab 25 (16 + 9); `SHA256SUMS.txt`. PNGs não commitados (a prova é o `bounds`) |
| `dumps-descartados/` | o S0-login do AVD alcançado por logout na sessão (div. 404), trocado pelo de abertura fria |
| `estado/` | estado de cada aparelho lido e restaurado, o `md5` do cache do Tab antes e depois, as duas conferências do bundle |
| `roteiros/` | a saída de cada rodada de captura, verbatim |
| `instrumentos/` | `regua.py` (a régua em lote), `regua-lista.tsv`, `cal.tsv`, `passada2.py` (a tentativa que caiu, div. 403), `passada3.py`, `passada4.py` |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3-PR1: a faixa (T3-R1) num ponto só, o hook do log na raiz e a régua de dev.
g1a: apps/native/App.tsx
g1a: apps/native/src/faixa.ts
g1a: apps/native/src/useFaixa.ts
g1a: apps/native/src/screens/ReguaDeDev.tsx
```

G2: um `testID` novo, `regua-texto` (só dev client). G3: três linhas `log(` novas,
nenhuma some (`faixa=` e as duas da régua, no catálogo).

## 1. As doze medidas, na ordem da folha (A-N3-4, N3-D23)

Medidas pela régua de dev (`regua-avd.txt`, `regua-tab.txt`): **Tab S6 e AVD deram o
mesmo valor nas 24 linhas**. Largura de botão = texto pela régua + o "chrome" do próprio
botão (botão − texto, no dump de paisagem da B5): faixa de S2 `picker-abrir` 188,9 − 118,7
= **70,2**, `setlist-apagar` 166,7 − 96,9 = **69,8**; picker `picker-adicionar-1` 136,0 −
65,8 = **70,2**. **Contra o quê o 4 dp se compara (div. 395, fechada)**: o `bounds` do nó,
que é o formato do `MEDIDAS.md` que a N3-D23 nomeia — o rastreamento depois da última
letra fica dentro.

| # | elemento | token (régua) | conta | medido (dp) | folha | Δ | |
|---|---|---|---|---:|---:|---:|---|
| s1 | `FIM DA SETLIST` em 32 | `fim-32` | o nó | **338,7** | 334 | **+4,7** | **N3-E3** |
| e1 | `Adicionar` (faixa) | `faixa` 65,8 | + 70,2 | **136,0** | 137 | −1,0 | confere |
| e2 | `Apagar` (faixa) | `faixa` 49,8 | + 69,8 | **119,6** | 115 | **+4,6** | **N3-E4** |
| s2 | `Apagar setlist` (faixa, C) | `faixa` 96,9 | + 69,8 (= o dump da B5) | **166,7** | 169 | −2,3 | confere |
| e3 | motivo `nada mudou desde que você abriu` | `motivo` | o texto | **237,8** | 205 | **+32,8** | **N3-E5** |
| e4 | chip `sem conexão` empilhado (B) | `chip` 81,3 · 164,4 | 20 + 8 + a maior | **192,4** | 198 | **−5,6** | **N3-E6** |
| e5 | chip `sem conexão` em uma linha (A) | `chip` 253,8 | 20 + 8 + texto | **281,8** | 292 | **−10,2** | **N3-E7** |
| e6 | frase de aviso de S1 sem rede | `aviso` | o texto, uma linha | **747,6** | 800 | **−52,4** | **N3-E8** |
| e7 | título `Reordenar · Ensaio de retrato` | `reordenar-titulo` | o texto | **605,8** | 464 | **+141,8** | **N3-E9** |
| e8 | régua do picker (rótulo + contador) | `regua-picker` 293,3 · 106,7 | + 12 + 12 (fio 0) | **424,0** | 400 | **+24,0** | **N3-E10** |
| e9 | marca `já na setlist · 2×` | `marca` 92,9 | 20 + 8 + texto | **120,9** | 108 | **+12,9** | **N3-E11** |
| e10 | `Tentar de novo` (linha do picker) | `picker-alvo` 103,1 | + 70,2 | **173,3** | 170 | +3,3 | confere |

E a `[captura]` que o G-N3 já acusava contra a `main` (div. 395): `FIM DA SETLIST` em 52 =
**550,2** contra 543, Δ **+7,2** → **N3-E12**.

Os ícones de 20 e os vãos de 8 do chip e da marca são os do dump (S1: 45 px e 18 px; picker:
45 px e 18 px ÷ 2,25). O chrome do `Tentar de novo` é o do `Adicionar` por construção: os dois
são o mesmo `Alvo` do `Picker.tsx`, com `Icone … tamanho={24}` — **não medido num dump**
(nenhum dump tem a linha que falhou); é o único termo das doze que não sai de um nó.

**Controles régua × dump** (o mesmo texto, já desenhado numa tela da B5 em paisagem):
`Adicionar música` 118,7 · `Reordenar` 73,3 · `Renomear e datar` 123,6 · `Apagar setlist` 96,9
· `Adicionar` (picker) 65,8 · `a setlist precisa de um nome` 197,8 · `sincronizado agora`
116,9 · `FIM DA SETLIST` (52) 550,2 · `já na setlist` 70,2 · `nada mudou…` 237,8 · a frase de
aviso 747,6 · `Nesta setlist · Ensaio de retrato` 293,3 · `6 resultados` 106,7 — **13 de 13
iguais ao nó do dump, ao décimo**. Token inexistente → `w=-`. **Calibração** (extra,
declarado na conversa antes de medir): `Ensaio de retrato` no token do reordenar = 359,1 — a
folha tirou 16 dp/caractere do título de S2 (271, que no app é 22 dp, .14em) e o aplicou ao
do reordenar, que é 26 dp, .22em (div. 409).

## 2. A linha `faixa=` nos quatro casos (A-N3-1)

| caso | linha verbatim | arquivo |
|---|---|---|
| Tab deitado | `OCTAVIA: faixa=C w=1137.8 h=711.1` | `faixa-tab.txt` (rotação) |
| Tab em pé | `OCTAVIA: faixa=B w=711.1 h=1137.8` | `faixa-tab.txt` (boot) |
| celular em pé | `OCTAVIA: faixa=A w=411.4 h=914.3` | `faixa-phone.txt` (boot, e na volta) |
| celular deitado | `OCTAVIA: faixa=B w=914.3 h=411.4` | `faixa-phone.txt` (rotação) |

E no AVD `octavia_tab32`: `C` no boot deitado, `B w=711.1` em pé, `C` de volta
(`faixa-avd.txt`). Uma linha por troca, nenhuma repetida. O `h` é a janela do
`useWindowDimensions`, com as barras (div. 410); quem decide é o `w`.

## 3. G-inv — o commit 2 não mudou uma tela (A-N3-2)

`G-inv-B5.txt`: **34 de 34 idênticos** (AVD 18, Tab 16). `G-inv-palco.txt`: **18 de 18**
(AVD 9, Tab 9) contra `B3-referencia-paisagem/` (div. 401). Chegar ao idêntico pediu
reproduzir o **estado de dados** da base (div. 403) — e a diferença que sobrou em cada
passo foi dado, nunca layout:

| o que o G-inv acusou | causa | como a base foi reproduzida |
|---|---|---|
| arco do ◔ em S1, S1e e aviso | "0 de 2" × "1 de 2 arquivos baixados": a base tinha a partitura de 12 p no disco | palco antes (baixa a partitura), telas de S1 depois |
| chip e texto do aviso (AVD) | a base do AVD abriu o app **já sem rede** ("sem conexão · última sincronização agora") | avião ligado **antes** de abrir (`passada3.py`) |
| chip do aviso (Tab) | a base do Tab foi ao contrário: avião ligado com o app aberto ("sincronizado agora") | o `S1_aviso` do roteiro original |
| banner do S1e | "há 1 min" (AVD) × "agora" (Tab) na base | AVD com o cache de 60–119 s; Tab logo depois do sync |
| o botão "Tools" do dev client | expandido por segundos depois de carregar o bundle | fora da conta (div. 402) |
| campos do S0-login (AVD), 1 px | S0 alcançado por logout na sessão | abertura fria, como a base (div. 404) |

Nas cinco telas de S1 que foram recapturadas, o XML saiu **byte a byte igual** ao do pre-check
(sha curto do `cap.sh`: `179ed0d01bb5`, `018ee101e1f1`, `47cb51259242`, `f180bcb68763`,
`23f7cb1b5edc`).

## 4. G-N3 contra a `main` em retrato (A-N3-4)

`G-N3-main-retrato-tablet.txt`: **reprova**, (e) = **1** — `B2-S1-aviso-sem-rede-avd`,
`"SETLISTS"`. `G-N3-main-celular.txt`: **reprova**, (e) = **101** em 11 dumps:

| dump (celular em retrato) | (e) | B3 |
|---|---:|---:|
| S1-S1e-falha-com-cache | 11 | 11 |
| S1-S1f-vazia | 2 | 2 |
| S1-aviso-sem-rede | 12 | 12 |
| S1-setlists | 11 | 11 |
| S2-com-edicao-aviso-sem-rede | 16 | 16 |
| S2-com-edicao | 18 | 18 |
| S2-sem-edicao-S2p | 16 | 16 |
| S3-S3d-pdf-12p | 1 | 1 |
| picker-resultados | 10 | 10 |
| picker-vazio | 1 | 1 |
| reordenar-aberto | 3 | 3 |

O controle do instrumento (`CN-commit*.txt`, CT-N3): (e) **e** (d′), dump a dump, iguais ao
`B3-inventario.jsonl` nos **105** dumps com referência — **0** diferenças. O bloco de 4 dp,
nos mesmos dumps, acusa só `FIM DA SETLIST` em 52 (E12) e o motivo `nada mudou` (E5): as 12
`[captura]` de B que a §4.2 do DESIGN-N3 já tinha conferido à mão ficam dentro de 4 dp também
no gate.

Os dumps são os do pre-check (`aa91b5d`): `git diff --stat aa91b5d d25e00d -- apps packages`
é vazio, e o commit 2 não muda tela (§3) — div. 407.

## Aparato

- **Mock** `aceite.py servidor 8788` + arquivos (`http.server 8790`) sobre a fixture do
  pre-check, "hoje" = 2026-09-23; **Metro** na 8081 **sem `CI=1`**, `--clear`, com
  `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; `adb reverse` dos três.
- **Bundle conferido** antes do AVD e antes do Tab (`estado/bundle-*.txt`): `localhost:8788`
  1 · `octavia.rocks` **0** · `faixa=` 3 · `regua t=` 3.
- **`.env`**: copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro;
  **apagado** no fim.
- **Escritas**: prod **zero** requests. Mock: nenhuma escrita (a "folha falhou" tenta
  `POST` no modo `escrita-500`, nada gravado).

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado, e por quê | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit, dev client 2026-09-24 14:00:01 | subiu com **`-no-snapshot-save`**; avião desligado + wifi/data para o mock; rotação; `reverse`; **sessão derrubada pelo S0** (mock `401`) | settings iguais ao lido, `ping` → `Network is unreachable`, `reverse` vazio, desligado. A sessão e o cache de audit voltam no próximo boot (snapshot intacto) |
| **`octavia_phone`** | `stay_on=1 accel=0 user_rot=0 airplane=0 wifi=1 data=1`, sem sessão | `-no-snapshot-save`; rotação; `reverse` | iguais ao lido; desligado. (O `APARATO.md` dizia `accel=1` para ele no pre-check; lido 0 agora, restaurado a 0) |
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou) | `stay_on` 0→7; rotação; avião nos estados sem rede; `reverse`; **cache do app trocado pelo do mock** | settings iguais ao lido; `reverse` vazio. Cache **guardado antes** (`run-as … tar` dos 4 arquivos) e **restaurado** com o app parado: `md5` dos 4 idêntico (`estado/md5-*.txt`); as duas partituras da fixture, que o tar não cobria, apagadas; o tar **apagado** do host |
| **host** | 8081/8788/8790 livres | Metro, mock, arquivos | as três livres; `.env` apagado |

## Extras

Declarados na conversa **antes** de serem feitos: a segunda passada das telas de S1 e o
S0 de abertura fria (a reprodução do estado da base, div. 403/404); a calibração do título
(§1). O `apps/native/scripts/g-inv.sh` mudou no commit 3 (a subárvore do dev client fora da
conta, div. 402) — achado do CP, não do plano; o CN foi rodado de novo (`CN-commit3.txt`).
