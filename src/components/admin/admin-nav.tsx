"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const GROUPS: Array<{ label: string | null; items: Array<{ href: string; label: string; icon: IconName }> }> = [
  { label: null, items: [{ href: "/admin", label: "Dashboard", icon: "grid" }] },
  {
    label: "Content",
    items: [
      { href: "/admin/projects", label: "Projects", icon: "layers" },
      { href: "/admin/portal", label: "Portal", icon: "zap" },
      { href: "/admin/blog", label: "Blog", icon: "file" },
      { href: "/admin/experience", label: "Experience", icon: "briefcase" },
      { href: "/admin/technologies", label: "Technologies", icon: "cpu" },
      { href: "/admin/experiments", label: "Experiments", icon: "flask" },
      { href: "/admin/media", label: "Media", icon: "image" },
    ],
  },
  { label: "Inbox", items: [{ href: "/admin/messages", label: "Messages", icon: "inbox" }] },
  {
    label: "System",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: "chart" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
      { href: "/admin/profile", label: "Profile", icon: "user" },
    ],
  },
];

export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav aria-label="Admin" className="flex gap-6 overflow-x-auto lg:flex-col lg:gap-5 lg:overflow-visible">
      {GROUPS.map((group, i) => (
        <div key={i} className="flex shrink-0 gap-1 lg:flex-col">
          {group.label ? <p className="label hidden px-3 pb-1 lg:block">{group.label}</p> : null}
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm transition-colors",
                active(item.href) ? "bg-ink text-ink-inverse" : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
              )}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
              {item.href === "/admin/messages" && unread > 0 ? (
                <span className="ml-auto rounded-full bg-accent px-1.5 font-mono text-[0.625rem] text-on-accent">{unread}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
