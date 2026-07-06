/* Task 14 — country detail panel: horizontal stacked bar of the country's
 * collaboration-mode split, with the global-average bar beneath it.
 * Exposes window.GaiaCollabStack(row); called by showDetail(). Uses the page's
 * global allData for the average and the shared chart kit. */
(function () {
  "use strict";
  if (typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;

  var MODES = [
    ["Directive", "collab_directive", "#EF6F6C"],
    ["Task iteration", "collab_task_iteration", "#3B82F6"],
    ["Learning", "collab_learning", "#0D9E76"],
    ["Feedback loop", "collab_feedback_loop", "#F59E0B"],
    ["Validation", "collab_validation", "#8B5CF6"],
    ["Other", "__other", "#6B7C8C"],
  ];
  function val(r, key) {
    if (key === "__other") return (parseFloat(r.collab_none) || 0) + (parseFloat(r.collab_not_classified) || 0);
    var v = parseFloat(r[key]);
    return isNaN(v) ? 0 : v;
  }

  var AVG = null, chart = null;
  function computeAvg() {
    AVG = {};
    var data = (typeof allData !== "undefined" && allData && allData.length) ? allData : [];
    MODES.forEach(function (m) {
      var s = 0, n = 0;
      data.forEach(function (r) { var v = val(r, m[1]); s += v; n++; });
      AVG[m[1]] = n ? s / n : 0;
    });
  }

  window.GaiaCollabStack = function (row) {
    var canvas = document.getElementById("cty-collab-stack");
    if (!canvas) return;
    if (!AVG) computeAvg();
    var datasets = MODES.map(function (m) {
      return { label: m[0], data: [val(row, m[1]), AVG[m[1]]], backgroundColor: m[2], borderWidth: 0 };
    });
    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: { labels: ["This country", "Global average"], datasets: datasets },
      options: K.baseOptions({
        indexAxis: "y",
        plugins: {
          legend: { labels: { color: C.text, boxWidth: 10, font: { size: 10 } } },
          tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + c.parsed.x.toFixed(1) + "%"; } } },
        },
        scales: {
          x: { stacked: true, min: 0, max: 100, title: { display: true, text: "share of interactions (%)", color: C.textDim } },
          y: { stacked: true },
        },
      }),
    });
  };
})();
