import { motion } from 'framer-motion';
import { ArrowRight, Check, Plus, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBanner, Spinner } from '../components/ui';
import { useInterests, useSaveInterests, useSuggestFields } from '../hooks/useInterests';
import { FIELD_GROUPS, SEED_NAMES, tidyName } from '../lib/fields';
import { FOCUS_UI } from '../lib/skills';

const key = (name) => name.toLowerCase();

function FocusCard({ option, selected, suggested, onToggle }) {
  const ui = FOCUS_UI[option.id];
  const Icon = ui.icon;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition duration-150 active:scale-[0.98] ${
        selected
          ? 'border-violet-500 bg-violet-50 ring-4 ring-violet-500/15 dark:bg-violet-500/10'
          : 'border-slate-200/80 bg-white/70 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900/60'
      }`}
    >
      <span className="flex w-full items-start justify-between">
        <span
          className={`grid size-10 place-items-center rounded-xl bg-linear-to-br text-white shadow-md ${ui.bar}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span
          className={`grid size-6 place-items-center rounded-full border-2 transition ${
            selected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 dark:border-slate-600'
          }`}
          aria-hidden="true"
        >
          {selected && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </span>
      <span className="font-bold leading-tight">{option.label}</span>
      <span className="text-xs leading-snug text-slate-500 dark:text-slate-400">{option.description}</span>
      {suggested && (
        <span className="chip !bg-amber-100 !text-amber-700 dark:!bg-amber-500/15 dark:!text-amber-300">
          <Sparkles className="size-3" aria-hidden="true" /> Suggested by your test
        </span>
      )}
    </button>
  );
}

function FieldChip({ field, selected, onToggle }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition duration-150 active:scale-95 ${
        selected
          ? 'border-transparent bg-brand text-white shadow-glow'
          : 'border-slate-200/80 bg-white/70 text-slate-700 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200'
      }`}
    >
      <span aria-hidden="true">{field.emoji}</span>
      {field.name}
      {selected && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
    </button>
  );
}

export default function Interests() {
  const { data, isLoading, error } = useInterests();
  const save = useSaveInterests();
  const suggest = useSuggestFields();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(new Map()); // key -> {name, emoji}
  const [focus, setFocus] = useState(new Set());
  const [extras, setExtras] = useState([]); // fields outside the seed list: own + suggested
  const [custom, setCustom] = useState('');
  const [ready, setReady] = useState(false);

  // Load what is saved once. A first visit starts from the skills the test found weakest.
  useEffect(() => {
    if (!data || ready) return;
    setSelected(new Map(data.fields.map((f) => [key(f.name), f])));
    setExtras(data.fields.filter((f) => !SEED_NAMES.has(key(f.name))));
    setFocus(new Set(data.saved ? data.focus : data.suggestedFocus));
    setReady(true);
  }, [data, ready]);

  // Everything currently on screen (seed + own + suggested): what "More fields" must not repeat.
  const allFields = useMemo(() => [...FIELD_GROUPS.flatMap((g) => g.fields), ...extras], [extras]);
  const shown = useMemo(() => new Set(allFields.map((f) => key(f.name))), [allFields]);

  if (isLoading || !ready) {
    return (
      <div className="grid place-items-center py-24 text-violet-500">
        {error ? <p className="text-rose-600">{error.message}</p> : <Spinner className="size-7" />}
      </div>
    );
  }

  const toggleField = (f) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key(f.name))) next.delete(key(f.name));
      else next.set(key(f.name), f);
      return next;
    });
  const toggleFocus = (id) =>
    setFocus((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addCustom = (e) => {
    e.preventDefault();
    const name = tidyName(custom);
    if (name.length < 2) return;
    let field = allFields.find((f) => key(f.name) === key(name)); // already on screen: just select it
    if (!field) {
      field = { name, emoji: '✨' };
      setExtras((prev) => [...prev, field]);
    }
    setSelected((prev) => new Map(prev).set(key(field.name), field));
    setCustom('');
  };

  const moreFields = () =>
    suggest.mutate(
      { selected: [...selected.values()].map((f) => f.name), exclude: allFields.map((f) => f.name) },
      { onSuccess: ({ suggestions }) => setExtras((prev) => [...prev, ...suggestions.filter((x) => !shown.has(key(x.name)))]) },
    );

  const submit = () =>
    save.mutate(
      { fields: [...selected.values()], focus: [...focus] },
      { onSuccess: () => navigate('/topics') },
    );

  const canSave = selected.size >= 1 && focus.size >= 1;
  const suggestedNow = !data.saved ? new Set(data.suggestedFocus) : new Set();

  return (
    <div className="space-y-6">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Make it yours</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Two quick choices, and every topic will be about things you care about.
        </p>
      </div>

      <section className="card space-y-4" aria-labelledby="focus-title">
        <div>
          <h2 id="focus-title" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid size-7 place-items-center rounded-lg bg-brand text-sm font-extrabold text-white">1</span>
            What do you want to improve?
          </h2>
          <p className="hint">Pick as many as you like. Topics will include tips for these.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-labelledby="focus-title">
          {data.focusOptions.map((o) => (
            <FocusCard
              key={o.id}
              option={o}
              selected={focus.has(o.id)}
              suggested={suggestedNow.has(o.id)}
              onToggle={() => toggleFocus(o.id)}
            />
          ))}
        </div>
      </section>

      <section className="card space-y-5" aria-labelledby="fields-title">
        <div>
          <h2 id="fields-title" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid size-7 place-items-center rounded-lg bg-brand text-sm font-extrabold text-white">2</span>
            What do you like talking about?
          </h2>
          <p className="hint">Choose a few. You can always add more later.</p>
        </div>

        {FIELD_GROUPS.map((g) => (
          <div key={g.id}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {g.emoji} {g.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {g.fields.map((f) => (
                <FieldChip key={f.name} field={f} selected={selected.has(key(f.name))} onToggle={() => toggleField(f)} />
              ))}
            </div>
          </div>
        ))}

        {extras.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ✨ Yours and suggested
            </h3>
            <div className="flex flex-wrap gap-2">
              {extras.map((f) => (
                <FieldChip key={f.name} field={f} selected={selected.has(key(f.name))} onToggle={() => toggleField(f)} />
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-3 border-t border-slate-200/70 pt-4 dark:border-slate-700/60">
          <form onSubmit={addCustom} className="flex gap-2">
            <label className="sr-only" htmlFor="custom-field">
              Add your own interest
            </label>
            <input
              id="custom-field"
              className="input"
              placeholder="Add your own: chess, K-pop, farming…"
              maxLength={40}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <button className="btn-ghost shrink-0 !px-4" disabled={tidyName(custom).length < 2}>
              <Plus className="size-4" aria-hidden="true" /> Add
            </button>
          </form>

          <button type="button" className="btn-ghost w-full" onClick={moreFields} disabled={suggest.isPending}>
            {suggest.isPending ? <Spinner className="size-4" /> : <Wand2 className="size-4 text-violet-500" aria-hidden="true" />}
            {suggest.isPending ? 'Finding ideas…' : 'More fields'}
          </button>
          <ErrorBanner error={suggest.error} onRetry={moreFields} />
        </div>
      </section>

      <ErrorBanner error={save.error} />

      <div className="sticky bottom-24 z-10 md:bottom-4">
        <div className="card flex items-center justify-between gap-3 !rounded-2xl !p-3 shadow-2xl">
          <p className="pl-1 text-sm font-semibold" aria-live="polite">
            {canSave ? (
              <>
                {selected.size} {selected.size === 1 ? 'interest' : 'interests'} · {focus.size} to improve
              </>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                {focus.size === 0 ? 'Pick what to improve' : 'Pick at least one interest'}
              </span>
            )}
          </p>
          <button className="btn-primary" disabled={!canSave || save.isPending} onClick={submit}>
            {save.isPending ? <Spinner className="size-4" /> : null}
            {data.saved ? 'Save' : 'Save & see topics'} <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
