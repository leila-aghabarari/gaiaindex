/* GAIA innovation/capability ingestion — World Bank WDI (public API).
 * The "capital & capability" dimension, per country: R&D intensity, research
 * workforce, patents, and high-tech exports. AI-specific investment (Stanford
 * HAI) only covers a handful of economies, so these WDI proxies give universal
 * coverage. Writes data/gaia_innovation.csv keyed by iso3.
 *
 * Run: node scripts/ingest_innovation.mjs   (needs network; Node 18+)
 */
import { writeFileSync } from "node:fs";

const IND = {
  rd_pct_gdp: "GB.XPD.RSDV.GD.ZS",        // R&D expenditure (% of GDP)
  researchers_per_m: "SP.POP.SCIE.RD.P6", // researchers in R&D (per million people)
  patents_resident: "IP.PAT.RESD",        // patent applications, residents
  hitech_exports_pct: "TX.VAL.TECH.MF.ZS",// high-technology exports (% of manufactured exports)
};
const UA = "GAIA-research/1.0 (https://gaiaindex.org; research)";
const base = (code) => `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=400&mrnev=1`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(code, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(base(code), { headers: { "User-Agent": UA, Accept: "application/json" } });
      const txt = await res.text();
      if (txt[0] === "<") throw new Error("XML/HTML error page");
      const j = JSON.parse(txt);
      if (!Array.isArray(j) || !j[1]) throw new Error("unexpected shape");
      return j[1];
    } catch (e) {
      if (i === tries - 1) { console.warn(`  ! ${code} failed: ${e.message}`); return []; }
      await sleep(1800 * (i + 1));
    }
  }
}

const rows = {};
for (const [key, code] of Object.entries(IND)) {
  const data = await fetchJson(code);
  for (const d of data) {
    const iso = d.countryiso3code;
    if (!iso || iso.length !== 3 || d.value == null) continue;
    (rows[iso] || (rows[iso] = { country: d.country.value }))[key] = d.value;
  }
  console.log(`${key}: ${data.filter((d) => d.value != null).length} values`);
  await sleep(1000);
}

const cols = ["iso3", "country", ...Object.keys(IND)];
const clean = (s) => String(s).replace(/[,\n]/g, " ");
const round = (v) => (v == null ? "" : (Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(2)));
const body = Object.entries(rows).map(([iso, r]) =>
  [iso, clean(r.country), ...Object.keys(IND).map((k) => round(r[k]))].join(",")).join("\n");
writeFileSync("data/gaia_innovation.csv",
  "# World Bank WDI — innovation/capability, latest non-empty value per country (mrnev).\n" + cols.join(",") + "\n" + body + "\n");
console.log(`Wrote ${Object.keys(rows).length} economies to data/gaia_innovation.csv`);
