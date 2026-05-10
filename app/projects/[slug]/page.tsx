import { notFound } from "next/navigation";
import { projects } from "@/lib/data";
import { ProjectDetail } from "@/components/sections/project-detail";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return { title: "Project not found — Arif Hossain" };
  }

  return {
    title: `${project.title} — Arif Hossain`,
    description: project.excerpt,
  };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}
