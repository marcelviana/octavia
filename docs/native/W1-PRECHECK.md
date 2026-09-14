# W1-PRECHECK.md — pre-check do conserto da garantia offline

> **Data**: 2026-09-14. **Commitado pela PR do W1** (o commit 10, `docs(W1)`), como a
> regra permanente do `CLAUDE.md` manda — o bruto entra como anexo do próprio bloco, no
> mesmo commit do encerramento. Nasceu como rascunho não commitado, na árvore
> `/Users/marcelviana/projects/octavia-w1` (`git worktree add --detach ../octavia-w1 main`,
> HEAD `f79a4b7`). Zero commit, zero branch, zero push, zero mutação do repositório.
> **Todo número aqui é `[medido]`** salvo marcação `[hipótese]`.
> **Toda premissa do prompt foi tratada como hipótese** — e três delas caíram (div. 111, 113, 120).
> O bruto está em [`W1-PRECHECK-anexos/W1-A-medicoes.txt`](W1-PRECHECK-anexos/W1-A-medicoes.txt),
> cada bloco abrindo com o comando que o gerou.
> **O Tab S6 não recebeu um comando.** Todo comando de aparelho leva `-s emulator-5554`.
>
> **VERSÃO FINAL E FECHADA**, com os três avais do Marcel de 2026-09-14 (§8). **As oito
> perguntas estão decididas e nenhuma fica aberta** — a Q2, a última, tem subseção própria
> (§8.1) porque a conclusão dela dependeu de uma medição (**div. 122**) que só apareceu
> quando a recomendação anterior foi derrubada. **O commit 1 já pode nascer.**

---

## 1. A resposta curta, antes das cinco hipóteses

O prompt e a §11 do `V1-ENCERRAMENTO.md` propõem o conserto assim: *"a checagem real não é
`size > 0`, é tamanho em disco contra o esperado no índice"*. **As duas metades dessa frase
estão erradas, e o pre-check mediu por quê:**

1. **O índice não é oráculo.** O `bytes` do `files-index.json` é escrito a partir do
   **tamanho em disco** (`touch()` → `localizar(url)?.file.size`, `files.ts:236`), no mesmo
   instante em que o download termina. Um download truncado grava o índice com o tamanho
   truncado. Comparar disco contra índice é comparar um número com ele mesmo. **div. 111**
2. **`size > 0` não é nem o piso.** No Android o `expo-file-system` abre
   `FileOutputStream(destination)` **antes do primeiro byte do corpo** e escreve em cima do
   alvo — a própria doc da biblioteca diz isso no comentário da função que o app chama. O
   arquivo **existe desde t=0 do download** e cresce em disco. Logo um download em voo já
   passa em `existe`, e passa em `size > 0` em quase todo instante. **div. 113**
3. **Não existe tamanho esperado em lugar nenhum.** A tabela `content` tem 22 colunas e
   nenhuma de tamanho; o `ContentDTO` tem 8 campos e nenhum. A única fonte possível é o
   `Content-Length` da própria resposta HTTP. **div. 112**

**A forma certa do conserto, e o repositório já a conhece:** baixar para um nome temporário
e **renomear para o lugar só depois do download completo** — exatamente o `.tmp` + rename que
o `store.ts:42-52` usa para o cache JSON ("assim uma interrupção no meio da escrita nunca
deixa um JSON truncado no lugar do cache bom") e que o `files.ts:107-117` usa para o próprio
índice. **A única coisa que não recebeu esse tratamento foi o arquivo baixado.** Com
temp+rename, *existir é estar completo* — e aí o `localizar()` de hoje passa a estar certo
sem mudar uma linha dele.

O `Content-Length` entra como **segunda** trava (comparar bytes escritos contra
`totalBytes`), não como a primeira, porque ele pode vir `-1`.

> **A frase que a PR de conserto tem de carregar** — Marcel, 2026-09-14:
>
> ### *"Não estava travado, estava chegando devagar demais."*
>
> 1,8 KB/s, **37 horas** para 242 KB, e o app sem nenhuma forma de dizer isso — porque o
> `allSettled` descarta o array. O defeito não é o download que para: é o app não ter teto,
> não ter progresso e não ter voz.

E o corolário, que é o que faz a PR ser curta: **o `.part` + rename resolve pela raiz.** Um
arquivo só existe quando está completo — e aí **a pergunta do tamanho desaparece**. Não é
preciso oráculo de tamanho nenhum para julgar o que está em disco; basta que nada incompleto
chegue a ter o nome definitivo.

---

## 2. As cinco hipóteses

### H1 — o `localizar()` e o que o índice já sabe · **FECHADA**

**O `localizar()`, verbatim** (`apps/native/src/files.ts:125-132`):

```ts
/** Onde o arquivo está agora — `null` se não está em lugar nenhum. */
function localizar(url: string): { file: File; guaranteed: boolean } | null {
  const g = arquivoEm(dirGarantido(), url)
  if (g.exists) return { file: g, guaranteed: true }
  const d = arquivoEm(dirDemanda(), url)
  if (d.exists) return { file: d, guaranteed: false }
  return null
}
```

**Quem o chama** — cinco pontos, e os cinco herdam o defeito:

| chamador | linha | o que a resposta vira |
|---|---|---|
| `hasFile(url)` | `files.ts:135` | o `prefetchDemanda`/`baixarSetlist` pulam a URL "já baixada" |
| `ensureFileUma` | `files.ts:175` e `:185` | **decide não baixar** e devolve `src=disk` |
| `listFiles()` | `files.ts:216` | a lista que vira `presentUrls()` → `offlineStatus` → o cartão |
| `touch(url)` | `files.ts:236` | o `bytes` que o índice grava |
| `remove(urls)` | `files.ts:261` | o que o LRU acha que existe para despejar |

**De onde vem o `bytes` do índice.** Do disco, no `touch()` (`files.ts:236`):
`const bytes = localizar(url)?.file.size ?? idx[url]?.bytes ?? 0`. **Não** é `Content-Length`,
**não** é do servidor: é o que ficou escrito. E o `touch()` corre logo depois do download
(`files.ts:197`), então ele **destrói** o valor bom que a entrada pudesse ter de uma
passagem anterior. → **div. 111**.

**Há caso em que o índice não tem `bytes` para uma URL em disco?** Sim, dois:
(a) `knownBytes()` (`files.ts:246-250`) trata `bytes === 0` como `null` — um arquivo de 0 byte
é indistinguível de "nunca baixado aqui"; (b) o `carregarIndice()` devolve `{}` quando o JSON
está corrompido (`files.ts:85-89`), e o comentário assume que "o `listFiles` reconstrói as
entradas a partir do disco" — **ele não reconstrói**: `listFiles()` itera sobre as entradas do
índice (`files.ts:214`), então com o índice vazio ele devolve `[]` e **todo arquivo em disco
some do `presentUrls()`**. O efeito é conservador (diz "parcial" tendo os arquivos), então não
é do eixo desta PR — mas o comentário afirma o contrário do código. *Registro sem número: é
comentário, não comportamento.*

**Um arquivo truncado no meio passaria por `size > 0`?** Sim — e passaria também pela
checagem que o prompt propõe, porque o índice teria sido reescrito com o tamanho truncado
(div. 111). E, pior, **passa pelo `existe` desde o primeiro milissegundo do download**
(div. 113). **O que a checagem correta precisa ser** está na §1: *temp + rename*, e o
`Content-Length` como segunda trava.

**Medido no aparelho** (anexo §3): o índice do AVD tem **4 entradas para 2 arquivos** (a
div. 98 do V1, com os números), e nos dois presentes o `bytes` do índice bate com o disco —
o que é esperado e **não prova nada**, justamente porque um foi escrito a partir do outro.

---

### H2 — o purgável e o durável · **FECHADA**

**Os dois diretórios** (`files.ts:52-58`): durável `Paths.document/octavia-<uid>/files/`;
purgável `Paths.cache/octavia-<uid>/files/`. O `store.ts:40` põe os três JSON no durável.

**O que vive em cada um, hoje, no AVD** (anexo §2):

| | arquivo | bytes |
|---|---|---|
| **durável** | `setlists.json` · `content.json` · `files-index.json` | 15.247 · 53.738 · 861 |
| **durável** | `files/1786218429715-ux-audit-partitura-12p.pdf` | **242.176** |
| **purgável** | `files/1786218427769-ux-audit-partitura-1p.pdf` | **20.821** |

**O `false` da linha 156 é o quê, exatamente.** É o 2º parâmetro de
`baixar(urls: string[], guaranteed: boolean)` (`prefetch.ts:71`), que viaja como
`ensureFile(url, { guaranteed })` (`:74`) e escolhe a pasta em `files.ts:174`:
`const alvoDir = opcoes.guaranteed ? dirGarantido() : dirDemanda()`. **Os quatro caminhos**:

| caminho | linha | grava em |
|---|---|---|
| `prefetch7Dias` — plano | `prefetch.ts:91` — `baixar(…, true)` | **durável** |
| `prefetch7Dias` — promoção | `prefetch.ts:111` — `{guaranteed:true}` | **durável** |
| `prefetchDemanda` (palco, T1-R16) | `prefetch.ts:137` — `baixar(…, false)` | purgável |
| **`baixarSetlist` ("Baixar esta setlist")** | **`prefetch.ts:157` — `baixar(…, false)`** | **purgável ← div. 102** |
| palco, o arquivo da posição atual | `StageScreen.tsx:347` — `ensureFile(url)`, default | purgável |

**A janela de 7 dias grava durável — confirmado no código, não no comentário**:
`prefetch7Dias` (`prefetch.ts:91`) passa `true` literal.

**O que o LRU protege** (`prefetch.ts:166` + `core/offline.ts:179-197`): `protectedUrls` é
exatamente `urlsGarantidas()`, que é `selectPrefetch` com o disco vazio — **a janela de 7
dias, e só ela**.

**O que acontece com um arquivo purgável que o LRU acha garantido**: ele fica protegido do
LRU **do app** e desprotegido do **Android**. Esse buraco já foi identificado e tapado pela
metade: a `promoteList` (errata E7, N1-PR7 §3.1) move do purgável para o durável **o que
está na janela de 7 dias** — mas ela só corre dentro do `prefetch7Dias`, isto é, **depois de
um sync**, e só para quem está na janela. O arquivo que o usuário pediu explicitamente pelo
botão e que está numa setlist **sem data** não é alcançado por ninguém: nem pela promoção
(não está na janela), nem pelo LRU (não está em `protectedUrls`), nem pelo Android (está em
`Paths.cache`). **É o pior dos três estados, e é o estado do botão que promete mais.**

---

### H3 — o download que trava em silêncio · **FECHADA POR LEITURA** (a reprodução no aparelho: declarada NÃO FEITA, §12)

**Há timeout configurado no caminho de download?** **Não, em nenhum lugar do app.**
`grep -rni "timeout|AbortController|AbortSignal" apps/native/src packages/core/src` devolve
quatro ocorrências, e as quatro são o `MOTIVO_MS` do A15 no `StageScreen.tsx`.

**Há caminho de erro que o `prefetch` não alcança?** Há **quatro**, e o mais grave é por
construção:

1. **O `baixar()` descarta o resultado do `Promise.allSettled`** (`prefetch.ts:74`). Nenhum
   `status === 'rejected'` é lido, logado ou propagado. **Toda falha de download em todos os
   três caminhos de prefetch é invisível** — e isso é violação direta do **T1-R37** ("toda
   não-2xx vira mensagem visível por default; silenciar é opt-in por caso"). **div. 114**
2. **O laço de promoção não é protegido** (`prefetch.ts:111`): a rejeição sobe por
   `prefetch7Dias` → `prefetchEArrumar` → `rodarSync` → `void rodarSync(...)`
   (`App.tsx:178` e `:183`) e vira rejeição sem dono — **e o `recarregarArquivos()`, que roda
   o LRU e atualiza o `filesPresent`, não corre.** **div. 115**
3. **O `emVoo` deduplica por URL e ignora as opções** (`files.ts:151-167`). O palco que pede
   um arquivo já em voo pelo prefetch **recebe a promise do prefetch**. Se ela não assenta, o
   palco fica em `fase:'buscando'` indefinidamente e o **único** `catch` que emite
   `download-error` (`StageScreen.tsx:352`) nunca é alcançado. **div. 119**
4. **O `baixarSetlist` falha sem dizer nada** (`App.tsx:192`): `void baixarSetlist(...).finally(...)`
   — o `.finally` limpa o "Baixando…", mas não trata a rejeição, e nenhuma mensagem chega ao
   usuário. O `DESIGN-V1` §8.2 já tinha nomeado o sintoma ("o 'Baixar esta setlist' offline,
   que hoje aceita o toque e falha em silêncio"); esta é a causa.

**O que o `download-error` cobre, e o que não cobre.** Cobre **um** ponto:
`StageScreen.tsx:352`, o `catch` de `buscarArquivo` — o arquivo da posição atual do palco,
pedido pelo efeito de `urlArquivo` ou pelo botão "Baixar" do S3e. **Não cobre**: os três
caminhos de prefetch (o `allSettled` os engole), a promoção, e o próprio palco quando a
promise veio do `emVoo` de outro chamador.

**Por que os sete minutos, e por que em silêncio** — o mecanismo, lido até o Kotlin
(`expo-file-system@57.0.6`, `android/…/FileSystemDownload.kt`, anexo §5.6):

- `:44` `private val sharedHttpClient = OkHttpClient()` — construído **sem builder**, logo
  com os defaults do OkHttp: `readTimeout` 10 s e **`callTimeout` = 0, isto é, sem teto de
  duração total** `[hipótese: os defaults documentados do OkHttp; a versão vem por Gradle e
  não foi lida]`. O AV-1 rodou com `adb emu network speed gsm` = **14.400 bit/s ≈ 1,8 KB/s**;
  nessa taxa os 242.176 B levariam **~37 horas**. O `readTimeout` de 10 s nunca dispara
  porque **os bytes continuam chegando** — a cada `read()` de 8192 bytes há dado. **Não
  estava travado: estava chegando devagar demais para ser útil, e o app não tem como dizer
  isso.** O silêncio não é bug do OkHttp: é a ausência de qualquer teto no app.
- `:96-101` o corpo é copiado para `FileOutputStream(destination)` — **o alvo é aberto (e
  truncado) antes do primeiro byte** e cresce em disco. A doc da própria biblioteca, no
  comentário da função que o app chama (`src/File.ts:45-48`): *"On Android, the response body
  streams directly into the target file. If the download fails after it starts, a partially
  written file may remain at the destination."* — **14º caso do padrão "instrumento com
  escopo menor do que parece"**, e da variante mais barata dele: *o instrumento documentava a
  própria cegueira por escrito*.

**O que existe na biblioteca e o app não usa** (anexo §5.7): `DownloadOptions` declara
`signal` e `onProgress`, **mas nenhum dos dois funciona para `File.downloadFileAsync`** — o
progresso depende de um `downloadUUID` que o estático não passa, e a fiação do `AbortSignal`
vive só em `DownloadTask`. **Para ter timeout e progresso é preciso trocar para
`File.createDownloadTask(url, dest, { signal, onProgress }).downloadAsync()`** — `File.ts:275`,
**mesmo pacote já instalado, zero dependência nova**. E o `onProgress` entrega
`totalBytes` = `Content-Length` (ou `-1` se o servidor não mandar).

**A pergunta do item 2 da herança — se o `cache miss` existisse, o arquivo de 0 byte teria
aparecido em log? RESPOSTA: não. As duas coisas não se tocam.** Um `miss` dispara quando algo
é procurado e **não** é achado; o arquivo de 0 byte **foi achado** — é essa a doença. A linha
que falaria já existe e **falou**: `file src=disk name=… bytes=0` (`files.ts:188`), seguida de
`pdf-error File is empty`. **O que faltou não foi uma linha de log, foi uma checagem**: nada
no app compara `bytes` com coisa alguma. **div. 120** — e a **Q4 da §8 fechou a pergunta com essa medição**: o `cache miss` não entra, e o `file-reject` entra no lugar.

---

### H4 — quantos arquivos de 0 byte existem hoje · **FECHADA, com um limite declarado**

**No AVD `octavia_tab32`** (conta de audit), inventário completo com tamanho (anexo §2):
**2 arquivos de música, 0 de 0 byte.** E os dois são **provavelmente íntegros por três sinais
independentes**:

| | `…-12p.pdf` (durável) | `…-1p.pdf` (purgável) |
|---|---|---|
| bytes | 242.176 | 20.821 |
| sha256 | `ad2eae09…` — **bate** com o registro do V1-PR7 | `3d42199b…` — **bate** |
| cabeça | `%PDF-1.7` | `%PDF-1.7` |
| cauda | `startxref 241883 %%EOF` — offset **dentro** do tamanho | `startxref 20609 %%EOF` — idem |

**No Tab S6**, por leitura do inventário que o V1-PR7 registrou (nenhum comando enviado):
**1 arquivo**, `files/1751910900697-Easy_-_Guitar.pdf`, sha `1e1d77c4…` — que não é o sha da
string vazia, logo **não é de 0 byte**.

**O limite, declarado**: "zero de 0 byte" **não é** "zero corrompido". Um arquivo truncado em
100 KB de 242 KB seria hoje **indetectável nos dois aparelhos**, porque não existe tamanho
esperado (div. 112) e o índice não é oráculo (div. 111). O que dá para afirmar dos três
arquivos acima é mais forte que "não são de 0 byte" — é o `%%EOF` com `startxref` dentro do
tamanho, que só um PDF completo tem.

**Conclusão para o recorte: a PR precisa de saneamento, e por um motivo que não é o estrago
de hoje.** O estrago medido hoje é zero. Mas **um arquivo envenenado nunca é recuperado
sozinho**: o `ensureFileUma` (`files.ts:175-190`) vê que `localizar()` achou, devolve
`src=disk` e **nunca tenta baixar de novo**. Sem um passo que reveja o que já está no disco,
um 0 byte de amanhã fica lá para sempre — inclusive **depois** do conserto do caminho de
escrita. O saneamento barato já está medido acima e **não custa rede**: cabeça `%PDF`, cauda
`%%EOF`, `startxref` dentro do tamanho.

---

### H5 — a barra do palco (div. 109) · **FECHADA — e [decidido], Q6: vai para a W2**

A geometria foi **relida do zero** dos dumps do V1-PR7, com script próprio, sem tocar
aparelho (anexo §6): os três dumps dão a mesma tabela, e ela reproduz exatamente o
`V1-PR7-C-aceite-visual.txt` — sete controles de ~66 dp, **sete folgas de 16,0 dp iguais**,
fim do último a **582,2 dp**, **555,6 dp vazios à direita = 49% da barra**.

**Confirmo que os três que podem ficar inertes são todos do grupo da esquerda**
(`auto-scroll`, `zoom-menos`, `zoom-mais`), e nenhum dos três da direita jamais fica inerte.

**E a releitura acrescenta um achado que o aceite não viu**: no dump dos inertes, os três
estão **`enabled=true clickable=true`**; o motivo viaja só no `content-desc`. Conferido no
código (`StageScreen.tsx:807-827`): o componente `Controle` não põe `disabled` nem
`accessibilityState`. A errata **E3** do V1 diz que o inativo é "tinta (`lineInfo`) e, na
árvore, `enabled=false`" — isso é verdade para o botão `entrar` do S0 (o AV-4 mediu
`enabled=FALSE`) e **falso para os três controles do palco**. **div. 118**

**[decidido] — a div. 109 vai para uma PR própria, curta, DEPOIS desta** (Q6: *"concordo com as três razões"*). As três:

1. **Ela não é do mesmo defeito.** As 102/103/104 são uma coisa só — a promessa falsa. A 109
   é composição visual. Juntá-las faz o aceite de uma contaminar o da outra, que é
   exatamente o argumento que o V1 defendeu sete vezes para não misturar comportamento com
   aceite (§11 do encerramento).
2. **Ela mexe no `StageScreen.tsx`**, que a div. 108 já nomeou como o ponto cego do G1 — e
   esta PR vai precisar do G1 reescrito por outro motivo (§5). Duas reescritas de gate no
   mesmo PR por razões diferentes é como se perde o gate.
3. **Ela ganhou escopo.** Com a div. 118, "alinhar os três à direita" passa a ter um
   companheiro natural: **dar aos inertes o `accessibilityState`** que a E3 já afirma que
   eles têm. A fronteira por função é a fronteira por estado — a própria medição do V1 diz
   isso — e agora as duas metades têm conserto. Isso é uma PR de forma, com veredito visual,
   não um apêndice.

A Proposta A já está decidida pelo Marcel e conferida contra V1-A8, V1-A14 e as bordas do
A14; nada se perde em esperar uma PR.

---

## 3. O recorte proposto — **uma PR de comportamento, e duas PRs pequenas em volta**

| | escopo | por quê |
|---|---|---|
| **W1** (esta) | div. **102 + 103 + 104** + saneamento + as erratas do PRD | são **um** defeito com três faces, e o PRD mente sobre a mesma coisa (§4) |
| **W2** (depois) | div. **109** + div. **118** | forma e acessibilidade do palco; veredito visual; outro gate — §2/H5 |
| — | div. 121 (`updated_at` do T1-R17) | **não entra** — **[decidido]**, Q5 da §8: *"esta PR é o eixo do arquivo; o `updated_at` é o eixo do corpo"* |

### Os commits do W1, na ordem, com o aceite de cada

> A ordem obedece **"o gate vem antes do que ele mede"**: o commit 1 é gate e teste, contra o
> código **de hoje**, e tem de **reprovar** antes de qualquer conserto.

| # | commit | o que entra | como se prova |
|---|---|---|---|
| **1** | `test(W1)`: o controle negativo, antes do conserto | testes de unidade no core e no `files.ts` que descrevem o comportamento **correto**; o gate `G7-integridade` (§5) | **os testes REPROVAM** sobre `f79a4b7` — e a saída da reprovação vai para o anexo. Se passarem, o teste está errado |
| **2** | `fix(W1)`: o download passa a ser atômico | `ensureFileUma` baixa para `<nome>.part` no diretório alvo e só faz `moveSync` para o nome final depois de completo; o `.part` é apagado em qualquer saída por erro | um `.part` nunca é visto por `localizar()` (ele filtra por nome exato); o arquivo só existe completo. Aceite **W1-A1** |
| **3** | `fix(W1)`: teto de download e `download-error` de verdade | troca `File.downloadFileAsync` por `File.createDownloadTask(...).downloadAsync()` com `signal` e `onProgress`; compara bytes escritos com `totalBytes` quando ele não é `-1`. **teto por INATIVIDADE, `T = 30 s`** — Q2, §8.1 | aceites **W1-A2** e **W1-A3** |
| **4** | `fix(W1)`: nenhuma falha é engolida, e nenhum lento para a fila | `baixar()` lê o resultado do `allSettled` e emite uma linha por rejeição; o laço de promoção ganha guarda; o `baixarSetlist` do `App.tsx` reporta; **e a barreira de lote vira fila de TRÊS TRABALHADORES (div. 122, §8.1)** — o mesmo 3, com o significado que o T1-R13 sempre pediu | aceite **W1-A4**; **T1-R37** deixa de ser violado |
| **5** | `fix(W1)`: "Baixar esta setlist" grava durável | o `false` da `prefetch.ts:157` vira `true`, **e o `protectedUrls` do LRU não muda** — **[decidido]**, Q1 da §8 | aceite **W1-A5** |
| **6** | `fix(W1)`: saneamento do que já está em disco | uma varredura na abertura que reprova o que não passa na checagem de forma e o remove do disco (a entrada do índice **fica** — é o "(1,2 MB)" do S3e) | aceite **W1-A6** |
| **7** | `docs(W1)`: as erratas do `PRD-TELA-1.md` | **A4**, **A15** e **o T1-R17** — as três com o texto pronto na **§9.1** | diff do PRD; nenhum código |
| **8** | `docs(W1)`: a errata da §11 do `V1-ENCERRAMENTO.md` | a afirmação falsa que orienta este trabalho, corrigida com o motivo e o ponteiro para a div. 111 — **texto pronto na §9.2**; ordem do Marcel | diff; nenhum código |
| **9** | `docs(W1)`: o `LOGS-OCTAVIA.md` | a **regra nova** da div. 110, o **14º caso** do padrão (div. 113) e a linha `file-reject` — **texto pronto na §9.3** | o `G4` passa sobre o texto novo |
| **10** | `docs(W1)`: o `W1-ENCERRAMENTO.md` | o veredito do bloco, com contabilidade e divergências | — |

Os commits 2 e 3 podem ser um só se a troca para `DownloadTask` se mostrar necessária já
para o temp+rename; mantenho separados porque **o 2 sozinho já fecha a div. 103**, e é bom
que isso apareça no histórico.

---

## 4. As erratas do `PRD-TELA-1.md` — são **três**, não duas

As duas da §5 do `V1-ENCERRAMENTO.md` (A4 no conjunto vazio; A15 com o motivo ao toque) têm
o texto pronto e entram por transporte. **A terceira o pre-check achou**, e ela é do eixo
desta PR — o **T1-R17** (`PRD-TELA-1.md:179`) define a garantia assim, verbatim:

> "(i) todas as suas `song.content_id` existem no cache de `content` com `updated_at` igual ao
> do último sync e (ii) todas as `file_url` não-nulas dessas contents **existem** no cache de
> `file`."

**O PRD é cúmplice**: ele próprio manda checar **existência**. O `localizar()` implementa o
PRD com fidelidade; o contrato é que está errado. **Consertar o código sem consertar o
T1-R17 deixa o PRD autorizando o defeito** — e ele é o documento que a tela 2 vai herdar.
Leitura proposta para (ii): *"…existem no cache de `file` **e estão completas** — um arquivo
em download, truncado ou de 0 byte não conta como presente"*. **div. 117**

---

## 5. Os gates — quais sobrevivem, e o que muda

| gate | no V1 | no W1 |
|---|---|---|
| **G1** | diff **vazio** nos nove módulos + `packages/core/src` | **tem de mudar, e não por acomodação** — abaixo |
| **G2** | `testID`: antes ⊆ depois | **vale como está.** A PR não tira tela; se acrescentar (um aviso de download incompleto), o G2 já aceita |
| **G3** | linhas `log(` **idênticas** por arquivo | **vira "antes ⊆ depois", com a lista das novas declarada no commit.** A PR existe justamente para acrescentar linhas de log que faltavam |
| **G4** (`gate:a20`) | nenhum literal de UI em inglês | **vale como está**, e passa a cobrir o texto novo de falha de download |
| **G5** | alvo tocável ≥ 48 dp | **vale**, e só é exercido se a PR puser controle novo |
| **G6** | todo estado alcançável por `resource-id` | **vale** |
| **`gate:icones`** | mapa de ícones contra o congelado | **vale como está** — a PR não desenha ícone |

### O G1 — por que ele não pode ficar, e o que entra no lugar

**O G1 afirma "o comportamento não mudou" listando nove módulos, e `files.ts` e `prefetch.ts`
são dois deles.** Esta PR muda exatamente esses dois — de propósito. Rodar o G1 como está
seria **garantir a reprovação**, e afrouxá-lo para acomodar a PR seria repetir a div. 108 pelo
outro lado: um gate que se ajusta ao que a PR fez não afirma nada.

**Proposta — o G1 se parte em dois, e os dois ficam mais fortes que o original:**

- **G1a — invariância do que NÃO é desta PR.** Diff vazio nos **sete** módulos restantes
  (`api.ts`, `store.ts`, `sync.ts`, `net.ts`, `session.ts`, `firebase.ts`, `log.ts`) e em
  `packages/core/src` **exceto `offline.ts`**. É o G1 de hoje menos exatamente os arquivos
  que a PR declara tocar. **[decidido]** — e a razão, na forma que o Marcel deu:

  > ### *A LISTA DE EXCEÇÕES É O ESCOPO DECLARADO.*
  > *"Um gate que se afrouxa sem dizer onde deixa de ser gate."* — Marcel, 2026-09-14

  Não é conveniência: é o contrário dela. Se um oitavo arquivo precisar mudar, o gate grita,
  e o autor tem de acrescentá-lo à lista **no commit**, com o motivo escrito. É o buraco que
  a div. 108 abriu no V1 fechado pelo outro lado: lá, "está sob o G1" foi lido como se o gate
  cobrisse a categoria; aqui, o gate diz por escrito o que **não** cobre.
- **G1b — invariância de DECISÃO nos módulos tocados.** O core é puro e testado
  (`packages/core/src/offline.test.ts`); a garantia de que `selectPrefetch`, `prefetchOrder`,
  `lruEvict`, `promoteList` e `offlineStatus` **não mudaram de decisão** é a suíte deles
  passando **sem que um teste existente seja editado**. O gate é mecânico: `git diff` dos
  arquivos `*.test.ts` do core tem de ser **só adição** (nenhuma linha removida ou alterada).
  É o análogo do G2 para teste, e fecha o buraco que a div. 108 abriu: *o G1 nunca soube dizer
  se o comportamento mudou, só se o arquivo mudou.*

**Um gate novo, e é o que dá nome à PR:**

- **G7 — integridade.** Um teste que monta os dois diretórios com (a) um arquivo de 0 byte,
  (b) um arquivo truncado e (c) um `.part` sobrando de um download morto, e exige que
  `hasFile`, `listFiles`, `presentUrls` e `offlineStatus` **não contem nenhum dos três**.
  **Controle negativo**: com o `files.ts` de `f79a4b7`, o G7 tem de **reprovar nos três** — e
  a saída da reprovação vai no anexo, antes do conserto existir. É o commit 1.

---

## 6. Os aceites

### Os do PRD que tocam a garantia offline, e o que muda em cada

| # | o critério | esta PR |
|---|---|---|
| **A9** | "arquivo baixado uma vez, servido do disco depois (sha256 igual ao do servidor)" | **fica mais forte**: o sha256 passa a ser conferível *porque* o arquivo só existe completo. Rodar de novo |
| **A10** | "arquivos baixados em background; indicador ✓/◔/✗ correto e recalculado" | **rodar de novo, e a metade dispensada no V1 deixa de poder ser dispensada** — "baixados em background" é o `prefetch.ts`, que esta PR reescreve |
| **A13** | "PDF de 12 páginas do cache em avião, 12 páginas navegáveis" | rodar de novo (é o consumidor do arquivo íntegro) |
| **A18** | `notes` visível, `annotations` não | **não toca**; não roda de novo |
| **A19** | "falha de revalidação com cache → indicador, lista permanece" | **ganha um irmão**: hoje ele cobre a falha de *sync*; a falha de *download* não tinha equivalente. Rodar de novo + o W1-A4 |
| **A21** | "mock de 500 na página 2 → cache de content byte a byte inalterado" | **não toca** o `sync.ts`; dispensado pelo **G1a**, e dessa vez a dispensa é legítima porque o `sync.ts` está sob diff vazio |

### Os aceites novos desta PR

Todos com **instrumento** (a linha do `LOGS-OCTAVIA.md` ou o dump) e **controle negativo**
(como fazer o aceite falhar de propósito).

| # | critério | instrumento | controle negativo |
|---|---|---|---|
| **W1-A1** | **Um download interrompido não deixa arquivo no lugar do bom.** Matar o app (ou cortar a rede) no meio de um download → `run-as find` mostra **zero** arquivo novo no nome final; um `.part` pode sobrar e **não** é contado | `run-as find … -exec stat -c '%s %n'` antes e depois; cartão do S1 | com o `files.ts` de `f79a4b7`, o mesmo roteiro deixa um arquivo incompleto no nome final e o cartão diz "garantida offline" |
| **W1-A2** | **Um download que não termina em `T` segundos falha, e a falha aparece.** Com o link estrangulado (`emu network speed gsm`), o download é abortado e sai `download-error` | `OCTAVIA: download-error <msg>` | com o link cheio o mesmo arquivo baixa e **não** sai `download-error` — o teto não pode disparar em regime normal |
| **W1-A3** | **Um corpo mais curto que o `Content-Length` é recusado.** Servidor de host que declara `Content-Length: N` e manda `N/2` → o arquivo **não** entra no lugar | `download-error` + `run-as find`; servidor local, **zero bucket** | o mesmo servidor mandando `N` completo → o arquivo entra e o cartão vira "garantida offline" |
| **W1-A4** | **Nenhuma falha de download é engolida.** Uma falha num prefetch de 3 arquivos emite **uma linha por falha**, e as outras duas continuam | a linha `file-reject` do catálogo (§8, Q4 — **[decidido]**) | hoje: três falhas, **zero** linhas |
| **W1-A5** | **"Baixar esta setlist" grava durável** (se a Q1 for "sim") | `run-as find files/…` acha o arquivo; `cache/…` não | antes: o inverso — é a div. 102, medida |
| **W1-A6** | **O saneamento repara o que já está no disco.** Plantar um arquivo de 0 byte e um truncado no disco por `run-as` → abrir o app → os dois somem do disco e o cartão cai para "parcial" | `run-as find` + cartão do S1 | com o app de hoje, os dois ficam e o cartão diz "garantida offline" — é a reprodução barata da div. 103, **sem rede e sem bucket** |

| **W1-A7** | **O indicador anda DURANTE o download, não só no fim.** Com um plano de ≥ 4 arquivos e a fila de trabalhadores, o cartão passa por estados intermediários ("1 de 5", "2 de 5") antes de chegar em "garantida" | os estados do cartão, capturados; e as linhas `file src=download` intercaladas | com a barreira de lote de hoje, o cartão salta de "0 de 5" para "5 de 5" numa tacada — e com um lento no 1º lote, **nunca sai de 0** |

> **O W1-A6 é também a reprodução da div. 103 que esta sessão não fez** (§12): plantar o
> arquivo de 0 byte por `run-as` custa **zero rede, zero bucket, zero prod** e produz o mesmo
> estado que o download estrangulado produziu. **Recomendo que seja esse o roteiro do
> aceite**, e não o estrangulamento — o estrangulamento prova o mecanismo uma vez; o plantio
> prova o conserto sempre, e roda em segundos.

---

## 7. O botão "Baixar esta setlist" — **DECIDIDO: durável, com trava**

**Decisão do Marcel, 2026-09-14, verbatim:**

> *"SIM, COM TRAVA. Durável, sem entrar no `protectedUrls`. Tira o arquivo do alcance do
> Android (o dano real da 102) e não muda a política de purga: o LRU segue sendo o caminho de
> soltar, e 'como se solta o que foi fixado' fica adiado sem custo."*

**O argumento que a sustenta**, medido na §2/H2: "Baixar esta setlist" é a **única** ação em
que o usuário pede o arquivo de forma explícita, e hoje é a que dá a garantia **mais fraca**
das quatro — nem durável, nem protegida pelo LRU, nem alcançada pela promoção. O prefetch
automático de 7 dias, que o usuário nunca pediu, dá a mais forte. **A hierarquia está
invertida.** E o botão só aparece em setlist **sem data de show** (`SetlistsScreen.tsx:187`) —
exatamente a que a janela de 7 dias nunca vai cobrir: se o botão não durar, nada dura para ela.

**O que a trava resolve, e o que ela deixa de propósito para depois:**

| implicação | hoje | com a decisão |
|---|---|---|
| **alcance do Android** | `Paths.cache`: o sistema apaga quando quiser | `Paths.document`: fora do alcance. **É o dano da div. 102, e é o que se conserta** |
| **quota** | teto `CAP_BYTES = 200 MB` (`prefetch.ts:34`); repertório inteiro da conta de audit = **265.002 B** (N0-H16) — folga de ~800× | a mesma folga. Não é risco real hoje; é risco de contrato |
| **quem o LRU pode despejar** | `protectedUrls` = a janela de 7 dias | **não muda.** O arquivo fixado continua candidato normal, despejável por desuso |
| **como se "solta" o que foi fixado** | não existe caminho | **o LRU já é o caminho.** A pergunta grande — fixar de verdade, com UI de soltar — fica aberta e honesta, para quando houver repertório que a justifique |
| **estouro de teto** | `lruEvict` devolve o `bytesAfter` real estourado e **`prefetch.ts:167-170` o ignora** | **continua ignorado.** Buraco que já existe, e que esta PR não abre nem fecha — registro para o N2 |

Com a trava, o commit 5 volta a ser a uma linha que ele parecia ser — mas agora **por
argumento, não por desatenção**.

---

## 8. As decisões do Marcel

### Decidido — avais de 2026-09-14

| # | decisão | verbatim / onde entrou |
|---|---|---|
| **Q1** | **"Baixar esta setlist" grava durável, sem entrar no `protectedUrls`** | §7; commit 5 |
| **Q3** | **O saneamento APAGA do disco e MANTÉM a entrada do índice.** *"Esconder sem apagar deixa o LRU contando bytes de lixo, e preservar a entrada mantém o '(1,2 MB)' do S3e — que é a informação de que o usuário precisa para decidir baixar."* | commit 6; aceite **W1-A6** |
| **Q4** | **O `cache miss` NÃO passa a existir; entra o `file-reject` no lugar.** *"A div. 120 fecha a pergunta com medição e não com opinião: o `cache miss` não teria falado porque o arquivo FOI achado. E 'achei e recusei' é um evento que não existia no catálogo."* E sobre o formato: *"o `expected=<n\|->` admite que às vezes não se sabe o esperado — honesto é melhor que completo."* | §9.3(c); commit 9 |
| **Q5** | **A div. 121 fica FORA.** *"Duas definições de garantia numa PR só é o que faz escopo escorregar. Esta PR é o eixo do arquivo; o `updated_at` é o eixo do corpo."* Para o N2 | §11, div. 121 |
| **Q6** | **A div. 109 vai para a W2, separada** — "concordo com as três razões" | §2/H5. E a div. 118 vai junto: as duas metades do mesmo achado, forma e estado |
| **Q7** | **Não gastar bucket.** *"O plantio por `run-as` é custo zero e repetível, que é melhor que uma medição única. A ponta a ponta com link estrangulado se decide depois do conserto, se ainda fizer falta."* | aceite **W1-A6**; §12 |
| **Q8** | **Três erratas do PRD.** *"O T1-R17 definir garantia como as `file_url` 'existirem' é boa pegada: o PRD é cúmplice, e consertar o código sem consertar o requisito deixaria o próximo bloco reintroduzir o defeito com o PRD do lado dele."* | §4 e §9.1; commit 7 |
| **recorte** | **W1 como proposto, com o commit 1 reprovando antes do conserto** | §3 |
| **gates** | **G1a + G1b + G7**, com a lista de exceções escrita como escopo declarado | §5 |
| **doc** | **Corrigir a §11 do `V1-ENCERRAMENTO.md`** — *"é registro de bloco encerrado, mas uma afirmação falsa que orienta o próximo trabalho não pode ficar de pé"* | §9.2; commit 8 |
| **doc** | **A div. 110 vira regra, e a 113 vira o 14º caso** — as duas para o `LOGS-OCTAVIA.md` | §9.3; commit 9 |

| **Q2** | **O teto de download: `B` + o conserto da fila agora; o `C` escrito e não implementado.** Ganhou subseção própria por ordem do Marcel — *"decidir com dois terços do desenho ausente é o que a regra da div. 80 existe para evitar"* | **§8.1**; commits 3 e 4 |

**Nenhuma pergunta deste pre-check fica aberta.** As oito foram decididas em três avais
(2026-09-14), e a §8.1 registra o caminho da Q2 porque a conclusão dela depende de uma
medição que só apareceu quando a recomendação anterior foi derrubada.

---

### 8.1 Q2 — o teto de download · **DECIDIDA: B + o conserto da fila; o C escrito e não implementado**

**Decisão do Marcel, 2026-09-14**: *"B + o conserto da fila agora, o C escrito e não
implementado. As quatro partes como você propôs."*

#### O que a div. 122 reposicionou — e a frase que tem de ficar de pé

> **O teto nunca foi sobre paciência. Era sobre um download condenado comer o orçamento dos
> outros. E a proteção da fila NÃO É UM TETO — é trocar a barreira de lote por
> trabalhadores.**

Está escrito assim, e em destaque, por um motivo prático que o Marcel nomeou: **é o que
impede alguém de "resolver" isso no futuro aumentando um timeout.** Um número maior no teto
não faz o quarto arquivo começar mais cedo; só adia o instante em que a fila destrava. Quem
chegar aqui daqui a um ano com um relatório de "prefetch lento" e a mão no `T` vai ler,
primeiro, que o `T` não é o parafuso.

A medição que o obriga — `prefetch.ts:71-76`, verbatim:

```ts
async function baixar(urls: string[], guaranteed: boolean): Promise<void> {
  for (let i = 0; i < urls.length; i += CONCORRENCIA) {
    const lote = urls.slice(i, i + CONCORRENCIA)
    await Promise.allSettled(lote.map((url) => ensureFile(url, { guaranteed })))
  }                ↑ ESPERA OS TRÊS. O lote seguinte não começa enquanto o mais lento não acabar.
}
```

Um arquivo a 1,8 KB/s não atrasa só a si mesmo: **para a fila inteira**. Os arquivos do 4º em
diante nunca começam, inclusive os que baixariam em dois segundos. E como `prefetch7Dias` só
devolve no fim, o `recarregarArquivos()` (`App.tsx:88-90`) não corre — o LRU não é aparado e o
`filesPresent` não é atualizado. **div. 122.**

#### O caminho até aqui, registrado porque a conclusão depende dele

**A objeção do Marcel, verbatim, que derrubou a recomendação anterior:**

> *"O caso que o aceite do V1 produziu foi 1,8 KB/s CONSTANTE — chegando devagar, não parado.
> Nesse cenário bytes novos chegam o tempo todo e um teto de inatividade NUNCA dispara:
> baixaria por 37 horas sem nunca ficar inativo. A recomendação de pé não cobre o caso medido."*

Procede inteira: a recomendação tinha sido desenhada contra a palavra *travado*, e a §2/H3
desta mesma sessão mediu que ele **não estava travado**. As duas coisas foram escritas por
mim e não foram confrontadas uma com a outra.

**A distinção que ele propôs, confirmada e com uma emenda — são três problemas, não dois:**

| o problema | o que o resolve | é um teto? |
|---|---|---|
| **conexão MORTA** — soquete de pé que parou de entregar | teto por **inatividade** (commit 3) | **sim**, e é o único |
| **conexão LENTA**, para o usuário | a **honestidade do indicador**: com `.part` o arquivo não tem nome definitivo, o `localizar()` não o acha, e o cartão diz "parcial" o tempo todo (commit 2) | não |
| **conexão LENTA, para os OUTROS arquivos** | a **fila com trabalhadores** no lugar da barreira de lote (commit 4, div. 122) | **não** — e é aqui que estava o dano real |

#### As três opções, e por que o A foi descartado sendo o mais barato

> Em todas, o `.part` + rename (commit 2) já está de pé: nenhuma delas é o que impede a
> mentira — isso já está resolvido. O que elas decidem é **quando parar de tentar**.

| | **A · teto absoluto** | **B · inatividade** ← **escolhida** | **C · inatividade + projeção** |
|---|---|---|---|
| **a regra** | abortar se o download passar de `T` segundos, aconteça o que acontecer | abortar se **nenhum byte novo** chegar em `T` segundos | **B**, mais: projetar o fim pela taxa medida e abortar se a projeção passar de `T₁` |
| **o que pega** | tudo o que demora: morta, lenta, e arquivo grande | **conexão morta** — o Wi-Fi de hotel que "conecta" e não roteia | morta **e** o download condenado, com critério explícito |
| **o que deixa passar** | **nada — e é esse o defeito** | **o caso medido**: 1,8 KB/s constante nunca fica inativo | o arquivo sem `Content-Length` (`totalBytes === -1`): sem total não há projeção, e cai de volta em **B** |
| **custo** | **1 linha** (`AbortSignal.timeout(T)`) | **~8 linhas**: `setTimeout` rearmado a cada `onProgress` + `AbortController` | **~15 linhas**: o de **B** + três de aritmética no `onProgress` |
| **números novos sem `n`** | **1**, e é o que decide o destino do caso legítimo | **1** (`T = 30 s`) | **2**, e o `T₁` **ninguém mediu** |
| **no caso de 1,8 KB/s** | **aborta** — e abortaria também o PDF grande em rede lenta mas sã | **não aborta**: 37 h, `.part` de pé, cartão honesto em "parcial" — e **sem comer a vaga**, porque a fila foi consertada | **aborta**, com `download-error` carregando a projeção |

**O descarte do A, pelo motivo que o Marcel formulou:**

> *"Barato e errado é pior que caro e certo quando o erro cai em cima do uso real."*

O A é o único que **pune o caso legítimo**: não distingue rede morta de PDF grande em rede
lenta mas sã — e o segundo é precisamente o caso em que o usuário **quer** que continue.

#### A pergunta debaixo: existe momento de desistir?

**Existe, e não é sobre lentidão — é sobre futilidade.** Um download que não termina dentro
de uma vida de processo não termina nunca, porque **não há resume**: tentar "para sempre" é,
na prática, recomeçar do zero para sempre. Três medições:

| | |
|---|---|
| o download vive **no processo do app** | chamada OkHttp no processo; não há serviço de fundo |
| o Android **ignora** a continuação em background | `DownloadTaskOptions.sessionType`: *"Android accepts this option for API consistency and **ignores it**"* (`@platform ios`) |
| **não há resume** | `grep -rn "createDownloadTask\|savable\|fromSavable\|resumeData" apps/native` → **zero**. Um `.part` interrompido recomeça do zero |

*[hipótese, a única desta subseção: que um processo de app não sobreviva 37 h num tablet. Não
medi — mas o app não tem resume para amortizar nem uma tentativa parcial.]*

**Mas o app não sabe quando é o show**, e é por isso que o C não entra: três horas numa Wi-Fi
ruim de hotel, na véspera, é exatamente o que o usuário quer que aconteça.

#### A decisão, em quatro partes

**1. `.part` + rename** (commit 2) — a honestidade durante a lentidão. *Já era a PR.*

**2. Teto por inatividade, `T = 30 s`** (commit 3) — contra a conexão morta, o único caso em
que o app tem certeza de que nada vai chegar. O `T` é o único número novo, e vai declarado
como **medido zero vezes**: 30 s de silêncio como morte é convenção de rede, não medição
deste projeto. O aceite **W1-A2** é quem o confirma.

**3. A fila com trabalhadores** (commit 4, div. 122) — contra a lentidão que come os outros.
Duas decisões de desenho, que o Marcel pediu declaradas:

> **Quantos trabalhadores? TRÊS — o mesmo número, com outro significado, e agora o
> significado é o que o PRD sempre pediu.**
>
> Hoje `CONCORRENCIA = 3` (`prefetch.ts:37`) é o **tamanho do lote**: no máximo 3 em voo, e
> então uma barreira. Como fila, 3 passa a ser o **teto de downloads simultâneos**: no máximo
> 3 em voo, continuamente. **O invariante que importa — quantas conexões o app abre ao mesmo
> tempo — é o mesmo 3 nas duas formas**, então não há motivo para mexer no valor, e mexer
> misturaria duas mudanças numa.
>
> E há uma ironia que vale registrar: o **T1-R13 passo 3** pede *"concorrência ≤ 3"*, e o nome
> da constante já dizia `CONCORRENCIA`. **O nome e o requisito sempre disseram "concorrência";
> foi a implementação que fez "lote".** A fila não muda o contrato — ela passa a cumpri-lo
> literalmente. O lote garante `≤ 3` e **desperdiça vagas**; a fila garante `≤ 3` e as usa.

> **O `recarregarArquivos()` passando a correr no meio: é melhoria real, e entra declarada.**
>
> Com a barreira, o indicador só se atualizava **no fim** de todo o plano. Com trabalhadores,
> cada arquivo que assenta pode atualizar na hora — o cartão anda "0 de 5 → 1 de 5 → 2 de 5"
> **enquanto** baixa, em vez de saltar do nada para tudo. Isso é exatamente o "parcial honesto"
> que a PR inteira existe para conseguir, e **não pode acontecer de lado**: vira o aceite
> **W1-A7** (abaixo).
>
> **Recomendação de desenho** (não decisão): partir o callback em dois. O refresh do
> `filesPresent` corre **a cada arquivo** — é barato e é a honestidade; o `aplicarLru()` corre
> **uma vez, ao fim da fila** — é varredura de arrumação, não precisa por arquivo, e o motivo
> que o pôs ali (`App.tsx:58-63`: *"o teto ficava furado entre um sync e o seguinte"*) continua
> satisfeito. Os outros chamadores de `recarregarArquivos()` (o palco, o `baixarEsta`) ficam
> como estão.
>
> **E uma coisa que o `.part` dá de graça aqui**: o LRU não consegue despejar um arquivo em
> voo, porque um `.part` não tem o nome final e o `localizar()` não o vê. Com a fila correndo
> o LRU no meio, isso deixaria de ser detalhe e passaria a ser necessário — e já está resolvido
> pelo commit 2, sem uma linha a mais.

**4. O C fica ESCRITO E NÃO IMPLEMENTADO**, com o lugar marcado no código. A razão, verbatim
do Marcel: *"falta o `T₁`, e ele não se inventa, se mede. Escolher um limiar hoje para caber na
única medição que existe (37 h, `n=1`) seria a div. 80 cometida por quem a escreveu."*

Comentário pronto para transporte, no `onProgress` que o commit 3 introduz:

```ts
// OPÇÃO C, NÃO IMPLEMENTADA — e o que falta para implementá-la.
// Aqui caberia projetar o fim do download (bytesWritten, totalBytes e o
// tempo decorrido dão a taxa) e abortar quando a projeção passar de um
// teto `T₁`. NÃO foi feito porque **falta o `T₁`, e ele não se inventa**:
// a única medição que existe é 37 h com `n=1` (V1, AV-1, link a 1,8 KB/s),
// e escolher um limiar para caber nela seria a div. 80 cometida por quem a
// escreveu. O que falta medir: uma população de downloads reais com a taxa
// de cada um (é o que a linha `file` passa a registrar, com `total=` e
// `ms=`), para que o `T₁` nasça de números. Ver `W1-PRECHECK.md` §8.1.
// Se e quando entrar, o aborto é um `download-error` com a projeção na
// mensagem — NÃO um `file-reject`: o arquivo não foi achado e recusado,
// ele não chegou.
```

#### As duas linhas de log, decididas juntas (commit 9)

Marcel: *"SIM ao `file-progress` … decida o formato junto com o `file-reject`, no mesmo commit
do catálogo, e registre os dois no `LOGS-OCTAVIA.md` de uma vez."*

**Decidido, e com uma correção ao nome que ele usou.** Uma linha chamada `file-progress` que
sai **uma vez, no fim**, seria um nome que não descreve o que o evento faz — e essa é
exatamente a classe de defeito que as erratas E7 e E8 do catálogo passaram o N1 e o V1
consertando. Então o número não vira linha nova: **ele entra na linha que já existe e que já
sai uma vez por download**, `file` (`files.ts:188` e `:198`):

| | antes | depois |
|---|---|---|
| do disco | `file src=disk name=<seg> bytes=<n>` | **inalterada** — não houve download, não há total nem duração |
| baixado | `file src=download name=<seg> bytes=<n>` | `file src=download name=<seg> bytes=<n> **total=<n\|-> ms=<n>**` |

`total` é o `Content-Length` (`-` quando o servidor não o manda); `ms` é o tempo do início do
download até o rename. **A taxa é `bytes/ms`** — valor derivado, que o catálogo não guarda por
regra (chaves fixas, valores crus). É **errata declarada** do catálogo, porque muda uma linha
existente; as chaves só aparecem no `src=download`, e há precedente para variante com chaves
diferentes (`placeholder kind=file-missing name=<seg>`).

E a linha nova, que é evento novo de verdade:

`file-reject name=<seg> kind=empty|short|malformed bytes=<n> expected=<n|->`

**Por que uma estende e a outra nasce**: `file` responde *"o que eu tenho e quanto custou"*;
`file-reject` responde *"achei e recusei"*, que é o evento que não existia (Q4). E o
`download-error`, que já existe, continua sendo *"não consegui baixar"* — as três são
perguntas diferentes, e é por isso que são três linhas e não uma.

**E é este par que faz o W1-A2 ser aceite e não impressão**: com `total=` e `ms=` no log, a
leitura *"não abortou"* se separa em **"não abortou porque a rede estava sã"** (taxa alta) e
**"não abortou porque o teto não funciona"** (taxa de 1,8 KB/s e nenhum `download-error`).
Sem eles, as duas são a mesma linha.

---

## 9. Os três documentos a editar, com o texto pronto para transporte

> Os três são commits de `docs(W1)` e **nenhum toca código**. O texto está pronto aqui para
> que a sessão do W1 transporte em vez de reescrever — e para que, se ela discordar, a
> discordância seja visível contra um texto, não contra uma lembrança.

### 9.1 `PRD-TELA-1.md` — três erratas (commit 7)

**(a) A4, no conjunto vazio** — texto pronto na §5.1 do `V1-ENCERRAMENTO.md`. A leitura passa
a ser **`1 + max(1, ⌈N/100⌉)`**: *"uma de setlists mais **pelo menos uma** de content"* —
descobrir que `N = 0` custa a request que devolve `N`.

**(b) A15, o motivo ao toque** — texto pronto na §5.2 do `V1-ENCERRAMENTO.md`. A forma
permanente do inerte é a do **ícone** (tinta `lineInfo`, desenho amputado); o motivo é
revelado ao toque por `MOTIVO_MS = 2500`, e o `accessibilityLabel` o carrega o tempo todo.

> **Emenda que esta PR acrescenta à (b)**, por causa da **div. 118**: a errata E3 do
> `DESIGN-V1` afirma que o inativo é *"tinta e, na árvore, `enabled=false`"*. Isso é verdade
> para o `entrar` do S0 e **falso para os três controles do palco**, que estão
> `enabled=true clickable=true` nos dumps do próprio V1. A errata do A15 deve dizer o que o
> app **faz** hoje — não o que a E3 supôs — e o conserto da árvore vai para a **W2**.

**(c) T1-R17 — a errata nova, e a do eixo desta PR.** O requisito diz hoje (`PRD-TELA-1.md:179`):

> "(ii) todas as `file_url` não-nulas dessas contents **existem** no cache de `file`."

Leitura proposta:

> "(ii) todas as `file_url` não-nulas dessas contents **existem e estão completas** no cache
> de `file` — um arquivo em download, truncado ou de 0 byte **não conta como presente**.
> *Errata W1, 2026-09-14: a redação anterior dizia só "existem", e o `localizar()`
> (`files.ts:126`) a implementava com fidelidade — o contrato autorizava o defeito das
> div. 102/103/104. Ver `W1-PRECHECK.md` §4 e div. 117.*"

### 9.2 `V1-ENCERRAMENTO.md` §11 — a errata do bloqueante (commit 8)

**Ordem do Marcel, 2026-09-14, verbatim:**

> *"Eu escrevi no encerramento do V1 que 'a checagem real é o tamanho em disco contra o
> `bytes` do índice'. Estava errado. Corrija a §11 do `V1-ENCERRAMENTO` no commit de docs
> desta PR, com o motivo, e ponteiro para a div. 111 — é registro de bloco encerrado, mas uma
> afirmação falsa que orienta o próximo trabalho não pode ficar de pé."*

A célula a corrigir é a da **div. 103** na tabela do bloqueante, que hoje diz *"o
`files-index.json` já guarda `bytes` por URL (é o que o `knownBytes` lê): a checagem real é o
**tamanho em disco contra o esperado no índice**"*. Texto proposto, como nota de errata
**abaixo da tabela**, para não reescrever o registro do bloco:

> **Errata W1 (2026-09-14) — as duas prescrições desta tabela estavam erradas, e o pre-check
> do W1 mediu por quê.**
>
> 1. **"o tamanho em disco contra o esperado no índice" não funciona.** O `bytes` do
>    `files-index.json` é escrito **a partir do disco**, no `touch()`
>    (`files.ts:236`, `const bytes = localizar(url)?.file.size ?? …`), que corre logo depois
>    do download (`:197`) e **sobrescreve** o valor bom de uma passagem anterior. O índice não
>    é oráculo: comparar disco contra índice é comparar um número com ele mesmo.
>    **`W1-PRECHECK.md` div. 111.** E não há terceira fonte — a tabela `content` não tem
>    coluna de tamanho e o `ContentDTO` não tem campo (**div. 112**).
> 2. **"`size > 0` é o PISO" também está errado — não é nem o piso.** No Android o
>    `expo-file-system` abre `FileOutputStream(destination)` **antes do primeiro byte do
>    corpo** e escreve em cima do alvo; a doc da própria biblioteca o diz no comentário da
>    função que o app chama. Logo **um download EM VOO já conta como baixado**, e a checagem
>    de tamanho não alcança a corrida. **div. 113.**
>
> **O conserto é de outra natureza**: baixar para um nome temporário e renomear para o lugar
> só quando o download terminar — o `.tmp` + rename que o `store.ts:42` e o `files.ts:107` já
> usam, e que o arquivo baixado foi o único a não receber. Com ele, *existir é estar
> completo*, e a pergunta do tamanho desaparece.
>
> **E a div. 104 não era um travamento**: 14.400 bit/s = 1,8 KB/s, **~37 h** para 242.176 B.
> *"Não estava travado, estava chegando devagar demais"* (Marcel, 2026-09-14). O silêncio veio
> do `Promise.allSettled` cujo resultado o `baixar()` descarta (**div. 114**), não do OkHttp.

**E o item 1 da herança (`cache miss`) fica respondido no mesmo commit**: as duas coisas **não
se tocam** — ver div. 120 e a Q4 da §8.

### 9.3 `LOGS-OCTAVIA.md` — uma regra, um caso e duas linhas (commit 9)

**(a) A regra nova — da div. 110. Decisão do Marcel:** *"é a mais desconfortável e merece
regra, não culpa."* Entra ao lado das duas regras que já saíram do padrão:

> **3. Achado que vira BLOQUEANTE precisa do bruto COMMITADO, não só da prosa.**
> (Origem: div. 110. A div. 103 foi medida "de ponta a ponta" no aceite do V1 e o único
> registro que sobrou foi a **linha em prosa** da §9 do `V1-ENCERRAMENTO.md`:
> `grep -rn "File is empty\|e3b0c442" docs/` devolve só ela. O pre-check do W1 teve de
> **rederivar do código** — do Kotlin do `expo-file-system`, inclusive — um mecanismo que o
> logcat já tinha dito, e ao rederivar descobriu que a prescrição escrita na prosa estava
> errada nas duas metades.) A regra permanente do `CLAUDE.md` já manda o bruto entrar como
> anexo; o que esta acrescenta é **a prioridade**: quando o achado é o que bloqueia o próximo
> trabalho, o anexo não é higiene, é o insumo desse trabalho. **Prosa não se relê com `grep`.**

**(b) O 14º caso do padrão** — e a variante que o Marcel nomeou: *"não foi instrumento medindo
menos do que se supõe — foi a documentação do instrumento dizendo a verdade e ninguém lendo."*

| # | caso | o instrumento mede | eu li como se medisse |
|---|---|---|---|
| 14 | **div. 113** (W1-PRECHECK) | `File.downloadFileAsync` no Android: o corpo **streama direto para o arquivo alvo**, criado antes do primeiro byte — **e a doc da função diz isso, verbatim, no comentário que se lê para chamá-la** | "o arquivo existe ⇒ o download terminou". Daí a prescrição de *"`size > 0` é o piso"*, que não alcança um download **em voo** |

> **A variante, e por que ela merece nome próprio.** O caso 8 (div. 71) era o script
> documentando a própria cegueira numa nota que ninguém leu. Este é um grau além: **a
> documentação não descrevia um limite do instrumento — descrevia o comportamento, com
> precisão, na primeira tela de quem vai usá-lo**, e ainda contrastava Android com iOS
> ("*on iOS … the file is moved into place only after success*"), que é literalmente o
> conserto. Não houve nada a inferir: houve o que ler. **O padrão não é só desconfiar do que
> o instrumento mede; é ler o que ele já diz de si.**

**(c) A linha nova do catálogo** — **[decidido]**, Q4. *"'Achei e recusei' é um evento que não
existia no catálogo"*, e o `expected=<n|->` fica como está: *"admite que às vezes não se sabe
o esperado — honesto é melhor que completo"* (Marcel, 2026-09-14):

**(c.1) Uma linha nova** — o evento que não existia:

| Evento | Linha canônica | Quando | Aceites |
|---|---|---|---|
| arquivo recusado | `file-reject name=<seg> kind=empty\|short\|malformed bytes=<n> expected=<n\|->` | a checagem de integridade recusa um arquivo, no download (W1) ou no saneamento | W1-A1, W1-A3, W1-A6 |

**(c.2) Uma errata declarada, na linha `file`** — a decisão de formato da §8.1: o número da
taxa **não** vira linha nova (`file-progress` sairia uma vez, no fim, e o nome mentiria sobre
isso — a classe de defeito que as erratas E7 e E8 passaram dois blocos consertando). Ele entra
na linha que já sai uma vez por download:

| Evento | Linha canônica | Quando | Aceites |
|---|---|---|---|
| arquivo | `file src=disk name=<seg> bytes=<n>` · `file src=download name=<seg> bytes=<n> total=<n\|-> ms=<n>` — **errata W1** | T1-R14. O `total` (`Content-Length`, `-` se ausente) e o `ms` (início do download → rename) **só no `src=download`** | A9, A13, **W1-A2** |

As três perguntas ficam em três linhas distintas, e é de propósito: `file` responde *"o que eu
tenho e quanto custou"*; `file-reject`, *"achei e recusei"*; `download-error`, *"não consegui
baixar"*.

E o `download-error` deixa de ser emitido em **um** lugar: o commit 4 o faz sair também dos
três caminhos de prefetch (**div. 114**), o que muda o `G3` para "antes ⊆ depois" (§5).

---

## 10. Riscos, com a prova mais barata de cada

| risco | prova mais barata |
|---|---|
| **O `.part` vira lixo permanente** — um app morto no meio deixa `.part` que ninguém apaga | o **W1-A6** já varre: o saneamento apaga `*.part` mais velho que uma abertura. E o `listFiles()` itera pelo índice, que nunca conhece um `.part` |
| **O `moveSync` de arquivo grande bloqueia o JS** — o `files.ts:116` já escolheu `moveSync` por causa de uma corrida, e agora ele moveria 242 KB | dentro do **mesmo volume** o rename é uma operação de metadado. Prova: mover o 12p por `run-as` e cronometrar; se der ms, está resolvido. **Atenção**: durável e purgável são volumes diferentes — o `.part` tem de nascer **no diretório alvo**, nunca num terceiro |
| **O teto de inatividade dispara em rede sã** e quebra o A9/A10 | o `T = 30 s` é **medido zero vezes** (§8.1). Prova barata e sem bucket: o **W1-A3**, com o servidor de host entregando devagar mas sem parar — se sair `download-error`, o teto confunde lento com morto |
| **A fila de trabalhadores abre mais de 3 conexões** — o invariante do T1-R13 é `≤ 3` | o mesmo instrumento do W1-A7: contar as linhas `file src=download` sem `ms=` fechado num instante, ou instrumentar o pool com um contador no teste do commit 1. É teste de unidade, não de aparelho |
| **A troca para `DownloadTask` muda o comportamento de erro** — hoje um 404 rejeita com `UnableToDownload`; o `DownloadTask` pode formatar diferente | teste de unidade não pega (é nativo). Prova: o **W1-A3** com o servidor de host devolvendo 404, **zero bucket** |
| **O G3 virando "⊆" esconde uma linha que sumiu** | o próprio `comm -23` do G2 já é a forma; o G3 passa a usá-la, e a lista das **novas** sai impressa no commit, como o G2 já faz com os `testID` |
| **O saneamento apaga um arquivo bom** por causa de uma heurística de PDF | a checagem de forma só reprova quem **não** tem `%PDF` na cabeça ou `%%EOF` com `startxref` dentro do tamanho — os três arquivos reais dos dois aparelhos passam (§2/H4). E o dano de um falso positivo é **um re-download**, não perda de dado |
| **A PR inteira é invisível no palco** — nada disso aparece para o Marcel tocando | é o ponto: a prova é o **W1-A6**, que planta o defeito e mostra o cartão caindo de "garantida" para "parcial". Se o cartão não cair, a PR não fez nada |
| **A fila de três trabalhadores (div. 122) muda a ORDEM dos downloads** — hoje a barreira de lote garante que os três primeiros terminam antes de o quarto começar, e a ordem do `prefetchOrder` é contrato do T1-R16 | a ordem de **início** continua a do core; o que muda é a de **término**, que o PRD nunca prometeu. Prova barata: o aceite **W1-A4** com três arquivos e um lento — os outros dois têm de terminar **antes** do lento, e é isso que o conserto quer |
| **O `W1-A2` não consegue distinguir "não abortou porque a rede estava sã" de "não abortou porque o teto não funciona"** | é por isso que o commit 3 tem de ligar e logar o `onProgress` (§8.1, fim): sem a taxa medida no log, o aceite vira impressão |

---

## 11. Divergências — **110 a 122**, continuando o V1

Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** instrumento.

| # | origem | o que é |
|---|---|---|
| **110** | **T** | **O achado mais grave do V1 não tem anexo bruto.** A div. 103 foi medida "de ponta a ponta" e o único registro é a **linha em prosa** da §9 do `V1-ENCERRAMENTO.md`: `grep -rn "File is empty\|e3b0c442"` em `docs/` devolve **só ela**. A regra permanente do `CLAUDE.md` diz que o bruto entra como anexo. Consequência concreta: este pre-check **não pôde reler o logcat original** e teve de rederivar o mecanismo do código |
| **111** | **A** | **O `bytes` do `files-index.json` não é oráculo: ele vem do disco.** `touch()` grava `localizar(url)?.file.size` (`files.ts:236`), logo depois do download (`:197`), sobrescrevendo o valor bom que a entrada tivesse. **Derruba a premissa do prompt e da §11 do `V1-ENCERRAMENTO.md`** ("tamanho em disco contra o esperado no índice" compara um número com ele mesmo) |
| **112** | **A** | **Não existe tamanho esperado no contrato.** A tabela `content` tem 22 colunas e nenhuma de tamanho (`types/database.types.ts`); o `ContentDTO` tem 8 campos e nenhum. A única fonte possível é o `Content-Length` da resposta, disponível só no momento do download |
| **113** | **A** | **No Android o arquivo de destino é criado antes do primeiro byte do corpo e cresce em disco.** `FileOutputStream(destination)` em `FileSystemDownload.kt:97`, e a doc da própria biblioteca diz verbatim em `File.ts:45-48`. Logo **um download EM VOO já conta como baixado**, e `size > 0` **não é nem o piso** — é inútil contra a corrida. A forma certa é temp+rename, que o repositório já usa em `store.ts:42` e `files.ts:107`. **14º caso do padrão "instrumento com escopo menor do que parece"** |
| **114** | **A** | **O `baixar()` descarta o resultado do `Promise.allSettled`** (`prefetch.ts:74`): toda falha de download nos três caminhos de prefetch é invisível. **Violação direta do T1-R37.** O `download-error` existe em **um** lugar no app inteiro: `StageScreen.tsx:352` |
| **115** | **A** | **O laço de promoção não é protegido** (`prefetch.ts:111`): uma rejeição sobe até o `void rodarSync(...)` (`App.tsx:178`/`:183`) como rejeição sem dono **e impede o `recarregarArquivos()`** — o LRU não corre e o `filesPresent` não atualiza |
| **116** | **A** | **`signal` e `onProgress` são declarados em `DownloadOptions` e não funcionam para `File.downloadFileAsync`**: o progresso depende de um `downloadUUID` que o estático não passa (`FileSystemModule.kt:58`), e a fiação do abort vive só em `DownloadTask` (`NetworkTasks.ts:430`). Timeout exige migrar para `File.createDownloadTask(...)` — mesmo pacote, zero dependência nova |
| **117** | **D** | **O `PRD-TELA-1.md` é cúmplice**: o T1-R17 (`:179`) define a garantia como as `file_url` **"existirem"** no cache de `file`. O `localizar()` implementa o PRD com fidelidade. **Terceira errata do PRD**, além do A4 e do A15 |
| **118** | **D/T** | **Os três controles inertes do palco são `enabled=true clickable=true` na árvore de acessibilidade** — medido nos dumps do próprio V1 (`AVicones-B2-pdf-inertes.xml`) e conferido em `StageScreen.tsx:807-827`, que não põe `disabled` nem `accessibilityState`. A errata **E3** afirma "na árvore, `enabled=false`": verdade para o `entrar` do S0 (AV-4), falsa para o palco |
| **119** | **A** | **O `emVoo` deduplica por URL e ignora as opções** (`files.ts:151-167`): quem pede um arquivo já em voo recebe a promise alheia, com o `guaranteed` do outro. Efeitos: (a) o palco herda a promise do prefetch e, se ela não assenta, fica em `buscando` sem alcançar o `catch` do `download-error`; (b) um pedido `guaranteed:true` que pega carona num voo `false` grava no purgável — o `promoteList` conserta na passada seguinte, não nessa |
| **120** | **P** | **A conjectura do item 2 da herança do V1 cai: o `cache miss` e a div. 103 NÃO se tocam.** Um `miss` dispara quando algo não é achado; o arquivo de 0 byte **foi achado**. A linha que falaria já existia e falou (`file src=disk … bytes=0`). O que faltou não foi log, foi **checagem** |
| **122** | **A** | **Um download lento PARA A FILA INTEIRA.** O `baixar()` (`prefetch.ts:71-76`) espera o lote inteiro (`await Promise.allSettled(lote)`) antes de começar o próximo: um arquivo a 1,8 KB/s impede os arquivos do 4º em diante de sequer **começarem**, inclusive os que baixariam em segundos. E como `prefetch7Dias` só devolve no fim, o `recarregarArquivos()` (`App.tsx:88-90`) não corre — **o LRU não é aparado e o `filesPresent` não é atualizado**. Achado ao investigar a objeção do Marcel à recomendação da Q2 (§8.1). O conserto **não é um teto**: é uma fila com três trabalhadores no lugar da barreira de lote |
| **121** | **D** | **O T1-R17 (i) exige `updated_at` igual ao do último sync e o `offlineStatus` nunca olha `updated_at`** (`core/offline.ts:52-65`). Gap PRD × código no outro eixo da garantia. **Fora desta PR** — [decidido], §8, Q5; proposta para o N2 |

**Contagem por origem, das 13**: **A** 8 (111, 112, 113, 114, 115, 116, 119, 122) ·
**D** 3 (117, 118, 121) · **P** 1 (120) · **T** 1 (110).

**A leitura da contagem**: oito das treze são **do código**, e nenhuma delas é regressão do V1 —
o `files.ts` e o `prefetch.ts` fecharam o bloco inteiro sob o G1 com diff vazio. São defeitos
que estavam lá desde o N1 e que ninguém tinha motivo para procurar até o V1 escrever
"todos os arquivos neste aparelho" em cima deles.

---

## 12. Contabilidade e estado final

| | |
|---|---|
| **requests a `/api/*` em prod** | **0** — teto da sessão era 4, alvo 0. **Alvo cumprido.** O AVD ficou em avião provado por `ping` a sessão inteira e o app nunca foi aberto por mim |
| **downloads de bucket** | **0** — teto era 1, e o §3 não exigiu nenhum |
| **logins** | 0 · **escrita pela API** 0 · **console Supabase/Firebase** 0 |
| **comandos ao Tab S6** | **0.** Ele aparece em `adb devices` e **nunca foi endereçado**; todo comando levou `-s emulator-5554` |
| **commits / branches / pushes** | **0 / 0 / 0.** O `W1-PRECHECK.md` e o anexo estão **não versionados** na árvore `../octavia-w1` |
| **mutação do repositório** | **0** — nenhum `pnpm add`, nenhum toque em `package.json` ou lockfile. O único script escrito (`barra.mjs`) nasceu no scratch, fora do repositório |

### O emulador, antes × depois

| | antes (como encontrado) | depois |
|---|---|---|
| AVD | `octavia_tab32`, up há 6 h 43 min | **igual — não foi subido nem morto por mim** |
| app | `rocks.octavia.app` pid 11854, **de pé há 4 h 34 min** (deixado pela V1-PR7) | igual, mesmo pid |
| rede | avião, `ping` → `Network is unreachable` | **igual, reconferido ao fim** |
| `content.json` | `d27e6d84…` | `d27e6d84…` |
| `setlists.json` | `0a3a0638…` | `0a3a0638…` |
| `files-index.json` | `cce7936f…` | `cce7936f…` |
| `files/…-12p.pdf` | `ad2eae09…` (durável) | `ad2eae09…` |
| `cache/…-1p.pdf` | `3d42199b…` (purgável) | `3d42199b…` |

Os cinco sha batem **byte a byte** com o "FIM" registrado no `V1-PR7-anexos/…-E-…txt` §4.
**Só leituras foram feitas** (`run-as cat/find/stat/sha256sum/head/tail`, `settings get`,
`ping`, `pidof`, `ps`, `uptime`, `pm list`, `emu avd name`) — nenhum `run-as cp`, logo não
houve backup a restaurar.

**Um erro meu, declarado**: a primeira sondagem usou o pacote `rocks.octavia.native` e
concluiu "app fechado". O pacote é `rocks.octavia.app`. Corrigido no anexo §1, e sem
consequência — o app estava em avião o tempo todo.

### O que fica pendente

**1. A reprodução do travamento no aparelho não foi feita — e o Marcel decidiu que não será.**
O mecanismo está fechado por leitura (o Kotlin do `expo-file-system` e a doc da própria
função), e o **W1-A6** reproduz o estado por plantio com `run-as`, a custo zero e de forma
repetível. Decisão dele, verbatim (Q7): *"o plantio por `run-as` é custo zero e repetível, que
é melhor que uma medição única. A ponta a ponta com link estrangulado se decide depois do
conserto, se ainda fizer falta."* Se voltar a fazer falta, ela custa **1 arquivo de
242.176 B** de bucket na conta de audit, e se pede antes.

**2. Nenhuma pergunta fica aberta.** As oito foram decididas (§8), a última delas — o teto
de download — no terceiro aval, com o desenho inteiro na §8.1. **O que fica registrado como
dívida deliberada, e não como pendência**, é a **opção C** (a projeção de término): ela não
entra porque **falta o `T₁`, e ele não se inventa, se mede** — o lugar exato onde entraria fica
marcado no código, com o comentário pronto na §8.1 dizendo o que falta medir. A primeira
população de taxas nasce do próprio aceite **W1-A2**, pela errata da linha `file`
(`total=` e `ms=`).

**3. Duas hipóteses continuam declaradas e não medidas**, as duas na §8.1: que um processo de
app não sobreviva 37 h num tablet, e que 30 s de silêncio seja morte de conexão. A segunda é o
`T` do commit 3, e é **medida zero vezes** — convenção de rede, não medição deste projeto.
Quem a confirma é o **W1-A2**.
