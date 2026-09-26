# N3-PR6b-anexos — as sete molduras do V1 em retrato (só aceite)

**Rastro.** A fonte é o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md) §11 (o A-N3-5 fechado) e o
[`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (N3-E19, o destino da 450 e as divergências 457–461). Árvore
`../octavia-n3-pr6b`, branch `n3/pr6b-sete`, sobre `origin/main` = `73b45ea` (merge da #331). **Nenhuma linha de
código muda**: o `apps/` desta PR é idêntico ao da `main`.

**Nenhum texto de música de terceiro**: todo dump é do **mock** (`aceite.py servidor`) com a fixture do pre-check
(`N3-PRECHECK-anexos/instrumentos/fixture.py`, "hoje" = 2026-09-23) mais os dois inválidos do `com_item_invalido` do
`aceite.py`. Conferido: dos **91** `text`/`content-desc` distintos dos 32 dumps, 68 estão nos anexos do pre-check e
das N3-PR1…PR6, e os 23 restantes são frases do app (`baixando suas setlists pela primeira vez`, `SEM CONEXÃO`,
`nada encontrado para “xablau”`, `este item não tem conteúdo`, `AVULSA`, `60 DE 60`…) e os títulos `[FIXTURE] …` do
`aceite.py`. `grep` de `eyJ`, e-mail real, `UX-AUDIT` e do nome do arquivo do Marcel sobre esta pasta: vazio (o
`octavia.rocks` só aparece na conferência do bundle, `estado/bundle.txt`, com contagem 0); o arquivo do Marcel no
cache do Tab aparece como `<o arquivo do Marcel>.pdf`. **PNGs**: os 28 conferidos na sessão (o (d′) de cada par, no
PNG); commitados os **14 de retrato** e os **2 de paisagem da `S5-n-grande`** (o controle do defeito), em `png/` —
sem letra: o único corpo em tela é a cifra de fixture do projeto (`[Intro] C Am F G`, "linha n da progressão de
fixture"), que a regra do `CLAUDE.md` deixa ficar.

## As sete, como cada uma se produz, e o resultado

Instrumento: [`instrumentos/n3pr6b.py`](instrumentos/n3pr6b.py) (sobre a cópia do `roteiro.py` do pre-check com a
porta do mock por aparelho, `instrumentos/copias.diff`). Cada estado recomeça de uma força-parada; nada é escrito
(nem no mock). Colunas: sha256 (12) do dump, `pai` = paisagem (C), `ret` = retrato (B).

| moldura | como se produz | Tab pai · ret | AVD pai · ret | G-N3 (e) | G6 | defeito em B |
|---|---|---|---|---|---|---|
| `S1a` sincronizando sem cache | **store apagado** (`run-as … rm files/octavia-<uid>/*.json`, app parado; o `ls` depois prova só `files/`) + mock **`atraso`** (45 s por resposta) → abre, e o `s1a` aparece com o 1º sync em voo (5,3–14,0 s depois de abrir) | `44eaa1ba8052` · `5bf15d1ec0fe` | `37b385a7bd83` · `74479cb40b76` | 0 | 4/4 | — |
| `S1d` offline sem cache | store apagado + **avião ligado antes de abrir** → `s1d` com `Tentar novamente` | `9080a9dc25a7` · `381e27364426` | `329c29c1319f` · `0d7c5269a76f` | 0 | 4/4 | — |
| `S2-invalidos` | mock com a `Ensaio de retrato` + **9 = `no-body`** (Lyrics sem corpo nem arquivo) e **10 = `unknown-type`** (tipo `Piano`), `updated_at` 13:00 (div. 457) → S1 → a setlist; e o **rolado** até a 10 | `37b3efcd1839` · `647742a64b41` | `5e76384344ee` · `f78ce339d6c9` | 0 | 4/4 | — |
| `S3-nobody` | o mesmo mock → rolado → `song-9` → palco `9 DE 10`, `este item não tem conteúdo` | `0a2f471f042b` · `a0a050e8b47f` | `27075aabda5b` · `4c6d801d8c1f` | 0 | 4/4 | — |
| `S3-avulsa` | mock normal → S1 → `buscar` → `ensaio` → `Segunda do ensaio` (cifra): da busca do S1 toda música é avulsa (`navigation.tsx`, `replace` com `avulsa`) → palco `AVULSA` | `3cfd598817a7` · `ce7b85e12ebc` | `69375d654b19` · `4b9945b2d93d` | 0 | 4/4 | — |
| `S4b` sem resultados | mock normal → S1 → `buscar` → `xablau` → `s4b` | `93b2fbdeac73` · `b8e5784999b7` | `eb09de782893` · `7eb82ea91251` | 0 | 4/4 | — |
| `S5-n-grande` | mock com a `Ensaio de retrato` de **60** (as músicas de texto da fixture em ciclo: 1, 2, 3, 7, 8, 9, 10, 12 — sem PDF), `updated_at` 14:00 → a setlist → rolar até `song-60` → `60 DE 60` → `borda-avancar` → S5 | `b8f368cae911` · `105ba42be135` | `872d19ae20cb` · `9703c88f4501` | 0 | 4/4 | **sim — a fileira de marcas passa da janela (div. 461)** |

**Nenhuma inalcançável.** Os 14 pares, os 28 dumps nas quatro colunas e os 4 rolados. **Seis passam em B; a
`S5-n-grande` revela um defeito** (abaixo), que os dois gates não veem.

## O defeito: a `S5-n-grande` em B (div. 461) — registrado, não consertado

[`s5-marcas.txt`](s5-marcas.txt) (instrumento `instrumentos/s5-marcas.py`), os dumps `N3P6B-S5-S5-n-grande-*` e os
PNGs `png/N3P6B-S5-S5-n-grande-*`:

| | janela | marcas no dump | larguras | x |
|---|---|---|---|---|
| C (paisagem), Tab e AVD | 1137,8 | **60 de 60** | 9,8 · 10,2 | 121,3 → 1016,4 |
| **B (retrato), Tab e AVD** | 711,1 | **48 de 60** | 7,6 · 8,9 · 9,8 · 10,2 | **0,0 → 711,1** |
| controle: S5 com 8 (N3-PR6), B | 711,1 | 8 de 8 | 33,8 · 34,2 | 202,2 → 508,9 |

A fileira calcula contra **900 dp fixos** (`FILEIRA`, `EndScreen.tsx:65`, a §7.1 do DESIGN-V1): com 60 músicas ela
mede 895 (10 + 5), centrada numa janela de 711,1 — **12 marcas ficam fora da janela** (6 de cada lado) e as duas das
pontas saem cortadas (7,6 e 8,9 dp). É a regra da folha do N3 quebrada (*"o conteúdo não sai"*), e é a **H-N3-3** do
pre-check (*"o S5 com N ≥ 24 transborda abaixo de ~883 dp"*, derivada da A2, nunca medida — a fixture tinha 8), agora
medida. Pela fórmula do `marcas()`, em B cabe até **N = 18** (697 dp) e passa a partir de **N = 19** (736); acima de
128 a barra sólida tem 900 e passa também. **Nem o G-N3 nem o G5/G6 a veem**: as marcas não têm texto (não há (e)
nem (d′)) e não são alvo. A contagem abaixo (`60 músicas · Ensaio de retrato`) está inteira. **O conserto é decisão
à parte** (instrução desta PR): esta PR só registra.

## Os gates

- **G-N3** ([`G-N3.txt`](G-N3.txt), comando verbatim no topo): **14 pares, (e)=0 · nome-acessível=4 · rolagem=4 ·
  4 dp = 0**, exit 0. As saídas da N3-D29: `Adicionar música` e `Apagar setlist` viram o nome acessível de
  `picker-abrir` e `setlist-apagar` na S2 (a N3-D17, como em toda S2e do bloco); a linha 8 (`8`, `Oitava do ensaio`)
  está abaixo da dobra e aparece no rolado do mesmo estado. **(d′) = 10, todos conferidos no PNG, nenhum defeito**:
  o `aviso-motivo` do `S1d` em duas linhas (747,6 → 615,1, o mesmo da `S1-aviso-sem-rede` da N3-PR6); o título da
  setlist na barra da S2 (783,6 → 356,9, o de toda S2e); o título do palco (→ 663,1) no `S3-nobody` e no
  `S3-avulsa`; e o corpo da cifra avulsa (906,7 → 647,1, ×1,9) — **os mesmos números do `S3b-cifra` já conferido na
  N3-PR6** (`N3-PR6-anexos/G-N3-consolidado.txt`): o palco avulso é o mesmo componente, com a mesma geometria.
- **G5/G6** ([`G5G6.txt`](G5G6.txt), comando verbatim no topo): **7 estados × quatro colunas, 28 de 28 células**,
  todo alvo ≥ 48 dp e com `testID`, os mesmos ids nas quatro, exit 0. Abaixo de 48, só linhas cortadas pela borda de
  baixo da lista (div. 291): `song-8` no retrato e `remover-7/8` na paisagem do AVD. As linhas 9 e 10 (as
  inválidas) só existem no rolado, que o instrumento pula (`-rolada`): no fim do `G5G6.txt`, nó a nó contra a lista de
  músicas — `song-9`/`song-10` com 116,0 de alto e `remover-9`/`remover-10` com 48,0 × 48,0 nas quatro colunas; os
  < 48 do rolado são **todos** linhas cortadas pela borda **de cima** da lista (y 176,0), que o instrumento não
  reconhece (div. 458).
- **FATAL**: 0 no buffer do logcat dos dois aparelhos no fim da sessão (`estado/fatal.txt`).

## As rodadas que caíram, e por quê (verbatim em `roteiros/`; div. 457)

| rodada | o que aconteceu | o que foi feito |
|---|---|---|
| `avd-pai-0-queda-arnes.txt` · `avd-ret-0-…` | a lista de estados foi passada ao arnês como **um argumento só** (`$E` entre aspas no zsh) | os estados um a um |
| `avd-pai-1-queda-arnes.txt` · `avd-ret-1-…` | o `set -- $o` do zsh não divide a palavra: `ROT` vazio, `settings put … user_rotation` recusado. E o **store não foi apagado**: `adb shell run-as … sh -c rm -f …` junta os argumentos, e o `sh -c` recebeu só `rm` (o `ls` depois mostrou os três JSON) | `${o%%:*}`; o `rm` numa string só, e o arnês **reprova** se sobrar `.json` |
| `tab-pai-0-queda-rotacao.txt` | no Tab o retrato é `user_rotation=0` (raiz 1600 × 2452) e a paisagem é 1 — o **inverso** do AVD; o `cap` recusou o nome (caso 23) antes de gravar | Tab com paisagem = 1 e retrato = 0 |
| `n60` em paisagem, nos dois | `ROLAGEM ESGOTADA: song-60`: a de inválidos deixou `updated_at` 13:00 no cache, a de 60 veio com o mesmo, e o sync compara por `!==` — ficou a de 10 | a de 60 com 14:00; refeita (`avd-pai-n60-2.txt`, `tab-pai-n60-2.txt`); o retrato já rodou com o conserto |
| `avd-pai-n60-2.txt`, `FALHA fecho` | a volta ao S1 depois da última captura não achou `criar-setlist` em 60 s | depois da captura; não conta — o AVD sobe do snapshot na próxima sessão |

## Aparato

- **Um mock por aparelho** (div. 446): AVD na **8788**, Tab na **8789** (`adb reverse tcp:8788 tcp:8789`), cada um
  com a sua cópia da fixture; arquivos (8790) e Metro (8081) compartilhados. Os dois rodaram em paralelo.
- **Metro** na 8081 **sem `CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline. **Bundle
  conferido** (`estado/bundle.txt`): `localhost:8788` 1 · `octavia.rocks` **0** · `N3-E17` 3 · `N3-E18` 3 ·
  `linhaFalha: 138.7` 1 — o build da `main`.
- **Dev client**: sem rebuild. AVD `2026-09-24 14:00:01`, Tab `2026-09-23 19:11:34`.
- **`.env`**: copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro; **apagado** no fim.
- **Escritas**: prod **zero**; mock **zero** (nenhum estado escreve — só leitura e sync).
- **O Tab travou entre o destravar e o `stay_on`**: o Marcel destravou enquanto o estado era lido, e a tela de 30 s
  apagou antes de o `stay_on` ir a 7. Destravado de novo com a tela acesa (`KEYCODE_WAKEUP`). A receita do
  `APARATO.md` já diz "`stay_on` a 7 antes de qualquer rodada longa"; o que faltou foi fazê-lo **antes de pedir o
  destravar** (div. 457).

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado, e por quê | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** (uma subida) | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit, `ram.bin` de 2026-09-24 14:00 | **`-no-snapshot-save`**; avião desligado, wifi/data ligados, `ping` 2/2 (div. 418); rotação; `reverse`; **store apagado** (S1a, S1d) e refeito pelo sync contra o mock | `reverse` vazio; desligado sem salvar; o `ram.bin` segue de 2026-09-24 14:00 |
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou, duas vezes) | `stay_on` 0→7; rotação; `reverse` (8788 → 8789); avião (S1d); **cache do app trocado pelo do mock, e apagado** (S1a, S1d) | settings iguais ao lido; `reverse` vazio. Cache **guardado antes** arquivo a arquivo e **regravado** com o app parado: `md5` dos três JSON idêntico (`estado/tab-md5-antes.txt` × `-depois.txt`); a `partitura-1p.pdf` de `files/` e a `partitura-12p.pdf` da demanda (div. 444), baixadas pelo sync da fixture, **apagadas**: sobra `<o arquivo do Marcel>.pdf`, e a demanda fica vazia, como a N3-PR6 a deixou; as cópias do host apagadas |
| **host** | 8081/8788/8789/8790 livres | Metro, dois mocks, arquivos | as quatro livres; `.env` apagado |

**Achado de passagem, fora do escopo**: o `files/octavia-<uid>/` do Tab tem quatro AppleDouble `._*` (163 B cada,
de 2026-09-14 a 2026-09-24) — o sintoma da div. 420. Não tocados: são de antes desta sessão.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `G-N3.txt` · `G5G6.txt` | os dois gates, comando verbatim, e as bordas do rolado |
| `s5-marcas.txt` | o defeito da div. 461: as marcas da S5, marca a marca, nas quatro colunas e no controle de 8; a largura por N |
| `dumps-pai/` · `dumps-ret/` | 14 + 14 dumps: os sete estados nas quatro colunas |
| `dumps-rolada/` | os 4 rolados da `S2-invalidos` (as linhas 9 e 10; a prova do `--rolada`) |
| `png/` | os 14 PNGs de retrato e os 2 de paisagem da `S5-n-grande` |
| `roteiros/` | a saída de cada rodada, verbatim, inclusive as que caíram |
| `estado/` | estado lido e restaurado de cada aparelho, o `md5` do cache do Tab antes e depois, o bundle, o FATAL |
| `instrumentos/` | `n3pr6b.py`, `s5-marcas.py` e `copias.diff` (a cópia do `roteiro.py` do pre-check: a árvore e a porta) |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |
