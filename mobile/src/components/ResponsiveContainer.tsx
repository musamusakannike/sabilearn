import React from 'react';
import { StyleSheet, View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

export interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  paddingHorizontal?: number;
}

export function ResponsiveContainer({
  children,
  maxWidth = 1200,
  paddingHorizontal = 24,
  style,
  ...props
}: ResponsiveContainerProps) {
  const { isTablet } = useResponsive();

  if (!isTablet) {
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        style,
        styles.tabletContainer,
        { maxWidth, paddingHorizontal },
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabletContainer: {
    width: '100%',
    alignSelf: 'center',
  },
});
