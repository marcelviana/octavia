# SY-PR1-anexos — os gates (entrando reprovados), a extração do `rodarSync` e o "antes" do custo

**PR** (o número no corpo da PR e no §11), branch `sy/pr1-gates`, árvore `../octavia-sy-pr1` sobre `origin/main` =
**`f4f4231`** (`f4f4231e7f28056cb9ca57deadcd62c4f3d7c915`, o merge da #378: o `SY-PRECHECK.md` com o §8, SY-D17…SY-D31)
`[medido: git rev-parse origin/main]`. `pnpm install --frozen-lockfile --offline`. Fonte do bloco:
[`SY-PRECHECK.md`](../SY-PRECHECK.md) (as decisões SY-D1…D31; as seções A2, A3, A5, A6, A8, A9, A10). Esta PR é a **PR-1**
da SY-D14/SY-D29: **nenhuma mudança de comportamento** — o app sincroniza na entrada da sessão e no *Tentar de novo*, e em
nenhum outro momento.

- **Commits**, na ordem do prompt: `cb520d7` a extração, sozinha · `17a7ec0` os duplos e os contratos inertes · `d5582c4` os
  cinco gates, reprovando pela lista · `8b970e2` o prazo de rede, lido e medido · o do "antes" do custo (o bruto do AVD e
  os instrumentos) · o de docs (este README).
- **Ordem do trabalho, declarada**: o prazo (commit 4) foi lido e medido ANTES dos commits 1–3, porque a resposta dele
  mudava o gate (ii) e o prompt mandava parar se a condição da SY-D19 valesse — valeu, a PR parou e voltou com a pergunta
  (§5), e a decisão (SY-D32) chegou antes de o gate (ii) ser escrito. Os commits ficaram na ordem do prompt.
- **Texto**: só o do projeto (as fixtures do N3, do QL e as desta PR); nenhum texto de música de terceiro, nenhum dado da
  conta (regra 10). O uid que aparece nos anexos do AVD é o da conta de audit (regra 3).
- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado, com caminho e linha
  da ponta da `main`; `[hipótese]` = o resto.

| arquivo | o quê |
|---|---|
| [`antes-main-suite.txt`](antes-main-suite.txt) | a suíte na `main` desta sessão (o "antes") |
| [`c1-extracao-diff.txt`](c1-extracao-diff.txt) | a prova da extração: o corpo antes × depois (`diff` vazio), a interface, o `diff` do `App.tsx` |
| [`c1-extracao-verificacao.txt`](c1-extracao-verificacao.txt) · [`c2-verificacao.txt`](c2-verificacao.txt) · [`c3-verificacao.txt`](c3-verificacao.txt) | G1/G2/G3, os quatro `tsc`, o lint e a suíte, commit a commit (`instrumentos/verifica.sh`) |
| [`gates/`](gates/) | a 1ª corrida de cada gate com a lista VAZIA (as reprovações como não declaradas) |
| [`cn-sy.txt`](cn-sy.txt) | os 20 controles negativos dos cinco gates (`instrumentos/cn-sy.sh`, as plantas em `instrumentos/plantas/`) |
| [`prazo-leitura.txt`](prazo-leitura.txt) · [`prazo-medida.txt`](prazo-medida.txt) | o prazo, lido e medido (§5; `instrumentos/prazo/`) |
| [`avd/`](avd/) | o bruto do AVD: o estado antes e depois, a receita do cache, o bundle servido, as rodadas (sensor, eventos, logcat), as quedas, a análise |
| [`instrumentos/`](instrumentos/) | `verifica.sh`, `cn-sy.sh` e as plantas, `prazo/`, `fixture-sy.py`, `sensor-quadros.mjs`, `custo.py`, `custo-analise.mjs`, `estado.sh` |

---

## 1. Commit 1 — a extração, sozinha (SY-D29; A-SY-20)

O `rodarSync` sai do `App.tsx` para **`apps/native/src/sincronizador.ts`**, recebendo da raiz o que lia por fechamento
(`RaizDoSync`: `setSync`, `setDados`, `dadosRef`, `prefetchEArrumar`). **Literal**: a mesma ordem, os mesmos `await`, a
mesma troca da raiz. O `App.tsx` liga o executor num `useCallback` com **as mesmas dependências** (`[prefetchEArrumar]`) e
sem `async` próprio — a chamada corre síncrona até o primeiro `await` de dentro, como antes.

| `App.tsx` de antes (`f4f4231`) | o módulo de depois (`cb520d7`) | o quê |
|---|---|---|
| `:27` `import { sincronizar } from './src/sync'` | `sincronizador.ts:15` `import { sincronizar } from './sync'`; o `App.tsx:26` importa o executor | o import muda de casa |
| `:35-42` `interface Dados { … }` | `:17-24` `export interface Dados { … }` | as 8 linhas, só o `export` (`diff` vazio sem ele) |
| `:196` `/** Passo 2 do T1-R13 — … */` | `:34`, o mesmo texto | o comentário |
| `:197` `const rodarSync = useCallback(async (uid, anterior: Dados): Promise<void> => {` | `:35` `export async function rodarSync(raiz, uid, anterior): Promise<void> {` · `:36` `const { setSync, setDados, dadosRef, prefetchEArrumar } = raiz` | a assinatura; os quatro nomes que eram fechamento passam a vir da raiz |
| `:198-242` o corpo (45 linhas) | `:37-81` o corpo (45 linhas) | **`diff` vazio**, com a indentação do callback para a da função (`c1-extracao-diff.txt`) |
| `:243` `}, [prefetchEArrumar])` | `:82` `}`; e o `App.tsx:187-195` (de depois): o `useCallback(… executarSync({ setSync, setDados, dadosRef, prefetchEArrumar }, uid, anterior), [prefetchEArrumar])` | o fim, e a ligação na raiz |
| `:141` *"nas duas saídas do `rodarSync` abaixo"* | `App.tsx:130` *"… do `rodarSync` (`src/sincronizador.ts`)"* | o ponteiro do comentário (a regra 5: o registro aponta para onde a coisa está) |

**A prova de que nada mudou** `[medido: c1-extracao-verificacao.txt, c1-extracao-diff.txt]`:

| | a `main` (`f4f4231`) | o commit 1 (`cb520d7`) |
|---|---|---|
| G3 — linhas `log(` | 70 | **70**, *"nenhuma linha sumiu ✓"* (o `rodarSync` não tem `log(`; A8) |
| G2 — `testID` | 124 | **124**, *"antes ⊆ depois ✓"* |
| G1a | — | *"DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)"*, as 2 exceções usadas (§10) |
| G1b | — | *"só adição ✓"* (0 linhas mudadas nos testes do core) |
| a suíte | `Test Files 149 passed \| 3 skipped (152)` · `Tests 1851 passed \| 59 skipped (1910)` | **igual** |
| `tsc` raiz · core · identidade · nativo (de dentro de cada pacote, div. 1187) | — | 0 · 0 · 0 · 0 |
| lint | — | `✔ No ESLint warnings or errors` |

E no bundle servido ao AVD (§6.1): o módulo `src/sincronizador.ts` está lá (3 ocorrências), `octavia.rocks` 0.

## 2. Commit 2 — os duplos e os contratos inertes

**Os duplos** (A8), provados antes de um gate depender deles (`apps/native/test/sy-duplos.test.tsx`, 3 testes):

- **`AppState`** no `fake-react-native.tsx`: `currentState`, `addEventListener('change')` com o `remove`, e
  `__appState(e)` que entrega o `'change'` **só na mudança** (o repetido não sai). Declarado no cabeçalho: se a tela apagada
  conta como segundo plano, e se o evento chega duplicado, é do aparelho (A-SY-18) — o duplo não pode ser mais generoso que
  a biblioteca (caso 15).
- **`fake-expo-network.ts`** (novo): a leitura de agora (`getNetworkStateAsync`), o ouvinte que o teste aciona
  (`__rede(alcancavel)`, que entrega **inclusive o evento repetido**, como o Android pode entregar), `__redeSemEvento` (o
  estado da abertura) e a contagem de ouvintes e leituras. Nada sai ao assinar.
- **O `useOnline` de hoje sobre o duplo**: a primeira leitura loga `net online` (a `null → true`, que **não** é gatilho, A2.1),
  `false → true` loga, a repetição não loga — 3 linhas, e o desmontar desliga o ouvinte.
- **O relógio**: o que o projeto já usa — `vi.useFakeTimers({ toFake: ['Date'] })` e `vi.setSystemTime` nos gates (i) e (v),
  só o `Date`: os `setTimeout` e a rede ficam de verdade.

**Os contratos inertes** — só assinatura e tipo; **a forma de cada um é pergunta para o aval** (§8, Q1–Q3):

| contrato | o que é | o que a PR que o implementa faz |
|---|---|---|
| **`src/gatilhos.ts`** (novo) | `ligarGatilhos(ligacao): () => void`, inerte (não assina nada, o desligar não desliga nada). `LigacaoDosGatilhos = { sessao(): string \| null; pedirSync(motivo); ultimoSyncNaRede(): SyncNaRede \| null }`; `SyncNaRede = { inicioMs, fimMs \| null, falhaDeRede }`; os tipos `MotivoDoGatilho` (`net \| foreground`) e `DecisaoDoGatilho` (os seis da SY-D28); `AUSENCIA_MINIMA_MS` e `INTERVALO_MINIMO_MS` (30 s) | **PR-4**: o `AppState`, a transição `false → true`, a marca, o intervalo, a linha `sync trigger` |
| **`src/foto-do-palco.ts`** (novo) | `criarFotoDaSessao(): { entrar(id, achar); setlistDaSessao(id, achar); sair() }`, inerte: a leitura é a setlist **viva** (`achar(id)`), `entrar`/`sair` não guardam nada. A lógica num módulo que o `native-tela` monta (SY-D22) | **PR-3**: a foto tirada ao entrar de fora, lida pelo palco, o índice, o fim e a busca, solta ao voltar a S1/S2; o `navigation.tsx` a liga |
| **`RaizDoSync.sessaoAtual?`** (no `sincronizador.ts`) | o uid da sessão de agora; **opcional e ignorado** nesta PR (o `App.tsx` não o passa) | **PR-2**: obrigatório; o executor descarta o resultado de um sync cuja sessão mudou e cancela o "de novo" (SY-D17) |

**O que NÃO entrou, declarado**: (1) **nenhum contrato do voo no core** (`packages/core/src/voo.ts`): o prompt manda os
contratos *"só na medida em que os gates precisam de algo para importar"*, e o gate (ii) mede o voo pelo **executor**
(`rodarSync` + as linhas do log), sem importar máquina nenhuma — a PR-2 cria a máquina no core (SY-D25) e os testes de
unidade dela; (2) **o `App.tsx` não chama o contrato dos gatilhos**: a ligação precisaria do `ultimoSyncNaRede`, que o
executor de hoje não dá — implementá-lo seria lógica nova na raiz; fica para a PR-4 (com o executor da PR-2).

`[medido: c2-verificacao.txt]` G1a ✓ (4 exceções usadas), G2 124 = 124, G3 70 = 70, os quatro `tsc` 0, lint ✔; a suíte
`150 passed | 3 skipped (153)` · `1854 passed | 59 skipped (1913)` — **+1 arquivo, +3 testes** (o `sy-duplos.test.tsx`).

## 3. Commit 3 — os cinco gates, reprovando pela lista (SY-D13; A9)

**O mecanismo** (`apps/native/test/sy-lista.ts`), no molde do gate da quebra: a lista
**`apps/native/test/sy-reprovados.txt`** declara o que DEVE reprovar hoje, `<gate>:<caso>`; cada gate julga só as suas
linhas; reprovação fora da lista (*NÃO DECLARADA*) e declaração que passa ou não existe (*ÓRFÃ*) reprovam o gate (regra 14);
cada gate imprime casos, quantos passam, quantos reprovam, e a lista (regra 4). **O que passa hoje fica FORA da lista** —
passar hoje não prova nada sobre esses casos (nada dispara, nada congela); a prova deles é o controle negativo plantado
(§4). O arnês comum (`sy-arnes.ts`) faz o papel do `App.tsx` diante do executor: a raiz de mentira, o registro das linhas
`OCTAVIA:` com o relógio, a resposta segurada do mock, e o **`ultimoSyncNaRede` lido das linhas** (a definição da A2.4: o
que emitiu `sync start` e terminou em `sync ok`/`sync fail`, com `code=network` para a falha de rede).

**A 1ª corrida de cada gate com a lista vazia** `[medido: gates/*-lista-vazia.txt]`, e com a lista: *"reprova exatamente a
lista esperada"* nos cinco. **34 linhas** — (i) 6 · (ii) 6 · (iii) 18 · (iv) 1 · (v) 3.

### (i) os gatilhos — `sy-gatilhos.test.tsx` (`native-tela`) — esvazia na **PR-4**

Cada caso monta a sessão como o `App.tsx` a monta (os gatilhos ligados e o sync da abertura, o executor de verdade contra o
`aceite.py`), avança o relógio 10 min, dirige o `AppState`, a rede e o relógio, e conta os `sync start`.

| caso | esperado | hoje | na lista? |
|---|---|---|---|
| `rede-volta-na-frente` — a rede volta com o app na frente | 1 | 0 | **sim** |
| `fundo-mais-de-30s` — segundo plano por 31 s, com rede | 1 | 0 | **sim** |
| `fundo-menos-de-30s` — por 10 s, sem a marca | 0 | 0 | não |
| `rede-volta-no-fundo` — a rede volta em segundo plano (deixa a marca) | 0 | 0 | não |
| `marca-volta-curta` — a volta em 10 s **com** a marca | 1 | 0 | **sim** |
| `marca-apaga-com-sync` — a marca + um sync que sai à rede (e falha por rede, para o intervalo não mascarar) + a volta curta | 0 | 0 | não |
| `dois-eventos` — a volta depois de 31 s (1 sync) e a rede 2 s depois do fim dele | 1 | 0 | **sim** |
| `volta-sem-rede` — a volta depois de 31 s sem rede: 0 e **nenhum `sync skip`** (nenhuma chamada ao executor) | 0 | 0 | não |
| `sem-sessao` — a rede e o segundo plano fora da sessão | 0 | 0 | não |
| `primeira-leitura` — os gatilhos ligados com a rede de pé e o evento repetido `true → true` | 0 | 0 | não |
| `dentro-do-intervalo` — a rede 10 s depois de um sync | 0 | 0 | não |
| `apos-falha-de-rede` — a rede 5 s depois de um sync com `code=network` | 1 | 0 | **sim** |
| `apos-falha-com-status` — a rede 5 s depois de um sync com 500 | 0 | 0 | não |
| `de-novo-fora-do-intervalo` — o gatilho durante um sync segurado → um segundo sync logo ao terminar | 2 | 1 | **sim** (PR-4, com o voo da PR-2) |
| `tentar-de-novo-fora-do-intervalo` — o *Tentar de novo* 5 s depois de um sync | 1 | 1 | não |
| `falha-de-rede-nao-retenta` — **SY-D32 (4)**: depois de uma falha `code=network`, 60 s sem outro gatilho → só o sync que falhou | 1 | 1 | não |

**SY-D32 (4), a leitura**: o laço não existe. Os dois gatilhos são **eventos** (a transição da rede, a volta do `AppState`);
a falha de um sync não é evento de nenhum dos dois — o `useOnline` vê o estado do Android, não o resultado de uma requisição
(`net.ts:28-38`). E o "de novo" do voo único roda **uma** vez, só se um gatilho chegou durante o voo. O gate fixa isso
(`falha-de-rede-nao-retenta`), e o CN i-3 prova que ele acusa um gatilho que tenta de novo sozinho.

**Não consegue ver** (A9): o que o Android entrega de fato — o portal cativo, a troca Wi-Fi ↔ dados, o evento com o app em
segundo plano, a tela bloqueada como segundo plano — e o JS suspenso em segundo plano. **O aparelho vê na PR-4** (AVD com o
mock; A-SY-12, A-SY-18, A-SY-19).

### (ii) o voo único — `sy-voo.test.ts` (`native`) — esvazia na **PR-2**

| caso | o que mede | hoje | na lista? |
|---|---|---|---|
| `nunca-dois-em-curso` | o máximo de `sync start` sem fim, com um pedido durante o voo | 2 | **sim** |
| `um-de-novo` | dois pedidos durante o voo → 2 syncs, o 2º **depois** do fim do 1º | 3, o 2º antes | **sim** |
| `escrita-setlists-ficam` | a criação de setlist relida no meio do sync fica, na raiz e no `setlists.json` | o sync grava por cima | **sim** |
| `escrita-conteudo-aplica` | o sync que perdeu as setlists aplica o conteúdo (raiz e disco) | aplica | não |
| `escrita-sync-sem-cache-write-setlists` | o sync que perdeu não emite `cache write kind=setlists` | emite 1 | **sim** |
| `logout-descarta` | nenhuma aplicação na raiz depois do logout | 1 | **sim** |
| `logout-cancela-de-novo` | nenhum `sync start` depois do logout | 0 (o 2º correu antes) | não |
| `prazo-libera-o-voo` — **SY-D32** | com o `aceite.py` no `atraso` (45 s), `sync fail … code=network` em até 20 s, e o pedido seguinte roda | nenhuma falha em 21,5 s | **sim** |

**Não consegue ver**: a corrida no aparelho (a ordem de chegada no RN) e o tempo do prazo numa rede de verdade (§5: o
`fetch` do Node não é o do RN). **O aparelho**: a remedida do S1a na PR-2 (SY-D19), o release do encerramento (A-SY-21).

### (iii) a foto — `sy-foto.test.tsx` (`native-tela`) — esvazia na **PR-3**

O palco montado com a rolagem LIGADA (o `requestAnimationFrame` do jsdom anda) e V montada; o "sync" é o re-render com um
`contentById` e uma setlist novos — a setlist passando por `setlistDaSessao`, como o `navigation.tsx` a passará.

| casos na lista (18) | os que passam hoje (fora da lista) |
|---|---|
| palco: `palco-corpo`, `palco-sem-topo` (nenhum `scrollTo` a 0), `palco-rolagem-segue` (*ligada* e andando), `palco-notas`, `palco-titulo`, `palco-nota-da-posicao`, `palco-barra` (o *"1 DE 3"* e o nome), `palco-file-url` (nenhum download do arquivo novo), `palco-musica-apagada-aberta` | `palco-trocar-posicao` (a abertura tira a foto de agora), `palco-musica-apagada-nunca-aberta` (o placeholder de hoje) |
| a sessão: `sessao-indice`, `sessao-fim`, `sessao-busca` (a mesma foto, na lógica do módulo), `setlist-apagada` | `sessao-solta`, `sessao-outra-setlist` |
| V: `v-corpo`, `v-titulo`, `v-detalhes`, `v-notas`, `v-file-url` | `v-estrela-viva` (SY-D21) |

**Não consegue ver**: geometria, o custo do quadro (o §6, no aparelho) e a `Navigation` real — **a ligação da foto da sessão
no `navigation.tsx` se prova no aparelho, na PR-3 (A-SY-17)**, e o G-inv sem pixel novo (A-SY-10).

### (iv) a janela da `naoRegredir` — `sy-nao-regredir.test.ts` (`native`) — esvazia na **PR-2**

O `sincronizar` embrulhado (`vi.mock` que delega ao de verdade): depois de ele devolver e antes de o executor aplicar, o
embrulho solta o `PUT` segurado do favoritar e espera ele terminar — a fronteira da A6.1, em ordem fixa; o `GET /api/content`
do sync segurado também, para a foto do servidor ser de antes do `PUT`.

| caso | hoje `[medido: gates/iv-lista-vazia.txt]` | na lista? |
|---|---|---|
| `janela` — o favoritar NA fronteira | **memória `false`, disco `true`** — exatamente a divergência da A6.1 | **sim** |
| `controle-antes` — o mesmo embrulho, o favoritar terminando antes de o sync ler as confirmadas | memória `true`, disco `true` (a `naoRegredir` cobre) | não — é o controle: o embrulho mede a fronteira, não outra coisa |

**Não consegue ver**: a intercalação natural no RN (não se reproduz no aparelho de forma controlada, A6.1).

### (v) a contagem — `sy-requisicoes.test.tsx` (`native-tela`) — esvazia na **PR-4**

Um servidor no próprio teste, com a página de **100** do handler real (o `aceite.py` pagina em 40, div. 1266). **O controle
do servidor** (um `it` à parte, que precisa passar): a abertura dá **2 GET com 100 músicas e 3 com 101**. Os casos (todos na
lista, 0 hoje): `rede-volta-100` → 2, `rede-volta-101` → 3, `fundo-100` → 2; os downloads contados à parte (as linhas `file
src=download`; o prefetch do arnês é inerte, SY-D30). **Não consegue ver**: o que prod responde — a contagem do release.

### 3.1 A suíte com os gates `[medido: c3-verificacao.txt]`

`Test Files 155 passed | 3 skipped (158)` · `Tests 1892 passed | 59 skipped (1951)`. Contra a `main` (152 · 1910): **+6
arquivos** (o `sy-duplos` e os cinco gates) e **+41 testes** — os 3 dos duplos e os 38 dos gates: (i) 17 (16 casos e o juiz),
(ii) 6 (5 cenários e o juiz), (iii) 7 (6 cenários e o juiz), (iv) 3, (v) 5 (o controle do servidor, 3 casos e o juiz). **Os 34
que reprovam pela lista não aparecem como testes vermelhos**: cada caso guarda o veredito e passa; quem decide é o `it` do
juiz de cada gate, que passa porque *"reprova exatamente a lista esperada"*. Pulados: os mesmos 59 de antes. G1a ✓ (as 4
exceções do commit 2; os testes não são escopo do G1a), G2 124 = 124, G3 70 = 70, os quatro `tsc` 0 (três erros de tipo nos
testes, achados aqui e consertados antes do commit), lint ✔.

## 4. Os controles negativos (regras 4 e 7) `[medido: cn-sy.txt]`

`instrumentos/cn-sy.sh` troca um contrato por uma **planta** (os laboratórios de `instrumentos/plantas/`, que leem a regra
quebrada de `SY_DEFEITO`) ou liga o embrulho de tela do gate (iii) (`SY_PLANTA_TELA=congela`), roda um gate e devolve os
contratos com `git checkout` (o `git status` do fim: vazio). **Com a planta certa**, as linhas declaradas que ela cumpre
aparecem como ÓRFÃS (o esperado); **com um defeito**, o gate tem de acusar a checagem daquela regra.

| CN | a planta · o defeito | o gate acusou |
|---|---|---|
| i-0 | os gatilhos de laboratório, sem defeito | nenhuma reprovação; as 6 declaradas ÓRFÃS — o gate passa com uma implementação das regras |
| i-1 | ignora o intervalo | `dentro-do-intervalo`, `apos-falha-com-status` (e o `dois-eventos`, declarado) |
| i-2 | conta a primeira leitura e a repetição | `primeira-leitura` |
| i-3 | tenta de novo sozinho depois da falha de rede | `falha-de-rede-nao-retenta` (SY-D32 (4)) |
| i-4 | a marca não se apaga por um sync | `marca-apaga-com-sync` |
| i-5 | dispara em segundo plano | `rede-volta-no-fundo` |
| i-6 | ignora a sessão | `sem-sessao` |
| i-7 | não confere a rede na volta | `volta-sem-rede` |
| i-8 | a volta curta sem a marca dispara | `fundo-menos-de-30s`, `marca-apaga-com-sync` |
| i-9 | os gatilhos e o voo de laboratório, sem defeito | nenhuma; as 6 ÓRFÃS |
| i-10 | o voo aplica o intervalo a todo pedido | `tentar-de-novo-fora-do-intervalo` (e, por tabela, `marca-apaga-com-sync`, `apos-falha-com-status`, `falha-de-rede-nao-retenta`) |
| ii-0 | o voo de laboratório, sem defeito | as escritas e o prazo seguem (o laboratório não os tem); `nunca-dois`, `um-de-novo`, `logout-descarta` ÓRFÃS |
| ii-1 | o "de novo" roda depois do logout | `logout-cancela-de-novo` |
| ii-2 | o sync ok não chega à raiz | `escrita-conteudo-aplica` |
| iii-0 | a tela que congela TUDO na montagem | `palco-trocar-posicao`, `palco-musica-apagada-nunca-aberta`, `v-estrela-viva` — e os congelamentos declarados viram ÓRFÃOS |
| iii-1 | a foto da sessão de laboratório, sem defeito | os da sessão e o da barra ÓRFÃOS; os do conteúdo seguem (são da tela, PR-3) |
| iii-2 | a foto da sessão nunca se solta | `sessao-solta` |
| iv-0 | o voo de laboratório (que não aplica no bloco síncrono) | `janela` segue reprovando — o voo sozinho não fecha a janela |
| v-0 | os gatilhos de laboratório | nenhuma; as 3 ÓRFÃS |
| v-1 | dois syncs por evento | os 3 casos (4 e 6 GET) |

**O gate (iv)** é ele mesmo o CN (reprova na `main`), e o `controle-antes` o calibra; o (ii) entra reprovando contra o
executor sem voo, que é o "executor extraído, sem voo" da A9.

**Três consertos de instrumento, achados pela própria saída antes do commit** (div. 1271): (a) o `palco-rolagem-segue`
conferia o rótulo com `endsWith('ligada')`, e *"desligada"* também termina assim; (b) os casos de `file_url` comparavam
`__iniciados()` antes e depois — e o duplo devolve o próprio vetor, não uma cópia: a "lista de antes" crescia junto e o
caso passava **sem medir nada** (*"downloads antes: [a, b] · depois: []"*); (c) o **CN i-3 não acusou** na 1ª corrida: o
caso marcava o começo da janela DEPOIS do assentar do sync que falhava, e a tentativa a mais nascia dentro desse assentar.
Os três são o caso 42 de novo (o CN verde antes do conserto); os três consertados no instrumento, e o `cn-sy.txt` é da
corrida de depois.

## 5. Commit 4 — o prazo de rede (SY-D19, SY-D32) `[lido: prazo-leitura.txt]` `[medido: prazo-medida.txt]`

**O que se leu**: os 20 s (`PRAZO_DE_REDE_MS`, `packages/core/src/escrita.ts:70`) cobrem **a resposta inteira**. O relógio
começa no `prazoDe` (`apps/native/src/api.ts:178`), **antes do `authFetch`** (`:180`) — o token, a renovação dele e a 2ª
requisição de um 401 (`packages/core/src/auth-fetch.ts:62-77`) correm dentro dele (div. 1269). No aparelho, o `fetch` é o
`whatwg-fetch` 3.6.20 sobre XHR (`react-native/Libraries/Network/fetch.js:15`), que **só resolve no `xhr.onload`, com o
corpo inteiro** (`fetch.umd.js:546-561`), e o ouvinte do `abort` fica ligado até o `readyState` 4 (`:625-634`): um corpo que
ainda chega aos 20 s é abortado, vira `networkError` (`api.ts:196-198`) e, no sync, `sync fail … code=network status=-`. O
relógio para de valer quando o último byte chegou (o `clearTimeout` do `finally`, `:199-201`, já não tem o que matar). Cada
requisição tem o seu: o `GET /api/setlists` e cada página de content.

**O que se mediu** (o `api.ts` de verdade, no Node; a fixture do N3):

| medida | resultado |
|---|---|
| (a) o mock normal, n = 10 | `GET /api/setlists` 32.152 B, mediana 1,5 ms · `GET /api/content` p1 25.696 B, mediana 1 ms |
| (b) o mock `atraso` (o S1a) | o `GET /api/content` do sync, sem prazo (hoje): **45.014 ms**, ok · com o prazo do core: **falha em 20.004 ms** (`kind=network`) |
| (c) um servidor que goteja 52.941 B | a 2.000 B/s (26,5 s de corpo): **falha em 20.009 ms, 40.000 B recebidos** · a 4.000 B/s (13,2 s): **ok em 13.052 ms** |

**A conta** (SY-D32 item 1): a página medida no N1 tem **52.941 B com 66 músicas — a conta de AUDIT**
(`N1-PRECHECK-anexos/A3-probe-prod.txt:14-15`). Para caber em 20 s: **2.647 B/s ≈ 21,2 kbit/s** de vazão efetiva do corpo.
Uma página cheia `[hipótese]`: pelo tamanho médio do N1 (802 B por música) ≈ 80.200 B → **4.010 B/s ≈ 32 kbit/s**; pelo da
fixture do N3 (2.141 B por música, corpos mais longos) ≈ 214.100 B → **10.705 B/s ≈ 86 kbit/s**. Com `gzip` no fio, menos
`[hipótese]`. Abaixo do limiar, **todo** sync falha, inclusive o primeiro — cada tentativa baixa a página inteira de novo.

**Errata da pergunta**: a pergunta levada ao Marcel no meio da PR disse *"a página de content da conta principal, N1"*; o
anexo do N1 diz **conta de audit, 66 músicas** (div. 1273). A conta não muda (o limiar é do tamanho, e a conta principal
tinha 63 músicas no QL, §A6.2 do `QL-PRECHECK.md`).

**A diferença de instrumento, declarada** (div. 1270): no Node, o `fetch` resolve no **cabeçalho** — a linha `api status=200
…` sai, e o corpo falha depois (medido em (c)); no aparelho não sai linha `api` nenhuma. Num teste, uma falha por prazo no
corpo aparece como `api status=200` seguida de `sync fail … code=network`; no logcat, só a segunda. **E a duração que o
release mede** (SY-D32 item 2): a linha `api status=… path=/api/content … ms=<ms>` já existe, e **no aparelho o `ms` é a
resposta inteira** — o `t0` é anterior ao `authFetch` (`api.ts:177`) e o `fetch` do RN só resolve com o corpo; nenhum
instrumento novo.

### 5.1 A decisão — SY-D32 `[Marcel, 2026-10-10]`

A condição da SY-D19 valeu (o prazo é da resposta inteira, e uma rede lenta o bastante derruba todo sync, inclusive o
primeiro): **a PR parou e voltou com a pergunta**, com as opções (a) 20 s mesmo, (b) o prazo só do voo, (c) um prazo maior
só nas leituras do sync. A resposta, verbatim:

> **(a) 20 s mesmo**: a SY-D19 (a) fica mantida, com o prazo do core também nas leituras do sync. O caso "sync pendurado →
> falha em até 20 s e o voo se libera" entra no gate (ii) e na lista, para a PR-2 esvaziar; a PR-2 remede o S1a.
> Acréscimos, para registrar como decisão do Marcel (a próxima SY-D livre) no README da PR-1:
> 1. O limiar entra escrito com a conta: a página de 52.941 B pede ~2,6 KB/s (~21 kbit/s) para caber em 20 s. Acrescente a
>    mesma conta para uma página cheia de 100 músicas, pelo tamanho médio por música da fixture ou do N1, como [hipótese].
> 2. O release do encerramento mede a duração real do GET /api/content no Tab, no Wi-Fi do Marcel, em cada sync que ele
>    fizer (pelas linhas de log que já existem; se nenhuma der a duração, diga qual instrumento dá, sem mudar o app). Se
>    alguma passar de 5 s, vira pergunta no encerramento, com a reserva (b) e a (c) na mesa.
> 3. Vira herança, com destino proposto no encerramento: "cada tentativa baixa a página inteira de novo" (sem requisição
>    condicional nem retomada), junto do ETag da SY-D11.
> 4. Confirme no gate (i) que a falha por prazo (code=network) não gera nova tentativa sozinha: a próxima só vem com outro
>    gatilho ou com o Tentar de novo. Se a leitura mostrar um laço, pare e pergunte.
> Siga com a PR-1 a partir do commit 4.

| item | onde está cumprido |
|---|---|
| (a) — o caso no gate (ii) | `ii:prazo-libera-o-voo`, na lista (§3) |
| 1 — o limiar com a conta | §5, "A conta" (e `prazo-leitura.txt` §4) |
| 2 — a duração do `GET` no release | a linha `api … ms=` já a dá no aparelho (§5); o aceite **A-SY-21** (§9), no encerramento |
| 3 — a herança | registrada (§9.1), com o ETag da SY-D11; o destino se propõe no encerramento |
| 4 — sem laço | lido (§3, (i)) e fixado no gate (`falha-de-rede-nao-retenta`), com o CN i-3; **nenhum laço** |

## 6. Commit 5 — o "antes" do custo do sync com o palco aberto (SY-D6, SY-D20; A3)

### 6.1 O aparato `[medido: avd/]`

- **O AVD `octavia_tab32`**, subido do `default_boot` com `-no-snapshot-save` (o `ram.bin` de 2026-09-24 14:00 no começo e
  no fim). **O estado lido antes e depois** (`avd/estado-antes.txt`, `avd/estado-depois.txt`; o `diff` sem a linha da data:
  vazio): `stay_on=1 accel=1 user_rot=0`, `airplane=1 wifi=0 data=0`, `reverse` vazio, o dev client de 2026-09-24 14:00:01 com
  `DEBUGGABLE`, o app parado, **`ping` → `connect: Network is unreachable`**.
- **O rádio ligado só nas rodadas** (div. 1264; o APARATO, div. 418; a decisão do QL-PR3, div. 1212): avião desligado, Wi-Fi e
  dados ligados, `ping` respondendo (`avd/radio-ligado.txt`); no fim, na ordem inversa, e o `ping` de novo inalcançável.
- **A receita do cache sem dado real** (N4-D102, regra 35): a conta de audit tinha 5 caminhos no AVD, guardados por cópia
  md5 a md5 e tirados por nome (`avd/receita-guardar.txt`); **depois** o mock, os túneis e o bundle conferido; no fim, apagado
  por nome o que a fixture criou (`partitura-12p.pdf`) e os 5 regravados md5 a md5 (`avd/receita-regravar.txt`).
- **O bundle servido**, antes de qualquer abertura (regra 13 ampliada, `avd/bundle-servido.txt`): `localhost:8788` 1 ·
  `octavia.rocks` 0 · o módulo `src/sincronizador.ts` 3 (o código desta PR). O Metro sem `CI=1`, `--clear`,
  `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; o `apps/native/.env` por `cp -p` do checkout principal **sem
  abrir** (sha256 `f2bfa179cd8e` nos dois, `avd/env-sha.txt`), apagado no fim. O mock (8788) e o servidor de arquivos (8790,
  os PDFs da fixture do N3) de pé só na sessão.
- **As fixtures** (`instrumentos/fixture-sy.py`): a da QL-PR4 em duas versões, A e B, que diferem **só no corpo da "Letra
  longa da fixture"** (107 linhas; B troca `a` por `e`: as mesmas colunas) — o sync que troca A por B refaz o corpo da música
  aberta, o pior caso da A3. **As setlists iguais**, de propósito: com a setlist mudada, o efeito de troca do palco para a
  rolagem e volta ao topo (o defeito que o gate (iii) mede), e a medida do custo perderia a rolagem; aqui ela segue andando
  depois do sync (o `uiautomator` mostra ~2.300 px andados na janela do sync).
- **O caminho de cada rodada** (`instrumentos/custo.py`, o da A3): o mock no `atraso` servindo a fixture que o cache NÃO tem;
  a abertura fria; S1 → a setlist → a posição 3 → o palco, o zoom 26; o sensor instalado; a rolagem ligada 3 s depois do 200
  das setlists; o `uiautomator events` de pé; o `sync ok` e mais 16 s. **10 rodadas**, alternando B e A, e **2 de controle sem
  o `uiautomator events`**. As quedas (regra 36): `logcat -c` uma vez, antes da rodada (`-G 16M`), e o `quedas.py` no fim —
  **Java 0 · nativa 0 · tombstones 0** (`avd/quedas.txt`).
- **O sensor** (`instrumentos/sensor-quadros.mjs`): um laço de `requestAnimationFrame` posto no Hermes do app pelo inspetor do
  Metro, sem mudar o app, gravando o instante de cada quadro em ms de época (para casar com o `logcat -v epoch`).
  **O `dumpsys gfxinfo` não serve** (A3): mede a thread de UI, que segue desenhando com o JS travado.

**Os controles do sensor** (o prompt: sem os dois, o número do "antes" não se lê):

| controle | resultado |
|---|---|
| **(a)** uma tarefa plantada que trava o JS por 200 ms (`sensor … travar 200`, nas rodadas 1–3, e no ensaio) | o sensor a vê com o tamanho dela: **207,3 · 204,1 · 207,5 ms** (e **205,0** no ensaio), o quadro que a fecha 1–2 ms depois do fim dela |
| **(b)** a rolagem ligada **sem** sync, a mesma duração (20 s), nas mesmas rodadas | o PISO, abaixo |
| **(c)** *(a mais, declarado)* as rodadas **sem** o `uiautomator events` (ele também usa a thread de UI) | o mesmo desenho: sync **375,0 · 346,0 ms**, piso **50,2 · 213,7 ms** (`avd/custo-analise-sem-eventos.txt`, n = 2 — medido duas vezes, não é referência) |

### 6.2 O SYNC — a janela `[t_ok − 5 s, t_ok + 15 s]` `[medido: avd/custo-analise.txt]`

| rodada | quadros | **maior intervalo (ms)** | > 16,7 ms | > 50 ms | **> 100 ms** | a rolagem pelo `uiautomator` (eventos · maior lacuna · andou) |
|---|---|---|---|---|---|---|
| r01 | 1038 | **285,7** | 609 | 7 | **5** | 438 · 290 ms · 2324 px |
| r02 | 1025 | **363,5** | 599 | 7 | **6** | 439 · 433 ms · 2295 px |
| r03 | 1037 | **339,5** | 596 | 8 | **6** | 447 · 330 ms · 2325 px |
| r04 ⚠ | 990 | **524,0** | 572 | 20 | **4** | 411 · 439 ms · 2202 px |
| r05 | 1047 | **360,4** | 638 | 5 | **4** | 451 · 244 ms · 2351 px |
| r06 | 1033 | **354,9** | 615 | 9 | **5** | 438 · 296 ms · 2322 px |
| r07 | 1056 | **288,7** | 618 | 9 | **5** | 451 · 279 ms · 2361 px |
| r08 | 1041 | **311,7** | 628 | 7 | **4** | 446 · 213 ms · 2338 px |
| r09 | 1063 | **322,6** | 625 | 4 | **4** | 450 · 334 ms · 2376 px |
| r10 | 1046 | **301,2** | 619 | 9 | **5** | 447 · 199 ms · 2338 px |
| **n = 10** | | **mediana 331,1** (285,7–524,0) | 58,7 % | mediana 7,5 | **mediana 5 (4–6); em 10 de 10** | lacuna: mediana 293 ms (199–439) |

⚠ **r04: o host carregado** (div. 1276): a janela do sync dele (23:05:13–23:05:33) cruzou a corrida local dos gates do web
(começou às 23:05:17, `gates-web.txt`), e o emulador divide a CPU do Mac — 20 intervalos > 50 ms e o maior de 524 ms. **Sem
a r04 (n = 9)**: maior intervalo mediana **322,6 ms** (285,7–363,5), > 100 ms mediana 5 (4–6). O número da rodada fica na
tabela, marcado; a conclusão não muda.

### 6.3 O PISO — a rolagem ligada, sem sync: `[t_setlists + 10 s, t_setlists + 30 s]`

| rodada | quadros | **maior intervalo (ms)** | > 16,7 ms | > 50 ms | **> 100 ms** | a rolagem pelo `uiautomator` |
|---|---|---|---|---|---|---|
| r01 | 1114 | **48,0** | 629 | 0 | **0** | 457 · 132 ms · 2484 px |
| r02 | 988 | **284,5** | 594 | 15 | **10** | 422 · 297 ms · 2214 px |
| r03 | 1102 | **178,4** | 643 | 3 | **1** | 464 · 141 ms · 2462 px |
| r04 | 1096 | **89,8** | 637 | 1 | **0** | 461 · 131 ms · 2453 px |
| r05 | 1074 | **110,1** | 641 | 6 | **1** | 458 · 143 ms · 2403 px |
| r06 | 1086 | **44,3** | 632 | 0 | **0** | 456 · 129 ms · 2430 px |
| r07 | 1080 | **270,0** | 648 | 3 | **1** | 456 · 126 ms · 2407 px |
| r08 | 1098 | **59,0** | 652 | 2 | **0** | 461 · 195 ms · 2459 px |
| r09 | 1099 | **49,2** | 638 | 0 | **0** | 465 · 129 ms · 2473 px |
| r10 | 1099 | **57,1** | 629 | 2 | **0** | 469 · 133 ms · 2457 px |
| **n = 10** | | **mediana 74,4** (44,3–284,5) | 58,3 % | mediana 2 | **mediana 0 (0–10); em 4 de 10** | lacuna: mediana 133 ms (126–297) |

**A leitura** `[hipótese, que os números sustentam]`:

- **O sync custa, e custa num bloco**: em toda rodada, logo depois do `sync ok`, ~1 s com quatro paradas seguidas da thread de
  JS de 150–520 ms; no piso, a rolagem anda quadro a quadro, e paradas acima de 100 ms são raras (mediana 0) e esparsas.
- **O que cada passo custou** — o instrumento separa pela ordem e pelas linhas `OCTAVIA:` saídas dentro de cada parada (a
  última tabela do `avd/custo-analise.txt`), com as medianas das 10 rodadas:

  | # | onde, contra o `sync ok` | o intervalo (mediana · faixa) | as linhas dentro dele | o passo da A3 `[hipótese]` |
  |---|---|---|---|---|
  | 1 | +58 a +106 ms | **175 ms** · 137–245 | `cache write kind=setlists`, `cache write kind=content`, `sync ok`, `prefetch plan … reason=library` (e, em 3 rodadas, o `api status=200 path=/api/content`) | o fim síncrono do sync: a leitura do corpo, o `reconcile`, **a gravação síncrona** (os dois `JSON.stringify` e os `.tmp`/`move`) e o plano — **o candidato da A3, confirmado como uma tarefa só** |
  | 2 | +312 a +615 ms | **317 ms** · 240–524 | nenhuma | a troca da raiz: o `setDados` e o render de toda tela montada — o palco refazendo o corpo novo (107 linhas, a quebra do QL) e S1 por baixo |
  | 3 | +464 a +879 ms | **200 ms** · 145–263 | `prefetch plan … reason=demand`, os `download-error` dos dois 404 da fixture | o prefetch sob demanda do palco (o efeito que depende do `contentById`), e o render que ele provoca |
  | 4 | +665 a +1154 ms | **211 ms** · 156–275 | nenhuma (uma vez, um `download-error`) | o render seguinte (o `recarregarArquivos` do fim do `prefetchEArrumar`: o LRU e o `setFilesPresent`) |

- **O que a foto pode tirar e o que não pode** `[hipótese]`: a foto (PR-3) evita o corpo refeito no palco (parte do passo 2) e
  a troca da barra; **não tira o passo 1** (a gravação síncrona: ~175 ms de mediana, nenhuma rodada abaixo de 137 ms) nem o
  render da raiz e de S1, nem, se o prefetch do palco seguir lendo o `contentById` vivo, o passo 3. **Com o critério candidato
  literal ("nenhum intervalo > 100 ms"), o passo 1 sozinho reprova o "depois"** neste instrumento — e aí a SY-D6 vira o
  "nenhum gatilho com o palco aberto". É o que a Q4 (§8) põe na mesa.
- **O instrumento mede o dev client** (QL-D61): o bundle de desenvolvimento, sem minificar, com o React em modo de
  desenvolvimento — o release é mais rápido `[hipótese, sem medida: o release não tem inspetor]`. O mesmo vale para o "depois"
  da PR-3, que se compara com este "antes" no MESMO instrumento.
- **O limiar de 16,7 ms não separa nada no AVD** (div. 1275): ~58 % dos intervalos passam dele **também no piso** (o quadro do
  emulador oscila em torno de 16,6–17 ms). Os limiares que separam são 50 e 100 ms.
- **Ligar a rolagem custa ~600 ms** até o primeiro quadro, em todas as rodadas (`autoscroll on t=589…621`, nos logcats) — fora
  das janelas, e é o render do palco com a Letra longa no dev client; registro de contexto, não do sync.
- **O `uiautomator events`** (o instrumento que também roda no release): a maior lacuna entre eventos de rolagem é **293 ms
  de mediana no sync** contra **133 ms no piso** (a resolução dele é a do evento de acessibilidade, ~100 ms `[hipótese]`) — ele
  vê o bloco, mais grosso. É o instrumento da regra 38 e do release (SY-D20).

### 6.4 O Tab S6 — não medido nesta PR (a parada do prompt)

O prompt: *"se medir no Tab exigir … apagar dados do app … pare antes de tocar no Tab e pergunte, entregando o que tem do
AVD"*. **Exige**: o Tab repousa com o release `ea5e891` e a sessão do Marcel; medir é o dev client por `install -r` (mantém
dados e sessão, div. 372) **e a receita do cache da N4-D102** — guardar por cópia e **apagar do aparelho, por nome,** o cache
real (os três `.json` e os arquivos) durante o mock, regravando md5 a md5 no fim —, além do destravar (que é do Marcel, com o
`stay_on` a 7 antes). **O Tab não foi tocado**: estava ligado por USB a sessão inteira (aparece no `adb devices`), e todo
comando `adb` levou `-s emulator-5554`. **Pergunta Q6** (§8).

## 7. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` copiado por `cp -p` e conferido por sha256 (`f2bfa179cd8e`), **sem abrir**, e apagado no fim |
| requisições a terceiros | **0** renovações de token no AVD (`auth refresh=cached` 27 · `forced` 0, `avd/logcat-contagem.txt`): nenhuma ida ao Google; o inspetor do Metro é local |
| requisições do app ao mock | 26 linhas `api` no AVD, **todas** `path=/api/setlists` ou `/api/content` ao `localhost:8788` (13 syncs × 2); `octavia.rocks` no logcat inteiro: **0** |
| AVD `octavia_tab32` | começo e fim **iguais** (§6.1; o `diff` vazio): conta de audit, avião provado pelo `ping`, sem túneis, app parado, dev client de 2026-09-24, `ram.bin` intacto (`-no-snapshot-save`); a receita do cache (5 caminhos, md5 a md5); 14 aberturas do app (1 do sync inicial — com o ensaio do sensor dentro dela —, 1 da corrida que caiu, div. 1274, 10 rodadas e 2 de controle); **0 quedas** (Java, nativa, tombstones) |
| Tab S6 | **não tocado** (§6.4) — ligado por USB a sessão inteira; todo `adb` com `-s emulator-5554` |
| builds | nenhum (o dev client do AVD é o de 2026-09-24; nenhum módulo nativo novo) |
| processos no host | o Metro (8081), o mock (8788), o servidor de arquivos (8790) — derrubados no fim; **dois `aceite.py` da 1ª corrida do instrumento do prazo** (a que lançou no `s.connect`) ficaram de pé até o fim e foram derrubados (`avd/fim.txt`) |
| GitHub | `git fetch origin`; o push da branch, a abertura da PR e a leitura dos checks (§11) |
| agentes | **0** |
| a árvore | `../octavia-sy-pr1` criada sobre `origin/main` (`f4f4231`); `pnpm install --frozen-lockfile --offline`; a `../octavia-sy-precheck` (da #378, mergeada) **não foi removida** nesta sessão — fica para a sessão da PR-2, sem `--force` |
| os CN | trocaram `gatilhos.ts`, `sincronizador.ts` e `foto-do-palco.ts` por um instante e os devolveram com `git checkout` (o `git status --short -- apps/native/src` do fim do `cn-sy.txt`: vazio) |
| temporários | no scratchpad da sessão, fora do repositório: as fixtures, a cópia do cache da audit (guardada e regravada), o bundle baixado, as saídas da suíte |
| perguntas ao Marcel nesta sessão | 1 — o prazo (SY-D19 → SY-D32, §5.1) |
| regra 4 do catálogo sobre os anexos | `grep -rn eyJ` e `grep -rln <email>` nos anexos: nenhuma linha |

## 8. As perguntas para o aval

Numeradas, com opções e recomendação. **O executor prepara; quem decide é o Marcel.**

**Q1 — a forma do contrato dos gatilhos** (§2). (a) **como está**: `ligarGatilhos({ sessao, pedirSync, ultimoSyncNaRede }) →
desligar`, com o `AppState` e o `expo-network` assinados DENTRO do módulo, e o `ultimoSyncNaRede` vindo do executor (a PR-2 o
expõe; o gate o lê das linhas, que é a definição da A2.4); (b) os gatilhos recebendo também as fontes (`appState`, `rede`)
pela ligação, em vez de importá-las. **Recomendo (a)**: é a forma que o gate (i) e o laboratório já exercem (os 16 casos e os
8 defeitos do CN), e o `AppState` só existe no `native-tela`, onde o duplo entra por alias — injetar as fontes não ganha teste
novo e afasta o módulo do jeito como o app assina hoje (`net.ts`).

**Q2 — a forma da foto da sessão** (§2). (a) **como está**: `criarFotoDaSessao() → { entrar(id, achar), setlistDaSessao(id,
achar), sair() }`, um objeto por sessão de navegação, com a busca da setlist viva passada como função (o `acharSetlist` do
`navigation.tsx`); (b) a foto como estado de React (um contexto acima do `Stack`). **Recomendo (a)**: o `native-tela` monta a
lógica sem a `Navigation` (SY-D22), e o `navigation.tsx` só a chama nos três lugares que já leem a setlist (o palco, o índice,
o fim e a busca); a ligação se prova no aparelho (A-SY-17).

**Q3 — o voo: sem contrato no core nesta PR, e a entrada do executor** (§2). (a) **como está**: a PR-2 mantém
`rodarSync(raiz, uid, anterior)` como a entrada de todo pedido (a abertura, o *Tentar de novo*, os gatilhos) e põe o voo atrás
dela, com o `sessaoAtual` obrigatório; a máquina pura no core nasce na PR-2 (SY-D25) com os testes de unidade dela; (b) a
PR-1 já criar `packages/core/src/voo.ts` (o tipo e a assinatura). **Recomendo (a)**: o gate (ii) mede o voo pela entrada do
executor e pelas linhas do log — que é o que o aceite no aparelho mede —, e um contrato no core sem gate que o importe seria
superfície declarada sem uso.

**Q4 — o critério do custo com o palco aberto (SY-D6, SY-D20)**, com os números do §6 na mão (AVD, dev client, n = 10):
o SYNC tem **mediana 331 ms** de maior intervalo e **mediana 5 intervalos > 100 ms** (em 10 de 10 rodadas); o PISO tem **74 ms**
e **0** (mas com algum intervalo > 100 ms em 4 de 10 rodadas). O passo 1 (a gravação síncrona) custa ~175 ms e a foto não o
tira.

- (a) **o candidato literal**: *"nenhum intervalo acima de 100 ms durante o sync, n ≥ 10"*. O "antes" reprova 10 de 10; mas o
  **piso do AVD também reprova em 4 de 10**, e o passo 1 sozinho reprova o "depois" — no AVD do dev client, (a) decide a
  SY-D6 pelo **"nenhum gatilho com o palco aberto"** antes de medir a foto.
- (b) **relativo ao piso das mesmas rodadas** (o que o sync ACRESCENTA): *"na janela do sync, a mediana (n ≥ 10) do número de
  intervalos > 100 ms ≤ a do piso + 1, e a mediana do maior intervalo ≤ 2 × a do piso"* — o "antes": 5 contra 0 + 1, e 331
  contra 2 × 74 = 149: **reprova**; mede o sync e não o ruído do aparelho.
- (c) **pelo instrumento que também vale no release** (o `uiautomator events`, SY-D20): *"a maior lacuna de rolagem na janela
  do sync ≤ a mediana do piso + 100 ms, n ≥ 10"* — o "antes": 293 contra 133 + 100 = 233: **reprova**; é o único que o
  release do encerramento pode remedir (QL-D61).

**Recomendo (b) para a decisão da PR-3, com (c) registrado para o release**, e o mesmo instrumento, as mesmas janelas e o host
sem carga (div. 1276) no "depois". Se o Marcel preferir (a), a consequência fica escrita aqui: o "depois" no AVD do dev
client tende a reprovar pelo passo 1, e a PR-4 implementaria o "nenhum gatilho com o palco aberto; marcado, roda ao sair".

**Q5 — o congelamento dos aceites A-SY-1…A-SY-22** (§9), com os critérios escritos contra as linhas da lista. **Recomendo
congelar como está.**

**Q6 — o "antes" no Tab S6** (§6.4: a medida exige a receita do cache, que apaga por nome o cache real durante o mock, e o
destravar do Marcel). (a) **o "antes" do Tab na PR-3**, na mesma ida ao Tab do "depois" (as duas medidas no mesmo dia, o
mesmo dev client, a receita uma vez só), com o Marcel destravando; (b) uma sessão só para o "antes" do Tab, antes da PR-3; (c)
só o AVD nas duas pontas. **Recomendo (a)**: a comparação que decide a SY-D6 é antes × depois no MESMO aparelho, e na PR-3 o Tab
já é obrigatório (A-SY-10, A-SY-17).

**Q7 — "os dois juntos" da A2.3** (div. 1267): o gate lê (a) **o segundo depois do fim do primeiro → 1 (o intervalo)**, e o
segundo DURANTE o primeiro → 2 (o "de novo"); (b) "um sync" também no segundo caso (o "de novo" não roda se o segundo evento
for do outro gatilho). **Recomendo (a)**: é o que a SY-D9 e a SY-D18 dizem juntas, e o (b) precisaria de uma regra nova.

**Q8 — o controle negativo de tela por chave no próprio gate** (§4, CN iii-0): o `sy-foto.test.tsx` lê `SY_PLANTA_TELA=congela`
e embrulha o palco e V num componente que congela tudo — a planta mora no arquivo do gate, desligada por padrão (o CI não a
liga). (a) **aceitar**; (b) mover o embrulho para um arquivo de anexo copiado sobre o gate pelo `cn-sy.sh`, como as outras
plantas. **Recomendo (a)**: copiar um gate de 300 linhas para trocar duas linhas é mais frágil que a chave, e o juiz imprime a
planta quando ela está ligada.

## 9. Os aceites A-SY-*n* — a lista proposta para congelar

Os candidatos da A10 (A-SY-1…A-SY-20), com o critério de cada um escrito contra os gates desta PR, e **dois novos** que a
SY-D32 pede (A-SY-21) e que a leitura do prazo abriu (A-SY-22). **Proposta: congelar no aval desta PR** (SY-D20, SY-D29).

| # | o quê | o critério (o que fecha) | PR |
|---|---|---|---|
| **A-SY-1** | (i) os gatilhos | as 6 linhas `i:` saem da lista e os 16 casos passam (inclusive `falha-de-rede-nao-retenta`, SY-D32 (4)); os CN i-1…i-8 seguem acusando com o laboratório | PR-4 |
| **A-SY-2** | (ii) o voo único | `ii:nunca-dois-em-curso` e `ii:um-de-novo` saem; o voo no core com testes de unidade próprios (SY-D25) | PR-2 |
| **A-SY-3** | as escritas | `ii:escrita-setlists-ficam` e `ii:escrita-sync-sem-cache-write-setlists` saem; `ii:escrita-conteudo-aplica` segue passando | PR-2 |
| **A-SY-4** | (iv) a janela | `iv:janela` sai; `iv:controle-antes` segue passando; nenhuma mudança no `updated_at`, na `naoRegredir` nem no `reconcile` (SY-D26) | PR-2 |
| **A-SY-5** | o prazo nas leituras do sync (SY-D19, SY-D32) | `ii:prazo-libera-o-voo` sai (`sync fail … code=network` em ≤ 20 s, e o pedido seguinte roda); a errata do comentário do `api.ts:157-162`; **o S1a remedido no aparelho** (o estado capturado antes dos 20 s) | PR-2 |
| **A-SY-6** | (iii) a foto no palco | as 9 linhas `iii:palco-*` saem; `palco-trocar-posicao` e `palco-musica-apagada-nunca-aberta` seguem passando | PR-3 |
| **A-SY-7** | (iii) a foto em V | as 5 linhas `iii:v-*` saem; `v-estrela-viva` segue passando | PR-3 |
| **A-SY-8** | o apagado com o palco aberto (SY-D23) | `iii:setlist-apagada` e `iii:palco-musica-apagada-aberta` saem | PR-3 |
| **A-SY-9** | o custo com a rolagem (SY-D6) | o "antes" (esta PR, §6) e o "depois da foto" (PR-3), **com o mesmo instrumento e as mesmas janelas**, n ≥ 10 por aparelho; o critério congelado no aval desta PR (§8, Q4); a decisão da SY-D6 no aval da PR-3 | PR-1 (antes), PR-3 |
| **A-SY-10** | nenhum pixel novo | o G-inv B5 e B3 iguais nos dois aparelhos, sem errata | PR-3 |
| **A-SY-11** | (v) a contagem | as 3 linhas `v:` saem (2 GET até 100 músicas, 3 com 101); downloads à parte | PR-4 |
| **A-SY-12** | os gatilhos no AVD | avião desligado com o app aberto → 1; segundo plano > 30 s → 1, < 30 s → 0; dentro do intervalo → 0 — pelas linhas `sync trigger` e `api` | PR-4 |
| **A-SY-13** | o G3 70 → 71 | a linha `sync trigger …` declarada como adição (SY-D28) | PR-4 |
| **A-SY-14** | o release | 100 + 100 aberturas frias, 0 queda nativa (regra 36) | encerramento |
| **A-SY-15** | a regra 38 (c)/(d) remedida no Tab | a contagem declarada antes (SY-D27: o texto final volta ao aval) | encerramento |
| **A-SY-16** | o julgamento do Marcel (SY-D16) | o texto não muda e a rolagem não para; ao sair e voltar, o texto novo | encerramento |
| **A-SY-17** | a ligação da foto da sessão no aparelho (SY-D22) | o palco, o índice, o fim e a busca com a mesma setlist depois de um sync que a muda; solta ao voltar a S1/S2 | PR-3 |
| **A-SY-18** | a tela apagada/bloqueada com o app na frente (SY-D17 (2)) | medido: conta como segundo plano no `AppState`? | PR-4 |
| **A-SY-19** | o evento de rede com o app em segundo plano (SY-D17 (2)) | medido: chega ao JS? | PR-4 |
| **A-SY-20** | a prova da extração (SY-D29) | o commit próprio, G3 70 = 70, a suíte igual, a declaração do G1 no corpo da PR — **cumprido nesta PR** (§1) | PR-1 |
| **A-SY-21** | *(novo, SY-D32 item 2)* a duração do `GET /api/content` no Tab, no Wi-Fi do Marcel | em cada sync do release, o `ms=` da linha `api status=… path=/api/content` (no aparelho, a resposta inteira, §5); **algum > 5 s → pergunta no encerramento**, com a (b) e a (c) da SY-D19 na mesa | encerramento |
| **A-SY-22** | *(novo, div. 1270)* o prazo visto no aparelho | na remedida do S1a, o logcat da falha por prazo: `sync fail … code=network` **sem** linha `api` antes (o que o Node não mostra) | PR-2 |

### 9.1 As heranças que esta PR registra

| herança | origem | destino proposto |
|---|---|---|
| **"Cada tentativa baixa a página inteira de novo"** (sem requisição condicional nem retomada) — abaixo de ~21 kbit/s, todo sync falha | SY-D32 item 3 | proposto no encerramento do SY, **junto do ETag da SY-D11** (o site e o backend: fora do SY) |
| a frase do placeholder para a música apagada nunca aberta (*"ainda não foi sincronizada"*) | SY-D23 (c) (já registrada no pre-check) | o encerramento do SY |

## 10. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# SY-PR1: a extração literal do rodarSync (App.tsx → src/sincronizador.ts, SY-D29) e os contratos inertes (src/gatilhos.ts, src/foto-do-palco.ts; o sessaoAtual opcional do RaizDoSync).
g1a: apps/native/App.tsx
g1a: apps/native/src/sincronizador.ts
g1a: apps/native/src/gatilhos.ts
g1a: apps/native/src/foto-do-palco.ts
```

```gates-web
# SY-PR1: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado (a PR toca só apps/native e docs).
```

Sem recuo nas linhas de dentro (a nota do §7 do `SY-PRECHECK.md`: o recuo vira parte da chave). **Nenhuma errata do G3** (70 =
70 em todo commit) e **nenhum par do G1b** (os testes do core não mudam). A saída do extrator sobre este bloco está em
`c3-verificacao.txt` (as quatro linhas `g1a:`), e a do CI no §11.

## 11. Os checks da PR

*(Preenchido no commit seguinte a este, depois de o CI do head de código terminar — a regra 18: o push de docs só depois do APK
verde.)*

## 12. Divergências — 1264 a 1276

A última usada era a **1263** (`SY-PRECHECK.md` §5) `[medido: git grep -ohE "^\| \*\*12[0-9]{2}\*\*" -- docs | sort | tail →
1263; nenhum número ≥ 1264 em prosa fora destes anexos]`. Origem: **P** premissa do prompt · **D** documento anterior · **A**
ambiente, dado real ou defeito do produto · **T** toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1264** | P | *"O AVD primeiro. Dev client + mock, em avião"*: em avião o app se vê sem rede e faz `sync skip reason=offline` — não lê o mock, e não há sync para medir (a div. 1212 do QL, a mesma) | o caminho do APARATO e da decisão do QL-PR3 (div. 1212): **o rádio ligado só nas rodadas**, o avião no repouso provado pelo `ping` no começo e no fim; o bundle servido conferido antes de qualquer abertura (`localhost:8788` 1 · `octavia.rocks` 0) e o logcat da rodada sem `octavia.rocks` (§6, §7) |
| **1265** | D | A tabela da A9 põe os gates (i) e (v) no projeto `native` (`sy-gatilhos.test.ts`, `sy-requisicoes.test.ts`): os gatilhos assinam o `AppState`, que é do `react-native`, e só o `native-tela` troca o `react-native` pelo duplo (onde o prompt mandou pôr o `AppState`) | os dois no `native-tela` (`.tsx`); o (ii) e o (iv) no `native`, como a A9 |
| **1266** | D | A A9, o gate (v): *"`sy-requisicoes.test.ts`, `native`, com o mock"*, *"2 com ≤ 100 músicas, 3 com 101"*: o `aceite.py` pagina em **40** (`_paginas`, para os aceites A21/A22 terem duas páginas), e com ele 100 músicas são 4 GET | um servidor no próprio teste com a página de 100 do handler real, e o controle dele (a abertura: 2 com 100, 3 com 101); o `aceite.py` não muda |
| **1267** | D | A A2.3: *"os dois juntos → **um** sync: o que chegar primeiro dispara; o segundo cai no voo único ('de novo') se o primeiro ainda corre, ou no intervalo se já terminou"* — com o voo, o segundo DURANTE o primeiro é um "de novo": **dois** syncs, não um | o gate fixa as duas leituras sem contradição: `dois-eventos` (o segundo depois do fim → 1, pelo intervalo) e `de-novo-fora-do-intervalo` (durante → 2); **pergunta Q7** |
| **1268** | D | A div. 1144 / N4-D117: *"nenhum projeto do `vitest.config.mts` inclui `docs/`"* — o projeto `web` coleta todo `.test.ts` fora de `apps/` e `packages/`, **inclusive em `docs/`**: o instrumento do prazo, nomeado `prazo.test.ts`, entrou na suíte do repositório (`153` arquivos, `1 failed`, `[medido]` na verificação do commit 1 antes do conserto) | renomeado `prazo-medida.ts`, com o `vitest.config.mts` próprio (o cabeçalho diz por quê); a frase da 1144 vale só para nome que não é de teste — herança do W5 (o mesmo bloco que leva os testes do core para dentro do core) |
| **1269** | A | O relógio do prazo de rede começa ANTES do token (`api.ts:178`, o `authFetch` em `:180`): o `getIdToken` — e a renovação, que vai ao Google — e a 2ª requisição de um 401 (`auth-fetch.ts:62-77`) gastam os mesmos 20 s | registrado para a PR-2 (o prazo nas leituras do sync herda isto) e para o A-SY-21 (a duração do release mede o mesmo trecho) |
| **1270** | T | O `fetch` do Node (os testes) resolve no CABEÇALHO; o do RN (o aparelho), com o corpo inteiro: num teste, a falha por prazo no meio do corpo sai como `api status=200 …` e depois `sync fail … code=network`; no aparelho não sai linha `api` nenhuma (`prazo-medida.txt`, (c)) | declarado no `sy-voo.test.ts` e no §5; **A-SY-22** (a PR-2 confere a forma do aparelho na remedida do S1a) |
| **1271** | T | Três instrumentos desta PR passaram sem medir, achados pela própria saída antes do commit (o caso 42 de novo): (a) `endsWith('ligada')` aceita *"desligada"*; (b) o `__iniciados()` do duplo devolve o próprio vetor — a "lista de antes" crescia junto, e os dois casos de `file_url` passavam vazios; (c) o CN i-3 não acusou: a janela do caso começava depois do assentar do sync que falhava | consertados no instrumento (o rótulo igual; a cópia `[...__iniciados()]`; a janela antes do sync), e o `cn-sy.txt` é da corrida de depois (§4) |
| **1272** | T | O `Mock.servir` (o `test/mock.ts`) só dá o mock por pronto quando um `GET /api/setlists` responde: no modo `atraso` isso leva 45 s, e o caso do prazo estourava os 60 s do teste antes de começar | o `sy-voo.test.ts` sobe o `atraso` numa porta própria, pronto quando o socket aceita (`subirCru`); o `mock.ts` não muda |
| **1273** | D | A pergunta da SY-D19 levada ao Marcel no meio desta PR disse *"52.941 B (a página de content da conta principal, N1)"*: o anexo do N1 diz **conta de audit, 66 músicas** (`A3-probe-prod.txt:14-15`) — a leitura do documento pelo executor | corrigido no instrumento, no `prazo-leitura.txt` e no §5 (a errata da pergunta); a conta do limiar não muda |
| **1274** | T | A 1ª corrida do `custo.py` caiu na 1ª rodada: o `uiautomator dump` durante a abertura fria não gravou nada (a tela ainda não estava ociosa) e o parser do XML lançou — com o app aberto e um sync contra a fixture B no mock | parado (o mock derrubado → `sync fail … code=network`; `force-stop`), o cache conferido ainda com A (nenhum `updated_at` de B no `content.json`), o `dump` passou a repetir até achar a tela; a corrida de verdade é a segunda (§6) |

| **1275** | A | No AVD, **~58 % dos intervalos entre quadros passam de 16,7 ms também no piso** (o quadro do emulador oscila em torno de 16,6–17 ms): o limiar de 16,7 ms que o prompt pede não separa o sync do ruído deste aparelho | os números ficam nas tabelas (§6.2, §6.3); a leitura e a proposta de critério usam 50 e 100 ms (§8, Q4) |
| **1276** | T | A rodada r04 teve a janela do sync (23:05:13–23:05:33) cruzada pela corrida local dos gates do web (23:05:17): o emulador divide a CPU do Mac, e a rodada saiu com 20 intervalos > 50 ms e o maior de 524 ms | marcada na tabela (⚠) e as medianas também sem ela (n = 9); nenhuma outra corrida pesada do host cruzou uma janela (a dos gates existentes, às 23:06:08–16, caiu antes do piso da r05; conferido pelos horários dos anexos); **para o "depois" da PR-3: nenhuma carga no host durante as rodadas** |

**Contagem** `[medido: a coluna]`: **13 — P 1 · D 5 · A 2 · T 5** (P: 1264 · D: 1265, 1266, 1267, 1268, 1273 · A: 1269, 1275 ·
T: 1270, 1271, 1272, 1274, 1276). **A próxima livre é a 1277.**
