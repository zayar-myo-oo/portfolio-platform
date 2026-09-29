import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

/** Consistent empty/error/unavailable states — never a blank or broken UI. */
export function StatePanel({
  tone = "neutral",
  icon,
  eyebrow,
  title,
  children,
  actions,
  className,
}: {
  tone?: "neutral" | "error" | "warning";
  icon?: IconName;
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const toneClass = tone === "error" ? "text-experimental" : tone === "warning" ? "text-beta" : "text-ink-3";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "hairline-grid flex flex-col items-start gap-4 rounded-lg border border-dashed border-line-strong p-6 sm:p-10",
        className,
      )}
    >
      {icon || eyebrow ? (
        <div className={cn("flex items-center gap-2", toneClass)}>
          {icon ? <Icon name={icon} size={18} /> : null}
          {eyebrow ? <span className="label text-current">{eyebrow}</span> : null}
        </div>
      ) : null}
      <h3 className="display text-2xl sm:text-3xl">{title}</h3>
      {children ? <div className="max-w-xl text-ink-2">{children}</div> : null}
      {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function EmptyState(props: Omit<Parameters<typeof StatePanel>[0], "tone">) {
  return <StatePanel tone="neutral" icon={props.icon ?? "dot"} {...props} />;
}
