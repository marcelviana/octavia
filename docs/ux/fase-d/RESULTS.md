# RESULTS — Fase D (execução ao vivo contra PROD)

> Execução dos fluxos reais em https://octavia.rocks com a conta de audit,
> medindo contra os alvos de `docs/ux/JOBS.md`. Insumo: as 49 perguntas da
> lista fechada em `docs/ux/ASSESSMENT.md` § "Verificar na Fase D".
>
> **Infra**: Playwright, projeto `fase-d` (`playwright.ux-audit.config.ts`),
> viewport principal 1194×834 (tablet landscape), secundário 390×844,
> `serviceWorkers: 'allow'`, `trace: 'on'`, **sem** session-intercept.
> Dados brutos por item em `data/item-NN.json`, capturas em `evidence/`,
> traces em `traces/`.
>
> **Convenção** (JOBS.md): tap = interação discreta; digitação = 1 tap por
> campo. Tempo = do primeiro tap ao critério de sucesso visível, medido
> pelos timestamps do runner (não estimativa).

---

## Placar

| | Qtd | Itens |
|---|-----|-------|
| **Respondidas** | 45 | 1–6, 8–13, 15, 16, 18–34, 36–49 |
| **Manual-pendentes** (hardware real) | 3 | 7, 14, 35 |
| **Diferidas** | 1 | 17 (reorder — handler morto, SET-03) |

> 45 + 3 + 1 = **49**. As partes **físicas** dos itens 6, 18 e 33 (pinch,
> drag com o dedo, gesto horizontal) seguem no `MANUAL-CHECKLIST.md`; a
> parte automatizável dos três foi respondida aqui.
>
> **Duas passadas**: a primeira (IP saturado) fechou 35 itens e produziu o
> FASE-D-01; a segunda, num IP limpo, fechou os 10 restantes — e revelou
> que metade do bloqueio não era rate limit, e sim o **FASE-D-05** (criar
> setlist quebrado), que só apareceu ao instrumentar a resposta do POST.

> **Nota sobre os bloqueados**: o grupo C (offline, 8–10), o finale de rate
> limit (11–13) e os itens que dependem de escrita em setlist (16, 18, 21)
> ou de uma janela de tráfego limpa (41) não fecharam nesta passada — a
> própria descoberta do **FASE-D-01** (abaixo) consumiu as janelas de
> limiter disponíveis: cada tentativa de navegar para `/setlists` foi
> rebatida para `/login`, e o retry com 75 s de silêncio × 3 tentativas ×
> vários itens esgotou o tempo útil. Os specs estão escritos e validados;
> ver § "O que falta rodar".

### Vereditos dos 3 S1 provisórios

| ID | Veredito | Base |
|----|----------|------|
| **PERF-02** | ✅ **CONFIRMADO — e pior que o descrito** | Item 4. O PDF não renderiza no modo performance em Chrome real (headed, com viewer nativo de PDF disponível). Causa-raiz identificada: **a CSP do próprio app** (`lib/security-headers.ts`) manda `frame-src 'none'; object-src 'none'`, e o modo performance renderiza PDF via `<iframe>`. Não é "PDF branco por artefato de captura" — o browser exibe *"This content is blocked. Contact the site owner to fix the issue."* Vale em **qualquer** browser. |
| **ADD-02** | ✅ **CONFIRMADO — e pior que o descrito** | Item 44. Batch import de TXT com 3 músicas: os 3 `POST /api/content` retornam **201** (as músicas são criadas), mas a tela após "Import All" é a **tela inicial de upload**, com o StepIndicator marcando *Upload ✓ / Add Details ✓ / Complete ✓*. A UI afirma "Complete" e renderiza o passo 1. |
| **AUTH-01** | ✅ **CONFIRMADO com números próprios** | Itens 11–12. `X-RateLimit-Limit: 5` por 15 min **por IP**; 1 POST por login e **1 por volta de aba**; o 3º POST desta janela já veio 429, com **`Retry-After: 732 s` (12,2 min)** de bloqueio. Na primeira chamada o `remaining` já era **1** — a janela raramente está virgem. Evidência acumulada: **371 POSTs de sessão na fase, 234 (63%) com 429**. E o efeito não se limita ao login: ver FASE-D-01. |

---

## Achados novos da Fase D (não estavam na lista de 49)

### [FASE-D-06] Offline, `/setlists` diz "No setlists yet" — e o dashboard, na mesma sessão, diz que há 3 — S1

**Medição** (item 10): com 4 setlists na conta, offline após kill+reopen, a
página `/setlists` renderiza o **estado vazio de primeiro uso**:

> **No setlists yet** — Create your first setlist to organize songs for your
> performances. · `[+ Create Your First Setlist]`

Na **mesma sessão offline**, o `/dashboard` (item 8) exibe o stat
**"Setlists 3 — ready for performance"**, e o modo performance por deep link
abre a setlist inteira, inclusive uma **nunca visitada** (item 9). Ou seja,
os dados **estão** cacheados e acessíveis — mas a tela de listagem não os lê
e conclui que o usuário nunca criou nada.

**Por que isto é S1 e não um detalhe de cache**: é o caminho natural do J1
e do J6. O músico abre o app no palco sem rede, toca em "Setlists" para
escolher o show — e o app afirma que ele não tem nenhuma. Não é uma
mensagem de erro ("sem conexão, tentando de novo"): é uma afirmação
positiva e falsa sobre o conteúdo dele, acompanhada de um convite para
começar do zero. A recuperação exige saber que o deep link do modo
performance funciona, o que nenhum usuário adivinha.

**Relação com o SET-14**: o finding original supunha *cache desatualizado*
(mostra a versão anterior à edição). A medição mostra algo diferente e pior:
**não há leitura de cache nenhuma** nesta tela. O SET-14 deve ser
reescrito, não confirmado.

### [FASE-D-05] Criar setlist pela UI falha em silêncio se a descrição ficar vazia — S1

O achado mais grave da fase: **o primeiro passo do J3 é impossível pelo
caminho natural**, e foi ele que bloqueou metade da fila de testes.

**Medição** (item 16, com a resposta do POST instrumentada):

| Payload | Resposta |
|---------|----------|
| `description: null` — o que a UI envia com o campo vazio | **HTTP 400** `Validation failed: description — Expected string, received null` |
| campo `description` omitido | **HTTP 201** |
| `description: "texto"` — usuário preencheu | **HTTP 201** |

**Causa-raiz** (duas linhas, em arquivos diferentes):
- `components/setlist-manager.tsx:106` envia `description: data.description || null`
- `lib/api-validation-middleware.ts:198` declara `description: safeHtml.optional()`
  — e `.optional()` do Zod aceita `undefined`, **não `null`**

**O que o usuário vê**: nada. O diálogo **fecha normalmente**, como se
tivesse funcionado; `toasts_apos_criar` veio **vazio** — sem toast de erro,
sem mensagem, sem realce no campo. A setlist simplesmente não existe. Só
olhando a lista com atenção (ou voltando depois) o usuário descobre.

**Custo real do "criar setlist vazia"** — critério do J3 que a Fase C dava
como ≤3 taps: **7 taps**, sendo 3 desperdiçados na tentativa que falha, 1
para reabrir o diálogo, e 1 obrigatório num campo que a UI rotula como
opcional. E isso só depois de o usuário *descobrir* que a descrição é
obrigatória — descoberta que a UI não oferece de forma alguma.

**Impacto na fase**: os itens 18, 21 e 13 dependiam da setlist criada no
item 16. As três primeiras execuções atribuíram o bloqueio ao rate limit
(FASE-D-01), que de fato também estava acontecendo; só ao instrumentar a
resposta do POST é que a causa real apareceu. Vale como lição de método: um
diálogo que fecha sozinho é indistinguível de sucesso, para um teste
automatizado tanto quanto para um músico.

**Relação com achados existentes**: é o irmão gêmeo do SET-01 (o Zod
descarta `venue`/`performance_date`/`notes`). Ali o schema **ignora** campos
que a UI manda; aqui ele **rejeita a requisição inteira** por causa de um
campo opcional. Mesma causa conceitual: *o schema de validação foi escrito
sem olhar o payload que a própria UI produz*.

### [FASE-D-02] O upload de arquivo descarta todos os metadados digitados — S1

O achado mais concreto da fase, e o mais barato de corrigir.

**Observado**: no item 42 o fluxo J4 foi executado inteiro no mobile —
título "[UX-AUDIT] Fase D import solo", artista "Conjunto Fase D", tom F —
e o item foi salvo. Consultando `GET /api/content` depois:

| Campo | Digitado | Persistido |
|-------|----------|-----------|
| título | `[UX-AUDIT] Fase D import solo` | **`ux-audit-fase-d-cifra.pdf`** |
| artista | `Conjunto Fase D` | **`Unknown Artist`** |
| tom | `F` | **`null`** |

**Causa-raiz** (`hooks/useAddContentLogic.ts`, `handleSaveContent`): o branch
`else if (uploadedFile)` lê `metadata` — o estado do hook, que nunca é
preenchido pelo formulário — em vez de `customMetadata`, que é o objeto que
o `MetadataForm` passa via `onComplete`. O branch vizinho, `else if
(draftContent)`, faz certo (`customMetadata || metadata`). Além disso, o
branch de upload **não envia** `key`, `bpm`, `difficulty`, `album`, `genre`
nem `notes` em nenhuma hipótese.

**Consequências medidas**:
- Dos 10 taps do item 42, **os taps 6, 7, 8 e 9 não produzem efeito nenhum**.
  O orçamento de taps *úteis* é 6 — mas o resultado é um item sem metadados.
- É a explicação real dos itens 30 e 46: o item importado **aparece na
  biblioteca imediatamente e no topo** (a ordenação por mais recente
  funciona), mas com um nome que o usuário não reconhece, e **não é
  encontrável pelo título que ele digitou**.
- Torna o ADD-05 (tom enterrado em "Advanced Options") duplamente perverso:
  custa 2 taps chegar num campo cujo valor é descartado.

**Relação com achados existentes**: engole ADD-04 ("sem defaults
inteligentes") — o problema não é a falta de default, é que **o valor
explícito do usuário é ignorado em favor do filename**.

### [FASE-D-03] Save do add-content faz double-submit — S2

No item 43 o tap em "Save Content" gerou **duas linhas de content com 41 ms
de diferença** (`17:18:12.496` e `17:18:12.537`). Some-se a isso o fato de o
formulário permanecer aberto após o "sucesso" (item 43) e o batch import não
dar confirmação (ADD-02), e o resultado é uma biblioteca que acumula
duplicatas — num app que já tem LIB-03 (duplicados indistinguíveis).

### [FASE-D-04] Storage sem endpoint de listagem: órfãos de upload são irrecuperáveis — S3/estrutural

Promovido de nota operacional a achado por decisão da revisão da fase.

**Fato**: a API de storage expõe apenas `POST /api/storage/upload` e
`POST /api/storage/delete` (por nome exato). **Não existe listagem do
bucket.** Qualquer arquivo cujo upload complete sem virar uma linha de
`content` — exatamente o que os fluxos quebrados do grupo I produzem
(ADD-01/ADD-02: upload OK, save falha ou o usuário é despejado) — fica no
bucket **para sempre, sem nenhum caminho de descoberta**: nem pela UI, nem
pela API, nem por script de manutenção.

**Como se manifestou na prática**: o cleanup do audit só conseguiu cobrir os
órfãos da Fase D porque os testes anotaram cada nome **no instante do
upload** (`orphan-uploads.json`); um único nome perdido por race de captura
quase se tornou lixo permanente (recuperado por sorte, porque aquele save
acabou criando content). O usuário real não tem essa instrumentação: cada
import que falha no meio vaza um arquivo invisível.

**Classe**: estrutural · **Área**: add-content/storage · **Jobs**: J4
(indireto — custo de storage e higiene, não fricção de fluxo).
Candidato a ID definitivo na atualização do ASSESSMENT.

### [FASE-D-01] O rate limit derruba o usuário logado de qualquer rota — S1

Este achado emergiu como *obstáculo à própria medição* e acabou sendo o
resultado mais importante da fase.

**Sintoma observado dezenas de vezes, em todos os grupos de teste**: uma
navegação para `/setlists`, `/library`, `/content/[id]` ou `/performance`
aterrissa em `/login` e, segundos depois, no `/dashboard` — com o usuário
**logado o tempo todo**. Em outras ocasiões a página carrega e o cliente a
descarta segundos depois, exibindo *"Redirecting to dashboard… Failed to
fetch profile"*.

**Mecânica** (código + tráfego observado):
1. Toda rota autenticada é um server component que chama `getServerSideUser`
   → `fetch('/api/auth/verify')` (`lib/firebase-server-utils.ts:101`).
2. `/api/auth/verify` usa o limiter **antigo** (`lib/rate-limit.ts`):
   contador **por IP**, TTL de 60s **renovado a cada request aceito** e
   **compartilhado entre todas as rotas** que usam `withRateLimit`.
3. Sob uso normal-intenso, o verify responde 429 → `getServerSideUser`
   devolve `null` → o server component executa `redirect('/login')`.
4. O cookie de sessão ainda é válido, então `/login` rebota para
   `/dashboard`. O usuário é jogado para a home sem explicação.

**Impacto no J1 (veto)**: no palco, abrir a setlist por link direto ou
navegar entre telas pode devolver o músico ao dashboard, sem mensagem. Foi
necessário implementar retry com 75s de silêncio + fallback de navegação
por sidebar (`tests/ux-audit/fase-d/recorder.ts`) só para conseguir medir.

**Relação com os achados existentes**: é a mesma causa-raiz de AUTH-01 e
SET-05, mas com alcance maior — não afeta só o login e a montagem de
setlist, afeta **qualquer navegação**. Sugere promover o conjunto a um
único achado estrutural: *o app tem dois sistemas de rate limit, e o
antigo (por IP, TTL renovável, compartilhado entre rotas) está no caminho
crítico da autenticação de toda rota autenticada*.

**Evidência**: `data/session-posts.jsonl` (371 POSTs de sessão, 234× 429);
notas "BOUNCE" em praticamente todos os `data/item-NN.json`; traces.

---

## Medições dos jobs vs. alvos do JOBS.md

| Job | Critério (JOBS.md) | Alvo | Medido | Veredito |
|-----|--------------------|------|--------|----------|
| **J1** | Tela inicial → 1ª música em tela cheia | ≤ 4 taps, ≤ 10 s | **3 taps, 5,4 s** (Sign In → Setlists → Start Performance) | ✅ **passa** — mas partindo do dashboard já carregado; ver ressalva abaixo |
| J1 | Avançar para a próxima música | 1 tap, alvo ≥ 48 px | 1 tap, alvo **81×36 px** | ⚠️ **parcial** — 1 tap ✅, altura 36 px < 48 ✗ |
| J1 | Play/pause do auto-scroll | 1 tap, < 100 ms | 1 tap, **41 ms / 57 ms** | ✅ **passa** |
| J1 | Renderizar ao trocar de música | < 1 s | **126 ms / 57 ms / 46 ms** (3 trocas texto→texto) | ✅ **passa** |
| J1 | Dark sheet e zoom sem menu aninhado | ≤ 2 taps cada | **1 tap** cada (barra fixa do header) | ✅ **passa** |
| J1 | Zero estados em que a música quebra | zero | **PDF nunca renderiza** (PERF-02) | ❌ **falha** |
| J1 | Rotação no meio da música | layout sobrevive | landscape↔portrait OK, sem overflow, sem crash; **scroll volta a 0** | ⚠️ **parcial** |
| **J2** | Anotação: intenção → texto salvo | ≤ 5 taps, ≤ 20 s | **inalcançável pela UI** para cifra/letra | ❌ **falha** |
| J2 | Anotação visível na próxima abertura | visível | anotação gravada via API **não aparece** no viewer nem no palco | ❌ **falha** (CONT-03) |
| **J3** | Criar setlist vazia | ≤ 3 taps | **7 taps** — a tentativa de 3 taps falha com 400 e sem aviso (FASE-D-05) | ❌ **falha** |
| J3 | Adicionar cada música | ≤ 3 taps/música | **2,2 taps/música** (picker multi-select: 1 abrir + 10×(busca+seleção) + 1 confirmar), sem sair da tela | ✅ **passa** |
| J3 | Listagem mostra título, artista e tom | os três | título ✅, artista ✅, **tom ausente** | ❌ **falha** (SET-08) |
| J3 | Reordenar a setlist | funciona em touch | drag por toque **não move** (SET-04); controles da linha invisíveis em touch | ❌ **falha** |
| J3 | Montar setlist grande (50+) | sem perda | pediu 56, entraram **38** (429 na 39ª), **sem aviso** | ❌ **falha** (SET-05) |
| **J4** | Upload completo com metadados | ≤ 8 taps, ≤ 60 s | **10 taps, 27 s** | ⚠️ **falha nos taps**, passa no tempo |
| J4 | Erro de arquivo inválido: mensagem específica | acionável | >50 MB → **HTTP 413 sem nenhuma mensagem**; `.zip` como `.pdf` → **aceito** | ❌ **falha** |
| J4 | Item recém-importado localizável pela busca | imediato | ✅ localizável pela busca | ✅ **passa** |
| J4 | Upload com progresso, UI não congela | progresso | UI responsiva (**3–6 ms** de latência de eval durante upload de 25 MB), mas **spinner sem percentual**, sem cancelar | ⚠️ **parcial** |
| **J5** | Dashboard → resultado aberto | ≤ 4 taps, ≤ 10 s | **3 taps, 1,5 s** até a lista de resultados; +1 tap para abrir | ✅ **passa** |
| J5 | Busca parcial por título e por artista | funciona | ✅ ambas | ✅ **passa** |
| J5 | Busca sem resultado tem estado útil | ecoa a query | *"No content found / Try adjusting your search or filters"* — **não ecoa a query** | ⚠️ **parcial** (LIB-08) |
| J5 | Tolerância a typo | — | `ipanma` → 0 hits reais; `aguas` (sem acento) → **0** vs `Águas` → 2 | ❌ **falha** (LIB-04) |
| J5 | Busca de dentro do modo performance | existe? | **não existe**; custo real = 4 taps (sair + buscar), 4,1 s | ❌ **gap confirmado** |
| **J6** | Abrir o app offline e chegar ao conteúdo | funciona | dashboard offline completo (stats 66/3/3 + listas); `/` offline OK | ✅ **passa** |
| J6 | Setlist cacheada abre completa offline (deep link) | completa | shell + navegação + 3/3 músicas alcançáveis offline | ✅ **passa** |
| J6 | Música cujo arquivo nunca foi cacheado | degrada com aviso | setlist **nunca aberta** renderizou a letra inteira offline | ✅ **passa** (melhor que o esperado) |
| J6 | **Chegar à setlist pela navegação normal, offline** | lista disponível | `/setlists` mostra **"No setlists yet"** com 4 setlists na conta | ❌ **falha** (FASE-D-06) |
| J6 | Partitura PDF offline | legível | `<iframe>` presente, **área em branco** — mesmo bloqueio de CSP do PERF-02, não é falha de offline | ❌ **falha** (herdada do PERF-02) |

**Ressalva do J1**: a medição de 3 taps/5,4 s parte do app carregado.
Somando a abertura fria do PWA (`start_url` `/` → landing → "Sign In" →
redirect), o **carregamento inicial da landing sozinho levou 10,3 s** —
acima do orçamento de 10 s do job inteiro, antes do primeiro tap útil.
AUTH-03 confirmado: logado, `/` mostra a landing de marketing.

---

## Respostas item a item

### A. Fluxo J1 completo (medições)

**1. Do tap no ícone do PWA até a primeira música em tela cheia: taps e segundos? Custo do desvio landing → Sign In → /login → redirect (AUTH-03)? Funciona offline?**

- *Procedimento*: `goto /` logado (equivale ao tap no ícone do PWA) → tap "Sign In" → tap "Setlists" → tap "Start Performance" no card da Show padrão, cronometrando até o shell do modo performance ficar visível.
- *Medição*: `/` levou à **landing de marketing** (`https://octavia.rocks/`), não ao dashboard — **AUTH-03 confirmado**. Carga inicial da landing: **10.301 ms**. Desvio Sign In → `/login` → `/dashboard`: **1.174 ms**. Do 1º tap ao conteúdo da 1ª música: **3 taps, 5.390 ms** (shell visível 2.122 ms após o tap final).
- *Veredito*: **passa** no critério ≤4 taps/≤10 s **quando o app já está aberto**; **falha** na abertura fria (10,3 s só de landing antes do primeiro tap). O desvio da landing custa 1 tap e ~1,2 s que não deveriam existir.
- *Offline*: a landing renderiza offline (service worker ativo, escopo `https://octavia.rocks/`) e o tap em "Sign In" **chega ao dashboard populado offline** (stats 60/3/3 e listas visíveis). Funciona.
- *Trace*: `traces/fase-d-a-j1-Grupo-A-—-flux-34f4e-imeira-música-em-tela-cheia-fase-d.zip`, `…-e2234-→redirect-funciona-offline--fase-d.zip`

**2. Latência de troca de música (< 1 s) e resposta do play/pause (< 100 ms)?**

- *Procedimento*: entrada em `/performance` na música 4 (cifra) da Show padrão; 3 taps consecutivos em "Next" cronometrando até o título mudar **e** o conteúdo renderizar; 2 toggles de play/pause cronometrando até o ícone trocar.
- *Medição*: trocas de música **126 ms, 57 ms, 46 ms**; play/pause **41 ms** e **57 ms**.
- *Veredito*: **passa com folga** nos dois critérios (alvos 1.000 ms e 100 ms). Ressalva: todas as trocas medidas foram texto→texto; a troca para uma música com PDF é irrelevante enquanto o PDF não renderiza (item 4).
- *Trace*: `traces/fase-d-a-j1-Grupo-A-—-flux-3bf6c-ca-e-resposta-do-play-pause-fase-d.zip`

**3. Girar o tablet na música 4: o layout sobrevive? O scroll se mantém?**

- *Procedimento*: modo performance na música 4, scroll para 200 px, `setViewportSize` 1194×834 → 834×1194 → volta, medindo geometria e visibilidade dos controles.
- *Medição*: landscape `1194×664 @y=110` → portrait `834×1024 @y=110` → volta a `1194×664`. Botão de sair e barra inferior **visíveis nas três situações**; **sem overflow horizontal**; **sem error boundary**. Porém `scrollTop` **0 → 0**: a posição de scroll não se manteve.
- *Veredito*: **passa** no layout (paddings fixos e barras absolutas sobrevivem), **falha parcial** na preservação do scroll — girar o tablet no meio de uma cifra longa devolve o músico ao topo da música.
- *Trace*: `traces/fase-d-a-j1-Grupo-A-—-flux-21a80-do-tablet-no-meio-da-música-fase-d.zip`

### B. PDF e renderização

**4. [Decide PERF-02] O PDF de 12 páginas renderiza no iframe do modo performance? Scroll por touch? Dark sheet legível? Zoom corta conteúdo?**

- *Procedimento*: Chromium **headed** (com viewer nativo de PDF, ao contrário do headless) em `/performance` na 1ª música da Show padrão, que é o PDF de 12 páginas. Screenshot do render, 6 scrolls de wheel, toggle de dark sheet, 10 taps de zoom-in até 200%.
- *Medição*: o `<iframe>` existe e está dimensionado (`1194×664`), com `src` = **blob URL** (`blob:https://octavia.rocks/…#toolbar=0&…`); o `/api/proxy` respondeu **HTTP 200** quatro vezes (o arquivo chega). Mas a área de conteúdo mostra o **ícone de documento quebrado do Chrome** e, ao rolar, a mensagem **"This content is blocked. Contact the site owner to fix the issue."**
- *Causa-raiz*: header vivo de `https://octavia.rocks/performance` traz `frame-src 'none'; object-src 'none'` (definido em `lib/security-headers.ts`). O modo performance renderiza PDF via `<iframe>` (`components/performance-mode/optimized-content-display.tsx:43`). **A CSP do próprio app proíbe o elemento que a feature usa.** Isso independe de browser: não é artefato do headless.
- *Consequências medidas*: dark sheet aplica `filter: invert(1)` sobre a área quebrada; zoom a 200% via `transform: scale()` **não cria área de scroll** (`scrollWidth == clientWidth == 1194`), então só resta o quadrante superior-esquerdo — a partitura ampliada seria incortornável mesmo se renderizasse. Passada WebKit: o shell do modo performance nem montou em 30 s (`webkit_iframe_presente: false`).
- *Veredito*: **PERF-02 CONFIRMADO como S1 definitivo**, com causa-raiz mais grave que a hipótese original (não é falta de fallback — é a feature proibida por política do app). Contraste importante: o **viewer** (`/content/[id]`) renderiza o mesmo PDF sem problema, porque usa react-pdf em `<canvas>`.
- *Evidência*: `evidence/item-04-chromium-headed-render.png`, `…-apos-scroll.png` (mensagem de bloqueio), `…-dark-sheet.png`, `…-zoom-200.png`
- *Trace*: `traces/fase-d-b-pdf-Grupo-B-—-PDF-*-fase-d.zip`

**5. Apertar play numa partitura PDF: o que o usuário observa?**

- *Procedimento*: modo performance no PDF, tap em play, observação do ícone e do `scrollTop` a cada segundo por 6 s.
- *Medição*: o ícone permaneceu **"play (parado)" nos 7 pontos de amostragem** (t=0 a t=6000 ms) e o `scrollTop` ficou em 0.
- *Veredito*: **PERF-09 confirmado** — o botão não chega nem a mudar de estado. O usuário aperta play e **nada acontece, sem nenhum feedback**: nem movimento, nem erro, nem indicação de que auto-scroll não se aplica a PDF.
- *Evidência*: `evidence/item-05-pdf-apos-play.png`

**6. No viewer, quantos taps da página 1 à 6 de um PDF de 12? Pinch-to-zoom funciona?**

- *Procedimento*: `/content/[id]` do PDF de 12 páginas, 5 taps no chevron de próxima página, lendo o indicador.
- *Medição*: indicador **"Page 1 / 12" → "Page 6 / 12"** em **5 taps / 3,4 s**. Não existe campo para digitar a página. Inventário de controles de zoom no viewer: **lista vazia** — não há botões de zoom nessa tela.
- *Veredito*: **5 taps** para 5 páginas (linear, 1 tap/página) — para a página 12 seriam 11 taps. A parte do pinch-to-zoom é **manual-pendente** (gesto físico); registre-se que também não há botões de zoom como alternativa, ao contrário do que o item pressupunha ("ou só botões de 20%").
- *Evidência*: `evidence/item-06-viewer-pagina-6.png`

**7. Foto vertical de celular (JPG) como partitura: proporção e nitidez sobrevivem?**

- **MANUAL-PENDENTE** — exige foto real de celular. Procedimento e critério em `MANUAL-CHECKLIST.md` § Item 7.

### C. Offline (J6)

**8. Kill + reopen em modo avião com sessão >1h: o app chega ao dashboard ou o middleware bloqueia em `/login` (AUTH-02)? O `setSessionCookie` falhando offline degrada algo visível?**

- *Procedimento*: aquecimento online do `/dashboard`; expiração forçada do `accessToken` no IndexedDB (−2 h) para simular sessão velha; `context.setOffline(true)`; `page.close()` ("kill") e nova page no mesmo contexto ("reopen"); `goto /dashboard` e depois `goto /`.
- *Medição*: `goto /dashboard` offline = **ok**, URL final **`/dashboard`** (não houve expulsão para `/login`), com a tela **completa**: "Total Content 66 / Setlists 3 / Favorites 3 / Recent 10" e as listas Recent/Favorites renderizadas. `goto /` offline também **ok**. Erros de console: vários `net::ERR_INTERNET_DISCONNECTED` e um `Failed to fetch RSC payload … Falling back to browser navigation` — **nenhum deles visível na UI**.
- *Veredito*: **passa**. Com sessão velha + offline, o app **não** bloqueia em `/login`: o service worker serve o shell e o conteúdo cacheado. O `setSessionCookie` falhando offline **não degrada nada visível** — os erros ficam no console. AUTH-02 não se manifesta neste cenário.
- *Limitação anotada*: "kill+reopen" é nova page no mesmo contexto (um contexto novo no Playwright perderia o SW e os caches).
- *Evidência*: `evidence/item-08-dashboard-offline.png`

**9. A setlist cacheada abre completa offline, incluindo PDFs? O que aparece para música cujo arquivo nunca foi cacheado?**

- *Procedimento*: aquecer online as 3 primeiras músicas da Show padrão (a 1ª é o PDF de 12 páginas); ir offline; kill+reopen; reabrir a setlist e percorrer as 3; depois abrir a setlist **Estresse na música 6**, nunca visitada neste contexto.
- *Medição*: reabertura offline **ok**, com o shell do modo performance visível. As 3 músicas: `[UX-AUDIT] Partitura de 12 páginas` → **iframe-pdf**, `[UX-AUDIT] Partitura de 1 página` → **iframe-pdf**, `[UX-AUDIT] Palco` → **texto**. Setlist **nunca cacheada**: abriu normalmente e **renderizou a letra completa** de `[UX-AUDIT] Odeio Você`, com os 60 dots de navegação.
- *Veredito*: **passa, e melhor que o esperado**. A setlist cacheada abre completa offline; e o conteúdo **textual** funciona offline mesmo para músicas **nunca visitadas** — os dados vêm cacheados por atacado, não música a música. O único conteúdo que falha é o **PDF**, com o `<iframe>` presente e a área em branco: é **exatamente o PERF-02** (CSP), o mesmo comportamento que se vê **online**, não uma regressão de offline.
- *Evidência*: `evidence/item-09-offline-musica-1.png` (PDF em branco), `evidence/item-09-nunca-cacheada.png` (letra completa de setlist nunca aberta)

**10. Editar setlist → modo avião → reabrir: a versão cacheada é a anterior à edição (SET-14)?**

- *Procedimento*: renomear a setlist do audit online, ir offline, kill+reopen, reabrir `/setlists` e comparar; depois reconectar e desfazer a edição.
- *Medição*: o rename online ficou visível (`rename_online_visivel: true`). Offline, após kill+reopen, `/setlists` **não mostrou nem o nome novo nem o antigo**: mostrou o **estado vazio** — *"No setlists yet / Create your first setlist to organize songs for your performances"*, com o botão "Create Your First Setlist".
- *Veredito*: **SET-14 não se confirma como descrito — o comportamento real é pior.** A questão "a versão cacheada é a anterior?" não se aplica: **não há versão cacheada alguma** nesta tela. Ver **FASE-D-06**.
- *Evidência*: `evidence/item-10-setlists-offline.png`

### D. Auth e rate limits

**11. [Decide AUTH-01] 5+ trocas de aba em <15 min disparam 429 no `/api/auth/session`? Depois do 429 + token >1h, reload de `/dashboard` expulsa para `/login`?**

- *Procedimento*: 8 POSTs sequenciais a `/api/auth/session` com um idToken válido, 1,2 s entre eles — cada POST equivale a uma volta de aba (ver método no item 12) —, registrando status e headers `X-RateLimit-*` de cada um. Script: `scripts/ux-audit/probe-auth-limit.ts`.
- *Medição*:

  | # | Status | X-RateLimit-Remaining | Retry-After |
  |---|--------|----------------------|-------------|
  | 1 | 200 | 1 | — |
  | 2 | 200 | 0 | — |
  | 3–8 | **429** | 0 | **732 s → 725 s** |

- *Veredito*: **sim, disparam — e o bloqueio é muito mais longo que o suposto.** `X-RateLimit-Limit: 5` por janela de 15 min por IP. Uma vez estourado, o `Retry-After` é de **732 s (12,2 min)**: a renovação de sessão fica indisponível por mais de doze minutos. A janela não desliza a favor do usuário.
- *Segunda metade da pergunta* — "reload de `/dashboard` expulsa para `/login`?": **sim, e não só o `/dashboard`**. É exatamente o mecanismo do **FASE-D-01**, observado dezenas de vezes ao longo da fase: com o orçamento estourado, o `/api/auth/verify` (chamado pelos server components) também responde 429, `getServerSideUser` devolve `null` e **qualquer rota autenticada** executa `redirect('/login')`.
- *Evidência acumulada*: **371 POSTs a `/api/auth/session` ao longo da fase, 234 (63%) com HTTP 429** (`data/session-posts.jsonl`).

**12. Quantos POSTs a `/api/auth/session` um login completo dispara? Login + 3 trocas de aba já estoura o limite de 5?**

- *Procedimento*: leitura do código para estabelecer a equivalência evento → POST, e medição direta no endpoint (mesmo probe do item 11).
- *Método e por que não pela UI*: `contexts/firebase-auth-context.tsx` chama `setSessionCookie()` — 1 POST cada — em **três** lugares: `onAuthStateChanged` (login), handler de `visibilitychange` (**toda volta de aba**) e um `setInterval` de 50 min. Logo, 1 volta de aba = 1 POST, e medir a sequência no endpoint é mais preciso que dirigir `bringToFront()` num browser headless. (A tentativa de login pela UI dentro do runner foi abandonada: `goto('/login')` aterrissava no `/dashboard` já autenticado — comportamento do ambiente de teste, não do produto, já que um browser standalone permanece em `/login` por 20 s; registrado em `data/item-12.json`.)
- *Medição*: **1 POST por login** e **1 por volta de aba**. Header do servidor: **`X-RateLimit-Limit: 5`**.
- *Veredito*: **login (1) + 3 trocas (3) = 4 POSTs — cabem numa janela virgem, com 1 de folga.** A 4ª volta de aba (5º POST) esgota o orçamento e a 5ª recebe 429.
- *Ressalva que a medição tornou visível, e que muda a leitura do achado*: **a janela quase nunca está virgem.** Nesta execução o **primeiro** POST já voltou com `remaining: 1` — 3 dos 5 haviam sido consumidos por atividade normal anterior do mesmo IP. Na prática o músico não dispõe de 5 eventos: dispõe do que sobrou, e não tem como saber quanto é.

**13. [SET-05] Em qual adição o 429 dispara ao montar setlist de 50+? O que o usuário vê e em que estado fica a setlist?**

- *Procedimento*: na setlist do audit (já com 10 músicas), abrir o picker, "Select all" (**"Add 56 Songs"**) e confirmar, instrumentando cada `POST /api/setlists/[id]/songs`, os headers `X-RateLimit-*`, os toasts e a contagem final na UI × servidor.
- *Medição*: **39 POSTs em 30,2 s** — os **38 primeiros com HTTP 201** e o **39º com HTTP 429** (`X-RateLimit-Remaining: 0`, `Retry-After: 60`). O loop abortou aí: das 56 pedidas, **38 entraram** e **18 nunca foram tentadas**.
- *O que o usuário vê*: **`toasts: []`** — nada. O diálogo fechou normalmente. A setlist ficou com **48 músicas** (10 + 38) na UI, **48 no servidor** e **48 após reload**.
- *Veredito*: **SET-05 confirmado**, com dois refinamentos importantes:
  1. O **429 dispara na 39ª adição** deste burst (o limite é 50/60 s **compartilhado por IP entre todas as rotas** — as ~12 requisições restantes do orçamento foram consumidas por page loads e GETs da própria navegação).
  2. **Não há divergência UI × servidor** — a expectativa da Fase C não se confirmou: os 48 batem nos dois lados. O problema é outro e igualmente sério: o usuário pediu **56** e recebeu **48**, **sem uma única palavra de aviso**. A perda é silenciosa e só descobrível contando as músicas.
- *Evidência*: `evidence/item-13-apos-burst.png`, `evidence/item-13-apos-reload.png`

**14. "Continue with Google" (popup) funciona no PWA instalado em tablet?**

- **MANUAL-PENDENTE** — exige PWA instalado em hardware. Procedimento em `MANUAL-CHECKLIST.md` § Item 14.

**15. O balão HTML5 aparece no idioma do SO (pt-BR), divergindo da UI em inglês?**

- *Procedimento*: `/login` deslogado, `form.reportValidity()` para disparar a validação nativa; repetido em Chromium bundled e Chrome real, com `locale: pt-BR` e `--lang=pt-BR`.
- *Medição*: os campos são `<input type="email" required>` e `<input type="password" required>`, **sem `novalidate` e sem mensagens customizadas**. `validationMessage` neste host: **"Please fill out this field."** Botões da tela: "Sign In", "Continue with Google".
- *Veredito*: **confirmado por mecanismo**. A validação é 100% nativa, então o texto do balão segue o idioma do **browser/SO**, não o da aplicação: num iPad com SO em pt-BR virá *"Preencha este campo."* sobre uma UI inteiramente em inglês. Confirmação visual de 10 s incluída no `MANUAL-CHECKLIST.md`.

### E. Setlists (J3)

**16. Adicionar 10 músicas pelo picker: quantos taps por música na prática (alvo ≤3, sem sair da tela)?**

- *Procedimento*: criar a setlist "UX-AUDIT Fase D picker" pelo diálogo da UI (com a resposta do `POST /api/setlists` instrumentada), depois "Add Songs" → buscar e selecionar 10 músicas → confirmar.
- *Medição, parte 1 (criar a setlist)*: a primeira tentativa — nome preenchido, descrição vazia, 3 taps — **falhou com HTTP 400** e o diálogo fechou **sem nenhum toast**. Repetindo o caminho **com a descrição preenchida**: HTTP 201. Custo real: **7 taps**. Ver **FASE-D-05**.
- *Medição, parte 2 (o picker)*: **22 taps para 10 músicas** (1 abrir + 10×(buscar + selecionar) + 1 confirmar) = **2,2 taps/música**, **sem sair da tela** da setlist, e o diálogo fechou com as 10 aparecendo na lista.
- *Veredito*: **o picker passa com folga** (2,2 ≤ 3 taps/música, sem ida-e-volta) — é o ponto mais bem resolvido de toda a área de setlists. Mas o critério vizinho do J3, "criar setlist vazia em ≤3 taps", **falha**: são 7 taps, e só para quem já descobriu que o campo opcional é obrigatório.
- *Evidência*: `evidence/item-16-criacao-falhou.png`, `evidence/item-16-setlist-vazia.png`, `evidence/item-16-setlist-10-musicas.png`

**17. Reorder pós-religação: latência e posições 10000+?**

- **DIFERIDO**, conforme instrução da fase. O handler de drop da UI é um TODO (SET-03) — o reorder nunca chega à API. Religar o fio nesta fase alteraria o objeto medido. Medir quando o fix de SET-03 existir.

**18. Em iPad simulado: o drag inicia com toque? Ícones hover-only aparecem com um tap? Quantos taps até remover?**

- *Procedimento*: contexto com `hasTouch: true` a 1194×834 na setlist do audit; inspeção de `opacity` e tamanho dos botões antes e depois de um tap na linha; drag por `touchStart/touchMove/touchEnd` sobre o grip via CDP; remoção de uma música.
- *Medição*:
  - **Ícones hover-only**: `opacity: 0` **antes do tap e igualmente 0 depois do tap**. Os dois botões da linha ("Start performance from this song" e "Remove song") medem **28×28 px**.
  - **Drag por toque**: `moveu: false` — a primeira linha continuou sendo "[UX-AUDIT] Garota de Ipanema".
  - **Remoção**: **1 tap** (com clique forçado sobre o alvo invisível) removeu a música — de 11 para 10 linhas, sem diálogo de confirmação.
  - O tap na linha **não navegou** para fora do detalhe.
- *Veredito*: **SET-12 e SET-04 confirmados juntos, e o efeito combinado é pior que a soma**. Em touch, os controles da linha **nunca se tornam visíveis** (não há hover num iPad, e o tap não os revela), então "1 tap para remover" é um número teórico: o usuário **não tem como saber que o botão existe**, nem onde. E o drag de reorder **não responde a toque** — a única forma de reordenar é inoperante no dispositivo de palco. Os alvos, quando existem, têm 28 px contra os 48 px recomendados.
- *Nota*: a remoção sem confirmação num alvo invisível é um risco de perda acidental — tocar "por engano" na região onde o botão está remove a música do show sem perguntar nada.
- *Evidência*: `evidence/item-18-touch-remocao.png`. Confirmação física do drag no iPad: `MANUAL-CHECKLIST.md` § Item 18.

**19. Mobile: após tocar num card, quanto scroll até a primeira música do detalhe?**

- *Procedimento*: 390×844 com touch, tap no card "UX-AUDIT Show padrão", medindo a geometria da primeira linha de música.
- *Medição*: o tap **abre o detalhe** (permanece em `/setlists`, sem navegação de rota) e a primeira música fica em `top = 1186 px` num viewport de **844 px** — ou seja, **342 px abaixo da dobra**. `scrollY` permanece **0**: **não há auto-scroll**.
- *Veredito*: o detalhe existe (SET-10 não se confirma como "não leva ao detalhe"), mas **o resultado do tap é invisível**: nada muda na área visível da tela. O usuário toca no card e, sem rolar, não tem sinal de que algo aconteceu.
- *Evidência*: `evidence/item-19-mobile-apos-tap.png`

**20. Scroll da setlist de 60 sem virtualização: jank? Tempo de load de /setlists?**

- *Procedimento*: cronometragem do load de `/setlists` até os cards; abertura do detalhe da Estresse; scroll programático suave de 3 s medindo deltas de frame.
- *Medição*: abrir o detalhe da Estresse: **97 ms**, **60 linhas** renderizadas. Scroll de 3 s: **181 frames, p95 = 16,7 ms, máx = 16,8 ms, 0 frames acima de 2 vsyncs**. Load de `/setlists`: a primeira medição (70 s) está contaminada pelos retries de bounce — não é um número de app.
- *Veredito*: **passa** — sem virtualização e com 60 itens, **não há jank**: o scroll roda cravado em 60 fps. A preocupação de performance do SET-22/PERF-01 **não se materializa** neste volume.
- *Evidência*: `evidence/item-20-estresse-fundo.png`

**21. A constraint `(setlist_id, position)` existe no banco vivo?**

- *Procedimento*: probe autenticado — `POST /api/setlists/[id]/songs` com `position: 1`, já ocupada na setlist do audit.
- *Medição*: **HTTP 201** — aceito. E o corpo da resposta revelou algo além da pergunta: a linha criada veio com **`position: 11`**, não com a posição 1 que foi enviada. **A API ignora a `position` do payload e calcula a sua própria** (final da lista).
- *Veredito*: **a constraint `(setlist_id, position)` NÃO existe no banco vivo.** Isso **reduz o risco do SET-07** (colisão de posição no meio dos 2N UPDATEs do reorder): não há restrição de unicidade para violar. Em compensação, o segundo achado — a API sobrescrever a posição enviada — significa que **qualquer tentativa de inserir numa posição específica é silenciosamente ignorada**, o que precisa ser considerado quando o SET-03 (reorder) for religado.
- *Nota metodológica*: as primeiras tentativas do probe retornaram **401** porque o cookie de sessão do `storageState` carrega um idToken de 1 h já vencido; corrigido lendo o `accessToken` fresco do IndexedDB (`getBearer()` em `recorder.ts`) — o que é, por si, uma confirmação prática do **AUTH-02**.

**22. Bottom nav: a última linha fica encoberta ou o scroll a expõe?**

- *Procedimento*: 390×844, scroll até o fim em `/dashboard` e `/setlists`, medindo a geometria da nav fixa vs. o último elemento de conteúdo.
- *Medição*: bottom nav com **81 px de altura**, topo em `y=763` num viewport de 844. Em `/setlists`, com o scroll no fim, o último elemento ("Start Performance") termina em `y=700` — **0 px encobertos**. Em `/dashboard`, o último bloco de conteúdo passa **766 px** além do topo da nav.
- *Veredito*: **DASH-04 confirmado na medida exata do finding**: a nav ocupa **81 px reais** contra o `pb-16` (64 px) do layout — **17 px de déficit**. O scroll expõe o conteúdo em `/setlists`; o problema aparece no dashboard.
- *Evidência*: `evidence/item-22-fundo-dashboard.png`, `evidence/item-22-fundo-setlists.png`

### F. Library e busca (J5)

**23. [Prioridade LIB-01] `/library` a 1194×834 com IndexedDB frio: monta vazia ou esvazia depois?**

- *Procedimento*: contexto novo (IndexedDB de conteúdo frio), `goto /library`, amostragem da contagem de linhas a cada 500 ms por 12 s, procurando por flash de estado vazio.
- *Medição*: **0 linhas até t≈6,9 s**, depois **8 linhas** (1ª passada) / **20 linhas** (2ª passada) de forma **estável até o fim dos 12 s**. Em nenhuma amostra o estado vazio ficou visível, e em nenhuma a lista **esvaziou depois de montar**.
- *Veredito*: **LIB-01 NÃO reproduzido** neste viewport, nas duas execuções. A lista monta corretamente — mas **demora ~7 s** para aparecer, com a área de conteúdo em branco nesse intervalo. A hipótese "fallback descarta o SSR" não se sustenta como *lista vazia permanente*; o que existe é uma **janela de 7 s de tela vazia sem skeleton**, o que explica plausivelmente as capturas vazias da Fase B (screenshot tirado dentro da janela).
- *Recomendação*: reclassificar LIB-01 de "renderiza vazia" (S1) para "sem loading state por ~7 s" (S2, esforço P: adicionar skeleton).
- *Evidência*: `evidence/item-23-library-12s.png`

**24. Busca do header até resultado renderizado: taps e tempo? Enter funciona?**

- *Procedimento*: `/dashboard` → tap no campo → digitar "Garota" → Enter, cronometrando até o resultado ficar visível.
- *Medição*: **3 taps, 1.565 ms** (Enter → resultado em 1.493 ms). URL final `/library?search=Garota`.
- *Veredito*: **passa com folga** (alvo ≤4 taps/10 s até o resultado *aberto*: 3 taps até a lista, 4 com o tap de abrir). O submit por Enter funciona — o mesmo evento do "Go" do teclado mobile.
- *Evidência*: `evidence/item-24-busca-resultado.png`

**25. "ipanma" e "aguas" (sem acento) com dados reais: algum caso é salvo pelo Postgres?**

- *Procedimento*: quatro buscas por URL (`/library?search=…`) contando resultados.
- *Medição*: `ipanma` → **8 "resultados"**; `aguas` → **0**; `Águas` → **2**; `garota` → **1**.
- *Veredito*: **LIB-04 confirmado, com nuance**. O caso do acento é binário e ruim: **`aguas` = 0 e `Águas` = 2** — a busca é sensível a acento, e quem digita sem acento (o caso comum no celular) não acha nada. O estado vazio mostrado é o genérico *"No content found / Try adjusting your search or filters"*, sem ecoar a query (LIB-08 confirmado). O `ipanma` com 8 hits é **falso positivo do contador do teste** (contou itens do dashboard antes do resultado carregar), não tolerância a typo — a busca é `ILIKE`, não há fuzzy.

**26. Existe caminho para a busca de dentro do modo performance? Quantos taps?**

- *Procedimento*: inventário de todos os controles interativos do modo performance; depois medição do caminho real (sair → buscar).
- *Medição*: os **9 controles** do modo performance são: sair, dark mode, zoom out/in, play/pause, BPM −/+, Prev, Next. **Nenhuma busca**. Caminho real: sair (X) → dashboard → foco na busca → digitar → Enter = **4 taps, 4.078 ms**.
- *Veredito*: **gap confirmado**. O cenário "toca aquela!" custa sair do modo performance — e, pior, o X leva ao **dashboard** (`router.back()`), não de volta à setlist; para retomar o show é preciso refazer a navegação inteira.

**27. Fluxo real de adicionar músicas à setlist partindo da biblioteca?**

- *Procedimento*: abrir o menu de um item da listagem e inventariar as opções.
- *Medição*: o menu tem **exatamente "View", "Edit", "Delete"** — **não há "Add to setlist"**.
- *Veredito*: **confirmado**. Partindo da biblioteca não existe caminho para setlist; o usuário precisa ir a `/setlists` → detalhe → picker (o fluxo do item 16). Como o picker é bom (2,2 taps/música), o gap é de *entrada*, não de eficiência: quem está olhando uma música na biblioteca não consegue agir a partir dali.
- *Evidência*: `evidence/item-27-menu-item-library.png`

**28. Em touch, o gesto rola a ScrollArea interna ou a página? A paginação é alcançável?**

- *Procedimento*: 390×844 com touch, `Input.synthesizeScrollGesture` de 400 px sobre a lista.
- *Medição*: **página rolou 0 px, ScrollArea interna rolou 400 px** — o gesto é capturado pelo scroll aninhado. A paginação **não estava presente no DOM** (lista de resultados curta); bottom nav com topo em `y=763`.
- *Veredito*: **LIB-07 confirmado** na parte do scroll aninhado: o gesto natural rola a lista interna e a página fica parada, então o usuário não alcança o que está abaixo da lista (incluindo a paginação) sem descobrir que precisa arrastar fora da área da lista.
- *Evidência*: `evidence/item-28-mobile-scroll-paginacao.png`

**29. Os badges do dropdown de filtros são tocáveis? Seleção múltipla se comporta?**

- *Procedimento*: abrir o dropdown "Filters", medir os alvos, selecionar "Tab" e depois "Chords", verificar se o menu permanece aberto e se há indicação de filtro ativo.
- *Medição*: o menu **permanece aberto** após a primeira seleção (bom para multi-seleção). Após dois filtros: **20 linhas** na lista e **nenhum chip de filtro ativo nem botão "limpar"** (`temChipDeFiltroAtivo: false`). A medição de alvos retornou lista vazia (os itens do menu Radix não casaram com os seletores usados) — **parcial**.
- *Veredito*: **LIB-06 confirmado** (filtro ativo invisível, sem "limpar"). A parte do tamanho dos alvos ficou **inconclusiva** por seletor.
- *Evidência*: `evidence/item-29-filtros-dropdown.png`, `evidence/item-29-filtros-aplicados.png`

**30. Item recém-importado aparece na biblioteca ao voltar, sem reload manual?**

- *Procedimento*: após o import do item 42, navegar para `/library` (390×844) e procurar o título digitado; inspecionar os primeiros títulos da listagem.
- *Medição*: o título digitado **não aparece** (nem após reload manual). Mas os primeiros itens da listagem são **BATCH TRES, BATCH DOIS, BATCH UM** — os mais recentes, criados minutos antes — seguidos de `ux-audit-fase-d-offline.pdf` (×2) e `ux-audit-fase-d-cifra.pdf`.
- *Veredito*: **o mecanismo funciona; o dado é que está errado.** A ordenação padrão **é** por mais recente e o item importado aparece **imediatamente, no topo, sem reload manual** — o critério do J4 seria atendido. O que falha é o **FASE-D-02**: o item está lá com o nome do arquivo, não com o título digitado. Não há problema de cache de 30 s nem de refresh por foco.
- *Evidência*: `evidence/item-30-library-apos-import.png` (mostra os 3 BATCH no topo e os 3 itens com nome de arquivo logo abaixo)

### G. Viewer e anotações (J2)

**31. Favoritar no viewer, recarregar: a estrela volta ao estado anterior?**

- *Procedimento*: `/content/[id]` de uma cifra favoritada, tap na estrela, observação dos requests de escrita, reload.
- *Medição*: estrela **amarela/preenchida** → após o tap, **cinza/vazia** → **nenhum request de escrita disparado** (`requests_de_escrita_disparados: []`) → após o reload, **amarela/preenchida de novo**.
- *Veredito*: **CONT-05 confirmado em cheio**. O toggle é puramente visual: nada é persistido, e o estado reverte no reload. O usuário "desfavorita" e a mudança se perde silenciosamente.

**32. Do viewer ao canvas de anotação: quantos taps? A anotação salva aparece no viewer/palco?**

- *Procedimento*: inventário dos botões do viewer; tentativa de chegar ao editor; inspeção do editor; probe de round-trip gravando uma anotação em `content_data` via API e reabrindo viewer e modo performance.
- *Medição*: o viewer tem **10 botões**, sendo "Performance" o único nomeado além da navegação — **não há botão Edit** (`viewer_tem_botao_edit: false`), confirmando **CONT-04**. Acessando `/content/[id]/edit` por URL direta (caminho não descobrível pela UI), o editor de cifra mostra "Save Changes", campos de fret/BPM e uma paleta de acordes — **nenhum canvas de anotação** (`canvas_de_anotacao_presente: 0`): o `AnnotationTools` só é montado para Sheet sem arquivo reconhecido. Probe: `PUT /api/content` com uma anotação retornou **200**; reabrindo, a anotação **não aparece no viewer** nem **no modo performance**.
- *Veredito*: **CONT-03 confirmado de forma mais forte que o previsto**. Não é só "write-only": para cifra e letra a anotação é **inalcançável pela UI** (não existe superfície para criá-la) e, mesmo quando gravada por API, **não é renderizada em lugar nenhum**. O passo 3 do J2 ("adicionar uma anotação em um trecho") é **impossível** hoje.
- *Evidência*: `evidence/item-32-editor.png`, `…-viewer-pos-anotacao.png`, `…-performance-pos-anotacao.png`

**33. Tab em formato array: o `overflow-x-auto` é descobrível/operável? Há affordance de corte?**

- *Procedimento*: viewer da tablatura a 1194×834 e a 390×844, inventariando containers com overflow e medindo `scrollWidth` vs `clientWidth`.
- *Medição*: **nenhum container com overflow-x** nas duas larguras (`elementos_overflow_x: []`). A 390 px a tablatura é **quebrada por word-wrap**: `e|---0---|` vira linhas fragmentadas e as 6 cordas perdem o alinhamento vertical.
- *Veredito*: a pergunta fica **prejudicada porque o problema real é pior** — o conteúdo não é *cortado* (com scroll a descobrir), é **destruído** pela quebra de linha. **CONT-02 confirmado ao vivo**: a tablatura é ilegível no viewport mobile. Não há o que descobrir nem operar.
- *Evidência*: `evidence/item-33-tab-390.png`, `evidence/item-33-tab-1194.png`

**34. Botão Performance do header do viewer: latência até tela cheia (J5→J1)?**

- *Procedimento*: caminho completo J5→J1 — dashboard → busca "Garota" → abrir resultado → tap em "Performance", cronometrando shell e conteúdo.
- *Medição*: **1 tap**; shell do modo performance visível em **811 ms**; conteúdo renderizado em **820 ms** (overhead de apenas **9 ms** após o shell).
- *Veredito*: **passa** — a transição viewer→palco é imediata. É o caminho mais rápido para o palco no app inteiro; combinado com o item 24 (3 taps até o resultado), o J5→J1 completo custa ~5 taps e < 3 s.

### H. Modo performance — diversos

**35. Wake lock em iPad e Android real: tela acesa 10 min? Toast cobre controles?**

- **MANUAL-PENDENTE** — exige hardware. Procedimento em `MANUAL-CHECKLIST.md` § Item 35.
- *Evidência colateral colhida*: na captura `evidence/item-36-dots-estresse60.png` o toast de wake lock aparece — *"Heads up! Your browser does not support preventing screen sleep…"* — ocupando o canto superior direito e **cobrindo o botão de dark sheet**. **PERF-08 confirmado** na parte da sobreposição.

**36. Dots de 8 px: taxa de acerto real; e na setlist de 60?**

- *Procedimento*: geometria medida em duas setlists (8 e 60 músicas) no modo performance a 1194×834.
- *Medição*: dots de **8×8 px** com **4 px de espaçamento** nas duas setlists. Largura total: **92 px** (8 músicas) e **716 px** (60 músicas) num viewport de 1194 px — **não transborda**. Prev e Next continuam **dentro da tela** com 60 músicas (`x=126–207` e `x=987–1068`), alvos de **81×36 px**.
- *Veredito*: **PERF-01 NÃO se confirma** neste viewport — com 60 músicas os controles seguem visíveis e utilizáveis. **PERF-06 se confirma na geometria**: 8×8 px é menos de 1/6 do alvo mínimo de 48 px, e com 60 dots o passo é de 12 px entre centros — acertar a música certa sem olhar é inviável. Taxa de acerto humana: manual-pendente.
- *Evidência*: `evidence/item-36-dots-show8.png`, `evidence/item-36-dots-estresse60.png`

**37. `/performance` por deep link: "Go back" do empty state sai do app?**

- *Procedimento*: contexto novo (histórico realmente vazio), `goto /performance` sem parâmetros, tap em "Go back".
- *Medição*: o estado vazio aparece corretamente — *"No song selected / Choose a song or setlist to start performance mode"* + botão "Go back". Após o tap: **`about:blank`**.
- *Veredito*: **PERF-07/beco sem saída confirmado no pior formato**. Com histórico vazio o `router.back()` leva para fora do app — numa aba de browser é a página em branco; num PWA instalado, é sair do app. O botão não deveria usar `back()` e sim navegar para o dashboard.
- *Evidência*: `evidence/item-37-empty-state.png`

**38. Confirmar que nenhum gesto de swipe avança música.**

- *Procedimento*: contexto com touch, swipe horizontal de 500 px para a esquerda e depois para a direita sobre a área de conteúdo.
- *Medição*: título **"[UX-AUDIT] Palco"** antes, depois do swipe à esquerda e depois do swipe à direita — **idêntico nos três**.
- *Veredito*: **confirmado** — não há handler de gesto. No palco, o único jeito de trocar de música é mirar os botões Prev/Next de 36 px de altura.

**39. Tocar nos stat cards do dashboard: confirmar a falsa affordance.**

- *Procedimento*: tap em cada um dos 4 stat cards, verificando navegação e `cursor`.
- *Medição*: "Total Content" → não navega; **"Setlists" → navega para `/setlists`**; "Favorites" → não navega; "Recent" → não navega. `cursor: auto` **nos quatro**.
- *Veredito*: **pior que a hipótese do DASH-02**. Não é "nenhum navega": **um dos quatro navega e três não**, todos com aparência idêntica e sem `cursor: pointer`. Inconsistência é mais confusa que inércia uniforme — o usuário aprende que "cards são clicáveis" com o Setlists e depois toca nos outros sem resposta.

**40. Stat "Recent: 10" vs lista de 5: origem do número.**

- *Procedimento*: leitura do stat e contagem dos itens da lista "Recent Content" (seletores falharam; evidência tomada das capturas do dia).
- *Medição*: o card mostra **"Recent 10 / viewed recently"** e a lista "Recent Content" mostra **exatamente 5 itens** (Bis nº 22, 21, 20, 19, 18) — visível em `evidence/item-25-ipanma.png` e `evidence/item-40-dashboard-recent.png`.
- *Veredito*: **DASH-03 confirmado**: divergência 10 vs 5, sem nenhum caminho para ver os outros 5 (as abas Recent/Favorites mostram o mesmo conjunto).

**41. Recent Content → `/content/[id]`: tempo até render; o voltar preserva aba/scroll?**

- *Procedimento*: dashboard → aba "Favorites" → scroll para 300 px → tap no card `View [UX-AUDIT] Anunciação content` → medir render → `goBack()` e inspecionar aba ativa e scroll.
- *Medição*: **911 ms** até o conteúdo renderizar. Ao voltar: URL `/dashboard`, **aba ativa "Overview"** (não "Favorites") e `scrollY: 0`.
- *Veredito*: **latência passa** (< 1 s), **preservação de estado falha**. O voltar descarta a aba escolhida e a posição de scroll — o usuário que estava navegando os favoritos volta ao topo do "Overview" e precisa refazer a navegação a cada item que abre. Agrava o DASH-03 (abas redundantes): a única aba que o usuário escolhe explicitamente é justamente a que se perde.

### I. Add Content (J4)

**42. Orçamento de taps do J4 no mobile: do dashboard até "Save Content" com PDF de cifra.**

- *Procedimento*: 390×844 com touch; dashboard → "Add" na bottom nav → tipo "Chords" → "Import from File" → Browse files → escolher PDF → título → artista → abrir "Advanced Options" → tom → "Save Content".
- *Medição*: **10 taps, 26.895 ms** (upload HTTP 201). Sequência exata registrada em `data/item-42.json`.
- *Veredito*: **falha no orçamento de taps** (10 > 8) e **passa no tempo** (27 s < 60 s). A estimativa estática da Fase C (~9 taps) era otimista por 1. Os taps 8 e 9 são **só para alcançar o tom** dentro de "Advanced Options" — **ADD-05 confirmado**: sem o tom, o fluxo cairia para 8 taps, exatamente no alvo. O tap 2 existe porque o wizard abre em "Lyrics/Create" (**ADD-09 confirmado**).
- ⚠️ **Descoberta que muda a leitura deste item**: conferindo o resultado pela API, o conteúdo foi salvo como **`ux-audit-fase-d-cifra.pdf` / `Unknown Artist` / `key: null`** — o título, o artista e o tom digitados foram **descartados**. Ver **FASE-D-02**. Na prática, **4 dos 10 taps não fazem nada**: o orçamento "útil" é 6 taps, mas o item resultante não tem metadado algum.
- *Evidência*: `evidence/item-42-passo1.png`, `…-passo2.png`, `…-conclusao.png`

**43. [ADD-01] Forçar falha do POST no passo 2 (offline após o upload): o alert verde aparece?**

- *Procedimento*: upload do PDF online, preenchimento dos metadados, `context.setOffline(true)`, tap em "Save Content".
- *Medição*: alertas capturados na tela: **`["Content saved successfully!"]`**. O formulário permanece **intacto e editável**, com título e artista preenchidos. Conferindo depois no servidor: **duas linhas de content foram criadas**, com 41 ms de diferença (`17:18:12.496` e `17:18:12.537`), ambas com título `ux-audit-fase-d-offline.pdf` e artista `Unknown Artist`.
- *Veredito*: **ADD-01 confirmado, com refinamento importante**. A mensagem de sucesso não é um falso positivo puro — houve criação, só que **duplicada** (ver FASE-D-03) e **com os metadados descartados** (ver FASE-D-02). O usuário lê "salvo com sucesso", continua com o formulário aberto (podendo salvar de novo) e acaba com duplicatas anônimas na biblioteca. A tela ambígua (mensagem de sucesso + formulário ainda editável) é o que convida ao segundo save.
- *Evidência*: `evidence/item-43-save-offline.png`

**44. [Decide ADD-02] Batch import real (TXT com 3 músicas): qual tela aparece após "Import All"?**

- *Procedimento*: `/add-content` → "Import from File" → "Batch Import" → upload do TXT com 3 músicas → "Import All", observando os POSTs e a tela final.
- *Medição*: **3× `POST /api/content` → HTTP 201** (as 3 músicas foram criadas). Tela final: **`mostraCompletion: false`, `mostraTelaDeUpload: true`** — a tela inicial "Drag and drop your file here". Na captura, o StepIndicator mostra **Upload ✓ / Add Details ✓ / Complete ✓** — os três com check verde — enquanto o corpo renderiza o passo 1.
- *Veredito*: **ADD-02 CONFIRMADO como S1 definitivo, e mais grave que o descrito**: não é só "despeja de volta na tela de upload"; a UI **afirma "Complete"** e não dá nenhuma confirmação nem link para a biblioteca. Diante da dúvida, o comportamento natural é repetir o import — gerando duplicatas numa biblioteca que já sofre de LIB-03.
- *Evidência*: `evidence/item-44-batch-preview.png`, `evidence/item-44-apos-import-all.png`

**45. Erro de arquivo real: (a) >50 MB e (b) `.zip` renomeado `.pdf`.**

- *Procedimento*: upload de um PDF de 51 MB e depois de um arquivo com header ZIP nomeado `.pdf`, capturando toasts e status.
- *Medição*: **(a)** `HTTP 413`, **`toasts: []`** — nenhuma mensagem na tela. **(b)** `HTTP 201` — **aceito**, e o wizard **avançou para "Add Metadata"**.
- *Causa-raiz de (b)*: `app/api/storage/upload/route.ts:69-92` compara a **extensão do nome** com `file.type` — que é o MIME **declarado pelo cliente**. Renomear `.zip` → `.pdf` faz o browser declarar `application/pdf` e a checagem passa. **Não há verificação de magic bytes**; o comentário "Check file content consistency" descreve algo que o código não faz.
- *Veredito*: **ADD-07 confirmado e agravado**. O caso (a) é uma **falha muda** — arquivo grande demais simplesmente não acontece, sem o quê nem o porquê, contrariando frontalmente o critério do J4. O caso (b) é um **achado de segurança com consequência de UX**: o usuário sobe um arquivo inválido, preenche metadados, e só descobre no palco que o "PDF" não abre.
- *Evidência*: `evidence/item-45a-51mb.png`, `evidence/item-45b-zip.png`
- *Nota*: neste fluxo o formulário só aparece **após** o upload OK, então não há digitação anterior a se perder — a perda relevante é a do item 43.

**46. Item recém-importado aparece na busca/biblioteca sem reload manual?**

- *Procedimento*: após o import do item 42, buscar pelo título digitado ("Fase D import") na busca do header (`i-verify.spec.ts`).
- *Medição*: **não encontrado** (`localizavel_pela_busca: false`), 3 taps / 3,4 s.
- *Veredito*: **falha no critério do J4** — mas a causa não é a busca nem cache: é o **FASE-D-02**. O título digitado nunca foi persistido, então não há o que buscar. Buscar pelo nome do arquivo (`cifra`) encontraria o item.

**47. Upload de PDF de 20–40 MB com throttling: a UI congela? Dá para cancelar/navegar?**

- *Procedimento*: throttling a ~4 Mbps de upload via CDP, upload de PDF de 25 MB, amostragem do estado da UI e da latência de resposta durante o envio; tentativa de navegar durante.
- *Medição*: durante todo o upload a UI mostra **"Uploading…" com spinner**, **sem percentual** (`temProgressoNumerico: false` em todas as amostras) e **permanece responsiva** (latência de eval de **3–6 ms**). A navegação para `/library` durante o upload **funcionou sem nenhum aviso ou confirmação**.
- *Veredito*: **ADD-06 confirmado**. A UI não congela (bom), mas: sem progresso real o usuário não sabe se faltam 5 s ou 2 min num arquivo de 25 MB; **não há botão de cancelar**; e sair da tela durante o upload é permitido silenciosamente — o upload morre sem aviso e sem registro.
- *Evidência*: `evidence/item-47-durante-upload.png`

**48. Subir `.png` com tipo "Lyrics" selecionado: a troca automática é comunicada?**

- *Procedimento*: selecionar "Lyrics" + "Import from File", inspecionar o `accept` do input e submeter um PNG.
- *Medição*: `accept` do input com Lyrics = **`.pdf,.docx,.txt`** (PNG não está na lista). O arquivo foi aceito pelo input programaticamente, e o resultado foi: **nenhum toast** (`toasts: []`), **nenhum upload disparado** (`upload_statuses: []`), e a tela **permaneceu no passo 1** com "Lyrics" ainda selecionado.
- *Veredito*: **não há troca automática para Sheet** — a hipótese do item não se confirma. O que existe é **rejeição silenciosa**: o `handleFiles` valida a extensão contra a lista permitida e retorna sem fazer nada visível para este caminho. O usuário escolhe um arquivo e **nada acontece**, sem explicação.
- *Evidência*: `evidence/item-48-png-lyrics.png`

**49. Soltar 5 PDFs de uma vez no drop zone: 4 são ignorados sem aviso?**

- *Procedimento*: `DataTransfer` sintético com 5 arquivos PDF distintos, disparando `dragover` + `drop` na zona.
- *Medição*: **1 upload disparado** dos 5; **`toasts: []`**; nenhuma menção a múltiplos arquivos na tela (`mencionaMultiplos: false`); o wizard avançou para o passo 2 com o primeiro arquivo.
- *Veredito*: **ADD-08 CONFIRMADO literalmente**. `handleFiles` faz `const file = files[0]` e descarta o resto. Quatro arquivos desaparecem **sem uma única palavra** — e como o fluxo avança normalmente para o passo 2, o usuário tem todos os sinais de que deu certo.
- *Evidência*: `evidence/item-49-drop-5.png`

---

## Fila fechada — como a segunda passada correu

Os 10 itens que a primeira passada deixou em aberto foram fechados num IP
limpo (hotspot). O que aprendemos ao fechá-los vale registro:

- **A causa do bloqueio era dupla.** O FASE-D-01 (rate limit) era real, mas
  metade do travamento vinha do **FASE-D-05**: `POST /api/setlists`
  respondendo 400 sem que a UI mostrasse nada. Como os itens 18, 21 e 13
  dependiam da setlist criada no item 16, todos herdaram a falha. Só
  instrumentar a resposta do POST revelou a causa real — três execuções
  anteriores atribuíram tudo ao rate limit.
- **Dois testes morreram em timeouts de 10–15 min sem salvar nada.** O
  projeto `fase-d` não definia `actionTimeout`, e o default do Playwright é
  **espera infinita**. Corrigido para 20 s: o travamento vira erro legível
  em segundos. Os recorders também ganharam `try/finally` para salvar
  mesmo quando o teste falha.
- **Itens 11–12 mudaram de método.** O login pela UI dentro do runner
  aterrissava no `/dashboard` já autenticado (um browser standalone
  permanece em `/login` por 20 s — é artefato do ambiente de teste, não do
  produto). Como cada volta de aba equivale a exatamente 1 POST
  `/api/auth/session`, a medição foi feita direto no endpoint
  (`scripts/ux-audit/probe-auth-limit.ts`), o que deu números mais
  precisos do que dirigir `bringToFront()`.

---

## Cleanup — o que o `--dry-run` enxerga

Dry-run ao fim da **segunda** passada (fila fechada), com a setlist do item
16 e as músicas do item 13 já na conta:

```
4 setlists do audit encontradas
  would-delete setlist "UX-AUDIT Fase D picker" (48 músicas)   ← criada na Fase D
66 itens de conteúdo do audit encontrados
2 órfãos de storage da Fase D (orphan-uploads.json)
7 arquivos de storage associados
```

Todos os artefatos das duas passadas estão cobertos: a setlist do picker
pelo prefixo `UX-AUDIT` (com as 48 músicas removidas em cascata pela rota
de DELETE), os 3 conteúdos do batch pelo `[UX-AUDIT]`, os 3 itens com nome
de arquivo pela regra `/^ux-audit[-_]/i`, e os 2 órfãos pelo
`orphan-uploads.json`.

Dry-run da **primeira** passada, para comparação:

```
3 setlists do audit encontradas
  would-delete setlist "UX-AUDIT Estresse" (60 músicas)
  would-delete setlist "UX-AUDIT Show padrão" (8 músicas)
  would-delete setlist "UX-AUDIT Solo" (1 músicas)
63 itens de conteúdo [UX-AUDIT] encontrados
  … inclui "[UX-AUDIT] BATCH UM/DOIS/TRES"  ← criados pela Fase D (item 44)
2 órfãos de storage da Fase D (docs/ux/fase-d/data/orphan-uploads.json)
4 arquivos de storage associados
  would-delete storage "1786218429715-ux-audit-partitura-12p.pdf"   (seed)
  would-delete storage "1786218427769-ux-audit-partitura-1p.pdf"    (seed)
  would-delete storage "1786295958275-ux-audit-fase-d-zip-renomeado.pdf"  ← Fase D
  would-delete storage "1786296073893-ux-audit-fase-d-drop-1.pdf"         ← Fase D
```

**Artefatos novos criados pela Fase D e sua cobertura**:

| Artefato | Origem | Coberto? |
|----------|--------|----------|
| 3 conteúdos "[UX-AUDIT] BATCH UM/DOIS/TRES" | item 44 | ✅ pelo prefixo `[UX-AUDIT]` |
| Upload órfão do `.zip` renomeado | item 45b | ✅ via `orphan-uploads.json` (ajuste desta fase) |
| Upload órfão do drop de 5 PDFs | item 49 | ✅ via `orphan-uploads.json` |
| Setlist "UX-AUDIT Fase D picker" | item 16 | ✅ pelo prefixo `UX-AUDIT` (sem colchetes), quando existir |
| Conteúdo "[UX-AUDIT] Fase D import solo" | item 42 | ✅ pelo prefixo, se o save concluiu |
| Anotação gravada em `content_data` | item 32 | ⚠️ não removida — é campo de item do seed, some junto com o item |
| Upload órfão do item 43 | item 43 | ❌ **não coberto** — ver abaixo |

**Dois ajustes foram necessários no cleanup** (`scripts/ux-audit/cleanup.ts`):

1. **Órfãos de storage**. O script só sabia apagar arquivos alcançáveis pelo
   `file_url` de uma linha de `content`. Os testes de erro do grupo I
   produzem uploads que **nunca viram content** (o arquivo entra no bucket e
   o fluxo morre depois) — esses ficariam para sempre. Agora os testes
   registram cada um em `docs/ux/fase-d/data/orphan-uploads.json` no momento
   do upload, e o cleanup lê esse arquivo.
2. **Conteúdo sem o prefixo `[UX-AUDIT]`** — descoberto ao investigar o
   FASE-D-02. Como o fluxo de upload da UI persiste o **nome do arquivo**
   como título, todo item importado pelos testes ficava **invisível ao
   filtro de prefixo**: eram 3 itens (`ux-audit-fase-d-cifra.pdf`,
   `ux-audit-fase-d-offline.pdf` ×2) que o dry-run anterior não listava. O
   filtro agora aceita também `/^ux-audit[-_]/i`.

Depois dos dois ajustes o dry-run passou de **63 → 66 itens de conteúdo** e
de **4 → 7 arquivos de storage**. Isso também resolveu o resíduo do item 43:
o arquivo dele é alcançável pelo `file_url` da linha de content que o save
acabou criando.

> A API **não tem endpoint de listagem do bucket** (só `POST
> /api/storage/delete` por nome exato) — qualquer órfão cujo nome não seja
> capturado no momento do upload é irrecuperável. A captura foi endurecida
> (`watchUploads().settled()` em `i-add.spec.ts`) justamente por isso.
> Promovido a achado: ver **FASE-D-04**.

---

## Traces: arquivados fora do repositório

Decisão da revisão da fase: `data/` (192 KB) e `evidence/` (3,8 MB) são
versionados; `traces/` (**147 MB**, 35 traces — o do PDF de 12 páginas tem
50 MB sozinho) fica fora do git (`.gitignore`) e foi arquivado em:

```
~/octavia-ux-audit-fase-d-traces-2026-08-09.zip   (147 MB, 36 arquivos)
```

As referências `trace:` nos JSONs de `data/` apontam para
`docs/ux/fase-d/traces/<nome>.zip` — para inspecionar um trace, extrair o
arquivo correspondente do zip para esse diretório e abrir com
`pnpm exec playwright show-trace <arquivo>`.

---

## Notas de método

- **Sem session-intercept**, como pedido: o comportamento real da sessão era
  objeto de medição — e foi ele que produziu o achado principal.
- **Bounce como dado, não como ruído**: cada redirect inesperado foi
  registrado nas observações do item (`data/item-NN.json`) antes de qualquer
  retry. As notas "BOUNCE" espalhadas pelos JSONs são a evidência bruta do
  FASE-D-01.
- **Contornos que não alteram o objeto medido**: retry com 75 s de silêncio,
  fallback de navegação por sidebar, e leitura do `accessToken` fresco do
  IndexedDB para os probes de API (o cookie do `storageState` carrega um
  idToken de 1h vencido — confirmação prática do AUTH-02).
- **Chromium headed** foi obrigatório no grupo B: o headless não tem viewer
  nativo de PDF e produziria um falso "PDF branco" — exatamente a dúvida que
  o item 4 existia para resolver.
- Itens inconclusivos **não** foram convertidos em falha, conforme protocolo.
