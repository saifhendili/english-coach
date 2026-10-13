import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lookup, normalizeEntry } from './dictionary.js';

const sample = [
  {
    word: 'tactical',
    phonetic: '/ˈtæk.tɪ.kəl/',
    phonetics: [{ text: '/ˈtæk.tɪ.kəl/', audio: '' }, { audio: 'https://example.test/tactical.mp3' }],
    meanings: [
      { partOfSpeech: 'adjective', definitions: [{ definition: 'Relating to tactics.', example: 'A tactical decision.' }, { definition: 'Planned to gain an advantage.' }, { definition: 'third one, dropped' }] },
      { partOfSpeech: 'noun', definitions: [{ definition: 'A tactic.' }] },
    ],
  },
];

test('normalises an entry: two definitions per meaning, first audio file found, phonetic kept', () => {
  const e = normalizeEntry(sample);
  assert.equal(e.word, 'tactical');
  assert.equal(e.phonetic, '/ˈtæk.tɪ.kəl/');
  assert.equal(e.audio, 'https://example.test/tactical.mp3');
  assert.deepEqual(e.definitions.map((d) => d.text), ['Relating to tactics.', 'Planned to gain an advantage.', 'A tactic.']);
  assert.equal(e.definitions[0].example, 'A tactical decision.');
  assert.equal(e.definitions[1].example, '');
});

test('nothing usable gives null', () => {
  assert.equal(normalizeEntry([]), null);
  assert.equal(normalizeEntry(null), null);
  assert.equal(normalizeEntry({ title: 'No Definitions Found' }), null);
});

const reply = (status, body) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('lookup returns the entry, and remembers it (a second call does not hit the network)', async () => {
  let calls = 0;
  const fetchImpl = async (...a) => { calls++; return reply(200, sample)(...a); };
  const first = await lookup('tactical-test', { fetchImpl });
  const second = await lookup('tactical-test', { fetchImpl });
  assert.equal(first.word, 'tactical');
  assert.deepEqual(second, first);
  assert.equal(calls, 1);
});

test('an unknown word is null (404), also remembered', async () => {
  let calls = 0;
  const fetchImpl = async (...a) => { calls++; return reply(404, { title: 'No Definitions Found' })(...a); };
  assert.equal(await lookup('zzzqqq', { fetchImpl }), null);
  assert.equal(await lookup('zzzqqq', { fetchImpl }), null);
  assert.equal(calls, 1);
});

test('a network failure or server error is a 502, and is not remembered', async () => {
  await assert.rejects(lookup('neterr', { fetchImpl: async () => { throw new Error('offline'); } }), { code: 'DICTIONARY_UNAVAILABLE' });
  await assert.rejects(lookup('server500', { fetchImpl: reply(500, {}) }), { code: 'DICTIONARY_UNAVAILABLE' });
  const ok = await lookup('server500', { fetchImpl: reply(200, sample) });
  assert.equal(ok.word, 'tactical');
});
