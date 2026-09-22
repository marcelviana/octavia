/**
 * Os 34 desenhos do DESIGN-V1 §6.4 — transcritos do `icones.html` congelado
 * (catálogo escuro: 33 desenhos distintos, porque `voltar` e `voltar (avulsa)`
 * são o mesmo markup, div. 35) mais o `log-in` do S0 e a tab de quatro cordas
 * em 20 dp (§6.3), que só existem no `telas.html`. Extraídos por script, não
 * digitados: todo `d` é o do arquivo (V1-PR3-PRECHECK, anexo D).
 *
 * A V1-PR6 acrescenta **três** que também só existem no `telas.html` e que
 * nenhuma tabela do README nomeia — `email`, `senha` (moldura `S0`) e
 * `nada-encontrado` (moldura `S4b`). São 37 nomes, dos quais 4 estão "fora do
 * catálogo" (§6.4): estes três mais o `log-in`.
 *
 * O envelope comum (viewBox 24 · fill none · pontas redondas · traço por
 * tamanho) é do `Icone.tsx`; aqui só o que varia. Os dois de duas cores
 * (`parcial`, `baixando`) apontam para o NOME do token, nunca para um hex.
 */

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
  /** §6.3 — a tab tem quatro cordas em 20 dp e seis nos outros tamanhos. */
  readonly em20?: readonly Primitiva[]
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
  'letra': {
    normal: [{ d: 'M4 5.25h13M4 9.75h16M4 14.25h10M4 18.75h14' }],
  },
  'cifra': {
    normal: [{ d: 'M4 5h3M11 5h3M18 5h2' }, { d: 'M4 9.5h16' }, { d: 'M4 14.5h3M12 14.5h4' }, { d: 'M4 19h13' }],
  },
  'tab': {
    normal: [{ d: 'M3 3h18M3 6.6h1.225M11.175 6.6h9.825M3 10.2h9.225M19.175 10.2h1.825M3 13.8h4.225M14.175 13.8h6.825M3 17.4h18M3 21h18' }, { x: 5.5, y: 4.9, w: 4.4, h: 3.4, rx: 1.7, fill: true }, { x: 13.5, y: 8.5, w: 4.4, h: 3.4, rx: 1.7, fill: true }, { x: 8.5, y: 12.1, w: 4.4, h: 3.4, rx: 1.7, fill: true }],
    em20: [{ d: 'M3 4.2h18M3 9.4h2.1M11.9 9.4h9.1M3 14.6h5.1M14.9 14.6h6.1M3 19.8h18' }, { x: 5.9, y: 7.7, w: 4.2, h: 3.4, rx: 1.7, fill: true }, { x: 8.9, y: 12.9, w: 4.2, h: 3.4, rx: 1.7, fill: true }],
  },
  'partitura': {
    normal: [{ d: 'M3 5h18M3 8.5h18M3 12h18M3 15.5h18M3 19h18' }, { cx: 8.8, cy: 15.5, r: 2.4, fill: true }, { d: 'M11.2 15.5V6.5' }],
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
    normal: [
      { d: 'M4.5 7h15M9.5 7V4.8h5V7M6.8 7l1 12.2h8.4l1-12.2' },
      { d: 'M10.2 10.8v5.4M13.8 10.8v5.4' },
    ],
    // Amputação: a parede direita e as duas costelas saem. Balde aberto ainda
    // é lixeira (o limite da R2·2).
    inerte: [{ d: 'M4.5 7h15M9.5 7V4.8h5V7M6.8 7l1 12.2h8.4', traco: 1.25 }],
  },
  'remover': {
    normal: [{ cx: 12, cy: 12, r: 8.5 }, { d: 'M8 12h8' }],
    // Amputação: meia corda, 4 — e vale para os dois do par.
    inerte: [{ cx: 12, cy: 12, r: 8.5, traco: 1.25 }, { d: 'M8 12h4', traco: 1.25 }],
  },
} as const satisfies Record<string, Desenho>

export type NomeIcone = keyof typeof desenhos
