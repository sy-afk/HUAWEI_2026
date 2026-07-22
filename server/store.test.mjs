// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { publicUser, registerVerifiedUser } from './store.js';

const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.json');
const freshStore = () => fs.rmSync(DATA_FILE, { force: true });

// Regression: user ids used to BE the phone number, which made every id-bearing
// response and URL carry PII. Ids must now be opaque and the phone kept separate.
test('registerVerifiedUser gives an opaque id, never the phone number', () => {
  freshStore();
  const u = registerVerifiedUser({ phone: '+6591234567', name: 'Judge' });
  assert.ok(u.id.startsWith('usr_'), `id should be opaque, got ${u.id}`);
  assert.ok(!u.id.includes('6591234567'), 'the id must not embed the phone number');
  assert.equal(u.phone, '+6591234567', 'the phone is still stored server-side for dialling');
  freshStore();
});

// Guards the PII invariant: /api/family and /api/me are world-readable, so a user
// record must never carry a phone number off the server. Regression test — these
// endpoints previously returned the raw record, leaking every registered mobile.

// Someone re-verifying (new device, cleared storage, lost session) must land back in
// the SAME account — otherwise they silently lose their XP, streak and history, and the
// leaderboard fills with duplicates of one person.
test('re-registering the same phone reuses the account and re-logs consent', () => {
  freshStore();
  const first = registerVerifiedUser({ phone: '+6591234567', name: 'Judge' });
  const again = registerVerifiedUser({ phone: '+6591234567', name: 'Judge' });

  assert.equal(again.id, first.id, 'same number must map to the same account');

  const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const mine = Object.values(db.users).filter((u) => u.phone === '+6591234567');
  assert.equal(mine.length, 1, 'must not create a duplicate user');

  const events = db.consentEvents.filter((e) => e.userId === first.id);
  assert.equal(events.length, 2, 'each grant is its own audit event, even a repeat');
  assert.ok(events.every((e) => e.type === 'granted' && e.channel === 'otp'));
  freshStore();
});

test('publicUser strips phone', () => {
  const safe = publicUser({ id: 'usr_1', name: 'GUEST', phone: '+6591234567', xp: 10 });
  assert.equal(safe.phone, undefined);
  assert.ok(!('phone' in safe));
});

test('publicUser keeps everything the UI needs', () => {
  const safe = publicUser({
    id: 'usr_1', name: 'GUEST', phone: '+6591234567',
    level: 3, xp: 10, xpMax: 500, streak: 2, timesSafe: 4, timesScammed: 1,
  });
  assert.deepEqual(safe, {
    id: 'usr_1', name: 'GUEST',
    level: 3, xp: 10, xpMax: 500, streak: 2, timesSafe: 4, timesScammed: 1,
  });
});

test('publicUser does not mutate the stored record', () => {
  const stored = { id: 'usr_1', phone: '+6591234567' };
  publicUser(stored);
  assert.equal(stored.phone, '+6591234567', 'the server still needs the phone to place calls');
});

test('publicUser tolerates null/undefined', () => {
  assert.equal(publicUser(null), null);
  assert.equal(publicUser(undefined), undefined);
});
