import assert from 'node:assert/strict';
import { test } from 'node:test';
import { segments } from './markup.js';

const join = (parts) => parts.map((p) => p.text).join('');

test('flags the wrong words and keeps the rest of the sentence', () => {
  const parts = segments('Last week I use AI for write my essay', ['use', 'for write']);
  assert.equal(join(parts), 'Last week I use AI for write my essay');
  assert.deepEqual(parts.filter((p) => p.hit).map((p) => p.text), ['use', 'for write']);
});

test('pieces always add back up to the original text, in order', () => {
  const text = 'He go to school and she eated lunch';
  const parts = segments(text, ['eated', 'go']);
  assert.equal(join(parts), text);
  assert.deepEqual(parts.filter((p) => p.hit).map((p) => p.text), ['go', 'eated']);
});

test('a fragment that is not in the text is ignored', () => {
  assert.deepEqual(segments('Hello there', ['goodbye']), [{ text: 'Hello there', hit: false }]);
});

test('matching falls back to ignoring case', () => {
  assert.deepEqual(segments('First thing came up', ['first thing']).filter((p) => p.hit).map((p) => p.text), ['First thing']);
});

test('overlapping fragments: the first one wins, nothing is duplicated', () => {
  const parts = segments('I am very happy', ['am very', 'very happy']);
  assert.equal(join(parts), 'I am very happy');
  assert.equal(parts.filter((p) => p.hit).length, 1);
});

test('empty and missing fragments are skipped', () => {
  assert.deepEqual(segments('Hi', ['', undefined]), [{ text: 'Hi', hit: false }]);
});
