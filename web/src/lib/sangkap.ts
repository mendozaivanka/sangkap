// Sangkap's vocabulary and small helpers shared by Astro pages and the React island.
import type { Cell, Figure, Servings } from "@/lib/data/schemas";

export const SPECIES = ["arabica", "robusta", "liberica", "excelsa"] as const;
export type Species = (typeof SPECIES)[number];
export const BREWS = ["espresso", "filter", "french-press", "cold-brew"] as const;
export type Brew = (typeof BREWS)[number];
export const ROASTS = ["light", "medium", "dark"] as const;
export type Roast = (typeof ROASTS)[number];
export const CUP = ["caffeine", "cga", "trigonelline", "cafestol"] as const;
export type CupCompound = (typeof CUP)[number] | "kahweol";

/** Same names, scientific names and colours as Sinturon (colours are CSS variables, so they follow the theme). */
export const species: Record<Species, { name: string; scientific: string; colour: string }> = {
  arabica: { name: "Arabica", scientific: "Coffea arabica", colour: "var(--sp-arabica)" },
  robusta: { name: "Robusta", scientific: "Coffea canephora", colour: "var(--sp-robusta)" },
  liberica: { name: "Liberica", scientific: "Coffea liberica", colour: "var(--sp-liberica)" },
  excelsa: { name: "Excelsa", scientific: "Coffea liberica var. dewevrei", colour: "var(--sp-excelsa)" },
};
export const roastName: Record<Roast, string> = { light: "Light", medium: "Medium", dark: "Dark" };
export const brewName: Record<Brew, string> = { espresso: "Espresso", filter: "Filter", "french-press": "French press", "cold-brew": "Cold brew" };

/** Caffeine is deep rose everywhere; every other sourced compound is ink grey; unsourced values are dotted rings. */
export const compoundColour = (slug: string) => (slug === "caffeine" ? "var(--caffeine)" : "var(--compound)");
export const cupLabel: Record<CupCompound, string> = { caffeine: "caffeine", cga: "CGA", trigonelline: "trigonelline", cafestol: "cafestol", kahweol: "kahweol" };
export const cardSlug: Record<string, string> = {
  caffeine: "caffeine", cga: "chlorogenic-acids", trigonelline: "trigonelline", cafestol: "cafestol-kahweol", kahweol: "cafestol-kahweol", melanoidins: "melanoidins",
};

export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, "/");
export const fnHref = (n: number) => `${BASE}evidence/#f-${n}`;

export const fmt = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
/** "89 mg", "70–200 mg", or null when there is no value. */
export function amount(c: Pick<Cell, "mg" | "lo" | "hi"> | undefined, unit = "mg"): string | null {
  if (!c) return null;
  if (c.mg != null) return `${fmt(c.mg)} ${unit}`;
  if (c.lo != null && c.hi != null) return `${fmt(c.lo)}–${fmt(c.hi)} ${unit}`;
  return null;
}
export function figureValue(f: Figure): string {
  const v = f.value != null ? fmt(f.value) : `${fmt(f.lo!)}–${fmt(f.hi!)}`;
  const ci = f.value != null && f.lo != null && f.hi != null ? ` (${fmt(f.lo)}–${fmt(f.hi)})` : "";
  return `${v}${ci}${f.unit ? (f.unit === "%" || f.unit === "×" ? f.unit : ` ${f.unit}`) : ""}`;
}

/** The cell for a cup: a species-specific value wins over one for any species. */
export function findCell(s: Servings, brew: Brew, compound: CupCompound, sp: Species): Cell | undefined {
  return s.cells.find((c) => c.brew === brew && c.compound === compound && c.species === sp) ??
    s.cells.find((c) => c.brew === brew && c.compound === compound && c.species === "any");
}

/** One-compartment elimination, absorption drawn as instant: mg left at hour t from doses [hour, mg]. */
export function remaining(t: number, doses: [number, number][], halfLifeH: number): number {
  const k = Math.LN2 / halfLifeH;
  return doses.reduce((sum, [t0, mg]) => (t >= t0 ? sum + mg * Math.exp(-k * (t - t0)) : sum), 0);
}
export const clock = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
/** "CC BY 4.0", "© EFSA 2015", "NCBI data policy": the licence up to its first explanation. */
export const licenceShort = (l: string) => l.split(/\. | \(|:/)[0];
