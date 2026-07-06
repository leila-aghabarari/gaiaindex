/* Task 20 — research hub: a small inline thumbnail chart of each paper's key
 * figure. hist = GAIA-E distribution, scatter = GAIA-E vs task-success (with the
 * negative fit line), bars = Brazil vs peers work use. Real data via PapaParse. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;

  var thumbs = [].slice.call(document.querySelectorAll(".pc-thumb canvas"));
  if (!thumbs.length) return;
  function has(fig) { return thumbs.some(function (c) { return c.getAttribute("data-fig") === fig; }); }
  function bare() {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: { duration: 600 },
    };
  }
  function draw(cv, cfg) { new Chart(cv.getContext("2d"), cfg); }

  if (has("hist") || has("scatter")) {
    Papa.parse("data/gaia_occupations.csv", {
      download: true, header: true, comments: "#", skipEmptyLines: true,
      complete: function (res) {
        var rows = res.data || [];
        thumbs.forEach(function (cv) {
          var f = cv.getAttribute("data-fig");
          if (f === "hist") {
            var vals = rows.map(function (r) { return parseFloat(r.gaia_e) * 100; }).filter(function (v) { return !isNaN(v); });
            var B = 16, W = 100 / B, counts = new Array(B).fill(0);
            vals.forEach(function (v) { counts[Math.min(B - 1, Math.floor(v / W))]++; });
            draw(cv, { type: "bar", data: { labels: counts.map(function (_, i) { return i; }), datasets: [{ data: counts, backgroundColor: C.teal, borderRadius: 1, barPercentage: 1, categoryPercentage: 0.96 }] }, options: bare() });
          } else if (f === "scatter") {
            var pts = rows.map(function (r) { return { x: parseFloat(r.gaia_e) * 100, y: parseFloat(r.aei_task_success) }; }).filter(function (p) { return !isNaN(p.x) && !isNaN(p.y); });
            var n = pts.length, mx = 0, my = 0;
            pts.forEach(function (p) { mx += p.x; my += p.y; }); mx /= n; my /= n;
            var sxy = 0, sxx = 0;
            pts.forEach(function (p) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) * (p.x - mx); });
            var b = sxy / sxx, a = my - b * mx;
            draw(cv, { type: "scatter", data: { datasets: [
              { data: pts, backgroundColor: "rgba(13,158,118,0.5)", pointRadius: 1.2 },
              { type: "line", data: [{ x: 0, y: a }, { x: 100, y: a + b * 100 }], borderColor: C.amber, borderWidth: 1.5, pointRadius: 0 },
            ] }, options: bare() });
          }
        });
      },
    });
  }

  if (has("bars")) {
    Papa.parse("data/gaia_countries.csv", {
      download: true, header: true, comments: "#", skipEmptyLines: true,
      complete: function (res) {
        var byIso = {};
        (res.data || []).forEach(function (r) { if (r.iso3) byIso[r.iso3] = r; });
        thumbs.forEach(function (cv) {
          if (cv.getAttribute("data-fig") !== "bars") return;
          var order = ["BRA", "USA", "IND", "DEU"], cols = [C.teal, C.blue, C.amber, C.coral];
          draw(cv, { type: "bar", data: { labels: order, datasets: [{ data: order.map(function (iso) { return parseFloat((byIso[iso] || {}).uc_work); }), backgroundColor: cols, borderRadius: 2 }] }, options: bare() });
        });
      },
    });
  }
})();
