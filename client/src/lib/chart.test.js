import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compact, labelIndexes, linePath, nearestIndex, niceScale, roundedRightRect, roundedTopRect, shortDate, signed } from './chart.js';

test('axis scale: a round top and at most four steps, never below the data', () => {
  assert.deepEqual(niceScale(7), { top: 8, ticks: [0, 2, 4, 6, 8] });
  assert.deepEqual(niceScale(23), { top: 30, ticks: [0, 10, 20, 30] });
  assert.deepEqual(niceScale(100), { top: 100, ticks: [0, 50, 100] });
  for (const max of [1, 3, 4, 9, 11, 37, 99, 101, 480, 1234, 98765]) {
    const { top, ticks } = niceScale(max);
    assert.ok(top >= max, `${max} -> ${top}`);
    assert.ok(ticks.length <= 5, `${max}: ${ticks}`);
    assert.equal(ticks[0], 0);
    assert.equal(ticks.at(-1), top);
  }
});

test('axis scale: empty data still has a usable axis', () => {
  assert.equal(niceScale(0).top, 4);
  assert.equal(niceScale(undefined).top, 4);
});

test('compact numbers from a thousand up', () => {
  assert.deepEqual([0, 999, 1000, 1500, 12000].map(compact), ['0', '999', '1K', '1.5K', '12K']);
});

test('rounded column: square at the baseline, rounded only at the top, radius never bigger than the bar', () => {
  assert.equal(roundedTopRect(10, 20, 8, 30, 4), 'M10 50V24Q10 20 14 20H14Q18 20 18 24V50Z');
  assert.ok(roundedTopRect(0, 0, 8, 2, 4).includes('Q0 0 2 0'), 'a 2px-high bar gets a 2px radius');
  assert.ok(roundedTopRect(0, 0, 3, 30, 4).includes('Q0 0 1.5 0'), 'a 3px-wide bar gets a 1.5px radius');
});

test('rounded bar: square at the left baseline, rounded at the right', () => {
  assert.equal(roundedRightRect(0, 0, 40, 16, 4), 'M0 0H36Q40 0 40 4V12Q40 16 36 16H0Z');
});

test('line path', () => {
  assert.equal(linePath([[0, 10], [5.04, 20.26]]), 'M0.0 10.0L5.0 20.3');
});

test('nearest index snaps to the closest position', () => {
  assert.equal(nearestIndex([10, 20, 30], 21), 1);
  assert.equal(nearestIndex([10, 20, 30], 26), 2);
  assert.equal(nearestIndex([10, 20, 30], -50), 0);
  assert.equal(nearestIndex([10], 99), 0);
});

test('short dates keep the calendar day whatever the time zone', () => {
  assert.equal(shortDate('2026-10-13'), 'Oct 13');
  assert.equal(shortDate('2027-01-01'), 'Jan 1');
});

test('axis labels: every 7th day counting back from today, today always included', () => {
  assert.deepEqual(labelIndexes(30), [1, 8, 15, 22, 29]);
  assert.deepEqual(labelIndexes(1), [0]);
  assert.equal(labelIndexes(30).at(-1), 29);
});

test('signed numbers', () => {
  assert.deepEqual([5, 0, -3].map(signed), ['+5', '0', '-3']);
});
