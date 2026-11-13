import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/apply.js';

const validLead = {
  fullname: 'Jane Citizen', email: 'jane@example.com', phone: '0412345678',
  role: 'sales', street: '1 Solar St', suburb: 'Sydney',
  state: 'New South Wales', postcode: '2000', experience: 'Retail sales',
  authz: true, consent: true,
};

function request(body = validLead, method = 'POST') {
  return { method, headers: { 'content-type': 'application/json' }, body };
}

function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('rejects invalid applications before contacting Telegram', async () => {
  const res = response();
  await handler(request({ ...validLead, email: 'bad' }), res);
  assert.equal(res.code, 400);
});

test('only confirms delivery after Telegram accepts the message', async () => {
  const oldToken = process.env.TELEGRAM_BOT_TOKEN;
  const oldChat = process.env.TELEGRAM_CHAT_ID;
  const oldFetch = globalThis.fetch;
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '-1001234567890';
  try {
    globalThis.fetch = async (_url, options) => {
      const sent = JSON.parse(options.body);
      assert.equal(sent.chat_id, '-1001234567890');
      assert.match(sent.text, /Jane Citizen/);
      return { ok: true, json: async () => ({ ok: true }) };
    };
    const delivered = response();
    await handler(request(), delivered);
    assert.equal(delivered.code, 200);
    assert.deepEqual(delivered.body, { ok: true });

    globalThis.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
    const failed = response();
    await handler(request(), failed);
    assert.equal(failed.code, 502);
    assert.ok(failed.body.error);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = oldToken;
    if (oldChat === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = oldChat;
  }
});
