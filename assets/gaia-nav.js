/* Consolidated nav (Task 2): active-state highlighting, mobile dropdown toggle,
 * and ensuring License + Community links live in the footer. Shared across all
 * pages. Guarded; degrades to a plain (hover) dropdown if JS is unavailable. */
(function () {
  "use strict";
  var page = location.pathname.split("/").pop() || "index.html";

  // active state
  document.querySelectorAll(".nav-links a[data-nav]").forEach(function (a) {
    if (a.getAttribute("data-nav") === page) {
      a.classList.add("active");
      var dd = a.closest(".nav-dd");
      if (dd) { var b = dd.querySelector(".nav-dd-btn"); if (b) b.classList.add("active"); }
    }
  });

  // mobile: tap toggles the dropdown
  function closeAll(except) {
    document.querySelectorAll(".nav-dd.open").forEach(function (o) {
      if (o === except) return;
      o.classList.remove("open");
      var b = o.querySelector(".nav-dd-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  document.querySelectorAll(".nav-dd-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var dd = btn.closest(".nav-dd");
      var open = dd.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      closeAll(dd);
    });
  });
  document.addEventListener("click", function () { closeAll(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(null); });

  // ensure License + Community are reachable from the footer
  var footer = document.querySelector("footer");
  if (footer) {
    var html = footer.innerHTML;
    var missing = [];
    if (!/community\.html/.test(html)) missing.push('<a href="community.html">Community</a>');
    if (!/license\.html/.test(html)) missing.push('<a href="license.html">License</a>');
    if (missing.length) {
      var p = document.createElement("p");
      p.style.cssText = "font-size:.8rem;margin-top:.5rem";
      p.innerHTML = missing.join(" · ");
      footer.appendChild(p);
    }
  }

  /* ── Global polish (Task 23): grain, hover, fade-up-on-scroll ── */
  try {
    document.documentElement.classList.add("gaia-js");
    if (!document.getElementById("gaia-polish-css")) {
      var st = document.createElement("style");
      st.id = "gaia-polish-css";
      st.textContent = [
        ".gaia-grain{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.03;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\");background-size:140px 140px}",
        ".btn,button.btn{transition:transform .18s ease,box-shadow .18s ease}",
        ".btn:hover,button.btn:hover{transform:scale(1.03);box-shadow:0 0 0 1px rgba(13,158,118,.5),0 10px 30px -12px rgba(13,158,118,.55)}",
        ".gaia-chart-card,.paper-card,.agenda-card,.paper,.stat,.rbg-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}",
        ".gaia-chart-card:hover,.paper-card:hover,.agenda-card:hover,.paper:hover,.stat:hover,.rbg-card:hover{transform:translateY(-3px);box-shadow:0 16px 40px -18px rgba(0,0,0,.5)}",
        "html.gaia-js .gaia-reveal{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}",
        ".gaia-reveal.gaia-in{opacity:1;transform:none}",
        "@media (prefers-reduced-motion:reduce){html.gaia-js .gaia-reveal{opacity:1!important;transform:none!important;transition:none!important}}",
      ].join("");
      document.head.appendChild(st);
    }
    // grain overlay — skip if a page already has one (e.g. the cinematic homepage)
    if (!document.querySelector(".grain") && !document.querySelector(".gaia-grain")) {
      var g = document.createElement("div");
      g.className = "gaia-grain";
      g.setAttribute("aria-hidden", "true");
      document.body.appendChild(g);
    }
    // fade-up only for below-the-fold sections (no flash for above-fold);
    // skip the cinematic homepage (it runs its own reveals) and reduced-motion
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (!document.getElementById("cine") && !reduce && "IntersectionObserver" in window) {
      var targets = [].slice.call(document.querySelectorAll(".sec, .section, main section, .container > section, .gaia-landscape"))
        .filter(function (el) {
          return !el.querySelector("table") && !el.querySelector(".table-wrap") &&
            el.getBoundingClientRect().top > window.innerHeight * 0.9;
        });
      targets.forEach(function (el, i) {
        el.classList.add("gaia-reveal");
        // threshold 0 so it fires when any edge enters — tall sections (taller
        // than ~8x the viewport) can never reach a fractional threshold and would
        // otherwise stay stuck invisible.
        var io2 = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) {
              setTimeout(function () { el.classList.add("gaia-in"); }, (i % 8) * 80);
              io2.disconnect();
            }
          });
        }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
        io2.observe(el);
      });
      // safety net: never leave a section stranded / looking blank — short delay
      // so content is guaranteed visible within a blink even if the observer misfires.
      setTimeout(function () { targets.forEach(function (el) { el.classList.add("gaia-in"); }); }, 600);
    }
  } catch (e) {}
})();
