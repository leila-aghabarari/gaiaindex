/* Task 16 — trends.html "Momentum" slope chart.
 * Loads the pre-computed data/gaia_momentum.json (top-10 rising / top-5 falling
 * O*NET activities by observed usage, earliest vs latest vintage) and renders a
 * slopegraph: teal = rising, coral = falling, with decluttered right-end labels. */
(function () {
  "use strict";
  if (typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;

  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  fetch("data/gaia_momentum.json")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var canvas = document.getElementById("momentumChart");
      if (!canvas) return;
      var sub = document.getElementById("momentum-sub");
      if (sub) sub.textContent = "Top-" + d.rising.length + " rising and top-" + d.falling.length +
        " O*NET activities by observed usage, " + d.early_label + " → " + d.late_label + ".";

      function mk(item, color) {
        return {
          label: item.task, data: [item.early, item.late],
          borderColor: color, backgroundColor: color, pointRadius: 3, pointHoverRadius: 5,
          borderWidth: 1.6, tension: 0, _color: color,
        };
      }
      var datasets = d.rising.map(function (x) { return mk(x, C.teal); })
        .concat(d.falling.map(function (x) { return mk(x, C.coral); }));

      // right-end labels with simple vertical declutter
      var endLabels = {
        id: "momentumLabels",
        afterDatasetsDraw: function (chart) {
          var area = chart.chartArea, ctx = chart.ctx;
          var items = [];
          chart.data.datasets.forEach(function (ds, i) {
            var meta = chart.getDatasetMeta(i);
            var pt = meta.data[meta.data.length - 1];
            if (pt) items.push({ y: pt.y, text: trunc(ds.label, 34), color: ds._color });
          });
          items.sort(function (a, b) { return a.y - b.y; });
          var minGap = 13, prev = -Infinity;
          items.forEach(function (it) { if (it.y < prev + minGap) it.y = prev + minGap; prev = it.y; });
          ctx.save();
          ctx.font = "500 10px " + C.font; ctx.textBaseline = "middle";
          items.forEach(function (it) {
            ctx.fillStyle = it.color;
            ctx.fillText(it.text, area.right + 8, Math.min(it.y, area.bottom));
          });
          ctx.restore();
        },
      };

      var chart = null;
      K.onView(canvas, function () {
        chart = new Chart(canvas.getContext("2d"), {
          type: "line",
          data: { labels: [d.early_label, d.late_label], datasets: datasets },
          options: K.baseOptions({
            layout: { padding: { right: 240 } },
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { title: function (t) { return t[0].dataset.label; }, label: function (c) { return " " + (c.dataIndex === 0 ? d.early_label : d.late_label) + ": " + c.parsed.y + "%"; } } },
            },
            scales: {
              x: { grid: { display: false } },
              y: { min: 0, title: { display: true, text: d.unit, color: C.textDim } },
            },
          }),
          plugins: [endLabels],
        });
      });
      K.wireDownload(document.getElementById("dl-momentum"), function () { return chart; }, "gaia-momentum.png");
    })
    .catch(function () {
      var sub = document.getElementById("momentum-sub");
      if (sub) sub.textContent = "Momentum data unavailable.";
    });
})();
