/* Lightweight enhancements for explorer/content pages: nav blur on scroll,
 * opt-in fade-ups, count-ups, and gentle card tilt. No smooth-scroll hijack,
 * no WebGL. All guarded and reduced-motion aware. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // nav blur on scroll
  var nav = document.querySelector("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 12); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function onceInView(el, cb) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { cb(); io.disconnect(); } });
    }, { threshold: 0.18 });
    io.observe(el);
  }

  // fade-ups (opt-in via .fade-up)
  if (!reduce) {
    document.querySelectorAll(".fade-up").forEach(function (el, i) {
      el.style.transitionDelay = (i % 6) * 0.06 + "s";
      onceInView(el, function () { el.classList.add("in"); });
    });
  } else {
    document.querySelectorAll(".fade-up").forEach(function (el) { el.classList.add("in"); });
  }

  // count-ups (opt-in via [data-count])
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var raw = el.getAttribute("data-count");
    var to = parseFloat(raw);
    if (isNaN(to)) return;
    var dec = (raw.split(".")[1] || "").length;
    var suf = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = to.toFixed(dec) + suf; return; }
    onceInView(el, function () {
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / 1500);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  });

  // gentle card tilt (opt-in via [data-tilt]); disabled on touch/reduced
  if (!reduce && !(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -2;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 2;
        el.style.transform = "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }
})();
