# I1-PR1 — anexos: o loop mudo do `POST /api/auth/session`

> **Bloco** I1 — identidade; **PR** [#336](https://github.com/marcelviana/octavia/pull/336), branch `i1/pr1-sessao`,
> árvore `../octavia-i1-pr1`, criada de `origin/main` = `089f72cdf463b176f34b6dc428ef7373476ff32c` (a #335 mergeada).
> **Fonte do estado**: `docs/ux/I1-PRECHECK.md` (§0.2 H-I1-2, H-I1-7; §10). **Requisitos**: I1-D6 e H-I1-7 (a)–(e).
> **Data**: 2026-09-26. Convenções do pre-check: `[medido]` = comando + saída literal; `[lido]`; `[hipótese]`.
> Divergências **522–531** (faixa do bloco: 522–549; a PR-3 começa em 550).

## 1. Commits

| commit | o quê |
|---|---|
| `1f1525c` | **o gate**: CN de tela reprovando na `main`; CN de navegador com o listener corrigido e controle positivo |
| `26d2c68` | **o conserto** (cliente, só) + CN com frases literais e os casos (iv)–(vi) |
| `f8b2485` | correção do aparato do CN de navegador: nada se grava na árvore vigiada durante a medição (div. 531) |
| (este) | docs e aceite |

## 2. Decisões do aval do commit 1 — `[Marcel, 2026-09-26]`

- **Forma A** para (c): o provider mostra uma **linha de aviso no topo**, com a razão e o botão *Tentar de novo*; a renovação automática fica suspensa até o usuário agir; nada navega. **Um componente só** — `LinhaDeAviso`, o nome que o nativo já usa (`apps/native/src/screens/LinhaDeAviso.tsx`; o web não tinha componente de aviso: `git grep` → só o `Alert` do shadcn) —, usado pela tela de login (falha do `POST`) e pela renovação; a folha do web o redesenha depois como uma coisa.
- **Frases**: a lista da §4 do corpo da PR, pt-BR, estilo de `packages/core/src/frases.ts`, só o que a tela precisa; `{N}` só quando o `Retry-After` vier; **"Entrar com outra conta" não entra** (controle novo = comportamento). Tabela na §5.
- **Div. 526** — extra declarado, entra no commit 2: os listeners de `visibilitychange` e o intervalo de 50 min removidos na limpeza do efeito; depois, medir se o "duas vezes por logout" da div. 527 desaparece (não desaparece: div. 528).
- **Div. 527** — o `DELETE /api/auth/session` do cliente sem usuário **fica**.
- `lib/firebase-session-cookies.ts` é cliente, fora do núcleo do G-back: **sem linha** no bloco ```gates-web```; consta aqui como arquivo tocado.
- O aceite no navegador é **só o depois**: o *antes* está no probe 1 de prod (`I1-PRECHECK-anexos/faseB/probe1-out/`) e no `CN-antes.txt`.

## 3. O que mudou, por arquivo

| arquivo | linhas (na branch) | mudança |
|---|---|---|
| `lib/firebase-session-cookies.ts` | `:14-20` tipos, `:23` `lerRetryAfter`, `:32` `setSessionCookie` | o `POST` devolve `ResultadoSessao` — `ok` · `rede` · `recusado` (401/403) · `limite` (429 + `retryAfterS`, segundos ou data HTTP; `null` sem cabeçalho) · `servidor` (5xx e o resto) — em vez de `throw` genérico. `clearSessionCookie` (`:72`) intacto |
| `contexts/firebase-auth-context.tsx` | `:39` `EstadoSessao`; `:124-127` refs (`montado`, `suspensa`, `emCurso`, `ultimaOrigem`); `:130` `carregarPerfil`; `:175` `abrirSessao`; `:196` `renovar`; `:210` `tentarSessaoDeNovo`; `:226-297` o efeito; `:524` `<AvisoDeSessao>` | estado `sessao` (`ausente` · `abrindo` · `aberta` · `falhou` + razão + origem `abertura`/`renovacao`); no `onAuthStateChanged` o `POST` sai **antes** de `setUser`/`setIdToken` (`:245`); `GET /api/profile` só com o 2xx (`:256`); a falha deixou de cair no `catch` engolido (`:189` antigo) e virou estado; qualquer falha **suspende** a renovação até o *Tentar de novo*; o `DELETE` sem usuário fica (`:266`, div. 527); **div. 526**: o efeito devolve a limpeza (`:291`) |
| `components/auth/login-panel.tsx` | `:25-31`, `:33-35`, `:177`, `:278` | o `handleRedirect` (e o `GET /api/profile` dele) só com a sessão `aberta`; a tela "Redirecting…" só com ela aberta; na falha, `LinhaDeAviso` com a frase e *Tentar de novo* (1 `POST`, por ação do usuário) |
| `components/auth/linha-de-aviso.tsx` | novo, 42 | `LinhaDeAviso` (`motivo` + `acao`), `role="alert"` |
| `components/auth/aviso-de-sessao.tsx` | novo, 31 | a linha no topo, pelo provider, com a sessão em `falhou` **fora** do `/login` (no `/login` fala o painel: uma falha, uma frase) |
| `components/auth/frases-sessao.ts` | novo, 45 | as frases e `fraseDaFalha` |
| `components/auth/__tests__/login-sessao-cn.test.tsx` | novo, 362 | o CN de tela (§4) |

Nada em `app/api/**`, `lib/` do backend, `middleware.ts`, `supabase/` (I1-D9).

## 4. CN de tela — antes e depois (Vitest, jsdom)

Provider **real** + `LoginPanel` **real** + `lib/firebase-session-cookies` **real**; mockados o SDK do Firebase, o `fetch` e o `window.location` (cada atribuição a `location.href` é uma volta do loop).

**Antes** — commit 1, na `main` (`CN-antes.txt`, verbatim):

```
     × (i/ii) POST 500, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 95ms
     × (i/ii) POST 500, login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 125ms
     × (i/ii) POST 429 (Retry-After: 60), usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 67ms
     × (i/ii) POST 429 (Retry-After: 60), login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 125ms
     × (i/ii) POST 401, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 68ms
     × (i/ii) POST 401, login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 125ms
     × (i/ii) POST rede, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 71ms
     × (i/ii) POST rede, login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 127ms
     × (b) cada razão tem a sua frase, e a do 429 leva o Retry-After 282ms
     ✓ (iii) usuário persistido: 1 POST, navega a /dashboard uma vez, sem alerta 68ms
     × (iii/a) login novo com o POST pendente: não navega nem lê o perfil antes do 2xx; navega uma vez depois 126ms
AssertionError: expected { post: 1, getProfile: 1, …(1) } to deeply equal { post: 1, getProfile: +0, …(1) }
+   "getProfile": 1,
+   "navegacoes": [ "/dashboard" ],
      Tests  10 failed | 1 passed (11)
```

O mesmo arquivo do commit 2 (15 casos) sobre o código da `main` → `Tests  14 failed | 1 passed (15)` (`CN-antes-commit2.txt`); o que passa, nas duas, é o (iii) — o controle positivo do gravador de navegação.

**Depois** — commit 2 (`CN-depois.txt`, verbatim, prefixo do arquivo encurtado para `…`):

```
 ✓ … (i/ii) POST 500, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 129ms
 ✓ … (i/ii) POST 500, login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 133ms
 ✓ … (i/ii) POST 429 (Retry-After: 60), usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 73ms
 ✓ … (i/ii) POST 429 (Retry-After: 60), login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 132ms
 ✓ … (i/ii) POST 401, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 73ms
 ✓ … (i/ii) POST 401, login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 140ms
 ✓ … (i/ii) POST rede, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 69ms
 ✓ … (i/ii) POST rede, login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível 133ms
 ✓ … (b) cada razão tem a sua frase, e a do 429 leva o Retry-After 271ms
 ✓ … (iii) usuário persistido: 1 POST, navega a /dashboard uma vez, sem alerta 65ms
 ✓ … (iii/a) login novo com o POST pendente: não navega nem lê o perfil antes do 2xx; navega uma vez depois 190ms
 ✓ … (b) 429 sem Retry-After: a frase não inventa prazo 71ms
 ✓ … (iv) "Tentar de novo" depois de um 500: exatamente 1 POST a mais; no 2xx navega uma vez 154ms
 ✓ … (v) renovação que falha fora do /login: linha de aviso no topo, 0 navegações, e nada repete sozinho 318ms
 ✓ … (vi) div. 526: desmontar o provider remove o listener de visibilitychange e o intervalo de 50 min 67ms
      Tests  15 passed (15)
# exit: 0
```

Prova de que os casos novos medem: tirando só a suspensão, o (v) reprova; tirando só o `removeEventListener`, o (vi) reprova; sobre a `main`, o (vi) dá `AssertionError: expected [] to deeply equal [ …(1) ]` (nenhum listener removido). A 1ª versão do (vi) não reprovava sem a limpeza (o `montado = false` já barrava a renovação) e foi reescrita para contar `add`/`removeEventListener` e `set`/`clearInterval`.

Suíte e build no commit 2 `[medido]`: `pnpm test` → `Tests  1105 passed | 85 skipped (1190)`; `pnpm lint` → `✔ No ESLint warnings or errors`; `tsc -p tsconfig.json --noEmit` → 0; `pnpm build` → exit 0.

## 5. Frases — a lista declarada (I1-D10/D17)

| chave | texto | onde |
|---|---|---|
| `rede` | sem conexão — a sessão não foi aberta | `LinhaDeAviso` do login; do topo, se a abertura falhar fora do `/login` |
| `recusado` | o servidor não aceitou o login — entre de novo | idem (401/403) |
| `limite-com-prazo` | muitas tentativas de entrar — tente de novo em {N} | idem (429 **com** `Retry-After`; `{N}` = `N s` abaixo de 60, `M min` a partir de 60, arredondado para cima) |
| `limite-sem-prazo` | muitas tentativas de entrar — tente de novo em instantes | idem (429 sem `Retry-After`) |
| `servidor` | falha no servidor — a sessão não foi aberta | idem (5xx e o resto) |
| `renovacao` | a sessão não foi renovada: {razão} | `LinhaDeAviso` do topo, renovação; `{razão}` = *sem conexão* · *o servidor não aceitou o login — entre de novo* · a frase do limite · *falha no servidor* |
| `tentar-de-novo` | Tentar de novo | o botão das duas linhas |

Fonte: `components/auth/frases-sessao.ts`. O resto da tela de login continua em inglês (I1-D17: não se traduz o que a PR não redesenha).

## 6. O aceite no navegador — pelo Marcel, contra `http://localhost:3000`

Dev server da branch (`pnpm --dir …/octavia-i1-pr1 dev`, com o `.env.local` do Marcel copiado para a árvore — div. 523), reiniciado entre os ramos (div. 524); scripts `cn/ramo-b.ts` e `cn/ramo-c.ts` por caminho absoluto (div. 530). Conta de audit.

| ramo | `POST /api/auth/session` | `GET /api/profile` | navegações | frase na tela | critério |
|---|---|---|---|---|---|
| **b** — 500 no navegador, 60 s | **1** (falso) | **0** | **0** | *"falha no servidor — a sessão não foi aberta"* + *Tentar de novo* | **CUMPRE** |
| **c** — 429 + `Retry-After: 60` no navegador, 60 s, cota limpa | **1** (falso) | **0** | **0** | *"muitas tentativas de entrar — tente de novo em 1 min"* + *Tentar de novo* | **CUMPRE** |

Verbatim (`cn/out-depois/ramo-b-resumo.txt` e `ramo-c-resumo.txt`, trecho):

```
# CN ramo-b — depois — 2026-09-26T17:53:59.692Z · alvo http://localhost:3000 · conta de audit · Chrome do sistema
resultado: EXIT 0
controle positivo: controle-1 no log, status 200 · controle-2 (junto de navegação cheia) no log, status 200
requests a octavia.rocks: 0 (abortados no navegador; o esperado é 0)
     1  POST /api/auth/session (falso, não chegou ao servidor)
     0  GET /api/profile (real, servidor local)
     0  POST /api/profile
     0  navegações do quadro principal
     1  frase(s) em [role="alert"] ao fim
     0  linha(s) sem resposta (status pendente) — o furo da div. 518 ficaria aqui, visível
  depois — 1 POST, 0 GET /api/profile, 0 navegações, 1 frase: CUMPRE

# CN ramo-c — depois — 2026-09-26T17:55:48.141Z · alvo http://localhost:3000 · conta de audit · Chrome do sistema
resultado: EXIT 0
controle positivo: controle-1 no log, status 200 · controle-2 (junto de navegação cheia) no log, status 200
interceptação: POST /api/auth/session → 429 (Retry-After: 60) no navegador, 60 s depois do submit
requests a octavia.rocks: 0 (abortados no navegador; o esperado é 0)
     1  POST /api/auth/session (falso, não chegou ao servidor)
     0  GET /api/profile (real, servidor local)
     0  navegações do quadro principal
     1  frase(s) em [role="alert"] ao fim
  frase(s): "muitas tentativas de entrar — tente de novo em 1 min
Tentar de novo"
  depois — 1 POST, 0 GET /api/profile, 0 navegações, 1 frase: CUMPRE
```

Capturas: `cn/out-depois/ramo-{b,c}-{15s,30s,45s,60s,fim}.png` (email e senha mascarados; conferido `ramo-b-fim.png` da rodada 1 e `ramo-c-fim.png`). Contra o probe 1 de prod (o antes): ramo b, **52** `POST` falsos, **51** `GET /api/profile`, **104** navegações em 60 s → **1 · 0 · 0**.

A **1ª rodada do ramo b** deu `NÃO CUMPRE` por **4 navegações** — a cada 15 s, no instante de cada captura, cada uma colada a um *hot update* do `app/layout`: o script gravava as `.png` na árvore que o `next dev` vigia (div. 531). Registrada como estava, parou-se; com o aval (opção 1), o aparato foi corrigido (`f8b2485`) e a 2ª rodada deu 0. Rastro em `cn/out-depois-rodada1/`.

## 7. Divergências 522–531

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **522** | T | div. 518 do pre-check: causa `[hipótese]` do furo do listener = `r.response()` rejeitando no handler `async` por `page`; *"não explica os dois `DELETE` do probe 4"* | o **`requestfinished` só dispara quando a página lê o corpo da resposta** (e não dispara para request cortado por navegação), com ou sem `ctx.route` (`cn/contraprova-listener.txt`); a 1ª corrida do controle positivo reprovou por isso (`status pendente`). Explica os **quatro** buracos: o `POST` do ramo a (`setSessionCookie` só olhava `response.ok`), a 61ª leitura do ramo c (`login-panel.tsx:118-119` da `main`: `res.ok` falso → frase, corpo não lido), e os dois `DELETE` do probe 4 (`lib/setlist-service.ts:227-234`, idem) | resolvido no `cn/comum.ts`: linha no `request`, status no `response`, por contexto. **Nota**: a hipótese registrada na div. 518 do `I1-PRECHECK.md` era outra; o pre-check **não** se reescreve — a correção mora aqui |
| **523** | P | *"`pnpm dev` com o `.env.local` dele"* | a árvore não tinha `.env.local` | o Marcel o copiou para a árvore; o executor não abriu `.env*` |
| **524** | P | *"com a cota limpa (espere 15 min entre rodadas)"* | contra o dev local a cota é memória do processo (`lib/user-rate-limit.ts:76`) | reiniciar o `pnpm dev` entre os ramos (`COMO-RODAR.md`) |
| **525** | T | H-I1-7 (d): *"hoje ≥ 50 voltas"* (prod) | o dev server roda sem minificação e com `StrictMode` (`reactStrictMode` ausente do `next.config.mjs`) — `[hipótese]`: contagem por volta não comparável 1:1 | **sem objeto** para o aceite: o *antes* não se refez no dev (aval); o critério do *depois* é absoluto (1 · 0 · 0 · 1) |
| **526** | A | — | a limpeza dos listeners de renovação era o retorno de `initializeAuth` (`async`), descartado: o `visibilitychange` e o intervalo sobreviviam à desmontagem (em dobro no dev) | **consertado** no commit 2 (extra declarado no aval); caso (vi) do CN |
| **527** | A | div. 511: *"o `/login` deslogado dispara sozinho `DELETE /api/auth/session`"* | é de **toda** carga sem usuário no Firebase, em qualquer rota (provider no layout raiz, `app/layout.tsx:125`), e 2× por logout. Tem função: sincroniza o cookie do servidor quando o cliente perde o usuário. No aceite: 3 `DELETE` reais ao servidor local por ramo, um por carga de `/login` antes do submit | **fica** (aval) |
| **528** | P | aval: medir se o "duas vezes por logout" some com a 526 | não some: `MEDIDA logout: ["DELETE /api/auth/session","DELETE /api/auth/session"]` na branch e na `main` (teste temporário, apagado) — `signOut` + listener com `null`, por construção | registrado; fica com a 527 |
| **529** | P | comando do aceite sem argumento | o script do commit 1 exigia `antes\|depois` (exit 2) | sem argumento = `depois` (`cn/comum.ts`) |
| **530** | T | *"`pnpm tsx docs/ux/I1-PR1-anexos/cn/ramo-b.ts`"* (caminho relativo) | o terminal do app volta ao checkout principal (`/octavia`, na `main`), onde o arquivo não existe: `ERR_MODULE_NOT_FOUND` (duas vezes, nada rodou) | `COMO-RODAR.md` com caminhos absolutos; a saída vai para a pasta do script, não a do terminal |
| **531** | T | o CN de navegador conta navegações do app | 1ª rodada do ramo b: 4 "navegações" a `/login`, cada uma colada a um *hot update* do `app/layout`, nos instantes das capturas (27461 · 42558 · 57726 · 72930 ms × `.png` gravadas às 14:26:17 · :32 · :47 · 14:27:02) — o script gravava na árvore vigiada pelo `next dev` | parado e registrado; com o aval, `f8b2485` (capturas em pasta temporária, copiadas depois do `browser.close()`); 2ª rodada: 0 navegações. Rastro `cn/out-depois-rodada1/` |

## 8. Bloco `gates-web` (copiado do corpo da PR)

```gates-web
# I1-PR-1: nenhum arquivo do núcleo do G-back tocado
# components/auth/__tests__/login-sessao-cn.test.tsx — +362
# components/auth/aviso-de-sessao.tsx — +31 (novo)
# components/auth/frases-sessao.ts — +45 (novo)
# components/auth/linha-de-aviso.tsx — +42 (novo)
# components/auth/login-panel.tsx — +21 −4
# contexts/firebase-auth-context.tsx — +182 −128
# lib/firebase-session-cookies.ts — +52 −12 (cliente; fora do núcleo do G-back)
# docs/ux/I1-PR1-anexos/** — anexos
```

O bloco ```gates``` do nativo fica vazio.

## 9. Contabilidade

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` | **0** |
| executor | escritas | **0** |
| executor | logins | **0** |
| executor | `.env*` abertos | **0** (a existência do `.env.local` na árvore foi conferida com `ls`, sem abrir) |
| executor | dev server local | 1× na árvore, **sem** `.env` (Firebase desligado): controle positivo e a contraprova do listener — `GET /login`, estáticos, `GET /api/health` |
| Marcel | scripts contra `localhost:3000` | ramo b ×2 (rodada 1 = rastro), ramo c ×1; cada um com 1 login da audit pela tela (`identitytoolkit.googleapis.com` ×2 por rodada) |
| Marcel | requests a `octavia.rocks` | **0** (abortados no navegador e contados: 0 em cada rodada) |
| Marcel | escritas | **0**: nenhum `POST/PUT/PATCH/DELETE` a `/api/*` fora de `/api/auth/session`; o `POST` de sessão foi falso (no navegador); os `DELETE` de sessão (3 por rodada, div. 527) só limpam cookie no servidor local |
| Marcel | `GET /api/profile` reais | **0** na janela de medição dos três |

## 10. Arquivos deste diretório

| arquivo | o quê |
|---|---|
| `CN-antes.txt` · `CN-antes-commit2.txt` · `CN-depois.txt` | o CN de tela, verbatim |
| `cn/comum.ts` · `cn/ramo-b.ts` · `cn/ramo-c.ts` · `cn/COMO-RODAR.md` | o CN de navegador |
| `cn/contraprova-listener.txt` | a contraprova da div. 522 (rastro; o script está no próprio arquivo) |
| `cn/out-controle/` | o controle positivo rodado pelo executor (sem login) |
| `cn/out-depois/` | o aceite (ramos b e c) |
| `cn/out-depois-rodada1/` | rastro: a 1ª rodada do ramo b (div. 531) |
