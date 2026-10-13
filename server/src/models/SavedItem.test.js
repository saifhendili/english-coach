import assert from 'node:assert/strict';
import { test } from 'node:test';
import { savedKey } from './SavedItem.js';

test('one entry whatever the case, quotes, trailing punctuation or spacing', () => {
  assert.equal(savedKey('To be honest,'), 'to be honest');
  assert.equal(savedKey('to be honest'), 'to be honest');
  assert.equal(savedKey('  I’m fairly   confident that… '), "i'm fairly confident that");
  assert.equal(savedKey("I'm fairly confident that…"), "i'm fairly confident that");
  assert.equal(savedKey('Relatable!'), 'relatable');
});

test('punctuation inside the text is kept', () => {
  assert.equal(savedKey("Off the top of my head, it's two hours"), "off the top of my head, it's two hours");
});

test('only punctuation leaves nothing', () => {
  assert.equal(savedKey('…'), '');
  assert.equal(savedKey('  ?! '), '');
});
