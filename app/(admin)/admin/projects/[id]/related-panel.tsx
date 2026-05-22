"use client";
import type { ProjectWithChildren, AvailableProject } from "../project-shared";

type Props = { project: ProjectWithChildren; available: AvailableProject[] };

export function RelatedPanel({ project, available }: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      Related panel for {project.title} ({available.length} available) — implementation in Task 10.
    </div>
  );
}
