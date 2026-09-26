# CN de navegador da I1-PR1 — como rodar (Marcel)

1. **Antes** (a `main`): no checkout principal (`../octavia`, na `main`, com o seu `.env.local`), suba `pnpm dev` (porta 3000).
2. De `../octavia` (o `.env.uxaudit` é achado ali; ou `UXAUDIT_ENV=<caminho>`), rode `pnpm tsx /Users/marcelviana/projects/octavia-i1-pr1/docs/ux/I1-PR1-anexos/cn/ramo-b.ts antes`.
3. **Pare e suba de novo o `pnpm dev`** — a cota de `/api/profile` (60/15 min) é memória do processo; reiniciar a limpa, sem esperar 15 min — e rode `…/cn/ramo-c.ts antes`.
4. **Depois** (a branch, após o commit 2): pare o dev server da `main` e suba `pnpm dev` na árvore `../octavia-i1-pr1`. Ela **não tem `.env.local`**: levá-lo para lá (cópia ou link) é passo seu — o executor não abre `.env*`.
5. Rode `…/cn/ramo-b.ts depois`; reinicie o dev server; rode `…/cn/ramo-c.ts depois`.
6. Cada rodada começa pelo **controle positivo** (dois `GET /api/health`): se o log não os vir, o script para antes do login. `CN_SO_CONTROLE=1` roda só o controle, sem login.
7. Escrita declarada: nenhuma. O `POST /api/auth/session` é respondido no navegador (500 / 429); `POST /api/profile` ou outra escrita a `/api/*` é abortada e dá exit 1. Nenhum request a `octavia.rocks` passa (é abortado e contado).
8. Saída em `cn/out-antes/` e `cn/out-depois/`: `ramo-<b|c>-resumo.txt`, `-requests.txt`, `-console.txt` e capturas (`-15s…-60s.png`, `-fim.png`, com email e senha mascarados). `HEADED=1` mostra o navegador.
9. Critério no fim de cada `resumo.txt`: antes, ≥ 50 voltas e ≥ 50 `GET /api/profile`; depois, 1 `POST`, 0 `GET /api/profile`, 0 navegações, 1 frase.
10. Depois diga **"rodei"** na sessão.
