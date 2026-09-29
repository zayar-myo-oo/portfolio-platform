import { cn, hashString, seededRandom } from "@/lib/utils";

/**
 * Deterministic "blueprint" cover for projects without imagery.
 * Modules, connectors and registration marks are derived from the slug, so
 * each project gets a stable, distinct composition that reads as *system*
 * rather than stock art. Pure SVG, server-rendered, zero client JS.
 */
const HEX = /^#[0-9a-f]{6}$/i;
const W = 800;
const H = 500;
const CELL = 40;

type Module = { x: number; y: number; w: number; h: number; accent: boolean };

function compose(seed: string): { modules: Module[]; links: Array<[Module, Module]> } {
  const rand = seededRandom(hashString(seed));
  const count = 3 + Math.floor(rand() * 4);
  const modules: Module[] = [];
  let attempts = 0;
  while (modules.length < count && attempts < 60) {
    attempts++;
    const w = CELL * (3 + Math.floor(rand() * 5));
    const h = CELL * (2 + Math.floor(rand() * 3));
    const x = CELL * (1 + Math.floor(rand() * ((W - w) / CELL - 1)));
    const y = CELL * (1 + Math.floor(rand() * ((H - h) / CELL - 1)));
    const inLabelZone = x < 340 && y + h > H - 190;
    const overlaps = inLabelZone || modules.some(
      (m) => x < m.x + m.w + CELL && x + w + CELL > m.x && y < m.y + m.h + CELL && y + h + CELL > m.y,
    );
    if (!overlaps) modules.push({ x, y, w, h, accent: false });
  }
  if (modules.length) modules[Math.floor(rand() * modules.length)].accent = true;
  const links: Array<[Module, Module]> = [];
  for (let i = 1; i < modules.length; i++) links.push([modules[i - 1], modules[i]]);
  return { modules, links };
}

export function GeneratedCover({
  seed,
  title,
  accent,
  label,
  className,
}: {
  seed: string;
  title: string;
  accent?: string | null;
  label?: string;
  className?: string;
}) {
  const { modules, links } = compose(seed);
  const accentColor = accent && HEX.test(accent) ? accent : "var(--accent)";
  const patternId = `grid-${hashString(seed).toString(36)}`;
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMinYMax slice"
      className={cn("size-full", className)}
      role="img"
      aria-label={`Generated cover for ${title}`}
    >
      <defs>
        <pattern id={patternId} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
          <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" style={{ stroke: "var(--grid-line)" }} strokeWidth={1.5} />
        </pattern>
      </defs>
      <rect width={W} height={H} style={{ fill: "var(--paper-sunken)" }} />
      <rect width={W} height={H} fill={`url(#${patternId})`} />

      {links.map(([a, b], i) => {
        const ax = a.x + a.w / 2;
        const ay = a.y + a.h / 2;
        const bx = b.x + b.w / 2;
        const by = b.y + b.h / 2;
        return (
          <path
            key={i}
            d={`M ${ax} ${ay} L ${ax} ${by} L ${bx} ${by}`}
            fill="none"
            style={{ stroke: "var(--line-strong)" }}
            strokeWidth={1.5}
            strokeDasharray={i % 2 ? "4 6" : undefined}
          />
        );
      })}

      {modules.map((m, i) => (
        <g key={i}>
          <rect
            x={m.x}
            y={m.y}
            width={m.w}
            height={m.h}
            rx={6}
            style={{
              fill: m.accent ? accentColor : "var(--surface)",
              stroke: m.accent ? accentColor : "var(--line-strong)",
            }}
            strokeWidth={1.5}
          />
          {!m.accent ? (
            <>
              <rect x={m.x + 14} y={m.y + 14} width={Math.min(90, m.w - 28)} height={6} rx={3} style={{ fill: "var(--line-strong)" }} />
              <rect x={m.x + 14} y={m.y + 28} width={Math.min(54, m.w - 28)} height={6} rx={3} style={{ fill: "var(--line)" }} />
            </>
          ) : null}
        </g>
      ))}

      {/* Registration marks */}
      {[
        [24, 24],
        [W - 24, 24],
        [24, H - 24],
        [W - 24, H - 24],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M ${x - 8} ${y} H ${x + 8} M ${x} ${y - 8} V ${y + 8}`} style={{ stroke: "var(--ink-3)" }} strokeWidth={1} />
      ))}

      {/* Anchored bottom-left: survives cropping in any container aspect ratio */}
      {label ? (
        <text x={40} y={H - 150} style={{ fill: "var(--ink-3)", fontFamily: "var(--nf-code)", fontSize: 15, letterSpacing: "0.12em" }}>
          {label.toUpperCase()}
        </text>
      ) : null}
      <text
        x={34}
        y={H - 40}
        style={{ fill: "var(--ink)", fontFamily: "var(--nf-display)", fontSize: 120, fontWeight: 600, letterSpacing: "-0.06em" }}
      >
        {initials}
      </text>
    </svg>
  );
}
