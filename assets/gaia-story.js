/* GAIA cinematic homepage — Lenis smooth scroll + GSAP ScrollTrigger chapters,
 * count-ups, reveals, and micro-interactions. Everything is guarded so the page
 * still works if a library fails to load or reduced-motion is requested. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var G = window.GaiaGlobe || { ready: false, setZoom: function () {}, setMorph: function () {}, setOpacity: function () {} };

  // ---------- 1. Lenis smooth scroll (homepage only, not reduced-motion) ----------
  if (!reduce && typeof window.Lenis !== "undefined") {
    try {
      var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      if (hasGSAP) {
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      }
    } catch (e) {}
  }

  // ---------- helpers ----------
  function countTo(el, to, opts) {
    opts = opts || {};
    var from = opts.from || 0, dur = opts.dur || 1400, dec = opts.dec || 0, suf = opts.suffix || "", pre = opts.prefix || "";
    if (reduce) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (from + (to - from) * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function onceInView(el, cb, threshold) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { cb(); io.disconnect(); } });
    }, { threshold: threshold || 0.4 });
    io.observe(el);
  }

  // ---------- 2. Headline line-mask reveal ----------
  var lines = document.querySelectorAll(".cine-line span");
  if (lines.length) {
    if (hasGSAP && !reduce) {
      gsap.set(lines, { yPercent: 115 });
      gsap.to(lines, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12, delay: 0.25 });
    } else {
      lines.forEach(function (l) { l.style.transform = "none"; });
    }
  }

  // ---------- 3. Chapter scroll animations (globe + stats) ----------
  var chStat1 = document.getElementById("ch1-stat");
  var chStat2 = document.getElementById("ch2-stat");
  var betaEl = document.getElementById("ch3-beta");
  var scatterCanvas = document.getElementById("ch3-scatter");
  var barLow = document.getElementById("bar-low");
  var barHigh = document.getElementById("bar-high");

  // Count-ups fire when their chapter enters (works even without GSAP)
  if (chStat1) onceInView(chStat1, function () { countTo(chStat1, 178, { dur: 1600 }); });
  if (chStat2) onceInView(chStat2, function () { countTo(chStat2, 923, { dur: 1800 }); });
  if (betaEl) onceInView(betaEl, function () { countTo(betaEl, -17.47, { from: 0, dur: 1800, dec: 2, prefix: "β = " }); });

  // Scatter draw (illustrative negative relationship — real finding is β = -17.47)
  function drawScatter(progress) {
    if (!scatterCanvas) return;
    var ctx = scatterCanvas.getContext("2d");
    var w = scatterCanvas.width, h = scatterCanvas.height;
    ctx.clearRect(0, 0, w, h);
    var pad = 26, n = 120;
    // deterministic pseudo-points
    function rnd(i) { var x = Math.sin(i * 999.13) * 43758.5453; return x - Math.floor(x); }
    var shown = Math.floor(n * progress);
    ctx.fillStyle = "rgba(13,158,118,0.65)";
    for (var i = 0; i < shown; i++) {
      var ex = rnd(i), noise = (rnd(i + 500) - 0.5) * 0.42;
      var ts = 0.85 - ex * 0.6 + noise; // negative slope
      ts = Math.max(0.02, Math.min(0.98, ts));
      var px = pad + ex * (w - 2 * pad);
      var py = pad + (1 - ts) * (h - 2 * pad);
      ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    // regression line draws in over the second half
    if (progress > 0.4) {
      var lp = Math.min(1, (progress - 0.4) / 0.6);
      ctx.strokeStyle = "rgba(224,242,237,0.9)"; ctx.lineWidth = 2;
      var x1 = pad, y1 = pad + (1 - 0.85) * (h - 2 * pad);
      var x2 = pad + lp * (w - 2 * pad), y2 = pad + (1 - (0.85 - lp * 0.6)) * (h - 2 * pad);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }
  if (scatterCanvas && !hasGSAP) { onceInView(scatterCanvas, function () { drawScatter(1); }); }

  // Bars (chapter d)
  function setBars(p) {
    if (barLow) barLow.style.height = (p * 31 / 31 * 100) + "%";
    if (barHigh) barHigh.style.height = (p * 10 / 31 * 100) + "%";
  }
  if ((barLow || barHigh) && !hasGSAP) { onceInView(barLow || barHigh, function () { setBars(1); }); }

  if (hasGSAP && !reduce) {
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}
    var mkTrigger = function (sel, onEnter, onLeaveBack, scrub) {
      ScrollTrigger.create({
        trigger: sel, start: "top 65%", end: "bottom 35%",
        onUpdate: scrub ? function (self) { scrub(self.progress); } : null,
        onEnter: onEnter || null, onEnterBack: onEnter || null,
      });
    };
    // hero: globe home
    mkTrigger("#ch-hero", function () { G.setZoom(1); G.setMorph(0); G.setOpacity(1); });
    // c1: zoom slightly
    mkTrigger("#ch1", function () { G.setZoom(1.16); G.setMorph(0); G.setOpacity(1); });
    // c2: scatter morph (scrubbed)
    ScrollTrigger.create({
      trigger: "#ch2", start: "top 80%", end: "bottom 20%",
      onUpdate: function (s) { G.setMorph(s.progress); },
      onEnter: function () { G.setZoom(1.05); }, onEnterBack: function () { G.setZoom(1.05); },
    });
    // c3: globe dim; scatter draws with scroll
    ScrollTrigger.create({
      trigger: "#ch3", start: "top 80%", end: "bottom 30%",
      onUpdate: function (s) { drawScatter(s.progress); G.setOpacity(0.35 + (1 - s.progress) * 0.25); },
      onEnter: function () { G.setMorph(1); }, onEnterBack: function () { G.setMorph(1); },
    });
    // c4: bars grow; globe returns faintly
    ScrollTrigger.create({
      trigger: "#ch4", start: "top 75%", end: "bottom 40%",
      onUpdate: function (s) { setBars(s.progress); },
      onEnter: function () { G.setMorph(0.4); G.setOpacity(0.5); }, onEnterBack: function () { G.setMorph(0.4); },
    });
  }

  // ---------- 4. Reveals for the post-story sections ----------
  function initReveals() {
    var blocks = document.querySelectorAll("#post-story .section-inner");
    blocks.forEach(function (b) {
      if (reduce) return;
      b.classList.add("reveal");
      onceInView(b, function () { b.classList.add("in"); }, 0.15);
      // stagger direct card children
      var cards = b.querySelectorAll(".collab-card, .occ-panel, .stat-card, .legend-item, a[href^='paper_']");
      cards.forEach(function (c, i) {
        c.classList.add("reveal");
        c.style.transitionDelay = (i % 6) * 0.07 + "s";
        onceInView(c, function () { c.classList.add("in"); }, 0.2);
      });
    });
  }
  initReveals();

  // ---------- 5. Micro-interactions ----------
  // nav blur on scroll
  var nav = document.querySelector("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 12); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  // card tilt toward cursor (max 2deg)
  if (!reduce && !(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) {
    document.querySelectorAll(".stat-card, .collab-card, .occ-panel, a[href^='paper_']").forEach(function (el) {
      el.style.transformStyle = "preserve-3d";
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -2;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 2;
        el.style.transform = "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }
  // generic count-ups: any [data-count]
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var suf = el.getAttribute("data-suffix") || "";
    onceInView(el, function () { countTo(el, to, { dur: 1500, dec: dec, suffix: suf }); });
  });
})();
