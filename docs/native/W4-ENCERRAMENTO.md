# W4 — ENCERRAMENTO

**A fonte do bloco, e um índice, não uma segunda cópia.** Tudo o que este arquivo
afirma aponta para o documento, a PR ou o anexo onde está. Onde a prosa daqui e a fonte
divergirem, vale a fonte. Nenhum texto de decisão ou de errata é reescrito aqui.

- **Bloco**: W4, a dívida de **instrumento** e de **palco** que o N2 empurrou
  (`N2-PRECHECK.md`, N2-D3; `N2-ENCERRAMENTO.md` §10.1). Quatro PRs: o **W4-a**
  (gates), e o **W4-b** em três, **b1** (gates), **b2** (CI) e **b3** (palco,
  release e a 368).
- **Janela**: 2026-09-21 (W4-a, #312, merge `5f1c226`) → 2026-09-23 (W4-b3, #323).
- **Esta PR**: o commit de docs da #323, branch `w4b/palco`, árvore `../octavia-w4b3`.
- **Convenção**: `[medido]` = comando + saída literal, na sessão da PR citada;
  `[lido]` = tirado do documento citado, sem medir de novo.
- **Divergências do bloco**: **215–220** (W4-a), **347–351** (b1), **352–369** (b2),
  **370–381** (b3).

> **CN QUE NÃO REPROVA É INSTRUMENTO QUEBRADO, e CN que reprova pelo motivo errado
> também.** O CN do `lruEvict` reprovou na primeira forma, mas porque o duplo não
> despejava nada, não porque o estouro era calado (div. 377). Quem o pegou foi a
> asserção que falhou, lida linha por linha. Não bastou ver o vermelho.

---

## 1. O que o W4 entregou

| PR | merge | o que | anexos |
|---|---|---|---|
| **W4-a** — [#312](https://github.com/marcelviana/octavia/pull/312) | `5f1c226` (2026-09-21) | G3 com errata **em par** (a velha só sai se a nova entra), `g1.sh`/`g2g3.sh` recusam chamada sem par de refs, errata declarada e não usada acusada. Divs. 187, 189, 195 da N2-PR1 | [`W4A-anexos/`](W4A-anexos/README.md) |
| **W4-b1** — [#321](https://github.com/marcelviana/octavia/pull/321) | `e9b4196` (2026-09-23) | **órfão reprova**: exceção do G1a, par do G1b, errata e remoção do G3 declaradas e não usadas reprovam (div. 339). **Par de remoção** do G3, `linha → REMOVIDA: <razão>` (N2-D34, o mecanismo da 83). `shasum -c` dos congelados no `gates-nativos` (div. 223). Poda do G1. Docstring do `buildIndex` (div. 220). Coluna de origem em 128 divergências do N2 (div. 341) | [`W4B1-anexos/`](W4B1-anexos/README.md) |
| **W4-b2** — [#322](https://github.com/marcelviana/octavia/pull/322) | `796abe5` (2026-09-23) | **H1**: o APK não roda em push sem nativo (`mudou-nativo.sh`), e só filtra com `before` ancestral e último APK `success`. **H3**: as declarações dos gates saem da `main` para o bloco ```` ```gates ```` do corpo da PR (`gates-decl.sh`, `gates.yml` com `edited`); lista local não vazia reprova no CI. **`CI-FAIXA.md`**: a série inteira, o corte em dois regimes, a regra dos segmentos | [`W4B2-anexos/`](W4B2-anexos/README.md) |
| **W4-b3** — [#323](https://github.com/marcelviana/octavia/pull/323) | — (aguarda o Marcel) | **div. 119**: carona garantida num voo não garantido termina no não-purgável. **Estouro do `lruEvict`**: vira `lru over`. **Build de release** medido pela primeira vez ([`RELEASE-FAIXA.md`](RELEASE-FAIXA.md), n=3) e rodado no Tab S6. **Div. 368** medida: ruído | [`W4B3-anexos/`](W4B3-anexos/README.md) |

A §10.1 do `N2-ENCERRAMENTO.md` (a herança do N2 para o W4-b) está **toda riscada**:
itens 1, 2, 8, 9 e 10 na #321, 6, 7 e 11 na #322, 3, 4 e 5 na #323.

---

## 2. As regras firmadas no bloco

Cada uma mora onde quem vai mexer lê. Aqui fica só o endereço.

| regra | desde | onde mora |
|---|---|---|
| **Errata em par** no G3: a linha velha só sai se a nova entra | W4-a | `apps/native/scripts/g2g3.sh`; `LOGS-OCTAVIA.md` |
| **Gate recusa chamada sem par de refs** (passar "sobre zero arquivos" é passar sem medir) | W4-a (divs. 187, 215) | `g1.sh`, `g2g3.sh` |
| **Órfão reprova**: exceção, par, errata ou remoção declarada e não usada | W4-b1 (div. 339) | cabeçalho W4-b1 do `g1.sh` e do `g2g3.sh` |
| **Par de remoção**: `linha → REMOVIDA: <razão>`, casada **igual** (a errata casa por subcadeia, e a assimetria é de propósito, div. 351) | W4-b1 (N2-D34) | `g2g3.sh` |
| **`shasum -c` dos congelados** no `gates-nativos` | W4-b1 (div. 223) | `.github/workflows/gates.yml` |
| **H1**: o APK não roda em push sem nativo, e só filtra quando o último APK da PR foi `success` | W4-b2 | `apps/native/scripts/mudou-nativo.sh`; `native.yml` |
| **H3**: as declarações dos gates vêm do bloco ```` ```gates ```` do corpo da PR; lista local não vazia reprova no CI; **toda PR copia o bloco no README dos anexos** | W4-b2 (div. 348) | `gates-decl.sh`; `LOGS-OCTAVIA.md`, "Errata W4-b2" |
| **`CI-FAIXA.md`** é a fonte de todo número de CI, **com `n` e nível**; a referência é o regime 2 | W4-b2 | [`CI-FAIXA.md`](CI-FAIXA.md) |
| **Segmentos da série**: abre-se um só com (1) mudança da lista **e** (2) mediana das dez seguintes fora do IQR vigente com n ≥ 10. Quem abre é o Marcel; módulo nativo isolado é "divergência a investigar" | W4-b2 (divs. 366–369) | `CI-FAIXA.md`, "Os segmentos" |
| **Sem push forçado em PR** | W4-b2 (div. 353) | `LOGS-OCTAVIA.md`, "Errata W4-b2" |
| **Série local ≠ série de CI**: o release local tem arquivo próprio | W4-b3 | [`RELEASE-FAIXA.md`](RELEASE-FAIXA.md) |
| **Rebuild do dev client nos dois aparelhos**; release e dev client trocam por `install -r`; **aceite de release é contra prod, só leitura, mais escrita descartável pela regra 12; o mock é do dev client**; `EXPO_PUBLIC_*` de release exige `metro-cache` limpo | W4-b3 (divs. 371–374) | [`APARATO.md`](APARATO.md) |
| **Regra 13 ampliada**: no bundle servido, o símbolo do conserto **e a URL base da API** | W4-b3 (div. 374) | `LOGS-OCTAVIA.md`, regra 13; `APARATO.md` |
| **Push de docs só depois do APK verde** | W4-b3 (div. 381) | `APARATO.md` |

---

## 3. Divergências do bloco, por origem

Origem conforme a coluna de cada README (`[lido]`). **P** = o prompt presumiu; **T** =
erro de quem executou; **D** = o documento desmente; **A** = o aparelho ou o aparato
desmente. As 366 e 367 estão riscadas no README da W4-b2 (substituídas pelas decisões
das §12–§14 de lá) e contam pela letra que tinham.

| PR | faixa | P | T | D | A | total |
|---|---|---|---|---|---|---|
| W4-a | 215–220 | 2 (215, 217) | 1 (216) | 3 (218, 219, 220) | 0 | 6 |
| W4-b1 | 347–351 | 4 (347–350) | 1 (351) | 0 | 0 | 5 |
| W4-b2 | 352–369 | 10 (352, 355, 356, 357, 359, 363, 364, 365, 366, 369) | 6 (353, 358, 360, 361, 362, 367) | 1 (354) | 1 (368) | 18 |
| W4-b3 | 370–380 | 5 (370, 372, 375, 376, 380) | 2 (374, 377) | 1 (378) | 3 (371, 373, 379) | 11 |
| **W4** | | **21** | **10** | **5** | **4** | **40** |

Mais a **381** (T, W4-b3), registrada no corpo da #323 depois do commit de docs e
levada ao README dos anexos no fecho: o push de docs antes do APK verde custou um APK.
Com ela, **41** (T **11**).

**Mais da metade (21 de 41) é P**: o bloco é de instrumento, e o prompt de
instrumento presume o estado do instrumento. A §5 junta essas.

As que mudaram o que se fez, em uma linha cada:
- **348** (b1): a lista de exceções não pode ficar vazia na `main` se a PR declara
  exceção. Daí saiu o H3 inteiro da b2.
- **353** (b2): push forçado desliga o filtro do H1. Daí saiu a regra "sem push
  forçado".
- **368** (b2 → b3): o patamar do `datetimepicker`, medido na b3. É ruído.
- **373** (b3): o release não alcança `http://`, e o aparato de mock não serve para
  release. **Fechada**: aceite de release é contra prod (§7.2).
- **374** (b3): o `metro-cache` segurou a URL de prod num build de release. Parei antes
  de qualquer escrita. Virou a **regra 13 ampliada** (`LOGS-OCTAVIA.md`).

---

## 4. A div. 368, fechada por medida

`[medido: W4B3-anexos/BUILDS-analise.txt]`: debug das quatro ABIs (o comando do CI),
local, n=3 com × n=3 sem o `datetimepicker`, intercalados:

| | n | tempos (prebuild + gradle) | mediana | APK |
|---|---|---|---|---|
| com | 3 | 258 · 283 · 312 s | 283 s | 234.114.536 B |
| sem | 3 | 258 · 300 · 302 s | 300 s | 231.377.892 B |

O módulo **custa bytes** (+2.736.644 B, quase tudo C++ do codegen Fabric no
`libappmodules.so`, nas quatro ABIs) e **nenhum tempo mensurável**: a diferença de
medianas é −17 s, contra 44–54 s de dispersão dentro de cada variante. O patamar de
13m04s das dez corridas do #315 não tem causa no módulo e é **ruído**, o mesmo que as
vinte corridas (mediana 750 s) já sugeriam. **Limite**: M1 local não é o runner do CI.
A medida exclui um custo grande, não um de poucos segundos. **Fechada** (decisão do
Marcel, 2026-09-23): "ruído — medido com o comando do CI, n=3 intercalado, medianas 283 s com e 300 s sem o módulo, variação de 44–54 s; limite: máquina local, não o runner" (`CI-FAIXA.md`).

---

## 5. Onde o revisor errou

As de origem P. O que cada uma ensinou, agrupado pela lição.

| lição | divs. | o que o prompt presumiu |
|---|---|---|
| **Contar no repositório, não no handoff** | 347, 352 | a maior divergência: o grep do prompt achou 345 (era 346) e 399 (casava qualquer número de três dígitos). A que vale é a da forma `\| **N** \|` |
| **O gate irmão tem o mesmo buraco** | 215 | a div. 187 nomeava só o `g1.sh`, e o `g2g3.sh` passava sobre zero arquivos do mesmo jeito |
| **O instrumento da medição também mente** | 217 | `git log --follow` como procedência de anexo. A procedência sai do hash do blob |
| **O endereço citado não existe** | 349, 365 | "ao lado da div. 188" no `g1.sh` (ela mora no README da N2-PR1); "o commit que mudou o job" (o `native.yml` não mudou na #284) |
| **Duas exigências que não cabem juntas** | 348, 356, 357 | lista vazia na `main` **e** exceção declarada; "na base" (implementado no head, que é mais forte); "corpo **ou** trailer" (trailer exige reescrever história) |
| **Pedir o que só existe depois** | 359 | o `gh pr checks` do commit 3 dentro do próprio commit 3 |
| **Extra não declarado antes** | 350, 380 | CNs a mais e instrumentos a mais entraram e foram declarados depois |
| **A regra aplicada para trás não dá o que se esperava** | 363, 364, 366, 369 | "nenhum segmento abre" (o `setup-android@v4` passava por 1,5 s); o detector que "tem de" contar o próprio script, que já contava |
| **O resultado lido como estado inicial** | 355 | "a série inteira" nas estatísticas, com as quatro falhas sem APK dentro |
| **O registro envelhece** | **370** | o efeito (a) da div. 119, escrito no pre-check do W1, **antes** de o aparelho matar o teto de inatividade (div. 126). O palco recebe a rejeição do voo alheio, e o que "não assenta" é a falta de teto |
| **O prompt presumiu o aparelho** | 372, 375, 376 | "desinstale o dev client" (mesma chave: `install -r` mantém a sessão, e desinstalar exigiria senha); "APK/AAB por ABI" (não há AAB nem split); "a 368 com o aparato de release" (a pergunta é sobre a série de debug do CI) |

---

## 6. Gates no fim do bloco `[medido: W4B3-anexos/GATES-depois.txt]`

Sobre a árvore da #323, com o bloco `gates` dela (`g1a` em `files.ts` e
`prefetch.ts`): lint, `tsc` do teste e do core, `type-check` do nativo, suíte
**1037** passando e 85 pulados, G1a (diff vazio fora das duas exceções, ambas usadas),
G1b (só adição), G2 (79 ⊆ 79 testIDs), G3 (64 → 65 linhas `log(`, nenhuma sumiu; a
nova `lru over` está catalogada), G7, `gate:a20` e `gate:icones` verdes com os CNs
reprovando, congelados OK. No CI da #323, o `gates-nativos` passou lendo o bloco do
corpo.

---

## 7. Herança, com destino

A numeração é estável: cite por **§7.<n>**. Nada aqui repete o que já está em N3, N4
ou N5 (`N2-ENCERRAMENTO.md` §10.2–§10.8).

| # | item | origem | destino |
|---|---|---|---|
| 1 | ~~**fechar a div. 368**~~ — **fechada** pelo Marcel (2026-09-23), veredito "ruído" (§4) | §4; `CI-FAIXA.md` | — |
| 2 | ~~**mock para release**~~ — **fechada** pelo Marcel (2026-09-23): "o release não alcança `http://`; aceite de release é contra prod, só leitura, mais escrita descartável pela regra 12; o mock é do dev client" (`APARATO.md`) | div. 373 | — |
| 3 | ~~**o estouro do LRU fica só em log** (`lru over`), decisão do Marcel (2026-09-23). **Hipótese** a medir: "o indicador ◔ do T1-R17 reflete um `lru over`?"~~ — **fechado no N3 pre-check (#324)**, sem defeito: H-N3-2, `N3-PRECHECK.md` §6.1 (◔ na setlist que perdeu o arquivo, ✓ na que tem os três) | div. 380 | **N3 pre-check** |
| 4 | o **"Baixar" do S3e pega carona num voo pendurado** (o resto da div. 119 (a)): sem teto de inatividade (div. 126), o toque do usuário não escapa de um download alheio que nunca termina | div. 370 | junto de qualquer volta ao teto de download |
| 5 | uma medição **fria** do release: o `metro-cache` estava quente nas três corridas, e o `builds.sh` não o apaga | div. 374; `RELEASE-FAIXA.md` | a próxima PR que medir release |
| 6 | os `X<n>` não renomeados em `apps/native/src/escrita.ts:429` e `screens/Picker.tsx:310` | div. 350(b) | a próxima PR que tocar esses arquivos |

---

## 8. Contabilidade da W4-b3

- **Commits**: `299318d` (CNs), `3ffd7c6` (conserto), `7ab865c` (release e 368), `0a28628` (encerramento) e o
  do fecho (as decisões do Marcel). **Sem push forçado.**
- **Prod**: só `GET`. Foram **5 syncs** do Tab S6 contra prod (dev client antes, dev
  client depois, release R3, o R4 que apontou para prod por engano (div. 374) e a
  restauração do cache), cada um com um `GET /api/setlists` e um `GET /api/content`:
  **10 `GET`**. O AVD ficou em avião. **Zero escrita em prod.**
  A única escrita da PR foi contra o mock (`POST /api/setlists`, o controle positivo),
  e a tentativa do release não saiu do aparelho.
- **Builds**: 9 cronometrados (R1–R3, C1–C3, S1–S3, das 18:05 às 18:53), 1 do dev
  client do AVD, 2 de release fora da série (R4, R4b).
- **Aparelhos**: estado lido, declarado e restaurado (`W4B3-anexos/ESTADO-aparelhos.txt`).
  O dev client do AVD **fica** novo (div. 371), e o do Tab voltou ao binário de antes.
