import { PlaygroundKind } from './types';

export const STARTERS: Record<string, string> = {
  'index.html':
    '<!-- Edit HTML, CSS and JavaScript — the preview updates automatically. -->\n<h1>Hello, SabiLearn!</h1>\n<p>Start building your page here.</p>\n<button id="greet">Say hi</button>',
  'styles.css':
    'body {\n  font-family: system-ui, sans-serif;\n  padding: 24px;\n  color: #0E0E1A;\n  background: #FAF9F7;\n}\n\nh1 {\n  color: #D89400;\n}\n\nbutton {\n  padding: 8px 16px;\n  border-radius: 8px;\n  border: none;\n  background: #5B4FE8;\n  color: white;\n  cursor: pointer;\n}',
  'script.js':
    'document.getElementById("greet").addEventListener("click", function () {\n  console.log("Hello from JavaScript!");\n});\n\nconsole.log("Preview ready.");',
  'main.py':
    '# Press Ctrl/Cmd+Enter or Run to execute.\nname = "SabiLearn"\nprint(f"Hello, {name}!")\n\nfor i in range(3):\n    print("Counting:", i)',
};

export function defaultFiles(kind: PlaygroundKind): Record<string, string> {
  if (kind === 'python') {
    return { 'main.py': STARTERS['main.py'] };
  }
  return {
    'index.html': STARTERS['index.html'],
    'styles.css': STARTERS['styles.css'],
    'script.js': STARTERS['script.js'],
  };
}

export function fileLanguage(file: string): 'python' | 'css' | 'javascript' | 'html' {
  if (file.endsWith('.py')) return 'python';
  if (file.endsWith('.css')) return 'css';
  if (file.endsWith('.js')) return 'javascript';
  return 'html';
}

export function buildSandboxedWebPreviewHtml(files: Record<string, string>): string {
  const html = files['index.html'] || '';
  const css = files['styles.css'] || '';
  const js = files['script.js'] || '';
  const escapedJs = js.replace(/<\/script>/gi, '<\\/script>');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>
    (function(){
      var send = function(level, args) {
        try {
          parent.postMessage({
            type: 'sabilearn-preview-console',
            level: level,
            text: Array.prototype.map.call(args, function(a){
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            }).join(' ')
          }, '*');
        } catch(e) {}
      };
      var origLog = console.log, origErr = console.error, origWarn = console.warn;
      console.log = function(){ send('log', arguments); origLog.apply(console, arguments); };
      console.warn = function(){ send('warn', arguments); origWarn.apply(console, arguments); };
      console.error = function(){ send('error', arguments); origErr.apply(console, arguments); };
      window.onerror = function(msg){ send('error', [msg]); };
    })();
  </script>
  <script>${escapedJs}</script>
</body>
</html>`;
}
