import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { PageTransition } from "@/components/motion/page-transition";
import { LocalClock } from "@/components/site/local-clock";
import { Icon } from "@/components/ui/icon";
import { getSiteSettings } from "@/server/data/settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about projects, roles or collaborations.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <PageTransition>
      <div className="container-page pt-16 md:pt-24">
        <p className="label mb-8">Contact</p>
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h1 className="display text-display-m animate-rise">
              Say
              <br />
              <span className="text-ink-3">hello.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-2">
              Projects, roles, collaborations or a question about something I wrote — I read everything.
            </p>

            <dl className="mt-10 divide-y divide-line border-y border-line">
              {settings.email ? (
                <div className="flex items-center justify-between gap-4 py-4">
                  <dt className="label">Email</dt>
                  <dd>
                    <a href={`mailto:${settings.email}`} className="link-underline">
                      {settings.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="label">Local time</dt>
                <dd>
                  <LocalClock timezone={settings.timezone} location={settings.location} />
                </dd>
              </div>
              {settings.availability ? (
                <div className="flex items-center justify-between gap-4 py-4">
                  <dt className="label">Availability</dt>
                  <dd className={settings.isAvailable ? "text-live" : "text-ink-2"}>{settings.availability}</dd>
                </div>
              ) : null}
            </dl>

            {settings.socials.length ? (
              <ul className="mt-8 flex flex-wrap gap-2">
                {settings.socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-ink-2 hover:border-ink hover:text-ink"
                    >
                      {social.label} <Icon name="arrow-up-right" size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
