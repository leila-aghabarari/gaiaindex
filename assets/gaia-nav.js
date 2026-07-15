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

  // mobile hamburger — toggles the whole nav on small screens
  var navEl = document.querySelector("nav");
  var inner = navEl && navEl.querySelector(".nav-inner");
  if (inner && !inner.querySelector(".gaia-burger")) {
    var burger = document.createElement("button");
    burger.className = "gaia-burger";
    burger.setAttribute("aria-label", "Toggle menu");
    burger.setAttribute("aria-expanded", "false");
    burger.innerHTML = "<span></span><span></span><span></span>";
    inner.appendChild(burger);
    burger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = navEl.classList.toggle("gaia-nav-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    navEl.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () { navEl.classList.remove("gaia-nav-open"); });
    });
    document.addEventListener("click", function (e) { if (!navEl.contains(e.target)) navEl.classList.remove("gaia-nav-open"); });
  }

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
        "html.gaia-js .gaia-reveal{transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}",
        "html.gaia-js .gaia-reveal:not(.gaia-in){opacity:0;transform:translateY(18px)}",
        "@media (prefers-reduced-motion:reduce){html.gaia-js .gaia-reveal{opacity:1!important;transform:none!important;transition:none!important}}",
        // ── mobile nav (hamburger) — injected last so it beats each page's inline nav styles ──
        ".gaia-burger{display:none;background:none;border:0;cursor:pointer;padding:.5rem;margin-left:.5rem;flex-direction:column;justify-content:center}",
        ".gaia-burger span{display:block;width:22px;height:2px;background:#e6f2ee;margin:3px 0;border-radius:2px;transition:transform .25s,opacity .2s}",
        "nav.gaia-nav-open .gaia-burger span:nth-child(1){transform:translateY(5px) rotate(45deg)}",
        "nav.gaia-nav-open .gaia-burger span:nth-child(2){opacity:0}",
        "nav.gaia-nav-open .gaia-burger span:nth-child(3){transform:translateY(-5px) rotate(-45deg)}",
        "@media(max-width:860px){",
        "  nav .nav-inner{position:relative}",
        "  .gaia-burger{display:inline-flex}",
        "  nav .nav-links{position:absolute;top:100%;left:0;right:0;flex-direction:column;gap:0;align-items:stretch;background:#0d1c26;border:1px solid #24333f;border-radius:0 0 12px 12px;box-shadow:0 22px 44px -22px rgba(0,0,0,.7);padding:.4rem .6rem 1rem;max-height:calc(100vh - 60px);overflow-y:auto;display:none}",
        "  nav.gaia-nav-open .nav-links{display:flex}",
        "  nav .nav-links>li{width:100%;border-top:1px solid rgba(255,255,255,.05)}",
        "  nav .nav-links>li:first-child{border-top:0}",
        "  nav .nav-links a,nav .nav-dd-btn{display:block;width:100%;padding:.8rem .5rem;font-size:1rem;text-align:left}",
        "  nav .nav-dd{position:static}",
        "  nav .nav-dd-menu{position:static;min-width:0;background:transparent;border:0;box-shadow:none;opacity:1;visibility:visible;transform:none;padding:0 0 .3rem 1rem;display:none}",
        "  nav .nav-dd.open .nav-dd-menu{display:block}",
        "  nav .nav-dd-btn .nav-caret{float:right}",
        "}",
        "@media(max-width:520px){.nav-logo-sub{display:none}}",
        // ── general mobile: tighten oversized horizontal padding, prevent sideways overflow ──
        "@media(max-width:600px){",
        "  html,body{overflow-x:hidden}",
        "  nav{padding:0 1rem}",
        "  section{padding-left:1.15rem;padding-right:1.15rem}",
        "  .wrap,.container,.page-header,.controls,.table-wrap,.hero,.section-inner,.brief-head{padding-left:1.15rem;padding-right:1.15rem}",
        "  img,canvas,svg{max-width:100%}",
        "}",
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
