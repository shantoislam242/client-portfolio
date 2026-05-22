"use client";
import type { ProjectWithChildren } from "../project-shared";

type Props = { project: ProjectWithChildren };

export function SeoPanel({ project }: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      SEO panel for {project.title} — implementation in Task 11.
    </div>
  );
}
