import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FOCUS_IDS, suggestFocus } from './focus.js';
import { ANGLES, buildSlots, displayName, dropRepeats, normalizeTitle } from './topics.js';

const fields = ['Football', 'Cooking', 'AI', 'Travel'].map((name) => ({ name, emoji: '•' }));

test('every field gets a turn before any repeats', () => {
  const slots = buildSlots(fields, 8);
  assert.equal(slots.length, 8);
  assert.deepEqual([...new Set(slots.slice(0, 4).map((s) => s.field))].sort(), ['AI', 'Cooking', 'Football', 'Travel']);
  assert.deepEqual([...new Set(slots.slice(4).map((s) => s.field))].sort(), ['AI', 'Cooking', 'Football', 'Travel']);
});

test('angles rotate: all five appear in any five consecutive topics', () => {
  const slots = buildSlots(fields, 10);
  assert.deepEqual([...new Set(slots.slice(0, 5).map((s) => s.angle))].sort(), [...ANGLES].sort());
  assert.deepEqual([...new Set(slots.slice(5).map((s) => s.angle))].sort(), [...ANGLES].sort());
});

test('a single field still fills every slot', () => {
  const slots = buildSlots([fields[0]], 5);
  assert.ok(slots.every((s) => s.field === 'Football'));
});

test('no fields, no slots', () => {
  assert.deepEqual(buildSlots([], 5), []);
});

test('mix blends two different fields, never a field with itself', () => {
  for (let i = 0; i < 50; i++) {
    for (const s of buildSlots(fields, 10, { mix: true })) {
      const [a, b] = s.field.split(' + ');
      assert.ok(a && b && a !== b, s.field);
    }
  }
});

test('mix with one field falls back to that field', () => {
  assert.equal(buildSlots([fields[0]], 1, { mix: true })[0].field, 'Football');
});

test('titles are compared ignoring case and punctuation', () => {
  assert.equal(normalizeTitle("Football: Who's the GOAT?"), 'football who s the goat');
  const kept = dropRepeats(
    [{ title: 'A new idea' }, { title: 'a NEW idea!' }, { title: 'Old one' }, { title: 'Fresh one' }, { title: 'fresh one' }],
    ['old one'],
  );
  assert.deepEqual(kept.map((t) => t.title), ['A new idea', 'Fresh one']);
});

test('suggested focus is the two weakest placement skills the app has an area for', () => {
  const breakdown = {
    grammar: { count: 4, score: 100 },
    vocabulary: { count: 3, score: 100 },
    reading: { count: 3, score: 67 },
    writing: { count: 1, score: 25 },
    speaking: { count: 1, score: 50 },
  };
  assert.deepEqual(suggestFocus(breakdown), ['writing', 'speaking']);
  assert.deepEqual(suggestFocus({}), []);
  assert.deepEqual(suggestFocus(undefined), []);
  assert.deepEqual(suggestFocus({ grammar: { count: 0, score: 0 }, reading: { count: 2, score: 50 } }), ['reading']);
});

test('focus ids include the five test skills plus pronunciation and listening', () => {
  for (const id of ['speaking', 'grammar', 'vocabulary', 'reading', 'writing', 'pronunciation', 'listening']) {
    assert.ok(FOCUS_IDS.includes(id), id);
  }
});

test('field names typed in lowercase get tidy casing, others are left alone', () => {
  assert.equal(displayName('street  food'), 'Street Food');
  assert.equal(displayName(' cooking '), 'Cooking');
  assert.equal(displayName('AI'), 'AI');
  assert.equal(displayName('iPhone apps'), 'iPhone apps');
  assert.equal(displayName('café culture'), 'Café Culture');
});
