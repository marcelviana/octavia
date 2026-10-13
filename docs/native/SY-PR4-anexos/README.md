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

---

## 0. As decisões do Marcel durante a sessão — SY-D56 e SY-D57 `[Marcel, 2026-10-13]`

Duas perguntas que o prompt manda trazer **na hora** (§5: o caso novo que pede decisão; a tela nova na falha), feitas
antes do commit 1 e respondidas pelo Marcel; o texto é o da resposta.

| # | decisão (pergunta) |
|---|---|
| **SY-D56** | (o avulso) **O palco avulso sem hospedeira também conta como palco aberto.** A SY-D49 (1) define o palco aberto como "a sessão do palco, a mesma da foto"; o avulso sem hospedeira (o ▶ na L ou em V, `Stage { avulsa, origem }`) não abre sessão de foto, e é o mesmo `StageScreen` com rolagem (as mesmas pausas). Fica: **"palco aberto" = a sessão da foto OU um palco avulso sem hospedeira montado**; a foto da sessão (`foto-do-palco.ts`) é a única fonte que os gatilhos leem. |
| **SY-D57** | (a falha automática com cache, SY-D43) **Opção 1: manter o S1e de hoje.** A falha de um sync automático com cache mostra o mesmo estado que a falha da abertura já mostra, sem pixel nem frase novos. **Duas condições, para o gate e para o aparelho:** (1) **o banner some sozinho no próximo sync que der certo, inclusive um automático** — um caso do gate e no AVD; (2) **o banner aparecendo em S1 ou na Biblioteca não desfaz o que o músico está fazendo na hora** (uma busca digitada, uma rolagem da lista, S2 em edição) — **se desfizer, pare e pergunte.** O "sem conexão" com a rede de pé segue como herança (div. 1278, SY-D43). |

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
