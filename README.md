# Sangkap (what's in a cup of coffee)

**Live:** https://mendozaivanka.github.io/sangkap/ · **Status (2026-11-02):** v1 built locally, not yet published
· **Data:** [latest.json](https://mendozaivanka.github.io/sangkap/data/latest.json) · [releases](https://github.com/mendozaivanka/sangkap/releases)

Sangkap ("ingredient" in Tagalog) shows what is in one cup of coffee: caffeine, chlorogenic acids, trigonelline,
cafestol and kahweol, and melanoidins. Pick a species, roast and brew and the cup redraws, with each compound as a
circle (area ∝ mg). The molecules tab shows their structures and PubChem properties. The "How long it lasts" (Pukaw) tab
follows your cup's caffeine through the day with an illustrative one-compartment model and EFSA's half-life range.

**Not medical advice. Every number links to its source.** The Pukaw curve is labelled illustrative, takes no body
weight and computes no personal dose. EFSA's figures are quoted as EFSA's 2015 guidance for healthy adults, not as a
limit for anyone in particular. Poole et al.'s results are reported as associations, in the review's own comparisons.

## Layout

| Path | What |
| --- | --- |
| `web/` | The site: Astro 7, one React 19 island (tabs + cup + curve share state), Tailwind v4, shadcn/ui, hand-built SVG charts, Nordic Rose (vendored, default palette). Served at `/sangkap/` |
| `pipeline/pubchem/` | `fetch.py` → `snapshot/properties.json` (formula, molecular weight, XLogP, IUPAC, SMILES) and `snapshot/2d/<cid>.json` (PubChem's 2D depiction, heavy atoms) |
| `pipeline/fdc/` | `fetch.py` → `snapshot/foods.json`: caffeine per 100 g for four SR Legacy brewed-coffee foods (FDC API; `FDC_API_KEY` or `DEMO_KEY`) |
| `pipeline/curated/` | Hand-edited: `figures.psv` (every cited number, one source per row, with locator and quote), `sources.psv`, `compounds.psv`, `evidence.psv` |
| `pipeline/build.py` | Joins snapshots and curated tables into `compounds`, `servings`, `species`, `guidance`, `evidence`, `figures`, `sources`, `summary` JSON |
| `pipeline/build.sh` | Builds one data version into `pipeline/build/v<N>/` with a `manifest.json` (5 MB size guard) |
| `scripts/` | `release-data.sh` (publish `data-v<N>`), `data-pin.sh`, `data-pull.sh` (fetch the pinned release for the site), `check-attribution.sh` |
| `data.lock.json` | The data version the site is pinned to, with its sha256 (placeholder until the first release) |
| `docs/` | `DECISIONS.md`, `LICENCES.md`, `PIPELINE.md` |
| `.github/workflows/` | `ci.yml`, `deploy.yml`, `data.yml` (monthly data run) |

## Pages

- `/` Overview with three tabs, each with its own address: `#cup` (Build a cup), `#molecules`, `#pukaw`. Without
  JavaScript all three are shown stacked.
- `/evidence/` Every figure grouped by source: value, unit, where in the source, the source's words, licence and link.
  Footnote chips across the site point at these rows (`/evidence/#f-<n>`). Also Poole et al. 2017 as an interval table.
- `/data/` Sources, licences, what is not yet sourced, how numbers are derived, downloads.
- `/compounds/<slug>/` caffeine, chlorogenic-acids, trigonelline, cafestol-kahweol, melanoidins. And `/404`.

## Data sources and licences

| Source | Used for | Licence | How |
| --- | --- | --- | --- |
| [PubChem](https://pubchem.ncbi.nlm.nih.gov/) PUG REST | CIDs 2519, 1794427, 5570, 108052, 114778: formula, molecular weight, XLogP3, IUPAC name, 2D layout | NCBI policy: no restrictions on PubChem computed data | API snapshot, redistributed |
| [USDA FoodData Central](https://fdc.nal.usda.gov/) SR Legacy | caffeine per 100 g: brewed 40, espresso 212, both decafs 1 | CC0 1.0 | API snapshot, redistributed |
| [EFSA 2015 opinion](https://doi.org/10.2903/j.efsa.2015.4102) | caffeine concentrations (Table 1), 200 mg single dose, 400 mg/day, 200 mg/day pregnancy, 100 mg near bedtime, half-life ≈4 h (2–8 h) | © EFSA; indexed as CC BY-ND 4.0 | cited facts |
| [EFSA explainer 2015](https://www.efsa.europa.eu/sites/default/files/corporate_publications/files/efsaexplainscaffeine150527.pdf) | serving sizes: espresso 60 ml, filter 200 ml | © EFSA, non-commercial reproduction with acknowledgement | cited facts |
| [Poole et al. 2017, BMJ](https://doi.org/10.1136/bmj.j5024) | six associations with 95% intervals | **CC BY-NC 4.0** | cited facts |
| [Farah & Donangelo 2006](https://doi.org/10.1590/S1677-04202006000100003) | chlorogenic acids per 200 ml cup by species; up to 95% lost in drastic roasting | **CC BY-NC 4.0** | cited facts |
| [Maier et al. 2025](https://doi.org/10.3390/molecules30142951) | cafestol and kahweol per 100 ml by brew | CC BY 4.0 | cited facts |
| [Fuller & Rao 2017](https://doi.org/10.1038/s41598-017-18247-4) | caffeine in French press and cold brew (1:10 lab brews) | CC BY 4.0 | cited facts |
| [Peng et al. 2025](https://doi.org/10.3389/fnut.2025.1690881), [Perrois et al. 2015](https://doi.org/10.1007/s00425-014-2170-7), [Kurniawan et al. 2026](https://doi.org/10.3390/molecules31091518) | caffeine in the bean by species | CC BY | cited facts |
| [Socała et al. 2021](https://doi.org/10.3390/ijms22010107) | trigonelline and melanoidins in brews (all-brew ranges) | CC BY 4.0 | cited facts |

**Not used:** Phenol-Explorer (non-commercial terms; nothing transcribed), ChEMBL (CC BY-SA 3.0; left out of v1 so the
whole release stays CC BY 4.0), Google or Foursquare data. Details in `docs/LICENCES.md`.

## Not yet sourced

Shown on the site as visible placeholders (`[mg]`, `[%]`), never guessed:

- trigonelline in one serving, per brew (only an all-brews range of 12–50 mg/100 ml is open)
- chlorogenic acids in espresso and cold brew, and for liberica and excelsa
- cafestol and kahweol in cold brew
- caffeine per species in the cup (the per-serving sources describe coffee as brewed, species not stated)
- caffeine in liberica and excelsa beans separately (one review gives 1.2–3.8 g/100 g for both together)
- roast-by-roast caffeine per brew (so roast changes the explanation, not the cup)

## How the data flows

```
PubChem + FDC ──fetch.py──▶ pipeline/*/snapshot/ (git) ─┐
curated/*.psv (hand, PR-only) ──────────────────────────┴─build.sh──▶ pipeline/build/v<N>/ ──release-data.sh──▶ data-v<N>
                                                                                              │ pinned in data.lock.json
                                                           site build ◀──data-pull.sh─────────┘ (sha256-checked)
```

- **Automatic:** on the 6th of every month `data.yml` refetches PubChem and FDC, rebuilds, and publishes `data-v<N+1>`
  with an "Adopt data" pull request only if a read model changed (rare: these values hardly move).
- **Hand-curated:** `pipeline/curated/*.psv` change only by pull request; `build.py` refuses a figure without a source,
  locator and quote, and CI rebuilds the data from the branch and reports what changed against the pinned release.

## Run it locally

Node 24, npm and [uv](https://docs.astral.sh/uv/).

```sh
git config core.hooksPath .githooks        # once: blocks AI attribution lines in commit messages
pipeline/build.sh 1 && scripts/data-pull.sh --local   # until data-v1 is released; afterwards: scripts/data-pull.sh
cd web && npm ci && npm run dev            # http://localhost:4321/sangkap/
```

Refetch first with `cd pipeline && uv run python pubchem/fetch.py && uv run python fdc/fetch.py` (a few seconds).

## Cut a data release

Usually the monthly run does it. By hand: Actions → Data → Run workflow. Locally: `pipeline/build.sh <N>`, then
`scripts/release-data.sh <N>` (needs `gh auth login`), commit `data.lock.json`. Roll back by pinning an older version:
`scripts/data-pin.sh <N> <sha256 from that release's SHA256SUMS>`. Releases are never edited or deleted.

**First release:** `data.lock.json` holds a placeholder until `scripts/release-data.sh 1` runs, so CI and deploy fail
on `data-pull.sh` until then.

## Design system

Nordic Rose, from the private `mendozaivanka/nordic-rose` repo, vendored into `web/`:
`NORDIC_ROSE_DIR=../../nordic-rose npm run design:sync` and `npm run design:verify` (hash check, runs in CI).
Default palette; Manrope headings, Red Hat Mono labels. Caffeine is deep rose (`--caffeine`); species colours match
Sinturon; both live in `web/src/styles/global.css`.

## Free-tier catches

- GitHub Pages needs a public repo; 1 GB per site, soft 100 GB/month bandwidth, 10 minutes per deploy.
- Scheduled workflows stop after 60 days with no repository activity. Sangkap's data rarely changes, so expect the
  monthly run to be disabled eventually; Actions → Data → Enable workflow turns it back on.
- FDC's `DEMO_KEY` is shared and rate-limited (about 30 requests an hour per IP); the fetch makes one request. A free
  key from https://fdc.nal.usda.gov/api-key-signup goes in the `FDC_API_KEY` repository secret.
- PubChem asks for at most 5 requests a second; the fetcher waits 0.4 s between its dozen requests.
- EFSA's journal (Wiley) and efsa.europa.eu block scripted access; EFSA figures are transcribed by hand, with an
  archived copy of EFSA's PDF as the free link.

## Licence

Code MIT. Read models and curated tables CC BY 4.0, keeping each figure's source. PubChem data per NCBI policy;
FoodData Central CC0. Values cited from CC BY-NC sources (Poole et al. 2017, Farah & Donangelo 2006) are single
facts with attribution; those sources are not redistributed. Details in `docs/LICENCES.md`.
