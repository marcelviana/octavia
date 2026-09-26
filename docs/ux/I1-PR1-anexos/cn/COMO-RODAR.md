# CN de navegador da I1-PR1 — como rodar o aceite (Marcel)

1. O aceite é só o **depois** (aval do commit 1): o *antes* já está medido pelo probe 1 em prod (`I1-PRECHECK-anexos/faseB/probe1-out/`) e pelo CN de tela na `main` (`../CN-antes.txt`). A 1ª rodada do ramo b (capturas dentro da árvore vigiada) é rastro em `cn/out-depois-rodada1/`.
2. Na árvore `../octavia-i1-pr1` (branch `i1/pr1-sessao`), com o seu `.env.local` copiado para lá (div. 523 — passo seu; o executor não abre `.env*`), suba `pnpm dev` (porta 3000).
3. Em outro terminal, de qualquer diretório (o terminal do app volta ao checkout principal — div. 530), com o caminho **absoluto**: `pnpm tsx /Users/marcelviana/projects/octavia-i1-pr1/docs/ux/I1-PR1-anexos/cn/ramo-b.ts` (o `.env.uxaudit` é achado em `./` ou `../octavia/`; ou `UXAUDIT_ENV=<caminho>`). A saída vai para a pasta do script, não para o diretório do terminal.
4. **Pare e suba de novo o `pnpm dev`** — a cota de `/api/profile` é memória do processo (div. 524) — e rode `pnpm tsx /Users/marcelviana/projects/octavia-i1-pr1/docs/ux/I1-PR1-anexos/cn/ramo-c.ts`.
5. Cada rodada começa pelo **controle positivo** (dois `GET /api/health`): se o log não os vir, o script para antes do login. `CN_SO_CONTROLE=1` roda só o controle.
6. Escrita declarada: nenhuma. O `POST /api/auth/session` é respondido no navegador (500 / 429); `POST /api/profile` ou outra escrita a `/api/*` é abortada e dá exit 1. Nenhum request a `octavia.rocks` passa (é abortado e contado).
7. Durante a medição o script não grava nada na árvore (o `next dev` a vigia — div. 531); ao fim copia tudo para `cn/out-depois/`: `ramo-<b|c>-resumo.txt`, `-requests.txt`, `-console.txt` e capturas (`-15s…-60s.png`, `-fim.png`, email e senha mascarados). `HEADED=1` mostra o navegador.
8. Critério no fim de cada `resumo.txt`: 1 `POST /api/auth/session`, 0 `GET /api/profile`, 0 navegações, 1 frase (a linha de aviso com a razão).
9. O argumento `antes` ainda existe (grava em `cn/out-antes/`), mas não faz parte do aceite.
10. Depois diga **"rodei"** na sessão.
