/**
 * Reads the same content from any JSON API or static host, e.g. a published release:
 *   DATA_SOURCE=http DATA_API_URL=https://mendozaivanka.github.io/sangkap/data/v1
 *
 *   GET {DATA_API_URL}/sangkap/compounds.json   (and servings, species, guidance, evidence, figures, sources, summary)
 *
 * If DATA_API_TOKEN is set it's sent as `Authorization: Bearer …`. Responses are validated like local data.
 */
import { DATA_API_URL, DATA_API_TOKEN } from "astro:env/server";
import type { DataSource } from "./types";

async function get(path: string): Promise<unknown> {
  if (!DATA_API_URL) throw new Error("DATA_SOURCE=http needs DATA_API_URL (see .env.example)");
  const url = `${DATA_API_URL.replace(/\/$/, "")}/${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(DATA_API_TOKEN ? { Authorization: `Bearer ${DATA_API_TOKEN}` } : {}) },
  }).catch((e) => {
    throw new Error(`GET ${url} failed (${e.cause?.code ?? e.message}). Is DATA_API_URL right and the API up?`);
  });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return res.json();
}

export const http: DataSource = {
  name: "http",
  sangkap: {
    compounds: () => get("sangkap/compounds.json"),
    servings: () => get("sangkap/servings.json"),
    species: () => get("sangkap/species.json"),
    guidance: () => get("sangkap/guidance.json"),
    evidence: () => get("sangkap/evidence.json"),
    figures: () => get("sangkap/figures.json"),
    sources: () => get("sangkap/sources.json"),
    summary: () => get("sangkap/summary.json"),
  },
};
