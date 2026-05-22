import Link from "next/link";
import { listSocialLinks } from "@/lib/db/social-links";
import { deleteSocialLink, toggleVisibleSocialLink } from "@/actions/social-links";
import { DataTable } from "@/components/admin/data-table";

export const metadata = { title: "Social links — admin" };

export default async function SocialLinksListPage() {
  const socials = await listSocialLinks();
  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Social links ({socials.length})</h1>
        <Link
          href="/admin/social-links/new"
          className="rounded-full bg-accent-purple px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          + New social link
        </Link>
      </header>
      <DataTable
        rows={socials}
        columns={[
          { key: "platform", label: "Platform" },
          { key: "label", label: "Label" },
          { key: "url", label: "URL" },
          { key: "order", label: "Order" },
        ]}
        editHref={(s) => `/admin/social-links/${s.id}`}
        deleteAction={deleteSocialLink}
        toggleVisibleAction={toggleVisibleSocialLink}
      />
    </div>
  );
}
