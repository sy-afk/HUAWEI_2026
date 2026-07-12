// Tiny JSON-file store. Fine for a POC/demo — swap for Postgres (per the spec's data
// model) when it's real. Seeds from data.seed.json on first run.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeResult } from './xp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');
const SEED_FILE = path.join(__dirname, 'data.seed.json');

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(SEED_FILE, DATA_FILE);
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function save(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function getUser(id) {
  const db = load();
  return db.users[id] || null;
}

export function listConsentedUsers() {
  const db = load();
  return Object.values(db.users).filter((u) => u.consentToDrills);
}

// Leaderboard = users ranked by xp, shaped for the React LeaderboardScreen.
export function getLeaderboard() {
  const db = load();
  return Object.values(db.users)
    .sort((a, b) => b.xp - a.xp)
    .map((u, i) => ({ rank: i + 1, id: u.id, name: u.name, score: u.xp, level: u.level, wins: u.timesSafe }));
}

/**
 * Apply a finished drill's outcome to a user: award XP, adjust streak/stats,
 * and (for scored real calls) queue a pending result the app shows on next open.
 */
// All family members, shaped for the React FamilyHomeScreen (dollhouse rooms).
export function getFamily() {
  const db = load();
  return Object.values(db.users);
}

export function applyOutcome({ userId, outcome, channel = 'call', practice = false }) {
  const db = load();
  const user = db.users[userId];
  if (!user) throw new Error(`unknown user ${userId}`);

  const r = computeResult(outcome, { practice });
  user.xp += r.xp;
  while (user.xp >= user.xpMax) {
    user.xp -= user.xpMax;
    user.level += 1;
    user.xpMax = Math.round(user.xpMax * 1.2);
  }
  if (r.streak === 'inc') {
    user.streak += 1;
    user.timesSafe += 1;
    user.safeThisWeek = true;
  } else if (r.streak === 'reset') {
    user.streak = 0;
    user.timesScammed += 1;
    user.safeThisWeek = false;
  }
  if (r.result === 'WON' || r.result === 'LOST') user.recentDrillResult = r.result;

  const record = {
    id: `drill_${Date.now()}`,
    userId,
    channel,
    outcome,
    practice,
    result: r.result,
    screen: r.screen,
    xpGained: r.xp,
    at: new Date().toISOString(),
  };
  db.drills.push(record);

  // Real (non-practice) scored drills get surfaced when the user next opens the app.
  if (!practice && r.screen) {
    db.pendingResults[userId] = record;
  }

  save(db);
  return { record, user };
}

export function takePendingResult(userId) {
  const db = load();
  const pending = db.pendingResults[userId] || null;
  if (pending) {
    delete db.pendingResults[userId];
    save(db);
  }
  return pending;
}

export function recordDrillFired({ userId, channel = 'call', callId = null }) {
  const db = load();
  db.drills.push({
    id: `fired_${Date.now()}`,
    userId,
    channel,
    callId,
    status: 'fired',
    at: new Date().toISOString(),
  });
  save(db);
}

// Upsert a phone-verified user and log a 'granted' consent event (the audit trail).
// Called by /api/verify/check after OTP succeeds. Guests are keyed by their number.
export function registerVerifiedUser({ phone, name }) {
  const db = load();
  const id = phone;
  if (!db.users[id]) {
    db.users[id] = {
      id,
      name: (name || 'GUEST').toString().toUpperCase().slice(0, 10) || 'GUEST',
      role: 'ROOKIE',
      phone,
      consentToDrills: true,
      level: 1, xp: 0, xpMax: 500, streak: 0, timesSafe: 0, timesScammed: 0,
      primaryColor: '#4ecdc4', badgeCount: 0, badgeTotal: 9,
      roomName: 'GUEST ROOM', roomBg: '#081420', safeThisWeek: true, recentDrillResult: null,
    };
  }
  db.users[id].phone = phone;
  db.users[id].consentToDrills = true;
  db.consentEvents = db.consentEvents || [];
  db.consentEvents.push({ userId: id, type: 'granted', channel: 'otp', at: new Date().toISOString() });
  save(db);
  return db.users[id];
}
