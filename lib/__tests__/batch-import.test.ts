import { describe, it, expect, vi } from 'vitest'
import { parseDocxFile, parsePdfFile, parseTextContent } from '../batch-import'

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

  it('only creates new songs for bold titles, ignores non-bold lines', async () => {
    const mockHtml = '<p><strong>Bold Title</strong></p><p>Regular line that looks like a title</p><p>Some content</p><p><strong>Another Bold Title</strong></p><p>More content</p>'
    const mockText = 'Bold Title\nRegular line that looks like a title\nSome content\nAnother Bold Title\nMore content\n'
    
    vi.mocked(await import('mammoth')).convertToHtml.mockResolvedValueOnce({ value: mockHtml, messages: [] })
    vi.mocked(await import('mammoth')).extractRawText.mockResolvedValueOnce({ value: mockText, messages: [] })

    const file = new File(['dummy'], 'test.docx') as File & { arrayBuffer: () => Promise<ArrayBuffer> }
    ;(file as any).arrayBuffer = async () => new ArrayBuffer(8)
    const songs = await parseDocxFile(file)
    
    expect(songs).toHaveLength(2)
    expect(songs[0].title).toBe('Bold Title')
    expect(songs[0].body).toBe('Regular line that looks like a title\nSome content\n')
    expect(songs[1].title).toBe('Another Bold Title')
    expect(songs[1].body).toBe('More content\n')
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

  it('only creates new songs for bold titles, ignores non-bold lines', async () => {
    const mockPdf = {
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: [
            { str: 'Bold Song Title', transform: [1,0,0,1,0,100], fontName: 'Bold' },
            { str: 'Verse 1 content', transform: [1,0,0,1,0,90], fontName: 'Regular' },
            { str: 'Non Bold Title Looking Line', transform: [1,0,0,1,0,80], fontName: 'Regular' },
            { str: 'More verse content', transform: [1,0,0,1,0,70], fontName: 'Regular' },
            { str: 'Another Bold Title', transform: [1,0,0,1,0,60], fontName: 'Bold' },
            { str: 'Final content', transform: [1,0,0,1,0,50], fontName: 'Regular' }
          ],
          styles: {
            Bold: { fontFamily: 'Bold' },
            Regular: { fontFamily: 'Regular' }
          }
        })
      })
    }
    
    vi.mocked(await import('../pdf-utils')).getPdfDocument.mockResolvedValueOnce(mockPdf)

    const file = new File(['dummy'], 'test.pdf') as File & { arrayBuffer: () => Promise<ArrayBuffer> }
    ;(file as any).arrayBuffer = async () => new ArrayBuffer(8)
    const songs = await parsePdfFile(file)
    
    expect(songs).toHaveLength(2)
    expect(songs[0].title).toBe('Bold Song Title')
    expect(songs[0].body.trim()).toBe('Verse 1 content\nNon Bold Title Looking Line\nMore verse content')
    expect(songs[1].title).toBe('Another Bold Title')
    expect(songs[1].body.trim()).toBe('Final content')
  })
})

describe('parseTextContent', () => {
  it('handles non-bold lines correctly and only treats bold formatting as separators', () => {
    const textContent = `FIRST SONG TITLE
This is verse 1
This Could Be A Title But Not Bold
This is verse 2

SECOND SONG TITLE
Another verse here
Yet Another Title Looking Line
Final verse content`

    const songs = parseTextContent(textContent)
    
    expect(songs).toHaveLength(2)
    expect(songs[0].title).toBe('FIRST SONG TITLE')
    expect(songs[0].body.trim()).toBe('This is verse 1\nThis Could Be A Title But Not Bold\nThis is verse 2')
    expect(songs[1].title).toBe('SECOND SONG TITLE')
    expect(songs[1].body.trim()).toBe('Another verse here\nYet Another Title Looking Line\nFinal verse content')
  })

  it('demonstrates the fix: ignores non-bold lines that look like titles', () => {
    // This test demonstrates the exact scenario from the user's request
    const textContent = `SONG ONE
Verse 1 line 1
Verse 1 line 2
This Looks Like A Title But Is Not Bold
Verse 2 line 1
Verse 2 line 2

SONG TWO
Final verse content`

    const songs = parseTextContent(textContent)
    
    // Should only create 2 songs, not 3
    expect(songs).toHaveLength(2)
    
    // First song should include the "title-looking" line in its body
    expect(songs[0].title).toBe('SONG ONE')
    expect(songs[0].body).toContain('This Looks Like A Title But Is Not Bold')
    
    // Second song should be clean
    expect(songs[1].title).toBe('SONG TWO')
    expect(songs[1].body.trim()).toBe('Final verse content')
    
    // Log the results to demonstrate the fix
    console.log('✅ Fixed behavior demonstration:')
    console.log(`Songs detected: ${songs.length}`)
    console.log(`Song 1 title: "${songs[0].title}"`)
    console.log(`Song 1 body includes non-bold line: ${songs[0].body.includes('This Looks Like A Title But Is Not Bold')}`)
    console.log(`Song 2 title: "${songs[1].title}"`)
  })
})
