import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { AppText, Button, Card, Chip, GradientCard, Icon, type IconName } from '@/components/ui';
import { focusLook } from '@/lib/skills';
import { useTheme } from '@/theme';
import type { Topic } from '@/types';

export const ANGLES: Record<Topic['angle'], { label: string; icon: IconName }> = {
  debate: { label: 'Debate', icon: 'scale-outline' },
  storytelling: { label: 'Storytelling', icon: 'book-outline' },
  'role-play': { label: 'Role-play', icon: 'people-outline' },
  opinion: { label: 'Opinion', icon: 'chatbubble-outline' },
  'problem-solving': { label: 'Problem-solving', icon: 'extension-puzzle-outline' },
};

function Heading({ children }: { children: string }) {
  return <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1 }}>{children.toUpperCase()}</AppText>;
}

type Props = {
  topic: Topic;
  onToggleFavorite: (topic: Topic) => void;
  onStart: (topic: Topic, mode: 'talk' | 'roleplay') => void;
  /** Which start button is waiting for the server, if any. */
  starting: 'talk' | 'roleplay' | null;
};

export function TopicCard({ topic, onToggleFavorite, onStart, starting }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const angle = ANGLES[topic.angle];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <Card padded={false}>
      <View style={{ padding: 18, paddingBottom: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={`${topic.emoji} ${topic.field}`} />
          {angle ? <Chip label={angle.label} icon={angle.icon} tone="neutral" /> : null}
          <Chip label={`${topic.durationMinutes} min`} icon="time-outline" tone="neutral" />
          <Chip label={topic.level} tone="success" />
        </View>
        <AppText variant="heading" accessibilityRole="header">{topic.title}</AppText>
        <View style={{ borderLeftWidth: 4, borderLeftColor: colors.primary + '66', paddingLeft: 12 }}>
          <AppText color="text2" style={{ fontStyle: 'italic' }}>“{topic.openers[0]}”</AppText>
        </View>
      </View>

      {open ? (
        <View style={{ gap: 20, padding: 18, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ gap: 10 }}>
            <Heading>Conversation starters</Heading>
            {topic.openers.map((q, i) => (
              <View key={q} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginTop: 1 }}>
                  <AppText variant="caption" weight="800" color="primaryText">{i + 1}</AppText>
                </View>
                <AppText style={{ flex: 1 }}>{q}</AppText>
              </View>
            ))}
          </View>

          <View style={{ gap: 10 }}>
            <Heading>Key words</Heading>
            {topic.vocab.map((v) => (
              <View key={v.word} style={{ padding: 12, borderRadius: 14, backgroundColor: colors.chipBg, gap: 2 }}>
                <AppText>
                  <AppText weight="800">{v.word}</AppText>
                  {v.translation ? <AppText weight="700" color="primaryText">  {v.translation}</AppText> : null}
                </AppText>
                <AppText variant="small" color="text2">{v.meaning}</AppText>
              </View>
            ))}
          </View>

          <GradientCard style={{ padding: 16, borderRadius: 22, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="people" size={16} color="rgba(255,255,255,0.8)" />
              <AppText variant="caption" weight="800" style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>ROLE-PLAY</AppText>
            </View>
            <AppText style={{ color: '#fff' }}>{topic.scenario}</AppText>
            <View style={{ marginTop: 8 }}>
              <Button title="Play this scene" icon="people" variant="white" size="sm" loading={starting === 'roleplay'} disabled={Boolean(starting)} onPress={() => onStart(topic, 'roleplay')} />
            </View>
          </GradientCard>

          <View style={{ gap: 10 }}>
            <Heading>Your focus</Heading>
            {topic.focusTips.map((t) => {
              const look = focusLook(t.skill);
              return (
                <View key={t.skill + t.tip} style={{ flexDirection: 'row', gap: 12 }}>
                  <LinearGradient colors={look.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={look.icon} size={16} color="#fff" />
                  </LinearGradient>
                  <AppText variant="small" style={{ flex: 1 }}>
                    <AppText variant="small" weight="800">{look.label}.  </AppText>
                    {t.tip}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={open ? 'Hide details' : 'Show details'} accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 10 }}>
          <AppText variant="small" weight="700" color="primaryText">{open ? 'Hide details' : 'Show details'}</AppText>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="primaryText" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable
            onPress={() => onToggleFavorite(topic)}
            accessibilityRole="button"
            accessibilityLabel={topic.favorite ? 'Remove from favourites' : 'Add to favourites'}
            accessibilityState={{ selected: topic.favorite }}
            hitSlop={6}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={topic.favorite ? 'heart' : 'heart-outline'} size={24} color={topic.favorite ? '#f43f5e' : colors.muted} />
          </Pressable>
          <Button title="Talk" icon="chatbubble-ellipses" size="sm" loading={starting === 'talk'} disabled={Boolean(starting)} onPress={() => onStart(topic, 'talk')} />
        </View>
      </View>
    </Card>
  );
}
