# SafeSpace backend

Serves the built React drill-mode app **and** the drill API. Two jobs: fire real surprise
calls (Vapi) and turn drill outcomes into XP the UI reads. JSON-file store (`data.json`,
seeded from `data.seed.json`) — swap for Postgres per the spec when it's real.

## Run

```sh
npm install
npm run build        # build the React app into dist/
npm run server       # serve app + API on http://localhost:3000
# or: npm start       (build + serve in one)
npm test             # unit tests for the outcome -> XP logic
```

Firing **real** calls needs `.env` (`cp .env.example .env`, add your Vapi keys + `MY_MOBILE`).
Everything else — the app, practice drills, and the `/simulate` demo loop — works without them.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/me?user=you` | Home/Profile data (replaces mock `FAMILY_MEMBERS`) |
| GET | `/api/leaderboard` | Ranked list (replaces mock `HALL_OF_FAME`) |
| GET | `/api/drills/pending-result?user=you` | On app open: real-drill result waiting? |
| POST | `/api/drills/practice-result` | In-app practice drill finished → half XP |
| POST | `/api/drills/fire` | Fire a real surprise call now (consent-gated) |
| POST | `/api/webhooks/vapi` | Vapi call-end → outcome → XP → queue result |
| POST | `/api/drills/simulate` | Demo the real-call result loop **without** telephony |

## Outcome → XP (see `xp.js`, the single scoring rule)

| Outcome | Result | XP | Streak |
|---|---|---|---|
| `hung_up` / `disengaged` / `verified` / `reported` | WON | full (100) | +1 |
| `caught_flag` | WON | partial (50) | +1 |
| `complied` / `shared_data` / `clicked_link` / … | LOST | 0 | reset |
| `distress_offramp` | SAFE | 0 | untouched (never punished) |

Practice drills award half XP. Unknown outcomes default to a benign win — the system
never punishes on ambiguity.

## Demo the surprise-call loop without a phone

```sh
curl -XPOST localhost:3000/api/drills/simulate -H 'content-type: application/json' -d '{"outcome":"shared_data"}'
curl localhost:3000/api/drills/pending-result        # -> the queued LOST result the app shows on open
```

## Wiring status

Backend is complete and tested. The React app still reads its **mock arrays** — the next
step is swapping `FAMILY_MEMBERS`/`HALL_OF_FAME` for `fetch('/api/me'|'/api/leaderboard')`
and checking `/api/drills/pending-result` on load to route into the existing result screen.
For live Vapi webhooks you need a public tunnel (e.g. `ngrok http 3000`) set as the Vapi
server URL; until then use `/api/drills/simulate` to demo the loop.
