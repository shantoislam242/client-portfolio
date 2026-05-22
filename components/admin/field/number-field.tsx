import { FieldError } from "./field-error";

type NumberFieldProps = {
  name: string;
  label: string;
  defaultValue?: number | null;
  required?: boolean;
  min?: number;
  max?: number;
  error?: string | null;
};

export function NumberField({
  name,
  label,
  defaultValue,
  required,
  min,
  max,
  error,
}: NumberFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <input
        name={name}
        type="number"
        defaultValue={defaultValue ?? 0}
        required={required}
        min={min}
        max={max}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      <FieldError error={error} />
    </label>
  );
}
