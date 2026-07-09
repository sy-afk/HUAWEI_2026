// SafeSpace backend — serves the built React app and the drill API.
// Two jobs: fire real surprise calls (Vapi) and turn drill outcomes into XP the UI reads.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUser, getFamily, getLeaderboard, applyOutcome, takePendingResult, recordDrillFired } from './store.js';
import { fireDrillCall, outcomeFromVapiWebhook } from './vapi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const DEFAULT_USER = process.env.DRILL_USER || 'you';

const app = express();
app.use(express.json());

// --- Read models (replace the React app's mock arrays) ---
app.get('/api/me', (req, res) => {
  const user = getUser(req.query.user || DEFAULT_USER);
  if (!user) return res.status(404).json({ error: 'unknown user' });
  res.json(user);
});

app.get('/api/leaderboard', (_req, res) => res.json(getLeaderboard()));

app.get('/api/family', (_req, res) => res.json(getFamily()));

// On app open: is there a real-drill result waiting? (drives routing to result screen)
app.get('/api/drills/pending-result', (req, res) => {
  res.json({ pending: takePendingResult(req.query.user || DEFAULT_USER) });
});

// --- In-app practice drill finished (win/lose from the simulated UI). Half XP. ---
app.post('/api/drills/practice-result', (req, res) => {
  const { user = DEFAULT_USER, outcome, channel = 'call' } = req.body || {};
  if (!outcome) return res.status(400).json({ error: 'outcome required' });
  try {
    const { record, user: u } = applyOutcome({ userId: user, outcome, channel, practice: true });
    res.json({ record, user: u });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// --- Fire a REAL surprise call now (demo button / scheduler). Gated on consent. ---
app.post('/api/drills/fire', async (req, res) => {
  const userId = req.body?.user || DEFAULT_USER;
  const user = getUser(userId);
  if (!user) return res.status(404).json({ error: 'unknown user' });
  if (!user.consentToDrills) return res.status(403).json({ error: 'user has not consented to drills' });

  const toNumber = user.phone || process.env.MY_MOBILE;
  if (!toNumber) return res.status(400).json({ error: 'no phone on file for user (set user.phone or MY_MOBILE)' });

  try {
    const call = await fireDrillCall({ toNumber });
    recordDrillFired({ userId, channel: 'call', callId: call.id });
    res.json({ ok: true, callId: call.id, status: call.status });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// --- Vapi end-of-call webhook: compute outcome -> XP -> queue result for the user. ---
app.post('/api/webhooks/vapi', (req, res) => {
  const outcome = outcomeFromVapiWebhook(req.body);
  if (!outcome) return res.json({ ignored: true }); // not a call-end event
  // POC: map call to the default user. Real build: look up by customer number.
  const userId = req.body?.message?.customer?.number
    ? DEFAULT_USER // (lookup by phone would go here)
    : DEFAULT_USER;
  try {
    const { record } = applyOutcome({ userId, outcome, channel: 'call', practice: false });
    res.json({ ok: true, outcome, result: record.result });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// --- Demo helper: simulate a real-call result WITHOUT live telephony/tunnel, so the
//     "surprise call -> result appears on next app open" loop is demoable offline. ---
app.post('/api/drills/simulate', (req, res) => {
  const { user = DEFAULT_USER, outcome = 'disengaged' } = req.body || {};
  try {
    const { record } = applyOutcome({ userId: user, outcome, channel: 'call', practice: false });
    res.json({ ok: true, record });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// --- Serve the built React app (run `npm run build` first) ---
app.use(express.static(DIST));
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SafeSpace backend on http://localhost:${PORT}`));

export { app };
