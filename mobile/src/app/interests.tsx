import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, ErrorBanner, Icon, Loading, Screen, TextField } from '@/components/ui';
import { useInterests, useSaveInterests, useSuggestFields } from '@/hooks/useInterests';
import { FIELD_GROUPS, SEED_NAMES, tidyName } from '@/lib/fields';
import { focusLook } from '@/lib/skills';
import { BRAND, useTheme } from '@/theme';
import type { FocusOption, InterestField, InterestsData } from '@/types';

const key = (name: string) => name.toLowerCase();

function Step({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="small" weight="800" style={{ color: '#fff' }}>{n}</AppText>
        </LinearGradient>
        <AppText variant="subhead" accessibilityRole="header" style={{ flex: 1 }}>{title}</AppText>
      </View>
      <AppText variant="small" color="text2">{hint}</AppText>
    </View>
  );
}

function FocusCard({ option, selected, suggested, onToggle }: { option: FocusOption; selected: boolean; suggested: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  const look = focusLook(option.id);
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${option.label}. ${option.description}${suggested ? '. Suggested by your test' : ''}`}
      style={({ pressed }) => ({ width: '48.5%', gap: 8, padding: 14, borderRadius: 20, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.card, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <LinearGradient colors={look.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={look.icon} size={20} color="#fff" />
        </LinearGradient>
        <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selected ? colors.primary : colors.inputBorder, backgroundColor: selected ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <Icon name="checkmark" size={14} color="#fff" /> : null}
        </View>
      </View>
      <AppText weight="700">{option.label}</AppText>
      <AppText variant="caption" color="text2" style={{ fontWeight: '500' }}>{option.description}</AppText>
      {suggested ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.warnSoft }}>
          <Icon name="sparkles" size={11} color="warnText" />
          <AppText variant="caption" weight="700" color="warnText">Suggested by your test</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function FieldChip({ field, selected, onToggle }: { field: InterestField; selected: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 }}>
      <AppText variant="small">{field.emoji}</AppText>
      <AppText variant="small" weight="700" style={{ color: selected ? '#fff' : colors.text }}>{field.name}</AppText>
      {selected ? <Icon name="checkmark" size={14} color="#fff" /> : null}
    </View>
  );
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={field.name} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {selected ? (
        <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 999 }}>{body}</LinearGradient>
      ) : (
        <View style={{ borderRadius: 999, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card }}>{body}</View>
      )}
    </Pressable>
  );
}

export default function Interests() {
  const { data, error, refetch } = useInterests();
  if (!data) {
    return <Screen>{error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : <Loading />}</Screen>;
  }
  return <InterestsForm data={data} />;
}

// The form starts from what is saved. A first visit starts from the skills the test found weakest.
function InterestsForm({ data }: { data: InterestsData }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const save = useSaveInterests();
  const suggest = useSuggestFields();

  const [selected, setSelected] = useState<Map<string, InterestField>>(() => new Map(data.fields.map((f) => [key(f.name), f])));
  const [focus, setFocus] = useState<Set<string>>(() => new Set(data.saved ? data.focus : data.suggestedFocus));
  const [extras, setExtras] = useState<InterestField[]>(() => data.fields.filter((f) => !SEED_NAMES.has(key(f.name)))); // fields outside the seed list: own + suggested
  const [custom, setCustom] = useState('');

  // Everything on screen (seed + own + suggested): what "More fields" must not repeat.
  const allFields = useMemo(() => [...FIELD_GROUPS.flatMap((g) => g.fields), ...extras], [extras]);
  const shown = useMemo(() => new Set(allFields.map((f) => key(f.name))), [allFields]);

  const toggleField = (f: InterestField) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key(f.name))) next.delete(key(f.name));
      else next.set(key(f.name), f);
      return next;
    });
  const toggleFocus = (id: string) =>
    setFocus((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addCustom = () => {
    const name = tidyName(custom);
    if (name.length < 2) return;
    let field = allFields.find((f) => key(f.name) === key(name)); // already on screen: just select it
    if (!field) {
      field = { name, emoji: '✨' };
      setExtras((prev) => [...prev, field as InterestField]);
    }
    const chosen = field;
    setSelected((prev) => new Map(prev).set(key(chosen.name), chosen));
    setCustom('');
  };

  const moreFields = () =>
    suggest.mutate(
      { selected: [...selected.values()].map((f) => f.name), exclude: allFields.map((f) => f.name) },
      { onSuccess: ({ suggestions }) => setExtras((prev) => [...prev, ...suggestions.filter((x) => !shown.has(key(x.name)))]) },
    );

  const submit = () => save.mutate({ fields: [...selected.values()], focus: [...focus] }, { onSuccess: () => router.dismissTo('/topics') });

  const canSave = selected.size >= 1 && focus.size >= 1;
  const suggestedNow = !data.saved ? new Set(data.suggestedFocus) : new Set<string>();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottom={24}>
        <View style={{ gap: 2 }}>
          <AppText variant="title">Make it yours</AppText>
          <AppText variant="small" color="text2">Two quick choices, and every topic will be about things you care about.</AppText>
        </View>

        <Card style={{ gap: 16 }}>
          <Step n={1} title="What do you want to improve?" hint="Pick as many as you like. Topics will include tips for these." />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            {data.focusOptions.map((o) => (
              <FocusCard key={o.id} option={o} selected={focus.has(o.id)} suggested={suggestedNow.has(o.id)} onToggle={() => toggleFocus(o.id)} />
            ))}
          </View>
        </Card>

        <Card style={{ gap: 18 }}>
          <Step n={2} title="What do you like talking about?" hint="Choose a few. You can always add more later." />

          {FIELD_GROUPS.map((g) => (
            <View key={g.id} style={{ gap: 10 }}>
              <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1 }}>{g.emoji} {g.label.toUpperCase()}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {g.fields.map((f) => (
                  <FieldChip key={f.name} field={f} selected={selected.has(key(f.name))} onToggle={() => toggleField(f)} />
                ))}
              </View>
            </View>
          ))}

          {extras.length > 0 ? (
            <View style={{ gap: 10 }}>
              <AppText variant="caption" weight="800" color="muted" accessibilityRole="header" style={{ letterSpacing: 1 }}>✨ YOURS AND SUGGESTED</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {extras.map((f) => (
                  <FieldChip key={f.name} field={f} selected={selected.has(key(f.name))} onToggle={() => toggleField(f)} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <TextField label="Add your own interest" placeholder="chess, K-pop, farming…" maxLength={40} value={custom} onChangeText={setCustom} onSubmitEditing={addCustom} returnKeyType="done" autoCapitalize="words" />
              </View>
              <View style={{ marginTop: 26 }}>
                <Button title="Add" icon="add" variant="ghost" disabled={tidyName(custom).length < 2} onPress={addCustom} />
              </View>
            </View>
            <Button title={suggest.isPending ? 'Finding ideas…' : 'More fields'} icon="color-wand" variant="ghost" full loading={suggest.isPending} onPress={moreFields} />
            <ErrorBanner error={suggest.error} onRetry={moreFields} />
          </View>
        </Card>

        <ErrorBanner error={save.error} />
      </Screen>

      <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <AppText variant="small" weight="700" color={canSave ? 'text' : 'text2'} style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {canSave ? `${selected.size} ${selected.size === 1 ? 'interest' : 'interests'} · ${focus.size} to improve` : focus.size === 0 ? 'Pick what to improve' : 'Pick at least one interest'}
        </AppText>
        <Button title={data.saved ? 'Save' : 'Save & see topics'} trailingIcon="arrow-forward" disabled={!canSave} loading={save.isPending} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}
