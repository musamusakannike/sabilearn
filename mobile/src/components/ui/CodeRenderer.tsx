import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { IconCopy, IconCheck } from '@tabler/icons-react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';
import LoadingSpinner from './LoadingSpinner';

interface CodeRendererProps {
  code: string;
  language?: string;
}

const HLJS_VERSION = '11.9.0';

// Dark code-block styling, independent of the light app theme — matches the
// LatexRenderer WebView+CDN pattern, swapping KaTeX for highlight.js.
function buildHtml(code: string, language: string): string {
  const safe = JSON.stringify(code);
  const lang = JSON.stringify(language || 'plaintext');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/styles/atom-one-dark.min.css" />
<script src="https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/lib/highlight.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; background: #1E1E2A; }
  pre { margin: 0; padding: 14px 16px; overflow-x: auto; }
  code { font-family: 'Menlo', 'Courier New', monospace; font-size: 13px; line-height: 1.55; white-space: pre; }
  ::-webkit-scrollbar { height: 4px; }
</style>
</head>
<body>
<pre><code id="code"></code></pre>
<script>
  (function () {
    var el = document.getElementById('code');
    el.textContent = ${safe};
    try {
      var lang = ${lang};
      if (lang && hljs.getLanguage(lang)) {
        el.innerHTML = hljs.highlight(${safe}, { language: lang }).value;
      } else {
        el.innerHTML = hljs.highlightAuto(${safe}).value;
      }
    } catch (e) {}
    function report() {
      var h = Math.ceil(document.body.getBoundingClientRect().height);
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

export default function CodeRenderer({ code, language }: CodeRendererProps) {
  const webviewRef = useRef<WebView>(null);
  const [height, setHeight] = useState(80);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const html = buildHtml(code, language ?? '');

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

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.langBar}>
        <Text style={styles.langLabel}>{language ? language.toLowerCase() : 'code'}</Text>
        <Pressable onPress={handleCopy} style={styles.copyBtn} hitSlop={8}>
          {copied ? (
            <View style={styles.copyRow}>
              <IconCheck size={14} color="#1F9D55" />
              <Text style={[styles.copyText, { color: '#1F9D55' }]}>Copied</Text>
            </View>
          ) : (
            <View style={styles.copyRow}>
              <IconCopy size={14} color="#8B8BA0" />
              <Text style={styles.copyText}>Copy</Text>
            </View>
          )}
        </Pressable>
      </View>
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
        scrollEnabled
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
    borderRadius: radii.md,
    backgroundColor: '#1E1E2A',
  },
  langBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langLabel: {
    color: '#8B8BA0',
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  copyBtn: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    color: '#8B8BA0',
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.xs,
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
