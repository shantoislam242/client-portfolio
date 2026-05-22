import { getSiteSettings } from "@/lib/db/site-settings";
import { CollaborateForm } from "./collaborate-form";

export const metadata = { title: "Collaborate — site settings" };

export default async function CollaboratePage() {
  const s = await getSiteSettings();
  return <CollaborateForm initial={s} />;
}
