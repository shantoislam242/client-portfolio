import Link from "next/link";
import { NewProjectForm } from "./new-form";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/projects"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">New project</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fill the basics. After save, you&apos;ll go to the edit page where you can add sections,
        gallery, related projects, and SEO.
      </p>
      <NewProjectForm />
    </div>
  );
}
