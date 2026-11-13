'use client';

import React from 'react';
import { RichText } from '@/components/lesson/RichText';

export interface ParsedTable {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

export type TextChunk =
  | { type: 'paragraph'; text: string }
  | { type: 'table'; table: ParsedTable };

/**
 * Splits a markdown table row into cells, handling escaped pipes (\|)
 * and ignoring pipes located within inline ($...$) or block ($$...$$) math expressions.
 */
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

/**
 * Checks if a row is a markdown table delimiter row (e.g. | :--- | :---: | ---: |)
 */
export function isDelimiterRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.includes('-')) return false;
  const cells = splitTableRow(trimmed);
  if (cells.length === 0) return false;
  return cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell));
}

/**
 * Parses cell alignment indicator (:---, :---:, ---:)
 */
export function parseAlignment(cell: string): 'left' | 'center' | 'right' {
  const trimmed = cell.trim();
  const leftColon = trimmed.startsWith(':');
  const rightColon = trimmed.endsWith(':');
  if (leftColon && rightColon) return 'center';
  if (rightColon) return 'right';
  return 'left';
}

/**
 * Parses raw text content into paragraphs and markdown tables.
 */
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

interface LessonTableProps {
  table: ParsedTable;
}

export function LessonTable({ table }: LessonTableProps) {
  const getAlignClass = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-card)] shadow-xs">
      <table className="w-full min-w-full border-collapse text-left text-sm sm:text-base">
        <thead className="border-b border-[var(--line)] bg-[var(--surface-sunken)]">
          <tr>
            {table.headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-4 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--ink-900)] whitespace-nowrap ${getAlignClass(
                  table.alignments[idx] || 'left'
                )}`}
              >
                <RichText text={header} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {table.rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="transition-colors hover:bg-[var(--surface-sunken)]/40"
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-4 py-3.5 sm:px-5 sm:py-4 text-[var(--ink-900)] align-middle leading-relaxed ${getAlignClass(
                    table.alignments[cIdx] || 'left'
                  )}`}
                >
                  <RichText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
