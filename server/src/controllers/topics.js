import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { Interest } from '../models/Interest.js';
import { Topic } from '../models/Topic.js';
import { FOCUS_AREAS } from '../services/focus.js';
import { generateJson } from '../services/gemini.js';
import { locked } from '../services/lock.js';
import { modelOpts } from '../services/models.js';
import { LANGUAGE_NAMES, topicBatch } from '../services/prompts.js';
import { buildSlots, dropRepeats } from '../services/topics.js';

const EXCLUDE_LAST = 80; // titles sent to Gemini so it does not repeat itself

// Built per request: the number of topics and the allowed focus skills change every time.
const batchSchema = ({ focusIds, translate }) =>
  z.object({
    topics: z
      .array(
        z.object({
          title: z.string().min(5).max(90),
          durationMinutes: z.number().int().min(5).max(15),
          openers: z.array(z.string().min(5)).length(3),
          vocab: z
            .array(
              z.object({
                word: z.string().min(1).max(40),
                meaning: z.string().min(2).max(140),
                ...(translate && { translation: z.string().min(1).max(60) }),
              }),
            )
            .length(8),
          scenario: z.string().min(20).max(600),
          focusTips: z
            .array(z.object({ skill: z.enum(focusIds), tip: z.string().min(10).max(320) }))
            .min(1)
            .max(3),
        }),
      )
      // No minItems/maxItems here on purpose: Gemini answers 400 INVALID_ARGUMENT when this array is
      // bounded and the items contain exact-length arrays. The count is enforced in code instead
      // (extras are cut in generate(); a few short is fine, slots are matched by position).
      // A refinement is not part of the JSON schema that is sent.
      .refine((topics) => topics.length >= 1, 'no topics returned'),
  });

const generateBody = z.object({
  fields: z.array(z.string().trim().min(1).max(40)).max(30).optional(), // limit to some of the saved interests
  count: z.number().int().min(1).max(10).default(6), // 10 takes ~11s, 6 about 7s
  surprise: z.boolean().default(false), // blend two interests per topic
});
const listQuery = z.object({
  favorite: z.enum(['1', 'true']).optional(),
  field: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const favoriteBody = z.object({ favorite: z.boolean().optional() });

const topicView = (t) => ({
  id: t.id,
  field: t.field,
  emoji: t.emoji,
  angle: t.angle,
  title: t.title,
  level: t.level,
  durationMinutes: t.durationMinutes,
  openers: [...t.openers],
  vocab: t.vocab.map(({ word, meaning, translation }) => ({ word, meaning, translation: translation ?? null })),
  scenario: t.scenario,
  focusTips: t.focusTips.map(({ skill, tip }) => ({ skill, tip })),
  favorite: t.favorite,
  createdAt: t.createdAt,
});

export async function generate(req, res) {
  const { fields: only, count, surprise } = generateBody.parse(req.body ?? {});
  const user = req.user;

  const interest = await Interest.findOne({ userId: user._id });
  if (!interest?.fields.length) throw new AppError(409, 'NO_INTERESTS', 'Pick your interests first.');

  let pool = interest.fields.map(({ name, emoji }) => ({ name, emoji }));
  if (only?.length) {
    const wanted = new Set(only.map((f) => f.toLowerCase()));
    pool = pool.filter((f) => wanted.has(f.name.toLowerCase()));
    if (!pool.length) throw new AppError(400, 'UNKNOWN_FIELD', 'None of those fields are in your interests.');
  }

  await locked(`topics:${user.id}`, async () => {
    const existing = await Topic.find({ userId: user._id }).sort({ _id: -1 }).limit(EXCLUDE_LAST).select('title');
    const seenTitles = existing.map((t) => t.title);

    const level = user.level ?? 'B1';
    const translate = user.nativeLang !== 'en' && Boolean(LANGUAGE_NAMES[user.nativeLang]);
    const slots = buildSlots(pool, count, { mix: surprise });
    const focus = FOCUS_AREAS.filter((f) => interest.focus.includes(f.id));

    const { system, prompt } = topicBatch({
      level,
      slots,
      focus,
      excludeTitles: seenTitles,
      language: translate ? user.nativeLang : 'en',
    });
    const out = await generateJson({
      apiKey: req.geminiKey,
      ...modelOpts(user, 'fast'),
      system,
      prompt,
      schema: batchSchema({ focusIds: focus.map((f) => f.id), translate }),
      temperature: 1,
      timeoutMs: 60_000, // a batch is a lot of text
    });

    // The server, not the model, decides field and angle. Then drop anything already seen.
    const fresh = dropRepeats(
      out.topics.slice(0, count).map((t, i) => ({ ...t, slot: slots[i] })),
      seenTitles,
    );
    if (!fresh.length) throw new AppError(502, 'GEMINI_REPEATS', 'Gemini only returned topics you already have. Try again.');

    const docs = await Topic.insertMany(
      fresh.map((t) => ({
        userId: user._id,
        field: t.slot.field,
        emoji: t.slot.emoji,
        angle: t.slot.angle,
        title: t.title.trim(),
        level,
        durationMinutes: t.durationMinutes,
        openers: t.openers,
        vocab: t.vocab,
        scenario: t.scenario,
        focusTips: t.focusTips,
      })),
    );
    res.status(201).json({ topics: docs.map(topicView) });
  });
}

// Newest first.
export async function list(req, res) {
  const { favorite, field, limit } = listQuery.parse(req.query);
  const filter = { userId: req.user._id };
  if (favorite) filter.favorite = true;
  if (field) filter.field = field;
  const topics = await Topic.find(filter).sort({ _id: -1 }).limit(limit);
  res.json({ topics: topics.map(topicView) });
}

// Sets the flag from the body, or toggles it when the body is empty.
export async function favorite(req, res) {
  const id = z.string().regex(/^[0-9a-f]{24}$/i).safeParse(req.params.id);
  if (!id.success) throw new AppError(404, 'NOT_FOUND', 'Topic not found');
  const { favorite: value } = favoriteBody.parse(req.body ?? {});

  const topic = await Topic.findOne({ _id: id.data, userId: req.user._id });
  if (!topic) throw new AppError(404, 'NOT_FOUND', 'Topic not found');
  topic.favorite = value ?? !topic.favorite;
  await topic.save();
  res.json({ topic: topicView(topic) });
}
