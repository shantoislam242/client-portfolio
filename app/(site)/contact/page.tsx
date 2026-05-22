import { getSiteSettings } from "@/lib/db/site-settings";
import { ContactForm } from "@/components/sections/contact-form";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = {
  title: "Contact — Arifujjaman",
};

export default async function ContactPage() {
  const s = await getSiteSettings();

  const titleWords = s.contactPageTitle.split(" ");
  const titleAccent = titleWords[titleWords.length - 1];
  const titlePrefix = titleWords.slice(0, -1).join(" ");

  return (
    <section className="pt-4 pb-16">
      <FadeIn>
        <h1 className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-text-primary">
          {titlePrefix}{" "}
          <span className="text-accent-purple">{titleAccent}</span>
        </h1>
        {s.contactPageSubtitle && (
          <p className="mt-4 font-poppins text-base text-text-secondary max-w-xl">
            {s.contactPageSubtitle}
          </p>
        )}
        {(s.contactEmail || s.contactPhone || s.contactLocationText) && (
          <div className="mt-6 space-y-1 font-poppins text-sm text-text-secondary">
            {s.contactEmail && (
              <p>
                <a
                  href={`mailto:${s.contactEmail}`}
                  className="hover:text-accent transition-colors"
                >
                  {s.contactEmail}
                </a>
              </p>
            )}
            {s.contactPhone && <p>{s.contactPhone}</p>}
            {s.contactLocationText && <p>{s.contactLocationText}</p>}
          </div>
        )}
      </FadeIn>

      <ContactForm
        nameLabel={s.contactFormNameLabel}
        emailLabel={s.contactFormEmailLabel}
        messageLabel={s.contactFormMessageLabel}
        submitLabel={s.contactFormSubmitLabel}
        successMessage={s.contactSuccessMessage}
      />
    </section>
  );
}
