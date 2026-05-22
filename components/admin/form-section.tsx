import Link from "next/link";

type FormSectionProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  topLevelError?: string | null;
  submitLabel?: string;
  children: React.ReactNode;
};

export function FormSection({
  title,
  subtitle,
  backHref,
  topLevelError,
  submitLabel = "Save",
  children,
}: FormSectionProps) {
  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        {backHref && (
          <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        )}
        <h1 className="text-2xl font-semibold mt-2">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </header>

      {topLevelError && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-200">
          {topLevelError}
        </div>
      )}

      <div className="space-y-4">{children}</div>

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" className="rounded-full bg-accent-purple px-5 py-2 text-sm font-medium hover:opacity-90">
          {submitLabel}
        </button>
        {backHref && (
          <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
        )}
      </div>
    </div>
  );
}
