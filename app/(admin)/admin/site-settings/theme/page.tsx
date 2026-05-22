import { getSiteSettings } from "@/lib/db/site-settings";
import { ThemeForm } from "./theme-form";

export const metadata = { title: "Theme — site settings" };

export default async function ThemePage() {
  const s = await getSiteSettings();
  return <ThemeForm initial={s} />;
}
