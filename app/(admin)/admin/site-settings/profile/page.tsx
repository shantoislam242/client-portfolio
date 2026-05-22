import { getSiteSettings } from "@/lib/db/site-settings";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile — site settings" };

export default async function ProfilePage() {
  const s = await getSiteSettings();
  return <ProfileForm initial={s} />;
}
