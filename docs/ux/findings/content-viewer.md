# Findings — Content Viewer

Escopo: tela de visualização de conteúdo (`/content/[id]`), composta por `components/content-viewer.tsx` + `components/content-viewer/*` e hooks associados. Insumos: 9 estados × 4 viewports em `docs/ux/capture/populated/content/` (cifra, letra, tablatura, pdf-1pagina, pdf-12paginas p1/p6, titulo-186-chars, duplicado-a/b), respectivos `.a11y.json`/`.axe.json`, e leitura integral do código da área. Jobs de referência: o viewer serve J5 (abrir resultado direto em visualização), J2 (anotações) e é vitrine da base de renderização que o modo performance reutiliza (J1).

Violações axe deduplicadas na área: **3 regras / 23 pares regra×elemento** — `button-name` (crítica, 21 elementos, presentes nas 36 capturas), `scrollable-region-focusable` (séria, 1 elemento, nas 12 capturas com PDF), `heading-order` (moderada, 1 elemento). Detalhadas em CONT-11 e CONT-12.

Obs. de captura: o texto "p?gina" dentro das páginas do PDF é mojibake do PDF gerado pelo seed (artefato do harvester), não bug do viewer.

## Achados

### [CONT-01] Cifra em texto vira parágrafo corrido ilegível
- Evidência: capturas `cifra-desktop.png`, `cifra-mobile.png`, `cifra-tablet-landscape.png`, `duplicado-a/b-*.png`; código `components/content-viewer/ChordDisplay.tsx:77-80`
- Problema: quando `content_data.chords` é string (o formato do seed e o mais provável para cifra colada de texto), o branch renderiza num `<div className="font-mono text-sm bg-gray-50...">` sem `whitespace-pre-wrap`/`<pre>`. O HTML colapsa as quebras de linha e a cifra inteira vira um parágrafo corrido: "[Intro] C Am F G C Am Quando a noite chega e a cidade acende F G Eu procuro...". Acordes e letra se misturam sem alinhamento — a cifra é inutilizável para tocar. O branch de `sections` (ChordDisplay.tsx:23-40) usa `<pre className="whitespace-pre-wrap">` corretamente; só o branch string está quebrado.
- Job afetado: J5 (abrir resultado em visualização — o resultado aberto é ilegível), J2 (ensaio usa esta tela), J1 indireto (mina a confiança na renderização)
- Severidade: S1
- Esforço: P
- Classe: estrutural

### [CONT-02] Tablatura em string é destruída pela quebra de linha
- Evidência: capturas `tablatura-desktop.png` (tab quebrada em 5 linhas embaralhadas), `tablatura-mobile.png` (cordas intercaladas, 100% ilegível); código `components/content-viewer/TabDisplay.tsx:26-30`
- Problema: o branch de tablatura-string renderiza sem preservação de whitespace, sem `overflow-x-auto` e sem `whitespace-nowrap`. Tab ASCII depende de alinhamento por coluna; ao quebrar linha, as seis cordas se entrelaçam e o resultado é ruído visual. O branch de array (TabDisplay.tsx:13-24) tem `overflow-x-auto` + `whitespace-nowrap` corretos — a inconsistência entre os dois branches indica que o formato string nunca foi testado com dado real.
- Job afetado: J5, J2; J1 indireto
- Severidade: S1
- Esforço: P
- Classe: estrutural

### [CONT-03] Anotações só existem dentro do editor — invisíveis na visualização e no modo performance
- Evidência: fato pré-existente confirmado no código: anotações persistem em `content_data` JSONB (`components/content-editor.tsx:61,93`) e o único ponto de renderização é o canvas do editor (`components/editors/content-type-editor.tsx:88-91`, via `AnnotationTools`). Zero referências a `annotations` em `components/content-viewer/*` (grep vazio), em `components/performance-mode/` e em `components/optimized-performance-mode.tsx`; `hooks/use-content-renderer.ts:38-150` só produz renderTypes pdf/image/chords/lyrics — não há caminho de código que desenhe anotações fora do editor.
- Problema: o critério do J2 é "anotação visível na próxima abertura da mesma música, inclusive em modo performance". Hoje a anotação criada no ensaio some assim que se sai do editor: nem o viewer nem o modo performance a leem. O dado persiste no banco mas é funcionalmente write-only — o esforço de anotar não retorna nada ao usuário no momento em que ele precisa (tocando).
- Job afetado: J2 (quebra o critério central do job); J1 (anotações de palco não aparecem no show)
- Severidade: S1
- Esforço: G
- Classe: conceitual

### [CONT-04] Editar e excluir são inacessíveis a partir do viewer (e a UI aponta para um botão que não existe)
- Evidência: `components/content-viewer.tsx:15,23` (prop `onEdit` aceita e nunca usada em nenhum elemento); `components/content-viewer.tsx:45` (`handleDelete` destructurado e nunca ligado a botão algum — `DeleteDialog` é código morto); `components/content-viewer/ContentSidebar.tsx:136` ("Click Edit to add notes and performance tips"); capturas `cifra-desktop.png` e todas as demais (header contém apenas voltar, estrela e Performance); `components/content-page-client.tsx:52-54` (`handleEdit` existe, `isEditing` nunca pode virar true).
- Problema: a tela de detalhe do conteúdo não oferece nenhuma ação de edição ou exclusão — o caminho natural "abri a música, vou corrigir o tom / adicionar nota" exige voltar à biblioteca e procurar o menu do card. Pior: o empty state de Performance Notes instrui explicitamente a clicar num botão Edit que não está na tela, uma instrução impossível de seguir.
- Job afetado: J2 (anotar exige chegar ao editor; daqui não se chega), J3 (conferir/corrigir metadados ao revisar repertório)
- Severidade: S2
- Esforço: M
- Classe: estrutural

### [CONT-05] Favoritar no viewer é ilusório — nunca persiste
- Evidência: `hooks/useContentActions.ts:31-34` — `toggleFavorite` só inverte estado local, com `// TODO: Implement API call to update favorite status`; contraste com a versão da biblioteca `hooks/use-content-actions.ts:105-127` que persiste via `toggleFavorite` do content-service.
- Problema: a estrela do header responde visualmente ao toque mas o estado se perde no próximo carregamento. Feedback de sucesso para uma ação que falhou silenciosamente é pior que ausência da feature — corrói a confiança nos favoritos como mecanismo de organização. A coexistência de dois hooks quase homônimos (`useContentActions.ts` × `use-content-actions.ts`) com comportamentos divergentes é a causa estrutural.
- Job afetado: J5 e J3 (favoritos alimentam localizar/priorizar repertório); "cache de prioridade" do offline também usa favoritos segundo o CLAUDE.md, o que tocaria J6
- Severidade: S2
- Esforço: P
- Classe: estrutural

### [CONT-06] PDF em mobile: página transborda o card e a toolbar não cabe
- Evidência: captura `pdf-12paginas-p1-mobile.png` (título da página cortado à esquerda, pautas cortadas à direita, "Page 1 / 12" quebrado em 3 linhas, botão de zoom-in colado na borda, botões fit-width/fit-page/fullscreen fora da tela); código `components/pdf-viewer.tsx:280` (`<Page ... width={800} />` fixo) e `components/pdf-viewer.tsx:225-269` (toolbar em flex sem wrap nem colapso responsivo).
- Problema: em 390 px a página é renderizada a 800 px e o conteúdo fica clipado dos dois lados; ler exige pan horizontal constante. A toolbar não prioriza controles em tela estreita: os botões de ajuste (justamente os que resolveriam o problema, fit-width/fit-page) são os primeiros a serem empurrados para fora do viewport.
- Job afetado: J4 (conferir o PDF recém-importado no celular), J5 (abrir resultado no celular); J1 indireto (mesmo componente PdfViewer é a base de renderização de partitura)
- Severidade: S2
- Esforço: M
- Classe: estrutural

### [CONT-07] Fallbacks exibem conteúdo musical fabricado como se fosse real
- Evidência: `components/content-viewer/ChordDisplay.tsx:81-108` (grade fixa de acordes "Am F C G" com diagramas de pontos hardcoded quando não há dados); `components/content-viewer/TabDisplay.tsx:31-52` (tablatura de exemplo hardcoded como fallback).
- Problema: quando uma cifra/tab não tem dados, o viewer não mostra um empty state — mostra acordes e uma tablatura inventados, visualmente idênticos a conteúdo legítimo. Num app de palco isso é ativamente perigoso: um item importado com falha renderiza "Am F C G" plausível e o usuário só descobre que não é a música tocando errado. Compare com LyricsDisplay.tsx:20-28, que faz o certo ("No lyrics available").
- Job afetado: J1 e J5 (confiança no que está na tela é pré-requisito); J4 (mascarar importação incompleta)
- Severidade: S2
- Esforço: P
- Classe: conceitual

### [CONT-08] Conteúdo textual não tem zoom nem controle algum; a toolbar existente é vestigial e desligada
- Evidência: `components/content-page-client.tsx:84` (`showToolbar={false}` no único uso do viewer); `components/content-viewer/ContentToolbar.tsx:36-119` (play/pause sem efeito, slider de volume hardcoded `value={[75]}` sem handler, botão Settings sem onClick, paginação sobre `content_data.pages` que os tipos textuais não têm); `components/content-viewer/ContentDisplay.tsx:44-48` (zoom via `transform: scale()` no card inteiro, que estoura o layout em vez de refluir o texto); capturas: nenhuma mostra toolbar.
- Problema: para cifra, letra e tab não existe nenhum ajuste de tamanho de fonte na visualização — só o PDF tem zoom (o próprio PdfViewer). O critério do J1 ("cifra está pequena → ajustar zoom") não tem equivalente aqui, e no ensaio (J2, tablet) texto em `text-sm` (~14 px) é pequeno para ler à distância de um suporte. A ContentToolbar que deveria cumprir esse papel é um mock de player de áudio nunca exibido — código morto que confunde manutenção e mente sobre a capacidade real da tela.
- Job afetado: J2 (leitura em ensaio), J5; nenhum job usa os controles falsos, o que reforça remoção
- Severidade: S2
- Esforço: M
- Classe: conceitual

### [CONT-09] Duplicatas são indistinguíveis dentro do viewer
- Evidência: capturas `duplicado-a-desktop.png` × `duplicado-b-desktop.png` (pixel-idênticas: mesmo título "[UX-AUDIT] Águas de Março", artista, tom C, datas 8/8/2026) — idem nos 4 viewports.
- Problema: ao abrir duas entradas duplicadas para decidir qual manter, a tela não oferece nenhum discriminador — sem ID curto, sem horário de criação (só data), sem indicação de arquivo anexo ou tamanho de conteúdo. Combinado com CONT-04 (não dá para excluir daqui), o fluxo real de deduplicação vira adivinhação na biblioteca.
- Job afetado: J3 (curadoria do repertório), J5 (qual dos dois resultados abrir?)
- Severidade: S3
- Esforço: P
- Classe: estrutural

### [CONT-10] Título de 186 caracteres sem truncamento infla o header
- Evidência: capturas `titulo-186-chars-desktop.png` (h1 em 3 linhas), `titulo-186-chars-mobile.png` (título ocupa ~10 linhas, ~35% da altura da tela antes do conteúdo); código `components/content-viewer/ContentHeader.tsx:68-73` (h1 sem `truncate`/`line-clamp`).
- Problema: o header não limita o título — em mobile o conteúdo útil é empurrado quase para fora da primeira dobra. Não quebra o layout (botões continuam visíveis), mas é o padrão clássico resolvido com `line-clamp-2` + title completo em tooltip/detalhe.
- Job afetado: J5 (abrir resultado e ver o conteúdo sem rolar); marginal
- Severidade: S3
- Esforço: P
- Classe: cosmético

### [CONT-11] Botões só-ícone sem nome acessível (axe `button-name`, crítica)
- Evidência: axe `button-name` — 21 elementos deduplicados, presentes nas 36 capturas. Fontes no código: `components/content-viewer/ContentHeader.tsx:52-57` (voltar: `ArrowLeft` sem texto nem aria-label), `:78-91` (estrela de favorito), `:93-101` (Performance vira só-ícone em mobile com `hidden md:inline`); `components/pdf-viewer.tsx:227-268` (prev/next/zoom-out/zoom-in/fullscreen sem aria-label; só fit-width/fit-page têm `title`).
- Problema: nenhum botão de ícone do viewer tem nome acessível. Para o usuário único (sem leitor de tela) o impacto direto é baixo — por isso S3 e não mais — mas registra-se porque: (a) é a violação de maior contagem da área e crítica no axe; (b) botões sem nome também quebram automação de teste (Fase D) e tooltips nativos.
- Job afetado: nenhum diretamente (justificativa acima); indiretamente a instrumentação da Fase D
- Severidade: S3
- Esforço: P
- Classe: estrutural

### [CONT-12] Região de scroll do PDF inoperável por teclado + hierarquia de headings quebrada
- Evidência: axe `scrollable-region-focusable` (séria, 1 elemento, nas 12 capturas de PDF) — `components/pdf-viewer.tsx:271` (`div.overflow-auto` sem `tabindex`); axe `heading-order` (moderada, 1 elemento) — os `h3` "Chord Chart"/"Lyrics"/"Tablature"/"Sheet Music" (ex.: `components/content-viewer/ChordDisplay.tsx:10`) saltam do `h1` do header sem `h2`.
- Problema: no desktop/notebook (contexto do J3 e de parte do J2), a área rolável do PDF não recebe foco, então rolar a partitura por teclado (setas/PageDown) é impossível — só mouse/trackpad. O heading-order é menor, mas denuncia que os títulos de seção redundantes ("Sheet Music" logo abaixo do tipo já indicado no header) são estrutura decorativa, não hierarquia.
- Job afetado: J3/J2 em desktop (scroll por teclado); marginal
- Severidade: S3
- Esforço: P
- Classe: estrutural

## Verificar na Fase D

1. **Navegação de PDF multipágina**: quantos taps para ir da página 1 à 6 num PDF de 12 páginas? (Só há prev/next em `pdf-viewer.tsx:227-240` — hipótese: 5 taps, sem salto direto nem thumbnails.) Cronometrar e avaliar se atende uso em palco.
2. **Pinch-to-zoom no PDF em touch**: o zoom por gesto funciona ou só os botões +/- de 20% em 20%? Medir no tablet.
3. **Favorito não persiste (CONT-05)**: confirmar em runtime — favoritar no viewer, recarregar a página, verificar se a estrela volta ao estado anterior.
4. **Fluxo real de anotação (CONT-03/04)**: partir do viewer, tentar criar uma anotação; contar taps até o canvas do editor (biblioteca → menu do card → edit?) e confirmar que, depois de salvar, ela não aparece nem no viewer nem no modo performance ao reabrir.
5. **Scroll horizontal da tablatura (branch array)**: com tab em formato array, o `overflow-x-auto` é descobrível/operável em touch? Existe affordance de que há conteúdo cortado à direita?
6. **Botão Performance do header**: latência do tap até o conteúdo em tela cheia, e se o conteúdo aberto é o mesmo item (rota `/performance?contentId=`) — mede o critério J1 de ≤10 s partindo de um resultado de busca (J5 → J1).
7. **Imagem (JPG/PNG) como partitura**: as capturas só cobrem PDF; verificar o branch de imagem (`SheetMusicDisplay.tsx:56-64`, `width={800} height={600}` fixos) com uma foto vertical de celular — proporção e nitidez sobrevivem?
8. **Viewer offline (J6)**: com cache populado e rede desligada, o viewer abre o PDF via blob URL (`useContentFile.ts`)? E sem cache, qual é a falha — o erro genérico de `pdf-viewer.tsx:180-187` com "Try refreshing the page"?
