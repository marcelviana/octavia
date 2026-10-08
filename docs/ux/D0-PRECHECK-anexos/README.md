# D0-PRECHECK-anexos — o bruto do pre-check da D-0

> **Rastro**, não fonte: a fonte é o [`D0-PRECHECK.md`](../D0-PRECHECK.md). Base `69fd3c2`; árvore `../octavia-d0-precheck`.
> Nenhuma requisição, nenhum aparelho, nenhum `.env*`. Nenhum texto, título ou artista de música real: os textos de tab
> que aparecem são do projeto (o compasso de exemplo do editor, a tablatura-fixture do gate) ou fabricados (`e|--1--|`).

| arquivo | o quê |
|---|---|
| [`leitura-estatica.txt`](leitura-estatica.txt) | os comandos e as saídas literais da Fase A (A1, A3, A4, A8) e a linha do dado de 2026-10-01 (as 2 Tabs, só chaves) |
| [`leitores-tab.txt`](leitores-tab.txt) | os dois leitores da Tab (o core e o site) sobre seis formas fabricadas de `content_data` — div. 1148 |
| [`instrumentos/leitores-tab.ts`](instrumentos/leitores-tab.ts) | o instrumento do anterior: função pura, 0 requisições; fora de CI, lint e typecheck (N4-D117) |
| [`m0-editor.txt`](m0-editor.txt) | **M0** (commit 2): o editor de Tab medido — 12 corridas, 10 salvamentos, o corpo, o status e a mensagem da rota (divs. 1147, 1149, 1152) |
| [`instrumentos/m0-editor.medir.tsx`](instrumentos/m0-editor.medir.tsx) · [`instrumentos/m0.vitest.config.mts`](instrumentos/m0.vitest.config.mts) | o instrumento do M0 e a config própria dele — **sem sufixo `.test`**, para o `pnpm test` não o coletar (div. 1154) |
| [`instrumentos/m1-consulta.sql`](instrumentos/m1-consulta.sql) | **M1**: a consulta só de leitura que o Marcel roda no console |
| [`instrumentos/m1-fixture-local.sql`](instrumentos/m1-fixture-local.sql) · [`m1-prova-local.txt`](m1-prova-local.txt) | a fixture fabricada e a prova da consulta num Postgres local descartável (nenhum marcador de texto na saída) |
| [`campos-nulos.txt`](campos-nulos.txt) · [`instrumentos/campos-nulos.ts`](instrumentos/campos-nulos.ts) | §9.5: cada campo do corpo do editor, com a coluna `null`, contra o esquema real — só a dificuldade recusa |
| [`m1-saida-marcel.txt`](m1-saida-marcel.txt) | a saída das três consultas, como o console devolveu ao Marcel (contagens; a coluna `principal` não conferida) |
| [`instrumentos/m1-consulta-3.sql`](instrumentos/m1-consulta-3.sql) · [`instrumentos/m1-fixture-local-3.sql`](instrumentos/m1-fixture-local-3.sql) · [`m1-prova-local-3.txt`](m1-prova-local-3.txt) | a consulta 3 (o cruzamento), a fixture fabricada a mais e a prova local |
| [`fixtures-nomes-reais.txt`](fixtures-nomes-reais.txt) | D0-D14: arquivo:linha de todo nome real de autor em fixture, sem o texto da linha (div. 1153) |

## Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# D-0 pre-check: nenhuma declaração — só docs.
```

```gates-web
# só docs — D-0 pre-check: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
