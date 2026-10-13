import { Pressable, View } from 'react-native';
import { SaveButton } from '@/components/SaveButton';
import { AppText, Button, Card, Chip, Icon } from '@/components/ui';
import type { Tts } from '@/hooks/useTts';
import { useTheme } from '@/theme';
import type { Phrase } from '@/types';

const REGISTER_TONE = { neutral: 'neutral', formal: 'info', informal: 'warn' } as const;

// One phrase: what it means, an example, and the three things to do with it (save, listen, practise).
export function PhraseCard({ phrase, categoryId, tts, onPractice, isNew = false }: { phrase: Phrase; categoryId: string; tts: Tts; onPractice: (phrase: Phrase) => void; isNew?: boolean }) {
  const { colors } = useTheme();
  const speakId = `phrase-${phrase.text}`;
  const speaking = tts.speakingId === speakId;
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label={phrase.level} />
        <Chip label={phrase.register} tone={REGISTER_TONE[phrase.register] ?? 'neutral'} />
        {isNew ? <Chip label="New" tone="success" /> : null}
      </View>

      <View style={{ gap: 3 }}>
        <AppText variant="heading" accessibilityRole="header">{phrase.text}</AppText>
        {phrase.translation ? <AppText weight="700" color="primaryText">{phrase.translation}</AppText> : null}
        <AppText color="text2">{phrase.usage}</AppText>
      </View>

      <View style={{ borderLeftWidth: 4, borderLeftColor: colors.primary + '66', paddingLeft: 12 }}>
        <AppText style={{ fontStyle: 'italic' }}>“{phrase.example}”</AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 }}>
        <SaveButton
          item={{ kind: 'phrase', text: phrase.text, meaning: phrase.usage, translation: phrase.translation ?? '', example: phrase.example, category: categoryId, source: 'phrasebank' }}
        />
        <Pressable
          onPress={() => tts.speak(speakId, phrase.example)}
          accessibilityRole="button"
          accessibilityLabel={`Listen to the example for “${phrase.text}”`}
          accessibilityState={{ selected: speaking }}
          style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: speaking ? colors.primary : colors.chipBg }}
        >
          <Icon name="volume-high" size={18} color={speaking ? '#fff' : colors.text2} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Button title="Practise" icon="barbell" size="sm" onPress={() => onPractice(phrase)} />
      </View>
    </Card>
  );
}
