import { useCallback, useMemo, useState } from 'react';
import { Text, View, StyleSheet, TextStyle, StyleProp, Platform } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

const KATEX_VERSION = '0.16.11';

function hasMath(text: string): boolean {
  const withoutCode = text.replace(/`[^`]+?`/g, '');
  return /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\)/.test(withoutCode);
}

function buildHtml(text: string, color: string, fontSize: number): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css" />
<script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/contrib/auto-render.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  #root {
    color: ${color};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: ${fontSize}px;
    line-height: 1.45;
    font-weight: 600;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: rgba(128, 128, 128, 0.14);
    padding: 0.1em 0.35em;
    border-radius: 5px;
  }
  .katex { font-size: 1.05em; }
  .katex-display { margin: 0.4em 0; overflow-x: auto; overflow-y: hidden; }
</style>
</head>
<body>
<div id="root">${escaped}</div>
<script>
  try {
    renderMathInElement(document.getElementById('root'), {
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
    var h = Math.ceil(document.getElementById('root').getBoundingClientRect().height);
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: h }));
  }
  requestAnimationFrame(report);
  window.addEventListener('load', function () { requestAnimationFrame(report); });
</script>
</body>
</html>`;
}

/**
 * Renders plain text (with `inline code` in monospace), or a KaTeX webview when the string contains $...$ / $$...$$.
 */
export default function RichMathText({
  text,
  style,
  color = '#111111',
  fontSize = 16,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  color?: string;
  fontSize?: number;
}) {
  const math = useMemo(() => hasMath(text), [text]);
  const [height, setHeight] = useState(28);
  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.height > 0) setHeight(data.height + 2);
    } catch {
      // ignore
    }
  }, []);

  if (!math) {
    if (/`[^`]+?`/.test(text)) {
      const parts = text.split(/(`[^`]+?`)/g);
      return (
        <Text style={style}>
          {parts.map((part, idx) => {
            const codeMatch = part.match(/^`([^`]+?)`$/);
            if (codeMatch) {
              return (
                <Text key={idx} style={styles.inlineCode}>
                  {codeMatch[1]}
                </Text>
              );
            }
            return <Text key={idx}>{part}</Text>;
          })}
        </Text>
      );
    }
    return <Text style={style}>{text}</Text>;
  }

  return (
    <View style={{ height, width: '100%' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(text, color, fontSize) }}
        style={[styles.web, { height }]}
        scrollEnabled={false}
        javaScriptEnabled
        onMessage={onMessage}
        containerStyle={{ height }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { width: '100%', backgroundColor: 'transparent' },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(128, 128, 128, 0.14)',
  },
});
