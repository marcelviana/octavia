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

  // Parse HTML to build a map of text content to their bold status
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value, "text/html");
  const paragraphs = Array.from(doc.body.querySelectorAll("p"));

  // Create a map that tracks the exact position and bold status of each paragraph
  const paragraphData: Array<{ text: string; isBold: boolean; isValidTitle: boolean }> = [];
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const text = (p.textContent || "").replace(/\u00A0/g, " ").trim();
    
    if (!text) {
      paragraphData.push({ text: "", isBold: false, isValidTitle: false });
      continue;
    }
    
    // Check if the entire paragraph is bold
    const boldEl = p.querySelector("strong, b");
    const isBold = !!boldEl && boldEl.textContent?.trim() === text && boldEl.parentElement === p;
    const paragraphStyle = p.style.fontWeight || "";
    const isStyledBold = paragraphStyle.includes("bold") || paragraphStyle.includes("700");
    const actuallyBold = isBold || isStyledBold;
    
    let isValidTitle = false;
    if (actuallyBold) {
      // Additional heuristics to determine if this is likely a title:
      
      // 1. Title should be relatively short (not a long paragraph)
      if (text.length > 100) {
        isValidTitle = false;
      }
      // 2. Title should not contain line breaks or multiple sentences
      else if (text.includes('\n') || text.split('.').length > 2) {
        isValidTitle = false;
      }
      // 3. Title should be followed by non-bold content (lyrics)
      else {
        let hasFollowingContent = false;
        for (let j = i + 1; j < Math.min(i + 5, paragraphs.length); j++) {
          const nextP = paragraphs[j];
          const nextText = (nextP.textContent || "").trim();
          if (nextText) {
            const nextBoldEl = nextP.querySelector("strong, b");
            const nextIsBold = !!nextBoldEl && nextBoldEl.textContent?.trim() === nextText && nextBoldEl.parentElement === nextP;
            const nextIsStyledBold = (nextP.style.fontWeight || "").includes("bold") || (nextP.style.fontWeight || "").includes("700");
            
            if (!nextIsBold && !nextIsStyledBold) {
              hasFollowingContent = true;
              break;
            }
          }
        }
        
        // 4. Don't treat single common words as titles
        const commonWords = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'refrain', 'pre-chorus', 'tag', 'coda'];
        const isCommonWord = commonWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
        
        isValidTitle = hasFollowingContent && !isCommonWord;
      }
    }
    
    paragraphData.push({ text, isBold: actuallyBold, isValidTitle });
  }

  // Use the raw text from Mammoth for accurate line breaks
  let normalized = textResult.value.replace(/\r/g, "");
  if (normalized.includes("\n\n\n\n")) {
    normalized = normalized
      .replace(/\n{4}/g, "<BLANK>")
      .replace(/\n{2}/g, "\n")
      .replace(/<BLANK>/g, "\n\n");
  }
  const textLines = normalized.split("\n");

  const songs: ParsedSong[] = [];
  let current: ParsedSong | null = null;
  let paragraphIndex = 0;

  for (const raw of textLines) {
    const line = raw.trim();

    if (!line) {
      if (current) current.body += "\n";
      continue;
    }

    // Find the corresponding paragraph data for this line
    const correspondingParagraph = paragraphData[paragraphIndex];
    const isActuallyBoldTitle = correspondingParagraph && 
                               correspondingParagraph.text === line && 
                               correspondingParagraph.isBold && 
                               correspondingParagraph.isValidTitle;

    if (isActuallyBoldTitle) {
      // Additional validation before treating as a title
      const isValidTitle = line.length >= 2 && line.length <= 80 && 
                          !line.match(/^[^\w\s]+$/) && // Not just punctuation
                          !line.toLowerCase().match(/^(verse|chorus|bridge|intro|outro|refrain|pre-chorus|tag|coda)\s*\d*$/); // Not structure markers
      
      if (isValidTitle) {
        // Only bold lines can start a new song
        if (current) {
          current.body = current.body.replace(/\n+$/, "\n");
          songs.push(current);
        }
        current = { title: line, body: "" };
      } else {
        // Treat as regular content, not a title
        if (current) {
          current.body += raw + "\n";
        }
      }
    } else {
      // Non-bold lines are only added to existing songs, never start new ones
      if (current) {
        current.body += raw + "\n";
      }
      // If there's no current song, ignore non-bold lines (they're not song titles)
    }
    
    // Move to next paragraph if this line corresponds to one
    if (correspondingParagraph && correspondingParagraph.text === line) {
      paragraphIndex++;
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
      // Only bold lines can start a new song
      if (current) songs.push(current);
      current = { title: text, body: "" };
    } else {
      // Non-bold lines are only added to existing songs, never start new ones
      if (current) {
        current.body += text + "\n";
      }
      // If there's no current song, ignore non-bold lines (they're not song titles)
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
