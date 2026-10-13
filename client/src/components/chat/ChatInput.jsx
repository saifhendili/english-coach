import { SendHorizonal } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import VoiceButton, { VoiceStatus } from '../VoiceButton';

// Text box with a mic. What you say is typed into the box (live while you speak, where the browser
// allows it), so it can be edited before sending.
export default function ChatInput({ value, onChange, onSend, disabled }) {
  const ref = useRef(null);
  const append = useCallback((phrase) => onChange((prev) => `${prev ? `${prev} ` : ''}${phrase}`), [onChange]);
  const voice = useVoiceInput({ onText: append });

  // While listening, show the words being heard right after what is already typed.
  const shown = voice.listening && voice.live ? `${value}${value ? ' ' : ''}${voice.live}` : value;

  // Grow with the text, up to about five lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, [shown]);

  const send = () => {
    if (voice.listening) voice.stop();
    if (value.trim() && !disabled) onSend();
  };

  return (
    <div>
      <VoiceStatus voice={voice} className="mb-1.5" />
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="chat-input">
          Your message
        </label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          className="input max-h-32 min-h-12 resize-none !rounded-3xl !py-3 leading-snug"
          placeholder={voice.listening ? 'Speak now…' : 'Write in English…'}
          maxLength={1200}
          value={shown}
          readOnly={voice.busy}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <VoiceButton voice={voice} disabled={disabled} />
        <button
          type="button"
          onClick={send}
          disabled={disabled || voice.busy || !value.trim()}
          aria-label="Send"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white shadow-glow transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          <SendHorizonal className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
