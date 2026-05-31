import { getSiteSettings } from "@/lib/db/site-settings";
import { SplashClient } from "./splash-client";

export async function Splash() {
  const s = await getSiteSettings();
  return <SplashClient fullName={s.fullName} />;
}
