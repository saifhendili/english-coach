import { z } from 'zod';
import { PHRASEBANK, PHRASE_LEVELS, PHRASE_REGISTERS, categoryById } from '../data/phrasebank.js';
import { AppError } from '../middleware/errors.js';
import { savedKey } from '../models/SavedItem.js';
import { generateJson } from '../services/gemini.js';
import { modelOpts } from '../services/models.js';
import { LANGUAGE_NAMES, morePhrases, phrasePractice } from '../services/prompts.js';

const generateBody = z.object({
  categoryId: z.string().min(1).max(40),
  count: z.number().int().min(3).max(8).default(6),
  exclude: z.array(z.string().max(200)).max(100).default([]), // phrases already on the learner's screen
});
const practiceBody = z.object({
  phrase: z.string().trim().min(2).max(200),
  usage: z.string().trim().max(300).default(''),
  situation: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(1).max(600),
});

const generatedSchema = ({ translate }) =>
  z.object({
    phrases: z
      .array(
        z.object({
          text: z.string().min(3).max(160),
          usage: z.string().min(5).max(240),
          example: z.string().min(8).max(300),
          level: z.enum(PHRASE_LEVELS),
          register: z.enum(PHRASE_REGISTERS),
          ...(translate && { translation: z.string().min(1).max(160) }),
        }),
      )
      .refine((p) => p.length >= 1, 'no phrases returned'),
  });

const practiceSchema = z.object({
  usedPhrase: z.boolean(),
  natural: z.boolean(),
  score: z.number().int().min(0).max(10),
  corrected: z.string().max(800),
  feedback: z.string().min(1).max(500),
  modelAnswer: z.string().min(1).max(500),
});

// The curated phrasebank. Static, so it costs no quota.
export function list(_req, res) {
  res.json({ categories: PHRASEBANK });
}

// "More like these": extra phrases for a category, at the learner's level.
export async function generate(req, res) {
  const { categoryId, count, exclude } = generateBody.parse(req.body ?? {});
  const category = categoryById(categoryId);
  if (!category) throw new AppError(404, 'NOT_FOUND', 'Unknown category');
  const user = req.user;
  const translate = user.nativeLang !== 'en' && Boolean(LANGUAGE_NAMES[user.nativeLang]);

  const known = [...category.phrases.map((p) => p.text), ...exclude];
  const { system, prompt } = morePhrases({
    category,
    level: user.level ?? 'B1',
    language: translate ? user.nativeLang : 'en',
    exclude: known,
    count,
  });
  const out = await generateJson({
    apiKey: req.geminiKey,
    ...modelOpts(user, 'fast'),
    system,
    prompt,
    schema: generatedSchema({ translate }),
    temperature: 0.9,
    noThinking: true,
  });

  const seen = new Set(known.map(savedKey));
  const phrases = [];
  for (const p of out.phrases) {
    const key = savedKey(p.text);
    if (seen.has(key)) continue; // the model repeated one
    seen.add(key);
    phrases.push({ ...p, translation: p.translation ?? null });
  }
  res.json({ phrases: phrases.slice(0, count) });
}

// Practice drill: did the learner use the phrase, and naturally?
export async function practice(req, res) {
  const body = practiceBody.parse(req.body);
  const user = req.user;
  const { system, prompt } = phrasePractice({
    phrase: body.phrase,
    usage: body.usage,
    situation: body.situation,
    answer: body.answer,
    level: user.level ?? 'B1',
    language: user.nativeLang,
  });
  const result = await generateJson({
    apiKey: req.geminiKey,
    ...modelOpts(user, 'strong'),
    system,
    prompt,
    schema: practiceSchema,
    temperature: 0.3,
    noThinking: true,
  });
  res.json({ result });
}
