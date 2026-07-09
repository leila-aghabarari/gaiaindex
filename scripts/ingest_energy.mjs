/* GAIA energy ingestion — national electricity demand per country.
 * Source: Our World in Data energy dataset (Ember/EI-based), free & open.
 * Writes data/gaia_energy.csv (iso3, country, elec_demand_twh, year). This is
 * the REAL denominator; data-centre electricity is a separate curated/estimated
 * layer (data/gaia_dc_energy.csv) — kept apart per honesty discipline.
 *
 * Run: node scripts/ingest_energy.mjs   (needs network; Node 18+)
 */
import { writeFileSync } from "node:fs";

const URL = "https://cdn.jsdelivr.net/gh/owid/energy-data@master/owid-energy-data.csv";
const txt = await (await fetch(URL, { headers: { "User-Agent": "GAIA-research/1.0 (https://gaiaindex.org)" } })).text();
const lines = txt.split(/\r?\n/);
const H = lines[0].split(",");
const iI = H.indexOf("iso_code"), yI = H.indexOf("year"), cI = H.indexOf("country"), dI = H.indexOf("electricity_demand");

const latest = {};
for (let i = 1; i < lines.length; i++) {
  const p = lines[i].split(",");
  const iso = p[iI], yr = +p[yI], d = parseFloat(p[dI]);
  if (iso && iso.length === 3 && !isNaN(d)) {
    if (!latest[iso] || yr > latest[iso].yr) latest[iso] = { yr, d, country: p[cI] };
  }
}
const body = Object.entries(latest).map(([iso, r]) =>
  [iso, String(r.country).replace(/[,\n]/g, " "), r.d.toFixed(1), r.yr].join(",")).join("\n");
writeFileSync("data/gaia_energy.csv",
  "# National electricity demand (TWh). Source: Our World in Data / Ember. Latest year per country.\niso3,country,elec_demand_twh,year\n" + body + "\n");
console.log(`Wrote ${Object.keys(latest).length} countries to data/gaia_energy.csv`);
