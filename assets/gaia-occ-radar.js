/* Task 10 — radar chart in the occupation detail panel.
 * Compares the clicked occupation's GAIA-E Score, E1 (%), E1+E2 (%), GAIA-B, and
 * Anthropic observed exposure (AI autonomy) against the all-occupation average
 * (dashed outline). Built lazily when a row expands. Uses OCCS/IDX (globals from
 * the page's inline script) and the shared chart kit. */
(function () {
  "use strict";
  if (typeof Chart === "undefined" || !window.GAIA_CHART || typeof OCCS === "undefined" || typeof IDX === "undefined") return;
  var K = window.GAIA_CHART, C = K.colors;

  function avg(idx, scale) {
    var s = 0, n = 0;
    OCCS.forEach(function (r) {
      var v = r[idx];
      if (v != null && !isNaN(v)) { s += v * (scale || 1); n++; }
    });
    return n ? Math.round((s / n) * 10) / 10 : 0;
  }
  var LABELS = ["GAIA-E", "E1 (%)", "E1+E2 (%)", "GAIA-B", "Anthropic obs."];
  var AVG = [avg(IDX.gaia_e, 100), avg(IDX.dv_alpha), avg(IDX.dv_beta), avg(IDX.sml), avg(IDX.aei_beta)];

  function num(v) { v = parseFloat(v); return isNaN(v) ? null : v; }

  function buildRadar(canvas) {
    if (canvas.dataset.init) return;
    canvas.dataset.init = "1";
    var d = canvas.dataset;
    var vals = [num(d.ge), num(d.e1), num(d.e12), num(d.gb), num(d.an)];
    new Chart(canvas.getContext("2d"), {
      type: "radar",
      data: {
        labels: LABELS,
        datasets: [
          { label: "This occupation", data: vals, borderColor: C.teal, backgroundColor: "rgba(13,158,118,0.25)", pointBackgroundColor: C.teal, pointRadius: 3, borderWidth: 2 },
          { label: "All-occupation avg", data: AVG, borderColor: C.textDim, backgroundColor: "transparent", borderDash: [5, 4], pointRadius: 0, borderWidth: 1.5 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: C.text, font: { family: C.font, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + (c.parsed.r == null ? "n/a" : c.parsed.r); } } },
        },
        scales: {
          r: {
            min: 0, max: 100,
            angleLines: { color: "rgba(255,255,255,0.1)" },
            grid: { color: "rgba(255,255,255,0.1)" },
            pointLabels: { color: C.text, font: { family: C.font, size: 11 } },
            ticks: { display: false, backdropColor: "transparent" },
          },
        },
      },
    });
  }

  // Build when a row's detail panel opens (delegated; runs after the page's
  // own toggle handler since this listens on document during bubbling).
  document.addEventListener("click", function (e) {
    var row = e.target.closest("tr.occ-row");
    if (!row) return;
    var detail = row.nextElementSibling;
    if (detail && detail.classList.contains("detail-row") && detail.classList.contains("show")) {
      var c = detail.querySelector("canvas.occ-radar");
      if (c) buildRadar(c);
    }
  });
})();
