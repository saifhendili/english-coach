import { ArrowRight, BookMarked, Check, Compass, KeyRound, MessagesSquare, Quote, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LevelBadge, Spinner } from '../components/ui';
import { useInterests } from '../hooks/useInterests';
import { useReviewSummary } from '../hooks/useReview';
import { usePlacementStatus } from '../hooks/usePlacement';
import { useSettings } from '../hooks/useSettings';
import { LEVELS } from '../lib/skills';

function Step({ icon: Icon, title, text, state, to, cta }) {
  const done = state === 'done';
  const current = state === 'current';
  const body = (
    <div
      className={`card flex items-center gap-4 !p-4 transition ${
        current ? 'ring-2 ring-violet-500/50' : ''
      } ${state === 'soon' ? 'opacity-60' : ''}`}
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
          done
            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
            : current
              ? 'bg-brand text-white shadow-glow'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {done ? <Check className="size-6" aria-hidden="true" /> : <Icon className="size-6" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      {current && cta && <ArrowRight className="size-5 shrink-0 text-violet-500" aria-label={cta} />}
      {state === 'soon' && <span className="chip !bg-slate-100 !text-slate-500 dark:!bg-slate-800">Soon</span>}
    </div>
  );
  return to && state !== 'soon' ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function Home() {
  const { data, isLoading, error } = useSettings();
  const placement = usePlacementStatus();
  const interests = useInterests();
  const reviewSummary = useReviewSummary();
  const due = reviewSummary.data?.due ?? 0;

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24 text-violet-500">
        <Spinner className="size-7" />
      </div>
    );
  }
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const hasKey = data.hasKey;
  const level = data.level;
  const resuming = placement.data?.inProgress;
  const hasInterests = Boolean(interests.data?.saved);
  const focusLabels = (interests.data?.focus ?? [])
    .map((id) => interests.data.focusOptions.find((o) => o.id === id)?.label)
    .filter(Boolean);

  const hero = !hasKey
    ? {
        title: 'Let’s get you set up',
        text: 'Add your Gemini API key and the coach can start writing questions for you.',
        to: '/settings',
        cta: 'Add your key',
        icon: KeyRound,
      }
    : !level
      ? {
          title: resuming ? 'Pick up where you left off' : 'Find your level',
          text: resuming
            ? `You’ve answered ${resuming.answered} questions so far.`
            : 'About 15 questions that adapt to you. It takes around 10 minutes.',
          to: '/placement',
          cta: resuming ? 'Resume the test' : 'Start the level test',
          icon: Target,
        }
      : !hasInterests && interests.isSuccess
        ? {
            title: 'Make it yours',
            text: 'Tell us what you like talking about and what you want to improve: speaking, grammar and more.',
            to: '/interests',
            cta: 'Pick your interests',
            icon: Sparkles,
          }
        : null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-white shadow-glow sm:p-8">
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-10 size-48 rounded-full bg-sky-300/20 blur-3xl" />
        {hero ? (
          <div className="relative">
            <hero.icon className="mb-4 size-9 text-white/90" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold sm:text-3xl">{hero.title}</h1>
            <p className="mt-2 max-w-md text-white/80">{hero.text}</p>
            <Link
              to={hero.to}
              className="btn mt-6 bg-white text-violet-700 shadow-lg hover:bg-white/90"
            >
              {hero.cta} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="relative flex items-center gap-5">
            <LevelBadge level={level} size="xl" />
            <div>
              <p className="text-sm font-semibold text-white/70">Your level</p>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{LEVELS[level].name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {due > 0 ? (
                  <Link to="/review" className="btn bg-white !px-4 !py-2 text-violet-700 shadow-lg hover:bg-white/90">
                    Review {due} {due === 1 ? 'card' : 'cards'} <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link to="/topics" className="btn bg-white !px-4 !py-2 text-violet-700 shadow-lg hover:bg-white/90">
                    Explore topics <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
                <Link to="/placement" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:underline">
                  Results or retake
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="journey">
        <h2 id="journey" className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your journey
        </h2>
        <div className="space-y-3">
          <Step
            icon={KeyRound}
            title="Connect Gemini"
            text={hasKey ? `Key ${data.keyHint} saved` : 'Add your free API key'}
            state={hasKey ? 'done' : 'current'}
            to="/settings"
            cta="Open settings"
          />
          <Step
            icon={Target}
            title="Find your level"
            text={level ? `You’re at ${level}. Retake any time.` : 'An adaptive test, five skills'}
            state={level ? 'done' : hasKey ? 'current' : 'todo'}
            to="/placement"
            cta="Open test"
          />
          <Step
            icon={Sparkles}
            title="Pick your interests"
            text={
              hasInterests
                ? `${interests.data.fields.length} interests · improving ${focusLabels.join(', ').toLowerCase()}`
                : 'What you like, and what to improve'
            }
            state={hasInterests ? 'done' : hasKey && level ? 'current' : 'todo'}
            to="/interests"
            cta="Open"
          />
          <Step
            icon={Compass}
            title="Explore topics"
            text="Endless conversation ideas, made for you"
            state={hasInterests ? 'current' : 'todo'}
            to={hasInterests ? '/topics' : '/interests'}
            cta="Open"
          />
          <Step
            icon={MessagesSquare}
            title="Practise talking"
            text="Chat with the coach and get corrections"
            state={hasInterests ? 'current' : 'todo'}
            to="/chat"
            cta="Open"
          />
          <Step
            icon={Quote}
            title="Power phrases"
            text="Natural expressions to save and practise"
            state="current"
            to="/phrases"
            cta="Open"
          />
          <Step
            icon={BookMarked}
            title="Review & remember"
            text={
              due > 0
                ? `${due} ${due === 1 ? 'card is' : 'cards are'} waiting`
                : reviewSummary.data?.totalCards
                  ? 'All caught up. Cards return when it is time.'
                  : 'Your saved words and mistakes, back at the right time'
            }
            state={due > 0 ? 'current' : reviewSummary.data?.totalCards ? 'done' : 'todo'}
            to="/review"
            cta="Open"
          />
          <Step icon={TrendingUp} title="Your progress" text="Streak, activity, scores and weak spots" state="todo" to="/progress" cta="Open" />
        </div>
      </section>
    </div>
  );
}
