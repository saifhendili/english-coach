import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildActivity, countByDay, dayKey, lastDays, percent, streaks, sum } from './progress.js';

const at = (iso) => new Date(`${iso}T15:30:00`); // local afternoon, away from midnight edges

test('dayKey is the local calendar day', () => {
  assert.equal(dayKey(new Date(2026, 9, 5, 23, 59)), '2026-10-05');
  assert.equal(dayKey(new Date(2026, 0, 1, 0, 1)), '2026-01-01');
});

test('lastDays: n keys, oldest first, today last, no gaps across a month end', () => {
  const days = lastDays(5, at('2026-11-02'));
  assert.deepEqual(days, ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  assert.equal(lastDays(30, at('2026-10-13')).length, 30);
});

test('lastDays does not skip or repeat a day when the clocks change', () => {
  const days = lastDays(10, at('2026-11-02')); // northern clock change at the end of October
  assert.equal(new Set(days).size, 10);
});

test('activity: one row per day with zero for quiet days', () => {
  const days = lastDays(3, at('2026-10-13'));
  const rows = buildActivity(days, [at('2026-10-13'), at('2026-10-13'), at('2026-10-11')], [at('2026-10-12')]);
  assert.deepEqual(rows, [
    { date: '2026-10-11', messages: 1, reviews: 0 },
    { date: '2026-10-12', messages: 0, reviews: 1 },
    { date: '2026-10-13', messages: 2, reviews: 0 },
  ]);
  assert.equal(sum(rows, 'messages'), 3);
  assert.equal(countByDay([at('2026-10-13'), at('2026-10-13')]).get('2026-10-13'), 2);
});

test('events outside the window are ignored by buildActivity', () => {
  const rows = buildActivity(lastDays(2, at('2026-10-13')), [at('2026-09-01')], []);
  assert.equal(sum(rows, 'messages'), 0);
});

test('streak: counts the run ending today', () => {
  const keys = ['2026-10-11', '2026-10-12', '2026-10-13'];
  assert.deepEqual(streaks(keys, at('2026-10-13')), { current: 3, best: 3 });
});

test('streak: still alive when the last active day was yesterday', () => {
  assert.deepEqual(streaks(['2026-10-11', '2026-10-12'], at('2026-10-13')), { current: 2, best: 2 });
});

test('streak: broken after a missed day, but the best run is remembered', () => {
  const keys = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-10'];
  assert.deepEqual(streaks(keys, at('2026-10-13')), { current: 0, best: 4 });
});

test('streak: a gap in the middle splits the runs; duplicates and order do not matter', () => {
  const keys = ['2026-10-13', '2026-10-12', '2026-10-12', '2026-10-09', '2026-10-08', '2026-10-07'];
  assert.deepEqual(streaks(keys, at('2026-10-13')), { current: 2, best: 3 });
});

test('streak: nothing yet, and a single day today', () => {
  assert.deepEqual(streaks([], at('2026-10-13')), { current: 0, best: 0 });
  assert.deepEqual(streaks(['2026-10-13'], at('2026-10-13')), { current: 1, best: 1 });
});

test('streak works across a month and a year boundary', () => {
  assert.deepEqual(streaks(['2026-12-30', '2026-12-31', '2027-01-01'], at('2027-01-01')), { current: 3, best: 3 });
});

test('percent rounds, and is null when there is nothing to divide by', () => {
  assert.equal(percent(2, 3), 67);
  assert.equal(percent(0, 5), 0);
  assert.equal(percent(0, 0), null);
});
