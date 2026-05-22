(function () {
  const FORMSPREE = 'https://formspree.io/f/xwvzojrw';
  const SESSION_KEY       = 'gaia_dl_registered';
  const SESSION_EMAIL_KEY = 'gaia_dl_email';

  // EmailJS credentials
  const EMAILJS_PUBLIC_KEY  = '2EuVfRLWTRIrRziMd';
  const EMAILJS_SERVICE_ID  = 'service_ey533f3';
  const EMAILJS_TEMPLATE_ID = 'template_e8h3dgu';

  /* ── CSS ── */
  const CSS = `
#gaia-gate-modal {
  display: none;
  position: fixed; inset: 0; z-index: 9999;
  align-items: center; justify-content: center;
  background: rgba(10, 22, 40, 0.72);
  backdrop-filter: blur(4px);
  padding: 1rem;
}
#gaia-gate-modal.open { display: flex; }

#gaia-gate-box {
  background: #0A1628;
  border: 1px solid #1a3050;
  border-radius: 14px;
  width: 100%; max-width: 440px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  font-family: 'Inter', sans-serif;
}

#gaia-gate-header {
  background: #0D9E76;
  padding: 1rem 1.25rem;
  display: flex; align-items: center; justify-content: space-between;
}
#gaia-gate-header-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: .95rem; font-weight: 700; color: #fff;
  letter-spacing: -.01em;
}
#gaia-gate-header-file {
  font-size: .72rem; font-weight: 400; opacity: .8;
  margin-top: 1px; color: #e0f7f0;
}
#gaia-gate-close {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,.7); font-size: 1.1rem; line-height: 1;
  padding: .2rem .35rem; border-radius: 4px; transition: color .15s;
}
#gaia-gate-close:hover { color: #fff; }

#gaia-gate-body { padding: 1.4rem 1.25rem; }

#gaia-gate-body p.gate-intro {
  font-size: .82rem; color: #7aada5; line-height: 1.6;
  margin-bottom: 1.1rem;
}

.gaia-field { margin-bottom: .9rem; }
.gaia-field label {
  display: block; font-size: .72rem; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase;
  color: #5b8a80; margin-bottom: .35rem;
}
.gaia-field .req { color: #0D9E76; margin-left: 2px; }
.gaia-field .opt { color: #3a5a52; font-weight: 400; text-transform: none; letter-spacing: 0; }

.gaia-field input,
.gaia-field select {
  width: 100%; padding: .55rem .8rem;
  background: #0e2038; border: 1px solid #1e3c58;
  border-radius: 7px; color: #c8dde8;
  font-family: 'Inter', sans-serif; font-size: .875rem;
  outline: none; transition: border-color .2s;
  appearance: none;
}
.gaia-field input::placeholder { color: #3a5a6a; }
.gaia-field input:focus,
.gaia-field select:focus { border-color: #0D9E76; }

.gaia-field select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235b8a80' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right .75rem center;
  padding-right: 2.2rem;
  cursor: pointer;
}
.gaia-field select option { background: #0e2038; }

.gate-note {
  font-size: .72rem; color: #3a5a6a; line-height: 1.5;
  margin: .85rem 0 1.1rem;
  padding: .6rem .8rem;
  background: #0e2038; border-radius: 6px;
  border-left: 2px solid #0D9E76;
}

#gaia-gate-submit {
  width: 100%; padding: .65rem;
  background: #0D9E76; color: #fff;
  border: none; border-radius: 8px;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: .9rem; font-weight: 700;
  cursor: pointer; transition: background .2s, opacity .2s;
  letter-spacing: .01em;
}
#gaia-gate-submit:hover:not(:disabled) { background: #0ab882; }
#gaia-gate-submit:disabled { opacity: .55; cursor: not-allowed; }

.gate-error {
  font-size: .75rem; color: #f87171;
  margin-top: .6rem; text-align: center; display: none;
}

/* ── Success state ── */
#gaia-gate-success {
  display: none;
  text-align: center;
  padding: .5rem 0 .4rem;
}
#gaia-gate-success .gate-success-icon {
  font-size: 2.4rem; line-height: 1; margin-bottom: .75rem;
}
#gaia-gate-success .gate-success-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 1rem; font-weight: 700; color: #c8dde8;
  margin-bottom: .45rem;
}
#gaia-gate-success .gate-success-sub {
  font-size: .82rem; color: #7aada5; line-height: 1.6;
  margin-bottom: 1.1rem;
}
#gaia-gate-success .gate-success-email {
  color: #0D9E76; font-weight: 600;
}
#gaia-gate-success-close {
  width: 100%; padding: .6rem;
  background: #0e2038; color: #7aada5;
  border: 1px solid #1e3c58; border-radius: 8px;
  font-family: 'Inter', sans-serif; font-size: .875rem;
  cursor: pointer; transition: border-color .2s, color .2s;
}
#gaia-gate-success-close:hover { border-color: #0D9E76; color: #c8dde8; }
`;

  /* ── HTML ── */
  const HTML = `
<div id="gaia-gate-modal" role="dialog" aria-modal="true" aria-labelledby="gaia-gate-header-title">
  <div id="gaia-gate-box">
    <div id="gaia-gate-header">
      <div>
        <div id="gaia-gate-header-title">Access GAIA Data</div>
        <div id="gaia-gate-header-file"></div>
      </div>
      <button id="gaia-gate-close" aria-label="Close">✕</button>
    </div>
    <div id="gaia-gate-body">
      <!-- Form state -->
      <div id="gaia-gate-form-wrap">
        <p class="gate-intro">Enter your details and we'll email you the download links.</p>
        <form id="gaia-gate-form" novalidate>
          <div class="gaia-field">
            <label>Full name <span class="req">*</span></label>
            <input type="text" name="full_name" required placeholder="Jane Smith" autocomplete="name" />
          </div>
          <div class="gaia-field">
            <label>Email address <span class="req">*</span></label>
            <input type="email" name="email" required placeholder="you@example.com" autocomplete="email" />
          </div>
          <div class="gaia-field">
            <label>Intended use <span class="req">*</span></label>
            <select name="intended_use" required>
              <option value="">Select…</option>
              <option>Academic research</option>
              <option>Policy</option>
              <option>Journalism</option>
              <option>Commercial</option>
              <option>Other</option>
            </select>
          </div>
          <div class="gaia-field">
            <label>Institution <span class="opt">(optional)</span></label>
            <input type="text" name="institution" placeholder="University, organization, or company" autocomplete="organization" />
          </div>
          <input type="hidden" name="file" id="gaia-gate-file-field" />
          <input type="hidden" name="_subject" value="GAIA Download Registration" />
          <p class="gate-note">We'll email you direct download links. Your info helps us track GAIA's impact.</p>
          <button type="submit" id="gaia-gate-submit">Send me the links →</button>
          <p class="gate-error" id="gaia-gate-error">Something went wrong — please try again.</p>
        </form>
      </div>
      <!-- Success state -->
      <div id="gaia-gate-success">
        <div class="gate-success-icon">✉️</div>
        <div class="gate-success-title">Check your inbox!</div>
        <p class="gate-success-sub">Download links have been sent to<br><span class="gate-success-email" id="gaia-gate-sent-to"></span></p>
        <button id="gaia-gate-success-close">Close</button>
      </div>
    </div>
  </div>
</div>
`;

  /* ── Init ── */
  function init() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = HTML;
    document.body.appendChild(wrapper);

    const modal      = document.getElementById('gaia-gate-modal');
    const form       = document.getElementById('gaia-gate-form');
    const formWrap   = document.getElementById('gaia-gate-form-wrap');
    const successDiv = document.getElementById('gaia-gate-success');
    const sentToEl   = document.getElementById('gaia-gate-sent-to');
    const fileField  = document.getElementById('gaia-gate-file-field');
    const submitBtn  = document.getElementById('gaia-gate-submit');
    const errorEl    = document.getElementById('gaia-gate-error');
    const closeBtn   = document.getElementById('gaia-gate-close');
    const fileLabel  = document.getElementById('gaia-gate-header-file');
    const successCloseBtn = document.getElementById('gaia-gate-success-close');

    // Intercept all download link clicks
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[download]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;

      e.preventDefault();
      e.stopPropagation();

      // GA: track that someone clicked a download button
      if (typeof gtag === 'function') {
        gtag('event', 'download_click', { file_name: href.split('/').pop() });
      }

      const savedEmail = sessionStorage.getItem(SESSION_EMAIL_KEY);
      if (sessionStorage.getItem(SESSION_KEY) && savedEmail) {
        openSuccess(savedEmail, href);
      } else {
        openForm(href);
      }
    }, true);

    // Close on overlay click
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    closeBtn.addEventListener('click', closeModal);
    successCloseBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // Form submit
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name  = form.querySelector('[name="full_name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const use   = form.querySelector('[name="intended_use"]').value;
      if (!name || !email || !use) return;

      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;
      errorEl.style.display = 'none';

      const body = new FormData(form);

      try {
        const res = await fetch(FORMSPREE, {
          method: 'POST',
          body: body,
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          sessionStorage.setItem(SESSION_KEY, '1');
          sessionStorage.setItem(SESSION_EMAIL_KEY, email);
          sendConfirmation(name, email);
          // GA: track completed registration
          if (typeof gtag === 'function') {
            gtag('event', 'download_registered', {
              intended_use: use,
              file_name: fileField.value.split('/').pop()
            });
          }
          showSuccess(email);
        } else {
          throw new Error('non-ok');
        }
      } catch (_) {
        submitBtn.textContent = 'Send me the links →';
        submitBtn.disabled = false;
        errorEl.style.display = 'block';
      }
    });

    function openForm(fileUrl) {
      form.reset();
      fileField.value = fileUrl;
      fileLabel.textContent = fileUrl.split('/').pop();
      submitBtn.textContent = 'Send me the links →';
      submitBtn.disabled = false;
      errorEl.style.display = 'none';
      formWrap.style.display = '';
      successDiv.style.display = 'none';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => form.querySelector('[name="full_name"]').focus(), 50);
    }

    function openSuccess(email, fileUrl) {
      fileLabel.textContent = fileUrl ? fileUrl.split('/').pop() : '';
      sentToEl.textContent = email;
      formWrap.style.display = 'none';
      successDiv.style.display = 'block';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function showSuccess(email) {
      sentToEl.textContent = email;
      formWrap.style.display = 'none';
      successDiv.style.display = 'block';
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function sendConfirmation(name, email) {
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) return;
    const base = window.location.origin;
    const params = {
      from_name:        name,
      to_email:         email,
      occupations_link: base + '/data/gaia_occupations.csv',
      countries_link:   base + '/data/gaia_countries.csv'
    };
    function doSend() {
      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, EMAILJS_PUBLIC_KEY)
        .catch(function() {});
    }
    if (window.emailjs) {
      doSend();
    } else {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = doSend;
      document.head.appendChild(s);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
