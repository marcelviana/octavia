# SY-PRECHECK — anexos

Os anexos do pre-check do SY (`docs/native/SY-PRECHECK.md`). **Todos são saída literal de comandos desta sessão**
(2026-10-10, árvore `../octavia-sy-precheck`, sobre `origin/main` = `98c9f7f10097fa331c24b8ae6d0b83e8b6f21ac9`); a leitura
deles está no documento. Nenhum aparelho, nenhuma requisição a prod, nenhum texto de música (regra 10): só código, docs e a
biblioteca `expo-network` instalada.

| arquivo | o quê | seção |
|---|---|---|
| [`a1-greps.txt`](a1-greps.txt) | os `git grep` e `grep` do §A6 do `QL-PRECHECK.md`, refeitos na ponta da `main` (o `AppState`, o `RefreshControl`, os timers, quem chama `sincronizar`, o cabeçalho e o ouvinte do `net.ts`, a `naoRegredir`, a geração da escrita, o efeito de troca do palco, o placeholder da setlist) | A1, A4, A5, A6 |
| [`a2-a4-leituras.txt`](a2-a4-leituras.txt) | o que o `expo-network` 57.0.1 entrega no Android (`Network.types.d.ts`, `NetworkModule.kt`, `NetworkUtils.kt`), o `AppState` do `react-native` 0.86.3, os 30 s do web, o nome do objeto no upload, o plano de downloads, o sync sem prazo, o duplo sem `AppState` e os 0 testes que montam o `App.tsx` | A2, A4, A5, A6, A8 |
| [`divs-faixa.txt`](divs-faixa.txt) | a faixa de divergências conferida na coluna e em prosa: a última usada é a 1255, nada ≥ 1256 | cabeçalho, §5 |
| [`suite-tsc-lint.txt`](suite-tsc-lint.txt) | `pnpm install --frozen-lockfile`, a suíte, o `tsc` de dentro de cada pacote e o lint, com os `exit` | §3 |
| [`diff-fora-de-docs.txt`](diff-fora-de-docs.txt) | `git diff --stat origin/main -- . ':!docs'` com o commit montado → vazio | §3 |
| [`aval-blocos-decl.txt`](aval-blocos-decl.txt) | **commit 2** — os dois extratores de declaração sobre o corpo da #378 (nenhuma declaração, `exit=0`) e o controle: a chave recuada é recusada | §7 |
| [`aval-verificacao.txt`](aval-verificacao.txt) | **commit 2** — os checks do commit 1, o diff fora de `docs/` vazio, as 31 decisões sem lacuna, as 15 *"Respondida"*, a faixa de divergências | §3, §5.1, §8 |

## Os blocos de declaração da PR, verbatim

A cópia que a regra do W4-b2 pede (*"toda PR copia o seu bloco ```` ```gates ```` para o README dos anexos"*):

```gates
    # SY pre-check: nenhuma declaração — só docs.
```

```gates-web
    # só docs — SY pre-check: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
