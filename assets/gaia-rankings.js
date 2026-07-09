/* GAIA rankings — sortable league table merging adoption, readiness, innovation,
 * energy and compute per country. Free engagement/funnel layer; the composite
 * index and methodology are the paid report. PapaParse. */
(function () {
  "use strict";
  if (typeof Papa === "undefined") return;
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function load(url, cb) { Papa.parse(url, { download: true, header: true, comments: "#", skipEmptyLines: true, complete: function (r) { cb(r.data || []); }, error: function () { cb([]); } }); }

  var rows = [], view = [], sortK = "usage", sortDir = -1;

  function fmt(v, k) {
    if (v == null) return '<span class="na">—</span>';
    if (k === "usage" || k === "rd") return v.toFixed(2);
    if (k === "gaia_a" || k === "aipi") return v.toFixed(3);
    if (k === "patents" || k === "dc") return Math.round(v).toLocaleString();
    if (k === "elec") return Math.round(v).toLocaleString();
    return v;
  }
  function render() {
    var q = (document.getElementById("rk-search").value || "").toLowerCase();
    var inc = document.getElementById("rk-income").value;
    view = rows.filter(function (r) { return (!q || r.name.toLowerCase().indexOf(q) >= 0) && (!inc || r.income === inc); });
    view.sort(function (a, b) {
      var x = a[sortK], y = b[sortK];
      if (x == null && y == null) return 0;
      if (x == null) return 1; if (y == null) return -1; // NAs last
      if (sortK === "name") return sortDir * String(x).localeCompare(String(y));
      return sortDir * (x - y);
    });
    var body = view.map(function (r, i) {
      return '<tr><td class="rk-num">' + (i + 1) + '</td>' +
        '<td class="txt rk-name"><a href="country.html?iso=' + r.iso + '">' + r.name + '</a><span class="rk-inc">' + (r.income || "") + '</span></td>' +
        '<td>' + fmt(r.usage, "usage") + '</td><td>' + fmt(r.gaia_a, "gaia_a") + '</td><td>' + fmt(r.aipi, "aipi") + '</td>' +
        '<td>' + fmt(r.rd, "rd") + '</td><td>' + fmt(r.patents, "patents") + '</td><td>' + fmt(r.elec, "elec") + '</td><td>' + fmt(r.dc, "dc") + '</td></tr>';
    }).join("");
    document.getElementById("rk-body").innerHTML = body;
    document.getElementById("rk-count").textContent = view.length + " countries";
    document.querySelectorAll("th[data-k]").forEach(function (th) { th.classList.toggle("sorted", th.getAttribute("data-k") === sortK); });
  }

  load("data/gaia_countries.csv", function (c) {
    var byIso = {};
    c.forEach(function (r) { if (r.iso3) byIso[r.iso3] = { iso: r.iso3, name: r.country_name || r.iso3, income: r.income_group || "", usage: num(r.usage_pct_global), gaia_a: num(r.gaia_a), aipi: num(r.aipi_overall), rd: null, patents: null, elec: null, dc: 0 }; });
    load("data/gaia_innovation.csv", function (inv) {
      inv.forEach(function (x) { if (byIso[x.iso3]) { byIso[x.iso3].rd = num(x.rd_pct_gdp); byIso[x.iso3].patents = num(x.patents_resident); } });
      load("data/gaia_energy.csv", function (en) {
        en.forEach(function (x) { if (byIso[x.iso3]) byIso[x.iso3].elec = num(x.elec_demand_twh); });
        load("data/gaia_datacenters_osm.csv", function (dc) {
          dc.forEach(function (x) { if (x.iso3 && byIso[x.iso3]) byIso[x.iso3].dc++; });
          rows = Object.values(byIso);
          // income filter options
          var incs = {}; rows.forEach(function (r) { if (r.income) incs[r.income] = 1; });
          var sel = document.getElementById("rk-income");
          Object.keys(incs).sort().forEach(function (i) { var o = document.createElement("option"); o.value = i; o.textContent = i + " income"; sel.appendChild(o); });
          // sort handlers
          document.querySelectorAll("th[data-k]").forEach(function (th) {
            th.addEventListener("click", function () {
              var k = th.getAttribute("data-k");
              if (sortK === k) sortDir = -sortDir; else { sortK = k; sortDir = k === "name" ? 1 : -1; }
              render();
            });
          });
          document.getElementById("rk-search").addEventListener("input", render);
          sel.addEventListener("change", render);
          render();
        });
      });
    });
  });
})();
