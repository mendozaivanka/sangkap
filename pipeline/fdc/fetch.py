"""Fetches caffeine per 100 g for brewed coffee from USDA FoodData Central (CC0).

The four SR Legacy foods are fixed by fdcId (brewed, espresso and their decaf versions) so a renamed or reordered
search can't change what the site shows. Writes fdc/snapshot/foods.json and meta.json.
Key: FDC_API_KEY from the environment, else DEMO_KEY (shared, about 30 requests an hour per IP; this makes one).
Usage: uv run python fdc/fetch.py
"""
import os, sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import HERE, get_json, write_json  # noqa: E402

API = "https://api.nal.usda.gov/fdc/v1"
FOODS = {
    171890: "filter",          # Beverages, coffee, brewed, prepared with tap water
    171891: "espresso",        # Beverages, coffee, brewed, espresso, restaurant-prepared
    171889: "filter-decaf",    # ... prepared with tap water, decaffeinated
    174125: "espresso-decaf",  # ... espresso, restaurant-prepared, decaffeinated
}
CAFFEINE = 1057  # FDC nutrient id for caffeine (mg; nutrient number 262)
OUT = HERE / "fdc/snapshot"


def main():
    key = os.environ.get("FDC_API_KEY") or "DEMO_KEY"
    ids = ",".join(map(str, FOODS))
    data = get_json(f"{API}/foods?fdcIds={ids}&api_key={key}")
    foods = []
    for f in sorted(data, key=lambda f: f["fdcId"]):
        caf = [n for n in f.get("foodNutrients", []) if n.get("nutrient", {}).get("id") == CAFFEINE]
        if not caf:
            sys.exit(f"FDC {f['fdcId']} has no caffeine value")
        n = caf[0]
        assert n["nutrient"]["unitName"].lower() == "mg", n
        foods.append({"fdcId": f["fdcId"], "role": FOODS[f["fdcId"]], "description": f["description"], "dataType": f["dataType"],
                      "publicationDate": f.get("publicationDate"), "caffeineMgPer100g": n["amount"]})
    if len(foods) != len(FOODS):
        sys.exit(f"expected {len(FOODS)} foods, got {len(foods)}")
    write_json(OUT / "foods.json", {"foods": foods}, indent=1)
    write_json(OUT / "meta.json", {"api": f"{API}/foods", "fetchedAt": date.today().isoformat(), "fdcIds": list(FOODS),
                                   "nutrientId": CAFFEINE, "licence": "CC0 1.0"}, indent=1)
    print("fdc:", ", ".join(f"{f['role']} {f['caffeineMgPer100g']} mg/100 g" for f in foods))


if __name__ == "__main__":
    main()
