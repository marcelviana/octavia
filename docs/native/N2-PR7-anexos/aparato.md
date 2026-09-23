# N2-PR7 — §3, o aceite completo nos dois aparelhos

Mesma sessão da PR, mesma árvore (`../octavia-n2-pr7`). Os estados
transversais, o J3 e prod rodaram sobre o **bundle final `fb9acd5`** (o
conserto que este §3 achou, §5). A hipótese dos 350 ms rodou sobre `ba3836c`
— a folha de criar não muda entre os dois. Onde a medição discorda do
congelado, o registro é **errata**; onde discorda do CÓDIGO, é **defeito
consertado**; onde discorda do ROTEIRO, é **divergência**.

---

## 1 · Aparelhos, bundle, estado lido

Estado LIDO antes de mexer (as mutações e o estado final estão no §8):

```
== RX2N8000F3D                       == emulator-5554
SM-T865 · Android 12                 sdk_gphone64_arm64 · Android 12
Physical size: 1600x2560             Physical size: 2560x1600
Physical density: 360                Physical density: 360
stay_on=0 accel=1 user_rot=0         stay_on=1 accel=1 user_rot=0
airplane=0 wifi=1 data=1             airplane=1 wifi=0 data=0
lastUpdateTime=2026-09-22 10:34:25   lastUpdateTime=2026-09-22 10:35:56
reverse: (vazio)                     reverse: host-43 tcp:8081 tcp:8081
```

**Nenhum build nativo**: o dev client é o da N2-PR3 nos dois. Fator 2,25 nos
dois; janela do app **1137,8 × 663,1 dp** no Tab S6 e **1137,8 × 711,1 dp**
no AVD.

Mock na **8788** (`aceite.py`), Metro na **8081** **sem `CI=1`**, os dois por
`adb reverse`. Bundle conferido por `curl` antes de cada rodada (div. 294):

```
mock, ba3836c:  7177747 B · "sem resposta do servidor" 2 · classificarBarrado 6 · localhost:8788 1 · form-data-limpar 1
mock, fb9acd5:  "sumiu-nao-relido" 6 · "Não foi possível recarregar a lista." 2 · releituraFalhou 21 · "sem resposta do servidor" 2
prod, fb9acd5:  7180729 B · localhost:8788 0 · sumiu-nao-relido 6 · https://octavia.rocks 1
```

Fixture do mock **escrita por este projeto** (a das PR-6, com tipos variados
para o J3): `Ensaio do picker` (8 músicas, data `2026-10-10`) e `Fixture de
100`; biblioteca de 12 (`Manhã de ensaio` … `Décima do ensaio`), três delas
`Chords`/`Tab` com o `[Intro] C Am F G` e o `e|---0---` do projeto.

---

## 2 · A hipótese dos 350 ms (`MS_FOCO_APOS_ANIMACAO`), fechada nos dois

O arnês é o da div. 261, **endurecido**: antes de cada toque, folha fechada
**e** teclado `mInputShown=false` (sem isso o `true` de depois não prova nada);
1,2 s depois do toque, folha aberta **e** o `mInputShown` lido. Verbatim em
[`ime-350.txt`](ime-350.txt):

```
AVD octavia_tab32 · mInputShown=true em 10/10
Tab S6            · mInputShown=true em 10/10
```

**Queda de arnês no AVD, no caminho** (não de código): o teclado do AVD é
encaixado embaixo e **cobre o `form-cancelar`**; o primeiro laço fechou a
folha tocando nele e o toque caiu na tecla `E` (o campo ficou com "E"). O
laço bom fecha com `BACK` — que esconde o TECLADO e não a folha (div. 261),
verificado a cada iteração — e só então toca `form-cancelar`. Todos os números
acima são do laço bom.

---

## 3 · §3.1 — os estados transversais, com o mock, nos DOIS aparelhos

O roteiro é UM script para os dois ([`instrumentos/roteiro.sh`](instrumentos/roteiro.sh)),
um aparelho por vez (o mock é compartilhado), com re-sincronização antes de
cada um. Saída verbatim: [`roteiro-tab.txt`](roteiro-tab.txt),
[`roteiro-avd.txt`](roteiro-avd.txt). Dumps: `dumps/t-*.xml` (Tab S6) e
`dumps/a-*.xml` (AVD), todos do mock.

### G6 — estado → `resource-id`, uma coluna por aparelho

Gerada dos dumps por [`instrumentos/textos.py`](instrumentos/textos.py) (o
texto de um nó é o de todo nó DENTRO dos bounds dele: o Fabric achata a
árvore, e o `picker-estado-1` é folha). Verbatim em [`g6.md`](g6.md):

| # | estado | o que prova | Tab S6 | AVD |
|---|---|---|---|---|
| 1 | S1 | `criar-setlist`, `buscar` ativos | ✓ | ✓ |
| 2 | `N2-S2e` | os quatro da faixa e `remover-1` ativos | ✓ | ✓ |
| 3 | E8, folha com data | `form-data-limpar` presente (**109,3 × 48,0**); `form-salvar` inativo | ✓ | ✓ |
| 4 | E8, depois do `Limpar` | `form-data-limpar` **ausente**; `form-data` = `dd / mm / aaaa`; `form-salvar` ativo → `write op=update … 200` + `resync … 200` | ✓ | ✓ |
| 5 | **sem rede, S2** | os quatro da faixa e `remover-1` `enabled=false`; `buscar` e `song-1` ativos; `aviso-motivo` = `sem-rede-s2`; cinco toques nos inertes → **zero** linha de log; `song-1` → `index jump n=1` | ✓ | ✓ |
| 6 | **sem rede, S1** | `criar-setlist` `enabled=false` (toque → zero linha); `buscar` e o cartão ativos; `sem-rede-s1` | ✓ | ✓ |
| 7 | **salvo-não-relido, S1** (criar) | `<nome> foi criada. Não foi possível recarregar a lista…` + `Tentar recarregar` | ✓ | ✓ |
| 8 | **salvo-não-relido, S2** (remover) | `salvo-nao-relido-s2` + `Tentar recarregar` | ✓ | ✓ |
| 9 | **salvo-não-relido, rodapé do picker** | `salvo-nao-relido-picker` + `Tentar recarregar`; `Concluir` ativo; na volta S2 relê (`reason=reopen`) | ✓ | ✓ |
| 10 | **falhou em S2** (500) | três orações + `Tentar de novo`, **depois** de `resync reason=reopen … 200` | ✓ | ✓ |
| 11 | **falhou no picker** (500) | `não entrou na setlist · falha no servidor…` + `Tentar de novo` depois da releitura | ✓ | ✓ |
| 12 | conserto (i): 500 **e** releitura 500 | sem a oração da lista relida; `Tentar recarregar` | ✓ | ✓ |
| 13 | conserto (ii), N2-E21: 404 **e** releitura 500 | S1 com `Essa setlist não existe mais. Não foi possível recarregar a lista.` + `Tentar recarregar` | ✓ | ✓ |
| 14 | … relida pelo `Tentar recarregar` | a frase inteira do 404, **sem** botão | ✓ | ✓ |
| 15 | **limite** (429, `Retry-After: 30`) | `muitas alterações seguidas — tente de novo em 30 s`, sem botão; `ratelimit retry-after=30 family=setlist-mutate` | ✓ | ✓ |
| 16 | 100 músicas (no teto) | `reordenar` **ativo** — o teto é "acima de 100" | ✓ | ✓ |
| 17 | picker 100 → 101 | `picker-total` = `101 músicas`; `teto-100` no rodapé | ✓ | ✓ |
| 18 | **acima de 100**, na volta | `reordenar` `enabled=false` (toque → `write blocked op=reorder reason=ceiling`); `picker-abrir`, `setlist-editar`, `remover-1` ativos | ✓ | ✓ |
| 19 | E8, folha sem data | `form-data-limpar` **ausente**; abrir e cancelar → **zero** linha `OCTAVIA:` (A-N2-24) | ✓ | ✓ |
| 20 | **E19** — rede no picker (prazo) | `sem resposta do servidor` · `pode já ter sido gravada — confira antes de repetir` + `Tentar de novo`; `write op=add … status=net code=net ms=20015` (Tab) / `ms=20029` (AVD) | ✓ | ✓ |

**Asserções: Tab S6 56/56 · AVD 56/56.**

**O instrumento pega**: as duas asserções do estado 12 rodadas contra o dump
do DEFEITO (`dumps/a-defeito-ba3836c-remove-net.xml`, §5) reprovam —
`aviso-motivo … a lista abaixo é a que o servidor acabou de devolver` e
`aviso-acao … Tentar de novo` ([`g6-controle.txt`](g6-controle.txt)).

Os dois recortes da faixa sem rede (`png/t-05-…`, `png/a-05-…`) mostram os
quatro desenhos amputados: meia corda, quatro marcadores, lápis sem ponta,
balde aberto.

### G5 — alvos ≥ 48 dp, nos dois

[`g5.txt`](g5.txt), 40 dumps (20 por aparelho). Abaixo de 48, **só** `song-7/8` e `remover-7/8`,
e [`g5-recorte.txt`](g5-recorte.txt) prova que **todos** terminam exatamente na
borda de baixo da lista (Tab 1492 px, AVD 1465 px) — recorte de rolagem, o caso
da div. 291, não alvo pequeno. **Zero alvo real abaixo de 48 nos dois
aparelhos.** Menores reais: `voltar` e `fechar-busca` **48,0 × 48,0**.

---

## 4 · §3.2 — J3 ponta a ponta, Tab S6, mock

[`j3.txt`](j3.txt), [`instrumentos/j3.sh`](instrumentos/j3.sh). Cada gesto com o
relógio de parede desde o primeiro toque:

| passo | gestos | o que |
|---|---|---|
| criar vazia | **3** | `Nova setlist` · digitar · `Criar` → `write op=create 201` |
| (abrir a setlist nova) | 1 | o toque no cartão, de S1 para S2 — navegação, fora da conta do J3 |
| 1ª música | **3** | `Adicionar música` · digitar `ensaio` · `Adicionar` |
| 2ª, 3ª, 4ª | **1 cada** | `Adicionar` na mesma lista |
| 5ª | **2** | **uma rolagem** + `Adicionar` (div. 332) |
| sair do picker | 1 | `Concluir` |
| reordenar | **3** | entrar (`Reordenar`) · **1 arrasto** (a 5ª para a 1ª) · `Salvar a ordem` |
| **total** | **16** | |

**Tempo de parede `[medido]`: 73,2 s.** Ele NÃO é o tempo de uma pessoa: o
instrumento custa **2,26–2,36 s por `uiautomator dump`** (5 amostras,
[`custo-dump` no j3.txt](j3.txt)) e o fluxo fez **20 dumps** (um por toque, para
achar o alvo, mais os de conferência) e **21,1 s de pausas** escritas no
script — cerca de **67 s** dos 73,2 são do arnês. O lado do app, somado do
log (`write` + `resync` de cada uma das 7 escritas), é **1,29 s**.

**A listagem final mostra título, artista e tipo sem abrir item** (dump
`t-j3-final.xml`): `1, Sexta do ensaio, Banda da fixture, Letra` ·
`2, Manhã de ensaio, …, Letra` · `3, Segunda do ensaio, Duo Manacá, Cifra` ·
`4, Terceira do ensaio, …, Tab` · `5, Quarta do ensaio, …, Letra` — e a ordem
no servidor é a mesma.

Duas quedas de arnês antes da corrida boa, as duas sem escrita perdida ou
dobrada (mock): a primeira parou na 5ª por não saber rolar; a segunda rolou
**sobre o teclado flutuante da Samsung**, que fica NO MEIO da tela, e digitou
`5` no campo. A corrida boa rola pela margem esquerda (x = 300 px).

---

## 5 · O defeito que o §3.1 achou `[div. 327]` — CONSERTADO

No AVD, no mock, um `remove` saiu com `status=net` (o mock caiu — queda de
arnês, §7) e a releitura da regra 3 falhou também (`resync reason=reopen …
status=net`). A linha de aviso disse:

```
aviso-motivo: Não foi possível salvar  ·  sem resposta do servidor  ·  a lista abaixo é a que o servidor acabou de devolver
aviso-acao:   Tentar de novo
```

Duas mentiras contra a N2-D32: não houve lista devolvida, e `Tentar de novo`
é repetição de escrita sem estado real. O picker (`releituraFalhou`), a folha
(N2-E3) e o reordenar (div. 287) faziam certo; o `remover` de S2 (N2-PR4)
chamava o `recarregar()` e ignorava o resultado. E o mesmo `remover` tratava
`setlists === null` como "a setlist sumiu" num 404 — S1 então dizia *"a lista
abaixo é a que o servidor tem agora"* sem lista nenhuma.

**Decisão do Marcel**, commit próprio: (i) sem a oração, com `Tentar
recarregar`; (ii) o 404 é conhecimento e sai para S1, com `sumiu-nao-relido`
(**N2-E21**). CN antes do conserto (reprova 5, `CN-defeito-antes.txt`), o
mock ganha o sufixo `-releitura-500`, e os estados 12–14 do §3.1 são a
remedição nos dois aparelhos.

---

## 6 · §3.3 e §3.4 — prod

Logcat verbatim em [`device-prod.txt`](device-prod.txt) (sem as linhas
`auth`).

### §3.3 — AVD, conta de audit

| # | ato | linha | ms |
|---|---|---|---|
| 1 | criar `N2-PR7 audit` | `write op=create … status=201` | 1642 |
| 2–10 | **9 distintas, uma visita** (3 toques na 1ª, 1 nas seguintes, **1 rolagem**) | 9 × `write op=add setlist=750043aa … status=201`, cada um seguido de `resync … reason=write op=add status=200` | 327–699 |
| 11 | **o bis, numa segunda visita** (3 toques) | `write op=add … status=201`; a linha passa a `já na setlist · 2×` | 403 |
| 12 | reordenar (a 2ª para a 1ª) | `write op=reorder … items=10 status=200` | 377 |
| 13 | apagar pelo diálogo (`Apagar N2-PR7 audit, com 10 músicas?`) | `write op=delete … status=200`; S1 relida com 3 setlists | 363 |

**13 linhas `write op=`**, 10 × `write op=add … 201` com 10 releituras 200,
**zero 429** (a família `setlist-mutate` é 120/15 min). O bis foi numa
**segunda visita** porque dentro de uma visita a linha adicionada fica
`adicionada`, sem botão — numa setlist criada vazia **não há bis possível numa
visita só** (div. 331).

**Queda de arnês em prod, sem escrita perdida nem dobrada**: o 3º
`Adicionar` estava sob o teclado do AVD (y 999 px, topo do teclado ~834 px), e
o toque digitou `p` no campo (`auditp`, sem resultado). Nada saiu. A retomada
apagou o `p`, escondeu o teclado com `BACK`, conferiu o campo (`audit`) e o
total (`2 músicas`), e dali em diante procurou alvo **sempre com o teclado
escondido**. O script conta as escritas pelo log e nunca repete: se o alvo
não existe, ele para (`toque.sh` recusa em vez de tocar às cegas).

### §3.4 — Tab S6, conta principal

`N2-PR5 aceite` (setlist `3ccef313`, a das PR-5 e PR-6) apagada pelo diálogo
(`Apagar N2-PR5 aceite, com 5 músicas?`): `write op=delete setlist=3ccef313 …
status=200 ms=1999`, `resync … reason=write op=delete status=200 setlists=2
ms=3501`, S1 relida **sem ela**. Reabrir o app: **`cache write kind=setlists
n=2 invalidated=0`** e **`kind=content n=63 invalidated=0`**.

### A conta de escritas do nativo em prod no N2

| PR | conta principal (Tab S6) | conta de audit (AVD) |
|---|---|---|
| N2-PR3 | 1 (`create`) | — |
| N2-PR4 | 3 (`update`, `remove`, `delete`) | — |
| N2-PR5 | 1 (`reorder`) | 2 (`reorder` 60, ida e volta) |
| N2-PR6 | 2 (`add`, um bis) | — |
| N2-PR7 | 1 (`delete` da `N2-PR5 aceite`) | 13 (`create`, 10 × `add`, `reorder`, `delete`) |
| **total** | **8** | **15** |

**23 escritas.** Nenhuma setlist criada pelo nativo continua em prod: a da
N2-PR3 saiu na N2-PR4 (`286a4785`), a `N2-PR5 aceite` saiu agora, e a
`N2-PR7 audit` saiu no mesmo §3.3. A setlist de 60 da audit voltou à ordem de
antes na N2-PR5.

---

## 7 · Quedas de arnês, nenhuma de código (além do §5)

1. **Teclado do AVD cobre metade da tela**: `form-cancelar` (§2) e os
   `Adicionar` de baixo (§6) — o toque cai numa tecla. Remédio: `BACK` com
   teclado de pé, conferido pelo `mInputShown`, antes de procurar alvo.
2. **`input text` fora do campo recarrega o dev client** (o `r`), duas vezes:
   `romance` digitado com o picker já fechado. Sem escrita.
3. **O `mock.sh` salvava o estado do servidor por `GET`**, e no modo
   `escrita-resync-500` esse `GET` é o 500: o envelope de erro (JSON válido)
   sobrescreveu a fixture, e o mock não subiu. O `remove` do AVD que se
   seguiu saiu com `status=net` — foi assim que o defeito do §5 apareceu. O
   script passou a exigir uma LISTA; a fixture foi refeita da base.
4. **`force-stop` põe o dev client no lançador**; a volta é pelo link
   `exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`.
5. **A `Fixture de 100` tem 100**, e o teto inativa **acima** de 100: a
   primeira forma do roteiro tocou num `Reordenar` ativo (como deve) e entrou
   no modo. O estado `N2-X-100` se alcança com 101, pelo picker, como na PR-6.

---

## 8 · Regra 4 e "anexo não carrega texto de música", medidos

A varredura da regra 4 (o prefixo base64 de um JWT, por `grep -rl` em `docs/native/N2-PR7-anexos/`) → vazia — e o prefixo não é escrito aqui, para esta linha não ser a única a casar (div. 259). Os **42 dumps** são todos do
**mock**: **107** textos distintos, todos da fixture ou do app, e **zero**
`[UX-AUDIT]`, `N2-PR5` ou nome da conta principal. **Nenhum dump de prod foi
commitado** (`a-prod-*`, `t-prod-*`, `pa-*.xml` ficaram fora); os estados de
prod estão descritos em texto, sem título. Os dois PNG são recortes da faixa,
do mock.

## 9 · Mutações locais, declaradas antes e desfeitas

1. `apps/native/.env` copiado do checkout principal (sha256 `f2bfa179cd8e…`,
   idêntico), **apagado** no fim.
2. Tab S6: `stay_on` 0 → 7 → **0**; `accelerometer_rotation` 1 → 0 → **1**;
   `user_rotation` 0 → 1 → **0**.
3. Tab S6: **avião** para "sem rede" — lido (`0`), ligado (`ping` →
   `connect: Network is unreachable`), **desligado** (`0`).
4. AVD: estava em avião (`airplane=1 wifi=0 data=0`, lido); avião desligado e
   `svc data enable` para o mock e para prod (`ping` 20,8 / 27,0 / 27,9 ms);
   avião ligado de novo para "sem rede" e desligado; no fim **restaurado**
   (`airplane=1 wifi=0 data=0`, `ping` inalcançável).
5. `adb reverse` 8081/8788 no Tab S6 (**removidos**) e 8788 no AVD
   (**removido**; o 8081 do AVD já existia e ficou).

Estado final medido: Tab S6 `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1
data=1`, `reverse` vazio; AVD `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0
data=0`, `reverse` `tcp:8081`; host com 8081 e 8788 livres; `.env`
inexistente nesta árvore — igual ao lido no §1.
