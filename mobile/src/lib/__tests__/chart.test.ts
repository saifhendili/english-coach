import { compact, labelIndexes, linePath, nearestIndex, niceScale, roundedTopRect, shortDate, signed } from '../chart';

describe('niceScale', () => {
  it('gives a round top and at most four steps', () => {
    expect(niceScale(7)).toEqual({ top: 8, ticks: [0, 2, 4, 6, 8] });
    expect(niceScale(23)).toEqual({ top: 30, ticks: [0, 10, 20, 30] });
    expect(niceScale(100)).toEqual({ top: 100, ticks: [0, 50, 100] });
  });

  it('never goes below the data', () => {
    for (const max of [1, 3, 4, 9, 11, 37, 99, 101, 480, 1234, 98765]) {
      const { top, ticks } = niceScale(max);
      expect(top).toBeGreaterThanOrEqual(max);
      expect(ticks.length).toBeLessThanOrEqual(5);
      expect(ticks[0]).toBe(0);
      expect(ticks.at(-1)).toBe(top);
    }
  });

  it('still has a usable axis for empty data', () => {
    expect(niceScale(0).top).toBe(4);
    expect(niceScale(undefined).top).toBe(4);
  });
});

it('compact numbers from a thousand up', () => expect([0, 999, 1000, 1500, 12000].map(compact)).toEqual(['0', '999', '1K', '1.5K', '12K']));

describe('roundedTopRect', () => {
  it('is square at the baseline and rounded only at the top', () => expect(roundedTopRect(10, 20, 8, 30, 4)).toBe('M10 50V24Q10 20 14 20H14Q18 20 18 24V50Z'));
  it('never uses a radius bigger than the bar', () => {
    expect(roundedTopRect(0, 0, 8, 2, 4)).toContain('Q0 0 2 0'); // 2px-high bar: 2px radius
    expect(roundedTopRect(0, 0, 3, 30, 4)).toContain('Q0 0 1.5 0'); // 3px-wide bar: 1.5px radius
  });
});

it('linePath', () => expect(linePath([[0, 10], [5.04, 20.26]])).toBe('M0.0 10.0L5.0 20.3'));

it('nearestIndex snaps to the closest position', () => {
  expect(nearestIndex([10, 20, 30], 21)).toBe(1);
  expect(nearestIndex([10, 20, 30], 26)).toBe(2);
  expect(nearestIndex([10, 20, 30], -50)).toBe(0);
  expect(nearestIndex([10], 99)).toBe(0);
});

it('shortDate keeps the calendar day whatever the time zone', () => {
  expect(shortDate('2026-10-13')).toBe('Oct 13');
  expect(shortDate('2027-01-01')).toBe('Jan 1');
});

it('labelIndexes: every 7th day counting back from today, today always included', () => {
  expect(labelIndexes(30)).toEqual([1, 8, 15, 22, 29]);
  expect(labelIndexes(1)).toEqual([0]);
  expect(labelIndexes(30).at(-1)).toBe(29);
});

it('signed numbers', () => expect([5, 0, -3].map(signed)).toEqual(['+5', '0', '-3']));
