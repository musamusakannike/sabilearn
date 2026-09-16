import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface PyodideRuntimeHandle {
  run: (code: string) => void;
  warmup: () => void;
}

interface Props {
  onReady?: () => void;
  onStatus?: (state: string) => void;
  onResult?: (result: { stdout: string; stderr: string; ok: boolean }) => void;
}

const PyodideRuntime = forwardRef<PyodideRuntimeHandle, Props>(function PyodideRuntime(
  { onReady, onStatus, onResult },
  ref
) {
  const webviewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    run: (code: string) => {
      webviewRef.current?.postMessage(JSON.stringify({ type: 'run', code }));
    },
    warmup: () => {
      webviewRef.current?.postMessage(JSON.stringify({ type: 'warmup' }));
    },
  }));

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready' || data.type === 'booted') onReady?.();
      if (data.type === 'status') onStatus?.(data.state);
      if (data.type === 'result') {
        onResult?.({ stdout: data.stdout || '', stderr: data.stderr || '', ok: !!data.ok });
      }
    } catch {
      // ignore
    }
  };

  return (
    <WebView
      ref={webviewRef}
      source={require('../../../assets/playground/pyodide-runtime.html')}
      onMessage={onMessage}
      originWhitelist={['*']}
      javaScriptEnabled
      style={styles.hidden}
      pointerEvents="none"
    />
  );
});

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, right: 0, bottom: 0 },
});

export default PyodideRuntime;
