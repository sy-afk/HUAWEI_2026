# SafeSpace — manual test plan

Target: **https://huawei-2026.vercel.app**

Test on a **real phone**, not a desktop browser. The layout switches to full-bleed below
520px and most of what can break is touch-, keyboard- or notch-related.

Work top to bottom. Journey A is the one that can sink the demo — do it first.

---

## Before you start

You will register a real mobile number. That number is stored server-side and marks you
as consenting to drills, which means **the app may place a real scam-simulation phone
call to you**. Nothing asks for passwords, OTPs, card details or payments — if any
screen ever does, stop and report it immediately, because that is a serious bug.

---

## Journey A — First run and registration ⭐ CRITICAL

This is the highest-risk path: it is the first time anything is *written* to the
database, and a misconfiguration only shows up here.

| # | Do | Expect |
|---|---|---|
| A1 | Open the URL on your phone | Title screen, fills the whole screen, no desktop phone-frame border |
| A2 | Tap **PRESS START** | Onboarding / coach-marks from the mascot |
| A3 | Walk through the coach-marks | Each highlight sits **on** the thing it describes, not offset or off-screen |
| A4 | Register — enter your mobile in full international form (`+65…`) | SMS arrives within ~30s |
| A5 | Enter the code | Lands in the app, signed in |

**Failure modes, and what they mean — please report the exact wording:**

- **"Something went wrong" / a 500** at step A5 → the database is misconfigured. **Stop and report immediately, this blocks the demo.**
- **"verification service unavailable"** → SMS provider issue, different problem
- **"incorrect or expired code"** → just a typo, retry

Also try, before entering a valid code:

- A phone number with no `+` or country code → should be rejected politely, not crash
- Requesting a second code straight away → should say wait a moment (rate limited)
- A deliberately wrong 6-digit code → "incorrect or expired", **never** signs you in

---

## Journey B — Practice call drill

| # | Do | Expect |
|---|---|---|
| B1 | Start a practice **call** drill | Incoming-call screen |
| B2 | Answer, then play along resisting the scam | Call screen with a visible DRILL MODE banner |
| B3 | Hang up / refuse to comply | Win result, XP awarded |
| B4 | Repeat, this time **comply** — agree to what the scammer asks | Loss result, streak resets, explanation of the red flags |
| B5 | Read the "why it was a scam" breakdown | Each red flag expands and reads clearly |

Practice drills award **half** XP by design — not a bug.

---

## Journey C — SMS drill

| # | Do | Expect |
|---|---|---|
| C1 | Open the SMS inbox drill | A scam text among the messages |
| C2 | Tap through to the thread, then the link | A fake browser page, clearly part of the drill |
| C3 | Try each ending: **report**, **ask family**, **click the link**, **close the page** | Different outcomes; reporting scores best |
| C4 | Check XP and streak after each | Consistent with the outcome shown |

---

## Journey D — Email drill

| # | Do | Expect |
|---|---|---|
| D1 | Open the email inbox drill | Phishing email present |
| D2 | Open it, inspect the sender domain | Domain mismatch is visible on tapping/expanding |
| D3 | Follow the link, reach the download screen | Fake browser + download prompt |
| D4 | Try **submit details**, **open attachment**, **cancel** | Distinct outcomes and explanations |

> A **real** email drill (one sent to your actual inbox) may reply "email drills are not
> configured" — that's expected if those keys weren't set. Report it, but it's not a bug.

---

## Journey E — Family drill

| # | Do | Expect |
|---|---|---|
| E1 | Start the family drill | Intro, then rounds about family members |
| E2 | Answer some right, some wrong | Per-answer explanation each time |
| E3 | Finish | Summary showing what you got right/wrong |

---

## Journey F — Progression and the rest of the app

Visit every tab and screen at least once — **home, leaderboard, store, profile**.

- Leaderboard: your name appears, ranking looks sane, **no phone numbers or emails anywhere**
- Store / payday: buying and selling updates the balance; can't go negative
- Profile: edit name, customise avatar
- Settings: change drill frequency, difficulty, notifications, accessibility — then **reopen the app and confirm they stuck**
- Family chat and notifications screens open without errors

---

## Journey G — Persistence ⭐ IMPORTANT

The single most likely silent failure: everything looks fine but nothing is saved.

| # | Do | Expect |
|---|---|---|
| G1 | Note your exact XP, level and streak | — |
| G2 | **Force-quit** the app (swipe it away, don't just background it) | — |
| G3 | Reopen | Same XP, level, streak — still signed in |
| G4 | Wait ~5 minutes, reopen again | Still the same |

If XP resets, **stop and report** — writes are not reaching the database.

---

## Journey H — Install to home screen

| # | Do | Expect |
|---|---|---|
| H1 | iOS: Share → Add to Home Screen. Android: ⋮ → Install app | Offered |
| H2 | Check the icon | Green pixel shield, not a blank page or screenshot |
| H3 | Launch from the icon | **No browser address bar**, fills the screen |
| H4 | Rotate the phone | Stays usable; portrait is intended |
| H5 | On a notched phone, check the top and bottom | Nothing hidden under the clock or the home bar |

---

## Journey I — Try to break it

Genuinely try. These are the ones judges stumble into.

- Tap buttons **twice quickly** — especially anything that starts a drill or spends money. Does it fire twice?
- **Background the app mid-drill**, come back — does it recover or get stuck?
- Turn on **airplane mode** mid-drill — does it show a sensible error, or hang forever with a spinner?
- Reload repeatedly on every screen
- Very long name in profile (50+ chars) — does the layout survive?
- Emoji and non-Latin characters in the name field
- Back-button / swipe-back from deep screens — anywhere it gets stuck?
- Small phone (SE-sized) and large phone — anything cut off?
- Bright sunlight / low brightness — is the retro green readable?

**One behaviour to check deliberately:** if a drill offers a way to say you're
distressed or want to stop, take it. You should **never** lose XP or your streak for
using it. Being punished for opting out would be a serious design bug.

---

## Reporting

For each problem:

```
Screen:        (e.g. registration, SMS thread)
Phone + OS:    (e.g. iPhone 13, iOS 18 / Pixel 7, Android 15)
Installed or browser tab?
What I did:
What I expected:
What happened:      (exact error text, please)
Screenshot/recording:
Reproducible?       every time / sometimes / once
```

**Report immediately, don't batch, if:** registration 500s, XP doesn't persist, a phone
number or email shows anywhere it shouldn't, or any screen asks for a real password,
OTP, card number or payment.
