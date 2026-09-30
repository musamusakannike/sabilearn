import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconUser, IconCamera, IconShieldCheck, IconFileText, IconChevronRight, IconSparkles, IconDeviceMobile } from '@tabler/icons-react-native';
import { useAuthStore, DEFAULT_SETTINGS } from '@/store/auth.store';
import { ReminderTime } from '@/store/onboarding.store';
import OnboardingTimePickerModal from '@/components/auth/OnboardingTimePickerModal';
import { scheduleLocalDailyReminder, cancelLocalDailyReminder, registerForPushNotifications, requestNotificationPermission } from '@/lib/notifications';
import { useAppReview } from '@/hooks/useAppReview';
import { InReview, ReviewGuard } from '@/components/common/ReviewGuard';
import { fontFamilies, spacing } from '@/theme';
import { ACCENT, INK, MUTED, TINT_GLASS } from '@/theme/brand';
import GlassSurface from '@/components/ui/GlassSurface';
import ScreenBackdrop from '@/components/common/ScreenBackdrop';
import ScreenHeader from '@/components/common/ScreenHeader';
import * as haptics from '@/lib/haptics';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, uploadAvatar, updateProfile, updateSettings, deleteAccount } = useAuthStore();
  const { inReview, os, refresh } = useAppReview();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const settings = { ...DEFAULT_SETTINGS, ...user?.settings };

  const processAndUploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingAvatar(true);
    try {
      const uri = asset.uri;
      const uriParts = uri.split('.');
      const rawExt = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase().split('?')[0] : 'jpg';
      const ext = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(rawExt) ? (rawExt === 'jpeg' ? 'jpg' : rawExt) : 'jpg';
      const mimeType = asset.mimeType || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
      const name = asset.fileName || `avatar_${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name,
        type: mimeType,
      } as any);

      const result = await uploadAvatar(formData);
      if (result.success) {
        haptics.success();
      } else {
        haptics.error();
        Alert.alert('Upload failed', result.error || 'Could not upload your photo. Try again.');
      }
    } catch {
      haptics.error();
      Alert.alert('Upload failed', 'Could not upload your photo. Try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleTakeCameraPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Camera access is required to take a profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await processAndUploadAsset(result.assets[0]);
      }
    } catch {
      Alert.alert('Camera error', 'Could not open camera.');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Photo library access is required to choose a profile photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await processAndUploadAsset(result.assets[0]);
      }
    } catch {
      Alert.alert('Gallery error', 'Could not access photo library.');
    }
  };

  const pickAvatar = () => {
    if (isUploadingAvatar) return;
    haptics.selection();
    Alert.alert('Profile Photo', 'Choose how you want to update your photo.', [
      { text: 'Take Photo', onPress: handleTakeCameraPhoto },
      { text: 'Choose from Library', onPress: handleChooseFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const result = await updateProfile({ firstName, lastName });
    setIsSaving(false);
    if (result.success) haptics.success();
    else Alert.alert('Could not save', result.error);
  };

  const toggleSetting = (key: keyof typeof settings) => async (value: boolean) => {
    haptics.selection();
    const result = await updateSettings({ [key]: value } as any);

    // Daily push / study reminders are opt-in. When the user enables them in
    // Profile > Settings, request OS permission and wire up push + local reminder.
    // Streak alerts (streakAlerts !== false) remain active by default and independent.
    if (result.success) {
      if ((key === 'pushNotifications' || key === 'studyReminders') && value === true) {
        const nextSettings = { ...settings, [key]: value } as typeof settings;
        if (nextSettings.pushNotifications === true && nextSettings.studyReminders === true) {
          const granted = await requestNotificationPermission();
          if (granted) {
            void registerForPushNotifications();
            void scheduleLocalDailyReminder(nextSettings.reminderHour ?? 19, nextSettings.reminderMinute ?? 0);
          }
        } else if (nextSettings.pushNotifications === true) {
          // Push enabled but study reminders still off — just ensure push token for daily opt-in later.
          const granted = await requestNotificationPermission();
          if (granted) void registerForPushNotifications();
        }
      } else if (key === 'streakAlerts' && value === true) {
        const granted = await requestNotificationPermission();
        if (granted) void registerForPushNotifications();
      } else if ((key === 'pushNotifications' && value === false) || (key === 'studyReminders' && value === false)) {
        void cancelLocalDailyReminder();
      }
    }
  };

  const reminderHour24 = settings.reminderHour ?? 19;
  const reminderMinute = settings.reminderMinute ?? 0;
  const reminderPeriod: 'AM' | 'PM' = reminderHour24 >= 12 ? 'PM' : 'AM';
  const reminderHour12 = reminderHour24 % 12 === 0 ? 12 : reminderHour24 % 12;
  const reminderTime: ReminderTime = {
    hour: reminderHour12,
    minute: reminderMinute,
    period: reminderPeriod,
  };

  const handleReminderTimeChange = (newTime: ReminderTime) => {
    let h24 = newTime.hour % 12;
    if (newTime.period === 'PM') h24 += 12;
    void updateSettings({
      reminderHour: h24,
      reminderMinute: newTime.minute,
    });
    // Only reschedule when daily reminders are explicitly opted-in.
    if (settings.pushNotifications === true && settings.studyReminders === true) {
      void scheduleLocalDailyReminder(h24, newTime.minute);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (result.success) router.replace('/(auth)/login');
            else Alert.alert('Could not delete account', result.error);
          },
        },
      ]
    );
  };

  return (
    <View collapsable={false} style={styles.container}>
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Settings" subtitle="Profile, alerts, and account." showBack />

        <Pressable onPress={pickAvatar} disabled={isUploadingAvatar} style={styles.avatarWrap}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <IconUser size={28} color={ACCENT} />
            </View>
          )}
          {isUploadingAvatar ? (
            <View style={styles.avatarLoadingOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.cameraBadge}>
              <IconCamera size={14} color={INK} />
            </View>
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>Profile</Text>
        <GlassSurface style={styles.sectionCard} tintColor={TINT_GLASS}>
          <View style={styles.field}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFocused('first')}
              onBlur={() => setFocused(null)}
              style={[styles.input, focused === 'first' && styles.inputFocused]}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setFocused('last')}
              onBlur={() => setFocused(null)}
              style={[styles.input, focused === 'last' && styles.inputFocused]}
            />
          </View>
          <Pressable
            onPress={saveProfile}
            disabled={isSaving}
            style={({ pressed }) => [styles.primaryBtn, (pressed || isSaving) && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryBtnText}>{isSaving ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>
        </GlassSurface>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <GlassSurface style={styles.sectionCard} tintColor={TINT_GLASS}>
          <SettingRow label="Push notifications" value={!!settings.pushNotifications} onChange={toggleSetting('pushNotifications')} />
          <SettingRow label="Study reminders" value={!!settings.studyReminders} onChange={toggleSetting('studyReminders')} />
          {!!settings.studyReminders && (
            <View style={[styles.settingRow, styles.settingRowBorder, { paddingVertical: spacing.xs }]}>
              <Text style={styles.settingLabel}>Daily reminder time</Text>
              <OnboardingTimePickerModal
                value={reminderTime}
                onChange={handleReminderTimeChange}
                label=""
                modalTitle="Set Daily Reminder Time"
                compact
              />
            </View>
          )}
          <SettingRow label="Streak alerts" value={!!settings.streakAlerts} onChange={toggleSetting('streakAlerts')} />
          <SettingRow label="Email notifications" value={!!settings.emailNotifications} onChange={toggleSetting('emailNotifications')} />
          <SettingRow label="Weekly progress email" value={!!settings.weeklyProgress} onChange={toggleSetting('weeklyProgress')} last />
        </GlassSurface>

        <Text style={styles.sectionTitle}>Legal & Privacy</Text>
        <View style={{ gap: spacing.sm }}>
          <Pressable onPress={() => router.push('/privacy')} style={({ pressed }) => [pressed && styles.pressed]}>
            <GlassSurface style={styles.linkRow} isInteractive tintColor={TINT_GLASS}>
              <IconShieldCheck size={18} color={INK} />
              <Text style={styles.linkLabel}>Privacy Policy</Text>
              <IconChevronRight size={16} color={MUTED} />
            </GlassSurface>
          </Pressable>
          <Pressable onPress={() => router.push('/terms')} style={({ pressed }) => [pressed && styles.pressed]}>
            <GlassSurface style={styles.linkRow} isInteractive tintColor={TINT_GLASS}>
              <IconFileText size={18} color={INK} />
              <Text style={styles.linkLabel}>Terms of Service</Text>
              <IconChevronRight size={16} color={MUTED} />
            </GlassSurface>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: '#E5484D' }]}>Danger zone</Text>
        <Pressable onPress={handleDeleteAccount} style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.deleteBtnText}>Delete account</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.settingRowBorder]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#E8E8EE', true: ACCENT }} thumbColor="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  reviewBanner: {
    borderRadius: 18,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,138,30,0.3)',
    gap: spacing.xs,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,138,30,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reviewBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    color: '#D97706',
    letterSpacing: 0.5,
  },
  reviewRefreshText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    color: ACCENT,
  },
  reviewBodyText: {
    fontSize: 12,
    fontFamily: fontFamilies.sans,
    color: INK,
    lineHeight: 16,
  },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,138,30,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fontFamilies.sansBold,
    color: INK,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionCard: { borderRadius: 20, padding: spacing.base, overflow: 'hidden', gap: spacing.md },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: fontFamilies.sansBold, color: INK, letterSpacing: -0.2 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5EB',
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontFamilies.sans,
    color: INK,
  },
  inputFocused: { borderColor: ACCENT },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 17, fontFamily: fontFamilies.sansBold, color: INK, letterSpacing: -0.2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  settingRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8E8EE' },
  settingLabel: { fontSize: 16, fontFamily: fontFamilies.sans, color: INK, flex: 1, paddingRight: spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.base, borderRadius: 18, overflow: 'hidden' },
  linkLabel: { flex: 1, fontSize: 16, fontFamily: fontFamilies.sansMedium, color: INK },
  deleteBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5484D',
  },
  deleteBtnText: { fontSize: 16, fontFamily: fontFamilies.sansBold, color: '#E5484D' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
