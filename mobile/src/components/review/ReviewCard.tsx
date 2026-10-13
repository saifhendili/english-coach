import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { AppText, Button, Card, Chip, Icon } from '@/components/ui';
import type { Tts } from '@/hooks/useTts';
import { MISTAKE_LABEL } from '@/lib/mistakes';
import { segments } from '@/lib/markup';
import { cardMode, clozeParts, matchesAnswer, RATINGS, suggestedRating } from '@/lib/review';
import { FONT, useTheme } from '@/theme';
import type { ReviewCardData, ReviewRating } from '@/types';

const KIND_LABEL = { word: 'Word', phrase: 'Phrase', mistake: 'Mistake' } as const;

function Listen({ id, text, tts }: { id: string; text: string; tts: Tts }) {
  const { colors } = useTheme();
  const on = tts.speakingId === id;
  return (
    <Pressable onPress={() => tts.speak(id, text)} accessibilityRole="button" accessibilityLabel="Listen" accessibilityState={{ selected: on }} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : colors.chipBg }}>
      <Icon name="volume-high" size={19} color={on ? '#fff' : colors.text2} />
    </Pressable>
  );
}

function Verdict({ correct, typed, target }: { correct: boolean; typed: string; target: string }) {
  const { colors } = useTheme();
  const fg = correct ? colors.successText : colors.dangerText;
  return (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 18, backgroundColor: correct ? colors.successSoft : colors.dangerSoft }}>
      <Icon name={correct ? 'checkmark-circle' : 'close-circle'} size={20} color={fg} />
      <AppText variant="small" style={{ flex: 1, color: fg }}>
        {correct ? (
          <AppText variant="small" weight="800" style={{ color: fg }}>Right.</AppText>
        ) : (
          <>
            <AppText variant="small" weight="800" style={{ color: fg }}>Not quite. </AppText>
            You wrote “{typed}”. The answer is “{target}”.
          </>
        )}
      </AppText>
    </View>
  );
}

function Blank({ revealed, children }: { revealed: boolean; children: string }) {
  const { colors } = useTheme();
  return revealed ? (
    <AppText weight="800" style={{ color: colors.successText, backgroundColor: colors.successSoft }}>{children}</AppText>
  ) : (
    <AppText weight="800" style={{ color: colors.primary, backgroundColor: colors.primarySoft }} accessibilityLabel="blank">{'______'}</AppText>
  );
}

// One card: question, answer, then the four rating buttons.
export function ReviewCard({ card, onRate, busy, tts }: { card: ReviewCardData; onRate: (rating: ReviewRating | null) => void; busy: boolean; tts: Tts }) {
  const { colors } = useTheme();
  const mode = cardMode(card);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);

  const target = (mode === 'mistake' ? card.right : card.text) ?? '';
  const typedAnswer = mode !== 'recall' && typed.trim() ? typed.trim() : null;
  const correct = typedAnswer ? matchesAnswer(typedAnswer, target) : null;
  const suggested = correct === null ? null : suggestedRating(correct);
  const cloze = mode === 'cloze' ? clozeParts(card.example, card.text) : null;

  const reveal = () => setRevealed(true);
  // A "second try" card was already scheduled: moving on sends nothing.
  const rate = (value: ReviewRating) => onRate(card.retry ? null : value);

  return (
    <Card style={{ gap: 18, padding: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label={KIND_LABEL[card.type]} />
        {card.isNew && !card.retry ? <Chip label="New" tone="success" /> : null}
        {card.retry ? <Chip label="Second try" tone="warn" /> : null}
        {mode === 'mistake' && card.errorType ? <Chip label={MISTAKE_LABEL[card.errorType] ?? card.errorType} tone="neutral" /> : null}
      </View>

      {/* ---- the question ---- */}
      {mode === 'cloze' && cloze ? (
        <View style={{ gap: 10 }}>
          <AppText variant="small" weight="700" color="text2">What is missing?</AppText>
          <AppText variant="heading" style={{ lineHeight: 30 }}>
            {cloze.before}
            <Blank revealed={revealed}>{cloze.match}</Blank>
            {cloze.after}
          </AppText>
          {card.translation || card.meaning ? (
            <AppText variant="small" color="text2">
              <AppText variant="small" weight="800" color="primaryText">Hint: </AppText>
              {card.translation || card.meaning}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {mode === 'recall' ? (
        <View style={{ gap: 8 }}>
          <AppText variant="small" weight="700" color="text2">What does this mean?</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AppText variant="display" style={{ flex: 1, fontSize: 30, lineHeight: 36 }}>{card.text}</AppText>
            <Listen id={`card-${card.id}`} text={card.text ?? ''} tts={tts} />
          </View>
        </View>
      ) : null}

      {mode === 'mistake' ? (
        <View style={{ gap: 10 }}>
          <AppText variant="small" weight="700" color="text2">You wrote this. Fix the marked part.</AppText>
          <AppText variant="heading" style={{ lineHeight: 30 }}>
            {card.sentence
              ? segments(card.sentence, [card.wrong]).map((s, i) =>
                  s.hit ? (
                    <AppText key={i} weight="800" style={{ color: colors.dangerText, backgroundColor: colors.dangerSoft, textDecorationLine: revealed ? 'line-through' : 'none' }}>
                      {s.text}
                    </AppText>
                  ) : (
                    s.text
                  ),
                )
              : card.wrong}
          </AppText>
        </View>
      ) : null}

      {!revealed && mode !== 'recall' ? (
        <TextInput
          value={typed}
          onChangeText={setTyped}
          onSubmitEditing={reveal}
          returnKeyType="done"
          placeholder={mode === 'mistake' ? 'Type the corrected version…' : 'Type the missing words (optional)…'}
          placeholderTextColor={colors.muted}
          accessibilityLabel="Your answer"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={{ minHeight: 50, borderRadius: 20, borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text, fontFamily: FONT['500'], fontSize: 16, paddingHorizontal: 16 }}
        />
      ) : null}

      {!revealed ? <Button title="Show answer" icon="eye" size="lg" full onPress={reveal} /> : null}

      {/* ---- the answer ---- */}
      {revealed ? (
        <View style={{ gap: 16 }} accessibilityLiveRegion="polite">
          {correct !== null ? <Verdict correct={correct} typed={typedAnswer ?? ''} target={target} /> : null}

          {mode === 'cloze' ? (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <AppText variant="heading" style={{ flex: 1 }}>{card.text}</AppText>
                <Listen id={`card-${card.id}`} text={card.example ?? card.text ?? ''} tts={tts} />
              </View>
              {card.meaning ? <AppText color="text2">{card.meaning}</AppText> : null}
              {card.translation ? <AppText weight="700" color="primaryText">{card.translation}</AppText> : null}
            </View>
          ) : null}

          {mode === 'recall' ? (
            <View style={{ gap: 8 }}>
              {card.translation ? <AppText variant="heading" color="primaryText">{card.translation}</AppText> : null}
              {card.meaning ? <AppText>{card.meaning}</AppText> : null}
              {card.example ? (
                <View style={{ borderLeftWidth: 4, borderLeftColor: colors.primary + '66', paddingLeft: 12 }}>
                  <AppText color="text2" style={{ fontStyle: 'italic' }}>“{card.example}”</AppText>
                </View>
              ) : null}
            </View>
          ) : null}

          {mode === 'mistake' ? (
            <View style={{ gap: 8, padding: 16, borderRadius: 20, backgroundColor: colors.chipBg }}>
              <AppText variant="heading" color="successText">{card.right}</AppText>
              {card.corrected ? <AppText>{card.corrected}</AppText> : null}
              {card.explanation ? <AppText variant="small" color="text2">{card.explanation}</AppText> : null}
            </View>
          ) : null}

          {card.retry ? (
            <Button title="Next" size="lg" full disabled={busy} onPress={() => onRate(null)} />
          ) : (
            <View style={{ gap: 8 }}>
              <AppText variant="caption" color="text2" style={{ textAlign: 'center' }}>How well did you remember it?</AppText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {RATINGS.map((r) => {
                  const bg = { danger: colors.dangerSoft, warn: colors.warnSoft, success: colors.successSoft, info: colors.infoSoft }[r.tone];
                  const fg = { danger: colors.dangerText, warn: colors.warnText, success: colors.successText, info: colors.infoText }[r.tone];
                  return (
                    <Pressable
                      key={r.value}
                      disabled={busy}
                      onPress={() => {
                        if (Platform.OS === 'ios') void Haptics.selectionAsync();
                        rate(r.value);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${r.label}, back in ${card.preview[r.value]}`}
                      style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12, borderRadius: 18, backgroundColor: bg, borderWidth: 3, borderColor: suggested === r.value ? colors.primary + '66' : 'transparent', opacity: busy ? 0.5 : pressed ? 0.8 : 1 })}
                    >
                      <AppText variant="small" weight="800" style={{ color: fg }}>{r.label}</AppText>
                      <AppText variant="caption" style={{ color: fg, opacity: 0.75, fontWeight: '500' }}>{card.preview[r.value]}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      ) : null}
    </Card>
  );
}
