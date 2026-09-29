"use client";

import { useId, useMemo, useState } from "react";
import { connectedIds, layoutArchitecture, type ArchDiagram } from "@/lib/architecture";
import { cn } from "@/lib/utils";

/**
 * Interactive architecture diagram. Hover or focus a node to trace its
 * connections; everything else recedes. Below `md` the diagram becomes a
 * layered list with a connection table — the same information, readable on
 * a phone and by screen readers.
 */
export function ArchitectureDiagram({ diagram, className }: { diagram: ArchDiagram; className?: string }) {
  const layout = useMemo(() => layoutArchitecture(diagram), [diagram]);
  const [focus, setFocus] = useState<string | null>(null);
  const highlighted = useMemo(() => (focus ? connectedIds(diagram, focus) : null), [diagram, focus]);
  const markerId = useId().replace(/:/g, "");
  const labelOf = (id: string) => layout.nodes.find((node) => node.id === id)?.label ?? id;
  const arrow = (kind: string) => (kind === "both" ? "↔" : kind === "async" ? "⇢" : "→");

  return (
    <figure className={cn("arch-figure", className)}>
      <div className="hidden md:block">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="arch-svg"
          role="group"
          aria-label="Architecture diagram. Focus a component to highlight its connections."
          onPointerLeave={() => setFocus(null)}
        >
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="arch-arrowhead" />
            </marker>
          </defs>

          {layout.layers.map((layer) => (
            <text key={layer.name} x={0} y={layer.y + 4} className="arch-layer-label">
              {layer.name.toUpperCase()}
            </text>
          ))}

          {layout.edges.map((edge, i) => {
            const active = focus !== null && (edge.from === focus || edge.to === focus);
            return (
              <g
                key={i}
                className="transition-opacity duration-300"
                style={{ opacity: focus === null || active ? 1 : 0.15 }}
                aria-hidden
              >
                <path
                  d={edge.path}
                  fill="none"
                  className="arch-edge-path"
                  data-kind={edge.kind}
                  markerEnd={`url(#${markerId})`}
                  markerStart={edge.kind === "both" ? `url(#${markerId})` : undefined}
                  style={active ? { stroke: "var(--accent)", strokeWidth: 1.75 } : undefined}
                />
                {edge.label ? (
                  <text x={edge.labelX} y={edge.labelY + 4} textAnchor="middle" className="arch-edge-label">
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {layout.nodes.map((node) => {
            const dim = highlighted !== null && !highlighted.has(node.id);
            const isFocus = node.id === focus;
            const links = diagram.edges.filter((edge) => edge.from === node.id || edge.to === node.id).length;
            return (
              <g
                key={node.id}
                tabIndex={0}
                role="button"
                aria-label={`${node.label}${node.note ? ` (${node.note})` : ""}, ${links} connection${links === 1 ? "" : "s"}`}
                onPointerEnter={() => setFocus(node.id)}
                onFocus={() => setFocus(node.id)}
                onBlur={() => setFocus(null)}
                className="cursor-default outline-none transition-opacity duration-300 focus-visible:[&>rect]:stroke-[var(--accent)]"
                style={{ opacity: dim ? 0.3 : 1 }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={8}
                  className="arch-node-rect transition-[stroke] duration-300"
                  style={isFocus ? { stroke: "var(--accent)", strokeWidth: 1.75 } : undefined}
                />
                <text x={node.x + node.w / 2} y={node.y + (node.note ? 25 : 33)} textAnchor="middle" className="arch-node-label">
                  {node.label}
                </text>
                {node.note ? (
                  <text x={node.x + node.w / 2} y={node.y + 43} textAnchor="middle" className="arch-node-note">
                    {node.note}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Compact representation: phones and assistive tech */}
      <div className="space-y-4 md:sr-only">
        <ol className="space-y-3">
          {diagram.layers.map((layer) => (
            <li key={layer.name}>
              <p className="label mb-1.5">{layer.name}</p>
              <ul className="flex flex-wrap gap-1.5">
                {layer.nodes.map((node) => (
                  <li key={node.id} className="rounded-sm border border-line-strong bg-surface-raised px-2.5 py-1.5 text-sm">
                    {node.label}
                    {node.note ? <span className="ml-1.5 font-mono text-2xs text-ink-3">{node.note}</span> : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {diagram.edges.length ? (
          <div>
            <p className="label mb-1.5">Connections</p>
            <ul className="space-y-1 font-mono text-xs text-ink-2">
              {diagram.edges.map((edge, i) => (
                <li key={i}>
                  {labelOf(edge.from)} {arrow(edge.kind)} {labelOf(edge.to)}
                  {edge.label ? <span className="text-ink-3"> — {edge.label}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <figcaption className="label mt-3 hidden md:block">Hover or tab through components to trace connections · dashed = async</figcaption>
    </figure>
  );
}
