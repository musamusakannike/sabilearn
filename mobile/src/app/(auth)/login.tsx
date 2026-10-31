import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconEye, IconEyeOff, IconAlertTriangle } from '@tabler/icons-react-native';
import { useAuthStore } from '@/store/auth.store';
import { fontFamilies, spacing } from '@/theme';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import OnboardingSpeechBubble from '@/components/auth/OnboardingSpeechBubble';
import AuthHeader from '@/components/auth/AuthHeader';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import * as haptics from '@/lib/haptics';

export default function LoginScreen() {
  const { login, loginWithGoogle, loginWithApple } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      haptics.error();
      return;
    }
    setIsLoading(true);
    const result = await login(email.trim(), password);
    setIsLoading(false);
    if (result.success) {
      haptics.success();
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Login failed.');
      haptics.error();
    }
  };

  const handleGoogle = async () => {
    setError('');
    setIsLoading(true);
    const result = await loginWithGoogle();
    setIsLoading(false);
    if (result.success) {
      haptics.success();
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Google sign-in failed.');
      haptics.error();
    }
  };

  const handleApple = async () => {
    setError('');
    setIsLoading(true);
    const result = await loginWithApple();
    setIsLoading(false);
    if (result.success) {
      haptics.success();
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Apple sign-in failed.');
      haptics.error();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Subtle Binary Code Backdrop */}
      <View style={styles.binaryBackdrop} pointerEvents="none">
        <Text style={styles.binaryText}>0 0 1 0 0 1 0 1 0 0 0 1 1 0 1 0 0</Text>
        <Text style={styles.binaryText}>1 0 0 1 0 1 1 0 0 1 1 0 1 0 1 0 0 1</Text>
      </View>

      <ResponsiveContainer maxWidth={520} paddingHorizontal={0} style={{ flex: 1, width: '100%' }}>
        <AuthHeader fallbackRoute="/(auth)/onboarding" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Mascot Speech Bubble */}
            <OnboardingSpeechBubble text="Welcome back! Ready to continue your streak?" />

            {/* Error Message Box */}
            {!!error && (
              <View style={styles.errorBox}>
                <IconAlertTriangle size={18} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholder="you@example.com"
                  placeholderTextColor="#8E8E9F"
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.passwordWrap,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#8E8E9F"
                    style={styles.passwordInput}
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <IconEyeOff size={20} color="#6B6B80" />
                    ) : (
                      <IconEye size={20} color="#6B6B80" />
                    )}
                  </Pressable>
                </View>
              </View>

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable
                  onPress={() => haptics.light()}
                  style={({ pressed }) => [styles.forgotLinkWrap, pressed && styles.pressedOpacity]}
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              </Link>

              {/* Primary Action Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                disabled={isLoading}
                onPress={handleLogin}
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0E0E1A" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Authentication */}
              <SocialAuthButtons
                onGoogle={handleGoogle}
                onApple={handleApple}
                loading={isLoading}
              />

              {/* Footer Navigation */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable
                    onPress={() => haptics.light()}
                    style={({ pressed }) => [pressed && styles.pressedOpacity]}
                  >
                    <Text style={styles.footerLink}>Sign up</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  binaryBackdrop: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    opacity: 0.14,
    alignItems: 'center',
  },
  binaryText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: '#35354A',
    letterSpacing: 6,
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
    borderRadius: 14,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: '#DC2626',
    flexShrink: 1,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.base,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: '#0E0E1A',
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5EB',
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontFamilies.sans,
    color: '#0E0E1A',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5EB',
    borderRadius: 16,
    paddingHorizontal: spacing.base,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fontFamilies.sans,
    color: '#0E0E1A',
  },
  eyeButton: {
    padding: 6,
  },
  inputFocused: {
    borderColor: '#FF8A1E',
  },
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  forgotLink: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: '#0E0E1A',
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
    marginTop: spacing.xs,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: '#0E0E1A',
    letterSpacing: -0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  dividerText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: '#8E8E9F',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerText: {
    fontSize: 15,
    fontFamily: fontFamilies.sans,
    color: '#6B6B80',
  },
  footerLink: {
    fontSize: 15,
    fontFamily: fontFamilies.sansBold,
    color: '#0E0E1A',
  },
  pressedOpacity: {
    opacity: 0.6,
  },
});
