import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Check, Mic, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Logo, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

// A small live demo of what the app does: you speak, it corrects you kindly.
function CorrectionDemo() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="ml-auto w-fit max-w-[85%] animate-float-slow rounded-3xl rounded-br-lg bg-white/95 px-4 py-3 text-slate-800 shadow-xl">
        <p className="text-xs font-semibold text-slate-400">You</p>
        <p className="font-medium">
          I <span className="text-rose-500 line-through decoration-2">go</span> to gym yesterday
        </p>
      </div>
      <div className="w-fit max-w-[92%] animate-float rounded-3xl rounded-bl-lg border border-white/30 bg-white/15 px-4 py-3 text-white shadow-xl backdrop-blur-md">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-white/70">
          <Sparkles className="size-3.5" aria-hidden="true" /> Coach
        </p>
        <p className="flex items-center gap-2 font-semibold">
          <Check className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
          I went to the gym yesterday
        </p>
        <p className="mt-1 text-sm text-white/75">Use the past simple with “yesterday”, and add “the” before gym.</p>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Target, text: 'A placement test that adapts to your level' },
  { icon: Sparkles, text: 'Endless topics for the things you love' },
  { icon: Mic, text: 'Talk out loud, get gentle corrections' },
];

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { token, login } = useAuth();
  const navigate = useNavigate();

  const auth = useMutation({
    mutationFn: () => api(`/auth/${mode}`, { method: 'POST', body: { email, password } }),
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate('/', { replace: true });
    },
  });

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3 text-xl font-extrabold">
          <Logo size={40} /> English Coach
        </div>
        <div className="relative space-y-10">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">
              Speak English
              <br />
              with confidence.
            </h2>
            <ul className="mt-6 space-y-3 text-white/90">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 font-medium">
                  <span className="grid size-8 place-items-center rounded-xl bg-white/15">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <CorrectionDemo />
        </div>
        <p className="relative text-sm text-white/60">Powered by your own Gemini key.</p>
      </section>

      <section className="flex flex-col justify-center px-5 py-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="lg:hidden">
              <Logo size={56} />
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight lg:mt-0">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-slate-500 dark:text-slate-400">
              {mode === 'login' ? 'Sign in to keep practising.' : 'Start your English journey in a minute.'}
            </p>
          </div>

          <form
            className="card space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              auth.mutate();
            }}
          >
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === 'register' && <p className="hint">At least 8 characters.</p>}
            </div>

            {auth.error && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {auth.error.message}
              </p>
            )}

            <button className="btn-primary w-full" disabled={auth.isPending}>
              {auth.isPending ? (
                <>
                  <Spinner className="size-4" /> Please wait…
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <button
            className="mt-5 w-full text-center text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400"
            onClick={() => {
              auth.reset();
              setMode(mode === 'login' ? 'register' : 'login');
            }}
          >
            {mode === 'login' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
          </button>
        </div>
      </section>
    </div>
  );
}
