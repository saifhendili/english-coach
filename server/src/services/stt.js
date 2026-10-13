// Speech-to-text fallback: for browsers with no built-in speech recognition (Firefox, some iPhones),
// the app records audio and the server asks Gemini to transcribe it.
export const MIN_AUDIO_BYTES = 1000;
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // about 4 minutes of 16 kHz WAV; the app records at most one minute

// Formats Gemini accepts (the app itself sends WAV). Returns the clean MIME type, or null.
const ALIASES = { 'audio/x-wav': 'audio/wav', 'audio/wave': 'audio/wav', 'audio/mp3': 'audio/mpeg', 'audio/x-m4a': 'audio/mp4', 'audio/m4a': 'audio/mp4' };
const ALLOWED = new Set(['audio/wav', 'audio/mpeg', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm', 'audio/mp4']);

export function audioMime(contentType) {
  const base = String(contentType ?? '').split(';')[0].trim().toLowerCase();
  const mime = ALIASES[base] ?? base;
  return ALLOWED.has(mime) ? mime : null;
}
