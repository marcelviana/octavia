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
| arquivo | `file src=disk\|download name=<seg> bytes=<n>` | T1-R14 (herdado do N0) | A9, A13 |
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
| falha de download | `download-error <msg>` | `File.downloadFileAsync` rejeitou (T1-R26/R37) — **E5** | A13 |
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
mais três. **São treze, e é sempre o mesmo erro**: ler o que o instrumento mede como se
fosse o que se queria saber.

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

**O que separa os casos entre si, e que vale mais que a lista**:

- o **7** e o **10** foram achados pela **regra 1** ("o gate vem antes do que ele mede"),
  aplicada antes de escrever tela. A regra já pagou dois buracos em PRs consecutivas;
- o **8** é o mais barato de todos e o mais humilhante: **o instrumento documentava a
  própria cegueira por escrito**, e bastava ler o cabeçalho;
- o **9** é o mais perigoso, porque ali o instrumento **não é um script** — é a leitura de
  quem mediu. Fora de ferramenta o padrão não tem cabeçalho para ler;
- o **11** e o **12** são de **escopo declarado**: os dois instrumentos dizem com precisão
  o que cobrem, e os dois foram lidos como se cobrissem a categoria inteira.

### As duas regras que saíram do padrão

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

### A regra de método que o padrão implica

**Uma medição não vira referência sem `n`** (div. 80). Onde houver população, faixa com
mediana; onde não houver, "medido uma vez", escrito assim. O bloco V1 aplicou isto ao custo
do CI (faixa de 12 runs) e ao A17 do Tab S6 (três leituras, cada uma com o seu `n`).
