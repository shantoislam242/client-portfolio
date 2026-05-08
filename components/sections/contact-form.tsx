"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { contactPage } from "@/lib/data";
import { FadeIn } from "@/components/motion/fade-in";
import { toast } from "sonner";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent! (demo)");
      (e.target as HTMLFormElement).reset();
      setSubmitting(false);
    }, 400);
  }

  return (
    <section className="pt-4 pb-16">
      <FadeIn>
        <h1 className="font-outfit font-bold text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {contactPage.headingPrefix}{" "}
          <span className="text-accent">{contactPage.headingAccent}</span>
        </h1>
      </FadeIn>

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
              Name
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
              Email
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
              Message
            </label>
            <Textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              placeholder="Your Message"
              className="bg-bg-card-hover border-border-subtle resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent hover:bg-accent-hover text-white"
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </form>
      </FadeIn>
    </section>
  );
}
