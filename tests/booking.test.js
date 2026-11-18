const test = require('node:test');
const assert = require('node:assert/strict');
const { handle, SERVICES } = require('../api/booking.js');

const valid = () => ({
  name: 'Stacey Reader',
  email: 'stacey@example.com',
  service: SERVICES[0],
  podcast: 'My Book Show',
  message: 'Hello!',
  formLoadedAt: Date.now() - 10000,
});

function withEnv(env, fn) {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k];
  return Promise.resolve(fn()).finally(() => { process.env = saved; });
}

test('quietly accepts spam caught by the hidden field', async () => {
  const out = await handle({ ...valid(), website: 'spam.example' });
  assert.deepEqual(out, { status: 200, json: { success: true } });
});

test('quietly accepts forms sent too fast to be human', async () => {
  const out = await handle({ ...valid(), formLoadedAt: Date.now() });
  assert.deepEqual(out, { status: 200, json: { success: true } });
});

test('requires name, email and service', async () => {
  const out = await handle({ ...valid(), name: '' });
  assert.equal(out.status, 400);
});

test('rejects a bad email address', async () => {
  const out = await handle({ ...valid(), email: 'not-an-email' });
  assert.equal(out.status, 400);
});

test('rejects a service that is not on the list', async () => {
  const out = await handle({ ...valid(), service: 'Free money' });
  assert.equal(out.status, 400);
});

test('reports when email is not set up yet', async () => {
  await withEnv({ RESEND_API_KEY: undefined }, async () => {
    const out = await handle(valid());
    assert.deepEqual(out, { status: 500, json: { error: 'not-configured' } });
  });
});

test('sends the request to info@bookalorianmedia.com by default', async () => {
  const realFetch = global.fetch;
  let sent;
  global.fetch = async (url, opts) => { sent = { url, body: JSON.parse(opts.body) }; return { ok: true }; };
  try {
    await withEnv({ RESEND_API_KEY: 'test', CONTACT_EMAIL: undefined }, async () => {
      const out = await handle(valid());
      assert.deepEqual(out, { status: 200, json: { success: true } });
    });
  } finally {
    global.fetch = realFetch;
  }
  assert.equal(sent.url, 'https://api.resend.com/emails');
  assert.equal(sent.body.to, 'info@bookalorianmedia.com');
  assert.equal(sent.body.reply_to, 'stacey@example.com');
  assert.match(sent.body.subject, /Free 15-minute fit call/);
  assert.match(sent.body.text, /My Book Show/);
});
