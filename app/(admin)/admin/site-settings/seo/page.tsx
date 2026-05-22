import { getSiteSettings } from "@/lib/db/site-settings";
import { SeoForm } from "./seo-form";

export const metadata = { title: "SEO — site settings" };

export default async function SeoPage() {
  const s = await getSiteSettings();
  return <SeoForm initial={s} />;
}
