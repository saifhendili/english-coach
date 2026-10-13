// Spaced repetition with FSRS (ts-fsrs): every saved word/phrase and every mistake is a card, and each
// answer (Again / Hard / Good / Easy) decides when it comes back.
//
// Learning steps are off: a card the learner has just met goes straight to day-scale intervals (Again 1 day,
// Good 3 days, ...) instead of coming back in 10 minutes. In a phone app that keeps the "due" badge calm.
// (A card answered Again is shown once more at the end of that same session: see the Review page.)
import { createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';

export const RATING = { again: 1, hard: 2, good: 3, easy: 4 };
export const NEW_PER_DAY = 10; // unseen cards introduced per day, so a pile of saved items is not one huge session

export function createScheduler({ fuzz = true, retention = 0.9 } = {}) {
  // Fuzz nudges long intervals a little so cards saved together do not all fall due on the same day.
  return fsrs(generatorParameters({ enable_short_term: false, enable_fuzz: fuzz, request_retention: retention }));
}
const defaultScheduler = createScheduler();

// A stored card (dates may come back as strings) as a ts-fsrs card; an item never reviewed starts empty.
export function cardOf(item, now = new Date()) {
  const c = item.fsrs;
  if (!c) return createEmptyCard(now);
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

// "10m", "5h", "3d", "3w", "2mo", "1.5y": how far away a due date is, short enough for a button.
export function formatInterval(due, now = new Date()) {
  const minutes = Math.max(0, Math.round((due - now) / 60_000));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

// What the item's fields become after answering with `rating`.
export function applyRating(item, rating, now = new Date(), scheduler = defaultScheduler) {
  const { card } = scheduler.next(cardOf(item, now), now, rating);
  return { fsrs: card, due: card.due, reps: card.reps, lapses: card.lapses };
}

// When each answer would bring the card back, for the buttons: { 1: '1d', 2: '2d', 3: '3d', 4: '8d' }.
export function previewIntervals(item, now = new Date(), scheduler = defaultScheduler) {
  const outcomes = scheduler.repeat(cardOf(item, now), now);
  return Object.fromEntries([1, 2, 3, 4].map((r) => [r, formatInterval(outcomes[r].card.due, now)]));
}

// Takes one from each list in turn: [a1, b1, a2, b2, ...], then whatever is left of the longer one.
// New cards are handed out this way so a long list of saved words cannot push back the corrections.
export function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}
