// Podcast services page: pre-selects the service when a "Book…" button is clicked,
// and sends the booking form to /api/booking.
(function () {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const select = document.getElementById('booking-service');
  const error = document.getElementById('booking-error');
  const submit = document.getElementById('booking-submit');
  const done = document.getElementById('booking-done');
  const loadedAt = Date.now();
  const CONTACT = 'info@bookalorianmedia.com';

  // Buttons like "Book supported recording" carry the service they're for.
  document.querySelectorAll('a[href="#book"][data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const value = link.getAttribute('data-service');
      if ([...select.options].some((o) => o.value === value)) select.value = value;
      if (window.trackEvent) window.trackEvent('services_book_click', { service: value });
    });
  });

  function showError(html) {
    error.innerHTML = html;
    error.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    if (!form.checkValidity()) {
      showError('Please fill in your name, a valid email and what you would like.');
      form.reportValidity();
      return;
    }
    const body = Object.fromEntries(new FormData(form).entries());
    body.formLoadedAt = loadedAt;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        form.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (window.trackEvent) window.trackEvent('services_booking_sent', { service: body.service });
        return;
      }
      if (res.status === 400 && json.error) {
        showError(json.error);
      } else {
        showError(`Sorry, that didn't send. Please email us at <a href="mailto:${CONTACT}">${CONTACT}</a> instead.`);
      }
    } catch {
      showError(`Sorry, that didn't send. Please email us at <a href="mailto:${CONTACT}">${CONTACT}</a> instead.`);
    }
    submit.disabled = false;
    submit.textContent = 'Send booking request';
  });
})();
