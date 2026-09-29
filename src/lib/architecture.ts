/**
 * Architecture diagram DSL — a tiny, text-first format for system diagrams.
 *
 *   # comments start with "#"
 *   [Client]   Web App (Next.js), Admin (React)
 *   [Services] API (Spring Boot), Worker
 *   [Data]     PostgreSQL, Redis (cache)
 *
 *   Web App -> API : REST / JSON
 *   API <-> PostgreSQL : SQL
 *   API ~> Worker : queue          (~> = async, rendered dashed)
 *
 * Layers render top-to-bottom; nodes are "Label (note)". Edges reference node
 * labels case-insensitively. Parsing never throws: problems are reported as
 * line-numbered errors so the admin editor can show them inline.
 */

export type ArchNode = { id: string; label: string; note?: string; layer: number };
export type ArchLayer = { name: string; nodes: ArchNode[] };
export type EdgeKind = "sync" | "async" | "both";
export type ArchEdge = { from: string; to: string; label?: string; kind: EdgeKind };
export type ArchError = { line: number; message: string };
export type ArchDiagram = { layers: ArchLayer[]; edges: ArchEdge[]; errors: ArchError[] };

const LAYER_RE = /^\[([^\]]{1,40})\]\s*(.*)$/;
const EDGE_RE = /^(.+?)\s*(<->|->|~>)\s*(.+?)(?:\s*:\s*(.+))?$/;
const NODE_RE = /^(.+?)(?:\s*\(([^)]{1,60})\))?$/;

const MAX_LAYERS = 8;
const MAX_NODES_PER_LAYER = 8;
const MAX_EDGES = 60;

function nodeId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseArchitecture(source: string | null | undefined): ArchDiagram {
  const diagram: ArchDiagram = { layers: [], edges: [], errors: [] };
  if (!source?.trim()) return diagram;

  const byId = new Map<string, ArchNode>();
  const pendingEdges: Array<{ line: number; from: string; to: string; label?: string; kind: EdgeKind }> = [];

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    const lineNo = index + 1;
    if (!line || line.startsWith("#")) return;

    const layerMatch = LAYER_RE.exec(line);
    if (layerMatch) {
      if (diagram.layers.length >= MAX_LAYERS) {
        diagram.errors.push({ line: lineNo, message: `At most ${MAX_LAYERS} layers are supported.` });
        return;
      }
      const layerIndex = diagram.layers.length;
      const layer: ArchLayer = { name: layerMatch[1].trim(), nodes: [] };
      const items = layerMatch[2]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      for (const item of items.slice(0, MAX_NODES_PER_LAYER)) {
        const nodeMatch = NODE_RE.exec(item);
        if (!nodeMatch) continue;
        const label = nodeMatch[1].trim().slice(0, 40);
        const id = nodeId(label);
        if (!id) continue;
        if (byId.has(id)) {
          diagram.errors.push({ line: lineNo, message: `Duplicate node "${label}".` });
          continue;
        }
        const node: ArchNode = { id, label, note: nodeMatch[2]?.trim(), layer: layerIndex };
        byId.set(id, node);
        layer.nodes.push(node);
      }
      if (items.length > MAX_NODES_PER_LAYER) {
        diagram.errors.push({ line: lineNo, message: `At most ${MAX_NODES_PER_LAYER} nodes per layer.` });
      }
      diagram.layers.push(layer);
      return;
    }

    const edgeMatch = EDGE_RE.exec(line);
    if (edgeMatch) {
      const kind: EdgeKind = edgeMatch[2] === "<->" ? "both" : edgeMatch[2] === "~>" ? "async" : "sync";
      pendingEdges.push({
        line: lineNo,
        from: nodeId(edgeMatch[1]),
        to: nodeId(edgeMatch[3]),
        label: edgeMatch[4]?.trim().slice(0, 40),
        kind,
      });
      return;
    }

    diagram.errors.push({
      line: lineNo,
      message: 'Expected a layer ("[Name] A, B") or an edge ("A -> B : label").',
    });
  });

  for (const edge of pendingEdges) {
    if (diagram.edges.length >= MAX_EDGES) break;
    if (!byId.has(edge.from)) {
      diagram.errors.push({ line: edge.line, message: `Unknown node "${edge.from}".` });
      continue;
    }
    if (!byId.has(edge.to)) {
      diagram.errors.push({ line: edge.line, message: `Unknown node "${edge.to}".` });
      continue;
    }
    if (edge.from === edge.to) {
      diagram.errors.push({ line: edge.line, message: "An edge cannot connect a node to itself." });
      continue;
    }
    diagram.edges.push({ from: edge.from, to: edge.to, label: edge.label, kind: edge.kind });
  }

  return diagram;
}

// ── Layout ──────────────────────────────────────────────────────────────────

export type PlacedNode = ArchNode & { x: number; y: number; w: number; h: number };
export type PlacedEdge = ArchEdge & { path: string; labelX: number; labelY: number };
export type PlacedLayer = { name: string; y: number };
export type ArchLayout = {
  width: number;
  height: number;
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  layers: PlacedLayer[];
};

const WIDTH = 960;
const GUTTER_LEFT = 120;
const PAD_RIGHT = 24;
const ROW = 132;
const NODE_H = 58;
const GAP = 20;
const TOP = 28;

export function layoutArchitecture(diagram: ArchDiagram): ArchLayout {
  const nodes: PlacedNode[] = [];
  const layers: PlacedLayer[] = [];
  const usable = WIDTH - GUTTER_LEFT - PAD_RIGHT;

  diagram.layers.forEach((layer, row) => {
    const y = TOP + row * ROW;
    layers.push({ name: layer.name, y: y + NODE_H / 2 });
    const count = Math.max(1, layer.nodes.length);
    const w = Math.min(210, (usable - GAP * (count - 1)) / count);
    const total = w * count + GAP * (count - 1);
    const start = GUTTER_LEFT + (usable - total) / 2;
    layer.nodes.forEach((node, i) => {
      nodes.push({ ...node, x: start + i * (w + GAP), y, w, h: NODE_H });
    });
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: PlacedEdge[] = diagram.edges.flatMap((edge) => {
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) return [];
    return [{ ...edge, ...edgePath(a, b) }];
  });

  const height = TOP * 2 + Math.max(0, diagram.layers.length - 1) * ROW + NODE_H;
  return { width: WIDTH, height, nodes, edges, layers };
}

function edgePath(a: PlacedNode, b: PlacedNode): { path: string; labelX: number; labelY: number } {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;

  if (a.layer === b.layer) {
    // Same row: arc above the nodes
    const [left, right] = a.x < b.x ? [a, b] : [b, a];
    const sx = left.x + left.w;
    const ex = right.x;
    const y = a.y + a.h / 2;
    const path = a.x < b.x ? `M ${sx} ${y} L ${ex} ${y}` : `M ${ex} ${y} L ${sx} ${y}`;
    return { path, labelX: (sx + ex) / 2, labelY: y - 10 };
  }

  const down = b.layer > a.layer;
  const sy = down ? a.y + a.h : a.y;
  const ey = down ? b.y : b.y + b.h;
  const mid = (sy + ey) / 2;
  const path = `M ${ax} ${sy} C ${ax} ${mid}, ${bx} ${mid}, ${bx} ${ey}`;
  return { path, labelX: (ax + bx) / 2, labelY: mid };
}

/** Neighbour lookup used for hover/focus highlighting. */
export function connectedIds(diagram: Pick<ArchDiagram, "edges">, id: string): Set<string> {
  const ids = new Set<string>([id]);
  for (const edge of diagram.edges) {
    if (edge.from === id) ids.add(edge.to);
    if (edge.to === id) ids.add(edge.from);
  }
  return ids;
}
