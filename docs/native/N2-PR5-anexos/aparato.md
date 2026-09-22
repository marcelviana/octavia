# N2-PR5 — §4, o aceite no aparelho

Mesma sessão da PR, mesma árvore (`../octavia-n2-pr5`), sobre `ba2667f` (o
commit 2). Tab S6 destravado, Octavia em primeiro plano. Onde a medição
discorda do congelado, o registro é **errata**; onde discorda do CÓDIGO, é
**defeito consertado** — esta sessão achou um (div. 286).

---

## 1 · Ferramentas, aparelho e o item 1.1

```
$ adb devices
RX2N8000F3D	device
emulator-5554	device
$ adb -s RX2N8000F3D shell getprop ro.build.version.release
12
$ adb -s RX2N8000F3D shell dumpsys package rocks.octavia.app | grep lastUpdateTime
    lastUpdateTime=2026-09-22 10:34:25
```

**Nenhum build nativo.** A decisão do item 1.1 foi `PanResponder` (o RN já o
tem), e por isso o dev client da N2-PR3 — o mesmo da N2-PR4 — carregou o
bundle do Metro sem rebuild. `app.json` intocado.

Fator do Tab S6: 2,25 (2560 × 1600, densidade 360). Mock na **8788**, Metro na
8081, os dois por `adb reverse`. Fixtures escritas por este projeto: `Ensaio
de reordenar` (7 músicas: `Abertura do ensaio` … `Setima do ensaio`, artista
`Banda da fixture`) e `Fixture de 101` (101 linhas, as mesmas 7 em ciclo).

**`input motionevent` existe no Android 12** (`DOWN|UP|MOVE|CANCEL`), e é o
que permitiu o dump **com o dedo no vidro**: DOWN na alça, MOVEs, dump,
screencap, UP. O `input swipe` de ≥ 600 ms foi usado também, como o roteiro
pede, e dá a MESMA árvore depois de soltar (dumps `04` e `06`, sha256
idênticos).

### 1.1 · Aparato: Metro com `CI=1` não vigia arquivo `[div. 294]`

O primeiro Metro subiu com `CI=1` (para não pedir TTY). Com `CI=1` o Metro
**não vigia arquivos**: depois do conserto da div. 286, DUAS tentativas no
aparelho rodaram o bundle VELHO e "reprovaram" — mediram nada. Achado por
`curl …/apps/native/index.bundle | grep -c LinhaFlutuante` → `0`. Metro
reiniciado sem `CI=1`; a partir daí todo reteste começa pelo `curl` do bundle.
O primeiro dump de tela (`01`, `02`) é do commit 2 (Metro subiu depois do
commit, com `--clear`), e o que eles medem não mudou com o conserto.

---

## 2 · §4.1 — os estados, com o mock

### G6 — estado → `resource-id` alcançado

| # | estado | modo do mock | dump | o que prova | ok |
|---|---|---|---|---|---|
| 1 | `N2-S2e` com `Reordenar` | `escrita` | `01` | `reordenar` 143,6 × 48,0 em (24,0 119,6); `setlist-editar` e `setlist-apagar` **idênticos, dp a dp, aos do dump `01` da N2-PR4** | ✓ |
| 2 | `N2-S2e-reordenar` (modo aberto) | `escrita` | `02` | `alca-1…7` 48,0 × 72,0, passo 80 (136 → 216 → …); `reordenar-sair` = `Cancelar`, `reordenar-salvar` = `Salvar a ordem`; grade, faixa e `remover-*` ausentes | ✓ |
| 3 | arrastando (dedo no vidro) | `escrita` | `03` | `de 5 para 2`, `soltar aqui · posição 2`; `alca-5` a 216,0 (posição 2), `alca-2…4` descidas 80 dp e **com os números de antes** | ✓ |
| 4 | solto (motionevent) | `escrita` | `04` | a ordem 1,5,2,3,4,6,7, renumerada | ✓ |
| 5 | swipe pelo CORPO | `escrita` | `05` | a lista **rolou** 48,9 dp (o fim do conteúdo), a ordem **não** mudou, zero rótulo, zero linha de log | ✓ |
| 6 | solto (`input swipe … 900`) | `escrita` | `06` | a mesma árvore do `04`, byte a byte | ✓ |
| 7 | salvo | `escrita` | `07` | a grade de volta, na ordem do servidor; `alca-*` ausentes; o mock tem `01 05 02 03 04 06 07` | ✓ |
| 8 | `N2-X-100` (101 músicas) | `escrita` | `08` | `reordenar` `enabled=false`; `aviso-motivo` com a frase; `setlist-editar`/`setlist-apagar`/`remover-*` ativos; toque → `write blocked op=reorder reason=ceiling`, modo não abre; PNG: 4 marcadores | ✓ |
| 9 | `N2-S2e-ordem-salvando` | `escrita-pendurada` | `09` | `reordenar-salvar` e `alca-*` `enabled=false`; `reordenar-sair` ausente; `Salvando a ordem no servidor…` | ✓ |
| 10 | `N2-S2e-ordem-falhou` | `escrita-pendurada` (20 s) | `10` | `write … status=net code=net ms=20029`; `resync … reason=order op=reorder status=200`; as três orações; `movida de 5` só na linha arrastada; `Sair sem salvar`, `Tentar de novo` ativo; alças ativas | ✓ |
| 11 | `N2-X-sem-rede` | avião (ver div. 290) | `11` | `reordenar` e `setlist-editar` `enabled=false`; a frase de sem rede; toque → nada, zero log | ✓ |

**Os três que não têm dump próprio, medidos por log**: N2-D36 (entrar e
salvar sem mudar → `write blocked op=reorder reason=nada-mudou`, zero request,
modo fechado); `Cancelar` → zero linha `OCTAVIA:`; e o `Tentar de novo` que
reenvia **o arrasto** — com o modo em falha (estado 10), o mock foi trocado
para `escrita` (que recomeça na ordem da fixture, `01 02 03 …`) e um toque em
`Tentar de novo` deixou o servidor em `01 05 02 03 04 06 07`: o segundo `PUT`
levou a ordem arrastada, não a do servidor.

### G5

| dump | alvos `clickable` | menor alvo |
|---|---|---|
| `01` / `07` S2 com edição | 19 | `remover-1` **48,0 × 48,0** |
| `02`–`06` modo | 2 | `reordenar-sair` **94,7 × 48,0** |
| `09` salvando | 1 | `reordenar-salvar` 191,1 × 48,0 |
| `10` falhou | 2 | `reordenar-sair` (`Sair sem salvar`) 135,1 × 48,0 |
| `08` / `11` | 21 / 19 | `remover-7` **48,0 × 8,9** — ver abaixo |

**Duas observações `[div. 291]`.** (1) As **alças não entram na população do
G5**: um `View` com `panHandlers` não é `clickable` para o `uiautomator`. Elas
se medem à parte, e medem **48,0 × 72,0** em todos os dumps do modo (a 7ª,
cortada pela borda da lista, 48,0 × 47,1 visível). (2) O `remover-7` de 8,9 dp
é **recorte de rolagem**: nos dois estados a linha de aviso de 48 dp empurra a
grade, e a 4ª fileira fica cortada pela borda de baixo; o nó é o mesmo de
48 × 48 das outras seis.

### As medidas contra o congelado

| o que o congelado diz | medido no Tab S6 | |
|---|---|---|
| linha de **72** no modo | alça (a altura toda da linha) **72,0** | ✓ |
| alvo da alça **48 × 72** (R1·7b) | **48,0 × 72,0** | ✓ |
| 6 linhas inteiras por tela | `alca-1…6` inteiras (136 → 536), a 7ª com 47,1 visíveis | ✓ |
| barra de **88** | alvos da barra centrados em 43,6 + 24 | ✓ |
| `Reordenar` sem mover os dois da PR-4 | `setlist-editar` (737,3 119,6) e `setlist-apagar` (947,1 119,6) **iguais** ao `01` da N2-PR4 | ✓ |
| rolagem automática a 48 dp das bordas | AVD, 60 músicas: dedo parado a 130 dp (faixa do topo) por 9 s levou a linha 60 à posição 1; o de baixo, a 1 à 60 | ✓ |
| "renumeração só depois de soltar" | dump `03`: `alca-2…4` descidas e com os números 2, 3, 4 | ✓ |

---

## 3 · O defeito que o §4 achou `[div. 286]` — CONSERTADO

**A linha erguida era translúcida**, e o buraco tracejado por baixo dela
aparecia ATRAVÉS: *"soltar aqui · posição 2"* escrito dentro da linha
erguida, entre o artista e o "de 5 para 2". Nenhum CN podia pegar — o duplo
não desenha.

A causa: o fundo de acento a 12% (`${dark.accent}1F`) estava **no lugar** do
fundo opaco da linha. O conserto faz duas coisas:

1. a linha erguida passa a ser uma **cópia desenhada como o ÚLTIMO filho da
   lista**, opaca, com o acento a 12% como camada por cima; a linha que segura
   o toque fica no lugar, invisível (`opacity: 0`) — e continua montada, que é
   o que o Android exige para não encerrar o gesto;
2. o `zIndex` sai: a ordem da árvore é a ordem de desenho que vale.

Remedido no aparelho (bundle conferido por `curl`, div. 294): o buraco fica
por baixo, e a erguida lê só título, artista e `de 5 para 2` (PNG `03`).

**O CN foi endurecido**, e a prova de que ele pega: com o `ModoDeReordenar.tsx`
do commit 2 no lugar (`git stash`), o `it` "durante o gesto" reprova com
`AssertionError: expected <div data-testid="alca-5" …(3)>…(1)</div> to be null`
— a linha erguida do commit 2 não é o último filho, e carrega a alça com
`testID`. Com o conserto, 14/14.

---

## 4 · §4.2 — prod

O logcat verbatim está em [`device-prod.txt`](device-prod.txt). Resumo:

| # | aparelho · conta | ato | linha | ms |
|---|---|---|---|---|
| 1 | Tab S6 · principal | `N2-PR5 aceite`: 3ª → 1ª | `write op=reorder setlist=3ccef313 items=3 status=200` | **1640** |
| 2 | AVD · audit | setlist de 60: 60ª → 1ª (A-N2-8) | `write op=reorder setlist=4340bf95 items=60 status=200` | **906** |
| 3 | AVD · audit | devolver: 1ª → 60ª | `write op=reorder setlist=4340bf95 items=60 status=200` | **743** |

**Escritas em prod: 3.** `n=1` em todas, uma releitura `reason=write` depois
de cada uma. Reabrir no Tab S6: `invalidated=0` nos dois conjuntos. A setlist
de 60 voltou à ordem de antes, **elemento a elemento** (ids comparados pelo
cache relido). A `N2-PR5 aceite` não foi apagada.

---

## 5 · "Anexo não carrega texto de música", medido

Os 11 dumps são do **mock**, com fixtures escritas por este projeto; a
varredura dos `text=` distintos deles não tem título nem corpo de terceiro.
Um dump de trabalho do AVD em prod (`[UX-AUDIT] Bis nº …`) **ficou fora**, de
propósito, como na N2-PR4. Os três PNG são recortes do mock (a linha erguida,
a faixa do `N2-X-100`, a barra e o aviso da falha).

---

## 6 · Mutações locais, declaradas e desfeitas

1. `apps/native/.env` copiado do checkout principal (sha256 `f2bfa179…`,
   idêntico) e **apagado** no fim.
2. Tab S6: `stay_on_while_plugged_in` 0 → 7 → **0**; `accelerometer_rotation`
   1 → 0 → **1**; `user_rotation` 0 → 1 → **0**.
3. Tab S6: **modo avião** ligado para o estado 11 e desligado; `ping` de volta
   em 16,5 ms. **Isto contraria a regra herdada da V1-PR3** — no Tab S6, "sem
   rede" é só o override da API — e a N2-PR4 fez o mesmo (§7.4 do aparato
   dela). Registrado como div. 290.
4. AVD: estava em avião (airplane=1, wifi=0, data=0). Avião desligado e
   `svc data enable` para o §4.2(b); **restaurado** (airplane=1, data=0,
   `ping` → unreachable). `[div. 292]`
5. `adb reverse` 8788 e 8081 no Tab S6, **removidos** (`--remove-all`). O
   reverse do AVD (8081) já existia e ficou como estava.

Estado final medido: Tab S6 `stay_on=0 accel=1 user_rot=0 airplane=0`,
`reverse` vazio; AVD `airplane=1 wifi=0 data=0`; `.env` inexistente nesta
árvore.
