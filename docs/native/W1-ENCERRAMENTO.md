# W1-ENCERRAMENTO.md — o conserto da garantia offline

> **Fonte do bloco.** O que estiver em arquivo de memória de sessão e divergir daqui,
> perde: a regra permanente do `CLAUDE.md` diz que o encerramento commitado é a fonte.
> O bruto está em [`W1-anexos/`](W1-anexos/), no mesmo commit.
>
> **Data**: 2026-09-14. **Uma PR**, dez commits, branch `w1/garantia-offline` a partir de
> `origin/main` (`f79a4b7`), em worktree próprio (`../octavia-w1`) — o checkout principal
> não recebeu commit nem `checkout`. **Aguardando o aval do Marcel: nada foi pushado,
> nada foi mergeado.**

---

## 1. A pergunta do bloco, e a resposta

**"Garantida offline" é falso, e falso na direção perigosa** — diz pronto quando não
está, no único momento em que não dá para conferir. A W1 conserta.

E a resposta curta, que é a frase que a PR carrega:

> ### *"Não estava travado, estava chegando devagar demais."*

O defeito não era um download que para: era **o app não ter como dizer isso**. Ele não
tinha teto, não tinha progresso e não tinha voz — e, pior, *chamava de pronto* o arquivo
que estava chegando.

**A medição que prova as duas metades**, no AVD, hoje, com o app de `f79a4b7`, depois de
uma conexão que entregou 8.192 B de 242.176 e calou:

```
OCTAVIA: file src=disk name=w1-morto-1.pdf bytes=8192
cartão:  "garantida offline · todos os arquivos neste aparelho"
```

E o mesmo disco, com o app do W1:

```
OCTAVIA: file-reject name=w1-morto-1.pdf kind=malformed bytes=8192 expected=-
cartão:  "parcial · 0 de 1 arquivos baixados"
```

---

## 2. Os dez commits

| # | commit | o que é |
|---|---|---|
| 1 | `45add59` `test(W1)` | o G7 e os testes, **reprovando** contra o código de ontem: 17 de 24 |
| 2 | `488cd4c` `fix(W1)` | `.part` + rename — *existir é estar completo* |
| 3 | `86d8b78` `fix(W1)` | `createDownloadTask`, `Content-Length`, `fileVerdict` no core, teto de 30 s |
| 4 | `bb9fb1c` `fix(W1)` | a fila de três trabalhadores; nenhuma falha engolida; o indicador que anda |
| 5 | `d0d09f5` `fix(W1)` | "Baixar esta setlist" grava no durável |
| 6 | `e224dab` `fix(W1)` | o saneamento da abertura |
| — | `3089c4d` `chore(W1)` | **os gates que mudam de forma**: G1a, G1b e o G3 com errata |
| — | `c157fce` `fix(W1)` | **o teto de inatividade SAI** — o aparelho disse que o sinal não existe |
| 7 | `c0dcef8` `docs(W1)` | as três erratas do `PRD-TELA-1.md` |
| 8 | `d94bbc3` `docs(W1)` | a errata da §11 do `V1-ENCERRAMENTO.md` |
| 9 | `04c4f64` `docs(W1)` | o `LOGS-OCTAVIA.md`: uma regra, dois casos do padrão, duas linhas |
| 10 | (este) `docs(W1)` | o encerramento, o pre-check e os anexos |

**Dois commits fora da tabela §3 do pre-check, declarados**: o `chore` dos gates (a §5 os
exigia e não lhes deu número) e o `fix` que **desfaz parte do commit 3** — a errata da PR,
que a §5 abaixo conta inteira.

---

## 3. O conserto, em quatro partes e uma errata

**1. `.part` + rename** (commit 2). Um arquivo só existe quando está completo. É o mesmo
`.tmp` + rename que o `store.ts:42` e o `files.ts:107` já usavam — **a única coisa que
nunca tinha recebido o tratamento era o arquivo baixado**. Com ele, o `localizar()` de
ontem passa a estar certo sem mudar de ideia sobre nada, e `size > 0` vira piso de
verdade (antes não era nem isso: no Android o alvo existe e cresce desde antes do
primeiro byte — **medido**: 30.273 → 211.911 B com o nome final, por 19 s).

**2. A fila de três trabalhadores** (commit 4). **O mesmo 3, com outro significado**: era
o tamanho do lote, passa a ser o teto de downloads simultâneos. O **T1-R13 passo 3**
sempre pediu "concorrência ≤ 3" e a constante sempre se chamou `CONCORRENCIA` — *o nome e
o requisito sempre disseram concorrência; foi a implementação que fez lote*. O lote
garante ≤ 3 e desperdiça vagas; a fila garante ≤ 3 e as usa. Medido: com um arquivo lento
de 21 s, os outros quatro entraram em 40–136 ms **antes dele**; com o lote, nada entrava
até ele acabar.

**3. Nenhuma falha engolida** (commit 4). O `baixar()` descartava o array do
`allSettled`: **toda** falha de download nos três caminhos de prefetch era invisível —
violação direta do **T1-R37**. Medido: três 404 → três linhas; antes, zero.

**4. Saneamento** (commit 6) — e não pelo estrago de hoje, que é zero nos dois aparelhos.
Porque **um arquivo envenenado nunca se recupera sozinho**: o `ensureFile` vê que o
`localizar()` achou e nunca retenta.

**A errata: o teto de inatividade saiu** (`c157fce`). Ele estava no commit 3 e o aceite
**W1-A3** o derrubou — exatamente como o pre-check previu, palavra por palavra, na tabela
de riscos: *"se sair `download-error`, o teto confunde lento com morto"*. Saiu. A
sondagem explicou: **o progresso chega uma vez, no fim, em rajada** (pelos dois caminhos,
`onProgress` e `addListener`), e o disco não fala (o destino não existe durante o download
inteiro). **Não há, no app, nenhum sinal de "chegou byte" em voo** — logo um relógio de
30 s rearmado por progresso nunca é rearmado, e vira teto ABSOLUTO de duração, que é a
opção A, descartada por punir o caso legítimo. → **div. 126**, e a **pergunta 1**.

---

## 4. Os aceites

| # | o que prova | resultado | controle negativo |
|---|---|---|---|
| **W1-A1** | um download interrompido não deixa arquivo no lugar do bom | ✅ três vezes (o lento nunca aparece; o morto não deixa nada; o curto não entra) | o mesmo aparelho com `f79a4b7`: o arquivo cresce **com o nome final** |
| **W1-A2** | a conexão morta | ⚠️ **parcial, e declarado**: nada com o nome final e cartão honesto — **mas sem `download-error`**, porque o teto saiu | `f79a4b7`: fragmento de 8.192 B parado no nome final aos 49 s, e "garantida offline" na reabertura |
| **W1-A3** | corpo mais curto que o `Content-Length` | ✅ recusado (pelo nativo, antes da checagem do app) | **e o controle negativo REPROVOU o teto** — é a errata da PR |
| **W1-A4** | nenhuma falha engolida | ✅ três falhas, três linhas, as outras duas baixam | antes: três falhas, **zero** linhas |
| **W1-A5** | "Baixar esta setlist" grava durável | ✅ `files/…`, `cache/` vazio | `f79a4b7`, mesmo toque, mesmas coordenadas: cai em `cache/…` |
| **W1-A6** | o saneamento repara o que já está no disco | ✅ dois `file-reject`, os dois somem, `.part` varrido, cartões caem para "parcial"; **as entradas do índice ficam** (Q3) | `f79a4b7`: os dois ficam e os três cartões dizem "garantida offline" |
| **W1-A7** | o indicador anda DURANTE o download | ✅ "4 de 5" aos ~14 s, "garantida" ao fim | com o lote, o cartão salta — e com um lento no 1º lote, nunca sai de 0 |

**Do PRD**: **A9** e **A10** rodados (a metade que o V1 dispensou — "baixados em
background" — é o `prefetch.ts` que esta PR reescreveu); **A19** ganhou o irmão que
faltava (a falha de *download*); **A18** e **A21** não tocados e dispensados pelo **G1a**,
com diff vazio em `sync.ts` e `store.ts`; **A13 NÃO rodado** — o palco não foi aberto
nesta sessão, e isso vai declarado, não escondido.

Detalhe verbatim de tudo: [`W1-anexos/W1-C-aceites-aparelho.txt`](W1-anexos/W1-C-aceites-aparelho.txt).

---

## 5. Os gates

| gate | resultado | controle negativo |
|---|---|---|
| **G1a** | diff vazio em 7 módulos + 12 arquivos do core | uma linha no `net.ts` → reprova |
| **G1b** | só adição nos `*.test.ts` do core | **cobrou o preço nesta PR**: o `import` editado virou `import` próprio |
| **G2** | 43 → 43 testIDs | — |
| **G3** | uma linha sumiu, e é a errata declarada; cinco novas, impressas | apagando `lru evict` → "sumiu SEM ERRATA ✗" |
| **G4** / `gate:icones` | 0 acusações | 4 e 18 acusações |
| **G7** (novo) | 25/25 | **18 de 25 reprovam** com o código de `f79a4b7` |
| suíte · tsc · lint | 801 ✓ (+33) · exit 0 · ✔ | — |

**O G1 mudou de forma, e isso é o centro do rito desta PR**: ele afirmava "o
comportamento não mudou" listando nove módulos, e `files.ts` e `prefetch.ts` são dois
deles. Partido em **G1a** (o que a PR não toca) + **G1b** (o que ela toca, provado por
teste que só cresce), com a lista de exceções **escrita no próprio script**:

> ### *A LISTA DE EXCEÇÕES É O ESCOPO DECLARADO.*
> *"Um gate que se afrouxa sem dizer onde deixa de ser gate."* — Marcel, 2026-09-14

---

## 6. Divergências — 123 a 127

Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** instrumento.

| # | origem | o que é |
|---|---|---|
| **123** | **T** | **O `apps/native/App.tsx` não é visto por gate nenhum.** O G1 lista nove módulos **sob `src/`**; o `g2g3.sh` varre `apps/native/src`; o `gate:a20` varre `src`. O arquivo que **fia tudo** — sessão, sync, prefetch, LRU, o callback do indicador — está fora dos três. Esta PR o editou (commits 4 e 6) e nenhum gate teria notado. É a div. 108 num terceiro lugar |
| **124** | **A** | **O `downloadFileAsync` estático parece SERIALIZAR os downloads.** Medido: com o lote de 3 e um arquivo lento, os outros dois do mesmo lote só apareceram quando o lento acabou (23 s), embora levem ~100 ms cada; com `createDownloadTask` terminam em paralelo. Se procede, a barreira de lote era pior do que o desenho dizia: não é só que o 4º não começava — o 2º e o 3º não TERMINAVAM. *[hipótese: fila serial do módulo Expo; não li o Kotlin do `FileSystemDownloadTask`]* |
| **125** | **A/T** | **A mensagem crua da biblioteca, em inglês, chega à tela do músico.** `download-error w1-curto-1.pdf: Call to function 'FileSystemDownloadTask.start' has been rejected.` é o que o S3e mostra (`testID="download-erro"`). O `gate:a20` não a alcança: não é literal em `src`. Não é regressão — o V1 já mostrava o equivalente —, mas agora está medida |
| **126** | **A** | **Não existe sinal de progresso em voo.** `onProgress` e `addListener('progress')` entregam tudo **em rajada, no fim** (medido: download de 20 s, todos os eventos em ms=20075–20088), e o destino não existe em disco durante o download. **Mata o teto de inatividade** e, com ele, a Q2 como foi decidida. E produz o **15º caso do padrão, pelo avesso**: o duplo de teste era MAIS capaz que a biblioteca |
| **127** | **T** | **Com `CI=1`, o Metro serve o bundle em cache.** O primeiro controle negativo desta sessão trocou o código por `f79a4b7`, reabriu o app — e mediu o código NOVO: o logcat saiu com linhas `file-reject` que `f79a4b7` não tem. **Um controle negativo que não reconstrói o bundle mede o código novo.** Toda troca passou a exigir matar e subir o Metro |

**Contagem por origem, das cinco**: **A** 3 (124, 125, 126) · **T** 2 (123, 127).
**A leitura**: nenhuma é regressão desta PR, e **duas são sobre instrumento** — as duas
que mais custaram. O padrão do `LOGS-OCTAVIA.md` ganhou dois casos e uma variante nova.

---

## 7. Contabilidade

| | |
|---|---|
| requests a `/api/*` em prod | **0** (teto 4, alvo 0) — **alvo cumprido** |
| downloads de bucket | **0** (teto 0, decisão Q7) |
| logins · escrita pela API · console | 0 · 0 · 0 |
| comandos ao Tab S6 | **0** — listado em `adb devices`, nunca endereçado |
| commits · branches · pushes | 10 · 1 · **0** |
| mutação do repositório | nenhum `pnpm add`; `package.json` e lockfile com diff vazio |

O zero de prod não é confiança: no único aceite com rádio de pé (W1-A5, ~11 min) o Metro
subiu com `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` **inline**, e as duas requests
do app aparecem no log do mock, uma a uma. Detalhe e os quatro desvios declarados:
[`W1-anexos/W1-E-aparato-e-prod.txt`](W1-anexos/W1-E-aparato-e-prod.txt).

**O emulador, antes × depois**: os **cinco sha256** do store batem byte a byte com o
início da sessão, com o pre-check e com o "FIM" do V1-PR7. O que mudou: o pid do app (14
aberturas) e o bundle carregado (o do W1).

---

## 8. O que fica como dívida

1. **A opção C** (projetar o fim pela taxa e abortar pela projeção) continua **escrita e
   não implementada**, no lugar exato onde entraria, porque falta o `T₁` e ele não se
   inventa, se mede. **Esta PR começou a medir**: a linha `file src=download` agora sai
   com `total=` e `ms=`, e as primeiras taxas já estão no anexo C.
2. **O teto de inatividade** — ver a pergunta 1. Enquanto não houver sinal de progresso em
   voo, uma conexão morta segura **uma das três vagas** até o processo morrer.
3. **As duas hipóteses declaradas e não medidas** continuam as duas: que um processo de
   app não sobreviva 37 h num tablet, e que 30 s de silêncio seja morte de conexão. A
   segunda **perdeu o único uso que tinha** (o teto saiu), e volta a importar se a
   pergunta 1 for respondida com "implementar".
4. **`[hipótese] o build de release se comporta como o dev client** quanto ao progresso
   (div. 126). Tudo foi medido no dev client.
5. **A13** não rodado (o palco não foi aberto).
6. **div. 119** (o `emVoo` que devolve o voo alheio com as opções dele) segue aberta —
   fora da lista fechada, e ela toca o palco, que é território da W2.
7. **div. 121** (`updated_at` do T1-R17) segue fora, para o N2, como decidido na Q5.

---

## 9. Perguntas ao Marcel

**1. O teto de download, agora que o sinal não existe.** *(A pergunta desta PR.)*
Três caminhos:

- **(a) ficar sem teto**, como está na branch, e abrir a medição do build de release como
  item da W2 — **RECOMENDO**. O que se perde é só o aborto: o `.part`, a fila e o
  saneamento já entregam a honestidade, e um download morto custa uma das três vagas, não
  o prefetch inteiro. Segue a sua própria regra: *barato e errado é pior que caro e certo*;
- **(b) medir um build de release antes de decidir** — custa um `assembleRelease` (~15 min
  de CI ou de máquina) e responde se a div. 126 é do dev client ou da biblioteca;
- **(c) teto ABSOLUTO de duração**, com um número escolhido hoje — **não recomendo**: é a
  opção A com outro nome, e inventa o número que a div. 80 existe para não inventar.

**2. A mensagem em inglês na tela do músico (div. 125).** O S3e mostra
`Call to function 'FileSystemDownloadTask.start' has been rejected.`. Consertar exige
escolher texto de UI, que é design. **Recomendo levar para a W2**, que já abre o palco —
e não fazer agora, porque seria extra fora da lista fechada.

**3. Os gates e o `App.tsx` (div. 123).** Pôr `apps/native/App.tsx` na lista do G1a e no
varredor do `g2g3.sh` custa duas linhas. **Recomendo fazer na W2**, junto com o resto do
trabalho de gate — e não nesta PR, para não mexer no gate depois de ele ter medido.

**4. A13 antes do merge?** **Recomendo não**: abrir o palco dispara o `prefetchDemanda`,
que é o eixo da W2, e o A13 lê um arquivo do disco que esta PR não muda (o G1a cobre o
caminho de render com diff vazio).

**5. O `W1-A2` como está.** Ele passa em duas das três metades (nada no nome final,
cartão honesto) e falha na terceira (nenhuma linha de falha para a conexão morta). **Você
aceita o aceite parcial**, com a div. 126 registrada, ou prefere que a PR só feche com a
pergunta 1 resolvida?

---

## 10. O que vem depois

- **W2** — a div. 109 (a barra do palco) + a div. 118 (o `accessibilityState` dos
  inertes), e agora também a 125 e a 123. Continua sendo PR de forma, com veredito visual.
- **N2** — a div. 121 (`updated_at` do T1-R17) e o estouro de teto que o `lruEvict`
  devolve e o `prefetch.ts` ignora.
