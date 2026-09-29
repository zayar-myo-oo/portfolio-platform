"use client";

import Link from "next/link";
import { useRef, useTransition, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back ? (
          <Link href={back.href} className="label mb-3 inline-flex items-center gap-1.5 hover:text-ink">
            <Icon name="arrow-left" size={12} /> {back.label}
          </Link>
        ) : null}
        <h1 className="display text-4xl">{title}</h1>
        {description ? <div className="mt-2 max-w-2xl text-sm text-ink-2">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminLinkButton({ href, children, icon, variant = "primary" }: { href: string; children: ReactNode; icon?: IconName; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors",
        variant === "primary" ? "bg-ink text-ink-inverse hover:bg-ink/85" : "border border-line-strong hover:border-ink",
      )}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </Link>
  );
}

/** Destructive action behind a native confirmation dialog. */
export function ConfirmDelete({ action, label = "Delete", subject }: { action: () => Promise<void>; label?: string; subject: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-experimental/40 px-3.5 text-sm text-experimental hover:bg-experimental/10"
      >
        <Icon name="trash" size={15} /> {label}
      </button>
      <dialog ref={dialog} aria-label={`Confirm ${label.toLowerCase()}`} className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/40">
        <p className="font-semibold">
          {label} “{subject}”?
        </p>
        <p className="mt-2 text-sm text-ink-2">This can’t be undone. The public site updates immediately.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => dialog.current?.close()} className="h-9 rounded-md border border-line px-3.5 text-sm hover:border-ink" autoFocus>
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => { await action(); dialog.current?.close(); })}
            className="h-9 rounded-md bg-experimental px-3.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Deleting…" : label}
          </button>
        </div>
      </dialog>
    </>
  );
}

/** Small inline server-action button (mark read, archive…). */
export function ActionButton({ action, children, title, className }: { action: () => Promise<void>; children: ReactNode; title?: string; className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      onClick={() => startTransition(() => action())}
      className={cn("inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-ink-2 hover:border-ink hover:text-ink disabled:opacity-50", className)}
    >
      {children}
    </button>
  );
}

export function SavedNotice({ show, children = "Saved." }: { show: boolean; children?: ReactNode }) {
  if (!show) return null;
  return (
    <p role="status" className="mb-6 flex items-center gap-2 rounded-md border border-live/40 bg-live/10 px-4 py-2.5 text-sm text-live">
      <Icon name="check" size={15} /> {children}
    </p>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((heading, i) => (
              <th key={i} scope="col" className="label px-4 py-3 font-normal">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
