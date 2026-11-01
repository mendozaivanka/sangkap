# Decisions

Append-only. Newest last.

- **2026-11-02 · Own repo, Sinturon's conventions.** Sangkap is the third sibling in `mendozaivanka/sangkap`: same
  release flow (`data-v<N>` pinned by `data.lock.json`, sha256-checked at deploy), same workflows, hooks and vendored
  Nordic Rose (commit 3c64e58). The plan's brown "kape" palette and serif type are superseded: default Nordic Rose.
- **2026-11-02 · Tabs, not one long page.** The approved design puts the overview's three parts behind a tab bar with
  the tab in the URL hash, so each tab is about 1.5–2 phone screens and still linkable. One React island holds all
  three because the cup built in tab 1 drives tabs 2 and 3. No-JS shows them stacked.
- **2026-11-02 · Verified figures only, with the source's words.** Every hand figure carries a locator and a quote,
  checked against the source text (EFSA's PDF via an archived copy, the rest via Europe PMC / SciELO full text).
  `build.py` refuses a row without them.
- **2026-11-02 · EFSA per-cup caffeine is derived, and says so.** The EFSA explainer draws espresso (60 ml) and filter
  (200 ml) as unlabelled bars. The opinion's Table 1 gives the concentrations (1 340 and 445 mg/L), so the site shows
  80 mg and 89 mg with the multiplication. The design's "90 mg" became 89 mg.
- **2026-11-02 · Robusta vs arabica drawn as cited ranges, not "≈2×".** Open sources give 1.2–1.5% vs 2.2–2.7% dry
  weight (Peng et al. 2025, a review) and, in one primary study, 50% more in mature robusta beans (Perrois et al.
  2015). The species strip draws the two ranges and states the 1.5× ratio; no "2×" is drawn. Liberica and excelsa
  stay unplaced: the only open figure covers both together (1.2–3.8 g/100 g).
- **2026-11-02 · Species doesn't change the cup's caffeine.** Per-serving caffeine sources describe coffee as brewed
  without naming a species, so multiplying by a bean ratio would invent a number. Species changes chlorogenic acids
  (Farah & Donangelo give arabica and robusta separately) and the explanatory text. Roast likewise changes text only.
- **2026-11-02 · French press and cold brew from Fuller & Rao 2017.** Lab brews at 1 g coffee to 10 ml water,
  undiluted, medium roast and grind; served at 200 ml, a serving Sangkap chose to match EFSA's filter cup (said on the
  page). Strong figures (208 and 236 mg); the page notes cold brew is often diluted.
- **2026-11-02 · Structures from PubChem's 2D depiction, not RDKit.** PubChem's `record_type=2d` JSON gives layout
  coordinates; the site draws heavy atoms as a skeletal formula in SVG (themeable, no Python chemistry dependency).
  Stereochemistry is not drawn.
- **2026-11-02 · No ChEMBL, no Phenol-Explorer in v1.** ChEMBL is CC BY-SA, which would make part of the release
  share-alike; the receptor strip isn't in the approved design. Phenol-Explorer's terms are non-commercial; an open
  review (Farah & Donangelo 2006) gives the per-cup chlorogenic-acid range instead.
- **2026-11-02 · Change detection ignores fetch dates.** Fetch dates live only in `summary.json` (excluded from the
  monthly diff), so a refetch with unchanged values cuts no release.
