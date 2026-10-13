import { z } from 'zod';
import { generateJson } from '../services/gemini.js';
import { lookup } from '../services/dictionary.js';
import { modelOpts } from '../services/models.js';
import { LANGUAGE_NAMES, explainWord } from '../services/prompts.js';

// One English word: letters, apostrophes and hyphens only, so nothing odd reaches the URL or a prompt.
const word = z.string().trim().toLowerCase().regex(/^[\p{L}'’-]{1,40}$/u);
const explainBody = z.object({ word, sentence: z.string().trim().max(400).optional() });

export async function define(req, res) {
  const w = word.parse(req.params.word).replace(/’/g, "'");
  res.json({ entry: await lookup(w) });
}

// When the dictionary is slow or has no entry, or the learner wants a translation: Gemini explains the word
// in the sentence it was tapped in. One small call, only when asked for.
export async function explain(req, res) {
  const body = explainBody.parse(req.body ?? {});
  const user = req.user;
  const translate = user.nativeLang !== 'en' && Boolean(LANGUAGE_NAMES[user.nativeLang]);
  const { system, prompt } = explainWord({
    word: body.word,
    sentence: body.sentence,
    level: user.level ?? 'B1',
    language: translate ? user.nativeLang : 'en',
  });
  const result = await generateJson({
    apiKey: req.geminiKey,
    ...modelOpts(user, 'fast'),
    system,
    prompt,
    schema: z.object({
      meaning: z.string().min(1).max(300),
      ...(translate && { translation: z.string().min(1).max(80) }),
      example: z.string().min(1).max(300),
    }),
    temperature: 0.3,
    noThinking: true,
  });
  res.json({ explanation: { meaning: result.meaning, translation: result.translation ?? null, example: result.example } });
}
