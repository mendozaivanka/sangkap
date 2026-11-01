# sangkap

Sangkap's site (`web/`, Astro 7 + React + SVG + Nordic Rose) and its data pipeline (`pipeline/`). Deployed to GitHub
Pages at https://mendozaivanka.github.io/sangkap/ by `.github/workflows/deploy.yml`. README.md has the details.
Third sibling of `../timpla` and `../sinturon`, whose conventions it copies.

- **Data reaches the site only through releases.** `pipeline/build.sh <N>` → `scripts/release-data.sh <N>` publishes
  `data-v<N>` and pins it in `data.lock.json`; `scripts/data-pull.sh` unpacks the pinned release into
  `web/src/data/sangkap/` (git-ignored). Never hand-edit those JSON files or a published release.
- **Fetch and build are separate.** `pipeline/pubchem/fetch.py` and `pipeline/fdc/fetch.py` write committed snapshots;
  `build.sh` reads only snapshots and `pipeline/curated/*.psv`, so any build is reproducible from git.
- **Definite, cited numbers only.** Every hand figure is one row in `curated/figures.psv` with one source, a locator
  (table/page/section) and the source's own words, verified against the source itself. Anything not verified stays a
  visible placeholder (`[mg]`, `[%]`, `[ref]`) and is listed in README "Not yet sourced". Never infer a number (no
  "robusta = 2 × arabica" multiplications); derived numbers are concentration × serving only, with the calc shown.
- **Not medical advice.** No body-weight input, no personal dose, no "safe" wording. Health findings say "was
  associated with" and give the review, comparison and interval. CI greps for banned phrases (`ci.yml`).
- **Open licences only:** PubChem (NCBI policy) and FDC (CC0) are redistributed; CC BY-NC sources only as single cited
  facts. No Phenol-Explorer data, no ChEMBL in the main release (CC BY-SA). Free services only.
- **Base path:** the site lives under `/sangkap`. Internal links are written `/sangkap/...`; files in `web/public/`
  and React code use `import.meta.env.BASE_URL`.
- **Design system:** files from `../nordic-rose` are vendored (`npm run design:sync`), never edited here. Default
  palette, Manrope bold headings (~-0.03em), Red Hat Mono labels, no serif, no italics for emphasis (deep rose
  instead). Circles: translucent fill ~0.35 with a 1px same-colour outline; bars translucent, no borders, rounded.
- **Overview tabs** are one React island (`web/src/components/sangkap/Overview.tsx`); the hash (`#cup`, `#molecules`,
  `#pukaw`) holds the tab. Roles and hidden panels are added only after hydration so no-JS shows everything.
- Python via `uv` in `pipeline/`; macOS Python has no CA bundle, so HTTPS goes through `certifi` (`pipeline/common.py`).
- Astro's compiler misreads `x! / y` as a regex in `.astro` files: write `(x ?? 0) / y`. Astro collapses whitespace
  at line breaks next to expressions: write `{" "}`.
- **Commits and PRs carry no AI attribution** (no Co-Authored-By trailers for AI tools, no "Generated with" lines).
- Verify with `pipeline/build.sh 1 && scripts/data-pull.sh --local` and `cd web && npm run build`. Commit/push only when asked.
