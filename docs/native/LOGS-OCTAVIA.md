# Contrato de observabilidade do nativo — linhas `OCTAVIA:`

> **Origem**: pre-check do N1 ([`N1-PRECHECK.md`](N1-PRECHECK.md) A6, decisão
> **N1-D5** + emenda E3, 2026-09-10). Herda o padrão do N0 (`src/log.ts`:
> `console.log('OCTAVIA: ' + msg)` → tag `ReactNativeJS` do logcat). Este
> documento é o que os aceites A1–A22 citam: cada linha abaixo é um evento
> observável por `adb logcat -d -s ReactNativeJS | grep 'OCTAVIA:'`, sem
> instrumentação além do `console.log`. Mudar uma linha é mudar contrato
> (errata declarada, nunca acomodada).

## Regras

1. **Uma linha por evento**, formato `OCTAVIA: <evento> k=v k=v …`; chaves
   fixas, valores sem espaço (o `grep`/`awk` dos protocolos dependem disso).
2. **Nunca entra**: token, email, senha, corpo de música (letra/cifra/tab),
   termo de busca literal (só o comprimento), URL completa (só o último
   segmento `<seg>`), nome de arquivo fora do `<seg>`, dados de perfil.
3. `<uid>` é o uid do Firebase (já público nos docs do N0); `<id8>` são os
   8 primeiros caracteres de um uuid; `<ms>` inteiro em milissegundos
   (`Date.now()` entre o tap/início e o primeiro frame ou o fim da operação).
4. Os anexos de aceite colam as linhas verbatim; `grep -rn eyJ` e
   `grep -rln <email>` sobre os anexos devem devolver exit 1.

## Catálogo

| Evento | Linha canônica | Quando | Aceites |
|---|---|---|---|
| sessão restaurada / login | `auth uid=<uid> src=login\|restored` | `onAuthStateChanged` com user | A1, A5 |
| sem sessão | `login-screen` | `onAuthStateChanged` sem user | A5 (controle negativo) |
| renovação de token | `auth refresh=forced\|cached` | antes de cada request (T1-R2) | A1 |
| sessão inválida | `auth-failure` | 2º 401 ou refresh sem token novo (T1-R3) | A2 |
| request à API | `api status=<s> path=<path> n=<1\|2> ms=<ms>` | toda resposta de `/api/*` | A1, A2, A4, A22 |
| 429 | `ratelimit retry-after=<s> family=<f>` | resposta 429 (T1-R4) | A3 |
| início do sync | `sync start` | T1-R13 passo 2 | A4 |
| sync ok | `sync ok setlists=<n> content=<n> pages=<p> t=<ms>` | as duas listas aplicadas (E3: `t=` do `sync start` ao cache gravado) | A4, A7 |
| sync falhou | `sync fail stage=setlists\|content page=<p> code=<code\|network\|net> status=<s\|->` — **E8(3)** | qualquer não-2xx/rede; cache anterior mantido (T1-R9) | A19, A21 |
| sync pulado | `sync skip reason=offline` | sem rede ao abrir | A5 |
| cache | `cache hit kind=setlists\|content\|file n=<n>` · `cache write kind=… n=<n> invalidated=<n>` — **E8(2): `cache miss` nunca foi implementado** | leitura/gravação do cache local (T1-R10: `invalidated=0` em sync sem mudança) | A4, A5, A7, A21 |
| prefetch | `prefetch plan n=<n> reason=7d\|manual\|demand` | T1-R15/R16 | A10 |
| promoção | `prefetch promote n=<n>` | arquivos já no disco que entraram na janela de 7 dias e foram movidos para o armazenamento não-purgável (T1-R14 + N0-H16 §4) — **E7** | A10 |
| arquivo | `file src=disk name=<seg> bytes=<n>` · `file src=download name=<seg> bytes=<n> total=<n\|-> ms=<n>` — **errata W1** | T1-R14 (herdado do N0). O `total` (`Content-Length`, `-` se ausente) e o `ms` (início do download → rename) **só no `src=download`**: não houve download, não há total nem duração | A9, A13, **W1-A2/A3/A7** |
| arquivo recusado | `file-reject name=<seg> kind=empty\|short\|malformed bytes=<n> expected=<n\|->` — **W1** | a checagem de integridade recusa um arquivo, no download ou no saneamento da abertura | W1-A1, W1-A3, W1-A6 |
| LRU | `lru evict n=<n> bytes=<n>` | T1-R14 | A10 |
| navegação no palco | `nav n=<i>/<N> setlist=<id8> t=<ms>` | após avançar/voltar/salto (T1-R27/R28/R34) | A12, A14, A17 |
| fim da setlist | `end-of-setlist n=<N>` | T1-R29 | A14 |
| índice | `index open` · `index jump n=<i>` | T1-R28 | A14 |
| busca | `search q=<len> n=<hits> in-setlist=<k>` · `search close restore n=<i>/<N>` | T1-R20–R23 | A11 |
| zoom | `zoom dp=<18\|22\|26\|32\|40>` | T1-R31 | A15 |
| tema | `theme=dark\|light` | T1-R32 | A15 |
| auto-scroll | `autoscroll on\|off t=<ms>` · `autoscroll disabled kind=pdf` | T1-R30 | A15 |
| placeholder | `placeholder kind=no-body\|no-key\|not-string\|unknown-type\|content-missing` · `placeholder kind=file-missing name=<seg>` — **E8(1)** | T1-R7(b)(c)(d), R11, R26 | A6, A8, A13 |
| rede | `net online\|offline` | mudança de estado (`expo-network`, N1-D11) | A5, A19 |
| rotação | `rotation=landscape\|portrait n=<i>/<N>` | T1-R27 (N1-D12: rotação preserva posição). **Só na MUDANÇA de orientação**, nunca na montagem do palco — implementada na N1-PR8 (**E7**) | A14 |
| wake lock | `keepawake on\|off` | entrar/sair do palco (T1-R33) | A16 |
| palco restaurado | `stage restore n=<i>/<N>` | o palco reganha foco vindo de uma tela EMPILHADA (índice, busca, palco avulso) — não na montagem inicial, não no palco avulso — **N1-D17** | A11, A14 |
| pdf | `pdf-render pages=<n> src=disk` · `pdf-page n=<i>/<N>` · `pdf-error <msg>` | herdado do N0 (T1-R26) | A13 |
| falha de download | `download-error <msg>` | o download rejeitou (T1-R26/R37) — **E5**. **Errata W1**: deixou de sair em UM lugar só (o `catch` do palco) e passa a sair também nos três caminhos de prefetch, um por rejeição (div. 114); e a `<msg>` é traduzida e higienizada num ponto só, porque ela vai para o log **e** para a tela do S3e — URI completa nunca entra em log (regra 2). **Errata W2**: a `<msg>` **deixa de ir para os dois lugares**. O log continua recebendo o DETALHE (o nome do objeto e a causa crua, com a URL higienizada), e a tela passa a receber uma frase de um conjunto FECHADO em pt-BR — ver a errata W2 no fim deste arquivo | A13, **W1-A4** |
| cache de arquivos apagado | `files-cleared` | instrumento de prova; nenhuma UI chama — **E5** | A13 (controle negativo) |

## Errata E5 (2026-09-10, N1-PR5)

Duas linhas do **N0** que os aceites usam e que o catálogo do N1-PR1 não
listava, acrescentadas acima: `download-error <msg>` (a rejeição do
`File.downloadFileAsync` — sem rede é `Call to function
'FileSystem.downloadFileAsync' has been rejected.`, com a causa Java em
`→ Caused by:`, medido no N0-H16 §2) e `files-cleared`. Elas são **eventos
distintos** de `pdf-error`, que é falha de RENDER de um arquivo já no disco.

O prompt da N1-PR5 pedia `pdf-placeholder name=<seg>` para o S3e — nome do
N0. **Não foi adotado**: o catálogo do N1 já tem esse evento como
`placeholder kind=file-missing name=<seg>`, e duas linhas para o mesmo fato
seriam contrato duplicado. O S3e emite a linha do catálogo. Divergência
declarada, não acomodada.

## Errata E6 / N1-D17 (2026-09-10, N1-PR7)

`stage restore n=<i>/<N>` entra no catálogo. Origem: na N1-PR6 a única prova
de que o palco voltava na posição certa depois de abrir uma música avulsa
(T1-R22) era comparar dois screencaps pixel a pixel (`magick compare -metric
AE` → 0 na barra do palco). **Um aceite não deve depender de comparação de
imagem** — decisão do Marcel.

Quando sai: no `useFocusEffect` do palco, a partir do **segundo** foco. A
montagem inicial não é uma volta e não emite. O palco **avulso** também não
emite: ele não tem posição na setlist (a barra mostra "AVULSA").

**Quais caminhos emitem, medido no device (N1-PR7)** — o que separa os dois
casos é qual tela fica na pilha, não a intenção:

| Caminho | Emite? | Por quê |
|---|---|---|
| palco → **busca** → volta (fechar, ou abrir avulso e voltar) | **sim** | a busca EMPILHA sobre o palco; o palco não é destruído e reganha foco |
| palco → **índice** → tocar numa posição | **não** | o índice já está na pilha ABAIXO do palco, então `navigate('Index')` **desempilha** o palco; voltar ao palco cria uma instância nova, cujo primeiro foco não é uma volta |
| palco avulso (empilhado pela busca) | **não** | não tem posição na setlist |
| montagem inicial de qualquer palco | **não** | não é uma volta |

A primeira versão desta errata afirmava que o salto pelo índice também
emitiria; **o device mostrou que não** (`index jump n=1` seguido de
`keepawake off`/`on` sem `stage restore`), porque o índice desempilha o palco
em vez de empilhar sobre ele. Corrigido aqui.

Nos casos em que a busca é fechada sem abrir nada, saem as DUAS linhas —
`search close restore` (da busca, ao fechar) e `stage restore` (do palco, ao
focar): eventos distintos da mesma volta.

## Errata E7 (2026-09-10, N1-PR8) — o que o aceite mostrou que faltava

O aceite da N1-PR7 encontrou **duas** linhas em desacordo entre catálogo e app,
e a N1-PR8 acertou as duas no lado do app:

1. **`rotation=landscape|portrait n=<i>/<N>` estava no catálogo desde o
   N1-D5 e nunca tinha sido implementada** (`grep -rn rotation
   apps/native/src/` → exit 1). O A14 foi provado por screencap porque o log
   não existia. Agora sai, e **só na mudança de orientação**: a montagem do
   palco não emite, senão toda abertura produziria uma linha falsa.
2. **`sync fail … page=<p>` tinha `page=1` hardcoded** no `sync.ts`: no A21 a
   falha aconteceu na página 2 e o log dizia 1. A página que falhou agora
   viaja do `buscarContent` até a linha. (`/api/setlists` não pagina — array
   na raiz, `SETLISTS.md` — então ali a página é sempre 1, por construção.)

E uma linha **nova**, `prefetch promote n=<n>`, para o defeito do §3.1 do
aceite: arquivo baixado sob demanda que depois entra na janela de 7 dias
precisa ser movido do `Paths.cache` (purgável) para o `Paths.document`. Sem
ela, a promoção seria invisível no protocolo de device.

## Caminho de dev (E4)

O 401 forjado do aceite A2 é **caminho de desenvolvimento**: só existe com
`__DEV__` **e** `EXPO_PUBLIC_DEV_FORGE_401=1`; nunca em build de release.
A linha esperada é `api status=401 path=/api/setlists n=2` seguida de
`auth-failure` — e nenhuma terceira `api status=401`.

## Errata E8 (2026-09-14, V1-PR7) — três linhas que o catálogo prometia e o app não emite

O aceite do V1 rodou os 22 critérios do PRD contra o app mergeado e leu o logcat linha a
linha. Três entradas deste catálogo não descrevem o que o app faz. **As três são erratas do
CATÁLOGO, não do app** — com uma ressalva marcada em (2), que fica como pergunta aberta.

**(1) `placeholder kind=…` — defasagem de nomenclatura.** O catálogo listava
`invalid | unknown-type | file-missing | content-missing`, com `name=<seg>` em todos.

| | |
|---|---|
| o catálogo dizia | `placeholder kind=invalid\|unknown-type\|file-missing\|content-missing name=<seg>` |
| o app emite | `no-body` · `no-key` · `not-string` · `unknown-type` · `content-missing`, **sem `name=`**, e `file-missing name=<seg>` — este sim com o segmento |
| onde | `apps/native/src/screens/StageScreen.tsx:329` e `:342`; os quatro primeiros são o `reason` do contrato de leitura do core, `packages/core/src/content-contract.ts:30` |
| como foi medido | fixtures `invalidos-content` + `invalidos-songs` + `content-ausente` no AVD, as quatro posições abertas uma a uma: `placeholder kind=no-body` · `no-key` · `unknown-type` · `content-missing` (`V1-PR7-anexos/V1-PR7-A-regressao-avd.txt`, A6/A8) |

**`invalid` nunca existiu**: a regra (c) do T1-R7 produz dois motivos distintos (`no-key` e
`not-string`) e a (b) produz `no-body`, e o app loga o motivo, não a categoria. A linha
canônica passa a ser:

`placeholder kind=no-body|no-key|not-string|unknown-type|content-missing` ·
`placeholder kind=file-missing name=<seg>`

**É defasagem de nomenclatura, não linha inexistente**: o evento sempre saiu, com outros
valores. O `not-string` é o único dos cinco que este aceite **não** viu sair — a fixture do
A6 cobre (b), (c)-sem-chave e (d), não (c)-chave-não-string.

**(2) `cache miss kind=…` — linha que NUNCA EXISTIU.** Diferente da (1):

```
$ grep -rn "cache miss" apps/native/src packages/core/src   → 0 ocorrências
```

O app emite `cache hit` (`store.ts:103-104`) e `cache write`; `miss` está no catálogo desde
o N1-D5 e nunca foi implementado. A origem é o commit que criou este documento (`a3517bb`,
N1-PR1), onde o `N1-PRECHECK.md` §A6 o escreve como parte do tripé
`cache hit|miss|write kind= n= invalidated=` — **o tripé foi especificado inteiro e
implementado pela metade**. É a mesma classe do `rotation=`, que a E7 achou no aceite do N1.

O catálogo passa a listar só `cache hit` e `cache write`. **Mas a pergunta fica aberta**, e
está numerada na herança do `V1-ENCERRAMENTO.md`: *o `cache miss` deve existir?* Ele foi
especificado por alguma razão, e há um caso desta PR em que ele teria falado —
o arquivo de 0 byte da div. 103, que o app serviu do disco sem que nada registrasse a
anomalia. Corrigir o catálogo sem abrir a pergunta apagaria a pergunta junto com a
discrepância. **Decisão do Marcel, 2026-09-14.**

**(3) `sync fail … code=<code|net|nojson>` — defasagem de nomenclatura, nos dois valores
que não são `<code>`.**

```
$ grep -rn "nojson" apps/native/src packages/core/src   → 0 ocorrências
```

O `'net'` literal existe numa posição só (`apps/native/src/sync.ts:80`), o ramo em que não
há erro nenhum a reportar. **A falha de rede de verdade emite o `kind` do core**, que é
`network` (`packages/core/src/errors.ts:16`), e o `status` vira `-`:

```
OCTAVIA: sync fail stage=setlists page=1 code=network status=-
```

medido no Tab S6 com a base da API desviada para uma porta morta. A linha canônica passa a
ser `code=<code-do-CONTRATO-DE-ERRO|network|net>` e `status=<s|->`, onde `net` só sai no
ramo sem erro e `-` significa "não houve resposta HTTP".

**Nenhuma das três altera uma linha de código.** As erratas anteriores deste documento
(E5, E6, E7) acertaram o lado do app; estas três acertam o lado do catálogo, porque em
todas o app está certo e o documento é que envelheceu — com a ressalva de (2), cuja
pergunta de produto continua aberta.

---

## O padrão — "instrumento com escopo menor do que parece"

> **Migrado para cá na V1-PR7**, por decisão do Marcel (2026-09-13). O padrão nasceu na
> §9.1 do [`V1-PR3-PRECHECK.md`](V1-PR3-PRECHECK.md), foi crescendo PR a PR e não podia
> ficar enterrado num pre-check de PR: é o achado mais reaproveitável do bloco V1, e vale
> para qualquer bloco que meça alguma coisa. O `V1-PR3-PRECHECK.md` fica como está, com um
> ponteiro para cá.

O Marcel juntou quatro casos do bloco N1; o V1 acrescentou seis; o aceite da V1-PR7,
mais três; o W1, mais dois; a W2, mais três. **São dezoito, e é quase sempre o mesmo
erro**: ler o que o instrumento mede como se fosse o que se queria saber. O 15º é a
exceção, e é o mais
perigoso: um instrumento que mede **mais** do que a coisa medida.

> ### E há uma coisa acima dos casos: **o que acontece quando TRÊS se empilham**
>
> *(Nomeado pelo Marcel no aval da W2, 2026-09-15.)* Os casos abaixo são um
> instrumento de cada vez. A W2 produziu a primeira vez no projeto em que **três
> instrumentos INDEPENDENTES falharam sobre a MESMA cadeia, cada um por um motivo
> diferente** — e a cadeia era justamente a que os três existiam para pegar: a
> mensagem crua em inglês que chegava à tela do músico (div. 125).
>
> | instrumento | por que não a viu | div. |
> |---|---|---|
> | `gate:a20` | **natureza** — acusa LITERAL em posição de texto, e ela é valor de tempo de execução. Nenhum escopo a alcança | 130 |
> | `lc()` do protocolo de device | **truncamento** — `grep -o 'OCTAVIA: .*'` para na quebra de linha, e a mensagem tem duas | 138 |
> | `uiautomator dump` | **renderização** — devolve `text=""` no `<Text>` multilinha, então a varredura de inglês sobre os dumps do ANTES acusa as MESMAS quatro cadeias do DEPOIS | 139 |
>
> **Quem a viu foi a captura de tela e o logcat lido inteiro.** Nenhum dos dois é
> gate; os dois são olhar.
>
> O que o empilhamento ensina, e que nenhum caso isolado ensinava: **três
> instrumentos concordando não são três medições — podem ser três silêncios.** A
> concordância entre instrumentos é evidência fraca quando eles falham por razões
> diferentes, porque é exatamente isso que faz os três calarem juntos sem que
> nenhum acuse. O que rompeu o empilhamento não foi um quarto instrumento melhor:
> foi **mudar de gênero** — olhar a tela e ler o log inteiro.
>
> E o que passa a IMPEDIR a cadeia não é nenhum dos três, nem um quarto do mesmo
> tipo: é o teste de unidade sobre `falha()` (`files-mensagem.test.ts`), que
> afirma um conjunto FECHADO e não depende de ler tela nem de ler log.

| # | caso | o instrumento mede | eu li como se medisse |
|---|---|---|---|
| 1 | **A14** (N1) | tap no centro | a extensão do alvo |
| 2 | **div. 21** (V1-PR0) | bounds visíveis no dump | a altura real do item |
| 3 | **E1** (DESIGN-V1) | o que os inventários citam | o que o `theme.ts` contém |
| 4 | **avião** (V1-PR3-PRECHECK §9) | o valor do setting | o rádio desligado |
| 5 | **store do AVD** (V1-PR3-PRECHECK §10) | o filesystem vivo dentro do boot | o estado durável do AVD |
| 6 | **origem "lucide"** (E4 do design) | de onde veio a ideia do desenho | de onde veio o `path` |
| 7 | **div. 53** (V1-PR3) | `accessibilityLabel` nas três formas de literal | os sete labels do palco, que são **ternários** — a forma que a própria PR introduziu. No commit 4 o gate leu 36 literais e 0 acusações **sem ler nenhum dos sete** |
| 8 | **div. 71** (V1-PR5) | o `normal` dos 34 desenhos contra o anexo D | o mapa de ícones inteiro — `ativo`, `inerte` e **`em20`** ficavam de fora, e o `em20` é a única exceção declarada da §6.3. **O próprio script dizia isso por escrito** na nota da regra 2; ninguém tinha lido a nota |
| 9 | **div. 80** (V1-PR5) | a duração de **um** run de CI, medida uma vez | o custo do gate, uma propriedade estável do `native.yml`. Com onze runs: **9m16s não é regime, é o melhor de onze** |
| 10 | **div. 82** (V1-PR6) | `rotulo=` e `motivo=` como **prop de JSX** | todo texto de UI que o app põe nesses nomes — e a PR anterior os tinha introduzido como **chave de objeto** |
| 11 | **div. 108** (V1-PR7) | o **G1**: diff vazio nos NOVE módulos não-visuais e em `packages/core/src` | "o comportamento do app não mudou". O `StageScreen.tsx` **não está entre os nove**, a V1-PR3 o reescreveu inteiro, e é lá que vivem o `useKeepAwake` (A16), a rotação (A14) e o `requestAnimationFrame` do auto-scroll (A15). *Nomeado pelo Marcel, 2026-09-14, ao recusar a dispensa do A16.* |
| 12 | **div. 99** (V1-PR7) | o `store()` do aparato: `sha256sum files/octavia-<uid>/files/*` | o cache de arquivos do app. Metade dele vive no **purgável** (`cache/octavia-<uid>/files/`), e a baseline do bloco nunca viu o PDF de 1 página que estava lá |
| 13 | **os 58,2 dp** (V1-PR7) | o `uiautomator dump`: o nó **acessível** | o elemento **desenhado**. O campo do S0 mede 58,2 dp no dump e 60 no estilo — `height: touch.list + 4` no contêiner, menos 1 dp de borda de cada lado. *Instância, não defeito (decisão do Marcel).* |

| 14 | **div. 113** (W1) | `File.downloadFileAsync` no Android: o corpo **streama direto para o arquivo alvo**, criado antes do primeiro byte — **e a doc da função diz isso, verbatim, no comentário que se lê para chamá-la** | "o arquivo existe ⇒ o download terminou". Daí a prescrição de *"`size > 0` é o piso"*, que não alcança um download **em voo** |
| 15 | **div. 126** (W1) | o **duplo de teste** do `expo-file-system`, que emitia `onProgress` a cada pedaço | a biblioteca real — que entrega o progresso **uma vez, no fim, em rajada**. **O teste passou porque o dublê emitia progresso; o aparelho não emite.** O gate verde carimbou um teto de inatividade que não pode disparar |

| 16 | **div. 128** (W2) | o **G3**: as linhas `log(` de `apps/native/src` e `packages/core/src` — **54** | "o catálogo de observabilidade está protegido; nenhuma linha some em silêncio". O `App.tsx` mora **um nível acima de `src/`**, e dentro dele vivem **três** linhas do catálogo: `login-screen` (que prova o A5), `auth uid=… src=…` (A1 e A5) e `download-error` (A13, W1-A4). População certa: **57**. O controle negativo: apagar `log('login-screen')` e o gate responder *"nenhuma linha sumiu ✓"* |
| 17 | **div. 130** (W2) | o **`gate:a20`**: LITERAL em posição de texto | "o aceite A20 está cumprido — nenhum texto de UI em inglês". O que chegava à tela do músico no S3e era texto de UI em inglês que **não é literal**: é valor de tempo de execução, vindo da biblioteca. **Nenhum escopo alcança**, nem `apps/native` inteiro. É o par estrutural do 11 e do 12 (escopo declarado), mas com uma diferença que o torna pior: ali o escopo era *menor*; aqui é de **outra natureza** |
| 18 | **div. 139** (W2) | o **`uiautomator dump`**: o nó acessível, com o `text` que o Android expõe | "o que está na tela". O `<Text>` de várias linhas do `download-erro` volta do dump com **`text=""`** e só os `bounds` — então a varredura de inglês sobre os dumps do ANTES acusa as **mesmas 4** cadeias do DEPOIS e **não vê** a frase de 4 linhas que é o objeto inteiro da div. 125. Quem a viu foi a **captura de tela** e o **logcat**. É o 13 uma volta adiante: lá o dump media o nó e não o desenho; aqui ele **não mede nem o nó** |

| 19 | **div. 140** (W3) | o **coletor do G2/G3**: `testID="…"` e `log(` no texto **CRU** do arquivo — comentário incluído | "as populações do antes e do depois são o código". A W2 viu a metade inofensiva disto (div. 136: uma menção em comentário contada como `testID` NOVO) e a chamou de falso positivo. A W3 mediu a outra: assim que a menção entra na população do **ANTES**, editar o comentário a faz SUMIR, e o G2 reprova por *"testID SUMIU"* e o G3 por *"linha sumiu SEM ERRATA"* — **sem que uma linha de código tenha mudado**. É o **segundo caso do padrão pelo avesso**, e o primeiro num gate de verdade: o instrumento mede **MAIS** do que o critério, não menos |

> **O 19 é o 15 outra vez, e a segunda vez muda o que a primeira parecia ser.** Quando o
> 15 apareceu, o texto acima o chamou de *"a primeira vez no projeto em que o instrumento
> foi MAIS GENEROSO QUE A REALIDADE"* e tratou a generosidade como acidente de duplo de
> teste. Com o 19 vira outra coisa: **um instrumento que lê texto bruto mede sempre um
> SUPERCONJUNTO do que afirma medir**, e a única pergunta é se o excesso já encostou em
> alguma coisa. No 15 o excesso fez acreditar; aqui ele faz **duvidar** — reprovação sem
> causa, que é o jeito mais rápido de um gate perder autoridade. As duas direções do erro
> têm o mesmo remédio, e ele é o de sempre: **plantar o defeito e ver o instrumento
> reagir**, nas DUAS direções — o que aparece quando não devia, e o que some quando
> ninguém mexeu.
>
> E há uma lição de recorte, **promovida a regra pelo Marcel no aval da W3 (2026-09-15)**:
> a W2 achou a div. 136, julgou-a inofensiva **na direção em que a viu**, e contornou.
> Estava certa sobre aquela direção e o contorno custou uma linha. O que faltou não foi
> diligência — foi a pergunta *"e se isto estivesse na BASE?"*. É a **regra 5**, abaixo.

> **A variante do 14, e por que ela merece nome próprio.** O caso 8 (div. 71) era o script
> documentando a própria cegueira numa nota que ninguém leu. Este é um grau além: **a
> documentação não descrevia um limite do instrumento — descrevia o comportamento, com
> precisão, na primeira tela de quem vai usá-lo**, e ainda contrastava Android com iOS
> ("*on iOS … the file is moved into place only after success*"), que é literalmente o
> conserto. Não houve nada a inferir: houve o que ler. **O padrão não é só desconfiar do
> que o instrumento mede; é ler o que ele já diz de si.**
>
> **E o 15 é o padrão PELO AVESSO — a variante mais desconfortável de todas, e a primeira
> vez no projeto em que o instrumento foi MAIS GENEROSO QUE A REALIDADE.** Os catorze
> anteriores mediam menos do que se supunha, e o preço era perder um defeito que estava
> lá. Este mediu **mais**: o duplo emitia progresso a cada pedaço, a biblioteca entrega
> tudo numa rajada no fim, e o teste carimbou um mecanismo **que não existe**.
>
> A direção do erro é o que o torna pior: um instrumento cego faz duvidar do que passou;
> um instrumento generoso faz **acreditar**. É a mesma direção da mentira que esta PR foi
> consertar — dizer que está pronto quando não está —, e ela apareceu no lugar de onde se
> espera o contrário: no gate. Quem escreve um duplo escreve, sem querer, a biblioteca
> que gostaria de ter. **O duplo se corrige contra a medição no aparelho, nunca contra a
> documentação.** (No W1 ele foi corrigido: `fake-expo-file-system.ts` passou a emitir o
> progresso uma vez, no fim, e os dois testes do teto viraram testes do defeito
> conhecido.)

**O que separa os casos entre si, e que vale mais que a lista**:

- o **7** e o **10** foram achados pela **regra 1** ("o gate vem antes do que ele mede"),
  aplicada antes de escrever tela. A regra já pagou dois buracos em PRs consecutivas;
- o **8** é o mais barato de todos e o mais humilhante: **o instrumento documentava a
  própria cegueira por escrito**, e bastava ler o cabeçalho;
- o **9** é o mais perigoso, porque ali o instrumento **não é um script** — é a leitura de
  quem mediu. Fora de ferramenta o padrão não tem cabeçalho para ler;
- o **11** e o **12** são de **escopo declarado**: os dois instrumentos dizem com precisão
  o que cobrem, e os dois foram lidos como se cobrissem a categoria inteira.

### As regras que saíram do padrão

**0. O DUMP NÃO É FONTE DE TEXTO DE TELA.** *(Marcel, aval da W2, 2026-09-15 —
mais forte do que a proposta que lhe foi feita, que era "varredura de texto
precisa de captura".)* O `uiautomator dump` devolve **`text=""` onde há texto**:
o `<Text>` de várias linhas do `download-erro` volta com os `bounds` certos e a
cadeia vazia. A consequência não é "falta um dado": é que **um aceite que varre
inglês por dump passa por cima da frase que ele existe para pegar** — medido, a
varredura sobre os dumps do ANTES acusou as mesmas quatro cadeias do DEPOIS e não
viu a mensagem de quatro linhas que era o objeto inteiro da div. 125. Quem quiser
afirmar o que está na tela usa **captura**; o dump serve para geometria, `enabled`,
`resource-id` e `content-desc`, e para isso é excelente. Prova: div. 139.

**1. Avião não é o valor do setting, é o `ping` falhando** — e o corte vem **antes** de o
app abrir, não depois. (Origem: `V1-PR3-PRECHECK.md` §9, onde a leitura de
`airplane_mode_on = 1` foi tratada como prova e custou duas requests em prod.)

```
$ adb -s <device> shell svc wifi disable
$ adb -s <device> shell svc data disable
$ adb -s <device> shell cmd connectivity airplane-mode enable
$ adb -s <device> shell settings get global airplane_mode_on   → 1      (NÃO é a prova)
$ adb -s <device> shell ping -c 2 -W 2 8.8.8.8
  connect: Network is unreachable                                       ← A PROVA
```

**No Tab S6 a regra tem uma exceção que também é regra**: ali "avião" é **só o override da
API** (`EXPO_PUBLIC_API_BASE_URL` inline no Metro), **nunca o rádio** — foi o corte de rádio
que deixou o Wi-Fi sem reconectar na V1-PR3. A prova, nesse caso, é o `ping` **respondendo**
(o rádio está de pé) somado ao `sync fail … code=network` (a API não está).

**2. Clonar o repositório clona os segredos.** (Origem: `V1-PR3-PRECHECK.md` §10.1 — um
scratch de 7,7 G levou junto **seis** arquivos `.env*` em modo `644` sob `/private/tmp`,
legíveis por qualquer processo da máquina, por 2 h 40.) Um scratch que precise do
`node_modules` deve nascer **sem** os `.env*` (`--exclude`, ou `rm` logo depois do `cp`), e
o `.env` do `apps/native` só entra se o comando medido precisar dele — o prebuild precisa,
o Gradle não.

**3. Achado que vira BLOQUEANTE precisa do bruto COMMITADO, não só da prosa.**
(Origem: div. 110, W1.) A div. 103 foi medida "de ponta a ponta" no aceite do V1 e o
único registro que sobrou foi a **linha em prosa** da §9 do `V1-ENCERRAMENTO.md`:
`grep -rn "File is empty\|e3b0c442" docs/` devolve só ela. O pre-check do W1 teve de
**rederivar do código** — do Kotlin do `expo-file-system`, inclusive — um mecanismo que o
logcat já tinha dito, e ao rederivar descobriu que a prescrição escrita na prosa estava
errada **nas duas metades** (a errata da §11, W1). A regra permanente do `CLAUDE.md` já
manda o bruto entrar como anexo; o que esta acrescenta é **a prioridade**: quando o
achado é o que bloqueia o próximo trabalho, o anexo não é higiene, é o insumo desse
trabalho. **Prosa não se relê com `grep`.**

**4. Controle negativo que NÃO reprova pode ser instrumento quebrado, não código
correto.** (Origem: div. 127, W1.) O primeiro controle negativo do W1-A6 trocou o
`files.ts`/`prefetch.ts`/`App.tsx` pelos de `f79a4b7`, reabriu o app — e o logcat saiu com
linhas `file-reject`, que o código de `f79a4b7` não tem. **Com `CI=1` o Metro não relê o
disco: serviu o bundle que já tinha em cache, e o "controle negativo" mediu o código
NOVO.** Foi declarado inválido e refeito com o Metro reconstruído; o que fica é a regra:

> **Um CN que passa é tão suspeito quanto um gate que nunca acusa.**

Antes de comemorar um controle negativo que não reprovou, prove que ele **podia**
reprovar — que o instrumento estava vendo o que você acha que ele estava vendo. No
device, isso significa: cada troca de código exige matar e subir o Metro.

**E a regra pegou o próprio autor, no dia seguinte, com outro instrumento.** No rebase da
PR do W1, o `git` do sistema parou (o `xcode-select` apontava para um Xcode cuja licença
não fora aceita). O `g2g3.sh` chama `git` do `PATH`: as coletas do "antes" voltaram
**vazias**, e o gate imprimiu

```
G2 — testIDs  antes=0  depois=43
  G2: antes ⊆ depois ✓
```

**Um gate verde afirmando que nenhum `testID` sumiu — sem ter lido um único `testID` do
lado "antes".** O `antes=0` é o que denuncia, e é por isso que ele é impresso: **um gate
que não mostra o tamanho do que mediu não deixa ninguém desconfiar dele**. Refeito com o
`git` das Command Line Tools no `PATH`, o número voltou a `antes=43`.

Duas ocorrências em dois dias, com instrumentos diferentes (Metro, `git`), bastam para
tratar isto como classe e não como anedota: **todo gate deve imprimir o TAMANHO do que
leu, não só o veredito.** O G2, o G3 e o G1a já imprimem; é para isso que serve.

**5. Todo achado de coletor tem DUAS direções, e a barata é a que se vê primeiro.**
(Origem: div. 136, W2, e div. 140, W3. *Promovida pelo Marcel no aval da W3, 2026-09-15.*)
Quem percebe que um coletor conta a mais tem duas perguntas a fazer, não uma:

> **o que APARECE quando não devia** — barato: ruído no relatório, veredito intacto;
> **o que SOME quando ninguém mexeu** — caro: REPROVAÇÃO FALSA.

A W2 fez a primeira e parou: uma menção a `testID="…"` dentro de comentário do `files.ts`
apareceu como "testID NOVO", o G2 é `antes ⊆ depois`, logo o veredito não mudou —
tudo certo, e o contorno custou uma linha de documentação reescrita. A W3 fez a
segunda, e a resposta foi outra: **com a mesma menção na BASE, apagar o comentário deixa
o G2 e o G3 vermelhos sem que uma linha de código mude.** Medido:

```
G2 — testIDs  antes=44  depois=43     G2: testID SUMIU ✗
G3 — linhas log( antes=58  depois=57  G3: linha sumiu SEM ERRATA ✗   exit=1
```

O que torna isto regra e não anedota é a assimetria de CUSTO entre as duas direções, e ela
é estrutural: a direção barata é a que o instrumento te MOSTRA (a menção aparece na saída,
em "NOVOS"), e a direção cara é a que só aparece **uma PR depois**, quando a população
envenenada já é a BASE de outra pessoa. Um gate que reprova sem causa é o jeito mais
rápido de perder autoridade — e o remédio é o mesmo de sempre, a regra 4 aplicada nas duas
direções: **plantar o defeito e ver o instrumento reagir**.

### A regra de método que o padrão implica

**Uma medição não vira referência sem `n`** (div. 80). Onde houver população, faixa com
mediana; onde não houver, "medido uma vez", escrito assim. O bloco V1 aplicou isto ao custo
do CI (faixa de 12 runs) e ao A17 do Tab S6 (três leituras, cada uma com o seu `n`).

**E a faixa serve para mais do que dizer o custo — ela diz o que é ESTRANHO.** (W1,
2026-09-14.) Com a PR do W1 aberta, o gate de APK reprovou em **27 s**, contra a faixa de
**9m16s–14m11s (n=12)**: a falha era do `setup-android`, não do código, e foi o "fora da
faixa" que apontou para o passo certo em segundos. Com uma referência **pontual**, um job
que falha rápido passa por ruído de CI. **Primeira vez que a regra pagou por si num caso
que não era de duração** — e o corolário é prático: quando um número sai da faixa, a
primeira pergunta não é "o que eu quebrei", é **"o que mudou debaixo de mim"**.

---

## Errata W1 (2026-09-14) — duas linhas, e por que uma estende e a outra nasce

**(1) A linha `file` ganha `total=` e `ms=` no `src=download`.** É errata declarada,
não acomodação: muda uma linha existente do catálogo.

| | antes | depois |
|---|---|---|
| do disco | `file src=disk name=<seg> bytes=<n>` | **inalterada** — não houve download, não há total nem duração |
| baixado | `file src=download name=<seg> bytes=<n>` | `file src=download name=<seg> bytes=<n> total=<n\|-> ms=<n>` |

`total` é o `Content-Length` (`-` quando o servidor não o manda); `ms` é do início do
download ao rename. **A taxa é `bytes/ms`** — valor derivado, que o catálogo não guarda
por regra (chaves fixas, valores crus).

**Por que ela não podia faltar**: sem a taxa no log, a leitura *"não abortou"* não se
separa em **"não abortou porque a rede estava sã"** e **"não abortou porque o teto não
funciona"** — e o aceite W1-A2 viraria impressão. Foi exatamente essa separação que
permitiu ler a corrida do W1-A3 e descobrir a div. 126.

**E o nome que NÃO foi adotado**: `file-progress`. Uma linha chamada "progress" que sai
**uma vez, no fim** seria um nome que mente sobre o próprio evento — a classe de defeito
que as erratas E7 e E8 passaram dois blocos consertando. O número entra na linha que já
sai uma vez por download.

**(2) A linha `file-reject` nasce** — é evento novo de verdade:

`file-reject name=<seg> kind=empty|short|malformed bytes=<n> expected=<n|->`

O `expected=<n|->` admite que às vezes não se sabe o esperado, e isso é de propósito:
*"honesto é melhor que completo"* (Marcel, 2026-09-14). Em repouso nunca se sabe — a
única fonte de tamanho esperado é o `Content-Length`, que só existe durante o download
(div. 112), e o `bytes` do índice não é oráculo (div. 111).

**As três perguntas ficam em três linhas distintas, e é de propósito**:

| linha | responde |
|---|---|
| `file` | *o que eu tenho, e quanto custou* |
| `file-reject` | *achei e recusei* |
| `download-error` | *não consegui baixar* |

E o `cache miss` **não** passa a existir (Q4): ele dispararia quando algo não é achado, e
o arquivo de 0 byte **foi achado**. O que faltou nunca foi log, foi checagem — div. 120.

---

## Errata W2 (2026-09-15) — a linha do log e a frase da tela deixam de ser a mesma coisa

A errata W1 fechou dizendo que a `<msg>` do `download-error` "é traduzida e higienizada num
ponto só, **porque ela vai para o log e para a tela do S3e**". O ponto único estava certo; o
**destino único** é que estava errado, e o preço foi medido no aparelho. O que o músico lia,
verbatim, no S3e em modo avião (AVD `octavia_tab32`, 2026-09-15):

```
1786295844475-ux-audit-fase-d-cifra.pdf: Call to function
'FileSystemDownloadTask.start' has been rejected.
→ Caused by: Unable to download a file: Unable to resolve host
"mlxjmpbdchmwplcfislt.supabase.co": No address associated with hostname
```

Três coisas erradas numa frase só, e a terceira ninguém tinha visto:

1. **inglês cru de biblioteca** na tela de um app em pt-BR (div. 125);
2. **o nome do objeto do bucket**, que não identifica a MÚSICA e sim o OBJETO — detalhe de
   infraestrutura que o músico não pediu e não pode usar. *(Decisão do Marcel no aval da W2:
   "o que serve na tela é o título, que a tela já tem" — e tem, duas linhas acima:
   `${titulo} · ${tipo}${tamanho}`.)*
3. **o host do projeto Supabase**, que a higienização não pegou porque ela casa
   `https?://\S+` e ali o host vem **nu, entre aspas**, sem esquema. Div. 137.

**O que passa a valer.** O `Error` carrega duas metades: `message` é o DETALHE — nome e causa
crua, URL higienizada — e continua indo INTEIRO para o `download-error`, porque é o que faz um
relatório ser diagnosticável; `fraseDaFalha()` é o que o músico lê, de um conjunto **FECHADO**
de frases em pt-BR (`não consegui baixar` · `o arquivo chegou vazio` · `o arquivo chegou
corrompido` · `arquivo incompleto: N de M bytes` · `o servidor respondeu NNN`). O que fecha o
conjunto é a **omissão**: quem não tem frase declarada cai na genérica. Medido depois, na
mesma tela e no mesmo avião: **`não consegui baixar`**, e o log com a mesma linha de antes.

**Nenhuma linha `log(` mudou** — G3 57 = 57, sem errata de gate. Era essa a forma de separar
as duas metades sem tocar no contrato de observabilidade.

### A família tinha duas classes, e a segunda não passava por aqui

Div. 131. O ramo de **promoção** do `ensureFileUma` (`alvoDir.create()`, `destino.delete()`,
`atual.file.moveSync()`) estava **fora de qualquer `try`**: uma rejeição ali subia crua — sem
o prefixo do nome, **sem a higienização da regra 2** — até o palco e até o `App.tsx`. Passa a
entrar num `try` e a sair pelo mesmo `falha()`. Consertar só a frase medida pelo W1 teria
deixado esta de pé.

### O trio 80 · 111 · 132 — "o número EXISTIR foi lido como o número SERVIR"

*(Nomeado pelo Marcel no aval da W2, 2026-09-15, e as três são leituras dele, por atribuição
dele.)* É uma forma do padrão que não é sobre escopo de instrumento, e por isso vale à parte:

| div. | o número que existia | como foi lido |
|---|---|---|
| **80** | a duração de **um** run do `native.yml`: 9m16s | "9m16s é o regime" — uma medição lida como propriedade estável do gate. Com catorze runs: é o **piso** de uma faixa de 9m16s a 14m11s |
| **111** | o `bytes` do `files-index.json` | um oráculo do tamanho esperado — sem ver que ele é escrito **a partir do disco** pelo `touch()`, então concorda consigo mesmo por construção |
| **132** | as 12 linhas `total=`/`ms=` do W1 | "as primeiras taxas já estão no anexo C" — e as doze são de **fixtures servidas por um mock em `localhost:8788`**, várias com a taxa encenada pelo próprio servidor de teste. Para escolher um `T₁`, `n` continua **0** de rede real |

**A div. 126 NÃO pertence a este trio**, e a correção é do Marcel: lá o número **não existia**
(o `onProgress` entrega tudo em rajada no fim), e o defeito foi o duplo de teste ser mais
capaz que a biblioteca. É outra forma — o 15º caso do padrão, pelo avesso.

A consequência que a W2 registra e não conserta: **a opção C continuará sem população até
alguém baixar de uma rede de verdade**, e isso não acontece por uma PR existir.

---

## Errata W3 — a regra 2 passa a ter UMA implementação

**Div. 137, a segunda metade.** A W2 consertou a higienização do `files.ts` depois de o
aparelho devolver, em modo avião, `Unable to resolve host "<ref>.supabase.co"` — host nu,
sem esquema, entre aspas, que nenhum regex de URI casa. O que ela não pôde tocar foi o
`mensagemDe()` do `prefetch.ts`, a **rede de segurança para o que nunca passa pelo
`falha()`**: ele tinha higienização própria, e era a antiga. A regra 2 do catálogo — *URI
completa nunca entra em log* — tinha duas implementações, e a segunda não conhecia o
host nu. **Passa a ter uma**: o `prefetch.ts` chama o `higienizar()` do `files.ts`.

A razão de a W2 não ter feito isto vale registro, porque é método e não desleixo: o
`prefetch.ts` está DENTRO da cobertura do G1a, e tocá-lo exigiria declará-lo exceção —
alargando, no commit 4, o escopo que o commit 1 daquela PR acabara de fechar. Aqui ele é
**exceção declarada e justificada no `g1.sh`**, que é o que a lista de exceções existe
para ser.

**Nenhuma linha `log(` mudou** (G3 57 = 57), e **nenhum rótulo mudou de vocabulário**:
`<url>` para `http(s)`, `<uri>` para `file:`, `"<host>"` para o host nu. Cada um já era o
que o seu lado usava; o que a W3 fez foi dar a cada lado o que só o outro tinha — a
alternativa `file://`, que só existia no `prefetch.ts`, entrou no `higienizar()`.

O conjunto coberto por essa rede **encolheu com a W2 e não zerou**: o `parcial.delete()`
da abertura do `baixarAtomico`, o `touch()` e os dois `localizar()` do `ensureFileUma`
seguem fora de qualquer `try`. É por ali que o teste o alcança (`__quebrarDelete`, novo no
duplo). Ver `W3-anexos/W3-C-a-rede-de-seguranca.txt`.

## Errata W3 — os gates deixam de só medir

**Div. 129.** `gate:a20`, `gate:icones` e o G7 passam a rodar dentro do `pnpm test:unit`
do `ci.yml`; G1a/G1b e G2/G3 passam a rodar num job `gates-nativos` próprio. O que fica de
fora, declarado, são os **controles negativos** do G1, do G2/G3 e do G7 — os dois
primeiros precisam de um par de refs fabricado, o terceiro troca arquivo da árvore de
trabalho. Continuam sendo comando de mão. A tabela completa está em
`W3-anexos/W3-B-os-cinco-gates-e-o-ci.txt`.

O que o invólucro **não** dá, e o item 5 da §10 do `W1-ENCERRAMENTO` prometia: **cobertura**.
Um subprocesso não instrumenta o processo do Vitest, então `a20.mjs` e `icones.mjs`
continuam fora do relatório. Dívida declarada.
