import { requireAdmin } from "@/lib/auth/guard";
import { Sidebar } from "@/components/admin/sidebar";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
