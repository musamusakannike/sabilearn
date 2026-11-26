import { describe, expect, it } from 'vitest';
import { parseSseLines } from '../api';

describe('parseSseLines', () => {
  it('parses chunk events, [DONE] marker, and preserves incomplete trailing lines', () => {
    const input =
      'data: {"chunk":"Hello "}\n' +
      ': heartbeat\n\n' +
      'data: {"chunk":"world!"}\n' +
      'data: [DONE]\n' +
      'data: {"chunk":"partial';

    const { events, remainder } = parseSseLines(input);
    expect(events).toHaveLength(3);
    expect(events[0].chunk).toBe('Hello ');
    expect(events[1].chunk).toBe('world!');
    expect(events[2].done).toBe(true);
    expect(remainder).toBe('data: {"chunk":"partial');
  });
});
