"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Variable Type Lab — each glyph maps pointer distance onto the display
 * face's weight and width axes. Pure DOM + CSS custom properties: no canvas,
 * fully selectable and accessible text. Controls let you set the resting
 * axes and the lens radius; keyboard users can drive it with the sliders.
 */
export default function TypeLab() {
  const [text, setText] = useState("Signal & noise");
  const [baseWeight, setBaseWeight] = useState(300);
  const [baseWidth, setBaseWidth] = useState(100);
  const [radius, setRadius] = useState(220);
  const stage = useRef<HTMLDivElement>(null);
  const ids = useId();

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const letters = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-glyph]"));
    const pointer = { x: -1e4, y: -1e4 };
    let frame = 0;

    const render = () => {
      frame = 0;
      for (const letter of letters) {
        const rect = letter.getBoundingClientRect();
        const d = Math.hypot(pointer.x - (rect.left + rect.width / 2), pointer.y - (rect.top + rect.height / 2));
        const t = reduced ? 0 : Math.max(0, 1 - d / radius);
        const e = t * t * (3 - 2 * t);
        const weight = baseWeight + (800 - baseWeight) * e;
        const width = baseWidth - (baseWidth - 75) * e;
        letter.style.fontVariationSettings = `"wght" ${weight.toFixed(0)}, "wdth" ${width.toFixed(1)}, "opsz" 96`;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      schedule();
    };
    const onLeave = () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
      schedule();
    };
    render();
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [text, baseWeight, baseWidth, radius]);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={stage} className="flex flex-1 touch-none items-center justify-center overflow-hidden px-6">
        <p className="display text-center text-[clamp(3rem,1rem+9vw,11rem)] leading-[0.9] break-words" aria-label={text}>
          {Array.from(text).map((char, i) =>
            char === " " ? (
              <span key={i}> </span>
            ) : (
              <span key={i} data-glyph aria-hidden className="inline-block transition-[font-variation-settings] duration-200 ease-out">
                {char}
              </span>
            ),
          )}
        </p>
      </div>
      <div className="grid gap-4 border-t border-line bg-surface/80 p-4 backdrop-blur sm:grid-cols-4">
        <label className="flex flex-col gap-1.5" htmlFor={`${ids}-text`}>
          <span className="label">Text</span>
          <input
            id={`${ids}-text`}
            value={text}
            maxLength={40}
            onChange={(event) => setText(event.target.value || " ")}
            className="h-9 rounded-md border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none"
          />
        </label>
        {[
          { id: "weight", label: `Weight · ${baseWeight}`, min: 200, max: 700, value: baseWeight, set: setBaseWeight },
          { id: "width", label: `Width · ${baseWidth}`, min: 75, max: 100, value: baseWidth, set: setBaseWidth },
          { id: "radius", label: `Lens · ${radius}px`, min: 80, max: 480, value: radius, set: setRadius },
        ].map((control) => (
          <label key={control.id} className="flex flex-col gap-1.5" htmlFor={`${ids}-${control.id}`}>
            <span className="label">{control.label}</span>
            <input
              id={`${ids}-${control.id}`}
              type="range"
              min={control.min}
              max={control.max}
              value={control.value}
              onChange={(event) => control.set(Number(event.target.value))}
              className="h-9 accent-[var(--accent)]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
