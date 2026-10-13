import { Mic, Square } from 'lucide-react';
import { Spinner } from './ui';

// The microphone button for voice input (see useVoiceInput). Tap to start, tap again to stop.
//   round: the small button beside a text box   big: a large button on its own   pill: a button with a label
export default function VoiceButton({ voice, variant = 'round', disabled = false }) {
  if (!voice.visible) return null;

  const { listening, transcribing } = voice;
  const label = transcribing ? 'Turning your voice into text' : listening ? 'Stop recording' : 'Speak instead of typing';
  const icon = transcribing ? (
    <Spinner className="relative size-5" />
  ) : listening ? (
    <Square className="relative size-5 fill-current" aria-hidden="true" />
  ) : (
    <Mic className="relative size-5" aria-hidden="true" />
  );
  const ring = listening && <span className="absolute inset-0 animate-ring rounded-full bg-rose-500/50" aria-hidden="true" />;
  const common = { type: 'button', onClick: voice.toggle, disabled: disabled || transcribing, 'aria-pressed': listening, 'aria-label': label, title: label };

  if (variant === 'big') {
    return (
      <button
        {...common}
        className={`relative grid size-24 place-items-center rounded-full text-white shadow-glow transition active:scale-95 disabled:opacity-60 ${
          listening ? 'bg-rose-500' : 'bg-brand'
        }`}
      >
        {ring}
        {transcribing ? <Spinner className="relative size-8" /> : listening ? <Square className="relative size-8 fill-current" aria-hidden="true" /> : <Mic className="relative size-9" aria-hidden="true" />}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button {...common} className={`btn ${listening ? 'bg-rose-500 text-white' : 'btn-ghost'}`}>
        {transcribing ? <Spinner className="size-4" /> : listening ? <Square className="size-4 fill-current" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
        {transcribing ? 'Transcribing…' : listening ? 'Stop' : 'Speak'}
      </button>
    );
  }

  return (
    <button
      {...common}
      className={`relative grid size-12 shrink-0 place-items-center rounded-full transition active:scale-95 disabled:opacity-60 ${
        listening ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-violet-100 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {ring}
      {icon}
    </button>
  );
}

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// What the voice input is doing or why it failed, as one line (announced to screen readers).
export function VoiceStatus({ voice, className = '' }) {
  let text = null;
  let tone = 'text-slate-500 dark:text-slate-400';
  if (voice.error) {
    text = voice.error;
    tone = 'font-medium text-rose-600 dark:text-rose-400';
  } else if (voice.transcribing) {
    text = 'Turning your voice into text…';
  } else if (voice.listening && voice.mode === 'record') {
    text = `Recording ${clock(voice.seconds)}. Tap the square when you are done.`;
  } else if (voice.listening) {
    text = 'Listening… speak now';
  }
  return (
    <p className={`min-h-4 px-1 text-xs ${tone} ${className}`} role="status" aria-live="polite">
      {text}
    </p>
  );
}
