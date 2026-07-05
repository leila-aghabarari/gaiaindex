/* Shared Chart.js theme + helpers for GAIA charts.
 * Consistent dark-navy theme, Inter labels, animate-on-view, Download PNG,
 * and a mean-line plugin. Used site-wide. */
(function () {
  "use strict";

  // Inject shared chart-UI styles once (so every page using the kit is consistent)
  if (!document.getElementById("gaia-chart-kit-css")) {
    var st = document.createElement("style");
    st.id = "gaia-chart-kit-css";
    st.textContent = [
      ".gaia-landscape{max-width:1300px;margin:2.5rem auto;padding:0 2rem;}",
      ".gaia-landscape>h2{font-family:'Space Grotesk',sans-serif;font-size:1.4rem;font-weight:700;letter-spacing:-.02em;margin:0 0 1rem;color:var(--text,#1a2635);}",
      ".gaia-panel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:1.25rem;}",
      ".gaia-chart-card{position:relative;background:#0A1628;border-radius:16px;padding:1.3rem;box-shadow:0 16px 44px -22px rgba(10,22,40,.55);}",
      ".gaia-chart-title{font-family:'Space Grotesk',sans-serif;font-size:1rem;font-weight:600;color:#eaf2f8;margin:0 0 .15rem;}",
      ".gaia-chart-sub{font-size:.8rem;color:#8AA0B6;margin:0 0 .7rem;}",
      ".gaia-chart-wrap{position:relative;height:340px;}",
      ".gaia-chart-src{font-size:.68rem;color:#6f8296;margin:.7rem 0 0;}",
      ".gaia-dl-btn{position:absolute;top:1rem;right:1rem;z-index:2;cursor:pointer;font:inherit;font-size:.68rem;font-weight:600;color:#C7D3E0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:.3rem .6rem;transition:background .15s,color .15s;}",
      ".gaia-dl-btn:hover{background:rgba(13,158,118,.22);color:#fff;}",
    ].join("");
    (document.head || document.documentElement).appendChild(st);
  }

  var C = {
    bg: "#0A1628",
    teal: "#0D9E76",
    blue: "#3B82F6",
    amber: "#F59E0B",
    coral: "#EF6F6C",
    grid: "rgba(255,255,255,0.08)",
    text: "#C7D3E0",
    textDim: "#8AA0B6",
    font: "'Inter', sans-serif",
  };

  if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = C.font;
    Chart.defaults.color = C.text;
  }

  // Fire cb once when el scrolls into view (for animate-on-view / lazy charts)
  function onView(el, cb, threshold) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { cb(); io.disconnect(); } });
    }, { threshold: threshold || 0.25 });
    io.observe(el);
  }

  // Base options every chart merges in
  function baseOptions(extra) {
    var o = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: C.text, font: { family: C.font } } },
        tooltip: {
          backgroundColor: "#0d2033",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          titleColor: "#eaf2f8",
          bodyColor: C.text,
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: C.grid, drawBorder: false },
          ticks: { color: C.textDim, font: { family: C.font } },
        },
        y: {
          grid: { color: C.grid, drawBorder: false },
          ticks: { color: C.textDim, font: { family: C.font } },
        },
      },
    };
    return deepMerge(o, extra || {});
  }

  function deepMerge(a, b) {
    for (var k in b) {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) {
        a[k] = deepMerge(a[k] || {}, b[k]);
      } else a[k] = b[k];
    }
    return a;
  }

  // Vertical mean line for horizontal bar charts (value on x axis)
  function meanLinePlugin(value, label) {
    return {
      id: "gaiaMeanLine",
      afterDatasetsDraw: function (chart) {
        var x = chart.scales.x;
        if (!x) return;
        var px = x.getPixelForValue(value);
        var top = chart.chartArea.top, bot = chart.chartArea.bottom;
        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = C.amber;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bot); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.amber;
        ctx.font = "600 11px " + C.font;
        ctx.textAlign = px > chart.width - 80 ? "right" : "left";
        ctx.fillText(label || ("mean " + value), px + (ctx.textAlign === "right" ? -6 : 6), top + 12);
        ctx.restore();
      },
    };
  }

  function wireDownload(btn, chartGetter, filename) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      var chart = typeof chartGetter === "function" ? chartGetter() : chartGetter;
      if (!chart) return;
      var a = document.createElement("a");
      a.href = chart.toBase64Image();
      a.download = filename || "gaia-chart.png";
      a.click();
    });
  }

  window.GAIA_CHART = {
    colors: C,
    onView: onView,
    baseOptions: baseOptions,
    meanLinePlugin: meanLinePlugin,
    wireDownload: wireDownload,
  };
})();
