import { FieldError } from "./field-error";

type UrlFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
};

export function UrlField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  error,
}: UrlFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <input
        name={name}
        type="url"
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder ?? "https://"}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      <FieldError error={error} />
    </label>
  );
}
