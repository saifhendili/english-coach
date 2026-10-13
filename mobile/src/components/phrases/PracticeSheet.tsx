import { useCallback, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { SaveButton } from '@/components/SaveButton';
import { VoiceButton, VoiceStatus } from '@/components/VoiceButton';
import { AppText, Button, Chip, ErrorBanner, GradientCard, Icon, Sheet } from '@/components/ui';
import { usePracticePhrase } from '@/hooks/usePhrases';
import type { Tts } from '@/hooks/useTts';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { FONT, useTheme } from '@/theme';

export type PracticeTarget = { text: string; usage?: string };

function Label({ children, color = 'muted' }: { children: string; color?: 'muted' | 'successText' | 'primaryText' }) {
  return <AppText variant="caption" weight="800" color={color} style={{ letterSpacing: 1 }}>{children.toUpperCase()}</AppText>;
}

// A short drill: here is a situation, answer using the phrase, get checked by the coach.
// Mount it only while open, with a `key` per phrase, so each phrase starts from a clean sheet (and no microphone is held
// while it is closed).
export function PracticeSheet({ phrase, situations, categoryId, tts, onClose }: { phrase: PracticeTarget; situations: string[]; categoryId?: string; tts: Tts; onClose: () => void }) {
  const { colors } = useTheme();
  const practice = usePracticePhrase();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * Math.max(situations.length, 1)));
  const [answer, setAnswer] = useState('');

  const append = useCallback((text: string) => setAnswer((prev) => `${prev ? `${prev} ` : ''}${text}`), []);
  const voice = useVoiceInput({ onText: append, onStart: tts.stop });

  const situation = situations[index % situations.length] ?? '';
  const result = practice.data?.result;

  const check = () => {
    if (voice.listening) void voice.stop();
    practice.mutate({ phrase: phrase.text, usage: phrase.usage ?? '', situation, answer: answer.trim() });
  };
  const another = () => {
    practice.reset();
    setAnswer('');
    setIndex((i) => i + 1);
  };

  return (
    <Sheet visible onClose={onClose} label={`Practise ${phrase.text}`}>
      <View style={{ gap: 4, paddingRight: 32 }}>
        <Label color="primaryText">Practise this phrase</Label>
        <AppText variant="title" accessibilityRole="header">{phrase.text}</AppText>
        {phrase.usage ? <AppText variant="small" color="text2">{phrase.usage}</AppText> : null}
      </View>

      <GradientCard style={{ padding: 16, borderRadius: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="caption" weight="800" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 1 }}>YOUR SITUATION</AppText>
            <AppText style={{ color: '#fff' }}>{situation}</AppText>
          </View>
          {situations.length > 1 && !result ? (
            <Pressable onPress={another} accessibilityRole="button" accessibilityLabel="Another situation" style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <Icon name="shuffle" size={18} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </GradientCard>

      {!result ? (
        <View style={{ gap: 10 }}>
          <AppText variant="small" weight="700" color="text2">Answer using “{phrase.text.replace(/[…]+$/, '').trim()}”</AppText>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder={voice.listening ? 'Recording…' : 'Type or speak your answer…'}
            placeholderTextColor={colors.muted}
            accessibilityLabel="Your answer"
            multiline
            maxLength={600}
            editable={!voice.busy}
            style={{ minHeight: 112, textAlignVertical: 'top', borderRadius: 20, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text, fontFamily: FONT['500'], fontSize: 16, lineHeight: 24, padding: 16 }}
          />
          <VoiceStatus voice={voice} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <VoiceButton voice={voice} />
            <Button title={practice.isPending ? 'Checking…' : 'Check my answer'} icon="checkmark" loading={practice.isPending} disabled={!answer.trim() || voice.busy} onPress={check} style={{ flex: 1 }} />
          </View>
          <ErrorBanner error={practice.error} onRetry={check} />
        </View>
      ) : (
        <View style={{ gap: 14 }} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Chip label={result.usedPhrase ? 'You used the phrase' : 'Phrase not used'} icon={result.usedPhrase ? 'checkmark' : 'close'} tone={result.usedPhrase ? 'success' : 'danger'} />
            {result.usedPhrase ? <Chip label={result.natural ? 'Natural' : 'Sounds forced'} icon={result.natural ? 'checkmark' : 'close'} tone={result.natural ? 'success' : 'danger'} /> : null}
            <View style={{ flex: 1 }} />
            <Chip label={`${result.score}/10`} />
          </View>
          <AppText>{result.feedback}</AppText>

          <View style={{ gap: 14, padding: 16, borderRadius: 20, backgroundColor: colors.chipBg }}>
            <View style={{ gap: 2 }}>
              <Label>You said</Label>
              <AppText color="text2">{answer}</AppText>
            </View>
            {result.corrected.trim() !== answer.trim() ? (
              <View style={{ gap: 2 }}>
                <Label color="successText">Corrected</Label>
                <AppText weight="600">{result.corrected}</AppText>
              </View>
            ) : null}
            <View style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Label color="primaryText">Model answer</Label>
                <Pressable onPress={() => tts.speak('model-answer', result.modelAnswer)} accessibilityRole="button" accessibilityLabel="Listen to the model answer" hitSlop={8} style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
                  <Icon name="volume-high" size={14} color="primaryText" />
                </Pressable>
              </View>
              <AppText weight="600">{result.modelAnswer}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <SaveButton item={{ kind: 'phrase', text: phrase.text, meaning: phrase.usage ?? '', example: result.modelAnswer, category: categoryId ?? '', source: 'practice' }} />
            <Button title="Try again" icon="refresh" variant="ghost" size="sm" onPress={() => { practice.reset(); setAnswer(''); }} />
            {situations.length > 1 ? <Button title="New situation" icon="shuffle" size="sm" onPress={another} /> : null}
          </View>
        </View>
      )}
    </Sheet>
  );
}
