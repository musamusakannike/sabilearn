import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconPlus, IconSearch, IconCode } from '@tabler/icons-react-native';
import { fontFamilies, fontSizes, radii, spacing } from '@/theme';
import { INK, MUTED } from '@/theme/brand';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import GlassIconButton from '@/components/common/GlassIconButton';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import ProjectCard from '@/components/playground/ProjectCard';
import CreateProjectSheet from '@/components/playground/CreateProjectSheet';
import { usePlaygroundStore } from '@/store/playground.store';
import { PlaygroundKind, PlaygroundProject } from '@/lib/types';
import * as haptics from '@/lib/haptics';

export default function PlaygroundLibraryScreen() {
  const insets = useSafeAreaInsets();
  const { projects, hydrate, syncNow, syncing, createProject, duplicateProject, deleteProject, updateProject, lastConflict } =
    usePlaygroundStore();
  console.log("PROJECTS: ", JSON.stringify(projects, null, 2))
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PlaygroundProject | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (lastConflict) {
      Alert.alert('Synced', 'Loaded a newer copy from your account.');
    }
  }, [lastConflict]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const name = p.name || (p.kind === 'python' ? 'Untitled python' : 'Untitled web');
      return name.toLowerCase().includes(q) || p.kind.includes(q);
    });
  }, [projects, query]);

  const onCreate = async (kind: PlaygroundKind, name: string) => {
    setCreateOpen(false);
    const project = await createProject(kind, name);
    router.push(`/playground/${project.localId}`);
  };

  const openMenu = (project: PlaygroundProject) => {
    haptics.light();
    const projName = project.name || (project.kind === 'python' ? 'Untitled python' : 'Untitled web');
    Alert.alert(projName, undefined, [
      {
        text: 'Rename',
        onPress: () => {
          setRenameTarget(project);
          setRenameValue(projName);
        },
      },
      {
        text: 'Duplicate',
        onPress: async () => {
          const copy = await duplicateProject(project.localId);
          if (copy) router.push(`/playground/${copy.localId}`);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete project', `Delete “${projName}”? This cannot be undone on this device.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                haptics.warning();
                void deleteProject(project.localId);
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onRefresh = useCallback(() => {
    haptics.light();
    void syncNow();
  }, [syncNow]);

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      <View style={[styles.headerPad, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader
          title="Playground"
          subtitle="Write and run HTML, CSS, JS and Python."
          showBack
          onBack={() => router.back()}
          right={
            <GlassIconButton onPress={() => setCreateOpen(true)} accessibilityLabel="New project">
              <IconPlus size={22} color={INK} />
            </GlassIconButton>
          }
        />
        <View style={styles.search}>
          <IconSearch size={18} color={MUTED} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search projects"
            placeholderTextColor={MUTED}
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.localId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<IconCode size={36} color={MUTED} />}
            title="No projects yet"
            description="Create a web page or a Python file and it will save on this device and your account."
            action={
              <Button onPress={() => setCreateOpen(true)} style={{ marginTop: spacing.md }}>
                Create your first project
              </Button>
            }
          />
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => router.push(`/playground/${item.localId}`)}
            onMenu={() => openMenu(item)}
          />
        )}
      />

      <CreateProjectSheet visible={createOpen} onClose={() => setCreateOpen(false)} onCreate={onCreate} />

      <Modal visible={!!renameTarget} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <Pressable style={styles.modalBg} onPress={() => setRenameTarget(null)}>
          <Pressable style={styles.renameCard} onPress={() => {}}>
            <Text style={styles.renameTitle}>Rename project</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.renameInput}
              autoFocus
              maxLength={80}
            />
            <Button
              onPress={() => {
                if (renameTarget && renameValue.trim()) {
                  void updateProject(renameTarget.localId, { name: renameValue.trim() });
                  void syncNow();
                }
                setRenameTarget(null);
              }}
              fullWidth
            >
              Save name
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerPad: { paddingHorizontal: spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F5F3EE',
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontFamily: fontFamilies.sans, fontSize: fontSizes.base, color: INK, paddingVertical: 6 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
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
});
