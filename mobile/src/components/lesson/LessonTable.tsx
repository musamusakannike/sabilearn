import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { radii, spacing } from '@/theme';

export interface ParsedTable {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

export type TextChunk =
  | { type: 'paragraph'; text: string }
  | { type: 'table'; table: ParsedTable };

export function splitTableRow(rowText: string): string[] {
  let trimmed = rowText.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let escaped = false;
  let inInlineMath = false;
  let inBlockMath = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    const nextChar = trimmed[i + 1];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      current += char;
      continue;
    }

    if (char === '$') {
      if (!inBlockMath && !inInlineMath) {
        if (nextChar === '$') {
          inBlockMath = true;
          current += '$$';
          i++;
          continue;
        } else {
          inInlineMath = true;
          current += '$';
          continue;
        }
      } else if (inBlockMath && nextChar === '$') {
        inBlockMath = false;
        current += '$$';
        i++;
        continue;
      } else if (inInlineMath) {
        inInlineMath = false;
        current += '$';
        continue;
      }
    }

    if (char === '|' && !inInlineMath && !inBlockMath) {
      cells.push(current.trim().replace(/\\\|/g, '|'));
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim().replace(/\\\|/g, '|'));
  return cells;
}

export function isDelimiterRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.includes('-')) return false;
  const cells = splitTableRow(trimmed);
  if (cells.length === 0) return false;
  return cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell));
}

export function parseAlignment(cell: string): 'left' | 'center' | 'right' {
  const trimmed = cell.trim();
  const leftColon = trimmed.startsWith(':');
  const rightColon = trimmed.endsWith(':');
  if (leftColon && rightColon) return 'center';
  if (rightColon) return 'right';
  return 'left';
}

export function parseTextAndTables(rawContent: string): TextChunk[] {
  if (!rawContent) return [];
  const lines = rawContent.split(/\r?\n/);
  const chunks: TextChunk[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length === 0) return;
    const text = currentParagraphLines.join('\n').trim();
    if (text) {
      const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
      for (const p of paragraphs) {
        chunks.push({ type: 'paragraph', text: p.trim() });
      }
    }
    currentParagraphLines = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (
      trimmedLine &&
      trimmedLine.includes('|') &&
      i + 1 < lines.length &&
      isDelimiterRow(lines[i + 1])
    ) {
      flushParagraph();

      const headerRow = line;
      const delimiterRow = lines[i + 1];
      const headers = splitTableRow(headerRow);
      const delimiterCells = splitTableRow(delimiterRow);
      const alignments = delimiterCells.map(parseAlignment);

      while (alignments.length < headers.length) {
        alignments.push('left');
      }

      i += 2;
      const rows: string[][] = [];

      while (i < lines.length) {
        const rowLine = lines[i];
        const trimmedRow = rowLine.trim();
        if (!trimmedRow || !trimmedRow.includes('|') || isDelimiterRow(rowLine)) {
          break;
        }
        const cells = splitTableRow(rowLine);
        while (cells.length < headers.length) {
          cells.push('');
        }
        rows.push(cells);
        i++;
      }

      chunks.push({
        type: 'table',
        table: {
          headers,
          alignments,
          rows,
        },
      });
      continue;
    }

    currentParagraphLines.push(line);
    i++;
  }

  flushParagraph();
  return chunks;
}

const KATEX_VERSION = '0.16.11';

function escapeCellHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #0084FE; font-weight: 700;">$1</a>');
}

function buildTableHtml(table: ParsedTable, colors: any): string {
  const textColor = colors.textPrimary || '#0E0E1A';
  const borderColor = colors.borderSubtle || '#DEDAD0';
  const cardBg = colors.surfaceCard || '#FFFFFF';
  const sunkenBg = colors.surfaceSunken || '#ECE8DF';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css" />
<script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/contrib/auto-render.min.js"></script>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: ${textColor};
  }
  .table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    border-radius: 16px;
    border: 1px solid ${borderColor};
    background: ${cardBg};
  }
  table {
    width: 100%;
    min-width: 100%;
    border-collapse: collapse;
    font-size: 15px;
    line-height: 1.45;
  }
  thead {
    background: ${sunkenBg};
    border-bottom: 1px solid ${borderColor};
  }
  th {
    padding: 12px 14px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 800;
    color: ${textColor};
    white-space: nowrap;
  }
  tbody tr {
    border-bottom: 1px solid ${borderColor};
  }
  tbody tr:last-child {
    border-bottom: none;
  }
  td {
    padding: 12px 14px;
    color: ${textColor};
    vertical-align: middle;
  }
  .align-left { text-align: left; }
  .align-center { text-align: center; }
  .align-right { text-align: right; }
  .katex { font-size: 1.05em; }
  .katex-display { margin: 0.3em 0; overflow-x: auto; overflow-y: hidden; }
</style>
</head>
<body>
<div id="table-root" class="table-scroll">
  <table>
    <thead>
      <tr>
        ${table.headers
          .map(
            (h, i) =>
              `<th class="align-${table.alignments[i] || 'left'}">${escapeCellHtml(h)}</th>`
          )
          .join('')}
      </tr>
    </thead>
    <tbody>
      ${table.rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell, i) =>
                  `<td class="align-${table.alignments[i] || 'left'}">${escapeCellHtml(
                    cell
                  )}</td>`
              )
              .join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
</div>
<script>
  try {
    renderMathInElement(document.getElementById('table-root'), {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\\\[', right: '\\\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\\\(', right: '\\\\)', display: false }
      ],
      throwOnError: false
    });
  } catch (e) {}

  function report() {
    var el = document.getElementById('table-root');
    if (!el) return;
    var h = Math.ceil(el.offsetHeight || el.getBoundingClientRect().height);
    if (h > 0 && window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: h + 4 }));
    }
  }
  window.addEventListener('load', report);
  requestAnimationFrame(report);
  setTimeout(report, 250);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(report).observe(document.getElementById('table-root'));
  }
</script>
</body>
</html>`;
}

interface LessonTableProps {
  table: ParsedTable;
  colors: any;
}

export function LessonTable({ table, colors }: LessonTableProps) {
  const [height, setHeight] = useState(() => Math.max(120, (table.rows.length + 1) * 48 + 10));

  const html = useMemo(() => buildTableHtml(table, colors), [table, colors]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && typeof data.height === 'number' && data.height > 0) {
        setHeight(data.height);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={[styles.webview, { height }]}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={onMessage}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        containerStyle={{ height }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.xl,
    marginVertical: spacing.xs,
  },
  webview: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
