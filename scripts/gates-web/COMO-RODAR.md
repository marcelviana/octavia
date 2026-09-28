# G-faixa — como rodar a medição (I1-PR5)

A medição roda **local**, nunca no CI: o CI só dá o veredito sobre os JSON commitados em
`tests/gates-web/medicoes/` (`g-faixa-veredito.mjs`, job `g-faixa` do `gates-web.yml`).

## O CN da `main` com sessão — Marcel, uma vez

O web velho **tem de reprovar** em 711 nas superfícies com sessão (I1-D13; regra 7: se passar,
o instrumento não mede). O executor não faz login nem abre `.env*`; esta parte é sua.

1. Na árvore `../octavia-i1-pr5` (branch `i1/pr5-gates-web` — é a `main` `73612be` mais o
   instrumento; nenhuma linha de `app/`, `components/`, `lib/` mudou), com o seu `.env.local`
   copiado para lá (passo seu), suba o servidor num terminal que **fica aberto**: **`pnpm dev`**
   (porta 3000; `next start` não serve em http local, div. 570 da I1-PR3). Espere o `✓ Ready`.
   Sem servidor, o comando abaixo para na hora com *"nada responde em …/api/health"* (a 1ª rodada,
   2026-09-27, morreu em `ERR_CONNECTION_REFUSED`: não havia servidor na porta 3000).
2. Em outro terminal, na mesma árvore, **o comando** (uma linha):

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=dashboard,library,setlists,content G_FAIXA_SAIDA=tests/gates-web/medicoes/cn-main pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
   ```

3. **Na primeira vez** o perfil não tem sessão: abre uma janela do Chromium em `/login` e o script
   espera até 10 min. **Entre com a conta** (sugestão: a de audit; a medição não escreve nada) e
   não feche a janela — ela fecha sozinha quando `/dashboard` abre. O script nunca lê nem digita
   credencial. A sessão fica no perfil (`~/.octavia-g-faixa-perfil`, fora da árvore; a config
   recusa um caminho dentro dela); nas próximas vezes não pede login.
4. Mede, nas três larguras (1138 · 711 · 411), `/dashboard`, `/library`, `/setlists` e o primeiro
   `/content/<id>` da biblioteca, e grava `tests/gates-web/medicoes/cn-main/<superficie>.json`
   (só no fim — nada se grava na árvore durante a medição, div. 531). O `/login`, a `/` e a
   `/privacy-policy` o executor já mediu (sem sessão) na mesma pasta.
5. **Escrita declarada: nenhuma.** `POST`/`DELETE` de `/api/auth/session` são cookie e passam;
   qualquer outra escrita a `/api/*` é abortada no navegador e reprova a rodada. Request a
   `octavia.rocks` é abortado e contado. O servidor local lê o que a sua conta tem (content,
   setlists, perfil) — leitura.
6. **Cota**: cada carga de documento com sessão pode ler `/api/profile` (60 em 15 min por
   usuário, `lib/user-rate-limit.ts:54`, H-I1-7). A rodada faz ~40 cargas; não repita em menos de
   15 min.
7. O resumo sai no fim, por superfície e largura: `(e)`, `(b)`, `(d′)`, errata candidata, saídas.
   Espera-se `(e)` ou `(b)` em 711. Depois diga **"rodei"** na sessão.

Os JSON **não** carregam texto de música: nas superfícies com sessão, o texto de cada nó vai só
como hash (sha256, 12 hex) e comprimento (regra do `CLAUDE.md`, div. 204 do N2).

## O aceite da I1-PR6 (auth) — Marcel, um comando

As cinco telas de auth, **sem sessão e sem login**: o medidor alcança os estados com o **mecanismo (ii)** do aval
(`scripts/gates-web/g-faixa-auth.ts`) — um usuário falso (`marcel@exemplo.com`, o dado de exemplo da folha) que o
próprio navegador "entra" com respostas **fabricadas** do `identitytoolkit`/`securetoken`, e as do app que escreveriam
(`POST /api/profile`) fabricadas também. **Nenhuma conta, nenhuma escrita**; você não digita nada. (Correção do commit 3,
div. 672: nos estados do *Entrar com Google* o SDK lê de verdade o iframe de auth — `apis.google.com`,
`<projeto>.firebaseapp.com`, `googleapis.com`, `identitytoolkit` — leituras, sem login.) Um contexto de navegador por estado.

1. Na árvore `../octavia-i1-pr6` (branch `i1/pr6-auth`), com o seu `.env.local` copiado para lá (passo seu — o SDK do
   Firebase só inicia configurado; sem ele, só os estados "sem Firebase" aparecem), suba **`pnpm dev`** num terminal
   que fica aberto (porta 3000) e espere o `✓ Ready`.
2. Em outro terminal, na mesma árvore:

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_SUPERFICIES=login,signup,confirm-email,verify-email,forgot-password pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
   ```

3. Leva uns 5 min (três larguras × 46 estados). Grava `tests/gates-web/medicoes/{login,signup,confirm-email,
   verify-email,forgot-password}.json` — um por tela — e imprime, por estado: medido, **NÃO ALCANÇADO** (com a razão:
   a preparação falhou, ou o texto esperado não apareceu) ou **INALCANÇÁVEL (declarado)**. Os dois que só existem
   **sem** Firebase (`AUTH-login-nao-configurado`, `AUTH-forgot-indisponivel`) saem NÃO ALCANÇADOS com o `.env` — é o
   esperado; o executor os mede à parte, sem `.env`.
4. Se algum dos 15 estados com usuário (`AUTH-confirm*`, `AUTH-verify*`) sair NÃO ALCANÇADO, a decisão 8 autoriza a
   conta descartável (i) — decisão sua, na hora. Depois diga **"rodei"**.

## O aceite em A da I1-PR6 (commit 4) — Marcel, dois comandos

Mesmo `pnpm dev` com o `.env.local`, mesma árvore. A gravação agora **mescla por largura**: uma rodada só de `A-411`
substitui só a faixa A dos cinco JSON e deixa C e B como estavam (cada largura guarda a sua rodada e o seu commit em
`rodadas`). O `login` precisa das TRÊS larguras de novo: o item 5 do aval mudou o `AUTH-login-google-erro` (agora o
*cancelado*) e criou o `AUTH-login-google-bloqueado`.

```bash
G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_SUPERFICIES=login,signup,confirm-email,verify-email,forgot-password pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts --project A-411
```

```bash
G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_SUPERFICIES=login pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts --project C-1138 --project B-711
```

O `AUTH-login-google-erro` leva ~11 s (o SDK demora a desistir da janela fechada). Depois diga **"rodei"**.

## O aceite da I1-PR9 (content lista e a casca) — Marcel, dois comandos

Na árvore `../octavia-i1-pr9` (branch `i1/pr9-content-lista`), com o seu `.env.local` copiado para lá (passo seu),
**`pnpm dev`** num terminal que fica aberto (porta 3000) e o `✓ Ready`. O perfil `G_FAIXA_PERFIL` é o de sempre
(`~/.octavia-g-faixa-perfil`, com a sessão da conta que você escolheu na PR-5); se a sessão tiver caído, a janela de
login abre e espera (passo 3 do CN da `main`, acima).

1. **O painel e a biblioteca** (os 15 estados da folha `4-content-lista`, nas três larguras) — grava
   `tests/gates-web/medicoes/{dashboard,library}.json`:

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=dashboard,library pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
   ```

2. **O efeito da casca nova no corpo velho** (setlists e a visualização, estado `base`; só registro, fora do veredito
   do CI) — grava `tests/gates-web/medicoes/casca-efeito/{setlists,content}.json`:

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=setlists,content G_FAIXA_SAIDA=tests/gates-web/medicoes/casca-efeito pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
   ```

O que esperar: por estado, medido, **NÃO ALCANÇADO** (com a razão) ou **INALCANÇÁVEL (declarado)**. Declarados:
`DASH-vazio` e `DASH-erro` (SSR — os dados vêm do Supabase no servidor; a prova é o Vitest do painel) e `LIB-salvo`
(nasce na PR do editor). `DASH-vazio-favoritas` só se mede se a conta **não** tiver favoritas — com favoritas, sai NÃO
ALCANÇADO, e é o esperado. A biblioteca mostra por um instante a lista da sua conta (o SSR) e logo as seis linhas da
folha (a carga do cliente, fabricada).

**Escrita declarada: nenhuma.** A `GET /api/content` da biblioteca é fabricada no navegador (as linhas da folha); o
`DELETE`/`PUT` de `/api/content` e o `POST /api/auth/session` do `SESSAO-nao-renovada` também — respondem no
navegador com `x-g-faixa: fabricado` e nada sai. Qualquer outra escrita a `/api/*` é abortada e reprova a rodada.
O `SESSAO-nao-renovada` faz uma renovação real do token no Google (`securetoken`, leitura) antes do `POST` fabricado.

**Cota**: cada carga com sessão pode ler `/api/profile` (60 em 15 min, `lib/user-rate-limit.ts:54`). O comando 1 faz
~40 cargas (13 estados × 3 larguras + o controle); o 2, ~10. Se um estado sair NÃO ALCANÇADO por 429 de
`/api/profile`, espere 15 min e repita só a superfície dele. Depois diga **"rodei"**.

## I1-PR10 antes — o editor velho antes do `pdf-viewer` novo (Marcel, um comando)

Na árvore `../octavia-i1-pr10`, **no commit 1b** (branch `i1/pr10-content-view`; o código do app é o da `main` —
o 1b só acrescenta o instrumento), com o seu `.env.local` copiado para lá (passo seu), **`pnpm dev`** num terminal que
fica aberto (porta 3000) e o `✓ Ready`. Perfil de sempre (`~/.octavia-g-faixa-perfil`).

```bash
G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=content-edit G_FAIXA_SAIDA=tests/gates-web/medicoes/casca-efeito/antes pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
```

Mede `/content/g-faixa/edit` nas três larguras, cinco estados: `base-cifra`, `base-letra`, `base-tab`,
`base-partitura` (o PDF desenhado) e `erro-pdf` (o arquivo responde 500). Grava
`tests/gates-web/medicoes/casca-efeito/antes/content-edit.json`.

**Tudo fabricado no navegador** (`scripts/gates-web/g-faixa-conteudo.ts`): o `GET /api/content/g-faixa` (um content de
cada tipo, com os exemplos da folha 5) e o arquivo da partitura (um PDF de 12 páginas gerado em memória com o
`pdf-lib`, num host do Storage que não existe — o `route()` responde antes de sair). **Nenhuma leitura de content real,
nenhuma escrita**: o editor não é clicado; um `PUT` que saísse cairia na barreira (abortado, a rodada reprova). Lidos
de verdade só a sessão (`/api/profile`, o `securetoken`). **Cota**: ~16 cargas (5 estados × 3 larguras + o controle).
Depois diga **"rodei-antes"**. O "depois" é o mesmo comando com `G_FAIXA_SAIDA=tests/gates-web/medicoes/casca-efeito/depois`,
no commit 2.

## O resto

| o quê | comando |
|---|---|
| sem `G_FAIXA_BASE_URL` (falha antes de abrir navegador) | `pnpm exec playwright test -c playwright.g-faixa.config.ts` |
| só as públicas, sem sessão | `G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_SUPERFICIES=login,landing,privacy-policy pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts` |
| uma largura | acrescente `--project B-711` (ou `C-1138`, `A-411`) |
| o CN da coleta (página sintética, sem servidor) | `G_FAIXA_BASE_URL=http://localhost G_FAIXA_SUPERFICIES=nenhuma pnpm exec playwright test -c playwright.g-faixa.config.ts tests/gates-web/g-faixa-coleta.cn.ts --project B-711` |
| o veredito (o do CI) | `node scripts/gates-web/g-faixa-veredito.mjs [pasta]` (padrão `tests/gates-web/medicoes`) |
| o Chromium fixado | `pnpm exec playwright install chromium` → 140.0.7339.16 (build 1187), do `@playwright/test` 1.55.0 do lockfile |

Variáveis: `G_FAIXA_BASE_URL` (obrigatória) · `G_FAIXA_PERFIL` (perfil persistente com a sessão;
sem ela as superfícies com sessão são puladas) · `G_FAIXA_SUPERFICIES` (lista de ids de
`g-faixa-superficies.ts`) · `G_FAIXA_SAIDA` (padrão `tests/gates-web/medicoes`) ·
`G_FAIXA_SEM_JANELA=1` (sem sessão no perfil, falha em vez de abrir a janela de login).
