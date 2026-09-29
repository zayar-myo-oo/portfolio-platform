import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { logout } from "@/server/actions/auth";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";

// Admin views depend on the session; they are allowed to block on navigation.
export const instant = false;

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}

async function AdminFrame({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const unread = await db.contactMessage.count({ where: { readAt: null, archived: false } });

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-4 p-3 lg:p-4">
          <div className="flex items-center justify-between px-1 lg:px-3 lg:pt-2">
            <Link href="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="size-2 rounded-full bg-accent" /> Studio
            </Link>
            <div className="flex items-center gap-1 lg:hidden">
              <ThemeToggle />
            </div>
          </div>
          <AdminNav unread={unread} />
          <div className="mt-auto hidden flex-col gap-2 border-t border-line pt-4 lg:flex">
            <Link
              href="/"
              target="_blank"
              className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
            >
              <Icon name="external" size={15} /> View site
            </Link>
            <div className="flex items-center justify-between px-3">
              <span className="truncate text-xs text-ink-3" title={session.user.email}>
                {session.user.email}
              </span>
              <ThemeToggle />
            </div>
            <form action={logout}>
              <button type="submit" className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-ink-2 hover:bg-ink/[0.05] hover:text-ink">
                <Icon name="logout" size={15} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">{children}</div>
        <form action={logout} className="mt-16 border-t border-line pt-6 lg:hidden">
          <button type="submit" className="label inline-flex items-center gap-2 hover:text-ink">
            <Icon name="logout" size={13} /> Sign out ({session.user.email})
          </button>
        </form>
      </main>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]" aria-busy="true" aria-label="Loading admin">
      <div className="hidden border-r border-line bg-surface lg:block" />
      <div className="space-y-4 p-12">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-40 w-full" />
      </div>
    </div>
  );
}
