/* Task 1 — homepage occupation-exposure section, data-driven.
 * Loads data/gaia_occupations.csv via PapaParse and renders the top-5 / bottom-5
 * and a "familiar occupations" view from the RAW published E1+E2 (dv_rating_beta,
 * the Eloundou et al. 2024 β score). No hardcoded values. */
(function () {
  "use strict";
  if (typeof Papa === "undefined") return;

  var TEAL = "#0D9E76", BLUE = "#3B82F6", FAINT = "#96b2c8";
  // Familiar occupations to surface (matched against the data by title prefix).
  var FAMILIAR = [
    "Accountants and Auditors",
    "Paralegals and Legal Assistants",
    "Technical Writers",
    "Registered Nurses",
    "Plumbers, Pipefitters",
  ];

  function fmt(v) {
    // show exactly as published: integers plain, otherwise 1 decimal
    return (Math.round(v * 10) % 10 === 0 ? v.toFixed(0) : v.toFixed(1)) + "%";
  }

  function rowHTML(name, value, color) {
    var w = Math.max(1, Math.min(100, value)); // keep a sliver visible at 0
    return (
      '<div class="occ-row">' +
      '<div class="occ-name">' + name + "</div>" +
      '<div class="occ-bar-wrap">' +
      '<div class="occ-bar-bg"><div class="occ-bar-fill" data-w="' + w + '" style="width:0%;background:' + color + '"></div></div>' +
      '<div class="occ-pct" style="color:' + color + '">' + fmt(value) + "</div>" +
      "</div></div>"
    );
  }

  function render(rows) {
    var valid = rows
      .filter(function (r) { return r.Title && r.dv_rating_beta !== "" && !isNaN(parseFloat(r.dv_rating_beta)); })
      .map(function (r) { return { title: r.Title, beta: parseFloat(r.dv_rating_beta) }; });

    var byBeta = valid.slice().sort(function (a, b) { return b.beta - a.beta; });
    var top5 = byBeta.slice(0, 5); // highest published β first
    var bottom5 = byBeta.slice().reverse().slice(0, 5); // lowest published β first

    var topEl = document.getElementById("occ-top");
    var botEl = document.getElementById("occ-bottom");
    if (topEl) topEl.innerHTML = top5.map(function (o) { return rowHTML(o.title, o.beta, TEAL); }).join("");
    if (botEl) botEl.innerHTML = bottom5.map(function (o) { return rowHTML(o.title, o.beta, FAINT); }).join("");

    // familiar occupations — pull published values from data (no hardcoding)
    var famEl = document.getElementById("occ-familiar-rows");
    if (famEl) {
      famEl.innerHTML = FAMILIAR.map(function (name) {
        var m = valid.find(function (o) { return o.title.toLowerCase().indexOf(name.toLowerCase()) === 0; });
        return m ? rowHTML(m.title, m.beta, BLUE) : "";
      }).join("");
    }

    animateWhenVisible();
    wireToggle();
  }

  function animateWhenVisible() {
    var section = document.getElementById("occ-extremes");
    if (!section) return;
    var fired = false;
    function fill() {
      document.querySelectorAll("#occ-extremes .occ-bar-fill, #occ-familiar .occ-bar-fill").forEach(function (el) {
        el.style.width = el.getAttribute("data-w") + "%";
      });
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting && !fired) { fired = true; fill(); io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(section);
  }

  function wireToggle() {
    var tabE = document.getElementById("occ-tab-extremes");
    var tabF = document.getElementById("occ-tab-familiar");
    var gridE = document.getElementById("occ-extremes");
    var gridF = document.getElementById("occ-familiar");
    if (!tabE || !tabF) return;
    function show(which) {
      var fam = which === "familiar";
      gridE.style.display = fam ? "none" : "";
      gridF.style.display = fam ? "" : "none";
      tabE.classList.toggle("active", !fam); tabE.setAttribute("aria-selected", String(!fam));
      tabF.classList.toggle("active", fam); tabF.setAttribute("aria-selected", String(fam));
      // ensure the newly-shown bars fill
      (fam ? gridF : gridE).querySelectorAll(".occ-bar-fill").forEach(function (el) {
        el.style.width = el.getAttribute("data-w") + "%";
      });
    }
    tabE.addEventListener("click", function () { show("extremes"); });
    tabF.addEventListener("click", function () { show("familiar"); });
  }

  Papa.parse("data/gaia_occupations.csv", {
    download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) { render(res.data || []); },
    error: function () {
      var t = document.getElementById("occ-top");
      if (t) t.innerHTML = '<div class="occ-loading">Could not load occupation data.</div>';
    },
  });
})();
