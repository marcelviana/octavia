# Fase B — como rodar os probes 1 e 4 (Marcel)

> **Os probes 1 e 4 já rodaram (2026-09-26); rodar de novo escreve na conta de audit e consome cota.**

De qualquer diretório (o terminal do app não manteve o `cd`: use o caminho absoluto), com o Google Chrome instalado:

```bash
pnpm tsx /Users/marcelviana/projects/octavia-i1-precheck/docs/ux/I1-PRECHECK-anexos/faseB/probe1.ts
```

```bash
pnpm tsx /Users/marcelviana/projects/octavia-i1-precheck/docs/ux/I1-PRECHECK-anexos/faseB/probe4.ts
```

- **`.env.uxaudit`: nada a acrescentar.** Os scripts usam só `USER_AUDIT` e `PASSWORD_AUDIT` (login pela tela do app, sem API key). Eles acham o arquivo em `./.env.uxaudit` ou `../octavia/.env.uxaudit`, ou no caminho de `UXAUDIT_ENV=<caminho>`.
- Alvo: `https://octavia.rocks`, conta de audit. O probe 4 cria e apaga a setlist `I1-probe4` (4 escritas declaradas no topo do script). `HEADED=1` mostra o navegador.
- As saídas ficam em `faseB/probe1-out/` e `faseB/probe4-out/`. O probe 1 consome a cota de `/api/profile` da audit (60/15 min): espere 15 min antes do probe 4.
- O probe 5 foi cancelado (errata da I1-D14).
- Depois diga **"rodei"** na sessão.
