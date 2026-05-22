"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium mb-1">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple"
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent-purple px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
