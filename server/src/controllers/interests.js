import { z } from 'zod';
import { Interest } from '../models/Interest.js';
import { PlacementAttempt } from '../models/PlacementAttempt.js';
import { FOCUS_AREAS, FOCUS_IDS, suggestFocus } from '../services/focus.js';
import { generateJson } from '../services/gemini.js';
import { modelOpts } from '../services/models.js';
import { suggestFields } from '../services/prompts.js';
import { cleanFieldName, displayName } from '../services/topics.js';

const fieldName = z.string().transform(cleanFieldName).pipe(z.string().min(2).max(40));
const field = z.object({ name: fieldName, emoji: z.string().trim().min(1).max(16).default('💬') });

const putBody = z.object({
  fields: z.array(field).min(1).max(30),
  focus: z.array(z.enum(FOCUS_IDS)).min(1),
});
const suggestBody = z.object({
  selected: z.array(fieldName).max(30).default([]),
  exclude: z.array(fieldName).max(200).default([]),
});

const suggestSchema = z.object({
  fields: z.array(z.object({ name: z.string().min(2).max(40), emoji: z.string().min(1).max(16) })).min(6).max(16),
});

const lower = (s) => s.toLowerCase();

async function view(user) {
  const doc = await Interest.findOne({ userId: user._id });
  let suggestedFocus = [];
  if (!doc) {
    // First visit: start from the skills the placement test found weakest.
    const last = await PlacementAttempt.findOne({ userId: user._id, status: 'finished' }).sort({ finishedAt: -1 });
    suggestedFocus = suggestFocus(last?.breakdown);
  }
  return {
    saved: Boolean(doc),
    fields: doc?.fields.map(({ name, emoji }) => ({ name, emoji })) ?? [],
    focus: doc?.focus ?? [],
    suggestedFocus,
    focusOptions: FOCUS_AREAS.map(({ id, label, description }) => ({ id, label, description })),
  };
}

export async function get(req, res) {
  res.json(await view(req.user));
}

export async function put(req, res) {
  const body = putBody.parse(req.body);

  // Same field twice (different case) or the same focus twice: keep the first.
  const seen = new Set();
  const fields = body.fields
    .filter((f) => !seen.has(lower(f.name)) && seen.add(lower(f.name)))
    .map((f) => ({ ...f, name: displayName(f.name) }));
  const focus = [...new Set(body.focus)];

  await Interest.findOneAndUpdate(
    { userId: req.user._id },
    { fields, focus },
    { upsert: true, setDefaultsOnInsert: true },
  );
  res.json(await view(req.user));
}

// "More fields": Gemini proposes interest areas close to what the learner picked.
export async function suggest(req, res) {
  const { selected, exclude } = suggestBody.parse(req.body ?? {});
  const known = new Set([...exclude, ...selected].map(lower));

  const { system, prompt } = suggestFields({ selected, exclude: [...known] });
  const out = await generateJson({
    apiKey: req.geminiKey,
    ...modelOpts(req.user, 'fast'),
    system,
    prompt,
    schema: suggestSchema,
    temperature: 1,
  });

  const suggestions = [];
  for (const f of out.fields) {
    const name = cleanFieldName(f.name);
    if (name.length < 2 || known.has(lower(name))) continue; // model ignored the exclusion list
    known.add(lower(name));
    suggestions.push({ name, emoji: f.emoji.trim() });
  }
  res.json({ suggestions: suggestions.slice(0, 12) });
}
