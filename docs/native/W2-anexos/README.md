# W2-anexos — o bruto da PR da W2

> **Rastro de medição, não fonte.** A fonte do bloco será o `W2-ENCERRAMENTO.md`,
> quando existir; até lá, a fonte desta PR é a mensagem dos cinco commits e o
> [`W2-PRECHECK.md`](../W2-PRECHECK.md) (que esta PR versiona junto). Onde isto e
> o encerramento divergirem, **o encerramento vence** — regra permanente do
> `CLAUDE.md`.
>
> **Data**: 2026-09-15. **Aparelho**: AVD `octavia_tab32` (emulator-5554),
> 2560 × 1600 @ 360 dpi. **Tab S6: zero comandos.** **Modo avião a sessão
> inteira, conferido pelo `ping`.** Zero requests a prod, zero downloads de
> bucket, zero pushes.

| arquivo | o que traz |
|---|---|
| `W2-A-gates-e-controles-negativos.txt` | os **três** CN do commit 1 (o do G3, o do `gate:a20` e o do MECANISMO), reprovando antes e acusando depois; os gates por commit; G5/G6; e o que a PR **não** consertou nos gates |
| `W2-B-aceites.txt` | A13 (12/12 do cache em avião — fecha a dívida 5 do W1), A15, A20, A14/A8, e os cinco aceites novos W2-A1…A5 |
| `W2-C-barra-e-arvore.txt` | a barra e a árvore no aparelho: **seis variantes do S3 × dois temas, antes × depois**; o CN do A15; a correção da frase da fronteira; o store; e o **retrato**, que prova que não há número cravado |
| `W2-D-a-mensagem-no-aparelho.txt` | o que o músico lia e o que passa a ler, com captura; o **host do bucket** que ninguém tinha visto (div. 137); os três instrumentos que não enxergaram a mesma cadeia (138, 139); e o CN do teste |
| `W2-E-contabilidade.txt` | prod, bucket, aparelhos, repositório, a faixa de CI e o que esta sessão mudou na máquina |

| pasta | o que traz |
|---|---|
| `dumps-avd/` | 25 `uiautomator dump`, prefixo `ANTES-` (código de `f58259e`) e `DEPOIS-` (esta PR), servidos pelo **mesmo Metro** |
| `instrumentos/` | `barra.mjs` (detalhe dos sete controles) e `compacto.mjs` (uma linha por estado) — escritos nesta PR |

| captura | o que mostra |
|---|---|
| `S3d-ANTES-a-fileira-continua.png` · `S3d-DEPOIS-a-barra-em-dois-grupos.png` | a barra inteira, antes e depois |
| `S3e-ANTES-a-mensagem-crua.png` · `S3e-DEPOIS-a-frase-do-musico.png` | recorte 2× da linha de erro. **A captura é o único instrumento que enxergou a mensagem crua** — ver `W2-D` §3 |

## O que esta PR NÃO mediu, e vai declarado

- **A metade de TEMPO do A15** (`< 100 ms`): a div. 37 proíbe medir latência de
  frame no emulador e o Tab S6 está fora desta PR. Amostras e referência em
  `W2-B`.
- **A corrida de CI desta PR**: ela não foi empurrada. A faixa citada é a
  herdada, `n = 14`.
- **O build de release** e o `T₁` da opção C: fora do escopo, `n = 0` de rede
  real (div. 132).
