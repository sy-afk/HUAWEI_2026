import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Model configuration
const MODEL = 'gpt-4o-mini'; // Change to any model your account supports (e.g., gpt-5-mini)

// Get directory name in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found. Create it with your OPENAI_API_KEY.');
    process.exit(1);
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

async function testOpenAIAPI() {
  const env = loadEnv();
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('ERROR: OPENAI_API_KEY not found in .env file.');
    process.exit(1);
  }

  const message = 'Say hello and confirm you are working in one short sentence.';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        console.error('ERROR: Invalid API key. Check your OPENAI_API_KEY in .env.');
        process.exit(1);
      } else if (response.status === 404) {
        console.error('ERROR: API endpoint not found. Check the model name or API changes.');
        process.exit(1);
      } else if (response.status === 429) {
        console.error('ERROR: Rate limited. Too many requests to OpenAI API.');
        process.exit(1);
      } else {
        console.error(`ERROR: API returned status ${response.status}`);
        console.error(data);
        process.exit(1);
      }
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      console.error('ERROR: Unexpected response format from API.');
      console.error(data);
      process.exit(1);
    }

    console.log('Model reply:');
    console.log(reply);
    console.log('\nSUCCESS');
  } catch (error) {
    console.error('ERROR: Network or parsing error:', error.message);
    process.exit(1);
  }
}

testOpenAIAPI();
