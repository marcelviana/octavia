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
| **Respondidas** | 35 | 1–6, 15, 19, 20, 22–34, 36–40, 42–49 |
| **Manual-pendentes** (hardware real) | 3 | 7, 14, 35 |
| **Diferidas** | 1 | 17 (reorder — handler morto, SET-03) |
| **Bloqueadas pelo ambiente** | 10 | 8, 9, 10, 11, 12, 13, 16, 18, 21, 41 |

> 35 + 3 + 1 + 10 = **49**. Além disso, as partes **físicas** dos itens 6,
> 18 e 33 (pinch, drag com o dedo, gesto horizontal) estão no
> `MANUAL-CHECKLIST.md` — a parte automatizável de 6 e 33 já foi respondida
> aqui; a de 18 caiu junto com o bloqueio.

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
| **AUTH-01** | ⚠️ **CONFIRMADO por evidência lateral; medição dedicada pendente** | Não foi possível rodar os itens 11–12 (login limpo + trocas de aba) porque o rate limit já estava saturado pela própria execução. Mas a evidência passiva é contundente: **371 POSTs a `/api/auth/session` observados ao longo da fase, 234 deles (63%) com HTTP 429** (`data/session-posts.jsonl`). Ver FASE-D-01. |

---

## Achados novos da Fase D (não estavam na lista de 49)

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
| **J3** | Criar setlist vazia | ≤ 3 taps | **3 taps** (medido na 1ª execução, antes do bloqueio) | ✅ **passa** |
| J3 | Adicionar cada música | ≤ 3 taps/música | **2,2 taps/música** (picker multi-select: 1 abrir + 10×(busca+seleção) + 1 confirmar), sem sair da tela | ✅ **passa** |
| J3 | Listagem mostra título, artista e tom | os três | título ✅, artista ✅, **tom ausente** | ❌ **falha** (SET-08) |
| **J4** | Upload completo com metadados | ≤ 8 taps, ≤ 60 s | **10 taps, 27 s** | ⚠️ **falha nos taps**, passa no tempo |
| J4 | Erro de arquivo inválido: mensagem específica | acionável | >50 MB → **HTTP 413 sem nenhuma mensagem**; `.zip` como `.pdf` → **aceito** | ❌ **falha** |
| J4 | Item recém-importado localizável pela busca | imediato | ✅ localizável pela busca | ✅ **passa** |
| J4 | Upload com progresso, UI não congela | progresso | UI responsiva (**3–6 ms** de latência de eval durante upload de 25 MB), mas **spinner sem percentual**, sem cancelar | ⚠️ **parcial** |
| **J5** | Dashboard → resultado aberto | ≤ 4 taps, ≤ 10 s | **3 taps, 1,5 s** até a lista de resultados; +1 tap para abrir | ✅ **passa** |
| J5 | Busca parcial por título e por artista | funciona | ✅ ambas | ✅ **passa** |
| J5 | Busca sem resultado tem estado útil | ecoa a query | *"No content found / Try adjusting your search or filters"* — **não ecoa a query** | ⚠️ **parcial** (LIB-08) |
| J5 | Tolerância a typo | — | `ipanma` → 0 hits reais; `aguas` (sem acento) → **0** vs `Águas` → 2 | ❌ **falha** (LIB-04) |
| J5 | Busca de dentro do modo performance | existe? | **não existe**; custo real = 4 taps (sair + buscar), 4,1 s | ❌ **gap confirmado** |
| **J6** | — | — | **pendente** (grupo C não rodou) | — |

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

- **BLOQUEADO** nesta passada (spec pronto em `c-offline.spec.ts`, com expiração forçada do token no IndexedDB e kill+reopen por nova page no mesmo contexto).
- *Evidência parcial já coletada* (item 1, teste `item-01b`): com o service worker ativo no escopo raiz, **`/` abre offline e o tap em "Sign In" chega ao dashboard populado offline** — stats "60 / 3 / 3" e listas Recent/Favorites renderizadas. Ou seja, na sessão *fresca* o app não bloqueia em `/login`. Falta exatamente a variável do item: **sessão com mais de 1 h**.

**9. A setlist cacheada abre completa offline, incluindo PDFs? O que aparece para música cujo arquivo nunca foi cacheado?**

- **BLOQUEADO** nesta passada (spec pronto: aquece 3 músicas online, vai offline, percorre as 3 e depois tenta uma setlist nunca aberta).
- *Nota que já se pode adiantar*: qualquer resposta sobre "PDFs offline" no modo performance é **moot enquanto o PERF-02 existir** — o PDF não renderiza nem **online**, por CSP. O que este item ainda mede de útil é o comportamento de **texto** (cifra/letra) offline e o estado da música nunca cacheada.

**10. Editar setlist → modo avião → reabrir: a versão cacheada é a anterior à edição (SET-14)?**

- **BLOQUEADO** nesta passada (spec pronto; renomeia a setlist do audit, vai offline, reabre e depois desfaz a edição).

### D. Auth e rate limits

**11. [Decide AUTH-01] 5+ trocas de aba em <15 min disparam 429 no `/api/auth/session`? Depois do 429 + token >1h, reload de `/dashboard` expulsa para `/login`?**

- **BLOQUEADO** para a medição controlada (spec pronto em `rl-auth.spec.ts`: login real pela UI, trocas de aba contadas, e injeção do cookie antigo para simular token vencido).
- *Evidência passiva conclusiva quanto ao 429*: ao longo de toda a fase foram observados **371 POSTs a `/api/auth/session`, dos quais 234 (63%) responderam HTTP 429** (`data/session-posts.jsonl`). O limite de 5/15 min por IP **é atingido em uso normal**, sem esforço para provocá-lo.
- *Quanto à segunda metade da pergunta* ("expulsa para `/login`?"): **sim, e por um caminho ainda pior que o previsto** — o FASE-D-01 mostra que a expulsão acontece em **qualquer rota autenticada**, não só após reload do dashboard, porque o 429 atinge `/api/auth/verify` no server component. Foi observada dezenas de vezes.

**12. Quantos POSTs a `/api/auth/session` um login completo dispara? Login + 3 trocas de aba já estoura o limite de 5?**

- **BLOQUEADO** para a contagem controlada (exige contexto deslogado e janela limpa de limiter).
- *Do código, para orientar a medição*: `contexts/firebase-auth-context.tsx` chama `setSessionCookie` em **três** lugares — no `onAuthStateChanged` (login), no `visibilitychange` (toda volta de aba) e num `setInterval` de 50 min. Cada chamada é 1 POST. Isso torna a hipótese do item ("login + 3 trocas de aba ≥ 5") aritmeticamente plausível: 1 (login) + 3 (trocas) = 4, e qualquer quarta volta de aba estoura.

**13. [SET-05] Em qual adição o 429 dispara ao montar setlist de 50+? O que o usuário vê e em que estado fica a setlist?**

- **BLOQUEADO** nesta passada (spec pronto em `rl-13.spec.ts`; depende da setlist do item 16, que não pôde ser criada). O teste já instrumenta a sequência de status por POST, os headers `X-RateLimit-*`, os toasts na tela e a divergência entre a contagem local da UI e a do servidor.
- *Do código, para orientar a leitura*: `handleAddSongsToSetlist` (`components/setlist-manager.tsx:161`) faz um `for` **sequencial com `await`** e **aborta no primeiro erro**, mas só depois de já ter empurrado os itens anteriores para o estado local — daí a expectativa de divergência UI × servidor que o teste mede.

**14. "Continue with Google" (popup) funciona no PWA instalado em tablet?**

- **MANUAL-PENDENTE** — exige PWA instalado em hardware. Procedimento em `MANUAL-CHECKLIST.md` § Item 14.

**15. O balão HTML5 aparece no idioma do SO (pt-BR), divergindo da UI em inglês?**

- *Procedimento*: `/login` deslogado, `form.reportValidity()` para disparar a validação nativa; repetido em Chromium bundled e Chrome real, com `locale: pt-BR` e `--lang=pt-BR`.
- *Medição*: os campos são `<input type="email" required>` e `<input type="password" required>`, **sem `novalidate` e sem mensagens customizadas**. `validationMessage` neste host: **"Please fill out this field."** Botões da tela: "Sign In", "Continue with Google".
- *Veredito*: **confirmado por mecanismo**. A validação é 100% nativa, então o texto do balão segue o idioma do **browser/SO**, não o da aplicação: num iPad com SO em pt-BR virá *"Preencha este campo."* sobre uma UI inteiramente em inglês. Confirmação visual de 10 s incluída no `MANUAL-CHECKLIST.md`.

### E. Setlists (J3)

**16. Adicionar 10 músicas pelo picker: quantos taps por música na prática?**

- *Procedimento*: criar a setlist "UX-AUDIT Fase D picker", abrir "Add Songs", buscar e selecionar 10 músicas, confirmar.
- *Medição (1ª execução, antes do bloqueio de ambiente)*: **criar setlist vazia = 3 taps**; adicionar as 10 = **22 taps** (1 abrir + 10×(buscar + selecionar) + 1 confirmar) = **2,2 taps/música**, **sem sair da tela** da setlist.
- *Veredito*: **passa** nos dois critérios do J3 (≤3 taps para criar, ≤3 taps/música sem ida-e-volta). O picker multi-select é o ponto **mais bem resolvido** do fluxo de setlists.
- *Ressalva*: as re-execuções para consolidar a evidência foram bloqueadas pelo FASE-D-01 (3/3 bounces em `/setlists`). O número acima vem da passada que completou; item marcado para re-confirmação.

**17. Reorder pós-religação: latência e posições 10000+?**

- **DIFERIDO**, conforme instrução da fase. O handler de drop da UI é um TODO (SET-03) — o reorder nunca chega à API. Religar o fio nesta fase alteraria o objeto medido. Medir quando o fix de SET-03 existir.

**18. Em iPad simulado: o drag inicia com toque? Ícones hover-only aparecem com um tap? Quantos taps até remover?**

- *Procedimento*: contexto com `hasTouch: true` a 1194×834, tap na linha, inspeção de `opacity` dos botões, sequência `touchStart/touchMove/touchEnd` sobre o grip via CDP.
- *Medição*: **bloqueado pelo FASE-D-01** — o teste chegou a recuperar `/setlists` via sidebar numa das tentativas, mas depende da setlist do item 16, que não pôde ser criada.
- *Veredito*: **inconclusivo por ambiente**. A parte física (drag com o dedo real) permanece no `MANUAL-CHECKLIST.md` § Item 18 independentemente.

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

- *Procedimento*: probe autenticado — `POST /api/setlists/[id]/songs` com uma `position` já ocupada na setlist do audit.
- *Medição*: **bloqueado** — depende da setlist do item 16, que não pôde ser recriada.
- *Veredito*: **inconclusivo por ambiente**. Nota metodológica: as primeiras tentativas do probe retornaram **401** porque o cookie de sessão do `storageState` carrega um idToken de 1h já vencido; corrigido lendo o `accessToken` fresco do IndexedDB (`getBearer()` em `recorder.ts`) — o que é, por si, uma confirmação prática do **AUTH-02**.

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

- **Bloqueado nesta passada** pelo FASE-D-01. Spec pronto em `h-perf.spec.ts`.
- *Dado adjacente já disponível*: o item 34 mediu o caminho equivalente (resultado de busca → viewer → performance) com **811 ms** até a tela cheia, então a latência de render do viewer não é preocupante; o que falta medir é só a **preservação de aba/scroll no voltar**.

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

## O que falta rodar

Todos os specs estão escritos, validados e prontos; o que faltou foi
**janela de ambiente**, pela razão que virou o achado FASE-D-01.

| Itens | Spec | Pré-condição |
|-------|------|--------------|
| 16, 18, 21 | `e-setlists.spec.ts` | janela sem 429 (a setlist do picker precisa ser criada) |
| 41 | `h-perf.spec.ts` | janela sem 429 |
| 8, 9, 10 (offline/J6) | `c-offline.spec.ts` | janela sem 429; ~25 min |
| 13 (SET-05) | `rl-13.spec.ts` | setlist do item 16 existindo |
| 11, 12 (AUTH-01) | `rl-auth.spec.ts` | 15+ min de cooldown após o item 13 |

Ordem recomendada, respeitando o protocolo de segurança de rate limit:
`e-setlists -g "item-16|item-18|item-21"` → `h-perf -g item-41` →
`c-offline` → **`rl-13`** → cooldown de 15+ min ou troca de IP → **`rl-auth`**.

**Recomendação prática**: rodar essa fila **de um IP diferente** (ou com o
app apontado para um deploy de preview). O limiter é por IP e esta máquina
está queimada há horas — foi o que impediu o fechamento. Como o FASE-D-01 já
está caracterizado com causa-raiz e evidência quantitativa, os itens 11–13
passam a ser **confirmação de números**, não descoberta.

---

## Cleanup — o que o `--dry-run` enxerga

`pnpm tsx scripts/ux-audit/cleanup.ts --dry-run` (executado ao fim desta passada):

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
