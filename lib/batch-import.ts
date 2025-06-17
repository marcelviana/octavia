export interface ParsedSong {
  title: string;
  body: string;
}

export async function parseDocxFile(file: File): Promise<ParsedSong[]> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();

  // Extract HTML for bold detection and raw text for exact line breaks
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  // Parse HTML to find bold paragraphs which represent song titles
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value, "text/html");
  const paragraphs = Array.from(doc.body.querySelectorAll("p"));

  const boldTitles = new Set<string>();
  for (const p of paragraphs) {
    const text = (p.textContent || "").replace(/\u00A0/g, " ").trim();
    const boldEl = p.querySelector("strong, b");
    const isBold = !!boldEl && boldEl.textContent?.trim() === text && boldEl.parentElement === p;
    const paragraphStyle = p.style.fontWeight || "";
    const isStyledBold = paragraphStyle.includes("bold") || paragraphStyle.includes("700");
    if ((isBold || isStyledBold) && text.length > 0) {
      boldTitles.add(text);
    }
  }

  // Use the raw text from Mammoth for accurate line breaks
  const textLines = textResult.value.split(/\r?\n/);

  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;

  for (const raw of textLines) {
    const line = raw.trim();

    if (!line) {
      if (current) current.body += "\n";
      continue;
    }

    if (boldTitles.has(line)) {
      if (current) {
        current.body = current.body.replace(/\n+$/, "\n");
        songs.push(current);
      }
      current = { title: line, body: "" };
    } else {
      if (!current) {
        current = { title: line, body: "" };
      } else {
        current.body += raw + "\n";
      }
    }
  }

  if (current) {
    current.body = current.body.replace(/\n+$/, "\n");
    songs.push(current);
  }
  return songs;
}

export async function parsePdfFile(file: File): Promise<ParsedSong[]> {
  const { getPdfDocument } = await import("./pdf-utils");
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getPdfDocument(arrayBuffer);
  const lines: { text: string; bold: boolean; isEmpty: boolean }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    let bold = false;
    
    for (const item of content.items as any[]) {
      const tx = item.transform[5];
      
      // Check if this is a new line (different Y coordinate)
      if (lastY !== null && Math.abs(tx - lastY) > 2) {
        // Always add the line, even if empty, to preserve spacing
        lines.push({ text: line.trim(), bold, isEmpty: !line.trim() });
        line = item.str;
        bold = /Bold|bold|Heavy|Black/i.test(item.fontName || "") ||
               /Bold|bold|Heavy|Black/i.test(content.styles?.[item.fontName]?.fontFamily || "");
      } else {
        line += item.str;
        bold = bold || /Bold|bold|Heavy|Black/i.test(item.fontName || "") ||
               /Bold|bold|Heavy|Black/i.test(content.styles?.[item.fontName]?.fontFamily || "");
      }
      lastY = tx;
    }
    // Always add the final line
    lines.push({ text: line.trim(), bold, isEmpty: !line.trim() });
  }

  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;

  for (const ln of lines) {
    const text = ln.text.trim();

    if (ln.isEmpty) {
      if (current) current.body += "\n";
      continue;
    }

    if (ln.bold) {
      if (current) songs.push(current);
      current = { title: text, body: "" };
    } else {
      if (!current) {
        current = { title: text, body: "" };
      } else {
        current.body += text + "\n";
      }
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
  let expectingTitle = false; // Only set to true after finding a separator

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    
    // Check for separator lines
    if (/^[-=]{3,}$/.test(line)) {
      if (current) {
        songs.push(current);
        current = null;
      }
      expectingTitle = true; // Next non-empty line should be a title
      continue;
    }
    
    // Skip empty lines when looking for titles, but preserve them in song bodies
    if (!line) {
      if (current) {
        current.body += "\n";
      }
      continue;
    }
    
    // If we're expecting a title (after separator)
    if (expectingTitle) {
      if (current) songs.push(current);
      current = { title: line, body: "" };
      expectingTitle = false;
    } else {
      // Only detect titles if they are ALL CAPS (much more restrictive)
      const isAllCaps = line === line.toUpperCase() && line.length <= 60 && line.length > 2;
      
      if (isAllCaps) {
        if (current) songs.push(current);
        current = { title: line, body: "" };
      } else {
        if (!current) {
          // First line of the document becomes the title if no current song
          current = { title: line, body: "" };
        } else {
          current.body += raw + "\n";
        }
      }
    }
  }
  
  if (current) songs.push(current);
  return songs;
}
