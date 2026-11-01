// A skeletal formula drawn from PubChem's own 2D depiction coordinates (heavy atoms only). Carbons are unlabelled
// vertices; N and O are labelled with their implicit hydrogens and charge. Stereochemistry is not drawn.
import type { Compound } from "@/lib/data/schemas";

const VALENCE: Record<string, number> = { N: 3, O: 2, C: 4 };
const SUB = "₀₁₂₃₄₅₆₇₈₉";

type Props = { structure: NonNullable<Compound["structure"]>; label: string; bond?: number; className?: string; maxHeight?: number };

export default function Structure({ structure, label, bond = 30, className, maxHeight }: Props) {
  const { atoms, bonds } = structure;
  const pad = 16;
  const xs = atoms.map((a) => a[1]);
  const ys = atoms.map((a) => -a[2]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const P = atoms.map((a) => [(a[1] - minX) * bond + pad, (-a[2] - minY) * bond + pad] as const);
  const w = (Math.max(...xs) - minX) * bond + pad * 2;
  const h = (Math.max(...ys) - minY) * bond + pad * 2;

  const used = atoms.map(() => 0);
  const nbrs: number[][] = atoms.map(() => []);
  for (const [a, b, o] of bonds) {
    used[a] += o; used[b] += o;
    nbrs[a].push(b); nbrs[b].push(a);
  }
  const labelled = atoms.map((a) => a[0] !== "C");
  const text = atoms.map(([el, , , q], i) => {
    if (el === "C") return "";
    // Implicit hydrogens: N+ has valence 4, O− valence 1.
    const hs = Math.max(0, (VALENCE[el] ?? 0) + q - used[i]);
    return `${el}${hs ? "H" + (hs > 1 ? SUB[hs] : "") : ""}${q > 0 ? "⁺" : q < 0 ? "⁻" : ""}`;
  });

  const lines: React.ReactNode[] = [];
  bonds.forEach(([a, b, o], k) => {
    let [x1, y1] = P[a], [x2, y2] = P[b];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const cut = 8;
    if (labelled[a]) { x1 += ux * cut; y1 += uy * cut; }
    if (labelled[b]) { x2 -= ux * cut; y2 -= uy * cut; }
    lines.push(<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} />);
    if (o >= 2) {
      // Second line on the side of a neighbouring atom (inside a ring), else on either side of the first.
      const nx = -uy, ny = ux;
      const other = [...nbrs[a].filter((n) => n !== b), ...nbrs[b].filter((n) => n !== a)][0];
      const terminal = labelled[a] || labelled[b] ? nbrs[labelled[a] ? a : b].length === 1 : false;
      if (other === undefined || terminal) {
        const off = 2.6;
        lines.pop();
        lines.push(<line key={`${k}a`} x1={x1 + nx * off} y1={y1 + ny * off} x2={x2 + nx * off} y2={y2 + ny * off} />);
        lines.push(<line key={`${k}b`} x1={x1 - nx * off} y1={y1 - ny * off} x2={x2 - nx * off} y2={y2 - ny * off} />);
      } else {
        const side = Math.sign((P[other][0] - P[a][0]) * nx + (P[other][1] - P[a][1]) * ny) || 1;
        const off = 5 * side, sh = 0.16 * len;
        lines.push(<line key={`${k}b`} x1={x1 + nx * off + ux * sh * (labelled[a] ? 0 : 1)} y1={y1 + ny * off + uy * sh * (labelled[a] ? 0 : 1)}
          x2={x2 + nx * off - ux * sh * (labelled[b] ? 0 : 1)} y2={y2 + ny * off - uy * sh * (labelled[b] ? 0 : 1)} />);
      }
    }
  });

  return (
    <svg viewBox={`0 0 ${w.toFixed(1)} ${h.toFixed(1)}`} width="100%" role="img" aria-label={label} className={className}
      style={{ display: "block", maxHeight: maxHeight ? `${maxHeight}px` : undefined, margin: "0 auto" }}>
      <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">{lines}</g>
      <g fontFamily="var(--font-mono)" fontSize={12} fontWeight={600} textAnchor="middle">
        {atoms.map(([el], i) => text[i] && (
          <text key={i} x={P[i][0]} y={P[i][1] + 4.2} fill={el === "N" ? "var(--fjord-ink)" : "var(--primary-strong)"}>{text[i]}</text>
        ))}
      </g>
    </svg>
  );
}
