// Pure helpers behind the Progress page (no database), so they can be tested with fixed dates.
// Days are the server's local days, which is the learner's day when the app runs on their own machine.

const pad = (n) => String(n).padStart(2, '0');

// '2026-10-13'
export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The last n days as keys, oldest first and today last. (Noon avoids daylight-saving edges.)
export function lastDays(n, today = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (n - 1 - i));
    return dayKey(d);
  });
}

const dayNumber = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

export function countByDay(dates) {
  const counts = new Map();
  for (const date of dates) {
    const key = dayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// One row per day: how many messages were written and how many cards reviewed.
export function buildActivity(days, messageDates, reviewDates) {
  const messages = countByDay(messageDates);
  const reviews = countByDay(reviewDates);
  return days.map((date) => ({ date, messages: messages.get(date) ?? 0, reviews: reviews.get(date) ?? 0 }));
}

export const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);

// Consecutive days with any activity. The current streak is still alive if the last active day was
// yesterday (today is not over yet); it is 0 once a whole day has been missed.
export function streaks(activeKeys, today = new Date()) {
  const days = [...new Set(activeKeys)].map(dayNumber).sort((a, b) => a - b);
  if (!days.length) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const todayNumber = dayNumber(dayKey(today));
  const last = days.at(-1);
  if (last < todayNumber - 1) return { current: 0, best };
  let current = 1;
  for (let i = days.length - 1; i > 0 && days[i] === days[i - 1] + 1; i--) current++;
  return { current, best };
}

export const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : null);
