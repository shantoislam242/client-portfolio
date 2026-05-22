import { FieldError } from "./field-error";

type BooleanFieldProps = {
  name: string;
  label: string;
  defaultValue?: boolean;
  error?: string | null;
};

export function BooleanField({
  name,
  label,
  defaultValue,
  error,
}: BooleanFieldProps) {
  return (
    <label className="flex items-center gap-2 mb-4 cursor-pointer">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultValue ?? false}
        className="h-4 w-4 rounded border-border bg-card text-accent-purple focus:ring-accent-purple"
      />
      <span className="text-sm">{label}</span>
      <FieldError error={error} />
    </label>
  );
}
