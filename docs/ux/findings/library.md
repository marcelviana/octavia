# Findings — Library

Escopo: página `/library` (listagem, busca, filtros, paginação, estados vazio/sem-resultados), analisada a partir de 32 capturas (8 estados × 4 viewports em `docs/ux/capture/library/` e `docs/ux/capture/populated/library/`, seed de 60 itens) e do código em `components/library/`, `hooks/use-library-data.ts`, `app/library/page.tsx`, `components/header.tsx` (input de busca global), `lib/content-service.ts` e `app/api/content/route.ts`. Jobs de referência: J5 (achar música, 15%) como job central da área; J3 (preparar repertório, 15%) e J4 (importar, 10%) como dependentes; J1/J6 indiretos.

Violações axe deduplicadas na área: **8** pares regra×elemento (nested-interactive ×1 padrão de card; button-name ×5 elementos — sendo 2 do shell global do header, não da biblioteca; color-contrast ×1 padrão; heading-order ×1 padrão). Detalhadas em LIB-09 a LIB-12.

Nota de código (sem achado próprio): não há virtualização de lista (`OptimizedLibraryList.tsx` renderiza `content.map` direto), mas com pageSize fixo de 20 (`RefactoredLibrary.tsx:56`) o DOM fica pequeno — sem impacto de UX observável. O debounce de busca de 300 ms existe (`use-library-data.ts:65`), porém só é exercitado por mudanças de URL, não por digitação incremental (ver LIB-05).

## Achados

### [LIB-01] Biblioteca renderiza "No content found" em tablet landscape com dados existentes
- Evidência: `docs/ux/capture/populated/library/populated-default-tablet-landscape.png`, `search-artista-tablet-landscape.png`, `search-aguas-duplicados-tablet-landscape.png` e `long-titles-listing-tablet-landscape.png` mostram todos o estado vazio ("No content found / Try adjusting your search or filters") enquanto as capturas irmãs dos outros 3 viewports mostram os mesmos estados populados (ex.: `long-titles-listing-tablet-portrait.png` traz 2 resultados para a mesma busca "viol"). Código: `hooks/use-library-data.ts:179-181` (refresh forçado 100 ms após o mount) e `use-library-data.ts:151-162` (em erro de load, o conteúdo já renderizado via SSR é substituído pelo cache IndexedDB — que, vazio, zera a lista).
- Problema: em 4 dos 6 estados populados capturados a 1194×834, a lista veio vazia apesar do seed de 60 itens. O padrão do código explica o mecanismo provável: o SSR entrega dados, o cliente dispara `load(true)` e, se essa chamada falha (token Firebase ainda não pronto, por exemplo), o fallback troca dados bons por um cache vazio. Independente da causa exata, uma biblioteca que às vezes abre vazia destrói a confiança na ferramenta — e tablet landscape é exatamente o viewport de palco.
- Job afetado: J5 (achar música fica impossível), J3 (montar setlist sem biblioteca), J1 indireto (tablet landscape é o contexto do show)
- Severidade: S1
- Esforço: M
- Classe: estrutural

### [LIB-02] Títulos longos estouram o layout e escondem data, favorito e menu de ações de TODAS as linhas da página
- Evidência: `long-titles-listing-desktop.png` (título de 186 chars corre até a borda do card, sem ellipsis; data/estrela/kebab ausentes), `list-bottom-page3-desktop.png` (as 2 linhas longas empurram a coluna direita para fora do card em todas as ~20 linhas da página, inclusive nas de título curto), `list-bottom-page3-mobile.png` e `filter-type-tab-mobile.png` (a 390px, títulos normais como "Tema da Aula de Sexta" já empurram o kebab para fora; na page3 mobile nem estrela nem kebab aparecem). Código: `components/library/OptimizedLibraryList.tsx:233` — a lista vive dentro de `ScrollArea` (Radix), cujo viewport envolve o conteúdo em um wrapper `display: table; min-width: 100%`, o que anula o `truncate` do `h3` (linha 89) e força a largura natural do texto.
- Problema: o `truncate` existe no código mas não funciona na prática; um único título longo alarga a "tabela" inteira e joga favoritar/editar/excluir e a data para fora da área visível de todas as linhas da página. No mobile o efeito ocorre com títulos de tamanho corriqueiro, deixando as ações do item inacessíveis (o tap no card ainda abre o item).
- Job afetado: J5 (metadados de desambiguação somem), J4 (editar metadados de item recém-importado no celular fica sem caminho visível), J3
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [LIB-03] Itens duplicados são visualmente indistinguíveis na listagem
- Evidência: `search-aguas-duplicados-desktop.png` e `-mobile.png` (duas linhas idênticas: mesmo ícone, "[UX-AUDIT] Águas de Março", "Tom Jobim", badge "C", "Aug 8, 2026"); `list-bottom-page3-desktop.png` ("Evidências" ×2 idênticas). Código: `OptimizedLibraryList.tsx:87-151` — a linha só mostra título, artista, álbum (se houver), tom, dificuldade e data (só desktop).
- Problema: quando existem dois registros da mesma música (cifra antiga vs. nova, por exemplo), nada na listagem diz qual é qual — nem hora de criação, nem tipo por extenso, nem tamanho/origem do arquivo. O risco prático é abrir/adicionar à setlist ou **excluir** o item errado, e a exclusão é a ação destrutiva do menu.
- Job afetado: J5 (achar *a* versão certa), J3 (adicionar a versão errada à setlist do show)
- Severidade: S2
- Esforço: M
- Classe: estrutural

### [LIB-04] Busca é ILIKE de substring, sem tolerância a typo (confirmação do gap previsto em JOBS J5)
- Evidência: `lib/content-service.ts:342-345` (`title.ilike.%${search}%,artist.ilike.%${search}%,album.ilike.%${search}%`) e `app/api/content/route.ts:85` (mesmo padrão na rota usada pelo cliente). Sem normalização de acentos, sem fuzzy/trigram.
- Problema: "ipanma" não encontra "Garota de Ipanema"; busca digitada às pressas no meio de ensaio/show falha silenciosamente e cai no estado vazio genérico (LIB-08). Como o ILIKE é substring, a busca parcial funciona ("garota" acha), mas qualquer erro de digitação ou variação de acento no termo vs. no cadastro zera o resultado.
- Job afetado: J5 (critério explícito do job); J1 indireto (pedido de música no meio do show)
- Severidade: S2
- Esforço: M (pg_trgm/unaccent no Supabase) a G (ranking fuzzy completo)
- Classe: conceitual

### [LIB-05] Busca só dispara no Enter e custa uma navegação de página inteira; não há busca incremental
- Evidência: `components/header.tsx:26-34` — o único input de busca é o do header global, que faz `router.push('/library?search=...')` no submit do form; `components/library/LibraryHeader.tsx` não tem campo de busca próprio; `hooks/use-library-data.ts:58-65` — o debounce de 300 ms só reage à mudança de URL.
- Problema: cada busca exige digitar + Enter + navegação/SSR completa de `/library`; refinar o termo ("aguas" → "aguas de março") repete o ciclo inteiro. O debounce sugere que a intenção era busca incremental, mas nenhum input alimenta `setSearchQuery` por digitação. Em touch, o usuário depende da tecla de submit do teclado virtual; não há sugestões nem histórico.
- Job afetado: J5 (critério "do dashboard até resultado aberto ≤ 4 taps, ≤ 10 s" fica no limite; cada refinamento adiciona ciclo completo)
- Severidade: S2
- Esforço: M
- Classe: estrutural

### [LIB-06] Filtro ativo é invisível depois que o dropdown fecha; não há chip nem "limpar filtros"
- Evidência: `filter-type-tab-desktop.png` e `-mobile.png` — filtro de tipo (Lyrics) aplicado, lista filtrada, mas o botão "Filters" fica idêntico ao estado sem filtro (só o focus ring da captura o destaca); nenhum chip, contagem ou botão de limpar. Código: `components/library/LibraryHeader.tsx:83-153` — o trigger não reflete `filters` ativos; `hasActiveFilters` é importado em `RefactoredLibrary.tsx:13` mas só usado no empty state.
- Problema: com um filtro esquecido ativo, a biblioteca parece "faltar músicas" sem nenhuma pista do porquê — o usuário busca uma cifra, ela não aparece (está filtrada por Lyrics) e a mensagem sugere "Try adjusting your search or filters" sem dizer que há filtro ligado. Desfazer exige reabrir o dropdown e lembrar o que foi marcado.
- Job afetado: J5 (falso negativo na busca), J3
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [LIB-07] Scroll aninhado (ScrollArea de 70vh dentro da página) + paginação espremida/cortada no mobile
- Evidência: `populated-default-mobile.png` e `list-bottom-page3-mobile.png` — a linha "Previous 1 2 3 Next" aparece cortada ao meio, imprensada entre o card e a bottom nav (na page3, "Next" fica meio oculto); `populated-default-desktop.png` — a lista rola dentro do card (item 15 cortado ao meio na borda inferior) enquanto a página também rola. Código: `OptimizedLibraryList.tsx:233-238` (`h-[70vh]`), `LibraryPagination.tsx:60` (alvos de 32 px, `h-8 w-8`).
- Problema: com 60 itens há duas superfícies de rolagem concorrentes: o dedo rola a lista interna, mas a paginação vive fora dela, na página — no mobile ela fica praticamente inalcançável/ilegível atrás da bottom nav, e os alvos de 32 px ficam abaixo do mínimo confortável de toque. Navegar 3 páginas de 20 para "garimpar" exige precisão justamente no pior lugar da tela.
- Job afetado: J5 (JOBS: "com 40+ itens, a listagem sem busca ainda é navegável?"), J3
- Severidade: S2
- Esforço: M
- Classe: estrutural

### [LIB-08] Estado sem-resultados é genérico: não ecoa a query e é quase idêntico ao estado de biblioteca vazia
- Evidência: `library/search-noresults-desktop.png` e `-mobile.png` vs. `library/empty-desktop.png`/`empty-mobile.png` — mesmo ícone, mesmo título "No content found", mesmo CTA "Add Content"; só o subtítulo muda ("Try adjusting your search or filters" vs. "Add your first piece..."). Código: `components/library/LibraryEmptyState.tsx:34-41` — `searchQuery` chega como prop mas não é exibida.
- Problema: JOBS J5 pede explicitamente "nada encontrado para X + sugestão". Sem ecoar o termo buscado, o usuário não percebe um typo próprio (agrava LIB-04); e "No content found" com CTA de adicionar conteúdo, num resultado de busca, empurra para criar duplicado de algo que já existe com grafia diferente.
- Job afetado: J5
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [LIB-09] Card inteiro é role="button" com botões interativos aninhados (axe: nested-interactive, serious)
- Evidência: axe em todas as capturas populadas (182 nós brutos, 1 padrão deduplicado — o div `role="button"` de cada linha). Código: `OptimizedLibraryList.tsx:79-86` — o container clicável (`role="button"`, `tabIndex=0`) envolve o botão de favorito (155-171) e o kebab (174-207).
- Problema: controles interativos dentro de um elemento com role de botão são inacessíveis/ambíguos por teclado e leitores de tela — o foco entra num "botão dentro de botão" e a ordem de tabulação fica imprevisível. Para navegação por teclado no desktop (contexto J3, sofá/notebook), favoritar ou abrir o menu sem mouse é pouco confiável.
- Job afetado: nenhum diretamente (Marcel usa touch/mouse); registrado porque é a violação axe mais numerosa da área, é padrão replicado em toda linha da lista e degrada teclado no desktop
- Severidade: S3
- Esforço: M
- Classe: estrutural

### [LIB-10] Controles icon-only sem nome acessível (axe: button-name, critical — 5 elementos, 2 deles do shell global)
- Evidência: axe deduplicado: (1) trigger de Filters em mobile/tablet — `LibraryHeader.tsx:85-93`, o texto "Filters" é `hidden md:inline`; (2) trigger do Sort (combobox) — `LibraryHeader.tsx:157-162`, "Sort" é `hidden md:inline`; (3) botão Add Content em mobile — `LibraryHeader.tsx:171-178`, "Add Content" é `hidden sm:inline`; (4-5) botões de menu/colapso do header global — `components/header.tsx:41-57` (achado do shell, contabilizado aqui só para o total axe da área).
- Problema: abaixo de `md`, os três controles principais da biblioteca viram ícones sem `aria-label` — nenhum nome para leitores de tela e tooltips inexistentes. O fix é uma linha por botão (`aria-label`), preservando o design.
- Job afetado: nenhum diretamente (usuário único sem AT declarada); registrado por ser violação axe critical, de correção trivial, nos controles centrais da área
- Severidade: S3
- Esforço: P
- Classe: estrutural

### [LIB-11] Texto secundário (artista/data) com contraste 2.62:1 (axe: color-contrast, serious)
- Evidência: axe em `filter-type-tab-*.axe.json`: `#a69b8e` sobre `#fffbeb` = 2.62:1 (mínimo WCAG AA: 4.5:1) no span do artista e na coluna de data; o mesmo token `text-[#A69B8E]` é usado em `OptimizedLibraryList.tsx:92,108,148` e nos subtítulos de header/empty state.
- Problema: a linha do artista é o segundo critério de identificação de uma música (e o único desambiguador visível quando há duplicados — ver LIB-03), mas está bem abaixo do contraste mínimo. Em tablet sob luz ruim de bar (contexto declarado de J1), texto a 2.62:1 fica genuinamente difícil de ler.
- Job afetado: J5 (ler artista para confirmar o resultado); J1 indireto (luz ruim)
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [LIB-12] Hierarquia de headings salta de h1 para h3 (axe: heading-order, moderate)
- Evidência: axe em todas as capturas (1 padrão deduplicado): títulos de item são `<h3>` (`OptimizedLibraryList.tsx:89`) e o título do empty state é `<h3>` (`LibraryEmptyState.tsx:34`), sem `<h2>` entre eles e o `<h1>` "Your Music Library" (`LibraryHeader.tsx:73`).
- Problema: quebra a navegação por estrutura de leitores de tela e sinaliza que os títulos de card estão usando heading por estilo, não por semântica (itens de lista não precisariam ser headings).
- Job afetado: nenhum; registrado para fechar o inventário axe da área — correção mecânica junto de LIB-09/LIB-10
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [LIB-13] Botão primário azul/índigo destoa da paleta âmbar do app
- Evidência: `populated-default-desktop.png`, `empty-mobile.png` — "Add Content" (header e empty state) usa gradiente `from-blue-600 to-indigo-600` (`LibraryHeader.tsx:173`, `LibraryEmptyState.tsx:44`) num app inteiramente âmbar/laranja (sidebar, título, filtros, bottom nav); o "Try Again" do error boundary usa gradiente âmbar (`LibraryErrorBoundary.tsx:64`), evidenciando dois padrões de botão primário na mesma área.
- Problema: o CTA principal parece elemento de outro produto; a inconsistência de token de ação primária (azul aqui, âmbar no erro) dilui a linguagem visual. Se o azul é intencional como cor de ação, falta aplicá-lo consistentemente.
- Job afetado: nenhum (não afeta execução de nenhum job); registrado como inconsistência de token visível em todas as capturas da área, insumo para a síntese de consistência
- Severidade: S3
- Esforço: P
- Classe: cosmético

## Verificar na Fase D

1. **LIB-01 (prioridade)**: reproduzir a lista vazia — abrir `/library` (e `/library?search=viol`) a 1194×834 com IndexedDB frio e rede normal: a lista chega a mostrar dados e depois esvazia (flash), ou já monta vazia? O erro some com reload? Confirmar se a causa é o fallback de `use-library-data.ts:151-162` descartando o SSR.
2. **J5 latência**: cronometrar do primeiro tap no campo de busca do header até o resultado renderizado (inclui navegação SSR de `/library`) — cabe nos ≤ 10 s / ≤ 4 taps do dashboard ao resultado aberto?
3. **J5 typo ao vivo**: buscar "ipanma" e "aguas" (sem acento) com dados reais — o unaccent do Postgres/collation salva algum caso, ou ambos zeram como o código indica?
4. **J5 no palco**: existe algum caminho para a busca de dentro do modo performance ("toca aquela!" no meio do show)? Quantos taps para sair, buscar e abrir?
5. **J3**: o menu do item na biblioteca só tem View/Edit/Delete (`OptimizedLibraryList.tsx:187-205`) — não há "Add to setlist". Medir o fluxo real de adicionar 10 músicas via tela de setlist: fica dentro de ≤ 3 taps por música sem ida-e-volta?
6. **LIB-07 touch**: no tablet/celular físico, o gesto de rolagem é capturado pela ScrollArea interna ou pela página? A paginação é alcançável e tocável (alvos de 32 px) com a bottom nav presente?
7. **Filtros em touch**: os badges `text-xs` do dropdown de filtros são tocáveis com confiança? A seleção múltipla de tipos se comporta como esperado?
8. **J4 pós-import**: com o cache de 30 s de `content-service.ts:280-286` e o refresh por foco de `use-library-data.ts:223-256`, um item recém-importado aparece na biblioteca imediatamente ao voltar, sem reload manual?
