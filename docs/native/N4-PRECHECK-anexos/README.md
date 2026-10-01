# N4-PRECHECK — anexos

**Rastro**, não fonte: a fonte é o [`N4-PRECHECK.md`](../N4-PRECHECK.md). Cada arquivo traz o comando na primeira
linha de cada bloco (`$ …`) e a saída literal desta sessão (2026-10-01, árvore `../octavia-n4-precheck` sobre
`046797e`). **Nenhum carrega texto de música**: as fixtures são escritas pelo projeto, e as contagens sobre JSON já
commitado imprimem só números e nomes de chave (regra 10).

| arquivo | seção | o quê |
|---|---|---|
| [`a1-content-no-nativo.txt`](a1-content-no-nativo.txt) | A1 | quem lê content no nativo (`git grep -c`), a única chamada à API, o `is_favorite` fora do nativo |
| [`a2-palco-por-tipo.txt`](a2-palco-por-tipo.txt) | A2 | as fixtures commitadas contadas por tipo × corpo × arquivo × extensão; os ramos do palco por tipo; os testes que montam o palco |
| [`a3-palco-sem-setlist.txt`](a3-palco-sem-setlist.txt) | A3 | os trechos da rota `Stage`, das props do `StageScreen` e da hospedeira `lista[0]` |
| [`a4-cadastro.txt`](a4-cadastro.txt) | A4 | as 22 colunas (dump e types), o Zod, o que a visualização do web mostra, o que o editor e o upload enviam |
| [`a5-a6-favoritar-get.txt`](a5-a6-favoritar-get.txt) | A5, A6 | o favoritar do web dos dois lados, o `PUT`, o Zod, o limite; o `GET /api/content`; o picker do web × o do nativo |
| [`a7-offline.txt`](a7-offline.txt) | A7 | o store, o prefetch, o LRU, o `CAP_BYTES`, a ausência do teto de download |
| [`a8-navegacao.txt`](a8-navegacao.txt) | A8 | a pilha, S1 por faixa, os 8 dumps da base do G-inv com nó de S1 |
| [`a9-frases.txt`](a9-frases.txt) | A9 | a contagem dos dois conjuntos (script `tsx` verbatim), os trechos do vocabulário, a composição do motivo |
| [`a10-linha-de-aviso.txt`](a10-linha-de-aviso.txt) | A10 | as duas `LinhaDeAviso` e os usos |
| [`a11-undefined.txt`](a11-undefined.txt) | A11 | os `undefined` do `TokensDaFaixa`, quem os lê, o gerador de CSS |
| [`a12-gates.txt`](a12-gates.txt) | A12 | os gates nativos e web na `main`, com o exit real |
| [`a12-g-par.txt`](a12-g-par.txt) | A12 | quem produz o texto do corpo em cada lado; o web sem import do core; o núcleo do G-back |
| [`a12-g-par-fixture.txt`](a12-g-par-fixture.txt) | A12, A14 | o G-par em esboço sobre fixture fabricada (script verbatim): **6 de 13 iguais** |
| [`a14-contrato-fixture.txt`](a14-contrato-fixture.txt) | A14 | `isValidContent`/`bodyOf` sobre fixture fabricada (script verbatim) |
| [`a15-capturas.txt`](a15-capturas.txt) | A15 | as capturas commitadas por aparelho, XML × PNG |
| [`cabecalhos.txt`](cabecalhos.txt) | todas | o `grep` de cada cabeçalho de seção citado |

**Os scripts** (`tsx`, A9, A12, A14) rodaram como arquivo temporário na raiz da árvore e foram apagados; o texto
de cada um está verbatim no cabeçalho do anexo que ele produziu. Os trechos de código foram tirados com
`awk 'NR>=a&&NR<=b'` e levam `arquivo:linha` em cada linha.

## Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# N4 pre-check: nenhuma declaração — só docs.
```

```gates-web
# só docs — N4 pre-check: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
