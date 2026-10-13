import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RATING, applyRating, cardOf, createScheduler, formatInterval, interleave, previewIntervals } from './srs.js';

const scheduler = createScheduler({ fuzz: false }); // no randomness in tests
const T0 = new Date('2026-10-13T10:00:00Z');
const days = (due, from) => (due - from) / 86_400_000;

test('a new item: Again 1 day, Hard 2, Good 3, Easy 8 (no learning steps)', () => {
  const due = (rating) => days(applyRating({}, rating, T0, scheduler).due, T0);
  assert.deepEqual([1, 2, 3, 4].map(due), [1, 2, 3, 8]);
});

test('answering a new item counts a review and stores the whole card', () => {
  const r = applyRating({}, RATING.good, T0, scheduler);
  assert.equal(r.reps, 1);
  assert.equal(r.lapses, 0);
  assert.ok(r.due instanceof Date);
  assert.ok(r.fsrs.stability > 0 && r.fsrs.difficulty > 0);
});

test('keeping answering Good makes the gaps longer and longer', () => {
  let item = {};
  let now = T0;
  const gaps = [];
  for (let i = 0; i < 5; i++) {
    const r = applyRating(item, RATING.good, now, scheduler);
    gaps.push(days(r.due, now));
    item = r;
    now = r.due;
  }
  assert.deepEqual([...gaps].sort((a, b) => a - b), gaps, `gaps should grow: ${gaps}`);
  assert.ok(gaps.at(-1) > gaps[0] * 10, `last gap ${gaps.at(-1)} should be far beyond the first ${gaps[0]}`);
});

test('forgetting a well-known item (Again) is a lapse and shortens its next gap a lot', () => {
  let item = {};
  let now = T0;
  for (let i = 0; i < 4; i++) {
    item = applyRating(item, RATING.good, now, scheduler);
    now = item.due;
  }
  const knownGap = days(applyRating(item, RATING.good, now, scheduler).due, now);
  const lapsed = applyRating(item, RATING.again, now, scheduler);
  assert.equal(lapsed.lapses, 1);
  assert.ok(days(lapsed.due, now) < knownGap / 3, `after Again: ${days(lapsed.due, now)}d, after Good would be ${knownGap}d`);
});

test('Easy goes further than Good, Hard stays closer', () => {
  let item = applyRating({}, RATING.good, T0, scheduler);
  const now = item.due;
  const gap = (r) => days(applyRating(item, r, now, scheduler).due, now);
  assert.ok(gap(RATING.hard) < gap(RATING.good) && gap(RATING.good) < gap(RATING.easy));
});

test('a card read back from JSON (dates as strings) keeps working', () => {
  const stored = JSON.parse(JSON.stringify(applyRating({}, RATING.good, T0, scheduler)));
  const card = cardOf(stored, T0);
  assert.ok(card.due instanceof Date && card.last_review instanceof Date);
  const next = applyRating(stored, RATING.good, new Date(stored.due), scheduler);
  assert.equal(next.reps, 2);
});

test('previewIntervals gives a readable label for each of the four answers', () => {
  assert.deepEqual(previewIntervals({}, T0, scheduler), { 1: '1d', 2: '2d', 3: '3d', 4: '8d' });
});

test('formatInterval picks a short unit', () => {
  const at = (ms) => formatInterval(new Date(T0.getTime() + ms), T0);
  assert.equal(at(0), '1m');
  assert.equal(at(10 * 60_000), '10m');
  assert.equal(at(5 * 3_600_000), '5h');
  assert.equal(at(3 * 86_400_000), '3d');
  assert.equal(at(13 * 86_400_000), '13d');
  assert.equal(at(21 * 86_400_000), '3w');
  assert.equal(at(90 * 86_400_000), '3mo');
  assert.equal(at(548 * 86_400_000), '1.5y');
  assert.equal(at(-5000), '1m'); // already due
});

test('interleave alternates between two lists and keeps the rest of the longer one', () => {
  assert.deepEqual(interleave(['m1', 'm2'], ['s1', 's2', 's3', 's4']), ['m1', 's1', 'm2', 's2', 's3', 's4']);
  assert.deepEqual(interleave([], ['s1', 's2']), ['s1', 's2']);
  assert.deepEqual(interleave(['m1'], []), ['m1']);
  assert.deepEqual(interleave([], []), []);
});
