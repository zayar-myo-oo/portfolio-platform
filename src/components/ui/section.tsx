import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

/**
 * Editorial section header: index + label rail on the left, a large title,
 * and an optional action. The index/label pairing is the site's wayfinding
 * system ("02 — Portal").
 */
export function SectionHeader({
  index,
  label,
  title,
  description,
  action,
  className,
  as: Heading = "h2",
}: {
  index?: string;
  label: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <header className={cn("grid gap-6 md:grid-cols-12 md:gap-8", className)}>
      <div className="flex items-baseline gap-3 md:col-span-3">
        {index ? <span className="label text-ink">{index}</span> : null}
        <span className="label">{label}</span>
      </div>
      <div className="md:col-span-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <Heading className="display max-w-[18ch] text-display-s">{title}</Heading>
          {action ? (
            <Link
              href={action.href}
              className="group inline-flex shrink-0 items-center gap-2 text-sm text-ink-2 transition-colors hover:text-ink"
            >
              <span className="link-underline">{action.label}</span>
              <Icon name="arrow-right" className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          ) : null}
        </div>
        {description ? <div className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{description}</div> : null}
      </div>
    </header>
  );
}

export function Section({ children, className, id, labelledBy }: { children: ReactNode; className?: string; id?: string; labelledBy?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("container-page py-[var(--section-space)]", className)}>
      {children}
    </section>
  );
}

/** Mono key/value "spec sheet" rows. */
export function Datasheet({ rows, className }: { rows: Array<{ label: string; value: ReactNode } | null | false>; className?: string }) {
  const visible = rows.filter(Boolean) as Array<{ label: string; value: ReactNode }>;
  if (!visible.length) return null;
  return (
    <dl className={cn("divide-y divide-line border-y border-line", className)}>
      {visible.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(7rem,38%)_1fr] gap-4 py-3">
          <dt className="label pt-0.5">{row.label}</dt>
          <dd className="text-sm text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
