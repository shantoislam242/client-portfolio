"use client";
import type { ProjectWithChildren } from "../project-shared";

type Props = { project: ProjectWithChildren };

export function ContentPanel({ project }: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      Content panel for {project.title} — implementation in Task 8.
    </div>
  );
}
