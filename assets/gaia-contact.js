/* GAIA contact modal — name / email / question -> Formspree -> Leila's inbox.
 * Exposes window.gaiaContact(topic) to open it (topic prefills the subject). */
(function () {
  "use strict";
  var FORMSPREE = "https://formspree.io/f/xwvzojrw";

  var css = [
    ".gc-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:1.2rem;background:rgba(3,10,14,.72);backdrop-filter:blur(4px)}",
    ".gc-overlay[hidden]{display:none}",
    ".gc-modal{width:100%;max-width:440px;background:#10212e;border:1px solid #24333f;border-radius:16px;padding:1.6rem;position:relative;font-family:'Inter',sans-serif;box-shadow:0 30px 80px -20px rgba(0,0,0,.6)}",
    ".gc-close{position:absolute;top:.8rem;right:1rem;background:none;border:0;color:#9fb3c2;font-size:1.5rem;line-height:1;cursor:pointer}",
    ".gc-close:hover{color:#e6f2ee}",
    ".gc-title{font-family:'Space Grotesk','Inter',sans-serif;font-size:1.3rem;font-weight:700;color:#e6f2ee;margin:0 0 .3rem}",
    ".gc-sub{font-size:.88rem;color:#9fb3c2;margin:0 0 1.1rem;line-height:1.5}",
    ".gc-modal label{display:block;font-size:.78rem;font-weight:600;color:#c7d3e0;margin-bottom:.9rem}",
    ".gc-modal input,.gc-modal textarea{display:block;width:100%;margin-top:.3rem;background:#0d1c26;border:1px solid #24333f;border-radius:8px;color:#e6f2ee;font:inherit;font-size:.9rem;padding:.6rem .75rem;font-weight:400}",
    ".gc-modal input:focus,.gc-modal textarea:focus{outline:none;border-color:#0D9E76}",
    ".gc-modal textarea{resize:vertical;min-height:96px}",
    ".gc-send{width:100%;background:#0D9E76;color:#062018;border:0;border-radius:8px;font:inherit;font-weight:700;font-size:.92rem;padding:.7rem;cursor:pointer;margin-top:.2rem}",
    ".gc-send:hover{background:#3fd0b0}",
    ".gc-send:disabled{opacity:.55;cursor:default}",
    ".gc-status{font-size:.82rem;margin:.7rem 0 0;min-height:1em;color:#3fd0b0}",
    ".gc-status.err{color:#EF6F6C}",
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<div class="gc-overlay" id="gc-overlay" hidden>' +
    '<div class="gc-modal" role="dialog" aria-modal="true" aria-labelledby="gc-title">' +
    '<button class="gc-close" id="gc-close" aria-label="Close">&times;</button>' +
    '<h3 class="gc-title" id="gc-title">Contact for more information</h3>' +
    '<p class="gc-sub" id="gc-sub">Tell me what you need and I&rsquo;ll get back to you personally.</p>' +
    '<form id="gc-form">' +
    '<input type="hidden" name="topic" id="gc-topic" />' +
    '<label>Name<input type="text" name="name" autocomplete="name" required /></label>' +
    '<label>Email<input type="email" name="email" autocomplete="email" required /></label>' +
    '<label>Your question<textarea name="message" rows="4" required placeholder="What would you like to know?"></textarea></label>' +
    '<button type="submit" class="gc-send">Send</button>' +
    '<p class="gc-status" id="gc-status"></p>' +
    '</form></div></div>';
  document.body.appendChild(wrap.firstChild);

  var overlay = document.getElementById("gc-overlay"),
      form = document.getElementById("gc-form"),
      status = document.getElementById("gc-status"),
      sub = document.getElementById("gc-sub"),
      topicEl = document.getElementById("gc-topic"),
      sendBtn = form.querySelector(".gc-send");

  function close() { overlay.hidden = true; }
  document.getElementById("gc-close").addEventListener("click", close);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hidden) close(); });

  window.gaiaContact = function (topic) {
    topic = topic || "General enquiry";
    topicEl.value = topic;
    sub.textContent = "Re: " + topic + " — leave your details and I’ll get back to you personally.";
    status.textContent = ""; status.className = "gc-status";
    sendBtn.disabled = false; sendBtn.textContent = "Send";
    overlay.hidden = false;
    setTimeout(function () { var n = form.querySelector('input[name="name"]'); if (n) n.focus(); }, 40);
    return false;
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      topic: topicEl.value,
      _subject: "GAIA enquiry — " + topicEl.value,
    };
    status.className = "gc-status"; status.textContent = "Sending…"; sendBtn.disabled = true;
    fetch(FORMSPREE, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) {
        if (!r.ok) throw 0;
        form.reset();
        status.textContent = "Thanks — I’ve got it and will be in touch shortly.";
        sendBtn.textContent = "Sent ✓";
      })
      .catch(function () {
        status.className = "gc-status err";
        status.textContent = "Couldn’t send just now — email aghabarari.leila@gmail.com directly.";
        sendBtn.disabled = false;
      });
  });
})();
