import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, View } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import type { VoiceInput } from '@/hooks/useVoiceInput';
import { clock } from '@/lib/voice';
import { useTheme } from '@/theme';

// The microphone button: tap to start, tap again to stop. `size` is the diameter.
export function VoiceButton({ voice, size = 48, disabled = false }: { voice: VoiceInput; size?: number; disabled?: boolean }) {
  const { colors } = useTheme();
  const [pulse] = useState(() => new Animated.Value(0));

  // A soft ring pulses while recording.
  useEffect(() => {
    if (!voice.listening) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [voice.listening, pulse]);

  const label = voice.transcribing ? 'Turning your voice into text' : voice.listening ? 'Stop recording' : 'Speak instead of typing';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: voice.transcribing, selected: voice.listening }}
      disabled={disabled || voice.transcribing}
      onPress={() => {
        if (Platform.OS === 'ios') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        voice.toggle();
      }}
      style={{ width: size, height: size, opacity: disabled ? 0.5 : 1 }}
    >
      {voice.listening ? (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0, borderRadius: size / 2, backgroundColor: '#f43f5e', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }] }}
        />
      ) : null}
      <View style={{ flex: 1, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: voice.listening ? '#f43f5e' : colors.chipBg }}>
        {voice.transcribing ? <ActivityIndicator color={colors.primary} /> : <Icon name={voice.listening ? 'stop' : 'mic'} size={size * 0.46} color={voice.listening ? '#fff' : colors.text2} />}
      </View>
    </Pressable>
  );
}

// What the voice input is doing, or why it failed, as one line (read out by VoiceOver).
export function VoiceStatus({ voice }: { voice: VoiceInput }) {
  let text: string | null = null;
  let color: 'danger' | 'muted' | 'text2' = 'text2';
  if (voice.error) {
    text = voice.error;
    color = 'danger';
  } else if (voice.transcribing) {
    text = 'Turning your voice into text…';
  } else if (voice.listening) {
    text = `Recording ${clock(voice.seconds)}. Tap the square when you are done.`;
  }
  if (!text) return null;
  return (
    <AppText variant="caption" color={color === 'danger' ? 'dangerText' : 'text2'} accessibilityLiveRegion="polite" accessibilityRole={voice.error ? 'alert' : undefined} style={{ paddingHorizontal: 6 }}>
      {text}
    </AppText>
  );
}
