/* Task 21 — about.html "GAIA at a glance": GAIA-E histogram, a country bubble
 * mini, and a correlation heatmap of GAIA-E, E1+E2, GAIA-B, and Anthropic
 * observed exposure (AI autonomy). Data via PapaParse. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;
  function bare(extra) {
    var o = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 700 } };
    return Object.assign(o, extra || {});
  }

  // ---- occupations: histogram + correlations ----
  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var rows = res.data || [];
      // histogram of gaia_e*100
      var hc = document.getElementById("glance-hist");
      if (hc) {
        var vals = rows.map(function (r) { return parseFloat(r.gaia_e) * 100; }).filter(function (v) { return !isNaN(v); });
        var B = 16, W = 100 / B, counts = new Array(B).fill(0);
        vals.forEach(function (v) { counts[Math.min(B - 1, Math.floor(v / W))]++; });
        new Chart(hc.getContext("2d"), { type: "bar", data: { labels: counts.map(function (_, i) { return i; }), datasets: [{ data: counts, backgroundColor: C.teal, borderRadius: 1, barPercentage: 1, categoryPercentage: 0.96 }] }, options: bare() });
      }

      // correlation heatmap
      var MEAS = [["GAIA-E", "gaia_e"], ["E1+E2", "dv_rating_beta"], ["GAIA-B", "sml_score"], ["Anthr.", "aei_autonomy_pct"]];
      function col(key) { return rows.map(function (r) { return parseFloat(r[key]); }); }
      var cols = MEAS.map(function (m) { return col(m[1]); });
      function pearson(a, b) {
        var xs = [], ys = [];
        for (var i = 0; i < a.length; i++) { if (!isNaN(a[i]) && !isNaN(b[i])) { xs.push(a[i]); ys.push(b[i]); } }
        var n = xs.length; if (n < 3) return NaN;
        var mx = xs.reduce(function (s, v) { return s + v; }, 0) / n, my = ys.reduce(function (s, v) { return s + v; }, 0) / n;
        var sxy = 0, sxx = 0, syy = 0;
        for (var j = 0; j < n; j++) { sxy += (xs[j] - mx) * (ys[j] - my); sxx += (xs[j] - mx) * (xs[j] - mx); syy += (ys[j] - my) * (ys[j] - my); }
        return sxy / Math.sqrt(sxx * syy);
      }
      function heat(r) {
        var base = [16, 33, 46];
        var t = Math.abs(r), to = r >= 0 ? [13, 158, 118] : [239, 111, 108];
        return "rgb(" + base.map(function (v, i) { return Math.round(v + (to[i] - v) * t); }).join(",") + ")";
      }
      var hm = document.getElementById("glance-heatmap");
      if (hm) {
        hm.style.gridTemplateColumns = "minmax(46px,auto) repeat(4,1fr)";
        var html = '<div class="hm-lbl"></div>';
        MEAS.forEach(function (m) { html += '<div class="hm-lbl col">' + m[0] + "</div>"; });
        MEAS.forEach(function (m, i) {
          html += '<div class="hm-lbl">' + m[0] + "</div>";
          MEAS.forEach(function (_, j) {
            var r = i === j ? 1 : pearson(cols[i], cols[j]);
            html += '<div class="hm-cell" style="background:' + heat(r) + '">' + (isNaN(r) ? "–" : r.toFixed(2)) + "</div>";
          });
        });
        hm.innerHTML = html;
      }
    },
  });

  // ---- countries: bubble mini ----
  var bc = document.getElementById("glance-bubble");
  if (bc) {
    var INC = { High: C.teal, "Upper-middle": C.blue, "Lower-middle": C.amber, Low: C.coral };
    Papa.parse("data/gaia_countries.csv", {
      download: true, header: true, comments: "#", skipEmptyLines: true,
      complete: function (res) {
        var pts = (res.data || []).filter(function (r) { return r.usage_pct_global && r.uc_work && r.gaia_a; }).map(function (r) {
          return { x: parseFloat(r.usage_pct_global), y: parseFloat(r.uc_work), r: 2 + parseFloat(r.gaia_a) * 8, c: INC[r.income_group] || "#8AA0B6" };
        }).filter(function (p) { return !isNaN(p.x) && !isNaN(p.y); });
        new Chart(bc.getContext("2d"), {
          type: "bubble",
          data: { datasets: [{ data: pts, backgroundColor: pts.map(function (p) { return p.c + "99"; }) }] },
          options: bare({ scales: { x: { type: "logarithmic", display: false }, y: { display: false } } }),
        });
      },
    });
  }
})();
