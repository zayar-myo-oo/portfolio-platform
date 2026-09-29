"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ThemeChoice = "system" | "light" | "dark";
const ORDER: ThemeChoice[] = ["system", "light", "dark"];
const EVENT = "themechange";

function read(): ThemeChoice {
  try {
    const value = localStorage.getItem("theme");
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function apply(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", choice);
  } catch {
    /* storage unavailable: theme still applies for this page view */
  }
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  window.dispatchEvent(new Event(EVENT));
}

const ICONS = { system: "monitor", light: "sun", dark: "moon" } as const;
const LABELS = { system: "System", light: "Light", dark: "Dark" } as const;

export function ThemeToggle({ className }: { className?: string }) {
  const choice = useSyncExternalStore(subscribe, read, () => "system" as ThemeChoice);
  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink",
        className,
      )}
      aria-label={`Theme: ${LABELS[choice]}. Switch to ${LABELS[next]}.`}
      title={`Theme: ${LABELS[choice]}`}
    >
      <Icon name={ICONS[choice]} size={17} />
    </button>
  );
}
