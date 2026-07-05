/* Task 9 — occupations.html "Landscape" panel:
 * (a) histogram of GAIA-E Score (gaia_e*100, index points) across all 923 occs,
 *     with mean line + shaded interquartile band;
 * (b) horizontal bar chart of mean GAIA-E by major occupation group (teal gradient).
 * Data from data/gaia_occupations.csv via PapaParse; theme via gaia-chart-kit. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;

  function percentile(sorted, p) {
    var i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }
  function lerpTeal(t) { // light -> dark teal by t in [0,1]
    var a = [127, 215, 194], b = [8, 92, 66];
    return "rgb(" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(",") + ")";
  }

  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var rows = res.data || [];
      var vals = rows.map(function (r) { return parseFloat(r.gaia_e); }).filter(function (v) { return !isNaN(v); }).map(function (v) { return v * 100; });
      if (!vals.length) return;
      var sorted = vals.slice().sort(function (a, b) { return a - b; });
      var mean = vals.reduce(function (s, v) { return s + v; }, 0) / vals.length;
      var q1 = percentile(sorted, 0.25), med = percentile(sorted, 0.5), q3 = percentile(sorted, 0.75);

      // ---- (a) histogram ----
      var BINS = 20, W = 100 / BINS;
      var counts = new Array(BINS).fill(0);
      vals.forEach(function (v) { counts[Math.min(BINS - 1, Math.floor(v / W))]++; });
      var labels = counts.map(function (_, i) { return (i * W).toString(); });

      var histOverlay = {
        id: "histOverlay",
        beforeDatasetsDraw: function (chart) {
          var a = chart.chartArea, ctx = chart.ctx;
          var xv = function (v) { return a.left + (v / 100) * (a.right - a.left); };
          ctx.save();
          ctx.fillStyle = "rgba(13,158,118,0.12)"; // IQR band
          ctx.fillRect(xv(q1), a.top, xv(q3) - xv(q1), a.bottom - a.top);
          ctx.restore();
        },
        afterDatasetsDraw: function (chart) {
          var a = chart.chartArea, ctx = chart.ctx;
          var xv = function (v) { return a.left + (v / 100) * (a.right - a.left); };
          function line(v, color, dash, label) {
            ctx.save(); ctx.strokeStyle = color; ctx.setLineDash(dash); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(xv(v), a.top); ctx.lineTo(xv(v), a.bottom); ctx.stroke();
            ctx.setLineDash([]); ctx.fillStyle = color; ctx.font = "600 10px " + C.font;
            ctx.fillText(label, xv(v) + 4, a.top + 11); ctx.restore();
          }
          line(med, "#8AA0B6", [3, 3], "median " + med.toFixed(0));
          line(mean, C.amber, [5, 4], "mean " + mean.toFixed(1));
        },
      };

      var histChart = null;
      var histCanvas = document.getElementById("gaia-e-hist");
      if (histCanvas) K.onView(histCanvas, function () {
        histChart = new Chart(histCanvas.getContext("2d"), {
          type: "bar",
          data: { labels: labels, datasets: [{ label: "Occupations", data: counts, backgroundColor: C.teal, borderRadius: 2, barPercentage: 1, categoryPercentage: 0.96 }] },
          options: K.baseOptions({
            plugins: { legend: { display: false }, tooltip: { callbacks: { title: function (t) { var s = +t[0].label; return "GAIA-E " + s + "–" + (s + W); }, label: function (c) { return " " + c.parsed.y + " occupations"; } } } },
            scales: {
              x: { title: { display: true, text: "GAIA-E Score (index points)", color: C.textDim }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 11 } },
              y: { title: { display: true, text: "count", color: C.textDim }, beginAtZero: true },
            },
          }),
          plugins: [histOverlay],
        });
      });
      K.wireDownload(document.getElementById("dl-hist"), function () { return histChart; }, "gaia-e-histogram.png");

      // ---- (b) mean GAIA-E by group ----
      var g = {};
      rows.forEach(function (r) {
        var grp = r.group, e = parseFloat(r.gaia_e);
        if (grp && !isNaN(e)) { (g[grp] = g[grp] || []).push(e * 100); }
      });
      var groups = Object.keys(g).map(function (k) {
        var v = g[k]; return { name: k, mean: v.reduce(function (s, x) { return s + x; }, 0) / v.length };
      }).sort(function (a, b) { return b.mean - a.mean; });
      var gmax = groups[0] ? groups[0].mean : 100, gmin = groups.length ? groups[groups.length - 1].mean : 0;

      var groupChart = null;
      var groupCanvas = document.getElementById("gaia-e-group");
      if (groupCanvas) K.onView(groupCanvas, function () {
        groupChart = new Chart(groupCanvas.getContext("2d"), {
          type: "bar",
          data: {
            labels: groups.map(function (x) { return x.name; }),
            datasets: [{
              label: "Mean GAIA-E",
              data: groups.map(function (x) { return Math.round(x.mean * 10) / 10; }),
              backgroundColor: groups.map(function (x) { return lerpTeal(gmax === gmin ? 0.5 : (x.mean - gmin) / (gmax - gmin)); }),
              borderRadius: 4, barThickness: 13,
            }],
          },
          options: K.baseOptions({
            indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return " Mean GAIA-E: " + c.parsed.x + " (index pts)"; } } } },
            scales: {
              x: { min: 0, title: { display: true, text: "Mean GAIA-E Score (index points)", color: C.textDim } },
              y: { ticks: { autoSkip: false, font: { size: 10 } } },
            },
            animation: { duration: 900, delay: function (ctx) { return ctx.type === "data" && ctx.mode === "default" ? ctx.dataIndex * 60 : 0; } },
          }),
        });
      });
      K.wireDownload(document.getElementById("dl-group"), function () { return groupChart; }, "gaia-e-by-group.png");
    },
  });
})();
