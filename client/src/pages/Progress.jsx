import { Flame, MessagesSquare, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import ActivityChart from '../components/charts/ActivityChart';
import BarList from '../components/charts/BarList';
import ScoreChart from '../components/charts/ScoreChart';
import StatTile from '../components/charts/StatTile';
import { ErrorBanner, Spinner } from '../components/ui';
import { useProgress } from '../hooks/useProgress';
import { shortDate } from '../lib/chart';
import { MISTAKE_LABEL } from '../lib/mistakes';
import { FOCUS_UI, LEVELS } from '../lib/skills';

export default function Progress() {
  const { data: p, isLoading, error, refetch } = useProgress();

  if (isLoading) return <div className="grid place-items-center py-24 text-violet-500"><Spinner className="size-7" /></div>;
  if (error) return <ErrorBanner error={error} onRetry={() => refetch()} />;

  const { streak, activity, totals, sessions, mistakeTypes, levels, skills } = p;
  const level = levels.at(-1);
  const kept = totals.words + totals.phrases;
  const hasData = totals.messages + totals.reviews + totals.corrections + kept + sessions.length > 0 || levels.length > 0;
  const last14 = (key) => activity.slice(-14).map((d) => d[key]);

  const mistakeRows = mistakeTypes.map((m) => ({ label: MISTAKE_LABEL[m.type] ?? m.type, value: m.count }));
  const skillRows = [...skills].sort((a, b) => a.score - b.score).map((s) => ({ label: FOCUS_UI[s.skill]?.label ?? s.skill, value: s.score, detail: `${s.count} ${s.count === 1 ? 'question' : 'questions'}` }));

  return (
    <div className="space-y-5">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Your progress</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">What you have done, and where to focus next.</p>
      </div>

      {/* The one number this page leads with. */}
      <section className="chart-card viz-root flex items-center gap-5 !p-6" aria-label="Day streak">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-glow">
          <Flame className="size-8" aria-hidden="true" />
        </span>
        <div>
          <p className="text-6xl font-semibold leading-none tracking-tight">{streak.current}</p>
          <p className="mt-1.5 text-sm font-semibold" style={{ color: 'var(--viz-text-2)' }}>
            day streak
            {streak.best > streak.current && ` · best ${streak.best}`}
          </p>
        </div>
        <p className="ml-auto hidden max-w-48 text-right text-sm sm:block" style={{ color: 'var(--viz-text-2)' }}>
          {streak.current > 0 ? 'Keep it going: chat or review today.' : 'Chat or review today to start a streak.'}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Level"
          value={level?.level ?? '—'}
          note={level ? `${LEVELS[level.level].name}${levels.length > 1 ? `, up from ${levels.at(-2).level}` : ''}` : 'Take the level test'}
        />
        <StatTile
          label="Messages, 30 days"
          value={totals.messages}
          delta={totals.messagesBefore > 0 || totals.messages > 0 ? totals.messages - totals.messagesBefore : null}
          deltaLabel="vs prior 30"
          trend={last14('messages')}
        />
        <StatTile
          label="Reviews, 30 days"
          value={totals.reviews}
          delta={totals.reviewsBefore > 0 || totals.reviews > 0 ? totals.reviews - totals.reviewsBefore : null}
          deltaLabel="vs prior 30"
          trend={last14('reviews')}
        />
        <StatTile label="Remembered" value={totals.remembered == null ? '—' : `${totals.remembered}%`} note={totals.remembered == null ? 'Review some cards first' : 'of answers were Good or Easy'} />
      </div>

      {!hasData ? (
        <div className="card space-y-3 py-10 text-center">
          <TrendingUp className="mx-auto size-9 text-violet-400" aria-hidden="true" />
          <h2 className="text-lg font-bold">Nothing to chart yet</h2>
          <p className="mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">Have a conversation or review a few cards and your progress will appear here.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/chat" className="btn-primary"><MessagesSquare className="size-4" aria-hidden="true" /> Start a chat</Link>
            <Link to="/review" className="btn-ghost">Review</Link>
          </div>
        </div>
      ) : (
        <>
          <ActivityChart days={activity} />

          {sessions.length >= 2 ? (
            <ScoreChart sessions={sessions} />
          ) : sessions.length === 1 ? (
            <StatTile label="Score of your first finished conversation" value={sessions[0].score} note="Finish a second one to see a trend." />
          ) : null}

          {mistakeRows.length > 0 && (
            <BarList
              title="Your mistakes by type"
              subtitle={`Most common: ${mistakeRows[0].label.toLowerCase()} (${totals.corrections} corrections in all)`}
              rows={mistakeRows}
              valueLabel="Mistakes"
              caption="Mistakes the coach corrected, by type"
            />
          )}

          {skillRows.length > 0 && (
            <BarList
              title="Skills from your level test"
              subtitle={`Weakest first. Taken ${shortDate(levels.at(-1).at)}.`}
              rows={skillRows}
              max={100}
              unit="%"
              valueLabel="Score"
              caption="Score per skill in the latest level test"
            />
          )}

          <p className="px-1 text-center text-sm text-slate-500 dark:text-slate-400">
            {totals.words} {totals.words === 1 ? 'word' : 'words'} and {totals.phrases} {totals.phrases === 1 ? 'phrase' : 'phrases'} saved
          </p>
        </>
      )}
    </div>
  );
}
