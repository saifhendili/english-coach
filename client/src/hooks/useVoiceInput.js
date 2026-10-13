import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUpload } from '../lib/api';
import { MESSAGES, SPEECH_UNAVAILABLE, joinResults, pickRecorderType, voiceSupport } from '../lib/voice';
import { recordingToWav } from '../lib/wav';

const MAX_SECONDS = 60;

/**
 * Speak instead of typing. `onText(text)` receives what was said once the learner has finished.
 *
 * Two ways to hear the learner, chosen by what the browser can do:
 *  - "speech": the browser's own speech recognition. Free and live: `live` holds the words as they are
 *    heard so they can be shown in the text box. One sentence per tap, which is also what behaves
 *    reliably on phones (continuous mode repeats text on Android Chrome).
 *  - "record": record the voice, convert it to WAV, and let the server transcribe it with Gemini.
 *    Used where there is no speech recognition, or when it fails (no network service, blocked).
 *
 * Both need a secure page: https, or localhost. On plain http at a network address, `error` explains that.
 */
export function useVoiceInput({ onText, lang = 'en-US' }) {
  const support = useMemo(() => {
    const w = typeof window === 'undefined' ? {} : window;
    return voiceSupport({
      isSecureContext: w.isSecureContext,
      SpeechRecognition: w.SpeechRecognition || w.webkitSpeechRecognition,
      getUserMedia: typeof navigator === 'undefined' ? undefined : navigator.mediaDevices?.getUserMedia,
      MediaRecorder: w.MediaRecorder,
    });
  }, []);

  const [mode, setMode] = useState(support.mode); // can change from "speech" to "record" if speech recognition fails
  const [state, setState] = useState('idle'); // idle | listening | transcribing
  const [live, setLive] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);

  const onTextRef = useRef(onText);
  const recognition = useRef(null);
  const recorder = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const cancelled = useRef(false);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stopTimer = () => {
    clearInterval(timer.current);
    timer.current = null;
  };
  const releaseMic = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  // ---- the browser's speech recognition ----
  const startSpeech = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Recognition();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let heard = '';
    let failure = null;
    rec.onresult = (e) => {
      heard = joinResults(Array.from(e.results, (r) => r[0].transcript));
      setLive(heard);
    };
    rec.onerror = (e) => {
      failure = e.error;
    };
    rec.onend = () => {
      recognition.current = null;
      setState('idle');
      setLive('');
      if (cancelled.current) return;
      if (failure && failure !== 'no-speech' && failure !== 'aborted') {
        if (SPEECH_UNAVAILABLE.has(failure) && support.canRecord) {
          setMode('record'); // the browser's recognition cannot work here: record and transcribe instead
          setError(MESSAGES.fallback);
        } else {
          setError(MESSAGES[failure] ?? `Speech recognition error: ${failure}`);
        }
      } else if (heard.trim()) {
        onTextRef.current(heard.trim());
      } else {
        setError(MESSAGES['no-speech']);
      }
    };

    try {
      rec.start();
      recognition.current = rec;
      setState('listening');
    } catch {
      setError(MESSAGES.unsupported);
    }
  }, [lang, support.canRecord]);

  // ---- record, convert, transcribe on the server ----
  const finishRecording = useCallback(async (blob) => {
    setState('transcribing');
    try {
      let upload = blob;
      let seconds = Infinity;
      try {
        ({ wav: upload, seconds } = await recordingToWav(blob));
      } catch {
        /* this browser could not decode its own recording: send it as it is */
      }
      if (seconds < 0.4) {
        setError(MESSAGES['no-speech']);
        return;
      }
      const { text } = await apiUpload('/stt/transcribe', upload);
      if (cancelled.current) return;
      if (text) onTextRef.current(text);
      else setError(MESSAGES['no-speech']);
    } catch (err) {
      if (!cancelled.current) setError(err.message);
    } finally {
      setState('idle');
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      setError(err.name === 'NotFoundError' ? MESSAGES['audio-capture'] : MESSAGES['not-allowed']);
      return;
    }

    const type = pickRecorderType((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stopTimer();
      releaseMic();
      recorder.current = null;
      if (cancelled.current) return setState('idle');
      finishRecording(new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' }));
    };

    recorder.current = rec;
    rec.start();
    setSeconds(0);
    setState('listening');
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS && rec.state === 'recording') rec.stop(); // a minute is the limit
    }, 500);
  }, [finishRecording]);

  const start = useCallback(() => {
    setError(null);
    cancelled.current = false;
    if (mode === 'none') return setError(MESSAGES[support.reason]);
    if (mode === 'speech') return startSpeech();
    return startRecording();
  }, [mode, support.reason, startSpeech, startRecording]);

  const stop = useCallback(() => {
    recognition.current?.stop(); // its onend delivers the text
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  // Leaving the page drops everything: no stray text, no microphone left on.
  useEffect(
    () => () => {
      cancelled.current = true;
      recognition.current?.abort();
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stopTimer();
      releaseMic();
    },
    [],
  );

  return {
    available: mode !== 'none',
    visible: support.reason !== 'unsupported', // hide the button only where nothing could ever work
    mode,
    state,
    listening: state === 'listening',
    transcribing: state === 'transcribing',
    busy: state !== 'idle',
    live,
    seconds,
    error,
    clearError: () => setError(null),
    start,
    stop,
    toggle: () => (state === 'listening' ? stop() : state === 'idle' ? start() : undefined),
  };
}
