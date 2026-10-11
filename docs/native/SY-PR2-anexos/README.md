# SY-PR2-anexos — o voo único, a janela da `naoRegredir`, as escritas e o prazo

**PR** (o número no corpo da PR e no §13), branch `sy/pr2-voo`, árvore `../octavia-sy-pr2` sobre `origin/main` =
**`17207c4`** (`17207c4d72b091eeeed77bacba9852f80e710531`, o merge da #379: o `SY-PR1-anexos/README.md` com o §13,
SY-D33…SY-D41; o `apps/native/src/sincronizador.ts`; o `apps/native/test/sy-reprovados.txt` com **34** linhas)
`[medido: git rev-parse origin/main; antes-main-suite.txt]`. `pnpm install --frozen-lockfile --offline`. As árvores
`../octavia-sy-precheck` e `../octavia-sy-pr1` (limpas, os heads `329d12e` e `7f5c998` contidos na `main`) **removidas
sem `--force`**. Fonte do bloco: [`SY-PRECHECK.md`](../SY-PRECHECK.md) (SY-D1…D31; A5, A6, A8, A9, A10) e
[`SY-PR1-anexos/README.md`](../SY-PR1-anexos/README.md) (os gates e a lista; a SY-D32; os aceites congelados; SY-D33…D41;
as divs. 1264–1276).

Esta PR é a **PR-2** da SY-D14/SY-D29: as proteções do sync, **antes** de qualquer gatilho. O app continua sincronizando só
na entrada da sessão e no *Tentar de novo*; nenhum pixel, nenhuma frase, nenhuma linha de log nova.

- **Commits**: `f3113b7` a máquina do voo no core · `83d8fe8` o executor com o voo e a sessão (e o `ultimoSyncNaRede`) ·
  `800a9bf` a aplicação síncrona · `1dadf19` a geração compartilhada · `236e47e` o prazo · `eebb9b3` o aparelho · o de docs
  (este README e as erratas de ponteiro).
- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado, com caminho e linha da
  ponta da `main` (ou desta branch, quando é o código dela); `[hipótese]` = o resto.
- **Texto**: só o do projeto (as fixtures desta PR e das anteriores); nenhum texto de música de terceiro (regra 10). As
  capturas do AVD são de S1 sem cache — sem setlist e sem música na tela. O uid que aparece nos anexos é o da conta de audit.
- **Agentes**: 0.

| arquivo | o quê |
|---|---|
| [`antes-main-suite.txt`](antes-main-suite.txt) | a suíte e os cinco juízes do SY na `main` desta sessão (o "antes") |
| [`c1-verificacao.txt`](c1-verificacao.txt) … [`c5-verificacao.txt`](c5-verificacao.txt) | por commit de código: o extrator do bloco, G1a/G1b, G2/G3, os quatro `tsc`, o lint, a suíte e os cinco juízes (`instrumentos/verifica.sh`) |
| [`ordem-das-linhas.txt`](ordem-das-linhas.txt) | o commit 3: as linhas de um sync antes × depois, e onde a raiz recebe os dados contra a fronteira (`instrumentos/ordem/`) |
| [`div1277-escrita-setlists-ficam.txt`](div1277-escrita-setlists-ficam.txt) | o caso do gate (ii) que não media o disco, consertado, reprovando por medida no código de antes |
| [`div1269-leitura.txt`](div1269-leitura.txt) · [`div1269-medida.txt`](div1269-medida.txt) | o token dentro do relógio do prazo: lido e medido (`instrumentos/prazo-token/`) |
| [`cn-sy-pr2.txt`](cn-sy-pr2.txt) · [`cn-sy-pr1-sobre-pr2.txt`](cn-sy-pr1-sobre-pr2.txt) | os controles negativos novos (`instrumentos/cn-sy-pr2.sh`, `plantar.py`) e o roteiro da PR-1 sobre o código novo |
| [`gates-sy-na-ponta.txt`](gates-sy-na-ponta.txt) · [`lista-antes-depois.txt`](lista-antes-depois.txt) | os cinco gates do SY na ponta; a lista 34 → 27, por commit |
| [`gates-existentes.txt`](gates-existentes.txt) · [`gates-web.txt`](gates-web.txt) | G-inv, G-N3, G-par, a quebra, `icones`, `a20`, os SHA256SUMS; os gates do web |
| [`a-sy-4-intocados.txt`](a-sy-4-intocados.txt) | o `updated_at`, a `naoRegredir` e o `reconcile` sem diff; tudo o que a PR muda fora de `docs` |
| [`avd/`](avd/) | o aparelho: o estado antes e depois, a receita do cache, o bundle servido, o rádio, as rodadas (dumps e capturas), o logcat, as quedas, o fim |
| [`instrumentos/`](instrumentos/) | `verifica.sh` (a cópia da PR-1, com os juízes), `ordem/`, `prazo-token/`, `cn-sy-pr2.sh`, `plantar.py`, `avd/rodadas.py`, `avd/pedir-pelo-botao.mjs` |

---

## 1. Commit 1 — a máquina do voo no core (`f3113b7`; SY-D9, SY-D25, SY-D35)

**`packages/core/src/voo.ts`**, pura (nenhum request, relógio, sessão ou promessa): três estados — `ocioso`, `em-voo`,
`em-voo-de-novo` —, `pedirVoo(estado) → { estado, acao: rodar | marcar | nada }` e `terminouVoo(estado, { cancelarDeNovo })
→ { estado, acao: rodar | nada }`. O pedido durante o voo **marca** o "de novo"; outro pedido com ele já marcado **não soma**
(o "de novo" começa depois do fim do voo e lê o servidor de agora — atende a todos); ao terminar, o "de novo" **roda e vira
o voo**. O cancelamento (SY-D17) volta a `ocioso` sem rodar. **Terminar sem voo recusa** (lança): um `ocioso` que aceitasse
um `terminou` a mais esconderia o par desfeito. Exportada pelo `index.ts`.

`voo.test.ts`: **17 testes** — os estados, os pedidos durante o voo (um, cinco, um durante o "de novo", nenhum, depois do
fim), o cancelamento (com e sem "de novo"; o voo não fica trancado), a recusa, a pureza. Nenhuma linha da lista sai.

`[medido: c1-verificacao.txt]` G1a ✓ (2 exceções), G1b só adição ✓, G2 124 = 124, G3 70 = 70, os quatro `tsc` 0, lint ✔; a
suíte `156 passed | 3 skipped (159)` · `1909 passed | 59 skipped (1968)` — **+1 arquivo, +17 testes**; os cinco juízes com
6 · 6 · 18 · 1 · 3.

## 2. Commit 2 — o executor com o voo e a sessão; o `ultimoSyncNaRede` (`83d8fe8`; SY-D17, SY-D33, SY-D35)

`rodarSync(raiz, uid, anterior)` **continua a ser a entrada de todo pedido** (SY-D35). Ele pede à máquina: `rodar` → o sync
corre; `marcar`/`nada` → o pedido vira o "de novo" — o executor guarda **quem pediu por último** (a raiz e o uid daquele
pedido) e a promessa resolve já. Ao fim de cada sync, `terminouVoo` com `cancelarDeNovo` quando **não há pedido guardado ou
a sessão de quem pediu já não é a de agora**; `rodar` → o "de novo" parte do `dadosRef` de **agora** (o sync que acabou de
terminar já o atualizou à mão). Um sync que **lança** (o `save` é síncrono e não tem `try`) libera o voo e não encadeia o
"de novo" — sem isso, um erro de disco deixaria o voo em curso para sempre.

**A sessão conferida** (SY-D17): `RaizDoSync.sessaoAtual` deixa de ser opcional; o `App.tsx` o dá por um **ref posto no
próprio `onAuth`** (lido depois do `await`: vale o instante, não o último render). O resultado de um sync cuja sessão mudou
**não chega à raiz** — nem os dados, nem o `setSync`, nem o prefetch. **O disco do uid dele o `sincronizar` grava como sempre
gravou** (é o cache daquele uid, e o logout não apaga cache): só a raiz descarta (Q5).

**O `ultimoSyncNaRede`** (SY-D33): exportado pelo executor — `{ inicioMs, fimMs | null, falhaDeRede }` —, a definição da A2.4:
começa no gancho `aoComecar` que o `sincronizar` chama na linha `sync start`; termina no retorno ok/falha (o `sync skip` não
conta); `falhaDeRede` = a linha saiu com `code=network` (o `SyncOutcome` de falha ganhou o campo). **Nada o lê nesta PR.** O
**`sy-ultimo-sync.test.ts`** (novo, 5 testes) o confere contra a definição lida nas linhas pelo arnês dos gates: antes de
qualquer sync; em voo e ok; falha com status (500 na página 1); falha de rede (porta morta); sync pulado sem rede.

**Saem da lista**: `ii:nunca-dois-em-curso` (máximo em voo 1, 2 `sync start`), `ii:um-de-novo` (2, o 2º depois do fim do
1º), `ii:logout-descarta` (0 aplicações depois do logout); `ii:logout-cancela-de-novo` segue passando (0 `sync start`
depois do logout). **34 → 31.** `[medido: c2-verificacao.txt]` 157 · 1914 (**+1 arquivo, +5 testes**), G3 70 = 70, G2 124 =
124, `tsc` e lint limpos; o juiz (ii) com 3.

## 3. Commit 3 — a aplicação síncrona (`800a9bf`; SY-D10, SY-D26; A6.3)

O `sincronizar` ganha o gancho **`aoAplicar`**, chamado **logo antes do `return` do sync ok** — depois da linha `sync ok` —,
sem nenhum `await` desde a leitura das confirmadas do favoritar (`naoRegredir`) e a gravação do disco. O executor aplica por
ele: o `setDados`, o `setSync({ fase: 'ok' })` e o `dadosRef`, com a sessão conferida; só o prefetch fica depois do `await`.
A A6.3 sugeria o gancho *"logo depois do `save`"*; ele ficou depois do `sync ok`, para o `t=` da linha continuar medindo
*"do `sync start` ao cache gravado"* (E3) — o bloco síncrono é o mesmo. **Não toca no `updated_at`, na `naoRegredir` nem no
`reconcile`** `[medido: a-sy-4-intocados.txt — o diff desses arquivos e da rota do favoritar: vazio]`.

**A prova da ordem** `[medido: ordem-das-linhas.txt]`: o executor de verdade contra o `aceite.py`, três syncs (sem cache,
sem mudança, com mudança), com a **fronteira** marcada — uma microtarefa agendada na própria linha `sync ok`:

| | antes (`83d8fe8`) | depois |
|---|---|---|
| as linhas `OCTAVIA:` dos três syncs | 24 | **24, iguais, na mesma ordem** (`cache write` × 2, depois `sync ok`) |
| onde a raiz recebe | `── fronteira ──` → `[setDados]` → `[dadosRef]` → `[prefetchEArrumar]` | `[setDados]` → `[dadosRef]` → `── fronteira ──` → `[prefetchEArrumar]` |

**Sai da lista**: `iv:janela` (a estrela na memória e no disco, `fronteiras: 1`); `iv:controle-antes` segue passando.
**31 → 30.** `[medido: c3-verificacao.txt]` 157 · 1914, G3 70 = 70; o juiz (iv) com 0.

*[hipótese] para a PR-3 (SY-D38): a aplicação passou para dentro do bloco síncrono do `sincronizar`, mas o que ela faz ali é
**enfileirar** o `setDados` e trocar o `dadosRef` — microssegundos. O render da troca da raiz (o passo 2 da tabela do
§6.2 da PR-1) continua sendo agendado pelo React para depois, numa tarefa própria, e o prefetch segue depois do `await`. O
perfil das paradas não deve mudar de forma visível — a primeira parada (a gravação) pode crescer o custo do `setDados`, e é
o "antes" medido sobre a base da PR-3 que diz.*

## 4. Commit 4 — a geração compartilhada (`1dadf19`; SY-D25; A5)

O contador da div. 232 sai do `escrita.ts` para **`apps/native/src/geracao-das-setlists.ts`** (`emitirLeituraDeSetlists`,
`aplicarLeituraDeSetlists`, `limparGeracaoDasSetlists` — este chamado pelo `limparGatesDeEscrita`). A releitura usa as
duas funções no lugar do `++geracao` e do `minha < ultimaAplicada`, **com a mesma regra**. O sync tira um número **antes do
`GET /api/setlists`** e pergunta, no bloco síncrono, antes de gravar: perdeu (uma releitura emitida depois já aplicou) →
grava e aplica **só o conteúdo** (o `saveContent`, que emite só `cache write kind=content`) — a assinatura do descarte da
errata N2-PR2, sem linha nova; o `SyncOutcome` ok ganhou `setlistsAplicadas`.

**O cuidado da A5**: o sync que perdeu aplica o conteúdo pela **função** do `setDados` — `(atual) => ({ ...atual, content,
… })` —, e as setlists da raiz ficam as **de agora**, nunca as do `dadosRef`, que o `aoRelerNaEscrita` não atualiza. O
`RaizDoSync.setDados` passou a aceitar o valor **ou** a função (é o `setDados` do React, que o `App.tsx` já passa); **o
arnês dos gates resolve a função sobre o que a raiz mostra, como o React** (`sy-arnes.ts`, 3 linhas — mudança de instrumento,
Q4). O `dadosRef` recebe o conteúdo e fica com as setlists que tem até o próximo render o igualar; o prefetch do sync que
perdeu roda sobre elas — as setlists só ordenam o plano (N4-D88), e a releitura que venceu já disparou o prefetch dela
(T2-R17) `[lido: prefetch.ts:179-201; App.tsx:141-147]`.

**Saem da lista**: `ii:escrita-setlists-ficam` (a criada na raiz e no disco) e `ii:escrita-sync-sem-cache-write-setlists`
(da releitura 1, do sync depois dela 0); `ii:escrita-conteudo-aplica` segue passando; **os testes da div. 232 no
`escrita.test.ts` seguem verdes, sem errata** (a suíte inteira). **30 → 28.** `[medido: c4-verificacao.txt]` 157 · 1914.

### 4.1 A div. 1277 — o caso que não media o disco

Ao rodar o gate depois da mudança, `ii:escrita-setlists-ficam` seguiu reprovando com **`lança: doDisco(...).some is not a
function`**: o caso lia o `setlists.json` como lista, e o arquivo é `{ setlists, syncedAtMs }` (o `ArquivoSetlists`,
`store.ts:73`). **Desde a PR-1 ele reprovava por exceção, sem medir o disco** — a saída estava no anexo da PR-1
(`SY-PR1-anexos/gates/ii-lista-vazia.txt:8-9`), e o README de lá dizia *"o sync grava por cima"*. É o caso 42 (o CN que
reprova pelo motivo errado) e a regra 4. **O conserto é no instrumento** (regra 32): a leitura do arquivo; **a asserção
fica igual** (a criada na raiz **e** no disco). **A prova de que o caso consertado mede** `[medido:
div1277-escrita-setlists-ficam.txt]`: com o `sync.ts`, o `sincronizador.ts` e o `escrita.ts` do commit 3, ele reprova **por
medida** — *"a criada na raiz: false · no disco: false"*; com o commit 4, passa — *"true · true"*. Pergunta Q4.

## 5. Commit 5 — o prazo (`236e47e`; SY-D19, SY-D32)

O `sincronizar` passa o `PRAZO_DE_REDE_MS` do core ao `GET /api/setlists` e a **cada página** do `GET /api/content` (o
`getContentPage` ganhou o `prazoMs` opcional). **O prazo das escritas e das releituras não muda.** As erratas do "sem
prazo": no `api.ts` (o parágrafo do `prazoDe` e o do `getSetlists`, com o que o prazo cobre) e — **extra da mesma classe,
declarado** — no comentário do `PRAZO_DE_REDE_MS` do `packages/core/src/escrita.ts`, que dizia *"ele não vale para as
leituras do sync"*: ficaria um registro mentindo onde quem mexe no prazo lê (o caso 20). Só comentário: nenhuma asserção do
core mudou (G1b só adição).

**Sai da lista**: `ii:prazo-libera-o-voo` — `sync fail code=network em 20074 ms · o pedido seguinte rodou: true`. **28 → 27;
a parte (ii) vazia.** `[medido: c5-verificacao.txt]` 157 · 1914; os juízes 6 · 0 · 18 · 0 · 3.

### 5.1 A div. 1269 — o token dentro do relógio (SY-D41 (1), entrada obrigatória)

**O que se leu** `[lido: div1269-leitura.txt]`:

- o relógio começa no `prazoDe` (`api.ts:186`), **antes** do `authFetch` (`:188`); o `authFetch` pede o token
  (`getIdToken(false)`; renovação forçada quando faltam ≤ 5 min, `api.ts:83-102`), faz o `fetch`, e num 401 renova à força
  e refaz **com o mesmo sinal** (`auth-fetch.ts:61-78`);
- **o `abort` só corta o `fetch`.** Um `fetch` chamado com o sinal **já** abortado rejeita na hora, sem sair à rede
  (`whatwg-fetch` 3.6.20, `fetch.umd.js:536-538`);
- **a renovação do token tem o prazo próprio do SDK, e o nosso não a corta**: no `@firebase/auth` 1.13.5 (o do `firebase`
  12.18.0 do app), o `requestStsToken` corre num `Promise.race` com um `NetworkTimeout` (`index-CiDS6PaG.js:839-842`, `:941`)
  de `DEFAULT_API_TIMEOUT_MS = new Delay(30000, 60000)` (`:784`), e o `Delay` escolhe o **longo** quando
  `isReactNative()` (`:553`, `:564`; `@firebase/util` `index.cjs.js:831-833`): **60 s** no aparelho — 5 s se o SDK se achar
  offline (`:558`), o que no RN não acontece: sem `navigator.onLine` com protocolo http/extensão/`connection`, o `_isOnline`
  devolve `true` `[lido; o RN sem navigator.connection é hipótese]`.

**O que isso significa para o sync — o pior caso, com números** (por requisição; o sync tem 1 + ⌈N/100⌉ delas, em série, e
para na primeira que falha):

| situação | quando a requisição termina | o voo |
|---|---|---|
| o token em cache (o caso comum) | ≤ **20 s** | libera em ≤ 20 s por requisição |
| uma renovação de T s, T < 20 | ≤ 20 s — a API tem 20 − T | idem |
| uma renovação de T s, 20 ≤ T ≤ 60 | em **T** (o `fetch` sai com o sinal abortado e rejeita na hora; o servidor não recebe nada) | libera em até **60 s** |
| um 401 perto dos 20 s + a renovação forçada (≤ 60 s) | até **≈ 80 s** (20 + 60), e a 2ª requisição rejeita na hora | o teto teórico por requisição |
| a renovação que falha (o `network-request-failed` do SDK) | em ≤ 60 s, `networkError` → `sync fail … code=network` | libera |

**Nenhum caminho deixa o voo trancado para sempre** — toda espera tem teto (o nosso nos `fetch`, o do SDK no token). O teto
de um sync de até 100 músicas é, na teoria, **≈ 160 s** (duas requisições de ≈ 80 s que deem certo no limite); com o token em
cache, **≈ 40 s** (duas de quase 20 s). **E o `ms=` da linha `api`** (o que o A-SY-21 lê no release) inclui o token: o `t0`
também é anterior a ele.

**O que se mediu** `[medido: div1269-medida.txt]` (o `api.ts` e o `sync.ts` de verdade, no Node; o duplo do Firebase atrasa o
`getIdToken`, um servidor local atrasa a resposta; um sync por caso):

| caso | resultado | requisições que o servidor recebeu |
|---|---|---|
| (a) token na hora, servidor 18 s | **ok em 36.044 ms** (as duas de 18 s: o relógio é por requisição) | 2 |
| (b) token 5 s, servidor 18 s | **falha em 20.007 ms** — o token comeu 5 dos 20 | 1 |
| (c) token 25 s, servidor na hora | **falha em 25.004 ms, não em 20** | **0** |

**Não resolvi dentro do escopo, e trago como pergunta (Q1)**: fazer o prazo cobrir o token pede mudar o `get()` do `api.ts`,
que as releituras também usam — mudaria o prazo delas, e o §1 do prompt manda não mudar —, ou um caminho só do sync, que é
mecanismo novo. **Recomendo deixar** (Q1 (a)).

## 6. Os controles negativos (regras 4 e 7)

### 6.1 O roteiro da PR-1, de novo, sobre o código novo `[medido: cn-sy-pr1-sobre-pr2.txt]`

`SY-PR1-anexos/instrumentos/cn-sy.sh`, sem mudança, as 20 corridas: **todo defeito plantado segue acusado** — i-1…i-8, i-10
(as reprovações não declaradas de cada regra); ii-1 (`logout-cancela-de-novo`); ii-2 (`escrita-conteudo-aplica`); iii-0
(`palco-trocar-posicao`, `palco-musica-apagada-nunca-aberta`, `v-estrela-viva`); iii-2 (`sessao-solta`); v-1 (os 3, com o
dobro de `GET`). **O que mudou na leitura, e por quê**: o **laboratório do voo da PR-1** não tem a aplicação síncrona nem a
geração — copiado sobre o executor de agora, ele reprova `ii:escrita-setlists-ficam` (ii-0, ii-1) e `iv:janela` (iv-0) como
**não declaradas**, porque as linhas (ii) e (iv) saíram da lista: o código real é melhor que o laboratório, e o gate o diz.
O `git status` do fim: vazio.

### 6.2 Os novos `[medido: cn-sy-pr2.txt]`

`instrumentos/cn-sy-pr2.sh` + `plantar.py` (cada defeito é UMA troca de texto com a âncora **conferida** — sem âncora, o
script para e diz "NÃO PLANTOU"):

| CN | o defeito | quem acusou |
|---|---|---|
| n-1 | a máquina deixa **rodar** o pedido durante o voo | o `voo.test.ts` (5 ×) e o gate (ii): `nunca-dois-em-curso`, `um-de-novo` — pela recusa da própria máquina (*"terminouVoo: nenhum sync em curso"*), e o caso do logout |
| n-2 | a **máquina** roda o "de novo" duas vezes | **só o `voo.test.ts` (4 ×)**; o gate (ii) **passa** — ver abaixo |
| n-2b | o **executor** roda o "de novo" duas vezes (a máquina certa) | o gate (ii): `um-de-novo` — *"sync start: 3 (esperado 2)"* |
| n-3 | o executor **aplica depois do `await`** (o do commit 2, `83d8fe8`) | o gate (iv): `janela` — *"memória false, disco true"*; e o (ii): `escrita-setlists-ficam` |
| n-4 | o sync **não descarta** depois do logout | o gate (ii): `logout-descarta` — *"1 aplicação"* |
| n-5 | o "de novo" da sessão velha **não se cancela** | o gate (ii): `logout-cancela-de-novo` — *"1 sync"* |
| n-6 | o sync que **perdeu a geração grava** as setlists | o gate (ii): `escrita-setlists-ficam` (*"false · false"*) e `escrita-sync-sem-cache-write-setlists` (*"1"*) |
| n-7 | o sync que perdeu lê as setlists do **`dadosRef` defasado** (o cuidado da A5) | o gate (ii): `escrita-setlists-ficam` — *"na raiz: false · no disco: true"* |
| n-8 | as leituras do sync **sem prazo** | o gate (ii): `prazo-libera-o-voo` — *"nenhum sync fail code=network em 21,5 s"* |
| n-9 | o `ultimoSyncNaRede` **nunca diz falha de rede** | o `sy-ultimo-sync.test.ts` (2 ×) |

**O n-2, o achado** (div. 1281): um defeito **só na máquina** que faça o "de novo" rodar duas vezes **o gate (ii) não vê** —
o executor só roda um "de novo" quando há um pedido guardado, e cancela quando não há; a máquina defeituosa diz `rodar`, o
executor não tem quem rodar e devolve. O comportamento integrado fica certo (defesa em profundidade); **quem vê o defeito da
máquina são os testes de unidade dela**, e é por isso que eles existem. O n-2b planta o mesmo defeito no executor, que é o
que o gate mede, e o gate acusa. A forma (o executor guardar o pedido além da máquina) vai na Q3. O `git status` do fim:
vazio.

## 7. O aparelho — só o AVD `[medido: avd/]`

**O aparato**: o `octavia_tab32` do `default_boot` com `-no-snapshot-save` (o `ram.bin` de 2026-09-24 14:00 no começo e no
fim); **o estado lido antes e depois, com o `diff` vazio** (`stay_on=1`, `accelerometer_rotation=1`, `user_rotation=0`,
`airplane=1 wifi=0 data=0`, `reverse` vazio, o dev client de 2026-09-24 14:00:01 `DEBUGGABLE`, o app parado, `ping` →
`Network is unreachable`); **o rádio ligado só nas rodadas** (div. 1264; `radio-ligado.txt`, `radio-desligado.txt`: o `ping`
respondendo, e no fim de novo inalcançável); **a receita do cache da conta de audit** (N4-D102): 5 caminhos guardados md5 a
md5 e tirados por nome — o app abre **sem cache** —, regravados md5 a md5 no fim (nada a apagar da fixture: nenhum sync deu
certo); **o bundle servido, antes de qualquer abertura**: `localhost:8788` 1 · `octavia.rocks` 0 · `pedirVoo` 4 ·
`aplicarLeituraDeSetlists` 4 · `aoAplicar` 3 · `ultimoSyncNaRede` 3 · `sessaoAtual` 5. O Metro sem `CI=1`, `--clear`, a URL do
mock inline; o `apps/native/.env` por `cp -p` **sem abrir** (sha256 `f2bfa179cd8e` nos dois), apagado no fim. O mock
(`aceite.py servidor 8788 atraso`, uma fixture mínima do projeto) de pé só na sessão. `logcat -G 16M` e `-c` uma vez, antes.
**O Tab S6 não foi tocado** (ligado por USB a sessão inteira; todo `adb` com `-s emulator-5554`).

**A — o S1a remedido (A-SY-5)** `[avd/rodadas/rodadas.txt]`: o app aberto frio, sem cache, o mock segurando 45 s:

| | |
|---|---|
| `sync start` | 8.583 ms depois da abertura |
| **o `s1a` na tela** | o dump começou em `sync start` + 70 ms e terminou em **+ 2.454 ms**; a captura terminou em **+ 2.701 ms** — antes dos 20 s (`A-s1a.png`: *"baixando suas setlists pela primeira vez"*, o chip *"sincronizando…"*) |
| **a falha** | `sync fail stage=setlists page=1 code=network status=-` em **+ 20.034 ms** |
| **as linhas entre o `sync start` e a falha** | `auth refresh=cached` — e **nenhuma linha `api`** (A-SY-22: no aparelho o `fetch` só resolve com o corpo, div. 1270) |
| depois | `s1d` com o `tentar` na tela (`A-s1d.png`) |

**O aceite do S1a continua cumprível** — o critério escrito (N1-PRECHECK §R13: *"screencap S1a antes do 1º 200"*; V1:
*"`sync start` sem `cache hit`"*) se cumpre em 2,7 s; o roteiro do N3 (`n3pr6b.py`, `esperar(rid="s1a", prazo=40)` e
logo a captura) também cabe — **não há errata do S1a a perguntar**. **Mas a falha diz "SEM CONEXÃO"** — *"Nenhuma setlist foi
salva neste aparelho ainda. Conecte-se à internet…"* —, com o rádio de pé e o servidor só lento: o prazo é a espécie `rede`
(N2-D35), e a frase de S1 sem cache em falha de rede é essa. É frase existente, e é falsa nesse caso (div. 1278, Q2).

**B — o pedido seguinte roda, e o voo (A-SY-2 no aparelho, A-SY-22)** `[avd/rodadas/rodadas.txt, rodadas-B2.txt]`:

- **o botão não é alcançável durante o sync**: o *Tentar novamente* só existe em falha (`SetlistsScreen.tsx:612-628`, o banner
  com cache; `:656`, o `tentar` sem cache) e some no `setSync({ fase: 'sincronizando' })` do toque. **O que prova o mesmo**:
  chamar, pelo inspetor do Metro, **a função que o `onPress` do botão chama** — a prop `onTentarNovamente` da `SetlistsScreen`,
  achada na árvore do React pelo `__REACT_DEVTOOLS_GLOBAL_HOOK__` (o `tentarNovamente` do `App.tsx`, com a raiz de verdade) —,
  sem mudar o app (`instrumentos/avd/pedir-pelo-botao.mjs`);
- o `tentar` tocado → `sync start` (o voo se liberou depois da falha por prazo: **o pedido seguinte roda**);
- **dois pedidos** pela função do botão, em `sync start` + **3.235 ms** e + **4.235 ms** (a tela em `sincronizando` nos dois);
- o logcat: `sync start` · `sync fail … code=network` em + 20.032 ms · **`sync start` + 72 ms depois** (o "de novo") · `sync
  fail` + 20.022 ms · 25 s de silêncio → **2 `sync start`, máximo em voo 1**, o 2º **depois** do fim do 1º.

A primeira corrida da B (em `rodadas.txt`) deu o mesmo desenho (2 syncs, máximo 1, o "de novo" 48 ms depois do fim), mas o
instrumento devolveu a promessa serializada em vez dos instantes das chamadas (div. 1280) — consertado e refeito
(`rodadas-B2.txt`).

**As quedas (regra 36)** `[avd/quedas.txt]`: **Java 0 · nativa 0 · tombstones 0**. O logcat inteiro: 5 `sync start`, 5
`sync fail … code=network`, **0 linhas `api`**, 0 `octavia.rocks`, `auth refresh=cached` 5 (nenhuma ida ao Google).

## 8. Os números — a suíte, o G2 e o G3

| | a `main` (`17207c4`) | a ponta (`236e47e`) | a diferença |
|---|---|---|---|
| suíte | `155 passed \| 3 skipped (158)` · `1892 passed \| 59 skipped (1951)` | `157 passed \| 3 skipped (160)` · `1914 passed \| 59 skipped (1973)` | **+2 arquivos** (`voo.test.ts`, `sy-ultimo-sync.test.ts`), **+22 testes** (17 + 5); os 59 pulados, os mesmos |
| G2 — `testID` | 124 | **124** | nenhum nó novo |
| G3 — linhas `log(` | 70 | **70**, *"nenhuma linha sumiu"* | nenhuma linha acrescentada, tirada ou trocada; nenhuma errata |
| a lista | 34 — (i) 6 · (ii) 6 · (iii) 18 · (iv) 1 · (v) 3 | **27** — (i) 6 · (ii) 0 · (iii) 18 · (iv) 0 · (v) 3 | as 7 linhas desta PR, uma a uma por commit (`lista-antes-depois.txt`) |

Os gates existentes, **sem errata** `[medido: gates-existentes.txt, gates-web.txt]`: G-inv 34 de 34 e 18 de 18 idênticos ·
G-N3 `(e)=0 · (b)=0 · nome-acessível=8 · rolagem=6 · quebra=16 ✓` · G-par da visualização zero diferenças (2) · o gate da
quebra *"zero reprovações, lista vazia"* · `icones` 0 acusações · `a20` 229 literais, 0 acusações · os `SHA256SUMS` — **o
mesmo resultado da PR-1** (só a ordem de duas linhas da saída paralela troca); os do web: G-back PASSA (`núcleo … união 40`,
*"nenhum — diff vazio no núcleo"*; o `packages/core` não está no núcleo), G-palco, G-tok, a cobertura e o G-faixa PASSAM. Os
testes de sync que já existiam (o T1-R10, o favoritar no sync, as escritas, o prazo das escritas, o prefetch) seguem verdes
na suíte.

## 9. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` copiado por `cp -p` e conferido por sha256, **sem abrir**, apagado no fim |
| requisições a terceiros | **0** — `auth refresh=cached` 5, `forced` 0 no AVD; o inspetor do Metro é local |
| requisições do app ao mock | 5 `GET /api/setlists` saíram ao `localhost:8788` (os 5 syncs), nenhum respondido dentro do prazo; 0 linhas `api`; `octavia.rocks` 0 |
| AVD `octavia_tab32` | começo e fim **iguais** (`diff` vazio); 1 abertura do app; a receita do cache (5 caminhos, md5 a md5); 0 quedas; `ram.bin` intacto |
| Tab S6 | **não tocado** |
| builds | nenhum (o dev client de 2026-09-24; nenhum módulo nativo novo) |
| processos no host | o Metro (8081) e o mock (8788), derrubados no fim (`avd/fim.txt`: `pgrep` vazio); os mocks que os testes sobem morrem com eles |
| GitHub | `git fetch origin`; o push da branch, a abertura da PR, a leitura dos checks |
| agentes | **0** |
| árvores | `../octavia-sy-precheck` e `../octavia-sy-pr1` removidas sem `--force`; `../octavia-sy-pr2` criada |
| os CN | trocaram `sincronizador.ts`, `sync.ts`, `voo.ts` (e, no roteiro da PR-1, `gatilhos.ts`, `foto-do-palco.ts`) por um instante e os devolveram com `git checkout`; o `git status` do fim de cada roteiro: vazio |
| temporários | no scratchpad da sessão: a fixture do aparelho, a cópia do cache da audit, o bundle, o log do Metro, as cópias para a prova da div. 1277 |
| regra 4 do catálogo sobre os anexos | `grep -rn eyJ` → exit 1; `grep -rln <email>` → exit 1 |
| perguntas ao Marcel durante a sessão | 0 |

## 10. Os aceites desta PR — o veredito

| # | o critério congelado (SY-D37) | veredito | a evidência |
|---|---|---|---|
| **A-SY-2** | `ii:nunca-dois-em-curso` e `ii:um-de-novo` saem; o voo no core com testes de unidade próprios | **cumprido** | §1 (17 testes), §2, `c2-verificacao.txt`; no AVD, §7 B (2 syncs, máximo 1); CN n-1, n-2, n-2b |
| **A-SY-3** | `ii:escrita-setlists-ficam` e `ii:escrita-sync-sem-cache-write-setlists` saem; `ii:escrita-conteudo-aplica` segue passando | **cumprido** — com a div. 1277 (o primeiro deles passou a medir o disco nesta PR, Q4) | §4, `c4-verificacao.txt`, `div1277-…txt`; CN n-6, n-7 |
| **A-SY-4** | `iv:janela` sai; `iv:controle-antes` segue passando; nada no `updated_at`, na `naoRegredir` nem no `reconcile` | **cumprido** | §3, `c3-verificacao.txt`, `ordem-das-linhas.txt`, `a-sy-4-intocados.txt`; CN n-3 |
| **A-SY-5** | `ii:prazo-libera-o-voo` sai; a errata do comentário do `api.ts`; o S1a remedido no aparelho (antes dos 20 s) | **cumprido no AVD** (o Tab não se toca nesta PR) | §5, `c5-verificacao.txt`; §7 A (o `s1a` a + 2,7 s, a falha a + 20.034 ms); CN n-8 |
| **A-SY-22** | o logcat da falha por prazo: `sync fail … code=network` **sem** linha `api` antes | **cumprido** | §7 A e B: 5 falhas, 0 linhas `api` |

## 11. As perguntas para o aval

Numeradas, com opções e recomendação. **O executor prepara; quem decide é o Marcel.**

**Q1 — a div. 1269: o token dentro do relógio do prazo** (§5.1). O prazo de 20 s corta o `fetch`, não a renovação do token,
que tem o prazo próprio do SDK (60 s no RN). Pior caso **por requisição** ≈ 80 s (20 + 60); o comum, 20 s; nunca infinito.
(a) **deixar como está**, com o pior caso escrito aqui e o A-SY-21 do release medindo o `ms=` (que já inclui o token); (b)
um prazo da **operação inteira** só nas leituras do sync (uma corrida contra o relógio no `get()`, ligada só pelo sync) —
mecanismo novo, e o voo passa a se liberar em 20 s mesmo com o token lento; (c) o mesmo para toda leitura e escrita — muda o
prazo das escritas e das releituras (N2-D35), fora do escopo desta PR. **Recomendo (a)**: o voo nunca tranca (toda espera tem
teto), a renovação lenta é rara (uma por hora de token), e (b) mede-se no release antes de valer o mecanismo.

**Q2 — a falha por prazo diz "SEM CONEXÃO"** (div. 1278, §7 A). Sem cache, um servidor que demora mais de 20 s mostra
*"SEM CONEXÃO · Nenhuma setlist foi salva neste aparelho ainda. Conecte-se à internet…"* com a rede de pé — o prazo é a
espécie `rede` (N2-D35), como já é nas escritas. (a) **deixar** no SY (frase nova é tela; SY-D12) e registrar como herança,
junto da frase do placeholder (SY-D23 (c)), com destino proposto no encerramento; (b) uma frase própria para o prazo nesta
série. **Recomendo (a)**.

**Q3 — a forma final da máquina do voo e do `ultimoSyncNaRede`** (§1, §2, §6.2). (a) **como está**: a máquina com três
estados e o executor guardando **quem pediu por último** (a raiz e o uid), cancelando o "de novo" sem pedido guardado ou com
a sessão mudada — uma defesa em profundidade que **absorve** um defeito só da máquina (CN n-2: só os testes dela o veem); um
sync que lança libera o voo e não encadeia; o `ultimoSyncNaRede` de módulo, não zerado no logout (a PR-4 decide, ao
consumi-lo); (b) a máquina carregando o pedido guardado (um genérico), e o executor sem estado próprio além dela — o gate (ii)
passaria a ver o n-2, ao preço de a máquina conhecer um "quem". **Recomendo (a)**.

**Q4 — as duas mudanças de instrumento do gate (ii)** (§4). (1) a leitura do `setlists.json` no caso
`escrita-setlists-ficam` (div. 1277: reprovava por exceção desde a PR-1; a asserção não mudou, e a prova de que agora mede
está no anexo); (2) o `setDados` do arnês resolvendo a função sobre o que a raiz mostra, como o React (o contrato do
`RaizDoSync.setDados` passou a aceitar a função). (a) **aceitar as duas**; (b) vetar — a (1) volta e o caso volta a passar
sem medir; a (2) volta e o executor perde a forma de aplicar só o conteúdo sem ler o `dadosRef`. **Recomendo (a)**. *(O
prompt manda parar diante de "um teste existente que só passa mudando a asserção": a asserção não mudou — mudou a leitura do
arquivo —, e por isso segui, declarando aqui e no commit `1dadf19`, para veto.)*

**Q5 — o que o sync da sessão velha grava** (§2). Com a sessão mudada, nada chega à raiz, mas o `sincronizar` já gravou o
disco **do uid dele** (como sempre gravou; o logout não apaga cache). (a) **deixar**: é o cache daquele uid, com dado
daquele uid; (b) conferir a sessão também antes do `save` — sem `cache write`, mas então o `sync ok` sairia sem gravar, e
a linha mentiria (ou pediria uma linha nova, G3). **Recomendo (a)**.

**Q6 — os dois extras declarados** (§2, §5): o `sy-ultimo-sync.test.ts` (o teste que confere o `ultimoSyncNaRede` contra as
linhas) e a errata do comentário do `PRAZO_DE_REDE_MS` no `packages/core/src/escrita.ts`. (a) **aceitar**; (b) tirar.
**Recomendo (a)**: os dois são da classe do escopo — o primeiro é o que impede o contrato exposto de divergir da definição, o
segundo é o registro do prazo onde quem mexe nele lê.

## 12. Divergências — 1277 a 1281

A última usada era a **1276** (`SY-PR1-anexos/README.md` §12) `[medido: git grep -ohE "^\| \*\*12[0-9]{2}\*\*" -- docs | sort
-u | tail → 1276; nenhum número ≥ 1277 em docs/]`. Origem: **P** premissa do prompt · **D** documento anterior · **A**
ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1277** | T | O caso `ii:escrita-setlists-ficam` (SY-PR1) lia o `setlists.json` como lista — o arquivo é `{ setlists, syncedAtMs }` — e **reprovava por exceção** (`doDisco(...).some is not a function`) desde a PR-1, sem medir o disco; o README da PR-1 dizia *"o sync grava por cima"* (o caso 42) | a leitura consertada no instrumento (regra 32), a asserção igual; a prova de que mede: reprova por medida com o código do commit 3 (*"false · false"*) e passa com o 4 (`div1277-…txt`); Q4 |
| **1278** | A | A falha por prazo, sem cache, mostra *"SEM CONEXÃO · … Conecte-se à internet"* com a rede de pé e o servidor só lento: o prazo é a espécie `rede` (N2-D35) | Q2; herança proposta para o encerramento do SY, com a do placeholder (SY-D23 (c)) |
| **1279** | T | Um `vi.mock('expo-network')` escrito num arquivo de `docs/` não pega o `net.ts`: o nome resolve a partir de `docs/` (o `node_modules` da raiz) e o app o importa de `apps/native` — a biblioteca de verdade entrou e puxou o `react-native` (`Parse failure … typeof`) | o duplo do projeto por **alias** na configuração dos instrumentos desta PR (`ordem/`, `prazo-token/`), com o porquê no cabeçalho; o instrumento do prazo da PR-1 não via isto (o `api.ts` não importa o `net.ts`) |
| **1280** | T | O 1º `pedir` do instrumento do inspetor esperava uma promessa pelo CDP (`awaitPromise`), e o Hermes devolveu a promessa serializada — sem os instantes das chamadas: a rodada B provou o "de novo", não que foram dois pedidos | as chamadas passaram a se agendar e gravar os instantes num global, lidos pelo `ler`; a B refeita (`rodadas-B2.txt`), com os dois instantes dentro do voo |
| **1281** | T | O gate (ii) mede o voo **pelo executor**, e um defeito **só na máquina** (rodar o "de novo" duas vezes) ele não vê: o executor só roda um "de novo" com um pedido guardado (CN n-2) — escopo do instrumento menor que o nome ("o voo único"), pela defesa em profundidade | os testes de unidade da máquina o veem (4 ×); o mesmo defeito no executor, o gate acusa (n-2b); Q3 |

**Contagem** `[medido: a coluna]`: **5 — T 4 · A 1** (T: 1277, 1279, 1280, 1281 · A: 1278). **A próxima livre é a 1282.**

## 13. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# SY-PR2: o voo único (a máquina no core; o executor), a sessão conferida, o ultimoSyncNaRede, a aplicação síncrona, a geração das setlists compartilhada, o prazo nas leituras do sync e as erratas do "sem prazo".
g1a: packages/core/src/voo.ts
g1a: packages/core/src/index.ts
g1a: packages/core/src/escrita.ts
g1a: apps/native/src/sincronizador.ts
g1a: apps/native/src/sync.ts
g1a: apps/native/App.tsx
g1a: apps/native/src/escrita.ts
g1a: apps/native/src/geracao-das-setlists.ts
g1a: apps/native/src/api.ts
```

```gates-web
# SY-PR2: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado (a PR toca só apps/native, packages/core e docs; o packages/core não está no núcleo).
```

Sem recuo nas linhas de dentro. **Nenhum par do G1b** (nenhuma asserção do core mudou: `voo.test.ts` é adição, e o
`escrita.ts` do core mudou só comentário) e **nenhuma errata nem remoção do G3** (70 = 70). A saída dos extratores sobre o
corpo da PR e os checks entram no §14.

## 14. Os checks da PR

*(Preenchido depois do CI, num commit de docs que só sobe com o APK verde — regra 18.)*
