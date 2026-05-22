"use client";
import type { ProjectWithChildren } from "../project-shared";

type Props = { project: ProjectWithChildren };

export function GalleryPanel({ project }: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      Gallery panel for {project.title} — implementation in Task 9.
    </div>
  );
}
