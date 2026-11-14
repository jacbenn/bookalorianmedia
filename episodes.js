// Loads Litdulterous episodes from /api/episodes and shows them on the Episodes page.
(function () {
  const list = document.getElementById('episode-list');
  const status = document.getElementById('episode-status');
  const more = document.getElementById('episode-more');
  const PAGE = 12;
  let episodes = [];
  let shown = 0;

  const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  function el(name, className, text) {
    const node = document.createElement(name);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function minutes(total) {
    if (!total) return '';
    const h = Math.floor(total / 3600);
    const m = Math.round((total % 3600) / 60);
    return h ? `${h} hr ${m} min` : `${m} min`;
  }

  function card(ep) {
    const article = el('article', 'episode');
    article.id = ep.id;

    if (ep.image) {
      const img = el('img', 'episode-art');
      img.src = ep.image;
      img.alt = '';
      img.loading = 'lazy';
      img.width = 160;
      img.height = 160;
      article.append(img);
    }

    const body = el('div', 'episode-body');
    const meta = [
      ep.number ? `Episode ${ep.number}` : '',
      ep.published ? dateFormat.format(new Date(ep.published)) : '',
      minutes(ep.duration),
      ep.explicit ? 'Explicit' : '',
    ].filter(Boolean);
    body.append(el('p', 'episode-meta', meta.join(' · ')));
    body.append(el('h2', 'episode-title', ep.title));

    if (ep.notes) {
      const paragraphs = ep.notes.split('\n\n');
      body.append(el('p', 'episode-summary', paragraphs[0]));
      if (paragraphs.length > 1) {
        const details = el('details', 'episode-notes');
        details.append(el('summary', '', 'Show notes'));
        paragraphs.slice(1).forEach((p) => details.append(el('p', '', p)));
        body.append(details);
      }
    }

    const audio = el('audio', 'episode-audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = ep.audio;
    audio.setAttribute('aria-label', `Play ${ep.title}`);
    body.append(audio);

    article.append(body);
    return article;
  }

  function showMore() {
    episodes.slice(shown, shown + PAGE).forEach((ep) => list.append(card(ep)));
    shown = Math.min(shown + PAGE, episodes.length);
    more.hidden = shown >= episodes.length;
  }

  // Only one episode plays at a time.
  list.addEventListener('play', (e) => {
    list.querySelectorAll('audio').forEach((a) => { if (a !== e.target) a.pause(); });
  }, true);

  more.addEventListener('click', showMore);

  fetch('/api/episodes')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
    .then((data) => {
      episodes = data.episodes || [];
      if (!episodes.length) {
        status.textContent = 'No episodes yet. Check back soon!';
        return;
      }
      status.hidden = true;
      showMore();
    })
    .catch(() => {
      status.textContent = "We couldn't load the episodes just now. Listen on Spotify, Apple Podcasts or Amazon Music instead.";
      status.classList.add('episode-status--error');
      document.getElementById('episode-fallback').hidden = false;
    });
})();
