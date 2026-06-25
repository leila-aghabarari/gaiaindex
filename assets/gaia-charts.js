/* ============================================================================
   GAIA shared Chart.js defaults — load AFTER chart.umd.min.js, BEFORE the
   page's inline chart scripts. Makes every chart legible and consistent
   (fonts, muted gridlines, unified tooltip) without editing each chart config.
   Reads the page's own CSS tokens so it matches whatever theme the page uses.
   ============================================================================ */
(function () {
  if (typeof Chart === "undefined") return;

  var css = getComputedStyle(document.documentElement);
  var tok = function (name, fallback) {
    var v = css.getPropertyValue(name).trim();
    return v || fallback;
  };

  var text   = tok("--text", "#1a2635");
  var muted  = tok("--muted", "#5b7a96");
  var faint  = tok("--faint", "#96b2c8");
  var border = tok("--border", "#dde6f0");
  var card   = tok("--card", "#ffffff");

  Chart.defaults.font.family =
    "'Inter', system-ui, -apple-system, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = muted;

  // Legends: readable, top-aligned, with rounded swatches.
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.legend.labels.boxHeight = 8;
  Chart.defaults.plugins.legend.labels.padding = 14;
  Chart.defaults.plugins.legend.labels.color = text;

  // One consistent, high-contrast tooltip everywhere.
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: text,
    titleColor: card,
    bodyColor: card,
    borderColor: border,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    boxPadding: 6,
    usePointStyle: true,
  });

  // Quiet gridlines + faint ticks so the data — not the grid — reads first.
  if (Chart.defaults.scales) {
    ["linear", "category", "logarithmic", "time", "radialLinear"].forEach(
      function (k) {
        var s = Chart.defaults.scales[k];
        if (!s) return;
        s.grid = Object.assign(s.grid || {}, {
          color: border,
          drawBorder: false,
        });
        s.ticks = Object.assign(s.ticks || {}, { color: faint });
      }
    );
  }

  /* Helper for inline scripts: append a unit to axis ticks.
     Usage in a scale: ticks: { callback: GAIA.unit('%') }  ->  "34%" */
  window.GAIA = window.GAIA || {};
  window.GAIA.unit = function (suffix, prefix) {
    prefix = prefix || "";
    return function (value) {
      return prefix + value + (suffix || "");
    };
  };
})();
