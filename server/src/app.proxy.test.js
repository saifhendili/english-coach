import assert from 'node:assert/strict';
import { after, test } from 'node:test';

// The app reads its settings when it is imported, so they are set first. No database is needed: the requests below fail
// validation (400) before they reach it, and the login rate limit counts them all the same.
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/unused';
process.env.JWT_SECRET = 'test-secret';
const { createApp } = await import('./app.js');

const servers = [];
function start(options) {
  const server = createApp(options).listen(0);
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}
after(() => servers.forEach((s) => s.close()));

const login = (base, forwardedFor) =>
  fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', ...(forwardedFor && { 'x-forwarded-for': forwardedFor }) }, body: '{}' }).then((r) => r.status);

test('behind one proxy, each person has their own login limit (30 tries), read from X-Forwarded-For', async () => {
  const base = start({ trustProxy: 1 });
  const first = [];
  for (let i = 0; i < 30; i++) first.push(await login(base, '203.0.113.7'));
  assert.ok(first.every((s) => s === 400), 'the first 30 tries are answered normally');
  assert.equal(await login(base, '203.0.113.7'), 429, 'the 31st try from the same person is refused');
  assert.equal(await login(base, '198.51.100.9'), 400, 'somebody else is not affected');
});

test('reached directly, a forged X-Forwarded-For does not give a fresh limit', async () => {
  const base = start({ trustProxy: false });
  const statuses = [];
  for (let i = 0; i < 31; i++) statuses.push(await login(base, `192.0.2.${i + 1}`)); // a different "address" every time
  assert.equal(statuses[30], 429, 'the header is ignored, so the 31st try is still refused');
});

test('the health check answers without a login', async () => {
  const base = start({ trustProxy: 1 });
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});
