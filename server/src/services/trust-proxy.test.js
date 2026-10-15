import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTrustProxy } from './trust-proxy.js';

test('no proxy when it is not set, empty or 0', () => {
  assert.equal(parseTrustProxy(undefined), false);
  assert.equal(parseTrustProxy(null), false);
  assert.equal(parseTrustProxy(''), false);
  assert.equal(parseTrustProxy('  '), false);
  assert.equal(parseTrustProxy('0'), false);
});

test('a number of proxies is a number of hops', () => {
  assert.equal(parseTrustProxy('1'), 1);
  assert.equal(parseTrustProxy(' 2 '), 2);
});

test('anything else is refused: "true" would trust a header any client can forge', () => {
  for (const bad of ['true', 'yes', '-1', '1.5', 'loopback', '1,2']) {
    assert.throws(() => parseTrustProxy(bad), /TRUST_PROXY must be a number/, bad);
  }
});
