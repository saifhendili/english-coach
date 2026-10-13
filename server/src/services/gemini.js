import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { AppError } from '../middleware/errors.js';

// Always per request, never a singleton: a key change in Settings applies immediately.
export function createClient(apiKey) {
  return new GoogleGenAI({ apiKey });
}

// The SDK throws ApiError with the raw response body as the message,
// usually '{"error":{"code":400,"message":"...","status":"INVALID_ARGUMENT"}}'.
function googleError(err) {
  try {
    return JSON.parse(err.message)?.error ?? {};
  } catch {
    return {};
  }
}

// A 429 is either "too many per minute" (wait a little) or "free daily quota used up"
// (waiting is pointless until midnight Pacific). Google says which in the error details.
export function quotaInfo(err) {
  const details = googleError(err).details ?? [];
  const violations = details.flatMap((d) => d.violations ?? []);
  const retryDelay = details.find((d) => d['@type']?.includes('RetryInfo'))?.retryDelay; // e.g. "27s"
  return {
    daily: violations.some((v) => /PerDay/i.test(v.quotaId ?? '')),
    retryAfterSeconds: retryDelay ? Math.ceil(parseFloat(retryDelay)) : undefined,
  };
}

export function toAppError(err, model) {
  if (err instanceof AppError) return err;
  const status = err?.status;
  const msg = googleError(err ?? {}).message ?? err?.message;

  if (status === 429) {
    const { daily, retryAfterSeconds } = quotaInfo(err);
    if (daily) {
      return new AppError(
        429,
        'QUOTA_DAILY',
        `The free daily limit for ${model ?? 'this model'} is used up. It resets at midnight Pacific time.`,
        { model, retryAfterSeconds },
      );
    }
    return new AppError(429, 'RATE_LIMITED', 'Gemini quota reached. Wait a minute and try again.', {
      model,
      retryAfterSeconds: retryAfterSeconds ?? 60,
    });
  }
  if (status === 400 && /api key/i.test(msg)) {
    return new AppError(400, 'KEY_INVALID', 'Gemini rejected this API key.');
  }
  if (status === 401 || status === 403) {
    return new AppError(403, 'KEY_INVALID', 'This API key is not allowed to use Gemini.');
  }
  if (status === 404) {
    return new AppError(400, 'MODEL_NOT_FOUND', `Model not available for this key: ${msg}`, { model });
  }
  if (err?.name === 'AbortError') {
    return new AppError(504, 'GEMINI_TIMEOUT', 'Gemini took too long to answer. Try again.');
  }
  if (status === 503) {
    return new AppError(503, 'GEMINI_OVERLOADED', 'Gemini is busy right now. Try again shortly.');
  }
  return new AppError(502, 'GEMINI_ERROR', msg || 'Gemini request failed');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Without a timeout a stalled request freezes the learner's screen (seen: 200s+).
const CALL_TIMEOUT_MS = 25_000;

// Retry per-minute quota and overload errors with exponential backoff + jitter (1s, 2s, 4s).
// Not retried: a daily quota (waiting does not help) and, after one retry, a timeout.
export async function withRetry(fn, { retries = 3, baseMs = 1000, model } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const timedOut = err?.name === 'AbortError';
      const dailyQuota = err?.status === 429 && quotaInfo(err).daily;
      const retryable = (err?.status === 429 && !dailyQuota) || err?.status === 503 || timedOut;
      if (!retryable || attempt >= (timedOut ? Math.min(retries, 1) : retries)) throw toAppError(err, model);
      await sleep(baseMs * 2 ** attempt + Math.random() * 250);
    }
  }
}

// Free-tier quota is counted per model, so when one model is used up, rate limited or
// retired, the next free model usually still works.
const FALLBACK_CODES = new Set(['QUOTA_DAILY', 'RATE_LIMITED', 'MODEL_NOT_FOUND']);

export async function runWithFallback(models, fn) {
  let lastError;
  for (const [i, model] of models.entries()) {
    try {
      return await fn(model);
    } catch (err) {
      if (!FALLBACK_CODES.has(err?.code)) throw err;
      lastError = err;
      if (models[i + 1]) console.warn(`[gemini] ${model} failed (${err.code}), falling back to ${models[i + 1]}`);
    }
  }
  if (models.length > 1 && lastError.code === 'QUOTA_DAILY') {
    throw new AppError(
      429,
      'QUOTA_DAILY',
      'The free daily limits of all available models are used up. They reset at midnight Pacific time.',
    );
  }
  throw lastError;
}

// The 2.5 models "think" before answering, which costs 3-4 seconds of silence. Turning it off keeps
// quality for short conversational tasks (tested) and brings the first text back to under a second.
// Other families reject the setting (400), so it is only sent to gemini-2.5-*.
function jsonConfig({ model, system, temperature, jsonSchema, timeoutMs, signal, noThinking }) {
  const timeout = AbortSignal.timeout(timeoutMs); // fresh per attempt
  return {
    systemInstruction: system,
    temperature,
    responseMimeType: 'application/json',
    responseJsonSchema: jsonSchema,
    abortSignal: signal ? AbortSignal.any([timeout, signal]) : timeout,
    ...(noThinking && model.startsWith('gemini-2.5') && { thinkingConfig: { thinkingBudget: 0 } }),
  };
}

/**
 * One structured-JSON call. The zod schema is the single source of truth:
 * it is sent to Gemini as the response schema and used to validate the reply.
 * `fallbacks` are other free models to try if `model` is out of quota or gone.
 */
export async function generateJson({
  apiKey, model, fallbacks = [], prompt, system, schema, temperature = 0.9, timeoutMs = CALL_TIMEOUT_MS, noThinking = false,
}) {
  const ai = createClient(apiKey);
  const jsonSchema = z.toJSONSchema(schema);

  return runWithFallback([model, ...fallbacks.filter((m) => m !== model)], async (useModel) => {
    // Structured output is reliable but not perfect: one retry on a malformed or off-schema reply.
    for (let attempt = 0; ; attempt++) {
      const response = await withRetry(
        () =>
          ai.models.generateContent({
            model: useModel,
            contents: prompt, // a string, or a list of {role, parts} turns
            config: jsonConfig({ model: useModel, system, temperature, jsonSchema, timeoutMs, noThinking }),
          }),
        { model: useModel },
      );

      let parsed;
      try {
        parsed = JSON.parse(response.text ?? '');
      } catch {
        if (attempt === 0) continue;
        throw new AppError(502, 'GEMINI_BAD_JSON', 'Gemini returned malformed JSON. Try again.');
      }
      const result = schema.safeParse(parsed);
      if (result.success) return result.data;
      if (attempt === 0) continue;
      throw new AppError(502, 'GEMINI_BAD_SHAPE', 'Gemini returned an unexpected response. Try again.');
    }
  });
}

// Starts a stream and waits for its first chunk: that is where quota/model errors show up,
// so retries and fallbacks can still happen before the learner has seen anything.
async function openStream(ai, params) {
  const iterator = (await ai.models.generateContentStream(params))[Symbol.asyncIterator]();
  return { iterator, first: await iterator.next() };
}

/**
 * Like generateJson, but streams. `onText(textSoFar)` is called as the JSON grows (see stream.js to read a
 * property out of it). Falls back to another model only before the first chunk; once text has been shown
 * a failure is final (STREAM_FAILED), because a restart would replay the reply to the learner.
 * If the finished text is not valid, one ordinary (non-streamed) call repairs the turn.
 * `signal` aborts the call, e.g. when the learner closes the page.
 */
export async function streamJson({
  apiKey, model, fallbacks = [], contents, system, schema, temperature = 0.8, timeoutMs = 40_000,
  noThinking = false, signal, onText = () => {},
}) {
  const ai = createClient(apiKey);
  const jsonSchema = z.toJSONSchema(schema);
  const models = [model, ...fallbacks.filter((m) => m !== model)];

  const raw = await runWithFallback(models, async (useModel) => {
    const params = {
      model: useModel,
      contents,
      config: jsonConfig({ model: useModel, system, temperature, jsonSchema, timeoutMs, signal, noThinking }),
    };
    const { iterator, first } = await withRetry(() => openStream(ai, params), { model: useModel });

    let text = '';
    try {
      for (let step = first; !step.done; step = await iterator.next()) {
        text += step.value.text ?? '';
        onText(text);
      }
    } catch (err) {
      const e = toAppError(err, useModel);
      throw new AppError(502, 'STREAM_FAILED', e.message); // not a fallback code: the learner already saw text
    }
    return text;
  });

  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    /* fall through to the repair call */
  }
  return generateJson({ apiKey, model, fallbacks, prompt: contents, system, schema, temperature, noThinking });
}

// A tiny real call, so it also catches quota and wrong-model problems.
// No retries or fallback: the user is waiting on a button and should see exactly what happened.
export async function testKey(apiKey, model) {
  const ai = createClient(apiKey);
  try {
    await ai.models.generateContent({
      model,
      contents: 'Reply with the single word: ok',
      config: { maxOutputTokens: 8, temperature: 0, abortSignal: AbortSignal.timeout(15_000) },
    });
  } catch (err) {
    throw toAppError(err, model);
  }
}
