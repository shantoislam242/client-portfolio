import { getSiteSettings } from "@/lib/db/site-settings";
import { HeroForm } from "./hero-form";

export const metadata = { title: "Hero — site settings" };

export default async function HeroPage() {
  const s = await getSiteSettings();
  return <HeroForm initial={s} />;
}
