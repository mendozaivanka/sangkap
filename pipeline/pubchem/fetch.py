"""Fetches computed properties and 2D layouts for Sangkap's compounds from PubChem PUG REST.

Writes pubchem/snapshot/properties.json (formula, molecular weight, XLogP, IUPAC name, SMILES per CID),
pubchem/snapshot/2d/<cid>.json (heavy atoms with 2D coordinates and bonds, hydrogens dropped) and meta.json.
CIDs come from curated/compounds.psv; each name is also looked up so a CID that stops matching its name fails loudly.
PubChem asks for at most 5 requests a second; this makes about a dozen, one every 0.4 s.
Usage: uv run python pubchem/fetch.py
"""
import csv, json, sys, time, urllib.parse
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import HERE, get_json, write_json  # noqa: E402

API = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
OUT = HERE / "pubchem/snapshot"
PROPS = "Title,MolecularFormula,MolecularWeight,XLogP,IUPACName,SMILES,ConnectivitySMILES"
ELEMENT = {1: "H", 6: "C", 7: "N", 8: "O"}


def compounds():
    with open(HERE / "curated/compounds.psv") as f:
        rows = [r for r in csv.DictReader((l for l in f if not l.startswith("#")), delimiter="|")]
    return [r for r in rows if r["cid"]]


def layout(cid: int) -> dict:
    """PubChem's own 2D depiction coordinates, heavy atoms only (skeletal formula)."""
    rec = get_json(f"{API}/compound/cid/{cid}/record/JSON?record_type=2d")["PC_Compounds"][0]
    aid, el = rec["atoms"]["aid"], rec["atoms"]["element"]
    charge = {c["aid"]: c["value"] for c in rec["atoms"].get("charge", [])}
    conf = rec["coords"][0]["conformers"][0]
    xy = dict(zip(rec["coords"][0]["aid"], zip(conf["x"], conf["y"])))
    heavy = [a for a, e in zip(aid, el) if e != 1]
    idx = {a: i for i, a in enumerate(heavy)}
    atoms = [[ELEMENT.get(e, str(e)), round(xy[a][0], 3), round(xy[a][1], 3), charge.get(a, 0)] for a, e in zip(aid, el) if e != 1]
    b = rec["bonds"]
    bonds = [[idx[a1], idx[a2], o] for a1, a2, o in zip(b["aid1"], b["aid2"], b["order"]) if a1 in idx and a2 in idx]
    return {"cid": cid, "columns": {"atoms": ["element", "x", "y", "charge"], "bonds": ["a", "b", "order"]}, "atoms": atoms, "bonds": bonds}


def main():
    rows = compounds()
    cids = [int(r["cid"]) for r in rows]
    for r in rows:
        found = get_json(f"{API}/compound/name/{urllib.parse.quote(r['pubchem_name'])}/cids/JSON")["IdentifierList"]["CID"]
        if int(r["cid"]) not in found:
            sys.exit(f"PubChem name '{r['pubchem_name']}' now resolves to {found}, not {r['cid']}: check curated/compounds.psv")
        time.sleep(0.4)
    props = get_json(f"{API}/compound/cid/{','.join(map(str, cids))}/property/{PROPS}/JSON")["PropertyTable"]["Properties"]
    write_json(OUT / "properties.json", {"properties": sorted(props, key=lambda p: p["CID"])}, indent=1)
    for cid in cids:
        time.sleep(0.4)
        write_json(OUT / f"2d/{cid}.json", layout(cid))
    write_json(OUT / "meta.json", {
        "api": API, "fetchedAt": date.today().isoformat(),
        "fetchedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "cids": cids, "properties": PROPS.split(","),
    }, indent=1)
    print(f"pubchem: {len(props)} compounds, 2D layouts for {len(cids)}")


if __name__ == "__main__":
    main()
