# N3 — ENCERRAMENTO

**A fonte do bloco — e um índice, não uma segunda cópia.** Tudo o que este
arquivo afirma aponta para o documento, a PR ou o anexo onde está; onde a
prosa daqui e a fonte divergirem, vale a fonte. Nenhum texto de decisão ou de
errata é reescrito aqui.

- **Bloco**: N3 — **faixas de largura** do app nativo (N3-D6): a composição
  deixa de depender da orientação e passa a depender da largura útil da janela,
  em três faixas congeladas em dp — **C > 960** (o congelado V1/N2, intacto),
  **B 700–960** (tablet em pé, implementada), **A < 700** (celular em pé,
  desenhada, implementação no N5).
- **Janela**: 2026-09-23 (pre-check, Fase A) → 2026-09-26 (N3-PR6c, #333,
  merge `53bf0d5` às 12:13:14Z).
- **Esta PR**: só docs, sobre `origin/main` = `53bf0d5`, árvore
  `../octavia-n3-fim`, branch `n3/encerramento`. Nenhuma request a prod, nenhum
  `adb`; `pnpm install --frozen-lockfile --offline`, sem `.env`.
- **Convenção**: `[medido]` = comando + saída literal, nesta sessão; `[lido]` =
  tirado do documento citado, sem medir de novo.
- **Divergências desta PR**: **467 a 476** (§12).

> **"QUANDO NÃO CABE, A COMPOSIÇÃO EMPILHA; O CONTEÚDO NÃO SAI."**
> — a regra única da folha (`DESIGN-N3/README.md` §1). O bloco a quebrou duas
> vezes onde a folha dizia *"passa"* (N3-E18, N3-E20), e as duas vezes foi o
> aceite, não o desenho, que achou.

---

## 1. O que o N3 entregou

**Para o músico**: **o tablet em pé funciona**, tela a tela — S1, S2 com e sem
edição, reordenar, folha, diálogo, picker, palco, S4, S0 e S5 —, sem título que
some, botão cortado na borda ou texto espremido até "s…"; e **o tablet deitado
é exatamente o de antes** (G-inv 34/34 e 18/18 em toda PR de implementação). O
celular abre sem crash, com a lista do que ainda não alcança (§10.1).

**As 10 PRs** `[medido: gh pr view <n> --json commits,mergeCommit,mergedAt]`, em
ordem de número (que é também a de merge):

| PR | merge | commits | o que entrou | onde está registrado | divs. |
|---|---|---|---|---|---|
| **#324** | `8e38e56` | 3 | **pre-check**: Fase A estática, B1–B6 no AVD, no Tab e no `octavia_phone` (criado ali), 105 dumps de retrato contra a paisagem pelo `inventario.mjs`; H-N3-7 ("se encavalam") medida falsa na forma; **N3-D0…D11** | `N3-PRECHECK.md`, `N3-PRECHECK-anexos/` | 382–392 |
| **#325** | `d25e00d` | 2 | **desenho congelado** (27 molduras, `SHA256SUMS`) e **requisitos** no lugar de PRD (T3-R1…R7, A-N3-1…7); **N3-D12…D25**; erratas **N3-E1, N3-E2**; E18 no `DESIGN-V1`, N2-E24 no `DESIGN-N2` | `DESIGN-N3/README.md` §1–§9; `N3-REQUISITOS.md` | 393–400 |
| **#326** | `3a9b24f` | 4 | **PR-1, o gate**: `faixa.ts` (um ponto só), a linha `faixa=`, **G-inv** e **G-N3**, `DESIGN-N3` no `shasum -c` do CI, a **régua de dev** (N3-D26), as doze medidas da folha → **N3-E3…E12** | `N3-PR1-anexos/`; `N3-REQUISITOS.md` §5 | 401–411 |
| **#327** | `58d2296` | 4 | **PR-2, S1 em B**; **N3-D27** (base do palco = mock), **N3-D28** (tokens por faixa); a linha de aviso cresce (N3-D19) | `N3-PR2-anexos/`; `N3-REQUISITOS.md` §6 | 412–417 |
| **#328** | `c1d845f` | 4 | **PR-3, S2 em B**: coluna única, rótulos curtos com nome acessível longo; **N3-D29** (o G-N3 separa nome-acessível e rolagem); **N3-E13, N3-E14**; errata do T3-R3 (A = lista, não reprovação) | `N3-PR3-anexos/`; `N3-REQUISITOS.md` §7 | 418–424 |
| **#329** | `59269a0` | 4 | **PR-4, reordenar, folha e diálogo em B**; **N3-E15**; a div. 432 (flake de janela do mock) classificada | `N3-PR4-anexos/`; `N3-REQUISITOS.md` §8 | 425–432 |
| **#330** | `0a71da8` | 4 | **PR-5, a barra superior do palco em B** (88 em duas linhas) e as **provas de "passa"** (picker, S0, S4, S5: 12 de 12 `bounds` do pre-check); **N3-E16**; duplo do `react-native-pdf` | `N3-PR5-anexos/`; `N3-REQUISITOS.md` §9 | 433–444 |
| **#331** | `73b45ea` | 6 | **PR-6, aceite completo em B**: G-N3 consolidado (102 pares), G5/G6 em quatro colunas (55 estados), J3 em retrato, a lista final do celular; **N3-E17** (barra da S5) e **N3-E18** (o picker com falha, consertado na PR) | `N3-PR6-anexos/`; `N3-REQUISITOS.md` §10 | 445–456 |
| **#332** | `66c0cef` | 1 | **PR-6b, as sete molduras do V1** que faltavam, em retrato (28 de 28 células); **N3-E19**; a S5 com 60 músicas revela a div. 461 — só aceite, nenhuma linha de código | `N3-PR6b-anexos/`; `N3-REQUISITOS.md` §11 | 457–461 |
| **#333** | `53bf0d5` | 4 | **PR-6c**: o **(b) corte** volta ao G-N3; a fileira de marcas da S5 é token de faixa (C 900 · B 663) → **N3-E20**, div. 461 fechada | `N3-PR6c-anexos/`; `N3-REQUISITOS.md` §12 | 462–466 |

---

## 2. Decisões N3-D0…D29

O texto de cada decisão vive **só** no documento da última coluna. A segunda
coluna é um rótulo para achar a linha, não a decisão.

| # | rótulo | onde o texto vive |
|---|---|---|
| N3-D0 | haverá celular; o N3 implementa as duas faixas de tablet; o celular é o N5, depois do N4 | `N3-PRECHECK.md` §0.1 |
| N3-D1 | a unidade é a faixa de largura, congelada em dp (errata: N3-D8) | `N3-PRECHECK.md` §0.1 |
| N3-D2 | o palco entra pelo pre-check; não se trava orientação (errata: N3-D9) | `N3-PRECHECK.md` §0.1 |
| N3-D3 | invariante: a faixa de cima não muda — vira gate | `N3-PRECHECK.md` §0.1 |
| N3-D4 | G5/G6 em quatro colunas | `N3-PRECHECK.md` §0.1 |
| N3-D5 | Claude Design; nada de Android na composição | `N3-PRECHECK.md` §0.1 |
| N3-D6 | nome: N3 faixas; content = N4; celular = N5; web depois do N3 | `N3-PRECHECK.md` §0.1 |
| N3-D7 | o palco existe no celular | `N3-PRECHECK.md` §0.1 |
| N3-D8 | faixas < 600 · 600–960 · > 960; canvas 711,1 × 1053,8; regra de altura ao N5 | `N3-PRECHECK.md` §0.2 |
| N3-D9 | defeito = novo contra a paisagem; palco só pela barra superior em B | `N3-PRECHECK.md` §0.2 |
| N3-D10 | Q3/Q4/Q6/Q7 como recomendado: (e) duro, (d′) triagem; S0 do Tab adiado | `N3-PRECHECK.md` §0.2 |
| N3-D11 | div. 385 (content é N4) e div. 383 (snapshot do AVD) | `N3-PRECHECK.md` §0.2 |
| N3-D12 | limite A \| B em 700 (errata da N3-D8) | `DESIGN-N3/README.md` §2 |
| N3-D13 | palco em B: barra de 88 em duas linhas | `DESIGN-N3/README.md` §2 |
| N3-D14 | palco em A: navegação na barra de cima (144), leitura embaixo | `DESIGN-N3/README.md` §2 |
| N3-D15 | o corpo do palco não quebra linha; quebra na letra é bloco próprio, pré-requisito do N5 | `DESIGN-N3/README.md` §2 |
| N3-D16 | faixa de edição em A: duas linhas de 48 | `DESIGN-N3/README.md` §2 |
| N3-D17 | `Adicionar`/`Apagar` curtos são frases existentes; nome acessível longo | `DESIGN-N3/README.md` §2 |
| N3-D18 | display de S5 em A: 32 dp, .2em, uma linha | `DESIGN-N3/README.md` §2 |
| N3-D19 | a linha de aviso cresce e nunca elide, em toda faixa | `DESIGN-N3/README.md` §2 |
| N3-D20 | folha em A: cartão no topo, acima do teclado | `DESIGN-N3/README.md` §2 |
| N3-D21 | o chip de S1 empilhado não é frase nova | `DESIGN-N3/README.md` §2 |
| N3-D22 | diálogo em A: botões empilhados, `Manter` em cima | `DESIGN-N3/README.md` §2 |
| N3-D23 | dumps de B e A; > 4 dp contra a folha é errata; as `[estimado]` primeiro | `DESIGN-N3/README.md` §2 |
| N3-D24 | tudo decide pela faixa; a regra de componente é herança do iOS | `DESIGN-N3/README.md` §2 |
| N3-D25 | P1 → aparato; P2 → PR-1; P3 → fora | `DESIGN-N3/README.md` §2 |
| N3-D26 | a régua de desenvolvimento (N3-PR1) | cabeçalho de `apps/native/src/screens/ReguaDeDev.tsx`; `DESIGN-N3/README.md` §9 (nota após N3-D28) |
| N3-D27 | a base do G-inv para o palco é a `B3-referencia-paisagem/` (mock) | `DESIGN-N3/README.md` §9 |
| N3-D28 | P2 adotada: tokens por faixa no `theme.ts`, nenhuma aritmética de largura em tela | `DESIGN-N3/README.md` §9 |
| N3-D29 | o G-N3 separa (e), nome-acessível e rolagem, com contagem própria | `DESIGN-N3/README.md` §9 |

---

## 3. Erratas do congelado, N3-E1…E20

Todas em `DESIGN-N3/README.md` §9, na seção da PR que as abriu. A última coluna
classifica o efeito como no N2: **comportamento** (o app passou a fazer outra
coisa), **medida** (a régua ou o dump mediu e a conta da folha mudou, o desenho
não), **leitura** (qual das duas coisas vale).

| # | PR | o quê | div. | efeito |
|---|---|---|---|---|
| E1 | desenho | o limite A \| B é 700, não 600 | 393 | leitura |
| E2 | desenho | `Nova setlist` = 152,0, não 190 | 394 | medida |
| E3 | 1 | `FIM DA SETLIST` em 32 = 338,7 | 408 | medida |
| E4 | 1 | `Apagar` (faixa) = 119,6; a faixa de B cabe em uma linha | — | medida |
| E5 | 1 | motivo `nada mudou…` = 237,8 (15 dp no app, não 13) | 409 | medida |
| E6 | 1 | chip empilhado = 192,4 | — | medida |
| E7 | 1 | chip em uma linha (A) = 281,8 | — | medida |
| E8 | 1 | frase de aviso de S1 = 747,6: duas linhas em B, três em A | — | medida |
| E9 | 1 | título do reordenar = 605,8 (26 dp .22em); em A não cabe numa linha | 409 | medida |
| E10 | 1 | régua do picker = 424,0 | — | medida |
| E11 | 1 | marca `já na setlist · 2×` = 120,9 | — | medida |
| E12 | 1 | `FIM DA SETLIST` em 52 = 550,2 (o rastreamento conta) | 395 | medida |
| E13 | 3 | tipo 84 (como em C), título 398,2 | 421 | leitura + medida |
| E14 | 3 | aviso do teto de 100 em B: uma linha, 48 | — | medida |
| E15 | 4 | folha de validação em B: 424,4 (uma validação alcançável, não duas) | 430 | medida |
| E16 | 5 | base do palco: controles de 66, não 64 (312 · 229,8 · 121,3) | 435 | medida |
| **E17** | 6 | a barra da S5 em B usa o token do palco (88): **salto 0** ao chegar ao fim | 442 | **comportamento** |
| **E18** | 6 | o picker em B com falha ou limite: **dois andares, 138,7** | 445 | **comportamento** |
| E19 | 6b | o `8 DE 8` centrado nos 88 fica 16 dp abaixo da linha 1 do palco: **sem alinhamento no N3** | 447 | leitura |
| **E20** | 6c | a fileira de marcas da S5 em B é token de faixa: **663** | 461 | **comportamento** |

**Mudaram comportamento três**: E17, E18 e E20 — as três só na faixa B, e as três
com a invariante C provada depois (G-inv 34/34 e 18/18 no build de cada conserto).
As outras dezessete **só mediram**: a régua, o dump ou a leitura de outro
documento corrigiram uma conta da folha, e **nenhuma tirou folga abaixo de zero
em B** (`DESIGN-N3/README.md` §9, "Erratas da N3-PR1").

**As duas que a folha não podia saber.** A folha foi desenhada sobre as capturas do
pre-check, e as capturas eram **um estado por superfície**:

- **E18 — "passa" sem estados.** *"Picker, B: passa"* valia para o estado base, o
  único capturado. Na falha e no limite, a fileira de 80 junta título, marca e o
  bloco de estado (até 520 dp), o título vai a largura zero e o `Tentar de novo`
  sai pela borda. A H-N3-4 do pre-check já dizia *"o picker em falha (682 dp) cabe
  em 711"* — derivada, nunca medida.
- **E20 — os 900 fixos.** *"S5, B: passa"* valia com as 8 músicas da fixture. A
  fileira de marcas calcula contra `FILEIRA = 900` (§7.1 do DESIGN-V1), e com
  N ≥ 19 passa da janela de 711,1. Era a H-N3-3, também derivada e nunca medida.

Nas duas, o desenho estava certo **para o estado que o designer viu**; o que
faltou foi o estado. É a regra 17 (§5).

---

## 4. Divergências 382–466

### 4.1 A contagem

**Números atribuídos: 85** de 85 (`382…466`), nenhum vago. Todos os registros do
bloco têm a coluna de origem (a div. 341 do N2, fechada no W4-b1, pagou aqui):
**P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou
defeito do produto · **T** toolchain/aparato · **X** terceiros
(`N1-ENCERRAMENTO.md` §7). `[medido]`:

```
$ grep -rnoE '^\| \*\*(3[89][0-9]|4[0-6][0-9])\*\*( \(fechada\)| \(destino\))? \| [A-Z/—-]+ \|' docs \
    | <primeira ocorrência de cada número, coluna 2; 380 e 381 são do W4>
P   33 : 382 384 386 388 391 392 396 397 401 405 406 407 412 413 414 421 422 425 430 431 433
         436 438 447 448 455 456 459 460 462 463 464 466
T   28 : 387 389 398 402 403 410 411 415 418 419 423 427 428 429 434 437 439 440 441 444 446
         449 451 452 453 457 458 465
D   14 : 385 390 393 394 395 399 400 408 409 424 435 442 445 461
A    9 : 383 404 416 417 420 426 443 450 454
T/X  1 : 432
```

| PR | faixa | P | T | D | A | T/X | total |
|---|---|---|---|---|---|---|---|
| pre-check | 382–392 | 6 | 2 | 2 | 1 | | 11 |
| desenho | 393–400 | 2 | 1 | 5 | | | 8 |
| PR-1 | 401–411 | 4 | 4 | 2 | 1 | | 11 |
| PR-2 | 412–417 | 3 | 1 | | 2 | | 6 |
| PR-3 | 418–424 | 2 | 3 | 1 | 1 | | 7 |
| PR-4 | 425–432 | 3 | 3 | | 1 | 1 | 8 |
| PR-5 | 433–444 | 3 | 6 | 2 | 1 | | 12 |
| PR-6 | 445–456 | 4 | 5 | 1 | 2 | | 12 |
| PR-6b | 457–461 | 2 | 2 | 1 | | | 5 |
| PR-6c | 462–466 | 4 | 1 | | | | 5 |
| **N3** | | **33** | **28** | **14** | **9** | **1** | **85** |

O T cresceu contra o N2 (5 de 55 com origem declarada lá; 28 de 85 aqui): o N3 é
o primeiro bloco cujo aceite é **geometria no aparelho**, em três aparelhos e duas
orientações, e cada queda de arnês virou divergência com a rodada verbatim
(`roteiros/` de cada PR). Nenhuma das 28 é do app.

### 4.2 As que mudaram decisão

| div. | virou | onde |
|---|---|---|
| 383 | N3-D11 (o snapshot do AVD regravado) | pre-check §0.2; `APARATO.md` |
| 384 | N3-D10 ((e) duro, (d′) triagem) | pre-check §0.2 |
| 385 | N3-D11 (errata do N2 §10.2: content é N4) | `N2-ENCERRAMENTO.md` §10.2 |
| 386 | N3-D10 (S0 do Tab fica para a PR que mexer no S0) | pre-check §0.2 |
| 388 | N3-D8 (celular deitado é B pela largura; regra de altura ao N5) | pre-check §0.2 |
| 393 | N3-E1 | `DESIGN-N3` §9 |
| 394 | N3-E2 | `DESIGN-N3` §9 |
| 395 | N3-E12 (o 4 dp se compara contra o `bounds` do nó) | `DESIGN-N3` §9 |
| 398 | o `DESIGN-N3` no `shasum -c` do `gates-nativos` | `.github/workflows/gates.yml` |
| 400 | E1 e E2 entram antes da N3-D23 valer | `DESIGN-N3` §9 |
| 401 | N3-D27 | `DESIGN-N3` §9 |
| 406 | N3-D28 | `DESIGN-N3` §9 |
| 409 | a raiz da N3-E5 e da N3-E9 (a régua mede com o token do app) | `DESIGN-N3` §9 |
| 413, 416, 417 | errata do T3-R3: em A, a lista de inalcançáveis é herança, não reprovação | `N3-REQUISITOS.md` T3-R3 |
| 421 | N3-E13 | `DESIGN-N3` §9 |
| 422 | N3-D29 | `DESIGN-N3` §9; `LOGS-OCTAVIA.md` "Errata N3-PR3" |
| 424 | o `medidas.json` carrega o valor das erratas | `DESIGN-N3/medidas.json` |
| 432 | regra 16 (check vermelho classificado); o conserto do mock ao W5 | `APARATO.md`; `N3-REQUISITOS.md` §4 item 9 |
| 435 | N3-E16 | `DESIGN-N3` §9 |
| 442 | N3-E17 | `DESIGN-N3` §9 |
| 445 | N3-E18 | `DESIGN-N3` §9 |
| 446 | um mock por aparelho | `APARATO.md` |
| 447 | N3-E19 | `DESIGN-N3` §9 |
| 450 | destino "polimento do nativo, pós-N3" | `DESIGN-N3` §9 |
| 461 | N3-E20; o (b) de volta ao G-N3 (caso 28) | `DESIGN-N3` §9; `LOGS-OCTAVIA.md` "Errata N3-PR6c" |

### 4.3 Onde o revisor errou

As **33** de origem P — o prompt do revisor presumiu o que não era — e o que cada
uma ensinou.

> #### 397 e a citação de seção sem `grep`
>
> O prompt do desenho mandou marcar *"o item 'retrato'"* no **`W4-ENCERRAMENTO.md`
> §7**. A §7 tem seis itens e nenhum é retrato; o cabeçalho dela diz que não repete
> o que está no N2 §10.2–§10.8. O item vivia só no `N2-ENCERRAMENTO.md` §10.7.1.
> É a **quarta** vez que um handoff cita um encerramento por uma estrutura que ele
> não tem (147, 219 e 337 no N2) — e o remédio do N2 (numeração estável em §10)
> só funciona se quem cita **abre o arquivo antes**. Uma citação de seção se
> confere com um `grep` do número e do título; se não bate, a citação é hipótese.

| div. | o que o prompt presumiu | o que ensinou |
|---|---|---|
| 382 | `origin/main` = "W4 encerrado" | a #323 estava aberta: `git rev-parse` antes da árvore, e parar se não bate |
| 384 | (d) = texto terminando em `…` | o RN elipsa no desenho; o dump traz o texto inteiro → (d′) e (e) |
| 386 | S0 no Tab "com a conta que estiver" | o app não tem botão de sair; logout = a senha do Marcel |
| **388** | **o celular deitado cai em 600–900** | **914,3 dp: pela largura é tablet; o que o separa é a altura (371,4)** → N3-D8, e a regra de altura vai ao N5. Faixa se decide pelo aparelho medido, não pelo nome dele |
| 391 | o APK "skipped" numa PR só de docs | o workflow nem dispara (`paths`); skipped é outro caso |
| 392 | quatro números para cinco itens | a D11 junta dois; nenhum texto reescrito |
| 396 | "duas `[soma]`" | eram três; a terceira é um grupo de alturas |
| **397** | **W4 §7 tem o item "retrato"** | **ver o quadro acima** |
| 401 | a base do palco são os dumps do W4-b3 | eram de prod; não se reproduzem no mock → N3-D27 |
| 405 | a ordem das doze | vale a da folha (N3-D23) |
| 406 | a P2 não aparece no prompt da PR-1 | o requisito a punha lá; decidida na PR-2 (N3-D28) |
| 407 | "o G-N3 reprovando a `main` em retrato" com dump novo | rodado sobre o pre-check: o `diff` de `apps` era vazio |
| **412** | **"os três testIDs (`criar-setlist`, `buscar`, o chip)"** | **o chip de S1 não tem `testID`; a folha manda os ids inalterados** — contar ids no código, não na moldura |
| **413** | **S1 "com aviso de limite"** | **S1 não tem estado de limite** (o 429 da criação é da folha); a matriz de estados se lê no código (div. 448 repete a lição) |
| 414 | "S1 lendo `useFaixa()`" | o hook logava; ler e logar viraram dois hooks |
| **421** | **tipo 104 na linha de B** | **a folha dizia "como em C", e em C o tipo é 84** — quando a folha diz "como em C", C é medido, não a soma dela |
| 422 | o G-N3 dá zero em S2 retrato | (e)=46, todo de desenho → N3-D29 |
| 425 | "a 417 como estava" | a folha de 663 mudou a 417: cortados, mas tocados |
| 430 | folha vazia e validação como dois estados; "duas validações" | é um estado; a UI só alcança uma validação → N3-E15 |
| 431 | "arrastando" por `input swipe` | o swipe solta antes do dump; `input motionevent` |
| 433 | "os testes do palco do V1/N1 passam sem mudança" | nenhum teste de tela montava o palco |
| 436 | `picker-relendo` e S0 do Tab no pre-check | não existiam; o S0 do Tab derruba a sessão do Marcel |
| 438 | S3a–S3e, texto longo, placeholder "no mock" | a fixture não tinha música sem conteúdo; fixture derivada, declarada |
| 447 | "vazia" (N3-E17) | duas leituras; a que não apaga conteúdo → N3-E19 |
| 448 | "os cinco transversais em toda superfície" | nem toda superfície tem os cinco; a matriz lida no código |
| 455 | "todos os pares da `main` atual, um relatório só" | o retrato recapturado; a paisagem vem de várias PRs |
| 456 | lista fechada de 4 commits | +2 (gate e conserto da E18), declarados antes |
| 459 | o par do G-N3 com a paisagem do V1/pre-check | o pre-check não tinha os sete; o V1 era outra conta |
| 460 | a `S2-invalidos` e "9 e 10 sem corpo e sem tipo" | a moldura é o índice sem edição; o `aceite.py` tem três formas de inválido |
| 462 | CN "(b)=48" | 2 por dump: o uiautomator omite o nó inteiro fora da tela |
| 463 | "(b) como o `inventario.mjs`" | lá eram três partes; o "ausente" fica fora |
| 464 | "N = 19 e 18, a fronteira da fórmula" | a fronteira era a da janela (711,1), não a da largura útil (663) |
| 466 | "o `APARATO.md` ganha a lição da 458 se o instrumento mudou" | não mudou |

O que as 33 têm em comum (leitura desta PR, não medição): **22 delas** presumiram um estado, um id ou uma
estrutura que se confere lendo o código ou o documento antes de escrever o prompt
(382, 386, 391, 396, 397, 401, 406, 407, 412, 413, 414, 421, 430, 433, 436, 438,
448, 459, 460, 463, 464, 466). As outras onze são de formulação (duas leituras,
ordem, contagem, instrumento).

---

## 5. Catálogo — o que o N3 acrescentou ao `LOGS-OCTAVIA.md`

**Casos do padrão.** 24–27 são do N2 (§5 do `N2-ENCERRAMENTO.md`) e já estavam
lá. O **28** entrou pela N3-PR6c com o exemplo da S5; **esta PR acrescenta o
segundo exemplo**, o picker de antes da N3-E18 (div. 468):

| # | div. | PR | o instrumento |
|---|---|---|---|
| 28 | 461 (e 445) | N3-PR6b/6c | o **G-N3 calibrado em (e)/(d′) sem o (b)**: a fileira da S5 com 60 (12 marcas fora da janela, nenhum gate as viu) e o picker de antes da E18 (o `Tentar de novo` cortado na borda — o (e) do título pegou o estado, o corte da ação ficou invisível; o (b) dá 6 ali, CN-B4) |

**Regras.** As do N2 eram 9–15; as do N3 entram como **16–21**, na seção nova
*"As regras que o N3 firmou"*:

| # | regra | origem |
|---|---|---|
| 16 | check vermelho no CI: classificar antes de agir — (a) árvore, (b) runner, (c) defeito | 432 (N3-PR4) |
| 17 | **"passa" sem estados não é passa** | E18 (445), E20 (461) |
| 18 | push de docs só depois do APK verde | 381 (W4-b3), numerada aqui (div. 469) |
| 19 | medição por régua antes de implementar o que a folha estimou | N3-D23, N3-D26; E3…E12 |
| 20 | a base do G-inv é mock, não prod | N3-D27 (401) |
| 21 | tokens por faixa; nenhuma aritmética de largura em tela | N3-D28 (406) |

---

## 6. Gates no fim do bloco

Tudo `[medido]` nesta sessão, na árvore `../octavia-n3-fim` = `53bf0d5`, **sobre
os dumps commitados** (nenhum aparelho; o G-inv e o G-N3 leem dump, não código,
`LOGS-OCTAVIA.md` "Errata N3-PR1").

**G-inv** (invariante C, T3-R2) — sobre a passada final da N3-PR6c, a do build do
último conserto:

```
$ sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B5-baseline docs/native/N3-PR6c-anexos/dumps-final
G-inv: 34 de 34 idênticos
G-inv: IDÊNTICO EM DP ✓                                              [exit 0]
$ sh apps/native/scripts/g-inv.sh docs/native/N3-PRECHECK-anexos/B3-referencia-paisagem docs/native/N3-PR6c-anexos/dumps-final
G-inv: 18 de 18 idênticos
G-inv: IDÊNTICO EM DP ✓                                              [exit 0]
```

Em **toda** PR que mudou código (PR-1…PR-6 e PR-6c; a 6b não tem linha de `apps/`)
o G-inv deu 34/34 e 18/18 `[lido: G-inv-*.txt de cada anexo]`, e da PR-2 à PR-5 os
52 dumps de paisagem saíram **byte a byte** iguais aos da PR anterior (`cmp`, 52 de
52).

**G-N3** (T3-R4) — as quatro saídas: (e) e (b) reprovam; nome-acessível e rolagem
se contam à parte (N3-D29); (d′) é triagem e 4 dp é errata candidata. O G-N3 da
`main` (com o (b) da N3-PR6c) sobre os três conjuntos do bloco:

| conjunto | pares | (e) | (b) | nome-acessível | rolagem | (d′) | 4 dp | exit |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| consolidado da N3-PR6 (comando verbatim do `G-N3-consolidado.txt`) | 102 | 0 | **0** | 28 | 18 | 354 | 0 | 0 |
| as sete da N3-PR6b, sem a `S5-n-grande` de antes do conserto | 12 | 0 | 0 | 4 | 4 | 10 | 0 | 0 |
| a S5 da N3-PR6c (N = 60, 19, 18, 8) | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **bloco** | **122** | **0** | **0** | **32** | **22** | 364 | **0** | |
| controle: as sete da N3-PR6b **com** a `S5-n-grande` de antes | 14 | 0 | **4** | 4 | 4 | 10 | 0 | **1** |

A linha de controle é o defeito da div. 461 nos dumps que o registraram: o G-N3
da `main` o reprova, como o CN-B1 da N3-PR6c. **Não há um relatório único do bloco
com o (b)** — o consolidado de 102 pares é de antes dele (div. 475); a soma acima
são três corridas, e as saídas não se commitam (são de gate sobre arquivos já
commitados, reproduzíveis). Os comandos, verbatim (`D=docs/native`; a segunda
corrida lê cópias das pastas `dumps-pai/` e `dumps-ret/` da 6b **sem** os dois
`*S5-n-grande*` de cada, numa pasta de trabalho fora da árvore):

```
node apps/native/scripts/g-n3.mjs --pai $D/N3-PRECHECK-anexos/B5-baseline --pai $D/N3-PRECHECK-anexos/B3-referencia-paisagem \
  --pai $D/N3-PR6-anexos/dumps-pai --pai $D/N3-PR6-anexos/dumps-pai-extra --pai $D/N3-PR5-anexos/dumps-pai \
  --pai $D/N3-PR4-anexos/dumps-pai --pai $D/N3-PR3-anexos/dumps-pai \
  --faixa $D/N3-PR6-anexos/dumps-ret --rolada $D/N3-PR6-anexos/dumps-ret-rolada
  → G-N3: (e)=0 · (b)=0 · nome-acessível=28 · rolagem=18 ✓
node apps/native/scripts/g-n3.mjs --pai <6b-pai sem S5> --faixa <6b-ret sem S5> --rolada $D/N3-PR6b-anexos/dumps-rolada
  → G-N3: (e)=0 · (b)=0 · nome-acessível=4 · rolagem=4 ✓
node apps/native/scripts/g-n3.mjs --pai $D/N3-PR6c-anexos/dumps-n-pai --faixa $D/N3-PR6c-anexos/dumps-n-ret
  → G-N3: (e)=0 · (b)=0 · nome-acessível=0 · rolagem=0 ✓
node apps/native/scripts/g-n3.mjs --pai $D/N3-PR6b-anexos/dumps-pai --faixa $D/N3-PR6b-anexos/dumps-ret --rolada $D/N3-PR6b-anexos/dumps-rolada
  → G-N3: REPROVA ✗ — (e)=0 em 0 dump(s) · (b)=4 em 2 dump(s) · nome-acessível=4 · rolagem=4      [exit 1]
```

**G5 e G6** (T3-R5) `[lido]`: **55 estados × quatro colunas**, 209 de 220 células
(as 11 vazias por construção: S0 só no AVD, J3 e A14 numa orientação) —
`N3-PR6-anexos/G5G6-consolidado.txt`; **+ 7 estados × quatro colunas**, 28 de 28 —
`N3-PR6b-anexos/G5G6.txt`; e a S5 com N = 60, 19, 18 e 8 de novo, 16 de 16 —
`N3-PR6c-anexos/G5G6-S5.txt`. Todo alvo ≥ 48 dp e com `testID`, os mesmos ids nas
quatro colunas. **As 20 molduras do V1 e as 18 do N2** alcançadas nas duas
orientações do tablet (A-N3-5 fechado na N3-PR6b).

**G1, G2, G3** — `sh apps/native/scripts/g1.sh 53bf0d5 WORKTREE` e `g2g3.sh`:

```
G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)     EXCEÇÕES DECLARADAS: (nenhuma)
G1b: só adição ✓                                         PARES DECLARADOS: (nenhum)
G2 — testIDs  antes=80  depois=80                        G2: antes ⊆ depois ✓
G3 — linhas log( antes=68  depois=68                     ERRATAS: (nenhuma) · REMOÇÕES: (nenhuma)
                                                                                 [exit 0 · exit 0]
```

**Exceções órfãs = 0**: as listas locais dos dois scripts estão vazias na `main`
(as declarações moram no corpo de cada PR desde o W4-b2), e cada PR do bloco
copiou o seu bloco ```` ```gates ```` no README dos anexos. O bloco inteiro contra
o ponto de partida do pre-check (`g2g3.sh aa91b5d WORKTREE`, exit 0): **G2 79 →
80** (o `regua-texto`, só dev client, N3-PR1) e **G3 65 → 68** (`faixa=` e as duas
da régua, no catálogo).

**`gate:a20`** — `node scripts/a20.mjs` (em `apps/native`), exit 0:

```
  arquivos varridos: 33 (inclui 1 de fora da raiz: ../../packages/core/src/frases.ts — N2-PR3, div. 229)
  literais em posição de texto examinados: 169
  acusações: 0
```

**`gate:icones`** — `node scripts/icones.mjs`, exit 0:

```
  anexo D: 34 registros (V1) + 5 (DESIGN-N2, E17) = 39 registros · 68 elementos distintos no do V1
  mapa: 43 nomes · 97 elementos distintos · 43 com 'normal'
  acusações: 0 · avisos: 0
```

**39 registros**, como no fim do N2: o N3 não acrescentou ícone (`DESIGN-N3` §1).

**`SHA256SUMS`** — `shasum -a 256 -c SHA256SUMS` nas três pastas:

```
DESIGN-V1:  telas.html: OK · icones.html: OK · telas.pdf: OK                 [exit 0]
DESIGN-N2:  telas.html: OK · telas.pdf: OK                                   [exit 0]
DESIGN-N3:  telas.html: OK · telas.pdf: OK                                   [exit 0]
```

Os três congelados conferem, e o `gates-nativos` do CI confere os três desde a
N3-PR1 (div. 398).

**Suíte** — `pnpm test` na `main`: `Test Files 115 passed | 4 skipped (119)` ·
`Tests 1090 passed | 85 skipped (1175)` · exit 0.

**Testes e CNs escritos no bloco, por PR** `[medido]`: linhas que começam por
`it(`/`test(` acrescentadas nos `*.test.ts(x)` do diff de cada merge (`git diff
M^1 M`), e os CNs de shell em `apps/native/scripts/__cn__/`. Um `it` dentro de um
laço conta uma vez (o CN de tela da N3-PR6c gera três casos com uma linha). Não
entram os CNs ad hoc dos anexos (`cn-picker-b.py` etc.).

| PR | #326 | #327 | #328 | #329 | #330 | #331 | #332 | #333 | **total** |
|---|---|---|---|---|---|---|---|---|---|
| `it` + | 4 | 6 | 10 | 11 | 7 | 6 | 0 | 3 | **47** |
| arquivo de teste novo | `faixa.test.ts` | `s1-faixa` | `s2-faixa` | `reordenar-folha-faixa` | `palco-faixa` | `s5-faixa` (+ bloco (k) no `picker.test.tsx`) | — | `s5-fileira-faixa` | **7** |
| CN de shell | `cn-n3pr1.sh` | — | `cn-n3pr3.sh` | — | — | — | — | `cn-n3pr6c.sh` | **3** |

As PRs só de docs (#324, #325) e a só de aceite (#332) não escreveram teste.
Gates novos do bloco: `g-inv.sh` e `g-n3.mjs` (N3-PR1; o `g-n3.mjs` mudou na
N3-PR3 e na N3-PR6c).

---

## 7. A série do CI

> **O `CI-FAIXA.md` não tem nenhuma corrida do N3** (div. 467): a série de lá
> termina na **100ª** (`3be7718`, #322), e nem as do W4-b3 (#323) entraram. Esta
> PR mede as corridas e calcula a referência com elas, **aqui**; escrevê-las no
> `CI-FAIXA.md` está fora da lista fechada desta PR. Numeração abaixo = a que
> teriam lá, na ordem.

Todas as corridas do `android-debug-apk` que **produziram APK** desde a 100ª,
**nível job** (`startedAt → completedAt`), todas `success`
`[medido: gh run list --workflow=native.yml --created ">=2026-09-23T18:00:00Z" · gh run view <id> --json jobs]`:

| # | run | evento | PR | commit | início (UTC) | job | bloco |
|---|---|---|---|---|---|---|---|
| 101 | `35918227089` | push | #322 | `796abe5` | 09-23 20:47 | 12m39s | W4-b2 (merge) |
| 102 | `35927579912` | PR | #323 | `7ab865c` | 09-23 22:18 | 11m33s | W4-b3 |
| 103 | `35927852903` | PR | #323 | `0a28628` | 09-23 22:21 | 13m18s | W4-b3 (o push de docs antes do verde, div. 381) |
| 104 | `35934343181` | push | #323 | `aa91b5d` | 09-23 23:35 | 12m34s | W4-b3 (merge) |
| 105 | `36059092056` | PR | #326 | `d5cf416` | 09-24 21:04 | 13m17s | **N3** |
| 106 | `36065585522` | push | #326 | `3a9b24f` | 09-24 22:07 | 12m09s | N3 |
| 107 | `36077809965` | PR | #327 | `46d47af` | 09-25 00:30 | 13m07s | N3 |
| 108 | `36130488215` | push | #327 | `58d2296` | 09-25 11:38 | 12m54s | N3 |
| 109 | `36149790518` | PR | #328 | `5c4d94f` | 09-25 14:47 | 13m27s | N3 |
| 110 | `36154743385` | push | #328 | `c1d845f` | 09-25 15:31 | 10m52s | N3 |
| 111 | `36165365239` | PR | #329 | `b2c0d92` | 09-25 17:09 | 13m09s | N3 (o APK passou; o que caiu foi o `build` do CI, div. 432) |
| 112 | `36169939041` | push | #329 | `59269a0` | 09-25 17:53 | 12m19s | N3 |
| 113 | `36179065634` | PR | #330 | `b407611` | 09-25 19:20 | 13m46s | N3 |
| 114 | `36184518653` | push | #330 | `0a71da8` | 09-25 20:14 | 12m30s | N3 |
| 115 | `36199314490` | PR | #331 | `e283000` | 09-25 23:01 | 9m27s | N3 |
| 116 | `36200633657` | push | #331 | `73b45ea` | 09-25 23:20 | 10m02s | N3 |
| 117 | `36240343744` | PR | #333 | `3acee67` | 09-26 11:56 | 13m55s | N3 |
| 118 | `36241234150` | push | #333 | `53bf0d5` | 09-26 12:13 | 13m15s | N3 (merge; terminou durante esta sessão, 12:26:43Z) |

**As `skipped` do N3 (o H1 funcionando, não entram na série)**: os seis pushes de
docs que subiram **depois** do APK verde — `6e229b3` (#326), `33ded27` (#327),
`7a564c1` (#328), `78aaf2b` (#329), `cf3ff3c` (#330), `4992667` (#331) —, cada um
com o `android-debug-apk` `skipped` em segundos. As PRs só de docs (#324, #325,
#332) nem disparam o `native.yml` (div. 391). **Nenhum APK do N3 foi gasto por
push de docs**: a regra 18 (§5) pagou.

**A referência, recalculada** `[medido: quartis inclusivos, como no CI-FAIXA]`:

```
regime 2 no CI-FAIXA (até a 100ª)   n=78  mín 8m09s  máx 14m32s  mediana 12m12s  Q1 11m01s  Q3 12m50s  IQR 1m49s
+ as 4 do W4-b3 (101–104)            n=82  mín 8m09s  máx 14m32s  mediana 12m16s  Q1 11m08,8s  Q3 12m50s    IQR 1m41,2s
+ as 14 do N3 (105–118)             n=96  mín 8m09s  máx 14m32s  mediana 12m20,5s  Q1 11m12,2s  Q3 12m55,2s  IQR 1m43s
só o N3 (descritivo)                 n=14  mín 9m27s  máx 13m55s  mediana 13m00,5s  Q1 12m11,5s  Q3 13m16,5s  IQR 1m05s
```

**Nenhum segmento novo**: o N3 não mudou item da lista fechada (nenhum módulo
nativo, nenhum passo do job, nenhuma toolchain; o dev client só foi
**reinstalado** no AVD, div. 383, sem módulo novo). A mediana das dez primeiras
do N3 (105–114) é **13m00,5s**, **fora do IQR** do regime 2 com as do W4-b3 (Q3
12m50s) por 10,5 s, para cima; como a condição (1) não vale, não há candidato —
é "divergência a investigar" só se o patamar se mantiver, e fica registrado aqui
com as duas medições ao lado, para o Marcel. As duas mais rápidas do
bloco (115 e 116, 9m27s e 10m02s) são as da N3-PR6, dentro da faixa.

**A div. 432 como nota.** No mesmo push da 111, o `build` do workflow `CI` (não o
APK) caiu no `escrita.test.ts` › *"ÚLTIMO 200"*: o modo
`escrita-releitura-fora-de-ordem` do mock segura a releitura por uma **janela
fixa de 600 ms**, e num runner lento a inversão que o teste mede não acontece.
Classificado **(b) runner** pela regra 16 — um rerun só, `attempt=2` `success`,
5/5 local, `diff` fora do caminho. Primeira ocorrência em 15 falhas do CI desde
14/08. O conserto (a janela vira evento) é do **W5** (§10.3.1).

---

## 8. Escritas em prod

**Zero.** O bloco inteiro rodou em **mock** (`aceite.py servidor`, a fixture do
pre-check), com o bundle conferido antes de cada rodada: `octavia.rocks` **0**
vezes no bundle servido, em toda PR `[lido: estado/bundle*.txt de cada anexo]`.

| onde | prod | mock |
|---|---|---|
| pre-check (#324) | **0 requests** (nem leitura) | o `POST` da "folha falhou" no `escrita-500`, nada gravado |
| desenho (#325) | 0 | — (só docs) |
| PR-1 (#326) | 0 | nenhuma escrita gravada |
| PR-2 (#327) | 0 | a folha do salvo-não-relido grava no mock (`escrita-resync-500`) |
| PR-3 (#328) | 0 | `remover-1` em cinco modos; o do celular grava |
| PR-4 (#329) | 0 | reordenar, criar, apagar contra modos que falham; no celular um `reorder` e um `create` |
| PR-5 (#330) | 0 | o `Adicionar` do picker (`resync-pendurado`), a folha (`escrita-500`), o `401` do S0 |
| PR-6 (#331) | 0 | criar, adicionar, remover, reordenar, apagar e o J3 contra a matriz de modos |
| PR-6b (#332) | 0 | **0** (só leitura e sync) |
| PR-6c (#333) | 0 | 0 |

O mock se relê da fixture a cada troca de modo: nada do que ele gravou sobreviveu à
rodada. A única ida à rede fora do mock foi o **login da conta de audit no
`octavia_phone`**, feito pelo Marcel (Firebase Auth, não a API do Octavia), em cada
PR que usou o celular. **A conta do Marcel no Tab S6 não fez sync com prod no
bloco**: o cache dela foi guardado arquivo a arquivo e regravado com o `md5`
idêntico em toda PR (§9).

---

## 9. Aparato → [`APARATO.md`](APARATO.md)

O que o `APARATO.md` ganhou no N3, **na PR que achou** (regra 9: mudou o aparato,
muda a página no mesmo commit):

| entrada | de onde |
|---|---|
| o `octavia_phone` (criação, fator 2,625, janelas em pé e deitado) e as janelas de retrato dos tablets | pre-check, B1 |
| o **snapshot do AVD** (`default_boot` regravado; todo rebuild termina com `snapshot save`) | pre-check, div. 383, N3-D11 |
| subir com **`-no-snapshot-save`** para medir sem deixar rastro; o `snapshot.pb` muda de data, o `ram.bin` é a prova | PR-1…PR-6c; div. 453 |
| a **régua de desenvolvimento** (`exp+octavia://regua`, tokens, régua × dump) | PR-1, N3-D26 |
| a **receita de dados do G-inv** (palco antes de S1; cada aparelho pelo caminho da sua base; S0 frio × S0 por logout) | PR-1, divs. 403, 404, 437, 451, 452 |
| o rádio do AVD (`svc wifi/data enable` depois do avião) | PR-3, div. 418 |
| o cache do Tab **arquivo a arquivo** (o `tar` por `exec-out` trunca) e a pasta de **demanda** | PR-3, divs. 419, 420; PR-5, div. 444 |
| o topo do teclado pela região tocável do IME | PR-4, div. 428 |
| **`input motionevent`** para o arrasto no meio do gesto | PR-4, div. 431 |
| o duplo do `react-native-pdf` no `native-tela` | PR-5, div. 434 |
| logcat limpo **uma vez** por rodada | PR-5, div. 440 |
| o FAB do dev client medido em B, superfície por superfície (P1) | PR-2…PR-5, div. 441 |
| **um mock por aparelho** (8788 · 8789 · 8792) | PR-6, div. 446 |
| a rotação por aparelho (Tab: retrato 0; AVD: retrato 1), o store apagado numa string só, o `stay_on` antes do destravar | PR-6b, div. 457 |
| a regra do **check vermelho classificado** (regra 16) | PR-4, div. 432 |

**Corrigido nesta PR, declarado** (div. 473) — o `APARATO.md` estava inconsistente
com os anexos em cinco pontos, e cada um virou uma linha:

1. *"Retrato não tem composição … o N3 mede o que isso custa"* — desde a N3-PR6 o
   tablet em pé tem a composição B; a linha agora diz as três faixas e os canvas.
2. A P1 abria com *"hipótese de aparato, sem medida ainda"* e seguia com quatro
   medições (PR-2…PR-5); o cabeçalho passa a dizer que foi medida em B.
3. Os **`._*` do cache do Tab** (quatro AppleDouble de 163 B, sobras de uma
   restauração antiga por `tar` do macOS, div. 420): **ficam onde estão, por
   decisão do Marcel** (N3-PR6c); a página dizia só que o `tar` os cria.
4. O `accelerometer_rotation` do `octavia_phone` foi lido **0** e **1** em sessões
   diferentes (PR-1, PR-3, PR-4, PR-6); a tabela de repouso não o dizia — o
   repouso dele se lê, não se supõe.
5. A seção do G-inv não citava a **N3-D27** (a base do palco é a
   `B3-referencia-paisagem/`, mock).

---

## 10. Herança, com destino

**A parte que o N5 e o bloco web vão ler.** A numeração é estável — cite por
**§10.<bloco>.<n>**, e confira com `grep` antes de citar (a lição da div. 397).

### 10.1 N5 (celular)

**A faixa A inteira** — as 16 molduras `N3-A-…` e as 3 `N3-A699-…` do
`DESIGN-N3/telas.html` viram **T5-R** (`N3-REQUISITOS.md` §4 item 1). Hoje **A usa
os tokens de B** (`faixas.A = faixaB`, `apps/native/src/theme.ts`; N3-D28), e o
que isso dá no `octavia_phone` em pé (411,4 × 874,3) está medido superfície por
superfície:

| # | superfície | o que A mostra hoje com os tokens de B | moldura / decisão que o N5 implementa | origem |
|---|---|---|---|---|
| 1 | S1 | não cabe: a linha de botões passa da barra de 144, o chip encolhe até o ícone, o cartão estoura à direita; os controles **alcançáveis** | `N3-A-S1` (barra de 168, chip em linha própria) | div. 416 |
| 2 | S2 com edição | **`setlist-apagar` sem nó**; `setlist-editar` cortado | `N3-A-S2e`, faixa em duas linhas de 48 (N3-D16) | N3-PR3 |
| 3 | diálogo de apagar | **não abre** — a entrada é o `setlist-apagar` | `N3-A-D-apagar`, botões empilhados (N3-D22) | N3-PR4 |
| 4 | folha | `form-cancelar` e `form-salvar` **cortados** pelas duas bordas (a folha de 663 centrada em 411,4), tocados com efeito | `N3-A-F-*`: 379 × conteúdo, topo 16, acima do teclado (N3-D20) | divs. 417, 425 |
| 5 | reordenar | alcançável; o motivo `nada mudou…` espremido em **4,2 × 48,0 dp**, ilegível | `N3-A-reordenar`, o motivo numa terceira linha | **div. 426** |
| 6 | reordenar, título | 605,8 dp não cabe numa linha de 379 | a barra de A (200) ganha a 2ª linha do título | N3-E9 |
| 7 | palco | **`busca` e `sair` sem nó**; `indice` cortado (43,4 de 65,8); sair do palco é o `BACK` | `N3-A-S3`: índice, busca e sair na barra de cima (144), leitura na base (N3-D14) | div. 443 |
| 8 | S5 | alcançável com N = 8; o display de 52 dobra de altura | `N3-A-S5`: display de 32 dp (N3-D18; .2em × .22em é a div. 408) | N3-E3 |
| 9 | S5 com N grande | **não medida em A**: a fileira de marcas usa 663 (o token de B) numa janela de 411,4 | a fileira de A é token de faixa, como C e B | div. 474 |
| 10 | picker com falha | a E18 vale em A: título 151,3 dp no 1º andar, `Tentar de novo` inteiro | `N3-A-P` (os dois andares de A, o molde da E18) | N3-E18 |
| 11 | S0 | a coluna de 420 encosta nas duas bordas em 411,4 | `N3-A-S0` | pre-check §4.2 |
| 12 | S4 | passa com (d′) | — | pre-check §5.1 |

**A lista final de inalcançáveis** (N3-PR6, `N3-PR6-anexos/inalcancaveis-A.txt`;
"alcançável" = nó na janela e o toque no centro da parte visível faz o que o
controle faz; o uiautomator recorta o `bounds` à janela):

```
## EM PÉ — faixa A (411,4 dp)                                          [FATAL: 0]
S2e        setlist-apagar       INALCANÇÁVEL  sem nó no dump
dialogo    apagar-manter        INALCANÇÁVEL  a superfície não abre (sem 'setlist-apagar')
dialogo    apagar-confirmar     INALCANÇÁVEL  a superfície não abre (sem 'setlist-apagar')
palco      busca                INALCANÇÁVEL  sem nó no dump
palco      sair                 INALCANÇÁVEL  sem nó no dump
— cortados, tocados com efeito —
S2e        setlist-editar       bounds [336.4,119.6][411.4,167.6]  75.0 × 48.0 visíveis de 193.8 × 48.0
folha      form-cancelar        bounds [0.0,400.0][29.0,457.9]     29.0 × 57.9 visíveis de 122.2 × 58.2
folha      form-salvar          bounds [380.2,400.0][411.4,457.9]  31.2 × 57.9 visíveis de 127.1 × 58.2
palco      indice               bounds [368.0,817.9][411.4,883.8]  43.4 × 65.9 visíveis de 65.8 × 65.8
## DEITADO — faixa B pela largura (914,3 × 371,4 dp)
nada inalcançável; a folha passa do fundo da janela:
folha      form-cancelar        bounds [158.9,400.0][280.4,411.4]  121.5 × 11.4 visíveis de 122.2 × 58.2
folha      form-salvar          bounds [631.6,400.0][756.2,411.4]  124.6 × 11.4 visíveis de 127.1 × 58.2
```

E ainda, para o N5:

| # | item | origem |
|---|---|---|
| 13 | **a quebra de linha na letra, nunca na tab** — bloco próprio e **pré-requisito do N5**: o corpo do palco não quebra linha em nenhuma faixa, e em A cabem ≈ 26 colunas | N3-D15 (R1·3); `N3-REQUISITOS.md` §4 item 2 |
| 14 | **a regra de altura**: janela útil < ~480 dp → composição compacta. O celular deitado (914,3 × 371,4) é B pela largura e **a folha passa do fundo da janela** (os botões com 11,4 dp visíveis) | N3-D8; divs. 388, 454 |
| 15 | **o `h` útil na linha `faixa=`**: o `h` de hoje é a janela do `useWindowDimensions` **com** as barras (Tab deitado `h=711.1`, não os 663,1 úteis). Para a regra de altura decidir, a linha precisa do `h` útil — e isso é errata de log (G3 em par) | div. 410 |
| 16 | **a régua de dev como instrumento**: medir as `[estimado]` da faixa A antes de implementar (regra 19) — os tokens da régua são cópias declaradas dos estilos, e mudou o estilo, muda o token | N3-D26; `APARATO.md` "A régua" |
| 17 | **pergunta aberta: aparelho de celular real para o aceite.** Todo o celular do N3 é o AVD `octavia_phone` (Pixel 6, API 32). O Tab S6 é o único aparelho físico. O aceite do N5 no AVD só prova o que o N3 provou no AVD; teclado real, gestos e densidade de um celular físico não foram medidos nunca | — (decisão do Marcel) |
| 18 | **div. 426**: o reordenar a 4,2 dp em A — o `flexShrink` que em B deixa o motivo quebrar mantém o botão alcançável em A e apaga o texto | div. 426 |

### 10.2 iOS

| # | item | origem |
|---|---|---|
| 1 | **a regra de componente**: em 600–699 três componentes caberiam na forma de B; a folha registra os limiares **667,5 / 474 / 430** como alternativa — herança para o iPad em janela | N3-D24; `DESIGN-N3/telas.html` §11 |
| 2 | **`supportsTablet`**: o `app.json` não tem chave `ios`; o iPad herdando a composição não foi medido (nenhum aparelho iOS) | N3-D5; H-N3-6; pre-check §1.1 |
| 3 | **nada de Android na composição**: as faixas decidem pela largura em dp, sem `screenOrientation`, sem API de Android na tela — a condição para o iPad herdar | N3-D5 |

### 10.3 W5 (instrumento)

| # | item | origem |
|---|---|---|
| 1 | **o mock por evento** no `escrita-releitura-fora-de-ordem`: segurar a 1ª releitura **até a 2ª chegar**, não uma janela de 600 ms, com CN que reprova quando a inversão não acontece | div. 432; `N3-REQUISITOS.md` §4 item 9 |
| 2 | **P1 — o FAB do dev client**: hipótese de aparato; medido em B (nenhum controle sob ele; em B fica sobre o ponto de sem rede do palco) — some pelo menu, ou o arnês toca pela margem | N3-D25; div. 441; `APARATO.md` |
| 3 | o G5/G6 reconhece linha cortada só pela borda **de baixo** da lista; no dump rolado o corte é pela de cima (a div. 458 não deu destino; posto aqui por ser instrumento) | div. 458 |

### 10.4 Polimento do nativo, pós-N3

| # | item | origem |
|---|---|---|
| 1 | **o rodapé do picker acima do teclado**, com aceite nas **três faixas**: em B o teclado encaixado (topo 761,3 dp) cobre o `Concluir` (y 1034,2), e o J3 em retrato gasta um gesto para fechar o teclado | div. 450 (decisão do Marcel) |
| 2 | **alinhar o `8 DE 8` da S5 à linha 1 do palco** em B (hoje 16 dp abaixo: 52,0 × 36,0) | div. 447; N3-E19 (*"sem alinhamento no N3"*) |
| 3 | o rastreamento do display de S5: a folha diz **.2em**, o app usa **.22em** (`tracking.displayWide`) — decide-se no N5, com o degrau de 32 de A | div. 408 |
| 4 | o **S0 por logout** mede os campos 0,5 dp (1 px) diferente do S0 frio — não é código; se o G-inv acusar exatamente isso, o S0 se refaz | divs. 404, 437, 452 |
| 5 | `StageScreen.tsx:479` cita `App.tsx:206` para o `SafeAreaView`; ele está em `App.tsx:309` — o destino era *"a próxima PR que tocar o `StageScreen.tsx`"*, e a N3-PR5 tocou sem corrigir; o destino continua esse | div. 390; div. 471 |
| 6 | os `X3`/`X1` não renomeados (`screens/Picker.tsx:311`, `src/escrita.ts:429`) — o destino era *"a próxima PR que tocar esses arquivos"*, e a N3-PR6 tocou o `Picker.tsx` sem renomear; o destino continua esse | `W4-ENCERRAMENTO.md` §7.6; div. 472 |

### 10.5 Bloco web (o próximo, decidido)

O web com a identidade visual do nativo (`N2-ENCERRAMENTO.md` §10.8; N3-D6). O que
ele reaproveita do N3 são **as decisões de composição, não o código** (o web não
usa `theme.ts` nem React Native):

| # | decisão | onde |
|---|---|---|
| 1 | **faixas de largura**, não orientação nem aparelho: A < 700 · B 700–960 · C > 960, cada uma congelada em px/dp; um só ponto de decisão | N3-D12, N3-D24; T3-R1 |
| 2 | **empilhar, não esconder**: *"quando não cabe, a composição empilha; o conteúdo não sai"* — linha de controles vira duas, grade de duas colunas vira uma, nenhum texto de leitura encolhe | `DESIGN-N3/README.md` §1 |
| 3 | **a linha de aviso cresce** (48 mín., +20 por linha) e **nunca elide** o motivo, em toda faixa | N3-D19 |
| 4 | **rótulos curtos com nome acessível longo** (`Adicionar` / `Adicionar música`), só com frases que já existem | N3-D17 |
| 5 | **tokens por faixa**, nenhuma conta de largura em tela | N3-D28 (regra 21) |
| 6 | **"passa" se prova em todos os estados**, não no estado base | regra 17 |

**O pre-check do web registra o que já está decidido**, e não se repete aqui: a
identidade visual e o client OAuth renomeado.

### 10.6 N4 (content)

**Nasce adaptativo**: as telas de content se desenham nas **três faixas** desde a
folha, com os tokens por faixa (N3-D28) e a regra única da folha — sem redesenho
depois. O que o N2 deixou para o content segue no `N2-ENCERRAMENTO.md` §10.2
(itens 1–6, destino N4 pela errata do topo daquela seção).

### 10.7 Do V1, do N2 e do W4, que segue aberto

O N3 **não tocou** estes — cite-os pela fonte:

| de onde | itens |
|---|---|
| `N2-ENCERRAMENTO.md` §10.2 | 1–6 (N4) |
| `N2-ENCERRAMENTO.md` §10.3 | 1–9 (bloco D) — o N3 não tocou backend |
| `N2-ENCERRAMENTO.md` §10.4 | P1 (selo de bis — a N3-PR5 mexeu no palco, só na barra), P2, P3 |
| `N2-ENCERRAMENTO.md` §10.5 | 1 (chevrons e os cinco desabilitados), 2 (tema claro), 3 (`cor.offline`), 5 (opção C do teto), 6 (div. 108), 7 (cobertura dos gates) |
| `N2-ENCERRAMENTO.md` §10.6 | 1–7 (o 3, *"o aceite no aparelho não se dispensa"*, o N3 confirmou em toda PR) |
| `N2-ENCERRAMENTO.md` §10.7 | 2 (app iOS) — ver §10.2 acima |
| `W4-ENCERRAMENTO.md` §7 | 4 (a carona do S3e), 5 (release frio), 6 (ver §10.4.6) |

**O que o N3 fechou** de heranças anteriores: `N2-ENCERRAMENTO.md` §10.7.1 (o
tablet em retrato) e `W4-ENCERRAMENTO.md` §7.3 (a hipótese do ◔, H-N3-2) — os
dois marcados na fonte com a PR.

---

## 11. O rito, como ficou

| mudança de método | onde está |
|---|---|
| **pre-check só leitura**, com a tabela **defeito objetivo × estranhamento** em colunas separadas (medição de um lado, leitura do outro) e o instrumento com **controle contra a própria paisagem** | `N3-PRECHECK.md` §3.1, §4 |
| **brief com faixas**: o canvas medido por aparelho, o pior caso, as capturas de fixture | `N3-PRECHECK.md` §2, §5 |
| **duas revisões + a Q13**: a revisão 1 acrescentou o pior caso de A (699) e a tabela de medidas **por origem**; a revisão 2 decidiu que tudo segue a faixa | `DESIGN-N3/README.md` §3 |
| **congelamento com requisitos no lugar de PRD**: T3-R1…R7 e A-N3-1…7, com a evidência de cada aceite nomeada | `N3-REQUISITOS.md` |
| **o gate antes da tela** (PR-1): G-inv e G-N3 entram reprovando a `main` em retrato, e as `[estimado]` se medem pela régua antes de implementar | `N3-PR1-anexos/`; regra 19 |
| **uma superfície por PR**, com o **G-inv verde no commit do código** de cada uma (e os 52 dumps de paisagem byte a byte iguais aos da PR anterior) | anexos PR-2…PR-5 |
| **aceite completo + os sete**: o consolidado do bloco num relatório só, e depois as molduras do V1 que nenhum roteiro alcançava | `N3-PR6-anexos/`, `N3-PR6b-anexos/` |
| **(b) reintroduzido**: o critério que o instrumento de origem tinha e a cópia deixou de fora volta, com controle contra a origem (105 de 105) | `N3-PR6c-anexos/`; caso 28 |
| a lista de A como **herança, não reprovação** (errata do T3-R3) | `N3-REQUISITOS.md` T3-R3 |
| o encerramento é índice; a memória de sessão é rastro | `CLAUDE.md`; `N2-ENCERRAMENTO.md` §4.3 |

---

## 12. Divergências desta PR — 467 a 476

| # | origem | o quê | o que foi feito |
|---|---|---|---|
| **467** | P | *"as corridas do N3 no `CI-FAIXA.md` (o executor já as vai lá lendo)"* — `[medido]` a série do `CI-FAIXA.md` termina na **100ª** (`3be7718`, #322): nenhuma corrida do W4-b3 (#323) nem do N3 entrou, e nenhuma PR desde a #322 acrescentou linha. E o `CI-FAIXA.md` está **fora da lista fechada** desta PR | as 18 corridas (101–118) medidas e a referência recalculada na §7, **aqui**; o `CI-FAIXA.md` não foi tocado. **Com o Marcel**: incorporá-las (um commit de uma tabela, numa PR que o toque) e decidir quem acrescenta as linhas daqui em diante |
| **468** | P | *"caso 28 se faltar"* — o 28 **já estava** (N3-PR6c), com um exemplo só, a S5. E o segundo exemplo do prompt, *"o picker de antes da E18"*, não foi invisível ao G-N3: o **(e)=2** (o título sumido) pegou o estado na N3-PR6; o que nenhum gate viu foi o **corte** do `Tentar de novo` na borda — o (b) dá 6 ali (CN-B4) | o segundo exemplo entrou no caso 28 com essa leitura; o texto do caso não foi reescrito, só acrescido |
| **469** | P | *"regras firmadas no N3 … docs só após APK verde"* — a regra é do **W4-b3** (div. 381, 2026-09-23); o `W4-ENCERRAMENTO.md` §2 a lista entre as regras do bloco, sem número no catálogo. A 16 (check vermelho, div. 432) também vivia só no `APARATO.md` | numeradas como pedido (16–21); a 18 com a origem W4-b3 dita, e o registro de que o N3 foi o primeiro bloco a aplicá-la inteiro (seis `skipped`, zero APK gasto em docs, §7) |
| **470** | P | *"o '23 testIDs'"* entre os erros do revisor no N3: é a **div. 221 do N2** (origem D, o cabeçalho da folha do `DESIGN-N2`), não uma divergência do N3; nenhum registro do bloco fala em "23 testIDs" `[medido: grep -rn "23 testID" docs/native]` | fora da §4.3; a mais próxima do N3 é a **412** (*"os três testIDs"*), que está lá |
| **471** | D | a div. 390 dizia *"a próxima PR que tocar o `StageScreen.tsx` corrige"* a citação `App.tsx:206`; a **N3-PR5 (#330) tocou** o arquivo e não corrigiu. Hoje: `StageScreen.tsx:479` cita `App.tsx:206`; o `SafeAreaView` está em `App.tsx:309` `[medido]` | não corrigido (código); §10.4.5 |
| **472** | D | o `W4-ENCERRAMENTO.md` §7.6 (os `X<n>` não renomeados) tinha destino *"a próxima PR que tocar esses arquivos"*; a **N3-PR6 (#331) tocou o `Picker.tsx`** e não renomeou (`Extra X3`, hoje `Picker.tsx:311`) | não corrigido (código); o §7.6 do W4 fica aberto; §10.4.6 |
| **473** | D | o `APARATO.md` estava inconsistente com os anexos em cinco pontos (§9) | **corrigido nesta PR**, um ponto por linha, como o prompt permite |
| **474** | D | **a S5 com N grande em A não foi medida**: `faixas.A = faixaB` (`theme.ts:292`), então a fileira de marcas em A tem 663 dp numa janela de 411,4 `[medido: leitura do código]`. O A-N3-3 de A mediu a S5 só com N = 8 | registrado; §10.1.9. O (b) do G-N3 a vê, se o dump existir |
| **475** | P | *"G-N3 (as quatro saídas, consolidado (e)=0 (b)=0)"* — **não existe relatório consolidado do bloco com o (b)**: o de 102 pares é da N3-PR6 (antes do (b)); as sete da 6b e a S5 da 6c ficaram em relatórios próprios. E as sete da 6b, com a `S5-n-grande` de antes do conserto, **reprovam** no G-N3 da `main` ((b)=4) — é o registro do defeito | medido aqui em três corridas (122 pares, (e)=0 · (b)=0), com a da 6b sem a S5 antiga e a S5 da 6c no lugar; a com a S5 antiga como controle (§6) |
| **476** | P | *"uma superfície por PR com G-inv verde em todo commit"* — o G-inv roda no **commit do código** de cada PR (o commit 2; na PR-6 e na PR-6c também no fim), não em todo commit: o commit 1 (o gate, os CNs) e o de docs não mudam tela | a §11 diz *"no commit do código"* |

---

## 13. Contabilidade desta PR

| | |
|---|---|
| requests a `/api/*` em prod | **0** |
| comandos a aparelho | **0** — `adb` não invocado |
| worktree | `../octavia-n3-fim`, **sem** `.env*`; `pnpm install --frozen-lockfile --offline` |
| arquivos | `N3-ENCERRAMENTO.md` (novo); `LOGS-OCTAVIA.md` (caso 28, regras 16–21); `N3-REQUISITOS.md` (cabeçalho); `N2-ENCERRAMENTO.md` §10.7.1; `W4-ENCERRAMENTO.md` §7.3; `APARATO.md` (div. 473) |
| código | nenhum |
| bloco `gates` | vazio |
| APK | nenhum: a PR não toca caminho do `native.yml` |

O bloco ```` ```gates ```` desta PR, verbatim (a PR não tem pasta de anexos; a cópia
que a regra do W4-b2 pede mora aqui):

```gates
# N3 encerramento: nenhuma declaração — só docs (N3-ENCERRAMENTO.md, LOGS-OCTAVIA.md, N3-REQUISITOS.md, N2/W4-ENCERRAMENTO, APARATO.md).
```
