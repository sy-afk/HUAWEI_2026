// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailConfigured, sendDrillEmail } from './email.js';

function clearEmailEnv() {
  delete process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_SCRIPT_URL;
}

test('emailConfigured requires BOTH providers', () => {
  clearEmailEnv();
  assert.equal(emailConfigured(), false);

  process.env.OPENAI_API_KEY = 'sk-test';
  assert.equal(emailConfigured(), false, 'a generator with no sender is not configured');

  clearEmailEnv();
  process.env.GOOGLE_SCRIPT_URL = 'https://example.com/send';
  assert.equal(emailConfigured(), false, 'a sender with no generator is not configured');

  process.env.OPENAI_API_KEY = 'sk-test';
  assert.equal(emailConfigured(), true);
  clearEmailEnv();
});

// The security control: an unconfigured deploy must never silently send anything.
test('FAILS CLOSED: sendDrillEmail refuses when unconfigured', async () => {
  clearEmailEnv();
  await assert.rejects(() => sendDrillEmail({ to: 'someone@example.com' }), {
    code: 'EMAIL_UNAVAILABLE',
  });
});

test('FAILS CLOSED: a partial config still refuses (no half-send)', async () => {
  clearEmailEnv();
  process.env.OPENAI_API_KEY = 'sk-test'; // sender missing
  await assert.rejects(() => sendDrillEmail({ to: 'someone@example.com' }), {
    code: 'EMAIL_UNAVAILABLE',
  });
  clearEmailEnv();
});
