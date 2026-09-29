"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PUBLIC_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex items-center gap-1">
        {PUBLIC_NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-baseline gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                  active ? "text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                <span className="font-mono text-[0.625rem] text-ink-3 transition-colors group-hover:text-accent-ink">{item.index}</span>
                {item.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-px origin-left bg-current transition-transform duration-500 ease-[var(--ease-out-expo)]",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
