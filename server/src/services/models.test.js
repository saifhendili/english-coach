import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_MODELS, FREE_MODELS, FREE_MODEL_IDS, fallbackChain, isFreeModel, modelFor } from './models.js';

test('ids are unique and every entry is documented for the UI', () => {
  assert.equal(new Set(FREE_MODEL_IDS).size, FREE_MODELS.length);
  for (const m of FREE_MODELS) assert.ok(m.label && m.note, m.id);
});

test('defaults are free models, and use different models so quota is not shared', () => {
  assert.ok(isFreeModel(DEFAULT_MODELS.fast));
  assert.ok(isFreeModel(DEFAULT_MODELS.strong));
  assert.notEqual(DEFAULT_MODELS.fast, DEFAULT_MODELS.strong);
});

test('known paid, retired and alias models are not on the list', () => {
  for (const id of [
    'gemini-3.1-pro-preview', 'gemini-pro-latest', 'gemini-2.5-pro', 'gemini-2.5-flash-lite',
    'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-3.7-flash',
  ]) {
    assert.equal(isFreeModel(id), false, id);
  }
});

test('modelFor honours a free choice and falls back for anything else', () => {
  assert.equal(modelFor({ modelPrefs: { fast: 'gemini-2.5-flash' } }, 'fast'), 'gemini-2.5-flash');
  assert.equal(modelFor({ modelPrefs: { fast: 'gemini-3.1-pro-preview' } }, 'fast'), DEFAULT_MODELS.fast);
  assert.equal(modelFor({ modelPrefs: { strong: null } }, 'strong'), DEFAULT_MODELS.strong);
  assert.equal(modelFor({}, 'fast'), DEFAULT_MODELS.fast);
});

test('fallbacks are free models, never include the failing one, and avoid the unreliable models', () => {
  const chain = fallbackChain('gemini-3.5-flash-lite');
  assert.ok(chain.length >= 2);
  assert.ok(chain.every(isFreeModel));
  assert.ok(!chain.includes('gemini-3.5-flash-lite'));
  assert.ok(!chain.includes('gemini-3.6-flash') && !chain.includes('gemini-3.1-flash-lite'));
  assert.deepEqual(fallbackChain('not-in-list'), fallbackChain('also-not-in-list'));
});
