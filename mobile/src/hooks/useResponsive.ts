import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTabletOnly: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isDesktop = width >= 1100;
  const isTabletOnly = width >= 768 && width < 1100;
  const isTablet = width >= 768;
  const isMobile = width < 768;

  return {
    isMobile,
    isTablet,
    isTabletOnly,
    isDesktop,
    width,
    height,
  };
}
