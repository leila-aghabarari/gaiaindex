/**
 * GAIA — shared GA4 event tracking
 * Covers: outbound links, form CTA clicks, page-specific CTAs.
 * Download events (download_click, download_registered) are handled
 * separately in gaia-download-gate.js.
 */
(function () {
  function track(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  }

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href]');
    if (!a) return;

    // Downloads are handled by gaia-download-gate.js — skip
    if (a.hasAttribute('download')) return;

    let url;
    try { url = new URL(a.href, window.location.href); } catch (_) { return; }

    // Internal navigation — skip
    if (url.hostname === window.location.hostname) return;

    // Google Form submission link
    if (url.hostname === 'forms.gle' || url.hostname === 'docs.google.com') {
      track('form_link_click', {
        form_name: 'gaia_community_submission',
        link_url: a.href,
      });
      return;
    }

    // Zenodo record
    if (url.hostname === 'zenodo.org') {
      track('zenodo_link_click', {
        link_url: url.pathname,
      });
      return;
    }

    // All other outbound links
    track('outbound_click', {
      link_domain: url.hostname,
      link_url: url.hostname + url.pathname,
      link_text: (a.textContent || '').trim().slice(0, 60) || a.getAttribute('aria-label') || '',
    });
  }, true);
})();
