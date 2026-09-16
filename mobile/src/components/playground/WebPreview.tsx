import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { radii } from '@/theme';

interface Props {
  html: string;
  css: string;
  js: string;
}

export default function WebPreview({ html, css, js }: Props) {
  const webviewRef = useRef<WebView>(null);
  const ready = useRef(false);

  const send = () => {
    webviewRef.current?.postMessage(JSON.stringify({ type: 'preview', html, css, js }));
  };

  useEffect(() => {
    if (ready.current) send();
  }, [html, css, js]);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webviewRef}
        source={require('../../../assets/playground/web-preview.html')}
        onLoadEnd={() => {
          ready.current = true;
          send();
        }}
        originWhitelist={['*']}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: radii.md, overflow: 'hidden', backgroundColor: '#fff' },
  web: { flex: 1, backgroundColor: '#fff' },
});
