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
| sync falhou | `sync fail stage=setlists\|content page=<p> code=<code\|net\|nojson> status=<s>` | qualquer não-2xx/rede; cache anterior mantido (T1-R9) | A19, A21 |
| sync pulado | `sync skip reason=offline` | sem rede ao abrir | A5 |
| cache | `cache hit kind=setlists\|content\|file n=<n>` · `cache miss kind=…` · `cache write kind=… n=<n> invalidated=<n>` | leitura/gravação do cache local (T1-R10: `invalidated=0` em sync sem mudança) | A4, A5, A7, A21 |
| prefetch | `prefetch plan n=<n> reason=7d\|manual\|demand` | T1-R15/R16 | A10 |
| arquivo | `file src=disk\|download name=<seg> bytes=<n>` | T1-R14 (herdado do N0) | A9, A13 |
| LRU | `lru evict n=<n> bytes=<n>` | T1-R14 | A10 |
| navegação no palco | `nav n=<i>/<N> setlist=<id8> t=<ms>` | após avançar/voltar/salto (T1-R27/R28/R34) | A12, A14, A17 |
| fim da setlist | `end-of-setlist n=<N>` | T1-R29 | A14 |
| índice | `index open` · `index jump n=<i>` | T1-R28 | A14 |
| busca | `search q=<len> n=<hits> in-setlist=<k>` · `search close restore n=<i>/<N>` | T1-R20–R23 | A11 |
| zoom | `zoom dp=<18\|22\|26\|32\|40>` | T1-R31 | A15 |
| tema | `theme=dark\|light` | T1-R32 | A15 |
| auto-scroll | `autoscroll on\|off t=<ms>` · `autoscroll disabled kind=pdf` | T1-R30 | A15 |
| placeholder | `placeholder kind=invalid\|unknown-type\|file-missing\|content-missing name=<seg>` | T1-R7(b)(c)(d), R11, R26 | A6, A8, A13 |
| rede | `net online\|offline` | mudança de estado (`expo-network`, N1-D11) | A5, A19 |
| rotação | `rotation=landscape\|portrait n=<i>/<N>` | T1-R27 (N1-D12: rotação preserva posição) | A14 |
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

## Caminho de dev (E4)

O 401 forjado do aceite A2 é **caminho de desenvolvimento**: só existe com
`__DEV__` **e** `EXPO_PUBLIC_DEV_FORGE_401=1`; nunca em build de release.
A linha esperada é `api status=401 path=/api/setlists n=2` seguida de
`auth-failure` — e nenhuma terceira `api status=401`.
