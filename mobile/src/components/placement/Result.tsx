import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { AppText, Button, Card, GradientCard, Icon, LevelBadge, type IconName } from '@/components/ui';
import { focusLook } from '@/lib/skills';
import { LEVEL_STYLE, useTheme } from '@/theme';
import type { PlacementResult, PlacementReviewItem } from '@/types';

function SkillBar({ type, score, count, delay }: { type: string; score: number; count: number; delay: number }) {
  const { colors } = useTheme();
  const look = focusLook(type);
  const [grow] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(grow, { toValue: Math.max(score, 3), duration: 800, delay: delay * 1000, useNativeDriver: false }).start();
  }, [grow, score, delay]);

  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${look.label}: ${score}%, ${count} ${count === 1 ? 'question' : 'questions'}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Icon name={look.icon} size={16} color="text2" />
          <AppText variant="small" weight="700">{look.label}</AppText>
          <AppText variant="caption" color="muted" style={{ fontWeight: '500' }}>{count} {count === 1 ? 'question' : 'questions'}</AppText>
        </View>
        <AppText variant="small" weight="700">{score}%</AppText>
      </View>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', width: grow.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), borderRadius: 6, overflow: 'hidden' }}>
          <LinearGradient colors={look.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </View>
    </View>
  );
}

function List({ title, items, icon, tone }: { title: string; items: string[]; icon: IconName; tone: string }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: tone + '2a' }}>
          <Icon name={icon} size={14} color={tone} />
        </View>
        <AppText variant="small" weight="800" accessibilityRole="header">{title}</AppText>
      </View>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 8, backgroundColor: tone }} />
          <AppText variant="small" style={{ flex: 1 }}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

function verdict(score: number, colors: ReturnType<typeof useTheme>['colors']) {
  return score >= 0.75
    ? { icon: 'checkmark' as const, fg: colors.successText, bg: colors.successSoft, label: 'Correct' }
    : score >= 0.4
      ? { icon: 'remove' as const, fg: colors.warnText, bg: colors.warnSoft, label: 'Partly right' }
      : { icon: 'close' as const, fg: colors.dangerText, bg: colors.dangerSoft, label: 'Missed' };
}

function ReviewItem({ q }: { q: PlacementReviewItem }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const v = verdict(q.score, colors);
  const skill = focusLook(q.type);
  const prompt = q.prompt.replace(/_{2,}/g, '____');

  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${v.label}. ${skill.label}. ${prompt}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
        <View style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: v.bg }}>
          <Icon name={v.icon} size={16} color={v.fg} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={skill.icon} size={12} color="muted" />
            <AppText variant="caption" color="text2">{skill.label} · {q.level}</AppText>
          </View>
          <AppText variant="small" weight="700" numberOfLines={open ? undefined : 1}>{prompt}</AppText>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="muted" />
      </Pressable>

      {open ? (
        <View style={{ gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          {q.passage ? <View style={{ padding: 12, borderRadius: 14, backgroundColor: colors.successSoft }}><AppText variant="small">{q.passage}</AppText></View> : null}
          {q.options ? (
            <>
              {q.options.map((o, i) => {
                const correct = i === q.correctIndex;
                const mine = i === q.yourChoice;
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: correct ? colors.successSoft : mine ? colors.dangerSoft : 'transparent' }}>
                    <AppText variant="small" weight={correct || mine ? '700' : '500'} style={{ flex: 1, color: correct ? colors.successText : mine ? colors.dangerText : colors.text2 }}>{o}</AppText>
                    {correct ? <AppText variant="caption" weight="700" style={{ color: colors.successText }}>Correct answer</AppText> : null}
                    {mine && !correct ? <AppText variant="caption" weight="700" style={{ color: colors.dangerText }}>Your answer</AppText> : null}
                  </View>
                );
              })}
              {q.skipped ? <AppText variant="small" color="text2">You skipped this one.</AppText> : null}
              {q.explanation ? <AppText variant="small" color="text2">{q.explanation}</AppText> : null}
            </>
          ) : (
            <>
              {q.yourText ? (
                <View style={{ borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: 12, paddingVertical: 4 }}>
                  <AppText variant="small" style={{ fontStyle: 'italic' }}>{q.yourText}</AppText>
                </View>
              ) : (
                <AppText variant="small" color="text2">You skipped this one.</AppText>
              )}
              {q.grade ? (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {[`Shows ${q.grade.cefrLevel}`, `Grammar ${q.grade.grammar}/10`, `Vocabulary ${q.grade.vocabulary}/10`, `${q.type === 'speaking' ? 'Fluency' : 'Coherence'} ${q.grade.fluency}/10`].map((t) => (
                      <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.primarySoft }}>
                        <AppText variant="caption" weight="700" color="primaryText">{t}</AppText>
                      </View>
                    ))}
                  </View>
                  <AppText variant="small" color="text2">{q.grade.feedback}</AppText>
                </>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

export function Result({ result, onRetake }: { result: PlacementResult; onRetake: () => void }) {
  const { colors } = useTheme();
  const { level, answered, breakdown, feedback, review } = result;

  return (
    <View style={{ gap: 18 }}>
      <GradientCard style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
        <AppText variant="small" weight="700" style={{ color: 'rgba(255,255,255,0.78)' }}>Your English level is</AppText>
        <LevelBadge level={level} size="xl" />
        <AppText variant="title" style={{ color: '#fff' }}>{LEVEL_STYLE[level]?.name}</AppText>
        <AppText variant="small" style={{ color: 'rgba(255,255,255,0.75)' }}>Based on {answered} questions</AppText>
      </GradientCard>

      <Card style={{ gap: 16 }}>
        <AppText variant="subhead" accessibilityRole="header">Your skills</AppText>
        {Object.entries(breakdown).map(([type, s], i) => (
          <SkillBar key={type} type={type} score={s.score} count={s.count} delay={0.2 + i * 0.1} />
        ))}
      </Card>

      {feedback ? (
        <Card style={{ gap: 18 }}>
          <AppText>{feedback.summary}</AppText>
          <List title="Strengths" items={feedback.strengths} icon="checkmark" tone={colors.success} />
          <List title="To work on" items={feedback.weaknesses} icon="trending-up" tone={colors.warn} />
          <List title="Next steps" items={feedback.nextSteps} icon="bulb" tone={colors.primary} />
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1, paddingHorizontal: 4 }}>REVIEW YOUR ANSWERS</AppText>
        {review.map((q) => (
          <ReviewItem key={q.index} q={q} />
        ))}
      </View>

      <Button title="Back to home" trailingIcon="arrow-forward" full onPress={() => router.dismissTo('/')} />
      <Button title="Retake the test" icon="refresh" variant="ghost" full onPress={onRetake} />
    </View>
  );
}
