import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import CodeEditor, { CodeEditorSyntaxStyles, type CodeEditorStyleType } from '@rivascva/react-native-code-editor';
import { IconPlayerPlay, IconDots } from '@tabler/icons-react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { INK, MUTED } from '@/theme/brand';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import GlassIconButton from '@/components/common/GlassIconButton';
import GlassSurface from '@/components/ui/GlassSurface';
import FileTabs from '@/components/playground/FileTabs';
import WebPreview from '@/components/playground/WebPreview';
import PythonConsole from '@/components/playground/PythonConsole';
import PyodideRuntime, { PyodideRuntimeHandle } from '@/components/playground/PyodideRuntime';
import { usePlaygroundStore } from '@/store/playground.store';
import { loadProjects } from '@/lib/playgroundStorage';
import { defaultFiles, fileLanguage, PYTHON_FILES, STARTERS, WEB_FILES } from '@/lib/playgroundTemplates';
import { PlaygroundProject } from '@/lib/types';
import * as haptics from '@/lib/haptics';

type Pane = 'code' | 'output';

const editorStyle: CodeEditorStyleType = {
  fontSize: 14,
  inputLineHeight: 20,
  highlighterLineHeight: 20,
  padding: 12,
};

export default function PlaygroundIdeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const pyodideRef = useRef<PyodideRuntimeHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filesRef = useRef<Record<string, string>>({});
  const { updateProject, deleteProject, duplicateProject, syncNow, lastConflict } = usePlaygroundStore();

  const [project, setProject] = useState<PlaygroundProject | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState('index.html');
  const [pane, setPane] = useState<Pane>('code');
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [pythonStatus, setPythonStatus] = useState('Ready');
  const [running, setRunning] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const all = await loadProjects();
      const found = all.find((p) => p.localId === id && !p.deletedAt);
      if (!found) {
        Alert.alert('Missing project', 'This project is no longer on this device.', [
          { text: 'OK', onPress: () => router.replace('/playground') },
        ]);
        return;
      }
      setProject(found);
      setFiles(found.files);
      filesRef.current = found.files;
      setActiveFile(found.kind === 'python' ? 'main.py' : 'index.html');
      setRenameValue(found.name);
    })();
  }, [id]);

  useEffect(() => {
    if (lastConflict) {
      Alert.alert('Synced', 'Loaded a newer copy from your account.');
    }
  }, [lastConflict]);

  const persist = useCallback(
    (nextFiles: Record<string, string>, name?: string) => {
      if (!id) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void updateProject(id, { files: nextFiles, name });
        setDirty(true);
      }, 800);
    },
    [id, updateProject]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const localId = id;
      if (localId) {
        void usePlaygroundStore.getState().updateProject(localId, { files: filesRef.current });
      }
      void usePlaygroundStore.getState().syncNow();
    };
  }, [id]);

  const fileList = project?.kind === 'python' ? [...PYTHON_FILES] : [...WEB_FILES];

  const onChangeCode = (value: string) => {
    const next = { ...filesRef.current, [activeFile]: value };
    filesRef.current = next;
    setFiles(next);
    persist(next);
  };

  const run = () => {
    haptics.medium();
    if (project?.kind === 'python') {
      setRunning(true);
      setPane('output');
      setStdout('');
      setStderr('');
      pyodideRef.current?.run(files['main.py'] || '');
    } else {
      setPane('output');
    }
  };

  const resetFile = () => {
    const starter = STARTERS[activeFile] ?? (defaultFiles(project?.kind || 'web')[activeFile] || '');
    const next = { ...filesRef.current, [activeFile]: starter };
    filesRef.current = next;
    setFiles(next);
    persist(next);
  };

  const openMenu = () => {
    Alert.alert(project?.name || 'Project', undefined, [
      { text: 'Rename', onPress: () => setRenameOpen(true) },
      {
        text: 'Duplicate',
        onPress: async () => {
          if (!id) return;
          const copy = await duplicateProject(id);
          if (copy) router.replace(`/playground/${copy.localId}`);
        },
      },
      { text: 'Reset this file', onPress: resetFile },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete project', 'Delete this project?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                if (!id) return;
                await deleteProject(id);
                router.replace('/playground');
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const previewHtml = files['index.html'] || '';
  const previewCss = files['styles.css'] || '';
  const previewJs = files['script.js'] || '';

  const language = fileLanguage(activeFile);
  const showOutput = pane === 'output' && !keyboardUp;

  const editor = useMemo(
    () => (
      <CodeEditor
        key={activeFile}
        style={editorStyle}
        language={language}
        syntaxStyle={CodeEditorSyntaxStyles.atomOneLight as typeof CodeEditorSyntaxStyles}
        showLineNumbers
        initialValue={files[activeFile] || ''}
        onChange={onChangeCode}
        autoFocus={false}
      />
    ),
    // remount on file switch so initialValue applies
    [activeFile, language]
  );

  if (!project) {
    return (
      <View style={styles.container}>
        <ScreenBackdrop />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenBackdrop />
      <View style={[styles.headerPad, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader
          title={project.name}
          subtitle={dirty ? 'Saved on device · pending sync' : project.syncState === 'synced' ? 'Synced' : 'On this device'}
          showBack
          onBack={() => router.back()}
          right={
            <View style={styles.headerActions}>
              <GlassIconButton onPress={run} accessibilityLabel="Run">
                <IconPlayerPlay size={20} color={INK} />
              </GlassIconButton>
              <GlassIconButton onPress={openMenu} accessibilityLabel="Project options">
                <IconDots size={20} color={INK} />
              </GlassIconButton>
            </View>
          }
        />
        <FileTabs files={fileList} active={activeFile} onChange={setActiveFile} />
        <View style={styles.viewSwitch}>
          <Pressable onPress={() => setPane('code')} style={[styles.switchBtn, pane === 'code' && styles.switchOn]}>
            <Text style={[styles.switchLabel, pane === 'code' && styles.switchLabelOn]}>Code</Text>
          </Pressable>
          <Pressable
            onPress={() => setPane('output')}
            style={[styles.switchBtn, pane === 'output' && styles.switchOn]}
          >
            <Text style={[styles.switchLabel, pane === 'output' && styles.switchLabelOn]}>
              {project.kind === 'python' ? 'Output' : 'Preview'}
            </Text>
          </Pressable>
        </View>
      </View>

      <GlassSurface style={styles.workspace} tintColor="rgba(255,255,255,0.45)">
        {(pane === 'code' || keyboardUp) && <View style={styles.editorPane}>{editor}</View>}
        {showOutput && project.kind === 'web' && (
          <WebPreview html={previewHtml} css={previewCss} js={previewJs} />
        )}
        {showOutput && project.kind === 'python' && (
          <View style={{ flex: 1 }}>
            <Text style={styles.pyStatus}>{running ? 'Running…' : pythonStatus}</Text>
            <PythonConsole stdout={stdout} stderr={stderr} />
          </View>
        )}
      </GlassSurface>

      {project.kind === 'python' && (
        <PyodideRuntime
          ref={pyodideRef}
          onStatus={(state) => {
            if (state === 'loading') setPythonStatus('Loading Python runtime…');
            if (state === 'running') setPythonStatus('Running…');
          }}
          onReady={() => setPythonStatus('Ready')}
          onResult={(result) => {
            setRunning(false);
            setStdout(result.stdout);
            setStderr(result.stderr);
            setPythonStatus(result.ok ? 'Finished' : 'Error');
          }}
        />
      )}

      <Modal visible={renameOpen} transparent animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setRenameOpen(false)}>
          <Pressable style={styles.renameCard} onPress={() => {}}>
            <Text style={styles.renameTitle}>Rename project</Text>
            <TextInput value={renameValue} onChangeText={setRenameValue} style={styles.renameInput} autoFocus maxLength={80} />
            <Pressable
              style={styles.saveName}
              onPress={() => {
                const next = renameValue.trim();
                if (next && id) {
                  setProject({ ...project, name: next });
                  void updateProject(id, { name: next });
                  void syncNow();
                }
                setRenameOpen(false);
              }}
            >
              <Text style={styles.saveNameText}>Save name</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerPad: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  viewSwitch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#ECE8DF',
    padding: 3,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  switchBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radii.sm },
  switchOn: { backgroundColor: '#fff' },
  switchLabel: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.xs, color: MUTED },
  switchLabelOn: { color: INK },
  workspace: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  editorPane: { flex: 1, minHeight: 180 },
  pyStatus: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.xs,
    color: MUTED,
    marginBottom: spacing.sm,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(14,14,26,0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  renameCard: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  renameTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.lg, color: INK },
  renameInput: {
    borderWidth: 1,
    borderColor: '#E8E8EE',
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: INK,
  },
  saveName: {
    backgroundColor: '#F2A900',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveNameText: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.base, color: INK },
});
