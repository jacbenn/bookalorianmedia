// Site checks run locally (npm run check) and in CI.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const pages = readdirSync('.').filter((f) => f.endsWith('.html')).sort();
const errors = [];

// Map a site path like "/", "/podcast" or "/assets/x.jpg" to the file Vercel serves.
function fileFor(path) {
  const clean = path.split(/[?#]/)[0].replace(/^\//, '');
  if (clean === '') return 'index.html';
  if (existsSync(clean)) return clean;
  if (existsSync(`${clean}.html`)) return `${clean}.html`;
  return null;
}

const navs = new Map();

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const route = page === 'index.html' ? '/' : `/${page.replace(/\.html$/, '')}`;

  // Every internal link, image and stylesheet must point at a real file or page.
  for (const [, ref] of html.matchAll(/(?:src|href)="(?!https?:|#|mailto:)([^"]+)"/g)) {
    if (!fileFor(ref)) errors.push(`${page}: broken link or missing file ${ref}`);
  }

  // External links must be https.
  for (const [, url] of html.matchAll(/href="(http:[^"]+)"/g)) {
    errors.push(`${page}: not https: ${url}`);
  }

  // Links that open a new tab need rel="noopener".
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(tag)) errors.push(`${page}: missing rel="noopener": ${tag}`);
  }

  // Ids must be unique and in-page links (#x) must point at one.
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) {
    errors.push(`${page}: duplicate id "${id}"`);
  }
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.includes(anchor)) errors.push(`${page}: link to #${anchor} but no element has that id`);
  }

  // Images need an alt attribute (empty is fine for decorative images).
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(tag)) errors.push(`${page}: image without alt attribute: ${tag}`);
  }

  // Each page needs a title and exactly one h1.
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${page}: missing <title>`);
  const h1s = (html.match(/<h1\b/g) || []).length;
  if (h1s !== 1) errors.push(`${page}: expected 1 <h1>, found ${h1s}`);

  // The menu must be the same on every page, with the current page highlighted.
  const nav = html.match(/<nav\b[\s\S]*?<\/nav>/)?.[0];
  if (!nav) {
    errors.push(`${page}: missing main menu`);
    continue;
  }
  const current = [...nav.matchAll(/href="([^"]+)"[^>]*aria-current="page"/g)].map((m) => m[1]);
  if (page !== '404.html' && (current.length !== 1 || current[0] !== route)) {
    errors.push(`${page}: menu should highlight ${route}, highlights ${current.join(', ') || 'nothing'}`);
  }
  navs.set(page, nav.replace(/\s*aria-current="page"/g, '').replace(/\s+/g, ' '));
}

const [firstPage, firstNav] = [...navs][0] ?? [];
for (const [page, nav] of navs) {
  if (nav !== firstNav) errors.push(`${page}: menu differs from ${firstPage}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`All checks passed (${pages.length} pages: ${pages.join(', ')}).`);
