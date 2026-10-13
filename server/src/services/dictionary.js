// Free dictionary (api.dictionaryapi.dev): definitions, phonetics and audio, no key and no Gemini quota.
// Fetched by the server because the API does not allow requests from web pages (no CORS headers).
import { AppError } from '../middleware/errors.js';

// What the app shows: a few definitions, one phonetic spelling, one audio file.
export function normalizeEntry(entries) {
  if (!Array.isArray(entries) || !entries.length) return null;
  const definitions = entries
    .flatMap((e) => e.meanings ?? [])
    .flatMap((m) =>
      (m.definitions ?? []).slice(0, 2).map((d) => ({ partOfSpeech: m.partOfSpeech ?? '', text: d.definition, example: d.example ?? '' })),
    )
    .filter((d) => d.text)
    .slice(0, 4);
  const phonetics = entries.flatMap((e) => e.phonetics ?? []);
  return {
    word: entries[0].word,
    phonetic: entries[0].phonetic ?? phonetics.find((p) => p.text)?.text ?? '',
    audio: phonetics.find((p) => p.audio)?.audio ?? '',
    definitions,
  };
}

const DAY = 24 * 60 * 60 * 1000;
const cache = new Map(); // word -> { at, ttl, entry }
const MAX_CACHED = 1000;

// Returns the entry, or null when the dictionary has no such word.
export async function lookup(word, { fetchImpl = fetch } = {}) {
  const hit = cache.get(word);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.entry;

  let res;
  try {
    res = await fetchImpl(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      // The free API answers common words in well under a second but can hang on others: do not make the learner wait.
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    throw new AppError(502, 'DICTIONARY_UNAVAILABLE', 'The dictionary is not available right now.');
  }

  let entry = null;
  let ttl = DAY;
  if (res.status === 404) {
    ttl = 60 * 60 * 1000; // an unknown word may be added later: look again in an hour
  } else if (res.ok) {
    entry = normalizeEntry(await res.json().catch(() => null));
  } else {
    throw new AppError(502, 'DICTIONARY_UNAVAILABLE', 'The dictionary is not available right now.');
  }

  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value); // oldest first
  cache.set(word, { at: Date.now(), ttl, entry });
  return entry;
}
