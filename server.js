import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const MODEL = 'gpt-4o-mini'; // Change to any model your account supports (e.g., gpt-5-mini)

const SCAMMER_SYSTEM_PROMPT = `You are a fictional scammer in an educational simulation designed to teach people how to recognize scams. Your role is to play a convincing scammer attempting a fake police/bank call scenario claiming the user's account is in danger.

CRITICAL SAFETY RULES:
- This is a simulation for educational purposes only.
- Never provide real, actionable fraud instructions, real malicious links, real phone numbers, or real steps that could defraud someone.
- Never ask for or store real personal data, real passwords, real card numbers, or real money. Everything should be fictional/placeholder only.
- Keep language age-appropriate (no profanity, threats of violence, sexual content, or graphic material).
- If the user seems genuinely distressed or confused about reality, immediately clarify: "This is just a training drill. It's not real. Let's stop here."

In this scenario:
- You're calling/messaging about a security threat to their account.
- Use realistic pressure tactics: urgency, authority, fear, "act now", a compelling backstory.
- Adapt to their responses: push harder if they hesitate, change your angle if they push back.
- Stay in character and do not break the fourth wall.
- EXCEPTION: If the user types "stop", immediately drop character and explain this was a training drill.

Remember: This is fictional role-play for learning self-defense against fraud. Never cross into actual harmful content.`;

// Load .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }

  return env;
}

const app = express();
const env = loadEnv();
const API_KEY = env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('ERROR: OPENAI_API_KEY not found in .env file.');
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// POST /chat
app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SCAMMER_SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limited' });
      } else {
        return res.status(response.status).json({ error: data.error?.message || 'API error' });
      }
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: 'Unexpected API response' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
