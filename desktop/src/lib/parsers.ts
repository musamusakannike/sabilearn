import katex from 'katex';

export type TextOrTableSegment =
  | { type: 'text'; content: string }
  | {
      type: 'table';
      headers: string[];
      alignments: Array<'left' | 'center' | 'right'>;
      rows: string[][];
    };

/**
 * Splits a markdown table row on unescaped `|` characters while respecting
 * pipes inside `$...$` and `$$...$$` math spans.
 */
export function splitTableRow(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let current = '';
  let inMath = false;
  let mathDelim = '';

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    const next = inner[i + 1];

    if (ch === '\\' && next === '|') {
      current += '|';
      i++;
      continue;
    }

    if (ch === '$') {
      if (!inMath) {
        if (next === '$') {
          inMath = true;
          mathDelim = '$$';
          current += '$$';
          i++;
          continue;
        }
        inMath = true;
        mathDelim = '$';
        current += '$';
        continue;
      } else if (mathDelim === '$$' && next === '$') {
        inMath = false;
        mathDelim = '';
        current += '$$';
        i++;
        continue;
      } else if (mathDelim === '$') {
        inMath = false;
        mathDelim = '';
        current += '$';
        continue;
      }
    }

    if (ch === '|' && !inMath) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

export function isDelimiterRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
  const cells = splitTableRow(trimmed);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

export function parseAlignment(cell: string): 'left' | 'center' | 'right' {
  const t = cell.trim();
  if (t.startsWith(':') && t.endsWith(':')) return 'center';
  if (t.endsWith(':')) return 'right';
  return 'left';
}

/**
 * Interleaves GFM markdown tables with normal text segments.
 */
export function parseTextAndTables(input: string): TextOrTableSegment[] {
  if (!input) return [];
  const lines = input.split('\n');
  const segments: TextOrTableSegment[] = [];
  let textBuf: string[] = [];

  const flushText = () => {
    if (textBuf.length > 0) {
      const joined = textBuf.join('\n').trim();
      if (joined) segments.push({ type: 'text', content: joined });
      textBuf = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    if (line.includes('|') && nextLine !== undefined && isDelimiterRow(nextLine)) {
      flushText();
      const headers = splitTableRow(line);
      const alignments = splitTableRow(nextLine).map(parseAlignment);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().includes('|') && !isDelimiterRow(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      segments.push({ type: 'table', headers, alignments, rows });
      continue;
    }

    textBuf.push(line);
    i++;
  }

  flushText();
  return segments;
}

/**
 * Extracts an 11-character YouTube video ID from a URL or raw ID string.
 */
export function parseYouTubeId(source: string): string | null {
  if (!source) return null;
  const trimmed = source.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
      if (embedIdx !== -1 && parts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIdx + 1])) {
        return parts[embedIdx + 1];
      }
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export interface MathSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

/**
 * Splits a string into plain text, inline math (`$...$` / `\(...\)`), and display math (`$$...$$` / `\[...\]`)
 * while leaving inline code backticks untouched.
 */
export function splitMathSegments(text: string): MathSegment[] {
  if (!text) return [];
  const pattern = /(`[^`]+`|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)(?:\\.|[^$\\])+(?<!\s)\$)/g;
  const segments: MathSegment[] = [];
  let lastIdx = 0;

  for (const match of text.matchAll(pattern)) {
    const idx = match.index ?? 0;
    if (idx > lastIdx) {
      segments.push({ type: 'text', content: text.slice(lastIdx, idx) });
    }
    const token = match[0];
    if (token.startsWith('`')) {
      segments.push({ type: 'text', content: token });
    } else if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({ type: 'display-math', content: token.slice(2, -2).trim() });
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      segments.push({ type: 'display-math', content: token.slice(2, -2).trim() });
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      segments.push({ type: 'inline-math', content: token.slice(2, -2).trim() });
    } else if (token.startsWith('$') && token.endsWith('$')) {
      segments.push({ type: 'inline-math', content: token.slice(1, -1).trim() });
    } else {
      segments.push({ type: 'text', content: token });
    }
    lastIdx = idx + token.length;
  }

  if (lastIdx < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIdx) });
  }

  return segments;
}

export function renderKatexHtml(expression: string, displayMode: boolean): string {
  const cleaned = expression
    .trim()
    .replace(/^\$\$/, '')
    .replace(/\$\$$/, '')
    .replace(/^\\\[/, '')
    .replace(/\\\]$/, '')
    .replace(/^\\\(/, '')
    .replace(/\\\)$/, '')
    .replace(/^\$/, '')
    .replace(/\$$/, '')
    .trim();

  return katex.renderToString(cleaned, {
    displayMode,
    throwOnError: false,
    strict: 'ignore',
    trust: false,
  });
}
