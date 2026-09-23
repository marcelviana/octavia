# W3 — ENCERRAMENTO

**A fonte do bloco.** Uma PR (`w3/gates-no-ci`, #305), nove commits, sem tela,
sem aparelho, sem emulador. O que ela fez: **os gates deixaram de só medir**.

Os dois últimos commits vieram **depois** de a PR estar aberta e verde, antes do
merge. Na revisão apareceu que o commit 1 tinha desfeito uma decisão do Marcel
(div. 83) sem citá-la, e que o registro que devia impedir isso apontava para o
lugar errado (div. 142). §3a conta o que foi revertido e o que ficou pendente.
No mesmo commit entra o `W2-ENCERRAMENTO.md`, que a W2 não teve.

> **O GATE MEDE, O GATE NÃO IMPEDE.**
> A disciplina do projeto é real e está medida em todas as PRs — e é exatamente
> por isso que a distinção importa. Nada barrava a entrada na `main` de um
> commit que reprovasse um gate; o que barrava era alguém ter rodado e lido.
> — div. 129, aval da W2, 2026-09-15

---

## 1. A distinção que organizou a PR inteira

> ### A FORMA DO GATE DECIDIU O INVÓLUCRO, NÃO A CONVENIÊNCIA.

Os cinco gates não são uma categoria. São **duas**, e a diferença não é de
tamanho nem de linguagem — é de **o que cada um precisa para dizer a verdade**:

| | **ABSOLUTO** | **DIFERENCIAL** |
|---|---|---|
| o que ele lê | **uma árvore** | um **PAR de refs** |
| a pergunta | "este código está certo AGORA?" | "o que mudou entre A e B?" |
| quem | `gate:a20`, `gate:icones` | G1a/G1b, G2/G3 |
| cabe num `it`? | **sim** — o teste roda numa árvore, que é tudo de que ele precisa | **não** — um teste não sabe qual é a BASE da PR, e o checkout default do CI não traz histórico |
| onde foi parar | `apps/native/test/gates.test.ts` → `pnpm test:unit` → job `build` | job `gates-nativos` próprio, `fetch-depth: 0` |

Ter tentado embrulhar tudo do mesmo jeito teria produzido ou um teste que
inventa a sua própria BASE (e passa a medir outra coisa), ou um job que roda a
suíte inteira duas vezes. **A recomendação foi por gate, e é por isso.**

### O `ref: head.sha`, e por que ele não é detalhe

O default do `actions/checkout` numa PR **não é a HEAD do ramo: é o MERGE
COMMIT** que o GitHub monta entre o ramo e a base. Com ele, tudo o que voltou
para a `main` depois do ponto de ramificação apareceria no `git diff BASE` — e o
**G1a ficaria vermelho por culpa alheia**, numa PR que não tocou em nada disso.
O autor olharia para o próprio diff, não acharia a causa, e a primeira conclusão
razoável seria que o gate está quebrado. Um gate que reprova por culpa de
terceiros é pior do que gate nenhum, porque gasta a confiança que o faz ser
lido.

O par certo é `BASE = git merge-base(base.sha, head.sha)` contra a **HEAD do
ramo** — exatamente o par que o executor roda à mão. Conferido no CI (§2):

```
base=cbff07009213afd3ba7d0e98d0fed515145dc104  head=192b954cd3b3e394ec569cce3594108ee0e9bb3a
```

`head` é o commit do ramo, não um merge commit. É o que se queria.

---

## 2. O controle negativo NO CI — a promessa virou medição

O critério do projeto: **um gate que nunca foi visto vermelho no CI é promessa,
não barreira.** A W3 foi entregue com essa metade em aberto e assim declarada;
o Marcel autorizou a branch descartável no aval, e ela rodou.

`w3/cn-ci`, PR **#304** (draft, fechada sem merge, `--delete-branch`). Um commit
só, e o defeito é **TypeScript válido de propósito**:

```diff
-  accessibilityLabel={posicaoAtual === null ? 'Voltar para as setlists' : 'Voltar para o palco'}
+  accessibilityLabel={posicaoAtual === null ? 'Back to setlists' : 'Voltar para o palco'}
```

### O que o CI respondeu

| workflow · job · passo | resultado |
|---|---|
| `CI` · **`gates-nativos`** · G1a | **VERMELHO** — 13 s |
| `CI` · **`build`** · `Test` | **VERMELHO** — 1m28s |
| `CI` · `build` · `Lint` | verde — *"✔ No ESLint warnings or errors"* |
| `CI` · `build` · `Type-check packages/core` | verde |
| `native` · `Type-check apps/native` | **verde** |

Verbatim, do log do job `gates-nativos` (run 35044913970):

```
G1a: DIFF NÃO VAZIO ✗
     apps/native/src/screens/IndexScreen.tsx | 2 +-
     1 file changed, 1 insertion(+), 1 deletion(-)
G1b: só adição ✓
##[error]Process completed with exit code 1.
```

E do job `build`, passo `Test`:

```
FAIL native apps/native/test/gates.test.ts > gate:a20 — nenhum literal de UI
  em inglês (G4) > a árvore de trabalho PASSA — exit 0, zero acusações
AssertionError:
exit=1
  ACUSADO src/screens/IndexScreen.tsx:200 [accessibilityLabel{…}] "Back to setlists" ← termo "back"
  …
  acusações: 1
: expected 1 to be +0 // Object.is equality
Test Files  1 failed | 92 passed | 4 skipped (97)
 ELIFECYCLE  Command failed with exit code 1.
```

**A leitura que importa**: um `lint`, dois `tsc` e o type-check do nativo
ficaram **verdes** com texto em inglês na tela do músico. Antes desta PR, era
esse o conjunto inteiro do que o CI sabia dizer. Os dois vermelhos são **de
causas diferentes** — o `build` porque o TEXTO é inglês (`gate:a20`), o
`gates-nativos` porque o ARQUIVO mudou sem exceção declarada (G1a) —, e nenhum
dos dois existia dez commits atrás.

**O G2/G3 não chegou a rodar** nesse CN: o passo do G1a falhou antes, e o job
para no primeiro passo vermelho. É comportamento certo e fica registrado para
quem ler o log e estranhar a ausência.

### O custo — e a resposta para quem, daqui a um ano, propuser tirar o job

> **O `gates-nativos` roda em 8 SEGUNDOS, e reprova.**

```
w3/cn-ci  192b954  (reprovando)  01:39:02Z -> 01:39:15Z   13 s
#305      440aa1a  (passando)    01:47:25Z -> 01:47:34Z    9 s
#305      f70d988  (passando)    01:59:06Z -> 01:59:14Z    8 s
```

**Faixa: 8–13 s, `n = 3`.** No mesmo relógio de parede, o `build` leva ~3 min e o
APK leva 9m44s–12m53s. O job termina antes de o `pnpm install` do `build`
acabar: **o gate diferencial roda praticamente de graça**. Quem propuser tirá-lo
do CI por custo está propondo economizar oito segundos, e o preço é a div. 129
de volta — o G1a e o G2/G3 voltando a ser comando de mão.

A previsão do anexo D (*"bem abaixo de 1 min"*) era `[hipótese]`. Agora é medição,
com o `n` escrito ao lado, porque **uma medição não vira referência sem `n`**.

---

## 3. As divergências — 140 a 143

### Div. 140 (T) — a div. 136 é pior do que a W2 viu

Não é falso positivo inerte: é **REPROVAÇÃO FALSA**. Uma menção a `testID="…"`
ou a uma chamada de log **dentro de comentário** entrava na população do
coletor. A W2 viu a direção barata (aparece como "testID NOVO", veredito
intacto) e contornou. A W3 mediu a cara — com a menção na BASE, **apagar o
comentário deixa o G2 e o G3 vermelhos sem que uma linha de código mude**
(medido com o coletor de antes da W3):

```
G2 — testIDs  antes=44  depois=43     G2: testID SUMIU ✗
G3 — linhas log( antes=58  depois=57  G3: linha sumiu SEM ERRATA ✗   exit=1
```

Vira o **19º caso do padrão**, e fecha par com o 15º: **um instrumento que lê
texto bruto mede SEMPRE um superconjunto do que afirma medir.** No 15 o excesso
fez **acreditar** (o duplo emitia progresso que a biblioteca não emite); aqui
faz **duvidar**. Quando o 15 apareceu, o catálogo o chamou de "primeira vez" e
tratou a generosidade como acidente de duplo de teste. Com o 19, não é acidente:
é propriedade de quem lê texto bruto.

**O conserto ficou só no G2.** O G3 tem o mesmo mecanismo e continua lendo o
texto cru, **de propósito** — div. 83, §3a. No G3 o superconjunto é o lado do erro
que foi escolhido.

Daí a **regra 5** do catálogo, na redação do Marcel: *todo achado de coletor tem
duas direções, a barata é a que se vê primeiro — e escolher uma direção pode ser
a decisão certa, mas então ela precisa estar onde quem mexe no gate vai ler.*
São **três** ocorrências (83, 136, 140), não duas, e a primeira escolheu um lado
de propósito.

### Div. 141 (T) — a lista de exceções do G1a apodrece

Achada **ao pôr o gate para impedir**, e é filha direta disso: a lista é estado
de UMA PR guardado num arquivo que **sobrevive** à PR. Com gate de mão, quem o
rodava lia a lista e sabia de quem era. Rodando sozinho no CI, exceção esquecida
não faz barulho — só torna o gate mais permissivo, **em silêncio**, para a PR
seguinte.

Nunca é reprovação falsa (lista velha só deixa passar), então o remédio é
proporcional e foi decidido no aval: **o gate IMPRIME as exceções que não usou e
NÃO reprova**. Reprovar quebraria *o gate vem antes do que ele mede* — o commit
1 de uma PR declara a exceção que só o commit 3 vai usar. Se a ordem um dia
inverter, é trocar o `echo` por `A=1`.

```
G1a: EXCEÇÃO DECLARADA E NÃO USADA — poda isto ANTES do merge (div. 141):
      apps/native/src/files.ts
      apps/native/src/prefetch.ts
```

### Div. 142 (D) — o registro que aponta para onde a razão não está

**O achado do dia, e vale mais que o conserto.** O `V1-ENCERRAMENTO.md` §11,
item B8.3, diz: *"O G3 conta comentário (div. 83). **Não é para consertar** — […]
a razão está escrita no próprio comentário do `g2g3.sh`. Entra aqui para que
ninguém 'conserte' sem ler a razão."*

Medido nas quatro versões do `g2g3.sh`:

```
cf9e229  0 · c25db8c  0 · 7630c4e  0 · 78e8e6e  12   (as doze são da própria W3)
```

**A razão nunca esteve lá.** Morava só em `V1-PR6-anexos/README.md`, "Div. 83,
por extenso". A W3 leu o `g2g3.sh` inteiro, não achou razão nenhuma, e desfez a
decisão. É exatamente o que o aviso existia para impedir.

É o padrão numa **variante nova** — o 20º caso do `LOGS-OCTAVIA.md`: **não é
instrumento que mede menos do que se supõe; é REGISTRO QUE APONTA PARA ONDE A
RAZÃO NÃO ESTÁ.** E é pior do que registro nenhum: sem ele, a pergunta *"por que
o G3 não tira comentário?"* ficaria aberta; com ele, a busca termina num arquivo
que parece confirmar que ninguém pensou nisso.

**Consertado aqui** (commit `2ffa3cf`): a razão da 83 passou a morar no
cabeçalho do `g2g3.sh`, onde o encerramento do V1 já dizia que ela estava. O
`V1-ENCERRAMENTO.md` **não foi editado** — documento congelado se anota por
cima, não se reescreve (precedente do DESIGN-TELA-1, W2), e a frase dele passou
a ser verdadeira a partir deste commit.

**Nota de instrumento, da própria medição.** A primeira versão do laço escrevia
`$c:apps/…`, e o zsh leu `:a` como modificador de caminho: todas as contagens
deram 0, **inclusive a do `78e8e6e`**, que tem menções obrigatoriamente. Esse 0
foi o controle negativo que denunciou o instrumento — a regra 4 funcionando no
meio de uma medição sobre a regra 5. (Anexo A §6.)

### Div. 143 (T) — a saída que o executor jogou fora

Na varredura de gates do commit `2ffa3cf`, **uma corrida de `pnpm test` saiu com
exit 1**, e a saída dela tinha ido para `/dev/null`. **Não se sabe qual teste
falhou.** As seis corridas seguintes deram 824 passados, exit 0 — quatro
sozinhas, duas sob carga concorrente de `tsc` e `lint`:

```
1 vermelha em 7 · teste desconhecido · não reproduzida em 6 tentativas
```

**Não vai registrada como "teste instável".** Essa seria a conclusão confortável,
e não tem base: a suspeita recai sobre os testes de tempo (`tests/performance/…`,
*"<100ms requirement"*), mas suspeita não é medição. O erro é de instrumento, e
é do executor.

**É a regra 0 pelo avesso.** A regra 0 é sobre o instrumento que **não viu** — o
dump que devolve `text=""` onde há texto. Aqui o instrumento **viu**: a suíte
imprimiu o nome do teste que falhou. Quem jogou fora o que ele viu foi quem o
rodou. O corolário, que completa a regra do W1 (*todo gate deve imprimir o
tamanho do que leu*): **e quem o roda guarda o que ele imprimiu.** Desde a
varredura seguinte, toda saída de gate e de suíte desta PR foi guardada.

---

## 3a. A decisão (b) — o G3 volta ao texto cru

**Decidido pelo Marcel antes do merge, 2026-09-16.** O prompt pedia "o coletor
do **G2**". O commit 1 estendeu o filtro ao G3 como extra declarado, e chegou a
escrever no `.awk` que *"o projeto passa a ter UMA regra de comentário"* — a
unificação que a div. 83 recusa por escrito. O commit `2ffa3cf` reverte isso:
**filtro só no G2; G3 no texto cru**, e medido como byte a byte igual ao G3 de
antes da W3.

**A razão, na redação do Marcel, e ela não é "o prompt disse G2":**

> A div. 83 escolheu **um lado do erro de propósito**. Num gate de invariância,
> falar demais custa uma errata a mais; falar de menos deixa uma linha sumir em
> silêncio. Reverter isso porque o caminho de reprovação encolheu é **trocar
> proteção deliberada por conveniência de fluxo**. E o risco que a extensão
> resolvia é **latente**: zero menções em comentário hoje.

A separação medida (anexo A §6), com a menção na BASE e o comentário apagado:

```
G2 — testIDs  antes=43  depois=43     G2: antes ⊆ depois ✓
G3 — linhas log( antes=58  depois=57
    apps/native/src/files.ts  * CN div. 83/140: menciona … log(`cn-83`) …
  G3: linha sumiu SEM ERRATA ✗
```

A acusação do G3 é autoexplicativa: a linha que "sumiu" começa com `*`.

### A proposta de revisão da div. 83 — PENDENTE, e não pode se perder

O argumento da opção (a) tem **fato novo de verdade**, e fica registrado aqui por
inteiro:

1. **A div. 83 foi decidida sobre um G3 que exigia linhas IDÊNTICAS** (V1-PR6).
   O incidente que a motivou foi uma linha **NOVA** vinda de comentário.
2. **O W1 trocou "idênticas" por "⊆ com errata declarada".** Desde então, linha
   nova **não reprova mais**, só é impressa. O caminho de reprovação que motivou
   a 83 deixou de existir.
3. **O único caminho de reprovação por comentário que sobra é o SUMIU** da div.
   140: menção na BASE, comentário editado depois.
4. **Com a W3, esse SUMIU bloqueia merge.** E o único remédio que o script
   oferece é declarar na lista de ERRATAS uma "linha de log" que nunca foi log —
   uma errata falsa no registro que existe para ser verdadeiro.
5. **A premissa da 83** — *"quem escreveu a frase é quem recebe a acusação, no
   mesmo minuto, com o diff na mão"* — **não vale para o SUMIU**: quem edita o
   comentário pode não ser quem o escreveu, e a acusação chega pelo CI.

**Por que não se decide agora** (Marcel): não numa PR de invólucro, e não por
quem acabou de descobrir a decisão original. **Se o argumento voltar com caso
real, revisa-se a 83 por escrito, em PR própria, com o texto dela ao lado.**

---

---

## 4. A div. 137, segunda metade

O `mensagemDe()` do `prefetch.ts` — a rede para o que **nunca passa pelo
`falha()`** — seguia com higienização PRÓPRIA e ANTIGA, sem a alternativa do
host nu que a W2 acrescentou ao `higienizar()`. O identificador do projeto
Supabase ia inteiro para o log, e **log deste projeto se cola em anexo
commitado**. A regra 2 do catálogo passa a ter **uma implementação**.

A W2 não pôde tocar aqui porque o `prefetch.ts` está dentro da cobertura do G1a
e declará-lo exceção alargaria o escopo que o commit 1 dela acabara de fechar.
Nesta PR ele é **exceção declarada e justificada no `g1.sh`** — que é o que a
lista existe para ser.

**G3 57 = 57**: nenhuma linha `log(` mudou, logo sem errata de gate. Nenhum
rótulo mudou de vocabulário: `<url>` para `http(s)`, `<uri>` para `file:`,
`"<host>"` para o host nu. O que a PR fez foi dar a cada lado o que só o outro
tinha.

---

## 5. Uma declaração revista por medição

Fica registrado pelo que é, e não como nota de rodapé. No meio da PR foi
declarado, antes de commitar, que o invólucro exigiria `@types/node` como
dependência do `apps/native`, com o `pnpm-lock.yaml` junto. **Medido depois: não
exigia** — o `typeRoots` default do TypeScript alcança o pacote da raiz a partir
de `apps/native`, e o que faltava era só `"types": ["node"]` no `tsconfig.json`.
O lockfile e o `package.json` ficaram **intactos**.

> **Declaração revista por medição é o oposto exato do padrão que este catálogo
> coleciona.** Lá, alguém supõe o que o instrumento faz e segue em frente; aqui,
> a suposição foi escrita, testada e substituída pelo que a máquina respondeu —
> e o custo de ter declarado cedo foi zero, porque declarar cedo é o que torna a
> revisão visível. *(Marcel, aval da W3.)*

---

## 6. A tabela dos cinco, depois desta PR

| gate | roda no CI? | onde | se reprovar |
|---|---|---|---|
| `gate:a20` (+CN) | **SIM** | `gates.test.ts` → `pnpm test:unit` → `build` | `build` vermelho |
| `gate:icones` (+CN) | **SIM** | idem | `build` vermelho |
| **G7** (árvore) | **SIM — e já rodava** | por identidade: `g7.sh WORKTREE` **é** `vitest run --project native` | `build` vermelho |
| **G1a/G1b** | **SIM** | job `gates-nativos` | job vermelho |
| **G2/G3** | **SIM** | idem | job vermelho |

**Fora, declarado**: os **controles negativos** do G1, do G2/G3 e do G7. Os dois
primeiros precisam de um par de refs fabricado; o terceiro **troca arquivos da
árvore de trabalho** para rodar o código de ontem contra as asserções de hoje.
Job que muta a própria árvore é instrumento de mão. Todos foram rodados à mão
nesta PR (anexos A §4 e C §5).

**E falta uma coisa que não é código**: sem **proteção de branch**, "o job fica
vermelho" é informação, não barreira — a div. 129 sobrevive por outra porta.
Enquanto não for feito, o bloco está entregue e a barreira não está armada.

### A receita da proteção de branch — ação do Marcel, depois do merge

```
Settings → Branches → rule para `main`
  ☑ Require status checks to pass before merging
      ☑ build
      ☑ gates-nativos
  ☑ Require branches to be up to date before merging
```

**Por que o "up to date"**: sem ele, **um gate verde sobre base velha passa**. O
`gates-nativos` compara a HEAD do ramo com o ponto de ramificação; se a `main`
andou depois, o verde foi dado a uma combinação que não é a que vai entrar.

**O cuidado: NÃO marcar `android-debug-apk`.** Ele vem do `native.yml`, que é
**filtrado por paths**. Numa PR só de docs o workflow não roda, e um check
obrigatório que nunca roda fica em **"Expected — waiting for status to be
reported" para sempre** — a PR trava sem que nada tenha falhado. O `build` e o
`gates-nativos` estão no `ci.yml`, que não tem filtro, e por isso rodam em toda
PR. (Se um dia o APK precisar ser obrigatório, a saída é um job que sempre roda e
decide por dentro se pula o build — não o filtro de paths.)

---

## 7. Dívida

1. **Cobertura.** O invólucro roda o gate como subprocesso, que não instrumenta
   o processo do Vitest: `a20.mjs` e `icones.mjs` seguem fora do relatório. O
   item 5 da §10 do `W1-ENCERRAMENTO` prometia isso. **O que faria diferente:**
   a opção (A), reescrever como módulo importável com CLI fino por cima. **Por
   que não agora:** é reescrever gate — recusado por princípio duas vezes no W1
   — e misturaria motor com invólucro na PR que existe para separá-los.
2. **Proteção de branch** (§6) — ação do Marcel.
3. **A opção C / `T₁`** — `n = 0` de rede real. Não anda por uma PR existir.
4. **A div. 108** — o `StageScreen.tsx` voltou à cobertura do G1a, mas quem
   afirma que ele não mudou de COMPORTAMENTO continua sendo o aceite no
   aparelho. Limite de método, não buraco de instrumento.
5. **O G8** (gate de dump, pre-check da W2 §3) — não estava na lista fechada.
6. **O `parcial.delete()` fora do `try`** — o item 4 usa esse caminho para
   *testar* a rede e não o conserta. Pô-lo sob `falha()` daria frase de tela e
   prefixo de nome. Não estava na lista fechada.
7. **B8.1 — o APK re-roda em push só de docs, agora com preço.** É a mesma
   mecânica que a V1-PR5 mediu e o `V1-ENCERRAMENTO.md` §11 registra (herdada do
   N1, ainda aberta: *"o rito paga 12 minutos para registrar 12 minutos"*). Num
   evento `pull_request`, o GitHub avalia o `paths` do `native.yml` contra o
   **diff acumulado da PR**, não contra o commit novo. Nesta PR:

   ```
   f70d988  docs(W3) — só docs/native/W3-ENCERRAMENTO.md
     android-debug-apk  01:59:06Z -> 02:11:59Z   12m53s de APK
   ```

   **O custo cresce com o número de pushes de revisão, e no rito deste projeto
   eles são muitos.** Item de bloco futuro. As saídas conhecidas — separar o job
   de APK do gate; ou condicionar por `paths` no `push` em vez do
   `pull_request`; ou um job que sempre roda e decide por dentro se compila —
   são **hipóteses a medir, não palpite a aplicar**. Cada uma muda o que o CI de
   PR garante, e a escolha depende de medir o que se perde. (O mesmo mecanismo
   já tinha sido **delimitado** na #300: numa PR que NUNCA tocou `apps/native/**`,
   o filtro funciona.)
8. **A proposta de revisão da div. 83** (§3a) — **a dívida de ESCRITA fechou no
   W4-a; a DECISÃO segue pendente.** *(Anotação do N2, 2026-09-23: **DECIDIDA pela
   N2-D34** — `DESIGN-N2/README.md` §2, PR #313: o G3 continua contando comentário; a
   remoção de um comentário com `log(` se declara como par com razão, e esse
   **mecanismo é do W4-b** — `N2-ENCERRAMENTO.md` §10.1.1. O texto abaixo fica como
   estava.)* O que esta herança pedia era *"revisa-se a
   83 por escrito, em PR própria, com o texto dela ao lado"*. O W4-a é a PR
   própria, e a razão da forma nova do G3 está escrita no cabeçalho do
   `g2g3.sh`, encostada no texto da 83 — que era o remédio da div. 142 e da
   regra 5 do catálogo. **O que o W4-a NÃO fez, de propósito:** decidir a 83.
   Não há caso real (ZERO menções a `log(` em comentário na árvore, medido de
   novo), e a decisão não é de quem acabou de mexer no gate.

   **O W4-a acrescenta um fato, e ele é a favor da proposta.** O item 4 dela
   dizia que o único remédio para um SUMIU vindo de comentário era *"declarar
   na lista de ERRATAS uma 'linha de log' que nunca foi log — uma errata falsa
   no registro que existe para ser verdadeiro"*. Com a errata em PAR (div.
   189), **esse remédio acabou**: a errata falsa já não basta, seria preciso
   inventar também uma substituta e fazê-la aparecer entre as adicionadas. A
   saída de emergência era ruim e agora está fechada — quem sofrer o SUMIU da
   div. 140 não terá nem ela. Registrado no `g2g3.sh`, ao lado da 83.
9. **A div. 143** — o teste que falhou uma vez em sete não tem nome. Se
   reaparecer, a saída já estará guardada.
10. **O `W2-ENCERRAMENTO.md`** — **escrito nesta PR**, fora de ordem e declarado
    como tal na abertura dele.

*Nota do N2 (2026-09-23), fora da numeração acima:* a **poda do g1** — a lista de
exceções do G1a da div. 141 (§3) — **não é item desta §7**; o N2 a fez na PR #309
(`N2-PR1-anexos/g1-antes-depois.txt`). Anotada aqui porque o handoff do encerramento do
N2 a citou como item da §7 (div. 337, `N2-ENCERRAMENTO.md` §12) — a terceira citação do
W3 por uma estrutura que ele não tem (divs. 147, 219).

---

## 8. Contabilidade

| | |
|---|---|
| requests a `/api/*` em prod | **0** (teto 2, alvo 0) — **alvo cumprido** |
| downloads de bucket | **0** (teto 0) — **cumprido** |
| comandos ao Tab S6 / a qualquer aparelho | **0** — `adb` não foi invocado |
| **emulador** | **não usado**: não iniciado, não consultado, não morto |
| worktree | `../octavia-w3`, nascido **sem** `.env*` |
| branches criadas | 2 — `w3/gates-no-ci` e `w3/cn-ci` (esta, apagada) |
| PRs abertas | 2 — a **#305** (a da W3) e a **#304**, fechada sem merge |
| APKs gastos com push só de docs | **3** — a 17ª, a 18ª e a 19ª (esta última pela tabela das retidas, §8) |
| commits temporários locais | 3, para controles negativos — `a3b1a5b`, um segundo cujo sha não foi registrado (o CN do conserto do commit 1), e `78ff532` (o da decisão b) —, todos desfeitos, nenhum enviado |

**CI do `native.yml`**, com a 15ª corrida (a da #303, `pull_request`, **12m37s**):

```
n=15  piso 9m16s  teto 14m11s  mediana 11m53s  média 11m41s
corte v3 (n=12) + v4 (n=3)
```

Extremos **intactos pela 15ª vez**. A mediana volta a 11m53s, e isso é
**previsão conferida**: a W2 escreveu que ela oscila entre 11m45s / 11m49s /
11m53s conforme a paridade de `n`. **Citar a faixa, não a mediana** (div. 80).

A corrida do `native.yml` na PR **#304** **não entra na população**: a branch era
artificial e foi apagada (e o job foi cancelado pelo `--delete-branch`, com o
`Type-check apps/native` já concluído em verde, que era o que interessava).

### As três corridas RETIDAS — escritas aqui, para não se perderem

Pelo precedente do W1 — *"o encerramento do W1 segurou a corrida da própria #301
de propósito, pelo regresso"* —, o bloco não incorpora as corridas da própria
PR. **O próximo bloco as incorpora.** Até lá, elas moram aqui, com o número do
run, e não em memória de sessão: três pontos de uma população de 18 fora do
repositório seria a div. 110 — achado que existe e não se relê.

| ordem | run | commit | o que disparou | `android-debug-apk` (job) | duração |
|---|---|---|---|---|---|
| **16ª** | `35045454235` | `440aa1a` | a abertura da #305 | 01:47:25Z → 01:57:09Z | **9m44s** |
| **17ª** | `35046199666` | `f70d988` | push **só de docs** | 01:59:06Z → 02:11:59Z | **12m53s** |
| **18ª** | `35094310127` | `712f054` | push **só de docs** | 12:10:32Z → 12:23:24Z | **12m52s** |

Todas `pull_request`, todas `success`, todas `v4`. Durações pelos carimbos do
**job**, que é o nível da população (ver a linha sobre níveis no
`LOGS-OCTAVIA.md`).

**Se as três entrarem**: `n=18 · piso 9m16s · teto 14m11s · mediana 11m54s ·
média 11m43s` — com `n` par, a mediana é a média do 9º e do 10º valores (11m53s e
11m55s). Extremos intactos pela 18ª vez. O corte vai a **v3 (n=12) + v4 (n=6)**.

Parciais, para quem conferir: com a 16ª só, `n=16 · mediana 11m49s`; com a 16ª e
a 17ª, `n=17 · mediana 11m53s` (o 9º valor). *(Correção feita na sessão: a
primeira conta da 17ª deu "13m10s" e "mediana 11m49s". O 13m10s não é nem o job
nem o run — o run foi 12m57s —; saiu do relógio de quem acompanhava a corrida. O
11m49s aplicou a fórmula de `n` par a um `n` ímpar, o mesmo erro de paridade que
a sessão da W2 corrigiu no dela.)*

**A 17ª e a 18ª são também o preço do B8.1** (dívida 7): 12m53s e 12m52s de APK
para dois pushes que não tocaram `apps/native/**`.

### O custo de escrever esta tabela — declarado

**Escrevê-la custa mais um APK.** O push que a traz toca só
`docs/native/W3-ENCERRAMENTO.md` e o `LOGS-OCTAVIA.md`, e ainda assim dispara o
`native.yml` inteiro (~12–13 min), pelo B8.1. A decisão, do Marcel: *perder três
pontos de uma população de 18 custa mais que doze minutos de CI.* O B8.1 se
pagando — não gastar APK à toa — tinha levado a deixá-las fora; **três medições
é o limite** dessa economia.

**E a corrida desse push é a 19ª**, que por construção não pode estar nesta
tabela. Ela não fica só em memória: o próximo bloco a encontra — e confere as três
acima — com

```
gh run list --workflow=native.yml --branch w3/gates-no-ci --event pull_request \
  --json databaseId,headSha,conclusion
gh run view <id> --json jobs --jq '.jobs[] | "\(.startedAt) -> \(.completedAt)"'
```

### O custo do job novo

Está no §2, com `n = 3`: **8–13 s**.

**E a corrida verde da #305 fecha o par do §2 no próprio CI**: o mesmo job que
ficou vermelho com o defeito plantado ficou verde sem ele, e desta vez o **G2/G3
chegou a rodar** (no CN o G1a falhou antes e o job parou):

```
G2 — testIDs  antes=43  depois=43    G2: antes ⊆ depois ✓
G3 — linhas log( antes=57  depois=57
```

É a regra 4 aplicada ao CI e não só à bancada: **um CN que passa é tão suspeito
quanto um gate que nunca acusa** — e aqui os dois lados foram vistos, no CI, com
os dois vereditos.
