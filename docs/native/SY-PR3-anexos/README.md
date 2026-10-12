# SY-PR3-anexos — a foto (o texto não muda no meio da música)

**PR** (o número no corpo da PR e no §14), branch `sy/pr3-foto`, árvore `../octavia-sy-pr3` sobre `origin/main` =
**`690972f`** (`690972fbc022ee9ff18e11f38e9a3cf3733f62e8`, o merge da #380: o `SY-PR2-anexos/README.md` com o §15
(SY-D42…SY-D48), o §16 e o §17; o `apps/native/test/sy-reprovados.txt` com **27** linhas de checagem) `[medido: git rev-parse
origin/main; gh pr view 380 --json mergeCommit]`. Fonte do bloco: [`SY-PRECHECK.md`](../SY-PRECHECK.md) (as decisões; a A3, a
A4, a A8, a A9), [`SY-PR1-anexos/README.md`](../SY-PR1-anexos/README.md) (o gate (iii); o §6, o "antes" e os instrumentos; os
aceites congelados, §9; o §13) e [`SY-PR2-anexos/README.md`](../SY-PR2-anexos/README.md) (o §15, o §16, o §17).

Esta PR é a **PR-3** da SY-D14/SY-D29: **a foto**. Com o palco aberto (e com V aberta), o sync não muda mais o texto da música
aberta, a setlist vale pela sessão do palco, e o apagado segura a tela até ela sair. **Nenhum gatilho, nenhum pixel, nenhuma
frase, nenhuma linha de log nova**; nada no sync, no voo, no prazo nem no core.

- **Commits**: `13f19df` o CN que faltava · `2a7819d` a foto da sessão · `05d8727` a foto no palco · `664b849` a foto em V ·
  os de anexo (o AVD, o Tab) · o de docs (este README e as erratas de ponteiro). **Os quatro primeiros são de outra sessão**,
  adotados pela decisão do Marcel e reverificados por esta (§1; div. 1284).
- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado, com caminho e linha da
  ponta da `main` (ou desta branch, quando é o código dela); `[hipótese]` = o resto.
- **Texto**: só o do projeto — as fixtures do pre-check do N3, da QL-PR4 e desta PR (regra 10); do Tab, nenhum dado da conta
  do Marcel. O uid que aparece nos anexos do AVD é o da conta de audit.
- **Agentes**: 0.

| arquivo | o quê |
|---|---|
| [`c1…c4-verificacao.txt`](c1-verificacao.txt) | a verificação de cada commit, pela outra sessão, antes do commit (com a mudança no stage) |
| [`reverificacao/`](reverificacao/) | a verificação de cada commit **por esta sessão**, numa árvore limpa em cada sha: o extrator, G1/G2/G3, os quatro `tsc`, o lint, a suíte e os cinco juízes |
| [`c1-cn-sessao-outra-setlist.txt`](c1-cn-sessao-outra-setlist.txt) | o CN do `iii:sessao-outra-setlist` sobre o commit 1 (SY-D45, div. 1283) |
| [`cn-sy-pr3.txt`](cn-sy-pr3.txt) · [`cn-sy-pr1-sobre-pr3.txt`](cn-sy-pr1-sobre-pr3.txt) · [`cn-sy-pr2-sobre-pr3.txt`](cn-sy-pr2-sobre-pr3.txt) | os controles negativos novos, e os roteiros da PR-1 e da PR-2 sobre o código novo |
| [`gates-existentes.txt`](gates-existentes.txt) · [`gates-web.txt`](gates-web.txt) · [`blocos-decl.txt`](blocos-decl.txt) | os gates que já existiam, os do web, os extratores sobre os blocos |
| [`avd/`](avd/) | o AVD: o estado antes e depois, a receita, o bundle, o rádio, o custo (o par, a regra de carga, as análises, a tabela por passo), a foto, a âncora, o G-inv, as quedas, o logcat |
| [`tab/`](tab/) | o Tab S6: idem, sem o S0 |
| [`dumps/`](dumps/) | os dumps da base do G-inv, AVD e Tab (`SHA256SUMS.txt`) |
| [`instrumentos/`](instrumentos/) | `verifica.sh`, `cn-sy-pr3.sh` + `plantar.py` + `plantas/`, `bundle.sh`, `custo/` (o par, a análise, a carga, a tabela por passo, a rajada), `foto/` (o roteiro e as fixtures da foto), `arnes/` (as cadeias do G-inv) |

---

## 1. Os commits, por ordem

**A origem dos quatro primeiros, declarada** (div. 1284): esta PR foi começada por **outra sessão**, que o Marcel abriu com
o mesmo prompt por engano e parou às ~10:30 de 2026-10-12. Ela criou a árvore e a branch, removeu a `../octavia-sy-pr2`
(limpa, o head `15d78e6` contido na `main`) e fez os commits 1–4 e parte dos anexos. **A decisão do Marcel** (a, nesta
sessão): aproveitar o trabalho, com cada commit conferido por esta sessão contra o prompt e as fontes, e os gates, a suíte e
os controles negativos **rodados de novo por esta sessão**; as medidas de aparelho daquela sessão (o "antes" e o começo do
"depois" no AVD, interrompidos) **descartadas e refeitas**, e o bruto delas **não entra** nos anexos (§9). O código dos
quatro commits não mudou nesta sessão; o que foi revisto e o que se achou está em §3 e §12.

| # | commit | o quê | a lista |
|---|---|---|---|
| 1 | `13f19df` | o controle negativo que faltava ao `iii:sessao-outra-setlist` (SY-D45, div. 1283): o laboratório da foto da sessão com o defeito `serve-outra` e o `cn-sy-pr3.sh`; **só instrumento**, antes de a foto entrar | 27 → **27** |
| 2 | `2a7819d` | a foto da setlist pela sessão: a lógica no `foto-do-palco.ts`, a ligação no `navigation.tsx` | 27 → **20** |
| 3 | `05d8727` | a foto do conteúdo no palco, por abertura | 20 → **14** |
| 4 | `664b849` | a foto do conteúdo em V, com a estrela viva | 14 → **9** |
| 5 | (os de anexo) | o aparelho: o AVD e o Tab | — |
| 6 | (o de docs) | este README, as erratas de ponteiro | — |

`[medido: reverificacao/c1…c4-verificacao.txt]` — esta sessão rodou o `instrumentos/verifica.sh` em cada um dos quatro
commits, numa árvore limpa (`../octavia-sy-pr3-base`, destacada em cada sha), com o bloco ```` ```gates ```` de cada commit:

| commit | G1a | G1b | G2 | G3 | `tsc` raiz · core · identidade · nativo | lint | suíte | os juízes (i · ii · iii · iv · v) |
|---|---|---|---|---|---|---|---|---|
| `13f19df` | ✓ (0 exceções) | ✓ | 124 = 124 | 70 = 70 | 0 · 0 · 0 · 0 | ✔ | 157 · 1914 | 6 · 0 · **18** · 0 · 3 |
| `2a7819d` | ✓ (2) | ✓ | 124 = 124 | 70 = 70 | 0 · 0 · 0 · 0 | ✔ | 157 · 1914 | 6 · 0 · **11** · 0 · 3 |
| `05d8727` | ✓ (3) | ✓ | 124 = 124 | 70 = 70 | 0 · 0 · 0 · 0 | ✔ | 157 · 1914 | 6 · 0 · **5** · 0 · 3 |
| `664b849` | ✓ (4) | ✓ | 124 = 124 | 70 = 70 | 0 · 0 · 0 · 0 | ✔ | 157 · 1914 | 6 · 0 · **0** · 0 · 3 |

(suíte = `Test Files 157 passed | 3 skipped (160)` · `Tests 1914 passed | 59 skipped (1973)`; os juízes dizem *"reprova
exatamente a lista esperada (n) ✓"*.) Os `c1…c4-verificacao.txt` da raiz deste diretório são os da outra sessão, feitos
**antes** de cada commit (com a mudança no stage), e dizem o mesmo.

### 1.1 Os números — a suíte, o G2 e o G3, antes e depois

| | a `main` (`690972f`) | a ponta (`664b849`) | a diferença |
|---|---|---|---|
| suíte | `157 passed \| 3 skipped (160)` · `1914 passed \| 59 skipped (1973)` (`SY-PR2-anexos/README.md` §8) | **igual** | **nenhum teste novo nem tirado**: os gates do SY já existiam desde a PR-1; o que muda é a lista (27 → 9), e cada juiz segue *"reprova exatamente a lista esperada"* — o (iii) com 0. Os 59 pulados, os mesmos |
| G2 — `testID` | 124 | **124** | nenhum nó novo (SY-D12) |
| G3 — linhas `log(` | 70 | **70**, *"nenhuma linha sumiu"* | nenhuma linha acrescentada, tirada ou trocada |

**Os gates que já existiam, sem errata** `[medido: gates-existentes.txt, gates-web.txt]` — sobre os dumps commitados da volta
da QL-PR4 (o resultado tem de ser o do encerramento do QL): G-inv **34 de 34** e **18 de 18**; G-N3 `(e)=0 · (b)=0 ·
nome-acessível=8 · rolagem=6 · quebra=16 ✓`; G-par de V zero diferenças (2); o gate da quebra *"zero reprovações, lista
vazia"*; `icones` 0 acusações; `a20` 0 acusações; os `SHA256SUMS` dos congelados; os do web — G-back, G-palco, G-tok, a
cobertura e o G-faixa **PASSAM**. **Os testes do palco, de V, da âncora, das notas e do favoritar**: verdes na suíte, sem
errata. **O G-inv no aparelho**: §7.

## 2. A lista, 27 → 9, linha a linha `[medido: reverificacao/c1…c4-verificacao.txt; o `git log -p` do `sy-reprovados.txt`]`

| linha | sai em | por quê | o caso, depois |
|---|---|---|---|
| `iii:sessao-indice` | **commit 2** | o índice do palco lê a foto da sessão | 3 músicas, o nome da foto |
| `iii:sessao-fim` | commit 2 | o fim lê a foto | o total da foto |
| `iii:sessao-busca` | commit 2 | a busca do palco lê a foto | idem |
| `iii:setlist-apagada` | commit 2 | a setlist da foto segura o palco | a setlist da foto (3 músicas) |
| `iii:palco-sem-topo` | **commit 2** ⚠ | a setlist da foto é o MESMO objeto depois do sync: o efeito de troca de música (deps `posicao`, `n`, `setlist`) não roda, e nada rola a 0 (div. 1261) | nenhum `scrollTo` a 0 |
| `iii:palco-rolagem-segue` | **commit 2** ⚠ | idem: o efeito não para a rolagem | *ligada* e andando |
| `iii:palco-barra` | **commit 2** ⚠ | a barra lê a setlist da foto | *"1 DE 3"*, o nome de antes |
| `iii:palco-corpo` | commit 3 | o corpo da abertura | o de antes |
| `iii:palco-notas` | commit 3 | as notas da abertura | idem |
| `iii:palco-titulo` | commit 3 | o título da abertura | idem |
| `iii:palco-nota-da-posicao` | commit 3 | a nota é da setlist, mas o caso confere a TELA inteira sem a palavra *"depois"* (`sy-foto.test.tsx:192-194`) — com o commit 2 só, o corpo vivo (*"depois: linha 1…"*) ainda a trazia | a de antes |
| `iii:palco-file-url` | commit 3 | o `file_url` da abertura: o efeito do arquivo não roda | nenhum download do arquivo novo pelo palco |
| `iii:palco-musica-apagada-aberta` | commit 3 | a foto segura a última versão vista | o corpo de antes |
| `iii:v-corpo` · `v-titulo` · `v-detalhes` · `v-notas` · `v-file-url` | commit 4 | a foto de V | os de antes |

⚠ **Div. 1285**: o prompt (§2 itens 2 e 3) manda o commit 2 tirar **quatro** linhas e o commit 3 as **nove** `palco-*`.
Três das `palco-*` (`sem-topo`, `rolagem-segue`, `barra`) passaram já com a foto da sessão: é a mesma setlist que as
segura, e com a foto ela não muda de objeto. **Deixá-las na lista até o commit 3 era impossível** — o juiz as acusaria como
ÓRFÃS (regra 14) e o commit 2 sairia vermelho. O commit 2 tirou 7, o 3 tirou 6; os dois commits dizem isso na mensagem.

**Seguem passando, como o prompt pede**: `palco-trocar-posicao`, `palco-musica-apagada-nunca-aberta` (o placeholder e a
frase de hoje), `sessao-solta`, `sessao-outra-setlist`, `v-estrela-viva` (`[medido: o juiz (iii) em cada commit]`, e cada
um com CN que o faz reprovar, §4).

**A lista no fim**: **9** linhas — (i) 6 · (ii) 0 · (iii) **0** · (iv) 0 · (v) 3. As `i:` e `v:` não se tocaram
(`git diff origin/main -- apps/native/test/sy-reprovados.txt` só tira as 18 `iii:` e troca o comentário da parte (iii)).

## 3. As três leituras obrigatórias

### 3.1 O que mais lê o conteúdo ou a setlist vivos com o palco ou V montados `[lido: a ponta, 664b849]`

O inventário refeito na ponta — cada leitor de `dados.contentById`, `dados.contents` ou `dados.lista` com o palco ou V
montados, e o que esta PR fez com ele:

| quem | o que lê | com a foto | `[lido]` |
|---|---|---|---|
| **o palco** — corpo, notas, título, artista, tipo, `file_url` | a linha do `content` da abertura | **congela** (commit 3) | `StageScreen.tsx:317-331` |
| **o palco** — a barra (*n DE N*, o nome), a nota da posição, o efeito de troca de música | a setlist | **congela com a sessão** (commit 2): o objeto da foto é estável, e o efeito (deps `posicao`, `n`, `setlist`) só roda na troca de posição — a div. 1261 fecha | `navigation.tsx:274`; `StageScreen.tsx:389-403` |
| **o índice do palco** — as posições, a ordem, o nome | a setlist | **congela com a sessão** (o `Index` com `posicaoAtual` lê `daSessao`) | `navigation.tsx:207-208` |
| **o índice do palco** — **o título e o rótulo de cada posição** | `contentById` **vivo** (`resolveSong`, `labelFor`) | **fica vivo** — **pergunta Q2** | `IndexScreen.tsx:283-285` |
| **o fim** — o total, o nome | a setlist | congela com a sessão | `navigation.tsx:310-314` |
| **a busca do palco** — a seção *Nesta setlist* e a posição de cada resultado | a setlist | congela com a sessão (a busca com `posicao` lê `daSessao`) | `navigation.tsx:365-369` |
| **a busca do palco** — os resultados, os títulos, o índice de busca | `contents` **vivo** (`buildIndex(contents)`) | **fica vivo** — Q2 | `SearchScreen.tsx:180-181` |
| **o prefetch sob demanda do palco** | `contentById` **vivo**, roda a cada mudança dele (está nas dependências) | **fica vivo** — Q3 (§3.2) | `StageScreen.tsx:458-461`; `prefetch.ts:249-274` |
| **o plano da biblioteca depois do sync** | o `contentById` do sync | fora da tela: não é da foto — Q3 | `sincronizador.ts:169`; `App.tsx:118-123` |
| **o LRU** (`urlsGarantidas`) | o `contentById` vivo | o arquivo da foto deixa de ser protegido depois do sync — **a A4.4 e a SY-D24 já decidiram** (só acima do teto de 200 MB) | `prefetch.ts:66-71` |
| **V** — o texto, os *Detalhes*, o `file_url` | a linha da abertura | **congela** (commit 4) | `VisualizacaoScreen.tsx:263-273` |
| **V** — a estrela | `atual.is_favorite`, a linha viva | **viva, de propósito** (SY-D21) | idem |
| **V** — a frase do aviso do favoritar | o título da foto | congela com a foto (a frase é a de hoje, com o título que V mostra) | `VisualizacaoScreen.tsx:360-366` |
| **S1 e S2 por baixo da pilha** | a setlist e o conteúdo vivos | **vivos, de propósito**: o músico edita o que está no servidor (A4.1) | `navigation.tsx:175-249` |

**O índice com título vivo — o que acontece** `[lido; visto no aparelho, §6.1, B]`: com o palco aberto na posição 3 e um sync
que renomeia a música 3 no site, **o palco segue com o título da abertura e o índice do palco mostra o título novo** — na
mesma setlist da foto (as mesmas posições, a mesma ordem). As outras posições mostram o título que o músico vai ver ao
abri-las (a abertura tira a foto de agora, SY-D7). A tabela da A4.1 não decide o índice — **pergunta Q2**.

### 3.2 O prefetch do palco (o passo 3 do "antes" da PR-1) `[lido]` `[medido: tab/foto/foto.txt e avd/foto-1a-corrida/foto.txt, o passo J]`

- **O que ele pede e quando**: o efeito do prefetch sob demanda (`StageScreen.tsx:458-461`) tem o `contentById` nas
  dependências, então **roda de novo a cada sync** com o palco aberto; ele lê o mapa **vivo** e pede, nesta ordem, os
  arquivos da posição atual, +1, +2, +3, −1 e o resto (`prefetchOrder`), os que não estão no disco (`prefetch.ts:257-271`).
  Com o `file_url` da música aberta mudado no site, **a posição atual é a primeira do plano**: ele pede o arquivo novo **com
  a música aberta**. E, independente do palco, o plano da biblioteca que segue todo sync ok (N4-R26) pede **todo** arquivo
  que falta, inclusive esse.
- **O que a tela mostra**: o arquivo da abertura. O efeito do arquivo do palco depende do `urlArquivo`, que vem da foto
  (`StageScreen.tsx:370-371`, `:439-446`): ele não roda de novo, e o PDF não muda debaixo do músico. É a SY-D24 (o
  `file_url` congela), e é o que o gate mede (`iii:palco-file-url`: o `ensureFile` do palco não pede o arquivo novo — o
  prefetch está em `vi.mock` no gate, `sy-foto.test.tsx:41`).
- **A premissa do prompt** (*"nenhum download de arquivo novo com a música aberta; o arquivo novo vem na próxima
  abertura"*) **não vale** — div. 1287: o arquivo novo **chega ao disco** com a música aberta (pelos dois prefetches), e
  **aparece na tela** na próxima abertura. Fazer valer pediria (a) o prefetch do palco ler a foto da posição atual e (b) o
  plano da biblioteca excluir o arquivo da música aberta — o (b) mexe no prefetch do sync, fora do escopo (§1 do prompt).
  **Pergunta Q3.**
- **E o custo**: esse efeito é o **passo 3** da tabela da PR-1 (o `prefetch plan … reason=demand` e o render que ele
  provoca). Com a foto ele **continua rodando** a cada sync — o que a tabela por passo do "depois" mostra (§5).

### 3.3 A memória `[lido]`

| foto | o que guarda | quando troca | quando solta | o teto |
|---|---|---|---|---|
| **da sessão** (`foto-do-palco.ts`) | **uma** setlist, por referência (o objeto que a raiz já tinha; nenhuma cópia) | ao entrar no palco de fora (a posição tocada em S2; o resultado da busca aberta de S2) | no foco de S1 e de S2 (o `Index` sem `posicaoAtual`) | **1 setlist**, a da sessão aberta — uma sessão nova troca, nunca soma |
| **do conteúdo, no palco** (`StageScreen.tsx`) | **uma** linha de `content`, por referência, por instância do palco | a cada abertura (a chave `posicao\|content_id`; no avulso, a música) | quando a instância sai | **1 linha por palco montado**; a pilha tem no máximo o palco e um avulso empilhado (T1-R22) — 2 |
| **do conteúdo, em V** (`VisualizacaoScreen.tsx`) | **uma** linha, por referência | outra música na mesma tela (a chave é o id) | quando V sai | 1 linha por V montada |

**Nada cresce sem teto numa noite de palco**: o que a foto segura é o que a tela já mostrava; o que ela impede o GC de
soltar é, no máximo, a versão velha de uma setlist e de duas ou três músicas, até a tela sair. O único mapa que cresce sem
poda no sync segue sendo o das confirmadas do favoritar (A6.3-a do pre-check), que esta PR não toca.

## 4. Os controles negativos (regras 4 e 7)

Todos rodados **por esta sessão**; o `git status --short -- apps/native/src` do fim de cada roteiro: **vazio**.

### 4.1 O que faltava: o `iii:sessao-outra-setlist` (SY-D45, div. 1283) `[medido: reverificacao/c1-cn-sessao-outra-setlist.txt]`

Sobre o **commit 1** (`13f19df` — a foto ainda inerte), o laboratório da foto da sessão da PR-1 copiado sobre o
`foto-do-palco.ts`, com **um** defeito a mais (`instrumentos/plantas/foto-do-palco-lab.ts`):

| CN | a planta · o defeito | o gate (iii) acusou |
|---|---|---|
| **c-1** | o laboratório com `SY_DEFEITO=serve-outra` — a foto de uma setlist serve a **qualquer** setlist | **`iii:sessao-outra-setlist`** — *"outra setlist não leu a viva"*, **reprovação NÃO DECLARADA** (por medida) |
| c-2 | o laboratório sem defeito (o controle do c-1) | o `sessao-outra-setlist` **passa**; as 7 linhas que o laboratório cumpre (a sessão, o topo, a rolagem, a barra) aparecem como **ÓRFÃS** — o esperado |

O c-1 é o caso que **passava sem controle nenhum** desde a PR-1: agora ele tem o CN que o faz reprovar, rodado **antes** de
a foto entrar. A mesma corrida sobre a ponta (`cn-sy-pr3.txt`, c-1) acusa igual; e a da outra sessão, sobre a `main` (`690972f`, antes ainda do commit 1 — `c1-cn-sessao-outra-setlist.txt` na raiz deste diretório), também.

### 4.2 Os novos, sobre a ponta (`664b849`) `[medido: cn-sy-pr3.txt]`

`instrumentos/cn-sy-pr3.sh` + `instrumentos/plantar.py` (cada defeito é **uma** troca de texto com a âncora conferida —
sem a âncora, o script diz *"NÃO PLANTOU"* e para; nenhum saiu assim):

| CN | o defeito plantado | o que acusou (reprovação NÃO DECLARADA) |
|---|---|---|
| c-1 | a foto de uma setlist serve a outra | `iii:sessao-outra-setlist` |
| c-2 | (o laboratório, sem defeito) | nada: *"reprova exatamente a lista esperada (0)"* — o laboratório e o código fazem o mesmo |
| **c-3** | **a foto de V congela também a estrela** | `iii:v-estrela-viva` — *"a estrela antes: Favoritar … · depois: Favoritar …"* |
| **c-4** | **a foto da sessão não solta ao voltar a S1/S2** | `iii:sessao-solta` — *"depois de sair, lê: 3 músicas (a viva: 4)"* |
| **c-5** | **a foto do conteúdo não se renova ao trocar de posição** | `iii:palco-trocar-posicao`, `iii:palco-musica-apagada-nunca-aberta` |
| **c-6** | **a foto por instância, não por sessão** (o `foto-do-palco.ts` inerte da PR-1: o índice vê a setlist viva) | `iii:sessao-indice` (*"4 músicas, renomeada no site"*), `sessao-fim`, `sessao-busca`, `setlist-apagada`, e com eles `palco-sem-topo`, `palco-rolagem-segue`, `palco-nota-da-posicao`, `palco-barra` |
| c-7 | a música aberta, apagada pelo sync, perde a foto | `iii:palco-musica-apagada-aberta` |
| c-8 | o palco lê o conteúdo vivo (sem a foto do conteúdo) | `palco-corpo`, `palco-notas`, `palco-titulo`, `palco-nota-da-posicao`, `palco-file-url`, `palco-musica-apagada-aberta` |
| c-9 | a foto de V sem a chave do id (a 1ª forma do commit 4) | o gate (iii) **não** vê — passa; quem vê são **dois testes existentes** do `visualizacao-tela.test.tsx` (que trocam a música na mesma V): *"o tipo vem com o ícone de 20…"*, *"o ▶ inerte tem a MESMA borda…"* — o que o commit 4 registra |

**O c-9 é escopo do gate, declarado**: o gate (iii) monta V com **uma** música; a troca de música na mesma instância de V só
os testes de V exercem (e acusam). Nenhum dos quatro mínimos do prompt (c-3, c-4, c-5, c-6) passou sem acusar.

### 4.3 Os roteiros da PR-1 e da PR-2, sobre o código novo `[medido: cn-sy-pr1-sobre-pr3.txt, cn-sy-pr2-sobre-pr3.txt]`

- **PR-1** (`SY-PR1-anexos/instrumentos/cn-sy.sh`, sem mudança): todo defeito plantado segue acusado — i-1…i-8 e i-10 (as
  reprovações não declaradas de cada regra), ii-1 (`logout-cancela-de-novo`), ii-2 (`escrita-conteudo-aplica`), **iii-0**
  (a tela que congela TUDO: `palco-trocar-posicao`, `palco-musica-apagada-nunca-aberta`, `v-estrela-viva`), **iii-2** (a
  foto que nunca solta: `sessao-solta`), iv-0 (`janela`), v-1 (os 3, com o dobro de `GET`). **O que mudou na leitura**:
  o **iii-1** (o laboratório da foto da sessão, sem defeito) passa a dar *"reprova exatamente a lista esperada (0) ✓"* —
  na PR-1 ele deixava órfãs as linhas da sessão; agora a parte (iii) está vazia e o laboratório faz o que o código faz. O
  ii-0 e o ii-1 seguem acusando `ii:escrita-setlists-ficam` (o laboratório do voo não tem a geração; a PR-2 já leu assim).
- **PR-2** (`SY-PR2-anexos/instrumentos/cn-sy-pr2.sh`): n-1…n-9 acusam como na PR-2, inclusive o n-2 só pelos testes de
  unidade da máquina (div. 1281, SY-D48).

## 5. O custo do sync com a rolagem andando — antes × depois (SY-D36, SY-D37, SY-D38; A-SY-9)

### 5.1 O aparato e o caminho `[medido: avd/, tab/]`

- **Os instrumentos, as fixtures e as janelas da PR-1**: o sensor de quadros pelo inspetor do Metro
  (`SY-PR1-anexos/instrumentos/sensor-quadros.mjs`), o `uiautomator events`, as fixtures A/B (`fixture-sy.py`: A e B diferem
  só no corpo da "Letra longa da fixture", a 3; as setlists iguais), a janela do SYNC `[t_ok − 5 s, t_ok + 15 s]`, a análise
  da PR-1 (copiada, com o critério da SY-D36 no fim: `instrumentos/custo/custo-analise-pr3.mjs`).
- **O que mudou, e por quê** (div. 1286): na PR-1 o sync era o **da abertura**, segurado 45 s pelo mock `atraso`; desde a
  PR-2 as leituras do sync têm o prazo de 20 s (SY-D19, SY-D32) e esse sync **falha antes de aplicar**. Aqui o mock serve, no
  modo `normal`, a versão que o cache já tem (a abertura sincroniza sem mudança); o palco abre na 3, zoom 26, a rolagem
  ligada; 31 s depois o mock passa a servir a outra versão e o sync se dispara pela **mesma função que o *Tentar de novo*
  chama** (a prop `onTentarNovamente`, achada na árvore do React pelo inspetor — o `pedir-pelo-botao.mjs` da PR-2), que é o
  `rodarSync` que um gatilho da PR-4 chamará. **O PISO** passa a ser `[t_rol + 3 s, t_rol + 23 s]` (a rolagem ligada, nenhum
  sync). `instrumentos/custo/custo-pr3.py`. Pergunta Q5.
- **O "antes" e o "depois"**: o "antes" com o bundle da **base** (`690972f`, a `main` com a PR-2) servido pelo Metro da
  árvore `../octavia-sy-pr3-base`; o "depois" com o da ponta (`664b849`). O bundle conferido antes de cada lado
  (`bundle-antes.txt`, `bundle-depois.txt`): `localhost:8788` 1 · `octavia.rocks` 0 · os símbolos da foto 0 no antes e 3–4 no
  depois. **Os dois lados um logo depois do outro**, o mesmo dev client, o mesmo dia: AVD 15:18–15:48; Tab 18:05–18:33.
- **10 rodadas por lado e por aparelho** (alternando A→B e B→A), **mais 2 de controle sem o `uiautomator events`**; o
  controle (a) — a tarefa plantada de 200 ms — nas 3 primeiras de cada lado.

### 5.2 A carga do host (div. 1276, div. 1288)

O AVD divide a CPU do Mac. **Duas tentativas foram descartadas** antes do par que vale (o bruto **não** entra nos anexos;
só a análise, como rastro, em `avd/descartado/`): a 1ª (10:48–11:20) com o `mediaanalysisd` do macOS e a VM do Docker
Desktop ligados (o PISO saiu com mediana de 199 ms, contra 74 na PR-1); a 2ª (12:08–12:41) com o "antes" limpo e o "depois"
cruzado por um renderer do Chrome a 100–280 % e pelo **Docker que voltou a abrir** às ~12:38. O Marcel fechou o Docker e o
Spotify para o par das 15:18. **Mesmo assim o host não ficou quieto** (o Chrome do Marcel, o `mobileassetd`, o
`softwareupdated`, o `mediaanalysisd`): por isso a **regra de carga foi declarada antes de ler os números**
(`avd/custo/regra-de-carga.txt`, 15:19): uma rodada é **marcada ⚠** quando um processo fora do emulador, do WindowServer e
do app do Claude passou de 80 % de CPU na janela do PISO ou do SYNC; o veredito sai com **todas** e, à parte, **sem as
marcadas** (`instrumentos/custo/carga-e-veredito.py`, o amostrador `instrumentos/custo/amostrar-carga.sh`). **No Tab o JS
roda no tablet**: a carga do Mac não entra no quadro dele (o Metro só serve o bundle, uma vez).

### 5.3 O AVD — o "antes" (`690972f`) `[medido: avd/custo/antes-analise.txt, antes-carga-e-veredito.txt]`

| rodada | SYNC: maior intervalo | > 100 ms | lacuna (`uiautomator`) | PISO: maior intervalo | > 100 ms | lacuna | carga |
|---|---|---|---|---|---|---|---|
| r01 | 643,5 | 7 | 548 | 202,3 | 5 | 291 | limpa |
| r02 | 378,0 | 5 | 381 | 80,3 | 0 | 165 | limpa |
| r03 | 340,7 | 7 | 300 | 145,9 | 2 | 212 | ⚠ `mobileassetd` 98 % |
| r04 | 346,5 | 7 | 400 | 209,1 | 5 | 237 | ⚠ `softwareupdated` 98 % |
| r05 | 574,8 | 6 | 513 | 132,1 | 2 | 142 | limpa |
| r06 | 572,7 | 9 | 486 | 136,2 | 1 | 190 | limpa |
| r07 | 1385,1 | 10 | 1231 | 94,4 | 0 | 158 | ⚠ Chrome 224 % |
| r08 | 389,0 | 5 | 273 | 212,7 | 1 | 239 | ⚠ `mediaanalysisd` 90 % |
| r09 | 189,5 | 6 | 184 | 139,6 | 2 | 157 | ⚠ Chrome 189 % |
| r10 | 196,0 | 5 | 292 | 137,4 | 2 | 228 | ⚠ `mediaanalysisd` 94 % |
| **mediana, n = 10** | **383,5** | **6,5** | **390,5** | **138,5** | **2** | **201** | |

### 5.4 O AVD — o "depois" (`664b849`) `[medido: avd/custo/depois-analise.txt, depois-carga-e-veredito.txt]`

| rodada | SYNC: maior intervalo | > 100 ms | lacuna | PISO: maior intervalo | > 100 ms | lacuna | carga |
|---|---|---|---|---|---|---|---|
| r01 | 313,9 | 5 | 314 | 109,2 | 2 | 130 | ⚠ Chrome 237 % |
| r02 | 220,7 | 3 | 160 | 64,7 | 0 | 152 | ⚠ Chrome 220 % |
| r03 | 157,7 | 5 | 200 | 90,5 | 0 | 157 | limpa |
| r04 | 177,7 | 7 | 254 | 393,7 | 3 | 406 | ⚠ Chrome 257 % |
| r05 | 175,2 | 4 | 150 | 101,3 | 1 | 144 | ⚠ Chrome 233 % |
| r06 | 181,6 | 4 | 160 | 280,0 | 2 | 275 | limpa |
| r07 | 213,0 | 4 | 181 | 94,9 | 0 | 153 | limpa |
| r08 | 523,8 | 4 | 510 | 93,7 | 0 | 137 | ⚠ Chrome 113 % |
| r09 | 174,3 | 5 | 174 | 550,4 | 7 | 799 | limpa |
| r10 | 591,8 | 23 | 657 | 169,5 | 3 | 244 | ⚠ `mobileassetd` 121 %, Chrome 118 % |
| **mediana, n = 10** | **197,3** | **4,5** | **190,5** | **105,2** | **1,5** | **155** | |

**Os controles do sensor** (os dois lados): **(a)** a tarefa de 200 ms vista com **207,2 · 218,7 · 236,8** (antes) e **211,8 ·
212,5 · 209,3 ms** (depois); o quadro que a fecha 1–2 ms depois do fim dela, **menos o r03 do "antes" (329 ms — a rodada
marcada pela carga)**; **(b)** o PISO, nas tabelas; **(c)** *(declarado, como na PR-1)* as 2 rodadas **sem** o
`uiautomator events`: SYNC 197,0 · 169,5 (antes) e 148,6 · 217,2 ms (depois); PISO 102,4 · 91,4 e 88,6 · 93,9 ms — n = 2,
medido duas vezes, não é referência (`*-sem-eventos-analise.txt`).

### 5.5 A tabela por passo, antes × depois — o AVD `[medido: avd/custo/tabela-por-passo.txt]`

`instrumentos/custo/tabela-por-passo.py` — os passos da PR-1, achados pelas linhas `OCTAVIA:` saídas dentro de cada parada,
mais o **passo 0**, que a PR-1 não tinha (lá o sync era o da abertura, já em curso quando a rolagem ligou):

| passo | antes (n = 10) | depois (n = 10) | depois − antes | sem as marcadas (n = 4 · 4) |
|---|---|---|---|---|
| **0** o disparo: o `sync start` (o `setSync('sincronizando')` e o render da raiz) | 132 · 50–267 | 178 · 50–284 | +47 | 59 → 170 |
| **1** o fim síncrono do sync: a leitura, o `reconcile`, **a gravação**, o `sync ok` e, desde a PR-2, a aplicação na raiz | 125 · 100–311 | **92** · 69–145 | −33 | 181 → 87 |
| **2** o render da troca da raiz (o palco e S1 por baixo) | 223 · 178–644 | **148** · 50–199 | **−75** | 366 → 142 |
| **3** o prefetch sob demanda do palco (o efeito com o `contentById`) | 142 · 96–198 | 99 · 58–574 | −43 | 136 → 96 |
| **4** o render seguinte | 170 · 128–340 | 162 · 143–256 | −8 | 227 → 152 |

**Onde estão os intervalos > 100 ms do "depois"** (`avd/custo/rajada.txt`): **4 por rodada (mediana) na rajada do sync**
(`[−1,5 s, +2,5 s]` do `sync ok`) e 0 fora dela; **o passo 1 passa de 100 ms em 2 das 10 rodadas** (no "antes", em 9 de
10); **o passo 0, em 9 de 10**.

**O que a aplicação síncrona da PR-2 mudou contra o "antes" da PR-1** (a hipótese do §17 da PR-2, medida): na PR-1 o passo 1
(a gravação) teve **175 ms** de mediana; aqui, no "antes" da base da PR-3, **125 ms** (n = 10; 181 nas 4 limpas) — **a
aplicação no mesmo bloco não fez o passo 1 crescer de forma visível**, como a hipótese dizia; o render da troca da raiz
seguiu numa tarefa própria (o passo 2, 223 ms, contra 317 da PR-1). Os números das duas PRs não se comparam um a um: o
caminho mudou (o sync da abertura × o disparado, div. 1286) e o host da PR-1 era outro.

**O que a foto tirou** `[hipótese que os números sustentam]`: o **passo 2** (−75 ms; o palco não refaz o corpo nem a quebra) e
parte do 1 e do 3; **não tirou o passo 0** (o disparo re-renderiza a raiz e S1 por baixo — e com a foto o palco re-renderiza
sem mudar nada) **nem o render de S1** (S1 lê a viva, de propósito).

### 5.6 O Tab S6 — antes × depois `[medido: tab/custo/]`

O Tab sem carga de host no quadro (o JS roda no tablet), o par **18:05–18:33**, o mesmo dev client (o de 2026-09-23 —
`devclient-2026-09-23-191134.apk`, sha256 `9447edc7…`), os mesmos instrumentos; o `uiautomator events` lido com a base de tempo
consertada (div. 1290, §5.8). **Os 10 de cada lado têm o mesmo desenho, rodada a rodada**:

| | SYNC: maior intervalo (mediana · faixa) | > 100 ms | lacuna (`uiautomator`) | PISO: maior intervalo | > 100 ms | lacuna |
|---|---|---|---|---|---|---|
| **Tab · antes** (`690972f`, n = 10) | **177,7** · 173,3–195,9 | **3** em 10 de 10 | **155** · 127–266 | **22,5** · 21,9–23,7 | 0 em 10 de 10 | **107,5** · 105–109 |
| **Tab · depois** (`664b849`, n = 10) | **186,2** · 163,0–192,6 | **3** em 10 de 10 | **147,5** · 104–174 | **23,0** · 21,9–24,1 | 0 em 10 de 10 | **107** · 105–110 |

**Os controles do sensor**: **(a)** a tarefa de 200 ms vista com **214,8 · 216,2 · 210,4** (antes) e **209,1 · 213,6 · 212,7 ms**
(depois), o quadro que a fecha 0–2 ms depois; **(b)** o PISO, acima — **o Tab desenha 60 quadros por segundo sem pausa
nenhuma acima de 24 ms** sem sync; **(c)** sem o `uiautomator events` (n = 2): SYNC 175,1 · 168,9 (antes) e 190,8 · 167,0 ms
(depois); PISO 23,8 · 22,4 e 22,2 · 22,3 ms.

**A tabela por passo do Tab** (`tab/custo/tabela-por-passo.txt`, `rajada.txt`):

| passo | antes | depois | depois − antes |
|---|---|---|---|
| **0** o disparo (`sync start`) | 175 · 50–196 | 186 · 50–193 | +11 |
| **1** o fim síncrono do sync (a gravação + a aplicação) | **53** · 50–59 | **53** · 50–64 | 0 |
| **2** o render da troca da raiz | 164 · 50–173 | 148 · 50–155 | −16 |
| **3** o prefetch sob demanda | < 50 (uma vez 180) | < 50 | 0 |
| **4** o render seguinte | < 50 | < 50 | 0 |

**3 intervalos > 100 ms por rodada, todos na rajada do sync, 0 fora dela, nos dois lados**; **o passo 1 nunca passa de 100
ms** (0 de 10 nos dois); **o passo 0, em 9 de 10**. **No Tab a foto não mudou o custo**: a quebra do corpo novo no Tab é barata
(o passo 2 caiu 16 ms); o que custa é o **render** que o sync provoca — o do disparo e o da troca da raiz —, e a foto não o tira.

### 5.7 O veredito pelo critério congelado da SY-D36

**O critério, copiado por extenso** (SY-D36, `SY-PR1-anexos/README.md` §13): *"na janela do sync, com n ≥ 10 por aparelho: a
mediana do número de intervalos acima de 100 ms é no máximo a do piso + 1, **e** a mediana do maior intervalo é no máximo o
maior entre 2 × a mediana do piso e 100 ms"*. Para o release: *"a maior lacuna de rolagem pelo `uiautomator events` na janela
do sync é no máximo a mediana do piso + 100 ms, n ≥ 10"*.

| aparelho · lado | > 100 ms (sync ≤ piso + 1) | maior intervalo (sync ≤ max(2 × piso, 100)) | **dev client** | lacuna (sync ≤ piso + 100) | **release** |
|---|---|---|---|---|---|
| AVD · antes | 6,5 ≤ 3? não | 383,5 ≤ 277,0? não | **REPROVA** | 390,5 ≤ 301? não | **REPROVA** |
| **AVD · depois** | **4,5 ≤ 2,5? não** | 197,3 ≤ 210,5? sim | **REPROVA** | 190,5 ≤ 255? sim | **PASSA** |
| AVD · depois, sem as marcadas (n = 4) | 4,5 ≤ 2? não | 177,9 ≤ 374,9? sim | REPROVA | 177,5 ≤ 316? sim | PASSA |
| Tab · antes | 3 ≤ 1? não | 177,7 ≤ 100? não | **REPROVA** | 155 ≤ 207,5? sim | **PASSA** |
| **Tab · depois** | **3 ≤ 1? não** | **186,2 ≤ 100? não** | **REPROVA** | 147,5 ≤ 207? sim | **PASSA** |

**O "depois" reprova o critério do dev client nos dois aparelhos, e passa o do release nos dois.** **Esta PR não decide a SY-D6** (a SY-D36: *"se o 'depois'
reprovar, a PR-3 não decide sozinha"*): a pergunta, com as duas saídas e o número de cada uma, é a **Q1** (§11).

### 5.8 O instrumento do release no Tab (div. 1290)

Na 1ª leitura, o `uiautomator events` do Tab deu **0 eventos** em toda janela — e o critério do release *"passava"* com a
lacuna 0: **vazio** (o caso 42). Os eventos estavam lá (408 de rolagem por rodada); a análise os põe no tempo pelo
`EventTime` contra o `/proc/uptime` do cabeçalho, e **no Tab as duas bases não coincidem** (o `EventTime` é o `uptimeMillis`,
que não conta o sono profundo; no AVD, que nunca dormiu, coincidem). Consertado no instrumento antes de qualquer conclusão
(`custo-analise-pr3.mjs`, o relógio da própria linha quando os dois se afastam mais de 2 s), **com os números do AVD
iguais byte a byte** depois do conserto. **Para o release do encerramento** (que só tem esse instrumento, SY-D20) a mesma
correção vale — e é por ela que a SY-D36 (c) pode ser lida no Tab.

## 6. A foto na tela de verdade (A-SY-17, e o que o `native-tela` não vê)

### 6.1 O roteiro `[medido: avd/foto/foto.txt, tab/foto/foto.txt]`

`instrumentos/foto/foto.py` sobre o bundle da PR, com as fixtures `instrumentos/foto/fixture-foto.py` (todo texto do projeto:
a fixture da QL-PR4, regra 10) — **x** (a A do custo), **y** (o que o site muda com o palco aberto: a 3 com outro corpo,
outro título e outras notas; a setlist renomeada, a nota da posição 3 trocada, as posições 1 e 2 trocadas e uma 9ª), **z** (a
3 de novo mudada, para V), **w** (a setlist apagada), **m** (a música 3 apagada, em cascata) e **v** (a partitura da 6
apontando outro arquivo). O sync se dispara pela função do *Tentar de novo* (§5.1), com o palco ou V abertos.

| passo | o que se confere | AVD | Tab |
|---|---|---|---|
| A | o palco na 3, a rolagem ligada; o sync traz **y**: o corpo da versão da abertura (x → x), a barra, o título e a nota da posição iguais; **o `ScrollY` depois do sync nunca 0 e seguindo** | ✓ — x → x; `ScrollY` 698 → 1654 px, 63 eventos depois do sync, nenhum 0 | ✓ — x → x; `ScrollY` 691 → 1748 px, 69 eventos depois do sync, nenhum 0 |
| B | o índice do palco: 8 posições e o nome **da foto**; o salto pelo índice à 3: *"3 DE 8"* e o nome de antes (**nenhuma foto nova da setlist**), e o conteúdo **de agora** (a abertura: y) | ✓ ✓ ✓ — e o índice mostra o título **novo** da 3 (Q2) | ✓ ✓ ✓ — idem, o título novo da 3 no índice |
| C | a busca do palco: *"NESTA SETLIST · ENSAIO DA QUEBRA"* (a foto) | ✓ | ✓ |
| D | o fim: *"8 DE 8"*, o nome da foto | ✓ | ✓ |
| E | sair a S1 e reentrar: *"3 DE 9"*, o nome novo — a sessão soltou | ✓ | ✓ |
| F | V na 3; o sync traz **z**: o título e o corpo da abertura (y → y); **favoritar em V → a estrela muda na hora** (`write op=favorite … 200`) | ✓ ✓ | ✓ ✓ |
| G | a setlist apagada (**w**) com o palco aberto: o palco segue de pé (sem o *"não está no cache"*); S1 sem ela ao sair, sem aviso | ✓ ✓ | ✓ ✓ |
| H | a música da 3 apagada (**m**) com o palco aberto nela: o corpo segue com a **última versão vista**, sem placeholder | ✓ (reavaliado — ver abaixo) | ✓ — z → z (já com o critério consertado) |
| J | a partitura da 6 aberta; o sync traz **v**: *"página 1 de 12"* antes e depois — o PDF não muda | ✓ | ✓ — e `file src=download name=partitura-1p.pdf … ms=905` com a música aberta |

**AVD: 15 de 15** (14 na corrida, o H reavaliado sobre os dumps gravados com o critério consertado, `avd/foto/H-reavaliado.txt`). **Tab: 15 de 15**, na corrida, com o instrumento já consertado.

**Os dois consertos do instrumento, achados pela própria saída antes de qualquer conclusão** (div. 1289; o caso 42 — o
instrumento que reprova ou passa pelo motivo errado): **(1)** a 1ª corrida (`avd/foto-1a-corrida/`, rastro) leu o corpo
**linha a linha** contra as linhas lógicas da fixture — o nó `corpo` traz o texto **inteiro, com as quebras do leitor** —, e a
versão saiu `?` em todos os passos; buscou o nome da setlist em minúsculas — a barra o desenha em **MAIÚSCULAS** —, e assim o
`B-indice-foto` passou **sem medir** e o `E-reentrada` reprovou; e leu a rolagem do dump, que não a tem. Consertado: a versão
pelo texto sem espaço nem quebra; as buscas sem caixa; a rolagem pelo `uiautomator events` (o `ScrollY`, o instrumento da
PR-1); a busca do palco ganhou critério; o passo I (a âncora) saiu para o arnês do QL (§6.3). **(2)** o H esperava a versão
**y** fixa; a última versão vista era a **z** — o favoritar do passo F, confirmado (o `PUT` subiu o `updated_at`), a segurou
contra o sync da y (a `naoRegredir`, como deve) —, e o critério passou a ser *"a mesma de antes do apagado"*. **O app não
mudou entre as corridas.**

### 6.2 A leitura do prefetch, no aparelho (§3.2; div. 1287)

No **J da 1ª corrida** (o passo não mudou entre as corridas): com a partitura de 12 páginas aberta e o sync trazendo a 6
apontando a `partitura-1p.pdf`, o logcat do AVD diz **`prefetch plan n=3 reason=library` · `file src=download
name=partitura-1p.pdf bytes=643 … ms=183`** — **o arquivo novo baixou com a música aberta** —, e a tela seguiu *"página 1 de
12"*. Na 2ª corrida do AVD o arquivo já estava no disco (`… partitura-1p.pdf: False`, registro). **No Tab, o mesmo**: `file src=download name=partitura-1p.pdf bytes=643 total=643 ms=905` com a música aberta, e *"página 1 de 12"* antes e depois. **A SY-D24 vale** (a tela não
muda); **a premissa do prompt não** (Q3).

### 6.3 A âncora do QL com a foto `[medido: avd/ancora/ancora4.txt, tab/ancora/ancora4.txt]`

O arnês da QL-PR4 (`QL-PR4-anexos/instrumentos/ql4.py ancora ancorav` + `ancora4.ts`, sem mudança, sobre o bundle da PR; a
fixture `fixture-ql4.py`, a mesma A do custo):

| roteiro | o que gira | AVD | Tab |
|---|---|---|---|
| `ancora-abertas` (o palco, as notas abertas) | B → C → zoom 26 → B, e a rolagem automática | Δ 0,4 · 0,1 · 0,4 px, a lógica 46 nos três; *"parte do ancorado e só desce"* ✓ | Δ 0,4 · 0,2 · 0,4 px, a lógica 54 nos três; ✓ |
| `ancora-recolhidas` | idem, as notas recolhidas | Δ 0,5 · 0,1 · 0,1, a lógica 43 ✓ | Δ 0,1 · 0,2 · 0,4, a lógica 56 ✓ |
| `ancora-nas-notas` (a marca dentro das notas, QL-D52) | o giro | o topo, Δ 0,0 ✓ | o topo, Δ 0,0 ✓ |
| `ancorav` (V) | C → B → C | Δ 0,3 · 0,2, a lógica 38 ✓ | Δ 0,4 · 0,1, a lógica 46 ✓ |
| `ancorav-detalhes` (a marca nos *Detalhes*) | B → C | o topo, Δ 0,0 ✓ | o topo (a rolagem não se moveu) ✓ |

**A âncora do QL segue valendo com a foto** — girar e mudar o zoom são da mesma abertura (A4.2), e a foto não muda a chave;
os testes da âncora seguem verdes na suíte.

## 7. Nenhum pixel novo — o G-inv (A-SY-10) `[medido: avd/g-inv-avd.txt, tab/g-inv-tab.txt, g-inv-ambos.txt]`

A cadeia da base (a da QL-PR4, `instrumentos/arnes/`, só o prefixo `SY3`; o `roteiro.py` do pre-check do N3 com a errata de
caminho, conferido igual ao da QL-PR4 — `roteiro.diff` aplicado), sobre o bundle da PR, a fixture do pre-check do N3, **o
store da fixture do SY apagado por nome antes** (div. 1130; `avd/store-apagado-ginv.txt`). O S0 só no AVD (no Tab ele
derrubaria a sessão do Marcel; a base do Tab não o tem).

| | AVD | Tab | os dois (a conta da base) |
|---|---|---|---|
| G-inv `B5-baseline/` | **18 de 18** idênticos | **16 de 16** | **34 de 34 — `IDÊNTICO EM DP ✓`** |
| G-inv `B3-referencia-paisagem/` | **9 de 9** | **9 de 9** | **18 de 18 — `IDÊNTICO EM DP ✓`** |
| G-N3 (`--logico …/b3-pre-ql`) | (e)=0 · (b)=0 · nome-acessível 4 · rolagem 3 · quebra 8 ✓ (43 pares) | (e)=0 · (b)=0 · nome-acessível 4 · rolagem 3 · quebra 8 ✓ | **(e)=0 · (b)=0 · nome-acessível 8 · rolagem 6 · quebra 16 ✓ (84 pares)** — o mesmo do encerramento do QL |

**Sem errata**, nenhum par do `g-inv-par`. Os dumps (`dumps/`, com `SHA256SUMS.txt`) são da fixture do projeto.

## 8. O aparato e o estado dos aparelhos

### 8.1 O AVD `octavia_tab32` `[medido: avd/]`

Subido do `default_boot` com `-no-snapshot-save`, uma vez (o `ram.bin` de 2026-09-24 14:00 no começo e no fim,
`ram-bin-antes.txt`/`ram-bin-depois.txt`). **O estado lido antes e depois, com o `diff` vazio** (`estado-antes.txt`,
`estado-depois.txt`): `stay_on=1 accel=1 user_rot=0`, `airplane=1 wifi=0 data=0`, `reverse` vazio, o dev client de
2026-09-24 14:00:01 `DEBUGGABLE`, o app parado, `ping` → `Network is unreachable`; a rotação, girada pelos roteiros, reposta
explicitamente aos valores lidos antes do `estado-depois`. **O rádio ligado só nas rodadas** (div. 1264; `radio-ligado.txt`;
no fim, na ordem inversa, e o `ping` de novo inalcançável). **A receita do cache da conta de audit** (N4-D102): 5 caminhos
guardados md5 a md5 e tirados por nome (`receita-guardar.txt`), regravados **5 de 5 md5** no fim, apagados antes por nome os
dois arquivos da fixture (`receita-regravar.txt`). **O bundle servido antes de cada lado** (§5.1). O Metro sem `CI=1`,
`--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; o `apps/native/.env` por `cp -p` do checkout principal
**sem abrir**, nas duas árvores (sha256 `f2bfa179cd8e` nas três, `env-sha.txt`), **apagado no fim**. O mock (8788) e o
servidor de arquivos (8790, os PDFs do pre-check do N3) de pé só na sessão. `logcat -G 16M` e `-c` uma vez, antes.

**As quedas (regra 36)** `[medido: avd/quedas.txt]`: **Java 0 · nativa 3 · tombstones 3** — as três o SIGSEGV do Fabric
(`MountingCoordinator::pullTransaction`), a queda nativa conhecida do dev client (a herança do W5 que a SY-D11 deixa fora; a
condição do A-N4-28), às **11:12** (o "depois" da 1ª tentativa, o bundle da PR), **12:20** (o "antes" da 2ª, o bundle da
**base**) e **12:26** (o "depois" da 2ª, o da PR) — **com os dois bundles**, e **nenhuma no par que vale** (15:18–15:48) nem
depois dele. Div. 1291.

### 8.2 O Tab S6 — como foi achado, a ida e a volta `[medido: tab/]`

- **Achado** (16:40, `tab/estado-antes.txt`): `stay_on=0 accel=1 user_rot=0`, `airplane=0 wifi=1 data=1`, `reverse` vazio,
  **aceso e destravado**, o **release** de 2026-10-10 10:24:45 sem `DEBUGGABLE` — o APK instalado, puxado do aparelho:
  **sha256 `65209b80…`, 105.220.413 B, igual ao `~/octavia-aparato/tab-s6-release/release-ea5e891.apk`** — e **o app
  aberto** (pid 4374).
- **A janela, pedida uma vez** ao Marcel, com o plano, a ordem, o tempo e o que ele fazia (deixar no cabo, destravado, sem
  uso); concedida às 16:4x. `stay_on` a 7; `am force-stop`; **`install -r` do dev client** (`devclient-2026-09-23-191134.apk`,
  sha256 `9447edc7…`) — `DEBUGGABLE`, a sessão do Marcel mantida (div. 372); nenhuma senha, nenhum logout (sem S0 no Tab).
- **A receita do cache real** (N4-D102, regra 35): **5 caminhos** — os três `.json` e **dois** arquivos do Marcel —
  guardados por cópia md5 a md5 e **tirados do aparelho por nome**; a pasta só com os quatro `._*` (que ficam, N3-PR6c)
  (`tab/receita-guardar.txt`, os nomes dos arquivos omitidos no anexo). O mock na **8789** (um por aparelho), os túneis
  `8081`, `8790` e `8788 → 8789`; **o bundle conferido antes de qualquer abertura** (`localhost:8788` 1 · `octavia.rocks` 0).
  **O Wi-Fi não se tocou.**
- **A volta**: as quedas contadas (**0**: Java, nativa, tombstones do dropbox, `tab/quedas.txt`); o cache real **regravado 5 de 5 md5**, depois de apagados por nome os dois arquivos da fixture (`tab/receita-regravar.txt`); **`install -r` do `release-ea5e891.apk` guardado** — o APK instalado, puxado de novo: **sha256 `65209b80…`, igual** (`tab/release-de-volta.txt`) —, sem `DEBUGGABLE`, `lastUpdateTime=2026-10-12 19:12:20`; o app **parado e não aberto** (abrir com rede é um sync com prod, regra 38); `stay_on` **0**, `accelerometer_rotation` reposto a **1** (os roteiros o deixaram em 0), os túneis removidos. **O `diff` do estado** (`tab/estado-diff.txt`): só o `lastUpdateTime` (o `install -r`) e o app em execução (achado aberto, deixado parado). O Marcel avisado ao fim: o Tab livre.

## 9. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` copiado por `cp -p` e conferido por sha256, **sem abrir**, apagado no fim nas duas árvores |
| requisições a terceiros | **2 renovações de token no AVD** (`auth refresh=forced`), a conta de audit, ao Google: uma por expiração (horas de sessão) e a do 401 forjado do S0 (o caminho do aceite); **1 no Tab** (`auth refresh=forced`, a sessão do Marcel, ao Google — a renovação do token por expiração, durante as rodadas; `tab/logcat-contagem.txt`) |
| requisições do app ao mock | AVD: 379 linhas `api`, todas ao `localhost:8788`; `octavia.rocks` no logcat inteiro **0** (`avd/logcat-contagem.txt`); Tab: 145 linhas `api` no anel (o anel de 5 MiB gira: é o que ele guardou), **todas `/api/…` ao mock** pelo túnel `8788 → 8789`; `octavia.rocks` 0 |
| AVD | começo e fim iguais (§8.1); a receita 5 de 5; **3 quedas nativas** (div. 1291) |
| Tab S6 | §8.2 |
| builds | **nenhum** (o dev client do AVD é o de 2026-09-24, o do Tab o de 2026-09-23; nenhum módulo nativo novo) |
| processos no host | o Metro (8081), os mocks (8788, 8789), o servidor de arquivos (8790), o amostrador de carga — derrubados no fim (`fim.txt`) |
| árvores | `../octavia-sy-pr3` (criada pela outra sessão, adotada); `../octavia-sy-pr3-base` (idem, `690972f` destacada: o Metro do "antes" e a reverificação, §1) **removida no fim sem `--force`**; a `../octavia-sy-pr2` já tinha sido removida pela outra sessão (limpa, mergeada) |
| a outra sessão | ver §1 e div. 1284; o bruto de aparelho dela não entra |
| as tentativas descartadas | 2 pares no AVD (§5.2): só as análises, em `avd/descartado/`, como rastro |
| GitHub | `git fetch origin`; o push da branch, a abertura da PR, a leitura dos checks |
| agentes | **0** |
| perguntas ao Marcel nesta sessão | 5 — a outra sessão (a origem, parar e aproveitar); a carga do host (duas vezes: limpar e o Docker); a janela do Tab |
| regra 4 do catálogo sobre os anexos | `grep -rn eyJ` → exit 1; `grep -rln <email>` → exit 1 |
| texto nos anexos | só o do projeto: as fixtures do N3, do QL e desta PR (o `CLAUDE.md`, "Anexo não carrega texto de música"); do Tab, nenhum dado da conta do Marcel (o cache real fora do aparelho durante o mock; os nomes dos arquivos dele omitidos) |

## 10. Os aceites desta PR — o veredito

| # | o critério congelado (SY-D37) | veredito | a evidência |
|---|---|---|---|
| **A-SY-6** | as 9 linhas `iii:palco-*` saem; `palco-trocar-posicao` e `palco-musica-apagada-nunca-aberta` seguem passando | **cumprido** — com a div. 1285 (3 das 9 saíram no commit 2) | §2; `reverificacao/`; CN c-5, c-8; no aparelho, §6 A, B |
| **A-SY-7** | as 5 linhas `iii:v-*` saem; `v-estrela-viva` segue passando | **cumprido**; os testes do favoritar verdes sem errata (a suíte) | §2; CN c-3, c-9; no aparelho, §6 F (a estrela muda na hora, nos dois) |
| **A-SY-8** | `iii:setlist-apagada` e `iii:palco-musica-apagada-aberta` saem | **cumprido** | §2; CN c-6, c-7; no aparelho, §6 G, H (nos dois) |
| **A-SY-9** | o custo pelo critério da SY-D36, o "antes" e o "depois" sobre a base da PR-3, nos dois aparelhos; se o "depois" reprovar, a tabela por passo e a pergunta | **medido — o "depois" REPROVA o critério do dev client nos dois aparelhos** (passa o do release nos dois): **a pergunta Q1**, com a tabela por passo e o número das duas saídas | §5; Q1 |
| **A-SY-10** | o G-inv B5 e B3 iguais nos dois aparelhos, sem errata | **cumprido** — B5 **34 de 34** e B3 **18 de 18** idênticos em dp, AVD + Tab, sem errata; G-N3 (e)=0 · (b)=0 | §7 |
| **A-SY-17** | o palco, o índice, o fim e a busca com a mesma setlist depois de um sync que a muda; solta ao voltar a S1/S2 | **cumprido nos dois aparelhos** | §6 A–E |

## 11. As perguntas para o aval

Numeradas, com opções e recomendação. **O executor prepara; quem decide é o Marcel.**

**Q1 — a SY-D6** (§5). O "depois" **reprova o critério do dev client nos dois aparelhos** e **passa o do release nos dois**:

| | dev client: > 100 ms (sync ≤ piso + 1) | dev client: maior intervalo | **dev client** | release: lacuna | **release** |
|---|---|---|---|---|---|
| AVD · depois (n = 10) | 4,5 ≤ 2,5? não | 197,3 ≤ 210,5? sim | **REPROVA** | 190,5 ≤ 255? sim | **PASSA** |
| Tab · depois (n = 10) | 3 ≤ 1? não | 186,2 ≤ 100? não | **REPROVA** | 147,5 ≤ 207? sim | **PASSA** |

O que sobra, em cada sync com o palco aberto e a rolagem andando: **no Tab, 3 pausas de ~150–190 ms por sync, em 10 de 10
rodadas** (o piso: 0); no AVD, 4 (mediana). A rolagem **pausa** e retoma, não salta (o passo é por quadro, A3); o texto
não muda (a foto). **Onde estão as pausas** (a tabela por passo, §5.5/§5.6): o **disparo** (o `setSync('sincronizando')`
re-renderizando a raiz — passo 0, > 100 ms em 9 de 10 rodadas nos dois aparelhos) e o **render da troca da raiz** (passo 2,
~150 ms) — **não a gravação**, que no "depois" fica em **53 ms no Tab** (nunca > 100) e em **92 ms no AVD** (> 100 em 2 de 10).

As duas saídas da SY-D36, com o número de cada uma:

- **(a) "com o palco aberto nenhum gatilho automático dispara; o sync fica marcado e roda ao sair do palco"** — tira **as 3
  pausas do Tab e as 4 do AVD**: com o palco aberto, a janela do sync **é** o piso (0 intervalos > 100 ms no Tab). O custo: o
  dado novo só chega ao sair do palco (o que a foto já garante na tela: a versão nova só aparece na próxima abertura, SY-D7);
  um gatilho a mais na PR-4 (a marca), com o gate e o aceite dele.
- **(b) atacar a gravação** — tira **0 das 3 pausas do Tab** (a gravação já está abaixo de 100 ms em 10 de 10 rodadas) e, no
  AVD, a mediana segue em **4** (ela passa de 100 ms em 2 de 10): **não faz o "depois" passar em nenhum dos dois**.

**Recomendo (a)**: é a única das duas que fecha o critério congelado, nos dois aparelhos, e o atraso que ela custa é o que a
foto já impõe à tela. *(Registro, sem pergunta: o que de fato pesa é o **render** da raiz — S1 por baixo da pilha e o palco
re-renderizando sem mudar nada. Atacá-lo é uma terceira saída que a SY-D36 não pôs na mesa; ela teria de passar por desenho
de render, fora do SY.)*

**Q2 — o título e o rótulo vivos no índice e na busca do palco** (§3.1). Com a foto da sessão, o índice do palco tem as
posições, a ordem e o nome da foto, mas o **título e o rótulo de cada posição** vêm do `contentById` vivo (`IndexScreen.tsx:283-285`),
e a busca do palco indexa a biblioteca viva (`SearchScreen.tsx:180-181`). O que o músico vê: com a música 3 renomeada no site
e o palco aberto nela, **o palco diz o título da abertura e o índice diz o novo** (§6.1, B). As outras posições mostram o que
ele vai ver ao abri-las. (a) **deixar vivo**: o índice e a busca descrevem o que a próxima abertura mostra (SY-D7: o
conteúdo vale por abertura), e só a posição aberta difere, num caso raro (o título mudado no site durante o show); nenhum
pixel novo; (b) o índice do palco ler, para a posição aberta, o título da foto do palco — pede o palco expor a foto dele a
quem está acima (estado novo no `navigation.tsx`); (c) congelar o `contentById` pela sessão inteira — **contraria a SY-D7**
(o conteúdo é por abertura). **Recomendo (a)**, com o caso escrito como conhecido.

**Q3 — o arquivo novo chega ao disco com a música aberta** (§3.2; div. 1287). A tela não muda (a SY-D24 vale: o `file_url`
congela), mas o prefetch sob demanda do palco (o mapa vivo, a posição atual primeiro) e o plano da biblioteca do sync pedem
o arquivo novo **com a música aberta**. (a) **deixar**: o arquivo novo chega antes, e a próxima abertura já o acha no disco
(o que a N4-R26 quer); a tela não muda; o custo é um download em segundo plano, que já acontecia sem foto; (b) o prefetch
do palco ler a foto **na posição aberta** (as outras posições, o mapa vivo) — só o palco, dentro do escopo desta série,
mas o plano da biblioteca ainda pede o arquivo; (c) (b) **e** o plano da biblioteca excluir o arquivo da música aberta —
mexe no prefetch do sync (fora do escopo do SY: SY-D11, §1 do prompt). **Recomendo (a)**. *(O (b) tira o efeito do prefetch
do re-render do sync só para a posição aberta; o passo 3 da tabela de custo é o efeito inteiro — §5 diz quanto ele pesa.)*

**Q4 — o que a PR-4 precisa saber da foto antes de ligar os gatilhos.** Para registro, sem opção a escolher salvo onde
indicado: (1) **a foto não depende de quem disparou o sync**: ela congela na tela o que o `setDados` traz, do sync da
abertura, do *Tentar de novo* ou de um gatilho — nenhuma mudança da PR-4 a toca; (2) **a sessão solta no foco de S1/S2**:
um gatilho que dispare com S2 aberta (o músico editando) **muda S2 na hora**, como hoje, porque S2 lê a viva — é o desenho
(A4.1); (3) **o voltar do Android do palco a S2 solta a foto** (o foco de S2), e o palco seguinte, aberto de S2, fotografa de
novo; (4) **o "SEM CONEXÃO" de um sync automático que falha** é a entrada obrigatória da PR-4 (SY-D43): **com o palco
aberto, a foto não esconde nada disso** — o palco não lê o `sync` (a fase), só o `online`; o que muda por baixo é S1; (5)
**o custo** (Q1): a decisão da SY-D6 é o que a PR-4 implementa.

**Q5 — o caminho do "antes" mudou** (div. 1286, §5.1). O "antes" da PR-1 provocava o sync segurando a abertura no mock
`atraso`; com o prazo de 20 s da PR-2 esse sync falha antes de aplicar, e não há o que medir. Aqui o sync é disparado pela
**função do *Tentar de novo*** (a mesma que um gatilho chamará, pelo `rodarSync`) com o palco já aberto e a rolagem
andando; o piso passou a ser `[t_rol + 3 s, t_rol + 23 s]`. Os instrumentos (o sensor, o `uiautomator events`), as fixtures
(A/B) e a janela do sync são os da PR-1. (a) **aceitar o caminho**, para o "antes" e o "depois" desta PR e para o release
(o mesmo disparo pela função não existe no release: lá é o gatilho de verdade, na PR-4 e no encerramento); (b) outro.
**Recomendo (a)**.

**Q6 — a origem dos quatro commits** (§1; div. 1284). O aproveitamento já é decisão do Marcel nesta sessão; a pergunta é só
o **registro**: (a) **como está** — o README declara a origem, a reverificação desta sessão (§1) e o descarte das medidas
de aparelho daquela; (b) mais do que isso (por exemplo, o bruto do aparelho daquela sessão como rastro: ~20 MB, inválido
para a comparação). **Recomendo (a)**.

## 12. Divergências — 1284 a 1291

A última usada era a **1283** (`SY-PR2-anexos/README.md` §12.1) `[medido: git grep -ohE "^\| \*\*12[0-9]{2}\*\*" -- docs | sort -u |
tail → 1283; nenhum número ≥ 1284 em docs/]`. Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado
real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1284** | T | **Outra sessão rodou este mesmo prompt, em paralelo**, das 09:26 às ~10:30 de 2026-10-12 (o Marcel a abriu por engano): criou a árvore e a branch, removeu a `../octavia-sy-pr2`, fez os commits 1–4 e parte dos anexos, e estava medindo no AVD quando foi parada | decisão do Marcel nesta sessão: **aproveitar**, com a reverificação de cada commit e os CN refeitos por esta sessão (§1, §4), e **descartar** as medidas de aparelho dela (o bruto não entra) |
| **1285** | P | O prompt (§2 itens 2 e 3) manda o commit 2 tirar 4 linhas e o commit 3 as 9 `palco-*`; **3 das `palco-*` passaram já com a foto da sessão** (a setlist estável segura o topo, a rolagem e a barra) — deixá-las na lista faria o juiz acusá-las como ÓRFÃS | o commit 2 tirou 7, o 3 tirou 6, os dois o dizem (§2) |
| **1286** | D | O caminho do "antes" da PR-1 (o sync da abertura segurado pelo mock `atraso`, `SY-PR1-anexos/README.md` §6.1) **não existe mais** desde o prazo de 20 s da PR-2: esse sync falha antes de aplicar | o sync disparado pela função do *Tentar de novo* com o palco já aberto; o PISO em `[t_rol + 3 s, t_rol + 23 s]` (§5.1); Q5 |
| **1287** | P | *"Nenhum download de arquivo novo com a música aberta; o arquivo novo vem na próxima abertura"*: **o arquivo novo baixa com a música aberta** (o prefetch sob demanda do palco lê o mapa vivo, a posição atual primeiro; e o plano da biblioteca do sync pede todo arquivo que falta) — medido nos dois aparelhos (§6.2). A tela não muda (a SY-D24 vale) | §3.2; Q3 |
| **1288** | A | **O host não fica sem carga** (div. 1276): o `mediaanalysisd`, o `mobileassetd` e o `softwareupdated` do macOS, a VM do Docker Desktop (que voltou a abrir no meio da 2ª tentativa) e o Chrome derrubaram duas tentativas do par no AVD, e marcaram 6 de 10 rodadas de cada lado no par que vale | duas tentativas descartadas (§5.2); a **regra de carga declarada antes dos números** e o veredito com e sem as marcadas; o Tab não depende da CPU do Mac |
| **1289** | T | **O `foto.py` (o instrumento da foto no aparelho) media errado em quatro pontos e esperava a versão errada num quinto**, achado pela própria saída antes de qualquer conclusão: o corpo lido por linha lógica (o nó traz o texto inteiro, com as quebras do leitor); o nome da setlist buscado em minúsculas (a barra é em MAIÚSCULAS — o `B-indice-foto` passou sem medir, o caso 42); a rolagem e a linha do topo lidas do dump (que não as tem); a busca sem critério; e o H esperando a versão y (a z era a última vista, segura pela `naoRegredir`) | consertado no instrumento (§6.1); a 1ª corrida como rastro; o H reavaliado sobre os dumps gravados; a âncora pelo arnês do QL |
| **1290** | T | **O `uiautomator events` do Tab saiu com 0 eventos nas janelas** e o critério do release *"passou"* vazio: o `EventTime` do Tab não tem a base do `/proc/uptime` (o sono profundo) | a análise usa o relógio da linha quando os dois se afastam > 2 s; os números do AVD iguais byte a byte (§5.8) — **vale para o release do encerramento** |
| **1291** | A | **3 quedas nativas no AVD** (o SIGSEGV do Fabric, `MountingCoordinator::pullTransaction`), nas tentativas descartadas, **com os bundles da base e da PR** | a herança do W5 (SY-D11), a condição do A-N4-28; nenhuma no par que vale; **no Tab: 0** (o dropbox) |

**Contagem** `[medido: a coluna]`: **8 — P 2 · D 1 · A 2 · T 3** (P: 1285, 1287 · D: 1286 · A: 1288, 1291 · T: 1284, 1289,
1290). **A próxima livre é a 1292.**

## 13. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# SY-PR3: a foto — a lógica da foto da sessão (src/foto-do-palco.ts) e a ligação dela (src/navigation.tsx); a foto do conteúdo, por abertura, no palco e em V.
g1a: apps/native/src/foto-do-palco.ts
g1a: apps/native/src/navigation.tsx
g1a: apps/native/src/screens/StageScreen.tsx
g1a: apps/native/src/screens/VisualizacaoScreen.tsx
```

```gates-web
# SY-PR3: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado (a PR toca só apps/native e docs).
```

Sem recuo nas linhas de dentro. **Nenhum par do G1b** (nenhuma asserção do core muda; o core não se toca) e **nenhuma errata
nem remoção do G3** (70 = 70). O `sy-reprovados.txt` está em `apps/native/test/`, fora do escopo do G1a. A saída dos dois
extratores sobre este bloco: `blocos-decl.txt` (as 4 linhas `g1a:`; o `gates-web` sem declaração, `exit=0`); a do CI no §14.

## 14. Os checks da PR

*(Preenchido no commit seguinte, com o head deste e o CI dele — a regra 18: o push de docs depois do APK verde.)*

## 15. As erratas de ponteiro — neste commit

| arquivo | onde | a nota |
|---|---|---|
| `docs/native/SY-PRECHECK.md` | a A3 (o custo), depois do texto | o "antes" e o "depois" medidos na PR-3, nos dois aparelhos, e o veredito da SY-D36 (`SY-PR3-anexos/README.md` §5) |
| `docs/native/SY-PRECHECK.md` | a A4 (a foto), depois da A4.5 | a foto feita na PR-3 (`foto-do-palco.ts`, `navigation.tsx`, o palco, V) e o que o aparelho mostrou, com o título vivo do índice (Q2) e o arquivo novo que baixa com a música aberta (Q3) |
| `docs/ux/PLANO-TRANSICAO.md` | "Sequência", depois da nota do aval da PR-2 | a PR-3 aberta, aguardando o aval (a SY-D6 é dele) |
