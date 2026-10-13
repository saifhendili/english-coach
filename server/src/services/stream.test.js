import assert from 'node:assert/strict';
import { test } from 'node:test';
import { partialString } from './stream.js';

const full = JSON.stringify({ reply: 'He said "hi"\nand left 😀 — ok!', correction: { hasMistakes: false } });

test('a complete string is returned decoded, marked done', () => {
  assert.deepEqual(partialString(full, 'reply'), { text: 'He said "hi"\nand left 😀 — ok!', done: true });
});

test('no key yet means nothing to show', () => {
  assert.deepEqual(partialString('', 'reply'), { text: '', done: false });
  assert.deepEqual(partialString('{"rep', 'reply'), { text: '', done: false });
  assert.deepEqual(partialString('{"reply"', 'reply'), { text: '', done: false });
});

test('whatever arrives is shown, growing monotonically, for every possible cut of the stream', () => {
  let previous = '';
  for (let cut = 0; cut <= full.length; cut++) {
    const { text } = partialString(full.slice(0, cut), 'reply');
    assert.ok(text.startsWith(previous), `cut ${cut}: "${text}" does not extend "${previous}"`);
    assert.ok(!/[\ud800-\udbff]$/.test(text), `cut ${cut}: ends in half an emoji`);
    previous = text;
  }
  assert.equal(previous, 'He said "hi"\nand left 😀 — ok!');
});

test('pretty-printed JSON works too', () => {
  const buffer = '{\n  "reply": "Nice one!",\n  "correction": {}}';
  assert.deepEqual(partialString(buffer, 'reply'), { text: 'Nice one!', done: true });
});

test('a half-written escape is held back until it is complete', () => {
  assert.equal(partialString('{"reply":"a\\', 'reply').text, 'a');
  assert.equal(partialString('{"reply":"a\\u00', 'reply').text, 'a');
  assert.equal(partialString('{"reply":"a\\u00e9', 'reply').text, 'aé');
});

test('the word "reply" inside another value does not confuse it', () => {
  const buffer = JSON.stringify({ other: 'a "reply": "fake"', reply: 'real' });
  assert.equal(partialString(buffer, 'reply').text, 'real');
});

test('other keys can be read the same way', () => {
  assert.deepEqual(partialString('{"reply":"x","summary":"so far', 'summary'), { text: 'so far', done: false });
});
