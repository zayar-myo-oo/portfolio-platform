import "server-only";
import { h, s } from "hastscript";
import type { Element } from "hast";
import { layoutArchitecture, parseArchitecture } from "@/lib/architecture";

/**
 * Static (server-rendered) architecture diagram for Markdown articles.
 * The same layout engine powers the interactive <ArchitectureDiagram />.
 * All text is inserted as text nodes, so the DSL cannot inject markup.
 */
export function architectureToHast(source: string): Element {
  const diagram = parseArchitecture(source);
  const layout = layoutArchitecture(diagram);

  if (diagram.layers.length === 0) {
    return h("div", { className: ["arch-empty"] }, "Architecture diagram is empty.");
  }

  const svg = s(
    "svg",
    {
      viewBox: `0 0 ${layout.width} ${layout.height}`,
      role: "img",
      ariaLabel: "Architecture diagram",
      className: ["arch-svg"],
    },
    [
      s("defs", [
        s(
          "marker",
          {
            id: "arch-arrow-md",
            viewBox: "0 0 10 10",
            refX: 9,
            refY: 5,
            markerWidth: 7,
            markerHeight: 7,
            orient: "auto-start-reverse",
          },
          [s("path", { d: "M 0 0 L 10 5 L 0 10 z", className: ["arch-arrowhead"] })],
        ),
      ]),
      ...layout.layers.map((layer) =>
        s("text", { x: 0, y: layer.y + 4, className: ["arch-layer-label"] }, layer.name.toUpperCase()),
      ),
      ...layout.edges.map((edge) =>
        s("g", { className: ["arch-edge", `arch-edge-${edge.kind}`] }, [
          s("path", {
            d: edge.path,
            fill: "none",
            markerEnd: "url(#arch-arrow-md)",
            markerStart: edge.kind === "both" ? "url(#arch-arrow-md)" : undefined,
          }),
          edge.label
            ? s("text", { x: edge.labelX, y: edge.labelY + 4, textAnchor: "middle", className: ["arch-edge-label"] }, edge.label)
            : null,
        ]),
      ),
      ...layout.nodes.map((node) =>
        s("g", { className: ["arch-node"] }, [
          s("rect", { x: node.x, y: node.y, width: node.w, height: node.h, rx: 8 }),
          s(
            "text",
            { x: node.x + node.w / 2, y: node.y + (node.note ? 25 : 33), textAnchor: "middle", className: ["arch-node-label"] },
            node.label,
          ),
          node.note
            ? s("text", { x: node.x + node.w / 2, y: node.y + 43, textAnchor: "middle", className: ["arch-node-note"] }, node.note)
            : null,
        ]),
      ),
    ],
  );

  const connections = h(
    "ul",
    { className: ["arch-connections"] },
    diagram.edges.map((edge) => {
      const from = layout.nodes.find((n) => n.id === edge.from)?.label ?? edge.from;
      const to = layout.nodes.find((n) => n.id === edge.to)?.label ?? edge.to;
      const arrow = edge.kind === "both" ? "↔" : edge.kind === "async" ? "⇢" : "→";
      return h("li", `${from} ${arrow} ${to}${edge.label ? ` — ${edge.label}` : ""}`);
    }),
  );

  return h("figure", { className: ["arch-figure"] }, [
    h("div", { className: ["arch-scroll"] }, [svg]),
    diagram.edges.length ? h("details", { className: ["arch-details"] }, [h("summary", "Connections"), connections]) : null,
  ]);
}
