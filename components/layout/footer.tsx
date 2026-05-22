import { getSiteSettings } from "@/lib/db/site-settings";

export async function Footer() {
  const s = await getSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 py-8 text-center">
      <p className="font-poppins text-xs text-text-muted">
        {s.footerText}
        {s.footerShowYear && ` · ${year}`}
        {s.footerCopyright && ` · ${s.footerCopyright}`}
      </p>
    </footer>
  );
}
