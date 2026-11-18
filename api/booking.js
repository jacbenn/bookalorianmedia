// Receives podcast services booking requests and emails them through Resend.
// Same setup as the influencer sign-up on the Slay & Spill Media site.
// Works on Vercel (as /api/booking) and with the local server (npm start).
//
// Environment variables (Vercel → Settings → Environment Variables, or .env locally):
//   RESEND_API_KEY     required — same kind of key as the influencer form
//   RESEND_FROM_EMAIL  the verified sender address in Resend
//   CONTACT_EMAIL      where requests go (defaults to info@bookalorianmedia.com)

const DEFAULT_CONTACT = 'info@bookalorianmedia.com';

// Every option in the booking form's "What would you like?" list.
const SERVICES = [
  'Free 15-minute fit call',
  'Supported Remote Recording ($175 per session)',
  'Record + Audio Produce ($399 per episode)',
  'Record + Video Produce ($549 per episode)',
  'Audio Essentials edit ($149 per episode)',
  'Audio Professional edit ($225 per episode)',
  'Video Podcast Edit ($325 per episode)',
  'Monthly production proposal',
  'Podcast coaching session ($149)',
  'Podcast Launch Blueprint ($399)',
  'Podcast Launch Intensive ($599)',
  'Six-Week Podcast Launch Coaching ($1,299)',
  'Ongoing Podcast Mentorship ($249/month)',
  'Creative extras or something else',
];

const clean = (v, max = 1000) => String(v ?? '').trim().slice(0, max);
const hasLink = (s) => /(https?:\/\/|www\.|<[^>]+>)/i.test(s);

async function handle(body) {
  body = body || {};

  // Spam: hidden field filled in, or form sent in under 3 seconds. Pretend it worked.
  if (clean(body.website) || !Number(body.formLoadedAt) || Date.now() - Number(body.formLoadedAt) < 3000) {
    return { status: 200, json: { success: true } };
  }

  const d = {
    name: clean(body.name, 120),
    email: clean(body.email, 200),
    service: clean(body.service, 80),
    podcast: clean(body.podcast, 300),
    timezone: clean(body.timezone, 80),
    message: clean(body.message, 2000),
  };

  if (!d.name || !d.email || !d.service) {
    return { status: 400, json: { error: 'Please fill in your name, email and what you would like.' } };
  }
  if (!/^\S+@\S+\.\S+$/.test(d.email)) return { status: 400, json: { error: 'Please enter a valid email address.' } };
  if (!SERVICES.includes(d.service)) return { status: 400, json: { error: 'Please choose an option from the list.' } };
  if (hasLink(d.name)) return { status: 200, json: { success: true } };

  if (!process.env.RESEND_API_KEY) {
    return { status: 500, json: { error: 'not-configured' } };
  }

  const text = [
    '=== PODCAST SERVICES REQUEST ===',
    `Wants: ${d.service}`,
    '',
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    `Podcast name or link: ${d.podcast || '-'}`,
    `Time zone: ${d.timezone || '-'}`,
    '',
    '=== MESSAGE ===',
    d.message || '-',
    '',
    '(Sent from the Bookalorian Media podcast services page)',
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: process.env.CONTACT_EMAIL || DEFAULT_CONTACT,
        reply_to: d.email,
        subject: `Podcast services: ${d.service} — ${d.name}`,
        text,
      }),
    });
    if (!res.ok) {
      console.error('Resend error:', res.status, await res.text());
      return { status: 500, json: { error: 'send-failed' } };
    }
    return { status: 200, json: { success: true } };
  } catch (err) {
    console.error('Resend exception:', err);
    return { status: 500, json: { error: 'send-failed' } };
  }
}

// Vercel entry point
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method not allowed'); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const out = await handle(body || {});
  res.statusCode = out.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(out.json));
};
module.exports.handle = handle;
module.exports.SERVICES = SERVICES;
