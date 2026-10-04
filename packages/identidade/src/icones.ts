/**
 * Os desenhos dos ícones — a fonte única de web e nativo (I1-D3, I1-PR-4).
 *
 * Migrados do `apps/native/src/icones/dados.ts` sem mudar um byte do mapa:
 * o `gate:icones` (`apps/native/scripts/icones.mjs`) lê ESTE arquivo como
 * texto — uma chave por bloco, cada estado numa linha só — e o
 * `test/igualdade.test.ts` cobra o objeto contra a linha de base da `main`.
 * Cada lado renderiza com o seu componente (`Icone.tsx` no nativo; o do web
 * nas PRs de tela): aqui não há React, React Native nem DOM.
 *
 * A origem, como estava no nativo: os 34 desenhos do DESIGN-V1 §6.4 —
 * transcritos do `icones.html` congelado (catálogo escuro: 33 desenhos
 * distintos, porque `voltar` e `voltar (avulsa)` são o mesmo markup, div. 35)
 * mais o `log-in` do S0 e a tab de quatro cordas em 20 dp (§6.3), que só
 * existem no `telas.html`. Extraídos por script, não digitados: todo `d` é o
 * do arquivo (V1-PR3-PRECHECK, anexo D).
 *
 * A V1-PR6 acrescenta **três** que também só existem no `telas.html` e que
 * nenhuma tabela do README nomeia — `email`, `senha` (moldura `S0`) e
 * `nada-encontrado` (moldura `S4b`). São 37 nomes, dos quais 4 estão "fora do
 * catálogo" (§6.4): estes três mais o `log-in`. O DESIGN-N2 acrescenta seis
 * nomes (cinco registros) — 43 no total. O DESIGN-N4 (N4-PR4) troca o desenho
 * dos quatro de tipo e acrescenta a `estrela` e o `tocar` — 45 nomes, 41
 * registros.
 *
 * O `garantida` tem UMA forma, a do catálogo (div. 589, I1-E3), e é também o
 * "salvo/confirmado" do web: o visto das folhas do I1 não entra (div. 588,
 * decisão (b) do aval da I1-PR-4, errata I1-E6).
 *
 * O envelope comum (viewBox 24 · fill none · pontas redondas · traço por
 * tamanho, `TRACO` abaixo) é de quem renderiza; aqui só o que varia. Os dois
 * de duas cores (`parcial`, `baixando`) apontam para o NOME do token, nunca
 * para um hex.
 */

/** Os três tamanhos da família (§5.5 do DESIGN-V1). */
export type TamanhoIcone = 20 | 24 | 28

/** §5.5 — o traço é função do tamanho: 20 → 1,5 · 24 → 1,75 · 28 → 2,0. Não é parâmetro. */
export const TRACO: Readonly<Record<TamanhoIcone, number>> = { 20: 1.5, 24: 1.75, 28: 2 }

/** Token de cor que um elemento pode pedir além da tinta do ícone. */
export type TintaIcone = 'lineInfo' | 'offlineInk' | 'accentInk'

/**
 * Uma primitiva: `d` (path) · `cx cy r` (circle) · `x y w h rx` (rect).
 * `fill: true` = preenchido a 100% (pontos, noteheads, trastes) · `alfa` = fill
 * parcial (0,35) · `traco` = espessura própria (1,25) · `tracejado` = AUSENTE.
 */
export interface Primitiva {
  readonly d?: string
  readonly cx?: number; readonly cy?: number; readonly r?: number
  readonly x?: number; readonly y?: number; readonly w?: number; readonly h?: number; readonly rx?: number
  readonly fill?: true; readonly alfa?: number; readonly traco?: number
  readonly tracejado?: readonly number[]; readonly tinta?: TintaIcone
}

export interface Desenho {
  readonly normal: readonly Primitiva[]
  /** §6.2 — ligado: só o `auto-scroll` muda de forma (ponta preenchida). */
  readonly ativo?: readonly Primitiva[]
  /** §6.2 — desabilitado: desenho amputado (auto-scroll) ou sinal afinado (zoom). */
  readonly inerte?: readonly Primitiva[]
  /**
   * O desenho em 20 dp, quando difere dos outros tamanhos. Era a exceção da
   * §6.3 (a tab de quatro cordas); desde a N4-PR4 são os quatro de tipo, com o
   * traço da folha em 20 (N4-D86).
   */
  readonly em20?: readonly Primitiva[]
  /** N4-D87 — o inerte do `ativo`, quando ele tem forma própria (a estrela cheia). */
  readonly ativoInerte?: readonly Primitiva[]
}

export const desenhos = {
  'auto-scroll': {
    normal: [{ d: 'M5 5h14M5 9h14M5 13h9' }, { d: 'M17 12v7M14 16l3 3 3-3' }],
    ativo: [{ d: 'M5 5h14M5 9h14M5 13h9' }, { d: 'M17 11.5v4.5' }, { d: 'M17 20.5l-3.4-4h6.8z', fill: true }],
    inerte: [{ d: 'M5 5h14M5 9h14M5 13h9' }, { d: 'M17 12v3.4M13.5 19h7' }],
  },
  'zoom-menos': {
    normal: [{ d: 'M3.15 9.3V3.15h6.15M14.7 3.15h6.15V9.3M20.85 14.7v6.15H14.7M9.3 20.85H3.15V14.7' }, { d: 'M8 12h8' }],
    inerte: [{ d: 'M3.15 9.3V3.15h6.15M14.7 3.15h6.15V9.3M20.85 14.7v6.15H14.7M9.3 20.85H3.15V14.7' }, { d: 'M8 12h8', traco: 1.25 }],
  },
  'zoom-mais': {
    normal: [{ d: 'M3.15 9.3V3.15h6.15M14.7 3.15h6.15V9.3M20.85 14.7v6.15H14.7M9.3 20.85H3.15V14.7' }, { d: 'M12 8v8M8 12h8' }],
    inerte: [{ d: 'M3.15 9.3V3.15h6.15M14.7 3.15h6.15V9.3M20.85 14.7v6.15H14.7M9.3 20.85H3.15V14.7' }, { d: 'M12 8v8M8 12h8', traco: 1.25 }],
  },
  'claro': {
    normal: [{ cx: 12, cy: 12, r: 4 }, { d: 'M12 3.15v2.3M12 20.85v-2.3M3.15 12h2.3M20.85 12h-2.3M5.74 5.74l1.63 1.63M18.26 18.26l-1.63-1.63M18.26 5.74l-1.63 1.63M5.74 18.26l1.63-1.63' }],
  },
  'escuro': {
    normal: [{ d: 'M9.83 3.16A9 9 0 1 0 20.85 14.18A8.2 8.2 0 0 1 9.83 3.16Z' }],
  },
  'indice': {
    normal: [{ cx: 5.5, cy: 7, r: 1.3, fill: true }, { cx: 5.5, cy: 12, r: 1.3, fill: true }, { cx: 5.5, cy: 17, r: 1.3, fill: true }, { d: 'M10 7h9M10 12h9M10 17h6' }],
  },
  'busca': {
    normal: [{ cx: 10.5, cy: 10.5, r: 6.5 }, { d: 'M15.5 15.5L21 21' }],
  },
  'sair': {
    normal: [{ d: 'M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M14 8l4 4-4 4M9 12h9' }],
  },
  'voltar': {
    normal: [{ d: 'M10 6l-6 6 6 6M4 12h15' }],
  },
  // N4-PR4 — os QUATRO de tipo trocam de desenho no mesmo nome e na mesma
  // caixa (N4-D69, P-I9…P-I12 do `DESIGN-N4/telas.html`), no app inteiro e no
  // site. A folha os desenha numa grade de 20 dentro de `scale(1.2)` com o
  // traço fixo de 1,5 (1,8 no viewBox 24): a geometria aqui é a da folha × 1,2,
  // escrita por script e cobrada pelo `gate:icones` (regra 7). O traço é a
  // N4-D86: em 20 o da folha (`em20`, `traco: 1.8`); em 24 e 28 o da família.
  // L1 · Aa — a maiúscula de pico e a minúscula de um andar (anel + haste).
  'letra': {
    normal: [{ d: 'M3 19.8L7.5 5.4l4.5 14.4' }, { d: 'M4.68 15h5.64' }, { d: 'M17.4 13.2a3.3 3.3 0 1 0 0 6.6a3.3 3.3 0 1 0 0-6.6' }, { d: 'M20.7 12.6v7.2' }],
    em20: [{ d: 'M3 19.8L7.5 5.4l4.5 14.4', traco: 1.8 }, { d: 'M4.68 15h5.64', traco: 1.8 }, { d: 'M17.4 13.2a3.3 3.3 0 1 0 0 6.6a3.3 3.3 0 1 0 0-6.6', traco: 1.8 }, { d: 'M20.7 12.6v7.2', traco: 1.8 }],
  },
  // C2 · a palheta — uma forma só, fechada, de ponta para baixo (P-I10).
  'cifra': {
    normal: [{ d: 'M12 21.3c-3.84-4.32-7.5-9.12-7.5-13.08C4.5 4.92 7.92 3 12 3s7.5 1.92 7.5 5.22c0 3.96-3.66 8.76-7.5 13.08z' }],
    em20: [{ d: 'M12 21.3c-3.84-4.32-7.5-9.12-7.5-13.08C4.5 4.92 7.92 3 12 3s7.5 1.92 7.5 5.22c0 3.96-3.66 8.76-7.5 13.08z', traco: 1.8 }],
  },
  // T1 · linhas com um 2 (P-I11): três linhas em todo tamanho — a exceção de
  // quatro cordas em 20 dp (§6.3 do V1) sai em par (`EM20_N4` do gate).
  'tab': {
    normal: [{ d: 'M3 4.8h4.8M16.8 4.8h4.2' }, { d: 'M3 12h4.8M16.8 12h4.2' }, { d: 'M3 19.2h4.8M16.8 19.2h4.2' }, { d: 'M9.3 7.92c0.48-1.56 1.68-2.52 3.12-2.52 1.8 0 3.12 1.32 3.12 3 0 1.08-0.48 1.92-1.44 3l-4.8 5.4h6.48' }],
    em20: [{ d: 'M3 4.8h4.8M16.8 4.8h4.2', traco: 1.8 }, { d: 'M3 12h4.8M16.8 12h4.2', traco: 1.8 }, { d: 'M3 19.2h4.8M16.8 19.2h4.2', traco: 1.8 }, { d: 'M9.3 7.92c0.48-1.56 1.68-2.52 3.12-2.52 1.8 0 3.12 1.32 3.12 3 0 1.08-0.48 1.92-1.44 3l-4.8 5.4h6.48', traco: 1.8 }],
  },
  // P2 · a nota única (P-I12): colcheia, cabeça cheia, haste e bandeirola.
  'partitura': {
    normal: [{ d: 'M6.12 19.92c-0.72-1.68 0.6-3.72 2.88-4.56 2.28-0.84 4.68-0.24 5.28 1.44 0.72 1.68-0.6 3.72-2.88 4.56-2.28 0.84-4.68 0.24-5.28-1.44z', fill: true }, { d: 'M14.1 17.1V3.6' }, { d: 'M14.1 3.6c0.48 3.12 4.32 4.2 5.4 7.8' }],
    em20: [{ d: 'M6.12 19.92c-0.72-1.68 0.6-3.72 2.88-4.56 2.28-0.84 4.68-0.24 5.28 1.44 0.72 1.68-0.6 3.72-2.88 4.56-2.28 0.84-4.68 0.24-5.28-1.44z', fill: true }, { d: 'M14.1 17.1V3.6', traco: 1.8 }, { d: 'M14.1 3.6c0.48 3.12 4.32 4.2 5.4 7.8', traco: 1.8 }],
  },
  'garantida': {
    normal: [{ cx: 12, cy: 12, r: 9 }, { d: 'M8 12.2l2.8 2.8L16.2 9.4' }],
  },
  'parcial': {
    normal: [{ cx: 12, cy: 12, r: 9, tinta: 'lineInfo' }, { d: 'M12 3a9 9 0 0 1 6.36 15.36', tinta: 'offlineInk' }, { d: 'M12 3a9 9 0 0 1 6.36 15.36L12 12z', fill: true, tinta: 'offlineInk', alfa: 0.35 }],
  },
  'nunca-sincronizada': {
    normal: [{ cx: 12, cy: 12, r: 9, tracejado: [2.6, 3] }, { d: 'M8.5 8.5l7 7M15.5 8.5l-7 7' }],
  },
  'baixando': {
    normal: [{ cx: 12, cy: 12, r: 9, tinta: 'lineInfo', tracejado: [2.6, 3] }, { d: 'M12 7.5v6M9.2 10.9l2.8 2.8 2.8-2.8', tinta: 'accentInk' }, { d: 'M8 16.5h8', tinta: 'accentInk' }],
  },
  'sem-conexao': {
    normal: [{ d: 'M4.5 9.2a11 11 0 0 1 15 0M7.6 12.8a6.6 6.6 0 0 1 8.8 0' }, { cx: 12, cy: 17, r: 1.4, fill: true }, { d: 'M4 4l16 16' }],
  },
  'ultima-sincronizacao': {
    normal: [{ d: 'M20.5 12a8.5 8.5 0 1 1-2.5-6M20.5 3.5V6H18' }, { d: 'M12 8.5V12l2.6 1.6' }],
  },
  'falha': {
    normal: [{ d: 'M12 4.2l8.4 14.8H3.6z' }, { d: 'M12 10v4' }, { cx: 12, cy: 16.9, r: 1.1, fill: true }],
  },
  'tentar-novamente': {
    normal: [{ d: 'M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4' }],
  },
  'fechar': {
    normal: [{ d: 'M6 6l12 12M18 6L6 18' }],
  },
  'apagar': {
    normal: [{ cx: 12, cy: 12, r: 8 }, { d: 'M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6' }],
  },
  'buscar-musica': {
    normal: [{ cx: 10.5, cy: 10.5, r: 6.5 }, { d: 'M15.5 15.5L21 21' }, { cx: 9, cy: 12.4, r: 1.7, fill: true }, { d: 'M10.7 12.4V7.8' }],
  },
  'baixar-setlist': {
    normal: [{ d: 'M12 3.5v10M8.4 10.1L12 13.7l3.6-3.6' }, { d: 'M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2' }],
  },
  'baixando-acao': {
    normal: [{ d: 'M12 3.5v2.6M12 8.2v2.6M12 12.9v.8M8.4 10.1L12 13.7l3.6-3.6' }, { d: 'M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2' }],
  },
  'voltar-ao-inicio': {
    normal: [{ d: 'M18.5 5.5v13L8.5 12z' }, { d: 'M5.5 5.5v13' }],
  },
  'data': {
    normal: [{ x: 3.5, y: 5, w: 17, h: 15.5, rx: 2.5 }, { d: 'M8 3v4M16 3v4M3.5 10h17' }],
  },
  'local': {
    normal: [{ d: 'M12 21c4.6-4.4 7-8 7-11a7 7 0 1 0-14 0c0 3 2.4 6.6 7 11z' }, { cx: 12, cy: 10, r: 2.4 }],
  },
  'n-de-musicas': {
    normal: [{ d: 'M4 6.5h10M4 12h10M4 17.5h6' }, { cx: 17, cy: 17.5, r: 2.3, fill: true }, { d: 'M19.3 17.5V8.5' }],
  },
  'sem-conteudo': {
    normal: [{ d: 'M6 3h8l4 4v14H6z' }, { d: 'M9 12h6M9 16h4', tracejado: [2, 2.4] }],
  },
  'tipo-desconhecido': {
    normal: [{ d: 'M6 3h8l4 4v14H6z' }, { d: 'M10.2 11a1.9 1.9 0 1 1 2 2.1v1.2' }, { cx: 12.2, cy: 17.3, r: 0.9, fill: true }],
  },
  'arquivo-nao-baixado': {
    normal: [{ d: 'M7 16.5a4 4 0 0 1 .5-7.96 5.6 5.6 0 0 1 10.6 1.7A3.4 3.4 0 0 1 17.4 16.5' }, { d: 'M12 12.4v1.8M12 16v1' }, { d: 'M9.6 17.2L12 19.6l2.4-2.4' }],
  },
  'log-in': {
    normal: [{ d: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l4 4-4 4M15 12H4' }],
  },
  // Os TRÊS da V1-PR6, transcritos das molduras `S0` e `S4b` do `telas.html`
  // — “fora do catálogo” como o `log-in`: nenhum deles está na tabela da
  // §6.4 nem no anexo D. O `email` e o `senha` marcam o papel do campo do
  // login sem rótulo flutuante; o `nada-encontrado` é a lupa com o X dentro,
  // composta com as peças de `busca` e de `fechar` — é o que a legenda da
  // `S4b` diz por escrito, “nada de glifo novo”. A regra 5 do `gate:icones`
  // cobra os quatro contra o próprio `telas.html`, por FORMA.
  'email': {
    normal: [{ x: 3, y: 5.5, w: 18, h: 13, rx: 2.5 }, { d: 'M3.6 6.8L12 13l8.4-6.2' }],
  },
  'senha': {
    normal: [{ x: 4.5, y: 10.5, w: 15, h: 9.5, rx: 2.5 }, { d: 'M8 10.5V7.8a4 4 0 0 1 8 0v2.7' }],
  },
  'nada-encontrado': {
    normal: [{ cx: 10.5, cy: 10.5, r: 6.5 }, { d: 'M15.5 15.5L21 21' }, { d: 'M8 8l5 5M13 8l-5 5' }],
  },
  // O PRIMEIRO dos cinco do DESIGN-N2 (E17, N2-D33), transcrito do anexo D do
  // `telas.html` congelado — os outros quatro (`alca`, `renomear`,
  // `apagar-setlist`, `adicionar`/`remover`) seguem na lista `PENDENTES` do
  // `gate:icones` até a PR que desenhar a S2 com edição.
  //
  // A legenda do anexo: "A lista é a do `n.º de músicas` sem o marcador; a
  // cruz é a do `zoom +`, com 7 de vão em vez de 8 para caber ao lado."
  //
  // `inerte` é a amputação declarada: **a haste vertical sai**, e o que fica
  // é um traço — o sinal do `zoom −`, que nunca aparece nesta tela. É o único
  // dos cinco em que a amputação passa pelo limite da R2·2 ("amputa-se só o
  // que continua reconhecível amputado"); os três botões de salvar caem na
  // exceção e usam o desenho inteiro em `lineInfo` com traço 1,25.
  'nova-setlist': {
    normal: [{ d: 'M4 6.5h12M4 12h8M4 17.5h6' }, { d: 'M17.5 14v7M14 17.5h7' }],
    inerte: [{ d: 'M4 6.5h12M4 12h8M4 17.5h6' }, { d: 'M14 17.5h7', traco: 1.25 }],
  },
  /**
   * TRÊS dos cinco da tela 2 entram na N2-PR4 — os que S2 com edição desenha.
   * Ficam pendentes a `alca` (PR-5, o modo de reordenar) e o `adicionar`
   * (PR-6, o picker), e é por isso que a lista `PENDENTES` do `gate:icones`
   * encolhe de cinco nomes para dois em vez de sumir.
   *
   * O par `adicionar / remover` é **um registro** do anexo D e **dois nomes**
   * no mapa (div. 226). A metade que entra aqui é o `remover` — "o círculo com
   * menos, 24 em `accentInk`, alvo de 48, no fim da linha" (§3) —, e a
   * cobrança do gate é contra a UNIÃO das três células do registro, que é o
   * que torna meio par cobrável sem inventar registro.
   */
  'renomear': {
    normal: [{ d: 'M4.5 19.5h4L20 8l-4-4L4.5 15.5z' }, { d: 'M15 5l4 4' }],
    // Amputação do anexo D: o corpo deixa de fechar — o lápis perde a ponta,
    // que é justamente o que escreve.
    inerte: [{ d: 'M4.5 19.5h4L20 8', traco: 1.25 }, { d: 'M15 5l4 4', traco: 1.25 }],
  },
  'apagar-setlist': {
    normal: [{ d: 'M4.5 7h15M9.5 7V4.8h5V7M6.8 7l1 12.2h8.4l1-12.2' }, { d: 'M10.2 10.8v5.4M13.8 10.8v5.4' }],
    // Amputação: a parede direita e as duas costelas saem. Balde aberto ainda
    // é lixeira (o limite da R2·2).
    inerte: [{ d: 'M4.5 7h15M9.5 7V4.8h5V7M6.8 7l1 12.2h8.4', traco: 1.25 }],
  },
  /**
   * O QUARTO dos cinco (N2-PR5) — a alça do modo de reordenar. Anexo D,
   * verbatim: *"seis círculos r 1,5 · cx 9 e 15 · cy 6,5 · 12 · 17,5"*, **sem
   * traço** — só o marcador do logo, a mesma massa dos pontos do `indice`.
   * Alvo de 48 × 72, desenho de 24 centrado nele (R1·7b): quem dá o alvo é a
   * linha do modo, não o desenho.
   *
   * Amputação: *"quatro círculos · a coluna direita perde cy 12 e 17,5"*. O
   * marcador é preenchido, então não há traço de 1,25 a afinar — a
   * amputação é a camada que sobra, e a tinta `lineInfo` a outra.
   */
  'alca': {
    normal: [{ cx: 9, cy: 6.5, r: 1.5, fill: true }, { cx: 15, cy: 6.5, r: 1.5, fill: true }, { cx: 9, cy: 12, r: 1.5, fill: true }, { cx: 15, cy: 12, r: 1.5, fill: true }, { cx: 9, cy: 17.5, r: 1.5, fill: true }, { cx: 15, cy: 17.5, r: 1.5, fill: true }],
    inerte: [{ cx: 9, cy: 6.5, r: 1.5, fill: true }, { cx: 15, cy: 6.5, r: 1.5, fill: true }, { cx: 9, cy: 12, r: 1.5, fill: true }, { cx: 9, cy: 17.5, r: 1.5, fill: true }],
  },
  'remover': {
    normal: [{ cx: 12, cy: 12, r: 8.5 }, { d: 'M8 12h8' }],
    // Amputação: meia corda, 4 — e vale para os dois do par.
    inerte: [{ cx: 12, cy: 12, r: 8.5, traco: 1.25 }, { d: 'M8 12h4', traco: 1.25 }],
  },
  /**
   * O QUINTO e último dos cinco (N2-PR6) — a outra metade do par, e com ela
   * o anexo D do DESIGN-N2 está todo no mapa (39 registros, `PENDENTES`
   * vazia). Verbatim: *"circle r 8,5 · M12 8v8M8 12h8 (adicionar)"* — o mesmo
   * círculo e a mesma corda de 8 do `remover`, mais a haste.
   *
   * Amputação: *"circle r 8,5 · M8 12h4"* — a MESMA do `remover`, e é o
   * anexo que a escreve assim ("meia corda, 4, e vale para os dois"): a
   * haste sai inteira e a corda fica pela metade. Meia corda ainda é o par
   * mais/menos (o limite da R2·2).
   */
  'adicionar': {
    normal: [{ cx: 12, cy: 12, r: 8.5 }, { d: 'M12 8v8M8 12h8' }],
    inerte: [{ cx: 12, cy: 12, r: 8.5, traco: 1.25 }, { d: 'M8 12h4', traco: 1.25 }],
  },
  /**
   * N4-PR4 — os DOIS novos do `DESIGN-N4` (N4-D68; N4-D76: catálogo de 39 a
   * 41 registros), na grade de 24 da família, com o traço do catálogo.
   *
   * A `estrela` é UM registro com dois estados (P-I1a, P-I1b): `normal` é a
   * vazada (favoritar), `ativo` a cheia (favorita: o preenchimento por baixo e
   * o contorno por cima, como a folha). Inerte, cada uma tem a sua forma, com
   * traço 1,25 — `inerte` a vazada e `ativoInerte` a cheia (N4-D87). O
   * pressionado é o desenho do estado; o "em andamento" é o inerte com o arco
   * da tela em volta. Sem tela até a PR-7.
   */
  'estrela': {
    normal: [{ d: 'M12 3.3l2.68 5.43 5.99.87-4.33 4.23 1.02 5.97L12 17l-5.36 2.8 1.02-5.97L3.33 9.6l5.99-.87z' }],
    ativo: [{ d: 'M12 3.3l2.68 5.43 5.99.87-4.33 4.23 1.02 5.97L12 17l-5.36 2.8 1.02-5.97L3.33 9.6l5.99-.87z', fill: true }, { d: 'M12 3.3l2.68 5.43 5.99.87-4.33 4.23 1.02 5.97L12 17l-5.36 2.8 1.02-5.97L3.33 9.6l5.99-.87z' }],
    inerte: [{ d: 'M12 3.3l2.68 5.43 5.99.87-4.33 4.23 1.02 5.97L12 17l-5.36 2.8 1.02-5.97L3.33 9.6l5.99-.87z', traco: 1.25 }],
    ativoInerte: [{ d: 'M12 3.3l2.68 5.43 5.99.87-4.33 4.23 1.02 5.97L12 17l-5.36 2.8 1.02-5.97L3.33 9.6l5.99-.87z', fill: true }, { d: 'M12 3.3l2.68 5.43 5.99.87-4.33 4.23 1.02 5.97L12 17l-5.36 2.8 1.02-5.97L3.33 9.6l5.99-.87z', traco: 1.25 }],
  },
  /** O `tocar` (P-I2): só ícone, com borda, 48, na linha e em V. Sem tela até a PR-7. */
  'tocar': {
    normal: [{ d: 'M8.5 5.3v13.4L19 12z' }],
    inerte: [{ d: 'M8.5 5.3v13.4L19 12z', traco: 1.25 }],
  },
} as const satisfies Record<string, Desenho>

export type NomeIcone = keyof typeof desenhos

/** O catálogo de nomes, na ordem do mapa. */
export const nomesIcones = Object.keys(desenhos) as readonly NomeIcone[]
