import { Pressable, View } from 'react-native';
import { SaveButton } from '@/components/SaveButton';
import { AppText, Icon } from '@/components/ui';
import type { Tts } from '@/hooks/useTts';
import { useTheme } from '@/theme';
import type { PhraseUpgrade } from '@/types';

// "Sound more natural": a common expression that would improve what the learner said.
export function PhraseUpgradeCard({ phrase, tts, sessionId }: { phrase: PhraseUpgrade; tts: Tts; sessionId?: string }) {
  const { colors } = useTheme();
  const id = `upgrade-${phrase.better}`;
  const speaking = tts.speakingId === id;
  return (
    <View style={{ marginTop: 8, padding: 14, borderRadius: 20, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '33', gap: 4 }} accessibilityLabel="Sound more natural">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="sparkles" size={14} color="primaryText" />
        <AppText variant="caption" weight="800" color="primaryText" style={{ letterSpacing: 0.8 }}>SOUND MORE NATURAL</AppText>
      </View>
      {phrase.said ? <AppText variant="small" color="muted" style={{ textDecorationLine: 'line-through' }}>{phrase.said}</AppText> : null}
      <AppText variant="subhead">{phrase.better}</AppText>
      <AppText variant="small" color="text2">{phrase.why}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <SaveButton item={{ kind: 'phrase', text: phrase.better, meaning: phrase.why, source: 'chat', sessionId }} />
        <Pressable
          onPress={() => tts.speak(id, phrase.better)}
          accessibilityRole="button"
          accessibilityLabel={`Listen to ${phrase.better}`}
          style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: speaking ? colors.primary : colors.chipBg }}
        >
          <Icon name="volume-high" size={18} color={speaking ? '#fff' : colors.text2} />
        </Pressable>
      </View>
    </View>
  );
}
