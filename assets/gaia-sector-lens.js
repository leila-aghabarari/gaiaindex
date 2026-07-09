/* GAIA sector lens (occupations.html). Aggregates the 923 occupations up to 22
 * major groups, employment-weighted (US BLS), and shows (a) a sector quadrant map
 * — exposure × median wage × employment, framed as augmentation / substitution
 * risk / AI-safe premium / untouched; (b) a ranked bar of employment-weighted
 * GAIA-E exposure. PapaParse + shared chart kit. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors, GREY = "#8AA0B6";
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var g = {};
      (res.data || []).forEach(function (r) {
        var grp = r.group; if (!grp) return;
        var e = num(r.gaia_e), emp = num(r.tot_emp) || 0, w = num(r.a_median);
        var o = g[grp] || (g[grp] = { we: 0, emp: 0, ww: 0, wemp: 0 });
        if (e != null) { o.we += e * emp; o.emp += emp; }
        if (w != null && emp) { o.ww += w * emp; o.wemp += emp; }
      });
      var groups = Object.keys(g).map(function (k) {
        var o = g[k];
        return { name: k, exp: o.emp ? (o.we / o.emp) * 100 : 0, emp: o.emp, wage: o.wemp ? o.ww / o.wemp : 0 };
      }).filter(function (x) { return x.emp > 0 && x.wage > 0; });
      var totEmp = groups.reduce(function (s, x) { return s + x.emp; }, 0);
      var medX = median(groups.map(function (x) { return x.exp; }));
      var medY = median(groups.map(function (x) { return x.wage; }));

      // ---- (a) sector quadrant bubble map ----
      function qColor(x) { return x.exp >= medX ? (x.wage >= medY ? C.teal : C.coral) : (x.wage >= medY ? C.blue : GREY); }
      var bubbles = groups.map(function (x) { return { x: +x.exp.toFixed(1), y: Math.round(x.wage), r: 5 + Math.sqrt(x.emp / 1e6) * 2.4, name: x.name, emp: x.emp, color: qColor(x) }; });
      var quadPlugin = {
        id: "sectorQuad",
        afterDatasetsDraw: function (chart) {
          var a = chart.chartArea, xs = chart.scales.x, ys = chart.scales.y, ctx = chart.ctx;
          var px = xs.getPixelForValue(medX), py = ys.getPixelForValue(medY);
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke(); ctx.setLineDash([]);
          ctx.font = "700 10px " + C.font;
          [["Augmentation", a.right - 6, a.top + 13, "right", C.teal], ["Substitution risk", a.right - 6, a.bottom - 8, "right", C.coral],
           ["AI-safe premium", a.left + 6, a.top + 13, "left", C.blue], ["Untouched", a.left + 6, a.bottom - 8, "left", GREY]]
            .forEach(function (L) { ctx.textAlign = L[3]; ctx.fillStyle = L[4]; ctx.fillText(L[0], L[1], L[2]); });
          // bubble labels
          ctx.font = "500 9px " + C.font; ctx.fillStyle = C.text; ctx.textAlign = "center";
          var meta = chart.getDatasetMeta(0);
          meta.data.forEach(function (pt, i) { if (pt) ctx.fillText(trunc(bubbles[i].name, 16), pt.x, pt.y - pt.options.radius - 2); });
          ctx.restore();
        },
      };
      var mapCanvas = document.getElementById("sector-map");
      var mapChart = null;
      if (mapCanvas) K.onView(mapCanvas, function () {
        mapChart = new Chart(mapCanvas.getContext("2d"), {
          type: "bubble",
          data: { datasets: [{ data: bubbles, backgroundColor: bubbles.map(function (b) { return b.color + "bb"; }), borderColor: bubbles.map(function (b) { return b.color; }), borderWidth: 1 }] },
          options: K.baseOptions({
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { var b = c.raw; return [b.name, "Exposure: " + b.x + " · Wage: $" + b.y.toLocaleString(), "Employment: " + (b.emp / 1e6).toFixed(1) + "M (" + (100 * b.emp / totEmp).toFixed(1) + "%)"]; } } } },
            scales: { x: { title: { display: true, text: "Employment-weighted GAIA-E exposure (index points)", color: C.textDim } }, y: { title: { display: true, text: "Median annual wage ($)", color: C.textDim }, ticks: { callback: function (v) { return "$" + v / 1000 + "k"; } } } },
          }),
          plugins: [quadPlugin],
        });
      });
      K.wireDownload(document.getElementById("dl-sector-map"), function () { return mapChart; }, "gaia-sector-map.png");

      // ---- (b) ranked bar: employment-weighted exposure ----
      var ranked = groups.slice().sort(function (a, b) { return b.exp - a.exp; });
      var emax = ranked[0].exp, emin = ranked[ranked.length - 1].exp;
      function ramp(v) { var t = (v - emin) / (emax - emin || 1); return "rgba(13,158,118," + (0.35 + 0.6 * t).toFixed(2) + ")"; }
      var barCanvas = document.getElementById("sector-bars");
      var barChart = null;
      if (barCanvas) K.onView(barCanvas, function () {
        barChart = new Chart(barCanvas.getContext("2d"), {
          type: "bar",
          data: { labels: ranked.map(function (x) { return x.name; }), datasets: [{ data: ranked.map(function (x) { return +x.exp.toFixed(1); }), backgroundColor: ranked.map(function (x) { return ramp(x.exp); }), borderRadius: 3 }] },
          options: K.baseOptions({
            indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { var x = ranked[c.dataIndex]; return "Exposure " + x.exp.toFixed(1) + " · " + (x.emp / 1e6).toFixed(1) + "M jobs (" + (100 * x.emp / totEmp).toFixed(1) + "%)"; } } } },
            scales: { x: { title: { display: true, text: "employment-weighted GAIA-E", color: C.textDim } }, y: { ticks: { font: { size: 10 } } } },
          }),
        });
      });
      K.wireDownload(document.getElementById("dl-sector-bars"), function () { return barChart; }, "gaia-sector-exposure.png");
    },
  });
})();
