import { Platform } from 'react-native';
import { apiUpload } from '@/lib/api';

// A recording shorter than this is a tap with nothing said (even a low-bitrate second is far bigger).
export const MIN_RECORDING_BYTES = 4000;

// The server wants the audio's MIME type; the file extension tells us. iPhones record .m4a (AAC), which
// Gemini transcribes fine (tested through the server).
export function mimeForUri(uri: string): string | null {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const types: Record<string, string> = {
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    aac: 'audio/aac',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    webm: 'audio/webm',
  };
  return types[ext] ?? null;
}

export type TranscribeReason = 'too-short' | 'unsupported' | 'empty' | 'failed';

export class TranscribeError extends Error {
  reason: TranscribeReason;
  constructor(reason: TranscribeReason, message: string) {
    super(message);
    this.name = 'TranscribeError';
    this.reason = reason;
  }
}

export type Recording = { body: Blob; size: number; discard: () => void };

// Opens the recorded file. On the phone that is a file on disk (expo-file-system's File is a Blob, so it can be
// sent as the request body). In the browser build used for testing it is a blob: URL.
export async function readRecording(uri: string): Promise<Recording> {
  if (Platform.OS === 'web') {
    const body = await (await fetch(uri)).blob();
    return { body, size: body.size, discard: () => undefined };
  }
  const { File } = await import('expo-file-system');
  const file = new File(uri);
  return {
    body: file as unknown as Blob,
    size: file.size,
    discard: () => {
      try {
        file.delete(); // the recording is not kept
      } catch {
        /* already gone */
      }
    },
  };
}

type Deps = {
  read: (uri: string) => Promise<Recording>;
  upload: (path: string, body: Blob, contentType: string) => Promise<{ text: string }>;
};

// Recording -> text. Throws a TranscribeError with a reason the screen can explain.
export async function transcribeRecording(uri: string, deps: Deps = { read: readRecording, upload: apiUpload }): Promise<string> {
  const contentType = mimeForUri(uri);
  if (!contentType) throw new TranscribeError('unsupported', 'This recording format is not supported.');

  const recording = await deps.read(uri);
  try {
    if (recording.size < MIN_RECORDING_BYTES) throw new TranscribeError('too-short', 'Nothing was recorded.');
    const { text } = await deps.upload('/stt/transcribe', recording.body, contentType);
    const clean = text.trim();
    if (!clean) throw new TranscribeError('empty', 'Nothing was heard.');
    return clean;
  } finally {
    recording.discard();
  }
}
