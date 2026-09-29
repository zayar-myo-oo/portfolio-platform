"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { deleteMedia, updateMediaAlt } from "@/server/actions/admin/media";
import type { ActionState } from "@/server/admin/form";
import { ConfirmDelete } from "./ui";

export type LibraryItem = {
  id: string;
  url: string;
  alt: string;
  name: string;
  kind: "IMAGE" | "VIDEO";
  size: number;
  width: number | null;
  height: number | null;
  usage: number;
};

function AltEditor({ item }: { item: LibraryItem }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMediaAlt.bind(null, item.id), { status: "idle" });
  return (
    <form action={action} className="flex gap-1.5">
      <label className="sr-only" htmlFor={`alt-${item.id}`}>
        Alt text for {item.name}
      </label>
      <input
        id={`alt-${item.id}`}
        name="alt"
        defaultValue={item.alt}
        placeholder="Describe the image"
        className="h-8 min-w-0 flex-1 rounded-sm border border-line bg-paper px-2 text-xs focus:border-ink focus:outline-none"
      />
      <button type="submit" disabled={pending} className="h-8 shrink-0 rounded-sm border border-line px-2 text-xs hover:border-ink disabled:opacity-50" aria-label="Save alt text">
        {state.status === "success" && !pending ? <Icon name="check" size={13} className="text-live" /> : "Save"}
      </button>
    </form>
  );
}

export function MediaLibrary({ items }: { items: LibraryItem[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (item: LibraryItem) => {
    await navigator.clipboard.writeText(item.kind === "IMAGE" ? `![${item.alt}](${item.url} "Caption")` : item.url).catch(() => {});
    setCopied(item.id);
    window.setTimeout(() => setCopied(null), 1400);
  };

  if (!items.length) return <p className="rounded-lg border border-dashed border-line-strong p-10 text-center text-sm text-ink-3">No media yet. Upload images or short videos above.</p>;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
          <div className="relative aspect-[4/3] bg-paper-sunken">
            {item.kind === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of library asset
              <img src={item.url} alt={item.alt} loading="lazy" className="size-full object-cover" />
            ) : (
              <video src={item.url} className="size-full object-cover" muted preload="metadata" />
            )}
            {!item.alt && item.kind === "IMAGE" ? (
              <span className="absolute top-2 left-2 rounded-xs bg-beta px-1.5 font-mono text-[0.625rem] text-ink-inverse uppercase">No alt</span>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <p className="truncate text-xs font-medium" title={item.name}>
              {item.name}
            </p>
            <p className="font-mono text-[0.625rem] text-ink-3">
              {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
              {(item.size / 1024).toFixed(0)} KB · {item.usage ? `used ${item.usage}×` : "unused"}
            </p>
            <AltEditor item={item} />
            <div className="mt-auto flex items-center justify-between pt-1">
              <button type="button" onClick={() => copy(item)} className="text-xs text-ink-2 hover:text-ink">
                {copied === item.id ? "Copied" : item.kind === "IMAGE" ? "Copy Markdown" : "Copy URL"}
              </button>
              <ConfirmDelete action={deleteMedia.bind(null, item.id)} subject={item.name} label="Delete" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
