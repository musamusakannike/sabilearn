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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconCheck, IconAlertTriangle } from '@tabler/icons-react-native';
import { authApi } from '@/lib/api';
import { fontFamilies, spacing } from '@/theme';
import OnboardingSpeechBubble from '@/components/auth/OnboardingSpeechBubble';
import AuthHeader from '@/components/auth/AuthHeader';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import * as haptics from '@/lib/haptics';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      haptics.error();
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
      haptics.success();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not send reset email. Please try again.');
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    haptics.light();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Subtle Binary Code Backdrop */}
      <View style={styles.binaryBackdrop} pointerEvents="none">
        <Text style={styles.binaryText}>0 0 1 0 0 1 0 1 0 0 0 1 1 0 1 0 0</Text>
        <Text style={styles.binaryText}>1 0 0 1 0 1 1 0 0 1 1 0 1 0 1 0 0 1</Text>
      </View>

      <ResponsiveContainer maxWidth={520} paddingHorizontal={0} style={{ flex: 1, width: '100%' }}>
        <AuthHeader fallbackRoute="/(auth)/login" />

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
            <OnboardingSpeechBubble
              text={
                sent
                  ? 'Check your inbox! We sent instructions to reset your password.'
                  : 'Forgot your password? Enter your email and we’ll help you reset it.'
              }
            />

            {sent ? (
              <View style={styles.formContainer}>
                <View style={styles.successBox}>
                  <View style={styles.checkCircle}>
                    <IconCheck size={20} color="#16A34A" strokeWidth={2.6} />
                  </View>
                  <View style={styles.successTextWrap}>
                    <Text style={styles.successTitle}>Reset link dispatched</Text>
                    <Text style={styles.successDescription}>
                      If an account exists for <Text style={styles.boldEmail}>{email}</Text>, a reset
                      email with recovery instructions is on its way.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleReturnToLogin}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Return to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formContainer}>
                {/* Error Message */}
                {!!error && (
                  <View style={styles.errorBox}>
                    <IconAlertTriangle size={18} color="#DC2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>Email address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholder="you@example.com"
                    placeholderTextColor="#8E8E9F"
                    style={[styles.input, isFocused && styles.inputFocused]}
                  />
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={isLoading}
                  onPress={handleSubmit}
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0E0E1A" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                {/* Footer Navigation */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Remembered your password? </Text>
                  <Pressable
                    onPress={handleReturnToLogin}
                    style={({ pressed }) => [pressed && styles.pressedOpacity]}
                  >
                    <Text style={styles.footerLink}>Sign in</Text>
                  </Pressable>
                </View>
              </View>
            )}
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
  formContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.base,
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
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: '#DC2626',
    flexShrink: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1.5,
    padding: spacing.base,
    borderRadius: 16,
    marginTop: spacing.xs,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  successTextWrap: {
    flex: 1,
    gap: 4,
  },
  successTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: '#15803D',
    letterSpacing: -0.2,
  },
  successDescription: {
    fontSize: 14,
    fontFamily: fontFamilies.sans,
    color: '#166534',
    lineHeight: 20,
  },
  boldEmail: {
    fontFamily: fontFamilies.sansBold,
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
  inputFocused: {
    borderColor: '#FF8A1E',
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
