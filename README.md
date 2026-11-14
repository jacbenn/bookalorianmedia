# Bookalorian Media

Website for Bookalorian Media: books, comedy and bookish merch.

- **Podcast:** Litdulterous, a book comedy podcast (Spotify, Apple Podcasts, Amazon Music)
- **Shop:** Bookalorian Designs on Etsy
- **Slay & Spill:** After the Slay (Betty & Bonny Book Slayers) and After the Book Spill (Spill the Book), on Patreon and Substack
- **Socials:** TikTok, Instagram, Facebook

## Structure

```
index.html            page content and all links
styles.css            styling (dark background, hot pink, smoke haze)
assets/               podcast artwork and favicon
scripts/check.mjs     site checks (files exist, https links, alt text, in-page links)
.github/workflows/    CI: runs the checks and an HTML validator on every push and PR
vercel.json           Vercel config (static site, no build step)
```

It's plain HTML and CSS with no build step.

## Running locally

```bash
npm start        # serves the site at http://localhost:3000
npm run check    # runs the same checks as CI
```

## Deploying

The site deploys on Vercel, like slayandspillmedia:

1. Push the repo to GitHub.
2. In Vercel, choose **Add New → Project** and import `bookalorianmedia`. The settings come from `vercel.json`, so nothing needs changing.
3. Every push to `main` deploys to production, and pull requests get preview links.
4. To use a custom domain, add it under **Settings → Domains** in Vercel.

## Editing links

All links are in `index.html`. Search for the platform name (e.g. `patreon`) to find each one.
