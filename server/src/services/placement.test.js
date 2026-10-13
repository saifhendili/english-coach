import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAX_QUESTIONS, MIN_QUESTIONS, START_ABILITY, TYPE_PLAN,
  finalAbility, isStable, numToLevel, productiveScore, shouldStop,
  shuffleOptions, skillBreakdown, updateAbility,
} from './placement.js';

const step = (ability, level, score, n, chance = 0.25) =>
  updateAbility({ ability, level, score, answeredBefore: n, chance });

test('starts at B1', () => {
  assert.equal(numToLevel(START_ABILITY), 'B1');
});

test('a correct answer raises the estimate, a wrong one lowers it', () => {
  assert.ok(step(2, 2, 1, 0) > 2);
  assert.ok(step(2, 2, 0, 0) < 2);
});

test('missing an easy item costs more than missing a hard one', () => {
  const missEasy = 3 - step(3, 1, 0, 3);
  const missHard = 3 - step(3, 5, 0, 3);
  assert.ok(missEasy > missHard);
});

test('estimate stays inside A1..C2', () => {
  let a = 5;
  for (let i = 0; i < 20; i++) a = step(a, 5, 1, i);
  assert.ok(a <= 5);
  a = 0;
  for (let i = 0; i < 20; i++) a = step(a, 0, 0, i);
  assert.ok(a >= 0);
});

test('a learner who always answers correctly climbs to C1/C2', () => {
  let a = START_ABILITY;
  for (let i = 0; i < MAX_QUESTIONS; i++) a = step(a, Math.round(a), 1, i);
  assert.ok(['C1', 'C2'].includes(numToLevel(a)), numToLevel(a));
});

test('a learner who always misses falls to A1/A2', () => {
  let a = START_ABILITY;
  for (let i = 0; i < MAX_QUESTIONS; i++) a = step(a, Math.round(a), 0, i);
  assert.ok(['A1', 'A2'].includes(numToLevel(a)), numToLevel(a));
});

// Simulates a learner whose true level is `truth`: right when the item is at or below it.
function simulate(truth, noise = () => 0) {
  let a = START_ABILITY;
  const history = [];
  while (!shouldStop(history)) {
    const level = Math.round(a);
    const score = level <= truth + noise() ? 1 : 0;
    a = step(a, level, score, history.length);
    history.push(a);
  }
  return { level: numToLevel(a), asked: history.length };
}

test('converges near the true level for each CEFR level', () => {
  for (const truth of [0, 1, 2, 3, 4, 5]) {
    const { level } = simulate(truth);
    assert.ok(Math.abs('A1 A2 B1 B2 C1 C2'.split(' ').indexOf(level) - truth) <= 1, `truth ${truth} -> ${level}`);
  }
});

test('stops by MAX_QUESTIONS and never before MIN_QUESTIONS', () => {
  assert.equal(isStable([2, 2, 2, 2]), false);
  assert.equal(isStable(Array(MIN_QUESTIONS).fill(2.5)), true);
  assert.equal(isStable([0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2]), false);
  assert.equal(shouldStop(Array(MAX_QUESTIONS).fill(0).map((_, i) => i % 5)), true);
});

test('productive score is neutral at the item level and moves 0.25 per level', () => {
  assert.equal(productiveScore('B1', 'B1'), 0.5);
  assert.equal(productiveScore('B2', 'B1'), 0.75);
  assert.equal(productiveScore('A2', 'B1'), 0.25);
  assert.equal(productiveScore('C2', 'A1'), 1);
  assert.equal(productiveScore('A1', 'C2'), 0);
});

test('final estimate leans on writing/speaking evidence', () => {
  const qs = [{ type: 'writing', grade: { cefrLevel: 'C1' } }, { type: 'grammar' }];
  assert.ok(finalAbility(2, qs) > 2);
  assert.equal(finalAbility(2, [{ type: 'grammar' }]), 2);
});

test('skill breakdown averages per type and ignores unanswered items', () => {
  const b = skillBreakdown([
    { type: 'grammar', score: 1 },
    { type: 'grammar', score: 0 },
    { type: 'reading', score: 1 },
    { type: 'reading' },
  ]);
  assert.deepEqual(b, { grammar: { count: 2, score: 50 }, reading: { count: 1, score: 100 } });
});

test('shuffleOptions keeps the correct answer pointing at the same text', () => {
  const options = ['a', 'b', 'c', 'd'];
  for (let i = 0; i < 50; i++) {
    const out = shuffleOptions(options, 2);
    assert.equal(out.options[out.answerIndex], 'c');
    assert.deepEqual([...out.options].sort(), options);
  }
});

test('skill plan has MAX_QUESTIONS entries covering every skill', () => {
  assert.equal(TYPE_PLAN.length, MAX_QUESTIONS);
  assert.deepEqual([...new Set(TYPE_PLAN)].sort(), ['grammar', 'reading', 'speaking', 'vocabulary', 'writing']);
});
