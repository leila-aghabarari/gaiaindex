/* Task 12 — countries.html bubble chart.
 * x = usage_pct_global (log) · y = uc_work · size = gaia_a · color = income_group.
 * Tooltip with country + stats; callouts for the US and Brazil. Data via PapaParse. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;

  var INCOME = [
    { key: "High", color: C.teal },
    { key: "Upper-middle", color: C.blue },
    { key: "Lower-middle", color: C.amber },
    { key: "Low", color: C.coral },
    { key: "Other", color: "#8AA0B6" },
  ];
  var colorOf = {};
  INCOME.forEach(function (g) { colorOf[g.key] = g.color; });

  function withAlpha(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  Papa.parse("data/gaia_countries.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var rows = (res.data || []).filter(function (r) {
        return r.country_name && r.usage_pct_global && r.uc_work && r.gaia_a &&
          !isNaN(parseFloat(r.usage_pct_global)) && !isNaN(parseFloat(r.uc_work)) && !isNaN(parseFloat(r.gaia_a));
      });
      if (!rows.length) return;

      var datasets = INCOME.map(function (g) {
        var pts = rows.filter(function (r) { return (r.income_group || "Other") === g.key; }).map(function (r) {
          var name = r.country_name;
          return {
            x: parseFloat(r.usage_pct_global),
            y: parseFloat(r.uc_work),
            r: 4 + parseFloat(r.gaia_a) * 20,
            country: name, income: g.key, gaia_a: parseFloat(r.gaia_a),
            callout: (r.iso3 === "USA" ? "United States" : r.iso3 === "BRA" ? "Brazil" : null),
          };
        });
        return { label: g.key, data: pts, backgroundColor: withAlpha(g.color, 0.55), borderColor: g.color, borderWidth: 1 };
      }).filter(function (d) { return d.data.length; });

      var callouts = {
        id: "ctyCallouts",
        afterDatasetsDraw: function (chart) {
          var ctx = chart.ctx;
          chart.data.datasets.forEach(function (ds, di) {
            var meta = chart.getDatasetMeta(di);
            ds.data.forEach(function (pt, pi) {
              if (!pt.callout || !meta.data[pi]) return;
              var el = meta.data[pi], x = el.x, y = el.y, tx = x + 16, ty = y - 16;
              ctx.save();
              ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
              ctx.font = "600 12px " + C.font; ctx.fillStyle = "#eaf2f8";
              ctx.fillText(pt.callout, tx + 3, ty);
              ctx.restore();
            });
          });
        },
      };

      var canvas = document.getElementById("cty-bubble");
      if (!canvas) return;
      var chart = null;
      K.onView(canvas, function () {
        chart = new Chart(canvas.getContext("2d"), {
          type: "bubble",
          data: { datasets: datasets },
          options: K.baseOptions({
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: function (c) {
                var p = c.raw;
                return [p.country + " (" + p.income + ")", "Usage share: " + p.x + "%", "Work use: " + p.y.toFixed(1) + "%", "GAIA-A: " + p.gaia_a.toFixed(3)];
              } } },
            },
            scales: {
              x: { type: "logarithmic", min: 0.001, title: { display: true, text: "Share of global Claude.ai usage (%, log)", color: C.textDim } },
              y: { min: 0, max: 100, title: { display: true, text: "Work use (%)", color: C.textDim } },
            },
          }),
          plugins: [callouts],
        });
      });
      K.wireDownload(document.getElementById("dl-bubble"), function () { return chart; }, "gaia-country-bubble.png");

      // legend
      var leg = document.getElementById("cty-legend");
      if (leg) leg.innerHTML = INCOME.filter(function (g) { return rows.some(function (r) { return (r.income_group || "Other") === g.key; }); })
        .map(function (g) { return '<span class="cty-leg"><i style="background:' + g.color + '"></i>' + g.key + "</span>"; }).join("");
    },
  });
})();
