/* GAIA macro ingestion — World Bank WDI (public API).
 * Pulls the latest non-empty value per country for a handful of indicators that
 * give economic context to the AI-adoption/exposure picture, and writes
 * data/gaia_macro.csv keyed by iso3.
 *
 * Run: node scripts/ingest_macro.mjs   (needs network; Node 18+ for fetch)
 */
import { writeFileSync } from "node:fs";

const IND = {
  gdp_pc: "NY.GDP.PCAP.CD",          // GDP per capita, current US$
  gdp_usd: "NY.GDP.MKTP.CD",         // GDP, current US$
  services_pct_gdp: "NV.SRV.TOTL.ZS",// services, value added (% of GDP)
  tertiary_enroll: "SE.TER.ENRR",    // tertiary school enrollment (% gross)
  internet_pct: "IT.NET.USER.ZS",    // individuals using the internet (%)
};
const UA = "GAIA-research/1.0 (https://gaiaindex.org; research)";
const base = (code) => `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=400&mrnev=1`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchJson(code, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(base(code), { headers: { "User-Agent": UA, Accept: "application/json" } });
      const txt = await res.text();
      if (txt[0] === "<") throw new Error("XML/HTML error page");
      const j = JSON.parse(txt);
      if (!Array.isArray(j) || !j[1]) throw new Error("unexpected shape");
      return j[1];
    } catch (e) {
      if (i === tries - 1) { console.warn(`  ! ${code} failed after ${tries} tries: ${e.message}`); return []; }
      await sleep(1500 * (i + 1));
    }
  }
}

const rows = {}; // iso3 -> {country, ...values}
for (const [key, code] of Object.entries(IND)) {
  const data = await fetchJson(code);
  for (const d of data) {
    const iso = d.countryiso3code;
    if (!iso || iso.length !== 3 || d.value == null) continue;
    (rows[iso] || (rows[iso] = { country: d.country.value }))[key] = d.value;
  }
  console.log(`${key} (${code}): ${data.filter((d) => d.value != null).length} values`);
  await sleep(800); // be polite to the API
}

const cols = ["iso3", "country", ...Object.keys(IND)];
const clean = (s) => String(s).replace(/[,\n]/g, " ");
const round = (v) => (v == null ? "" : (Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(2)));
const body = Object.entries(rows).map(([iso, r]) =>
  [iso, clean(r.country), ...Object.keys(IND).map((k) => round(r[k]))].join(",")).join("\n");
writeFileSync("data/gaia_macro.csv",
  "# World Bank WDI — latest non-empty value per country (mrnev). Public API.\n" + cols.join(",") + "\n" + body + "\n");
console.log(`Wrote ${Object.keys(rows).length} economies to data/gaia_macro.csv`);
