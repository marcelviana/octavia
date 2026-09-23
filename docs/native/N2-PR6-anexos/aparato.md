# N2-PR6 — §4, o aceite no aparelho

Mesma sessão da PR, mesma árvore (`../octavia-n2-pr6`), sobre o commit 2
(`04d9890`) e depois sobre o conserto que este §4 achou (div. 313, §3). Tab S6
destravado, Octavia em primeiro plano. Onde a medição discorda do congelado, o
registro é **errata**; onde discorda do CÓDIGO, é **defeito consertado**.

---

## 1 · Ferramentas, aparelho, bundle

Estado LIDO antes de mexer (as mutações estão no §7):

```
$ adb -s RX2N8000F3D shell getprop ro.build.version.release
12
$ adb shell wm size ; adb shell wm density
Physical size: 1600x2560
Physical density: 360
global stay_on_while_plugged_in = 0
system accelerometer_rotation = 1
system user_rotation = 0
global airplane_mode_on = 0
$ adb reverse --list
(vazio)
$ adb shell dumpsys package rocks.octavia.app | grep lastUpdateTime
    lastUpdateTime=2026-09-22 10:34:25
```

**Nenhum build nativo.** Esta PR não traz módulo nativo; o dev client é o da
N2-PR3, o mesmo da N2-PR4 e da N2-PR5. Fator 2,25; canvas do app 1137,8 ×
663,1 dp, com os 24 dp de cima do sistema.

Mock na **8788**, Metro na 8081, os dois por `adb reverse`. **Metro sem
`CI=1`** e **bundle conferido por `curl` antes de abrir o app** (div. 294):

```
$ curl -s 'http://localhost:8081/apps/native/index.bundle?platform=android&dev=true' -o bundle.js
7175406
picker-abrir → 1 · picker-estado- → 1 · salvo-nao-relido-picker → 2
não entrou na setlist → 1 · localhost:8788 → 1
```

Fixtures escritas por este projeto (as do CN): `Ensaio do picker` (8 linhas,
`Manhã de ensaio` em bis nas posições 1 e 8) e `Fixture de 100`; biblioteca de
12 (`Manhã de ensaio` … `Décima do ensaio`, `Duo Manacá`, `Banda da fixture`).

---

## 2 · §4.1 — os estados, com o mock

### G6 — estado → `resource-id` alcançado

Coluna *bundle*: **c2** = o commit 2 (`04d9890`); **c2+** = com o conserto da
div. 313. O conserto mexe SÓ no fio do rodapé (64,9 → 64,0); os estados que
foram medidos no c2 e não dependem do rodapé não foram refeitos.

| # | estado | modo | dump | o que o `resource-id` prova | bundle |
|---|---|---|---|---|---|
| 1 | `N2-S2e`, faixa completa | `escrita` | `01` | `picker-abrir` 188,9 × 48,0 em x 24,0; `reordenar` em x **228,9**; `setlist-editar` (737,3) e `setlist-apagar` (947,1) **iguais** ao `01` da N2-PR4/PR5 | c2 |
| 2 | `N2-P-vazio` | `escrita` | `02` | `fechar-busca` 48 × 48; `picker-campo` com o placeholder `Adicionar a Ensaio do picker`; `picker-vazio`; `picker-rodape`/`picker-total`; `picker-concluir`; rodapé **64,0** | c2+ |
| 3 | `N2-P-resultados` (nenhuma adição) | `escrita` | `03` | as duas réguas, `picker-estado-1…4` e `picker-adicionar-1…4`; a ordem é a do CN | c2+ |
| 4 | adicionada (201 + releitura) | `escrita` | `04` | `Adicionada`, sem `picker-adicionar-<n>`; a linha subiu para "Nesta setlist" | c2 |
| 5 | falhou (500) | `escrita-500` | `05` | `picker-estado-4` com `não entrou na setlist` + `falha no servidor — nada foi alterado aqui`; `picker-adicionar-4` = `Tentar de novo` | c2 |
| 6 | **os quatro juntos** (a moldura `N2-P-resultados`) | `escrita` → `escrita-500` → `escrita-pendurada` | `06` | `Adicionar` com `já na setlist · 2×` · `Adicionando…` · `Adicionada` · falhou com `Tentar de novo` — **na mesma tela**; PNG `06`. Durante o request, o `Adicionar` da linha 1, o `Tentar de novo`, o `Concluir` e o `fechar` ficam `enabled=false` (T2-R11) — a moldura desenha o `Adicionar` ativo ao lado do `Adicionando…`: **div. 311** | c2+ |
| 7 | falhou por rede (prazo de 20 s) | `escrita-pendurada` | `07` | `pode já ter sido gravada — confira antes de repetir` + `sem conexão — nada foi salvo`; `Tentar de novo` depois do `resync reason=reopen` | c2 |
| 8a | `Relendo…` (a releitura pendurada) | `resync-pendurado` | `08a` | `Relendo…` com o `k` já em 2 e o total ainda 9 | c2 |
| 8b | a releitura falhou | `resync-pendurado` | `08b` | `aviso-motivo` = a frase do picker; `aviso-acao` = `Tentar recarregar` | c2 |
| 8 | **`N2-P-relendo`** — relendo… com o aviso no rodapé | `resync-pendurado` | `08` | linha em `Relendo…`, a vizinha com `Adicionar` **ativo**, o aviso, o total âmbar (pixel `#C9923B`); rodapé **112,9**; PNG `08` | c2+ |
| 9 | volta com o aviso aberto | `escrita` | `09` | S2 **relê**: `resync reason=reopen op=- status=200`; aviso ausente | c2+ |
| 10 | volta normal | `escrita` | `10` | **zero** linha `OCTAVIA:` depois do `Concluir`; `11 músicas` | c2+ |
| 11 | acima de 100 no picker | `escrita` | `11` | 100 → 101 com 201; `aviso-motivo` = `teto-100`; `picker-total` = `101 músicas` | c2+ |
| 12 | `N2-X-100` na volta | `escrita` | `12` | `reordenar` `enabled=false`; `picker-abrir`, `setlist-editar`, `setlist-apagar` ativos | c2+ |
| 13 | `N2-X-sem-rede` | avião (§7.3) | `13` | `picker-abrir` e os outros três `enabled=false`; toque → nada, zero log; PNG `13` (o `+` amputado) | c2+ |

### G5

| dumps | alvos `clickable` do app | menor alvo | abaixo de 48 |
|---|---|---|---|
| `02`–`08`, `11` (o picker) | 3 a 8 | `fechar-busca` **48,0 × 48,0** | **0** |
| `01`, `09`, `10` (S2) | 22 | `voltar` 48,0 × 48,0 | **0** |
| `12`, `13` (S2 com aviso) | 22 | `remover-7` 48,0 × **8,9** | 4 — `song-7/8`, `remover-7/8`: recorte de rolagem (a linha de aviso empurra a grade; a 4ª fileira sai pela borda). O mesmo caso da div. 291 |

**O `Adicionar` por linha: 136,0 × 48,0**; o `Tentar de novo`: 173,3 × 48,0.

### As medidas contra o congelado

| o que o congelado diz | medido no Tab S6 | |
|---|---|---|
| barra de **88** do S4 | `fechar-busca` em y 43,6 (24 + 19,6) | ✓ |
| campo **900 × 48** | **900,0 × 48,0** com texto (dump `03`, = C5 do `MEDIDAS.md`); **960,0 × 48,0** no vazio (`02`) | errata **N2-E17** |
| resultado de **80**, vão **12** | nó da linha **1089,8 × 80,0**; passo 92,0 | ✓ |
| alvo de adicionar de **48** | `picker-adicionar-<n>` 136,0 × **48,0** | ✓ |
| rodapé de **64** | **64,0** (c2+; era 64,9 no c2 — div. 313) | ✓ |
| rodapé de **112** com o aviso | **112,9** = aviso 48,0 + fio 0,9 (2 px) + barra 64,0 | errata **N2-E18** |
| total em `offlineInk`, o `k` não | pixel: total `#C9923B`, nome e `k` `#A9A5B5` | ✓ |
| placeholder em `lineInfo`, 18 dp | o TEXTO medido (`Adicionar a Ensaio do picker`, dump `02`); a tinta e o corpo são os do código (`placeholderTextColor={dark.lineInfo}`, `size.input`) — **não medidos no pixel** | texto ✓ |
| `Adicionar música` à esquerda de `Reordenar`, `Reordenar` anda ~190 (N2-E11) | anda **204,9** (24,0 → 228,9) | ✓ (o "~190" era estimativa) |

### Toques (J3)

```
toque picker-abrir          ← 1
input text man              ← 2 (digitar)
toque picker-adicionar-3    ← 3  → write op=add … status=201
```

**3 toques de S2 até a primeira música**. A segunda música da mesma visita
(`picker-adicionar-4`, na mesma lista): **1 toque**.

---

## 3 · O defeito que o §4 achou `[div. 313]` — CONSERTADO

**O rodapé media 64,9 dp, não 64.** O `borderTopWidth` de 1 dp estava num
invólucro FORA da barra de 64; o congelado desenha o fio DENTRO dos 64
(`* { box-sizing: border-box }`). Nenhum CN podia pegar — o duplo não mede
geometria —, e o `picker-rodape` do dump era o texto, não a barra: a medida
veio do nó sem id que contém o `picker-concluir`.

Conserto: o fio passou para a própria barra (`height: 64` com
`borderTopWidth`, que o RN conta por dentro), e o invólucro saiu. Remedido:
**64,0**. Com o aviso, a linha de 48 do §3.3 **não se deforma** e o fio fica
por cima dela — 112,9 (N2-E18).

**O CN foi endurecido e a prova de que pega está no `CN-controles.txt`
(CN-4)**: com o `Picker.tsx` do commit 2 no lugar, o `it` "abrir…" reprova com
`expected { height: 64, …(5) } to match object { height: 64, borderTopWidth: 1 }`.

---

## 4 · Duas quedas de arnês, nenhuma de código

1. **O `apagar` do campo fica sob o botão flutuante (engrenagem) do dev
   client.** O toque pelo `resource-id` caiu na engrenagem e abriu o menu de
   desenvolvimento; o `input text quarta` seguinte foi para a raiz. Nada se
   perdeu (sem reload; o picker estava como antes, sem uma linha de log). O
   campo passou a ser limpo pelo teclado (`KEYCODE_MOVE_END` + `DEL`). Só existe
   no dev client.
2. **Em prod, o primeiro toque do bis não achou alvo** — a linha 1 já era a
   recém-adicionada (`Adicionada`, sem botão, como deve). O `toque.sh` recusa
   em vez de tocar às cegas: **nenhuma escrita saiu**, e o bis foi na linha 2.

---

## 5 · §4.2 — prod

O logcat verbatim está em [`device-prod.txt`](device-prod.txt). Resumo:

| # | ato | linha | ms |
|---|---|---|---|
| 1 | uma música da biblioteca, fora da setlist | `write op=add setlist=3ccef313 items=- status=201 code=- ms=2090` | 2090 |
| 2 | o bis (uma que já estava) | `write op=add setlist=3ccef313 items=- status=201 code=- ms=524` | 524 |

**Escritas em prod: 2.** Cada uma seguida de `resync … reason=write op=add
status=200` e `cache write … invalidated=1`. Depois da 2: `já na setlist ·
2×` e o rodapé `N2-PR5 aceite · 5 músicas · 2 adicionadas nesta visita`.
`Concluir`: zero linha `OCTAVIA:`, S2 com **5 linhas**, o bis como linha
própria (posições 2 e 5, cada uma com o seu `remover-<n>`). Reabrir:
**`invalidated=0`** nos dois conjuntos. **Não apagada** (é da PR-7).

---

## 6 · Regra 4 e "anexo não carrega texto de música", medidos

```
$ grep -rn eyJ docs/native/N2-PR6-anexos/
device-prod.txt: … grep -c eyJ …      ← o enunciado da própria regra (div. 259)
```

Os **15 dumps** commitados vieram todos do **mock**. A varredura dos `text=`
distintos deles dá **78** textos, todos da fixture ou do app — nenhum título
nem corpo de terceiro. **Nenhum dump de prod foi commitado** (`p1…p8.xml`
ficaram fora); os estados de prod estão descritos em texto, sem título. Os três
PNG são do mock (dois inteiros, reduzidos a 1280 px, e um recorte da faixa);
aparecem neles o teclado flutuante da Samsung e a engrenagem do dev client.

---

## 7 · Mutações locais, declaradas e desfeitas

1. `apps/native/.env` copiado do checkout principal (sha256 `f2bfa179cd8e…`,
   idêntico) para o Metro, e **apagado** no fim.
2. Tab S6: `stay_on_while_plugged_in` 0 → 7 → **0**; `accelerometer_rotation`
   1 → 0 → **1**; `user_rotation` 0 → 1 → **0**.
3. Tab S6: **modo avião** para o estado 13 — lido antes (`0`), ligado
   (`ping` → `connect: Network is unreachable`), **desligado** (`ping` 23,7 ms).
   É a regra decidida na N2-PR5 (div. 290): manual, lido/declarado/restaurado.
4. `adb reverse` 8788 e 8081, **removidos** (`--remove-all`).
5. O mock foi reiniciado entre modos com o estado do servidor preservado
   (`curl …/api/setlists > setlists.json` antes de cada troca), na pasta de
   rascunho da sessão — nada no repositório.

Estado final medido: Tab S6 `stay_on=0 accel=1 user_rot=0 airplane=0`,
`reverse` vazio; `.env` inexistente nesta árvore; 8081 e 8788 livres.
