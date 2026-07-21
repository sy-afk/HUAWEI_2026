# ScamShield — Email Drill (Next.js scaffold)

A real, runnable Next.js 14 (App Router) + TypeScript + Tailwind project implementing
the core training loop: **Dashboard → Email Drill → Investigation Report**.

Everything works end-to-end on **mock data** — no external services required to run it.

## Run it locally

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** (it redirects straight to `/dashboard`).

Requires Node.js 18.18+ (Next.js 14 requirement).

## What's real vs. mocked

| Piece | Status |
|---|---|
| UI/UX, layout, routing, interactions | **Real** — production React/TypeScript/Tailwind code |
| Scoring logic (`lib/scoring.ts`) | **Real** — matches the point table in the spec |
| Email content, user profile (`lib/mock-data.ts`) | **Mocked** — static data standing in for Supabase |
| AI Coach feedback (`lib/ai-coach.ts`) | **Mocked** — rule-based, but shaped exactly like the eventual OpenAI response so swapping it in is a drop-in change |
| **Live Assessment email capture (`/live-assessment`)** | **Real page, mocked send** — the form and API route are real; `app/api/live-assessment/route.ts` currently just validates the email and returns success. The commented block at the bottom of that file shows the real OpenAI + Resend implementation. |
| **Outcome pages (`/result/scammed`, `/result/prevented`, `/result/legit`)** | **Real, fully working pages** — these are what a real sent email's links (or a Figma prototype's "Open Link" action) should point to. They read a `?scenario=` query param (`dbs`, `msft`, `shopee`, `nus`) to show scenario-specific content, defined in `lib/scenario-content.ts`. |
| Auth, Supabase, real OpenAI/Resend calls | **Not wired up** — see "Next integration steps" below |

## The Live Assessment flow, end to end

1. User lands on `/live-assessment`, enters their email, and is told this is a
   simulation.
2. Submitting calls `POST /api/live-assessment`. Once wired to OpenAI +
   Resend, this generates a phishing (or legit-control) email and sends it to
   that address, with its links/report-button rewritten to point back at:
   - `/result/scammed?scenario=dbs` — if they click the phishing link
   - `/result/prevented?scenario=dbs` — if they report it instead
   - `/result/legit?scenario=shopee` — if the email was actually legitimate
3. Whichever page they land on explains what happened and why, using the
   copy in `lib/scenario-content.ts`.

**Important:** I can't deploy this app to a public URL from here. To get real,
shareable links (e.g. for a Figma prototype's "Open Link" action, or for the
real email's links to point at), deploy it yourself:

```bash
# fastest path — Vercel
npm i -g vercel   # or use the Vercel web UI
vercel
```

Vercel will give you a URL like `https://scamshield-yourname.vercel.app`. Use
that as the base for the result-page links (e.g.
`https://scamshield-yourname.vercel.app/result/scammed?scenario=dbs`).

## Project structure

```
app/
  layout.tsx          — fonts, global shell
  page.tsx             — redirects to /dashboard
  dashboard/page.tsx    — profile stats, drill picker, recent assessments
  email-drill/page.tsx  — the full interactive drill (inbox, reading pane,
                          investigator feed, landing-page simulation, report)
  live-assessment/page.tsx — real-email capture page ("Try Real Sim")
  api/live-assessment/route.ts — send endpoint (mocked; real OpenAI+Resend
                          implementation commented at the bottom)
  result/
    scammed/page.tsx    — landed here after clicking a real phishing link
    prevented/page.tsx  — landed here after reporting a real phishing email
    legit/page.tsx       — landed here after clicking a real, legitimate email
components/
  ui/                   — small shadcn-style primitives (Button, Card, Badge)
lib/
  types.ts              — shared TypeScript types
  mock-data.ts          — sample emails + user profile
  scoring.ts             — point values + max-score calculation
  ai-coach.ts            — mocked coach logic + commented real OpenAI call
  scenario-content.ts     — per-scenario copy used by the /result pages
  utils.ts                — `cn()` classname helper
```

## Design system

The visual identity (defined in `tailwind.config.ts` + `app/globals.css`) is a
"case-file" aesthetic: warm kraft-paper tones and a typewriter/stamp wordmark
for the surrounding chrome, contrasted with a dark terminal-style
**Investigator Feed** that logs every action live. The simulated inbox itself
is deliberately styled to look like a neutral, realistic webmail client (plain
sans-serif, white background) so it doesn't visually "tip off" the trainee —
all the ScamShield branding lives in the frame around it, not inside the
simulated messages.

## Next integration steps

1. **Supabase** — create `users`, `scenarios`, `activities`, `results` tables
   matching the shapes in `lib/types.ts`. Swap `lib/mock-data.ts` reads for
   Supabase queries (e.g. in a server component or a Route Handler).
2. **OpenAI (email generation + coaching)** — add `OPENAI_API_KEY` to
   `.env.local`. The commented function at the bottom of `lib/ai-coach.ts`
   shows the exact shape of the call; do the same for an email-generation
   endpoint under `app/api/generate-email/route.ts`.
3. **Resend (Live Assessment)** — add `RESEND_API_KEY`, then add a Route
   Handler (`app/api/send-assessment/route.ts`) that generates an email via
   OpenAI and sends it via Resend to the user's real inbox, storing a
   `scenarioId` to correlate their eventual click/report with this session.
4. **Auth** — add NextAuth or Supabase Auth in front of `/dashboard` and
   `/email-drill`.

## Other pages from the spec (not yet built)

SMS Drill, Scam Call Drill, Profile, and Live Assessment are stubbed as
"Coming soon" on the dashboard. Happy to build any of these next.
