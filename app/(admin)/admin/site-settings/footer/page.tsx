import { getSiteSettings } from "@/lib/db/site-settings";
import { FooterForm } from "./footer-form";

export const metadata = { title: "Footer — site settings" };

export default async function FooterPage() {
  const s = await getSiteSettings();
  return <FooterForm initial={s} />;
}
