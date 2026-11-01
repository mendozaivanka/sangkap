"""Builds Sangkap's read models from the committed snapshots and the hand-curated tables.

  compounds.json  the five compounds: PubChem properties, 2D skeletal layout, curated class and blurb
  servings.json   per brew and compound: mg in one serving (or a range), with the figures it comes from
  species.json    caffeine in the bean by species (only what an open source states)
  guidance.json   EFSA 2015 reference doses and the caffeine half-life the Pukaw curve uses
  evidence.json   what Poole et al. 2017 reports, in its own comparisons
  figures.json    every number on the site, numbered, with its source, locator and quote (the /evidence/ table)
  sources.json    every source with licence and what Sangkap does with it
  summary.json    fetch dates and counts

Nothing is fetched here: inputs are pubchem/snapshot, fdc/snapshot and curated/*.psv, all in git.
Usage: uv run python build.py build/v1/sangkap
"""
import csv, json, sys
from pathlib import Path

from common import HERE, write_json

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

BREWS = [
    # slug, name, serving ml, figure that states the serving (None = Sangkap's choice, said on the page)
    ("espresso", "Espresso", 60, "serving-espresso"),
    ("filter", "Filter", 200, "serving-filter"),
    ("french-press", "French press", 200, None),
    ("cold-brew", "Cold brew", 200, None),
]
SPECIES = ["arabica", "robusta", "liberica", "excelsa"]
CUP_COMPOUNDS = ["caffeine", "cga", "trigonelline", "cafestol", "kahweol"]


def psv(name: str) -> list[dict]:
    with open(HERE / "curated" / name) as f:
        return list(csv.DictReader((l for l in f if l.strip() and not l.startswith("#")), delimiter="|"))


def num(s: str):
    if s in ("", None):
        return None
    v = float(s)
    return int(v) if v.is_integer() else v


def sig(x: float | None):
    """Round a derived mg figure for display: whole mg from 10 up, two significant figures below."""
    if x is None:
        return None
    if x == 0:
        return 0
    if abs(x) >= 10:
        return round(x)
    from math import floor, log10
    return round(x, -int(floor(log10(abs(x)))) + 1)


sources = {s["id"]: s for s in psv("sources.psv")}
figures_in = psv("figures.psv")
evidence_in = psv("evidence.psv")
compounds_in = psv("compounds.psv")
props = {p["CID"]: p for p in json.loads((HERE / "pubchem/snapshot/properties.json").read_text())["properties"]}
pubchem_meta = json.loads((HERE / "pubchem/snapshot/meta.json").read_text())
fdc = json.loads((HERE / "fdc/snapshot/foods.json").read_text())["foods"]
fdc_meta = json.loads((HERE / "fdc/snapshot/meta.json").read_text())

# ---- checks on the hand-edited tables ------------------------------------------------------------------------------
errors = []
ids = [f["id"] for f in figures_in]
if len(ids) != len(set(ids)):
    errors.append("figures.psv has duplicate ids")
for f in figures_in:
    if f["source"] not in sources:
        errors.append(f"figures.psv {f['id']}: unknown source {f['source']}")
    if num(f["value"]) is None and (num(f["lo"]) is None or num(f["hi"]) is None):
        errors.append(f"figures.psv {f['id']}: needs a value or both lo and hi")
    if not f["quote"] or not f["locator"]:
        errors.append(f"figures.psv {f['id']}: every hand figure needs a locator and the source's words")
for e in evidence_in:
    if e["source"] not in sources:
        errors.append(f"evidence.psv {e['id']}: unknown source")
    if not (num(e["ci_lo"]) <= num(e["estimate"]) <= num(e["ci_hi"])):
        errors.append(f"evidence.psv {e['id']}: estimate outside its interval")
for s in sources.values():
    if not s["url"].startswith("https://"):
        errors.append(f"sources.psv {s['id']}: url must be https")
if errors:
    sys.exit("curated tables:\n  " + "\n  ".join(errors))

# ---- figures: hand rows, then FDC and PubChem rows generated from the snapshots ------------------------------------
figures = []
for f in figures_in:
    figures.append({
        "id": f["id"], "subject": f["subject"], "brew": [b for b in f["brew"].split(",") if b], "species": [s for s in f["species"].split(",") if s],
        "what": f["what"], "value": num(f["value"]), "lo": num(f["lo"]), "hi": num(f["hi"]), "unit": f["unit"],
        "source": f["source"], "locator": f["locator"], "quote": f["quote"], "retrievedBy": "hand",
    })
FDC_ROLE_BREW = {"filter": "filter", "espresso": "espresso", "filter-decaf": "filter", "espresso-decaf": "espresso"}
for food in fdc:
    figures.append({
        "id": f"fdc-{food['role']}", "subject": "caffeine", "brew": [FDC_ROLE_BREW[food["role"]]], "species": [],
        "what": f"Caffeine in “{food['description']}”", "value": num(str(food["caffeineMgPer100g"])), "lo": None, "hi": None,
        "unit": "mg/100 g", "source": "usda-fdc", "locator": f"FDC ID {food['fdcId']}, {food['dataType']} ({food['publicationDate']})",
        "quote": f"Caffeine {food['caffeineMgPer100g']} mg per 100 g", "retrievedBy": "api",
        "url": f"https://fdc.nal.usda.gov/food-details/{food['fdcId']}/nutrients",
    })
for c in compounds_in:
    if not c["cid"]:
        continue
    p = props[int(c["cid"])]
    url = f"https://pubchem.ncbi.nlm.nih.gov/compound/{c['cid']}"
    base = {"subject": c["slug"], "brew": [], "species": [], "lo": None, "hi": None, "source": "pubchem", "retrievedBy": "api", "url": url}
    figures.append({**base, "id": f"mw-{c['slug']}", "what": f"Molecular weight of {c['name'].lower() if c['slug'] != 'cga' else c['name']}",
                    "value": num(p["MolecularWeight"]), "unit": "g/mol", "locator": f"CID {c['cid']}, computed property MolecularWeight",
                    "quote": f"MolecularWeight {p['MolecularWeight']}"})
    if p.get("XLogP") is not None:
        figures.append({**base, "id": f"xlogp-{c['slug']}", "what": f"XLogP3 (computed octanol–water partition) of {c['name'] if c['slug'] == 'cga' else c['name'].lower()}",
                        "value": num(str(p["XLogP"])), "unit": "", "locator": f"CID {c['cid']}, computed property XLogP",
                        "quote": f"XLogP {p['XLogP']}"})
for i, f in enumerate(figures, 1):
    f["n"] = i
    s = sources[f["source"]]
    f.setdefault("url", s["open_url"] or s["url"])
fig = {f["id"]: f for f in figures}

# ---- compounds -------------------------------------------------------------------------------------------------
compounds = []
for c in compounds_in:
    cid = int(c["cid"]) if c["cid"] else None
    p = props.get(cid) if cid else None
    layout = json.loads((HERE / f"pubchem/snapshot/2d/{cid}.json").read_text()) if cid else None
    compounds.append({
        "slug": c["slug"], "card": c["card"], "name": c["name"], "class": c["class"], "cupLabel": c["cup_label"], "blurb": c["blurb"],
        "cid": cid, "title": p["Title"] if p else None, "formula": p["MolecularFormula"] if p else None,
        "molWeight": num(p["MolecularWeight"]) if p else None, "xlogp": p.get("XLogP") if p else None,
        "iupac": p["IUPACName"] if p else None, "smiles": p["SMILES"] if p else None,
        "figures": [k for k in (f"mw-{c['slug']}", f"xlogp-{c['slug']}") if k in fig],
        "structure": {"atoms": layout["atoms"], "bonds": layout["bonds"]} if layout else None,
    })

# ---- servings: one cell per brew × compound (× species where the source splits by species) -------------------------
cells = []


def cell(brew, compound, species, mg=None, lo=None, hi=None, figs=(), calc=None, note=None):
    cells.append({"brew": brew, "compound": compound, "species": species, "mg": sig(mg), "lo": sig(lo), "hi": sig(hi),
                  "figures": list(figs), "calc": calc, "note": note})


for slug, name, ml, serving_fig in BREWS:
    sfig = [serving_fig] if serving_fig else []
    # caffeine: one concentration per brew, species not stated by the source
    cf = fig[f"caffeine-{slug}"]
    l = ml / 1000
    cell(slug, "caffeine", "any", cf["value"] * l, cf["lo"] and cf["lo"] * l, cf["hi"] and cf["hi"] * l, [cf["id"], *sfig],
         f"{cf['value']:,} mg/L × {ml} ml".replace(",", " "),
         "The source does not say which species." if slug in ("espresso", "filter") else "Kona arabica, brewed 1:10 and not diluted.")
    # chlorogenic acids: per 200 ml cup by species, domestic extraction (filter and French press only)
    for sp in ("arabica", "robusta"):
        g = fig[f"cga-cup-{sp}"]
        if slug in g["brew"]:
            cell(slug, "cga", sp, None, g["lo"], g["hi"], [g["id"]], "per 200 ml cup, as the source states it")
    # diterpenes: mg/100 ml ranges × serving
    for comp in ("cafestol", "kahweol"):
        g = fig.get(f"{comp}-{slug}")
        if g:
            cell(slug, comp, "any", None, g["lo"] * ml / 100, g["hi"] * ml / 100, [g["id"], *sfig], f"{g['lo']}–{g['hi']} mg/100 ml × {ml} ml")

brews = [{"slug": s, "name": n, "servingMl": ml, "servingFigure": f,
          "servingNote": None if f else "200 ml is Sangkap's choice, to match EFSA's filter cup; the source gives a concentration."}
         for s, n, ml, f in BREWS]
decaf = {r: fig[f"fdc-{r}"] for r in ("filter-decaf", "espresso-decaf")}
servings = {
    "brews": brews, "species": SPECIES, "compounds": CUP_COMPOUNDS,
    "cells": cells,
    "decaf": {"mgPer100g": decaf["filter-decaf"]["value"], "figure": "fdc-filter-decaf",
              "mgPerCup": sig(decaf["filter-decaf"]["value"] * 2), "calc": "1 mg/100 g × 200 g (about 200 ml)"},
    "crossCheck": [
        {"brew": "filter", "figure": "fdc-filter", "mg": sig(fig["fdc-filter"]["value"] * 2), "calc": "40 mg/100 g × 200 g (about 200 ml)"},
        {"brew": "espresso", "figure": "fdc-espresso", "mg": sig(fig["fdc-espresso"]["value"] * 0.6), "calc": "212 mg/100 g × 60 g (about 60 ml)"},
    ],
    "notes": {
        "roast": "Sangkap's sources give one caffeine figure per brew, not per roast, so the cup does not change with roast.",
        "species": "EFSA's and Fuller & Rao's caffeine figures are for coffee as brewed; only chlorogenic acids are split by species.",
    },
}

# ---- species ---------------------------------------------------------------------------------------------------
ar, ro, mature, lx = (fig[k] for k in ("bean-caffeine-arabica", "bean-caffeine-robusta", "bean-caffeine-mature-ratio", "bean-caffeine-liberica-excelsa"))
species = {
    "unit": "% dry weight",
    "placed": [
        {"species": "arabica", "lo": ar["lo"], "hi": ar["hi"], "figure": ar["id"]},
        {"species": "robusta", "lo": ro["lo"], "hi": ro["hi"], "figure": ro["id"]},
    ],
    "notPlaced": [
        {"species": "liberica", "figure": lx["id"], "why": f"Reported together with excelsa as {lx['lo']}–{lx['hi']} g/100 g: too wide to place."},
        {"species": "excelsa", "figure": lx["id"], "why": f"Reported together with liberica as {lx['lo']}–{lx['hi']} g/100 g: too wide to place."},
    ],
    "ratio": {"value": mature["value"], "figure": mature["id"], "what": "mature robusta beans vs arabica, one study"},
    "note": "Peng et al. do not say whether the beans were green or roasted.",
}

# ---- guidance --------------------------------------------------------------------------------------------------
hl = fig["halflife-adults"]
guidance = {
    "singleDoseMg": {"value": fig["guidance-single"]["value"], "figure": "guidance-single"},
    "dailyMg": {"value": fig["guidance-daily"]["value"], "figure": "guidance-daily"},
    "pregnancyDailyMg": {"value": fig["guidance-pregnancy"]["value"], "figure": "guidance-pregnancy"},
    "sleepDoseMg": {"value": fig["guidance-sleep"]["value"], "figure": "guidance-sleep"},
    "halfLifeH": {"typical": hl["value"], "lo": hl["lo"], "hi": hl["hi"], "figure": hl["id"]},
    "halfLifePregnancyH": {"lo": fig["halflife-pregnancy"]["lo"], "hi": fig["halflife-pregnancy"]["hi"], "figure": "halflife-pregnancy"},
    "model": "one-compartment, first-order elimination, absorption drawn as instant; illustrative",
    "notModelled": ["CYP1A2 genotype", "smoking", "pregnancy", "oral contraceptives", "liver function", "body weight"],
}

# ---- evidence --------------------------------------------------------------------------------------------------
evidence = {"rows": [{
    "id": e["id"], "outcome": e["outcome"], "measure": e["measure"], "estimate": num(e["estimate"]), "ciLo": num(e["ci_lo"]),
    "ciHi": num(e["ci_hi"]), "comparison": e["comparison"], "population": e["population"], "source": e["source"],
    "locator": e["locator"], "transcribedAt": e["transcribed_at"],
} for e in evidence_in], "design": "umbrella review of meta-analyses", "note": "Associations in observational data, as the review reports them."}

# ---- sources ---------------------------------------------------------------------------------------------------
used = {f["source"] for f in figures} | {e["source"] for e in evidence_in}
src_out = []
for s in sources.values():
    if s["id"] not in used:
        continue
    # API sources carry no date here (it is in summary.json), so a monthly refetch with no new values changes nothing.
    accessed = s["accessed"] or None
    src_out.append({"id": s["id"], "short": s["short"], "citation": s["citation"], "year": int(s["year"]), "doi": s["doi"] or None,
                    "url": s["url"], "openUrl": s["open_url"] or None, "licence": s["licence"], "reuse": s["reuse"],
                    "retrievedBy": s["retrieved_by"], "accessed": accessed,
                    "figures": sum(1 for f in figures if f["source"] == s["id"]) + sum(1 for e in evidence_in if e["source"] == s["id"])})

summary = {
    "pubchemFetchedAt": pubchem_meta["fetchedAt"], "fdcFetchedAt": fdc_meta["fetchedAt"],
    "figures": len(figures), "handFigures": len(figures_in), "evidenceRows": len(evidence_in), "sources": len(src_out),
    "compounds": len(compounds), "cupCells": len(cells),
    "notYetSourced": [
        "trigonelline in one serving, per brew (only an all-brews range is open)",
        "chlorogenic acids in espresso and cold brew, and for liberica and excelsa",
        "cafestol and kahweol in cold brew",
        "caffeine per species in the cup (sources give coffee as brewed)",
        "caffeine in liberica and excelsa beans, separately",
        "roast-by-roast caffeine per brew",
    ],
}

for name, data in [("compounds", {"compounds": compounds}), ("servings", servings),
                   ("species", species), ("guidance", guidance), ("evidence", evidence), ("figures", {"figures": figures}),
                   ("sources", {"sources": src_out}), ("summary", summary)]:
    write_json(OUT / f"{name}.json", data)
print(f"build: {len(figures)} figures ({len(figures_in)} by hand), {len(cells)} cup cells, {len(compounds)} compounds, {len(src_out)} sources")
