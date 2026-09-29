import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { getSiteSettings } from "@/server/data/settings";
import { cn } from "@/lib/utils";
import { HeaderShell } from "./header-shell";
import { LocalClock } from "./local-clock";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <HeaderShell>
      <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label={`${settings.ownerName} — home`}>
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              settings.isAvailable ? "animate-pulse-dot bg-live text-live" : "bg-ink-3",
            )}
          />
          <span className="text-[0.9375rem] font-semibold tracking-tight whitespace-nowrap">{settings.ownerName}</span>
          <span className="hidden font-mono text-2xs tracking-[0.08em] text-ink-3 uppercase transition-colors group-hover:text-ink-2 xl:inline">
            / {settings.role}
          </span>
        </Link>

        <NavLinks className="hidden md:block" />

        <div className="flex items-center gap-1.5">
          {/* Visibility lives on wrappers: the components carry their own display classes. */}
          <div className="mr-2 hidden lg:block">
            <LocalClock timezone={settings.timezone} location={settings.location} />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="ml-1 hidden sm:block">
            <ButtonLink href="/contact" size="sm" variant="secondary">
              Contact
            </ButtonLink>
          </div>
          <MobileMenu ownerName={settings.ownerName} email={settings.email} socials={settings.socials} />
        </div>
      </div>
    </HeaderShell>
  );
}
