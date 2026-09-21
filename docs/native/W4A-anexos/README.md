# W4A-anexos — o bruto do W4-a

PR de **instrumento**, gate-first: sem tela, sem produto, sem uma linha de
comportamento do app. Os três defeitos que ela conserta foram **medidos na
N2-PR1** (divs. 187, 189, 195) e ficaram registrados lá como "não corrigida,
fora da lista fechada". Esta é a PR que os corrige, e o que prova a correção
são os controles negativos — **controle negativo que não reprova é instrumento
quebrado** (div. 127).

| arquivo | o que traz |
|---|---|
| `W4A-A-cn-antes.txt` | os três CNs + o controle positivo contra os gates da `main` (`7039a82`): **os três passam quando deviam reprovar** |
| `W4A-B-cn-depois.txt` | os mesmos quatro contra os gates desta PR: os três recusam, o positivo passa |
| `W4A-C-gates-e-suite.txt` | G1a/G1b, G2/G3, `gate:a20` (+CN), `gate:icones` (+CN), G7 e a suíte completa |

O instrumento é `apps/native/scripts/__cn__/cn-w4a.sh`, **de mão**, fora do CI
pela razão já declarada no `ci.yml` para os CN do G1/G2/G3: ele fabrica um par
de refs — três commits numa worktree descartável — e um job que fabrica commit
para provar um ponto não é gate.

## O placar dos quatro controles

| | contra a `main` (`7039a82`) | contra esta PR |
|---|---|---|
| **CN-187** `g1.sh` sem argumento | `exit 0` · "DIFF VAZIO ✓", "só adição ✓" sobre **0 arquivos** | `exit 2` · uso impresso |
| **CN-187** `g2g3.sh` sem argumento | `exit 0` · "antes ⊆ depois ✓", "nenhuma linha sumiu ✓" com `antes=0 depois=0` | `exit 2` · uso impresso |
| **CN-189** errata sem substituta | `exit 0` · "as que sumiram estão na lista de erratas ✓" | `exit 1` · `ERRATA SEM SUBSTITUTA ✗` |
| **CN-195** errata órfã | silêncio | `ERRATA DECLARADA E NÃO USADA`, **sem reprovar** |
| **CP-189** errata com substituta *(controle POSITIVO)* | `exit 0` ✓ | `exit 0` ✓ |

O CP-189 é o que impede a "correção" fácil: um gate apertado até barrar a
errata honesta teria trocado um defeito por outro.

## Divergências — 215 a 220

A maior divergência na `main` antes desta PR era a **214** (hotfix-150, #311);
as do brief do N2 foram até a 211. Esta PR começa na **215**.

| div. | T/P/D | o que | o que foi feito |
|---|---|---|---|
| **215** | P | o **`g2g3.sh` tem o mesmo buraco da div. 187**, que nomeava só o `g1.sh`: sem argumento ele imprime `G2: antes ⊆ depois ✓` e `G3: nenhuma linha sumiu ✓` com `antes=0 depois=0`, e sai 0. Dois gates irmãos, um defeito, meio registro | **fechada**: a mesma guarda nos dois, e ela recusa também ref que não resolve — é o mesmo "passa sem medir" por outro caminho. Extra declarado |
| **216** | T | a errata em par **fecha a saída de emergência** que a proposta pendente da div. 83 citava como o remédio ruim disponível (declarar uma errata falsa para um SUMIU vindo de comentário). Com o par, a errata falsa não basta: seria preciso inventar também uma substituta e fazê-la aparecer entre as adicionadas | registrada **a favor da proposta**, que segue PENDENTE — o W4-a não decide a 83 (sem caso real; ZERO menções a `log(` em comentário, medido de novo). Escrito no `g2g3.sh`, ao lado do texto da 83, e no `W3-ENCERRAMENTO.md` §7 item 8 |
| **217** | P | **o instrumento da própria medição da div. 211 mentiu.** `git log --follow` nos três XML devolve quatro commits e uma linhagem que vai até a V1-PR1 — mas a "origem" que ele aponta é `V1-PR1-anexos/dumps-depois/S3-placeholder-invalido-nobody.xml`, arquivo **sem relação**, casado pela heurística de similaridade do `--follow`. A procedência verdadeira sai de `git rev-parse <commit>:<arquivo>` | registrada. **É o caso 23 aplicado ao próprio ato de medi-lo** — e a lição prática: para procedência de anexo, `--follow` é palpite; o hash do blob é medição |
| **218** | D | a **premissa da div. 211** ("três dumps que já eram idênticos") sugere convergência. Medido: os três **nasceram idênticos** num único commit (`8f62e3c`, V1-PR7) e **nunca** foram diferentes; e não poderiam ser — 72 nós, todos `package="rocks.octavia.app"`, **sem barra de status, sem relógio, sem um atributo que varie com o tempo** | **fechada**: errata em `V1-PR7-anexos/README.md` dizendo o que sustenta cada parte do A16 (o `dumpsys`, o `a16.sh`, o relógio das PNGs — e o XML só a invariante "é a mesma tela"). **O A16 não cai**; o que prometia demais era o nome do arquivo. Caso 23 do catálogo |
| **219** | D | o `W3-ENCERRAMENTO.md` **não tem lista de "heranças"** — a proposta de revisão da 83 é o **item 8 da §7 "Dívida"** (e a §3a). O prompt do W4-a a chama de "herança 5"; não há ocorrência de "herança" no arquivo | registrada; a errata foi escrita no item 8, que é onde a dívida de fato mora |
| **220** | D | **a div. 194 está no código, não só no PRD.** O docstring de `buildIndex` (`packages/core/src/search.ts:29`) diz *"Reconstruído por item a cada invalidação (T1-R10)"* — três linhas acima de `contents.map(...)`, que reconstrói o conjunto inteiro. É a div. 142 outra vez: registro que descreve o que o código ao lado desmente | registrada, **não corrigida aqui**. Consertar um comentário em `packages/core/src` poria um arquivo no diff do G1a e obrigaria a declarar exceção numa PR que se orgulha de não ter nenhuma. **Destino: W4-b** |

## O que esta PR NÃO fez, e está declarado

- **não decidiu a div. 83** (div. 216) — sem caso real, e não por quem acabou
  de mexer no gate;
- **não corrigiu o docstring do `buildIndex`** (div. 220) — custo de escopo
  desproporcional ao conserto;
- **não tocou** a div. 119, o `lruEvict`, o build de release nem o B8.1 — são
  do W4-b, por decisão do prompt.
