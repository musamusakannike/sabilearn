import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface PagerViewOnPageSelectedEvent {
  nativeEvent: {
    position: number;
  };
}

export interface PagerViewOnPageScrollEvent {
  nativeEvent: {
    position: number;
    offset: number;
  };
}

export interface PagerViewProps {
  initialPage?: number;
  onPageSelected?: (e: PagerViewOnPageSelectedEvent) => void;
  onPageScroll?: (e: PagerViewOnPageScrollEvent) => void;
  onPageScrollStateChanged?: (e: { nativeEvent: { pageScrollState: 'idle' | 'dragging' | 'settling' } }) => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  scrollEnabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  overScrollMode?: 'auto' | 'always' | 'never';
}

export interface PagerViewRef {
  setPage: (selectedPage: number) => void;
  setPageWithoutAnimation: (selectedPage: number) => void;
  setScrollEnabled: (scrollEnabled: boolean) => void;
}

const PagerView = forwardRef<PagerViewRef, PagerViewProps>(function PagerView(
  { initialPage = 0, onPageSelected, style, children },
  ref
) {
  const [activePage, setActivePage] = useState(initialPage);

  const selectPage = useCallback(
    (page: number) => {
      setActivePage(page);
      onPageSelected?.({ nativeEvent: { position: page } });
    },
    [onPageSelected]
  );

  useImperativeHandle(
    ref,
    () => ({
      setPage: (page: number) => selectPage(page),
      setPageWithoutAnimation: (page: number) => selectPage(page),
      setScrollEnabled: () => {},
    }),
    [selectPage]
  );

  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={[
            styles.pageWrapper,
            { display: index === activePage ? 'flex' : 'none' },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  pageWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default PagerView;
