import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../middleware/errors.js';
import { quotaInfo, runWithFallback, toAppError } from './gemini.js';

// What the SDK throws: status + the raw Google JSON body as the message.
const googleError = (status, error) => Object.assign(new Error(JSON.stringify({ error })), { status });
const daily = googleError(429, {
  message: 'quota',
  details: [
    { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] },
    { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '10531s' },
  ],
});
const perMinute = googleError(429, {
  message: 'slow down',
  details: [
    { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }] },
    { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '27.4s' },
  ],
});

test('a daily-quota 429 is told apart from a per-minute one', () => {
  assert.deepEqual(quotaInfo(daily), { daily: true, retryAfterSeconds: 10531 });
  assert.deepEqual(quotaInfo(perMinute), { daily: false, retryAfterSeconds: 28 });
  assert.deepEqual(quotaInfo(new Error('not json')), { daily: false, retryAfterSeconds: undefined });
});

test('toAppError maps quota errors to distinct codes and names the model', () => {
  const d = toAppError(daily, 'gemini-3.8-flash');
  assert.equal(d.code, 'QUOTA_DAILY');
  assert.match(d.message, /gemini-3\.8-flash/);
  assert.equal(d.extra.retryAfterSeconds, 10531);
  const m = toAppError(perMinute, 'x');
  assert.equal(m.code, 'RATE_LIMITED');
  assert.equal(m.extra.retryAfterSeconds, 28);
});

test('toAppError maps the other Gemini failures', () => {
  assert.equal(toAppError(googleError(400, { message: 'API key not valid' })).code, 'KEY_INVALID');
  assert.equal(toAppError(googleError(404, { message: 'gone' }), 'm').code, 'MODEL_NOT_FOUND');
  assert.equal(toAppError(googleError(503, { message: 'busy' })).code, 'GEMINI_OVERLOADED');
  assert.equal(toAppError(Object.assign(new Error('x'), { name: 'AbortError' })).code, 'GEMINI_TIMEOUT');
});

const fail = (code) => new AppError(429, code, code);

test('falls back to the next model when one is out of quota', async () => {
  const tried = [];
  const out = await runWithFallback(['a', 'b', 'c'], async (m) => {
    tried.push(m);
    if (m === 'a') throw fail('QUOTA_DAILY');
    if (m === 'b') throw fail('MODEL_NOT_FOUND');
    return `answered by ${m}`;
  });
  assert.equal(out, 'answered by c');
  assert.deepEqual(tried, ['a', 'b', 'c']);
});

test('does not fall back for errors another model would not fix', async () => {
  const tried = [];
  await assert.rejects(
    runWithFallback(['a', 'b'], async (m) => {
      tried.push(m);
      throw new AppError(403, 'KEY_INVALID', 'bad key');
    }),
    { code: 'KEY_INVALID' },
  );
  assert.deepEqual(tried, ['a']);
});

test('when every model is out of daily quota, says so once, not about the last model only', async () => {
  await assert.rejects(runWithFallback(['a', 'b'], async () => { throw fail('QUOTA_DAILY'); }), (e) => {
    assert.equal(e.code, 'QUOTA_DAILY');
    assert.match(e.message, /all available models/);
    return true;
  });
  // with a single model the specific message is kept
  await assert.rejects(runWithFallback(['a'], async () => { throw new AppError(429, 'QUOTA_DAILY', 'only a'); }), /only a/);
});
