import { motion } from 'framer-motion';
import { ArrowRight, Check, Lightbulb, MessageSquare, PencilLine, Target, TrendingUp } from 'lucide-react';
import SaveButton from '../SaveButton';
import { Spinner } from '../ui';

function ScoreRing({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid size-36 place-items-center" role="img" aria-label={`Score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-white/25" />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-white"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center text-white">
        <p className="text-4xl font-extrabold leading-none">{score}</p>
        <p className="mt-1 text-xs font-semibold text-white/75">of 100</p>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, tone, children }) {
  return (
    <section className="card space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <span className={`grid size-7 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

// The report shown when a conversation is over.
export default function Summary({ session, onStartNext, starting }) {
  const { report, stats } = session;

  // Things worth keeping from this chat, once each.
  const phrases = [...new Map(session.messages.flatMap((m) => m.phrases).map((p) => [p.better.toLowerCase(), p])).values()];
  const words = [...new Map(session.messages.flatMap((m) => m.newWords).map((w) => [w.word.toLowerCase(), w])).values()];

  return (
    <div className="space-y-4">
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-white shadow-glow"
      >
        <div className="absolute -right-12 -top-12 size-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-5">
          {report ? (
            <ScoreRing score={report.score} />
          ) : (
            <span className="grid size-28 place-items-center rounded-full bg-white/15">
              <MessageSquare className="size-10" aria-hidden="true" />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-white/75">Conversation finished</p>
            <h2 className="text-xl font-extrabold leading-tight">{session.title}</h2>
            {stats && (
              <p className="mt-2 text-sm text-white/80">
                {stats.turns} {stats.turns === 1 ? 'message' : 'messages'} · {stats.mistakes}{' '}
                {stats.mistakes === 1 ? 'correction' : 'corrections'} · {stats.minutes} min
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {!report && (
        <p className="card text-center text-slate-500 dark:text-slate-400">
          {session.turns === 0 ? 'You did not write anything, so there is no report.' : 'The report could not be written this time.'}
        </p>
      )}

      {report && (
        <>
          <p className="card leading-relaxed">{report.summary}</p>

          {report.strengths.length > 0 && (
            <Section icon={Check} title="What went well" tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <ul className="space-y-2 text-sm leading-relaxed">
                {report.strengths.map((s) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {report.topMistakes.length > 0 && (
            <Section icon={TrendingUp} title="Work on these" tone="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <ul className="space-y-3">
                {report.topMistakes.map((m) => (
                  <li key={m.pattern} className="text-sm leading-relaxed">
                    <p className="font-bold">{m.pattern}</p>
                    <p className="text-slate-500 dark:text-slate-400">{m.example}</p>
                    <p className="mt-0.5">{m.tip}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {(phrases.length > 0 || words.length > 0) && (
        <Section icon={PencilLine} title="Worth keeping" tone="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
          <ul className="space-y-2">
            {phrases.map((p) => (
              <li key={p.better} className="flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 py-2 pl-3 pr-2 dark:bg-slate-800/60">
                <span className="text-sm">
                  <strong>{p.better}</strong>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{p.why}</span>
                </span>
                <SaveButton compact item={{ kind: 'phrase', text: p.better, meaning: p.why, source: 'chat', sessionId: session.id }} />
              </li>
            ))}
            {words.map((w) => (
              <li key={w.word} className="flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 py-2 pl-3 pr-2 dark:bg-slate-800/60">
                <span className="text-sm">
                  <strong>{w.word}</strong> <span className="text-slate-500 dark:text-slate-400">{w.translation ?? w.meaning}</span>
                </span>
                <SaveButton compact item={{ kind: 'word', text: w.word, meaning: w.meaning, translation: w.translation ?? '', source: 'chat', sessionId: session.id }} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report?.nextTopic && (
        <Section icon={Target} title="Try next" tone="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
          <div>
            <p className="font-bold">{report.nextTopic.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{report.nextTopic.why}</p>
          </div>
          <button className="btn-primary w-full" disabled={starting} onClick={() => onStartNext(report.nextTopic.title)}>
            {starting ? <Spinner className="size-4" /> : <Lightbulb className="size-4" aria-hidden="true" />}
            Start this conversation <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </Section>
      )}
    </div>
  );
}
