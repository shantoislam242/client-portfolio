import { createClientLogo } from "@/actions/client-logos";
import { ClientLogoForm } from "../client-logo-form";

export const metadata = { title: "New client logo" };

export default function NewClientLogoPage() {
  return <ClientLogoForm action={createClientLogo} submitLabel="Create logo" />;
}
