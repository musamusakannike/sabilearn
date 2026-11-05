import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamilies } from '@/theme';

/** Warm wash + binary motif so Liquid Glass has something to refract. */
export default function ScreenBackdrop() {
  return (
    <View
      pointerEvents="none"
      aria-hidden={true}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <LinearGradient
        colors={['#FFF7EE', '#FFFFFF', '#F6F3FF']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        aria-hidden={true}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
        style={styles.binaryBackdrop}
      >
        <Text selectable={false} style={styles.binaryText}>0 0 1 0 0 1 0 1 0 0 0 1 1 0 1 0 0</Text>
        <Text selectable={false} style={styles.binaryText}>1 0 0 1 0 1 1 0 0 1 1 0 1 0 1 0 0 1</Text>
        <Text selectable={false} style={styles.binaryText}>0 1 0 1 0 0 0 1 1 0 1 0 0 1 0 1 1 0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  binaryBackdrop: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    opacity: 0.12,
    alignItems: 'center',
  },
  binaryText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    color: '#35354A',
    letterSpacing: 6,
    lineHeight: 18,
  },
});
