import Link from "next/link";
import { ActionButton, AdminHeader } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { archiveMessage, deleteMessage, setMessageRead } from "@/server/actions/admin/site";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { cn, formatDate } from "@/lib/utils";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Messages" };

export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin();
  const showArchived = (await searchParams).view === "archived";
  const messages = await db.contactMessage.findMany({
    where: { archived: showArchived },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <AdminHeader
        title="Messages"
        description="Submissions from the contact form. Rendered as plain text — never as HTML."
        actions={
          <Link href={showArchived ? "/admin/messages" : "/admin/messages?view=archived"} className="inline-flex h-9 items-center rounded-md border border-line-strong px-3.5 text-sm hover:border-ink">
            {showArchived ? "Inbox" : "Archived"}
          </Link>
        }
      />
      {messages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong p-10 text-center text-sm text-ink-3">{showArchived ? "No archived messages." : "Inbox zero."}</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li key={message.id} className={cn("rounded-lg border bg-surface p-5", message.readAt ? "border-line" : "border-accent/50")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {!message.readAt ? <span className="size-2 rounded-full bg-accent" aria-label="Unread" /> : null}
                    {message.name}
                    <span className="font-normal text-ink-3">&lt;{message.email}&gt;</span>
                  </p>
                  {message.subject ? <p className="mt-0.5 text-sm text-ink-2">{message.subject}</p> : null}
                </div>
                <span className="label">{formatDate(message.createdAt)}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-ink-2">{message.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject ?? "your message"}`)}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ink px-2.5 text-xs text-ink-inverse"
                >
                  <Icon name="mail" size={13} /> Reply
                </a>
                <ActionButton action={setMessageRead.bind(null, message.id, !message.readAt)}>{message.readAt ? "Mark unread" : "Mark read"}</ActionButton>
                <ActionButton action={archiveMessage.bind(null, message.id, !message.archived)}>{message.archived ? "Unarchive" : "Archive"}</ActionButton>
                <ActionButton action={deleteMessage.bind(null, message.id)} className="text-experimental hover:border-experimental">
                  Delete
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
