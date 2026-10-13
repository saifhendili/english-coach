// Pure helpers for voice input (no browser calls), so they can be tested in Node.

// Browsers hand back speech as a list of results. On desktop it is one entry per phrase; Chrome on Android
// can instead repeat the whole sentence so far in every new entry ("hello", "hello how", "hello how are you").
// Joining them naively would give "hello hello how hello how are you", so an entry that extends or repeats
// what is already there replaces it instead of being appended.
export function joinResults(parts) {
  let text = '';
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    const a = text.toLowerCase();
    const b = part.toLowerCase();
    if (text && b.startsWith(a)) text = part; // longer version of the same sentence
    else if (text && a.startsWith(b)) continue; // an earlier, shorter version again
    else text = text ? `${text} ${part}` : part;
  }
  return text;
}

// Recording formats in order of preference. Safari only does mp4, Chrome and Firefox do webm or ogg.
const RECORDER_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];

// '' means "let the browser choose".
export function pickRecorderType(isTypeSupported) {
  return RECORDER_TYPES.find((t) => isTypeSupported(t)) ?? '';
}

// How voice input can work here:
//   speech  the browser's own speech recognition (free, live text), needs a secure page
//   record  record audio and have the server transcribe it (works where there is no speech recognition)
//   none    not possible: 'insecure' (plain http on a network address) or 'unsupported'
export function voiceSupport({ isSecureContext, SpeechRecognition, getUserMedia, MediaRecorder }) {
  if (!isSecureContext) return { mode: 'none', reason: 'insecure', canRecord: false };
  const canRecord = Boolean(getUserMedia && MediaRecorder);
  if (SpeechRecognition) return { mode: 'speech', reason: null, canRecord };
  if (canRecord) return { mode: 'record', reason: null, canRecord };
  return { mode: 'none', reason: 'unsupported', canRecord: false };
}

// Speech-recognition errors that mean "this browser cannot do it", where recording is worth trying instead.
export const SPEECH_UNAVAILABLE = new Set(['network', 'service-not-allowed', 'language-not-supported']);

export const MESSAGES = {
  insecure:
    'Voice input needs a secure connection. Open this site with https:// (on a phone, the https address of your computer).',
  unsupported: 'This browser cannot capture your voice. You can type instead.',
  'not-allowed': 'Microphone access was blocked. Allow it in your browser settings, then try again.',
  'service-not-allowed': 'Microphone access was blocked. Allow it in your browser settings, then try again.',
  'no-speech': 'I did not hear anything. Tap the mic and try again.',
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition needs an internet connection.',
  fallback: 'Voice recognition is not available here, so recording is used instead. Tap the mic again and speak.',
};
