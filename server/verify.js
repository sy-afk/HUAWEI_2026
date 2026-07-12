// Phone-ownership + consent verification via Twilio Verify, with a DEV BYPASS so the
// whole flow is testable offline and safe to run on stage without live SMS.
//
// - If TWILIO_ACCOUNT_SID/AUTH_TOKEN/VERIFY_SERVICE_SID are set  -> real Twilio Verify SMS.
// - Otherwise (dev/demo)                                          -> a fixed bypass code.

export const DEV_CODE = '000000';

function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );
}

function basicAuth() {
  const t = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString('base64');
  return `Basic ${t}`;
}

// --- Simple in-memory rate limit: <=5 sends/hour/number, >=30s apart. ---
// Blocks SMS-pumping abuse on an open register endpoint. Swap for Redis in production.
const sends = new Map(); // phone -> number[] (timestamps)
export function rateLimited(phone) {
  const now = Date.now();
  const hits = (sends.get(phone) || []).filter((t) => now - t < 3_600_000);
  if (hits.length >= 5) return true;
  if (hits.length && now - hits[hits.length - 1] < 30_000) return true;
  hits.push(now);
  sends.set(phone, hits);
  return false;
}

/** Send a verification code. Returns { dev, devCode? }. */
export async function startVerification(phone) {
  if (!twilioConfigured()) {
    return { dev: true, devCode: DEV_CODE };
  }
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const res = await fetch(`https://verify.twilio.com/v2/Services/${sid}/Verifications`, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, Channel: 'sms' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio Verify start ${res.status}: ${JSON.stringify(data)}`);
  return { dev: false, status: data.status };
}

/** Check a code. Returns true iff it's valid/approved. */
export async function checkVerification(phone, code) {
  if (!twilioConfigured()) {
    return code === DEV_CODE;
  }
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const res = await fetch(`https://verify.twilio.com/v2/Services/${sid}/VerificationCheck`, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, Code: code }),
  });
  const data = await res.json();
  if (!res.ok) return false;
  return data.status === 'approved';
}

export const isDevMode = () => !twilioConfigured();
