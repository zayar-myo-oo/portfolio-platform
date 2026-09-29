"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import * as THREE from "three";

/**
 * Signal Field — domain-warped noise rendered as a topographic map, with the
 * pointer acting as a soft attractor. One fragment shader on a full-screen
 * quad; colours come from the site's design tokens and follow the theme.
 *
 * Performance: DPR capped (lower on touch), frame loop paused off-screen and
 * in background tabs; reduced motion renders a single still frame.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform vec3 uPaper;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 3.0;
    vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0) * 3.0;

    float d = length(p - pointer);
    p -= normalize(p - pointer + 1e-4) * 0.45 * exp(-d * d * 1.4) * uPointerStrength;

    float t = uTime * 0.05;
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
    float f = fbm(p + 3.0 * r);

    float contour = abs(fract(f * 14.0) - 0.5);
    float line = smoothstep(0.07, 0.0, contour);

    vec3 col = mix(uPaper, uInk, f * 0.18);
    col = mix(col, uAccent, smoothstep(0.58, 0.92, f) * 0.9);
    col = mix(col, uInk, line * 0.28);
    col += uAccent * exp(-d * d * 3.0) * 0.12 * uPointerStrength;
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Palette = { paper: string; ink: string; accent: string };

/** Theme tokens as a stable string snapshot ("paper|ink|accent"). */
function readPaletteKey(): string {
  const style = getComputedStyle(document.documentElement);
  return [
    style.getPropertyValue("--paper-sunken").trim() || "#0d0e0f",
    style.getPropertyValue("--ink").trim() || "#ece9e2",
    style.getPropertyValue("--accent").trim() || "#ff6a2b",
  ].join("|");
}

function subscribeToTheme(onChange: () => void) {
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const deferred = () => requestAnimationFrame(onChange);
  window.addEventListener("themechange", deferred);
  scheme.addEventListener("change", deferred);
  return () => {
    window.removeEventListener("themechange", deferred);
    scheme.removeEventListener("change", deferred);
  };
}

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function Field({ palette, animate }: { palette: Palette; animate: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { size, invalidate } = useThree();
  const pointer = useRef({ x: 0.5, y: 0.5, strength: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 8 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerStrength: { value: 0 },
      uPaper: { value: new THREE.Color() },
      uInk: { value: new THREE.Color() },
      uAccent: { value: new THREE.Color() },
    }),
    [],
  );

  const appliedPalette = useRef("");

  // A palette change must draw a frame even when the loop is paused ("demand").
  useEffect(() => {
    invalidate();
  }, [palette, invalidate]);

  // Uniforms are mutated through the material (three.js convention), never during render.
  useFrame((state, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    const paletteKey = `${palette.paper}|${palette.ink}|${palette.accent}`;
    if (appliedPalette.current !== paletteKey) {
      u.uPaper.value.set(palette.paper);
      u.uInk.value.set(palette.ink);
      u.uAccent.value.set(palette.accent);
      appliedPalette.current = paletteKey;
    }
    u.uResolution.value.set(size.width, size.height);
    if (!animate) return;
    u.uTime.value += Math.min(delta, 0.05);
    const target = { x: (state.pointer.x + 1) / 2, y: (state.pointer.y + 1) / 2 };
    const p = pointer.current;
    p.x += (target.x - p.x) * 0.06;
    p.y += (target.y - p.y) * 0.06;
    p.strength += ((state.pointer.x === 0 && state.pointer.y === 0 ? 0 : 1) - p.strength) * 0.04;
    u.uPointer.value.set(p.x, p.y);
    u.uPointerStrength.value = p.strength;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}

export default function SignalField() {
  const container = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const paletteKey = useSyncExternalStore(subscribeToTheme, readPaletteKey, () => null);
  const pageVisible = useSyncExternalStore(subscribeToVisibility, useCallback(() => !document.hidden, []), () => true);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarse = useMediaQuery("(pointer: coarse), (max-width: 767px)");
  const palette = useMemo<Palette | null>(() => {
    if (!paletteKey) return null;
    const [paper, ink, accent] = paletteKey.split("|");
    return { paper, ink, accent };
  }, [paletteKey]);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animate = inView && pageVisible && !reduced;

  return (
    <div ref={container} className="absolute inset-0">
      {palette ? (
        <Canvas
          dpr={[1, coarse ? 1.25 : 1.75]}
          gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
          frameloop={animate ? "always" : "demand"}
          camera={{ position: [0, 0, 1] }}
          aria-label="Signal Field — interactive shader. Move the pointer to bend the field."
          role="img"
        >
          <Field palette={palette} animate={animate} />
        </Canvas>
      ) : null}
    </div>
  );
}
