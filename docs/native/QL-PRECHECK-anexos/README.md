# QL-PRECHECK — anexos

O bruto do pre-check do bloco QL (a quebra de linha), Fase A. A fonte é o [`../QL-PRECHECK.md`](../QL-PRECHECK.md); aqui
fica o que ele cita como `[medido]`. **Nenhum anexo carrega texto de música** (`CLAUDE.md`): os dumps lidos são os do
mock, com a fixture escrita pelo projeto, e as saídas só trazem contagens e comprimentos.

| arquivo | o quê | seção |
|---|---|---|
| `instrumentos/corpos-dos-dumps.py` | lê o nó `corpo` de cada dump e conta linhas, a maior e quantas passam de 26/48/55/80 colunas | A1, A8 |
| `a8/corpos-dos-dumps.txt` | a saída sobre a B3, a B5 e os `dumps-g-inv` finais da N4-PR9 | A1.3, A8.1 |
| `a7/detector.txt` | o detector `mudou-nativo` em todas as 61 corridas `pull_request` do `native.yml` desde o merge da W4-b2, com a contagem | A7 |
| `fase-b/q1-linhas-por-tipo.sql` · `q2-cifra-pares.sql` · `q3-notas.sql` | as três consultas da Fase B, prontas para o Marcel colar (a conta principal escrita; nada a substituir) | §3 |
| `fase-b/prova-local/gerar.mjs` | gera a fixture da prova (o `g-par.json` do core + linhas do projeto + uma de outra conta) e o esperado pelo `bodyOf` do core — `npx tsx docs/native/QL-PRECHECK-anexos/fase-b/prova-local/gerar.mjs`, da raiz | §3 |
| `fase-b/prova-local/fixture.json` · `esperado.json` · `saida-psql.txt` | a fixture, o esperado e a saída das três consultas num Postgres 17.11 local e descartável | §3 |
| `suite-tsc-lint.txt` | `pnpm test`, os quatro `tsc` e o `pnpm lint` nesta árvore | §4 |

Os scripts daqui são **de anexo** (rodam à mão; fora de CI, lint e typecheck — N4-D117): se um bloco seguinte reaproveitar
algum, ele sai de `docs/`.

**A leitura do sync (A6)** foi feita por um agente de leitura com roteiro fixo; o relatório dele não entra como anexo — o
que o documento usa dele está citado com arquivo e linha, e foi conferido pelo executor nesta sessão.

## O bloco ```` ```gates ```` desta PR (verbatim, regra do W4-b2)

```gates
# QL pre-check: nenhuma declaração — só docs.
```

```gates-web
# só docs — QL pre-check: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
