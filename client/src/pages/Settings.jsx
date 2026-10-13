import { BadgeCheck, Check, CircleAlert, Eye, EyeOff, KeyRound, ShieldCheck, SlidersHorizontal, Trash2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Spinner } from '../components/ui';
import { useSettings, useTestKey, useUpdateSettings } from '../hooks/useSettings';

function Status({ ok, children }) {
  const Icon = ok ? Check : CircleAlert;
  return (
    <p
      role="status"
      className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
        ok
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-bold leading-tight">{children}</h2>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function KeyCard({ settings }) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const update = useUpdateSettings();
  const test = useTestKey();
  const typed = value.trim();

  const run = (mutation, vars, options) => {
    update.reset();
    test.reset();
    mutation.mutate(vars, options);
  };

  return (
    <section className="card">
      <SectionTitle icon={KeyRound} sub="Your own free key from Google AI Studio">
        Gemini API key
      </SectionTitle>

      <p className="mb-4 flex items-start gap-2 rounded-xl bg-slate-100/80 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
        Stored encrypted on the server and never sent back to the browser in full.
      </p>

      {settings.hasKey && (
        <p className="mb-4 text-sm">
          Saved key: <span className="rounded-lg bg-emerald-100 px-2 py-1 font-mono text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{settings.keyHint}</span>
        </p>
      )}

      <label className="label" htmlFor="gemini-key">
        {settings.hasKey ? 'Replace key' : 'API key'}
      </label>
      <div className="flex gap-2">
        <input
          id="gemini-key"
          className="input font-mono"
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          placeholder="AIza…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          className="btn-ghost shrink-0 !px-3.5"
          aria-pressed={visible}
          aria-label={visible ? 'Hide key' : 'Show key'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          className="btn-ghost"
          disabled={test.isPending || (!typed && !settings.hasKey)}
          onClick={() => run(test, typed || undefined)}
        >
          {test.isPending ? <Spinner className="size-4" /> : <Zap className="size-4" aria-hidden="true" />}
          {test.isPending ? 'Testing…' : 'Test key'}
        </button>
        <button
          className="btn-primary"
          disabled={update.isPending || typed.length < 20}
          onClick={() => run(update, { geminiKey: typed }, { onSuccess: () => setValue('') })}
        >
          Save key
        </button>
        {settings.hasKey && (
          <button
            className="btn-danger"
            disabled={update.isPending}
            onClick={() => {
              if (window.confirm('Remove your Gemini key? Generation stops until you add one.')) {
                run(update, { geminiKey: null });
              }
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove key
          </button>
        )}
      </div>

      {test.isSuccess && <Status ok>Valid. Gemini answered using {test.data.model}.</Status>}
      {test.error && <Status>Invalid: {test.error.message}</Status>}
      {update.error && <Status>{update.error.message}</Status>}
    </section>
  );
}

function Field({ id, label, children }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ModelField({ id, label, value, onChange, models }) {
  const current = models.find((m) => m.id === value);
  return (
    <Field id={id} label={label}>
      <select id={id} className="input" value={value} onChange={onChange}>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {current && <p className="hint">{current.note}</p>}
    </Field>
  );
}

function PreferencesCard({ settings }) {
  const update = useUpdateSettings();

  const [form, setForm] = useState(null);
  // (Re)load the form whenever the saved settings change.
  useEffect(() => {
    setForm({
      fast: settings.modelPrefs.fast,
      strong: settings.modelPrefs.strong,
      nativeLang: settings.nativeLang,
      correctionMode: settings.settings.correctionMode,
      strictness: settings.settings.strictness,
    });
  }, [settings]);
  if (!form) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = (e) => {
    e.preventDefault();
    update.mutate({
      nativeLang: form.nativeLang,
      settings: { correctionMode: form.correctionMode, strictness: form.strictness },
      modelPrefs: { fast: form.fast, strong: form.strong },
    });
  };

  return (
    <form className="card space-y-5" onSubmit={save}>
      <SectionTitle icon={SlidersHorizontal} sub="Models and how the coach corrects you">
        Preferences
      </SectionTitle>

      <ModelField id="fast" label="Fast model (chat replies and corrections, topics, test questions)" value={form.fast} onChange={set('fast')} models={settings.freeModels} />
      <ModelField id="strong" label="Stronger model (grading, session reports, phrase practice)" value={form.strong} onChange={set('strong')} models={settings.freeModels} />
      <p className="-mt-2 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
        Only models that have a free tier are offered. They cost nothing as long as your key’s Google project has no
        billing enabled. A different model for each job also gives you a separate free quota for each.
      </p>

      <hr className="border-slate-200/70 dark:border-slate-700/60" />

      <Field id="lang" label="Explain corrections in">
        <select id="lang" className="input" value={form.nativeLang} onChange={set('nativeLang')}>
          <option value="en">English only</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </Field>
      <Field id="mode" label="Corrections">
        <select id="mode" className="input" value={form.correctionMode} onChange={set('correctionMode')}>
          <option value="every">After every message</option>
          <option value="end">Only at the end of the session</option>
        </select>
      </Field>
      <Field id="strict" label="Strictness">
        <select id="strict" className="input" value={form.strictness} onChange={set('strictness')}>
          <option value="gentle">Gentle: only clear mistakes</option>
          <option value="normal">Normal</option>
          <option value="strict">Strict: also style and word choice</option>
        </select>
      </Field>

      <button className="btn-primary w-full sm:w-auto" disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save changes'}
      </button>
      {update.isSuccess && <Status ok>Saved.</Status>}
      {update.error && <Status>{update.error.message}</Status>}
    </form>
  );
}

export default function Settings() {
  const { data, isLoading, error } = useSettings();

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24 text-violet-500">
        <Spinner className="size-7" />
      </div>
    );
  }
  if (error) return <p className="text-rose-600">{error.message}</p>;

  return (
    <div className="space-y-5">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as {data.email}</p>
      </div>
      <KeyCard settings={data} />
      <PreferencesCard settings={data} />
    </div>
  );
}
