/* Task 13 — countries.html "algorithmic divide": grouped bars of mean uc_work
 * vs mean uc_coursework by income group. The Low/High coursework ratio is
 * computed from the data (not hardcoded) and written into the subtitle. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;
  var ORDER = ["High", "Upper-middle", "Lower-middle", "Low"];

  Papa.parse("data/gaia_countries.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var g = {};
      (res.data || []).forEach(function (r) {
        var grp = r.income_group;
        if (ORDER.indexOf(grp) < 0) return;
        var w = parseFloat(r.uc_work), c = parseFloat(r.uc_coursework);
        g[grp] = g[grp] || { w: [], c: [] };
        if (!isNaN(w)) g[grp].w.push(w);
        if (!isNaN(c)) g[grp].c.push(c);
      });
      function mean(a) { return a && a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
      var labels = ORDER.filter(function (k) { return g[k]; });
      var work = labels.map(function (k) { return +mean(g[k].w).toFixed(1); });
      var course = labels.map(function (k) { return +mean(g[k].c).toFixed(1); });

      // data-driven ratio for the subtitle (Low vs High coursework)
      var hi = g["High"] ? mean(g["High"].c) : null, lo = g["Low"] ? mean(g["Low"].c) : null;
      var sub = document.getElementById("divide-sub");
      if (sub && hi && lo) {
        sub.textContent = "Low-income countries use AI for coursework at " + (lo / hi).toFixed(1) +
          "× the rate of high-income countries (" + lo.toFixed(0) + "% vs " + hi.toFixed(0) + "%).";
      }

      var canvas = document.getElementById("cty-divide");
      if (!canvas) return;
      var chart = null;
      K.onView(canvas, function () {
        chart = new Chart(canvas.getContext("2d"), {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              { label: "Work use (%)", data: work, backgroundColor: C.teal, borderRadius: 4 },
              { label: "Coursework use (%)", data: course, backgroundColor: C.amber, borderRadius: 4 },
            ],
          },
          options: K.baseOptions({
            plugins: {
              legend: { labels: { color: C.text, boxWidth: 12 } },
              tooltip: { callbacks: { label: function (c2) { return " " + c2.dataset.label + ": " + c2.parsed.y + "%"; } } },
            },
            scales: {
              x: { title: { display: true, text: "World Bank income group", color: C.textDim } },
              y: { min: 0, title: { display: true, text: "Mean share of use (%)", color: C.textDim } },
            },
          }),
        });
      });
      K.wireDownload(document.getElementById("dl-divide"), function () { return chart; }, "gaia-algorithmic-divide.png");
    },
  });
})();
