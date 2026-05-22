import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getAvailableRelatedProjects } from "@/lib/db/projects";
import { TabsNav } from "./tabs-nav";
import { BasicsPanel } from "./basics-panel";
import { ContentPanel } from "./content-panel";
import { GalleryPanel } from "./gallery-panel";
import { RelatedPanel } from "./related-panel";
import { SeoPanel } from "./seo-panel";

export const metadata = { title: "Edit project — admin" };

const VALID_TABS = ["basics", "content", "gallery", "related", "seo"] as const;
type Tab = (typeof VALID_TABS)[number];

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = (VALID_TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as Tab)
    : "basics";

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/projects"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Projects
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">{project.title}</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {project.published ? "Published" : "Draft"}
        {project.featured && " · Featured"}
      </p>

      <TabsNav />

      {tab === "basics" && <BasicsPanel project={project} />}
      {tab === "content" && <ContentPanel project={project} />}
      {tab === "gallery" && <GalleryPanel project={project} />}
      {tab === "related" && (
        <RelatedPanel
          project={project}
          available={await getAvailableRelatedProjects(project.id)}
        />
      )}
      {tab === "seo" && <SeoPanel project={project} />}
    </div>
  );
}
