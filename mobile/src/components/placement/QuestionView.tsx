import { useCallback } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { VoiceButton, VoiceStatus } from '@/components/VoiceButton';
import { AppText, Button, Card, ErrorBanner, Icon } from '@/components/ui';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { SKILLS } from '@/lib/skills';
import { FONT, useTheme } from '@/theme';
import type { PlacementAnswer, PlacementView } from '@/types';

const LETTERS = ['A', 'B', 'C', 'D'];

// Turns "She ____ to school" into text with a visible gap.
function Prompt({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <AppText variant="heading" style={{ lineHeight: 30 }}>
      {text.split(/(_{2,})/).map((part, i) =>
        /^_{2,}$/.test(part) ? (
          <AppText key={i} variant="heading" accessibilityLabel="blank" style={{ color: colors.primary, backgroundColor: colors.primarySoft }}>{'\u00a0'.repeat(10)}</AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function AnswerBox({ value, onChange, placeholder, minHeight, label, editable = true }: { value: string; onChange: (v: string) => void; placeholder: string; minHeight: number; label: string; editable?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        multiline
        maxLength={1500}
        editable={editable}
        style={{ minHeight, textAlignVertical: 'top', borderRadius: 20, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text, fontFamily: FONT['500'], fontSize: 16, lineHeight: 24, padding: 16 }}
      />
      <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>{countWords(value)} words</AppText>
    </View>
  );
}

function Speaking({ text, setText }: { text: string; setText: (v: string | ((p: string) => string)) => void }) {
  // What is said is appended to the box, so it can be edited before sending.
  const append = useCallback((phrase: string) => setText((prev) => `${prev ? `${prev} ` : ''}${phrase}`), [setText]);
  const voice = useVoiceInput({ onText: append });
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <VoiceButton voice={voice} size={76} />
      <VoiceStatus voice={voice} />
      <View style={{ alignSelf: 'stretch' }}>
        <AnswerBox value={text} onChange={setText} label="What you said" placeholder={voice.listening ? 'Recording…' : 'Tap the mic and speak, or type your answer. You can edit it before sending.'} minHeight={128} editable={!voice.busy} />
      </View>
    </View>
  );
}

function Choices({ options, answer, onPick }: { options: string[]; answer: number | null; onPick: (i: number) => void }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Answer options" style={{ gap: 12 }}>
      {options.map((option, i) => {
        const on = answer === i;
        return (
          <Pressable
            key={i}
            onPress={() => onPick(i)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${LETTERS[i]}. ${option}`}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, borderWidth: 2, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card, opacity: pressed ? 0.85 : 1 })}
          >
            <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : colors.chipBg }}>
              <AppText variant="small" weight="800" style={{ color: on ? '#fff' : colors.text2 }}>{LETTERS[i]}</AppText>
            </View>
            <AppText style={{ flex: 1 }}>{option}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

type Props = {
  view: PlacementView;
  answer: number | string | null;
  setAnswer: (v: number | string | null | ((p: string) => string)) => void;
  error: Error | null;
  onSubmit: (payload: PlacementAnswer) => void;
  onSkip: () => void;
  onFinishEarly: () => void;
};

export function QuestionView({ view, answer, setAnswer, error, onSubmit, onSkip, onFinishEarly }: Props) {
  const { colors } = useTheme();
  const q = view.question;
  if (!q) return null;
  const skill = SKILLS[q.type];
  const productive = !q.options;
  const ready = productive ? typeof answer === 'string' && answer.trim().length > 0 : typeof answer === 'number';
  const pct = Math.round((view.answered / view.maxQuestions) * 100);
  const text = typeof answer === 'string' ? answer : '';

  const submit = () => onSubmit(productive ? { text: text.trim() } : { choiceIndex: answer as number });

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.primarySoft }}>
            <Icon name={skill.icon} size={13} color="primaryText" />
            <AppText variant="caption" weight="700" color="primaryText">{skill.label}</AppText>
          </View>
          <AppText variant="small" weight="700" color="text2">
            Question {view.answered + 1} <AppText variant="small" color="muted">of up to {view.maxQuestions}</AppText>
          </AppText>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel="Test progress" accessibilityValue={{ min: 0, max: view.maxQuestions, now: view.answered }} style={{ height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${Math.max(pct, 4)}%`, borderRadius: 5, backgroundColor: colors.primary }} />
        </View>
      </View>

      {q.passage ? (
        <Card style={{ gap: 8, backgroundColor: colors.successSoft, borderColor: colors.success + '33' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="book" size={15} color="successText" />
            <AppText variant="caption" weight="800" color="successText" style={{ letterSpacing: 1 }}>READ THE TEXT</AppText>
          </View>
          <AppText>{q.passage}</AppText>
        </Card>
      ) : null}

      <Prompt text={q.prompt} />

      {q.options ? (
        <Choices options={q.options} answer={typeof answer === 'number' ? answer : null} onPick={setAnswer} />
      ) : q.type === 'speaking' ? (
        <Speaking text={text} setText={setAnswer as (v: string | ((p: string) => string)) => void} />
      ) : (
        <AnswerBox value={text} onChange={setAnswer as (v: string) => void} label="Your answer" placeholder="Write your answer here…" minHeight={176} />
      )}

      <ErrorBanner error={error} />

      <View style={{ gap: 12 }}>
        <Button title="Continue" trailingIcon="arrow-forward" size="lg" full disabled={!ready} onPress={submit} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={10}>
            <AppText variant="small" weight="700" color="text2">I don’t know</AppText>
          </Pressable>
          {view.canFinishEarly ? (
            <Pressable onPress={onFinishEarly} accessibilityRole="button" hitSlop={10}>
              <AppText variant="small" weight="700" color="primaryText">Finish now</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
