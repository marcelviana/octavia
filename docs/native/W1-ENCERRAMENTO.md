# W1-ENCERRAMENTO.md — o conserto da garantia offline

> **Fonte do bloco.** O que estiver em arquivo de memória de sessão e divergir daqui,
> perde: a regra permanente do `CLAUDE.md` diz que o encerramento commitado é a fonte.
> O bruto está em [`W1-anexos/`](W1-anexos/), no mesmo commit.
>
> **Data**: 2026-09-14. **Uma PR**, doze commits, branch `w1/garantia-offline` a partir de
> `origin/main` (`f79a4b7`), em worktree próprio (`../octavia-w1`) — o checkout principal
> não recebeu commit nem `checkout`. **Avalizada pelo Marcel em 2026-09-14; o merge é
> dele.**

---

## A PR INTEIRA, EM DUAS LINHAS

O **mesmo disco** — um arquivo de 8.192 B de 242.176, deixado por uma conexão que entregou
o cabeçalho, um naco, e calou — lido pelos **dois códigos**, no mesmo aparelho, na mesma
tarde:

```
f79a4b7   OCTAVIA: file src=disk name=w1-morto-1.pdf bytes=8192
          cartão:  "garantida offline · todos os arquivos neste aparelho"

W1        OCTAVIA: file-reject name=w1-morto-1.pdf kind=malformed bytes=8192 expected=-
          cartão:  "parcial · 0 de 1 arquivos baixados"
```

Não é resumo: é a medição, verbatim, e é o bloco inteiro. Tudo o que vem abaixo existe
para explicar como se chega de uma linha à outra, e o que foi preciso derrubar no caminho.
O bruto está em [`W1-anexos/W1-C-aceites-aparelho.txt`](W1-anexos/W1-C-aceites-aparelho.txt) §3.

---

## 1. A pergunta do bloco, e a resposta

**"Garantida offline" é falso, e falso na direção perigosa** — diz pronto quando não
está, no único momento em que não dá para conferir. A W1 conserta.

E a resposta curta, que é a frase que a PR carrega:

> ### *"Não estava travado, estava chegando devagar demais."*

O defeito não era um download que para: era **o app não ter como dizer isso**. Ele não
tinha teto, não tinha progresso e não tinha voz — e, pior, *chamava de pronto* o arquivo
que estava chegando.

**As duas metades estão medidas no par que abre este documento**: o app *acha* o
fragmento, o `touch()` o inscreve no índice, o indicador recalcula — e a setlist vira
"garantida offline" com 8 KB de 242 KB no disco. Não foi preciso reproduzir o
travamento para provar a mentira: bastou o que ele deixa para trás.

---

## 2. Os doze commits

| # | commit | o que é |
|---|---|---|
| 1 | `95987ae` `test(W1)` | o G7 e os testes, **reprovando** contra o código de ontem: 17 de 24 |
| 2 | `5396a19` `fix(W1)` | `.part` + rename — *existir é estar completo* |
| 3 | `8f04677` `fix(W1)` | `createDownloadTask`, `Content-Length`, `fileVerdict` no core, teto de 30 s |
| 4 | `62cbbf3` `fix(W1)` | a fila de três trabalhadores; nenhuma falha engolida; o indicador que anda |
| 5 | `67e1c3b` `fix(W1)` | "Baixar esta setlist" grava no durável |
| 6 | `2110ad7` `fix(W1)` | o saneamento da abertura |
| — | `c25db8c` `chore(W1)` | **os gates que mudam de forma**: G1a, G1b e o G3 com errata |
| — | `3284c51` `fix(W1)` | **o teto de inatividade SAI** — o aparelho disse que o sinal não existe |
| 7 | `f9a2925` `docs(W1)` | as três erratas do `PRD-TELA-1.md` |
| 8 | `ecb0f4f` `docs(W1)` | a errata da §11 do `V1-ENCERRAMENTO.md` |
| 9 | `e682693` `docs(W1)` | o `LOGS-OCTAVIA.md`: uma regra, dois casos do padrão, duas linhas |
| 10 | (este) `docs(W1)` | o encerramento, o pre-check e os anexos |
| 11 | `docs(W1)` | as cinco decisões do aval, as duas redações fixadas e a regra da div. 127 |

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

**A errata: o teto de inatividade saiu** (`3284c51`). Ele estava no commit 3 e o aceite
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
| **W1-A2** | a conexão morta | **duas das três metades passam** (§4.1) | `f79a4b7`: fragmento de 8.192 B parado no nome final aos 49 s, e "garantida offline" na reabertura |
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

### 4.1 O W1-A2, com a redação que a diferença exige

Ele tinha três metades: **(i)** nada com o nome final, **(ii)** o cartão honesto e
**(iii)** a falha visível. **As duas primeiras passam, medidas** — ao fim do cenário
`morto`, `files/` e `cache/` estão vazios e o cartão diz "parcial · 0 de 1".

A terceira **não falhou: ela mede uma coisa que esta PR decidiu não fazer.** O
`download-error` da conexão morta era o teto de inatividade, e o teto **saiu** — porque o
aceite W1-A3 mediu que o sinal que o rearmaria não existe (§3, errata; div. 126;
pergunta 1, respondida em §9). Não é aceite com ressalva, e não é dívida escondida: é um
critério que ficou sem objeto no mesmo dia em que o objeto se provou impossível.

Escrito assim porque a diferença importa para quem ler depois: "passou com ressalva"
convida a esquecer; "duas das três metades passam, e a terceira mede o que decidimos não
fazer" obriga a reabrir a decisão se alguém discordar dela.

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

## 5.1 Um ganho lateral que não estava no plano: a suíte passou a cobrir o nativo

O commit 1 precisou de um projeto `native` no `vitest.config.mts` para que os testes do
G7 rodassem. O efeito colateral é grande, e não estava no recorte:

```
apps/native/src   |   75.62 |     62.5 |   89.58 |   81.93
apps/native/test  |   80.43 |    56.79 |   81.35 |   86.18
```

**Pela primeira vez o CI roda teste de unidade sobre `apps/native`** — a linha acima é do
`build` da PR, não da máquina. Até aqui o `vitest.config.mts` trazia `exclude: ['apps/**']`
desde o N0-PR1 (a decisão está no `N0-PRECHECK.md` §A3/E4 e reaparece escrita no
`N1-PRECHECK.md:257`: *"o Vitest exclui `apps/**`"*), e **é essa exclusão que empurrou os
gates do nativo para fora do Vitest**: o `gate:a20` e o `gate:icones` são scripts `.mjs`
chamados por `pnpm --filter native`, com controle negativo próprio, porque teste ali não
rodava.

*Nota de precisão: o aval atribuiu esse fato à "div. 52 do V1"; `grep` nas tabelas de
divergência do V1 e do V1-PR3 não acha o número 52 com esse conteúdo. O fato é real e
está medido nos dois pre-checks citados acima — o que não se confirma é a numeração.
Registrado assim para que ninguém procure uma divergência que não existe.*

**A exclusão deixou de valer para quem escrever teste em `apps/native/test/`.** Vai como
item da W2 (§10): reavaliar se o `gate:a20` e o `gate:icones` podem virar **testes** em
vez de scripts. O que se ganharia: um só runner, um só relatório, e o controle negativo
como `it.fails` em vez de um segundo comando. O que se perderia, e que é o motivo de isto
ser item de investigação e não decisão: os dois scripts hoje **varrem arquivo** (`src/`
inteiro) em vez de importar módulo, e é essa varredura que os faz enxergar literal em
qualquer forma — a mesma propriedade que a div. 53 e a div. 82 do V1 provaram ser
indispensável. Um teste que importa o mapa de ícones não vê o `.tsx` que não importou.

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

## 6.1 O incidente de CI, e a faixa provando o próprio valor

Com a PR já aberta, o job `native` (o gate de APK) passou a reprovar em **~27 s**, no
passo `android-actions/setup-android@v3`, antes de instalar dependência e antes de
compilar: `Failed to find package 'tools'`. **Não é a PR** — o mesmo passo passou na
`main` 11 h antes, esta branch não toca `.github/` (diff vazio), e o rerun reproduz
idêntico (n=2).

**O que merece registro não é a falha, é o que a apontou.** 27 s está muito fora da faixa
do gate — **9m16s a 14m11s, mediana ~11m49s, n=12**. Com uma referência **pontual**, um
job que "falhou rápido" teria passado por ruído de CI; com **faixa**, a regra *"sair dela
é o que merece investigação"* levou ao passo certo em segundos.

> **É a primeira vez que a regra da div. 80 paga por si num caso que NÃO é de duração.**
> Ela nasceu para impedir que "9m16s" virasse "o custo do gate" (uma medição virando
> referência sem `n`), e acabou servindo de **detector de falha de infraestrutura** — um
> uso que ninguém desenhou. Uma faixa não diz só quanto custa: diz **o que é estranho**.

O conserto foi para **PR própria — a #302**, fora do W1, porque a #301 não pode carregar
infraestrutura e porque mergeá-la com o gate vermelho poria na `main` um estado em que
ninguém sabe se o APK compila, logo depois de uma PR que mexe em `files.ts` e
`prefetch.ts`. A ordem foi: **infra primeiro (mergeada em 2026-09-15), rebase desta
branch, e o merge da #301 com o gate verde.**

**A causa**, para quem reencontrar o `27 s` no histórico: `tools` é pacote **aposentado**
do SDK e continua no default do action (`packages: 'tools platform-tools'`); o
`cmdline-tools` 16.0 da imagem do runner deixou de tolerá-lo. **O bump para `v4` sozinho
não resolveria** — o default dele é o mesmo, lido no `action.yml` da tag. Quem tira a
causa é o `packages: platform-tools` explícito; o `v4` entra junto por pinar o
`cmdline-tools` em vez de depender do que a imagem tiver no dia.

### A medição nova, e o que ela faz com a faixa

A #302 é o próprio instrumento (o filtro `paths` inclui o `native.yml`, então o gate roda
nela): **`android-debug-apk` success em 12m43s**, com o passo que reprovava em **6 s**.

**12m43s (763 s) está DENTRO da faixa**, a 54 s da mediana anterior e a 1m28s do teto:

- **os extremos não se movem** — 9m16s e 14m11s continuam piso e teto;
- **a mediana passa de 11m49s para 11m53s**. Com `n = 12` (par) ela era a média dos dois
  do meio (11m45s e 11m53s); com `n = 13` (ímpar) ela é o 7º valor, e como a medição nova
  é maior que ele, a mediana **sobe para o próprio 11m53s** — que já estava na conta.

**Faixa a citar daqui em diante: 9m16s – 14m11s, mediana 11m53s, n = 13.**

E a ressalva que a população passa a carregar: **a 13ª medição é de outra configuração**
(`v4`, `cmdline-tools` pinado, um pacote a menos). Misturá-las é defensável — o passo que
mudou leva ~6 s num job de ~12 min dominado pelo Gradle —, mas o corte fica registrado:
de agora em diante a série é **v3 (n = 12) + v4 (n = 1)**, e pode ser partida sem
arqueologia se o `v4` se mostrar sistematicamente diferente.

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
2. **O teto de inatividade** — ver a decisão 1 (§9): ele **perdeu o objeto**, porque o
   dano que ele combatia era o da div. 122 e a fila já o conserta. Enquanto não houver
   sinal de progresso em voo, uma conexão morta segura **uma das três vagas** até o
   processo morrer. O que reabre a questão é a medição do build de release, na W2 — não
   um número maior.
3. **As duas hipóteses declaradas e não medidas** continuam as duas: que um processo de
   app não sobreviva 37 h num tablet, e que 30 s de silêncio seja morte de conexão. A
   segunda **perdeu o único uso que tinha** (o teto saiu), e volta a importar se a
   pergunta 1 for respondida com "implementar".
4. **`[hipótese]` o build de release se comporta como o dev client** quanto ao progresso
   (div. 126). Tudo foi medido no dev client — e medir isso é o item 4 da W2.
5. **A13** não rodado (o palco não foi aberto).
6. **div. 119** (o `emVoo` que devolve o voo alheio com as opções dele) segue aberta —
   fora da lista fechada, e ela toca o palco, que é território da W2.
7. **div. 121** (`updated_at` do T1-R17) segue fora, para o N2, como decidido na Q5.

---

## 9. As cinco decisões do aval (Marcel, 2026-09-14)

**1. O teto: (a) — SEM TETO, e a razão que fecha a questão.**

> *"Com a fila, uma conexão morta custa UMA VAGA DE TRÊS, não o prefetch inteiro — que
> era o dano real da div. 122, e já está consertado. **O teto perdeu o objeto.**"*

Isso reposiciona a errata inteira: o teto não foi removido por ser impossível, foi
removido por ter ficado **sem função**. O que ele existia para impedir — um download
condenado comendo o orçamento dos outros — a fila já impede, e impede melhor, porque
impede sempre e não só depois de 30 s. O que sobra do download morto é uma vaga de três,
até o processo morrer; e o cartão, esse, nunca mente enquanto isso.

E o corolário que precisa ficar escrito, porque é o que impede alguém de "consertar" isto
no futuro com um número maior: **um teto que não pode disparar é pior que teto nenhum,
porque promete.** (Marcel, 2026-09-14.)

A opção **(b)** — medir um build de release para saber se o progresso em voo existe fora
do dev client — **tem valor e cabe na W2**, quando o `T₁` já tiver população vinda do
`total=`/`ms=`. **Não bloqueia esta PR.** A **(c)** (teto absoluto com número escolhido
hoje) fica descartada pelo motivo certo: é a opção A com outro nome.

**2. A mensagem em inglês no S3e (div. 125): W2.** *"Escolher texto de UI é design."*

**3. Os gates e o `App.tsx` (div. 123): W2, e PRIORITÁRIO lá.** O motivo de esperar é o
mesmo que eu dei — não mexer no gate depois de ele ter medido —, mas a prioridade é do
Marcel e vai com a palavra dele: **"o `App.tsx` invisível para todo gate é buraco
estrutural, não detalhe, e esta PR o editou duas vezes sem que nada notasse."**

**4. O A13 não roda.** Abrir o palco dispara o `prefetchDemanda`, que é o eixo da W2.

**5. O A2 parcial, aceito — com a redação da §4.1**, que é dele: não "passou com
ressalva", e sim *duas das três metades passam, e a terceira mede uma coisa que a PR
decidiu não fazer*. A diferença importa para quem ler depois.

**E uma regra nova, que saiu da div. 127 e foi para o `LOGS-OCTAVIA.md`:**

> **Controle negativo que NÃO reprova pode ser instrumento quebrado, não código correto.**
> Um CN que passa é tão suspeito quanto um gate que nunca acusa.

---

## 10. O que vem depois

- **W2** — e ela começa com o que NÃO é forma:
  1. **PRIORITÁRIO — a div. 123**, o `App.tsx` fora de todo gate. Buraco estrutural, não
     detalhe. Entra no G1a e no varredor do `g2g3.sh`, e é a primeira coisa a fazer,
     antes de qualquer tela — pela mesma regra que esta PR obedeceu duas vezes: **o gate
     vem antes do que ele mede**;
  2. a div. 109 (a barra do palco) + a div. 118 (o `accessibilityState` dos inertes) — a
     PR de forma que já estava desenhada, com veredito visual;
  3. a div. 125 (a mensagem em inglês no S3e), que é escolha de texto de UI;
  4. **a medição do build de release** (opção (b) da decisão 1): se o progresso em voo
     existir fora do dev client, o teto de inatividade volta a ser implementável — e aí o
     `T₁` já terá população, vinda do `total=`/`ms=` que esta PR passou a registrar;
  5. **reavaliar o `gate:a20` e o `gate:icones` como TESTES** (§5.1): a exclusão de
     `apps/**` do Vitest, que os empurrou para fora do runner, deixou de valer. A
     pergunta a responder antes de mexer: um teste que **importa** módulo enxerga o que a
     varredura de **arquivo** enxerga? A div. 53 e a div. 82 do V1 dizem que não —
     então a resposta pode muito bem ser "ficam como estão", e isso também é resultado.
- **N2** — a div. 121 (`updated_at` do T1-R17) e o estouro de teto que o `lruEvict`
  devolve e o `prefetch.ts` ignora.
