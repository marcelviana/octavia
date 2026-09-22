# N2-PR4 — §4, o aceite no aparelho

Mesma sessão da PR, mesma árvore (`../octavia-n2-pr4`), sobre `a4e7df6` (o
commit 2). O Tab S6 estava **destravado pelo Marcel** a pedido desta sessão —
a tela de bloqueio pedia credencial, e credencial não é coisa que a automação
digite.

Onde a medição discorda do congelado, o registro é **errata**. Onde ela
discorda do CÓDIGO, o registro é **defeito consertado**, e esta sessão achou
dois: a div. 269 (os dois botões do diálogo) e a **div. 270** (S1 voltava
mostrando a setlist apagada), as duas medidas aqui e corrigidas no commit 2.

---

## 1 · Ferramentas e aparelho

```
$ ls -l ~/Library/Android/sdk/platform-tools/adb
-rwxr-xr-x@ 1 marcelviana staff 14046464 May 16  2025 …/platform-tools/adb
$ adb devices -l
RX2N8000F3D   device usb:0-1.1 product:gts6lxx model:SM_T865 device:gts6l
emulator-5554 device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64
```

O gate do §0 é `ls` no SDK, não `which` — a `div. 250` já registrou por quê.

Tab S6: `wm size 2560x1600`, `wm density 360` → **fator 2,25**. Em landscape
o canvas do app mede **1137,8 × 663,1 dp**, dos quais 24 dp de cima são o
inset do sistema: sobram os **639,1 dp** do `MEDIDAS.md`.

**Nenhum build nativo nesta PR.** O dev client instalado é o da N2-PR3
(`lastUpdateTime=2026-09-22 10:34:25`, com o `datetimepicker` 9.1.0); esta PR
não traz módulo nativo, então o bundle do Metro basta. É a primeira PR da
série que roda o §4 **sem** rebuild.

Mock na **8788** e Metro na 8081, os dois por `adb reverse` (`div. 250`).

---

## 2 · §4.1 — os estados, com o mock

Fixtures escritas por este projeto, com nomes sintéticos: uma setlist
`Ensaio de quinta` com **bis** (o mesmo `content_id` nas posições 1 e 4, que é
o caso do T2-R7) e uma `Show do galpao` com uma música. **Nenhum corpo de
música entrou em dump nenhum** — a varredura está no §6.

### G6 — estado → `resource-id` alcançado

| # | estado | modo do mock | dump | o que o `resource-id` prova | ok |
|---|---|---|---|---|---|
| 1 | `N2-S2e` (de S1) | `escrita` | `01` | `setlist-editar`, `setlist-apagar`, `remover-1…4` | ✓ |
| 2 | `N2-S2p` (do palco) | `escrita` | `02` | **nenhum** dos seis; só `voltar`, `buscar`, `song-n` | ✓ |
| 3 | `N2-F-editar-igual` | `escrita` | `03` | `form-nome` com o valor do servidor, `form-salvar` `enabled=false`, `form-salvar-motivo` | ✓ |
| 4 | folha editar com mudança | `escrita` | `04` | `form-salvar` `enabled=true`, `form-data-limpar` | ✓ |
| 5 | linha em `removendo…` | `escrita-pendurada` | `05` | `remover-4` sem `clickable`, os outros três `enabled=false` | ✓ |
| 6 | `N2-X-falhou` | `escrita-pendurada` (20 s) | `06` | `aviso-motivo` com as TRÊS orações, `aviso-acao` 48,0 dp | ✓ |
| 7 | `N2-D-apagar` | `escrita-pendurada` | `07` | `apagar-manter`, `apagar-confirmar`, caixa **620,0 × 300,0 dp** | ✓ |
| 8 | apagando | `escrita-pendurada` | `08` | os DOIS `enabled=false` + `Apagando no servidor…` | ✓ |
| 9 | apagar falhou | `escrita-pendurada` | `09` | `apagar-falha`, `apagar-confirmar` com rótulo `Tentar de novo` | ✓ |
| 10 | remover com 200 | `escrita` | `10` | três linhas, a 3ª com 1089,8 dp (ímpar final) | ✓ |
| 11 | 404, a MÚSICA sumiu | `escrita-404` | `11` | `aviso-motivo` com `esta música já não estava na setlist`, S2 **fica** | ✓ |
| 12 | 404, a SETLIST sumiu | `escrita-404` sem ela na fixture | `12` | S1 com `Essa setlist não existe mais…` e **sem** `aviso-acao` | ✓ |
| 13 | `N2-X-salvo-nao-relido` | `escrita-resync-500` | `13` | `aviso-motivo` + `aviso-acao` = `Tentar recarregar` | ✓ |
| 14 | `N2-X-sem-rede` | avião (`ping` falhando) | `14` | os CINCO controles `enabled=false`, `buscar` ativo, sem `aviso-acao` | ✓ |
| 15 | `N2-X-limite` | `escrita-429` | `15` | `aviso-motivo` com o prazo do servidor; a escrita seguinte **barrada** | ✓ |

**Quinze estados, quinze alcançados.** O `N2-X-100` (teto de 100 músicas)
**não** está aqui e não é omissão: ele inativa `Reordenar`, que é da PR-5.

### G5 — todo alvo do app, ≥ 48 dp pelas duas bordas

| dump | alvos | menor alvo do app | G5 |
|---|---|---|---|
| `01` S2 com edição | 12 | `remover-n` / `voltar` **48,0 × 48,0** | PASSA |
| `03` folha editar | 5 | `form-data-limpar` **109,3 × 48,0** | PASSA |
| `05` removendo | 11 | `remover-1…3` 48,0 × 48,0 | PASSA |
| `06` falhou | 13 | `aviso-acao` **164,9 × 48,0** | PASSA |
| `14` sem rede | 12 | `remover-n` 48,0 × 48,0 (inativos, e medidos) | PASSA |

**Zero alvos do app abaixo de 48 dp em todos os estados.** O nó da linha em
`removendo…` mede 109,3 × 24,0 dp e **não entra na população do G5**: ele não
é `clickable` — é um estado, não um alvo. Essa é a diferença que o congelado
desenha quando diz *"a linha continua sem botão"*.

### As medidas contra o congelado

| o que o congelado diz | medido no Tab S6 | |
|---|---|---|
| barra de 88, intacta | 88 (a barra vai de 24 a 112, com o inset de 24) | ✓ |
| faixa de edição **64** | 64 (112 → 176; controles de 48 centrados, 8 dp de folga) | ✓ |
| lista **551,1 → 487,1** | 639,1 − 88 = **551,1** sem faixa; − 64 = **487,1** com | ✓ |
| linha **536,9 × 116** intacta | **536,9 × 116,0** | ✓ |
| `remover`: alvo de 48 no fim da linha | **48,0 × 48,0** | ✓ |
| a S2 do palco começa 64 dp mais alto | lista em **136,0** contra **200,0** | ✓ |
| diálogo **620 × 300** | **620,0 × 300,0** | ✓ |
| botões do diálogo **58** | **57,8** (os mesmos da folha) | ✓ |
| linha de aviso **48** | `aviso-acao` **48,0** | ✓ |
| caixa do título **336 → 280** | 336 → **272,0** — **errata N2-E9** | ✗ |

### O frame de controle `N2-S2p`, contra o V1

O congelado manda comparar. O dump `02` desta PR e o `S2-season3.xml` da
V1-PR7 (`dumps-tabs6/`), nó a nó:

```
            V1-PR7 (S2-season3)          N2-PR4 (02-N2-S2p)
voltar      48,0 × 48,0 em (24,0 43,6)   48,0 × 48,0 em (24,0 43,6)
buscar     210,2 × 57,8 em (903,6 38,7) 210,2 × 57,8 em (903,6 38,7)
song-1     536,9 × 116,0 em (24,0 136,0) 536,9 × 116,0 em (24,0 136,0)
song-2     536,9 × 116,0 em (576,9 136,0) 536,9 × 116,0 em (576,9 136,0)
song-3     536,9 × 116,0 em (24,0 260,0) 536,9 × 116,0 em (24,0 260,0)
song-4     536,9 × 116,0 em (576,9 260,0) 536,9 × 116,0 em (576,9 260,0)
```

**Idêntico, dp a dp.** A única diferença é a contagem de linhas — a Season 3
tem sete e a fixture desta PR tem quatro —, que é dado e não layout. Os dois
dumps **não** são byte-idênticos porque são setlists diferentes; o que o
congelado pede ("se a implementação puser um único controle de escrita nesta
moldura, ela está errada") está medido: `setlist-editar`, `setlist-apagar` e
`remover-*` **não existem** no `02`.

---

## 3 · O que o §4 achou e o §3 não podia achar

### 3.1 — A div. 257 fecha, e do lado certo `[div. 268]`

A N2-PR3 registrou que a espécie `rede` da N2-D18 **não tinha prova de
aparelho**: o modo `escrita-corta` mandava `201` antes de cortar, e no Android
isso passava por sucesso. Com o corte sem status line (commit 1) **e** o prazo
de rede (N2-D35), a espécie saiu do Tab S6 duas vezes, literal:

```
OCTAVIA: write op=remove setlist=aaaaaaaa items=- status=net code=net ms=20029
OCTAVIA: write op=delete setlist=aaaaaaaa items=- status=net code=net ms=20025
```

**`ms=20029` e `ms=20025`** — o prazo de 20 s do core, disparando sobre o
OkHttp de verdade, num servidor que aceitou a conexão e nunca respondeu. É a
medição que o CN de Node não podia dar: lá o `fetch` do undici tem prazos
próprios; aqui não havia prazo nenhum, e sem o commit 2 essas duas escritas
não teriam terminado nunca.

A tela depois de cada uma é a moldura `N2-X-falhou`, com as três orações:

```
'Não foi possível salvar  ·  sem conexão — nada foi salvo  ·  a lista abaixo
 é a que o servidor acabou de devolver'
```

### 3.2 — **Defeito: os dois botões do diálogo** `[div. 269]` — CONSERTADO

Medido no dump `08` da primeira rodada: no estado `apagando`, o
`Manter a setlist` **sumia** e a frase de progresso tomava o lugar dele. O
congelado do §6 diz outra coisa, verbatim: *"o diálogo fica, **os dois botões
inativam** e a frase passa a `Apagando no servidor…`"*.

A forma errada tinha uma razão — é o que a folha de criar faz com o `Cancelar`
(regra 1) —, e a razão não vale aqui: lá o `Cancelar` prometeria cancelar uma
escrita em voo; aqui o par de botões **é a pergunta do diálogo**, e tirar um
deles do lugar no meio do ato muda a pergunta debaixo de quem está lendo.

Consertado no commit 2 e remedido: os dois com `enabled=false`, a frase entre
eles.

### 3.3 — **Defeito: S1 voltava mostrando a setlist apagada** `[div. 270]` — CONSERTADO

O achado mais caro da sessão, e o único que nenhum CN pegou.

Apagar em prod… não: apagar **no mock**, primeira rodada. O log estava
perfeito —

```
write op=delete setlist=aaaaaaaa items=- status=200 code=- ms=22
resync kind=setlists reason=write op=delete status=200 setlists=1 ms=20
cache write kind=setlists n=1 invalidated=1
```

— e **S1 voltou com as DUAS setlists**, a apagada inclusive.

A causa: o `DialogoDeApagar` chamava `aoApagar()` sem argumento e S2 saía para
S1 sem repassar o conjunto que a releitura trouxe. O **cache** ficava certo
(quem o grava é o `escrita.ts`), mas o estado da RAIZ não era avisado, e S1
desenha o que a raiz tem. O mesmo buraco existia nos dois caminhos de 404 (a
folha e o diálogo), onde o congelado promete cair em S1 *"já relida"*.

Conserto: as três saídas passam a levar `(setlists, syncedAtMs)`, e S2 chama
`edicao.aoReler(…)` **antes** de `aoSairParaS1(…)`.

**O CN foi endurecido no mesmo commit**, e a prova de que ele agora pega: com
o conserto revertido à mão, o `it` do diálogo reprova com
`AssertionError: expected null not to be null`; com o conserto, passa. A
primeira forma do CN parava em "o servidor não tem mais a setlist" — que era
verdade e não bastava.

### 3.4 — Observação, sem conserto: o recorte de id no log

A regra 3 do `LOGS-OCTAVIA.md` recorta uuid a 8 caracteres. Com os ids
SINTÉTICOS da fixture (`aaaaaaaa-1111-…-ss-4`), o recorte produz
`path=/api/setlists/songs/aaaaaaaass-4`: o regex casa o miolo com forma de
uuid e deixa o sufixo. **Em prod sai limpo** — o id é uuid de verdade e a
linha saiu `path=/api/setlists/songs/396201cc`. Não há uuid inteiro em lugar
nenhum; é ruído de fixture, não de produto, e por isso fica como observação.

---

## 4 · §4.2 — prod, conta principal, três escritas

O logcat verbatim está em [`device-prod.txt`](device-prod.txt). Resumo:

| # | ato | linha | ms |
|---|---|---|---|
| 1 | renomear **e** datar (+5 dias) num `PUT` só | `write op=update … status=200` | 1371 |
| 2 | remover a música | `write op=remove … status=200` | 1174 |
| 3 | apagar pelo diálogo | `write op=delete … status=200` | 340 |

**Contagem de escritas em prod nesta PR: 3.** Nenhum 401, nenhum retry, `n=1`
em todas. Cada uma seguida da releitura (`resync … status=200`) e de
`cache write … invalidated=1`. Reabrir depois: **`invalidated=0`** nos dois
conjuntos.

A `N2-PR4 aceite` (que a N2-PR3 deixou criada como `N2-PR3 aceite`) **foi
apagada** na escrita 3 — era o objeto do aceite de apagar, como o roteiro
desta PR mandou.

O **T2-R17 saiu de um `op=update`** pela primeira vez: datar para +5 dias
disparou `prefetch plan n=0 reason=7d` pela releitura da edição, sem abrir a
setlist. O `n=0` é o indicador da setlist já dizendo "nada a baixar".

---

## 5 · Regra 4 do `LOGS-OCTAVIA.md`

```
$ grep -rn eyJ docs/native/N2-PR4-anexos/
docs/native/N2-PR4-anexos/device-prod.txt:126:    grep -n eyJ → nada
$ grep -rln <email da conta> docs/native/N2-PR4-anexos/
(nada)
$ grep -rE 'write op=|resync kind=' docs/native/N2-PR4-anexos/device-prod.txt
(nenhum uuid inteiro, nenhum nome de setlist, nenhum título)
```

A única ocorrência de `eyJ` é **o enunciado da própria regra**, como a
`div. 259` já registrou para a N2-PR3.

---

## 6 · "Anexo não carrega texto de música", medido

Os **15 dumps** commitados vieram todos do mock, com fixtures escritas por
este projeto: `Abertura do ensaio`, `Segunda do ensaio`, `Terceira do ensaio`,
`Ensaio de quinta`, `Show do galpao`, `Galpao do fundo`, `Fixture N2-PR4`.
A varredura dos `text=` distintos dos 15 arquivos está no fim desta seção e
**não tem uma linha de obra de terceiro** — nem título, nem corpo.

**Nenhum dump de prod foi commitado.** Os estados de prod estão descritos em
texto no `device-prod.txt`, com o nome da setlist (que é do projeto) e sem
nenhum título da biblioteca do músico.

`SHA256SUMS.txt` no diretório `dumps/`.

---

## 7 · Mutações locais, declaradas

1. **`apps/native/.env` copiado** do checkout principal para esta árvore, para
   o Metro. `.gitignore`d (`:23`), 419 B, sha256 idêntico ao do principal
   (`f2bfa179…`). **Apagado no fim da sessão** — precedente da N2-PR3 §8.
2. **`stay_on_while_plugged_in`**: lido ANTES (**0**), posto em 7, **restaurado
   para 0**. (A N2-PR3 não leu antes de trocar e registrou isso como falha de
   método; aqui o valor anterior está medido.)
3. **`accelerometer_rotation`** (era **1**) e **`user_rotation`** (era **0**):
   travados em 0/1 (landscape) durante o §4 e **restaurados para 1/0**.
4. **Modo avião** ligado para o estado 14 e **desligado** em seguida (`ping`
   de volta em 23,5 ms).
5. **`adb reverse`** 8788 e 8081, **removidos** (`reverse --remove-all`).

Nenhuma mexeu no checkout principal, e nenhuma entra no commit.

Estado final medido:
`stay_on=0 accel=1 user_rot=0 airplane=0`, `reverse --list` vazio,
`apps/native/.env` inexistente nesta árvore.

---

## 8 · Divergências abertas nesta sessão, **262 a 271**

A tabela vive no `DESIGN-N2/README.md` §9, que é onde as das PRs anteriores
estão. Aqui fica só o índice:

| div. | uma linha |
|---|---|
| **262** | não havia prazo de rede nenhum; o CN mediu 40 s sem desistir |
| **263** | o prazo é do core e o mecanismo é do `api.ts` — o prompt dizia "no core" |
| **264** | as leituras do sync ficam SEM prazo, e por quê (a fixture `atraso`) |
| **265** | a folha de editar mora no arquivo `FolhaDeCriar.tsx`, e por quê (G2) |
| **266** | meio par de ícone: `remover` cobrado, `adicionar` ainda pendente |
| **267** | três `testID` novos além dos 25 da §7 (`form-data-limpar`, `apagar-falha`, `apagar-motivo`) |
| **268** | a div. 257 fecha: `status=net` medido no aparelho, `ms=20029` |
| **269** | **defeito**: o `Manter a setlist` sumia no `apagando` — consertado |
| **270** | **defeito**: S1 voltava mostrando a setlist apagada — consertado |
| **271** | a caixa do título mede 272 e não 280 (**errata N2-E9**) |
