import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, Clock, Drama, Heart, MessageCircle, MessagesSquare, Puzzle, Scale } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from '../ui';
import { FOCUS_UI } from '../../lib/skills';

export const ANGLES = {
  debate: { label: 'Debate', icon: Scale },
  storytelling: { label: 'Storytelling', icon: BookOpen },
  'role-play': { label: 'Role-play', icon: Drama },
  opinion: { label: 'Opinion', icon: MessageCircle },
  'problem-solving': { label: 'Problem-solving', icon: Puzzle },
};

function Meta({ icon: Icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default function TopicCard({ topic, onToggleFavorite, onStart, starting }) {
  const [open, setOpen] = useState(false);
  const angle = ANGLES[topic.angle];
  const panelId = `topic-${topic.id}`;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card !p-0"
    >
      <div className="space-y-3 p-5 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Meta className="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            <span aria-hidden="true">{topic.emoji}</span> {topic.field}
          </Meta>
          {angle && (
            <Meta icon={angle.icon} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {angle.label}
            </Meta>
          )}
          <Meta icon={Clock} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {topic.durationMinutes} min
          </Meta>
          <Meta className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            {topic.level}
          </Meta>
        </div>

        <h3 className="text-xl font-extrabold leading-snug tracking-tight">{topic.title}</h3>
        <p className="border-l-4 border-violet-300 pl-3 text-[15px] italic leading-relaxed text-slate-600 dark:border-violet-500/50 dark:text-slate-300">
          “{topic.openers[0]}”
        </p>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-slate-200/70 px-5 py-5 dark:border-slate-700/60">
              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Conversation starters
                </h4>
                <ol className="space-y-2 text-[15px] leading-relaxed">
                  {topic.openers.map((q, i) => (
                    <li key={q} className="flex gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                        {i + 1}
                      </span>
                      {q}
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Key words
                </h4>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {topic.vocab.map((v) => (
                    <li key={v.word} className="rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-slate-800/60">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold">{v.word}</span>
                        {v.translation && (
                          <span className="text-sm font-semibold text-violet-600 dark:text-violet-300">{v.translation}</span>
                        )}
                      </p>
                      <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{v.meaning}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl bg-brand p-4 text-white">
                <h4 className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/75">
                  <Drama className="size-4" aria-hidden="true" /> Role-play
                </h4>
                <p className="leading-relaxed">{topic.scenario}</p>
                <button
                  type="button"
                  disabled={Boolean(starting)}
                  onClick={() => onStart(topic, 'roleplay')}
                  className="btn mt-3 bg-white !px-4 !py-2 text-violet-700 hover:bg-white/90"
                >
                  {starting === 'roleplay' ? <Spinner className="size-4" /> : <Drama className="size-4" aria-hidden="true" />}
                  Play this scene
                </button>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Your focus
                </h4>
                <ul className="space-y-2">
                  {topic.focusTips.map((t) => {
                    const ui = FOCUS_UI[t.skill];
                    return (
                      <li key={t.skill + t.tip} className="flex gap-3 text-sm leading-relaxed">
                        <span
                          className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-linear-to-br text-white ${ui.bar}`}
                        >
                          <ui.icon className="size-4" aria-hidden="true" />
                        </span>
                        <span>
                          <strong>{ui.label}.</strong> {t.tip}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 px-3 py-2.5 dark:border-slate-700/60">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
        >
          {open ? 'Hide details' : 'Show details'}
          <ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={topic.favorite}
            aria-label={topic.favorite ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => onToggleFavorite(topic)}
            className="grid size-10 place-items-center rounded-xl transition hover:bg-rose-50 active:scale-90 dark:hover:bg-rose-500/10"
          >
            <Heart
              className={`size-5 transition ${topic.favorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            disabled={Boolean(starting)}
            onClick={() => onStart(topic, 'talk')}
            className="btn-primary !px-4 !py-2"
          >
            {starting === 'talk' ? <Spinner className="size-4" /> : <MessagesSquare className="size-4" aria-hidden="true" />} Talk
          </button>
        </div>
      </div>
    </motion.article>
  );
}
