'use client';

export type PlaygroundKind = 'web' | 'python';

export const WEB_FILES = ['index.html', 'styles.css', 'script.js'] as const;
export const PYTHON_FILES = ['main.py'] as const;

export const STARTERS: Record<string, string> = {
  'index.html':
    '<!-- Edit HTML, CSS and JavaScript — the preview updates live. -->\n<h1>Hello, world!</h1>\n<p>Start building your page here.</p>\n<button id="greet">Say hi</button>',
  'styles.css':
    'body {\n  font-family: system-ui, sans-serif;\n  padding: 24px;\n  color: #0E0E1A;\n}\n\nh1 {\n  color: #F2A900;\n}\n\nbutton {\n  padding: 8px 16px;\n  border-radius: 8px;\n  border: none;\n  background: #5B4FE8;\n  color: white;\n  cursor: pointer;\n}',
  'script.js':
    'document.getElementById("greet").addEventListener("click", function () {\n  alert("Hello from JavaScript!");\n});\n\nconsole.log("Script loaded.");',
  'main.py':
    '# Press Run (Ctrl/Cmd + Enter) to execute.\nname = "world"\nprint(f"Hello, {name}!")\n\nfor i in range(3):\n    print("Counting:", i)',
};

export function defaultFiles(kind: PlaygroundKind): Record<string, string> {
  if (kind === 'python') return { 'main.py': STARTERS['main.py'] };
  return {
    'index.html': STARTERS['index.html'],
    'styles.css': STARTERS['styles.css'],
    'script.js': STARTERS['script.js'],
  };
}

export function fileLanguage(file: string): string {
  if (file.endsWith('.py')) return 'python';
  if (file.endsWith('.css')) return 'css';
  if (file.endsWith('.js')) return 'javascript';
  if (file.endsWith('.html')) return 'html';
  return 'plaintext';
}

export function fileLabel(file: string): string {
  if (file === 'index.html') return 'HTML';
  if (file === 'styles.css') return 'CSS';
  if (file === 'script.js') return 'JS';
  if (file === 'main.py') return 'Python';
  return file;
}

export function fileIcon(file: string): string {
  if (file.endsWith('.html')) return 'html';
  if (file.endsWith('.css')) return 'css';
  if (file.endsWith('.js')) return 'js';
  if (file.endsWith('.py')) return 'py';
  return 'file';
}
