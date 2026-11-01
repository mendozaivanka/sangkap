/**
 * The default source: the JSON in src/data/sangkap/, unpacked from the pinned data release by
 * `npm run data:pull` (../scripts/data-pull.sh). Never edit it by hand: change the pipeline and cut a new release.
 */
import type { DataSource } from "./types";

const json = (load: () => Promise<{ default: unknown }>) => async () => (await load()).default;

export const local: DataSource = {
  name: "local",
  sangkap: {
    compounds: json(() => import("@/data/sangkap/compounds.json")),
    servings: json(() => import("@/data/sangkap/servings.json")),
    species: json(() => import("@/data/sangkap/species.json")),
    guidance: json(() => import("@/data/sangkap/guidance.json")),
    evidence: json(() => import("@/data/sangkap/evidence.json")),
    figures: json(() => import("@/data/sangkap/figures.json")),
    sources: json(() => import("@/data/sangkap/sources.json")),
    summary: json(() => import("@/data/sangkap/summary.json")),
  },
};
