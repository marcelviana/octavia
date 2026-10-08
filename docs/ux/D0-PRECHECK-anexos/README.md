# D0-PRECHECK-anexos — o bruto do pre-check da D-0

> **Rastro**, não fonte: a fonte é o [`D0-PRECHECK.md`](../D0-PRECHECK.md). Base `69fd3c2`; árvore `../octavia-d0-precheck`.
> Nenhuma requisição, nenhum aparelho, nenhum `.env*`. Nenhum texto, título ou artista de música real: os textos de tab
> que aparecem são do projeto (o compasso de exemplo do editor, a tablatura-fixture do gate) ou fabricados (`e|--1--|`).

| arquivo | o quê |
|---|---|
| [`leitura-estatica.txt`](leitura-estatica.txt) | os comandos e as saídas literais da Fase A (A1, A3, A4, A8) e a linha do dado de 2026-10-01 (as 2 Tabs, só chaves) |
| [`leitores-tab.txt`](leitores-tab.txt) | os dois leitores da Tab (o core e o site) sobre seis formas fabricadas de `content_data` — div. 1148 |
| [`instrumentos/leitores-tab.ts`](instrumentos/leitores-tab.ts) | o instrumento do anterior: função pura, 0 requisições; fora de CI, lint e typecheck (N4-D117) |

## Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# D-0 pre-check: nenhuma declaração — só docs.
```

```gates-web
# só docs — D-0 pre-check: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
