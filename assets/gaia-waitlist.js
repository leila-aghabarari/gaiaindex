(function () {
  const FORMSPREE  = 'https://formspree.io/f/xwvzojrw';
  const BANNER_KEY = 'gaia_banner_v1';

  /* ── CSS ─────────────────────────────────────────────────────────────── */
  const CSS = `
/* ── BANNER ── */
#gaia-waitlist-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  background: #0a1e14;
  border-bottom: 2px solid #0D9E76;
  padding: .55rem 1.25rem;
  font-family: 'Inter', sans-serif;
  font-size: .8rem;
  color: rgba(255,255,255,.75);
  position: relative;
  z-index: 200;
  flex-wrap: wrap;
}
#gaia-waitlist-banner .banner-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #0D9E76;
  flex-shrink: 0;
  animation: gaia-pulse 2s infinite;
}
@keyframes gaia-pulse {
  0%,100% { opacity: 1; }
  50%      { opacity: .35; }
}
#gaia-waitlist-banner .banner-text { line-height: 1.5; }
#gaia-waitlist-banner .banner-cta {
  display: inline-flex; align-items: center;
  background: #0D9E76; color: #fff;
  border: none; border-radius: 5px;
  padding: .28rem .75rem;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: .78rem; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  transition: background .15s;
  flex-shrink: 0;
}
#gaia-waitlist-banner .banner-cta:hover { background: #0ab882; }
#gaia-waitlist-banner .banner-close {
  position: absolute; right: .85rem; top: 50%; transform: translateY(-50%);
  background: none; border: none;
  color: rgba(255,255,255,.35); font-size: .95rem;
  cursor: pointer; line-height: 1; padding: .2rem .3rem;
  border-radius: 4px; transition: color .15s;
}
#gaia-waitlist-banner .banner-close:hover { color: rgba(255,255,255,.75); }

/* ── MODAL ── */
#gaia-waitlist-modal {
  display: none;
  position: fixed; inset: 0; z-index: 9999;
  align-items: center; justify-content: center;
  background: rgba(5, 15, 30, 0.75);
  backdrop-filter: blur(4px);
  padding: 1rem;
}
#gaia-waitlist-modal.open { display: flex; }
#gaia-waitlist-box {
  background: #07141f;
  border: 1px solid #1a3050;
  border-radius: 14px;
  width: 100%; max-width: 420px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.55);
  font-family: 'Inter', sans-serif;
}
#gaia-waitlist-header {
  background: linear-gradient(135deg, #0D9E76, #0a7a5c);
  padding: 1.15rem 1.25rem;
  display: flex; align-items: flex-start; justify-content: space-between;
}
#gaia-waitlist-header-inner .wl-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 1rem; font-weight: 700; color: #fff;
  letter-spacing: -.01em; margin-bottom: .15rem;
}
#gaia-waitlist-header-inner .wl-sub {
  font-size: .75rem; color: rgba(255,255,255,.75);
}
#gaia-waitlist-close {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,.6); font-size: 1.1rem;
  padding: .15rem .3rem; border-radius: 4px;
  transition: color .15s; line-height: 1;
}
#gaia-waitlist-close:hover { color: #fff; }
#gaia-waitlist-body { padding: 1.35rem 1.25rem; }
.wl-field { margin-bottom: .85rem; }
.wl-field label {
  display: block; font-size: .7rem; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  color: #4a7a70; margin-bottom: .3rem;
}
.wl-field .req { color: #0D9E76; margin-left: 2px; }
.wl-field input, .wl-field select {
  width: 100%; padding: .5rem .8rem;
  background: #0c1f2e; border: 1px solid #1a3a50;
  border-radius: 7px; color: #b8d8e4;
  font-family: 'Inter', sans-serif; font-size: .875rem;
  outline: none; transition: border-color .2s;
  appearance: none;
}
.wl-field input::placeholder { color: #2e4a5a; }
.wl-field input:focus, .wl-field select:focus { border-color: #0D9E76; }
.wl-field select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a7a70' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right .75rem center;
  padding-right: 2.2rem; cursor: pointer;
}
.wl-field select option { background: #0c1f2e; }
.wl-note {
  font-size: .72rem; color: #2e4a5a; line-height: 1.5;
  margin: .8rem 0 1rem;
  padding: .55rem .8rem;
  background: #0c1f2e; border-radius: 6px;
  border-left: 2px solid #0D9E76;
}
#gaia-waitlist-submit {
  width: 100%; padding: .65rem;
  background: #0D9E76; color: #fff;
  border: none; border-radius: 8px;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: .9rem; font-weight: 700;
  cursor: pointer; transition: background .2s, opacity .2s;
  letter-spacing: .01em;
}
#gaia-waitlist-submit:hover:not(:disabled) { background: #0ab882; }
#gaia-waitlist-submit:disabled { opacity: .5; cursor: not-allowed; }
.wl-error {
  font-size: .75rem; color: #f87171;
  margin-top: .6rem; text-align: center; display: none;
}
/* ── Success ── */
#gaia-waitlist-success {
  display: none; text-align: center; padding: .5rem 0 .4rem;
}
.wl-success-icon { font-size: 2.4rem; line-height: 1; margin-bottom: .7rem; }
.wl-success-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 1rem; font-weight: 700; color: #b8d8e4; margin-bottom: .4rem;
}
.wl-success-sub { font-size: .82rem; color: #4a7a70; line-height: 1.6; margin-bottom: 1rem; }
.wl-success-email { color: #0D9E76; font-weight: 600; }
#gaia-waitlist-success-close {
  width: 100%; padding: .6rem;
  background: #0c1f2e; color: #4a7a70;
  border: 1px solid #1a3a50; border-radius: 8px;
  font-family: 'Inter', sans-serif; font-size: .875rem;
  cursor: pointer; transition: border-color .2s, color .2s;
}
#gaia-waitlist-success-close:hover { border-color: #0D9E76; color: #b8d8e4; }
`;

  /* ── HTML ──────────────────────────────────────────────────────────── */
  const BANNER_HTML = `
<div id="gaia-waitlist-banner" role="banner">
  <span class="banner-dot"></span>
  <span class="banner-text">GAIA data access is currently by request only. Join the waitlist to be notified when public downloads open.</span>
  <button class="banner-cta" onclick="showWaitlistModal()">Join the Waitlist →</button>
  <button class="banner-close" onclick="sessionStorage.setItem('${BANNER_KEY}','1');this.parentElement.remove()" aria-label="Dismiss banner">✕</button>
</div>`;

  const MODAL_HTML = `
<div id="gaia-waitlist-modal" role="dialog" aria-modal="true" aria-labelledby="gaia-waitlist-title">
  <div id="gaia-waitlist-box">
    <div id="gaia-waitlist-header">
      <div id="gaia-waitlist-header-inner">
        <div class="wl-title" id="gaia-waitlist-title">Join the GAIA Data Waitlist</div>
        <div class="wl-sub">Be the first to know when public downloads open.</div>
      </div>
      <button id="gaia-waitlist-close" aria-label="Close">✕</button>
    </div>
    <div id="gaia-waitlist-body">
      <div id="gaia-waitlist-form-wrap">
        <form id="gaia-waitlist-form" novalidate>
          <div class="wl-field">
            <label>Full name <span class="req">*</span></label>
            <input type="text" name="full_name" required placeholder="Jane Smith" autocomplete="name" />
          </div>
          <div class="wl-field">
            <label>Email address <span class="req">*</span></label>
            <input type="email" name="email" required placeholder="you@example.com" autocomplete="email" />
          </div>
          <div class="wl-field">
            <label>Intended use</label>
            <select name="intended_use">
              <option value="">Select (optional)</option>
              <option>Academic research</option>
              <option>Policy analysis</option>
              <option>Journalism</option>
              <option>Education</option>
              <option>Commercial / product</option>
              <option>Other</option>
            </select>
          </div>
          <input type="hidden" name="_subject" value="GAIA Waitlist Signup" />
          <p class="wl-note">We'll email you when GAIA data becomes available for download. We won't share your information.</p>
          <button type="submit" id="gaia-waitlist-submit">Join the Waitlist →</button>
          <p class="wl-error" id="gaia-waitlist-error">Something went wrong — please try again.</p>
        </form>
      </div>
      <div id="gaia-waitlist-success">
        <div class="wl-success-icon">✓</div>
        <div class="wl-success-title">You're on the list!</div>
        <p class="wl-success-sub">We'll email <span class="wl-success-email" id="gaia-wl-sent-to"></span> as soon as GAIA data downloads open.</p>
        <button id="gaia-waitlist-success-close">Close</button>
      </div>
    </div>
  </div>
</div>`;

  /* ── Logic ─────────────────────────────────────────────────────────── */
  function init() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Banner — inject before everything else
    if (!sessionStorage.getItem(BANNER_KEY)) {
      const bannerDiv = document.createElement('div');
      bannerDiv.innerHTML = BANNER_HTML;
      document.body.insertBefore(bannerDiv.firstElementChild, document.body.firstChild);
    }

    // Modal
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = MODAL_HTML;
    document.body.appendChild(modalDiv.firstElementChild);

    const modal       = document.getElementById('gaia-waitlist-modal');
    const form        = document.getElementById('gaia-waitlist-form');
    const formWrap    = document.getElementById('gaia-waitlist-form-wrap');
    const successDiv  = document.getElementById('gaia-waitlist-success');
    const sentToEl    = document.getElementById('gaia-wl-sent-to');
    const submitBtn   = document.getElementById('gaia-waitlist-submit');
    const errorEl     = document.getElementById('gaia-waitlist-error');
    const closeBtn    = document.getElementById('gaia-waitlist-close');
    const successClose= document.getElementById('gaia-waitlist-success-close');

    window.showWaitlistModal = function () {
      form.reset();
      submitBtn.textContent = 'Join the Waitlist →';
      submitBtn.disabled = false;
      errorEl.style.display = 'none';
      formWrap.style.display = '';
      successDiv.style.display = 'none';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => form.querySelector('[name="full_name"]').focus(), 60);

      if (typeof gtag === 'function') {
        gtag('event', 'waitlist_modal_open', { page: window.location.pathname });
      }
    };

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    successClose.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name  = form.querySelector('[name="full_name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      if (!name || !email) return;

      submitBtn.textContent = 'Joining…';
      submitBtn.disabled = true;
      errorEl.style.display = 'none';

      try {
        const res = await fetch(FORMSPREE, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('non-ok');

        if (typeof gtag === 'function') {
          gtag('event', 'waitlist_signup', {
            intended_use: form.querySelector('[name="intended_use"]').value || 'not specified'
          });
        }

        sentToEl.textContent = email;
        formWrap.style.display = 'none';
        successDiv.style.display = 'block';
      } catch (_) {
        submitBtn.textContent = 'Join the Waitlist →';
        submitBtn.disabled = false;
        errorEl.style.display = 'block';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
