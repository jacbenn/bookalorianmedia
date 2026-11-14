const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseFeed } = require('../api/episodes.js');

const xml = fs.readFileSync(path.join(__dirname, 'fixtures', 'feed.xml'), 'utf8');
const episodes = parseFeed(xml);

test('skips items with no audio', () => {
  assert.equal(episodes.length, 2);
});

test('puts the newest episode first', () => {
  assert.deepEqual(episodes.map((e) => e.number), [2, 1]);
});

test('reads titles, including CDATA and entities', () => {
  assert.equal(episodes[0].title, 'Newest Episode: Twists <Explained>');
  assert.equal(episodes[1].title, 'Older Episode & Friends');
});

test('reads audio, artwork and the show artwork fallback', () => {
  assert.equal(episodes[0].audio, 'https://example.com/2.mp3');
  assert.equal(episodes[0].image, 'https://example.com/2.jpg');
  assert.equal(episodes[1].image, 'https://example.com/show.jpg');
});

test('reads durations in seconds or mm:ss', () => {
  assert.equal(episodes[0].duration, 3114);
  assert.equal(episodes[1].duration, 51 * 60 + 54);
});

test('turns show notes into plain text paragraphs', () => {
  assert.equal(episodes[1].notes, "Three books.\n\nWe'd never trust them.");
  assert.ok(!episodes[0].notes.includes('<'));
  assert.ok(episodes[0].notes.startsWith("A girls' weekend goes wrong."));
});

test('reads explicit flag, dates and ids', () => {
  assert.equal(episodes[1].explicit, true);
  assert.equal(episodes[0].explicit, false);
  assert.equal(episodes[0].published, '2026-11-10T12:55:45.000Z');
  assert.equal(episodes[0].id, 'episode-2');
});
