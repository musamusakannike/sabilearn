import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, fontFamilies, fontSizes, spacing } from '@/theme';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {icon}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text> : null}
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.sansSemiBold,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  description: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.sans,
    textAlign: 'center',
  },
});
