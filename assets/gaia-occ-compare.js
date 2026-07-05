/* Task 11 — compare mode on occupations.html.
 * Checkboxes select up to 3 occupations; a sticky Compare button opens a
 * grouped bar chart of all measures side by side (labeled per the data-labeling
 * principle). Uses OCCS/IDX globals + the shared chart kit. */
(function () {
  "use strict";
  if (typeof Chart === "undefined" || !window.GAIA_CHART || typeof OCCS === "undefined" || typeof IDX === "undefined") return;
  var K = window.GAIA_CHART, C = K.colors;

  var byCode = {};
  OCCS.forEach(function (r) { byCode[r[IDX.code]] = r; });

  var sel = [];               // selected codes (max 3, ordered)
  var MAX = 3;
  var COLORS = [C.teal, C.blue, C.amber];
  var MEASURES = ["E1 (%)", "E1+E2 (%)", "GAIA-B", "GAIA-E (idx)", "Anthropic obs."];

  var btn = document.getElementById("cmpBtn");
  var modal = document.getElementById("cmpModal");
  var chart = null;

  function num(v) { v = parseFloat(v); return isNaN(v) ? null : v; }
  function valsFor(r) {
    return [
      num(r[IDX.dv_alpha]),                                            // E1 %
      num(r[IDX.dv_beta]),                                             // E1+E2 %
      num(r[IDX.sml]),                                                 // GAIA-B (SML)
      (r[IDX.gaia_e] != null && !isNaN(r[IDX.gaia_e])) ? +(r[IDX.gaia_e] * 100).toFixed(1) : null, // GAIA-E index pts
      num(r[IDX.aei_beta]),                                            // Anthropic observed (AI autonomy)
    ];
  }
  function updateBtn() {
    btn.textContent = "Compare (" + sel.length + ")";
    btn.hidden = sel.length < 2;
  }

  // selection via checkboxes (delegated change; enforce max 3)
  document.addEventListener("change", function (e) {
    var cb = e.target;
    if (!cb.classList || !cb.classList.contains("cmp-check")) return;
    var code = cb.getAttribute("data-code");
    if (cb.checked) {
      if (sel.length >= MAX) { cb.checked = false; return; }
      if (sel.indexOf(code) < 0) sel.push(code);
    } else {
      sel = sel.filter(function (c) { return c !== code; });
    }
    updateBtn();
  });

  // keep checkbox state in sync after table re-render (sort/filter)
  var tb = document.getElementById("tbody");
  if (tb && "MutationObserver" in window) {
    new MutationObserver(function () {
      tb.querySelectorAll(".cmp-check").forEach(function (cb) {
        cb.checked = sel.indexOf(cb.getAttribute("data-code")) >= 0;
      });
    }).observe(tb, { childList: true });
  }

  function open() {
    if (sel.length < 2) return;
    var datasets = sel.map(function (code, i) {
      var r = byCode[code];
      return {
        label: r[IDX.title], data: valsFor(r), backgroundColor: COLORS[i % COLORS.length],
        borderRadius: 3, barPercentage: 0.82, categoryPercentage: 0.72,
      };
    });
    document.getElementById("cmpSub").textContent = sel.map(function (c) { return byCode[c][IDX.title]; }).join("  ·  ");
    modal.hidden = false;
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("cmpChart").getContext("2d"), {
      type: "bar",
      data: { labels: MEASURES, datasets: datasets },
      options: K.baseOptions({
        plugins: { legend: { labels: { color: C.text, boxWidth: 12 } }, tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + (c.parsed.y == null ? "n/a" : c.parsed.y); } } } },
        scales: { y: { min: 0, max: 100, title: { display: true, text: "measure value (see note)", color: C.textDim } } },
      }),
    });
  }
  function close() { modal.hidden = true; }

  btn.addEventListener("click", open);
  document.getElementById("cmpClose").addEventListener("click", close);
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  updateBtn();
})();
