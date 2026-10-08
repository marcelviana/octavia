# QL-BRIEF-anexos — as amostras de texto por largura

O insumo do brief do Claude Design no QL ([`../QL-BRIEF.md`](../QL-BRIEF.md)). **Só texto inventado pelo projeto**:
nenhuma linha de música real, nenhum título nem artista real (`CLAUDE.md`, "Anexo não carrega texto de música";
`D0-ENCERRAMENTO.md` §8.2 item 7). Nenhum aparelho, nenhuma requisição a prod.

| arquivo | o quê |
|---|---|
| `instrumentos/amostras.mjs` | monta os textos de exemplo do brief (Letra, Cifra, Tab, nota), **confere o comprimento** de cada linha que o brief promete (sai com erro se não bater) e imprime cada texto **como está hoje** — a linha inteira, que rola — com a régua das larguras do zoom 22 (26 · 48 · 55 · 80) e, na Cifra, onde um corte cairia dentro de um acorde. Sem dependência: `node docs/native/QL-BRIEF-anexos/instrumentos/amostras.mjs > docs/native/QL-BRIEF-anexos/amostras.txt`, da raiz |
| `amostras.txt` | a saída — o "antes" em texto (§6 do brief, completo) |
| `suite-tsc-lint.txt` | `pnpm test`, os quatro `tsc` (de dentro de cada pacote), o `pnpm lint` e o `git diff --stat origin/main -- . ':!docs'` (vazio) nesta árvore |

O script é **de anexo** (roda à mão; fora de CI, lint e typecheck — N4-D117): se um bloco seguinte o reaproveitar, ele
sai de `docs/`.

## O bloco ```` ```gates ```` desta PR (verbatim, regra do W4-b2)

```gates
# QL brief: nenhuma declaração — só docs.
```

```gates-web
# só docs — QL brief: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
