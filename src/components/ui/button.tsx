import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-out " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ink-inverse hover:bg-ink/85",
  accent: "bg-accent text-on-accent hover:brightness-105 hover:shadow-[0_8px_24px_-10px_var(--accent)]",
  secondary: "border border-line-strong text-ink hover:border-ink hover:bg-ink/[0.03]",
  ghost: "text-ink-2 hover:text-ink hover:bg-ink/[0.05]",
  danger: "border border-[color-mix(in_oklab,var(--status-experimental),transparent_60%)] text-experimental hover:bg-experimental/10",
};

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-sm px-3 text-[0.8125rem]",
  md: "h-10 rounded-md px-4 text-sm",
  lg: "h-12 rounded-md px-5 text-[0.9375rem]",
};

type Common = {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  /** Trailing icon that nudges on hover (arrows). */
  trailingIcon?: IconName;
  children?: ReactNode;
  className?: string;
};

function Inner({ icon, trailingIcon, children }: Pick<Common, "icon" | "trailingIcon" | "children">) {
  return (
    <>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
      {trailingIcon ? (
        <Icon
          name={trailingIcon}
          size={16}
          className="transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-px"
        />
      ) : null}
    </>
  );
}

export function buttonClasses({ variant = "primary", size = "md", className }: Pick<Common, "variant" | "size" | "className">) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  icon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...rest
}: Common & Omit<ComponentProps<"button">, "children">) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      <Inner icon={icon} trailingIcon={trailingIcon}>
        {children}
      </Inner>
    </button>
  );
}

type ButtonLinkProps = Common &
  Omit<ComponentProps<typeof Link>, "children" | "className"> & {
    /** External links open in a new tab with safe rel attributes. */
    external?: boolean;
  };

export function ButtonLink({ variant, size, icon, trailingIcon, className, children, external, href, ...rest }: ButtonLinkProps) {
  const classes = buttonClasses({ variant, size, className });
  if (external) {
    return (
      <a
        href={String(href)}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        data-cursor="open"
        {...(rest as ComponentProps<"a">)}
      >
        <Inner icon={icon} trailingIcon={trailingIcon ?? "arrow-up-right"}>
          {children}
        </Inner>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      <Inner icon={icon} trailingIcon={trailingIcon}>
        {children}
      </Inner>
    </Link>
  );
}
