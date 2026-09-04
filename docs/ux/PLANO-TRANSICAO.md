# PLANO-TRANSICAO.md — Fase E: do assessment web ao app nativo

> **Enquadramento (decisão de produto, 2026-08-10)**: NÃO haverá reforma nem
> reconstrução da UI web. A direção é construir apps **nativos** (Android e
> iOS), com nova direção visual, mantendo o backend atual (Next.js API +
> Supabase + Firebase Auth) com o mínimo de mudança necessária. O app web
> permanece em uso real (palco, semanal) até o nativo substituí-lo.
>
> **O que este documento faz**: reclassifica os 96 achados consolidados do
> [`ASSESSMENT.md`](ASSESSMENT.md) (95 abertos + GLOB-01) e as medições do
> [`fase-d/RESULTS.md`](fase-d/RESULTS.md) em **quatro destinos**:
>
> - **A** — Sobrevivência do web: fila mínima de fixes enquanto o nativo nasce
> - **B** — Contratos de API que o nativo herda: tarefas de backend
> - **C** — Corpus de requisitos do app nativo: espec, não fila de fixes
> - **D** — Morre com a web: nunca recebe fix
>
> **O que este documento NÃO faz**: decidir sobre a stack nativa — essa
> decisão segue aberta (ver seção de stack).
>
> **Status (2026-08-10)**: plano **aprovado** pelo Marcel, com as decisões
> incorporadas: fila A final fechada (#0–#11, abaixo) e as quatro decisões
> de dados do B5 tomadas (bis liberado, annotations mantida,
> venue/data/notas ligados, data como date-only).

---

## Bloco A — Sobrevivência do web (fila mínima, sem redesign)

**Critério de entrada**: S1/S2 que morde o uso real semanal **E** esforço P.
Uma única exceção M admitida (SET-14), justificada por veto J1/J6. Nada de
redesign: cada item é religar um fio, corrigir uma linha ou destravar um fluxo.

Todos os candidatos abaixo foram **validados no código nesta fase** — os
apontamentos de arquivo/linha conferem com o estado atual do repositório.

### Fila final — RECORTADA para 7 itens (2026-08-10, segunda revisão)

> **Racional do recorte**: o custo real da fila ficou visível na execução
> do #0 — o fix era 1 linha, mas o terreno (pipeline de build/deploy,
> acesso a preview, self-fetch) consumiu o esforço. Com o nativo decidido,
> o web precisa apenas **não atrapalhar shows e preparação de shows** até
> a substituição. Recorte pelo uso real: a maior parte do conteúdo de
> palco é **texto** (cifras/letras/tabs), não PDF; os fluxos de preparação
> (setlists, upload) incomodam com frequência real. Itens #6, #7, #9, #10
> e #11 da fila original foram **cortados** e migraram para o Bloco D.

**#0 — Paliativo do rate limit (RATE-01) — ✅ CONCLUÍDO**:
retirar o limiter antigo do caminho de `/api/auth/verify`. A rota é
**pública** (qualquer cliente pode dar POST nela); a justificativa do
paliativo: verificação **local** de assinatura JWT (custo de CPU baixo),
app de usuário único, estado temporário até o B1. Executado nas PRs #219
(fix + regressão `rl-0-verify.spec.ts`) com as PRs de terreno #220
(pipeline) e #221 (âncora do self-fetch); **validado quantitativamente em
preview e em prod** (parte A: 40× 200 / 0× 429; parte B: 12/12 navegações
sem expulsão; parte C: limiter antigo vivo fora do verify). Relatório
final aprovado em 2026-08-10.

**Itens restantes, na ordem de execução** (nova ordem = prioridade real de
uso; a antiga PR-1 vai para o fim):

| Ordem | # | ID | Fix proposto | Esf | Risco / processo |
|-------|---|----|--------------|-----|------------------|
| 1º | 2 | **SET-23** ✅ **CONCLUÍDO** | `.nullish()` nos schemas de **create e update** de setlist ([`lib/api-validation-middleware.ts`](../../lib/api-validation-middleware.ts)). A UI ficou **intocada**: em update, `undefined` = "não mexa" e `null` = "limpe o campo" — o `\|\| undefined` cogitado teria criado um save que mente. PR #222, mergeada em 2026-08-10. | P | **Validado em preview e prod**: create com `null` → 201; update-clear persiste vazio. Item 16 passou **inteiro** em prod pela 1ª vez: **criar setlist vazia 7 → 3 taps** (J3 ✅), `taps_total` 29 → 25. |
| 2º | 3 | **ADD-13** ✅ **CONCLUÍDO** | Branch de upload passou a usar `metadataToUse` + os 9 campos avançados ([`hooks/useAddContentLogic.ts`](../../hooks/useAddContentLogic.ts)). Schema conferido campo a campo antes do commit — nada stripado. PR #223, mergeada em 2026-08-11. | P | **Confirmado em prod (item 42)**: título `ux-audit-fase-d-cifra.pdf` → **`[UX-AUDIT] Fase D import solo`**, artista `Unknown Artist` → **`Conjunto Fase D`**, tom `null` → **`F`**. Item 46 (busca pelo título) atendido, verificado por API. Read-back de `key`/`bpm` no spec novo. |
| 2º | 4 | **ADD-14** ✅ **CONCLUÍDO** | Guarda de in-flight por ref + `await onComplete` (que tornou o `disabled` real). PR #223. | P | **Confirmado**: clique duplo online → **1 linha**; o 2º clique foi barrado pelo próprio `disabled`. Escopo declarado: **replay offline não é coberto** (B9). |
| 3º | 8 | **CONT-01 + CONT-02** ✅ **CONCLUÍDO** | `white-space: pre` + `overflow-x-auto` em **5 sites** (o plano supunha 1 renderer): `TabDisplay` tab-string, `ChordDisplay` cifra-string **e** `sections[].lyrics`, `LyricsDisplay` cifra-na-letra, e o **palco** (2 pontos). Mudança deliberada onde era `pre-wrap`. PR #224, mergeada em 2026-08-12. | P | **Validado em preview e prod** a 390 px, por computed style: cifra `pre`/`auto`/**420>276**, tab `pre`/`auto`/**521>276** com **6 cordas de largura idêntica**, palco/cifra `pre`/`auto`/**443>326**. **O item 33 deixa de ser gate** (media `[]` antes e depois: o seletor `pre, [class*="overflow-x"]` não casava com o `div.font-mono` quebrado) — o gate passa a ser `cont01-02-monoespacado.spec.ts`, que **falhou contra o código sem o fix** e passou com ele. Pendência declarada: `fixme` do palco/tab (tab não renderiza no palco → Bloco C). |
| 4º | 5 | **SET-14** (FASE-D-06) ✅ **CONCLUÍDO** | Cache-first no [`hooks/use-setlist-data.ts`](../../hooks/use-setlist-data.ts) (hidrata do IndexedDB e lista imediatamente; rede revalida e **substitui** estado e cache — `replaceSetlists`, sem merge, deleções de outro dispositivo não ressuscitam) + `getUserSetlists` deixa de engolir erro (lança; falha nunca vira `[]`). Sonda do pre-check separou H1×H2: a gravação **funcionava** (chave/uid corretos); o bug era o `[]` silencioso + `navigator.onLine` como porta única do cache — que é `true` no caso real de palco (**wi-fi conectado sem internet**), coberto agora; `onLine=false` virou atalho, com estado de erro declarado também para cache vazio. PR #225, mergeada em 2026-08-12. | **M** | **Validado em preview e prod** com gate novo `set14-gate.spec.ts` (read-only, prontidão por `expect.poll` no IndexedDB): offline lista "UX-AUDIT Show padrão", zero "No setlists yet". **Controle negativo**: o gate **falhou contra prod sem o fix** exatamente no assert do alvo. Sanity 8–9 sem regressão (medições idênticas à baseline). Staleness offline declarada aceitável por design (o SET-14 original vira comportamento pretendido). Fora do escopo → B: poda das demais stores; erro engolido nos outros serviços. |
| 5º (último) | 1 | **PERF-02** ✅ **CONCLUÍDO** | Em [`lib/security-headers.ts:79`](../../lib/security-headers.ts), `frame-src: 'none'` → **`blob:`** (mínimo — desvio declarado do `'self' blob:` registrado aqui: o pre-check provou que o único iframe do app só recebe `blob:` do próprio origin via `/api/proxy` → `createObjectURL`, e `'self'` não tinha uso que o justificasse). Sem `data:` (fallback legacy morto, restrito ao viewer — declarado na PR). Fonte única da CSP provada por grep. Teste unitário novo trava o invariante com asserts negativos. PR #226, mergeada em 2026-08-12. | P | **Validado em preview e prod, Chromium headed**: header vivo `frame-src blob:`, zero violações de CSP sobre o iframe blob, e o **PDF de 12 páginas renderizando no palco** (screenshot contra a baseline "This content is blocked" do item 4). Gate novo `perf02-gate.spec.ts` com **controle negativo** (regra nº 7): contra prod sem o fix, falhou com `CSP recebida: frame-src 'none'`. |

**Cortados no recorte (2ª revisão) — migraram para o Bloco D**: SET-03 e
SET-04 (reorder convive com workaround manual até o nativo; o desconhecido
do item 17 — posições 10000+, latência dos 2N UPDATEs — deixa de ser risco
da fila A e vira **pergunta de design do reorder nativo**, registrada no
B6), AUTH-03, PERF-07 e DASH-04 (cosméticos).

**Mapeamento de PRs**: morrem PR-5, PR-7, PR-8a e PR-8b. Sobram, na ordem:
**PR-2 (#2) → PR-3 (#3+#4) → PR-6 (#8) → PR-4 (#5) → PR-1 (#1)**.

**Processo por classe de item**: conteúdo/UI sem toque em auth ou dados
(#8) roda com **checkpoint único** — diff + teste apresentados juntos.
Auth, dados e upload (#2, #3, #4, #5) mantêm o rigor atual (pre-check
reportado, aval por etapa).

**Verificação sem custo novo**: a suíte da Fase D (projeto `fase-d`) tem o
teste de regressão de cada item restante — 16 (criar setlist), 42/43/46
(metadados/double-submit), 33 (tab), 10 + 8–9 (offline), 4 (PDF, headed).
Validação preview-first com a infra montada no #0 (bypass header no
tooling; self-fetch ancorado).

### O que NÃO entra no Bloco A (explícito)

- **Qualquer M/G de UI web**: telas do batch import (ADD-02), progresso/cancelamento
  de upload (ADD-06), skeleton da library (LIB-01), dashboard (DASH-01/03/05),
  redesign de busca e filtros (LIB-05/06/07), zoom/toolbar do viewer (CONT-08),
  navegação do palco (PERF-04/06), auto-hide (PERF-12), tradução (GLOB-01).
- **Todo o estoque S3 cosmético** (20 achados): contraste, landmarks, nomes
  acessíveis, paleta — a direção visual muda no nativo; polir a atual é retrabalho.
- **O redesenho do rate limiting** (é B; a fila A leva só o paliativo #0).
- **Tudo do Bloco D** (abaixo).

---

## Bloco B — Contratos de API que o nativo herda (fazer antes/junto)

O backend fica. Estes achados são **dele**, não da UI — cada um vira tarefa
de backend a executar antes ou junto do desenvolvimento nativo, porque o
cliente nativo herdaria o defeito.

### B1 — Rate limiting: redesenho obrigatório (RATE-01)

**O problema hoje**: dois sistemas coexistem. O antigo
(`lib/rate-limit.ts`: contador **por IP**, TTL de 60 s renovado a cada
request aceito, orçamento **compartilhado entre todas as rotas**) está no
caminho crítico de `/api/auth/verify`, chamado por todo server component
autenticado. Números da Fase D: limite 5/15 min no `/api/auth/session`,
`Retry-After` de 732 s, **63% de 429** em 371 POSTs, montagem de setlist
perdendo 18 de 56 músicas sem aviso.

**O agravante mobile que torna isso bloqueante para o nativo**: no celular,
o app vai operar atrás de **CGNAT** — operadoras brasileiras compartilham
um IP público entre centenas de assinantes. Rate limit por IP significa
(a) o orçamento do usuário consumido por tráfego de terceiros e (b) janelas
que nunca estão virgens (já medido: primeiro POST com `remaining: 1`).
Por IP não é apenas ruim: é **incompatível com o cliente que vem aí**.

**Direção proposta** (espec, não implementação):
1. **Chave por usuário autenticado** (UID do token verificado), não por IP.
   IP só como fallback para endpoints pré-auth — e com janelas largas.
2. **Janela real**: fixa ou deslizante, sem renovação de TTL a cada request
   aceito; orçamento **por rota ou grupo de rotas**, nunca global.
3. **Retirar o limiter do caminho de `/api/auth/verify`** — verificação
   local de assinatura JWT, custo baixo por request; a rota é pública, mas
   o uso que o limiter punia é o interno dos server components.
   *(Antecipado: aprovado como item #0 da fila A.)*
4. **Um sistema só**: matar `lib/rate-limit.ts`, ficar com `lib/rate-limiter.ts`
   (ou substituto), com configs explícitas por rota.
5. Resposta 429 **estruturada** (ver B3) com `Retry-After` honesto.

**Evidência acumulada do session (dossiê do B1)**: além dos **63% de 429
em 371 POSTs** da Fase D (prod), a validação da fila A #0 em preview
somou uma segunda fonte independente: **9 de 12 navegações triviais
(75%) geraram 429 no `/api/auth/session`** — navegação normal de um
único usuário esgota a janela de 5/15min quase imediatamente. Terceira
fonte (2026-08-11): na PR-3, uma **verificação de higiene trivial** ao
fim da rodada de prod já encontrou a janela esgotada (429 com backoff de
60 s no tooling). Leitura: **o redesenho do session é candidato a
primeiro item executado do B1.**

**Rastreio (fila A, 2026-08-10)**: o redesenho elimina o self-fetch HTTP
(verify vira chamada de função local — `verifyFirebaseToken` já é local),
removendo a classe inteira de pedágios cobrados três vezes durante o audit
e a fila A: rate limiter no caminho (FASE-D-01), Deployment Protection
bloqueando o hop interno no preview, e a âncora de origem do fetch
(request-derived, corrigida na fila A por convergência com a cadeia de
env). Nota adicional: o hop in-lambda via localhost não carrega
`x-forwarded-for` — no limiter antigo, os self-fetches caíam todos no
bucket `'anonymous'` compartilhado, evidência extra da incompatibilidade
do desenho.

**Execução (pre-check aprovado 2026-08-14)** — o B1 vira **quatro PRs**,
cada uma com ciclo completo (checkpoint → preview → aval → merge → prod):

- **B1.0 — redução de superfície: ✅ CONCLUÍDA (PR #227, squash em main,
  2026-08-14).** Três remoções de segurança, não housekeeping:
  (1) `/api/auth/user` — gestão completa de usuários Firebase atrás de
  "verifyAdminToken" **sem claim de admin** (escalação de privilégio
  latente com signup aberto); rota órfã, zero callers. (2)
  `/api/test-setlists` — debug público sem auth com self-fetch
  request-derived (`req.nextUrl.origin`) encaminhando cookie — mesma
  classe de vetor eliminada do session na PR #221. (3)
  `/api/firebase-config` — oráculo público de env: `SET`/`MISSING` das
  três credenciais Admin + prefixo da apiKey, sem auth; o client obtém a
  config só de `NEXT_PUBLIC_*` em build. Junto: remoção do
  `ddos-rate-limiting.test.ts` (100% auto-mockado, cobertura real zero).
  Gate (regra nº 7): controle negativo contra main **401/401/429/429/
  200/200** (não-404; test-setlists via GET sem cookie — forward morreu
  em 401 interno, nada semeado) → preview e prod **404×6** com sanidade
  `/api/health` 200. E2E herdado não ampliado (main 66 failed → PR os
  mesmos menos 1 flaky); cobertura global idêntica ao dígito.
  **Perda declarada**: parte C do `rl-0-verify.spec.ts` (controle
  negativo do limiter antigo usava `auth/user`) — removida-com-substituto-
  no-B1.3 (nota no cabeçalho do spec). **Pendência registrada para a
  B1.1**: órfãos resultantes em `lib/firebase-admin` (`createUser`/
  `updateUser`/`deleteUser`/`getUserByUid`) e `lib/validation-schemas`
  (`createUserSchema`/`updateUserSchema`).
- **B1.0.1 — remoção da suíte E2E do CI: ✅ CONCLUÍDA (PR #228, squash
  `e6dec0c`, 2026-08-14).** Decisão de escopo tomada antes do desenho da
  B1.1: `tests/e2e/` + 3 passos do CI + configs/scripts/docs órfãos
  removidos; **gate de merge promovido de provisório a definitivo**
  (seção do item irmão do B8, racional em 3 pontos lá). **Marco: primeiro
  CI integralmente verde em mais de um ano, 2m21s (~4× mais rápido)** —
  gate da PR provado com contraste completo (run do main com o passo e o
  vermelho × run da PR sem o passo e verde). Higiene verificada: o
  `tests/e2e/.auth/user.json` commitado era **storageState vazio em todo
  o histórico** (blob único de 36 bytes, `{"cookies":[],"origins":[]}`)
  — nenhuma sessão de nenhuma conta jamais versionada, sem reescrita
  necessária. `@playwright/test` e os gates do ux-audit intocados.
- **B1.1 — self-fetch → chamada direta nas lambdas: ✅ CONCLUÍDA (PR
  #229, squash `bbe8de4`, 2026-08-17).** Transporte, não comportamento,
  nas duas cadeias: verificação por chamada direta de
  `verifyFirebaseToken` com guard estático por compilação
  (`NEXT_RUNTIME !== 'edge'` + guard de window; alias client no
  next.config em commit de infra próprio); caches, strings de erro,
  fallback stale (teste novo) e blacklist dormante preservados; ramo
  fetch preservado atrás de env, sem consumidor em produção, morre na
  B1.2. **Achado central: o middleware roda como função NODE** — o
  `functions-config-manifest.json` é a verdade (`"/_middleware":
  {"runtime":"nodejs"}`), o warning do Next 15.2.8 não impede; o
  self-fetch dele resolvia localhost in-lambda (mistério do pre-check
  resolvido). **Decisão A**: middleware passou ao transporte direto sem
  mudança de código, com assert nomeado na validação (expulsão sem
  sessão 307→/login; passagem com sessão 200; /login→/dashboard 307 —
  verificado em preview e prod). **G1 permanente na suíte**
  (`lib/__tests__/g1-no-self-fetch.test.ts`): espião de fetch nas duas
  cadeias + ponta a ponta; controle negativo executado contra o main
  (falha com `'via-http' ≠ 'g1-uid'`). rl-0 A+B verdes no preview
  (40×200 no verify; 12 navegações, zero /login, zero 429 fora do
  session; session 9/12 — padrão pré-B1.3 intacto). Órfãos da B1.0
  removidos. **Primeiro número concreto do custo do self-fetch por
  navegação**: a mesma rodada de 12 navegações do rl-0 caiu de 2.7min
  (preview pré-B1.1) para **50s** (prod pós-B1.1) — entra no dossiê como
  evidência do ganho. **`NEXTAUTH_URL` ficou sem consumidor em produção
  — morte formal na B1.2.**
- **B1.2a — enforcement nas páginas + gate G-rotas: ✅ CONCLUÍDA (PR
  #230, squash `6e9977e`, 2026-08-17).** A rede que torna o otimista da
  B1.2b seguro, mergeada primeiro por desenho (racional: estritamente
  mais segura que o estado anterior; o otimista só entra com ela em
  prod — segurança estrutural, não disciplinar). `requirePageUser`
  (nulo → /login; não-verificado → /verify-email) nas 8 páginas; as 4
  client (setlists/settings/profile/add-content) **não tinham
  verificação server nenhuma** — viraram wrapper server + componente
  client intacto; dashboard/library trocaram o spinner "avoid loops"
  (arqueologia: defesa da era dos 429, causa morta na B1.1) por
  expulsão. **G-rotas permanente** (tests/gates/, 17 asserts, lista
  única `lib/protected-routes.ts` — paridade middleware↔gate por
  construção); controle negativo contra o main: **14/16 asserts de
  página falhavam** — as 6 expulsões previstas MAIS as 8 do check de
  verify-email, que **nenhuma página fazia** (buraco além do mapeado,
  achado pelo próprio controle e fechado na mesma PR). Validação:
  matriz 8 rotas × 3 estados = 24/24 com anti-loop em todas (preview) e
  matriz reduzida em prod. **Semântica de stream do /performance
  documentada**: única rota com loading.tsx — expulsão chega como
  `NEXT_REDIRECT` no stream (HTTP 200, body só com fallback de loading,
  zero vazamento; browser aterrissa em /login — provado em três
  camadas). Válido também pós-B1.2b, registrado.
- **B1.2b — middleware otimista + remoção da rota verify: ✅ CONCLUÍDA
  (PR #231, squash `22c5e63`, 2026-08-20) — B1.2 COMPLETA (a+b).**
  Middleware checa só presença+forma do cookie (JWT 3 segmentos); a
  verificação vive nas páginas (B1.2a). Anti-loop por construção: o
  redirect de auth-routes saiu do middleware (só as páginas, que validam,
  redirecionam usuário válido). **Rota `/api/auth/verify` REMOVIDA** —
  pendência da PR #219 fechada por eliminação, contraste medido (main
  400 → preview/prod 404). Ramos fetch das duas cadeias mortos (16+8
  testes declarados, incl. verify.test.ts — furo de inventário por
  import relativo, registrado); bloco CORS órfão de security-headers
  removido (+ alias createSecurityHeadersMiddleware, 3º órfão achado
  pelo tsc). **`NEXTAUTH_URL` MORTA**: zero leitores de código →
  removida dos 3 ambientes no dashboard (2026-08-20) e do .env.local;
  validação sem a env: matriz reduzida 13/13 em preview de build novo E
  prod. Prova de camada: bundle do middleware com zero símbolos de
  verificação + forjado-atravessa-e-a-página-expulsa (destinos idênticos
  à B1.2a em toda a matriz, 24/24 preview e 13/13 prod; /performance por
  destino, semântica de stream). rl-0 parte A removida (objeto extinto;
  classe coberta por G1 + parte B + G-rotas). **Relógio: navegação
  2.7min (pré-B1.1) → 50s (B1.1) → 39.9s (B1.2b).** Dossiê do session
  fecha em SEIS medições para a B1.3: 9, 9, 7, 10, 9, 11 de 12 + setup
  falhando na própria validação da B1.2b. Registro histórico do item
  (premissas corrigidas na B1.1, condição de enforcement) preservado
  abaixo:
  **PREMISSAS CORRIGIDAS na B1.1 (2026-08-16), redefinem este item:**
  (1) o middleware NÃO roda Edge — o build real o registra como **função
  Node** (`functions-config-manifest.json`: `"/_middleware":
  {"runtime":"nodejs"}`; o warning do entries.js não impede) e o
  self-fetch dele resolvia `localhost` in-lambda — mistério do pre-check
  resolvido; com a B1.1 (decisão A) ele já verifica por chamada direta.
  (2) **As páginas verificam mas NÃO expulsam**: dashboard com user nulo
  renderiza spinner ("avoid loops"), não redirect — o middleware é a
  ÚNICA camada de redirect em prod; e `next start` local nem executa
  node middleware no 15.2.8. **O desenho do middleware otimista DEVE
  incluir enforcement de redirect nas páginas (ou equivalente) como
  parte do pacote — "otimista" sem isso é remoção de segurança.** A
  decisão 1 do B1 (opção a) fica condicionada a esse desenho.
  **[2026-08-17] Premissa (2) ATENDIDA pela B1.2a (acima): enforcement
  nas 8 páginas em prod + G-rotas permanente — a condição está
  satisfeita e a troca pode acontecer.** Condição
  original mantida: gate que enumera rotas/páginas protegidas e prova o
  enforcement de cada uma. Com zero consumidores, a rota verify sai — a
  pendência da PR #219 fecha por eliminação de superfície. O gate A do
  rl-0 morre aqui, declarado. A âncora `NEXTAUTH_URL` (sem consumidor em
  produção desde a B1.1/decisão A) é aposentada aqui.
- **B1.3 — limiter único: ✅ CONCLUÍDA (PR #232, squash `95ca739`,
  2026-08-22) — B1 COMPLETO.** Sistema único em `lib/user-rate-limit.ts`
  (núcleo novo, ~150 linhas + 7 testes de contrato; os dois módulos
  antigos e o inline do proxy aposentados inteiros, ~700 linhas fora).
  Chave `user:<uid>:<família>` pós-verificação; deny-fast por IP nos
  funis de auth; 429 estruturada com `X-RateLimit-Scope` (semente do
  B3). **G2**: uso real 120 GETs → zero 429; estouro deliberado → 429
  com assinatura nos dois escopos e Retry-After honesto; guarda
  anti-prod NO SPEC (provada por recusa antes do uso); controle negativo
  contra preview pré-B1.3 falhou na linha exata da assinatura. **G3**:
  rl-0 com session NO assert — controle negativo contra prod falhou com
  6× 429 de session (**sétima medição fechando o dossiê**: 9, 9, 7, 10,
  9, 11, 6+setup-falho); contra o B1.3, **a primeira navegação com zero
  429 de session da história do projeto** (preview e prod). **Achado de
  teste registrado**: o lockout do OWASP mandava `{email,password}` a um
  endpoint de `{idToken}` e passava por acidente do limiter
  pré-validação — corrigido, agora prova lockout de verdade. Tabela de
  janelas final e nota de arquitetura: acima neste item.
  *(Desenho original mantido abaixo para referência:)* chave por **uid pós-auth** com fallback por
  IP exclusivamente no caminho de auth falhada; janelas dimensionadas com
  os dados do probe (caso dimensionante: `visibilitychange` do tablet de
  palco no session); o limiter inline do `/api/proxy` (terceiro sistema,
  achado do pre-check) migra para cá; aposentadoria do `lib/rate-limit.ts`
  (buckets **globais compartilhados por IP** entre rotas strict/default —
  pior que o registrado) e limpeza das ~300 linhas aspiracionais do
  `lib/rate-limiter.ts` (morre inteiro — núcleo novo em
  `lib/user-rate-limit.ts`, decisão do desenho). Gates: G2 (uso real +
  estouro deliberado com assinatura `X-RateLimit-Scope` e **guarda
  anti-prod no spec**) e G3 (rl-0 parte B endurecido com session
  **dentro** do assert — controle negativo: pré-B1.3 falha com o padrão
  do dossiê).
  **Janelas do sistema único (aprovadas no desenho, 2026-08-21) — chave
  user salvo indicação:**
  | Família | Janela | Racional |
  |---|---|---|
  | session POST | 120/15min | caso dimensionante: visibilitychange do tablet (dossiê de 6 medições: 7-11 POSTs/12 navegações); 8/min sustentado ≈ 8× o pior show real; ainda barra loop doente |
  | session POST token inválido | ip 10/15min | brute force; falha legítima é rara |
  | session DELETE | ip 30/15min | logout com token morto deve funcionar |
  | auth falhada (funis) | ip 30/5min | deny-fast sem verificar; corta trabalho e oráculo |
  | leitura (content/setlists GET) | 300/min | performance mode nunca engasga |
  | mutação (POST/PUT/DELETE/PATCH) | 120/15min | montagem de setlist de 56 canções (o caso que o antigo matou: 18/56 perdidas) cabe 2× |
  | profile | 60/15min | 1× por load + retry; o 25/min compartilhado era o próximo BOUNCE |
  | storage (upload/delete) | 60/h | subir um repertório numa sessão |
  | proxy | 120/min | biblioteca cheia busca dezenas de assets/load |
  | health | ip 120/min | pública; "sem credencial ≠ sem limite" sem exceções |

  **Nota de arquitetura (aceita por desenho)**: store em memória por
  instância de lambda ⇒ janelas independentes por instância; teto efetivo
  = limite × instâncias (só afrouxa). Redis registrado como evolução
  multiusuário.
**BALANÇO DO B1 (2026-08-14 → 2026-08-23, PRs #227-#232) — o arco
completo, para a posteridade:**
- **De onde partiu**: 63% de 429 em 371 POSTs de session; rate limiter
  por IP com buckets compartilhados no caminho crítico de TODO server
  component; self-fetch HTTP de verificação em três consumidores; 4 de 8
  páginas protegidas sem verificação server nenhuma; rota de gestão de
  usuários Firebase sem claim de admin ao vivo; oráculo público de env;
  CI vermelho havia mais de um ano.
- **Onde chegou**: UM sistema de rate limiting com chave por uid
  pós-auth e 429 estruturada; ZERO self-fetch (verificação é chamada
  local em lambdas e páginas; middleware otimista barato); 8/8 páginas
  verificando E expulsando com o invariante congelado em gate; superfície
  reduzida (verify, auth/user, test-setlists, firebase-config
  eliminadas); NEXTAUTH_URL morta com zero leitores; CI integralmente
  verde como gate definitivo (2-3min); **seis famílias de gates
  permanentes** (G1 espião de fetch · G2 assinatura do limiter com guarda
  anti-prod · G3 navegação limpa com session no assert · G-rotas
  enforcement · rl-0 parte B · gates da fila A), todos provados pela
  regra nº 7 com controles negativos executados e registrados.
- **O relógio**: navegação de validação 2.7min → 50s (B1.1, self-fetch
  morto) → 39.9s (B1.2b, middleware sem verificação). O probe de session
  que achava 429 na 6ª tentativa fecha em 8/8×200.
- **Fica para depois**: B1.5 (fusão de cadeias, abaixo) · B2 (audit Zod
  — próximo da sequência) · B3 (contrato de erro — a 429 estruturada do
  B1.3 já é a semente) · B9 (idempotência do POST /api/content).

- **B1.5 (item próprio, fora do B1)** — unificação das duas cadeias de
  verificação (`firebase-server-utils` cache 1h × `secure-auth-utils`
  cache 5min/blacklist/sessões). Racional de adiar: fundir caches e
  blacklist é diff grande em superfície sensível que **não bloqueia o
  nativo**; o B1 troca só o transporte das duas, sem fusão.
  **Bloco C (C-D1, 2026-09-04)**: confirmado como *desejável, não
  bloqueador* — as 5 leituras da tela 1 estão todas na cadeia A; vai
  para a **fila da tela 2**. Insumos medidos para o desenho
  (C-PRECHECK §1.4): as cadeias divergem em email verificado, tolerância
  do header e TTL (1h × 5min); o cache da cadeia A é por string de token
  sem olhar o `exp` do JWT + fallback a cache vencido → vida efetiva do
  idToken no servidor até ~2h; a fusão decide se o cache passa a
  respeitar o `exp`.

### B2 — Audit schema Zod × payload real, rota a rota

Três casos **provados** do mesmo defeito — o schema foi escrito sem olhar o
payload que o próprio cliente envia:

| Caso | O que aconteceu | Estado |
|------|-----------------|--------|
| **profile** | `authSchemas.profileUpdate` validava campos inexistentes (`displayName`/`preferences`); o payload real do signup era descartado pelo strip do Zod — usuário Firebase órfão sem perfil | corrigido (commit `aa501cc`) — prova da classe |
| **SET-01** | `venue`/`performance_date`/`notes` enviados pela UI, silenciosamente descartados pelo strip | ✅ **fechado no B2** (PR #240 — schema + handler, create e update, date-only) |
| **SET-23 / FASE-D-05** | `description: null` da UI rejeitado por `.optional()` (aceita só `undefined`) — 400 sem feedback | ✅ corrigido na fila A #2 (PR #222); a classe permanece |
| **`file_url` do add-content** *(direção inversa: payload que o schema **rejeita**, não que ele stripa)* | `createContentSchema` declara `file_url: z.string().url()`, mas o branch de upload envia `uploadedFile.url ?? uploadedFile.name` — se o upload falhar e sobrar o **nome do arquivo**, o POST leva 400 | ✅ **fechado no B2** (PR #238 — fallback morto removido; contrato declara URL-ou-null) |

**Tarefa**: inventário rota a rota — payload real (da UI atual **e** do
futuro cliente nativo) × schema — decidindo por campo: aceitar, rejeitar
com erro claro, ou remover do produto. Política explícita sobre strip
silencioso (hoje é o default do Zod e já causou dois S1). Entregável:
tabela rota × campo × comportamento + testes de contrato. Este audit é
**pré-requisito da espec da API que o nativo consome**.

**BALANÇO DO B2 (2026-08-24 → 2026-08-27, PRs #233–#241 + MIG-1) —
✅ COMPLETO. O arco inteiro, para a posteridade:**

Ciclo completo com gate-keeping total: pre-check medido
([`B2-PRECHECK.md`](B2-PRECHECK.md)) → desenho aprovado
([`B2-DESENHO.md`](B2-DESENHO.md), com fatiamento da PR-4 decidido em
revisão) → 9 PRs, uma por vez, cada uma com controle negativo executado
(regra nº 7), validação em preview e confirmação em prod.

**1. Sumário executivo — as PRs, na ordem de execução:**

| PR | # | Uma linha |
|----|---|-----------|
| PR-0 | #233 | Infra: dump gerado (`schema.dump.sql`) substitui `schema.sql`/`rls-policies.sql` à mão (10 drifts D-1…D-10); scripts `db:types`/`db:dump`; enum falso do CLAUDE.md corrigido |
| PR-2 | #234 | Types gerados como fonte única (D9): `types/supabase.ts` morre sem shim; 10 `as any` + 1 `@ts-expect-error` removidos — 4 erros de tsc desmascarados, todos corrigidos sem cast novo |
| PR-1 | #235 | Os dois S1 de perfil (D8): `website:""` → 400 e login social com nulls → usuário órfão, mortos; política D1 estreia (`withIgnoredKeys` + `.strict()`, handlers enumeram) |
| PR-3 | #236 | Remoções: PUT órfão de `/api/content/[id]` (a4/b4/b5/c1 de uma vez) e `validate-token` (pública, sem rate limit, zero refs) |
| PR-4a | #237 | SAN-01: sanitizer valida, nunca altera — literal ou 400 nomeando o campo; XSS que virava `""` com 200 agora é 400 de verdade |
| PR-4b | #238 | Módulo único content+storage: enum canônico (D4, zero migration — 194 linhas todas no enum), limites do dump, UMA lista de MIME (b8), b6 removido |
| PR-4c | #239 | Setlist+session no módulo; middleware vira middleware-only (532→245); −1009 linhas de órfãos (`input-sanitizer`, `validation-schemas`, 8 schemas) |
| MIG-1 | SQL Editor (Marcel) | Bis liberado (drop de `setlist_songs_setlist_id_content_id_key`; 201/201 provado, antes 500 SET-06) + RLS/REVOKE em `annotations` (anon → 401) |
| PR-5 | #240 | SET-01 fechado dos dois lados; `performance_date` date-only (SET-17 fora do contrato); `songs[]` real no create (D2, opção B com delete compensatório TESTADO por mutação); `updated_at` do pai; fix do NaN |
| PR-6 | #241 | Zod na última rota sem schema (reorder): b7 morto (`newPosition: 0` → 400 nomeado "1-based"; string → 400) |

**Achados novos do ciclo (não estavam no pre-check) e onde cada um morreu:**

| Achado | Descoberto em | Morreu em |
|--------|--------------|-----------|
| **SAN-01** — sanitizer zerava strings com `()[]{};&\|` retornando 200 (strict) ou removia os chars (moderate); XSS idem; `lastIndex` de `/g` tornava o veredito dependente da ordem | validação em preview da PR-1 | PR-4a (semântica) + PR-4c (arquivo) |
| **Triggers inexistentes** — os 4 triggers + function de `updated_at` declarados no `schema.sql` nunca existiram no banco; add/remove/reorder não tocavam `setlists.updated_at` | leitura do dump (desenho §0.3) | PR-5/5c (bump nos 3 handlers) |
| **RLS de `annotations`** — tabela world-writable pela anon key pública (sem RLS, `GRANT ALL TO anon`) | leitura do dump (desenho §0.4) | MIG-1 parte B |
| **c1 re-medido** — o "título 300 → 500" era do PUT `[id]`; o create vivo rejeitava (máx 200). Correção declarada no enunciado | medição pré-PR-4b | PR-3 (rota) + gate de drift (classe) |
| **NaN do addSong** — `position` ausente (válido pelo schema desde sempre) → `Math.max(undefined,…)` → 500 na 1ª inserção | verificação pós-MIG-1 | PR-5 (ausente → max+1) |
| **unrecognized_keys com `path: []`** — `field` vazio no 400 de chave desconhecida | validação da PR-1 | herança nomeada do B3 (abaixo) |

**2. Contrato pós-B2 (o que o cliente nativo consome)** — a tabela
completa vive no [`B2-DESENHO.md`](B2-DESENHO.md) §4; o que mudou em voo:

- **Toda chave desconhecida no body → 400** (gate D1 §3.3, comportamental,
  sobre os 11 schemas de body do módulo). Schemas de query fora por
  decisão declarada (cachebuster/utm não pode dar 400).
- **Listas de ignorados por rota, com comentário no schema**: content
  (`user_id`/`created_at`/`updated_at`) · profile (`id`/`email`) ·
  setlists (lista VAZIA — os três fantasma entraram no contrato na PR-5).
- **Exceção D1 declarada**: `addSong.position` é SUGESTÃO que o servidor
  recalcula (comentário no schema; semântica final pendente do **B6**);
  ausente/null → `max+1` (fix do NaN). Reorder é **1-based**
  (`newPosition ≥ 1`).
- **`performance_date` é date-only** (`YYYY-MM-DD`; timestamp → 400).
  `content_data` é objeto-ou-null no topo (D5 — batch morre com a web,
  comentário no schema impede "conserto" acidental).
- **Shape de erro de validação**: `400 { error, code: 'VALIDATION_ERROR',
  details: [{ field, message, code }] }` — usado por TODAS as rotas com
  body, inclusive o reorder (fora do middleware). É **a semente do B3**.

**3. Heranças nomeadas, com evidência:**

- **B3** (contrato de erro): o shape `VALIDATION_ERROR + field` está
  uniforme na validação; 401/403/404/500 ainda variam por rota;
  `unrecognized_keys` tem `path: []` → mapear `field` a partir de
  `issue.keys` (registrado no desenho, herança do B3).
- **B6** (position/reorder): semântica da `position` do addSong (exceção
  D1 comentada no schema) · 2N UPDATEs sem transação · `tempOffset=10000`
  (a UNIQUE de posição FICA — verificada no dump pós-MIG-1).
- **B5** (storage): listagem por prefixo, reconciliação de órfãos, magic
  bytes (`.zip` renomeado `.pdf` com MIME certo ainda passa — declarado);
  a rota `POST /api/storage/delete` teve o **primeiro uso real provado**
  no cleanup da PR-4b (200×2).
- **B9**: idempotência do `POST /api/content` (replay da fila offline).
- **Bloco C**: forma interna de `content_data` · anotações **greenfield**
  (tabela com 0 linhas, medido; agora com RLS) · off-by-one de RENDER do
  `performance_date` (o contrato entrega date-only; a exibição web faz
  `new Date()` — morre com a web).

**4. Gates permanentes ao fim do bloco** (todos no `pnpm test`, que é
gate de merge):

- **Contract tests por módulo**: `contract-profile` (10) ·
  `contract-sanitize` (13, com os 3 de caixa) · `contract-content` (22) ·
  `contract-storage` (12) · `contract-setlist` (19) ·
  `create-compensating` (3, provado por mutação) — todos com controles
  negativos medidos documentados nos próprios arquivos.
- **Gate D1** (`contract-d1-gate`): chave desconhecida → falha, nos 11
  schemas de body; controle negativo permanente no arquivo.
- **Gate de drift** (`contract-drift`): Zod ≤ varchar da coluna
  (content, profiles, setlists), limites hardcoded do dump.
- **Baseline da suíte**: **511 passed** / 87 skipped (era 412 no início
  do bloco; +99, todos de contrato) — CI 2m40s–3m.

**Fica para depois**: B3 (próximo natural — a semente está pronta) · B5 ·
B6 · B9 · B1.5 · Bloco C.

### B3 — Contrato de erro: toda falha retorna erro estruturado

**Motivação medida**: as **7 falhas silenciosas** do padrão nº 1 do
ASSESSMENT — em três delas o app ainda afirmou sucesso. A causa não é
local: não existe camada que traduza falha em mensagem.

**Espec proposta**:
- Toda resposta não-2xx carrega corpo estruturado **flat**: `{ error,
  code, details? }` — **[EMENDADO 2026-08-28, aval do pre-check do B3]**:
  a espec original dizia `{ error: { code, message, details? } }`
  (nested), escrita antes de o B2 cravar o shape flat como semente
  testada; o flat estende a semente sem quebrar gate nem cliente.
  Contrato completo: [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md).
- O cliente nativo nasce com a regra inversa da web atual: **toda não-2xx
  aparece para o usuário por default** (camada de rede central; silenciar é
  opt-out consciente, não o esquecimento padrão).
- 429 inclui `Retry-After`; 4xx de validação inclui o campo ofensor.
- As mensagens são dados de UI: o nativo exibe em pt-BR (GLOB-01), então
  `code` importa mais que `message`.

### B4 — Storage: listagem e reconciliação de órfãos (ADD-15 / FASE-D-04)

> **⚠️ Nota de rotulagem (B5 PR-0, 2026-08-30)**: este é o bloco
> executado sob o nome **B5** desde o balanço do B2 (pre-check em
> [`B5-PRECHECK.md`](B5-PRECHECK.md), desenho em
> [`B5-DESENHO.md`](B5-DESENHO.md)). O número de seção "B4" é histórico
> e não será reusado. Escopo fixado pela decisão **B5-D1**: storage
> apenas.

A API expõe só `upload` e `delete` por nome exato — **não há listagem do
bucket**. Todo fluxo de import que morre entre upload e criação do content
(exatamente o que ADD-01/ADD-02 produzem) vaza um arquivo **irrecuperável**.
O cleanup do audit só funcionou porque instrumentou os nomes no momento do
upload.

**Tarefa**: endpoint de listagem por prefixo do usuário + rotina de
reconciliação (arquivo sem linha de `content` correspondente → candidato a
órfão, com idade mínima antes de remover). **Extra do mesmo pacote**: a
validação de upload compara extensão com o MIME *declarado pelo cliente*
(item 45b: `.zip` renomeado `.pdf` é aceito) — adicionar checagem de magic
bytes server-side. O nativo herda esse endpoint tal como está.

### B5 — Decisões de dados (✅ decididas em 2026-08-10)

> **⚠️ Nota de rotulagem (B5 PR-0, 2026-08-30)**: as decisões desta
> seção estão encerradas desde 2026-08-10; o NOME "B5" passou a
> designar o bloco de storage (seção acima). A única tarefa em aberto
> aqui — **busca (LIB-04)** — sai para bloco próprio (ver **B11**),
> por decisão **B5-D1**.

| Decisão | Estado provado | **Decisão do Marcel** |
|---------|----------------|-----------------------|
| **Bis**: constraint única `(setlist_id, content_id)` | Existe no banco vivo (probe: 500 na duplicata — SET-06). Bis é **requisito do nativo** (Bloco C). | ✅ **Remover a constraint** — repetição permitida; unicidade da linha passa a ser lógica de posição. Tarefa: migration de drop + revisar o DELETE/reorder que assumam unicidade por `content_id`. |
| **Tabela/campo de anotações** | ~~write-only desde sempre~~ → **corrigido pelo pre-check do B2 (2026-08-24): a tabela `annotations` é "nunca-escrita" — 0 linhas (medido) e zero leitores/escritores no repositório** (nenhum `.from('annotations')`, nenhuma rota). As anotações sempre viveram em `content.content_data.annotations`. O achado do item 32 ("gravada via API não renderiza") referia-se ao JSONB, não à tabela. | ✅ **Mantida** (não dropar) — anotação é requisito do nativo (J2). A **decisão final de modelo de dados** (tabela `annotations` vs. JSONB em `content_data`; âncora por trecho/página) fica para o design do nativo — e é **greenfield**: não há dado a migrar. Até lá: nada de escrita nova, nada de drop. RLS ligada + grants públicos revogados na MIG-1 do B2 (achado §0.4 do desenho). |
| **Colunas `venue` / `performance_date` / `notes`** | UI envia, Zod descarta (SET-01); colunas existem sem uso real. | ✅ **Ligar de verdade, via B2**: o audit de schema (B2) inclui aceitar e persistir os três campos no contrato de setlists. A UI web não muda; o nativo já nasce lendo/escrevendo. |
| **Semântica de `performance_date`** | Off-by-one de fuso no parse UTC (SET-17). | ✅ **Date-only**: data local sem componente de hora/fuso, no contrato e na exibição. Elimina o SET-17 por definição. |
| **Busca com acento/typo** (LIB-04) | `aguas` → 0, `Águas` → 2 (item 25). A busca é `ILIKE` no Postgres; o nativo herda `GET /api/content?search=`. | → **movida para o B11** (bloco próprio; decisão **B5-D1**, 2026-08-29 — texto da tarefa vive lá) |

### B11 — Busca (LIB-04) — bloco próprio, não desenhado

> Criado no B5 PR-0 (decisões **B5-D1** e **B5-D8**, 2026-08-29/30): a
> busca saiu do guarda-chuva "B5" e vira bloco próprio. Nada aqui foi
> desenhado nem medido — o texto abaixo é a tarefa herdada da tabela de
> decisões de dados (ex-B5, seção acima), movida verbatim.

**Tarefa herdada** (LIB-04, S2): `aguas` → 0, `Águas` → 2 (item 25). A
busca é `ILIKE` no Postgres; o nativo herda `GET /api/content?search=`.
`unaccent` no mínimo; `pg_trgm` se quiser tolerância a typo. Corrigir no
backend serve web e nativo de uma vez.

> **Bloco C (C-D3, 2026-09-04)**: o nativo busca **client-side** sobre o
> cache local (66 itens / 19.481 B de corpos medidos; normalização NFD
> no cliente) — o B11 **sai do caminho do nativo** e passa a servir só o
> web. Tolerância a typo no nativo é backlog do índice local, não deste
> item.

### B6 — Position e reorder: contrato para o nativo

> **✅ B6 ENCERRADO (2026-09-01** — [`B6-ENCERRAMENTO.md`](B6-ENCERRAMENTO.md);
> pre-check + desenho em 5 revisões + PRs #253–#258 + migração
> `20260901102108` aplicada em prod**)**: invariante contíguo 1..N virou
> CONTRATO ([`docs/api/SETLISTS.md`](../api/SETLISTS.md)) com os 4
> escritores em RPCs transacionais sob o lock da linha-pai; reorder em
> LOTE (`PUT /api/setlists/[id]/songs/order`) no lugar do move-one
> (removido); addSong append-only (gap morto); delete de content
> renumera; D5′ (paridade upload→delete), D7 (WITH CHECK ×4) e o N+1
> do GET (7→1, byte-idêntico) foram junto. O endpoint atômico previsto
> abaixo existe — com payload de permutação exata, não de "array
> ordenado" ingênuo; a incógnita do item 17 foi respondida por medição
> (K=6 no move-one em prod: 4/6×500). **Fila após o B6**: **B9**
> (idempotência + revogação do bypass — candidato natural) · B1.5 ·
> B11 (aguarda PRD) · D8 abre o Bloco D. Texto abaixo mantido como
> histórico.

O insert de músicas **ignora a `position` do payload** e calcula a sua
(item 21 — a linha enviada com `position: 1` voltou com `11`). E o reorder
atual são 2N UPDATEs sem transação (SET-07). Como o reorder é requisito do
nativo (J3) e o handler web será religado (A#6):

**Tarefa**: contratar um **endpoint de reorder atômico** — `PUT
/api/setlists/[id]/order` recebendo o array ordenado de IDs, aplicado em
transação única server-side. Documentar que o insert não aceita `position`
(ou passar a aceitar — decidir). A constraint `(setlist_id, position)` NÃO
existe no banco vivo (item 21), o que reduz o risco da transição.

**Pergunta de design herdada do recorte da fila A (2026-08-10)**: SET-03/04
foram cortados — o reorder web nunca será religado, e o **item 17 do
RESULTS permanece sem medição**: latência real dos 2N UPDATEs na setlist
de 60 e o risco de posições 10000+ persistidas em interrupção no meio da
fase 1. O endpoint atômico do nativo deve ser desenhado assumindo que
esses números **não são conhecidos** — a transação única elimina as duas
incógnitas por construção.

### B7 — Contratos menores que o nativo herda

- **Auth do cliente nativo**: os probes da Fase D já autenticaram por
  `Authorization: Bearer <idToken>` com sucesso — o caminho existe.
  Documentar como contrato oficial (o cookie de sessão é mecânica exclusiva
  da web; AUTH-02 morre com ela). O nativo usa o SDK do Firebase com refresh
  automático — o problema "cookie de 7 dias com idToken de 1 h" não se
  transfere. **Bloco C (2026-09-04)**: medido em prod — bearer sem cookie
  → 200 byte-idêntico ao cookie (C-PRECHECK B.2 P2/P3×P2); o próprio web
  já é bearer-first em 18 fetches (divergência 3 da Fase A). O contrato
  escrito ainda não existe: **tarefa de doc**, base = PRD §3 (header
  exato, prefixo `Bearer ` literal — cadeia A é case-sensitive —, refresh
  com buffer < 5 min, 401 sem retry com o mesmo token, lista das rotas que
  exigem email verificado). Classificado, não agendado.
- **Payload de leitura de setlists** (SET-22): o GET embute `content_data`
  integral de cada música (N+1 + payload gordo). Em rede celular isso vira
  latência e dado móvel. Contratar shape de listagem enxuto + conteúdo sob
  demanda (que é também o shape que o cache offline do nativo vai querer).
  **Bloco C (C-D4)**: rebaixado a **otimização** — o nativo descarta o
  `content_data` embutido (21.423 B dos 49.983 B da listagem, C-PRECHECK
  B.4) e lê o corpo só do cache de content; a listagem inteira custa
  ~50 KB hoje. Reabrir quando pesar.

#### Herança do Bloco C para o Bloco B (classificada, não agendada — PRD §11)

| Item | Origem | Classe |
|---|---|---|
| `Cache-Control: private` ou `no-store` emitido pelas rotas de `/api/*` — hoje `public, max-age=0, must-revalidate` em 10/10 respostas medidas; o `no-store` de `lib/security-headers.ts:256` não chega porque o middleware exclui `/api` | C-PRECHECK B.5 achado 1 | higiene de contrato (ponto único: `lib/api-errors.ts` + `NextResponse.json` das rotas) |
| Zod de `content_data` por `content_type` na escrita (`Lyrics→{lyrics}`, `Chords→{chords}`, `Tab→{tablature}`, `Sheet→null`+`file_url`; `annotations` fora) — hoje `z.record(jsonValueSchema).nullish()` | C-D7; C-PRECHECK §2.6, B.3 | contrato (mini-item; não pré-requisito da tela 1) |
| **Desempate por `id` no `order` do `GET /api/content`** — o handler ordena só por `created_at desc` (`app/api/content/route.ts:105-113`); dois itens com o mesmo `created_at` têm ordem não garantida entre páginas | PRD nota N6 | contrato de paginação (mini-item; o nativo mitiga com dedupe por `id`, T1-R9b) |
| Remoção de `GET /api/debug/config` (sem auth; 404 só por `NODE_ENV`) | C-PRECHECK Fase A div. 4 | superfície (classe da B1.0) |
| `docs/api/STORAGE.md` diz "Bearer" no upload onde a rota aceita bearer OU cookie e exige email verificado | div. 5 | doc (junto do contrato de auth B7) |
| `types/setlist.ts:40 event_date` (coluna inexistente, sem consumidor) | div. 6 | dead code |
| `lib/api-schemas.ts:34 commonSchemas.contentType` (enum falso, sem consumidor) | div. 7 | dead code |
| `scripts/ux-audit/auth.ts:109` comentário stale ("5 req / 15 min") | div. 8 | doc |
| Policies de `storage.objects`/`storage.buckets` não versionadas (o `db:dump` é `-s public`) | div. 1 | versionamento (só se o storage mudar de contrato) |

### B10 — Restrição de referrer da API key (endurecimento opcional, com calma)

Se adotada, a allowlist é **desenhada de uma vez**: `octavia.rocks/*`,
`www.octavia.rocks/*` (se aplicável) e `octavia-preview.vercel.app/*` —
mais a **decisão sobre o caso sem-referer** do tooling (enviar `Referer`
nas chamadas Node de `scripts/ux-audit/auth.ts`). **Nunca ativar
parcialmente**: foi assim que o incidente de 2026-08-11 (registrado na
seção de execução) bloqueou produção. A web API key do Firebase é pública
por construção — a proteção real está nas Security Rules e no backend —,
então isto é endurecimento, não correção de vulnerabilidade.

### B9 — Idempotência do `POST /api/content` (chave de idempotência)

**Achado durante o pre-check da PR-3 (2026-08-10)**: `createContent`
([`lib/content-service.ts`](../../lib/content-service.ts)) enfileira a
requisição (`enqueueRequest`) quando falha com `navigator.onLine === false`, e
a fila é reprocessada depois. Se o POST **chegou ao servidor** mas a resposta
se perdeu, o replay cria uma **segunda linha** — foi o cenário do **item 43**
da Fase D (2 linhas com 41 ms de diferença, medidas offline).

**Consequência declarada**: a guarda de in-flight da fila A #4 (ADD-14) cobre
a duplicata **por clique, online** — e só. O replay offline continua
duplicando, e nenhuma correção de UI o resolve.

**⚠️ Reprodução documentada em prod, PÓS-fix de UI (2026-08-11)**: a rodada
de confirmação do item 43 deixou **2 linhas no servidor com o título
digitado** (portanto criadas depois do fix, não resquício da Fase D)
enquanto o cliente exibia `"Failed to fetch"`. B9 **não é teórico** — o
cliente vê erro e o servidor tem duas linhas. As linhas foram removidas na
higiene da rodada.

**Tarefa**: chave de idempotência no `POST /api/content` (header
`Idempotency-Key` gerado no cliente por tentativa de save, com dedupe
server-side por janela), aplicável também às demais escritas enfileiráveis.
O cliente nativo herda o mesmo contrato — e a fila de escrita offline é
**requisito do J6** no Bloco C, então isto é pré-requisito dela.
**Bloco C (C-D4, 2026-09-04)**: a tela 1 é somente leitura e **não tem
fila de escrita** — o B9 **não bloqueia a tela 1**; é pré-requisito da
**tela 2** (a chave de idempotência nasce junto do primeiro POST do
nativo). Fila da tela 2.

### B8 — Housekeeping de pipeline: passivo de tipos dos testes (rastreio obrigatório)

Descoberto ao executar a fila A (2026-08-10): o `next build` type-checka os
arquivos de teste e o main acumulou **166 erros de tipo em 24 arquivos —
todos de teste, zero em código de app** — quebrando build e deploy (CI
vermelho desde 24/07; Vercel sem deploy verde desde os specs da Fase D).
Destravamento aprovado (PR de infra): `exclude` dos testes no tsconfig
raiz + `tsconfig.test.json` + etapa **separada e informativa** de CI para
o type-check dos testes.

**Item de rastreio**: a etapa informativa só existe legitimamente com
prazo de vida — **zerar os 166 erros** (baseline registrado em
2026-08-10) **e promover a etapa de informativa a bloqueante**. Candidato
a lote/workflow; entra junto do housekeeping do Bloco B, antes do
desenvolvimento nativo ganhar ritmo.

**Item irmão — suíte E2E do CI vermelha: REMOVIDO na B1.0.1
(2026-08-14)**. Era: `tests/e2e/basic.spec.ts` falhando nos 3 browsers
(webkit não lança no runner, firefox timeout de navegação, chromium teste
de estado de auth) — pré-existente desde antes do audit; a premissa
original era "diagnosticar e reativar como gate bloqueante". Racional da
remoção: (1) vermelha desde julho/2025 — mais de um ano sem proteger
nada, com cada PR pagando pedágio de comparação de conjuntos de falha
para provar que não ampliou o que já não funcionava; (2) a premissa da
reativação morreu com a decisão do nativo — a UI que ela testava está
condenada, e webkit/firefox no runner são irrelevantes para React
Native; (3) **distinção registrada**: isso NÃO toca os gates do ux-audit
(rl-0, set23, add13-14, cont01-02, set14, perf02 e os futuros G1-G3 do
B1) — Chromium, sob demanda, todos provados pela regra nº 7. Eles são a
cobertura de fluxo dos contratos que o nativo herda e PERMANECEM; depois,
a cobertura passa à suíte do nativo. Morreu a suíte morta; ficam os
gates vivos.

**Gate definitivo de merge** (regra escrita, válida para todas as PRs;
promovido de provisório a definitivo na B1.0.1 com a remoção da suíte
E2E do CI): **Vercel preview ✅ + Lint ✅ + type-check ✅ + unit tests ✅ +
coverage ✅ + Build ✅** — CI integralmente verde, sem cláusula de
falha herdada.

---

## Bloco C — Corpus de requisitos do app nativo

> **✅ Bloco C ENCERRADO (2026-09-04** — [`C-ENCERRAMENTO.md`](C-ENCERRAMENTO.md);
> pre-check [`C-PRECHECK.md`](C-PRECHECK.md) commitado direto na main
> (`bba5b2e`, C-D8) + PRD da tela 1 em PR #260 (merge `922469e`)**)**:
> a tela 1 do nativo (modo performance + setlists, somente leitura) tem
> PRD em [`docs/native/PRD-TELA-1.md`](../native/PRD-TELA-1.md) — 38
> requisitos `T1-R1…R37`+`R9b` com aceite verificável, 22 critérios
> `A1–A22`, decisões **C-D1…C-D8** (bearer exclusivo; bucket público;
> busca local; corpo sempre do cache de content; cascata → tela 2; sync
> ao abrir + prefetch 7 dias; contrato de `content_data` por tipo;
> pre-check docs-only na main), hipóteses H8–H18 com dono. Medido em
> prod: bearer sem cookie → 200 byte-idêntico ao cookie; **zero mudança
> de backend necessária** para a tela 1. Backlog do PRD §11 transposto
> para o Bloco B ("Herança do Bloco C", abaixo), B1.5, B9, B11 e
> Sequência. Texto abaixo (C1–C4) mantido como corpus.

Não é fila de fixes: é o que o assessment **produziu como espec**. O time
(de um) que desenhar o nativo parte daqui.

### C1 — JOBS.md é o PRD

[`JOBS.md`](JOBS.md) descreve os 6 jobs com pesos (J1 40% · J3/J5/J6 15% ·
J4 10% · J2 5%), alvos de taps/tempo por passo e a regra de veto (S1 em
J1/J6 fura qualquer fila). Vale como está para o nativo, com uma revisão a
fazer: os alvos marcados ⚠️ eram propostas — a Fase D os calibrou com
números reais (abaixo). Os anti-jobs do fim do arquivo (multiusuário,
onboarding, descobribilidade) continuam fora de escopo.

### C2 — Baseline a superar (medições da Fase D)

A tabela completa está em [`fase-d/RESULTS.md`](fase-d/RESULTS.md)
§ "Medições dos jobs vs. alvos". Regra para o nativo: **igualar ou superar
cada ✅ e fechar cada ❌/⚠️**. Os números que definem o piso:

| O que a web já entrega (não regredir) | Medido |
|----------------------------------------|--------|
| App aberto → 1ª música em tela cheia | 3 taps, 5,4 s |
| Troca de música no palco | 46–126 ms |
| Play/pause | 41–57 ms |
| Dark sheet e zoom | 1 tap cada |
| Picker de músicas para setlist | 2,2 taps/música, sem sair da tela |
| Busca do dashboard ao resultado | 3 taps, 1,5 s |
| Viewer → palco | 1 tap, 820 ms |
| Scroll de setlist com 60 itens | 60 fps cravado, sem virtualização |
| Offline: dashboard completo, deep link de setlist, conteúdo textual **por atacado** (até setlist nunca visitada — item 9) | funciona |

| O que a web nunca entregou (fechar no nativo) | Referência |
|------------------------------------------------|------------|
| Abertura fria dentro de 10 s (web: 10,3 s só de landing) | item 1 |
| PDF no palco (bloqueado por CSP até o fix A#1) | item 4 |
| Anotação criável e **renderizada no palco** | item 32, CONT-03 |
| Criar setlist em ≤3 taps com feedback de erro | item 16 |
| Tom na listagem da setlist | SET-08 |
| Reorder operável em touch | item 18 |
| Setlist 50+ sem perda silenciosa | item 13 |
| Import ≤8 taps com metadados persistidos | item 42 |
| Busca tolerante a acento/typo | item 25 (B5) |
| Busca de dentro do palco ("toca aquela!") | item 26 |
| Posição na setlist ("4 de 12") e salto direto ≤3 taps | PERF-05/06, J2 |
| Offline: listagem de setlists pela navegação normal | item 10 |

### C3 — Anti-padrões comprovados (não repetir no nativo)

1. **Falha silenciosa como default** — 7 manifestações medidas (tabela no
   ASSESSMENT § padrão 1; três afirmando sucesso na falha). Regra nativa:
   camada de rede central onde **toda falha aparece por default** (B3).
2. **Feature com UI presente e fio desligado** — SET-03 (reorder TODO),
   CONT-04/05 (edit/favorito), DASH-01, PERF-12, ADD-02. Regra: UI só
   entra quando o fio existe; feature flag em vez de botão morto.
3. **Alvos <48 px e affordance por hover em touch** — SET-12 (28 px,
   `opacity: 0` permanente em touch), PERF-04 (36 px no palco), PERF-06
   (dots de 8 px), dots com passo de 12 px na setlist de 60. Regra: alvo
   mínimo 48 px; nenhuma função exclusiva de hover; palco operável às cegas.
4. **Segurança/validação aplicada sobre domínio, quebrando o domínio** —
   SET-01/SET-23 (schema × payload), SET-02 (sanitizador zera "Show (Bar
   do Zé)"), PERF-02 (CSP proíbe a própria feature), RATE-01 (limiter
   punindo uso normal). Regra: toda política de segurança é testada contra
   os fluxos reais do produto antes de ir a prod.
5. **Validação sem feedback** — ADD-12 (arquivo descartado mudo), ADD-08
   (4 de 5 arquivos ignorados), ADD-07 (413 mudo), AUTH-04 (só balão
   nativo). Regra: toda rejeição de input diz o quê e por quê, na língua
   do usuário.
6. **Dados fabricados exibidos como reais** — SET-13 (duração
   `(bpm/60)*3`), CONT-07 (acordes/tab de fallback). Regra: dado ausente
   aparece como ausente.

### C4 — Requisitos que a web nunca entregou e o nativo deve entregar

- **Renderer do palco cobrindo TODOS os content types desde o design** —
  na web, **`ContentType.TAB` nunca renderizou no modo performance**:
  [`use-content-loading.ts`](../../hooks/use-content-loading.ts) carrega
  apenas `content_data.chords` e `.sections`, **nunca `.tablature`**, e o
  [`use-content-renderer.ts`](../../hooks/use-content-renderer.ts) para
  `TAB` só consulta esses dois campos → fallback *"No lyrics available for
  this song"*. **Fio desligado** (padrão nº 2), descoberto na validação da
  PR-6 em 2026-08-12. Evidência: `test.fixme` em
  `tests/ux-audit/fase-d/cont01-02-monoespacado.spec.ts`. **Decisão do
  Marcel (2026-08-12): nenhum trabalho na web** — tablatura é material de
  estudo, fora do palco, e o furo não intercepta o J1 do uso real. O
  nativo, porém, não pode nascer com um tipo de conteúdo mudo no palco.
- **Anotações renderizadas no palco** (J2; CONT-03): criável em ≤5 taps,
  visível no performance mode. Feature mantida (B5 decidido); o modelo de
  dados definitivo é do design nativo.
- **Busca dentro do performance mode** (J5; item 26): o cenário "toca
  aquela!" sem sair do palco — hoje custa 4 taps e perde o contexto da
  setlist ao voltar.
- **Wake lock nativo** (J1): dado do usuário registrado no fechamento —
  funciona em Android, **quebrado em Safari/iPadOS**. No nativo é trivial
  (`keepScreenOn` / `isIdleTimerDisabled`) e elimina a classe inteira,
  incluindo o toast que cobre controles (PERF-08).
- **Share target / import do WhatsApp** (J4; ADD-03): receber PDF pelo
  share sheet do SO — intent-filter (Android) + Share Extension (iOS).
  Era impossível no PWA.
- **Bis em setlist** (J3; SET-06): repetir música — desbloqueado: a
  constraint será removida (B5 decidido).
- **Import em lote** (J4; ADD-08): N arquivos → N itens numa passada.
- **Duplicar setlist** (J3; SET-15): gap previsto no próprio JOBS.md.
- **pt-BR desde o dia 1** (GLOB-01): a web nunca falou a língua do seu
  único usuário; o nativo nasce em pt-BR (e o contrato de erro B3 fornece
  `code`, não frase pronta em inglês).
- **Offline-first como contrato, não como acidente** (J6): a fundação
  atual **já é boa** — o comportamento medido no item 9 (conteúdo textual
  cacheado **por atacado**, setlist nunca visitada renderizando offline) é
  o piso a preservar. Somar: listagem offline (a falha do item 10),
  indicador "garantido offline" antes do show (ponto de observação do J6),
  e fila de escrita offline com feedback (critério do J6 nunca testado a
  fundo porque a web não tinha).
- **PDF no palco — caso menor, com due diligence na 1ª semana** (J1):
  premissa de repertório (decisão de 2026-08-13, ver seção de stack)
  rebaixou PDF de "requisito de primeira classe" para caso menor — a
  maioria absoluta do conteúdo é texto (cifras, letras, tabs); PDF
  ocasional com render simples é aceitável. Qualquer render nativo já
  elimina a classe PERF-02 (não há CSP/iframe fora do browser). **Item
  da primeira semana do nativo**: due diligence de PDF dentro do RN —
  renderizar um PDF com a lib padrão do ecossistema (`react-native-pdf`)
  em device real, ~meia hora. Não decide nada; só estabelece o teto
  cedo e evita surpresa.

---

## Bloco D — Morre com a web

> **Item de abertura do Bloco D — prioridade máxima (registrado no B3,
> 2026-08-28)**: o **loop mudo do `POST /api/auth/session`** — falha no
> set do cookie é engolida ([`firebase-session-cookies.ts:22`](../../lib/firebase-session-cookies.ts)
> → catch de [`firebase-auth-context.tsx:189`](../../contexts/firebase-auth-context.tsx),
> no-op em prod), o fetch de perfil é pulado e o middleware devolve o
> usuário a `/login` na navegação seguinte — "login OK → volta pro login"
> sem nenhuma mensagem. Evidência completa: [`B3-PRECHECK.md`](B3-PRECHECK.md) §3.
> Fora do escopo do B3 por decisão (D8); enquanto a web viver, qualquer
> trabalho de UI neste bloco começa aqui.

Achados que **não recebem fix nunca**: específicos de browser/PWA/CSP,
polish visual de uma UI cuja direção visual será substituída, e S3
cosmético. Um por linha, com a justificativa.

| ID | Justificativa (uma linha) |
|----|---------------------------|
| AUTH-02 | Mecânica de cookie/idToken é da sessão web; o nativo usa SDK com refresh — o contrato Bearer já existe (B7). |
| AUTH-04 | Balão de validação HTML5 é artefato de browser; forms nativos têm validação própria (regra C3-5 cobre a lição). |
| AUTH-05 | Nome acessível de select da UI atual; a11y do nativo nasce no design novo. |
| AUTH-06 | Botão invisível na CTA da landing — landing morre com o web app. |
| AUTH-07 | `autocomplete` de form web; no nativo o SDK/teclado resolve. |
| AUTH-08 | Landmarks são semântica de página web. |
| AUTH-09 | Inconsistência visual landing × auth — direção visual será outra. |
| AUTH-10 | Landing fictícia com links mortos — página de marketing web, fora do produto nativo. |
| AUTH-11 | Loading compartilhado entre botões de login da UI atual. |
| ADD-09 | Wizard que abre no passo errado — o fluxo de import será redesenhado no nativo (C4). |
| ADD-10 | Violações axe da tela atual. |
| ADD-11 | Três cores de "selecionado" — paleta morre com a direção visual. |
| DASH-02 | Falsa affordance dos stat cards — dashboard será redesenhado; lição registrada em C3-2. |
| DASH-03 | Abas Recent/Favorites redundantes — IA do nativo será outra. |
| DASH-05 | Stat cards consumindo a dobra mobile — layout da UI atual. |
| DASH-06 | Botão do shell sem nome — shell web. |
| DASH-07 | Contraste amber-600 — token da paleta atual. |
| DASH-08 | Switch sobre strings inexistentes nos ícones de tipo — componente da UI atual. |
| DASH-09 | Estrela emoji com CSS sem efeito — cosmético da UI atual. |
| DASH-10 | Três rótulos para importar — nomenclatura da UI atual. |
| DASH-11 | Estado vazio sem CTA — dashboard será redesenhado. |
| LIB-02 | Títulos longos escondendo ações — layout de linha da UI atual. |
| LIB-03 | Duplicados indistinguíveis na listagem — design de lista do nativo; a fonte de duplicatas some com A#4. |
| LIB-05 | Busca só no Enter com navegação de página — o padrão de busca do nativo será outro (critérios no J5). |
| LIB-06 | Filtro ativo invisível — UI de filtros será redesenhada. |
| LIB-07 | Scroll aninhado + paginação cortada — padrão de scroll é da UI web. |
| LIB-08 | Sem-resultados que não ecoa a query — critério do J5 já cobre o requisito no nativo. |
| LIB-09 | Card `role=button` com interativos aninhados — semântica DOM. |
| LIB-10 | Icon-only sem nome — a11y da UI atual. |
| LIB-11 | Contraste 2.62:1 — paleta atual. |
| LIB-12 | Headings h1→h3 — semântica de página web. |
| LIB-13 | CTA azul destoando do âmbar — paleta atual. |
| CONT-06 | PDF mobile com width 800 fixo — o viewer web morre; PDF nativo é requisito C4. |
| CONT-08 | Zoom/toolbar vestigial do viewer — viewer será redesenhado (zoom é critério do J1). |
| CONT-09 | Duplicatas indistinguíveis no viewer — idem LIB-03. |
| CONT-10 | Header inflado por título longo — layout da UI atual. |
| CONT-11 | 21 botões icon-only sem nome — a11y da UI atual. |
| CONT-12 | Foco de teclado no scroll do PDF — interação web. |
| SET-09 | Remover música recém-adicionada falha por IDs temporários — bug de estado do cliente web, que será reescrito. |
| SET-10 | Detalhe 342 px abaixo da dobra sem auto-scroll — layout mobile da UI atual. |
| SET-11 | Títulos truncados a ~4 chars — layout da UI atual. |
| SET-16 | Contraste dos CTAs azuis — paleta atual. |
| SET-18 | Painel "Select a setlist" no vazio mobile — layout da UI atual. |
| SET-19 | Ações do topo somem ao rolar — layout da UI atual. |
| SET-20 | Botão do shell sem nome (= DASH-06). |
| SET-21 | Página sem h1 — semântica de página web. |
| PERF-08 | Toast de wake lock cobrindo controles — o problema inteiro desaparece com wake lock nativo (C4). |
| SET-03 *(recorte da fila A)* | Reorder web nunca será religado — workaround manual (remover/re-adicionar) convive até o nativo; o reorder nativo nasce do endpoint atômico do B6. |
| SET-04 *(recorte da fila A)* | Drag touch morre com a UI web; o requisito de reorder operável em touch segue no C (J3) para o nativo. |
| AUTH-03 *(recorte da fila A)* | Desvio pela landing é cosmético frente ao uso real; morre com o web app. |
| PERF-07 *(recorte da fila A)* | "Go back" → about:blank é canto raro (deep link com histórico vazio); a navegação do palco nativo será outra. |
| DASH-04 *(recorte da fila A)* | 17 px de encobrimento no dashboard — cosmético; layout morre com a web. |
| PERF-11 | Botões do palco sem nome acessível — a11y da UI atual. |
| PERF-12 | Auto-hide pela metade (170 px fixos) — o palco nativo será redesenhado; lição em C3-2. |
| PERF-13 | Contraste #A69B8E no header do palco — paleta atual. |
| PERF-14 | Foco/landmarks do palco — semântica de página web. |

---

## Fechamento dos itens 7, 14 e 35 do RESULTS

Editado em [`fase-d/RESULTS.md`](fase-d/RESULTS.md) (placar e itens):
os três manual-pendentes foram fechados como **"N/A — decisão de
plataforma (migração nativa)"** — exigiam hardware real para validar
comportamentos de PWA/browser que não receberão fix:

- **Item 7** (foto vertical como partitura): o pipeline de imagem será o do
  app nativo; a pergunta migra como critério de import (C4).
- **Item 14** (popup do Google no PWA instalado): login nativo usa o SDK do
  Firebase, sem popup de browser.
- **Item 35** (wake lock em hardware): fechado com o **dado do usuário**
  registrado — funciona em Android, **quebrado em Safari/iPadOS**. Vira o
  requisito C4 de wake lock nativo. O PERF-08 (toast) já tinha evidência
  colateral no item 36.

O `MANUAL-CHECKLIST.md` permanece como registro dos procedimentos.

---

## Stack nativa — ✅ DECISÃO (2026-08-13): React Native / Expo

**Decidido pelo Marcel em 2026-08-13**: o nativo será **React
Native/Expo**, em **monorepo pnpm workspaces** com pacote compartilhado
(schemas Zod, types TS, hooks de lógica pura) entre web e nativo durante
a transição. **O spike de PDF está cancelado como gate decisório.**

### O que mudou: a premissa do PDF

O spike de 1 dia (renderizar o PDF de 12 páginas do seed com dark sheet +
zoom em iPad real) existia porque PDF era a **única capacidade onde React
Native tinha risco real frente ao Flutter** — a análise abaixo o tratava
como critério de maior peso. **Premissa nova, de repertório (decisão de
produto do Marcel)**: PDF é caso menor no palco — a maioria absoluta do
conteúdo é texto (cifras, letras, tabs). PDF ocasional com render simples
é aceitável; **não é critério de escolha de stack**.

### Racional da escolha

Sem o PDF na equação, React Native/Expo vence sem desafiante:

- **Reuso direto de schemas Zod, types TS e hooks de lógica pura** —
  exatamente os contratos que o Bloco B vai auditar (B2/B3). Em Flutter
  seriam reescritos em Dart, dobrando a superfície de erro.
- **Monorepo pnpm workspaces** com pacote compartilhado entre web e
  nativo durante a transição.
- **Uma linguagem só para um dev solo** — o critério dominante já era de
  capacidade, não técnico; RN é a única opção onde parte do repositório
  atual migra em vez de morrer.

### O destino do spike: due diligence, não gate

O spike **não morre — encolhe e muda de natureza**: vira due diligence
dentro do RN na **primeira semana do nativo** (item registrado no C4):
renderizar um PDF com a lib padrão do ecossistema (`react-native-pdf`)
em device real, ~meia hora. Não decide nada — só estabelece o teto cedo
e evita surpresa.

### Análise comparativa (registro pré-decisão; mantida como memória)

Critérios da época: dev **solo** com stack TS/React · backend REST
existente (a API Next.js fica) · Firebase Auth (token Bearer, B7) ·
Supabase só via API · requisitos do Bloco C — com PDF rendering como
critério de maior peso (premissa **revogada** acima).

#### As quatro opções

| Critério | React Native / Expo | Flutter | Kotlin Multiplatform | Nativo puro ×2 |
|----------|--------------------|---------|--------------------|----------------|
| Aproveitamento do perfil (TS/React, solo) | **Máximo** — mesma linguagem, mesmo modelo mental de componentes; reuso direto de tipos TS e schemas Zod do repo atual | Baixo — Dart + widget tree novos | Médio — Kotlin compartilha lógica, UI é SwiftUI + Compose (2 UIs) | Nenhum — 2 linguagens, 2 codebases |
| Custo de manter 2 plataformas sozinho | 1 codebase | 1 codebase | ~1,5 codebases | 2 codebases |
| Firebase Auth | `@react-native-firebase/auth` (oficial, maduro); Expo exige dev build, não Expo Go | FlutterFire (oficial) | SDK community (GitLive) — funcional, menos garantias | Oficial, primeira classe |
| Consumo da API REST | fetch + tipos TS **reaproveitados do repo** — mitiga na prática o risco de drift do B2 | http/dio + tipos re-escritos em Dart | ktor + tipos Kotlin (re-escritos) | ×2 |
| **PDF (o critério pesado)** | `react-native-pdf` (PDFKit no iOS, pdfium no Android): scroll contínuo, zoom/pinch, página N — maduro. Inversão de cor (dark sheet) via ColorMatrix/filtro por cima do view | Opções fortes: `pdfrx`/`pdfx` (pdfium) e Syncfusion (licença) — arguably o ecossistema de viewer mais completo | Sem história compartilhada: PDFKit e PdfRenderer atrás de expect/actual — **2 implementações** (PdfRenderer é cru: scroll/zoom por sua conta) | PDFKit (iOS) excelente; Android exige montar viewer sobre PdfRenderer ou lib de terceiro |
| Wake lock | `expo-keep-awake` (trivial) | `wakelock_plus` (trivial) | trivial por plataforma | trivial |
| Share target (WhatsApp → app) | Config plugins da comunidade (ex.: `expo-share-intent`); iOS Share Extension via plugin — funciona, é a parte menos "de fábrica" do RN | `receive_sharing_intent` — mesma natureza | Nativo por plataforma (2 implementações, primeira classe) | Primeira classe |
| Offline-first (DB local + fila de escrita) | expo-sqlite / WatermelonDB / op-sqlite — maduro | Drift/Isar — maduro | SQLDelight — maduro | Room / CoreData+GRDB |
| Risco específico | Depender de libs nativas de terceiros para PDF/share (qualidade boa, mas manutenção da comunidade) | Reescrever em Dart tudo que hoje é TS; zero reuso | Volume de trabalho de 2 UIs para um dev solo | Volume máximo; fim do argumento "mínimo de mudança" |

#### Leituras da época (pré-decisão)

- **O critério dominante não é técnico, é de capacidade**: um dev solo
  mantendo backend + 2 apps. Isso pesa contra KMP e nativo puro (2 UIs)
  independentemente de mérito técnico.
- **React Native/Expo** é a única opção onde parte do repositório atual
  **migra em vez de morrer**: tipos, schemas Zod, lógica de domínio em TS —
  o que conversa diretamente com o problema de drift schema×payload do B2
  (cliente e servidor validando com o mesmo schema).
- **Flutter** ganha no polish do rendering (incluindo o ecossistema de PDF
  viewer talvez mais completo) ao custo de zerar o reuso de linguagem — a
  troca é "melhor ferramenta de UI" por "segunda stack para uma pessoa".
- ~~**O PDF decide mais que qualquer benchmark**~~ — **leitura revogada
  em 2026-08-13** pela premissa de repertório (ver topo da seção). Fica
  válido o fato técnico: qualquer uma das quatro opções elimina a classe
  PERF-02 (não há CSP nem iframe fora do browser). O spike de 1 dia aqui
  recomendado foi cancelado como gate e convertido em due diligence da
  primeira semana do nativo (C4).
- **Share target no iOS** é extensão de app em qualquer stack (até no
  nativo é um target separado); nenhuma opção torna isso "grátis" — apenas
  mais ou menos documentado.

#### As perguntas que fechavam a decisão — respondidas (2026-08-13)

1. ~~O spike de PDF passa na stack candidata?~~ → **pergunta dissolvida**:
   PDF deixou de ser critério de escolha (premissa de repertório); o
   spike virou due diligence pós-decisão dentro do RN (C4).
2. O reuso de Zod/tipos TS vale o lock-in no ecossistema RN? → **Sim** —
   é o coração do racional: os contratos que o Bloco B audita migram em
   vez de serem reescritos em Dart.
3. Expo com dev build confortável no fluxo solo? → **Sim** — aceito como
   parte da escolha; sem desafiante restante.
4. Ambição futura que empurre para nativo puro? → **Não** — nada no
   horizonte que justifique 2 codebases para um dev solo.

---

## Tabela-resumo — os 96 achados com destino

Legenda de destino: **A** fila de sobrevivência do web (recortada em
2026-08-10 para 7 itens: #0 ✅, #2, #3, #4, #8, #5, #1 — nesta ordem de
execução) · **B** contrato de API/backend · **C** corpus do nativo · **D**
morre com a web. Sev/esforço conforme ASSESSMENT.

| ID | Título curto | Sev | Destino | Nota |
|----|--------------|-----|---------|------|
| RATE-01 | Dois sistemas de rate limit; antigo no caminho crítico | S1 | **B** | **✅ FECHADO — B1 COMPLETO** (B1.0 #227 · B1.0.1 #228 · B1.1 #229 · B1.2a #230 · B1.2b #231 · B1.3 #232, 2026-08-14→22); sistema único por uid, seis gates permanentes |
| AUTH-02 | Cookie 7 dias carrega idToken de 1h | S2 | D | contrato Bearer do nativo em B7 |
| AUTH-03 | Logado abre `/` e cai no marketing | S2 | **D** | cortado da fila A (recorte 2026-08-10) |
| AUTH-04 | Validação só pelo balão HTML5 | S3 | D | lição em C3-5 |
| AUTH-05 | Select sem nome acessível | S3 | D | |
| AUTH-06 | "Sign In" invisível na landing | S3 | D | |
| AUTH-07 | Campos sem `autocomplete` | S3 | D | |
| AUTH-08 | Páginas sem landmarks | S3 | D | |
| AUTH-09 | Inconsistência landing × auth | S3 | D | |
| AUTH-10 | Landing fictícia, 7 links mortos | S3 | D | |
| AUTH-11 | Loading compartilhado nos botões | S3 | D | |
| ADD-01 | Falha de save mostra "saved successfully" | S1 | **C** | ✅ **resolvido por tabela na fila A #3/#4, confirmado em produção** (item 43: `mostraSuccess` **true → false**, alerta `"Content saved successfully!"` → `"Failed to fetch"`, `mostraErro: true`). Duas notas: (a) **visibilidade** da mensagem de sucesso é decisão do design nativo (com `onNext()` o wizard avança e ela pode não ser vista; para a fila A basta que não minta); (b) **"Failed to fetch" é visível mas não acionável** — a qualidade da mensagem é ADD-07/B3, não esta PR |
| ADD-02 | Batch import: 201×3 mas tela final é o passo 1 | S1 | **C** | anti-padrões C3-1/C3-2; import nativo em C4 |
| ADD-03 | PWA sem share_target | S2 | **C** | requisito C4 (WhatsApp) |
| ADD-05 | Tom enterrado em Advanced Options | S2 | **C** | design do form nativo (J4 ≤8 taps) |
| ADD-06 | Upload sem progresso/cancelamento | S2 | **C** | requisito do import nativo |
| ADD-07 | Erros do servidor genéricos/mudos | S2 | **B** | contrato de erro B3 (+413 mudo) |
| ADD-08 | Multi-arquivo não existe | S2 | **C** | requisito C4 (lote); anti-padrão C3-5 |
| ADD-09 | Abre em "Create/Lyrics" e mente "Upload" | S2 | D | fluxo será redesenhado |
| ADD-10 | 3 violações axe | S3 | D | |
| ADD-11 | Três cores de "selecionado" | S3 | D | |
| ADD-12 | Trocar tipo descarta arquivo mudo | S3 | **C** | anti-padrão C3-5 |
| ADD-13 | Upload descarta título/artista/tom digitados | S1 | **A** | fila #3 |
| ADD-14 | Double-submit no save (2 linhas/41 ms) | S2 | **A** | fila #4, mesma PR do #3 |
| ADD-15 | Storage sem listagem; órfão irrecuperável | S3 | **B** | B4 (+magic bytes) |
| DASH-01 | Dashboard sem caminho para o show | S2 | **C** | IA do nativo (J1) |
| DASH-02 | 1 de 4 stat cards navega | S2 | D | lição em C3-2 |
| DASH-03 | Abas Recent/Favorites redundantes | S2 | D | |
| DASH-04 | Bottom nav encobre conteúdo (81 px vs pb-16) | S2 | **D** | cortado da fila A (recorte 2026-08-10) |
| DASH-05 | 4 stat cards consomem a dobra | S2 | D | |
| DASH-06 | Botão do shell sem nome | S3 | D | |
| DASH-07 | Contraste amber-600 | S3 | D | |
| DASH-08 | Ícones com switch sobre strings inexistentes | S3 | D | |
| DASH-09 | Estrela emoji com CSS morto | S3 | D | |
| DASH-10 | Três rótulos para importar | S3 | D | |
| DASH-11 | Vazio sem CTA | S3 | D | |
| LIB-01 | Sem loading state por ~7 s | S2 | **C** | baseline C2: nativo renderiza do cache local |
| LIB-02 | Títulos longos escondem ações | S2 | D | |
| LIB-03 | Duplicados indistinguíveis | S2 | D | fonte de duplicatas some com A#4 |
| LIB-04 | Busca sem tolerância a acento/typo | S2 | **B** | **B11** (bloco próprio; era rotulado B5 — decisão B5-D1) |
| LIB-05 | Busca só no Enter | S2 | D | critérios do J5 cobrem o nativo |
| LIB-06 | Filtro ativo invisível | S2 | D | |
| LIB-07 | Scroll aninhado + paginação cortada | S2 | D | |
| LIB-08 | Sem-resultados não ecoa a query | S3 | D | critério do J5 |
| LIB-09 | Card role=button com aninhados | S3 | D | |
| LIB-10 | Icon-only sem nome (5×) | S3 | D | |
| LIB-11 | Contraste 2.62:1 | S3 | D | |
| LIB-12 | Headings h1→h3 | S3 | D | |
| LIB-13 | CTA azul vs paleta âmbar | S3 | D | |
| CONT-01 | Cifra-string vira parágrafo corrido | S1 | **A** | fila #8 — ✅ **concluído** (PR #224; 5 sites, incl. palco) |
| CONT-02 | Tab destruída por word-wrap | S1 | **A** | fila #8 — ✅ **concluído** (PR #224; 6 cordas alinhadas no viewer). Palco: tab não renderiza → Bloco C |
| CONT-03 | Anotações write-only e inalcançáveis | S1 | **C** | requisito C4; feature mantida (B5 ✅), modelo no design nativo |
| CONT-04 | Edit/Delete nunca ligados no viewer | S2 | **C** | anti-padrão C3-2 |
| CONT-05 | Favoritar não persiste (TODO) | S2 | **C** | anti-padrão C3-2 |
| CONT-06 | PDF mobile transborda (width 800) | S2 | D | PDF nativo é C4 |
| CONT-07 | Fallbacks exibem conteúdo fabricado | S2 | **C** | anti-padrão C3-6 |
| CONT-08 | Sem zoom de texto; toolbar vestigial | S2 | D | zoom é critério do J1 no nativo |
| CONT-09 | Duplicatas indistinguíveis no viewer | S3 | D | |
| CONT-10 | Título de 186 chars infla o header | S3 | D | |
| CONT-11 | 21 icon-only sem nome | S3 | D | |
| CONT-12 | Scroll do PDF sem foco de teclado | S3 | D | |
| SET-01 | Venue/data/notas descartados pelo Zod | S1 | **B** | ✅ fechado no B2 (PR #240) |
| SET-02 | Sanitizador zera nomes reais | S1 | **B** | sanitização é da API; nativo herda |
| SET-03 | Reorder: handler da UI é TODO | S1 | **D** | cortado da fila A; item 17 vira pergunta de design do B6 |
| SET-04 | Drag inoperante em touch | S1 | **D** | cortado da fila A; requisito touch segue no C (J3) |
| SET-06 | Bis impossível (unique) com 500 mudo | S2 | **B** | constraint será removida (B5 ✅); requisito C4 |
| SET-07 | Reorder 2N UPDATEs sem transação | S2 | **B** | endpoint atômico B6 |
| SET-08 | Tom não aparece na área | S2 | **C** | critério do J3 |
| SET-09 | Remover recém-adicionada falha (IDs falsos) | S2 | D | estado do cliente web |
| SET-10 | Detalhe nasce 342 px abaixo da dobra | S2 | D | |
| SET-11 | Títulos truncados a ~4 chars | S2 | D | |
| SET-12 | Hover-only 28 px em touch | S2 | **C** | anti-padrão C3-3; atenuado por A#7 |
| SET-13 | Duração fabricada como fato | S2 | **C** | anti-padrão C3-6 |
| SET-14 | Offline: listagem sem leitura de cache | S1 | **A** | fila #5 (único M) — ✅ **concluído** (PR #225; cache-first + erro não engolido; cobre `onLine=true` com rede caída, o caso real de palco) |
| SET-15 | Não existe duplicar setlist | S2 | **C** | requisito C4 (J3) |
| SET-16 | Contraste CTAs azuis | S2 | D | |
| SET-17 | Data com off-by-one de fuso | S3 | **B** | `performance_date` date-only (B5 ✅) |
| SET-18 | Painel vazio mobile inútil | S3 | D | |
| SET-19 | Ações do topo somem ao rolar | S3 | D | |
| SET-20 | Botão do shell sem nome | S3 | D | |
| SET-21 | Sem h1 | S3 | D | |
| SET-22 | N+1 com content_data integral | S3 | **B** | shape de listagem B7 |
| SET-23 | Criar setlist falha em silêncio (null) | S1 | **A** | fila #2 — ✅ **concluído** (PR #222; J3 "criar ≤3 taps" agora ✅) |
| PERF-02 | CSP bloqueia o iframe de PDF no palco | S1 | **A** | fila #1 — ✅ **concluído** (PR #226; `frame-src blob:` mínimo, PDF renderizando no palco em prod) |
| PERF-04 | Avançar exige botão de 36 px | S2 | **C** | anti-padrão C3-3; palco às cegas |
| PERF-05 | Sem "música 4 de 12" | S2 | **C** | requisito C4/C2 |
| PERF-06 | Pular música: só dots de 8 px | S2 | **C** | requisito de salto direto (J2) |
| PERF-07 | Fim de setlist / Go back → about:blank | S2 | **D** | cortado da fila A (recorte 2026-08-10) |
| PERF-08 | Toast de wake lock cobre controles | S2 | D | some com wake lock nativo (C4) |
| PERF-09 | Play mudo em PDF/imagem | S2 | **C** | anti-padrão C3-5 (estados por tipo) |
| PERF-10 | Zoom re-quebra linhas | S2 | **C** | requisito de zoom nativo (pan, layout estável) |
| PERF-11 | Sair/dark/play sem nome | S3 | D | |
| PERF-12 | Auto-hide pela metade (170 px) | S3 | D | lição em C3-2 |
| PERF-13 | Contraste do header do palco | S3 | D | |
| PERF-14 | Scroll sem foco + landmarks | S3 | D | |
| GLOB-01 | UI em inglês para usuário brasileiro | S2 | **C** | nativo nasce pt-BR (C4) |

**Conferência (pós-recorte de 2026-08-10)**: A 7 (PERF-02, SET-23,
ADD-13, ADD-14, SET-14, CONT-01, CONT-02; o #0 executou o paliativo do
RATE-01, cujo destino de redesenho segue B) · B 10 · C 23 · D 56 =
**96** — nenhum achado sem destino. Fechados/absorvidos anteriores (sem destino,
rastreabilidade): ~~ADD-04~~ (absorvido em ADD-13), ~~SET-05~~ e
~~AUTH-01~~ (consolidados em RATE-01), ~~PERF-01~~ (não reproduzido),
~~PERF-03~~ (corrigido em `a3114cc`), signup 401 e Bug F1 (históricos).

---

## Execução da fila A — agrupamento em PRs (aprovado com ajustes, 2026-08-10)

> **Atualizado no recorte de 2026-08-10 (2ª revisão)**: PR-5, PR-7, PR-8a
> e PR-8b **mortas** (itens cortados → Bloco D). Executado:
> **PR-0** (#0) + housekeeping (retry/tipo/guard) + PRs de terreno #220
> (pipeline) e #221 (âncora do self-fetch) + **PR-2 (#2, PR #222)** +
> **PR-3 (#3+#4, PR #223)** + **PR-6 (#8, PR #224)** + **PR-4 (#5,
> PR #225)** + **PR-1 (#1, PR #226)**.
> **✅ FILA A COMPLETA (2026-08-12)** — ver balanço de encerramento no
> fim desta seção.

Cada PR roda o spec da Fase D correspondente como regressão
(`tests/ux-audit/fase-d/`, alvo via `UX_AUDIT_BASE_URL`).

Ajustes obrigatórios incorporados:

1. **PR-0 com aceite quantitativo**: spec novo `rl-0-verify.spec.ts` —
   40 POSTs diretos ao `/api/auth/verify` (2× o limite antigo de 20/60 s)
   com assert de **zero 429**, mais 12 navegações autenticadas com assert
   de **zero aterrissagens em `/login`** (o observável do FASE-D-01) e
   zero 429 em `/api/*`. **Controle negativo principal** (exercita o
   limiter antigo pós-fix): `/api/auth/user` continua envelopado
   (2/60 s strict) — 4 GETs devem produzir ≥1 429 com
   `X-RateLimit-Limit: 2` (assert no mesmo spec). Verificação adicional:
   `probe-auth-limit.ts` (limite 5/15 min do `/api/auth/session`, módulo
   novo, intacto). Validação sempre com **`--retries=0` explícito** — um
   retry que passa na 2ª tentativa mascararia o 429 intermitente que o
   spec existe para pegar. O corpo da PR declara explicitamente:
   **verify fica sem rate limit algum até o B1** — paliativo aceitável em
   app de usuário único, escrito, não implícito.
2. **PR-1 com pre-check e gate em preview**: antes de escrever o valor da
   CSP, verificar **de onde o iframe do modo performance carrega o PDF**
   (se a origem for `*.supabase.co` e não blob do próprio app,
   `frame-src 'self' blob:` não resolve); reportar o call site + valor
   proposto antes de abrir a PR. Primeira validação do item 4 (Chromium
   headed) contra **preview deployment do Vercel**; prod é confirmação,
   não descoberta.
3. **Retry de 75 s**: commit de housekeeping isolado (posição acima).
4. **PR-5 com cláusula de escape**: SET-04 entra como botões ▲/▼ **se
   couber em P**; se crescer para M durante a execução, sai da PR-5 e ela
   segue só com o SET-03 — registrado na descrição da PR.
5. **Mutação de configuração local exige sinalização prévia** (regra de
   sessão, 2026-08-10): qualquer comando que altere arquivos de
   configuração ou credenciais locais fora do repositório (`.env*`,
   configs de CLI, tokens, links de projeto) é **sinalizado antes de
   rodar, com o efeito colateral esperado descrito** — mesmo quando o
   objetivo do comando é só leitura. Origem: `vercel link` sobrescreveu
   `.env.local` como efeito colateral de uma inspeção read-only.
6. **Segredos de automação** (Vercel bypass etc.): valor lido **somente
   inline no momento do comando** (`$(cat ~/.octavia-vercel-bypass)`),
   nunca gravado em arquivo do repositório, nunca ecoado em log/output.
7. **Controle negativo de gates novos** (regra de sessão, 2026-08-12;
   mesma disciplina que desmascarou o item 33): todo gate de regressão
   novo **prova que pega o bug que diz pegar** antes de valer como gate —
   rodado contra o código **sem** o fix (prod pré-merge ou código
   revertido), com **falha esperada no assert do alvo**, registrada no
   relatório de validação. Primeiro uso deliberado: PR-4/#5, gate
   `set14-gate.spec.ts` (falhou contra prod sem o fix exatamente no
   assert "setlist canônica visível offline"; passou no preview e na
   confirmação de prod com o fix).

### Incidente API key (2026-08-11)

A adição do referrer do preview **ativou restrição numa key até então
irrestrita**, bloqueando `octavia.rocks` e o caso **sem-referer**.
Detectado pelo mapa de referrers **antes do primeiro sintoma em prod**
(sessões ativas seguravam a janela de ~1 h; o app só chama a API do
Firebase Auth no login ou no refresh do token). Remediação: restrição
removida, estado conhecido-bom restaurado, login real em prod confirmado
de ponta a ponta pelo Marcel.

**Lição**: mudança em credencial/config de console exige **verificação do
estado atual ANTES** da mudança e **teste do caminho de prod DEPOIS** —
mesmo quando a mudança parece só aditiva.

### Housekeeping da fila A — balanço final (2026-08-13)

Recorte decidido pelo critério **"os gates permanentes precisam disso
para continuar confiáveis?"**: 3 itens executados, 2 encerrados sem
execução (registro abaixo, para ninguém reabrir sem contexto), 1
decisão registrada (secret do bypass — ver seção seguinte).

1. **Parametrizar o `baseURL`** de `i-add.spec.ts` e `i-verify.spec.ts` —
   ✅ **encerrado SEM execução** (2026-08-13): motivo morto — a fila A
   encerrou e não há mais validação preview desses specs; os 6 gates
   permanentes são parametrizados.
2. **Refinar a mensagem da sentinela de bounce** no `recorder.ts`
   (distinguir regressão do #0 do falso alarme cookie×domínio) —
   ✅ **encerrado SEM execução** (2026-08-13): cenário morto — o falso
   alarme só ocorria em validação cruzada preview/prod da fila A.
3. **Referer nas chamadas Node do `scripts/ux-audit/auth.ts`** —
   inalterado: segue **somente se** o endurecimento de referrer do B10
   for adotado; com a key irrestrita (estado atual), é desnecessário.
4. **Confirmar `rl-0-verify.spec.ts` e `probe-auth-limit.ts` com o bypass
   por cookie** — ✅ **executado** (2026-08-13, contra o alias, secret
   inline): **os dois autenticam e atravessam a proteção; nada precisou
   de conserto.** Setup semeou o `_vercel_jwt` (10,6 s); `rl-0-verify`
   com `--retries=0` passou inteiro em 52 s — A: 40 POSTs ao verify →
   **40× 200, 0× 429**; B: 12 navegações → **zero /login, zero 429**
   fora do session (9× 429 de session, pré-B1 conhecido); C (controle
   negativo): `/api/auth/user` → `401, 401, 429, 429` com
   `X-RateLimit-Limit: 2`. Probe (bypass por header em fetch Node, sem
   browser — o anti-padrão do header global não se aplica): 8 POSTs →
   **8× 429 do limiter do app** (`limit=5`, `retryAfter ~810s`) — janela
   5/15min esgotada pelos POSTs de sessão do rl-0 imediatamente
   anterior; a presença dos headers `X-RateLimit-*` (e não um 302 do
   SSO) é a prova da travessia. Rodada foi também o primeiro exercício
   real do guard do nº 6: escrita em tmpdir, histórico intocado
   (confirmado por `git status`).
5. **Item 42 falhando no passo `Library` (pós-save)** — ✅ **executado**
   (2026-08-13, commit `994c36c`): hipótese do plano **confirmada em
   substância** — o passo corria contra o redirect pós-save do app
   (`onContentCreated` → `router.push('/content/<id>')`); o
   `waitForFunction(/successfully|library/i)` era trivialmente
   verdadeiro (a bottom nav sempre contém "Library") e não esperava
   nada. **Refinamento**: o redirect já existia pré-PR-3; o que a PR-3
   mudou foi o save ser aguardado, tornando o redirect o evento
   pós-save determinístico — a corrida passou a resolver do lado dele.
   **Spec adaptado ao fluxo real** (critério de sucesso =
   `waitForURL(/\/content\//)`, só então segue à Library), sem regressão
   de app. Validação em runtime pendente do mesmo bloqueio do nº 4.
6. **Guard do registro histórico da Fase D** (novo, ✅ **executado**
   2026-08-13, commit `6b5347a`): invariante — qualquer rodada
   pós-Fase D escreve em **path efêmero** (mkdtemp), independente do
   alvo (preview OU prod); `docs/ux/fase-d/{data,evidence}` é imutável.
   Mecanismo unificado em `scripts/ux-audit/fase-d-dirs.ts`
   (ItemRecorder/trackSessionPosts, `EVIDENCE_DIR` dos 10 specs da
   fase-d e o probe, que tinha guard local condicionado a
   `UX_AUDIT_BASE_URL` — agora incondicional). Reabrir escrita
   histórica exige opt-in deliberado `UX_AUDIT_FASE_D_HISTORICO=1`.
   Assert do invariante no próprio guard + 3 testes unitários.

### Padrão de instrumentação: bypass nunca por header global

**Header custom global em `extraHTTPHeaders` vaza para requisições
cross-origin** — o preflight é recusado por terceiros e o sintoma fica
**indistinguível de bug do app**. Evidência (PR-3, 2026-08-11): o
`x-vercel-protection-bypass` injetado no `use` do Playwright ia junto nas
chamadas do SDK do Firebase (`identitytoolkit`, `securetoken`); o Google
recusava o preflight (*"No 'Access-Control-Allow-Origin'"*), o SDK ficava
sem token e o upload travava no passo 1 **sem toast** — três rodadas de
diagnóstico foram gastas atribuindo isso ao app e à API key.

**Regra**: o bypass da Vercel viaja por **cookie** (`_vercel_jwt`, semeado
por query param no `auth.setup.ts` e carregado no storageState), **nunca**
por header global.

**Decisão (2026-08-13): o secret do bypass permanece ativo.** O Bloco B
fará PRs de rotas/contratos e a validação preview-first continua sendo o
modelo. Revogação fica para o **fim do Bloco B** (ou para quando o
preview-first deixar de ser necessário). O secret segue vivendo só em
env no momento da execução, nunca em arquivo do repo.

**⚠️ Alias `octavia-preview.vercel.app` APOSENTADO (B3/D0, 2026-08-28).**
O pre-check do B3 mediu o alias apontando para um deployment **podre**
(pré-B2-PR-3): validate-token respondia 400 em vez de 404, PUT
content/[id] 401 em vez de 405 ([`B3-PRECHECK.md`](B3-PRECHECK.md) §0).
Toda validação usa a **URL de branch**
(`octavia-git-<branch>-marcelvianas-projects.vercel.app`); para medir a
main, `octavia-git-main-…` — que serve o **mesmo deployment de produção**,
logo vale para leitura, **nunca** para provocação de rate limit. A guarda
do G2 foi reescrita como allowlist de URL de branch ≠ main
([`g2-limiter-unico.spec.ts`](../../tests/ux-audit/fase-d/g2-limiter-unico.spec.ts)).
Regra irmã, do mesmo ciclo: **probe que escreve captura leitura-prévia
antes do primeiro write** (furo do pre-check do B3 no PATCH de profile,
declarado e fechado no desenho §0.2).

**Regra de varredura (2026-08-29, errata do §2.9 do B3-PRECHECK, PR
#244)**: toda varredura declarada num relatório ("zero ocorrências",
"único ponto", "N callers") vem com o **comando exato + saída literal
colada no corpo do relatório** — sem saída colada, **não conta como
medição** e não pode sustentar afirmação. Origem: o pre-check do B3
citou um grep nunca executado (e inexecutável como escrito) para
sustentar um "único ponto" que era falso — o segundo ponto da classe
(interpolação de `error.message` em `storage/upload`) só apareceu no
re-grep do PR-2.

**Interferências de ambiente de preview** (lista viva — o preview injeta
comportamento que prod não tem; **asserts de gate devem mirar o invariante
guardado, não o ambiente**):

1. *extraHTTPHeaders global* — vaza para cross-origin e derruba o SDK do
   Firebase (caso acima, PR-3).
2. *Widget vercel.live* — o preview injeta o frame de feedback da Vercel
   (headed/interativo; headless não o carrega, prod não o tem); nossa CSP
   corretamente o bloqueia, e o assert de violações do `perf02-gate`
   disparou nesse ruído até ser estreitado para o invariante real
   (violações sobre `blob:`). Caso da validação da PR-1 (2026-08-12).

### Nota operacional: rodadas longas re-semeiam sessão (~55 min)

O cookie de sessão de 7 dias carrega o **idToken de 1h** (AUTH-02;
`app/api/auth/session/route.ts`), e o middleware valida o idToken — logo
o storageState do ux-audit **expira ~1 h após o setup**, com bounce para
`/login` indistinguível à primeira vista de regressão de auth. Custo real:
na confirmação de prod da PR-4 (2026-08-12), duas tentativas foram
gastas na hipótese errada (limiter) antes do diagnóstico. **Regra**: em
qualquer rodada contra prod/preview que passe de ~55 min desde o setup
(ou que falhe com bounce em `/login`), re-rodar o setup **antes** de
diagnosticar como regressão. Morre com o contrato Bearer do nativo (B7).

### Encerramento da fila A (2026-08-12)

**A fila A está completa.** Balanço:

- **7 itens executados** dos 12 originais: #0 (paliativo RATE-01, PR #219),
  #2 (SET-23, PR #222), #3+#4 (ADD-13/14, PR #223), #8 (CONT-01/02,
  PR #224), #5 (SET-14, PR #225), #1 (PERF-02, PR #226). Todos validados
  preview-first e confirmados em prod, com relatórios quantitativos
  aprovados item a item.
- **5 cortados por decisão de escopo** (recorte de 2026-08-10, registrado
  acima): SET-03, SET-04, AUTH-03, PERF-07, DASH-04 → Bloco D. O critério
  do recorte se sustentou até o fim: o web precisa apenas não atrapalhar
  shows e preparação até a substituição nativa.
- **Ganhos colaterais** que ficam para o B e além: pipeline de build/deploy
  destravado (PRs #220/#221); procedimento preview-first provado (alias
  estável + bypass por cookie, nunca header global); **controle negativo
  como regra nº 7** de gates novos (nascida do item 33, promovida na PR-4,
  exercida na PR-1); gates de regressão permanentes (`rl-0-verify`,
  `cont01-02-monoespacado`, `set14-gate`, `perf02-gate`); dossiês
  **B1** (rate limit/session, três fontes de evidência) e **B9**
  (idempotência do POST /api/content, duplicação **reproduzida ao vivo em
  prod**) prontos para o desenho do B.
- **Pendências que NÃO morrem com a fila** (registradas, sem execução
  automática): housekeeping acumulado (seção acima) e o E2E do CI
  (item irmão do B8 — vermelho herdado durante toda a fila, conjunto
  idêntico verificado a cada merge).

**Passagem de bastão**: o próximo trabalho é o **Bloco B**, com o **B1**
(redesenho do rate limit/session — elimina o self-fetch por chamada de
função local) como candidato a primeiro item, pela evidência acumulada
(63% de 429 na Fase D; janela 5/15min esgotada em navegação trivial;
AUTH-02 forçando re-seed de sessão a cada ~55 min de validação). A
retomada é decisão do Marcel, em sessão nova — nada se inicia
automaticamente.

## Sequência (atualizada pós-aprovação)

1. **Agora**: executar a fila A aprovada (#0–#11), no agrupamento de PRs
   da proposta de execução.
2. **Antes de escrever a primeira tela nativa**: B1 (rate limit), B2
   (audit Zod — já incorporando as decisões B5: colunas ligadas,
   `performance_date` date-only) e B3 (contrato de erro) — são a espec da
   API que o cliente vai consumir. Migration do drop da constraint do bis
   (B5 ✅) entra aqui.
3. **Junto do desenvolvimento nativo**: B4 (storage), B6 (reorder
   atômico), B7 (shapes de leitura); modelo de dados de anotações decidido
   no design nativo (B5).
4. **Decisão de stack**: ✅ **fechada em 2026-08-13** — React
   Native/Expo, monorepo pnpm workspaces. O spike de PDF foi cancelado
   como gate decisório e convertido em due diligence da primeira semana
   do nativo (C4). Nenhuma decisão de stack permanece em aberto.
5. **Após o Bloco C (2026-09-04)** — próximo bloco **a eleger**;
   candidatos: **bloco de stack do nativo** (scaffold do monorepo,
   escolha de runtime, prova das hipóteses H15/H16 do PRD na primeira
   semana) × **mini-itens do Bloco B** ("Herança do Bloco C", seção B7).
   Fora do repo, antes da primeira build: H11 (referrer da web API key —
   Marcel/console).
