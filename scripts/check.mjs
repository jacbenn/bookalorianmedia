// Site checks run locally (npm run check) and in CI.
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const pages = readdirSync('.').filter((f) => f.endsWith('.html'));
const errors = [];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');

  // Every local file the page uses must exist.
  for (const [, ref] of html.matchAll(/(?:src|href)="(?!https?:|#|mailto:)([^"]+)"/g)) {
    if (!existsSync(ref)) errors.push(`${page}: missing file ${ref}`);
  }

  // External links must be https.
  for (const [, url] of html.matchAll(/href="(http:[^"]+)"/g)) {
    errors.push(`${page}: not https: ${url}`);
  }

  // Links that open a new tab need rel="noopener".
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(tag)) errors.push(`${page}: missing rel="noopener": ${tag}`);
  }

  // In-page links (#podcast etc.) must point at a real id.
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const id of new Set(dupes)) errors.push(`${page}: duplicate id "${id}"`);
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.includes(anchor)) errors.push(`${page}: link to #${anchor} but no element has that id`);
  }

  // Images need alt text.
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]+"/.test(tag)) errors.push(`${page}: image without alt text: ${tag}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`All checks passed (${pages.length} page${pages.length === 1 ? '' : 's'}).`);
