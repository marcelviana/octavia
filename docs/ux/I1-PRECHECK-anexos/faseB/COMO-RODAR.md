# Fase B — como rodar os probes 1 e 4 (Marcel)

Da raiz da árvore `../octavia-i1-precheck` (branch `i1/precheck`), com o Google Chrome instalado:

```bash
pnpm tsx docs/ux/I1-PRECHECK-anexos/faseB/probe1.ts
```

```bash
pnpm tsx docs/ux/I1-PRECHECK-anexos/faseB/probe4.ts
```

- **`.env.uxaudit`: nada a acrescentar.** Os scripts usam só `USER_AUDIT` e `PASSWORD_AUDIT` (login pela tela do app, sem API key). Eles acham o arquivo em `./.env.uxaudit` ou `../octavia/.env.uxaudit`, ou no caminho de `UXAUDIT_ENV=<caminho>`.
- Alvo: `https://octavia.rocks`, conta de audit. O probe 4 cria e apaga a setlist `I1-probe4` (4 escritas declaradas no topo do script). `HEADED=1` mostra o navegador.
- As saídas ficam em `faseB/probe1-out/` e `faseB/probe4-out/`. Não precisa commitar.
- O probe 5 é no Tab S6: `probe5-roteiro.txt`; cole o resultado em `probe5.txt`.
- Depois diga **"rodei"** na sessão.
