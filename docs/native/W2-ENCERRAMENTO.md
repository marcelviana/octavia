# W2 — ENCERRAMENTO

> **ESCRITO FORA DE ORDEM, E DECLARADO.** Este encerramento foi escrito **depois do
> merge do bloco** — a PR #303 entrou na `main` em 2026-09-15 (`cbff070`) **sem ele**,
> diferente do V1 e da W1, que o tiveram dentro da própria PR. A W3 começou por cima,
> e durante um dia o registro do bloco existiu só em memória de sessão, que é
> exatamente o que a regra permanente do `CLAUDE.md` (*o `*-ENCERRAMENTO.md`
> commitado é a fonte do bloco*) existe para impedir.
>
> Ele entra na **PR da W3 (#305)**, por decisão do Marcel (2026-09-16): a sessão da
> W2 tinha envelhecido, a W3 precisava do contexto dela de qualquer jeito, e há
> achados que **atravessam os dois blocos** — escritos juntos, a linhagem fica
> visível (§8). *Registro fora de ordem se declara, não se disfarça.*
>
> **Fontes**: os anexos commitados (`W2-anexos/`), o `W2-PRECHECK.md` e as mensagens
> dos seis commits da #303. Cada número abaixo aponta para uma delas. A memória de
> sessão da W2 foi lida como **rastro** e não é citada como fonte.

**O bloco.** Uma PR (#303, `w2/gate-barra-mensagem`), seis commits: o gate primeiro,
depois três de tela, as erratas, e um extra de segurança declarado no aval.

---

## 1. O par de colunas do G3

**A abertura que o aval do pre-check mandou.** A linha `log('login-screen')` do
`App.tsx` é a que **prova o A5**. Apagada, com o G3 como estava antes do bloco:

```
$ sed -i '' 117d apps/native/App.tsx
$ sh apps/native/scripts/g2g3.sh origin/main WORKTREE
  G3 — linhas log( antes=54  depois=54
    G3: nenhuma linha sumiu ✓
  exit=0
```

**Uma linha do catálogo sumiu, e o gate que existe para impedir isso respondeu
"nenhuma linha sumiu ✓".** A mesma árvore, a mesma linha apagada, com o escopo
consertado:

```
  G3 — linhas log( antes=57  depois=56
    linhas que SUMIRAM (cada uma tem de ser errata declarada):
        apps/native/App.tsx	log('login-screen')
    G3: linha sumiu SEM ERRATA ✗
  exit=1
```

| | escopo de antes (`apps/native/src`) | escopo da W2 (`apps/native` inteiro) |
|---|---|---|
| população do G3 | **54** | **57** |
| `login-screen` apagada | **54 = 54 · "nenhuma linha sumiu ✓" · exit 0** | **57 → 56 · a linha em SUMIRAM · exit 1** |

O `App.tsx` mora um nível acima de `src/`, e dentro dele vivem **três** linhas do
catálogo: `login-screen` (A5), `auth uid=… src=…` (A1, A5) e `download-error` (A13,
W1-A4). É a **div. 128**, e é a div. 123 com número. Bruto:
`W2-anexos/W2-A-gates-e-controles-negativos.txt` §1.

---

## 2. O que a PR fez

| commit | o quê | div. |
|---|---|---|
| `7630c4e` | **o escopo dos gates, e o mecanismo que o produziu** — G3 e `gate:a20` passam a ler `apps/native` inteiro; o `NUCLEO` do G1a deixa de ser lista literal e passa a ser **derivado** da união BASE∪HEAD | 123, 128, 134 |
| `c550c42` | o controle inerte sai inerte na árvore de acessibilidade — `accessibilityState`, **não** `disabled` (que mataria o motivo ao toque do A15) | 118 |
| `576b4ed` | a barra do palco em dois grupos — **Proposta A**, um `<View style={{ flex: 1 }} />`, sem número cravado | 109 |
| `3ea2247` | a frase que o músico lê, e o detalhe que o log guarda — conjunto FECHADO de frases pt-BR na tela, nome do objeto só no log | 125, 131 |
| `336727e` | a E16 do DESIGN-V1, o PRD que voltaria a mentir, a fronteira em três lugares | 135 |
| `f498f6c` | **extra declarado, de segurança**: o host nu some do log — e o dump deixa de ser fonte de texto de tela | 137, 139 |

**A barra, medida** (`W2-C` §1, seis variantes do S3 × dois temas): margens 24,0 dp
dos dois lados, vão entre os grupos **548,0 dp** contra 547,8 previstos, o grupo da
direita em 884,0 · 965,8 · 1048,0 dp, e em retrato também (`W2-C` §7 — não há número
cravado). Os sete medem 65,8–66,2 dp, iguais aos de antes (`W2-A` §5): mover caixa
não mudou caixa.

**Os aceites** (`W2-B`): **A13** 12/12 páginas do cache em avião, `src=disk` — fecha
a dívida 5 do W1; **A15** metade do inerte (enabled=false **e** o motivo ao toque, no
mesmo dump), a metade de TEMPO não concluída no emulador (div. 37); **W2-A1…A5** —
os sete em dois grupos, três inertes, o motivo depois do inerte, nenhuma frase em
inglês no `download-erro` com erro provocado, e os dois CN de gate do commit 1
reprovando sobre `f58259e`.

---

## 3. Divergências — 128 a 139

| # | origem | o quê | onde |
|---|---|---|---|
| 128 | T | o G3 comparava 54 linhas e a população certa é 57 (§1) | pre-check §7 |
| 129 | T | **nenhum dos cinco gates IMPEDE** — "o gate mede não é o gate impede" | pre-check §7 |
| 130 | T | o `gate:a20` tem escopo menor que o aceite A20: a mensagem crua não é literal | pre-check §7 |
| 131 | A | a mensagem crua é uma FAMÍLIA com duas classes (a promoção fora de `try`) | pre-check §7 |
| 132 | T | o `T₁` não começou a ser medido — `n = 0` de rede real (atribuída ao Marcel) | pre-check §7 |
| 133 | P | `apps/native/vitest.config.mts` não existe | pre-check §7 |
| 134 | T | metade do G1a derivada, metade lista literal — **a causa**, não o sintoma | pre-check §7 |
| 135 | P | a lista de exceções do G1a do pre-check omitia o `files.ts` (atribuída ao Marcel) | commit `336727e` |
| 136 | T | o coletor do G2 conta `testID` escrito em comentário | `W2-A` §6 |
| 137 | A | a higienização não pega **host nu** entre aspas — o host do Supabase na tela e no log | `W2-D` §1, `f498f6c` |
| 138 | T | o `lc()` do protocolo trunca na quebra de linha | commit `336727e` |
| 139 | T | o `uiautomator dump` devolve `text=""` no `<Text>` multilinha | `W2-D` §3 |

**Contagem**: **T** 8 (128, 129, 130, 132, 134, 136, 138, 139) · **A** 2 (131, 137) ·
**P** 2 (133, 135). Um bloco cujo objeto é gate produz divergência de gate.

---

## 4. O empilhamento — 130 · 138 · 139

**A primeira vez no projeto em que três instrumentos independentes falharam sobre a
MESMA cadeia**, a mensagem crua em inglês que chegava à tela do músico (div. 125),
cada um por um motivo diferente:

| instrumento | por que não a viu | div. |
|---|---|---|
| `gate:a20` | **natureza** — acusa literal, e ela é valor de tempo de execução | 130 |
| `lc()` do protocolo | **truncamento** — para na quebra de linha | 138 |
| `uiautomator dump` | **renderização** — `text=""` no `<Text>` multilinha | 139 |

> **Três instrumentos concordando não são três medições — podem ser três silêncios.**

O que rompeu o empilhamento não foi um quarto instrumento melhor: foi **mudar de
gênero** — a captura de tela e o logcat lido inteiro. E quem passa a impedir a
cadeia é o teste de unidade sobre `falha()`, que afirma um conjunto fechado e não
depende de ler tela nem log. Registrado no `LOGS-OCTAVIA.md` **acima** dos casos
individuais (commit `f498f6c`).

---

## 5. As duas regras que o bloco deixou

**Regra 0 — O DUMP NÃO É FONTE DE TEXTO DE TELA.** *(Redação do Marcel, mais forte
que a proposta.)* O `uiautomator dump` devolve `text=""` onde há texto; um aceite que
varre inglês por dump passa por cima da frase que existe para pegar. O dump serve
para geometria, `enabled`, `resource-id` e `content-desc`. Prova: div. 139.

**ESCOPO SE CONTA DEPOIS DE ESCREVER O CÓDIGO, NÃO ANTES.** Lista de exceções
declarada por antecipação é palpite. Origem: div. 135, **atribuída ao Marcel por ele
mesmo** — a lista do pre-check omitia o `files.ts`, que o commit 4 muda.

---

## 6. A distinção que não pode se confundir — 108 ≠ 123

| div. | o que é | a W2 |
|---|---|---|
| **123** | um arquivo de produção **invisível** para todo gate, por o gate varrer `src/` e ele morar acima | **fecha** |
| **108** | um arquivo **dentro** do escopo, que é **exceção declarada** porque a PR o muda de propósito | **não fecha, e não pode** — quem afirma que o `StageScreen.tsx` não mudou de comportamento é o aceite no aparelho, não um diff |

A primeira é buraco de instrumento; a segunda é limite de método. (`W2-A` §6.)

---

## 7. As seis decisões do aval do pre-check

| # | decisão |
|---|---|
| 1 | os quatro itens juntos, com o gate como commit 1 |
| 2 | frase genérica em pt-BR na tela; nome do arquivo só no log — o nome do objeto do bucket não identifica a MÚSICA, identifica o OBJETO |
| 3 | errata E16, sem redesenhar moldura — *documento congelado se anota por cima* |
| 4 | o `S3e · Baixar` não entra — os cinco desabilitados vêm juntos |
| 5 | a conversão dos gates em teste é da **W3, opção (B)** — não misturar escopo com invólucro |
| 6 | registrar `n = 0` para o `T₁`, com a atribuição (div. 132) |

Por extenso em `W2-PRECHECK.md` §8.

---

## 8. A linhagem com a W3

É o que justifica escrever os dois encerramentos juntos. Quatro fios saem da W2 e
terminam, ou mudam de forma, na W3:

**136 → 140 — de falso positivo inerte a reprovação falsa.** A W2 viu uma menção em
comentário contada como `testID` NOVO, julgou "veredito intacto" e contornou
reescrevendo a documentação. Estava certa **na direção em que olhou**. A W3 olhou a
outra: com a menção na BASE, editar o comentário faz o G2 reprovar sem código mudar
(div. 140). E o conserto trouxe um terceiro fio junto: a W3 estendeu o filtro ao G3,
desfazendo sem saber a **div. 83** (V1-PR6), cuja razão o `V1-ENCERRAMENTO` dizia
estar no `g2g3.sh` e nunca esteve (**div. 142**). Revertido antes do merge. Daí a
**regra 5**, com três ocorrências: 83, 136, 140.

**137 — metade aqui, metade lá.** O commit `f498f6c` higienizou o host nu **só no
`falha()` do `files.ts`**. O `mensagemDe()` do `prefetch.ts` — a rede para o que
nunca passa pelo `falha()` — ficou com a higienização antiga **de propósito**: o
`prefetch.ts` estava dentro da cobertura do G1a da W2, e tocá-lo alargaria o escopo
que o commit 1 acabara de fechar. O próprio commit escreveu o que não cobria. **A W3
fechou**, com o `prefetch.ts` como exceção declarada e justificada no `g1.sh`.

**129 → os gates passam a impedir.** A W2 nomeou a propriedade (*"o gate mede, o gate
não impede"*) e decidiu o invólucro (decisão 5). A W3 o executou: `gate:a20` e
`gate:icones` num teste, G1 e G2/G3 num job, e o vermelho **visto no CI**.

**134 → 141 — o mecanismo e o seu avesso.** A W2 tornou o escopo do G1a **derivado**,
para que arquivo novo não nascesse fora da invariância; o que sobrou escrito à mão
foi só a lista de exceções. Posto o gate para impedir no CI, a W3 achou o avesso
disso: a lista é estado de uma PR num arquivo que sobrevive à PR, e apodrece em
silêncio (div. 141).

**E o empilhamento precede o 19º caso.** O 130·138·139 foi o primeiro registro de
instrumentos que calam **juntos**. O 19º caso do padrão (div. 140) é o avesso: um
instrumento que fala **demais**. Os dois dizem a mesma coisa sobre concordância —
nem três silêncios nem um grito são, sozinhos, uma medição.

---

## 9. O que ficou para depois

**Herdado pela W3, e fechado por ela**: a div. 129 e a conversão em teste (opção B);
a div. 136; a metade do `prefetch.ts` da div. 137.

**Herdado pela W3, e não fechado**: o **G8** (gate de dump, pre-check §3); a div.
130 como propriedade do instrumento (quem cobre é o teste).

**Fora, como decidido**: a opção C / `T₁` (`n = 0`), a div. 121, o `cor.offline`, o
tema claro nas listas, a §8 inteira do DESIGN-V1 (decisão 4), a div. 119, a metade de
TEMPO do A15 (div. 37), o build de release.

---

## 10. Contabilidade

Do `W2-E`: prod **0** requests (teto 4, alvo 0), bucket **0**, logins 0, Tab S6
**0 comandos**. Zero de prod em três camadas independentes: avião conferido pelo
`ping`, `EXPO_PUBLIC_API_BASE_URL` inline apontando para porta sem ninguém, e
`sync skip reason=offline` em toda abertura. AVD `octavia_tab32` encontrado de pé
(pid 31893) e deixado de pé, mesmo pid; `reverse --remove-all` antes de matar o
Metro. Declarado: o valor anterior de `accelerometer_rotation` não foi lido antes de
ser mudado.

**CI.** O `W2-E` foi escrito antes do push e cita a faixa herdada, `n = 14`. A
corrida da própria #303 (run 35015930984, `pull_request`) deu **12m37s** e foi
incorporada pela W3:

```
n=15  piso 9m16s  teto 14m11s  mediana 11m53s  corte v3 (n=12) + v4 (n=3)
```

Com `n` ímpar a mediana é o 8º valor. (`W3-anexos/W3-D` §2.)
