import assert from 'node:assert/strict';
import { test } from 'node:test';
import { audioMime } from './stt.js';

test('accepts the audio formats Gemini documents, ignoring codec parameters and case', () => {
  assert.equal(audioMime('audio/wav'), 'audio/wav');
  assert.equal(audioMime('AUDIO/WAV'), 'audio/wav');
  assert.equal(audioMime('audio/webm;codecs=opus'), 'audio/webm');
  assert.equal(audioMime('audio/ogg; codecs=opus'), 'audio/ogg');
  assert.equal(audioMime('audio/mp4'), 'audio/mp4');
  assert.equal(audioMime('audio/flac'), 'audio/flac');
});

test('common aliases are normalised', () => {
  assert.equal(audioMime('audio/x-wav'), 'audio/wav');
  assert.equal(audioMime('audio/wave'), 'audio/wav');
  assert.equal(audioMime('audio/mp3'), 'audio/mpeg');
  assert.equal(audioMime('audio/x-m4a'), 'audio/mp4');
  assert.equal(audioMime('audio/m4a'), 'audio/mp4'); // what an iPhone recording is often labelled
});

test('anything that is not audio we know is refused', () => {
  for (const bad of ['text/plain', 'application/json', 'video/mp4', 'audio/x-unknown', '', undefined, null]) assert.equal(audioMime(bad), null, String(bad));
});
