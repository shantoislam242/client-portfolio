import { notFound } from "next/navigation";
import { getClientLogo } from "@/lib/db/client-logos";
import { updateClientLogo } from "@/actions/client-logos";
import { ClientLogoForm } from "../client-logo-form";

export const metadata = { title: "Edit client logo" };

export default async function EditClientLogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const logo = await getClientLogo(id);
  if (!logo) notFound();

  const boundAction = updateClientLogo.bind(null, logo.id);
  return (
    <ClientLogoForm
      initial={{
        id: logo.id,
        name: logo.name,
        logoUrl: logo.logoUrl,
        publicId: logo.publicId,
        websiteUrl: logo.websiteUrl,
        order: logo.order,
        visible: logo.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
