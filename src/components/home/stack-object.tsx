"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type StackLayer = { name: string; items: string[] };

/**
 * The hero's spatial object: the owner's actual stack as an exploded
 * architecture diagram. Plates are real DOM (crisp text, no WebGL), laid
 * out with CSS 3D transforms. Pointer tilts the assembly; scrolling through
 * the hero separates the layers. Static isometric view under reduced motion.
 */
export function StackObject({ layers, className }: { layers: StackLayer[]; className?: string }) {
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { rx: 0, ry: 0, spread: 0 };
    const current = { rx: 0, ry: 0, spread: 0 };
    let frame = 0;
    let visible = true;

    const loop = () => {
      current.rx += (target.rx - current.rx) * 0.08;
      current.ry += (target.ry - current.ry) * 0.08;
      current.spread += (target.spread - current.spread) * 0.1;
      el.style.setProperty("--tilt-x", `${current.rx.toFixed(3)}deg`);
      el.style.setProperty("--tilt-y", `${current.ry.toFixed(3)}deg`);
      el.style.setProperty("--spread", current.spread.toFixed(3));
      frame = visible ? requestAnimationFrame(loop) : 0;
    };

    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      target.ry = x * 14;
      target.rx = -y * 10;
    };
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height * 1.2) + 0.25));
      target.spread = progress;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(loop);
    });
    observer.observe(el);

    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    frame = requestAnimationFrame(loop);
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const count = layers.length;

  return (
    <div className={cn("relative select-none", className)}>
      <ul className="sr-only">
        {layers.map((layer) => (
          <li key={layer.name}>
            {layer.name}: {layer.items.join(", ")}
          </li>
        ))}
      </ul>
      <div
        ref={scene}
        aria-hidden
        className="relative mx-auto aspect-square w-full max-w-[34rem] [perspective:1600px]"
        style={{ "--tilt-x": "0deg", "--tilt-y": "0deg", "--spread": "0" } as CSSProperties}
      >
        <div
          className="absolute inset-[14%] [transform-style:preserve-3d]"
          style={{
            transform: "rotateX(calc(56deg + var(--tilt-x))) rotateZ(calc(-40deg + var(--tilt-y)))",
          }}
        >
          {layers.map((layer, i) => {
            const depth = count - 1 - i; // top layer = first item
            const isTop = i === 0;
            return (
              <div
                key={layer.name}
                className={cn(
                  "group absolute inset-0 rounded-xl border p-[7%] [transform-style:preserve-3d]",
                  "transition-[border-color,background-color] duration-500",
                  isTop ? "border-accent/80 bg-surface-raised/90" : "border-line-strong bg-surface-raised/80",
                  "backdrop-blur-[2px]",
                )}
                style={{
                  transform: `translateZ(calc(${depth} * (34px + var(--spread) * 46px)))`,
                  boxShadow: "0 30px 60px -40px rgb(0 0 0 / 0.35)",
                }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className={cn("font-mono text-[0.6rem] tracking-[0.16em] uppercase", isTop ? "text-accent-ink" : "text-ink-2")}>
                      {String(i + 1).padStart(2, "0")} · {layer.name}
                    </span>
                    <span className={cn("size-1.5 rounded-full", isTop ? "bg-accent" : "bg-line-strong")} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.items.slice(0, 4).map((item) => (
                      <span
                        key={item}
                        className="rounded-[4px] border border-line bg-paper/70 px-1.5 py-0.5 font-mono text-[0.6rem] text-ink-2"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Axis: a thin connector through the stack */}
          <div
            className="absolute top-1/2 left-1/2 h-px w-px [transform-style:preserve-3d]"
            style={{ transform: "translateZ(0)" }}
          >
            <div
              className="absolute bg-gradient-to-t from-transparent via-accent/60 to-transparent"
              style={{
                width: 1,
                height: `calc(${count - 1} * (34px + var(--spread) * 46px) + 40px)`,
                transformOrigin: "bottom",
                transform: "rotateX(-90deg) translateY(20px)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
