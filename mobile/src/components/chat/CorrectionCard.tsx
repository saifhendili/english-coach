import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Chip, Icon } from '@/components/ui';
import { segments } from '@/lib/markup';
import { MISTAKE_LABEL } from '@/lib/mistakes';
import { useTheme } from '@/theme';
import type { Correction } from '@/types';

// What the coach found in the learner's message: the sentence with the mistakes struck out, the corrected sentence,
// and one short explanation per mistake.
export function CorrectionCard({ original, correction }: { original: string; correction: Correction }) {
  const { colors } = useTheme();

  if (!correction.hasMistakes) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 6 }} accessibilityLabel="No mistakes">
        <Icon name="checkmark-circle" size={15} color="successText" />
        <AppText variant="caption" weight="700" color="successText">No mistakes</AppText>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8, padding: 14, borderRadius: 20, backgroundColor: colors.warnSoft, borderWidth: 1, borderColor: colors.warn + '44', gap: 10 }} accessibilityLabel="Corrections">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="create-outline" size={15} color="warnText" />
        <AppText variant="caption" weight="800" color="warnText" style={{ letterSpacing: 0.8 }}>CORRECTIONS</AppText>
      </View>

      <AppText color="text2">
        {segments(original, correction.items.map((i) => i.wrong)).map((s, i) =>
          s.hit ? (
            <AppText key={i} weight="600" style={{ color: colors.dangerText, backgroundColor: colors.dangerSoft, textDecorationLine: 'line-through' }}>
              {s.text}
            </AppText>
          ) : (
            s.text
          ),
        )}
      </AppText>

      <AppText weight="600">
        {segments(correction.corrected, correction.items.map((i) => i.right)).map((s, i) =>
          s.hit ? (
            <AppText key={i} weight="800" style={{ color: colors.successText, backgroundColor: colors.successSoft }}>
              {s.text}
            </AppText>
          ) : (
            s.text
          ),
        )}
      </AppText>

      <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.warn + '33', paddingTop: 10 }}>
        {correction.items.map((item) => (
          <View key={item.wrong + item.right} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <AppText variant="small" weight="700">
                <AppText variant="small" weight="700" style={{ color: colors.dangerText, textDecorationLine: 'line-through' }}>{item.wrong}</AppText>
                {'  →  '}
                <AppText variant="small" weight="700" style={{ color: colors.successText }}>{item.right}</AppText>
              </AppText>
              <Chip tone="primary" label={MISTAKE_LABEL[item.type] ?? item.type} />
            </View>
            <AppText variant="small" color="text2">{item.explanation}</AppText>
            {item.type === 'tense' ? (
              <Pressable onPress={() => router.push('/grammar')} accessibilityRole="button" accessibilityLabel="Learn and practise the verb tenses" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 2 }}>
                <AppText variant="small" weight="700" color="primaryText">Practise the tenses</AppText>
                <Icon name="arrow-forward" size={14} color="primaryText" />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
