import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardMode, clozeParts, matchesAnswer, normalizeAnswer, suggestedRating } from './review.js';

test('typed answers match whatever the quotes, case, punctuation or spacing', () => {
  assert.ok(matchesAnswer("i'm fairly confident that", 'I’m fairly confident that…'));
  assert.ok(matchesAnswer('  The first   thing that comes to mind is ', 'The first thing that comes to mind is…'));
  assert.ok(matchesAnswer('to be honest,', 'To be honest, …'));
  assert.ok(matchesAnswer('chances are', 'Chances are (that)…'), 'an optional (that) is ignored');
  assert.ok(matchesAnswer('ate', 'ate'));
});

test('a wrong or empty answer does not match', () => {
  assert.equal(matchesAnswer('eated', 'ate'), false);
  assert.equal(matchesAnswer('', 'ate'), false);
  assert.equal(matchesAnswer('   ', 'ate'), false);
  assert.equal(matchesAnswer('i am fairly sure', 'I’m fairly confident that…'), false);
});

test('normalizeAnswer', () => {
  assert.equal(normalizeAnswer('  Hello,   WORLD!! '), 'hello world');
});

test('cloze: the phrase is cut out of its example, keeping the original spelling around it', () => {
  const parts = clozeParts('I’m fairly confident that the train leaves at nine.', 'I’m fairly confident that…');
  assert.deepEqual(parts, { before: '', match: 'I’m fairly confident that', after: ' the train leaves at nine.' });
  const mid = clozeParts('Sorry, but off the top of my head, it takes two hours.', 'Off the top of my head, …');
  assert.equal(mid.before, 'Sorry, but ');
  assert.equal(mid.match, 'off the top of my head');
  assert.equal(mid.after, ', it takes two hours.');
});

test('cloze: curly and straight apostrophes are treated alike', () => {
  assert.equal(clozeParts("I'm pretty sure he lives in Lyon.", 'I’m pretty sure…').match, "I'm pretty sure");
});

test('cloze: no example, an inflected word, or a very short text give null', () => {
  assert.equal(clozeParts('', 'word'), null);
  assert.equal(clozeParts('He convinced me.', 'convince'), null);
  assert.equal(clozeParts('A sentence.', 'a'), null);
  assert.equal(clozeParts(null, 'word'), null);
});

test('card mode: mistakes, then cloze when the example holds the text, else recall', () => {
  assert.equal(cardMode({ kind: 'mistake' }), 'mistake');
  assert.equal(cardMode({ kind: 'saved', text: 'relatable', example: 'That sounds very relatable!' }), 'cloze');
  assert.equal(cardMode({ kind: 'saved', text: 'relatable', example: 'Nothing here.' }), 'recall');
  assert.equal(cardMode({ kind: 'saved', text: 'relatable', example: '' }), 'recall');
});

test('suggested rating after typing: right is Good, wrong is Again', () => {
  assert.equal(suggestedRating(true), 3);
  assert.equal(suggestedRating(false), 1);
});
