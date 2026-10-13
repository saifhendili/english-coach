import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { FONT, RADIUS, useTheme } from '@/theme';
import { Icon } from './Icon';
import { AppText } from './Text';

type Props = TextInputProps & { label?: string; hint?: string; secure?: boolean };

export function TextField({ label, hint, secure, style, ...rest }: Props) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="small" weight="700" color="text2">
          {label}
        </AppText>
      ) : null}
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          secureTextEntry={secure ? hidden : rest.secureTextEntry}
          style={[
            {
              fontFamily: FONT['500'],
              fontSize: 16,
              minHeight: 50,
              borderRadius: RADIUS.lg,
              borderWidth: 1.5,
              borderColor: focused ? colors.primary : colors.inputBorder,
              backgroundColor: colors.inputBg,
              color: colors.text,
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingRight: secure ? 48 : 16,
            },
            style,
          ]}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} hitSlop={10} style={{ position: 'absolute', right: 14 }}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="muted" />
          </Pressable>
        ) : null}
      </View>
      {hint ? (
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
