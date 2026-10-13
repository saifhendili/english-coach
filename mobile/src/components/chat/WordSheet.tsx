import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SaveButton } from '@/components/SaveButton';
import { AppText, Button, ErrorBanner, Icon, Sheet, Spinner } from '@/components/ui';
import { useDictionary, useExplainWord } from '@/hooks/useDictionary';
import type { Tts } from '@/hooks/useTts';
import { useTheme } from '@/theme';

// A panel with the dictionary entry for a tapped word, an "Explain in context" button, and Save.
export function WordSheet({ word, sentence, tts, sessionId, onClose }: { word: string | null; sentence?: string; tts: Tts; sessionId?: string; onClose: () => void }) {
  const { colors } = useTheme();
  const dict = useDictionary(word);
  const explain = useExplainWord();
  const { reset } = explain;

  // A new word: forget the previous one's explanation.
  useEffect(() => reset(), [word, reset]);

  const entry = dict.data;
  const first = entry?.definitions[0];
  const ai = explain.data?.explanation;
  const shown = entry?.word ?? word ?? '';

  return (
    <Sheet visible={Boolean(word)} onClose={onClose} label={`Meaning of ${shown}`}>
      <View style={{ gap: 6, paddingRight: 36 }}>
        <AppText variant="display" accessibilityRole="header">{shown}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {entry?.phonetic ? <AppText color="text2" style={{ fontVariant: ['tabular-nums'] }}>{entry.phonetic}</AppText> : null}
          <Pressable
            onPress={() => tts.speak(`word-${shown}`, shown)}
            accessibilityRole="button"
            accessibilityLabel={`Hear ${shown}`}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}
          >
            <Icon name="volume-high" size={18} color="primaryText" />
          </Pressable>
        </View>
      </View>

      <View style={{ minHeight: 40, gap: 12 }}>
        {dict.isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <AppText variant="small" color="text2">Looking it up…</AppText>
          </View>
        ) : null}
        {dict.isError ? <AppText variant="small" color="dangerText">{dict.error.message}</AppText> : null}
        {dict.isSuccess && !entry ? <AppText variant="small" color="text2">No dictionary entry for “{word}”. You can still save it.</AppText> : null}
        {entry?.definitions.map((d, i) => (
          <View key={i} style={{ gap: 2 }}>
            <AppText>
              <AppText variant="small" weight="700" color="muted" style={{ fontStyle: 'italic' }}>{d.partOfSpeech}  </AppText>
              {d.text}
            </AppText>
            {d.example ? <AppText variant="small" color="text2" style={{ fontStyle: 'italic' }}>“{d.example}”</AppText> : null}
          </View>
        ))}
      </View>

      {ai ? (
        <View style={{ padding: 14, borderRadius: 18, backgroundColor: colors.primarySoft, gap: 4 }} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkles" size={14} color="primaryText" />
            <AppText variant="caption" weight="800" color="primaryText" style={{ letterSpacing: 0.8 }}>IN THIS SENTENCE</AppText>
          </View>
          {ai.translation ? <AppText variant="heading" color="primaryText">{ai.translation}</AppText> : null}
          <AppText>{ai.meaning}</AppText>
          <AppText variant="small" color="text2" style={{ fontStyle: 'italic' }}>“{ai.example}”</AppText>
        </View>
      ) : null}
      <ErrorBanner error={explain.error} onRetry={() => word && explain.mutate({ word, sentence })} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        {/* Saving waits for the dictionary (or the explanation); asking Gemini does not, so a slow dictionary never blocks help. */}
        {dict.isSuccess || dict.isError || ai ? (
          <SaveButton
            item={{
              kind: 'word',
              text: shown,
              meaning: first?.text ?? ai?.meaning ?? '',
              translation: ai?.translation ?? '',
              example: entry?.definitions.find((d) => d.example)?.example ?? ai?.example ?? sentence?.slice(0, 400) ?? '',
              source: 'dictionary',
              sessionId,
            }}
          />
        ) : null}
        {!ai && word ? <Button title="Explain in context" icon="sparkles" variant="soft" size="sm" loading={explain.isPending} onPress={() => explain.mutate({ word, sentence })} /> : null}
      </View>
    </Sheet>
  );
}
