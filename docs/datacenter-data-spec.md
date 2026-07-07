# GAIA — Data Center / Compute Infrastructure data spec

Purpose: power a **free** map + teaser layer on gaiaindex.org that establishes
credibility and demand, while keeping decision-grade detail and cross-analysis in
the **paid** GAIA Country Reports / dataset. Split below is deliberate.

Guiding rule: **free = locations + aggregates + the *existence* of deeper cuts
(shown but locked). Paid = the granular, act-on-it detail and GAIA's
cross-analysis.**

---

## 1. Facility registry — `gaia_datacenters.csv`

One row per facility/campus (or, where facility data is unavailable, a market
cluster clearly flagged as such).

| field | type | free? | notes |
|---|---|---|---|
| `name` | string | ✅ free | facility / campus / market name |
| `operator` | string | ✅ free (coarse) | "Multiple" for market clusters; **exact tenant mix is paid** |
| `city` | string | ✅ free | |
| `country`, `iso3` | string | ✅ free | ISO-3166 alpha-3 → joins to `gaia_countries.csv` |
| `lat`, `lng` | float | ✅ free | approximate on free; precise/parcel-level is paid |
| `type` | enum | ✅ free | `ai_cluster` \| `hyperscale` \| `colocation` \| `enterprise` |
| `status` | enum | ✅ free | `operational` \| `construction` \| `announced` \| `paused` |
| `capacity_mw` | float | ✅ free (banded) | free shows **capacity band**; exact MW is paid |
| `capacity_mw_exact` | float | 🔒 paid | verified IT capacity |
| `commissioned_year` | int | 🔒 paid | |
| `pipeline_mw` | float | 🔒 paid | announced expansion beyond current |
| `power_source` | string | 🔒 paid | grid / on-site gas / nuclear / renewable PPA |
| `pue` | float | 🔒 paid | power usage effectiveness |
| `water_use_m3y` | float | 🔒 paid | annual cooling water |
| `chips_est` | int | 🔒 paid | accelerator count (AI clusters) |
| `capex_usd_m` | float | 🔒 paid | announced investment |
| `source`, `source_date`, `confidence` | string/enum | 🔒 paid | **provenance & estimate quality — the trust layer** |

---

## 2. Country roll-up — `gaia_datacenter_country.csv` (derived)

One row per country. Free layer shows the top block; the index & projections are paid.

| field | free? | notes |
|---|---|---|
| `iso3`, `country_name` | ✅ free | |
| `n_facilities` | ✅ free | count in registry |
| `operational_mw` | ✅ free | sum of operational capacity |
| `announced_mw` | ✅ free | sum of construction + announced (kept **separate** from operational) |
| `top_hub` | ✅ free | largest site/market |
| **`compute_dependency_index`** | 🔒 paid | **flagship**: adoption (usage) vs domestic operational compute |
| `compute_per_capita` | 🔒 paid | MW per million people |
| `dc_electricity_twh` | 🔒 paid | estimated DC power draw |
| `dc_share_national_elec_pct` | 🔒 paid (headline teaser only) | one shock stat may be free |
| `grid_headroom_flag` | 🔒 paid | load vs available capacity |
| `jobs_per_mw` | 🔒 paid | construction vs permanent |
| `net_fiscal_index` | 🔒 paid | incentives granted vs revenue/jobs returned |
| `sovereignty_flag` | 🔒 paid | domestic vs foreign-hyperscaler dependence |

---

## 3. What renders where

**Free (web hook):**
- Global clustered **map** (points by `type`, sized by capacity band; `status`
  separates operational vs announced).
- Filter: **All** vs **AI/frontier clusters**.
- Country **choropleth shaded by GAIA adoption** — so the "high use, no domestic
  compute" gap is visible *before* the paywall.
- Headline strip: global operational MW, announced pipeline MW, # countries, #
  frontier clusters.
- Country click → teaser card: facilities, operational MW, announced MW, top hub,
  adoption rank, **one** dependency-signal sentence.
- **Locked cards** (visible, blurred): dependency rank, energy-vs-grid,
  net-fiscal → CTA to the paid Country Report.

**Paid (reports / data / API):**
- Full facility registry (exact MW, operator mix, pipeline, power, PUE, water, capex).
- `compute_dependency_index` + `compute_per_capita` full ranking.
- Energy load vs grid-headroom + price-impact projections.
- Jobs-per-MW & net-fiscal-on-incentives per country.
- Provenance/confidence columns, CSV/API, versioned vintages.

---

## 4. Sources to ingest

| layer | source | licence posture |
|---|---|---|
| Locations (free) | OpenStreetMap (Overpass `man_made=data_center`), Data Center Map, Cloudscene, cloud region lists | open / public directory |
| AI/frontier clusters | **Epoch AI** (notable clusters: compute, power, location) | public research, citable |
| Energy | **IEA** electricity reports | public reports |
| Capacity benchmark | Cushman & Wakefield, CBRE, JLL market reports | published aggregates |
| Premium capacity/pipeline | SemiAnalysis, DC Byte | paid (reference as benchmark) |
| Efficiency / counts | Uptime Institute, Synergy Research | surveys |

**Honesty discipline (the differentiator):** always separate `operational` from
`announced`; carry `confidence`; never publish an unqualified "planned capacity"
headline. The market inflates these numbers — GAIA's edge is not doing so.
