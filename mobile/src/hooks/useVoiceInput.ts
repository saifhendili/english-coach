import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeRecording, TranscribeError } from '@/lib/transcribe';
import { MAX_SECONDS, VOICE_MESSAGES, voiceErrorMessage } from '@/lib/voice';

export type VoiceState = 'idle' | 'listening' | 'transcribing';

/**
 * Speak instead of typing. `onText(text)` receives what was said once the learner taps stop.
 *
 * The phone records with the standard high-quality preset (AAC in an .m4a file), the file is uploaded, and the server
 * returns a verbatim transcript (it keeps grammar mistakes so the coach can correct them). A minute at most.
 * iOS routes sound to the quiet earpiece while "allowsRecording" is on, so it is switched off again as soon as the
 * recording ends, which keeps read-aloud loud.
 */
export function useVoiceInput({ onText, onStart }: { onText: (text: string) => void; onStart?: () => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<VoiceState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onTextRef = useRef(onText);
  const onStartRef = useRef(onStart);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);
  const stopping = useRef(false);

  useEffect(() => {
    onTextRef.current = onText;
    onStartRef.current = onStart;
  }, [onText, onStart]);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const finish = useCallback(async () => {
    if (stopping.current) return; // the minute ran out at the moment the learner tapped stop
    stopping.current = true;
    stopTimer();
    setState('transcribing');
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!uri) throw new TranscribeError('failed', 'The recording has no file.');
      const text = await transcribeRecording(uri);
      if (!cancelled.current) onTextRef.current(text);
    } catch (err) {
      if (!cancelled.current) setError(voiceErrorMessage(err));
    } finally {
      stopping.current = false;
      setState('idle');
    }
  }, [recorder]);

  const start = useCallback(async () => {
    setError(null);
    cancelled.current = false;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError(VOICE_MESSAGES.denied);
        return;
      }
      onStartRef.current?.(); // e.g. stop the coach's voice so it is not recorded
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSeconds(0);
      setState('listening');
      const startedAt = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) void finish();
      }, 500);
    } catch {
      setError(VOICE_MESSAGES.failed);
      setState('idle');
    }
  }, [recorder, finish]);

  // Leaving the screen drops everything: no stray text, no microphone left on.
  useEffect(
    () => () => {
      cancelled.current = true;
      stopTimer();
      if (recorder.isRecording) void recorder.stop();
    },
    [recorder],
  );

  return {
    state,
    listening: state === 'listening',
    transcribing: state === 'transcribing',
    busy: state !== 'idle',
    seconds,
    error,
    clearError: () => setError(null),
    start,
    stop: finish,
    toggle: () => (state === 'listening' ? void finish() : state === 'idle' ? void start() : undefined),
  };
}

export type VoiceInput = ReturnType<typeof useVoiceInput>;
