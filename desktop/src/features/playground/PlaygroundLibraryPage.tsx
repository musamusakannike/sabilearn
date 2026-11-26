import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBrandHtml5,
  IconBrandPython,
  IconCopy,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, Modal } from '@/components/ui';
import { usePlaygroundStore } from '@/stores/playground.store';
import { PlaygroundKind, PlaygroundProject } from '@/lib/types';

export function PlaygroundLibraryPage() {
  const navigate = useNavigate();
  const { projects, syncing, hydrate, syncNow, createProject, duplicateProject, deleteProject, updateProject } =
    usePlaygroundStore();

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newKind, setNewKind] = useState<PlaygroundKind>('python');
  const [newName, setNewName] = useState('');

  const [renameTarget, setRenameTarget] = useState<PlaygroundProject | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PlaygroundProject | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.kind.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const handleCreate = async () => {
    const created = await createProject(newKind, newName);
    setCreateOpen(false);
    setNewName('');
    navigate(`/playground/${created.localId}`);
  };

  return (
    <div className="max-w-[1120px] mx-auto p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Code Playground</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)]">
            Local-first Web (HTML/CSS/JS) and Python projects synced with your account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={syncing}
            icon={<IconRefresh size={15} />}
            onClick={() => void syncNow()}
          >
            Sync
          </Button>
          <Button icon={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
            New Project
          </Button>
        </div>
      </div>

      <div className="max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          leftIcon={<IconSearch size={15} />}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          mascot
          title={projects.length === 0 ? 'No playground projects yet' : 'No matching projects'}
          description="Create a Python or Web project to code, preview live, and export files."
          action={
            <Button icon={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
              Create First Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((proj) => (
            <Card
              key={proj.localId}
              interactive
              onClick={() => navigate(`/playground/${proj.localId}`)}
              className="flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 ${
                      proj.kind === 'python'
                        ? 'bg-[var(--brand-ai-soft)] text-[var(--brand-ai)]'
                        : 'bg-[var(--brand-primary-soft)] text-[var(--text-primary)]'
                    }`}
                  >
                    {proj.kind === 'python' ? (
                      <IconBrandPython size={20} />
                    ) : (
                      <IconBrandHtml5 size={20} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[15px] truncate">{proj.name}</h3>
                    <div className="text-[12px] text-[var(--text-tertiary)] capitalize">
                      {proj.kind} · {Object.keys(proj.files).length} file(s)
                    </div>
                  </div>
                </div>
                <Badge variant={proj.syncState === 'synced' ? 'success' : 'warning'}>
                  {proj.syncState || 'local'}
                </Badge>
              </div>

              <div
                className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11.5px] text-[var(--text-tertiary)]">
                  Updated {new Date(proj.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Rename"
                    onClick={() => {
                      setRenameTarget(proj);
                      setRenameValue(proj.name);
                    }}
                    className="p-1.5 rounded hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] cursor-pointer"
                  >
                    <IconEdit size={15} />
                  </button>
                  <button
                    type="button"
                    title="Duplicate"
                    onClick={() => void duplicateProject(proj.localId)}
                    className="p-1.5 rounded hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] cursor-pointer"
                  >
                    <IconCopy size={15} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => setDeleteTarget(proj)}
                    className="p-1.5 rounded hover:bg-[var(--danger-bg)] text-[var(--danger)] cursor-pointer"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Playground Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'python', title: 'Python', desc: 'Runs via Pyodide Web Worker', icon: <IconBrandPython size={22} /> },
              { id: 'web', title: 'Web (HTML/CSS/JS)', desc: 'Live sandboxed preview', icon: <IconBrandHtml5 size={22} /> },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setNewKind(opt.id as PlaygroundKind)}
                className={[
                  'p-4 rounded-[var(--radius-md)] border text-left space-y-1.5 cursor-pointer transition-all',
                  newKind === opt.id
                    ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]'
                    : 'bg-[var(--surface-card)] border-[var(--border-default)] hover:bg-[var(--surface-sunken)]',
                ].join(' ')}
              >
                <div>{opt.icon}</div>
                <div className="font-bold text-[14px]">{opt.title}</div>
                <div className="text-[12px] text-[var(--text-tertiary)]">{opt.desc}</div>
              </button>
            ))}
          </div>

          <Input
            label="Project name"
            autoFocus
            placeholder={newKind === 'python' ? 'Algorithms Practice' : 'Portfolio Landing'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate();
            }}
          />
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (renameTarget && renameValue.trim()) {
                  await updateProject(renameTarget.localId, { name: renameValue.trim() });
                  void syncNow();
                }
                setRenameTarget(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          label="New name"
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteProject(deleteTarget.localId);
          setDeleteTarget(null);
        }}
        title="Delete project?"
        description={`"${deleteTarget?.name || ''}" will be removed from this device and synced.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
