import { ToolsGrid } from "@/components/sections/tools-grid";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

export const metadata = {
  title: "Tools — Arifujjaman",
};

export default function ToolsPage() {
  return (
    <>
      <ToolsGrid mode="page" />
      <CollaborateCTA />
    </>
  );
}
