# I1 — PRE-CHECK (Fase A, só leitura)

> **Bloco**: I1 — identidade. **Fase**: A (leitura do repositório; só documentos).
> **Sha do levantamento**: `origin/main` = `c57d81f3f481293585459a1f689c56133f354264`
> (`c57d81f Merge pull request #334 from marcelviana/n3/encerramento`) — o N3 está
> encerrado nela: `git cat-file -e origin/main:docs/native/N3-ENCERRAMENTO.md` → existe;
> último commit que o tocou, `0222a41 docs(N3): CI-FAIXA atualizada (div. 467); 471/472 → W5`.
> **Data**: 2026-09-26. **Árvore**: `../octavia-i1-precheck`, branch `i1/precheck`, criada de
> `origin/main`; `pnpm install --frozen-lockfile --offline` → `Done in 12.7s using pnpm v10.28.0`.
> **Anexos**: [`I1-PRECHECK-anexos/`](I1-PRECHECK-anexos/README.md) — um inventário por arquivo,
> com o comando na primeira linha.
>
> **Convenções** (as do N2 e do N3): `[medido]` = comando exato + saída literal nesta sessão;
> `[lido]` = leitura de código ou documento, com arquivo e linha; `[hipótese]` = o resto.
> Contagem sempre de `grep -c`/`wc -l`/`find | wc -l`/script com o comando no anexo.
> Divergência: numerada a partir de **480**, com origem **P** (premissa do prompt) ·
> **D** (doc anterior) · **A** (ambiente/dado real/defeito) · **T** (toolchain/aparato) ·
> **X** (terceiros). Nenhum request a `https://octavia.rocks` nem a `/api/*`, nenhum `adb`,
> nenhum login, nenhum `.env*` aberto, nenhuma linha de código (§16).

---

## 0. As regras do `CLAUDE.md` que este bloco toca

Lido inteiro antes de qualquer outra coisa. As que o I1 toca:

| regra do `CLAUDE.md` | onde o I1 a encontra |
|---|---|
| **Uma árvore por sessão** (`git worktree add ../octavia-<bloco>`); `git add` só por caminho, `git diff --cached --stat` antes do commit | toda PR do bloco; esta nasceu em `../octavia-i1-precheck` |
| **Estado de bloco é artefato de repositório**: a fonte é o `*-ENCERRAMENTO.md`; memória de sessão é rastro | o `I1-ENCERRAMENTO.md` (I1-D15) e os anexos de cada PR |
| **Anexo não carrega texto de música** (div. 204 do N2) | brief (capturas do web pós-corte, I1-D12), aceite no Tab S6 (I1-D14), `frases-web.txt` deste pre-check (só texto do projeto — conferido na §4) |
| **Schema e types do banco são GERADOS**; **migração é código-fonte e a aplicação em prod é do Marcel** | o G-back (I1-D13) protege `supabase/**`; o I1 não prevê migração |
| **Aparato do nativo**: antes de tocar aparelho, emulador, Metro ou mock, ler `docs/native/APARATO.md` | PR-4 (migração do nativo, G-inv 34/34 e 18/18) e o aceite no Tab S6 (I1-D14) |
| **Security requirements** (toda rota com `requireAuthServer`, Zod, erro genérico) | o I1 não muda rota (I1-D9); o G-back é a prova |
| **Component < 150 linhas**, hooks para lógica, testes | as PRs de tela; hoje várias telas passam de 150 (ex.: `components/auth/login-panel.tsx` 329, `components/setlist-manager.tsx` 336 — `wc -l`) |
| **Content Types `Lyrics | Chords | Tab | Sheet`**, enum em `/types/content.ts` | ícones de tipo (§5) |
| **Testing: Vitest + Playwright (gates do ux-audit, sob demanda)**; "suíte E2E do CI removida na B1.0.1" | A8 / H-I1-1 (§8) — o `CLAUDE.md` já dizia o que a §8 mede |
| **Offline Support** (SW + IndexedDB) | A2 — o SW e o cache ficam (§2.3) |

Os documentos do web moram em `docs/ux/` (`ls docs/ux` → `B7-ENCERRAMENTO.md`, `HOTFIX-150.md`,
`B7-PRECHECK-anexos/`, `C-PRECHECK-anexos/`, … — 25 entradas). Não há `docs/README` nem seção
do `CLAUDE.md` com outra convenção: a convenção do prompt vale como está.

### 0.1 Decisões `I1-D1…D15` — `[Marcel, 2026-09-26]`

Transcrição do prompt. Onde a decisão depende de fato do repositório, a seção indicada mede; a
decisão continua valendo sobre o que foi medido.

- **I1-D1** `[Marcel, 2026-09-26]` — Nome: **I1, identidade**. Decisões `I1-D<n>`, erratas `I1-E<n>`, requisitos `T-I1-R<n>`, divergências a partir de 480 (conferido por grep, §0).
- **I1-D2** `[Marcel, 2026-09-26]` — O web deixa de "morrer": ganha a identidade visual do nativo e **mantém tudo de cadastro, edição e alteração** (content e setlists) e a auth. **Só o palco/performance sai do web.**
- **I1-D3** `[Marcel, 2026-09-26]` — Tokens (cores, tipografia, espaçamentos, raios, e os tokens por faixa) e os desenhos dos ícones vão para um pacote novo, **`packages/identidade`**, compartilhado por web e nativo. Fonte em **TS puro** (sem React Native, sem DOM). O nativo importa o objeto; o web consome **CSS custom properties geradas** a partir da fonte (arquivo derivado, com gate "gerado == fonte"). Ícones como paths SVG exportados; cada lado renderiza com o seu componente. 1 dp do nativo = 1 px CSS: as faixas valem literalmente.
- **I1-D4** `[Marcel, 2026-09-26]` — O nativo passa a importar do pacote **neste bloco**, numa PR só de migração, com **G-inv 34/34 e 18/18** como prova de que nada mudou em dp, e `gate:icones` lendo o pacote. É a única PR do bloco que toca `apps/native`.
- **I1-D5** `[Marcel, 2026-09-26]` — O modo palco do web é **apagado** neste bloco. Regra: morre tudo o que **só** o palco usa (rota, componentes, hooks, estilos, testes, cache/SW se só ele os usa); o que é compartilhado fica. A **pré-visualização dentro do editor fica**; qualquer visualização em tela cheia com controles de performance sai. O PWA fica se serve a algo além do palco. URL antiga do palco: **redireciona** para a edição correspondente quando houver; **404** no resto.
- **I1-D6** `[Marcel, 2026-09-26]` — A **primeira PR de código** é o conserto do loop mudo do `POST /api/auth/session` (item do Bloco D; localize o registro com grep). A **segunda** é o login com Google, **consertar, não revogar**: em 22/09/2026 o client OAuth estava marcado para exclusão por inatividade (último uso 26/02/2026); Marcel o renomeou para `Octavia web (auto created by Google Service)` e o último uso passou a 22/09/2026. **Nada mais foi alterado** no console do Google, e nada será alterado sem ser por Marcel.
- **I1-D7** `[Marcel, 2026-09-26]` — Do N3 o web reaproveita **decisões de composição, não código**: as seis de `N3-ENCERRAMENTO.md` §10.5, itens 1–6. Transcritas **do arquivo** (`docs/native/N3-ENCERRAMENTO.md:639-652`, conferido por `grep -nE '^#{1,4} '` → `639:### 10.5 Bloco web (o próximo, decidido)`):

  | # | decisão | onde |
  |---|---|---|
  | 1 | **faixas de largura**, não orientação nem aparelho: A < 700 · B 700–960 · C > 960, cada uma congelada em px/dp; um só ponto de decisão | N3-D12, N3-D24; T3-R1 |
  | 2 | **empilhar, não esconder**: *"quando não cabe, a composição empilha; o conteúdo não sai"* — linha de controles vira duas, grade de duas colunas vira uma, nenhum texto de leitura encolhe | `DESIGN-N3/README.md` §1 |
  | 3 | **a linha de aviso cresce** (48 mín., +20 por linha) e **nunca elide** o motivo, em toda faixa | N3-D19 |
  | 4 | **rótulos curtos com nome acessível longo** (`Adicionar` / `Adicionar música`), só com frases que já existem | N3-D17 |
  | 5 | **tokens por faixa**, nenhuma conta de largura em tela | N3-D28 (regra 21) |
  | 6 | **"passa" se prova em todos os estados**, não no estado base | regra 17 |
- **I1-D8** `[Marcel, 2026-09-26]` — O corte do palco vem **antes** do desenho: o brief usa capturas do web pós-corte.
- **I1-D9** `[Marcel, 2026-09-26]` — Fora a auth (I1-D6) e o item abaixo, o bloco **não muda comportamento**: nenhuma rota, contrato, validação ou fluxo. Isso vira gate. Os itens **5 e 6 de `N2-ENCERRAMENTO.md` §10.3** (remove por `content.id`; id local falso; erro ao apagar setlist já apagada) **entram como requisito da PR da superfície de setlists, condicionado** a este pre-check confirmar que são código de tela, não de rota. A poluição de `content_data` pelo editor (Bloco D) **fica fora**.
- **I1-D10** `[Marcel, 2026-09-26]` — Frases: o web **não** adota o conjunto fechado do nativo neste bloco. O brief pede frases existentes; frases novas que o desenho propuser entram numa lista declarada para decisão de Marcel. Unificar os dois conjuntos é herança com destino N4.
- **I1-D11** `[Marcel, 2026-09-26]` — Faixas no web: **C e B implementadas**; não há faixa acima de C — em C o conteúdo fica num contêiner de largura máxima que a folha decide. A faixa **A só não quebra**, com a lista de inalcançáveis medida por superfície como herança nomeada; a composição de A no web fica registrada sem bloco (nome provisório "I2, se houver").
- **I1-D12** `[Marcel, 2026-09-26]` — Brief e folha próprios, depois do corte: capturas do web pós-corte em C (1138 px) e B (711 px), por superfície e por estado, mais os três `telas.html` (V1, N2, N3) como referência de identidade; Claude Design desenha C e B; duas revisões; congelamento com `SHA256SUMS`; **requisitos no lugar de PRD**, como o N3. A matriz superfície × estado do brief se lê **no código**.
- **I1-D13** `[Marcel, 2026-09-26]` — Quatro gates, numa PR de gate antes de qualquer tela redesenhada, cada um com controle negativo reprovando na `main`: **G-back** (diff vazio no backend do web, exceções no bloco ```gates``` da PR), **G-palco** (zero arquivo e zero import da lista de exclusivos do palco), **G-tok** (nenhum literal de cor/tipo/espaçamento fora de `packages/identidade` nos arquivos redesenhados; CSS gerado idêntico à fonte), **G-faixa** (Playwright em 1138, 711 e 411 px, por superfície e estado, com `boundingBox`: (e) sem nó/largura zero e (b) cortado pela borda reprovam; (d′) triagem; 4 px contra a folha é errata candidata; saídas contadas à parte, como a N3-D29).
- **I1-D14** `[Marcel, 2026-09-26]` — Aceite: Playwright no desktop e **Chrome no Tab S6**, em pé (B) e deitado (C), por superfície, com captura, ao fim de cada PR de tela — o aceite no aparelho não se dispensa (`N2-ENCERRAMENTO.md` §10.6, item 3). Escrita só no **preview da Vercel** com a **conta de audit**; conta principal só leitura ou recurso descartável (regra 12 do catálogo); contagem de escritas no encerramento. Celular real segue a pergunta aberta de `N3-ENCERRAMENTO.md` §10.1.17.
- **I1-D15** `[Marcel, 2026-09-26]` — Fatiamento: PR-0 pre-check (esta) · PR-1 loop mudo · PR-2 Google · PR-3 corte do palco · PR-4 `packages/identidade` + migração do nativo · brief → desenho → congelamento (só docs) · PR-5 o gate · PR-6…n uma superfície por PR · encerramento `I1-ENCERRAMENTO.md`. PR-1/PR-2 correm enquanto o brief está com o Claude Design; PR-4 pode correr em paralelo com PR-3. **W5** corre à parte. Ordem depois do I1: **N4** (content nos apps), **N5** (celular), iOS.

**Do aval do commit 1** (transcrição do prompt do commit 2; "§n" é seção deste documento):

- **I1-D16** `[Marcel, 2026-09-26]` — Não há PR de poda do Playwright (a H-I1-1 se fecha pela div. 486). O **G-faixa** nasce na PR-5 com **config própria** (`playwright.g-faixa.config.ts`): Chromium, viewports 1138 · 711 · 411, **sem `baseURL` padrão** (env obrigatória; sem ela o comando falha), sem `discovery.json`. Roda contra o **preview da Vercel com `storageState` da conta de audit**, pelo executor, em cada PR de tela; o que se commita é a **medição** (`boundingBox` por superfície × estado × largura, JSON no anexo) e o `gates-web.yml` dá o veredito sobre o JSON commitado. O `ux-audit` fica como está, sem rodar.
- **I1-D17** `[Marcel, 2026-09-26]` — A língua do web passa a **pt-BR**, neste bloco, superfície por superfície: o `frases-web.txt` é a lista de partida; cada PR de tela entrega as frases dela em pt-BR numa lista declarada (a mesma da I1-D10); o G-tok ganha um irmão — nenhum literal em inglês nos arquivos redesenhados. Não se traduz o que a PR não redesenha. **Exceção**: o texto de `/privacy-policy` não se traduz nem se reescreve (I1-D19).
- **I1-D18** `[Marcel, 2026-09-26]` — O **PWA morre por inteiro**: manifest, service worker (`worker/index.js`, `public/sw.js`, `scripts/build-sw.js`, registro no layout e hooks), prompt de instalação, página `/offline`. O item 14 do `PLANO-TRANSICAO.md` (popup do Google no PWA instalado, div. 501) deixa de ser caso: não há PWA. **Com eles morrem** o cache offline, a fila de escrita offline e o `/api/proxy` (`lib/offline-cache.ts`, `lib/offline-setlist-cache.ts`, `lib/offline-queue.ts`, `app/api/proxy/route.ts`), removidos na PR-3 com a rota declarada. *(Pergunta 21 do aval; se o Marcel disser o contrário no aval deste commit, a última frase vira herança com destino D.)*
- **I1-D19** `[Marcel, 2026-09-26]` — Saem na PR-3 as páginas `/profile`, `/settings`, `/setup` e `/offline`. Ficam e entram no redesenho como **superfícies públicas**: a **landing (`/`)** — muito simples, para quem recebe o link (o app pode ser compartilhado com colegas de banda) — e a **`/privacy-policy`, com todo o conteúdo de hoje intacto**, só a identidade visual. O signup fica. As rotas de API (`/api/profile` inclusive) **não** saem: página não é rota.
- **I1-D20** `[Marcel, 2026-09-26]` — O G-back tem **extrator próprio do web** (`scripts/gates-web/`, workflow `gates-web.yml` fora do `paths` do `native.yml`), lendo um **segundo bloco ```gates-web```** no corpo da PR. O `gates-decl.sh` e o bloco ```gates``` do nativo não mudam. Hipótese a provar na PR-5 com CN: um bloco `gates-web` no corpo não derruba o `gates-nativos`.
- **I1-D21** `[Marcel, 2026-09-26]` — Escopo do G-back: núcleo = (a) + (b) + (c) + (d) da §9, **com** os 11 arquivos compartilhados; lista derivada do grafo por script commitado e congelada num arquivo; arquivo novo no alcance das rotas reprova sem declaração. Cliente (`lib/setlist-service.ts`, `lib/content-service.ts`) fora.
- **I1-D22** `[Marcel, 2026-09-26]` — **Errata da I1-D5**: o destino de `?contentId=` é **`/content/[id]`** (a visualização), não `/edit`. `?setlistId=` → `/setlists`; `/performance` sem parâmetro → `/dashboard`. Implementado como `redirects()` no `next.config.mjs`, declarado na PR-3. A ausência de URL própria da setlist (div. 497) é herança com destino **D**.
- **I1-D23** `[Marcel, 2026-09-26]` — Os símbolos do palco dentro do backend (div. 493: `getSetlistByIdServer`, `"/performance"` em `PROTECTED_PAGES`, o `no-store` de `security-headers.ts:255`) saem na PR-3, **declarados no corpo** no formato que o G-back vai ler.
- **I1-D24** `[Marcel, 2026-09-26]` — `frame-src`: a PR-2 acrescenta o que o probe 2 medir e **mantém** `'blob:'`; a PR-3 tira o `'blob:'` quando o iframe morre, e leva o `perf02-gate` junto.
- **I1-D25** `[Marcel, 2026-09-26]` — Testes: os três `tests/performance/*` morrem na PR-3; `auto-scroll-button-bug` e `use-content-loading` morrem; `content-display.test.tsx` adapta (tira o caso do `optimized-content-display`); `g-rotas-protegidas` adapta com **par declarado** (ver §2.1 abaixo). Specs do `ux-audit`: `perf02-gate` (projeto e spec) morre; nos outros nove, o trecho do palco sai; spec que fica vazio morre; o `test.fixme` do `cont01-02` sai.
- **I1-D26** `[Marcel, 2026-09-26]` — Toaster (div. 491): nenhum toast entra. A folha desenha os estados de falha das setlists (I1-D7 item 3) e a PR de setlists implementa o estado desenhado; o `use-toast` órfão sai nessa PR, declarado.
- **I1-D27** `[Marcel, 2026-09-26]` — A tela cheia do `pdf-viewer` **fica** (visualização e editor; sem controle de performance).
- **I1-D28** `[Marcel, 2026-09-26]` — Saem na PR-3 as menções ao palco em superfícies vivas (§2.2): as chaves `Auto Scroll`/`Performance Mode` de `DisplaySettings.tsx` (a página inteira sai pela I1-D19), a frase de `app/offline/page.tsx:159` (sai com a página) e as duas de `pwa-install-prompt.tsx:202-203` (sai com o PWA).
- **I1-D29** `[Marcel, 2026-09-26]` — "(max 50MB)" (div. 499) é defeito de texto: a PR de upload corrige para o limite real (4 MiB), e a folha já nasce com ele. Requisito, não extra.
- **I1-D30** `[Marcel, 2026-09-26]` — `faixaDe` e os limiares 700/960 migram para `packages/identidade` na PR-4 (um só ponto de decisão, I1-D7 item 1); `faixa.test.ts:50-54` passa a procurar lá (par declarado no G1b). `useFaixa` fica no nativo.
- **I1-D31** `[Marcel, 2026-09-26]` — `font` (div. 485): o pacote guarda **família + peso**; o nativo mantém um mapa família+peso → nome do `.ttf` do `expo-font` em `apps/native`, com teste que prova que todo token do pacote tem entrada no mapa; o G-inv prova que nada mudou em dp.
- **I1-D32** `[Marcel, 2026-09-26]` — Errata "morre com a web" (div. 492): **neste commit**, uma nota no topo da seção do Bloco D no `PLANO-TRANSICAO.md` e uma linha ao lado de `N1-ENCERRAMENTO.md:348`, apontando para a I1-D2, **sem reescrever** o texto (o padrão da errata do `N2-ENCERRAMENTO.md` §10.2). Confira as linhas com `grep` antes.
- **I1-D33** `[Marcel, 2026-09-26]` — Div. 498 (`handleSelectSetlist` para rota inexistente) sai na PR de setlists, declarada.

Leituras do executor sobre as decisões acima, cada uma com a divergência onde mora: o "§2.1 abaixo" da
I1-D25 é o **2.1 do prompt do commit 2** (a medição do G-rotas, aqui §17.1); a I1-D25 e a I1-D30 pedem
par do G1b para testes que o G1b não lê (divs. 503, 504); a I1-D23 não cobre os prefixos `/settings`
e `/profile` que a I1-D19 obriga a tirar (div. 505). A I1-D32 foi aplicada neste commit:
`docs/ux/PLANO-TRANSICAO.md` (nota sob `## Bloco D — Morre com a web`, linha 866 antes da nota) e
`docs/native/N1-ENCERRAMENTO.md` (nota sob `### Bloco D (web — morre com a web…)`, linha 348),
conferidas por `grep -n` antes; nenhum dos dois tem sha registrado (`grep -rln` nos `SHA256SUMS` → 0).

**Conferência das citações do prompt** (só se cita o que se abriu nesta sessão):

| citação do prompt | conferido em | resultado |
|---|---|---|
| `N3-ENCERRAMENTO.md` §10.5, itens 1–6 | `:639-652` | bate (a tabela acima é cópia) |
| `N3-ENCERRAMENTO.md` §10.1.17 | `:556` (`### 10.1 N5 (celular)`), linha 17 da 2ª tabela | bate: *"pergunta aberta: aparelho de celular real para o aceite"* |
| `N3-ENCERRAMENTO.md` §10.3 | `:620` (`### 10.3 W5 (instrumento)`) | existe (itens 1–5 do W5) |
| `N2-ENCERRAMENTO.md` §10.3, itens 5 e 6 | `:583` (`### 10.3 Bloco D (backend)`) | bate: 5 = *"dois defeitos do web (remove por `content.id`; id local falso)"*, div. 156; 6 = *"o web mostra erro ao apagar setlist já apagada"*, div. 172 |
| `N2-ENCERRAMENTO.md` §10.6, item 3 | `:619` (`### 10.6 Do N2`) | bate: *"`native-tela` prova árvore, não geometria — o aceite no aparelho não se dispensa"* |
| `N2-ENCERRAMENTO.md` §10.8 | `:638` (`### 10.8 Próximo bloco decidido`) | bate: *"O web com a identidade visual do nativo"* |

**Numeração das divergências** `[medido]`:

```
$ git grep -nE '\*\*4[7-9][0-9]\*\*' docs | sort -t'*' -k3 -n | tail -5
docs/native/N3-ENCERRAMENTO.md:714:| **476** | P | …
docs/native/N3-ENCERRAMENTO.md:715:| **477** | D | …
docs/native/N3-ENCERRAMENTO.md:716:| **478** | P | …
docs/native/N3-ENCERRAMENTO.md:717:| **479** | D | …
docs/native/N3-PRECHECK-anexos/faseA/A2.md:607:| S0 | coluna (quebrado) | 32 + max(340, 420) + 32 | **484** | …
```

A última **divergência** é a **479**; o `**484**` é uma medida em dp da tabela do S0, não um
número de divergência (div. 480). A numeração deste pre-check começa em **480**, como o prompt
presumiu.

### 0.2 Hipóteses `H-I1-n`

| id | hipótese | estado | o que a fecha |
|---|---|---|---|
| **H-I1-1** | **Pendente de aval (não é decisão)**, transcrita do prompt: *"o Playwright do web passa a rodar só Chromium desktop, com as três larguras do G-faixa como viewports (não como `devices` emulados); WebKit/Firefox saem; a poda é uma PR própria e pequena entre esta e a PR-1, com o tempo do job no CI medido antes e depois como CN."* | **FECHADA pela div. 486 → I1-D16** (commit 2). A premissa já era o estado da `main` (§8): um só config, nenhum WebKit/Firefox/`devices`, nenhum job no CI | — |
| **H-I1-2** | o **loop mudo** é de navegação e se repete sozinho enquanto o `POST /api/auth/session` falhar: cada volta = 1 `POST /api/auth/session` + 1–2 `GET /api/profile` (+ 1 `POST /api/profile` se o perfil não existir) + 1 navegação cheia a `/dashboard` + 1 redirect a `/login` (§10) | `[hipótese]` pela leitura | Fase B, probe 1 (§14) |
| **H-I1-3** | o Google falha **no navegador**, pela CSP/COOP de hoje, antes de qualquer coisa do client OAuth: `frame-src` só `'blob:'` bloqueia o iframe de auth do Firebase em `*.firebaseapp.com`; `Cross-Origin-Opener-Policy: same-origin` corta o popup do opener; o `script-src` não inclui `https://apis.google.com`. As três vêm do `8af7f34` (2026-02-26), **a mesma data do último uso do client OAuth** (I1-D6) (§11) | `[hipótese]` pela leitura; a coincidência de data é `[medido]` | Fase B, probe 2 (§14) |
| **H-I1-4** | a largura CSS do Chrome no Tab S6 é a largura em dp do app (711 em pé, 1138 deitado) — o Chrome não tem barra lateral, então a largura coincide; a altura útil é menor (barra de endereço) | `[hipótese]` | aceite no aparelho (I1-D14): `window.innerWidth`/`innerHeight` na primeira captura |
| **H-I1-5** | **nenhum toast das setlists aparece**: `components/setlist-manager.tsx:7` importa `toast` de `@/hooks/use-toast` (shadcn), cujo `<Toaster>` (`components/ui/toaster.tsx`) não tem importador; o único montado é o do sonner (`app/layout.tsx:127`) (§3, §12, div. 491) | `[lido]` | Fase B, probe 4, no preview |
| **H-I1-6** | o Chrome desktop do G-faixa e o Chrome do Tab S6 dão a mesma quebra de linha nas mesmas larguras (fontes do pacote servidas pelo web, não do sistema) | `[hipótese]` | primeira PR de tela: G-faixa × aceite no aparelho |

---

## 1. A1 — Rotas e páginas do web

`[medido]` (anexo [`rotas.txt`](I1-PRECHECK-anexos/rotas.txt)): a raiz é `app/` (App Router,
sem `src/`); `find app \( -name 'page.tsx' -o -name 'route.ts' -o -name 'layout.tsx' -o -name 'loading.tsx' \) | wc -l`
→ **34** (18 `page.tsx`, 14 `route.ts`, 1 `layout.tsx`, 1 `loading.tsx`); mais `middleware.ts`.
Não há `error.tsx`, `not-found.tsx` nem `template.tsx` em `app/`.

Classificação por superfície `[lido]`:

| URL | arquivo | tipo | superfície |
|---|---|---|---|
| `/` | `app/page.tsx` | página (landing, 350 linhas) | outra |
| — | `app/layout.tsx` | layout raiz (Toaster sonner, PWA prompt, SW, `FirebaseAuthProvider`) | shell |
| — | `middleware.ts` | middleware otimista (forma do cookie) + cabeçalhos de segurança | backend |
| `/login` | `app/login/page.tsx` → `components/auth/login-panel.tsx` | página | auth |
| `/signup` | `app/signup/page.tsx` → `components/auth/signup-panel.tsx` | página | auth |
| `/signup/confirm-email` | `app/signup/confirm-email/page.tsx` | página | auth |
| `/verify-email` | `app/verify-email/page.tsx` | página | auth |
| `/forgot-password` | `app/forgot-password/page.tsx` | página | auth |
| `/dashboard` | `app/dashboard/page.tsx` → `components/dashboard-page-client.tsx` | página | content-lista |
| `/library` | `app/library/page.tsx` → `components/library-page-client.tsx` | página | content-lista |
| `/content/[id]` | `app/content/[id]/page.tsx` → `components/content-page-client.tsx` | página (visualização) | content-editor |
| `/content/[id]/edit` | `app/content/[id]/edit/page.tsx` → `components/content-edit-page-client.tsx` | página (edição) | content-editor |
| `/add-content` | `app/add-content/page.tsx` → `components/add-content-page-client.tsx` | página | upload |
| `/setlists` | `app/setlists/page.tsx` → `components/setlists-page-client.tsx` → `components/setlist-manager.tsx` | página (lista **e** edição na mesma URL) | setlists-lista + setlists-edição |
| `/performance` | `app/performance/page.tsx` → `components/performance-page-client.tsx` | página | **palco** |
| `/performance` | `app/performance/loading.tsx` | loading | **palco** |
| `/profile` | `app/profile/page.tsx` | página | outra |
| `/settings` | `app/settings/page.tsx` | página | outra |
| `/offline` | `app/offline/page.tsx` | página (fallback do SW) | outra |
| `/setup` | `app/setup/page.tsx` | página (cria o bucket) | outra |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | página | outra |
| `/api/auth/session` | `app/api/auth/session/route.ts` | API `POST DELETE` | auth (backend) |
| `/api/profile` | `app/api/profile/route.ts` | API `GET POST PATCH` | auth (backend) |
| `/api/content` | `app/api/content/route.ts` | API `GET POST PUT DELETE` | content (backend) |
| `/api/content/[id]` | `app/api/content/[id]/route.ts` | API `GET DELETE` | content (backend) |
| `/api/setlists` | `app/api/setlists/route.ts` | API `GET POST` | setlists (backend) |
| `/api/setlists/[id]` | `app/api/setlists/[id]/route.ts` | API `GET PUT DELETE` | setlists (backend) |
| `/api/setlists/[id]/songs` | `app/api/setlists/[id]/songs/route.ts` | API `POST` | setlists (backend) |
| `/api/setlists/[id]/songs/order` | `app/api/setlists/[id]/songs/order/route.ts` | API `PUT` | setlists (backend) |
| `/api/setlists/songs/[songId]` | `app/api/setlists/songs/[songId]/route.ts` | API `DELETE` | setlists (backend) |
| `/api/storage/upload` | `app/api/storage/upload/route.ts` | API `POST` | upload (backend) |
| `/api/storage/list` | `app/api/storage/list/route.ts` | API `GET` | upload (backend) |
| `/api/storage/delete` | `app/api/storage/delete/route.ts` | API `POST` | upload (backend) |
| `/api/proxy` | `app/api/proxy/route.ts` | API `GET` | compartilhada (cache offline e palco) |
| `/api/health` | `app/api/health/route.ts` | API `GET` | outra |

Métodos: `[medido]` `grep -oE 'export (const|async function) (GET|POST|PUT|PATCH|DELETE)'` por
rota. `/performance` **não** está nos prefixos do middleware (`lib/protected-routes.ts:7-9`, nota
da B1.2a) — a proteção é da página (`app/performance/page.tsx:21`, `requirePageUser`).

**Entradas do palco a partir de outras superfícies** `[medido: grep -rnE "onEnterPerformance|/performance" …]`:
`components/dashboard-page-client.tsx:34` (`router.push("/performance")`, sem parâmetro),
`components/content-page-client.tsx:47` (`?contentId=`), `components/setlists-page-client.tsx:42`
(`?setlistId=…&startingSongIndex=`), e a cadeia de props `onEnterPerformance` em
`components/content-viewer.tsx`, `content-viewer/ContentHeader.tsx:95`, `dashboard.tsx`,
`setlist-manager.tsx:262,273`, `setlist/setlist-list.tsx`, `setlist/setlist-card.tsx:189`,
`setlist/setlist-details.tsx:168,278`. São botões em superfícies que ficam — a PR-3 os tira.

---

## 2. A2 — O grafo do palco

**Método** `[medido]`: o grafo de importação do `dependency-cruiser` (já no repositório,
`.dependency-cruiser.cjs`, aliases `@/` resolvidos pelo `tsconfig`, `import()` dinâmico incluído —
49 arestas `dynamic-import`), e um alcance por raízes (anexo
[`script-a2.txt`](I1-PRECHECK-anexos/script-a2.txt)):

```
pnpm exec depcruise --config .dependency-cruiser.cjs --output-type json \
  app components hooks lib contexts types middleware.ts tests __tests__ > dc-all.json
node a2.mjs dc-all.json <dir>
{ modulosLocais: 335, prod: 230, testes: 105,
  palcoRoots: [ 'app/performance/loading.tsx', 'app/performance/page.tsx' ],
  outrasRoots: 33, P: 45, O: 188, exclusivos: 23, compart: 22, orfaos: 19,
  testesSoPalco: 6, testesTocam: 4 }
```

Raízes do palco = `app/performance/page.tsx` e `loading.tsx`; demais raízes = as outras 33
(`page`/`layout`/`loading`/`route` + `middleware.ts`). **Exclusivo** = alcançado só pelas raízes do
palco; **compartilhado** = alcançado pelo palco e por outra raiz. Não resolvidos pelo cruiser: 3
(`firebase-admin/auth` e dois `.css` do `react-pdf`) — nenhum deles é arquivo do repositório.

### 2.1 A tabela — exclusivos × compartilhados

| **exclusivos do palco (23)** — anexo [`palco-exclusivos.txt`](I1-PRECHECK-anexos/palco-exclusivos.txt) | **compartilhados com outra superfície (22)** — anexo [`palco-compartilhados.txt`](I1-PRECHECK-anexos/palco-compartilhados.txt) |
|---|---|
| `app/performance/loading.tsx` | `components/ui/button.tsx` |
| `app/performance/page.tsx` | `components/ui/card.tsx` |
| `components/optimized-performance-mode.tsx` | `lib/api-errors.ts` |
| `components/performance-mode/empty-state.tsx` | `lib/auth-manager.ts` |
| `components/performance-mode/header-controls.tsx` | `lib/content-service-server.ts` |
| `components/performance-mode/loading-state.tsx` | `lib/content-service.ts` |
| `components/performance-mode/memory-stats.tsx` | `lib/content-types.ts` |
| `components/performance-mode/navigation-controls.tsx` | `lib/debug.ts` |
| `components/performance-mode/optimized-content-display.tsx` | `lib/firebase-admin.ts` |
| `components/performance-mode/performance-warning.tsx` | `lib/firebase-server-utils.ts` |
| `components/performance-page-client.tsx` | `lib/firebase.ts` |
| `hooks/use-content-loading.ts` | `lib/logger.ts` |
| `hooks/use-content-renderer.ts` | `lib/offline-queue.ts` |
| `hooks/use-keyboard-shortcuts.ts` | `lib/require-page-user.ts` |
| `hooks/use-performance-controls.ts` | `lib/setlist-service.ts` |
| `hooks/use-performance-effects.ts` | `lib/supabase-service.ts` |
| `hooks/use-performance-monitoring-ui.ts` | `lib/supabase.ts` |
| `hooks/use-performance-navigation.ts` | `lib/user-rate-limit.ts` |
| `hooks/use-songs-transformation.ts` | `lib/utils.ts` |
| `hooks/use-wake-lock.ts` | `types/content.ts` |
| `lib/advanced-content-cache.ts` | `types/database.types.ts` |
| `lib/memory-management.ts` | `types/performance.ts` |
| `lib/performance-monitor.ts` | |

**Testes** (anexo [`palco-testes.txt`](I1-PRECHECK-anexos/palco-testes.txt)), classificados pelos
imports diretos:

| classe | arquivos |
|---|---|
| **só-palco** (todo import de código é exclusivo) — 6 | `__tests__/performance-mode/chords-display-bug.test.tsx`, `__tests__/performance-mode/empty-state.test.tsx`, `hooks/__tests__/use-content-renderer.test.ts`, `hooks/__tests__/use-performance-navigation.test.ts`, `tests/hooks/use-performance-controls.memory.test.ts`, `tests/hooks/use-performance-monitoring-ui.test.ts` |
| **toca o palco** (alcança exclusivo, importa outra coisa também) — 4 | `__tests__/performance-mode/auto-scroll-button-bug.test.tsx`, `components/__tests__/content-display.test.tsx` (importa `components/performance-mode/optimized-content-display` direto), `tests/gates/g-rotas-protegidas.test.ts` (o G-rotas percorre `/performance` em `PROTECTED_PAGES`), `tests/hooks/use-content-loading.test.ts` |
| **nome de palco, zero import do app** — 3 | `tests/performance/live-music-performance.bench.tsx`, `tests/performance/memory-leak-detection.test.tsx`, `tests/performance/performance-mode-responsiveness.test.tsx` — reproduzem um palco próprio dentro do teste; o grafo não os liga a nada (o último é o flake registrado no `B3-ENCERRAMENTO.md:138-141`) |

Playwright: 9 specs entram em `/performance` (§8).

### 2.2 O que o grafo por arquivo não vê — símbolos do palco dentro de arquivo compartilhado `[lido]`

| arquivo (compartilhado) | símbolo só do palco | único consumidor |
|---|---|---|
| `lib/content-service-server.ts:91` | `getSetlistByIdServer` | `app/performance/page.tsx:36` (`grep -rn getSetlistByIdServer` → só essas duas linhas) |
| `lib/protected-routes.ts:44` | `"/performance"` em `PROTECTED_PAGES` | o G-rotas (`tests/gates/g-rotas-protegidas.test.ts`) |
| `lib/security-headers.ts:79-85` | `'frame-src': ['blob:']` — o comentário PERF-02 diz *"único iframe do app"* | `components/performance-mode/optimized-content-display.tsx:43` (`grep -rn "<iframe"` → só ele) |
| `lib/security-headers.ts:255` | `no-store` quando o caminho inclui `/performance` | — |
| `types/performance.ts:30-74` | `PerformanceModeProps`, `SongData`, `PerformanceControlsState`, `ContentCacheState`, `ContentRenderInfo` | arquivos exclusivos; `SetlistWithSongs`/`SetlistFormData` (`:15`, `:21`) ficam — `components/setlist/index.ts:8` os reexporta |
| `components/settings/DisplaySettings.tsx:62-79` | chaves `Auto Scroll` e `Performance Mode` | ninguém as lê: `grep -rn "performanceMode\|autoScroll"` fora do palco → só `DisplaySettings.tsx` e o estado inicial em `RefactoredSettings.tsx:14,16` |
| `app/offline/page.tsx:159` | texto *"Use performance mode with cached content"* | — |
| `components/pwa-install-prompt.tsx:202-203` | *"Stage Ready"* / *"Full-screen performance mode optimized for gigs"* | — |

Três dos quatro primeiros estão em arquivos do **backend** (§9) — div. 493.

### 2.3 Os seis itens medidos à parte

| item | onde vive | quem usa além do palco | leitura para a I1-D5 |
|---|---|---|---|
| **service worker** | fonte `worker/index.js`, copiado para `public/sw.js` por `scripts/build-sw.js` (9 linhas; roda no `pnpm build`); registrado por `components/service-worker-wrapper.tsx` e `hooks/use-service-worker.tsx` a partir de `app/layout.tsx` | **todas as navegações**: `public/sw.js:64-122` é genérico — cache-first de 8 assets fixos (`:10-19`), cache de `/_next/static` e `/_next/image`, network-first de toda navegação com fallback para `/offline`. Nenhuma linha fala de `/performance` (`grep -nE "performance" public/sw.js` → 0) | **fica** |
| **manifest PWA** | `public/manifest.json` (76 linhas), `app/layout.tsx:18` | o app inteiro (`start_url: "/"`, `display: standalone`); cores `#fff9f0`/`#f59e0b` são da identidade antiga | **fica** (as cores mudam com a identidade) |
| **cache offline** | `lib/offline-cache.ts` (content), `lib/offline-setlist-cache.ts` (setlists), `lib/offline-queue.ts` (fila de escrita) | `offline-cache` ← `app/offline/page.tsx`, `content-edit-page-client.tsx`, `content-page-client.tsx`, `contexts/firebase-auth-context.tsx`, `hooks/use-content-actions.ts`, `use-library-data.ts`, `use-setlist-data.ts`, `useContentFile.ts`; `offline-setlist-cache` ← `app/offline/page.tsx`, `setlist-manager.tsx`, `firebase-auth-context.tsx`, `use-setlist-data.ts`; `offline-queue` ← `use-service-worker.tsx`, `content-service.ts` | **fica**. Só o palco usa `lib/advanced-content-cache.ts` e `lib/memory-management.ts` (exclusivos). `/api/proxy` fica: `lib/offline-cache.ts:173` o usa |
| **keep-awake / wake lock** | `hooks/use-wake-lock.ts` | ninguém (`grep -rlE "wakeLock|use-wake-lock"` → só `optimized-performance-mode.tsx` e o próprio hook) | **sai** |
| **atalhos de teclado** | `hooks/use-keyboard-shortcuts.ts`; `keydown` em `use-performance-effects.ts`, `use-performance-navigation.ts` | ninguém | **sai** |
| **tela cheia** | `requestFullscreen` só em `components/pdf-viewer.tsx:111-118,147` | o `PdfViewer` é usado por `content-viewer/SheetMusicDisplay.tsx` e `editors/content-type-editor.tsx` — **a visualização e o editor**, não o palco | **fica** — é o botão de tela cheia do PDF dentro do editor/visualização; a I1-D5 ("qualquer visualização em tela cheia com controles de performance sai") pede leitura do revisor (pergunta 11) |

A "Fila A" que o prompt pede para localizar não existe nos documentos (div. 482); o cache
offline foi medido pelos importadores, acima.

**Redirect da URL antiga** `[lido]`: `?contentId=<id>` tem edição correspondente
(`/content/[id]/edit`); `?setlistId=<id>` **não tem URL própria** — a setlist selecionada é estado
da página `/setlists` (`setlist-manager.tsx`), e o `handleSelectSetlist` que empurraria
`/setlist/${id}` (`setlists-page-client.tsx:37-39`) aponta para rota que não existe e não é passado
a ninguém (div. 498); `/performance` sem parâmetro é o que o dashboard abre (`dashboard-page-client.tsx:34`).
Div. 497.

---

## 3. A3 — Superfícies e a matriz de estados

Lida no código, por superfície, com arquivo e linha de onde cada estado nasce, o texto visível e
se a UI o alcança: anexo [`matriz-estados.txt`](I1-PRECHECK-anexos/matriz-estados.txt) (416
linhas; 210 citações `arquivo:linha`, 197 resolvidas por nome e dentro do arquivo; 13 são
`page.tsx:N` situadas pelo cabeçalho da seção). É rastro de leitura `[lido]`; o que a tela mostra
de fato se prova na Fase B e no aceite.

Componentes de tela por superfície (o mapa arquivo → superfícies é o anexo
[`superficies.txt`](I1-PRECHECK-anexos/superficies.txt), 163 arquivos alcançados pelas raízes, palco
fora): auth 7 telas + `lib/firebase-errors.ts`; content-lista (`library-page-client`,
`dashboard`, `components/library/*`); content-editor (`content-page-client`, `content-viewer/*`,
`content-edit-page-client`, `editors/*`, `chord-editor`, `tab-editor`, `lyrics-editor`,
`pdf-viewer`); upload (`add-content-page-client`, `add-content/*`, `metadata-form/*`); setlists
(`setlists-page-client`, `setlist-manager`, `setlist/*`).

O que a matriz achou e pesa no brief e no G-faixa (cada item com a linha no anexo; os marcados
✓ foram reconferidos à mão nesta sessão):

1. ✓ **Nenhum toast das setlists aparece** — `components/setlist-manager.tsx:7` usa o `toast` de
   `@/hooks/use-toast`; o `<Toaster>` desse sistema (`components/ui/toaster.tsx`) não tem
   importador (está entre os órfãos do grafo, `palco-compartilhados.txt`); o único montado é o do
   sonner, `app/layout.tsx:127`. Criar, editar, apagar, adicionar e remover não dizem nada, e os
   diálogos que só fecham no caminho de sucesso ficam abertos na falha (H-I1-5; div. 491).
2. **Erro vira vazio** na biblioteca (`hooks/use-library-data.ts:151-160` troca a falha pelo cache ou
   pela lista vazia) e no dashboard (`lib/content-service.ts:128-130`, `:682-689` devolvem `[]`).
   Só as setlists separam erro de vazio.
3. **Um texto para várias espécies de erro**: a edição mostra *"Content Not Found"* com *"Failed to
   load content for editing."* para rede, 401, 429 e 5xx (`app/content/[id]/edit/page.tsx:41` →
   `:93`); a lista de setlists pede *"Check your connection"* também em 401/429/5xx.
4. ✓ **O limite anunciado não é o real**: `components/add-content/FileUploadZone.tsx:112` diz
   *"(max 50MB)"*; o teto é **4 MiB** (`lib/api-schemas.ts:259`, B5). Div. 499.
5. **Não há `error.tsx`, `not-found.tsx` nem `loading.tsx`** fora de `app/performance/` (§1):
   exceção em página server cai na tela padrão do Next; várias telas retornam `null` enquanto
   carregam.
6. **Estados no código que a UI não alcança** (marcados *INALCANÇÁVEL?* no anexo): editar inline,
   apagar e o diálogo de apagar da visualização (`content-viewer.tsx:23`, `:45`); os erros de
   apagar/favoritar da biblioteca (o `error` do hook nunca é lido); a conclusão do lote no
   add-content; o *"Loading songs..."* do seletor; o botão *Share*.
7. **Sem rede**: não há indicador global; a escrita offline entra na fila (`lib/offline-queue.ts`)
   mas a tela mostra erro.

Para o **G-faixa**, a matriz é a lista de estados a capturar por superfície; para o **brief**, é a
coluna "estado" da I1-D12.

---

## 4. A4 — Frases do web

`[medido]` — anexo [`frases-web.txt`](I1-PRECHECK-anexos/frases-web.txt) (extração por AST do
TypeScript: texto JSX; atributos `placeholder`/`title`/`aria-label`/`alt`/`label`/`description`;
strings de `setError`/`toast`/`toast.*`/`alert`/`confirm`; `new Error('…')`; script no anexo
[`script-a456.txt`](I1-PRECHECK-anexos/script-a456.txt)):

- **750** ocorrências, **591** distintas, em **87** arquivos. **Espalhadas**: não há arquivo
  central de frases; a única tabela é `lib/firebase-errors.ts` (código do Firebase → texto),
  consumida por `getErrorMessage` (`:217`).
- Por arquivo, os dez maiores: `app/setup/page.tsx` 58 · `app/page.tsx` 52 ·
  `components/tab-editor.tsx` 30 · `components/auth/signup-panel.tsx` 28 ·
  `components/dashboard.tsx` 26 · `components/unified-metadata-editor.tsx` 25 ·
  `components/auth/login-panel.tsx` 24 · `app/privacy-policy/page.tsx` 24 ·
  `lib/setlist-service.ts` 22 · `components/chord-editor.tsx` 21 (a lista inteira está no anexo).
- **Relação com `packages/core/src/frases.ts`: nenhuma.** `git grep -nE "@octavia/core|packages/core"`
  nas pastas do web → 0 linhas; interseção exata entre as 591 distintas do web e os 171 literais do
  `frases.ts` (`comm -12`) → **0**.
- **Língua**: a UI do web é **inglês**. Distintas com marca de português
  (`grep -ciE '[ãõçáéíóúâêô]| (de|da|do|para|não|uma|com) '`) → **13**, das quais 12 são da política
  de privacidade (bilíngue) e 1 é falso positivo (*"Passwords do not match"*). O conjunto do nativo
  é pt-BR. Div. 496.
- Texto de música: nenhum no anexo — os literais de editor são do projeto (*"Am F C G"*,
  *"Standard (EADGBE)"*, dicas de tablatura), fixture escrita pelo projeto, que a regra do
  `CLAUDE.md` deixa ficar.

---

## 5. A5 — Ícones do web

`[medido]` — anexo [`icones-web.txt`](I1-PRECHECK-anexos/icones-web.txt):

- Biblioteca: **só `lucide-react`** (`^0.454.0`, `package.json`). `<svg` inline nos 163 arquivos das
  superfícies → **0**; `react-icons`/`@heroicons`/`@radix-ui/react-icons` → **0**.
- **217** imports, **86** nomes distintos, dos quais **85** ícones (o 86º, `LucideIcon`, é o tipo
  importado em `types/content.ts`).
- Distintos por superfície (inclui os que vêm do shell de navegação e dos primitivos de
  `components/ui/`, e o tipo `LucideIcon` em content-lista, content-editor, upload e setlists):
  auth **14** · content-lista **38** · content-editor **60** · upload **33** · setlists **34** ·
  outra **36** · shell **9**.

**O catálogo do nativo** `[medido]`: o número **39** está na §6.4 do `DESIGN-V1` (errata,
`docs/native/DESIGN-V1/README.md:607`: *"39 linhas"*) e em `docs/native/DESIGN-N2/README.md:28`
(*"5 desenhos, catálogo 34 → 39 registros"*); o anexo D do V1 tem **34** e o do N2 **5** (div. 483).
O mapa `apps/native/src/icones/dados.ts` tem **43** nomes
(`grep -cE "^  ['\"]?[a-z0-9-]+['\"]?: \{"` → 43) = 39 linhas do catálogo (o `voltar` duas vezes
na tabela e uma no mapa; o par `adicionar / remover` um registro e dois nomes) + 4 fora do catálogo
(`log-in`, `email`, `senha`, `nada-encontrado`).

Cruzamento `[lido]` — por significado; "candidato" = o desenho não foi comparado, só o papel:

| ícone do web (lucide) | equivalente no catálogo do nativo |
|---|---|
| `ArrowLeft` | `voltar` |
| `X` | `fechar` |
| `Search` | `busca` / `buscar-musica` |
| `LogOut` | `sair` |
| `Trash2` | `apagar` / `apagar-setlist` |
| `Plus` | `adicionar` / `nova-setlist` |
| `Edit`, `Pen` | `renomear` (candidato) |
| `GripVertical` | `alca` |
| `Calendar` | `data` |
| `MapPin` | `local` |
| `Mail` | `email` |
| `Lock` | `senha` |
| `WifiOff` | `sem-conexao` |
| `RefreshCw`, `RotateCw` | `tentar-novamente` (candidato) |
| `AlertCircle`, `AlertTriangle`, `XCircle` | `falha` (candidato) |
| `ZoomIn` / `ZoomOut` | `zoom-mais` / `zoom-menos` |
| `Download` | `baixar-setlist` (candidato) |
| `Loader2` | `baixando` (candidato) |
| `Clock` | `ultima-sincronizacao` (candidato) |
| `Check`, `CheckCircle` | `garantida` (candidato) |
| `FileText` / `Guitar` / `FileMusic` | `letra` / `tab` / `partitura` (candidatos; o web usa `Music`/`MusicIcon`/`Disc3`/`Mic` também para tipo) |
| `Home` | `voltar-ao-inicio` (candidato) |
| `Menu` | `indice` (candidato) |
| **sem equivalente** (os demais, 58 nomes) | `AlignLeft`, `ArrowRight`, `ArrowUpDown`, `BookOpen`, `ChevronDown/Left/Right/Up`, `Circle`, `Cloud`, `Copy`, `Disc3`, `Eraser`, `Filter`, `Folder`, `Globe`, `Grid`, `Highlighter`, `Info`, `Library`, `Maximize`, `Minimize`, `MessageSquare`, `Mic`, `Monitor`, `MoreHorizontal`, `MoreVertical`, `Music`, `MusicIcon`, `Palette`, `PanelLeftClose`, `PanelLeftOpen`, `Pause`, `Play`, `Save`, `Settings`, `SettingsIcon`, `Share`, `Sliders`, `Smartphone`, `Sparkles`, `Square`, `Star`, `StretchHorizontal`, `StretchVertical`, `Tag`, `Type`, `Upload`, `User`, `UserPlus`, `Users`, `Volume2`, `Wifi`, `Zap` … (lista completa com superfícies no anexo) |

---

## 6. A6 — Tokens do web hoje

Onde vivem `[medido]`:

- `tailwind.config.ts` (112 linhas): `extend.colors` (`:22`) e `borderRadius` (`:69`) apontando para
  as variáveis do shadcn; `safelist` de cores de tipo de conteúdo (`:92`).
- `app/globals.css` (111 linhas): **55** custom properties (`grep -nE "^\s*--[a-z-]+:"`) — o tema
  **neutro do shadcn** (HSL cinza, `--radius: 0.5rem`, `.dark`); `body { font-family: Arial,
  Helvetica, sans-serif }` (`:5-7`).
- **Na prática a identidade de hoje não mora nos tokens**: mora nas classes de paleta do Tailwind
  (âmbar/laranja) e em hex arbitrário (`bg-[#fffcf7]`, `text-[#1A1F36]`) direto nos componentes.

Linha de base do G-tok — anexo [`literais-web.txt`](I1-PRECHECK-anexos/literais-web.txt), por
arquivo das superfícies (palco fora):

| medida | total |
|---|---|
| hex (`#[0-9a-fA-F]{3,8}`) | **186** |
| `rgb(`/`rgba(`/`hsl(`/`hsla(` | **0** |
| classe de paleta do Tailwind (`bg-amber-50`, `text-gray-600`, …) | **1208** |
| tamanho de fonte (`text-xs…9xl`, `text-[Npx]`, `fontSize:`) | **365** |
| classe de espaçamento (`p-*`, `m-*`, `gap-*`, `space-*`) | **1003** |
| classe de raio (`rounded*`) | **197** |

Hex mais frequentes: `#2E7CE4` 37 · `#1A1F36` 30 · `#6B7280` 27 · `#E8E3DA` 21 · `#F8F9FA` 11.
Maiores por hex: `setlist/setlist-details.tsx` 31, `setlist/setlist-card.tsx` 26,
`setlist/song-selection-dialog.tsx` 25; por paleta: `app/page.tsx` 151, `components/dashboard.tsx` 89,
`auth/signup-panel.tsx` 60, `auth/login-panel.tsx` 57.

---

## 7. A7 — O que migra do nativo para o pacote

`ls apps/native/src` → `theme.ts` existe (292 linhas); o mapa de ícones é
`apps/native/src/icones/dados.ts` (246) + `Icone.tsx` (98), cobrado por `apps/native/scripts/icones.mjs`
(435).

| token / desenho | onde vive hoje | depende de RN? | leitura |
|---|---|---|---|
| paletas `dark`, `light`, `colors`, `ThemeColors` | `theme.ts:14-56` | **não** | migra como está |
| `space`, `radius`, `touch`, `bar` | `theme.ts:59-68` | não | migra |
| `font` (famílias) | `theme.ts:75-82` | **não importa RN, mas o valor é nome de arquivo `.ttf` do `expo-font`** (`'Raleway_600SemiBold'`, `'Manrope_400Regular'`, `'IBMPlexMono_400Regular'`…) | não serve ao CSS como está: o web precisa de família + peso (div. 485) |
| `size`, `zoomSteps`, `zoomDefault`, `lineHeight`, `tracking` | `theme.ts:90-111` | não | migra (`tracking` está em `em`) |
| **tokens por faixa** `TokensDaFaixa`, `faixaC`, `faixaB`, `faixas` | `theme.ts:139-292` | não (`import type { Faixa } from './faixa'` é o único import do arquivo) | migra; os campos são por superfície do **nativo** (`s1`, `s2`, `reordenar`, `folha`, `picker`, `palco`, `s5`) — o web terá os seus |
| `faixaDe` (os limiares 700/960) | `faixa.ts` (função pura) | não | **não está na lista da I1-D3**; `apps/native/test/faixa.test.ts:50-54` reprova se 700/960 aparecerem fora de `src/faixa.ts` (pergunta 15) |
| `useFaixa` | `useFaixa.ts` | **sim** (`useWindowDimensions`) | fica no nativo |
| desenhos dos ícones `desenhos`, `Primitiva`, `Desenho`, `TintaIcone` | `icones/dados.ts` | **não** (nenhum import) | migra como está; o modelo não é "path SVG" — é `Primitiva` (`d` · círculo · retângulo, mais `fill`, `alfa`, `traco`, `tracejado`, `tinta`) em quatro estados (`normal`/`ativo`/`inerte`/`em20`) (div. 484) |
| renderizador `Icone` | `icones/Icone.tsx:18` | **sim** (`react-native-svg`) | fica; o web escreve o seu |

Quem importa hoje (`[medido]`): `theme` ← 14 arquivos de `apps/native/src`, e 4 testes em
`apps/native/test` (`picker.test.tsx:45`, `s5-faixa.test.tsx:27`, `s5-fileira-faixa.test.tsx:26`,
`reordenar-folha-faixa.test.tsx`) com `from '../src/theme'`; `icones` ← 12. O `gate:icones` lê o
mapa **como texto** pelo caminho do argumento (`icones.mjs:105`, `MAPA = process.argv[2] ?? 'src/icones/dados.ts'`),
e o `apps/native/test/gates.test.ts:112,151,185` o chama com `'src/icones/dados.ts'` — mover o mapa
muda esses caminhos (testes do nativo mudam na PR-4: G1b).

**O molde `packages/core`** `[medido]`: `package.json` = `{"name": "@octavia/core", "private": true,
"type": "module", "main": "src/index.ts", "types": "src/index.ts"}` (sem build, TS consumido
direto); `tsconfig.json` com `lib: ["ES2022"]`, `types: []` (sem DOM), `strict`,
`noUncheckedIndexedAccess`, `moduleResolution: Bundler`, `noEmit`; testes `*.test.ts` no projeto
`core` do Vitest (`vitest.config.mts`, ambiente `node`, sem setup) e um
`isolation.test.ts` que prova o isolamento; o CI roda `tsc -p packages/core/tsconfig.json --noEmit`
(`ci.yml`). O nativo o consome por `"@octavia/core": "workspace:*"` (`apps/native/package.json:11`);
o web **não** o importa (0 linhas). O `pnpm-workspace.yaml` já inclui `packages/*`.

O que `packages/identidade` precisaria, pelo molde (nada criado): `name` (`@octavia/identidade`),
`main`/`types` em `src/index.ts`, `tsconfig` sem DOM e sem RN, um projeto no `vitest.config.mts`
(ou entrar no `core`), um passo de `tsc` no `ci.yml`, a dependência `workspace:*` no
`apps/native/package.json` **e** no `package.json` da raiz (o web), e o gerador do CSS com o gate
"gerado == fonte". Dois gates de hoje não o veem: o **G1a** deriva o universo de
`apps/native` + `packages/core/src` (`g1.sh`, `listar()`), e o `native.yml` só dispara por
`apps/native/**` (div. 494).

---

## 8. A8 — Playwright: o inventário que decide a H-I1-1

Tudo `[medido]` — anexos [`playwright-config.txt`](I1-PRECHECK-anexos/playwright-config.txt),
[`playwright-inventario.txt`](I1-PRECHECK-anexos/playwright-inventario.txt),
[`ci-tempos.txt`](I1-PRECHECK-anexos/ci-tempos.txt).

**Configs**: `find . -name 'playwright*.config.*' -not -path '*/node_modules/*'` →
**um só**, `./playwright.ux-audit.config.ts` (o antigo `playwright.config.ts` saiu na B1.0.1).
`@playwright/test` → `Version 1.55.0`.

| campo | valor |
|---|---|
| `testDir` | `./tests/ux-audit` |
| `workers` / `fullyParallel` / `retries` | `1` / `false` / `0` |
| `timeout` | 15 min por teste |
| `webServer` | **nenhum** |
| `baseURL` | `process.env.UX_AUDIT_BASE_URL \|\| 'https://octavia.rocks'` — **prod por padrão**; o preview entra pela env; o bypass da Vercel viaja no cookie `_vercel_jwt` do `storageState` |
| `serviceWorkers` | `'block'` (padrão); `'allow'` em `fase-d`, `set14-gate`, `perf02-gate` |
| `browserName` / `devices` | **nenhum projeto declara** → Chromium, o padrão |

| projeto | `testMatch` | viewport | dependência |
|---|---|---|---|
| `setup` | `auth.setup.ts` | — | — |
| `smoke` | `auth.smoke.spec.ts` | 1440 × 900 | `setup` |
| `fase-d` | `fase-d/*.spec.ts` | 1194 × 834 | — (storageState semeado à mão) |
| `set14-gate` | `set14-gate.spec.ts` | 1194 × 834 | — |
| `perf02-gate` | `perf02-gate.spec.ts` | 1194 × 834 | — |
| `harvest-mobile` · `harvest-tablet-portrait` · `harvest-desktop` · `harvest-tablet-landscape` | `harvest(-populated)?.spec.ts` | 390 × 844 · 834 × 1194 · 1440 × 900 · 1194 × 834 | `setup` |

**Testes**: 22 arquivos `.spec`/`.setup`, **61** chamadas `test(`/`setup(` (por arquivo no anexo).
`grep -rnE 'browserName|test\.skip|test\.only|isMobile|devices\[|test\.describe\.configure|test\.fixme' tests/ux-audit`
→ 1 `test.fixme` (`cont01-02-monoespacado.spec.ts:153`, *"tab não renderiza no palco"*) e 5
`isMobile: true` em `newContext` locais (`e-setlists.spec.ts:407,542`, `i-add.spec.ts:183`,
`i-verify.spec.ts:40`, `f-library.spec.ts:248`); **zero** `browserName`, `test.skip`,
`test.only`, `devices[`.

`--list` não lista: `pnpm exec playwright test --config=playwright.ux-audit.config.ts --list` →
`Total: 0 tests in 0 files`, com 9 `ENOENT … tests/ux-audit/.auth/discovery.json` e 1 *"discovery.json
não existe — rode antes: pnpm tsx scripts/ux-audit/discover.ts"* — os specs leem na carga do módulo
um arquivo gerado **contra prod** (div. 487). As contagens acima são estáticas.

**Specs que tocam o palco** (`grep -c '/performance'`, cruzado com a A2): `harvest-populated.spec.ts` 4 ·
`harvest.spec.ts` 1 · `perf02-gate.spec.ts` 2 · `fase-d/a-j1.spec.ts` 1 · `b-pdf.spec.ts` 3 ·
`c-offline.spec.ts` 3 · `cont01-02-monoespacado.spec.ts` 3 · `f-library.spec.ts` 2 ·
`g-viewer.spec.ts` 2 · `h-perf.spec.ts` 6 (+ `fase-d/recorder.ts` 4, auxiliar). O `perf02-gate`
inteiro é do palco (CSP do iframe de PDF); `h-perf`, `a-j1`, `b-pdf` e `cont01-02` medem o palco;
`harvest*`, `c-offline`, `f-library` e `g-viewer` passam por ele no meio de outros fluxos.

**CI**: `grep -nE 'playwright|e2e' .github/workflows/*.yml` → **nenhuma linha**. O Playwright saiu
do CI em `e6dec0c 2026-08-16 chore(ci): B1.0.1 — remoção da suíte E2E do CI (vermelha desde
julho/2025) (#228)` (`git log -S"playwright" -- .github/workflows`). Os três workflows: `ci.yml`
(job `build`: lint, tsc de testes informativo, tsc do core, `pnpm test:unit`, `pnpm test:ci`,
Codecov, `pnpm build`), `gates.yml` (`gates-nativos`), `native.yml` (APK). O `pnpm install` do
`build` não baixa navegador (o `@playwright/test` só baixa com `playwright install`).

Não havendo job de Playwright, a série pedida não existe (div. 488). A do job `build` do `ci.yml`,
**só como referência de custo**, nas últimas 10 corridas de `pull_request`:

```
36242817299  n3/encerramento        build  success  12:43:25Z → 12:47:33Z  4m08s
36241992017  n3/encerramento        build  success  12:27:52Z → 12:31:54Z  4m02s
36240343725  n3/pr6c-s5             build  success  11:55:56Z → 11:59:26Z  3m30s
36210875584  n3/pr6b-sete           build  success  02:11:07Z → 02:14:47Z  3m40s
36200310986  n3/pr6-aceite          build  success  23:15:50Z → 23:19:04Z  3m14s
36199314491  n3/pr6-aceite          build  success  23:01:25Z → 23:05:30Z  4m05s
36180580590  n3/pr5-palco-provas    build  success  19:35:11Z → 19:39:15Z  4m04s
36179065685  n3/pr5-palco-provas    build  success  19:20:26Z → 19:24:10Z  3m44s
36169017570  n3/pr4-reordenar-folha build  success  17:44:36Z → 17:47:57Z  3m21s
36165365271  n3/pr4-reordenar-folha build  success  17:37:42Z → 17:41:36Z  3m54s
n=10 min=194s mediana=229s max=248s
```

**O que o Vitest cobre por superfície** (`pnpm test` = `vitest run`, projetos `web`, `core`,
`native`, `native-tela`): 83 arquivos de teste do web no grafo; por superfície dos imports diretos
(um teste conta em toda superfície que o arquivo importado alcança, então as linhas se sobrepõem):
setlists 34 · content-editor 32 · content-lista 31 · upload 31 · outra 26 · api 22 · auth 20 ·
palco 10 · shell 10; 25 sem superfície direta. O Vitest é jsdom: árvore e lógica, **não
geometria**. O que só o Playwright cobre: **geometria real** (larguras, `boundingBox`, quebra de
linha), o service worker, cookie de sessão/CSP/cabeçalhos de verdade — é o terreno do G-faixa.

**O que a H-I1-1 removeria**:

| projeto | testes que só rodam nele | tempo que sai |
|---|---|---|
| (projeto WebKit) | não existe | 0 — não há job |
| (projeto Firefox) | não existe | 0 — não há job |
| `devices` emulados | não existem (os 5 `isMobile: true` são contextos locais de spec, em Chromium) | 0 |

A "poda" não tem o que podar; o que a hipótese acrescenta é **as três larguras 1138/711/411 como
viewports** — hoje são 390/834/1440/1194 (`UX_AUDIT_VIEWPORTS`).

---

## 9. A9 — O backend do web: a lista do G-back

Anexo [`g-back-lista.txt`](I1-PRECHECK-anexos/g-back-lista.txt) `[medido]`, pelo mesmo grafo da A2
com raízes = as 14 `app/api/**/route.ts` + `middleware.ts`:

- **(a)** alcance do backend: **35** arquivos — as 14 rotas, `middleware.ts` e 20 de `lib/`/`types/`.
  Destes, **24** só o backend alcança e **11** também são alcançados por páginas (server components
  ou cliente): `lib/api-errors.ts`, `lib/content-types.ts`, `lib/csp-nonce.ts`,
  `lib/firebase-admin.ts`, `lib/firebase-server-utils.ts`, `lib/logger.ts`,
  `lib/supabase-service.ts`, `lib/supabase.ts`, `lib/user-rate-limit.ts`, `types/content.ts`,
  `types/database.types.ts`.
- **(b)** `git ls-files supabase` → `supabase/migrations/20260901102108_b6_setlist_songs_rpc.sql`,
  `supabase/schema.dump.sql`, `supabase/storage.dump.sql`.
- **(c)** auth/dados do lado do servidor das páginas: `lib/require-page-user.ts` (← 8 `page.tsx`) e
  `lib/content-service-server.ts` (← 4 `page.tsx`).
- **(d)** `next.config.mjs` (`headers()`, gate `tests/config/next-headers.test.ts`).
- **(e)** os quatro símbolos do palco dentro do núcleo (§2.2).

**Fora** do núcleo, e é onde os defeitos de tela moram: `lib/setlist-service.ts` e
`lib/content-service.ts` são **cliente** (fetch às rotas) e não estão no alcance das rotas.

**O `g1.sh` serve ao web?** `[lido]` O **mecanismo** serve — universo derivado por `git ls-tree`/
`git ls-files` na união BASE∪HEAD, arquivo novo no escopo reprova, exceção declarada no bloco
```gates``` do corpo, exceção não usada reprova (`g1.sh:80-207`). O **escopo** não: ele é por pasta
(`listar()` → `apps/native packages/core/src`), e o backend do web não é uma pasta — `lib/` mistura
servidor e cliente (acima). E a declaração passa pelo `apps/native/scripts/gates-decl.sh`, que só
conhece `g1a`, `g1b-*`, `g3-*` (chave desconhecida → erro) e roda no `gates.yml`, que está no filtro
`paths` do `native.yml` (div. 494, 495).

---

## 10. A10 — O loop mudo do `POST /api/auth/session`

**O registro** `[lido]`: item **D8**, *"Item de abertura do Bloco D — prioridade máxima
(registrado no B3, 2026-08-28)"* — `docs/ux/B3-DESENHO.md:445-452` (§5.2) e
`docs/ux/PLANO-TRANSICAO.md:869-876`; evidência em `docs/ux/B3-PRECHECK.md:301` e saída do bloco em
`docs/ux/B3-ENCERRAMENTO.md:143`. Texto: *"falha no set do cookie é engolida
(`firebase-session-cookies.ts:22` → catch de `firebase-auth-context.tsx:189`, no-op em prod), o
fetch de perfil é pulado e o middleware devolve o usuário a `/login` na navegação seguinte — 'login
OK → volta pro login' sem nenhuma mensagem"*. As duas linhas citadas batem hoje (`:22` é o
`throw`, `:189` é o `catch (stateError)`).

**Chamadores** (`git grep -n 'auth/session'` fora de `docs`): o único chamador de produção é
`lib/firebase-session-cookies.ts:13` (`setSessionCookie`) e `:34` (`clearSessionCookie`); quem os
chama é só `contexts/firebase-auth-context.tsx`: `:137` (a cada `onAuthStateChanged` com usuário),
`:206` (`visibilitychange`, a cada volta à aba), `:222` (intervalo de 50 min), `:187` e `:378`
(DELETE). O resto são testes, o `scripts/ux-audit/*` e o `tests/ux-audit/*`.

**O handler escreve em banco ou storage? Não.** `app/api/auth/session/route.ts`:
- `:20-21` valida o corpo por Zod (`authSchemas.sessionCreate`, `lib/api-schemas.ts:289-292`);
- `:26` `validateFirebaseTokenSecure` (`lib/secure-auth-utils.ts:143-236`): lista negra em memória,
  cache de token em memória (`tokenCache.set`, `:226`), `addTokenToUserSession` em memória (`:194`),
  e `verifyFirebaseToken` do Admin SDK (verificação de assinatura; lê chaves públicas do Google);
- `:30-38`, `:48-56` rate limit em memória (`lib/user-rate-limit.ts:76`, `const store = new Map`);
- `:59-73` escreve **só o cookie**: `Set-Cookie: firebase-session=<idToken>; HttpOnly; Max-Age=604800;
  Path=/; SameSite=Lax[; Secure]` — o valor é o próprio ID token (1 h) com vida de 7 dias (`:17`).

Nenhuma chamada a Supabase, storage ou banco no caminho (`grep -nE "supabase|insert|upsert"` nos
três módulos → 0). O que escreve é a **memória da lambda** e o **cookie**.

**Mas a volta do loop escreve** `[lido]`: `components/auth/login-panel.tsx:53-67` faz
`POST /api/profile` (criação de perfil no banco) quando o `GET /api/profile` devolve `null` — a
garantia de zero escrita da Fase B tem de cobrir o `/api/profile`, não só o handler (div. 500).

**H-I1-2 — a hipótese do loop, pela leitura** (sem rodar nada):

1. **Quem dispara**: o `onAuthStateChanged` (`firebase-auth-context.tsx:123`) chama `setUser` (`:130`)
   **antes** de `setSessionCookie` (`:137`). O `login-panel.tsx:24-128` reage a `user` e,
   independente do cookie, pede token novo (`:30`), faz `GET /api/profile` (`:44`) e navega com
   `window.location.href = '/dashboard'` (`:74`, `:110`).
2. **Em que condição**: se o `POST /api/auth/session` falha (401, 429 da janela de 120/15 min por uid,
   500, rede) o `throw` de `:22` cai no `catch` de `:189`, que só loga — e o login-panel navega
   mesmo assim. Há também uma **corrida** sem falha nenhuma: o `setSessionCookie` e o
   `handleRedirect` correm em paralelo, e a navegação pode sair antes do `Set-Cookie`.
3. **O que acontece**: em `/dashboard`, o middleware só confere a **forma** do cookie
   (`middleware.ts:45-49`); a página chama `requirePageUser` (`app/dashboard/page.tsx`,
   `lib/require-page-user.ts:30-34`), que sem usuário válido faz `redirect("/login")`.
4. **O que impede de parar**: `/login` sem cookie válido renderiza o painel
   (`app/login/page.tsx:10` só redireciona usuário **válido**); o Firebase do cliente ainda tem o
   usuário persistido → `onAuthStateChanged` de novo → mesmo caminho. O `hasRedirected`
   (`login-panel.tsx:20,25-26`) é estado de React e **zera** a cada navegação cheia. Nada conta as
   voltas, e nenhuma mensagem aparece (o `catch` de `:189` e o `logger.warn` de
   `firebase-session-cookies.ts:27` não chegam à tela). Uma falha persistente (a própria janela de
   429) vira volta sem fim.

Registro de mecanismo: o D8 atribui o redirect ao **middleware**; desde a B1.2b ele é da
**página** (div. 490).

---

## 11. A11 — Login com Google

**O fluxo** `[lido]`: botão *"Continue with Google"* (`components/auth/login-panel.tsx:296-306`) →
`handleGoogleSignIn` (`:150-164`) → `signInWithGoogle` (`contexts/firebase-auth-context.tsx:278-298`)
→ `new GoogleAuthProvider()` + **`signInWithPopup(auth, provider)`** (`:287-288`). Não há
`signInWithRedirect` nem `getRedirectResult` no código (`grep -rn` → 0); o callback é o handler do
próprio Firebase no `authDomain` (`/__/auth/handler`), fora do app. Depois do popup, o caminho é o
mesmo do email/senha (`onAuthStateChanged` → §10). Só o login tem Google; o signup não
(`grep` → só `login-panel.tsx`).

**Variáveis de ambiente** (só nomes; nenhum `.env*` aberto): cliente, `lib/firebase.ts:7-12` —
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`; servidor,
`lib/firebase-admin.ts:54-56` — `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY`. Nenhuma variável própria do Google/OAuth: o client OAuth é configurado no
console do Firebase/Google, não no código.

**O que os documentos dizem**: `docs/api/AUTH.md` e `docs/ux/HOTFIX-150.md` **não falam de
Google** (`grep -niE "google|oauth|popup|signInWith"` → só `signInWithPassword` do REST, em
`HOTFIX-150.md:265,298,306`) (div. 489). O registro está em `docs/ux/PLANO-TRANSICAO.md:878-884`
(*"o login Google no web não funciona, e o cliente OAuth 'Web client (auto created by Google
Service)' … sinalizado para exclusão automática por inatividade (último uso 2026-02-26)"*),
`docs/native/N1-ENCERRAMENTO.md:352` e `docs/native/N0-PRECHECK.md:74` (H18: *"login Google do web →
Bloco D"*). E o `PLANO-TRANSICAO.md:955-961` põe o **item 14 — "popup do Google no PWA instalado"**
entre os *"achados que não recebem fix nunca"*, porque o web ia morrer (div. 501).

**H-I1-3 — o ponto de falha, pela leitura**: a CSP e o COOP de produção
(`lib/security-headers.ts`, aplicados pelo `middleware.ts` a toda página):

| diretiva (hoje) | linha | o que o `signInWithPopup` precisa `[hipótese]` |
|---|---|---|
| `'frame-src': ['blob:']` | `:79-85` | o iframe oculto de auth do Firebase em `https://<authDomain>` (`*.firebaseapp.com`) |
| `'Cross-Origin-Opener-Policy': 'same-origin'` | `:122` (`openerPolicy`) e `:128` (`additionalHeaders`), aplicado em `:239` e de novo em `:241-243` | a janela do popup falar com a que a abriu (`same-origin-allow-popups` é o que a documentação do Firebase indica) |
| `'script-src'`: `'self'`, nonce, `https://*.googleapis.com`, `https://*.gstatic.com`, `https://www.google.com`, `cdn.jsdelivr.net`, `vercel.live` | `:39-47` | `https://apis.google.com` (o `gapi` do fluxo de popup) — `*.googleapis.com` não o cobre |

**A data** `[medido]`: `git log -S"'frame-src'" -- lib/security-headers.ts` →
`8af7f34 2026-02-26 security: replace CSP config with enhanced version`; `git log -S"Cross-Origin-Opener-Policy"`
→ o mesmo `8af7f34` (e `b7d8b10 2025-09-11`). O `8af7f34` trocou a CSP inteira e pôs
`'frame-src': ["'none'"]` (depois afrouxado a `blob:` pelo PERF-02). **2026-02-26 é o dia do último
uso do client OAuth** (I1-D6). Antes dele o `default-src 'self'` já barraria o iframe e o COOP já
era `same-origin` — a coincidência de data não prova a causa; é o que o probe 2 da Fase B mede.

Nada foi feito no console do Google. O que só o console responde (domínios autorizados do Firebase
Auth, estado do client OAuth) é do Marcel.

---

## 12. A12 — Os itens 5 e 6 de `N2-ENCERRAMENTO.md` §10.3

Conferidos (§0.1): item 5 = div. 156 (`docs/native/N2-PRECHECK.md:702`), item 6 = div. 172
(`docs/ux/HOTFIX-150.md:134,467`; `docs/api/SETLISTS.md:243`). Os três defeitos no código de hoje:

| defeito | arquivo:linha | tela × rota | leitura |
|---|---|---|---|
| **remove por `content.id`** | `components/setlist-manager.tsx:207` (`find(s => s.content.id === songId)`) e `:214` (`filter(s => s.content.id !== songId)`) | **tela** | com bis, o `find` escolhe a primeira ocorrência para o `DELETE` e o `filter` tira **todas** da tela — tela e banco divergem. A rota (`DELETE /api/setlists/songs/[songId]`) já recebe o id da linha; o conserto é trocar o critério na tela |
| **id local falso** | `components/setlist-manager.tsx:179` (`id: \`${selectedSetlist.id}-${songId}\``) e a posição local `:166-168`, `:180` | **tela** | a rota **já devolve a linha verdadeira**: `app/api/setlists/[id]/songs/route.ts:75-80` (`returns setof setlist_songs`, `201` com a linha inserida) e `lib/setlist-service.ts:284` a retorna (`return song`) — a tela a descarta em `:176`. O conserto usa o `id` e o `position` devolvidos |
| **erro ao apagar setlist já apagada** | `components/setlist-manager.tsx:140` → `lib/setlist-service.ts:232-233` (`if (!response.ok) throw`) → `catch` `:150-157` | **tela** (o 404 é contrato decidido: N2-D12, `HOTFIX-150.md` §1.1) | o `lib/setlist-service.ts` é **cliente** (fora do núcleo do G-back, §9). **E o efeito não é o que o `HOTFIX-150.md:134` descreve**: o toast *"Failed to delete setlist"* é do `@/hooks/use-toast`, que não está montado (H-I1-5) — pela leitura, o que o usuário vê é **o diálogo que não fecha** (`setDeleteDialogSetlist(null)` em `:148` fica depois do `throw`) e nenhum texto (div. 491) |

**Os três são código de tela, não de rota** — a condição da I1-D9 se cumpre pela leitura. Nenhum
precisa de mudança em `app/api/**` nem em `supabase/**`.

---

## 13. A13 — Hipóteses e perguntas

As hipóteses estão na §0.2 (H-I1-1…6), com o que fecha cada uma.

### 13.1 Perguntas ao revisor

Numeradas, sem recomendação (a recomendação é do revisor; a decisão é do Marcel).

1. **Palco dentro do backend (div. 493)**: a PR-3 remove `getSetlistByIdServer`
   (`lib/content-service-server.ts:91`), o `"/performance"` de `PROTECTED_PAGES`
   (`lib/protected-routes.ts:44`, e com ele o G-rotas) e o ramo `/performance` de
   `lib/security-headers.ts:255` — ou deixa os três, como código morto, para não tocar backend fora
   da auth?
2. **`frame-src` depois do corte**: sem o iframe do palco, o `'blob:'` (`security-headers.ts:79-85`)
   não tem consumidor. Volta a `'none'` na PR-3, fica até a PR-2 (Google, que mexe na mesma
   diretiva), ou fica?
3. **Redirect da URL antiga (div. 497)**: `?contentId=` → `/content/[id]/edit`. E `?setlistId=`
   (sem URL de edição própria) → `/setlists` sem seleção, ou 404? E `/performance` sem parâmetro?
4. **Os três `tests/performance/*`** que reproduzem um palco próprio sem importar o app (§2.1):
   morrem com o palco ou ficam?
5. **Os quatro testes que tocam o palco em parte** (`auto-scroll-button-bug`, `content-display`,
   `g-rotas-protegidas`, `use-content-loading`): adaptar ou apagar?
6. **Os nove specs de Playwright que entram em `/performance`** (§8): apagar o spec, cortar o
   trecho do palco, ou deixar os de medição histórica (`fase-d`) como rastro sem rodar?
7. **Língua (div. 496)**: a UI do web é inglês e a identidade do nativo é pt-BR. "Frases
   existentes" (I1-D7 item 4, I1-D10) são as inglesas. O I1 muda a língua do web, ou o web
   continua em inglês com a identidade nova?
8. **Chave de declaração do G-back (div. 494)**: estender o `apps/native/scripts/gates-decl.sh` (a
   PR-5 passa a tocar `apps/native` e, pelo `gates.yml`, dispara o APK) ou um extrator/workflow
   próprio do web?
9. **Escopo do G-back (div. 495)**: os 11 arquivos que o backend divide com as páginas
   (`lib/logger.ts`, `types/content.ts`, …) entram no núcleo? E `next.config.mjs`?
10. **Toaster das setlists (div. 491, H-I1-5)**: montar o `Toaster` do shadcn, ou trocar o
    `setlist-manager` para o sonner, é mudança de comportamento sob a I1-D9 ou parte do requisito
    da PR de setlists (junto dos itens 5 e 6)?
11. **Tela cheia do PDF** (`components/pdf-viewer.tsx:111-118`, na visualização e no editor): é
    "visualização em tela cheia com controles de performance" (sai) ou pré-visualização (fica)?
12. **Menções ao palco que ficam em superfícies vivas** (§2.2): as chaves `Auto Scroll`/
    `Performance Mode` de `DisplaySettings.tsx` (que ninguém lê), o texto de `app/offline/page.tsx:159`
    e o de `pwa-install-prompt.tsx:202-203` — saem na PR-3?
13. **H-I1-1**: sem WebKit, Firefox, `devices` nem job no CI, a PR de poda continua existindo? Com
    que conteúdo — só as três larguras como viewports num projeto novo? E o G-faixa roda contra o
    preview pela `UX_AUDIT_BASE_URL`, com o padrão do config continuando prod?
14. **"(max 50MB)"** (`FileUploadZone.tsx:112`, div. 499): corrigir o texto na PR de upload é
    comportamento (I1-D9) ou texto?
15. **`faixaDe` e os limiares 700/960**: vão para `packages/identidade` (e o
    `apps/native/test/faixa.test.ts:50-54` passa a procurar lá), ou o web escreve o seu ponto único?
16. **`font` do pacote (div. 485)**: o pacote guarda família + peso (e o nativo mapeia para o nome
    do `.ttf`), ou as duas formas?
17. **Os títulos que dizem "morre com a web"** (`PLANO-TRANSICAO.md` "## Bloco D — Morre com a
    web", `N1-ENCERRAMENTO.md:348`, div. 492): errata agora, no encerramento do I1, ou nunca (são
    rastro)?
18. **Item 14 do `PLANO-TRANSICAO.md` — popup do Google no PWA instalado** (div. 501): entra no
    escopo da PR-2 (e no aceite dela no Tab S6), ou o conserto do Google vale só para o navegador?

---

## 14. A14 — Fase B

**Commit 2: aprovados os probes 1, 2, 4 e 5 (o 3 não existe, div. 486) — e nenhum rodou.**
O preview da PR (`https://octavia-ez3gkrz5s-marcelvianas-projects.vercel.app`, deployment
`6679479179` do `e799235`) está sob a proteção da Vercel: `curl` em `/login` → `302
https://vercel.com/sso-api?…`; o navegador embutido cai em *"Login – Vercel"*. O mecanismo do
`ux-audit` atravessa com o `VERCEL_AUTOMATION_BYPASS_SECRET` (só de env,
`scripts/ux-audit/auth.ts:29-35`) e faz o login da audit lendo **também o `.env.local`**
(`auth.ts:14-16`, para a `NEXT_PUBLIC_FIREBASE_API_KEY`), que o prompt não autoriza abrir. O
executor não tem o bypass, não abriu o `.env.local`, não fez login na Vercel e não abriu o
`.env.uxaudit` (sem preview alcançável ele não tinha uso). Registro:
[`faseB/bloqueio.txt`](I1-PRECHECK-anexos/faseB/bloqueio.txt); div. 509. Os quatro roteiros ficam
prontos em `faseB/probe{1,2,4,5}-roteiro.txt`, com a lista de escrita declarada antes.

| probe | estado | escrita declarada | escrita medida |
|---|---|---|---|
| 1 — loop mudo | **não executado** (bloqueio) | 0 | 0 |
| 2 — Google | **não executado** (bloqueio) | 0 | 0 |
| 4 — toasts das setlists | **não executado** (bloqueio) | 1 POST + 1 PUT + 1 DELETE da audit | 0 |
| 5 — largura no Tab S6 | **pendente do Marcel** (aparelho não está com o executor; nenhum `adb`) | 0 | 0 |

Estado das hipóteses depois do commit 2: H-I1-1 **fechada** (I1-D16); H-I1-2, H-I1-3 e H-I1-5
**não testadas** (bloqueio); H-I1-4 **pendente do Marcel**; H-I1-6 fica para a primeira PR de tela.

A tabela abaixo é a proposta do commit 1, mantida como estava.

| # | probe | o que mede | contra o quê | garantia de zero escrita | o que bloqueia |
|---|---|---|---|---|---|
| 1 | **loop mudo** (H-I1-2) | quantos `POST /api/auth/session`, `GET/POST /api/profile` e navegações por volta; se para; o que a tela diz | dev server local **ou** preview da Vercel, **conta de audit** (que já tem perfil); falha do POST induzida só no navegador (Playwright `route` devolvendo 500/429 ao `POST /api/auth/session` — o molde é `tests/ux-audit/session-intercept.ts`) | com perfil existente o `POST /api/profile` não dispara (`login-panel.tsx:52`); o handler só escreve cookie (§10); contar `POST /api/profile` = 0 como condição de parar | aval; env do dev server (o `.env.local` é do Marcel) ou bypass do preview; orçamento `session` 120/15 min por uid |
| 2 | **Google** (H-I1-3) | se o clique em *"Continue with Google"* dá violação de CSP (`frame-src`, `script-src`) e/ou erro de COOP no console, **antes** de qualquer tela do Google | preview da Vercel (tem as env), página `/login`, **sem entrar em conta nenhuma** — o probe para no primeiro erro de console ou na abertura da página do Google | não há login, então não há `onAuthStateChanged`, nem sessão, nem perfil | aval; o que depende do console (domínios autorizados, client OAuth) fica com o Marcel |
| 3 | **tempo do Playwright após a poda** | — | — | — | **não há o que medir** (§8): não existe job; se a H-I1-1 virar "três viewports num projeto", o que se mede é o tempo local do G-faixa, na PR-5 |
| 4 | **toasts das setlists** (H-I1-5, div. 491) | se algum toast aparece ao criar/renomear/apagar; se o diálogo de apagar fica aberto no 404 | preview da Vercel, **conta de audit**, setlist descartável criada e apagada na mesma sessão (regra 12) — o 404 pede apagar duas vezes (duas abas) | escrita declarada: 1 criação + 1 remoção de setlist descartável da audit; nada da principal | aval |
| 5 | **largura CSS no Tab S6** (H-I1-4) | `window.innerWidth`/`innerHeight` em pé e deitado no Chrome | Chrome do Tab S6, qualquer página pública (`/login`) | só leitura, sem login | aval; o aparelho (`APARATO.md`) |

---

## 15. Divergências — 480 a 501

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **480** | P | §0: *"`git grep -nE '\*\*4[7-9][0-9]\*\*' docs | sort … | tail -5` — se houver número acima de 479, a numeração começa no seguinte"* | a última linha do comando é `docs/native/N3-PRECHECK-anexos/faseA/A2.md:607 … **484**` — uma **medida em dp** do S0, não uma divergência. A última divergência é a **479** (`N3-ENCERRAMENTO.md:717`); a numeração começa em 480 | o comando pega qualquer número em negrito; conferir pela coluna de divergência |
| **481** | P | §1: *"Sem `.env*` na árvore"* | `git ls-files | grep -E '(^|/)\.env'` → `.env.example` e `apps/native/.env.example` — **dois modelos versionados** vêm com o worktree. Não foram abertos | registrado; nenhum `.env` com valor na árvore |
| **482** | P | A2: *"cache offline (o que a Fila A mexeu — localize com grep `docs/ux`)"* | `git grep -niE "fila a\b|fila-a|filaA" -- docs .audit .planning` → **0 linhas**. O cache offline foi medido pelos importadores (§2.3) | pergunta implícita: qual documento é a "Fila A"? |
| **483** | P | A5: *"os 39 registros do anexo D — localize em `DESIGN-V1/README.md` e `DESIGN-N2/README.md`"* | o **39** é o catálogo da §6.4 (`DESIGN-V1/README.md:607`, `DESIGN-N2/README.md:28`); o anexo D do V1 tem **34** e o do N2 **5**. O mapa `dados.ts` tem **43** nomes (39 do catálogo + 4 fora) | a tabela da §5 cruza contra os 43 nomes |
| **484** | P | I1-D3: *"Ícones como paths SVG exportados"* | `dados.ts` não é lista de paths: é `Primitiva` (`d`, círculo `cx/cy/r`, retângulo `x/y/w/h/rx`, mais `fill`, `alfa`, `traco`, `tracejado`, `tinta`) em quatro estados (`normal`, `ativo`, `inerte`, `em20`); a tinta é token (`lineInfo`/`offlineInk`/`accentInk`), nunca hex. É TS puro (nenhum import) | a PR-4 exporta o modelo inteiro; o componente do web implementa as primitivas e os estados |
| **485** | P | I1-D3: *"Fonte em TS puro (sem React Native)"* | `theme.ts` é puro (único import: `import type { Faixa } from './faixa'`), mas o `font` guarda **nomes de arquivo do `expo-font`** (`'Raleway_600SemiBold'`, `'Manrope_400Regular'`, `'IBMPlexMono_400Regular'`, …), que não são família + peso de CSS | PR-4 (pergunta 16) |
| **486** | P | H-I1-1: *"WebKit/Firefox saem; … o tempo do job no CI medido antes e depois"* | **um só config** (`playwright.ux-audit.config.ts`), **nenhum** `browserName`/`devices` (Chromium padrão), **nenhum** job de Playwright no CI desde `e6dec0c` (B1.0.1, 2026-08-16); viewports de hoje 390/834/1440/1194; `baseURL` padrão = prod | a H-I1-1 se reduz às três larguras (pergunta 13) |
| **487** | T | A8: inventário por `projects`/testes | `playwright test --list` → `Total: 0 tests in 0 files`: os specs leem `tests/ux-audit/.auth/discovery.json` **na carga do módulo**, arquivo gerado contra prod por `scripts/ux-audit/discover.ts` | contagem estática por `grep`; o G-faixa não pode herdar essa dependência de carga |
| **488** | P | A8: *"o tempo do job nas últimas 10 corridas … `gh run list --workflow=<nome>`"* | não há workflow nem job de Playwright; medido o `build` do `ci.yml` como referência (n=10, mín 194 s, mediana 229 s, máx 248 s) | registrado; sem CN de tempo possível |
| **489** | P | A11: *"o que o `HOTFIX-150.md`/`AUTH.md` dizem sobre auth"* (Google) | nenhum dos dois fala de Google/OAuth/popup; o registro está em `PLANO-TRANSICAO.md:878-884`, `N1-ENCERRAMENTO.md:352`, `N0-PRECHECK.md:74` | lidos esses (§11) |
| **490** | D | D8 (`B3-DESENHO.md:445-452`, `PLANO-TRANSICAO.md:869-876`): *"o middleware devolve o usuário a `/login` na navegação seguinte"* | desde a B1.2b o middleware é **otimista** (só forma do cookie, `middleware.ts:10-18,44-50`); quem devolve a `/login` é `requirePageUser` na página (`lib/require-page-user.ts:32-33`). O efeito é o mesmo, a camada não | a PR-1 conserta pela camada de hoje |
| **491** | D | `HOTFIX-150.md:134` (div. 172): *"o usuário vê o toast 'Failed to delete setlist'"* | o toast é de `@/hooks/use-toast` (`setlist-manager.tsx:7`), cujo `<Toaster>` (`components/ui/toaster.tsx`) **não é montado** — o único é o do sonner (`app/layout.tsx:127`). Pela leitura, nenhum toast das setlists aparece; na falha de apagar, o diálogo não fecha | Fase B probe 4; requisito da PR de setlists (pergunta 10) |
| **492** | D | `PLANO-TRANSICAO.md` "## Bloco D — Morre com a web"; `N1-ENCERRAMENTO.md:348` *"morre com a web"* | a I1-D2 desfaz a premissa: o web fica, com cadastro/edição e auth | pergunta 17 |
| **493** | P | I1-D5 × I1-D9: *"morre tudo o que só o palco usa"* e *"nenhuma rota, contrato … muda"* | há símbolos só do palco **dentro de arquivos do backend**: `getSetlistByIdServer` (`lib/content-service-server.ts:91`), `"/performance"` em `PROTECTED_PAGES` (`lib/protected-routes.ts:44`), `frame-src 'blob:'` (`lib/security-headers.ts:79-85`) e o `no-store` de `/performance` (`:255`). O grafo por arquivo não os vê | perguntas 1 e 2; a PR-3 é anterior ao G-back (PR-5), então o que ela tocar se declara no corpo |
| **494** | P | I1-D4: *"PR-4 é a única PR do bloco que toca `apps/native`"*; I1-D13: G-back com exceções no bloco ```gates``` | o extrator do bloco é `apps/native/scripts/gates-decl.sh` (chaves `g1a`, `g1b-*`, `g3-*`; chave nova → erro) e roda no `gates.yml`, que está no `paths` do `native.yml` (dispara o APK). O G1a só vê `apps/native` + `packages/core/src` — `packages/identidade` fica fora sem mudar o `g1.sh` | pergunta 8 |
| **495** | P | A9: *"o `g1.sh` deriva o `NUCLEO` por `git ls-tree` — registre se o mecanismo serve ao web"* | o mecanismo serve; o escopo por pasta não: `lib/` mistura servidor e cliente — 11 dos 35 arquivos do alcance do backend também são alcançados por páginas; `lib/setlist-service.ts` e `lib/content-service.ts` são cliente | lista derivada do grafo ou explícita (pergunta 9) |
| **496** | P | I1-D7 item 4 / I1-D10: *"só frases existentes"* | a UI do web é **inglês** (591 distintas; 12 em português, todas da política de privacidade); interseção com `frases.ts` = 0 | pergunta 7 |
| **497** | P | I1-D5: *"redireciona para a edição correspondente quando houver"* | content tem (`/content/[id]/edit`); **setlist não tem URL de edição** (estado da página `/setlists`); `/performance` sem parâmetro é o que o dashboard abre (`dashboard-page-client.tsx:34`) | pergunta 3 |
| **498** | A | — | `setlists-page-client.tsx:37-39` (`handleSelectSetlist`) empurra `/setlist/${id}` — **rota inexistente** (`ls app/setlist` → *No such file or directory*) — e o handler não é passado a ninguém (código morto) | PR de setlists (leitura; decisão do Marcel) |
| **499** | A | — | `components/add-content/FileUploadZone.tsx:112` anuncia *"(max 50MB)"*; o teto do servidor é **4 MiB** (`lib/api-schemas.ts:259`, B5) | pergunta 14 |
| **500** | P | A10/A14: *"a contagem de requests do loop … só depois de A10 dizer se o handler escreve"* — o handler como única escrita possível | o handler não escreve em banco/storage (§10), mas a **volta do loop** pode escrever: `login-panel.tsx:53-67` faz `POST /api/profile` quando o perfil não existe | a garantia de zero escrita do probe 1 inclui `/api/profile` (§14) |
| **501** | D | `PLANO-TRANSICAO.md:955-961`: *"Achados que não recebem fix nunca"* — entre eles o **item 14, "popup do Google no PWA instalado"**, porque *"login nativo usa o SDK do Firebase, sem popup de browser"* | a premissa (o web morre) caiu com a I1-D2, e a I1-D6 manda consertar o Google do web — o popup no PWA instalado volta a ser caso do web | pergunta 18 → **I1-D18** (não há PWA) |

**Commit 2 — divergências 502 a 509**

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **502** | P | prompt do commit 2: *"`git grep -nE '\*\*50[0-9]\*\*' docs` antes, para conferir"* | o comando acha, além das divs. 500 e 501 (`I1-PRECHECK.md:817-818`), **18 linhas** que não são divergência — status HTTP 500 em negrito (`B3-PRECHECK.md:144`, `B6-DESENHO.md:497-501`, …) e uma medida (`DESIGN-N3/README.md:254`, "**500**" dp) — a mesma classe da div. 480. A última divergência é a 501; a numeração segue em 502 | conferir pela coluna de divergência |
| **503** | P | I1-D30: *"`faixa.test.ts:50-54` passa a procurar lá (par declarado no G1b)"* | o G1b só lê `packages/core/src/*.test.ts` (`apps/native/scripts/g1.sh:251`, `TESTES=$(git ls-tree … -- packages/core/src \| grep '\.test\.ts$')`); `apps/native/test/` é excluído também do G1a (`g1.sh`, `filtrar()`). Um par declarado para `faixa.test.ts` seria **"PAR DECLARADO E NÃO USADO ✗"** (`g1.sh:325`) e **reprovaria** | PR-4: a edição do `faixa.test.ts` não tem gate que a leia; declarar em texto, não no bloco |
| **504** | P | I1-D25: *"`g-rotas-protegidas` adapta com par declarado"* | nenhum gate lê teste do web: o G1b é só do core (div. 503), e o extrator do `gates-web` (I1-D20) nasce na **PR-5, depois** da PR-3 | a PR-3 declara o par em texto no corpo; a PR-5 decide se o `gates-web` passa a ler pares |
| **505** | P | I1-D23: os símbolos do palco no backend são `getSetlistByIdServer`, `"/performance"` em `PROTECTED_PAGES` e o `no-store` de `:255` | com a I1-D19, o G-rotas (`tests/gates/g-rotas-protegidas.test.ts:71-81`) exige que **todo prefixo** de `PROTECTED_ROUTE_PREFIXES` tenha página: `"/settings"` e `"/profile"` (`lib/protected-routes.ts:17-18` e `:40-41`) também têm de sair, e o `PAGE_INVOCATIONS` (`g-rotas…:45-64`) perde **três** entradas, não uma | PR-3, declarado junto da I1-D23 |
| **506** | P | I1-D18: o cache offline e o `/api/proxy` morrem (offline) | o cache também serve o **visualizador vivo**: `hooks/useContentFile.ts:29` (`getCachedFileInfo`) dá a URL `blob:` e o tipo MIME a `content-viewer/SheetMusicDisplay.tsx:35-41,69-76`; sem ele o visualizador cai em `content.file_url` direto e `mimeType` vira `undefined`. O bucket tem leitura pública (`supabase/storage.dump.sql:1244,1248`) e a CSP tem `*.supabase.co` em `img-src`/`connect-src`, então o direto **deve** abrir `[hipótese]` | aceite da PR-3: PDF e imagem na visualização e no editor, no Tab S6 |
| **507** | A | I1-D19: `/profile` sai; `/api/profile` fica | o shell vivo liga a página que sai: `components/user-header.tsx:68` (`<Link href="/profile">`); e o `PATCH /api/profile` perde o **único** chamador (`ProfileForm.tsx:46` → `firebase-auth-context.tsx:405-420`) — a rota fica sem cliente | PR-3 edita o `user-header`; a rota órfã fica registrada (I1-D19) |
| **508** | A | — | a landing tem **7** links `href="#"` sem destino (`grep -c 'href="#"' app/page.tsx` → 7; `:287-335`) | insumo do brief (superfície pública, I1-D19) |
| **509** | P | Fase B: *"a URL do preview e o bypass são os que o `ux-audit` já usa … `.env.uxaudit` é o único `.env*` autorizado"* | o preview exige o bypass da Vercel (`302 → vercel.com/sso-api`), que não está em arquivo; e o login do `ux-audit` lê também o `.env.local` (`scripts/ux-audit/auth.ts:14-16`). Com o que foi autorizado, nenhum probe do preview roda | probes 1, 2 e 4 esperam o bypass (inline) e uma decisão sobre a API key (§14) |

---

## 16. Contabilidade desta PR

| item | valor |
|---|---|
| requests a `https://octavia.rocks` | **0** |
| requests a `/api/*` (prod ou preview) | **0** |
| `adb` | **0** |
| login em conta | **0** |
| `.env*` abertos | **0** |
| código | **nenhum** (os dois scripts de levantamento rodaram do scratchpad; o texto deles está nos anexos `script-a2.txt` e `script-a456.txt` como rastro) |
| chamadas à API do GitHub | leitura: 1 `gh run list` + 20 `gh run view` (§8); a abertura da PR |
| comandos locais que executam código do repositório | `pnpm install --offline`; `depcruise` (3×); `playwright --version`; `playwright test --list` (3×, coleta — falhou na carga, §8; imprimiu *"guard do histórico ativo: escrevendo em /var/folders/…"*, temporário fora do repositório) |
| agente de leitura | 1 (a matriz da A3, só leitura, mesma árvore; citações conferidas mecanicamente, §3) |
| arquivos tocados | `docs/ux/I1-PRECHECK.md` e `docs/ux/I1-PRECHECK-anexos/*` (README + 15 anexos). Nada em `apps/native`, `packages/`, `app/`, `lib/` |
| workflows | esperado pelos filtros: `CI` (`build`) e `gates` (`gates-nativos`) disparam; `native` **não** (o `paths` dele é `apps/native/**`, `native.yml`, `gates.yml`, `pnpm-workspace.yaml`). O que de fato disparou fica no corpo da PR (a PR é de um commit só) |

**Commit 2** (mesma sessão da árvore, 2026-09-26):

| item | valor |
|---|---|
| requests ao preview da Vercel | **1** `curl` `GET /login` (→ `302` para o SSO da Vercel) + 1 navegação do navegador embutido à mesma URL (→ página de login da Vercel; parado aí). **0** a `/api/*` |
| requests a `https://octavia.rocks` | **0** |
| escritas | **0** (os probes 1, 2 e 4 não rodaram — §14) |
| `.env*` abertos | **0** (o `.env.uxaudit` autorizado não foi aberto: sem preview alcançável, não havia uso) |
| `adb` | **0** (probe 5 pendente do Marcel) |
| chamadas à API do GitHub | leitura: `gh pr checks 335`, 2 `gh api …/deployments` |
| comandos locais | `depcruise` (1×, agora com `worker/`); `node script-a24` (do scratchpad) |
| código | **nenhum**. Arquivos tocados: `docs/ux/I1-PRECHECK.md`, anexos novos (`pwa-offline-exclusivos.txt`, `pwa-offline-compartilhados.txt`, `script-a24.txt`, `settings-profile.txt`, `faseB/*`), e as duas erratas da I1-D32 (`docs/ux/PLANO-TRANSICAO.md`, `docs/native/N1-ENCERRAMENTO.md`) |

---

## 17. Commit 2 — medições complementares (2.1–2.5 do prompt)

### 17.1 G-rotas: a contagem é derivada, o inventário é literal

`tests/gates/g-rotas-protegidas.test.ts` (100 linhas) **não tem contagem literal** de asserções
(`grep -nE "toHaveLength|\.length|toBe\([0-9]+\)"` → 0). O que é literal é o **inventário**
`PAGE_INVOCATIONS` (`:45-64`, 8 entradas: `/dashboard`, `/library`, `/setlists`, `/settings`,
`/profile`, `/add-content`, `/content/[id]`, `/performance`); a paridade com `PROTECTED_PAGES` é
afirmada em `:71-74` (`Object.keys(PAGE_INVOCATIONS).sort()` `toEqual` `[...PROTECTED_PAGES].sort()`),
e todo prefixo de `PROTECTED_ROUTE_PREFIXES` precisa de página (`:75-80`). Os `it` são gerados
por `for … of Object.entries(PAGE_INVOCATIONS)` (`:83-98`, dois por rota): hoje **1 + 2 × 8 = 17**.

Com a PR-3 (I1-D5 + I1-D19) saem `/performance`, `/settings` e `/profile`: **1 + 2 × 5 = 11**, e
`lib/protected-routes.ts` perde `"/performance"` (`:44`) **e** `"/settings"`/`"/profile"` nas duas
listas (`:17-18`, `:40-41`) — senão o `:75-80` reprova (div. 505). O par que a I1-D25 pede é de
**linhas do inventário** (as seis linhas das três entradas saem, nenhuma entra); não há gate que o
leia antes da PR-5 (div. 504).

### 17.2 `/settings`: o que grava, quem lê

Anexo [`settings-profile.txt`](I1-PRECHECK-anexos/settings-profile.txt). A página
(`app/settings/page.tsx` → `components/settings-page-client.tsx` → `components/settings.tsx`, que
reexporta `components/settings/RefactoredSettings.tsx`) **não grava nada fora do React**: as oito
chaves são `useState` (`RefactoredSettings.tsx:11-20`) e `updateSetting` (`:22-24`) só faz
`setSettings`. Os três botões de `CloudSettings.tsx` (`:19-32`) fazem `console.log`. `localStorage`,
`sessionStorage` e `document.cookie` no web inteiro (`git grep`) → só `pwa-install-prompt.tsx` e
`lib/firebase-session-cookies.ts:52` — nenhum em `components/settings/*`.

| chave | escrita em | lida em (fora de `components/settings/*`) |
|---|---|---|
| `darkMode` | estado React, `DisplaySettings.tsx:37` | ninguém |
| `defaultZoom` | estado React, `DisplaySettings.tsx:46` | ninguém |
| `autoScroll` | estado React, `DisplaySettings.tsx:67` | ninguém |
| `performanceMode` | estado React, `DisplaySettings.tsx:78` | ninguém |
| `metronome` | estado React, `AudioSettings.tsx:33` | ninguém |
| `autoSync` | estado React, `CloudSettings.tsx:50` | ninguém |
| `cloudSync` | estado React, `CloudSettings.tsx:61` | ninguém |
| `backupEnabled` | estado React, `CloudSettings.tsx:72` | ninguém |

`git grep -nwE "darkMode|autoSync|performanceMode|defaultZoom|autoScroll|metronome|backupEnabled|cloudSync" -- app components hooks lib contexts types`
fora de `components/settings/` → **0 linhas**. Nenhuma chave lida por superfície viva: a página sai
sem deixar leitor órfão.

### 17.3 `/profile`: o que escreve, o que lê, o que sobra do `/api/profile`

- **Escreve**: `PATCH /api/profile`, por `updateProfile` (`contexts/firebase-auth-context.tsx:405-420`),
  cujo **único** chamador é `components/ProfileForm.tsx:46` (`git grep -nw updateProfile`). Sem a
  página, o `PATCH` fica sem cliente (div. 507).
- **Lê**: o `profile` do contexto (`ProfileForm.tsx:34-36,99-105`).
- **Quem mais lê o perfil**: `components/user-header.tsx:38-39,54,62` (nome e avatar, shell vivo) —
  e o mesmo arquivo liga a página que sai (`:68`, div. 507).
- **O que sobra do `/api/profile`**: `GET` — `firebase-auth-context.tsx:71` (`fetchProfile`), `:141` e
  `:157` (bootstrap e retry), `login-panel.tsx:44,81`; `POST` (**criador do perfil**, confirmado) —
  `login-panel.tsx:53-67` e `:90-104` (primeiro login, perfil `null`) e
  `firebase-auth-context.tsx:326` (signup, com rollback do usuário Firebase se falhar).

### 17.4 O alcance do PWA e do offline

Mesmo grafo da A2, com `worker/` incluído (anexo [`script-a24.txt`](I1-PRECHECK-anexos/script-a24.txt)):

```
{ raizesVivas: 28, alcancePWA: 24, exclusivos: 9, compartilhados: 15,
  importadoresVivos: 10, testes: 4, exclusivosD19: 14 }
```

Raízes vivas = toda `page`/`layout`/`loading`/`route` + `middleware.ts`, menos o palco, as nove
raízes do PWA/offline e as três páginas da I1-D19; o alcance delas não atravessa o que morre.

| **exclusivos — morrem (9)** · [`pwa-offline-exclusivos.txt`](I1-PRECHECK-anexos/pwa-offline-exclusivos.txt) | **compartilhados — ficam (15)** · [`pwa-offline-compartilhados.txt`](I1-PRECHECK-anexos/pwa-offline-compartilhados.txt) |
|---|---|
| `app/api/proxy/route.ts` | `components/ui/button.tsx` |
| `app/offline/page.tsx` | `components/ui/card.tsx` |
| `components/pwa-install-prompt.tsx` | `components/ui/toast.tsx` |
| `components/service-worker-wrapper.tsx` | `hooks/use-toast.ts` |
| `hooks/use-service-worker.tsx` | `lib/api-errors.ts` |
| `lib/offline-cache.ts` | `lib/debug.ts` |
| `lib/offline-queue.ts` | `lib/firebase-admin.ts` |
| `lib/offline-setlist-cache.ts` | `lib/firebase-server-utils.ts` |
| `worker/index.js` | `lib/firebase.ts` |
| | `lib/logger.ts` |
| | `lib/supabase-service.ts` |
| | `lib/supabase.ts` |
| | `lib/user-rate-limit.ts` |
| | `lib/utils.ts` |
| | `types/database.types.ts` |

Fora do grafo, mesmo destino: `public/sw.js` (cópia gerada), `scripts/build-sw.js` e
`public/manifest.json`. O `pnpm build` é `pnpm exec next build && node scripts/build-sw.js`
(`package.json:8`; `build:sw` em `:9`) — a PR-3 muda o script de build. O `next.config.mjs` não tem
nada de PWA (o worker de `:66`, `:166-171` é o do PDF.js); tem a exclusão do proxy na regra de
cabeçalhos (`:16`, `'/api/:path((?!proxy).*)'`), que o `tests/config/next-headers.test.ts:32-36` afirma.

**Importadores vivos que a PR-3 edita (10)**: `app/layout.tsx` (prompt e wrapper do SW),
`components/content-edit-page-client.tsx:9,27` e `components/content-page-client.tsx:6,32`
(`cacheFileForContent`), `components/setlist-manager.tsx:6,98,118,142,188,219` (`saveSetlists`,
`removeCachedSetlist`), `contexts/firebase-auth-context.tsx:18-19,382-385` (limpeza no logout),
`hooks/use-content-actions.ts:7,58`, `hooks/use-library-data.ts:5,138,153` (é aqui que o erro vira
cache — §3 item 2), `hooks/use-setlist-data.ts:7-8,58-59,130`, `hooks/useContentFile.ts:2,29`
(o visualizador — div. 506), `lib/content-service.ts:5,522,564,606` (`enqueueRequest` da escrita
offline).

**Testes**: pelo grafo, `app/api/proxy/__tests__/route.test.ts` e
`lib/__tests__/offline-setlist-cache.test.ts` (só PWA/offline — morrem), `hooks/__tests__/use-library-data.test.tsx`
e `hooks/__tests__/use-setlist-data.test.tsx` (tocam — adaptam); por string (`vi.mock`/texto, fora
do grafo): `contexts/__tests__/firebase-auth-context.test.tsx:31,35`, `tests/config/next-headers.test.ts`
e três specs do `ux-audit` (`fase-d/b-pdf`, `harvest-populated`, `perf02-gate`).

**Exclusivos das três páginas da I1-D19** (14, no mesmo anexo): as três `page.tsx`,
`profile-page-client.tsx`, `ProfileForm.tsx`, `settings-page-client.tsx`, `settings.tsx`,
`settings/{Audio,Cloud,Display,Refactored}Settings.tsx`, `lib/setup-storage.ts` e dois primitivos
que ficam sem uso (`components/ui/skeleton.tsx`, `components/ui/switch.tsx`).

### 17.5 As duas públicas

- **`/` — `app/page.tsx`** (350 linhas): server component **estático** — sem `"use client"`, sem
  hook, sem `fetch`, sem redirect de usuário logado (o comentário `:7-8` diz que é estático de
  propósito; `/` não está nos prefixos do middleware). Só texto, quatro ícones lucide, `Image`, e
  links: `/login` ×3, `/signup` ×3, `/privacy-policy` ×1 e **7 `href="#"`** (div. 508).
- **`/privacy-policy` — `app/privacy-policy/page.tsx`** (112 linhas): `"use client"` (`:1`) sem
  nenhum hook nem lógica — só texto bilíngue e estilo; sem data, sem versão; dois links para fora,
  ambos `mailto:dpo@octavia.app` (`:86`, `:91`). O texto cita *"Google Authentication"* entre os
  serviços de terceiros — fica intacto pela I1-D19.
