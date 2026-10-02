# N4-BRIEF-anexos — as capturas, as medidas e a ida e volta do Tab

**Para quê**: o insumo do brief do Claude Design no N4 ([`../N4-BRIEF.md`](../N4-BRIEF.md)). O designer **não lê o
código nem o repositório**: o que ele precisa ver das telas de hoje está nesta pasta. Aqui está só o estado atual, sem
proposta de desenho. **Medidas**: [`MEDIDAS.md`](MEDIDAS.md), tiradas só dos dumps e dos tokens.

**PR** `n4/brief`, árvore `../octavia-n4-brief` sobre `origin/main` = `fab51e3` (o merge da #356, o release no Tab).
`pnpm install --frozen-lockfile --offline`. Fonte do bloco: [`N4-PRECHECK.md`](../N4-PRECHECK.md). **Nenhuma linha de
código muda.** `[medido]` = comando + saída literal nesta sessão, nos arquivos de [`aparelho/`](aparelho/).

**Nenhum dado da conta do Marcel em PNG, dump ou anexo.** Todas as capturas são do **mock** (`aceite.py servidor`) com a
fixture do pre-check do N3 (`N3-PRECHECK-anexos/instrumentos/fixture.py`, "hoje" = 2026-10-02): 3 setlists e 12 músicas
com texto escrito pelo projeto (*"Quando a noite chega…"*, `[Intro] C Am F G`, a tab `e|---0`), que a regra do
`CLAUDE.md` deixa ficar. Dos registros do aparelho, o que é do Marcel aparece só como contagem, md5, ordinal, `id[:8]`,
comprimento e `sha256[:12]`; o uid como `xVDJ…` ou `<uid>`; o PDF dele como `<arquivo>.pdf`. Conferido no fim:
`grep -rl "xVDJRBh1\|marcelviana@\|eyJ"` nesta pasta → exit 1.

## 1. As capturas — uma por superfície, nas duas composições

Tab S6 (`RX2N8000F3D`), **dev client** (`lastUpdateTime 2026-10-02 08:56:52`) com o Metro desta árvore. **C** = deitado
(`user_rotation=1`, raiz `[0,0][2560,1492]`, PNG 2560 × 1600); **B** = em pé (`user_rotation=0`, raiz `[0,0][1600,2452]`,
PNG 1600 × 2560). Cada estado recomeça de uma força-parada e de um sync contra o mock. Nome:
`N4BR-<tela>-<estado>-tab-<pai|ret>.{png,xml}`, em [`capturas/`](capturas/). Instrumento:
[`instrumentos/n4brief.py`](instrumentos/n4brief.py), sobre a cópia do `roteiro.py` do pre-check do N3 com a porta do
mock ([`instrumentos/copias.diff`](instrumentos/copias.diff)); saída verbatim em `aparelho/rodada-tab-pai.txt` e
`-ret.txt`.

| superfície | estado | fixture | como se chegou | C (`-pai`) | B (`-ret`) |
|---|---|---|---|---|---|
| **S1**, a lista de setlists (onde entra a entrada nova) | base: 3 setlists, `sincronizado agora` | a do pre-check do N3 | abrir o app | `S1-setlists` · `c23685cb673a` | `8b8124963d5b` |
| **S4**, a busca com resultados (o parente mais próximo da biblioteca) | `ensaio` digitado, teclado fechado; régua `BIBLIOTECA · 12 MÚSICAS` / `9 RESULTADOS` | idem | S1 → `Buscar música` → `ensaio` | `S4-resultados` · `6ff078d8073b` | `7cb986fac916` |
| **picker** (a régua de linha de lista com ação) | `ensaio` digitado; régua `NESTA SETLIST · ENSAIO DE RETRATO` / `6 RESULTADOS`; `já na setlist` + `Adicionar` | idem | S1 → `Ensaio de retrato` → `Adicionar música` → `ensaio` | `picker-resultados` · `1115fc3ab1ce` | `c946e1917fd4` |
| **palco com setlist** (a referência da barra) | `1 DE 8`, Letra, a barra com o nome da setlist | idem | S1 → `Ensaio de retrato` → música 1 | `S3-com-setlist` · `f1ff4f9990df` | `6a36d133f29a` |
| **palco avulso, aberto de S1, com setlists** | `AVULSA`, Cifra | idem | S1 → `Buscar música` → `ensaio` → `Segunda do ensaio` | `S3-avulso-de-S1-com-setlists` · `3cfd598817a7` | `ce7b85e12ebc` |
| **palco avulso, aberto de S1, com ZERO setlists** | o que o app mostra (div. 964) | o mesmo content; `setlists` = `[]` (o `vazio.json` do `roteiro.py`) | S1 vazia (`s1f`) → `Buscar música` → `ensaio` → `Segunda do ensaio` | `S3-avulso-de-S1-sem-setlists` · `5a9a75f768e9` | `9175c57b946a` |

(sha256[:12] do dump; o completo de todo arquivo em [`SHA256SUMS.txt`](SHA256SUMS.txt).)

**A faixa A não se captura**: em A o app usa hoje os tokens de B (`faixas.A = faixaB`), e a imagem do celular **não é**
a composição de A. A referência de A são as molduras `N3-A-*` do [`DESIGN-N3/telas.html`](../DESIGN-N3/telas.html).

### 1.1 O que o leitor da imagem precisa saber

- **O FAB do dev client** (engrenagem cinza, `content-desc="Tools"`, `[2436,119][2495,178]` em C, `[1476,119][1535,178]`
  em B): **não existe no app que o Marcel usa** (o release) e não é elemento do desenho. Em C fica sobre o fim de
  `Buscar música`; em B, na linha do título.
- **A barra de status** (0–54 px) e **a barra de tarefas da Samsung** (abaixo de 1492 px em C, de 2452 px em B) são do
  sistema.
- **Os números do cartão da `Ensaio de retrato`** diferem entre C (`0 de 2 arquivos baixados`) e B (`1 de 2`): a
  captura do palco em C baixou um PDF da fixture antes da rodada de B. É dado da rodada, não geometria.
- **O palco avulso com setlists já tinha captura**: a N3-PR6b capturou o mesmo estado (`N3P6B-S3-S3-avulsa`), e os dumps
  desta pasta saíram **byte a byte iguais** aos dela — div. 999.

## 2. A div. 964 medida no aparelho — o que o palco avulso aberto de S1 mostra

A div. 964 (`N4-PRECHECK.md` §4) era *"defeito presumido por leitura, não medido no aparelho"*. **Medido agora, sem
consertar nada** (`aparelho/div964-logs.txt`, `aparelho/extra-nona.txt`):

| caso | a barra mostra | o log diz (as linhas `OCTAVIA:` que o toque produziu) |
|---|---|---|
| **com setlists** (C e B) | `AVULSA` · **`ENSAIO DE RETRATO`** · `Segunda do ensaio · Duo Manacá · Cifra`; na barra de baixo, `Abrir o índice da setlist` e `Voltar para a busca` | `keepawake on` · `prefetch plan n=1 reason=demand` · `download-error nao-existe.pdf: Call to function 'FileSystemDownloadTask.start' has been rejected.` |
| **com setlists, música fora da 1ª setlist** — *extra, só barra e log, sem captura* | `AVULSA` · **`ENSAIO DE RETRATO`** · `Nona do ensaio · Duo Manacá · Letra` — a `Nona` só está na `Show de sexta`; a ordem de S1 é `setlist-00000001`, `-02`, `-03` | as mesmas três linhas |
| **zero setlists** (C e B) | **nenhuma barra**: só o placeholder `SETLIST` / `não está no cache`, centrado; **nenhum controle** no dump | **nenhuma** linha `OCTAVIA:` depois do toque |

- **Os três sintomas da div. 964 se confirmam**: (1) o nome na barra é o da **primeira setlist de S1**, sem relação com
  a música (o extra da `Nona` prova que é alheia); (2) o prefetch sob demanda roda **sobre a setlist hospedeira** — o
  `download-error` é o PDF da posição 5 da `Ensaio de retrato` (`Partitura que nunca baixou`), outra música; (3) com zero
  setlists, o palco não abre: cai no placeholder.
- **E dois que a leitura não tinha**: com setlists, o avulso oferece `Abrir o índice da setlist` — o índice de uma setlist
  alheia (não tocado nesta sessão); com zero setlists, a tela **não tem nenhum controle** — nem `sair`, nem bordas. Div.
  1001.
- O texto do `download-error` é o da exceção do `expo-file-system` para a URL que dá 404 no servidor de arquivos da
  fixture; registrado como saiu, sem investigar.

## 3. A ida e volta do Tab — a contabilidade do aparelho

A errata do [`APARATO.md`](../APARATO.md) (N4-D55) e a receita do mock, na ordem do §1 do prompt. Cada passo com a saída
em [`aparelho/`](aparelho/).

| passo | o quê | a saída (resumo; verbatim no arquivo) | arquivo |
|---|---|---|---|
| 1 | **estado inicial** lido e declarado | `stay_on=0` · `accelerometer_rotation=1` · `user_rotation=0` · `airplane=0 wifi=1 data=1` · `reverse` vazio · `isKeyguardShowing=true` · **release** (`lastUpdateTime 2026-10-01 20:53:35`, `pkgFlags` sem `DEBUGGABLE`), em segundo plano (`pidof` 10443); `stay_on` → 7 logo depois de lido | `estado-lido.txt` |
| 2 | `install -r` do **dev client** | sha256 `9447edc7…0548` = o da errata do `APARATO.md`; `am force-stop` antes (`pidof` exit 1); `Success`; `lastUpdateTime 2026-10-02 08:56:52`, `pkgFlags=[ DEBUGGABLE … ]` | `ida-devclient.txt` |
| 3 | **o cache real guardado** arquivo a arquivo (app parado), fora do repositório | md5 no aparelho = md5 das cópias: `setlists.json 232609e5…` · `content.json b62f192a…` · `files-index.json b21cc49b…` · `files/<arquivo>.pdf 05253d42…`; a pasta de demanda vazia; os quatro `._*` (163 B) ficam onde estão (N3-PR6c) | `guardado.txt` |
| — | host | `apps/native/.env` por `cp -p` do checkout principal (sha256 `f2bfa179cd8e…` nos dois; não aberto; `git check-ignore` → `.gitignore:23`); mock na 8788, arquivos na 8790, Metro na 8081 **sem `CI=1`**, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; `adb reverse` dos três; **bundle servido** (regra 13): `localhost:8788 1` · `octavia.rocks 0` · `textoDasSecoes 3` | `bundle.txt` |
| 4 | **as capturas** (§1) | 6 + 6, `falhas=0` nas duas rodadas; o Marcel destravou o Tab uma vez | `rodada-tab-pai.txt`, `rodada-tab-ret.txt`, `extra-nona.txt` |
| 5 | **o cache real devolvido** | a fixture deixou `partitura-1p.pdf` em `files/` e `partitura-12p.pdf` na demanda: **apagados**; os três JSON regravados por `exec-in`; md5 **iguais aos do passo 3, um a um** (`diff` → `IGUAIS`); a demanda vazia | `devolvido.txt` |
| 6 | `install -r` do **release** | sha256 `6eae4a8b…07b9` = o da errata; `Success`; `lastUpdateTime 2026-10-02 09:14:31`, `pkgFlags` **sem** `DEBUGGABLE`; `run-as: package not debuggable` | `volta-release.txt` |
| — | sem Metro, sem túnel | Metro, mock e arquivos parados (`lsof` 8081/8788/8790 → 0); `adb reverse --remove-all` → vazio — **antes** do passo 7 | `sem-metro.txt` |
| 7a | **a prova do release, em avião** (N4-D56) | avião lido (`0/1/1`), ligado (`airplane=1 wifi=3`), `ping` → `connect: Network is unreachable`; o app abre **em S1 sem pedir login** (`auth uid=xVDJ… src=restored`, `cache hit kind=setlists n=2`, `kind=content n=63`, `sync skip reason=offline`; nenhum `entrar` no dump); a **Cifra do ordinal 8** (`a9ed7dc4`) aberta pela busca: **`len=32 · sha12=5699489a26b4`** — os mesmos da PR-2 e do release; `api` 0; `FATAL` 0 | `passo7-aviao.txt` |
| 7b | **um sync de leitura com rede** (N4-D56) | avião desligado (`0/1/1`), `ping` 2/2; o app de novo: `api status=200 path=/api/setlists` · `api status=200 path=/api/content` · `cache write … invalidated=0` (os dois) · **`sync ok setlists=2 content=63 pages=1 t=3817`**; `api` **2**; `FATAL` 0 | `passo7-rede.txt` |
| 8 | **desmontagem** | `apps/native/.env` apagado (`ls` → *No such file or directory*); as cópias do cache e o arquivo com o título do ordinal 8 apagados do scratchpad (`ls` → idem); os dumps temporários do aparelho (`/sdcard/n3pre.xml`, `n3drv.xml`) apagados; Metro 0, mock 0, `reverse` vazio; `stay_on=0`, `accelerometer_rotation=1`, `user_rotation=0` (o arnês os tinha posto em 0/1), avião `0`, wifi `1`, dados `1` — **como lidos no passo 1**; o Tab fica com o **release**; `git status` vazio | `desmontagem.txt` |

**Fica fora do repositório, de propósito**: os dois APKs da errata do `APARATO.md` (não tocados). **Apagado**: tudo o
mais da sessão que tinha dado do Marcel.

### 3.1 Contabilidade

| | |
|---|---|
| requests a `/api/*` em prod | **2 `GET`** (o sync de leitura do passo 7b, autorizado pela N4-D56 como exceção) |
| requests a terceiros | **0** registradas: o token da sessão saiu do cache (`auth refresh=cached` no passo 7b); nenhum login |
| escritas em prod | **0**; no mock, **0** (só leitura e sync) |
| logins | **0** (`src=restored` em todas as aberturas) |
| `.env*` | `apps/native/.env` (autorizado `[Marcel, 2026-10-02]`), cópia por `cp -p`, não aberto, **apagado** |
| aparelho | Tab S6, destravado pelo Marcel uma vez; release → dev client → release (N4-D55); `stay_on` 0 → 7 → 0; rotação trocada pelo arnês e devolvida; avião ligado e desligado no passo 7 (regra 11); cache guardado e devolvido, md5 iguais |
| agentes | **0** |
| código | **nenhuma linha** |

## 4. Decisões `[Marcel, 2026-10-02]`

| # | decisão |
|---|---|
| **N4-D56** | (div. 1000) A prova do passo 7 se faz **nas duas formas, nesta ordem**: (1) **em avião** (regra 11: lido, declarado, provado pelo `ping`, restaurado) — o release abre em S1 sem pedir login e a Cifra do ordinal 8 abre com comprimento 32, pelo cache: a prova de que o cache real voltou; (2) **com rede**, um sync de leitura, **2 `GET` a prod, autorizados como exceção** ao "zero request" do prompt — a prova de que a sessão e o sync seguem funcionando. Zero escrita, zero login. |
| **N4-D57** | No N4 as **notas da música** aparecem **só na visualização**; o palco não muda. O site as chama de *Notas de palco*, e o palco do tablet mostra outra coisa (as notas da posição na setlist): hoje o que o músico escreve em *Notas de palco* não aparece em palco nenhum. **Mostrá-las no palco fica como item nomeado para o encerramento do bloco**, sem destino decidido. *(No brief: §2.2, §7 e a pergunta 10.)* |

## 5. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
  # N4 brief: nenhuma declaração — só docs.
```

```gates-web
  # só docs — N4 brief: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

## 6. Divergências — 999 a 1003

A última usada era a **998** (`N4-RELEASE-anexos/README.md` §9) `[medido: git grep -noE '\| \*\*(9[89][0-9]|1[0-9]{3})\*\*' -- docs]`.
Origem: **P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **999** | D | O `N4-PRECHECK.md` A15 (e o prompt, §2, que o repete) diz que o palco avulso *"não tem captura nenhuma"*. A **N3-PR6b** (mergeada antes do pre-check) já tinha capturado o avulso aberto de S1 com setlists, em C e em B, com PNG de B (`N3-PR6b-anexos/dumps-pai/N3P6B-S3-S3-avulsa-*`, `png/…-ret.png`) — e os dois dumps desta pasta saíram **byte a byte iguais** aos dela (`3cfd598817a7`, `ce7b85e12ebc`, os sha12 da tabela da N3-PR6b) | as capturas novas ficam (o prompt as pede, e as de C não tinham PNG); **o avulso com zero setlists é que não tinha captura** |
| **1000** | P | *"Zero request a prod"* (§0) × a prova do passo 7 (*"o release voltou a funcionar com os dados do Marcel, sem Metro"*): o release sincroniza sozinho com prod ao abrir com rede | perguntado antes do passo 7; **N4-D56** (§4): avião, depois 2 `GET` como exceção |
| **1001** | A | O palco avulso aberto de S1 tem **mais** do que a div. 964 previa: com setlists, oferece `Abrir o índice da setlist` — o índice de uma setlist alheia; com **zero** setlists, a tela cai no placeholder **sem nenhum controle** (sem barra, sem `sair`, sem bordas) | declarado, **não consertado**; vai com a 964 à **PR-6 — o palco avulso sem hospedeira** (N4-D30, N4-D45) |
| **1002** | T | A fixture do pre-check do N3 dá ids que começam todos por `00000000`: na S4 do mock **todo** resultado sai com o mesmo `testID` `resultado-00000000` (o `id[:8]`). Na conta real os ids diferem | registrado; não afeta o brief (que não cita `testID`). Pesa em quem achar resultado da S4 por `testID` no mock — candidata ao **W5** (instrumento) |

| **1003** | P | O prompt dos ajustes da revisão diz que o commit é *"só no `docs/native/N4-BRIEF.md`"*, e o item 1 manda registrar a N4-D57 também *"no README dos anexos"*; mudar o README muda o sha dele, e o `SHA256SUMS.txt` desta pasta tem de ser refeito no mesmo commit | o commit `docs(n4): brief — ajustes da revisão` toca os três: o brief, este README (§4 e esta linha) e o `SHA256SUMS.txt` |

**Contagem**: 5 — D 1 · P 2 · A 1 · T 1.

## 7. Índice

| arquivo / pasta | o que traz |
|---|---|
| `capturas/` | 12 PNG + 12 dumps (§1) |
| `MEDIDAS.md` | canvas, barras, linhas e alvos por faixa, com a origem de cada medida |
| `medidas-brutas.txt` | os `bounds` de todo nó com `resource-id` (e dos textos) dos 12 dumps, em px e dp |
| `aparelho/` | a ida e volta do Tab (§3), as rodadas, o extra da `Nona`, as linhas de log da div. 964, o bundle |
| `instrumentos/` | `n4brief.py` (as capturas), `prova7.py` (o passo 7: lê o título de um arquivo do scratchpad e nunca o imprime), `medidas.py`, `copias.diff` |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

---

**O que vem depois no bloco** (N4-D45): **o desenho**, em duas rodadas, a partir do [`N4-BRIEF.md`](../N4-BRIEF.md), e o
**congelamento** com sha em `docs/native/DESIGN-N4/` (N4-D18); depois dele, a **PR-3 — core das frases**.
