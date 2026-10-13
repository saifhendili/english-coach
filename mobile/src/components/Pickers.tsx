import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Icon, Sheet } from '@/components/ui';
import { RADIUS, useTheme } from '@/theme';

export type Option = { value: string; label: string; note?: string };

// A labelled row showing the current choice; tapping it opens a list to pick from.
export function PickerField({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="small" weight="700" color="text2">{label}</AppText>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? value}. Tap to change`}
        style={{ minHeight: 50, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <AppText weight="600" style={{ flex: 1 }} numberOfLines={1}>{current?.label ?? value}</AppText>
        <Icon name="chevron-down" size={18} color="muted" />
      </Pressable>
      {current?.note ? <AppText variant="caption" color="muted">{current.note}</AppText> : null}

      <Sheet visible={open} onClose={() => setOpen(false)} label={label}>
        <AppText variant="heading">{label}</AppText>
        <View style={{ gap: 8 }}>
          {options.map((o) => {
            const on = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={{ borderRadius: RADIUS.lg, borderWidth: 2, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : 'transparent', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText weight="700">{o.label}</AppText>
                  {o.note ? <AppText variant="small" color="text2">{o.note}</AppText> : null}
                </View>
                {on ? <Icon name="checkmark-circle" size={22} color="primary" /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}
