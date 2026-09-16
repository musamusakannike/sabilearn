import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconCode, IconTerminal2, IconX } from '@tabler/icons-react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { INK, MUTED, ACCENT, AI } from '@/theme/brand';
import Button from '@/components/ui/Button';
import { PlaygroundKind } from '@/lib/types';
import * as haptics from '@/lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (kind: PlaygroundKind, name: string) => void;
}

export default function CreateProjectSheet({ visible, onClose, onCreate }: Props) {
  const [kind, setKind] = useState<PlaygroundKind>('web');
  const [name, setName] = useState('');

  const submit = () => {
    haptics.medium();
    const fallback = kind === 'python' ? 'Untitled python' : 'Untitled web';
    onCreate(kind, name.trim() || fallback);
    setName('');
    setKind('web');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>New project</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <IconX size={22} color={INK} />
            </Pressable>
          </View>
          <Text style={styles.hint}>Choose a template, give it a name, and start coding.</Text>

          <View style={styles.tiles}>
            <Pressable
              onPress={() => {
                haptics.selection();
                setKind('web');
              }}
              style={[styles.tile, kind === 'web' && styles.tileOn]}
            >
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,138,30,0.16)' }]}>
                <IconCode size={22} color={ACCENT} />
              </View>
              <Text style={styles.tileTitle}>Web page</Text>
              <Text style={styles.tileSub}>HTML, CSS, JavaScript with live preview</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                haptics.selection();
                setKind('python');
              }}
              style={[styles.tile, kind === 'python' && styles.tileOn]}
            >
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(91,79,232,0.14)' }]}>
                <IconTerminal2 size={22} color={AI} />
              </View>
              <Text style={styles.tileTitle}>Python</Text>
              <Text style={styles.tileSub}>Run Python in-app with a console</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Project name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={kind === 'python' ? 'Untitled python' : 'Untitled web'}
            placeholderTextColor={MUTED}
            style={styles.input}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Button onPress={submit} fullWidth>
            Create project
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(14,14,26,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DEDAD0',
    marginBottom: spacing.xs,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fontFamilies.sansBold, fontSize: fontSizes.xl, color: INK },
  hint: { fontFamily: fontFamilies.sans, fontSize: fontSizes.sm, color: MUTED },
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E8E8EE',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tileOn: { borderColor: ACCENT, backgroundColor: 'rgba(255,138,30,0.06)' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.base, color: INK },
  tileSub: { fontFamily: fontFamilies.sans, fontSize: fontSizes.xs, color: MUTED },
  label: { fontFamily: fontFamilies.sansMedium, fontSize: fontSizes.sm, color: INK },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8EE',
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    color: INK,
  },
});
