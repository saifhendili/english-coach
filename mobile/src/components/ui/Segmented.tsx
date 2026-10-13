import * as Haptics from 'expo-haptics';
import { Platform, Pressable, View } from 'react-native';
import { RADIUS, useTheme } from '@/theme';
import { AppText } from './Text';

type Option<T extends string> = { value: T; label: string };

// A row of choices where one is selected (Discover | Favourites, All | Phrases | Words...).
export function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.chipBg, borderRadius: RADIUS.lg, padding: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on && Platform.OS === 'ios') void Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: on ? colors.card : 'transparent' }}
          >
            <AppText variant="small" weight="700" color={on ? 'primaryText' : 'text2'}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
