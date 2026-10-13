import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MESSAGES, SPEECH_UNAVAILABLE, joinResults, pickRecorderType, voiceSupport } from './voice.js';
import { encodeWav } from './wav.js';

test('desktop: one entry per phrase are joined with a space', () => {
  assert.equal(joinResults(['I went to the park', 'with my friends']), 'I went to the park with my friends');
});

test('Android Chrome repeats the whole sentence so far in each entry: no duplicated text', () => {
  assert.equal(joinResults(['hello', 'hello how', 'hello how are you']), 'hello how are you');
  assert.equal(joinResults(['I think', 'I think the first thing', 'I think the first thing that comes to mind']), 'I think the first thing that comes to mind');
});

test('an older, shorter version arriving again is ignored', () => {
  assert.equal(joinResults(['hello how are you', 'hello how']), 'hello how are you');
});

test('case differences do not break the matching, and the longer entry keeps its own spelling', () => {
  assert.equal(joinResults(['Hello', 'hello how are you']), 'hello how are you');
});

test('empty and blank entries are skipped', () => {
  assert.equal(joinResults(['', '  ', 'hi', '']), 'hi');
  assert.equal(joinResults([]), '');
});

test('unrelated entries are never merged away', () => {
  assert.equal(joinResults(['I like tea', 'she likes coffee']), 'I like tea she likes coffee');
});

test('recorder format: first supported one wins, Safari ends up with mp4, none supported gives the default', () => {
  assert.equal(pickRecorderType(() => true), 'audio/webm;codecs=opus');
  assert.equal(pickRecorderType((t) => t === 'audio/mp4'), 'audio/mp4');
  assert.equal(pickRecorderType((t) => t.startsWith('audio/ogg')), 'audio/ogg;codecs=opus');
  assert.equal(pickRecorderType(() => false), '');
});

const full = { isSecureContext: true, SpeechRecognition: class {}, getUserMedia: () => {}, MediaRecorder: class {} };

test('voice support: secure page with speech recognition uses it, and keeps recording as a fallback', () => {
  assert.deepEqual(voiceSupport(full), { mode: 'speech', reason: null, canRecord: true });
  assert.deepEqual(voiceSupport({ ...full, getUserMedia: undefined }), { mode: 'speech', reason: null, canRecord: false });
});

test('voice support: no speech recognition (Firefox, some iPhones) falls back to recording', () => {
  assert.deepEqual(voiceSupport({ ...full, SpeechRecognition: undefined }), { mode: 'record', reason: null, canRecord: true });
});

test('voice support: plain http on a network address is "insecure", whatever else is there', () => {
  assert.deepEqual(voiceSupport({ ...full, isSecureContext: false }), { mode: 'none', reason: 'insecure', canRecord: false });
});

test('voice support: nothing available is "unsupported"', () => {
  assert.deepEqual(voiceSupport({ isSecureContext: true }), { mode: 'none', reason: 'unsupported', canRecord: false });
});

test('every reason the UI can show has a message, and so does every unavailable-speech error', () => {
  for (const key of ['insecure', 'unsupported', 'not-allowed', 'no-speech', 'audio-capture', 'network', 'fallback']) assert.ok(MESSAGES[key], key);
  for (const err of SPEECH_UNAVAILABLE) assert.ok(err);
});

test('WAV: a valid 16-bit mono PCM header and the right amount of data', async () => {
  const blob = encodeWav(new Float32Array([0, 0.5, -0.5, 1, -1]), 16000);
  const view = new DataView(await blob.arrayBuffer());
  const tag = (o) => String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3));
  assert.equal(blob.type, 'audio/wav');
  assert.equal(blob.size, 44 + 5 * 2);
  assert.deepEqual([tag(0), tag(8), tag(12), tag(36)], ['RIFF', 'WAVE', 'fmt ', 'data']);
  assert.equal(view.getUint32(4, true), 36 + 10);
  assert.equal(view.getUint16(20, true), 1); // PCM
  assert.equal(view.getUint16(22, true), 1); // mono
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 10);
  assert.deepEqual([2, 3, 4, 5, 6].map((i) => view.getInt16(44 + (i - 2) * 2, true)), [0, 16383, -16384, 32767, -32768]);
});

test('WAV: samples beyond the range are clipped, not wrapped around', async () => {
  const view = new DataView(await encodeWav(new Float32Array([2, -2]), 8000).arrayBuffer());
  assert.equal(view.getInt16(44, true), 32767);
  assert.equal(view.getInt16(46, true), -32768);
});
