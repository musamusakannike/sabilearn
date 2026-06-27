import { useState, useRef, type ReactNode } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography, spacing, radius, fontSize } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  containerStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  helper,
  iconLeft,
  iconRight,
  containerStyle,
  secureTextEntry,
  multiline,
  ...props
}: InputProps) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const borderProgress = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    borderProgress.value = withTiming(1, { duration: 200 });
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setFocused(false);
    borderProgress.value = withTiming(0, { duration: 200 });
    props.onBlur?.({} as any);
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? c.danger
      : interpolateColor(
          borderProgress.value,
          [0, 1],
          [c.border, c.accent]
        );
    return { borderColor };
  });

  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: error ? c.danger : c.textSecondary, fontFamily: typography.body.medium },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <AnimatedView
        style={[
          styles.inputContainer,
          { backgroundColor: c.bgSecondary },
          animatedBorderStyle,
        ]}
      >
        {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
        <TextInput
          ref={inputRef}
          {...props}
          multiline={multiline}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={c.textMuted}
          style={[
            styles.input,
            {
              color: c.textPrimary,
              fontFamily: typography.body.regular,
            },
            multiline && { textAlignVertical: 'top', paddingTop: spacing.md },
            iconLeft && { paddingLeft: 0 },
            (iconRight || isPassword) && { paddingRight: 0 },
          ]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.iconRight}
            hitSlop={8}
          >
            {showPassword ? (
              <EyeOff size={18} color={c.textMuted} strokeWidth={1.5} />
            ) : (
              <Eye size={18} color={c.textMuted} strokeWidth={1.5} />
            )}
          </Pressable>
        ) : iconRight ? (
          <View style={styles.iconRight}>{iconRight}</View>
        ) : null}
      </AnimatedView>
      {error ? (
        <Text style={[styles.helper, { color: c.danger, fontFamily: typography.body.regular }]}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: c.textMuted, fontFamily: typography.body.regular }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs + 2,
  },
  label: {
    fontSize: fontSize.xs,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: spacing.md,
    letterSpacing: -0.1,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  helper: {
    fontSize: fontSize['2xs'],
    marginLeft: spacing.xs,
  },
});
