import handler from '../api/apply.js';

if (!process.argv.includes('--send')) {
  console.error('Run with --send to deliver one clearly labelled test lead.');
  process.exit(1);
}

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Load .env before running.');
  process.exit(1);
}

const request = {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: {
    fullname: 'TEST LEAD - Solar Recruit QA',
    email: 'test@example.invalid',
    phone: '0400000000',
    role: 'sales',
    street: '1 Test Street',
    suburb: 'Sydney',
    state: 'New South Wales',
    postcode: '2000',
    experience: 'TEST LEAD ONLY. Please ignore this application.',
    authz: true,
    consent: true,
  },
};

const response = {
  code: null,
  body: null,
  setHeader() {},
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
};

await handler(request, response);
if (response.code === 200 && response.body?.ok === true) {
  console.log('Test lead accepted by Telegram. Check the configured group for TEST LEAD - Solar Recruit QA.');
} else {
  console.error(`Test lead failed (HTTP ${response.code}): ${response.body?.error ?? 'Unknown error'}`);
  process.exitCode = 1;
}
