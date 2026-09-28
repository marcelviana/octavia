# I1-PR-9 — anexos: superfície 4, content lista (`/dashboard`, `/library`) e a casca

> **Bloco** I1 — identidade. **PR** de superfície 4, a primeira **com sessão** e a que faz nascer a **casca** (barra
> superior no lugar da lateral), no molde das I1-PR-6/7/8 (`docs/ux/I1-PR6-anexos/README.md` §12,
> `I1-PR7-anexos/README.md` §16, `I1-PR8-anexos/README.md` §16).
> Branch `i1/pr9-content-lista`, árvore `../octavia-i1-pr9`, criada de `origin/main` =
> `462b269759213d2f81e032223a3fa58e57d03e23` (`Merge pull request #343`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR8-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 12.1s using pnpm v10.28.0`. **Data**: 2026-09-28.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 696**, numeração conferida pela coluna:
> `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | … | sort -n | tail -1` → 695.
> **Estado**: commit 1 (gate-first, `d991c73`) e **commit 2 (a implementação, §11–§16)**. Divergências: 696–712 (§8),
> 713–725 (§14). Aguarda o aceite do Marcel (`scripts/gates-web/COMO-RODAR.md`, seção I1-PR9).

| arquivo | o que é |
|---|---|
| `cn/g-tok-main.txt` | G-tok (ii) com os 18 arquivos que sobrevivem, sobre o código da `main` — **REPROVA 597** |
| `cn/g-faixa-esperado.txt` | a folha `4-content-lista` medida → `tests/gates-web/esperado/4-content-lista.json` |
| `cn/g-faixa-esperado-ancoras.txt` | a folha re-medida com as âncoras da casca (`porSeletor`); o `1-auth` byte a byte igual |
| `cn/g-tok-depois.txt` · `g-back-depois.txt` · `g-palco.txt` · `pnpm-test.txt` · `cn-pr1.txt` · `lint.txt` · `build.txt` | os verdes do commit 2 |
| `cn/painel-mutacao-cn.txt` | o teste do painel reprovando com o erro virando vazio, e passando depois de desfeito |
| `cn/inercia-publicas.txt` · `cn/inercia-comparar.mjs` | o CN de inércia das públicas (sem `.env`) e o comparador |

---

## 1. Inventário `[medido]`

`wc -l` da árvore e os imports de cada arquivo (`grep -n import`). **Destino** é a proposta do commit 2 (§9).

### 1.1 As duas páginas

| arquivo | linhas | importa (o que pesa) | destino |
|---|---|---|---|
| `app/dashboard/page.tsx` | 46 | `requirePageUser`, `getUserContentServer`, `getUserStatsServer` (SSR, Supabase direto), `DashboardPageClient`, tipo `ContentItem` | **fica** (ganha a distinção vazio × erro, §2.2) |
| `app/library/page.tsx` | 54 | `requirePageUser`, `getUserContentPageServer` (SSR, página 1, `pageSize` 20), `LibraryPageClient` | fica, sem mudança de dados |
| `components/dashboard-page-client.tsx` | 44 | `Dashboard`, **`ResponsiveLayout`** | fica; troca a casca |
| `components/dashboard.tsx` | 397 | `ui/card`, `ui/tabs`, `ui/button`, `lucide-react`, `next/link` | **fica e se reescreve** pela folha (sai de 397 → partes < 150, CLAUDE.md) |
| `components/library-page-client.tsx` | 70 | `next/dynamic` (`Library`, `ssr:false`, *"Loading library..."* `:13`), **`ResponsiveLayout`** | fica; troca a casca e o texto do carregando |
| `components/library.tsx` | 2 | reexport de `RefactoredLibrary` | fica |
| `components/library/index.ts` | 11 | barril | fica |
| `components/library/RefactoredLibrary.tsx` | 172 | `useLibraryData`, `useContentActions`, `useNavigationActions`, `DeleteContentDialog`, `library-utils`, os seis abaixo | fica (a composição) |
| `components/library/LibraryHeader.tsx` | 185 | `ui/button`, `ui/badge`, `ui/select`, `ui/dropdown-menu`, `lucide-react` | fica, reescrito (Filtros · ordenar · Adicionar) |
| `components/library/OptimizedLibraryList.tsx` | 255 | `ui/card`, `ui/button`, `ui/dropdown-menu`, `ui/badge`, `ui/scroll-area`, `lucide-react` | fica, reescrito (a linha de 80, Favoritar, Mais) |
| `components/library/LibraryPagination.tsx` | 82 | `ui/pagination` | fica, reescrito |
| `components/library/LibraryEmptyState.tsx` | 55 | `ui/card`, `ui/button`, `lucide-react` | fica, reescrito (vazio e vazio-busca) |
| `components/library/LibraryLoadingState.tsx` | 22 | `ui/card` | fica, reescrito |
| `components/library/LibraryErrorBoundary.tsx` | 80 | `ui/card`, `ui/button`, `lucide-react` | fica; o *fallback* vira a `LinhaDeAviso` (nota de `LIB-erro`) |
| `components/delete-content-dialog.tsx` | 30 | `ui/dialog`, `ui/button` | fica, reescrito (diálogo da folha); **só a biblioteca o importa** |
| `hooks/use-library-data.ts` | 259 | `getUserContentPage` (cliente → `GET /api/content`) | fica; **destampa o erro** (§2.2) |
| `hooks/use-content-actions.ts` | 160 | `toast` do **sonner** (`:5`, `:58`, `:104`), `deleteContent`, `toggleFavorite` | fica; **o toast sai** (I1-D26; decisão 7 da folha) |
| `lib/library-utils.ts` | — | `types/content` | fica; `formatLibraryDate` (`en-US`, `:7-14`) e os rótulos em inglês dos filtros (`:94-112`) vão para pt-BR |

**Testes da lista velha** (`git grep` dos nomes acima em `*.test.*`, `tests/**`, `__tests__/**`): só
`hooks/__tests__/use-library-data.test.tsx` (228 linhas) — **fica e se adapta** (o hook passa a expor o erro). E
`lib/__tests__/content-service.test.ts` testa `getUserContent` (`:24-80`) e `getUserContentServer` (`:169-199`): se a
decisão 4 (§9) mudar o retorno na falha, os casos de erro se adaptam. **Nenhum teste de componente** da biblioteca,
do painel nem da casca.

### 1.2 A casca velha e quem a importa

| arquivo | linhas | importa | destino |
|---|---|---|---|
| `components/responsive-layout.tsx` | 107 | `Header`, `NavigationContainer`; raiz `h-screen overflow-hidden` (`:78`); `md:ml-72`/`md:ml-20` (`:98`) | **morre** |
| `components/header.tsx` | 96 | `ui/button`, `ui/input`, `next/image` (ícone + *wordmark* `webp`), `UserHeader`; busca → `/library?search=` (`:26-34`) | **morre** (a busca vai para a casca, mesmo destino) |
| `components/navigation-container.tsx` | 104 | `Sidebar`, `BottomNav` (retrato ≤ 1024 → barra de baixo, `:26-54`) | **morre** |
| `components/sidebar.tsx` | 123 | `ui/button`, `ui/tooltip`, `lucide-react`; *"Navigation"*, *"Dashboard"*, *"Library"*, *"Setlists"*, *"Add Song"* (`:47-52`, `:81`) | **morre** |
| `components/bottom-nav.tsx` | 55 | `ui/button`, `lucide-react`; *"Home"*, *"Library"*, *"Setlists"*, *"Add"* (`:18-23`) | **morre** |
| `components/user-header.tsx` | 74 | `useAuth`, `ui/button`, `ui/avatar`, `ui/dropdown-menu`; menu = rótulo (nome + e-mail) + *"Sign out"* (`:59-71`); **o link de `/profile` já saiu** (PR-3; div. 697) | **morre** (a conta vai para a casca) |

**Quem importa `ResponsiveLayout`** — os seis *page-clients* com sessão (`git grep responsive-layout`):

| arquivo | linha | corpo |
|---|---|---|
| `components/dashboard-page-client.tsx` | `:5`, `:34` | **redesenhado nesta PR** |
| `components/library-page-client.tsx` | `:5`, `:55` | **redesenhado nesta PR** |
| `components/content-page-client.tsx` | `:6`, `:58` | velho (folha 5, PR-10) |
| `components/content-edit-page-client.tsx` | `:6`, `:47` | velho (folha 6, PR-11) |
| `components/add-content-page-client.tsx` | `:13`, `:60` | velho (folha 7, PR-12) |
| `components/setlists-page-client.tsx` | `:6`, `:59` | velho (folha 8, PR-13) |

Os seis passam `activeScreen` + `onNavigate` (um `router.push('/<tela>')`); a casca nova navega por `<Link>` com o ativo
pelo `usePathname()` — mesmos quatro destinos (`/dashboard`, `/library`, `/setlists`, `/add-content`). Nos quatro de
corpo velho a mudança é **só a troca do import e do invólucro** (o estado `activeScreen` e o `handleNavigate` ficam sem
uso e saem). Nenhum deles entra na lista do G-tok.

**Não há `layout` com sessão** (div. 710): o único `layout.tsx` é o `app/layout.tsx` raiz; a casca é montada por cada
*page-client*. **G-back**: nenhum dos arquivos acima está em `scripts/gates-web/g-back-nucleo.txt` (43 linhas: rotas de
API, `lib/*` de servidor, `middleware.ts`, `next.config.mjs`, `supabase/*`, `types/{content,database.types,setlist}.ts`);
`lib/content-service-server.ts` **está** — só é tocado se a decisão 4 escolher (b).

**Órfão fora do escopo**: `contexts/sidebar-context.tsx` só é importado pelo próprio teste
(`contexts/__tests__/sidebar-context.test.tsx`) — não é da casca de hoje; fica (div. 711).

### 1.3 A `LinhaDeAviso` sobe para `components/identidade/`

`components/auth/linha-de-aviso.tsx` (71 linhas) é importada por **seis** arquivos: `login-panel.tsx:16`,
`signup-panel.tsx:14`, `aviso-de-sessao.tsx:5` (relativos) e `app/forgot-password/page.tsx:19`,
`app/signup/confirm-email/page.tsx:18`, `app/verify-email/page.tsx:17`. O commit 2 a move para
`components/identidade/linha-de-aviso.tsx` (mesmo DOM, mesmas classes; os seis passam a importar de lá; a lista do
G-tok troca o caminho) — **extra declarado**, como o `LinkBotao` na I1-PR-7.

## 2. Os estados: a matriz × a folha `[lido]`

A folha tem **16 `data-estado`**: 15 estados + a seção `Tokens` (sem moldura, como a 643). A matriz do pre-check
(`I1-PRECHECK-anexos/matriz-estados.txt:107-170`) é de `c57d81f`; as linhas abaixo são as de hoje (a PR-3 tirou o
cache offline do `use-library-data.ts`).

### 2.1 Os 15 estados

| estado da folha | nasce em (hoje) | frase de hoje | o que muda |
|---|---|---|---|
| `DASH` | `dashboard.tsx:76-…` (aba *Overview*) | "Dashboard", "Add Content", "Overview"/"Recent"/"Favorites", 4 cartões com sub-rótulo, "Recent Content"/"Favorite Content" | a folha |
| `DASH-vazio` | `dashboard.tsx:216-220`, `:271-275` (e as abas `:330`, `:387`) | "No recent content" / "No favorite content" (+ ⭐ caractere); contadores `stats?.x \|\| 0` (`:123`, `:137`, `:151`, `:165`) | frases §5.5; "0" é dado |
| `DASH-vazio-favoritas` | `dashboard.tsx:271-275` | "No favorite content" | idem |
| `DASH-erro` | **não existe**: o erro vira vazio **no servidor** (§2.2) | — (mostra "No recent content" e zeros) | **destampar**: contadores "—", listas sem frase de vazio, `LinhaDeAviso` `dash.erro` + *Tentar de novo* |
| `SESSAO-nao-renovada` | `components/auth/aviso-de-sessao.tsx:14-31`, montado pelo provider (`contexts/firebase-auth-context.tsx:524`) em `sticky top-0 … p-2` **acima de tudo** | as frases da PR-1 (`frases-sessao.ts`) | a folha a põe **abaixo do título, dentro da página** (div. 704) |
| `LIB` | `RefactoredLibrary.tsx:136-168` + `OptimizedLibraryList.tsx:68-212` | "Your Music Library", "Manage and organize…", "Filters", "Sort", "Add Content", linha com tom/dificuldade/data/estrela/⋮ | a folha (div. 705) |
| `LIB-filtros` | `LibraryHeader.tsx:83-153` | "Filter By", "Content Type" (Tab·Chords·Sheet·Lyrics), "Difficulty" (Beginner…), "Favorites only" | §5.5 `lib.filtros` |
| `LIB-mais` | `OptimizedLibraryList.tsx:175-206` | "View" · "Edit" · "Delete" | §5.5 `lib.menu` |
| `LIB-salvo` | **não existe na biblioteca**: é o toast do **editor**, `content-edit-page-client.tsx:34-35` (`toast.success("Changes saved successfully")` + `router.push("/library")`) | "Changes saved successfully" (sonner) | div. 703 |
| `LIB-carregando-chunk` | `library-page-client.tsx:8-18` (o `loading` do `dynamic`) | "Loading library..." | `lib.carregando` |
| `LIB-carregando` | `RefactoredLibrary.tsx:82-85` → `LibraryLoadingState.tsx:6-19` (só com a lista vazia) | "Loading your music library..." + "Please wait while we fetch your content" | `lib.carregando`; o apoio sai (nota da folha) |
| `LIB-vazio` | `RefactoredLibrary.tsx:77-80` → `LibraryEmptyState.tsx:28-51` | "No content found" / "Add your first piece of music content to get started" + "Add Content" | `lib.vazio` / `.apoio` + *Adicionar* |
| `LIB-vazio-busca` | `LibraryEmptyState.tsx:38-40` (`hasActiveFilters` ou busca) | "No content found" / "Try adjusting your search or filters" + "Add Content" | `lib.vazio.busca` / `.apoio`; **sem** o botão (a folha não o desenha) |
| `LIB-erro` | **não existe**: o erro vira vazio no cliente (§2.2) | — (mostra o `LIB-vazio`) | **destampar**: `LinhaDeAviso` `lib.erro` com o motivo por espécie + *Tentar de novo*, sem frase de vazio |
| `LIB-apagar` | `delete-content-dialog.tsx:13-29`, aberto por `use-content-actions.ts:128-131` | "Delete Content" / "Are you sure you want to delete "{título}"? This action cannot be undone." · "Cancel" · "Delete" | §5.5 `lib.apagar.*` |

### 2.2 Onde o erro é engolido — o que o commit 2 destampa

**Painel — no servidor** (SSR; nenhum request do navegador carrega os dados — div. 698, 699):

| arquivo:linha | o que faz |
|---|---|
| `lib/content-service.ts:127-130` | `getUserContent`: `if (error) { logger.error(…); return [] }` — a falha do banco vira lista vazia |
| `lib/content-service.ts:133-135` | `getUserContent`: `catch` → `return []` (inclui o *"User not authenticated"* lançado em `:117`) |
| `lib/content-service.ts:623-633` | `getUserStats`: `{ count: totalContent }` e `{ count: favoriteContent }` **sem ler o `error`** da resposta — falha vira `null` → `0` (`:653`, `:655`) |
| `lib/content-service.ts:637-647` | contagem de setlists: o `try/catch` não pega erro do Supabase (que não lança); `count \|\| 0` |
| `lib/content-service.ts:658-666` | `getUserStats`: `catch` → quatro zeros |
| `components/dashboard.tsx:123`, `:137`, `:151`, `:165` | `stats?.x \|\| 0` — `null` também vira "0" |

Quem chama (`git grep -nw`): **só o painel** — `app/dashboard/page.tsx:25-26` → `lib/content-service-server.ts:24,28`
(`getUserContentServer`) e `:84,88` (`getUserStatsServer`); mais os testes de `lib/__tests__/content-service.test.ts`.
Mudar o retorno na falha não alcança outra tela.

**Biblioteca — no cliente**:

| arquivo:linha | o que faz |
|---|---|
| `hooks/use-library-data.ts:135-148` | `catch` da carga: loga; `PGRST103` volta à página 1 (`:139-142`); **sem lista na tela, `setContent([])`/`setTotalCount(0)`** (`:145-148`) → o `LIB-vazio` de primeira vez; com lista na tela, **mantém a lista** (sem indicador, como a folha quer: "revalidar com a lista na tela não tem indicador hoje e continua sem") |
| `lib/content-service.ts:269-274` | a resposta `!ok` vira `Error(errorData.error \|\| 'API request failed: <status>')` — **o status se perde** (a mensagem é a do corpo); rede é o `TypeError` do `fetch` |
| `lib/content-service.ts:292-297` | com `useCache`, o erro devolve o cache velho (30 s, em memória) — fica: é cópia na tela, sem frase (N3) |
| `lib/content-service.ts:301-313` | **timeout** vira `{ data: [], total: 0, …, error: "Request timed out…" }` — o hook ignora o `error` e mostra o **vazio** (div. 701) |
| `hooks/use-content-actions.ts:44-46`, `:66-85`, `:93-94`, `:112-115` | apagar e favoritar gravam `error` em estado — **nunca lido** (`RefactoredLibrary.tsx:61-69` só usa `deleteDialog` e as ações): a falha é muda (div. 702) |
| `app/library/page.tsx:35-43` | o SSR que lança cai na tela padrão do Next (não há `error.tsx`) — **fica** (resposta 30 da folha: exceção fica na tela padrão) |

### 2.3 Código sem estado · estado sem código

- **Código sem estado na folha**: (a) os erros de apagar e de favoritar (div. 702); (b) o *timeout* da carga (div. 701 —
  vira `LIB-erro` com `motivo.rede`/`motivo.servidor`, sem estado novo `[hipótese]`); (c) a busca de hoje que vai pela
  URL (`header.tsx:30`) — a folha a mantém na casca; (d) o menu da conta com nome + e-mail (`user-header.tsx:60-65`) —
  a folha não desenha o menu aberto (div. 697).
- **Estado da folha sem código**: `DASH-erro` e `LIB-erro` (destampados, I1-D26 / decisão 10 da folha); `LIB-salvo`
  (div. 703). `SESSAO-nao-renovada` tem código, noutro lugar (div. 704).

## 3. As frases — a §5.5 × o inventário `[lido]`

**O que a folha cita e não existe mais** (pare e liste):

| frase da §5.5 | por quê | proposta |
|---|---|---|
| `casca.conta` · menu: **Perfil** · Sair | `/profile` morreu na PR-3 (I1-D19); o `user-header.tsx` de hoje já não tem o item (div. 697) | **I1-E13** (sem decidir): *"o menu da conta é só **Sair**; *Perfil* saiu com a página (I1-D19)"*. A folha não desenha o menu aberto em nenhum estado, então a errata é de **frase**, não de moldura — não entra em `erratasFaixa`, entra na §2.2 do `DESIGN-I1/README.md` |
| `edit.salvo` · *alterações salvas* (em `LIB-salvo`) | existe como toast do editor; o sinal para a biblioteca não existe (div. 703) | decisão 8 (§9) |

**Frases que a folha escreve e a §5.5 não lista** (lista declarada, I1-D10):

| texto na folha | onde | hoje | div. |
|---|---|---|---|
| *artista desconhecido* | `LIB` (linha "Batch três") | "Unknown Artist" (`OptimizedLibraryList.tsx:94`) | 706 |
| *Favoritar “{título}”* · *Tirar “{título}” das favoritas* (nome acessível) | `LIB` (os `aria-label`) | "Add to favorites" / "Remove from favorites" (`:160`) | 707 |
| *10 set 2026* (data curta, mês abreviado sem ponto) | `LIB` | `formatLibraryDate` `en-US` → "Sep 10, 2026" (`library-utils.ts:7-14`) | 708 |
| *—* (contador desconhecido) | `DASH-erro` | — (não há erro) | coberto pela nota da folha (critério da E15.b) |
| *Cifra* · *Letra* · *Tab* · *Partitura* (rótulo do tipo na lista do painel) | `DASH` | o `content_type` cru ("Chords"…, `dashboard.tsx:208`, `:261`, `:319`, `:374`) | os mesmos quatro de `lib.filtros` — sem frase nova |

**Frases de hoje sem destino na folha** (morrem com o redesenho; nenhuma tem estado): o subtítulo *"Manage and
organize all your musical content"* (`LibraryHeader.tsx:77`); as descrições dos cartões do painel (*"Your recently
viewed music"*, *"Your starred music pieces"*, *"Your recently accessed music pieces"*…); os sub-rótulos dos
contadores (*"pieces in your library"*… → rótulo único, nota de `DASH`); *"Filter By"*; *"Please wait while we fetch
your content"* (nota de `LIB-carregando`); *"Something went wrong"* / *"There was an error loading your music
library…"* do `LibraryErrorBoundary` (→ a linha com `motivo.generico`, nota de `LIB-erro`); os `aria-label` *"View
{título} by {artista}"*, *"View {título} content"*, *"Delete {título}"*; os três toasts de `use-content-actions.ts` e as
cinco mensagens de erro que ele nunca mostra; a casca: *"Navigation"*, *"Home"*, *"Add Song"*, *"Add"*, *"Search..."*,
*"Sign In"*/*"Sign Up"* (`user-header.tsx:25-36`, inalcançável numa página protegida), *"User"* e o e-mail no menu.

## 4. G-tok cresce `[medido]`

`scripts/gates-web/g-tok-arquivos.txt` ganha os **18** arquivos do §1.1 que sobrevivem (a casca nova, as frases, a
`LinhaDeAviso` movida e o que o commit 2 criar entram no commit 2). Na `main` (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 38 · literais de identidade acusados: 529 · toasts: 2 · imports de ui: 20 · textos examinados: 61 · isentos de inglês (scripts/gates-web/g-tok-sem-ingles.txt): 1 · vocabulário: 109 · isenções: 9

G-tok: REPROVA — 597 ocorrência(s)
# exit: 1
```

Por classe: 162 [cor] · 129 [espaçamento] · 116 [tamanho] · 64 [tamanho de fonte] · 45 [inglês, texto JSX] · 21 [valor
arbitrário] · 20 [import de ui] · 18 [raio] · 18 [borda] · 2 [toast] · 1 [tracking] · 1 [inglês, atributo].
Por arquivo: `dashboard.tsx` 227 · `LibraryHeader.tsx` 113 · `OptimizedLibraryList.tsx` 90 · `LibraryErrorBoundary.tsx`
41 · `LibraryEmptyState.tsx` 40 · `LibraryLoadingState.tsx` 26 · `LibraryPagination.tsx` 23 · `library-utils.ts` 14 ·
`library-page-client.tsx` 9 · `RefactoredLibrary.tsx` 7 · `delete-content-dialog.tsx` 5 · `use-content-actions.ts` 2
(os dois toasts); `app/{dashboard,library}/page.tsx`, `dashboard-page-client.tsx`, `library.tsx`, `library/index.ts` e
`use-library-data.ts` 0. Os 20 de antes seguem 0; o (i) (a folha) segue `PASSA` (19/19). O job `g-tok` do CI fica
vermelho neste commit — é o gate-first.

## 5. Esperado da folha `[medido]`

```
$ pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 4-content-lista
4-content-lista: 0 caixa(s) de campo ancorada(s) · 16 seções · 15 com C e B · nós C 450 · nós B 450 → tests/gates-web/esperado/4-content-lista.json
  ✗ Tokens: sem a moldura C B
```

Nós por estado (C = B): `DASH` 30 · `DASH-vazio` 24 · `DASH-vazio-favoritas` 28 · `DASH-erro` 24 ·
`SESSAO-nao-renovada` 32 · `LIB` 46 · `LIB-filtros` 56 · `LIB-mais` 49 · `LIB-salvo` 47 · `LIB-carregando-chunk` 12 ·
`LIB-carregando` 12 · `LIB-vazio` 14 · `LIB-vazio-busca` 13 · `LIB-erro` 13 · `LIB-apagar` 50.
A casca em B (711): marca `OCTAVIA` (texto; nome acessível *Octavia*) em y 0 × 64, *Buscar…*, conta *MV* (50 × 50) na
linha de `bar.top`; *Painel · Biblioteca · Setlists · Adicionar* (links, 48) na linha de baixo, y 68. O texto da folha
vai em claro no esperado (é obra do projeto); as linhas da folha usam títulos de exemplo — **no aceite, a medição do app
só grava hash** (regra do anexo sem texto de música).

## 6. A linha de base e a casca velha `[medido]`

`tests/gates-web/medicoes/cn-main/{dashboard,library}.json` existem (I1-PR5 §3) — **não re-medidos**. Veredito de hoje
sobre `cn-main/` (`node scripts/gates-web/g-faixa-veredito.mjs tests/gates-web/medicoes/cn-main`): **`REPROVA — 83`**
(content 18 · dashboard 6 · library 51 · setlists 8; eram 46 antes da errata da I1-D11 contar 411).

**O que é da casca velha**, pelo hash do nó (`sha256(texto)[0:12]`, calculado aqui): `heading:365feefa2df3` =
*"NAVIGATION"* (o `h3` da lateral, `sidebar.tsx:81`, `uppercase`) · `button:67b696468610` = *"Dashboard"* ·
`button:6a1ad7ecd437` = *"Add Song"* · `button:∅` = o botão de recolher/menu sem nome acessível (`header.tsx:40-58`).
Em 711/411 a lateral some (retrato ≤ 1024 → barra de baixo, `navigation-container.tsx:45-49`) e esses nós viram
"sem nó":

| superfície | (e) 711 — da casca / total | (e) 411 — da casca / total | o resto |
|---|---|---|---|
| `/dashboard` | **3 / 3** (∅, NAVIGATION, Add Song) | **3 / 3** | — |
| `/library` | **3 / 25** (NAVIGATION, Dashboard, Add Song) | **3 / 26** (idem) | corpo: *Filters*, *Sort*, *Add Content*, os 20 cards (`hidden md:flex`) |
| `/setlists` | **4 / 4** (∅, NAVIGATION, Dashboard, Add Song) | **4 / 4** | — |
| `/content/[id]` | **4 / 4** (idem) | **4 / 4** | + **(b) 10 em 1138**: a coluna de detalhes passa da borda — a raiz `h-screen overflow-hidden` (`responsive-layout.tsx:78`) e o `md:ml-72` (`:98`) são da casca `[hipótese: a casca nova pode mudar esse (b)]` |

**Na casca-efeito** (§4 do prompt; o aceite do Marcel), a casca nova deve **zerar as 8 (e) de 711 e as 8 de 411 em
`setlists` e `content`** sem tocar o corpo delas; o que sobrar é do corpo velho (herança das PRs 10–13).

## 7. Estado × como alcançar × escreve? — para o aceite

Sessão: o perfil persistente do Marcel (`G_FAIXA_PERFIL`). **fab.** = `page.route()` respondendo no navegador com
`x-g-faixa: fabricado` (o molde, item 8): não sai, não é escrita. O medidor hoje reusa **a mesma página** entre estados
nas superfícies com sessão (`g-faixa-medir.ts:145-146`): o commit 2 desfaz as rotas de cada estado (`unroute`) antes do
seguinte `[hipótese de instrumento]`.

| estado | como alcançar | escreve? |
|---|---|---|
| `DASH` | abrir `/dashboard` | 0 — **dados reais da conta** (SSR): as linhas e os números não pareiam com a folha (§9, decisão 12) |
| `DASH-vazio` | **∅ no navegador**: os dados vêm do Supabase no servidor (div. 699); só com uma conta vazia | — |
| `DASH-vazio-favoritas` | idem — alcança só se a conta do perfil não tiver favoritas (aí o `DASH` já é ele) | 0 |
| `DASH-erro` | **∅ no navegador** (a falha é do banco, no servidor) | — |
| `SESSAO-nao-renovada` | `/dashboard` com `POST /api/auth/session` fab. 500 — o provider abre o cookie a cada carga com usuário (`firebase-auth-context.tsx:250-271`) | 0 (fab.; e o cookie da sessão é o do perfil, não muda) |
| `LIB` | `/library` com `GET /api/content` fab.: as 6 linhas da folha, `total` 60 (3 páginas); a carga do cliente roda 100 ms depois do SSR (`use-library-data.ts:157-171`) e troca a lista | 0 |
| `LIB-filtros` | `LIB` + clicar *Filtros* | 0 |
| `LIB-mais` | `LIB` + clicar *Mais* da 1ª linha | 0 |
| `LIB-salvo` | depende da decisão 8 | — |
| `LIB-carregando-chunk` | segurar o *chunk* do `dynamic` da biblioteca (`route` no `/_next/static/chunks/…` que o carrega) `[hipótese: o nome do chunk no `next dev`]` | 0 |
| `LIB-carregando` | 1ª `GET` fab. vazia (a lista some); mudar um filtro; a 2ª `GET` **segurada** (`loading && content.length === 0`, `RefactoredLibrary.tsx:82-85`) | 0 |
| `LIB-vazio` | 1ª `GET` fab. `{ data: [], total: 0 }` | 0 |
| `LIB-vazio-busca` | 1ª `GET` fab. vazia; aplicar um filtro; 2ª `GET` fab. vazia (`hasActiveFilters`) — por filtro, não por `?search=`, para a busca da casca ficar em *Buscar…* como na folha | 0 |
| `LIB-erro` | 1ª `GET` fab. vazia; mudar um filtro; 2ª `GET` `abort()` (rede → *sem conexão*, o motivo da folha). Com a lista na tela o erro fica mudo por desenho (§2.2) | 0 |
| `LIB-apagar` | `LIB` + *Mais* → *Apagar* (abre o diálogo; nenhum request) | 0 |
| (apagado — sem estado, a lista muda) | *Apagar* no diálogo → `DELETE /api/content?id=` fab. 200 (`content-service.ts:567`) + a `GET` seguinte fab. sem a linha | 0 (fab.) |
| (favoritado — sem estado) | *Favoritar* → `PUT /api/content` fab. 200 (`content-service.ts:532`; o favoritar é o `updateContent`) + a `GET` seguinte com `is_favorite` trocado | 0 (fab.) |

**Nenhuma escrita real**: a barreira do medidor (`g-faixa-medir.ts:63-69`) aborta `POST/PUT/DELETE` a `/api/*` fora
de `/api/auth/session`; as fabricadas respondem antes dela. A `GET /api/content` fabricada é leitura — fabricar é
para as linhas parearem com a folha, não por segurança.

## 8. Divergências — 696 a 712

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **696** | P | *"`DESIGN-I1/README.md` §1.4 (decisões 3, 7, 9 — favoritar como rótulo, 17, 20 — favoritar só na lista)"* | os números são as **respostas da §1.1**; a §1.4 são as divs. da conferência. A 9 é a marca do Google ("os demais controles já eram só texto"); o favoritar-como-rótulo está na nota de `LIB` e no `README-design.md` §6; a 20 é da folha 5 (sai do cabeçalho da visualização) | registrado; a leitura vale |
| **697** | P | *"o `user-header.tsx` sem o link de `/profile`"* (§17 do pre-check) | já está sem (PR-3); o menu de hoje é rótulo (nome + e-mail) + *Sign out*; o gatilho é o avatar (`profile.avatar_url`) com iniciais de reserva. A folha: conta = **iniciais** em `radius.pill`, nome acessível *Conta de {nome}*; §5.5: menu *Perfil · Sair* | **I1-E13** proposta (§3); decisão 2 |
| **698** | A | o erro do painel é *"`content-service.ts:128-130`, `:682-689`"* (matriz) | as linhas andaram: `:127-135` e `:623-666`; e **as contagens nem leem o `error`** (`:623-633`) — a falha vira `null` → 0 | §2.2; decisão 4 |
| **699** | P | *"`route()` sobre `GET /api/content` (vazio, erro 500, erro de rede…)"* | vale para a biblioteca; **o painel é SSR** (`app/dashboard/page.tsx:24-27` → Supabase direto): nenhum request do navegador leva os dados — `DASH-vazio`, `-vazio-favoritas`, `-erro` não se alcançam por `route()` | §7; decisão 5 |
| **700** | A | *"erro vira lista vazia"* (matriz, §3) | na biblioteca, só **sem lista na tela** (`use-library-data.ts:145`); o SSR sempre põe lista (a da conta) antes da carga do cliente — `LIB-erro` só se alcança depois de uma carga vazia | §7 (1ª resposta vazia, 2ª com falha) |
| **701** | A | — | o *timeout* da carga devolve `{ data: [], total: 0, error }` (`content-service.ts:301-313`) e o hook ignora o `error`: vira **vazio** | destampado junto (`LIB-erro`) `[proposta]` |
| **702** | A | — | apagar e favoritar produzem erro e **ninguém lê** (`use-content-actions.ts` `error`; `RefactoredLibrary.tsx:61-69`); a folha não tem estado para eles | decisão 7 |
| **703** | A | `LIB-salvo` na biblioteca | é o toast do **editor** (`content-edit-page-client.tsx:34-35`) antes do `router.push("/library")`; não há sinal que a biblioteca leia | decisão 8 |
| **704** | D | `SESSAO-nao-renovada` *"logo abaixo do título"* | hoje a linha é do provider, `sticky top-0 … p-2` no topo de toda página (`aviso-de-sessao.tsx:24`; div. 653 da I1-PR6 deixou o invólucro para esta PR) | decisão 9 |
| **705** | D | a linha da biblioteca da folha: título · *artista · álbum* · data · Favoritar · Mais | hoje a linha tem também o **ícone do tipo**, o **tom** e a **dificuldade** (`OptimizedLibraryList.tsx:72-76`, `:113-145`); a folha não os desenha (nem na tabela de tokens: *"linha da biblioteca: título size.body · apoio size.label muted · data 13"*) | decisão 10 |
| **706** | D | frases da §5.5 | *artista desconhecido* está na folha (`LIB`) e não na §5.5 | lista declarada (decisão 11) |
| **707** | D | idem | o nome acessível do favoritar (*Favoritar “{título}”* / *Tirar “{título}” das favoritas*) está nos `aria-label` da folha e não na §5.5 | lista declarada (decisão 11) |
| **708** | D | — | a data da folha é *10 set 2026*; `toLocaleDateString('pt-BR', { month: 'short' })` dá *"10 de set. de 2026"* — a forma da folha pede os meses abreviados como tabela | `frases-lista.ts` ganha os 12 meses (decisão 11) |
| **709** | A | — | o painel mostra o `content_type` cru e o `getContentIcon` compara *"Sheet Music"*, *"Guitar Tab"*, *"Chord Chart"* (`dashboard.tsx:52-65`), que nunca casam o enum canônico `Lyrics \| Chords \| Tab \| Sheet` (`types/content.ts`): só *Lyrics* ganha o ícone próprio | o redesenho mapeia o enum (ícone do catálogo + rótulo pt-BR); registrado |
| **710** | T | *"o `layout` com sessão pode estar no núcleo"* | não há `layout` com sessão: a casca é montada por seis *page-clients*; nenhum deles, nem a casca velha, está no núcleo do G-back | registrado (§1.2) |
| **711** | A | — | `contexts/sidebar-context.tsx` é órfão (só o teste o importa) e não é da casca | fica; fora do escopo |
| **712** | D | `README-design.md` §2.4: *"4-content-lista · 15 estado(s)"* | 16 `data-estado`: a seção `Tokens` também tem o atributo, sem moldura (como a 643) | 15 medidos |

## 9. Para o aval

1. **A casca em todas as páginas com sessão** (§1.2): os seis *page-clients* trocam `ResponsiveLayout` pela casca
   nova; nos quatro de corpo velho (visualização, editor, upload, setlists) a mudança é só o invólucro. Confirma?
2. **I1-E13 — o menu da conta** (div. 697): **(a) recomendado**: o menu é só *Sair* (o `signOut()` de hoje); o
   cabeçalho do menu de hoje (nome + e-mail) sai — o nome fica no nome acessível *Conta de {nome}*; o gatilho mostra as
   iniciais (a foto de `avatar_url` sai, como na folha). Errata de frase na §2.2 do `DESIGN-I1/README.md`, não em
   `erratasFaixa`. (b) o menu mantém o cabeçalho nome + e-mail acima de *Sair*.
3. **`Alert`/`toast` das telas de corpo velho** com a casca nova: nada muda nelas (o toast do editor, os `Alert` do
   upload e das setlists seguem até a PR de cada uma). Confirma?
4. **Destampar o erro do painel** (div. 698): **(a) recomendado**: `getUserContent` e `getUserStats`
   (`lib/content-service.ts` — cliente de rota, fora do núcleo, I1-D21) passam a **lançar** na falha do banco (e a ler
   o `error` das contagens) em vez de devolver `[]`/zeros; `app/dashboard/page.tsx` usa `Promise.allSettled` e passa ao
   cliente `erro: true` por parte (conteúdo, números); `lib/content-service-server.ts` (núcleo) não muda — só repassa.
   Os únicos chamadores são o painel e os testes (§2.2). *Tentar de novo* = `router.refresh()` (o mesmo SSR de novo, um
   por clique). Uma linha por tela: a falha de conteúdo e a de números juntas dão **uma** `dash.erro`. (b) funções
   novas ao lado das velhas, sem mudar as de hoje (duplica a consulta).
5. **O alcance do painel no aceite** (div. 699): **(a) recomendado**: `DASH-vazio`, `-vazio-favoritas` e `-erro`
   declarados **inalcançáveis no navegador** (SSR), com um **CN de render no Vitest** dos três (vazio ≠ erro:
   contadores "0" × "—", frase de vazio × `LinhaDeAviso`) como prova de que o código distingue — prova de estrutura, não
   de geometria; o `-vazio-favoritas` se mede se a conta do perfil não tiver favoritas. (b) conta descartável vazia,
   criada e apagada por você, para o `DASH-vazio` (1 signup + 1 perfil); o `-erro` segue ∅.
6. **O motivo por espécie na biblioteca** (§2.2, `content-service.ts:269-274`): **(a) recomendado — o molde (A2 da
   I1-PR-6)**: o `Error` da carga passa a levar o `status` (aditivo, em `lib/content-service.ts`, fora do núcleo); a
   tela escolhe o motivo por ele (0/`TypeError` → *sem conexão* · 401/403 → `motivo.auth` · 429 → `motivo.limite` ·
   5xx e o resto → `motivo.servidor`; *timeout* → *sem conexão*). (b) mapear pela mensagem (frágil: a mensagem é a do
   corpo da API).
7. **Erros de apagar e favoritar** (div. 702): **(a) recomendado**: ficam mudos como hoje (a folha não tem estado;
   resposta 6: *"motivos por espécie nas notas, sem mudança de estado"*) — **herança nomeada** para a PR de erratas do
   bloco ou o D. (b) uma `LinhaDeAviso` *"não foi possível apagar — {motivo}"* / *"… favoritar …"* (frases novas, lista
   declarada; posição sem desenho).
8. **`LIB-salvo`** (div. 703): **(a) recomendado**: nasce **com o editor** (PR-11), que é quem sabe que salvou — a
   linha na biblioteca e o sinal do editor na mesma PR; aqui ele fica *"não medido — nasce na PR do editor"* e o toast
   do editor segue como está (corpo velho). (b) agora: a biblioteca lê um sinal (`?salvo=1` ou `sessionStorage`) e o
   editor o escreve — toca a folha 6 antes da hora e cria um parâmetro de URL.
9. **`SESSAO-nao-renovada`** (div. 704): **(a) recomendado**: no painel e na biblioteca a linha desce para **abaixo do
   título** (o `AvisoDeSessao` deixa de se desenhar no topo nessas duas rotas, como já não se desenha no `/login`, e a
   página o desenha); com outra falha na tela, **vence a sessão** (sem ela nenhuma escrita passa). Nas quatro de corpo
   velho fica no topo até a PR de cada uma. (b) fica no topo em todas até a última PR.
10. **A linha da biblioteca** (div. 705): **(a) recomendado**: como a folha — sem o ícone do tipo, o tom e a
    dificuldade na linha (o filtro por tipo e dificuldade continua; os campos seguem na visualização e no editor).
    (b) mantê-los (errata na folha; muda a altura da linha).
11. **As frases novas** (divs. 706–708, I1-D10): *artista desconhecido*; *Favoritar “{título}”* / *Tirar “{título}” das
    favoritas* (nome acessível); os 12 meses abreviados (*jan … dez*) para a data curta. Aprova?
12. **O painel e a folha não pareiam nos dados** (§7): a medição do `DASH` lê a conta real (6 linhas e 4 números que
    não são os da folha) — os nós de dado saem **"sem par"** (contados à parte, não reprovam) e a casca, o título, as
    abas e os rótulos pareiam. Aceita, ou quer âncoras `data-testid` para os quatro contadores?

**A composição que vai para o commit 2** `[hipótese]`: `components/identidade/casca.tsx` (+ `frases-casca.ts`) com a
barra de `bar.top` (`h-barra-top`) em C numa linha — marca (texto `font-fam-display text-tam-title tracking-display-wide`,
nome acessível *Octavia*) · navegação (`<Link>` `h-toque-min rounded-raio-control text-tam-body-small`, ativo pelo
`usePathname`) · busca (`<form>` → `/library?search=`, o mesmo de hoje) · conta (`h-toque-min w-toque-min
rounded-raio-pill`); em B/A empilha (`c:` é a linha única) com a navegação numa linha de `touch.list`; o conteúdo em
`max-w-web-conteiner px-web-margem`. A casca **não** é `h-screen overflow-hidden`: a página rola no documento. Frases da
lista em `components/library/frases-lista.ts`; o painel quebrado em partes < 150 linhas (contadores, lista, abas).

## 10. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | navegador | só contra a folha, por `file://` (`g-faixa-esperado.ts`) |
| executor | `next dev` | nenhum neste commit |
| — | `packages/identidade` | **não mudou**; nenhum token faltou na folha `[hipótese até o commit 2]`: `bar.top`, `touch.*`, `web.linhaLista`, `web.margem`, `web.conteiner`, `folha.*` existem no `identidade.css`; o `tailwind.config.ts` não expõe `--faixa-folha-topo` (a lista `WEB`, `:16-17`, só tem `folha-largura`) — o commit 2 acrescenta o nome à lista (extra declarado, sem tocar o pacote) |

---

## 11. O aval do commit 1 — decisões `[Marcel, 2026-09-28]`

(Transcrição do prompt do commit 2; a lista de perguntas do commit 1 fica no §9.)

1. A casca em **todas** as páginas com sessão; os quatro corpos velhos (`content`, `content-edit`, `add-content`,
   `setlists`) intactos, medidos em `casca-efeito/`.
2. **I1-E13**: o menu da conta é só *Sair*; cabeçalho nome/e-mail e foto não existem (`/profile` morreu na PR-3).
   Errata no `DESIGN-I1/README.md` §2.2 e no `erratas.json`.
3. Nada muda nos `Alert`/toast das telas de corpo velho.
4. `lib/content-service.ts`: `getUserContent` e `getUserStats` **lançam** quando o banco falha (único chamador: o
   painel); `app/dashboard/page.tsx` separa vazio de erro; o núcleo do G-back não muda.
5. `DASH-vazio` e `DASH-erro` **inalcançáveis no navegador**; prova por teste de render no Vitest dos três estados do
   painel (dados · vazio · erro). `DASH-vazio-favoritas` só se a conta não tiver favoritas: registrar como medido ou não.
6. Motivo por espécie na biblioteca pelo `status` levado junto do erro (o padrão da PR-6).
7. Erros de apagar e favoritar continuam mudos: **herança nomeada** (§12.4).
8. `LIB-salvo` nasce na PR-11 (editor).
9. `SESSAO-nao-renovada` abaixo do título no painel e na biblioteca; a falha da sessão vence outra falha na tela.
10. A linha da biblioteca como a folha: sem ícone de tipo, tom e dificuldade (div. 705) — **ver div. 714**: a folha
    tem o ícone do tipo; vale a folha.
11. Frases novas aprovadas (divs. 706–708): `artista desconhecido`; os nomes acessíveis *Favoritar “{título}”* / *Tirar
    “{título}” das favoritas*; os 12 meses abreviados (`jan`…`dez`) para a data `10 set 2026`.
12. Nós de dados do `DASH` "sem par" por a conta real não ter os dados da folha: aceito, contados e listados.

**Decisão no meio do commit 2** `[Marcel, 2026-09-28; pergunta do executor, div. 713]` — a folha 4 usa três valores
sem token (13 px do metadado de linha; `accent` a 12 %; `bg` a 82 %): **opção 2** — `web.metadado` 13,
`web.alfaMarcado` 0,12, `web.alfaDialogo` 0,82 no bloco `web` de `packages/identidade`, **só adição** (como a decisão 2
da I1-PR-6); o `color-mix` sai do gerador; o APK constrói; docs depois do verde.

## 12. Commit 2 — o que mudou `[medido]`

### 12.1 Por grupo

| grupo | arquivos | o quê |
|---|---|---|
| **pacote** (div. 713) | `packages/identidade/src/tokens.ts` (+14), `scripts/gerar-css.mjs` (+4), `test/css.test.ts` (+11), `test/igualdade.test.ts` (+3/−1); `app/styles/identidade.css` regenerado (+9) | `web.metadado` 13 · `web.alfaMarcado` 0,12 · `web.alfaDialogo` 0,82, iguais nas três faixas; o gerador escreve `--faixa-metadado: 13px`, `--faixa-cor-marcado: color-mix(in srgb, var(--cor-accent) 12%, transparent)`, `--faixa-cor-dialogo: color-mix(in srgb, var(--cor-bg) 82%, transparent)`. Só adição: identidade **39/39** (era 38 + 1 caso novo), native **91/91**, native-tela **120/120** (211, como antes) |
| `tailwind.config.ts` | +10/−3 | `web-folha-topo` na lista `WEB` (extra do aval); `cor.marcado`, `cor.dialogo` (→ `bg-cor-marcado`, `bg-cor-dialogo`); `fontSize` `tam-web-metadado` |
| **a casca** | `components/identidade/casca.tsx` (108), `conta-da-casca.tsx` (44), `frases-casca.ts` (26), `menu.tsx` (58), `controles.tsx` (31), `linha-da-tela.tsx` (39) | a barra de `bar.top`: marca `OCTAVIA` (texto, nome acessível *Octavia*) · navegação por `<Link>` (o ativo pelo caminho; `/content/*` acende *Biblioteca*, como o `activeScreen` de antes) · busca (`/library?search=`, a mesma de antes) · conta (iniciais pela regra do `user-header` de antes; menu só *Sair*, I1-E13). Em B/A empilha (`order` + `basis-full`; em A a navegação quebra em duas linhas — regra 2, mecânica). `ConteudoDaCasca` = `web.conteiner` + `web.margem`, respiro `space.xxl`, vão `space.xl`. A página rola no documento (sem o `h-screen overflow-hidden`) |
| **a casca velha — morreu** | `responsive-layout.tsx` (107), `header.tsx` (96), `navigation-container.tsx` (104), `sidebar.tsx` (123), `bottom-nav.tsx` (55), `user-header.tsx` (74) — **559 linhas** | nenhum importador sobra (`git grep` → 0) |
| **os quatro corpos velhos** | `content-page-client.tsx` 76 → 73 · `content-edit-page-client.tsx` 51 → 48 · `add-content-page-client.tsx` 69 → 71 · `setlists-page-client.tsx` 63 → 55 | só o invólucro: `<Casca><div className="flex-1 bg-[#fffcf7]">corpo</div></Casca>` (o fundo de antes, que era da raiz do `ResponsiveLayout`); `activeScreen` e o `handleNavigate` sem uso saíram. No upload, *Adicionar* já ativo reinicia o formulário como a lateral fazia (`aoReclicarAtivo`, div. 717). Nenhum deles na lista do G-tok (decisão 3) |
| **`LinhaDeAviso` movida** | `components/auth/linha-de-aviso.tsx` → `components/identidade/linha-de-aviso.tsx` (`git mv`, 0 linha mudada) | os seis importadores trocam o caminho; o CN da PR-1 15/15 |
| **sessão** | `components/auth/aviso-de-sessao.tsx` 31 → 39 | `ROTAS_QUE_DESENHAM_A_LINHA` = `/login`, `/dashboard`, `/library`: nessas o topo não desenha; a tela desenha abaixo do título (`LinhaDaTela`, a sessão vence — decisão 9). Nas de corpo velho, o topo de antes |
| **o painel** | `app/dashboard/page.tsx` 46 → 51 · `dashboard-page-client.tsx` 44 → 14 · `dashboard.tsx` **397 → 92** · `components/painel/contadores-do-painel.tsx` (31) · `lista-do-painel.tsx` (49) | `Promise.allSettled`: cada parte que falha vai ao cliente como `erroConteudo`/`erroNumeros`; contador "—" na falha; lista sem frase de vazio na falha; `dash.erro` com *Tentar de novo* = `router.refresh()`. As linhas abrem `/content/<id>` por `<Link>` (antes `router.push` no clique — o mesmo destino) |
| **a biblioteca** | `RefactoredLibrary.tsx` 172 → 88 · `LibraryHeader.tsx` 185 → 67 · `OptimizedLibraryList.tsx` 255 → 27 · `LibraryPagination.tsx` 82 → 47 · `LibraryEmptyState.tsx` 55 → 38 · `LibraryLoadingState.tsx` 22 → 20 · `LibraryErrorBoundary.tsx` 80 → 61 · `delete-content-dialog.tsx` 30 → 56 · `library-page-client.tsx` 70 → 69 · novos `LibraryFiltros.tsx` (67), `LinhaDaBiblioteca.tsx` (80), `frases-lista.ts` (123) | a folha. Os mesmos filtros, a mesma ordem, as mesmas três ordenações, a mesma paginação (20 por página), o mesmo diálogo (mesmo contrato `open` · `onOpenChange` · `content` · `onConfirm`). O carregando do *chunk* mostra o cabeçalho inerte + *carregando a biblioteca…* |
| **dados** | `hooks/use-library-data.ts` 259 → 282 · `hooks/use-content-actions.ts` 160 → 153 · `lib/content-service.ts` 670 → 654 · `lib/library-utils.ts` 112 → 54 | §12.3. Os três toasts saíram (I1-D26). Do `library-utils` saíram o que era tela: `formatLibraryDate` (`en-US` → `dataCurta` pt-BR), `getLibraryContentIconData` (lucide → o ícone do catálogo, `tipoDe`), `getDifficultyBadgeClass` (o selo saiu), `getContentTypeFilterOptions`/`getDifficultyFilterOptions` (→ `TIPOS`/`DIFICULDADES`) — nenhum outro importador |
| **testes** | `components/painel/__tests__/painel-estados.test.tsx` (novo, 4) · `hooks/__tests__/use-library-data.test.tsx` (+5) · `lib/__tests__/content-service.test.ts` (+4) · `components/auth/__tests__/login-sessao-cn.test.tsx` (a (v), div. 716) | §13 |
| **medidor** | `scripts/gates-web/g-faixa-lista.ts` (novo, 115) · `g-faixa-superficies.ts` · `g-faixa-medir.ts` (+3) · `g-faixa-auth.ts` (3 `export`) · `g-faixa-esperado.ts` (`porSeletor`) · `tests/gates-web/esperado/4-content-lista.ancoras.json` (novo) + `4-content-lista.json` re-medido | §12.5 |
| **docs do congelamento** | `docs/ux/DESIGN-I1/README.md` (§2.2: I1-E13 e a linha da 694 na I1-E12; §4: os três nomes da folha 4) · `erratas.json` (lista nova `erratasFrase`, com o `_leia_frase`) · `SHA256SUMS` (só a linha do `README.md`: `382b3d8f…` → `1bef1581…`; `shasum -a 256 -c` → 14/14 OK) | a I1-E13 é de frase: nenhum gate a lê (nem o `conferir.mjs` nem o G-faixa) |

**Os testes da lista velha que morreram: nenhum** (não havia teste de componente da lista, do painel nem da casca —
§1.1). **Os que ficaram e se adaptaram**, com o par: `use-library-data.test.tsx` (8 → 13: + *sem lista na tela, a
falha com status vira erro* · *TypeError é rede* · *o timeout é rede* · *o vazio de verdade não é erro* · *com lista na
tela a falha segue muda*); `content-service.test.ts` (6 → 10: + *getUserContent lança na falha do banco* · *getUserStats
conta* · *lança na falha de `content`* · *na de `setlists`*); `login-sessao-cn.test.tsx` (15 → 15, a (v) em `/setlists`).

### 12.2 As frases — a lista declarada (I1-D10/D17)

`components/identidade/frases-casca.ts` e `components/library/frases-lista.ts`. Chave · texto · origem (`README-design.md`
§5.1/§5.5, ou *nova* com a div.):

| chave | texto | de hoje (morreu) |
|---|---|---|
| `casca.marca` / `.nome` | OCTAVIA / Octavia (nome acessível) | ícone + *wordmark* `webp` |
| `casca.painel` · `.biblioteca` · `.setlists` · `.adicionar` | Painel · Biblioteca · Setlists · Adicionar | "Dashboard" · "Library" · "Setlists" · "Add Song" (e "Home"/"Add" da barra de baixo) |
| `casca.navegacao` | Navegação (nome acessível do `<nav>`) | "Navigation" (o `h3` da lateral) |
| `casca.buscar` | Buscar… | "Search..." |
| `casca.conta` | Conta de {nome} (N12) | — (avatar sem nome acessível) |
| `casca.sair` | Sair | "Sign out" |
| `dash.titulo` · `dash.adicionar` | Painel · Adicionar | "Dashboard" · "Add Content" |
| `dash.abas.*` | Visão geral · Recentes · Favoritas | "Overview" · "Recent" · "Favorites" |
| `dash.cont.*` | conteúdos na biblioteca · setlists · favoritas · vistas há pouco · — (desconhecido) | "Total Content"/"pieces in your library" … |
| `dash.recentes` · `dash.favoritas` | Recentes · Favoritas | "Recent Content" · "Favorite Content" (+ as descrições) |
| `dash.vazio.recentes` · `.favoritas` | nada visto recentemente · nenhuma favorita | "No recent content" · "No favorite content" |
| `dash.erro` | não foi possível carregar o painel — {motivo} | — (o erro virava vazio) |
| `lib.titulo` · `lib.adicionar` | Biblioteca · Adicionar | "Your Music Library" (+ o subtítulo) · "Add Content" |
| `lib.filtros` · `.tipo` · `.dificuldade` · `.favoritas` | Filtros · tipo · dificuldade · Só as favoritas | "Filters" · "Content Type" · "Difficulty" · "Favorites only" (+ "Filter By") |
| `TIPOS` · `DIFICULDADES` | Cifra · Letra · Tab · Partitura · Iniciante · Intermediário · Avançado | "Chords" · "Lyrics" · "Tab" · "Sheet" · "Beginner" … |
| `lib.ordenar.*` | Mais recentes · Título (A–Z) · Artista (A–Z) | "Most Recent" · "Title (A-Z)" · "Artist (A-Z)" (+ "Sort") |
| `lib.favoritar` · `lib.favorita` | Favoritar · Favorita (N12) | a estrela sem texto |
| `lib.favoritar.nome` · `lib.favorita.nome` | Favoritar “{título}” · Tirar “{título}” das favoritas (**nova, div. 707**) | "Add to favorites" · "Remove from favorites" |
| `lib.mais` · `lib.mais.nome` | Mais · Mais ações para “{título}” | "More options" |
| `lib.menu.*` | Abrir · Editar · Apagar | "View" · "Edit" · "Delete" |
| `lib.paginas.*` | Anterior · Próxima | "Previous" · "Next" |
| `lib.carregando` | carregando a biblioteca… | "Loading library..." · "Loading your music library..." (+ "Please wait…") |
| `lib.vazio` · `.apoio` | nenhum conteúdo ainda · adicione a primeira música para começar | "No content found" · "Add your first piece…" |
| `lib.vazio.busca` · `.apoio` | nada encontrado · mude a busca ou os filtros | "No content found" · "Try adjusting your search or filters" |
| `lib.erro` | não foi possível carregar a biblioteca — {motivo} | — (virava vazio); o *fallback* de render "Something went wrong" / "There was an error loading…" → `lib.erro` com `motivo.generico` |
| `lib.apagar.titulo` · `.pergunta` · `.confirmar` · `acao.cancelar` | Apagar conteúdo · apagar “{título}”? não dá para desfazer · Apagar · Cancelar | "Delete Content" · "Are you sure…? This action cannot be undone." · "Delete" · "Cancel" |
| `lib.artista.desconhecido` | artista desconhecido (**nova, div. 706**) | "Unknown Artist" |
| `MESES` + `dataCurta` | jan … dez → *10 set 2026* (**nova, div. 708**) | `toLocaleDateString("en-US")` → "Sep 10, 2026" |
| `motivo.rede` · `.auth` · `.limite` · `.servidor` · `.generico` · `acao.tentar` | sem conexão · o servidor não aceitou a sessão — entre de novo · muitas tentativas — tente de novo em instantes · falha no servidor · algo deu errado · Tentar de novo | — |

Morreram sem destino (nenhuma com estado; §3 do commit 1): as descrições dos cartões do painel, *"Manage and organize…"*,
*"Please wait…"*, os `aria-label` *"View {título} by {artista}"* / *"View {título} content"* / *"Delete {título}"*, os três
toasts e as cinco mensagens de erro nunca mostradas de `use-content-actions.ts`, *"Sign In"*/*"Sign Up"*/*"User"* do
`user-header` e o e-mail no menu (I1-E13).

### 12.3 Onde o erro era engolido — e como ficou

| era (§2.2) | agora |
|---|---|
| `lib/content-service.ts:127-135` — `getUserContent`: falha do banco → `[]` | **lança** `Failed to fetch content` (a falha do banco); sem usuário segue `[]` (o de antes); o ramo sem `supabase` (sem chamador) segue com o `catch` de antes |
| `:623-633`, `:637-647`, `:658-666` — `getUserStats`: `error` não lido → 0; `catch` → zeros | as três contagens **leem o `error` e lançam** `Failed to fetch stats`; sem usuário segue zeros |
| `components/dashboard.tsx` `stats?.x \|\| 0` | `app/dashboard/page.tsx` com `Promise.allSettled` → `erroConteudo`/`erroNumeros`; na falha dos números, "—"; na do conteúdo, nem linha nem frase; uma `dash.erro` |
| `hooks/use-library-data.ts:145-148` — sem lista, a falha vira o vazio | vira **`erro`** (`{ status }` ou `{ rede }`) e a tela mostra `lib.erro` com o motivo; com lista na tela, segue muda (a folha) |
| `lib/content-service.ts:269-274` — o status se perdia | o `Error` leva `status` (e os dois `throw` de auth do cliente levam 401) — aditivo |
| `:301-313` — o *timeout* virava lista vazia com `error` | o hook trata `result.error` como falha de rede (o serviço não mudou nesse ponto) |
| `use-content-actions.ts` — erros de apagar/favoritar nunca lidos | **ficam mudos** (decisão 7) — §12.4 |

**Motivo por espécie** (`especieDaFalha` + `linhaDaFalha`, `frases-lista.ts`): `TypeError`/*timeout* → *sem conexão*
(tipo rede, com *Tentar de novo*) · 401/403 → `motivo.auth` (sem ação) · 429 → `motivo.limite` (tipo limite, sem ação) ·
5xx e o resto → *falha no servidor* (com *Tentar de novo* = `reload()`, uma carga por clique).

### 12.4 A herança do item 7 — **estados sem folha: falha ao apagar / ao favoritar na lista**

`hooks/use-content-actions.ts` produz o erro de apagar (auth, 404 *"já apagado"*, o resto) e o de favoritar e o grava em
estado que nenhuma tela lê (`RefactoredLibrary.tsx` só usa o diálogo e as ações). Seguem **mudos**, como antes: a
lista recarrega (ou não) e nada diz por quê. **Destino**: errata de folha na PR que os desenhar (a folha 4 não tem a
seção; as frases pediriam *"não foi possível apagar — {motivo}"* / *"… favoritar …"*, novas) — ou o **bloco D**.

### 12.5 O medidor e o esperado

- `g-faixa-lista.ts`: os 15 estados (§7 do commit 1, com os ajustes): `GET /api/content` fabricada **em sequência**
  (1ª, 2ª…; a última se repete) com as seis linhas da folha e `total` 60, ou vazia, ou segurada, ou abortada; o
  `DELETE`/`PUT` de `/api/content` fabricados 200 em todo estado da biblioteca. `SESSAO-nao-renovada`: a abertura da
  sessão passa na carga; depois o `POST /api/auth/session` fabricado 500 e um `visibilitychange` (a renovação do
  provider). Inalcançáveis declarados: `DASH-vazio`, `DASH-erro` (SSR), `LIB-salvo` (PR-11).
- `g-faixa-medir.ts`: com sessão a página é a mesma entre estados — antes de cada estado, `soltar` + `unrouteAll`
  (as rotas do contexto — barreira de escrita e log — ficam) (div. 723).
- Âncoras (`4-content-lista.ancoras.json`, `porSeletor` no `g-faixa-esperado.ts`): a caixa da busca (`casca-busca`) e
  a conta (`casca-conta`). Re-medida: `4-content-lista: 60 caixa(s) … nós C 465 · nós B 465`; **o `1-auth.json`
  re-medido com o script novo sai byte a byte igual** (`cn/g-faixa-esperado-ancoras.txt`).

**Pré-verificação do executor (sem sessão, não commitada)**: com páginas de fumaça **locais** (fora do commit, apagadas)
montando `DashboardPageClient`/`LibraryPageClient` com os dados da folha, `next dev` sem `.env`, a mesma `coletar`
contra o esperado em 1138 e 711: `DASH`, `DASH-erro`, `DASH-vazio`, `LIB`, `LIB-vazio`, `LIB-filtros`, `LIB-mais`,
`LIB-apagar`, `LIB-vazio-busca` → **Δ > 4: 0** em todos, sem par só *Buscar…* (o texto de dentro da caixa, div. 719) e
*MV* (sem usuário na fumaça); `scrollWidth` = largura em 1138, 711 e 411. Achou e consertou dois antes do commit: a
classe do metadado não existia (a chave `web-metadado` gerava `text-web-metadado`) e a linha do painel em *border-box*
(56 em vez dos 57 da folha — a cascata dava Δy −7 em B, div. 722); e a navegação em 411 passava da borda (em A ela
quebra, regra 2).

## 13. Os gates — verdes `[medido]`

| gate / suíte | resultado | arquivo |
|---|---|---|
| G-tok | **PASSA**: (i) 19/19 cobertos, 0 órfãs; (ii) `arquivos: 49 · literais de identidade acusados: 0 · toasts: 0 · imports de ui: 0` — **597 → 0** | `cn/g-tok-depois.txt` |
| G-back | **PASSA** sem linha `gback:` — *"diff vazio no núcleo"*; nenhum arquivo novo no alcance (`lib/content-service.ts` é cliente, fora do núcleo, I1-D21) | `cn/g-back-depois.txt` |
| G-palco | **PASSA — 0** | `cn/g-palco.txt` |
| `pnpm test` | `Test Files 110 passed \| 3 skipped (113)` · `Tests 1089 passed \| 77 skipped (1166)` (eram 109/1075: +1 arquivo, +14 testes) | `cn/pnpm-test.txt` |
| CN da PR-1 | **15/15** (a (v) em `/setlists`, div. 716) | `cn/cn-pr1.txt` |
| teste do painel | **4/4**; a **mutação** (o erro volta a virar `[]`/zeros na página) → `2 failed \| 2 passed`, `expected [ '0', '0', '0', '0' ] to deeply equal [ '—', '—', '—', '—' ]`, `# exit: 1`; desfeita (`cmp` igual) → 4/4 | `cn/painel-mutacao-cn.txt` |
| identidade · native · native-tela | 39/39 · 91/91 · 120/120 | — |
| `tsc --noEmit` | 0 erros | — |
| `pnpm lint` | `✔ No ESLint warnings or errors` | `cn/lint.txt` |
| `pnpm build` | `✓ Compiled successfully`; `ƒ /dashboard 1.63 kB`, `ƒ /library 1.44 kB`; `# exit: 0` | `cn/build.txt` |
| **CN de inércia das públicas** | `next dev` desta árvore sem `.env` (porta 3110), `/`, `/login`, `/privacy-policy` nas três larguras × os JSON commitados: **12 (estado × largura) medidos nos dois lados, 12 idênticos (nós + `doc`)**; os 33 estados de `/login` que pedem o `.env` (o usuário falso) ficam só no commitado. `INÉRCIA: PASSA` | `cn/inercia-publicas.txt`, `cn/inercia-comparar.mjs` |
| `shasum -a 256 -c SHA256SUMS` (DESIGN-I1) | 14/14 OK | — |

## 14. Divergências — 713 a 725

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **713** | A | commit 1 §10: *"nenhum token faltou `[hipótese até o commit 2]`"* | a folha usa **13 px** (metadado de linha), **`accent` a 12 %** (marcado) e **`bg` a 82 %** (fundo do diálogo) sem token; o G-tok reprova `text-[13px]` e `rgba()` | parado e perguntado; **opção 2** do Marcel: três tokens no bloco `web` do pacote, só adição (§11) |
| **714** | A | div. 705 do commit 1 / decisão 10: *"sem ícone de tipo, tom e dificuldade"* | a linha da folha **tem** o ícone do tipo (20, `lineInfo`: cifra, letra, tab, partitura — o `svg` antes do título); só tom e dificuldade não estão | vale a folha (o que a decisão 10 pede): ícone fica, tom e dificuldade saem. O "sem ícone" do §8 do commit 1 era erro de leitura do executor |
| **715** | P | *"divergências continuam da 711"* | o commit 1 foi até a **712** (711 = o `sidebar-context` órfão; 712 = a seção `Tokens`) | esta série começa em 713 |
| **716** | A | *"o CN da PR-1 15/15 prova que nada mudou"* | a (v) do CN usa `/dashboard` como "tela fora do `/login`"; pela decisão 9 a linha no `/dashboard` é da tela, não do topo | a (v) passa a `/setlists` (uma tela de corpo velho, onde o topo segue); o mais é igual — 15/15; par declarado |
| **717** | A | *"a mudança nos corpos velhos é só o invólucro"* | no upload, clicar *Add Song* já estando em `/add-content` reiniciava o formulário (`resetKey`); um `<Link>` para a mesma rota não reinicia | `aoReclicarAtivo` na casca: o upload passa o mesmo reinício — zero mudança |
| **718** | D | `SESSAO-nao-renovada`: *"a sessão não foi renovada: o servidor não devolveu o token"* | a razão do exemplo é a do sem-token, sem uso (div. 654); o aceite alcança a renovação com 500 → *"a sessão não foi renovada: falha no servidor"* | o nó do texto sai "sem par" (1 por largura); a posição da linha é a mesma |
| **719** | T | — | a busca da folha é caixa + texto *Buscar…*; no app é `form` + `input` (o placeholder). O texto de dentro da caixa da folha e o `input` não pareiam | âncoras `porSeletor` (a caixa e a conta); o *Buscar…* de dentro da folha e o `input` (`casca-busca-campo`) saem "sem par", 1 + 1 por estado × largura |
| **720** | A | — | o bloco do título da linha era `role=button` com `tabIndex` (abria o content no clique e no Enter); a folha o desenha como dois textos | o clique no título segue abrindo (o mesmo `onSelect`), sem papel de controle; o caminho de teclado é *Mais → Abrir* (a folha). Registrado |
| **721** | A | decisão 4: *"lançam quando o banco falha"* | a contagem de setlists tinha um `try/catch` (*"Setlists table not available yet"* → 0) que nunca pegava (o Supabase não lança) | a contagem lê o `error` e lança, como as outras duas |
| **722** | T | — | a linha da lista do painel da folha é `min-height: 56` em *content-box* + contorno = **57**; em *border-box* (o padrão do web) dava 56 e a cascata Δy −7 em B | `box-content` na linha (57, como a folha) |
| **723** | T | o medidor com sessão | reusa a mesma página entre estados: as rotas fabricadas de um estado vazavam para o seguinte | `soltar` + `unrouteAll` antes de cada estado com sessão |
| **724** | A | *"os quatro corpos velhos intactos"* | o `ResponsiveLayout` dava ao corpo o fundo `#fffcf7` e a rolagem interna (`h-screen overflow-hidden`); a casca nova é escura e rola no documento | o fundo de antes num `div` do invólucro (o corpo não muda); a rolagem passa ao documento — o efeito sai na `casca-efeito/` |
| **725** | D | a folha: conta *MV* (duas letras) | a regra de hoje (`user-header.tsx:38-44`) junta a inicial de **cada** palavra do nome | mantida (zero mudança); a conta é âncora (`casca-conta`), não par por texto |

Próxima divergência: **726**.

## 15. Bloco ```gates-web``` e extras (copiados do corpo da PR)

```gates
# I1-PR-9: só adição no pacote (packages/identidade: web.metadado, web.alfaMarcado, web.alfaDialogo — div. 713), G1b — nenhum arquivo de apps/native mudou
```

```gates-web
# I1-PR-9: nenhum arquivo do núcleo do G-back tocado (G-back PASSA sem declaração)
gtok: scripts/gates-web/g-tok-arquivos.txt — +29 arquivos: os 18 do commit 1 (app/dashboard/page.tsx, app/library/page.tsx, components/dashboard-page-client.tsx, components/dashboard.tsx, components/library-page-client.tsx, components/library.tsx, components/library/index.ts, components/library/{RefactoredLibrary,LibraryHeader,OptimizedLibraryList,LibraryPagination,LibraryEmptyState,LibraryLoadingState,LibraryErrorBoundary}.tsx, components/delete-content-dialog.tsx, hooks/use-library-data.ts, hooks/use-content-actions.ts, lib/library-utils.ts) e 11 do commit 2 (components/identidade/{casca,conta-da-casca,menu,controles,linha-da-tela}.tsx, components/identidade/frases-casca.ts, components/painel/{contadores-do-painel,lista-do-painel}.tsx, components/library/frases-lista.ts, components/library/{LibraryFiltros,LinhaDaBiblioteca}.tsx); components/auth/linha-de-aviso.tsx → components/identidade/linha-de-aviso.tsx
gfaixa: scripts/gates-web/g-faixa-medir.ts — com sessão, soltar + unrouteAll antes de cada estado (div. 723); g-faixa-lista.ts novo (os 15 estados da folha 4)
gfaixa: scripts/gates-web/g-faixa-esperado.ts — âncoras porSeletor (a caixa da busca e a conta da casca); o 1-auth re-medido sai byte a byte igual
# extras: packages/identidade (web.metadado, web.alfaMarcado, web.alfaDialogo — só adição, div. 713) + app/styles/identidade.css regenerado
# extras: tailwind.config.ts — web-folha-topo, cor.marcado, cor.dialogo, tam-web-metadado
# extras: a LinhaDeAviso movida para components/identidade/ (os seis importadores trocam o caminho)
# extras: a casca velha morta — components/{responsive-layout,header,navigation-container,sidebar,bottom-nav,user-header}.tsx; os quatro page-clients de corpo velho trocam o invólucro
# extras: docs do congelamento — docs/ux/DESIGN-I1/README.md §2.2 (I1-E13; a linha da 694 na I1-E12) e §4 (os três nomes) + erratas.json (erratasFrase) + SHA256SUMS (só a linha do README.md)
# extras: lib/content-service.ts (fora do núcleo, I1-D21): getUserContent/getUserStats lançam na falha do banco; o erro da carga leva o status
# pares: use-library-data.test.tsx (+5), content-service.test.ts (+4), login-sessao-cn.test.tsx (a (v) em /setlists, div. 716); novo: components/painel/__tests__/painel-estados.test.tsx
```

## 16. Contabilidade (commit 2)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | `next dev` local **sem** `.env` (a árvore só tem `.env.example`) | 3 subidas na porta 3110 (a 3000 é de outro `next-server`, não tocado): inércia (2 rodadas, a 2ª sobre o estado final) e a fumaça local (§12.5); paradas ao fim |
| executor | navegador | a folha por `file://`; as públicas e a fumaça em `localhost:3110` |
| executor | páginas de fumaça | `app/fumaca-i1pr9/*` criadas e **apagadas** antes do commit (`git status` → 0) |
| — | `packages/identidade` | **mudou por adição** (div. 713, opção 2 do Marcel): três tokens do bloco `web`; o nativo não os lê (native 211/211) |
