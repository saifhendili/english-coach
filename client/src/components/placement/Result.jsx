import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Lightbulb, Minus, RotateCcw, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LEVELS, SKILLS } from '../../lib/skills';
import { LevelBadge } from '../ui';

function SkillBar({ type, score, count, delay }) {
  const skill = SKILLS[type];
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm font-semibold">
        <span className="flex items-center gap-2">
          <skill.icon className="size-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          {skill.label}
          <span className="text-xs font-medium text-slate-400">
            {count} {count === 1 ? 'question' : 'questions'}
          </span>
        </span>
        <span>{score}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
        <motion.div
          className={`h-full rounded-full bg-linear-to-r ${skill.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(score, 3)}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function List({ title, items, icon: Icon, tone }) {
  return (
    <div>
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold">
        <span className={`grid size-6 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        {title}
      </h3>
      <ul className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const verdict = (score) =>
  score >= 0.75
    ? { icon: Check, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', label: 'Correct' }
    : score >= 0.4
      ? { icon: Minus, cls: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', label: 'Partly right' }
      : { icon: X, cls: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', label: 'Missed' };

function ReviewItem({ q }) {
  const v = verdict(q.score);
  const skill = SKILLS[q.type];
  return (
    <details className="group rounded-2xl border border-slate-200/80 bg-white/60 dark:border-slate-700/70 dark:bg-slate-900/40">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5 [&::-webkit-details-marker]:hidden">
        <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${v.cls}`} title={v.label}>
          <v.icon className="size-4" aria-label={v.label} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <skill.icon className="size-3.5" aria-hidden="true" /> {skill.label} · {q.level}
          </span>
          <span className="line-clamp-1 text-sm font-semibold">{q.prompt.replace(/_{2,}/g, '____')}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="space-y-3 border-t border-slate-200/70 p-4 text-sm dark:border-slate-700/60">
        {q.passage && <p className="rounded-xl bg-emerald-50/70 p-3 leading-relaxed dark:bg-emerald-500/[0.06]">{q.passage}</p>}
        <p className="font-semibold">{q.prompt.replace(/_{2,}/g, '____')}</p>

        {q.options ? (
          <>
            <ul className="space-y-1.5">
              {q.options.map((o, i) => {
                const correct = i === q.correctIndex;
                const mine = i === q.yourChoice;
                return (
                  <li
                    key={i}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${
                      correct
                        ? 'bg-emerald-100/80 font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                        : mine
                          ? 'bg-rose-100/80 font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-200'
                          : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{o}</span>
                    {correct && <span className="text-xs">Correct answer</span>}
                    {mine && !correct && <span className="text-xs">Your answer</span>}
                  </li>
                );
              })}
            </ul>
            {q.skipped && <p className="text-slate-500">You skipped this one.</p>}
            {q.explanation && <p className="text-slate-600 dark:text-slate-300">{q.explanation}</p>}
          </>
        ) : (
          <>
            {q.yourText ? (
              <blockquote className="rounded-xl border-l-4 border-violet-400 bg-violet-50/70 p-3 italic leading-relaxed dark:bg-violet-500/10">
                {q.yourText}
              </blockquote>
            ) : (
              <p className="text-slate-500">You skipped this one.</p>
            )}
            {q.grade && (
              <>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="chip">Shows {q.grade.cefrLevel}</span>
                  <span className="chip">Grammar {q.grade.grammar}/10</span>
                  <span className="chip">Vocabulary {q.grade.vocabulary}/10</span>
                  <span className="chip">{q.type === 'speaking' ? 'Fluency' : 'Coherence'} {q.grade.fluency}/10</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{q.grade.feedback}</p>
              </>
            )}
          </>
        )}
      </div>
    </details>
  );
}

export default function Result({ result, onRetake }) {
  const { level, answered, breakdown, feedback, review } = result;
  const skills = Object.entries(breakdown);

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[2rem] bg-brand p-8 text-center text-white shadow-glow"
      >
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 size-48 rounded-full bg-sky-300/20 blur-3xl" />
        <p className="relative text-sm font-semibold text-white/75">Your English level is</p>
        <div className="relative my-4 flex justify-center">
          <motion.div initial={{ rotate: -8, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}>
            <LevelBadge level={level} size="xl" />
          </motion.div>
        </div>
        <h1 className="relative text-2xl font-extrabold">{LEVELS[level].name}</h1>
        <p className="relative mt-1 text-sm text-white/70">Based on {answered} questions</p>
      </motion.section>

      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Your skills</h2>
        {skills.map(([type, s], i) => (
          <SkillBar key={type} type={type} score={s.score} count={s.count} delay={0.2 + i * 0.1} />
        ))}
      </section>

      {feedback && (
        <section className="card space-y-5">
          <p className="leading-relaxed">{feedback.summary}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <List title="Strengths" items={feedback.strengths} icon={Check} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" />
            <List title="To work on" items={feedback.weaknesses} icon={TrendingUp} tone="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" />
          </div>
          <List title="Next steps" items={feedback.nextSteps} icon={Lightbulb} tone="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" />
        </section>
      )}

      <section>
        <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Review your answers
        </h2>
        <div className="space-y-2.5">
          {review.map((q) => (
            <ReviewItem key={q.index} q={q} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn-primary flex-1">
          Back to home <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button className="btn-ghost flex-1" onClick={onRetake}>
          <RotateCcw className="size-4" aria-hidden="true" /> Retake the test
        </button>
      </div>
    </div>
  );
}
