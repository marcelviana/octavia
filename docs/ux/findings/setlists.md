# Findings — Setlists

Escopo: área de setlists (listagem, detalhe, dialogs de criação/edição e picker de músicas) avaliada contra J3 (preparar repertório, 15%) e J1 (porta de entrada do show, 40%), com toques em J2 e J6. Insumos: 32 capturas (8 estados × 4 viewports em `docs/ux/capture/setlists/` e `docs/ux/capture/populated/setlists/`, incluindo `.axe.json`), código de `components/setlist/`, `components/setlist-manager.tsx`, `hooks/use-setlist-data.ts`, `app/setlists/page.tsx`, rotas `app/api/setlists/**` e libs `lib/api-validation-middleware.ts`, `lib/input-sanitizer.ts`, `lib/rate-limit.ts`, `lib/setlist-service.ts`, `supabase/schema.sql`.

Violações axe deduplicadas na área: **28 pares regra×elemento**, que colapsam em **3 causas-raiz** — 1 `button-name` (critical), 1 padrão recorrente de `color-contrast` (serious, 26 pares, todos o mesmo botão azul `#2E7CE4`) e 1 `page-has-heading-one` (moderate). Viram os achados SET-16, SET-20 e SET-21.

Nota positiva de baseline: o picker de músicas (`song-selection-dialog.tsx`) é um "modo picker" real — busca client-side, seleção múltipla com checkbox, adição em lote sem sair da tela da setlist — e o estado vazio orienta o próximo passo com CTA claro. A estrutura atende o espírito do J3; os achados abaixo são o que impede a execução.

## Achados

### [SET-01] Venue, data de performance e notas são inatingíveis — o servidor descarta silenciosamente
- Evidência: `lib/api-validation-middleware.ts:197-216` (schemas `setlistSchemas.create`/`update` não têm `venue`, `performance_date` nem `notes`; Zod descarta chaves desconhecidas); `app/api/setlists/route.ts:123-125` (lê `validatedData.performance_date`/`venue`/`notes`, que são sempre `undefined` → grava `null`); `app/api/setlists/[id]/route.ts:166-175` (PUT só mapeia `name` e `description`); o cliente envia os campos (`lib/setlist-service.ts:141-147`, `components/setlist-manager.tsx:81-110`) e o dialog os expõe com destaque (`components/setlist/setlist-dialog.tsx:149-189`). Capturas: `edit-dialog-show-padrao-*` mostram Performance Date/Venue/Notes vazios numa setlist seedada; `populated-list-*` e `detail-*` sem nenhuma data/local visível.
- Problema: o usuário preenche data/local/notas, recebe "Setlist updated successfully" e na próxima abertura os campos estão vazios — perda de dados silenciosa. Consequência direta no J1: a listagem nunca mostra a data do show, então "localizar a setlist do show de hoje" depende só do nome. Os badges "upcoming/recent" do card (`setlist-card.tsx:66-68`) são código morto na prática.
- Job afetado: J3 (passo 1 pede setlist com nome e data), J1 (localizar setlist do show)
- Severidade: S1
- Esforço: P
- Classe: estrutural

### [SET-02] Nomes de setlist com ( ) [ ] & ' " são zerados pelo sanitizador em modo strict
- Evidência: `lib/api-validation-middleware.ts:48-59` (`createSafeText` aplica `sanitizeInput` nível strict ao `name`, usado em `:198` e `:209`); `lib/input-sanitizer.ts:214-221` (STRICT: qualquer "ameaça" detectada → `sanitized = ''`); padrões que disparam com texto musical normal: `:16` (aspas simples/duplas, `&`, `|`, `+`, `-`, `;`), `:43` (`( ) [ ] { }`), `:38` (`\.{2,}` — reticências).
- Problema: nomes reais como "Sexta no Zé (Acústico)", "Rock & Samba" ou "Marcel's Set" são detectados como SQL/command injection e viram string vazia. Como o `transform` roda depois do `min(1)`, a validação passa e a setlist persiste com nome `""` — sem erro, sem aviso. O usuário cria/renomeia e a setlist aparece sem nome na lista.
- Job afetado: J3 (criar setlist), J1 (localizar a setlist pelo nome — nome sumiu)
- Severidade: S1
- Esforço: M
- Classe: conceitual (sanitização de segurança de transporte aplicada a dado de domínio; o campo nunca é interpretado como SQL/HTML)

### [SET-03] Reordenar músicas não persiste: o handler da UI é um TODO — a API de reorder existe e funciona
- Evidência: camada morta (UI): `components/setlist-manager.tsx:278-281` (`onReorderSongs={... // TODO: Implement song reordering; console.log(...)}`). Camada viva (API): `app/api/setlists/songs/[songId]/route.ts:219-283` — o two-phase UPDATE de reorder está implementado e foi confirmado funcional pela auditoria prévia (suas fragilidades são o SET-07); o client-service que a chama também existe (`lib/setlist-service.ts:330-367`, `updateSongPosition`, importado em `setlist-manager.tsx:13` mas nunca invocado). `components/setlist-manager-original.tsx.backup:475` mostra que a chamada existia antes do refactor — é regressão. A UI de drag existe e parece funcional (`setlist-details.tsx:86-112, 227-235`, com grip handle e feedback de opacidade).
- Problema: o usuário arrasta a música, vê o feedback visual de drag, solta — e nada persiste; a ordem volta ao que era. A quebra está exclusivamente no elo UI→service: o handler descarta o evento num `console.log`, enquanto API e service estão prontos dos dois lados. Critério central do J3 ("mover a música 8 para a posição 2") quebrado por completo, com o agravante de a UI fingir que a feature existe.
- Job afetado: J3 (reordenar), J1 (ordem do show é o produto da setlist)
- Severidade: S1
- Esforço: P (religar o fio à API existente; a qualidade do backend é o SET-07)
- Classe: estrutural

### [SET-04] Drag-and-drop é HTML5 puro — não funciona em touch, e não há controle alternativo
- Evidência: `components/setlist/setlist-details.tsx:227-231` (`draggable` + `onDragStart/onDrop`, API de drag de mouse); nenhum handler de touch/pointer, nenhum botão subir/descer no código da área.
- Problema: mesmo depois de ligar o SET-03, tablet — o dispositivo declarado do J3 e do J1 — não consegue reordenar: a API HTML5 de drag não dispara com toque. O critério do J3 exige explicitamente "drag-and-drop funcional em touch **e** mouse, ou controles equivalentes"; hoje não há nem um nem outro em touch.
- Job afetado: J3 (reordenar no tablet)
- Severidade: S1
- Esforço: M (dnd-kit/pointer events ou botões de mover)
- Classe: estrutural

### [SET-05] Rate limiter por IP com janela deslizante trava a montagem de setlist grande
- Evidência: `lib/rate-limit.ts:41-49` (dois singletons compartilhados por TODAS as rotas; token = IP, `lib/rate-limit.ts:61-66`); `lib/rate-limit.ts:22-29` (`cache.set(token, hit)` a cada request renova o TTL do LRU — o contador nunca expira enquanto houver tráfego contínuo); `app/api/setlists/[id]/songs/route.ts:105` (`withRateLimit(..., 50)`); `components/setlist-manager.tsx:171-185` (adicionar N músicas = N POSTs sequenciais).
- Problema: o contador é único por IP e compartilhado entre todas as rotas (GETs de refresh, focus-refresh do hook `use-setlist-data.ts:163-188` etc. contam junto). Adicionar as 60 músicas do seed — ou ~50 numa sessão ativa — atinge 429 no meio do lote; a UI mostra só o toast genérico "Failed to add songs" e o estado local fica meio-adicionado. Como o TTL renova a cada request, continuar tentando mantém o bloqueio.
- Job afetado: J3 (montar repertório grande; cenário de estresse do seed)
- Severidade: S1
- Esforço: P (não renovar TTL / limitar por rota; ou endpoint de adição em lote)
- Classe: estrutural

### [SET-06] Bis/encore impossível (mesma música 2× na setlist) e a falha vira 500 mudo
- Evidência: UI: o picker exclui músicas já presentes (`components/setlist-manager.tsx:314` passa `excludeSongIds`; `components/setlist/song-selection-dialog.tsx:67` filtra). Banco: constraint única em `supabase/schema.sql:68` (`UNIQUE(setlist_id, position)` no schema versionado; auditoria prévia confirma unique `(setlist_id, content_id)` no banco vivo). Servidor: violação de insert vira `500 'Internal server error'` sem mensagem específica (`app/api/setlists/[id]/songs/route.ts:76-88`).
- Problema: repetir uma música (bis, reprise de abertura/encerramento) é padrão real de show e é impossível: a UI esconde a música do picker e, se forçado via API, o erro é um 500 genérico que não explica nada. Não há caminho nem mensagem.
- Job afetado: J3 (montar o repertório que o show precisa), J1 (a setlist não reflete o show real)
- Severidade: S2
- Esforço: M (remover unique de content_id + permitir repetição no picker)
- Classe: conceitual (o modelo assume "música ∈ setlist" como conjunto, mas setlist é sequência)

### [SET-07] Reorder no servidor faz 2N UPDATEs sequenciais sem transação, com posições 10000+ persistíveis
- Evidência: `app/api/setlists/songs/[songId]/route.ts:219-244` (passo 1: move TODAS as músicas para posições temporárias 10000+i, um UPDATE por linha) e `:267-283` (passo 2: regrava 1..N, mais um UPDATE por linha); sem transação/RPC. Remoção tem o mesmo padrão de shift 1-a-1 (`:106-120`). A UI mascara corrupção exibindo `index + 1` em vez da posição real (`setlist-details.tsx:239-241`).
- Problema: um drag na setlist de 60 músicas dispara 120 UPDATEs sequenciais — latência alta e, se qualquer um falhar no meio (rede, erro), o banco fica com posições 10000+ persistidas permanentemente, sem rollback. O PUT também não tem validação Zod (`:162-170` lê o body cru, contrariando o padrão do projeto).
- Job afetado: J3 (reordenar a setlist de 60 do seed), J1 (ordem corrompida = show errado)
- Severidade: S2 (latente enquanto SET-03 mantém o reorder desligado; vira S1 assim que ligar)
- Esforço: M (RPC/única query com transação)
- Classe: estrutural

### [SET-08] O tom (key) não aparece em lugar nenhum da área
- Evidência: linha de música no detalhe mostra título/artista/badge de tipo/notas — sem key nem BPM (`components/setlist/setlist-details.tsx:243-271`); picker idem (`components/setlist/song-selection-dialog.tsx:202-222`). A API retorna `key` e `bpm` em todas as respostas (`app/api/setlists/route.ts:59,91`), o dado só é jogado fora na renderização. Capturas `detail-show-padrao-*` confirmam.
- Problema: o critério do J3 é literal — "a listagem da setlist mostra título, artista e tom sem precisar abrir cada item" — e o passo 5 ("conferir tonalidades na listagem") é impossível: para saber o tom é preciso abrir cada música. No picker, escolher entre duas versões da mesma música também fica às cegas.
- Job afetado: J3 (revisar tonalidades), J5 (conferir um tom)
- Severidade: S2
- Esforço: P (o dado já chega ao componente)
- Classe: estrutural

### [SET-09] Remover música recém-adicionada falha até recarregar a página (IDs falsos no estado local)
- Evidência: `components/setlist-manager.tsx:180` (após adicionar, o estado local recebe `id: \`${setlistId}-${songId}\`` inventado, em vez do UUID que o POST retorna — a resposta do servidor é descartada); a remoção usa esse id (`components/setlist-manager.tsx:208-211`) e o DELETE `app/api/setlists/songs/[songId]/route.ts:45-62` faz `.eq("id", <id falso>).single()` → erro → 500.
- Problema: no fluxo natural do J3 ("adicionei 10, removo 1 que não vai entrar"), a remoção de qualquer música adicionada na mesma sessão falha com toast genérico "Failed to remove song". Só funciona depois de recarregar a página, quando os IDs reais chegam do servidor. O usuário não tem como entender o padrão.
- Job afetado: J3 (passo 4)
- Severidade: S2
- Esforço: P (usar o `song` retornado pelo POST, já disponível em `addSongToSetlist`)
- Classe: estrutural

### [SET-10] Mobile/tablet-portrait: selecionar uma setlist não leva ao detalhe — ele fica empilhado abaixo da lista inteira
- Evidência: `components/setlist-manager.tsx:251-291` (grid `lg:grid-cols-2`; abaixo de 1024px as colunas empilham, detalhe depois da lista completa, sem scroll automático). Capturas: `detail-show-padrao-mobile.png` (após seleção, o viewport mostra a mesma lista, só com o card destacado — zero feedback de "abriu"); `detail-estresse-top-tablet-portrait.png` (detalhe começa depois dos 3 cards). Havia navegação para rota própria que virou código morto: `app/setlists/page.tsx:37-39` define `handleSelectSetlist` → `/setlist/[id]`, nunca passado ao manager, e a rota `app/setlist/` nem existe.
- Problema: no celular/tablet-portrait o tap na setlist parece não fazer nada; o usuário precisa adivinhar que deve rolar além de todos os cards para ver as músicas. Com a setlist de estresse selecionada, são 60 linhas empilhadas entre a lista e o fim da página.
- Job afetado: J3, J1 (localizar setlist → ver músicas → Start Performance em mobile/tablet-portrait)
- Severidade: S2
- Esforço: M (auto-scroll/rota de detalhe ou master-detail responsivo)
- Classe: estrutural

### [SET-11] Títulos das músicas truncados a ponto de ilegíveis em mobile e tablet-landscape
- Evidência: capturas `detail-estresse-bottom-mobile.png` (títulos viram "[UX-…" e artistas "Conj…" — ~4 caracteres úteis) e `detail-estresse-top-tablet-landscape.png` ("[UX-AUDIT] Pa…"). Causa no layout da linha: posição + grip + badge com `ml-4` fixo têm prioridade sobre o título `truncate` (`components/setlist/setlist-details.tsx:233-271`), somado à coluna direita espremida pelo grid 2 colunas no tablet-landscape (1194px, o viewport do J1).
- Problema: no detalhe da setlist — a tela cujo único propósito é listar as músicas — não dá para identificar as músicas. O prefixo `[UX-AUDIT]` do seed agrava, mas com badge, número e handle consumindo ~140px da linha, qualquer título real de mais de ~15 caracteres também morre no tablet-landscape.
- Job afetado: J3 (revisar ordem final), J1 (conferir a setlist antes do show no tablet), J2 (achar a música 7)
- Severidade: S2
- Esforço: P (badge abaixo/atrás do título, remover ml fixo, esconder handle quando inútil)
- Classe: estrutural

### [SET-12] Ações críticas só aparecem no hover e têm alvos de 28px — invisíveis/inacertáveis em touch
- Evidência: Edit/Delete do card: `components/setlist/setlist-card.tsx:98` (`opacity-0 group-hover:opacity-100`, botões `h-7 w-7`); Play-desta-música e Remover da linha: `components/setlist/setlist-details.tsx:277,288` (mesmo padrão). Capturas mobile mostram os ícones aparecendo apenas no item tocado por acaso (`populated` vs `detail-show-padrao-mobile.png`; linha 53 em `detail-estresse-bottom-mobile.png`).
- Problema: em tablet/celular não existe hover — editar/excluir setlist, remover música e "Start performance from this song" (o atalho de pular direto para uma música, relevante para J1/J2) ficam invisíveis ou dependem de um tap "mágico" prévio. Quando aparecem, 28px fica abaixo do mínimo de toque (~44px), num contexto em que o vizinho é um botão destrutivo (Play ao lado de Trash).
- Job afetado: J3 (editar/remover), J1/J2 (começar da música N no tablet)
- Severidade: S2
- Esforço: P (ações sempre visíveis em touch + alvos ≥44px)
- Classe: estrutural

### [SET-13] Duração total da setlist é fabricada e apresentada como fato
- Evidência: `components/setlist/setlist-card.tsx:41-46` e `components/setlist/setlist-details.tsx:65-70`: `duração = (bpm/60)*3` minutos, ou 4 min quando não há BPM — fórmula sem sentido dimensional (BPM 120 → "6m"; BPM 60 → "3m"). Capturas: badges "4h 6m" (60 músicas), "32m" (8), "4m" (1) em `populated-list-*` e cabeçalhos de detalhe.
- Problema: não existe campo de duração no conteúdo; o número exibido com ícone de relógio é invenção determinística que parece medição. Um músico pode dimensionar o set de um show contra o tempo de palco usando um número falso. Pior que ausência de informação.
- Job afetado: J3 (revisar o set contra o tempo disponível)
- Severidade: S2
- Esforço: P (remover, ou rotular como estimativa com fórmula honesta: nº músicas × média configurável)
- Classe: conceitual

### [SET-14] Cache offline é gravado com estado desatualizado após cada mutação
- Evidência: `components/setlist-manager.tsx:99` (`await saveSetlists(setlists)` após update — grava o array capturado ANTES da mutação), `:189` e `:220` (`setlists.map(...)` sobre a closure stale, enquanto o estado React foi atualizado via `setSetlists(prev => ...)`).
- Problema: depois de editar, adicionar ou remover músicas, o IndexedDB — a fonte do J6 — recebe a versão antiga da setlist. O cenário exato do J6 ("montei/ajustei a setlist, chego no barzinho sem sinal") abre a setlist desatualizada, sem qualquer aviso, e o usuário só descobre no palco.
- Job afetado: J6 (offline é binário), J1
- Severidade: S2
- Esforço: P (derivar o array atualizado uma vez e usá-lo em setState e no cache)
- Classe: estrutural

### [SET-15] Não existe "duplicar setlist"
- Evidência: nenhuma função de duplicação em `components/setlist/`, `components/setlist-manager.tsx`, `lib/setlist-service.ts` ou `app/api/setlists/**` (busca por duplicate/clone/copy vazia). O menu do card só tem Edit/Delete/Start (`setlist-card.tsx:98-136`).
- Problema: J3 passo 6 pedia confirmação e determina: "se não existe, registrar como gap — padrão de uso muito comum". Partir de uma setlist antiga hoje significa recriar na mão: com 12 músicas são ~30-40 taps, sujeitos ao rate limit do SET-05.
- Job afetado: J3
- Severidade: S2
- Esforço: M (endpoint de clone + ação na UI)
- Classe: estrutural

### [SET-16] Contraste insuficiente em todos os botões primários da área (axe: color-contrast, serious)
- Evidência: 26 dos 28 pares regra×elemento deduplicados dos `.axe.json` — todos o mesmo padrão: texto branco sobre `#2E7CE4` (≈3.56:1 < 4.5:1 AA). Elementos: Start Performance, Create Setlist, Add Songs, Update Setlist, Create Your First Setlist (`setlist-card.tsx:186`, `setlist-list.tsx:89,110`, `setlist-details.tsx:169,191`, `setlist-dialog.tsx:205`, `song-selection-dialog.tsx:244` — cor hardcoded em cada componente, sem token).
- Problema: exatamente os CTAs do caminho crítico ficam abaixo do contraste mínimo — relevante no contexto declarado do J1 (iluminação ruim de palco). A cor repetida hardcoded em 7+ lugares também torna a correção propensa a esquecer instâncias.
- Job afetado: J1, J3
- Severidade: S2
- Esforço: P (escurecer o azul para ~#1E5FBF+ e centralizar como token/variant)
- Classe: cosmético

### [SET-17] Data de performance renderizada com off-by-one de fuso horário
- Evidência: `components/setlist/setlist-card.tsx:172` e `components/setlist/setlist-details.tsx:135`: `new Date(setlist.performance_date).toLocaleDateString()` — string date-only é parseada como UTC meia-noite; em UTC-3 (Brasília) exibe o dia anterior. Também afeta `isUpcoming`/`isRecent` (`setlist-card.tsx:66-68`).
- Problema: quando SET-01 for corrigido (ou com dados seedados direto no banco), o show de sábado aparece como sexta. Para um app de shows, data errada por um dia é o pior tipo de erro discreto.
- Job afetado: J1 (localizar a setlist do show de hoje), J3
- Severidade: S3 (latente atrás do SET-01; sobe junto com ele)
- Esforço: P
- Classe: estrutural

### [SET-18] Estado vazio em mobile arrasta um painel "Select a setlist to view its details" inútil
- Evidência: captura `docs/ux/capture/setlists/empty-mobile.png` — abaixo do empty state (que é bom: ícone, texto, CTA), um painel cinza com a instrução de seleção, sem nada para selecionar; `components/setlist-manager.tsx:283-289` renderiza o placeholder do painel de detalhe incondicionalmente.
- Problema: instrução impossível de cumprir ("selecione uma setlist" quando não existe nenhuma) e, no layout empilhado, o painel nem faz sentido espacial. Ruído pequeno, mas na primeira tela que um usuário novo vê na área.
- Job afetado: nenhum diretamente (o app tem 1 usuário que já passou do vazio) — registrado porque o mesmo placeholder incondicional também aparece após deletar a última setlist, e a correção é trivial.
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [SET-19] Na setlist de 60, as ações do topo (Start Performance / Add Songs) somem ao rolar — e a página inteira rola
- Evidência: `components/setlist-manager.tsx:251` fixa `h-[calc(100vh-8rem)]` no grid, mas nenhuma coluna tem `overflow-auto`, então o conteúdo estoura e o scroll é da página inteira. Capturas `detail-estresse-bottom-*`: nenhuma ação visível além das linhas 52-60; header, lista de setlists e botões desapareceram. Em `detail-estresse-top-tablet-portrait.png` a bottom nav ainda encobre parcialmente a última linha visível.
- Problema: para entrar em performance ou adicionar músicas depois de revisar o fim da setlist de 60, é preciso rolar tudo de volta ao topo. O `h-[calc(...)]` sugere que o design era duas colunas com scroll independente — o comportamento atual é o layout quebrando essa intenção. Sem virtualização, os 60 itens também são todos renderizados (performance a verificar na Fase D).
- Job afetado: J1 (chegar ao Start Performance), J3 (alternar revisar↔adicionar na setlist grande)
- Severidade: S3
- Esforço: P (overflow-auto por coluna ou header sticky)
- Classe: estrutural

### [SET-20] Botão de ícone sem nome acessível no header (axe: button-name, critical)
- Evidência: axe `button-name`/critical no elemento `.md\:inline-flex` em 21 das 32 capturas da área — é o botão de recolher a sidebar no shell do app (visível no topo-esquerdo das capturas desktop/tablet).
- Problema: botão só-ícone sem `aria-label`; leitor de tela anuncia "button" sem função. Elemento do shell (aparece em todas as áreas) — registrado aqui pelo dedup da área, candidato a consolidação na síntese como achado global.
- Job afetado: nenhum job diretamente (a11y transversal); registrado por ser a única violação axe critical da área.
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [SET-21] Página sem h1 (axe: page-has-heading-one, moderate)
- Evidência: axe em todas as 32 capturas; "Your Setlists" é `h2` (`components/setlist/setlist-list.tsx:103`) e não há `h1` na página.
- Problema: hierarquia de headings sem nível 1 prejudica navegação por leitor de tela. Provavelmente padrão do shell em todas as páginas (consolidar na síntese).
- Job afetado: nenhum diretamente (a11y transversal).
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [SET-22] Carga de dados desproporcional: N+1 no GET de setlists com content_data completo, e picker carrega a biblioteca inteira
- Evidência: `app/api/setlists/route.ts:35-100` (para cada setlist, 2 queries; seleciona `content_data` integral de cada música — `:59`); `hooks/use-setlist-data.ts:69-79` (carrega TODO o conteúdo com `pageSize: 1000` a cada visita e a cada retorno de foco após 30s, `:163-188`).
- Problema: abrir /setlists baixa os blobs de `content_data` de todas as músicas de todas as setlists (a de estresse tem 60), mais a biblioteca inteira — para telas que só exibem título/artista/badge. Custo cresce com a biblioteca e pesa exatamente no cenário J3 (repertório grande) e no primeiro carregamento pré-cache do J6.
- Job afetado: J3, J6 (indireto: tempo de popular o cache)
- Severidade: S3
- Esforço: M
- Classe: estrutural

## Verificar na Fase D

1. **Taps do fluxo de adicionar (J3)**: adicionando 10 músicas pelo picker (abrir → buscar → marcar → "Add 10 Songs"), quantos taps por música saem na prática? Fica ≤3/música sem sair da tela?
2. **Rate limit real (SET-05)**: numa sessão dev normal, em qual adição o 429 dispara ao montar uma setlist de 50+? O que exatamente o usuário vê e em que estado fica a setlist (quantas persistiram vs. quantas o estado local mostra)?
3. **Reorder pós-fix (SET-03/07)**: com o fio religado, qual a latência de um drag na setlist de 60 (120 UPDATEs)? Interromper no meio (matar rede) deixa posições 10000+ no banco? A UI reflete ou mascara?
4. **Touch real (SET-04/12)**: em iPad físico/simulado, o drag inicia com toque? Os ícones hover-only aparecem com um tap? Quantos taps até remover uma música em touch?
5. **Mobile pós-seleção (SET-10)**: após tocar num card com a setlist de estresse selecionada, quanto scroll até a primeira música? Existe algum auto-scroll não visível em screenshot estático?
6. **Scroll dos 60 sem virtualização (SET-19/22)**: jank perceptível ao rolar o detalhe da setlist de estresse em tablet? Tempo de carregamento inicial de /setlists com o seed completo?
7. **Bis forçado (SET-06)**: a constraint `(setlist_id, content_id)` já está confirmada por probe no banco vivo (500 na duplicata). Falta só verificar se `(setlist_id, position)` — a do schema versionado (`supabase/schema.sql:68`) — também existe no banco vivo, pois ela mudaria o risco do reorder (SET-07: colisão de position no meio dos 2N UPDATEs).
8. **J1 porta de entrada**: da tela inicial, "Start Performance" no card leva à primeira música em tela cheia em ≤4 taps / ≤10s? E a partir da música N via botão hover da linha?
9. **Offline após mutação (SET-14)**: editar setlist → modo avião → reabrir: a versão cacheada é a anterior à edição?
10. **Bottom nav sobrepondo conteúdo** (tablet-portrait/mobile): a última linha da lista fica permanentemente encoberta ou há padding compensatório ao fim do scroll?
