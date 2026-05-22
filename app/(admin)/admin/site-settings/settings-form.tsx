"use client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { SettingsState } from "@/actions/site-settings";

type Props = {
  action: (prev: SettingsState, fd: FormData) => Promise<SettingsState>;
  title: string;
  children: (helpers: {
    err: (k: string) => string | undefined;
    topLevelError: string | null;
  }) => React.ReactNode;
};

export function SettingsForm({ action, title, children }: Props) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    action as never,
    null,
  );

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
    if (state?.error && !state.issues) toast.error(state.error);
  }, [state]);

  const issues = state?.issues as Record<string, { _errors: string[] }> | undefined;
  const err = (k: string) => issues?.[k]?._errors?.[0];
  const topLevelError = state?.error && !state?.issues ? state.error : null;

  return (
    <form action={formAction}>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <div className="max-w-2xl space-y-4">
        {children({ err, topLevelError })}
      </div>
      <div className="mt-6 max-w-2xl">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent-purple px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
