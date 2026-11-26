import { describe, expect, it } from 'vitest';
import {
  isDelimiterRow,
  parseTextAndTables,
  parseYouTubeId,
  renderKatexHtml,
  splitMathSegments,
  splitTableRow,
} from '../parsers';

describe('parsers', () => {
  it('splits markdown table rows while preserving pipes inside math spans', () => {
    const cells = splitTableRow('| Expression | Value | Condition |');
    expect(cells).toEqual(['Expression', 'Value', 'Condition']);

    const mathRow = splitTableRow('| $|x| + |y|$ | $P(A|B)$ | ok |');
    expect(mathRow).toEqual(['$|x| + |y|$', '$P(A|B)$', 'ok']);
  });

  it('detects delimiter rows and parses interleaved text and GFM tables', () => {
    expect(isDelimiterRow('| :--- | :---: | ---: |')).toBe(true);
    expect(isDelimiterRow('| foo | bar |')).toBe(false);

    const md = [
      'Intro paragraph.',
      '| Name | Big-O |',
      '| :--- | ---: |',
      '| Binary Search | $O(\\log n)$ |',
      '| Linear Scan | $O(n)$ |',
      '',
      'Closing note.',
    ].join('\n');

    const segments = parseTextAndTables(md);
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'text', content: 'Intro paragraph.' });
    expect(segments[1]).toEqual({
      type: 'table',
      headers: ['Name', 'Big-O'],
      alignments: ['left', 'right'],
      rows: [
        ['Binary Search', '$O(\\log n)$'],
        ['Linear Scan', '$O(n)$'],
      ],
    });
    expect(segments[2]).toEqual({ type: 'text', content: 'Closing note.' });
  });

  it('extracts YouTube IDs from standard, short, embed, and raw formats', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://example.com/not-youtube')).toBeNull();
  });

  it('splits inline and display math while leaving inline code backticks alone', () => {
    const segs = splitMathSegments('Use `$HOME` and $E = mc^2$ plus $$a^2 + b^2 = c^2$$.');
    expect(segs.some((s) => s.type === 'text' && s.content === '`$HOME`')).toBe(true);
    expect(segs.some((s) => s.type === 'inline-math' && s.content === 'E = mc^2')).toBe(true);
    expect(segs.some((s) => s.type === 'display-math' && s.content === 'a^2 + b^2 = c^2')).toBe(true);
  });

  it('renders KaTeX locally without throwing on malformed input', () => {
    const html = renderKatexHtml('x^2 + 1', false);
    expect(html).toContain('katex');
    const bad = renderKatexHtml('\\unknowncommand{x}', false);
    expect(typeof bad).toBe('string');
  });
});
