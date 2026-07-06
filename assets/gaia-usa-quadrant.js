/* Task 17 — usa.html wage-vs-exposure quadrant scatter.
 * x = E1+E2 (dv_rating_beta, %) · y = median annual wage (OEWS a_median) ·
 * quadrant lines at the medians, four labeled quadrants, points colored by
 * quadrant, hover shows occupation title + employment (tot_emp). PapaParse. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;
  var GREY = "#8AA0B6";

  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var pts = (res.data || []).map(function (r) {
        return { x: parseFloat(r.dv_rating_beta), y: parseFloat(r.a_median), title: r.Title, emp: parseFloat(r.tot_emp) };
      }).filter(function (p) { return p.title && !isNaN(p.x) && !isNaN(p.y); });

      var sub = document.querySelector("#wageQuadChart");
      if (!pts.length) {
        // OEWS wage column missing/empty -> report and skip
        var card = document.getElementById("dl-quad");
        if (card && card.parentElement) card.parentElement.querySelector(".gaia-chart-sub").textContent =
          "OEWS median-wage data not available — quadrant scatter skipped.";
        return;
      }

      var medX = median(pts.map(function (p) { return p.x; }));
      var medY = median(pts.map(function (p) { return p.y; }));

      // quadrant assignment + color
      var Q = {
        aug: { label: "Augmentation zone", color: C.teal, pts: [] },
        sub: { label: "Substitution risk", color: C.coral, pts: [] },
        safe: { label: "AI-safe premium", color: C.blue, pts: [] },
        untouched: { label: "Untouched", color: GREY, pts: [] },
      };
      pts.forEach(function (p) {
        var k = p.x >= medX ? (p.y >= medY ? "aug" : "sub") : (p.y >= medY ? "safe" : "untouched");
        Q[k].pts.push(p);
      });
      var datasets = Object.keys(Q).map(function (k) {
        return { label: Q[k].label, data: Q[k].pts, backgroundColor: Q[k].color + "cc", borderColor: Q[k].color, pointRadius: 3, pointHoverRadius: 5 };
      });

      var quadLines = {
        id: "quadLines",
        afterDatasetsDraw: function (chart) {
          var a = chart.chartArea, xs = chart.scales.x, ys = chart.scales.y, ctx = chart.ctx;
          var px = xs.getPixelForValue(medX), py = ys.getPixelForValue(medY);
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke();
          ctx.setLineDash([]); ctx.font = "700 11px " + C.font;
          [
            ["Augmentation zone", a.right - 8, a.top + 15, "right", C.teal],
            ["Substitution risk", a.right - 8, a.bottom - 10, "right", C.coral],
            ["AI-safe premium", a.left + 8, a.top + 15, "left", C.blue],
            ["Untouched", a.left + 8, a.bottom - 10, "left", GREY],
          ].forEach(function (L) { ctx.textAlign = L[3]; ctx.fillStyle = L[4]; ctx.fillText(L[0], L[1], L[2]); });
          ctx.restore();
        },
      };

      var canvas = document.getElementById("wageQuadChart");
      if (!canvas) return;
      var chart = null;
      K.onView(canvas, function () {
        chart = new Chart(canvas.getContext("2d"), {
          type: "scatter",
          data: { datasets: datasets },
          options: K.baseOptions({
            plugins: {
              legend: { labels: { color: C.text, boxWidth: 10, font: { size: 11 } } },
              tooltip: { callbacks: { label: function (c) {
                var p = c.raw;
                return [p.title, "E1+E2: " + p.x + "%", "Median wage: $" + Math.round(p.y).toLocaleString("en-US"), isNaN(p.emp) ? "" : "Employment: " + Math.round(p.emp).toLocaleString("en-US")].filter(Boolean);
              } } },
            },
            scales: {
              x: { min: 0, max: 100, title: { display: true, text: "E1+E2 exposure (%, Eloundou 2024)", color: C.textDim } },
              y: { title: { display: true, text: "Median annual wage (OEWS, $)", color: C.textDim }, ticks: { callback: function (v) { return "$" + (v / 1000) + "k"; } } },
            },
          }),
          plugins: [quadLines],
        });
      });
      K.wireDownload(document.getElementById("dl-quad"), function () { return chart; }, "gaia-wage-exposure-quadrants.png");
    },
  });
})();
