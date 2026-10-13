import { AlertCircle, Loader2, RotateCw } from 'lucide-react';
import { LEVELS } from '../lib/skills';

// Same mark as the PWA icon: a speech bubble with three dots.
export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.52" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-g)" />
      <path d="M14 20a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8H31l-9 8v-8a8 8 0 0 1-8-8z" fill="#fff" />
      <circle cx="24" cy="26.5" r="3" fill="#7c3aed" />
      <circle cx="32" cy="26.5" r="3" fill="#7c3aed" />
      <circle cx="40" cy="26.5" r="3" fill="#7c3aed" />
    </svg>
  );
}

export function LevelBadge({ level, size = 'md' }) {
  const style = LEVELS[level];
  if (!style) return null;
  const sizes = {
    sm: 'h-7 min-w-9 px-2 text-xs rounded-lg',
    md: 'h-11 min-w-14 px-3 text-lg rounded-2xl',
    xl: 'h-28 min-w-28 px-5 text-5xl rounded-[2rem]',
  };
  return (
    <span
      className={`inline-flex items-center justify-center bg-linear-to-br font-extrabold text-white shadow-lg ${style.gradient} ${sizes[size]}`}
    >
      {level}
    </span>
  );
}

export function Spinner({ className = 'size-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

const TIPS = {
  RATE_LIMITED: 'Free Gemini keys have a per-minute quota. Wait a minute, then try again.',
  QUOTA_DAILY: 'Free models have a daily limit that resets at midnight Pacific time. Pick a different model in Settings, or come back later.',
  GEMINI_TIMEOUT: 'Gemini is slow right now. Trying again usually works.',
  GEMINI_OVERLOADED: 'Gemini is busy. Trying again in a moment usually works.',
};

export function ErrorBanner({ error, onRetry, retryLabel = 'Try again' }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm dark:border-rose-900/60 dark:bg-rose-950/40"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-500" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-rose-800 dark:text-rose-200">{error.message}</p>
        {TIPS[error.code] && <p className="mt-1 text-rose-700/80 dark:text-rose-300/70">{TIPS[error.code]}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
          >
            <RotateCw className="size-3.5" aria-hidden="true" />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
