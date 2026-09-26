# I1-PRECHECK — anexos

Rastro do levantamento da Fase A (`docs/ux/I1-PRECHECK.md`). Sha do levantamento:
`c57d81f3f481293585459a1f689c56133f354264`. Cada arquivo traz na primeira linha, comentado, o
comando que o gerou. Saída literal; nenhum anexo carrega texto de música de terceiro (os literais
de editor em `frases-web.txt` são fixture do próprio projeto).

O grafo de todos os inventários da A2, A4, A5, A6 e A9 é um só:

```
pnpm exec depcruise --config .dependency-cruiser.cjs --output-type json \
  app components hooks lib contexts types middleware.ts tests __tests__ > dc-all.json
```

Os dois scripts rodaram do scratchpad da sessão, fora do repositório; o texto deles está aqui como
`.txt` (rastro, não código do app).

| anexo | seção | gerado por |
|---|---|---|
| `rotas.txt` | §1 (A1) | `find app -name 'page.tsx' -o -name 'route.ts' -o -name 'layout.tsx' -o -name 'loading.tsx' -o -name 'error.tsx' -o -name 'not-found.tsx' -o -name 'template.tsx' \| sort`; contagens por `wc -l` |
| `palco-exclusivos.txt` | §2 (A2) | `node script-a2 dc-all.json <dir>` — `script-a2.txt` |
| `palco-compartilhados.txt` | §2 (A2) | idem (inclui os 19 órfãos do grafo, só para registro) |
| `palco-testes.txt` | §2 (A2) | idem (testes classificados pelos imports diretos) |
| `script-a2.txt` | §2 | o texto do script da A2 |
| `matriz-estados.txt` | §3 (A3) | leitura de código (agente de leitura desta sessão); citações conferidas mecanicamente — cabeçalho do arquivo |
| `superficies.txt` | §3–§6 | `node script-a456 dc-all.json palco-exclusivos <dir>` — `script-a456.txt` (mapa arquivo → superfícies) |
| `frases-web.txt` | §4 (A4) | idem (extração por AST do TypeScript) |
| `icones-web.txt` | §5 (A5) | idem (imports de `lucide-react`) |
| `literais-web.txt` | §6 (A6) | idem (contagens por regex, colunas no cabeçalho) |
| `script-a456.txt` | §4–§6 | o texto do script da A4/A5/A6 |
| `playwright-config.txt` | §8 (A8) | `find . -name 'playwright*.config.*' -not -path '*/node_modules/*'; cat playwright.ux-audit.config.ts` |
| `playwright-inventario.txt` | §8 (A8) | os comandos de cada bloco, no próprio arquivo |
| `ci-tempos.txt` | §8 (A8) | `gh run list --workflow=ci.yml --event pull_request --limit 10` + `gh run view <id> --json jobs` |
| `g-back-lista.txt` | §9 (A9) | alcance do grafo a partir das 14 rotas + `middleware.ts`; `git ls-files supabase` |

## Bloco ```gates``` desta PR (cópia verbatim do corpo)

Regra do `LOGS-OCTAVIA.md` (*"Toda PR copia o seu bloco ```gates``` para o README dos anexos"*,
decisão do Marcel, 2026-09-23):

```gates
# I1 pre-check: nenhuma declaração — só docs
```
