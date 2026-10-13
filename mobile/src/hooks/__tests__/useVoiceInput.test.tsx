import { act, renderHook } from '@testing-library/react-native';
import { TranscribeError } from '@/lib/transcribe';
import { MAX_SECONDS, VOICE_MESSAGES } from '@/lib/voice';
import { useVoiceInput } from '../useVoiceInput';

const mockRecorder = { prepareToRecordAsync: jest.fn(), record: jest.fn(), stop: jest.fn(), uri: 'file:///rec.m4a', isRecording: false };
const mockPermission = jest.fn();
const mockAudioMode = jest.fn();
const mockTranscribe = jest.fn();

jest.mock('expo-audio', () => ({
  AudioModule: { requestRecordingPermissionsAsync: (...a: unknown[]) => mockPermission(...a) },
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: (...a: unknown[]) => mockAudioMode(...a),
  useAudioRecorder: () => mockRecorder,
}));
jest.mock('@/lib/transcribe', () => ({
  ...jest.requireActual('@/lib/transcribe'),
  transcribeRecording: (...a: unknown[]) => mockTranscribe(...a),
}));
jest.mock('@/store/auth', () => ({ useAuth: { getState: () => ({ token: null }) }, getServer: () => 'http://x:4000' }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockRecorder.uri = 'file:///rec.m4a';
  mockRecorder.isRecording = false;
  mockPermission.mockResolvedValue({ granted: true });
  mockRecorder.prepareToRecordAsync.mockResolvedValue(undefined);
  mockRecorder.stop.mockResolvedValue(undefined);
  mockTranscribe.mockResolvedValue('I went to the park');
});
afterEach(() => jest.useRealTimers());

const setup = async (extra: { onStart?: () => void } = {}) => {
  const onText = jest.fn();
  const view = await renderHook(() => useVoiceInput({ onText, ...extra }));
  return { ...view, onText };
};

describe('useVoiceInput', () => {
  it('a full cycle: tap to record, tap to stop, the transcript is delivered', async () => {
    const onStart = jest.fn();
    const { result, onText } = await setup({ onStart });
    expect(result.current.state).toBe('idle');

    await act(async () => result.current.toggle());
    expect(result.current.state).toBe('listening');
    expect(onStart).toHaveBeenCalled(); // e.g. the coach's voice is stopped
    expect(mockAudioMode).toHaveBeenCalledWith({ allowsRecording: true, playsInSilentMode: true });
    expect(mockRecorder.record).toHaveBeenCalled();

    await act(async () => result.current.toggle());
    expect(mockRecorder.stop).toHaveBeenCalled();
    expect(mockTranscribe).toHaveBeenCalledWith('file:///rec.m4a');
    expect(onText).toHaveBeenCalledWith('I went to the park');
    expect(result.current.state).toBe('idle');
    // playback must be loud again (iOS plays to the earpiece while recording is allowed)
    expect(mockAudioMode).toHaveBeenLastCalledWith({ allowsRecording: false, playsInSilentMode: true });
  });

  it('a refused microphone permission explains how to fix it and never records', async () => {
    mockPermission.mockResolvedValue({ granted: false });
    const { result, onText } = await setup();
    await act(async () => result.current.toggle());
    expect(result.current.error).toBe(VOICE_MESSAGES.denied);
    expect(result.current.state).toBe('idle');
    expect(mockRecorder.record).not.toHaveBeenCalled();
    expect(onText).not.toHaveBeenCalled();
  });

  it('a transcription failure shows a message and returns to idle without text', async () => {
    mockTranscribe.mockRejectedValue(new TranscribeError('too-short', 'x'));
    const { result, onText } = await setup();
    await act(async () => result.current.toggle());
    await act(async () => result.current.toggle());
    expect(result.current.error).toBe(VOICE_MESSAGES.noSpeech);
    expect(result.current.state).toBe('idle');
    expect(onText).not.toHaveBeenCalled();
  });

  it('starting again clears the previous error', async () => {
    mockTranscribe.mockRejectedValueOnce(new TranscribeError('empty', 'x'));
    const { result } = await setup();
    await act(async () => result.current.toggle());
    await act(async () => result.current.toggle());
    expect(result.current.error).not.toBeNull();
    await act(async () => result.current.toggle());
    expect(result.current.error).toBeNull();
  });

  it('stops by itself after a minute, once', async () => {
    const { result, onText } = await setup();
    await act(async () => result.current.toggle());
    await act(async () => {
      jest.advanceTimersByTime((MAX_SECONDS + 5) * 1000);
    });
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(onText).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe('idle');
  });

  it('counts the seconds while recording', async () => {
    const { result } = await setup();
    await act(async () => result.current.toggle());
    await act(async () => {
      jest.advanceTimersByTime(3200);
    });
    expect(result.current.seconds).toBeGreaterThanOrEqual(3);
  });

  it('leaving the screen while recording stops the microphone and delivers nothing', async () => {
    const { result, unmount, onText } = await setup();
    await act(async () => result.current.toggle());
    mockRecorder.isRecording = true;
    await unmount();
    expect(mockRecorder.stop).toHaveBeenCalled();
    expect(onText).not.toHaveBeenCalled();
  });

  it('a recorder that cannot start reports a failure instead of crashing', async () => {
    mockRecorder.prepareToRecordAsync.mockRejectedValue(new Error('audio session busy'));
    const { result } = await setup();
    await act(async () => result.current.toggle());
    expect(result.current.error).toBe(VOICE_MESSAGES.failed);
    expect(result.current.state).toBe('idle');
  });
});
