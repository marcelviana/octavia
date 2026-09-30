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

## I1-PR10 — o aceite da visualização (Marcel, dois comandos)

Na árvore `../octavia-i1-pr10`, **no commit 2** (branch `i1/pr10-content-view`), com o seu `.env.local` e o
**`pnpm dev` reiniciado** (porta 3000; o `✓ Ready`). Perfil de sempre.

1. **A visualização** (os estados da folha `5-content-visualizacao`, nas três larguras) — grava
   `tests/gates-web/medicoes/content.json`:

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=content pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
   ```

2. **O editor velho depois do `pdf-viewer` novo** (a `casca-efeito`, o mesmo comando do "antes") — grava
   `tests/gates-web/medicoes/casca-efeito/depois/content-edit.json`:

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=content-edit G_FAIXA_SAIDA=tests/gates-web/medicoes/casca-efeito/depois pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
   ```

**O que o comando 1 lê de verdade** (decisão 1 do aval): a `/library` faz a `GET /api/content` dela — o medidor a pede
com `pageSize` 100 e guarda **em memória** só o `id`, o tipo e o `file_url` do primeiro content de cada tipo (cifra,
letra, tab, partitura em `.pdf`); depois abre `/content/<id>` de cada um, e o **SSR lê a linha** do content (título,
corpo, detalhes). Os JSON gravam só hash. O **arquivo da partitura não é lido**: o `route()` responde no `file_url` com o
PDF de 12 páginas gerado (ou 500, ou segura a resposta). Declarados inalcançáveis: os quatro vazios, `VIEW-erro-formato` e
`VIEW-erro-render` (prova no Vitest e na pré-verificação sem sessão); sem código: `VIEW-carregando-arquivo` e
`VIEW-erro-cache` (I1-E15). Se a conta não tiver um dos tipos, os estados dele saem NÃO ALCANÇADOS com a razão.
`VIEW-partitura-cheia` pede a tela cheia do Chromium (o clique em *Tela cheia*).

**Escrita declarada: nenhuma** (a visualização não escreve; o editor não é clicado). **Cota**: o comando 1 faz ~25
cargas (7 estados × 3 larguras + a `/library` + o controle); o 2, ~16. Depois diga **"rodei"**.

## I1-PR11 — o aceite do editor (Marcel, um comando)

Na árvore `../octavia-i1-pr11` (branch `i1/pr11-content-edit`, **no commit 2**), com o seu `.env.local` copiado para lá
(passo seu) e o **`pnpm dev` reiniciado** — o `tailwind.config.ts` mudou (`campo-duas-linhas`, `campo-letra`) — na porta
3000, até o `✓ Ready`. Perfil de sempre (`~/.octavia-g-faixa-perfil`).

```bash
G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=content-edit pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
```

Grava `tests/gates-web/medicoes/content-edit.json`: `/content/g-faixa/edit` nas três larguras, os estados da folha
`6-content-editor`, o `LIB-salvo` da folha 4 (o fluxo do salvar até a `/library`) e os cinco do 1b da PR-10 (`base-*`,
`erro-pdf` — a `casca-efeito`, antes × depois).

**Tudo fabricado no navegador** (`scripts/gates-web/g-faixa-conteudo.ts`): o `GET /api/content/g-faixa` com os exemplos
da folha (ou segurado, abortado, 401, 429, 500, 404); o `PUT /api/content` **segurado** (`EDIT-salvando`), **abortado**
(`EDIT-salvar-erro`, a rede que cai) ou **200** (`LIB-salvo`) — nenhum `PUT` sai: o fabricado sem resposta vai ao log
como `fabricado sem resposta`, e um que escapasse cairia na barreira (abortado, a rodada reprova). A alteração local de
cada estado é marcar *Favorita* (nada é gravado — o `PUT` do `LIB-salvo` responde no navegador). O `LIB-salvo` mostra a
`/library` com a lista da sua conta por um instante (o SSR, leitura) e logo as seis linhas da folha 4 (fabricadas).
Declarados inalcançáveis com sessão: `EDIT-carregando-auth` e `EDIT-sem-usuario` (prova na pré-verificação e no
Vitest). `EDIT-carregando-editor` segura o *chunk* do editor no `next dev` (`content-edit-page-client` no nome —
`[hipótese]`): se não casar, sai NÃO ALCANÇADO com a razão.

**Cota**: ~56 cargas com sessão (18 estados × 3 larguras + o controle) contra as 60 em 15 min do `/api/profile`: rode
**sozinha**, sem outra rodada nos 15 min antes. Se um estado sair NÃO ALCANÇADO por 429, espere 15 min e repita só a
largura dele (`--project`). Depois diga **"rodei"**.

### I1-PR11 — a 2ª rodada, só os estados que faltaram (commit 2b, div. 803)

Mesma árvore, mesmo `pnpm dev` (reinicie se estiver de pé desde antes do `git pull` do 2b), mesmo perfil. O
`tests/gates-web/medicoes/content-edit.json` da 1ª rodada tem de estar na árvore (não o apague): a rodada nova mede SÓ
os quatro estados e os MESCLA nele — os outros estados ficam byte a byte como estão.

```bash
G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=content-edit G_FAIXA_ESTADOS=EDIT-salvando,EDIT-salvar-erro,LIB-salvo,EDIT-erro-limite pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
```

~14 cargas (4 estados × 3 larguras + o controle). Nenhum `PUT` sai: o do `EDIT-salvando` fica segurado, o do
`EDIT-salvar-erro` é abortado no navegador, o do `LIB-salvo` responde 200 no navegador. A rodada fica registrada em
`rodadasPorEstado` e as linhas do log dela somam-se às da largura. Depois diga **"rodei"**.

## I1-PR12 antes — o upload velho, casca-efeito (Marcel, um comando)

Na árvore `../octavia-i1-pr12`, **no commit 1b** (branch `i1/pr12-upload`; o código do app é o da `main` — o 1b só
acrescenta o instrumento), com o seu `.env.local` copiado para lá (passo seu), **`pnpm dev`** num terminal que fica aberto
(porta 3000) e o `✓ Ready`. Perfil de sempre (`~/.octavia-g-faixa-perfil`).

```bash
G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SUPERFICIES=add-content G_FAIXA_SAIDA=tests/gates-web/medicoes/casca-efeito/antes pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
```

Mede `/add-content` nas três larguras, cinco estados do web velho: `base-criar` (abre: o passo 1 com o criar),
`base-arquivo` (*Import from File*: a zona), `base-detalhes` (o upload → o formulário, com o título e o artista da
folha), `base-lote` (*Batch Import* + o lote da folha → a prévia) e `base-pronto` (o salvar → *Done!*). Grava
`tests/gates-web/medicoes/casca-efeito/antes/add-content.json`.

**Tudo fabricado no navegador** (`scripts/gates-web/g-faixa-upload.ts`): o `POST /api/storage/upload` responde 201 com
um `url` fabricado; o `POST /api/content` responde 201 ecoando o corpo; a navegação ao content criado
(`/content/g-faixa-novo`) fica **segurada** — a tela fica no *Done!*, que hoje pisca. Os arquivos (um PDF de 1,8 MiB e
o lote `.txt` com as quatro músicas da folha) são **gerados em memória**, nunca lidos do disco; o corpo do `POST` para
no `route()` e **não sai**. Um `POST` que escapasse cairia na barreira (abortado, a rodada reprova). Lidos de verdade só
a sessão (`/api/profile`, o `securetoken`). **Cota**: ~16 cargas (5 estados × 3 larguras + o controle). Depois diga
**"rodei-antes"**.

## I1-PR12 — o aceite do upload (o executor roda — I1-D37; duas rodadas)

**Quem roda** `[I1-D37, Marcel, 2026-09-30]`: o **executor**, com o perfil persistente `~/.octavia-g-faixa-perfil` (já logado
pelo Marcel — o executor não digita senha) contra `localhost:3000`, com o `pnpm dev` da árvore `../octavia-i1-pr12`
(branch `i1/pr12-upload`, **no commit 2**) e o `.env.local` do Marcel, que o `next dev` carrega e ninguém abre. O
`tailwind.config.ts` **não mudou** nesta PR: o servidor de pé não precisa reiniciar.

**Por que duas rodadas (a cota)**: são 26 estados (os 21 da folha `7-upload` + os cinco `base-*` da casca-efeito) × 3
larguras + o controle ≈ **79 cargas com sessão**, e cada carga pode ler `/api/profile` — 60 em 15 min por usuário
(`lib/user-rate-limit.ts:54`). Então: **C e B** (≈ 53 cargas), **15 minutos de espera**, e **A** (≈ 27). A gravação
mescla por largura (o molde da I1-PR6, commit 4). "Por estado" (`G_FAIXA_ESTADOS`) fica para repetir um estado que saia
NÃO ALCANÇADO — não para a rodada inteira (26 estados).

1. C e B:

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SEM_JANELA=1 G_FAIXA_SUPERFICIES=add-content pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts --project C-1138 --project B-711
   ```

2. 15 min depois, A:

   ```bash
   G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SEM_JANELA=1 G_FAIXA_SUPERFICIES=add-content pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts --project A-411
   ```

Grava `tests/gates-web/medicoes/add-content.json`. `G_FAIXA_SEM_JANELA=1`: se a sessão do perfil tiver caído, a rodada
**falha** em vez de abrir a janela de login — o login é do Marcel.

**Tudo fabricado no navegador** (`scripts/gates-web/g-faixa-upload.ts`): o `POST /api/storage/upload` (201 com um `url`
fabricado; o 400 do contrato com `field: "size"`; 500; segurado; abortado) e o `POST /api/content` (201; 500; segurado).
Os arquivos são **gerados em memória** — o PDF de 1,8 MiB, o lote `.txt` com as quatro músicas da folha (nomeado
`repertorio.docx`, como a folha, com o tipo `text/plain`), um lote em PDF (`pdf-lib`), o `foto.heic` e o de **5 MiB** do
`UP-limite` — e **nenhum sai**: o corpo do `POST` para no `route()`. O content criado vem **sem `id`** (`UP-pronto`: a tela fica
no pronto em vez de navegar — div. 841); o worker do pdf.js fica segurado (`UP-lote-lendo`); o pedaço do `dynamic` fica segurado
(`UP-carregando` — `components_add-content` no nome do chunk, `[hipótese]`: se não casar, sai NÃO ALCANÇADO com a razão).
Um `POST` que escapasse cairia na barreira (abortado, a rodada reprova). Lidos de verdade só a sessão (`/api/profile`, o
`securetoken`). **Escrita declarada: nenhuma.**

Se um estado sair NÃO ALCANÇADO, repita só ele: o mesmo comando com `G_FAIXA_ESTADOS=<estado>[,<estado>]` e o
`--project` da largura — mescla por estado e registra em `rodadasPorEstado` (que a rodada por largura preserva desde a
div. 843).

## I1-PR13 antes — as setlists velhas, casca-efeito (o executor roda — I1-D37; um comando)

Na árvore `../octavia-i1-pr13`, **no commit 1** (branch `i1/pr13-setlists`; o código do app é o da `main` — o commit 1 só
acrescenta gate, esperado, testes e instrumento). Perfil de sempre (`~/.octavia-g-faixa-perfil`), contra o `pnpm dev` da
porta 3000 com o `.env.local` do Marcel. (Na rodada de 2026-09-30 o servidor de pé era o de `../octavia-i1-pr12`, em
`bd77cd7` — a mesma árvore da `main` `aa772df`; a árvore da PR-13 ainda não tinha `.env.local`, div. 849.)

```bash
G_FAIXA_BASE_URL=http://localhost:3000 G_FAIXA_PERFIL="$HOME/.octavia-g-faixa-perfil" G_FAIXA_SEM_JANELA=1 G_FAIXA_SUPERFICIES=setlists G_FAIXA_SAIDA=tests/gates-web/medicoes/casca-efeito/antes pnpm exec playwright test -c playwright.g-faixa.config.ts scripts/gates-web/g-faixa-medir.ts
```

Mede `/setlists` nas três larguras, cinco estados do web velho: `base-lista`, `base-detalhe` (*Show padrão* aberta),
`base-formulario` (*Create Setlist*), `base-dialogo` (*Delete Setlist*) e `base-picker` (*Add Songs*). Grava
`tests/gates-web/medicoes/casca-efeito/antes/setlists.json`.

**Tudo fabricado no navegador** (`scripts/gates-web/g-faixa-setlists.ts`): a `GET /api/setlists` (as três setlists da
folha 8) e a `GET /api/content` (as músicas da folha) — **nenhuma setlist nem content da conta é lido** — e toda escrita a
`/api/setlists*` (nenhum botão de escrita é clicado; uma que escapasse cairia na barreira: abortada, a rodada reprova).
Lidos de verdade só a sessão (`/api/profile`, o `securetoken`). **Cota**: ~18 cargas (5 estados × 3 larguras + o controle).

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
`G_FAIXA_ESTADOS` (I1-PR11, div. 803: mede só os estados listados e os mescla por estado no JSON existente).
