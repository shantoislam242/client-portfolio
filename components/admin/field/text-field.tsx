import { FieldError } from "./field-error";

type TextFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
  type?: "text" | "email" | "password";
};

export function TextField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  error,
  type = "text",
}: TextFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
      />
      <FieldError error={error} />
    </label>
  );
}
