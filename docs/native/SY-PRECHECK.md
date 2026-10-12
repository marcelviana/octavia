# SY — PRE-CHECK (Fase A)

**Bloco SY — a sincronização automática do tablet.** PR só de docs: nenhuma linha de código muda. O executor lê, mede o
que é seguro medir e propõe; quem decide é o Marcel, no aval. Onde o prompt e o repositório divergem, vale o repositório e a
divergência se registra (§5).

- **Árvore** `../octavia-sy-precheck`, branch `sy/precheck`, sobre `origin/main` = **`98c9f7f10097fa331c24b8ae6d0b83e8b6f21ac9`**
  `[medido: git rev-parse origin/main]` — o merge da #377, o encerramento do QL: o `QL-ENCERRAMENTO.md` tem o §13
  (QL-D62…QL-D66) e o `docs/native/LOGS-OCTAVIA.md` tem a regra 40 (*"A regra que o QL firmou — 40"*, `:741-755`) e o caso
  44 (`:301`) `[lido]`.
- **Convenção**: `[medido]` = comando + saída literal desta sessão (no anexo); `[lido]` = do arquivo citado, com caminho e
  linha **da ponta da `main`**; `[hipótese]` = o resto.
- **Anexos**: [`SY-PRECHECK-anexos/`](SY-PRECHECK-anexos/README.md).
- **Como foi lido**: o executor leu inteiros o `CLAUDE.md`, o `docs/native/LOGS-OCTAVIA.md` (regras 0–5 e 9–40, casos 1–44),
  o `docs/native/APARATO.md`, o `QL-ENCERRAMENTO.md` e o `QL-PRECHECK.md`; do `PRD-TELA-1.md`, o T1-R9b, o T1-R10 e o T1-R13; do
  `D0-ENCERRAMENTO.md`, o §8.2 item 3 e a errata dele. O código do caminho do sync (o `App.tsx`, o `sync.ts`, o `net.ts`, o
  `api.ts`, o `store.ts`, os dois `favoritar.ts`, o `escrita.ts`, o `navigation.tsx`, o palco, V, o leitor, o plano de
  arquivos) e a biblioteca `expo-network` instalada foram lidos nesta sessão. **Nenhum agente.**
- **Divergências**: **1256–1263** (§5). A faixa conferida na coluna e em prosa `[medido: SY-PRECHECK-anexos/divs-faixa.txt]`:
  a última usada é a **1255** (`QL-ENCERRAMENTO.md:536`); nenhum número ≥ 1256 em `docs/`. A primeira livre era a **1256**,
  como diz o `QL-ENCERRAMENTO.md` §13.2.

**A fila já está registrada e não se registra de novo** (SY-D2): SY → resto do D → navegação do palco → metrônomo → N5 →
identidade → iOS, com o W5 à parte (QL-D64).

---

## 0. As decisões do recorte `[Marcel, 2026-10-10]`

| # | decisão |
|---|---|
| **SY-D1** | O bloco se chama **SY** (a sincronização automática). Decisões SY-D*n*, documentos em `docs/native/SY-*`, branches `sy/…`, árvores `../octavia-sy-…`. |
| **SY-D2** | **A fila já está registrada e não se registra de novo**: SY → resto do D → navegação do palco → metrônomo → N5 → identidade → iOS, com o W5 à parte (QL-D64). |
| **SY-D3** | **O requisito do Marcel: o texto não pode mudar no meio de uma música no palco.** |
| **SY-D4** | **Os gatilhos são os dois do T1-R13 passo 4**: a rede volta com o app aberto; a volta do segundo plano depois de 30 s. **Sem sync periódico e sem gesto manual** (o gesto seria controle novo, com desenho e regra 40; se um dia entrar, é no bloco da navegação do palco). |
| **SY-D5** | **Intervalo mínimo entre syncs automáticos**: a volta da rede só dispara se o último sync terminou há mais de 30 s (o prazo do PRD). O pre-check confirma o número e propõe se o intervalo vale também depois de um sync que falhou. |
| **SY-D6** | **Com o palco aberto, o sync roda normalmente e a foto protege a tela.** Condição: medir o custo do sync durante a rolagem automática (quadros perdidos), no pre-check ou na PR dos gatilhos. Se houver engasgo, a decisão vira "com o palco aberto nenhum gatilho automático dispara; o sync fica marcado e roda ao sair do palco". |
| **SY-D7** | **O alcance da foto.** O **conteúdo** da música vale por abertura da música: a versão nova entra ao trocar de posição ou ao sair e voltar. A **setlist** vale pela sessão inteira do palco: ordem e número de músicas só mudam ao sair do palco. Em **V**, a foto é da música aberta. |
| **SY-D8** | **Nenhum aviso de versão nova**: ela aparece na próxima abertura. (Responde ao que a QL-D12 deixou para o SY.) |
| **SY-D9** | **O voo único**: um sync por vez; o gatilho que chega durante um sync marca "de novo ao terminar". O pre-check lê também a corrida do sync com a releitura das escritas de setlist (div. 1183) e propõe se a mesma fila as cobre; a forma se decide no aval. |
| **SY-D10** | **A janela da `naoRegredir`**: o SY a prova com controle negativo **e a fecha**, se o conserto for só de ordem dentro do app. **Não toca** no `updated_at` do favoritar nem no critério do `reconcile` (são do D), e deixa escrito o que o D tem de mudar junto (`QL-ENCERRAMENTO.md` §8.4, item 1). Se fechar exigir mexer no `updated_at`, o SY só prova e escreve, e o conserto vai ao D. |
| **SY-D11** | **Fica fora**: o site e o backend, inclusive a requisição condicional (`ETag`), que vira herança se o custo incomodar; o `updated_at` do favoritar e o critério do `reconcile` (D); a faixa A (N5); as quedas nativas do dev client e as corridas 124/146 (W5). |
| **SY-D12** | **Sem brief e sem desenho**: com a SY-D4 e a SY-D8, o bloco não tem pixel novo. Se o pre-check achar algum, é pergunta para o aval. |
| **SY-D13** | **Os gates, primeiro, entrando reprovados na PR-1**, com rede e `AppState` simulados e com o mock, sem prod: (i) **os gatilhos** — a rede volta → 1 sync; segundo plano > 30 s → 1; < 30 s → 0; sem sessão → 0; dentro do intervalo mínimo → 0; (ii) **o voo único** — dois gatilhos sobrepostos → nunca dois syncs em curso, e exatamente um "de novo" ao terminar; (iii) **a foto**, no `native-tela` — o sync troca o `contentById` com o palco e V montados → o nó `corpo` não muda, a rolagem não para, a posição não volta ao topo; ao trocar de posição → muda; a setlist conforme a SY-D7; (iv) **a janela da `naoRegredir`** — o favoritar confirmado no meio do sync → a estrela fica, na memória e no disco; (v) **a contagem de requisições por evento** — 2 `GET` por sync até 100 músicas. Os gates existentes seguem verdes sem errata; as linhas de log novas do G3 (o motivo do sync) se declaram na PR. |
| **SY-D14** | **O fatiamento proposto**: pre-check → **PR-1** gates → **PR-2** o voo único e a `naoRegredir` → **PR-3** a foto → **PR-4** os gatilhos → encerramento com release. As proteções entram antes do que alarga as janelas: a `main` nunca fica com gatilho automático sem foto e sem voo único. O pre-check pode propor juntar a PR-2 e a PR-3, com o motivo. Cada PR nomeia a seguinte. |
| **SY-D15** | **O pre-check é só docs, sem aparelho e sem prod, e sem Fase B de dado real**: nada aqui depende da biblioteca do Marcel. Se a leitura mostrar que depende, é pergunta para o aval. |
| **SY-D16** | **O bloco termina com release no Tab**, no molde do A-QL-21: 100 + 100 aberturas frias com a contagem de quedas (regra 36); **a regra 38 (c)/(d) remedida** (desligar o avião com o app aberto → 1 sync; segundo plano por mais e por menos de 30 s → 1 e 0), com a contagem de `GET` declarada antes; e **o julgamento do Marcel**: com uma música dele aberta no palco e a rolagem andando, ele edita o texto no site e a rede volta — o texto não muda e a rolagem não para; ao sair e voltar, o texto novo está lá. A edição no site é escrita do Marcel e entra na contabilidade como tal. |

*(Errata do aval do pre-check — SY-D17…SY-D31 `[Marcel, 2026-10-10]`, §8; o commit 2 a aplicou. O texto das decisões acima
fica como está; as mudadas por decisão posterior:)*

| decisão | mudada por | o quê |
|---|---|---|
| SY-D5 (o intervalo só para a volta da rede) | **SY-D18** | o intervalo vale para os dois gatilhos, do fim do último sync que saiu à rede; não vale depois de falha de rede; vale depois de falha com status; o *"de novo"* e o *Tentar de novo* fora dele |
| SY-D7 (a setlist pela sessão do palco) | **SY-D22** | a forma: a foto acima da instância, num módulo que o `native-tela` monta, ligado pelo `navigation.tsx`; a ligação se prova no aparelho |
| SY-D9 (o voo único) | **SY-D19**, **SY-D25** | o prazo de 20 s também nas leituras do sync, como condição; a máquina no core, o executor no app, a geração de emissão das setlists compartilhada com as releituras |
| SY-D10 (provar e fechar a janela) | **SY-D26** | cumpre-se pela aplicação na raiz no mesmo bloco síncrono, na PR-2; o §A6.4 é o texto que o D cita |
| SY-D14 (o fatiamento) | **SY-D29** | a extração do `rodarSync` num commit próprio da PR-1, antes dos gates, com a prova de que nada mudou; os aceites se congelam no aval da PR-1 |
| SY-D6 (o custo com o palco aberto) | **SY-D36** | o critério da decisão: relativo ao piso das mesmas rodadas (e, para o release, a lacuna do `uiautomator events`); se o "depois" reprovar, a PR-3 volta com a pergunta (`SY-PR1-anexos/README.md` §13) |
| SY-D20 (onde e quando se mede o custo) | **SY-D36**, **SY-D38** | o critério congelado no aval da PR-1 (SY-D36); o "antes" e o "depois" medidos sobre a base da PR-3, nos dois aparelhos, o Tab na mesma ida (SY-D38) |
| SY-D19 (o prazo nas leituras do sync) | **SY-D32** | confirmada: os 20 s cobrem a resposta inteira, e a SY-D19 (a) fica, com quatro acréscimos (`SY-PR1-anexos/README.md` §5.1) |
| SY-D6 (o sync com o palco aberto) | **SY-D49** | decidida: o "depois" reprovou o critério da SY-D36 nos dois aparelhos, e **com o palco aberto nenhum gatilho automático dispara; o sync fica marcado e roda ao sair do palco** (`SY-PR3-anexos/README.md` §5, §16) |
| SY-D20 (onde e quando se mede o custo) | **SY-D49** | decidida no aval da PR-3, com o "antes" e o "depois" da PR-3 na mão (`SY-PR3-anexos/README.md` §5) |
| SY-D7 (o alcance da foto) | **SY-D49** | a versão nova chega ao tablet ao sair do palco, e não entre duas músicas (SY-D49) |
| SY-D28 (a linha `sync trigger`) | **SY-D49** | um valor a mais de `decision`: o gatilho segurado pelo palco aberto (o nome é proposta da PR-4) |
| SY-D27 (o rascunho da regra 38) | **SY-D49** | o rascunho da regra 38 e a linha do `APARATO.md` ganham *"com o palco aberto, o gatilho não dispara"* no texto final do encerramento |

---

## 1. O resumo, para quem lê só isto

1. **O §A6 do QL ainda descreve o código**, com as linhas deslocadas pelo QL (o palco e o `LOGS-OCTAVIA.md` cresceram): hoje
   o único lugar que emite `sync start` é o `sincronizar()` (`apps/native/src/sync.ts:65`), o único chamador é o `rodarSync`
   do `App.tsx:197-243` — na entrada da sessão (`:272`) e no *Tentar de novo* (`:277`) —, e não há `AppState`, timer nem
   `RefreshControl` em `apps/native` nem no core. A volta da rede só loga `net online` (`net.ts:28-38`) (A1; div. 1256).
2. **Os dois gatilhos não pedem dependência nova**: o `AppState` é do `react-native` (0.86.3) e o ouvinte de rede já existe
   (`expo-network` 57.0.1, `net.ts:36`). O `CI-FAIXA.md` não muda. No Android, *"internet alcançável"* exige
   `NET_CAPABILITY_VALIDATED` — **o portal cativo não conta como rede** `[lido: NetworkUtils.kt:42-45]` —, e a troca Wi-Fi ↔
   dados sem queda **não** produz um *"voltou"*, porque o `useOnline` só vê a mudança do booleano. **Atenção**: a primeira
   leitura do `useOnline` (de `null` para `true`) também loga `net online` — o gatilho não pode ser essa linha (A2).
3. **O intervalo de 30 s**, contado do **fim** do último sync que saiu à rede, vale para os dois gatilhos; depois de uma
   falha **de rede** (`code=network`) ele não vale, porque a rede voltando é justamente o evento que a falha esperava; o
   *"de novo"* do voo único e o *Tentar de novo* não passam por ele (A2, Q2). **O web não conta a ausência**: conta 30 s
   entre dois focos (`hooks/use-setlist-data.ts:132`) — div. 1257.
4. **O sync não tem prazo de rede** (`api.ts:157-162`, de propósito, pelo S1a): com voo único, **um sync pendurado tranca
   todo gatilho** até o app fechar. Pergunta Q3 (div. 1258).
5. **Hoje o palco já perde a música no meio quando a setlist some**: um sync que apaga a setlist aberta troca o palco inteiro
   por *"SETLIST · não está no cache"* (`navigation.tsx:248-251`); a música apagada vira *"conteúdo não baixado"*
   (`StageScreen.tsx:172-176`). E **qualquer** setlist mudada recria o objeto da aberta e dispara o efeito de troca de música
   (para a rolagem, volta ao topo — `StageScreen.tsx:375-389`), embora o comentário diga *"o id da setlist"* (div. 1261). A foto
   resolve os três (A4; divs. 1259, 1261).
6. **"A sessão do palco" não existe no código** (div. 1260): o salto pelo índice **desempilha** o palco e cria outro (errata
   E6 do `LOGS-OCTAVIA.md:97-102`), e o índice, o fim e a busca na setlist leem a setlist **viva** da raiz. A SY-D7 pede a
   foto da setlist pela sessão: ou a foto mora acima do palco (no `navigation.tsx`, que o `native-tela` não roda), ou por
   instância. Pergunta Q6 — **recomendo acima do palco**.
7. **A estrela não congela**: em V ela é o `is_favorite` da linha (`VisualizacaoScreen.tsx:349`), e o favoritar a entrega pela
   raiz (`aoGravar`). A foto congela o texto (corpo, notas, título, *Detalhes*, o PDF) e deixa viva a estrela, o estado do
   arquivo no disco e o ponto de rede. O palco não tem estrela. **Nenhum pixel novo** — a SY-D12 vale (A4, Q5).
8. **O PDF não muda debaixo da tela**: todo upload é um objeto novo (`${timestamp}-…`, `upsert: false`,
   `app/api/storage/upload/route.ts:93-103`), o arquivo é chaveado pela URL, e a foto congela o `file_url` (A4, Q8).
9. **A janela da `naoRegredir` é só de ordem**: ela é a fronteira de microtarefa entre o `sync.ts:107-124` e o
   `App.tsx:211` — e **o CN da N4-D91 não a vê**, porque testa o `sincronizar()` e nenhum teste monta o `App.tsx` (div.
   1262). **O conserto**: a aplicação na raiz (o `dadosRef` e o `setDados`) no **mesmo bloco síncrono** que lê as
   confirmadas e grava o disco. Fecha sem tocar no `updated_at` (A6, Q10). **O que o D tem de mudar junto** está no
   §A6.4, para o D citar.
10. **O voo único e as escritas**: um sync que leu as setlists **antes** de uma escrita grava **por cima** da releitura dela
    (`sync.ts:103,115` sobre `escrita.ts:330`). **Recomendo**: o voo único só para os syncs, e para as setlists **a mesma
    regra da div. 232** que as releituras já usam — a geração de emissão do `GET` compartilhada entre o sync e o
    `reler()` —, sem fila para as escritas (A5, Q9).
11. **O custo com o palco aberto não foi medido** nesta sessão (A3): o instrumento existe em parte (o inspetor do Metro da
    QL-PR3, o `uiautomator events` da âncora) e o caminho também (o mock `atraso` segura o sync da abertura com o palco já
    aberto). **Proposta**: medir o "antes" na PR-1 e o "depois da foto" na PR-3, nos dois aparelhos, e decidir a SY-D6 no
    aval da PR-3, antes de a PR-4 ligar os gatilhos (Q4). O passo da rolagem é **por quadro**, não por tempo
    (`StageScreen.tsx:477`): um engasgo **pausa** a rolagem, não a faz saltar.
12. **O fatiamento da SY-D14 se confirma**, com um ajuste: a **PR-1 extrai** o `rodarSync` do `App.tsx` para um módulo
    (sem mudar comportamento) e dá ao duplo o `AppState` e o ouvinte de rede — sem isso os gates (i), (ii) e (iv) não têm
    o que importar. A PR-2 e a PR-3 **não se juntam** (arquivos, projetos de teste e aceites diferentes). **Uma linha de
    log nova**: `sync trigger reason=… decision=…` (G3 70 → 71, na PR-4). Q12, Q13.

---

## 2. Fase A — a leitura

### A1 — o §A6 do QL relido na ponta da `main`

`[medido: SY-PRECHECK-anexos/a1-greps.txt]` — os `git grep` de lá, refeitos: `AppState` → **exit 1**; `RefreshControl` →
**exit 1**; `setInterval` → só `ModoDeReordenar.tsx:325,353`; `setTimeout` → o prazo do `api.ts:171`, a folha
(`FolhaDeCriar.tsx:307`), a âncora (`Leitor.tsx:359`) e o motivo do palco (`StageScreen.tsx:291`) — nenhum de sync; quem
chama `sincronizar`: só o `App.tsx:199`; o `sync start` só no `sync.ts:65`.

| # | afirmação do §A6 (`QL-PRECHECK.md`) | vale? | linha de hoje |
|---|---|---|---|
| A6.1-a | um lugar emite `sync start`, `sincronizar()`; sem rede loga `sync skip reason=offline` e volta | **sim** | `sync.ts:65`; `:59-62` |
| A6.1-b | quem chama: só o `rodarSync`, na entrada da sessão (depois de renderizar o cache) e no *Tentar de novo* | **sim** | `App.tsx:197-243`; o efeito `:245-273` (chamada `:272`); `:275-278` |
| A6.1-c | não existe `AppState`, `RefreshControl`, timer de sync (o único `setInterval` é o do reordenar) | **sim** | `a1-greps.txt`; `ModoDeReordenar.tsx:353` |
| A6.1-d | a volta da rede só loga `net online` e muda o indicador; o cabeçalho adia o passo 4 a uma *"PR posterior"* | **sim** | `net.ts:28-38`; `net.ts:4-5` (era `:29-38`) |
| A6.1-e | o T1-R13 passo 4 já especificava o sync automático, com 30 s | **sim** | `PRD-TELA-1.md:158` |
| A6.1-f | custo: 2 `GET` até 100 músicas (`1 + ⌈N/100⌉`); o plano exclui o que está no disco | **sim** — e o plano **não** exclui o que falhou (A2.5; div. 1263) | `sync.ts:6-7`; `offline.ts:219-221` |
| A6.1-g | `content-read`/`setlist-read`: 300/min por usuário | **sim** | `PLANO-TRANSICAO.md:331` |
| A6.2-a | o palco não guarda o que abriu: recebe o `contentById` da raiz a cada render; os params só têm ids e posição | **sim** | `navigation.tsx:225-280`; `:39-59` |
| A6.2-b | o corpo se recalcula a cada render (`resolveSong` → `bodyOf`) | **sim** | `StageScreen.tsx:316-320` (era `:304-308`) |
| A6.2-c | quando o `rodarSync` termina, ele troca o estado da raiz | **sim** | `App.tsx:211-217` |
| A6.2-d | se qualquer setlist mudou, o efeito de troca roda: para a rolagem e volta ao topo | **sim**, e o motivo é o **objeto** `setlist` nas dependências, não o id (div. 1261) | `StageScreen.tsx:375-389` (era `:355-368`) |
| A6.2-e | se o número de músicas mudou, a mesma posição pode apontar outra música | **sim** | `StageScreen.tsx:315` (era `:303`) |
| A6.2-f | V também troca | **sim** — e V **já guarda** a última música vista quando ela some do cache (`ultimo`) | `navigation.tsx:327`; `VisualizacaoScreen.tsx:263-266` |
| A6.2-g | o custo da foto: um `useRef` por tela | **vale para o conteúdo**; para a setlist "pela sessão" **não basta** (div. 1260) | A4.5 |
| A6.3-a | `naoRegredir`: a confirmada fica só se estritamente mais nova; chamada só no sync, depois do `reconcile`; o mapa nunca se poda | **sim** | `packages/core/src/favoritar.ts:176-210` (era `:178-210`), `:205`; `sync.ts:107`; `apps/native/src/favoritar.ts:71-81`, `:170` |
| A6.3-b | coberta para a corrida "o sync leu antes do `PUT` e grava depois" | **sim** | `apps/native/test/favoritar-sync.test.ts:141` |
| A6.3-c | a janela: o `confirmadas.set` entre a leitura das confirmadas (`sync.ts:107`) e a troca da raiz (`App.tsx:211-228`) | **sim**, e é mais estreita do que o texto diz: entre `:107` e o `return` (`:124`) não há `await` — a janela é a fronteira de microtarefa do `await sincronizar` (A6.1) | idem |
| A6.3-d | não há trava de sync; o último a terminar vence com o `anterior` velho, inclusive sobre uma releitura de escrita | **sim** | `App.tsx:197-243`; `sync.ts:55-125`; `escrita.ts:296-337` (era `:296-338`) |
| A6.3-e | se o `PUT` parar de mexer no `updated_at`, a `naoRegredir` vira nada, e o `reconcile` devolve o anterior quando nenhum `updated_at` mudou | **sim** | `favoritar.ts:205` (core); `packages/core/src/sync.ts:131-134`, `:124-125` |
| A6.4 | a regra 38 | **sim**, o texto é o mesmo | `LOGS-OCTAVIA.md:710-721` (era `:709-720`) |

**Divergência 1256 (D)**: seis citações do §A6 caíram de linha (as marcadas *"era"*), porque o QL mexeu no palco e o
encerramento do QL acrescentou o caso 44 ao `LOGS-OCTAVIA.md`. **Nenhuma afirmação deixou de valer**; duas ganham precisão
(A6.2-d, A6.3-c) e uma tem escopo menor do que parece (A6.2-g).

### A2 — os gatilhos (SY-D4, SY-D5)

**A2.1 — onde cada um se liga** `[lido]`:

- **A rede**: o único ouvinte é o do `useOnline` (`net.ts:23-43`), um `Network.addNetworkStateListener` (`:36-38`) que
  reduz o estado a um booleano — `isInternetReachable ?? isConnected ?? false` — e só loga e muda o estado na **mudança**
  (`:28-34`). Ele vive na raiz (`App.tsx:68`), uma vez, e nada mais o escuta. **O gatilho se liga aqui**: a transição
  `false → true`.
- **A primeira leitura não é uma volta**: `anterior` começa `null` (`net.ts:27`) e a leitura inicial (`:35`) loga
  `net online` na abertura — é a linha que os releases do N4 mostraram depois do avião (regra 38 (d)). **O gatilho conta só
  `false → true`**, nunca `null → true`; senão toda abertura com rede faria dois syncs.
- **O `AppState`**: zero uso hoje (A1). É do `react-native` 0.86.3 — `'active' | 'background' | 'inactive'` (o
  `inactive` só no iOS) e o evento `'change'` `[lido: AppState.d.ts:20-40, no anexo a2-a4-leituras.txt]`.
- **Dependências**: **nenhuma nova** (o `expo-network ~57.0.1` e o `react-native 0.86.3` já estão no
  `apps/native/package.json`). O `CI-FAIXA.md` não muda: módulo nativo novo não entra na lista fechada de segmentos
  (`CI-FAIXA.md:54-55`), e não há módulo novo.

**A2.2 — o que o Android entrega como "rede voltou"** `[lido: expo-network 57.0.1, a2-a4-leituras.txt]`:

| situação | o que a biblioteca entrega | o `useOnline` vê | `[lido]` / `[hipótese]` |
|---|---|---|---|
| avião desligado, Wi-Fi validado | `onAvailable` → evento 250 ms depois; `onCapabilitiesChanged` → outro, com o mesmo atraso (o `removeCallbacks` os junta) | `false → true`, uma vez | `[lido: NetworkModule.kt:39-42, 100-102, 182-185]` |
| **rede sem internet / portal cativo** | `isInternetReachable` = `INTERNET && VALIDATED && NOT_SUSPENDED` — o portal cativo não é `VALIDATED` | continua `false`; **sem gatilho** até a rede validar | `[lido: NetworkUtils.kt:42-45]`; o portal no Tab `[hipótese]` |
| troca Wi-Fi ↔ dados sem queda | um `onLost` com outra rede ativa emite o estado da nova (alcançável) | `true → true`: **sem gatilho** | `[lido: NetworkModule.kt:66-79]`; no aparelho `[hipótese]` |
| troca Wi-Fi ↔ dados com queda | `onLost` sem rede → `isConnected=false` direto; depois `onAvailable` | `true → false → true`: **um gatilho** | idem |
| a rede volta com o app em **segundo plano** | o ouvinte é do módulo, registrado no `OnCreate`; o JS recebe enquanto o processo vive | `false → true` em segundo plano | `[hipótese]` — medir na PR-4 |
| Wi-Fi de palco que oscila | um par `false → true` por oscilação | um gatilho por volta | `[hipótese]` — é o que o intervalo existe para conter |

**O que só o aparelho mede (PR-4)**: o portal cativo, a troca Wi-Fi ↔ dados, a entrega em segundo plano e o tempo entre o
`ping` respondendo e o `net online`.

**A2.3 — os casos de borda, cada um com proposta** (pergunta Q1):

| caso | proposta | por quê |
|---|---|---|
| a rede volta com o app **em segundo plano** | **não dispara**; marca *"a rede voltou na ausência"* | sync em segundo plano é trabalho que o músico não vê; quem decide é a volta |
| a volta do segundo plano **depois de 30 s** | **1 sync** (se a rede estiver de pé e fora do intervalo) | o T1-R13 passo 4 |
| a volta do segundo plano **antes de 30 s**, sem a marca | **0** | idem |
| a volta antes de 30 s **com a marca** | conta como **"a rede voltou"** (sujeito ao intervalo) | a volta da rede aconteceu; só foi adiada |
| os dois juntos (a volta, e a rede voltando logo depois) | **um** sync: o que chegar primeiro dispara; o segundo cai no voo único (*"de novo"*) se o primeiro ainda corre, ou no intervalo se já terminou | o voo único e o intervalo, sem regra própria |
| a volta do segundo plano **sem rede** | **0**, e sem `sync skip` (nenhuma chamada ao `sincronizar`); quando a rede voltar, o gatilho da rede dispara | evita uma linha `sync skip` por troca de app em avião |
| um gatilho **antes de o sync da abertura terminar** | **voo único**: marca *"de novo"* | a SY-D9 |
| **sem sessão** (S0) | **0** — os gatilhos só existem com `estado.fase === 'dentro'` | não há `uid` |
| **logout no meio** (o 2º 401 de uma escrita ou do favoritar, `api.ts:109`) | o resultado do sync em voo **se descarta** se a sessão mudou, e o *"de novo"* se cancela | hoje o `rodarSync` não confere a sessão: um sync que termina depois do `onAuth(null)` (`App.tsx:184`) regravaria os dados da sessão velha na raiz `[lido; não medido]` |
| o *Tentar de novo* visível e um gatilho chegando | o gatilho roda o sync (o botão some com o `sincronizando`, `App.tsx:198`); um toque no *Tentar de novo* **não** passa pelo intervalo, passa pelo voo único | o gesto é do músico |
| a primeira leitura do `useOnline` (`null → true`) | **não é gatilho** | A2.1 |

*(Errata do aval da PR-1 — **SY-D39** `[Marcel, 2026-10-11]`, div. 1267: a linha "os dois juntos" acima dizia "um sync" nos
dois casos. Vale: o segundo evento **depois do fim** do primeiro sync → **1** sync (o intervalo segura); o segundo **durante**
o primeiro → **2** syncs (o "de novo" do voo único). O texto da tabela fica como está; o gate (i) mede as duas leituras
(`dois-eventos`, `de-novo-fora-do-intervalo`), `SY-PR1-anexos/README.md` §3 e §13.)*

**A2.4 — o intervalo mínimo** (SY-D5; pergunta Q2):

- **Contado de quê**: do **fim** do último sync **que saiu à rede** (o que emitiu `sync start` e terminou em `sync ok` ou
  `sync fail`). O `sync skip reason=offline` não conta: não houve requisição.
- **Os 30 s se confirmam**: o sync medido custa ~1–2 s com 63 músicas (`QL-PRECHECK.md` §A6.2) `[lido]`; 30 s é o prazo
  que o PRD já usa para a ausência, e é curto contra uma noite de palco (no pior caso, um evento a cada 30 s = 4 `GET`/min,
  contra 300/min da família, `PLANO-TRANSICAO.md:331`).
- **Para os dois gatilhos**, não só para a rede: uma regra só, e um gate só. A volta do segundo plano já exige 30 s de
  ausência; o intervalo só a barra no caso raro de um sync ter terminado durante a ausência.
- **Depois de uma falha**: **(a) falha de rede** (`code=network`, sem resposta HTTP — `sync.ts:88-89`) → o intervalo **não
  vale**: a falha foi a rede, e a rede voltando é o evento que se espera; **(b) falha com status** (5xx, 429) → **vale**: o
  servidor respondeu, e pedir de novo a cada oscilação não ajuda (o 429 ainda tem o próprio prazo). **Não há gate de 429 nas
  leituras** — o `get()` só loga a linha `ratelimit` (`api.ts:190-192`) `[lido]`.
- **O que não passa pelo intervalo**: o *"de novo"* do voo único (a SY-D9: o gatilho que chegou durante um sync aconteceu
  **depois** da leitura dele) e o *Tentar de novo* (gesto). **Custo declarado**: no pior caso, 2 syncs seguidos por evento
  (4 `GET`).
- **Contra o web** (div. 1257): o `PRD-TELA-1.md:158` diz *"o web usa 30 s"* e cita o `hooks/use-setlist-data.ts:172`; hoje é
  o `:132`, e o web conta **30 s entre dois focos** (`lastFocusTimeRef` atualizado a cada foco, `:128-136`), não a ausência.
  O nativo usa a **ausência** (de `background` a `active`), que é o que o passo 4 escreve.

**A2.5 — o custo por evento** `[lido]`: **2 `GET`** até 100 músicas — `GET /api/setlists` e `GET /api/content?…page=1`
(`sync.ts:6-7`, `:67-68`); 3 a partir de 101. Sem requisição condicional: o corpo inteiro trafega mesmo sem mudança
(SY-D11). **O plano de downloads em regime**: depois de todo sync o `prefetchEArrumar` roda (`App.tsx:229`, `:242`) — e o
plano exclui **só o que está no disco** (`offline.ts:221`). Em regime, `prefetch plan n=0` e 0 downloads; **mas todo arquivo
que falta e falha** (o 404 do `nao-existe.pdf` da fixture, `APARATO.md:345-346`) **é pedido de novo a cada sync** — com os
gatilhos, a cada evento (div. 1263). Na conta do Marcel não se conhece arquivo que falhe (o release do QL baixou 1 e deu
certo, `QL-ENCERRAMENTO.md` §5) — a contagem do release separa `GET` de download.

### A3 — o sync com o palco aberto (SY-D6)

**O que o sync faz na thread de JavaScript** `[lido]`, em ordem:

| passo | onde | o que custa `[hipótese de grandeza]` |
|---|---|---|
| as duas respostas: `response.text()` + `JSON.parse` | `api.ts:183`, `:193` | dezenas de KB por sync (63 músicas; o corpo todo é 19.481 B, T1-R20) — poucos ms |
| `reconcileByUpdatedAt` × 2 + `naoRegredir` | `sync.ts:103-107` | O(n), desprezível |
| **a gravação**: `semEmbutido` + `JSON.stringify` × 2 + gravação atômica **síncrona** (`.tmp`, `delete`, `move`) | `store.ts:134-162` | a chamada de arquivo do `expo-file-system` é síncrona **na thread de JS** — o maior candidato |
| a troca da raiz: `setDados` → render da raiz e de **toda tela montada** (S1 embaixo, o índice, o palco) | `App.tsx:211` | o palco refaz `resolveSong`/`bodyOf`; **sem foto**, um corpo novo refaz `quebrar` (1,6–2,7 ms de mediana, 12,6 ms de máximo no dev client, `QL-PR3-anexos/README.md` §9) |
| o plano e o LRU: `planoDaBiblioteca`, `presentUrls`, `aplicarLru` (`listFiles`) | `App.tsx:127-133`; `prefetch.ts:332-350` | leituras síncronas de índice e disco |

**O que isso pode custar à rolagem**: a rolagem automática é um `requestAnimationFrame` **na mesma thread** que faz
`y += 1` e `scrollTo` a cada quadro (`StageScreen.tsx:472-480`). Uma tarefa de JS mais longa que um quadro (16,7 ms) faz o
quadro seguinte não andar. Como o passo é **por quadro e não por tempo**, o engasgo **pausa** o texto (não o faz saltar),
e o que o músico percebe é a pausa — visível a partir de ~100 ms `[hipótese]`.

**O instrumento — o que existe e o que falta** `[lido: APARATO.md]`:

- **O que NÃO serve**: o `dumpsys gfxinfo`, que mede os quadros da thread de **UI** — ela continua desenhando enquanto o JS
  trava, e a rolagem parada não aparece como quadro perdido. Seria o caso do padrão de novo: o instrumento mede quadros, e
  o que se quer saber é o passo de JS. Fica fora.
- **(1) o inspetor do Metro (CDP)** da QL-PR3 (`QL-PR3-anexos/instrumentos/custo-hermes.mjs`; `APARATO.md:506-509`): roda
  código no Hermes do app sem mudar o app. **O que falta**: um sensor de quadros — um laço de `requestAnimationFrame`
  posto pelo inspetor que grava o intervalo entre quadros (`performance.now()`), lido de volta depois. Só no **dev client**
  (a QL-D61: o release não tem inspetor).
- **(2) o `uiautomator events`** (o `ScrollY` por evento de acessibilidade, o instrumento da âncora,
  `QL-PR3-anexos/instrumentos/ancora.ts`; `APARATO.md:503-505`): funciona **também no release**, mas a resolução é a do
  evento de rolagem de acessibilidade (~100 ms `[hipótese]`) — vê pausa longa, não quadro.
- **O caminho para provocar o sync com a rolagem andando, sem código novo**: o mock no modo `atraso` segura cada resposta
  45 s (`aceite.py:62-63`, `:546-552`); abre-se o app, abre-se o palco e liga-se a rolagem antes de o sync da abertura
  terminar — é a div. 1182 provocada de propósito, e é o **pior caso** (sem foto, o corpo se refaz).

**Onde e quando** (pergunta Q4): **o "antes" na PR-1**, no AVD e no Tab (dev client + mock, regra 35 no Tab), com (1) e (2)
— sem foto, o pior caso; **o "depois da foto" na PR-3**, igual; **a decisão da SY-D6 no aval da PR-3**, antes de a PR-4
ligar os gatilhos; e **no release do encerramento**, só o (2), com a ressalva da QL-D61. O critério candidato, para o aval
decidir com o número na mão: **nenhum intervalo entre quadros > 100 ms durante o sync**, n ≥ 10 syncs por aparelho.

**Não rodou nesta sessão** (§1 do prompt; declarado). Razões: pede o Metro, o mock, o dev client e um instrumento novo (o
sensor de quadros), que é código de anexo — a forma de uma PR, não de um pre-check só de docs; e a medida não muda nenhuma
pergunta deste aval, só a da SY-D6, que tem condição própria. **Nenhum aparelho foi tocado.**

*(Nota da SY-PR3 — ponteiro, sem reescrever o texto acima: o "antes" e o "depois" medidos sobre a base da PR-3, nos dois
aparelhos (SY-D38), pelo caminho do *Tentar de novo* com o palco aberto (o `atraso` já não serve depois do prazo da PR-2,
div. 1286). O "depois" **reprova o critério do dev client** da SY-D36 nos dois e **passa o do release** nos dois; o que
sobra são renders (o disparo e a troca da raiz), não a gravação. A SY-D6 é do aval da PR-3:
`SY-PR3-anexos/README.md` §5 e a Q1.)*

*(Nota do aval da PR-3 — **SY-D49** `[Marcel, 2026-10-12]`: a SY-D6 cai para a saída (a) — com o palco aberto nenhum gatilho
automático dispara; o sync fica marcado e roda ao sair do palco. `SY-PR3-anexos/README.md` §5, §16.)*

### A4 — a foto (SY-D7)

**A4.1 — de onde cada coisa vem hoje, e o que congela** (pergunta Q5):

| o que a tela mostra | de onde vem hoje `[lido]` | congela com a foto? (proposta) |
|---|---|---|
| **o corpo** (Letra, Cifra, Tab) | `contentById` → `resolveSong` → `bodyOf` (`StageScreen.tsx:316-320`); V: `VisualizacaoScreen.tsx:290-293` | **sim** — é a SY-D3 |
| **as notas da música** (QL-PR4) | `notasDaVisualizacao(content)` (`StageScreen.tsx:564`; V `:142`) | **sim** — texto da música |
| **o recolher das notas** | a preferência do aparelho (`useNotasRecolhidas`, `StageScreen.tsx:568`) | não — não é dado do sync |
| **o título · artista · tipo** | `content.title`/`artist`/`content_type` (`StageScreen.tsx:641-648`; V `:346-348`) | **sim** |
| **o tom, o andamento e os outros *Detalhes*** (só V) | `camposDaVisualizacao(content)` (`visualizacao.ts:49-56`) | **sim** |
| **a nota da posição** (a barra do palco) | `song.notes`, da **setlist** (`StageScreen.tsx:659-665`) | **sim, com a setlist** |
| **o nome da setlist** e o **"n DE N"** | `setlist.name`, `songs.length` (`StageScreen.tsx:695-697`, `:709-712`, `:313`) | **sim, com a setlist** |
| **o PDF** (Partitura, Cifra escaneada) | `content.file_url` → `ensureFile` (`StageScreen.tsx:356-357`, `:425-432`) | **sim** — o `file_url` congela (A4.4) |
| **o estado do arquivo** (baixado, ausente, baixando, erro) | o disco (`hasFile`, o efeito do arquivo) | não — é disco, não texto |
| **a estrela** (só V) | `content.is_favorite` (`VisualizacaoScreen.tsx:349`) — chega pela raiz, pelo `aoGravar` do favoritar (`App.tsx:169-173`) | **não**: lida **viva**, de propósito — o favoritar feito em V tem de aparecer (N4-R7) |
| **o ponto de sem rede** | `online` | não |
| **o zoom, o tema, a rolagem, a âncora** | estado da tela | não (já não dependem do sync) |

**A estrela**: com tudo congelado e ela viva, o favoritar em V aparece (a linha devolvida chega pela raiz; V lê a estrela
da linha viva e o resto da foto). Um favoritar feito **no site** com V aberta também aparece — não é texto, e a SY-D3 é
sobre texto. O palco não tem estrela `[lido: nenhum is_favorite no StageScreen.tsx]`.

**As escritas de setlist do N2 com a tela montada**: **não acontecem** com o palco montado. Toda escrita é de S1 ou de S2 de
edição; a S2 aberta pelo palco não edita (T2-R19, `navigation.tsx:194-209`); o palco fica sempre **por cima** do índice, e
voltar a ele o desempilha (errata E6, `LOGS-OCTAVIA.md:97-102`). A foto da setlist não engole escrita nenhuma: quando o músico
volta à S2 para editar, o palco já saiu. **V não escreve setlist.** A única escrita com V montada é o favoritar — por isso a
estrela fica viva.

**A4.2 — o que é "abertura"** `[lido]`:

- **é**: **trocar de posição** — o efeito de troca (`StageScreen.tsx:375-389`, deps `posicao`, `n`, `setlist`,
  `chavePlaceholder`) e a chave da âncora (`chaveDoCorpo = posicao|content.id`, `:579`); **sair e voltar** — uma instância
  nova do palco ou de V (`navigation.push`); **o salto pelo índice** — instância nova (E6);
- **não é**: **girar** (o `useWindowDimensions` re-renderiza a mesma instância, `:243`; a âncora reancora o mesmo corpo,
  `Leitor.tsx:366-387`); **o zoom** (estado, `:273`); **recolher as notas** (preferência); **o segundo plano e a volta** (o
  native-stack não desmonta a tela); **a busca empilhada e o voltar** (a mesma instância reganha foco — `stage restore`, E6).

Com a foto, o efeito de troca passa a ver a setlist **da foto** (estável), e só a mudança de posição o dispara.

**A4.3 — a setlist e a música apagadas com o palco aberto** (pergunta Q7; div. 1259). **Hoje** `[lido]`:

- **a setlist apagada**: o `acharSetlist` devolve `undefined` e o `navigation.tsx:248-251` **troca o palco** por
  *"SETLIST · não está no cache"* — no meio da música, sem rolagem, sem barra;
- **a música apagada** (o servidor apaga a linha da setlist junto `[hipótese: ON DELETE CASCADE de setlist_songs]`): sem
  foto, a setlist nova já não tem a posição; com a setlist da foto e o `contentById` vivo, a posição aponta um `content`
  ausente → *"conteúdo não baixado · Esta música ainda não foi sincronizada neste aparelho"* (`StageScreen.tsx:172-176`) —
  frase falsa nesse caso.

**Proposta**: (1) a **setlist da foto** segura o palco até ele sair — sem placeholder; (2) **o conteúdo**: a música já aberta
nesta sessão volta com a **última versão vista** quando sumir do `contentById` (o precedente é o `ultimo` de V,
`VisualizacaoScreen.tsx:263-266`); a posição **nunca aberta** cuja música sumiu mostra o placeholder de hoje; (3) ao sair do
palco, S1 já não mostra a setlist apagada — **sem aviso** (a SY-D8; o aviso *"sumiu"* do T2-R10 é da escrita que volta 404,
não do sync). **Nenhum pixel novo.** A frase do placeholder para a música apagada nunca aberta continua a de hoje — trocá-la
seria frase nova (pergunta à parte, Q7 (c)).

**A4.4 — o arquivo (PDF)** (pergunta Q8) `[lido]`: **o download nunca troca o arquivo de uma URL**. Todo upload é um objeto
novo — `${timestamp}-${nome}` com `upsert: false` (`app/api/storage/upload/route.ts:93-103`); o arquivo do aparelho é
chaveado pela URL (`files.ts`, `ensureFile`, `:236-260`); e o `ensureFile` de uma URL que já está no disco não baixa. Uma
partitura nova no site é um `file_url` novo: hoje, com a música aberta, o `urlArquivo` muda e o efeito do arquivo
(`StageScreen.tsx:425-432`) **recarrega o PDF** na tela; com a foto, o `file_url` fica o da abertura e o PDF não muda. **O
arquivo velho continua no disco**: o LRU só despeja acima do teto de 200 MB, e o repertório é de 265.002 B
(`prefetch.ts:320-331`) — o arquivo da foto deixa de ser protegido depois do sync (`urlsGarantidas`, `prefetch.ts:66-71`,
lê o `contentById` novo), mas só sairia com o disco acima do teto `[lido; o caso real não se mede]`. **Nada a fazer** além de
congelar o `file_url`.

**A4.5 — a forma de implementação e o custo** `[hipótese]`:

- **O conteúdo, por abertura**: no palco e em V, uma foto da linha do `content` tirada na abertura (chaveada por
  `posicao|content_id` no palco e pelo `contentId` em V) — um `useRef`/`useState` por tela, como o §A6.2 estimava. A
  estrela de V lê a linha **viva**.
- **A setlist, pela sessão**: depende da Q6 (div. 1260). **(a) por instância** — um `useRef` no palco; custo baixo; **mas**
  o salto pelo índice cria instância nova e tira outra foto, e o índice, o fim (`navigation.tsx:284`) e a busca na setlist
  (`:338-341`) leem a setlist viva — o índice pode mostrar 9 músicas com o palco dizendo *"3 DE 8"*. **(b) pela sessão do
  palco**, acima da instância: a foto mora no `navigation.tsx` (ou num módulo que ele lê), tirada quando o palco abre de
  fora (de S2 ou de S1 pelo índice sem `posicaoAtual`) e solta quando a navegação volta a S1/S2; o índice do palco, o fim e a
  busca na setlist leem a mesma foto. **É o que a SY-D7 escreve.** Custo: o estado sobe um nível, e **a ligação no
  `navigation.tsx` só se prova no aparelho** — a `Navigation` real não roda no duplo (`APARATO.md:478-481`, div. 334).
- **O que o `native-tela` prova** (o gate (iii)): monta o palco e V com props, liga a rolagem (o `requestAnimationFrame`
  existe no jsdom: o Vitest liga o `pretendToBeVisual` por padrão `[lido: vitest 4.0.16, chunks/index.BspFP3mn.js:434]`),
  re-renderiza com um `contentById` e uma setlist novos — que é o que o sync faz à tela — e mede: o `textContent` do nó
  `corpo` igual; nenhuma rolagem para `y: 0` depois da troca (o duplo registra cada `scrollTo`, `__rolagens()`); o rótulo da
  rolagem segue *"ligada"*; com a posição trocada, o corpo novo. **Não prova**: geometria, a `Navigation` real (a ligação da
  (b)), o tempo do quadro.

*(Nota da SY-PR3 — ponteiro: a foto está feita na PR-3 — a da sessão em `apps/native/src/foto-do-palco.ts`, ligada pelo
`navigation.tsx`; a do conteúdo, por abertura, no `StageScreen.tsx` e no `VisualizacaoScreen.tsx`, com a estrela viva — e
provada no aparelho (A-SY-17). Duas coisas que a A4.1 não decidia ficaram como pergunta: o **título vivo** no índice e na busca
do palco (Q2) e **o arquivo novo que baixa com a música aberta** (a tela não muda; Q3, div. 1287). `SY-PR3-anexos/README.md`
§2, §3, §6, §7.)*

### A5 — o voo único (SY-D9)

**As formas possíveis** (pergunta Q9):

| forma | o que é | prós | contras |
|---|---|---|---|
| **(1) trava no `rodarSync`** | um `emVoo` e um `deNovo` no `App.tsx` | uma dúzia de linhas | o `App.tsx` não é montado por teste nenhum (`a2-a4-leituras.txt`: 0 imports) — o gate (ii) não teria o que testar |
| **(2) a decisão no core, o executor no app** — **recomendada** | uma máquina pura no `packages/core` (`ocioso → em voo → em voo com de novo`; `pedir()`/`terminou()` → `rodar`/`marcar`/`nada`), e o executor num módulo do app (o `rodarSync` extraído do `App.tsx`) | testável no core e no projeto `native` com o mock; é o molde do projeto (*"quem decide é o core"*, `escrita.ts:4-7`, `favoritar.ts:4-6`) | a extração do `rodarSync` na PR-1 (G1a: exceção declarada) |
| **(3) promessa compartilhada** | o gatilho que chega durante um sync recebe a promessa do que corre | o menor código | **não cumpre a SY-D9**: o gatilho que chegou depois da leitura recebe a foto velha — e não há *"de novo"* |

**A corrida com as escritas** `[lido]`:

- **A releitura de uma escrita de setlist** (`escrita.ts:296-337`): `GET /api/setlists` com a geração de emissão
  (`:302`), descarta-se se uma mais nova já gravou (`:315-321`, div. 232), grava **só** o `setlists.json` (`:330-334`,
  `store.ts:193-197`) e a raiz recebe pelo `aoRelerNaEscrita` (`App.tsx:301-304`).
- **Um sync que começa antes e termina depois** de uma escrita: o `GET` dele leu as setlists **antes** (`sync.ts:67`); a
  escrita grava; a releitura grava a lista nova; o sync termina, reconcilia contra o `anterior` que capturou no início
  (`sync.ts:103`), grava **os dois arquivos** (`store.ts:157-162`) e troca a raiz (`App.tsx:211`) **com as setlists de
  antes da escrita**. **A escrita some da tela e do disco até o próximo sync.** O contador de geração da escrita não vê o
  sync. Hoje só acontece se a escrita cair dentro do sync da abertura; com os gatilhos, dentro de qualquer sync.
- **O favoritar**: a `naoRegredir` cobre a corrida (A6), menos a janela.

**A mesma fila as cobre?** Pode, e custa: pôr as releituras na fila do sync faz uma escrita esperar o sync em curso para
reler — até o prazo inteiro de um sync (e o sync não tem prazo, div. 1258). **Recomendo outra coisa para as setlists**:
**a regra da div. 232 estendida ao sync** — o `GET /api/setlists` do sync tira um número da **mesma** geração das releituras;
na aplicação, se uma releitura mais nova já gravou, o sync **aplica o content e não as setlists** (não grava o
`setlists.json`). O inverso já funciona: a releitura emitida antes do `GET` do sync é descartada pelo `minha <
ultimaAplicada`. **Custo**: a geração sai do `escrita.ts` para um ponto que os dois leem (G1a: o `escrita.ts` e o
`sync.ts`); e o sync que descarta as setlists **não** emite a `cache write kind=setlists` — a assinatura do descarte é a
mesma da errata N2-PR2 (`LOGS-OCTAVIA.md:990-1004`), sem linha nova. **Cuidado de implementação**: o `aoRelerNaEscrita` não
atualiza o `dadosRef` à mão (`App.tsx:301-304`), e o executor que aplicar as setlists *"de agora"* não pode lê-las do
`dadosRef` defasado.

**O prazo** (div. 1258): o voo único transforma o sync sem prazo (`api.ts:157-162`) num **trinco**. Um `GET` pendurado — a
rede do palco "conectada" e muda — deixa o voo ocupado para sempre, e todo gatilho seguinte só marca *"de novo"*, que nunca
roda. Pergunta Q3.

*(Nota da SY-PR2 — ponteiro, sem reescrever o texto acima: o voo único, a geração compartilhada e o prazo estão feitos
na PR-2 — a máquina em `packages/core/src/voo.ts`, o executor em `apps/native/src/sincronizador.ts`, a geração em
`apps/native/src/geracao-das-setlists.ts` (o sync que perde aplica o conteúdo pela função do `setDados`, não pelo
`dadosRef`), o prazo nas duas leituras do `sync.ts`. `SY-PR2-anexos/README.md` §1–§5.)*

### A6 — a janela da `naoRegredir` (SY-D10)

**A6.1 — a janela, com as linhas de hoje** `[lido]`:

1. o sync lê as confirmadas e aplica a `naoRegredir` (`sync.ts:107`), grava o disco (`:115`, os dois arquivos) e devolve
   (`:124`) — **sem `await` entre `:107` e `:124`**: esse trecho é atômico;
2. o `rodarSync` retoma **numa microtarefa depois** (`App.tsx:199`, o `await sincronizar`) e só então troca a raiz
   (`:211-217`) e o `dadosRef` (`:222-228`);
3. se a continuação do favoritar (`apps/native/src/favoritar.ts:168-181`) roda **nessa fronteira** — depois do `:107`, antes
   do `:211` —, ela grava `confirmadas` tarde demais para o sync, lê o `dadosRef` **ainda de antes do sync** (`:171`), grava
   no disco o conteúdo de antes do sync com a estrela (`:179`) e avisa a raiz (`:180`); o `rodarSync` retoma e troca a raiz
   **pelo conteúdo do sync, sem a estrela**, com um `setDados` que **substitui** (não é função do estado atual).
   **Resultado**: memória sem a estrela; disco com a estrela e com o conteúdo de antes do sync. Divergem até o próximo sync.

**Quando a fronteira se abre** `[hipótese]`: as duas continuações têm de estar na mesma rodada de microtarefas — no RN, as
respostas de rede chegam do lado nativo, e duas chegando no mesmo lote podem intercalar as cadeias delas. Não foi medido, e
não se mede no aparelho de forma reproduzível.

**A6.2 — o controle negativo que a reproduz** (o gate (iv); div. 1262):

- **Por que o CN de hoje não a vê**: `apps/native/test/favoritar-sync.test.ts` testa o `sincronizar()` — o trecho atômico;
  a janela está no `rodarSync`, e **nenhum teste monta o `App.tsx`** (`a2-a4-leituras.txt`). O CN da N4-D91 tem escopo
  menor do que o nome da linha da regra (*"o sync não regride a estrela"*) sugere.
- **Onde**: `apps/native/test/sy-nao-regredir.test.ts`, projeto `native` (Node), com o `aceite.py` como em
  `favoritar-sync.test.ts`. **Pré-requisito**: o `rodarSync` extraído do `App.tsx` para um módulo, na PR-1, sem mudar o
  comportamento (A8).
- **O duplo**: o `fetch` do teste segura a resposta do `PUT` (como o de hoje segura a do `GET`); o `sincronizar` é
  embrulhado (`vi.mock` que delega ao de verdade) para, **depois de ele devolver e antes de o executor aplicar**, soltar o
  `PUT` e esperar o favoritar terminar — a fronteira, posta em ordem fixa. **Mede**: o conteúdo que o executor entrega à
  raiz e o `content.json` do disco, os dois com `is_favorite=true`.
- **Contra o código de hoje (a extração literal)**: reprova — memória sem a estrela. **Depois do conserto**: passa, e o
  mesmo embrulho já não acha fronteira (a aplicação passou a acontecer dentro dele).

**A6.3 — o conserto é só de ordem dentro do app? Sim** (pergunta Q10). **A aplicação na raiz entra no mesmo bloco síncrono
do sync**: ler as confirmadas, `naoRegredir`, gravar o disco **e** trocar o `dadosRef` e chamar o `setDados` — sem `await`
no meio (por exemplo, o `sincronizar` recebendo um `aoAplicar` chamado logo depois do `save`, `sync.ts:115`). Assim só há
duas ordens possíveis: o favoritar antes (a confirmada está no mapa → a `naoRegredir` a mantém) ou depois (ele lê o
`dadosRef` já com o sync e acrescenta a estrela). As duas dão memória e disco iguais. **Não toca no `updated_at`, na
`naoRegredir` nem no `reconcile`**; a ordem das linhas de log (`cache write` × 2, depois `sync ok`) não muda. **Fecha** — a
SY-D10 manda fechar.

*(Nota da SY-PR2 — ponteiro: fechada na PR-2 pelo gancho `aoAplicar` do `sincronizar` (`apps/native/src/sync.ts`), chamado
logo antes do `return` do sync ok, sem `await` desde a leitura das confirmadas; o `iv:janela` passa e o
`iv:controle-antes` segue passando; as linhas, as mesmas na mesma ordem (`SY-PR2-anexos/ordem-das-linhas.txt`). O §A6.4
segue como o texto que o D cita.)*

**A6.4 — o que o D tem de mudar junto, quando mexer no `updated_at` do favoritar** (para o D citar; `QL-ENCERRAMENTO.md`
§8.4 item 1; `D0-ENCERRAMENTO.md` §8.2 item 3):

1. **A `naoRegredir`** (`packages/core/src/favoritar.ts:176-210`) decide por `updated_at` estritamente maior (`:205`). Se o
   `PUT` do favoritar deixar de gravar `updated_at` (`app/api/content/route.ts`, o bump do handler, T1-R10), a linha
   confirmada **empata** com a do sync e a proteção vira nada. **O critério tem de mudar junto**: por exemplo, a confirmada
   vale para o campo `is_favorite` enquanto o sync tiver sido **emitido antes** da resposta do `PUT` (a ordem de emissão, a
   mesma família da div. 232), em vez de comparar `updated_at`. O SY não decide: deixa escrito.
2. **O critério do `reconcile`** (`packages/core/src/sync.ts:127-134`): ele devolve o conjunto **anterior** quando nenhum
   `updated_at` mudou. Um favoritar feito **no site** sem bump **não chegaria ao tablet** até outra mudança na biblioteca.
   **O critério tem de ver o `is_favorite`** (a comparação passa a ser `updated_at` **ou** `is_favorite`), ou o `invalidated`
   das linhas `cache write` deixa de contar o que mudou (o caso 21 de novo, pelo outro lado).
3. **O limite do T1-R10** (`PRD-TELA-1.md:138`, *"só um PUT pela API invalida o item"*): com o favoritar sem bump, o PUT pela
   API deixa de invalidar o item — **o texto do T1-R10 precisa de errata** (o favoritar vira a exceção declarada) e o aceite
   A7 (`PRD-TELA-1.md:294`) ganha o caso *"favoritar no site → `invalidated=1`"*.
4. **O que o SY deixa pronto para isso**: o voo único e a aplicação síncrona (A6.3) **não dependem** do `updated_at` — o D
   muda os três itens acima sem reabrir o SY. **E o gate (iv) do SY** (a estrela fica no meio do sync) é o controle que o D
   roda com o critério novo.

### A7 — a regra 38

**O texto de hoje, verbatim** `[lido: docs/native/LOGS-OCTAVIA.md:710-721]`:

> **38. O release sincroniza ao abrir com rede.** *(Divs. 1000, N4 brief; 1136, encerramento do N4; N4-D56; N4-D115.)* O
> release não tem Metro nem mock: aberto com rede, ele faz o sync de leitura contra prod na primeira abertura — `GET
> /api/setlists` e `GET /api/content` —, antes de qualquer toque. Por isso: **(a)** prova de release que não pode fazer
> requisição se faz **em avião** (regra 11: ler, declarar, provar pelo `ping`, restaurar); **(b)** prompt de aceite de
> release que tenha um passo *"com rede"* e um *"sem requisição"* põe o avião **antes** da primeira abertura com o app novo,
> ou declara que a primeira abertura **é** o sync autorizado; **(c)** a contabilidade de prod de toda sessão com release
> conta esse sync, mesmo quando ninguém tocou em nada; **(d)** **observado, não garantido**: nos dois releases medidos, a
> volta da rede com o app aberto **não** disparou sync — o `31d6b3a` (`N4-RELEASE-anexos/README.md` §4: `net online`, e a
> contagem de `api` seguiu em 2) e o `cf58f7f` (`N4-ENCERRAMENTO-anexos/README.md` §5: `net online` às 17:31:00, 0 `api`
> desde o `logcat -c`). É um fato desses dois builds, não uma propriedade do app: **se remede sempre que o código de sync
> mudar**, e até lá a prova com rede depois do avião pode contar com ele, declarando-o. Se é o comportamento desejado ou uma
> lacuna é a div. 1143 (pergunta de produto, sem resposta).

| item | com o SY |
|---|---|
| **(a)** | **vale**, e **ganha uma condição**: em avião **e** sem desligar o avião com o app aberto; para voltar à rede numa prova sem requisição, `am force-stop` antes |
| **(b)** | **vale**, e **ganha dois casos**: cada desligar do avião com o app aberto e cada volta do segundo plano depois de 30 s com rede **são** syncs, declarados no prompt como autorizados ou evitados |
| **(c)** | **se reescreve**: conta **todo** sync — a abertura, a volta da rede, a volta do segundo plano, o *"de novo"* —, 2 `GET` cada até 100 músicas, mais os downloads do plano, à parte |
| **(d)** | **deixa de valer** como está (o fato era de builds sem os gatilhos) e **se remede** no release do SY (SY-D16): o fato novo, com a contagem. A div. 1143 está respondida (QL-D5, o T1-R13 passo 4) |

*(Nota do aval — **SY-D27**: o texto abaixo e a linha do `APARATO.md` estão aprovados **como rascunho**; o texto final volta
para aval no encerramento, com os números do release, e só então entra no `LOGS-OCTAVIA.md`. A frase sobre o destravar do
Marcel ser um sync é `[hipótese]` até a medida da SY-D17 (2).)*

**O texto novo proposto** (Q11) — **entra no `LOGS-OCTAVIA.md` só no encerramento, com o aval e com os números do release**;
os colchetes são o que o release preenche:

> **38. O release sincroniza ao abrir com rede e nos dois gatilhos do T1-R13 passo 4.** *(Divs. 1000, 1136, 1143; N4-D56;
> N4-D115; QL-D5; SY-D4.)* Sem Metro nem mock, o release faz o sync de leitura contra prod — `GET /api/setlists` e `GET
> /api/content`, 2 até 100 músicas — **na primeira abertura com rede**, **quando a rede volta com o app aberto** e **na volta
> do segundo plano depois de 30 s** (fora do intervalo de 30 s desde o fim do último sync). Por isso: **(a)** prova de release
> que não pode fazer requisição se faz **em avião** (regra 11) **e não desliga o avião com o app aberto nem volta do
> segundo plano com rede** — para voltar à rede, `am force-stop` antes; **(b)** prompt de aceite de release com um passo
> *"com rede"* e um *"sem requisição"* põe o avião antes da primeira abertura, ou declara a primeira abertura como o sync
> autorizado — **e declara cada desligar do avião e cada volta do segundo plano como sync autorizado ou evitado**; **(c)** a
> contabilidade de prod de toda sessão com release conta **todo** sync (a abertura, a rede, o segundo plano, o *"de novo"*
> do voo único), com os `GET` e os downloads à parte, mesmo quando ninguém tocou em nada; **(d)** **medido no release do
> SY** [`<sha>`]: desligar o avião com o app aberto → [1] sync ([2] `GET`); segundo plano por [> 30 s] → [1]; por [< 30 s]
> → [0] (`SY-ENCERRAMENTO-anexos/…`). **Se remede sempre que o código de sync ou dos gatilhos mudar.**

**O que muda no `APARATO.md`** (proposta, no encerramento): na **"Estado do aparelho"**, no parágrafo do **Avião**
(`APARATO.md:183-186`), uma linha: *"Desde o SY, com a sessão dentro e o app aberto, **desligar o avião é um sync** (2 `GET`)
se o último terminou há mais de 30 s, e **voltar do segundo plano depois de 30 s com rede** é outro. Numa prova que não pode
fazer requisição: `am force-stop rocks.octavia.app` antes de desligar o avião; a contagem de `api` desde o `logcat -c` se
declara."* E nos parágrafos do release de repouso do Tab (`:72-95`), a nota de que **o Tab repousando com o release e o
Wi-Fi ligado sincroniza a cada volta do segundo plano** — o destravar do Marcel com o app na frente passa a ser um sync.

### A8 — o inventário do que o bloco toca

**Os arquivos prováveis, por PR** `[hipótese]`:

| PR | código | testes e duplos |
|---|---|---|
| **PR-1** gates | **novo** `apps/native/src/sincronizador.ts` — o `rodarSync` extraído do `App.tsx:197-243` **sem mudar comportamento** (recebe da raiz o ler/aplicar/`setSync`); **novo** `apps/native/src/gatilhos.ts` — o contrato, **inerte** (hoje nenhum gatilho dispara); `App.tsx` passa a chamá-los | `apps/native/test/sy-gatilhos.test.ts`, `sy-voo.test.ts`, `sy-nao-regredir.test.ts`, `sy-requisicoes.test.ts` (projeto `native`); `sy-foto.test.tsx` (`native-tela`); o `AppState` no `fake-react-native.tsx`; **novo** `apps/native/test/fake-expo-network.ts` (o ouvinte que o teste aciona); a lista `sy-reprovados.txt` (o molde do `ql-quebra-reprovados.txt`, `tests/gates/ql-quebra.test.ts:17-24`); o sensor de quadros no anexo (A3) |
| **PR-2** voo único e `naoRegredir` | `sincronizador.ts` (o voo, a aplicação síncrona, a sessão conferida); `sync.ts` (o `aoAplicar`; a geração das setlists; o prazo, se Q3 (a)); `escrita.ts` (a geração compartilhada); `api.ts` (se Q3 (a)); **novo** `packages/core/src/voo.ts` (a máquina pura) | esvazia (ii) e (iv) e o caso das escritas da lista |
| **PR-3** a foto | `StageScreen.tsx`, `VisualizacaoScreen.tsx`, `navigation.tsx` (se Q6 (b)); talvez um gancho `useFoto…` no `Leitor.tsx` | esvazia (iii) |
| **PR-4** os gatilhos | `gatilhos.ts` (de verdade: `AppState`, a transição `false → true`, o relógio, o intervalo); `net.ts` (expor a transição; o cabeçalho, `:4-5`); `App.tsx` (liga) | esvazia (i) e (v) |

**Os gates que veem a mudança** `[lido: QL-ENCERRAMENTO.md §2 — testIDs 124, log( 70]`:

| gate | vê? | o quê |
|---|---|---|
| **G1a** (diff vazio fora das exceções; arquivo novo reprova) | **sim, em toda PR** | cada arquivo da tabela acima é exceção declarada no bloco ```` ```gates ```` da PR que o toca; os novos também (`g1.sh:24-35`) |
| **G1b** (asserção do core só se acrescenta) | **só se** uma asserção existente mudar | não se prevê: os testes novos são adição; mudar um teste do sync existente é par `g1b-velha/nova/razao` |
| **G2** (testIDs) | **não** — nenhum nó novo (124 = 124) | a foto e os gatilhos não desenham nada |
| **G3** (linhas `log(`) | **sim, na PR-4**: 70 → **71** | uma linha nova, `sync trigger …` (Q12). A extração da PR-1 **não move** linha de log (o `rodarSync` não tem `log(`) |
| **G-inv**, **G-N3**, **G-par**, o gate da quebra | **não** | leem dumps e fixtures de leitura; o SY não muda pixel nem o contrato de leitura. **Proposta**: a PR-3 roda o G-inv (B5 e B3) nos dois aparelhos como **prova de que a foto não muda pixel**, sem errata |
| `gate:a20`, `gate:icones` | **não** | nenhuma frase, nenhum ícone |

**Os testes de sync que já existem** `[lido]`: `packages/core/src/sync.test.ts` (o `planSync`, o `reconcile`, o diff),
`apps/native/test/sync-t1r10.test.ts` (o contador do T1-R10, com o mock), `favoritar-sync.test.ts` (a N4-D91, só o
`sincronizar`), `escrita.test.ts` (a geração da div. 232), `prazo-de-rede.test.ts` (o prazo das escritas e releituras),
`arquivo-sem-rede.test.ts`, `prefetch-fila.test.ts`, `garantia.test.ts`. **Nenhum** monta o `App.tsx`.

**O duplo do `native-tela`** `[lido]`: tem o `ScrollView` que registra as rolagens (`fake-react-native.tsx:151-211`), as
colunas (`:392-403`), a janela (`:447-451`), o `requestAnimationFrame` (do jsdom). **Não tem**: o `AppState` (`a1-greps.txt`:
exit 1 em `apps/native`), um ouvinte de rede acionável (cada teste faz `vi.mock('expo-network', …)` com um ouvinte inerte,
`a2-a4-leituras.txt`), e relógio próprio (o `vi.useFakeTimers` já é usado em 10 lugares). **A PR-1 dá**: o `AppState` com
`__appState('background' | 'active')`; o `fake-expo-network.ts` com `__rede(alcancavel)`; e o relógio pelo `vi.setSystemTime`.

**O `paths` do `native.yml`** `[lido: native.yml:39-54]`: `apps/native/**` cobre todo arquivo do bloco **menos** o
`packages/core/src/voo.ts` da PR-2 — um push que toque só o core não constrói o APK (a herança do W5, §8.6.2 do QL). As PRs
do SY tocam `apps/native` em todas, então o APK roda; a herança não muda.

### A9 — os gates (SY-D13)

Todos entram **reprovados na PR-1** no molde do gate da quebra: a lista do que **deve** reprovar mora num arquivo
(`apps/native/test/sy-reprovados.txt`), reprovação **não declarada** e declaração **órfã** reprovam (regra 14), e cada PR
esvazia a sua parte; com a lista vazia, a lista vazia vira condição (`tests/gates/ql-quebra.test.ts:17-24`). Cada um imprime
o tamanho do que mediu (regra 4).

| gate | onde mora | o que simula | consegue ver | **não** consegue ver | o controle negativo (regra 4) | como entra reprovado |
|---|---|---|---|---|---|---|
| **(i) os gatilhos** | `sy-gatilhos.test.ts`, `native` | o `AppState` (`active`/`background`), o ouvinte de rede (`false → true`, `null → true`), o relógio | a contagem de `sync start` por evento, em cada caso da A2.3 e da A2.4 | o que o Android entrega de fato (portal, troca de rede, segundo plano), o JS suspenso em segundo plano | um `gatilhos.ts` plantado que ignora o intervalo → *"dentro do intervalo → 0"* reprova; outro que conta o `null → true` → *"abertura → 1 sync"* reprova | o `gatilhos.ts` inerte da PR-1: os casos *"→ 1"* reprovam (os *"→ 0"* passam e **não** entram na lista) |
| **(ii) o voo único** | `sy-voo.test.ts`, `native`, com o mock | dois gatilhos sobrepostos, o mock segurando a resposta | o máximo de syncs em curso (`sync start` sem `sync ok/fail`) = 1; exatamente um *"de novo"*; e o caso das escritas (a releitura no meio do sync → as setlists dela ficam) | a corrida no aparelho | o executor extraído, sem voo, reprova (dois em curso); um voo sem *"de novo"* reprova o segundo caso | a extração literal da PR-1 |
| **(iii) a foto** | `sy-foto.test.tsx`, `native-tela` | o sync trocando o `contentById` e a setlist com o palco e V montados (re-render com props novas); a rolagem ligada | o `corpo` igual, nenhuma rolagem a `y: 0`, a rolagem *"ligada"*; a posição trocada → o corpo novo; a estrela viva em V; a setlist/música apagada (A4.3) | geometria, a `Navigation` real (a ligação da Q6 (b)), o custo do quadro | o palco de hoje reprova (o corpo muda); um palco plantado que congela também a estrela reprova o caso de V | o palco e V de hoje |
| **(iv) a janela** | `sy-nao-regredir.test.ts`, `native`, com o mock | o `PUT` solto na fronteira (A6.2) | a estrela na memória (o que o executor entrega) e no disco | a intercalação natural no RN (não reproduzível) | é ele mesmo o CN; o controle dele é rodar o mesmo embrulho com o favoritar **antes** do `:107` → passa hoje (a `naoRegredir` cobre), provando que o embrulho mede a fronteira e não outra coisa | a extração literal |
| **(v) a contagem** | `sy-requisicoes.test.ts`, `native`, com o mock | um evento de cada gatilho | as linhas `api status=… path=/api/setlists` e `path=/api/content` por evento: **2** com ≤ 100 músicas, **3** com 101; os downloads (`file src=download`) **à parte** | o que prod responde | um gatilho plantado que chama duas vezes → 4 | o `gatilhos.ts` inerte: *"→ 2"* reprova (0) |

**O que só o aparelho vê, e em que PR**: o custo com a rolagem (A3: PR-1 o antes, PR-3 o depois, nos dois aparelhos); a
foto na tela de verdade e a ligação do `navigation.tsx` (PR-3, AVD e Tab, dev client + mock, regra 35 no Tab); o G-inv sem
pixel novo (PR-3); os gatilhos no Android — o avião desligado com o app aberto, o segundo plano por mais e por menos de
30 s, o portal e a troca de rede se houver como provocar (PR-4, AVD com o mock pelo `adb reverse`, que não depende do rádio
`[hipótese a confirmar na PR-4]`); e a regra 38 no release (encerramento, Tab).

### A10 — o fatiamento (SY-D14)

**Confirmado, com um ajuste na PR-1**: ela **extrai o `rodarSync`** e dá os contratos inertes, porque os gates (i), (ii) e
(iv) precisam de um módulo para importar e o `App.tsx` não é testável hoje. Ordem: **PR-1 gates → PR-2 o voo único, a
janela e as escritas → PR-3 a foto → PR-4 os gatilhos → encerramento com release**. A `main` nunca fica com gatilho sem
foto e sem voo único: os gatilhos são os últimos.

| PR | o quê | tamanho `[estimado]` | aparelho |
|---|---|---|---|
| **PR-1** | os cinco gates reprovando pela lista; a extração; os duplos; o sensor de quadros e **o "antes" do custo** (A3) | +900 / −60, quase tudo teste | AVD e Tab (o custo, dev client + mock) |
| **PR-2** | o voo único (core + executor), a aplicação síncrona (fecha a janela), a geração das setlists compartilhada, a sessão conferida, o prazo (Q3) | +300 | nenhum, salvo a remedida do S1a se Q3 (a) |
| **PR-3** | a foto do conteúdo (palco, V), a da setlist (Q6), a apagada (Q7); **o "depois" do custo**; o G-inv sem pixel | +350 | AVD e Tab |
| **PR-4** | os gatilhos, o intervalo, a linha `sync trigger`; os gatilhos no Android | +250 | AVD (dev client + mock) |
| **encerramento** | release no Tab, 100 + 100 frias, a regra 38 remedida, o julgamento do Marcel (SY-D16) | docs | Tab e AVD |

**A PR-2 e a PR-3 não se juntam**: a PR-2 é sync e core, sem tela, com os gates no projeto `native`; a PR-3 é tela, com o
`native-tela` e o aceite no aparelho (G-inv, o custo). Juntas, uma PR de ~650 linhas com dois tipos de prova e dois
aparelhos; separadas, a PR-2 entra sem aparelho e a PR-3 mede sobre ela.

**Os aceites candidatos** (não congelados):

| # | o quê | onde |
|---|---|---|
| A-SY-1 | (i) os gatilhos: todos os casos da A2.3 e da A2.4 | PR-4 (lista vazia) |
| A-SY-2 | (ii) o voo único: nunca dois em curso; um *"de novo"* | PR-2 |
| A-SY-3 | as escritas: a releitura no meio do sync fica; o sync que descarta as setlists não grava `setlists.json` | PR-2 |
| A-SY-4 | (iv) a janela: o CN reprova na `main` e passa | PR-2 |
| A-SY-5 | o prazo do sync (se Q3 (a)): sync pendurado → `sync fail … code=network` em ≤ 20 s; o voo se libera | PR-2 |
| A-SY-6 | (iii) a foto no palco: corpo, notas, barra; a rolagem não para; trocar de posição → muda | PR-3 |
| A-SY-7 | (iii) a foto em V, com a estrela viva | PR-3 |
| A-SY-8 | a setlist e a música apagadas com o palco aberto (A4.3) | PR-3 |
| A-SY-9 | o custo com a rolagem: o antes (PR-1) e o depois (PR-3), n ≥ 10 por aparelho; a decisão da SY-D6 | PR-1, PR-3 |
| A-SY-10 | o G-inv B5 e B3 iguais nos dois aparelhos (nenhum pixel) | PR-3 |
| A-SY-11 | (v) a contagem: 2 `GET` por evento (3 com 101); downloads à parte | PR-4 |
| A-SY-12 | os gatilhos no AVD: avião desligado com o app aberto → 1; segundo plano > 30 s → 1, < 30 s → 0; dentro do intervalo → 0 — pelas linhas `sync trigger` e `api` | PR-4 |
| A-SY-13 | o G3 70 → 71, a linha declarada | PR-4 |
| A-SY-14 | o release: 100 + 100 frias, 0 queda nativa (regra 36) | encerramento |
| A-SY-15 | a regra 38 (c)/(d) remedida no Tab, a contagem declarada antes | encerramento |
| A-SY-16 | o julgamento do Marcel (SY-D16) | encerramento |
| A-SY-17 | **a ligação da foto no aparelho** (SY-D22): o palco, o índice do palco, o fim e a busca na setlist com a mesma setlist depois de um sync que a muda; solta ao voltar a S1/S2 | PR-3 |
| A-SY-18 | **a tela apagada ou bloqueada com o app na frente** (SY-D17 (2)): conta como segundo plano no `AppState`? medido, não presumido | PR-4 |
| A-SY-19 | **o evento de rede com o app em segundo plano** (SY-D17 (2)): chega ao JS? medido | PR-4 |
| A-SY-20 | **a prova da extração** (SY-D29): o commit próprio, G3 70 = 70, a suíte com os mesmos números, a declaração do G1 no corpo da PR | PR-1 |

*(Nota do aval — SY-D20, SY-D29: os aceites acima continuam **candidatos**; congelam-se no aval da PR-1, junto com o
critério do custo com o palco aberto.)*

*(Nota do aval da PR-1 — **SY-D37** `[Marcel, 2026-10-11]`: os aceites estão congelados no `SY-PR1-anexos/README.md` §9
(A-SY-1…A-SY-22, com o A-SY-9 reescrito pelas SY-D36 e SY-D38).)*

### A11 — as heranças do SY (`QL-ENCERRAMENTO.md` §8.1)

| # | herança | onde o SY a fecha |
|---|---|---|
| 1 | o T1-R13 passo 4 (a rede volta; o segundo plano > 30 s) | **PR-4**, gate (i) e (v); A-SY-1, A-SY-11, A-SY-12; no release, A-SY-15 |
| 2 | a foto da música aberta | **PR-3**, gate (iii); A-SY-6…A-SY-10; o julgamento, A-SY-16 |
| 3 | o voo único | **PR-2**, gate (ii); A-SY-2, A-SY-3, A-SY-5 |
| 4 | a janela da `naoRegredir` e o que o D muda junto | **PR-2**, gate (iv); A-SY-4; o texto para o D já está aqui (§A6.4) |
| 5 | a regra 38 (c)/(d) remedida no release | **encerramento**, A-SY-15; o texto novo em §A7 |

---

## 3. A contabilidade desta sessão

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** |
| aparelhos | **nenhum** — o AVD não foi ligado (A3 não rodou, com o motivo); o Tab S6 não foi tocado (repousa com o release `ea5e891`) |
| GitHub | `git fetch origin`; ao fim, o push da branch e a abertura da PR |
| banco | nenhum |
| agentes | **0** |
| a árvore | `../octavia-ql-encerramento` (mergeada na #377, `git status` limpo) removida com `git worktree remove`, **sem `--force`**; `../octavia-sy-precheck` criada sobre `origin/main`; `pnpm install --frozen-lockfile` |
| suíte · `tsc` · lint | `Test Files 149 passed \| 3 skipped (152)` · `Tests 1851 passed \| 59 skipped (1910)` — **igual** ao `QL-ENCERRAMENTO.md` §2 (1851 · 59); `tsc` raiz 0 · core 0 · identidade 0 · nativo 0 (de dentro de cada pacote, div. 1187); `✔ No ESLint warnings or errors` `[medido: suite-tsc-lint.txt]` |
| fora de `docs/` | `git diff --stat origin/main -- . ':!docs'` → **vazio** `[medido: no commit, SY-PRECHECK-anexos/diff-fora-de-docs.txt]` |
| **commit 2 (o aval)** | 0 requisições a prod, 0 logins, 0 `.env*`, nenhum aparelho, 0 agentes; GitHub: `gh api …/commits/<sha>/check-runs` do commit 1 (os 7 `success`), `gh pr view 378 --json body` (os blocos, §7) e `gh pr edit 378` (a linha do aval); `git diff --stat fd788a2 -- . ':!docs'` → **vazio** `[medido: SY-PRECHECK-anexos/aval-verificacao.txt]`; suíte, `tsc` e lint **não rodaram de novo** (só docs) |

---

## 4. Perguntas para o aval

**Q1 — os casos de borda dos gatilhos (A2.3).** A tabela da A2.3, linha a linha: (a) **como está**; (b) outra regra para a
rede que volta em segundo plano — disparar já. **Recomendo (a)**: sync em segundo plano é trabalho que o músico não vê, e
a volta do segundo plano decide com a marca. Destaques: **a primeira leitura do `useOnline` não é gatilho**; **logout no
meio descarta o resultado**; a volta **sem rede** não chama o `sincronizar`.
→ **Respondida: SY-D17** (§8).

**Q2 — o intervalo mínimo (A2.4).** (a) **30 s do fim do último sync que saiu à rede, para os dois gatilhos; sem valer
depois de falha de rede (`code=network`), valendo depois de falha com status; o *"de novo"* e o *Tentar de novo* fora
dele**; (b) só para a rede (a SY-D5 literal), valendo também depois da falha de rede. **Recomendo (a)** — com (b), uma
oscilação de Wi-Fi que derruba um sync espera 30 s para tentar de novo, exatamente quando a rede acabou de voltar.
→ **Respondida: SY-D18** (§8).

**Q3 — o prazo do sync (div. 1258).** O voo único transforma o `GET` sem prazo num trinco. (a) **o prazo de 20 s do core
(`PRAZO_DE_REDE_MS`, N2-D35) também nas leituras do sync**, com errata do comentário do `api.ts:157-162` e a remedida do
S1a (o modo `atraso` segura 45 s: o estado *"sincronizando pela primeira vez"* passa a durar 20 s e cair em falha — o
arnês tem de capturá-lo antes); (b) um **prazo só do voo** (o voo se libera em N s; o sync velho continua, e o resultado
dele se descarta pela geração); (c) aceitar o trinco. **Recomendo (a)**: é uma regra só para toda leitura (a releitura já
tem o prazo, N2-D35), e o motivo do comentário era um estado de teste que continua existindo, por menos tempo. **Se o S1a
não couber em 20 s, (b).**
→ **Respondida: SY-D19** (§8).

**Q4 — onde e quando se mede o custo com o palco aberto (A3).** (a) **o "antes" na PR-1 e o "depois da foto" na PR-3, nos
dois aparelhos, com o sensor de quadros pelo inspetor e o `uiautomator events`; a decisão da SY-D6 no aval da PR-3, com o
critério candidato *"nenhum intervalo > 100 ms, n ≥ 10"*; no release, só o `uiautomator events`**; (b) só na PR-4, como a
SY-D6 permite. **Recomendo (a)**: a SY-D6 muda o que a PR-4 implementa, e a medida tem de vir antes dela.
→ **Respondida: SY-D20** (§8).

**Q5 — o que a foto congela (A4.1).** (a) **a tabela como está**: congela o texto (corpo, notas, título, *Detalhes*, a nota da
posição e a barra com a setlist, o `file_url`); fica viva a estrela, o estado do arquivo, o ponto de rede; (b) congelar
também a estrela. **Recomendo (a)**: o favoritar em V tem de aparecer (N4-R7), e a SY-D3 é sobre texto. **Nenhum pixel novo
— a SY-D12 vale.**
→ **Respondida: SY-D21** (§8).

**Q6 — "a sessão do palco" (div. 1260).** (a) **por instância** do palco: simples, provada inteira no `native-tela`; o
salto pelo índice tira outra foto, e o índice, o fim e a busca seguem lendo a setlist viva; (b) **pela sessão**, acima da
instância (no `navigation.tsx`): o palco, o índice do palco, o fim e a busca na setlist leem a mesma foto, tirada ao entrar
no palco e solta ao voltar a S1/S2 — a SY-D7 literal; a ligação só se prova no aparelho. **Recomendo (b)**: com (a), o
índice pode dizer 9 músicas com o palco dizendo *"3 DE 8"*, e o salto pelo índice é exatamente o momento em que a ordem
mudaria no meio do show.
→ **Respondida: SY-D22** (§8).

**Q7 — a setlist ou a música apagadas com o palco aberto (A4.3; div. 1259).** (a) **a setlist da foto segura o palco; a
música já aberta volta com a última versão vista; a posição nunca aberta com a música apagada mostra o placeholder de
hoje; sem aviso ao sair**; (b) sair do palco para S1 com um aviso. **Recomendo (a)** — é o que a SY-D3 e a SY-D8 pedem.
**(c)**, à parte: a frase do placeholder (*"ainda não foi sincronizada"*) é falsa para a música apagada; **recomendo deixar
como está** no SY (frase nova é tela; o caso é raro) e registrar.
→ **Respondida: SY-D23** (§8).

**Q8 — o PDF (A4.4).** (a) **nada além de congelar o `file_url`** (o download nunca troca o arquivo de uma URL; o arquivo
velho fica no disco abaixo do teto); (b) proteger no LRU o arquivo da foto. **Recomendo (a)**: (b) protege um caso que só
existe acima de 200 MB com o repertório em 265 KB.
→ **Respondida: SY-D24** (§8).

**Q9 — a forma do voo único e a corrida com as escritas (A5).** (a) **a máquina no core e o executor no app; o voo único só
para os syncs; para as setlists, a geração de emissão compartilhada entre o sync e as releituras (a regra da div. 232) — o
sync que perdeu aplica o content e não as setlists**; (b) as releituras na fila do sync; (c) a trava no `App.tsx`.
**Recomendo (a)**: (b) faz uma escrita esperar um sync para reler, e (c) não tem gate.
→ **Respondida: SY-D25** (§8).

**Q10 — fechar ou só provar a janela (A6).** (a) **fechar na PR-2**, pela aplicação síncrona (só de ordem; nenhum
`updated_at`); (b) só provar e deixar ao D. **Recomendo (a)** — é o que a SY-D10 manda quando o conserto é só de ordem, e
é. **E o §A6.4 fica como o texto que o D cita.**
→ **Respondida: SY-D26** (§8).

**Q11 — a regra 38 (A7).** (a) **o texto novo como proposto**, entrando no encerramento com os números do release, e a
linha do `APARATO.md`; (b) outra redação. **Recomendo (a).**
→ **Respondida: SY-D27** (§8).

**Q12 — as linhas de log novas (A8).** (a) **uma linha nova**, `sync trigger reason=net|foreground decision=run|queued|skip-interval|skip-short|skip-offline|skip-background`
— uma por gatilho **avaliado**, inclusive os que não disparam (o *"0"* do aceite passa a ser uma linha, não a ausência de
uma: o caso 21 pelo outro lado), sem a primeira leitura do `useOnline`; o `sync start` não muda (G3 70 → 71, adição na
PR-4); (b) errata em par do `sync start` → `sync start reason=open|net|foreground|retry|again`, sem linha para os que não
disparam. **Recomendo (a)**: não muda linha que os aceites já leem, e torna o *"→ 0"* da regra 38 (d) medível.
→ **Respondida: SY-D28** (§8).

**Q13 — o fatiamento (A10).** (a) **o da SY-D14, com a extração do `rodarSync` e os contratos inertes na PR-1; a PR-2 e a
PR-3 separadas**; (b) juntar a PR-2 e a PR-3. **Recomendo (a).**
→ **Respondida: SY-D29** (§8).

**Q14 — os downloads que falham a cada sync (div. 1263).** O plano pede de novo, a cada evento, todo arquivo que falta e
falhou. (a) **só registrar**: o release do SY conta os downloads à parte, e se aparecer um repetido por evento ele vira
herança; (b) uma espera por arquivo falho no SY. **Recomendo (a)** — na conta do Marcel não se conhece arquivo que falhe, e
mudar o plano é outro escopo.
→ **Respondida: SY-D30** (§8).

**Q15 — as duas erratas de ponteiro a mais** *(acrescentada pelo aval, a partir do relatório de entrega do commit 1)*. O prompt pedia a nota no `PLANO-TRANSICAO.md`; o commit 1 pôs também uma no `D0-ENCERRAMENTO.md` §8.2 e outra no `QL-ENCERRAMENTO.md` §8.4, as duas apontando para o §A6.4, e as declarou (§6). Aceitar?
→ **Respondida: SY-D31** (§8).

---

## 5. Divergências desta PR — 1256 a 1263

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros (`QL-PRECHECK.md` §6).

| div. | origem | o quê | destino |
|---|---|---|---|
| **1256** | D | Seis citações de linha do §A6 do `QL-PRECHECK.md` caíram depois do QL (o palco e o `LOGS-OCTAVIA.md` cresceram): `StageScreen.tsx:304-308` → `:316-320`, `:355-368` → `:375-389`, `:303` → `:315`; `net.ts:29-38` → `:28-38`; `core/favoritar.ts:178-210` → `:176-210`; `LOGS-OCTAVIA.md:709-720` → `:710-721`. Nenhuma afirmação deixou de valer | A1 (a tabela) |
| **1257** | D | O `PRD-TELA-1.md:158` diz *"o web usa 30 s"* e cita `hooks/use-setlist-data.ts:172`; hoje é o `:132`, e o web conta **30 s entre dois focos** (`lastFocusTimeRef`, `:128-136`), não a ausência que o passo 4 escreve | A2.4: o nativo usa a ausência |
| **1258** | A | **O sync não tem prazo de rede** (`api.ts:157-162`, `:209-211`; de propósito, pelo S1a). Com o voo único da SY-D9, um `GET` pendurado tranca todo gatilho até o app fechar | A5; Q3 |
| **1259** | A | **Hoje o palco já perde a música quando a setlist some**: um sync que apaga a setlist aberta troca o palco por *"SETLIST · não está no cache"* (`navigation.tsx:248-251`); a música apagada vira *"conteúdo não baixado · … ainda não foi sincronizada"* (`StageScreen.tsx:172-176`), frase falsa nesse caso. Na janela do sync da abertura, hoje; com os gatilhos, em qualquer sync | A4.3; Q7 |
| **1260** | P | A SY-D7 diz *"a setlist vale pela sessão inteira do palco"*; **no código não há sessão**: o salto pelo índice desempilha o palco e cria instância nova (errata E6, `LOGS-OCTAVIA.md:97-102`), e o índice, o fim e a busca na setlist leem a setlist viva da raiz (`navigation.tsx:184`, `:284`, `:338-341`). A foto pela sessão não é um `useRef` | A4.5; Q6 |
| **1261** | D | O comentário do efeito de troca de música diz que as dependências são *"o id da setlist"* (`StageScreen.tsx:338-339`); o código usa o **objeto** `setlist` (`:389`). Como o `reconcile` devolve a lista nova inteira quando qualquer setlist muda (`packages/core/src/sync.ts:134`), uma mudança em **outra** setlist para a rolagem e volta ao topo da aberta | A4.2; o mecanismo da div. 1182 item 2 |
| **1262** | T | O CN da N4-D91 (`favoritar-sync.test.ts`) testa o `sincronizar()`, o trecho atômico; a janela da `naoRegredir` está no `rodarSync` do `App.tsx`, e **nenhum teste monta o `App.tsx`** (0 imports). O instrumento tem escopo menor que o nome da proteção | A6.2; a extração na PR-1 |
| **1263** | A | O plano de downloads exclui **só o que está no disco** (`offline.ts:208-226`): todo arquivo que falta e falha é pedido de novo a cada sync — com os gatilhos, a cada evento. O 404 do `nao-existe.pdf` da fixture é o caso conhecido (`APARATO.md:345-346`) | A2.5; Q14 |

**Contagem** `[medido: a coluna]`: **8 — P 1 · D 3 · A 3 · T 1** (P: 1260 · D: 1256, 1257, 1261 · A: 1258, 1259, 1263 ·
T: 1262). **A próxima livre é a 1264.**

### 5.1 Divergências do aval (commit 2)

**Nenhuma.** O prompt do aval e o repositório não divergiram: a próxima livre conferida pela coluna é a 1264 (nenhum número
≥ 1264 em `docs/`, `[medido: SY-PRECHECK-anexos/aval-verificacao.txt]`); o recuo dos blocos de declaração (§2 item 4 do
prompt) **não atrapalha** a leitura (§7), e por isso não é divergência, pela regra que o próprio prompt deu. **Contagem: 0.
A próxima livre continua a 1264.**

**O que este pre-check não contradisse**: nenhuma das SY-D1…D16 foi contradita pela leitura. A SY-D7 tem um termo sem
correspondente no código (1260) — divergência **e** pergunta (Q6). A SY-D5 ganha uma proposta para a falha (Q2), como ela
pede; a SY-D9 ganha o prazo como condição (Q3).

---

## 6. Erratas de ponteiro — neste commit

No molde das existentes, sem reescrever texto:

| arquivo | onde | a nota |
|---|---|---|
| `docs/ux/PLANO-TRANSICAO.md` | "Sequência", depois da nota do aval do encerramento do QL | a abertura do SY: o pre-check (SY-D1…D16), a fila sem mudança |
| `docs/ux/D0-ENCERRAMENTO.md` | §8.2, depois da errata do aval do pre-check do QL | o que o SY deixa escrito para o item 3 está no `SY-PRECHECK.md` §A6.4 |
| `docs/native/QL-ENCERRAMENTO.md` | §8.4, depois da tabela | o *"a partir do que o SY deixar escrito"* do item 1 aponta para o `SY-PRECHECK.md` §A6.4 |
| `apps/native/src/net.ts:4-5` | o cabeçalho (*"PR posterior"*) | **não se toca** — é código. Registro: a *"PR posterior"* é a **PR-4 do SY**, que reescreve o cabeçalho junto |
| `apps/native/src/api.ts:157-162` | o comentário do *"sem prazo"* | **não se toca** — é código; se a Q3 (a) for aprovada, a PR-2 o reescreve |
| `docs/native/PRD-TELA-1.md:158` | a citação `hooks/use-setlist-data.ts:172` | **não se toca** nesta PR (a div. 1257 só registra); a errata, se o aval quiser, entra com o T1-R13 na PR-4 |
| `CLAUDE.md` | — | **nenhuma**: não cita o sync automático nem a fila `[medido: grep -n "SY\|sincroniz" CLAUDE.md → nada do bloco]` |

## 7. Os blocos de declaração da PR, verbatim

```gates
    # SY pre-check: nenhuma declaração — só docs.
```

```gates-web
    # só docs — SY pre-check: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

*(Nota do aval, commit 2 — o recuo de quatro espaços das linhas de dentro (veio do prompt do pre-check; os blocos do
`QL-ENCERRAMENTO.md` §11 não têm recuo) **não atrapalha a leitura**: os dois extratores, sobre o corpo da #378, devolvem
nenhuma declaração e `exit=0`, e a linha recuada é lida como comentário. **Mas o recuo faz parte da chave**: uma declaração de
verdade recuada (`    g1a: …`) seria recusada como *"chave desconhecida"* — o controle está no anexo. Conferido com
`gh pr view 378 --json body -q .body | sh apps/native/scripts/gates-decl.sh` e `… | sh scripts/gates-web/gates-web-decl.sh`
`[medido: SY-PRECHECK-anexos/aval-blocos-decl.txt]`. Os blocos ficam como estão; as PRs de código do SY os escrevem sem
recuo.)*

---

## 8. O aval do pre-check — SY-D17…SY-D31 `[Marcel, 2026-10-10]`

As quinze perguntas do §4, na ordem; o texto da decisão é este (o "→ Respondida" de cada pergunta aponta para cá). A Q15
nasceu do relatório de entrega do commit 1 (as duas erratas de ponteiro a mais) e entrou no §4 pelo aval. **O commit 2
aplicou o aval.**

| # | decisão (pergunta) |
|---|---|
| **SY-D17** | (Q1) **(a): a tabela da A2.3 como está.** A rede que volta com o app em segundo plano não dispara e deixa a marca; a volta antes de 30 s com a marca conta como "a rede voltou", sujeita ao intervalo; a primeira leitura do `useOnline` (`null → true`) não é gatilho; a volta sem rede não chama o `sincronizar`; o logout no meio descarta o resultado do sync em voo e cancela o "de novo". **Acréscimos:** (1) a marca se apaga quando qualquer sync sai à rede; (2) **a PR-4 mede no aparelho, e não presume**: se apagar ou bloquear a tela com o app na frente conta como segundo plano (`AppState`), e se o evento de rede chega ao JS com o app em segundo plano. Até essa medida, as duas coisas são `[hipótese]` em todo documento do bloco. |
| **SY-D18** | (Q2) **(a):** o intervalo é de **30 s contados do fim do último sync que saiu à rede, para os dois gatilhos**; **não vale** depois de falha de rede (`code=network`); **vale** depois de falha com status; o "de novo" do voo único e o *Tentar de novo* ficam fora dele. **É errata da SY-D5**, que falava só da volta da rede. |
| **SY-D19** | (Q3) **(a): o prazo de 20 s do core (`PRAZO_DE_REDE_MS`, N2-D35) vale também nas leituras do sync**, com a errata do comentário do `api.ts` e a remedida do S1a, na PR-2. **Condição, na PR-1:** dizer `[lido]` se os 20 s cobrem **a resposta inteira** ou só até o primeiro byte, e medir no mock com atraso o tempo do `GET` do conteúdo. **Se o prazo for da resposta inteira e um Wi-Fi lento puder derrubar todo sync, inclusive o primeiro, a PR-1 para e volta com a pergunta**; a reserva é a (b), o prazo só do voo. A SY-D9 ganha o prazo como condição. |
| **SY-D20** | (Q4) **(a):** o "antes" do custo com o palco aberto na PR-1 e o "depois da foto" na PR-3, nos dois aparelhos; a decisão da SY-D6 no aval da PR-3, antes de a PR-4 ligar os gatilhos; no release, só o `uiautomator events`. **Ajuste:** o critério (o candidato é "nenhum intervalo acima de 100 ms, n ≥ 10") **se congela no aval da PR-1**, com os números do "antes" na mão, e não depois de ver o "depois". |
| **SY-D21** | (Q5) **(a): a tabela da A4.1 como está.** A foto congela o texto: o corpo, as notas da música, o título, o artista e o tipo, os *Detalhes* de V, a nota da posição e a barra com a setlist, e o `file_url`. Ficam vivos a estrela de V, o estado do arquivo no disco, o ponto de rede, o recolher das notas e o estado da tela. Nenhum pixel novo: a SY-D12 vale. |
| **SY-D22** | (Q6) **(b): a foto da setlist vale pela sessão do palco, acima da instância.** O palco, o índice do palco, o fim e a busca na setlist leem a mesma foto, tirada ao entrar no palco de fora e solta ao voltar a S1/S2. É a SY-D7 ao pé da letra. **Condição:** a lógica da foto mora num **módulo que o `native-tela` consegue montar**, e o `navigation.tsx` só a liga; o gate (iii) prova a lógica, e **um aceite no aparelho prova a ligação** (entra na lista de aceites candidatos, na PR-3). |
| **SY-D23** | (Q7) **(a):** a setlist da foto segura o palco até ele sair; a música já aberta volta com a última versão vista; a posição nunca aberta cuja música foi apagada mostra o placeholder de hoje; sem aviso ao sair. **(c): a frase do placeholder fica como está no SY.** Ela é falsa para a música apagada e fica registrada como herança, com o destino proposto no encerramento do bloco. |
| **SY-D24** | (Q8) **(a):** nada além de congelar o `file_url`. |
| **SY-D25** | (Q9) **(a):** a máquina do voo único no core e o executor no app; o voo único só para os syncs; para as setlists, a geração de emissão compartilhada entre o sync e as releituras (a regra da div. 232): o sync que perdeu aplica o conteúdo e não as setlists. Sem fila para as escritas. |
| **SY-D26** | (Q10) **(a): a janela da `naoRegredir` se fecha na PR-2**, pela aplicação na raiz dentro do mesmo bloco síncrono do sync, sem tocar no `updated_at`, na `naoRegredir` nem no `reconcile`. **O §A6.4 fica aceito como o texto que o D cita.** |
| **SY-D27** | (Q11) **(a), como rascunho:** o texto novo da regra 38 e a linha do `APARATO.md` ficam aprovados **como proposta**. **O texto final volta para aval no encerramento**, com os números do release, e só então entra no `LOGS-OCTAVIA.md`. A frase do `APARATO.md` sobre o destravar do Marcel ser um sync é `[hipótese]` até a medida da SY-D17 (2), e o texto final a escreve conforme o medido. |
| **SY-D28** | (Q12) **(a):** uma linha de log nova, `sync trigger reason=net|foreground decision=run|queued|skip-interval|skip-short|skip-offline|skip-background`, uma por gatilho avaliado, sem a primeira leitura do `useOnline`; o `sync start` não muda; G3 de 70 para 71, adição declarada na PR-4. |
| **SY-D29** | (Q13) **(a):** o fatiamento da SY-D14, com a extração do `rodarSync` e os contratos inertes na PR-1; a PR-2 e a PR-3 separadas. **Condição da PR-1:** a extração vem num **commit próprio, antes dos gates**, com a prova de que nada mudou: as 70 linhas de log iguais (G3 70 = 70, nenhuma sumiu), a suíte com os mesmos números, e a declaração do G1 no corpo da PR. **Os aceites A-SY-*n* se congelam no aval da PR-1.** |
| **SY-D30** | (Q14) **(a):** os downloads que falham a cada sync só se registram; o release do SY conta os downloads à parte, e um repetido por evento vira herança. |
| **SY-D31** | (Q15) **As duas erratas de ponteiro a mais** (a nota no `D0-ENCERRAMENTO.md` §8.2 e a no `QL-ENCERRAMENTO.md` §8.4, apontando para o §A6.4) **ficam aceitas**: são da mesma classe das pedidas e foram declaradas. |

**O que o commit 2 mudou** (só notas, sem reescrever texto de decisão): a errata do §0 (as mudadas por decisão posterior);
o "→ Respondida" em Q1…Q15 e a Q15 no §4; a nota do rascunho na A7 (SY-D27); os aceites A-SY-17…A-SY-20 na A10 (SY-D17,
SY-D22, SY-D29); a nota dos blocos no §7; a linha deste commit no §3; o §5.1; a nota do `PLANO-TRANSICAO.md`; e a linha do
aval no corpo da #378.

**O pre-check do SY tem aval.** A próxima é a **PR-1 — os gates**, em sessão nova e árvore nova, depois do merge desta PR
pelo Marcel.
