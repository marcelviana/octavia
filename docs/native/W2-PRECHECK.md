# W2-PRECHECK.md — o gate antes da tela

> **VERSÃO FINAL — avalizada pelo Marcel em 2026-09-15.** As seis perguntas da §8 estão
> decididas, com a resposta debaixo de cada uma; o prompt da W2 vem em sessão nova.
>
> **Rascunho no worktree, SEM COMMIT.** Esta sessão não escreveu uma linha de código
> do app, não criou branch, não deu push e não tocou aparelho. O que ela fez foi medir.
> **Ele entra no repositório pelas mãos da PR da W2**, junto com o primeiro commit dela —
> como o `W1-PRECHECK.md` entrou pela do W1.
>
> **Data**: 2026-09-15. **Worktree**: `../octavia-w2`, **detached** em `f58259e` (a `main`
> com a #301 mergeada) — detached de propósito: criar branch já seria mutação. Os worktrees
> do W1 (`octavia-w1`, `octavia-infra`) **não existem mais**; `git worktree list` no início
> da sessão dava só o checkout principal. **O checkout principal não recebeu commit nem
> `checkout`**; foi usado uma vez, em leitura, para rodar o `vitest` (é onde estão os
> `node_modules`).
>
> **Anexos**: [`W2-PRECHECK-anexos/`](W2-PRECHECK-anexos/), cinco arquivos, cada um abrindo
> com o comando que o gerou.

---

## A PERGUNTA DESTE PRE-CHECK, E A RESPOSTA CURTA

A W1 fechou dizendo que a W2 começa pelo que **não é forma**: o `App.tsx` invisível para
todo gate. A pergunta que sobrou foi *"ele é o único?"*.

**É — e o buraco é maior do que um arquivo.** O `App.tsx` é o único arquivo de código de
produção fora de `apps/native/src`, e dentro dele vivem **três linhas do catálogo de
observabilidade**, duas das quais são as que provam a autenticação (A1 e A5):

```
$ # o escopo de HOJE do G3               $ # o escopo que a W2 propõe
  linhas antes=54  depois=54               linhas antes=57  depois=56
  SUMIRAM: []                              SUMIRAM: [App.tsx  log('login-screen');]
```

As duas colunas são a mesma árvore com **uma linha do catálogo apagada** do `App.tsx`.
À esquerda, o gate que existe para impedir exatamente isso diz *"nenhuma linha sumiu ✓"*.
É o controle negativo da div. 123, e ele **reprova hoje** — que é o que a regra da div. 127
exige antes de qualquer conserto de gate.

> **ORDEM DO MARCEL (aval da W2, 2026-09-15): esta medição abre o `W2-ENCERRAMENTO.md`**,
> no lugar em que o par de 8.192 B abriu o do W1. *"Apagar `log('login-screen')` do
> `App.tsx` — a linha que PROVA o A5 — e o G3 responder 'nenhuma linha sumiu ✓'. O gate que
> existe para impedir exatamente isso diz que está tudo bem."*

---

## 1. As cinco hipóteses

### H1 — o que mais está fora de gate além do `App.tsx` · **FECHADA**

**Inventário completo** em [`W2-A`](W2-PRECHECK-anexos/W2-A-gates-e-escopo.txt) §1–§2.

- **`apps/native/` fora de `src/`**: `App.tsx` (281 linhas), `index.ts` (8 linhas, só
  `registerRootComponent`), `test/` (4 arquivos), `scripts/` (5 + `__cn__`), `app.json`,
  `tsconfig.json`, `assets/`. **O `App.tsx` é o único código de produção fora de todo
  gate.** O `index.ts` está tecnicamente na mesma situação e não tem nada que um gate
  meça. O `test/` está fora do G2/G3 **por decisão declarada**, escrita no
  `vitest.config.mts` — não é buraco.
- **`packages/core/`**: **não tem o buraco**. Todo código vive em `src/`; fora dele há só
  `package.json` e `tsconfig.json`. O G1a varre o core por `git ls-tree`, o G3 o varre por
  `find`.
- **A raiz do repo**: os arquivos de código do topo são do app web, cobertos pelo `ci.yml`
  (lint, dois `tsc`, a suíte). Os dois `tsconfig` da raiz excluem `apps/**` e `packages/**`
  explicitamente. Não é território dos gates do nativo, e não deve ser.

**Caminho fixo × padrão, e qual não acompanha arquivo novo** (§3 do anexo):

| instrumento | escopo | segue arquivo novo? |
|---|---|---|
| `g1.sh` · G1a `NUCLEO` | **lista literal de 7 caminhos** | **NÃO** |
| `g1.sh` · G1a `CORE`, G1b | `git ls-tree … packages/core/src` | sim |
| `g2g3.sh` | `find apps/native/src` / `git ls-tree` | sim, **dentro de `src/`** |
| `a20.mjs` | `walk(RAIZ)`, RAIZ do argv | sim, **dentro de `src/`** |
| `icones.mjs` | um arquivo nomeado | n/a |
| `g7.sh` | vitest `apps/native/test/**` | sim |

**O que silenciosamente não acompanha um arquivo novo é o `NUCLEO` do G1a** — sete
caminhos escritos à mão no script. A metade do core do **mesmo gate** não tem esse defeito.
Os outros dois não erram por arquivo novo: erram por **diretório**, e é aí que o `App.tsx`
mora. **Div. 134.**

**Quanto o G3 deixa de ver, em número**: 54 linhas `log(` no escopo, **3 fora**, todas em
`App.tsx`, **as três catalogadas** (`login-screen`, `auth uid=…`, `download-error`).
População certa: 57. **Div. 128.**

**O conserto e os dois controles negativos** estão no anexo §5–§7: quatro linhas no
`g2g3.sh`, um argv no `package.json` mais uma lista de exclusão no `a20.mjs`, e o
`App.tsx` entrando no `NUCLEO`. Os dois CN reprovam hoje (o do a20 acusa o literal inglês
injetado numa cópia de scratch do `App.tsx`; o do G3 é o par de colunas do topo).

### H2 — os gates como testes · **FECHADA, com recomendação**

Medido em [`W2-B`](W2-PRECHECK-anexos/W2-B-gates-como-teste.txt).

**O `apps/native/vitest.config.mts` não existe** — o projeto `native` vive no
`vitest.config.mts` **da raiz** (div. 133). Ele inclui `apps/native/test/**/*.test.ts`,
exclui só `node_modules`, roda em `node` sem setup e com o alias do duplo de
`expo-file-system`. O `exclude: ['apps/**']` do bloco `test` da raiz continua lá e continua
valendo — para os projetos `web` e `core`. O `native` tem include próprio e não o herda.

**O achado que muda o peso da pergunta**: nenhum dos cinco gates roda no CI. Nem o
`gate:a20`, nem o `gate:icones`, nem G1/G2/G3/G7 — todos são comando de mão, colados em
anexo. O que roda no CI é a suíte (`pnpm test:unit`), e é por isso que o projeto `native`
do W1 importa tanto: **um teste em `apps/native/test/` roda em toda PR, sem ninguém
lembrar.** Não é o ganho que o item 5 da §10 do W1 listava ("um só runner"); é maior.
**Div. 129.**

**Um teste consegue o que os scripts fazem?** Sondado, e sim — 5 de 5 passam, **147 ms**:
lê o `README.md` do DESIGN-V1 (57.861 B), o `telas.html` (622.224 B) e o anexo D
(15.874 B); roda os dois gates como subprocesso e recebe o exit code; e o **controle
negativo exigindo exit 1 passa**. O caminho é `import.meta.url` + `'..','..','..'`, que é a
mesma âncora que o `icones.mjs` já usa hoje.

**O que se perde e o que se ganha** depende de qual conversão:

|  | (A) reescrever como módulo | (B) embrulhar o script num `it` |
|---|---|---|
| exit code próprio | mantido (CLI fino) | **mantido** |
| saída legível | mantida | mantida (capturar stdout, imprimir ao reprovar) |
| CN como comando | mantido | **mantido** — `gate:a20:cn` continua existindo |
| roda no `pnpm test` / CI | sim | **sim** |
| aparece na cobertura | sim | **não** (subprocesso não instrumenta) |
| custo | reescrever os dois scripts inteiros | 147 ms e ~40 linhas de teste |
| risco | mexer no gate na PR em que ele mede outra coisa | nenhum: o gate não muda |

E o medo do item 5 — *"um teste que importa módulo não vê o `.tsx` que não importou"*
(div. 53, div. 82) — **não se aplica a nenhuma das duas**: em (A) e em (B) o instrumento
continua sendo varredura de arquivo. O que a div. 53 proíbe é trocar varredura por
importação, e ninguém propôs isso.

> **RECOMENDAÇÃO: (B), e NÃO agora.** (B) é barata, não perde nada que importe e ganha o
> CI. Mas a W2 vai mexer no escopo dos dois gates (div. 123) — e **mudar o escopo e mudar
> o invólucro na mesma PR é perder a capacidade de dizer qual dos dois causou o quê**. É a
> razão 2 pela qual a própria div. 109 esperou. **Vai para a W3, e é dívida de valor alto
> e risco baixo** — não é "ficam como estão".

### H3 — a barra do palco, medida · **FECHADA**

Medido em [`W2-C`](W2-PRECHECK-anexos/W2-C-barra-e-arvore.txt), **sem tocar aparelho**: a
geometria foi derivada dos tokens do código e conferida contra o dump que a V1-PR7 já
mediu. **As duas fontes dão o mesmo número.**

```
caixa 66 dp (touch.stage + 2) · folga 16 (space.lg) · margem 24 (space.xl)
x1: 24 · 106 · 188 · 270 | 352 · 434 · 516     fileira 558 dp, fim do 7º a 582 dp
VAZIO à direita, na janela de 1137,8 dp: 555,8 dp = 49% da barra
dump da V1-PR7: 24,0 · folgas 16,0 (sete, iguais) · fim 582,2 · vazio 555,6 = 49%
```

**Os três que podem ficar inertes são `auto-scroll`, `zoom-menos` e `zoom-mais`** — os três
primeiros, todos do grupo da esquerda; nenhum dos outros quatro tem `inativo` em lugar
nenhum do arquivo. **Confirmado, e com uma precisão que o achado do V1 não tinha**: o grupo
da esquerda tem **quatro** (o `tema` é comportamento da tela) e só **três** podem ficar
inertes. A fronteira de estado é **subconjunto** da de função, não igual a ela.

> **E a frase que circulava está errada, por decisão do Marcel no aval da W2:** *"eu vinha
> repetindo 'os três inertes são o grupo da esquerda' desde o aceite do V1, e a fronteira
> não coincide exatamente."* A redação que passa a valer: **os três que podem ficar inertes
> estão todos no grupo da esquerda, que tem quatro.**
>
> **Corrigir onde a frase aparece** (commit 5 da W2, edição de documento):
> `V1-PR7-anexos/V1-PR7-C-aceite-visual.txt` ("A FRONTEIRA POR FUNÇÃO É TAMBÉM A FRONTEIRA
> POR ESTADO", e a linha "Os três controles que podem ficar inertes … são TODOS do grupo da
> esquerda", que está certa e fica) · `W1-PRECHECK.md` §H5 e a razão 3 do [decidido]
> ("A fronteira por função é a fronteira por estado") · `W1-ENCERRAMENTO.md` §10, item 2.
> Os anexos do V1-PR7 são rastro e recebem nota por cima, não reescrita.

**O desenho não resolve — ele desenha o problema.** A §5.3 do DESIGN-V1 dá à barra só a
altura (96 dp); não há uma linha sobre distribuição horizontal. As seis molduras do S3 no
`telas.html` são imagens PNG, e mostram a fileira contígua que o app desenha. A §8
("Propostas") tem quatro itens e **nenhum é sobre a barra**.

> **E isso NÃO faz da W2 um desenho novo.** A **Proposta A já está decidida pelo Marcel**
> (2026-09-14), com número, e conferida contra V1-A8, V1-A14 e as bordas do A14. Não há
> estética a propor aqui, e este pre-check não propõe nenhuma.

A implementação é **um `<View style={{ flex: 1 }} />` entre `tema` e `indice`** — nada de
número cravado. A conta fecha: espaçador de 515,8 dp, vão de 16 + 515,8 + 16 = **547,8 dp**
contra os 547,1 da Proposta A (a diferença é o arredondamento de 2560 px / 2,25).

**O que isso custa ao congelado**: as seis molduras do S3 passam a mostrar uma barra que o
app não desenha mais. Nenhum gate quebra — o `gate:icones` cobra desenho de ícone, não
layout. Mas o documento passa a mentir, e a §9 tem quinze erratas (E1…E15) exatamente para
esse caso. **A W2 deve a décima sexta.**

### H4 — a div. 118 e a árvore de acessibilidade · **FECHADA**

**O mecanismo**: no app inteiro há dois jeitos de marcar desabilitado, e o palco não usa
nenhum — `LoginScreen.tsx:163` usa `disabled={!podeEnviar}` (é por isso que o S0 sai
`enabled=false`: o RN mapeia `disabled` do Pressable para `setEnabled(false)` do Android) e
`SetlistsScreen.tsx:226` usa `accessibilityState={{disabled: …}}`. O `Controle` do palco
(`StageScreen.tsx:786-828`) transforma `inativo` em **`estado` e `tinta`, e mais nada** —
desenho puro. Daí o `enabled=true clickable=true` dos dumps.

**E a extração dos dumps commitados diz quanto** ([`W2-C`](W2-PRECHECK-anexos/W2-C-barra-e-arvore.txt) §5):
a sub-árvore da barra é **idêntica** no estado ativo e no inerte — mesmos sete `bounds`,
mesmos `enabled=true clickable=true`, nos **dois** aparelhos. A única diferença entre "posso
usar" e "não posso" é o `content-desc`. Para quem navega pela árvore **os dois estados são o
mesmo estado**: o leitor de tela anuncia um botão utilizável, e "indisponível" chega como
parte do nome, não como propriedade. A div. 118 dizia que a E3 está errada; isto mede o
tamanho do erro.

**O conserto é de uma linha — e tem de ser a linha certa:**

```
✅  accessibilityState={{ disabled: inativo === true }}
❌  disabled={inativo === true}
```

O `disabled` do Pressable **impediria o `onPress`**, e é o `onPress` do inerte que revela o
motivo na linha acima da barra (`if (inativo && motivo) onMotivo(motivo)`). Consertaria a
árvore e **quebraria o A15** na metade que a errata do PRD acabou de fixar. O CN do aceite
tem de mostrar o motivo **ainda aparecendo depois do conserto** — senão o conserto passou
por cima do A15.

Com o conserto, a errata **E3 do DESIGN-V1 deixa de ser falsa** (não precisa de errata; ela
passa a descrever o app). Quem precisa de edição é o `PRD-TELA-1.md:292`, onde o W1
escreveu, corretamente para o dia de ontem, que o palco está `enabled=true` — **se a W2 não
o editar, o PRD volta a afirmar uma coisa falsa no dia do merge.**

### H5 — a mensagem em inglês (div. 125) · **FECHADA**

Medido em [`W2-D`](W2-PRECHECK-anexos/W2-D-mensagem-crua.txt).

**Onde nasce**: `files.ts`, função `falha(erro, name)`, três ramos. O ramo 1 devolve as
frases de `motivo()` (pt-BR); o ramo 2 traduz `status: NNN`; **o ramo 3 devolve
`${name}: ${bruta}`, com só as URLs higienizadas.** O ramo 3 é deliberado e documentado —
o que ele resolve é a regra 2 do catálogo (URL nunca entra em log). Ele nunca prometeu
resolver idioma.

**Por onde passa**: `falha()` → rejeição de `ensureFile` → `catch` de `buscarArquivo`
(`StageScreen.tsx:350`) → `e.message` → `setArquivo({fase:'erro'})` →
`<Text testID="download-erro">` — a tela do músico.

**É uma família, com duas classes** (div. 131):

1. o que passa pelo `falha()` e cai no ramo 3 — qualquer coisa lançada dentro do `try` de
   `baixarAtomico` sem `status: NNN` na mensagem;
2. **o que nem passa pelo `falha()`** — o ramo de promoção do `ensureFileUma`
   (`alvoDir.create()`, `destino.delete()`, `atual.file.moveSync()`) está fora de qualquer
   `try`: sobe cru, **sem nem o prefixo do nome**, até o palco e até o `App.tsx:222`.

**O `gate:a20` alcançaria a interceptação?** **Não, e não é questão de escopo.** O a20 acusa
**literal** em posição de texto; a mensagem é valor de tempo de execução. Pôr o `App.tsx` no
escopo (o conserto da div. 123) não a alcança; varrer `apps/native` inteiro não alcança;
**nenhum escopo alcança**. O `gate:a20` tem escopo menor do que o **aceite A20** que ele
representa. **Div. 130** — e é o padrão do `LOGS-OCTAVIA.md` num lugar novo.

O que alcança, e agora é possível porque o W1 abriu o projeto `native` do vitest: **um teste
de unidade sobre `falha()`** (uma linha de `export`) afirmando que, dado um `Error` com
mensagem arbitrária, o que sai está num conjunto **fechado** de frases em pt-BR.

---

## 2. O recorte proposto

Os quatro itens são de quatro naturezas: **gate**, **layout com decisão já tomada**,
**texto de UI**, **infraestrutura de teste**. Não cabem numa PR — mas o corte não é
4 → 4.

| | escopo | por quê |
|---|---|---|
| **W2** | **(1) o escopo dos gates** (div. 123/128/134) → **(2) a barra, Proposta A** (div. 109) + **(3) o `accessibilityState`** (div. 118) + **(4) a mensagem crua** (div. 125/131), mais as erratas que os quatro obrigam | **uma tela, um aceite visual, um dump.** Os três últimos tocam **o mesmo arquivo** (`StageScreen.tsx`) e se provam **no mesmo dump do mesmo estado**: o dump que mede os sete `x1` é o dump que diz `enabled=false`, e o estado S3e é o mesmo palco. Separá-los é pagar três aceites de aparelho pelo preço de um |
| **W3** | os gates como **testes** (H2, opção B) | **não entra**: a W2 muda o ESCOPO dos mesmos dois gates. Escopo e invólucro na mesma PR é perder quem causou o quê — a razão 2 pela qual a 109 esperou |
| **W3 ou N2** | a medição do **build de release** (opção (b) da decisão 1 do W1) | **não entra**: é medição de aparelho com instalação nova, sem linha de código, e o `T₁` que a justificaria não existe (§6) |
| **N2** | div. 121 (`updated_at`), o estouro do `lruEvict`, div. 119 (`emVoo`) | como já decidido |

**E a ordem dentro da W2 é a regra que a W1 obedeceu duas vezes — o gate vem antes do que
ele mede:**

| # | commit | o que entra | como se prova |
|---|---|---|---|
| **1** | `chore(W2)` | **o escopo E o mecanismo**: `g2g3.sh` e `a20.mjs` passam a alcançar `apps/native` fora de `src/`; e o `NUCLEO` do G1a **deixa de ser lista literal** e passa a ser derivado (`git ls-tree`, com a lista de EXCEÇÕES declarada no script — que é o que o escopo da PR sempre foi). Consertar só o escopo deixaria o próximo arquivo cair no mesmo buraco (div. 134) | os **dois CN do anexo A reprovam**, e a saída vai para o anexo. Se não reprovarem, o gate é que está quebrado (div. 127). **CN do mecanismo**: um arquivo novo em `apps/native/src`, fora da lista de exceções, tem de entrar na invariância sozinho |
| **2** | `fix(W2)` | `accessibilityState` nos inertes | dump do S3 em PDF: os três `enabled=false`, os quatro `true`, **e o motivo ainda aparecendo ao toque** (A15) |
| **3** | `fix(W2)` | a barra, Proposta A: um espaçador `flex: 1` | dump: `indice` a ~883,8 dp, margem direita 24,0 dp, V1-A8 e V1-A14 intactos |
| **4** | `fix(W2)` | a mensagem: `falha()` fecha o ramo 3 com **frase genérica em pt-BR**, o ramo de promoção entra num `try`, e **o nome do arquivo sai da tela e fica só no log** (decisão 2) | teste de unidade em `apps/native/test/` (roda no CI) afirmando que a saída do `falha()` está num conjunto FECHADO de frases; mais o S3e no aparelho, com o erro provocado |
| **5** | `docs(W2)` | **E16** do DESIGN-V1 (a barra, *anotada por cima, sem redesenhar moldura* — decisão 3); `PRD-TELA-1.md:292` (senão o PRD volta a mentir no dia do merge); a correção da frase da fronteira nos três lugares (§H3); e o `LOGS-OCTAVIA.md` — a errata do `download-error`, os casos **16** e **17** do padrão, e o **trio 80 · 111 · 132** | — |

**O que explicitamente NÃO deve ir junto**: a conversão dos gates em teste; o build de
release; o `cor.offline`/tema claro; a div. 121; qualquer item da §8 do DESIGN-V1.

---

## 3. Os gates da W2

**O que muda de escopo** (o commit 1): `g2g3.sh` nos dois ramos do `coleta()`, `a20.mjs`
via argv com lista de exclusão, `NUCLEO` do G1a ganhando `apps/native/App.tsx`.

**O que a div. 123 obriga a reescrever, e que não é escopo**: a **lista de exceções do
G1a é o escopo declarado da PR**, e a W2 tem outro escopo. Para a W2 ela vira:

```
G1a da W2 :  os NOVE módulos do nativo (os 7 do W1 + files.ts + prefetch.ts)
             + App.tsx  +  packages/core/src INTEIRO (o offline.ts volta)
             exceção declarada: StageScreen.tsx, e só ela
```

> **ERRATA DA PR (2026-09-15) — div. 135.** A lista acima está **incompleta**, e
> quem a escreveu foi este pre-check. O commit 4 da própria PR que ele desenha
> muda o `files.ts` (a frase de tela separada do detalhe de log, e o ramo de
> promoção do `ensureFileUma` entrando num `try`): ele é exceção, não cobertura.
> A lista que o `g1.sh` da W2 declara, e que vale:
>
> ```
> exceções declaradas: apps/native/src/screens/StageScreen.tsx  (commits 2, 3, 4)
>                      apps/native/src/files.ts                 (commit 4)
> ```
>
> O `App.tsx` **não** é exceção — ele entra na invariância, que é o ponto da PR —,
> e o `prefetch.ts` e o `core/offline.ts` voltam à cobertura. Resultado: **33
> arquivos** no escopo do G1a, contra os 19 do W1. É a mesma forma da lição que
> este pre-check mediu no G1a do W1: **a lista de exceções é o escopo declarado, e
> escopo se conta depois de escrever o código, não antes.**

**O que continua sem cobertura, e é a div. 108 e não a 123**: o `StageScreen.tsx` nunca
esteve em lista nenhuma do G1. Quem afirma que ele não mudou de comportamento é o aceite no
aparelho, não um diff — e é por isso que o aceite visual da W2 não é opcional.

**O gate novo que a W2 deve — G8, a barra e a árvore**: um `.mjs` versionado que lê um
`uiautomator dump` do S3 e afirma (i) os sete `x1` em dois grupos, com margem direita igual
à esquerda; (ii) `enabled=false` exatamente nos três inertes e `true` nos quatro restantes.
O CN é o dump de **hoje**, que tem de reprovar nas duas metades — e ele já existe,
versionado em três arquivos — `dumps-avd/A15-pdf-inerte.xml` (o AVD, que é o aparelho da
W2), `dumps-tabs6/AVicones-B2-pdf-inertes.xml` e `dumps-tabs6/AVicones-A-texto.xml`. **É o
raro caso em que o controle negativo do gate novo está commitado desde antes da PR.**

**O que não muda**: `icones.mjs` (escopo de um arquivo nomeado), `g7.sh`.

---

## 4. Os aceites

**Do PRD, os que a W2 toca:**

| # | o que é | por quê entra |
|---|---|---|
| **A13** | PDF de 12 páginas do cache em avião, 12 navegáveis | **entra, e é obrigatório**: o W1 o deixou sem rodar (decisão 4 do aval, "abrir o palco dispara o `prefetchDemanda`") e a W2 **é** a PR do palco. Rodá-lo aqui é o que fecha a dívida 5 do W1 |
| **A15** | auto-scroll <100 ms em texto, **inerte em PDF com o motivo ao toque** | **entra**: o conserto da div. 118 mexe exatamente no controle inerte. É o aceite que a linha errada (`disabled`) quebraria |
| **A20** | nenhum literal de UI em inglês | **entra**, e com a ressalva da div. 130: o gate não o representa inteiro. O aceite é a **tela**, não o script |
| **A14 / A8** | bordas do palco; sete controles ≥64 dp, mesma ordem, `x1` iguais entre variantes | **conferência**, não conserto: a Proposta A foi verificada contra os dois e o dump da W2 tem de reconfirmar |
| A16, A17, A18, A21 | | não tocados; dispensáveis pelo G1a com diff vazio |

**Os aceites novos da W2** (a numerar W2-A1…):

1. os sete `x1` em dois grupos, margem direita = margem esquerda = 24,0 dp, medido no dump;
2. os três inertes `enabled=false` e os quatro restantes `enabled=true`, **no mesmo dump**;
3. o motivo do inerte **ainda aparece ao toque** depois de (2) — o CN do conserto de uma linha;
4. nenhuma frase em inglês chega ao `testID="download-erro"`, com o erro provocado de
   propósito (o mesmo fixture `w1-curto-1.pdf` do W1);
5. os dois CN de gate do commit 1 reprovam sobre `f58259e`.

---

## 5. A faixa de CI

Medido em [`W2-E`](W2-PRECHECK-anexos/W2-E-ci-e-contabilidade.txt) §1–§2. A corrida da #301
foi conferida no `gh`: job `android-debug-apk`, `12:04:36Z → 12:13:55Z` = **9m19s**,
confirmando o número do prompt. A regra de leitura da população (job de um run de
`pull_request`) foi validada por dois casos já registrados: a #302 dá 12m43s e a #299 dá
12m32s, exatamente como estão no W1 e no V1.

```
n=13 (reconstruída): 9m16s – 14m11s · mediana 11m53s · média 11m48s   ← bate com o W1
n=14 (com a #301)  : 9m16s – 14m11s · mediana 11m49s · média 11m37s
```

**A faixa se move nos extremos? Não — pela décima quarta vez.** O que se move é a mediana,
e **para trás**: ela volta a 11m49s, que é onde estava em n=12. Ela oscila entre 11m45s,
11m49s e 11m53s conforme a paridade de `n`, enquanto piso e teto não se mexem há catorze
medições. **É argumento para citar a faixa e não a mediana** — que é o que a regra da
div. 80 sempre disse.

> **Faixa a citar daqui em diante: 9m16s – 14m11s, mediana 11m49s, n = 14.**

**E o corte v3/v4 muda de sinal.** Era `v3 (n=12) + v4 (n=1)`; passa a `v3 (n=12) +
v4 (n=2)`, e as duas de `v4` são **9m19s e 12m43s** — uma quase no piso, outra acima da
mediana. O par cobre quase toda a amplitude do `v3`: é evidência **contra** "o `v4` é
sistematicamente diferente". Não é prova com `n=2`, mas quem quiser partir a série agora
tem de argumentar contra isto.

**Fora da população, declarado**: o run de `push` do merge da #302 (10m27s) e o run de
`push` do merge da #301, **em andamento** no momento deste pre-check. Os dois são `push`;
a série é de PR.

---

## 6. O que a W2 herda e **não** resolve

1. **A opção C do teto** — e a medição que a sustentaria **não começou**. O W1 diz que "as
   primeiras taxas já estão no anexo C": são **12 linhas** com `total=` e `ms=`, e as doze
   são de **fixtures servidas por um mock em `localhost:8788`**, várias com a taxa
   estrangulada de propósito pelo próprio servidor de teste (242.176 B em 40 ms é loopback;
   em 20.106 ms é atraso encenado). **Para escolher um `T₁`, a população continua sendo
   `n = 0`**; a única medição de rede real segue sendo as 37 h com `n = 1`. **Div. 132.**
2. **A div. 121** (`updated_at` do T1-R17) — fora, para o N2, como decidido na Q5 do W1.
3. **As quatro propostas do DESIGN-V1 §8** — chevrons, os cinco desabilitados, ordenação
   por data, a marca em SVG. Nenhuma decidida. **Uma delas encosta na W2 e merece a
   pergunta 4**: a 8.2 lista `S3e · Baixar` entre os cinco, e a W2 está mexendo no S3e.
4. **O `cor.offline`** — medido, e a herança está **certa**: `colors[tema].offline` tem
   **zero** usos; o ponto de offline do palco é `backgroundColor: dark.offline`, estático,
   em `StageScreen.tsx:860`, renderizado em `:520`. A precisão que se acrescenta: **é o
   único `dark.*` cravado numa tela que é temática** (todo o resto passa por
   `cor = colors[tema]`), e no tema claro dá 2,44:1. Fica fora da W2 — é item do tema
   claro, e a §1 do design congela a barra SUPERIOR do S3.
5. **O tema claro nas listas** (S1, S2, S4, S5) — aberto, fora.
6. **O A13 não rodado** — **isto a W2 resolve**, e por isso não está nesta lista como
   herança: ver §4.
7. **A div. 119** (`emVoo` devolvendo o voo alheio com as opções dele) — segue aberta;
   toca o palco mas não a barra. Fora da W2, para o N2.

---

## 7. Divergências — 128 a 134

Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** instrumento.

| # | origem | o que é |
|---|---|---|
| **128** | **T** | **O G3 compara 54 linhas `log(` e deveria comparar 57.** As três que faltam estão no `App.tsx` e **as três estão no catálogo**: `login-screen` (prova o A5, como CN), `auth uid=… src=…` (A1 e A5) e `download-error` (A13, W1-A4). O gate que existe para impedir que uma linha do contrato suma em silêncio não lê o arquivo onde vivem três delas. É a div. 123 com número — e o CN que o prova está no anexo A §6 |
| **129** | **T** | **Nenhum dos cinco gates IMPEDE coisa alguma.** `gate:a20`, `gate:icones`, G1, G2/G3 e G7 rodam quando o executor os roda, e o relatório diz que rodaram; o `ci.yml` roda lint, dois `tsc` e a suíte, o `native.yml` roda type-check e o APK, e nenhum dos dois os chama. **A disciplina do projeto é real e está medida em todas as PRs — e é exatamente por isso que a distinção importa: "o gate mede" não é "o gate IMPEDE".** Nada barra a entrada na `main` de um commit que os reprove; o que barra é alguém ter rodado e lido. Não é pendência de conveniência nem dívida de arrumação: é uma propriedade do sistema de gates que ninguém tinha escrito. (Marcel, aval da W2, 2026-09-15.) É o argumento forte da H2 — maior do que o "um só runner" que o W1 listou |
| **130** | **T** | **O `gate:a20` tem escopo menor do que o ACEITE A20 que ele representa.** O A20 diz "nenhum literal de UI em inglês"; o que chega à tela do músico na div. 125 é texto de UI em inglês que **não é literal** — é valor de tempo de execução. **Nenhum escopo o alcança**, nem o conserto da div. 123. É o padrão do `LOGS-OCTAVIA.md` num lugar novo: o instrumento medindo menos do que o critério que ele carimba |
| **131** | **A** | **A mensagem crua é uma FAMÍLIA com duas classes, não uma frase.** Classe 1: o ramo 3 do `falha()` (`${name}: ${bruta}`), que higieniza URL e não traduz. Classe 2: o ramo de **promoção** do `ensureFileUma` (`alvoDir.create`, `destino.delete`, `atual.file.moveSync`), **fora de qualquer `try`** — sobe cru, sem nem o prefixo do nome, até o palco e até o `App.tsx:222`. Consertar só a frase medida pelo W1 deixa a segunda de pé |
| **132** | **T** | **O `T₁` não começou a ser medido — e a leitura errada é do Marcel, por atribuição dele** (aval da W2, 2026-09-15): *"escrevi no aval da W1 que o `total=` e o `ms=` 'já dão as primeiras taxas'. Não dão."* As 12 linhas com `total=`/`ms=` do W1 são **todas** de fixtures do mock em `localhost:8788`, várias com a taxa encenada pelo próprio servidor de teste. Para escolher `T₁`, `n` continua **0** de rede real. **É a terceira leitura desse tipo no projeto, e o trio é 80 · 111 · 132** — a div. 80 (*"9m16s é o regime"*, um run lido como propriedade estável do gate) e a div. 111 (o `bytes` do `files-index.json` lido como oráculo, sem ver que ele é escrito a partir do disco pelo `touch()`). **As três têm a mesma forma: um número EXISTIR foi lido como o número SERVIR** — e as três são leituras do Marcel, por atribuição dele. *A div. 126 NÃO pertence a este trio, e a correção é dele (aval final da W2): lá o número **não existia** — o `onProgress` entrega tudo em rajada no fim —, e o defeito foi o duplo de teste ser mais capaz que a biblioteca. É outra forma, e continua sendo o 15º caso do padrão, pelo avesso.* A consequência que a W2 registra e não conserta: **a opção C continuará sem população até alguém baixar de uma rede de verdade**, e isso não acontece por uma PR existir |
| **133** | **P** | **`apps/native/vitest.config.mts` não existe.** A §2 do prompt o listou para leitura; o projeto `native` vive no `vitest.config.mts` da raiz, num terceiro `projects[]`. Sem consequência além da leitura — registrado porque toda premissa do prompt é hipótese |
| **134** | **T** | **O `NUCLEO` do G1a é lista literal; a metade do core do mesmo gate é derivada.** Um módulo novo em `apps/native/src` nasce fora da invariância e nada avisa; um arquivo novo em `packages/core/src` entra sozinho, porque aquele ramo usa `git ls-tree`. O mesmo script, duas políticas de escopo — e só uma delas envelhece mal. **E é a CAUSA, não o sintoma** (Marcel, aval da W2): *"metade do gate acompanha arquivo novo, metade não"* — a div. 123 é o que essa metade produziu uma vez; sem o mecanismo, ela produz de novo. Por isso as duas entram no mesmo commit 1 |

**Contagem por origem**: **T** 5 (128, 129, 130, 132, 134) · **A** 1 (131) · **P** 1 (133).
**A leitura**: **cinco das sete são sobre instrumento**, e nenhuma é regressão do W1 — o
mesmo desequilíbrio que o W1 registrou ("duas são sobre instrumento — as duas que mais
custaram"), agora em maioria. Um bloco cujo objeto é gate produz divergência de gate, e
isso é sinal de que o recorte está no lugar certo. O padrão do `LOGS-OCTAVIA.md` ganha **dois
casos** — o **16** (o G3 lendo `src` e sendo lido como "o catálogo está protegido", div. 128)
e o **17** (o `gate:a20` lendo literal e sendo lido como "o A20 está cumprido", div. 130).

---

## 8. As perguntas — **as seis decididas** (aval do Marcel, 2026-09-15)

> Este bloco ficou **como foi perguntado**, com a resposta debaixo de cada uma. A §8 não foi
> reescrita depois de respondida: quem ler depois precisa ver o que foi posto na mesa, não
> só o que saiu — foi o que a W1 ensinou quando quatro perguntas que mudavam código passaram
> num aval de duas.

| # | decisão |
|---|---|
| **1** | **os quatro juntos**, com o gate como commit 1 |
| **2** | **frase genérica em pt-BR na tela; nome do arquivo só no log** |
| **3** | **errata E16, sem redesenhar moldura** |
| **4** | **não entra** — os cinco desabilitados vêm juntos |
| **5** | **W3, opção (B)** — não misturar escopo com invólucro |
| **6** | **registrar `n = 0`**, com a atribuição (div. 132) |

**1. O recorte: os quatro itens numa PR só, ou a mensagem sai?**
Os três de tela (109, 118, 125) tocam o mesmo arquivo e se provam no mesmo dump — juntá-los
economiza dois aceites de aparelho. O gate (123) vem antes, como commit 1, pela regra.
→ **Recomendo os quatro juntos**, com o gate como commit 1 e a mensagem como commit 4.
*Se preferir três, o que sai é a mensagem — ela é a única que não precisa do dump.*

> **[decidido] — os quatro juntos.** *"Recorte aceito: quatro itens, uma PR, os três de tela
> no mesmo arquivo e no mesmo dump. A13 obrigatório, e está certo — é a PR do palco e ele
> ficou sem rodar desde o V1."*

**2. O texto do S3e: qual frase, e o nome do arquivo fica?**
Hoje o músico lê `1751910900697-Easy_-_Guitar.pdf: Call to function '…' has been rejected.`
São **duas** decisões: a frase genérica (o catálogo já traduz `download-error` por *"não
consegui baixar"*) e **se o nome do objeto do bucket deve aparecer na tela**.
→ **Recomendo**: frase genérica em pt-BR na tela, nome do arquivo **só no log**. O log
continua diagnosticável; a tela para de falar com o músico em nome de arquivo.

> **[decidido] — frase genérica em pt-BR na tela, nome do arquivo só no log.** E o argumento
> que o Marcel acrescenta, e que vai para a errata porque é ele que decide a questão:
> **o nome do objeto do bucket é detalhe de infraestrutura que o músico não pediu e não pode
> usar — ele não identifica a MÚSICA, identifica o OBJETO. O que serve na tela é o título,
> que a tela já tem.** (O S3e já mostra `${titulo} · ${tipo}${tamanho}` acima da linha de
> erro: o dado certo já está em tela, duas linhas acima do errado.)

**3. A E16 do DESIGN-V1 — errata ou nova moldura?**
Com a Proposta A, as seis molduras do S3 mostram uma barra que o app não desenha mais.
→ **Recomendo errata (E16) sem redesenhar moldura**: o `telas.html` é fonte congelada de
**desenho de ícone** (é o que o `gate:icones` cobra dele), e regravar seis PNGs para mover
três caixas custa mais do que a errata resolve.

> **[decidido] — errata E16, sem redesenhar.** E com o **precedente** que o Marcel nomeia:
> *"o DESIGN-TELA-1 ficou intocado quando o V1 o substituiu. Documento congelado se anota
> por cima, não se reescreve."* A regra passa a ter nome e dois casos.

**4. O `S3e · Baixar` desabilitado (DESIGN-V1 §8.2) entra?**
A W2 está com o S3e aberto na mesa. A §8.2 lista `S1c · Baixar esta setlist` como "o mais
forte dos cinco" e o `S3e · Baixar` como "mesma decisão, mesma causa, uma tela adiante".
→ **Recomendo NÃO**: decidir o S3e sozinho decide metade de um par por acidente de agenda,
e o S1c está noutra tela, que a W2 não abre. Os cinco desabilitados merecem uma decisão só.

> **[decidido] — não entra.** *"Decidir o S3e sozinho decide metade de um par por acidente
> de agenda. Os cinco desabilitados são uma decisão do Marcel e vêm juntos, quando ele olhar
> para eles."* A §8.2 do DESIGN-V1 continua inteira e sem decisão — e agora com o motivo
> escrito de por que a W2 não a beliscou.

**5. A conversão dos gates em teste: W3, ou nunca?**
→ **Recomendo W3, opção (B)** — embrulhar, não reescrever. Ganha o CI (div. 129), não perde
escopo, não perde CN, custa 147 ms. O único ganho que ela **não** dá é cobertura, e o item 5
da §10 do W1 a prometia; fica registrado que essa metade não vem com (B).

> **[decidido] — W3, opção (B)**, com a razão aceita: não misturar escopo com invólucro. E o
> achado vai registrado nos termos da div. 129 — **o gate mede, o gate não impede** —, não
> como pendência de conveniência.

**6. O `T₁` — aceitar que a medição não começou?**
A dívida 1 do W1 diz que a PR "começou a medir". As doze amostras são de mock.
→ **Recomendo registrar `n = 0`** e tirar a opção C da lista de "quase lá". Ela volta quando
houver download real medido — e o lugar natural disso é o uso, não uma sessão.

> **[decidido] — `n = 0`, com atribuição.** Ver a div. 132: a leitura errada é do Marcel, por
> atribuição dele, e a consequência fica escrita — **a opção C continuará sem população até
> alguém baixar de uma rede de verdade**.

---

## 9. Contabilidade

| | |
|---|---|
| requests a `/api/*` em prod | **0** (teto 4, alvo 0) — **alvo cumprido** |
| downloads de bucket | **0** (teto 0) |
| logins · escrita pela API | 0 · 0 |
| **comandos ao Tab S6** | **0** — e por construção: `adb` não está no PATH desta sessão e **não foi invocado uma vez** |
| comandos a qualquer aparelho | **0** |
| commits · branches · pushes | **0 · 0 · 0** |
| mutação do repositório | nenhuma; o único não-rastreado é este pre-check e seus anexos |
| rede | só `gh` (api.github.com), para ler durações de CI |

**Emulador, antes × depois**: o AVD `octavia_tab32` **já estava de pé** ao início da sessão
(pid 31893, sobra da sessão do W1), e está **exatamente igual** ao fim — nada enviado, nada
morto, nenhum `emu kill`. Ninguém escuta a 8081 (conferido antes de qualquer coisa, pela
div. 75; não havia o que matar). **O store não foi lido** — ler exige `adb shell` —, então a
baseline do fim do W1 está intacta por construção, e os cinco sha256 **não** foram
reconferidos nesta sessão: quem os reconfere é o aceite da W2.

**Scratch sem `.env*`**: o worktree tem só `.env.example`, que é rastreado e não tem segredo.
