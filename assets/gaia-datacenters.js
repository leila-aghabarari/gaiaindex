/* GAIA — Compute & Infrastructure map.
 * Two layers: (1) real OSM coverage (4,300+ facilities, ingested via Overpass) as
 * faint canvas dots; (2) curated capacity layer (notable hubs + frontier AI
 * clusters, sized/colored by MW/type/status). Both over a country choropleth
 * shaded by GAIA adoption. Decision-grade cross-analysis stays locked. */
(function () {
  "use strict";
  if (typeof L === "undefined" || typeof Papa === "undefined") return;

  var TYPE = {
    ai_cluster: { label: "AI / frontier cluster", color: "#0D9E76" },
    hyperscale: { label: "Hyperscale", color: "#3B82F6" },
    colocation: { label: "Colocation / market", color: "#F59E0B" },
    enterprise: { label: "Enterprise", color: "#8AA0B6" },
  };
  function radius(mw) { return mw <= 100 ? 5 : mw <= 400 ? 7 : mw <= 1000 ? 9 : mw <= 1800 ? 12 : 15; }
  function bandOf(mw) { return mw <= 100 ? "≤100" : mw <= 400 ? "100–400" : mw <= 1000 ? "400–1,000" : mw <= 1800 ? "1,000–1,800" : "1,800+"; }
  function adoptColor(v) { return v > 8 ? "#5fe0bd" : v > 3 ? "#22b98c" : v > 1 ? "#0D9E76" : v > 0.5 ? "#0e6f56" : v > 0.1 ? "#123f37" : "#0f2830"; }

  var map = L.map("dc-map", { worldCopyJump: true, minZoom: 2, maxZoom: 8, scrollWheelZoom: true, preferCanvas: true }).setView([25, 12], 2);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO · facilities: OSM · capacity layer: GAIA (illustrative)", subdomains: "abcd", maxZoom: 8,
  }).addTo(map);

  var osmCanvas = L.canvas({ padding: 0.5 });
  var osmLayer = L.layerGroup().addTo(map);
  var curatedLayer = L.layerGroup().addTo(map);

  var dcRows = [], osmRows = [], ctyByIso = {}, rollup = {}, osmCount = {}, adoptionRank = {};

  function buildRollup() {
    dcRows.forEach(function (r) {
      var o = rollup[r.iso3] || (rollup[r.iso3] = { op: 0, ann: 0, top: null, topmw: 0, ai: 0 });
      if (r.status === "operational") o.op += r.mw; else o.ann += r.mw;
      if (r.type === "ai_cluster") o.ai++;
      if (r.mw > o.topmw) { o.topmw = r.mw; o.top = r.city; }
    });
    osmRows.forEach(function (r) { if (r.iso3) osmCount[r.iso3] = (osmCount[r.iso3] || 0) + 1; });
  }

  function drawMarkers(filter) {
    osmLayer.clearLayers(); curatedLayer.clearLayers();
    if (filter !== "ai") {
      osmRows.forEach(function (r) {
        L.circleMarker([r.lat, r.lng], { renderer: osmCanvas, radius: 2, stroke: false, fillColor: "#6f8698", fillOpacity: 0.5 })
          .bindPopup('<div style="font:12px Inter,sans-serif;color:#e6f2ee"><b>' + r.name + "</b><br><span style=\"color:#9fb3c2\">" + (r.operator || "facility") + " · " + r.country + " · OSM</span></div>")
          .addTo(osmLayer);
      });
    }
    dcRows.forEach(function (r) {
      if (filter === "ai" && r.type !== "ai_cluster") return;
      var t = TYPE[r.type] || TYPE.enterprise, op = r.status === "operational";
      L.circleMarker([r.lat, r.lng], { radius: radius(r.mw), color: t.color, weight: op ? 1 : 1.5, fillColor: t.color, fillOpacity: op ? 0.85 : 0.28, dashArray: op ? null : "3" })
        .bindPopup('<div style="font:13px/1.5 Inter,sans-serif;color:#e6f2ee"><b>' + r.name + "</b><br>" + (r.operator || "") + " · " + r.city + ", " + r.country +
          "<br><span style=\"color:#9fb3c2\">" + t.label + " · " + r.status + " · ~" + bandOf(r.mw) + " MW (approx)</span></div>")
        .addTo(curatedLayer);
    });
  }

  function showCountry(iso3) {
    var panel = document.getElementById("dc-panel"); if (!panel) return;
    var cty = ctyByIso[iso3], roll = rollup[iso3] || { op: 0, ann: 0, top: "—" };
    var name = (cty && cty.country_name) || iso3;
    var usage = cty ? parseFloat(cty.usage_pct_global) : NaN, rank = adoptionRank[iso3];
    var facs = osmCount[iso3] || 0;
    var signal;
    if (!isNaN(usage) && rank && rank <= 30 && roll.op < 400) signal = "⚠ High AI adoption, limited domestic operational compute — potential dependency exposure.";
    else if (roll.op >= 1000 && rank && rank <= 30) signal = "Compute and adoption broadly aligned — significant domestic capacity.";
    else if (roll.op === 0 && facs > 0) signal = "Facilities present but no large-capacity sites in the capacity layer — hosting may be smaller-scale or offshore.";
    else if (facs === 0) signal = "No mapped facilities — hosting is likely offshore.";
    else signal = "Mixed profile — see the full dependency index in the Country Report.";
    panel.innerHTML =
      '<div class="dc-panel-head"><span class="dc-flag">' + (roll.op > 0 ? "▮" : "▯") + '</span><div>' +
      '<p class="dc-cty-name">' + name + '</p><p class="dc-cty-sub">' +
      (isNaN(usage) ? "adoption n/a" : usage.toFixed(2) + "% of global Claude.ai use" + (rank ? " · #" + rank : "")) + '</p></div></div>' +
      '<div class="dc-metrics">' +
        '<div class="dc-metric"><span class="dc-m-val">' + facs.toLocaleString() + '</span><span class="dc-m-lbl">Facilities (OSM)</span></div>' +
        '<div class="dc-metric"><span class="dc-m-val">' + roll.op.toLocaleString() + '</span><span class="dc-m-lbl">Named operational MW</span></div>' +
        '<div class="dc-metric"><span class="dc-m-val">' + roll.ann.toLocaleString() + '</span><span class="dc-m-lbl">Announced MW</span></div>' +
        '<div class="dc-metric"><span class="dc-m-val">' + (roll.top || "—") + '</span><span class="dc-m-lbl">Top hub</span></div>' +
      '</div><p class="dc-signal">' + signal + '</p>' +
      '<div class="dc-locked">' + lockCard("Compute-dependency rank") + lockCard("Energy load vs. grid headroom") + lockCard("Net-fiscal on incentives") + '</div>' +
      '<a class="dc-cta" href="about.html#contact">Unlock the full ' + name + ' compute report →</a>';
  }
  function lockCard(t) { return '<div class="dc-lock"><span class="dc-lock-ico">🔒</span><span class="dc-lock-t">' + t + '</span><span class="dc-lock-blur">▓▓ ▓▓▓ ▓▓</span></div>'; }

  function headline() {
    var op = 0, ann = 0, ai = 0, ctys = {};
    dcRows.forEach(function (r) { if (r.status === "operational") op += r.mw; else ann += r.mw; if (r.type === "ai_cluster") ai++; });
    osmRows.forEach(function (r) { if (r.iso3) ctys[r.iso3] = 1; });
    set("hl-fac", osmRows.length.toLocaleString()); set("hl-op", Math.round(op).toLocaleString());
    set("hl-ann", Math.round(ann).toLocaleString()); set("hl-ctys", Object.keys(ctys).length); set("hl-ai", ai);
  }
  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

  function drawChoropleth() {
    fetch("https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (geo) {
        L.geoJSON(geo, {
          style: function (f) { var c = ctyByIso[f.id], v = c ? parseFloat(c.usage_pct_global) : 0; return { fillColor: adoptColor(isNaN(v) ? 0 : v), weight: 0.5, color: "#24333f", fillOpacity: 0.5 }; },
          onEachFeature: function (f, layer) {
            layer.on({ click: function () { showCountry(f.id); },
              mouseover: function (e) { e.target.setStyle({ weight: 1.5, color: "#0D9E76" }); },
              mouseout: function (e) { e.target.setStyle({ weight: 0.5, color: "#24333f" }); } });
          },
        }).addTo(map).bringToBack();
      })
      .catch(function () { var n = document.getElementById("dc-choro-note"); if (n) n.textContent = "(Adoption shading unavailable — map shows facilities only.)"; });
  }

  function loadOsm(then) {
    Papa.parse("data/gaia_datacenters_osm.csv", { download: true, header: true, comments: "#", skipEmptyLines: true,
      complete: function (res) {
        osmRows = (res.data || []).map(function (r) { return { name: r.name, operator: r.operator, iso3: r.iso3, country: r.country, lat: parseFloat(r.lat), lng: parseFloat(r.lng) }; })
          .filter(function (r) { return !isNaN(r.lat) && !isNaN(r.lng); });
        then();
      },
      error: then, // graceful: curated layer still works if OSM file missing
    });
  }

  Papa.parse("data/gaia_countries.csv", { download: true, header: true, comments: "#", skipEmptyLines: true,
    complete: function (res) {
      var rows = (res.data || []).filter(function (r) { return r.iso3; });
      rows.forEach(function (r) { ctyByIso[r.iso3] = r; });
      rows.filter(function (r) { return !isNaN(parseFloat(r.usage_pct_global)); })
        .sort(function (a, b) { return parseFloat(b.usage_pct_global) - parseFloat(a.usage_pct_global); })
        .forEach(function (r, i) { adoptionRank[r.iso3] = i + 1; });

      Papa.parse("data/gaia_datacenters.csv", { download: true, header: true, comments: "#", skipEmptyLines: true,
        complete: function (res2) {
          dcRows = (res2.data || []).map(function (r) { return { name: r.name, operator: r.operator, city: r.city, country: r.country, iso3: r.iso3, lat: parseFloat(r.lat), lng: parseFloat(r.lng), type: r.type, status: r.status, mw: parseFloat(r.capacity_mw) || 0 }; })
            .filter(function (r) { return !isNaN(r.lat) && !isNaN(r.lng); });

          loadOsm(function () {
            buildRollup(); headline(); drawChoropleth(); drawMarkers("all");
            var sel = document.getElementById("dc-country");
            if (sel) {
              Object.keys(osmCount).concat(Object.keys(rollup)).filter(function (v, i, a) { return a.indexOf(v) === i; })
                .sort(function (a, b) { return ((ctyByIso[a] && ctyByIso[a].country_name) || a).localeCompare((ctyByIso[b] && ctyByIso[b].country_name) || b); })
                .forEach(function (iso) { var o = document.createElement("option"); o.value = iso; o.textContent = (ctyByIso[iso] && ctyByIso[iso].country_name) || iso; sel.appendChild(o); });
              sel.addEventListener("change", function () { if (sel.value) showCountry(sel.value); });
            }
            document.querySelectorAll("[data-dc-filter]").forEach(function (b) {
              b.addEventListener("click", function () { document.querySelectorAll("[data-dc-filter]").forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); drawMarkers(b.getAttribute("data-dc-filter")); });
            });
            showCountry("USA");
          });
        },
      });
    },
  });
})();
