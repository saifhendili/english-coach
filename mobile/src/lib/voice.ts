import { ApiError } from '@/lib/api';
import { TranscribeError } from '@/lib/transcribe';

export const MAX_SECONDS = 60;

export const VOICE_MESSAGES = {
  denied: 'Microphone access is off. Turn it on for English Coach in Settings, then try again.',
  noSpeech: 'I did not hear anything. Tap the mic and try again.',
  unsupported: 'This recording could not be read. Try typing instead.',
  failed: 'The recording did not work. Try again, or type instead.',
} as const;

// Any failure while recording or transcribing -> a sentence for the learner.
export function voiceErrorMessage(err: unknown): string {
  if (err instanceof TranscribeError) {
    if (err.reason === 'too-short' || err.reason === 'empty') return VOICE_MESSAGES.noSpeech;
    if (err.reason === 'unsupported') return VOICE_MESSAGES.unsupported;
    return VOICE_MESSAGES.failed;
  }
  if (err instanceof ApiError) return err.message; // quota, no key, no network: the server's wording is already clear
  return VOICE_MESSAGES.failed;
}

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
