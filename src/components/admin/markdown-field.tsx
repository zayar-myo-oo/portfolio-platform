"use client";

import { useId, useRef, useState, useTransition } from "react";
import { previewMarkdown } from "@/server/actions/admin/common";
import { cn } from "@/lib/utils";
import { inputClass, useFieldError } from "./form-kit";

const SNIPPETS: Array<{ label: string; insert: string }> = [
  { label: "H2", insert: "\n## Heading\n" },
  { label: "Code", insert: "\n```ts title=\"file.ts\"\n// code\n```\n" },
  { label: "Callout", insert: "\n:::note[Title]\nText\n:::\n" },
  { label: "Diagram", insert: "\n```architecture\n[Client] App\n[Server] API\nApp -> API : REST\n```\n" },
  { label: "Table", insert: "\n| Column | Column |\n| --- | --- |\n| Value | Value |\n" },
];

/**
 * Markdown editor with a live server-rendered preview (same sanitiser,
 * syntax highlighter and diagram renderer as the public pages) and inserts
 * for the supported directives.
 */
export function MarkdownField({
  label,
  name,
  defaultValue,
  rows = 12,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");
  const [pending, startTransition] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);
  const error = useFieldError(name);

  const insert = (text: string) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    el.value = value.slice(0, start) + text + value.slice(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + text.length;
  };

  const showPreview = () => {
    setTab("preview");
    const markdown = area.current?.value ?? "";
    startTransition(async () => setHtml(await previewMarkdown(markdown)));
  };

  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-1" role="tablist" aria-label={`${label} editor mode`}>
          {(["write", "preview"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={tab === mode}
              onClick={() => (mode === "preview" ? showPreview() : setTab("write"))}
              className={cn("h-7 rounded-sm px-2.5 text-xs capitalize", tab === mode ? "bg-ink text-ink-inverse" : "text-ink-3 hover:text-ink")}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className={tab === "write" ? "flex flex-col gap-1.5" : "hidden"}>
        <div className="flex flex-wrap gap-1">
          {SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => insert(snippet.insert)}
              className="h-6 rounded-xs border border-line px-2 font-mono text-[0.625rem] text-ink-3 uppercase hover:border-ink hover:text-ink"
            >
              + {snippet.label}
            </button>
          ))}
        </div>
        <textarea
          ref={area}
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={rows}
          spellCheck
          aria-invalid={Boolean(error)}
          className={cn(inputClass(Boolean(error)), "resize-y py-3 font-mono text-[0.8125rem] leading-relaxed")}
        />
      </div>

      {tab === "preview" ? (
        <div className="min-h-40 rounded-md border border-line bg-paper p-5" aria-busy={pending}>
          {pending ? (
            <p className="label animate-pulse">Rendering…</p>
          ) : html ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="text-sm text-ink-3">Nothing to preview.</p>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-experimental">{error}</p>
      ) : (
        <p className="text-xs text-ink-3">
          {hint ?? "Markdown with GFM tables, :::note/:::tip/:::warning callouts, ```architecture diagrams and code fences (title=\"…\")."}
        </p>
      )}
    </div>
  );
}
