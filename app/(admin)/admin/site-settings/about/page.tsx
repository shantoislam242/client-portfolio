import { getSiteSettings } from "@/lib/db/site-settings";
import { AboutForm } from "./about-form";

export const metadata = { title: "About — site settings" };

export default async function AboutPage() {
  const s = await getSiteSettings();
  return <AboutForm initial={s} />;
}
