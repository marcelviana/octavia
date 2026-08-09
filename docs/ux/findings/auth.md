# Findings — Auth (landing, login, signup)

Escopo: landing (`/`), login (`/login`) e signup (`/signup`), com base em 20 capturas
(landing 4 viewports; login e signup 8 cada — default + validation-error × 4 viewports),
nos `.a11y.json`/`.axe.json` correspondentes e na leitura do código
(`components/auth/login-panel.tsx`, `components/auth/signup-panel.tsx`, `app/page.tsx`,
`app/login/page.tsx`, `app/signup/page.tsx`, `app/api/auth/session/route.ts`,
`lib/rate-limiter.ts`, `lib/firebase-session-cookies.ts`,
`contexts/firebase-auth-context.tsx`, `middleware.ts`). Não há passada "populated" para
auth. Nenhuma quebra de layout entre viewports irmãos (390 / 768 / 1194 / desktop) foi
observada nas três telas. O idioma da UI não é registrado aqui (achado global da síntese).

Violações axe deduplicadas na área: **50** pares regra×elemento únicos, vindos de apenas
**4 regras** — `button-name` ×1 (crítico, signup), `heading-order` ×1 (landing),
`landmark-one-main` ×3 (uma por página), `region` ×45 (12 landing, 10 login, 23 signup;
causa estrutural única: conteúdo fora de landmarks). A mesma violação repetida nos 4
viewports/2 estados foi contada uma vez.

Histórico (fechado): **signup retornava 401** — já corrigido antes desta fase; registrado
aqui apenas para rastreabilidade, não é achado aberto.

## Achados

### [AUTH-01] Rate limit de sessão (5 req/15 min) vs. POST de sessão disparado por page load, troca de aba e refresh periódico
- Evidência: `lib/rate-limiter.ts:86-90` (AUTH: `maxRequests: 5`, `windowMs: 15 min`);
  `app/api/auth/session/route.ts:55` e `:80` (POST e DELETE ambos com
  `withRateLimit(RATE_LIMIT_CONFIGS.AUTH)`); gatilhos do POST em
  `contexts/firebase-auth-context.tsx:137` (todo `onAuthStateChanged` com usuário — ou
  seja, todo load/reload completo do app), `:206` (todo `visibilitychange` para visível —
  voltar para a aba/app) e `:222` (refresh periódico a cada 50 min), via
  `lib/firebase-session-cookies.ts:13`.
- Problema: o endpoint que renova o cookie de sessão é tratado como "tentativa de
  autenticação" e limitado a 5 requests por 15 minutos, mas o cliente o chama em uso
  totalmente passivo: abrir o app, alternar de aba/app e voltar, recarregar. Uso normal
  (ex.: 5-6 alternâncias de aba em 15 min, comum ao montar setlist consultando outras
  janelas) pode esgotar o limite; a partir daí `setSessionCookie` recebe 429 e falha
  silenciosamente (só `logger.warn`), o cookie deixa de ser renovado e — combinado com
  AUTH-02 — a navegação server-side pode expulsar o usuário para `/login`. A chave do
  limiter é IP+user-agent (`lib/rate-limiter.ts:130-140`), então o único usuário do app
  compete consigo mesmo em todos os dispositivos atrás do mesmo IP.
- Job afetado: J1 (abrir o app antes do show; risco de lockout no pior momento), J6
  (renovação de sessão é pré-condição do uso offline subsequente), J3 (sessões longas de
  preparação com muita troca de aba).
- Severidade: S1 **provisória** — quebra J1 se confirmado; confirmar na Fase D (perguntas
  exatas abaixo).
- Esforço: P (separar o bucket do endpoint de sessão do bucket de "tentativas de login",
  ou elevar o limite / limitar por falha e não por request).
- Classe: estrutural

### [AUTH-02] Cookie de sessão com Max-Age de 7 dias carrega um idToken que expira em 1 hora
- Evidência: `app/api/auth/session/route.ts:10-11` (`SESSION_COOKIE_MAX_AGE = 7 dias`) e
  `:34-41` (cookie = o próprio `idToken`); `middleware.ts:39-70` (valida esse token a cada
  request de página protegida); renovação depende exclusivamente dos gatilhos client-side
  de `contexts/firebase-auth-context.tsx:137,206,222`.
- Problema: o cookie promete 7 dias, mas seu conteúdo (idToken do Firebase) vale ~1 hora.
  Se a renovação client-side falhar — 429 do AUTH-01, dispositivo offline, aba que ficou
  horas em background sem `visibilitychange` — o middleware passa a rejeitar o token e
  redireciona para `/login`, mesmo com a sessão Firebase do cliente ainda válida. Para o
  cenário "app fechado há dias, aberto no palco" (J1) e "kill + reopen sem sinal" (J6), a
  primeira navegação server-side sempre carrega um token vencido.
- Job afetado: J1, J6.
- Severidade: S2 (fricção relevante com risco de virar S1 em J6 — depende do
  comportamento offline real, ver Fase D).
- Esforço: M (usar session cookie de verdade do Firebase Admin —
  `createSessionCookie` — ou renovar server-side).
- Classe: estrutural

### [AUTH-03] Usuário autenticado abrindo `/` cai na página de marketing, sem redirect para o dashboard
- Evidência: `public/manifest.json:5` (`start_url: "/"`); `app/page.tsx:6-8` (landing
  estática, comentário explícito de que não checa auth); `middleware.ts:32-36` (`/` não é
  rota protegida nem rota de auth, então nenhum redirect se aplica); capturas
  `docs/ux/capture/landing/default-*.png` (a página que o usuário logado vê).
- Problema: o PWA instalado abre em `/`, que é uma landing de marketing dirigida a
  visitantes anônimos. Marcel, o único usuário e sempre logado, precisa de um tap extra
  ("Sign In" no header) que passa por `/login` para só então o middleware redirecioná-lo
  ao dashboard (`middleware.ts:76-78`). Isso consome parte do orçamento de J1 (≤ 4 taps /
  ≤ 10 s da tela inicial à primeira música) antes mesmo de o app "de verdade" abrir; o
  fluxo landing → login → redirect também adiciona dependências de rede no caminho
  crítico offline. Sintoma correlato: o signup redireciona para `/` no sucesso
  (`components/auth/signup-panel.tsx:56`), devolvendo o recém-cadastrado ao marketing.
- Job afetado: J1, J6.
- Severidade: S2
- Esforço: P (redirect server-side em `/` quando há cookie válido, ou `start_url`
  apontando para `/dashboard`).
- Classe: estrutural

### [AUTH-04] Validação de formulário delega tudo ao balão HTML5 nativo (fato pré-existente confirmado)
- Evidência: capturas `docs/ux/capture/login/validation-error-*.png` e
  `docs/ux/capture/signup/validation-error-*.png` (balão "Please fill out this field.");
  `docs/ux/capture/login/validation-error-desktop.a11y.json` (único delta vs. default é o
  `alert` nativo); `components/auth/login-panel.tsx:234,259` e
  `components/auth/signup-panel.tsx:119,131,152,189,208` (apenas `required`/`minLength`,
  sem `noValidate`, sem mensagens inline próprias).
- Problema: o único feedback de campo é o balão do browser — efêmero, um campo por vez,
  estilizado pelo SO e no idioma do browser, destoando do padrão de erro do próprio app
  (caixa vermelha, usada para erros de servidor). No signup, a caixa de erro aparece no
  topo do form (`signup-panel.tsx:101-105`) e no login, embaixo dos campos
  (`login-panel.tsx:267-271`) — dois padrões para a mesma coisa. O mismatch de senhas só
  é detectado no submit.
- Job afetado: nenhum diretamente — login é evento raro para o usuário único e o JOBS.md
  define que signup será avaliado só quanto a estar funcional (e está). Registrado porque
  é o padrão de validação que tende a ser copiado para forms que afetam jobs (add-content,
  setlists).
- Severidade: S3
- Esforço: M
- Classe: estrutural

### [AUTH-05] Select "Primary Instrument" sem nome acessível (axe `button-name`, impacto crítico)
- Evidência: `docs/ux/capture/signup/*-*.axe.json` (`button-name | critical`, alvo
  `.justify-between`, presente nas 8 capturas — 1 violação deduplicada);
  `components/auth/signup-panel.tsx:159-165` — `<Label htmlFor="primaryInstrument">` não
  associa, pois o `SelectTrigger` não recebe `id="primaryInstrument"`.
- Problema: o botão do select não tem nome acessível; leitores de tela anunciam um botão
  anônimo e o clique no label não foca o controle. É a única violação axe de impacto
  crítico de toda a área. Correção de uma linha (adicionar `id` ao `SelectTrigger`).
- Job afetado: nenhum (signup avaliado apenas como funcional) — registrado por ser
  violação crítica de a11y com custo de correção mínimo.
- Severidade: S3 (calibrada pela regra do JOBS.md para signup)
- Esforço: P
- Classe: estrutural (a11y)

### [AUTH-06] Botão "Sign In" invisível na seção CTA final da landing
- Evidência: `docs/ux/capture/landing/default-desktop.png` e `default-mobile.png` (pílula
  branca vazia ao lado de "Create Free Account"); `app/page.tsx:243-250` —
  `variant="outline"` (que aplica fundo branco `bg-background`) combinado com
  `border-white text-white`.
- Problema: o botão renderiza como um retângulo branco sem texto legível — o rótulo
  "Sign In" é branco sobre fundo branco. O controle existe e é clicável, mas é
  visualmente um botão em branco em todos os viewports; um dos dois caminhos de entrada
  da seção final está quebrado visualmente.
- Job afetado: nenhum job numerado (o usuário logado usa o header); registrado porque é
  um controle quebrado na página que é o `start_url` do PWA (ver AUTH-03).
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [AUTH-07] Campos de auth sem atributos `autocomplete`
- Evidência: `components/auth/login-panel.tsx:231-264` e
  `components/auth/signup-panel.tsx:114-210` — nenhum `autoComplete` (`email`,
  `current-password`, `new-password`); grep confirma ausência em toda a pasta
  `components/auth/` e em `components/ui/input.tsx`.
- Problema: gerenciadores de senha e teclados móveis perdem as dicas padronizadas para
  ofertar preenchimento/geração de senha de forma confiável. Encarece justamente o
  re-login em dispositivo novo ou pós-expiração — o cenário em que login precisa ser
  rápido (antes de um show, no tablet).
- Job afetado: J1 (marginal — apenas quando um re-login precede o show).
- Severidade: S3
- Esforço: P
- Classe: estrutural

### [AUTH-08] Páginas sem estrutura de landmarks (axe `region`, `landmark-one-main`, `heading-order`)
- Evidência: axe deduplicado — `landmark-one-main` nas 3 páginas, `region` em 45
  elementos (12 landing, 10 login, 23 signup), `heading-order` em 1 elemento da landing
  (`h4` de depoimento após `h2`); ausência de `<main>` em `app/page.tsx`,
  `app/login/page.tsx:17-21` e `app/signup/page.tsx:15-74`.
- Problema: nenhuma das três páginas tem landmark `main` e todo o conteúdo fica fora de
  regiões nomeadas — 45 dos 50 pares regra×elemento da área derivam dessa única causa
  estrutural. Impacto moderado (navegação por leitores de tela), correção concentrada em
  envolver o conteúdo em `<main>`/landmarks por página.
- Job afetado: nenhum (a11y de telas fora do uso de palco); registrado por concentrar 90%
  das violações axe da área em uma causa só.
- Severidade: S3
- Esforço: P
- Classe: estrutural (a11y)

### [AUTH-09] Inconsistência visual entre landing e telas de auth
- Evidência: capturas landing vs. login/signup; `app/page.tsx:64` (destaque "Digitized"
  azul/roxo), `:73-79` (CTA primário azul→roxo "Get Started Free"), `:223-251` (seção CTA
  inteira azul/roxa) vs. identidade âmbar/laranja de login/signup e do próprio header da
  landing; login sem painel lateral vs. signup com painel promocional
  (`app/signup/page.tsx:18-72`); rodapés divergentes — "© 2025 Octavia Music"
  hard-coded nas telas de auth (`login-panel.tsx:324`, `signup-panel.tsx:242`) vs.
  "© 2026 Octavia" dinâmico na landing (`app/page.tsx:344`).
- Problema: a landing usa uma segunda paleta (azul/roxo) que não existe em nenhuma outra
  tela do produto, e as três telas do mesmo fluxo (landing → login/signup) alternam
  layout, paleta e até o ano/nome do copyright. Lê-se como três produtos diferentes.
- Job afetado: nenhum — puro polish de coerência; registrado como inventário para a
  síntese de consistência visual.
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [AUTH-10] Landing com conteúdo fictício e links mortos
- Evidência: `app/page.tsx:172-218` (três depoimentos inventados), `:232` ("Join
  thousands of musicians"), `:151-154` ("Multi-User Access" — o app é single-user por
  decisão), `:287-337` (footer: Features, Pricing, FAQ, About, Blog, Contact e Terms,
  todos `href="#"`); capturas `landing/default-*.png`.
- Problema: a página de entrada do produto promete features e escala que não existem e
  oferece 7 links de navegação que não levam a lugar nenhum (becos sem saída clicáveis).
  Para um app de usuário único, é peso morto que ainda por cima ocupa o `start_url`
  (agrava AUTH-03).
- Job afetado: nenhum — conceitual; registrado porque a decisão "o que é a rota `/`"
  precisa ser tomada em conjunto com AUTH-03.
- Severidade: S3
- Esforço: M (decidir e substituir/encolher a página), P se apenas remover links mortos.
- Classe: conceitual

### [AUTH-11] Estado de loading compartilhado entre "Sign In" e "Continue with Google"
- Evidência: `components/auth/login-panel.tsx:275-307` — os dois botões usam o mesmo
  `isLoading` para `disabled` e para exibir spinner.
- Problema: ao submeter e-mail/senha, o botão do Google também mostra spinner "Loading..."
  (e vice-versa), sinalizando atividade no caminho errado. Desabilitar ambos é correto;
  animar ambos não.
- Job afetado: nenhum (login raro); polish barato.
- Severidade: S3
- Esforço: P
- Classe: cosmético

## Verificar na Fase D

1. **AUTH-01 (rate limit)** — Logado com a conta de auditoria: alternar de aba/janela e
   voltar 5+ vezes em menos de 15 min (cada retorno dispara
   `POST /api/auth/session` via `firebase-auth-context.tsx:206`). O 6º request retorna
   429? Após o 429, um reload de `/dashboard` depois de ~1 h de sessão redireciona para
   `/login` (interação com AUTH-02)?
2. **AUTH-01 (custo do login)** — Quantos POSTs a `/api/auth/session` um único login
   completo dispara? (Hipótese: ≥ 2 — `onAuthStateChanged` no login e novamente após o
   `window.location.href = '/dashboard'` de `login-panel.tsx:74`, que remonta o contexto.)
   Login + 3 trocas de aba já estoura o limite de 5?
3. **AUTH-02 / J6 (login offline)** — Kill + reopen do app em modo avião, com sessão de
   mais de 1 h: o Firebase restaura o usuário localmente e o app chega ao `/dashboard`
   (via cache do service worker), ou o middleware/redirect exige rede e bloqueia em
   `/login`? O `setSessionCookie` falhando offline degrada algo visível?
4. **AUTH-03 / J1** — Medir taps e segundos reais do tap no ícone do PWA (start_url `/`)
   até o dashboard, logado: o caminho landing → header "Sign In" → `/login` → redirect
   custa quantos taps/segundos do orçamento de J1 (≤ 4 taps / ≤ 10 s até a primeira
   música)? E offline, esse redirect via middleware funciona?
5. **Google sign-in em PWA** — "Continue with Google" (popup, `login-panel.tsx:150-164`)
   funciona no PWA instalado em tablet (iPad/Android), onde popups costumam ser
   bloqueados ou abrir fora do app?
6. **AUTH-04** — Confirmar que o balão nativo aparece no idioma do browser/SO do tablet
   real (capturas mostram "Please fill out this field." em EN — em pt-BR o balão virá em
   português, divergindo do restante da UI em inglês).
