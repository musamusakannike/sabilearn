import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fontFamilies, spacing } from '@/theme';
import { useOnboardingStore } from '@/store/onboarding.store';
import * as haptics from '@/lib/haptics';

import OnboardingHeader from '@/components/auth/OnboardingHeader';
import OnboardingSpeechBubble from '@/components/auth/OnboardingSpeechBubble';
import OnboardingInterestCard from '@/components/auth/OnboardingInterestCard';
import OnboardingCourseCard from '@/components/auth/OnboardingCourseCard';
import OnboardingGoalCard from '@/components/auth/OnboardingGoalCard';
import OnboardingTimePickerModal from '@/components/auth/OnboardingTimePickerModal';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import {
  GamesIcon,
  AIProjectsIcon,
  WebsitesIcon,
  MobileAppIcon,
  PythonIcon,
  RoboticsIcon,
  DjangoIcon,
  WebDevIcon,
  BlockchainIcon,
  PromptEngineeringIcon,
} from '@/components/auth/OnboardingCourseIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// -------------------------------------------------------------
// Data Definitions (Refined & Paraphrased)
// -------------------------------------------------------------

const INTERESTS = [
  { id: 'games', title: 'Games', subtitle: 'Interactive stories & playable worlds', icon: <GamesIcon size={46} /> },
  { id: 'ai', title: 'AI Projects', subtitle: 'Smart bots, models & neural agents', icon: <AIProjectsIcon size={46} /> },
  { id: 'websites', title: 'Websites', subtitle: 'Sleek web apps & digital platforms', icon: <WebsitesIcon size={46} /> },
  { id: 'mobile', title: 'Mobile App', subtitle: 'Fintech & everyday mobile tools', icon: <MobileAppIcon size={46} /> },
];

const COURSES = [
  { id: 'python', title: 'Python', subtitle: 'Free Track', icon: <PythonIcon size={40} /> },
  { id: 'robotics', title: 'Robotics', subtitle: 'Free Track', icon: <RoboticsIcon size={40} /> },
  { id: 'django', title: 'Django', subtitle: 'Free Track', icon: <DjangoIcon size={40} /> },
  { id: 'web_dev', title: 'Web Development', subtitle: 'Free Track', icon: <WebDevIcon size={40} /> },
  { id: 'blockchain', title: 'Blockchain', subtitle: 'Free Track', icon: <BlockchainIcon size={40} /> },
  { id: 'prompt_engineering', title: 'Prompt Engineering', subtitle: 'Free Track', icon: <PromptEngineeringIcon size={40} /> },
];

const GOALS = [
  {
    minutes: 5,
    title: 'Light • 5 min / day',
    subtitle: 'A swift daily warm-up to keep your learning streak active.',
    isRecommended: false,
  },
  {
    minutes: 10,
    title: 'Steady • 10 min / day',
    subtitle: 'Build real skills with a focused daily brain workout.',
    isRecommended: true,
  },
  {
    minutes: 20,
    title: 'Intensive • 20 min / day',
    subtitle: 'Dive deep and fast-track your path to tech mastery.',
    isRecommended: false,
  },
];

const ONBOARDING_ASSETS = [
  require('@/assets/images/onboarding/mascot_hero_classroom.webp'),
  require('@/assets/images/onboarding/tutor-mascot.webp'),
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Eagerly preheat onboarding image assets into memory
    ONBOARDING_ASSETS.forEach((asset) => {
      Image.loadAsync(asset).catch(() => {});
    });
  }, []);

  const {
    interest,
    starterCourse,
    dailyGoalMinutes,
    reminderTime,
    setInterest,
    setStarterCourse,
    setDailyGoalMinutes,
    setReminderTime,
    completeOnboarding,
  } = useOnboardingStore();

  const handleNext = () => {
    haptics.light();
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    haptics.success();
    await completeOnboarding();
    router.replace('/(auth)/register');
  };

  const handleGoToLogin = () => {
    haptics.light();
    router.push('/(auth)/login');
  };

  // Progress computation (25%, 50%, 75%, 100%)
  const progress = currentStep === 0 ? 0 : currentStep / 4;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ResponsiveContainer maxWidth={600} paddingHorizontal={0} style={{ flex: 1, width: '100%' }}>
        {/* Top Header with Back Button and Progress (Steps 1-4) */}
        {currentStep > 0 && (
          <OnboardingHeader progress={progress} onBack={handleBack} />
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            currentStep === 0 && styles.heroScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ========================================================= */}
          {/* STEP 0: Hero / Intro Screen                               */}
          {/* ========================================================= */}
          {currentStep === 0 && (
            <View style={styles.heroContainer}>
              {/* Subtle binary backdrop pattern */}
              <View style={styles.binaryBackdrop} pointerEvents="none">
                <Text style={styles.binaryText}>0 0 1 0 0 1 0 1 0 0 0 1 1 0 1 0 0</Text>
                <Text style={styles.binaryText}>1 0 0 1 0 1 1 0 0 1 1 0 1 0 1 0 0 1</Text>
                <Text style={styles.binaryText}>0 1 0 1 0 0 0 1 1 0 1 0 0 1 0 1 1 0</Text>
                <Text style={styles.binaryText}>0 0 1 1 0 1 0 0 1 0 1 0 0 0 1 1 0 1</Text>
              </View>

              {/* Hero Classroom Illustration */}
              <View style={styles.heroImageWrapper}>
                <Image
                  source={require('@/assets/images/onboarding/mascot_hero_classroom.webp')}
                  style={styles.heroImage}
                  contentFit="contain"
                  priority="high"
                  cachePolicy="memory-disk"
                  transition={150}
                  recyclingKey="onboarding-mascot-hero"
                />
              </View>

              {/* Headline */}
              <View style={styles.heroHeadlineWrapper}>
                <Text style={styles.heroHeadline}>
                  Over 1 Million young minds mastering code today.
                </Text>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 1: What are you excited to build? (2x2 Grid)         */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <OnboardingSpeechBubble text="What are you excited to build?" />

              <View style={styles.gridContainer}>
                <View style={styles.gridRow}>
                  <OnboardingInterestCard
                    icon={INTERESTS[0].icon}
                    title={INTERESTS[0].title}
                    subtitle={INTERESTS[0].subtitle}
                    selected={interest === INTERESTS[0].id}
                    onSelect={() => setInterest(INTERESTS[0].id)}
                  />
                  <OnboardingInterestCard
                    icon={INTERESTS[1].icon}
                    title={INTERESTS[1].title}
                    subtitle={INTERESTS[1].subtitle}
                    selected={interest === INTERESTS[1].id}
                    onSelect={() => setInterest(INTERESTS[1].id)}
                  />
                </View>

                <View style={styles.gridRow}>
                  <OnboardingInterestCard
                    icon={INTERESTS[2].icon}
                    title={INTERESTS[2].title}
                    subtitle={INTERESTS[2].subtitle}
                    selected={interest === INTERESTS[2].id}
                    onSelect={() => setInterest(INTERESTS[2].id)}
                  />
                  <OnboardingInterestCard
                    icon={INTERESTS[3].icon}
                    title={INTERESTS[3].title}
                    subtitle={INTERESTS[3].subtitle}
                    selected={interest === INTERESTS[3].id}
                    onSelect={() => setInterest(INTERESTS[3].id)}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 2: Select your first learning path (Vertical List)   */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <OnboardingSpeechBubble text="Select your first learning path." />

              <View style={styles.coursesList}>
                {COURSES.map((course) => (
                  <OnboardingCourseCard
                    key={course.id}
                    icon={course.icon}
                    title={course.title}
                    subtitle={course.subtitle}
                    selected={starterCourse === course.id}
                    onSelect={() => setStarterCourse(course.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 3: Daily Commitment Goal                            */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <OnboardingSpeechBubble text="How much time can you practice daily?" />

              <View style={styles.goalsList}>
                {GOALS.map((goal) => (
                  <OnboardingGoalCard
                    key={`goal-${goal.minutes}`}
                    title={goal.title}
                    subtitle={goal.subtitle}
                    isRecommended={goal.isRecommended}
                    selected={dailyGoalMinutes === goal.minutes}
                    onSelect={() => setDailyGoalMinutes(goal.minutes)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 4: Habit & Reminder Time Selector                   */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <OnboardingSpeechBubble text="Lock in your habit with a daily study reminder" />

              <View style={styles.reminderCenterArea}>
                <OnboardingTimePickerModal
                  value={reminderTime}
                  onChange={setReminderTime}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ========================================================= */}
        {/* Bottom Actions Footer                                     */}
        {/* ========================================================= */}
        <View style={styles.footer}>
          {currentStep === 0 ? (
            <View style={styles.heroFooter}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleNext}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>

              <Pressable
                onPress={handleGoToLogin}
                style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              >
                <Text style={styles.linkButtonText}>Already have an account? Sign in</Text>
              </Pressable>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleNext}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {currentStep === 4 ? 'Get Started' : 'Continue'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  heroScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  // Step 0 Styles
  heroContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  binaryBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0.16,
    alignItems: 'center',
    paddingTop: 4,
  },
  binaryText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: '#35354A',
    letterSpacing: 6,
    lineHeight: 18,
  },
  heroImageWrapper: {
    width: '100%',
    height: SCREEN_WIDTH * 0.92,
    maxHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.base,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroHeadlineWrapper: {
    width: '100%',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  heroHeadline: {
    fontSize: 34,
    fontFamily: fontFamilies.sansBold,
    color: '#0E0E1A',
    lineHeight: 42,
    letterSpacing: -0.6,
  },

  // Steps General
  stepContainer: {
    flex: 1,
    paddingTop: spacing.xs,
  },

  // Step 1: 2x2 Grid
  gridContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Step 2: Course List
  coursesList: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },

  // Step 3: Goals List
  goalsList: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },

  // Step 4: Reminder Area
  reminderCenterArea: {
    flex: 1,
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Footer Styles
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  heroFooter: {
    gap: spacing.base,
  },
  primaryButton: {
    backgroundColor: '#FF8A1E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8A1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: '#0E0E1A',
    letterSpacing: -0.2,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  linkButtonPressed: {
    opacity: 0.6,
  },
  linkButtonText: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: '#0E0E1A',
    textAlign: 'center',
  },
});
