"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { useBrowserValue } from "@/hooks/use-media-query";
import { GeneratedCover } from "@/components/ui/generated-cover";
import { SKETCH_CATALOG, type SketchKey } from "@/lib/sketches";

/**
 * Registry of interactive sketches that can be attached to an Experiment
 * from the CMS (Experiment.sketch). Each sketch is code-split and loaded only
 * when its page is visited; WebGL sketches check for support first and fall
 * back to a still 2D rendering.
 */
const SKETCHES: Record<SketchKey, ComponentType> = {
  "signal-field": dynamic(() => import("./sketches/signal-field"), { ssr: false, loading: () => <Loading /> }),
  "type-lab": dynamic(() => import("./sketches/type-lab"), { ssr: false, loading: () => <Loading /> }),
};

function Loading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="label animate-pulse">Loading sketch…</span>
    </div>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function SketchHost({ sketch, title, seed }: { sketch: string; title: string; seed: string }) {
  const known = sketch in SKETCH_CATALOG;
  const needsWebGL = known && SKETCH_CATALOG[sketch as SketchKey].webgl;
  const support = useBrowserValue<"unknown" | "ok" | "none">(() => (!needsWebGL || supportsWebGL() ? "ok" : "none"), "unknown");

  if (!known) {
    return <Fallback title={title} seed={seed} message="This sketch is not available in this build." />;
  }
  if (support === "unknown") return <Loading />;
  if (support === "none") {
    return <Fallback title={title} seed={seed} message="WebGL isn't available in this browser — here is a still instead." />;
  }
  const Sketch = SKETCHES[sketch as SketchKey];
  return <Sketch />;
}

function Fallback({ title, seed, message }: { title: string; seed: string; message: string }) {
  return (
    <div className="absolute inset-0">
      <GeneratedCover seed={seed} title={title} />
      <p className="label absolute inset-x-0 bottom-4 text-center">{message}</p>
    </div>
  );
}
