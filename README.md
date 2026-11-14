# Bookalorian Media

Website for Bookalorian Media: books, comedy and bookish merch.

- **Podcast:** Litdulterous, a book comedy podcast (Spotify, Apple Podcasts, Amazon Music)
- **Shop:** Bookalorian Designs on Etsy
- **Slay & Spill:** After the Slay (Betty & Bonny Book Slayers) and After the Book Spill (Spill the Book), on Patreon and Substack
- **Socials:** TikTok, Instagram, Facebook

## Pages

| Address | File | What's on it |
|---|---|---|
| `/` | `index.html` | Opening section, tiles for each area, socials |
| `/podcast` | `podcast.html` | Litdulterous and its listen links |
| `/episodes` | `episodes.html` + `episodes.js` | Every Litdulterous episode with a player, loaded from the RSS feed |
| `/shop` | `shop.html` | Bookalorian Designs and the Etsy link |
| `/slay-and-spill` | `slay-and-spill.html` | Book Slayers and Spill the Book, their Patreon and Substack (After the Slay, After the Book Spill), and Slay & Spill Media |
| any other address | `404.html` | Page not found |

Every page has the same header menu and footer. If you change the menu or footer, change it on every page; `npm run check` will tell you if they don't match.

## Structure

```
*.html                one file per page (see above)
styles.css            styling shared by every page
episodes.js           loads and shows episodes on /episodes
api/episodes.js       reads the RSS feed (Vercel function at /api/episodes)
server.js             local server for npm start, including /api/episodes
tests/                tests for the feed reader (npm test)
assets/               podcast artwork and favicon
scripts/check.mjs     site checks: links and files exist, https links, alt text, menu matches on every page
.github/workflows/    CI: runs the checks and an HTML validator on every push and PR
vercel.json           Vercel config (static site, clean URLs so /podcast serves podcast.html)
```

It's plain HTML and CSS with no build step and nothing to install. Links use root paths like `/podcast`, so preview it with `npm start` rather than opening the files directly.

## Changing the podcast feed

The Episodes page reads the feed set in `api/episodes.js` (`DEFAULT_FEED_URL`). It uses the Litdulterous feed on RedCircle. To point it at a different feed, either:

- change `DEFAULT_FEED_URL` in `api/episodes.js`, or
- set `PODCAST_FEED_URL` in Vercel under **Settings → Environment Variables** (and in a local `.env` file, see `.env.example`).

The feed is cached for 15 minutes, so new episodes show up on their own without redeploying.


## Running locally

```bash
npm start        # serves the site at http://localhost:3000, episodes included
npm test         # tests the feed reader
npm run check    # checks pages, links and the menu
```

## Deploying

The site deploys on Vercel, like slayandspillmedia:

1. Push the repo to GitHub.
2. In Vercel, choose **Add New → Project** and import `bookalorianmedia`. The settings come from `vercel.json`, so nothing needs changing.
3. Every push to `main` deploys to production, and pull requests get preview links.
4. To use a custom domain, add it under **Settings → Domains** in Vercel.

## Editing links

All links are in `index.html`. Search for the platform name (e.g. `patreon`) to find each one.
