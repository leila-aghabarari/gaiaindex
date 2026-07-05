/* Tasks 6 & 7 — hero band: animated top-10 occupations by published E1+E2
 * (dv_rating_beta), drawn bar-by-bar on view, with the mean E1+E2 line + label.
 * Data from data/gaia_occupations.csv via PapaParse. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;

  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var rows = (res.data || [])
        .filter(function (r) { return r.Title && r.dv_rating_beta !== "" && !isNaN(parseFloat(r.dv_rating_beta)); })
        .map(function (r) { return { title: r.Title, beta: parseFloat(r.dv_rating_beta) }; });
      if (!rows.length) return;

      var mean = rows.reduce(function (s, r) { return s + r.beta; }, 0) / rows.length;
      var meanR = Math.round(mean * 10) / 10;
      var top10 = rows.slice().sort(function (a, b) { return b.beta - a.beta; }).slice(0, 10);

      // Task 6 label (34.5% is the mean of raw E1+E2 -> percentage phrasing)
      var lbl = document.getElementById("e1e2-mean-label");
      if (lbl) lbl.textContent = "Mean theoretical exposure (E1+E2): " + meanR + "% of tasks — Eloundou et al. 2024.";

      var canvas = document.getElementById("e1e2-top10");
      if (!canvas) return;
      var chart = null;

      K.onView(canvas, function () {
        chart = new Chart(canvas.getContext("2d"), {
          type: "bar",
          data: {
            labels: top10.map(function (o) { return o.title; }),
            datasets: [{
              label: "E1+E2 (%)",
              data: top10.map(function (o) { return o.beta; }),
              backgroundColor: C.teal,
              borderRadius: 4,
              barThickness: 20,
            }],
          },
          options: K.baseOptions({
            indexAxis: "y",
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: function (c) { return " E1+E2: " + c.parsed.x + "%"; } } },
            },
            scales: {
              x: { min: 0, max: 100, title: { display: true, text: "E1+E2 exposure (%)", color: C.textDim } },
              y: { ticks: { autoSkip: false, font: { size: 11 } } },
            },
            // draw in bar-by-bar
            animation: { duration: 900, delay: function (ctx) { return ctx.type === "data" && ctx.mode === "default" ? ctx.dataIndex * 110 : 0; } },
          }),
          plugins: [K.meanLinePlugin(meanR, "mean " + meanR + "%")],
        });
      });

      K.wireDownload(document.getElementById("e1e2-dl"), function () { return chart; }, "gaia-top10-e1e2.png");
    },
  });
})();
