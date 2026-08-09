# Findings — Performance Mode

Área do **J1 — Show ao vivo** (peso 40%, veta o backlog), servindo também J2 (ensaio) e J6 (offline).
Insumos: capturas `docs/ux/capture/performance/` (estado vazio, 4 viewports) e
`docs/ux/capture/populated/performance/` (7 estados × 4 viewports, com `.a11y.json`/`.axe.json`),
mais leitura integral do código do modo performance (`components/optimized-performance-mode.tsx`,
`components/performance-mode/*`, `hooks/use-performance-*.ts`, `hooks/use-wake-lock.ts`,
`hooks/use-content-loading.ts`, `app/performance/page.tsx`). Ênfase em tablet-landscape (1194px),
contexto real do palco.

**Violações axe deduplicadas na área: 17** (3 critical `button-name`, 3 serious `color-contrast`,
1 serious `scrollable-region-focusable`, 10 moderate `region`/`landmark-one-main`/`page-has-heading-one`).
Confirmado: é a pior área do app em violações axe, incluindo `scrollable-region-focusable` no
container de scroll do conteúdo (`.overflow-auto`, presente em 3 capturas de letra/cifra).

## Achados

### [PERF-01] Setlist grande (60 músicas) estoura o layout: Prev/Next somem da tela
- Evidência: `populated/performance/setlist-estresse-ultima-musica-mobile.png` (Prev/Next totalmente fora do viewport de 390px; fileira de dots vaza da barra escura sobre fundo branco), `setlist-estresse-ultima-musica-tablet-portrait.png` (botões cortados: "ev" / "Ne", página com overflow horizontal); código em `components/performance-mode/navigation-controls.tsx:46-56` (um `div w-2 h-2` por música, sem wrap/scroll/limite).
- Problema: a barra de navegação renderiza um dot de 8px por música da setlist em linha única sem colapso. Com 60 músicas (setlist de estresse do seed — cenário real de gig longa) a linha excede a largura do viewport em mobile e tablet-portrait, empurrando os botões Prev/Next para fora da tela. Na última música do show o músico fica literalmente sem controle de navegação visível. Em tablet-landscape 1194px cabe por pouco; qualquer setlist maior quebra também lá.
- Job afetado: J1, J2
- Severidade: S1
- Esforço: M
- Classe: estrutural

### [PERF-02] PDF renderiza 100% em branco em todas as capturas — sem fallback nem erro
- Evidência: `populated/performance/setlist-show-primeira-musica-{mobile,tablet-portrait,tablet-landscape,desktop}.png` e `pdf-12paginas-avulso-*.png` (8 capturas: área de conteúdo totalmente branca, título "[UX-AUDIT] Partitura de 12 páginas" no header); código em `components/performance-mode/optimized-content-display.tsx:43-48` (iframe sem handler de erro, sem placeholder de carregamento, sem fallback).
- Problema: em todas as 8 capturas com PDF a música simplesmente não existe na tela — o pior estado possível do J1 ("zero estados em que a música desaparece"). Parte disso pode ser artefato do Chromium headless do harvester (viewer de PDF desabilitado em headless), mas o código confirma que não há **nenhum** tratamento de falha do iframe: se o blob não carrega no palco, o músico vê tela branca sem mensagem nem ação. Registrado como S1 provisório; a reprodução em navegador real é item obrigatório da Fase D.
- Job afetado: J1, J6
- Severidade: S1 (a confirmar em navegador real na Fase D; a ausência de fallback/erro é fato de código independente do artefato)
- Esforço: M
- Classe: estrutural

### [PERF-03] Crash "Cannot read properties of null (reading 'bpm')" no estado vazio — CORRIGIDO
- Evidência: `performance/empty-{mobile,tablet-portrait,tablet-landscape,desktop}.png` (error boundary "Something went wrong / Cannot read properties of null (reading 'bpm')" + botão Reload page); fix em `components/optimized-performance-mode.tsx:92` (`if (songs.length === 0) return <EmptyState .../>`), guards em `hooks/use-performance-controls.ts:219` (`currentSongData?.bpm || 80`) e `components/performance-mode/empty-state.tsx` (commit a3114cc).
- Problema: `/performance` sem `contentId`/`setlistId` crashava em produção exigindo reload — violação direta do critério "zero estados que quebram/exigem reload" do J1. O commit a3114cc introduziu o `EmptyState` ("No song selected" + "Go back") e optional chaining nos hooks; o código atual está corrigido — as capturas do harvest B1 são pré-fix. Ressalva menor: o "Go back" usa `router.back()` (`components/performance-page-client.tsx:33-35`), que em deep link direto (histórico vazio) pode sair do app — verificar na Fase D.
- Job afetado: J1
- Severidade: S1 histórica — **status: corrigido** (registrado para rastreabilidade)
- Esforço: — (concluído)
- Classe: estrutural

### [PERF-04] Avançar música exige mirar em botão de 36px — nada de alvo "às cegas"
- Evidência: `components/performance-mode/navigation-controls.tsx:35-44` e `58-67` (Button `size="sm"`), `components/ui/button.tsx:24` (`sm: "h-9"` = 36px); capturas `setlist-show-cifra-tablet-landscape.png` (Prev/Next pequenos, centralizados na barra inferior). Sem nenhum handler de touch/swipe em todo o diretório do modo performance.
- Problema: o critério do J1 é avançar em 1 tap com alvo ≥48px operável sem olhar (idealmente a borda inteira da tela). O único mecanismo de avanço em touch é o botão Next de 36px de altura, centralizado — exige desviar o olhar da partitura e mirar, com instrumento nas mãos. Não existe swipe, nem tap em metade da tela, nem zona de toque ampliada; teclado (setas) só ajuda em desktop.
- Job afetado: J1
- Severidade: S2
- Esforço: M
- Classe: estrutural

### [PERF-05] Sem indicação numérica de posição na setlist ("4 de 12")
- Evidência: `components/performance-mode/navigation-controls.tsx:46-56` (só dots); qualquer captura populada (ex.: `setlist-show-cifra-tablet-landscape.png` — 8 dots, o ativo em coral).
- Problema: a única indicação de posição é o dot ativo de 8px numa fileira de dots idênticos — ilegível a um relance no palco escuro, e inviável com 60 músicas (vira um mar de pontos, ver PERF-01). O critério do J1 pede indicação explícita de posição ("música 4 de 12"). Um contador textual simples resolveria.
- Job afetado: J1
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [PERF-06] Pular para música arbitrária: só dots anônimos de 8px, sem índice com títulos
- Evidência: `components/performance-mode/navigation-controls.tsx:46-56` (dots com `onClick={() => goToSong(index)}`, sem título/tooltip/label); `hooks/use-performance-navigation.ts:90-102` (`goToSong` existe e funciona).
- Problema: o J2 pede pular para a música 7 em ≤3 taps. O mecanismo existe (`goToSong`), mas a única UI é um dot de 8px sem identificação — impossível saber qual dot é qual música, e o alvo é minúsculo para touch (axe nem o reconhece como interativo: é um `div` com onClick, sem role/nome/foco). Falta um índice da setlist (lista com títulos) acessível de dentro do modo performance.
- Job afetado: J2, J1
- Severidade: S2
- Esforço: M
- Classe: estrutural

### [PERF-07] Fim de setlist é beco sem saída mudo
- Evidência: `populated/performance/setlist-estresse-ultima-musica-tablet-landscape.png` (Next apenas acinzentado); `components/performance-mode/navigation-controls.tsx:61` (`disabled={!canGoNext}`), `hooks/use-performance-navigation.ts:55` (`canGoNext: currentSong < songs.length - 1`).
- Problema: na última música o Next simplesmente desabilita. Nenhum sinal de "última música", nenhum encerramento ("fim do show — sair?"), nenhuma ação de saída além do X pequeno no topo. O critério do J1 pede fim de setlist elegante; hoje o app não comunica nem que o fim chegou.
- Job afetado: J1
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [PERF-08] Toast de wake lock cobre o header e os controles exatamente no início da performance
- Evidência: `populated/performance/setlist-show-cifra-mobile.png` (toast cobre título, botão de sair e dark toggle inteiros), `setlist-estresse-ultima-musica-tablet-portrait.png` (cobre título e parte dos controles), `dark-sheet-tablet-landscape.png`; código em `hooks/use-wake-lock.ts:29-37`.
- Problema: quando o navegador não suporta Wake Lock (ou o request falha), um toast longo em inglês aparece no canto superior — sobre o header — no exato momento em que o músico entra no palco, cobrindo o botão de sair e o dark sheet em mobile/tablet-portrait. O aviso é útil, mas a apresentação bloqueia controles e o texto de 3 linhas não é lível de relance. Nota: o wake lock em si **está implementado** (request no mount + re-request em visibilitychange, `use-wake-lock.ts:21-64`); resta validar em Safari/iPadOS real (Fase D).
- Job afetado: J1
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [PERF-09] Auto-scroll (play/pause) não tem efeito em PDF/imagem — o tipo de conteúdo do palco
- Evidência: `hooks/use-performance-controls.ts:165-215` (velocidade derivada de `lyricsData[currentSong].split("\n")` — vazio para sheet music; `total = el.scrollHeight - el.clientHeight` do container externo, que é 0 quando o filho é um iframe `h-full`); `components/performance-mode/optimized-content-display.tsx:43-48` (PDF em iframe com scroll interno próprio, inacessível ao hook).
- Problema: o play/pause do header controla um auto-scroll que só funciona para letra/cifra em texto. Para PDF (partitura — caso central do J1) o container externo não tem o que rolar e o scroll interno do iframe não é alcançável: o play liga e silenciosamente desliga (`isPlaying` reverte no primeiro frame), sem nenhum feedback do porquê. O músico vê um botão que "não faz nada". Os controles de BPM ± no header servem só esse auto-scroll, ocupando espaço nobre mesmo quando inertes.
- Job afetado: J1 (passo 5)
- Severidade: S2
- Esforço: M
- Classe: conceitual

### [PERF-10] Zoom via font-size re-quebra linhas e destrói o alinhamento acorde↔sílaba
- Evidência: `populated/performance/zoom-maximo-mobile.png` (a 200% a linha de acordes "C … Am" quebra em duas linhas, acordes deixam de estar sobre a sílaba certa), `zoom-maximo-tablet-landscape.png` (letra "cidade acende" quebra, deslocando acordes); `components/performance-mode/optimized-content-display.tsx:100-110` (`fontSize: ${zoom}%` com wrap normal).
- Problema: em conteúdo monoespaçado de cifra sobre letra, o alinhamento vertical é a informação. Ao dar zoom o texto reflui e as linhas de acorde separam-se das linhas de letra correspondentes — exatamente na situação (cifra pequena, J1 passo 6) em que o zoom é usado. Agravante de interação: passos de 10% (100→200 = 10 taps) e nenhum pinch-to-zoom em tablet.
- Job afetado: J1, J2
- Severidade: S2
- Esforço: M
- Classe: conceitual

### [PERF-11] Botões críticos sem nome acessível (3 violações axe critical)
- Evidência: axe `button-name` (critical) em `button[data-testid="exit-button"]`, `button[data-testid="dark-mode-toggle"]`, `button[data-testid="play-pause-button"]` — 28 capturas cada; `components/performance-mode/header-controls.tsx:60-68, 77-86, 118-126` (só ícone, sem `aria-label`; contraste com zoom/BPM que têm `aria-label` nas linhas 100, 111, 139, 152).
- Problema: os três controles mais importantes do header (sair, dark sheet, play/pause) não têm nome acessível — invisíveis para leitor de tela e para automação de testes semântica. Correção trivial e já padronizada nos botões vizinhos.
- Job afetado: nenhum diretamente (usuário único sem leitor de tela) — registrado porque são violações axe *critical* que puxam o pior placar do app e a correção é de minutos
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [PERF-12] Controles nunca se ocultam: auto-hide implementado pela metade (código morto)
- Evidência: `hooks/use-performance-controls.ts:111` (`showControls` inicia `true` e **nunca** vira `false` — nenhum timer de idle), `:160-162` (`handleMouseMove` só seta `true` e não é conectado a nenhum elemento em `components/optimized-performance-mode.tsx`); `components/performance-mode/navigation-controls.tsx:29-31` (ramo `opacity-0 pointer-events-none` morto); capturas `controles-apos-10s-idle-*` (controles idênticos ao estado inicial após 10s).
- Problema: existe toda uma infraestrutura de esconder controles (transição de opacidade, prop `showControls`, handler de mouse) que nunca dispara — os controles são permanentes. Para operação às cegas isso até é desejável, mas o preço é fixo: `pt-[110px] pb-[60px]` (`optimized-performance-mode.tsx:121`) reservam ~170px verticais, ~20% da altura útil em tablet-landscape, espremendo a partitura o show inteiro. Decidir a intenção (ocultar em idle com área de conteúdo expandida, ou controles permanentes enxutos) e remover a metade morta.
- Job afetado: J1
- Severidade: S3
- Esforço: P
- Classe: estrutural

### [PERF-13] Contraste insuficiente nos textos secundários do header (3 violações axe serious)
- Evidência: axe `color-contrast` (serious) em `.min-w-[40px]` (zoom %), `.min-w-[60px]` (BPM) e `p` (artista) — 21-24 capturas cada; `components/performance-mode/header-controls.tsx:73,104,143` (`text-[#A69B8E]` sobre `bg-[#1A1F36]/90`).
- Problema: o marrom-acinzentado #A69B8E sobre o azul-escuro translúcido fica abaixo de 4.5:1. São informações secundárias (artista, valor de zoom, BPM), mas o contexto de uso é palco com iluminação ruim — exatamente onde contraste baixo custa mais.
- Job afetado: J1
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [PERF-14] Higiene axe restante: scroll de conteúdo sem foco de teclado + estrutura semântica ausente
- Evidência: axe `scrollable-region-focusable` (serious) em `.overflow-auto` (o container do conteúdo, `optimized-content-display.tsx:290-294`, 3 capturas); 10 violações moderate `region`/`landmark-one-main`/`page-has-heading-one` espalhadas por todas as capturas da área.
- Problema: a região rolável principal — justamente a que o auto-scroll manipula — não é focável nem operável por teclado (setas para rolar não funcionam sem clique). O restante é ausência de landmarks/headings, refletindo que a tela é um empilhado de `div`s absolutos. Deduplicadas, essas 11 violações + as 6 de PERF-11/PERF-13 somam as 17 da área.
- Job afetado: nenhum job diretamente; registrado por ser a pior área axe do app e por `scrollable-region-focusable` afetar o uso com teclado em desktop (ensaio, J2 marginalmente)
- Severidade: S3
- Esforço: P
- Classe: estrutural

## Verificar na Fase D

1. **PDF real (decide o S1 de PERF-02)**: em Chrome desktop e Safari/iPadOS reais, o PDF de 12 páginas renderiza no iframe do modo performance? Com `#toolbar=0` o scroll entre as 12 páginas funciona por touch? O dark sheet (`filter: invert(1)`) produz partitura legível? O zoom por `transform: scale()` corta o conteúdo à direita/embaixo (o transform não expande a área rolável)?
2. **Latências do J1**: cronometrar troca de música (critério <1s; pré-carregamento existe — `lib/advanced-content-cache.ts:122-160`, janela ahead/behind — mas precisa de medição real) e resposta do play/pause (<100ms percebido).
3. **Auto-scroll com PDF/imagem (PERF-09)**: apertar play numa partitura PDF — o que o usuário observa? Hipótese do código: nada acontece e o botão volta a "play" sozinho.
4. **Wake lock real**: em iPad (Safari) e tablet Android, a tela permanece acesa durante 10 min de música parada? O toast do PERF-08 aparece? O re-request após alt-tab/notificação funciona?
5. **Rotação/resize mid-performance**: girar o tablet na música 4 — o layout com `pt-[110px]` fixo e barras absolutas sobrevive? O scroll position se mantém?
6. **Offline (J6)**: kill + reopen do PWA em modo avião — a setlist aberta anteriormente renderiza todas as músicas incluindo PDFs (cache IndexedDB via `getCachedContent` + blob URL)? O que aparece para música cujo arquivo nunca foi cacheado?
7. **Dots como alvo touch (PERF-06)**: taxa de acerto real ao tentar tocar um dot de 8px em tablet; testar também na setlist de 60.
8. **Saída do estado vazio (PERF-03)**: acessar `/performance` por deep link direto (histórico vazio) e tocar "Go back" — permanece no app ou sai?
9. **Swipe**: confirmar em dispositivo que nenhum gesto de swipe avança música (código não tem handler; garantir que não há comportamento nativo mascarando).
