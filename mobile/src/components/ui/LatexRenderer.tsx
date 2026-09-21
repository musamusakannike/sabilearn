import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useTheme, fontSizes } from '@/theme';
import LoadingSpinner from './LoadingSpinner';

interface LatexRendererProps {
  /** A LaTeX expression. May include surrounding $...$ or $$...$$ delimiters, or be raw. */
  expression: string;
  /** Render in display (block) mode vs inline. Defaults to display. */
  displayMode?: boolean;
  /** Base font size in pixels for the rendered math. Defaults to 18. */
  fontSize?: number;
}

/**
 * Strips surrounding $...$ / $$...$$ / \[...\] / \(...\) delimiters so KaTeX
 * receives a clean expression regardless of how the backend stored it.
 */
function stripDelimiters(input: string): string {
  let s = input.trim();
  s = s.replace(/^\$\$([\s\S]*)\$\$$/, '$1').trim();
  s = s.replace(/^\$([\s\S]*)\$$/, '$1').trim();
  s = s.replace(/^\\\[([\s\S]*)\\\]$/, '$1').trim();
  s = s.replace(/^\\\(([\s\S]*)\\\)$/, '$1').trim();
  return s;
}

const KATEX_VERSION = '0.16.11';

function buildHtml(
  tex: string,
  displayMode: boolean,
  fontSize: number,
  textColor: string,
  bgColor: string,
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css" />
<script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; background: ${bgColor}; }
  #math {
    color: ${textColor};
    font-size: ${fontSize}px;
    ${displayMode ? 'padding: 12px 8px; text-align: center;' : ''}
    overflow-x: auto;
    overflow-y: hidden;
  }
  #math .katex { font-size: ${fontSize}px; }
  #math .katex-display { margin: 0; }
</style>
</head>
<body>
<div id="math"></div>
<script>
  (function () {
    var tex = ${JSON.stringify(tex)};
    try {
      katex.render(tex, document.getElementById('math'), {
        throwOnError: false,
        displayMode: ${displayMode},
        output: 'html'
      });
    } catch (e) {
      document.getElementById('math').textContent = tex;
    }
    function report() {
      var h = Math.ceil(document.getElementById('math').getBoundingClientRect().height);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: h }));
    }
    if (document.readyState === 'complete') {
      requestAnimationFrame(report);
    } else {
      window.addEventListener('load', function () { requestAnimationFrame(report); });
    }
  })();
</script>
</body>
</html>`;
}

export default function LatexRenderer({
  expression,
  displayMode = true,
  fontSize = fontSizes.lg,
}: LatexRendererProps) {
  const { colors } = useTheme();
  const webviewRef = useRef<WebView>(null);
  const [height, setHeight] = useState(48);
  const [isLoaded, setIsLoaded] = useState(false);

  const tex = stripDelimiters(expression);
  const html = buildHtml(tex, displayMode, fontSize, colors.textPrimary, colors.surfaceCard);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && typeof data.height === 'number' && data.height > 0) {
        setHeight(data.height);
        setIsLoaded(true);
      }
    } catch {
      // ignore malformed messages
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceCard, height }]}>
      {!isLoaded && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <LoadingSpinner size="small" fill={false} />
        </View>
      )}
      <WebView
        ref={webviewRef}
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
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
