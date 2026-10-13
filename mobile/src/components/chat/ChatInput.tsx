import { Pressable, TextInput, View } from 'react-native';
import { Icon } from '@/components/ui';
import { VoiceButton, VoiceStatus } from '@/components/VoiceButton';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { FONT, useTheme } from '@/theme';

type Props = {
  value: string;
  onChange: (next: string | ((previous: string) => string)) => void;
  onSend: () => void;
  disabled: boolean;
  /** Called when recording starts, so the coach's voice does not get recorded. */
  onVoiceStart?: () => void;
};

// A text box with a mic. What is said is typed into the box, so it can be edited before sending.
export function ChatInput({ value, onChange, onSend, disabled, onVoiceStart }: Props) {
  const { colors } = useTheme();
  const voice = useVoiceInput({ onText: (phrase) => onChange((prev) => `${prev ? `${prev} ` : ''}${phrase}`), onStart: onVoiceStart });
  const canSend = value.trim().length > 0 && !disabled && !voice.busy;

  return (
    <View style={{ gap: 6 }}>
      <VoiceStatus voice={voice} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={voice.listening ? 'Recording…' : 'Write in English…'}
          placeholderTextColor={colors.muted}
          accessibilityLabel="Your message"
          multiline
          maxLength={1200}
          editable={!disabled && !voice.busy}
          autoCapitalize="sentences"
          style={{ flex: 1, minHeight: 48, maxHeight: 130, borderRadius: 24, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text, fontFamily: FONT['500'], fontSize: 16, paddingHorizontal: 18, paddingTop: 13, paddingBottom: 13 }}
        />
        <VoiceButton voice={voice} disabled={disabled} />
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, opacity: canSend ? 1 : 0.4 }}
        >
          <Icon name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
