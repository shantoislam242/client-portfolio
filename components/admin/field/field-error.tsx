type FieldErrorProps = { error?: string | null };

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-red-400 mt-1">
      {error}
    </p>
  );
}
