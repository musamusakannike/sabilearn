import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBolt,
  IconDownload,
  IconExternalLink,
  IconKeyboard,
  IconLogout,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { Badge, Button, Card, ConfirmDialog, Input, Switch } from '@/components/ui';
import { DEFAULT_SETTINGS, useAuthStore } from '@/stores/auth.store';
import { ThemeMode, useUiStore } from '@/stores/ui.store';
import { clearOfflineCache, getCacheSizeBytes } from '@/lib/offlineSync';
import {
  desktopNotifications,
  desktopUpdater,
  isTauri,
  openExternalUrl,
  pickFiles,
  secureStore,
  type UpdateInfo,
} from '@/platform';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, updateSettings, uploadAvatar, logout, deleteAccount } = useAuthStore();
  const {
    theme,
    setTheme,
    soundEffects,
    setSoundEffects,
    closeToTray,
    setCloseToTray,
    setShortcutsOpen,
    toast,
  } = useUiStore();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cacheBytes, setCacheBytes] = useState<number>(0);

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [clearCacheConfirm, setClearCacheConfirm] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    void getCacheSizeBytes().then(setCacheBytes);
  }, []);

  const settings = { ...DEFAULT_SETTINGS, ...user?.settings };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
    setSavingProfile(false);
    if (res.success) {
      toast({ title: 'Profile updated', variant: 'success' });
    } else {
      toast({ title: 'Update failed', description: res.error, variant: 'danger' });
    }
  };

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file', variant: 'warning' });
      return;
    }
    setUploadingAvatar(true);
    const res = await uploadAvatar(file);
    setUploadingAvatar(false);
    if (res.success) {
      toast({ title: 'Avatar updated', variant: 'success' });
    } else {
      toast({ title: 'Upload failed', description: res.error, variant: 'danger' });
    }
  };

  const handlePickAvatar = async () => {
    const picked = await pickFiles({
      title: 'Select profile photo',
      extensions: ['png', 'jpg', 'jpeg', 'webp'],
    });
    if (picked[0]) await handleAvatarFile(picked[0].file);
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    const info = await desktopUpdater.check();
    setUpdateInfo(info);
    setCheckingUpdate(false);
    if (!info.available) {
      toast({ title: 'You are up to date', description: 'SabiLearn Desktop v0.1.0 is current.' });
    }
  };

  const reminderTimeValue = `${String(settings.reminderHour ?? 19).padStart(2, '0')}:${String(
    settings.reminderMinute ?? 0
  ).padStart(2, '0')}`;

  return (
    <div className="max-w-[780px] mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold">Settings</h1>
          <p className="text-[13.5px] text-[var(--text-tertiary)]">
            Manage your profile, theme, reminders, offline storage, and desktop preferences.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<IconBolt size={15} />}
          onClick={() => navigate('/subscribe')}
        >
          Subscription
        </Button>
      </div>

      {/* Profile */}
      <Card className="space-y-4">
        <h2 className="text-[15.5px] font-bold">Profile</h2>
        <div className="flex items-center gap-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void handleAvatarFile(f);
            }}
            className="w-16 h-16 rounded-full bg-[var(--brand-primary-soft)] border border-[var(--border-default)] overflow-hidden flex items-center justify-center shrink-0 font-bold text-[20px]"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user?.firstName || user?.name || 'S').charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-[14px]">{user?.email}</div>
            <Button
              variant="secondary"
              size="sm"
              loading={uploadingAvatar}
              icon={<IconUpload size={14} />}
              onClick={() => void handlePickAvatar()}
            >
              Change Photo (or drop image)
            </Button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" loading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Appearance & Desktop */}
      <Card className="space-y-4">
        <h2 className="text-[15.5px] font-bold">Appearance & Desktop</h2>
        <div>
          <span className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
            Theme
          </span>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTheme(m)}
                className={[
                  'py-2 px-3 rounded-[var(--radius-sm)] border text-[13px] font-semibold capitalize cursor-pointer',
                  theme === m
                    ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]'
                    : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]',
                ].join(' ')}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Switch
          label="Subtle completion sound effects"
          description="Play a soft chime when completing lessons (off by default)."
          checked={soundEffects}
          onChange={setSoundEffects}
        />

        <Switch
          label="Close to system tray"
          description="Keep SabiLearn running in the tray for reminders when closing the window."
          checked={closeToTray}
          onChange={setCloseToTray}
        />

        <div className="pt-1">
          <Button
            variant="secondary"
            size="sm"
            icon={<IconKeyboard size={15} />}
            onClick={() => setShortcutsOpen(true)}
          >
            View Keyboard Shortcuts (?)
          </Button>
        </div>
      </Card>

      {/* Notifications & Study Reminders */}
      <Card className="space-y-4">
        <h2 className="text-[15.5px] font-bold">Notifications & Reminders</h2>
        <Switch
          label="Daily study reminder"
          description="Send a native desktop notification at your chosen reminder time."
          checked={!!settings.studyReminders}
          onChange={async (checked) => {
            if (checked) await desktopNotifications.ensurePermission();
            await updateSettings({
              studyReminders: checked,
              timezoneOffset: -new Date().getTimezoneOffset(),
            });
          }}
        />
        <Switch
          label="Streak-risk alerts"
          description="Remind me in the evening if my study streak is about to break."
          checked={settings.streakAlerts !== false}
          onChange={(checked) => void updateSettings({ streakAlerts: checked })}
        />
        <Switch
          label="Email notifications"
          checked={!!settings.emailNotifications}
          onChange={(checked) => void updateSettings({ emailNotifications: checked })}
        />
        <Switch
          label="Weekly progress digest"
          checked={!!settings.weeklyProgress}
          onChange={(checked) => void updateSettings({ weeklyProgress: checked })}
        />

        <div className="flex items-center justify-between gap-4 pt-1">
          <div>
            <div className="text-[14px] font-medium">Reminder time</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">
              Honored exactly by the desktop reminder scheduler.
            </div>
          </div>
          <input
            type="time"
            aria-label="Daily reminder time"
            value={reminderTimeValue}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number);
              if (!Number.isNaN(h) && !Number.isNaN(m)) {
                void updateSettings({
                  reminderHour: h,
                  reminderMinute: m,
                  timezoneOffset: -new Date().getTimezoneOffset(),
                });
              }
            }}
            className="h-9 px-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-default)] font-mono text-[13.5px]"
          />
        </div>
      </Card>

      {/* Offline & Storage */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15.5px] font-bold">Offline & Local Storage</h2>
            <p className="text-[12.5px] text-[var(--text-tertiary)]">
              Cached courses & API data: <strong>{formatBytes(cacheBytes)}</strong> (2 starter
              courses are always bundled).
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setClearCacheConfirm(true)}>
            Clear Cache
          </Button>
        </div>
        {secureStore.isDevFallback() && (
          <Badge variant="warning">Browser dev mode: token stored in localStorage (OS keychain in Tauri)</Badge>
        )}
      </Card>

      {/* About & Updates */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-bold">About & Updates</h2>
            <p className="text-[12.5px] text-[var(--text-tertiary)]">
              SabiLearn Desktop v0.1.0 · {isTauri() ? 'Native Desktop Runtime' : 'Browser Preview Mode'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={checkingUpdate}
            icon={<IconDownload size={15} />}
            onClick={() => void handleCheckUpdates()}
          >
            Check for Updates
          </Button>
        </div>

        {updateInfo?.available && (
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--brand-primary-soft)]/50 border border-[var(--brand-primary)] flex items-center justify-between gap-3">
            <div className="text-[13px]">
              <strong>Version {updateInfo.version} is available</strong>
            </div>
            <Button
              size="sm"
              loading={installingUpdate}
              onClick={async () => {
                setInstallingUpdate(true);
                await desktopUpdater.downloadAndInstall();
                setInstallingUpdate(false);
              }}
            >
              Download & Restart
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4 pt-1 text-[13px]">
          <button
            type="button"
            onClick={() => void openExternalUrl('https://sabilearn.online/privacy')}
            className="inline-flex items-center gap-1 text-[var(--text-link)] hover:underline cursor-pointer"
          >
            Privacy Policy <IconExternalLink size={13} />
          </button>
          <button
            type="button"
            onClick={() => void openExternalUrl('https://sabilearn.online/terms')}
            className="inline-flex items-center gap-1 text-[var(--text-link)] hover:underline cursor-pointer"
          >
            Terms of Service <IconExternalLink size={13} />
          </button>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="flex flex-wrap items-center justify-between gap-3 border-[var(--danger)]/40">
        <Button
          variant="secondary"
          icon={<IconLogout size={16} />}
          onClick={() => setLogoutConfirm(true)}
        >
          Sign Out
        </Button>
        <Button
          variant="danger"
          icon={<IconTrash size={16} />}
          onClick={() => setDeleteConfirm(true)}
        >
          Delete Account
        </Button>
      </Card>

      <ConfirmDialog
        open={clearCacheConfirm}
        onClose={() => setClearCacheConfirm(false)}
        onConfirm={async () => {
          await clearOfflineCache();
          setCacheBytes(0);
          setClearCacheConfirm(false);
          toast({ title: 'Offline cache cleared', variant: 'success' });
        }}
        title="Clear offline cache?"
        description="Downloaded courses and cached API data will be removed. Your 2 bundled starter courses remain available."
        confirmLabel="Clear Cache"
      />

      <ConfirmDialog
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={async () => {
          setLogoutConfirm(false);
          await logout();
          navigate('/login', { replace: true });
        }}
        title="Sign out of SabiLearn?"
        description="Your secure session token will be removed from this device."
        confirmLabel="Sign Out"
      />

      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={async () => {
          const res = await deleteAccount();
          setDeleteConfirm(false);
          if (res.success) {
            navigate('/login', { replace: true });
          } else {
            toast({ title: 'Delete failed', description: res.error, variant: 'danger' });
          }
        }}
        title="Permanently delete account?"
        description="This action cannot be undone. All your progress, XP, and AI courses will be permanently deleted."
        confirmLabel="Delete Permanently"
        destructive
      />
    </div>
  );
}
