export interface ParsedSong {
  title: string
  body: string
}

export async function parseDocxFile(file: File): Promise<ParsedSong[]> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.convertToHtml({ arrayBuffer })
  const parser = new DOMParser()
  const doc = parser.parseFromString(value, 'text/html')
  const paragraphs = Array.from(doc.body.querySelectorAll('p'))

  const songs: ParsedSong[] = []
  let current: ParsedSong | null = null

  for (const p of paragraphs) {
    const text = p.textContent?.trim() || ''
    if (!text) continue
    const boldEl = p.querySelector('strong, b')
    const isBold =
      !!boldEl && boldEl.textContent?.trim() === text && boldEl.parentElement === p

    if (isBold) {
      if (current) {
        songs.push(current)
      }
      current = { title: text, body: '' }
    } else if (current) {
      current.body += text + '\n'
    }
  }

  if (current) songs.push(current)
  return songs
}

export async function parsePdfFile(file: File): Promise<ParsedSong[]> {
  const pdfjsLib = await import('pdfjs-dist/build/pdf')
  const worker = await import('pdfjs-dist/build/pdf.worker')
  ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = worker
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const lines: { text: string; bold: boolean }[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let line = ''
    let lastY: number | null = null
    let bold = true
    for (const item of content.items as any[]) {
      const tx = item.transform[5]
      if (lastY !== null && Math.abs(tx - lastY) > 2) {
        if (line.trim()) lines.push({ text: line.trim(), bold })
        line = item.str
        bold = /Bold/i.test(content.styles[item.fontName]?.fontFamily || '')
      } else {
        line += item.str
        bold = bold && /Bold/i.test(content.styles[item.fontName]?.fontFamily || '')
      }
      lastY = tx
    }
    if (line.trim()) lines.push({ text: line.trim(), bold })
  }

  const songs: ParsedSong[] = []
  let current: ParsedSong | null = null
  for (const ln of lines) {
    if (ln.bold) {
      if (current) songs.push(current)
      current = { title: ln.text, body: '' }
    } else if (current) {
      current.body += ln.text + '\n'
    }
  }
  if (current) songs.push(current)
  return songs
}
