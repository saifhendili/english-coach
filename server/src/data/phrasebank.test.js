import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PHRASEBANK, PHRASE_LEVELS, PHRASE_REGISTERS, categoryById } from './phrasebank.js';

test('categories are unique and each has a blurb, situations and enough phrases', () => {
  assert.equal(new Set(PHRASEBANK.map((c) => c.id)).size, PHRASEBANK.length);
  for (const c of PHRASEBANK) {
    assert.ok(c.label && c.emoji && c.blurb, c.id);
    assert.ok(c.situations.length >= 3, `${c.id} needs 3 situations`);
    assert.ok(c.phrases.length >= 7, `${c.id} needs 7+ phrases`);
  }
});

test('every phrase is complete, with a valid level and register', () => {
  for (const c of PHRASEBANK) {
    for (const p of c.phrases) {
      assert.ok(p.text && p.usage && p.example, `${c.id}: incomplete "${p.text}"`);
      assert.ok(PHRASE_LEVELS.includes(p.level), `${p.text}: level ${p.level}`);
      assert.ok(PHRASE_REGISTERS.includes(p.register), `${p.text}: register ${p.register}`);
    }
  }
});

test('no phrase appears twice, even across categories', () => {
  const texts = PHRASEBANK.flatMap((c) => c.phrases.map((p) => p.text.toLowerCase()));
  assert.equal(new Set(texts).size, texts.length);
});

test('the example sentence actually contains the phrase (ignoring the “…” placeholder)', () => {
  const skip = new Set(['take … for instance.', 'how do you say … in english?', 'make a decision']);
  for (const c of PHRASEBANK) {
    for (const p of c.phrases) {
      if (skip.has(p.text.toLowerCase())) continue;
      if (c.id === 'collocations') {
        // The verb is inflected in a sentence ("catch a cold" -> "caught a cold"): check the key word.
        const key = p.text.replace(/\(.*?\)/g, '').trim().split(' ').pop().toLowerCase();
        assert.ok(p.example.toLowerCase().includes(key), `"${p.text}": "${key}" not in "${p.example}"`);
        continue;
      }
      // "I’m fairly confident that…" -> the part before the placeholder, in the example's own quotes
      const head = p.text.split('…')[0].replace(/[,.?]+$/, '').replace(/\(that\)/, '').trim().toLowerCase();
      const ex = p.example.toLowerCase().replace(/’/g, "'");
      const needle = head.replace(/’/g, "'");
      assert.ok(ex.includes(needle) || ex.replace(/[^a-z' ]/g, '').includes(needle.replace(/[^a-z' ]/g, '')), `"${p.text}" not in "${p.example}"`);
    }
  }
});

test('the phrases the learner asked for are there', () => {
  const all = PHRASEBANK.flatMap((c) => c.phrases.map((p) => p.text));
  assert.ok(all.includes('The first thing that comes to mind is…'));
  assert.ok(all.includes('I’m fairly confident that…'));
});

test('categoryById', () => {
  assert.equal(categoryById('certainty').label, 'Sounding sure (or not)');
  assert.equal(categoryById('nope'), undefined);
});
