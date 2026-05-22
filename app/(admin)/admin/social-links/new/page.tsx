import { createSocialLink } from "@/actions/social-links";
import { SocialLinkForm } from "../social-link-form";

export const metadata = { title: "New social link" };

export default function NewSocialLinkPage() {
  return <SocialLinkForm action={createSocialLink} submitLabel="Create social link" />;
}
