# W3 — ENCERRAMENTO

**A fonte do bloco.** Uma PR (`w3/gates-no-ci`), cinco commits, sem tela, sem
aparelho, sem emulador. O que ela fez: **os gates deixaram de só medir**.

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

**Custo**: **13 segundos** para os dois gates diferenciais. A previsão escrita
no anexo D (*"bem abaixo de 1 min"*) era [hipótese]; passa a ser medição, com
`n = 1`.

---

## 3. As divergências — 140 e 141

### Div. 140 (T) — a div. 136 é pior do que a W2 viu

Não é falso positivo inerte: é **REPROVAÇÃO FALSA**. Uma menção a `testID="…"`
ou a uma chamada de log **dentro de comentário** entrava na população do
coletor. A W2 viu a direção barata (aparece como "testID NOVO", veredito
intacto) e contornou. A W3 mediu a cara — com a menção na BASE, **apagar o
comentário deixa o G2 e o G3 vermelhos sem que uma linha de código mude**:

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

Daí a **regra 5** do catálogo, promovida pelo Marcel: *todo achado de coletor
tem duas direções, e a barata é a que se vê primeiro*. A assimetria de custo é
estrutural — a direção barata é a que o instrumento te MOSTRA; a cara só aparece
uma PR depois, quando a população envenenada já é a BASE de outra pessoa.

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
Configurar os checks obrigatórios (`build` e `gates-nativos`) é **ação do
Marcel**, quando esta PR entrar. Enquanto não for feito, o bloco está entregue e
a barreira não está armada.

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
7. **O encerramento da W2** segue não escrito (registrado na memória de sessão,
   não no repositório).

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
| PRs abertas | 2 — a da W3 e a **#304**, fechada sem merge |

**CI do `native.yml`**, com a 15ª corrida (a da #303, `pull_request`, **12m37s**):

```
n=15  piso 9m16s  teto 14m11s  mediana 11m53s  média 11m41s
corte v3 (n=12) + v4 (n=3)
```

Extremos **intactos pela 15ª vez**. A mediana volta a 11m53s, e isso é
**previsão conferida**: a W2 escreveu que ela oscila entre 11m45s / 11m49s /
11m53s conforme a paridade de `n`. **Citar a faixa, não a mediana** (div. 80).

A corrida do `native.yml` na PR **#304** **não entra na população**: a branch era
artificial e foi apagada. Registrado para não virar arqueologia.
