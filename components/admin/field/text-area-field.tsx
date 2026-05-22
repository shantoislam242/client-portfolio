import { FieldError } from "./field-error";

type TextAreaFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  rows?: number;
  error?: string | null;
  help?: string;
};

export function TextAreaField({
  name,
  label,
  defaultValue,
  required,
  rows = 4,
  error,
  help,
}: TextAreaFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        rows={rows}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      {help && <p className="text-xs text-muted-foreground mt-1">{help}</p>}
      <FieldError error={error} />
    </label>
  );
}
