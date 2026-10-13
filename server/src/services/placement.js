// Pure adaptive-testing logic (no I/O) so it can be unit-tested.
//
// The learner's ability is a number on the CEFR scale A1=0 … C2=5, starting at B1.
// After each answer it moves like an Elo rating: up when the learner beats the
// expectation for that item's level, down when they miss. The next item is
// generated at the level nearest the current estimate.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const START_LEVEL = 'B1';
export const START_ABILITY = LEVELS.indexOf(START_LEVEL);

export const MAX_QUESTIONS = 15;
export const MIN_QUESTIONS = 10; // before the "estimate is stable" stop can trigger
export const MIN_TO_FINISH = 6; // earliest the learner may stop on their own

// Fixed mix of skills; Gemini decides the content, not the structure.
// Productive tasks come later, once the estimate is already in the right area.
export const TYPE_PLAN = [
  'grammar', 'vocabulary', 'grammar', 'reading', 'vocabulary',
  'grammar', 'writing', 'reading', 'grammar', 'vocabulary',
  'reading', 'speaking', 'grammar', 'writing', 'vocabulary',
];
export const PRODUCTIVE = new Set(['writing', 'speaking']);

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

export const levelToNum = (level) => LEVELS.indexOf(level);
export const numToLevel = (n) => LEVELS[clamp(Math.round(n), 0, LEVELS.length - 1)];

// Probability of scoring well on an item at `level` for a learner at `ability`.
// Multiple choice has a 25% guessing floor.
export function expectedScore(ability, level, chance) {
  return chance + (1 - chance) * sigmoid(1.4 * (ability - level));
}

// `answeredBefore` shrinks the step size: big moves early, fine-tuning later.
export function updateAbility({ ability, level, score, answeredBefore, chance }) {
  const k = Math.max(0.35, 1.1 / (1 + 0.3 * answeredBefore));
  return clamp(ability + k * (score - expectedScore(ability, level, chance)), 0, LEVELS.length - 1);
}

// Writing/speaking are graded as the CEFR level the answer demonstrates.
// Showing the item's own level is a neutral 0.5; each level above/below shifts by 0.25.
export function productiveScore(demonstratedLevel, itemLevel) {
  return clamp(0.5 + 0.25 * (levelToNum(demonstratedLevel) - levelToNum(itemLevel)), 0, 1);
}

export const chanceFor = (type) => (PRODUCTIVE.has(type) ? 0 : 0.25);

// Stable = enough answers and the last 5 estimates barely moved.
export function isStable(abilityHistory) {
  if (abilityHistory.length < MIN_QUESTIONS) return false;
  const recent = abilityHistory.slice(-5);
  return Math.max(...recent) - Math.min(...recent) <= 0.45;
}

export function shouldStop(abilityHistory) {
  return abilityHistory.length >= MAX_QUESTIONS || isStable(abilityHistory);
}

// Final estimate: the running ability, nudged toward what the writing/speaking showed.
export function finalAbility(ability, questions) {
  const levels = questions
    .filter((q) => PRODUCTIVE.has(q.type) && q.grade?.cefrLevel)
    .map((q) => levelToNum(q.grade.cefrLevel));
  if (!levels.length) return ability;
  const productiveMean = levels.reduce((a, b) => a + b, 0) / levels.length;
  return 0.8 * ability + 0.2 * productiveMean;
}

// Per-skill percentage (0-100) over answered items.
export function skillBreakdown(questions) {
  const skills = {};
  for (const q of questions) {
    if (q.score == null) continue;
    const s = (skills[q.type] ??= { count: 0, total: 0 });
    s.count += 1;
    s.total += q.score;
  }
  return Object.fromEntries(
    Object.entries(skills).map(([type, { count, total }]) => [
      type,
      { count, score: Math.round((total / count) * 100) },
    ]),
  );
}

// Fisher-Yates. LLMs put the right answer in a favourite slot, so shuffle server-side.
export function shuffleOptions(options, answerIndex, rand = Math.random) {
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => options[i]), answerIndex: order.indexOf(answerIndex) };
}
