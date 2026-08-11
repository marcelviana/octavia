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
| 2º | 3 | **ADD-13** | Em [`hooks/useAddContentLogic.ts`](../../hooks/useAddContentLogic.ts), o branch `else if (uploadedFile)` usa `metadataToUse` (`customMetadata \|\| metadata`) como o branch de draft, e inclui `key`, `album`, `genre`, `bpm`, `difficulty`, `notes`. | P | **Baixo.** Regressão: itens 42/46 + 44 sanity. **Rigor atual** (upload/dados). |
| 2º | 4 | **ADD-14** | Guarda de in-flight no `handleSaveContent` + `disabled` no Save. Mesma PR do ADD-13. | P | **Nulo.** Regressão: item 43. **Rigor atual**. |
| 3º | 8 | **CONT-01 + CONT-02** | Cifra/tab-string em bloco monoespaçado `white-space: pre` + scroll-x (sem word-wrap). | P | **Baixo.** Conteúdo de texto é o caso majoritário do palco. Regressão: item 33 + assert de cifra. **Checkpoint único** (diff + teste juntos, sem intermediário). |
| 4º | 5 | **SET-14** (FASE-D-06) | Listagem `/setlists` lê o cache offline (a mesma fonte que o dashboard e o deep link já leem; itens 8–9). | **M** | **Médio-baixo.** Único M (veto J1/J6: offline no local do show). Regressão: item 10 + 8–9 sanity. **Rigor atual**. |
| 5º (último) | 1 | **PERF-02** | Em [`lib/security-headers.ts:79`](../../lib/security-headers.ts), `frame-src: 'none'` → `'self' blob:`. Pre-check do call site **feito**: o iframe só recebe `blob:` do próprio app (via `/api/proxy` → `createObjectURL`); não incluir `data:` (fallback legacy praticamente morto — declarado na PR). | P | **Baixo.** Mantido pelo custo marginal (one-liner com pre-check pronto). Perde a posição privilegiada: PDF é minoria do palco. Gate de preview permanece (item 4, Chromium headed). |

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
único usuário esgota a janela de 5/15min quase imediatamente. Leitura:
**o redesenho do session é candidato a primeiro item executado do B1.**

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

### B2 — Audit schema Zod × payload real, rota a rota

Três casos **provados** do mesmo defeito — o schema foi escrito sem olhar o
payload que o próprio cliente envia:

| Caso | O que aconteceu | Estado |
|------|-----------------|--------|
| **profile** | `authSchemas.profileUpdate` validava campos inexistentes (`displayName`/`preferences`); o payload real do signup era descartado pelo strip do Zod — usuário Firebase órfão sem perfil | corrigido (commit `aa501cc`) — prova da classe |
| **SET-01** | `venue`/`performance_date`/`notes` enviados pela UI, silenciosamente descartados pelo strip | aberto |
| **SET-23 / FASE-D-05** | `description: null` da UI rejeitado por `.optional()` (aceita só `undefined`) — 400 sem feedback | ✅ corrigido na fila A #2 (PR #222); a classe permanece |
| **`file_url` do add-content** *(direção inversa: payload que o schema **rejeita**, não que ele stripa)* | `createContentSchema` declara `file_url: z.string().url()`, mas o branch de upload envia `uploadedFile.url ?? uploadedFile.name` — se o upload falhar e sobrar o **nome do arquivo**, o POST leva 400 | aberto. A partir da fila A #3/#4 (PR-3) o desfecho é **erro visível** em vez de falso sucesso; o audit do B2 decide se o fallback some ou se o schema aceita o caso |

**Tarefa**: inventário rota a rota — payload real (da UI atual **e** do
futuro cliente nativo) × schema — decidindo por campo: aceitar, rejeitar
com erro claro, ou remover do produto. Política explícita sobre strip
silencioso (hoje é o default do Zod e já causou dois S1). Entregável:
tabela rota × campo × comportamento + testes de contrato. Este audit é
**pré-requisito da espec da API que o nativo consome**.

### B3 — Contrato de erro: toda falha retorna erro estruturado

**Motivação medida**: as **7 falhas silenciosas** do padrão nº 1 do
ASSESSMENT — em três delas o app ainda afirmou sucesso. A causa não é
local: não existe camada que traduza falha em mensagem.

**Espec proposta**:
- Toda resposta não-2xx carrega corpo estruturado: `{ error: { code,
  message, details? } }`, com `code` estável (máquina) e `message` exibível.
- O cliente nativo nasce com a regra inversa da web atual: **toda não-2xx
  aparece para o usuário por default** (camada de rede central; silenciar é
  opt-out consciente, não o esquecimento padrão).
- 429 inclui `Retry-After`; 4xx de validação inclui o campo ofensor.
- As mensagens são dados de UI: o nativo exibe em pt-BR (GLOB-01), então
  `code` importa mais que `message`.

### B4 — Storage: listagem e reconciliação de órfãos (ADD-15 / FASE-D-04)

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

| Decisão | Estado provado | **Decisão do Marcel** |
|---------|----------------|-----------------------|
| **Bis**: constraint única `(setlist_id, content_id)` | Existe no banco vivo (probe: 500 na duplicata — SET-06). Bis é **requisito do nativo** (Bloco C). | ✅ **Remover a constraint** — repetição permitida; unicidade da linha passa a ser lógica de posição. Tarefa: migration de drop + revisar o DELETE/reorder que assumam unicidade por `content_id`. |
| **Tabela/campo de anotações** | Anotação gravada via API **não renderiza em lugar nenhum** (item 32); write-only desde sempre (CONT-03). | ✅ **Mantida** (não dropar) — anotação é requisito do nativo (J2). A **decisão final de modelo de dados** (tabela `annotations` vs. JSONB em `content_data`; âncora por trecho/página) fica para o design do nativo. Até lá: nada de escrita nova, nada de drop. |
| **Colunas `venue` / `performance_date` / `notes`** | UI envia, Zod descarta (SET-01); colunas existem sem uso real. | ✅ **Ligar de verdade, via B2**: o audit de schema (B2) inclui aceitar e persistir os três campos no contrato de setlists. A UI web não muda; o nativo já nasce lendo/escrevendo. |
| **Semântica de `performance_date`** | Off-by-one de fuso no parse UTC (SET-17). | ✅ **Date-only**: data local sem componente de hora/fuso, no contrato e na exibição. Elimina o SET-17 por definição. |
| **Busca com acento/typo** (LIB-04) | `aguas` → 0, `Águas` → 2 (item 25). A busca é `ILIKE` no Postgres; o nativo herda `GET /api/content?search=`. | (tarefa, não decisão) `unaccent` no mínimo; `pg_trgm` se quiser tolerância a typo. Corrigir no backend serve web e nativo de uma vez. |

### B6 — Position e reorder: contrato para o nativo

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
  transfere.
- **Payload de leitura de setlists** (SET-22): o GET embute `content_data`
  integral de cada música (N+1 + payload gordo). Em rede celular isso vira
  latência e dado móvel. Contratar shape de listagem enxuto + conteúdo sob
  demanda (que é também o shape que o cache offline do nativo vai querer).

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

**Tarefa**: chave de idempotência no `POST /api/content` (header
`Idempotency-Key` gerado no cliente por tentativa de save, com dedupe
server-side por janela), aplicável também às demais escritas enfileiráveis.
O cliente nativo herda o mesmo contrato — e a fila de escrita offline é
**requisito do J6** no Bloco C, então isto é pré-requisito dela.

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

**Item irmão — suíte E2E do CI vermelha**: `tests/e2e/basic.spec.ts`
falha nos 3 browsers (webkit não lança no runner, firefox timeout de
navegação, chromium teste de estado de auth) — **pré-existente desde
antes do audit**: o run do próprio `a3114cc` (o commit em prod) falhou
igual. Diagnosticar e **reativar como gate bloqueante**. Disciplina de
escopo: **nenhum diagnóstico do E2E começa durante a fila A**.

**Gate provisório de merge** (regra escrita, válida para todas as PRs da
fila A enquanto o E2E não voltar): **Vercel preview ✅ + Lint ✅ +
type-check ✅ + unit tests ✅ + coverage ✅ + Build ✅**; E2E vermelho é
herdado, **não bloqueante e não reaberto por PR**.

---

## Bloco C — Corpus de requisitos do app nativo

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
- **PDF como requisito de primeira classe** (J1): render nativo, scroll
  contínuo de 12 páginas, dark mode com inversão legível, zoom com pan,
  arquivo local para offline. Foi o maior S1 da web (PERF-02) e é o item
  que mais diferencia as stacks (ver seção de stack).

---

## Bloco D — Morre com a web

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

## Stack nativa — considerações (análise, SEM decisão)

Critérios: dev **solo** com stack TS/React · backend REST existente (a API
Next.js fica) · Firebase Auth (token Bearer, B7) · Supabase só via API
(o cliente quase não fala com o Supabase direto) · requisitos do Bloco C —
com **PDF rendering como critério de maior peso** (foi o maior S1 da web).

### As quatro opções

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

### Leituras (sem veredito)

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
- **O PDF decide mais que qualquer benchmark**: qualquer uma das quatro
  opções elimina a classe PERF-02 (não há CSP nem iframe fora do browser).
  A diferença está no custo de chegar a scroll de 12 páginas + dark sheet
  invertido + zoom com pan. Prova prática recomendada **antes** da decisão:
  um spike de 1 tela na(s) finalista(s) — renderizar o PDF de 12 páginas do
  seed com inversão de cor e zoom, no iPad real. É o teste de 1 dia que
  vale mais que esta tabela inteira.
- **Share target no iOS** é extensão de app em qualquer stack (até no
  nativo é um target separado); nenhuma opção torna isso "grátis" — apenas
  mais ou menos documentado.

### Perguntas que fecham a decisão

1. O spike de PDF (12 páginas, dark sheet, zoom, iPad real) passa na stack candidata?
2. O reuso de Zod/tipos TS no cliente vale o lock-in no ecossistema RN?
3. Expo com dev build (necessário para PDF/share nativos) está confortável no fluxo de trabalho solo?
4. Alguma ambição futura (widget de setlist, Apple Watch, CarPlay?) que empurre para nativo?

---

## Tabela-resumo — os 96 achados com destino

Legenda de destino: **A** fila de sobrevivência do web (recortada em
2026-08-10 para 7 itens: #0 ✅, #2, #3, #4, #8, #5, #1 — nesta ordem de
execução) · **B** contrato de API/backend · **C** corpus do nativo · **D**
morre com a web. Sev/esforço conforme ASSESSMENT.

| ID | Título curto | Sev | Destino | Nota |
|----|--------------|-----|---------|------|
| RATE-01 | Dois sistemas de rate limit; antigo no caminho crítico | S1 | **B** | B1; paliativo **#0 ✅ concluído e validado** (2026-08-10) |
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
| ADD-01 | Falha de save mostra "saved successfully" | S1 | **C** | anti-padrão C3-1; motivação do B3. *Causa-raiz resolvida por tabela na fila A #3/#4*: o save passou a ser aguardado e a mensagem vem depois dele — **timing correto; a visibilidade da mensagem de sucesso é decisão do design nativo** (com `onNext()` o wizard avança e ela pode não ser vista; para a fila A basta que não minta) |
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
| LIB-04 | Busca sem tolerância a acento/typo | S2 | **B** | B5: unaccent/pg_trgm — nativo herda a API |
| LIB-05 | Busca só no Enter | S2 | D | critérios do J5 cobrem o nativo |
| LIB-06 | Filtro ativo invisível | S2 | D | |
| LIB-07 | Scroll aninhado + paginação cortada | S2 | D | |
| LIB-08 | Sem-resultados não ecoa a query | S3 | D | critério do J5 |
| LIB-09 | Card role=button com aninhados | S3 | D | |
| LIB-10 | Icon-only sem nome (5×) | S3 | D | |
| LIB-11 | Contraste 2.62:1 | S3 | D | |
| LIB-12 | Headings h1→h3 | S3 | D | |
| LIB-13 | CTA azul vs paleta âmbar | S3 | D | |
| CONT-01 | Cifra-string vira parágrafo corrido | S1 | **A** | fila #8; `pre` monoespaçado |
| CONT-02 | Tab destruída por word-wrap | S1 | **A** | fila #8; confirmado ao vivo (item 33) |
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
| SET-01 | Venue/data/notas descartados pelo Zod | S1 | **B** | B2; colunas serão ligadas (B5 ✅) |
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
| SET-14 | Offline: listagem sem leitura de cache | S1 | **A** | fila #5 (único M) |
| SET-15 | Não existe duplicar setlist | S2 | **C** | requisito C4 (J3) |
| SET-16 | Contraste CTAs azuis | S2 | D | |
| SET-17 | Data com off-by-one de fuso | S3 | **B** | `performance_date` date-only (B5 ✅) |
| SET-18 | Painel vazio mobile inútil | S3 | D | |
| SET-19 | Ações do topo somem ao rolar | S3 | D | |
| SET-20 | Botão do shell sem nome | S3 | D | |
| SET-21 | Sem h1 | S3 | D | |
| SET-22 | N+1 com content_data integral | S3 | **B** | shape de listagem B7 |
| SET-23 | Criar setlist falha em silêncio (null) | S1 | **A** | fila #2 — ✅ **concluído** (PR #222; J3 "criar ≤3 taps" agora ✅) |
| PERF-02 | CSP bloqueia o iframe de PDF no palco | S1 | **A** | fila #1 |
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
> e PR-8b **mortas** (itens cortados → Bloco D). Executado até aqui:
> **PR-0** (#0) + housekeeping (retry/tipo/guard) + PRs de terreno #220
> (pipeline) e #221 (âncora do self-fetch). Restam, na ordem:
> **PR-2 (#2) → PR-3 (#3+#4) → PR-6 (#8, checkpoint único) → PR-4 (#5) →
> PR-1 (#1, por último, gate de preview mantido)**.

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

### Housekeeping pendente (fila A)

1. **Parametrizar o `baseURL`** de `i-add.spec.ts` e `i-verify.spec.ts`:
   hoje os contexts fixam `https://octavia.rocks` (linhas 178/310/515),
   o que impede validação preview-first desses itens e produziu um teste
   "passando" contra o alvo errado.
2. **Refinar a mensagem da sentinela de bounce** no `recorder.ts`:
   distinguir regressão real do #0 do **falso alarme cookie×domínio**
   (storageState de um host, navegação em outro), que foi o caso do
   item 42 em 2026-08-11.
3. **Referer nas chamadas Node do `scripts/ux-audit/auth.ts`** —
   **somente se** o endurecimento de referrer do B10 for adotado; com a
   key irrestrita (estado atual), é desnecessário.
4. **Confirmar `rl-0-verify.spec.ts` e `probe-auth-limit.ts` com o bypass
   por cookie** — o mecanismo substituiu o header global que os dois
   usaram na validação da PR-0. É **verificação**, não reescrita; se
   algo quebrar, conserta aqui.

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
4. **Decisão de stack** (única decisão em aberto): responder as 4
   perguntas da seção de stack — começando pelo spike de PDF.
