"""Writes manifest.json for a built data version: what went in (sources, dates, licences) and what came out (hashes).

Usage: uv run python manifest.py build/v1 v1
"""
import hashlib, json, subprocess, sys
from datetime import date
from pathlib import Path

out, version = Path(sys.argv[1]), sys.argv[2]
here = Path(__file__).parent


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


try:
    commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True, cwd=here).stdout.strip() or "uncommitted"
except OSError:
    commit = "unknown"

summary = json.loads((out / "sangkap/summary.json").read_text())
srcs = json.loads((out / "sangkap/sources.json").read_text())["sources"]
pubchem = json.loads((here / "pubchem/snapshot/meta.json").read_text())
fdc = json.loads((here / "fdc/snapshot/meta.json").read_text())
extra = {"pubchem": {"url": pubchem["api"], "fetchedAt": pubchem["fetchedAt"], "cids": pubchem["cids"]},
         "usda-fdc": {"url": fdc["api"], "fetchedAt": fdc["fetchedAt"], "fdcIds": fdc["fdcIds"]}}

sources = [{"id": s["id"], "what": s["citation"], "url": extra.get(s["id"], {}).get("url", s["url"]), "doi": s["doi"],
            "licence": s["licence"], "reuse": s["reuse"], "retrievedBy": s["retrievedBy"],
            **({"fetchedAt": extra[s["id"]]["fetchedAt"]} if s["id"] in extra else {"transcribedAt": s["accessed"]}),
            **({k: v for k, v in extra[s["id"]].items() if k not in ("url", "fetchedAt")} if s["id"] in extra else {})}
           for s in srcs]
sources.append({"id": "curated", "what": "Sangkap's hand-curated tables (compounds, figures, sources, evidence)",
                "files": ["curated/compounds.psv", "curated/figures.psv", "curated/sources.psv", "curated/evidence.psv"],
                "retrievedBy": "hand", "licence": "CC-BY-4.0", "attribution": "Sangkap"})

manifest = {
    "version": version,
    "builtAt": date.today().isoformat(),
    "pipelineCommit": commit,
    "sources": sources,
    # Every file is CC BY 4.0. Values transcribed from CC BY-NC sources (Poole 2017, Farah 2006) are single cited facts.
    "files": {str(p.relative_to(out)): {"bytes": p.stat().st_size, "sha256": sha(p), "licence": "CC-BY-4.0"}
              for p in sorted(out.rglob("*.json")) if p.name != "manifest.json"},
    "counts": {k: summary[k] for k in ("figures", "handFigures", "evidenceRows", "sources", "compounds", "cupCells")},
}
(out / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
total = sum(f["bytes"] for f in manifest["files"].values())
print(f"manifest: {len(manifest['files'])} files, {total / 1024:.0f} KB, counts {manifest['counts']}")
if total > 5 * 1024 * 1024:
    sys.exit(f"size guard: read models are {total / 1048576:.1f} MB (limit 5 MB). Record why in docs/DECISIONS.md and raise it.")
