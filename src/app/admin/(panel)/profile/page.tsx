import { AdminForm, Panel, TextInput } from "@/components/admin/form-kit";
import { AdminHeader, SavedNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { changePassword, signOutOtherSessions, updateProfile } from "@/server/actions/admin/site";
import { requireAdmin } from "@/server/auth/dal";
import { PASSWORD_MIN_LENGTH } from "@/server/auth/password";
import { db } from "@/server/db";
import { formatDate } from "@/lib/utils";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Profile" };

export default async function AdminProfilePage({ searchParams }: PageProps<"/admin/profile">) {
  const session = await requireAdmin();
  const [sessions, query] = await Promise.all([
    db.session.findMany({ where: { userId: session.user.id }, orderBy: { lastUsedAt: "desc" }, select: { id: true, createdAt: true, lastUsedAt: true, expiresAt: true } }),
    searchParams,
  ]);

  return (
    <>
      <AdminHeader title="Profile & security" description="Your admin account. Sessions are stored server-side and can be revoked at any time." />
      <SavedNotice show={query.signedOut === "1"}>Other sessions were signed out.</SavedNotice>
      <div className="grid gap-8">
        <AdminForm action={updateProfile} submitLabel="Save profile">
          <Panel title="Account">
            <TextInput label="Name" name="name" defaultValue={session.user.name} required />
            <TextInput label="Email (sign-in)" name="email" type="email" defaultValue={session.user.email} required />
          </Panel>
        </AdminForm>

        <AdminForm action={changePassword} submitLabel="Change password">
          <Panel title="Password" description={`At least ${PASSWORD_MIN_LENGTH} characters. Changing it signs out every other session.`}>
            <TextInput label="Current password" name="current" type="password" full />
            <TextInput label="New password" name="next" type="password" />
            <TextInput label="Confirm new password" name="confirm" type="password" />
          </Panel>
        </AdminForm>

        <section className="rounded-lg border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-semibold">Active sessions</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {sessions.map((item) => (
              <li key={item.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span>
                  Signed in {formatDate(item.createdAt)}
                  {item.id === session.id ? <span className="ml-2 text-xs text-live">This device</span> : null}
                </span>
                <span className="text-xs text-ink-3">
                  Last active {formatDate(item.lastUsedAt)} · expires {formatDate(item.expiresAt)}
                </span>
              </li>
            ))}
          </ul>
          {sessions.length > 1 ? (
            <form action={signOutOtherSessions} className="mt-4">
              <Button type="submit" variant="secondary" size="sm" icon="logout">
                Sign out all other sessions
              </Button>
            </form>
          ) : null}
        </section>
      </div>
    </>
  );
}
