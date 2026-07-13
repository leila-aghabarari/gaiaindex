/* GAIA equity & distribution lens (occupations.html). Crosses occupation AI
 * exposure (GAIA-E) with US workforce demographics from the ACS/IPUMS-derived
 * columns already in the data — (a) which demographics predict exposure
 * (correlation), (b) employment-weighted mean exposure by demographic split.
 * PapaParse + shared chart kit. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors, GREY = "#8AA0B6";
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }

  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var rows = (res.data || []).map(function (r) {
        return { e: num(r.gaia_e) != null ? num(r.gaia_e) * 100 : null, emp: num(r.tot_emp) || 0,
          fem: num(r.pct_female), col: num(r.pct_college), age: num(r.median_age),
          wage: num(r.median_wage_acs), min: num(r.pct_minority), rem: num(r.pct_remote_eligible) };
      }).filter(function (x) { return x.e != null; });

      // (a) correlations
      function pearson(field) {
        var d = rows.filter(function (x) { return x[field] != null; }), n = d.length;
        if (n < 3) return null;
        var mx = d.reduce(function (s, x) { return s + x.e; }, 0) / n, my = d.reduce(function (s, x) { return s + x[field]; }, 0) / n;
        var sxy = 0, sxx = 0, syy = 0;
        d.forEach(function (x) { sxy += (x.e - mx) * (x[field] - my); sxx += (x.e - mx) * (x.e - mx); syy += (x[field] - my) * (x[field] - my); });
        return sxy / Math.sqrt(sxx * syy);
      }
      var DEMS = [["Remote-eligible", "rem"], ["College-educated", "col"], ["Share female", "fem"], ["Median wage", "wage"], ["Median age", "age"], ["Share minority", "min"]];
      var corr = DEMS.map(function (d) { return { label: d[0], r: pearson(d[1]) }; }).filter(function (x) { return x.r != null; })
        .sort(function (a, b) { return b.r - a.r; });

      var cCanvas = document.getElementById("eq-corr"), cChart = null;
      if (cCanvas) K.onView(cCanvas, function () {
        cChart = new Chart(cCanvas.getContext("2d"), {
          type: "bar",
          data: { labels: corr.map(function (x) { return x.label; }), datasets: [{ data: corr.map(function (x) { return +x.r.toFixed(3); }), backgroundColor: corr.map(function (x) { return x.r >= 0 ? C.teal : C.coral; }), borderRadius: 3 }] },
          options: K.baseOptions({
            indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return "r = " + c.parsed.x.toFixed(3) + (c.parsed.x >= 0 ? " (more exposed)" : " (less exposed)"); } } } },
            scales: { x: { min: -0.4, max: 0.7, title: { display: true, text: "correlation with AI exposure (r)", color: C.textDim }, grid: { color: function (ctx) { return ctx.tick.value === 0 ? "rgba(255,255,255,.35)" : C.grid; } } } },
          }),
        });
      });
      K.wireDownload(document.getElementById("dl-eq-corr"), function () { return cChart; }, "gaia-equity-drivers.png");

      // (b) employment-weighted exposure by group
      function wexp(filt) { var d = rows.filter(filt); var te = d.reduce(function (s, x) { return s + x.emp; }, 0); return te ? d.reduce(function (s, x) { return s + x.e * x.emp; }, 0) / te : 0; }
      var groups = [
        { label: "Remote-eligible", v: wexp(function (x) { return x.rem != null && x.rem >= 50; }), hi: true },
        { label: "Not remote-eligible", v: wexp(function (x) { return x.rem != null && x.rem < 50; }), hi: false },
        { label: "Majority college", v: wexp(function (x) { return x.col != null && x.col >= 50; }), hi: true },
        { label: "Non-college majority", v: wexp(function (x) { return x.col != null && x.col < 50; }), hi: false },
        { label: "Lower-minority", v: wexp(function (x) { return x.min != null && x.min < 40; }), hi: true },
        { label: "High-minority (≥40%)", v: wexp(function (x) { return x.min != null && x.min >= 40; }), hi: false },
        { label: "Majority male", v: wexp(function (x) { return x.fem != null && x.fem < 50; }), hi: true },
        { label: "Majority female", v: wexp(function (x) { return x.fem != null && x.fem >= 50; }), hi: false },
      ];
      var gCanvas = document.getElementById("eq-group"), gChart = null;
      if (gCanvas) K.onView(gCanvas, function () {
        gChart = new Chart(gCanvas.getContext("2d"), {
          type: "bar",
          data: { labels: groups.map(function (g) { return g.label; }), datasets: [{ data: groups.map(function (g) { return +g.v.toFixed(1); }), backgroundColor: groups.map(function (g) { return g.hi ? C.teal : GREY; }), borderRadius: 3 }] },
          options: K.baseOptions({
            indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return "exposure " + c.parsed.x.toFixed(1) + " index pts"; } } } },
            scales: { x: { min: 0, title: { display: true, text: "employment-weighted GAIA-E (index pts)", color: C.textDim } }, y: { ticks: { font: { size: 10 } } } },
          }),
        });
      });
      K.wireDownload(document.getElementById("dl-eq-group"), function () { return gChart; }, "gaia-exposure-by-group.png");

      // takeaway
      var take = document.getElementById("eq-take");
      if (take) {
        var byR = {}; corr.forEach(function (x) { byR[x.label] = x.r; });
        take.innerHTML = "AI exposure concentrates in <b>remote-capable</b> and <b>college-educated</b> work " +
          "(r ≈ " + (byR["Remote-eligible"] || 0).toFixed(2) + " and " + (byR["College-educated"] || 0).toFixed(2) + "), " +
          "and is <b>lower in minority-heavy occupations</b> (r ≈ " + (byR["Share minority"] || 0).toFixed(2) + "). " +
          "By gender it is close to even once weighted by employment — a distributional pattern with direct reskilling-policy implications.";
      }
    },
  });
})();
