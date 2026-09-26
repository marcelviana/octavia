# Aceite A com sessão da I1-PR3 — como rodar (Marcel)

O executor não faz login nem abre `.env*` (I1-D35). A parte sem sessão já está em `../aceite-a.txt`
e em `out-publico/`. Esta é a parte que precisa da conta de audit.

1. Na árvore `../octavia-i1-pr3` (branch `i1/pr3-corte`), com o seu `.env.local` copiado para lá
   (passo seu), suba **`pnpm dev`** (porta 3000). `pnpm start` não serve em http local (div. 570).
2. Em outro terminal, com o caminho **absoluto**:
   `node /Users/marcelviana/projects/octavia-i1-pr3/docs/ux/I1-PR3-anexos/aceite/aceite-a.mjs sessao`
   (o `.env.uxaudit` é procurado em `UXAUDIT_ENV`, `./.env.uxaudit` e `../octavia/.env.uxaudit`).
   `HEADED=1` mostra o navegador.
3. O script loga pela tela, escolhe um content `[UX-AUDIT]` de cada tipo (Lyrics, Chords, Tab e Sheet com
   PDF) e captura `/content/[id]` × 4, `/content/[id]/edit`, `/setlists`, `/dashboard` e `/library`, a
   1138 px. O email aparece mascarado nas capturas.
4. **Escrita declarada: nenhuma.** Os `POST`/`DELETE` de `/api/auth/session` são cookie e passam. Qualquer
   outra escrita a `/api/*` é abortada no navegador e dá `exit 1`. Requests a `octavia.rocks` são abortados
   e contados. Fora de localhost saem as leituras do Firebase Auth e do PDF no storage.
5. Durante a medição nada é gravado na árvore. Ao fim, tudo vai para `aceite/out-sessao/`: `resumo.txt` e
   os PNGs.
6. O critério está no `resumo.txt`:
   - `content-sheet` com `canvas do PDF visível (n)` e `"Failed to load file" na tela: 0`;
   - os outros tipos com `título visível`;
   - `setlists` com `botões "Start Performance": 0`;
   - a contabilidade com 0 escritas e 0 requests a `octavia.rocks`.
7. A 1ª rodada (2026-09-26) parou antes do login: a hidratação do `#email` não veio em 60 s (`out-sessao-rodada1/`, rastro). O script agora aquece o `/login` e espera até 180 s. Nenhuma credencial foi digitada nessa rodada.
8. Depois diga **"rodei"** na sessão.
