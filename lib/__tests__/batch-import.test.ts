import { describe, it, expect, vi } from 'vitest'
import { parseDocxFile, parsePdfFile } from '../batch-import'

vi.mock('mammoth', () => ({
  convertToHtml: vi.fn(async () => ({ value: '<p><strong>Song</strong></p><p>Line1<br/>Line2</p><p></p><p>Line3</p>' })),
  extractRawText: vi.fn(async () => ({ value: 'Song\nLine1\nLine2\n\nLine3\n' }))
}))

vi.mock('../pdf-utils', () => ({
  getPdfDocument: vi.fn(async () => ({
    numPages: 1,
    getPage: async () => ({
      getTextContent: async () => ({
        items: [
          { str: 'Song A', transform: [1,0,0,1,0,100], fontName: 'Bold' },
          { str: 'Line 1', transform: [1,0,0,1,0,90], fontName: 'Regular' },
          { str: 'Line 2', transform: [1,0,0,1,0,80], fontName: 'Regular' },
          { str: 'Song B', transform: [1,0,0,1,0,70], fontName: 'Bold' },
          { str: 'Last', transform: [1,0,0,1,0,60], fontName: 'Regular' }
        ],
        styles: {
          Bold: { fontFamily: 'Bold' },
          Regular: { fontFamily: 'Regular' }
        }
      })
    })
  }))
}))

describe('parseDocxFile', () => {
  it('preserves line breaks from docx', async () => {
    const file = new File(['dummy'], 'test.docx') as File & { arrayBuffer: () => Promise<ArrayBuffer> }
    ;(file as any).arrayBuffer = async () => new ArrayBuffer(8)
    const songs = await parseDocxFile(file)
    expect(songs).toHaveLength(1)
    expect(songs[0].title).toBe('Song')
    expect(songs[0].body).toBe('Line1\nLine2\n\nLine3\n')
  })
})

describe('parsePdfFile', () => {
  it('splits songs when encountering bold lines', async () => {
    const file = new File(['dummy'], 'test.pdf') as File & { arrayBuffer: () => Promise<ArrayBuffer> }
    ;(file as any).arrayBuffer = async () => new ArrayBuffer(8)
    const songs = await parsePdfFile(file)
    expect(songs).toHaveLength(2)
    expect(songs[0].title).toBe('Song A')
    expect(songs[0].body.trim()).toBe('Line 1\nLine 2')
    expect(songs[1].title).toBe('Song B')
    expect(songs[1].body.trim()).toBe('Last')
  })
})
