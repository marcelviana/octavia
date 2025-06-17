export interface ParsedSong {
  title: string;
  body: string;
}

export async function parseDocxFile(file: File): Promise<ParsedSong[]> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  
  // Get both HTML (for bold detection) and raw text (for line breaks)
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  
  // Parse HTML for bold detection
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value, "text/html");
  const paragraphs = Array.from(doc.body.querySelectorAll("p"));
  
  // Get bold titles from HTML
  const boldTitles = new Set<string>();
  for (const p of paragraphs) {
    let text = p.innerHTML.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");
    text = text.replace(/\u00A0/g, " ");
    text = text.replace(/&nbsp;/g, " ");
    const trimmed = text.trim();
    
    const boldEl = p.querySelector("strong, b");
    const isBold = !!boldEl && boldEl.textContent?.trim() === trimmed && boldEl.parentElement === p;
    const paragraphStyle = p.style.fontWeight || "";
    const isStyledBold = paragraphStyle.includes("bold") || paragraphStyle.includes("700");
    
    if ((isBold || isStyledBold) && trimmed.length > 0) {
      boldTitles.add(trimmed);
    }
  }
  
  // Instead of using raw text, let's reconstruct from paragraphs to have better control
  const textLines: string[] = [];
  for (const p of paragraphs) {
    let text = p.innerHTML.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");
    text = text.replace(/\u00A0/g, " ");
    text = text.replace(/&nbsp;/g, " ");
    
    // Split by internal line breaks and add each as a separate line
    const internalLines = text.split('\n');
    for (const internalLine of internalLines) {
      textLines.push(internalLine);
    }
  }
  
  // Now process like text parser
  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;

  for (let i = 0; i < textLines.length; i++) {
    const raw = textLines[i];
    const line = raw.trim();
    
    // Skip empty lines when looking for titles, but preserve them in song bodies
    if (!line) {
      if (current) {
        current.body += "\n";
      }
      continue;
    }
    
    // Check if this line is a known title from bold detection
    const isTitle = boldTitles.has(line);
    
    if (isTitle) {
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

  if (current) songs.push(current);
  return songs;
}

export async function parsePdfFile(file: File): Promise<ParsedSong[]> {
  const { getPdfDocument } = await import("./pdf-utils");
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getPdfDocument(arrayBuffer);
  const lines: { text: string; bold: boolean; fontSize: number; isEmpty: boolean }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    let bold = false;
    let fontSize = 12;
    
    for (const item of content.items as any[]) {
      const tx = item.transform[5];
      const currentFontSize = item.transform[0] || 12;
      
      // Check if this is a new line (different Y coordinate)
      if (lastY !== null && Math.abs(tx - lastY) > 2) {
        // Always add the line, even if empty, to preserve spacing
        lines.push({ text: line.trim(), bold, fontSize, isEmpty: !line.trim() });
        line = item.str;
        // Detect bold text from font name or style
        bold = /Bold|bold|Heavy|Black/i.test(item.fontName || "") || 
              /Bold|bold|Heavy|Black/i.test(content.styles?.[item.fontName]?.fontFamily || "");
        fontSize = currentFontSize;
      } else {
        line += item.str;
        // Update bold status - if any part of the line is bold, consider it bold
        bold = bold || /Bold|bold|Heavy|Black/i.test(item.fontName || "") || 
              /Bold|bold|Heavy|Black/i.test(content.styles?.[item.fontName]?.fontFamily || "");
        fontSize = Math.max(fontSize, currentFontSize);
      }
      lastY = tx;
    }
    // Always add the final line
    lines.push({ text: line.trim(), bold, fontSize, isEmpty: !line.trim() });
  }

  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;
  
  // Calculate average font size to detect larger titles (only from non-empty lines)
  const nonEmptyLines = lines.filter(line => !line.isEmpty);
  const avgFontSize = nonEmptyLines.length > 0 
    ? nonEmptyLines.reduce((sum, line) => sum + line.fontSize, 0) / nonEmptyLines.length 
    : 12;
  
  for (const ln of lines) {
    const text = ln.text.trim();
    
    // Handle empty lines - preserve them in song bodies
    if (ln.isEmpty) {
      if (current) {
        current.body += "\n";
      }
      continue;
    }
    
    // Multiple strategies to detect song titles:
    // 1. Bold text
    // 2. Larger font size (significantly larger than average)
    // 3. All uppercase text (but not too long to avoid false positives)
    // 4. Text that looks like a title pattern
    const isLargerFont = ln.fontSize > avgFontSize * 1.2;
    const isAllCaps = text === text.toUpperCase() && text.length <= 60 && text.length > 2;
    const looksLikeTitle = /^[A-Z][A-Za-z\s\-']{2,50}$/.test(text) && !text.includes('.');
    const isShortLine = text.length <= 60;
    
    const isTitle = (ln.bold || isLargerFont || (isAllCaps && isShortLine)) && 
                   text.length > 1 && 
                   !text.match(/^(page|p\.|chapter|ch\.|verse|chorus|bridge|\d+)$/i);
    
    if (isTitle) {
      if (current) {
        songs.push(current);
      }
      current = { title: text, body: "" };
    } else if (current) {
      current.body += text + "\n";
    } else if (!isTitle && looksLikeTitle) {
      // If we don't have a current song and this looks like a title, start a new one
      current = { title: text, body: "" };
    }
  }
  
  if (current) songs.push(current);
  
  // If no songs were detected using the above logic, try a simpler approach
  if (songs.length === 0 && nonEmptyLines.length > 0) {
    // Fallback: treat the first non-empty line as title and rest as body
    current = { title: nonEmptyLines[0].text || "Untitled", body: "" };
    let foundTitle = false;
    for (const line of lines) {
      if (line.isEmpty) {
        if (foundTitle) current.body += "\n";
      } else if (!foundTitle && line.text === current.title) {
        foundTitle = true;
      } else if (foundTitle) {
        current.body += line.text + "\n";
      }
    }
    if (current.body.trim()) {
      songs.push(current);
    }
  }
  
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
