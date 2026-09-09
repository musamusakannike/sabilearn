import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useAppReviewStore } from '@/store/appReview.store';
import { ThemeProvider, useTheme } from '@/theme';
import {
  registerForPushNotifications,
  setupNotificationHandlers,
  scheduleLocalDailyReminder,
  cancelLocalDailyReminder,
} from '@/lib/notifications';
import { syncQueuedSessions } from '@/lib/offlineSync';
import { Image as ExpoImage } from 'expo-image';
import { identifyPurchasesUser } from '@/lib/iap';

SplashScreen.preventAutoHideAsync();

const ONBOARDING_PRELOAD_ASSETS = [
  require('@/assets/images/onboarding/mascot_hero_classroom.webp'),
  require('@/assets/images/onboarding/tutor-mascot.webp'),
];

function AppContent() {
  const { colors } = useTheme();
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  const { user, isAuthenticated, isInitialized, initialize } = useAuthStore();
  const { hasOnboarded, isInitialized: onboardingInitialized, initialize: initOnboarding } = useOnboardingStore();
  const initAppReview = useAppReviewStore((s) => s.initialize);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
    initOnboarding();
    initAppReview();
  }, [initialize, initOnboarding, initAppReview]);

  useEffect(() => {
    if (!hasOnboarded) {
      ONBOARDING_PRELOAD_ASSETS.forEach((asset) => {
        ExpoImage.loadAsync(asset).catch(() => {});
      });
    }
  }, [hasOnboarded]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!isInitialized || !fontsLoaded || !onboardingInitialized) return;

    const isPublicPage = segments[0] === '(auth)' || segments[0] === 'privacy' || segments[0] === 'terms';

    if (!isAuthenticated && !isPublicPage) {
      if (!hasOnboarded) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(auth)/login');
      }
    } else if (isAuthenticated && segments[0] === '(auth)') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, fontsLoaded, onboardingInitialized, hasOnboarded, segments, router]);

  // Push registration happens only after auth — iOS's one-shot permission
  // prompt is too valuable to burn before the user has seen any value.
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      void identifyPurchasesUser(user._id);
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();

    const cleanup = setupNotificationHandlers((mobileRoute) => {
      router.push(mobileRoute as any);
    });
    return cleanup;
  }, [isAuthenticated, router]);

  // Local daily-reminder backstop, tied to the user's notification settings or onboarding prefs.
  useEffect(() => {
    if (!onboardingInitialized) return;

    if (isAuthenticated && user) {
      const settings = user.settings;
      if (settings?.pushNotifications !== false && settings?.studyReminders !== false) {
        scheduleLocalDailyReminder(settings?.reminderHour ?? 19, settings?.reminderMinute ?? 0);
      } else {
        cancelLocalDailyReminder();
      }
    } else if (!isAuthenticated && hasOnboarded) {
      const reminderTime = useOnboardingStore.getState().reminderTime;
      if (reminderTime) {
        let hour24 = reminderTime.hour % 12;
        if (reminderTime.period === 'PM') hour24 += 12;
        scheduleLocalDailyReminder(hour24, reminderTime.minute);
      }
    }
  }, [
    isAuthenticated,
    user?.settings?.reminderHour,
    user?.settings?.reminderMinute,
    user?.settings?.studyReminders,
    user?.settings?.pushNotifications,
    hasOnboarded,
    onboardingInitialized,
  ]);

  useEffect(() => {
    syncQueuedSessions();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncQueuedSessions();
      }
    });
    return () => unsubscribe();
  }, []);

  if (!fontsLoaded || !isInitialized || !onboardingInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="subscribe" />
          <Stack.Screen name="payment-callback" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
