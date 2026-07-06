/* Task 19 — brazil.html: Brazil vs US/India/Germany grouped bar (use-case split)
 * and the transmission-chain reveal (stages fade in on scroll). Data via PapaParse. */
(function () {
  "use strict";

  // transmission chain reveal (independent of chart libs)
  var chain = document.querySelector(".tchain");
  if (chain) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { chain.classList.add("in"); io.disconnect(); } });
      }, { threshold: 0.3 });
      io.observe(chain);
    } else chain.classList.add("in");
  }

  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;
  var NAME = { BRA: "Brazil", USA: "United States", IND: "India", DEU: "Germany" };
  var COLOR = { BRA: C.teal, USA: C.blue, IND: C.amber, DEU: C.coral };

  Papa.parse("data/gaia_countries.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var byIso = {};
      (res.data || []).forEach(function (r) { if (r.iso3) byIso[r.iso3] = r; });
      var order = ["BRA", "USA", "IND", "DEU"];
      var datasets = order.map(function (iso) {
        var r = byIso[iso] || {};
        return {
          label: NAME[iso],
          data: [parseFloat(r.uc_work), parseFloat(r.uc_personal), parseFloat(r.uc_coursework)],
          backgroundColor: COLOR[iso], borderRadius: 4,
        };
      });
      var canvas = document.getElementById("brazilBar");
      if (!canvas) return;
      var chart = null;
      K.onView(canvas, function () {
        chart = new Chart(canvas.getContext("2d"), {
          type: "bar",
          data: { labels: ["Work", "Personal", "Coursework"], datasets: datasets },
          options: K.baseOptions({
            plugins: {
              legend: { labels: { color: C.text, boxWidth: 12 } },
              tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + c.parsed.y.toFixed(1) + "%"; } } },
            },
            scales: { y: { min: 0, title: { display: true, text: "share of use (%)", color: C.textDim } } },
          }),
        });
      });
      K.wireDownload(document.getElementById("dl-brazil"), function () { return chart; }, "gaia-brazil-vs-peers.png");
    },
  });
})();
