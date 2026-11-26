import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { useUiStore } from '@/stores/ui.store';

export interface CodeEditorProps {
  value: string;
  language: 'python' | 'javascript' | 'html' | 'css' | 'xml';
  onChange: (value: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
  height?: string;
}

export default function CodeEditor({
  value,
  language,
  onChange,
  onRun,
  readOnly = false,
  height = '100%',
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const resolvedTheme = useUiStore((s) => s.resolvedTheme);

  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const langExt =
      language === 'python'
        ? python()
        : language === 'javascript'
          ? javascript()
          : language === 'css'
            ? css()
            : html();

    const runBinding = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onRunRef.current?.();
          return true;
        },
      },
    ]);

    const themeExt =
      resolvedTheme === 'dark'
        ? oneDark
        : [
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            EditorView.theme({
              '&': {
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                height: '100%',
              },
              '.cm-gutters': {
                backgroundColor: 'var(--surface-sunken)',
                color: 'var(--text-tertiary)',
                borderRight: '1px solid var(--border-subtle)',
              },
              '.cm-activeLine': { backgroundColor: 'rgba(242, 169, 0, 0.08)' },
              '.cm-activeLineGutter': { backgroundColor: 'rgba(242, 169, 0, 0.14)' },
            }),
          ];

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        runBinding,
        langExt,
        themeExt,
        EditorState.readOnly.of(readOnly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { fontSize: '13.5px', fontFamily: 'var(--font-mono)', height: '100%' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-mono)' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: host });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate only when language, theme, or readOnly changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, resolvedTheme, readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={hostRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-default)]"
    />
  );
}
