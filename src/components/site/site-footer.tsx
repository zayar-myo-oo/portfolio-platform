import Link from "next/link";
import { cacheLife } from "next/cache";
import { Icon } from "@/components/ui/icon";
import { getSiteSettings } from "@/server/data/settings";
import { PUBLIC_NAV, SECONDARY_NAV } from "@/lib/site";

async function copyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [settings, year] = await Promise.all([getSiteSettings(), copyrightYear()]);

  return (
    <footer className="relative mt-[var(--section-space)] border-t border-line">
      <div className="container-page pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label mb-6">Next step</p>
            <Link href="/contact" className="group inline-block" data-cursor="view">
              <span className="display block text-display-m">
                Let&rsquo;s build
                <br />
                <span className="inline-flex items-baseline gap-4 text-ink-3 transition-colors duration-500 group-hover:text-accent">
                  something.
                  <Icon
                    name="arrow-up-right"
                    size={56}
                    strokeWidth={1.25}
                    className="hidden translate-y-1 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-2 group-hover:-translate-y-1 sm:block"
                  />
                </span>
              </span>
            </Link>
            {settings.email ? (
              <a href={`mailto:${settings.email}`} className="link-underline mt-8 inline-block text-lg text-ink-2 hover:text-ink">
                {settings.email}
              </a>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            <nav aria-label="Footer">
              <p className="label mb-4">Index</p>
              <ul className="space-y-2.5">
                {[{ href: "/", label: "Home" }, ...PUBLIC_NAV, ...SECONDARY_NAV].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-ink-2 transition-colors hover:text-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <p className="label mb-4">Elsewhere</p>
              <ul className="space-y-2.5">
                {settings.socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink"
                      data-cursor="open"
                    >
                      {social.label}
                      <Icon name="arrow-up-right" size={12} />
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/blog/feed.xml" className="inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink">
                    RSS
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="label mb-4">Colophon</p>
              <p className="text-sm leading-relaxed text-ink-3">
                Next.js, PostgreSQL &amp; a small CMS. Set in Bricolage Grotesque, Newsreader &amp; JetBrains&nbsp;Mono.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="label">
            © {year} {settings.ownerName}
          </p>
          <a href="#top" className="label inline-flex items-center gap-1.5 hover:text-ink">
            Back to top <Icon name="arrow-up" size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
}
