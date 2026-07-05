/* Shared Chart.js theme + helpers for GAIA charts.
 * Consistent dark-navy theme, Inter labels, animate-on-view, Download PNG,
 * and a mean-line plugin. Used site-wide. */
(function () {
  "use strict";
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
