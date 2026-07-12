// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkVerification, rateLimited, DEV_CODE } from './verify.js';

test('dev bypass: the bypass code approves, anything else is rejected', async () => {
  // No Twilio env in tests -> dev mode.
  assert.equal(await checkVerification('+6590000001', DEV_CODE), true);
  assert.equal(await checkVerification('+6590000001', '123456'), false);
});

test('rate limit: a second send within 30s is blocked', () => {
  const p = '+6590000002';
  assert.equal(rateLimited(p), false); // first send allowed
  assert.equal(rateLimited(p), true); // immediate resend blocked
});

test('rate limit is per-number (independent counters)', () => {
  assert.equal(rateLimited('+6590000003'), false);
  assert.equal(rateLimited('+6590000004'), false);
});
