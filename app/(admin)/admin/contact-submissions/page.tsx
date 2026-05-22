import Link from "next/link";
import { listContactSubmissions } from "@/lib/db/contact-submissions";
import { deleteContactSubmission } from "@/actions/contact-submissions";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata = { title: "Inbox — admin" };

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function InboxPage() {
  const rows = await listContactSubmissions();
  const unread = rows.filter((r) => !r.read).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">
          Inbox ({rows.length}
          {unread > 0 && (
            <span className="ml-2 text-sm font-normal text-accent-purple">
              {unread} unread
            </span>
          )}
          )
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Messages submitted via the public contact form. (Form ships in Phase 4.)
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card/50">
              <tr>
                <th className="w-8 px-3 py-2"></th>
                <th className="text-left px-3 py-2 font-medium">From</th>
                <th className="text-left px-3 py-2 font-medium">Message</th>
                <th className="text-left px-3 py-2 font-medium">Received</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={
                    "border-t border-border " + (r.read ? "" : "bg-accent-purple/5")
                  }
                >
                  <td className="px-3 py-2">
                    {!r.read && (
                      <span
                        aria-label="Unread"
                        className="block h-2 w-2 rounded-full bg-accent-purple"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {truncate(r.message, 80)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/contact-submissions/${r.id}`}
                      className="text-accent-purple hover:underline mr-3"
                    >
                      View
                    </Link>
                    <DeleteButton id={r.id} action={deleteContactSubmission} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
