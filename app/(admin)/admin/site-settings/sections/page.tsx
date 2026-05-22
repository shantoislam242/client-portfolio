import { getSiteSettings } from "@/lib/db/site-settings";
import { SectionsForm } from "./sections-form";

export const metadata = { title: "Sections — site settings" };

export default async function SectionsPage() {
  const s = await getSiteSettings();
  return <SectionsForm initial={s} />;
}
