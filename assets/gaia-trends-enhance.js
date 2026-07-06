/* Task 15 — trends.html line-chart upgrades. Registered as a global Chart
 * plugin BEFORE the page's inline charts build, so it applies to all of them:
 * dot markers, left-to-right draw-in that replays on scroll into view, a shaded
 * "ChatGPT launch" band at Nov 2022, and a hover crosshair. Plus country
 * multi-select chips for the diffusion chart (gtLineChart). */
(function () {
  "use strict";
  if (typeof Chart === "undefined") return;
  var C = (window.GAIA_CHART && window.GAIA_CHART.colors) ||
    { amber: "#F59E0B", teal: "#0D9E76", text: "#e6f2ee", textDim: "#8AA0B6", font: "'Inter', sans-serif" };

  function launchIndex(chart) {
    var labels = chart.data.labels || [];
    for (var i = 0; i < labels.length; i++) {
      if (/2022[-/ ]?11|nov[a-z]*\s*'?\s*22\b|nov[a-z]*\s*2022/i.test(String(labels[i]))) return i;
    }
    return -1;
  }

  var plugin = {
    id: "gaiaTrends",
    beforeInit: function (chart) {
      if (chart.config.type !== "line") return;
      try {
        chart.data.datasets.forEach(function (ds) {
          if (ds.pointRadius == null) ds.pointRadius = 2;
          if (ds.pointHoverRadius == null) ds.pointHoverRadius = 5;
        });
        // draw the line in left-to-right
        var n = Math.max(1, (chart.data.labels || []).length);
        chart.options.animations = Object.assign({}, chart.options.animations, {
          x: {
            type: "number", easing: "linear", duration: 1100, from: NaN,
            delay: function (ctx) {
              if (ctx.type !== "data" || ctx.xStarted) return 0;
              ctx.xStarted = true; return ctx.index * (1100 / n);
            },
          },
          y: { type: "number", duration: 400 },
        });
      } catch (e) {}
    },
    afterInit: function (chart) {
      if (chart.config.type !== "line" || !("IntersectionObserver" in window)) return;
      var seen = false;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; try { chart.update(); } catch (x) {} io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(chart.canvas);
    },
    afterDatasetsDraw: function (chart) {
      if (chart.config.type !== "line") return;
      var ctx = chart.ctx, area = chart.chartArea, xs = chart.scales.x;
      if (!xs || !area) return;
      // ChatGPT launch band
      var li = launchIndex(chart);
      if (li >= 0) {
        var px = xs.getPixelForValue(chart.data.labels[li]);
        if (px != null && !isNaN(px)) {
          var half = Math.max(5, (area.right - area.left) / ((chart.data.labels || []).length) / 2);
          ctx.save();
          ctx.fillStyle = "rgba(245,158,11,0.12)";
          ctx.fillRect(px - half, area.top, half * 2, area.bottom - area.top);
          ctx.strokeStyle = "rgba(245,158,11,0.55)"; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(px, area.top); ctx.lineTo(px, area.bottom); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = C.amber; ctx.font = "600 10px " + C.font; ctx.textAlign = "center";
          ctx.fillText("ChatGPT launch", px, area.top + 11);
          ctx.restore();
        }
      }
      // hover crosshair
      var act = chart.tooltip && chart.tooltip.getActiveElements && chart.tooltip.getActiveElements();
      if (act && act.length) {
        var hx = act[0].element.x;
        ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx, area.top); ctx.lineTo(hx, area.bottom); ctx.stroke(); ctx.restore();
      }
    },
  };
  Chart.register(plugin);

  // Country multi-select chips for the diffusion chart (gtLineChart)
  function buildChips() {
    if (!Chart.getChart) return;
    var chart = Chart.getChart("gtLineChart");
    var host = document.getElementById("gtLineChips");
    if (!chart || !host || host.childElementCount) return;
    chart.data.datasets.forEach(function (ds, i) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "trend-chip active";
      chip.textContent = ds.label;
      chip.style.setProperty("--chip", ds.borderColor || C.teal);
      chip.addEventListener("click", function () {
        var vis = chart.isDatasetVisible(i);
        chart.setDatasetVisibility(i, !vis);
        chip.classList.toggle("active", !vis);
        chart.update();
      });
      host.appendChild(chip);
    });
  }
  if (document.readyState !== "loading") setTimeout(buildChips, 80);
  else document.addEventListener("DOMContentLoaded", function () { setTimeout(buildChips, 80); });
})();
