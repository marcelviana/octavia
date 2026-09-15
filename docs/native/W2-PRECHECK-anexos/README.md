# W2-PRECHECK-anexos — o bruto do pre-check da W2

> **Rastro de medição, não fonte.** A fonte deste pre-check é o
> [`W2-PRECHECK.md`](../W2-PRECHECK.md); a fonte do bloco será o
> `W2-ENCERRAMENTO.md`, quando existir. Onde isto e o pre-check divergirem, o
> pre-check vence — e onde o pre-check divergir do encerramento, o encerramento
> vence (regra permanente do `CLAUDE.md`).
>
> **Data**: 2026-09-15. **Worktree**: `../octavia-w2`, detached em `f58259e`.
> **Nada foi commitado, nada foi enviado a aparelho nenhum, zero requests a prod
> e zero downloads de bucket.** Cada arquivo abre com o comando que o gerou.

| arquivo | o que traz |
|---|---|
| `W2-A-gates-e-escopo.txt` | H1 — o inventário de todo arquivo fora de `src/`, quem varre por caminho fixo e quem varre por padrão, as 54 linhas `log(` contra as 57 reais, e **os dois controles negativos que reprovam hoje** |
| `W2-B-gates-como-teste.txt` | H2 — o projeto `native` do vitest medido, o que roda no CI e o que não roda, e a **sonda de cinco `it`** que lê os três arquivos de `docs/` e roda os dois gates como subprocesso (5/5, 147 ms) |
| `W2-C-barra-e-arvore.txt` | H3/H4 — a geometria da barra por três fontes independentes (tokens, dump do V1-PR7, extração nova), quais três podem ficar inertes, a conta da Proposta A, e a sub-árvore de acessibilidade **idêntica** nos dois estados |
| `W2-D-mensagem-crua.txt` | H5 — onde a mensagem em inglês nasce, por onde passa até o `testID="download-erro"`, as **duas classes** da família, e por que nenhum escopo do `gate:a20` a alcança |
| `W2-E-ci-e-contabilidade.txt` | a corrida da #301 conferida no `gh` (9m19s), a faixa recalculada para `n = 14`, o `T₁` que continua em `n = 0`, e a contabilidade de prod, bucket, aparelhos e repositório |

## O que este pre-check NÃO mediu, e vai declarado

- **Nada no aparelho.** O `adb` não está no PATH desta sessão e não foi invocado
  uma vez; o AVD `octavia_tab32` estava de pé antes e ficou igual depois. A
  geometria e a árvore de acessibilidade vieram de **dumps já commitados** pelo
  V1-PR7, relidos com script novo.
- **Os cinco sha256 do store** não foram reconferidos — ler o store exige
  `adb shell`. A baseline do fim do W1 está intacta por construção, não por
  verificação.
- **O build de release** (a opção (b) da decisão 1 do W1) não foi medido: exige
  instalação, e este pre-check não instala nada.
