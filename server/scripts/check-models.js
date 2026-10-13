// Re-verifies that every model on the free list still answers for a real key.
// Google retires models quietly, so run this now and then:
//   GEMINI_KEY=AIza... npm run check-models
// Exits 1 if a model is gone or refused (404/403...), so the list in src/services/models.js needs updating.
// A 429 means the model exists but its free quota is used up right now: reported, not a failure.
import { createClient } from '../src/services/gemini.js';
import { FREE_MODELS } from '../src/services/models.js';

const key = process.env.GEMINI_KEY;
if (!key) {
  console.error('Set GEMINI_KEY to a Gemini API key.');
  process.exit(2);
}

const ai = createClient(key);
let failed = 0;
for (const { id } of FREE_MODELS) {
  const t = Date.now();
  try {
    await ai.models.generateContent({
      model: id,
      contents: 'Reply with: ok',
      config: { maxOutputTokens: 64, temperature: 0, abortSignal: AbortSignal.timeout(30_000) },
    });
    console.log(`OK    ${id.padEnd(26)} ${Date.now() - t}ms`);
  } catch (e) {
    if (e.status === 429) {
      console.log(`QUOTA ${id.padEnd(26)} exists, but its free quota is used up right now`);
      continue;
    }
    failed++;
    let msg = e.message;
    try {
      msg = JSON.parse(e.message).error.message;
    } catch {
      /* not JSON */
    }
    console.log(`FAIL  ${id.padEnd(26)} ${e.status ?? e.name}: ${msg.replace(/\s+/g, ' ').slice(0, 140)}`);
  }
}
console.log(failed ? `\n${failed} model(s) failed: update FREE_MODELS.` : '\nAll free models answered.');
process.exit(failed ? 1 : 0);
