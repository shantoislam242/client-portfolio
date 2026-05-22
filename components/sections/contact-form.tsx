"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";

type ContactFormProps = {
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
};

export function ContactForm({
  nameLabel,
  emailLabel,
  messageLabel,
  submitLabel,
  successMessage,
}: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <FadeIn>
        <p className="mt-10 font-poppins text-base text-text-secondary">
          {successMessage}
        </p>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.1}>
      <form
        onSubmit={onSubmit}
        className="mt-10 rounded-2xl border border-border-subtle bg-bg-card p-6 md:p-8 space-y-5"
      >
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
            className="bg-bg-card-hover border-border-subtle"
          />
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
            className="bg-bg-card-hover border-border-subtle"
          />
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
            className="bg-bg-card-hover border-border-subtle resize-none"
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-full bg-accent hover:bg-accent-hover text-white py-3 h-auto"
        >
          {submitLabel}
        </Button>
      </form>
    </FadeIn>
  );
}
