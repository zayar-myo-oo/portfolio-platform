"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import type { Social } from "@/lib/json-fields";
import { PUBLIC_NAV, SECONDARY_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";
import { isActivePath } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

/**
 * Full-screen mobile menu built on the native <dialog>: focus trapping,
 * Escape-to-close and an inert background come from the browser.
 */
export function MobileMenu({ ownerName, email, socials }: { ownerName: string; email: string | null; socials: Social[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex size-9 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06] md:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Icon name="menu" size={20} />
      </button>

      <dialog
        ref={dialog}
        aria-label="Site menu"
        className={cn(
          "m-0 h-dvh max-h-none w-full max-w-none bg-paper p-0 text-ink backdrop:bg-transparent",
          "opacity-0 transition-[opacity,display,overlay] transition-discrete duration-300 open:opacity-100 starting:open:opacity-0",
        )}
      >
        <div className="container-page flex h-full flex-col">
          <div className="flex h-[var(--header-h)] items-center justify-between">
            <span className="text-sm font-medium">{ownerName}</span>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-ink/[0.06]"
                aria-label="Close menu"
                autoFocus
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          <nav aria-label="Mobile" className="mt-8 flex-1">
            <ul className="flex flex-col">
              {[{ href: "/", label: "Home", index: "00" }, ...PUBLIC_NAV].map((item, i) => {
                const active = item.href === "/" ? pathname === "/" : isActivePath(pathname, item.href);
                return (
                  <li
                    key={item.href}
                    className="border-b border-line animate-rise"
                    style={{ animationDelay: `${60 + i * 45}ms` }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => dialog.current?.close()}
                      aria-current={active ? "page" : undefined}
                      className="flex items-baseline justify-between py-4"
                    >
                      <span className={cn("display text-[2.75rem] leading-none", active && "text-accent-ink")}>{item.label}</span>
                      <span className="label">{item.index}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-6 flex gap-6">
              {SECONDARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => dialog.current?.close()} className="text-ink-2 hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-6">
            {email ? (
              <a href={`mailto:${email}`} className="text-sm text-ink-2 hover:text-ink">
                {email}
              </a>
            ) : (
              <span />
            )}
            <ul className="flex gap-4">
              {socials.map((social) => (
                <li key={social.url}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer" className="label hover:text-ink">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </dialog>
    </>
  );
}
