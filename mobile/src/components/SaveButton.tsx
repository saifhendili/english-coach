import * as Haptics from 'expo-haptics';
import { Platform, Pressable } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import { useSaved } from '@/hooks/useSaved';
import { useTheme } from '@/theme';
import type { SaveInput } from '@/types';

// Saves a word or phrase to the learner's collection. Every instance shares the same saved list, so the button
// reads "Saved" everywhere at once.
export function SaveButton({ item, compact = false }: { item: SaveInput; compact?: boolean }) {
  const { colors } = useTheme();
  const saved = useSaved();
  const on = saved.isSaved(item.kind, item.text);
  const label = on ? `Saved. Tap to remove “${item.text}”` : `Save “${item.text}”`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        if (Platform.OS === 'ios') void Haptics.impactAsync(on ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
        saved.toggle(item);
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: compact ? 38 : undefined,
        height: compact ? 38 : 40,
        paddingHorizontal: compact ? 0 : 14,
        borderRadius: 13,
        backgroundColor: on ? colors.successSoft : colors.chipBg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name={on ? 'bookmark' : 'bookmark-outline'} size={18} color={on ? colors.successText : colors.text2} />
      {!compact ? (
        <AppText variant="small" weight="700" style={{ color: on ? colors.successText : colors.text2 }}>
          {on ? 'Saved' : 'Save'}
        </AppText>
      ) : null}
    </Pressable>
  );
}
