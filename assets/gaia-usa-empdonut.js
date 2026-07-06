/* Task 18 — usa.html employment-weighted donut: share of total US employment by
 * E1+E2 quartile (weighted by OEWS tot_emp). Quartiles are on the published
 * E1+E2 (dv_rating_beta) distribution. PapaParse. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;
  var COLORS = ["#6B8299", C.blue, C.teal, C.amber]; // Q1(low) -> Q4(high exposure)

  function percentile(sorted, p) {
    var i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }

  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var rows = (res.data || []).map(function (r) {
        return { e: parseFloat(r.dv_rating_beta), emp: parseFloat(r.tot_emp) };
      }).filter(function (r) { return !isNaN(r.e) && !isNaN(r.emp); });
      if (!rows.length) return;

      var es = rows.map(function (r) { return r.e; }).sort(function (a, b) { return a - b; });
      var q1 = percentile(es, 0.25), q2 = percentile(es, 0.5), q3 = percentile(es, 0.75);
      var bounds = [0, q1, q2, q3, 100];
      var emp = [0, 0, 0, 0];
      rows.forEach(function (r) {
        var qi = r.e <= q1 ? 0 : r.e <= q2 ? 1 : r.e <= q3 ? 2 : 3;
        emp[qi] += r.emp;
      });
      var total = emp.reduce(function (s, v) { return s + v; }, 0);
      var labels = emp.map(function (_, i) {
        return "Q" + (i + 1) + " · E1+E2 " + Math.round(bounds[i]) + "–" + Math.round(bounds[i + 1]) + "%";
      });

      var sub = document.getElementById("empdonut-sub");
      if (sub) {
        var topShare = ((emp[3] / total) * 100).toFixed(0), botShare = ((emp[0] / total) * 100).toFixed(0);
        sub.textContent = "Share of total US employment by E1+E2 quartile — the most-exposed quartile holds " +
          topShare + "% of jobs, the least-exposed " + botShare + "%.";
      }

      var canvas = document.getElementById("empDonutChart");
      if (!canvas) return;
      var chart = null;
      K.onView(canvas, function () {
        chart = new Chart(canvas.getContext("2d"), {
          type: "doughnut",
          data: { labels: labels, datasets: [{ data: emp, backgroundColor: COLORS, borderColor: "#0A1628", borderWidth: 2, hoverOffset: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: "60%",
            plugins: {
              legend: { position: "right", labels: { color: C.text, boxWidth: 12, font: { family: C.font, size: 11 } } },
              tooltip: { callbacks: { label: function (c) {
                var pct = ((c.parsed / total) * 100).toFixed(1);
                return " " + Math.round(c.parsed).toLocaleString("en-US") + " jobs (" + pct + "%)";
              } } },
            },
          },
        });
      });
      K.wireDownload(document.getElementById("dl-empdonut"), function () { return chart; }, "gaia-employment-by-exposure-quartile.png");
    },
  });
})();
