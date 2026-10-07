/**
 * O CORE DA VISUALIZAÇÃO (V) — N4-PR8 (`N4-REQUISITOS.md` N4-R14; N4-D31, N4-D57, N4-D62; `DESIGN-N4/telas.html`,
 * `N4-*-V-letra`, `N4-*-V-campos-vazios`).
 *
 * **Os campos**: só os que o site salva de verdade (`N4-PRECHECK.md` A4) — álbum, tom, andamento, dificuldade, gênero,
 * etiquetas —, NA ORDEM DA FOLHA (que não é a do *Detalhes* do site: a folha põe o tom e o andamento logo depois do
 * álbum), com os rótulos do site (`VOCABULARIO_DE_CONTENT`, byte a byte). Campo vazio não aparece. **Compasso, capo e
 * afinação nunca** — o site não os salva de verdade (herança D, N4-D31): mesmo que o dado os traga, não saem daqui.
 * As formas: a dificuldade pelo rótulo do site com maiúscula (*Intermediário* — a folha; o *Detalhes* do site escreve
 * minúscula, div. 1037), o andamento em *{x} BPM*, as etiquetas separadas por ` · `.
 *
 * **As notas da música** (P-F3) moram à parte: o rótulo é da tela (`FRASES_N4['notas-da-musica']`), e só V as mostra
 * (o palco não muda, N4-D57).
 *
 * **As datas** (div. 1037): *criado {data} · alterado {data}*, com os rótulos do site e a data no formato que o tablet
 * já usa para data (a de S1 e S2, `YYYY-MM-DD`) — no FUSO DO APARELHO: o `created_at` é um instante, e o dia que o
 * músico viveu é o local, não o do servidor (meio-dia UTC é o mesmo dia de −11 a +11; uma da manhã UTC é a véspera
 * em São Paulo).
 *
 * Nenhuma frase nova mora aqui: os rótulos vêm do grupo 1 do `frases-content.ts`; o que este módulo junta é dado.
 */
import { ROTULO_DA_DIFICULDADE, VOCABULARIO_DE_CONTENT, andamentoEmBpm } from './frases-content'
import type { ContentDTO } from './types'

export type ChaveDoCampo = 'album' | 'tom' | 'andamento' | 'dificuldade' | 'genero' | 'etiquetas'

export interface CampoDaVisualizacao {
  chave: ChaveDoCampo
  rotulo: string
  valor: string
}

/** Texto com conteúdo (sem os espaços das pontas), ou `null`. */
function texto(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

/** A dificuldade gravada pelo site (`Beginner` · `Intermediate` · `Advanced`, sem caixa) → o rótulo; outro valor, como veio. */
function dificuldade(v: string): string {
  const achado = (Object.keys(ROTULO_DA_DIFICULDADE) as (keyof typeof ROTULO_DA_DIFICULDADE)[]).find(
    (k) => k.toLowerCase() === v.toLowerCase(),
  )
  return achado === undefined ? v : ROTULO_DA_DIFICULDADE[achado]
}

/** Os campos de *Detalhes*, na ordem da folha; só os que têm valor. */
export function camposDaVisualizacao(c: ContentDTO): CampoDaVisualizacao[] {
  const out: CampoDaVisualizacao[] = []
  const par = (chave: ChaveDoCampo, rotulo: string, valor: string | null): void => {
    if (valor !== null) out.push({ chave, rotulo, valor })
  }
  const dif = texto(c.difficulty)
  const etiquetas = Array.isArray(c.tags) ? c.tags.map(texto).filter((t): t is string => t !== null) : []
  par('album', VOCABULARIO_DE_CONTENT['campo-album'], texto(c.album))
  par('tom', VOCABULARIO_DE_CONTENT['campo-tom'], texto(c.key))
  par('andamento', VOCABULARIO_DE_CONTENT['campo-andamento'], typeof c.bpm === 'number' && c.bpm > 0 ? andamentoEmBpm(c.bpm) : null)
  par('dificuldade', VOCABULARIO_DE_CONTENT['campo-dificuldade'], dif === null ? null : dificuldade(dif))
  par('genero', VOCABULARIO_DE_CONTENT['campo-genero'], texto(c.genre))
  par('etiquetas', VOCABULARIO_DE_CONTENT['campo-etiquetas'], etiquetas.length > 0 ? etiquetas.join(' · ') : null)
  return out
}

/** As notas da música (P-F3), ou `null` quando não há. */
export function notasDaVisualizacao(c: ContentDTO): string | null {
  return texto(c.notes)
}

/** Um instante ISO → *YYYY-MM-DD* no fuso do aparelho; `null` se não é data. */
export function dataDoTablet(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const dois = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`
}

/** *criado {data} · alterado {data}* — a que existir; `null` se nenhuma. */
export function linhaDasDatas(c: Pick<ContentDTO, 'created_at' | 'updated_at'>): string | null {
  const partes: string[] = []
  const criado = typeof c.created_at === 'string' ? dataDoTablet(c.created_at) : null
  const alterado = typeof c.updated_at === 'string' ? dataDoTablet(c.updated_at) : null
  if (criado !== null) partes.push(`${VOCABULARIO_DE_CONTENT['campo-criado']} ${criado}`)
  if (alterado !== null) partes.push(`${VOCABULARIO_DE_CONTENT['campo-alterado']} ${alterado}`)
  return partes.length > 0 ? partes.join(' · ') : null
}
