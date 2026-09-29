"use client";

import Link from "next/link";
import { startTransition, useOptimistic, useState } from "react";
import type { ProjectStatus } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { reorderPortal, setProjectFlag } from "@/server/actions/admin/projects";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: ProjectStatus;
  liveUrl: string | null;
  published: boolean;
  showInPortal: boolean;
  featured: boolean;
  allowEmbed: boolean;
};

type Flag = "published" | "showInPortal" | "featured" | "allowEmbed";
const FLAGS: Array<{ key: Flag; label: string }> = [
  { key: "published", label: "Published" },
  { key: "showInPortal", label: "In portal" },
  { key: "featured", label: "Featured" },
  { key: "allowEmbed", label: "Embed" },
];

/**
 * Portal control room: order (keyboard-accessible move buttons), visibility,
 * featured and embed flags. Updates are optimistic and persist immediately.
 */
export function PortalManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [optimistic, apply] = useOptimistic(rows, (current: Row[], next: Row[]) => next);
  const [error, setError] = useState<string | null>(null);

  const commit = (next: Row[], persist: () => Promise<{ ok: boolean }>) => {
    setError(null);
    startTransition(async () => {
      apply(next);
      const result = await persist();
      if (result.ok) setRows(next);
      else setError("Couldn't save that change — reverted.");
    });
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= optimistic.length) return;
    const next = [...optimistic];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    commit(next, () => reorderPortal(next.map((r) => r.id)));
  };

  const toggle = (id: string, flag: Flag) => {
    const row = optimistic.find((r) => r.id === id);
    if (!row) return;
    const value = !row[flag];
    commit(
      optimistic.map((r) => (r.id === id ? { ...r, [flag]: value } : r)),
      () => setProjectFlag(id, flag, value),
    );
  };

  return (
    <div>
      {error ? <p role="alert" className="mb-4 text-sm text-experimental">{error}</p> : null}
      <ol className="divide-y divide-line rounded-lg border border-line bg-surface">
        {optimistic.map((row, index) => (
          <li key={row.id} className={cn("flex flex-col gap-3 p-3 sm:flex-row sm:items-center", !row.showInPortal && "opacity-60")}>
            <div className="flex items-center gap-2">
              <span className="w-6 text-right font-mono text-xs text-ink-3">{index + 1}</span>
              <div className="flex flex-col">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="px-1 text-ink-3 hover:text-ink disabled:opacity-20" aria-label={`Move ${row.title} up`}>
                  <Icon name="arrow-up" size={13} />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === optimistic.length - 1} className="px-1 text-ink-3 hover:text-ink disabled:opacity-20" aria-label={`Move ${row.title} down`}>
                  <Icon name="arrow-down" size={13} />
                </button>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/admin/projects/${row.id}`} className="font-medium hover:text-accent-ink">
                {row.title}
              </Link>
              <div className="mt-0.5 flex items-center gap-3">
                <StatusBadge status={row.status} bare />
                <span className="truncate font-mono text-xs text-ink-3">{row.liveUrl ?? "no live URL"}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${row.title} settings`}>
              {FLAGS.map((flag) => (
                <button
                  key={flag.key}
                  type="button"
                  aria-pressed={row[flag.key]}
                  onClick={() => toggle(row.id, flag.key)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors",
                    row[flag.key] ? "border-ink bg-ink text-ink-inverse" : "border-line text-ink-3 hover:border-ink hover:text-ink",
                  )}
                >
                  {row[flag.key] ? <Icon name="check" size={11} /> : null}
                  {flag.label}
                </button>
              ))}
              <Link href={`/portal/${row.slug}`} target="_blank" className="inline-flex h-7 items-center rounded-full px-2 text-xs text-ink-3 hover:text-ink" aria-label={`Open ${row.title} in the portal`}>
                <Icon name="external" size={13} />
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
