# Findings — Dashboard

Escopo: página `/dashboard` (estado vazio e populado, 4 viewports: desktop 1440, mobile 390, tablet portrait 834, tablet landscape 1194). Insumos: capturas em `docs/ux/capture/dashboard/` e `docs/ux/capture/populated/dashboard/` (PNG + a11y.json + axe.json), código de `app/dashboard/page.tsx`, `components/dashboard.tsx`, `components/dashboard-page-client.tsx` e dependências diretas (`components/responsive-layout.tsx`, `components/bottom-nav.tsx`, `components/header.tsx`, `types/content.ts`). Julgamento ancorado em `docs/ux/JOBS.md` — o dashboard é ponto de partida declarado de J1, J4 e J5.

Violações axe deduplicadas na área: **7** (1× `button-name` crítico em 1 elemento; 6× `color-contrast` serious em 6 elementos únicos — os mesmos elementos se repetem nos 4 viewports e nos dois estados).

## Achados

### [DASH-01] O dashboard não oferece nenhum caminho para o job dominante (show ao vivo)
- Evidência: `docs/ux/capture/populated/dashboard/populated-desktop.png`; `components/dashboard.tsx:34-50` (props `onEnterPerformance` e `onNavigate` recebidas e **nunca usadas** no render — não existe botão/CTA de performance ou de setlist em lugar nenhum do componente); `populated-desktop.a11y.json` (nenhum link/botão para setlists no conteúdo da página).
- Problema: J1 tem peso 40% e começa no dashboard ("localizar a setlist do show de hoje"), mas a tela inicial não contém nada acionável nessa direção: nem "próximo show", nem lista de setlists recentes, nem CTA "entrar em modo performance". O único caminho é a navegação lateral/bottom nav, ou seja, o dashboard consome um tap e uma tela inteira sem contribuir nada para o job crítico. O código confirma que um CTA de performance foi previsto (prop `onEnterPerformance` em `dashboard-page-client.tsx:33-35` roteando para `/performance`) e nunca renderizado.
- Job afetado: J1 (principal), J2
- Severidade: S2 (não quebra o job — o sidebar existe — mas a tela inicial desperdiça o orçamento de ≤4 taps/10s)
- Esforço: M
- Classe: conceitual

### [DASH-02] Os quatro cards de estatística são texto morto — não navegam
- Evidência: `populated-desktop.a11y.json:86-133` (todos os valores expostos como `role: text`, sem link/botão); `components/dashboard.tsx:116-172` (Cards sem onClick/Link).
- Problema: "Setlists 3 ready for performance" e "Total Content 60" criam a expectativa universal de drill-down, mas tocar neles não faz nada. O card de Setlists é exatamente o atalho que J1 precisa (ver DASH-01) e o de Total Content o que J5/J3 precisam; hoje são só decoração ocupando a posição mais nobre da tela.
- Job afetado: J1, J3, J5
- Severidade: S2
- Esforço: P (envolver os cards em `Link` para /setlists, /library etc.)
- Classe: estrutural

### [DASH-03] Abas Recent/Favorites são redundantes: mostram os mesmos 5 itens do Overview
- Evidência: `app/dashboard/page.tsx:54-57` (`recentContent` e `favoriteContent` cortados em 5 no servidor); `components/dashboard.tsx:285-395` (as abas fazem `.map` da lista completa — que só tem 5 itens); card "Recent" mostra **10** em `populated-desktop.png` enquanto a aba Recent lista 5.
- Problema: as abas prometem uma visão expandida mas renderizam exatamente o mesmo conjunto de 5 itens do Overview, só com data adicional. O stat "Recent: 10 viewed recently" contradiz a lista de 5 e não há como ver os outros 5. Agravante semântico: a lista é ordenada por `updated_at` (page.tsx:50-53) mas rotulada "recently viewed" — é "editado recentemente", não "visto recentemente". Custo de manutenção e de atenção sem benefício.
- Job afetado: J5 (achar música pelo caminho "recentes"); nenhum job ganha com as abas
- Severidade: S2
- Esforço: M (remover abas ou passar listas completas com "view all" para /library)
- Classe: estrutural

### [DASH-04] Conteúdo ocluído atrás da bottom nav em tablet portrait/mobile (padding insuficiente)
- Evidência: `populated-tablet-portrait.png` (itens da lista Favorite Content visíveis semi-transparentes **atrás** da bottom nav, cortados); `components/responsive-layout.tsx:100` (`pb-16` = 64px) vs `components/bottom-nav.tsx:26-43` (botões `h-16` = 64px + `py-2` do container + border ≈ 81px de altura real).
- Problema: o padding inferior do layout (64px) é menor que a altura real da barra (~81px + safe-area), então a última linha de conteúdo fica permanentemente coberta pela nav translúcida. Em listas curtas o item fica inalcançável mesmo com scroll no fim da página.
- Job afetado: J4 e J5 (uso mobile/tablet portrait); é bug do shell que afetará todas as páginas com bottom nav
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [DASH-05] Mobile: os 4 cards de estatística consomem a primeira dobra inteira; o conteúdo útil fica abaixo
- Evidência: `populated-mobile.png` (viewport 390×844: Total Content/Setlists/Favorites/Recent empilhados ocupam ~100% da área visível; Recent Content e Favorite Content só aparecem com scroll longo); comparar com `empty-mobile.png` (quatro zeros gigantes preenchendo a tela).
- Problema: no celular — contexto declarado de J4 ("frequentemente no celular") e de J5 — a primeira tela é 100% métricas não acionáveis (ver DASH-02) em cards de ~140px de altura cada. As listas de conteúdo real, que são a única parte útil da página, exigem ~750px de scroll. A hierarquia da informação está invertida para o viewport onde o custo de scroll é maior.
- Job afetado: J4, J5, J1 (se o telefone for o dispositivo à mão)
- Severidade: S2
- Esforço: M (grid 2×2 compacto ou linha única de stats em mobile)
- Classe: estrutural

### [DASH-06] Botão de colapsar sidebar sem nome acessível (axe: button-name, crítico)
- Evidência: axe `button-name` em `.md\:inline-flex` nos 6 arquivos axe de desktop/tablet (dedup: 1 elemento); `components/header.tsx:40-52` (Button icon-only com `PanelLeftOpen/Close` sem `aria-label`); `populated-desktop.a11y.json:5-8` (`role: button, name: ""`).
- Problema: o primeiro elemento focável da página não tem nome — leitores de tela anunciam "botão" sem contexto. É componente do shell (header), mas foi capturado nesta área e afeta toda página logada.
- Job afetado: nenhum diretamente (usuário único não usa leitor de tela até onde se sabe) — registrado porque é violação crítica de baixo custo e o mesmo padrão icon-only-sem-label pode se repetir em controles que importam em J1.
- Severidade: S3
- Esforço: P (um `aria-label`)
- Classe: cosmético

### [DASH-07] Contraste insuficiente nos textos de apoio amber-600 (axe: color-contrast, serious, 6 elementos)
- Evidência: axe `color-contrast` nos 8 arquivos (dedup: 6 elementos — os subtítulos `text-xs text-amber-600` dos 4 stat cards + as `CardDescription text-amber-600` de Recent/Favorite Content); `components/dashboard.tsx:127,141,155,169,178-180,231-233`.
- Problema: `text-amber-600` sobre `bg-white/90` fica abaixo de 4.5:1 em texto pequeno (`text-xs`/`text-sm`). São textos secundários, mas o padrão amber-sobre-claro é o token de "texto de apoio" do app inteiro — corrigir aqui (amber-700/800) provavelmente resolve a mesma violação nas outras áreas.
- Job afetado: nenhum job crítico diretamente (dashboard não é usado no palco); legibilidade geral
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [DASH-08] Ícones de tipo de conteúdo errados: switch compara strings que não existem no domínio
- Evidência: `components/dashboard.tsx:54-67` (`case "Sheet Music"`, `"Guitar Tab"`, `"Chord Chart"`) vs `types/content.ts:9-14` (valores reais: `"Lyrics"`, `"Chords"`, `"Tab"`, `"Sheet"`); `populated-desktop.png` (item "Garota de Ipanema / Chords" renderizado com ícone genérico de documento, igual ao fallback).
- Problema: 3 dos 4 cases nunca casam — todo conteúdo que não é Lyrics cai no ícone default FileText, anulando o reconhecimento visual por tipo. Existe mapeamento canônico `CONTENT_TYPE_ICONS` em `types/content.ts:40-45` (com cores por tipo) que o dashboard ignora e reimplementa errado.
- Job afetado: J5 (escanear listas por tipo)
- Severidade: S3
- Esforço: P (usar `CONTENT_TYPE_ICONS`)
- Classe: estrutural

### [DASH-09] Estrela emoji com classes CSS sem efeito, inconsistente com o sistema de ícones
- Evidência: `components/dashboard.tsx:266-270, 275, 380-383, 388` (`<div className="w-4 h-4 text-amber-500 fill-current">⭐</div>`); visível em `populated-desktop.png` (estrela emoji ao lado dos favoritos, destoando dos ícones lucide monocromáticos).
- Problema: emoji não obedece `text-amber-500`/`fill-current` — as classes são código morto — e mistura linguagem visual (emoji colorido vs. lucide outline usado em todo o resto). O empty state de favoritos usa o mesmo emoji como "ilustração" em `text-gray-300`, igualmente sem efeito.
- Job afetado: nenhum — registrado como inconsistência de sistema visual barata de corrigir (lucide `Star`)
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [DASH-10] Três rótulos para a mesma ação de importar: "Add Content", "Add Song", "Add"
- Evidência: `populated-desktop.png` (botão "Add Content" no topo + item "Add Song" no sidebar); `populated-mobile.png` (bottom nav "Add"); `components/bottom-nav.tsx:22`; `components/dashboard.tsx:82-86`.
- Problema: o mesmo destino `/add-content` é chamado de três nomes diferentes conforme a superfície. Para o job de importar, isso dilui o aprendizado de onde fica a ação (e "Add Song" sugere algo diferente de "Add Content" — cifra vs. música?).
- Job afetado: J4
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [DASH-11] Estado vazio não orienta o próximo passo
- Evidência: `empty-desktop.png`, `empty-mobile.png` (quatro cards zerados + "No recent content"/"No favorite content" com ícone cinza, sem CTA); `components/dashboard.tsx:219-222, 274-277`.
- Problema: o dashboard vazio responde "você não tem nada" quatro vezes sem apontar para o único próximo passo útil (adicionar conteúdo). O botão Add Content existe, mas no canto superior, desconectado da mensagem de vazio. Severidade baixa porque JOBS.md exclui onboarding (usuário único já tem biblioteca), mas o mesmo padrão de empty-state-sem-ação tende a se repetir em telas onde vazio é estado recorrente (ex.: busca sem resultado, J5).
- Job afetado: J4 (marginal); registrado como sintoma de padrão
- Severidade: S3
- Esforço: P
- Classe: estrutural

## Verificar na Fase D

- **J1 (crítico)**: partindo do dashboard logado, quantos taps e segundos até a primeira música da setlist do show em tela cheia? (alvo ⚠️ ≤4 taps/10s; caminho atual forçado: sidebar/bottom nav → Setlists → setlist → performance)
- **J5**: a busca do header (`components/header.tsx:26-34`) navega para `/library?search=...` — do dashboard até resultado aberto em visualização, quantos taps? O submit funciona com o teclado virtual mobile (Enter/Go)?
- **DASH-04**: em mobile e tablet portrait com lista longa, o último item fica permanentemente inalcançável atrás da bottom nav ou o scroll eventualmente o expõe? Testar tocar no item semi-visível.
- **DASH-02**: tocar nos stat cards — confirmar que nada acontece em touch real (nenhum feedback), medindo a "falsa affordance".
- **J4**: tocar "Add Content" no dashboard mobile — o fluxo de upload abre em quantos ms e o formulário preserva o contexto de volta ao dashboard?
- Clicar em item de Recent Content → `/content/[id]`: tempo até render do conteúdo, e o botão voltar retorna ao dashboard com a aba/scroll preservados?
- O stat "Recent: 10" — confirmar de onde vem o número (getUserStatsServer) e se diverge sempre da lista de 5; se as abas forem mantidas, elas deveriam mostrar 10.
