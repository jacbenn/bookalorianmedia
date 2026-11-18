// A tiny local web server for the Bookalorian Media site.
// No installs needed, it only uses what comes with Node.
// Start it with:  npm start   (or:  node server.js)

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT) || 3000;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// These are never served, so server code and config stay private.
const hidden = new Set(['server.js', 'package.json', 'README.md', '.env', '.env.example', 'vercel.json']);
const hiddenFolders = ['api', 'scripts', 'tests', '.git', '.github'];

// Read .env if there is one (e.g. PODCAST_FEED_URL).
try {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const episodes = require('./api/episodes.js');
const booking = require('./api/booking.js');

function send(res, status, file) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(status, {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }

  if (urlPath === '/api/booking' && req.method === 'POST') {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
    req.on('end', async () => {
      let body = {};
      try { body = JSON.parse(raw); } catch {}
      const out = await booking.handle(body);
      res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out.json));
    });
    return;
  }

  if (urlPath === '/api/episodes') {
    const out = await episodes.handle();
    res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(out.json));
  }

  if (urlPath.endsWith('/')) urlPath += 'index.html';
  if (!path.extname(urlPath)) urlPath += '.html';

  const filePath = path.resolve(root, '.' + urlPath);
  const relative = path.relative(root, filePath);
  const blocked = relative.startsWith('..') || path.isAbsolute(relative) || hidden.has(relative)
    || hiddenFolders.some((f) => relative === f || relative.startsWith(f + path.sep));

  if (blocked || !fs.existsSync(filePath)) return send(res, 404, path.join(root, '404.html'));
  send(res, 200, filePath);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Bookalorian Media is running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop it.');
});
