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
| request à API | `api status=<s> path=<path> n=<1\|2> ms=<ms>` | toda resposta de `/api/*`, **também nas escritas** (N2-PR2). Nas rotas de escrita o `path` traz cada uuid pelos seus **8 primeiros caracteres** (regra 3): `/api/setlists/<id8>`, `/api/setlists/<id8>/songs/order`, `/api/setlists/songs/<id8>`. Até a N2-PR1 esta linha só conheceu paths sem id, e `split('?')[0]` bastava | A1, A2, A4, A22, A-N2-8 |
| 429 | `ratelimit retry-after=<s> family=<f>` | resposta 429 (T1-R4). `family` é `content-read`, `setlist-read` ou, desde a N2-PR2, `setlist-mutate` — **compartilhada pelas seis escritas**, então um 429 numa adição fecha o botão de criar também (T2-R14). A linha só sai quando o prazo VEIO: medido na N2-PR2, o servidor manda `Retry-After` nos dois funis e também no corpo (`N2-PR2-anexos/retry-after.txt`) | A3, A-N2-16 |
| início do sync | `sync start` | T1-R13 passo 2 | A4 |
| sync ok | `sync ok setlists=<n> content=<n> pages=<p> t=<ms>` | as duas listas aplicadas (E3: `t=` do `sync start` ao cache gravado) | A4, A7 |
| sync falhou | `sync fail stage=setlists\|content page=<p> code=<code\|network\|net> status=<s\|->` — **E8(3)** | qualquer não-2xx/rede; cache anterior mantido (T1-R9) | A19, A21 |
| sync pulado | `sync skip reason=offline` | sem rede ao abrir | A5 |
| cache | `cache hit kind=setlists\|content\|file n=<n>` · `cache write kind=… n=<n> invalidated=<n>` — **E8(2): `cache miss` nunca foi implementado** | leitura/gravação do cache local. `invalidated` é o **contador real** do T1-R10 desde a N2-PR1 (antes, `0` literal — caso 21): itens do conjunto alterados (`updated_at` diferente) + novos + removidos em relação ao cache anterior; `0` em sync sem mudança, `n` no primeiro sync | A4, A5, A7, A21 |
| **escrita** | `write op=create\|update\|delete\|add\|remove\|reorder setlist=<id8\|-> items=<n\|-> status=<s\|net> code=<CODE\|net\|-> ms=<ms>` — **N2-PR2** | fim de TODA escrita de setlist, 2xx ou não. `op` é a operação, não a rota. `setlist=-` só no `create`, antes do 201 (o id ainda não existe). `items` é o tamanho do `order` no reorder e `-` nas outras cinco. `status=net` e `code=net` quando a request não teve resposta — e isso inclui a resposta cujo CORPO não chegou (N2-D18: o servidor pode ter gravado). `code=-` num 2xx | A-N2-1, A-N2-8, A-N2-12, A-N2-13, A-N2-15 |
| **ressincronização** | `resync kind=setlists reason=write\|404\|order\|reopen op=<op\|-> status=<s\|net> setlists=<n\|-> ms=<ms>` — **N2-PR2** | fim da releitura do T2-R9/R10 (`GET /api/setlists`, N2-D13). `kind` é sempre `setlists` e fica para o formato não mudar quando houver outro. Um não-2xx aqui **não** é falha da escrita: é o estado próprio da N2-D22, e `setlists=-` porque nada foi aplicado. `reason=reopen` é o `GET` refeito na próxima abertura da tela, com `op=-` | A-N2-10, A-N2-11, A-N2-25 |
| **escrita barrada** | `write blocked op=<op> reason=offline\|ratelimit\|ceiling\|busy\|nada-mudou` — **N2-PR2** | toque num controle de escrita que **não gera request**. `offline` (T2-R12), `ratelimit` (a família `setlist-mutate` fechada por um 429 anterior, T2-R14), `ceiling` (acima de 100 músicas o reordenar não sai, N2-D17), `busy` (outra escrita em voo, T2-R11) e `nada-mudou` (o formulário abriu e nada mudou, T2-R3 (iii)) — ver a **errata N2-PR2** abaixo | A-N2-9, A-N2-14, A-N2-24 |
| prefetch | `prefetch plan n=<n> reason=7d\|manual\|demand` | T1-R15/R16 | A10 |
| promoção | `prefetch promote n=<n>` | arquivos já no disco que entraram na janela de 7 dias e foram movidos para o armazenamento não-purgável (T1-R14 + N0-H16 §4) — **E7** | A10 |
| arquivo | `file src=disk name=<seg> bytes=<n>` · `file src=download name=<seg> bytes=<n> total=<n\|-> ms=<n>` — **errata W1** | T1-R14 (herdado do N0). O `total` (`Content-Length`, `-` se ausente) e o `ms` (início do download → rename) **só no `src=download`**: não houve download, não há total nem duração | A9, A13, **W1-A2/A3/A7** |
| arquivo recusado | `file-reject name=<seg> kind=empty\|short\|malformed bytes=<n> expected=<n\|->` — **W1** | a checagem de integridade recusa um arquivo, no download ou no saneamento da abertura | W1-A1, W1-A3, W1-A6 |
| LRU | `lru evict n=<n> bytes=<n>` | T1-R14 | A10 |
| estouro do teto | `lru over bytes=<n> cap=<n> protected=<n>` — **W4-b3** | T1-R14: depois do despejo o total no disco segue acima do teto porque os protegidos (a janela de 7 dias) sozinhos passam dele. `bytes` é o `bytesAfter` do `lruEvict`, `cap` o `CAP_BYTES` e `protected` o tamanho do conjunto garantido (presentes ou não). Sai a cada `aplicarLru` enquanto o estouro durar. Antes o `bytesAfter` era descartado (`W1-PRECHECK.md:469`) | W4-b3 (CN no `palco-divida.test.ts`) |
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
| **faixa** | `faixa=A\|B\|C w=<dp> h=<dp>` — **N3-PR1** | T3-R1: a decisão da faixa pela largura útil da janela (`src/faixa.ts`, o único ponto que conhece 700 e 960). Sai **no boot** (a primeira medida da janela, na raiz do app — antes de qualquer tela, inclusive no S0) e a cada **troca de orientação ou de faixa**; `w`/`h` são a janela do `useWindowDimensions` em dp, uma casa. Não substitui a `rotation=`, que continua só no palco e só na mudança de orientação | A-N3-1 |
| **régua de dev** | `regua t="<texto>" s=<token> w=<dp\|->` — **N3-PR1, só no dev client** | a régua de desenvolvimento (`src/screens/ReguaDeDev.tsx`, `exp+octavia://regua?t=…&s=…`) mediu a largura do texto com o estilo `<token>` (`onLayout`); `w=-` quando o token não existe. **Exceção declarada à regra 1**: `t` vai entre aspas e pode ter espaço — é a frase medida, e nunca corpo de música (regra 2: só frases do conjunto fechado e da folha). Fora do release pelo `__DEV__` | A-N3-4 (as doze medidas) |
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
| 19 | **div. 140** (W3) | o **coletor do G2**: `testID="…"` no texto **CRU** do arquivo — comentário incluído | "as populações do antes e do depois são o código". A W2 viu a metade barata disto (div. 136: uma menção em comentário contada como `testID` NOVO) e a chamou de falso positivo. A W3 mediu a outra: com a menção na **BASE**, editar o comentário a faz SUMIR e o G2 reprova por *"testID SUMIU"* **sem que uma linha de código tenha mudado**. O G2 passou a ler sem comentário. **O G3 tem o mesmo mecanismo e NÃO foi mudado, de propósito** — div. 83, ver a regra 5. É o **segundo caso do padrão pelo avesso**: o instrumento mede **MAIS** do que o critério, não menos |
| 20 | **div. 142** (W3) | o **`V1-ENCERRAMENTO.md` §11**, item B8.3: *"a razão está escrita no próprio comentário do `g2g3.sh`"* | "quem mexer no gate vai encontrar a razão da div. 83 onde mexe". Medido nas quatro versões do `g2g3.sh` (`cf9e229`, `c25db8c`, `7630c4e`, `78e8e6e`): **ela nunca esteve lá.** Morava só em `V1-PR6-anexos/README.md`. A W3 leu o script inteiro, não achou razão nenhuma, e desfez a decisão — que é exatamente o que o aviso existia para impedir. **Variante nova do padrão**: não é instrumento que mede menos do que se supõe; é **REGISTRO QUE APONTA PARA ONDE A RAZÃO NÃO ESTÁ**. Consertado na W3: a razão passou a morar no cabeçalho do `g2g3.sh` |
| 21 | **div. 157** (N2 pre-check) | a linha `cache write kind=… invalidated=<n>` que este catálogo liga ao **A7** (tabela acima: *"T1-R10: `invalidated=0` em sync sem mudança"*) — no V1 o A7 foi dispensado pelo G1 com `cache write kind=setlists n=2 invalidated=0` no device como o que se viu de raspão (`V1-ENCERRAMENTO.md:122`) | "o versionamento por `updated_at` do T1-R10 funciona — dois syncs sem mudança não invalidam nada". O `0` é **LITERAL** em `store.ts:123-124`, e o `diffByUpdatedAt` (`core/sync.ts:87`), a função que calcularia o número, **não tem chamador fora dos testes**. O aceite passou lendo uma **constante**: não havia valor que o fizesse reprovar. Correção: **N2-D8** (primeira PR de código do N2 — ligar o `diffByUpdatedAt` no sync, contador real no log, CN com `invalidated=1` sob mock de `updated_at` diferente, errata do A7 no `PRD-TELA-1.md`). **Corrigido em N2-PR1 (#309)**: `reconcileByUpdatedAt` no sync, contador real nas duas linhas (mesmo formato), CN `apps/native/test/sync-t1r10.test.ts` — reprovou 5 de 6 contra o código de antes e passa 6 de 6 depois (`N2-PR1-anexos/`) |
| 22 | **div. 189** (N2-PR1, corrigida no W4-a) | a **ERRATA do G3**, na forma que a W1 lhe deu: a lista declarava a linha que **SAI**, e o gate checava só isso | "esta linha de log VIROU aquela" — que é o que a palavra *errata* diz e o que os três registros dela descrevem (`W1-PRECHECK.md` §9.3, a N2-D8, o comentário do próprio script). O que ela de fato autorizava era **"esta linha SUMIU"**: com a errata declarada, apagar a velha e não pôr nada no lugar dava *"as que sumiram estão na lista de erratas ✓"* e **exit 0**. O contrato de log podia **encolher com a bênção do gate**, e o G3 é o único lugar onde esse encolhimento apareceria — os aceites desta série são lidos **pelo logcat**. É o **primeiro caso em que o instrumento mede MENOS do que o seu próprio nome promete**: não é o coletor que erra o recorte (19, 20), é a REGRA DE ACEITAÇÃO que checa metade do par. Corrigido no W4-a: a errata passa a ser um PAR, e a `nova` tem de aparecer entre as adicionadas |
| 23 | **div. 211** (N2, brief) | o **`uiautomator dump` do palco**: a árvore de nós do app — 72 nós, `package="rocks.octavia.app"` em todos, **sem barra de status, sem relógio, sem um só atributo que varie com o tempo** `[medido: W4-a]` | "o estado da tela **naquele instante**". Três arquivos com três nomes — `A16-palco-inicio.xml`, `A16-palco-fim.xml`, `S3-palco-1de7.xml` — sugerem três medições de três momentos, e o A16 trata "início" e "fim" como **dois estados**. Os bytes dizem outra coisa: os três são **byte a byte idênticos**, e nasceram assim num único commit (`8f62e3c`, V1-PR7). Não são três medições que convergiram; são a mesma medição, e o instrumento **nunca poderia** ter distinguido os dois momentos — numa tela que não muda, ele não tem o que registrar de diferente. **O A16 não cai**: o veredito é sustentado pelo `dumpsys` (`SCREEN_BRIGHT_WAKE_LOCK … ACQ=-22m48s848ms`), pelas 17 leituras do `a16.sh` e pelo relógio das PNGs irmãs (10:37 / 11:00 / 10:29) — o dump só atesta *"é a mesma tela, música 1 de 7"*, que é exatamente a invariante que o A16 afirma. O que estava errado era o **nome do arquivo prometendo o que o arquivo não carrega** |
| 24 | **div. 233** (N2-PR2) | o **modo `escrita-releitura-fora-de-ordem` do mock**, que atrasava a resposta de uma releitura para inverter a ordem de chegada | "a releitura que chega por último traz a foto mais velha — o terceiro CN da trava mede isso". A primeira forma **dormia e só então lia o modelo**: a resposta lenta voltava com dado FRESCO, a inversão não existia e o CN passava **sem medir nada**. Num servidor real a leitura acontece na hora do request e o atraso é de transporte. A foto passou a ser tirada **antes** do atraso (`N2-PR2-anexos/README.md`, "Nota sobre o instrumento"; `trava.txt`). É o 15 pelo outro lado: lá o duplo era mais capaz que a biblioteca; aqui o duplo do **servidor** era mais gentil que qualquer servidor |
| 25 | **div. 238** (N2-PR3; o escopo era a 229, N2-PR2) | o **`gate:a20` estendido ao `packages/core/src/frases.ts`** | "o texto de falha da tela 2 está sob o G4". O gate **lia o arquivo e examinava ZERO literais**: 24 arquivos e **72** literais, o mesmo número de antes de o `frases.ts` entrar. As posições da varredura são as do JSX, e o `FRASES` é um objeto chaveado. Com a posição `EXTRAS: valor de chave`: **100** literais, 0 acusações, e o controle negativo ad hoc (três frases trocadas por inglês) acusou. **Gate que lê e não examina é instrumento quebrado** — e é por isso que o `a20` imprime "literais examinados", não "arquivos lidos" (regra 4) |
| 26 | **div. 282** (N2-PR5) | o **`gate:icones`**: o coletor lê cada estado de um ícone em UMA linha do `dados.ts` | "todo ícone da tela 2 é cobrado contra o anexo D". A primeira forma da `alca`, escrita em várias linhas, passou com **0 acusações e "4/6 cobrados"** — e o `apagar-setlist` da N2-PR4 **estava assim desde que entrou**: só o `inerte` dele era comparado. O desenho estava certo, mas quem dizia isso era a sorte, não o gate. Regra nova `[legível]`: entrada sem `normal` numa linha é ACUSADA; CN ad hoc com 2 acusações. É o 22 no coletor: o que ficou de fora não foi uma população, foi uma **forma de escrever** a mesma entrada |
| 27 | **div. 294** (N2-PR5) | o **Metro com `CI=1`**, que não observa o disco | "o aparelho está rodando o conserto". Duas tentativas de conserto da div. 286 rodaram o **bundle velho** e "reprovaram" — mediram nada. Achado por `curl …/index.bundle \| grep -c LinhaFlutuante` → `0`. **É o mesmo mecanismo da div. 127 (W1), que já estava escrito aqui, na regra 4** — *"com `CI=1` o Metro não relê o disco"*. O caso não é o instrumento: é **o registro que existia e não estava onde quem subiu o Metro lê** — o 8 e o 20 outra vez. Daí a regra 13 e o [`APARATO.md`](APARATO.md) |

> **O 19 é o 15 outra vez, e a segunda vez muda o que a primeira parecia ser.** Quando o
> 15 apareceu, o texto acima o chamou de *"a primeira vez no projeto em que o instrumento
> foi MAIS GENEROSO QUE A REALIDADE"* e tratou a generosidade como acidente de duplo de
> teste. Com o 19 vira outra coisa: **um instrumento que lê texto bruto mede sempre um
> SUPERCONJUNTO do que afirma medir**, e a única pergunta é se o excesso já encostou em
> alguma coisa. No 15 o excesso fez acreditar; aqui ele faz **duvidar** — reprovação sem
> causa, que é o jeito mais rápido de um gate perder autoridade.
>
> **E o 19 não se conserta do mesmo jeito em todo gate.** O G2 e o G3 têm o mesmo coletor
> e o mesmo superconjunto, e só o G2 mudou. No G3 o excesso é **o lado do erro que a div.
> 83 escolheu**: num gate de invariância, falar demais custa uma errata; calar deixa uma
> linha de log sumir. Saber para que lado um instrumento erra não obriga a corrigi-lo —
> obriga a **decidir**, e a escrever a decisão.

> **O N2 acrescentou sete casos (21–27), e dois deles não são novos.** O 25 é a regra 4
> escrita em forma de gate — ler sem examinar; o 27 é a div. 127 do W1 repetida palavra por
> palavra, com a razão já escrita neste arquivo. A contagem do parágrafo que abre esta seção
> ("são dezoito") é da W2 e não é reescrita; a tabela é a conta. *(Encerramento do N2,
> 2026-09-23.)*

> **O 22 abre uma terceira coluna na tabela, e vale nomeá-la.** Do 1 ao 21 o padrão foi
> sempre sobre o **COLETOR**: o que ele varre, de onde, com ou sem comentário — o recorte
> da população. O 22 não é isso. O coletor do G3 estava certo; quem media menos era a
> **REGRA DE ACEITAÇÃO** aplicada sobre o que ele coletou. Um gate tem as duas peças, e
> até aqui só uma tinha sido auditada. A pergunta nova, para todo gate do conjunto: *"a
> regra que decide APROVA/REPROVA checa tudo o que o nome dela promete, ou só a metade
> mais fácil de escrever?"*
>
> **N2-PR7 — o G1b passa a usar o mecanismo do G3** (div. 321): a alteração de uma
> asserção do core é um PAR — `velha → nova · razão`, a nova entrando IGUAL, a razão
> escrita no `g1.sh` —, com o mesmo aviso de par declarado e não usado. Os dois irmãos
> diferenciais têm agora a mesma regra de aceitação para "isto mudou de propósito".
>
> **O 23 é o 2 outra vez, com sete meses de distância.** O caso 2 (div. 21) foi "bounds
> visíveis no dump lidos como a altura real do item"; o 23 é "dump lido como o instante".
> As duas vezes o dump respondeu com precisão a uma pergunta que ninguém tinha feito. A
> diferença é onde o erro ficou guardado: aqui ele ficou **no nome de um arquivo de
> anexo**, que sobrevive ao bloco, viaja para a `main` e é lido por quem não estava lá.
> **Nome de anexo é afirmação**, e entra na mesma regra 5: a decisão (ou a limitação) mora
> junto do que ela descreve.

> **O 20 é o par do 19, e é o mais barato de evitar de toda a tabela.** A decisão da 83
> existia, estava bem argumentada, e havia até um aviso apontando para ela. O aviso
> apontava para o lugar errado. Quem chegou ao `g2g3.sh` seguiu o mapa, não achou a
> razão, e concluiu que não havia razão. **Registro que aponta para onde a razão não está
> é pior do que registro nenhum**: sem ele, a pergunta "por que o G3 não tira comentário?"
> ficaria aberta; com ele, a busca termina num arquivo que parece confirmar que ninguém
> pensou nisso.

> **O 21 é o caso-limite da tabela: o instrumento não mede um escopo menor — não mede NADA.**
> Em todos os outros o log carregava um valor que vinha de algum lugar e a pergunta era
> *de onde*. Aqui o valor não vem de lugar nenhum: é texto fixo com cara de medição
> (`invalidated=<n>` no catálogo, `0` no código). Um aceite que lê uma constante passa
> sempre — e a dispensa do V1 apoiou-se nela. O teste que o denuncia é o controle
> negativo que nunca foi escrito: **mock com `updated_at` diferente → a linha tem de dizer
> `invalidated=1`**. Achado no pre-check do N2 (`N2-PRECHECK.md` §6.1, div. 157), não por
> aceite — nenhum aceite podia achá-lo.

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

**5. Todo achado de coletor tem DUAS direções, e a barata é a que se vê primeiro — e
escolher uma direção pode ser a decisão certa, mas então ela precisa estar onde quem
mexe no gate vai ler.** (Origem: div. 83, V1-PR6; div. 136, W2; div. 140 e 142, W3.
*Redação do Marcel, aval da W3, 2026-09-16.*)

Quem percebe que um coletor conta a mais tem duas perguntas a fazer, não uma:

> **o que APARECE quando não devia** — barato: ruído no relatório;
> **o que SOME quando ninguém mexeu** — caro: REPROVAÇÃO FALSA.

**Três ocorrências, e a primeira ESCOLHEU UM LADO DE PROPÓSITO:**

| div. | bloco | o que se viu | o que se fez |
|---|---|---|---|
| **83** | V1-PR6 | o G3 contou uma frase de comentário como linha `log(` nova | **decidiu-se não consertar**: gate de invariância erra para o lado de falar demais |
| **136** | W2 | o G2 contou uma menção em comentário como `testID` NOVO | contornado; "falso positivo, veredito intacto" — a direção barata |
| **140** | W3 | com a menção na BASE, apagar o comentário reprova o G2 **sem código mudar** | o G2 passou a ler sem comentário — a direção cara |

A assimetria de custo é estrutural: a direção barata é a que o instrumento te MOSTRA (a
menção aparece na saída), e a cara só aparece **uma PR depois**, quando a população
envenenada já é a BASE de outra pessoa. O remédio é a regra 4 nas duas direções:
**plantar o defeito e ver o instrumento reagir**.

**A segunda metade da regra é a que a div. 142 ensinou, e é a que mais custou.** A div. 83
fez tudo certo — perguntou, escolheu, argumentou — e mesmo assim a W3 a desfez, porque a
razão não estava onde quem mexe no gate lê. **Uma decisão de deixar um instrumento errar
é uma decisão sobre o instrumento, e mora NO instrumento**: no cabeçalho do script, com o
lado escolhido e o porquê. Um anexo de PR antiga não é onde alguém vai procurar antes de
"consertar".

### As regras que o N2 firmou — 9 a 15

*(Encerramento do N2, 2026-09-23; fonte: `N2-ENCERRAMENTO.md` §5.)* **Numeração**: as
oito anteriores são a 0–5 acima e as duas de método da seção seguinte, que não têm
número. As do N2 começam em **9** porque a 9 já era citada por esse número no
`docs/api/SETLISTS.md` e no `PRD-TELA-2.md` (div. 176). **Não existem regras 6, 7 e 8**
(div. 335) — quem procurar por elas não achará nada, e é isto que diz por quê.

**9. Comportamento de contrato vive no arquivo do contrato.** Decisão registrada só num
desenho ou só numa mensagem de commit não é contrato: o cliente não a lê e a próxima
correção a desfaz sem saber. (Origem: div. 176 — o `200 {success:true}` do DELETE de
setlist inexistente vivia só em `B3-DESENHO.md` e no commit `effe847`, e o hotfix #307 o
tratou como defeito antes de achá-lo.) Texto normativo: `docs/api/SETLISTS.md`, "Onde o
contrato vive". É a regra 5 aplicada à API.

**10. Anexo não carrega texto de música de terceiro** — nem corpo JSON, nem dump de UI,
nem imagem. O que a prova usa é posição, tamanho e comprimento, não o verso. (Origem:
div. 204, N2 — o `C6.xml` do brief trazia 914 caracteres de letra, e cinco dumps do V1
já na `main` também.) Texto normativo e forma da omissão: `CLAUDE.md`, "Anexo não carrega
texto de música".

**11. Avião em aceite manual: lido, declarado, restaurado.** *"Modo avião é permitido em
aceite manual quando o estado anterior é lido, declarado e restaurado; o override da API
continua sendo o caminho dos aceites automatizados."* (Marcel, 2026-09-22; div. 290,
`N2-PR5-anexos/aparato.md` §7.3.) **Revê a exceção do Tab S6 na regra 1** — *"ali 'avião'
é só o override da API, nunca o rádio"* —, que fica acima como registro de onde veio; a
prova continua sendo o `ping` falhando, nunca o setting. Vale para todo estado do
aparelho (`stay_on`, rotação, `reverse`): [`APARATO.md`](APARATO.md).

**12. Prova de escrita em prod usa um recurso DESCARTÁVEL da conta, e o que o nativo cria
sai no fim.** Nenhuma escrita de aceite toca um objeto que o músico usa: a `DESCARTÁVEL N2`
(criada pelo Marcel no web, alvo do T1-R10 na #309 e do ramo "alheia" na #311 — o
destino dela é dele), a `N2-PR3 aceite` (criada na PR-3,
apagada na PR-4 como objeto do aceite de apagar), a `N2-PR5 aceite` (PR-5 a PR-7,
apagada no fim), a `N2-PR7 audit` (criada e apagada na mesma sessão) e a setlist de 60
da audit, reordenada e **devolvida** elemento a elemento. **23 escritas, nenhuma setlist
do nativo ficou em prod** (`N2-ENCERRAMENTO.md` §8).

**13. Conferir o bundle SERVIDO antes de retestar.** Um reteste no aparelho mede o
bundle que o Metro serve, não o arquivo que se editou. Antes de todo reteste:
`curl` do bundle e `grep -c` de um símbolo do conserto. (Origem: div. 294, caso 27, e a
div. 127 antes dela.)
**Ampliada na W4-b3 (decisão do Marcel, 2026-09-23; div. 374):** conferir no bundle
servido **o símbolo do conserto e a URL base da API** antes de qualquer reteste. O cache
do Metro pode servir a URL de prod: na #323, um build de release com a URL do mock
passada na linha de comando saiu com a de prod, e o app sincronizou com prod. A
conferência da URL é o que parou a sessão antes da escrita.

**14. "Isto mudou de propósito" é um PAR declarado — no G3 e no G1b.** A errata do G3 é
`velha → nova`, e a nova tem de entrar (div. 189, W4-a, caso 22); a alteração de uma
asserção do core no G1b é `velha → nova · razão`, a nova entrando igual e a razão
escrita no `g1.sh` (div. 321, N2-PR7). Um lado só do par é o que deixa o contrato
encolher com a bênção do gate.
**W4-b1:** a remoção de propósito também é par — `linha → REMOVIDA: <razão>` na lista
`REMOCOES` do `g2g3.sh` (N2-D34, **fechada**): a linha casa IGUAL, não por subcadeia, e a
razão é obrigatória; o coletor continua lendo comentário (div. 83). E **declaração órfã
reprova**: exceção do G1a, par do G1b, errata e remoção do G3 declaradas e não usadas dão
`exit ≠ 0` (div. 339, que é a 141 medida na `main` — o aviso saía em toda corrida e o job
ficava verde). A poda deixa de ser disciplina e vira condição de merge.

**15. A TELA VENCE O LOG.** (Origem: div. 270, N2-PR4.) O log estava perfeito —
`write op=delete … 200`, `resync … 200`, `cache write … invalidated=1` — e S1 voltava
mostrando a setlist apagada: o cache estava certo, a raiz não era avisada, e S1 desenha
o que a raiz tem. **O aceite é no aparelho**, e o G6 mede o que o músico vê
(`resource-id` e texto por estado), não o que o log diz que aconteceu. Um CN verde no
`native-tela` também não substitui o aparelho: ele prova árvore, não tela.

### A regra de método que o padrão implica

**Uma medição não vira referência sem `n`** (div. 80). Onde houver população, faixa com
mediana; onde não houver, "medido uma vez", escrito assim. O bloco V1 aplicou isto ao custo
do CI (faixa de 12 runs) e ao A17 do Tab S6 (três leituras, cada uma com o seu `n`).

**Passo, job e run são três números — e o relógio de quem acompanha é um quarto, que não
é nenhum dos três.** (W3, 2026-09-16.) Citar um pelo outro é erro **recorrente** neste
projeto, e cada ocorrência foi de um par diferente:

| onde | o que se leu | o que era | diferença |
|---|---|---|---|
| V1-PR5, sobre a V1-PR3 | 13m18s como **Gradle** (passo) | o **job**; o `assembleDebug` foi 11m34s | 1m44s |
| V1-PR5, na faixa proposta | 7m48s como **job** | o **passo** Gradle do run mais rápido; o job foi 9m16s | 1m28s |
| W3, a 17ª corrida | 13m10s como duração | **o relógio do polling**; o job foi 12m53s e o run 12m57s | 17s |

**A população da faixa é de JOB** (`android-debug-apk`, `startedAt → completedAt`). O
run inclui fila e setup do runner; o passo exclui checkout, install e prebuild; o
relógio de quem acompanha inclui o intervalo do próprio polling. Todo número de CI
citado neste projeto vem **com o nível ao lado**, e dos **carimbos**, nunca do
acompanhamento.

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

---

## Errata N2-PR2 (2026-09-21) — as quatro linhas da escrita, e a quinta razão de barrar

O T2-R16 do `PRD-TELA-2.md` fixou o formato das três linhas novas **antes** de
haver código que as emitisse, e a PR-2 as emite. Nenhuma linha existente mudou
de texto: o G3 foi de **57 para 64** linhas `log(`, com a lista de erratas
**vazia** — seis adições e nenhuma substituição. Isso não é sorte; é o efeito
de uma decisão pequena no `store.ts`, registrada abaixo.

### O que entrou

As três do T2-R16 (`write op=`, `resync kind=setlists`, `write blocked`) estão
no catálogo acima, com a semântica de cada campo. A quarta não é uma linha
nova: é a `api …`, que passa a sair **também** nas escritas e por isso passa a
carregar id no `path` — daí o `<id8>`.

### A quinta razão de `write blocked`, declarada

O T2-R16 escreveu `reason=offline|ratelimit|ceiling|busy`. A PR-2 acrescenta
**`nada-mudou`**: o toque num "Salvar" que não envia porque o formulário abriu
e nada mudou (T2-R3 (iii), N2-D21).

Por que ela precisa existir, e por que não briga com o **A-N2-24**: o aceite
mede `grep 'write op='` **vazio** depois de editar e cancelar, e a linha nova
começa com `write blocked op=` — a subcadeia `write op=` não aparece nela, e o
grep continua dizendo o que sempre disse. Sem a linha, "o músico tocou em
salvar e nada saiu" e "o músico não tocou em nada" seriam indistinguíveis no
logcat, que é o único instrumento dos aceites desta série.

As outras duas validações do cliente — nome vazio e data impossível — **não**
geram linha: ali o botão nasce inativo com o motivo escrito ao lado (N2-D23), e
um toque num botão que nunca esteve ativo não é um toque num controle de
escrita.

### A linha que se moveu sem mudar — e por que isso importa

A N2-D13 pede um `save` só de `setlists.json` (`PRD-TELA-2.md` §4.2: o `save()`
de hoje grava os dois arquivos juntos). O caminho fácil seria uma segunda
função com a sua própria linha `cache write kind=setlists …` — e aí o contrato
de observabilidade teria **duas implementações** da mesma linha, que é a div.
137 outra vez, pelo lado do log.

O que se fez: a gravação do `setlists.json` virou uma função privada com os
**mesmos nomes de parâmetro**, de modo que o template literal é literalmente o
mesmo texto. O `save()` e o `saveSetlists()` chamam essa função. Para o G3, a
linha não mudou — e não mudou mesmo: ela mudou de lugar, não de contrato.

A linha `cache write kind=content` **não** sai na releitura da escrita, de
propósito: a escrita não mexe em content (N2-D1), e uma linha dizendo
`invalidated=0` sobre algo que não aconteceu seria ruído no instrumento que o
A21 lê.

### A assinatura de uma releitura descartada — duas linhas que já existem

Com a trava de escrita cobrindo só o request (div. 232), **duas releituras
podem estar em voo ao mesmo tempo**, e a que chega por último pode trazer uma
foto mais velha. Quando isso acontece, ela **não** grava.

Isso **não ganhou campo novo na linha `resync`**, e a razão é que não precisa:
a releitura descartada emite a sua `resync … status=200` — ela leu, e o 200 é
verdade — e **não** emite a `cache write kind=setlists` que a aplicação emite.
**Duas linhas `resync … status=200` para uma `cache write kind=setlists`** é a
assinatura do descarte, contada com duas linhas que o catálogo já tem.

O que isso custa, declarado: um `grep` por `resync` sozinho não diz qual das
duas venceu. Se um aceite no aparelho precisar disso, é um campo na linha
`resync`, com errata — e aí o T2-R16 muda junto.

---

## Errata W4-b2 (2026-09-23) — números de CI têm uma fonte, e as declarações dos gates moram na PR

### Número de CI: com `n`, com nível, e do `CI-FAIXA.md`

A regra da div. 80 (**uma medição não vira referência sem `n`**) e a dos níveis
(passo, job, run e relógio são quatro números, mais acima) ganham **uma fonte**:
[`CI-FAIXA.md`](CI-FAIXA.md), a série inteira do `android-debug-apk`, nível job,
uma linha por corrida, com o cabeçalho recalculado a cada linha. **Todo número de CI
se cita com `n` e nível ao lado, e a fonte é esse arquivo.** A faixa da V1-PR6
(`n=12`) e as que a sucederam (`n=13…18`, e a série do N2, `n=21`) deixam de ser
referência. Ficam onde estão, como registro de cada momento.

### O bloco ```` ```gates ```` — o contrato

As exceções do G1a, os pares do G1b e as erratas e remoções do G3 são **estado de
uma PR** (div. 141). Até o W4-b1 elas moravam nas listas dos scripts, sobreviviam à
PR e, com a órfã reprovando (div. 339), a PR seguinte herdava a poda (div. 348).
Desde a W4-b2 elas moram **no corpo da PR**, num único bloco:

````
```gates
# comentário e linha em branco são ignorados
g1a: <caminho>                             exceção do G1a, uma por linha
g1b-velha: <linha que sai do teste>        par do G1b: as três, nesta ordem
g1b-nova: <linha que entra no lugar>
g1b-razao: <razão>
g3-velha: <linha de log que sai>           errata do G3: as duas, nesta ordem
g3-nova: <linha que entra no lugar>
g3-removida: <linha> → REMOVIDA: <razão>   remoção do G3 (N2-D34)
```
````

- O **`gates.yml`** lê o corpo **pela API** a cada corrida e roda de novo quando o
  corpo é editado (`edited`). Editar o corpo é, portanto, mudar o que o gate
  afirma, e o gate reage em segundos (medido: 16 s até o vermelho, 23 s até o
  verde; `W4B2-anexos/README.md` §3).
- **No CI, as listas locais dos scripts têm de estar vazias.** Lista local não vazia
  reprova (`LISTA LOCAL NÃO VAZIA com GATES_DECL ✗`). Por isso a `main` não carrega
  declaração nenhuma, e uma PR só de docs volta a ser só de docs.
- O extrator (`apps/native/scripts/gates-decl.sh`) recusa só o que tornaria a
  leitura ambígua: chave desconhecida, valor vazio, par fora de ordem ou
  incompleto, bloco não fechado, mais de um bloco. As regras de cada lista (casar
  IGUAL ou por subcadeia, razão obrigatória, órfã reprova) continuam nos scripts.
- **Rodar à mão**: sem `GATES_DECL`, a lista local vale como sempre valeu. Com a PR
  aberta:
  `gh pr view <n> --json body -q .body | sh apps/native/scripts/gates-decl.sh > /tmp/decl`
  e depois `GATES_DECL=/tmp/decl sh apps/native/scripts/g1.sh <base> WORKTREE`.
- **O gate-first muda de lugar.** A declaração que o commit 1 fazia no script, o
  corpo da PR faz agora, e o CI mede o head contra o corpo **atual**. O "commit 1
  vermelho à mão" do W4-b1 deixa de existir: o corpo não pertence a commit nenhum.
  Em troca, o corpo **não tem histórico no git**. O registro do que foi declarado
  é o anexo da PR, que tem de colar o bloco como ele ficou.

### Sem push forçado em PR (decisão do Marcel, 2026-09-23, div. 353)

**Numa PR aberta não se faz push forçado**: nada de `commit --amend`, `rebase` nem
`reset` depois do push. Uma correção entra como **commit novo**, e uma reversão como
**commit de reversão**. A razão é o rito: os CNs deste projeto são provados **por
commit** (o commit 1 reprova, o commit 2 passa, o push de docs sai *skipped*), e um
amend depois do push apaga o commit que carregava a prova e o `gh pr checks` dele.
A exceção precisa de decisão do Marcel **antes**, como a do `CLAUDE.md` (o
`reset --soft` + `push --force-with-lease` do B7-PR0, que tirou da branch arquivos
alheios).

O detector do APK (`mudou-nativo.sh`) trata o push forçado pelo **padrão seguro**: o
`before` não é ancestral do head, então o APK roda. **Hipótese, não medida:**
comparar **árvore contra árvore** (`git diff before head`, que vale sem
ancestralidade) filtraria também o push forçado só de docs. Seria preciso buscar
pelo sha um commit órfão que o GitHub pode já não servir, e o preço disso em
produção nunca foi medido. **O número que a motiva**: no N2, **3 dos 7** pushes só de
docs que custaram APK foram forçados (#315: `a3061e6`, `a1f3f54`, `c8db83a`,
35m10s). Com a regra acima, esse caso não deveria mais acontecer. Se voltar a
acontecer, a hipótese se mede.

### Toda PR copia o seu bloco ```` ```gates ```` para o README dos anexos (decisão do Marcel, 2026-09-23)

O corpo da PR **não tem histórico no git** e pode ser editado depois do merge. Por
isso, **no commit de docs, toda PR copia o seu bloco ```` ```gates ```` verbatim**
para o `README.md` dos seus anexos, numa seção própria, **inclusive quando o bloco
não declara nada**. O registro do que a PR declarou é esse texto. O corpo é só o
lugar de onde o CI o lê. Se o corpo mudar depois do commit de docs, a cópia se
refaz num commit novo.

### A faixa de CI tem segmentos (decisão do Marcel, 2026-09-23)

A referência do `CI-FAIXA.md` é calculada **só do regime em vigor**. A série
inteira continua lá, em ordem, dividida em segmentos rotulados, cada um com a razão
do corte, `[medido]`.

> **Segmentos da série.** Um segmento novo abre só quando as duas
> condições valem: (1) mudou um item da lista fechada — passos do job,
> toolchain (JDK, Gradle, `setup-android`, SDK Android), versão do Expo
> SDK ou do React Native, número de ABIs do APK —, e (2) as **dez**
> corridas seguintes têm mediana fora do IQR do segmento vigente, para
> cima ou para baixo, e a condição só se avalia quando o segmento vigente
> tem **n ≥ 10** — abaixo disso a série está em formação e não abre
> segmento. Módulo nativo isolado não está na lista: se mudar o
> patamar, entra pela condição (2) como divergência a investigar, não
> como segmento. Quem abre o segmento é o Marcel, com as duas medições
> ao lado. O corte na #284 foi decisão (div. 365) e é o único até aqui.

(Decisão do Marcel sobre a div. 366.) Aplicada para trás às cinco mudanças que a
div. 366 listou (com dez corridas e n ≥ 10), a regra não abre segmento sozinha,
porque quem abre é o Marcel. As duas condições valeram para o
`setup-android@v4`, e a **div. 369** está **fechada** (decisão do Marcel,
2026-09-23): candidato não aberto: mediana fora do IQR por 1,5 s (751,5 s contra Q3 de 750 s), num IQR de 70 s; ruído de corrida. A regra não ganha tolerância numérica: a decisão de abrir é a tolerância, e fica registrada com as medições. O `datetimepicker` segue fora do IQR (div. 368, aberta;
dono: **W4-b3**, que mede o custo do módulo nativo no build junto com o build de release). A tabela está no `CI-FAIXA.md`, "A regra aplicada para trás".

Hoje há dois segmentos: o **regime 1**, antes da #284, e o **regime 2**, desde a
#284, que é a referência. O corte é o `9806e44` (N1-PR3a): os módulos nativos da
navegação e das fontes entraram, e o job passou de ~6–7 min a ~12 min. **O
workflow em si não mudou ali** (div. 365).
