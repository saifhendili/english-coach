// Pure geometry and formatting for the hand-drawn SVG charts (no DOM), so it can be tested in Node.

// A round axis maximum and its gridline values: 0, step, 2*step... with at most 4 steps.
//   niceScale(7) -> { top: 8, ticks: [0, 2, 4, 6, 8] }   niceScale(23) -> { top: 30, ticks: [0, 10, 20, 30] }
export function niceScale(max) {
  if (!(max > 0)) return { top: 4, ticks: [0, 1, 2, 3, 4] };
  for (const magnitude of [1, 10, 100, 1000, 10000, 100000]) {
    for (const base of [1, 2, 5]) {
      const step = base * magnitude;
      const steps = Math.ceil(max / step);
      if (steps <= 4) return { top: steps * step, ticks: Array.from({ length: steps + 1 }, (_, i) => i * step) };
    }
  }
  const step = 10 ** Math.ceil(Math.log10(max / 4));
  return { top: Math.ceil(max / step) * step, ticks: Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step) };
}

// 1,200 -> "1.2K": compact from a thousand up (axis ticks).
export function compact(n) {
  if (Math.abs(n) < 1000) return String(n);
  const k = n / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1).replace(/\.0$/, '')}K`;
}

// A column with a rounded top (the data end) and a square bottom (the baseline).
export function roundedTopRect(x, y, w, h, radius = 4) {
  const r = Math.max(0, Math.min(radius, w / 2, h));
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

// A bar growing to the right: rounded at the data end (right), square at the baseline (left).
export function roundedRightRect(x, y, w, h, radius = 4) {
  const r = Math.max(0, Math.min(radius, h / 2, w));
  return `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x}Z`;
}

export const linePath = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

// Index of the position closest to x (for snapping a crosshair to the nearest point).
export function nearestIndex(positions, x) {
  let best = 0;
  for (let i = 1; i < positions.length; i++) if (Math.abs(positions[i] - x) < Math.abs(positions[best] - x)) best = i;
  return best;
}

// "2026-10-13" -> "Oct 13". (Parsed as UTC so the day never shifts with the time zone.)
export function shortDate(value) {
  const d = typeof value === 'string' && value.length === 10 ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(typeof value === 'string' && value.length === 10 ? { timeZone: 'UTC' } : {}) });
}

// Which of n columns get an axis label: every `every`-th counting back from the last, so today is always labelled.
export const labelIndexes = (n, every = 7) => Array.from({ length: n }, (_, i) => i).filter((i) => (n - 1 - i) % every === 0);

export const signed = (n) => (n > 0 ? `+${n}` : String(n));
