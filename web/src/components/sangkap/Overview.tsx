// The overview island: three tabs (Build a cup · The molecules · How long it lasts) sharing one cup.
// Tab state lives in the URL hash (#cup, #molecules, #pukaw) so a tab can be linked and Back works.
// Until the island hydrates (or without JavaScript) all three panels are shown stacked and the tabs are plain
// in-page links; roles, hidden panels and keyboard handling are added only once the script runs.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Compound, Guidance, Servings, SpeciesData } from "@/lib/data/schemas";
import Structure from "./Structure";
import {
  BASE, BREWS, CUP, ROASTS, SPECIES, amount, brewName, cardSlug, clock, compoundColour, cupLabel, findCell, fmt, fnHref,
  remaining, roastName, species as spInfo, type Brew, type CupCompound, type Roast, type Species,
} from "@/lib/sangkap";

type Tab = "cup" | "molecules" | "pukaw";
const TABS: { id: Tab; n: number; long: string; short: string; next?: string }[] = [
  { id: "cup", n: 1, long: "Build a cup", short: "Cup" },
  { id: "molecules", n: 2, long: "The molecules", short: "Molecules" },
  { id: "pukaw", n: 3, long: "How long it lasts", short: "Pukaw" },
];
const isTab = (s: string): s is Tab => TABS.some((t) => t.id === s);

export type FigureRef = { n: number; what: string };
type Props = {
  compounds: Compound[];
  servings: Servings;
  speciesData: SpeciesData;
  guidance: Guidance;
  figures: Record<string, FigureRef>;
};

function useMedia(query: string, ssr: boolean) {
  const [m, setM] = useState(ssr);
  useEffect(() => {
    const mq = matchMedia(query);
    setM(mq.matches);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

/** Footnote chips: each id becomes a numbered link to its row on /evidence/. */
function Fn({ ids, figures }: { ids: string[]; figures: Record<string, FigureRef> }) {
  return (
    <>
      {ids.map((id) => {
        const f = figures[id];
        if (!f) return null;
        return (
          <a key={id} className="fn" href={fnHref(f.n)} title={f.what} aria-label={`Source ${f.n}: ${f.what}`}>{f.n}</a>
        );
      })}
    </>
  );
}

/** A disclosure that is open on wide screens and folded on phones (open before hydration, for no-JS). */
function Fold({ title, wide, children, className = "", summaryOnWide = false }: { title: ReactNode; wide: boolean; children: ReactNode; className?: string; summaryOnWide?: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (ref.current) ref.current.open = wide; }, [wide]);
  return (
    <details ref={ref} className={`fold ${className}`} open>
      <summary className={`flex min-h-[52px] cursor-pointer items-center justify-between gap-3 font-semibold ${summaryOnWide ? "" : "md:hidden"}`}>
        {title}
        <span className="fold-sign font-mono text-primary-strong" aria-hidden="true"></span>
      </summary>
      {children}
    </details>
  );
}

function Pills<T extends string>({ legend, options, value, onChange, label, dot }: {
  legend: ReactNode; options: readonly T[]; value: T; onChange: (v: T) => void; label: (v: T) => string; dot?: (v: T) => string;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="label-mono mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} type="button" className="pill" aria-pressed={o === value} onClick={() => onChange(o)}>
            {dot && <span className="dot" style={{ background: dot(o) }} />}
            {label(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// ---- Tab 1: the cup drawing ------------------------------------------------------------------------------------
type Circle = { slug: CupCompound; r: number; rLo: number | null; x: number; y: number; text: string | null; sourced: boolean };

function layoutCup(items: Omit<Circle, "x" | "y">[]): Circle[] {
  const anchors: Record<string, [number, number]> = { caffeine: [122, 146], cga: [214, 140], trigonelline: [206, 238], cafestol: [128, 250] };
  const cs: Circle[] = items.map((it) => ({ ...it, x: anchors[it.slug][0], y: anchors[it.slug][1] }));
  const eff = (c: Circle) => Math.max(c.r, 24);
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < cs.length; i++)
      for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i], b = cs[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = eff(a) + eff(b) + 6;
        if (d < min) {
          const push = (min - d) / 2;
          a.x -= (dx / d) * push; a.y -= (dy / d) * push;
          b.x += (dx / d) * push; b.y += (dy / d) * push;
        }
      }
    for (const c of cs) {
      const r = eff(c);
      c.x = Math.min(276 - r, Math.max(44 + r, c.x));
      c.y = Math.min(300 - r, Math.max(72 + r, c.y));
      if (c.y > 190) {
        const dx = c.x - 160, dy = c.y - 190, d = Math.hypot(dx, dy), lim = 116 - r;
        if (d > lim) { c.x = 160 + (dx / d) * lim; c.y = 190 + (dy / d) * lim; }
      }
    }
  }
  return cs;
}

function CupDrawing({ circles, caption }: { circles: Circle[]; caption: string }) {
  return (
    <svg viewBox="0 0 360 330" width="100%" role="img" aria-label={caption} style={{ display: "block", maxWidth: 420, margin: "0 auto", fontFamily: "var(--font-mono)" }}>
      <path d="M40 40 h240 v150 a120 120 0 0 1 -240 0 z" fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} />
      <path d="M280 80 h22 a32 32 0 0 1 0 64 h-26" fill="none" stroke="var(--border)" strokeWidth={1.5} />
      <line x1={40} x2={280} y1={64} y2={64} stroke="var(--primary)" strokeWidth={1.5} />
      {circles.map((c) => {
        const col = compoundColour(c.slug);
        const inside = c.r >= 26;
        const ty = inside ? c.y : c.y + Math.max(c.r, 3) + 12;
        return (
          <g key={c.slug}>
            {c.sourced ? (
              <>
                {/* outer ring = the high end of a range (or the single value); filled disc = the low end */}
                <circle cx={c.x} cy={c.y} r={Math.max(c.r, 1.5)} fill={col} fillOpacity={c.rLo == null ? 0.35 : 0.08} stroke={col} strokeWidth={1} />
                {c.rLo != null && c.rLo > 0 && <circle cx={c.x} cy={c.y} r={c.rLo} fill={col} fillOpacity={0.35} stroke={col} strokeWidth={1} />}
              </>
            ) : (
              <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke="var(--unsourced)" strokeWidth={1} strokeDasharray="3 4" />
            )}
            <text x={c.x} y={inside ? ty - 4 : ty} textAnchor="middle" fontSize={c.slug === "caffeine" ? 13 : 11} fontWeight={600} fill="var(--foreground)">{cupLabel[c.slug]}</text>
            <text x={c.x} y={inside ? ty + 12 : ty + 13} textAnchor="middle" fontSize={11} fill={c.sourced ? "var(--foreground)" : "var(--primary-strong)"}>{c.text ?? "[mg]"}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- Tab 3: the Pukaw curve -------------------------------------------------------------------------------------
function PukawChart({ doses, hl, guidance, narrow, captionId }: { doses: [number, number][]; hl: number; guidance: Guidance; narrow: boolean; captionId: string }) {
  const W = narrow ? 290 : 640, H = narrow ? 170 : 200, L = narrow ? 34 : 46, T = 24;
  const t0 = 7, t1 = 25;
  const lo = guidance.halfLifeH.lo, hi = guidance.halfLifeH.hi;
  const peak = Math.max(...Array.from({ length: 181 }, (_, i) => remaining(t0 + i / 10, doses, hi)), 0);
  const yMax = Math.max(250, Math.ceil((peak * 1.12) / 50) * 50);
  const x = (t: number) => ((t - t0) / (t1 - t0)) * W;
  const y = (mg: number) => H - (mg / yMax) * H;
  const path = (h: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= (t1 - t0) * 10; i++) {
      const t = t0 + i / 10;
      // draw the jump at each dose as a vertical step
      for (const [td] of doses) if (Math.abs(t - td) < 1e-9) pts.push(`L${x(t).toFixed(1)} ${y(remaining(t - 1e-6, doses, h)).toFixed(1)}`);
      pts.push(`L${x(t).toFixed(1)} ${y(remaining(t, doses, h)).toFixed(1)}`);
    }
    return "M" + pts.join(" ").slice(1);
  };
  const main = path(hl);
  const at = 23, left = remaining(at, doses, hl);
  const ticks = narrow ? [7, 13, 19, 25] : [7, 10, 13, 16, 19, 22, 25];
  const yt = [0, 100, 200].filter((v) => v <= yMax);
  const s = guidance.singleDoseMg.value, sl = guidance.sleepDoseMg.value;
  const halo = { stroke: "var(--card)", strokeWidth: 5, paintOrder: "stroke" as const };
  return (
    <svg viewBox={`0 0 ${W + L + 8} ${H + T + 30}`} width="100%" role="img" aria-labelledby={captionId} style={{ display: "block", fontFamily: "var(--font-mono)" }}>
      <g transform={`translate(${L} ${T})`}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--border)" />
        <line x1={0} x2={W} y1={y(sl)} y2={y(sl)} stroke="var(--fjord-ink)" strokeDasharray="3 3" />
        <text x={W} y={y(sl) - 6} fontSize={11} fill="var(--fjord-ink)" textAnchor="end" {...halo}>{narrow ? `${sl} · EFSA sleep dose` : `${sl} mg · EFSA: a dose that may affect sleep near bedtime`}</text>
        <line x1={0} x2={W} y1={y(s)} y2={y(s)} stroke="var(--fjord-ink)" />
        <text x={W} y={y(s) - 6} fontSize={11} fill="var(--fjord-ink)" textAnchor="end" {...halo}>{narrow ? `${s} · EFSA single dose` : `${s} mg · EFSA single dose, healthy adults`}</text>
        <path d={path(lo)} fill="none" stroke="var(--fjord-ink)" strokeWidth={1} strokeDasharray="2 3" />
        <path d={path(hi)} fill="none" stroke="var(--fjord-ink)" strokeWidth={1} strokeDasharray="2 3" />
        <path d={`${main} L${W} ${H} L0 ${H} Z`} fill="var(--caffeine)" fillOpacity={0.22} />
        <path d={main} fill="none" stroke="var(--caffeine)" strokeWidth={1.5} />
        <line x1={x(at)} x2={x(at)} y1={y(left)} y2={H + 8} stroke="var(--foreground)" />
        <circle cx={x(at)} cy={y(left)} r={4} fill="var(--caffeine)" />
        <text x={x(at) - 7} y={Math.min(y(left) - 10, H - 30)} fontSize={11} fill="var(--foreground)" textAnchor="end" {...halo}>{`23:00 · ≈${Math.round(left)} mg`}</text>
        <g fontSize={11} fill="var(--muted-foreground)" textAnchor="middle">
          {ticks.map((t, i) => <text key={t} x={x(t)} y={H + 22} textAnchor={i === ticks.length - 1 ? "end" : i === 0 ? "start" : "middle"}>{clock(t)}</text>)}
        </g>
        <g fontSize={11} fill="var(--muted-foreground)" textAnchor="end">
          {yt.map((v) => <text key={v} x={-8} y={y(v) + 4}>{v}</text>)}
        </g>
      </g>
    </svg>
  );
}

// ---- The island ----------------------------------------------------------------------------------------------
export default function Overview({ compounds, servings, speciesData, guidance, figures }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("cup");
  const [sp, setSp] = useState<Species>("arabica");
  const [roast, setRoast] = useState<Roast>("medium");
  const [brew, setBrew] = useState<Brew>("filter");
  const [second, setSecond] = useState(true);
  const [hl, setHl] = useState(guidance.halfLifeH.typical);
  const wide = useMedia("(min-width: 768px)", true);
  const narrow = useMedia("(max-width: 639px)", false);
  const tabRefs = useRef<Record<Tab, HTMLAnchorElement | null>>({ cup: null, molecules: null, pukaw: null });
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fromHash = () => { const h = location.hash.slice(1); return isTab(h) ? h : "cup"; };
    setTab(fromHash());
    setMounted(true);
    const on = () => setTab(fromHash());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    return () => { window.removeEventListener("popstate", on); window.removeEventListener("hashchange", on); };
  }, []);

  const go = (id: Tab, focus = false) => {
    if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
    setTab(id);
    if (focus) tabRefs.current[id]?.focus();
    const bar = barRef.current;
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: "start" });
  };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const k = e.key;
    const j = k === "ArrowRight" ? (i + 1) % 3 : k === "ArrowLeft" ? (i + 2) % 3 : k === "Home" ? 0 : k === "End" ? 2 : -1;
    if (j >= 0) { e.preventDefault(); go(TABS[j].id, true); }
  };

  const byCard = useMemo(() => Object.fromEntries(compounds.map((c) => [c.slug, c])), [compounds]);
  const caffeine = findCell(servings, brew, "caffeine", sp)!;
  const brewInfo = servings.brews.find((b) => b.slug === brew)!;
  const ml = brewInfo.servingMl;
  const cupName = `${spInfo[sp].name} · ${roastName[roast].toLowerCase()} · ${brewName[brew].toLowerCase()}`;

  // area ∝ mg on one scale shared by every cup, so switching brews compares honestly
  const maxMg = Math.max(...servings.cells.filter((c) => c.compound !== "kahweol").map((c) => c.mg ?? c.hi ?? 0));
  const R = 70;
  const rad = (mg: number) => R * Math.sqrt(mg / maxMg);
  const circles = layoutCup(CUP.map((slug) => {
    const c = findCell(servings, brew, slug, sp);
    const top = c ? (c.mg ?? c.hi) : null;
    return { slug, sourced: !!c, r: top != null ? rad(top) : 22, rLo: c && c.mg == null && c.lo != null ? rad(c.lo) : null, text: amount(c) };
  }));
  const cupCaption = `${cupName}, ${ml} ml. ` + CUP.map((s) => `${cupLabel[s]}: ${amount(findCell(servings, brew, s, sp)) ?? "not yet sourced"}`).join("; ") + ".";

  const doses: [number, number][] = [[8, caffeine.mg!], ...(second ? [[13, caffeine.mg!] as [number, number]] : [])];
  const left = (h: number) => Math.round(remaining(23, doses, h));
  const panel = (id: Tab) => ({
    id,
    ...(mounted ? { role: "tabpanel", "aria-labelledby": `tab-${id}`, tabIndex: 0, hidden: tab !== id } : {}),
    className: "scroll-mt-20 pt-7 focus-visible:outline-none",
  });
  const next = (id: Tab, label: string) => (
    <p className="mt-5 flex justify-end">
      <a href={`#${id}`} className="link inline-flex min-h-11 items-center text-[15px] font-semibold" onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>
    </p>
  );
  const sectionHead = (n: number, title: string, lead: ReactNode, badge?: boolean) => (
    <header className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2.5"><span className="label-mono">{n} of 3</span>{badge && <span className="badge-illustrative">Illustrative</span>}</div>
      <h2 className="text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[34px]">{title}</h2>
      <p className="max-w-[58ch] text-muted-foreground">{lead}</p>
    </header>
  );

  const cga = findCell(servings, brew, "cga", sp);
  const cafF = findCell(servings, "filter", "cafestol", sp)!, cafP = findCell(servings, "french-press", "cafestol", sp)!;
  const cross = servings.crossCheck.find((c) => c.brew === brew);
  const placed = speciesData.placed;
  const scaleMax = 3;

  return (
    <div>
      {/* ---- tab bar ---- */}
      <nav ref={barRef} aria-label="Overview sections" className="sticky top-0 z-10 -mx-1 mt-6 bg-background px-1 py-2.5">
        <div {...(mounted ? { role: "tablist", "aria-label": "What's in your cup" } : {})} className="flex max-w-[620px] gap-1 rounded-full bg-muted p-1">
          {TABS.map((t, i) => {
            const sel = mounted ? tab === t.id : t.id === "cup";
            return (
              <a
                key={t.id}
                ref={(el) => { tabRefs.current[t.id] = el; }}
                id={`tab-${t.id}`}
                href={`#${t.id}`}
                {...(mounted ? { role: "tab", "aria-selected": sel, "aria-controls": t.id, tabIndex: sel ? 0 : -1 } : {})}
                onClick={(e) => { e.preventDefault(); go(t.id); }}
                onKeyDown={(e) => onKey(e, i)}
                className={`tab inline-flex min-h-11 flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[15px] sm:px-4 ${sel && mounted ? "bg-primary font-bold text-primary-foreground" : "font-medium text-muted-foreground hover:text-foreground"}`}
              >
                <span className="font-mono text-[11px]">{t.n}</span>
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.long}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* ---- 1 · Build a cup ---- */}
      <section {...panel("cup")}>
        {sectionHead(1, "Build a cup", <>Pick a species, a roast and a brew. Circle area is proportional to mg; a dotted grey ring is a value not yet sourced.</>)}
        <div className="mt-5 flex flex-wrap items-stretch gap-3 md:gap-6">
          <form aria-label="Cup settings" onSubmit={(e) => e.preventDefault()} className="flex min-w-0 flex-[1_1_300px] flex-col gap-5 rounded-[14px] border border-border bg-card p-5 md:max-w-[400px] md:p-6">
            <Pills legend="1 · Species" options={SPECIES} value={sp} onChange={setSp} label={(s) => spInfo[s].name} dot={(s) => spInfo[s].colour} />
            <Pills legend="2 · Roast" options={ROASTS} value={roast} onChange={setRoast} label={(r) => roastName[r]} />
            <Pills legend={<>3 · Brew · {ml} ml</>} options={BREWS} value={brew} onChange={setBrew} label={(b) => brewName[b]} />
            <noscript><p className="cap">The pickers need JavaScript; the cup below is arabica, medium roast, filter.</p></noscript>
          </form>
          <div className="flex min-w-0 flex-[2_1_520px] flex-wrap items-center gap-x-6 gap-y-2 rounded-[14px] border border-border bg-card p-5 md:px-7 md:py-6">
            <figure className="m-0 min-w-0 flex-[1_1_280px]">
              <CupDrawing circles={circles} caption={cupCaption} />
              <figcaption className="cap mt-1.5 text-center">
                {cupName}, {ml} ml. Caffeine {amount(caffeine)}
                <Fn ids={caffeine.figures} figures={figures} /> ({caffeine.calc}).
                {cga && <> CGA {amount(cga)}<Fn ids={cga.figures} figures={figures} />.</>}
                {" "}Each circle is a card under <a className="link" href="#molecules" onClick={(e) => { e.preventDefault(); go("molecules"); }}>The molecules</a>.
              </figcaption>
            </figure>
            <Fold wide={wide} title="What your choices change" className="w-full min-w-0 flex-[1_1_220px] border-t border-border md:border-0">
              <div className="flex flex-col pb-2 md:pb-0">
                <span className="label-mono mb-1.5 hidden md:block">What your choices change</span>
                <div className="border-t border-border py-2.5">
                  <strong className="font-semibold">Species</strong>
                  <p className="cap">
                    {sp === "arabica" || sp === "robusta" ? (
                      <>Robusta beans carry more caffeine: {placed[1].lo}–{placed[1].hi}% of dry weight vs {placed[0].lo}–{placed[0].hi}% for arabica<Fn ids={[placed[0].figure, placed[1].figure]} figures={figures} />;
                        50% more in mature beans in one study<Fn ids={[speciesData.ratio.figure]} figures={figures} />. The cup's caffeine figure is for coffee as brewed: its source doesn't name a species.</>
                    ) : (
                      <>{spInfo[sp].name} is reported together with {sp === "liberica" ? "excelsa" : "liberica"}: 1.2–3.8 g caffeine per 100 g dry bean<Fn ids={[speciesData.notPlaced[0].figure]} figures={figures} />. Chlorogenic acids per cup are <span className="ph">[mg]</span> for {spInfo[sp].name.toLowerCase()}.</>
                    )}
                  </p>
                </div>
                <div className="border-t border-border py-2.5">
                  <strong className="font-semibold">Roast</strong>
                  <p className="cap">Drastic roasting can destroy up to 95% of chlorogenic acids<Fn ids={["cga-roast-loss"]} figures={figures} />. The sources give one caffeine figure per brew, not per roast, so the cup stays the same.</p>
                </div>
                <div className="border-t border-border py-2.5">
                  <strong className="font-semibold">Brew</strong>
                  <p className="cap">
                    {brew === "filter" && <>Paper filters hold back cafestol: {amount(cafF)} in this cup<Fn ids={["cafestol-filter"]} figures={figures} />, vs {amount(cafP)} in a French press<Fn ids={["cafestol-french-press"]} figures={figures} />. </>}
                    {brew === "french-press" && <>No paper filter, so more cafestol: {amount(cafP)}<Fn ids={["cafestol-french-press"]} figures={figures} />, vs {amount(cafF)} for filter. Caffeine is from a 1:10 lab brew of Kona arabica. </>}
                    {brew === "espresso" && <>A small, strong serving: {fmt(ml)} ml. </>}
                    {brew === "cold-brew" && <>Measured undiluted, at 1 g coffee to 10 ml water; cold brew is often diluted before drinking, and this figure is not. </>}
                    {cross && <>USDA lists {cross.mg} mg for the same amount ({cross.calc})<Fn ids={[cross.figure]} figures={figures} />. </>}
                    {brewInfo.servingNote}
                  </p>
                </div>
                <p className="cap border-t border-border pt-2.5">Decaf isn't caffeine-free: USDA lists {servings.decaf.mgPer100g} mg per 100 g brewed, about {servings.decaf.mgPerCup} mg a cup<Fn ids={[servings.decaf.figure]} figures={figures} />.</p>
              </div>
            </Fold>
          </div>
        </div>
        <Fold wide={wide} summaryOnWide title="Species, side by side" className="mt-3 rounded-[14px] border border-border bg-card px-5">
          <figure className="m-0 pb-5">
            <div role="img" aria-labelledby="sp-cap" className="grid gap-3 pt-1">
              {placed.map((p) => (
                <div key={p.species} className="grid grid-cols-[72px_1fr] items-center gap-3 sm:grid-cols-[96px_1fr_120px]">
                  <span className="font-mono text-xs font-semibold" style={{ color: spInfo[p.species].colour }}>{p.species}</span>
                  <div className="relative h-[18px] rounded-full bg-muted">
                    <div className="absolute inset-y-0 rounded-full" style={{ left: `${(p.lo / scaleMax) * 100}%`, width: `${((p.hi - p.lo) / scaleMax) * 100}%`, background: `color-mix(in srgb, ${spInfo[p.species].colour} 35%, transparent)`, outline: p.species === sp ? `2px solid ${spInfo[p.species].colour}` : "none", outlineOffset: 2 }} />
                  </div>
                  <span className="col-start-2 font-mono text-xs sm:col-start-auto">{p.lo}–{p.hi}%<Fn ids={[p.figure]} figures={figures} /></span>
                </div>
              ))}
              <div className="grid grid-cols-[72px_1fr] gap-3 sm:grid-cols-[96px_1fr_120px]">
                <span />
                <div className="flex justify-between font-mono text-[11px] text-muted-foreground">{[0, 1, 2, 3].map((v) => <span key={v}>{v}%</span>)}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="label-mono">Not placed:</span>
              {speciesData.notPlaced.map((p) => (
                <span key={p.species} className="pill min-h-9 text-[13px]" style={{ outline: p.species === sp ? `2px solid ${spInfo[p.species].colour}` : undefined }}>
                  <span className="dot" style={{ background: spInfo[p.species].colour }} />{p.species} <span className="ph">[%]</span>
                </span>
              ))}
            </div>
            <figcaption id="sp-cap" className="cap mt-2">
              Caffeine in the bean, % of dry weight. Arabica {placed[0].lo}–{placed[0].hi}%, robusta {placed[1].lo}–{placed[1].hi}% (Peng et al. 2025, a review<Fn ids={[placed[0].figure]} figures={figures} />; it doesn't say green or roasted).
              In Perrois et al. 2015, mature robusta beans had 50% more than arabica<Fn ids={[speciesData.ratio.figure]} figures={figures} />. Liberica and excelsa are reported only together, 1.2–3.8 g/100 g<Fn ids={[speciesData.notPlaced[0].figure]} figures={figures} />, too wide to place.
            </figcaption>
          </figure>
        </Fold>
        {next("molecules", "Next: The molecules →")}
      </section>

      {/* ---- 2 · The molecules ---- */}
      <section {...panel("molecules")}>
        {sectionHead(2, "The molecules", <>One per circle in your cup. Structures and properties from PubChem.</>)}
        <div className="mt-5 flex flex-wrap items-start gap-3 md:gap-6">
          {(() => {
            const c = byCard.caffeine;
            return (
              <figure className="m-0 flex min-w-0 flex-[1_1_380px] flex-col gap-2 rounded-[14px] border border-border bg-card p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a href={`${BASE}compounds/caffeine/`} className="inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-[-0.02em] hover:underline">
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="var(--caffeine)" fillOpacity={0.35} stroke="var(--caffeine)" /></svg>
                    Caffeine
                  </a>
                  <span className="label-mono">1,3,7-trimethylxanthine</span>
                </div>
                {c.structure && <Structure structure={c.structure} label="Skeletal structure of caffeine: a six-membered ring fused to a five-membered ring, four nitrogens, two carbonyl oxygens and three methyl groups" bond={34} maxHeight={230} className="text-foreground" />}
                <figcaption className="cap text-center">2D layout from PubChem's depiction of CID {c.cid}. Unlabelled vertices are carbon.</figcaption>
                <dl className="m-0 grid grid-cols-2 gap-x-6 border-t border-border pt-3 font-mono text-sm">
                  {[
                    ["Formula", c.formula],
                    ["Molar mass", <>{c.molWeight} g/mol<Fn ids={["mw-caffeine"]} figures={figures} /></>],
                    ["PubChem CID", <a className="link" href={`https://pubchem.ncbi.nlm.nih.gov/compound/${c.cid}`}>{c.cid}</a>],
                    ["XLogP3", <>{c.xlogp}<Fn ids={["xlogp-caffeine"]} figures={figures} /></>],
                    ["In your cup", <>{amount(caffeine)} · {brewName[brew].toLowerCase()}<Fn ids={caffeine.figures} figures={figures} /></>],
                  ].map(([k, v], i) => (
                    <div key={i} className="py-1.5">
                      <dt className="label-mono">{k}</dt>
                      <dd className="m-0 mt-0.5">{v}</dd>
                    </div>
                  ))}
                </dl>
              </figure>
            );
          })()}
          <div className="grid min-w-0 flex-[1.3_1_440px] gap-3 sm:grid-cols-2">
            {(["cga", "trigonelline", "cafestol", "melanoidins"] as const).map((slug) => {
              const c = byCard[slug];
              const k = slug === "cafestol" ? byCard.kahweol : null;
              const cell = slug === "melanoidins" ? undefined : findCell(servings, brew, slug, sp);
              const ring = slug === "melanoidins" ? "line" : cell ? "solid" : "dotted";
              return (
                <a key={slug} href={`${BASE}compounds/${cardSlug[slug]}/`} className="flex min-w-0 gap-3 rounded-[14px] border border-border bg-card p-4 text-foreground hover:border-primary-strong sm:flex-col">
                  <div className="flex h-[76px] w-[96px] flex-none items-center justify-center rounded-[10px] bg-muted/60 p-1.5 sm:h-[104px] sm:w-full" aria-hidden="true">
                    {c.structure ? <Structure structure={c.structure} label="" bond={slug === "cga" ? 16 : 22} maxHeight={96} className="text-foreground" /> :
                      <span className="text-center font-mono text-[11px] text-muted-foreground">no single<br />structure</span>}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="hidden label-mono sm:block">{c.class}</span>
                    <span className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" className="flex-none">
                        {ring === "line" ? <line x1="3" x2="15" y1="9" y2="9" stroke="var(--unsourced)" /> :
                          <circle cx="9" cy="9" r="7.5" fill={ring === "solid" ? "var(--compound)" : "none"} fillOpacity={0.35} stroke={ring === "solid" ? "var(--compound)" : "var(--unsourced)"} strokeDasharray={ring === "dotted" ? "2 3" : undefined} />}
                      </svg>
                      <strong className="text-[17px] font-bold tracking-[-0.02em]">{slug === "cafestol" ? "Cafestol + kahweol" : c.name}</strong>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {slug === "melanoidins" ? "a class · no PubChem CID" : slug === "cafestol" ? `${c.formula} · ${k?.formula}` : `${c.formula} · ${c.molWeight} g/mol · CID ${c.cid}`}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      in your cup: {slug === "melanoidins" ? "not drawn" : (amount(cell) ?? <span className="ph">[mg]</span>)}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
        <Fold wide={wide} title="Show molar masses" className="mt-3 rounded-[14px] border border-border bg-card px-5 md:mt-8 md:border-0 md:bg-transparent md:px-0">
          <div className="flex flex-wrap items-start gap-x-10 gap-y-3 pb-5">
            <div className="hidden flex-[1_1_240px] flex-col gap-2 md:flex">
              <span className="label-mono">Molar mass, g/mol</span>
              <p className="max-w-[34ch] text-muted-foreground">5-CQA is almost twice caffeine's size. Melanoidins are polymers: no single mass, no bar.</p>
            </div>
            <figure className="m-0 min-w-0 flex-[2_1_460px]">
              <div role="img" aria-labelledby="mm-cap" className="flex flex-col gap-3">
                {compounds.filter((c) => c.molWeight != null).sort((a, b) => b.molWeight! - a.molWeight!).map((c) => (
                  <div key={c.slug} className="flex items-center gap-2.5">
                    <span className={`w-[96px] flex-none font-mono text-xs ${c.slug === "caffeine" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{c.slug === "cga" ? "5-CQA" : c.name}</span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="h-[20px] rounded-full" style={{ width: `${(c.molWeight! / 400) * 85}%`, background: `color-mix(in srgb, ${compoundColour(c.slug)} 35%, transparent)` }} />
                      <span className="whitespace-nowrap font-mono text-[13px]">{c.molWeight}<Fn ids={[`mw-${c.slug}`]} figures={figures} /></span>
                    </div>
                  </div>
                ))}
              </div>
              <figcaption id="mm-cap" className="cap mt-2.5">Molecular weight in g/mol, PubChem's computed property: {compounds.filter((c) => c.molWeight != null).map((c) => `${c.slug === "cga" ? "5-CQA" : c.name} ${c.molWeight}`).join(", ")}. Scale 0–400.</figcaption>
            </figure>
          </div>
        </Fold>
        {next("pukaw", "Next: How long it lasts →")}
      </section>

      {/* ---- 3 · How long it lasts (Pukaw) ---- */}
      <section {...panel("pukaw")}>
        {sectionHead(3, "How long it lasts", <>Pukaw (“to wake”): the caffeine from the cup you built, through an illustrative one-compartment model with EFSA's half-life range. Shape, not measurement.</>, true)}
        <div className="mt-5 flex flex-wrap items-start gap-3 md:gap-6">
          <form aria-label="Curve settings" onSubmit={(e) => e.preventDefault()} className="flex min-w-0 flex-[1_1_280px] flex-col gap-5 rounded-[14px] border border-border bg-card p-5 md:max-w-[360px] md:p-6">
            <div className="flex flex-col gap-1">
              <span className="label-mono">Your cup · 08:00</span>
              <span className="text-[15px] font-semibold">{cupName}</span>
              <span className="font-mono text-[13px] text-muted-foreground">{amount(caffeine)} · from the Cup tab<Fn ids={caffeine.figures} figures={figures} /></span>
              <a href="#cup" className="link inline-flex min-h-11 items-center text-sm" onClick={(e) => { e.preventDefault(); go("cup"); }}>Change the cup →</a>
            </div>
            <fieldset className="m-0 border-0 p-0">
              <legend className="label-mono mb-2">Second cup · 13:00</legend>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className="pill" aria-pressed={!second} onClick={() => setSecond(false)}>None</button>
                <button type="button" className="pill" aria-pressed={second} onClick={() => setSecond(true)}>Same cup again</button>
              </div>
            </fieldset>
            <div className="flex flex-col gap-1">
              <label htmlFor="hl" className="label-mono flex justify-between"><span>Half-life</span><span className="text-foreground">{fmt(hl)} h</span></label>
              <input id="hl" type="range" min={guidance.halfLifeH.lo} max={guidance.halfLifeH.hi} step={0.5} value={hl}
                onChange={(e) => setHl(Number(e.target.value))} className="h-11 w-full" style={{ accentColor: "var(--caffeine)" }}
                aria-valuetext={`${fmt(hl)} hours`} />
              <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>{guidance.halfLifeH.lo} h</span><span>EFSA range<Fn ids={[guidance.halfLifeH.figure]} figures={figures} /></span><span>{guidance.halfLifeH.hi} h</span>
              </div>
            </div>
            <div className="border-t border-border pt-4" aria-live="polite">
              <span className="label-mono">At 23:00</span>
              <div className="mt-1 text-[34px] font-bold tracking-[-0.03em]">≈{left(hl)} <span className="font-mono text-base font-medium">mg left</span></div>
              <p className="cap">≈{left(guidance.halfLifeH.lo)} mg at a {guidance.halfLifeH.lo} h half-life, ≈{left(guidance.halfLifeH.hi)} mg at {guidance.halfLifeH.hi} h.</p>
            </div>
          </form>
          <figure className="m-0 min-w-0 flex-[2_1_520px] rounded-[14px] border border-border bg-card p-4 md:p-6">
            <PukawChart doses={doses} hl={hl} guidance={guidance} narrow={narrow} captionId="pk-cap" />
            <figcaption id="pk-cap" className="cap mt-2">
              mg of caffeine in the body, illustrative one-compartment model with absorption drawn as instant. Half-life {fmt(hl)} h; dotted curves at {guidance.halfLifeH.lo} h and {guidance.halfLifeH.hi} h, EFSA's range<Fn ids={[guidance.halfLifeH.figure]} figures={figures} />.
              Your {brewName[brew].toLowerCase()} cup, {amount(caffeine)}, at 08:00{second ? " and again at 13:00" : ""}: ≈{left(hl)} mg left at 23:00.
              The lines are EFSA's 2015 dose figures, drawn for scale: {guidance.singleDoseMg.value} mg in one sitting raised no safety concern for healthy adults<Fn ids={[guidance.singleDoseMg.figure]} figures={figures} />;
              {" "}{guidance.sleepDoseMg.value} mg may affect sleep in some adults, particularly near bedtime<Fn ids={[guidance.sleepDoseMg.figure]} figures={figures} />. They are doses taken at once, not amounts left in the body.
            </figcaption>
          </figure>
        </div>
        <aside className="band mt-3 text-[14px] leading-relaxed" aria-label="This curve is not you">
          <strong className="font-bold">This curve is not you.</strong>{" "}
          Your own clearance depends on genes (CYP1A2), smoking, pregnancy, oral contraceptives and liver function, none of which this curve models. In pregnancy EFSA reports half-lives of {guidance.halfLifePregnancyH.lo}–{guidance.halfLifePregnancyH.hi} h<Fn ids={[guidance.halfLifePregnancyH.figure]} figures={figures} />. It takes no body weight and computes no personal dose.
        </aside>
        {next("cup", "Back to: Build a cup ↺")}
      </section>
    </div>
  );
}
