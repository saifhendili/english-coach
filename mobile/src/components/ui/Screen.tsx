import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
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
  scrollRef?: React.Ref<ScrollView>;
};

// The page: background, safe areas, scrolling, pull to refresh.
export function Screen({ children, top = false, scroll = true, refreshing, onRefresh, contentStyle, bottom = 24, onScroll, scrollRef }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // iOS keeps the home indicator clear by itself (contentInsetAdjustmentBehavior); Android draws behind its navigation bar
  // (edge to edge), so it needs the padding.
  const bottomInset = Platform.OS === 'android' ? insets.bottom : 0;
  const padding = { paddingTop: (top ? insets.top : 0) + 12, paddingBottom: bottom + bottomInset, paddingHorizontal: 18 };

  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.bg }, padding, contentStyle]}>{children}</View>;

  const list = (
    <ScrollView
      ref={scrollRef}
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
  // Android does not shrink the window for the keyboard (edge to edge), so the page makes room itself.
  return Platform.OS === 'android' ? <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>{list}</KeyboardAvoidingView> : list;
}
