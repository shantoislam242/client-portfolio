import { notFound } from "next/navigation";
import { getTool } from "@/lib/db/tools";
import { updateTool } from "@/actions/tools";
import { ToolForm } from "../tool-form";

export const metadata = { title: "Edit tool" };

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await getTool(id);
  if (!tool) notFound();

  const boundAction = updateTool.bind(null, tool.id);
  return (
    <ToolForm
      initial={{
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        iconUrl: tool.iconUrl,
        iconPublicId: tool.iconPublicId,
        iconExternalUrl: tool.iconExternalUrl,
        proficiency: tool.proficiency,
        order: tool.order,
        showOnHome: tool.showOnHome,
        visible: tool.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
