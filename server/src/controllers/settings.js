import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { decrypt, encrypt, maskKey } from '../services/crypto.js';
import { testKey } from '../services/gemini.js';
import { DEFAULT_MODELS, FREE_MODELS, FREE_MODEL_IDS, modelFor } from '../services/models.js';

// Never includes the key itself, only a masked hint.
function view(user) {
  return {
    email: user.email,
    level: user.level,
    nativeLang: user.nativeLang,
    settings: {
      correctionMode: user.settings.correctionMode,
      strictness: user.settings.strictness,
    },
    modelPrefs: { fast: modelFor(user, 'fast'), strong: modelFor(user, 'strong') },
    defaultModels: DEFAULT_MODELS,
    freeModels: FREE_MODELS, // the only models the app will use
    hasKey: Boolean(user.geminiKeyEnc),
    keyHint: user.geminiKeyHint,
  };
}

// Anything that is not on the free list is rejected, so a paid model can never be selected.
const modelName = z.enum(FREE_MODEL_IDS);
const apiKey = z.string().trim().min(20).max(200);

const updateSchema = z.object({
  nativeLang: z.string().trim().min(2).max(5).optional(),
  settings: z
    .object({
      correctionMode: z.enum(['every', 'end']).optional(),
      strictness: z.enum(['gentle', 'normal', 'strict']).optional(),
    })
    .optional(),
  modelPrefs: z.object({ fast: modelName.optional(), strong: modelName.optional() }).optional(),
  // string = save this key, null = remove it, omitted = leave as is.
  geminiKey: apiKey.nullable().optional(),
});

export async function getSettings(req, res) {
  res.json(view(req.user));
}

export async function updateSettings(req, res) {
  const body = updateSchema.parse(req.body);
  const user = req.user;

  if (body.nativeLang) user.nativeLang = body.nativeLang;
  for (const [k, v] of Object.entries(body.settings ?? {})) user.settings[k] = v;
  for (const [k, v] of Object.entries(body.modelPrefs ?? {})) user.modelPrefs[k] = v;

  if (body.geminiKey === null) {
    user.geminiKeyEnc = null;
    user.geminiKeyHint = null;
  } else if (body.geminiKey) {
    user.geminiKeyEnc = encrypt(body.geminiKey);
    user.geminiKeyHint = maskKey(body.geminiKey);
  }

  await user.save();
  res.json(view(user));
}

// Tests the key in the request body (so it can be checked before saving),
// or the saved one when the body is empty.
export async function testGeminiKey(req, res) {
  const { apiKey: candidate } = z.object({ apiKey: apiKey.optional() }).parse(req.body ?? {});

  let key = candidate;
  if (!key) {
    if (!req.user.geminiKeyEnc) {
      throw new AppError(412, 'KEY_MISSING', 'Enter an API key to test.');
    }
    try {
      key = decrypt(req.user.geminiKeyEnc);
    } catch {
      throw new AppError(412, 'KEY_MISSING', 'Your saved key could not be read. Please enter it again.');
    }
  }

  const model = modelFor(req.user, 'fast');
  await testKey(key, model);
  res.json({ valid: true, model });
}
