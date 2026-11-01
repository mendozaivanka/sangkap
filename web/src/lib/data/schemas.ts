/**
 * The shape of every piece of content the site renders, checked at build time. These zod schemas are the data
 * contract: the pipeline (../../../../pipeline/build.py) must produce JSON that passes them, or the build stops with
 * a message naming the bad field. Objects are strict, so an unknown or misspelled field fails too.
 */
import { z } from "astro/zod";

const species = z.enum(["arabica", "robusta", "liberica", "excelsa"]);
const brew = z.enum(["espresso", "filter", "french-press", "cold-brew"]);
const n = z.number().nullable();

const structure = z.strictObject({
  atoms: z.array(z.tuple([z.string(), z.number(), z.number(), z.number().int()])),
  bonds: z.array(z.tuple([z.number().int(), z.number().int(), z.number().int().min(1).max(3)])),
});
export const compoundSchema = z.strictObject({
  slug: z.string(),
  card: z.string(),
  name: z.string(),
  class: z.string(),
  cupLabel: z.string(),
  blurb: z.string(),
  cid: z.number().int().nullable(),
  title: z.string().nullable(),
  formula: z.string().nullable(),
  molWeight: n,
  xlogp: n,
  iupac: z.string().nullable(),
  smiles: z.string().nullable(),
  figures: z.array(z.string()),
  structure: structure.nullable(),
});
export const compoundsSchema = z.strictObject({ compounds: z.array(compoundSchema).min(5) });

export const cellSchema = z.strictObject({
  brew,
  compound: z.enum(["caffeine", "cga", "trigonelline", "cafestol", "kahweol"]),
  species: z.union([species, z.literal("any")]),
  mg: n,
  lo: n,
  hi: n,
  figures: z.array(z.string()).min(1),
  calc: z.string().nullable(),
  note: z.string().nullable(),
});
export const servingsSchema = z.strictObject({
  brews: z.array(z.strictObject({ slug: brew, name: z.string(), servingMl: z.number(), servingFigure: z.string().nullable(), servingNote: z.string().nullable() })).length(4),
  species: z.array(species).length(4),
  compounds: z.array(z.string()),
  cells: z.array(cellSchema),
  decaf: z.strictObject({ mgPer100g: z.number(), figure: z.string(), mgPerCup: z.number(), calc: z.string() }),
  crossCheck: z.array(z.strictObject({ brew, figure: z.string(), mg: z.number(), calc: z.string() })),
  notes: z.strictObject({ roast: z.string(), species: z.string() }),
});

export const speciesSchema = z.strictObject({
  unit: z.string(),
  placed: z.array(z.strictObject({ species, lo: z.number(), hi: z.number(), figure: z.string() })),
  notPlaced: z.array(z.strictObject({ species, figure: z.string(), why: z.string() })),
  ratio: z.strictObject({ value: z.number(), figure: z.string(), what: z.string() }),
  note: z.string(),
});

const ref = z.strictObject({ value: z.number(), figure: z.string() });
export const guidanceSchema = z.strictObject({
  singleDoseMg: ref,
  dailyMg: ref,
  pregnancyDailyMg: ref,
  sleepDoseMg: ref,
  halfLifeH: z.strictObject({ typical: z.number(), lo: z.number(), hi: z.number(), figure: z.string() }),
  halfLifePregnancyH: z.strictObject({ lo: z.number(), hi: z.number(), figure: z.string() }),
  model: z.string(),
  notModelled: z.array(z.string()),
});

export const evidenceSchema = z.strictObject({
  rows: z.array(z.strictObject({
    id: z.string(), outcome: z.string(), measure: z.enum(["RR", "HR", "OR"]), estimate: z.number(), ciLo: z.number(), ciHi: z.number(),
    comparison: z.string(), population: z.string(), source: z.string(), locator: z.string(), transcribedAt: z.string(),
  })),
  design: z.string(),
  note: z.string(),
});

export const figureSchema = z.strictObject({
  id: z.string(),
  n: z.number().int().positive(),
  subject: z.string(),
  brew: z.array(brew),
  species: z.array(species),
  what: z.string(),
  value: n,
  lo: n,
  hi: n,
  unit: z.string(),
  source: z.string(),
  locator: z.string(),
  quote: z.string(),
  retrievedBy: z.enum(["hand", "api"]),
  url: z.url(),
});
export const figuresSchema = z.strictObject({ figures: z.array(figureSchema) });

export const sourceSchema = z.strictObject({
  id: z.string(), short: z.string(), citation: z.string(), year: z.number().int(), doi: z.string().nullable(), url: z.url(),
  openUrl: z.url().nullable(), licence: z.string(), reuse: z.string(), retrievedBy: z.enum(["hand", "api"]),
  accessed: z.string().nullable(), figures: z.number().int(),
});
export const sourcesSchema = z.strictObject({ sources: z.array(sourceSchema) });

export const summarySchema = z.strictObject({
  pubchemFetchedAt: z.string(),
  fdcFetchedAt: z.string(),
  figures: z.number().int(),
  handFigures: z.number().int(),
  evidenceRows: z.number().int(),
  sources: z.number().int(),
  compounds: z.number().int(),
  cupCells: z.number().int(),
  notYetSourced: z.array(z.string()),
});

export type Compound = z.infer<typeof compoundSchema>;
export type Servings = z.infer<typeof servingsSchema>;
export type Cell = z.infer<typeof cellSchema>;
export type SpeciesData = z.infer<typeof speciesSchema>;
export type Guidance = z.infer<typeof guidanceSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Figure = z.infer<typeof figureSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Summary = z.infer<typeof summarySchema>;
