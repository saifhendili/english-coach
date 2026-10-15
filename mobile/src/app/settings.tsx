import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { View } from 'react-native';
import { PickerField, type Option } from '@/components/Pickers';
import { ServerBox } from '@/components/ServerBox';
import { AppText, Button, Card, Chip, ErrorBanner, Icon, Loading, Screen, Segmented, TextField } from '@/components/ui';
import { useSettings, useTestKey, useUpdateSettings } from '@/hooks/useSettings';
import { confirmAsync } from '@/lib/confirm';
import { useAuth } from '@/store/auth';
import type { SettingsData } from '@/types';

const LANGUAGES: Option[] = [
  { value: 'en', label: 'English only' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

function SectionTitle({ icon, title, sub }: { icon: React.ComponentProps<typeof Icon>['name']; title: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf622' }}>
        <Icon name={icon} size={20} color="primary" />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="subhead">{title}</AppText>
        {sub ? <AppText variant="caption" color="muted">{sub}</AppText> : null}
      </View>
    </View>
  );
}

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, backgroundColor: ok ? '#10b98122' : '#f43f5e22' }} accessibilityRole="alert">
      <Icon name={ok ? 'checkmark-circle' : 'alert-circle'} size={18} color={ok ? 'successText' : 'dangerText'} />
      <AppText variant="small" weight="600" color={ok ? 'successText' : 'dangerText'} style={{ flex: 1 }}>{children}</AppText>
    </View>
  );
}

function KeyCard({ settings }: { settings: SettingsData }) {
  const update = useUpdateSettings();
  const test = useTestKey();
  const [value, setValue] = useState('');
  const typed = value.trim();

  const run = (fn: () => void) => {
    update.reset();
    test.reset();
    fn();
  };

  const remove = async () => {
    if (await confirmAsync('Remove your Gemini key?', 'Generation stops until you add one.', 'Remove', true)) run(() => update.mutate({ geminiKey: null }));
  };

  return (
    <Card style={{ gap: 14 }}>
      <SectionTitle icon="key-outline" title="Gemini API key" sub="Your own free key from Google AI Studio" />
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#10b98114' }}>
        <Icon name="shield-checkmark" size={18} color="success" />
        <AppText variant="caption" color="text2" style={{ flex: 1 }}>Stored encrypted on the server and never sent back to the phone in full.</AppText>
      </View>
      {settings.hasKey ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="small">Saved key:</AppText>
          <Chip tone="success" label={settings.keyHint ?? ''} />
        </View>
      ) : null}
      <TextField
        label={settings.hasKey ? 'Replace key' : 'API key'}
        value={value}
        onChangeText={setValue}
        secure
        placeholder="AIza…"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Button title="Test key" icon="flash-outline" variant="ghost" size="sm" loading={test.isPending} disabled={!typed && !settings.hasKey} onPress={() => run(() => test.mutate(typed || undefined))} />
        <Button
          title="Save key"
          size="sm"
          loading={update.isPending}
          disabled={typed.length < 20}
          onPress={() => run(() => update.mutate({ geminiKey: typed }, { onSuccess: () => setValue('') }))}
        />
        {settings.hasKey ? <Button title="Remove" icon="trash-outline" variant="danger" size="sm" disabled={update.isPending} onPress={remove} /> : null}
      </View>
      {test.isSuccess ? <Status ok>Valid. Gemini answered using {test.data.model}.</Status> : null}
      {test.error ? <Status ok={false}>Invalid: {test.error.message}</Status> : null}
      {update.error ? <Status ok={false}>{update.error.message}</Status> : null}
    </Card>
  );
}

const formFrom = (settings: SettingsData) => ({
  fast: settings.modelPrefs.fast,
  strong: settings.modelPrefs.strong,
  nativeLang: settings.nativeLang,
  correctionMode: settings.settings.correctionMode,
  strictness: settings.settings.strictness,
});

function PreferencesCard({ settings }: { settings: SettingsData }) {
  const update = useUpdateSettings();
  const [form, setForm] = useState(() => formFrom(settings));
  // Reload the form whenever the saved settings change (after saving, or from another device).
  const [seen, setSeen] = useState(settings);
  if (seen !== settings) {
    setSeen(settings);
    setForm(formFrom(settings));
  }

  const models: Option[] = settings.freeModels.map((m) => ({ value: m.id, label: m.label, note: m.note }));
  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Card style={{ gap: 16 }}>
      <SectionTitle icon="options-outline" title="Preferences" sub="Models and how the coach corrects you" />
      <PickerField label="Fast model (chat replies, topics, test questions)" value={form.fast} options={models} onChange={set('fast')} />
      <PickerField label="Stronger model (grading, reports, phrase practice)" value={form.strong} options={models} onChange={set('strong')} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="shield-checkmark-outline" size={16} color="success" />
        <AppText variant="caption" color="muted" style={{ flex: 1 }}>
          Only models with a free tier are offered. They cost nothing as long as your key’s Google project has no billing enabled.
        </AppText>
      </View>

      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" color="text2">Explain corrections in</AppText>
        <Segmented label="Language" options={LANGUAGES} value={form.nativeLang} onChange={set('nativeLang')} />
      </View>
      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" color="text2">Corrections</AppText>
        <Segmented
          label="Corrections"
          options={[{ value: 'every', label: 'After every message' }, { value: 'end', label: 'At the end' }]}
          value={form.correctionMode}
          onChange={set('correctionMode')}
        />
      </View>
      <View style={{ gap: 6 }}>
        <AppText variant="small" weight="700" color="text2">Strictness</AppText>
        <Segmented
          label="Strictness"
          options={[{ value: 'gentle', label: 'Gentle' }, { value: 'normal', label: 'Normal' }, { value: 'strict', label: 'Strict' }]}
          value={form.strictness}
          onChange={set('strictness')}
        />
        <AppText variant="caption" color="muted">
          {form.strictness === 'gentle' ? 'Only clear mistakes.' : form.strictness === 'strict' ? 'Also style and word choice.' : 'Clear grammar and word-choice mistakes.'}
        </AppText>
      </View>

      <Button
        title="Save changes"
        loading={update.isPending}
        onPress={() =>
          update.mutate({
            nativeLang: form.nativeLang,
            settings: { correctionMode: form.correctionMode, strictness: form.strictness },
            modelPrefs: { fast: form.fast, strong: form.strong },
          })
        }
      />
      {update.isSuccess ? <Status ok>Saved.</Status> : null}
      <ErrorBanner error={update.error} />
    </Card>
  );
}

export default function Settings() {
  const { data, isLoading, error, refetch } = useSettings();
  const email = useAuth((s) => s.user?.email);

  const signOut = async () => {
    if (await confirmAsync('Sign out?', 'You can sign back in any time.', 'Sign out', true)) await useAuth.getState().logout();
  };

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <SectionTitle icon="person-circle-outline" title="Account" sub={data?.email ?? email ?? ''} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button title="Guide · Aide · دليل" icon="book-outline" variant="soft" size="sm" accessibilityLabel="Open the guide" onPress={() => router.push('/guide')} />
          <Button title="Retake the level test" icon="trophy-outline" variant="soft" size="sm" onPress={() => router.push('/placement')} />
          <Button title="Sign out" icon="log-out-outline" variant="ghost" size="sm" onPress={signOut} />
        </View>
      </Card>

      {isLoading ? <Loading /> : null}
      {error && !data ? <ErrorBanner error={error} onRetry={() => refetch()} /> : null}
      {data ? (
        <>
          <KeyCard settings={data} />
          <PreferencesCard settings={data} />
        </>
      ) : null}

      <Card style={{ gap: 10 }}>
        <SectionTitle icon="server-outline" title="Server" sub="Where English Coach runs" />
        <ServerBox forceOpen />
      </Card>

      <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>
        English Coach {Constants.expoConfig?.version ?? ''}
      </AppText>
    </Screen>
  );
}
