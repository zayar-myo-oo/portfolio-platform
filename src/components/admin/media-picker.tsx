"use client";

import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { listMediaOptions, type MediaOption } from "@/server/actions/admin/common";
import { uploadMediaInline } from "@/server/actions/admin/media";
import { cn } from "@/lib/utils";

/** Ordered multi-image field (project galleries). Submits repeated hidden inputs. */
export function GalleryField({
  label,
  name,
  defaultValue = [],
}: {
  label: string;
  name: string;
  defaultValue?: Array<{ id: string; url: string; alt: string }>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState(defaultValue);
  const [options, setOptions] = useState<MediaOption[] | null>(null);
  const [pending, startTransition] = useTransition();

  const open = () => {
    dialog.current?.showModal();
    startTransition(async () => setOptions(await listMediaOptions()));
  };
  const toggle = (option: MediaOption) =>
    setItems((current) =>
      current.some((item) => item.id === option.id)
        ? current.filter((item) => item.id !== option.id)
        : [...current, { id: option.id, url: option.url, alt: option.alt }],
    );
  const move = (index: number, delta: number) =>
    setItems((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(Math.max(0, Math.min(copy.length, index + delta)), 0, item);
      return copy;
    });

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium">{label}</span>
      {items.map((item) => (
        <input key={item.id} type="hidden" name={name} value={item.id} />
      ))}
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {items.map((item, index) => (
          <li key={item.id} className="group relative aspect-square overflow-hidden rounded-sm border border-line bg-paper-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
            <img src={item.url} alt={item.alt} className="size-full object-cover" />
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <button type="button" onClick={() => move(index, -1)} className="rounded-xs bg-ink/80 px-1.5 text-xs text-ink-inverse" aria-label="Move earlier">
                ←
              </button>
              <button type="button" onClick={() => setItems((c) => c.filter((i) => i.id !== item.id))} className="rounded-xs bg-experimental px-1.5 text-xs text-white" aria-label="Remove image">
                ×
              </button>
              <button type="button" onClick={() => move(index, 1)} className="rounded-xs bg-ink/80 px-1.5 text-xs text-ink-inverse" aria-label="Move later">
                →
              </button>
            </div>
          </li>
        ))}
        <li>
          <button type="button" onClick={open} className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-line-strong text-xs text-ink-3 hover:border-ink hover:text-ink">
            <Icon name="plus" /> Add
          </button>
        </li>
      </ul>
      <dialog ref={dialog} aria-label="Choose gallery images" className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-ink/40">
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="font-semibold">Select images ({items.length})</p>
          <button type="button" onClick={() => dialog.current?.close()} className="h-8 rounded-md bg-ink px-3 text-xs text-ink-inverse">
            Done
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {pending && !options ? <p className="label animate-pulse">Loading library…</p> : null}
          {options && !options.some((o) => o.kind === "IMAGE") ? <p className="text-sm text-ink-3">Upload images in Media first.</p> : null}
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {(options ?? [])
              .filter((option) => option.kind === "IMAGE")
              .map((option) => {
                const selected = items.some((item) => item.id === option.id);
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(option)}
                      className={cn("relative block aspect-square w-full overflow-hidden rounded-sm border", selected ? "border-accent ring-2 ring-accent" : "border-line hover:border-ink")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                      <img src={option.url} alt={option.alt || option.name} loading="lazy" className="size-full object-cover" />
                      {selected ? <Icon name="check" className="absolute top-1 right-1 rounded-full bg-accent p-0.5 text-on-accent" /> : null}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </dialog>
    </div>
  );
}

/**
 * Pick a media item (or upload one) for a single-media field. Uses a native
 * <dialog> for focus management; the chosen id is submitted via a hidden input.
 */
export function MediaPicker({
  label,
  name,
  defaultValue,
  kind = "IMAGE",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: { id: string; url: string; alt: string } | null;
  kind?: "IMAGE" | "VIDEO";
  hint?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(defaultValue ?? null);
  const [options, setOptions] = useState<MediaOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const open = () => {
    dialog.current?.showModal();
    startTransition(async () => setOptions(await listMediaOptions()));
  };

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const data = new FormData();
    data.append("files", files[0]);
    setError(null);
    startTransition(async () => {
      const result = await uploadMediaInline(data);
      if (result.error) setError(result.error);
      else if (result.media) {
        setValue({ id: result.media.id, url: result.media.url, alt: result.media.alt });
        dialog.current?.close();
      }
    });
  };

  const visible = (options ?? []).filter((option) => option.kind === kind);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <div className="flex items-center gap-3 rounded-md border border-line bg-paper p-2">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-paper-sunken">
          {value ? (
            kind === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, already-optimised library asset
              <img src={value.url} alt={value.alt} className="size-full object-cover" />
            ) : (
              <Icon name="play" className="absolute inset-0 m-auto text-ink-3" />
            )
          ) : (
            <Icon name="image" className="absolute inset-0 m-auto text-ink-3" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={open} className="h-8 rounded-md border border-line px-3 text-xs hover:border-ink">
            {value ? "Change" : "Choose"}
          </button>
          {value ? (
            <button type="button" onClick={() => setValue(null)} className="h-8 rounded-md px-3 text-xs text-ink-3 hover:text-experimental">
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}

      <dialog ref={dialog} aria-label={`Choose ${label.toLowerCase()}`} className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="font-semibold">{label}</p>
          <div className="flex items-center gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 text-xs text-ink-inverse">
              <Icon name="upload" size={13} /> Upload
              <input
                type="file"
                className="sr-only"
                accept={kind === "IMAGE" ? "image/png,image/jpeg,image/webp,image/gif,image/avif" : "video/mp4,video/webm"}
                onChange={(event) => upload(event.target.files)}
              />
            </label>
            <button type="button" onClick={() => dialog.current?.close()} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-ink/[0.06]" aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {error ? <p role="alert" className="mb-3 text-sm text-experimental">{error}</p> : null}
          {pending && !options ? <p className="label animate-pulse">Loading library…</p> : null}
          {options && visible.length === 0 ? <p className="text-sm text-ink-3">No {kind === "IMAGE" ? "images" : "videos"} yet — upload one.</p> : null}
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {visible.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    setValue({ id: option.id, url: option.url, alt: option.alt });
                    dialog.current?.close();
                  }}
                  className={cn(
                    "group relative block aspect-square w-full overflow-hidden rounded-sm border bg-paper-sunken",
                    value?.id === option.id ? "border-accent ring-2 ring-accent" : "border-line hover:border-ink",
                  )}
                  title={option.name}
                >
                  {option.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin grid thumbnail
                    <img src={option.url} alt={option.alt || option.name} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs text-ink-3">{option.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </div>
  );
}
