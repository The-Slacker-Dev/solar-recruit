const MAX_BODY_BYTES = 12_000;
const MAX_MESSAGE_LENGTH = 4_096;

function reply(res, status, message) {
  res.status(status).json({ error: message });
}

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength + 1) : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, 'Method not allowed.');
  }

  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    return reply(res, 415, 'Send JSON to this endpoint.');
  }

  let data;
  try {
    if (typeof req.body === 'string' && Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
      return reply(res, 413, 'Application is too large.');
    }
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return reply(res, 400, 'Invalid application data.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return reply(res, 400, 'Invalid application data.');
  }

  // A filled hidden field is likely automated traffic. Do not forward it.
  if (data.botcheck) return res.status(200).json({ ok: true });

  const fields = {
    fullname: clean(data.fullname, 120),
    email: clean(data.email, 254),
    phone: clean(data.phone, 40),
    street: clean(data.street, 180),
    suburb: clean(data.suburb, 100),
    postcode: clean(data.postcode, 4),
    experience: clean(data.experience, 1200),
  };
  const roles = { sales: 'Solar sales consultant — field sales', general: 'General enquiry' };
  const states = new Set([
    'Australian Capital Territory', 'New South Wales', 'Northern Territory',
    'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
  ]);
  const role = Object.hasOwn(roles, data.role) ? roles[data.role] : null;
  const state = data.state;
  if (Object.values(fields).some((value) => !value) ||
      fields.fullname.length > 120 || fields.email.length > 254 ||
      fields.phone.length > 40 || fields.street.length > 180 ||
      fields.suburb.length > 100 || fields.experience.length > 1200 ||
      !role || !states.has(state) ||
      data.authz !== true || data.consent !== true ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ||
      !/^[0-9]{4}$/.test(fields.postcode)) {
    return reply(res, 400, 'Check the required fields and try again.');
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return reply(res, 503, 'Applications are temporarily unavailable. Please try later.');

  const message = [
    'New Solar Recruit application',
    `Name: ${fields.fullname}`,
    `Email: ${fields.email}`,
    `Phone: ${fields.phone}`,
    `Role: ${role}`,
    `Address: ${fields.street}, ${fields.suburb}, ${state} ${fields.postcode}`,
    `Experience: ${fields.experience}`,
    'Work rights confirmed: Yes',
    'Application consent: Yes',
  ].join('\n');
  if (message.length > MAX_MESSAGE_LENGTH) return reply(res, 400, 'Application is too long.');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) {
      return reply(res, 502, 'Could not deliver your application. Please try again.');
    }
    return res.status(200).json({ ok: true });
  } catch {
    return reply(res, 502, 'Could not deliver your application. Please try again.');
  }
}
