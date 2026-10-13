// Pure logic for the verb-tense section: which exercises to give next, what an exercise looks like when served, and
// how to check the ones Gemini writes. No database and no network, so it is all unit-tested.
import { IRREGULAR_VERBS } from '../data/irregular-verbs.js';
import { TENSE_EXERCISES, exerciseHash } from '../data/tense-exercises.js';
import { TENSES, TENSE_LEVELS, tenseById } from '../data/tenses.js';

export const MIN_ATTEMPTS = 5; // fewer answers than this say little about how well a tense is known
export const WEAK_BELOW = 80; // an accuracy under this (percent) counts as a weak tense

export const shuffle = (list, rng = Math.random) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---- What a learner is shown ----

// The wrong tense names for "Which tense is this?": the one it is most confused with, then others of the same time, then any.
export function identifyOptions(tenseId, rng = Math.random) {
  const lesson = tenseById(tenseId);
  const preferred = [lesson.contrast?.with, ...TENSES.filter((t) => t.time === lesson.time).map((t) => t.id)];
  const rest = shuffle(TENSES.map((t) => t.id), rng);
  const wrong = [];
  for (const id of [...preferred, ...rest]) {
    if (id && id !== tenseId && !wrong.includes(id) && wrong.length < 3) wrong.push(id);
  }
  const options = shuffle([tenseId, ...wrong], rng);
  return { options: options.map((id) => tenseById(id).name), correctIndex: options.indexOf(tenseId) };
}

// Bank exercise -> what the apps get. Multiple choice is shuffled here so the right answer is not always in one place.
export function serve(exercise, rng = Math.random) {
  const base = { id: exercise.id, type: exercise.type, tense: exercise.tense, why: exercise.why, prompt: exercise.prompt };
  if (exercise.type === 'fill' || exercise.type === 'fix') return { ...base, answers: exercise.answers };
  if (exercise.type === 'identify') return { ...base, ...identifyOptions(exercise.tense, rng) };
  if (exercise.type === 'choose') {
    const options = shuffle([exercise.answer, ...exercise.wrong], rng);
    return { ...base, options, correctIndex: options.indexOf(exercise.answer) };
  }
  throw new Error(`unknown exercise type ${exercise.type}`);
}

export const serveVerb = (verb) => ({
  id: verb.id,
  type: 'irregular',
  tense: 'irregular',
  base: verb.base,
  meaning: verb.meaning,
  past: verb.past,
  participle: verb.participle,
});

export const exercisesFor = (tense) => (tense === 'mixed' ? TENSE_EXERCISES : TENSE_EXERCISES.filter((e) => e.tense === tense));

// ---- Choosing what comes next ----

export const accuracy = (stat) => (stat?.attempts ? Math.round((stat.correct / stat.attempts) * 100) : null);

// 0 (known well) to 1 (often wrong); a tense with too few answers is "unknown", halfway.
export const weakness = (stat) => (stat && stat.attempts >= 3 ? 1 - stat.correct / stat.attempts : 0.5);

/**
 * Picks `count` items from `pool`.
 *   1. ones the learner got wrong last time (they come back until they are right)
 *   2. ones never seen
 *   3. ones answered right, the longest ago first
 * Within a group, a weaker tense comes a little earlier, which is what makes "mixed" practice focus on weak spots.
 * `itemStats`: Map id -> { lastCorrect, lastAt }.  `tenseStats`: Map tense -> { attempts, correct }.
 */
export function pickItems({ pool, itemStats = new Map(), tenseStats = new Map(), count, rng = Math.random }) {
  const seenAt = pool.map((e) => itemStats.get(e.id)?.lastAt).filter(Boolean).map((d) => +new Date(d));
  const oldest = Math.min(...seenAt, Infinity);
  const newest = Math.max(...seenAt, -Infinity);

  const keyOf = (e) => {
    const s = itemStats.get(e.id);
    const bonus = weakness(tenseStats.get(e.tense)) * 4;
    if (!s) return 10 + rng() * 5 - bonus; // never seen
    if (s.lastCorrect === false) return rng() * 5 - bonus; // missed last time
    const age = newest > oldest ? (+new Date(s.lastAt) - oldest) / (newest - oldest) : rng(); // 0 = longest ago
    return 20 + age * 5 - bonus;
  };

  const ranked = pool.map((e) => ({ e, key: keyOf(e) })).sort((a, b) => a.key - b.key);
  return shuffle(ranked.slice(0, count).map((r) => r.e), rng);
}

export const tenseSummary = (stat) => ({ attempts: stat?.attempts ?? 0, correct: stat?.correct ?? 0, accuracy: accuracy(stat) });

// The tense to practise next: the weakest one that has enough answers, otherwise the first lesson of the learner's
// level that has barely been practised.
export function recommend({ level, stats }) {
  let weakest = null;
  for (const lesson of TENSES) {
    const s = stats.get(lesson.id);
    const acc = accuracy(s);
    if (s && s.attempts >= MIN_ATTEMPTS && acc < WEAK_BELOW && (weakest === null || acc < weakest.acc)) weakest = { id: lesson.id, acc };
  }
  if (weakest) return { tense: weakest.id, reason: 'weakest' };

  const rank = (l) => TENSE_LEVELS.indexOf(l);
  const limit = rank(level ?? 'B1');
  const fresh = TENSES.find((t) => rank(t.level) <= limit && (stats.get(t.id)?.attempts ?? 0) < MIN_ATTEMPTS);
  return fresh ? { tense: fresh.id, reason: 'next' } : { tense: null, reason: 'done' };
}

// ---- Exercises written by Gemini ----

const BLANK = /____/g;
const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const blanks = (s) => (s.match(BLANK) ?? []).length;
const clean = (s) => String(s ?? '').trim();

/**
 * Checks what Gemini returned and keeps only exercises that are safe to give a learner: one blank where there should be
 * one, three really different wrong options, no answer equal to the question, nothing already in the bank.
 */
export function cleanGenerated(raw, { tense, avoid = [], count }) {
  const seen = new Set(avoid.map(norm));
  const out = [];
  for (const r of raw?.exercises ?? []) {
    const prompt = clean(r.prompt);
    const why = clean(r.why);
    if (!prompt || !why || seen.has(norm(prompt))) continue;
    const base = { id: `ai:${tense}:${exerciseHash(prompt)}`, tense, prompt, why, ai: true };

    if (r.type === 'fill') {
      const answers = [...new Set((r.answers ?? []).map(clean).filter(Boolean))];
      if (blanks(prompt) !== 1 || !answers.length) continue;
      out.push({ ...base, type: 'fill', answers });
    } else if (r.type === 'choose') {
      const answer = clean(r.answer);
      const wrong = [...new Set((r.wrong ?? []).map(clean).filter((w) => w && norm(w) !== norm(answer)))];
      if (blanks(prompt) !== 1 || !answer || wrong.length < 3) continue;
      const options = shuffle([answer, ...wrong.slice(0, 3)]);
      out.push({ ...base, type: 'choose', options, correctIndex: options.indexOf(answer) });
    } else if (r.type === 'fix') {
      const answers = [...new Set((r.answers ?? []).map(clean).filter(Boolean))];
      if (!answers.length || answers.some((a) => norm(a) === norm(prompt))) continue; // the "mistake" must really change
      out.push({ ...base, type: 'fix', answers });
    } else continue;

    seen.add(norm(prompt));
    if (out.length >= count) break;
  }
  return out;
}

export { IRREGULAR_VERBS, TENSE_EXERCISES };
