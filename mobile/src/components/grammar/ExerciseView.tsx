import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, TextInput, View } from 'react-native';
import { AppText, Button, Card, Chip, Icon } from '@/components/ui';
import type { Tts } from '@/hooks/useTts';
import { completedSentence } from '@/lib/tenses';
import { FONT, useTheme } from '@/theme';
import type { Exercise, Response, Verdict } from '@/types';

type Props = {
  exercise: Exercise;
  /** The name of the exercise's tense, shown as a hint (hidden in mixed practice, where finding the tense is the point). */
  tenseName?: string;
  /** The answer so far has been checked: show the verdict and the right answer. */
  verdict: Verdict | null;
  chosen: number | null;
  onChoose: (index: number) => void;
  onSubmit: (response: Response) => void;
  onNext: () => void;
  nextLabel: string;
  tts: Tts;
};

const LETTERS = ['A', 'B', 'C', 'D'];

function Input({ value, onChange, placeholder, label, disabled, onSubmit, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; disabled: boolean; onSubmit: () => void; autoFocus?: boolean }) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onSubmitEditing={onSubmit}
      returnKeyType="done"
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      accessibilityLabel={label}
      editable={!disabled}
      autoFocus={autoFocus}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      style={{ minHeight: 52, borderRadius: 20, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: disabled ? colors.chipBg : colors.inputBg, color: colors.text, fontFamily: FONT['600'], fontSize: 17, paddingHorizontal: 16 }}
    />
  );
}

// The sentence with the blank shown as a gap.
function Prompt({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <AppText variant="heading" style={{ lineHeight: 32 }}>
      {text.split(/(____)/).map((part, i) =>
        part === '____' ? (
          <AppText key={i} variant="heading" accessibilityLabel="blank" style={{ color: colors.primary, backgroundColor: colors.primarySoft }}>
            {'\u00a0'.repeat(10)}
          </AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

export function ExerciseView({ exercise: ex, tenseName, verdict, chosen, onChoose, onSubmit, onNext, nextLabel, tts }: Props) {
  const { colors } = useTheme();
  const checked = verdict !== null;
  const [text, setText] = useState(ex.type === 'fix' ? ex.prompt : '');
  const [past, setPast] = useState('');
  const [participle, setParticiple] = useState('');

  // The result is felt as well as seen.
  useEffect(() => {
    if (verdict && Platform.OS === 'ios') void Haptics.notificationAsync(verdict.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  }, [verdict]);

  const heading =
    ex.type === 'fill' ? 'Complete the sentence' : ex.type === 'choose' ? 'Choose the right words' : ex.type === 'identify' ? 'Which tense is this sentence?' : ex.type === 'fix' ? 'Find the mistake and fix it' : 'Give the other two forms';

  const canCheck =
    ex.type === 'fill' ? text.trim().length > 0 : ex.type === 'fix' ? text.trim().length > 0 && text.trim() !== ex.prompt : ex.type === 'irregular' ? past.trim() !== '' && participle.trim() !== '' : chosen !== null;

  const check = () => {
    if (!canCheck || checked) return;
    Keyboard.dismiss();
    if (ex.type === 'irregular') onSubmit({ past, participle });
    else if (ex.type === 'choose' || ex.type === 'identify') onSubmit(chosen as number);
    else onSubmit(text);
  };

  const sentence = completedSentence(ex);
  const speakId = `ex-${ex.id}`;

  return (
    <Card style={{ gap: 18, padding: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ex.retry ? <Chip label="Second try" tone="warn" /> : null}
        {ex.ai ? <Chip label="AI-written" icon="sparkles" tone="info" /> : null}
        {tenseName && ex.type !== 'identify' ? <Chip label={tenseName} tone="neutral" /> : null}
      </View>

      <AppText variant="small" weight="700" color="text2">{heading}</AppText>

      {ex.type === 'irregular' ? (
        <View style={{ gap: 4 }}>
          <AppText weight="800" style={{ fontSize: 38, lineHeight: 44 }}>{ex.base}</AppText>
          <AppText variant="small" color="text2">{ex.meaning}</AppText>
        </View>
      ) : ex.type === 'identify' ? (
        <AppText variant="heading" style={{ lineHeight: 30 }}>“{ex.prompt}”</AppText>
      ) : ex.type === 'fix' ? (
        <View style={{ padding: 14, borderRadius: 18, backgroundColor: colors.dangerSoft }}>
          <AppText variant="heading" style={{ color: colors.dangerText, lineHeight: 30 }}>{ex.prompt}</AppText>
        </View>
      ) : (
        <Prompt text={ex.prompt} />
      )}

      {/* ---- how to answer ---- */}
      {ex.type === 'fill' ? <Input value={text} onChange={setText} onSubmit={check} disabled={checked} label="Your answer" placeholder="Type the missing words" autoFocus /> : null}
      {ex.type === 'fix' ? <Input value={text} onChange={setText} onSubmit={check} disabled={checked} label="The corrected sentence" placeholder="Type the corrected sentence" /> : null}
      {ex.type === 'irregular' ? (
        <View style={{ gap: 10 }}>
          <Input value={past} onChange={setPast} onSubmit={check} disabled={checked} label="Past simple" placeholder="Past simple (I ___ yesterday)" autoFocus />
          <Input value={participle} onChange={setParticiple} onSubmit={check} disabled={checked} label="Past participle" placeholder="Past participle (I have ___)" />
        </View>
      ) : null}

      {ex.type === 'choose' || ex.type === 'identify' ? (
        <View accessibilityRole="radiogroup" accessibilityLabel="Answer options" style={{ gap: 10 }}>
          {ex.options.map((option, i) => {
            const picked = chosen === i;
            const right = checked && i === ex.correctIndex;
            const wrong = checked && picked && i !== ex.correctIndex;
            const border = right ? colors.success : wrong ? colors.danger : picked ? colors.primary : colors.border;
            const bg = right ? colors.successSoft : wrong ? colors.dangerSoft : picked ? colors.primarySoft : colors.card;
            return (
              <Pressable
                key={i}
                disabled={checked}
                onPress={() => onChoose(i)}
                accessibilityRole="radio"
                accessibilityState={{ checked: picked, disabled: checked }}
                accessibilityLabel={`${LETTERS[i]}. ${option}${right ? '. Correct answer' : wrong ? '. Your answer, not correct' : ''}`}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, borderWidth: 2, borderColor: border, backgroundColor: bg, opacity: pressed ? 0.85 : 1 })}
              >
                <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: right ? colors.success : wrong ? colors.danger : picked ? colors.primary : colors.chipBg }}>
                  {right || wrong ? <Icon name={right ? 'checkmark' : 'close'} size={18} color="#fff" /> : <AppText variant="small" weight="800" style={{ color: picked ? '#fff' : colors.text2 }}>{LETTERS[i]}</AppText>}
                </View>
                <AppText weight="600" style={{ flex: 1 }}>{option}</AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* ---- the verdict ---- */}
      {verdict ? (
        <View accessibilityLiveRegion="polite" style={{ gap: 12 }}>
          <View accessibilityRole="alert" style={{ gap: 6, padding: 14, borderRadius: 18, backgroundColor: verdict.correct ? colors.successSoft : colors.dangerSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={verdict.correct ? 'checkmark-circle' : 'close-circle'} size={22} color={verdict.correct ? colors.successText : colors.dangerText} />
              <AppText weight="800" style={{ color: verdict.correct ? colors.successText : colors.dangerText }}>{verdict.correct ? 'Correct!' : 'Not quite'}</AppText>
            </View>
            {!verdict.correct ? (
              <AppText variant="small" style={{ color: colors.dangerText }}>
                {ex.type === 'irregular' ? 'The forms are: ' : 'The answer is: '}
                <AppText variant="small" weight="800" style={{ color: colors.dangerText }}>{ex.type === 'choose' || ex.type === 'identify' ? verdict.expected : sentence ?? verdict.expected}</AppText>
              </AppText>
            ) : sentence && ex.type !== 'identify' ? (
              <AppText variant="small" style={{ color: colors.successText }}>{sentence}</AppText>
            ) : null}
            {ex.type === 'irregular' && verdict.correct ? <AppText variant="small" style={{ color: colors.successText }}>{verdict.expected}</AppText> : null}
          </View>
          {ex.why ? (
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 4 }}>
              <Icon name="bulb-outline" size={18} color="primary" />
              <AppText variant="small" color="text2" style={{ flex: 1 }}>{ex.why}</AppText>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {sentence || ex.type === 'irregular' ? (
              <Pressable
                onPress={() => tts.speak(speakId, ex.type === 'irregular' ? `${ex.base}, ${ex.past[0]}, ${ex.participle[0]}` : (sentence as string))}
                accessibilityRole="button"
                accessibilityLabel="Listen"
                accessibilityState={{ selected: tts.speakingId === speakId }}
                style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tts.speakingId === speakId ? colors.primary : colors.chipBg }}
              >
                <Icon name="volume-high" size={20} color={tts.speakingId === speakId ? '#fff' : colors.text2} />
              </Pressable>
            ) : null}
            <Button title={nextLabel} trailingIcon="arrow-forward" size="lg" onPress={onNext} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Button title="Check" icon="checkmark" size="lg" full disabled={!canCheck} onPress={check} />
      )}
    </Card>
  );
}
