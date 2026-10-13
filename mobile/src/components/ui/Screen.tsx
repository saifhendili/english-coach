import { RefreshControl, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type Props = {
  children: React.ReactNode;
  /** Tab screens draw their own header, so they need room for the status bar. Screens under a navigation header do not. */
  top?: boolean;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra space at the bottom, e.g. above a tab bar. */
  bottom?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

// The page: background, safe areas, scrolling, pull to refresh.
export function Screen({ children, top = false, scroll = true, refreshing, onRefresh, contentStyle, bottom = 24, onScroll }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padding = { paddingTop: (top ? insets.top : 0) + 12, paddingBottom: bottom + insets.bottom * 0, paddingHorizontal: 18 };

  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.bg }, padding, contentStyle]}>{children}</View>;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[{ gap: 16 }, padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      onScroll={onScroll}
      scrollEventThrottle={onScroll ? 100 : undefined}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}
