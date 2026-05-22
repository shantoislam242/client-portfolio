import { getSiteSettings } from "@/lib/db/site-settings";
import { StatsForm } from "./stats-form";

export const metadata = { title: "Stats — site settings" };

export default async function StatsPage() {
  const s = await getSiteSettings();
  return <StatsForm initial={s} />;
}
