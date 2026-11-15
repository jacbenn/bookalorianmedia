// Google Analytics (GA4), set up the same way as the Betty & Bonny site.
// Put this site's measurement ID below (Google Analytics → Admin → Data streams → Web).
// Leave it empty and nothing is tracked.
(function () {
  const GA_ID = '';

  window.trackEvent = function (name, params) {
    if (GA_ID && window.gtag) window.gtag('event', name, params);
  };
  if (!GA_ID) return;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
})();
