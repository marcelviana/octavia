/**
 * G-faixa — os contents de EXEMPLO do editor (I1-PR-11; folha `6-content-editor`): os dados que a própria folha
 * escreve (obra do projeto — "o que a regra NÃO alcança", CLAUDE.md), para os valores dos campos parearem com as
 * caixas da folha. Dado puro, sem import: usado pelo medidor (`g-faixa-conteudo.ts`, o `GET /api/content/g-faixa`
 * fabricado) e pela pré-verificação sem sessão (`docs/ux/I1-PR11-anexos/pre-verificacao/`).
 *
 * O Tom é a letra (*C*), como é gravado (decisão 9; a folha escreve *Dó* — I1-E20). Tab e letra levam o título e o
 * artista DELES (a folha copiou em *Detalhes* os da cifra — decisão 13: "sem par").
 */
const T = '2026-09-10T15:00:00Z'
const base = {
  user_id: 'g-faixa', album: null, bpm: null as number | null, capo: null, difficulty: null, genre: null, is_favorite: false,
  is_public: false, key: null as string | null, notes: null, tags: null, thumbnail_url: null, time_signature: '4/4', tuning: null,
  created_at: T, updated_at: T, file_url: null as string | null,
}

export const EXEMPLOS_EDITOR = {
  cifra: {
    ...base, id: 'g-faixa', title: 'Linha de 120 colunas', artist: 'Teste de régua', content_type: 'Chords', key: 'C', bpm: 96,
    content_data: { chords: 'C7M      G7\nLa la la, la la lá', sections: [{ id: 1, name: 'Verso curto — controle', chords: 'C7M G7', lyrics: 'La la la, la la lá' }] },
  },
  tab: {
    ...base, id: 'g-faixa', title: 'Trenzinho do caipira', artist: 'Villa-Lobos', content_type: 'Tab', bpm: 72,
    content_data: {
      tablature: 'e|-------0-----------0-------|',
      measures: [{ id: 1, strings: ['e|-------0-----------0-------|', 'B|-----1---1-------1---1-----|', 'G|---0-------0---0-------0---|',
        'D|---------------------------|', 'A|-3-------------------------|', 'E|---------------|-----------|'] }],
    },
  },
  letra: {
    ...base, id: 'g-faixa', title: 'Batch três', artist: null, content_type: 'Lyrics',
    content_data: { lyrics: 'Primeira estrofe da música três\n\n[Refrão]' },
  },
} as const

export type TipoDoExemplo = keyof typeof EXEMPLOS_EDITOR
