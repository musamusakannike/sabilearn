import { Pressable, Text, View, StyleSheet } from 'react-native';
import { IconTerminal2, IconCode, IconDots } from '@tabler/icons-react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { ACCENT, AI, INK, MUTED } from '@/theme/brand';
import GlassSurface from '@/components/ui/GlassSurface';
import { PlaygroundProject } from '@/lib/types';

interface Props {
  project: PlaygroundProject;
  onPress: () => void;
  onMenu: () => void;
}

function relativeTime(iso: string) {
  const delta = Date.now() - Date.parse(iso);
  const mins = Math.round(delta / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ProjectCard({ project, onPress, onMenu }: Props) {
  const python = project.kind === 'python';
  return (
    <Pressable onPress={onPress} onLongPress={onMenu}>
      <GlassSurface style={styles.card} tintColor="rgba(255,255,255,0.5)" isInteractive>
        <View style={[styles.icon, { backgroundColor: python ? 'rgba(91,79,232,0.14)' : 'rgba(255,138,30,0.16)' }]}>
          {python ? <IconTerminal2 size={20} color={AI} /> : <IconCode size={20} color={ACCENT} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {project.name || (project.kind === 'python' ? 'Untitled python' : 'Untitled web')}
          </Text>
          <Text style={styles.meta}>
            {python ? 'Python' : 'Web'} · {relativeTime(project.updatedAt)}
            {project.syncState === 'pending' ? ' · pending sync' : ''}
            {project.syncState === 'local' ? ' · on device' : ''}
          </Text>
        </View>
        <Pressable onPress={onMenu} hitSlop={12} accessibilityLabel="Project options">
          <IconDots size={18} color={MUTED} />
        </Pressable>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fontFamilies.sansSemiBold, fontSize: fontSizes.base, color: INK },
  meta: { fontFamily: fontFamilies.sans, fontSize: fontSizes.xs, color: MUTED, marginTop: 2 },
});
