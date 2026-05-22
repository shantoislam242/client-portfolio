import { createTool } from "@/actions/tools";
import { ToolForm } from "../tool-form";

export const metadata = { title: "New tool" };

export default function NewToolPage() {
  return <ToolForm action={createTool} submitLabel="Create tool" />;
}
