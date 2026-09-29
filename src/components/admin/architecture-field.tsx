"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { ArchitectureDiagram } from "@/components/projects/architecture-diagram";
import { parseArchitecture } from "@/lib/architecture";
import { cn } from "@/lib/utils";
import { inputClass, useFieldError } from "./form-kit";

const EXAMPLE = `[Client]   Web App (Next.js)
[Services] API (Spring Boot), Worker
[Data]     PostgreSQL, Redis (cache)

Web App -> API : REST
API ~> Worker : queue
API <-> PostgreSQL : SQL`;

/** Architecture DSL editor with an instant client-side preview and line errors. */
export function ArchitectureField({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const id = useId();
  const [source, setSource] = useState(defaultValue ?? "");
  const deferred = useDeferredValue(source);
  const diagram = useMemo(() => parseArchitecture(deferred), [deferred]);
  const serverError = useFieldError(name);

  return (
    <div className="grid gap-4 sm:col-span-2 xl:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-medium">
            Architecture diagram
          </label>
          {!source ? (
            <button type="button" onClick={() => setSource(EXAMPLE)} className="text-xs text-ink-3 underline underline-offset-2 hover:text-ink">
              Insert example
            </button>
          ) : null}
        </div>
        <textarea
          id={id}
          name={name}
          value={source}
          onChange={(event) => setSource(event.target.value)}
          rows={12}
          spellCheck={false}
          className={cn(inputClass(Boolean(serverError || diagram.errors.length)), "resize-y py-3 font-mono text-xs leading-relaxed")}
          placeholder={EXAMPLE}
        />
        {serverError ? <p className="text-xs text-experimental">{serverError}</p> : null}
        {diagram.errors.length ? (
          <ul className="space-y-0.5 text-xs text-experimental" aria-live="polite">
            {diagram.errors.map((error, i) => (
              <li key={i}>
                Line {error.line}: {error.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-3">
            <code>[Layer] Node (note), Node</code> per line, then edges <code>A -&gt; B : label</code> · <code>~&gt;</code> async · <code>&lt;-&gt;</code> both ways.
          </p>
        )}
      </div>
      <div className="min-w-0">
        <p className="mb-1.5 text-sm font-medium">Preview</p>
        {diagram.layers.length ? (
          <ArchitectureDiagram diagram={diagram} className="m-0" />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-line-strong text-sm text-ink-3">
            The diagram renders here.
          </div>
        )}
      </div>
    </div>
  );
}
