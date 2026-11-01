/**
 * The data layer: the only place pages get content from.
 *
 *   const summary = await getSummary();
 *
 * Which source answers is set by DATA_SOURCE (default "local" = the files in src/data/). To connect a
 * database or CMS, add a file in ./sources that implements `DataSource`, register it in SOURCES below
 * and in the DATA_SOURCE enum in astro.config.mjs, then set DATA_SOURCE. Pages don't change.
 *
 * Every result is validated against ./schemas.ts and cached for the rest of the build.
 */
import { DATA_SOURCE } from "astro:env/server";
import type { z } from "astro/zod";
import type { DataSource } from "./sources/types";
import { local } from "./sources/local";
import { http } from "./sources/http";
import {
  compoundsSchema, evidenceSchema, figuresSchema, guidanceSchema, servingsSchema, sourcesSchema, speciesSchema, summarySchema,
} from "./schemas";

const SOURCES: Record<string, DataSource> = { local, http };

const source = SOURCES[DATA_SOURCE];
if (!source) throw new Error(`DATA_SOURCE="${DATA_SOURCE}" isn't registered in src/lib/data/index.ts`);

const cache = new Map<string, Promise<unknown>>();

/** Load once, validate, and explain failures in terms of the content, not the stack trace. */
function load<S extends z.ZodType>(key: string, schema: S, fetcher: () => Promise<unknown>): Promise<z.infer<S>> {
  if (!cache.has(key)) {
    cache.set(key, fetcher().then((raw) => {
      const parsed = schema.safeParse(raw);
      if (parsed.success) return parsed.data;
      const issues = parsed.error.issues
        .slice(0, 8)
        .map((i) => `  • ${key}${describePath(raw, i.path)}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid ${key} from the "${source.name}" data source:\n${issues}`);
    }));
  }
  return cache.get(key) as Promise<z.infer<S>>;
}

/** projects.0.tint → projects[0] "Anomaly Detection & Reporting".tint, so the bad entry is easy to find. */
function describePath(raw: unknown, path: PropertyKey[]) {
  let out = "", node: any = raw;
  for (const k of path) {
    node = node?.[k as any];
    const label = typeof k === "number" ? (node?.title ?? node?.name ?? node?.id ?? node?.slug) : undefined;
    out += typeof k === "number" ? `[${k}]${label ? ` "${label}"` : ""}` : `.${String(k)}`;
  }
  return out;
}

export const dataSourceName = source.name;

const s = source.sangkap;
export const getCompounds = () => load("sangkap.compounds", compoundsSchema, s.compounds);
export const getServings = () => load("sangkap.servings", servingsSchema, s.servings);
export const getSpecies = () => load("sangkap.species", speciesSchema, s.species);
export const getGuidance = () => load("sangkap.guidance", guidanceSchema, s.guidance);
export const getEvidence = () => load("sangkap.evidence", evidenceSchema, s.evidence);
export const getFigures = () => load("sangkap.figures", figuresSchema, s.figures);
export const getSources = () => load("sangkap.sources", sourcesSchema, s.sources);
export const getSummary = () => load("sangkap.summary", summarySchema, s.summary);
