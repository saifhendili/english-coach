import { ApiError } from '../api';
import { MIN_RECORDING_BYTES, mimeForUri, TranscribeError, transcribeRecording, type Recording } from '../transcribe';
import { clock, voiceErrorMessage, VOICE_MESSAGES } from '../voice';

jest.mock('@/store/auth', () => ({ useAuth: { getState: () => ({ token: null, logout: jest.fn() }) }, getServer: () => 'http://x:4000' }));

describe('mimeForUri', () => {
  it('knows what an iPhone records and the other formats the server accepts', () => {
    expect(mimeForUri('file:///var/mobile/Containers/Data/cache/Audio/recording-1.m4a')).toBe('audio/mp4');
    expect(mimeForUri('file:///a/b.WAV')).toBe('audio/wav');
    expect(mimeForUri('blob:http://localhost/abc.webm')).toBe('audio/webm');
    expect(mimeForUri('file:///a/b.m4a?cache=1')).toBe('audio/mp4');
  });
  it('does not guess at formats the server cannot read (iOS .caf, no extension)', () => {
    expect(mimeForUri('file:///a/b.caf')).toBeNull();
    expect(mimeForUri('file:///a/b')).toBeNull();
  });
});

const recording = (size: number): Recording & { discard: jest.Mock } => ({ body: {} as Blob, size, discard: jest.fn() });

describe('transcribeRecording', () => {
  it('uploads the file with its MIME type, returns the trimmed text, and deletes the recording', async () => {
    const rec = recording(50_000);
    const upload = jest.fn().mockResolvedValue({ text: '  Yesterday I go to the park.  ' });
    const text = await transcribeRecording('file:///r.m4a', { read: async () => rec, upload });
    expect(text).toBe('Yesterday I go to the park.');
    expect(upload).toHaveBeenCalledWith('/stt/transcribe', rec.body, 'audio/mp4');
    expect(rec.discard).toHaveBeenCalledTimes(1);
  });

  it('a tap with nothing said is "too short": nothing is uploaded, and the file is still deleted', async () => {
    const rec = recording(MIN_RECORDING_BYTES - 1);
    const upload = jest.fn();
    await expect(transcribeRecording('file:///r.m4a', { read: async () => rec, upload })).rejects.toMatchObject({ reason: 'too-short' });
    expect(upload).not.toHaveBeenCalled();
    expect(rec.discard).toHaveBeenCalled();
  });

  it('an empty transcript means nothing was heard', async () => {
    const rec = recording(50_000);
    await expect(transcribeRecording('file:///r.m4a', { read: async () => rec, upload: async () => ({ text: '   ' }) })).rejects.toMatchObject({ reason: 'empty' });
    expect(rec.discard).toHaveBeenCalled();
  });

  it('an unknown format fails before the file is even opened', async () => {
    const read = jest.fn();
    await expect(transcribeRecording('file:///r.caf', { read, upload: jest.fn() })).rejects.toMatchObject({ reason: 'unsupported' });
    expect(read).not.toHaveBeenCalled();
  });

  it('a failed upload still deletes the recording, and the error reaches the caller', async () => {
    const rec = recording(50_000);
    const boom = new ApiError(429, 'RATE_LIMITED', 'Gemini quota reached.');
    await expect(transcribeRecording('file:///r.m4a', { read: async () => rec, upload: async () => Promise.reject(boom) })).rejects.toBe(boom);
    expect(rec.discard).toHaveBeenCalled();
  });
});

describe('voiceErrorMessage', () => {
  it('turns each failure into a sentence the learner can act on', () => {
    expect(voiceErrorMessage(new TranscribeError('too-short', ''))).toBe(VOICE_MESSAGES.noSpeech);
    expect(voiceErrorMessage(new TranscribeError('empty', ''))).toBe(VOICE_MESSAGES.noSpeech);
    expect(voiceErrorMessage(new TranscribeError('unsupported', ''))).toBe(VOICE_MESSAGES.unsupported);
    expect(voiceErrorMessage(new ApiError(0, 'NETWORK', 'Cannot reach the server.'))).toBe('Cannot reach the server.');
    expect(voiceErrorMessage(new Error('anything else'))).toBe(VOICE_MESSAGES.failed);
  });
  it('formats the recording clock', () => {
    expect([0, 7, 60, 75].map(clock)).toEqual(['0:00', '0:07', '1:00', '1:15']);
  });
});
