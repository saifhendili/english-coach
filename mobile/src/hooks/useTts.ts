import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

// Index of the word being read, from the character offset the speech engine reports.
export function wordIndexAt(text: string, charIndex: number): number {
  let index = -1;
  for (const m of text.matchAll(/\S+/g)) {
    index += 1;
    if (charIndex < (m.index ?? 0) + m[0].length) return index;
  }
  return -1;
}

// Read-aloud with the phone's own voices (free). `speakingId` says which message is being read; `wordIndex` is the
// word being said when the engine reports it (the word highlight is a bonus: not every voice does).
export function useTts() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState(-1);
  const current = useRef<string | null>(null);

  const finish = useCallback((id: string) => {
    if (current.current === id) {
      current.current = null;
      setSpeakingId(null);
      setWordIndex(-1);
    }
  }, []);

  const stop = useCallback(() => {
    current.current = null;
    void Speech.stop();
    setSpeakingId(null);
    setWordIndex(-1);
  }, []);

  const speak = useCallback(
    (id: string, text: string, { slow = false }: { slow?: boolean } = {}) => {
      if (current.current === id) return stop(); // tap again to stop
      void Speech.stop();
      current.current = id;
      setSpeakingId(id);
      Speech.speak(text, {
        language: 'en-US',
        rate: slow ? 0.7 : 1,
        onBoundary: (event: unknown) => {
          const charIndex = (event as { charIndex?: number } | undefined)?.charIndex;
          if (typeof charIndex === 'number') setWordIndex(wordIndexAt(text, charIndex));
        },
        onDone: () => finish(id),
        onStopped: () => finish(id),
        onError: () => finish(id),
      });
    },
    [finish, stop],
  );

  useEffect(() => () => void Speech.stop(), []);

  return { supported: true, speakingId, wordIndex, speak, stop };
}

export type Tts = ReturnType<typeof useTts>;
