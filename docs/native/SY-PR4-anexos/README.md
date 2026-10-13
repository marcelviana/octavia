# SY-PR4-anexos — os gatilhos (a sincronização automática passa a existir)

**PR** (o número no corpo da PR e no §15), branch `sy/pr4-gatilhos`, árvore `../octavia-sy-pr4` sobre `origin/main` =
**`5ace638`** (`5ace6384986019545cb72b918ba81dd5a3d106dc`, o merge da #381: o `SY-PR3-anexos/README.md` com o §16
(SY-D49…SY-D55) e o §17; o `apps/native/test/sy-reprovados.txt` com **9** linhas de checagem) `[medido: git rev-parse
origin/main; git show origin/main:apps/native/test/sy-reprovados.txt]`. A `../octavia-sy-pr3` (limpa, o head `e85b4b2`
contido na `main`) **removida sem `--force`**; a árvore e a branch novas conferidas antes (`git worktree list`, `git branch
-a`: não existiam). `pnpm install --frozen-lockfile --offline`. Fonte do bloco: [`SY-PRECHECK.md`](../SY-PRECHECK.md) (as
decisões; A2, A7, A8, A9, A10), [`SY-PR1-anexos`](../SY-PR1-anexos/README.md) (os gates (i) e (v), os contratos, os
aceites congelados, §9), [`SY-PR2-anexos`](../SY-PR2-anexos/README.md) (o voo, o `ultimoSyncNaRede`, §15–§17) e
[`SY-PR3-anexos`](../SY-PR3-anexos/README.md) (a foto, a SY-D49, a tabela do §17 — as entradas obrigatórias desta PR).

Esta PR é a **PR-4** da SY-D14/SY-D29, a última de código: **os dois gatilhos do T1-R13 passo 4**, o intervalo, a marca,
a regra do palco aberto (SY-D49) e a linha `sync trigger`. Nenhum pixel, nenhuma frase, nenhum nó.

- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado, com caminho e linha da
  ponta da `main` (`5ace638`) ou desta branch, quando é o código dela; `[hipótese]` = o resto.
- **Texto**: só o do projeto (as fixtures desta PR e das anteriores, regra 10). **Agentes**: 0.


| arquivo | o quê |
|---|---|
| [`antes-main-suite.txt`](antes-main-suite.txt) | a suíte na `main` desta sessão (o "antes"; o vermelho do web é a div. 1292) |
| [`c1-verificacao.txt`](c1-verificacao.txt) · [`c3-…`](c3-verificacao.txt) · [`c4-…`](c4-verificacao.txt) · [`c5-…`](c5-verificacao.txt) | por commit de código: o extrator, G1a/G1b, G2/G3, os quatro `tsc`, o lint, a suíte e os juízes (`instrumentos/verifica.sh`); o commit 2 é só docs |
| [`c3-g3-73-antes-do-conserto.txt`](c3-g3-73-antes-do-conserto.txt) | o G3 70 → 73 achado antes do commit 3 (div. 1295) |
| [`gates/i-c1-sem-declarar.txt`](gates/i-c1-sem-declarar.txt) | a 1ª corrida do gate (i) com os 18 casos novos AINDA NÃO declarados: 16 reprovando por medida, 0 `lança:` |
| [`cn-sy-pr4.txt`](cn-sy-pr4.txt) · [`cn-sy-pr4-r.txt`](cn-sy-pr4-r.txt) · [`cn-sy-pr1-sobre-pr4.txt`](cn-sy-pr1-sobre-pr4.txt) · [`cn-sy-pr2-sobre-pr4.txt`](cn-sy-pr2-sobre-pr4.txt) · [`cn-sy-pr3-sobre-pr4.txt`](cn-sy-pr3-sobre-pr4.txt) | os controles negativos novos (`instrumentos/cn-sy-pr4.sh`, `plantar.py`) e os roteiros das três PRs anteriores sobre o código novo |
| [`gates-existentes.txt`](gates-existentes.txt) · [`gates-web.txt`](gates-web.txt) · [`blocos-decl.txt`](blocos-decl.txt) | os gates que já existiam, os do web, os extratores sobre o corpo da PR |
| [`avd/`](avd/) | o AVD: o estado antes e depois (`estado-diff.txt` vazio), o `ram.bin`, a receita, o bundle servido, o `.env` por sha, os cenários (`cenarios/`, um arquivo por cenário com o declarado antes e o medido), o controle da base (`controle-base/`), o diagnóstico da parada (`diagnostico-parada/`), o mock em avião, as quedas, o logcat; o que foi descartado e por quê, como rastro (`cenarios-1a-corrida/`, `cenarios-descartados/`) |
| [`instrumentos/`](instrumentos/) | `verifica.sh`, `cn-sy-pr4.sh` + `plantar.py`, `avd/` (`fixture-pr4.py`, `gatilhos-avd.py`, `bundle.sh`, `diagnostico-parada.py`) |

---

## 0. As decisões do Marcel durante a sessão — SY-D56 e SY-D57 `[Marcel, 2026-10-13]`

Duas perguntas que o prompt manda trazer **na hora** (§5: o caso novo que pede decisão; a tela nova na falha), feitas
antes do commit 1 e respondidas pelo Marcel; o texto é o da resposta.

| # | decisão (pergunta) |
|---|---|
| **SY-D56** | (o avulso) **O palco avulso sem hospedeira também conta como palco aberto.** A SY-D49 (1) define o palco aberto como "a sessão do palco, a mesma da foto"; o avulso sem hospedeira (o ▶ na L ou em V, `Stage { avulsa, origem }`) não abre sessão de foto, e é o mesmo `StageScreen` com rolagem (as mesmas pausas). Fica: **"palco aberto" = a sessão da foto OU um palco avulso sem hospedeira montado**; a foto da sessão (`foto-do-palco.ts`) é a única fonte que os gatilhos leem. |
| **SY-D57** | (a falha automática com cache, SY-D43) **Opção 1: manter o S1e de hoje.** A falha de um sync automático com cache mostra o mesmo estado que a falha da abertura já mostra, sem pixel nem frase novos. **Duas condições, para o gate e para o aparelho:** (1) **o banner some sozinho no próximo sync que der certo, inclusive um automático** — um caso do gate e no AVD; (2) **o banner aparecendo em S1 ou na Biblioteca não desfaz o que o músico está fazendo na hora** (uma busca digitada, uma rolagem da lista, S2 em edição) — **se desfizer, pare e pergunte.** O "sem conexão" com a rede de pé segue como herança (div. 1278, SY-D43). |

## 1. Os commits, por ordem

| # | commit | o quê | a lista |
|---|---|---|---|
| 1 | `b25b548` | **os gates novos, entrando reprovados** (SY-D49 (3)): 13 casos no gate (i) e a família `tela-` (5 casos, arquivo novo); os contratos estendidos e **ainda inertes** (`gatilhos.ts`, `foto-do-palco.ts`, o `uid` no `ultimoSyncNaRede`); o juiz ganha a família | 9 → **25** |
| 2 | `f7e61a1` | **a leitura obrigatória** da falha com cache (§2), antes de ligar qualquer coisa — e a parada com a pergunta (SY-D56, SY-D57, §0). Só docs | 25 |
| 3 | `a11f73f` | **os gatilhos de verdade**, sem o palco: o `AppState`, a transição da rede, o relógio, a marca, o intervalo, a linha `sync trigger`; o `alcancavel` e o cabeçalho do `net.ts`; a ligação no `App.tsx` (a foto da sessão passa a nascer na raiz) | 25 → **9** |
| 4 | `cc7dc25` | **o palco, o avulso, o "de novo" que espera e a sessão do intervalo** (SY-D49, SY-D56, SY-D44): a foto da sessão como fonte única do "palco aberto", o `segurarDeNovo` no executor, o `PalcoAvulsoAberto` e o `focoDoIndice` no `navigation.tsx` | 9 → **0** |
| 5 | `d1e050b` | **a lista vazia vira condição** dos cinco gates (o molde do gate da quebra) | 0 |
| 6 | (os de anexo) | o aparelho (o AVD), os CN | — |
| 7 | (o de docs) | este README e as erratas de ponteiro | — |

## 2. A leitura obrigatória — o que o músico vê quando um sync automático falha com cache (SY-D43) `[lido: 5ace638]`

**Antes de ligar qualquer coisa** (o commit 2). O executor é o mesmo para todo pedido (a abertura, o *Tentar de novo* e,
nesta PR, os gatilhos), e o que ele faz com a tela num sync que **falha** não depende de quem pediu:

| passo | o que o executor faz | `[lido]` |
|---|---|---|
| o começo | `setSync({ fase: 'sincronizando' })` | `apps/native/src/sincronizador.ts:106` |
| a falha (prazo, rede, status) | o cache fica como está, e `setSync({ fase: 'falha', syncedAtMs: <o de antes>, messageKey })` | `sincronizador.ts:172-179` |
| a chave da falha | `network` → `erro.sem_conexao` (o prazo inclusive: `code=network`, SY-D32); `server` (o 500) → `erro.falha_do_servidor` | `packages/core/src/errors.ts:52`, `:57` |
| a frase da chave | `erro.sem_conexao` → *"sem conexão"*; `erro.falha_do_servidor` → *"falha no servidor"* | `packages/core/src/frases-content.ts:231`, `:236` |

**Quem lê a fase do sync, e o que mostra** — tela por tela, com cache (`temCache = true`):

| tela | durante o sync | depois de uma falha | `[lido]` |
|---|---|---|---|
| **S1** | o chip vira *"sincronizando…"* | **o banner (e)**: o ícone de falha, a frase da chave + *"mostrando dados de há X"* e o alvo **`Tentar novamente`** (`tentar-banner`); o chip vira *"mostrando dados salvos"*; **e os cartões da lista ficam COMPACTOS** (`compacto={comBanner}`) com o respiro do banner no topo da lista (`listaComBanner`) | `SetlistsScreen.tsx:218-236` (o chip), `:476`, `:612-628` (o banner), `:684`, `:691` (a lista) |
| **a L (Biblioteca)** | nada (a lista é do cache) | **a linha de aviso** (`LinhaDeAviso`): a frase + *"mostrando dados de há X"* e o **`Tentar novamente`** — salvo se outra linha tem a vez (o aviso do favoritar, a falta de rede) | `LibraryScreen.tsx:200-211`, `:347-348` |
| **S2** (o índice de S1, com edição) | o rótulo das posições cujo conteúdo falta (o `syncDone` falso, `labelFor`) | nada: S2 não lê a fase | `App.tsx:312`; `IndexScreen.tsx:284`; `packages/core/src/song.ts:41` |
| **o palco**, o índice do palco, a busca, o fim | nada: não leem a fase do sync (o palco lê só o `online`) — e, com o palco aberto, os gatilhos não disparam (SY-D49) | nada | `navigation.tsx:251-306` (o palco), `:194-249` (o índice), `:308-332` (o fim), `:362-391` (a busca) — as props |
| **V** | nada (não lê a fase) | nada | `navigation.tsx:350-360` |

**Por caso**, com cache, em S1 (o que hoje só aparece depois da abertura ou de um *Tentar de novo* que falham):

- **por prazo** (o mock no `atraso`: o `GET` passa dos 20 s, `code=network`): *"sem conexão · mostrando dados de há X"* +
  `Tentar novamente` — **com a rede de pé** (a herança da div. 1278, SY-D43);
- **por rede** (o mock derrubado: `code=network`): o mesmo texto;
- **por status** (o mock no 500): *"falha no servidor · mostrando dados de há X"* + `Tentar novamente`.

Na L, as mesmas frases na linha de aviso; no palco, em V e em S2, nada muda.

**A consequência, e a parada.** Com os gatilhos, esse banner e essa linha passam a poder aparecer **num momento em que hoje
não aparecem** — a volta do segundo plano, a rede que volta. É o caso do §5 do prompt (*"aviso, botão ou troca de tela que
hoje não aparece nesse momento"*): **a PR parou antes do commit 3 e trouxe a pergunta**, que o Marcel respondeu na hora —
**SY-D57** (§0): fica o S1e de hoje, com duas condições. As duas viraram casos do gate (`i:tela-banner-some`,
`i:tela-banner-nao-desfaz-s1`, `i:tela-banner-nao-desfaz-l`, e os de S2, `i:tela-s2-reordenar`, `i:tela-s2-folha`) e
cenários do aparelho (§8).

**O que o `native-tela` não vê, e vai ao aparelho**: os **cartões compactos** — com o banner, a lista de S1 não se remonta
(o caso do gate mede o MESMO nó, que é o que zeraria a rolagem), mas cada cartão encolhe ao `cartaoCompacto` e a lista ganha
o respiro do topo: **o conteúdo se desloca debaixo do dedo**. Se isso conta como "desfazer a rolagem" (a condição 2 da
SY-D57), só o aparelho diz — o roteiro do §8 rola a lista ao meio, provoca a falha automática e compara o cartão visível
antes e depois.

## 3. A lista, 9 → 25 → 9 → 0, linha a linha `[medido: c1…c5-verificacao.txt; gates/i-c1-sem-declarar.txt]`

**Entram no commit 1** (16; cada uma reprovando **por medida** na 1ª corrida, sem declarar — `gates/i-c1-sem-declarar.txt`, `grep -c "lança"` → 0):

| linha | o que mede | reprovava, no commit 1, porque | sai em |
|---|---|---|---|
| `i:linhas-sem-disparo` | SY-D28: os que não disparam deixam a linha — `skip-short`, `skip-interval`, `skip-offline`, `skip-background`, na ordem | nenhuma linha (o contrato inerte) | **c3** |
| `i:logout-intervalo-de-outra-sessao` | SY-D44: o último sync da sessão A não segura o gatilho da sessão B (o `ultimoSyncNaRede` do EXECUTOR, o que o `App.tsx` passa) | 0 sync; no commit 3, `skip-interval` (o intervalo lia qualquer sessão) | **c4** |
| `i:palco-rede` · `i:palco-fundo` | A-SY-23: os dois gatilhos com o palco aberto → 0 sync e `hold-stage` | nenhuma linha; no c3, `run` (1 sync) | **c4** |
| `i:palco-indice-por-cima` | o índice do palco por cima (o foco do `Index` com `posicaoAtual`) — a mesma sessão segura | nenhuma linha; no c3, 2 syncs | **c4** |
| `i:palco-sair-com-marca` | sair com a marca → `stage-exit run`, 1 sync | 0 sync; no c3, `net run` sem marca | **c4** |
| `i:palco-sair-no-intervalo` | sair dentro do intervalo → `stage-exit skip-interval`, 0, e a marca se consome (um 2º foco de S1 não faz nada) | as linhas | **c4** |
| `i:palco-sair-sem-rede` | sair sem rede → `stage-exit skip-offline`, 0; a rede que volta depois → `net run`, 1 | 0 sync | **c4** |
| `i:palco-v-aberta` | V aberta (fora da sessão) → o gatilho roda | 0 sync | **c3** ⚠ |
| `i:palco-de-novo-espera` | o "de novo" de um voo quando o palco abre no meio → `again hold-stage`, e roda ao sair | 1 sync (nada encadeado); no c3, o "de novo" rodou com o palco aberto | **c4** |
| `i:palco-avulso` | SY-D56: o avulso sem hospedeira segura; desmontado, `stage-exit run` | 0 sync; no c3, `net run` | **c4** |
| `i:tela-s2-reordenar` | SY-D52: S2 reordenando com um arrasto; o gatilho traz a setlist renomeada → o modo segue aberto, a ordem é a do arrasto, `Salvar a ordem` ativo | 0 sync (o gatilho não chegava) | **c3** ⚠ |
| `i:tela-s2-folha` | SY-D52: a folha de renomear com um nome digitado; o gatilho → o nome fica | 0 sync | **c3** ⚠ |
| `i:tela-banner-some` | SY-D57 (1): a falha automática (500) põe o banner; o próximo sync automático ok o tira | 0 sync | **c3** ⚠ |
| `i:tela-banner-nao-desfaz-s1` | SY-D57 (2): com o banner, a lista de S1 é o MESMO nó (remontar é o que zera a rolagem) | sem banner | **c3** ⚠ |
| `i:tela-banner-nao-desfaz-l` | SY-D57 (2): a linha de aviso na L não apaga o termo digitado nem o resultado | sem linha de aviso | **c3** ⚠ |

**Saem no commit 3** também as 9 originais: `i:rede-volta-na-frente`, `i:fundo-mais-de-30s`, `i:marca-volta-curta`, `i:dois-eventos`, `i:apos-falha-de-rede`, `i:de-novo-fora-do-intervalo`, `v:rede-volta-100` (2 GET), `v:rede-volta-101` (3 GET), `v:fundo-100` (2 GET).

⚠ **Div. 1294**: o prompt manda o commit 4 tirar *"as linhas que o commit 1 acrescentou"*, S2 inclusive. O `palco-v-aberta` e as cinco `tela-` passaram **já com o commit 3** — dependem só de o gatilho chegar à tela, não do palco —, e deixá-las na lista faria o juiz acusá-las ÓRFÃS (regra 14). Saíram no commit 3, que o diz (a mesma forma da div. 1285 da PR-3).

**Passam desde o commit 1 e nunca entraram**, cada um com o CN que o faz reprovar (a lição da div. 1283): `i:palco-sair-sem-marca` (CN g-2) e `i:palco-abertura-e-tentar` (CN g-12) — §6.

**A conta**: 9 → **25** (c1) → **9** (c3: −16) → **0** (c4: −9). Os juízes na ponta: (i) 0 · (i) `tela-` 0 · (ii) 0 · (iii) 0 · (iv) 0 · (v) 0 — *"zero reprovações, lista vazia (SY-PR4) ✓"* nos seis (`c5-verificacao.txt`).

## 4. O que entrou, e as respostas que o prompt pede

### 4.1 Os gatilhos (`apps/native/src/gatilhos.ts`)

O contrato da SY-D33, com o `AppState` e o `expo-network` assinados dentro do módulo. As regras, como o arquivo as aplica (o cabeçalho as lista, com a fonte de cada uma):

| evento | sem sessão | app em segundo plano | palco aberto | sync em voo | dentro do intervalo | senão |
|---|---|---|---|---|---|---|
| a rede `false → true` | nada, nenhuma linha | `skip-background` + a marca | `hold-stage` + a marca do palco | `queued` (o executor marca o "de novo") | `skip-interval` | `run` |
| a volta a `active` ≥ 30 s | nada | — | rede lida na hora: sem rede `skip-offline`; com rede, `hold-stage` | `queued` | `skip-interval` | `run` (`reason=foreground`) |
| a volta < 30 s com a marca (que nenhum sync atendeu) | nada | — | idem, `reason=net` | idem | idem | `run` (`reason=net`) |
| a volta < 30 s sem a marca | nada | — | — | — | — | `skip-short` |
| o palco fecha com a marca do palco | nada (a marca era de outra sessão) | — | — | `queued` | `skip-interval` | `run` (`reason=stage-exit`); sem rede, `skip-offline` |
| o executor ia rodar o "de novo" com o palco aberto | — | — | `hold-stage` (`reason=again`) | — | — | — |

A primeira leitura da rede (`null → true`) e o evento repetido (`true → true`) não são gatilho, e não deixam linha. A rede da volta e do fechar do palco se lê **na hora** (`estaOnline`), não a do último evento. **Nada tenta de novo sozinho** (SY-D32 (4)): os gatilhos são eventos.

**A linha nova** (SY-D28, com o acréscimo da SY-D49), uma por gatilho avaliado: `` log(`sync trigger reason=${motivo} decision=${decisao}`) `` — `reason=net|foreground|stage-exit|again`, `decision=run|queued|skip-interval|skip-short|skip-offline|skip-background|hold-stage`. Os valores `stage-exit`, `again` e `hold-stage` são **proposta desta PR** (Q1). O `sync start` não mudou.

### 4.2 De onde os gatilhos sabem que o palco está aberto (SY-D49 (1), SY-D56)

**Da foto da sessão** (`foto-do-palco.ts`), a mesma da SY-D22 — **um estado só**, sem cópia nos gatilhos nem na raiz: a foto ganhou o `PalcoDosGatilhos` (`palcoAberto()`, `aoFecharPalco(f)`) e "palco aberto" é **a sessão** (de `entrar` — a posição tocada em S2, o resultado da busca aberta de S2 — até `sair`, no foco de S1 ou de S2) **ou um palco avulso sem hospedeira montado** (`abrirAvulso`, ligado no `navigation.tsx` por um componente que envolve o `StageScreen` do avulso e solta ao desmontar). A regra do foco do índice ("com `posicaoAtual` é o índice do palco: a mesma sessão") passou do ouvinte do `navigation.tsx` para a foto (`focoDoIndice`), onde o gate a monta. **A foto passou a nascer no `App.tsx`** (era `useState` no `navigation.tsx`) e a navegação a recebe por prop: é a raiz que a dá aos gatilhos. **V não entra** na foto: com V aberta os gatilhos rodam (o gate e o c16).

### 4.3 O que decide o `ultimoSyncNaRede` no logout (SY-D44)

**Ele não se zera.** O executor o grava com o **`uid` da sessão que pediu** (o `SyncNaRede` ganhou o campo), e **quem decide é quem consome**: os gatilhos só contam o intervalo contra um sync **da sessão de agora**. O sync em voo de outra sessão continua valendo para o `queued` (o voo único é um só; o executor descarta o resultado da sessão velha e roda o "de novo" pela nova, SY-D17). O caso: `i:logout-intervalo-de-outra-sessao` (o login de B sem rede: `sync skip`; a rede volta 3 s depois → `run`, e não `skip-interval` pelo sync de A de 5 s antes); o CN g-9 (o intervalo de qualquer sessão) o reprova.

### 4.4 O "de novo" que espera (SY-D49 (2))

O executor (`sincronizador.ts`) pergunta `raiz.segurarDeNovo?.()` antes de rodar o "de novo" — só quando ele **rodaria** (há pedido guardado e a sessão é a mesma). `true` → o "de novo" se cancela no voo e vira **a marca do palco** (`again hold-stage`); ao fechar o palco, passa pelas regras de sempre — **inclusive o intervalo** (a leitura literal da SY-D49 (2); a alternativa é a Q4). O sync da abertura e o *Tentar de novo* não passam por aqui (CN g-12).

## 5. Os números — a suíte, o G2 e o G3

| | a `main` (`5ace638`) | a ponta (`d1e050b`) | a diferença |
|---|---|---|---|
| suíte | `157 passed \| 3 skipped (160)` · `1914 passed \| 59 skipped (1973)` (`SY-PR3-anexos` §1.1); medida nesta sessão com **1 vermelho do web** (div. 1292) | `158 passed \| 3 skipped (161)` · `1933 passed \| 59 skipped (1992)` | **+1 arquivo** (`sy-gatilhos-telas.test.tsx`), **+19 testes** (13 casos novos no gate (i) e 6 na família `tela-`: 5 casos e o juiz); os 59 pulados, os mesmos |
| G2 — `testID` | 124 | **124** | nenhum nó novo |
| G3 — linhas `log(` | 70 | **71**, *"nenhuma linha sumiu ✓"* | **uma adição**: `apps/native/src/gatilhos.ts` `` log(`sync trigger reason=${motivo} decision=${decisao}`) `` — a saída do gate a lista em *"linhas NOVAS"*; nenhuma errata, nenhuma remoção |

Os quatro `tsc` (raiz, core, identidade, nativo, de dentro de cada pacote) 0 e o lint `✔` em todo commit de código. **Nenhum módulo nativo novo**: `git diff --stat origin/main -- apps/native/package.json apps/native/app.json pnpm-lock.yaml` → vazio (`blocos-decl.txt`).

## 6. Os controles negativos (regras 4 e 7)

### 6.1 Os novos `[medido: cn-sy-pr4.txt]`

`instrumentos/cn-sy-pr4.sh` + `plantar.py` (cada defeito é UMA troca de texto com a âncora conferida; o `git status` do fim: só os anexos). **Os 17 acusaram**, como reprovação NÃO DECLARADA (a lista vazia):

| CN | o defeito plantado | o que acusou |
|---|---|---|
| g-1 | **o gatilho que ignora o palco** | `palco-rede`, `palco-fundo`, `palco-indice-por-cima`, `palco-sair-com-marca`, `palco-sair-no-intervalo`, `palco-sair-sem-rede`, `palco-avulso` |
| g-2 | **o que dispara ao sair sem marca** | `palco-sair-sem-marca` (o que passava desde o commit 1), `palco-v-aberta` |
| g-3 | **o que conta `null → true`** | `primeira-leitura` (e o controle do servidor do gate (v): a abertura sai com um sync a mais) |
| g-4 | **o que ignora o intervalo** | `dois-eventos`, `dentro-do-intervalo`, `apos-falha-com-status`, `linhas-sem-disparo`, `palco-sair-no-intervalo` |
| g-5 | **o que tenta de novo sozinho depois de uma falha de rede** | `falha-de-rede-nao-retenta` |
| g-6 | **o que dispara em segundo plano** | `rede-volta-no-fundo`, `linhas-sem-disparo` |
| g-7 | **o "de novo" que roda com o palco aberto** | `palco-de-novo-espera` |
| g-8 | **a linha `sync trigger` que falta num caso que não dispara** (o `skip-short`) | `linhas-sem-disparo` |
| g-9 | o intervalo de qualquer sessão (SY-D44) | `logout-intervalo-de-outra-sessao` |
| g-10 | o avulso sem hospedeira não abre o palco (SY-D56) | `palco-avulso` |
| g-11 | o foco do índice do palco solta a sessão | `palco-indice-por-cima` |
| g-12 | o executor segura a abertura e o *Tentar de novo* com o palco aberto | `palco-abertura-e-tentar` (o que passava desde o commit 1), `palco-sair-no-intervalo` |
| t-1 | o sync ok não tira o banner (SY-D57 (1)) | `tela-banner-some` |
| t-2 | a lista de S1 se remonta com o banner (SY-D57 (2)) | `tela-banner-nao-desfaz-s1` |
| t-3 | a L apaga a busca quando o sync muda (SY-D57 (2)) | `tela-banner-nao-desfaz-l` |
| t-4 | o modo de reordenar refaz a ordem a cada setlist nova (SY-D52) | `tela-s2-reordenar` |
| l-1 | **uma linha na lista vazia**, com o defeito que a faz reprovar de fato (o commit 5) | `✗ LISTA NÃO VAZIA (1)` |

### 6.2 Os roteiros da PR-1, da PR-2 e da PR-3, sobre o código novo

`[medido: cn-sy-pr1-sobre-pr4.txt, cn-sy-pr2-sobre-pr4.txt, cn-sy-pr3-sobre-pr4.txt, cn-sy-pr4-r.txt]` — os três roteiros sem
mudança; o `git status` do fim de cada um, limpo.

- **PR-1** (`cn-sy.sh`): **o laboratório dos gatilhos dela é da forma antiga do contrato** — não devolve o `segurarDeNovo`, não
  lê o palco, não escreve a linha. Copiado sobre o `gatilhos.ts` de agora, ele já reprova no **i-0** (sem defeito) os casos
  novos (o palco, as linhas, o logout) e, depois do primeiro "de novo", os seguintes: o executor pergunta `segurarDeNovo`, o
  laboratório não o tem, a chamada lança **fora** do `try` do sync, e o voo fica preso no resto do arquivo. **Os defeitos
  específicos seguem acusados nos casos deles**: i-1 (`dentro-do-intervalo`, `apos-falha-com-status`, `dois-eventos`), i-4
  (`marca-apaga-com-sync`), i-5 (`rede-volta-no-fundo`), i-6 (`sem-sessao`), i-7 (`volta-sem-rede`), i-8
  (`fundo-menos-de-30s`), i-10; o ii-1 (`logout-cancela-de-novo`), o ii-2 (`escrita-conteudo-aplica`), o iii-0, o iii-2
  (`sessao-solta`), o v-1 (os 3, com o dobro de `GET`). **O i-2 e o i-3 não se distinguem do i-0** com o laboratório antigo —
  e os dois têm o equivalente sobre o código de verdade: **g-3** (`primeira-leitura`) e **g-5** (`falha-de-rede-nao-retenta`).
  *(Registro: um `segurarDeNovo` que lançasse prenderia o voo — no app ele é a ligação da raiz, que não lança; a
  lição é do instrumento. Pergunta à parte só se o aval quiser a chamada dentro do `try`, Q9.)*
- **PR-2** (`cn-sy-pr2.sh`): n-1, n-2 (só pelo `voo.test.ts`, 4 ×: a div. 1281, SY-D48), n-2b, n-3, n-4, n-6, n-7, n-8 e n-9
  (`sy-ultimo-sync.test.ts`, 2 ×) **acusam como na PR-2**. O **n-5 não plantou**: a âncora dele é a linha do "de novo" que esta
  PR mudou de propósito (o `roda`, com o `segurarDeNovo`). **Replantado na âncora nova** (`cn-sy-pr4.sh`, **r-1**): acusa
  `ii:logout-cancela-de-novo`.
- **PR-3** (`cn-sy-pr3.sh`): c-1, c-3, c-5, c-6, c-7, c-8 acusam como na PR-3; c-2 (o laboratório sem defeito) dá a lista vazia;
  c-9 passa no gate e os dois testes de V o acusam (como na PR-3). O **c-4 não plantou**: o `sair` da foto mudou (ele avisa o
  fechar do palco). **Replantado** (**r-2**): acusa `iii:sessao-solta`.

## 7. Os gates que já existiam

`[medido: gates-existentes.txt, gates-web.txt]` — sobre os dumps commitados da volta da QL-PR4 (a PR não muda tela nem dump;
o resultado tem de ser o do encerramento do QL e o da PR-3): **G-inv** B5 e B3 `IDÊNTICO EM DP ✓`; **G-N3** `(e)=0 · (b)=0 ·
nome-acessível=8 · rolagem=6 · quebra=16 ✓` (84 pares); **G-par** de V zero diferenças (2); **o gate da quebra** *"zero
reprovações, lista vazia"*; `icones` 0 acusações; `a20` 229 literais, 0 acusações; os `SHA256SUMS` dos congelados; **os do web**:
G-back, G-palco, G-tok, a cobertura e o G-faixa **PASSAM** (0 declarações no bloco `gates-web`). **Os testes do sync, do voo,
da foto, das escritas, do favoritar e do prazo** seguem verdes na suíte, sem errata.

## 8. O aparelho — só o AVD `[medido: avd/]`

**O aparato** (APARATO.md): o `octavia_tab32` subido do `default_boot` com `-no-snapshot-save` (o `ram.bin` de 2026-09-24 14:00 no começo e no fim, `ram-bin-*.txt`); **o estado lido antes e depois, com o `diff` vazio** (`estado-diff.txt`: `stay_on=1`, `accelerometer_rotation=1`, `user_rotation=0`, `airplane=1 wifi=0 data=0`, `reverse` vazio, o dev client de 2026-09-24 14:00:01 `DEBUGGABLE`, o app parado, `ping` → *Network is unreachable*); **a receita do cache da conta de audit** (N4-D102): 5 caminhos guardados md5 a md5 e tirados por nome, regravados 5 de 5 md5 no fim (`receita-*.txt`; a fixture desta PR não tem `file_url`: nada a apagar); **o bundle servido antes de qualquer abertura** (`bundle-servido.txt`): `localhost:8788` 1 · `octavia.rocks` 0 · `ligarGatilhos` 5 · `segurarDeNovo` 9 · `abrirAvulso` 3 · `focoDoIndice` 3 · `aoFecharPalco` 3; o Metro sem `CI=1`, `--clear`, a URL do mock inline; o `apps/native/.env` por `cp -p` do checkout principal **sem abrir** (sha256 `f2bfa179cd8e` nos dois, `env-sha.txt`), apagado no fim; o mock (`aceite.py servidor 8788`, a fixture `instrumentos/avd/fixture-pr4.py`, texto do projeto) trocando de modo por reinício; `logcat -G 16M` e `-c` uma vez, antes. **O Tab S6 não se tocou** (ligado por USB a sessão inteira; todo `adb` com `-s emulator-5554`).

**O mock com o rádio mudando** (a hipótese da A9, medida): o túnel do `adb reverse` não passa pelo rádio — em avião, com o `ping` inalcançável, uma requisição de dentro do aparelho a `127.0.0.1:8788` **chegou ao mock** (`REQ /api/setlists` no log dele, `mock-em-aviao.txt`). O que o app vê é o `expo-network`: em avião ele diz "sem rede" e o sync é pulado (`sync skip`); desligado o avião, a transição `false → true` é o gatilho. **O avião do repouso volta no fim** pelo caminho inverso (`svc wifi/data disable`, avião ligado), provado pelo `ping` (`estado-depois.txt`).

**Os cenários** (`instrumentos/avd/gatilhos-avd.py`; cada arquivo com **o declarado antes** — as linhas `sync trigger`, os `sync start` e os `GET` — e o medido, pelas linhas `sync trigger`, `sync start` e `api`):

| cenário | o que se fez | declarado antes | medido | |
|---|---|---|---|---|
| **c01** (A-SY-12) | o app aberto em avião (sem cache: `sync skip`); o avião desligado com o app aberto | `net run` · 1 sync · **2 GET** | `net run` · 1 · 2 · `sync ok` | ✓ |
| **c02** (A-SY-12) | o avião liga e desliga ~8 s depois do fim do sync | `net skip-interval` · 0 · **0 GET** | idem | ✓ |
| **c03** (A-SY-12) | segundo plano por 10 s | `foreground skip-short` · 0 · **0** | idem | ✓ |
| **c04** (A-SY-12) | segundo plano por 35 s | `foreground run` · 1 · **2** | idem | ✓ |
| **c05** (A-SY-18) | a tela apagada (`KEYCODE_SLEEP`, `Asleep`) com o app na frente, 10 s e depois 35 s | `skip-short`, `foreground run` · 1 · **2** | idem | ✓ |
| **c06/c06b** (A-SY-19) | a rede cai e volta com o app em segundo plano; a volta em < 30 s; n = 6 (+2) | por rodada: `skip-background` + `net run` · 1 · **2** | o `net online` chegou em segundo plano em **7 de 8**; **1 sync em 7 de 7** rodadas em que o app voltou (§9) | ✓ |
| **c07** (SY-D43) | a falha por **status** (500) com cache, em S1 (a volta de 35 s) | `foreground run` · 1 · **2** (o 200 das setlists, o 500 da página) | idem · `sync fail … status=500` · **o banner aparece** | ✓ |
| **c08** (SY-D43) | a falha por **rede** (o mock derrubado) | `foreground run` · 1 · **0** | idem · `sync fail … code=network` · o banner | ✓ |
| **c09** (SY-D43) | a falha por **prazo** (o mock no `atraso`) | `foreground run` · 1 · **0** | idem · `code=network` (sem linha `api`) · o banner | ✓ |
| **c10** (SY-D57 (1)) | o mock normal; o próximo sync automático (a rede) | `net run` · 1 · **2** | idem · `sync ok` · **o banner some** | ✓ |
| **c11** (SY-D57 (2)) | a lista de S1 rolada; a falha automática (500) | `net run` · 1 · **2** | idem · o banner; **os cartões encolhem e o conteúdo se desloca** (abaixo) | ✓ (Q5) |
| **c12** (SY-D57 (2)) | a L com "Letra" digitado; a falha automática (500) | `net run` · 1 · **2** | idem · a linha de aviso aparece · **o termo fica** (`lib-campo` = "Letra") | ✓ |
| **c13** (SY-D52) | S2 reordenando, a Lanterna arrastada da 1 para a 3; a rede volta e o sync traz a setlist renomeada (fixture c) | `net run` · 1 · **2** | idem · **o modo segue aberto, a ordem é a do arrasto** (Cais · Letra longa · Lanterna · Cifra · Tab, antes e depois), `Salvar a ordem` ativo; o título do modo vira o nome novo (S2 lê a viva) — `c13-reavaliado.txt` | ✓ |
| **c14** (A-SY-23) | o palco na Letra longa, a rolagem ligada; a rede volta → a volta de 35 s → sair | `net hold-stage` · 0 · **0**; `foreground hold-stage` · 0 · **0**; `stage-exit run` · 1 · **2** | idem nos três | ✓ (a medida da rolagem: c14c) |
| **c14c** (A-SY-23) | a rolagem andando, 5 rodadas: o piso (15 s) e a janela do rádio; o sensor de quadros e o `uiautomator events` | por rodada: uma `hold-stage` por `net online`, **0 sync, 0 GET** | **5 de 5**; e a rolagem **para** na janela — **também na base, sem gatilho nenhum** (abaixo) | ✓ linhas · div. 1303 |
| **c15** (SY-D43 com o palco) | o palco aberto, o mock em 500; a rede volta → sair | `net hold-stage` · 0 · **0**; `stage-exit run` · 1 · **2** | idem · o palco igual (os 15 `resource-id`) · ao sair, **o banner em S1** | ✓ |
| **c16** (A-SY-23, V) | V aberta na Letra longa; a rede volta e o sync traz o corpo novo (fixture b) | `net run` · 1 · **2** | idem · **o corpo de V igual** (4890 = 4890 caracteres; o novo teria 725 `a` a menos) | ✓ |
| **c17** (SY-D56) | o ▶ na L (o avulso sem hospedeira); a rede volta; o voltar | `net hold-stage`, `stage-exit run` · 1 · **2** | idem | ✓ |
| **c18b** (SY-D49 (2)) | o voo no `atraso`; a rede volta (`run`), volta de novo (`queued`), o palco abre no meio do voo | `net run`, `net queued`, `again hold-stage`, `stage-exit run` · 2 · **2** | idem; `keepawake on` (o palco) **antes** do `sync fail` | ✓ |

**As 17 contagens declaradas conferem.** O que ficou como rastro, com o porquê (as divs. 1296–1300): a 1ª corrida de c03–c06 (a volta à frente pelo `monkey` não trouxe o app), a 1ª de c12 e c13 (o estado herdado do cenário anterior), c14b (a rolagem chegou ao fim do texto; a piscada só pelo avião levou 27 s e 51 s) e c18 (o palco abriu depois do voo).

**c11 — os cartões compactos** (a condição 2 da SY-D57, o que o `native-tela` não via, §2): antes do banner, o topo da lista mostrava `5a5a0002` cortado (71,6 dp visíveis) e `5a5a0003` em **227,6 dp**, cartões de **132 dp**; com o banner, os cartões encolhem para **112 dp** e `5a5a0003` fica em **237,8 dp** (+10,2) — o cortado do topo sai da vista. **A rolagem não voltou ao topo nem se perdeu** (a lista é o mesmo nó; o cartão que estava na vista segue na vista, 10 dp abaixo). Se esse deslocamento conta como "desfazer", é a **Q5** — não parei por ele, porque a medida diz que a rolagem não se desfez; o juízo é do Marcel.

**c14c — a rolagem com o palco aberto e a rede voltando** (`cenarios/c14c-rolagem-no-palco.txt`; o controle `controle-base/`): o controle (a) do sensor viu a tarefa plantada de 200 ms com **206,1 ms**. Por rodada, o maior intervalo entre quadros da thread de JS:

| | piso (15 s, a rolagem sozinha) | janela (o rádio desligado e religado) |
|---|---|---|
| **a PR** (`d1e050b`), n = 5 | mediana **203,3 ms** (44,5–304,4) | mediana **16.814,5 ms** (5.133–33.580) |
| **a base** (`5ace638`, sem gatilho nenhum), n = 5 | mediana **263,1 ms** | mediana **8.132,0 ms** (5.663–15.893) |

Nas duas, **a rolagem para de 5 a 34 s quando o rádio do emulador troca** — e na base não existe gatilho. O que parou foi **o desenho do app inteiro** (o `EGL_emulation` do próprio processo registra quadros de 17,7 s e 33,5 s, os processos do sistema pulam quadros), com o foco da janela **sempre** no app (`diagnostico-parada/diagnostico.txt`: nenhuma janela do sistema por cima) e nenhuma mudança de `AppState`. Na PR, o que o gatilho fez nessa janela foi **uma linha** (`hold-stage`) — nenhum sync. As faixas se cruzam (n = 5 cada, dev client, AVD); **nada nesta medida atribui a parada à PR**, e nada a exclui no release: é a **div. 1303** e uma herança do encerramento (§13). O critério do release da SY-D36 (c) não se aplica a esta janela: ela mede a troca de rádio, não o sync.

## 9. O A-SY-18 e o A-SY-19 — o que foi medido e a consequência

**A-SY-18 — a tela apagada com o app na frente conta como segundo plano? SIM** (`cenarios/c05-tela-apagada.txt`). `KEYCODE_SLEEP` (`mWakefulness=Asleep`) por 10 s → ao acender, `sync trigger reason=foreground decision=skip-short`; por 35 s → `foreground run`, 1 sync, 2 GET. O `AppState` vai a `background` com a tela apagada, e a volta é a volta do segundo plano. **Consequência**: nenhuma no código — a regra é a de sempre. **No texto do encerramento** (SY-D27): o destravar do Marcel com o app na frente, depois de 30 s, **é um sync** — medido no AVD; o release do Tab o confirma (§13).

**A-SY-19 — o evento de rede com o app em segundo plano chega ao JS? Quase sempre** (`cenarios/c06b-rede-no-fundo-n.txt`, n = 6, e as duas corridas do c06). Em **7 de 8** rodadas o `net offline` e o `net online` chegaram com o app fora (o `skip-background` e a marca saíram em segundo plano, e a volta curta fez `net run`); em **1 de 8** (a volta 3 s depois de o `ping` responder) o `net online` só chegou **depois** da volta — a volta curta fez `skip-short` e a rede, já na frente, fez `net run`. **1 sync em 7 de 7** rodadas em que o app voltou à frente (a 1ª corrida do c06 não voltou: a div. 1296). **Consequência**: nenhuma — as duas ordens dão o resultado da SY-D17 (a volta curta com a rede que voltou → 1 sync), e o gate cobre as duas (`marca-volta-curta`, `rede-volta-na-frente`). O que muda é a ordem das linhas no logcat, o que o texto do encerramento tem de dizer.

## 10. O que o AVD não reproduz — `[hipótese]` e o que o release pode medir

| situação | o que fica | o release no Tab pode medir? |
|---|---|---|
| **o portal cativo** (a rede sem `VALIDATED`) | `[hipótese]`: `isInternetReachable` falso → sem transição → sem gatilho (A2.2, lido) | só com uma rede cativa — fora do aparato |
| **a troca Wi-Fi ↔ dados** sem queda | `[hipótese]`: `true → true` → sem gatilho (A2.2) | o Tab S6 é só Wi-Fi: não |
| **o Wi-Fi de palco que oscila** | **medido em parte**: no AVD, uma troca de rádio deu às vezes **duas** transições `false → true` em 4 s (div. 1304) — cada uma é um gatilho; com um sync em voo, a segunda é o `queued` e vira o "de novo": **2 syncs, 4 GET** por oscilação, e o intervalo não segura (o "de novo" fica fora dele, SY-D18) | sim: ligar e desligar o Wi-Fi do Tab com o app aberto, contando `net online` e `sync start` |
| **a parada do desenho na troca de rádio** (div. 1303) | medido no **dev client do AVD**, com e sem a PR | sim: o `uiautomator events` no release, com o palco aberto e o Wi-Fi do Tab trocando (o controle da janela vazia, SY-D55 (1)) |
| **o primeiro `GET` depois da rede voltar** (div. 1305) | medido uma vez: 8.603 ms, quase todo antes do `auth refresh=cached` (o token, dentro do prazo — a div. 1269) | sim: o `ms=` das linhas `api` no release (o A-SY-21) |
| **o JS suspenso em segundo plano** por muito tempo (Doze) | `[hipótese]`: o AVD não dorme | parcialmente: o Tab em repouso com o release |

## 11. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` copiado por `cp -p` e conferido por sha256, **sem abrir**, apagado no fim nas duas árvores |
| requisições a terceiros | **0** — `auth refresh=cached` 65, `forced` 0 (`avd/logcat-contagem.txt`): nenhuma ida ao Google; o inspetor do Metro é local |
| requisições do app ao mock | **35 `sync start`** (25 ok, 10 fail), **60 linhas `api`**, todas `/api/setlists` ou `/api/content` ao `localhost:8788` (o bundle conferido); `octavia.rocks` no logcat inteiro **0**; **0** escritas (`write op=`), **0** downloads. Inclui **um sync fora dos cenários** (o teste do `am start`, div. 1296, 2 GET) e os syncs do controle da base |
| AVD `octavia_tab32` | começo e fim iguais (`estado-diff.txt` vazio), `ram.bin` intacto; a receita 5 de 5 md5; **0 quedas** (Java, nativa, tombstones — `avd/quedas.txt`) |
| Tab S6 | **não tocado** |
| builds | nenhum (o dev client de 2026-09-24; nenhum módulo nativo novo) |
| processos no host | o Metro (8081, o da PR e depois o da base), o mock (8788) — derrubados no fim (`pgrep` vazio) |
| árvores | `../octavia-sy-pr3` removida sem `--force`; `../octavia-sy-pr4` criada; **`../octavia-sy-pr4-base`** (o `5ace638` destacado, só para o controle do c14c) criada e **removida sem `--force`** |
| perguntas ao Marcel durante a sessão | **1** (duas questões juntas) — o avulso e a falha automática: SY-D56, SY-D57 (§0) |
| agentes | **0** |
| regra 4 do catálogo sobre os anexos | `grep -rn eyJ` e `grep -rln <email>`: nenhuma linha (fora esta, que descreve o comando) |
| texto nos anexos | só o do projeto (a fixture da QL-PR4 via SY-PR1; as setlists "de rolagem" desta PR) |

## 12. Os aceites desta PR — o veredito

| # | o critério congelado (SY-D37; o A-SY-23 da SY-D49) | veredito | a evidência |
|---|---|---|---|
| **A-SY-1** | as 6 linhas `i:` saem e os 16 casos passam; os CN i-1…i-8 seguem acusando | **cumprido** — os 16 da PR-1 e os 13 novos passam; os defeitos da PR-1 seguem acusados nos casos deles, menos o i-2 e o i-3, indistinguíveis com o laboratório antigo e cobertos por g-3 e g-5 (§6.2) | §3; `c3/c5-verificacao.txt`; CN g-1…g-12 |
| **A-SY-11** | as 3 linhas `v:` saem (2 GET até 100, 3 com 101); downloads à parte | **cumprido** — 2 · 3 · 2 GET, 0 downloads | §3; o gate (v) |
| **A-SY-12** | no AVD: o avião desligado → 1; > 30 s → 1, < 30 s → 0; no intervalo → 0 — pelas linhas `sync trigger` e `api` | **cumprido** | c01–c04 (§8) |
| **A-SY-13** | o G3 70 → 71, a linha declarada | **cumprido** — a linha nova é a única; declarada no bloco (como comentário, div. 1293) | §5, §16 |
| **A-SY-18** | a tela apagada conta como segundo plano? medido | **medido: conta** | c05; §9 |
| **A-SY-19** | o evento de rede em segundo plano chega ao JS? medido | **medido: chega em 7 de 8**; 1 sync em 7 de 7 voltas | c06, c06b; §9 |
| **A-SY-23** | com o palco aberto, um gatilho → 0 sync e a marca; ao sair → 1, sujeito à rede e ao intervalo; o "de novo" espera o palco | **cumprido no gate e no AVD** (c14, c14c, c15, c17, c18b); **a rolagem sem pausa além do piso: não se pode afirmar no AVD** — a troca de rádio para o desenho com e sem a PR (div. 1303) | §3, §8; Q6 |

## 13. O que o encerramento herda desta PR

| o quê | origem | destino proposto |
|---|---|---|
| **o release no Tab, a regra 38 (c)/(d) remedida** (A-SY-15): o avião desligado com o app aberto → 1 sync; o segundo plano > 30 s → 1, < 30 s → 0; a contagem declarada antes | SY-D16, SY-D27 | encerramento |
| **o destravar do Marcel com o app na frente depois de 30 s é um sync** — medido no AVD (A-SY-18); o texto do `APARATO.md` o escreve conforme o release | A-SY-18, SY-D27 | encerramento (o texto final da regra 38 e do `APARATO.md`) |
| **com o palco aberto, o gatilho não dispara**: fica marcado (`hold-stage`) e roda ao sair (`stage-exit`); o "de novo" também espera (`again`); o avulso sem hospedeira conta (SY-D56) | SY-D49, SY-D56 | encerramento (a regra 38 e o `APARATO.md`) |
| **a ordem das linhas na volta curta** depende de o `net online` chegar em segundo plano (7 de 8) ou só na frente (1 de 8); o resultado é o mesmo | A-SY-19 | encerramento (o texto da regra 38: contar `sync start`, não a ordem) |
| **a parada do desenho na troca de rádio** (5–34 s no dev client do AVD, com e sem a PR) — medir no release, no Tab, com o palco aberto e o Wi-Fi trocando, pelo `uiautomator events` com o controle da janela vazia | div. 1303 | encerramento |
| **o Wi-Fi que oscila dá dois gatilhos** em segundos; com um sync em voo, o "de novo" — 2 syncs, 4 GET por oscilação, fora do intervalo | div. 1304 | encerramento (medir no Tab); se pesar, pergunta de produto ao bloco seguinte |
| **o primeiro `GET` depois da rede voltar** (8,6 s, o token dentro do prazo) | div. 1305, div. 1269, A-SY-21 | encerramento (o `ms=` do release) |
| **os cartões compactos de S1 com o banner** (c11) | div. 1302, SY-D57 (2) | o aval (Q5); se for "desfazer", bloco da identidade |
| **o "sem conexão" com a rede de pé** e a frase do placeholder | div. 1278, SY-D43, SY-D23 (c) | encerramento (já herdados) |
| **o instrumento do release no Tab** com a base de tempo consertada e o controle da janela vazia | SY-D55 (1), div. 1290 | encerramento (já herdado); esta PR mostra o controle acusando (c14, c14b) |
| **a linha da série no `CI-FAIXA.md`** | regra 22 | encerramento |
| **a errata da citação do `PRD-TELA-1.md:158`** sobre o web | div. 1257 | o aval (Q8) |

## 14. As perguntas para o aval

Numeradas, com opções e recomendação. **O executor prepara; quem decide é o Marcel.**

**Q1 — os nomes novos da linha `sync trigger`** (SY-D49 (3)). (a) **`decision=hold-stage`** para o gatilho segurado pelo palco; **`reason=stage-exit`** para o sync que o fechar do palco avalia; **`reason=again`** para o "de novo" do voo segurado pelo palco; (b) sem `again`: o "de novo" segurado não deixa linha (a do `queued` já disse que houve gatilho), e ao sair aparece só o `stage-exit`; (c) outros nomes. **Recomendo (a)**: no logcat, cada sync que o palco adiou fica com a sua linha, e o aceite do release conta o que segurou e o que rodou sem inferir.

**Q2 — o contrato dos gatilhos estendido** (§4; o cabeçalho do `gatilhos.ts` pedia errata declarada no aval). O que mudou na forma da SY-D33/SY-D35: o `palco` na ligação (o `PalcoDosGatilhos`, que a foto implementa); o `uid` no `SyncNaRede`; o desligar devolvido ganhou o `segurarDeNovo` (e o `RaizDoSync`, o `segurarDeNovo?` opcional); a foto nasce no `App.tsx` e o `navigation.tsx` a recebe; a regra do foco do índice mudou de casa (`focoDoIndice`); o `alcancavel` exposto no `net.ts`. (a) **aceitar**; (b) outra forma (por exemplo, o palco como estado de React). **Recomendo (a)**: um estado só, que o gate monta.

**Q3 — o `ultimoSyncNaRede` no logout** (SY-D44). (a) **como está**: não se zera; carrega o `uid`, e os gatilhos só contam o intervalo contra a sessão de agora; (b) zerar no `onAuth(null)` — mais um ponto de acoplamento na raiz, e um sync da sessão velha que termina **depois** do logout o regravaria. **Recomendo (a)**.

**Q4 — o "de novo" segurado pelo palco passa pelo intervalo ao sair?** (a) **sim, como está** — a leitura literal da SY-D49 (2) ("ao sair, as regras de sempre"); um palco fechado nos 30 s depois do fim do voo dá `stage-exit skip-interval`; (b) não: o "de novo" mantém a isenção da SY-D18 (roda ao sair se houver rede). **Recomendo (a)**: na prática a sessão do palco dura minutos e a diferença é rara; uma regra só no fechar.

**Q5 — os cartões compactos de S1 quando o banner aparece** (c11, div. 1302; a condição 2 da SY-D57). A lista não se remonta e a rolagem não volta ao topo, mas os cartões encolhem de 132 para 112 dp e o conteúdo desloca ~10 dp; o cartão cortado no topo sai da vista. (a) **não conta como "desfazer"**: é o S1e de hoje, com a lista no lugar — fica; (b) conta — sem cartões compactos quando o banner nasce de um sync automático (tela, fora do SY). **Recomendo (a)**, com as capturas `c11-antes.png`/`c11-depois.png` à vista.

**Q6 — o A-SY-23, a rolagem** (§8, div. 1303). Com o palco aberto, o gatilho só escreve a linha; a parada de 5–34 s acontece na troca de rádio do AVD **também na base**. (a) **fechar o A-SY-23 como "cumprido nas linhas e na contagem; a rolagem na troca de rádio não se mede no AVD (a base para igual) — herança do release"**; (b) manter o A-SY-23 aberto até o release do Tab. **Recomendo (a)**, com a medida no Tab como entrada obrigatória do encerramento.

**Q7 — o A-SY-18 e o A-SY-19** (§9). Registro, sem opção salvo esta: (a) **o texto do encerramento** diz que a tela apagada é segundo plano (o destravar com o app na frente depois de 30 s é um sync) e que a ordem das linhas na volta curta varia; (b) outro. **Recomendo (a)**.

**Q8 — a errata da citação do `PRD-TELA-1.md:158` sobre o web** (div. 1257: o PRD cita `hooks/use-setlist-data.ts:172`; hoje é o `:132`, e o web conta 30 s entre focos, não a ausência). (a) **entra no encerramento**, como nota no T1-R13, junto do texto da regra 38; (b) entra agora; (c) fica só registrada. **Recomendo (a)**: o encerramento já reescreve os textos do T1-R13 com os números do release.

**Q9 — os extras desta PR, declarados**: o arquivo novo `sy-gatilhos-telas.test.tsx` e a família no `sy-lista.ts`; o `alcancavel` no `net.ts`; o `focoDoIndice` e o `PalcoAvulsoAberto`; a sessão do gate (i) que passou a ligar o `palco` e o `segurarDeNovo` (os casos da PR-1 sem mudança de cenário nem de asserção). (a) **aceitar**; (b) tirar algum. **Recomendo (a)**. *E uma pergunta pequena que o roteiro da PR-1 levantou (§6.2): o executor chama o `segurarDeNovo` fora do `try` do sync; um `segurarDeNovo` que lançasse prenderia o voo. No app ele não lança (é a ligação da raiz). (c) pô-lo dentro de uma proteção (lançou → `false`) num commit novo desta PR; (d) deixar. **Recomendo (d)**: a defesa seria contra um defeito que só o laboratório antigo tem.*

**Q10 — a oscilação do Wi-Fi** (div. 1304): duas transições `false → true` em segundos com um sync em voo dão o "de novo" — 2 syncs por oscilação, fora do intervalo. (a) **medir no release do Tab e decidir lá**; (b) decidir já que o "de novo" pedido por um gatilho passa pelo intervalo. **Recomendo (a)**: no AVD foi a troca de rádio do emulador que oscilou; o Wi-Fi de palco de verdade é o que importa.

## 15. Divergências — 1292 a 1306

A última usada era a **1291** (`SY-PR3-anexos/README.md` §12) `[medido: git grep -ohE "^\| \*\*1[0-9]{3}\*\*" origin/main -- docs | sort -u | tail → 1291; os outros acertos de 129x/13xx em docs/ são logs e hashes]`. Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1292** | T | A linha de base na `main` (`5ace638`) saiu com **1 vermelho do web** — `components/editors/__tests__/lib-salvo.test.tsx` (*Unable to find role="textbox"*) — e o mesmo arquivo passa **3 de 3** isolado: a instabilidade dos testes do editor sob carga (a herança da div. 845) | registrado (`antes-main-suite.txt`); nenhum commit desta PR toca o web; as suítes dos commits saíram verdes |
| **1293** | P | *"G3 70 → 71: uma linha nova, declarada como adição na sintaxe que o gate lê"*: o extrator (`gates-decl.sh`) **não tem chave de adição** (só `g3-velha`/`g3-nova` em par e `g3-removida`; um `g3-nova` sozinho é recusado); o G3 aceita a adição e a lista em *"linhas NOVAS"* | o precedente da N4-PR5: a linha nova declarada **em comentário** no bloco (`# g3 (adição, SY-D28): …`), e a saída do gate colada (§16) |
| **1294** | P | O prompt manda o commit 4 tirar as linhas do commit 1, S2 inclusive; o `palco-v-aberta` e as 5 `tela-` passaram já com o commit 3 (dependem só do gatilho) — deixá-las daria ÓRFÃS | saíram no commit 3, que o diz (§3; a forma da div. 1285) |
| **1295** | T | Na 1ª verificação do commit 3, o G3 deu **70 → 73**: o coletor lê comentário (a decisão da div. 83; o caso 41), e dois comentários do `gatilhos.ts` citavam `log(` | os comentários reescritos sem a cadeia antes do commit; 70 → 71 (`c3-g3-73-antes-do-conserto.txt`) |
| **1296** | T | A volta à frente pelo `monkey -p … LAUNCHER` **não trouxe o app** (o lançador por cima): c03–c06 da 1ª corrida não mediram a volta; e o teste do `am start` fez **um sync fora dos cenários** (2 GET ao mock) | `am start -n …/.MainActivity` (*"its current task has been brought to the front"*); c03–c06 refeitos; a 1ª corrida como rastro; o sync contado na contabilidade |
| **1297** | T | O c13 lia a ordem do modo de reordenar pelo `content-desc` das alças — **igual nas cinco** ("Arrastar para mudar a posição"): passou sem medir ordem (o caso 42) | a ordem pelo título de cada linha; o c13 reavaliado sobre os dumps gravados (`c13-reavaliado.txt`); o app não mudou |
| **1298** | T | A 1ª corrida do c12 começou com a linha de aviso já na tela (herdada do 500 do c11: o "antes" não estava limpo); a do c13 não achou a setlist (a lista de S1 rolada pelo c11; o gesto de voltar ao topo começava sobre o banner) | `s1_no_topo` e `sem_falha_na_tela` no instrumento; refeitos; as 1ªs como rastro |
| **1299** | T | O `uiautomator events` por **pipe + SIGINT** morreu aos ~5,7 s (o c14: a janela VAZIA — **o controle da SY-D55 (1) acusou**); no c14b, a rolagem chegou ao fim do texto e a piscada só pelo avião levou 27 s e 51 s para a rede voltar | no molde do arnês da QL (arquivo + SIGTERM), a música do topo a cada rodada, o zoom no máximo, o rádio pelo caminho completo, e o sensor de quadros junto (c14c) |
| **1300** | T | O c18 abriu o palco **depois** dos dois syncs (o instrumento lento demais para o voo de 20 s); e o c18b imprime "o palco tocado 29,0 s depois do 1º sync start" medindo do instante errado | o c18b (a rede pisca, o toque pré-calculado); a prova é a ordem das linhas (`keepawake on` antes do `sync fail`) |
| **1301** | A | A-SY-19: o `net online` chegou ao JS em segundo plano em **7 de 8**, e em 1 só depois da volta — o duplo `fake-expo-network` entrega sempre (o caso 15 pelo outro lado: aqui o duplo é mais regular que o aparelho, e os dois resultados dão 1 sync) | §9; o gate cobre as duas ordens; o texto do encerramento conta `sync start`, não a ordem |
| **1302** | A | SY-D57 (2), c11: com o banner, os cartões de S1 encolhem (132 → 112 dp) e o conteúdo desloca ~10 dp; a lista não se remonta | Q5 |
| **1303** | A | **A troca de rádio do AVD para o desenho do app por 5–34 s** (o palco, a rolagem, os quadros do próprio processo), **com e sem a PR** (o controle da base); o foco nunca sai do app, o `AppState` não muda; e o prazo de 20 s de um sync em voo vira ~40 s (o relógio atrasa junto: c18b) | §8; herança do release no Tab (§13); Q6 |
| **1304** | A | Uma troca de rádio deu às vezes **duas** transições `false → true` em ~4 s (c14b; c14c r5; o controle da base r1, r3, r5): dois gatilhos; com um sync em voo, o segundo é o "de novo" (2 syncs, 4 GET), fora do intervalo | §10, §13; Q10 |
| **1305** | A | O primeiro `GET` depois do rádio voltar levou **8.603 ms** (c01), quase todo antes do `auth refresh=cached` — o token dentro do prazo (a div. 1269); medido uma vez | §13; o A-SY-21 do release |
| **1306** | T | O 1º teste do mock alcançável em avião (`toybox nc …`) devolveu vazio — inconclusivo | refeito com o `nc` do sistema e o log do mock: a requisição chegou (`mock-em-aviao.txt`) |

**Contagem** `[medido: a coluna]`: **15 — P 2 · T 8 · A 5** (P: 1293, 1294 · T: 1292, 1295, 1296, 1297, 1298, 1299, 1300, 1306 · A: 1301, 1302, 1303, 1304, 1305). **A próxima livre é a 1307.**

## 16. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# SY-PR4: os gatilhos do T1-R13 passo 4 (src/gatilhos.ts), o palco aberto que os segura (src/foto-do-palco.ts, src/navigation.tsx; SY-D49, SY-D56), o "de novo" que espera e o uid do ultimoSyncNaRede (src/sincronizador.ts; SY-D49 (2), SY-D44), a ligação na raiz (App.tsx) e o alcancavel do src/net.ts.
# g3 — ADIÇÃO (SY-D28; G3 70 → 71; o extrator não tem chave de adição, div. 1293): apps/native/src/gatilhos.ts · log(`sync trigger reason=${motivo} decision=${decisao}`)
g1a: apps/native/src/gatilhos.ts
g1a: apps/native/src/foto-do-palco.ts
g1a: apps/native/src/sincronizador.ts
g1a: apps/native/src/net.ts
g1a: apps/native/App.tsx
g1a: apps/native/src/navigation.tsx
```

```gates-web
# SY-PR4: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado (a PR toca só apps/native e docs).
```

Sem recuo nas linhas de dentro. **A adição do G3 vai em comentário** (div. 1293: o extrator não tem chave para ela; o G3 a
lista em *"linhas NOVAS"* — §5). **Nenhum par do G1b** (nenhuma asserção do core mudou; o core não se toca), **nenhuma
errata nem remoção do G3**. Os testes e a lista (`apps/native/test/`) estão fora do escopo do G1a. A saída dos dois
extratores sobre este bloco: `blocos-decl.txt` (as 6 linhas `g1a:`; o `gates-web` sem declaração, `exit=0`; e o `diff` vazio do
`package.json`, do `app.json` e do `pnpm-lock.yaml`: nenhum módulo nativo novo); a do CI no §17.

## 17. Os checks da PR

<!-- CHECKS -->

## 18. As erratas de ponteiro — neste commit

| arquivo | onde | a nota |
|---|---|---|
| `docs/native/SY-PRECHECK.md` | a A2 (os gatilhos), depois da errata da SY-D39 | os gatilhos feitos na PR-4 (`gatilhos.ts`, a ligação no `App.tsx`), o palco (SY-D49, SY-D56), a sessão do intervalo (SY-D44), e o que o AVD mediu (A-SY-12, A-SY-18, A-SY-19, A-SY-23) — `SY-PR4-anexos/README.md` §4, §8, §9 |
| `docs/ux/PLANO-TRANSICAO.md` | "Sequência", depois da nota do aval da PR-3 | a PR-4 aberta, aguardando o aval; o próximo é o encerramento com o release no Tab |
