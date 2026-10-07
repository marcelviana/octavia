/**
 * N4-PR8 — o core da visualização (V): os campos que V mostra e a linha das datas (`N4-REQUISITOS.md` N4-R14; N4-D31,
 * N4-D57, N4-D62; div. 1037). Vem antes do código (regra 30): contra a `main` o módulo não existe.
 *
 * O que se fixa aqui: **só os campos que o site salva de verdade** (álbum, dificuldade, gênero, tom, andamento,
 * etiquetas — `N4-PRECHECK.md` A4), na ORDEM da folha (`N4-*-V-letra`: álbum, tom, andamento, dificuldade, gênero,
 * etiquetas), com os rótulos do site (`VOCABULARIO_DE_CONTENT`); campo vazio não aparece; compasso, capo e afinação
 * nunca (herança D); as notas à parte (P-F3); e as duas datas numa linha, no formato de data de S1 (YYYY-MM-DD).
 */
import { describe, expect, it } from 'vitest'
import { camposDaVisualizacao, dataDoTablet, linhaDasDatas, notasDaVisualizacao } from './visualizacao'
import type { ContentDTO } from './types'

const BASE: ContentDTO = {
  id: '00000001-0000-4000-8000-000000000003',
  title: 'Manhã de ensaio',
  artist: 'Banda da fixture',
  album: 'Disco de fixture',
  content_type: 'Lyrics',
  content_data: { lyrics: 'texto de fixture' },
  file_url: null,
  updated_at: '2026-09-30T12:00:00.000+00:00',
  created_at: '2026-03-14T12:00:00.000+00:00',
  key: 'G',
  bpm: 92,
  difficulty: 'Intermediate',
  genre: 'Toada de fixture',
  tags: ['ensaio', 'voz e violão'],
  notes: 'Entrar depois da contagem de quatro do metrônomo.',
}

describe('camposDaVisualizacao — só os salvos de verdade, na ordem da folha, com o nome do site', () => {
  it('a ordem e os rótulos da folha; *Intermediário*; *92 BPM*; as etiquetas com ·', () => {
    expect(camposDaVisualizacao(BASE)).toEqual([
      { chave: 'album', rotulo: 'álbum', valor: 'Disco de fixture' },
      { chave: 'tom', rotulo: 'tom', valor: 'G' },
      { chave: 'andamento', rotulo: 'andamento', valor: '92 BPM' },
      { chave: 'dificuldade', rotulo: 'dificuldade', valor: 'Intermediário' },
      { chave: 'genero', rotulo: 'gênero', valor: 'Toada de fixture' },
      { chave: 'etiquetas', rotulo: 'etiquetas', valor: 'ensaio · voz e violão' },
    ])
  })

  it('a dificuldade: os três valores do site, sem caixa; um valor que não é do site segue como veio', () => {
    const d = (difficulty: string) => camposDaVisualizacao({ ...BASE, difficulty }).find((c) => c.chave === 'dificuldade')?.valor
    expect([d('Beginner'), d('intermediate'), d('ADVANCED'), d('Expert')]).toEqual(['Iniciante', 'Intermediário', 'Avançado', 'Expert'])
  })

  it('campo vazio não aparece: null, ausente, texto vazio ou só espaço, lista vazia, andamento 0', () => {
    const vazio: ContentDTO = { ...BASE, album: '  ', key: '', bpm: 0, difficulty: null, genre: undefined, tags: [] }
    expect(camposDaVisualizacao(vazio)).toEqual([])
    expect(camposDaVisualizacao({ ...BASE, tags: ['', 'ensaio'] }).find((c) => c.chave === 'etiquetas')?.valor).toBe('ensaio')
  })

  it('compasso, capo e afinação NUNCA, mesmo no dado (o site não os salva de verdade — herança D, N4-D31)', () => {
    const comTudo = { ...BASE, time_signature: '3/4', capo: 2, tuning: 'DADGAD' } as ContentDTO
    const chaves = camposDaVisualizacao(comTudo).map((c) => c.chave)
    expect(chaves).toEqual(['album', 'tom', 'andamento', 'dificuldade', 'genero', 'etiquetas'])
    expect(JSON.stringify(camposDaVisualizacao(comTudo))).not.toMatch(/3\/4|DADGAD|capo|compasso|afina/)
  })
})

describe('notasDaVisualizacao — as notas da música (P-F3), só em V', () => {
  it('o texto das notas; vazio ou só espaço = sem notas', () => {
    expect(notasDaVisualizacao(BASE)).toBe('Entrar depois da contagem de quatro do metrônomo.')
    for (const notes of ['', '   ', null, undefined]) expect(notasDaVisualizacao({ ...BASE, notes })).toBeNull()
  })
})

describe('as datas: *criado {data} · alterado {data}*, no formato de data de S1 (div. 1037)', () => {
  it('a data do aparelho: YYYY-MM-DD no fuso do aparelho (o dia que o músico viveu, não o do servidor)', () => {
    const iso = '2026-03-14T12:00:00.000+00:00'
    const d = new Date(iso)
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(dataDoTablet(iso)).toBe(local)
    expect(dataDoTablet(iso)).toBe('2026-03-14') // meio-dia UTC: o mesmo dia em qualquer fuso de −11 a +11
    expect(dataDoTablet('não é data')).toBeNull()
  })

  it('a linha: as duas, com os rótulos do site; uma só, se só uma existe; nenhuma, `null`', () => {
    expect(linhaDasDatas(BASE)).toBe('criado 2026-03-14 · alterado 2026-09-30')
    expect(linhaDasDatas({ ...BASE, created_at: undefined })).toBe('alterado 2026-09-30')
    expect(linhaDasDatas({ ...BASE, created_at: null, updated_at: 'x' })).toBeNull()
  })
})
