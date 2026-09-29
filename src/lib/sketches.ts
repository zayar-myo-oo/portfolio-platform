/**
 * Interactive sketches that exist in code and can be attached to an
 * Experiment from the CMS. Keys must match the registry in
 * components/experiments/sketch-host.tsx.
 */
export const SKETCH_CATALOG = {
  "signal-field": { label: "Signal Field — WebGL shader", webgl: true },
  "type-lab": { label: "Variable Type Lab — DOM + variable fonts", webgl: false },
} as const;

export type SketchKey = keyof typeof SKETCH_CATALOG;

export const SKETCH_KEYS = Object.keys(SKETCH_CATALOG) as SketchKey[];

export function isSketchKey(value: string | null | undefined): value is SketchKey {
  return Boolean(value && value in SKETCH_CATALOG);
}
