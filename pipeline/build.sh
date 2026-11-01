#!/usr/bin/env bash
# Builds one data version from the committed snapshots in this folder:
#   pipeline/build/v<N>/sangkap/*.json    compounds, servings, species, guidance, evidence, figures, sources, summary
#   pipeline/build/v<N>/manifest.json     version, sources with dates and licences, file hashes, counts
# Fetching is separate (pubchem/fetch.py, fdc/fetch.py), so a build is reproducible from git alone.
# Usage: pipeline/build.sh <N>
set -euo pipefail
cd "$(dirname "$0")"
V="${1:?usage: pipeline/build.sh <version number>}"
OUT="build/v$V"
rm -rf "$OUT" && mkdir -p "$OUT"

echo "▸ read models (compounds, servings, figures, guidance, evidence)"
uv run python build.py "$OUT/sangkap"

echo "▸ manifest"
uv run python manifest.py "$OUT" "v$V"
echo "✓ built $OUT"
