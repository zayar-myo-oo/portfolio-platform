"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/server/admin/form";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   AdminForm — useActionState + inline field errors + sticky save bar.
   Submission goes through a transition so React doesn't reset the form
   after a successful save (edits stay on screen). Without JavaScript the
   native form action still posts normally.
   ─────────────────────────────────────────────────────────────────────────── */

const ErrorsContext = createContext<Record<string, string>>({});
export const useFieldError = (name: string) => useContext(ErrorsContext)[name];

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function AdminForm({
  action,
  children,
  submitLabel = "Save changes",
  className,
  secondary,
}: {
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  secondary?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { status: "idle" });

  return (
    <ErrorsContext.Provider value={state.errors ?? {}}>
      <form
        action={formAction}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
        className={cn("flex flex-col gap-6", className)}
        noValidate
      >
        {children}
        <div className="sticky bottom-0 z-[var(--z-raised)] -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={cn(
              "text-sm",
              state.status === "error" ? "text-experimental" : state.status === "success" ? "text-live" : "text-ink-3",
            )}
          >
            {pending ? "Saving…" : state.message ?? "Unsaved changes are kept until you leave the page."}
          </p>
          <div className="flex items-center gap-2">
            {secondary}
            <Button type="submit" disabled={pending} aria-busy={pending} icon={state.status === "success" && !pending ? "check" : undefined}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </ErrorsContext.Provider>
  );
}

/* ── Layout ─────────────────────────────────────────────────────────────── */

export function Panel({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-line bg-surface p-5 sm:p-6", className)}>
      <header className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-3">{description}</p> : null}
      </header>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  hint,
  full,
  children,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  full?: boolean;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode;
}) {
  const id = useId();
  const error = useFieldError(name);
  const hintId = `${id}-hint`;
  return (
    <div className={cn("flex flex-col gap-1.5", full && "sm:col-span-2")}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({ id, invalid: Boolean(error), describedBy: error || hint ? hintId : undefined })}
      {error ? (
        <p id={hintId} className="text-xs text-experimental">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass = (invalid: boolean) =>
  cn(
    "w-full rounded-md border bg-paper px-3 text-sm text-ink transition-colors placeholder:text-ink-3 focus:outline-none",
    invalid ? "border-experimental" : "border-line focus:border-ink",
  );

export function TextInput({
  label,
  name,
  defaultValue,
  hint,
  full,
  type = "text",
  placeholder,
  maxLength,
  required,
  mono,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  hint?: ReactNode;
  full?: boolean;
  type?: "text" | "url" | "email" | "number" | "password";
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <Field label={label} name={name} hint={hint} full={full}>
      {({ id, invalid, describedBy }) => (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(inputClass(invalid), "h-10", mono && "font-mono text-xs")}
        />
      )}
    </Field>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  hint,
  rows = 4,
  maxLength,
  mono,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  hint?: ReactNode;
  rows?: number;
  maxLength?: number;
  mono?: boolean;
}) {
  return (
    <Field label={label} name={name} hint={hint} full>
      {({ id, invalid, describedBy }) => (
        <textarea
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(inputClass(invalid), "resize-y py-2 leading-relaxed", mono && "font-mono text-xs")}
        />
      )}
    </Field>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  hint,
  full,
  allowEmpty,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: Array<{ value: string; label: string }>;
  hint?: ReactNode;
  full?: boolean;
  allowEmpty?: string;
}) {
  return (
    <Field label={label} name={name} hint={hint} full={full}>
      {({ id, invalid, describedBy }) => (
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(inputClass(invalid), "h-10")}
        >
          {allowEmpty !== undefined ? <option value="">{allowEmpty}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 rounded-md border border-line bg-paper p-3">
      <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--accent)]" />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-ink-3">{hint}</span> : null}
      </label>
    </div>
  );
}

/* ── Dates ──────────────────────────────────────────────────────────────── */

/** Date/month/datetime input. Submits an ISO string (timezone-safe) in a hidden field. */
export function DateInput({
  label,
  name,
  defaultValue,
  mode = "date",
  hint,
  clearable,
}: {
  label: string;
  name: string;
  defaultValue?: Date | string | null;
  mode?: "date" | "month" | "datetime";
  hint?: ReactNode;
  clearable?: string;
}) {
  const initial = useMemo(() => {
    if (!defaultValue) return "";
    const date = new Date(defaultValue);
    if (mode === "month") return date.toISOString().slice(0, 7);
    if (mode === "date") return date.toISOString().slice(0, 10);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }, [defaultValue, mode]);
  const [value, setValue] = useState(initial);

  const iso = !value
    ? ""
    : mode === "datetime"
      ? new Date(value).toISOString()
      : new Date(`${mode === "month" ? `${value}-01` : value}T00:00:00Z`).toISOString();

  return (
    <Field label={label} name={name} hint={hint}>
      {({ id, invalid, describedBy }) => (
        <div className="flex gap-2">
          <input
            id={id}
            type={mode === "datetime" ? "datetime-local" : mode}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(inputClass(invalid), "h-10")}
          />
          {clearable && value ? (
            <button type="button" onClick={() => setValue("")} className="shrink-0 rounded-md border border-line px-3 text-xs text-ink-2 hover:border-ink">
              {clearable}
            </button>
          ) : null}
          <input type="hidden" name={name} value={iso} />
        </div>
      )}
    </Field>
  );
}

/* ── Lists ──────────────────────────────────────────────────────────────── */

/** Repeatable single-line inputs submitted under one name. */
export function StringList({ label, name, defaultValue = [], hint, placeholder }: { label: string; name: string; defaultValue?: string[]; hint?: string; placeholder?: string }) {
  const [rows, setRows] = useState(() => (defaultValue.length ? defaultValue : [""]).map((value, i) => ({ key: i, value })));
  const [next, setNext] = useState(rows.length);
  const error = useFieldError(name);

  return (
    <fieldset className="flex flex-col gap-2 sm:col-span-2">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      {rows.map((row, i) => (
        <div key={row.key} className="flex gap-2">
          <input
            name={name}
            defaultValue={row.value}
            placeholder={placeholder}
            aria-label={`${label} ${i + 1}`}
            className={cn(inputClass(false), "h-10")}
          />
          <button
            type="button"
            onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line text-ink-3 hover:border-ink hover:text-ink"
            aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
          >
            <Icon name="minus" size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          setRows((current) => [...current, { key: next, value: "" }]);
          setNext((n) => n + 1);
        }}
        className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:border-ink hover:text-ink"
      >
        <Icon name="plus" size={14} /> Add
      </button>
      {error ? <p className="text-xs text-experimental">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </fieldset>
  );
}

type ObjectField = { key: string; label: string; multiline?: boolean };

/** Repeatable records (features, highlights, principles…) serialised to JSON. */
export function ObjectList({
  label,
  name,
  fields,
  defaultValue = [],
  hint,
}: {
  label: string;
  name: string;
  fields: ObjectField[];
  defaultValue?: Array<Record<string, string>>;
  hint?: string;
}) {
  const [rows, setRows] = useState(() => defaultValue.map((value, i) => ({ key: i, value })));
  const [next, setNext] = useState(rows.length);
  const error = useFieldError(name);
  const serialised = JSON.stringify(rows.map((row) => row.value).filter((value) => Object.values(value).some((v) => v?.trim())));

  const update = (key: number, field: string, value: string) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, value: { ...row.value, [field]: value } } : row)));
  const move = (index: number, delta: number) =>
    setRows((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(Math.max(0, Math.min(copy.length, index + delta)), 0, item);
      return copy;
    });

  return (
    <fieldset className="flex flex-col gap-3 sm:col-span-2">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={serialised} />
      {rows.map((row, index) => (
        <div key={row.key} className="grid gap-2 rounded-md border border-line bg-paper p-3 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-2">
            {fields.map((field) =>
              field.multiline ? (
                <textarea
                  key={field.key}
                  value={row.value[field.key] ?? ""}
                  onChange={(event) => update(row.key, field.key, event.target.value)}
                  placeholder={field.label}
                  aria-label={`${field.label} ${index + 1}`}
                  rows={2}
                  className={cn(inputClass(false), "py-2")}
                />
              ) : (
                <input
                  key={field.key}
                  value={row.value[field.key] ?? ""}
                  onChange={(event) => update(row.key, field.key, event.target.value)}
                  placeholder={field.label}
                  aria-label={`${field.label} ${index + 1}`}
                  className={cn(inputClass(false), "h-9")}
                />
              ),
            )}
          </div>
          <div className="flex gap-1 sm:flex-col">
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-3 hover:text-ink disabled:opacity-30" aria-label="Move up">
              <Icon name="arrow-up" size={13} />
            </button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-3 hover:text-ink disabled:opacity-30" aria-label="Move down">
              <Icon name="arrow-down" size={13} />
            </button>
            <button type="button" onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))} className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-3 hover:text-experimental" aria-label="Remove">
              <Icon name="trash" size={13} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          setRows((current) => [...current, { key: next, value: {} }]);
          setNext((n) => n + 1);
        }}
        className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:border-ink hover:text-ink"
      >
        <Icon name="plus" size={14} /> Add {label.toLowerCase().replace(/s$/, "")}
      </button>
      {error ? <p className="text-xs text-experimental">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </fieldset>
  );
}

/* ── Multi-select (ordered) ─────────────────────────────────────────────── */

export function MultiSelect({
  label,
  name,
  options,
  defaultValue = [],
  hint,
  placeholder = "Search…",
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; group?: string }>;
  defaultValue?: string[];
  hint?: string;
  placeholder?: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue.filter((value) => options.some((o) => o.value === value)));
  const [query, setQuery] = useState("");
  const inputId = useId();
  const byValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);
  const available = options.filter(
    (option) => !selected.includes(option.value) && option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <ul className="flex min-h-10 flex-wrap gap-1.5 rounded-md border border-line bg-paper p-2" aria-label={`Selected ${label.toLowerCase()}`}>
        {selected.length === 0 ? <li className="px-1 py-1 text-sm text-ink-3">None selected</li> : null}
        {selected.map((value) => (
          <li key={value}>
            <button
              type="button"
              onClick={() => setSelected((current) => current.filter((v) => v !== value))}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink px-2.5 text-xs text-ink-inverse hover:bg-experimental"
              aria-label={`Remove ${byValue.get(value)?.label ?? value}`}
            >
              {byValue.get(value)?.label ?? value}
              <Icon name="close" size={11} />
            </button>
          </li>
        ))}
      </ul>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={cn(inputClass(false), "h-9")}
      />
      {available.length ? (
        <ul className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {available.slice(0, 40).map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  setSelected((current) => [...current, option.value]);
                  setQuery("");
                }}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-xs text-ink-2 hover:border-ink hover:text-ink"
              >
                <Icon name="plus" size={11} /> {option.label}
                {option.group ? <span className="text-ink-3">· {option.group}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}
