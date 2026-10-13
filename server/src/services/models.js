// The only Gemini models the app will use: those with a FREE tier.
//
// Verified 2026-10-12 two ways:
//  1. Google's pricing page (ai.google.dev/gemini-api/docs/pricing) lists the model as free.
//  2. A real call succeeds with a free-tier key (the Pro models answered
//     "...PerProjectPerModel-FreeTier" quota errors, so that key had no billing).
// Deliberately left out:
//  - gemini-2.5-flash-lite, gemini-2.5-pro: listed as free, but the API answers 404
//    "no longer available to new users".
//  - gemini-3.1-pro-preview, gemini-pro-latest: no free tier (quota 0).
//  - gemini-3.5-flash, gemini-3.7-flash: work today, but are not documented as free.
//  - "-latest" aliases: they can move to a non-free model without notice.
// Google retires models without much warning: re-run `npm run check-models` now and then.
//
// Notes come from timing the real placement prompts (3 runs each).
export const FREE_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', note: 'Fastest (about 1s) and reliable. Best for questions and topics.' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', note: 'Reliable, 1-5s. Good for grading and reports. Older generation that Google may retire.' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', note: 'Newest and strongest but slow (about 5s), and only 20 free requests a day (measured).' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (preview)', note: 'About 3-5s. Preview model: may change or disappear.' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', note: 'Quick to grade, but slow and erratic at writing questions in tests.' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', note: 'Often failed to return valid questions in tests. Not recommended.' },
];

// fast: placement questions, topics. strong: grading, corrections, reports.
// Different models on purpose: free-tier quota is counted per model, so this doubles it.
// (gemini-3.8-flash was the first pick for "strong", but its free quota is only 20 requests a day.)
export const DEFAULT_MODELS = { fast: 'gemini-3.5-flash-lite', strong: 'gemini-2.5-flash' };

// Tried in this order when a model is out of quota or retired. Only models that were
// reliable at returning structured JSON in tests (not 3.1-flash-lite or 3.6-flash).
const FALLBACK_ORDER = ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
export const fallbackChain = (model) => FALLBACK_ORDER.filter((m) => m !== model);

export const FREE_MODEL_IDS = FREE_MODELS.map((m) => m.id);
export const isFreeModel = (id) => FREE_MODEL_IDS.includes(id);

// tier: 'fast' or 'strong'. A stored choice that is no longer on the free list is ignored.
export function modelFor(user, tier) {
  const chosen = user.modelPrefs?.[tier];
  return isFreeModel(chosen) ? chosen : DEFAULT_MODELS[tier];
}

// The user's chosen model for a tier, plus other free models to fall back on if it runs out of quota.
export function modelOpts(user, tier) {
  const model = modelFor(user, tier);
  return { model, fallbacks: fallbackChain(model) };
}
