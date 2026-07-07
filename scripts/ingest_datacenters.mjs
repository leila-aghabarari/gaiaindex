/* GAIA data-center coverage ingestion.
 * Pulls all `man_made=data_center` / `telecom=data_center` from OpenStreetMap
 * (Overpass), assigns each to a country by point-in-polygon, and writes
 * data/gaia_datacenters_osm.csv (the free coverage layer). Capacity is NOT in
 * OSM — the curated capacity layer (data/gaia_datacenters.csv) and the paid
 * registry carry MW/type/status.
 *
 * Run: node scripts/ingest_datacenters.mjs   (needs network; Node 18+ for fetch)
 */
import { writeFileSync } from "node:fs";

const OVERPASS = "https://overpass-api.de/api/interpreter";
const QUERY = `[out:json][timeout:180];(nwr["man_made"="data_center"];nwr["telecom"="data_center"];);out center tags;`;
const WORLD = "https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json";
const UA = "GAIA-research/1.0 (https://gaiaindex.org; research)";

function pip(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

const world = await (await fetch(WORLD, { headers: { "User-Agent": UA } })).json();
const bboxes = world.features.map((f) => {
  let mnx = 180, mny = 90, mxx = -180, mxy = -90;
  const g = f.geometry; if (!g) return { f, bb: null };
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const pt of poly[0]) { if (pt[0] < mnx) mnx = pt[0]; if (pt[0] > mxx) mxx = pt[0]; if (pt[1] < mny) mny = pt[1]; if (pt[1] > mxy) mxy = pt[1]; }
  return { f, bb: [mnx, mny, mxx, mxy] };
});
function countryOf(lon, lat) {
  for (const { f, bb } of bboxes) {
    if (!bb || lon < bb[0] || lon > bb[2] || lat < bb[1] || lat > bb[3]) continue;
    const g = f.geometry;
    if (g.type === "Polygon") { if (pip(lon, lat, g.coordinates[0])) return f; }
    else for (const poly of g.coordinates) if (pip(lon, lat, poly[0])) return f;
  }
  return null;
}

const osm = await (await fetch(OVERPASS, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "text/plain" }, body: QUERY })).json();
const HYPER = /amazon|aws|google|microsoft|azure|meta|facebook|oracle|alibaba|tencent|equinix|digital realty/;
const rows = [], seen = new Set();
let assigned = 0;
for (const e of osm.elements || []) {
  const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
  if (lat == null || lon == null) continue;
  const key = lat.toFixed(4) + "," + lon.toFixed(4);
  if (seen.has(key)) continue; seen.add(key);
  const t = e.tags || {};
  const f = countryOf(lon, lat); if (f) assigned++;
  const clean = (s) => (s || "").replace(/[,\n]/g, " ").trim();
  rows.push([clean(t.name || t.operator || "Data center").slice(0, 60), clean(t.operator).slice(0, 40),
    f ? f.id : "", f ? clean(f.properties?.name) : "", (+lat).toFixed(4), (+lon).toFixed(4),
    HYPER.test((t.operator || "").toLowerCase()) ? "hyperscale" : "colocation"].join(","));
}
writeFileSync("data/gaia_datacenters_osm.csv",
  "# OSM coverage layer (man_made/telecom=data_center). Real locations; capacity NOT in OSM.\n# Auto-ingested via Overpass; country by point-in-polygon.\nname,operator,iso3,country,lat,lng,type\n" + rows.join("\n") + "\n");
console.log(`Wrote ${rows.length} facilities (${assigned} country-assigned).`);
