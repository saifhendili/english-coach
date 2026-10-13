import { useCallback, useEffect, useRef, useState } from 'react';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

// Index of the word being read, from the character offset the browser reports.
export function wordIndexAt(text, charIndex) {
  let index = -1;
  for (const m of text.matchAll(/\S+/g)) {
    index += 1;
    if (charIndex < m.index + m[0].length) return index;
  }
  return -1;
}

function pickVoice() {
  const voices = synth?.getVoices() ?? [];
  return (
    voices.find((v) => v.lang === 'en-US' && /natural|google|samantha|aria/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  );
}

// Browser text-to-speech (free). `speakingId` says which message is being read and `wordIndex` which
// word, so the text can be highlighted as it is spoken (not every voice reports word boundaries).
export function useTts() {
  const [speakingId, setSpeakingId] = useState(null);
  const [wordIndex, setWordIndex] = useState(-1);
  const current = useRef(null);

  const stop = useCallback(() => {
    current.current = null;
    synth?.cancel();
    setSpeakingId(null);
    setWordIndex(-1);
  }, []);

  const speak = useCallback(
    (id, text, { slow = false } = {}) => {
      if (!synth) return;
      if (current.current === id) return stop(); // tap again to stop
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = slow ? 0.7 : 1;
      const voice = pickVoice();
      if (voice) u.voice = voice;
      u.onboundary = (e) => setWordIndex(wordIndexAt(text, e.charIndex));
      const finish = () => {
        if (current.current === id) {
          current.current = null;
          setSpeakingId(null);
          setWordIndex(-1);
        }
      };
      u.onend = finish;
      u.onerror = finish;
      current.current = id;
      setSpeakingId(id);
      synth.speak(u);
    },
    [stop],
  );

  useEffect(() => () => synth?.cancel(), []);

  return { supported: Boolean(synth), speakingId, wordIndex, speak, stop };
}
