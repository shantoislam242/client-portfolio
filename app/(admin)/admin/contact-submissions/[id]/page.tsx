import Link from "next/link";
import { notFound } from "next/navigation";
import { getContactSubmission } from "@/lib/db/contact-submissions";
import {
  deleteContactSubmission,
  markRead,
  toggleReadContactSubmission,
  toggleRepliedContactSubmission,
} from "@/actions/contact-submissions";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Message — admin" };

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function MessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const msg = await getContactSubmission(id);
  if (!msg) notFound();

  // Mark as read on view
  if (!msg.read) {
    await markRead(id);
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/contact-submissions"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Inbox
      </Link>

      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold">{msg.name}</h1>
        <a
          href={`mailto:${msg.email}`}
          className="text-sm text-accent-purple hover:underline"
        >
          {msg.email}
        </a>
        <p className="text-xs text-muted-foreground mt-1">
          Received {formatDate(msg.createdAt)}
        </p>
      </header>

      <div className="rounded-md border border-border bg-card p-4 mb-6">
        <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form action={toggleReadContactSubmission}>
          <input type="hidden" name="id" value={msg.id} />
          <input type="hidden" name="read" value={msg.read ? "false" : "true"} />
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card transition"
          >
            {msg.read ? "Mark unread" : "Mark read"}
          </button>
        </form>

        <form action={toggleRepliedContactSubmission}>
          <input type="hidden" name="id" value={msg.id} />
          <input
            type="hidden"
            name="replied"
            value={msg.replied ? "false" : "true"}
          />
          <button
            type="submit"
            className={
              "rounded-full px-4 py-2 text-sm transition " +
              (msg.replied
                ? "bg-accent-purple/20 border border-accent-purple text-accent-purple"
                : "border border-border hover:bg-card")
            }
          >
            {msg.replied ? "✓ Replied" : "Mark replied"}
          </button>
        </form>

        <a
          href={`mailto:${msg.email}?subject=Re: Your message&body=Hi ${msg.name},%0D%0A%0D%0A`}
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Reply via email
        </a>

        <div className="ml-auto">
          <DeleteButton id={msg.id} action={deleteContactSubmission} />
        </div>
      </div>

      {msg.ipAddress && (
        <p className="mt-6 text-xs text-muted-foreground">
          IP: {msg.ipAddress}
          {msg.userAgent && ` · ${msg.userAgent.slice(0, 80)}`}
        </p>
      )}
    </div>
  );
}
