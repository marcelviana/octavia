export interface ParsedSong {
  title: string;
  body: string;
}

export async function parseDocxFile(file: File): Promise<ParsedSong[]> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.convertToHtml({ arrayBuffer });
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  const paragraphs = Array.from(doc.body.querySelectorAll("p"));

  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;

  for (const p of paragraphs) {
    let text = p.innerHTML.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");
    text = text.replace(/\u00A0/g, " ");
    const trimmed = text.trim();

    const boldEl = p.querySelector("strong, b");
    const isBold =
      !!boldEl &&
      boldEl.textContent?.trim() === trimmed &&
      boldEl.parentElement === p;

    if (isBold && trimmed) {
      if (current) {
        songs.push(current);
      }
      current = { title: trimmed, body: "" };
    } else if (current) {
      if (trimmed === "") {
        current.body += "\n";
      } else {
        current.body += text + "\n";
      }
    }
  }

  if (current) songs.push(current);
  return songs;
}

export async function parsePdfFile(file: File): Promise<ParsedSong[]> {
  const { getPdfDocument } = await import("./pdf-utils");
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getPdfDocument(arrayBuffer);
  const lines: { text: string; bold: boolean }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    let bold = true;
    for (const item of content.items as any[]) {
      const tx = item.transform[5];
      if (lastY !== null && Math.abs(tx - lastY) > 2) {
        if (line.trim()) lines.push({ text: line.trim(), bold });
        line = item.str;
        bold = /Bold/i.test(content.styles[item.fontName]?.fontFamily || "");
      } else {
        line += item.str;
        bold =
          bold && /Bold/i.test(content.styles[item.fontName]?.fontFamily || "");
      }
      lastY = tx;
    }
    if (line.trim()) lines.push({ text: line.trim(), bold });
  }

  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;
  for (const ln of lines) {
    if (ln.bold) {
      if (current) songs.push(current);
      current = { title: ln.text, body: "" };
    } else if (current) {
      current.body += ln.text + "\n";
    }
  }
  if (current) songs.push(current);
  return songs;
}

export async function parseTextFile(file: File): Promise<ParsedSong[]> {
  const text = await file.text();
  return parseTextContent(text);
}

export function parseTextContent(text: string): ParsedSong[] {
  const lines = text.split(/\r?\n/);
  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[-=]{3,}$/.test(line)) {
      if (current) {
        songs.push(current);
        current = null;
      }
      continue;
    }
    const isTitle = line === line.toUpperCase() && line.length <= 60;
    if (isTitle) {
      if (current) songs.push(current);
      current = { title: line, body: "" };
    } else {
      if (!current) {
        current = { title: "Untitled", body: "" };
      }
      current.body += raw + "\n";
    }
  }
  if (current) songs.push(current);
  return songs;
}
