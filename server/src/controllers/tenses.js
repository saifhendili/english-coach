import { z } from 'zod';
import { IRREGULAR_VERBS } from '../data/irregular-verbs.js';
import { TENSE_EXERCISES } from '../data/tense-exercises.js';
import { TENSES, tenseById } from '../data/tenses.js';
import { AppError } from '../middleware/errors.js';
import { Interest } from '../models/Interest.js';
import { Mistake } from '../models/Mistake.js';
import { TenseItemStat, TenseStat } from '../models/TenseStat.js';
import { generateJson } from '../services/gemini.js';
import { modelOpts } from '../services/models.js';
import { tenseExercises } from '../services/prompts.js';
import { cleanGenerated, exercisesFor, pickItems, recommend, serve, serveVerb, tenseSummary } from '../services/tenses.js';

const TENSE_IDS = TENSES.map((t) => t.id);
const KNOWN_IDS = new Set([...TENSE_EXERCISES.map((e) => e.id), ...IRREGULAR_VERBS.map((v) => v.id)]);

const practiceQuery = z.object({
  tense: z.enum([...TENSE_IDS, 'mixed', 'irregular']),
  count: z.coerce.number().int().min(3).max(20).default(10),
});
const recordBody = z.object({
  results: z
    .array(z.object({ id: z.string().min(1).max(120), tense: z.enum([...TENSE_IDS, 'irregular']), correct: z.boolean() }))
    .min(1)
    .max(60),
});
const generateBody = z.object({ tense: z.enum(TENSE_IDS), count: z.number().int().min(3).max(8).default(6) });

const generatedSchema = z.object({
  exercises: z.array(
    z.object({
      type: z.enum(['fill', 'choose', 'fix']),
      prompt: z.string().min(8).max(240),
      answers: z.array(z.string().max(200)),
      answer: z.string().max(120),
      wrong: z.array(z.string().max(120)),
      why: z.string().min(5).max(260),
    }),
  ),
});

const statsMap = async (userId) => new Map((await TenseStat.find({ userId }).lean()).map((s) => [s.tense, s]));

const statsView = (map) => ({
  ...Object.fromEntries(TENSE_IDS.map((id) => [id, tenseSummary(map.get(id))])),
  irregular: tenseSummary(map.get('irregular')),
});

// Everything the Grammar screen needs: the lessons (static), how the learner is doing, and what to practise next.
export async function overview(req, res) {
  const userId = req.user._id;
  const [map, tenseMistakes] = await Promise.all([statsMap(userId), Mistake.countDocuments({ userId, type: 'tense' })]);
  res.json({
    lessons: TENSES,
    stats: statsView(map),
    recommended: recommend({ level: req.user.level, stats: map }),
    chatTenseMistakes: tenseMistakes,
    irregular: { count: IRREGULAR_VERBS.length, verbs: IRREGULAR_VERBS.map(({ base, past, participle, meaning }) => ({ base, past, participle, meaning })) },
  });
}

// A practice set from the hand-written bank (costs no Gemini quota). `mixed` draws from every tense.
export async function practice(req, res) {
  const { tense, count } = practiceQuery.parse(req.query);
  const userId = req.user._id;

  const pool = tense === 'irregular' ? IRREGULAR_VERBS : exercisesFor(tense);
  const [items, map] = await Promise.all([
    TenseItemStat.find({ userId, itemId: { $in: pool.map((e) => e.id) } }).lean(),
    tense === 'mixed' ? statsMap(userId) : new Map(),
  ]);
  const itemStats = new Map(items.map((i) => [i.itemId, i]));
  const picked = pickItems({ pool, itemStats, tenseStats: map, count });
  res.json({ exercises: picked.map((e) => (tense === 'irregular' ? serveVerb(e) : serve(e))) });
}

// The learner finished (or left) a session: remember how each answer went.
export async function record(req, res) {
  const { results } = recordBody.parse(req.body ?? {});
  const userId = req.user._id;
  const now = new Date();

  const perTense = new Map();
  const itemOps = [];
  for (const r of results) {
    const t = perTense.get(r.tense) ?? { attempts: 0, correct: 0 };
    t.attempts += 1;
    t.correct += r.correct ? 1 : 0;
    perTense.set(r.tense, t);

    // Exercises Gemini wrote ("ai:...") are not stored, so they only count towards the tense totals.
    if (KNOWN_IDS.has(r.id)) {
      itemOps.push({
        updateOne: {
          filter: { userId, itemId: r.id },
          update: { $inc: { seen: 1, correct: r.correct ? 1 : 0 }, $set: { tense: r.tense, lastCorrect: r.correct, lastAt: now } },
          upsert: true,
        },
      });
    }
  }

  await Promise.all([
    TenseStat.bulkWrite(
      [...perTense].map(([tense, t]) => ({
        updateOne: { filter: { userId, tense }, update: { $inc: t, $set: { lastPracticedAt: now } }, upsert: true },
      })),
    ),
    itemOps.length ? TenseItemStat.bulkWrite(itemOps) : null,
  ]);

  const map = await statsMap(userId);
  res.json({ stats: statsView(map), recommended: recommend({ level: req.user.level, stats: map }) });
}

// "Write new ones": fresh exercises for one tense, about the learner's interests, at their level.
export async function generate(req, res) {
  const { tense, count } = generateBody.parse(req.body ?? {});
  const lesson = tenseById(tense);
  const user = req.user;

  const interest = await Interest.findOne({ userId: user._id }).lean();
  const interests = (interest?.fields ?? []).map((f) => f.name).sort(() => Math.random() - 0.5).slice(0, 3);
  const avoid = exercisesFor(tense).map((e) => e.prompt);

  const { system, prompt } = tenseExercises({ lesson, level: user.level ?? 'B1', interests, count: count + 2, language: user.nativeLang, avoid });
  const out = await generateJson({
    apiKey: req.geminiKey,
    ...modelOpts(user, 'fast'),
    system,
    prompt,
    schema: generatedSchema,
    temperature: 0.9,
    noThinking: true,
  });

  const exercises = cleanGenerated(out, { tense, avoid, count });
  if (!exercises.length) throw new AppError(502, 'GEMINI_BAD_SHAPE', 'Gemini wrote exercises that did not pass the checks. Try again.');
  res.json({ exercises });
}
