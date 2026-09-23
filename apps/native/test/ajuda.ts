/**
 * Fixtures dos testes do W1 — DTOs mínimos e bytes de PDF.
 *
 * Os PDFs aqui são sintéticos, e a forma deles é a medida nos dois aparelhos
 * (`W1-PRECHECK.md` §2/H4): cabeça `%PDF-`, e no fim `startxref <offset>` com
 * o offset DENTRO do tamanho, seguido de `%%EOF`. É essa forma — e só ela —
 * que o saneamento sabe julgar.
 */
import type { ContentDTO, SetlistDTO, SetlistSongDTO } from '@octavia/core'

/**
 * **A-N2-15 — as linhas IGUAIS ao evento, e não as que o contêm** (N2-PR7).
 *
 * `so('auth-failure')` (prefixo) e `not.toContain('auth-failure')` (subcadeia)
 * falham para os dois lados: uma linha nova como `write auth-failure-guard`
 * acusaria um logout que não houve, e o prefixo acharia qualquer evento que
 * COMECE com o nome. O aceite é `grep -x` no logcat — o formato real da linha
 * (`log.ts`) é `OCTAVIA: <evento>`, e é ele, inteiro, que se compara.
 */
export function exatas(linhas: readonly string[], evento: string): string[] {
  return linhas.filter((l) => l === `OCTAVIA: ${evento}`)
}

export const BUCKET = 'https://host/storage/v1/object/public/content-files'

/** Um PDF bem formado de ~`bytes` bytes. */
export function pdfBom(bytes = 400): string {
  const cabeca = '%PDF-1.7\n'
  const fim = (offset: number): string => `\nendobj\n\nstartxref\n${offset}\n%%EOF\n`
  const recheioN = Math.max(0, bytes - cabeca.length - fim(bytes).length)
  const recheio = 'x'.repeat(recheioN)
  return cabeca + recheio + fim(cabeca.length + recheioN)
}

/** O mesmo PDF cortado ao meio — o download que parou no caminho. */
export function pdfTruncado(bytes = 400): string {
  const inteiro = pdfBom(bytes)
  return inteiro.slice(0, Math.floor(inteiro.length / 2))
}

export function content(id: string, url: string | null): ContentDTO {
  return {
    id,
    title: `t-${id}`,
    artist: null,
    album: null,
    content_type: url === null ? 'Lyrics' : 'Sheet',
    content_data: url === null ? { lyrics: 'x' } : null,
    file_url: url,
    updated_at: '2026-09-01T00:00:00.000+00:00',
  }
}

export function song(id: string, position: number, contentId: string): SetlistSongDTO {
  return { id, setlist_id: 'sl1', content_id: contentId, position, notes: null, content: null }
}

export function setlist(
  id: string,
  songs: SetlistSongDTO[],
  performanceDate: string | null = null,
): SetlistDTO {
  return {
    id,
    name: `s-${id}`,
    performance_date: performanceDate,
    venue: null,
    updated_at: '2026-09-01T00:00:00.000+00:00',
    setlist_songs: songs,
  }
}

/** `YYYY-MM-DD` de amanhã no fuso do runner — a janela de 7 dias (T1-R15). */
export function amanha(): string {
  const d = new Date(Date.now() + 86_400_000)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Monta um repertório de `n` arquivos: urls, contents e a setlist datada.
 *
 * A `marca` entra na URL porque o `emVoo` do `files.ts` é estado de MÓDULO
 * indexado por URL: dois testes com a mesma URL, e o segundo pega carona no
 * voo que o primeiro deixou pendente. Cada teste traz a sua marca.
 */
export function repertorio(
  n: number,
  marca: string,
): {
  urls: string[]
  contentById: Map<string, ContentDTO>
  setlists: SetlistDTO[]
  nomes: string[]
} {
  const urls: string[] = []
  const contents: ContentDTO[] = []
  const songs: SetlistSongDTO[] = []
  const nomes: string[] = []
  for (let i = 1; i <= n; i++) {
    const nome = `1786218${marca}-arquivo-${i}.pdf`
    nomes.push(nome)
    const url = `${BUCKET}/${nome}`
    urls.push(url)
    contents.push(content(`c${i}`, url))
    songs.push(song(`s${i}`, i, `c${i}`))
  }
  return {
    urls,
    nomes,
    contentById: new Map(contents.map((c) => [c.id, c])),
    setlists: [setlist('sl1', songs, amanha())],
  }
}
