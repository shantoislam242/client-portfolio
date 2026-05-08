import { footer } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mt-24 py-8 text-center">
      <p className="font-poppins text-xs text-text-muted">{footer.text}</p>
    </footer>
  );
}
