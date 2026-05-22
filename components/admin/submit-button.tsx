"use client";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label?: string;
  pendingLabel?: string;
};

export function SubmitButton({ label = "Save", pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent-purple px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending ? (pendingLabel ?? `${label}…`) : label}
    </button>
  );
}
