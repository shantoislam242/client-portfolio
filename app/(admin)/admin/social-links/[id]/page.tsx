import { notFound } from "next/navigation";
import { getSocialLink } from "@/lib/db/social-links";
import { updateSocialLink } from "@/actions/social-links";
import { SocialLinkForm } from "../social-link-form";

export const metadata = { title: "Edit social link" };

export default async function EditSocialLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const socialLink = await getSocialLink(id);
  if (!socialLink) notFound();

  const boundAction = updateSocialLink.bind(null, socialLink.id);
  return (
    <SocialLinkForm
      initial={{
        id: socialLink.id,
        platform: socialLink.platform,
        label: socialLink.label,
        url: socialLink.url,
        iconKey: socialLink.iconKey,
        order: socialLink.order,
        visible: socialLink.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
