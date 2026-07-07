/* GAIA Country AI-Economy Briefing — templated, data-driven, one per country.
 * Reads ?iso=XXX (default USA), renders scorecard, adoption, readiness, compute,
 * and auto-generated takeaways from the country data + data-center layers.
 * This is the FREE briefing; the commissioned report is the gated product. */
(function () {
  "use strict";
  if (typeof Papa === "undefined" || typeof Chart === "undefined" || !window.GAIA_CHART) return;
  var K = window.GAIA_CHART, C = K.colors;

  var countries = [], byIso = {}, rank = {}, gAvg = {}, osmCount = {}, curated = {};
  var charts = {};
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function mean(field) { var s = 0, n = 0; countries.forEach(function (r) { var v = num(r[field]); if (v != null) { s += v; n++; } }); return n ? s / n : 0; }
  function destroy() { Object.keys(charts).forEach(function (k) { if (charts[k]) charts[k].destroy(); }); charts = {}; }

  var COLLAB = [["Directive", "collab_directive"], ["Task iter.", "collab_task_iteration"], ["Learning", "collab_learning"], ["Feedback", "collab_feedback_loop"], ["Validation", "collab_validation"]];
  var AIPI = [["Digital infra", "aipi_digital_infra"], ["Human capital", "aipi_human_capital"], ["Innovation", "aipi_innovation"], ["Regulation", "aipi_regulation"]];

  function scoreCard(r) {
    var el = document.getElementById("b-score"); if (!el) return;
    var iso = r.iso3, cards = [
      ["#" + (rank[iso] || "—"), "Global adoption rank"],
      [(num(r.uc_work) != null ? num(r.uc_work).toFixed(0) + "%" : "—"), "Work-related use"],
      [(num(r.gaia_a) != null ? num(r.gaia_a).toFixed(3) : "—"), "GAIA-A (adoption)"],
      [(num(r.aipi_overall) != null ? num(r.aipi_overall).toFixed(2) : "—"), "IMF AI-preparedness"],
      [(osmCount[iso] || 0).toLocaleString(), "Data-center facilities"],
    ];
    el.innerHTML = cards.map(function (c) { return '<div class="sc"><div class="v">' + c[0] + '</div><div class="l">' + c[1] + '</div></div>'; }).join("");
  }

  function useCaseChart(r) {
    charts.uc = new Chart(document.getElementById("c-usecase"), {
      type: "bar",
      data: { labels: ["Work", "Personal", "Coursework"], datasets: [
        { label: r.country_name, data: [num(r.uc_work), num(r.uc_personal), num(r.uc_coursework)], backgroundColor: C.teal, borderRadius: 4 },
        { label: "Global avg", data: [gAvg.uc_work, gAvg.uc_personal, gAvg.uc_coursework], backgroundColor: "#39506180", borderRadius: 4 },
      ] },
      options: K.baseOptions({ plugins: { legend: { labels: { color: C.text, boxWidth: 11, font: { size: 10 } } } }, scales: { y: { min: 0, ticks: { callback: function (v) { return v + "%"; } } } } }),
    });
  }
  function collabChart(r) {
    charts.cl = new Chart(document.getElementById("c-collab"), {
      type: "bar",
      data: { labels: COLLAB.map(function (m) { return m[0]; }), datasets: [
        { label: r.country_name, data: COLLAB.map(function (m) { return num(r[m[1]]); }), backgroundColor: C.blue, borderRadius: 4 },
        { label: "Global avg", data: COLLAB.map(function (m) { return gAvg[m[1]]; }), backgroundColor: "#39506180", borderRadius: 4 },
      ] },
      options: K.baseOptions({ plugins: { legend: { labels: { color: C.text, boxWidth: 11, font: { size: 10 } } } }, scales: { y: { min: 0, ticks: { callback: function (v) { return v + "%"; } } } } }),
    });
  }
  function aipiChart(r) {
    charts.ai = new Chart(document.getElementById("c-aipi"), {
      type: "radar",
      data: { labels: AIPI.map(function (m) { return m[0]; }), datasets: [
        { label: r.country_name, data: AIPI.map(function (m) { return num(r[m[1]]); }), borderColor: C.teal, backgroundColor: "rgba(13,158,118,.2)", pointBackgroundColor: C.teal },
        { label: "Global avg", data: AIPI.map(function (m) { return gAvg[m[1]]; }), borderColor: "#8AA0B6", backgroundColor: "rgba(138,160,182,.12)", pointBackgroundColor: "#8AA0B6" },
      ] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: C.text, boxWidth: 11, font: { size: 10 } } } },
        scales: { r: { min: 0, max: 1, angleLines: { color: C.grid }, grid: { color: C.grid }, pointLabels: { color: C.textDim, font: { size: 10 } }, ticks: { display: false } } } },
    });
  }
  function quadChart(r) {
    var pts = countries.map(function (c) { return { x: num(c.aipi_overall), y: num(c.gaia_a), iso: c.iso3 }; }).filter(function (p) { return p.x != null && p.y != null; });
    var me = pts.filter(function (p) { return p.iso === r.iso3; });
    charts.q = new Chart(document.getElementById("c-quad"), {
      type: "scatter",
      data: { datasets: [
        { label: "All countries", data: pts, backgroundColor: "rgba(13,158,118,.35)", pointRadius: 3 },
        { label: r.country_name, data: me, backgroundColor: C.amber, borderColor: "#fff", borderWidth: 1, pointRadius: 7 },
      ] },
      options: K.baseOptions({ plugins: { legend: { labels: { color: C.text, boxWidth: 11, font: { size: 10 } } }, tooltip: { callbacks: { label: function (c) { return c.raw.iso + " (" + c.parsed.x.toFixed(2) + ", " + c.parsed.y.toFixed(2) + ")"; } } } },
        scales: { x: { title: { display: true, text: "IMF AI-preparedness", color: C.textDim } }, y: { title: { display: true, text: "GAIA-A adoption", color: C.textDim } } } }),
    });
  }

  function infra(r) {
    var iso = r.iso3, cur = curated[iso] || { op: 0, ann: 0, top: "—" }, facs = osmCount[iso] || 0;
    document.getElementById("b-infra").innerHTML = [
      ['<div class="im"><div class="v">' + facs.toLocaleString() + '</div><div class="l">Facilities (OSM)</div></div>'],
      ['<div class="im"><div class="v">' + cur.op.toLocaleString() + '</div><div class="l">Named operational MW</div></div>'],
      ['<div class="im"><div class="v">' + cur.ann.toLocaleString() + '</div><div class="l">Announced MW</div></div>'],
      ['<div class="im"><div class="v">' + (cur.top || "—") + '</div><div class="l">Top hub</div></div>'],
    ].join("");
    var rk = rank[iso], sig;
    if (rk && rk <= 30 && cur.op < 400) sig = "⚠ High AI adoption with limited domestic operational compute — potential dependency exposure.";
    else if (cur.op >= 1000 && rk && rk <= 30) sig = "Compute and adoption broadly aligned — significant domestic capacity.";
    else if (facs === 0) sig = "No mapped facilities — hosting is likely offshore.";
    else sig = "Mixed profile — full dependency index in the commissioned report.";
    document.getElementById("b-signal").textContent = sig;
  }

  function takeaways(r) {
    var iso = r.iso3, t = [], rk = rank[iso], work = num(r.uc_work), inc = r.income_group || "its income group";
    if (rk) t.push("<b>#" + rk + " globally</b> by AI-usage share" + (work != null ? ", with use skewing " + (work >= 45 ? "strongly toward work (" + work.toFixed(0) + "%)" : work <= 30 ? "toward personal/learning" : "evenly across work and personal") : "") + ".");
    // weakest readiness link
    var weak = null, wv = 2; AIPI.forEach(function (m) { var v = num(r[m[1]]); if (v != null && v < wv) { wv = v; weak = m[0]; } });
    var ov = num(r.aipi_overall), medAipi = median("aipi_overall");
    if (ov != null) t.push("AI-preparedness is <b>" + (ov >= medAipi ? "above" : "below") + " the global median</b>" + (weak ? " — weakest link: <b>" + weak.toLowerCase() + "</b>." : "."));
    // compute dependency
    var cur = curated[iso] || { op: 0 };
    if (rk && rk <= 40 && cur.op < 400) t.push("Heavy AI use but <b>limited domestic compute</b> — a strategic dependency to watch.");
    else if (cur.op >= 1000) t.push("Backed by <b>substantial domestic compute</b> (" + cur.op.toLocaleString() + "+ MW named capacity).");
    // exposure
    var bx = num(r.bartik_exposure);
    if (bx != null) { var bxr = countries.map(function (c) { return num(c.bartik_exposure); }).filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; }); var pct = Math.round(100 * bxr.filter(function (v) { return v < bx; }).length / bxr.length); t.push("Workforce AI exposure sits at the <b>" + ord(pct) + " percentile</b> globally."); }
    document.getElementById("b-takeaways").innerHTML = t.slice(0, 4).map(function (x) { return "<li>" + x + "</li>"; }).join("");
  }
  function ord(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function median(field) { var a = countries.map(function (c) { return num(c[field]); }).filter(function (v) { return v != null; }).sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor(a.length / 2)] : 0; }

  function render(iso) {
    var r = byIso[iso]; if (!r) return;
    document.getElementById("b-name").textContent = r.country_name;
    document.getElementById("b-sub").textContent = (r.income_group || "") + " income · " + (num(r.usage_pct_global) != null ? num(r.usage_pct_global).toFixed(2) + "% of global Claude.ai use" : "");
    destroy();
    scoreCard(r); useCaseChart(r); collabChart(r); aipiChart(r); quadChart(r); infra(r); takeaways(r);
    history.replaceState(null, "", "country.html?iso=" + iso);
    var sel = document.getElementById("brief-country"); if (sel) sel.value = iso;
    var cc = document.getElementById("commission-cta");
    if (cc) cc.href = "mailto:aghabarari.leila@gmail.com?subject=" + encodeURIComponent("GAIA Country Report enquiry — " + r.country_name);
  }

  function loadCsv(url, cb) { Papa.parse(url, { download: true, header: true, comments: "#", skipEmptyLines: true, complete: function (r) { cb(r.data || []); }, error: function () { cb([]); } }); }

  loadCsv("data/gaia_countries.csv", function (rows) {
    countries = rows.filter(function (r) { return r.iso3; });
    countries.forEach(function (r) { byIso[r.iso3] = r; });
    countries.filter(function (r) { return num(r.usage_pct_global) != null; }).sort(function (a, b) { return num(b.usage_pct_global) - num(a.usage_pct_global); }).forEach(function (r, i) { rank[r.iso3] = i + 1; });
    ["uc_work", "uc_personal", "uc_coursework"].concat(COLLAB.map(function (m) { return m[1]; })).concat(AIPI.map(function (m) { return m[1]; })).forEach(function (f) { gAvg[f] = mean(f); });

    loadCsv("data/gaia_datacenters.csv", function (dc) {
      dc.forEach(function (d) { var o = curated[d.iso3] || (curated[d.iso3] = { op: 0, ann: 0, top: null, topmw: 0 }); var mw = num(d.capacity_mw) || 0; if (d.status === "operational") o.op += mw; else o.ann += mw; if (mw > o.topmw) { o.topmw = mw; o.top = d.city; } });
      loadCsv("data/gaia_datacenters_osm.csv", function (osm) {
        osm.forEach(function (d) { if (d.iso3) osmCount[d.iso3] = (osmCount[d.iso3] || 0) + 1; });
        // populate selector
        var sel = document.getElementById("brief-country");
        if (sel) {
          countries.slice().sort(function (a, b) { return (a.country_name || "").localeCompare(b.country_name || ""); })
            .forEach(function (r) { var o = document.createElement("option"); o.value = r.iso3; o.textContent = r.country_name; sel.appendChild(o); });
          sel.addEventListener("change", function () { if (sel.value) render(sel.value); });
        }
        var want = new URLSearchParams(location.search).get("iso");
        render(byIso[want] ? want : "USA");
      });
    });
  });
})();
