// Litdulterous episodes, read from the podcast's RSS feed.
// Works on Vercel (as /api/episodes) and with the local server (npm start).
//
// To change the feed, set PODCAST_FEED_URL in Vercel (Settings → Environment
// Variables) or change DEFAULT_FEED_URL below.

// Litdulterous on RedCircle.
const DEFAULT_FEED_URL = 'https://feeds.redcircle.com/38ee7607-1617-4a84-8ca9-60f714ae0b0e';

const CACHE_MS = 15 * 60 * 1000;
let cache = { at: 0, url: '', data: null };

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

// Text inside a tag, with CDATA unwrapped and entities decoded.
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  if (!m) return '';
  const cdata = m[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return cdata ? cdata[1].trim() : decode(m[1].trim());
}

function attr(xml, name, attribute) {
  const m = xml.match(new RegExp(`<${name}\\b[^>]*\\s${attribute}="([^"]*)"`, 'i'));
  return m ? decode(m[1]) : '';
}

// HTML show notes → plain text paragraphs.
function toText(html) {
  return decode(
    String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|h\d|li|div)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

// "3114", "51:54" or "1:02:03" → seconds.
function seconds(value) {
  const parts = String(value).trim().split(':').map(Number);
  if (!parts.length || parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

function slug(text) {
  return String(text).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 80);
}

function parseFeed(xml) {
  const channel = xml.split(/<item\b/i)[0];
  const showImage = attr(channel, 'itunes:image', 'href');
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return items
    .map((item) => {
      const title = tag(item, 'itunes:title') || tag(item, 'title');
      const number = parseInt(tag(item, 'itunes:episode'), 10) || null;
      const published = new Date(tag(item, 'pubDate'));
      const notes = toText(tag(item, 'content:encoded') || tag(item, 'description'));
      return {
        id: number ? `episode-${number}` : slug(title),
        number,
        title,
        published: Number.isNaN(published.getTime()) ? null : published.toISOString(),
        duration: seconds(tag(item, 'itunes:duration')),
        audio: attr(item, 'enclosure', 'url'),
        image: attr(item, 'itunes:image', 'href') || showImage,
        explicit: /^(true|yes|explicit)$/i.test(tag(item, 'itunes:explicit')),
        notes,
      };
    })
    .filter((ep) => ep.title && ep.audio)
    .sort((a, b) => (b.published || '').localeCompare(a.published || ''));
}

async function handle() {
  const url = process.env.PODCAST_FEED_URL || DEFAULT_FEED_URL;
  if (cache.data && cache.url === url && Date.now() - cache.at < CACHE_MS) {
    return { status: 200, json: cache.data };
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'BookalorianMedia/1.0 (+https://www.bookalorianmedia.com)' } });
    if (!res.ok) throw new Error(`Feed returned ${res.status}`);
    const data = { episodes: parseFeed(await res.text()) };
    cache = { at: Date.now(), url, data };
    return { status: 200, json: data };
  } catch (err) {
    console.error('Could not load the podcast feed:', err);
    if (cache.data) return { status: 200, json: cache.data };
    return { status: 502, json: { error: 'Could not load episodes right now.' } };
  }
}

// Vercel serverless function.
module.exports = async (req, res) => {
  const out = await handle();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (out.status === 200) res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400');
  res.status(out.status).send(JSON.stringify(out.json));
};
module.exports.handle = handle;
module.exports.parseFeed = parseFeed;
