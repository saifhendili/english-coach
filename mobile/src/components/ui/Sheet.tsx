import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Icon } from './Icon';

// A panel that slides up from the bottom (word meanings, practice drills...).
export function Sheet({ visible, onClose, children, label }: { visible: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      {/* With the keyboard up, the panel rises above it instead of being covered. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: colors.overlay }} />
        <View
          accessibilityLabel={label}
          style={{ maxHeight: '88%', backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 10, paddingBottom: insets.bottom + 12 }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 6 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} style={{ position: 'absolute', right: 18, top: 18, zIndex: 2 }}>
            <Icon name="close" size={24} color="muted" />
          </Pressable>
          <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 10, gap: 14 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
