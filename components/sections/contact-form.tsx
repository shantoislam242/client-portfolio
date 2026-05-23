"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import {
  submitContactForm,
  type ContactFormState,
} from "@/actions/contact-form";

type ContactFormProps = {
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
};

const initialState: ContactFormState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent hover:bg-accent-hover text-white py-3 h-auto"
    >
      {pending ? "Sending..." : label}
    </Button>
  );
}

export function ContactForm({
  nameLabel,
  emailLabel,
  messageLabel,
  submitLabel,
  successMessage,
}: ContactFormProps) {
  const [state, formAction] = useActionState(submitContactForm, initialState);

  if (state.ok) {
    return (
      <FadeIn>
        <p className="mt-10 font-poppins text-base text-text-secondary">
          {state.message ?? successMessage}
        </p>
      </FadeIn>
    );
  }

  const topError = state.message && !state.ok ? state.message : null;
  const fe = state.fieldErrors ?? {};

  return (
    <FadeIn delay={0.1}>
      <form
        action={formAction}
        className="mt-10 rounded-2xl border border-border-subtle bg-bg-card p-6 md:p-8 space-y-5"
      >
        {/* Honeypot — visible to bots, hidden from humans + screen readers */}
        <input
          type="text"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          className="sr-only"
          aria-hidden="true"
          defaultValue=""
        />

        {topError && (
          <p
            role="alert"
            className="font-poppins text-sm text-red-400"
          >
            {topError}
          </p>
        )}

        <div>
          <label
            htmlFor="contact-name"
            className="block font-poppins text-sm text-text-primary mb-2"
          >
            {nameLabel}
          </label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            required
            placeholder="Your Name"
            aria-invalid={Boolean(fe.name)}
            aria-describedby={fe.name ? "contact-name-error" : undefined}
            className="bg-bg-card-hover border-border-subtle"
          />
          {fe.name && (
            <p
              id="contact-name-error"
              className="mt-1 font-poppins text-xs text-red-400"
            >
              {fe.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block font-poppins text-sm text-text-primary mb-2"
          >
            {emailLabel}
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="Your@email.com"
            aria-invalid={Boolean(fe.email)}
            aria-describedby={fe.email ? "contact-email-error" : undefined}
            className="bg-bg-card-hover border-border-subtle"
          />
          {fe.email && (
            <p
              id="contact-email-error"
              className="mt-1 font-poppins text-xs text-red-400"
            >
              {fe.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block font-poppins text-sm text-text-primary mb-2"
          >
            {messageLabel}
          </label>
          <Textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            placeholder="Your Message"
            aria-invalid={Boolean(fe.message)}
            aria-describedby={fe.message ? "contact-message-error" : undefined}
            className="bg-bg-card-hover border-border-subtle resize-none"
          />
          {fe.message && (
            <p
              id="contact-message-error"
              className="mt-1 font-poppins text-xs text-red-400"
            >
              {fe.message}
            </p>
          )}
        </div>

        <SubmitButton label={submitLabel} />
      </form>
    </FadeIn>
  );
}
