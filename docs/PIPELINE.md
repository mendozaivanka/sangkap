# Pipeline runbook

## Stages

1. `pipeline/pubchem/fetch.py`: checks each name in `curated/compounds.psv` still resolves to its CID, then fetches
   computed properties for all CIDs and each compound's 2D record → `pubchem/snapshot/properties.json`, `2d/<cid>.json`,
   `meta.json`. About a dozen requests, 0.4 s apart.
2. `pipeline/fdc/fetch.py`: one FDC `/foods` request for fdcIds 171890, 171891, 171889, 174125 → `fdc/snapshot/foods.json`
   + `meta.json`. Uses `FDC_API_KEY`, else `DEMO_KEY`.
3. `pipeline/build.py` (via `build.sh <N>`): validates the curated tables (every figure has a known source, a value or
   range, a locator and a quote; evidence estimates sit inside their intervals), then writes `compounds`, `servings`,
   `species`, `guidance`, `evidence`, `figures`, `sources`, `summary` JSON into `build/v<N>/sangkap/`.
4. `pipeline/manifest.py`: sources, licences, per-file licence and hash, counts; fails over 5 MB.
5. `scripts/release-data.sh <N>`: tarball + SHA256SUMS + manifest as release `data-v<N>`; pins `data.lock.json`.

## Adding or correcting a figure

1. Read the number in the source itself (not a summary). Note the table, page or section and copy the words.
2. Add or edit one row in `curated/figures.psv` (and the source in `sources.psv` if new). Ranges go in `lo`/`hi`.
3. If it fills a placeholder, wire it in `build.py` (servings cells) and remove the line from `notYetSourced` and the
   README's "Not yet sourced".
4. `pipeline/build.sh 1 && scripts/data-pull.sh --local && (cd web && npm run build)`, then open a pull request.

## Situations

| Situation | What happens | What to do |
| --- | --- | --- |
| PubChem name no longer matches a CID | `pubchem/fetch.py` stops with the new CIDs | check PubChem, fix `compounds.psv`, PR |
| FDC food missing its caffeine value | `fdc/fetch.py` stops | check the food on fdc.nal.usda.gov; pick a replacement fdcId, PR |
| DEMO_KEY rate-limited | fetch fails, last snapshot stays | add a free `FDC_API_KEY` secret; rerun |
| Nothing changed | no release, no PR | nothing |
| Site fails to build on new data | no release | fix `web/src/lib/data/schemas.ts` or the pipeline in a PR |
| Bad data went live | | pin the previous version: `scripts/data-pin.sh <N-1> <sha256>`, PR, merge |
| Workflow disabled after 60 quiet days | the monthly run stops | Actions → Data → Enable workflow |
