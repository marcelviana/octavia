/**
 * CONTROLE NEGATIVO do `gate:icones` (`gate:icones:cn`) — fora de `src/`,
 * nunca importado pelo app. Sem ele o gate é promessa, não gate. É o
 * `dados.ts` com sete defeitos plantados, um por regra do script:
 *
 *   (1) `apagar` FALTA           → 1 nome, e o círculo e o `d` dele somem do mapa
 *   (2) `lixeira` SOBRA          → 1 nome fora da §6.4, e o `d` dele não está no anexo D
 *   (3) `fechar` com o `d` mudado → o do anexo some do mapa, o do mapa não está no anexo
 *   (4) hex CRAVADO em `lixeira`  → `cor: '#6E6A80'`
 *   (5) `tinta: 'accent'`         → token que o `TintaIcone` não tem
 *   (6) `tab.em20` = o desenho de SEIS cordas (V1-PR5) → o erro que a §6.3
 *       existe para impedir: esquecer a exceção e servir em 20 dp o desenho
 *       dos outros tamanhos. Acusa OITO vezes — a comparação é elemento a
 *       elemento: três do `telas.html` somem (o `d` de quatro cordas e os
 *       dois trastes), quatro entram (o `d` de seis e os três trastes) e a
 *       contagem dá 6 onde a §6.3 declara 4.
 *   (7) `nada-encontrado` com o X de dentro da lupa torto — um braço 1 dp
 *       mais longo que o outro (V1-PR6) → o modo de errar um desenho
 *       "composto com as mesmas peças". Acusa UMA vez, pela regra 5: o
 *       conjunto de elementos não é o de nenhum `<svg>` do `telas.html`.
 *       O `email` e o `senha` entram CORRETOS — sem eles a regra 1 acusaria
 *       "falta no mapa" e o defeito (7) ficaria escondido no meio.
 *
 * Esperado: 18 acusações, exit 1. Auto-contido (sem os tipos do `dados.ts`),
 * para passar no `tsc --noEmit` do app sem importar nada.
 */
export const desenhosFalsos = {
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
    em20: [{ d: 'M3 3h18M3 6.6h1.225M11.175 6.6h9.825M3 10.2h9.225M19.175 10.2h1.825M3 13.8h4.225M14.175 13.8h6.825M3 17.4h18M3 21h18' }, { x: 5.5, y: 4.9, w: 4.4, h: 3.4, rx: 1.7, fill: true }, { x: 13.5, y: 8.5, w: 4.4, h: 3.4, rx: 1.7, fill: true }, { x: 8.5, y: 12.1, w: 4.4, h: 3.4, rx: 1.7, fill: true }],
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
    normal: [{ cx: 12, cy: 12, r: 9, tinta: 'lineInfo', tracejado: [2.6, 3] }, { d: 'M12 7.5v6M9.2 10.9l2.8 2.8 2.8-2.8', tinta: 'accentInk' }, { d: 'M8 16.5h8', tinta: 'accent' }],
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
    normal: [{ d: 'M6 6l12 12M18 6L6 18z' }],
  },
  'lixeira': {
    normal: [{ d: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13', cor: '#6E6A80' }],
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
  'email': {
    normal: [{ x: 3, y: 5.5, w: 18, h: 13, rx: 2.5 }, { d: 'M3.6 6.8L12 13l8.4-6.2' }],
  },
  'senha': {
    normal: [{ x: 4.5, y: 10.5, w: 15, h: 9.5, rx: 2.5 }, { d: 'M8 10.5V7.8a4 4 0 0 1 8 0v2.7' }],
  },
  // (7) o X de dentro da lupa com um braço 1 dp mais longo que o outro
  // (`l-5 6` no lugar de `l-5 5`) — o erro que um desenho "composto com as
  // mesmas peças" convida. Acusa UMA vez, pela regra 5. Não pode ser o X do
  // `fechar` inteiro: esse `d` está no anexo D e o defeito (7) esconderia o
  // (3), que acusa justamente a falta dele no mapa (medido).
  'nada-encontrado': {
    normal: [{ cx: 10.5, cy: 10.5, r: 6.5 }, { d: 'M15.5 15.5L21 21' }, { d: 'M8 8l5 5M13 8l-5 6' }],
  },
} as const
