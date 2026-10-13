import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SaveButton } from '@/components/SaveButton';
import { AppText, Icon } from '@/components/ui';
import type { Tts } from '@/hooks/useTts';
import { tokenize } from '@/lib/words';
import { BRAND, useTheme } from '@/theme';
import type { Correction, NewWord, PhraseUpgrade } from '@/types';
import { CorrectionCard } from './CorrectionCard';
import { PhraseUpgradeCard } from './PhraseUpgradeCard';

// Every word is tappable: tap one to see what it means. The word being read aloud is highlighted.
function Words({ text, activeIndex, onWord }: { text: string; activeIndex: number; onWord: (word: string) => void }) {
  const { colors } = useTheme();
  return (
    <AppText>
      {tokenize(text).map((t, i) =>
        t.word === null ? (
          t.text
        ) : (
          <AppText
            key={i}
            onPress={() => onWord(t.word as string)}
            style={t.index === activeIndex ? { backgroundColor: colors.primary + '44' } : undefined}
            accessibilityRole="button"
            accessibilityLabel={`Meaning of ${t.word}`}
          >
            {t.text}
          </AppText>
        ),
      )}
    </AppText>
  );
}

export function CoachBubble({
  id,
  text,
  newWords = [],
  streaming = false,
  tts,
  slow,
  hideText,
  onWord,
  sessionId,
}: {
  id: string;
  text: string;
  newWords?: NewWord[];
  streaming?: boolean;
  tts: Tts;
  slow: boolean;
  hideText: boolean;
  onWord: (word: string) => void;
  sessionId?: string;
}) {
  const { colors, dark } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const hidden = hideText && !revealed && !streaming;
  const speaking = tts.speakingId === id;

  return (
    <View style={{ alignItems: 'flex-start', maxWidth: '92%', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View
          style={{
            flexShrink: 1,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 22,
            borderBottomLeftRadius: 6,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadow,
            shadowOpacity: dark ? 0 : 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          {hidden ? (
            <Pressable onPress={() => setRevealed(true)} accessibilityRole="button" accessibilityLabel="Show the coach's message" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
              <Icon name="eye-outline" size={18} color="primaryText" />
              <AppText variant="small" weight="700" color="primaryText">Listen first, tap to read</AppText>
            </Pressable>
          ) : (
            <>
              <Words text={text} activeIndex={speaking ? tts.wordIndex : -1} onWord={onWord} />
              {streaming ? <AppText color="primary"> ▍</AppText> : null}
            </>
          )}
        </View>
        {!streaming ? (
          <Pressable
            onPress={() => tts.speak(id, text, { slow })}
            accessibilityRole="button"
            accessibilityLabel={speaking ? 'Stop reading' : 'Read aloud'}
            accessibilityState={{ selected: speaking }}
            hitSlop={6}
            style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: speaking ? colors.primary : colors.card, marginBottom: 2 }}
          >
            <Icon name="volume-high" size={18} color={speaking ? '#fff' : colors.text2} />
          </Pressable>
        ) : null}
      </View>

      {newWords.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityLabel="New words">
          {newWords.map((w) => (
            <View key={w.word} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 4, paddingVertical: 4, borderRadius: 16, backgroundColor: colors.chipBg }}>
              <AppText variant="small">
                <AppText variant="small" weight="800">{w.word}</AppText>
                <AppText variant="small" color="text2">  {w.translation ?? w.meaning}</AppText>
              </AppText>
              <SaveButton compact item={{ kind: 'word', text: w.word, meaning: w.meaning, translation: w.translation ?? '', example: text.slice(0, 400), source: 'chat', sessionId }} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function LearnerBubble({
  text,
  correction,
  phrases = [],
  showFeedback,
  pending = false,
  tts,
  sessionId,
}: {
  text: string;
  correction?: Correction | null;
  phrases?: PhraseUpgrade[];
  showFeedback?: boolean;
  pending?: boolean;
  tts: Tts;
  sessionId?: string;
}) {
  return (
    <View style={{ alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: '94%' }}>
      <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22, borderBottomRightRadius: 6, opacity: pending ? 0.7 : 1 }}>
        <AppText style={{ color: '#fff' }}>{text}</AppText>
      </LinearGradient>
      {showFeedback && correction ? (
        <View style={{ alignSelf: 'stretch' }}>
          <CorrectionCard original={text} correction={correction} />
          {phrases.map((p) => (
            <PhraseUpgradeCard key={p.better} phrase={p} tts={tts} sessionId={sessionId} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
