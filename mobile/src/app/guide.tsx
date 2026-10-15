import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View, type ScrollView } from 'react-native';
import { BlockView, useDir } from '@/components/guide/blocks';
import { AppText, Button, Card, ErrorBanner, Icon, Loading, Screen } from '@/components/ui';
import { LANGS, SECTIONS, sectionById, type Lang, type LevelId, type Section } from '@/guide/content';
import { UI } from '@/guide/strings';
import { useGuideLang } from '@/hooks/useGuideLang';
import { useUpdateSettings } from '@/hooks/useSettings';
import { BRAND, useTheme } from '@/theme';

const isLevel = (v: unknown): v is LevelId => typeof v === 'string' && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(v);

function SectionCard({ section, lang, open, onToggle, level, signedIn, onLayout }: { section: Section; lang: Lang; open: boolean; onToggle: () => void; level?: LevelId; signedIn: boolean; onLayout: (y: number) => void }) {
  const { colors } = useTheme();
  const d = useDir(lang);
  const go = section.go;
  return (
    <View onLayout={(e) => onLayout(e.nativeEvent.layout.y)}>
      <Card padded={false} style={{ borderColor: open ? colors.primary + '66' : colors.cardBorder }}>
        <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${section.title[lang]}. ${section.summary[lang]}`} style={{ flexDirection: d.row, alignItems: 'center', gap: 12, padding: 16 }}>
          <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={section.icon} size={22} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="800" style={d.text}>{section.title[lang]}</AppText>
            <AppText variant="small" color="text2" style={d.text}>{section.summary[lang]}</AppText>
          </View>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color="muted" />
        </Pressable>

        {open ? (
          <View style={{ gap: 16, paddingHorizontal: 16, paddingBottom: 18, paddingTop: 2 }}>
            {section.blocks.map((block, i) => (
              <BlockView key={i} block={block} lang={lang} level={level} />
            ))}
            {go && signedIn ? (
              <View style={{ alignItems: d.rtl ? 'flex-end' : 'flex-start' }}>
                <Button
                  title={go.label[lang]}
                  trailingIcon={d.rtl ? 'arrow-back' : 'arrow-forward'}
                  onPress={() => (go.tab ? router.dismissTo(go.href) : router.push(go.href))}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

export default function Guide() {
  const params = useLocalSearchParams<{ section?: string }>();
  const { colors } = useTheme();
  const { lang, setLang, ready, signedIn, settings } = useGuideLang();
  const update = useUpdateSettings();
  const d = useDir(lang);

  const first = params.section && sectionById(params.section) ? params.section : 'welcome';
  const [open, setOpen] = useState<string | null>(first);
  const scroller = useRef<ScrollView>(null);
  const ys = useRef<Record<string, number>>({});
  const jumped = useRef(false);

  // Opened from a "?" button: scroll to the section that was asked for, once its position is known.
  useEffect(() => {
    if (!params.section || jumped.current || !ready) return;
    const timer = setTimeout(() => {
      const y = ys.current[params.section as string];
      if (y !== undefined) {
        scroller.current?.scrollTo({ y: Math.max(0, y - 8), animated: false });
        jumped.current = true;
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [params.section, ready]);

  if (!ready) return <Screen><Loading /></Screen>;

  const account = settings.data;
  const level = isLevel(account?.level) ? account?.level ?? undefined : undefined;
  const coachLang = account?.nativeLang;
  // The card is also kept after the change is saved, so the learner sees the confirmation (the languages match by then).
  const justSaved = update.isSuccess && update.variables?.nativeLang === lang;
  const showCoachCard = signedIn && Boolean(account) && (coachLang !== lang || justSaved);
  const langName = LANGS.find((l) => l.id === lang)?.label ?? lang;

  return (
    <Screen scrollRef={scroller}>
      {/* The title in the navigation bar follows the language of the guide. */}
      <Stack.Screen options={{ title: UI.title[lang] }} />
      <AppText color="text2" style={d.text}>{UI.intro[lang]}</AppText>

      <View style={{ gap: 8 }}>
        <AppText variant="caption" weight="800" color="muted" style={[{ letterSpacing: 1 }, d.text]}>{UI.language[lang].toUpperCase()}</AppText>
        <View style={{ flexDirection: d.row, gap: 8 }} accessibilityRole="tablist">
          {LANGS.map((l) => {
            const on = l.id === lang;
            return (
              <Pressable
                key={l.id}
                onPress={() => setLang(l.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={l.label}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 16, borderWidth: 2, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primary : colors.card }}
              >
                <AppText weight="800" style={{ color: on ? '#fff' : colors.text }}>{l.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showCoachCard ? (
        <Card style={{ gap: 10, backgroundColor: colors.infoSoft, borderColor: colors.info + '33' }}>
          <AppText weight="700" style={[{ color: colors.infoText }, d.text]}>{UI.coachAsk[lang]}</AppText>
          {justSaved ? (
            <AppText variant="small" weight="700" style={[{ color: colors.successText }, d.text]}>{UI.coachSaved[lang]}</AppText>
          ) : (
            <View style={{ alignItems: d.rtl ? 'flex-end' : 'flex-start' }}>
              <Button title={`${UI.coachYes[lang]} (${langName})`} variant="soft" size="sm" loading={update.isPending} onPress={() => update.mutate({ nativeLang: lang })} />
            </View>
          )}
          {update.isError ? <ErrorBanner error={update.error} /> : null}
        </Card>
      ) : null}

      <View style={{ gap: 12 }}>
        {SECTIONS.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            lang={lang}
            open={open === section.id}
            onToggle={() => setOpen(open === section.id ? null : section.id)}
            level={level}
            signedIn={signedIn}
            onLayout={(y) => {
              ys.current[section.id] = y;
            }}
          />
        ))}
      </View>

      <AppText variant="small" color="muted" style={[{ textAlign: 'center' }, lang === 'ar' ? { writingDirection: 'rtl' } : null]}>{UI.footer[lang]}</AppText>
    </Screen>
  );
}
