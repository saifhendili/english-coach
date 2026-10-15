import { useState } from 'react';
import { Linking, Pressable, View, type TextStyle } from 'react-native';
import { AppText, Button, Icon, LevelBadge } from '@/components/ui';
import { GLOSSARY, LEVELS_INFO, LEVEL_IDS, PLANS, type Block, type Lang, type LevelId } from '@/guide/content';
import { isRtl } from '@/guide/lang';
import { UI } from '@/guide/strings';
import { useTheme } from '@/theme';

// Everything here reads right to left for Arabic: text aligns right, rows are mirrored, numbers and bullets sit on the right.
export function useDir(lang: Lang) {
  const rtl = isRtl(lang);
  return {
    rtl,
    row: (rtl ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
    text: { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' } as TextStyle,
  };
}

function Heading({ lang, children }: { lang: Lang; children: string }) {
  const d = useDir(lang);
  return (
    <AppText variant="small" weight="800" color="primaryText" accessibilityRole="header" style={d.text}>
      {children}
    </AppText>
  );
}

function Steps({ lang, title, items }: { lang: Lang; title?: string; items: string[] }) {
  const { colors } = useTheme();
  const d = useDir(lang);
  return (
    <View style={{ gap: 10 }}>
      {title ? <Heading lang={lang}>{title}</Heading> : null}
      {items.map((text, i) => (
        <View key={i} style={{ flexDirection: d.row, gap: 12, alignItems: 'flex-start' }} accessible accessibilityLabel={`${UI.step[lang]} ${i + 1}. ${text}`}>
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: 1 }}>
            <AppText variant="small" weight="800" style={{ color: '#fff' }}>{i + 1}</AppText>
          </View>
          <AppText style={[{ flex: 1 }, d.text]}>{text}</AppText>
        </View>
      ))}
    </View>
  );
}

function Bullets({ lang, title, items }: { lang: Lang; title?: string; items: string[] }) {
  const { colors } = useTheme();
  const d = useDir(lang);
  return (
    <View style={{ gap: 8 }}>
      {title ? <Heading lang={lang}>{title}</Heading> : null}
      {items.map((text, i) => (
        <View key={i} style={{ flexDirection: d.row, gap: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, marginTop: 9, backgroundColor: colors.primary }} />
          <AppText style={[{ flex: 1 }, d.text]}>{text}</AppText>
        </View>
      ))}
    </View>
  );
}

function Note({ lang, text, tone }: { lang: Lang; text: string; tone: 'tip' | 'warn' }) {
  const { colors } = useTheme();
  const d = useDir(lang);
  const bg = tone === 'tip' ? colors.successSoft : colors.warnSoft;
  const fg = tone === 'tip' ? colors.successText : colors.warnText;
  return (
    <View style={{ flexDirection: d.row, gap: 10, padding: 14, borderRadius: 18, backgroundColor: bg }} accessibilityRole={tone === 'warn' ? 'alert' : undefined}>
      <Icon name={tone === 'tip' ? 'bulb' : 'alert-circle'} size={20} color={fg} />
      <AppText variant="small" weight="600" style={[{ flex: 1, color: fg }, d.text]}>{text}</AppText>
    </View>
  );
}

function Levels({ lang }: { lang: Lang }) {
  const d = useDir(lang);
  return (
    <View style={{ gap: 10 }}>
      <Heading lang={lang}>{lang === 'en' ? 'The six levels' : lang === 'fr' ? 'Les six niveaux' : 'المستويات الستة'}</Heading>
      {LEVEL_IDS.map((id) => (
        <View key={id} style={{ flexDirection: d.row, gap: 12, alignItems: 'center' }}>
          <LevelBadge level={id} size="md" />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="800" style={d.text}>{LEVELS_INFO[id].name[lang]}</AppText>
            <AppText variant="small" color="text2" style={d.text}>{LEVELS_INFO[id].canDo[lang]}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PlanBlock({ lang, initial }: { lang: Lang; initial?: LevelId }) {
  const { colors } = useTheme();
  const d = useDir(lang);
  const [level, setLevel] = useState<LevelId>(initial ?? 'A1');
  const plan = PLANS[level];
  const total = plan.daily.reduce((n, s) => n + s.minutes, 0);

  return (
    <View style={{ gap: 14 }}>
      <Heading lang={lang}>{UI.yourLevel[lang]}</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="tablist">
        {LEVEL_IDS.map((id) => {
          const on = id === level;
          return (
            <Pressable
              key={id}
              onPress={() => setLevel(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${id} ${LEVELS_INFO[id].name[lang]}`}
              style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 2, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primary : colors.card }}
            >
              <AppText variant="small" weight="800" style={{ color: on ? '#fff' : colors.text }}>{id}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 4 }}>
        <AppText weight="800" style={d.text}>{level} · {LEVELS_INFO[level].name[lang]}</AppText>
        <AppText variant="small" color="text2" style={d.text}>{LEVELS_INFO[level].canDo[lang]}</AppText>
      </View>

      <View style={{ gap: 4 }}>
        <Heading lang={lang}>{UI.focus[lang]}</Heading>
        <AppText style={d.text}>{plan.focus[lang]}</AppText>
      </View>

      <View style={{ gap: 10 }}>
        <Heading lang={lang}>{`${UI.aGoodDay[lang]} · ${UI.total[lang]} ${total} ${UI.minutes[lang]}`}</Heading>
        {plan.daily.map((step, i) => (
          <View key={i} style={{ flexDirection: d.row, gap: 12, alignItems: 'flex-start' }}>
            <View style={{ minWidth: 54, alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 12, backgroundColor: colors.primarySoft }}>
              <AppText variant="small" weight="800" color="primaryText">{step.minutes} {UI.minutes[lang]}</AppText>
            </View>
            <AppText style={[{ flex: 1 }, d.text]}>{step.text[lang]}</AppText>
          </View>
        ))}
      </View>

      <Note lang={lang} tone="tip" text={`${UI.goal[lang]}: ${plan.goal[lang]}`} />
    </View>
  );
}

function Glossary({ lang }: { lang: Lang }) {
  const { colors } = useTheme();
  // In the English guide both translations are shown, so a French or Arabic reader can use it too.
  const cols: ('fr' | 'ar')[] = lang === 'en' ? ['fr', 'ar'] : [lang];
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.chipBg }}>
        <AppText variant="caption" weight="800" color="muted" style={{ flex: 1 }}>{UI.inTheApp[lang].toUpperCase()}</AppText>
        {cols.map((c) => (
          <AppText key={c} variant="caption" weight="800" color="muted" style={{ flex: 1, textAlign: c === 'ar' ? 'right' : 'left' }}>
            {c === 'fr' ? 'FRANÇAIS' : 'العربية'}
          </AppText>
        ))}
      </View>
      {GLOSSARY.map((row, i) => (
        <View key={row.en} style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }} accessible accessibilityLabel={`${row.en}: ${cols.map((c) => row[c]).join(', ')}`}>
          <AppText variant="small" weight="700" style={{ flex: 1, textAlign: 'left', writingDirection: 'ltr' }}>{row.en}</AppText>
          {cols.map((c) => (
            <AppText key={c} variant="small" color="text2" style={{ flex: 1, textAlign: c === 'ar' ? 'right' : 'left', writingDirection: c === 'ar' ? 'rtl' : 'ltr' }}>
              {row[c]}
            </AppText>
          ))}
        </View>
      ))}
    </View>
  );
}

function Faq({ lang, items }: { lang: Lang; items: { q: string; a: string }[] }) {
  const { colors } = useTheme();
  const d = useDir(lang);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View style={{ gap: 8 }}>
      {items.map((item, i) => {
        const on = open === i;
        return (
          <View key={i} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
            <Pressable onPress={() => setOpen(on ? null : i)} accessibilityRole="button" accessibilityState={{ expanded: on }} style={{ flexDirection: d.row, alignItems: 'center', gap: 10, padding: 14 }}>
              <AppText weight="700" style={[{ flex: 1 }, d.text]}>{item.q}</AppText>
              <Icon name={on ? 'chevron-up' : 'chevron-down'} size={18} color="muted" />
            </Pressable>
            {on ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                <AppText color="text2" style={d.text}>{item.a}</AppText>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// One block of a section, in the chosen language.
export function BlockView({ block, lang, level }: { block: Block; lang: Lang; level?: LevelId }) {
  const d = useDir(lang);
  switch (block.type) {
    case 'p':
      return <AppText style={d.text}>{block.text[lang]}</AppText>;
    case 'steps':
      return <Steps lang={lang} title={block.title?.[lang]} items={block.items.map((i) => i[lang])} />;
    case 'bullets':
      return <Bullets lang={lang} title={block.title?.[lang]} items={block.items.map((i) => i[lang])} />;
    case 'tip':
      return <Note lang={lang} tone="tip" text={block.text[lang]} />;
    case 'warn':
      return <Note lang={lang} tone="warn" text={block.text[lang]} />;
    case 'link':
      return (
        <View style={{ alignItems: d.rtl ? 'flex-end' : 'flex-start' }}>
          <Button title={block.label[lang]} icon="open-outline" variant="soft" onPress={() => void Linking.openURL(block.url)} />
        </View>
      );
    case 'levels':
      return <Levels lang={lang} />;
    case 'plan':
      return <PlanBlock lang={lang} initial={level} />;
    case 'glossary':
      return <Glossary lang={lang} />;
    case 'faq':
      return <Faq lang={lang} items={block.items.map((i) => ({ q: i.q[lang], a: i.a[lang] }))} />;
  }
}

