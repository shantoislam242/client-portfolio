import { getSiteSettings } from "@/lib/db/site-settings";
import { ContactForm } from "./contact-form";

export const metadata = { title: "Contact — site settings" };

export default async function ContactPage() {
  const s = await getSiteSettings();
  return <ContactForm initial={s} />;
}
